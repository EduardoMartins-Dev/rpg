/**
 * Port of backend/src/main/java/com/portalrpg/rag/RagIndexingService.java's paragraph
 * chunking (the `chunk` static method + its helpers). See the Java comments for the
 * rationale — short paragraphs (power names/headings) are merged into the NEXT content
 * paragraph instead of becoming their own chunk or being dropped, long paragraphs are
 * split at word boundaries, and index/TOC-looking pages are filtered out.
 */

// Larger chunk keeps a whole clan/discipline description in one piece instead of just
// the mention/heading. jina-v3 (8192 tokens) and the LLM have plenty of room.
const MAX_CHUNK_CHARS = 1100;

// Short paragraphs (power name, "Level 2", section heading) don't become a chunk on
// their own: accumulated and PREFIXED onto the next content paragraph so the power's
// NAME stays attached to its MECHANICS in the same chunk.
const MIN_CHUNK_CHARS = 40;

// Cap on the accumulated prefix: keeps a long run of short/noisy lines (e.g. a header
// repeated across pages) from bloating the next chunk.
const MAX_PENDING_CHARS = 200;

// Index/TOC pages ("Draught Of Elegance 254 Draught Of Endurance 259 ...") have lots of
// page numbers and no useful content — 6+ page-number-looking tokens in one chunk means
// discard it.
const PAGE_NUM = /\b\d{2,4}\b/g;

function looksLikeIndex(text: string): boolean {
  const matches = text.match(PAGE_NUM);
  return (matches?.length ?? 0) >= 6;
}

function addUseful(out: string[], chunkText: string): void {
  if (chunkText.length === 0 || looksLikeIndex(chunkText)) return;
  out.push(chunkText);
}

function appendPending(pending: string, heading: string): string {
  let next = pending.length > 0 ? `${pending} ${heading}` : heading;
  if (next.length > MAX_PENDING_CHARS) {
    next = next.slice(next.length - MAX_PENDING_CHARS);
  }
  return next;
}

export function chunk(text: string | null | undefined): string[] {
  const out: string[] = [];
  if (text == null) return out;
  let pending = "";
  for (const para of text.split(/\r?\n\s*\r?\n/)) {
    let p = para.trim().replace(/\s+/g, " ");
    if (p.length === 0) continue;
    if (p.length < MIN_CHUNK_CHARS) {
      pending = appendPending(pending, p);
      continue;
    }
    if (pending.length > 0) {
      p = `${pending} ${p}`;
      pending = "";
    }
    while (p.length > MAX_CHUNK_CHARS) {
      let cut = p.lastIndexOf(" ", MAX_CHUNK_CHARS);
      if (cut <= 0) cut = MAX_CHUNK_CHARS;
      addUseful(out, p.slice(0, cut).trim());
      p = p.slice(cut).trim();
    }
    if (p.length > 0) {
      addUseful(out, p); // tail of a long paragraph is kept even if short
    }
  }
  // Trailing headings with no following content are only emitted if they already have
  // enough density on their own.
  if (pending.length >= MIN_CHUNK_CHARS) {
    addUseful(out, pending.trim());
  }
  return out;
}
