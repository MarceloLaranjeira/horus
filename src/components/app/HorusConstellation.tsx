import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  brightness: number;
  pulseOffset: number;
}

interface HorusConstellationProps {
  isThinking: boolean;
  isSpeaking: boolean;
}

const CANVAS_SIZE = 280;
const PARTICLE_COUNT = 60;
const BAR_COUNT = 40;
const CX = CANVAS_SIZE / 2;
const CY = CANVAS_SIZE / 2;

export const HorusConstellation = ({ isThinking, isSpeaking }: HorusConstellationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const barHeightsRef = useRef<number[]>(new Array(BAR_COUNT).fill(0));
  const targetHeightsRef = useRef<number[]>(new Array(BAR_COUNT).fill(0));
  const active = isThinking || isSpeaking;

  // Init particles once
  useEffect(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 110;
      const speed = 0.1 + Math.random() * 0.25;
      particles.push({
        x: CX + Math.cos(angle) * dist,
        y: CY + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        radius: 0.8 + Math.random() * 1.8,
        brightness: 0.2 + Math.random() * 0.8,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;
  }, []);

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

      // Always draw particles/stars
      drawParticles(ctx, t);

      // Draw frequency bars when speaking or thinking
      if (active) {
        drawFrequencyBars(ctx, t);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [active, isSpeaking, isThinking]);

  const drawParticles = (ctx: CanvasRenderingContext2D, t: number) => {
    const particles = particlesRef.current;
    const speedMult = isSpeaking ? 2.5 : isThinking ? 1.5 : 1;

    for (const p of particles) {
      p.x += p.vx * speedMult;
      p.y += p.vy * speedMult;

      // Bounce within circle
      const dx = p.x - CX;
      const dy = p.y - CY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = CANVAS_SIZE * 0.44;
      if (dist > maxDist) {
        p.x = CX + (dx / dist) * maxDist;
        p.y = CY + (dy / dist) * maxDist;
        p.vx *= -1;
        p.vy *= -1;
      }

      const pulse = active
        ? 0.5 + Math.sin(t * (isSpeaking ? 4 : 2) + p.pulseOffset) * 0.5
        : p.brightness * (0.4 + Math.sin(t * 0.5 + p.pulseOffset) * 0.15);

      // Glow
      const glowSize = p.radius * (active ? 3.5 : 2);
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
      glow.addColorStop(0, `rgba(0, 220, 240, ${pulse * 0.4})`);
      glow.addColorStop(1, `rgba(0, 220, 240, 0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * (active ? 1.2 : 0.8), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 220, 255, ${pulse * 0.8})`;
      ctx.fill();
    }

    // Connections (sparse)
    if (active) {
      const connDist = isSpeaking ? 70 : 55;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < connDist) {
            const alpha = (1 - d / connDist) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 210, 240, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }
  };

  const drawFrequencyBars = (ctx: CanvasRenderingContext2D, t: number) => {
    const bars = barHeightsRef.current;
    const targets = targetHeightsRef.current;
    const barWidth = 3;
    const gap = 1.5;
    const totalWidth = BAR_COUNT * (barWidth + gap);
    const startX = CX - totalWidth / 2;
    const barY = CANVAS_SIZE - 40; // Bottom area
    const maxH = isSpeaking ? 60 : 25;

    // Update targets
    if (Math.random() < (isSpeaking ? 0.35 : 0.12)) {
      for (let i = 0; i < BAR_COUNT; i++) {
        const center = 1 - Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2) * 0.5;
        targets[i] = isSpeaking
          ? (8 + Math.random() * maxH * center) * (0.4 + Math.sin(t * 3 + i * 0.4) * 0.6)
          : 3 + Math.random() * maxH * center * (0.3 + Math.sin(t * 1.5 + i * 0.5) * 0.3);
      }
    }

    const lerp = isSpeaking ? 0.18 : 0.08;
    for (let i = 0; i < BAR_COUNT; i++) {
      bars[i] += (targets[i] - bars[i]) * lerp;
    }

    for (let i = 0; i < BAR_COUNT; i++) {
      const x = startX + i * (barWidth + gap);
      const h = Math.max(1.5, bars[i]);

      const grad = ctx.createLinearGradient(x, barY - h, x, barY + h);
      const intensity = h / maxH;
      grad.addColorStop(0, `rgba(0, 160, 255, ${0.05 + intensity * 0.15})`);
      grad.addColorStop(0.3, `rgba(0, 200, 255, ${0.3 + intensity * 0.5})`);
      grad.addColorStop(0.5, `rgba(0, 240, 255, ${0.6 + intensity * 0.4})`);
      grad.addColorStop(0.7, `rgba(0, 200, 255, ${0.3 + intensity * 0.5})`);
      grad.addColorStop(1, `rgba(0, 160, 255, ${0.05 + intensity * 0.15})`);

      ctx.fillStyle = grad;
      ctx.fillRect(x, barY - h, barWidth, h); // up
      ctx.fillRect(x, barY, barWidth, h);     // down (mirror)
    }

    // Subtle center line
    ctx.beginPath();
    ctx.moveTo(startX - 3, barY);
    ctx.lineTo(startX + totalWidth + 3, barY);
    ctx.strokeStyle = "rgba(0, 230, 255, 0.1)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
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
    </div>
  );
};

/** Small indicator for message bubbles */
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
      <div className="w-2.5 h-2.5 rounded-full" style={{
        background: isThinking ? "rgba(0,255,255,0.7)" : "rgba(200,180,50,0.5)",
        boxShadow: isThinking ? "0 0 8px 2px rgba(0,255,255,0.5)" : "0 0 6px 1px rgba(200,180,50,0.3)",
      }} />
    </div>
  </div>
);
