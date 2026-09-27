import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { Search } from "lucide-react";
import { z } from "zod";

import { PageHeader } from "@/components/layout/AppShell";
import { AlertsSkeleton } from "@/components/common/Skeletons";
import { Panel } from "@/components/common/Panel";
import { Reveal } from "@/components/common/Reveal";
import { AlertTable } from "@/components/alerts/AlertTable";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { alertsQuery } from "@/features/queries";
import { useDecoratedAlerts } from "@/features/alert-state";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  severity: fallback(z.string(), "all").default("all"),
  status: fallback(z.string(), "all").default("all"),
  poleId: fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/alerts")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(alertsQuery({ ...deps, status: "all" }));
  },
  head: () => ({
    meta: [
      { title: "Alert History — PoleGuard" },
      {
        name: "description",
        content: "Searchable fault history with severity, sensor readings and resolution status.",
      },
      { property: "og:title", content: "Alert History — PoleGuard" },
      {
        property: "og:description",
        content: "Searchable fault history for every monitored smart pole.",
      },
    ],
  }),
  component: AlertsPage,
  pendingComponent: AlertsSkeleton,
  pendingMs: 0,
  pendingMinMs: 300,
  errorComponent: ({ error }) => <p role="alert">{error.message}</p>,
  notFoundComponent: () => <p>Nothing here.</p>,
});

function AlertsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery(alertsQuery({ ...search, status: "all" }));
  const decorated = useDecoratedAlerts(data.rows);
  const rows =
    search.status === "all"
      ? decorated
      : decorated.filter((a) => a.effectiveStatus === search.status);

  const set = (patch: Partial<typeof search>) =>
    navigate({ to: "/alerts", search: { ...search, ...patch } });

  const resolved = decorated.filter((a) => a.effectiveStatus === "resolved").length;
  const acknowledged = decorated.filter((a) => a.effectiveStatus === "acknowledged").length;
  const pending = decorated.length - resolved - acknowledged;

  return (
    <>
      <PageHeader title="Alert History" subtitle="Every fault event, newest first" />

      <div className="grid gap-3 xl:grid-cols-[1fr_260px]">
        <Panel>
          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                value={search.q}
                onChange={(e) => set({ q: e.target.value })}
                placeholder="Search alerts..."
                className="pl-8"
              />
            </div>
            <Select value={search.severity} onValueChange={(v) => set({ severity: v })}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={search.status} onValueChange={(v) => set({ status: v })}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={search.poleId} onValueChange={(v) => set({ poleId: v })}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Pole" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All poles</SelectItem>
                <SelectItem value="P001">P001</SelectItem>
                <SelectItem value="P002">P002</SelectItem>
                <SelectItem value="P003">P003</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Reveal variant="table" index={1}>
            <AlertTable rows={rows} />
          </Reveal>
        </Panel>

        <Panel>
          <p className="mb-3 text-sm font-semibold">Today's Summary</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Alerts Today", value: decorated.length, tone: "text-accent" },
              { label: "Resolved", value: resolved, tone: "text-normal" },
              { label: "Acknowledged", value: acknowledged, tone: "text-warning" },
              { label: "Pending", value: pending, tone: "text-critical" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-semibold tabular-nums ${s.tone}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
