import type {
  FundsTransferRequest,
  FundsTransferResponse,
  CEFTSTransactionRequest,
  CEFTSTransactionResponse,
  AccountBalanceResponse,
  TransactionHistoryResponse,
  JustPayRegisterRequest,
  JustPayRegisterResponse,
  JustPayVerifyResponse,
  JustPayTransactionRequest,
  JustPayTransactionResponse,
  JustPayTransactionStatusResponse,
  JustPayRefundRequest,
  JustPayRefundResponse,
  LankaQRTransactionRequest,
  LankaQRTransactionResponse,
  LankaQRStatusResponse,
  VMQRTransactionRequest,
  VMQRTransactionResponse,
  VMQRStatusResponse,
  GenerateQRRequest,
  GenerateQRResponse,
  TransactionViewRequest,
  TransactionViewResponse,
  MerchantRefundRequest,
  MerchantRefundResponse,
} from "./types";

const SANDBOX_URL = process.env.SEYLAN_SANDBOX_URL ?? "http://34.21.206.87:3000";
const API_KEY = process.env.SEYLAN_API_KEY ?? "";

async function seylanFetch<T>(
  path: string,
  options: { method: "GET" | "POST"; body?: unknown; query?: Record<string, string> },
): Promise<T> {
  let url = `${SANDBOX_URL}${path}`;
  if (options.query) {
    const qs = new URLSearchParams(options.query).toString();
    url += `?${qs}`;
  }

  const res = await fetch(url, {
    method: options.method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": API_KEY,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Seylan API ${options.method} ${path} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── 1. Internal Transfer ──

export async function transferFunds(
  req: FundsTransferRequest,
): Promise<FundsTransferResponse> {
  return seylanFetch<FundsTransferResponse>(
    "/Posting/Account/InternalTransfer/1.0/TransferFunds",
    { method: "POST", body: { FundsTransfer_Request: req } },
  );
}

// ── 2. CEFTS Transfer ──

export async function initiateCEFTS(
  req: CEFTSTransactionRequest,
): Promise<CEFTSTransactionResponse> {
  return seylanFetch<CEFTSTransactionResponse>(
    "/Posting/Account/Cefts/1.0/InitiateCEFTSTransfer",
    { method: "POST", body: { CEFTSTransactionRequest: req } },
  );
}

// ── 3. Account Inquiry ──

export async function getAccountBalance(
  accountCategory: "INT" | "EXT",
  accountNumber: string,
): Promise<AccountBalanceResponse> {
  return seylanFetch<AccountBalanceResponse>(
    "/Inquiry/Account/AccountInquiry/1.0/GetAccountBalance",
    { method: "GET", query: { AccountCategory: accountCategory, AccountNumber: accountNumber } },
  );
}

export async function getTransactionHistory(
  accountCategory: "INT" | "EXT",
  accountNumber: string,
  params: { StartDate?: string; EndDate?: string; NumberOfTransactions?: string },
): Promise<TransactionHistoryResponse> {
  return seylanFetch<TransactionHistoryResponse>(
    "/Inquiry/Account/AccountInquiry/1.0/GetAccountTransactions",
    {
      method: "GET",
      query: {
        AccountCategory: accountCategory,
        AccountNumber: accountNumber,
        ...params,
      },
    },
  );
}

// ── 4. JustPay ──

export async function justPayRegister(
  req: JustPayRegisterRequest,
): Promise<JustPayRegisterResponse> {
  return seylanFetch<JustPayRegisterResponse>(
    "/JustPay/Acquirer/1.0/JustPayRegisterAccount",
    { method: "POST", body: { JustPayRegisterAccount_Request: req } },
  );
}

export async function justPayVerify(
  requestId: string,
  otp: string,
): Promise<JustPayVerifyResponse> {
  return seylanFetch<JustPayVerifyResponse>(
    "/JustPay/Acquirer/1.0/VerifyJustPayRegistration",
    { method: "GET", query: { RequestId: requestId, RegistrationOTP: otp } },
  );
}

export async function justPayGetCertificate(body: {
  Justpay_code: string;
  User_id: string;
  User_name: string;
  Mobile_no: string;
  Email_address: string;
  Platform: string;
  Retrieval_reference: string;
  Application_type?: string;
  Input_branch?: string;
  Input_user?: string;
  Workstation_id?: string;
  Posting_batch?: string;
}) {
  return seylanFetch(
    "/JustPay/Acquirer/1.0/JustPayGetCertificate",
    { method: "POST", body: { JPCertificateIssue_request: body } },
  );
}

export async function justPaySignMandate(body: {
  Justpay_code: string;
  User_id: string;
  User_name: string;
  Mobile_no: string;
  Email_address: string;
  Platform: string;
  Retrieval_reference: string;
  Message_to_sign: string;
  Application_type?: string;
  Input_branch?: string;
  Input_user?: string;
  Workstation_id?: string;
  Posting_batch?: string;
}) {
  return seylanFetch(
    "/JustPay/Acquirer/1.0/JustPaySignDigitalMandate",
    { method: "POST", body: { JPSignMessage_request: body } },
  );
}

export async function justPayInitiateTransaction(
  req: JustPayTransactionRequest,
): Promise<JustPayTransactionResponse> {
  return seylanFetch<JustPayTransactionResponse>(
    "/JustPay/Acquirer/1.0/InitiateJustPayTransaction",
    { method: "POST", body: { JustPayTransction_Request: req } },
  );
}

export async function justPayGetStatus(
  justpayCode: string,
  retrievalReference: string,
): Promise<JustPayTransactionStatusResponse> {
  return seylanFetch<JustPayTransactionStatusResponse>(
    "/JustPay/Acquirer/1.0/GetJustPayTransactionStatus",
    { method: "GET", query: { JustpayCode: justpayCode, RetrievalReference: retrievalReference } },
  );
}

export async function justPayRefund(
  req: JustPayRefundRequest,
): Promise<JustPayRefundResponse> {
  return seylanFetch<JustPayRefundResponse>(
    "/JustPay/Acquirer/1.0/RefundJustPayTransaction",
    { method: "POST", body: { JustPayRefundTransaction_Request: req } },
  );
}

// ── 5. LankaQR ──

export async function initiateLankaQR(
  req: LankaQRTransactionRequest,
): Promise<LankaQRTransactionResponse> {
  return seylanFetch<LankaQRTransactionResponse>(
    "/QR/LankaQR/1.0/InitiateLankaQRTransaction",
    { method: "POST", body: { LankaQRTransaction_Request: req } },
  );
}

export async function inquireLankaQR(
  retrievalReference: string,
  justpayCode: string,
): Promise<LankaQRStatusResponse> {
  return seylanFetch<LankaQRStatusResponse>(
    "/QR/LankaQR/1.0/InquireLankaQRTransaction",
    { method: "GET", query: { RetrievalReference: retrievalReference, JustpayCode: justpayCode } },
  );
}

// ── 6. Visa/Master QR ──

export async function initiateVMQR(
  req: VMQRTransactionRequest,
): Promise<VMQRTransactionResponse> {
  return seylanFetch<VMQRTransactionResponse>(
    "/QR/VMQR/1.0/InitiateVMQRTransaction",
    { method: "POST", body: { VMQRTransaction_Request: req } },
  );
}

export async function inquireVMQR(
  retrievalReference: string,
): Promise<VMQRStatusResponse> {
  return seylanFetch<VMQRStatusResponse>(
    "/QR/VMQR/1.0/InquireVMQRTransaction",
    { method: "GET", query: { RetrievalReference: retrievalReference } },
  );
}

// ── 7. Merchant QR ──

export async function generateMerchantQR(
  req: GenerateQRRequest,
): Promise<GenerateQRResponse> {
  return seylanFetch<GenerateQRResponse>(
    "/MerchantQR/1.0/GenerateQR",
    { method: "POST", body: { GenerateQR_Request: req } },
  );
}

export async function inquireMerchantQRTransaction(
  req: TransactionViewRequest,
): Promise<TransactionViewResponse> {
  return seylanFetch<TransactionViewResponse>(
    "/MerchantQR/1.0/TransactionView",
    { method: "POST", body: { TransactionView_Request: req } },
  );
}

export async function refundMerchantQR(
  req: MerchantRefundRequest,
): Promise<MerchantRefundResponse> {
  return seylanFetch<MerchantRefundResponse>(
    "/MerchantQR/1.0/MerchantRefund",
    { method: "POST", body: { MerchantRefund_Request: req } },
  );
}
