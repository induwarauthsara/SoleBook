import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { generateInsights } from '@/lib/ai/gemini';
import { buildInsightsPrompt } from '@/lib/ai/prompts';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: transactions }, { data: discipline }, { data: buckets }] = await Promise.all([
      supabase.from('transactions').select('direction, amount_lkr, category, occurred_at').eq('org_id', ctx.org.id).gte('occurred_at', thirtyDaysAgo),
      supabase.from('discipline_scores').select('score').eq('org_id', ctx.org.id).order('snapshot_date', { ascending: false }).limit(1),
      supabase.from('buckets').select('type, current_balance_lkr, target_minimum_lkr').eq('org_id', ctx.org.id),
    ]);

    const reserveBucket = (buckets || []).find(b => b.type === 'profit_reserve');
    const reserveHealth = reserveBucket
      ? Math.round((Number(reserveBucket.current_balance_lkr) / Math.max(Number(reserveBucket.target_minimum_lkr), 1)) * 100)
      : 50;

    const prompt = buildInsightsPrompt({
      transactions30Days: (transactions || []).map(t => ({
        direction: t.direction,
        amount: Number(t.amount_lkr),
        category: t.category || 'other',
        date: t.occurred_at,
      })),
      disciplineScore: discipline?.[0]?.score || 50,
      cashRunway: 30,
      reserveHealth,
    });

    const { content, audit } = await generateInsights(prompt);

    let parsedInsights: any[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedInsights = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      parsedInsights = [];
    }

    const { data: auditEntry } = await supabase.from('ai_audit_log').insert({
      org_id: ctx.org.id,
      actor_user_id: ctx.user.id,
      model_id: audit.model_id,
      prompt_template_version: audit.prompt_template_version,
      context_schema_version: audit.context_schema_version,
      context_hash: audit.context_hash,
      output_passed_safety: audit.output_passed_safety,
      denied_reasons: audit.denied_reasons,
      latency_ms: audit.latency_ms,
    }).select('id').single();

    for (const insight of parsedInsights) {
      await supabase.from('insights').insert({
        org_id: ctx.org.id,
        category: insight.category || 'other',
        severity: insight.severity || 'info',
        title: insight.title,
        body: insight.body,
        generated_by: 'ai',
        ai_audit_id: auditEntry?.id,
      });
    }

    return Response.json({ insights: parsedInsights, audit_id: auditEntry?.id });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const { data } = await supabase
      .from('insights')
      .select('*')
      .eq('org_id', ctx.org.id)
      .order('generated_at', { ascending: false })
      .limit(20);

    return Response.json({ insights: data });
  } catch (error) {
    return handleAuthError(error);
  }
}
