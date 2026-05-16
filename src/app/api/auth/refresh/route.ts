import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { refresh_token } = await req.json();
    if (!refresh_token) {
      return Response.json({ error: 'Refresh token required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error || !data.session) {
      return Response.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    return Response.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
