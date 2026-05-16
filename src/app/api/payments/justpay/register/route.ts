import { NextRequest } from 'next/server';
import { justPayRegister } from '@/lib/seylan/client';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const { accountNumber, bankCode, accountName, nic, mobile, justpayCode, deviceId, userId, email, platform } = await req.json();

    if (!accountNumber || !bankCode || !accountName || !nic || !mobile) {
      return Response.json({ error: 'All fields required: accountNumber, bankCode, accountName, nic, mobile' }, { status: 400 });
    }

    const result = await justPayRegister({
      Justpay_code: justpayCode || '',
      Device_id: deviceId || 'WEB',
      User_id: userId || '',
      NIC_number: nic,
      User_name: accountName,
      Platform: platform || 'WEB',
      Mobile_number: mobile,
      Email_address: email || '',
      Destination_bank_code: bankCode,
      Account_number: accountNumber,
      Account_title: accountName,
      Currency: 'LKR',
    });

    return Response.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
