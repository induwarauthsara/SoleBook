import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { verifyTOTPCode, decryptSecret } from '@/lib/auth/totp';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const { code, password } = await req.json();

    if (!code || !password) {
      return Response.json({ error: 'Current TOTP code and password are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: ctx.user.email,
      password,
    });
    if (authError) {
      return Response.json({ error: 'Invalid password' }, { status: 401 });
    }

    const { data: totpData } = await supabase
      .from('totp_secrets')
      .select('encrypted_secret')
      .eq('user_id', ctx.user.id)
      .single();

    if (!totpData) {
      return Response.json({ error: '2FA is not enabled' }, { status: 400 });
    }

    const secret = decryptSecret(totpData.encrypted_secret);
    if (!verifyTOTPCode(secret, code)) {
      return Response.json({ error: 'Invalid TOTP code' }, { status: 401 });
    }

    await supabase.from('totp_secrets').delete().eq('user_id', ctx.user.id);

    return Response.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
