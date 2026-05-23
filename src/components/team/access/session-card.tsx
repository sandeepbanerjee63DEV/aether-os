"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Monitor, Smartphone, Tablet, Globe2, MapPin, AlertTriangle, X } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

interface SessionCardProps {
  id: string;
  status: string;
  ipAddress: string | null;
  ipCity: string | null;
  ipCountry: string | null;
  browser: string | null;
  os: string | null;
  riskScore: number;
  lastActiveAt: string;
  user: { id: string; name: string; avatar: string | null; role: string } | null;
  device: { type: string; name: string; trusted: boolean } | null;
}

export function SessionCard(props: SessionCardProps) {
  const qc = useQueryClient();
  const revoke = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/team/access/logout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: props.id }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-sessions"] });
      qc.invalidateQueries({ queryKey: ["team-overview"] });
    },
  });

  const isSuspicious = props.status === "SUSPICIOUS" || props.riskScore >= 70;
  const isActive = props.status === "ACTIVE";

  const DeviceIcon =
    props.device?.type === "mobile" ? Smartphone : props.device?.type === "tablet" ? Tablet : Monitor;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover",
        isSuspicious
          ? "border-rose-100 ring-1 ring-rose-100"
          : isActive
            ? "border-slate-100/80"
            : "border-slate-100/80 opacity-70"
      )}
    >
      {isSuspicious && (
        <span className="data-flow-line absolute left-0 top-0 h-[1px] w-full opacity-80" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {props.user && (
            <Avatar className="h-9 w-9">
              <AvatarImage src={props.user.avatar || undefined} />
              <AvatarFallback>{props.user.name[0]}</AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              {props.user?.name ?? "Unknown user"}
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.7)] live-pulse" />
              )}
            </p>
            <p className="text-[11px] text-slate-500">
              {props.browser ?? "Browser"} · {props.os ?? "OS"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              props.status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-700"
                : props.status === "SUSPICIOUS"
                  ? "bg-rose-50 text-rose-700"
                  : props.status === "REVOKED"
                    ? "bg-slate-100 text-slate-500"
                    : "bg-slate-100 text-slate-500"
            )}
          >
            {props.status}
          </span>
          <span
            className={cn(
              "text-[10px] font-semibold",
              props.riskScore < 30
                ? "text-emerald-600"
                : props.riskScore < 70
                  ? "text-amber-600"
                  : "text-rose-600"
            )}
          >
            Risk {props.riskScore}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-slate-400" />
          {props.ipCity ? `${props.ipCity}, ${props.ipCountry ?? ""}` : props.ipCountry ?? "Unknown"}
        </div>
        <div className="flex items-center gap-1.5">
          <Globe2 className="h-3 w-3 text-slate-400" />
          {props.ipAddress ?? "—"}
        </div>
        {props.device && (
          <div className="col-span-2 flex items-center gap-1.5">
            <DeviceIcon className="h-3 w-3 text-slate-400" />
            {props.device.name}
            {props.device.trusted && (
              <span className="rounded-full bg-emerald-50 px-1.5 py-px text-[9px] font-semibold text-emerald-700">
                TRUSTED
              </span>
            )}
          </div>
        )}
        <div className="col-span-2 text-[10px] text-slate-400">
          Last active {formatRelativeTime(props.lastActiveAt)}
        </div>
      </div>

      {isSuspicious && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700 ring-1 ring-rose-100">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Geo-anomaly detected. AI flagged this session for review.
        </div>
      )}

      {isActive && (
        <button
          type="button"
          onClick={() => revoke.mutate()}
          disabled={revoke.isPending}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <X className="h-3 w-3" />
          {revoke.isPending ? "Revoking…" : "Force revoke"}
        </button>
      )}
    </motion.div>
  );
}
