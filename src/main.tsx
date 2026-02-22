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

createRoot(document.getElementById("root")!).render(<App />);
