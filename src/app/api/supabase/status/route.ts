import { NextResponse } from "next/server";
import { testSupabaseConnection } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await testSupabaseConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
