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
import { GoogleCalendarOAuthHandler } from "@/components/app/GoogleCalendarOAuthHandler";
import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { ProfileDropdown } from "@/components/app/ProfileDropdown";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppView =
  | "dashboard"
  | "chat"
  | "tasks"
  | "tasks-today"
  | "tasks-overdue"
  | "tasks-completed"
  | "habits"
  | "habits-stats"
  | "reminders"
  | "reminders-upcoming"
  | "reminders-overdue"
  | "finances"
  | "finances-income"
  | "finances-expenses"
  | "finances-budget"
  | "finances-cashflow"
  | "finances-analysis"
  | "projects"
  | "projects-kanban"
  | "projects-calendar"
  | "agenda"
  | "gmail"
  | "whatsapp"
  | "telegram"
  | "notes"
  | "analysis"
  | "settings"
  | "settings-profile"
  | "settings-notifications"
  | "settings-appearance"
  | "settings-ai"
  | "settings-integrations";

const viewLabels: Record<string, string> = {
  dashboard: "Dashboard",
  chat: "Horus IA",
  tasks: "Tarefas",
  "tasks-today": "Hoje",
  "tasks-overdue": "Atrasadas",
  "tasks-completed": "Concluidas",
  habits: "Habitos",
  "habits-stats": "Estatisticas",
  reminders: "Lembretes",
  "reminders-upcoming": "Proximos",
  "reminders-overdue": "Atrasados",
  finances: "Financas",
  "finances-income": "Receitas",
  "finances-expenses": "Despesas",
  "finances-budget": "Orcamento",
  "finances-cashflow": "Fluxo de Caixa",
  "finances-analysis": "Analise",
  projects: "Projetos",
  "projects-kanban": "Kanban",
  "projects-calendar": "Calendario",
  agenda: "Agenda",
  gmail: "Gmail",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  notes: "Notas",
  analysis: "Analise Horus",
  settings: "Configuracoes",
  "settings-profile": "Perfil",
  "settings-notifications": "Notificacoes",
  "settings-appearance": "Aparencia",
  "settings-ai": "Configurar IA",
  "settings-integrations": "Integracoes",
};

const moduleMap: Record<string, { label: string; color: string }> = {
  dashboard: { label: "Central", color: "#3B82F6" },
  chat: { label: "Central", color: "#3B82F6" },
  tasks: { label: "Trabalho", color: "#22C55E" },
  projects: { label: "Trabalho", color: "#22C55E" },
  notes: { label: "Trabalho", color: "#22C55E" },
  finances: { label: "Financeiro", color: "#F59E0B" },
  analysis: { label: "Financeiro", color: "#F59E0B" },
  habits: { label: "Produtividade", color: "#8B5CF6" },
  reminders: { label: "Produtividade", color: "#8B5CF6" },
  agenda: { label: "Comunicacao", color: "#06B6D4" },
  gmail: { label: "Comunicacao", color: "#06B6D4" },
  whatsapp: { label: "Comunicacao", color: "#06B6D4" },
  telegram: { label: "Comunicacao", color: "#06B6D4" },
  settings: { label: "Sistema", color: "#64748B" },
};

const getBaseView = (view: AppView): string => view.split("-")[0];

const AppDashboard = () => {
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  const base = getBaseView(activeView);
  const module = moduleMap[base] ?? { label: "Central", color: "#3B82F6" };
  const pageLabel = viewLabels[activeView] ?? "Dashboard";
  const isSubView = activeView.includes("-");

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <GoogleCalendarOAuthHandler />
      <CommandPalette onNavigate={setActiveView} />

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="hidden shrink-0 md:flex">
        <AppSidebar
          activeView={activeView}
          onViewChange={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((value) => !value)}
        />
      </div>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <AppSidebar
          activeView={activeView}
          onViewChange={handleNavigate}
          collapsed={false}
          onToggle={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className="app-shell-header h-14 shrink-0 border-b px-4 md:px-6"
          style={{
            borderColor: "hsl(var(--border) / 0.7)",
            background: "linear-gradient(90deg, hsl(var(--card) / 0.85), hsl(var(--card) / 0.68))",
            backdropFilter: "blur(14px)",
          }}
        >
          <div className="flex h-full items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-secondary/65 hover:text-foreground md:hidden"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>

              <nav className="flex min-w-0 items-center gap-1.5 text-sm">
                <span
                  className="hidden shrink-0 text-[11px] font-bold tracking-wide sm:block"
                  style={{ color: module.color }}
                >
                  {module.label}
                </span>
                {isSubView && (
                  <>
                    <ChevronRight className="hidden h-3 w-3 shrink-0 text-muted-foreground/70 sm:block" />
                    <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:block">
                      {viewLabels[base] ?? base}
                    </span>
                  </>
                )}
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                <span className="truncate text-[13px] font-semibold text-foreground/90">{pageLabel}</span>
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="hidden h-8 items-center gap-2 rounded-lg border border-border/70 px-3 text-xs text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground sm:flex"
                onClick={() =>
                  document.dispatchEvent(
                    new KeyboardEvent("keydown", {
                      key: "k",
                      ctrlKey: true,
                      bubbles: true,
                    })
                  )
                }
              >
                <Search className="h-3.5 w-3.5" />
                <span>Buscar</span>
                <kbd className="pointer-events-none inline-flex h-4 items-center gap-0.5 rounded border border-border/70 px-1 font-mono text-[10px] text-muted-foreground">
                  Ctrl K
                </kbd>
              </Button>
              <ProfileDropdown onNavigate={setActiveView} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden bg-background">
          <ErrorBoundary key={activeView}>{renderView()}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AppDashboard;

