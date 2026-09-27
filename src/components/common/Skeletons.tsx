import { Panel } from "@/components/common/Panel";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/AppShell";

/** Shared building blocks — same rhythm/spacing as the real panels. */
export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Panel key={i}>
          <div className="flex items-start justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
          <Skeleton className="mt-4 h-7 w-16" />
          <Skeleton className="mt-2 h-3 w-12" />
        </Panel>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Panel key={i}>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Skeleton className="size-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <Skeleton className="mt-4 h-14 w-full rounded-md" />
        </Panel>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <Panel>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="w-full rounded-md" style={{ height }} />
    </Panel>
  );
}

export function ChartGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <ChartSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full rounded-md" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  );
}

/* ---------- Page-level pending states ---------- */

export function DashboardSkeleton() {
  return (
    <>
      <PageHeader title="Dashboard Overview" subtitle="Real-time status across all monitored poles" />
      <KpiGridSkeleton />
      <div className="mt-4">
        <CardGridSkeleton />
      </div>
    </>
  );
}

export function MonitoringSkeleton() {
  return (
    <>
      <PageHeader title="Live Analytics" subtitle="Auto-refreshing every 5 seconds" />
      <ChartGridSkeleton />
    </>
  );
}

export function MapSkeleton() {
  return (
    <>
      <PageHeader title="Map View" subtitle="Geospatial pole status" />
      <Panel className="p-0">
        <Skeleton className="h-[520px] w-full rounded-xl" />
      </Panel>
    </>
  );
}

export function AlertsSkeleton() {
  return (
    <>
      <PageHeader title="Alert History" subtitle="Every fault event, newest first" />
      <div className="grid gap-3 xl:grid-cols-[1fr_260px]">
        <Panel>
          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>
          <TableSkeleton />
        </Panel>
        <Panel>
          <Skeleton className="mb-3 h-4 w-28" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

export function SettingsSkeleton() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Thresholds, cadence and alert delivery" />
      <div className="grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Panel key={i}>
            <Skeleton className="h-4 w-32" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((__, j) => (
                <Skeleton key={j} className="h-9 w-full rounded-md" />
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
