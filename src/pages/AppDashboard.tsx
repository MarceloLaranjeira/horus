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
  tasks: "Tarefas", "tasks-today": "Hoje", "tasks-overdue": "Atrasadas", "tasks-completed": "Concluídas",
  habits: "Hábitos", "habits-stats": "Estatísticas",
  reminders: "Lembretes", "reminders-upcoming": "Próximos", "reminders-overdue": "Atrasados",
  finances: "Finanças", "finances-income": "Receitas", "finances-expenses": "Despesas",
  "finances-budget": "Orçamento", "finances-cashflow": "Fluxo de Caixa", "finances-analysis": "Análise",
  projects: "Projetos", "projects-kanban": "Kanban", "projects-calendar": "Calendário",
  agenda: "Agenda", gmail: "Gmail", whatsapp: "WhatsApp", telegram: "Telegram",
  notes: "Notas", analysis: "Análise Horus",
  settings: "Configurações", "settings-profile": "Perfil", "settings-notifications": "Notificações",
  "settings-appearance": "Aparência", "settings-ai": "Configurar IA", "settings-integrations": "Integrações",
};

// Module grouping for breadcrumb
const moduleMap: Record<string, { label: string; color: string }> = {
  dashboard: { label: "Central", color: "#4F8EF7" },
  chat:      { label: "Central", color: "#4F8EF7" },
  tasks:     { label: "Trabalho", color: "#22C55E" },
  projects:  { label: "Trabalho", color: "#22C55E" },
  notes:     { label: "Trabalho", color: "#22C55E" },
  finances:  { label: "Financeiro", color: "#F59E0B" },
  analysis:  { label: "Financeiro", color: "#F59E0B" },
  habits:    { label: "Produtividade", color: "#A855F7" },
  reminders: { label: "Produtividade", color: "#A855F7" },
  agenda:    { label: "Comunicação", color: "#06B6D4" },
  gmail:     { label: "Comunicação", color: "#06B6D4" },
  whatsapp:  { label: "Comunicação", color: "#06B6D4" },
  telegram:  { label: "Comunicação", color: "#06B6D4" },
  settings:  { label: "Sistema", color: "#94A3B8" },
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
  const module = moduleMap[base] ?? { label: "Central", color: "#4F8EF7" };
  const pageLabel = viewLabels[activeView] ?? "Dashboard";
  const isSubView = activeView.includes("-");

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    setMobileSidebarOpen(false);
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#080D14" }}
    >
      <GoogleCalendarOAuthHandler />
      <CommandPalette onNavigate={setActiveView} />

      {/* ── Mobile overlay ──────────────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop) ───────────────────────────────────────── */}
      <div className="hidden md:flex shrink-0">
        <AppSidebar
          activeView={activeView}
          onViewChange={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {/* ── Sidebar (mobile drawer) ─────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300",
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

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ── ERP Header ──────────────────────────────────────────── */}
        <header
          className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6 border-b"
          style={{
            background: "linear-gradient(90deg, #0D1117 0%, #0A0E18 100%)",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          {/* Left: Mobile menu + Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm min-w-0">
              <span
                className="text-[11px] font-bold tracking-wide hidden sm:block shrink-0"
                style={{ color: module.color }}
              >
                {module.label}
              </span>
              {isSubView && (
                <>
                  <ChevronRight
                    className="w-3 h-3 shrink-0 hidden sm:block"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                  />
                  <span className="text-white/40 text-[11px] hidden sm:block shrink-0">
                    {viewLabels[base] ?? base}
                  </span>
                </>
              )}
              <ChevronRight
                className="w-3 h-3 shrink-0"
                style={{ color: "rgba(255,255,255,0.2)" }}
              />
              <span className="text-white/80 font-semibold text-[13px] truncate">
                {pageLabel}
              </span>
            </nav>
          </div>

          {/* Right: Search + User */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg text-white/35 hover:text-white/60 hover:bg-white/5 border text-xs transition-all"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
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
              <kbd
                className="pointer-events-none inline-flex h-4 items-center gap-0.5 rounded px-1 font-mono text-[10px]"
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.25)",
                }}
              >
                Ctrl K
              </kbd>
            </Button>
            <ProfileDropdown onNavigate={setActiveView} />
          </div>
        </header>

        {/* ── Content ─────────────────────────────────────────────── */}
        <main
          className="flex-1 overflow-hidden"
          style={{ background: "#080D14" }}
        >
          <ErrorBoundary key={activeView}>{renderView()}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AppDashboard;
