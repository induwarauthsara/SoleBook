import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';
import { computeAllocation } from '@/lib/engine/allocator';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const { amount, transaction_id } = await req.json();
    if (!amount || amount <= 0) {
      return Response.json({ error: 'Valid amount required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const [{ data: buckets }, { data: obligations }, { data: profile }, { data: withdrawals }] = await Promise.all([
      supabase.from('buckets').select('*').eq('org_id', ctx.org.id),
      supabase.from('obligations').select('amount_lkr').eq('org_id', ctx.org.id).in('status', ['upcoming', 'due_soon']),
      supabase.from('business_profiles').select('*').eq('org_id', ctx.org.id).single(),
      supabase.from('owner_withdrawals').select('amount_lkr').eq('org_id', ctx.org.id).gte('withdrawn_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ]);

    const currentBuckets: any = {};
    const targetPercentages: any = {};
    for (const b of buckets || []) {
      currentBuckets[b.type] = Number(b.current_balance_lkr);
      targetPercentages[b.type] = Number(b.target_pct);
    }

    const reserveBucket = (buckets || []).find(b => b.type === 'profit_reserve');
    const reserveHealth = reserveBucket
      ? (Number(reserveBucket.current_balance_lkr) / Math.max(Number(reserveBucket.target_minimum_lkr), 1)) * 100
      : 50;

    const result = computeAllocation({
      incomingAmount: amount,
      businessType: profile?.business_type || 'other',
      obligationsDueIn30Days: (obligations || []).reduce((s, o) => s + Number(o.amount_lkr), 0),
      reserveHealth,
      currentBuckets,
      targetPercentages,
      ownerSalaryGoal: Number(profile?.target_owner_salary_lkr || 0),
      ownerWithdrawnThisMonth: (withdrawals || []).reduce((s, w) => s + Number(w.amount_lkr), 0),
    });

    const { data: allocation } = await supabase.from('allocations').insert({
      org_id: ctx.org.id,
      trigger: transaction_id ? 'income_detected' : 'manual',
      source_transaction_id: transaction_id || null,
      total_amount_lkr: amount,
      status: 'proposed',
      engine_version: result.engineVersion,
      explanation: result.explanation,
    }).select('id').single();

    if (allocation) {
      const lines = Object.entries(result)
        .filter(([key]) => ['operations', 'obligations', 'profit_reserve', 'owner_salary', 'growth'].includes(key))
        .map(([type, proposed_amount]) => {
          const bucket = (buckets || []).find(b => b.type === type);
          return { allocation_id: allocation.id, bucket_id: bucket?.id, proposed_amount_lkr: proposed_amount };
        })
        .filter(l => l.bucket_id);

      await supabase.from('allocation_lines').insert(lines);
    }

    return Response.json({ allocation_id: allocation?.id, ...result });
  } catch (error) {
    return handleAuthError(error);
  }
}
