import { Bell, CircleUser, ShieldCheck, Volume2, VolumeX } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useLiveClock } from "@/hooks/use-hydrated";
import { alertsQuery } from "@/features/queries";
import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import { useAlertState, useDecoratedAlerts } from "@/features/alert-state";

export function Topbar() {
  const now = useLiveClock();
  const { data } = useSuspenseQuery(
    alertsQuery({ q: "", severity: "all", status: "all", poleId: "all" }),
  );
  const { soundEnabled, setSoundEnabled } = useAlertState();
  const decorated = useDecoratedAlerts(data.rows);
  const unread = decorated.filter((a) => a.effectiveStatus === "unresolved").length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-3 backdrop-blur sm:px-5">
      <SidebarTrigger />
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">PoleGuard</h1>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Smart Pole Monitoring System
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <div className="hidden text-right lg:block">
          <p className="text-xs text-muted-foreground">
            {now
              ? now.toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "--"}
          </p>
          <p className="font-mono text-sm text-accent tabular-nums">
            {now ? now.toLocaleTimeString(undefined, { hour12: false }) : "--:--:--"}
          </p>
        </div>

        <StatusBadge
          variant={unread > 0 ? "critical" : "normal"}
          dot
          className="hidden sm:inline-flex"
        >
          <ShieldCheck className="size-3.5" />
          {unread > 0 ? `${unread} Active Alert${unread > 1 ? "s" : ""}` : "All Systems Normal"}
        </StatusBadge>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          aria-label={soundEnabled ? "Mute alert sound" : "Enable alert sound"}
          title={soundEnabled ? "Alert sound on" : "Alert sound off"}
        >
          {soundEnabled ? (
            <Volume2 className="size-5 text-accent" />
          ) : (
            <VolumeX className="size-5" />
          )}
        </Button>

        <NotificationDrawer
          trigger={
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-critical text-[10px] font-semibold text-destructive-foreground">
                  {unread}
                </span>
              )}
            </Button>
          }
        />

        <Button variant="ghost" size="icon" aria-label="Account">
          <CircleUser className="size-5" />
        </Button>
      </div>
    </header>
  );
}
