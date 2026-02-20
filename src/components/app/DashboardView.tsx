import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useFinances } from "@/hooks/useFinances";
import { useHabits } from "@/hooks/useHabits";
import { useReminders } from "@/hooks/useReminders";
import {
  CheckSquare, DollarSign, Flame, Bell, ArrowRight, TrendingUp, TrendingDown,
  Clock, AlertTriangle, Plus, Trash2, Check, X, Edit2,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { AppView } from "@/pages/AppDashboard";

interface DashboardViewProps {
  onNavigate: (view: AppView) => void;
}

const WidgetCard = ({
  children, title, icon: Icon, action, onAction, delay = 0,
}: {
  children: React.ReactNode; title: string; icon: React.ElementType;
  action?: string; onAction?: () => void; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
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
  const { data: tasks = [], updateTask, deleteTask, addTask } = useTasks();
  const { transactions, addTransaction, deleteTransaction } = useFinances();
  const { habits, tracks, toggleTrack, addHabit, deleteHabit } = useHabits();
  const { reminders, toggleReminder, deleteReminder, addReminder } = useReminders();

  // Inline add states
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [newFinDesc, setNewFinDesc] = useState("");
  const [newFinAmount, setNewFinAmount] = useState("");
  const [newFinType, setNewFinType] = useState<"income" | "expense">("expense");
  const [showAddFin, setShowAddFin] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newRemTitle, setNewRemTitle] = useState("");
  const [showAddRem, setShowAddRem] = useState(false);

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
    .slice(0, 5);

  const overdueReminders = reminders.filter((r) => !r.completed && isBefore(new Date(r.due_date), new Date()));

  // Handlers
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask.mutate({ title: newTaskTitle, due_date: todayStr }, {
      onSuccess: () => { setNewTaskTitle(""); setShowAddTask(false); toast.success("Tarefa criada!"); },
    });
  };

  const handleCompleteTask = (id: string) => {
    updateTask.mutate({ id, status: "done", completed_at: new Date().toISOString() }, {
      onSuccess: () => toast.success("Tarefa concluída!"),
    });
  };

  const handleAddFin = () => {
    if (!newFinDesc.trim() || !newFinAmount) return;
    addTransaction.mutate({ type: newFinType, amount: parseFloat(newFinAmount), description: newFinDesc }, {
      onSuccess: () => { setNewFinDesc(""); setNewFinAmount(""); setShowAddFin(false); toast.success("Transação adicionada!"); },
    });
  };

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return;
    addHabit.mutate({ name: newHabitName }, {
      onSuccess: () => { setNewHabitName(""); setShowAddHabit(false); toast.success("Hábito criado!"); },
    });
  };

  const handleAddRem = () => {
    if (!newRemTitle.trim()) return;
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 1);
    addReminder.mutate({ title: newRemTitle, due_date: dueDate.toISOString() }, {
      onSuccess: () => { setNewRemTitle(""); setShowAddRem(false); toast.success("Lembrete criado!"); },
    });
  };

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

          {/* ===== TASKS WIDGET ===== */}
          <WidgetCard title="Tarefas do Dia" icon={CheckSquare} action="Ver todas" onAction={() => onNavigate("tasks-today")} delay={0.05}>
            <div className="flex gap-2 mb-4">
              <StatBadge label="Hoje" value={todayTasks.length} color="text-primary" />
              <StatBadge label="Atrasadas" value={overdueTasks.length} color={overdueTasks.length > 0 ? "text-destructive" : "text-muted-foreground"} />
              <StatBadge label="Feitas" value={completedToday.length} color="text-[hsl(var(--nectar-green))]" />
            </div>
            {todayTasks.length > 0 ? (
              <ul className="space-y-2">
                {todayTasks.slice(0, 4).map((task) => (
                  <li key={task.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-secondary/30 border border-border/20 group">
                    <button onClick={() => handleCompleteTask(task.id)} className="w-5 h-5 rounded-full border border-border hover:border-primary hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                      <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                    </button>
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      task.priority === "urgent" ? "bg-destructive" :
                      task.priority === "high" ? "bg-accent" :
                      task.priority === "medium" ? "bg-primary" : "bg-[hsl(var(--nectar-green))]"
                    )} />
                    <span className="truncate flex-1">{task.title}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => deleteTask.mutate(task.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </li>
                ))}
                {todayTasks.length > 4 && (
                  <p className="text-xs text-muted-foreground text-center">+{todayTasks.length - 4} mais</p>
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa para hoje 🎉</p>
            )}
            {showAddTask ? (
              <div className="flex gap-2 mt-3">
                <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Nova tarefa..." className="flex-1 h-8 bg-secondary text-sm" onKeyDown={(e) => e.key === "Enter" && handleAddTask()} autoFocus />
                <Button size="icon" className="h-8 w-8" onClick={handleAddTask}><Check className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowAddTask(false)}><X className="w-3.5 h-3.5" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="mt-3 w-full text-muted-foreground hover:text-primary" onClick={() => setShowAddTask(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar tarefa
              </Button>
            )}
          </WidgetCard>

          {/* ===== FINANCES WIDGET ===== */}
          <WidgetCard title="Resumo Financeiro" icon={DollarSign} action="Detalhes" onAction={() => onNavigate("finances")} delay={0.1}>
            <div className="flex gap-2 mb-4">
              <StatBadge label="Receitas" value={`R$ ${totalIncome.toLocaleString("pt-BR")}`} color="text-[hsl(var(--nectar-green))]" />
              <StatBadge label="Despesas" value={`R$ ${totalExpenses.toLocaleString("pt-BR")}`} color="text-destructive" />
            </div>
            <div className={cn(
              "flex items-center justify-center gap-2 p-3 rounded-lg border mb-3",
              balance >= 0 ? "bg-[hsl(var(--nectar-green))]/5 border-[hsl(var(--nectar-green))]/20" : "bg-destructive/5 border-destructive/20"
            )}>
              {balance >= 0 ? <TrendingUp className="w-4 h-4 text-[hsl(var(--nectar-green))]" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
              <span className={cn("font-bold text-lg", balance >= 0 ? "text-[hsl(var(--nectar-green))]" : "text-destructive")}>
                R$ {Math.abs(balance).toLocaleString("pt-BR")}
              </span>
              <span className="text-xs text-muted-foreground">saldo</span>
            </div>
            {/* Recent transactions */}
            {monthFinances.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm py-1.5 group">
                <div className="flex items-center gap-2 truncate">
                  {t.type === "income" ? <TrendingUp className="w-3 h-3 text-[hsl(var(--nectar-green))] shrink-0" /> : <TrendingDown className="w-3 h-3 text-destructive shrink-0" />}
                  <span className="truncate">{t.description}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn("text-xs font-medium", t.type === "income" ? "text-[hsl(var(--nectar-green))]" : "text-destructive")}>
                    {t.type === "income" ? "+" : "-"}R$ {Number(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => deleteTransaction.mutate(t.id)}>
                    <Trash2 className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </div>
            ))}
            {showAddFin ? (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <Input value={newFinDesc} onChange={(e) => setNewFinDesc(e.target.value)} placeholder="Descrição..." className="flex-1 h-8 bg-secondary text-sm" onKeyDown={(e) => e.key === "Enter" && handleAddFin()} autoFocus />
                  <Input type="number" value={newFinAmount} onChange={(e) => setNewFinAmount(e.target.value)} placeholder="R$" className="w-20 h-8 bg-secondary text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={newFinType === "expense" ? "destructive" : "outline"} className="flex-1 h-7 text-xs" onClick={() => setNewFinType("expense")}>Despesa</Button>
                  <Button size="sm" variant={newFinType === "income" ? "default" : "outline"} className="flex-1 h-7 text-xs" onClick={() => setNewFinType("income")}>Receita</Button>
                  <Button size="icon" className="h-7 w-7" onClick={handleAddFin}><Check className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowAddFin(false)}><X className="w-3 h-3" /></Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground hover:text-primary" onClick={() => setShowAddFin(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar transação
              </Button>
            )}
          </WidgetCard>

          {/* ===== HABITS WIDGET ===== */}
          <WidgetCard title="Progresso de Hábitos" icon={Flame} action="Ver hábitos" onAction={() => onNavigate("habits")} delay={0.15}>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"
                    strokeDasharray={`${habitPercent} ${100 - habitPercent}`} strokeLinecap="round" />
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
                {activeHabits.slice(0, 5).map((h) => {
                  const done = todayTracks.some((t) => t.habit_id === h.id && t.completed);
                  return (
                    <li key={h.id} className="flex items-center gap-2 text-sm group">
                      <button
                        onClick={() => toggleTrack.mutate({ habit_id: h.id, date: todayStr })}
                        className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                          done ? "bg-primary/20 border-primary text-primary" : "border-border hover:border-primary"
                        )}
                      >
                        {done && <Check className="w-3 h-3" />}
                      </button>
                      <span className={cn("truncate flex-1", done && "text-muted-foreground line-through")}>{h.icon} {h.name}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => deleteHabit.mutate(h.id)}>
                        <Trash2 className="w-2.5 h-2.5" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhum hábito ativo</p>
            )}
            {showAddHabit ? (
              <div className="flex gap-2 mt-3">
                <Input value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder="Novo hábito..." className="flex-1 h-8 bg-secondary text-sm" onKeyDown={(e) => e.key === "Enter" && handleAddHabit()} autoFocus />
                <Button size="icon" className="h-8 w-8" onClick={handleAddHabit}><Check className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowAddHabit(false)}><X className="w-3.5 h-3.5" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="mt-3 w-full text-muted-foreground hover:text-primary" onClick={() => setShowAddHabit(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar hábito
              </Button>
            )}
          </WidgetCard>

          {/* ===== REMINDERS WIDGET ===== */}
          <WidgetCard title="Lembretes" icon={Bell} action="Ver todos" onAction={() => onNavigate("reminders")} delay={0.2}>
            {overdueReminders.length > 0 && (
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                <span className="text-destructive font-medium">{overdueReminders.length} lembrete(s) atrasado(s)</span>
              </div>
            )}
            {upcomingReminders.length > 0 ? (
              <ul className="space-y-2">
                {upcomingReminders.map((r) => (
                  <li key={r.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-secondary/30 border border-border/20 group">
                    <button
                      onClick={() => toggleReminder.mutate({ id: r.id, completed: true })}
                      className="w-5 h-5 rounded-full border border-border hover:border-primary hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors"
                    >
                      <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(r.due_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => deleteReminder.mutate(r.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sem lembretes próximos</p>
            )}
            {showAddRem ? (
              <div className="flex gap-2 mt-3">
                <Input value={newRemTitle} onChange={(e) => setNewRemTitle(e.target.value)} placeholder="Novo lembrete..." className="flex-1 h-8 bg-secondary text-sm" onKeyDown={(e) => e.key === "Enter" && handleAddRem()} autoFocus />
                <Button size="icon" className="h-8 w-8" onClick={handleAddRem}><Check className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowAddRem(false)}><X className="w-3.5 h-3.5" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="mt-3 w-full text-muted-foreground hover:text-primary" onClick={() => setShowAddRem(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar lembrete
              </Button>
            )}
          </WidgetCard>

        </div>
      </div>
    </div>
  );
};
