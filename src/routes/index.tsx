import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Activity, AlertTriangle, HeartPulse, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { DashboardSkeleton } from "@/components/common/Skeletons";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PoleStatusCard } from "@/components/dashboard/PoleStatusCard";
import { PoleDetailsModal } from "@/components/pole/PoleDetailsModal";
import { MaintenancePowerCard } from "@/components/dashboard/MaintenancePowerCard";
import { polesQuery, sitePowerStatusQuery } from "@/features/queries";

const searchSchema = z.object({ pole: fallback(z.string(), "").default("") });

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(searchSchema),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(polesQuery()),
      context.queryClient.ensureQueryData(sitePowerStatusQuery()),
    ]);
  },
  head: () => ({
    meta: [
      { title: "PoleGuard Dashboard — Smart Pole Monitoring" },
      {
        name: "description",
        content:
          "Live overview of smart pole health: tilt, wire sag and leakage current across the grid.",
      },
      { property: "og:title", content: "PoleGuard Dashboard — Smart Pole Monitoring" },
      { property: "og:type", content: "website" },
      {
        property: "og:description",
        content: "Live overview of smart pole health across the grid.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
  pendingComponent: DashboardSkeleton,
  pendingMs: 0,
  pendingMinMs: 300,
  errorComponent: ({ error }) => <p role="alert">{error instanceof Error ? error.message : String(error)}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

function DashboardPage() {
  const { pole } = Route.useSearch();
  const navigate = useNavigate();
  const { data: allPoles } = useSuspenseQuery(polesQuery());
  // Leakage pole (P003) is replaced on this page by the Maintenance & Power card.
  const poles = allPoles.filter((p) => p.metric !== "leakage");

  const healthy = poles.filter((p) => p.status === "normal").length;
  const warnings = poles.filter((p) => p.status === "warning").length;
  const critical = poles.filter((p) => p.status === "critical").length;
  const pct = (n: number) => `${((n / poles.length) * 100).toFixed(2)}%`;

  return (
    <>
      <PageHeader title="Dashboard Overview" subtitle="Real-time status across all monitored poles" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Poles"
          value={poles.length}
          caption="All Connected"
          icon={Activity}
          tone="accent"
          index={0}
        />
        <KpiCard
          label="Healthy"
          value={healthy}
          caption={pct(healthy)}
          icon={HeartPulse}
          tone="normal"
          index={1}
        />
        <KpiCard
          label="Warnings"
          value={warnings}
          caption={pct(warnings)}
          icon={AlertTriangle}
          tone="warning"
          index={2}
        />
        <KpiCard
          label="Critical Alerts"
          value={critical}
          caption={pct(critical)}
          icon={ShieldAlert}
          tone="critical"
          index={3}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {poles.map((p, i) => (
          <PoleStatusCard key={p.id} pole={p} index={i} />
        ))}
        <MaintenancePowerCard index={poles.length} />
      </div>

      {pole ? (
        <PoleDetailsModal
          poleId={pole}
          onClose={() => navigate({ to: "/", search: { pole: "" } })}
        />
      ) : null}
    </>
  );
}
