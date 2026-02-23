import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme on load
const savedTheme = localStorage.getItem("horus-theme") || "dark";
if (savedTheme === "light" || (savedTheme === "system" && window.matchMedia("(prefers-color-scheme: light)").matches)) {
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.add("light");
} else {
  document.documentElement.classList.remove("light");
  document.documentElement.classList.add("dark");
}

// Apply saved visual theme
const savedVisualTheme = localStorage.getItem("horus-visual-theme") || "nectar";
document.documentElement.setAttribute("data-theme", savedVisualTheme);

createRoot(document.getElementById("root")!).render(<App />);
