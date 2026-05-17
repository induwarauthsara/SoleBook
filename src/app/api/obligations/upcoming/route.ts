import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { rankObligations } from '@/lib/engine/priority';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('obligations')
      .select('*')
      .eq('org_id', ctx.org.id)
      .in('status', ['upcoming', 'due_soon', 'overdue'])
      .lte('due_date', thirtyDaysLater)
      .order('due_date', { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });

    const ranked = rankObligations((data || []).map(o => ({
      id: o.id,
      category: o.category,
      amount: o.amount_lkr,
      dueDate: o.due_date,
      counterpartyAlias: o.counterparty_alias || '',
      status: o.status,
    })));

    const enriched = (data || []).map(o => {
      const rank = ranked.find(r => r.id === o.id);
      return { ...o, computed_priority: rank?.priority, urgency_score: rank?.urgencyScore, priority_reason: rank?.reason };
    }).sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0));

    return Response.json({ obligations: enriched });
  } catch (error) {
    return handleAuthError(error);
  }
}
