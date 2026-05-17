import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';
import {
  SRUJAYA_ERP_PROVIDER,
  normalizeErpOrigin,
  type ErpIntegrationMetadata,
} from '@/lib/erp/config';
import type { ERPAuthMethod, ErpSyncSelection } from '@/lib/erp/types';

function integrationsDbErrorResponse(error: { message: string }): Response | null {
  const msg = error.message;
  if (/metadata/i.test(msg) && /schema cache|column/i.test(msg)) {
    return Response.json(
      {
        error:
          'Database is missing integrations.metadata. Run supabase/migrations/20260517120000_integrations_metadata.sql in the Supabase SQL Editor (then retry).',
        code: 'missing_integrations_metadata',
      },
      { status: 503 },
    );
  }
  return null;
}

/** Safe view of Srijaya ERP connection + sync defaults (no secrets). */
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance', 'integration_admin', 'read_only']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const envOrigin = normalizeErpOrigin(process.env.ERP_ORIGIN || process.env.ERP_BASE_URL);
    const hasEnvKey = !!(process.env.ERP_API_KEY || '').trim();
    const hasEnvPassword = !!(process.env.ERP_USERNAME || '').trim() && !!(process.env.ERP_PASSWORD || '').trim();

    const { data: row, error: rowError } = await supabase
      .from('integrations')
      .select('id, status, metadata, last_synced_at, last_error')
      .eq('org_id', ctx.org.id)
      .eq('type', 'erp')
      .eq('provider', SRUJAYA_ERP_PROVIDER)
      .maybeSingle();

    if (rowError) {
      const mapped = integrationsDbErrorResponse(rowError);
      if (mapped) return mapped;
      return Response.json({ error: rowError.message }, { status: 500 });
    }

    const meta = ((row?.metadata ?? {}) as ErpIntegrationMetadata) || {};
    const hasMetaKey = !!(typeof meta.api_key === 'string' && meta.api_key.trim());
    const hasMetaPassword =
      typeof meta.erp_username === 'string' &&
      meta.erp_username.trim().length > 0 &&
      typeof meta.erp_password === 'string' &&
      meta.erp_password.length > 0;

    const configured = hasMetaKey || hasEnvKey || hasMetaPassword || hasEnvPassword;

    const { data: lastSync } = await supabase
      .from('erp_sync_log')
      .select('*')
      .eq('org_id', ctx.org.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return Response.json({
      provider: SRUJAYA_ERP_PROVIDER,
      connected: configured,
      erp_origin: typeof meta.erp_origin === 'string' && meta.erp_origin.trim()
        ? normalizeErpOrigin(meta.erp_origin)
        : envOrigin,
      has_api_key: hasMetaKey || hasEnvKey,
      auth_method: (meta.auth_method || (process.env.ERP_AUTH_METHOD as ERPAuthMethod) || 'api_key') as ERPAuthMethod,
      has_erp_username: !!(typeof meta.erp_username === 'string' && meta.erp_username.trim()),
      erp_sync: meta.erp_sync ?? {},
      integration_id: row?.id ?? null,
      integration_status: row?.status ?? null,
      last_synced_at: row?.last_synced_at ?? null,
      last_integration_error: row?.last_error ?? null,
      last_sync: lastSync,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/** Create/update Srijaya ERP integration metadata for this org (secrets stored like other connectors). */
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance', 'integration_admin']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const { data: existing, error: existingError } = await supabase
      .from('integrations')
      .select('id, metadata')
      .eq('org_id', ctx.org.id)
      .eq('type', 'erp')
      .eq('provider', SRUJAYA_ERP_PROVIDER)
      .maybeSingle();

    if (existingError) {
      const mapped = integrationsDbErrorResponse(existingError);
      if (mapped) return mapped;
      return Response.json({ error: existingError.message }, { status: 500 });
    }

    const prev = ((existing?.metadata ?? {}) as ErpIntegrationMetadata) || {};
    const next: ErpIntegrationMetadata = { ...prev };

    if (typeof body.erp_origin === 'string') {
      const t = body.erp_origin.trim();
      next.erp_origin = t || undefined;
    }
    if (body.clear_api_key === true) {
      next.api_key = undefined;
    } else if (typeof body.api_key === 'string' && body.api_key.trim()) {
      next.api_key = body.api_key.trim();
    }
    if (body.auth_method === 'api_key' || body.auth_method === 'password_jwt') {
      next.auth_method = body.auth_method;
    }
    if (typeof body.erp_username === 'string') {
      const t = body.erp_username.trim();
      next.erp_username = t || undefined;
    }
    if (body.clear_erp_password === true) {
      next.erp_password = undefined;
    } else if (typeof body.erp_password === 'string' && body.erp_password) {
      next.erp_password = body.erp_password;
    }
    if (body.sync_clear === true) {
      next.erp_sync = undefined;
    } else if (body.erp_sync && typeof body.erp_sync === 'object' && !Array.isArray(body.erp_sync)) {
      next.erp_sync = { ...prev.erp_sync, ...(body.erp_sync as ErpSyncSelection) };
    }

    const payloadInsert = {
      org_id: ctx.org.id,
      type: 'erp' as const,
      provider: SRUJAYA_ERP_PROVIDER,
      display_name: 'Srijaya POS',
      status: 'active' as const,
      metadata: next,
      created_by: ctx.user.id,
    };

    if (existing?.id) {
      const { error } = await supabase
        .from('integrations')
        .update({
          display_name: 'Srijaya POS',
          status: 'active',
          metadata: next,
        })
        .eq('id', existing.id);
      if (error) {
        const mapped = integrationsDbErrorResponse(error);
        if (mapped) return mapped;
        return Response.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase.from('integrations').insert(payloadInsert);
      if (error) {
        const mapped = integrationsDbErrorResponse(error);
        if (mapped) return mapped;
        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
