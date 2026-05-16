import { NextRequest } from 'next/server';
import { mpgsClient } from '@/lib/mpgs/client';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ['owner', 'finance']);
    const { orderId, transactionId, amount } = await req.json();

    if (!orderId || !transactionId || !amount) {
      return Response.json({ error: 'orderId, transactionId, and amount are required' }, { status: 400 });
    }

    const result = await mpgsClient.refundTransaction(orderId, transactionId, amount);
    return Response.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
