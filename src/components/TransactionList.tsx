import { Transaction, Category } from "@/hooks/useWalletData";
import { CategoryIcon } from "./CategoryIcon";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { friendlyDate } from "@/lib/format";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Props {
  transactions: Transaction[];
  categories: Category[];
  empty?: React.ReactNode;
  onSelect?: (t: Transaction) => void;
}

export const TransactionList = ({ transactions, categories, empty, onSelect }: Props) => {
  const { format: formatCurrency } = useCurrency();
  const catMap = new Map(categories.map((c) => [c.id, c]));

  if (transactions.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-card/50 p-8 text-center">
        {empty ?? <p className="text-sm text-muted-foreground">No transactions yet</p>}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {transactions.map((t, i) => {
        const cat = t.category_id ? catMap.get(t.category_id) : null;
        const isIncome = t.type === "income";
        const label = isIncome ? (t.source || "Income") : (cat?.name || "Uncategorized");
        const iconName = isIncome ? "ArrowDownLeft" : (cat?.icon || "Tag");
        const tint = isIncome ? "hsl(var(--income))" : (cat?.color || "hsl(var(--muted-foreground))");

        return (
          <li
            key={t.id}
            className="animate-fade-in"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <button
              type="button"
              onClick={() => onSelect?.(t)}
              disabled={!onSelect}
              className="group flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-gradient-card p-3 text-left shadow-card transition-smooth enabled:hover:border-border enabled:hover:translate-y-[-1px] enabled:active:scale-[0.99] disabled:cursor-default"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in hsl, ${tint} 18%, transparent)`, color: tint }}
              >
                <CategoryIcon name={iconName} className="h-5 w-5" />
              </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {friendlyDate(t.date)}{t.note ? ` · ${t.note}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isIncome ? (
                <ArrowDownLeft className="h-3.5 w-3.5 text-income" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5 text-expense" />
              )}
                <span className={`text-sm font-bold tabular-nums ${isIncome ? "text-income" : "text-expense"}`}>
                  {isIncome ? "+" : "-"}{formatCurrency(t.amount).replace("-", "")}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
};
