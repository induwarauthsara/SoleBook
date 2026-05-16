import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { generateTOTPSecret, encryptSecret, generateBackupCodes, hashBackupCode } from '@/lib/auth/totp';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: existing } = await supabase
      .from('totp_secrets')
      .select('id, verified_at')
      .eq('user_id', ctx.user.id)
      .single();

    if (existing?.verified_at) {
      return Response.json({ error: '2FA is already enabled' }, { status: 400 });
    }

    const { secret, uri } = generateTOTPSecret(ctx.user.email);
    const backupCodes = generateBackupCodes();
    const hashedCodes = backupCodes.map(hashBackupCode);

    if (existing) {
      await supabase
        .from('totp_secrets')
        .update({
          encrypted_secret: encryptSecret(secret),
          backup_codes: hashedCodes,
          verified_at: null,
        })
        .eq('user_id', ctx.user.id);
    } else {
      await supabase.from('totp_secrets').insert({
        user_id: ctx.user.id,
        encrypted_secret: encryptSecret(secret),
        backup_codes: hashedCodes,
      });
    }

    return Response.json({
      uri,
      backup_codes: backupCodes,
      message: 'Scan the QR code with Google Authenticator, then verify with a code',
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
