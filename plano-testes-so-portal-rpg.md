# Plano de Testes Completo - SO Portal RPG

## Objetivo
Validar o fluxo completo de criação de personagem e utilização em sessão, com verificação de conformidade com V5 (Vampire: The Masquerade 5ª Edição).

---

## FASE 1: TESTES DE CRIAÇÃO DE PERSONAGEM

### 1.1 Preenchimento Básico
- [ ] Preencher Nome do Personagem
- [ ] Selecionar Clã (validar lista de 13 clãs: Banu Hor, Brujah, Caitiff, Gangrel, Hecata, Lasombra, Malkavian, Nosferatu, Ravnos, Salubri, Toreador, Tremere, Ventrue)
- [ ] Selecionar Predador (validar 9 tipos: Alchemist, Bagger, Bloodhound, Cleaver, Graverobber, Osiris, Sandman, Siren, Strays)
- [ ] Inserir Conceito do Personagem
- [ ] Inserir Cronograma (origem/história)
- [ ] Validar que todos os campos obrigatórios ficam marcados

### 1.2 Atributos (1-5, com máximo de 4 em criação - V5 Corebook p. 99)
**Seção Física:**
- [ ] Força (1-5)
- [ ] Destreza (1-5)
- [ ] Resistência (1-5)
- [ ] Validar que não permita valores fora do intervalo
- [ ] Validar que o máximo inicial seja 4 (não 5)
- [ ] Validar distribuição de pontos (5 base + distribuição)

**Seção Social:**
- [ ] Carisma (1-5)
- [ ] Manipulação (1-5)
- [ ] Autocontrole (1-5)
- [ ] Mesmo sistema de validação acima

**Seção Mental:**
- [ ] Inteligência (1-5)
- [ ] Raciocínio (1-5)
- [ ] Compostura (1-5)
- [ ] Mesmo sistema de validação acima

### 1.3 Habilidades (1-3 em criação, máx. 4 com especialidade)
**Validar 35 Habilidades conforme V5 Corebook p. 100-102:**

Atletismo, Armas Corpo-a-Corpo, Armas de Fogo, Condução, Segurança, Dissimulação, Direção, Ofuscação, Furtividade, Ofício, Ocultismo, Percepção, Performance, Procedural, Religião, Recursos, Ciência, Medicina, Espiritismo, Esportes, Sobrevivência, Tecnologia, Intimidação, Liderança, Performance, Persuasão, Enganação, Insight, Sensorium, Letras, Política, Economia

- [ ] Cada habilidade permite valores 1-3 em criação
- [ ] Validar máximo de 4 com especialidade
- [ ] Permitir apenas 1 especialidade por habilidade
- [ ] Validar distribuição de pontos (11 pontos em criação)

### 1.4 Disciplinas
**Validar conformidade com Clã escolhido (V5 Corebook p. 103-108):**

#### Tremere (Caso de Teste - Silas Renoir):
- [ ] Auspex (obrigatória)
- [ ] Conjuração de Sangue (obrigatória)
- [ ] Ofuscação (obrigatória)
- Máximo em criação: 3

#### Brujah:
- [ ] Celerity
- [ ] Potência
- [ ] Presença

#### Gangrel:
- [ ] Animalismo
- [ ] Ofuscação
- [ ] Vigor

#### Malkavian:
- [ ] Auspex
- [ ] Dementia
- [ ] Obfuscate

#### Ventrue:
- [ ] Dominação
- [ ] Presença
- [ ] Vigor

**Validações Gerais:**
- [ ] Cada clã oferece exatamente 3 disciplinas
- [ ] Apenas 1 ponto em cada disciplina em criação (máx 3 para Thinbloods)
- [ ] Total de 3 pontos para distribuir em disciplinas de clã
- [ ] Validar que não é possível ter disciplinas de clãs diferentes sem justificativa (regra de Thinblood)
- [ ] Cada nível de disciplina desbloqueia seus poderes específicos

### 1.5 Vantagens (Backgrounds) - Validar com V5 Corebook + Players Guide
**Validar 25+ backgrounds conforme livro:**

- [ ] Aliados (1-5 pontos)
- [ ] Contatos (1-5)
- [ ] Domínio (1-5)
- [ ] Infâmia (1-5)
- [ ] Familiares (1-5)
- [ ] Mentor (1-5)
- [ ] Rebanho (1-5)
- [ ] Recursos (1-5)
- [ ] Rivais (1-5)
- [ ] Segredos Enterrados (1-5) ← Silas tem +3
- [ ] Status (1-5)
- [ ] Suportes (1-5)
- [ ] Túmulo (1-5)
- [ ] Acuidade Visual Aguçada (1-5) ← Silas tem +2
- [ ] E outros (validar no Players Guide)

**Validações:**
- [ ] Máximo 7 pontos de backgrounds iniciais
- [ ] Cada background tem descrição/efeito correto
- [ ] Efeitos mecanicamente corretos conforme livro
- [ ] Silas: Validar que "Segredos Enterrados +3" e "Acuidade Visual Aguçada +2" existem

### 1.6 Defeitos - Validar com V5 Corebook
**Validar 20+ defeitos:**

- [ ] Amnésia/Memória Fragmentada (-1 a -4)
- [ ] Lacuna Cognitiva (-2 a -4)
- [ ] Compulsão (-1 a -4)
- [ ] Desejo de Sangue (-1 a -5)
- [ ] Fome Enfurecida (-2 a -4)
- [ ] Ganância (-1 a -3)
- [ ] Lacunas de Conhecimento (-1 a -3)
- [ ] Maldição (-2 a -4)
- [ ] Negligência (-1 a -3)
- [ ] Pacto de Sangue (-1 a -5)
- [ ] Inimigos Poderosos (-1 a -5)
- [ ] Fome Particularidade (-2 a -5)
- [ ] Gasto de Sangue (-1 a -4)
- [ ] E outros

**Validações:**
- [ ] Máximo -7 pontos de defeitos
- [ ] Cada defeito descreve efeito correto
- [ ] Silas: Validar "Memória Fragmentada -3" e "Lacuna Cognitiva (Sabá) -2"
- [ ] Validar que não é possível selecionar defeitos que contradizem backgrounds

### 1.7 Atributos Derivados
- [ ] **Vitalidade:** Mínimo = 3 + (Resistência/2). Validar cálculo automático
- [ ] **Wilpower (Força de Vontade):** Mín = (Compostura + Autocontrole)/2. Máx = 10
- [ ] **Humanidade:** Padrão = 7. Campo editável (reflete perdas por Mancas)
- [ ] **Fome:** Padrão = 0. Incrementável até 5
- [ ] **Potência de Sangue:** Validar (0-5). Silas tem 2
- [ ] **Ressonância:** Selecionar entre 3 tipos (Sanguine, Choleric, Melancholic)
  - [ ] Silas tem Profano (validar se é opção especial)

### 1.8 Dados Pessoais
- [ ] Data de Nascimento (calcula Idade Aparente e Idade Verdadeira)
- [ ] Idade Verdadeira (calculada automaticamente)
- [ ] Data do Abraço
- [ ] Geração (validar cálculo ou seleção)
- [ ] Cronograma aberto para notas

---

## FASE 2: TESTES DE BOTÕES E INTERAÇÕES

### 2.1 Botões de Fome (0-5)
- [ ] Botão "+" incrementa fome até 5
- [ ] Botão "-" decrementa fome até 0
- [ ] Validar que valor máximo é 5
- [ ] Validar que valor mínimo é 0
- [ ] Botão fica desabilitado quando em limite
- [ ] Visual muda conforme nível (cores/ícones)
- [ ] Ao atingir Fome 5, indicar efeito (risco de Roubo de Sangue)

### 2.2 Botões de Vitalidade
- [ ] Botão "+" incrementa vitalidade restaurada
- [ ] Botão "-" diminui vitalidade
- [ ] Validar contra máximo calculado
- [ ] Visual indica saúde (cores por estado: íntegra, ferida leve, ferida séria, incapacitada)
- [ ] Ao chegar em 0, indicar "Incapacitada"

### 2.3 Botões de Potência de Sangue / Vitae
- [ ] Validar piscina de vitae (Potência de Sangue x 2)
- [ ] Botão "+" gasta vitae
- [ ] Botão "-" recupera vitae
- [ ] Máximo = Potência de Sangue x 2

### 2.4 Botões de Força de Vontade
- [ ] Campo mostra piscina de Força de Vontade
- [ ] Botão "+" recupera pontos gastos
- [ ] Botão "-" gasta pontos
- [ ] Máximo = (Compostura + Autocontrole) / 2

### 2.5 Botões de Humanidade
- [ ] Campo editável
- [ ] Valores de 0-10
- [ ] Ao 0, indicar "Perdido para a Besta"
- [ ] Validar penalidades em testes conforme valor

### 2.6 Botões de Mancas (Stains)
- [ ] Incrementar Mancas (0-5)
- [ ] Decrementar Mancas
- [ ] Validar efeito em Humanidade (cada Manca reduz máximo)
- [ ] Visual alerta ao atingir limites críticos

### 2.7 Botões de Ressonância
- [ ] Dropdown para escolher Ressonância
- [ ] Validar que afeta efeitos mecanicamente
- [ ] Seção de Fundo de Sangue vinculada à Ressonância

---

## FASE 3: VALIDAÇÃO CONTRA LIVROS

### 3.1 V5 Corebook Validações
**Clãs (p. 95-108):**
- [ ] Tremere: Auspex, Conjuração de Sangue, Ofuscação ✓
- [ ] Brujah: Celerity, Potência, Presença ✓
- [ ] Gangrel: Animalismo, Ofuscação, Vigor ✓
- [ ] Malkavian: Auspex, Dementia, Obfuscate ✓
- [ ] Ventrue: Dominação, Presença, Vigor ✓
- [ ] [Listar todos os 13 clãs com disciplinas]

**Disciplinas (p. 103-180):**
- [ ] Auspex: Efeitos corretos (Heightened Senses, Sense the Unseen, Premonition, etc.)
- [ ] Conjuração de Sangue: Efeitos corretos
- [ ] Ofuscação: Efeitos corretos
- [ ] Validar que cada poder tem custo de vitae correto
- [ ] Validar descrições não têm alucinhação

**Backgrounds (Players Guide):**
- [ ] Verificar lista de 25+ backgrounds contra livro
- [ ] Validar descrições e efeitos mecanicamente corretos
- [ ] Conferir Silas: "Segredos Enterrados", "Acuidade Visual Aguçada"

**Defeitos (Players Guide):**
- [ ] Verificar 20+ defeitos contra livro
- [ ] Validar descrições
- [ ] Conferir Silas: "Memória Fragmentada", "Lacuna Cognitiva"

### 3.2 V5 Players Guide Validações
- [ ] Thinblood Alchemy (se houver suporte)
- [ ] Backgrounds expandidos
- [ ] Loreheets
- [ ] Pregame Histories

### 3.3 Predadores (Players Guide p. X)
**Validar 9 tipos:**
- [ ] Alchemist - effeitos corretos
- [ ] Bagger - effeitos corretos
- [ ] Bloodhound - effeitos corretos
- [ ] Cleaver - effeitos corretos
- [ ] Graverobber - effeitos corretos
- [ ] Osiris - effeitos corretos
- [ ] Sandman - effeitos corretos
- [ ] Siren - effeitos corretos
- [ ] Strays - effeitos corretos

---

## FASE 4: TESTES DE SESSÃO

### 4.1 Carregamento de Personagem
- [ ] Abrir aba "Sessão"
- [ ] Selecionar personagem criado
- [ ] Validar que todos os dados carregam corretamente
- [ ] Validar que Atributos aparecem com valores corretos
- [ ] Validar que Habilidades carregam
- [ ] Validar que Disciplinas aparecem com efeitos

### 4.2 Gestão de Fome em Sessão
- [ ] Incrementar/Decrementar Fome durante teste
- [ ] Validar limite máximo (5)
- [ ] Validar limite mínimo (0)
- [ ] Testar efeito em testes (cada ponto de Fome = -1 em testes críticos?)
- [ ] Ao Fome 5: Testar Roubo de Sangue (vampiro perde controle em certos cenários)
- [ ] Botão para "Alimentar" (reduz Fome em X)

### 4.3 Gestão de Vitalidade em Sessão
- [ ] Registrar dano recebido
- [ ] Decrementar vitalidade
- [ ] Validar estados (Íntegra → Ferida Leve → Ferida Séria → Incapacitada)
- [ ] Ao Incapacitada: Validar que personagem não consegue agir
- [ ] Testar recuperação (gastar vitae)

### 4.4 Gestão de Força de Vontade em Sessão
- [ ] Gastar Força de Vontade em testes de Resistência
- [ ] Recuperar Força de Vontade
- [ ] Validar máximo
- [ ] Validar efeitos em testes

### 4.5 Humanidade em Sessão
- [ ] Registrar ação que reduz Humanidade
- [ ] Testar Mancas (Stains)
- [ ] Validar penalidades de teste
- [ ] Ao Humanidade 0: Validar que personagem é perdido

### 4.6 Testes de Dados
- [ ] Teste simples (1d10 + Atributo + Habilidade)
- [ ] Validar que Fome afeta sucesso crítico (reduz)
- [ ] Teste de Resistência (gasta Força de Vontade)
- [ ] Teste de Roubo de Sangue (Fome 5)

### 4.7 Disciplinas em Ação
- [ ] Usar Disciplina ativável
- [ ] Validar custo de vitae deduzido
- [ ] Validar que Potência de Sangue limita ativação
- [ ] Testar efeito mecanicamente correto
- [ ] Recarregar vitae e testar novamente

---

## FASE 5: TESTES DE PERSISTÊNCIA E DATA

### 5.1 Salvar Personagem
- [ ] Salvar dados da ficha
- [ ] Fechar e reabrir página
- [ ] Validar que todos os dados persistem
- [ ] Exportar ficha (se houver PDF ou export)

### 5.2 Histórico de Sessão
- [ ] Registrar ações em sessão
- [ ] Validar que histórico salva
- [ ] Reabrir sessão anterior
- [ ] Validar que histórico e estado de personagem estão corretos

---

## FASE 6: TESTES DE EDGE CASES

### 6.1 Limites Extremos
- [ ] Criar personagem com mínimos em tudo (1 em todos Atributos)
- [ ] Criar personagem com máximos em tudo (4 em todos Atributos)
- [ ] Testar com todas as Habilidades em 3
- [ ] Testar com Fome constantemente em 5
- [ ] Testar com Humanidade em 0

### 6.2 Combinações Inválidas
- [ ] Tentar selecionar Disciplina incompatível com Clã
- [ ] Tentar ter +8 pontos de Backgrounds (deve falhar)
- [ ] Tentar ter -8 pontos de Defeitos (deve falhar)
- [ ] Tentar colocar Atributo em 6 (deve falhar)
- [ ] Tentar colocar Habilidade em 5 sem especialidade (verificar regra)

### 6.3 Validação de Fórmulas
- [ ] Vitalidade = 3 + (Resistência / 2)
  - [ ] Resistência 1 = Vitalidade 3
  - [ ] Resistência 2 = Vitalidade 4
  - [ ] Resistência 5 = Vitalidade 5 (com arredondamento)
- [ ] Força de Vontade = (Compostura + Autocontrole) / 2
- [ ] Potência de Sangue máxima = 5 (Ancilla gen 10)

---

## CASO DE TESTE COMPLETO: SILAS RENOIR (Tremere)

### Dados Base
```
Nome: Silas Renoir
Clã: Tremere
Predador: [Selecionar conforme original]
Conceito: O Mapeador Esquecido
Data Nascimento: 1795 (231 anos)
Data Abraço: 1839
Geração: 10ª (Ancillae)
Potência de Sangue: 2
Ressonância: Profano
```

### Atributos (Validar distribuição)
- Força: 2, Destreza: 3, Resistência: 2
- Carisma: 2, Manipulação: 3, Autocontrole: 2
- Inteligência: 3, Raciocínio: 3, Compostura: 2

### Disciplinas (Tremere)
- Auspex: 2 ✓
- Conjuração de Sangue: 3 ✓
- Ofuscação: 3 ✓

### Vantagens Confirmadas
- [ ] Segredos Enterrados +3 (validar que existe e descrição está correta)
- [ ] Acuidade Visual Aguçada +2 (validar que existe)

### Defeitos Confirmados
- [ ] Memória Fragmentada -3 (validar que existe)
- [ ] Lacuna Cognitiva (Sabá) -2 (validar que existe)

### Testes em Sessão
1. [ ] Carregar ficha de Silas
2. [ ] Testar Auspex 2 (custo, efeito)
3. [ ] Testar Conjuração de Sangue 3 (custo, efeito)
4. [ ] Testar Ofuscação 3 (custo, efeito)
5. [ ] Incrementar Fome até 5
6. [ ] Testar combate com Fome alta
7. [ ] Registrar Humanidade > Verificar Mancas
8. [ ] Salvar estado e reabrir

---

## Checklist Final

- [ ] Todas as 13 disciplinas existem e com efeitos corretos
- [ ] Todos os 25+ backgrounds existem e com descrições corretas
- [ ] Todos os 20+ defeitos existem e com descrições corretas
- [ ] Nenhum erro de alucinhação em descrições de poderes
- [ ] Fórmulas de cálculo estão corretas
- [ ] Botões funcionam e têm limites validados
- [ ] Persistência de dados funciona
- [ ] Silas Renoir carrega e funciona sem erros
- [ ] Testes em sessão registram corretamente
- [ ] Histórico de sessão salva e carrega

---

## Notas Importantes
- Usar **V5 Corebook (2018)** como referência principal
- Usar **V5 Players Guide (2022)** para backgrounds expandidos e Predadores
- Validar cada descrição contra livro, NÃO confiar apenas em memória
- Testar casos extremos e limites
- Garantir que nenhuma regra de V5 foi alterada ou interpretada errado
