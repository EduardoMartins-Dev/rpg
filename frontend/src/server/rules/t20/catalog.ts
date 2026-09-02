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
};

export const CLASSES: ClassInfo[] = [
  { id: "arcanista", label: "Arcanista", pvBase: 8, pvPerLevel: 2, pmPerLevel: 6 },
  { id: "barbaro", label: "Bárbaro", pvBase: 24, pvPerLevel: 6, pmPerLevel: 3 },
  { id: "bardo", label: "Bardo", pvBase: 12, pvPerLevel: 3, pmPerLevel: 4 },
  { id: "bucaneiro", label: "Bucaneiro", pvBase: 16, pvPerLevel: 4, pmPerLevel: 3 },
  { id: "cacador", label: "Caçador", pvBase: 16, pvPerLevel: 4, pmPerLevel: 4 },
  { id: "cavaleiro", label: "Cavaleiro", pvBase: 20, pvPerLevel: 5, pmPerLevel: 3 },
  { id: "clerigo", label: "Clérigo", pvBase: 16, pvPerLevel: 4, pmPerLevel: 5 },
  { id: "druida", label: "Druida", pvBase: 16, pvPerLevel: 4, pmPerLevel: 4 },
  { id: "guerreiro", label: "Guerreiro", pvBase: 20, pvPerLevel: 5, pmPerLevel: 3 },
  { id: "inventor", label: "Inventor", pvBase: 12, pvPerLevel: 3, pmPerLevel: 4 },
  { id: "ladino", label: "Ladino", pvBase: 12, pvPerLevel: 3, pmPerLevel: 4 },
  { id: "lutador", label: "Lutador", pvBase: 20, pvPerLevel: 5, pmPerLevel: 3 },
  { id: "nobre", label: "Nobre", pvBase: 16, pvPerLevel: 4, pmPerLevel: 4 },
  { id: "paladino", label: "Paladino", pvBase: 20, pvPerLevel: 5, pmPerLevel: 3 },
];

export function classInfo(id: string): ClassInfo | undefined {
  const q = id.trim().toLowerCase();
  return CLASSES.find((c) => c.id === q || c.label.toLowerCase() === q);
}

// --- Raças (17) ------------------------------------------------------------------------
// Nomes do livro básico. Modificadores de atributo e habilidades entram numa passada
// dedicada (verificados um a um contra o livro), por isso aqui só o rótulo por enquanto.

export const RACES: { id: string; label: string }[] = [
  { id: "humano", label: "Humano" },
  { id: "anao", label: "Anão" },
  { id: "dahllan", label: "Dahllan" },
  { id: "elfo", label: "Elfo" },
  { id: "goblin", label: "Goblin" },
  { id: "lefou", label: "Lefou" },
  { id: "minotauro", label: "Minotauro" },
  { id: "qareen", label: "Qareen" },
  { id: "golem", label: "Golem" },
  { id: "hynne", label: "Hynne" },
  { id: "kliren", label: "Kliren" },
  { id: "medusa", label: "Medusa" },
  { id: "osteon", label: "Osteon" },
  { id: "sereia", label: "Sereia/Tritão" },
  { id: "silfide", label: "Sílfide" },
  { id: "suraggel", label: "Suraggel" },
  { id: "trog", label: "Trog" },
];
