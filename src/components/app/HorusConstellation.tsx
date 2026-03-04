import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface HorusConstellationProps {
  isThinking: boolean;
  isSpeaking: boolean;
  size?: number;
}

const PERSPECTIVE = 500;

interface SpherePoint {
  x0: number;
  y0: number;
  z0: number;
  radius: number;
  pulseOffset: number;
  opacity: number;
}

function generateSpherePoints(count: number): SpherePoint[] {
  const points: SpherePoint[] = [];
  for (let i = 0; i < count; i++) {
    // Uniform distribution on sphere surface
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);

    points.push({
      x0: Math.sin(phi) * Math.cos(theta),
      y0: Math.sin(phi) * Math.sin(theta),
      z0: Math.cos(phi),
      radius: 1.2 + Math.random() * 1.8,
      pulseOffset: Math.random() * Math.PI * 2,
      opacity: 0.4 + Math.random() * 0.6,
    });
  }
  return points;
}

export const HorusConstellation = ({
  isThinking,
  isSpeaking,
  size = 420,
}: HorusConstellationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const pointsRef = useRef<SpherePoint[]>(generateSpherePoints(220));
  const rotYRef = useRef(0);
  const rotXRef = useRef(0.25);

  const active = isThinking || isSpeaking;
  const cx = size / 2;
  const cy = size / 2;
  const globeRadius = size * 0.37;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;

      // Rotation speed increases when active
      const rotSpeed = isSpeaking ? 0.012 : isThinking ? 0.008 : 0.004;
      rotYRef.current += rotSpeed;
      rotXRef.current = 0.25 + Math.sin(t * 0.15) * 0.06;

      ctx.clearRect(0, 0, size, size);

      const cosRy = Math.cos(rotYRef.current);
      const sinRy = Math.sin(rotYRef.current);
      const cosRx = Math.cos(rotXRef.current);
      const sinRx = Math.sin(rotXRef.current);

      // Project all sphere points
      const projected = pointsRef.current.map((p, idx) => {
        // Rotate around Y
        const x1 = p.x0 * cosRy + p.z0 * sinRy;
        const z1 = -p.x0 * sinRy + p.z0 * cosRy;
        // Rotate around X
        const y2 = p.y0 * cosRx - z1 * sinRx;
        const z2 = p.y0 * sinRx + z1 * cosRx;

        // Perspective projection
        const scale = PERSPECTIVE / (PERSPECTIVE + z2 * globeRadius);
        const sx = cx + x1 * globeRadius * scale;
        const sy = cy + y2 * globeRadius * scale;
        const depth = (z2 + 1) / 2; // 0=back, 1=front

        return { p, sx, sy, scale, depth, z2, idx };
      });

      // Painter's algorithm - back to front
      projected.sort((a, b) => a.z2 - b.z2);

      // Draw connections between nearby front-facing points
      const maxConnDist = active ? size * 0.13 : size * 0.10;
      for (let i = 0; i < projected.length; i++) {
        if (projected[i].depth < 0.15) continue;
        for (let j = i + 1; j < projected.length; j++) {
          if (projected[j].depth < 0.15) continue;
          const dx = projected[i].sx - projected[j].sx;
          const dy = projected[i].sy - projected[j].sy;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxConnDist) {
            const depthFactor = projected[i].depth * projected[j].depth;
            const base = (1 - d / maxConnDist) * depthFactor * 0.12;
            const alpha = active
              ? base * (0.6 + Math.sin(t * 2.5 + i * 0.08) * 0.4)
              : base * 0.7;
            ctx.beginPath();
            ctx.moveTo(projected[i].sx, projected[i].sy);
            ctx.lineTo(projected[j].sx, projected[j].sy);
            ctx.strokeStyle = `rgba(0, 200, 255, ${Math.min(alpha, 0.35)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw points
      for (const { p, sx, sy, scale, depth } of projected) {
        if (depth < 0.02) continue;

        const pulse = active
          ? 0.55 + Math.sin(t * (isSpeaking ? 5 : 2.5) + p.pulseOffset) * 0.45
          : 0.35 + Math.sin(t * 0.6 + p.pulseOffset) * 0.12;

        const pointR = Math.max(0.4, p.radius * scale * (active ? 1.5 : 1));
        const alphaBase = depth * pulse * p.opacity;

        // Glow for front-facing points
        if (depth > 0.45) {
          const glowR = pointR * 5;
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
          glow.addColorStop(0, `rgba(0, 210, 255, ${alphaBase * 0.35})`);
          glow.addColorStop(1, `rgba(0, 210, 255, 0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(sx, sy, pointR, 0, Math.PI * 2);
        if (active) {
          ctx.fillStyle = `rgba(20, 230, 255, ${Math.min(alphaBase, 0.95)})`;
        } else {
          ctx.fillStyle = `rgba(100, 200, 240, ${Math.min(alphaBase * 0.75, 0.80)})`;
        }
        ctx.fill();
      }

      // Outer pulse ring when speaking
      if (isSpeaking) {
        const ringR = globeRadius + 10 + Math.sin(t * 3.5) * 7;
        const ringOpacity = 0.12 + Math.sin(t * 3.5) * 0.06;
        const ring = ctx.createRadialGradient(cx, cy, ringR - 18, cx, cy, ringR + 18);
        ring.addColorStop(0, "rgba(0, 200, 255, 0)");
        ring.addColorStop(0.5, `rgba(0, 200, 255, ${ringOpacity})`);
        ring.addColorStop(1, "rgba(0, 200, 255, 0)");
        ctx.fillStyle = ring;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR + 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // Thinking ring (slower pulsation)
      if (isThinking && !isSpeaking) {
        const ringR = globeRadius + 6 + Math.sin(t * 2) * 4;
        const ringOpacity = 0.07 + Math.sin(t * 2) * 0.03;
        const ring = ctx.createRadialGradient(cx, cy, ringR - 12, cx, cy, ringR + 12);
        ring.addColorStop(0, "rgba(0, 170, 255, 0)");
        ring.addColorStop(0.5, `rgba(0, 170, 255, ${ringOpacity})`);
        ring.addColorStop(1, "rgba(0, 170, 255, 0)");
        ctx.fillStyle = ring;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR + 12, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [active, isSpeaking, isThinking, size, cx, cy, globeRadius]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Ambient background glow */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-1000 pointer-events-none",
          isSpeaking
            ? "shadow-[0_0_140px_50px_rgba(0,200,255,0.18)]"
            : isThinking
            ? "shadow-[0_0_100px_30px_rgba(0,170,255,0.12)]"
            : "shadow-[0_0_60px_15px_rgba(0,140,200,0.06)]"
        )}
      />
      <canvas
        ref={canvasRef}
        className="relative z-10"
        style={{ width: size, height: size }}
      />
    </div>
  );
};

/** Compact indicator for sidebar/mini usage */
export const SmallConstellation = ({ isThinking }: { isThinking: boolean }) => (
  <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
    <div
      className={cn(
        "absolute inset-0 rounded-full border transition-all duration-500",
        isThinking
          ? "border-cyan-400/50 animate-spin"
          : "border-cyan-400/20"
      )}
      style={{ animationDuration: "3s" }}
    />
    <div
      className="absolute inset-1.5 rounded-full flex items-center justify-center"
      style={{
        background: isThinking
          ? "radial-gradient(circle, rgba(0,210,255,0.25) 0%, transparent 80%)"
          : "radial-gradient(circle, rgba(0,180,220,0.12) 0%, transparent 80%)",
      }}
    >
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{
          background: isThinking ? "rgba(0,220,255,0.8)" : "rgba(0,180,220,0.4)",
          boxShadow: isThinking
            ? "0 0 10px 3px rgba(0,220,255,0.6)"
            : "0 0 6px 1px rgba(0,180,220,0.25)",
        }}
      />
    </div>
  </div>
);
