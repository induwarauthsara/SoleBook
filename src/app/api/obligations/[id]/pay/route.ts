import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';
import { seylanClient } from '@/lib/seylan/client';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });
    const { id } = await params;

    const { method, destination_account, destination_bank_code } = await req.json();
    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    // Get obligation
    const { data: obligation, error: fetchError } = await supabase
      .from('obligations')
      .select('*')
      .eq('id', id)
      .eq('org_id', ctx.org.id)
      .single();

    if (fetchError || !obligation) {
      return Response.json({ error: 'Obligation not found' }, { status: 404 });
    }

    if (obligation.status === 'paid') {
      return Response.json({ error: 'Already paid' }, { status: 400 });
    }

    let paymentResult: any;
    const sourceAccount = process.env.SEYLAN_SOURCE_ACCOUNT || '';
    const narration = `Obligation: ${obligation.category} - ${obligation.counterparty_alias || ''}`;

    if (method === 'internal' || !destination_bank_code) {
      paymentResult = await seylanClient.transferFunds({
        Account_category: 'INT',
        Source_account_number: sourceAccount,
        Destination_account_number: destination_account,
        Transaction_amount: String(obligation.amount_lkr),
        Source_account_narration_1: narration,
      });
    } else {
      paymentResult = await seylanClient.ceftsTransfer({
        Processing_code: '420000',
        Transaction_code: 'CEFT',
        Transaction_amount: String(obligation.amount_lkr),
        Account_category: 'INT',
        Source_account_number: sourceAccount,
        Source_customer_name: 'SoleBook',
        Destination_account_number: destination_account,
        Destination_bank_code: destination_bank_code,
        Destination_customer_name: obligation.counterparty_alias || 'Payee',
        Currency_code: 'LKR',
        Reference: `OBL-${id.slice(0, 8)}`,
        Customer_account_narration_1: narration,
      });
    }

    // Record transaction
    const { data: txn } = await supabase.from('transactions').insert({
      org_id: ctx.org.id,
      direction: 'outflow',
      amount_lkr: obligation.amount_lkr,
      occurred_at: new Date().toISOString(),
      description_clean: `Payment: ${obligation.category} - ${obligation.counterparty_alias || ''}`,
      counterparty_alias: obligation.counterparty_alias,
      category: obligation.category,
      source: 'bank',
      status: 'posted',
    }).select('id').single();

    // Update obligation status
    await supabase.from('obligations').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      paid_transaction_id: txn?.id || null,
    }).eq('id', id);

    return Response.json({ success: true, payment: paymentResult, transaction_id: txn?.id });
  } catch (error) {
    return handleAuthError(error);
  }
}
