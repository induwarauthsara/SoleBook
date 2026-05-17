import { NextRequest } from 'next/server';
import { mpgsClient } from '@/lib/mpgs/client';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return Response.json({ error: 'Order ID required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const verification = await mpgsClient.verifyTransaction(orderId);

    const { data: keyData } = await supabase
      .from('idempotency_keys')
      .select('org_id, response_hash')
      .eq('key', orderId)
      .eq('scope', 'mpgs_payment')
      .single();

    if (verification.success && keyData) {
      const paymentMeta = JSON.parse(keyData.response_hash || '{}');

      await supabase.from('transactions').insert({
        org_id: keyData.org_id,
        direction: 'outflow',
        amount_lkr: verification.amount,
        occurred_at: new Date().toISOString(),
        description_clean: `MPGS Card Payment - ${paymentMeta.plan_id || 'subscription'}`,
        counterparty_alias: 'SoleBook Subscription',
        category: 'subscription',
        source: 'bank',
        status: 'posted',
      });
    }

    return Response.json({
      success: verification.success,
      status: verification.status,
      orderId: verification.orderId,
    });
  } catch (error) {
    console.error('MPGS callback error:', error);
    return Response.json({ error: 'Callback processing failed' }, { status: 500 });
  }
}
