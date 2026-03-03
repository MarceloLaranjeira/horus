import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Finance = {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category_id: string | null;
  transaction_date: string;
  created_at: string;
};

export type BudgetCategory = {
  id: string;
  name: string;
  color: string;
};

export const useFinances = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["finances"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("finances")
          .select("*, budget_categories(name, color)")
          .order("transaction_date", { ascending: false });
        if (error) throw error;
        return (data ?? []) as (Finance & { budget_categories: { name: string; color: string } | null })[];
      } catch (e) {
        console.error("Finances fetch error:", e);
        return [] as (Finance & { budget_categories: { name: string; color: string } | null })[];
      }
    },
    enabled: !!user,
  });

  const categories = useQuery({
    queryKey: ["budget_categories"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("budget_categories").select("*").order("name");
        if (error) throw error;
        return (data ?? []) as BudgetCategory[];
      } catch (e) {
        console.error("Categories fetch error:", e);
        return [] as BudgetCategory[];
      }
    },
    enabled: !!user,
  });

  const addTransaction = useMutation({
    mutationFn: async (t: { type: "income" | "expense"; amount: number; description: string; category_id?: string; transaction_date?: string }) => {
      const { data, error } = await supabase.from("finances").insert({ ...t, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finances"] }),
  });

  const updateTransaction = useMutation({
    mutationFn: async (t: { id: string; type?: "income" | "expense"; amount?: number; description?: string; category_id?: string }) => {
      const { id, ...updates } = t;
      const { data, error } = await supabase.from("finances").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finances"] }),
  });

  const addCategory = useMutation({
    mutationFn: async (c: { name: string; color?: string }) => {
      const { data, error } = await supabase.from("budget_categories").insert({ ...c, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budget_categories"] }),
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finances").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finances"] }),
  });

  return {
    transactions: query.data ?? [],
    categories: categories.data ?? [],
    isLoading: query.isLoading,
    addTransaction,
    updateTransaction,
    addCategory,
    deleteTransaction,
  };
};
