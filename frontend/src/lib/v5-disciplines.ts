/**
 * Disciplinas e poderes de Vampiro: A Máscara 5ª ed. — dados estáticos.
 *
 * Fonte única e SEGURA PARA CLIENTE (sem imports de servidor): o catálogo V5 do
 * servidor reexporta estes dados, e os componentes de ficha importam `powerDesc()`
 * para mostrar o resumo do poder ao passar o mouse. `desc` é um resumo do efeito
 * (o texto INTEGRAL vem do PDF indexado via RAG, no Chat da campanha).
 */

/** Origem do conteúdo: base = Livro Básico; companion = Guia Suplementar (V5
 * Companion); players_guide = Guia do Jogador (V5 Players Guide). */
export type Source = "base" | "companion" | "players_guide";
export type Power = { level: number; name: string; en: string | null; desc: string | null; source?: Source };
export type DisciplineInfo = { name: string; summary: string; powers: Power[] };

function p(level: number, name: string, en: string | null = null, desc: string | null = null): Power {
  return { level, name, en, desc };
}

// Poder introduzido no V5 Companion (Guia Suplementar) — marcado para a UI.
function pc(level: number, name: string, en: string, desc: string): Power {
  return { level, name, en, desc, source: "companion" };
}

// Poder introduzido no V5 Players Guide (Guia do Jogador) — marcado para a UI.
function pg(level: number, name: string, en: string, desc: string): Power {
  return { level, name, en, desc, source: "players_guide" };
}

export const V5_DISCIPLINES: DisciplineInfo[] = [
  {
    name: "Animalismo",
    summary: "Comunhão e controle de animais e da Besta interior.",
    powers: [
      pg(2, "Mensageiro Animal", "Animal Messenger", "Amálgama com Auspícios 1. Um Rouse Check por noite. O famulus leva uma frase curta até uma pessoa designada e a entrega como se falasse com a voz do vampiro; se não souber onde o alvo está, o rastreia (teste, Dif 2, uma vez por noite)."),
      pg(3, "Comando do Mensageiro", "Messenger's Command", "Amálgama com Dominação 1 (pré-requisito Mensageiro Animal + Compelir ou Hipnotizar). Sem custo próprio. Embute uma ordem de Compelir ou Hipnotizar na mensagem do famulus; o teste ocorre quando o famulus faz contato visual com o alvo."),
      pg(3, "Praga de Bestas", "Plague of Beasts", "Um Rouse Check, teste de Manipulação + Animalismo vs. Compostura + Empatia com Animais. Marca um alvo à vista para que todos os animais e pragas da região o assediem a noite toda: penalidade em perícias igual à margem e +margem para quem o rastreia (não vale em combate). Dura uma noite."),
      pg(4, "Reger o Bando", "Sway the Flock", "Um ou mais Rouse Checks, teste de Compostura + Animalismo. Dita o humor geral dos animais numa área — da apatia sonolenta à fúria indiscriminada; quanto mais sucessos, mais dominados. Área de ~um campo de futebol, ampliável até uma cidadezinha com mais Rouse Checks. Dura uma noite."),
      pg(5, "Instigar o Temperamento Bestial", "Coax the Bestial Temper", "Um Rouse Check, teste de Manipulação + Animalismo (Dif 3). Cantarolando ou rosnando baixo, atiça ou aplaca a Besta de todos os vampiros ao alcance da voz: cada sucesso na margem sobe ou desce em 1 a Dificuldade deles para resistir ao frenesi; se baixar, quem já está em frenesi pode testar para sair dele."),
      p(1, "Sentir a Besta", "Sense the Beast", "Passiva/simples, sem custo. Percebe a Besta em outro ser: raiva contida, Fome, natureza sobrenatural e propensão a frenesi. Se a pessoa esconder, é um teste resistido de Resolução + Animalismo contra Compostura + Lábia."),
      p(1, "Vínculo Famulus", "Bond Famulus", "Ritual longo. Alimenta um animal com o próprio vitae por três noites (um Rouse Check cada) para criar um famulus vinculado, que passa a obedecê-lo e servir de canal para outros poderes de Animalismo."),
      p(2, "Sussurros Selvagens", "Feral Whispers", "Um Rouse Check. Conversa com animais e dá ordens; para bichos comuns o Narrador decide, para tarefas complexas role Manipulação (ou Carisma) + Animalismo. Também convoca criaturas da região da espécie escolhida."),
      p(2, "Suculência Animal", "Animal Succulence", "Passiva. Beber de animais sacia muito mais a Fome — o sangue animal alimenta quase como sangue humano, reduzindo mais pontos de Fome do que o normal."),
      p(3, "Acalmar a Besta", "Quell the Beast", "Um Rouse Check, ação de conflito social: Carisma (intimidar) ou Manipulação (aplacar) + Animalismo contra a vítima. Sufoca a Besta do alvo, deixando-o apático e passivo, ou encerra um frenesi/estado de pânico."),
      p(3, "Colmeia Vívida", "Unliving Hive", "Amálgama com Fortitude 2. Um Rouse Check. Aloja um enxame de insetos dentro do corpo, que pode ser liberado para espionar, atacar ou reforçar outros poderes de Animalismo."),
      p(4, "Subsumir o Espírito", "Subsume the Spirit", "Um Rouse Check, teste de Manipulação + Animalismo. Projeta a própria mente para dentro de um animal e controla o corpo dele; o próprio corpo fica inerte e vulnerável enquanto isso."),
      p(5, "Domínio Animal", "Animal Dominion", "Dois Rouse Checks. Carisma + Animalismo para comandar bandos e matilhas inteiras de uma só espécie ao mesmo tempo, lançando-os contra um alvo ou dirigindo-os por uma cena."),
      p(5, "Extrair a Besta", "Drawing Out the Beast", "Um Rouse Check, teste resistido de Manipulação + Animalismo. Ao entrar em frenesi, expele a própria fúria para outra criatura ou pessoa por perto, que enlouquece no seu lugar."),
    ],
  },
  {
    name: "Auspícios",
    summary: "Sentidos aguçados, percepção sobrenatural e premonições.",
    powers: [
      pg(2, "Revelar o Temperamento", "Reveal Temperament", "Um Rouse Check, teste de Inteligência + Auspícios vs. Compostura + Subterfúgio. Fareja a Ressonância (e Dyscrasias) do sangue de um mortal; contra um vampiro, revela a Ressonância da última vítima dele — e, num crítico, o método e o Tipo de Predador."),
      pg(3, "Falha Fatal", "Fatal Flaw", "Amálgama com Oblivion 1. Um Rouse Check; gasta um turno observando; teste de Inteligência + Auspícios vs. Compostura (fraqueza mental) ou Vigor (física) + Subterfúgio. Revela a menor defesa do alvo: +2 dados em ataques contra ela (e +1 dado a aliados a quem você contar). Dura uma cena."),
      pc(2, "Obeah", "Obeah", "Amálgama com Fortitude 1. Um Rouse Check (e Força de Vontade conforme o caso), teste de Compostura + Auspícios (Dif 2). Cura dano Superficial de Força de Vontade de OUTRA pessoa igual à margem (ou 1 Agravado a cada 3 sucessos); em mortais, também os acalma. Um alvo por noite. Poder dos Salubri."),
      pc(5, "Aliviando a Alma Bestial", "Unburdening the Bestial Soul", "Amálgama com Dominação 3 (pré-requisito Obeah). Dois Rouse Checks e ganha 1 Mancha; uma cena a sós, teste de Compostura + Auspícios vs. Humanidade do alvo. Remove Manchas de um vampiro arrependido (ou o blinda contra Manchas futuras); num crítico, pode restaurar 1 de Humanidade — só uma vez na eternidade. Apenas em vampiros de Humanidade menor que a sua. Assinatura dos Salubri."),
      p(1, "Sentidos Aguçados", "Heightened Senses", "Passiva, ativável de graça. Amplia os cinco sentidos a níveis sobre-humanos (some a Auspícios em testes de percepção). Estímulos súbitos e intensos podem exigir um teste para não ser sobrecarregado."),
      p(1, "Sentir o Invisível", "Sense the Unseen", "Simples, sem custo (ou um Rouse Check para busca ativa). Percebe o sobrenatural oculto — vampiros ofuscados, fantasmas, magia — com um teste de Percepção/Inteligência + Auspícios contra o poder que oculta."),
      p(2, "Premonição", "Premonition", "Passiva; para forçar uma visão, um Rouse Check. Lampejos premonitórios de perigo iminente. O Narrador dá uma pista ou aviso; funciona como um sexto sentido que dispara sozinho em momentos críticos."),
      p(3, "Perscrutar a Alma", "Scry the Soul", "Um Rouse Check, teste de Inteligência + Auspícios contra Compostura + Firmeza. Lê a aura de alguém: emoções, estado (doente, apaixonado, faminto), se é sobrenatural, a ressonância do sangue e as Manchas na alma."),
      p(3, "Compartilhar os Sentidos", "Share the Senses", "Um Rouse Check. Sintoniza os sentidos de outra pessoa e passa a ver e ouvir através dela à distância, mesmo sem que ela saiba; alvos desconhecidos exigem um teste."),
      p(4, "Toque do Espírito", "Spirit's Touch", "Um Rouse Check, teste de Inteligência + Auspícios. Ao tocar um objeto ou local, capta impressões psíquicas das últimas pessoas que o manusearam — emoções, imagens e pistas do passado dele."),
      p(5, "Clarividência", "Clairvoyance", "Um Rouse Check e alguns minutos de concentração; teste de Inteligência + Auspícios. Projeta a percepção para observar um lugar conhecido à distância, colhendo detalhes por vários sentidos."),
      p(5, "Telepatia", "Telepathy", "Um Rouse Check. Lê os pensamentos de superfície de alguém e projeta mensagens mente a mente; ler pensamentos protegidos ou resistidos é um teste de Resolução + Auspícios contra Firmeza + Compostura."),
      p(5, "Possessão", "Possession", "Amálgama com Dominação 3. Dois Rouse Checks, teste resistido de Resolução + Auspícios. Expulsa a mente de um mortal e assume o controle do corpo dele; requer contato visual para iniciar."),
    ],
  },
  {
    name: "Celeridade",
    summary: "Velocidade e reflexos sobre-humanos.",
    powers: [
      pg(2, "Serviço Relâmpago", "Rush Job", "Um Rouse Check. Completa em segundos tarefas de perícia que levariam turnos inteiros — trata uma ação completa como ação menor. Não acelera ataques, defesas nem tarefas resistidas. Dura uma cena."),
      pg(3, "Serpentear", "Weaving", "Pré-requisito: Reflexos Rápidos. Um Rouse Check. Enxerga projéteis como se fossem lentos: não sofre redução de dados ao se defender de múltiplos ataques à distância (Destreza + Atletismo) e ainda soma a Celeridade a todas essas defesas. Dura uma cena."),
      pg(4, "Ímpeto Borrado", "Blurred Momentum", "Um Rouse Check por turno. Seu movimento vira um borrão trêmulo: ataques com menos sucessos que a sua Celeridade sempre erram — mesmo por surpresa ou Golpe Relâmpago."),
      pg(5, "Golpe Invisível", "Unseen Strike", "Amálgama com Ofuscação 4 (pré-requisito Lampejo). Dois Rouse Checks, teste de Destreza + Celeridade vs. Raciocínio + Prontidão. Some da vista e reaparece junto ao inimigo para um golpe: um ataque-surpresa contra Dificuldade 1 (se o alvo perder o teste resistido)."),
      p(1, "Graça Felina", "Cat's Grace", "Passiva, sem custo. Equilíbrio perfeito: passa automaticamente em qualquer teste para manter o equilíbrio, andar em fios, beiras estreitas, etc."),
      p(1, "Reflexos Rápidos", "Rapid Reflexes", "Passiva, sem custo. Reações velozes: permite ações reflexas rápidas e sacar armas ou reagir sem gastar a ação, além de reduzir surpresa."),
      p(2, "Fugacidade", "Fleetness", "Um Rouse Check. Soma a pontuação de Celeridade a qualquer teste de Destreza (fora combate) e à Defesa durante a rodada — reflexos e agilidade sobre-humanos."),
      p(3, "Lampejo", "Blink", "Um Rouse Check. Investe ou salta uma distância curta num único movimento relâmpago, cobrindo o terreno quase instantaneamente para atacar ou fugir."),
      p(3, "Travessia", "Traversal", "Um Rouse Check. Corre em altíssima velocidade sobre superfícies impossíveis (água, paredes verticais) ou dá saltos enormes; role Destreza + Atletismo se houver risco."),
      p(4, "Gole de Elegância", "Draught of Elegance", "Passiva no doador. Seu vitae concede Celeridade temporária a quem o bebe — útil para reforçar aliados ou lacaios, iniciando também um passo do Vínculo de Sangue."),
      p(4, "Pontaria Infalível", "Unerring Aim", "Um Rouse Check, gasto como ação. Percebe o alvo em câmera lenta e mira com precisão sobre-humana: transforma um ataque à distância num acerto quase garantido (dificuldade drasticamente reduzida)."),
      p(5, "Golpe Relâmpago", "Lightning Strike", "Um Rouse Check. Age com velocidade impossível de acompanhar: garante agir primeiro e ataca de forma quase impossível de defender (a vítima não soma Defesa)."),
      p(5, "Fração de Segundo", "Split Second", "Um Rouse Check, reflexa. Move-se tão rápido que altera um instante crucial da cena — aparar uma bala, atravessar uma porta antes que feche — conforme o Narrador aprovar."),
    ],
  },
  {
    name: "Dominação",
    summary: "Controle da mente através de um olhar penetrante. Exige contato visual e uma língua que a vítima entenda.",
    powers: [
      pg(1, "Devoção Servil", "Slavish Devotion", "Amálgama com Fortitude 1. Passiva, sem custo. Quem já está sob a sua Dominação resiste melhor à Dominação de terceiros: qualquer tentativa alheia sofre penalidade de dados igual à sua Fortitude."),
      pg(4, "Domínio Ancestral", "Ancestral Dominion", "Amálgama com Feitiçaria de Sangue 2 (pré-requisito Hipnotizar). Um Rouse Check, teste de Manipulação + Dominação vs. Determinação + Ocultismo. Compele um descendente de sangue a agir por você — sem contato visual nem palavra, transmitido de Sangue a Sangue (desde que não se fira). Cada geração de distância dá +1 dado de resistência ao alvo."),
      pg(4, "Implantar Sugestão", "Implant Suggestion", "Amálgama com Presença 1. Um Rouse Check, teste de Manipulação + Dominação vs. Compostura + Determinação (mortal despreparado dispensa teste). Altera a personalidade ou as opiniões do alvo — desejar um estranho, largar a família, desconfiar das próprias crenças. Mudanças radicais permitem resistir. Dura uma cena."),
      pc(2, "Favor do Domitor", "Domitor's Favor", "Um Rouse Check. Um servo preso a você por Laço de Sangue tem muito mais dificuldade de resistir: as rolagens de Desafio dele sofrem −3 dados e ele não pode gastar Força de Vontade nelas; em falha total, o Laço não enfraquece naquele mês. Favorito dos Tzimisce. Duração: um mês."),
      p(1, "Nublar a Memória", "Cloud Memory", "Um Rouse Check, teste de Carisma + Dominação contra Inteligência + Firmeza se resistido. Apaga da vítima a lembrança do último minuto ou de um momento recente específico."),
      p(1, "Compelir", "Compel", "Sem custo (um Rouse Check se a vítima resistir). Uma ordem curta de uma frase que a vítima obedece imediatamente e de forma literal; Carisma + Dominação contra Inteligência + Firmeza."),
      p(2, "Hipnotizar", "Mesmerize", "Um Rouse Check, teste de Manipulação + Dominação contra Inteligência + Firmeza. Implanta um comando complexo, de várias etapas, que a vítima executa depois, quando o gatilho que você definir ocorrer."),
      p(2, "Demência", "Dementation", "Amálgama com Ofuscação 2. Um Rouse Check, Manipulação + Dominação. Instila distúrbio emocional, ansiedade ou surtos de insanidade na vítima ao longo de uma conversa, sem que ela note a origem."),
      p(3, "A Mente Esquecida", "The Forgetful Mind", "Um Rouse Check, teste de Manipulação + Dominação contra Inteligência + Firmeza. Reescreve ou apaga memórias inteiras da vítima, criando lembranças falsas no lugar."),
      p(3, "Diretiva Submersa", "Submerged Directive", "Adicionada a um uso de Hipnotizar. Deixa um comando latente e adormecido na mente da vítima, que dispara semanas ou meses depois quando o gatilho combinado acontecer."),
      p(4, "Racionalizar", "Rationalize", "Passiva sobre alvos dominados. Faz a vítima acreditar que as ações que você a forçou a cometer foram escolha própria, inventando justificativas — ela não percebe ter sido controlada."),
      p(5, "Manipulação em Massa", "Mass Manipulation", "Um Rouse Check adicional. Amplia qualquer outro poder de Dominação para atingir um grupo inteiro de uma só vez, em vez de uma pessoa."),
      p(5, "Decreto Terminal", "Terminal Decree", "Passiva sobre a Dominação. Remove o limite de autopreservação: suas ordens podem forçar a vítima a se ferir gravemente ou até se matar."),
    ],
  },
  {
    name: "Fortitude",
    summary: "Tenacidade sobrenatural: resistir a dano, fogo e luz solar.",
    powers: [
      pg(2, "Perseverança da Terra", "Earth's Perseverance", "Um Rouse Check. Fica quase impossível de mover: só se desloca se quiser (não protege de ser esmagado ou despedaçado, só de ser empurrado/arrastado). Dura uma cena."),
      pg(2, "Vitae Revigorante", "Invigorating Vitae", "Amálgama com Auspícios 1. Fortalece o poder de cura do seu sangue nos vivos: cada Rouse Check de vitae doado cura 3 níveis de dano (inclusive Agravado) em quem o bebe (mortais e ghouls)."),
      pg(4, "Escamas da Górgona", "Gorgon's Scales", "Um Rouse Check. Concede imunidades/resistências conforme a Ressonância do último sangue bebido: Colérico (estaca no coração não paralisa), Melancólico (Agravado de fogo vira Superficial), Fleumático (+4 dados p/ resistir a Auspícios), Sanguíneo (Agravado de sol vira Superficial)."),
      pc(2, "Valeren", "Valeren", "Amálgama com Auspícios 1. Um Rouse Check (e Vitalidade conforme o caso), teste de Inteligência + Fortitude (Dif 2). Cura dano Superficial de Vitalidade de OUTRO vampiro igual à margem (ou 1 Agravado a cada 3 sucessos). Só em vampiros, um alvo por noite. Cura dos Salubri."),
      p(1, "Resiliência", "Resilience", "Passiva, sem custo. Soma a pontuação de Fortitude à Vitalidade para fins de aparar dano, reduzindo o dano superficial sofrido a cada ataque."),
      p(1, "Mente Inabalável", "Unswayable Mind", "Passiva; um Rouse Check para reforçar. Concede dados extras para resistir a coerção, leitura de mente, intimidação e manipulação sobrenatural."),
      p(2, "Robustez", "Toughness", "Um Rouse Check. Soma a Fortitude ao dano físico aparado e ignora, por uma cena, as penalidades de ferimento causadas pelo dano superficial."),
      p(2, "Bestas Resistentes", "Enduring Beasts", "Amálgama com Animalismo 1. Um Rouse Check. Estende a própria resistência sobrenatural a animais e ao famulus, tornando-os muito mais difíceis de matar."),
      p(3, "Desafiar a Perdição", "Defy Bane", "Um Rouse Check, reflexa, teste de Resolução + Fortitude. Por uma cena, converte dano agravado que sofreria (de fogo, sol ou garras) em dano superficial."),
      p(3, "Fortalecer a Fachada Interior", "Fortify the Inner Facade", "Passiva/reativa. Blinda a mente contra leitura, Auspícios e telepatia — quem tentar sondá-lo enfrenta a Fortitude como resistência."),
      p(4, "Gole de Resistência", "Draught of Endurance", "Passiva no doador. Seu vitae concede Fortitude temporária a quem o bebe, blindando aliados ou lacaios (e iniciando um passo do Vínculo de Sangue)."),
      p(5, "Pele de Mármore", "Flesh of Marble", "Dois Rouse Checks. Por uma cena, a pele fica dura como pedra: ignora automaticamente os primeiros pontos de dano físico de cada ataque recebido."),
      p(5, "Proeza da Dor", "Prowess from Pain", "Um Rouse Check. Converte a dor em força: quanto mais casas de dano tiver na Vitalidade, mais bônus físicos ganha — fica mais forte ao ser ferido."),
    ],
  },
  {
    name: "Ofuscação",
    summary: "Permanecer obscuro e invisível, mesmo em meio a multidões.",
    powers: [
      pg(3, "Labirinto Mental", "Mental Maze", "Amálgama com Dominação 1. Um Rouse Check, teste de Carisma + Ofuscação vs. Raciocínio + Determinação. Tira todo o senso de direção e localização do alvo, prendendo-o no ambiente (não acha portas nem saídas). Dura uma cena."),
      pg(3, "Máscara Mental", "Mind Masque", "Amálgama com Dominação 2. Um Rouse Check. Cria uma persona falsa que engana quem tenta ler sua mente, aura ou emoções (Auspícios, telepatia etc.): quem sonda vê o disfarce, não você. Dura uma cena."),
      pc(2, "Quimerismo", "Chimerstry", "Amálgama com Presença 1. Um Rouse Check, teste de Manipulação + Ofuscação. Cria uma alucinação breve e vívida em um único sentido (um vulto, uma voz), distraindo quem está à vista: −2 dados na próxima ação e, se falhar em Compostura + Raciocínio, perde a próxima ação. Não pode ser gravada. Poder dos Ravnos."),
      pc(3, "Fata Morgana", "Fata Morgana", "Amálgama com Presença 2. Um Rouse Check, teste de Manipulação + Ofuscação (Dif = 1 + nº de sentidos afetados). Cria alucinações elaboradas e multissensoriais que várias vítimas veem, ouvem e sentem — mas que não alteram a realidade (não ferem, não bloqueiam a visão, não são gravadas). Vítimas podem descrer com Inteligência + Prontidão. Dura uma cena. Dos Ravnos."),
      p(1, "Manto de Sombras", "Cloak of Shadows", "Passiva, sem custo. Fica imperceptível enquanto permanecer imóvel e junto a alguma cobertura (parede, sombra, canto); mover-se ou ser procurado ativamente quebra o efeito."),
      p(1, "Silêncio da Morte", "Silence of Death", "Um Rouse Check. Anula todo o som que você produz — passos, voz, tiros — tornando suas ações completamente silenciosas por uma cena."),
      p(2, "Passagem Invisível", "Unseen Passage", "Um Rouse Check. Move-se permanecendo oculto, mesmo andando; deixa de ser notado por observadores, mas interagir bruscamente ou atacar rompe a ofuscação."),
      p(3, "Fantasma na Máquina", "Ghost in the Machine", "Amálgama com Tecnologia (Sabbat) ou Auspícios. Um Rouse Check. Estende a ofuscação a câmeras, sensores e gravações — dispositivos eletrônicos também deixam de registrá-lo."),
      p(3, "Máscara dos Mil Rostos", "Mask of a Thousand Faces", "Um Rouse Check. Projeta uma aparência falsa e comum (um rosto qualquer, esquecível), permitindo passar despercebido em público como outra pessoa anônima."),
      p(4, "Ocultar", "Conceal", "Amálgama com Auspícios 3. Um Rouse Check. Oculta um objeto inanimado ou um local inteiro da percepção alheia, mantendo-os invisíveis mesmo depois que você sai."),
      p(4, "Desaparecer", "Vanish", "Um Rouse Check, ativável como reflexa. Some da vista mesmo estando sob observação direta: ativa a ofuscação no meio de um olhar, apagando-se da mente de quem observa."),
      p(5, "Manto Coletivo", "Cloak the Gathering", "Um Rouse Check por pessoa. Estende a ofuscação a um grupo próximo, ocultando aliados junto com você enquanto eles seguirem suas instruções."),
      p(5, "Disfarce do Impostor", "Impostor's Guise", "Um Rouse Check, teste de Manipulação + Ofuscação. Assume a aparência exata de uma pessoa específica que você já observou, copiando rosto, voz e porte."),
    ],
  },
  {
    name: "Potência",
    summary: "Força e vigor físicos sobre-humanos.",
    powers: [
      pg(2, "Agarre Implacável", "Relentless Grasp", "Um Rouse Check. Seu aperto fica quase impossível de soltar: some a Potência como sucessos automáticos em qualquer tentativa de segurar algo (inclusive manter um agarrão — mas não o agarrão inicial). Dura uma cena."),
      pg(3, "Demolidor", "Wrecker", "Pré-requisito: Proeza. Sem custo extra. Ao usar Proeza para feitos de força que danificam ou destroem objetos inanimados, conta a Potência em dobro. Não serve em combate (leva tempo demais para acumular)."),
      pg(4, "Aterrissagem Devastadora", "Crash Down", "Pré-requisito: Salto Elevado. Um Rouse Check. Ao pousar de um Salto Elevado, gera uma onda de impacto numa pequena área: dano Superficial a quem está por perto e derruba os atingidos."),
      pg(5, "Martelo Sutil", "Subtle Hammer", "Sem custo. Concentra toda a força em movimentos mínimos: ataques desarmados e feitos de força viram ações menores de dois dados. Não te deixa mais forte — só aplica melhor a força que você já tem."),
      p(1, "Corpo Letal", "Lethal Body", "Passiva; um Rouse Check para intensificar. Golpes desarmados causam dano agravado a mortais e ignoram armaduras leves — punhos e chutes viram armas mortais."),
      p(1, "Salto Elevado", "Soaring Leap", "Passiva, sem custo. Salta distâncias horizontais e alturas enormes de um só pulo, alcançando telhados ou cruzando ruas sem impulso."),
      p(2, "Proeza", "Prowess", "Um Rouse Check. Soma a pontuação de Potência ao dano de ataques corpo a corpo e a todos os feitos de força bruta (arrombar, levantar, arremessar) por uma cena."),
      p(3, "Alimentação Brutal", "Brutal Feed", "Sem custo extra. Drena toda uma vítima em segundos, num ato violento e quase sempre letal, em vez do longo beijo do vampiro; útil em combate, mas escancarado."),
      p(3, "Faísca de Fúria", "Spark of Rage", "Amálgama com Presença 3. Um Rouse Check, Manipulação + Potência. Incita raiva e violência súbita numa multidão ou indivíduo, podendo desencadear brigas e frenesi coletivo."),
      p(3, "Aderência Sobrenatural", "Uncanny Grip", "Um Rouse Check. Agarra-se e sustenta o peso em qualquer superfície — paredes lisas, tetos, cordas finas — como se estivesse colado a ela."),
      p(4, "Gole de Poder", "Draught of Might", "Passiva no doador. Seu vitae concede Potência temporária a quem o bebe, reforçando a força de aliados ou lacaios (e iniciando um passo do Vínculo de Sangue)."),
      p(5, "Abalo Sísmico", "Earthshock", "Dois Rouse Checks. Golpeia o chão com força descomunal, gerando uma onda de choque que derruba e fere todos numa área ao redor."),
      p(5, "Punho de Caim", "Fist of Caine", "Um Rouse Check. Concentra força devastadora num golpe capaz de arrancar membros, atravessar paredes e causar dano físico brutal, com ferimentos que custam a sarar."),
    ],
  },
  {
    name: "Presença",
    summary: "Atrair, influenciar e controlar emoções.",
    powers: [
      pg(1, "Olhos da Serpente", "Eyes of the Serpent", "Amálgama com Proteanismo 1. Os olhos viram fendas de serpente e prendem o olhar de um mortal enquanto houver contato visual — ele fica imóvel (ainda fala, mas não grita). Para paralisar um vampiro, vença um teste resistido; ele escapa gastando Força de Vontade."),
      pg(2, "Melpominee", "Melpominee", "Sua voz vira a de uma sereia: pode usar Admiração, Intimidar, Olhar Aterrador, Enlevo e Majestade só pela voz — sem ver o alvo nem estar presente, bastando ser ouvido. Não funciona por gravação/transmissão."),
      pg(3, "Voz Projetada", "Thrown Voice", "Amálgama com Auspícios 1. Um Rouse Check. Faz sua voz sair de qualquer ponto ao seu alcance de visão (de um sussurro a um grito), como se você estivesse lá. Dura uma cena."),
      pg(4, "Impregnar o Edifício", "Suffuse the Edifice", "Estende Admiração, Intimidar e Majestade pela própria estrutura de um prédio: quem está dentro ou o observa reage ao lugar como se você estivesse presente (os bônus se aplicam às reações ao ambiente). Use Majestade com cautela — o efeito é volátil."),
      p(1, "Admiração", "Awe", "Um Rouse Check, teste de Carisma + Presença. Torna-se magneticamente atraente e cativante para todos por perto, que passam a admirá-lo e a lhe dar o benefício da dúvida por uma cena."),
      p(1, "Intimidar", "Daunt", "Um Rouse Check (ou passiva). Projeta uma aura ameaçadora que afasta, intimida e desencoraja os outros de se aproximarem ou confrontá-lo; some a Presença a testes de intimidação."),
      p(2, "Beijo Persistente", "Lingering Kiss", "Passiva ao alimentar-se. Sua mordida causa êxtase viciante que beneficia a vítima temporariamente, mas cria dependência — ela passa a desejar o próximo beijo."),
      p(3, "Olhar Aterrador", "Dread Gaze", "Um Rouse Check, teste de Carisma + Presença contra Compostura + Firmeza. Um olhar e gesto que enchem a vítima de terror, fazendo-a fugir, congelar ou entrar em frenesi de medo."),
      p(3, "Enlevo", "Entrancement", "Um Rouse Check, teste de Manipulação + Presença contra Compostura + Firmeza. Enfeitiça a vítima, que passa a querer agradá-lo e ganhar sua aprovação acima de tudo por horas."),
      p(4, "Voz Irresistível", "Irresistible Voice", "Amálgama passiva com Dominação. Suas ordens de Dominação dispensam o contato visual — basta a voz ser ouvida, permitindo dominar por telefone ou no escuro."),
      p(4, "Convocar", "Summon", "Um Rouse Check, teste de Manipulação + Presença. Chama à distância alguém em quem já usou Presença; a pessoa sente a compulsão de vir até você, atravessando cidades se preciso."),
      p(5, "Majestade", "Majesty", "Dois Rouse Checks, teste de Carisma + Presença contra Compostura + Firmeza. Presença avassaladora e imperial: ninguém ousa atacá-lo, contrariá-lo ou desviar o olhar por uma cena."),
      p(5, "Magnetismo Estelar", "Star Magnetism", "Um Rouse Check adicional. Faz os efeitos de Presença alcançarem através de mídia — transmissões, telas, gravações ao vivo — atingindo quem apenas o vê ou ouve remotamente."),
    ],
  },
  {
    name: "Proteanismo",
    summary: "Mudança de forma: garras, formas bestiais e fusão com a terra.",
    powers: [
      pc(2, "Vicissitude", "Vicissitude", "Amálgama com Dominação 2. Um Rouse Check, teste de Determinação + Proteanismo. Molda a própria carne: cada sucesso é uma alteração (até o valor de Proteanismo), custando 1 ponto de Atributo Físico cada — redistribuir atributos, criar armas ósseas (+2 de dano), armadura ou mudar a aparência. Permanente (curável como Agravado). Assinatura dos Tzimisce."),
      pc(3, "Modelagem de Carne", "Fleshcrafting", "Amálgama com Dominação 2 (pré-requisito Vicissitude). Um Rouse Check, teste de Determinação + Proteanismo (vs. Vigor + Determinação se a vítima resistir). Como Vicissitude, mas moldando o corpo de OUTROS — aliado voluntário ou vítima contida. Leva uma cena; temida como ferramenta de tortura dos Tzimisce."),
      pc(4, "Forma Hedionda", "Horrid Form", "Amálgama com Dominação 2 (pré-requisito Vicissitude). Um Rouse Check. Assume uma forma monstruosa (garras, presas, músculos) com um número de alterações de Vicissitude grátis (sem perder Atributos) igual ao Proteanismo. Enquanto ativa, críticos viram desastrosos e testes de frenesi ficam +2 de Dificuldade; você mal se comunica. Dura uma cena."),
      pc(5, "Um com a Terra", "One with the Land", "Amálgama com Animalismo 2 (pré-requisito Fundir-se à Terra). Dois Rouse Checks. Como Fundir-se à Terra, mas em qualquer superfície (paredes, assoalho, água parada), e você percebe o que acontece num raio de ~1,6 km através dos animais da região. Sair antes do anoitecer seguinte exige Determinação + Proteanismo (Dif 4). Dos Tzimisce."),
      p(1, "Olhos da Besta", "Eyes of the Beast", "Passiva, sem custo. Enxerga perfeitamente no escuro total; ao ativar, os olhos brilham de forma bestial, servindo também para intimidar."),
      p(1, "Peso da Pluma", "Weight of the Feather", "Passiva, reflexa, sem custo. Torna-se leve como uma pluma: ignora dano de quedas, caminha sobre superfícies frágeis e resiste a ser derrubado ou empurrado."),
      p(2, "Armas Ferais", "Feral Weapons", "Um Rouse Check. Faz crescer garras longas e afiadas (ou presas) que causam dano agravado em combate e servem para escalar e dilacerar; dura uma cena."),
      p(3, "Fundir-se à Terra", "Earth Meld", "Um Rouse Check. Afunda e se funde ao solo natural, ficando protegido e escondido dentro da terra durante o dia ou para descansar em segurança."),
      p(3, "Mudança de Forma", "Shapechange", "Um Rouse Check. Assume a forma de um animal do tamanho de um humano — geralmente lobo ou morcego grande — mantendo a mente e ganhando as capacidades do bicho."),
      p(4, "Metamorfose", "Metamorphosis", "Dois Rouse Checks. Amplia a mudança de forma para criaturas muito maiores ou menores, ou formas monstruosas e híbridas, incluindo enxames e bestas colossais."),
      p(5, "Forma de Névoa", "Mist Form", "Um Rouse Check. Dissolve-se em névoa: fica imune à maior parte do dano físico e atravessa frestas, grades e fechaduras, embora vulnerável a vento e fogo."),
      p(5, "O Coração Livre", "The Unfettered Heart", "Passiva, um Rouse Check para ativar. Desloca o próprio coração dentro do corpo, tornando o estaqueamento quase impossível de acertar."),
    ],
  },
  {
    name: "Feitiçaria de Sangue",
    summary: "Magia do sangue (exclusiva de alguns clãs); além dos poderes, há rituais aprendidos à parte.",
    powers: [
      p(1, "Vitae Corrosivo", "Corrosive Vitae", "Um Rouse Check. Torna uma porção do próprio sangue num ácido capaz de corroer e derreter matéria — metal, madeira, fechaduras, correntes."),
      p(1, "Gosto pelo Sangue", "A Taste for Blood", "Sem custo, ao provar um pouco do sangue de alguém. Teste de Inteligência + Feitiçaria de Sangue revela dados sobre a criatura: humano/vampiro, geração aproximada, ressonância e se se alimentou há pouco."),
      p(2, "Extinguir Vitae", "Extinguish Vitae", "Um Rouse Check, teste de Resolução + Feitiçaria de Sangue contra Firmeza + Compostura. Queima o sangue armazenado da vítima, forçando Rouse Checks extras que elevam a Fome dela — chega a arrastá-la para o frenesi."),
      p(3, "Sangue de Potência", "Blood of Potency", "Um Rouse Check, teste de Resolução + Feitiçaria de Sangue. Eleva temporariamente a própria Potência de Sangue por uma cena, potencializando disciplinas e superando limites de geração."),
      p(3, "Toque do Escorpião", "Scorpion's Touch", "Um Rouse Check, teste de Força/Destreza + Feitiçaria de Sangue. Converte o vitae num veneno paralisante aplicado por toque ou em uma lâmina, reduzindo os atributos físicos da vítima."),
      p(4, "Roubo de Vitae", "Theft of Vitae", "Um Rouse Check, teste de Resolução + Feitiçaria de Sangue contra a vítima. Arranca o sangue do alvo à distância, num jorro que cruza o ar até você, saciando a própria Fome."),
      p(5, "Carícia de Baal", "Baal's Caress", "Um Rouse Check. Envenena o próprio sangue em lâminas ou toques de modo que cause dano agravado a quem for atingido — uma arma mortal contra mortais e vampiros."),
      p(5, "Caldeirão de Sangue", "Cauldron of Blood", "Dois Rouse Checks, teste de Resolução + Feitiçaria de Sangue contra Firmeza + Compostura. Ferve o sangue dentro do corpo da vítima, causando dano agravado devastador; exige contato visual."),
    ],
  },
  {
    name: "Alquimia de Sangue-Ralo",
    summary: "Fórmulas alquímicas dos sangues-ralos (o nível indica a potência da fórmula destilada).",
    powers: [
      p(1, "Alcance Distante", "Far Reach", "Uma fórmula alquímica (custa Rouse Checks para destilar). Concede telecinese: move, puxa e arremessa objetos ou pessoas à distância com um teste de Resolução + Alquimia de Sangue-Ralo."),
      p(1, "Névoa", "Haze", "Fórmula de nível 1. Exala uma névoa densa que cobre a área e obscurece a visão, criando cobertura para fugir, esconder-se ou preparar uma emboscada."),
      p(2, "Envolver", "Envelop", "Fórmula de nível 2. A névoa se concentra ao redor de um alvo, sufocando-o e cegando-o; a vítima resiste com testes conforme luta para escapar."),
      p(2, "Hieros Gamos Profano", "Profane Hieros Gamos", "Fórmula de nível 2. Ritual alquímico que troca temporariamente de corpo (ou aparência) com outra pessoa, permitindo assumir a vida e a forma dela por um tempo."),
      p(3, "Desfracionar", "Defractionate", "Fórmula de nível 3. Reconstitui sangue estocado, fracionado ou desidratado (bolsas de banco de sangue) de volta a um estado que vampiros conseguem beber e digerir."),
      p(4, "Ímpeto Aéreo", "Airborne Momentum", "Fórmula de nível 4. Concede a si mesmo a capacidade de voar ou planar por uma cena, movendo-se pelo ar com um teste de Destreza/Resolução + Alquimia de Sangue-Ralo."),
      p(5, "Despertar o Adormecido", "Awaken the Sleeper", "Fórmula de nível 5. Desperta à força um vampiro em torpor ou no sono diurno, arrancando-o do descanso mesmo contra a vontade dele."),
    ],
  },
];

// Busca por nome (tolerante a acentuação/caixa/espaços) → resumo do poder.
const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");

const POWER_BY_NAME = new Map<string, Power>();
for (const d of V5_DISCIPLINES) for (const pw of d.powers) POWER_BY_NAME.set(norm(pw.name), pw);

/** Resumo do efeito de um poder de disciplina, ou undefined se desconhecido. */
export function powerDesc(name: string): string | undefined {
  return POWER_BY_NAME.get(norm(name))?.desc ?? undefined;
}

/** Origem de um poder ("companion" para o Guia Suplementar), ou undefined. */
export function powerSource(name: string): Source | undefined {
  return POWER_BY_NAME.get(norm(name))?.source;
}
