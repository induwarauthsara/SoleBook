import { NextRequest } from "next/server";
import { DEMO_ACCOUNT_EMAIL } from "@/lib/demo-account";
import { handleAuthError, requireAuth } from "@/lib/auth/middleware";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Permanent account deletion. Removes the authenticated user’s auth identity.
 * When they are the only member of an organization, deletes the organization
 * row so tenant data cascades away.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const normalizedEmail = ctx.user.email.trim().toLowerCase();

    if (normalizedEmail === DEMO_ACCOUNT_EMAIL.toLowerCase()) {
      return Response.json(
        { error: "The shared demo account cannot be deleted from settings." },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const typed = typeof body.confirmation_email === "string" ? body.confirmation_email.trim().toLowerCase() : "";

    if (!typed || typed !== normalizedEmail) {
      return Response.json(
        { error: "Type your exact email address to confirm account deletion." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (ctx.org) {
      const { count, error: countErr } = await supabase
        .from("organization_members")
        .select("*", { count: "exact", head: true })
        .eq("org_id", ctx.org.id);

      if (countErr) {
        console.error(countErr);
        return Response.json({ error: countErr.message }, { status: 500 });
      }

      if ((count ?? 0) <= 1) {
        const { error: delOrgErr } = await supabase
          .from("organizations")
          .delete()
          .eq("id", ctx.org.id);

        if (delOrgErr) {
          console.error(delOrgErr);
          return Response.json({ error: delOrgErr.message }, { status: 500 });
        }
      }
    }

    const { error: delAuthErr } = await supabase.auth.admin.deleteUser(ctx.user.id);

    if (delAuthErr) {
      console.error(delAuthErr);
      return Response.json({ error: delAuthErr.message || "Could not delete account" }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
