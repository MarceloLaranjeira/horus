import { useState } from "react";
import { FolderKanban, Calendar, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useProjects, Project } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  todo: "A Fazer",
  in_progress: "Em Andamento",
  review: "Revisão",
  done: "Concluído",
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
    return `${done}/${projectTasks.length} tarefas`;
  };

  // Kanban view
  if (subView === "projects-kanban") {
    const columns = ["backlog", "todo", "in_progress", "review", "done"] as const;
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><FolderKanban className="w-4 h-4 text-primary" /></div>
          <div><h2 className="font-semibold text-sm">Kanban</h2></div>
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
                        <p className="text-xs text-muted-foreground">{getProjectTaskCount(p.id)}</p>
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
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><FolderKanban className="w-4 h-4 text-primary" /></div>
        <div>
          <h2 className="font-semibold text-sm">{subView === "projects-calendar" ? "Calendário de Projetos" : "Visão Geral"}</h2>
          <p className="text-xs text-muted-foreground">{projects.length} projetos</p>
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
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm"><FolderKanban className="w-8 h-8 mb-2 opacity-50" /><p>Nenhum projeto criado</p></div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {projects.map(p => {
              const progress = getProjectProgress(p.id);
              return (
                <Card key={p.id} className="bg-card/50 border-border/50 hover:border-primary/20 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium">{p.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", statusColors[p.status])}>{statusLabels[p.status]}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteProject.mutate(p.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={progress} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground text-right">{getProjectTaskCount(p.id)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
