import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories, useTransactions, Transaction } from "@/hooks/useWalletData";
import { AppShell } from "@/components/AppShell";
import { TransactionList } from "@/components/TransactionList";
import { AddTransactionSheet } from "@/components/AddTransactionSheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { useCycle } from "@/contexts/CycleContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDeleteTransactionWithUndo } from "@/hooks/useDeleteTransactionWithUndo";

type RangeKey = "all" | "30" | "7" | "month" | "cycle" | "custom";

const History = () => {
  const { user, loading } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: transactions = [], isLoading } = useTransactions();
  const { isInCurrentCycle } = useCycle();
  const { currency } = useCurrency();
  const deleteTx = useDeleteTransactionWithUndo();

  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [catId, setCatId] = useState<string>("all");
  const [range, setRange] = useState<RangeKey>("all");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Advanced
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [editing, setEditing] = useState<Transaction | null>(null);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minAmt ? parseFloat(minAmt) : null;
    const max = maxAmt ? parseFloat(maxAmt) : null;
    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59") : null;

    return transactions.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (catId !== "all" && t.category_id !== catId) return false;
      if (min !== null && t.amount < min) return false;
      if (max !== null && t.amount > max) return false;

      if (range !== "all" && range !== "custom") {
        if (range === "cycle") {
          if (!isInCurrentCycle(t.date)) return false;
        } else {
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
      }
      if (range === "custom") {
        const d = new Date(t.date + "T00:00:00");
        if (from && d < from) return false;
        if (to && d > to) return false;
      }

      if (q) {
        const cat = t.category_id ? catMap.get(t.category_id) : null;
        const haystack = [
          t.note ?? "",
          t.source ?? "",
          cat?.name ?? "",
          t.type,
        ].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [transactions, type, catId, range, query, minAmt, maxAmt, fromDate, toDate, isInCurrentCycle, catMap]);

  if (loading || isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const rangeLabel: Record<RangeKey, string> = {
    all: "All time",
    cycle: "This cycle",
    month: "This month",
    "30": "Last 30 days",
    "7": "Last 7 days",
    custom: fromDate || toDate ? `${fromDate || "…"} → ${toDate || "…"}` : "Custom range",
  };

  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (type !== "all") activeChips.push({ key: "type", label: type, clear: () => setType("all") });
  if (catId !== "all") activeChips.push({ key: "cat", label: catMap.get(catId)?.name ?? "Category", clear: () => setCatId("all") });
  if (range !== "all") activeChips.push({ key: "range", label: rangeLabel[range], clear: () => { setRange("all"); setFromDate(""); setToDate(""); } });
  if (minAmt) activeChips.push({ key: "min", label: `≥ ${currency.symbol}${minAmt}`, clear: () => setMinAmt("") });
  if (maxAmt) activeChips.push({ key: "max", label: `≤ ${currency.symbol}${maxAmt}`, clear: () => setMaxAmt("") });
  if (query.trim()) activeChips.push({ key: "q", label: `"${query.trim()}"`, clear: () => setQuery("") });

  const clearAll = () => {
    setType("all"); setCatId("all"); setRange("all");
    setMinAmt(""); setMaxAmt(""); setFromDate(""); setToDate("");
    setQuery("");
  };

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-bold">History</h1>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes, category, source…"
          className="rounded-2xl pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Type tabs + Filters button */}
      <div className="mb-3 flex gap-2">
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
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setFiltersOpen(true)}
          className="rounded-full"
          aria-label="Open filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {activeChips.map((c) => (
            <span
              key={c.key}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-medium capitalize"
            >
              {c.label}
              <button onClick={c.clear} aria-label={`Clear ${c.key}`} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="ml-1 rounded-full px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10"
          >
            Clear all
          </button>
        </div>
      )}

      <p className="mb-3 text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "transaction" : "transactions"} · tap to edit · swipe to delete
      </p>

      <TransactionList
        transactions={filtered}
        categories={categories}
        onSelect={setEditing}
        onDelete={(t) => deleteTx({ ...t, user_id: user.id })}
      />

      <AddTransactionSheet
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        type={editing?.type ?? "expense"}
        transaction={editing}
      />

      {/* Filters sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="rounded-t-[2rem] border-border bg-card max-h-[92vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-5">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
              <Select value={catId} onValueChange={setCatId}>
                <SelectTrigger className="mt-2 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date range</Label>
              <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
                <SelectTrigger className="mt-2 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="cycle">This cycle</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="custom">Custom…</SelectItem>
                </SelectContent>
              </Select>
              {range === "custom" && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="from" className="text-[11px] text-muted-foreground">From</Label>
                    <Input id="from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="to" className="text-[11px] text-muted-foreground">To</Label>
                    <Input id="to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount range</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency.symbol}</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Min"
                    value={minAmt}
                    onChange={(e) => setMinAmt(e.target.value)}
                    className="pl-7"
                  />
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency.symbol}</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Max"
                    value={maxAmt}
                    onChange={(e) => setMaxAmt(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={clearAll} className="flex-1 rounded-2xl">Clear filters</Button>
              <Button onClick={() => setFiltersOpen(false)} className="flex-1 rounded-2xl bg-primary text-primary-foreground">
                Apply
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
};

export default History;
