# Portal de RPG — Documento de Arquitetura (v0.1)

> Documento vivo. Reflete tudo que foi conversado até agora. Conforme você for prototipando as features, a gente atualiza.

---

## 1. Visão geral

Portal web para mestres e jogadores de RPG de mesa, inspirado em ferramentas tipo VTT/gerenciador de campanha. O fluxo central:

- Usuário cria conta.
- Pode **criar uma campanha** ou **ingressar** numa existente (via convite).
- Ao criar campanha, o mestre **escolhe o sistema** (D&D, Ordem Paranormal, Tormenta, etc.).
- Mestre convida players e tem **acesso total** às fichas (atributos, perícias, vida, etc.).
- Players gerenciam a própria ficha.

**Diferencial — IA contextualizada por sistema (RAG):**
Cada sistema tem o PDF do livro indexado. Dentro de uma campanha, mestre/player pergunta algo ("qual a cidade do Coração da Ordem?", regra específica) e a IA responde com base no livro **daquele sistema**.

---

## 2. Papéis e permissões

| Papel | Escopo | O que faz |
|---|---|---|
| **Administrador** | Global | Cadastra novos sistemas, faz upload dos PDFs, define o template de ficha de cada sistema |
| **Mestre** | Por campanha | Cria campanha, escolhe sistema, convida/remove players, vê e edita todas as fichas, usa a IA |
| **Player** | Por campanha | Cria e edita a própria ficha, participa da campanha, usa a IA |

> Importante: papel é **contextual à campanha** (exceto Admin, que é global). O mesmo usuário pode ser mestre numa campanha e player em outra. Por isso o papel mora na tabela de associação `campaign_members`, não no usuário.

---

## 3. Stack tecnológico

| Camada | Tecnologia | Deploy |
|---|---|---|
| Front-end | **Next.js** (React + TypeScript) | **Vercel** |
| Back-end | **Java + Spring Boot** | **Railway** (free tier inicial) |
| Banco | **PostgreSQL** | Railway (managed) |
| Vetores (IA) | **pgvector** (extensão do Postgres) | mesmo banco |
| IA / RAG | **Spring AI** + LLM via API (Groq/OpenAI) | — |
| Migrações | **Flyway** | versionado no repo |

Escala alvo: pequena (uso entre amigos). Free tier resolve. Se crescer, migração pro Hetzner CX22 é tranquila.

---

## 4. Arquitetura geral

```mermaid
flowchart TB
    subgraph Cliente
        A[Next.js / Vercel]
    end
    subgraph Backend["Spring Boot / Railway"]
        B[API REST + Auth JWT]
        C[Serviço de Campanhas]
        D[Serviço de Fichas]
        E[Serviço de IA / RAG]
    end
    subgraph Dados
        F[(PostgreSQL)]
        G[(pgvector)]
    end
    H[LLM API - Groq/OpenAI]

    A -->|HTTPS| B
    B --> C --> F
    B --> D --> F
    B --> E
    E -->|busca semântica| G
    E -->|geração| H
```

**Fluxo de indexação do PDF (feito pelo Admin):**

```mermaid
flowchart LR
    A[Admin faz upload do PDF] --> B[Extração de texto]
    B --> C[Chunking]
    C --> D[Embeddings]
    D --> E[(pgvector / system_id)]
```

**Fluxo de pergunta à IA (dentro de uma campanha):**

```mermaid
flowchart LR
    A[Pergunta do usuário] --> B[Embedding da pergunta]
    B --> C[Busca top-k chunks<br/>filtrado pelo system_id da campanha]
    C --> D[Monta prompt + contexto]
    D --> E[LLM gera resposta]
    E --> F[Resposta citando o livro]
```

---

## 5. Modelo de dados

```mermaid
erDiagram
    USERS ||--o{ CAMPAIGN_MEMBERS : participa
    USERS ||--o{ CAMPAIGNS : "mestra (master_id)"
    RPG_SYSTEMS ||--o{ CAMPAIGNS : usa
    RPG_SYSTEMS ||--o{ SYSTEM_DOCUMENTS : possui
    RPG_SYSTEMS ||--|| SYSTEM_SHEET_SCHEMA : define
    SYSTEM_DOCUMENTS ||--o{ DOCUMENT_CHUNKS : gera
    CAMPAIGNS ||--o{ CAMPAIGN_MEMBERS : tem
    CAMPAIGNS ||--o{ CHARACTERS : contem
    USERS ||--o{ CHARACTERS : "controla (player_id)"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string display_name
        boolean is_admin
        timestamp created_at
    }
    RPG_SYSTEMS {
        uuid id PK
        string name
        string slug UK
        text description
        uuid created_by FK
        timestamp created_at
    }
    SYSTEM_SHEET_SCHEMA {
        uuid id PK
        uuid system_id FK
        jsonb schema "campos da ficha (atributos, pericias...)"
    }
    SYSTEM_DOCUMENTS {
        uuid id PK
        uuid system_id FK
        string file_url
        string status "PENDING/INDEXED"
        timestamp created_at
    }
    DOCUMENT_CHUNKS {
        uuid id PK
        uuid document_id FK
        uuid system_id FK
        text content
        vector embedding "pgvector"
    }
    CAMPAIGNS {
        uuid id PK
        string name
        text description
        uuid system_id FK
        uuid master_id FK
        string invite_code UK
        timestamp created_at
    }
    CAMPAIGN_MEMBERS {
        uuid id PK
        uuid campaign_id FK
        uuid user_id FK
        string role "MASTER/PLAYER"
        timestamp joined_at
    }
    CHARACTERS {
        uuid id PK
        uuid campaign_id FK
        uuid player_id FK
        string name
        jsonb sheet_data "conforme o schema do sistema"
        timestamp created_at
    }
```

**Decisão-chave: ficha como `jsonb`.**
Como o Admin cadastra **sistemas novos dinamicamente**, a estrutura da ficha não pode ser fixa em colunas. Cada sistema define seu template em `SYSTEM_SHEET_SCHEMA.schema`, e cada personagem guarda os dados em `CHARACTERS.sheet_data` (JSONB) conforme esse template. Ficha de D&D ≠ ficha de Ordem Paranormal, e o banco aguenta as duas sem mudar schema. PostgreSQL com JSONB é ideal pra isso (indexável, consultável).

---

## 6. Design da API (REST)

Base: `/api`. Auth via **JWT** (access + refresh). Autorização por papel/escopo.

### Autenticação
```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
```

### Sistemas (Admin)
```
GET    /systems                      lista sistemas
POST   /systems                      cria sistema            [ADMIN]
GET    /systems/{id}
PUT    /systems/{id}                                          [ADMIN]
GET    /systems/{id}/sheet-schema    template da ficha
PUT    /systems/{id}/sheet-schema    define template         [ADMIN]
POST   /systems/{id}/documents       upload PDF + indexa     [ADMIN]
GET    /systems/{id}/documents       status de indexação     [ADMIN]
```

### Campanhas
```
POST   /campaigns                    cria (vira MASTER)
GET    /campaigns                    minhas campanhas
GET    /campaigns/{id}
PUT    /campaigns/{id}                                        [MASTER]
DELETE /campaigns/{id}                                        [MASTER]
POST   /campaigns/{id}/invite        gera invite_code        [MASTER]
POST   /campaigns/join               entra via invite_code
GET    /campaigns/{id}/members
DELETE /campaigns/{id}/members/{userId}                       [MASTER]
```

### Personagens / Fichas
```
POST   /campaigns/{id}/characters                 cria ficha
GET    /campaigns/{id}/characters    MASTER vê todas, PLAYER vê a sua
GET    /campaigns/{id}/characters/{charId}
PUT    /campaigns/{id}/characters/{charId}        dono ou MASTER
DELETE /campaigns/{id}/characters/{charId}        dono ou MASTER
```

### IA (RAG)
```
POST   /campaigns/{id}/ai/ask        pergunta escopada ao sistema da campanha
```
Body: `{ "question": "..." }` → resposta filtra os chunks por `system_id` da campanha.

---

## 7. Estratégia de ambientes (dev / staging / prod)

Spring Boot com **profiles**:

```
application.yml             # config comum
application-dev.yml         # localhost, banco local
application-staging.yml     # staging
application-prod.yml        # produção
```

- Ativação: `SPRING_PROFILES_ACTIVE=dev|staging|prod` (variável de ambiente, injetada no Docker/Railway).
- **Secrets** (senhas de banco, API key do LLM, segredo JWT): variáveis de ambiente no Railway — nunca commitadas.
- **Migrações de schema**: Flyway roda automático no boot, versionando o banco igual entre os três ambientes (`V1__init.sql`, `V2__add_characters.sql`, ...).
- Front no Vercel: usa Preview Deployments (cada PR vira um ambiente) + Production.

---

## 8. Decisões em aberto

- [ ] **LLM definitivo**: Groq (rápido, free tier generoso) vs OpenAI (qualidade). Recomendo começar no Groq.
- [ ] **Upload de PDF**: storage do arquivo bruto — Railway volume, S3/R2, ou só processar e descartar guardando os chunks?
- [ ] **Real-time**: rolagem de dados / atualização de ficha ao vivo precisa de WebSocket, ou polling resolve no MVP?
- [ ] **Editor de ficha**: o front renderiza o formulário dinamicamente a partir do `sheet-schema`? (recomendado — evita hardcode por sistema)
- [ ] **Citações da IA**: a resposta deve indicar página/seção do livro?

---

## 9. Próximos passos sugeridos

1. Fechar a lista de features (você está prototipando) e mapear no documento.
2. Definir o `sheet-schema` de **um** sistema piloto pra validar o modelo JSONB.
3. Subir o esqueleto: Spring Boot + Postgres no Railway, Next.js no Vercel, auth JWT.
4. Implementar o CRUD de campanha → membro → ficha antes da IA.
5. Plugar o RAG por último, com 1 PDF de teste.
