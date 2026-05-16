import { ERPAuthResponse, ERPFinancialSnapshot, ERPMetaData, ERPPaymentPush } from './types';

const ERP_BASE_URL = process.env.ERP_BASE_URL || 'http://pos.srijaya.lk';
const ERP_API_KEY = process.env.ERP_API_KEY || '';
const ERP_AUTH_METHOD = process.env.ERP_AUTH_METHOD || 'api_key';

let cachedToken: { token: string; expiresAt: number } | null = null;

export class ERPClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = ERP_BASE_URL;
    this.apiKey = ERP_API_KEY;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (ERP_AUTH_METHOD === 'api_key') {
      return { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' };
    }

    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      return { Authorization: `Bearer ${cachedToken.token}`, 'Content-Type': 'application/json' };
    }

    const token = await this.authenticate();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async authenticate(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/v1/integrations/solebook/auth/token.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey },
      body: JSON.stringify({ grant_type: 'client_credentials' }),
    });

    if (!res.ok) throw new Error(`ERP auth failed: ${res.status}`);
    const data: ERPAuthResponse = await res.json();
    cachedToken = { token: data.token, expiresAt: Date.now() + 3500 * 1000 };
    return data.token;
  }

  async checkHealth(): Promise<{ status: string; latency_ms: number }> {
    const start = Date.now();
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${this.baseUrl}/api/v1/integrations/solebook/health`, { headers });
      return { status: res.ok ? 'healthy' : 'unhealthy', latency_ms: Date.now() - start };
    } catch {
      return { status: 'unreachable', latency_ms: Date.now() - start };
    }
  }

  async getMetaData(): Promise<ERPMetaData> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/v1/integrations/solebook/meta`, { headers });
    if (!res.ok) throw new Error(`ERP meta fetch failed: ${res.status}`);
    return res.json();
  }

  async getFinancialSnapshot(from?: string, to?: string): Promise<ERPFinancialSnapshot> {
    const headers = await this.getAuthHeaders();
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const url = `${this.baseUrl}/api/v1/integrations/solebook/snapshot?${params}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`ERP snapshot failed: ${res.status}`);
    return res.json();
  }

  async pushExpensePayment(payment: ERPPaymentPush, idempotencyKey: string): Promise<{ success: boolean; reference: string }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/v1/integrations/solebook/payments/expense`, {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payment),
    });
    if (!res.ok) throw new Error(`ERP expense push failed: ${res.status}`);
    return res.json();
  }

  async pushGRNPayment(payment: ERPPaymentPush, idempotencyKey: string): Promise<{ success: boolean; reference: string }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/v1/integrations/solebook/payments/grn`, {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payment),
    });
    if (!res.ok) throw new Error(`ERP GRN push failed: ${res.status}`);
    return res.json();
  }

  async pushInvoicePayment(payment: ERPPaymentPush, idempotencyKey: string): Promise<{ success: boolean; reference: string }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/v1/integrations/solebook/payments/invoice`, {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payment),
    });
    if (!res.ok) throw new Error(`ERP invoice push failed: ${res.status}`);
    return res.json();
  }
}

export const erpClient = new ERPClient();
