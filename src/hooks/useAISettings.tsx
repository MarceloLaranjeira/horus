import { useState, useEffect, createContext, useContext, ReactNode } from "react";

export type AIModel =
  | "google/gemini-3-flash-preview"
  | "google/gemini-2.5-flash"
  | "google/gemini-2.5-pro"
  | "openai/gpt-5"
  | "openai/gpt-5-mini";

export interface AISettings {
  assistantName: string;
  model: AIModel;
  voiceEnabled: boolean;
  voiceLang: string;
}

const defaultSettings: AISettings = {
  assistantName: "AuraTask",
  model: "google/gemini-3-flash-preview",
  voiceEnabled: true,
  voiceLang: "pt-BR",
};

const STORAGE_KEY = "auratask-ai-settings";

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
