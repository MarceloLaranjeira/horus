import { useState } from "react";
import { BarChart3, Flame, Plus, Trash2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHabits } from "@/hooks/useHabits";
import { toast } from "sonner";
import { format, subDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export const HabitsView = ({ subView }: { subView?: string }) => {
  const { habits, tracks, isLoading, addHabit, toggleTrack, deleteHabit } = useHabits();
  const [newName, setNewName] = useState("");
  const today = format(new Date(), "yyyy-MM-dd");

  const handleAdd = () => {
    if (!newName.trim()) return;
    addHabit.mutate({ name: newName }, {
      onSuccess: () => { setNewName(""); toast.success("Hábito criado!"); },
      onError: () => toast.error("Erro ao criar hábito"),
    });
  };

  const getStreak = (habitId: string) => {
    const habitTracks = tracks.filter(t => t.habit_id === habitId && t.completed).map(t => t.track_date).sort().reverse();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      if (habitTracks.includes(d)) streak++;
      else break;
    }
    return streak;
  };

  const getLast30 = (habitId: string) => {
    const habitTracks = tracks.filter(t => t.habit_id === habitId && t.completed).map(t => t.track_date);
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      if (habitTracks.includes(d)) count++;
    }
    return count;
  };

  const isCompletedToday = (habitId: string) => tracks.some(t => t.habit_id === habitId && t.track_date === today && t.completed);

  const activeHabits = habits.filter(h => h.active);

  if (subView === "habits-stats") {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--nectar-green))]/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Estatísticas de Hábitos</h2>
            <p className="text-xs text-muted-foreground">{activeHabits.length} hábitos ativos</p>
          </div>
        </div>
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="max-w-2xl mx-auto space-y-3">
            {activeHabits.map(h => {
              const streak = getStreak(h.id);
              const last30 = getLast30(h.id);
              return (
                <Card key={h.id} className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between mb-2">
                      <h3 className="text-sm font-medium">{h.icon} {h.name}</h3>
                      <span className="text-xs text-muted-foreground">Meta: {h.target_days_per_week}x/semana</span>
                    </div>
                    <Progress value={(last30 / 30) * 100} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-[hsl(var(--nectar-orange))]" /> {streak} dias seguidos</span>
                      <span>{last30}/30 dias</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--nectar-green))]/20 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Hábitos Ativos</h2>
          <p className="text-xs text-muted-foreground">{activeHabits.length} hábitos</p>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-border flex gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Novo hábito..." className="flex-1 bg-secondary" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <Button size="icon" onClick={handleAdd} disabled={addHabit.isPending}><Plus className="w-4 h-4" /></Button>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Carregando...</div>
        ) : activeHabits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <Flame className="w-8 h-8 mb-2 opacity-50" />
            <p>Nenhum hábito criado ainda</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {activeHabits.map(h => {
              const done = isCompletedToday(h.id);
              const streak = getStreak(h.id);
              return (
                <Card key={h.id} className="bg-card/50 border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" className={cn("h-8 w-8 rounded-lg", done && "bg-[hsl(var(--nectar-green))]/20 border-[hsl(var(--nectar-green))]/30")} onClick={() => toggleTrack.mutate({ habit_id: h.id, date: today })}>
                        {done ? <Check className="w-4 h-4 text-[hsl(var(--nectar-green))]" /> : <span className="text-sm">{h.icon}</span>}
                      </Button>
                      <div>
                        <p className="text-sm font-medium">{h.name}</p>
                        <div className="flex items-center gap-1 text-xs">
                          <Flame className="w-3 h-3 text-[hsl(var(--nectar-orange))]" />
                          <span className="text-[hsl(var(--nectar-orange))]">{streak}</span>
                          <span className="text-muted-foreground">dias seguidos</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteHabit.mutate(h.id)}>
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
