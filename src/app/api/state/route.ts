import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncStateToSupabase, downloadJsonFromSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "research-state-v1";

// GET /api/state — durable, cross-device research state
export async function GET() {
  // 1. Primary Source: Supabase Cloud Storage (accessible across all devices: desktop, mobile, tablet)
  try {
    const cloud = await downloadJsonFromSupabase<any>("state.json");
    if (cloud?.ok && cloud.data && Array.isArray(cloud.data.cases) && cloud.data.cases.length > 0) {
      return NextResponse.json({
        ok: true,
        state: cloud.data,
        source: "supabase",
        syncedAt: cloud.data.syncedAt,
      });
    }
  } catch (e) {
    console.warn("Supabase state fetch error:", (e as Error).message);
  }

  // 2. Fallback: Local SQLite database
  try {
    const row = await db.appState.findUnique({ where: { key: KEY } });
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      return NextResponse.json({
        ok: true,
        state: parsed,
        source: "database",
      });
    }
  } catch (e) {
    console.warn("SQLite fetch fallback error:", (e as Error).message);
  }

  return NextResponse.json({ ok: true, state: null });
}

// POST /api/state — persist state to Supabase Cloud and local SQLite
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const state = body?.state ?? {};
    const value = JSON.stringify(state);

    // 1. Primary: Save to Supabase Cloud Storage so all devices receive it immediately
    let cloudSynced = false;
    try {
      const syncResult = await syncStateToSupabase(state);
      cloudSynced = syncResult.status === "success" || syncResult.status === "partial";
    } catch (err) {
      console.error("Supabase sync error in POST /api/state:", (err as Error).message);
    }

    // 2. Secondary: Persist to local Prisma SQLite (safe in serverless / read-only filesystems)
    try {
      await db.appState.upsert({
        where: { key: KEY },
        create: { key: KEY, value },
        update: { value },
      });
    } catch (e) {
      // Non-fatal: in serverless/Netlify environments, SQLite may be read-only
      console.warn("Local SQLite write skipped (serverless environment):", (e as Error).message);
    }

    return NextResponse.json({ ok: true, syncedToSupabase: cloudSynced });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
