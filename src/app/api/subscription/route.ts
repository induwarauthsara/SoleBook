import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const { data: profile } = await supabase
      .from('business_profiles')
      .select('onboarding_complete')
      .eq('org_id', ctx.org.id)
      .single();

    return Response.json({
      plan: 'starter',
      status: profile?.onboarding_complete ? 'active' : 'trial',
      org_id: ctx.org.id,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
