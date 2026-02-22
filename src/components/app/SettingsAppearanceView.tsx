import { useState, useEffect } from "react";
import { Palette, Monitor, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ThemeOption = "dark" | "light" | "system";

const themes = [
  { id: "dark" as ThemeOption, label: "Escuro", icon: Moon, description: "Tema escuro padrão" },
  { id: "light" as ThemeOption, label: "Claro", icon: Sun, description: "Tema claro" },
  { id: "system" as ThemeOption, label: "Sistema", icon: Monitor, description: "Seguir preferência do sistema" },
];

function applyTheme(theme: ThemeOption) {
  const root = document.documentElement;
  if (theme === "light" || (theme === "system" && window.matchMedia("(prefers-color-scheme: light)").matches)) {
    root.classList.add("light");
  } else {
    root.classList.remove("light");
  }
}

export const SettingsAppearanceView = () => {
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(() => {
    return (localStorage.getItem("horus-theme") as ThemeOption) || "dark";
  });

  useEffect(() => {
    localStorage.setItem("horus-theme", selectedTheme);
    applyTheme(selectedTheme);

    if (selectedTheme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [selectedTheme]);

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
                onClick={() => setSelectedTheme(t.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  selectedTheme === t.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-secondary/30 hover:border-border"
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
