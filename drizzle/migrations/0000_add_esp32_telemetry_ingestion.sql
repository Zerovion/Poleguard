CREATE TABLE public.esp32_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL CHECK (length(device_id) BETWEEN 1 AND 100),
  pole_id text NOT NULL CHECK (pole_id IN ('P001', 'P002', 'P003')),
  metric text NOT NULL CHECK (metric IN ('tilt', 'sag', 'leakage')),
  value double precision NOT NULL,
  secondary_value double precision,
  tertiary_value double precision,
  battery_pct smallint CHECK (battery_pct BETWEEN 0 AND 100),
  signal_dbm smallint,
  maintenance_switch_on boolean,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  received_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.esp32_readings TO service_role;
ALTER TABLE public.esp32_readings ENABLE ROW LEVEL SECURITY;

CREATE INDEX esp32_readings_pole_metric_recorded_idx
  ON public.esp32_readings (pole_id, metric, recorded_at DESC);

CREATE TABLE public.esp32_latest_state (
  pole_id text NOT NULL CHECK (pole_id IN ('P001', 'P002', 'P003')),
  metric text NOT NULL CHECK (metric IN ('tilt', 'sag', 'leakage')),
  device_id text NOT NULL CHECK (length(device_id) BETWEEN 1 AND 100),
  value double precision NOT NULL,
  secondary_value double precision,
  tertiary_value double precision,
  battery_pct smallint CHECK (battery_pct BETWEEN 0 AND 100),
  signal_dbm smallint,
  maintenance_switch_on boolean,
  recorded_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pole_id, metric)
);
GRANT ALL ON public.esp32_latest_state TO service_role;
ALTER TABLE public.esp32_latest_state ENABLE ROW LEVEL SECURITY;