import { MessageSquare, CheckSquare, BarChart3, DollarSign, Bell, FolderKanban, Settings, Mic, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppView } from "@/pages/AppDashboard";

const navItems: { id: AppView; icon: React.ElementType; label: string }[] = [
  { id: "chat", icon: MessageSquare, label: "Chat IA" },
  { id: "tasks", icon: CheckSquare, label: "Tarefas" },
  { id: "habits", icon: BarChart3, label: "Hábitos" },
  { id: "reminders", icon: Bell, label: "Lembretes" },
  { id: "finances", icon: DollarSign, label: "Finanças" },
  { id: "projects", icon: FolderKanban, label: "Projetos" },
];

interface AppSidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

export const AppSidebar = ({ activeView, onViewChange }: AppSidebarProps) => {
  return (
    <aside className="w-16 md:w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <span className="font-bold text-lg hidden md:block">AuraTask</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
              activeView === item.id
                ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className={cn("w-5 h-5 shrink-0", activeView === item.id && "text-primary")} />
            <span className="hidden md:block">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-sidebar-border">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all">
          <Settings className="w-5 h-5 shrink-0" />
          <span className="hidden md:block">Configurações</span>
        </button>
      </div>
    </aside>
  );
};
