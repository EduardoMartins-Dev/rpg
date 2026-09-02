/**
 * Seleciona o processador de ficha pelo ruleset do sistema. V5 continua sendo o padrão
 * (qualquer ruleset desconhecido cai no V5, preservando o comportamento atual); "t20"
 * usa o motor do Tormenta 20. Este é o único ponto de decisão — o resto de cada motor
 * vive isolado em src/server/rules/<ruleset>/, sem um saber do outro.
 */
import { process as v5Process, type SheetSchema } from "@/server/rules/v5/sheetProcessor";
import { process as t20Process } from "@/server/rules/t20/sheetProcessor";

export type { SheetSchema };

export function processSheet(ruleset: string | null | undefined, sheetData: unknown, schema: SheetSchema): Record<string, unknown> {
  if ((ruleset ?? "v5") === "t20") return t20Process(sheetData);
  return v5Process(sheetData, schema);
}
