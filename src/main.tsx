import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

const readStorage = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const prefersLightTheme = () => {
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches;
  } catch {
    return false;
  }
};

// Apply saved theme on load with mobile/webview-safe fallbacks.
const savedTheme = readStorage("horus-theme", "dark");
if (savedTheme === "light" || (savedTheme === "system" && prefersLightTheme())) {
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.add("light");
} else {
  document.documentElement.classList.remove("light");
  document.documentElement.classList.add("dark");
}

// Apply saved visual theme.
const savedVisualTheme = readStorage("horus-visual-theme", "nectar");
document.documentElement.setAttribute("data-theme", savedVisualTheme);

if ("serviceWorker" in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSW(true);
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      window.setInterval(() => {
        registration.update().catch(() => undefined);
      }, 60 * 60 * 1000);
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
