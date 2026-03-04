import { useState } from "react";
import { AppSidebar } from "@/components/app/AppSidebar";
import { ChatView } from "@/components/app/ChatView";
import { TasksView } from "@/components/app/TasksView";
import { HabitsView } from "@/components/app/HabitsView";
import { FinancesView } from "@/components/app/FinancesView";
import { RemindersView } from "@/components/app/RemindersView";
import { ProjectsView } from "@/components/app/ProjectsView";
import { DashboardView } from "@/components/app/DashboardView";
import { SettingsView } from "@/components/app/SettingsView";
import { AnalysisView } from "@/components/app/AnalysisView";
import { NotesView } from "@/components/app/NotesView";
import { AgendaView } from "@/components/app/AgendaView";
import { GmailView } from "@/components/app/GmailView";
import { MessagingView } from "@/components/app/MessagingView";
import { WhatsAppView } from "@/components/app/WhatsAppView";
import { CommandPalette } from "@/components/app/CommandPalette";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { GoogleCalendarOAuthHandler } from "@/components/app/GoogleCalendarOAuthHandler";
import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { ProfileDropdown } from "@/components/app/ProfileDropdown";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export type AppView =
  | "dashboard"
  | "chat"
  | "tasks" | "tasks-today" | "tasks-overdue" | "tasks-completed"
  | "habits" | "habits-stats"
  | "reminders" | "reminders-upcoming" | "reminders-overdue"
  | "finances" | "finances-income" | "finances-expenses" | "finances-budget" | "finances-cashflow" | "finances-analysis"
  | "projects" | "projects-kanban" | "projects-calendar"
  | "agenda" | "gmail" | "whatsapp" | "telegram"
  | "notes" | "analysis"
  | "settings" | "settings-profile" | "settings-notifications" | "settings-appearance" | "settings-ai" | "settings-integrations";

const viewLabels: Record<string, string> = {
  dashboard: "Dashboard", chat: "Horus IA",
  tasks: "Tarefas", "tasks-today": "Tarefas de Hoje", "tasks-overdue": "Tarefas Atrasadas", "tasks-completed": "Tarefas Concluídas",
  habits: "Hábitos", "habits-stats": "Estatísticas de Hábitos",
  reminders: "Lembretes", "reminders-upcoming": "Próximos Lembretes", "reminders-overdue": "Lembretes Atrasados",
  finances: "Finanças", "finances-income": "Receitas", "finances-expenses": "Despesas", "finances-budget": "Orçamento", "finances-cashflow": "Fluxo de Caixa", "finances-analysis": "Análise Financeira",
  projects: "Projetos", "projects-kanban": "Kanban", "projects-calendar": "Calendário de Projetos",
  agenda: "Google Calendar", gmail: "Gmail", whatsapp: "WhatsApp", telegram: "Telegram",
  notes: "Notas", analysis: "Análise Horus",
  settings: "Configurações", "settings-profile": "Perfil", "settings-notifications": "Notificações", "settings-appearance": "Aparência", "settings-ai": "Configurar IA", "settings-integrations": "Integrações",
};

const AppDashboard = () => {
  const [activeView, setActiveView] = useState<AppView>("dashboard");

  const renderView = () => {
    if (activeView === "dashboard") return <DashboardView onNavigate={setActiveView} />;
    if (activeView === "chat") return <ChatView onNavigate={setActiveView} />;
    if (activeView.startsWith("tasks")) return <TasksView subView={activeView} />;
    if (activeView.startsWith("habits")) return <HabitsView subView={activeView} />;
    if (activeView.startsWith("finances")) return <FinancesView subView={activeView} onNavigate={setActiveView} />;
    if (activeView.startsWith("reminders")) return <RemindersView subView={activeView} />;
    if (activeView.startsWith("projects")) return <ProjectsView subView={activeView} />;
    if (activeView === "agenda") return <AgendaView />;
    if (activeView === "gmail") return <GmailView />;
    if (activeView === "whatsapp") return <WhatsAppView />;
    if (activeView === "telegram") return <MessagingView platform="telegram" />;
    if (activeView === "analysis") return <AnalysisView />;
    if (activeView === "notes") return <NotesView />;
    if (activeView.startsWith("settings")) return <SettingsView subView={activeView} />;
    return <DashboardView onNavigate={setActiveView} />;
  };

  return (
    <SidebarProvider>
      <GoogleCalendarOAuthHandler />
      <CommandPalette onNavigate={setActiveView} />
      <div className="flex min-h-screen w-full bg-gradient-dark">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-12 flex items-center justify-between border-b border-border/50 px-2 shrink-0 bg-card/30 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-medium text-foreground/80 hidden sm:block">
                {viewLabels[activeView] ?? "Dashboard"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground h-8 px-3 text-xs border border-border/40 rounded-lg"
                onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))}
              >
                <Search className="h-3.5 w-3.5" />
                Buscar
                <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/60 bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                  Ctrl K
                </kbd>
              </Button>
              <ProfileDropdown onNavigate={setActiveView} />
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            <ErrorBoundary key={activeView}>
              {renderView()}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppDashboard;
