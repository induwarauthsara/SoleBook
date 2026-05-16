"use client";

import {
  createContext,
  useCallback,
  useContext,
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
  addTransaction: (txn: Transaction) => void;
  updateBusiness: (patch: Partial<Business>) => void;
  addWithdrawal: (w: OwnerWithdrawal) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

/**
 * In-memory app data store. Backed by the mock-data module and
 * extended through `addTransaction` etc. so screens can demonstrate
 * "what happens when I add a record" without persistence.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business>(mockBusiness);
  const [transactions, setTransactions] =
    useState<Transaction[]>(mockTransactions);
  const [withdrawals, setWithdrawals] =
    useState<OwnerWithdrawal[]>(mockOwnerWithdrawals);

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
      buckets: mockBuckets,
      transactions,
      obligations: mockObligations,
      insights: mockInsights,
      score: mockScore,
      accounts: mockAccounts,
      withdrawals,
      metrics: mockMetrics,
      addTransaction,
      updateBusiness,
      addWithdrawal,
    }),
    [business, transactions, withdrawals, addTransaction, updateBusiness, addWithdrawal],
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
