import { BarChart3, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

const habits = [
  { id: 1, title: "Exercitar-se 30 min", streak: 21, best: 45, progress: 16, goal: 25 },
  { id: 2, title: "Beber 2L de água", streak: 12, best: 30, progress: 12, goal: 30 },
  { id: 3, title: "Meditar 10 minutos", streak: 0, best: 15, progress: 0, goal: 30 },
  { id: 4, title: "Estudar programação", streak: 15, best: 28, progress: 15, goal: 30 },
  { id: 5, title: "Ler 20 páginas", streak: 8, best: 20, progress: 8, goal: 28 },
  { id: 6, title: "Praticar violão", streak: 0, best: 12, progress: 0, goal: 25 },
];

export const HabitsView = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--nectar-green))]/20 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Hábitos</h2>
          <p className="text-xs text-muted-foreground">{habits.length} hábitos ativos</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {habits.map((habit) => (
            <Card key={habit.id} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">{habit.title}</h3>
                  <div className="flex items-center gap-1 text-xs">
                    <Flame className="w-3.5 h-3.5 text-[hsl(var(--nectar-orange))]" />
                    <span className="text-[hsl(var(--nectar-orange))] font-medium">{habit.streak}</span>
                    <span className="text-muted-foreground ml-1">melhor: {habit.best}</span>
                  </div>
                </div>
                <Progress value={(habit.progress / habit.goal) * 100} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground text-right">{habit.progress}/{habit.goal} dias</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
