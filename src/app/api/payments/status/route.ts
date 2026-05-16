import { NextResponse } from "next/server";
import { getAccountBalance } from "@/lib/seylan/client";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountNumber = searchParams.get("account");
  const category = (searchParams.get("category") ?? "EXT") as "INT" | "EXT";
  const transactionRef = searchParams.get("ref");

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

    // For transaction reference checks, return the ref back for now.
    // Full status polling would use JustPay/QR status endpoints depending on the method.
    return NextResponse.json({
      ok: true,
      ref: transactionRef,
      status: "pending",
      message: "Transaction status lookup by reference.",
    });
  } catch (err) {
    console.error("[payments/status] Error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Status check failed." },
      { status: 500 },
    );
  }
}
