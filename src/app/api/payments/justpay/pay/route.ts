import { NextRequest } from 'next/server';
import { justPayInitiateTransaction } from '@/lib/seylan/client';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const {
      justpayCode, deviceId, userId, nic,
      originatingAccount, originatingAccountName,
      destinationBankCode, destinationAccount, destinationAccountName,
      amount, currency, narration,
    } = await req.json();

    if (!justpayCode || !amount || !originatingAccount || !destinationAccount) {
      return Response.json({ error: 'justpayCode, amount, originatingAccount, and destinationAccount are required' }, { status: 400 });
    }

    const result = await justPayInitiateTransaction({
      Justpay_code: justpayCode,
      Device_id: deviceId || 'WEB',
      User_id: userId || '',
      NIC_number: nic || '',
      Originating_account_number: originatingAccount,
      Originating_account_name: originatingAccountName || '',
      Destination_bank_code: destinationBankCode || '7278',
      Destination_account_number: destinationAccount,
      Destination_account_name: destinationAccountName || '',
      Transaction_amount: String(amount),
      Transaction_narration: narration || 'SoleBook Payment',
      Currency: currency || 'LKR',
    });

    return Response.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
