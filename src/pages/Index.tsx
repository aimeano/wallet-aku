import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories, useTransactions, Transaction } from "@/hooks/useWalletData";
import { AppShell } from "@/components/AppShell";
import { BalanceCard } from "@/components/BalanceCard";
import { TransactionList } from "@/components/TransactionList";
import { BudgetProgress } from "@/components/BudgetProgress";
import { AddTransactionSheet } from "@/components/AddTransactionSheet";
import { Button } from "@/components/ui/button";
import { Plus, Minus, TrendingUp, Loader2 } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useCurrency } from "@/contexts/CurrencyContext";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { data: categories = [], isLoading: cl } = useCategories();
  const { data: transactions = [], isLoading: tl } = useTransactions();
  const { format: formatCurrency } = useCurrency();

  const [sheet, setSheet] = useState<"income" | "expense" | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const stats = useMemo(() => {
    const now = new Date();
    const m = now.getMonth(), y = now.getFullYear();
    let income = 0, expenses = 0, totalIncome = 0, totalExpenses = 0;
    const byCat = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "income") totalIncome += t.amount;
      else totalExpenses += t.amount;
      const d = new Date(t.date + "T00:00:00");
      if (d.getMonth() === m && d.getFullYear() === y) {
        if (t.type === "income") income += t.amount;
        else {
          expenses += t.amount;
          if (t.category_id) byCat.set(t.category_id, (byCat.get(t.category_id) || 0) + t.amount);
        }
      }
    }
    let topCatId: string | null = null, topAmt = 0;
    byCat.forEach((amt, id) => { if (amt > topAmt) { topAmt = amt; topCatId = id; } });
    const topCat = topCatId ? categories.find((c) => c.id === topCatId) : null;
    return { balance: totalIncome - totalExpenses, income, expenses, topCat, topAmt };
  }, [transactions, categories]);

  if (loading || cl || tl) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <AppShell>
      <header className="mb-5 flex items-center justify-between animate-fade-in">
        <div>
          <p className="text-xs text-muted-foreground">{greeting}</p>
          <h1 className="text-lg font-semibold">{user.email?.split("@")[0]}</h1>
        </div>
      </header>

      <BalanceCard balance={stats.balance} income={stats.income} expenses={stats.expenses} />

      <div className="mt-4 grid grid-cols-2 gap-3 animate-slide-up">
        <Button
          onClick={() => setSheet("income")}
          className="h-14 rounded-2xl bg-gradient-income text-base font-semibold text-income-foreground shadow-income hover:opacity-90"
        >
          <Plus className="mr-1 h-5 w-5" /> Add Money
        </Button>
        <Button
          onClick={() => setSheet("expense")}
          className="h-14 rounded-2xl bg-gradient-expense text-base font-semibold text-expense-foreground shadow-expense hover:opacity-90"
        >
          <Minus className="mr-1 h-5 w-5" /> Spend
        </Button>
      </div>

      {stats.topCat && (
        <section className="mt-6 animate-slide-up">
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-gradient-card p-4 shadow-card">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: `color-mix(in hsl, ${stats.topCat.color} 22%, transparent)`, color: stats.topCat.color }}
            >
              <CategoryIcon name={stats.topCat.icon} className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Top spending this month
              </p>
              <p className="text-sm font-semibold">{stats.topCat.name}</p>
            </div>
            <p className="text-base font-bold text-expense">{formatCurrency(stats.topAmt)}</p>
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Budgets</h2>
        <BudgetProgress categories={categories} transactions={transactions} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Recent activity</h2>
        <TransactionList
          transactions={transactions.slice(0, 8)}
          categories={categories}
          onSelect={setEditing}
          empty={<p className="text-sm text-muted-foreground">Nothing yet — add your first transaction above.</p>}
        />
      </section>

      <AddTransactionSheet open={sheet !== null} onOpenChange={(v) => !v && setSheet(null)} type={sheet ?? "expense"} />
      <AddTransactionSheet
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        type={editing?.type ?? "expense"}
        transaction={editing}
      />
    </AppShell>
  );
};

export default Dashboard;
