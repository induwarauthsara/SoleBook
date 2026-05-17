import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const { amount_lkr, notes } = await req.json();
    if (!amount_lkr || amount_lkr <= 0) {
      return Response.json({ error: 'Valid amount required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    // Get salary target
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('target_owner_salary_lkr')
      .eq('org_id', ctx.org.id)
      .single();

    // Get total withdrawn this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: withdrawals } = await supabase
      .from('owner_withdrawals')
      .select('amount_lkr')
      .eq('org_id', ctx.org.id)
      .gte('withdrawn_at', startOfMonth.toISOString());

    const totalWithdrawn = (withdrawals || []).reduce((s, w) => s + Number(w.amount_lkr), 0);
    const salaryGoal = Number(profile?.target_owner_salary_lkr || 0);
    const isWithinPlan = (totalWithdrawn + amount_lkr) <= salaryGoal;

    // Record withdrawal
    const { data, error } = await supabase.from('owner_withdrawals').insert({
      org_id: ctx.org.id,
      amount_lkr,
      withdrawn_at: new Date().toISOString(),
      is_within_salary_plan: isWithinPlan,
      recorded_by: ctx.user.id,
      notes: notes || null,
    }).select().single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Update owner_salary bucket
    const { data: bucket } = await supabase
      .from('buckets')
      .select('id, current_balance_lkr')
      .eq('org_id', ctx.org.id)
      .eq('type', 'owner_salary')
      .single();

    if (bucket) {
      await supabase.from('buckets').update({
        current_balance_lkr: Math.max(0, Number(bucket.current_balance_lkr) - amount_lkr),
      }).eq('id', bucket.id);
    }

    return Response.json({
      withdrawal: data,
      is_within_plan: isWithinPlan,
      remaining_allowance: Math.max(0, salaryGoal - totalWithdrawn - amount_lkr),
      warning: !isWithinPlan ? 'This withdrawal exceeds your monthly salary plan.' : undefined,
    }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const { data, error } = await supabase
      .from('owner_withdrawals')
      .select('*')
      .eq('org_id', ctx.org.id)
      .order('withdrawn_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ withdrawals: data });
  } catch (error) {
    return handleAuthError(error);
  }
}
