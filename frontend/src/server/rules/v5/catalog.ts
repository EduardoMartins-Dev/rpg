/**
 * Port of backend/src/main/java/com/portalrpg/rules/V5Catalog.java. Static V5 reference
 * data only — names, levels, mechanics summaries. The INTEGRAL text of powers/lore comes
 * from the indexed PDF at runtime (RAG), never hardcoded here.
 */

// --- Clãs (núcleo + Companion) ------------------------------------------------

export const CLANS_ENUM = [
  "BRUJAH", "GANGREL", "MALKAVIAN", "NOSFERATU", "TOREADOR", "TREMERE", "VENTRUE",
  "BANU_HAQIM", "HECATA", "LASOMBRA", "MINISTRY",
  "CAITIFF", "THIN_BLOOD", "RAVNOS", "SALUBRI", "TZIMISCE",
] as const;
export type Clan = (typeof CLANS_ENUM)[number];

export type ClanInfo = {
  clan: Clan;
  label: string;
  description: string;
  disciplines: string[];
  bane: string;
  compulsion: string;
};

const CLANS: Record<Clan, ClanInfo> = {
  BRUJAH: {
    clan: "BRUJAH", label: "Brujah",
    description: "Rebeldes apaixonados e guerreiros-filósofos. Ser Brujah é arder por uma causa e lutar contra a injustiça — e contra a própria fúria, sempre à flor da pele.",
    disciplines: ["Celeridade", "Potência", "Presença"],
    bane: "Frenesi de fúria mais fácil: penalidade igual à Gravidade da Perdição em testes para resistir à fúria.",
    compulsion: "Rebelião",
  },
  GANGREL: {
    clan: "GANGREL", label: "Gangrel",
    description: "Nômades ferais, os mais próximos da Besta. Sobrevivem sozinhos, leem a estrada e a natureza — e a cada frenesi se parecem um pouco mais com os animais.",
    disciplines: ["Animalismo", "Fortitude", "Proteanismo"],
    bane: "Ao entrar em frenesi, ganham traços animais (penalidade ligada à Gravidade da Perdição) que perduram.",
    compulsion: "Impulsos Ferais",
  },
  MALKAVIAN: {
    clan: "MALKAVIAN", label: "Malkavian",
    description: "Visionários tocados pela loucura. Enxergam padrões e verdades ocultas que os outros não veem — ao preço de uma mente fraturada que distorce a percepção.",
    disciplines: ["Auspícios", "Dominação", "Ofuscação"],
    bane: "Carregam uma perturbação mental que se manifesta sob estresse, impondo penalidade conforme a Gravidade da Perdição.",
    compulsion: "Delírio",
  },
  NOSFERATU: {
    clan: "NOSFERATU", label: "Nosferatu",
    description: "Monstros deformados condenados às sombras e aos esgotos. Trocam a aparência por segredos: são os melhores espiões e informantes da noite.",
    disciplines: ["Animalismo", "Ofuscação", "Potência"],
    bane: "Repugnantes: contam como tendo Aparência 0 e falham em testes sociais que dependam de causar boa impressão.",
    compulsion: "Criptofilia",
  },
  TOREADOR: {
    clan: "TOREADOR", label: "Toreador",
    description: "Estetas apaixonados pela beleza, pela arte e pelo prazer. Atravessam a eternidade atrás da obra ou do instante perfeito — e se perdem nele.",
    disciplines: ["Auspícios", "Celeridade", "Presença"],
    bane: "Na ausência de beleza ao redor, perdem dados (igual à Gravidade da Perdição) ou ficam fascinados.",
    compulsion: "Obsessão",
  },
  TREMERE: {
    clan: "TREMERE", label: "Tremere",
    description: "Feiticeiros de sangue numa hierarquia rígida. Trocaram a magia mortal pela Feitiçaria de Sangue e por uma pirâmide de poder, lealdade e segredos.",
    disciplines: ["Auspícios", "Dominação", "Feitiçaria de Sangue"],
    bane: "Seu Laço de Sangue é instável: ligam-se com facilidade e seu vitae não cria laços como o de outros clãs.",
    compulsion: "Perfeccionismo",
  },
  VENTRUE: {
    clan: "VENTRUE", label: "Ventrue",
    description: "Os 'Reis' da estirpe: líderes e aristocratas natos. Assumem o comando por direito presumido — e carregam um paladar de sangue exigente e seletivo.",
    disciplines: ["Dominação", "Fortitude", "Presença"],
    bane: "Só conseguem se alimentar de um tipo específico de presa; outro sangue é vomitado.",
    compulsion: "Arrogância",
  },
  BANU_HAQIM: {
    clan: "BANU_HAQIM", label: "Banu Haqim",
    description: "Juízes e assassinos guerreiros. Caçam quem viola sua lei e sentem uma atração perigosa pelo sangue de outros vampiros.",
    disciplines: ["Feitiçaria de Sangue", "Celeridade", "Ofuscação"],
    bane: "Ao saciar Fome com o sangue de outro vampiro, testam frenesi de Fome (Dif 2 + Gravidade da Perdição) para não cometer diablerie.",
    compulsion: "Julgamento",
  },
  HECATA: {
    clan: "HECATA", label: "Hecata",
    description: "A Família da Morte: necromantes que negociam com os mortos e com o outro lado, mantendo laços de sangue e de família além da sepultura.",
    disciplines: ["Auspícios", "Fortitude", "Oblivion"],
    bane: "O Beijo deles é sempre doloroso: a presa nunca sente prazer e tende a resistir e se debater.",
    compulsion: "Morbidez",
  },
  LASOMBRA: {
    clan: "LASOMBRA", label: "Lasombra",
    description: "Predadores das sombras, ambiciosos e implacáveis. Comandam a escuridão e sobem pela hierarquia passando por cima de quem for preciso.",
    disciplines: ["Dominação", "Oblivion", "Potência"],
    bane: "Imagem distorcida em espelhos e gravações; perturbam aparelhos eletrônicos sensíveis ao toque.",
    compulsion: "Crueldade",
  },
  MINISTRY: {
    clan: "MINISTRY", label: "Ministério",
    description: "Herdeiros de Set: tentadores que libertam — e escravizam — os outros pelos próprios vícios e transgressões.",
    disciplines: ["Ofuscação", "Presença", "Proteanismo"],
    bane: "A luz forte os fere mais: penalidade de dados igual à Gravidade da Perdição e dano aumentado por luz/sol.",
    compulsion: "Transgressão",
  },
  CAITIFF: {
    clan: "CAITIFF", label: "Caitiff",
    description: "Sem clã: herança incerta, sem fraqueza fixa nem disciplinas próprias.",
    disciplines: [],
    bane: "nenhuma", compulsion: "Defeito Suspeito",
  },
  THIN_BLOOD: {
    clan: "THIN_BLOOD", label: "Sangue Fraco",
    description: "Geração distante, quase mortais; sobrevivem pela Alquimia.",
    disciplines: ["Alquimia"],
    bane: "sofre dano como mortal", compulsion: "nenhuma",
  },
  RAVNOS: {
    clan: "RAVNOS", label: "Ravnos",
    description: "Andarilhos ilusionistas, amaldiçoados a nunca repousar no mesmo lugar.",
    disciplines: ["Animalismo", "Ofuscação", "Presença"],
    bane: "queima ao dormir 2x no mesmo local em 7 noites (dano agravado por Gravidade da Perdição)",
    compulsion: "Destino Tentador",
  },
  SALUBRI: {
    clan: "SALUBRI", label: "Salubri",
    description: "Curandeiros caçados, marcados pelo terceiro olho que chora sangue.",
    disciplines: ["Auspícios", "Dominação", "Fortitude"],
    bane: "caçados: quem bebe seu vitae testa frenesi p/ parar; 3º olho chora sangue ao usar disciplina",
    compulsion: "Empatia Afetiva",
  },
  TZIMISCE: {
    clan: "TZIMISCE", label: "Tzimisce",
    description: "Senhores territoriais que moldam carne e terra à própria vontade.",
    disciplines: ["Animalismo", "Dominação", "Proteanismo"],
    bane: "enraizado: dormir cercado da posse escolhida ou dano agravado à FdV",
    compulsion: "Cobiça",
  },
};

export function clans(): ClanInfo[] {
  return Object.values(CLANS);
}

export function clan(c: Clan): ClanInfo {
  const info = CLANS[c];
  if (!info) throw new Error(`unknown clan: ${c}`);
  return info;
}

export function clanOf(name: string): Clan {
  const key = name.trim().toUpperCase().replace(/-/g, "_").replace(/ /g, "_");
  if ((CLANS_ENUM as readonly string[]).includes(key)) {
    return key as Clan;
  }
  throw new Error(`unknown clan: ${name}`);
}

// --- Habilidades (27, 3 categorias) --------------------------------------------

export type AbilityCategory = "FISICAS" | "SOCIAIS" | "MENTAIS";
export type Ability = { name: string; category: AbilityCategory };

const ABILITIES: Ability[] = [
  // Físicas (9)
  { name: "Armas Brancas", category: "FISICAS" },
  { name: "Armas de Fogo", category: "FISICAS" },
  { name: "Atletismo", category: "FISICAS" },
  { name: "Briga", category: "FISICAS" },
  { name: "Condução", category: "FISICAS" },
  { name: "Furtividade", category: "FISICAS" },
  { name: "Ladroagem", category: "FISICAS" },
  { name: "Ofícios", category: "FISICAS" },
  { name: "Sobrevivência", category: "FISICAS" },
  // Sociais (9)
  { name: "Empatia com Animais", category: "SOCIAIS" },
  { name: "Etiqueta", category: "SOCIAIS" },
  { name: "Sagacidade", category: "SOCIAIS" },
  { name: "Intimidação", category: "SOCIAIS" },
  { name: "Liderança", category: "SOCIAIS" },
  { name: "Performance", category: "SOCIAIS" },
  { name: "Persuasão", category: "SOCIAIS" },
  { name: "Manha", category: "SOCIAIS" },
  { name: "Subterfúgio", category: "SOCIAIS" },
  // Mentais (9)
  { name: "Erudição", category: "MENTAIS" },
  { name: "Percepção", category: "MENTAIS" },
  { name: "Ciência", category: "MENTAIS" },
  { name: "Finanças", category: "MENTAIS" },
  { name: "Investigação", category: "MENTAIS" },
  { name: "Medicina", category: "MENTAIS" },
  { name: "Ocultismo", category: "MENTAIS" },
  { name: "Política", category: "MENTAIS" },
  { name: "Tecnologia", category: "MENTAIS" },
];

export function abilities(category?: AbilityCategory): Ability[] {
  return category ? ABILITIES.filter((a) => a.category === category) : ABILITIES;
}

// --- Disciplinas ----------------------------------------------------------------

export type Power = { level: number; name: string; en: string | null; desc: string | null };
export type DisciplineInfo = { name: string; summary: string; powers: Power[] };

function p(level: number, name: string, en: string | null = null, desc: string | null = null): Power {
  return { level, name, en, desc };
}

const DISCIPLINES: DisciplineInfo[] = [
  {
    name: "Animalismo",
    summary: "Comunhão e controle de animais e da Besta interior.",
    powers: [
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

export function disciplines(): DisciplineInfo[] {
  return DISCIPLINES;
}

// --- Tipos de Predador -----------------------------------------------------------

export type PredatorType = { name: string; summary: string; disciplines: string[] };

const PREDATORS: PredatorType[] = [
  { name: "Gatuno", summary: "Caça pela força e violência, em becos e ruas.", disciplines: ["Celeridade", "Potência"] },
  { name: "Sacoleiro", summary: "Compra ou rouba sangue preservado (bolsas).", disciplines: ["Feitiçaria de Sangue", "Ofuscação"] },
  { name: "Sanguessuga", summary: "Alimenta-se de outros vampiros.", disciplines: ["Celeridade", "Proteanismo"] },
  { name: "Provedor", summary: "Alimenta-se de pessoas próximas / da própria família.", disciplines: ["Dominação", "Animalismo"] },
  { name: "Consensualista", summary: "Só se alimenta com consentimento.", disciplines: ["Auspícios", "Fortitude"] },
  { name: "Fazendeiro", summary: "Alimenta-se de animais.", disciplines: ["Animalismo", "Proteanismo"] },
  { name: "Osíris", summary: "Alimenta-se de seu culto, fãs ou seguidores.", disciplines: ["Feitiçaria de Sangue", "Presença"] },
  { name: "Sandman", summary: "Alimenta-se de vítimas adormecidas.", disciplines: ["Auspícios", "Ofuscação"] },
  { name: "Rainha da Cena", summary: "Alimenta-se de uma subcultura que adora.", disciplines: ["Ofuscação", "Presença"] },
  { name: "Sereia", summary: "Alimenta-se por sedução.", disciplines: ["Fortitude", "Presença"] },
];

export function predatorTypes(): PredatorType[] {
  return PREDATORS;
}

// --- Antecedentes/Vantagens e Defeitos --------------------------------------------
// Extraído do Livro Básico de V5 (capítulo Vantagens/Advantages). `group` reproduz as
// categorias do livro para o seletor agrupar como na ficha oficial; `hint` traz a faixa
// de pontos de cada um. Nomes em PT (edição Galápagos); ids ficam implícitos no nome.

export type MeritOption = { name: string; group: string; hint?: string };

// Vantagens = Antecedentes + Méritos (e aprimoramentos de Refúgio/Máscara).
const ADVANTAGES: MeritOption[] = [
  // Antecedentes
  { name: "Aliados", group: "Antecedentes", hint: "1–6" },
  { name: "Contatos", group: "Antecedentes", hint: "1–3" },
  { name: "Fama", group: "Antecedentes", hint: "1–5" },
  { name: "Influência", group: "Antecedentes", hint: "1–5" },
  { name: "Refúgio", group: "Antecedentes", hint: "1–3" },
  { name: "Rebanho", group: "Antecedentes", hint: "1–5" },
  { name: "Máscara", group: "Antecedentes", hint: "1–2" },
  { name: "Mawla", group: "Antecedentes", hint: "1–5" },
  { name: "Recursos", group: "Antecedentes", hint: "1–5" },
  { name: "Lacaios", group: "Antecedentes", hint: "1–3" },
  { name: "Status", group: "Antecedentes", hint: "1–5" },
  // Méritos — Aparência
  { name: "Belo", group: "Aparência", hint: "2" },
  { name: "Deslumbrante", group: "Aparência", hint: "4" },
  // Méritos — Linguística
  { name: "Linguística", group: "Linguística", hint: "1 idioma por ponto" },
  // Méritos — Uso de Substâncias
  { name: "Viciado Funcional", group: "Uso de Substâncias", hint: "1" },
  // Méritos — Vínculo de Sangue
  { name: "Resistência ao Vínculo", group: "Vínculo de Sangue", hint: "1–3" },
  { name: "Vínculo Curto", group: "Vínculo de Sangue", hint: "2" },
  { name: "Inligável", group: "Vínculo de Sangue", hint: "5" },
  // Méritos — Alimentação
  { name: "Sabujo", group: "Alimentação", hint: "1" },
  { name: "Estômago de Ferro", group: "Alimentação", hint: "3" },
  // Méritos — Míticos
  { name: "Comer Comida", group: "Míticos", hint: "2" },
  // Aprimoramentos de Refúgio (somam ao valor-base do Refúgio)
  { name: "Arsenal Oculto", group: "Refúgio · aprimoramentos", hint: "por ponto" },
  { name: "Cela", group: "Refúgio · aprimoramentos", hint: "por ponto" },
  { name: "Guardas", group: "Refúgio · aprimoramentos", hint: "por ponto" },
  { name: "Laboratório", group: "Refúgio · aprimoramentos", hint: "por ponto" },
  { name: "Biblioteca", group: "Refúgio · aprimoramentos", hint: "por ponto" },
  { name: "Localização", group: "Refúgio · aprimoramentos", hint: "por ponto" },
  { name: "Luxo", group: "Refúgio · aprimoramentos", hint: "por ponto" },
  { name: "Saída Secreta", group: "Refúgio · aprimoramentos", hint: "por ponto" },
  { name: "Sistema de Segurança", group: "Refúgio · aprimoramentos", hint: "por ponto" },
  { name: "Sala Cirúrgica", group: "Refúgio · aprimoramentos", hint: "por ponto" },
  { name: "Proteção Mágica", group: "Refúgio · aprimoramentos", hint: "por ponto" },
  // Aprimoramentos de Máscara (exigem Máscara ••)
  { name: "Zerado", group: "Máscara · aprimoramentos", hint: "1 · requer Máscara ••" },
  { name: "Falsário", group: "Máscara · aprimoramentos", hint: "1 · requer Máscara ••" },
];

// Defeitos, agrupados pelo Antecedente/Mérito de onde derivam.
const FLAWS: MeritOption[] = [
  // Antecedentes
  { name: "Inimigo", group: "Antecedentes", hint: "1+" },
  { name: "Adversário", group: "Antecedentes", hint: "1–5" },
  { name: "Segredo Sombrio", group: "Antecedentes", hint: "1" },
  { name: "Infâmia", group: "Antecedentes", hint: "1–2" },
  { name: "Malvisto", group: "Antecedentes", hint: "1" },
  { name: "Desprezado", group: "Antecedentes", hint: "2" },
  { name: "Predador Óbvio", group: "Antecedentes", hint: "2" },
  { name: "Miserável", group: "Antecedentes", hint: "1" },
  { name: "Perseguidores", group: "Antecedentes", hint: "1" },
  { name: "Suspeito", group: "Antecedentes", hint: "1" },
  { name: "Rejeitado", group: "Antecedentes", hint: "2" },
  // Refúgio
  { name: "Sem Refúgio", group: "Refúgio", hint: "1" },
  { name: "Assombrado", group: "Refúgio", hint: "1" },
  { name: "Sinistro", group: "Refúgio", hint: "1" },
  { name: "Comprometido", group: "Refúgio", hint: "2" },
  // Máscara
  { name: "Cadáver Conhecido", group: "Máscara", hint: "1" },
  { name: "Blankbody Conhecido", group: "Máscara", hint: "2" },
  // Aparência
  { name: "Feio", group: "Aparência", hint: "1" },
  { name: "Repulsivo", group: "Aparência", hint: "2" },
  // Uso de Substâncias
  { name: "Vício", group: "Uso de Substâncias", hint: "1" },
  { name: "Vício Incurável", group: "Uso de Substâncias", hint: "2" },
  // Arcaico
  { name: "Vivendo no Passado", group: "Arcaico", hint: "1" },
  { name: "Arcaico", group: "Arcaico", hint: "2" },
  // Vínculo de Sangue
  { name: "Viciado em Vínculo", group: "Vínculo de Sangue", hint: "1" },
  { name: "Vínculo Longo", group: "Vínculo de Sangue", hint: "1" },
  { name: "Escravo do Vínculo", group: "Vínculo de Sangue", hint: "2" },
  // Alimentação
  { name: "Presa Restrita", group: "Alimentação", hint: "1" },
  { name: "Sede de Matusalém", group: "Alimentação", hint: "1" },
  { name: "Organívoro", group: "Alimentação", hint: "2" },
  { name: "Vegano", group: "Alimentação", hint: "2" },
  // Míticos
  { name: "Perdição Folclórica", group: "Míticos", hint: "1" },
  { name: "Bloqueio Folclórico", group: "Míticos", hint: "1" },
  { name: "Estigma", group: "Míticos", hint: "1" },
  { name: "Isca de Estaca", group: "Míticos", hint: "2" },
  // Linguística
  { name: "Analfabeto", group: "Linguística", hint: "2" },
];

export function advantages(): MeritOption[] {
  return ADVANTAGES;
}

export function flaws(): MeritOption[] {
  return FLAWS;
}

// --- Ressonâncias do sangue + Tipos de Coterie ------------------------------------

export type Resonance = { name: string; emotion: string; disciplines: string[] };

const RESONANCES: Resonance[] = [
  { name: "Colérico", emotion: "raiva, violência", disciplines: ["Celeridade", "Potência"] },
  { name: "Melancólico", emotion: "tristeza, medo", disciplines: ["Fortitude", "Ofuscação"] },
  { name: "Fleumático", emotion: "calma, preguiça, controle", disciplines: ["Auspícios", "Dominação"] },
  { name: "Sanguíneo", emotion: "alegria, desejo, paixão", disciplines: ["Feitiçaria de Sangue", "Presença"] },
  { name: "Animal", emotion: "sangue de animais", disciplines: ["Animalismo", "Proteanismo"] },
];

export function resonances(): Resonance[] {
  return RESONANCES;
}

export type CoterieType = { name: string; summary: string };

const COTERIES: CoterieType[] = [
  { name: "Grupo de Caça", summary: "Captura presas para terceiros ou para a própria mesa." },
  { name: "Guarda Diurna", summary: "Protege os não-vivos enquanto dormem durante o dia." },
  { name: "Nômades", summary: "Viaja de um lugar a outro, sem refúgio fixo." },
  { name: "Questári", summary: "Busca realizar um grande empreendimento ou objetivo." },
  { name: "Recência", summary: "Administra os negócios até que um ancião retorne." },
  { name: "Coterie Social", summary: "Reúne-se por status, prazer e influência." },
];

export function coterieTypes(): CoterieType[] {
  return COTERIES;
}

// --- Tabela de Potência de Sangue 0–6 (errata Companion) --------------------------

export type BloodPotencyTier = {
  potency: number;
  bloodSurge: number;
  rouseReroll: number;
  disciplineBonus: number;
  baneSeverity: number;
  mendingRouse: number;
};

const BLOOD_POTENCY: BloodPotencyTier[] = [
  { potency: 0, bloodSurge: 1, rouseReroll: 0, disciplineBonus: 0, baneSeverity: 0, mendingRouse: 1 },
  { potency: 1, bloodSurge: 2, rouseReroll: 1, disciplineBonus: 0, baneSeverity: 2, mendingRouse: 1 },
  { potency: 2, bloodSurge: 2, rouseReroll: 1, disciplineBonus: 1, baneSeverity: 2, mendingRouse: 2 },
  { potency: 3, bloodSurge: 3, rouseReroll: 2, disciplineBonus: 1, baneSeverity: 3, mendingRouse: 2 },
  { potency: 4, bloodSurge: 3, rouseReroll: 2, disciplineBonus: 2, baneSeverity: 3, mendingRouse: 3 },
  { potency: 5, bloodSurge: 4, rouseReroll: 3, disciplineBonus: 2, baneSeverity: 4, mendingRouse: 3 },
  { potency: 6, bloodSurge: 4, rouseReroll: 3, disciplineBonus: 3, baneSeverity: 4, mendingRouse: 3 },
];

export function bloodPotency(potency: number): BloodPotencyTier {
  if (potency < 0 || potency > 6) {
    throw new Error(`blood potency out of range 0–6: ${potency}`);
  }
  return BLOOD_POTENCY[potency];
}

// --- Tipos de personagem -----------------------------------------------------------

export const CHARACTER_TYPES = ["VAMPIRO", "MORTAL", "CARNICAL"] as const;
export type CharacterType = (typeof CHARACTER_TYPES)[number];
