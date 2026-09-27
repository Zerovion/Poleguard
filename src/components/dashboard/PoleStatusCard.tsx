import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, MapPin } from "lucide-react";

import { GaugeRing } from "./GaugeRing";
import { Sparkline } from "@/components/charts/Charts";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Pole } from "@/types";

const statusLabel = { normal: "Normal", warning: "Warning", critical: "Critical", offline: "Offline" };

export function PoleStatusCard({ pole, index = 0 }: { pole: Pole; index?: number }) {
  const tone = pole.status === "offline" ? "normal" : pole.status;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.07 }}
      className={`panel flex flex-col gap-4 p-4 ${
        pole.status === "critical" ? "glow-critical" : pole.status === "warning" ? "glow-accent" : ""
      }`}
    >
      <header className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-wide uppercase">{pole.name}</h3>
          <p className="text-xs text-muted-foreground">{pole.monitoring}</p>
        </div>
        <StatusBadge variant="accent">{pole.id}</StatusBadge>
      </header>

      {pole.metric === "tilt" ? (
        <GaugeRing
          value={pole.value}
          max={pole.threshold.critical}
          unit={pole.unit}
          label="Tilt Angle"
          tone={tone as "normal" | "warning" | "critical"}
        />
      ) : pole.metric === "sag" ? (
        <div className="text-center">
          <p className="text-4xl font-semibold text-accent tabular-nums">
            {pole.value.toFixed(2)} <span className="text-2xl">{pole.unit}</span>
          </p>
          <p className="text-xs text-muted-foreground">Measured Wire Sag</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {pole.secondary?.map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-surface-2 p-2.5">
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className="font-mono text-sm tabular-nums">
                  {s.value.toFixed(3)} {s.unit}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Leakage Difference</p>
            <p className="text-3xl font-semibold text-critical tabular-nums">
              {pole.value.toFixed(3)} <span className="text-xl">{pole.unit}</span>
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <StatusBadge variant={tone as "normal" | "warning" | "critical"} dot>
          {statusLabel[pole.status]}
        </StatusBadge>
      </div>

      <Sparkline
        values={pole.sparkline}
        tone={pole.metric === "sag" ? "violet" : pole.metric === "leakage" ? "critical" : "accent"}
      />

      <footer className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" /> {pole.location}
        </p>
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-xs text-muted-foreground">
            Last Updated: {pole.lastUpdated}
          </span>
          <Button asChild size="icon" variant="secondary" aria-label={`Open ${pole.name} details`}>
            <Link to="/" search={{ pole: pole.id }}>
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </footer>
    </motion.article>
  );
}
