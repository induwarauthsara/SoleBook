import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';
import { seylanClient } from '@/lib/seylan/client';
import { wantsMockPaymentGateway } from '@/lib/dev/mock-payment-gateway';
import type { CEFTSTransactionResponse, FundsTransferResponse } from '@/lib/seylan/types';

export const runtime = 'nodejs';

function seylanApproved(code: string | undefined | null): boolean {
  return code === '0000' || code === '0';
}

function internalTransferMessage(result: FundsTransferResponse): string {
  const s = result.FundsTransfer_Response?.Status;
  return s?.Message || s?.Description || 'Transfer was not approved by the bank.';
}

function ceftsMessage(result: CEFTSTransactionResponse): string {
  const s = result.CEFTSTransactionResponse?.Status;
  return s?.Message || s?.Description || 'CEFTS transfer was not approved by the bank.';
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });
    const { id } = await params;

    let destination_account: string | undefined;
    let destination_bank_code: string | undefined;
    try {
      const body = await req.json();
      destination_account = body?.destination_account;
      destination_bank_code = body?.destination_bank_code;
    } catch {
      /* empty body */
    }

    const useMock = wantsMockPaymentGateway(req);

    const apiKey = process.env.SEYLAN_API_KEY?.trim();
    if (!useMock && !apiKey) {
      return Response.json(
        { error: 'Bank payment is not configured. Set SEYLAN_API_KEY (Seylan sandbox x-api-key).' },
        { status: 503 },
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json(
        {
          error:
            'Database is not configured for this server route. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.',
        },
        { status: 503 },
      );
    }

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

    const sourceAccount =
      process.env.SEYLAN_SOURCE_ACCOUNT?.trim() || '064000012548001';
    const defaultInternalDest =
      process.env.SEYLAN_INTERNAL_DEST_ACCOUNT?.trim() || '001213437904100';
    const useCefts = Boolean(destination_bank_code?.trim());
    const destAccount = useCefts
      ? (destination_account || '').trim()
      : (destination_account || defaultInternalDest).trim();

    if (useCefts && !destAccount) {
      return Response.json(
        {
          error:
            'For CEFTS (interbank) payment, provide destination_account and destination_bank_code in the request body.',
        },
        { status: 400 },
      );
    }
    if (!destAccount) {
      return Response.json({ error: 'No destination account configured.' }, { status: 400 });
    }

    const amountStr = Number(obligation.amount_lkr).toFixed(2);
    const narration = `Obligation: ${obligation.category} - ${obligation.counterparty_alias || ''}`;

    let paymentResult: FundsTransferResponse | CEFTSTransactionResponse;

    try {
      if (useMock) {
        const ref = `MOCK-OBL-${id.slice(0, 8)}-${Date.now()}`;
        paymentResult = {
          FundsTransfer_Response: {
            Status: {
              Code: '0000',
              Transaction_Reference: ref,
              Message: 'Mock payment gateway',
              Description: 'Simulated success',
              Timestamp: new Date().toISOString(),
            },
          },
        } as FundsTransferResponse;
      } else if (!useCefts) {
        paymentResult = await seylanClient.transferFunds({
          Account_category: 'INT',
          Source_account_number: sourceAccount,
          Destination_account_number: destAccount,
          Transaction_amount: amountStr,
          User_reference: `OBL-${id.slice(0, 8)}-${Date.now()}`,
          Source_account_narration_1: narration.slice(0, 120),
        });
      } else {
        paymentResult = await seylanClient.ceftsTransfer({
          Processing_code: '420000',
          Transaction_code: 'CEFT',
          Transaction_amount: amountStr,
          Account_category: 'INT',
          Source_account_number: sourceAccount,
          Source_customer_name: 'SoleBook',
          Destination_account_number: destAccount,
          Destination_bank_code: destination_bank_code!.trim(),
          Destination_customer_name: obligation.counterparty_alias || 'Payee',
          Currency_code: 'LKR',
          Reference: `OBL-${id.slice(0, 8)}`,
          Customer_account_narration_1: narration.slice(0, 120),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Seylan sandbox request failed';
      console.error('[obligations/pay] Seylan API error:', err);
      return Response.json(
        {
          error:
            'Bank sandbox did not complete the request. Check SEYLAN_API_KEY, SEYLAN_SANDBOX_URL, and network access to the hackathon host.',
          detail: message,
        },
        { status: 502 },
      );
    }

    if (!useCefts || useMock) {
      const ft = (paymentResult as FundsTransferResponse).FundsTransfer_Response;
      if (!ft?.Status) {
        return Response.json(
          { error: 'Unexpected response from bank (internal transfer).', payment: paymentResult },
          { status: 502 },
        );
      }
      const code = ft.Status.Code;
      if (!seylanApproved(code)) {
        return Response.json(
          {
            error: internalTransferMessage(paymentResult as FundsTransferResponse),
            code,
            payment: paymentResult,
          },
          { status: 400 },
        );
      }
    } else {
      const ce = (paymentResult as CEFTSTransactionResponse).CEFTSTransactionResponse;
      if (!ce?.Status) {
        return Response.json(
          { error: 'Unexpected response from bank (CEFTS).', payment: paymentResult },
          { status: 502 },
        );
      }
      const code = ce.Status.Code;
      if (!seylanApproved(code)) {
        return Response.json(
          {
            error: ceftsMessage(paymentResult as CEFTSTransactionResponse),
            code,
            payment: paymentResult,
          },
          { status: 400 },
        );
      }
    }

    // Record transaction
    const { data: txn, error: txnErr } = await supabase
      .from('transactions')
      .insert({
        org_id: ctx.org.id,
        direction: 'outflow',
        amount_lkr: obligation.amount_lkr,
        occurred_at: new Date().toISOString(),
        description_clean: `Payment: ${obligation.category} - ${obligation.counterparty_alias || ''}`,
        counterparty_alias: obligation.counterparty_alias,
        category: String(obligation.category ?? ''),
        source: 'bank',
        status: 'posted',
      })
      .select('id')
      .single();

    if (txnErr) {
      console.error('[obligations/pay] transactions insert:', txnErr);
      return Response.json(
        {
          error: 'Payment reached the bank but saving the transaction failed.',
          detail: txnErr.message,
        },
        { status: 500 },
      );
    }

    const { error: obErr } = await supabase
      .from('obligations')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_transaction_id: txn?.id ?? null,
      })
      .eq('id', id);

    if (obErr) {
      console.error('[obligations/pay] obligation update:', obErr);
      return Response.json(
        {
          error: 'Bank transfer recorded but updating the obligation failed.',
          detail: obErr.message,
          transaction_id: txn?.id,
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      payment: paymentResult,
      transaction_id: txn?.id,
      ...(useMock ? { mock: true as const } : {}),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
