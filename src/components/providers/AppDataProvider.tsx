"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  mockAccounts,
  mockBuckets,
  mockBusiness,
  mockInsights,
  mockMetrics,
  mockObligations,
  mockOwnerWithdrawals,
  mockScore,
  mockTransactions,
} from "@/lib/mock-data";
import { useAuth } from "./AuthProvider";
import type {
  AIInsight,
  BankAccount,
  Bucket,
  Business,
  DisciplineScore,
  Obligation,
  OwnerWithdrawal,
  Transaction,
} from "@/types/app";

interface AppDataContextValue {
  business: Business;
  buckets: Bucket[];
  transactions: Transaction[];
  obligations: Obligation[];
  insights: AIInsight[];
  score: DisciplineScore;
  accounts: BankAccount[];
  withdrawals: OwnerWithdrawal[];
  metrics: typeof mockMetrics;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addTransaction: (txn: Transaction) => void;
  updateBusiness: (patch: Partial<Business>) => void;
  addWithdrawal: (w: OwnerWithdrawal) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { session, isAuthenticated } = useAuth();
  const [business, setBusiness] = useState<Business>(mockBusiness);
  const [buckets, setBuckets] = useState<Bucket[]>(mockBuckets);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [obligations, setObligations] = useState<Obligation[]>(mockObligations);
  const [insights, setInsights] = useState<AIInsight[]>(mockInsights);
  const [score, setScore] = useState<DisciplineScore>(mockScore);
  const [accounts, setAccounts] = useState<BankAccount[]>(mockAccounts);
  const [withdrawals, setWithdrawals] = useState<OwnerWithdrawal[]>(mockOwnerWithdrawals);
  const [metrics, setMetrics] = useState(mockMetrics);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        if (res.status === 401) return; // Session expired, handled by auth
        throw new Error("Failed to load dashboard data");
      }

      const data = await res.json();

      // Map API data to frontend types (graceful fallback to mock if API incomplete)
      if (data.metrics) {
        setMetrics({
          currentBalance: data.metrics.current_balance || mockMetrics.currentBalance,
          monthlyRevenue: data.metrics.monthly_revenue || mockMetrics.monthlyRevenue,
          monthlyExpenses: data.metrics.monthly_expenses || mockMetrics.monthlyExpenses,
          reserveHealth: mockMetrics.reserveHealth,
          disciplineScore: data.discipline_score?.score || mockMetrics.disciplineScore,
          pendingObligations: data.metrics.pending_obligations_total || mockMetrics.pendingObligations,
          ownerSalaryGoal: data.metrics.owner_salary_goal || mockMetrics.ownerSalaryGoal,
          ownerTotalWithdrawn: data.metrics.owner_total_withdrawn || mockMetrics.ownerTotalWithdrawn,
          avgDailySales: data.metrics.avg_daily_sales || mockMetrics.avgDailySales,
          cashRunway: data.metrics.cash_runway_days || mockMetrics.cashRunway,
        });
      }

      if (data.buckets?.length > 0) {
        setBuckets(data.buckets.map((b: any) => ({
          id: b.id,
          businessId: b.org_id,
          name: b.type,
          label: b.name,
          balance: Number(b.current_balance_lkr),
          targetPct: Number(b.target_pct),
          color: getBucketColor(b.type),
          icon: getBucketIcon(b.type),
          description: "",
        })));
      }

      if (data.recent_transactions?.length > 0) {
        setTransactions(data.recent_transactions.map((t: any) => ({
          id: t.id,
          businessId: t.org_id,
          amount: Number(t.amount_lkr),
          type: t.direction === "inflow" ? "income" : "expense",
          category: t.category || "other",
          description: t.description_clean || "",
          date: t.occurred_at,
          source: t.source,
        })));
      }

      if (data.upcoming_payments?.length > 0) {
        setObligations(data.upcoming_payments.map((o: any) => ({
          id: o.id,
          businessId: o.org_id,
          name: o.counterparty_alias || o.category,
          amount: Number(o.amount_lkr),
          dueDate: o.due_date,
          priority: (o.priority || "medium").toUpperCase(),
          status: o.status === "paid" ? "paid" : o.status === "overdue" ? "overdue" : "pending",
          category: o.category,
          recurring: !!o.recurrence,
        })));
      }

      if (data.ai_insights?.length > 0) {
        setInsights(data.ai_insights.map((i: any) => ({
          id: i.id,
          businessId: i.org_id,
          message: i.title,
          detail: i.body,
          severity: i.severity || "info",
          category: i.category || "other",
          createdAt: i.generated_at,
        })));
      }

      if (data.discipline_score) {
        setScore({
          id: data.discipline_score.id,
          businessId: data.discipline_score.org_id,
          overall: data.discipline_score.score,
          paymentTimeliness: data.discipline_score.components?.payment_timeliness || 0,
          reserveConsistency: data.discipline_score.components?.reserve_consistency || 0,
          salaryStability: data.discipline_score.components?.owner_salary_stability || 0,
          personalLeakage: data.discipline_score.components?.leakage_penalty || 0,
          loanReadiness: 0,
          computedAt: data.discipline_score.snapshot_date,
        });
      }

      if (data.accounts?.length > 0) {
        setAccounts(data.accounts.map((a: any) => ({
          id: a.id,
          bank: a.bank_name || "Bank",
          alias: a.name,
          last4: a.account_mask || "****",
          type: "current",
          balance: Number(a.current_balance),
          currency: "LKR" as const,
        })));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated, fetchDashboard]);

  const addTransaction = useCallback((txn: Transaction) => {
    setTransactions((prev) => [txn, ...prev]);
  }, []);

  const updateBusiness = useCallback((patch: Partial<Business>) => {
    setBusiness((prev) => ({ ...prev, ...patch }));
  }, []);

  const addWithdrawal = useCallback((w: OwnerWithdrawal) => {
    setWithdrawals((prev) => [w, ...prev]);
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      business,
      buckets,
      transactions,
      obligations,
      insights,
      score,
      accounts,
      withdrawals,
      metrics,
      isLoading,
      error,
      refresh: fetchDashboard,
      addTransaction,
      updateBusiness,
      addWithdrawal,
    }),
    [business, buckets, transactions, obligations, insights, score, accounts, withdrawals, metrics, isLoading, error, fetchDashboard, addTransaction, updateBusiness, addWithdrawal],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

function getBucketColor(type: string): string {
  const colors: Record<string, string> = {
    operations: "#3b82f6",
    obligations: "#ef4444",
    profit_reserve: "#10b981",
    owner_salary: "#f59e0b",
    growth: "#8b5cf6",
  };
  return colors[type] || "#6b7280";
}

function getBucketIcon(type: string): string {
  const icons: Record<string, string> = {
    operations: "briefcase",
    obligations: "calendar",
    profit_reserve: "shield",
    owner_salary: "user",
    growth: "trending-up",
  };
  return icons[type] || "circle";
}
