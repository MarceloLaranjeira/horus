import { useState } from "react";
import { AppSidebar } from "@/components/app/AppSidebar";
import { ChatView } from "@/components/app/ChatView";
import { TasksView } from "@/components/app/TasksView";
import { HabitsView } from "@/components/app/HabitsView";
import { FinancesView } from "@/components/app/FinancesView";
import { RemindersView } from "@/components/app/RemindersView";
import { ProjectsView } from "@/components/app/ProjectsView";
import { DashboardView } from "@/components/app/DashboardView";
import { SettingsAIView } from "@/components/app/SettingsAIView";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export type AppView =
  | "dashboard"
  | "chat"
  | "tasks" | "tasks-today" | "tasks-overdue" | "tasks-completed"
  | "habits" | "habits-stats"
  | "reminders" | "reminders-upcoming" | "reminders-overdue"
  | "finances" | "finances-income" | "finances-expenses" | "finances-budget"
  | "projects" | "projects-kanban" | "projects-calendar"
  | "settings" | "settings-profile" | "settings-notifications" | "settings-appearance" | "settings-ai";

const AppDashboard = () => {
  const [activeView, setActiveView] = useState<AppView>("dashboard");

  const renderView = () => {
    if (activeView === "dashboard") return <DashboardView onNavigate={setActiveView} />;
    if (activeView === "chat") return <ChatView />;
    if (activeView.startsWith("tasks")) return <TasksView subView={activeView} />;
    if (activeView.startsWith("habits")) return <HabitsView subView={activeView} />;
    if (activeView.startsWith("finances")) return <FinancesView subView={activeView} />;
    if (activeView.startsWith("reminders")) return <RemindersView subView={activeView} />;
    if (activeView.startsWith("projects")) return <ProjectsView subView={activeView} />;
    if (activeView === "settings-ai") return <SettingsAIView />;
    if (activeView.startsWith("settings")) return <SettingsPlaceholder subView={activeView} />;
    return <DashboardView onNavigate={setActiveView} />;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-dark">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-12 flex items-center border-b border-border/50 px-2 shrink-0 bg-card/30 backdrop-blur-sm">
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-hidden">
            {renderView()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const SettingsPlaceholder = ({ subView }: { subView: string }) => {
  const labels: Record<string, string> = {
    settings: "Configurações Gerais",
    "settings-profile": "Perfil do Usuário",
    "settings-notifications": "Notificações",
    "settings-appearance": "Aparência",
  };
  return (
    <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
      <p className="text-lg font-semibold text-foreground mb-2">{labels[subView] || "Configurações"}</p>
      <p className="text-sm">Em breve disponível</p>
    </div>
  );
};

export default AppDashboard;
