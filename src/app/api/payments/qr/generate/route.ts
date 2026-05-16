import { NextResponse } from "next/server";
import { generateMerchantQR } from "@/lib/seylan/client";
import { generateQRChecksum } from "@/lib/seylan/checksum";

export const runtime = "nodejs";

interface QRGeneratePayload {
  amount: string;
  billNo?: string;
  mobileNo?: string;
  purposeOfTransaction?: string;
}

let refCounter = 0;

function nextRefNo(): string {
  refCounter += 1;
  const ts = Date.now().toString().slice(-10);
  return `${ts}${String(refCounter).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  let body: QRGeneratePayload;
  try {
    body = (await req.json()) as QRGeneratePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { amount, billNo, mobileNo, purposeOfTransaction } = body;
  if (!amount) {
    return NextResponse.json({ ok: false, error: "amount is required." }, { status: 422 });
  }

  const checksumKey = process.env.SEYLAN_CHECKSUM_KEY ?? "";
  const channelUser = process.env.SEYLAN_MERCHANT_CHANNEL_USER ?? "";
  const channelPass = process.env.SEYLAN_MERCHANT_CHANNEL_PASS ?? "";
  const merchantLoginId = process.env.SEYLAN_MERCHANT_LOGIN_ID ?? "";
  const merchantLoginPass = process.env.SEYLAN_MERCHANT_LOGIN_PASS ?? "";
  const mid = process.env.SEYLAN_MERCHANT_MID ?? "";
  const tid = process.env.SEYLAN_MERCHANT_TID ?? "";
  const institutionId = process.env.SEYLAN_INSTITUTION_ID ?? "1";

  const requestRefNo = nextRefNo();

  const checksum = generateQRChecksum(checksumKey, {
    Request_ref_no: requestRefNo,
    Mid: mid,
    Tid: tid,
    Merchant_login_id: merchantLoginId,
    Type: "1",
    Transaction_amount: amount,
    Bill_no: billNo,
    Mobile_no: mobileNo,
  });

  try {
    const result = await generateMerchantQR({
      Institution_id: institutionId,
      Channel_user_id: channelUser,
      Channel_pass: channelPass,
      Request_ref_no: requestRefNo,
      Merchant_login_id: merchantLoginId,
      Merchant_login_pass: merchantLoginPass,
      Function: "generateQRAPI",
      Device_id: crypto.randomUUID(),
      Type: "1",
      Mid: mid,
      Tid: tid,
      Transaction_amount: amount,
      Transaction_currency: "144",
      Bill_no: billNo ?? "",
      Mobile_no: mobileNo ?? "",
      Store_label: "",
      Loyalty_number: "",
      Reference_label: "",
      Customer_label: "",
      Terminal_label: "",
      Purpose_of_transaction: purposeOfTransaction ?? "SoleBook Subscription",
      Additional_customer_data_request: "",
      Session_id: "",
      Ip_address: "",
      Check_sum: checksum,
    });

    const status = result.GenerateQR_Response.Status;
    if (status.Code === "0000") {
      const qrInfo = result.GenerateQR_Response.QR_Information;
      return NextResponse.json({
        ok: true,
        qrCode: qrInfo?.QR_code ?? null,
        requestRefNo: qrInfo?.Request_ref_no ?? requestRefNo,
        interchangeList: qrInfo?.Interchange_list ?? [],
        bankName: qrInfo?.Bank_name ?? "",
        transactionReference: status.Transaction_Reference,
      });
    }

    return NextResponse.json({
      ok: false,
      error: status.Description || status.Message || "QR generation failed",
      code: status.Code,
    }, { status: 400 });
  } catch (err) {
    console.error("[payments/qr/generate] Error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "QR generation failed." },
      { status: 500 },
    );
  }
}
