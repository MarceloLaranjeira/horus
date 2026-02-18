import { Bell, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const reminders = [
  { id: 1, title: "Reunião com equipe", datetime: "18/02 16:30", priority: "alta", overdue: false },
  { id: 2, title: "Consulta dentista", datetime: "19/02 14:50", priority: "alta", overdue: false },
  { id: 3, title: "Ligar para o médico", datetime: "20/02 17:45", priority: "alta", overdue: false },
  { id: 4, title: "Fazer backup dos arquivos", datetime: "11/02 10:15", priority: "baixa", overdue: true },
];

export const RemindersView = ({ subView }: { subView?: string }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--nectar-orange))]/20 flex items-center justify-center">
          <Bell className="w-4 h-4 text-[hsl(var(--nectar-orange))]" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Lembretes</h2>
          <p className="text-xs text-muted-foreground">{reminders.length} lembretes</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {reminders.map((r) => (
            <Card key={r.id} className={cn("bg-card/50 border-border/50", r.overdue && "border-destructive/30")}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", r.overdue ? "bg-destructive/20" : "bg-[hsl(var(--nectar-orange))]/20")}>
                    {r.overdue ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <Bell className="w-4 h-4 text-[hsl(var(--nectar-orange))]" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {r.datetime}
                      </span>
                      {r.overdue && <span className="text-xs text-destructive">(Atrasado)</span>}
                    </div>
                  </div>
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full border", r.priority === "alta" ? "bg-destructive/20 text-destructive border-destructive/30" : "bg-muted text-muted-foreground border-border")}>
                  {r.priority}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
