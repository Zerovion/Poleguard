import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  ALERTS,
  DEVICES,
  HEALTH_RADAR,
  POLES,
  SITE_POWER_STATUS,
  THRESHOLDS,
  buildPoleDetail,
  generateSeries,
} from "@/mocks";
import type { Tables } from "@/integrations/supabase/types";
import type { MetricKey, Pole, PoleStatus, SensorReading, TimeRange } from "@/types";

type LatestStateRow = Tables<"esp32_latest_state">;
type ReadingRow = Tables<"esp32_readings">;

// A live row older than this is treated as "device stopped reporting" rather
// than trusted as the current value.
const FRESH_WINDOW_MS = 90_000;

const RANGE_WINDOW_MS: Record<TimeRange, number> = {
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
  "6h": 6 * 60 * 60_000,
  "24h": 24 * 60 * 60_000,
};

function wifiQualityFromRssi(dbm: number): string {
  if (dbm >= -60) return "Excellent";
  if (dbm >= -70) return "Good";
  if (dbm >= -80) return "Fair";
  return "Poor";
}

function hhmm(iso: string): string {
  return iso.slice(11, 16);
}

/**
 * The wire-sag sensor on the physical device is an IR break-beam (present /
 * not present), not a continuous distance reading — unlike the mm-based
 * demo threshold used for the other, still-simulated poles. So sag gets a
 * boolean fault rule here instead of the shared numeric Threshold.
 */
function statusForLiveReading(pole: Pole, row: LatestStateRow): PoleStatus {
  if (pole.metric === "sag") {
    return row.value >= 0.5 ? "critical" : "normal";
  }
  const abs = Math.abs(row.value);
  if (abs >= pole.threshold.critical) return "critical";
  if (abs >= pole.threshold.warning) return "warning";
  return "normal";
}

function mergeLivePole(pole: Pole, row: LatestStateRow | undefined): Pole {
  if (!row) return pole;

  const isFresh = Date.now() - new Date(row.received_at).getTime() < FRESH_WINDOW_MS;
  const digits = pole.metric === "leakage" ? 3 : 2;

  const secondary =
    row.secondary_value != null
      ? [
          {
            label: pole.metric === "leakage" ? "Live Current" : "Secondary axis",
            value: row.secondary_value,
            unit: pole.unit,
          },
          ...(row.tertiary_value != null
            ? [{ label: "Neutral Current", value: row.tertiary_value, unit: pole.unit }]
            : []),
        ]
      : pole.secondary;

  return {
    ...pole,
    value: Number(row.value.toFixed(digits)),
    status: isFresh ? statusForLiveReading(pole, row) : "offline",
    battery: row.battery_pct ?? pole.battery,
    signal: row.signal_dbm ?? pole.signal,
    wifiQuality: row.signal_dbm != null ? wifiQualityFromRssi(row.signal_dbm) : pole.wifiQuality,
    uptime: pole.uptime,
    lastUpdated: hhmm(row.recorded_at),
    secondary,
  };
}

async function fetchLatestStateByPoleId(): Promise<Map<string, LatestStateRow>> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("esp32_latest_state").select("*");
    if (error) {
      console.error("[telemetry] esp32_latest_state fetch failed", error);
      return new Map();
    }
    return new Map((data ?? []).map((row) => [`${row.pole_id}:${row.metric}`, row]));
  } catch (err) {
    console.error("[telemetry] Supabase unavailable, falling back to mocks", err);
    return new Map();
  }
}

async function fetchLiveSeries(
  poleId: string,
  metric: MetricKey,
  range: TimeRange,
): Promise<SensorReading[] | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - RANGE_WINDOW_MS[range]).toISOString();
    const { data, error } = await supabaseAdmin
      .from("esp32_readings")
      .select("*")
      .eq("pole_id", poleId)
      .eq("metric", metric)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true })
      .limit(2000);

    if (error) {
      console.error("[telemetry] esp32_readings fetch failed", error);
      return null;
    }
    // Fewer than a couple of real points isn't enough for a useful chart yet —
    // let the caller fall back to the mock series instead of a near-empty one.
    if (!data || data.length < 2) return null;

    return (data as ReadingRow[]).map((row) => ({
      t: hhmm(row.recorded_at),
      value: row.value,
      secondary: row.secondary_value ?? undefined,
      tertiary: row.tertiary_value ?? undefined,
    }));
  } catch (err) {
    console.error("[telemetry] Supabase unavailable, falling back to mocks", err);
    return null;
  }
}

export const getPoles = createServerFn({ method: "GET" }).handler(async () => {
  const live = await fetchLatestStateByPoleId();
  if (live.size === 0) return POLES;
  return POLES.map((pole) => mergeLivePole(pole, live.get(`${pole.id}:${pole.metric}`)));
});

export const getSitePowerStatus = createServerFn({ method: "GET" }).handler(async () => {
  const live = await fetchLatestStateByPoleId();
  // Newest row that carries the maintenance switch state wins.
  const newest = [...live.values()]
    .filter((r) => r.maintenance_switch_on != null)
    .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())[0];
  if (!newest) return SITE_POWER_STATUS;
  return {
    ...SITE_POWER_STATUS,
    maintenanceSwitchOn: newest.maintenance_switch_on === true,
    live: true,
  };
});

export const getDevices = createServerFn({ method: "GET" }).handler(async () => DEVICES);

export const getHealthRadar = createServerFn({ method: "GET" }).handler(async () => HEALTH_RADAR);

export const getPole = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const basePole = POLES.find((p) => p.id === data.id);
    if (!basePole) return null;

    const live = await fetchLatestStateByPoleId();
    const pole = mergeLivePole(basePole, live.get(`${basePole.id}:${basePole.metric}`));
    const detail = buildPoleDetail(pole);

    const liveHistory = await fetchLiveSeries(pole.id, pole.metric, "24h");
    return liveHistory ? { ...detail, history: liveHistory } : detail;
  });

export const getTelemetry = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        poleId: z.string(),
        metric: z.enum(["tilt", "sag", "leakage"]),
        range: z.enum(["15m", "1h", "6h", "24h"]).default("1h"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const liveHistory = await fetchLiveSeries(data.poleId, data.metric, data.range as TimeRange);
    return liveHistory ?? generateSeries(data.poleId, data.metric, data.range as TimeRange);
  });

export const getAlerts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        q: z.string().default(""),
        severity: z.string().default("all"),
        status: z.string().default("all"),
        poleId: z.string().default("all"),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const q = data.q.trim().toLowerCase();
    const rows = ALERTS.filter((a) => {
      if (data.severity !== "all" && a.severity !== data.severity) return false;
      if (data.status !== "all" && a.status !== data.status) return false;
      if (data.poleId !== "all" && a.poleId !== data.poleId) return false;
      if (q && !`${a.poleId} ${a.faultType} ${a.message}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return { rows, total: rows.length };
  });

export const getSettings = createServerFn({ method: "GET" }).handler(async () => ({
  thresholds: THRESHOLDS,
  telegramEnabled: true,
  autoRefresh: true,
  refreshSeconds: 5,
}));
