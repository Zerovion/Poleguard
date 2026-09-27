import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/AppShell";
import { Panel, PanelHeader } from "@/components/common/Panel";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About PoleGuard — IoT Smart Pole Monitoring" },
      {
        name: "description",
        content:
          "How PoleGuard works: ESP32 edge nodes, tilt/sag/leakage sensing and real-time fault alerting.",
      },
      { property: "og:title", content: "About PoleGuard — IoT Smart Pole Monitoring" },
      {
        property: "og:description",
        content: "ESP32 edge nodes, tilt/sag/leakage sensing and real-time fault alerting.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHeader title="About Project" subtitle="System overview and architecture" />

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="What PoleGuard does" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            PoleGuard monitors electricity distribution poles in real time. Each pole carries an
            ESP32 edge node reading tilt angle, IR break-beam wire sag detection and load current. The
            node streams samples to the platform, which evaluates them against configurable
            thresholds and raises warning or critical alerts, delivered in-app and over Telegram.
          </p>
        </Panel>

        <Panel>
          <PanelHeader title="Hardware" />
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>ESP32-WROOM-32 controller with WiFi uplink</li>
            <li>ADXL345 accelerometer for tilt angle (2-axis)</li>
            <li>IR break-beam sensor for wire-sag / intrusion detection</li>
            <li>ACS712 current sensor for overcurrent detection</li>
          </ul>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader title="Platform architecture" />
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>React 19 + TypeScript on Vite, TanStack Router file-based routing</li>
            <li>TanStack Query for server state, URL search params for view state</li>
            <li>
              Typed server functions as the single data contract — live ESP32 telemetry via Supabase
              where reported, mock data elsewhere
            </li>
            <li>Tailwind v4 semantic design tokens with shadcn UI primitives</li>
            <li>Recharts for telemetry visualisation, Leaflet for the geospatial view</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
