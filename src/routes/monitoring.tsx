import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { PageHeader } from "@/components/layout/AppShell";
import { MonitoringSkeleton } from "@/components/common/Skeletons";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Reveal } from "@/components/common/Reveal";
import { HealthRadar, TelemetryChart } from "@/components/charts/Charts";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { healthRadarQuery, polesQuery, telemetryQuery } from "@/features/queries";
import type { TimeRange } from "@/types";

const RANGES: TimeRange[] = ["15m", "1h", "6h", "24h"];
const searchSchema = z.object({ range: fallback(z.string(), "1h").default("1h") });

export const Route = createFileRoute("/monitoring")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const poles = await context.queryClient.ensureQueryData(polesQuery());
    const range = ((RANGES as string[]).includes(deps.range) ? deps.range : "1h") as TimeRange;
    await Promise.all([
      context.queryClient.ensureQueryData(healthRadarQuery()),
      ...poles.map((p) =>
        context.queryClient.ensureQueryData(telemetryQuery(p.id, p.metric, range)),
      ),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Live Monitoring — PoleGuard" },
      {
        name: "description",
        content: "Streaming tilt, IR-measured wire sag and leakage current charts with threshold overlays.",
      },
      { property: "og:title", content: "Live Monitoring — PoleGuard" },
      {
        property: "og:description",
        content: "Streaming tilt, wire sag and leakage charts with warning and critical thresholds.",
      },
    ],
  }),
  component: MonitoringPage,
  pendingComponent: MonitoringSkeleton,
  pendingMs: 0,
  pendingMinMs: 300,
  errorComponent: ({ error }) => <p role="alert">{error.message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

function MonitoringPage() {
  const { range } = Route.useSearch();
  const navigate = Route.useNavigate();
  const safeRange = (RANGES as string[]).includes(range) ? (range as TimeRange) : "1h";

  const { data: poles } = useSuspenseQuery(polesQuery());
  const { data: radar } = useSuspenseQuery(healthRadarQuery());
  const series = useSuspenseQueries({
    queries: poles.map((p) => ({
      ...telemetryQuery(p.id, p.metric, safeRange),
      refetchInterval: 5000,
    })),
  });

  return (
    <>
      <PageHeader
        title="Live Analytics"
        subtitle="Auto-refreshing every 5 seconds"
        action={
          <Tabs
            value={safeRange}
            onValueChange={(v) => navigate({ to: "/monitoring", search: { range: v } })}
          >
            <TabsList>
              {RANGES.map((r) => (
                <TabsTrigger key={r} value={r}>
                  {r}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      <div className="grid gap-3 xl:grid-cols-2">
        {poles.map((p, i) => (
          <Reveal key={p.id} index={i} variant="chart">
          <Panel>
            <PanelHeader
              title={`${p.monitoring} — ${p.name}`}
              subtitle={`Threshold ${p.threshold.critical} ${p.unit}`}
              action={
                <StatusBadge variant={p.status === "offline" ? "muted" : p.status} dot>
                  {p.status}
                </StatusBadge>
              }
            />
            <TelemetryChart data={series[i].data ?? []} metric={p.metric} />
          </Panel>
          </Reveal>
        ))}

        <Reveal index={poles.length} variant="chart">
          <Panel>
            <PanelHeader title="Overall Pole Health Score" subtitle="Current vs ideal profile" />
            <HealthRadar data={radar} />
          </Panel>
        </Reveal>
      </div>
    </>
  );
}
