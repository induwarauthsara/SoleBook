import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, business_name, business_type } = await req.json();

    if (!email || !password || !full_name || !business_name) {
      return Response.json(
        { error: 'Missing required fields: email, password, full_name, business_name' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, business_name, business_type: business_type || 'other' },
    });

    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    const { data: org, error: insertOrgError } = await supabase
      .from('organizations')
      .insert({ name: business_name, slug: business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36) })
      .select('id')
      .single();

    if (org) {
      await supabase.from('organization_members').insert({
        org_id: org.id,
        user_id: userId,
        role: 'owner',
      });

      await supabase.from('business_profiles').insert({
        org_id: org.id,
        business_type: business_type || 'other',
      });

      const buckets = [
        { org_id: org.id, type: 'operations', name: 'Operations', target_pct: 45, display_order: 1 },
        { org_id: org.id, type: 'obligations', name: 'Obligations', target_pct: 25, display_order: 2 },
        { org_id: org.id, type: 'profit_reserve', name: 'Profit Reserve', target_pct: 10, display_order: 3 },
        { org_id: org.id, type: 'owner_salary', name: 'Owner Salary', target_pct: 15, display_order: 4 },
        { org_id: org.id, type: 'growth', name: 'Growth', target_pct: 5, display_order: 5 },
      ];
      await supabase.from('buckets').insert(buckets);

      await supabase.from('user_settings').insert({ user_id: userId });
    }

    const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    return Response.json({
      success: true,
      user: { id: userId, email },
      organization: org ? { id: org.id, name: business_name } : null,
      message: 'Account created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
