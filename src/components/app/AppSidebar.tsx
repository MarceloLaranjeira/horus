import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useReminders } from "@/hooks/useReminders";
import {
  MessageSquare,
  CheckSquare,
  DollarSign,
  Bell,
  FolderKanban,
  Flame,
  LayoutDashboard,
  Settings,
  LogOut,
  Brain,
  StickyNote,
  CalendarDays,
  Mail,
  MessageCircle,
  Bot,
  ChevronLeft,
  ChevronRight,
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
  activeBg: string;
  items: ModuleItem[];
}

interface AppSidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const panelSurface = {
  border: "hsl(var(--sidebar-border) / 0.75)",
  text: "hsl(var(--sidebar-foreground))",
  mutedText: "hsl(var(--sidebar-foreground) / 0.72)",
  faintText: "hsl(var(--sidebar-foreground) / 0.48)",
  softerText: "hsl(var(--sidebar-foreground) / 0.36)",
  hover: "hsl(var(--sidebar-accent) / 0.58)",
  tooltip: "hsl(var(--popover))",
};

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

  const pendingTasks = tasks.filter((task) => task.status !== "done").length;
  const overdueReminders = reminders.filter(
    (reminder) =>
      !reminder.completed &&
      isPast(parseISO(reminder.due_date)) &&
      !isToday(parseISO(reminder.due_date))
  ).length;

  const groups: ModuleGroup[] = [
    {
      id: "central",
      label: "Central",
      color: "#3B82F6",
      activeBg: "rgba(59, 130, 246, 0.16)",
      items: [
        { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { id: "chat", icon: MessageSquare, label: "Horus IA" },
      ],
    },
    {
      id: "work",
      label: "Trabalho",
      color: "#22C55E",
      activeBg: "rgba(34, 197, 94, 0.16)",
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
      id: "finance",
      label: "Financeiro",
      color: "#F59E0B",
      activeBg: "rgba(245, 158, 11, 0.16)",
      items: [
        { id: "finances", icon: DollarSign, label: "Financas" },
        { id: "analysis", icon: Brain, label: "Analise" },
      ],
    },
    {
      id: "productivity",
      label: "Produtividade",
      color: "#8B5CF6",
      activeBg: "rgba(139, 92, 246, 0.16)",
      items: [
        { id: "habits", icon: Flame, label: "Habitos" },
        {
          id: "reminders",
          icon: Bell,
          label: "Lembretes",
          badge: overdueReminders || undefined,
        },
      ],
    },
    {
      id: "comms",
      label: "Comunicacao",
      color: "#06B6D4",
      activeBg: "rgba(6, 182, 212, 0.16)",
      items: [
        { id: "agenda", icon: CalendarDays, label: "Agenda" },
        { id: "gmail", icon: Mail, label: "Gmail" },
        { id: "whatsapp", icon: MessageCircle, label: "WhatsApp" },
        { id: "telegram", icon: Bot, label: "Telegram" },
      ],
    },
    {
      id: "system",
      label: "Sistema",
      color: "#64748B",
      activeBg: "rgba(100, 116, 139, 0.18)",
      items: [{ id: "settings", icon: Settings, label: "Configuracoes" }],
    },
  ];

  const isActive = (id: AppView) => activeView === id || activeView.startsWith(`${id}-`);

  return (
    <aside data-sidebar="sidebar"
      className={cn(
        "flex h-screen shrink-0 flex-col overflow-hidden border-r transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
      style={{
        borderColor: panelSurface.border,
        background:
          "linear-gradient(180deg, hsl(var(--sidebar) / 0.97) 0%, hsl(var(--sidebar) / 0.93) 100%)",
        color: panelSurface.text,
        backdropFilter: "blur(18px)",
      }}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b",
          collapsed ? "justify-center px-0" : "gap-3 px-4"
        )}
        style={{ borderColor: panelSurface.border }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
          style={{
            background: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)",
            boxShadow: "0 10px 24px rgba(14, 165, 233, 0.35)",
          }}
        >
          H
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-none tracking-wide">HORUS</p>
            <p className="mt-1 text-[10px] font-medium tracking-[0.16em]" style={{ color: panelSurface.faintText }}>
              SAAS ENGINE
            </p>
          </div>
        )}
      </div>

      <nav className="erp-scrollbar flex-1 space-y-1 overflow-y-auto overflow-x-hidden py-2">
        {groups.map((group) => (
          <div key={group.id}>
            {!collapsed ? (
              <div className="flex items-center gap-2 px-4 pb-1 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: `${group.color}B8` }}>
                  {group.label}
                </span>
                <div className="h-px flex-1" style={{ background: `${group.color}2E` }} />
              </div>
            ) : (
              <div className="mx-auto my-2 h-px w-8" style={{ background: panelSurface.border }} />
            )}

            {group.items.map((item) => {
              const active = isActive(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex w-full items-center text-left outline-none transition-all duration-150",
                    "focus-visible:ring-1 focus-visible:ring-primary/40",
                    collapsed ? "h-10 justify-center px-0" : "h-9 gap-3 px-4"
                  )}
                  style={{
                    color: active ? panelSurface.text : panelSurface.mutedText,
                    background: active ? `linear-gradient(90deg, ${group.activeBg}, transparent)` : "transparent",
                  }}
                  onMouseEnter={(event) => {
                    if (!active) {
                      event.currentTarget.style.background = panelSurface.hover;
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (!active) {
                      event.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {active && (
                    <span
                      className="absolute left-0 inset-y-1 w-[3px] rounded-r-full"
                      style={{ background: group.color }}
                    />
                  )}

                  <item.icon
                    className="h-[15px] w-[15px] shrink-0"
                    style={{ color: active ? group.color : panelSurface.mutedText }}
                  />

                  {!collapsed && <span className="flex-1 text-[13px] font-medium leading-none">{item.label}</span>}

                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        "flex items-center justify-center rounded-full text-white",
                        collapsed
                          ? "absolute right-1.5 top-1 h-4 w-4 text-[8px] font-bold"
                          : "h-[18px] min-w-[18px] px-1 text-[10px] font-semibold"
                      )}
                      style={{ background: "#EF4444" }}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}

                  {collapsed && (
                    <span
                      className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      style={{
                        background: panelSurface.tooltip,
                        color: "hsl(var(--popover-foreground))",
                        border: `1px solid ${panelSurface.border}`,
                        boxShadow: "0 10px 26px rgba(0, 0, 0, 0.18)",
                      }}
                    >
                      {item.label}
                      {item.badge !== undefined && (
                        <span className="ml-1.5 text-[10px] text-red-500">{item.badge}</span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t" style={{ borderColor: panelSurface.border }}>
        <div className={cn("flex items-center py-3", collapsed ? "justify-center px-0" : "gap-2.5 px-4")}>
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
            style={{
              background: "hsl(var(--sidebar-primary) / 0.17)",
              color: "hsl(var(--sidebar-primary))",
            }}
          >
            {user?.email?.charAt(0).toUpperCase() ?? "U"}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium leading-none" style={{ color: panelSurface.mutedText }}>
                  {user?.email?.split("@")[0] ?? "Usuario"}
                </p>
                <p className="mt-0.5 text-[9px]" style={{ color: panelSurface.softerText }}>
                  Plano pessoal
                </p>
              </div>
              <button
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
                className="rounded-lg p-1.5 transition-all"
                style={{ color: panelSurface.softerText }}
                title="Sair"
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                  event.currentTarget.style.color = "#EF4444";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "transparent";
                  event.currentTarget.style.color = panelSurface.softerText;
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center border-t py-2 transition-all"
          style={{ borderColor: panelSurface.border, color: panelSurface.softerText }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = panelSurface.hover;
            event.currentTarget.style.color = panelSurface.text;
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = "transparent";
            event.currentTarget.style.color = panelSurface.softerText;
          }}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>
    </aside>
  );
};

