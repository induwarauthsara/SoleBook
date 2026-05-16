import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner', 'finance']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const { buckets } = await req.json();
    if (!Array.isArray(buckets)) {
      return Response.json({ error: 'buckets array required' }, { status: 400 });
    }

    const totalPct = buckets.reduce((s: number, b: any) => s + (b.target_pct || 0), 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      return Response.json({ error: `Bucket percentages must sum to 100 (got ${totalPct})` }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    for (const bucket of buckets) {
      await supabase
        .from('buckets')
        .update({ target_pct: bucket.target_pct })
        .eq('org_id', ctx.org.id)
        .eq('type', bucket.type);
    }

    const { data } = await supabase.from('buckets').select('*').eq('org_id', ctx.org.id).order('display_order');
    return Response.json({ buckets: data });
  } catch (error) {
    return handleAuthError(error);
  }
}
