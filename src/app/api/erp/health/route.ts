import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { ERPClient } from '@/lib/erp/client';
import { normalizeErpOrigin, resolveErpContext } from '@/lib/erp/config';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.org) return Response.json({ error: 'No organization' }, { status: 403 });

    let baseUrl = normalizeErpOrigin(process.env.ERP_ORIGIN || process.env.ERP_BASE_URL);
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const erp = await resolveErpContext(supabase, ctx.org.id);
        baseUrl = erp.baseUrl;
      } catch {
        /* env-only origin */
      }
    }

    const ping = new ERPClient({
      baseUrl,
      authMethod: 'api_key',
      apiKey: '_',
    });
    const health = await ping.checkHealth();
    return Response.json(health);
  } catch (error) {
    return handleAuthError(error);
  }
}
