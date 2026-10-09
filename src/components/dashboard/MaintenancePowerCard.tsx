import { motion } from "motion/react";
import { HardHat, Lightbulb, MapPin, Power } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { StatusBadge } from "@/components/common/StatusBadge";
import { sitePowerStatusQuery } from "@/features/queries";

/**
 * Big dashboard card: maintenance switch ON/OFF and colony power ON/OFF.
 * Colony power is the opposite of the maintenance switch (switch ON -> power OFF).
 */
export function MaintenancePowerCard({ index = 0 }: { index?: number }) {
  const { data } = useSuspenseQuery(sitePowerStatusQuery());
  const maintenanceOn = data.maintenanceSwitchOn;
  const powerOn = !maintenanceOn;

  return (
    <motion.article
      aria-label={`${data.colony} maintenance switch and colony power status`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.07 }}
      className={`panel flex flex-col gap-4 p-4 ${maintenanceOn ? "glow-accent" : ""}`}
    >
      <header className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-wide uppercase">Maintenance &amp; Power</h3>
          <p className="text-xs text-muted-foreground">{data.colony}</p>
        </div>
        <StatusBadge variant={data.live ? "normal" : "muted"}>
          {data.live ? "Live" : "Demo status"}
        </StatusBadge>
      </header>

      {/* Maintenance switch */}
      <div
        className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center ${
          maintenanceOn
            ? "border-warning/40 bg-warning/10"
            : "border-border bg-surface-2"
        }`}
      >
        <HardHat
          className={`size-7 ${maintenanceOn ? "text-warning" : "text-muted-foreground"}`}
          aria-hidden="true"
        />
        <p className="text-xs text-muted-foreground">Maintenance Switch</p>
        <p
          className={`text-5xl font-semibold tabular-nums ${
            maintenanceOn ? "text-warning" : "text-foreground"
          }`}
        >
          {maintenanceOn ? "ON" : "OFF"}
        </p>
        <p className="text-xs text-muted-foreground">
          {maintenanceOn ? "Worker on pole" : "No maintenance climb"}
        </p>
      </div>

      {/* Colony power */}
      <div
        className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center ${
          powerOn ? "border-normal/40 bg-normal/10" : "border-critical/40 bg-critical/10"
        }`}
      >
        {powerOn ? (
          <Lightbulb className="size-7 text-normal" aria-hidden="true" />
        ) : (
          <Power className="size-7 text-critical" aria-hidden="true" />
        )}
        <p className="text-xs text-muted-foreground">Colony Power</p>
        <p
          className={`text-5xl font-semibold tabular-nums ${
            powerOn ? "text-normal" : "text-critical"
          }`}
        >
          {powerOn ? "ON" : "OFF"}
        </p>
        <p className="text-xs text-muted-foreground">
          {powerOn ? "Colony lighting is on" : "Colony lighting is off for safety"}
        </p>
      </div>

      <footer className="border-t border-border pt-2">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" /> {data.colony}
        </p>
      </footer>
    </motion.article>
  );
}
