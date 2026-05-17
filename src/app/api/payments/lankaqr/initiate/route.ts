import { NextRequest } from 'next/server';
import { initiateLankaQR } from '@/lib/seylan/client';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { wantsMockPaymentGateway } from '@/lib/dev/mock-payment-gateway';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();

    if (!body.amount) {
      return Response.json({ error: 'Amount required' }, { status: 400 });
    }

    if (wantsMockPaymentGateway(req)) {
      const ref = `MOCK-LQR-${Date.now()}`;
      return Response.json({
        LankaQR_Initiate_Response: {
          Status: { Code: '0000', Message: 'Mock LankaQR' },
          Retrieval_reference: ref,
        },
        mock: true,
      });
    }

    const now = new Date();
    const result = await initiateLankaQR({
      Justpay_code: body.justpayCode || '',
      Justpay_user_id: body.justpayUserId || '',
      Device_id: body.deviceId || 'WEB',
      Institution_id: body.institutionId || '',
      Party_id: body.partyId || '',
      Function: body.function || 'PAYMENT',
      Channel_user_id: body.channelUserId || '',
      Channel_password: body.channelPassword || '',
      Retrieval_reference: body.retrievalReference || `LQR-${Date.now()}`,
      Transation_sequence: body.transactionSequence || String(Date.now()),
      QR_payload: body.qrPayload || '',
      Customer_bank_code: body.customerBankCode || '7278',
      Customer_account: body.customerAccount || '',
      Customer_name: body.customerName || '',
      Merchant_pan: body.merchantPan || process.env.SEYLAN_SOURCE_ACCOUNT || '',
      Merchant_bank_code: body.merchantBankCode || '7278',
      Merchant_name: body.merchantName || 'SoleBook',
      Transaction_ccy: body.currency || 'LKR',
      Transaction_amount: String(body.amount),
      Merchant_catg_code: body.merchantCategoryCode || '5999',
      Merchant_city: body.merchantCity || 'Colombo',
      Country_code: body.countryCode || 'LK',
      Transaction_date: now.toISOString().slice(0, 10).replace(/-/g, ''),
      Transaction_time: now.toTimeString().slice(0, 8).replace(/:/g, ''),
      Transaction_desc: body.description || 'SoleBook Payment',
      Check_value: body.checkValue || '',
    });

    return Response.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
