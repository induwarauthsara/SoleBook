import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';
import { normalizeObligationRecurrence } from '@/lib/obligations-recurrence';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });
    const { id } = await params;

    const body = await req.json();
    if (Object.prototype.hasOwnProperty.call(body, 'recurrence')) {
      const recurrenceNorm = normalizeObligationRecurrence(body.recurrence);
      if (!recurrenceNorm.ok) {
        return Response.json({ error: recurrenceNorm.error }, { status: 400 });
      }
      body.recurrence = recurrenceNorm.recurrence;
    }
    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const { data, error } = await supabase
      .from('obligations')
      .update(body)
      .eq('id', id)
      .eq('org_id', ctx.org.id)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ obligation: data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });
    const { id } = await params;

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const { error } = await supabase
      .from('obligations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('org_id', ctx.org.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
