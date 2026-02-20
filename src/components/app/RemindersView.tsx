import { useState } from "react";
import { Bell, Clock, Plus, Trash2, Check, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useReminders } from "@/hooks/useReminders";
import { toast } from "sonner";
import { format, parseISO, isPast, isFuture } from "date-fns";
import { motion } from "framer-motion";

export const RemindersView = ({ subView }: { subView?: string }) => {
  const { reminders, isLoading, addReminder, toggleReminder, deleteReminder } = useReminders();
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");

  const filtered = reminders.filter(r => {
    if (subView === "reminders-upcoming") return !r.completed && isFuture(parseISO(r.due_date));
    if (subView === "reminders-overdue") return !r.completed && isPast(parseISO(r.due_date));
    return true;
  });

  const subLabels: Record<string, string> = {
    reminders: "Lembretes Inteligentes",
    "reminders-upcoming": "Próximos",
    "reminders-overdue": "Atrasados",
  };

  const handleAdd = () => {
    if (!newTitle.trim() || !newDate) return;
    addReminder.mutate(
      { title: newTitle, due_date: new Date(newDate).toISOString() },
      {
        onSuccess: () => { setNewTitle(""); setNewDate(""); toast.success("Lembrete criado!"); },
        onError: () => toast.error("Erro ao criar lembrete"),
      }
    );
  };

  const getPriorityLabel = (r: { completed: boolean; due_date: string }) => {
    if (r.completed) return { label: "Concluído", color: "bg-[hsl(var(--nectar-green))]" };
    const overdue = isPast(parseISO(r.due_date));
    if (overdue) return { label: "Atrasado", color: "bg-destructive" };
    return { label: "Alta", color: "bg-[hsl(var(--nectar-orange))]" };
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--nectar-orange))]/15 flex items-center justify-center">
          <Bell className="w-5 h-5 text-[hsl(var(--nectar-orange))]" />
        </div>
        <div>
          <h2 className="font-semibold">{subLabels[subView || "reminders"]}</h2>
          <p className="text-xs text-muted-foreground">Nunca mais esqueça nada importante</p>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-border flex gap-2">
        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Novo lembrete..." className="flex-1 bg-secondary" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <Input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-48 bg-secondary" />
        <Button size="icon" onClick={handleAdd} disabled={addReminder.isPending}><Plus className="w-4 h-4" /></Button>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <Bell className="w-8 h-8 mb-2 opacity-50" />
            <p>Nenhum lembrete</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-2">
            {filtered.map((r, i) => {
              const overdue = !r.completed && isPast(parseISO(r.due_date));
              const priority = getPriorityLabel(r);

              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-4 rounded-xl bg-card border border-border/50 card-glow group flex items-center gap-3"
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    overdue ? "bg-destructive/15" : r.completed ? "bg-[hsl(var(--nectar-green))]/15" : "bg-[hsl(var(--nectar-orange))]/15"
                  )}>
                    {r.completed
                      ? <Check className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
                      : overdue
                        ? <AlertTriangle className="w-4 h-4 text-destructive" />
                        : <Bell className="w-4 h-4 text-[hsl(var(--nectar-orange))]" />
                    }
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", r.completed && "line-through text-muted-foreground")}>{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(parseISO(r.due_date), "dd/MM HH:mm")}
                      </span>
                      {overdue && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">
                          Atrasado
                        </span>
                      )}
                      <span className={cn("w-2 h-2 rounded-full shrink-0", priority.color)} />
                      <span className="text-[11px] text-muted-foreground">{priority.label}</span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div
                    onClick={() => toggleReminder.mutate({ id: r.id, completed: !r.completed })}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 cursor-pointer transition-all flex items-center justify-center shrink-0",
                      r.completed
                        ? "bg-[hsl(var(--nectar-green))] border-[hsl(var(--nectar-green))]"
                        : "border-border/60 hover:border-[hsl(var(--nectar-green))]"
                    )}
                  >
                    {r.completed && <Check className="w-4 h-4 text-white" />}
                  </div>

                  {/* Delete */}
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteReminder.mutate(r.id)}>
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
