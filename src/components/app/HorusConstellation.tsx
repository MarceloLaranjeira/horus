import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  radius: number;
  brightness: number;
  pulseOffset: number;
}

interface HorusConstellationProps {
  isThinking: boolean;
  isSpeaking: boolean;
}

const PARTICLE_COUNT = 80;
const CONNECTION_DISTANCE = 100;
const CANVAS_SIZE = 280;

export const HorusConstellation = ({ isThinking, isSpeaking }: HorusConstellationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const active = isThinking || isSpeaking;

  const initParticles = useCallback(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 100;
      const speed = 0.15 + Math.random() * 0.3;
      particles.push({
        x: CANVAS_SIZE / 2 + Math.cos(angle) * dist,
        y: CANVAS_SIZE / 2 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        baseVx: (Math.random() - 0.5) * speed,
        baseVy: (Math.random() - 0.5) * speed,
        radius: 1 + Math.random() * 2,
        brightness: 0.3 + Math.random() * 0.7,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    initParticles();
  }, [initParticles]);

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

      const particles = particlesRef.current;
      const cx = CANVAS_SIZE / 2;
      const cy = CANVAS_SIZE / 2;

      // Update particles
      for (const p of particles) {
        const speedMult = isSpeaking ? 3 : isThinking ? 1.8 : 1;

        if (isSpeaking) {
          // Pulsating expansion/contraction
          const pulse = Math.sin(t * 4 + p.pulseOffset) * 1.5;
          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          p.vx = p.baseVx * speedMult + (dx / dist) * pulse * 0.3;
          p.vy = p.baseVy * speedMult + (dy / dist) * pulse * 0.3;
        } else {
          p.vx = p.baseVx * speedMult;
          p.vy = p.baseVy * speedMult;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Keep within bounds (circular)
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = CANVAS_SIZE * 0.44;
        if (dist > maxDist) {
          p.x = cx + (dx / dist) * maxDist;
          p.y = cy + (dy / dist) * maxDist;
          p.baseVx *= -1;
          p.baseVy *= -1;
          p.vx *= -1;
          p.vy *= -1;
        }
      }

      // Draw connections
      const connDist = isSpeaking ? CONNECTION_DISTANCE * 1.3 : isThinking ? CONNECTION_DISTANCE * 1.1 : CONNECTION_DISTANCE;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connDist) {
            const alpha = (1 - dist / connDist) * (active ? 0.4 : 0.15);
            const pulse = isSpeaking ? Math.sin(t * 3 + i * 0.1) * 0.15 + 0.85 : 1;

            // Cyan-gold gradient line
            const grad = ctx.createLinearGradient(
              particles[i].x, particles[i].y,
              particles[j].x, particles[j].y
            );
            if (active) {
              grad.addColorStop(0, `rgba(0, 230, 230, ${alpha * pulse})`);
              grad.addColorStop(0.5, `rgba(180, 160, 60, ${alpha * pulse * 0.6})`);
              grad.addColorStop(1, `rgba(0, 230, 230, ${alpha * pulse})`);
            } else {
              grad.addColorStop(0, `rgba(0, 200, 200, ${alpha})`);
              grad.addColorStop(1, `rgba(0, 200, 200, ${alpha})`);
            }

            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = active ? 0.8 : 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        const pulse = isSpeaking
          ? 0.7 + Math.sin(t * 5 + p.pulseOffset) * 0.3
          : isThinking
            ? 0.8 + Math.sin(t * 2 + p.pulseOffset) * 0.2
            : p.brightness;

        const r = p.radius * (active ? 1.3 : 1);

        // Glow
        const glowSize = r * (active ? 4 : 2.5);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        if (active) {
          glow.addColorStop(0, `rgba(0, 240, 240, ${pulse * 0.6})`);
          glow.addColorStop(0.4, `rgba(200, 180, 50, ${pulse * 0.15})`);
          glow.addColorStop(1, `rgba(0, 240, 240, 0)`);
        } else {
          glow.addColorStop(0, `rgba(0, 200, 200, ${pulse * 0.3})`);
          glow.addColorStop(1, `rgba(0, 200, 200, 0)`);
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = active
          ? `rgba(0, 255, 255, ${pulse})`
          : `rgba(0, 210, 210, ${pulse * 0.7})`;
        ctx.fill();
      }

      // Center core glow
      if (active) {
        const coreRadius = isSpeaking ? 12 + Math.sin(t * 6) * 5 : 10 + Math.sin(t * 2) * 2;
        const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 3);
        coreGlow.addColorStop(0, `rgba(0, 255, 255, ${isSpeaking ? 0.3 : 0.15})`);
        coreGlow.addColorStop(0.3, `rgba(200, 180, 50, ${isSpeaking ? 0.1 : 0.05})`);
        coreGlow.addColorStop(1, "rgba(0, 255, 255, 0)");
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = coreGlow;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [active, isSpeaking, isThinking]);

  return (
    <div className="relative w-[280px] h-[280px] mx-auto flex items-center justify-center">
      {/* Background ambient glow */}
      <div className={cn(
        "absolute inset-0 rounded-full blur-3xl transition-all duration-700",
        isSpeaking
          ? "bg-primary/10 shadow-[0_0_100px_30px_hsl(var(--cyan)/0.12)]"
          : isThinking
            ? "bg-primary/6 shadow-[0_0_60px_15px_hsl(var(--cyan)/0.08)]"
            : "bg-primary/3"
      )} />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="relative z-10"
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
      />

      {/* Center eye icon */}
      <motion.div
        className="absolute z-20 w-8 h-8 rounded-full flex items-center justify-center"
        animate={{
          scale: isSpeaking ? [1, 1.2, 1, 1.15, 1] : isThinking ? [1, 1.08, 1] : 1,
          boxShadow: active
            ? [
                "0 0 15px 4px rgba(0,255,255,0.3), 0 0 30px 8px rgba(200,180,50,0.15)",
                "0 0 25px 8px rgba(0,255,255,0.5), 0 0 50px 15px rgba(200,180,50,0.2)",
                "0 0 15px 4px rgba(0,255,255,0.3), 0 0 30px 8px rgba(200,180,50,0.15)",
              ]
            : "0 0 8px 2px rgba(0,255,255,0.2)",
        }}
        transition={{
          duration: isSpeaking ? 0.5 : 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: active
            ? "radial-gradient(circle, rgba(0,255,255,0.5) 0%, rgba(0,200,200,0.2) 60%, transparent 100%)"
            : "radial-gradient(circle, rgba(0,210,210,0.25) 0%, transparent 100%)",
        }}
      />
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
          background: isThinking
            ? "rgba(0,255,255,0.7)"
            : "rgba(200,180,50,0.5)",
          boxShadow: isThinking
            ? "0 0 8px 2px rgba(0,255,255,0.5)"
            : "0 0 6px 1px rgba(200,180,50,0.3)",
        }}
      />
    </div>
  </div>
);
