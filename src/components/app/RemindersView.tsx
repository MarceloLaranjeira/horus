import { useState } from "react";
import { Bell, Clock, AlertTriangle, Plus, Trash2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useReminders } from "@/hooks/useReminders";
import { toast } from "sonner";
import { format, parseISO, isPast, isFuture } from "date-fns";

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
    reminders: "Todos os Lembretes",
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

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--nectar-orange))]/20 flex items-center justify-center">
          <Bell className="w-4 h-4 text-[hsl(var(--nectar-orange))]" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">{subLabels[subView || "reminders"]}</h2>
          <p className="text-xs text-muted-foreground">{filtered.length} lembretes</p>
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
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm"><Bell className="w-8 h-8 mb-2 opacity-50" /><p>Nenhum lembrete</p></div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {filtered.map(r => {
              const overdue = !r.completed && isPast(parseISO(r.due_date));
              return (
                <Card key={r.id} className={cn("bg-card/50 border-border/50", overdue && "border-destructive/30")}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" className={cn("h-8 w-8 rounded-lg", r.completed && "bg-[hsl(var(--nectar-green))]/20 border-[hsl(var(--nectar-green))]/30")} onClick={() => toggleReminder.mutate({ id: r.id, completed: !r.completed })}>
                        {r.completed ? <Check className="w-4 h-4 text-[hsl(var(--nectar-green))]" /> : overdue ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <Bell className="w-4 h-4 text-[hsl(var(--nectar-orange))]" />}
                      </Button>
                      <div>
                        <p className={cn("text-sm font-medium", r.completed && "line-through text-muted-foreground")}>{r.title}</p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {format(parseISO(r.due_date), "dd/MM HH:mm")}
                          {overdue && <span className="text-destructive ml-1">(Atrasado)</span>}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteReminder.mutate(r.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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
