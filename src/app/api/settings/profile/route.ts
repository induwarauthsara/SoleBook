import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireRole, handleAuthError } from '@/lib/auth/middleware';

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ['owner']);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    const body = await req.json();
    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: 'Server error' }, { status: 500 });

    const updates: any = {};
    if (body.business_type) updates.business_type = body.business_type;
    if (body.target_owner_salary_lkr !== undefined) updates.target_owner_salary_lkr = body.target_owner_salary_lkr;
    if (body.monthly_revenue_band) updates.monthly_revenue_band = body.monthly_revenue_band;
    if (body.staff_count_band) updates.staff_count_band = body.staff_count_band;

    const { data, error } = await supabase
      .from('business_profiles')
      .update(updates)
      .eq('org_id', ctx.org.id)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    if (body.business_name) {
      await supabase.from('organizations').update({ name: body.business_name }).eq('id', ctx.org.id);
    }

    return Response.json({ profile: data });
  } catch (error) {
    return handleAuthError(error);
  }
}
