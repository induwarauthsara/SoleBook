import { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase';

/** Values accepted by `public.business_profiles.business_type` — onboarding-only labels map to `other`. */
const DB_BUSINESS_TYPES = new Set([
  'retail',
  'restaurant',
  'services',
  'manufacturing',
  'wholesale',
  'agriculture',
  'other',
]);

function normalizeBusinessType(raw: unknown): string {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return DB_BUSINESS_TYPES.has(v) ? v : 'other';
}

function normalizeEmail(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

/** Maps GoTrue errors that indicate an existing identity/email to HTTP 409. */
function registerAuthErrorResponse(message: string): { status: number; error: string } {
  const m = message.toLowerCase();
  if (
    m.includes('already been registered') ||
    m.includes('already registered') ||
    m.includes('user already exists') ||
    m.includes('email address is already') ||
    m.includes('duplicate') ||
    m.includes('unique constraint')
  ) {
    return {
      status: 409,
      error: 'An account with this email already exists. Try signing in instead.',
    };
  }
  return responseForSupabaseMessage(message);
}

async function emailAlreadyRegistered(supabase: SupabaseClient, emailLower: string): Promise<boolean> {
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const batch = data?.users ?? [];
    if (batch.some((u) => u.email?.toLowerCase() === emailLower)) return true;
    if (batch.length < perPage) return false;
    page += 1;
  }
}

/** Supabase-js surfaces network failures as opaque "fetch failed"; map to 503 + clearer copy. */
function responseForSupabaseMessage(message: string): { status: number; error: string } {
  const m = message.toLowerCase();
  if (
    m.includes('fetch failed') ||
    m.includes('network error') ||
    m.includes('econnrefused') ||
    m.includes('enotfound')
  ) {
    return {
      status: 503,
      error:
        'Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, that the project (or local Supabase) is running, and firewall/VPN settings.',
    };
  }
  return { status: 400, error: message };
}

async function rollbackRegistration(supabase: SupabaseClient, userId: string, orgId: string | null) {
  if (orgId) {
    await supabase.from('organizations').delete().eq('id', orgId);
  }
  await supabase.auth.admin.deleteUser(userId);
}

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  let orgId: string | null = null;

  try {
    const { email, password, full_name, business_name, business_type } = await req.json();

    const emailNormalized = normalizeEmail(email);
    if (!emailNormalized || !password || !full_name || !business_name) {
      return Response.json(
        { error: 'Missing required fields: email, password, full_name, business_name' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const normalizedType = normalizeBusinessType(business_type);

    try {
      if (await emailAlreadyRegistered(supabase, emailNormalized)) {
        return Response.json(
          { error: 'An account with this email already exists. Try signing in instead.' },
          { status: 409 },
        );
      }
    } catch (listErr) {
      const msg = listErr instanceof Error ? listErr.message : String(listErr);
      const { status, error } = responseForSupabaseMessage(msg);
      return Response.json({ error }, { status });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: emailNormalized,
      password,
      email_confirm: true,
      user_metadata: { full_name, business_name, business_type: normalizedType },
    });

    if (authError) {
      const { status, error } = registerAuthErrorResponse(authError.message);
      return Response.json({ error }, { status });
    }

    userId = authData.user.id;

    const slug =
      business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

    const { data: org, error: insertOrgError } = await supabase
      .from('organizations')
      .insert({ name: business_name, slug })
      .select('id')
      .single();

    if (insertOrgError || !org) {
      await rollbackRegistration(supabase, userId, null);
      const { status, error } = responseForSupabaseMessage(insertOrgError?.message || 'Could not create organization');
      return Response.json({ error }, { status });
    }

    orgId = org.id;

    const { error: memberErr } = await supabase.from('organization_members').insert({
      org_id: orgId,
      user_id: userId,
      role: 'owner',
    });
    if (memberErr) {
      console.error('register organization_members:', memberErr);
      await rollbackRegistration(supabase, userId, orgId);
      const { status, error } = responseForSupabaseMessage(memberErr.message);
      return Response.json({ error: `Could not link account to organization: ${error}` }, { status });
    }

    const { error: profileErr } = await supabase.from('business_profiles').insert({
      org_id: orgId,
      business_type: normalizedType,
    });
    if (profileErr) {
      console.error('register business_profiles:', profileErr);
      await rollbackRegistration(supabase, userId, orgId);
      const { status, error } = responseForSupabaseMessage(profileErr.message);
      return Response.json({ error: `Could not create business profile: ${error}` }, { status });
    }

    const buckets = [
      { org_id: orgId, type: 'operations', name: 'Operations', target_pct: 45, display_order: 1 },
      { org_id: orgId, type: 'obligations', name: 'Obligations', target_pct: 25, display_order: 2 },
      { org_id: orgId, type: 'profit_reserve', name: 'Profit Reserve', target_pct: 10, display_order: 3 },
      { org_id: orgId, type: 'owner_salary', name: 'Owner Salary', target_pct: 15, display_order: 4 },
      { org_id: orgId, type: 'growth', name: 'Growth', target_pct: 5, display_order: 5 },
    ];
    const { error: bucketsErr } = await supabase.from('buckets').insert(buckets);
    if (bucketsErr) {
      console.error('register buckets:', bucketsErr);
      await rollbackRegistration(supabase, userId, orgId);
      const { status, error } = responseForSupabaseMessage(bucketsErr.message);
      return Response.json({ error: `Could not create default buckets: ${error}` }, { status });
    }

    const { error: settingsErr } = await supabase.from('user_settings').insert({ user_id: userId });
    if (settingsErr) {
      console.error('register user_settings:', settingsErr);
      await rollbackRegistration(supabase, userId, orgId);
      const { status, error } = responseForSupabaseMessage(settingsErr.message);
      return Response.json({ error: `Could not initialize settings: ${error}` }, { status });
    }

    return Response.json(
      {
        success: true,
        user: { id: userId, email: emailNormalized },
        organization: { id: orgId, name: business_name },
        message: 'Account created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Registration error:', error);
    const supabase = getSupabaseAdmin();
    if (supabase && userId) {
      try {
        await rollbackRegistration(supabase, userId, orgId);
      } catch (rollbackErr) {
        console.error('Registration rollback failed:', rollbackErr);
      }
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
