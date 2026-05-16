import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const { data, error } = await supabase
      .from('owner_withdrawals')
      .select('*')
      .eq('org_id', ctx.org.id)
      .eq('is_within_salary_plan', false)
      .order('withdrawn_at', { ascending: false })
      .limit(50);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    const totalLeakage = (data || []).reduce((s, w) => s + Number(w.amount_lkr), 0);

    return Response.json({ leakage_withdrawals: data, total_leakage: totalLeakage });
  } catch (error) {
    return handleAuthError(error);
  }
}
