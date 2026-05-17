import { NextRequest } from 'next/server';
import { fetchPrimaryOrgMembership } from '@/lib/auth/org-membership';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyTOTPCode, decryptSecret, hashBackupCode } from '@/lib/auth/totp';

export async function POST(req: NextRequest) {
  try {
    const { session_token, code, refresh_token } = await req.json();

    if (!session_token || !code) {
      return Response.json({ error: 'Session token and code are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(session_token);
    if (userError || !user) {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { data: totpData } = await supabase
      .from('totp_secrets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!totpData || !totpData.verified_at) {
      return Response.json({ error: '2FA not configured' }, { status: 400 });
    }

    // Check rate limiting
    if (totpData.locked_until && new Date(totpData.locked_until) > new Date()) {
      const remainingMs = new Date(totpData.locked_until).getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return Response.json(
        { error: `Account locked. Try again in ${remainingMin} minutes.` },
        { status: 429 }
      );
    }

    const secret = decryptSecret(totpData.encrypted_secret);
    let valid = verifyTOTPCode(secret, code);

    // Check backup codes if TOTP fails
    if (!valid && code.length === 8) {
      const hashed = hashBackupCode(code);
      const codeIndex = totpData.backup_codes.indexOf(hashed);
      if (codeIndex !== -1) {
        valid = true;
        const updatedCodes = [...totpData.backup_codes];
        updatedCodes.splice(codeIndex, 1);
        await supabase
          .from('totp_secrets')
          .update({ backup_codes: updatedCodes })
          .eq('user_id', user.id);
      }
    }

    if (!valid) {
      const attempts = (totpData.failed_attempts || 0) + 1;
      const updates: any = { failed_attempts: attempts };
      if (attempts >= 5) {
        updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        updates.failed_attempts = 0;
      }
      await supabase.from('totp_secrets').update(updates).eq('user_id', user.id);
      return Response.json({ error: 'Invalid code' }, { status: 401 });
    }

    // Reset failed attempts on success
    await supabase.from('totp_secrets').update({ failed_attempts: 0, locked_until: null }).eq('user_id', user.id);

    const membership = await fetchPrimaryOrgMembership(supabase, user.id);

    await supabase.from('user_sessions').insert({
      user_id: user.id,
      device_info: req.headers.get('user-agent') || 'Unknown',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '0.0.0.0',
      user_agent: req.headers.get('user-agent'),
    });

    if (!refresh_token) {
      return Response.json({ error: 'Refresh token required' }, { status: 400 });
    }

    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token,
    });
    if (refreshError || !refreshed.session) {
      return Response.json({ error: 'Session renewal failed' }, { status: 401 });
    }

    const sessionPayload = {
      access_token: refreshed.session.access_token,
      refresh_token: refreshed.session.refresh_token,
      expires_at: refreshed.session.expires_at,
    };

    return Response.json({
      success: true,
      session: sessionPayload,
      user: { id: user.id, email: user.email, full_name: user.user_metadata?.full_name },
      organization: membership
        ? { id: membership.org_id, name: membership.organizations?.name, role: membership.role }
        : null,
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
