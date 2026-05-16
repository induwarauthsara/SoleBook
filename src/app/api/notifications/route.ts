import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('org_id', ctx.org.id)
      .or(`user_id.is.null,user_id.eq.${ctx.user.id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ notifications: data });
  } catch (error) {
    return handleAuthError(error);
  }
}
