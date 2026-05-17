import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    // Get all obligations with recurrence rules
    const { data: recurring } = await supabase
      .from('obligations')
      .select('*')
      .eq('org_id', ctx.org.id)
      .not('recurrence', 'is', null)
      .eq('status', 'paid');

    if (!recurring || recurring.length === 0) {
      return Response.json({ generated: 0 });
    }

    let generated = 0;
    for (const obligation of recurring) {
      const nextDueDate = computeNextDueDate(obligation.due_date, obligation.recurrence);
      if (!nextDueDate) continue;

      // Check if already exists
      const { data: existing } = await supabase
        .from('obligations')
        .select('id')
        .eq('org_id', ctx.org.id)
        .eq('category', obligation.category)
        .eq('counterparty_alias', obligation.counterparty_alias || '')
        .eq('due_date', nextDueDate)
        .single();

      if (!existing) {
        await supabase.from('obligations').insert({
          org_id: ctx.org.id,
          bucket_id: obligation.bucket_id,
          category: obligation.category,
          counterparty_alias: obligation.counterparty_alias,
          amount_lkr: obligation.amount_lkr,
          due_date: nextDueDate,
          priority: obligation.priority,
          recurrence: obligation.recurrence,
          notes: obligation.notes,
          status: 'upcoming',
        });
        generated++;
      }
    }

    return Response.json({ generated });
  } catch (error) {
    return handleAuthError(error);
  }
}

function computeNextDueDate(lastDueDate: string, recurrence: string): string | null {
  const date = new Date(lastDueDate);
  switch (recurrence) {
    case 'weekly': date.setDate(date.getDate() + 7); break;
    case 'biweekly': date.setDate(date.getDate() + 14); break;
    case 'monthly': date.setMonth(date.getMonth() + 1); break;
    case 'quarterly': date.setMonth(date.getMonth() + 3); break;
    case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
    default: return null;
  }
  return date.toISOString().split('T')[0];
}
