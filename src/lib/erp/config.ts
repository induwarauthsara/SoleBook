import type { SupabaseClient } from '@supabase/supabase-js';
import type { ERPAuthMethod, ErpSyncSelection } from './types';
import { ERPClient } from './client';

export const SRUJAYA_ERP_PROVIDER = 'srijaya';

const DEFAULT_ERP_ORIGIN = 'https://pos.srijaya.lk';

/** Strip trailing slashes; ensure scheme. */
export function normalizeErpOrigin(input: string | null | undefined, fallback = DEFAULT_ERP_ORIGIN): string {
  const raw = (input ?? fallback).trim().replace(/\/+$/, '');
  if (!raw) return normalizeErpOrigin(fallback, DEFAULT_ERP_ORIGIN);
  if (!/^https?:\/\//i.test(raw)) return `https://${raw}`;
  return raw;
}

export type ErpIntegrationMetadata = {
  erp_origin?: string;
  /** SoleBook integration API key (`sb_…`). */
  api_key?: string;
  auth_method?: ERPAuthMethod;
  erp_username?: string;
  erp_password?: string;
  erp_sync?: ErpSyncSelection;
  last_erp_meta?: Record<string, unknown>;
};

export interface ResolvedErpContext {
  baseUrl: string;
  authMethod: ERPAuthMethod;
  apiKey?: string;
  username?: string;
  password?: string;
  integrationId: string | null;
  metadata: ErpIntegrationMetadata;
}

/**
 * Resolve ERP endpoint + credentials: per-org `integrations` row (Srijaya) overrides env.
 * Prefer `api_key` in metadata or `ERP_API_KEY`; otherwise username/password from metadata or env.
 */
export async function resolveErpContext(
  supabase: SupabaseClient,
  orgId: string,
): Promise<ResolvedErpContext> {
  const envOrigin = normalizeErpOrigin(process.env.ERP_ORIGIN || process.env.ERP_BASE_URL);
  const envMethod = (process.env.ERP_AUTH_METHOD || 'api_key') as ERPAuthMethod;

  const { data: row } = await supabase
    .from('integrations')
    .select('id, metadata')
    .eq('org_id', orgId)
    .eq('type', 'erp')
    .eq('provider', SRUJAYA_ERP_PROVIDER)
    .maybeSingle();

  const meta = ((row?.metadata ?? {}) as ErpIntegrationMetadata) || {};
  const metaOrigin = typeof meta.erp_origin === 'string' ? meta.erp_origin : undefined;
  const baseUrl = metaOrigin ? normalizeErpOrigin(metaOrigin) : envOrigin;

  const metaKey = typeof meta.api_key === 'string' ? meta.api_key.trim() : '';
  const envKey = (process.env.ERP_API_KEY || '').trim();
  const apiKey = metaKey || envKey;

  const metaMethod = meta.auth_method === 'password_jwt' ? 'password_jwt' : meta.auth_method === 'api_key' ? 'api_key' : undefined;
  const authMethod: ERPAuthMethod = metaMethod || envMethod;

  if (authMethod === 'api_key' && apiKey) {
    return {
      baseUrl,
      authMethod: 'api_key',
      apiKey,
      integrationId: row?.id ?? null,
      metadata: meta,
    };
  }

  const username =
    typeof meta.erp_username === 'string' ? meta.erp_username.trim() : (process.env.ERP_USERNAME || '').trim();
  const password =
    typeof meta.erp_password === 'string' ? meta.erp_password : (process.env.ERP_PASSWORD || '');

  if (username && password) {
    return {
      baseUrl,
      authMethod: 'password_jwt',
      username,
      password,
      integrationId: row?.id ?? null,
      metadata: meta,
    };
  }

  throw new Error(
    'ERP is not configured: add a Srijaya integration API key in Settings (or set ERP_API_KEY), or set erp_username/erp_password (or ERP_USERNAME/ERP_PASSWORD).',
  );
}

export function createERPClientFromContext(ctx: ResolvedErpContext): ERPClient {
  return new ERPClient({
    baseUrl: ctx.baseUrl,
    authMethod: ctx.authMethod,
    apiKey: ctx.apiKey,
    username: ctx.username,
    password: ctx.password,
  });
}
