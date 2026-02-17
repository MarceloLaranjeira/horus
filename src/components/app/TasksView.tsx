import { CheckSquare, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const tasks = [
  { id: 1, title: "Revisar contrato de trabalho", date: "16/02", priority: "alta", overdue: true },
  { id: 2, title: "Preparar documentos para reunião", date: "17/02", priority: "alta", overdue: false },
  { id: 3, title: "Comprar presente aniversário", date: "18/02", priority: "média", overdue: false },
  { id: 4, title: "Organizar escritório em casa", date: "20/02", priority: "baixa", overdue: false },
  { id: 5, title: "Agendar limpeza do ar condicionado", date: "24/02", priority: "baixa", overdue: false },
  { id: 6, title: "Estudar inglês para viagem", date: "19/02", priority: "baixa", overdue: false },
  { id: 7, title: "Renovar assinatura Netflix", date: "24/02", priority: "baixa", overdue: false },
];

const priorityColors: Record<string, string> = {
  alta: "bg-destructive/20 text-destructive border-destructive/30",
  média: "bg-accent/20 text-accent border-accent/30",
  baixa: "bg-muted text-muted-foreground border-border",
};

export const TasksView = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Tarefas</h2>
            <p className="text-xs text-muted-foreground">{tasks.length} tarefas</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className={cn("bg-card/50 border-border/50 hover:border-primary/20 transition-all cursor-pointer", task.overdue && "border-destructive/30")}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", task.overdue ? "bg-destructive/20" : "bg-accent/20")}>
                    {task.overdue ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <CheckSquare className="w-4 h-4 text-accent" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {task.date}
                      </span>
                      {task.overdue && <span className="text-xs text-destructive">• Atrasada</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border", priorityColors[task.priority])}>
                    {task.priority}
                  </span>
                  <div className="w-5 h-5 rounded border border-border hover:border-primary transition-colors cursor-pointer" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
