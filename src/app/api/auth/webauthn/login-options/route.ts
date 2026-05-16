import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticationOptions, StoredCredential } from '@/lib/auth/webauthn';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
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

    const credentials: StoredCredential[] = creds.map((c: any) => ({
      credentialID: c.credential_id,
      publicKey: c.public_key,
      counter: c.sign_count,
      transports: c.transports,
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
