import type { z } from "zod";
import type { NextRequest } from "next/server";
import { ApiError } from "./errors";

/** Parses the JSON body and validates it against `schema`. A malformed JSON
 * body is a 400 (same as Spring's unreadable-body handling); a schema
 * violation is left to bubble as a ZodError, which `withRoute` formats as
 * 400 "field: message; field2: message2". */
export async function parseBody<T extends z.ZodTypeAny>(req: NextRequest, schema: T): Promise<z.infer<T>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw ApiError.badRequest("malformed JSON body");
  }
  return schema.parse(json);
}
