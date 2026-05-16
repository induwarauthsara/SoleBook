import { createHmac } from "crypto";

/**
 * HMAC-SHA512 checksum per Seylan API Manual Annexure 1.
 * 1. Build pipe-delimited data string
 * 2. HMAC-SHA512 with shared secret key -> hex
 * 3. Base64-encode the hex string
 */
function hmacSha512Base64(secretKey: string, dataString: string): string {
  const hmac = createHmac("sha512", secretKey);
  hmac.update(dataString, "utf8");
  const hexHash = hmac.digest("hex").toUpperCase();
  return Buffer.from(hexHash).toString("base64");
}

function pipe(...values: (string | undefined | null)[]): string {
  return values.map((v) => v ?? "").join("|");
}

export function generateQRChecksum(
  secretKey: string,
  params: {
    Request_ref_no: string;
    Mid: string;
    Tid: string;
    Merchant_login_id: string;
    Type: string;
    Transaction_amount: string;
    Bill_no?: string;
    Mobile_no?: string;
  },
): string {
  const data = pipe(
    params.Request_ref_no,
    params.Mid,
    params.Tid,
    params.Merchant_login_id,
    params.Type,
    params.Transaction_amount,
    params.Bill_no,
    params.Mobile_no,
  );
  return hmacSha512Base64(secretKey, data);
}

export function transactionViewChecksum(
  secretKey: string,
  params: {
    Merchant_login_id: string;
    From_date?: string;
    To_date?: string;
    Mid: string;
    Tid: string;
    Rrn?: string;
  },
): string {
  const data = pipe(
    params.Merchant_login_id,
    params.From_date,
    params.To_date,
    params.Mid,
    params.Tid,
    params.Rrn,
  );
  return hmacSha512Base64(secretKey, data);
}

export function merchantRefundChecksum(
  secretKey: string,
  params: {
    Merchant_login_id: string;
    Retrieval_refernce_no: string;
    Interchange: string;
  },
): string {
  const data = pipe(
    params.Merchant_login_id,
    params.Retrieval_refernce_no,
    params.Interchange,
  );
  return hmacSha512Base64(secretKey, data);
}

export function lankaQRChecksum(
  secretKey: string,
  params: {
    Channel_user_id: string;
    Retrieval_reference: string;
    Function: string;
    Payment_mode?: string;
    Transaction_amount: string;
    Merchant_name: string;
  },
): string {
  // Per doc: Channel_user_id|Retrieval_reference|Function||Payment_mode|Transaction_amount|Merchant_name
  const data = pipe(
    params.Channel_user_id,
    params.Retrieval_reference,
    params.Function,
    "",
    params.Payment_mode,
    params.Transaction_amount,
    params.Merchant_name,
  );
  return hmacSha512Base64(secretKey, data);
}

export function vmqrChecksum(
  secretKey: string,
  params: {
    Channel_user_id: string;
    Retrieval_reference: string;
    Function: string;
    Payment_mode?: string;
    Transaction_amount: string;
    Merchant_name: string;
  },
): string {
  const data = pipe(
    params.Channel_user_id,
    params.Retrieval_reference,
    params.Function,
    "",
    params.Payment_mode,
    params.Transaction_amount,
    params.Merchant_name,
  );
  return hmacSha512Base64(secretKey, data);
}
