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
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    let query = supabase
      .from('obligations')
      .select('*')
      .eq('org_id', ctx.org.id)
      .order('due_date', { ascending: true });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (from) query = query.gte('due_date', from);
    if (to) query = query.lte('due_date', to);

    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ obligations: data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const body = await req.json();
    const { category, counterparty_alias, amount_lkr, due_date, priority, notes, recurrence } = body;

    if (!category || !amount_lkr || !due_date) {
      return Response.json({ error: 'category, amount_lkr, and due_date are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const { data, error } = await supabase
      .from('obligations')
      .insert({
        org_id: ctx.org.id,
        category,
        counterparty_alias: counterparty_alias || null,
        amount_lkr,
        due_date,
        priority: priority || 'medium',
        notes: notes || null,
        recurrence: recurrence || null,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ obligation: data }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
