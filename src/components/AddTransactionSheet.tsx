import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCategories, Transaction } from "@/hooks/useWalletData";
import { CategoryIcon } from "./CategoryIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Loader2, Trash2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  /** When provided, the sheet is in edit mode and will update this transaction. */
  transaction?: Transaction | null;
}

export const AddTransactionSheet = ({ open, onOpenChange, type, transaction }: Props) => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: categories = [] } = useCategories();
  const qc = useQueryClient();
  const isEdit = !!transaction;

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [source, setSource] = useState<string>("Salary");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Pre-fill form when opening for edit, reset when opening fresh
  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setAmount(String(transaction.amount));
      setDate(transaction.date);
      setNote(transaction.note ?? "");
      setCategoryId(transaction.category_id);
      setSource(transaction.source ?? "Salary");
    } else {
      setAmount("");
      setNote("");
      setCategoryId(null);
      setSource("Salary");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open, transaction]);

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
    const payload = {
      type,
      amount: parsed.data.amount,
      date: parsed.data.date,
      note: parsed.data.note ?? null,
      category_id: type === "expense" ? categoryId : null,
      source: type === "income" ? source : null,
    };

    const { error } = isEdit
      ? await supabase.from("transactions").update(payload).eq("id", transaction!.id)
      : await supabase.from("transactions").insert({ ...payload, user_id: user.id });
    setSaving(false);

    if (error) { toast.error(error.message); return; }
    toast.success(
      isEdit ? "Transaction updated" : type === "income" ? "Money added" : "Expense recorded"
    );
    qc.invalidateQueries({ queryKey: ["transactions"] });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!transaction) return;
    setDeleting(true);
    const { error } = await supabase.from("transactions").delete().eq("id", transaction.id);
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Transaction deleted");
    qc.invalidateQueries({ queryKey: ["transactions"] });
    setConfirmDelete(false);
    onOpenChange(false);
  };

  const accent = type === "income" ? "income" : "expense";
  const title = isEdit
    ? type === "income" ? "Edit Income" : "Edit Expense"
    : type === "income" ? "Add Money" : "Spend Money";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-[2rem] border-border bg-card p-0 max-h-[92vh] overflow-y-auto">
          <div className={`h-1.5 w-12 rounded-full mx-auto mt-3 mb-1 bg-${accent}`} />
          <SheetHeader className="px-6 pt-3 pb-2 flex-row items-center justify-between space-y-0">
            <SheetTitle className="text-xl">{title}</SheetTitle>
            {isEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfirmDelete(true)}
                className="text-expense hover:text-expense hover:bg-expense/10"
                aria-label="Delete transaction"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
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

            <div className="flex gap-2 pt-1">
              {isEdit && (
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-12 flex-1 rounded-2xl text-base font-semibold"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={saving || !amount}
                className={`h-12 flex-1 rounded-2xl text-base font-semibold ${
                  type === "income"
                    ? "bg-gradient-income text-income-foreground hover:opacity-90 shadow-income"
                    : "bg-gradient-expense text-expense-foreground hover:opacity-90 shadow-expense"
                }`}
              >
                {saving
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : isEdit ? "Save Changes" : type === "income" ? "Add to wallet" : "Record expense"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? Your wallet balance and budgets will update.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-expense text-expense-foreground hover:bg-expense/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
