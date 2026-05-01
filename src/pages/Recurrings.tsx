import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories, useRecurring, Recurring } from "@/hooks/useWalletData";
import { AppShell } from "@/components/AppShell";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Loader2, ChevronLeft, Repeat, Power, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { friendlyDate } from "@/lib/format";

const Recurrings = () => {
  const { user, loading } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: recurring = [], isLoading } = useRecurring();
  const { format: formatCurrency } = useCurrency();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  if (loading || isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const catMap = new Map(categories.map((c) => [c.id, c]));

  const toggle = async (r: Recurring) => {
    setBusy(r.id);
    const { error } = await supabase.from("recurring_transactions").update({ active: !r.active }).eq("id", r.id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["recurring"] });
    toast.success(r.active ? "Paused" : "Resumed");
  };

  const remove = async (r: Recurring) => {
    if (!confirm(`Delete recurring "${r.name}"? Existing transactions are kept.`)) return;
    const { error } = await supabase.from("recurring_transactions").delete().eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["recurring"] });
    toast.success("Recurring deleted");
  };

  return (
    <AppShell>
      <Link to="/settings" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Settings
      </Link>
      <h1 className="mb-1 text-2xl font-bold">Recurring</h1>
      <p className="mb-6 text-sm text-muted-foreground">Manage your scheduled income and expenses.</p>

      {recurring.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/50 p-8 text-center">
          <Repeat className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No recurring transactions yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Toggle "Make it recurring" when adding a transaction.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {recurring.map((r) => {
            const cat = r.category_id ? catMap.get(r.category_id) : null;
            const isIncome = r.type === "income";
            const tint = isIncome ? "hsl(var(--income))" : (cat?.color || "hsl(var(--muted-foreground))");
            const iconName = isIncome ? "ArrowDownLeft" : (cat?.icon || "Repeat");

            return (
              <li
                key={r.id}
                className={`flex items-center gap-3 rounded-2xl border border-border/60 bg-gradient-card p-3 shadow-card ${!r.active ? "opacity-60" : ""}`}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `color-mix(in hsl, ${tint} 18%, transparent)`, color: tint }}
                >
                  <CategoryIcon name={iconName} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Next: {friendlyDate(r.next_date)} · {r.frequency}
                    {r.frequency === "custom" && r.interval_days ? ` (${r.interval_days}d)` : ""}
                  </p>
                </div>
                <span className={`text-sm font-bold tabular-nums ${isIncome ? "text-income" : "text-expense"}`}>
                  {isIncome ? "+" : "-"}{formatCurrency(r.amount).replace("-", "")}
                </span>
                <button
                  onClick={() => toggle(r)}
                  disabled={busy === r.id}
                  aria-label={r.active ? "Pause" : "Resume"}
                  className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Power className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(r)}
                  aria-label="Delete recurring"
                  className="rounded-full p-2 text-expense hover:bg-expense/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
};

export default Recurrings;
