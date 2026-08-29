import { describe, expect, it } from "vitest";
import { chunk } from "./chunk";

describe("chunk", () => {
  it("merges a short heading into the next content paragraph", () => {
    const text = "Level 2\n\nThis is a long enough paragraph of actual content to become its own chunk on its own merit here.";
    const out = chunk(text);
    expect(out).toHaveLength(1);
    expect(out[0].startsWith("Level 2 This is a long enough paragraph")).toBe(true);
  });

  it("keeps a long content paragraph as its own chunk", () => {
    const text = "This is a long enough paragraph of actual content to become its own chunk on its own merit here, easily.";
    const out = chunk(text);
    expect(out).toEqual([text]);
  });

  it("splits paragraphs longer than MAX_CHUNK_CHARS at a word boundary", () => {
    const word = "lorem ";
    const text = word.repeat(300).trim(); // ~1799 chars, well past 1100
    const out = chunk(text);
    expect(out.length).toBeGreaterThan(1);
    for (const c of out) {
      expect(c.length).toBeLessThanOrEqual(1100);
      expect(c.endsWith(" ")).toBe(false);
    }
  });

  it("drops chunks that look like an index/TOC page (6+ page numbers)", () => {
    const text = "Draught Of Elegance 254 Draught Of Endurance 259 Draught Of Fortitude 260 Draught Of Might 261 Draught Of Speed 262 Draught Of Vigor 263";
    expect(chunk(text)).toEqual([]);
  });

  it("emits a trailing heading only if it reaches MIN_CHUNK_CHARS on its own", () => {
    expect(chunk("short")).toEqual([]);
    const longEnoughHeading = "This heading alone is already forty-plus characters long";
    expect(chunk(longEnoughHeading)).toEqual([longEnoughHeading]);
  });

  it("returns empty array for null/empty input", () => {
    expect(chunk(null)).toEqual([]);
    expect(chunk("")).toEqual([]);
  });
});
