import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, requireRole, handleAuthError } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('org_id', ctx.org.id)
      .order('is_primary', { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ accounts: data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const body = await req.json();
    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const { data, error } = await supabase.from('accounts').insert({
      org_id: ctx.org.id,
      name: body.name,
      type: body.type || 'bank',
      bank_name: body.bank_name,
      account_mask: body.account_mask,
      currency: body.currency || 'LKR',
      current_balance: body.current_balance || 0,
      is_primary: body.is_primary || false,
    }).select().single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ account: data }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
