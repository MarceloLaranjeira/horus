import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Project = {
  id: string;
  title: string;
  description: string | null;
  status: "backlog" | "todo" | "in_progress" | "review" | "done";
  color: string;
  created_at: string;
};

export const useProjects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });

  const addProject = useMutation({
    mutationFn: async (p: { title: string; description?: string; color?: string }) => {
      const { data, error } = await supabase.from("projects").insert({ ...p, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { error } = await supabase.from("projects").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  return { projects: query.data ?? [], isLoading: query.isLoading, addProject, updateProject, deleteProject };
};
