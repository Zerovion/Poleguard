import type { PoleStatus, Severity } from "@/types";

export const statusVariant = (s: PoleStatus) => s;

export const severityVariant = (s: Severity) =>
  s === "high" ? "critical" : s === "medium" ? "warning" : "normal";

export const severityLabel = (s: Severity) =>
  s === "high" ? "High" : s === "medium" ? "Medium" : "Low";

export const faultLabel = (f: string) =>
  f === "sag" ? "Wire Sag" : f === "tilt" ? "Tilt" : "Leakage";

export const formatValue = (value: number, unit: string) =>
  `${unit === "A" ? value.toFixed(3) : value.toFixed(unit === "°" ? 1 : 2)} ${unit}`.trim();

export const relativeMinutes = (m: number) => (m < 1 ? "just now" : `${m} min ago`);
