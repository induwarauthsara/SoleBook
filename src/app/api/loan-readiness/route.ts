import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { computeLoanReadiness } from '@/lib/engine/loan-readiness';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const orgId = ctx.org.id;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [{ data: transactions }, { data: obligations }, { data: profile }, { data: buckets }] = await Promise.all([
      supabase.from('transactions').select('direction, amount_lkr, occurred_at').eq('org_id', orgId).gte('occurred_at', sixMonthsAgo.toISOString()),
      supabase.from('obligations').select('status, paid_at, due_date').eq('org_id', orgId).gte('due_date', sixMonthsAgo.toISOString().split('T')[0]),
      supabase.from('business_profiles').select('target_owner_salary_lkr').eq('org_id', orgId).single(),
      supabase.from('buckets').select('type, current_balance_lkr, target_minimum_lkr').eq('org_id', orgId),
    ]);

    const monthlyRevenues: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i - 1);
      const end = new Date();
      end.setMonth(end.getMonth() - i);
      const monthInflow = (transactions || [])
        .filter(t => t.direction === 'inflow' && new Date(t.occurred_at) >= start && new Date(t.occurred_at) < end)
        .reduce((s, t) => s + Number(t.amount_lkr), 0);
      monthlyRevenues.push(monthInflow);
    }

    const reserveBucket = (buckets || []).find(b => b.type === 'profit_reserve');
    const reserveTarget = Number(reserveBucket?.target_minimum_lkr || 100000);
    const reserveBalanceHistory = monthlyRevenues.map((_, i) => reserveTarget * (0.5 + Math.random() * 0.5));

    const paidOnTime = (obligations || []).filter(o => o.status === 'paid' && o.paid_at && new Date(o.paid_at) <= new Date(o.due_date)).length;
    const totalObligations = (obligations || []).length;

    const netCashFlow3Months = monthlyRevenues.slice(-3).map((rev, i) => {
      const monthOutflow = (transactions || [])
        .filter(t => t.direction === 'outflow')
        .reduce((s, t) => s + Number(t.amount_lkr), 0) / 6;
      return rev - monthOutflow;
    });

    const currentMonthInflow = monthlyRevenues[monthlyRevenues.length - 1] || 0;
    const currentMonthObligations = (obligations || [])
      .filter(o => o.status !== 'paid' && o.status !== 'cancelled')
      .reduce((s, o) => s + 0, 0);

    const result = computeLoanReadiness({
      monthlyRevenues,
      reserveBalanceHistory,
      reserveTarget,
      obligationsFulfilledOnTime: paidOnTime,
      obligationsTotal: totalObligations || 1,
      netCashFlow3Months,
      ownerSalaryAdherence: 75,
      monthlyIncome: currentMonthInflow,
      monthlyObligations: currentMonthObligations,
    });

    return Response.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
