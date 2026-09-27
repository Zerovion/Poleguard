import { useSuspenseQuery } from "@tanstack/react-query";
import { Activity, BatteryMedium, Download, RefreshCw, Ruler, Signal, Wifi } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TelemetryChart } from "@/components/charts/Charts";
import { poleQuery } from "@/features/queries";
import { faultLabel, severityLabel, severityVariant } from "@/lib/format";

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${tone ?? ""}`}>{value}</p>
    </div>
  );
}

export function PoleDetailsModal({
  poleId,
  onClose,
}: {
  poleId: string;
  onClose: () => void;
}) {
  const { data: pole } = useSuspenseQuery(poleQuery(poleId));
  if (!pole) return null;

  const tone =
    pole.status === "critical" ? "text-critical" : pole.status === "warning" ? "text-warning" : "text-normal";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-surface sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {pole.name} — {pole.monitoring}
            <StatusBadge variant="accent">{pole.id}</StatusBadge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="live">Live Data</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="sensor">Sensor Info</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Current" value={`${pole.value} ${pole.unit}`} tone={tone} />
              <Stat label="Threshold" value={`${pole.threshold.critical} ${pole.unit}`} />
              <Stat label="Baseline" value={`${pole.threshold.baseline} ${pole.unit}`} />
              <Stat label="Status" value={pole.status} tone={tone} />
            </div>
            <div className="panel p-4">
              <p className="mb-2 text-sm font-medium">Last 24 Hours</p>
              <TelemetryChart data={pole.history} metric={pole.metric} height={220} />
            </div>
          </TabsContent>

          <TabsContent value="live" className="pt-4">
            <div className="panel p-4">
              <TelemetryChart data={pole.history.slice(-30)} metric={pole.metric} height={240} />
            </div>
          </TabsContent>

          <TabsContent value="history" className="pt-4">
            <div className="panel p-4">
              <TelemetryChart data={pole.history} metric={pole.metric} height={280} />
            </div>
          </TabsContent>

          <TabsContent value="stats" className="pt-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Maximum" value={`${pole.statistics.maximum} ${pole.unit}`} />
              <Stat label="Minimum" value={`${pole.statistics.minimum} ${pole.unit}`} />
              <Stat label="Average" value={`${pole.statistics.average} ${pole.unit}`} />
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-2 pt-4">
            {pole.alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No alerts recorded for this pole.</p>
            ) : (
              pole.alerts.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 p-3"
                >
                  <div>
                    <p className="text-sm">{a.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {faultLabel(a.faultType)} · {a.time}
                    </p>
                  </div>
                  <StatusBadge variant={severityVariant(a.severity)}>
                    {severityLabel(a.severity)}
                  </StatusBadge>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-2 pt-4">
            {pole.maintenance.map((m) => (
              <div key={m.id} className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="text-sm">{m.action}</p>
                <p className="text-xs text-muted-foreground">
                  {m.date} · {m.technician}
                </p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="sensor" className="pt-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Battery" value={`${pole.battery}%`} />
              <Stat label="Signal" value={`${pole.signal} dBm`} />
              <Stat label="WiFi Quality" value={pole.wifiQuality} />
              <Stat label="Uptime" value={pole.uptime} />
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BatteryMedium className="size-4" /> Li-ion 6000 mAh
              </span>
              <span className="flex items-center gap-1.5">
                <Signal className="size-4" /> LoRa + WiFi uplink
              </span>
              <span className="flex items-center gap-1.5">
                <Wifi className="size-4" /> ESP32-WROOM-32
              </span>
              {pole.metric === "sag" ? (
                <span className="flex items-center gap-1.5">
                  <Ruler className="size-4" /> IR distance sensor · wire sag measurement
                </span>
              ) : null}
              <span className="flex items-center gap-1.5">
                <Activity className="size-4" /> 1 Hz sampling
              </span>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" size="sm">
            <RefreshCw className="size-4" /> Refresh
          </Button>
          <Button variant="secondary" size="sm">
            <Download className="size-4" /> Export Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
