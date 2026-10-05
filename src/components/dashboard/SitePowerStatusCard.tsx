import { HardHat, Lightbulb, Power } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { StatusBadge } from "@/components/common/StatusBadge";
import { sitePowerStatusQuery } from "@/features/queries";

export function SitePowerStatusCard() {
  const { data } = useSuspenseQuery(sitePowerStatusQuery());
  const powerOn = !data.maintenanceSwitchOn;

  return (
    <section
      aria-label={`${data.colony} maintenance switch and power status`}
      className="panel mb-4 flex flex-wrap items-center justify-between gap-4 p-4"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{data.colony} · Maintenance &amp; Power</p>
          <StatusBadge variant={data.live ? "normal" : "muted"}>
            {data.live ? "Live" : "Demo status"}
          </StatusBadge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {data.maintenanceSwitchOn
            ? "Maintenance switch ON · worker on pole · colony lighting is off"
            : "Maintenance switch OFF · no maintenance climb · colony power is on"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <HardHat className="size-4 text-accent" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">Maintenance switch</span>
          <StatusBadge variant={data.maintenanceSwitchOn ? "warning" : "muted"} dot>
            {data.maintenanceSwitchOn ? "ON" : "OFF"}
          </StatusBadge>
        </div>
        <div className="flex items-center gap-2">
          {powerOn ? (
            <Lightbulb className="size-4 text-normal" aria-hidden="true" />
          ) : (
            <Power className="size-4 text-critical" aria-hidden="true" />
          )}
          <span className="text-xs text-muted-foreground">Colony power</span>
          <StatusBadge variant={powerOn ? "normal" : "critical"} dot>
            {powerOn ? "ON" : "OFF"}
          </StatusBadge>
        </div>
      </div>
    </section>
  );
}