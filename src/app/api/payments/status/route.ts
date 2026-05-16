import { NextRequest, NextResponse } from "next/server";
import { getAccountBalance, inquireMerchantQRTransaction } from "@/lib/seylan/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountNumber = searchParams.get("account");
  const category = (searchParams.get("category") ?? "EXT") as "INT" | "EXT";
  const transactionRef = searchParams.get("ref");
  const mid = searchParams.get("mid");
  const tid = searchParams.get("tid");

  if (!accountNumber && !transactionRef) {
    return NextResponse.json(
      { ok: false, error: "Provide 'account' or 'ref' query parameter." },
      { status: 422 },
    );
  }

  try {
    if (accountNumber) {
      const result = await getAccountBalance(category, accountNumber);
      const status = result.Account_Balance_Inquiry.Status;
      if (status.Code === "0000") {
        return NextResponse.json({
          ok: true,
          balance: result.Account_Balance_Inquiry.Account,
          transactionReference: status.Transaction_Reference,
        });
      }
      return NextResponse.json({
        ok: false,
        error: status.Message || status.Description || "Inquiry failed",
        code: status.Code,
      }, { status: 400 });
    }

    if (transactionRef) {
      const result = await inquireMerchantQRTransaction({
        Institution_id: process.env.SEYLAN_INSTITUTION_ID || '',
        Channel_user_id: process.env.SEYLAN_CHANNEL_USER_ID || '',
        Channel_pass: process.env.SEYLAN_CHANNEL_PASS || '',
        Request_ref_no: `INQ-${Date.now()}`,
        Merchant_login_id: process.env.SEYLAN_MERCHANT_LOGIN_ID || '',
        Merchant_login_pass: process.env.SEYLAN_MERCHANT_LOGIN_PASS || '',
        Function: 'INQUIRY',
        Rrn: transactionRef,
        Mid: mid || process.env.SEYLAN_MID || '',
        Tid: tid || process.env.SEYLAN_TID || '',
        Check_sum: '',
      });

      const txResponse = result.TransactionView_Response;
      if (txResponse.Status.Code === '0000') {
        return NextResponse.json({
          ok: true,
          ref: transactionRef,
          status: 'completed',
          transactions: txResponse.TransactionView_Information?.transactionDetails || [],
        });
      }

      return NextResponse.json({
        ok: false,
        ref: transactionRef,
        error: txResponse.Status.Message || txResponse.Status.Description || 'Inquiry failed',
        code: txResponse.Status.Code,
      }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: "No valid query provided" }, { status: 422 });
  } catch (err) {
    console.error("[payments/status] Error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Status check failed." },
      { status: 500 },
    );
  }
}
