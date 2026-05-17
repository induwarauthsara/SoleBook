import { NextRequest } from "next/server";
import { DEMO_ACCOUNT_EMAIL } from "@/lib/demo-account";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Re-seeds the shared demo organisation back to deterministic demo rows.
 * Call with the demo user’s Bearer session before they leave for real registration.
 */
export async function POST(req: NextRequest) {
  try {
    const raw = req.headers.get("authorization");
    const token = raw?.startsWith("Bearer ") ? raw.slice(7).trim() : null;
    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ ok: true, skipped: "no-admin" }, { status: 200 });
    }

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(token);
    if (authErr || !user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.email.trim().toLowerCase() !== DEMO_ACCOUNT_EMAIL.toLowerCase()) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: membership, error: memErr } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (memErr || !membership?.org_id) {
      return Response.json({ ok: true, skipped: "no-org" });
    }

    const { error: rpcErr } = await supabase.rpc("reset_demo_sandbox", {
      p_org: membership.org_id,
    });

    if (rpcErr) {
      console.error("reset_demo_sandbox:", rpcErr);
      return Response.json(
        { error: rpcErr.message || "Could not reset demo sandbox" },
        { status: 503 },
      );
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
