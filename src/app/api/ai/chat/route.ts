import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { streamChat, ChatMessage } from '@/lib/ai/gemini';
import { buildChatContext } from '@/lib/ai/prompts';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const { message } = await req.json();
    if (!message) return Response.json({ error: 'Message required' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const [{ data: buckets }, { data: discipline }, { data: obligations }, { data: insights }, { data: settings }] = await Promise.all([
      supabase.from('buckets').select('type, current_balance_lkr').eq('org_id', ctx.org.id),
      supabase.from('discipline_scores').select('score').eq('org_id', ctx.org.id).order('snapshot_date', { ascending: false }).limit(1),
      supabase.from('obligations').select('category, amount_lkr, due_date').eq('org_id', ctx.org.id).in('status', ['upcoming', 'due_soon']).limit(10),
      supabase.from('insights').select('title').eq('org_id', ctx.org.id).order('generated_at', { ascending: false }).limit(3),
      supabase.from('user_settings').select('language').eq('user_id', ctx.user.id).single(),
    ]);

    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('org_id', ctx.org.id)
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const chatHistory: ChatMessage[] = (history || []).reverse().map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const bucketBalances: Record<string, number> = {};
    for (const b of buckets || []) {
      bucketBalances[b.type] = Number(b.current_balance_lkr);
    }

    const context = buildChatContext({
      disciplineScore: discipline?.[0]?.score || 0,
      cashRunway: 30,
      bucketBalances,
      upcomingObligations: (obligations || []).map(o => ({ category: o.category, amount: Number(o.amount_lkr), dueDate: o.due_date })),
      recentInsights: (insights || []).map(i => i.title),
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      language: settings?.language || 'en',
    });

    await supabase.from('chat_messages').insert({
      org_id: ctx.org.id,
      user_id: ctx.user.id,
      role: 'user',
      content: message,
    });

    const { stream, audit } = await streamChat(chatHistory, context, message);

    let fullResponse = '';
    const encoder = new TextEncoder();
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
