import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/AppShell";
import { SettingsSkeleton } from "@/components/common/Skeletons";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/common/StatusBadge";
import { devicesQuery, settingsQuery } from "@/features/queries";

export const Route = createFileRoute("/settings")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(settingsQuery()),
      context.queryClient.ensureQueryData(devicesQuery()),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Settings — PoleGuard" },
      {
        name: "description",
        content: "Configure fault thresholds, refresh cadence and Telegram alert delivery.",
      },
      { property: "og:title", content: "Settings — PoleGuard" },
      {
        property: "og:description",
        content: "Configure fault thresholds and alert delivery for PoleGuard.",
      },
    ],
  }),
  component: SettingsPage,
  pendingComponent: SettingsSkeleton,
  pendingMs: 0,
  pendingMinMs: 300,
  errorComponent: ({ error }) => <p role="alert">{error.message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

function SettingsPage() {
  const { data: settings } = useSuspenseQuery(settingsQuery());
  const { data: devices } = useSuspenseQuery(devicesQuery());

  return (
    <>
      <PageHeader title="Settings" subtitle="Thresholds, notifications and devices" />

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Fault Thresholds" subtitle="Values that trigger warnings and alarms" />
          <div className="space-y-3">
            {settings.thresholds.map((t) => (
              <div key={t.metric} className="grid grid-cols-3 items-end gap-2">
                <div>
                  <Label className="text-xs capitalize">
                    {t.metric === "sag" ? "IR-measured sag warning" : `${t.metric} warning`}
                  </Label>
                  <Input defaultValue={t.warning} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs capitalize">
                    {t.metric === "sag" ? "IR-measured sag critical" : `${t.metric} critical`}
                  </Label>
                  <Input defaultValue={t.critical} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Unit</Label>
                  <Input defaultValue={t.unit} className="mt-1" readOnly />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel>
            <PanelHeader title="Notifications" subtitle="Delivery channels" />
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="telegram">Telegram bot alerts</Label>
              <Switch id="telegram" defaultChecked={settings.telegramEnabled} />
            </div>
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="auto">Auto refresh telemetry</Label>
              <Switch id="auto" defaultChecked={settings.autoRefresh} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Devices" subtitle="Edge hardware and services" />
            <div className="space-y-2">
              {devices.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-2.5"
                >
                  <span className="text-sm">{d.name}</span>
                  <StatusBadge variant={d.online ? "normal" : "offline"} dot>
                    {d.online ? "Online" : "Offline"}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
