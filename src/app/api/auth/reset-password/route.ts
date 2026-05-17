import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { access_token, new_password } = await req.json();
    if (!access_token || !new_password) {
      return Response.json({ error: 'Token and new password required' }, { status: 400 });
    }

    if (new_password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
    if (userError || !user) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, { password: new_password });
    if (error) {
      return Response.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
