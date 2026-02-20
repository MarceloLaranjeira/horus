import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  CheckSquare,
  BarChart3,
  DollarSign,
  Bell,
  FolderKanban,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Flame,
  LayoutDashboard,
  KanbanSquare,
  Calendar,
  User,
  BellRing,
  Palette,
  LogOut,
  Bot,
  Plug,
} from "lucide-react";
import aurataskLogo from "@/assets/auratask-logo.png";
import type { AppView } from "@/pages/AppDashboard";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface NavItem {
  id: AppView;
  icon: React.ElementType;
  label: string;
}

const allItems: NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "chat", icon: MessageSquare, label: "AuraTask IA" },
  { id: "tasks", icon: CheckSquare, label: "Todas as Tarefas" },
  { id: "tasks-today", icon: CalendarDays, label: "Tarefas de Hoje" },
  { id: "tasks-overdue", icon: AlertTriangle, label: "Tarefas Atrasadas" },
  { id: "tasks-completed", icon: CheckCircle2, label: "Concluídas" },
  { id: "projects", icon: FolderKanban, label: "Projetos" },
  { id: "projects-kanban", icon: KanbanSquare, label: "Kanban" },
  { id: "projects-calendar", icon: Calendar, label: "Calendário" },
  { id: "reminders", icon: Bell, label: "Lembretes" },
  { id: "reminders-upcoming", icon: Clock, label: "Próximos" },
  { id: "reminders-overdue", icon: AlertTriangle, label: "Atrasados" },
  { id: "habits", icon: Flame, label: "Hábitos" },
  { id: "habits-stats", icon: BarChart3, label: "Estatísticas" },
  { id: "finances", icon: DollarSign, label: "Finanças" },
  { id: "finances-income", icon: TrendingUp, label: "Receitas" },
  { id: "finances-expenses", icon: TrendingDown, label: "Despesas" },
  { id: "finances-budget", icon: Wallet, label: "Orçamento" },
  { id: "finances-cashflow", icon: BarChart3, label: "Fluxo de Caixa" },
  { id: "finances-analysis", icon: BarChart3, label: "Análise Financeira" },
  { id: "settings-ai", icon: Bot, label: "Assistente IA" },
  { id: "settings-integrations", icon: Plug, label: "Integrações" },
  { id: "settings-profile", icon: User, label: "Perfil" },
  { id: "settings-notifications", icon: BellRing, label: "Notificações" },
  { id: "settings-appearance", icon: Palette, label: "Aparência" },
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-1">
          <img src={aurataskLogo} alt="AuraTask" className="w-8 h-8 rounded-xl object-cover shrink-0" />
          {!collapsed && <span className="font-bold text-lg">AuraTask</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {allItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => onViewChange(item.id)}
                isActive={activeView === item.id}
                tooltip={item.label}
              >
                <item.icon className={cn("shrink-0", activeView === item.id && "text-primary")} />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
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
