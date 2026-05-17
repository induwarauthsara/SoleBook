import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';
import {
  createERPClientFromContext,
  resolveErpContext,
  type ErpIntegrationMetadata,
} from '@/lib/erp/config';
import type { ErpSyncEntity, ErpSyncSelection } from '@/lib/erp/types';
import {
  listRecentTransactionsFromSnapshotJson,
  parseErpFinancialSnapshot,
} from '@/lib/erp/parse-snapshot';
import {
  normalizeERPTransactions,
  normalizeExpenseRollups,
  type NormalizedTransaction,
} from '@/lib/erp/normalizer';

const ENTITY_SET: ErpSyncEntity[] = ['recent_transactions', 'expense_rollups', 'meta'];

type SupabaseAdmin = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

function toIsoTimestamp(s: string): string {
  if (s.includes('T')) {
    const d = new Date(s);
    return Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString();
  }
  return new Date(`${s}T12:00:00.000Z`).toISOString();
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function normalizeEntityList(raw: unknown): ErpSyncEntity[] {
  if (!Array.isArray(raw)) return [];
  const out = raw.filter((e): e is ErpSyncEntity => typeof e === 'string' && ENTITY_SET.includes(e as ErpSyncEntity));
  return out;
}

function mergeSelection(
  meta: ErpIntegrationMetadata,
  body: Record<string, unknown>,
): {
  entities: ErpSyncEntity[];
  snapshot_params: NonNullable<ErpSyncSelection['snapshot_params']>;
  transaction_types?: string[];
} {
  const defaults = meta.erp_sync ?? {};
  const syncBlock =
    body.sync && typeof body.sync === 'object' && !Array.isArray(body.sync)
      ? (body.sync as ErpSyncSelection)
      : {};

  const strictDefault =
    process.env.ERP_SNAPSHOT_NO_PRIVACY === '1' ? {} : ({ privacy: 'strict' as const } satisfies Pick<NonNullable<ErpSyncSelection['snapshot_params']>, 'privacy'>);

  let entities = normalizeEntityList(body.entities ?? syncBlock.entities ?? defaults.entities);
  if (!entities.length) entities = ['recent_transactions'];

  const snapshot_params = {
    ...strictDefault,
    ...defaults.snapshot_params,
    ...syncBlock.snapshot_params,
    ...(typeof body.snapshot_params === 'object' &&
    body.snapshot_params &&
    !Array.isArray(body.snapshot_params)
      ? (body.snapshot_params as ErpSyncSelection['snapshot_params'])
      : {}),
  };

  const transaction_types =
    (Array.isArray(body.transaction_types)
      ? (body.transaction_types as string[])
      : syncBlock.transaction_types) ?? defaults.transaction_types;

  return {
    entities,
    snapshot_params,
    transaction_types: transaction_types?.length ? transaction_types.map((t) => String(t).toLowerCase()) : undefined,
  };
}

async function persistNormalizedErpRow(
  supabase: SupabaseAdmin,
  orgId: string,
  integrationId: string | null,
  payload: unknown,
  normalized: NormalizedTransaction,
): Promise<{ inserted: boolean }> {
  const { data: rawRow, error: rawErr } = await supabase
    .from('transactions_raw')
    .upsert(
      {
        org_id: orgId,
        integration_id: integrationId,
        source: 'erp',
        external_id: normalized.external_id,
        payload: payload === null || payload === undefined ? {} : (payload as object),
      },
      { onConflict: 'org_id,source,external_id' },
    )
    .select('id')
    .single();

  if (rawErr) throw rawErr;
  if (!rawRow?.id) throw new Error('transactions_raw upsert returned no id');

  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('raw_id', rawRow.id)
    .maybeSingle();

  if (existing?.id) return { inserted: false };

  const { error: insErr } = await supabase.from('transactions').insert({
    org_id: orgId,
    raw_id: rawRow.id,
    direction: normalized.direction,
    amount_lkr: normalized.amount_lkr,
    occurred_at: toIsoTimestamp(normalized.occurred_at),
    description_clean: normalized.description_clean,
    counterparty_alias: normalized.counterparty_alias || null,
    category: normalized.category,
    source: 'erp',
  });

  if (insErr) throw insErr;
  return { inserted: true };
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance', 'integration_admin']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const erpCtx = await resolveErpContext(supabase, ctx.org.id);
    const selection = mergeSelection(erpCtx.metadata, body);
    const client = createERPClientFromContext(erpCtx);

    const { data: syncLog } = await supabase
      .from('erp_sync_log')
      .insert({
        org_id: ctx.org.id,
        sync_type: 'snapshot',
        status: 'in_progress',
      })
      .select('id')
      .single();

    try {
      let rawSnap: unknown | null = null;
      const needsSnapshot = selection.entities.some(
        (e) => e === 'recent_transactions' || e === 'expense_rollups',
      );
      if (needsSnapshot) {
        rawSnap = await client.getFinancialSnapshotJson(selection.snapshot_params);
      }

      let new_transactions = 0;
      let canonical_skipped = 0;

      if (selection.entities.includes('meta')) {
        const meta = await client.getMetaData();
        if (erpCtx.integrationId) {
          const nextMeta: ErpIntegrationMetadata = {
            ...erpCtx.metadata,
            last_erp_meta: meta as unknown as Record<string, unknown>,
          };
          await supabase.from('integrations').update({ metadata: nextMeta }).eq('id', erpCtx.integrationId);
        }
      }

      if (rawSnap && selection.entities.includes('recent_transactions')) {
        const rows = listRecentTransactionsFromSnapshotJson(rawSnap);
        const typeFilter = selection.transaction_types;
        for (const { raw, parsed } of rows) {
          if (!parsed || parsed.amount <= 0) continue;
          if (typeFilter?.length && !typeFilter.includes(String(parsed.type).toLowerCase())) continue;
          const norm = normalizeERPTransactions([parsed])[0];
          if (!norm) continue;
          const { inserted } = await persistNormalizedErpRow(
            supabase,
            ctx.org.id,
            erpCtx.integrationId,
            raw,
            norm,
          );
          if (inserted) new_transactions += 1;
          else canonical_skipped += 1;
        }
      }

      if (rawSnap && selection.entities.includes('expense_rollups')) {
        const parsed = parseErpFinancialSnapshot(rawSnap);
        if (parsed.expenses?.length) {
          const norms = normalizeExpenseRollups(parsed.expenses, parsed.period);
          for (let i = 0; i < norms.length; i++) {
            const norm = norms[i];
            const e = parsed.expenses[i];
            const payload = {
              kind: 'expense_rollup',
              category: e.category,
              amount: e.amount,
              period: parsed.period,
            };
            const { inserted } = await persistNormalizedErpRow(
              supabase,
              ctx.org.id,
              erpCtx.integrationId,
              payload,
              norm,
            );
            if (inserted) new_transactions += 1;
            else canonical_skipped += 1;
          }
        }
      }

      if (erpCtx.integrationId) {
        await supabase
          .from('integrations')
          .update({
            last_synced_at: new Date().toISOString(),
            last_error: null,
            status: 'active',
          })
          .eq('id', erpCtx.integrationId);
      }

      const hashInput = rawSnap != null ? JSON.stringify(rawSnap) : 'meta-only';
      await supabase
        .from('erp_sync_log')
        .update({
          status: 'completed',
          records_pulled: new_transactions,
          completed_at: new Date().toISOString(),
          data_hash: simpleHash(hashInput),
        })
        .eq('id', syncLog?.id);

      return Response.json({
        success: true,
        records_pulled: new_transactions,
        canonical_skipped,
        entities: selection.entities,
      });
    } catch (syncError: unknown) {
      const message = syncError instanceof Error ? syncError.message : 'ERP sync failed';
      if (erpCtx.integrationId) {
        await supabase.from('integrations').update({ last_error: message }).eq('id', erpCtx.integrationId);
      }
      await supabase
        .from('erp_sync_log')
        .update({
          status: 'failed',
          error: message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog?.id);

      return Response.json({ error: 'ERP sync failed', details: message }, { status: 502 });
    }
  } catch (error) {
    return handleAuthError(error);
  }
}
