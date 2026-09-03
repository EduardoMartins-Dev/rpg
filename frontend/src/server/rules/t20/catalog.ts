/**
 * Catálogo do Tormenta 20 (livro básico). Dados puros do sistema — atributos, perícias,
 * classes e raças — mais ajudantes de consulta. Espelha o papel de v5/catalog.ts, mas
 * para o T20. Cresce por partes (o catálogo completo — habilidades de raça/classe,
 * origens, poderes, magias e divindades — é adicionado incrementalmente e verificado
 * contra o livro).
 *
 * Regra de nomes: as CHAVES dos atributos são minúsculas sem acento (usadas no sheetData);
 * os rótulos são exibidos ao jogador.
 */

// Índice de magias (167) vive em ./spells.ts (gerado do PDF) e é reexportado aqui.
export { SPELLS, type Spell } from "./spells";
// Catálogo de armas (Tabela 3-3) vive em ./weapons.ts.
export { WEAPONS, weapon, type WeaponInfo, type WeaponCategory } from "./weapons";

// --- Atributos (6) ---------------------------------------------------------------------

export type AttrKey = "forca" | "destreza" | "constituicao" | "inteligencia" | "sabedoria" | "carisma";

export const ATTRIBUTES: { key: AttrKey; label: string; abbr: string }[] = [
  { key: "forca", label: "Força", abbr: "For" },
  { key: "destreza", label: "Destreza", abbr: "Des" },
  { key: "constituicao", label: "Constituição", abbr: "Con" },
  { key: "inteligencia", label: "Inteligência", abbr: "Int" },
  { key: "sabedoria", label: "Sabedoria", abbr: "Sab" },
  { key: "carisma", label: "Carisma", abbr: "Car" },
];

export const ATTRIBUTE_KEYS: AttrKey[] = ATTRIBUTES.map((a) => a.key);

// --- Perícias (29) ---------------------------------------------------------------------
// key = atributo-chave da perícia; trainedOnly = só pode ser usada se treinada;
// armorPenalty = sofre a penalidade de armadura no teste.

export type Skill = { name: string; key: AttrKey; trainedOnly?: boolean; armorPenalty?: boolean };

export const SKILLS: Skill[] = [
  { name: "Acrobacia", key: "destreza", armorPenalty: true },
  { name: "Adestramento", key: "carisma", trainedOnly: true },
  { name: "Atletismo", key: "forca" },
  { name: "Atuação", key: "carisma" },
  { name: "Cavalgar", key: "destreza" },
  { name: "Conhecimento", key: "inteligencia", trainedOnly: true },
  { name: "Cura", key: "sabedoria" },
  { name: "Diplomacia", key: "carisma" },
  { name: "Enganação", key: "carisma" },
  { name: "Fortitude", key: "constituicao" },
  { name: "Furtividade", key: "destreza", armorPenalty: true },
  { name: "Guerra", key: "inteligencia", trainedOnly: true },
  { name: "Iniciativa", key: "destreza" },
  { name: "Intimidação", key: "carisma" },
  { name: "Intuição", key: "sabedoria" },
  { name: "Investigação", key: "inteligencia" },
  { name: "Jogatina", key: "carisma", trainedOnly: true },
  { name: "Ladinagem", key: "destreza", trainedOnly: true, armorPenalty: true },
  { name: "Luta", key: "forca" },
  { name: "Misticismo", key: "inteligencia", trainedOnly: true },
  { name: "Nobreza", key: "inteligencia", trainedOnly: true },
  { name: "Ofício", key: "inteligencia", trainedOnly: true },
  { name: "Percepção", key: "sabedoria" },
  { name: "Pilotagem", key: "destreza", trainedOnly: true },
  { name: "Pontaria", key: "destreza" },
  { name: "Reflexos", key: "destreza" },
  { name: "Religião", key: "sabedoria", trainedOnly: true },
  { name: "Sobrevivência", key: "sabedoria" },
  { name: "Vontade", key: "sabedoria" },
];

export const SKILL_NAMES: string[] = SKILLS.map((s) => s.name);

export function skill(name: string): Skill | undefined {
  return SKILLS.find((s) => s.name.toLowerCase() === name.trim().toLowerCase());
}

// --- Classes (14) ----------------------------------------------------------------------
// pvBase = PV no 1º nível (antes de Constituição); pvPerLevel = ganho por nível seguinte
// (antes de Con). pmPerLevel = PM ganho por nível. skillCount = perícias treinadas iniciais
// da classe (fora as fixas). Dados de PV/PM conferidos no livro básico.

export type ClassInfo = {
  id: string; label: string;
  pvBase: number; pvPerLevel: number; pmPerLevel: number;
  // Perícias iniciais: fixas (sempre treinadas), grupos "escolha uma" e nº de livres.
  skillsFixed: string[];
  skillsEither: string[][];
  skillChoices: number;
  proficiencies: string; // além de armas simples + armaduras leves (que todos têm)
  // Conjuração (só classes que lançam magias). circles[i] = nível mínimo para o (i+1)º círculo.
  magic?: { tradition: "Arcana" | "Divina"; circles: number[] };
};

/** Maior círculo de magia que a classe lança no dado nível (0 = não lança). */
export function maxSpellCircle(cls: ClassInfo | undefined, level: number): number {
  if (!cls?.magic) return 0;
  return cls.magic.circles.filter((min) => level >= min).length;
}

// Todos os personagens já sabem usar armas simples e armaduras leves.
export const CLASSES: ClassInfo[] = [
  { id: "arcanista", label: "Arcanista", pvBase: 8, pvPerLevel: 2, pmPerLevel: 6,
    skillsFixed: ["Misticismo", "Vontade"], skillsEither: [], skillChoices: 2, proficiencies: "Nenhuma",
    magic: { tradition: "Arcana", circles: [1, 5, 9, 13, 17] } },
  { id: "barbaro", label: "Bárbaro", pvBase: 24, pvPerLevel: 6, pmPerLevel: 3,
    skillsFixed: ["Fortitude", "Luta"], skillsEither: [], skillChoices: 4, proficiencies: "Armas marciais e escudos" },
  { id: "bardo", label: "Bardo", pvBase: 12, pvPerLevel: 3, pmPerLevel: 4,
    skillsFixed: ["Atuação", "Reflexos"], skillsEither: [], skillChoices: 6, proficiencies: "Armas marciais",
    magic: { tradition: "Arcana", circles: [1, 6, 10, 14] } },
  { id: "bucaneiro", label: "Bucaneiro", pvBase: 16, pvPerLevel: 4, pmPerLevel: 3,
    skillsFixed: ["Reflexos"], skillsEither: [["Luta", "Pontaria"]], skillChoices: 4, proficiencies: "Armas marciais" },
  { id: "cacador", label: "Caçador", pvBase: 16, pvPerLevel: 4, pmPerLevel: 4,
    skillsFixed: ["Sobrevivência"], skillsEither: [["Luta", "Pontaria"]], skillChoices: 6, proficiencies: "Armas marciais e escudos" },
  { id: "cavaleiro", label: "Cavaleiro", pvBase: 20, pvPerLevel: 5, pmPerLevel: 3,
    skillsFixed: ["Fortitude", "Luta"], skillsEither: [], skillChoices: 2, proficiencies: "Armas marciais, armaduras pesadas e escudos" },
  { id: "clerigo", label: "Clérigo", pvBase: 16, pvPerLevel: 4, pmPerLevel: 5,
    skillsFixed: ["Religião", "Vontade"], skillsEither: [], skillChoices: 2, proficiencies: "Armaduras pesadas e escudos",
    magic: { tradition: "Divina", circles: [1, 5, 9, 13, 17] } },
  { id: "druida", label: "Druida", pvBase: 16, pvPerLevel: 4, pmPerLevel: 4,
    skillsFixed: ["Sobrevivência", "Vontade"], skillsEither: [], skillChoices: 4, proficiencies: "Escudos",
    magic: { tradition: "Divina", circles: [1, 6, 10, 14] } },
  { id: "guerreiro", label: "Guerreiro", pvBase: 20, pvPerLevel: 5, pmPerLevel: 3,
    skillsFixed: ["Fortitude"], skillsEither: [["Luta", "Pontaria"]], skillChoices: 2, proficiencies: "Armas marciais, armaduras pesadas e escudos" },
  { id: "inventor", label: "Inventor", pvBase: 12, pvPerLevel: 3, pmPerLevel: 4,
    skillsFixed: ["Ofício", "Vontade"], skillsEither: [], skillChoices: 4, proficiencies: "Nenhuma" },
  { id: "ladino", label: "Ladino", pvBase: 12, pvPerLevel: 3, pmPerLevel: 4,
    skillsFixed: ["Ladinagem", "Reflexos"], skillsEither: [], skillChoices: 8, proficiencies: "Nenhuma" },
  { id: "lutador", label: "Lutador", pvBase: 20, pvPerLevel: 5, pmPerLevel: 3,
    skillsFixed: ["Fortitude", "Luta"], skillsEither: [], skillChoices: 4, proficiencies: "Nenhuma" },
  { id: "nobre", label: "Nobre", pvBase: 16, pvPerLevel: 4, pmPerLevel: 4,
    skillsFixed: ["Vontade"], skillsEither: [["Diplomacia", "Intimidação"]], skillChoices: 4, proficiencies: "Armas marciais, armaduras pesadas e escudos" },
  { id: "paladino", label: "Paladino", pvBase: 20, pvPerLevel: 5, pmPerLevel: 3,
    skillsFixed: ["Luta", "Vontade"], skillsEither: [], skillChoices: 2, proficiencies: "Armas marciais, armaduras pesadas e escudos" },
];

export function classInfo(id: string): ClassInfo | undefined {
  const q = id.trim().toLowerCase();
  return CLASSES.find((c) => c.id === q || c.label.toLowerCase() === q);
}

// --- Raças (17) ------------------------------------------------------------------------
// Modificadores de atributo e habilidades conferidos no livro básico (cap. 1). freeAttr =
// "+N em X atributos diferentes" (escolha do jogador); attrMods = modificadores fixos.
// As descrições são o essencial mecânico de cada habilidade.

export type AttrMod = { attr: AttrKey; mod: number };
export type FreeAttr = { count: number; each: number; except?: AttrKey[] };
export type RaceAbility = { name: string; desc: string };
export type RaceVariant = { id: string; label: string; attrMods: AttrMod[]; abilities: RaceAbility[] };
export type RaceInfo = {
  id: string; label: string;
  attrMods: AttrMod[];
  freeAttr?: FreeAttr;
  abilities: RaceAbility[];
  variants?: RaceVariant[];
};

const AM = (attr: AttrKey, mod: number): AttrMod => ({ attr, mod });

export const RACES: RaceInfo[] = [
  {
    id: "humano", label: "Humano",
    attrMods: [], freeAttr: { count: 3, each: 1 },
    abilities: [
      { name: "Versátil", desc: "Torna-se treinado em duas perícias a sua escolha (não precisam ser da classe). Pode trocar uma delas por um poder geral." },
    ],
  },
  {
    id: "anao", label: "Anão",
    attrMods: [AM("constituicao", 2), AM("sabedoria", 1), AM("destreza", -1)],
    abilities: [
      { name: "Conhecimento das Rochas", desc: "Visão no escuro e +2 em Percepção e Sobrevivência no subterrâneo." },
      { name: "Devagar e Sempre", desc: "Deslocamento 6m, mas não é reduzido por armadura ou excesso de carga." },
      { name: "Duro como Pedra", desc: "+3 PV no 1º nível e +1 PV por nível seguinte." },
      { name: "Tradição de Heredrimm", desc: "Machados, martelos, marretas e picaretas são armas simples para você; +2 em ataques com elas." },
    ],
  },
  {
    id: "dahllan", label: "Dahllan",
    attrMods: [AM("sabedoria", 2), AM("destreza", 1), AM("inteligencia", -1)],
    abilities: [
      { name: "Amiga das Plantas", desc: "Pode lançar Controlar Plantas (atributo-chave Sabedoria); repetir a habilidade reduz o custo em –1 PM." },
      { name: "Armadura de Allihanna", desc: "Ação de movimento + 1 PM para transformar a pele em casca: +2 na Defesa até o fim da cena." },
      { name: "Empatia Selvagem", desc: "Comunica-se com animais; usa Adestramento para mudar atitude/persuadir animais." },
    ],
  },
  {
    id: "elfo", label: "Elfo",
    attrMods: [AM("inteligencia", 2), AM("destreza", 1), AM("constituicao", -1)],
    abilities: [
      { name: "Graça de Glórienn", desc: "Deslocamento 12m." },
      { name: "Sangue Mágico", desc: "+1 PM por nível." },
      { name: "Sentidos Élficos", desc: "Visão na penumbra e +2 em Misticismo e Percepção." },
    ],
  },
  {
    id: "goblin", label: "Goblin",
    attrMods: [AM("destreza", 2), AM("inteligencia", 1), AM("carisma", -1)],
    abilities: [
      { name: "Engenhoso", desc: "Sem penalidade por não usar ferramentas; com a ferramenta certa, +2 no teste." },
      { name: "Espelunqueiro", desc: "Visão no escuro e deslocamento de escalada igual ao terrestre." },
      { name: "Peste Esguia", desc: "Tamanho Pequeno, mas deslocamento 9m." },
      { name: "Rato das Ruas", desc: "+2 em Fortitude; recuperação de PV/PM nunca inferior ao seu nível." },
    ],
  },
  {
    id: "lefou", label: "Lefou",
    attrMods: [AM("carisma", -1)], freeAttr: { count: 3, each: 1, except: ["carisma"] },
    abilities: [
      { name: "Cria da Tormenta", desc: "É do tipo monstro; +5 em resistência contra efeitos de lefeu e da Tormenta." },
      { name: "Deformidade", desc: "+2 em duas perícias (cada bônus conta como poder da Tormenta); pode trocar um por um poder da Tormenta." },
    ],
  },
  {
    id: "minotauro", label: "Minotauro",
    attrMods: [AM("forca", 2), AM("constituicao", 1), AM("sabedoria", -1)],
    abilities: [
      { name: "Chifres", desc: "Arma natural (1d6, x2, perfuração); 1/rodada pode gastar 1 PM p/ ataque extra ao agredir." },
      { name: "Couro Rígido", desc: "+1 na Defesa." },
      { name: "Faro", desc: "Não fica desprevenido contra inimigos que não veja em alcance curto; camuflagem total dá só 20% de falha." },
      { name: "Medo de Altura", desc: "Adjacente a queda de 3m+ você fica abalado." },
    ],
  },
  {
    id: "qareen", label: "Qareen",
    attrMods: [AM("carisma", 2), AM("inteligencia", 1), AM("sabedoria", -1)],
    abilities: [
      { name: "Desejos", desc: "Lançar uma magia pedida por alguém desde seu último turno custa –1 PM." },
      { name: "Resistência Elemental", desc: "Redução 10 a um tipo de dano à escolha (frio, eletricidade, fogo, ácido, luz ou trevas)." },
      { name: "Tatuagem Mística", desc: "Pode lançar uma magia de 1º círculo à escolha (atributo-chave Carisma); repetir reduz –1 PM." },
    ],
  },
  {
    id: "golem", label: "Golem",
    attrMods: [AM("forca", 2), AM("constituicao", 1), AM("carisma", -1)],
    abilities: [
      { name: "Chassi", desc: "Deslocamento 6m não reduzido por armadura/carga; +2 na Defesa, mas penalidade de armadura –2." },
      { name: "Criatura Artificial", desc: "Tipo construto; visão no escuro; imune a cansaço/metabólicos/veneno; não respira/come/dorme; fica inerte 8h para recuperar." },
      { name: "Fonte Elemental", desc: "Espírito elemental (água/ar/fogo/terra): imune a esse dano; dano mágico do tipo cura metade em PV." },
      { name: "Propósito de Criação", desc: "Não escolhe origem, mas recebe um poder geral à escolha." },
    ],
  },
  {
    id: "hynne", label: "Hynne",
    attrMods: [AM("destreza", 2), AM("carisma", 1), AM("forca", -1)],
    abilities: [
      { name: "Arremessador", desc: "Ataque à distância com funda/arremesso aumenta o dano em um passo." },
      { name: "Pequeno e Rechonchudo", desc: "Tamanho Pequeno, deslocamento 6m; +2 em Enganação; pode usar Destreza em Atletismo." },
      { name: "Sorte Salvadora", desc: "Em um teste de resistência, gaste 1 PM para rolar de novo." },
    ],
  },
  {
    id: "kliren", label: "Kliren",
    attrMods: [AM("inteligencia", 2), AM("carisma", 1), AM("forca", -1)],
    abilities: [
      { name: "Híbrido", desc: "Torna-se treinado em uma perícia à escolha (não precisa ser da classe)." },
      { name: "Engenhosidade", desc: "Em um teste de perícia (não ataque), gaste 2 PM para somar Inteligência; repetir reduz –1 PM." },
      { name: "Ossos Frágeis", desc: "Sofre +1 de dano por dado de dano de impacto." },
      { name: "Vanguardista", desc: "Proficiência em armas de fogo e +2 em um Ofício à escolha." },
    ],
  },
  {
    id: "medusa", label: "Medusa",
    attrMods: [AM("destreza", 2), AM("carisma", 1)],
    abilities: [
      { name: "Cria de Megalokk", desc: "É do tipo monstro e recebe visão no escuro." },
      { name: "Natureza Venenosa", desc: "Resistência a veneno +5; ação de movimento + 1 PM para envenenar uma arma (perda de 1d12 PV)." },
      { name: "Olhar Atordoante", desc: "Ação de movimento + 1 PM: alvo em alcance curto faz Fortitude (CD Car) ou fica atordoado 1 rodada (1/cena)." },
    ],
  },
  {
    id: "osteon", label: "Osteon",
    attrMods: [AM("constituicao", -1)], freeAttr: { count: 3, each: 1, except: ["constituicao"] },
    abilities: [
      { name: "Armadura Óssea", desc: "Redução de corte, frio e perfuração 5." },
      { name: "Memória Póstuma", desc: "Treinado em uma perícia ou um poder geral; ou seja um osteon de outra raça e ganhe uma habilidade dela." },
      { name: "Natureza Esquelética", desc: "Tipo morto-vivo; imune a cansaço/metabólicos/trevas/veneno; cura de luz causa dano, dano de trevas cura." },
      { name: "Preço da Não Vida", desc: "Precisa passar 8h sob estrelas ou no subterrâneo para recuperar por descanso; senão sofre efeitos de fome." },
    ],
  },
  {
    id: "sereia", label: "Sereia/Tritão",
    attrMods: [], freeAttr: { count: 3, each: 1 },
    abilities: [
      { name: "Canção dos Mares", desc: "Lança duas entre Amedrontar, Comando, Despedaçar, Enfeitiçar, Hipnotismo ou Sono (chave Carisma); repetir reduz –1 PM." },
      { name: "Mestre do Tridente", desc: "Tridente é arma simples; +2 no dano com azagaias, lanças e tridentes." },
      { name: "Transformação Anfíbia", desc: "Respira debaixo d'água; cauda dá natação 12m (em terra, pernas com 9m)." },
    ],
  },
  {
    id: "silfide", label: "Sílfide",
    attrMods: [AM("carisma", 2), AM("destreza", 1), AM("forca", -2)],
    abilities: [
      { name: "Asas de Borboleta", desc: "Tamanho Minúsculo; paira a 1,5m com deslocamento 9m (ignora terreno difícil, imune a dano de queda); 1 PM/rodada para voar 12m." },
      { name: "Espírito da Natureza", desc: "Tipo espírito; visão na penumbra; fala com animais livremente." },
      { name: "Magia das Fadas", desc: "Lança duas entre Criar Ilusão, Enfeitiçar, Luz (arcana) e Sono (chave Carisma); repetir reduz –1 PM." },
    ],
  },
  {
    id: "suraggel", label: "Suraggel",
    attrMods: [],
    abilities: [
      { name: "Herança Divina", desc: "É do tipo espírito e recebe visão no escuro." },
    ],
    variants: [
      {
        id: "aggelus", label: "Aggelus",
        attrMods: [AM("sabedoria", 2), AM("carisma", 1)],
        abilities: [{ name: "Luz Sagrada", desc: "+2 em Diplomacia e Intuição; pode lançar Luz (divina, chave Carisma); repetir reduz –1 PM." }],
      },
      {
        id: "sulfure", label: "Sulfure",
        attrMods: [AM("destreza", 2), AM("inteligencia", 1)],
        abilities: [{ name: "Sombras Profanas", desc: "+2 em Enganação e Furtividade; pode lançar Escuridão (divina, chave Inteligência); repetir reduz –1 PM." }],
      },
    ],
  },
  {
    id: "trog", label: "Trog",
    attrMods: [AM("constituicao", 2), AM("forca", 1), AM("inteligencia", -1)],
    abilities: [
      { name: "Mau Cheiro", desc: "Ação padrão + 2 PM: criaturas (exceto trogs) em alcance curto fazem Fortitude (CD Con) ou ficam enjoadas 1d6 rodadas." },
      { name: "Mordida", desc: "Arma natural (1d6, x2, perfuração); 1/rodada pode gastar 1 PM p/ ataque extra ao agredir." },
      { name: "Reptiliano", desc: "Tipo monstro; visão no escuro; +1 na Defesa; sem armadura pesada, +5 em Furtividade." },
      { name: "Sangue Frio", desc: "Sofre +1 de dano por dado de dano de frio." },
    ],
  },
];

export function race(id: string): RaceInfo | undefined {
  const q = id.trim().toLowerCase();
  return RACES.find((r) => r.id === q || r.label.toLowerCase() === q);
}

// --- Origens (35) ----------------------------------------------------------------------
// Cada origem oferece uma lista de perícias e poderes; o jogador escolhe DOIS benefícios
// (duas perícias, dois poderes ou um de cada). Conferido na Tabela 1-19 do livro básico.
// (Itens iniciais e descrições dos poderes únicos entram numa passada de itens/poderes.)

export type OriginInfo = { id: string; label: string; skills: string[]; powers: string[] };

export const ORIGINS: OriginInfo[] = [
  { id: "acolito", label: "Acólito", skills: ["Cura", "Religião", "Vontade"], powers: ["Medicina", "Membro da Igreja", "Vontade de Ferro"] },
  { id: "amigo-dos-animais", label: "Amigo dos Animais", skills: ["Adestramento", "Cavalgar"], powers: ["Amigo Especial"] },
  { id: "amnesico", label: "Amnésico", skills: [], powers: ["Lembranças Graduais", "Uma perícia e um poder à escolha do mestre"] },
  { id: "aristocrata", label: "Aristocrata", skills: ["Diplomacia", "Enganação", "Nobreza"], powers: ["Comandar", "Sangue Azul"] },
  { id: "artesao", label: "Artesão", skills: ["Ofício", "Vontade"], powers: ["Frutos do Trabalho", "Sortudo"] },
  { id: "artista", label: "Artista", skills: ["Atuação", "Enganação"], powers: ["Atraente", "Dom Artístico", "Sortudo", "Torcida"] },
  { id: "assistente-de-laboratorio", label: "Assistente de Laboratório", skills: ["Ofício (alquimista)", "Misticismo"], powers: ["Esse Cheiro...", "Venefício", "Um poder da Tormenta à escolha"] },
  { id: "batedor", label: "Batedor", skills: ["Furtividade", "Percepção", "Sobrevivência"], powers: ["À Prova de Tudo", "Estilo de Disparo", "Sentidos Aguçados"] },
  { id: "capanga", label: "Capanga", skills: ["Luta", "Intimidação"], powers: ["Confissão", "Um poder de combate à escolha"] },
  { id: "charlatao", label: "Charlatão", skills: ["Enganação", "Jogatina"], powers: ["Alpinista Social", "Aparência Inofensiva", "Sortudo"] },
  { id: "circense", label: "Circense", skills: ["Acrobacia", "Atuação", "Reflexos"], powers: ["Acrobático", "Torcida", "Truque de Mágica"] },
  { id: "criminoso", label: "Criminoso", skills: ["Enganação", "Furtividade", "Ladinagem"], powers: ["Punguista", "Venefício"] },
  { id: "curandeiro", label: "Curandeiro", skills: ["Cura", "Vontade"], powers: ["Medicina", "Médico de Campo", "Venefício"] },
  { id: "eremita", label: "Eremita", skills: ["Misticismo", "Religião", "Sobrevivência"], powers: ["Busca Interior", "Lobo Solitário"] },
  { id: "escravo", label: "Escravo", skills: ["Atletismo", "Fortitude", "Furtividade"], powers: ["Desejo de Liberdade", "Vitalidade"] },
  { id: "estudioso", label: "Estudioso", skills: ["Conhecimento", "Guerra", "Misticismo"], powers: ["Aparência Inofensiva", "Palpite Fundamentado"] },
  { id: "fazendeiro", label: "Fazendeiro", skills: ["Adestramento", "Cavalgar", "Ofício (fazendeiro)", "Sobrevivência"], powers: ["Água no Feijão", "Ginete"] },
  { id: "forasteiro", label: "Forasteiro", skills: ["Cavalgar", "Pilotagem", "Sobrevivência"], powers: ["Cultura Exótica", "Lobo Solitário"] },
  { id: "gladiador", label: "Gladiador", skills: ["Atuação", "Luta"], powers: ["Atraente", "Pão e Circo", "Torcida", "Um poder de combate à escolha"] },
  { id: "guarda", label: "Guarda", skills: ["Investigação", "Luta", "Percepção"], powers: ["Detetive", "Investigador", "Um poder de combate à escolha"] },
  { id: "herdeiro", label: "Herdeiro", skills: ["Misticismo", "Nobreza", "Ofício"], powers: ["Comandar", "Herança"] },
  { id: "heroi-campones", label: "Herói Camponês", skills: ["Adestramento", "Ofício"], powers: ["Coração Heroico", "Sortudo", "Surto Heroico", "Torcida"] },
  { id: "marujo", label: "Marujo", skills: ["Atletismo", "Jogatina", "Pilotagem"], powers: ["Acrobático", "Passagem de Navio"] },
  { id: "mateiro", label: "Mateiro", skills: ["Atletismo", "Furtividade", "Sobrevivência"], powers: ["Lobo Solitário", "Sentidos Aguçados", "Vendedor de Carcaças"] },
  { id: "membro-de-guilda", label: "Membro de Guilda", skills: ["Diplomacia", "Enganação", "Misticismo", "Ofício"], powers: ["Foco em Perícia", "Rede de Contatos"] },
  { id: "mercador", label: "Mercador", skills: ["Diplomacia", "Intuição", "Ofício"], powers: ["Negociação", "Proficiência", "Sortudo"] },
  { id: "minerador", label: "Minerador", skills: ["Atletismo", "Fortitude", "Ofício (minerador)"], powers: ["Ataque Poderoso", "Escavador", "Sentidos Aguçados"] },
  { id: "nomade", label: "Nômade", skills: ["Cavalgar", "Pilotagem", "Sobrevivência"], powers: ["Lobo Solitário", "Mochileiro", "Sentidos Aguçados"] },
  { id: "pivete", label: "Pivete", skills: ["Furtividade", "Iniciativa", "Ladinagem"], powers: ["Acrobático", "Aparência Inofensiva", "Quebra-Galho"] },
  { id: "refugiado", label: "Refugiado", skills: ["Fortitude", "Reflexos", "Vontade"], powers: ["Estoico", "Vontade de Ferro"] },
  { id: "seguidor", label: "Seguidor", skills: ["Adestramento", "Ofício"], powers: ["Antigo Mestre", "Proficiência", "Surto Heroico"] },
  { id: "selvagem", label: "Selvagem", skills: ["Percepção", "Reflexos", "Sobrevivência"], powers: ["Lobo Solitário", "Vida Rústica", "Vitalidade"] },
  { id: "soldado", label: "Soldado", skills: ["Fortitude", "Guerra", "Luta", "Pontaria"], powers: ["Influência Militar", "Um poder de combate à escolha"] },
  { id: "taverneiro", label: "Taverneiro", skills: ["Diplomacia", "Jogatina", "Ofício (cozinheiro)"], powers: ["Gororoba", "Proficiência", "Vitalidade"] },
  { id: "trabalhador", label: "Trabalhador", skills: ["Atletismo", "Fortitude"], powers: ["Atlético", "Esforçado"] },
];

export function origin(id: string): OriginInfo | undefined {
  const q = id.trim().toLowerCase();
  return ORIGINS.find((o) => o.id === q || o.label.toLowerCase() === q);
}

// --- Divindades (20 deuses maiores) ----------------------------------------------------
// Ser devoto é opcional (clérigo/druida/paladino são devotos automaticamente). Ao se
// tornar devoto você escolhe UM poder concedido da lista e segue as Obrigações do deus.
// Conferido no cap. Deuses + Tabela 1-20 do livro básico.

export type DeityInfo = {
  id: string; label: string; domain: string;
  energy: string; weapon: string; devotees: string;
  grantedPowers: string[];
};

export const DEITIES: DeityInfo[] = [
  { id: "aharadak", label: "Aharadak", domain: "Deus da Tormenta", energy: "Negativa", weapon: "Corrente de espinhos", devotees: "Quaisquer", grantedPowers: ["Afinidade com a Tormenta", "Êxtase da Loucura", "Percepção Temporal", "Rejeição Divina"] },
  { id: "allihanna", label: "Allihanna", domain: "Deusa da Natureza", energy: "Positiva", weapon: "Bordão", devotees: "Dahllan, elfos, sílfides, bárbaros, caçadores, druidas", grantedPowers: ["Compreender os Ermos", "Dedo Verde", "Descanso Natural", "Voz da Natureza"] },
  { id: "arsenal", label: "Arsenal", domain: "Deus da Guerra", energy: "Qualquer", weapon: "Martelo de guerra", devotees: "Anões, minotauros, bárbaros, cavaleiros, guerreiros, lutadores", grantedPowers: ["Conjurar Arma", "Coragem Total", "Fé Guerreira", "Sangue de Ferro"] },
  { id: "azgher", label: "Azgher", domain: "Deus do Sol", energy: "Positiva", weapon: "Cimitarra", devotees: "Aggelus, qareen, arcanistas, bárbaros, caçadores, cavaleiros, guerreiros, nobres, paladinos", grantedPowers: ["Espada Solar", "Fulgor Solar", "Habitante do Deserto", "Inimigo de Tenebra"] },
  { id: "hyninn", label: "Hyninn", domain: "Deus da Trapaça", energy: "Qualquer", weapon: "Adaga", devotees: "Hynne, goblins, sílfides, bardos, bucaneiros, ladinos, inventores, nobres", grantedPowers: ["Apostar com o Trapaceiro", "Farsa do Fingidor", "Forma de Macaco", "Golpista Divino"] },
  { id: "kallyadranoch", label: "Kallyadranoch", domain: "Deus dos Dragões", energy: "Negativa", weapon: "Lança", devotees: "Elfos, medusas, sulfure, arcanistas, cavaleiros, guerreiros, lutadores, nobres", grantedPowers: ["Aura de Medo", "Escamas Dracônicas", "Presas Primordiais", "Servos do Dragão"] },
  { id: "khalmyr", label: "Khalmyr", domain: "Deus da Justiça", energy: "Positiva", weapon: "Espada longa", devotees: "Aggelus, anões, cavaleiros, guerreiros, nobres, paladinos", grantedPowers: ["Coragem Total", "Dom da Verdade", "Espada Justiceira", "Reparar Injustiça"] },
  { id: "lena", label: "Lena", domain: "Deusa da Vida", energy: "Positiva", weapon: "Não há", devotees: "Dahllan, qareen, nobres, paladinos (só mulheres, salvo paladinos)", grantedPowers: ["Ataque Piedoso", "Aura Restauradora", "Cura Gentil", "Curandeira Perfeita"] },
  { id: "lin-wu", label: "Lin-Wu", domain: "Deus Samurai", energy: "Qualquer", weapon: "Katana", devotees: "Anões, cavaleiros, guerreiros, nobres, paladinos", grantedPowers: ["Coragem Total", "Kiai Divino", "Mente Vazia", "Tradição de Lin-Wu"] },
  { id: "marah", label: "Marah", domain: "Deusa da Paz", energy: "Positiva", weapon: "Não há", devotees: "Aggelus, elfos, hynne, qareen, bardos, nobres, paladinos", grantedPowers: ["Aura de Paz", "Dom da Esperança", "Palavras de Bondade", "Talento Artístico"] },
  { id: "megalokk", label: "Megalokk", domain: "Deus dos Monstros", energy: "Negativa", weapon: "Maça", devotees: "Goblins, medusas, minotauros, sulfure, trogs, bárbaros, caçadores, druidas, lutadores", grantedPowers: ["Olhar Amedrontador", "Presas Primordiais", "Urro Divino", "Voz dos Monstros"] },
  { id: "nimb", label: "Nimb", domain: "Deus do Caos", energy: "Qualquer", weapon: "Qualquer (à escolha do mestre)", devotees: "Goblins, qareen, sílfides, arcanistas, bárbaros, bardos, bucaneiros, inventores, ladinos", grantedPowers: ["Êxtase da Loucura", "Poder Oculto", "Sorte dos Loucos", "Transmissão da Loucura"] },
  { id: "oceano", label: "Oceano", domain: "Deus dos Mares", energy: "Qualquer", weapon: "Tridente", devotees: "Dahllan, hynne, minotauros, sereias/tritões, bárbaros, bucaneiros, caçadores, druidas", grantedPowers: ["Anfíbio", "Arsenal das Profundezas", "Mestre dos Mares", "Sopro do Mar"] },
  { id: "sszzaas", label: "Sszzaas", domain: "Deus da Traição", energy: "Negativa", weapon: "Adaga", devotees: "Medusas, arcanistas, bardos, bucaneiros, inventores, ladinos, nobres", grantedPowers: ["Astúcia da Serpente", "Familiar Ofídico", "Presas Venenosas", "Sangue Ofídico"] },
  { id: "tanna-toh", label: "Tanna-Toh", domain: "Deusa do Conhecimento", energy: "Qualquer", weapon: "Bordão", devotees: "Golens, kliren, arcanistas, bardos, inventores, nobres, paladinos", grantedPowers: ["Conhecimento Enciclopédico", "Mente Analítica", "Pesquisa Abençoada", "Voz da Civilização"] },
  { id: "tenebra", label: "Tenebra", domain: "Deusa das Trevas", energy: "Negativa", weapon: "Adaga", devotees: "Anões, medusas, qareen, osteon, sulfure, trogs, arcanistas, bardos, ladinos", grantedPowers: ["Carícia Sombria", "Manto da Penumbra", "Visão nas Trevas", "Zumbificar"] },
  { id: "thwor", label: "Thwor", domain: "Deus dos Goblinoides", energy: "Qualquer", weapon: "Machado de guerra", devotees: "Qualquer duyshidakk (povo goblinoide)", grantedPowers: ["Almejar o Impossível", "Fúria Divina", "Olhar Amedrontador", "Tropas Duyshidakk"] },
  { id: "thyatis", label: "Thyatis", domain: "Deus da Ressurreição", energy: "Positiva", weapon: "Espada longa", devotees: "Aggelus, cavaleiros, guerreiros, inventores, lutadores, paladinos", grantedPowers: ["Ataque Piedoso", "Dom da Imortalidade", "Dom da Profecia", "Dom da Ressurreição"] },
  { id: "valkaria", label: "Valkaria", domain: "Deusa da Ambição", energy: "Positiva", weapon: "Mangual", devotees: "Qualquer classe (aventureiros)", grantedPowers: ["Almejar o Impossível", "Armas da Ambição", "Coragem Total", "Liberdade Divina"] },
  { id: "wynna", label: "Wynna", domain: "Deusa da Magia", energy: "Qualquer", weapon: "Adaga", devotees: "Elfos, golens, qareen, sílfides, arcanistas, bardos", grantedPowers: ["Bênção do Mana", "Centelha Mágica", "Escudo Mágico", "Teurgista Místico"] },
];

export function deity(id: string): DeityInfo | undefined {
  const q = id.trim().toLowerCase();
  return DEITIES.find((d) => d.id === q || d.label.toLowerCase() === q);
}

// --- Poderes ---------------------------------------------------------------------------
// Índice completo (cap. 2 do livro): Combate/Destino/Magia/Tormenta vêm de ./powers.ts;
// os Concedidos são gerados aqui a partir das divindades (poder → "Devoto de X"). Nome +
// pré-requisito para todos; descrição preenchida para os Poderes de Combate (mais depois).
import { POWERS_BASE, type PowerInfo, type PowerCategory } from "./powers";
export type { PowerInfo, PowerCategory };

/** Poderes Concedidos derivados das divindades: cada poder concedido lista os deuses que
 * o concedem (une deuses que compartilham o mesmo poder). */
function concededPowers(): PowerInfo[] {
  const byPower = new Map<string, string[]>();
  for (const d of DEITIES) {
    for (const p of d.grantedPowers) {
      const arr = byPower.get(p) ?? [];
      arr.push(d.label);
      byPower.set(p, arr);
    }
  }
  return [...byPower.entries()]
    .map(([name, gods]) => ({ name, category: "Concedido" as PowerCategory, prereq: `Devoto de ${gods.join(", ")}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const POWERS: PowerInfo[] = [...POWERS_BASE, ...concededPowers()];

export function power(name: string): PowerInfo | undefined {
  const q = name.trim().toLowerCase();
  return POWERS.find((p) => p.name.toLowerCase() === q);
}
