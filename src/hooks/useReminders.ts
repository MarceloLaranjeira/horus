import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Reminder = {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  completed: boolean;
  created_at: string;
};

export const useReminders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reminders").select("*").order("due_date", { ascending: true });
      if (error) throw error;
      return data as Reminder[];
    },
    enabled: !!user,
  });

  const addReminder = useMutation({
    mutationFn: async (r: { title: string; due_date: string; description?: string }) => {
      const { data, error } = await supabase.from("reminders").insert({ ...r, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const toggleReminder = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("reminders").update({ completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const updateReminder = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; description?: string; due_date?: string }) => {
      const { error } = await supabase.from("reminders").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const deleteReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });

  return { reminders: query.data ?? [], isLoading: query.isLoading, addReminder, updateReminder, toggleReminder, deleteReminder };
};
