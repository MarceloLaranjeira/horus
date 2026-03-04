import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useReminders } from "@/hooks/useReminders";
import {
  MessageSquare, CheckSquare, DollarSign, Bell, FolderKanban,
  Flame, LayoutDashboard, Settings, LogOut, Brain, StickyNote,
  CalendarDays, Mail, MessageCircle, Bot, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isPast, isToday, parseISO } from "date-fns";
import type { AppView } from "@/pages/AppDashboard";

interface ModuleItem {
  id: AppView;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

interface ModuleGroup {
  id: string;
  label: string;
  color: string;
  bg: string;
  items: ModuleItem[];
}

interface AppSidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export const AppSidebar = ({
  activeView,
  onViewChange,
  collapsed,
  onToggle,
}: AppSidebarProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { data: tasks = [] } = useTasks();
  const { reminders } = useReminders();

  const pendingTasks = tasks.filter((t) => t.status !== "done").length;
  const overdueReminders = reminders.filter(
    (r) =>
      !r.completed &&
      isPast(parseISO(r.due_date)) &&
      !isToday(parseISO(r.due_date))
  ).length;

  const groups: ModuleGroup[] = [
    {
      id: "central",
      label: "Central",
      color: "#4F8EF7",
      bg: "rgba(79,142,247,0.10)",
      items: [
        { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { id: "chat", icon: MessageSquare, label: "Horus IA" },
      ],
    },
    {
      id: "trabalho",
      label: "Trabalho",
      color: "#22C55E",
      bg: "rgba(34,197,94,0.10)",
      items: [
        {
          id: "tasks",
          icon: CheckSquare,
          label: "Tarefas",
          badge: pendingTasks || undefined,
        },
        { id: "projects", icon: FolderKanban, label: "Projetos" },
        { id: "notes", icon: StickyNote, label: "Notas" },
      ],
    },
    {
      id: "financeiro",
      label: "Financeiro",
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.10)",
      items: [
        { id: "finances", icon: DollarSign, label: "Finanças" },
        { id: "analysis", icon: Brain, label: "Análise" },
      ],
    },
    {
      id: "produtividade",
      label: "Produtividade",
      color: "#A855F7",
      bg: "rgba(168,85,247,0.10)",
      items: [
        { id: "habits", icon: Flame, label: "Hábitos" },
        {
          id: "reminders",
          icon: Bell,
          label: "Lembretes",
          badge: overdueReminders || undefined,
        },
      ],
    },
    {
      id: "comunicacao",
      label: "Comunicação",
      color: "#06B6D4",
      bg: "rgba(6,182,212,0.10)",
      items: [
        { id: "agenda", icon: CalendarDays, label: "Agenda" },
        { id: "gmail", icon: Mail, label: "Gmail" },
        { id: "whatsapp", icon: MessageCircle, label: "WhatsApp" },
        { id: "telegram", icon: Bot, label: "Telegram" },
      ],
    },
    {
      id: "sistema",
      label: "Sistema",
      color: "#94A3B8",
      bg: "rgba(148,163,184,0.08)",
      items: [{ id: "settings", icon: Settings, label: "Configurações" }],
    },
  ];

  const isActive = (id: AppView) =>
    activeView === id || activeView.startsWith(id + "-");

  const getActiveGroup = () =>
    groups.find((g) => g.items.some((i) => isActive(i.id)));

  return (
    <aside
      className={cn(
        "flex flex-col h-screen shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
        "border-r",
        collapsed ? "w-16" : "w-60"
      )}
      style={{
        background: "linear-gradient(180deg, #0D1117 0%, #0A0E18 100%)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Logo / Brand ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center shrink-0 border-b h-14",
          collapsed ? "justify-center px-0" : "gap-3 px-4"
        )}
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-black text-sm"
          style={{
            background: "linear-gradient(135deg, #4F8EF7 0%, #7C3AED 100%)",
            boxShadow: "0 0 20px rgba(79,142,247,0.35)",
          }}
        >
          H
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm tracking-wide leading-none">
              HORUS
            </p>
            <p
              className="text-[9px] tracking-[0.18em] mt-0.5 font-medium"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              ERP PESSOAL
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-0.5 erp-scrollbar">
        {groups.map((group) => (
          <div key={group.id}>
            {/* Group label */}
            {!collapsed ? (
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <span
                  className="text-[9px] font-bold tracking-[0.18em] uppercase"
                  style={{ color: group.color + "80" }}
                >
                  {group.label}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: group.color + "18" }}
                />
              </div>
            ) : (
              <div
                className="mx-auto my-2 h-px w-8"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
            )}

            {/* Items */}
            {group.items.map((item) => {
              const active = isActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "relative w-full flex items-center transition-all duration-150 group",
                    "text-left outline-none focus-visible:ring-1 focus-visible:ring-white/20",
                    collapsed
                      ? "justify-center h-10 px-0"
                      : "gap-3 h-9 px-4",
                    active ? "text-white" : "text-white/40 hover:text-white/70"
                  )}
                  style={{
                    background: active ? group.bg : undefined,
                  }}
                >
                  {/* Left accent bar */}
                  {active && (
                    <span
                      className="absolute left-0 inset-y-1 w-[3px] rounded-r-full"
                      style={{ background: group.color }}
                    />
                  )}

                  {/* Icon */}
                  <item.icon
                    className="w-[15px] h-[15px] shrink-0"
                    style={{ color: active ? group.color : undefined }}
                  />

                  {/* Label */}
                  {!collapsed && (
                    <span className="flex-1 text-[13px] font-medium leading-none">
                      {item.label}
                    </span>
                  )}

                  {/* Badge */}
                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        "flex items-center justify-center rounded-full font-bold text-white",
                        collapsed
                          ? "absolute top-1 right-1.5 w-4 h-4 text-[8px]"
                          : "h-[18px] min-w-[18px] px-1 text-[10px]"
                      )}
                      style={{ background: "#EF4444" }}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}

                  {/* Tooltip for collapsed mode */}
                  {collapsed && (
                    <span
                      className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity duration-150 font-medium"
                      style={{ background: "#1E2533", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
                    >
                      {item.label}
                      {item.badge !== undefined && (
                        <span className="ml-1.5 text-[10px] text-red-400">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div
        className="shrink-0 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        {/* User row */}
        <div
          className={cn(
            "flex items-center py-3",
            collapsed ? "justify-center px-0" : "gap-2.5 px-4"
          )}
        >
          <div
            className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold"
            style={{
              background: "rgba(79,142,247,0.18)",
              color: "#4F8EF7",
            }}
          >
            {user?.email?.charAt(0).toUpperCase() ?? "U"}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-white/60 text-[11px] font-medium truncate leading-none">
                  {user?.email?.split("@")[0] ?? "Usuário"}
                </p>
                <p
                  className="text-[9px] mt-0.5"
                  style={{ color: "rgba(255,255,255,0.22)" }}
                >
                  Conta pessoal
                </p>
              </div>
              <button
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
                className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Sair"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center justify-center py-2 border-t transition-all",
            "text-white/20 hover:text-white/50 hover:bg-white/3"
          )}
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </aside>
  );
};
