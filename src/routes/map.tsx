import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { PageHeader } from "@/components/layout/AppShell";
import { MapSkeleton } from "@/components/common/Skeletons";
import { Panel } from "@/components/common/Panel";
import { PoleMapPanel } from "@/components/map/PoleMapPanel";
import { PoleDetailsModal } from "@/components/pole/PoleDetailsModal";
import { polesQuery } from "@/features/queries";

const searchSchema = z.object({ pole: fallback(z.string(), "").default("") });

export const Route = createFileRoute("/map")({
  validateSearch: zodValidator(searchSchema),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(polesQuery());
  },
  head: () => ({
    meta: [
      { title: "Map View — PoleGuard" },
      {
        name: "description",
        content: "Geospatial view of every smart pole with live status pins and quick actions.",
      },
      { property: "og:title", content: "Map View — PoleGuard" },
      {
        property: "og:description",
        content: "Geospatial view of every smart pole with live status pins.",
      },
    ],
  }),
  component: MapPage,
  pendingComponent: MapSkeleton,
  pendingMs: 0,
  pendingMinMs: 300,
  errorComponent: ({ error }) => <p role="alert">{error.message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

const legend = [
  { label: "Normal", cls: "bg-normal" },
  { label: "Warning", cls: "bg-warning" },
  { label: "Critical", cls: "bg-critical" },
];

function MapPage() {
  const { pole } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: poles } = useSuspenseQuery(polesQuery());

  return (
    <>
      <PageHeader title="Map View" subtitle="Pole locations and live status" />

      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
        <Panel className="h-[62vh] min-h-96 p-2">
          <PoleMapPanel
            poles={poles}
            onSelect={(id) => navigate({ to: "/map", search: { pole: id } })}
          />
        </Panel>

        <div className="space-y-3">
          <Panel>
            <p className="mb-2 text-sm font-semibold">Legend</p>
            {legend.map((l) => (
              <div key={l.label} className="flex items-center gap-2 py-1 text-xs">
                <span className={`size-2.5 rounded-full ${l.cls}`} />
                {l.label}
              </div>
            ))}
          </Panel>

          <Panel>
            <p className="mb-2 text-sm font-semibold">Poles</p>
            <div className="space-y-2">
              {poles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate({ to: "/map", search: { pole: p.id } })}
                  className="w-full rounded-lg border border-border bg-surface-2 p-2.5 text-left transition-colors hover:bg-card-2"
                >
                  <p className="text-sm font-medium">
                    {p.id} — {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.location}</p>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {pole ? (
        <PoleDetailsModal
          poleId={pole}
          onClose={() => navigate({ to: "/map", search: { pole: "" } })}
        />
      ) : null}
    </>
  );
}
