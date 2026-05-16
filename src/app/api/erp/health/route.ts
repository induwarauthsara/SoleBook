import { NextRequest } from 'next/server';
import { requireAuth, handleAuthError } from '@/lib/auth/middleware';
import { erpClient } from '@/lib/erp/client';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const health = await erpClient.checkHealth();
    return Response.json(health);
  } catch (error) {
    return handleAuthError(error);
  }
}
