import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { useCurrency, CURRENCIES, CurrencyCode } from "@/contexts/CurrencyContext";
import { useCycle } from "@/contexts/CycleContext";
import { Check, ChevronRight, Loader2, Repeat } from "lucide-react";
import { toast } from "sonner";

const PRESETS = [
  { day: 1, label: "1st of month" },
  { day: 15, label: "15th (mid-month)" },
  { day: 25, label: "25th (payday)" },
];

const Settings = () => {
  const { user, loading } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { resetDay, setResetDay, formatRange } = useCycle();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const handleSelect = (code: CurrencyCode) => {
    if (code === currency.code) return;
    setCurrency(code);
    toast.success(`Currency set to ${CURRENCIES[code].name}`);
  };

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">Settings</h1>
      <p className="mb-6 text-sm text-muted-foreground">Personalize how Pocket displays your money.</p>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Currency</h2>
        <div className="space-y-2">
          {(Object.values(CURRENCIES)).map((c) => {
            const active = currency.code === c.code;
            return (
              <button
                key={c.code}
                onClick={() => handleSelect(c.code)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-smooth ${
                  active
                    ? "border-primary bg-primary/10 shadow-card"
                    : "border-border/60 bg-gradient-card hover:border-border hover:translate-y-[-1px]"
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                    active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}
                >
                  {c.symbol}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.code}</p>
                </div>
                {active && <Check className="h-5 w-5 text-primary" />}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Note: Changing currency only updates the symbol. Amounts are not converted.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reset cycle day</h2>
        <p className="mb-3 text-xs text-muted-foreground">Current cycle: {formatRange()}</p>

        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const active = resetDay === p.day;
            return (
              <button
                key={p.day}
                onClick={() => { setResetDay(p.day); toast.success(`Reset day set to ${p.day}`); }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth ${
                  active ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-card/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border/60 bg-gradient-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Custom day</p>
              <p className="text-xs text-muted-foreground">Choose any day from 1 to 28</p>
            </div>
            <p className="text-2xl font-bold tabular-nums">{resetDay}</p>
          </div>
          <input
            type="range"
            min={1}
            max={28}
            value={resetDay}
            onChange={(e) => setResetDay(parseInt(e.target.value, 10))}
            className="mt-3 w-full accent-primary"
          />
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Cycle resets on day {resetDay} each month. Months with fewer days are capped at 28 to stay consistent.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Automation</h2>
        <Link
          to="/recurring"
          className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-gradient-card p-4 text-left shadow-card transition-smooth hover:border-border hover:translate-y-[-1px]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Repeat className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Recurring transactions</p>
            <p className="text-xs text-muted-foreground">Manage scheduled income & expenses</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </section>
    </AppShell>
  );
};

export default Settings;
