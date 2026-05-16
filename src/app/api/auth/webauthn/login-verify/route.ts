import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAuthentication, StoredCredential } from '@/lib/auth/webauthn';

export async function POST(req: NextRequest) {
  try {
    const { response, user_id } = await req.json();

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.admin.getUserById(user_id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const expectedChallenge = user.user_metadata?.webauthn_challenge;
    if (!expectedChallenge) {
      return Response.json({ error: 'No pending authentication challenge' }, { status: 400 });
    }

    const { data: cred } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', user_id)
      .eq('credential_id', response.id)
      .single();

    if (!cred) {
      return Response.json({ error: 'Credential not found' }, { status: 400 });
    }

    const storedCredential: StoredCredential = {
      credentialID: cred.credential_id,
      publicKey: cred.public_key,
      counter: cred.sign_count,
      transports: cred.transports,
    };

    const verification = await verifyAuthentication(response, expectedChallenge, storedCredential);

    if (!verification.verified) {
      return Response.json({ error: 'Authentication failed' }, { status: 401 });
    }

    await supabase
      .from('webauthn_credentials')
      .update({
        sign_count: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', cred.id);

    await supabase.auth.admin.updateUserById(user_id, {
      user_metadata: { ...user.user_metadata, webauthn_challenge: null },
    });

    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
    });

    await supabase.from('user_sessions').insert({
      user_id,
      device_info: req.headers.get('user-agent') || 'Unknown',
      ip_address: req.headers.get('x-forwarded-for') || '0.0.0.0',
      user_agent: req.headers.get('user-agent'),
    });

    const { data: membership } = await supabase
      .from('organization_members')
      .select('org_id, role, organizations(id, name)')
      .eq('user_id', user_id)
      .limit(1)
      .single();

    return Response.json({
      success: true,
      user: { id: user_id, email: user.email, full_name: user.user_metadata?.full_name },
      organization: membership
        ? { id: membership.org_id, name: (membership.organizations as any)?.name, role: membership.role }
        : null,
    });
  } catch (error) {
    console.error('WebAuthn login verify error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
