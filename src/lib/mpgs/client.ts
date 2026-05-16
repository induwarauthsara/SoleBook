const MPGS_GATEWAY_URL = process.env.MPGS_GATEWAY_URL || 'https://test-seylan.mtf.gateway.mastercard.com';
const MPGS_MERCHANT_ID = process.env.MPGS_MERCHANT_ID || '';
const MPGS_API_PASSWORD = process.env.MPGS_API_PASSWORD || '';

interface OrderInput {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  returnUrl: string;
}

interface TransactionResult {
  success: boolean;
  status: string;
  orderId: string;
  transactionId: string;
  amount: number;
  authorizationCode?: string;
}

interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
}

export class MPGSClient {
  private gatewayUrl: string;
  private merchantId: string;
  private apiPassword: string;

  constructor() {
    this.gatewayUrl = MPGS_GATEWAY_URL;
    this.merchantId = MPGS_MERCHANT_ID;
    this.apiPassword = MPGS_API_PASSWORD;
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`merchant.${this.merchantId}:${this.apiPassword}`).toString('base64');
    return `Basic ${credentials}`;
  }

  private getApiUrl(path: string): string {
    return `${this.gatewayUrl}/api/rest/version/73/merchant/${this.merchantId}${path}`;
  }

  async createCheckoutSession(input: OrderInput): Promise<{ sessionId: string; redirectUrl: string; orderId: string }> {
    const sessionRes = await fetch(this.getApiUrl('/session'), {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiOperation: 'INITIATE_CHECKOUT',
        interaction: {
          operation: 'PURCHASE',
          returnUrl: input.returnUrl,
          merchant: { name: 'SoleBook', url: input.returnUrl },
        },
        order: {
          id: input.orderId,
          amount: input.amount.toFixed(2),
          currency: input.currency || 'LKR',
          description: input.description,
        },
      }),
    });

    if (!sessionRes.ok) {
      const error = await sessionRes.text();
      throw new Error(`MPGS session creation failed: ${sessionRes.status} - ${error}`);
    }

    const sessionData = await sessionRes.json();
    const sessionId = sessionData.session?.id;

    if (!sessionId) {
      throw new Error('MPGS did not return a session ID');
    }

    const redirectUrl = `${this.gatewayUrl}/checkout/pay/${sessionId}`;

    return { sessionId, redirectUrl, orderId: input.orderId };
  }

  async verifyTransaction(orderId: string): Promise<TransactionResult> {
    const res = await fetch(this.getApiUrl(`/order/${orderId}`), {
      headers: { Authorization: this.getAuthHeader() },
    });

    if (!res.ok) {
      throw new Error(`MPGS order verification failed: ${res.status}`);
    }

    const data = await res.json();
    const transaction = data.transaction?.[0] || {};

    return {
      success: data.result === 'SUCCESS' && data.status === 'CAPTURED',
      status: data.status || 'UNKNOWN',
      orderId,
      transactionId: transaction.id || '',
      amount: parseFloat(data.amount) || 0,
      authorizationCode: transaction.authorizationCode,
    };
  }

  async refundTransaction(orderId: string, transactionId: string, amount: number): Promise<RefundResult> {
    const refundId = `ref-${Date.now()}`;

    const res = await fetch(this.getApiUrl(`/order/${orderId}/transaction/${refundId}`), {
      method: 'PUT',
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiOperation: 'REFUND',
        transaction: { amount: amount.toFixed(2), currency: 'LKR' },
      }),
    });

    if (!res.ok) {
      throw new Error(`MPGS refund failed: ${res.status}`);
    }

    const data = await res.json();
    return {
      success: data.result === 'SUCCESS',
      refundId,
      amount,
      status: data.result || 'UNKNOWN',
    };
  }
}

export const mpgsClient = new MPGSClient();
