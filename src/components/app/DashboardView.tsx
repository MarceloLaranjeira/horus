import { useTasks } from "@/hooks/useTasks";
import { useFinances } from "@/hooks/useFinances";
import { useHabits } from "@/hooks/useHabits";
import { useReminders } from "@/hooks/useReminders";
import { CheckSquare, DollarSign, Flame, Bell, ArrowRight, TrendingUp, TrendingDown, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AppView } from "@/pages/AppDashboard";

interface DashboardViewProps {
  onNavigate: (view: AppView) => void;
}

const WidgetCard = ({
  children,
  title,
  icon: Icon,
  action,
  onAction,
  delay = 0,
}: {
  children: React.ReactNode;
  title: string;
  icon: React.ElementType;
  action?: string;
  onAction?: () => void;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="bg-card border border-border/50 rounded-xl p-5 card-glow flex flex-col"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {action && onAction && (
        <button onClick={onAction} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
          {action} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
    {children}
  </motion.div>
);

const StatBadge = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-secondary/50 border border-border/30 flex-1">
    <span className={cn("text-lg font-bold", color)}>{value}</span>
    <span className="text-[11px] text-muted-foreground">{label}</span>
  </div>
);

export const DashboardView = ({ onNavigate }: DashboardViewProps) => {
  const { data: tasks = [] } = useTasks();
  const { transactions } = useFinances();
  const { habits, tracks } = useHabits();
  const { reminders } = useReminders();

  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");
  const todayTracks = tracks.filter((t) => t.track_date === todayStr);
  const todayTasks = (tasks ?? []).filter((t) => t.due_date && isToday(new Date(t.due_date)) && t.status !== "done");
  const overdueTasks = tasks.filter((t) => t.due_date && isBefore(new Date(t.due_date), today) && t.status !== "done");
  const completedToday = tasks.filter((t) => t.completed_at && isToday(new Date(t.completed_at)));

  const currentMonth = format(new Date(), "yyyy-MM");
  const monthFinances = transactions.filter((f) => f.transaction_date.startsWith(currentMonth));
  const totalIncome = monthFinances.filter((f) => f.type === "income").reduce((s, f) => s + Number(f.amount), 0);
  const totalExpenses = monthFinances.filter((f) => f.type === "expense").reduce((s, f) => s + Number(f.amount), 0);
  const balance = totalIncome - totalExpenses;

  const activeHabits = habits.filter((h) => h.active);
  const completedHabits = todayTracks.filter((t) => t.completed).length;
  const habitPercent = activeHabits.length > 0 ? Math.round((completedHabits / activeHabits.length) * 100) : 0;

  const upcomingReminders = reminders
    .filter((r) => !r.completed && new Date(r.due_date) >= new Date())
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 4);

  const overdueReminders = reminders.filter((r) => !r.completed && isBefore(new Date(r.due_date), new Date()));

  return (
    <div className="h-full overflow-auto p-6 jarvis-grid">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
          <h1 className="text-2xl font-bold text-gradient-cyan">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </motion.div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tasks Widget */}
          <WidgetCard title="Tarefas do Dia" icon={CheckSquare} action="Ver todas" onAction={() => onNavigate("tasks-today")} delay={0.05}>
            <div className="flex gap-2 mb-4">
              <StatBadge label="Hoje" value={todayTasks.length} color="text-primary" />
              <StatBadge label="Atrasadas" value={overdueTasks.length} color={overdueTasks.length > 0 ? "text-nectar-red" : "text-muted-foreground"} />
              <StatBadge label="Feitas" value={completedToday.length} color="text-nectar-green" />
            </div>
            {todayTasks.length > 0 ? (
              <ul className="space-y-2">
                {todayTasks.slice(0, 3).map((task) => (
                  <li key={task.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-secondary/30 border border-border/20">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      task.priority === "urgent" ? "bg-nectar-red" :
                      task.priority === "high" ? "bg-nectar-orange" :
                      task.priority === "medium" ? "bg-nectar-gold" : "bg-nectar-green"
                    )} />
                    <span className="truncate">{task.title}</span>
                  </li>
                ))}
                {todayTasks.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">+{todayTasks.length - 3} mais</p>
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa para hoje 🎉</p>
            )}
          </WidgetCard>

          {/* Finances Widget */}
          <WidgetCard title="Resumo Financeiro" icon={DollarSign} action="Detalhes" onAction={() => onNavigate("finances")} delay={0.1}>
            <div className="flex gap-2 mb-4">
              <StatBadge label="Receitas" value={`R$ ${totalIncome.toLocaleString("pt-BR")}`} color="text-nectar-green" />
              <StatBadge label="Despesas" value={`R$ ${totalExpenses.toLocaleString("pt-BR")}`} color="text-nectar-red" />
            </div>
            <div className={cn(
              "flex items-center justify-center gap-2 p-3 rounded-lg border",
              balance >= 0 ? "bg-nectar-green/5 border-nectar-green/20" : "bg-nectar-red/5 border-nectar-red/20"
            )}>
              {balance >= 0 ? <TrendingUp className="w-4 h-4 text-nectar-green" /> : <TrendingDown className="w-4 h-4 text-nectar-red" />}
              <span className={cn("font-bold text-lg", balance >= 0 ? "text-nectar-green" : "text-nectar-red")}>
                R$ {Math.abs(balance).toLocaleString("pt-BR")}
              </span>
              <span className="text-xs text-muted-foreground">saldo</span>
            </div>
          </WidgetCard>

          {/* Habits Widget */}
          <WidgetCard title="Progresso de Hábitos" icon={Flame} action="Ver hábitos" onAction={() => onNavigate("habits")} delay={0.15}>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
                  <circle
                    cx="18" cy="18" r="16" fill="none"
                    stroke="hsl(var(--cyan))"
                    strokeWidth="2"
                    strokeDasharray={`${habitPercent} ${100 - habitPercent}`}
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_4px_hsl(var(--cyan)/0.5)]"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">{habitPercent}%</span>
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm"><span className="font-semibold text-primary">{completedHabits}</span> de <span className="font-semibold">{activeHabits.length}</span> hábitos</p>
                <p className="text-xs text-muted-foreground">completados hoje</p>
              </div>
            </div>
            {activeHabits.length > 0 ? (
              <ul className="space-y-1.5">
                {activeHabits.slice(0, 4).map((h) => {
                  const done = todayTracks.some((t) => t.habit_id === h.id && t.completed);
                  return (
                    <li key={h.id} className="flex items-center gap-2 text-sm">
                      <span className={cn("w-4 h-4 rounded-full border flex items-center justify-center text-[10px]", done ? "bg-primary/20 border-primary text-primary" : "border-border")}>
                        {done && "✓"}
                      </span>
                      <span className={cn("truncate", done && "text-muted-foreground line-through")}>{h.icon} {h.name}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhum hábito ativo</p>
            )}
          </WidgetCard>

          {/* Reminders Widget */}
          <WidgetCard title="Lembretes" icon={Bell} action="Ver todos" onAction={() => onNavigate("reminders")} delay={0.2}>
            {overdueReminders.length > 0 && (
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-nectar-red/5 border border-nectar-red/20 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-nectar-red shrink-0" />
                <span className="text-nectar-red font-medium">{overdueReminders.length} lembrete(s) atrasado(s)</span>
              </div>
            )}
            {upcomingReminders.length > 0 ? (
              <ul className="space-y-2">
                {upcomingReminders.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 text-sm p-2 rounded-lg bg-secondary/30 border border-border/20">
                    <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(r.due_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sem lembretes próximos</p>
            )}
          </WidgetCard>
        </div>
      </div>
    </div>
  );
};
