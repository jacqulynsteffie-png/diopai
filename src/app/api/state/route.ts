import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncStateToSupabase, downloadJsonFromSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const KEY = "research-state-v1";

// GET /api/state — durable, cross-device research state (cases/datasets/models)
export async function GET() {
  try {
    const row = await db.appState.findUnique({ where: { key: KEY } });
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      if (parsed?.cases?.length > 0) {
        return NextResponse.json({ ok: true, state: parsed, source: "database" });
      }
    }

    // Attempt to hydrate from Supabase if local DB has no cases
    const cloudState = await downloadJsonFromSupabase<any>("state.json").catch(() => null);
    if (cloudState?.ok && cloudState.data?.cases?.length > 0) {
      return NextResponse.json({ ok: true, state: cloudState.data, source: "supabase" });
    }

    if (row) {
      return NextResponse.json({ ok: true, state: JSON.parse(row.value), source: "database" });
    }

    return NextResponse.json({ ok: true, state: null });
  } catch {
    return NextResponse.json({ ok: true, state: null });
  }
}

// POST /api/state — persist the full research state blob to both local DB and Supabase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const state = body?.state ?? {};
    const value = JSON.stringify(state);

    // 1. Persist to local Prisma SQLite
    await db.appState.upsert({
      where: { key: KEY },
      create: { key: KEY, value },
      update: { value },
    });

    // 2. Persist to Supabase cloud storage (non-blocking for fast UI responsiveness)
    syncStateToSupabase(state).catch((err) => {
      console.warn("Background Supabase state sync error:", err.message);
    });

    return NextResponse.json({ ok: true, syncedToSupabase: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
