import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const { language } = await req.json();

    if (!['en', 'si', 'ta'].includes(language)) {
      return Response.json({ error: 'Language must be en, si, or ta' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    await supabase
      .from('user_settings')
      .upsert({ user_id: ctx.user.id, language }, { onConflict: 'user_id' });

    return Response.json({ success: true, language });
  } catch (error) {
    return handleAuthError(error);
  }
}
