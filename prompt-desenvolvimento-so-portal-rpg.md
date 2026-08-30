# Prompt de Desenvolvimento - SO Portal RPG

## CONTEXTO DO PROJETO

Você está desenvolvendo **SO Portal RPG**, um portal para criar e gerenciar fichas de personagem de **Vampire: The Masquerade 5ª Edição (V5)**.

### Referências Obrigatórias
1. **V5 Corebook (2018)** - Livro base: disciplinas, atributos, habilidades, clãs
2. **V5 Players Guide (2022)** - Backgrounds, defeitos, predadores, loresheets
3. **Personagem Teste: Silas Renoir (Tremere)** - Use para validar cada feature

---

## ESCOPO DO SISTEMA

### O QUE DEVE EXISTIR

#### 1. CRIAÇÃO DE PERSONAGEM
Uma interface linear e clara para criar uma ficha de V5:

**Passo 1: Dados Pessoais**
- Nome, Conceito, Cronograma
- Clã (dropdown: 13 opções validadas)
- Predador (dropdown: 9 opções)
- Data de Nascimento → calcula Idade Verdadeira automaticamente
- Data do Abraço → calcula Geração

**Passo 2: Atributos (1-5, máx 4 em criação)**
- Física: Força, Destreza, Resistência
- Social: Carisma, Manipulação, Autocontrole
- Mental: Inteligência, Raciocínio, Compostura
- Cada atributo começa em 1, distribui 5 pontos adicionais

**Passo 3: Habilidades (1-3, máx 4 com especialidade)**
- 35 habilidades (Atletismo, Armas Corpo-a-Corpo, Dirección, etc.)
- 1 especialidade por habilidade (opcional)
- Distribui 11 pontos totais
- Máximo 3 por habilidade em criação

**Passo 4: Disciplinas (de acordo com Clã)**
- Cada clã oferece exatamente 3 disciplinas obrigatórias
- Tremere: Auspex, Conjuração de Sangue, Ofuscação
- Cada disciplina pode ter 1-3 pontos em criação
- Total: distribui 3 pontos

**Passo 5: Backgrounds (Vantagens)**
- Mínimo 25+ backgrounds conforme Players Guide
- Máximo 7 pontos totais
- Cada background tem 1-5 pontos
- Exemplo: Segredos Enterrados, Acuidade Visual Aguçada

**Passo 6: Defeitos**
- Mínimo 20+ defeitos conforme Players Guide
- Máximo -7 pontos totais
- Cada defeito tem -1 a -5 pontos
- Exemplo: Memória Fragmentada, Lacuna Cognitiva

**Passo 7: Dados Derivados**
- Vitalidade = 3 + (Resistência / 2)
- Força de Vontade = (Compostura + Autocontrole) / 2
- Humanidade (padrão 7, editável)
- Fome (padrão 0)
- Potência de Sangue (0-5)
- Ressonância (Sanguine, Choleric, Melancholic)

#### 2. GESTÃO DE SESSÃO
Uma interface para jogar com o personagem:

**Barra de Fome (0-5)**
- Botão + incrementa até 5
- Botão - decrementa até 0
- Visual muda por nível (cores/ícones)
- Efeito: Fome afeta testes (reduz sucesso crítico)
- Fome 5: risco de Roubo de Sangue

**Indicador de Vitalidade**
- Mostra estado: Íntegra → Ferida Leve → Ferida Séria → Incapacitada
- Botão + e - para ajustar
- Máximo baseado em Resistência
- Ao 0: Incapacitada (não pode agir)

**Potência de Sangue / Vitae**
- Piscina = Potência de Sangue x 2
- Botão + gasta vitae
- Botão - recupera vitae
- Mostra limite máximo

**Força de Vontade**
- Piscina = (Compostura + Autocontrole) / 2
- Botão + recupera (até máximo)
- Botão - gasta (em resistências)
- Mostra 0 quando gasto

**Humanidade / Mancas**
- Campo de 0-10
- Cada Manca reduz máximo de Humanidade
- Ao 0: Perdido para a Besta
- Visual alerta em valores críticos

**Disciplinas em Ação**
- Lista todas as disciplinas do clã
- Cada poder mostra: nome, custo de vitae, descrição
- Botão para ativar/usar
- Valida Potência de Sangue antes de ativar

#### 3. PERSISTÊNCIA
- Salvar estado completo do personagem
- Carregar personagem em sessão
- Histórico de ações em sessão
- Exportar ficha (se aplicável)

---

## VALIDAÇÃO CONTRA FONTE OFICIAL

### ANTES DE IMPLEMENTAR QUALQUER FEATURE:

1. **Abrir V5 Corebook**
   - Procurar a página específica
   - Copiar descrição EXATA
   - NÃO ALUCINAT EFEITOS

2. **Para Backgrounds e Defeitos**
   - Abrir Players Guide
   - Validar lista completa
   - Procurar cada descrição
   - Comparar com implementação

3. **Para Disciplinas**
   - Corebook p. 103-180
   - Cada poder deve listar:
     - Nome exato
     - Custo de vitae
     - Descrição oficial
     - Efeitos mecanicamente corretos

4. **Para Clãs**
   - Corebook p. 95-108
   - Validar:
     - 3 disciplinas corretas
     - Aptidão mecanicamente correta (V5 não tem mais)
     - Fraqueza (Bane) descrita corretamente

### EXEMPLO DE DISCIPLINA BEM VALIDADA

❌ ERRADO:
```
Auspex Nível 1: Heightened Senses
- Descrição vaga e improvisada
- "You can see things better"
- Custo não definido
```

✅ CORRETO:
```
Auspex Nível 1: Heightened Senses
Página: V5 Corebook p. 119
Custo: 1 Vitae + 1 Ação
Descrição: "Vampire extends her perceptions across the local area, 
sensing supernatural presences and auras of supernatural powers."
Efeito: O vampiro gasta 1 vitae e pode perceber:
- Presença de supernaturais em 100 metros
- Aura de poderes vampíricos (Sangue, Besta, etc.)
- Emoções intensas de alvos próximos
```

---

## CHECKLIST DE QUALIDADE POR FEATURE

Antes de marcar como "pronto", a feature deve passar em:

### ✅ CORRETUDE CONTRA LIVRO
- [ ] Descrição copiada/parafraseada do livro
- [ ] Página de referência anotada
- [ ] Efeitos mecanicamente exatos
- [ ] Custos validados
- [ ] Nenhuma alucinhação

### ✅ INTEGRAÇÃO COM SISTEMA
- [ ] Respeita limites de V5 (máximos, mínimos)
- [ ] Atributos não vão além de 4 em criação
- [ ] Habilidades não vão além de 3 em criação
- [ ] Disciplinas limitadas a 3 pontos
- [ ] Backgrounds máximo 7 pontos
- [ ] Defeitos máximo -7 pontos

### ✅ TESTES COM SILAS RENOIR
- [ ] Carregar Silas (Tremere)
- [ ] Verificar Auspex, Conjuração de Sangue, Ofuscação
- [ ] Verificar Segredos Enterrados +3
- [ ] Verificar Acuidade Visual Aguçada +2
- [ ] Verificar Memória Fragmentada -3
- [ ] Verificar Lacuna Cognitiva -2
- [ ] Testar Fome até 5
- [ ] Testar Vitalidade e Força de Vontade

### ✅ INTERFACE E UX
- [ ] Botões funcionam (+ incrementa, - decrementa)
- [ ] Limites são respeito (máximo/mínimo)
- [ ] Visual feedback claro
- [ ] Sem erros no console
- [ ] Responsivo em mobile

### ✅ PERSISTÊNCIA
- [ ] Dados salvam ao sair
- [ ] Dados carregam ao entrar
- [ ] Histórico persiste
- [ ] Sem corrupção de dados

---

## PADRÃO DE DESENVOLVIMENTO

### PARA CADA NOVA FEATURE:

```
1. PESQUISA (30 min)
   - Abrir livro correto
   - Encontrar página exata
   - Copiar descrição
   - Anotar página

2. DESIGN (15 min)
   - Esboçar componentes
   - Definir integração com estado
   - Definir validações

3. IMPLEMENTAÇÃO (45 min)
   - Criar componente/função
   - Adicionar validações
   - Testar com Silas

4. VALIDAÇÃO (30 min)
   - Comparar com livro
   - Testar edge cases
   - Testar persistência
   - Atualizar testes

TOTAL: ~2h por feature
```

### REGRA DE OURO:
**NUNCA implemente algo que não possa validar contra o livro**.

Se não encontrar no livro, NÃO ALUCINAT. Peça para pesquisar ou pule.

---

## PRIORIDADES DE DESENVOLVIMENTO

### FASE 1: CRIAÇÃO BASE (CRÍTICO)
1. Dados pessoais + cálculos derivados
2. Atributos com distribuição
3. Habilidades com distribuição
4. Clãs (13 variantes) + Disciplinas automáticas
5. Backgrounds (validar 25+)
6. Defeitos (validar 20+)
7. Salvar/carregar ficha

### FASE 2: GESTÃO DE SESSÃO (IMPORTANTE)
1. Fome (0-5) com botões e efeitos
2. Vitalidade com indicador visual
3. Potência de Sangue/Vitae
4. Força de Vontade
5. Humanidade/Mancas
6. Histórico de ações

### FASE 3: DISCIPLINAS EM AÇÃO (NICE-TO-HAVE)
1. Listar poderes por disciplina
2. Ativar/usar poder (gasta vitae)
3. Validar Potência de Sangue
4. Efeitos mecanicamente corretos

### FASE 4: EXPORTAÇÃO (FUTURO)
1. PDF da ficha
2. Export JSON
3. Compartilhamento

---

## REFERÊNCIAS RÁPIDAS

**V5 Corebook (2018)**
- Clãs: p. 95-108
- Atributos: p. 99
- Habilidades: p. 100-102
- Disciplinas: p. 103-180
- Backgrounds: p. 181-195
- Defeitos: p. 196-200

**V5 Players Guide (2022)**
- Backgrounds expandidos
- Loresheets
- Predadores
- Guia de Criação

---

## PADRÃO DE NOMES E DADOS

### CLÃS (13)
1. Banu Hor
2. Brujah
3. Caitiff
4. Gangrel
5. Hecata
6. Lasombra
7. Malkavian
8. Nosferatu
9. Ravnos
10. Salubri
11. Toreador
12. Tremere
13. Ventrue

### PREDADORES (9)
1. Alchemist
2. Bagger
3. Bloodhound
4. Cleaver
5. Graverobber
6. Osiris
7. Sandman
8. Siren
9. Strays

### RESSONÂNCIAS
- Sanguine
- Choleric
- Melancholic
- (Profano - se usado, validar em Players Guide)

---

## ERRO COMUM A EVITAR

❌ "Vou criar uma disciplina que acho legal"
✅ "Vou procurar a disciplina no livro e copiar exatamente"

❌ "Vou adivinhar o efeito de um background"
✅ "Vou encontrar no Players Guide e validar"

❌ "Acho que funciona assim"
✅ "Vou confirmar na página X do livro"

---

## PRÓXIMOS PASSOS

1. [ ] Executar plano de testes (plano-testes-so-portal-rpg.md)
2. [ ] Documentar bugs encontrados
3. [ ] Validar contra livro cada elemento
4. [ ] Implementar correções com base em validação
5. [ ] Adicionar mais backgrounds/defeitos se faltando
6. [ ] Testar com Silas Renoir completo
7. [ ] Exportar versão estável

---

## CONTATO COM A IA

Ao solicitar desenvolvimento, use este template:

```
Feature: [Nome da Feature]
Fase: [1/2/3/4]
Validação necessária: [O que deve ser validado]

Descrição: [O que fazer]

Referência: [Página do livro]

Teste: [Como testar]
```

Exemplo:

```
Feature: Implementar Auspex em ações de sessão
Fase: 3
Validação necessária: V5 Corebook p. 119-122

Descrição: 
- Auspex 1: Heightened Senses (custo 1 vitae)
- Auspex 2: Sense the Unseen (custo 1 vitae)
- Auspex 3: Premonition (custo 2 vitae)

Referência: V5 Corebook p. 119-122

Teste:
- Carregar Silas (Auspex 2)
- Usar Auspex 1 e 2 em sessão
- Validar custo de vitae deduzido
- Validar que não pode usar Auspex 3 (Silas tem 2)
```

---

## RESUMO

Este é um projeto **baseado em livro**, não em fantasia. Cada feature deve ser:
1. **Pesquisada** no livro correto
2. **Validada** contra página e descrição
3. **Testada** com Silas Renoir
4. **Persistida** corretamente

Sem pesquisa = sem implementação.
