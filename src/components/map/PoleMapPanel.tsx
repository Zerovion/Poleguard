import { lazy, Suspense } from "react";

import { ClientOnly } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import type { Pole } from "@/types";

const LazyMap = lazy(() => import("./PoleMap.client"));

export function PoleMapPanel({
  poles,
  onSelect,
}: {
  poles: Pole[];
  onSelect: (id: string) => void;
}) {
  const fallback = (
    <div className="relative h-full w-full">
      <Skeleton className="h-full w-full rounded-xl" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface-2/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
          <span className="size-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Preparing map...
        </div>
      </div>
    </div>
  );
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <LazyMap poles={poles} onSelect={onSelect} />
      </Suspense>
    </ClientOnly>
  );
}
