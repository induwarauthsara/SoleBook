import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { getRegistrationOptions, StoredCredential } from '@/lib/auth/webauthn';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: creds } = await supabase
      .from('webauthn_credentials')
      .select('credential_id, public_key, sign_count, transports')
      .eq('user_id', ctx.user.id);

    const existingCredentials: StoredCredential[] = (creds || []).map((c: any) => ({
      credentialID: c.credential_id,
      publicKey: c.public_key,
      counter: c.sign_count,
      transports: c.transports,
    }));

    const options = await getRegistrationOptions(ctx.user.id, ctx.user.email, existingCredentials);

    await supabase.auth.admin.updateUserById(ctx.user.id, {
      user_metadata: { webauthn_challenge: options.challenge },
    });

    return Response.json(options);
  } catch (error) {
    return handleAuthError(error);
  }
}
