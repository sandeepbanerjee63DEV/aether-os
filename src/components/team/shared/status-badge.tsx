import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
}

const STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  AWAY: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  SUSPENDED: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  PENDING_INVITE: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  INACTIVE: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

const LABELS: Record<string, string> = {
  ACTIVE: "Active",
  AWAY: "Away",
  SUSPENDED: "Suspended",
  PENDING_INVITE: "Pending",
  INACTIVE: "Inactive",
};

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const s = STYLE[status] ?? { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
        s.bg,
        s.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot, status === "ACTIVE" && "live-pulse")} />
      {LABELS[status] ?? status}
    </span>
  );
}
