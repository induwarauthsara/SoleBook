import type { SupabaseClient } from "@supabase/supabase-js";

export type OrgMembershipRow = {
  org_id: string;
  role: string;
  organizations: { id: string; name: string } | null;
};

/**
 * PostgREST may surface nested FK selects as an object or a single-element array
 * depending on generated types; normalize for callers.
 */
function normalizeOrgEmbed(
  raw: { id: string; name: string } | { id: string; name: string }[] | null,
): { id: string; name: string } | null {
  if (raw == null) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

/**
 * First organization membership for the user (stable ordering by org_id).
 * Uses a plain limit(1) query so we never hit PostgREST .single() errors on 0 rows.
 */
export async function fetchPrimaryOrgMembership(
  supabase: SupabaseClient,
  userId: string,
): Promise<OrgMembershipRow | null> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("org_id, role, organizations(id, name)")
    .eq("user_id", userId)
    .order("org_id", { ascending: true })
    .limit(1);

  if (error) {
    console.error("organization_members lookup:", error.message);
    return null;
  }
  const row = data?.[0] as
    | {
        org_id: string;
        role: string;
        organizations: { id: string; name: string } | { id: string; name: string }[] | null;
      }
    | undefined;
  if (!row) return null;
  return {
    org_id: row.org_id,
    role: row.role,
    organizations: normalizeOrgEmbed(row.organizations),
  };
}
