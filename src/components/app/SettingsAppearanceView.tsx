import { Palette, Monitor, Moon, Sun, Paintbrush } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme, visualThemes, type ColorMode } from "@/hooks/useTheme";

const colorModes = [
  { id: "dark" as ColorMode, label: "Escuro", icon: Moon },
  { id: "light" as ColorMode, label: "Claro", icon: Sun },
  { id: "system" as ColorMode, label: "Sistema", icon: Monitor },
];

export const SettingsAppearanceView = () => {
  const { colorMode, setColorMode, visualTheme, setVisualTheme } = useTheme();

  return (
    <div className="h-full overflow-auto p-6 jarvis-grid">
      <div className="max-w-2xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-gradient-cyan">Aparência</h1>
          <p className="text-sm text-muted-foreground mt-1">Personalize a interface do app</p>
        </motion.div>

        {/* Color Mode */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border/50 rounded-xl p-6 card-glow space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Modo</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {colorModes.map((t) => (
              <button
                key={t.id}
                onClick={() => setColorMode(t.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  colorMode === t.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-secondary/30 hover:border-border"
                )}
              >
                <t.icon className={cn("w-6 h-6", colorMode === t.id ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Visual Themes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border/50 rounded-xl p-6 card-glow space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Paintbrush className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Tema Visual</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {visualThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setVisualTheme(theme.id)}
                className={cn(
                  "flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left",
                  visualTheme === theme.id
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "border-border/50 bg-secondary/30 hover:border-border"
                )}
              >
                {/* Color preview dots */}
                <div className="flex gap-1.5">
                  <span className="w-4 h-4 rounded-full border border-white/20" style={{ background: theme.preview.bg }} />
                  <span className="w-4 h-4 rounded-full border border-white/20" style={{ background: theme.preview.primary }} />
                  <span className="w-4 h-4 rounded-full border border-white/20" style={{ background: theme.preview.accent }} />
                  <span className="w-4 h-4 rounded-full border border-white/20" style={{ background: theme.preview.card }} />
                </div>
                <div>
                  <span className="text-xs font-semibold block">{theme.name}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{theme.description}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
