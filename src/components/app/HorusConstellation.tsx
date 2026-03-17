import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface HorusConstellationProps {
  isThinking: boolean;
  isSpeaking: boolean;
  size?: number;
}

const PERSPECTIVE = 500;

// Detect mobile once at module load
const IS_MOBILE = typeof window !== "undefined" && window.innerWidth < 768;
const POINT_COUNT = IS_MOBILE ? 80 : 220;
const RING_STEPS  = IS_MOBILE ? 60  : 120;
// On mobile limit expensive O(n²) connections
const MAX_CONNECTIONS = IS_MOBILE ? 120 : Infinity;

interface SpherePoint {
  x0: number; y0: number; z0: number;
  radius: number; pulseOffset: number; opacity: number;
}

function generateSpherePoints(count: number): SpherePoint[] {
  const pts: SpherePoint[] = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    pts.push({
      x0: Math.sin(phi) * Math.cos(theta),
      y0: Math.sin(phi) * Math.sin(theta),
      z0: Math.cos(phi),
      radius: 1.1 + Math.random() * 1.8,
      pulseOffset: Math.random() * Math.PI * 2,
      opacity: 0.35 + Math.random() * 0.65,
    });
  }
  return pts;
}

/** Project a 3-D unit-sphere point through globe rotations onto canvas */
function projectPoint(
  px: number, py: number, pz: number,
  globeRadius: number, rotY: number, rotX: number,
  cx: number, cy: number,
) {
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const x1 = px * cosY + pz * sinY;
  const z1 = -px * sinY + pz * cosY;
  const y2 = py * cosX - z1 * sinX;
  const z2 = py * sinX + z1 * cosX;
  const s = PERSPECTIVE / (PERSPECTIVE + z2 * globeRadius);
  return { sx: cx + x1 * globeRadius * s, sy: cy + y2 * globeRadius * s, z2, depth: (z2 + 1) / 2 };
}

/** Draw a 3-D elliptical orbit ring with depth-aware opacity */
function drawOrbitRing(
  ctx: CanvasRenderingContext2D,
  globeRadius: number, rotY: number, rotX: number,
  cx: number, cy: number,
  tiltX: number, tiltZ: number,
  color: [number, number, number], active: boolean, t: number,
) {
  const steps = RING_STEPS;
  const pts: { sx: number; sy: number; depth: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    let rx = Math.cos(a), ry = 0, rz = Math.sin(a);

    // Apply ring's own tilt
    if (tiltX !== 0) {
      const cy2 = ry * Math.cos(tiltX) - rz * Math.sin(tiltX);
      const cz2 = ry * Math.sin(tiltX) + rz * Math.cos(tiltX);
      ry = cy2; rz = cz2;
    }
    if (tiltZ !== 0) {
      const cx2 = rx * Math.cos(tiltZ) - ry * Math.sin(tiltZ);
      const cy2 = rx * Math.sin(tiltZ) + ry * Math.cos(tiltZ);
      rx = cx2; ry = cy2;
    }
    pts.push(projectPoint(rx, ry, rz, globeRadius, rotY, rotX, cx, cy));
  }

  const ringScale = active ? 1.02 + Math.sin(t * 2.8) * 0.012 : 1;

  for (let i = 0; i < steps; i++) {
    const p1 = pts[i], p2 = pts[i + 1];
    const depth = (p1.depth + p2.depth) / 2;
    if (depth < 0.05) continue;
    const alpha = depth * (active ? 0.55 : 0.25);
    ctx.beginPath();
    ctx.moveTo(cx + (p1.sx - cx) * ringScale, cy + (p1.sy - cy) * ringScale);
    ctx.lineTo(cx + (p2.sx - cx) * ringScale, cy + (p2.sy - cy) * ringScale);
    ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
    ctx.lineWidth = active ? 1.1 : 0.6;
    ctx.stroke();
  }
}

export const HorusConstellation = ({
  isThinking, isSpeaking, size = 420,
}: HorusConstellationProps) => {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const timeRef     = useRef(0);
  const lastFrameTs = useRef(0);
  const ptsRef      = useRef<SpherePoint[]>(generateSpherePoints(POINT_COUNT));
  const rotYRef     = useRef(0);
  const rotXRef     = useRef(0.25);

  const active = isThinking || isSpeaking;
  const cx = size / 2, cy = size / 2;
  const R  = size * 0.365;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const tick = (timestamp: number) => {
      // On mobile, cap at ~30fps to reduce main-thread load
      if (IS_MOBILE) {
        const elapsed = timestamp - lastFrameTs.current;
        if (elapsed < 33) { rafRef.current = requestAnimationFrame(tick); return; }
        lastFrameTs.current = timestamp;
      }

      timeRef.current += 0.016;
      const t   = timeRef.current;
      const spd = isSpeaking ? 0.014 : isThinking ? 0.009 : 0.004;
      rotYRef.current += spd;
      rotXRef.current  = 0.25 + Math.sin(t * 0.18) * 0.07;

      const rY = rotYRef.current, rX = rotXRef.current;
      const cosY = Math.cos(rY), sinY = Math.sin(rY);
      const cosX = Math.cos(rX), sinX = Math.sin(rX);

      ctx.clearRect(0, 0, size, size);

      /* ── Scanline sweep (only when active) ─────────────────────────── */
      if (active) {
        const sweep = ((t * 0.4) % 1) * size;
        const grad  = ctx.createLinearGradient(0, sweep - 30, 0, sweep + 30);
        grad.addColorStop(0,   "rgba(0,220,255,0)");
        grad.addColorStop(0.5, `rgba(0,220,255,${isSpeaking ? 0.07 : 0.04})`);
        grad.addColorStop(1,   "rgba(0,220,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(cx - R - 10, sweep - 30, (R + 10) * 2, 60);
      }

      /* ── Orbit rings ────────────────────────────────────────────────── */
      // Equatorial ring
      drawOrbitRing(ctx, R, rY, rX, cx, cy, 0, 0,    [0, 200, 255], active, t);
      // Inclined ring 1 (~60°)
      drawOrbitRing(ctx, R, rY, rX, cx, cy, 1.05, 0, [0, 180, 240], active, t);
      // Inclined ring 2 (~120°, opposite tilt)
      drawOrbitRing(ctx, R, rY, rX, cx, cy, -1.05, 0.5, [80, 160, 255], active, t);

      /* ── Project sphere points ──────────────────────────────────────── */
      const projected = ptsRef.current.map((p) => {
        const x1 = p.x0 * cosY + p.z0 * sinY;
        const z1 = -p.x0 * sinY + p.z0 * cosY;
        const y2 = p.y0 * cosX - z1 * sinX;
        const z2 = p.y0 * sinX + z1 * cosX;
        const sc = PERSPECTIVE / (PERSPECTIVE + z2 * R);
        return { p, sx: cx + x1 * R * sc, sy: cy + y2 * R * sc, sc, depth: (z2 + 1) / 2, z2 };
      });
      projected.sort((a, b) => a.z2 - b.z2);

      /* ── Connection lines ───────────────────────────────────────────── */
      const maxD = active ? size * 0.13 : size * 0.095;
      let connCount = 0;
      outer: for (let i = 0; i < projected.length; i++) {
        if (projected[i].depth < 0.18) continue;
        for (let j = i + 1; j < projected.length; j++) {
          if (projected[j].depth < 0.18) continue;
          const dx = projected[i].sx - projected[j].sx;
          const dy = projected[i].sy - projected[j].sy;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d > maxD) continue;
          const df   = projected[i].depth * projected[j].depth;
          const base = (1 - d / maxD) * df * 0.11;
          const a    = active ? base * (0.55 + Math.sin(t * 2.5 + i * 0.07) * 0.45) : base * 0.65;
          ctx.beginPath();
          ctx.moveTo(projected[i].sx, projected[i].sy);
          ctx.lineTo(projected[j].sx, projected[j].sy);
          ctx.strokeStyle = `rgba(0,200,255,${Math.min(a, 0.32)})`;
          ctx.lineWidth   = 0.45;
          ctx.stroke();
          if (++connCount >= MAX_CONNECTIONS) break outer;
        }
      }

      /* ── Dots ───────────────────────────────────────────────────────── */
      for (const { p, sx, sy, sc, depth } of projected) {
        if (depth < 0.02) continue;
        const pulse = active
          ? 0.5 + Math.sin(t * (isSpeaking ? 5.5 : 2.8) + p.pulseOffset) * 0.5
          : 0.3 + Math.sin(t * 0.55 + p.pulseOffset) * 0.12;
        const pr    = Math.max(0.4, p.radius * sc * (active ? 1.55 : 1));
        const alpha = Math.min(depth * pulse * p.opacity, 0.95);

        if (!IS_MOBILE && depth > 0.42) {
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, pr * 5);
          glow.addColorStop(0, `rgba(0,210,255,${alpha * 0.38})`);
          glow.addColorStop(1, "rgba(0,210,255,0)");
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(sx, sy, pr * 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(sx, sy, pr, 0, Math.PI * 2);
        ctx.fillStyle = active
          ? `rgba(20,235,255,${alpha})`
          : `rgba(110,200,240,${alpha * 0.75})`;
        ctx.fill();
      }

      /* ── Outer pulse ring when speaking ────────────────────────────── */
      if (isSpeaking && !IS_MOBILE) {
        const rr  = R + 10 + Math.sin(t * 3.6) * 8;
        const op  = 0.13 + Math.sin(t * 3.6) * 0.06;
        const rg  = ctx.createRadialGradient(cx, cy, rr - 20, cx, cy, rr + 20);
        rg.addColorStop(0,   "rgba(0,200,255,0)");
        rg.addColorStop(0.5, `rgba(0,200,255,${op})`);
        rg.addColorStop(1,   "rgba(0,200,255,0)");
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(cx, cy, rr + 20, 0, Math.PI * 2); ctx.fill();
      }

      /* ── Slow glow ring when thinking ───────────────────────────────── */
      if (isThinking && !isSpeaking && !IS_MOBILE) {
        const rr = R + 6 + Math.sin(t * 2.1) * 4;
        const op = 0.07 + Math.sin(t * 2.1) * 0.03;
        const rg = ctx.createRadialGradient(cx, cy, rr - 14, cx, cy, rr + 14);
        rg.addColorStop(0,   "rgba(0,170,255,0)");
        rg.addColorStop(0.5, `rgba(0,170,255,${op})`);
        rg.addColorStop(1,   "rgba(0,170,255,0)");
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(cx, cy, rr + 14, 0, Math.PI * 2); ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, isSpeaking, isThinking, size, cx, cy, R]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className={cn(
          "absolute inset-0 rounded-full pointer-events-none transition-all duration-1000",
          isSpeaking  ? "shadow-[0_0_160px_55px_rgba(0,200,255,0.20)]"
            : isThinking ? "shadow-[0_0_110px_35px_rgba(0,170,255,0.14)]"
            : "shadow-[0_0_70px_18px_rgba(0,140,200,0.07)]"
        )}
      />
      <canvas ref={canvasRef} className="relative z-10" style={{ width: size, height: size }} />
    </div>
  );
};

export const SmallConstellation = ({ isThinking }: { isThinking: boolean }) => (
  <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
    <div
      className={cn("absolute inset-0 rounded-full border transition-all duration-500", isThinking ? "border-cyan-400/50 animate-spin" : "border-cyan-400/20")}
      style={{ animationDuration: "3s" }}
    />
    <div
      className="absolute inset-1.5 rounded-full"
      style={{ background: isThinking ? "radial-gradient(circle,rgba(0,210,255,0.25) 0%,transparent 80%)" : "radial-gradient(circle,rgba(0,180,220,0.12) 0%,transparent 80%)" }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: isThinking ? "rgba(0,220,255,0.8)" : "rgba(0,180,220,0.4)", boxShadow: isThinking ? "0 0 10px 3px rgba(0,220,255,0.6)" : "0 0 6px 1px rgba(0,180,220,0.25)" }} />
      </div>
    </div>
  </div>
);
