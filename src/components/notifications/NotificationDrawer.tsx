import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Check, CheckCheck, CheckCircle2, XOctagon } from "lucide-react";
import type { ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { alertsQuery } from "@/features/queries";
import { useAlertState, useDecoratedAlerts } from "@/features/alert-state";
import { faultLabel, relativeMinutes } from "@/lib/format";
import type { PoleAlert } from "@/types";

const icon = (a: PoleAlert) =>
  a.severity === "high" ? XOctagon : a.severity === "medium" ? AlertTriangle : CheckCircle2;

const tone = (a: PoleAlert) =>
  a.severity === "high"
    ? "text-critical border-critical/30 bg-critical/8"
    : a.severity === "medium"
      ? "text-warning border-warning/30 bg-warning/8"
      : "text-normal border-normal/30 bg-normal/8";

export function NotificationDrawer({ trigger }: { trigger: ReactNode }) {
  const { data } = useSuspenseQuery(
    alertsQuery({ q: "", severity: "all", status: "all", poleId: "all" }),
  );
  const { acknowledge, resolve } = useAlertState();
  const decorated = useDecoratedAlerts(data.rows);
  const items = decorated
    .slice()
    .sort((a, b) => Number(b.effectiveStatus === "unresolved") - Number(a.effectiveStatus === "unresolved"))
    .slice(0, 6);

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full border-border bg-surface sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>Live fault events across all monitored poles.</SheetDescription>
        </SheetHeader>

        <div className="space-y-2 overflow-y-auto px-4">
          {items.map((a) => {
            const Icon = icon(a);
            return (
              <div key={a.id} className={`rounded-lg border p-3 ${tone(a)}`}>
                <div className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {a.poleId} — {faultLabel(a.faultType)} Warning
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {relativeMinutes(a.minutesAgo)}
                      {a.effectiveStatus !== "unresolved" ? ` · ${a.effectiveStatus}` : ""}
                    </p>
                    <div className="mt-2 flex gap-1.5">
                      {a.effectiveStatus === "unresolved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => acknowledge(a.id)}
                        >
                          <Check className="size-3" /> Ack
                        </Button>
                      )}
                      {a.effectiveStatus !== "resolved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => resolve(a.id)}
                        >
                          <CheckCheck className="size-3" /> Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto p-4">
          <Button asChild variant="outline" className="w-full">
            <Link to="/alerts">View All Notifications</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
