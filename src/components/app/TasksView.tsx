import { useState } from "react";
import { CheckSquare, Clock, AlertTriangle, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTasks, Task } from "@/hooks/useTasks";
import { toast } from "sonner";
import { format, isToday, isPast, parseISO } from "date-fns";

const priorityColors: Record<string, string> = {
  urgent: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-[hsl(var(--nectar-orange))]/20 text-[hsl(var(--nectar-orange))] border-[hsl(var(--nectar-orange))]/30",
  medium: "bg-accent/20 text-accent border-accent/30",
  low: "bg-muted text-muted-foreground border-border",
};

const priorityLabels: Record<string, string> = { urgent: "Urgente", high: "Alta", medium: "Média", low: "Baixa" };

export const TasksView = ({ subView }: { subView?: string }) => {
  const { data: tasks = [], isLoading, addTask, updateTask, deleteTask } = useTasks();
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newDueDate, setNewDueDate] = useState("");

  const filteredTasks = tasks.filter((t) => {
    if (subView === "tasks-today") return t.due_date && isToday(parseISO(t.due_date));
    if (subView === "tasks-overdue") return t.due_date && isPast(parseISO(t.due_date)) && t.status !== "done";
    if (subView === "tasks-completed") return t.status === "done";
    return true;
  });

  const subLabels: Record<string, string> = {
    tasks: "Todas as Tarefas",
    "tasks-today": "Tarefas de Hoje",
    "tasks-overdue": "Tarefas Atrasadas",
    "tasks-completed": "Tarefas Concluídas",
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTask.mutate(
      { title: newTitle, priority: newPriority, due_date: newDueDate || undefined },
      {
        onSuccess: () => { setNewTitle(""); setNewDueDate(""); toast.success("Tarefa criada!"); },
        onError: () => toast.error("Erro ao criar tarefa"),
      }
    );
  };

  const handleToggle = (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    updateTask.mutate({
      id: task.id,
      status: newStatus as any,
      completed_at: newStatus === "done" ? new Date().toISOString() : null,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">{subLabels[subView || "tasks"]}</h2>
            <p className="text-xs text-muted-foreground">{filteredTasks.length} tarefas</p>
          </div>
        </div>
      </div>

      {/* Add task form */}
      {subView !== "tasks-completed" && (
        <div className="px-6 py-3 border-b border-border flex gap-2">
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Nova tarefa..." className="flex-1 bg-secondary" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="w-40 bg-secondary" />
          <Select value={newPriority} onValueChange={(v) => setNewPriority(v as any)}>
            <SelectTrigger className="w-28 bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" onClick={handleAdd} disabled={addTask.isPending}><Plus className="w-4 h-4" /></Button>
        </div>
      )}

      <ScrollArea className="flex-1 px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Carregando...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
            <p>Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {filteredTasks.map((task) => {
              const overdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== "done";
              return (
                <Card key={task.id} className={cn("bg-card/50 border-border/50 hover:border-primary/20 transition-all", overdue && "border-destructive/30")}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", overdue ? "bg-destructive/20" : "bg-accent/20")}>
                        {overdue ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <CheckSquare className="w-4 h-4 text-accent" />}
                      </div>
                      <div>
                        <p className={cn("text-sm font-medium", task.status === "done" && "line-through text-muted-foreground")}>{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {format(parseISO(task.due_date), "dd/MM")}
                            </span>
                          )}
                          {overdue && <span className="text-xs text-destructive">• Atrasada</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border", priorityColors[task.priority])}>
                        {priorityLabels[task.priority]}
                      </span>
                      <div
                        onClick={() => handleToggle(task)}
                        className={cn("w-5 h-5 rounded border cursor-pointer transition-colors", task.status === "done" ? "bg-primary border-primary" : "border-border hover:border-primary")}
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteTask.mutate(task.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
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
