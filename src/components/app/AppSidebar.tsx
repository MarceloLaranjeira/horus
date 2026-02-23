import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import horusLogo from "@/assets/horus-logo.png";
import type { AppView } from "@/pages/AppDashboard";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface NavItem {
  id: AppView;
  icon: React.ElementType;
  label: string;
}

const mainItems: NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "chat", icon: MessageSquare, label: "Horus IA" },
];

const modulesItems: NavItem[] = [
  { id: "tasks", icon: CheckSquare, label: "Tarefas" },
  { id: "projects", icon: FolderKanban, label: "Projetos" },
  { id: "agenda", icon: CalendarDays, label: "Agenda" },
  { id: "reminders", icon: Bell, label: "Lembretes" },
  { id: "habits", icon: Flame, label: "Hábitos" },
  { id: "finances", icon: DollarSign, label: "Finanças" },
  { id: "notes", icon: StickyNote, label: "Notas" },
  { id: "analysis", icon: Brain, label: "Análise Horus" },
];

const communicationItems: NavItem[] = [
  { id: "gmail", icon: Mail, label: "Gmail" },
  { id: "whatsapp", icon: MessageCircle, label: "WhatsApp" },
  { id: "telegram", icon: Bot, label: "Telegram" },
];

const settingsItems: NavItem[] = [
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

  const isActiveGroup = (item: NavItem) =>
    activeView === item.id || activeView.startsWith(item.id + "-");

  const renderItems = (items: NavItem[]) =>
    items.map((item) => (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          onClick={() => onViewChange(item.id)}
          isActive={isActiveGroup(item)}
          tooltip={item.label}
        >
          <item.icon className={cn("shrink-0", isActiveGroup(item) && "text-[hsl(var(--nectar-gold))]")} />
          <span>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-1">
          <img src={horusLogo} alt="Horus" className="w-8 h-8 rounded-xl object-cover shrink-0" />
          {!collapsed && <span className="font-bold text-lg">Horus</span>}
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
          <SidebarGroupLabel>Comunicação</SidebarGroupLabel>
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