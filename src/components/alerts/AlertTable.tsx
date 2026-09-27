import { Check, CheckCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { faultLabel, severityLabel, severityVariant } from "@/lib/format";
import { useAlertState, type DecoratedAlert, type EffectiveStatus } from "@/features/alert-state";

const statusVariant = (s: EffectiveStatus) =>
  s === "resolved" ? "normal" : s === "acknowledged" ? "warning" : "critical";

const statusLabel = (s: EffectiveStatus) =>
  s === "resolved" ? "Resolved" : s === "acknowledged" ? "Acknowledged" : "Unresolved";

function useActions() {
  const { acknowledge, resolve, reopen } = useAlertState();
  return {
    ack: (a: DecoratedAlert) => {
      acknowledge(a.id);
      toast.success(`${a.poleId} alert acknowledged`, {
        description: "Marked as being worked on by Operator.",
      });
    },
    done: (a: DecoratedAlert) => {
      resolve(a.id);
      toast.success(`${a.poleId} alert resolved`, {
        description: `${faultLabel(a.faultType)} fault closed.`,
      });
    },
    undo: (a: DecoratedAlert) => {
      reopen(a.id);
      toast(`${a.poleId} alert reopened`);
    },
  };
}

function RowActions({ a }: { a: DecoratedAlert }) {
  const { ack, done, undo } = useActions();
  return (
    <div className="flex justify-end gap-1.5">
      {a.effectiveStatus === "unresolved" && (
        <Button size="sm" variant="outline" onClick={() => ack(a)}>
          <Check className="size-3.5" /> Acknowledge
        </Button>
      )}
      {a.effectiveStatus !== "resolved" && (
        <Button size="sm" onClick={() => done(a)}>
          <CheckCheck className="size-3.5" /> Resolve
        </Button>
      )}
      {a.effectiveStatus !== "unresolved" && (
        <Button size="sm" variant="ghost" onClick={() => undo(a)} aria-label="Reopen alert">
          <RotateCcw className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

export function AlertTable({ rows }: { rows: DecoratedAlert[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No alerts match the current filters.
      </p>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Pole ID</TableHead>
              <TableHead>Fault Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Sensor Reading</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id} className="border-border">
                <TableCell className="font-medium">{a.poleId}</TableCell>
                <TableCell>{faultLabel(a.faultType)}</TableCell>
                <TableCell>
                  <StatusBadge variant={severityVariant(a.severity)}>
                    {severityLabel(a.severity)}
                  </StatusBadge>
                </TableCell>
                <TableCell className="font-mono tabular-nums">{a.reading}</TableCell>
                <TableCell className="text-muted-foreground">{a.time}</TableCell>
                <TableCell>
                  <StatusBadge variant={statusVariant(a.effectiveStatus)}>
                    {statusLabel(a.effectiveStatus)}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-right">
                  <RowActions a={a} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {rows.map((a) => (
          <div key={a.id} className="rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{a.poleId}</span>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {faultLabel(a.faultType)} · {a.reading}
            </p>
            <div className="mt-2 flex gap-2">
              <StatusBadge variant={severityVariant(a.severity)}>
                {severityLabel(a.severity)}
              </StatusBadge>
              <StatusBadge variant={statusVariant(a.effectiveStatus)}>
                {statusLabel(a.effectiveStatus)}
              </StatusBadge>
            </div>
            <div className="mt-3">
              <RowActions a={a} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
