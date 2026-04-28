import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/useWalletData";
import { CategoryIcon } from "./CategoryIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

const SOURCES = ["Salary", "Allowance", "Transfer", "Gift", "Bonus", "Other"];

const schema = z.object({
  amount: z.number().positive("Amount must be greater than 0").max(1_000_000_000),
  date: z.string().min(1),
  note: z.string().max(280).optional(),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: "income" | "expense";
}

export const AddTransactionSheet = ({ open, onOpenChange, type }: Props) => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: categories = [] } = useCategories();
  const qc = useQueryClient();

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [source, setSource] = useState<string>("Salary");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setAmount(""); setNote(""); setCategoryId(null); setSource("Salary");
    setDate(new Date().toISOString().slice(0, 10));
  };

  const handleSubmit = async () => {
    if (!user) return;
    const parsed = schema.safeParse({ amount: parseFloat(amount), date, note: note.trim() || undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (type === "expense" && !categoryId) {
      toast.error("Please pick a category");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type,
      amount: parsed.data.amount,
      date: parsed.data.date,
      note: parsed.data.note ?? null,
      category_id: type === "expense" ? categoryId : null,
      source: type === "income" ? source : null,
    });
    setSaving(false);

    if (error) { toast.error(error.message); return; }
    toast.success(type === "income" ? "Money added" : "Expense recorded");
    qc.invalidateQueries({ queryKey: ["transactions"] });
    reset();
    onOpenChange(false);
  };

  const accent = type === "income" ? "income" : "expense";

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <SheetContent side="bottom" className="rounded-t-[2rem] border-border bg-card p-0 max-h-[92vh] overflow-y-auto">
        <div className={`h-1.5 w-12 rounded-full mx-auto mt-3 mb-1 bg-${accent}`} />
        <SheetHeader className="px-6 pt-3 pb-2">
          <SheetTitle className="text-xl">
            {type === "income" ? "Add Money" : "Spend Money"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 px-6 pb-8">
          {/* Amount */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount</Label>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${type === "income" ? "text-income" : "text-expense"}`}>{currency.symbol}</span>
              <Input
                type="number"
                inputMode="decimal"
                step={currency.decimals === 0 ? "1" : "0.01"}
                placeholder={currency.decimals === 0 ? "0" : "0.00"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="h-auto border-0 bg-transparent p-0 text-3xl font-bold tracking-tight focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="mt-2 h-px bg-border" />
          </div>

          {/* Category or source */}
          {type === "expense" ? (
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {categories.map((c) => {
                  const active = categoryId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition-smooth ${
                        active ? "border-transparent ring-2 ring-offset-2 ring-offset-card" : "border-border/60 hover:border-border"
                      }`}
                      style={active ? { backgroundColor: `color-mix(in hsl, ${c.color} 20%, transparent)`, boxShadow: `0 0 0 2px ${c.color}` } : {}}
                    >
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `color-mix(in hsl, ${c.color} 22%, transparent)`, color: c.color }}
                      >
                        <CategoryIcon name={c.icon} className="h-4 w-4" />
                      </div>
                      <span className="truncate text-[10px] font-medium">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Source</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SOURCES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSource(s)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-smooth ${
                      source === s ? "bg-income text-income-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <Label htmlFor="date" className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2" />
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="note" className="text-xs uppercase tracking-wider text-muted-foreground">Note (optional)</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a quick note…" rows={2} className="mt-2 resize-none" />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving || !amount}
            className={`h-12 w-full rounded-2xl text-base font-semibold ${
              type === "income"
                ? "bg-gradient-income text-income-foreground hover:opacity-90 shadow-income"
                : "bg-gradient-expense text-expense-foreground hover:opacity-90 shadow-expense"
            }`}
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : type === "income" ? "Add to wallet" : "Record expense"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
