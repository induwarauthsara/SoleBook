import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { computeRunway } from '@/lib/engine/runway';
import { computeDisciplineScore } from '@/lib/engine/discipline';
import { buildDeterministicInsights } from '@/lib/engine/live-advisor';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const orgId = ctx.org.id;
    const now = new Date();
    const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgoIso = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel data fetches
    const [
      { data: transactions },
      { data: buckets },
      { data: obligations },
      { data: obligationOutcomes },
      { data: discipline },
      { data: insights },
      { data: notifications },
      { data: profile },
      { data: ownerWithdrawals },
      { data: accounts },
    ] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('org_id', orgId)
        .gte('occurred_at', sixtyDaysAgoIso)
        .order('occurred_at', { ascending: false }),
      supabase.from('buckets').select('*').eq('org_id', orgId).order('display_order'),
      supabase
        .from('obligations')
        .select('*')
        .eq('org_id', orgId)
        .in('status', ['upcoming', 'due_soon', 'overdue'])
        .order('due_date'),
      supabase.from('obligations').select('status,due_date').eq('org_id', orgId).in('status', ['paid', 'overdue']),
      supabase.from('discipline_scores').select('*').eq('org_id', orgId).order('snapshot_date', { ascending: false }).limit(30),
      supabase
        .from('insights')
        .select('*')
        .eq('org_id', orgId)
        .is('acknowledged_at', null)
        .order('generated_at', { ascending: false })
        .limit(5),
      supabase
        .from('notifications')
        .select('*')
        .eq('org_id', orgId)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('business_profiles').select('*').eq('org_id', orgId).single(),
      supabase
        .from('owner_withdrawals')
        .select('id, amount_lkr, withdrawn_at, notes, is_within_salary_plan')
        .eq('org_id', orgId)
        .gte('withdrawn_at', sixtyDaysAgoIso)
        .order('withdrawn_at', { ascending: false }),
      supabase.from('accounts').select('*').eq('org_id', orgId),
    ]);

    const txnsAll = transactions || [];
    const txns30 = txnsAll.filter(t => t.occurred_at >= thirtyDaysAgoIso);

    const monthlyRevenue = txns30.filter(t => t.direction === 'inflow').reduce((s, t) => s + Number(t.amount_lkr), 0);
    const monthlyExpenses = txns30.filter(t => t.direction === 'outflow').reduce((s, t) => s + Number(t.amount_lkr), 0);

    const inf30 = txns30.filter(t => t.direction === 'inflow').reduce((s, t) => s + Number(t.amount_lkr), 0);
    const outf30 = txns30.filter(t => t.direction === 'outflow').reduce((s, t) => s + Number(t.amount_lkr), 0);

    const txnsPriorWindow = txnsAll.filter(
      t => t.occurred_at < thirtyDaysAgoIso && t.occurred_at >= sixtyDaysAgoIso,
    );
    const infPrior = txnsPriorWindow.filter(t => t.direction === 'inflow').reduce((s, t) => s + Number(t.amount_lkr), 0);
    const outPrior = txnsPriorWindow.filter(t => t.direction === 'outflow').reduce((s, t) => s + Number(t.amount_lkr), 0);

    const currentBalance = (accounts || []).reduce((s, a) => s + Number(a.current_balance), 0);
    const avgDailyOutflow = monthlyExpenses / 30;
    const avgDailyInflow = monthlyRevenue / 30;

    const runway = computeRunway({
      currentBalance,
      avgDailyOutflow,
      avgDailyInflow,
      obligationsDueNext30Days: (obligations || []).map(o => ({ amount: Number(o.amount_lkr), dueDate: o.due_date })),
      projectedInflow30Days: monthlyRevenue,
    });

    const withdrawals = ownerWithdrawals || [];
    const ownerTotalWithdrawn = withdrawals
      .filter(w => new Date(w.withdrawn_at) >= startOfMonth)
      .reduce((s, w) => s + Number(w.amount_lkr), 0);

    const unplannedWithdrawalsCount = withdrawals.filter(
      w => w.is_within_salary_plan === false && new Date(w.withdrawn_at) >= new Date(thirtyDaysAgoIso),
    ).length;

    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const ninetyDaysAgoUtc = new Date(todayUtc);
    ninetyDaysAgoUtc.setUTCDate(ninetyDaysAgoUtc.getUTCDate() - 90);

    const resolvedInWindow = (obligationOutcomes || []).filter(o => {
      const d = new Date(o.due_date + 'T00:00:00.000Z');
      return d <= todayUtc && d >= ninetyDaysAgoUtc;
    });
    const obligationsTotal = resolvedInWindow.length;
    const obligationsPaidOnTime = resolvedInWindow.filter(o => o.status === 'paid').length;

    const reserveBucket = (buckets || []).find(b => b.type === 'profit_reserve');
    const reserveBalance = reserveBucket ? Number(reserveBucket.current_balance_lkr) : 0;
    const reserveTargetMinimum = reserveBucket ? Number(reserveBucket.target_minimum_lkr) : 0;
    const reserveCurrentPct = reserveTargetMinimum > 0
      ? Math.round((reserveBalance / reserveTargetMinimum) * 100)
      : reserveBalance > 0
        ? 100
        : 50;
    const reserveTargetPct = 100;

    const ownerSalaryGoal = Number(profile?.target_owner_salary_lkr || 0);

    const storedDiscipline = discipline?.[0] ?? null;
    const computedDiscipline = computeDisciplineScore({
      obligationsPaidOnTime,
      obligationsTotal,
      reserveCurrentPct,
      reserveTargetPct,
      ownerSalaryGoal,
      ownerTotalWithdrawn,
      unplannedWithdrawals: unplannedWithdrawalsCount,
      inflowLast30Days: inf30,
      outflowLast30Days: outf30,
      inflowPrior30Days: infPrior,
      outflowPrior30Days: outPrior,
    });
    // Always surface live components (owner withdrawals, leakage) instead of a stale
    // persisted snapshot row — stored rows are still used for discipline_trend.
    const discipline_score = {
      id: storedDiscipline?.id ?? '00000000-0000-0000-0000-000000000001',
      org_id: orgId,
      snapshot_date: todayUtc.toISOString().slice(0, 10),
      score: computedDiscipline.score,
      components: computedDiscipline.components,
      created_at: storedDiscipline?.created_at ?? now.toISOString(),
    };

    let ai_insights = insights || [];
    if (ai_insights.length === 0) {
      ai_insights = buildDeterministicInsights({
        orgId,
        monthlyRevenue,
        monthlyExpenses,
        currentBalance,
        runway,
        pendingObligationsCount: (obligations || []).length,
        pendingObligationsTotal: (obligations || []).reduce((s, o) => s + Number(o.amount_lkr), 0),
        reserveBalance,
        reserveTargetMinimum,
        ownerSalaryGoal,
        ownerTotalWithdrawn,
        unplannedWithdrawalsCount,
      });
    }

    return Response.json({
      organization: { id: ctx.org.id, name: ctx.org.name },
      business_profile: profile ?? null,
      owner_withdrawals: withdrawals.filter(w => new Date(w.withdrawn_at) >= startOfMonth),
      metrics: {
        monthly_revenue: monthlyRevenue,
        monthly_expenses: monthlyExpenses,
        current_balance: currentBalance,
        cash_runway_days: runway.daysUntilZero,
        risk_level: runway.riskBand,
        pending_obligations: (obligations || []).length,
        pending_obligations_total: (obligations || []).reduce((s, o) => s + Number(o.amount_lkr), 0),
        owner_salary_goal: ownerSalaryGoal,
        owner_total_withdrawn: ownerTotalWithdrawn,
        avg_daily_sales: avgDailyInflow,
      },
      buckets: buckets || [],
      discipline_score,
      discipline_trend: (discipline || []).map(d => ({ date: d.snapshot_date, score: d.score })),
      upcoming_payments: (obligations || []).slice(0, 5),
      recent_transactions: txns30.slice(0, 10),
      cash_flow_forecast: runway.forecast,
      ai_insights,
      notifications: { unread_count: (notifications || []).length, items: notifications || [] },
      accounts: accounts || [],
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
