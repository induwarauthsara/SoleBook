import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: transactions } = await supabase
      .from('transactions')
      .select('direction, amount_lkr, category, occurred_at')
      .eq('org_id', ctx.org.id)
      .gte('occurred_at', since);

    const txns = transactions || [];
    const totalInflow = txns.filter(t => t.direction === 'inflow').reduce((s, t) => s + Number(t.amount_lkr), 0);
    const totalOutflow = txns.filter(t => t.direction === 'outflow').reduce((s, t) => s + Number(t.amount_lkr), 0);

    const byCategory: Record<string, number> = {};
    for (const t of txns.filter(t => t.direction === 'outflow')) {
      byCategory[t.category || 'other'] = (byCategory[t.category || 'other'] || 0) + Number(t.amount_lkr);
    }

    const byWeek: Record<string, { inflow: number; outflow: number }> = {};
    for (const t of txns) {
      const week = getWeekStart(t.occurred_at);
      if (!byWeek[week]) byWeek[week] = { inflow: 0, outflow: 0 };
      byWeek[week][t.direction as 'inflow' | 'outflow'] += Number(t.amount_lkr);
    }

    return Response.json({
      period_days: days,
      total_inflow: totalInflow,
      total_outflow: totalOutflow,
      net_flow: totalInflow - totalOutflow,
      by_category: byCategory,
      by_week: Object.entries(byWeek).map(([week, data]) => ({ week, ...data })),
      transaction_count: txns.length,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  return date.toISOString().split('T')[0];
}
