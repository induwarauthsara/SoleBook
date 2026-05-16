import { NextRequest } from 'next/server';
import { mpgsClient } from '@/lib/mpgs/client';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return Response.json({ error: 'Order ID required' }, { status: 400 });
    }

    const result = await mpgsClient.verifyTransaction(orderId);
    return Response.json(result);
  } catch (error) {
    console.error('MPGS verify error:', error);
    return Response.json({ error: 'Verification failed' }, { status: 500 });
  }
}
