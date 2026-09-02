import { describe, it, expect } from "vitest";
import * as Eng from "./engine";

describe("T20 engine", () => {
  it("bônus de treinamento por faixa de nível", () => {
    expect(Eng.trainingBonus(1)).toBe(2);
    expect(Eng.trainingBonus(6)).toBe(2);
    expect(Eng.trainingBonus(7)).toBe(4);
    expect(Eng.trainingBonus(14)).toBe(4);
    expect(Eng.trainingBonus(15)).toBe(6);
    expect(Eng.trainingBonus(20)).toBe(6);
  });

  it("valor de perícia = ⌊nível/2⌋ + atributo + treino", () => {
    // guerreiro nível 3, Força 4, Luta treinada → 1 + 4 + 2 = 7
    expect(Eng.skillValue(3, 4, true, 0)).toBe(7);
    // não treinada → 1 + 4 = 5
    expect(Eng.skillValue(3, 4, false, 0)).toBe(5);
    // nível 7 treinada → 3 + 2 + 4 = 9
    expect(Eng.skillValue(7, 2, true, 0)).toBe(9);
    // outros modificadores somam
    expect(Eng.skillValue(1, 0, false, 5)).toBe(5);
  });

  it("Defesa = 10 + Destreza + armadura + escudo + outros", () => {
    expect(Eng.defense(2, 5, 2, 0)).toBe(19);
    expect(Eng.defense(3)).toBe(13);
  });

  it("PV máximo = base + (nível-1)×ganho + nível×Con", () => {
    // guerreiro (20/+5) nível 3, Con 3 → 20 + 10 + 9 = 39
    expect(Eng.pvMax(20, 5, 3, 3)).toBe(39);
    // nível 1 → base + Con
    expect(Eng.pvMax(20, 5, 1, 3)).toBe(23);
  });

  it("PM máximo = ganho por nível × nível", () => {
    expect(Eng.pmMax(3, 3)).toBe(9);
    expect(Eng.pmMax(6, 5)).toBe(30);
  });

  it("resolveD20: sucesso, crítico e falha", () => {
    const win = Eng.resolveD20([15], 7, 20);
    expect(win.total).toBe(22);
    expect(win.success).toBe(true);
    const crit = Eng.resolveD20([20], 0, 25);
    expect(crit.critical).toBe(true);
    const fumble = Eng.resolveD20([1], 10, 5);
    expect(fumble.fumble).toBe(true);
    expect(fumble.success).toBe(true); // 1+10=11 ≥ 5 (falha crítica não é automática em teste comum)
    const semDt = Eng.resolveD20([12], 3, null);
    expect(semDt.success).toBeNull();
    expect(semDt.total).toBe(15);
  });

  it("resolveD20: vantagem pega o maior, desvantagem o menor", () => {
    expect(Eng.resolveD20([5, 18], 0, null, "vantagem").natural).toBe(18);
    expect(Eng.resolveD20([5, 18], 0, null, "desvantagem").natural).toBe(5);
  });
});
