import { NextResponse } from "next/server";
import { transferFunds } from "@/lib/seylan/client";

export const runtime = "nodejs";

interface InitiatePayload {
  planId: string;
  billingCycle: "monthly" | "annual";
  amount: number;
  method: "bank_transfer" | "justpay" | "qr";
}

export async function POST(req: Request) {
  let body: InitiatePayload;
  try {
    body = (await req.json()) as InitiatePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { planId, amount, method } = body;
  if (!planId || !amount || !method) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields: planId, amount, method." },
      { status: 422 },
    );
  }

  try {
    if (method === "bank_transfer") {
      const sourceAccount = process.env.SEYLAN_SOURCE_ACCOUNT ?? "064000012548001";
      const destAccount = process.env.SEYLAN_INTERNAL_DEST_ACCOUNT ?? "001213437904100";

      const result = await transferFunds({
        Account_category: "EXT",
        Source_account_number: sourceAccount,
        Destination_account_number: destAccount,
        Transaction_amount: amount.toFixed(2),
        Debit_transaction_code: "020",
        Credit_transaction_code: "520",
        User_reference: `SB-${planId}-${Date.now()}`,
        Source_account_narration_1: "SoleBook Subscription",
        Destination_account_narration_1: "SoleBook Subscription",
      });

      const status = result.FundsTransfer_Response.Status;
      if (status.Code === "0000") {
        return NextResponse.json({
          ok: true,
          transactionReference: status.Transaction_Reference,
          timestamp: status.Timestamp,
          status: "success",
        });
      }

      return NextResponse.json({
        ok: false,
        error: status.Message || status.Description || "Transaction failed",
        code: status.Code,
      }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: `Method "${method}" not yet implemented.` }, { status: 400 });
  } catch (err) {
    console.error("[payments/initiate] Error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Payment initiation failed." },
      { status: 500 },
    );
  }
}
