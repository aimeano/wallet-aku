import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/hooks/useWalletData";
import { toast } from "sonner";

/**
 * Soft-delete with Undo: removes the transaction immediately, then offers a 5s window to restore.
 * Restore re-inserts the row preserving id so referenced UIs remain consistent.
 */
export const useDeleteTransactionWithUndo = () => {
  const qc = useQueryClient();

  return async (t: Transaction & { user_id?: string }) => {
    const { error } = await supabase.from("transactions").delete().eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["transactions"] });

    toast("Transaction deleted", {
      description: `${t.type === "income" ? "+" : "-"}${t.amount}`,
      action: {
        label: "Undo",
        onClick: async () => {
          const { error: e2 } = await supabase.from("transactions").insert({
            id: t.id,
            type: t.type,
            amount: t.amount,
            category_id: t.category_id,
            source: t.source,
            date: t.date,
            note: t.note,
            user_id: t.user_id!,
          });
          if (e2) { toast.error("Couldn't restore: " + e2.message); return; }
          qc.invalidateQueries({ queryKey: ["transactions"] });
          toast.success("Transaction restored");
        },
      },
      duration: 5000,
    });
  };
};
