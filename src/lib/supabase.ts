/**
 * Supabase clients for SoleBook.
 *
 * Two flavors:
 *   - `getSupabaseAnon()`  — public anon key. Subject to RLS. Use from
 *                            client components, route handlers that act
 *                            on behalf of the signed-in user, etc.
 *   - `getSupabaseAdmin()` — service-role key. **Bypasses RLS.** Server
 *                            only. Reserved for ingestion workers, the
 *                            deterministic finance engine, and admin
 *                            jobs. Never import from a "use client"
 *                            module.
 *
 * Both return `null` when env vars aren't configured so the app stays
 * runnable locally without Supabase credentials.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedAnon: SupabaseClient | null | undefined;
let cachedAdmin: SupabaseClient | null | undefined;

function readEnv(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export function getSupabaseAnon(): SupabaseClient | null {
  if (cachedAnon !== undefined) return cachedAnon;

  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey =
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
    readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!url || !anonKey) {
    cachedAnon = null;
    return null;
  }

  cachedAnon = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cachedAnon;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cachedAdmin !== undefined) return cachedAdmin;

  if (typeof window !== "undefined") {
    // Hard guard: refuse to instantiate the service-role client in any
    // browser context, even if env was accidentally exposed.
    cachedAdmin = null;
    return null;
  }

  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    cachedAdmin = null;
    return null;
  }

  cachedAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-solebook-client": "admin" } },
  });
  return cachedAdmin;
}
