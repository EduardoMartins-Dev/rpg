import { describe, expect, it } from "vitest";
import { process } from "./sheetProcessor";

describe("V5 sheet processor — parity with V5SheetProcessor.java / journey.spec.ts", () => {
  it("computes derived.vitality = vigor + 3 and derived.willpower = autocontrole + determinacao", () => {
    const out = process(
      { type: "vampiro", attributes: { vigor: 3, autocontrole: 3, determinacao: 2 } },
      null,
    );
    expect(out.derived).toEqual({ vitality: 6, willpower: 5 });
  });

  it("auto-populates clanDisciplines/bane/compulsion from clan (BRUJAH -> Celeridade)", () => {
    const out = process({ type: "VAMPIRO", clan: "brujah" }, null);
    expect(out.clan).toBe("BRUJAH");
    expect(out.clanDisciplines).toContain("Celeridade");
    expect(out.bane).toBeTruthy();
    expect(out.compulsion).toBe("Rebelião");
  });

  it("discards client-submitted clanDisciplines/bane/compulsion in favor of the catalog", () => {
    const out = process(
      { type: "VAMPIRO", clan: "brujah", clanDisciplines: ["Fake"], bane: "fake", compulsion: "fake" },
      null,
    );
    expect(out.clanDisciplines).toEqual(["Celeridade", "Potência", "Presença"]);
    expect(out.compulsion).toBe("Rebelião");
  });

  it("rejects a mortal with a clan or predatorType", () => {
    expect(() => process({ type: "MORTAL", clan: "brujah" }, null)).toThrow(/mortal has no clan/);
    expect(() => process({ type: "MORTAL", predatorType: "Gatuno" }, null)).toThrow(/mortal has no clan/);
  });

  it("strips clanDisciplines/bane/compulsion for a mortal without them set", () => {
    const out = process({ type: "MORTAL", clanDisciplines: ["x"], bane: "x", compulsion: "x" }, null);
    expect(out.clanDisciplines).toBeUndefined();
    expect(out.bane).toBeUndefined();
    expect(out.compulsion).toBeUndefined();
  });

  it("rejects an unknown character type", () => {
    expect(() => process({ type: "ALIEN" }, null)).toThrow(/unknown character type/);
  });

  it("rejects an unknown clan name", () => {
    expect(() => process({ type: "VAMPIRO", clan: "not-a-clan" }, null)).toThrow(/unknown clan/);
  });

  it("rejects a trait out of range 1-5", () => {
    expect(() => process({ type: "VAMPIRO", attributes: { vigor: 6 } }, null)).toThrow(/out of range/);
    expect(() => process({ type: "VAMPIRO", attributes: { vigor: 0 } }, null)).toThrow(/out of range/);
  });

  it("rejects an unknown attribute field when the schema declares a closed set", () => {
    expect(() =>
      process({ type: "VAMPIRO", attributes: { vigor: 3, madeup: 2 } }, { attributes: ["vigor", "forca"] }),
    ).toThrow(/unknown attributes field/);
  });

  it("allows arbitrary attribute fields when the schema declares none", () => {
    const out = process({ type: "VAMPIRO", attributes: { anything: 3 } }, null);
    expect((out.attributes as Record<string, number>).anything).toBe(3);
  });

  it("does not validate sheetData.disciplines at all (freeform, per disciplines.spec.ts)", () => {
    const out = process(
      { type: "VAMPIRO", disciplines: [{ name: "Qualquer Coisa", powers: [{ name: "Poder Livre" }] }] },
      null,
    );
    expect(out.disciplines).toEqual([{ name: "Qualquer Coisa", powers: [{ name: "Poder Livre" }] }]);
  });

  it("rejects non-object sheetData", () => {
    expect(() => process(null, null)).toThrow(/must be a JSON object/);
    expect(() => process([1, 2], null)).toThrow(/must be a JSON object/);
  });
});
