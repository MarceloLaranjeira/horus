import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface InteractiveProgressProps {
  value: number;
  label?: string;
  onValueChange?: (newValue: number) => void;
  className?: string;
  showPercentage?: boolean;
}

export const InteractiveProgress = ({
  value,
  label,
  onValueChange,
  className,
  showPercentage = true,
}: InteractiveProgressProps) => {
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const calculateValue = useCallback((clientX: number) => {
    if (!barRef.current) return value;
    const rect = barRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.round(Math.max(0, Math.min(100, (x / rect.width) * 100)));
    return percent;
  }, [value]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!onValueChange) return;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const newVal = calculateValue(e.clientX);
    onValueChange(newVal);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !onValueChange) return;
    const newVal = calculateValue(e.clientX);
    onValueChange(newVal);
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const interactive = !!onValueChange;

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {label && <span>{label}</span>}
          {showPercentage && (
            <motion.span
              key={value}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={cn("font-medium", dragging ? "text-primary" : "text-foreground")}
            >
              {value}%
            </motion.span>
          )}
        </div>
      )}
      <div
        ref={barRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative h-3 w-full overflow-hidden rounded-full bg-secondary/50 transition-all",
          interactive && "cursor-pointer hover:h-4",
          dragging && "h-4"
        )}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--nectar-green))] to-[hsl(var(--cyan,190_95%_50%))]"
          initial={false}
          animate={{ width: `${value}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        {interactive && (hovered || dragging) && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary border-2 border-background shadow-lg"
            initial={false}
            animate={{ left: `calc(${value}% - 10px)` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </div>
    </div>
  );
};
