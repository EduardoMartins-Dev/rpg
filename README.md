# Portal de RPG

Portal web para mestres e jogadores de RPG de mesa: campanhas, fichas dinâmicas e uma
**IA contextualizada por sistema (RAG)** que responde com base no material daquele sistema.

Documentação: `portal-rpg-arquitetura.md` (arquitetura) · `prompt.md` (spec + matriz E2E) ·
`E2E-REPORT.md` (status dos cenários) · `DEPLOY.md` (produção).

> **Migração em andamento**: o backend original era Java/Spring Boot (`backend/`), hoje
> substituído por Route Handlers dentro do próprio Next.js (`frontend/src/app/api/**`).
> `backend/` fica no repositório só como referência histórica até o cutover de produção
> ser concluído (ver `DEPLOY.md`) — não use para desenvolvimento novo.

## Stack
- **Front + API:** Next.js (React + TS), Route Handlers como backend — `frontend/`
- **Banco:** PostgreSQL + `pgvector`, acessado via **Drizzle ORM**
- **IA/RAG:** pipeline próprio (embedding local determinístico ou Jina + busca vetorial em
  `pgvector`); geração mockada nos testes (`AI_PROVIDER=echo`) e LLM real (Groq ou Gemini)
  em produção via env var
- **Storage:** Supabase Storage para os PDFs enviados (upload direto via signed URL, ou
  indexado a partir dos bytes em memória quando Storage não está configurado — sem disco
  local, já que o deploy é serverless)
- **Testes:** Vitest (unit/integração), Playwright (UI E2E)

## Material de regras
Os documentos-fonte de regras (PDF/DOCX) **não** fazem parte do repositório — ficam fora do
controle de versão (`.gitignore`). Para usar a IA, o material é enviado pela própria aplicação
(o admin faz upload; a app extrai o texto, indexa em `pgvector` e responde escopado por sistema).
As fixtures de teste usam textos curtos próprios — nenhum conteúdo externo é versionado.

## Pré-requisitos
- Node.js 22+ (LTS)
- Docker (ou Podman) para o Postgres/pgvector local

## Rodar localmente

### Banco (dev)
```bash
docker compose up -d      # sobe pgvector/pgvector:pg16 em localhost:5432
```
Na primeira vez, crie as extensões e o schema:
```bash
docker exec portalrpg-db psql -U portalrpg -d portalrpg \
  -c "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pgcrypto;"
cd frontend
npm run db:migrate                     # aplica o schema (drizzle-kit)
docker exec -i portalrpg-db psql -U portalrpg -d portalrpg < drizzle/0001_ivfflat_index.sql
npm run db:seed                        # 5 contas fixas (admin@test / Sup3rSenha!, etc.)
```

### App (front + API no mesmo processo)
```bash
cd frontend
cp .env.example .env.local             # ajuste se necessário
npm install
npm run dev                            # http://localhost:3000
```

## Testes
```bash
cd frontend
npm test                               # Vitest (unit — inclui paridade do embedding com o Java antigo)
npm run test:e2e                       # Playwright (banco local rodando + seed aplicado)
```

## Ambientes
Config 100% por variáveis de ambiente — ver `frontend/.env.example` para a lista completa
(`DATABASE_URL`, `JWT_SECRET`, `AI_PROVIDER`, `EMBEDDINGS_PROVIDER`, `SUPABASE_*`, etc.).
Secrets nunca são commitados. Em banco gerenciado, garanta `CREATE EXTENSION vector;`.
Passo a passo de produção em **`DEPLOY.md`**.
