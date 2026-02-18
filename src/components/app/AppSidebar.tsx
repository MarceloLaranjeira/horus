import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  CheckSquare,
  BarChart3,
  DollarSign,
  Bell,
  FolderKanban,
  Settings,
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
  ChevronRight,
  LogOut,
} from "lucide-react";
import aurataskLogo from "@/assets/auratask-logo.png";
import type { AppView } from "@/pages/AppDashboard";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface NavSubItem {
  id: AppView;
  icon: React.ElementType;
  label: string;
}

interface NavItem {
  id: AppView;
  icon: React.ElementType;
  label: string;
  subItems?: NavSubItem[];
}

interface NavCategory {
  label: string;
  items: NavItem[];
}

const navCategories: NavCategory[] = [
  {
    label: "Assistente",
    items: [
      { id: "chat", icon: MessageSquare, label: "Chat IA" },
    ],
  },
  {
    label: "Produtividade",
    items: [
      {
        id: "tasks",
        icon: CheckSquare,
        label: "Tarefas",
        subItems: [
          { id: "tasks", icon: LayoutDashboard, label: "Todas" },
          { id: "tasks-today", icon: CalendarDays, label: "Hoje" },
          { id: "tasks-overdue", icon: AlertTriangle, label: "Atrasadas" },
          { id: "tasks-completed", icon: CheckCircle2, label: "Concluídas" },
        ],
      },
      {
        id: "projects",
        icon: FolderKanban,
        label: "Projetos",
        subItems: [
          { id: "projects", icon: LayoutDashboard, label: "Visão Geral" },
          { id: "projects-kanban", icon: KanbanSquare, label: "Kanban" },
          { id: "projects-calendar", icon: Calendar, label: "Calendário" },
        ],
      },
      {
        id: "reminders",
        icon: Bell,
        label: "Lembretes",
        subItems: [
          { id: "reminders", icon: Bell, label: "Todos" },
          { id: "reminders-upcoming", icon: Clock, label: "Próximos" },
          { id: "reminders-overdue", icon: AlertTriangle, label: "Atrasados" },
        ],
      },
    ],
  },
  {
    label: "Vida Pessoal",
    items: [
      {
        id: "habits",
        icon: BarChart3,
        label: "Hábitos",
        subItems: [
          { id: "habits", icon: Flame, label: "Ativos" },
          { id: "habits-stats", icon: BarChart3, label: "Estatísticas" },
        ],
      },
      {
        id: "finances",
        icon: DollarSign,
        label: "Finanças",
        subItems: [
          { id: "finances", icon: DollarSign, label: "Visão Geral" },
          { id: "finances-income", icon: TrendingUp, label: "Receitas" },
          { id: "finances-expenses", icon: TrendingDown, label: "Despesas" },
          { id: "finances-budget", icon: Wallet, label: "Orçamento" },
        ],
      },
    ],
  },
];

const settingsItem: NavItem = {
  id: "settings",
  icon: Settings,
  label: "Configurações",
  subItems: [
    { id: "settings-profile", icon: User, label: "Perfil" },
    { id: "settings-notifications", icon: BellRing, label: "Notificações" },
    { id: "settings-appearance", icon: Palette, label: "Aparência" },
  ],
};

interface AppSidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

export const AppSidebar = ({ activeView, onViewChange }: AppSidebarProps) => {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";

  const isItemActive = (item: NavItem) => {
    if (activeView === item.id) return true;
    return item.subItems?.some((sub) => sub.id === activeView) ?? false;
  };

  const renderMenuItem = (item: NavItem) => {
    const active = isItemActive(item);

    if (!item.subItems || collapsed) {
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            onClick={() => onViewChange(item.id)}
            isActive={active}
            tooltip={item.label}
          >
            <item.icon className={cn("shrink-0", active && "text-primary")} />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    return (
      <Collapsible key={item.id} asChild defaultOpen={active} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.label} isActive={active}>
              <item.icon className={cn("shrink-0", active && "text-primary")} />
              <span>{item.label}</span>
              <ChevronRight className="ml-auto shrink-0 h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.subItems.map((sub) => (
                <SidebarMenuSubItem key={sub.id}>
                  <SidebarMenuSubButton
                    onClick={() => onViewChange(sub.id)}
                    isActive={activeView === sub.id}
                  >
                    <sub.icon className={cn("shrink-0 h-3.5 w-3.5", activeView === sub.id && "text-primary")} />
                    <span>{sub.label}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-1">
          <img src={aurataskLogo} alt="AuraTask" className="w-8 h-8 rounded-xl object-cover shrink-0" />
          {!collapsed && <span className="font-bold text-lg">AuraTask</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navCategories.map((category) => (
          <SidebarGroup key={category.label}>
            <SidebarGroupLabel>{category.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {category.items.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {renderMenuItem(settingsItem)}
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
