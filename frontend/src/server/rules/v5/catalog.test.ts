import { describe, expect, it } from "vitest";
import * as catalog from "./catalog";

describe("V5 catalog — structural parity with V5Catalog.java", () => {
  it("has 16 clans", () => {
    expect(catalog.clans()).toHaveLength(16);
  });

  it("has 27 abilities across 3 categories of 9 each", () => {
    expect(catalog.abilities()).toHaveLength(27);
    expect(catalog.abilities("FISICAS")).toHaveLength(9);
    expect(catalog.abilities("SOCIAIS")).toHaveLength(9);
    expect(catalog.abilities("MENTAIS")).toHaveLength(9);
  });

  it("has 11 disciplines", () => {
    expect(catalog.disciplines()).toHaveLength(11);
  });

  it("has 10 predator types, 5 resonances, 6 coterie types", () => {
    expect(catalog.predatorTypes()).toHaveLength(10);
    expect(catalog.resonances()).toHaveLength(5);
    expect(catalog.coterieTypes()).toHaveLength(6);
  });

  it("has 7 blood potency tiers (0-6)", () => {
    for (let i = 0; i <= 6; i++) {
      expect(catalog.bloodPotency(i).potency).toBe(i);
    }
    expect(() => catalog.bloodPotency(7)).toThrow();
    expect(() => catalog.bloodPotency(-1)).toThrow();
  });

  it("resolves clan names with hyphens/spaces case-insensitively", () => {
    expect(catalog.clanOf("brujah")).toBe("BRUJAH");
    expect(catalog.clanOf("Banu-Haqim")).toBe("BANU_HAQIM");
    expect(catalog.clanOf("Banu Haqim")).toBe("BANU_HAQIM");
    expect(() => catalog.clanOf("not-a-clan")).toThrow();
  });

  it("BRUJAH has the 3 clan disciplines from the book", () => {
    const brujah = catalog.clan("BRUJAH");
    expect(brujah.disciplines).toEqual(["Celeridade", "Potência", "Presença"]);
  });

  it("matches the exact power count per discipline from V5Catalog.java", () => {
    const expected: Record<string, number> = {
      "Animalismo": 9,
      "Auspícios": 9,
      "Celeridade": 9,
      "Dominação": 9,
      "Fortitude": 9,
      "Ofuscação": 9,
      "Potência": 9,
      "Presença": 9,
      "Proteanismo": 8,
      "Feitiçaria de Sangue": 8,
      "Alquimia de Sangue-Ralo": 7,
    };
    for (const d of catalog.disciplines()) {
      expect(d.powers, d.name).toHaveLength(expected[d.name]);
    }
  });
});
