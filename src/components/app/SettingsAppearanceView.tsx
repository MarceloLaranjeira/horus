import { useState } from "react";
import { Palette, Monitor, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const themes = [
  { id: "dark", label: "Escuro", icon: Moon, description: "Tema escuro padrão" },
  { id: "light", label: "Claro", icon: Sun, description: "Em breve" },
  { id: "system", label: "Sistema", icon: Monitor, description: "Seguir preferência do sistema" },
];

export const SettingsAppearanceView = () => {
  const [selectedTheme, setSelectedTheme] = useState("dark");

  return (
    <div className="h-full overflow-auto p-6 jarvis-grid">
      <div className="max-w-2xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-gradient-cyan">Aparência</h1>
          <p className="text-sm text-muted-foreground mt-1">Personalize a interface do app</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border/50 rounded-xl p-6 card-glow space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Tema</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => t.id !== "light" && setSelectedTheme(t.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  selectedTheme === t.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-secondary/30 hover:border-border",
                  t.id === "light" && "opacity-50 cursor-not-allowed"
                )}
              >
                <t.icon className={cn("w-6 h-6", selectedTheme === t.id ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
