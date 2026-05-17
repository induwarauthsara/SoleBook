import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { streamChat, ChatMessage } from '@/lib/ai/gemini';
import { buildChatContext, PROMPT_VERSION } from '@/lib/ai/prompts';
import { computeRunway } from '@/lib/engine/runway';
import { buildMockChatReply, shouldUseMockAI } from '@/lib/ai/chat-mock';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('org_id', ctx.org.id)
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({
      messages: (data || []).map((m) => ({
        id: m.id,
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
        createdAt: m.created_at,
      })),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('org_id', ctx.org.id)
      .eq('user_id', ctx.user.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const { message } = await req.json();
    if (!message) return Response.json({ error: 'Message required' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: buckets },
      { data: discipline },
      { data: obligations },
      { data: insights },
      { data: settings },
      { data: transactions },
      { data: accounts },
    ] = await Promise.all([
      supabase.from('buckets').select('type, current_balance_lkr').eq('org_id', ctx.org.id),
      supabase
        .from('discipline_scores')
        .select('score')
        .eq('org_id', ctx.org.id)
        .order('snapshot_date', { ascending: false })
        .limit(1),
      supabase
        .from('obligations')
        .select('category, amount_lkr, due_date')
        .eq('org_id', ctx.org.id)
        .in('status', ['upcoming', 'due_soon', 'overdue'])
        .limit(10),
      supabase
        .from('insights')
        .select('title')
        .eq('org_id', ctx.org.id)
        .order('generated_at', { ascending: false })
        .limit(3),
      supabase.from('user_settings').select('language').eq('user_id', ctx.user.id).single(),
      supabase
        .from('transactions')
        .select('direction, amount_lkr')
        .eq('org_id', ctx.org.id)
        .gte('occurred_at', thirtyDaysAgo),
      supabase.from('accounts').select('current_balance').eq('org_id', ctx.org.id),
    ]);

    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('org_id', ctx.org.id)
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const chatHistory: ChatMessage[] = (history || []).reverse().map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const bucketBalances: Record<string, number> = {};
    for (const b of buckets || []) {
      bucketBalances[b.type] = Number(b.current_balance_lkr);
    }

    const txns = transactions || [];
    const monthlyRevenue = txns.filter((t) => t.direction === 'inflow').reduce((s, t) => s + Number(t.amount_lkr), 0);
    const monthlyExpenses = txns.filter((t) => t.direction === 'outflow').reduce((s, t) => s + Number(t.amount_lkr), 0);
    const currentBalance = (accounts || []).reduce((s, a) => s + Number(a.current_balance), 0);
    const avgDailyOutflow = monthlyExpenses / 30;
    const avgDailyInflow = monthlyRevenue / 30;

    const runway = computeRunway({
      currentBalance,
      avgDailyOutflow,
      avgDailyInflow,
      obligationsDueNext30Days: (obligations || []).map((o) => ({
        amount: Number(o.amount_lkr),
        dueDate: o.due_date,
      })),
      projectedInflow30Days: monthlyRevenue,
    });

    const context = buildChatContext({
      disciplineScore: discipline?.[0]?.score || 0,
      cashRunway: runway.daysUntilZero,
      bucketBalances,
      upcomingObligations: (obligations || []).map((o) => ({
        category: o.category,
        amount: Number(o.amount_lkr),
        dueDate: o.due_date,
      })),
      recentInsights: (insights || []).map((i) => i.title),
      monthlyRevenue,
      monthlyExpenses,
      language: settings?.language || 'en',
    });

    await supabase.from('chat_messages').insert({
      org_id: ctx.org.id,
      user_id: ctx.user.id,
      role: 'user',
      content: message,
    });

    const encoder = new TextEncoder();
    const useMock = shouldUseMockAI();

    if (useMock) {
      const startTime = Date.now();
      const mockBody = buildMockChatReply(message);
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for (let i = 0; i < mockBody.length; i += 40) {
              const chunk = mockBody.slice(i, i + 40);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
              await new Promise((r) => setTimeout(r, 25));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();

            const latency_ms = Date.now() - startTime;

            await supabase!.from('chat_messages').insert({
              org_id: ctx.org!.id,
              user_id: ctx.user.id,
              role: 'assistant',
              content: mockBody,
              context_hash: 'mock',
              model_id: 'mock-local',
            });

            await supabase!.from('ai_audit_log').insert({
              org_id: ctx.org!.id,
              actor_user_id: ctx.user.id,
              model_id: 'mock-local',
              prompt_template_version: PROMPT_VERSION,
              context_schema_version: 'v1',
              context_hash: 'mock',
              output_passed_safety: true,
              denied_reasons: [],
              latency_ms,
            });
          } catch (e) {
            controller.error(e);
          }
        },
      });

      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
      });
    }

    const { stream, audit } = await streamChat(chatHistory, context, message);

    let fullResponse = '';
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

          await supabase!.from('chat_messages').insert({
            org_id: ctx.org!.id,
            user_id: ctx.user.id,
            role: 'assistant',
            content: fullResponse,
            context_hash: audit.context_hash,
            model_id: audit.model_id,
          });

          await supabase!.from('ai_audit_log').insert({
            org_id: ctx.org!.id,
            actor_user_id: ctx.user.id,
            model_id: audit.model_id,
            prompt_template_version: audit.prompt_template_version,
            context_schema_version: audit.context_schema_version,
            context_hash: audit.context_hash,
            output_passed_safety: audit.output_passed_safety,
            denied_reasons: audit.denied_reasons,
            latency_ms: audit.latency_ms,
          });
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
