import { useState, useEffect, useCallback } from "react";

export type ColorMode = "dark" | "light" | "system";

export interface VisualTheme {
  id: string;
  name: string;
  description: string;
  preview: {
    bg: string;
    primary: string;
    accent: string;
    card: string;
  };
}

export const visualThemes: VisualTheme[] = [
  {
    id: "nectar",
    name: "Néctar",
    description: "Ciano & dourado — o padrão Horus",
    preview: { bg: "#0f1729", primary: "#0dbfa5", accent: "#f5a623", card: "#162033" },
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Roxo vibrante & rosa neon",
    preview: { bg: "#110e1f", primary: "#a855f7", accent: "#ec4899", card: "#1a1530" },
  },
  {
    id: "ocean",
    name: "Oceano",
    description: "Azul profundo & ciano suave",
    preview: { bg: "#0a1628", primary: "#3b82f6", accent: "#06b6d4", card: "#111f36" },
  },
  {
    id: "forest",
    name: "Floresta",
    description: "Verde esmeralda & terra",
    preview: { bg: "#0c1a12", primary: "#10b981", accent: "#a3e635", card: "#12261a" },
  },
  {
    id: "sunset",
    name: "Pôr do Sol",
    description: "Laranja quente & vermelho",
    preview: { bg: "#1a0f0a", primary: "#f97316", accent: "#ef4444", card: "#261812" },
  },
  {
    id: "monochrome",
    name: "Monocromático",
    description: "Preto, branco & cinza elegante",
    preview: { bg: "#111111", primary: "#ffffff", accent: "#888888", card: "#1a1a1a" },
  },
];

function applyColorMode(mode: ColorMode) {
  const root = document.documentElement;
  const isLight =
    mode === "light" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: light)").matches);
  root.classList.toggle("light", isLight);
  root.classList.toggle("dark", !isLight);
}

function applyVisualTheme(themeId: string) {
  document.documentElement.setAttribute("data-theme", themeId);
}

export function useTheme() {
  const [colorMode, setColorMode] = useState<ColorMode>(
    () => (localStorage.getItem("horus-theme") as ColorMode) || "dark"
  );
  const [visualTheme, setVisualTheme] = useState<string>(
    () => localStorage.getItem("horus-visual-theme") || "nectar"
  );

  useEffect(() => {
    localStorage.setItem("horus-theme", colorMode);
    applyColorMode(colorMode);
    if (colorMode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const handler = () => applyColorMode("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [colorMode]);

  useEffect(() => {
    localStorage.setItem("horus-visual-theme", visualTheme);
    applyVisualTheme(visualTheme);
  }, [visualTheme]);

  return { colorMode, setColorMode, visualTheme, setVisualTheme };
}
