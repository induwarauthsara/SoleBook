import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { verifyRegistration } from '@/lib/auth/webauthn';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const { response, device_name } = await req.json();

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.admin.getUserById(ctx.user.id);
    const expectedChallenge = user?.user_metadata?.webauthn_challenge;

    if (!expectedChallenge) {
      return Response.json({ error: 'No pending registration challenge' }, { status: 400 });
    }

    const verification = await verifyRegistration(response, expectedChallenge);

    if (!verification.verified || !verification.registrationInfo) {
      return Response.json({ error: 'Verification failed' }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;

    await supabase.from('webauthn_credentials').insert({
      user_id: ctx.user.id,
      credential_id: credential.id,
      public_key: Buffer.from(credential.publicKey).toString('base64url'),
      sign_count: credential.counter,
      device_name: device_name || 'Unknown Device',
      transports: response.response.transports || [],
    });

    await supabase.auth.admin.updateUserById(ctx.user.id, {
      user_metadata: { ...user?.user_metadata, webauthn_challenge: null },
    });

    return Response.json({ success: true, message: 'Biometric credential registered' });
  } catch (error) {
    return handleAuthError(error);
  }
}
