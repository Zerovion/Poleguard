import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MetricKey, SensorReading } from "@/types";

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "0.5rem",
    fontSize: "12px",
    color: "var(--color-foreground)",
  },
  labelStyle: { color: "var(--color-muted-foreground)" },
};

export interface TelemetryChartProps {
  data: SensorReading[];
  metric: MetricKey;
  height?: number;
  showLegend?: boolean;
}

export function TelemetryChart({
  data,
  metric,
  height = 220,
  showLegend = true,
}: TelemetryChartProps) {
  const warn = metric === "tilt" ? 15 : metric === "sag" ? 12 : 0.03;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="t" {...axis} minTickGap={28} />
        <YAxis
          {...axis}
          width={metric === "sag" ? 54 : 44}
          tickFormatter={metric === "sag" ? (value: number) => `${value} mm` : undefined}
        />
        <Tooltip {...tooltipStyle} />
        {showLegend ? <Legend wrapperStyle={{ fontSize: 11 }} /> : null}
        <ReferenceLine
          y={warn}
          stroke={metric === "sag" ? "var(--color-warning)" : "var(--color-critical)"}
          strokeDasharray="4 4"
          label={metric === "sag" ? "Warning" : undefined}
          ifOverflow="extendDomain"
        />
        {metric === "sag" ? (
          <ReferenceLine
            y={20}
            stroke="var(--color-critical)"
            strokeDasharray="4 4"
            label="Critical"
            ifOverflow="extendDomain"
          />
        ) : null}
        {metric === "leakage" ? (
          <>
            <Line
              type="monotone"
              dataKey="secondary"
              name="Live Current"
              stroke="var(--color-chart-1)"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="tertiary"
              name="Neutral Current"
              stroke="var(--color-chart-2)"
              dot={false}
              strokeWidth={2}
            />
          </>
        ) : null}
        <Line
          type="monotone"
          dataKey="value"
          name={metric === "sag" ? "Wire Sag" : metric === "tilt" ? "Tilt Angle" : "Leakage"}
          stroke={metric === "leakage" ? "var(--color-chart-4)" : "var(--color-chart-1)"}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Sparkline({
  values,
  tone = "accent",
}: {
  values: number[];
  tone?: "accent" | "violet" | "critical";
}) {
  const color =
    tone === "violet"
      ? "var(--color-chart-2)"
      : tone === "critical"
        ? "var(--color-chart-4)"
        : "var(--color-chart-1)";
  const data = values.map((v, i) => ({ i, v }));

  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.75}
          fill={`url(#spark-${tone})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HealthRadar({
  data,
  height = 240,
}: {
  data: { axis: string; current: number; ideal: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--color-border)" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
        <Radar
          name="Ideal Score"
          dataKey="ideal"
          stroke="var(--color-chart-2)"
          fill="var(--color-chart-2)"
          fillOpacity={0.12}
        />
        <Radar
          name="Current Score"
          dataKey="current"
          stroke="var(--color-chart-1)"
          fill="var(--color-chart-1)"
          fillOpacity={0.35}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip {...tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
