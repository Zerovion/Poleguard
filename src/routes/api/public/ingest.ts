import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { z } from "zod";

// ---------------------------------------------------------------------------
// POST /api/public/ingest
//
// Called by the Smart PoleGuard ESP32 firmware every few seconds. Writes an
// append-only row per metric to `esp32_readings` (history, feeds the
// Monitoring charts) and upserts `esp32_latest_state` (one row per
// pole_id+metric, feeds the Dashboard/Map cards).
//
// Auth: a shared secret in the `x-ingest-secret` header, checked against the
// ESP32_INGEST_SECRET server secret (set it in Lovable Cloud's secrets panel
// — do NOT put it in the committed .env). This is intentionally simple
// (bearer-token style) rather than a full HMAC signature, since it runs over
// HTTPS and the ESP32 has limited crypto headroom; swap in a signed request
// later if this device is ever exposed beyond a hobby/portfolio deployment.
// ---------------------------------------------------------------------------

const readingSchema = z.object({
  metric: z.enum(["tilt", "sag", "leakage"]),
  value: z.number(),
  secondary_value: z.number().optional(),
  tertiary_value: z.number().optional(),
});

const payloadSchema = z.object({
  device_id: z.string().min(1).max(100),
  pole_id: z.enum(["P001", "P002", "P003"]),
  battery_pct: z.number().int().min(0).max(100).optional(),
  signal_dbm: z.number().int().optional(),
  maintenance_switch_on: z.boolean().optional(),
  recorded_at: z.string().datetime().optional(),
  readings: z.array(readingSchema).min(1).max(8),
});

export const Route = createFileRoute("/api/public/ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["ESP32_INGEST_SECRET"];
        if (!secret) {
          console.error("[ingest] ESP32_INGEST_SECRET is not configured on the server");
          return Response.json({ error: "Ingestion is not configured" }, { status: 500 });
        }
        if (request.headers.get("x-ingest-secret") !== secret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        const { device_id, pole_id, battery_pct, signal_dbm, maintenance_switch_on, readings } =
          parsed.data;
        const recordedAt = parsed.data.recorded_at ?? new Date().toISOString();

        // Dynamic import keeps the service-role client out of the client bundle
        // (this file is a server route, but api.functions.ts imports follow the
        // same rule elsewhere in this repo).
        // Fail with a readable JSON error (instead of Vercel's HTML error page)
        // when Supabase env vars are missing on the server.
        const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter(
          (k) => !process.env[k],
        );
        if (missing.length) {
          console.error("[ingest] missing env vars:", missing.join(", "));
          return Response.json(
            { error: `Server missing env var(s): ${missing.join(", ")}` },
            { status: 500 },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const rows = readings.map((r) => ({
          device_id,
          pole_id,
          metric: r.metric,
          value: r.value,
          secondary_value: r.secondary_value ?? null,
          tertiary_value: r.tertiary_value ?? null,
          battery_pct: battery_pct ?? null,
          signal_dbm: signal_dbm ?? null,
          maintenance_switch_on: maintenance_switch_on ?? null,
          recorded_at: recordedAt,
          // Must be set explicitly: on upsert-conflict the DB default now() is NOT
          // re-applied, so received_at would stay frozen at the first insert and
          // the dashboard would mark the pole Offline after 90s.
          received_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabaseAdmin.from("esp32_readings").insert(rows);
        if (insertError) {
          console.error("[ingest] esp32_readings insert failed", insertError);
          return Response.json({ error: "Insert failed" }, { status: 500 });
        }

        const { error: upsertError } = await supabaseAdmin
          .from("esp32_latest_state")
          .upsert(rows, { onConflict: "pole_id,metric" });
        if (upsertError) {
          console.error("[ingest] esp32_latest_state upsert failed", upsertError);
          return Response.json({ error: "State update failed" }, { status: 500 });
        }

        return Response.json({ ok: true, stored: rows.length });
      },
    },
  },
});
