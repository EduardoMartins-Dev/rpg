/**
 * Port of backend/src/main/java/com/portalrpg/rules/V5Catalog.java. Static V5 reference
 * data only — names, levels, mechanics summaries. The INTEGRAL text of powers/lore comes
 * from the indexed PDF at runtime (RAG), never hardcoded here.
 */

import { V5_ADVANTAGES, V5_FLAWS, type MeritOption } from "@/lib/v5-merits";
import { V5_DISCIPLINES, type Power, type DisciplineInfo } from "@/lib/v5-disciplines";

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

export type { Power, DisciplineInfo };

export function disciplines(): DisciplineInfo[] {
  return V5_DISCIPLINES;
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
