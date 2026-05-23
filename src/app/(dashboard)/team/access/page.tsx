"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Monitor, Activity, ShieldAlert } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnalyticsCard } from "@/components/team/shared/analytics-card";
import { SessionCard } from "@/components/team/access/session-card";
import { AiRecommendationsPanel } from "@/components/team/overview/ai-recommendations-panel";
import type { Recommendation } from "@/components/team/shared/ai-recommendation-card";
import { useRealtime } from "@/hooks/use-realtime";
import { formatRelativeTime } from "@/lib/utils";

interface Session {
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

interface SessionsResponse {
  sessions: Session[];
  summary: { total: number; active: number; suspicious: number; revoked: number };
}

interface AccessLog {
  id: string;
  eventType: string;
  ipAddress: string | null;
  location: string | null;
  success: boolean;
  riskScore: number;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null } | null;
}

const EVENT_TONE: Record<string, { bg: string; text: string }> = {
  LOGIN: { bg: "bg-emerald-50", text: "text-emerald-700" },
  LOGOUT: { bg: "bg-slate-100", text: "text-slate-600" },
  FAILED_LOGIN: { bg: "bg-rose-50", text: "text-rose-700" },
  PASSWORD_CHANGE: { bg: "bg-amber-50", text: "text-amber-700" },
  TWO_FACTOR_ENABLED: { bg: "bg-emerald-50", text: "text-emerald-700" },
  TWO_FACTOR_DISABLED: { bg: "bg-amber-50", text: "text-amber-700" },
  PERMISSION_GRANTED: { bg: "bg-indigo-50", text: "text-indigo-700" },
  PERMISSION_REVOKED: { bg: "bg-rose-50", text: "text-rose-700" },
  SESSION_REVOKED: { bg: "bg-rose-50", text: "text-rose-700" },
  SUSPICIOUS_ACTIVITY: { bg: "bg-rose-50", text: "text-rose-700" },
};

export default function TeamAccessPage() {
  useRealtime("team");

  const { data: sessionsData } = useQuery<SessionsResponse>({
    queryKey: ["team-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/team/access/sessions");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: logsData } = useQuery<{ items: AccessLog[] }>({
    queryKey: ["team-access-logs"],
    queryFn: async () => {
      const res = await fetch("/api/team/access/logs?limit=20");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: overview } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ["team-overview"],
    queryFn: async () => {
      const res = await fetch("/api/team/overview");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const securityRecs = (overview?.recommendations ?? []).filter(
    (r) => r.type === "SECURITY_RISK" || r.type === "PERMISSION_CLEANUP"
  );

  const activeSessions = sessionsData?.sessions.filter((s) => s.status === "ACTIVE") ?? [];
  const suspiciousSessions = sessionsData?.sessions.filter((s) => s.status === "SUSPICIOUS") ?? [];
  const otherSessions = sessionsData?.sessions.filter(
    (s) => s.status !== "ACTIVE" && s.status !== "SUSPICIOUS"
  ) ?? [];

  return (
    <>
      <Navbar
        title="Workspace Access"
        subtitle="Session monitoring, device trust, security alerts, and 2FA management."
        badge="SECURITY"
      />

      <div className="flex-1 space-y-5 px-4 pb-28 pt-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100/60 bg-gradient-to-r from-indigo-50/40 via-white to-purple-50/30 px-4 py-2.5 glass-card"
        >
          <Badge variant="purple" className="gap-1">
            <ShieldCheck className="h-3 w-3" />
            Access Intelligence
          </Badge>
          <span className="text-xs text-slate-500">
            Real-time session monitoring, device fingerprinting, and AI risk scoring.
          </span>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <AnalyticsCard
            label="Active Sessions"
            value={sessionsData?.summary.active ?? 0}
            icon={Activity}
            tone="emerald"
            pulse
            hint="currently online"
          />
          <AnalyticsCard
            label="Suspicious"
            value={sessionsData?.summary.suspicious ?? 0}
            icon={AlertTriangle}
            tone="rose"
            hint="AI-flagged anomalies"
            ai
          />
          <AnalyticsCard
            label="Total Sessions"
            value={sessionsData?.summary.total ?? 0}
            icon={Monitor}
            tone="indigo"
            hint="all time"
          />
          <AnalyticsCard
            label="Revoked"
            value={sessionsData?.summary.revoked ?? 0}
            icon={ShieldAlert}
            tone="amber"
            hint="manually terminated"
          />
        </div>

        {suspiciousSessions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-rose-100/80 bg-rose-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="h-4 w-4" />
                  Security Alerts ({suspiciousSessions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {suspiciousSessions.map((s) => (
                    <SessionCard key={s.id} {...s} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <motion.div className="xl:col-span-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  Active Sessions ({activeSessions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeSessions.length === 0 ? (
                  <EmptyState title="No active sessions" description="All members are offline." />
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
                    {activeSessions.map((s) => (
                      <SessionCard key={s.id} {...s} />
                    ))}
                  </div>
                )}
                {otherSessions.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Recent ({otherSessions.length})
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {otherSessions.slice(0, 4).map((s) => (
                        <SessionCard key={s.id} {...s} />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div className="xl:col-span-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-500" />
                  Login Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!logsData?.items.length ? (
                  <EmptyState title="No access events yet" />
                ) : (
                  <ol className="space-y-0">
                    {logsData.items.slice(0, 10).map((l, i) => {
                      const tone = EVENT_TONE[l.eventType] ?? { bg: "bg-slate-50", text: "text-slate-600" };
                      return (
                        <li key={l.id} className="relative flex gap-3 pb-3 last:pb-0">
                          {i < Math.min(logsData.items.length, 10) - 1 && (
                            <span className="absolute left-[8px] top-5 h-full w-px bg-slate-200" />
                          )}
                          <span className={`h-4 w-4 shrink-0 rounded-full ${tone.bg} ring-4 ring-white`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-700">
                                {l.eventType.replace(/_/g, " ")}
                              </p>
                              <span className={`text-[10px] font-semibold ${tone.text}`}>
                                {l.success ? "OK" : "FAIL"}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
                              {l.user && (
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={l.user.avatar || undefined} />
                                  <AvatarFallback className="text-[7px]">{l.user.name[0]}</AvatarFallback>
                                </Avatar>
                              )}
                              <span>{l.user?.name ?? "—"}</span>
                              <span>·</span>
                              <span>{l.location ?? "Unknown"}</span>
                              <span>·</span>
                              <span>{formatRelativeTime(l.createdAt)}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {securityRecs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <AiRecommendationsPanel recommendations={securityRecs} limit={4} />
          </motion.div>
        )}
      </div>
    </>
  );
}
