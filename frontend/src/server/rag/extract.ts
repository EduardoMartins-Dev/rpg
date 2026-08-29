import { ApiError } from "@/server/http/errors";

/**
 * Port of backend/src/main/java/com/portalrpg/rag/DocumentTextExtractor.java.
 * Plain text (.txt/.md) is read as UTF-8; PDF is extracted via pdf-parse (the JS
 * equivalent of PDFBox's PDFTextStripper). Downstream (chunk -> embed -> pgvector ->
 * retrieval) is identical for both.
 */
export async function extractBytes(bytes: Uint8Array, filename: string | null | undefined): Promise<string> {
  const name = (filename ?? "").toLowerCase();
  if (name.endsWith(".pdf")) {
    return extractPdf(bytes);
  }
  return Buffer.from(bytes).toString("utf-8");
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  let text: string;
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: Buffer.from(bytes) });
    try {
      const result = await parser.getText();
      text = result.text;
    } finally {
      await parser.destroy();
    }
  } catch (e) {
    throw ApiError.badRequest(`invalid or unreadable PDF: ${e instanceof Error ? e.message : "unknown error"}`);
  }
  if (!text || text.trim().length === 0) {
    throw ApiError.badRequest("could not extract text from PDF (it may be scanned/image-only)");
  }
  return text;
}
