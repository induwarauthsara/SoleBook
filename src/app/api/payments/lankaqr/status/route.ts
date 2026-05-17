import { NextRequest } from 'next/server';
import { inquireLankaQR } from '@/lib/seylan/client';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const url = new URL(req.url);
    const retrievalReference = url.searchParams.get('ref');
    const justpayCode = url.searchParams.get('justpayCode');

    if (!retrievalReference || !justpayCode) {
      return Response.json({ error: 'Transaction reference (ref) and justpayCode required' }, { status: 400 });
    }

    const result = await inquireLankaQR(retrievalReference, justpayCode);
    return Response.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
