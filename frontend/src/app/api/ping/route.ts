import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", service: "portal-rpg", time: new Date().toISOString() });
}
