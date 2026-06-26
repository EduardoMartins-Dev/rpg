# E2E-REPORT — Portal de RPG (piloto V5)

Matriz de cenários (prompt §10). Status por fase. Atualizado a cada fase fechada.

Legenda: ✅ verde · ⬜ pendente · 🟡 parcial

## F0 — Scaffolding (ambiente)
| Critério | Status | Tempo | Observações |
|---|---|---|---|
| Backend compila (JDK 21) | ✅ | ~ | `mvnw compile` exit 0 |
| Backend boota + Flyway V1 + `/api/ping` (Testcontainers pgvector) | ✅ | ~12.5s ctx | `BackendApplicationTests` verde; V1 migrada incl. índice ivfflat |
| Backend boota contra DB dev (podman) | ✅ | ~ | profile dev, `/api/ping`=200, `/actuator/health`=UP |
| Frontend builda (Next.js) | ✅ | ~10s | `npm run build` exit 0 |
| CI skeleton | ✅ | — | `.github/workflows/ci.yml` (jobs backend + frontend) |

### Notas de ambiente (esta máquina)
- Sem Docker → Testcontainers usa socket **Podman** rootless (`DOCKER_HOST`, Ryuk off).
- `java` do sistema é só JRE → JDK 21 (Temurin) baixado em `/home/barbosa/jdks`.
- Boot 3.5.16, Java release 21. Spring AI entra na F5.

## F1 — Auth (E2E-AUTH-01..04) — ✅ 4/4 (31.7s)
| Cenário | Status |
|---|---|
| E2E-AUTH-01 registro→login (access+refresh); refresh renova | ✅ |
| E2E-AUTH-02 JWT contém user_id+is_admin; sem papel de campanha | ✅ |
| E2E-AUTH-03 token adulterado (flip is_admin) rejeitado | ✅ |
| E2E-AUTH-04 sem Authorization → 401 | ✅ |

Entregue: `User`+`UserRepository`, `JwtService`/`JwtAuthenticationFilter`/`AppPrincipal` (claims só
`sub`+`is_admin`+`type`, HS256), `AuthController` (register/login/refresh), `/api/me`, `ApiException`+handler,
seed determinístico (`E2ETestBase`, 5 usuários §8). Senha bcrypt. Refresh recarrega `is_admin` do DB.

## F2 — Sistemas (E2E-ADMIN-01..02) — ✅ (5.0s)
| Cenário | Status |
|---|---|
| E2E-ADMIN-01 admin cria V5 + define sheet-schema | ✅ |
| E2E-ADMIN-02 não-admin cria sistema → 403 | ✅ |
| (F2) upload doc → PENDING + file_url (indexação só na F5) | ✅ |

Entregue: `RpgSystem`/`SystemSheetSchema`(jsonb)/`SystemDocument` entities + repos, `SystemService`
(CRUD, slug único→409, schema upsert, upload→disco+PENDING), `SystemController` (leitura=autenticado,
escrita=ADMIN via `@PreAuthorize`). JSONB via hypersistence `JsonType`. Reset de DB generalizado
(TRUNCATE CASCADE) no `E2ETestBase`.

## F3 — Campanhas + Authz — ✅ (20.0s, CampaignE2ETest 8 testes)
| Cenário | Status |
|---|---|
| E2E-CAMP-01 mestre cria campanha V5 → MASTER na mesma transação + invite_code | ✅ |
| E2E-CAMP-02 systemId ausente/inexistente → 400 (validação) | ✅ |
| E2E-PLAYER-01 join via invite_code → PLAYER | ✅ |
| E2E-PLAYER-02 convite inválido → 404 | ✅ |
| E2E-AUTHZ-01 MASTER lista todas fichas / PLAYER só a sua | 🟡 adiado p/ F4 (mexe em characters) |
| E2E-AUTHZ-02 não-membro em /campaigns/{id}/... → 403 | ✅ |
| E2E-AUTHZ-03 **papéis simultâneos** player2 PLAYER em A + MASTER em B (OBRIGATÓRIO) | ✅ |
| E2E-AUTHZ-04 isolamento de tenant: PLAYER de A não enxerga B | ✅ |

Entregue: pacote `campaign/` — `Campaign`/`CampaignMember` entities (+enum `CampaignRole`), repos,
`CampaignService` (create=MASTER na mesma transação, join=PLAYER, invite regen, members CRUD,
invite_code 8-char gerado+UK), `CampaignController`, `dto/CampaignDtos`, guard
`@Component("campaignAccess")` (`isMember`/`hasRole`) resolvendo papel via `campaign_members` a
cada requisição (papel **nunca** no JWT). `@PreAuthorize("@campaignAccess.hasRole(#id,'MASTER')")`
para gestão; `isMember` para leitura → 403 p/ não-membro (reusa handler AccessDenied da F2).
AUTHZ-01 (listagem de fichas por papel) fecha na F4 junto com `characters`.

## F4 — Ficha + motor V5 — ✅ (V5EngineTest 11 + V5CatalogTest 5 + CharacterE2ETest 6)
Motor = domínio puro (`rules/`, determinístico, fixtures §9); persistência da ficha = `character/`
(jsonb dinâmico dirigido pelo sheet-schema). AUTHZ-01 fechado aqui.

| Cenário | Status | Onde |
|---|---|---|
| E2E-PLAYER-03 player cria ficha conforme sheet-schema | ✅ | CharacterE2ETest |
| E2E-SHEET-01 Vitalidade/FdV recalculam ao editar atributo-base | ✅ | engine + HTTP |
| E2E-SHEET-02 atributos 1–5; rejeita 0 e 6 | ✅ | HTTP |
| E2E-SHEET-03 parada aceita qualquer Atributo+Habilidade | ✅ | V5EngineTest |
| E2E-SHEET-04 Fome 2 em parada 6 = 4 normais + 2 de Fome | ✅ | V5EngineTest |
| E2E-SHEET-05 Falha Bestial (não dispara se sucessos bastavam) | ✅ | V5EngineTest |
| E2E-SHEET-06 Crítico Sangrento (par de 10 c/ dado de Fome) | ✅ | V5EngineTest |
| E2E-SHEET-07 par de 10 = 4 sucessos | ✅ | V5EngineTest |
| E2E-SHEET-08 FdV rerrola até 3 normais; bloqueia dado de Fome | ✅ | V5EngineTest |
| E2E-SHEET-09 Rouse <6 sobe Fome, 6+ mantém | ✅ | V5EngineTest |
| E2E-SHEET-10 superficial ÷2 (cima); agravado não; trilha cheia → Debilitado | ✅ | V5EngineTest |
| E2E-SHEET-11 XP (15/10/14; saldo insuficiente) | ✅ | V5EngineTest |
| E2E-SHEET-12 clã auto-popula (Brujah/Nosferatu) | ✅ | catalog + HTTP |
| E2E-SHEET-13 disciplina exibe texto integral do poder | ✅ (fechado na F5 — ver RagE2ETest) |
| E2E-SHEET-14 point-buy rejeita fora do padrão (§9.7) | ✅ | V5EngineTest |
| E2E-SHEET-15 clãs Companion (Ravnos/Salubri/Tzimisce) auto-populam | ✅ | catalog + HTTP |
| E2E-SHEET-16 27 habilidades em 3 categorias | ✅ | V5CatalogTest |
| E2E-SHEET-17 errata: Potência de Sangue 0–6; Compulsão em Crítico | ✅ | V5CatalogTest |
| E2E-SHEET-18 fichas Mortal e Carniçal (§13.5) | ✅ | HTTP |

Entregue: `rules/V5Engine` (derivados, parada+avaliação de rolagem, FdV reroll, Rouse, dano,
XP, point-buy — funções puras recebendo as faces dos dados → determinístico) + `rules/V5Catalog`
(clãs núcleo+Companion, 27 habilidades, tabela de Potência de Sangue 0–6 com errata, tipos de
personagem). `character/` — `Character`(sheet_data jsonb), repo, `V5SheetProcessor` (valida
faixas contra o schema, recalcula derivados, auto-popula clã, regras de tipo), `CharacterService`
(AUTHZ-01: MASTER vê todas / PLAYER só a sua; acesso a 1 ficha = dono ou MASTER), `CharacterController`
(`@PreAuthorize @campaignAccess.isMember` no nível da classe). **SHEET-13 fica para a F5** porque o
texto integral do poder é carregado do PDF indexado (não hardcoded).

## F5 — RAG — ✅ (RagE2ETest 6/6, 11.4s) + SHEET-13 fechado
Geração mockada (`EchoChatModel`) — nenhum LLM real; só o retrieval contra pgvector é validado.
Embedding local determinístico (`HashingEmbeddingModel`, TF-hashing 1536-d, L2). Sem segredos em CI.

| Cenário | Status |
|---|---|
| E2E-ADMIN-03 upload dispara indexação PENDING→INDEXED; chunks com system_id | ✅ |
| E2E-RAG-01 pergunta V5 ("fórmula da Vitalidade?") → retrieval só de V5; cita Vigor+3 | ✅ |
| E2E-RAG-02 lore (Perdição do clã Ravnos) recupera do corpus | ✅ |
| E2E-RAG-03 **isolamento**: mesma pergunta em campanha d20 não retorna chunks de V5 | ✅ |
| E2E-RAG-04 sistema sem PDF → fallback claro (sem alucinar de outro corpus) | ✅ |
| E2E-RAG-05 poder do Companion (Vicissitude) recupera do corpus, system_id de V5 | ✅ |
| E2E-SHEET-13 disciplina exibe o texto integral do poder (do PDF indexado) | ✅ (era pendência da F4) |

Entregue: pacote `rag/` — abstrações próprias `EmbeddingModel`/`ChatModel` (NÃO Spring AI, p/
evitar incompat Boot 3.5 + manter CI hermético sem segredos), `HashingEmbeddingModel` (lexical,
determinístico, dim 1536 = coluna), `EchoChatModel` (mock que ecoa chunks + system_id),
`DocumentTextExtractor` (texto; PDF é ponto de extensão p/ PDFBox em prod), `DocumentChunkStore`
(JDBC + pgvector `<=>`, KNN SEMPRE filtrado por system_id, `SET LOCAL ivfflat.probes` p/ exatidão
em corpus pequeno), `RagIndexingService` (extrai→chunk→embed→pgvector→INDEXED, idempotente),
`RagQueryService` (ask escopado + fallback + `powerText` p/ SHEET-13), `RagController`
(`/ai/ask` + `/disciplines/{power}`, member-gated). Upload (F2) agora dispara indexação síncrona.

## F6 — Front (UI E2E Playwright) — ✅ (3/3 verdes, 43s, contra back+front reais)
Next.js 16 (App Router, client components) + Playwright/Chromium. Front fala same-origin `/api`
(rewrite → backend, sem CORS). Backend roda no perfil `dev` com seed §8 (`DevSeeder`).

| Cenário | Status |
|---|---|
| registro → login → logout (UI auth ponta a ponta) | ✅ |
| usuário comum não vê link de Admin (UI reflete papel) | ✅ |
| **jornada completa**: admin cria sistema + sheet-schema + upload/indexação (INDEXED) → mestre cria campanha + convite → player entra por convite → **ficha renderizada do sheet-schema** (sem hardcode) → derivados calculados no servidor (Vitalidade 6 / FdV 5) + clã auto-populado → IA escopada cita Vigor → **mestre enxerga a ficha do player (AUTHZ-01 pela UI)** | ✅ |

Entregue: telas `login`/`register`/`admin`/`campaigns`/`campaigns/[id]`/`.../characters/[charId]`,
`AuthProvider` (JWT em localStorage), `DynamicSheet` (form 100% derivado do `sheet-schema`),
chat de IA por campanha, Nav role-aware. `playwright.config.ts` (webServer sobe o front),
`scripts/e2e.sh` (orquestra pgvector + backend dev + Playwright), `DevSeeder` (perfil `dev`).
Como rodar: `scripts/e2e.sh`. Chromium via `npx playwright install chromium`.

## Bugs encontrados & correções (F0)
1. Initializr devolveu `bootVersion=3.4.1` inválido → range `>=3.5.0`. Corrigido p/ 3.5.16.
2. Artefato `3.5.16.RELEASE` inexistente no Central → versão real `3.5.16` (Boot dropou `.RELEASE`).
3. `release version 25 not supported` + JDK do sistema é JRE (sem javac) → baixado Temurin 21, `java.version=21`.
4. `@ServiceConnection` não resolvia → faltava `spring-boot-testcontainers` (test scope).
5. `podman compose`/`docker-compose` ausentes → instalado `podman-compose` (pip) + fallback `scripts/db.sh`.

## Bugs encontrados & correções (F1)
6. 2ª classe de teste falhava (`Connection refused`) — contexto Spring cacheado reusava datasource de
   container parado entre classes. Corrigido: **singleton container** (start no static block, sem
   `@Container`/`@Testcontainers`), vivo todo o JVM, compartilhado por todas as classes.

## Bugs encontrados & correções (F2)
7. Não-admin autenticado em endpoint `@PreAuthorize` retornava **401** (deveria 403). Denial de
   method-security (`AuthorizationDeniedException`) caía no `authenticationEntryPoint`. Corrigido:
   `@ExceptionHandler(AccessDeniedException.class)` no advice → 403.
