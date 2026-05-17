/**
 * Developer-only mock for Seylan / payment partner APIs.
 * Client: persisted in localStorage; server: requires dev mode or ALLOW_MOCK_PAYMENT_GATEWAY=true.
 * Send header `x-solebook-mock-payment: true` on payment requests when enabled.
 */

export const MOCK_PAYMENT_STORAGE_KEY = "solebook.dev.mockPaymentGateway";

export const MOCK_PAYMENT_HEADER = "x-solebook-mock-payment";

export function isMockPaymentGatewayAllowed(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_MOCK_PAYMENT_GATEWAY === "true"
  );
}

export function wantsMockPaymentGateway(req: Request): boolean {
  if (!isMockPaymentGatewayAllowed()) return false;
  const v = req.headers.get(MOCK_PAYMENT_HEADER);
  return v === "true" || v === "1";
}

/** Client: read flag (browser only). */
export function readMockPaymentGatewayEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MOCK_PAYMENT_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/** Headers to merge into payment-related fetch calls. */
export function mockPaymentGatewayHeaders(): Record<string, string> {
  if (typeof window === "undefined" || !readMockPaymentGatewayEnabled()) {
    return {};
  }
  return { [MOCK_PAYMENT_HEADER]: "true" };
}

export function mockQrRefNo(): string {
  return `MOCKQR-${Date.now()}`;
}

export function mockSvgQrDataUrl(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#fff" width="200" height="200"/><text x="100" y="95" text-anchor="middle" font-size="11" fill="#333">Mock QR</text><text x="100" y="115" text-anchor="middle" font-size="10" fill="#666">${label.replace(/</g, "").slice(0, 40)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Ref returned only from mock/demo QR generation — safe to treat as paid for demo flows. */
export function isMockQrTransactionRef(ref: string): boolean {
  return ref.startsWith("MOCKQR-");
}

/** Minimum env for real Merchant QR (GenerateQR) calls — when missing, subscription QR should demo. */
export function isSeylanMerchantQrConfigured(): boolean {
  return Boolean(
    process.env.SEYLAN_MERCHANT_LOGIN_ID?.trim() &&
      process.env.SEYLAN_MERCHANT_CHANNEL_USER?.trim() &&
      process.env.SEYLAN_MERCHANT_CHANNEL_PASS?.trim() &&
      process.env.SEYLAN_CHECKSUM_KEY?.trim() &&
      process.env.SEYLAN_MERCHANT_MID?.trim() &&
      process.env.SEYLAN_MERCHANT_TID?.trim(),
  );
}

/**
 * Demo / staging: no Seylan merchant QR credentials, or explicit `SOLEBOOK_SUBSCRIPTION_DEMO=true`.
 * Enables mock QR + mock JustPay subscription without the client mock header.
 */
export function useSubscriptionPaymentAutoMock(): boolean {
  return (
    process.env.SOLEBOOK_SUBSCRIPTION_DEMO === "true" || !isSeylanMerchantQrConfigured()
  );
}
