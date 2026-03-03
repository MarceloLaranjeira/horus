import confetti from "canvas-confetti";

export const fireConfetti = () => {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#2dd4bf", "#facc15", "#6366f1", "#f97316"],
    disableForReducedMotion: true,
  });
};
