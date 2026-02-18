import { useState } from "react";
import { Bot, Volume2, Sparkles, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAISettings, type AIModel } from "@/hooks/useAISettings";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const models: { value: AIModel; label: string; description: string }[] = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", description: "Rápido e equilibrado (recomendado)" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Boa relação custo/desempenho" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Máxima qualidade, mais lento" },
  { value: "openai/gpt-5", label: "GPT-5", description: "Alta precisão e raciocínio avançado" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini", description: "Equilíbrio entre custo e qualidade" },
];

const voices = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "pt-PT", label: "Português (Portugal)" },
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Español" },
];

export const SettingsAIView = () => {
  const { settings, updateSettings } = useAISettings();
  const { toast } = useToast();
  const [name, setName] = useState(settings.assistantName);

  const handleSave = () => {
    updateSettings({ assistantName: name.trim() || "AuraTask" });
    toast({ title: "Configurações salvas!", description: "As alterações foram aplicadas." });
  };

  return (
    <div className="h-full overflow-auto p-6 jarvis-grid">
      <div className="max-w-2xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-gradient-cyan">Configurações da IA</h1>
          <p className="text-sm text-muted-foreground mt-1">Personalize seu assistente pessoal</p>
        </motion.div>

        {/* Assistant Name */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border/50 rounded-xl p-6 card-glow space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Nome do Assistente</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-name" className="text-xs text-muted-foreground">
              Como você quer chamar seu assistente?
            </Label>
            <Input
              id="ai-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="AuraTask"
              className="bg-secondary/50 border-border/50"
            />
          </div>
        </motion.div>

        {/* Model Selection */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border/50 rounded-xl p-6 card-glow space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Modelo de IA</h3>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Escolha o modelo que melhor atende suas necessidades</Label>
            <Select value={settings.model} onValueChange={(v) => updateSettings({ model: v as AIModel })}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <div>
                      <span className="font-medium">{m.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">— {m.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Voice Settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border/50 rounded-xl p-6 card-glow space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Voz e Idioma</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Entrada por voz</p>
              <p className="text-xs text-muted-foreground">Usar microfone para enviar mensagens</p>
            </div>
            <Switch
              checked={settings.voiceEnabled}
              onCheckedChange={(v) => updateSettings({ voiceEnabled: v })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Idioma do reconhecimento de voz</Label>
            <Select value={settings.voiceLang} onValueChange={(v) => updateSettings({ voiceLang: v })}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voices.map((v) => (
                  <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Save */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Button onClick={handleSave} className="w-full glow-cyan bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
