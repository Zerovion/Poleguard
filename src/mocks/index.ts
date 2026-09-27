import type {
  Device,
  Pole,
  PoleAlert,
  PoleDetail,
  SitePowerStatus,
  SensorReading,
  Threshold,
  TimeRange,
} from "@/types";

/** Deterministic PRNG so server and client render identical mock telemetry. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export const THRESHOLDS: Threshold[] = [
  { metric: "tilt", baseline: 0, warning: 10, critical: 15, unit: "°" },
  { metric: "sag", baseline: 10, warning: 12, critical: 20, unit: "mm" },
  { metric: "leakage", baseline: 0, warning: 0.03, critical: 0.08, unit: "A" },
];

export const thresholdFor = (metric: Threshold["metric"]) =>
  THRESHOLDS.find((t) => t.metric === metric)!;

const RANGE_POINTS: Record<TimeRange, { points: number; stepMs: number }> = {
  "15m": { points: 30, stepMs: 30_000 },
  "1h": { points: 60, stepMs: 60_000 },
  "6h": { points: 72, stepMs: 5 * 60_000 },
  "24h": { points: 96, stepMs: 15 * 60_000 },
};

const BASE_TIME = Date.UTC(2026, 6, 28, 14, 35, 42);

function fmt(ms: number) {
  const d = new Date(ms);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export function generateSeries(
  poleId: string,
  metric: Pole["metric"],
  range: TimeRange = "1h",
): SensorReading[] {
  const { points, stepMs } = RANGE_POINTS[range];
  const rnd = seeded(poleId.charCodeAt(3) * 977 + metric.length * 31 + points);
  const out: SensorReading[] = [];
  let drift = 0;

  for (let i = points - 1; i >= 0; i--) {
    const t = fmt(BASE_TIME - i * stepMs);
    drift += (rnd() - 0.5) * 0.4;
    drift = Math.max(-1, Math.min(1, drift));

    if (metric === "tilt") {
      out.push({ t, value: Number((3.4 + drift * 0.9 + rnd() * 0.4).toFixed(2)) });
    } else if (metric === "sag") {
      const value = Number((12.2 + drift * 1.6 + rnd() * 0.8).toFixed(2));
      out.push({ t, value, secondary: 12, tertiary: 20 });
    } else {
      const live = Number((0.31 + drift * 0.03 + rnd() * 0.02).toFixed(3));
      const neutral = Number((live - 0.04 - rnd() * 0.02).toFixed(3));
      out.push({
        t,
        value: Number((live - neutral).toFixed(3)),
        secondary: live,
        tertiary: neutral,
      });
    }
  }
  return out;
}

function spark(poleId: string, metric: Pole["metric"]) {
  return generateSeries(poleId, metric, "15m").map((r) => r.value);
}

export const POLES: Pole[] = [
  {
    id: "P001",
    name: "Pole 1",
    monitoring: "Tilt Monitoring",
    metric: "tilt",
    status: "normal",
    location: "Main Street, Sector 12",
    lat: 28.6139,
    lng: 77.209,
    value: 3.6,
    unit: "°",
    threshold: thresholdFor("tilt"),
    battery: 82,
    signal: -58,
    wifiQuality: "Excellent",
    uptime: "4d 02h",
    lastUpdated: "14:35:40",
    sparkline: spark("P001", "tilt"),
  },
  {
    id: "P002",
    name: "Pole 2",
    monitoring: "Wire Sag Monitoring",
    metric: "sag",
    status: "warning",
    location: "Industrial Area, Sector 7",
    lat: 28.6205,
    lng: 77.2005,
    value: 12.45,
    unit: "mm",
    threshold: thresholdFor("sag"),
    battery: 78,
    signal: -62,
    wifiQuality: "Good",
    uptime: "2d 14h",
    lastUpdated: "14:35:41",
    sparkline: spark("P002", "sag"),
  },
  {
    id: "P003",
    name: "Pole 3",
    monitoring: "Leakage Monitoring",
    metric: "leakage",
    status: "critical",
    location: "City Center, Sector 3",
    lat: 28.6075,
    lng: 77.2185,
    value: 0.045,
    unit: "A",
    secondary: [
      { label: "Live Current", value: 0.32, unit: "A" },
      { label: "Neutral Current", value: 0.275, unit: "A" },
    ],
    threshold: thresholdFor("leakage"),
    battery: 64,
    signal: -71,
    wifiQuality: "Fair",
    uptime: "1d 06h",
    lastUpdated: "14:35:42",
    sparkline: spark("P003", "leakage"),
  },
];

/** Demo reading for Colony A's maintenance interlock. */
export const SITE_POWER_STATUS: SitePowerStatus = {
  colony: "Colony A",
  maintenanceSwitchOn: false,
};

export const ALERTS: PoleAlert[] = [
  {
    id: "A-1001",
    poleId: "P003",
    faultType: "leakage",
    severity: "high",
    reading: "0.045 A",
    message: "Leakage difference 0.045 A exceeds threshold",
    time: "14:35:42",
    minutesAgo: 2,
    status: "unresolved",
  },
  {
    id: "A-1002",
    poleId: "P002",
    faultType: "sag",
    severity: "medium",
    reading: "12.45 mm",
    message: "Measured wire sag 12.45 mm is above the warning threshold",
    time: "14:34:18",
    minutesAgo: 5,
    status: "unresolved",
  },
  {
    id: "A-1003",
    poleId: "P001",
    faultType: "tilt",
    severity: "low",
    reading: "3.6°",
    message: "Tilt angle 3.6° is normal",
    time: "14:33:05",
    minutesAgo: 8,
    status: "resolved",
  },
  {
    id: "A-1004",
    poleId: "P002",
    faultType: "sag",
    severity: "high",
    reading: "21.30 mm",
    message: "Measured wire sag exceeded the critical threshold",
    time: "14:31:22",
    minutesAgo: 12,
    status: "resolved",
  },
  {
    id: "A-1005",
    poleId: "P003",
    faultType: "leakage",
    severity: "medium",
    reading: "0.032 A",
    message: "Leakage difference 0.032 A exceeds threshold",
    time: "14:30:11",
    minutesAgo: 14,
    status: "resolved",
  },
  {
    id: "A-1006",
    poleId: "P001",
    faultType: "tilt",
    severity: "low",
    reading: "2.1°",
    message: "Tilt angle returned to nominal range",
    time: "14:29:05",
    minutesAgo: 16,
    status: "resolved",
  },
  {
    id: "A-1007",
    poleId: "P002",
    faultType: "sag",
    severity: "medium",
    reading: "11.20 mm",
    message: "Measured wire sag is rising above its baseline",
    time: "14:28:19",
    minutesAgo: 18,
    status: "resolved",
  },
  {
    id: "A-1008",
    poleId: "P003",
    faultType: "leakage",
    severity: "high",
    reading: "0.058 A",
    message: "Leakage difference 0.058 A exceeds threshold",
    time: "14:27:33",
    minutesAgo: 20,
    status: "resolved",
  },
];

export const DEVICES: Device[] = [
  { id: "esp32-1", name: "ESP32 #1", online: true },
  { id: "esp32-2", name: "ESP32 #2", online: true },
  { id: "api", name: "API Server", online: true },
  { id: "telegram", name: "Telegram Bot", online: true },
];

export function buildPoleDetail(pole: Pole): PoleDetail {
  const history = generateSeries(pole.id, pole.metric, "24h");
  const values = history.map((h) => h.value);
  const digits = pole.metric === "leakage" ? 3 : 2;
  return {
    ...pole,
    history,
    statistics: {
      maximum: Number(Math.max(...values).toFixed(digits)),
      minimum: Number(Math.min(...values).toFixed(digits)),
      average: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(digits)),
      unit: pole.unit,
    },
    maintenance: [
      {
        id: `${pole.id}-m1`,
        poleId: pole.id,
        date: "12 Jul 2026",
        technician: "R. Nair",
        action: "Sensor recalibration and firmware update",
      },
      {
        id: `${pole.id}-m2`,
        poleId: pole.id,
        date: "28 Jun 2026",
        technician: "S. Iyer",
        action: "Enclosure sealing, battery pack inspection",
      },
    ],
    alerts: ALERTS.filter((a) => a.poleId === pole.id),
  };
}

export const HEALTH_RADAR = [
  { axis: "Tilt", current: 88, ideal: 100 },
  { axis: "Sag", current: 64, ideal: 100 },
  { axis: "Communication", current: 92, ideal: 100 },
  { axis: "Battery", current: 74, ideal: 100 },
  { axis: "Signal Strength", current: 81, ideal: 100 },
];
