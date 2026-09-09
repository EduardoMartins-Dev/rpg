/**
 * Port of backend/src/main/java/com/portalrpg/rules/V5Catalog.java. Static V5 reference
 * data only — names, levels, mechanics summaries. The INTEGRAL text of powers/lore comes
 * from the indexed PDF at runtime (RAG), never hardcoded here.
 */

import { V5_ADVANTAGES, V5_FLAWS, type MeritOption } from "@/lib/v5-merits";
import { V5_DISCIPLINES, type Power, type DisciplineInfo, type Source } from "@/lib/v5-disciplines";

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
  source?: Source; // "companion" para clãs do Guia Suplementar; ausente = Livro Básico
  baneVariant?: string; // Bane alternativo do V5 Players Guide (p.56), opcional
  archetypes?: { name: string; desc: string }[]; // Arquétipos de conceito (V5 Players Guide)
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
    source: "companion",
  },
  SALUBRI: {
    clan: "SALUBRI", label: "Salubri",
    description: "Curandeiros caçados, marcados pelo terceiro olho que chora sangue.",
    disciplines: ["Auspícios", "Dominação", "Fortitude"],
    bane: "caçados: quem bebe seu vitae testa frenesi p/ parar; 3º olho chora sangue ao usar disciplina",
    compulsion: "Empatia Afetiva",
    source: "companion",
  },
  TZIMISCE: {
    clan: "TZIMISCE", label: "Tzimisce",
    description: "Senhores territoriais que moldam carne e terra à própria vontade.",
    disciplines: ["Animalismo", "Dominação", "Proteanismo"],
    bane: "enraizado: dormir cercado da posse escolhida ou dano agravado à FdV",
    compulsion: "Cobiça",
    source: "companion",
  },
};

// Banes alternativos do V5 Players Guide (p.56) — trocáveis pelo Bane padrão à mesa.
// "Gravidade da Perdição" = Bane Severity.
const BANE_VARIANTS: Partial<Record<Clan, string>> = {
  BRUJAH: "Violência: num crítico desastroso em QUALQUER teste de perícia, você causa dano (físico ou mental) igual à Gravidade da Perdição ao alvo da interação — Agravado, ou Superficial se gastar 1 de Força de Vontade.",
  GANGREL: "Instintos de Sobrevivência: −(Gravidade da Perdição) dados em qualquer teste para resistir a frenesi de medo (nunca abaixo de 1 dado).",
  MALKAVIAN: "Manifestações Anormais: ao usar uma Disciplina, mortais por perto se assustam — interações sociais com eles (exceto intimidação) sofrem −(Gravidade da Perdição) por uma cena; outros vampiros o reconhecem na hora como Membro.",
  NOSFERATU: "Infestação: pragas os seguem; seu refúgio fica infestado, impondo −(2 + Gravidade da Perdição) a testes de concentração e sociais no local (−Gravidade em outros ambientes fechados). Controlar as pragas com Animalismo sofre −Gravidade. Nesta variante, você não é necessariamente deformado.",
  TOREADOR: "Empatia Agonizante: ao ferir um mortal ao se alimentar, você sofre dano semelhante (em geral Agravado), até a Gravidade da Perdição, como hemorragia interna/hematomas no mesmo ponto da mordida.",
  TREMERE: "Sangue Roubado: um Surto de Sangue exige Rouse Checks iguais à Gravidade da Perdição; se isso levar a Fome a 5+, escolha recuar do Surto ou executá-lo e ir direto para Fome 5.",
  VENTRUE: "Hierarquia: −(Gravidade da Perdição) em Disciplinas usadas contra um vampiro de geração MENOR; e é preciso gastar Força de Vontade igual à Gravidade para atacá-lo diretamente.",
  BANU_HAQIM: "Sangue Nocivo: seu vitae é veneno para mortais — quem bebe sofre dano Agravado igual à Gravidade da Perdição por Rouse Check ingerido, e seu sangue não cura mortais. (Ghouls Banu Haqim são raríssimos.)",
  HECATA: "Decomposição: sua presença apodrece o que está por perto (refúgios decaem, plantas murcham, mortais adoecem). Você carrega pontos extras de Defeitos iguais à Gravidade da Perdição entre Lacaios, Refúgio e Recursos.",
  LASOMBRA: "Insensibilidade: em rolagens de Remorso, subtraia dados iguais à Gravidade da Perdição (nunca abaixo de 1 dado).",
  MINISTRY: "Sangue Frio: só usa Rubor da Vida se tiver se alimentado de um vessel vivo há pouco, e isso custa Rouse Checks iguais à Gravidade da Perdição (em vez de um).",
  RAVNOS: "Nome de Não-Nascença: quem diz o seu verdadeiro nome de batismo na sua cara ganha +(Gravidade da Perdição) para resistir às suas Disciplinas, e você sofre −Gravidade para resistir aos poderes sobrenaturais dessa pessoa.",
  SALUBRI: "Ascetismo: com Fome abaixo de 3, você sofre −(Gravidade da Perdição) nas paradas de Disciplina (além do terceiro olho).",
  TZIMISCE: "Cortesia Amaldiçoada: entrar num lar ou refúgio alheio sem convite causa aflição severa — gaste Força de Vontade igual à Gravidade da Perdição e sofra −Gravidade nas Disciplinas durante a estadia. Quem usa este Bane não pode ter o Defeito Bloqueio Folclórico.",
};

// Arquétipos de conceito por clã (V5 Players Guide) — sugestões de personagem, sem regra.
const ARCHETYPES: Partial<Record<Clan, { name: string; desc: string }[]>> = {
  BANU_HAQIM: [
    { name: "Executor", desc: "Traz a Morte Final a quem violou irremediavelmente as leis dos Membros; com respaldo, aceita até contratos não sancionados quando concorda com a causa." },
    { name: "Anfitrião Charmoso", desc: "Mantém um jogo de cartas num hotel de luxo — um quase-Elísio para Membros e mortais —, favorecendo com convites quem lhe convém." },
    { name: "Líder Sindical", desc: "Sabe quando levar às ruas e quando recuar; junta apoiadores em torno de mudança, equilibrando isso com o que a sociedade Membro espera dele." },
    { name: "Arquiteto Esotérico", desc: "Constrói coisas duradouras — refúgios e falsas covas pela cidade que guardam Membros em torpor; a questão é quem ele decide enterrar." },
  ],
  HECATA: [
    { name: "Reanimador", desc: "Traz cadáveres de volta a falar (ou dançar) para você — descobre o que o morto sabia, sem julgamentos; só deixe o corpo com ele no fim." },
    { name: "Perito Forense", desc: "Usa a expertise de cena de crime para alterar provas e forjar narrativas de morte que protegem a coterie, dividido entre os jovens Membros e a família macabra." },
    { name: "Necromante Natural", desc: "Descobriu talento genuíno para magia da morte (seances, exorcismos, ocultismo) e foi mais chantageado que Abraçado para a Hecata; tem planos próprios." },
    { name: "Banqueiro Inescrupuloso", desc: "Scion Giovanni/Dunsirn, atua como parte neutra para 'investidores' Membros em negócios ilícitos — inclusive guardar sangue e Membros em torpor." },
  ],
  LASOMBRA: [
    { name: "Mentor", desc: "Transformou o mínimo aceno de um Príncipe num dos territórios de caça mais prestigiados; forma protegidos e acumula favores e segredos." },
    { name: "Provocador", desc: "Enganou o próprio senhor e virou isca de caçadores por encomenda: planta provas e atrai a Segunda Inquisição contra os alvos de quem o contrata." },
    { name: "Cronista da Moda", desc: "Transforma histórias de anciães (que esquecem o próprio passado) em memórias tangíveis — e assim recolhe os segredos deles." },
    { name: "Valete", desc: "A serviço de um aristocrata tolo, circula invisível entre 'a criadagem', colhendo segredos da alta sociedade que ninguém percebe." },
  ],
  MINISTRY: [
    { name: "Curandeiro da Fé", desc: "Constrói confiança pela fé e pela palavra; onde antes pregava contra o pecado, agora prega contra a Besta, e a Máscara religiosa lhe rende Status." },
    { name: "Fraude Vitalícia", desc: "Vigaristas e charlatães acham lugar no Ministério: nome falso, contratos furados e a lábia de sempre — agora vendendo 'alívio da culpa' de cidade em cidade." },
    { name: "Porta-Voz do Divino", desc: "Ouvia a voz de Deus antes do Abraço; agora, entre a Besta, o Sangue e as ressonâncias das vítimas, crê-se um canal de algo maior que a vida ou a morte." },
    { name: "Ator Coadjuvante", desc: "Uma carreira de TV diurna e papéis pequenos lhe dão um ar de familiaridade — uma boa fachada para o culto se misturar aos semi-famosos." },
  ],
  RAVNOS: [
    { name: "Motoboy da Meia-Noite", desc: "Quando a entrega precisa chegar inteira, na hora e na calada, é ele; conhece as rotas na guerra de seitas, quem subornar e onde se esconder — acima de tudo, tem opções." },
    { name: "Operativo de Aluguel", desc: "Raro entre os Rogues: discreto, profissional e confiável. Cumpre a missão (espionagem, diplomacia ou assassinato), recebe e some — útil demais para virar inimigo." },
    { name: "Agente de Viagens", desc: "Toca uma agência discreta com contatos pelo mundo: leva quem combusta ao sol e é caçado por inteligência a qualquer canto — o cliente pode chegar um pouco diferente." },
    { name: "Antiquário", desc: "Faro para a história e razões próprias para desenterrar artefatos esquecidos — inclusive relíquias de interesse dos Membros; se vale achar, ele acha e desenterra." },
  ],
  SALUBRI: [
    { name: "Buscador da Verdade", desc: "Certo de que há um sentido mais profundo em tudo, dedica a não-vida a uma grande busca: estuda o próprio corpo (e o terceiro olho) e mata a Besta atrás da Golconda." },
    { name: "Curandeiro Relutante", desc: "Nasceu para curar e o Abraço lhe deu novas ferramentas — mas, arrancado da vida que julgava odiar, cura à força, por dever e pela Compulsão empática." },
    { name: "Monstro Contra Monstros", desc: "Ressentido com a própria condição, trabalha contra a sociedade Membro: informa à polícia mortal e sabota a alimentação de outros predadores — um jogo perigosíssimo." },
    { name: "Espião de Aluguel", desc: "Esconder o olho (e o sangue que escorre dele) exige tanta disciplina que ele vive disfarçado — o que o torna candidato confiável para tarefas incógnitas, por um bom preço." },
  ],
  TZIMISCE: [
    { name: "Senhorio", desc: "Senhores dos seus domínios desde sempre; hoje controlam cortiços ou arranha-céus da moda e sangram os inquilinos como sangram as vítimas — tudo é extensão da sua posse." },
    { name: "Líder de Gangue", desc: "Menos gangue e mais forma de garantir que todos se protejam: mostra que quem a sociedade descartou pode simplesmente tomar o que quer (nem que seja num cartel)." },
    { name: "Rancoroso", desc: "Desde que reivindicam domínio, guerreiam contra quem o cobiça — sobretudo Tremere, Gangrel e Nosferatu; cada noite cobram alguma migalha de vingança fria." },
    { name: "Comandante das Forças Especiais", desc: "Sem um domínio de terra tradicional, tem o respeito quase fanático da sua unidade; treina as tropas para transformar uma insurreição em reivindicação de domínio." },
  ],
};

export function clans(): ClanInfo[] {
  return Object.values(CLANS).map((c) => ({ ...c, baneVariant: BANE_VARIANTS[c.clan], archetypes: ARCHETYPES[c.clan] }));
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

export type { Power, DisciplineInfo };

export function disciplines(): DisciplineInfo[] {
  return V5_DISCIPLINES;
}

// --- Tipos de Predador -----------------------------------------------------------

export type PredatorType = { name: string; summary: string; disciplines: string[]; source?: Source };

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
  // --- Players Guide (Guia do Jogador) ---
  { name: "Extorsionário", summary: "Extorque sangue das vítimas em troca de 'proteção' — coerção sutil e escancarada.", disciplines: ["Dominação", "Potência"], source: "players_guide" },
  { name: "Ladrão de Túmulos", summary: "Alimenta-se de cadáveres frescos e de enlutados/pacientes; prefere Ressonância Melancólica.", disciplines: ["Fortitude", "Oblivion"], source: "players_guide" },
  { name: "Ceifador", summary: "Só se alimenta de quem está à beira da morte (asilos, hospícios, abrigos).", disciplines: ["Auspícios", "Oblivion"], source: "players_guide" },
  { name: "Montero", summary: "Usa lacaios para encurralar as vítimas até você, como numa caçada (montería).", disciplines: ["Dominação", "Ofuscação"], source: "players_guide" },
  { name: "Perseguidor", summary: "Estuda e persegue uma vítima que ninguém sentirá falta, atacando no ápice.", disciplines: ["Animalismo", "Auspícios"], source: "players_guide" },
  { name: "Alçapão", summary: "Constrói um covil e atrai a presa para dentro dele (como a aranha-alçapão).", disciplines: ["Proteanismo", "Ofuscação"], source: "players_guide" },
];

export function predatorTypes(): PredatorType[] {
  return PREDATORS;
}

// --- Antecedentes/Vantagens e Defeitos --------------------------------------------
// Nomes, grupos, faixas de pontos e descrições (fiéis ao Livro Básico de V5) ficam em
// `@/lib/v5-merits` — um módulo seguro para cliente, para que as fichas mostrem a
// descrição ao passar o mouse sem refazer a lista aqui. `desc` acompanha cada item.

export type { MeritOption };

export function advantages(): MeritOption[] {
  return V5_ADVANTAGES;
}

export function flaws(): MeritOption[] {
  return V5_FLAWS;
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

export type CoterieType = { name: string; summary: string; source?: Source };

const COTERIES: CoterieType[] = [
  { name: "Grupo de Caça", summary: "Captura presas para terceiros ou para a própria mesa." },
  { name: "Guarda Diurna", summary: "Protege os não-vivos enquanto dormem durante o dia." },
  { name: "Nômades", summary: "Viaja de um lugar a outro, sem refúgio fixo." },
  { name: "Questári", summary: "Busca realizar um grande empreendimento ou objetivo." },
  { name: "Recência", summary: "Administra os negócios até que um ancião retorne." },
  { name: "Coterie Social", summary: "Reúne-se por status, prazer e influência." },
  // --- Players Guide (Guia do Jogador) ---
  { name: "Culto de Sangue", summary: "Controla um culto humano e se alimenta dele; domina magias de sangue e converte fiéis em poder.", source: "players_guide" },
  { name: "Cérbero", summary: "Guarda um local importante (Elísio, marco), aprende seus segredos e troca acesso por poder.", source: "players_guide" },
  { name: "Campeões", summary: "Protege o domínio de predadores piores e combate o crime — sem perder a esperança nem a Humanidade.", source: "players_guide" },
  { name: "Comando", summary: "Unidade de combate a serviço de um mestre: explora e explora defesas inimigas mantendo coesão.", source: "players_guide" },
  { name: "Corporação", summary: "Cuida dos negócios, cresce o valor aos acionistas, infiltra-se no poder mortal e desvia por cima.", source: "players_guide" },
  { name: "Emissários", summary: "Media entre facções, cria alianças e terreno comum, identifica um inimigo em comum.", source: "players_guide" },
  { name: "Família", summary: "Mantém a domesticidade, expande laços de sangue, perpetua a linhagem e negocia Casamentos de Sangue.", source: "players_guide" },
  { name: "Gangue de Presas", summary: "Não-mortos que cometem crimes: estudam alvos, dão o golpe e defendem o território.", source: "players_guide" },
  { name: "Fugitivos", summary: "Manter-se escondido e em movimento, limpar o nome e atrair os caçadores para uma emboscada.", source: "players_guide" },
  { name: "Guardiões do Portão", summary: "Vigiam o Véu, lidam com wraiths, caçam fantasmas e controlam (ou saqueiam) sepulturas.", source: "players_guide" },
  { name: "Marechal", summary: "Serve e protege o senhor da cidade, faz o trabalho sujo e alavanca o acesso ao poder.", source: "players_guide" },
  { name: "Plumaires", summary: "Socializa, cultiva uma arte ou interesse em comum, ofusca rivais e descobre novos talentos.", source: "players_guide" },
  { name: "Sabotadores", summary: "Escondidos, atacam os inimigos de forma dramática ou astuta — na política ou por meio de mortais.", source: "players_guide" },
  { name: "Sbirri", summary: "Vivem sob disfarce: coletam informação e mantêm uma rede de espiões e traidores.", source: "players_guide" },
  { name: "Vehme", summary: "Polícia secreta da Máscara: caça e subjuga quem a viola, leva a julgamento e executa a sentença.", source: "players_guide" },
  { name: "Sentinelas", summary: "Patrulham e protegem, expandem o poder da seita e enfrentam oponentes, lobisomens e o Sabá.", source: "players_guide" },
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
