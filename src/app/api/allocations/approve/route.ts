import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const { allocation_id, action } = await req.json();
    if (!allocation_id || !['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'allocation_id and action (approve/reject) required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await supabase.from('allocations').update({
      status: newStatus,
      decided_at: new Date().toISOString(),
      decided_by: ctx.user.id,
    }).eq('id', allocation_id).eq('org_id', ctx.org.id);

    if (action === 'approve') {
      const { data: lines } = await supabase
        .from('allocation_lines')
        .select('bucket_id, proposed_amount_lkr')
        .eq('allocation_id', allocation_id);

      for (const line of lines || []) {
        const { data: bucket } = await supabase
          .from('buckets')
          .select('current_balance_lkr')
          .eq('id', line.bucket_id)
          .single();

        if (bucket) {
          await supabase.from('buckets').update({
            current_balance_lkr: Number(bucket.current_balance_lkr) + Number(line.proposed_amount_lkr),
          }).eq('id', line.bucket_id);
        }
      }

      await supabase.from('allocations').update({ status: 'applied' }).eq('id', allocation_id);
    }

    return Response.json({ success: true, status: action === 'approve' ? 'applied' : 'rejected' });
  } catch (error) {
    return handleAuthError(error);
  }
}
