import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/types';
import { getAuthenticationOptions, StoredCredential } from '@/lib/auth/webauthn';

type WebAuthnCredentialRow = {
  credential_id: string;
  public_key: string;
  sign_count: number;
  transports: string[] | null;
};

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const emailKey = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!emailKey) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find((u) => u.email?.toLowerCase() === emailKey);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: creds } = await supabase
      .from('webauthn_credentials')
      .select('credential_id, public_key, sign_count, transports')
      .eq('user_id', user.id);

    if (!creds || creds.length === 0) {
      return Response.json({ error: 'No biometric credentials registered' }, { status: 400 });
    }

    const credentials: StoredCredential[] = (creds as WebAuthnCredentialRow[]).map((c) => ({
      credentialID: c.credential_id,
      publicKey: c.public_key,
      counter: c.sign_count,
      transports:
        c.transports === null ? undefined : (c.transports as AuthenticatorTransportFuture[]),
    }));

    const options = await getAuthenticationOptions(credentials);

    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, webauthn_challenge: options.challenge },
    });

    return Response.json({ ...options, user_id: user.id });
  } catch (error) {
    console.error('WebAuthn login options error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
