import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const [{ data: profile }, { data: userSettings }, { data: buckets }] = await Promise.all([
      supabase.from('business_profiles').select('*').eq('org_id', ctx.org.id).single(),
      supabase.from('user_settings').select('*').eq('user_id', ctx.user.id).single(),
      supabase.from('buckets').select('type, target_pct, name').eq('org_id', ctx.org.id).order('display_order'),
    ]);

    return Response.json({
      profile: profile || {},
      user_settings: userSettings || { language: 'en', theme: 'system', notification_prefs: {} },
      buckets: buckets || [],
      organization: { id: ctx.org.id, name: ctx.org.name },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
