# Deploy — Vercel (front + API) + Supabase (Postgres/pgvector/Storage)

Arquitetura de produção pós-migração: **Next.js na Vercel**, front e API (Route Handlers)
no mesmo deploy — sem backend separado, sem Render, sem JVM. Banco **Postgres + pgvector**
no Supabase (o mesmo já usado antes da migração — nenhuma migração de dados é necessária,
só apontar a nova app pro mesmo banco).

> **Por que a migração**: o backend Java (Spring Boot) no Render free tier (512MB) caía
> com frequência — provável OOM da JVM somado à hibernação por inatividade. O uso real é
> de fim de semana com ~10 pessoas simultâneas, cenário ideal pra serverless: sem hibernação
> a gerenciar, sem custo ocioso, sem JVM.

## Pré-requisitos
- Repo no GitHub (Vercel puxa de lá).
- Conta Vercel + acesso ao projeto Supabase existente (mesma instância de antes).
- Uma `GROQ_API_KEY` ou `GEMINI_API_KEY` (geração real) e, opcionalmente, `JINA_API_KEY`
  (embeddings semânticos — o padrão sem essa key é o embedding local determinístico, que é
  o que já estava em uso em produção antes da migração — ver nota de paridade abaixo).

---

## 0. Banco (já existe — Supabase, sem mudanças de schema)

Nenhuma migration nova roda contra produção: o schema Drizzle (`frontend/src/server/db/schema.ts`)
espelha exatamente o schema já existente (criado pelas migrations Flyway do backend Java).
Só é preciso apontar `DATABASE_URL` pro mesmo banco:

| Env | Valor |
|---|---|
| `DATABASE_URL` | `postgres://postgres.<project-ref>:<senha>@aws-0-<regiao>.pooler.supabase.com:5432/postgres?sslmode=require` |

Use o **Session pooler** (porta 5432), não o Transaction pooler (6543) — mesma orientação de
antes.

---

## 1. App na Vercel (front + API)

1. Vercel → **New Project** → importe o repo, **Root Directory = `frontend`**.
2. Framework: Next.js (auto). Build padrão.
3. Env vars do projeto (ver `frontend/.env.example` para a lista completa):

   | Env | Valor |
   |---|---|
   | `DATABASE_URL` | do Supabase (passo 0) |
   | `JWT_SECRET` | **o mesmo valor já usado no Render antes da migração** — mantém os tokens já emitidos válidos, sem deslogar ninguém |
   | `REGISTRATION_ENABLED` | `false` (cadastro fechado, como antes) |
   | `AI_PROVIDER` | `groq` ou `gemini` |
   | `GROQ_API_KEY` / `GEMINI_API_KEY` | conforme o provider escolhido |
   | `EMBEDDINGS_PROVIDER` | ver nota de paridade abaixo antes de decidir |
   | `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `SUPABASE_BUCKET` | os mesmos já usados antes |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | só necessários se for rodar `npm run db:bootstrap-admin` (o admin já existe no banco atual, então normalmente não precisa) |

4. Deploy.

### Nota de paridade — `EMBEDDINGS_PROVIDER`
Os PDFs já indexados em produção têm seus vetores calculados por um dos dois algoritmos do
backend Java: `hashing` (local, determinístico — o padrão) ou `jina` (semântico), dependendo
do que estava configurado no Render. **Confirme qual era antes de decidir o valor aqui** — se
não tiver certeza, deixe sem setar (usa `hashing`, o default) e valide a busca de RAG contra
conteúdo já indexado no smoke test do passo 3; se as respostas da IA não estiverem "grounded"
como esperado, o provider provavelmente era `jina` em produção.

---

## 2. Cutover (a partir de uma API Java ainda no ar no Render)

Como o banco já tem dado real (usuários, campanhas, fichas, PDFs indexados), o cutover é
feito em etapas, sem downtime nem perda de dado:

1. Suba a nova app na Vercel como **Preview** (ou um projeto separado) apontando pro
   **mesmo Supabase de produção** — a API Java no Render continua servindo o tráfego real
   nesse meio tempo; os dois só compartilham o banco, sem conflito.
2. Smoke test na Preview: login com usuário real existente, abrir uma campanha existente,
   perguntar à IA algo com base num PDF já indexado (valida a paridade dos embeddings —
   ver nota acima), criar/editar uma ficha.
3. Promova a Preview pra produção (troca o domínio/deploy principal na Vercel).
4. Confirme produção funcionando (mesmo roteiro do passo 2).
5. Só então: desative o serviço `portal-rpg-api` no Render, remova `render.yaml` e
   `.github/workflows/keep-warm.yml` (existia só pra manter o Render acordado).

## 3. Smoke test (passo a passo)
1. Abra o site da Vercel → **Entrar** com um usuário admin existente.
2. **Admin**: confirme que os sistemas/documentos já indexados aparecem; opcionalmente suba
   um `.txt` de teste e confirme status `INDEXED`.
3. Abra uma campanha existente, veja a ficha de um personagem, pergunte à IA algo coberto
   pelo material já indexado e confirme `grounded: true` na resposta.

## Notas / limitações conhecidas
- **Upload direto pro servidor** (`POST /api/systems/{id}/documents`, multipart): sem
  Storage configurado, o documento é indexado direto dos bytes em memória (sem persistir o
  arquivo bruto) — funciona, mas reindexar exige reenviar o arquivo. Com Supabase Storage
  configurado, o arquivo é persistido lá. Para PDFs grandes, prefira o fluxo de signed URL
  (`upload-url` + `documents/storage`), que evita o limite de tamanho de body do Route
  Handler.
- **Indexação assíncrona** (fluxo de Storage): roda via `after()` do Next.js dentro do
  tempo de `maxDuration` da rota — suficiente pro volume esperado (uso de fim de semana,
  poucos documentos). Falha marca o documento como `FAILED`.
- **PDF**: extração via `pdf-parse` (texto real, não OCR — igual ao PDFBox usado antes).
