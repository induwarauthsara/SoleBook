/**
 * Shared demo / guest account used from onboarding “Try with demo data”.
 * Real signup should clear local onboarding state so the profile → business flow runs fresh.
 */
export const DEMO_ACCOUNT_EMAIL = "demo@solebook.app";

/** Email match for navbar CTA / transition out of demo. */
export function isDemoAccountEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  return email.trim().toLowerCase() === DEMO_ACCOUNT_EMAIL.toLowerCase();
}

const REGISTRATION_STATE_KEYS = [
  "solebook.onboarded",
  "solebook.onboarding",
] as const;

/** Clears first-run onboarding flags so a new account goes through onboarding normally. */
export function clearStoredOnboardingRegistrationState(): void {
  if (typeof window === "undefined") return;
  for (const key of REGISTRATION_STATE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
