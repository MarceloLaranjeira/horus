import { useState } from "react";
import { AppSidebar } from "@/components/app/AppSidebar";
import { ChatView } from "@/components/app/ChatView";
import { TasksView } from "@/components/app/TasksView";
import { HabitsView } from "@/components/app/HabitsView";
import { FinancesView } from "@/components/app/FinancesView";
import { RemindersView } from "@/components/app/RemindersView";
import { ProjectsView } from "@/components/app/ProjectsView";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export type AppView = "chat" | "tasks" | "habits" | "finances" | "reminders" | "projects";

const AppDashboard = () => {
  const [activeView, setActiveView] = useState<AppView>("chat");

  const renderView = () => {
    switch (activeView) {
      case "chat": return <ChatView />;
      case "tasks": return <TasksView />;
      case "habits": return <HabitsView />;
      case "finances": return <FinancesView />;
      case "reminders": return <RemindersView />;
      case "projects": return <ProjectsView />;
      default: return <ChatView />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-12 flex items-center border-b border-border px-2 shrink-0">
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

export default AppDashboard;
