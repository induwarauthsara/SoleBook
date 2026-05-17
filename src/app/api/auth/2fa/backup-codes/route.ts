import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { generateBackupCodes, hashBackupCode } from '@/lib/auth/totp';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: totpData } = await supabase
      .from('totp_secrets')
      .select('verified_at')
      .eq('user_id', ctx.user.id)
      .single();

    if (!totpData?.verified_at) {
      return Response.json({ error: '2FA is not enabled' }, { status: 400 });
    }

    const codes = generateBackupCodes();
    const hashedCodes = codes.map(hashBackupCode);

    await supabase
      .from('totp_secrets')
      .update({ backup_codes: hashedCodes })
      .eq('user_id', ctx.user.id);

    return Response.json({ backup_codes: codes, message: 'Store these codes securely. Each can only be used once.' });
  } catch (error) {
    return handleAuthError(error);
  }
}
