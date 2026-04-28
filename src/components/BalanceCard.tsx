import { Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface Props {
  balance: number;
  income: number;
  expenses: number;
}

export const BalanceCard = ({ balance, income, expenses }: Props) => {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius)] bg-gradient-balance p-6 shadow-glow animate-pop">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-12 -bottom-16 h-44 w-44 rounded-full bg-white/5 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary-foreground/80">
          <Wallet className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Wallet balance</span>
        </div>
      </div>

      <div className="relative mt-3">
        <p className={`text-4xl font-bold tracking-tight text-primary-foreground ${balance < 0 ? "opacity-90" : ""}`}>
          {formatCurrency(balance)}
        </p>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">Income</p>
          <p className="mt-1 text-base font-semibold text-primary-foreground">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">Expenses</p>
          <p className="mt-1 text-base font-semibold text-primary-foreground">{formatCurrency(expenses)}</p>
        </div>
      </div>
    </div>
  );
};
