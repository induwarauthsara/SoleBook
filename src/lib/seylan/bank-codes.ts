/** Institution codes used as Destination_bank_code for JustPay / CEFTS-style APIs (SL banking network).
 *  Align with `docs/Web API Manual - QR , JUSTPAY.pdf` if the sandbox rejects a code.
 */
export const SEYLAN_BANK_OPTIONS: ReadonlyArray<{ code: string; label: string }> = [
  { code: "7278", label: "Seylan Bank" },
  { code: "7056", label: "Commercial Bank" },
  { code: "7288", label: "Sampath Bank" },
  { code: "7083", label: "Hatton National Bank (HNB)" },
  { code: "7010", label: "Bank of Ceylon" },
  { code: "7135", label: "DFCC Bank" },
  { code: "7143", label: "National Savings Bank" },
  { code: "7463", label: "Nations Trust Bank" },
  { code: "7103", label: "People's Bank" },
];
