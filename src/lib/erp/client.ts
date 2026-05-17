import type {
  ERPAuthMethod,
  ERPAuthResponse,
  ERPFinancialSnapshot,
  ERPInvoiceBalancePayment,
  ERPMetaData,
  ERPPaymentPush,
  ERPSnapshotQuery,
} from './types';
import { parseErpFinancialSnapshot } from './parse-snapshot';

const DEFAULT_ORIGIN = 'https://pos.srijaya.lk';

export type { ERPAuthMethod };

function normalizeOrigin(input: string): string {
  const raw = input.trim().replace(/\/+$/, '');
  if (!raw) return DEFAULT_ORIGIN;
  if (!/^https?:\/\//i.test(raw)) return `https://${raw}`;
  return raw;
}

/** Truncated one-line body from failed ERP responses (helps debug PHP 500s without logging secrets). */
async function erpErrorBodySnippet(res: Response): Promise<string> {
  try {
    const text = await res.text();
    const oneLine = text.replace(/\s+/g, ' ').trim();
    if (!oneLine) return '';
    return oneLine.length > 400 ? `${oneLine.slice(0, 400)}…` : oneLine;
  } catch {
    return '';
  }
}

export interface ERPClientOptions {
  baseUrl: string;
  authMethod: ERPAuthMethod;
  apiKey?: string;
  username?: string;
  password?: string;
}

/**
 * Srijaya SoleBook integration client (`/api/v1/integrations/solebook/`).
 * See docs/SOLEBOOK_INTEGRATION_API.md — authenticated calls use `Authorization: Bearer`.
 */
export class ERPClient {
  private readonly baseUrl: string;
  private readonly authMethod: ERPAuthMethod;
  private readonly apiKey?: string;
  private readonly username?: string;
  private readonly password?: string;
  private jwtCache: { token: string; expiresAt: number } | null = null;

  constructor(opts: ERPClientOptions) {
    this.baseUrl = normalizeOrigin(opts.baseUrl);
    this.authMethod = opts.authMethod;
    this.apiKey = opts.apiKey;
    this.username = opts.username;
    this.password = opts.password;
  }

  /** Singleton using server env (backward compatible). */
  static fromEnv(): ERPClient {
    const baseUrl = normalizeOrigin(process.env.ERP_ORIGIN || process.env.ERP_BASE_URL || DEFAULT_ORIGIN);
    const authMethod = (process.env.ERP_AUTH_METHOD || 'api_key') as ERPAuthMethod;
    return new ERPClient({
      baseUrl,
      authMethod,
      apiKey: process.env.ERP_API_KEY || undefined,
      username: process.env.ERP_USERNAME || undefined,
      password: process.env.ERP_PASSWORD || undefined,
    });
  }

  private solebookPath(script: string): string {
    const s = script.endsWith('.php') ? script : `${script}.php`;
    return `${this.baseUrl}/api/v1/integrations/solebook/${s}`;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (this.authMethod === 'api_key') {
      const key = this.apiKey?.trim();
      if (!key) throw new Error('ERP API key is missing');
      return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
    }

    const token = await this.ensureJwt();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  private async ensureJwt(): Promise<string> {
    const skewMs = 60_000;
    if (this.jwtCache && this.jwtCache.expiresAt > Date.now() + skewMs) {
      return this.jwtCache.token;
    }
    const user = this.username?.trim();
    const pass = this.password;
    if (!user || pass == null || pass === '') {
      throw new Error('ERP username/password are missing for JWT auth');
    }
    const res = await fetch(this.solebookPath('auth/token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass }),
    });
    if (!res.ok) throw new Error(`ERP auth failed: ${res.status}`);
    const data = (await res.json()) as ERPAuthResponse;
    if (!data.token) throw new Error('ERP auth response missing token');
    const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600;
    this.jwtCache = { token: data.token, expiresAt: Date.now() + Math.max(60, expiresIn) * 1000 };
    return data.token;
  }

  /** Unauthenticated health check (docs: `health.php` has no Bearer). */
  async checkHealth(): Promise<{ status: string; latency_ms: number }> {
    const start = Date.now();
    try {
      const res = await fetch(this.solebookPath('health'), { cache: 'no-store' });
      return { status: res.ok ? 'healthy' : 'unhealthy', latency_ms: Date.now() - start };
    } catch {
      return { status: 'unreachable', latency_ms: Date.now() - start };
    }
  }

  async getMetaData(): Promise<ERPMetaData> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(this.solebookPath('meta'), { headers, cache: 'no-store' });
    if (!res.ok) {
      const detail = await erpErrorBodySnippet(res);
      throw new Error(
        detail ? `ERP meta fetch failed: ${res.status} — ${detail}` : `ERP meta fetch failed: ${res.status}`,
      );
    }
    return res.json() as Promise<ERPMetaData>;
  }

  async getFinancialSnapshotJson(query?: ERPSnapshotQuery): Promise<unknown> {
    const headers = await this.getAuthHeaders();
    const params = new URLSearchParams();
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    if (query?.branch_id) params.set('branch_id', query.branch_id);
    if (query?.privacy) params.set('privacy', query.privacy);
    const qs = params.toString();
    const url = qs ? `${this.solebookPath('snapshot')}?${qs}` : this.solebookPath('snapshot');
    const res = await fetch(url, { headers, cache: 'no-store' });
    if (!res.ok) {
      const detail = await erpErrorBodySnippet(res);
      throw new Error(
        detail ? `ERP snapshot failed: ${res.status} — ${detail}` : `ERP snapshot failed: ${res.status}`,
      );
    }
    return res.json();
  }

  async getFinancialSnapshot(query?: ERPSnapshotQuery): Promise<ERPFinancialSnapshot> {
    const raw = await this.getFinancialSnapshotJson(query);
    return parseErpFinancialSnapshot(raw);
  }

  async pushExpensePayment(payment: ERPPaymentPush, idempotencyKey: string): Promise<{ success: boolean; reference: string }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/v1/integrations/solebook/payments/expense.php`, {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payment),
    });
    if (!res.ok) throw new Error(`ERP expense push failed: ${res.status}`);
    return res.json();
  }

  async pushGRNPayment(payment: ERPPaymentPush, idempotencyKey: string): Promise<{ success: boolean; reference: string }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/v1/integrations/solebook/payments/grn.php`, {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payment),
    });
    if (!res.ok) throw new Error(`ERP GRN push failed: ${res.status}`);
    return res.json();
  }

  async pushInvoiceBalancePayment(
    payment: ERPInvoiceBalancePayment,
    idempotencyKey: string,
  ): Promise<{ success: boolean; reference?: string }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/v1/integrations/solebook/payments/invoice_balance.php`, {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payment),
    });
    if (!res.ok) throw new Error(`ERP invoice balance payment failed: ${res.status}`);
    return res.json();
  }
}

export const erpClient = ERPClient.fromEnv();
