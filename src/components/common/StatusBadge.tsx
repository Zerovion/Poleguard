import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadge = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        normal: "border-normal/30 bg-normal/10 text-normal",
        warning: "border-warning/30 bg-warning/10 text-warning",
        critical: "border-critical/35 bg-critical/12 text-critical",
        offline: "border-offline/30 bg-offline/10 text-offline",
        accent: "border-accent/30 bg-accent/10 text-accent",
        muted: "border-border bg-muted text-muted-foreground",
      },
      dot: { true: "", false: "" },
    },
    defaultVariants: { variant: "normal", dot: false },
  },
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadge> {}

export function StatusBadge({ className, variant, dot, children, ...props }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadge({ variant, dot }), className)} {...props}>
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
