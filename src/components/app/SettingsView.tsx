import { useState } from "react";
import { User, Palette, Bot, Plug } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SettingsProfileView } from "./SettingsProfileView";
import { SettingsAppearanceView } from "./SettingsAppearanceView";
import { SettingsAIView } from "./SettingsAIView";
import { SettingsIntegrationsView } from "./SettingsIntegrationsView";

const tabs = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "appearance", label: "Aparência", icon: Palette },
  { id: "ai", label: "Assistente IA", icon: Bot },
  { id: "integrations", label: "Integrações", icon: Plug },
] as const;

type SettingsTab = (typeof tabs)[number]["id"];

export const SettingsView = ({ subView }: { subView?: string }) => {
  const initialTab = subView === "settings-appearance" ? "appearance"
    : subView === "settings-ai" ? "ai"
    : subView === "settings-integrations" ? "integrations"
    : "profile";

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  return (
    <div className="h-full overflow-auto p-6 jarvis-grid">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-gradient-cyan">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie todas as preferências do sistema</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl border border-border/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
                activeTab === tab.id
                  ? "bg-card border border-border/50 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content - render without the outer wrapper since we already have one */}
        <div className="min-h-[400px]">
          {activeTab === "profile" && <SettingsProfileContent />}
          {activeTab === "appearance" && <SettingsAppearanceContent />}
          {activeTab === "ai" && <SettingsAIContent />}
          {activeTab === "integrations" && <SettingsIntegrationsContent />}
        </div>
      </div>
    </div>
  );
};

// Wrapper components that render the inner content without the outer shell
const SettingsProfileContent = () => <SettingsProfileView />;
const SettingsAppearanceContent = () => <SettingsAppearanceView />;
const SettingsAIContent = () => <SettingsAIView />;
const SettingsIntegrationsContent = () => <SettingsIntegrationsView />;
