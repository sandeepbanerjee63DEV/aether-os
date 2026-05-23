"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  KeyRound,
  Network,
  GitBranch,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/team", label: "Overview", icon: LayoutDashboard, match: "exact" as const },
  { href: "/team/members", label: "Members", icon: Users, match: "prefix" as const },
  { href: "/team/roles", label: "Roles & Permissions", icon: KeyRound, match: "prefix" as const },
  { href: "/team/departments", label: "Departments", icon: Network, match: "prefix" as const },
  { href: "/team/assignments", label: "Assignments", icon: GitBranch, match: "prefix" as const, ai: true },
  { href: "/team/access", label: "Workspace Access", icon: ShieldCheck, match: "prefix" as const },
  { href: "/team/settings", label: "Team Settings", icon: Settings, match: "prefix" as const },
];

export function TeamSubnav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-[81px] z-20 -mt-1 border-b border-slate-100/80 bg-workspace/95 px-4 backdrop-blur-md lg:px-6">
      <div className="scrollbar-thin -mb-px flex gap-1 overflow-x-auto py-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active =
            t.match === "exact" ? pathname === t.href : pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "group relative inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              <span>{t.label}</span>
              {t.ai && (
                <span
                  aria-hidden
                  className="relative h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.7)]"
                >
                  <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 live-pulse" />
                </span>
              )}
              {active && (
                <span className="pointer-events-none absolute bottom-[-9px] left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
