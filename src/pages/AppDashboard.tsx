import { useState } from "react";
import { AppSidebar } from "@/components/app/AppSidebar";
import { ChatView } from "@/components/app/ChatView";
import { TasksView } from "@/components/app/TasksView";
import { HabitsView } from "@/components/app/HabitsView";
import { FinancesView } from "@/components/app/FinancesView";
import { RemindersView } from "@/components/app/RemindersView";
import { ProjectsView } from "@/components/app/ProjectsView";

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
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
};

export default AppDashboard;
