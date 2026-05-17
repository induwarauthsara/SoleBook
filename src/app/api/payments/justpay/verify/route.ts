import { NextRequest } from 'next/server';
import { justPayVerify } from '@/lib/seylan/client';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { wantsMockPaymentGateway } from '@/lib/dev/mock-payment-gateway';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const { referenceId, otp } = await req.json();

    if (!referenceId || !otp) {
      return Response.json({ error: 'referenceId and otp required' }, { status: 400 });
    }

    if (wantsMockPaymentGateway(req)) {
      return Response.json({
        JustPayAccountValidation_Response: {
          Account_token: 'mock-justpay-token',
          Account_mask: '****MOCK',
          Status: { Code: '0000', Message: 'Mock verify' },
        },
        mock: true,
      });
    }

    const result = await justPayVerify(referenceId, otp);
    return Response.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
