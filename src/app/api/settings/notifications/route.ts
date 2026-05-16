import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const { notification_prefs } = await req.json();

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    await supabase
      .from('user_settings')
      .upsert({ user_id: ctx.user.id, notification_prefs }, { onConflict: 'user_id' });

    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
