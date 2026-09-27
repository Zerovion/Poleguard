import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Pole } from "@/types";

const pinColor = (status: Pole["status"]) =>
  status === "critical"
    ? "var(--color-critical)"
    : status === "warning"
      ? "var(--color-warning)"
      : status === "offline"
        ? "var(--color-offline)"
        : "var(--color-normal)";

const makeIcon = (pole: Pole) =>
  L.divIcon({
    className: "",
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:${pinColor(pole.status)};box-shadow:0 0 14px ${pinColor(pole.status)};
        display:flex;align-items:center;justify-content:center">
        <div style="width:10px;height:10px;border-radius:9999px;background:rgba(0,0,0,.55)"></div>
      </div>
    </div>`,
  });

const placeholderIcon = L.divIcon({
  className: "",
  iconSize: [34, 44],
  iconAnchor: [17, 44],
  html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:color-mix(in oklab, var(--muted-foreground) 35%, transparent);
        border:1px dashed color-mix(in oklab, var(--muted-foreground) 55%, transparent);
        animation:pulse 1.6s ease-in-out infinite"></div>
    </div>`,
});

export default function PoleMap({
  poles,
  onSelect,
}: {
  poles: Pole[];
  onSelect: (id: string) => void;
}) {
  const center: [number, number] = [28.6139, 77.209];
  const [tilesReady, setTilesReady] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);

  // Progressive marker rendering: stream markers in one batch at a time.
  useEffect(() => {
    if (!tilesReady) return;
    if (visibleCount >= poles.length) return;
    const id = window.setTimeout(() => setVisibleCount((c) => c + 1), 140);
    return () => window.clearTimeout(id);
  }, [tilesReady, visibleCount, poles.length]);

  const markersPending = tilesReady && visibleCount < poles.length;

  return (
    <div className="relative h-full w-full">
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        eventHandlers={{
          load: () => setTilesReady(true),
          tileerror: () => setTilesReady(true),
        }}
      />
      {tilesReady
        ? poles.slice(0, visibleCount).map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={makeIcon(p)}>
          <Popup>
            <div className="min-w-52 space-y-1">
              <p className="text-sm font-semibold">
                {p.id} - {p.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {p.monitoring} · {p.status}
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Reading</span>
                <span className="font-mono">
                  {p.value} {p.unit}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-mono">{p.lastUpdated}</span>
              </div>
              <Button size="sm" className="mt-2 w-full" onClick={() => onSelect(p.id)}>
                View Details
              </Button>
            </div>
          </Popup>
        </Marker>
          ))
        : null}

      {/* Placeholder pins for markers still streaming in */}
      {tilesReady
        ? poles
            .slice(visibleCount)
            .map((p) => (
              <Marker
                key={`skeleton-${p.id}`}
                position={[p.lat, p.lng]}
                icon={placeholderIcon}
                interactive={false}
                opacity={0.7}
              />
            ))
        : null}
    </MapContainer>

      {/* Tile + marker loading overlay */}
      {!tilesReady ? (
        <div className="pointer-events-none absolute inset-0 z-[500] overflow-hidden rounded-xl">
          <Skeleton className="absolute inset-0 rounded-xl" />
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-px opacity-60">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="size-full rounded-none"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface-2/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
              <span className="size-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              Loading map tiles and pole markers...
            </div>
          </div>
        </div>
      ) : null}

      {/* Progressive marker streaming indicator */}
      {markersPending ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-[500] -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface-2/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
            <span className="size-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Loading pole markers... {visibleCount}/{poles.length}
          </div>
        </div>
      ) : null}
    </div>
  );
}
