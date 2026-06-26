# PROGRESS — Portal de RPG (handoff para retomar após /clear)

> Lido por humano + agente para continuar de onde paramos. Atualizar ao fechar cada fase.
> Fontes: `prompt.md` (spec+matriz E2E §10), `portal-rpg-arquitetura.md` (arquitetura), `E2E-REPORT.md` (status).

## Onde estamos
- **F0** ✅ · **F1** ✅ · **F2** ✅ · **F3** ✅ · **F4** ✅ · **F5 RAG** ✅ · **F6 Front+Playwright** ✅
- **TODAS as fases fechadas.** 100% dos cenários §10 verdes (back + UI).
- Backend: **44/44 verdes** (Auth 4, System 3, Campaign 8, Character 6, V5Engine 11, V5Catalog 5, Rag 6, AppTests 1).
- Front: **3/3 Playwright** (auth ×2 + jornada completa) contra back+front reais (`scripts/e2e.sh`).
- Pendências restantes: nenhuma de escopo §10. Itens "nice-to-have" abaixo (não bloqueiam DoD).
- Decisões do usuário: arquitetura fornecida; escopo = F0→F6 fase a fase com checkpoint; DB dev = podman pgvector
  agora, URL de homologação (Postgres gerenciado) entra depois no profile `staging`; testes sempre Testcontainers.

## ⚠️ Quirks DESTA máquina (críticos — sem isso nada compila/testa)
- **Sem Docker** → Testcontainers usa **Podman rootless**. Socket já habilitado:
  `systemctl --user start podman.socket` → `/run/user/1000/podman/podman.sock`.
- **`java` do sistema é só JRE (sem `javac`)** → JDK 21 Temurin baixado em `/home/barbosa/jdks/jdk-21.0.11+10`.
- **Sem maven/gradle** → usa wrapper `backend/mvnw`.
- **Sem `podman compose`/`docker-compose`** → instalado `podman-compose` (pip, em `~/.local/bin`) + fallback `scripts/db.sh`.

### Carregar ambiente (SEMPRE antes de mexer no backend)
```bash
source scripts/env.sh   # seta JAVA_HOME=jdk-21, DOCKER_HOST=podman socket, TESTCONTAINERS_RYUK_DISABLED=true
```
Ou inline:
```bash
export JAVA_HOME=/home/barbosa/jdks/jdk-21.0.11+10; export PATH="$JAVA_HOME/bin:$PATH"
export DOCKER_HOST="unix:///run/user/1000/podman/podman.sock"; export TESTCONTAINERS_RYUK_DISABLED=true
```

### Comandos chave
```bash
# rodar suíte (sobe pgvector efêmero via podman)
cd backend && ./mvnw -B test
# resumo por classe:
cat backend/target/surefire-reports/*.txt | grep -E "Tests run.*in com"

# DB dev local (porta 5432)
podman-compose up -d        # ou: scripts/db.sh up
# boot backend dev: cd backend && SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run  (perfil dev = seed §8 via DevSeeder)
# front: cd frontend && npm run dev (ou npm run build)
# UI E2E ponta a ponta (sobe db+backend+front+playwright): scripts/e2e.sh
#   (1ª vez: cd frontend && npx playwright install chromium)
```

## Stack fixada
- Backend: Spring Boot **3.5.16**, Java release **21** (roda no JDK 21). Maven wrapper.
- Front: Next.js 16 + TS + App Router + src-dir (`frontend/`).
- DB: pgvector/pgvector:pg16. Flyway. JSONB via hypersistence `JsonType`.
- JWT: jjwt 0.12.6 (HS256). Testcontainers 1.20.4. REST-assured 5.5.
- Spring AI: **NÃO usado** (decisão F5). RAG com abstrações próprias + embedding local determinístico
  + pgvector via JDBC. Provedor LLM real entra por profile depois (ver seção F5). Sem segredos em CI.

## Estrutura atual
```
backend/src/main/java/com/portalrpg/
  BackendApplication.java        (@ConfigurationPropertiesScan)
  config/SecurityConfig.java     stateless, JWT filter, /auth+/ping+health públicos, resto auth
  common/                        PingController, ApiException, GlobalExceptionHandler(+AccessDenied→403)
  security/                      JwtProperties, JwtService, JwtAuthenticationFilter, AppPrincipal(userId,admin)
  user/                          User(entity), UserRepository, MeController(/api/me)
  auth/                          AuthService, AuthController(/register,/login,/refresh), dto/AuthDtos
  system/                        RpgSystem, SystemSheetSchema(jsonb), SystemDocument(+repos),
                                 SystemService, SystemController, dto/SystemDtos
  campaign/  (F3)                Campaign, CampaignMember(+enum CampaignRole), repos, CampaignService,
                                 CampaignController, CampaignAccess(@campaignAccess guard), dto/CampaignDtos
  rules/  (F4)                   V5Engine (motor puro §5/§9), V5Catalog (clãs/habilidades/PdS §13)
  character/  (F4)               Character(sheet_data jsonb), repo, V5SheetProcessor, CharacterService,
                                 CharacterController, dto/CharacterDtos
  rag/  (F5)                     EmbeddingModel + HashingEmbeddingModel(1536-d local), ChatModel +
                                 EchoChatModel(mock), DocumentTextExtractor, DocumentChunkStore(JDBC+pgvector),
                                 RagIndexingService, RagQueryService, RagController(/ai/ask,/disciplines/{power})
  (SystemService agora dispara indexação no upload via RagIndexingService)
  resources/db/migration/V1__init.sql   TODAS as tabelas §2 + pgvector + ivfflat (schema completo já existe)
  resources/application{,-dev,-staging,-prod}.yml
backend/src/test/java/com/portalrpg/
  AbstractIntegrationTest.java   SINGLETON pgvector container (start no static block!)
  support/E2ETestBase.java       reset TRUNCATE CASCADE + seed 5 usuários + helpers RestAssured(asUser/tokenFor)
  support/SeedData.java          PASSWORD="Sup3rSenha!"; ADMIN/MESTRE/PLAYER1/PLAYER2/INTRUSO "@test"
  auth/AuthE2ETest.java          AUTH-01..04
  system/SystemE2ETest.java      ADMIN-01..02 + upload
  campaign/CampaignE2ETest.java  CAMP-01/02, PLAYER-01/02, AUTHZ-02/03/04 + remove member (F3)
  rules/V5EngineTest.java        SHEET-01,03,04,05,06,07,08,09,10,11,14 (motor puro, sem Spring) (F4)
  rules/V5CatalogTest.java       SHEET-12,15,16,17 (catálogos, sem Spring) (F4)
  character/CharacterE2ETest.java PLAYER-03, SHEET-01/02/12/15/18, AUTHZ-01 (F4)
  rag/RagE2ETest.java            ADMIN-03, RAG-01..05, SHEET-13 (F5)
```

## Modelo de autorização (núcleo — não esquecer)
- JWT carrega só `sub`(user_id) + `is_admin` + `type`. **NUNCA** papel de campanha no token.
- Papel MASTER/PLAYER resolve por requisição via `campaign_members(campaign_id,user_id,role)`.
- Mesmo user pode ser MASTER numa campanha e PLAYER em outra (AUTHZ-03, obrigatório).

## Convenções já estabelecidas
- Erros via `ApiException.{notFound,conflict,unauthorized,forbidden,badRequest}` → `GlobalExceptionHandler`.
- Method-security `@PreAuthorize` denial → 403 (advice trata `AccessDeniedException`). **Reusar na F3.**
- Entities: UUID `@GeneratedValue(UUID)`, `created_at` com `insertable=false` + `@CreationTimestamp`.
- Seed determinístico + idempotente (suíte 2x = mesmo resultado, critério DoD).
- Tabelas já existem na V1 (campaigns, campaign_members, characters, document_chunks) — só faltam entities+lógica.

## F3 — Campanhas + Authz ✅ (FEITO — referência do que existe)
Pacote `campaign/`: `Campaign`, `CampaignMember`(+enum `CampaignRole`), repos, `CampaignService`,
`CampaignController`, `dto/CampaignDtos`, guard `CampaignAccess` (`@Component("campaignAccess")`,
métodos `isMember`/`hasRole` — lookup em `campaign_members`, pega userId do `AppPrincipal` via
`SecurityContextHolder`). Endpoints conforme arquitetura §6. invite_code = 8 chars (alfabeto sem
ambíguos), UK, regenerável por MASTER. Decisões tomadas:
- systemId ausente → 400 bean-validation; systemId inexistente → 400 `badRequest("system not found")`
  (tratado como validação, casa com "erro de validação" do CAMP-02).
- convite inválido → 404; join quando já membro → 409.
- `removeMember`: MASTER remove PLAYER; remover o MASTER → 400 (não órfã a campanha).
- delete campanha confia no `ON DELETE CASCADE` (members + characters).
- AUTHZ-01 NÃO coberto ainda (precisa de `characters` da F4).

### (histórico) plano original da F3
Implementar:
1. Entities/repos: `Campaign`(name,description,system_id,master_id,invite_code UK), `CampaignMember`(campaign_id,user_id,role).
2. `Character` entity virá na F4 (mas tabela já existe).
3. Endpoints:
   - `POST /api/campaigns` {name, systemId, description} → valida systemId existe (senão erro CAMP-02);
     cria campanha + insere CampaignMember(MASTER) **na mesma transação**; gera invite_code; criador=master.
   - `GET /api/campaigns` → campanhas do usuário (onde é membro).
   - `GET/PUT/DELETE /api/campaigns/{id}` (PUT/DELETE = MASTER).
   - `POST /api/campaigns/{id}/invite` (MASTER) → (re)gera/retorna invite_code.
   - `POST /api/campaigns/join` {invite_code} → cria CampaignMember(PLAYER); inválido→erro (PLAYER-02).
   - `GET /api/campaigns/{id}/members`; `DELETE /api/campaigns/{id}/members/{userId}` (MASTER).
4. **Guard `@campaignAccess`**: bean `campaignAccess.hasRole(#campaignId,'MASTER')` que faz lookup em
   campaign_members. Usar em `@PreAuthorize`. Garantir 403 p/ não-membro (já temos o handler).
5. Tests E2E (matriz §10):
   - CAMP-01 mestre cria campanha V5 → vira MASTER mesma transação, recebe invite_code.
   - CAMP-02 systemId inválido → erro de validação.
   - PLAYER-01 join via invite_code → vira PLAYER. PLAYER-02 convite inválido → erro.
   - AUTHZ-01 MASTER lista todas fichas / PLAYER só a sua (fichas são F4 — pode ser stub agora ou adiar a parte de fichas).
     > Nota: AUTHZ-01 mexe em characters (F4). Decidir: cobrir o esqueleto de members/acesso na F3 e a
       listagem-de-fichas-por-papel fecha junto da F4. Authz de campanha (membro/não-membro/papel) testa já na F3.
   - AUTHZ-02 não-membro em /campaigns/{id}/... → 403.
   - AUTHZ-03 player2 PLAYER em A e MASTER em B → acesso resolve por campanha (OBRIGATÓRIO).
   - AUTHZ-04 isolamento tenant: PLAYER de A não enxerga B.
6. `E2ETestBase` já dá TRUNCATE CASCADE — seed de campanhas faz dentro de cada teste.

## F4 — Ficha + motor V5 ✅ (FEITO — referência)
Pacotes novos: `rules/` (motor puro) + `character/` (persistência).
- `rules/V5Engine` — funções PURAS, recebem faces dos dados ⇒ determinístico (sem RNG nos asserts):
  derivados (`vitality`/`willpower`), `pool`+`evaluate`+`willpowerReroll` (rolagem), `rouse`,
  dano (`HealthTrack`, superficial ÷2 cima / agravado), `xpCost`/`xpCostRaise`, `isValidAttributeSpread`,
  `compulsionTriggered` (errata: bestial OU crítico sangrento).
- `rules/V5Catalog` — `Clan` enum + `clan(...)` (núcleo+Companion, disciplinas/maldição/compulsão),
  27 habilidades em 3 categorias, tabela Potência de Sangue 0–6 (errata §13.6), `CharacterType`.
- `character/` — `Character`(sheet_data jsonb), `V5SheetProcessor` (valida faixas 1–5 contra os
  campos DECLARADOS no sheet-schema, recalcula derivados, auto-popula clã, regras Mortal/Carniçal),
  `CharacterService` (AUTHZ-01), `CharacterController` (`@PreAuthorize @campaignAccess.isMember(#id)`
  no nível da classe; refinamento dono-vs-MASTER no service).
- Convenção da ficha V5 no jsonb: `{type, clan, attributes:{vigor,autocontrole,determinacao,...},
  skills:{...}, hunger, humanity}`; servidor sobrescreve `derived{vitality,willpower}`,
  `clanDisciplines`, `bane`, `compulsion`. Estrutura vem do schema; regras numéricas do `V5Engine`.
- **SHEET-13 NÃO feito** — precisa do texto do poder vindo do PDF indexado (F5).
- Decisão de design: "sem hardcode por sistema" (DoD) = storage jsonb + form do front dirigidos pelo
  schema. O MOTOR é V5-específico de propósito (prompt §5) e só atua nos campos que reconhece.

## F5 — RAG ✅ (FEITO — referência + decisões)
Pacote `rag/`. Pipeline: upload(admin) → extrai texto → chunk (parágrafos) → embed → document_chunks
(JDBC, com system_id) → INDEXED. Query: embed pergunta → KNN pgvector `<=>` **filtrado por system_id**
da campanha → `ChatModel`. Decisões-chave:
- **NÃO usei Spring AI.** Abstrações próprias `EmbeddingModel`/`ChatModel` p/ (a) evitar incompat
  Spring AI × Boot 3.5.16 e (b) CI hermético sem chave de API. Provedor real (Groq/OpenAI) pluga
  por trás de um profile depois, sem mudar o pipeline.
- **Embedding local determinístico** (`HashingEmbeddingModel`): TF com hashing trick, dim 1536 (=coluna),
  acento removido + caixa baixa, L2-normalizado. Dá retrieval lexical REAL contra pgvector e é
  idempotente. Casamento de termos (pergunta×chunk) basta p/ as fixtures.
- **Geração mockada** (`EchoChatModel`): ecoa system_id + conteúdo dos chunks. Nenhum LLM real (§0.3).
- `DocumentChunkStore` usa **JdbcTemplate** (não JPA) p/ pgvector — vetor como literal `[..]::vector`.
  `SET LOCAL ivfflat.probes=100` na busca → KNN exato em corpus pequeno (lists=100/probes=1 erra).
- **PDF**: extração real via PDFBox é ponto de extensão em `DocumentTextExtractor`; tests/fixtures
  usam `.txt` (pipeline idêntico, CI sem binários). Trocar p/ PDFBox em prod é só plugar.
- BUG corrigido: upload faz `documents.saveAndFlush(doc)` ANTES de indexar — sem o flush, o INSERT
  JDBC dos chunks viola a FK `document_chunks_document_id_fkey` (INSERT do JPA é diferido).
- SHEET-13: `GET /api/campaigns/{id}/disciplines/{power}` → texto integral do poder vindo do índice.

## F6 — Front Next.js + Playwright ✅ (FEITO — referência)
`frontend/` (Next.js 16, App Router, client components — `useParams`/localStorage p/ evitar
async-params/SSR). Estrutura:
```
src/lib/api.ts            fetch wrapper /api (Bearer do localStorage) + tipos dos DTOs + uploadFile
src/lib/auth.tsx          AuthProvider (login/register/logout, carrega /api/me)
src/lib/guard.ts          useRequireUser(adminOnly) — redireciona se não-auth/não-admin
src/components/Nav.tsx     nav role-aware (link Admin só p/ is_admin)
src/components/DynamicSheet.tsx  form da ficha 100% derivado do sheet-schema (attributes[]/skills[])
src/app/{login,register,admin,campaigns,campaigns/[id],campaigns/[id]/characters/[charId]}/page.tsx
next.config.ts            rewrite /api/* -> BACKEND_URL (default :8080), sem CORS
playwright.config.ts      webServer sobe o front; baseURL :3000
e2e/{helpers,auth.spec,journey.spec}.ts
```
Decisões: same-origin via rewrite (sem CORS); JWT em localStorage (piloto); seletores `data-testid`
estáveis; backend roda no perfil `dev` (`config/DevSeeder`, @Profile("dev"), seed §8 idempotente —
NÃO roda em test). Removido `next/font/google` do scaffold (evita fetch de fonte no build).
`scripts/e2e.sh` orquestra db→backend→playwright e derruba tudo no fim.

## Deploy prod (Render API + Vercel front) — artefatos prontos
Ver `DEPLOY.md`. Resumo: API Docker no Render + Postgres pgvector no **Supabase** (Session pooler,
porta 5432, `sslmode=require`); front na Vercel (rewrite /api, sem CORS). Config 100% env-driven. Adicionados:
- `rag/GroqChatModel` — LLM real (compatível OpenAI), `@ConditionalOnProperty app.ai.provider=groq`.
  `EchoChatModel` virou condicional (default `echo`) → testes seguem herméticos (44/44 verdes).
- `config/ProdSeeder` (@Profile prod) — cria admin de `ADMIN_EMAIL`/`ADMIN_PASSWORD`, idempotente.
- `backend/Dockerfile` (+`.dockerignore`), `render.yaml` (blueprint API+DB), `frontend/.env.example`.
- `application.yml` ganhou `app.ai.*`; `application-prod.yml` monta DB_URL das partes do Render + bootstrap.
- Secrets (Render): `JWT_SECRET` (`openssl rand -base64 48`, HS384≥48B), `GROQ_API_KEY`, `ADMIN_*`.
- **Pré-requisito de deploy: repo no GitHub** (sem commits ainda) — push antes de Render/Vercel puxarem.

## Nice-to-have (fora do escopo §10 / DoD — não bloqueiam)
- Extração real de PDF (PDFBox) no `DocumentTextExtractor` (hoje texto; PDF é ponto de extensão).
- Provedor LLM real (Groq/OpenAI) por trás de `ChatModel`/`EmbeddingModel` via profile prod.
- Refresh-token no front (hoje só access token; expira → relogar).
- CI: adicionar job Playwright ao `.github/workflows/ci.yml` (back já tem job Testcontainers).
- Material de regras: documentos-fonte ficam fora do repo (`.gitignore`); fixtures de teste usam textos curtos próprios.

## DoD (prompt §11) — lembrar no fim
100% cenários §10 verdes · AUTHZ-03 obrigatório · nenhum LLM real · cálculos §9 batem fixtures ·
suíte do zero em CI sem passo manual · ficha dinâmica sem hardcode · suíte 2x = mesmo resultado.

## Git
Repo inicializado mas **sem commits** (usuário não pediu commit ainda). Livros PDF/docx no `.gitignore`.
