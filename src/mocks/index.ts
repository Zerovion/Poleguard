/**
 * Demo / fallback data for PoleGuard.
 *
 * Used when Supabase has no live ESP32 rows yet (or is unreachable), and as the
 * static baseline that live readings get merged onto (see mergeLivePole in
 * src/features/api.functions.ts).
 *
 * NOTE: types live ONLY in "@/types". Do not copy interfaces into this file —
 * a duplicated copy drifting out of sync is what broke the build before.
 */
import type {
  MaintenanceRecord,
  MetricKey,
  Pole,
  PoleAlert,
  PoleDetail,
  SensorReading,
  SitePowerStatus,
  Threshold,
  TimeRange,
} from "@/types";

// ---------------------------------------------------------------------------
// Thresholds (match the limits used in routes/api/public/ingest.ts:
// tilt 15 deg, leakage 0.08 A, sag critical 20 mm)
// ---------------------------------------------------------------------------
export const THRESHOLDS: Threshold[] = [
  { metric: "tilt", baseline: 0, warning: 10, critical: 15, unit: "°" },
  { metric: "sag", baseline: 0, warning: 12, critical: 20, unit: "mm" },
  { metric: "leakage", baseline: 0, warning: 0.03, critical: 0.08, unit: "A" },
];

const threshold = (metric: MetricKey): Threshold =>
  THRESHOLDS.find((t) => t.metric === metric) as Threshold;

// ---------------------------------------------------------------------------
// Deterministic pseudo-random helpers (stable demo data, no flicker on refetch)
// ---------------------------------------------------------------------------
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hhmm(date: Date): string {
  return date.toISOString().slice(11, 16);
}

// ---------------------------------------------------------------------------
// Poles
// ---------------------------------------------------------------------------
export const POLES: Pole[] = [
  {
    id: "P001",
    name: "Pole 1",
    monitoring: "Tilt Monitoring",
    metric: "tilt",
    status: "normal",
    location: "Main Street, Sector 12",
    lat: 18.5204,
    lng: 73.8567,
    value: 2.4,
    unit: "°",
    secondary: [{ label: "Secondary axis", value: 1.1, unit: "°" }],
    threshold: threshold("tilt"),
    battery: 92,
    signal: -58,
    wifiQuality: "Excellent",
    uptime: "99.9%",
    lastUpdated: "10:42",
    sparkline: [1.8, 2.1, 2.0, 2.4, 2.2, 2.6, 2.3, 2.4],
  },
  {
    id: "P002",
    name: "Pole 2",
    monitoring: "Wire Sag Monitoring",
    metric: "sag",
    status: "normal",
    location: "Industrial Area, Sector 7",
    lat: 18.5314,
    lng: 73.8446,
    value: 6,
    unit: "mm",
    threshold: threshold("sag"),
    battery: 85,
    signal: -66,
    wifiQuality: "Good",
    uptime: "99.7%",
    lastUpdated: "10:42",
    sparkline: [5, 6, 6, 7, 6, 5, 6, 6],
  },
  {
    id: "P003",
    name: "Pole 3",
    monitoring: "Leakage Current Monitoring",
    metric: "leakage",
    status: "normal",
    location: "City Center, Sector 3",
    lat: 18.5167,
    lng: 73.8562,
    value: 0.012,
    unit: "A",
    secondary: [
      { label: "Live Current", value: 1.84, unit: "A" },
      { label: "Neutral Current", value: 1.83, unit: "A" },
    ],
    threshold: threshold("leakage"),
    battery: 78,
    signal: -72,
    wifiQuality: "Good",
    uptime: "99.4%",
    lastUpdated: "10:42",
    sparkline: [0.01, 0.012, 0.011, 0.014, 0.012, 0.013, 0.011, 0.012],
  },
];

// ---------------------------------------------------------------------------
// Site power / maintenance interlock (typed demo status until live controller
// data is integrated). Switch ON => colony power OFF; switch OFF => power ON.
// ---------------------------------------------------------------------------
export const SITE_POWER_STATUS: SitePowerStatus = {
  colony: "Colony A",
  maintenanceSwitchOn: false,
};

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------
export const ALERTS: PoleAlert[] = [
  {
    id: "A-1008",
    poleId: "P001",
    faultType: "tilt",
    severity: "high",
    reading: "16.2 °",
    message: "Tilt 16.2 deg exceeded critical limit (15)",
    time: "Today, 09:12",
    minutesAgo: 90,
    status: "unresolved",
  },
  {
    id: "A-1007",
    poleId: "P003",
    faultType: "leakage",
    severity: "medium",
    reading: "0.041 A",
    message: "Leakage current above warning threshold (0.03 A)",
    time: "Today, 08:47",
    minutesAgo: 115,
    status: "unresolved",
  },
  {
    id: "A-1006",
    poleId: "P002",
    faultType: "sag",
    severity: "high",
    reading: "Beam broken",
    message: "Wire sag detected by IR sensor",
    time: "Today, 07:30",
    minutesAgo: 192,
    status: "resolved",
  },
  {
    id: "A-1005",
    poleId: "P001",
    faultType: "tilt",
    severity: "low",
    reading: "10.4 °",
    message: "Tilt 10.4 deg crossed warning threshold (10)",
    time: "Yesterday, 22:05",
    minutesAgo: 757,
    status: "resolved",
  },
  {
    id: "A-1004",
    poleId: "P003",
    faultType: "leakage",
    severity: "high",
    reading: "0.092 A",
    message: "Leakage 0.092 A exceeded critical limit (0.08)",
    time: "Yesterday, 18:40",
    minutesAgo: 922,
    status: "resolved",
  },
  {
    id: "A-1003",
    poleId: "P002",
    faultType: "sag",
    severity: "medium",
    reading: "13 mm",
    message: "Wire sag 13 mm above warning threshold (12)",
    time: "Yesterday, 14:15",
    minutesAgo: 1167,
    status: "resolved",
  },
  {
    id: "A-1002",
    poleId: "P001",
    faultType: "tilt",
    severity: "low",
    reading: "10.9 °",
    message: "Tilt 10.9 deg crossed warning threshold (10)",
    time: "2 days ago, 11:20",
    minutesAgo: 2842,
    status: "resolved",
  },
  {
    id: "A-1001",
    poleId: "P003",
    faultType: "leakage",
    severity: "low",
    reading: "0.032 A",
    message: "Leakage current above warning threshold (0.03 A)",
    time: "3 days ago, 16:02",
    minutesAgo: 4260,
    status: "resolved",
  },
];

// ---------------------------------------------------------------------------
// Health radar (Monitoring page)
// ---------------------------------------------------------------------------
export const HEALTH_RADAR: { axis: string; current: number; ideal: number }[] = [
  { axis: "Tilt", current: 92, ideal: 100 },
  { axis: "Wire Sag", current: 88, ideal: 100 },
  { axis: "Leakage", current: 95, ideal: 100 },
  { axis: "Battery", current: 85, ideal: 100 },
  { axis: "Signal", current: 80, ideal: 100 },
  { axis: "Uptime", current: 99, ideal: 100 },
];

// ---------------------------------------------------------------------------
// Time-series generator (used when there is not enough live data yet)
// ---------------------------------------------------------------------------
const RANGE_SPEC: Record<TimeRange, { points: number; stepMs: number }> = {
  "15m": { points: 30, stepMs: 30_000 },
  "1h": { points: 60, stepMs: 60_000 },
  "6h": { points: 72, stepMs: 5 * 60_000 },
  "24h": { points: 96, stepMs: 15 * 60_000 },
};

const SERIES_PROFILE: Record<MetricKey, { base: number; noise: number; digits: number }> = {
  tilt: { base: 2.4, noise: 0.8, digits: 2 },
  sag: { base: 6, noise: 1.5, digits: 1 },
  leakage: { base: 0.012, noise: 0.004, digits: 3 },
};

export function generateSeries(
  poleId: string,
  metric: MetricKey,
  range: TimeRange,
): SensorReading[] {
  const { points, stepMs } = RANGE_SPEC[range];
  const { base, noise, digits } = SERIES_PROFILE[metric];
  const rand = mulberry32(hashString(`${poleId}:${metric}:${range}`));
  const now = Date.now();

  return Array.from({ length: points }, (_, i) => {
    const at = new Date(now - (points - 1 - i) * stepMs);
    const wave = Math.sin(i / 6) * noise * 0.5;
    const value = Math.max(0, base + wave + (rand() - 0.5) * noise);
    const reading: SensorReading = { t: hhmm(at), value: Number(value.toFixed(digits)) };

    if (metric === "leakage") {
      const live = 1.8 + (rand() - 0.5) * 0.1;
      reading.secondary = Number(live.toFixed(3));
      reading.tertiary = Number((live - value).toFixed(3));
    }
    return reading;
  });
}

// ---------------------------------------------------------------------------
// Pole detail (modal)
// ---------------------------------------------------------------------------
const MAINTENANCE: MaintenanceRecord[] = [
  {
    id: "M-301",
    poleId: "P001",
    date: "2026-08-14",
    technician: "R. Patil",
    action: "Re-tightened base bolts and re-calibrated ADXL345 tilt sensor",
  },
  {
    id: "M-302",
    poleId: "P002",
    date: "2026-08-20",
    technician: "S. Kulkarni",
    action: "Cleaned and re-aligned IR break-beam sag sensor",
  },
  {
    id: "M-303",
    poleId: "P003",
    date: "2026-08-27",
    technician: "A. Shaikh",
    action: "Checked ACS712 current sensor wiring and zero-point calibration",
  },
  {
    id: "M-304",
    poleId: "P001",
    date: "2026-07-02",
    technician: "R. Patil",
    action: "Routine inspection — no issues found",
  },
];

export function buildPoleDetail(pole: Pole): PoleDetail {
  const history = generateSeries(pole.id, pole.metric, "24h");
  const values = history.map((h) => h.value);
  const digits = SERIES_PROFILE[pole.metric].digits;
  const sum = values.reduce((a, b) => a + b, 0);

  return {
    ...pole,
    statistics: {
      maximum: Number(Math.max(...values).toFixed(digits)),
      minimum: Number(Math.min(...values).toFixed(digits)),
      average: Number((sum / values.length).toFixed(digits)),
      unit: pole.unit,
    },
    history,
    maintenance: MAINTENANCE.filter((m) => m.poleId === pole.id),
    alerts: ALERTS.filter((a) => a.poleId === pole.id),
  };
}
