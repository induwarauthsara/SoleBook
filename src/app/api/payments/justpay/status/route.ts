import { NextRequest } from 'next/server';
import { justPayGetStatus } from '@/lib/seylan/client';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const url = new URL(req.url);
    const justpayCode = url.searchParams.get('justpayCode');
    const retrievalReference = url.searchParams.get('retrievalReference');

    if (!justpayCode || !retrievalReference) {
      return Response.json({ error: 'justpayCode and retrievalReference required' }, { status: 400 });
    }

    const result = await justPayGetStatus(justpayCode, retrievalReference);
    return Response.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
