import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

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

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.WEBAUTHN_RP_ORIGIN || 'http://localhost:3000'}/auth/reset-password`,
    });

    // Always return success to prevent email enumeration
    return Response.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
