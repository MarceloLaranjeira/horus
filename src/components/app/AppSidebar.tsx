import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useReminders } from "@/hooks/useReminders";
import {
  MessageSquare, CheckSquare, DollarSign, Bell, FolderKanban,
  Flame, LayoutDashboard, Settings, LogOut, Brain, StickyNote,
  CalendarDays, Mail, MessageCircle, Bot,
} from "lucide-react";
import horusLogo from "@/assets/horus-logo.png";
import type { AppView } from "@/pages/AppDashboard";
import {
  Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarFooter, SidebarHeader, SidebarGroup,
  SidebarGroupLabel, SidebarGroupContent, useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { isPast, isToday, parseISO } from "date-fns";

interface NavItem {
  id: AppView;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

const mainItems: Omit<NavItem, "badge">[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "chat", icon: MessageSquare, label: "Horus IA" },
];

const communicationItems: Omit<NavItem, "badge">[] = [
  { id: "agenda", icon: CalendarDays, label: "Google Calendar" },
  { id: "gmail", icon: Mail, label: "Gmail" },
  { id: "whatsapp", icon: MessageCircle, label: "WhatsApp" },
  { id: "telegram", icon: Bot, label: "Telegram" },
];

const settingsItems: Omit<NavItem, "badge">[] = [
  { id: "settings", icon: Settings, label: "Configurações" },
];

interface AppSidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

export const AppSidebar = ({ activeView, onViewChange }: AppSidebarProps) => {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";

  const { data: tasks = [] } = useTasks();
  const { reminders } = useReminders();

  const pendingTasks = tasks.filter(t => t.status !== "done").length;
  const overdueReminders = reminders.filter(
    r => !r.completed && isPast(parseISO(r.due_date)) && !isToday(parseISO(r.due_date))
  ).length;

  const modulesItems: NavItem[] = [
    { id: "tasks", icon: CheckSquare, label: "Tarefas", badge: pendingTasks > 0 ? pendingTasks : undefined },
    { id: "projects", icon: FolderKanban, label: "Projetos" },
    { id: "reminders", icon: Bell, label: "Lembretes", badge: overdueReminders > 0 ? overdueReminders : undefined },
    { id: "habits", icon: Flame, label: "Hábitos" },
    { id: "finances", icon: DollarSign, label: "Finanças" },
    { id: "notes", icon: StickyNote, label: "Notas" },
    { id: "analysis", icon: Brain, label: "Análise Horus" },
  ];

  const isActiveGroup = (item: { id: AppView }) =>
    activeView === item.id || activeView.startsWith(item.id + "-");

  const renderItems = (items: NavItem[]) =>
    items.map((item) => (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          onClick={() => onViewChange(item.id)}
          isActive={isActiveGroup(item)}
          tooltip={item.label}
          className="relative"
        >
          <item.icon className={cn("shrink-0", isActiveGroup(item) && "text-[hsl(var(--nectar-gold))]")} />
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && !collapsed && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/90 px-1 text-[10px] font-medium text-destructive-foreground">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
          {item.badge !== undefined && collapsed && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive/90 px-0.5 text-[9px] font-medium text-destructive-foreground">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-1">
          <img src={horusLogo} alt="Horus" className="w-8 h-8 rounded-xl object-cover shrink-0" />
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-lg">Horus</span>
              <span className="text-[10px] text-muted-foreground tracking-wide">Sua IA de produtividade</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(modulesItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Apps & Comunicação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(communicationItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(settingsItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => { await signOut(); navigate("/"); }}
              tooltip="Sair"
            >
              <LogOut className="shrink-0" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
