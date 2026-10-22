import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const KEY = "research-state-v1";

// GET /api/state — durable, cross-device research state (cases/datasets/models)
export async function GET() {
  try {
    const row = await db.appState.findUnique({ where: { key: KEY } });
    if (!row) return NextResponse.json({ ok: true, state: null });
    return NextResponse.json({ ok: true, state: JSON.parse(row.value) });
  } catch {
    return NextResponse.json({ ok: true, state: null });
  }
}

// POST /api/state — persist the full research state blob to the DB
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const value = JSON.stringify(body?.state ?? {});
    await db.appState.upsert({
      where: { key: KEY },
      create: { key: KEY, value },
      update: { value },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
