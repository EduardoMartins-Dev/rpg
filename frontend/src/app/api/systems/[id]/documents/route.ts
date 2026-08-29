import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { ApiError } from "@/server/http/errors";
import { requireAdmin, requireAuth } from "@/server/http/guards";
import { listDocuments, uploadDocument } from "@/server/modules/system/service";

// Large PDFs can exceed the default Route Handler body limit on some hosts — the
// signed-upload-url flow (POST /documents/upload-url) is the recommended path for big
// files; this one stays for parity with small/direct uploads.
export const maxDuration = 60;

export async function GET(req: NextRequest, ctx: RouteContext<"/api/systems/[id]/documents">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const { id } = await ctx.params;
    return NextResponse.json(await listDocuments(id));
  });
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/systems/[id]/documents">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const { id } = await ctx.params;
    const clear = req.nextUrl.searchParams.get("clear") === "true";

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw ApiError.badRequest("file is required");
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await uploadDocument(id, file.name, file.type, bytes, clear);
    return NextResponse.json(doc, { status: 201 });
  });
}
