import { Category, Transaction } from "@/hooks/useWalletData";
import { CategoryIcon } from "./CategoryIcon";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Props {
  categories: Category[];
  transactions: Transaction[];
}

export const BudgetProgress = ({ categories, transactions }: Props) => {
  const { format: formatCurrency } = useCurrency();
  const budgeted = categories.filter((c) => c.monthly_limit && c.monthly_limit > 0);

  if (budgeted.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-border bg-card/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No budgets set yet. Tap a category to add a monthly limit.
        </p>
      </div>
    );
  }

  const spentByCat = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense" || !t.category_id) continue;
    spentByCat.set(t.category_id, (spentByCat.get(t.category_id) || 0) + t.amount);
  }

  return (
    <div className="space-y-3">
      {budgeted.map((c) => {
        const spent = spentByCat.get(c.id) || 0;
        const limit = c.monthly_limit!;
        const pct = Math.min(100, (spent / limit) * 100);
        const over = spent > limit;
        const near = pct >= 80 && !over;
        const barColor = over ? "hsl(var(--expense))" : near ? "hsl(var(--warning))" : "hsl(var(--income))";
        const remaining = limit - spent;

        return (
          <div key={c.id} className="rounded-2xl border border-border/60 bg-gradient-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in hsl, ${c.color} 18%, transparent)`, color: c.color }}
              >
                <CategoryIcon name={c.icon} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatCurrency(spent)} / {formatCurrency(limit)}
                  </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-smooth"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] font-medium" style={{ color: barColor }}>
                  {over
                    ? `Over by ${formatCurrency(spent - limit)}`
                    : `${formatCurrency(remaining)} left`}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
