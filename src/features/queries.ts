import { queryOptions } from "@tanstack/react-query";

import {
  getAlerts,
  getDevices,
  getHealthRadar,
  getPole,
  getPoles,
  getSettings,
  getSitePowerStatus,
  getTelemetry,
} from "./api.functions";
import type { MetricKey, TimeRange } from "@/types";

export const polesQuery = () =>
  queryOptions({ queryKey: ["poles"], queryFn: () => getPoles(), refetchInterval: 5000 });

export const sitePowerStatusQuery = () =>
  queryOptions({ queryKey: ["site-power-status"], queryFn: () => getSitePowerStatus() });

export const poleQuery = (id: string) =>
  queryOptions({ queryKey: ["pole", id], queryFn: () => getPole({ data: { id } }) });

export const devicesQuery = () =>
  queryOptions({ queryKey: ["devices"], queryFn: () => getDevices() });

export const healthRadarQuery = () =>
  queryOptions({ queryKey: ["health-radar"], queryFn: () => getHealthRadar() });

export const telemetryQuery = (poleId: string, metric: MetricKey, range: TimeRange) =>
  queryOptions({
    queryKey: ["telemetry", poleId, metric, range],
    queryFn: () => getTelemetry({ data: { poleId, metric, range } }),
  });

export const alertsQuery = (filters: {
  q: string;
  severity: string;
  status: string;
  poleId: string;
}) =>
  queryOptions({
    queryKey: ["alerts", filters],
    queryFn: () => getAlerts({ data: filters }),
  });

export const settingsQuery = () =>
  queryOptions({ queryKey: ["settings"], queryFn: () => getSettings() });
