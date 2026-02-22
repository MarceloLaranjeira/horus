import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Habit = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  target_days_per_week: number;
  active: boolean;
  created_at: string;
};

export type HabitTrack = {
  id: string;
  habit_id: string;
  track_date: string;
  completed: boolean;
};

export const useHabits = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("habits").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user,
  });

  const tracks = useQuery({
    queryKey: ["habit_tracks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("habit_tracks").select("*").order("track_date", { ascending: false });
      if (error) throw error;
      return data as HabitTrack[];
    },
    enabled: !!user,
  });

  const addHabit = useMutation({
    mutationFn: async (habit: { name: string; icon?: string; target_days_per_week?: number }) => {
      const { data, error } = await supabase.from("habits").insert({ ...habit, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });

  const toggleTrack = useMutation({
    mutationFn: async ({ habit_id, date }: { habit_id: string; date: string }) => {
      const { data: existing } = await supabase
        .from("habit_tracks")
        .select("id")
        .eq("habit_id", habit_id)
        .eq("track_date", date)
        .maybeSingle();

      if (existing) {
        await supabase.from("habit_tracks").delete().eq("id", existing.id);
      } else {
        await supabase.from("habit_tracks").insert({ habit_id, user_id: user!.id, track_date: date });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habit_tracks"] }),
  });

  const updateHabit = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; icon?: string; target_days_per_week?: number }) => {
      const { error } = await supabase.from("habits").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });

  return { habits: query.data ?? [], tracks: tracks.data ?? [], isLoading: query.isLoading, addHabit, updateHabit, toggleTrack, deleteHabit };
};
