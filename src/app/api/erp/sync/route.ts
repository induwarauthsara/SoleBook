import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';
import { erpClient } from '@/lib/erp/client';
import { normalizeERPTransactions } from '@/lib/erp/normalizer';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance', 'integration_admin']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const { data: syncLog } = await supabase.from('erp_sync_log').insert({
      org_id: ctx.org.id,
      sync_type: 'snapshot',
      status: 'in_progress',
    }).select('id').single();

    try {
      const snapshot = await erpClient.getFinancialSnapshot();
      const normalized = normalizeERPTransactions(snapshot.recent_transactions);

      let recordsPulled = 0;
      for (const tx of normalized) {
        const { error } = await supabase.from('transactions').upsert({
          org_id: ctx.org.id,
          direction: tx.direction,
          amount_lkr: tx.amount_lkr,
          occurred_at: tx.occurred_at,
          description_clean: tx.description_clean,
          counterparty_alias: tx.counterparty_alias,
          category: tx.category,
          source: 'erp',
        }, { onConflict: 'org_id' });
        if (!error) recordsPulled++;
      }

      await supabase.from('erp_sync_log').update({
        status: 'completed',
        records_pulled: recordsPulled,
        completed_at: new Date().toISOString(),
        data_hash: simpleHash(JSON.stringify(snapshot)),
      }).eq('id', syncLog?.id);

      return Response.json({ success: true, records_pulled: recordsPulled });
    } catch (syncError: any) {
      await supabase.from('erp_sync_log').update({
        status: 'failed',
        error: syncError.message,
        completed_at: new Date().toISOString(),
      }).eq('id', syncLog?.id);

      return Response.json({ error: 'ERP sync failed', details: syncError.message }, { status: 502 });
    }
  } catch (error) {
    return handleAuthError(error);
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
