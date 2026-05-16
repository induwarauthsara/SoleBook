import { NextRequest } from 'next/server';
import { justPayVerify } from '@/lib/seylan/client';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const { referenceId, otp } = await req.json();

    if (!referenceId || !otp) {
      return Response.json({ error: 'referenceId and otp required' }, { status: 400 });
    }

    const result = await justPayVerify(referenceId, otp);
    return Response.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
