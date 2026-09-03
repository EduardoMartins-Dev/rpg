// Catálogo de armas do Tormenta 20 (livro básico, Tabela 3-3), só as estatísticas de jogo:
// categoria (Simples/Marcial/Exótica/Fogo), dano, crítico, tipo, empunhadura e alcance.
// Serve de base para o jogador escolher uma arma e então aplicar modificações na ficha.

export type WeaponCategory = "Simples" | "Marcial" | "Exótica" | "Fogo";
export type WeaponInfo = {
  nome: string; categoria: WeaponCategory;
  dano: string; critico: string; tipo: string;
  empunhadura: "Leve" | "Uma mão" | "Duas mãos";
  alcance?: string; // "Curto" | "Médio" (armas de arremesso/disparo); ausente = corpo a corpo
};

export const WEAPONS: WeaponInfo[] = [
  // Simples — corpo a corpo
  { nome: "Adaga", categoria: "Simples", dano: "1d4", critico: "19", tipo: "Perfuração", empunhadura: "Leve", alcance: "Curto" },
  { nome: "Espada curta", categoria: "Simples", dano: "1d6", critico: "19", tipo: "Perfuração", empunhadura: "Leve" },
  { nome: "Foice", categoria: "Simples", dano: "1d6", critico: "x3", tipo: "Corte", empunhadura: "Leve" },
  { nome: "Clava", categoria: "Simples", dano: "1d6", critico: "x2", tipo: "Impacto", empunhadura: "Uma mão" },
  { nome: "Lança", categoria: "Simples", dano: "1d6", critico: "x2", tipo: "Perfuração", empunhadura: "Uma mão", alcance: "Curto" },
  { nome: "Maça", categoria: "Simples", dano: "1d8", critico: "x2", tipo: "Impacto", empunhadura: "Uma mão" },
  { nome: "Bordão", categoria: "Simples", dano: "1d6/1d6", critico: "x2", tipo: "Impacto", empunhadura: "Duas mãos" },
  { nome: "Pique", categoria: "Simples", dano: "1d8", critico: "x2", tipo: "Perfuração", empunhadura: "Duas mãos" },
  { nome: "Tacape", categoria: "Simples", dano: "1d10", critico: "x2", tipo: "Impacto", empunhadura: "Duas mãos" },
  // Simples — à distância
  { nome: "Azagaia", categoria: "Simples", dano: "1d6", critico: "x2", tipo: "Perfuração", empunhadura: "Uma mão", alcance: "Médio" },
  { nome: "Besta leve", categoria: "Simples", dano: "1d8", critico: "19", tipo: "Perfuração", empunhadura: "Uma mão", alcance: "Médio" },
  { nome: "Funda", categoria: "Simples", dano: "1d4", critico: "x2", tipo: "Impacto", empunhadura: "Uma mão", alcance: "Médio" },
  { nome: "Arco curto", categoria: "Simples", dano: "1d6", critico: "x3", tipo: "Perfuração", empunhadura: "Duas mãos", alcance: "Médio" },
  // Marciais — corpo a corpo
  { nome: "Machadinha", categoria: "Marcial", dano: "1d6", critico: "x3", tipo: "Corte", empunhadura: "Leve" },
  { nome: "Cimitarra", categoria: "Marcial", dano: "1d6", critico: "18", tipo: "Corte", empunhadura: "Uma mão" },
  { nome: "Espada longa", categoria: "Marcial", dano: "1d8", critico: "19", tipo: "Corte", empunhadura: "Uma mão" },
  { nome: "Florete", categoria: "Marcial", dano: "1d6", critico: "18", tipo: "Perfuração", empunhadura: "Uma mão" },
  { nome: "Machado de batalha", categoria: "Marcial", dano: "1d8", critico: "x3", tipo: "Corte", empunhadura: "Uma mão" },
  { nome: "Mangual", categoria: "Marcial", dano: "1d8", critico: "x2", tipo: "Impacto", empunhadura: "Uma mão" },
  { nome: "Martelo de guerra", categoria: "Marcial", dano: "1d8", critico: "x3", tipo: "Impacto", empunhadura: "Uma mão" },
  { nome: "Picareta", categoria: "Marcial", dano: "1d6", critico: "x4", tipo: "Perfuração", empunhadura: "Uma mão" },
  { nome: "Tridente", categoria: "Marcial", dano: "1d8", critico: "x2", tipo: "Perfuração", empunhadura: "Uma mão" },
  { nome: "Alabarda", categoria: "Marcial", dano: "1d10", critico: "x3", tipo: "Corte/perfuração", empunhadura: "Duas mãos" },
  { nome: "Alfange", categoria: "Marcial", dano: "2d4", critico: "18", tipo: "Corte", empunhadura: "Duas mãos" },
  { nome: "Gadanho", categoria: "Marcial", dano: "2d4", critico: "x4", tipo: "Corte", empunhadura: "Duas mãos" },
  { nome: "Lança montada", categoria: "Marcial", dano: "1d8", critico: "x3", tipo: "Perfuração", empunhadura: "Duas mãos" },
  { nome: "Machado de guerra", categoria: "Marcial", dano: "1d12", critico: "x3", tipo: "Corte", empunhadura: "Duas mãos" },
  { nome: "Marreta", categoria: "Marcial", dano: "3d4", critico: "x2", tipo: "Impacto", empunhadura: "Duas mãos" },
  { nome: "Montante", categoria: "Marcial", dano: "2d6", critico: "19", tipo: "Corte", empunhadura: "Duas mãos" },
  // Marciais — à distância
  { nome: "Arco longo", categoria: "Marcial", dano: "1d8", critico: "x3", tipo: "Perfuração", empunhadura: "Duas mãos", alcance: "Médio" },
  { nome: "Besta pesada", categoria: "Marcial", dano: "1d12", critico: "19", tipo: "Perfuração", empunhadura: "Duas mãos", alcance: "Médio" },
  // Exóticas
  { nome: "Chicote", categoria: "Exótica", dano: "1d3", critico: "x2", tipo: "Corte", empunhadura: "Uma mão" },
  { nome: "Espada bastarda", categoria: "Exótica", dano: "1d10/1d12", critico: "19", tipo: "Corte", empunhadura: "Uma mão" },
  { nome: "Katana", categoria: "Exótica", dano: "1d8/1d10", critico: "19", tipo: "Corte", empunhadura: "Uma mão" },
  { nome: "Machado anão", categoria: "Exótica", dano: "1d10", critico: "x3", tipo: "Corte", empunhadura: "Uma mão" },
  { nome: "Corrente de espinhos", categoria: "Exótica", dano: "2d4/2d4", critico: "19", tipo: "Corte", empunhadura: "Duas mãos" },
  { nome: "Machado táurico", categoria: "Exótica", dano: "2d8", critico: "x3", tipo: "Corte", empunhadura: "Duas mãos" },
  { nome: "Rede", categoria: "Exótica", dano: "—", critico: "—", tipo: "—", empunhadura: "Duas mãos", alcance: "Curto" },
  // Fogo (raras — exigem treinamento)
  { nome: "Pistola", categoria: "Fogo", dano: "2d6", critico: "x3", tipo: "Perfuração", empunhadura: "Uma mão", alcance: "Curto" },
  { nome: "Mosquete", categoria: "Fogo", dano: "2d8", critico: "x3", tipo: "Perfuração", empunhadura: "Duas mãos", alcance: "Médio" },
];

export function weapon(nome: string): WeaponInfo | undefined {
  const q = nome.trim().toLowerCase();
  return WEAPONS.find((w) => w.nome.toLowerCase() === q);
}
