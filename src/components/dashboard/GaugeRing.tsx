import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export function GaugeRing({
  value,
  max,
  unit,
  label,
  tone = "normal",
  size = 168,
}: {
  value: number;
  max: number;
  unit: string;
  label: string;
  tone?: "normal" | "warning" | "critical";
  size?: number;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = 0.75; // 270deg gauge
  const color =
    tone === "critical"
      ? "var(--color-critical)"
      : tone === "warning"
        ? "var(--color-warning)"
        : "var(--color-normal)";

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[225deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * arc} ${c}`}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${c * arc * pct} ${c}` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-semibold tabular-nums")} style={{ color }}>
          {value}
          {unit}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
