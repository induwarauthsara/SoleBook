import { NextRequest } from 'next/server';
import { fetchPrimaryOrgMembership } from '@/lib/auth/org-membership';
import { getSupabaseAdmin } from '@/lib/supabase';

export interface AuthContext {
  user: { id: string; email: string };
  org: { id: string; name: string; role: string } | null;
}

export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid authorization header', 401);
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new AuthError('Server configuration error', 500);
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new AuthError('Invalid or expired token', 401);
  }

  const membership = await fetchPrimaryOrgMembership(supabase, user.id);

  const org = membership
    ? { id: membership.org_id, name: membership.organizations?.name || '', role: membership.role }
    : null;

  return {
    user: { id: user.id, email: user.email || '' },
    org,
  };
}

export async function requireRole(req: NextRequest, roles: string[]): Promise<AuthContext> {
  const ctx = await requireAuth(req);
  if (!ctx.org) {
    throw new AuthError('No organization membership found', 403);
  }
  if (!roles.includes(ctx.org.role)) {
    throw new AuthError(`Insufficient permissions. Required: ${roles.join(', ')}`, 403);
  }
  return ctx;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error('[handleAuthError]', error);
  const exposeDetails =
    process.env.NODE_ENV === 'development' && error instanceof Error;
  const message = exposeDetails ? error.message : 'Internal server error';
  return Response.json({ error: message }, { status: 500 });
}
