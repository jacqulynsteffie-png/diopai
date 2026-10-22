// Supabase Client and Connectivity Utilities
// Supports both browser-side queries and secure server-side administrative tasks.
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_CONFIG = {
  url:
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://pjbyusgfpoprtfmcxxdf.supabase.co",
  publishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    "",
  secretKey: process.env.SUPABASE_SECRET_KEY || "",
  jwksUrl:
    process.env.SUPABASE_JWKS_URL ||
    "https://pjbyusgfpoprtfmcxxdf.supabase.co/auth/v1/.well-known/jwks.json",
};

// Global singleton instances to avoid reconnects during fast refresh
let _supabaseClient: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Browser-safe Supabase client using publishable/anon key
 */
export function getSupabaseClient(): SupabaseClient {
  if (!_supabaseClient) {
    _supabaseClient = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.publishableKey,
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

/**
 * Server-only Supabase client using secret/service-role key
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.secretKey,
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

// Default export is the standard client
export const supabase = getSupabaseClient();

export interface SupabaseHealthResult {
  ok: boolean;
  status: string;
  url: string;
  latencyMs: number;
  tables?: string[];
  error?: string;
  authenticatedRole?: string;
  timestamp: string;
}

/**
 * Checks connectivity to the configured Supabase instance.
 * Tests REST endpoint authentication with the Secret key and measures response latency.
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

    return {
      ok: true,
      status: "Connected & Authenticated",
      url: SUPABASE_CONFIG.url,
      latencyMs,
      tables,
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
 * Perform a query via Supabase PostgREST API
 */
export async function supabaseRestQuery<T = unknown>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    useAdmin?: boolean;
    headers?: Record<string, string>;
  } = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const { method = "GET", body, useAdmin = true, headers = {} } = options;
  const key = useAdmin ? SUPABASE_CONFIG.secretKey : SUPABASE_CONFIG.publishableKey;
  const target = `${SUPABASE_CONFIG.url}/rest/v1/${endpoint.replace(/^\//, "")}`;

  try {
    const res = await fetch(target, {
      method,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      return { data: null, error: errText, status: res.status };
    }

    const data = await res.json().catch(() => null);
    return { data, error: null, status: res.status };
  } catch (err) {
    return { data: null, error: (err as Error).message, status: 500 };
  }
}
