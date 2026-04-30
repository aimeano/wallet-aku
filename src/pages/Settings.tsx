import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { useCurrency, CURRENCIES, CurrencyCode } from "@/contexts/CurrencyContext";
import { useCycle } from "@/contexts/CycleContext";
import { Check, Loader2 } from "lucide-react";
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
    </AppShell>
  );
};

export default Settings;
