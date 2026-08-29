import { describe, expect, it } from "vitest";
import { embed } from "./hashing";
import javaReference from "./__fixtures__/hashing-java-reference.json";

// Reference vectors captured by compiling and running the ORIGINAL Java
// HashingEmbeddingModel.embed() (JDK 21) against these exact strings — see
// the migration plan for why byte-parity with production matters here.
const SAMPLES = [
  "hello",
  "Vitalidade",
  "vitalidade = vigor + 3",
  "Baal's Caress",
  "Força de Vontade",
  "Não há material indexado para este sistema",
  "N1 Graça Felina [Cat's Grace]",
  "",
  "   ",
  "a b c",
  "1024 dimensões, teste com números 42 e pontuação!!! ção",
];

describe("hashing embedding — parity with Java HashingEmbeddingModel", () => {
  it.each(SAMPLES.map((s, i) => [s, i] as const))("matches Java output for %j", (sample, idx) => {
    const jsVec = embed(sample);
    const javaVec = javaReference[idx] as number[];
    expect(jsVec).toHaveLength(1024);
    for (let i = 0; i < 1024; i++) {
      expect(jsVec[i]).toBeCloseTo(javaVec[i], 6);
    }
  });
});
