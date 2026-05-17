import { NextRequest } from 'next/server';
import { justPayRefund } from '@/lib/seylan/client';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ['owner', 'finance']);
    const { justpayCode, deviceId, userId, retrievalReference } = await req.json();

    if (!justpayCode || !retrievalReference) {
      return Response.json({ error: 'justpayCode and retrievalReference required' }, { status: 400 });
    }

    const result = await justPayRefund({
      Justpay_code: justpayCode,
      Device_id: deviceId || 'WEB',
      User_id: userId || '',
      Retrieval_reference: retrievalReference,
    });

    return Response.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
