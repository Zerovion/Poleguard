import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/** Chart/card reveal: fades and scales in with an optional stagger index. */
export function Reveal({
  children,
  index = 0,
  className,
  variant = "card",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
  variant?: "card" | "chart" | "table";
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  const initial =
    variant === "chart"
      ? { opacity: 0, scale: 0.98 }
      : variant === "table"
        ? { opacity: 0, y: 12 }
        : { opacity: 0, y: 10 };

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
