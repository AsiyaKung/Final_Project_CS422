"use client";
import { cn } from "@/lib/utils/cn";

type BadgeVariant = "cyan" | "violet" | "green" | "yellow" | "red" | "gray";

const variants: Record<BadgeVariant, string> = {
  cyan: "bg-neon-400/15 text-neon-300 border-neon-400/30",
  violet: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  yellow: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  red: "bg-red-500/15 text-red-300 border-red-500/30",
  gray: "bg-white/8 text-dark-300 border-white/10",
};

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "gray", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Convenience badge for TaskStatus values. */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    pending: { label: "Pending", variant: "yellow" },
    in_progress: { label: "In Progress", variant: "cyan" },
    done: { label: "Done", variant: "green" },
  };
  const cfg = map[status] ?? { label: status, variant: "gray" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
