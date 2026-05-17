import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';
import { seylanClient } from '@/lib/seylan/client';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });
    const { id } = await params;

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const { data: account } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('org_id', ctx.org.id)
      .single();

    if (!account) return Response.json({ error: 'Account not found' }, { status: 404 });

    const balanceResult = await seylanClient.getAccountBalance(
      'INT',
      process.env.SEYLAN_SOURCE_ACCOUNT || ''
    );

    const accountData = balanceResult?.Account_Balance_Inquiry?.Account;
    const newBalance = accountData?.AvailableBalance
      ? parseFloat(accountData.AvailableBalance as string)
      : account.current_balance;

    await supabase.from('accounts').update({ current_balance: newBalance }).eq('id', id);

    return Response.json({ account_id: id, balance: newBalance, synced_at: new Date().toISOString() });
  } catch (error) {
    return handleAuthError(error);
  }
}
