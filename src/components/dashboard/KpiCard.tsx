import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const tones = {
  accent: "text-accent bg-accent/10 border-accent/25",
  normal: "text-normal bg-normal/10 border-normal/25",
  warning: "text-warning bg-warning/10 border-warning/25",
  critical: "text-critical bg-critical/10 border-critical/25",
} as const;

export function KpiCard({
  label,
  value,
  caption,
  icon: Icon,
  tone = "accent",
  index = 0,
}: {
  label: string;
  value: string | number;
  caption: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="panel p-4"
    >
      <div className="flex items-start gap-3">
        <span className={cn("flex size-9 items-center justify-center rounded-lg border", tones[tone])}>
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "text-[11px] font-semibold tracking-widest uppercase",
              tones[tone].split(" ")[0],
            )}
          >
            {label}
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{caption}</p>
        </div>
      </div>
    </motion.div>
  );
}
