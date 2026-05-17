import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    await supabase.auth.admin.signOut(ctx.user.id);

    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
