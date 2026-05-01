import { useMemo, useState } from "react";
import { Recurring, Category, advanceDate, useRecurring } from "@/hooks/useWalletData";
import { CategoryIcon } from "./CategoryIcon";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Calendar, Check, Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  categories: Category[];
  /** When true, only show items whose next_date is today or earlier (due now). */
  dueOnly?: boolean;
  limit?: number;
}

const formatNext = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 7) return `In ${diff} days`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const UpcomingRecurring = ({ categories, dueOnly = false, limit }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { format: formatCurrency } = useCurrency();
  const { data: recurring = [] } = useRecurring();
  const [confirming, setConfirming] = useState<string | null>(null);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const items = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let list = recurring.filter((r) => r.active);
    if (dueOnly) {
      list = list.filter((r) => new Date(r.next_date + "T00:00:00") <= today);
    }
    return limit ? list.slice(0, limit) : list;
  }, [recurring, dueOnly, limit]);

  if (items.length === 0) return null;

  const confirmRecurring = async (r: Recurring) => {
    if (!user) return;
    setConfirming(r.id);
    // Insert real transaction
    const { error: e1 } = await supabase.from("transactions").insert({
      type: r.type,
      amount: r.amount,
      category_id: r.type === "expense" ? r.category_id : null,
      source: r.type === "income" ? r.source : null,
      date: r.next_date,
      note: r.note ?? r.name,
      user_id: user.id,
    });
    if (e1) { toast.error(e1.message); setConfirming(null); return; }

    // Advance schedule
    const next = advanceDate(r.next_date, r.frequency, r.interval_days);
    const { error: e2 } = await supabase
      .from("recurring_transactions")
      .update({ next_date: next })
      .eq("id", r.id);
    setConfirming(null);
    if (e2) { toast.error(e2.message); return; }

    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["recurring"] });
    toast.success(`${r.name} confirmed`);
  };

  return (
    <ul className="space-y-2">
      {items.map((r) => {
        const cat = r.category_id ? catMap.get(r.category_id) : null;
        const isIncome = r.type === "income";
        const tint = isIncome ? "hsl(var(--income))" : (cat?.color || "hsl(var(--muted-foreground))");
        const iconName = isIncome ? "ArrowDownLeft" : (cat?.icon || "Repeat");
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const due = new Date(r.next_date + "T00:00:00") <= today;

        return (
          <li
            key={r.id}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-gradient-card p-3 shadow-card"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `color-mix(in hsl, ${tint} 18%, transparent)`, color: tint }}
            >
              <CategoryIcon name={iconName} className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold">{r.name}</p>
                <Repeat className="h-3 w-3 text-muted-foreground" />
              </div>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatNext(r.next_date)} · {r.frequency}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-sm font-bold tabular-nums ${isIncome ? "text-income" : "text-expense"}`}>
                {isIncome ? "+" : "-"}{formatCurrency(r.amount).replace("-", "")}
              </span>
              {due && (
                <button
                  onClick={() => confirmRecurring(r)}
                  disabled={confirming === r.id}
                  className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground transition-smooth hover:opacity-90 disabled:opacity-60"
                >
                  {confirming === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Confirm
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};
