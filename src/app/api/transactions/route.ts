import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, requireRole, handleAuthError } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const direction = url.searchParams.get('direction');
    const category = url.searchParams.get('category');
    const source = url.searchParams.get('source');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const accountId = url.searchParams.get('account_id');

    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('org_id', ctx.org.id)
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (direction) query = query.eq('direction', direction);
    if (category) query = query.eq('category', category);
    if (source) query = query.eq('source', source);
    if (from) query = query.gte('occurred_at', from);
    if (to) query = query.lte('occurred_at', to);
    if (accountId) query = query.eq('account_id', accountId);

    const { data, error, count } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ transactions: data, total: count, limit, offset });
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

    const { data, error } = await supabase.from('transactions').insert({
      org_id: ctx.org.id,
      direction: body.direction,
      amount_lkr: body.amount_lkr,
      occurred_at: body.occurred_at || new Date().toISOString(),
      description_clean: body.description,
      counterparty_alias: body.counterparty_alias,
      category: body.category || 'other',
      source: 'manual',
      account_id: body.account_id || null,
    }).select().single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ transaction: data }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
