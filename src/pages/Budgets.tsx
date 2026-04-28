import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories, useTransactions, Category } from "@/hooks/useWalletData";
import { AppShell } from "@/components/AppShell";
import { CategoryIcon, ICON_OPTIONS, COLOR_OPTIONS } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const Budgets = () => {
  const { user, loading } = useAuth();
  const { data: categories = [], isLoading: cl } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const qc = useQueryClient();

  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  if (loading || cl) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const monthSpent = (id: string) => {
    const now = new Date();
    return transactions
      .filter((t) => t.type === "expense" && t.category_id === id)
      .filter((t) => {
        const d = new Date(t.date + "T00:00:00");
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, t) => s + t.amount, 0);
  };

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button size="sm" onClick={() => setCreating(true)} className="rounded-full bg-primary text-primary-foreground">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">Set monthly limits to keep your spending in check.</p>

      <div className="space-y-2">
        {categories.map((c) => {
          const spent = monthSpent(c.id);
          const limit = c.monthly_limit ?? 0;
          return (
            <button
              key={c.id}
              onClick={() => setEditing(c)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-gradient-card p-4 text-left shadow-card transition-smooth hover:border-border hover:translate-y-[-1px]"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in hsl, ${c.color} 22%, transparent)`, color: c.color }}
              >
                <CategoryIcon name={c.icon} className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {limit > 0 ? `${formatCurrency(spent)} of ${formatCurrency(limit)}` : "No budget set"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <CategoryDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        category={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["categories"] })}
      />
      <CategoryDialog
        open={creating}
        onOpenChange={setCreating}
        category={null}
        onSaved={() => qc.invalidateQueries({ queryKey: ["categories"] })}
      />
    </AppShell>
  );
};

interface DialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: Category | null;
  onSaved: () => void;
}

const CategoryDialog = ({ open, onOpenChange, category, onSaved }: DialogProps) => {
  const { user } = useAuth();
  const [name, setName] = useState(category?.name ?? "");
  const [limit, setLimit] = useState(category?.monthly_limit?.toString() ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "Tag");
  const [color, setColor] = useState(category?.color ?? COLOR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  const key = category?.id ?? "new";
  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setLimit(category?.monthly_limit?.toString() ?? "");
      setIcon(category?.icon ?? "Tag");
      setColor(category?.color ?? COLOR_OPTIONS[0]);
    }
  }, [open, category]);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error("Name required"); return; }
    const lim = limit.trim() ? parseFloat(limit) : null;
    if (lim !== null && (isNaN(lim) || lim < 0)) { toast.error("Invalid limit"); return; }

    setSaving(true);
    if (category) {
      const { error } = await supabase.from("categories").update({
        name: name.trim(), monthly_limit: lim, icon, color,
      }).eq("id", category.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Category updated");
    } else {
      const { error } = await supabase.from("categories").insert({
        user_id: user.id, name: name.trim(), monthly_limit: lim, icon, color,
      });
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Category created");
    }
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!category) return;
    if (!confirm(`Delete "${category.name}"? Transactions will be kept but uncategorized.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Category deleted");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={key}>
      <DialogContent className="max-w-sm rounded-[var(--radius)]">
        <DialogHeader><DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cname">Name</Label>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="climit">Monthly limit (optional)</Label>
            <Input id="climit" type="number" inputMode="decimal" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="0.00" />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-smooth ${color === c ? "ring-2 ring-offset-2 ring-offset-popover ring-foreground scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {ICON_OPTIONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-smooth ${
                    icon === i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CategoryIcon name={i} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          {category && (
            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-expense hover:text-expense hover:bg-expense/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <div className="flex flex-1 gap-2 justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Budgets;
