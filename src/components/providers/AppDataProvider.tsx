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
  emptyBusiness,
  emptyDashboardMetrics,
  emptyDisciplineScore,
  mockMetrics,
} from "@/lib/mock-data";
import { messageFromApiBody, readJsonSafe } from "@/lib/api-error";
import { mapApiRowToObligation } from "@/lib/map-obligation";
import { useAuth } from "./AuthProvider";
import type {
  AIInsight,
  BankAccount,
  Bucket,
  Business,
  BusinessType,
  DisciplineScore,
  Obligation,
  OwnerWithdrawal,
  Transaction,
} from "@/types/app";

export type CashRunwayForecastPoint = {
  date: string;
  projectedBalance: number;
  riskLevel: string;
};

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
  cashFlowForecast: CashRunwayForecastPoint[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addTransaction: (txn: Transaction) => void;
  updateBusiness: (patch: Partial<Business>) => void;
  addWithdrawal: (w: OwnerWithdrawal) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function finiteNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseCashRunwayDays(raw: unknown): number | null {
  /* Intentionally null JSON = no measurable daily burn / infinite runway. */
  if (raw === null) return null;
  /* Legacy sentinel when avg daily outflow was zero */
  const n =
    typeof raw === "number" ? raw : raw === undefined ? NaN : Number(raw);
  if (!Number.isFinite(n)) return 0;
  if (n === 999) return null;
  return n;
}

function mapDbBusinessType(raw: unknown): BusinessType {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const allowed: BusinessType[] = [
    "retail",
    "restaurant",
    "services",
    "wholesale",
    "online",
    "freelancer",
    "other",
  ];
  return (allowed.includes(s as BusinessType) ? s : "other") as BusinessType;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { session, isAuthenticated, user } = useAuth();
  const [business, setBusiness] = useState<Business>(emptyBusiness);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [score, setScore] = useState<DisciplineScore>(emptyDisciplineScore);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<OwnerWithdrawal[]>([]);
  const [metrics, setMetrics] = useState(emptyDashboardMetrics);
  const [cashFlowForecast, setCashFlowForecast] = useState<CashRunwayForecastPoint[]>([]);
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

      const data = await readJsonSafe(res);

      if (!res.ok) {
        if (res.status === 401) return; // Session expired, handled by auth
        throw new Error(
          messageFromApiBody(data, `Failed to load dashboard data (${res.status})`),
        );
      }

      const payload =
        data && typeof data === "object" ? (data as Record<string, unknown>) : {};

      const org = payload.organization as { id?: string; name?: string } | undefined;
      const bp = payload.business_profile as Record<string, unknown> | null | undefined;

      if (org?.id) {
        setBusiness({
          id: org.id,
          ownerId: user?.id ?? "",
          name: org.name ?? "",
          type: mapDbBusinessType(bp?.business_type),
          salaryGoal: finiteNum(bp?.target_owner_salary_lkr),
          createdAt: typeof bp?.created_at === "string" ? bp.created_at : "",
        });
      }

      if (payload.metrics) {
        const m = payload.metrics as Record<string, unknown>;
        const disc = payload.discipline_score as { score?: number } | undefined;
        const discScore = finiteNum(disc?.score);
        setMetrics({
          currentBalance: finiteNum(m.current_balance),
          monthlyRevenue: finiteNum(m.monthly_revenue),
          monthlyExpenses: finiteNum(m.monthly_expenses),
          reserveHealth: finiteNum(m.reserve_health),
          disciplineScore: discScore,
          pendingObligations: finiteNum(m.pending_obligations_total),
          ownerSalaryGoal: finiteNum(m.owner_salary_goal),
          ownerTotalWithdrawn: finiteNum(m.owner_total_withdrawn),
          avgDailySales: finiteNum(m.avg_daily_sales),
          cashRunway: parseCashRunwayDays(m.cash_runway_days),
        });
      }

      const withdrawalsPayload = payload.owner_withdrawals as unknown[] | undefined;
      if (Array.isArray(withdrawalsPayload)) {
        const bid = org?.id ?? "";
        setWithdrawals(
          withdrawalsPayload.map((w: any) => ({
            id: String(w.id),
            businessId: bid,
            amount: finiteNum(w.amount_lkr),
            date: typeof w.withdrawn_at === "string" ? w.withdrawn_at : "",
            note: typeof w.notes === "string" ? w.notes : undefined,
          })),
        );
      }

      const forecastPayload = payload.cash_flow_forecast as unknown[] | undefined;
      if (Array.isArray(forecastPayload)) {
        setCashFlowForecast(
          forecastPayload.map((p: any) => ({
            date: String(p.date ?? ""),
            projectedBalance: finiteNum(p.projectedBalance),
            riskLevel: typeof p.riskLevel === "string" ? p.riskLevel : "",
          })),
        );
      }

      const bucketsPayload = payload.buckets as unknown[] | undefined;
      if (Array.isArray(bucketsPayload)) {
        setBuckets(
          bucketsPayload.map((b: any) => ({
            id: b.id,
            businessId: b.org_id,
            name: b.type,
            label: b.name,
            balance: Number(b.current_balance_lkr),
            targetPct: Number(b.target_pct),
            color: getBucketColor(b.type),
            icon: getBucketIcon(b.type),
            description: "",
          })),
        );
      }

      const recentTx = payload.recent_transactions as unknown[] | undefined;
      if (Array.isArray(recentTx)) {
        setTransactions(
          recentTx.map((t: any) => ({
            id: t.id,
            businessId: t.org_id,
            amount: Number(t.amount_lkr),
            type: t.direction === "inflow" ? "income" : "expense",
            category: t.category || "other",
            description: t.description_clean || "",
            date: t.occurred_at,
            source: t.source,
          })),
        );
      }

      const upcoming = payload.upcoming_payments as unknown[] | undefined;
      if (Array.isArray(upcoming)) {
        setObligations(
          upcoming.map((o: unknown) =>
            mapApiRowToObligation(o as Record<string, unknown>),
          ),
        );
      }

      const aiInsights = payload.ai_insights as unknown[] | undefined;
      if (Array.isArray(aiInsights)) {
        setInsights(
          aiInsights.map((i: any) => ({
            id: i.id,
            businessId: i.org_id,
            message: i.title,
            detail: i.body,
            severity: i.severity || "info",
            category: i.category || "other",
            createdAt: i.generated_at,
          })),
        );
      }

      const disciplinePayload = payload.discipline_score as {
        id: string;
        org_id: string;
        score: number;
        snapshot_date?: string;
        components?: {
          payment_timeliness?: number;
          on_time_payments?: number;
          reserve_consistency?: number;
          owner_salary_stability?: number;
          leakage_penalty?: number;
          cash_flow_health?: number;
        };
      } | null | undefined;
      if (disciplinePayload) {
        const d = disciplinePayload;
        const c = d.components;
        setScore({
          id: d.id,
          businessId: d.org_id,
          overall: d.score,
          paymentTimeliness: c?.payment_timeliness ?? c?.on_time_payments ?? 0,
          reserveConsistency: c?.reserve_consistency ?? 0,
          salaryStability: c?.owner_salary_stability ?? 0,
          personalLeakage: c?.leakage_penalty ?? 0,
          loanReadiness: c?.cash_flow_health ?? 0,
          computedAt: d.snapshot_date ?? "",
        });
      } else {
        setScore(emptyDisciplineScore);
      }

      const accountsPayload = payload.accounts as unknown[] | undefined;
      if (Array.isArray(accountsPayload)) {
        setAccounts(
          accountsPayload.map((a: any) => ({
            id: a.id,
            bank: a.bank_name || "Bank",
            alias: a.name,
            last4: a.account_mask || "****",
            type: "current",
            balance: Number(a.current_balance),
            currency: "LKR" as const,
          })),
        );
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, user?.id]);

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
      cashFlowForecast,
      isLoading,
      error,
      refresh: fetchDashboard,
      addTransaction,
      updateBusiness,
      addWithdrawal,
    }),
    [
      business,
      buckets,
      transactions,
      obligations,
      insights,
      score,
      accounts,
      withdrawals,
      metrics,
      cashFlowForecast,
      isLoading,
      error,
      fetchDashboard,
      addTransaction,
      updateBusiness,
      addWithdrawal,
    ],
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
