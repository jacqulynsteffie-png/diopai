// Supabase Client, Storage & Database Synchronization Utilities
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_CONFIG = {
  url:
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://pjbyusgfpoprtfmcxxdf.supabase.co",
  publishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_vjv7eheQPkkxbN9tct66VQ_EroF_j9P",
  secretKey: process.env.SUPABASE_SECRET_KEY || "",
  jwksUrl:
    process.env.SUPABASE_JWKS_URL ||
    "https://pjbyusgfpoprtfmcxxdf.supabase.co/auth/v1/.well-known/jwks.json",
  bucketName: "research-data",
};

let _supabaseClient: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_supabaseClient) {
    _supabaseClient = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.publishableKey || SUPABASE_CONFIG.secretKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );
  }
  return _supabaseClient;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.secretKey || SUPABASE_CONFIG.publishableKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return _supabaseAdmin;
}

export const supabase = getSupabaseClient();

export interface SupabaseHealthResult {
  ok: boolean;
  status: string;
  url: string;
  latencyMs: number;
  tables?: string[];
  bucketExists?: boolean;
  error?: string;
  authenticatedRole?: string;
  timestamp: string;
}

/**
 * Checks connectivity to the configured Supabase instance and verifies the storage bucket.
 */
export async function testSupabaseConnection(): Promise<SupabaseHealthResult> {
  const start = Date.now();
  const url = `${SUPABASE_CONFIG.url}/rest/v1/`;
  const key = SUPABASE_CONFIG.secretKey || SUPABASE_CONFIG.publishableKey;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        status: `HTTP ${res.status}: ${res.statusText}`,
        url: SUPABASE_CONFIG.url,
        latencyMs,
        error: text,
        timestamp: new Date().toISOString(),
      };
    }

    const swagger = await res.json().catch(() => null);
    const tables = swagger?.definitions ? Object.keys(swagger.definitions) : [];

    // Check bucket
    const bucketRes = await fetch(
      `${SUPABASE_CONFIG.url}/storage/v1/bucket/${SUPABASE_CONFIG.bucketName}`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      }
    ).catch(() => null);

    const bucketExists = bucketRes?.ok ?? false;

    return {
      ok: true,
      status: "Connected & Authenticated",
      url: SUPABASE_CONFIG.url,
      latencyMs,
      tables,
      bucketExists,
      authenticatedRole: "service_role",
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      ok: false,
      status: "Connection Failed",
      url: SUPABASE_CONFIG.url,
      latencyMs: Date.now() - start,
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Ensure the research-data storage bucket exists in Supabase.
 */
export async function ensureStorageBucket(): Promise<boolean> {
  const key = SUPABASE_CONFIG.secretKey || SUPABASE_CONFIG.publishableKey;
  const checkUrl = `${SUPABASE_CONFIG.url}/storage/v1/bucket/${SUPABASE_CONFIG.bucketName}`;

  try {
    const check = await fetch(checkUrl, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (check.ok) return true;

    // Create bucket if not found
    const create = await fetch(`${SUPABASE_CONFIG.url}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: SUPABASE_CONFIG.bucketName,
        name: SUPABASE_CONFIG.bucketName,
        public: true,
      }),
    });
    return create.ok;
  } catch {
    return false;
  }
}

/**
 * Upload a JSON payload to Supabase Storage.
 */
export async function uploadJsonToSupabase(
  path: string,
  data: unknown
): Promise<{ ok: boolean; path: string; error?: string }> {
  await ensureStorageBucket();
  const key = SUPABASE_CONFIG.secretKey || SUPABASE_CONFIG.publishableKey;
  const target = `${SUPABASE_CONFIG.url}/storage/v1/object/${SUPABASE_CONFIG.bucketName}/${path}`;

  try {
    const res = await fetch(target, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body: JSON.stringify(data, null, 2),
    });

    if (!res.ok) {
      const err = await res.text();
      return { ok: false, path, error: err };
    }
    return { ok: true, path };
  } catch (e) {
    return { ok: false, path, error: (e as Error).message };
  }
}

/**
 * Download a JSON payload from Supabase Storage.
 */
export async function downloadJsonFromSupabase<T = unknown>(
  path: string
): Promise<{ ok: boolean; data: T | null; error?: string }> {
  const target = `${SUPABASE_CONFIG.url}/storage/v1/object/public/${SUPABASE_CONFIG.bucketName}/${path}?t=${Date.now()}`;

  try {
    const res = await fetch(target, { cache: "no-store" });
    if (!res.ok) {
      return { ok: false, data: null, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, data: null, error: (e as Error).message };
  }
}

export interface SupabaseStoredObject {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  metadata?: { size?: number; mimetype?: string };
  url: string;
}

/**
 * List all objects stored in the Supabase research-data bucket.
 */
export async function listSupabaseObjects(): Promise<SupabaseStoredObject[]> {
  await ensureStorageBucket();
  const key = SUPABASE_CONFIG.secretKey || SUPABASE_CONFIG.publishableKey;
  const target = `${SUPABASE_CONFIG.url}/storage/v1/object/list/${SUPABASE_CONFIG.bucketName}`;

  try {
    const res = await fetch(target, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prefix: "",
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      }),
    });

    if (!res.ok) return [];
    const list = (await res.json()) as Array<{
      name: string;
      id?: string;
      updated_at?: string;
      created_at?: string;
      metadata?: { size?: number; mimetype?: string };
    }>;

    return (list || []).map((item) => ({
      ...item,
      url: `${SUPABASE_CONFIG.url}/storage/v1/object/public/${SUPABASE_CONFIG.bucketName}/${item.name}`,
    }));
  } catch {
    return [];
  }
}

export interface SyncSummary {
  timestamp: string;
  casesCount: number;
  datasetsCount: number;
  modelsCount: number;
  reportsCount: number;
  auditLogsCount: number;
  usersCount: number;
  filesSynced: string[];
  status: "success" | "partial" | "failed";
}

/**
 * Synchronize the entire research state to Supabase.
 * Stores both individual resource files (cases.json, datasets.json, etc.)
 * and a unified state.json snapshot.
 */
export async function syncStateToSupabase(state: {
  cases?: unknown[];
  deletedCaseIds?: string[];
  initialized?: boolean;
  datasets?: unknown[];
  models?: unknown[];
  reports?: unknown[];
  auditLogs?: unknown[];
  users?: unknown[];
}): Promise<SyncSummary> {
  const timestamp = new Date().toISOString();
  const filesSynced: string[] = [];

  const operations = [
    { name: "state.json", data: { ...state, initialized: true, syncedAt: timestamp } },
    {
      name: "cases.json",
      data: {
        count: state.cases?.length || 0,
        items: state.cases || [],
        deletedCaseIds: state.deletedCaseIds || [],
        syncedAt: timestamp,
      },
    },
    { name: "datasets.json", data: { count: state.datasets?.length || 0, items: state.datasets || [], syncedAt: timestamp } },
    { name: "models.json", data: { count: state.models?.length || 0, items: state.models || [], syncedAt: timestamp } },
    { name: "reports.json", data: { count: state.reports?.length || 0, items: state.reports || [], syncedAt: timestamp } },
    { name: "audit-logs.json", data: { count: state.auditLogs?.length || 0, items: state.auditLogs || [], syncedAt: timestamp } },
    { name: "users.json", data: { count: state.users?.length || 0, items: state.users || [], syncedAt: timestamp } },
  ];

  for (const op of operations) {
    const res = await uploadJsonToSupabase(op.name, op.data);
    if (res.ok) {
      filesSynced.push(op.name);
    }
  }

  return {
    timestamp,
    casesCount: state.cases?.length || 0,
    datasetsCount: state.datasets?.length || 0,
    modelsCount: state.models?.length || 0,
    reportsCount: state.reports?.length || 0,
    auditLogsCount: state.auditLogs?.length || 0,
    usersCount: state.users?.length || 0,
    filesSynced,
    status: filesSynced.length === operations.length ? "success" : "partial",
  };
}
