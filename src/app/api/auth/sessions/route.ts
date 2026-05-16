import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', ctx.user.id)
      .is('revoked_at', null)
      .order('last_active', { ascending: false });

    return Response.json({ sessions: sessions || [] });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const { session_id } = await req.json();

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (session_id === 'all') {
      await supabase
        .from('user_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', ctx.user.id)
        .is('revoked_at', null);
    } else {
      await supabase
        .from('user_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', session_id)
        .eq('user_id', ctx.user.id);
    }

    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
