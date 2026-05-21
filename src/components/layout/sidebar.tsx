"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Radio,
  Bot,
  Users,
  Handshake,
  CheckSquare,
  FolderKanban,
  Headphones,
  FileText,
  Sparkles,
  BarChart3,
  LineChart,
  GitBranch,
  Zap,
  Plug,
  UsersRound,
  Settings,
  HelpCircle,
  X,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "@/data/dashboard-config";
import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "layout-dashboard": LayoutDashboard,
  radio: Radio,
  bot: Bot,
  users: Users,
  handshake: Handshake,
  "check-square": CheckSquare,
  "folder-kanban": FolderKanban,
  headphones: Headphones,
  "file-text": FileText,
  sparkles: Sparkles,
  "bar-chart-3": BarChart3,
  "line-chart": LineChart,
  "git-branch": GitBranch,
  zap: Zap,
  plug: Plug,
  "users-round": UsersRound,
  settings: Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen, toggleSidebar } = useUiStore();

  const content = (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar text-white shadow-sidebar",
        sidebarCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div className={cn("flex items-center gap-3 border-b border-white/5 p-5", sidebarCollapsed && "justify-center px-3")}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-lg font-bold">
          A
        </div>
        {!sidebarCollapsed && (
          <div>
            <p className="text-sm font-bold tracking-wide">AETHER OS</p>
            <p className="text-[10px] text-slate-400">AI Business Command Center</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className={cn(si > 0 && "mt-6")}>
            {section.label && !sidebarCollapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-wider text-slate-500">{section.label}</p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        active
                          ? "bg-gradient-to-r from-indigo-600/40 to-purple-600/30 text-white shadow-inner"
                          : "text-slate-400 hover:bg-sidebar-hover hover:text-white",
                        sidebarCollapsed && "justify-center px-2"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-purple-300")} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge != null && (
                            <span className="rounded-full bg-purple-500 px-1.5 py-0.5 text-[10px] font-bold">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/5 p-3">
        <Link
          href="/support"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-sidebar-hover hover:text-white",
            sidebarCollapsed && "justify-center"
          )}
        >
          <HelpCircle className="h-[18px] w-[18px]" />
          {!sidebarCollapsed && <span>Help & Support</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="mt-2 hidden w-full text-slate-400 hover:text-white lg:flex"
          onClick={toggleSidebar}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
        </Button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block shrink-0">{content}</div>
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <div className="relative h-full">
                {content}
                <button
                  className="absolute right-3 top-5 rounded-lg p-1 text-slate-400 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
