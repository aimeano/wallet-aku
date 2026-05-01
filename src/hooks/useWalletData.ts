import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Category {
  id: string;
  name: string;
  monthly_limit: number | null;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category_id: string | null;
  source: string | null;
  date: string;
  note: string | null;
  created_at: string;
}

export type Frequency = "daily" | "weekly" | "monthly" | "custom";

export interface Recurring {
  id: string;
  name: string;
  type: "income" | "expense";
  amount: number;
  category_id: string | null;
  source: string | null;
  note: string | null;
  frequency: Frequency;
  interval_days: number | null;
  next_date: string;
  active: boolean;
}

export const useCategories = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["categories", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []).map((c) => ({
        ...c,
        monthly_limit: c.monthly_limit ? Number(c.monthly_limit) : null,
      }));
    },
  });
};

export const useTransactions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((t) => ({
        ...t,
        type: t.type as "income" | "expense",
        amount: Number(t.amount),
      }));
    },
  });
};

export const useRecurring = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recurring", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Recurring[]> => {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .select("*")
        .order("next_date", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        type: r.type as "income" | "expense",
        frequency: r.frequency as Frequency,
        amount: Number(r.amount),
      }));
    },
  });
};

/** Compute next date given current next_date, frequency, and optional custom interval */
export const advanceDate = (iso: string, freq: Frequency, intervalDays: number | null): string => {
  const d = new Date(iso + "T00:00:00");
  switch (freq) {
    case "daily": d.setDate(d.getDate() + 1); break;
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "custom": d.setDate(d.getDate() + Math.max(1, intervalDays ?? 1)); break;
  }
  return d.toISOString().slice(0, 10);
};
