import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

interface WaitlistPayload {
  email?: string;
  name?: string;
  businessType?: string;
  language?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: WaitlistPayload;
  try {
    body = (await req.json()) as WaitlistPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || "").trim().slice(0, 120);
  const businessType = (body.businessType || "").trim().slice(0, 60);
  const language = (body.language || "en").trim().slice(0, 8);

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 422 }
    );
  }

  const supabase = getSupabaseAdmin();

  // When Supabase is not configured, accept the signup softly so the
  // landing page still feels responsive in demo / local environments.
  if (!supabase) {
    console.warn(
      "[solebook] Supabase not configured — waitlist signup not persisted.",
      { email, name, businessType, language }
    );
    return NextResponse.json({ ok: true, persisted: false });
  }

  const { error } = await supabase.from("waitlist").insert({
    email,
    name: name || null,
    business_type: businessType || null,
    language,
    source: "landing",
  });

  if (error) {
    // Treat unique-violation as success (already on the list).
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, persisted: true, duplicate: true });
    }
    console.error("[solebook] waitlist insert failed", error);
    return NextResponse.json(
      { ok: false, error: "Could not save your signup. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, persisted: true });
}
