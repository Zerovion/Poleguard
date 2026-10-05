import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { polesQuery } from "@/features/queries";
import { useAlertState } from "@/features/alert-state";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  } catch {
    ctx = null;
  }
  return ctx;
}

/** Browsers only allow audio after a user gesture; unlock on the first one. */
function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

function beep(c: AudioContext, freq: number, start: number, dur: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "square"; // harsh, loud tone
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(1.0, start + 0.01); // full volume
  gain.gain.setValueAtTime(1.0, start + dur - 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/**
 * Loud two-tone siren that keeps repeating for as long as ANY live pole is
 * in the "critical" state. Stops when the fault clears or the speaker icon
 * in the top bar is muted.
 */
export function useCriticalSiren() {
  const { soundEnabled } = useAlertState();
  const { data } = useQuery(polesQuery());

  const critical = (data ?? []).filter((p) => p.status === "critical");
  const active = soundEnabled && critical.length > 0;

  // Unlock audio on first click / key / touch anywhere on the page.
  useEffect(() => {
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, unlockAudio));
    return () => events.forEach((e) => window.removeEventListener(e, unlockAudio));
  }, []);

  // Toast when a pole newly turns critical.
  const seen = useRef<Set<string>>(new Set());
  useEffect(() => {
    const now = new Set(critical.map((p) => p.id));
    critical.forEach((p) => {
      if (!seen.current.has(p.id)) {
        toast.error(`CRITICAL: ${p.name} (${p.id})`, {
          description: `${p.monitoring} fault detected`,
          duration: 15_000,
        });
      }
    });
    seen.current = now;
  }, [critical.map((p) => p.id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // The siren itself.
  useEffect(() => {
    if (!active) return;
    const c = getCtx();
    if (!c) return;
    void c.resume();

    if (c.state !== "running") {
      toast.warning("Alarm sound is blocked by the browser", {
        description: "Click anywhere on the page once to enable the siren.",
        id: "siren-blocked",
      });
    }

    let high = true;
    const play = () => {
      if (c.state !== "running") return;
      beep(c, high ? 960 : 700, c.currentTime, 0.32);
      high = !high;
    };
    play();
    const id = setInterval(play, 350);
    return () => clearInterval(id);
  }, [active]);
}
