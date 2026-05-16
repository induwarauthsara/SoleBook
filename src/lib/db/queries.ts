import { getSupabaseAdmin } from '@/lib/supabase';

function getDb() {
  const db = getSupabaseAdmin();
  if (!db) throw new Error('Database not configured');
  return db;
}

// ============ Organizations ============

export async function getOrganizationById(orgId: string) {
  const { data, error } = await getDb()
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();
  if (error) throw error;
  return data;
}

export async function getUserOrganizations(userId: string) {
  const { data, error } = await getDb()
    .from('organization_members')
    .select('org_id, role, organizations(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}

// ============ Business Profiles ============

export async function getBusinessProfile(orgId: string) {
  const { data, error } = await getDb()
    .from('business_profiles')
    .select('*')
    .eq('org_id', orgId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateBusinessProfile(orgId: string, updates: Record<string, any>) {
  const { data, error } = await getDb()
    .from('business_profiles')
    .update(updates)
    .eq('org_id', orgId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============ Accounts ============

export async function getAccounts(orgId: string) {
  const { data, error } = await getDb()
    .from('accounts')
    .select('*')
    .eq('org_id', orgId)
    .order('is_primary', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPrimaryAccount(orgId: string) {
  const { data, error } = await getDb()
    .from('accounts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_primary', true)
    .single();
  if (error) throw error;
  return data;
}

export async function updateAccountBalance(accountId: string, balance: number) {
  const { error } = await getDb()
    .from('accounts')
    .update({ current_balance: balance })
    .eq('id', accountId);
  if (error) throw error;
}

// ============ Transactions ============

export async function insertTransaction(orgId: string, tx: {
  direction: 'inflow' | 'outflow';
  amount_lkr: number;
  occurred_at: string;
  description_clean?: string;
  counterparty_alias?: string;
  category?: string;
  source: 'bank' | 'pos' | 'erp' | 'manual';
  account_id?: string;
  raw_id?: string;
}) {
  const { data, error } = await getDb()
    .from('transactions')
    .insert({ org_id: orgId, ...tx })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTransactions(orgId: string, options: {
  limit?: number;
  offset?: number;
  direction?: string;
  category?: string;
  source?: string;
  from?: string;
  to?: string;
  accountId?: string;
} = {}) {
  let query = getDb()
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId)
    .order('occurred_at', { ascending: false });

  if (options.direction) query = query.eq('direction', options.direction);
  if (options.category) query = query.eq('category', options.category);
  if (options.source) query = query.eq('source', options.source);
  if (options.from) query = query.gte('occurred_at', options.from);
  if (options.to) query = query.lte('occurred_at', options.to);
  if (options.accountId) query = query.eq('account_id', options.accountId);

  const limit = options.limit || 20;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export async function getTransactionsSince(orgId: string, since: string) {
  const { data, error } = await getDb()
    .from('transactions')
    .select('*')
    .eq('org_id', orgId)
    .gte('occurred_at', since)
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ============ Buckets ============

export async function getBuckets(orgId: string) {
  const { data, error } = await getDb()
    .from('buckets')
    .select('*')
    .eq('org_id', orgId)
    .order('display_order');
  if (error) throw error;
  return data || [];
}

export async function updateBucketBalance(bucketId: string, newBalance: number) {
  const { error } = await getDb()
    .from('buckets')
    .update({ current_balance_lkr: newBalance })
    .eq('id', bucketId);
  if (error) throw error;
}

export async function adjustBucketBalance(bucketId: string, delta: number) {
  const { data: bucket } = await getDb()
    .from('buckets')
    .select('current_balance_lkr')
    .eq('id', bucketId)
    .single();

  if (!bucket) throw new Error('Bucket not found');
  const newBalance = Math.max(0, Number(bucket.current_balance_lkr) + delta);
  await updateBucketBalance(bucketId, newBalance);
  return newBalance;
}

// ============ Obligations ============

export async function getObligations(orgId: string, filters: { status?: string; priority?: string; from?: string; to?: string } = {}) {
  let query = getDb()
    .from('obligations')
    .select('*')
    .eq('org_id', orgId)
    .order('due_date', { ascending: true });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.from) query = query.gte('due_date', filters.from);
  if (filters.to) query = query.lte('due_date', filters.to);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getUpcomingObligations(orgId: string, days: number = 30) {
  const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data, error } = await getDb()
    .from('obligations')
    .select('*')
    .eq('org_id', orgId)
    .in('status', ['upcoming', 'due_soon', 'overdue'])
    .lte('due_date', future)
    .order('due_date');
  if (error) throw error;
  return data || [];
}

export async function markObligationPaid(obligationId: string, transactionId: string) {
  const { error } = await getDb()
    .from('obligations')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      paid_transaction_id: transactionId,
    })
    .eq('id', obligationId);
  if (error) throw error;
}

// ============ Owner Withdrawals ============

export async function getMonthlyWithdrawals(orgId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await getDb()
    .from('owner_withdrawals')
    .select('*')
    .eq('org_id', orgId)
    .gte('withdrawn_at', startOfMonth.toISOString());
  if (error) throw error;
  return data || [];
}

export async function insertWithdrawal(orgId: string, withdrawal: {
  amount_lkr: number;
  is_within_salary_plan: boolean;
  recorded_by: string;
  notes?: string;
}) {
  const { data, error } = await getDb()
    .from('owner_withdrawals')
    .insert({
      org_id: orgId,
      withdrawn_at: new Date().toISOString(),
      ...withdrawal,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============ Discipline Scores ============

export async function getLatestDisciplineScore(orgId: string) {
  const { data, error } = await getDb()
    .from('discipline_scores')
    .select('*')
    .eq('org_id', orgId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getDisciplineTrend(orgId: string, days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data, error } = await getDb()
    .from('discipline_scores')
    .select('snapshot_date, score, components')
    .eq('org_id', orgId)
    .gte('snapshot_date', since)
    .order('snapshot_date');
  if (error) throw error;
  return data || [];
}

export async function upsertDisciplineScore(orgId: string, score: number, components: Record<string, number>) {
  const { error } = await getDb()
    .from('discipline_scores')
    .upsert({
      org_id: orgId,
      snapshot_date: new Date().toISOString().split('T')[0],
      score,
      components,
    }, { onConflict: 'org_id,snapshot_date' });
  if (error) throw error;
}

// ============ Insights ============

export async function getRecentInsights(orgId: string, limit: number = 10) {
  const { data, error } = await getDb()
    .from('insights')
    .select('*')
    .eq('org_id', orgId)
    .order('generated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getUnacknowledgedInsights(orgId: string) {
  const { data, error } = await getDb()
    .from('insights')
    .select('*')
    .eq('org_id', orgId)
    .is('acknowledged_at', null)
    .order('generated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function insertInsight(orgId: string, insight: {
  category: string;
  severity: string;
  title: string;
  body: string;
  generated_by: string;
  machine_reason_code?: string;
  payload?: Record<string, any>;
  ai_audit_id?: number;
}) {
  const { data, error } = await getDb()
    .from('insights')
    .insert({ org_id: orgId, ...insight })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============ Notifications ============

export async function getNotifications(orgId: string, userId: string, limit: number = 20) {
  const { data, error } = await getDb()
    .from('notifications')
    .select('*')
    .eq('org_id', orgId)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getUnreadNotificationCount(orgId: string, userId: string) {
  const { count, error } = await getDb()
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .is('read_at', null);
  if (error) throw error;
  return count || 0;
}

export async function insertNotification(notification: {
  org_id: string;
  user_id?: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}) {
  const { data, error } = await getDb()
    .from('notifications')
    .insert(notification)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============ Chat Messages ============

export async function getChatHistory(orgId: string, userId: string, limit: number = 20) {
  const { data, error } = await getDb()
    .from('chat_messages')
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).reverse();
}

export async function insertChatMessage(orgId: string, userId: string, message: {
  role: 'user' | 'assistant';
  content: string;
  context_hash?: string;
  model_id?: string;
}) {
  const { error } = await getDb()
    .from('chat_messages')
    .insert({ org_id: orgId, user_id: userId, ...message });
  if (error) throw error;
}

// ============ User Settings ============

export async function getUserSettings(userId: string) {
  const { data, error } = await getDb()
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || { language: 'en', theme: 'system', notification_prefs: { email: true, push: true, in_app: true } };
}

export async function upsertUserSettings(userId: string, settings: Record<string, any>) {
  const { error } = await getDb()
    .from('user_settings')
    .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' });
  if (error) throw error;
}

// ============ ERP Sync Log ============

export async function getLastSyncStatus(orgId: string) {
  const { data, error } = await getDb()
    .from('erp_sync_log')
    .select('*')
    .eq('org_id', orgId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function insertSyncLog(orgId: string, syncType: string = 'snapshot') {
  const { data, error } = await getDb()
    .from('erp_sync_log')
    .insert({ org_id: orgId, sync_type: syncType, status: 'in_progress' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSyncLog(id: string, updates: Record<string, any>) {
  const { error } = await getDb()
    .from('erp_sync_log')
    .update({ ...updates, completed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ============ Allocations ============

export async function getLatestAllocation(orgId: string) {
  const { data, error } = await getDb()
    .from('allocations')
    .select('*, allocation_lines(*)')
    .eq('org_id', orgId)
    .order('proposed_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getPendingAllocations(orgId: string) {
  const { data, error } = await getDb()
    .from('allocations')
    .select('*, allocation_lines(*)')
    .eq('org_id', orgId)
    .eq('status', 'proposed')
    .order('proposed_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
