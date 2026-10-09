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
  queryOptions({
    queryKey: ["poles"],
    queryFn: () => getPoles(),
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });

export const sitePowerStatusQuery = () =>
  queryOptions({
    queryKey: ["site-power-status"],
    queryFn: () => getSitePowerStatus(),
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });

export const poleQuery = (id: string) =>
  queryOptions({ queryKey: ["pole", id], queryFn: () => getPole({ data: { id } }) });

export const devicesQuery = () =>
  queryOptions({
    queryKey: ["devices"],
    queryFn: () => getDevices(),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

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
