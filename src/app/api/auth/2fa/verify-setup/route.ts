import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { verifyTOTPCode, decryptSecret } from '@/lib/auth/totp';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const { code } = await req.json();

    if (!code || code.length !== 6) {
      return Response.json({ error: 'A 6-digit code is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: totpData } = await supabase
      .from('totp_secrets')
      .select('encrypted_secret, verified_at')
      .eq('user_id', ctx.user.id)
      .single();

    if (!totpData) {
      return Response.json({ error: 'No 2FA setup found. Call /api/auth/2fa/setup first' }, { status: 400 });
    }

    if (totpData.verified_at) {
      return Response.json({ error: '2FA is already verified' }, { status: 400 });
    }

    const secret = decryptSecret(totpData.encrypted_secret);
    const valid = verifyTOTPCode(secret, code);

    if (!valid) {
      return Response.json({ error: 'Invalid code. Try again.' }, { status: 400 });
    }

    await supabase
      .from('totp_secrets')
      .update({ verified_at: new Date().toISOString() })
      .eq('user_id', ctx.user.id);

    return Response.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
