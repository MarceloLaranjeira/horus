import { useState } from "react";
import { Bot, Volume2, Sparkles, Save, Mic, AudioLines, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAISettings, type AIModel, elevenLabsVoices } from "@/hooks/useAISettings";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const models: { value: AIModel; label: string; description: string; provider: string }[] = [
  // Google Gemini
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", description: "Rápido e equilibrado (recomendado)", provider: "Google" },
  { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro", description: "Próxima geração, raciocínio avançado", provider: "Google" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Boa relação custo/desempenho", provider: "Google" },
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", description: "Mais rápido e econômico", provider: "Google" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Máxima qualidade multimodal", provider: "Google" },
  // OpenAI
  { value: "openai/gpt-5", label: "GPT-5", description: "Alta precisão e raciocínio avançado", provider: "OpenAI" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini", description: "Equilíbrio entre custo e qualidade", provider: "OpenAI" },
  { value: "openai/gpt-5-nano", label: "GPT-5 Nano", description: "Ultra rápido, alto volume", provider: "OpenAI" },
  { value: "openai/gpt-5.2", label: "GPT-5.2", description: "Último lançamento, raciocínio aprimorado", provider: "OpenAI" },
];

const speechLangs = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "pt-PT", label: "Português (Portugal)" },
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Español" },
];

export const SettingsAIView = () => {
  const { settings, updateSettings } = useAISettings();
  const { toast } = useToast();
  const [name, setName] = useState(settings.assistantName);
  const [customPrompt, setCustomPrompt] = useState(settings.customPrompt);

  const handleSave = () => {
    updateSettings({ assistantName: name.trim() || "Horus", customPrompt });
    toast({ title: "Configurações salvas!", description: "As alterações foram aplicadas." });
  };

  const previewVoice = async (voiceId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: "Olá! Eu sou seu assistente pessoal.", voiceId }),
        }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        toast({ title: "Erro ao testar voz", description: err.error || "Verifique a API key", variant: "destructive" });
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch {
      toast({ title: "Erro ao testar voz", variant: "destructive" });
    }
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
          <Input id="ai-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Horus" className="bg-secondary/50 border-border/50" />
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
          <Select value={settings.model} onValueChange={(v) => updateSettings({ model: v as AIModel })}>
            <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              {models.map((m, i) => {
                const prevProvider = i > 0 ? models[i - 1].provider : null;
                const showDivider = prevProvider && prevProvider !== m.provider;
                return (
                  <div key={m.value}>
                    {showDivider && <div className="px-2 py-1 text-xs font-bold text-muted-foreground border-t border-border/50 mt-1 pt-2">{m.provider}</div>}
                    {i === 0 && <div className="px-2 py-1 text-xs font-bold text-muted-foreground">{m.provider}</div>}
                    <SelectItem value={m.value}>
                      <span className="font-medium">{m.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">— {m.description}</span>
                    </SelectItem>
                  </div>
                );
              })}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Speech Recognition */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border/50 rounded-xl p-6 card-glow space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mic className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Entrada por Voz</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Usar microfone</p>
              <p className="text-xs text-muted-foreground">Fale para enviar mensagens automaticamente</p>
            </div>
            <Switch checked={settings.voiceEnabled} onCheckedChange={(v) => updateSettings({ voiceEnabled: v })} />
          </div>
          <Select value={settings.voiceLang} onValueChange={(v) => updateSettings({ voiceLang: v })}>
            <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              {speechLangs.map((v) => (
                <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* TTS Voice (ElevenLabs) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border/50 rounded-xl p-6 card-glow space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <AudioLines className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Voz do Assistente (ElevenLabs)</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Resposta por áudio</p>
              <p className="text-xs text-muted-foreground">O assistente responde com voz usando ElevenLabs TTS</p>
            </div>
            <Switch checked={settings.ttsEnabled} onCheckedChange={(v) => updateSettings({ ttsEnabled: v })} />
          </div>
          {settings.ttsEnabled && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Escolha a voz do assistente</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {elevenLabsVoices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => updateSettings({ ttsVoiceId: voice.id })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      settings.ttsVoiceId === voice.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 bg-secondary/30 hover:border-border text-muted-foreground"
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5 shrink-0" />
                    {voice.name}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => previewVoice(settings.ttsVoiceId)} className="w-full mt-2">
                <Volume2 className="w-4 h-4 mr-2" /> Testar Voz Selecionada
              </Button>
            </div>
          )}
        </motion.div>

        {/* Custom System Prompt */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card border border-border/50 rounded-xl p-6 card-glow space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Instruções Personalizadas</h3>
          </div>
          <p className="text-xs text-muted-foreground">Adicione instruções específicas para o agente. Ex: "Me chame de João", "Sempre responda de forma direta".</p>
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ex: Me chame de João. Prefiro respostas curtas e objetivas..."
            className="bg-secondary/50 border-border/50 min-h-[100px]"
          />
        </motion.div>

        {/* Save */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Button onClick={handleSave} className="w-full glow-cyan bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" /> Salvar Configurações
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
