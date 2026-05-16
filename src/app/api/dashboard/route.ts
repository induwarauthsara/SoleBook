import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { computeRunway } from '@/lib/engine/runway';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const orgId = ctx.org.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Parallel data fetches
    const [
      { data: transactions },
      { data: buckets },
      { data: obligations },
      { data: discipline },
      { data: insights },
      { data: notifications },
      { data: profile },
      { data: withdrawals },
      { data: accounts },
    ] = await Promise.all([
      supabase.from('transactions').select('*').eq('org_id', orgId).gte('occurred_at', thirtyDaysAgo).order('occurred_at', { ascending: false }),
      supabase.from('buckets').select('*').eq('org_id', orgId).order('display_order'),
      supabase.from('obligations').select('*').eq('org_id', orgId).in('status', ['upcoming', 'due_soon', 'overdue']).order('due_date'),
      supabase.from('discipline_scores').select('*').eq('org_id', orgId).order('snapshot_date', { ascending: false }).limit(30),
      supabase.from('insights').select('*').eq('org_id', orgId).is('acknowledged_at', null).order('generated_at', { ascending: false }).limit(5),
      supabase.from('notifications').select('*').eq('org_id', orgId).is('read_at', null).order('created_at', { ascending: false }).limit(5),
      supabase.from('business_profiles').select('*').eq('org_id', orgId).single(),
      supabase.from('owner_withdrawals').select('amount_lkr').eq('org_id', orgId).gte('withdrawn_at', startOfMonth),
      supabase.from('accounts').select('*').eq('org_id', orgId),
    ]);

    // Compute metrics
    const txns = transactions || [];
    const monthlyRevenue = txns.filter(t => t.direction === 'inflow').reduce((s, t) => s + Number(t.amount_lkr), 0);
    const monthlyExpenses = txns.filter(t => t.direction === 'outflow').reduce((s, t) => s + Number(t.amount_lkr), 0);
    const currentBalance = (accounts || []).reduce((s, a) => s + Number(a.current_balance), 0);
    const avgDailyOutflow = monthlyExpenses / 30;
    const avgDailyInflow = monthlyRevenue / 30;

    // Cash runway
    const runway = computeRunway({
      currentBalance,
      avgDailyOutflow,
      avgDailyInflow,
      obligationsDueNext30Days: (obligations || []).map(o => ({ amount: Number(o.amount_lkr), dueDate: o.due_date })),
      projectedInflow30Days: monthlyRevenue,
    });

    const ownerTotalWithdrawn = (withdrawals || []).reduce((s, w) => s + Number(w.amount_lkr), 0);

    return Response.json({
      metrics: {
        monthly_revenue: monthlyRevenue,
        monthly_expenses: monthlyExpenses,
        current_balance: currentBalance,
        cash_runway_days: runway.daysUntilZero,
        risk_level: runway.riskBand,
        pending_obligations: (obligations || []).length,
        pending_obligations_total: (obligations || []).reduce((s, o) => s + Number(o.amount_lkr), 0),
        owner_salary_goal: Number(profile?.target_owner_salary_lkr || 0),
        owner_total_withdrawn: ownerTotalWithdrawn,
        avg_daily_sales: avgDailyInflow,
      },
      buckets: buckets || [],
      discipline_score: discipline?.[0] || null,
      discipline_trend: (discipline || []).map(d => ({ date: d.snapshot_date, score: d.score })),
      upcoming_payments: (obligations || []).slice(0, 5),
      recent_transactions: txns.slice(0, 10),
      cash_flow_forecast: runway.forecast,
      ai_insights: insights || [],
      notifications: { unread_count: (notifications || []).length, items: notifications || [] },
      accounts: accounts || [],
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
