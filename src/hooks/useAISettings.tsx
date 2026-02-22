import { useState, useEffect, createContext, useContext, ReactNode } from "react";

export type AIModel =
  | "google/gemini-3-flash-preview"
  | "google/gemini-3-pro-preview"
  | "google/gemini-2.5-flash"
  | "google/gemini-2.5-flash-lite"
  | "google/gemini-2.5-pro"
  | "openai/gpt-5"
  | "openai/gpt-5-mini"
  | "openai/gpt-5-nano"
  | "openai/gpt-5.2";

export interface ElevenLabsVoice {
  id: string;
  name: string;
}

export const elevenLabsVoices: ElevenLabsVoice[] = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian" },
];

export type AgentMood = "professional" | "friendly" | "casual" | "formal" | "creative" | "concise";

export const agentMoods: { value: AgentMood; label: string; emoji: string; description: string }[] = [
  { value: "professional", label: "Profissional", emoji: "💼", description: "Respostas objetivas e formais" },
  { value: "friendly", label: "Amigável", emoji: "😊", description: "Tom acolhedor e próximo" },
  { value: "casual", label: "Casual", emoji: "😎", description: "Relaxado, usa gírias e emojis" },
  { value: "formal", label: "Formal", emoji: "🎩", description: "Linguagem culta e protocolar" },
  { value: "creative", label: "Criativo", emoji: "🎨", description: "Respostas imaginativas e originais" },
  { value: "concise", label: "Conciso", emoji: "⚡", description: "Respostas curtas e diretas" },
];

export interface AISettings {
  assistantName: string;
  model: AIModel;
  voiceEnabled: boolean;
  voiceLang: string;
  ttsEnabled: boolean;
  ttsVoiceId: string;
  customPrompt: string;
  temperature: number;
  mood: AgentMood;
}

const defaultSettings: AISettings = {
  assistantName: "Horus",
  model: "google/gemini-3-flash-preview",
  voiceEnabled: true,
  voiceLang: "pt-BR",
  ttsEnabled: false,
  ttsVoiceId: "EXAVITQu4vr4xnSDxMaL",
  customPrompt: "",
  temperature: 0.7,
  mood: "friendly",
};

const STORAGE_KEY = "horus-ai-settings";

const AISettingsContext = createContext<{
  settings: AISettings;
  updateSettings: (partial: Partial<AISettings>) => void;
}>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export const AISettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AISettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (partial: Partial<AISettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <AISettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AISettingsContext.Provider>
  );
};

export const useAISettings = () => useContext(AISettingsContext);
