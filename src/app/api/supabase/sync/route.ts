import { NextRequest, NextResponse } from "next/server";
import {
  syncStateToSupabase,
  listSupabaseObjects,
  downloadJsonFromSupabase,
} from "@/lib/supabase";
import { db } from "@/lib/db";
import {
  generateDemoCases,
  generateDemoDatasets,
  generateDemoModels,
  generateDemoReports,
  generateDemoAuditLogs,
  generateDemoUsers,
} from "@/lib/demo-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_KEY = "research-state-v1";

// GET /api/supabase/sync — list objects currently stored in Supabase
export async function GET() {
  try {
    const objects = await listSupabaseObjects();
    const meta = await downloadJsonFromSupabase<any>("state.json");
    return NextResponse.json({
      ok: true,
      bucket: "research-data",
      totalObjects: objects.length,
      objects,
      lastSync: meta.data?.syncedAt || null,
      summary: {
        casesCount: meta.data?.cases?.length ?? 0,
        datasetsCount: meta.data?.datasets?.length ?? 0,
        modelsCount: meta.data?.models?.length ?? 0,
        reportsCount: meta.data?.reports?.length ?? 0,
        auditLogsCount: meta.data?.auditLogs?.length ?? 0,
        usersCount: meta.data?.users?.length ?? 0,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/supabase/sync — trigger full synchronization to Supabase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let state = body?.state;

    // If no state payload sent, pull from DB or fallback to default sample dataset
    if (!state) {
      const row = await db.appState.findUnique({ where: { key: STATE_KEY } });
      if (row?.value) {
        state = JSON.parse(row.value);
      }
    }

    // If reset requested or state was empty, seed with the full scientific demo dataset
    if (body?.reset || !state || !state.cases?.length) {
      state = {
        cases: generateDemoCases(128),
        datasets: generateDemoDatasets(),
        models: generateDemoModels(),
        reports: generateDemoReports(),
        auditLogs: generateDemoAuditLogs(),
        users: generateDemoUsers(),
      };
      // also cache in db
      await db.appState
        .upsert({
          where: { key: STATE_KEY },
          create: { key: STATE_KEY, value: JSON.stringify(state) },
          update: { value: JSON.stringify(state) },
        })
        .catch(() => {});
    }

    const summary = await syncStateToSupabase(state);
    const objects = await listSupabaseObjects();

    return NextResponse.json({
      ok: true,
      summary,
      objects,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
