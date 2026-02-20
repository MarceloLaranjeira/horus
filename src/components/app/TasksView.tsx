import { useState } from "react";
import { ListChecks, Clock, Plus, Trash2, Check, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTasks, Task } from "@/hooks/useTasks";
import { toast } from "sonner";
import { format, isToday, isPast, parseISO } from "date-fns";
import { motion } from "framer-motion";

const priorityDot: Record<string, string> = {
  urgent: "bg-destructive",
  high: "bg-destructive",
  medium: "bg-[hsl(var(--nectar-orange))]",
  low: "bg-[hsl(var(--nectar-green))]",
};
const priorityLabel: Record<string, string> = { urgent: "Urgente", high: "Alta", medium: "Média", low: "Baixa" };

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
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <ListChecks className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">{subLabels[subView || "tasks"]}</h2>
          <p className="text-xs text-muted-foreground">{filteredTasks.length} tarefas</p>
        </div>
      </div>

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
            <ListChecks className="w-8 h-8 mb-2 opacity-50" />
            <p>Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-2">
            {filteredTasks.map((task, i) => {
              const overdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== "done";
              const done = task.status === "done";
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 card-glow group",
                    overdue && "border-destructive/30"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    overdue ? "bg-destructive/15" : "bg-primary/10"
                  )}>
                    {overdue
                      ? <AlertTriangle className="w-4 h-4 text-destructive" />
                      : <ListChecks className="w-4 h-4 text-primary" />
                    }
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {task.due_date && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {format(parseISO(task.due_date), "dd/MM")}
                        </span>
                      )}
                      {overdue && <span className="text-[11px] text-destructive font-medium">• Atrasada</span>}
                      <span className="flex items-center gap-1 text-[11px]">
                        <span className={cn("w-2 h-2 rounded-full", priorityDot[task.priority])} />
                        <span className="text-muted-foreground">{priorityLabel[task.priority]}</span>
                      </span>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <div
                    onClick={() => handleToggle(task)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 cursor-pointer transition-all flex items-center justify-center shrink-0",
                      done
                        ? "bg-[hsl(var(--nectar-green))] border-[hsl(var(--nectar-green))]"
                        : "border-border/60 hover:border-primary"
                    )}
                  >
                    {done && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>

                  {/* Delete */}
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteTask.mutate(task.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
