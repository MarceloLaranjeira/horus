import { useState } from "react";
import { Bell, Clock, CheckSquare, DollarSign, Flame } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface NotifSetting {
  key: string;
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
}

export const SettingsNotificationsView = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotifSetting[]>([
    { key: "tasks", icon: CheckSquare, label: "Tarefas", description: "Notificações de tarefas vencendo ou atrasadas", enabled: true },
    { key: "reminders", icon: Clock, label: "Lembretes", description: "Alertas de lembretes próximos", enabled: true },
    { key: "finances", icon: DollarSign, label: "Finanças", description: "Resumos financeiros e alertas de orçamento", enabled: false },
    { key: "habits", icon: Flame, label: "Hábitos", description: "Lembretes diários de hábitos", enabled: true },
  ]);

  const toggle = (key: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s))
    );
    toast({ title: "Preferência atualizada!" });
  };

  return (
    <div className="h-full overflow-auto p-6 jarvis-grid">
      <div className="max-w-2xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-gradient-cyan">Notificações</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle quais alertas você recebe</p>
        </motion.div>

        {settings.map((s, i) => (
          <motion.div key={s.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border/50 rounded-xl p-6 card-glow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{s.label}</h3>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </div>
              <Switch checked={s.enabled} onCheckedChange={() => toggle(s.key)} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
