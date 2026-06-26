# prompt.md — Portal de RPG: Desenvolvimento + Validação E2E (piloto: Vampiro V5)

> Prompt de execução para agente de código (Claude Code). Objetivo duplo: **(A) construir o portal** conforme a arquitetura, com **Vampiro: A Máscara V5** como sistema-piloto, e **(B) validar o funcionamento completo com testes E2E**. Build e teste andam juntos: cada fase de desenvolvimento só fecha quando seus cenários E2E passam.
>
> Referências no repo: `portal-rpg-arquitetura.md` (arquitetura), `docs/v5-spec.pdf` (Especificação Funcional da ficha), `docs/v5-guia.docx` (regras consolidadas — fonte de verdade dos cálculos), `docs/v5-core.pdf` e `docs/v5-companion.pdf` (corpus de RAG).

---

## 0. Missão e regras gerais

1. Implementar o produto (Parte A) e a suíte de testes (Parte B), na ordem de fases da seção 4.
2. Não inventar regras de V5. Prioridade da fonte de verdade: `v5-guia.docx` → `v5-spec.pdf` → `v5-companion.pdf` (errata) → `v5-core.pdf`.
3. Nenhum teste pode depender de chamada real ao LLM. A geração é mockada; só o **retrieval** é validado de verdade.
4. Cada fase termina com: código + migração + testes verdes dos cenários daquela fase.

---

## 1. Stack

| Camada | Tecnologia | Deploy |
|---|---|---|
| Front | Next.js (React + TS) | Vercel |
| Back | Java + Spring Boot | Railway |
| Banco | PostgreSQL + `pgvector` | Railway |
| Auth | JWT (access+refresh); papel por campanha | — |
| IA | Spring AI + LLM (Groq/OpenAI) sobre PDFs por sistema | — |
| Migrações | Flyway | — |

**Modelo de autorização (núcleo):** o JWT carrega só `user_id` e `is_admin`. Papéis `MASTER`/`PLAYER` **não** vão no token — resolvem-se por requisição via `campaign_members (campaign_id, user_id, role)`. Mesmo usuário pode ser MASTER numa campanha e PLAYER em outra ao mesmo tempo.

---

# PARTE A — DESENVOLVIMENTO

## 2. Modelo de dados (migrações Flyway)

Tabelas (UUID PK, `created_at`):
- `users` (email UK, password_hash, display_name, **is_admin**)
- `rpg_systems` (name, slug UK, description, created_by→users)
- `system_sheet_schema` (system_id→rpg_systems, **schema jsonb** = template da ficha)
- `system_documents` (system_id, file_url, status PENDING|INDEXED)
- `document_chunks` (document_id, **system_id**, content, **embedding vector**) — índice IVFFlat/HNSW por embedding
- `campaigns` (name, description, system_id→rpg_systems, master_id→users, invite_code UK)
- `campaign_members` (campaign_id, user_id, **role** MASTER|PLAYER) — UK(campaign_id,user_id)
- `characters` (campaign_id, player_id→users, name, **sheet_data jsonb** conforme o schema do sistema)

Decisão fixa: ficha é `jsonb` validado contra `system_sheet_schema.schema` (o admin cadastra sistemas dinamicamente; nada de colunas fixas por sistema).

## 3. Superfície da API (REST, base `/api`)

**Auth:** `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh`
**Sistemas (admin):** `GET/POST /systems` · `GET/PUT /systems/{id}` · `GET/PUT /systems/{id}/sheet-schema` · `POST/GET /systems/{id}/documents`
**Campanhas:** `POST/GET /campaigns` · `GET/PUT/DELETE /campaigns/{id}` · `POST /campaigns/{id}/invite` · `POST /campaigns/join` · `GET /campaigns/{id}/members` · `DELETE /campaigns/{id}/members/{userId}`
**Fichas:** `POST/GET /campaigns/{id}/characters` · `GET/PUT/DELETE /campaigns/{id}/characters/{charId}`
**IA:** `POST /campaigns/{id}/ai/ask` (escopada ao `system_id` da campanha)

Autorização: guard `@PreAuthorize("@campaignAccess.hasRole(#campaignId, 'MASTER')")` que faz lookup em `campaign_members`. `GET .../characters` retorna todas p/ MASTER e só a própria p/ PLAYER.

## 4. Fases de desenvolvimento (cada uma fecha com seus E2E)

| Fase | Entrega | Fecha com |
|---|---|---|
| **F0 — Scaffolding** | Spring Boot + Next.js + Flyway + container pgvector + esqueleto de CI | ambiente sobe limpo (seção 8) |
| **F1 — Auth** | registro/login/refresh, JWT (só `user_id`+`is_admin`), filtro de validação | E2E-AUTH-01..04 |
| **F2 — Sistemas** | CRUD de sistema + `sheet-schema` + upload de documento (sem indexar ainda) | E2E-ADMIN-01..02 |
| **F3 — Campanhas + Authz** | criar campanha (MASTER na mesma transação), convite, join, guard por campanha | E2E-CAMP-01..02, E2E-PLAYER-01..02, E2E-AUTHZ-01..04 |
| **F4 — Ficha + motor V5** | ficha dinâmica via schema + motor de regras (seção 6) + catálogos do apêndice 13 (clãs core+companion, 27 habilidades, tipos de predador, tipos de personagem mortal/carniçal) | E2E-PLAYER-03, E2E-SHEET-01..18 |
| **F5 — RAG** | indexação (chunk→embedding→pgvector) + query escopada por `system_id` | E2E-ADMIN-03, E2E-RAG-01..05 |
| **F6 — Front** | telas Next.js plugando os fluxos (seção 7) | reexecução E2E de UI ponta a ponta |

## 5. Motor da ficha V5 (lógica de back a implementar)

Implementar como serviço testável (regra de domínio isolada da camada web). Usar exatamente os valores da seção 9.

- **Derivados:** Vitalidade = Vigor+3; Força de Vontade = Autocontrole+Determinação; recalcular ao mudar o atributo-base.
- **Faixas:** atributos/habilidades 1–5; Fome 0–5; Humanidade atual ≤ máx.
- **Rolador:** parada = Atributo + Habilidade (qualquer combinação). Substituir `Fome` dados normais por dados de Fome (tamanho preservado). Contagem: 6–10 = 1 sucesso; par de 10 = 4. Detectar **Falha Bestial** (falha + dado de Fome=1; não dispara se sucessos bastavam) e **Crítico Sangrento** (vitória crítica + 10 em dado de Fome). FdV rerrola até 3 dados normais/teste; **dado de Fome nunca rerrola**.
- **Rouse Check:** 1 dado; <6 → Fome+1; 6+ mantém.
- **Dano:** superficial vampírico ÷2 (arredonda p/ cima) antes de marcar; agravado não reduz; trilha cheia → Debilitado (−2 dados nas paradas ligadas).
- **XP:** debitar conforme tabela 9.5; rejeitar saldo insuficiente; não pular níveis.
- **Clã:** ao selecionar, auto-popular disciplinas + maldição + compulsão (tabela 9.6, **incluindo os clãs do Companion** — Ravnos, Salubri, Tzimisce — do apêndice 13.2).
- **Errata do Companion (13.6):** aplicar tabela de Potência de Sangue 0–6 (Surto e Gravidade da Perdição já com +1); Compulsão pode disparar também em Crítico Sangrento, não só Falha Bestial.
- **Tipos de personagem alternativos (13.5):** além de vampiro, suportar fichas de Mortal e Carniçal com suas regras próprias de criação.
- **Habilidades (13.1):** catálogo das 27 habilidades em 3 categorias, com especializações.
- **Disciplinas:** persistir e exibir o **texto integral** do poder, carregado do PDF indexado do sistema (não hardcoded). Catálogo de poderes do Companion em 13.3.

## 6. Pipeline RAG

Upload PDF (admin) → extração de texto → chunking → embeddings → `document_chunks` com `system_id` → status `INDEXED`. Query: embedding da pergunta → busca top-k **filtrada por `system_id` da campanha** → prompt+contexto → LLM. O filtro por `system_id` é obrigatório e é o ponto testado no isolamento entre sistemas.

## 7. Frontend (fluxos Next.js)

Telas mínimas: auth (login/registro); admin (cadastro de sistema, editor de `sheet-schema`, upload de PDF + status de indexação); mestre (criar campanha, escolher sistema, gerar convite, ver todas as fichas); player (entrar por convite, criar/editar ficha); **ficha renderizada dinamicamente a partir do `sheet-schema`** (sem hardcode por sistema); chat de IA escopado à campanha. UI deve refletir o papel resolvido por campanha.

---

# PARTE B — TESTES E2E

## 8. Ferramentas e ambiente de teste

- **E2E de UI:** Playwright (TS) contra front+back reais.
- **E2E/integração de API:** REST-assured + JUnit 5 (ou `WebTestClient`).
- **Banco efêmero:** Testcontainers `pgvector/pgvector:pg16` (não usar Postgres puro).
- **Mock de LLM:** WireMock / stub do `ChatClient` — geração determinística que ecoa chunks + `system_id`.
- **Seed determinístico:** Flyway aplica schema; seed popula usuários, sistema V5 (+sheet-schema +PDF-fixture pequeno de 10–15 páginas) e um 2º sistema `generico-d20` (isolamento). PDF de 94 MB **não** entra no fixture.
- **CI:** GitHub Actions; jobs separados back (Testcontainers) e Playwright; relatório por cenário.

Usuários do seed: `admin@test` (is_admin), `mestre@test`, `player1@test`, `player2@test` (PLAYER em A e MASTER em B), `intruso@test` (não-membro, casos de 403).

## 9. Fixtures de regras V5 (valores esperados)

### 9.1 Derivados
| Campo | Fórmula | Exemplo |
|---|---|---|
| Vitalidade | Vigor+3 | Vigor 3 → 6 |
| Força de Vontade | Autocontrole+Determinação | 3+2 → 5 |
| Humanidade inicial | 7 | |
| Potência de Sangue (neonato) | 1 | |

### 9.2 Rolagem
Parada = Atributo+Habilidade (combinação livre); d10 sucesso 6–10; par de 10 = 4 sucessos; Fome H substitui H dados (tamanho fixo); Falha Bestial = falha + Fome=1; Crítico Sangrento = vit. crítica + 10 em dado de Fome; FdV rerrola até 3 normais, nunca Fome.

### 9.3 Rouse/alimentação
Rouse <6 → Fome+1, 6+ mantém. Saciar: animal peq/méd 1 (não p/ Potência 3+), animal grande 2, bolsa 1, gole humano 1, beber bastante 2, drenar até a morte 5 (única forma de zerar).

### 9.4 Dano
Superficial vampírico ÷2 (arredonda p/ cima); agravado não reduz; trilha cheia → Debilitado (−2 dados); Vitalidade cheia de agravado → torpor.

### 9.5 XP
| Traço | Custo |
|---|---|
| Atributo | novo nível × 5 |
| Habilidade | novo nível × 3 |
| Especialização | 3 |
| Disciplina de clã | novo nível × 5 |
| Outra Disciplina | novo nível × 7 |
| Disciplina Caitiff | novo nível × 6 |
| Vantagem | 3 por ponto |
| Potência de Sangue | novo nível × 10 |

### 9.6 Clãs (seleção auto-popula)
| Clã | Disciplinas | Maldição (resumo) | Compulsão |
|---|---|---|---|
| Brujah | Celeridade, Potência, Presença | penalidade vs frenesi de fúria | Rebelião |
| Gangrel | Animalismo, Fortitude, Protean | traços animais em frenesi | Impulsos Ferais |
| Malkaviano | Auspício, Dominação, Ofuscação | perturbação mental | Delírio |
| Nosferatu | Animalismo, Ofuscação, Potência | Repulsivo; sem Aparência | Criptofilia |
| Toreador | Auspício, Celeridade, Presença | perde dados sem beleza | Obsessão |
| Tremere | Auspício, Dominação, Feitiçaria de Sangue | Laço de Sangue alterado | Perfeccionismo |
| Ventrue | Dominação, Fortitude, Presença | só bebe de presa específica | Arrogância |
| Caitiff | quaisquer 2 | nenhuma | Defeito Suspeito |
| Sangue-ralo | — (Alquimia) | sofre dano como mortal | nenhuma |
| Ravnos (Companion) | Animalismo, Ofuscação, Presença | queima ao dormir 2× no mesmo local em 7 noites (dano agravado por Gravidade) | Destino Tentador |
| Salubri (Companion) | Auspícios, Dominação, Fortitude | caçados: quem bebe seu vitae custa parar; 3º olho chora sangue ao usar disciplina | Empatia Afetiva |
| Tzimisce (Companion) | Animalismo, Dominação, Proteanismo | enraizado: dormir cercado da posse escolhida ou dano agravado à FdV | Cobiça |

### 9.7 Criação (point-buy)
Atributos: um 4, três 3, quatro 2, um 1. Habilidades: Pau-pra-toda-obra / Equilibrado / Especialista. Disciplinas: 2 do clã (2 numa, 1 noutra). Vantagens 7 / Defeitos 2; Convicções/Pilares 1–3; Humanidade 7.

## 10. Matriz de cenários E2E

**Auth & JWT**
- E2E-AUTH-01 registro→login (access+refresh); refresh renova.
- E2E-AUTH-02 JWT contém `user_id`+`is_admin`; **não** contém papel de campanha.
- E2E-AUTH-03 token adulterado (flip `is_admin`) rejeitado.
- E2E-AUTH-04 sem `Authorization` → 401.

**Admin — sistemas/RAG**
- E2E-ADMIN-01 admin cria V5 e define `sheet-schema`.
- E2E-ADMIN-02 não-admin cria sistema → 403.
- E2E-ADMIN-03 upload dispara indexação PENDING→INDEXED; chunks com `system_id` correto.

**Mestre — campanha**
- E2E-CAMP-01 mestre cria campanha V5 → vira MASTER na mesma transação; recebe `invite_code`.
- E2E-CAMP-02 campanha sem `system_id` válido → erro de validação.

**Player — ingresso/ficha**
- E2E-PLAYER-01 join via `invite_code` → vira PLAYER.
- E2E-PLAYER-02 convite inválido/expirado → erro.
- E2E-PLAYER-03 player cria ficha V5 conforme `sheet-schema`.

**Autorização contextual (núcleo)**
- E2E-AUTHZ-01 MASTER lista todas as fichas; PLAYER só a sua.
- E2E-AUTHZ-02 não-membro em `/campaigns/{id}/...` → 403.
- E2E-AUTHZ-03 **papéis simultâneos:** `player2@test` PLAYER em A e MASTER em B; acesso resolve por campanha.
- E2E-AUTHZ-04 isolamento de tenant (LGPD): PLAYER de A não enxerga B.

**Motor da ficha V5**
- E2E-SHEET-01 Vitalidade/FdV recalculam ao editar atributo-base.
- E2E-SHEET-02 atributos 1–5; rejeita 0 e 6.
- E2E-SHEET-03 rolagem aceita qualquer Atributo+Habilidade (ex.: Inteligência+Armas Brancas).
- E2E-SHEET-04 Fome 2 em parada 6 = 4 normais + 2 de Fome (tamanho fixo).
- E2E-SHEET-05 Falha Bestial (falha + Fome=1); não dispara se sucessos bastavam.
- E2E-SHEET-06 Crítico Sangrento (par de 10 com ≥1 em dado de Fome).
- E2E-SHEET-07 par de 10 = 4 sucessos.
- E2E-SHEET-08 FdV rerrola até 3 normais; bloqueia rerrolar dado de Fome.
- E2E-SHEET-09 Rouse <6 sobe Fome, 6+ mantém.
- E2E-SHEET-10 superficial ÷2 (arredonda p/ cima), agravado não; trilha cheia → Debilitado.
- E2E-SHEET-11 XP: atributo 2→3 = 15; disciplina de clã 1→2 = 10; fora do clã 1→2 = 14; saldo insuficiente rejeitado.
- E2E-SHEET-12 seleção de clã auto-popula disciplinas+maldição+compulsão (validar Brujah e Nosferatu).
- E2E-SHEET-13 disciplina exibe texto integral do poder.
- E2E-SHEET-14 point-buy rejeita distribuição fora dos padrões (9.7).
- E2E-SHEET-15 clãs do Companion (Ravnos/Salubri/Tzimisce) auto-populam disciplinas+maldição+compulsão (13.2).
- E2E-SHEET-16 catálogo de 27 habilidades disponível e categorizado em Físicas/Sociais/Mentais (13.1); aceita especializações.
- E2E-SHEET-17 errata aplicada: Surto de Sangue e Gravidade da Perdição seguem a tabela 0–6 (13.6); Compulsão pode disparar em Crítico Sangrento.
- E2E-SHEET-18 fichas alternativas: criar Mortal e Carniçal (13.5) — carniçal recebe 1 poder de disciplina nível 1 do domitor e cura 2× mais rápido; mortal sem disciplinas/tipo de predador.

**RAG por sistema**
- E2E-RAG-01 pergunta na campanha V5 ("fórmula da Vitalidade?") → retrieval só do `system_id` de V5; cita Vigor+3.
- E2E-RAG-02 lore ("Perdição do clã Ravnos?") recupera do companion.
- E2E-RAG-03 **isolamento:** mesma pergunta numa campanha `generico-d20` não retorna chunks de V5.
- E2E-RAG-04 sistema sem PDF responde fallback claro (sem alucinar de outro corpus).
- E2E-RAG-05 pergunta sobre poder de disciplina do Companion (ex.: "O que faz Vicissitude?") recupera do PDF do companion, com `system_id` de V5.

## 11. Critérios de aceitação (Definition of Done)

- [ ] Partes A e B completas; 100% dos cenários da seção 10 verdes.
- [ ] AUTHZ-03 (papéis simultâneos) coberto obrigatoriamente.
- [ ] Nenhum teste chama LLM real; retrieval validado contra pgvector.
- [ ] Todos os cálculos da seção 9 batem com as fixtures.
- [ ] Suíte roda do zero em CI (Testcontainers + Flyway + seed + Playwright) sem passo manual.
- [ ] Ficha renderiza dinamicamente do `sheet-schema` (sem hardcode por sistema).
- [ ] Rodar a suíte 2× seguidas dá o mesmo resultado (idempotência).

## 12. Saída esperada do agente

1. Código do produto (back+front+migrações) e dos testes, configs de Testcontainers/WireMock, seed e job de CI.
2. `E2E-REPORT.md` com a matriz da seção 10 preenchida (status, tempo, observações).
3. Lista de bugs encontrados durante a execução e correções aplicadas para fechar cada cenário.

> Comece lendo `portal-rpg-arquitetura.md` e os 4 docs de V5. Execute as fases na ordem da seção 4: cada fase entrega código + migração + seus E2E verdes antes de avançar.

---

# APÊNDICE 13 — Catálogos V5 (núcleo + Companion)

> Fixtures factuais (nomes, níveis, mecânica) para alimentar o `sheet-schema` e o corpus de RAG. O **texto integral** de poderes, lore e regras detalhadas vem dos PDFs indexados em runtime, não deste arquivo.

## 13.1 Habilidades (27, em 3 categorias)
- **Físicas (9):** Armas Brancas, Armas de Fogo, Atletismo, Briga, Condução, Furtividade, Ladroagem, Ofícios, Sobrevivência.
- **Sociais (9):** Empatia com Animais, Etiqueta, Sagacidade, Intimidação, Liderança, Performance, Persuasão, Manha, Subterfúgio.
- **Mentais (9):** Erudição, Percepção, Ciência, Finanças, Investigação, Medicina, Ocultismo, Política, Tecnologia.

Cada habilidade aceita **especializações** (foco que dá +1 dado quando se aplica). Especializações gratuitas em Erudição, Ofícios, Performance e Ciência (se tiver pontos), mais uma livre.

## 13.2 Clãs do Companion (detalhe)
- **Ravnos** — Disciplinas: Animalismo, Ofuscação, Presença. Perdição: queima por dentro se dormir 2× no mesmo local em 7 noites (dano agravado = nº de críticos numa parada igual à Gravidade da Perdição; refúgios precisam distar ≥1,6 km). Compulsão: Destino Tentador (penalidade −2 a soluções que não sejam a mais ousada/perigosa).
- **Salubri** — Disciplinas: Auspícios, Dominação, Fortitude. Perdição: caçados (vampiro que bebe seu vitae faz teste de frenesi de fome para parar); 3º olho chora sangue ao usar disciplina, provocando teste de frenesi em quem tem Fome 4+. Compulsão: Empatia Afetiva.
- **Tzimisce** — Disciplinas: Animalismo, Dominação, Proteanismo. Perdição: enraizado (deve passar o dia cercado de uma posse específica escolhida, ou dano agravado à FdV = Gravidade da Perdição). Compulsão: Cobiça.

## 13.3 Catálogo de poderes de disciplina (Companion) — nome · nível · amálgama/pré · efeito (1 linha)
- **Auspícios:** Obeah (N2, Fortitude 1) — acalma/cura FdV de um alvo. · Aliviando a Alma Bestial (N5, Dominação 3, pré Obeah) — remove Máculas de outro vampiro.
- **Dominação:** Favor do Domitor (N2) — dificulta servo enlaçado agir contra o mestre.
- **Fortitude:** Valeren (N2, Auspícios 1) — projeta cura de Vitalidade em outro vampiro.
- **Ofuscação:** Quimerismo (N2, Presença 1) — alucinação breve de um sentido. · Fata Morgana (N3, Presença 2) — alucinações elaboradas multissensoriais.
- **Proteanismo:** Vicissitude (N2, Dominação 2) — remodela o próprio corpo. · Modelagem de Carne (N3, Dominação 2, pré Vicissitude) — remodela corpos alheios. · Forma Hedionda (N4, Dominação 2, pré Vicissitude) — forma monstruosa de combate. · Um com a Terra (N5, Animalismo 2, pré Fusão com a Terra) — funde-se ao domínio com percepção até 1,6 km.

> Disciplinas comuns do núcleo a suportar no catálogo: Animalismo, Auspícios, Celeridade, Dominação, Fortitude, Ofuscação, Potência, Presença, Proteanismo, Feitiçaria de Sangue (com Rituais) e Alquimia (Sangue-ralo).

## 13.4 Qualidades de Coterie por clã (Companion) — nome · 1 linha
Banu Haqim — Chamado do Dever (dá efeito de 1 FdV a um colega). · Brujah — Beber para Curar a Ressaca (colega rerrola teste físico falho). · Gangrel — Táticas de Bando (+1 dado a aliados atacando o mesmo inimigo). · Hecata — Ars Moriendi (mascara/elimina cadáver). · Lasombra — A Todo Custo (+2 sucessos, vira crítico bestial). · Malkaviano — Tudo Está Conectado (troca a habilidade na coleta de info). · Ministério — Discernir (revela desejo superficial de um PN). · Nosferatu — Contato Contextual (usa maior Contato da coterie). · Ravnos — Criptoleto (língua secreta da coterie). · Toreador — Acesso Total (entra em local/evento com lista). · Tremere — Gestão de Conhecimentos Multinível (usa Ficha de Conhecimento alheia). · Tzimisce — Hospitalidade do Velho Mundo (recupera 1 superficial de FdV no refúgio). · Ventrue — Legados Vampíricos (revela histórico de um vampiro contatado).

## 13.5 Tipos de personagem alternativos (Companion) — fixtures de criação
- **Mortal:** sem clã/senhor; Atributos 4/3×3/2×4/1; Vitalidade=Vigor+3; FdV=Autocontrole+Determinação; Habilidades por método rápido (13.7); **sem disciplinas e sem tipo de predador**; Vantagens 7 / Defeitos 2; Convicções/Pilares 1–3; Humanidade 7. Sofre dano como mortal (impacto pesado/cortante/perfurante = agravado).
- **Carniçal:** como Mortal, **+1 poder de disciplina nível 1** de uma disciplina do domitor (mais poderes nível 1 a 10 XP cada; contam como Disciplina 1 para uso); cura todo dano 2× mais rápido (exceto fogo); Humanidade 7. Pode ganhar Qualidades/Defeitos específicos de carniçal.

## 13.6 Errata do Companion (aplicar no motor)
- **Surto de Sangue +1** em todos os valores → passa a 1–6.
- **Gravidade da Perdição +1** → 1–6.
- **Compulsões** podem resultar de **Críticos Bestiais**, não só Falhas Bestiais.
- **Tabela de Potência de Sangue 0–6** (já com errata):

| PdS | Surto | Dano recup./Rouse | Bônus disciplina | Rerrol. Rouse p/ disc. | Grav. Perdição | Penalidade de alimentação |
|---|---|---|---|---|---|---|
| 0 | +1 | 1 superf. | — | — | 0 | nenhuma |
| 1 | +2 | 1 superf. | — | nível 1 | 2 | nenhuma |
| 2 | +2 | 2 superf. | +1 | nível 1 | 2 | animal/bolsa sacia ½ Fome |
| 3 | +3 | 2 superf. | +1 | nível ≤2 | 3 | animal/bolsa não sacia |
| 4 | +3 | 3 superf. | +2 | nível ≤2 | 3 | + sacia 1 a menos por humano |
| 5 | +4 | 3 superf. | +2 | nível ≤3 | 4 | + drenar/matar p/ Fome <2 |
| 6 | +4 | 3 superf. | +3 | nível ≤3 | 4 | sacia 2 a menos por humano; drenar/matar p/ Fome <2 |

## 13.7 Tipos de Predador (núcleo)
Gato de Rua, Saqueador, Sanguessuga, Açougueiro, Consensual, Fazendeiro, Osíris, João-dorminhoco, Rainha da Cena, Sereia. Cada um concede traços extras (disciplina/especialização/Vantagens/Defeitos) que modelam o estilo de caça.

## 13.8 Métodos de distribuição de Habilidades
- **Pau-pra-toda-obra:** uma a 3, oito a 2, dez a 1.
- **Equilibrado:** três a 3, cinco a 2, sete a 1.
- **Especialista:** uma a 4, três a 3, três a 2, três a 1.
