import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { alertsQuery } from "@/features/queries";
import { decorate, useAlertState } from "@/features/alert-state";
import { faultLabel } from "@/lib/format";

/** Plays a short two-tone alert chime using WebAudio (no asset needed). */
function chime() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const now = ctx.currentTime;
    [880, 1174].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.18);
    });
    setTimeout(() => void ctx.close(), 900);
  } catch {
    /* audio blocked */
  }
}

/**
 * Watches for unresolved high-severity alerts and raises a toast (plus optional
 * chime) the moment a new one appears. Polls every 15s.
 */
export function useCriticalWatch() {
  const { overrides, soundEnabled } = useAlertState();
  const { data } = useQuery({
    ...alertsQuery({ q: "", severity: "high", status: "all", poleId: "all" }),
    refetchInterval: 15_000,
  });

  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!data) return;
    const critical = decorate(data.rows, overrides).filter(
      (a) => a.effectiveStatus === "unresolved",
    );

    if (seen.current === null) {
      seen.current = new Set(critical.map((a) => a.id));
      if (critical.length > 0) {
        toast.error(`${critical.length} unresolved critical alert${critical.length > 1 ? "s" : ""}`, {
          description: "Open Alert History to acknowledge or resolve them.",
        });
      }
      return;
    }

    const fresh = critical.filter((a) => !seen.current!.has(a.id));
    if (fresh.length === 0) return;
    fresh.forEach((a) => {
      seen.current!.add(a.id);
      toast.error(`${a.poleId} — ${faultLabel(a.faultType)} critical`, {
        description: `${a.message} (${a.reading})`,
        duration: 10_000,
      });
    });
    if (soundEnabled) chime();
  }, [data, overrides, soundEnabled]);
}
