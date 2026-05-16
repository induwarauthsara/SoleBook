import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const userId = authData.user.id;

    const { data: totpData } = await supabase
      .from('totp_secrets')
      .select('id, verified_at')
      .eq('user_id', userId)
      .single();

    if (totpData?.verified_at) {
      return Response.json({
        requires_2fa: true,
        session_token: authData.session.access_token,
        user: { id: userId, email },
      });
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('org_id, role, organizations(id, name)')
      .eq('user_id', userId)
      .limit(1)
      .single();

    await supabase.from('user_sessions').insert({
      user_id: userId,
      device_info: req.headers.get('user-agent') || 'Unknown',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '0.0.0.0',
      user_agent: req.headers.get('user-agent'),
    });

    return Response.json({
      requires_2fa: false,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      },
      user: {
        id: userId,
        email: authData.user.email,
        full_name: authData.user.user_metadata?.full_name,
      },
      organization: membership
        ? { id: membership.org_id, name: (membership.organizations as any)?.name, role: membership.role }
        : null,
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
