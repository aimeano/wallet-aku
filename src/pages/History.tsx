import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories, useTransactions } from "@/hooks/useWalletData";
import { AppShell } from "@/components/AppShell";
import { TransactionList } from "@/components/TransactionList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const History = () => {
  const { user, loading } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: transactions = [], isLoading } = useTransactions();
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [catId, setCatId] = useState<string>("all");
  const [range, setRange] = useState<"all" | "30" | "7" | "month">("all");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (catId !== "all" && t.category_id !== catId) return false;
      if (range !== "all") {
        const d = new Date(t.date + "T00:00:00");
        const today = new Date();
        if (range === "month") {
          if (d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear()) return false;
        } else {
          const days = parseInt(range);
          const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
          if (d < cutoff) return false;
        }
      }
      return true;
    });
  }, [transactions, type, catId, range]);

  if (loading || isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-bold">History</h1>

      <div className="mb-4 flex gap-2">
        {(["all", "income", "expense"] as const).map((t) => (
          <Button
            key={t}
            variant={type === t ? "default" : "secondary"}
            size="sm"
            onClick={() => setType(t)}
            className={`flex-1 rounded-full capitalize ${type === t ? "bg-primary text-primary-foreground" : ""}`}
          >
            {t}
          </Button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Select value={catId} onValueChange={setCatId}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={(v) => setRange(v as any)}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">{filtered.length} transactions</p>
      <TransactionList transactions={filtered} categories={categories} />
    </AppShell>
  );
};

export default History;
