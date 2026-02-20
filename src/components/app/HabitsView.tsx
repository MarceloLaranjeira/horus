import { useState } from "react";
import { BarChart3, Flame, Plus, Trash2, Check, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHabits } from "@/hooks/useHabits";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

  const getTotalDays = (habitId: string) => tracks.filter(t => t.habit_id === habitId && t.completed).length;
  const isCompletedToday = (habitId: string) => tracks.some(t => t.habit_id === habitId && t.track_date === today && t.completed);
  const activeHabits = habits.filter(h => h.active);

  // Stats view
  if (subView === "habits-stats") {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--nectar-green))]/15 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[hsl(var(--nectar-green))]" />
          </div>
          <div>
            <h2 className="font-semibold">Estatísticas de Hábitos</h2>
            <p className="text-xs text-muted-foreground">{activeHabits.length} hábitos ativos</p>
          </div>
        </div>
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="max-w-2xl mx-auto space-y-2">
            {activeHabits.map((h, i) => {
              const streak = getStreak(h.id);
              const last30 = getLast30(h.id);
              const target = h.target_days_per_week || 7;
              const progress = Math.min(Math.round((last30 / 30) * 100), 100);
              return (
                <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="p-4 rounded-xl bg-card border border-border/50 card-glow space-y-2">
                  <div className="flex justify-between">
                    <h3 className="text-sm font-medium">{h.icon} {h.name}</h3>
                    <span className="text-xs text-muted-foreground">Meta: {target}x/semana</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-[hsl(var(--nectar-orange))]" /> {streak} dias seguidos</span>
                    <span>{last30}/30 dias</span>
                  </div>
                </motion.div>
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
        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--nectar-green))]/15 flex items-center justify-center">
          <Flame className="w-5 h-5 text-[hsl(var(--nectar-green))]" />
        </div>
        <div>
          <h2 className="font-semibold">Hábitos Saudáveis</h2>
          <p className="text-xs text-muted-foreground">Construa rotinas positivas e acompanhe seu progresso</p>
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
          <div className="max-w-2xl mx-auto space-y-2">
            {activeHabits.map((h, i) => {
              const done = isCompletedToday(h.id);
              const streak = getStreak(h.id);
              const totalDays = getTotalDays(h.id);
              const target = (h.target_days_per_week || 7) * 4; // monthly target approx
              const last30 = getLast30(h.id);
              const progress = Math.min(Math.round((last30 / 30) * 100), 100);

              return (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-4 rounded-xl bg-card border border-border/50 card-glow group"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      done ? "bg-[hsl(var(--nectar-green))]/15" : "bg-[hsl(var(--nectar-purple))]/15"
                    )}>
                      {done
                        ? <Check className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
                        : <span className="text-base">{h.icon || "🎯"}</span>
                      }
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className={cn("text-sm font-medium", done && "text-[hsl(var(--nectar-green))]")}>{h.name}</p>
                      {/* Progress bar */}
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            background: `linear-gradient(90deg, hsl(var(--nectar-green)), hsl(var(--primary)))`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground shrink-0">
                      <span className="flex items-center gap-0.5">
                        <Flame className="w-3 h-3 text-[hsl(var(--nectar-orange))]" /> {streak}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" /> {totalDays}
                      </span>
                      <span>{last30}/30</span>
                    </div>

                    {/* Toggle button */}
                    <div
                      onClick={() => toggleTrack.mutate({ habit_id: h.id, date: today })}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 cursor-pointer transition-all flex items-center justify-center shrink-0",
                        done
                          ? "bg-[hsl(var(--nectar-green))] border-[hsl(var(--nectar-green))]"
                          : "border-border/60 hover:border-[hsl(var(--nectar-green))]"
                      )}
                    >
                      {done && <Check className="w-4 h-4 text-white" />}
                    </div>

                    {/* Delete */}
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteHabit.mutate(h.id)}>
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
