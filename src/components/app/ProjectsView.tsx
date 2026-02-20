import { useState } from "react";
import { FolderKanban, Plus, Trash2, Clock, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  todo: "A Fazer",
  in_progress: "Em Andamento",
  review: "Revisão",
  done: "Concluído",
};

const statusDotColors: Record<string, string> = {
  backlog: "bg-muted-foreground",
  todo: "bg-[hsl(var(--nectar-blue))]",
  in_progress: "bg-[hsl(var(--nectar-blue))]",
  review: "bg-[hsl(var(--nectar-orange))]",
  done: "bg-[hsl(var(--nectar-green))]",
};

const statusColors: Record<string, string> = {
  backlog: "text-muted-foreground bg-muted",
  todo: "text-accent bg-accent/10",
  in_progress: "text-primary bg-primary/10",
  review: "text-[hsl(var(--nectar-orange))] bg-[hsl(var(--nectar-orange))]/10",
  done: "text-[hsl(var(--nectar-green))] bg-[hsl(var(--nectar-green))]/10",
};

export const ProjectsView = ({ subView }: { subView?: string }) => {
  const { projects, isLoading, addProject, updateProject, deleteProject } = useProjects();
  const { data: tasks = [] } = useTasks();
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addProject.mutate({ title: newTitle }, {
      onSuccess: () => { setNewTitle(""); toast.success("Projeto criado!"); },
      onError: () => toast.error("Erro ao criar projeto"),
    });
  };

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    if (projectTasks.length === 0) return 0;
    const done = projectTasks.filter(t => t.status === "done").length;
    return Math.round((done / projectTasks.length) * 100);
  };

  const getProjectTaskCount = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const done = projectTasks.filter(t => t.status === "done").length;
    return { done, total: projectTasks.length };
  };

  // Kanban view
  if (subView === "projects-kanban") {
    const columns = ["backlog", "todo", "in_progress", "review", "done"] as const;
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--nectar-purple))]/15 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-[hsl(var(--nectar-purple))]" />
          </div>
          <div><h2 className="font-semibold">Kanban</h2></div>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex gap-4 p-6 min-w-max">
            {columns.map(col => (
              <div key={col} className="w-64 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", statusColors[col])}>{statusLabels[col]}</span>
                  <span className="text-xs text-muted-foreground">{projects.filter(p => p.status === col).length}</span>
                </div>
                <div className="space-y-2">
                  {projects.filter(p => p.status === col).map(p => (
                    <Card key={p.id} className="bg-card/50 border-border/50">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium mb-1">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{getProjectTaskCount(p.id).done}/{getProjectTaskCount(p.id).total} tarefas</p>
                        <Select value={p.status} onValueChange={(v) => updateProject.mutate({ id: p.id, status: v as any })}>
                          <SelectTrigger className="mt-2 h-7 text-xs bg-secondary"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {columns.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--nectar-purple))]/15 flex items-center justify-center">
          <FolderKanban className="w-5 h-5 text-[hsl(var(--nectar-purple))]" />
        </div>
        <div>
          <h2 className="font-semibold">Projetos Organizados</h2>
          <p className="text-xs text-muted-foreground">Gerencie projetos com tarefas, deadlines e progresso</p>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-border flex gap-2">
        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Novo projeto..." className="flex-1 bg-secondary" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <Button size="icon" onClick={handleAdd} disabled={addProject.isPending}><Plus className="w-4 h-4" /></Button>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Carregando...</div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <FolderKanban className="w-8 h-8 mb-2 opacity-50" />
            <p>Nenhum projeto criado</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-2">
            {projects.map((p, i) => {
              const progress = getProjectProgress(p.id);
              const taskCount = getProjectTaskCount(p.id);
              const isDone = p.status === "done";

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-4 rounded-xl bg-card border border-border/50 card-glow group"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      isDone ? "bg-[hsl(var(--nectar-green))]/15" : "bg-[hsl(var(--nectar-purple))]/15"
                    )}>
                      {isDone
                        ? <Check className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
                        : <FolderKanban className="w-4 h-4 text-[hsl(var(--nectar-purple))]" />
                      }
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{p.title}</p>
                        <span className="text-xs font-semibold text-[hsl(var(--nectar-green))]">{progress}%</span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            background: isDone
                              ? `hsl(var(--nectar-green))`
                              : progress === 0
                                ? `hsl(var(--muted-foreground))`
                                : `linear-gradient(90deg, hsl(var(--nectar-purple)), hsl(var(--primary)))`,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className={cn("w-2 h-2 rounded-full", statusDotColors[p.status])} />
                        <span>{statusLabels[p.status]}</span>
                        <span>{taskCount.done}/{taskCount.total} etapas</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(p.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    {/* Status select */}
                    <Select value={p.status} onValueChange={(v) => updateProject.mutate({ id: p.id, status: v as any })}>
                      <SelectTrigger className="w-28 h-7 text-xs bg-secondary shrink-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["backlog", "todo", "in_progress", "review", "done"] as const).map(s => (
                          <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Delete */}
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteProject.mutate(p.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
