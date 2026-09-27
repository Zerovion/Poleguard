import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { PoleAlert } from "@/types";

export type EffectiveStatus = "unresolved" | "acknowledged" | "resolved";

export interface AlertOverride {
  status: EffectiveStatus;
  note?: string;
  at: string;
  by: string;
}

type Overrides = Record<string, AlertOverride>;

const STORAGE_KEY = "poleguard.alert-overrides.v1";
const SOUND_KEY = "poleguard.alert-sound.v1";

interface Ctx {
  overrides: Overrides;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  acknowledge: (id: string, note?: string) => void;
  resolve: (id: string, note?: string) => void;
  reopen: (id: string) => void;
}

const AlertStateContext = createContext<Ctx | null>(null);

export function AlertStateProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Overrides>({});
  const [soundEnabled, setSoundEnabledState] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOverrides(JSON.parse(raw) as Overrides);
      setSoundEnabledState(localStorage.getItem(SOUND_KEY) === "1");
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const persist = useCallback((next: Overrides) => {
    setOverrides(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const write = useCallback(
    (id: string, status: EffectiveStatus, note?: string) =>
      persist({
        ...overrides,
        [id]: { status, note, at: new Date().toISOString(), by: "Operator" },
      }),
    [overrides, persist],
  );

  const setSoundEnabled = useCallback((v: boolean) => {
    setSoundEnabledState(v);
    try {
      localStorage.setItem(SOUND_KEY, v ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      overrides,
      soundEnabled,
      setSoundEnabled,
      acknowledge: (id, note) => write(id, "acknowledged", note),
      resolve: (id, note) => write(id, "resolved", note),
      reopen: (id) => {
        const next = { ...overrides };
        delete next[id];
        persist(next);
      },
    }),
    [overrides, soundEnabled, setSoundEnabled, write, persist],
  );

  return <AlertStateContext.Provider value={value}>{children}</AlertStateContext.Provider>;
}

export function useAlertState() {
  const ctx = useContext(AlertStateContext);
  if (!ctx) throw new Error("useAlertState must be used inside AlertStateProvider");
  return ctx;
}

export interface DecoratedAlert extends PoleAlert {
  effectiveStatus: EffectiveStatus;
  override?: AlertOverride;
}

export function decorate(rows: PoleAlert[], overrides: Overrides): DecoratedAlert[] {
  return rows.map((a) => {
    const o = overrides[a.id];
    return {
      ...a,
      override: o,
      effectiveStatus: o ? o.status : (a.status as EffectiveStatus),
    };
  });
}

/** Decorated alerts with client-side acknowledge/resolve state applied. */
export function useDecoratedAlerts(rows: PoleAlert[]): DecoratedAlert[] {
  const { overrides } = useAlertState();
  return useMemo(() => decorate(rows, overrides), [rows, overrides]);
}
