# Deploy — API no Render, Front na Vercel

Arquitetura de produção: **Next.js (Vercel)** → reescreve `/api/*` para o **Spring Boot (Render)**
→ **Postgres + pgvector (Supabase)**. Geração de IA real via **Groq** (compatível com OpenAI).
O frontend fala same-origin com a API (proxy do Next) — **sem CORS**.

## Pré-requisitos
- Repo no GitHub (Render e Vercel puxam de lá).
- Contas Render + Vercel + Supabase.
- Uma `GROQ_API_KEY` (console.groq.com — free tier).

---

## 0. Banco no Supabase

1. Crie o projeto no Supabase e anote a senha do banco.
2. **Habilite a extensão `vector`**: Dashboard > Database > Extensions > ative `vector`
   (a migração V1 faz `CREATE EXTENSION IF NOT EXISTS vector`/`pgcrypto`).
3. Pegue a connection string do **Session pooler** (Dashboard > Connect):
   - ⚠️ Use o **Session pooler** (porta **5432**), NÃO a conexão direta (virou IPv6-only e o
     Render não alcança) nem o Transaction pooler (6543, quebra Flyway/Hibernate).
   - Host: `aws-0-<regiao>.pooler.supabase.com` · User: `postgres.<project-ref>` · DB: `postgres`.
4. Monte os valores p/ o Render (passo 1):
   | Env | Valor |
   |---|---|
   | `DB_URL` | `jdbc:postgresql://aws-0-<regiao>.pooler.supabase.com:5432/postgres?sslmode=require` |
   | `DB_USER` | `postgres.<project-ref>` |
   | `DB_PASSWORD` | senha do banco |

> `sslmode=require` é obrigatório no Supabase. Free tier **pausa** o projeto após ~1 semana
> sem uso (basta reativar no dashboard).

---

## 1. API no Render (via Blueprint)

1. Render → **New > Blueprint** → aponte para este repo. Ele lê `render.yaml` e cria o web
   service Docker `portal-rpg-api` (`backend/Dockerfile`).
2. Preencha os **secrets** marcados `sync:false` no painel do serviço:
   | Env | Valor |
   |---|---|
   | `DB_URL` / `DB_USER` / `DB_PASSWORD` | do Supabase (passo 0) |
   | `JWT_SECRET` | gere com `openssl rand -base64 48` (HS384 exige ≥48 bytes) |
   | `GROQ_API_KEY` | sua chave da Groq |
   | `ADMIN_EMAIL` | e-mail do admin inicial |
   | `ADMIN_PASSWORD` | senha do admin inicial (≥8) |
3. Deploy. No boot: Flyway migra o schema no Supabase, `ProdSeeder` cria o admin (idempotente).
4. Health: `https://<api>.onrender.com/actuator/health` → `{"status":"UP"}`.
5. Confirme o login: `POST /api/auth/login` com o admin definido.

> Free tier do Render: o serviço **hiberna** após inatividade (cold start ~30–60s).

### Sem Blueprint (manual)
- API: New > Web Service > Docker, `dockerfilePath=backend/Dockerfile`, `dockerContext=backend`,
  health check `/actuator/health`. Env vars: `SPRING_PROFILES_ACTIVE=prod`, `DB_URL`/`DB_USER`/
  `DB_PASSWORD` (Supabase, passo 0), `JWT_SECRET`, `AI_PROVIDER=groq`, `GROQ_API_KEY`,
  `GROQ_MODEL=llama-3.3-70b-versatile`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

---

## 2. Front na Vercel

1. Vercel → **New Project** → importe o repo, **Root Directory = `frontend`**.
2. Framework: Next.js (auto). Build padrão.
3. Env var do projeto:
   | Env | Valor |
   |---|---|
   | `BACKEND_URL` | URL pública da API no Render (ex.: `https://portal-rpg-api.onrender.com`) |
4. Deploy. O `next.config.ts` reescreve `/api/*` → `BACKEND_URL`.

---

## 3. Smoke test em produção
1. Abra o site da Vercel → **Entrar** com `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
2. **Admin**: crie um sistema, salve o sheet-schema, suba um `.txt`/`.pdf` (indexa).
3. Crie campanha (Mestre), gere convite, entre como player, monte a ficha, pergunte à IA.

## Notas / limitações conhecidas (piloto)
- **IA**: `AI_PROVIDER=groq` usa LLM real na geração; o **retrieval** usa embedding local
  determinístico (sem custo/chave de embeddings). Para `echo` (mock) é só não setar `groq`.
- **Upload efêmero**: o filesystem do Render é volátil — o arquivo bruto some no redeploy.
  Os **chunks ficam no pgvector** (retrieval sobrevive), mas reindexar exige reenviar o arquivo.
  Para persistir o bruto: usar **Supabase Storage** (ou S3/R2) — ponto de extensão; como o banco
  já é Supabase, o Storage é a opção natural depois.
- **PDF**: extração real exige PDFBox (hoje texto). Ponto de extensão em `DocumentTextExtractor`.
- **CI**: adicionar deploy automático (Render auto-deploy on push já cobre a API; Vercel idem).
