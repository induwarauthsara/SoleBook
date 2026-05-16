## USER SIDE

### 1

**HighRisk_StepUp_MFA**

Extra authentication for sensitive actions.

Example:

- linking bank
- approving payment
- changing supplier account

Could be:

- OTP
- fingerprint
- face unlock

### 2

**Device_OS_WebAuthn_optional**

Use device biometrics securely.

NOT:

- store fingerprints yourself.

Instead:

- use:

- Face ID
- Android biometrics
- Passkeys
- WebAuthn

Very correct architecture.

### 3

**Session_Cookies_or_Tokens**

How login sessions work securely.

Meaning:

- secure login tokens
- protected sessions

---

## SYSTEM SIDE

SOLEBOOK CORE SYSTEM This is: the trusted financial brain. Most important rule: MONEY LOGIC STAYS HERE. NOT in AI. This is VERY important.

### 1

**TLS_WAF_RateLimit**

Protection layer.

Meaning:

- HTTPS encryption
- firewall
- block spam attacks
- rate limiting

Think:

"protect API from attackers."

### 2

**API_BFF_Validation_RBAC**

This is VERY important.

BFF = Backend For Frontend

Your frontend NEVER directly touches core financial systems.

Everything goes through:

Frontend → API Layer → Core System

Good fintech architecture.

Validation

Check:

- data format
- permissions
- fraud patterns

### 3

**FinanceEngine_Rules_Forecast**

THIS IS YOUR MOST IMPORTANT COMPONENT.

This means:

real financial logic lives here.

NOT in ChatGPT/LLM.

This engine handles:

- allocations
- reserve calculations
- duplicate detection
- payment prioritization
- forecasting

This is EXACTLY what I previously recommended.

Excellent architecture.

### 4

**SecureIngest_Webhooks_OAuth**

This handles:

- bank APIs
- ERP integrations
- POS integrations

Securely.

Meaning:

- OAuth login
- webhook verification
- signed requests

### 5

**EncryptedStore_TenantScoped**

Database security.

### 6

**AuditLog_SIEM_ready**

Track every important event.

Example:

- login
- payment approval
- AI recommendation generated
- bank connected

Banks LOVE audit trails.

### 7

**FraudSignals_nonLLM_rules**

Fraud detection handled using:

- rules
- deterministic logic

NOT AI hallucinations.

VERY important.

---

## MML SEcurity

### 1

**DataSanitizer**

VERY IMPORTANT.

Before sending data to AI:

remove:

- account numbers
- secrets
- passwords
- raw bank details
- private identifiers

Excellent.

### 2

**ModelProvider_ephemeral**

Means:

temporary AI interaction.

Avoid storing sensitive prompts permanently.

### 4

**AI_SafetyFilter_schema_classify**

After AI responds:

validate response.

Example:

BLOCK:

Transfer all money immediately.

ALLOW:

Your reserve health is declining.
