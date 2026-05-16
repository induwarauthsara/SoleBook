import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const { data } = await supabase
      .from('erp_sync_log')
      .select('*')
      .eq('org_id', ctx.org.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    return Response.json({ last_sync: data });
  } catch (error) {
    return handleAuthError(error);
  }
}
