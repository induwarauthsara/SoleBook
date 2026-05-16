import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });
    const { id } = await params;

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', ctx.org.id);

    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
