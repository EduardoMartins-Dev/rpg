# Portal de RPG

Portal web para mestres e jogadores de RPG de mesa: campanhas, fichas dinâmicas e uma
**IA contextualizada por sistema (RAG)** que responde com base no material daquele sistema.

Documentação: `portal-rpg-arquitetura.md` (arquitetura) · `prompt.md` (spec + matriz E2E) ·
`E2E-REPORT.md` (status dos cenários) · `DEPLOY.md` (produção).

## Stack
- **Front:** Next.js (React + TS) — `frontend/`
- **Back:** Java 21 + Spring Boot 3.5 — `backend/`
- **Banco:** PostgreSQL + `pgvector`
- **Migrações:** Flyway
- **IA/RAG:** pipeline próprio (embedding local + busca vetorial em `pgvector`); geração
  mockada nos testes e LLM real (Groq, compatível com OpenAI) em produção via env var
- **Testes:** Testcontainers (`pgvector/pgvector:pg16`), REST-assured/JUnit 5, Playwright (UI E2E)

## Material de regras
Os documentos-fonte de regras (PDF/DOCX) **não** fazem parte do repositório — ficam fora do
controle de versão (`.gitignore`). Para usar a IA, o material é enviado pela própria aplicação
(o admin faz upload; a app extrai o texto, indexa em `pgvector` e responde escopado por sistema).
As fixtures de teste usam textos curtos próprios — nenhum conteúdo externo é versionado.

## Pré-requisitos
Ambiente sem Docker/JDK completo é contornado por scripts: Podman (rootless) para containers e
um JDK 21 local. Carregue antes de mexer no backend:
```bash
source scripts/env.sh
```

## Rodar localmente

### Banco (dev)
```bash
podman-compose up -d        # sobe pgvector/pgvector:pg16 em localhost:5432
# sem compose? fallback em podman puro:
scripts/db.sh up            # (down|logs)
```

### Backend
```bash
source scripts/env.sh
cd backend && ./mvnw spring-boot:run     # profile dev por padrão
# health: curl localhost:8080/actuator/health
```

### Frontend
```bash
cd frontend && npm run dev               # http://localhost:3000
```

## Testes
```bash
source scripts/env.sh
cd backend && ./mvnw test                # sobe pgvector efêmero via Testcontainers
```
A suíte **não** usa banco externo nem LLM real — o `pgvector` é efêmero e a geração é mockada
(só o retrieval é validado de verdade).

E2E de UI (sobe banco + backend + frontend + Playwright):
```bash
scripts/e2e.sh                           # 1ª vez: cd frontend && npx playwright install chromium
```

## Ambientes
Config 100% por variáveis de ambiente: `backend/src/main/resources/application-{dev,staging,prod}.yml`,
ativadas por `SPRING_PROFILES_ACTIVE`. Secrets (`DB_*`, `JWT_SECRET`, `GROQ_API_KEY`, …) nunca
são commitados. Em banco gerenciado, garanta `CREATE EXTENSION vector;`. Passo a passo de produção
(Render + Supabase + Vercel) em **`DEPLOY.md`**.

## Fases
`F0` scaffolding · `F1` auth · `F2` sistemas · `F3` campanhas+authz · `F4` ficha+motor de regras ·
`F5` RAG · `F6` front. Cada fase fecha com seus cenários E2E verdes (ver `prompt.md` §10).
