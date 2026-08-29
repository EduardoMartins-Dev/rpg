import { describe, expect, it } from "vitest";

/**
 * The ILIKE pattern searchByKeyword builds, mirrored here so the spacing/apostrophe
 * tolerance is pinned by a test. Real text extraction is inconsistent about spacing
 * around apostrophes even within a single book — the V5 corebook yields "baal’s caress"
 * but "cat ’s grace" — so the apostrophe must map to '%' (any run), not '_' (exactly
 * one char). With '_' the keyword search found 93/95 catalog powers; with '%', all 95.
 */
function buildPattern(term: string): string {
  const esc = term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
  const flexible = esc.replace(/['’‘`´]/g, "%").replace(/\s+/g, "%");
  return `%${flexible}%`;
}

/** Minimal ILIKE evaluator (only % and _, case-insensitive) — enough for these patterns. */
function ilike(text: string, pattern: string): boolean {
  const rx = pattern
    .split("")
    .map((ch) => {
      if (ch === "%") return ".*";
      if (ch === "_") return ".";
      return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  return new RegExp(`^${rx}$`, "is").test(text);
}

describe("searchByKeyword ILIKE pattern — tolerância de apóstrofo e espaçamento", () => {
  const variants = (name: string) => [
    `Level 1 ${name} The vampire gains...`,
    `Level 1 ${name.toLowerCase()} the vampire gains...`,
  ];

  it("casa apóstrofo reto na busca com apóstrofo curvo no índice", () => {
    const p = buildPattern("Baal's Caress");
    for (const t of variants("baal’s caress")) expect(ilike(t, p)).toBe(true);
  });

  it("casa mesmo quando a extração põe espaço ANTES do apóstrofo", () => {
    // regressão: com '_' (1 char) isso falhava — " ’" são dois caracteres
    const p = buildPattern("Cat's Grace");
    for (const t of variants("cat ’s grace")) expect(ilike(t, p)).toBe(true);
    expect(ilike("Level 4 spirit ’s touch ...", buildPattern("Spirit's Touch"))).toBe(true);
  });

  it("casa nome sem apóstrofo nenhum no índice", () => {
    expect(ilike("Level 1 cats grace ...", buildPattern("Cat's Grace"))).toBe(true);
  });

  it("casa nome quebrado entre linhas pelo extrator de PDF", () => {
    expect(ilike("Level 4 draught of\nendurance grants...", buildPattern("Draught of Endurance"))).toBe(true);
  });

  it("não confunde poderes de nomes quase idênticos", () => {
    expect(ilike("Level 4 draught of elegance ...", buildPattern("Draught of Endurance"))).toBe(false);
    expect(ilike("Level 4 draught of endurance ...", buildPattern("Draught of Elegance"))).toBe(false);
  });

  it("escapa curingas literais do próprio termo", () => {
    expect(buildPattern("100% Power")).toBe("%100\\%%Power%");
    expect(buildPattern("a_b")).toBe("%a\\_b%");
  });
});
