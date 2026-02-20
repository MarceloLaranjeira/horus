import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useFinances } from "@/hooks/useFinances";
import { useHabits } from "@/hooks/useHabits";
import { useReminders } from "@/hooks/useReminders";
import { useProjects } from "@/hooks/useProjects";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useGmail } from "@/hooks/useGmail";
import {
  CheckSquare, DollarSign, Flame, Bell, Clock, AlertTriangle, Plus,
  Trash2, Check, X, TrendingUp, TrendingDown, FolderKanban, BarChart3,
  Calendar, ExternalLink, Loader2, Mail, MailOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { AppView } from "@/pages/AppDashboard";

interface DashboardViewProps {
  onNavigate: (view: AppView) => void;
}

const currentMonthLabel = format(new Date(), "MMMM", { locale: ptBR });

/** Top summary icon card */
const SummaryCard = ({
  icon: Icon, value, label, color, delay = 0,
}: {
  icon: React.ElementType; value: number; label: string; color: string; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-card border border-border/50 card-glow flex-1 min-w-[120px]"
  >
    <Icon className="w-5 h-5" style={{ color }} />
    <span className="text-2xl font-bold">{value}</span>
    <span className="text-[11px] text-muted-foreground text-center leading-tight">{label}</span>
  </motion.div>
);

/** Colored stat box inside sections */
const StatBox = ({ value, label, bgColor, textColor }: {
  value: number; label: string; bgColor: string; textColor: string;
}) => (
  <div className={cn("flex-1 rounded-lg p-3 text-center", bgColor)}>
    <span className={cn("text-xl font-bold block", textColor)}>{value}</span>
    <span className="text-[11px] text-muted-foreground">{label}</span>
  </div>
);

/** Section widget card */
const SectionCard = ({
  children, title, icon: Icon, iconColor, action, onAction, delay = 0,
}: {
  children: React.ReactNode; title: string; icon: React.ElementType; iconColor: string;
  action?: string; onAction?: () => void; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="bg-card border border-border/50 rounded-xl p-5 card-glow flex flex-col"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {action && onAction && (
        <button onClick={onAction} className="text-xs text-muted-foreground hover:text-primary transition-colors">
          {action}
        </button>
      )}
    </div>
    {children}
  </motion.div>
);

export const DashboardView = ({ onNavigate }: DashboardViewProps) => {
  const { data: tasks = [], updateTask, deleteTask, addTask } = useTasks();
  const { transactions, addTransaction, deleteTransaction } = useFinances();
  const { habits, tracks, toggleTrack, addHabit, deleteHabit } = useHabits();
  const { reminders, toggleReminder, deleteReminder, addReminder } = useReminders();
  const { projects } = useProjects();
  const { connected: calConnected, events: calEvents, fetchEvents, loadingEvents } = useGoogleCalendar();
  const { emails: gmailEmails, loading: gmailLoading, fetchUnread: fetchGmailUnread } = useGmail();

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

  // Fetch calendar events when connected
  useEffect(() => {
    if (calConnected) {
      fetchEvents();
      fetchGmailUnread();
    }
  }, [calConnected, fetchEvents, fetchGmailUnread]);

  // Task stats
  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "done");
  const overdueTasks = tasks.filter((t) => t.due_date && isBefore(new Date(t.due_date), today) && t.status !== "done");
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Finance stats
  const currentMonth = format(new Date(), "yyyy-MM");
  const monthFinances = transactions.filter((f) => f.transaction_date.startsWith(currentMonth));
  const totalIncome = monthFinances.filter((f) => f.type === "income").reduce((s, f) => s + Number(f.amount), 0);
  const totalExpenses = monthFinances.filter((f) => f.type === "expense").reduce((s, f) => s + Number(f.amount), 0);
  const balance = totalIncome - totalExpenses;

  // Habit stats
  const activeHabits = habits.filter((h) => h.active);
  const completedHabits = todayTracks.filter((t) => t.completed).length;
  const habitPercent = activeHabits.length > 0 ? Math.round((completedHabits / activeHabits.length) * 100) : 0;

  // Reminder stats
  const pendingReminders = reminders.filter((r) => !r.completed);
  const overdueReminders = reminders.filter((r) => !r.completed && isBefore(new Date(r.due_date), new Date()));
  const upcomingReminders = reminders
    .filter((r) => !r.completed && new Date(r.due_date) >= new Date())
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  // Project stats
  const completedProjects = projects.filter((p) => p.status === "done");
  const activeProjects = projects.filter((p) => p.status === "in_progress" || p.status === "review");
  const pendingProjects = projects.filter((p) => p.status === "backlog" || p.status === "todo");
  const projectCompletionRate = projects.length > 0 ? Math.round((completedProjects.length / projects.length) * 100) : 0;

  // Streak calc for habits
  const streakDays = (() => {
    if (activeHabits.length === 0) return 0;
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 30; i++) {
      const dateStr = format(d, "yyyy-MM-dd");
      const dayTracks = tracks.filter((t) => t.track_date === dateStr && t.completed);
      if (dayTracks.length > 0) streak++;
      else break;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  })();

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

        {/* Summary Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard icon={CheckSquare} value={completedTasks.length} label={`de ${tasks.length} · Concluídas hoje`} color="hsl(var(--nectar-green))" delay={0} />
          <SummaryCard icon={Clock} value={pendingReminders.length} label="Lembretes Pendentes" color="hsl(var(--primary))" delay={0.05} />
          <SummaryCard icon={AlertTriangle} value={overdueReminders.length + overdueTasks.length} label="Itens Atrasados" color="hsl(var(--destructive))" delay={0.1} />
          <SummaryCard icon={FolderKanban} value={projects.length} label="Projetos" color="hsl(var(--nectar-purple, 270 70% 60%))" delay={0.15} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ===== TAREFAS ===== */}
          <SectionCard title={`Tarefas - ${currentMonthLabel}`} icon={CheckSquare} iconColor="hsl(var(--nectar-green))" action="Ver todas" onAction={() => onNavigate("tasks")} delay={0.2}>
            <div className="flex gap-2 mb-4">
              <StatBox value={completedTasks.length} label="Concluídas" bgColor="bg-[hsl(var(--nectar-green))]/10" textColor="text-[hsl(var(--nectar-green))]" />
              <StatBox value={pendingTasks.length} label="Pendentes" bgColor="bg-primary/10" textColor="text-primary" />
              <StatBox value={overdueTasks.length} label="Atrasadas" bgColor="bg-destructive/10" textColor="text-destructive" />
            </div>
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Taxa de Conclusão</span>
                <span className="font-medium text-foreground">{taskCompletionRate}%</span>
              </div>
              <Progress value={taskCompletionRate} className="h-2" />
            </div>
            {/* Recent tasks list */}
            {pendingTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center gap-2 text-sm py-1.5 group">
                <button onClick={() => handleCompleteTask(task.id)} className="w-4 h-4 rounded-full border border-border hover:border-primary shrink-0 transition-colors flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-primary" />
                </button>
                <div className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  task.priority === "urgent" ? "bg-destructive" :
                  task.priority === "high" ? "bg-[hsl(var(--nectar-orange))]" :
                  task.priority === "medium" ? "bg-primary" : "bg-[hsl(var(--nectar-green))]"
                )} />
                <span className="truncate flex-1">{task.title}</span>
                {task.due_date && (
                  <span className="text-[10px] text-muted-foreground">{format(new Date(task.due_date), "dd/MM")}</span>
                )}
              </div>
            ))}
            {showAddTask ? (
              <div className="flex gap-2 mt-3">
                <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Nova tarefa..." className="flex-1 h-8 bg-secondary text-sm" onKeyDown={(e) => e.key === "Enter" && handleAddTask()} autoFocus />
                <Button size="icon" className="h-8 w-8" onClick={handleAddTask}><Check className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowAddTask(false)}><X className="w-3.5 h-3.5" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground hover:text-primary" onClick={() => setShowAddTask(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
              </Button>
            )}
          </SectionCard>

          {/* ===== PROJETOS ===== */}
          <SectionCard title={`Projetos - ${currentMonthLabel}`} icon={FolderKanban} iconColor="hsl(270 70% 60%)" action="Ver todos" onAction={() => onNavigate("projects")} delay={0.25}>
            <div className="flex gap-2 mb-4">
              <StatBox value={completedProjects.length} label="Concluídos" bgColor="bg-[hsl(var(--nectar-green))]/10" textColor="text-[hsl(var(--nectar-green))]" />
              <StatBox value={activeProjects.length} label="Ativos" bgColor="bg-primary/10" textColor="text-primary" />
              <StatBox value={pendingProjects.length} label="Pendentes" bgColor="bg-[hsl(var(--nectar-orange))]/10" textColor="text-[hsl(var(--nectar-orange))]" />
            </div>
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Taxa de Conclusão</span>
                <span className="font-medium text-foreground">{projectCompletionRate}%</span>
              </div>
              <Progress value={projectCompletionRate} className="h-2" />
            </div>
            {projects.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm py-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || "hsl(var(--primary))" }} />
                <span className="truncate flex-1">{p.title}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  p.status === "done" ? "bg-[hsl(var(--nectar-green))]/10 text-[hsl(var(--nectar-green))]" :
                  p.status === "in_progress" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {p.status === "done" ? "Concluído" : p.status === "in_progress" ? "Em andamento" : p.status === "review" ? "Revisão" : "Pendente"}
                </span>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum projeto criado</p>
            )}
          </SectionCard>

          {/* ===== HÁBITOS ===== */}
          <SectionCard title={`Hábitos - ${currentMonthLabel}`} icon={Flame} iconColor="hsl(var(--nectar-orange))" action="Ver hábitos" onAction={() => onNavigate("habits")} delay={0.3}>
            <div className="flex gap-2 mb-4">
              <StatBox value={activeHabits.length} label="Hábitos" bgColor="bg-[hsl(var(--nectar-orange))]/10" textColor="text-[hsl(var(--nectar-orange))]" />
              <StatBox value={streakDays} label="Sequência Média" bgColor="bg-primary/10" textColor="text-primary" />
            </div>
            {activeHabits.length > 0 ? (
              <ul className="space-y-2">
                {activeHabits.slice(0, 5).map((h) => {
                  const done = todayTracks.some((t) => t.habit_id === h.id && t.completed);
                  const weekTracks = tracks.filter((t) => t.habit_id === h.id && t.completed).length;
                  const target = h.target_days_per_week || 7;
                  const progress = Math.min(Math.round((weekTracks / target) * 100), 100);
                  return (
                    <li key={h.id} className="space-y-1 group">
                      <div className="flex items-center gap-2 text-sm">
                        <button
                          onClick={() => toggleTrack.mutate({ habit_id: h.id, date: todayStr })}
                          className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                            done ? "bg-[hsl(var(--nectar-orange))]/20 border-[hsl(var(--nectar-orange))] text-[hsl(var(--nectar-orange))]" : "border-border hover:border-[hsl(var(--nectar-orange))]"
                          )}
                        >
                          {done && <Check className="w-3 h-3" />}
                        </button>
                        <span className={cn("truncate flex-1", done && "text-muted-foreground line-through")}>{h.icon} {h.name}</span>
                        <span className="text-[10px] text-muted-foreground">🔥 {streakDays} 📅 {weekTracks}/{target}</span>
                      </div>
                      <Progress value={progress} className="h-1.5 ml-7" />
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
              <Button variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground hover:text-primary" onClick={() => setShowAddHabit(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
              </Button>
            )}
          </SectionCard>

          {/* ===== RESUMO FINANCEIRO ===== */}
          <SectionCard title={`Resumo Financeiro - ${currentMonthLabel}`} icon={DollarSign} iconColor="hsl(var(--nectar-green))" action="Detalhes" onAction={() => onNavigate("finances")} delay={0.35}>
            <div className="space-y-3 mb-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[hsl(var(--nectar-green))]/5 border border-[hsl(var(--nectar-green))]/10">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
                  <span className="text-sm text-muted-foreground">Receitas do mês</span>
                </div>
                <span className="font-bold text-[hsl(var(--nectar-green))]">
                  R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">Despesas do mês</span>
                </div>
                <span className="font-bold text-destructive">
                  R$ {totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className={cn(
                "flex items-center justify-between py-2 px-3 rounded-lg border",
                balance >= 0 ? "bg-[hsl(var(--nectar-green))]/5 border-[hsl(var(--nectar-green))]/10" : "bg-destructive/5 border-destructive/10"
              )}>
                <span className="text-sm font-medium">Saldo do Mês</span>
                <span className={cn("font-bold text-lg", balance >= 0 ? "text-[hsl(var(--nectar-green))]" : "text-destructive")}>
                  R$ {Math.abs(balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            {showAddFin ? (
              <div className="space-y-2">
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
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-primary" onClick={() => setShowAddFin(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar transação
              </Button>
            )}
          </SectionCard>

        </div>

        {/* ===== GOOGLE CALENDAR ===== */}
        {calConnected && (
          <SectionCard title="Google Calendar" icon={Calendar} iconColor="hsl(187 100% 50%)" delay={0.38}>
            {loadingEvents ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando eventos...
              </div>
            ) : calEvents.length > 0 ? (
              <ul className="space-y-2">
                {calEvents.slice(0, 5).map((event: any, i: number) => {
                  const startDate = event.start?.dateTime || event.start?.date;
                  const isAllDay = !event.start?.dateTime;
                  return (
                    <li key={event.id || i} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-[hsl(187_100%_50%)]/5 border border-[hsl(187_100%_50%)]/10">
                      <div className="w-8 h-8 rounded-lg bg-[hsl(187_100%_50%)]/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-[hsl(187_100%_50%)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{event.summary}</p>
                        <p className="text-xs text-muted-foreground">
                          {isAllDay
                            ? format(new Date(startDate), "dd/MM (EEEE)", { locale: ptBR })
                            : format(new Date(startDate), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento nos próximos 7 dias</p>
            )}
          </SectionCard>
        )}
        {/* ===== GMAIL ===== */}
        {calConnected && (
          <SectionCard title="Gmail - Não Lidos" icon={Mail} iconColor="hsl(var(--destructive))" delay={0.39}>
            {gmailLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando emails...
              </div>
            ) : gmailEmails.length > 0 ? (
              <ul className="space-y-2">
                {gmailEmails.slice(0, 5).map((email: any, i: number) => {
                  const fromName = email.from?.replace(/<.*>/, "").trim() || "Desconhecido";
                  return (
                    <li key={email.id || i} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                      <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                        <MailOpen className="w-4 h-4 text-destructive" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{email.subject || "(Sem assunto)"}</p>
                        <p className="text-xs text-muted-foreground truncate">{fromName}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum email não lido 🎉</p>
            )}
          </SectionCard>
        )}

        {/* ===== LEMBRETES + ANÁLISE ROW ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEMBRETES */}
          <SectionCard title="Lembretes" icon={Bell} iconColor="hsl(var(--destructive))" action="Ver todos" onAction={() => onNavigate("reminders")} delay={0.4}>
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
              <Button variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground hover:text-primary" onClick={() => setShowAddRem(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
              </Button>
            )}
          </SectionCard>

          {/* ANÁLISE IA */}
          <SectionCard title="Análise Maxx" icon={BarChart3} iconColor="hsl(var(--primary))" action="Gerar análise" onAction={() => onNavigate("chat")} delay={0.45}>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-2">Visão geral da semana</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-lg font-bold text-[hsl(var(--nectar-green))]">{completedTasks.length}</span>
                    <p className="text-[10px] text-muted-foreground">Tarefas feitas</p>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-primary">{habitPercent}%</span>
                    <p className="text-[10px] text-muted-foreground">Hábitos</p>
                  </div>
                  <div>
                    <span className={cn("text-lg font-bold", balance >= 0 ? "text-[hsl(var(--nectar-green))]" : "text-destructive")}>
                      {balance >= 0 ? "+" : "-"}R${Math.abs(balance).toLocaleString("pt-BR")}
                    </span>
                    <p className="text-[10px] text-muted-foreground">Saldo</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Peça ao Maxx uma análise completa dos seus dados para insights personalizados e plano de ação.
              </p>
              <Button variant="outline" size="sm" className="w-full border-primary/20 text-primary hover:bg-primary/10" onClick={() => onNavigate("chat")}>
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Solicitar Análise Completa
              </Button>
            </div>
          </SectionCard>
        </div>

      </div>
    </div>
  );
};
