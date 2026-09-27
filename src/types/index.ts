export type PoleStatus = "normal" | "warning" | "critical" | "offline";
export type FaultType = "tilt" | "sag" | "leakage";
export type Severity = "low" | "medium" | "high";
export type AlertStatus = "resolved" | "unresolved";
export type MetricKey = "tilt" | "sag" | "leakage";
export type TimeRange = "15m" | "1h" | "6h" | "24h";

export interface Threshold {
  metric: MetricKey;
  baseline: number;
  warning: number;
  critical: number;
  unit: string;
}

export interface Pole {
  id: string;
  name: string;
  monitoring: string;
  metric: MetricKey;
  status: PoleStatus;
  location: string;
  lat: number;
  lng: number;
  value: number;
  unit: string;
  secondary?: { label: string; value: number; unit: string }[];
  threshold: Threshold;
  battery: number;
  signal: number;
  wifiQuality: string;
  uptime: string;
  lastUpdated: string;
  sparkline: number[];
}

export interface SitePowerStatus {
  colony: string;
  maintenanceSwitchOn: boolean;
}

export interface SensorReading {
  t: string;
  value: number;
  secondary?: number;
  tertiary?: number;
}

export interface PoleAlert {
  id: string;
  poleId: string;
  faultType: FaultType;
  severity: Severity;
  reading: string;
  message: string;
  time: string;
  minutesAgo: number;
  status: AlertStatus;
}

export interface Device {
  id: string;
  name: string;
  online: boolean;
}

export interface PoleStatistics {
  maximum: number;
  minimum: number;
  average: number;
  unit: string;
}

export interface MaintenanceRecord {
  id: string;
  poleId: string;
  date: string;
  technician: string;
  action: string;
}

export interface PoleDetail extends Pole {
  statistics: PoleStatistics;
  history: SensorReading[];
  maintenance: MaintenanceRecord[];
  alerts: PoleAlert[];
}

export interface AlertFilters {
  q?: string;
  severity?: string;
  status?: string;
  poleId?: string;
}

export interface SettingsPayload {
  thresholds: Threshold[];
  telegramEnabled: boolean;
  autoRefresh: boolean;
  refreshSeconds: number;
}
