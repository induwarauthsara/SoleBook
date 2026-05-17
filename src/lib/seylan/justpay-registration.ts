/** Parses sandbox/Seylan JustPay registration JSON for the OTP verification reference. */
export function registrationReferenceFromJustPayRegister(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;
  const inner = root.JustPayRegisterAccount_Response as Record<string, unknown> | undefined;
  if (!inner || typeof inner !== "object") return null;

  const requestId = inner.Request_Id ?? inner.RequestID ?? inner.Request_id;
  if (typeof requestId === "string" && requestId.trim()) return requestId.trim();

  const status = inner.Status as Record<string, unknown> | undefined;
  const txRef = status?.Transaction_Reference;
  if (typeof txRef === "string" && txRef.trim()) return txRef.trim();

  return null;
}
