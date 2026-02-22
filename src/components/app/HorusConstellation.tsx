import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface HorusConstellationProps {
  isThinking: boolean;
  isSpeaking: boolean;
}

const CANVAS_SIZE = 280;
const BAR_COUNT = 40;
const CENTER_X = CANVAS_SIZE / 2;
const CENTER_Y = CANVAS_SIZE / 2;

export const HorusConstellation = ({ isThinking, isSpeaking }: HorusConstellationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const barHeightsRef = useRef<number[]>(new Array(BAR_COUNT).fill(0));
  const targetHeightsRef = useRef<number[]>(new Array(BAR_COUNT).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      if (isSpeaking) {
        drawFrequencyBars(ctx, t, true);
      } else if (isThinking) {
        drawFrequencyBars(ctx, t, false);
      } else {
        drawIdleOrb(ctx, t);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isSpeaking, isThinking]);

  const drawFrequencyBars = (ctx: CanvasRenderingContext2D, t: number, speaking: boolean) => {
    const bars = barHeightsRef.current;
    const targets = targetHeightsRef.current;
    const barWidth = 3;
    const gap = 2;
    const totalWidth = BAR_COUNT * (barWidth + gap);
    const startX = CENTER_X - totalWidth / 2;
    const maxHeight = speaking ? 90 : 40;

    // Update target heights periodically
    if (Math.random() < (speaking ? 0.3 : 0.1)) {
      for (let i = 0; i < BAR_COUNT; i++) {
        const distFromCenter = Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
        const centerBoost = 1 - distFromCenter * 0.6;
        if (speaking) {
          targets[i] = (10 + Math.random() * maxHeight * centerBoost) *
            (0.5 + Math.sin(t * 3 + i * 0.3) * 0.5);
        } else {
          targets[i] = 5 + Math.random() * maxHeight * centerBoost *
            (0.3 + Math.sin(t * 1.5 + i * 0.5) * 0.3);
        }
      }
    }

    // Smoothly interpolate
    const lerp = speaking ? 0.15 : 0.08;
    for (let i = 0; i < BAR_COUNT; i++) {
      bars[i] += (targets[i] - bars[i]) * lerp;
    }

    // Draw bars
    for (let i = 0; i < BAR_COUNT; i++) {
      const x = startX + i * (barWidth + gap);
      const h = Math.max(2, bars[i]);
      const yTop = CENTER_Y - h;
      const yBot = CENTER_Y;

      // Top half (mirrored)
      const grad = ctx.createLinearGradient(x, yTop, x, CENTER_Y + h);
      if (speaking) {
        const intensity = h / maxHeight;
        grad.addColorStop(0, `rgba(0, 180, 255, ${0.1 + intensity * 0.2})`);
        grad.addColorStop(0.3, `rgba(0, 220, 255, ${0.5 + intensity * 0.5})`);
        grad.addColorStop(0.5, `rgba(0, 255, 255, ${0.8 + intensity * 0.2})`);
        grad.addColorStop(0.7, `rgba(0, 220, 255, ${0.5 + intensity * 0.5})`);
        grad.addColorStop(1, `rgba(0, 180, 255, ${0.1 + intensity * 0.2})`);
      } else {
        grad.addColorStop(0, `rgba(0, 200, 220, 0.05)`);
        grad.addColorStop(0.5, `rgba(0, 220, 240, 0.4)`);
        grad.addColorStop(1, `rgba(0, 200, 220, 0.05)`);
      }

      ctx.fillStyle = grad;
      // Top bars
      ctx.fillRect(x, yTop, barWidth, h);
      // Bottom bars (mirror)
      ctx.fillRect(x, yBot, barWidth, h);
    }

    // Center glow
    const glowRadius = speaking ? 30 + Math.sin(t * 4) * 10 : 20 + Math.sin(t * 2) * 5;
    const glow = ctx.createRadialGradient(CENTER_X, CENTER_Y, 0, CENTER_X, CENTER_Y, glowRadius);
    glow.addColorStop(0, speaking ? "rgba(0, 255, 255, 0.25)" : "rgba(0, 220, 240, 0.12)");
    glow.addColorStop(0.5, speaking ? "rgba(0, 200, 255, 0.08)" : "rgba(0, 200, 220, 0.04)");
    glow.addColorStop(1, "rgba(0, 200, 255, 0)");
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Center line
    ctx.beginPath();
    ctx.moveTo(startX - 5, CENTER_Y);
    ctx.lineTo(startX + totalWidth + 5, CENTER_Y);
    ctx.strokeStyle = speaking ? "rgba(0, 255, 255, 0.15)" : "rgba(0, 220, 240, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawIdleOrb = (ctx: CanvasRenderingContext2D, t: number) => {
    // Subtle breathing orb when idle
    const radius = 8 + Math.sin(t * 0.8) * 2;

    // Outer glow
    const outerGlow = ctx.createRadialGradient(CENTER_X, CENTER_Y, 0, CENTER_X, CENTER_Y, radius * 5);
    outerGlow.addColorStop(0, "rgba(0, 210, 210, 0.12)");
    outerGlow.addColorStop(0.5, "rgba(0, 200, 200, 0.04)");
    outerGlow.addColorStop(1, "rgba(0, 200, 200, 0)");
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, radius * 5, 0, Math.PI * 2);
    ctx.fillStyle = outerGlow;
    ctx.fill();

    // Inner glow
    const innerGlow = ctx.createRadialGradient(CENTER_X, CENTER_Y, 0, CENTER_X, CENTER_Y, radius * 2);
    innerGlow.addColorStop(0, "rgba(0, 220, 220, 0.3)");
    innerGlow.addColorStop(1, "rgba(0, 220, 220, 0)");
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, radius * 2, 0, Math.PI * 2);
    ctx.fillStyle = innerGlow;
    ctx.fill();

    // Core dot
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 210, 210, ${0.4 + Math.sin(t) * 0.15})`;
    ctx.fill();
  };

  return (
    <div className="relative w-[280px] h-[280px] mx-auto flex items-center justify-center">
      <div className={cn(
        "absolute inset-0 rounded-full blur-3xl transition-all duration-700",
        isSpeaking
          ? "bg-primary/10 shadow-[0_0_100px_30px_hsl(var(--cyan)/0.12)]"
          : isThinking
            ? "bg-primary/6 shadow-[0_0_60px_15px_hsl(var(--cyan)/0.08)]"
            : "bg-primary/3"
      )} />

      <canvas
        ref={canvasRef}
        className="relative z-10"
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
      />

      {!isSpeaking && !isThinking && (
        <motion.div
          className="absolute z-20 w-8 h-8 rounded-full flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(circle, rgba(0,210,210,0.25) 0%, transparent 100%)",
          }}
        />
      )}
    </div>
  );
};

/** Small constellation for message bubbles */
export const SmallConstellation = ({ isThinking }: { isThinking: boolean }) => (
  <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
    <div className={cn(
      "absolute inset-0 rounded-full border transition-all duration-500",
      isThinking ? "border-primary/50 animate-arc-spin" : "border-[hsl(var(--nectar-gold))]/30 animate-globe-rotate"
    )} />
    <div className="absolute inset-1.5 rounded-full flex items-center justify-center"
      style={{
        background: isThinking
          ? "radial-gradient(circle, rgba(0,255,255,0.2) 0%, transparent 80%)"
          : "radial-gradient(circle, rgba(200,180,50,0.15) 0%, transparent 80%)",
      }}>
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{
          background: isThinking ? "rgba(0,255,255,0.7)" : "rgba(200,180,50,0.5)",
          boxShadow: isThinking ? "0 0 8px 2px rgba(0,255,255,0.5)" : "0 0 6px 1px rgba(200,180,50,0.3)",
        }}
      />
    </div>
  </div>
);
