import { NextRequest } from 'next/server';
import { mpgsClient } from '@/lib/mpgs/client';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const { amount, description, plan_id } = await req.json();

    if (!amount || amount <= 0) {
      return Response.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const orderId = `sb-${ctx.org?.id?.slice(0, 8) || 'anon'}-${Date.now()}`;
    const origin = process.env.WEBAUTHN_RP_ORIGIN || 'http://localhost:3000';

    const result = await mpgsClient.createCheckoutSession({
      amount,
      currency: 'LKR',
      description: description || 'SoleBook Subscription',
      orderId,
      returnUrl: `${origin}/subscription/payment-result?orderId=${orderId}`,
    });

    const supabase = getSupabaseAdmin();
    if (supabase && ctx.org) {
      await supabase.from('idempotency_keys').insert({
        key: orderId,
        org_id: ctx.org.id,
        scope: 'mpgs_payment',
        response_hash: JSON.stringify({ plan_id, amount }),
      });
    }

    return Response.json({
      sessionId: result.sessionId,
      redirectUrl: result.redirectUrl,
      orderId: result.orderId,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Auth')) {
      return handleAuthError(error);
    }
    console.error('MPGS create session error:', error);
    return Response.json({ error: 'Failed to create payment session' }, { status: 500 });
  }
}
