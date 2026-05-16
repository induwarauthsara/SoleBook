import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const { data: profile } = await supabase
      .from('business_profiles')
      .select('target_owner_salary_lkr')
      .eq('org_id', ctx.org.id)
      .single();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: withdrawals } = await supabase
      .from('owner_withdrawals')
      .select('amount_lkr, is_within_salary_plan, withdrawn_at')
      .eq('org_id', ctx.org.id)
      .gte('withdrawn_at', startOfMonth.toISOString());

    const totalWithdrawn = (withdrawals || []).reduce((s, w) => s + Number(w.amount_lkr), 0);
    const salaryGoal = Number(profile?.target_owner_salary_lkr || 0);
    const leakageCount = (withdrawals || []).filter(w => !w.is_within_salary_plan).length;

    return Response.json({
      salary_goal: salaryGoal,
      total_withdrawn: totalWithdrawn,
      remaining_allowance: Math.max(0, salaryGoal - totalWithdrawn),
      percentage_used: salaryGoal > 0 ? Math.round((totalWithdrawn / salaryGoal) * 100) : 0,
      leakage_count: leakageCount,
      withdrawals_this_month: withdrawals?.length || 0,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
