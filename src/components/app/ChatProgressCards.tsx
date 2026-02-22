import { useMemo } from "react";
import { CheckSquare, Flame, DollarSign, Bell, TrendingUp, TrendingDown, FolderKanban } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useFinances } from "@/hooks/useFinances";
import { useReminders } from "@/hooks/useReminders";
import { useProjects } from "@/hooks/useProjects";
import type { AppView } from "@/pages/AppDashboard";

interface ChatProgressCardsProps {
  onNavigate: (view: AppView) => void;
}

export const ChatProgressCards = ({ onNavigate }: ChatProgressCardsProps) => {
  const taskQuery = useTasks();
  const { habits, tracks } = useHabits();
  const financeQuery = useFinances();
  const { reminders } = useReminders();
  const { projects } = useProjects();

  const tasks = taskQuery.data;
  const transactions = financeQuery.transactions;

  const taskStats = useMemo(() => {
    const all = tasks || [];
    const pending = all.filter((t) => t.status !== "done").length;
    const done = all.filter((t) => t.status === "done").length;
    const total = all.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { pending, done, total, pct };
  }, [tasks]);

  const habitStats = useMemo(() => {
    const active = (habits || []).filter((h) => h.active);
    const today = new Date().toISOString().split("T")[0];
    const todayTracks = (tracks || []).filter((t) => t.track_date === today);
    const completed = todayTracks.filter((t) => t.completed).length;
    const total = active.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, pct };
  }, [habits, tracks]);

  const financeStats = useMemo(() => {
    const all = transactions || [];
    const income = all.filter((f) => f.type === "income").reduce((s, f) => s + Number(f.amount), 0);
    const expense = all.filter((f) => f.type === "expense").reduce((s, f) => s + Number(f.amount), 0);
    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);

  const reminderStats = useMemo(() => {
    const all = reminders || [];
    const pending = all.filter((r) => !r.completed).length;
    const overdue = all.filter((r) => !r.completed && new Date(r.due_date) < new Date()).length;
    return { pending, overdue };
  }, [reminders]);

  const projectStats = useMemo(() => {
    const all = projects || [];
    const inProgress = all.filter((p) => p.status === "in_progress").length;
    const done = all.filter((p) => p.status === "done").length;
    const total = all.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { inProgress, done, total, pct };
  }, [projects]);

  const cards = [
    {
      key: "tasks",
      label: "Tarefas",
      icon: CheckSquare,
      value: `${taskStats.done}/${taskStats.total}`,
      sub: `${taskStats.pending} pendentes`,
      pct: taskStats.pct,
      color: "text-[hsl(var(--nectar-green))]",
      bg: "bg-[hsl(var(--nectar-green))]/8",
      border: "border-[hsl(var(--nectar-green))]/20",
      barColor: "bg-[hsl(var(--nectar-green))]",
      view: "tasks" as AppView,
    },
    {
      key: "habits",
      label: "Hábitos Hoje",
      icon: Flame,
      value: `${habitStats.completed}/${habitStats.total}`,
      sub: `${habitStats.pct}% concluído`,
      pct: habitStats.pct,
      color: "text-[hsl(var(--nectar-gold))]",
      bg: "bg-[hsl(var(--nectar-gold))]/8",
      border: "border-[hsl(var(--nectar-gold))]/20",
      barColor: "bg-[hsl(var(--nectar-gold))]",
      view: "habits" as AppView,
    },
    {
      key: "finances",
      label: "Finanças",
      icon: financeStats.balance >= 0 ? TrendingUp : TrendingDown,
      value: `R$ ${Math.abs(financeStats.balance).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      sub: financeStats.balance >= 0 ? "saldo positivo" : "saldo negativo",
      pct: null,
      color: financeStats.balance >= 0 ? "text-[hsl(var(--nectar-green))]" : "text-destructive",
      bg: financeStats.balance >= 0 ? "bg-[hsl(var(--nectar-green))]/8" : "bg-destructive/8",
      border: financeStats.balance >= 0 ? "border-[hsl(var(--nectar-green))]/20" : "border-destructive/20",
      barColor: null,
      view: "finances" as AppView,
    },
    {
      key: "reminders",
      label: "Lembretes",
      icon: Bell,
      value: `${reminderStats.pending}`,
      sub: reminderStats.overdue > 0 ? `${reminderStats.overdue} atrasados` : "em dia",
      pct: null,
      color: reminderStats.overdue > 0 ? "text-destructive" : "text-primary",
      bg: reminderStats.overdue > 0 ? "bg-destructive/8" : "bg-primary/8",
      border: reminderStats.overdue > 0 ? "border-destructive/20" : "border-primary/20",
      barColor: null,
      view: "reminders" as AppView,
    },
    {
      key: "projects",
      label: "Projetos",
      icon: FolderKanban,
      value: `${projectStats.total}`,
      sub: `${projectStats.inProgress} em andamento`,
      pct: projectStats.pct,
      color: "text-[hsl(var(--nectar-purple))]",
      bg: "bg-[hsl(var(--nectar-purple))]/8",
      border: "border-[hsl(var(--nectar-purple))]/20",
      barColor: "bg-[hsl(var(--nectar-purple))]",
      view: "projects" as AppView,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.button
            key={card.key}
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: 0.1 + i * 0.1, 
              duration: 0.5, 
              type: "spring", 
              stiffness: 260, 
              damping: 20 
            }}
            whileHover={{ 
              scale: 1.05, 
              y: -4,
              transition: { duration: 0.2, type: "spring", stiffness: 400 }
            }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate(card.view)}
            className={cn(
              "flex flex-col gap-2 p-3 rounded-xl border text-left",
              "transition-[box-shadow,border-color] duration-300",
              card.bg, card.border,
              "hover:shadow-[0_8px_30px_-8px_hsl(var(--cyan)/0.25)] hover:border-[hsl(var(--cyan)/0.3)]",
              "cursor-pointer group"
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className={cn("w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6", card.color)} />
              <span className="text-[11px] font-medium text-muted-foreground truncate transition-colors duration-300 group-hover:text-foreground">{card.label}</span>
            </div>
            <span className={cn("text-lg font-bold leading-none", card.color)}>{card.value}</span>
            <span className="text-[10px] text-muted-foreground">{card.sub}</span>
            {card.pct !== null && (
              <div className="w-full h-1 rounded-full bg-secondary/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${card.pct}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                  className={cn("h-full rounded-full", card.barColor)}
                />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
