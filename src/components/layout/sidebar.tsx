"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Radio,
  Bot,
  Bell,
  Activity,
  Users,
  Handshake,
  CheckSquare,
  FolderKanban,
  Headphones,
  FileText,
  Building2,
  FileSignature,
  CalendarDays,
  Files,
  BookOpen,
  Sparkles,
  BarChart3,
  LineChart,
  UsersRound,
  DollarSign,
  Heart,
  Target,
  Briefcase,
  ShieldAlert,
  Gauge,
  Brain,
  MousePointerClick,
  TrendingUp,
  GitBranch,
  Zap,
  Plug,
  Cpu,
  Cable,
  Crosshair,
  Workflow,
  Webhook,
  Building,
  KeyRound,
  Network,
  CreditCard,
  ShieldCheck,
  ScrollText,
  Key,
  Settings,
  BellRing,
  SlidersHorizontal,
  Palette,
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ChevronLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS, BOTTOM_NAV, type NavItem, type NavSection } from "@/data/dashboard-config";
import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "layout-dashboard": LayoutDashboard,
  radio: Radio,
  bot: Bot,
  bell: Bell,
  activity: Activity,
  users: Users,
  handshake: Handshake,
  "check-square": CheckSquare,
  "folder-kanban": FolderKanban,
  headphones: Headphones,
  "file-text": FileText,
  "building-2": Building2,
  "file-signature": FileSignature,
  "calendar-days": CalendarDays,
  files: Files,
  "book-open": BookOpen,
  sparkles: Sparkles,
  "bar-chart-3": BarChart3,
  "line-chart": LineChart,
  "users-round": UsersRound,
  "dollar-sign": DollarSign,
  heart: Heart,
  target: Target,
  briefcase: Briefcase,
  "shield-alert": ShieldAlert,
  gauge: Gauge,
  brain: Brain,
  "mouse-pointer-click": MousePointerClick,
  "trending-up": TrendingUp,
  "git-branch": GitBranch,
  zap: Zap,
  plug: Plug,
  cpu: Cpu,
  cable: Cable,
  crosshair: Crosshair,
  workflow: Workflow,
  webhook: Webhook,
  building: Building,
  "key-round": KeyRound,
  network: Network,
  "credit-card": CreditCard,
  "shield-check": ShieldCheck,
  "scroll-text": ScrollText,
  key: Key,
  settings: Settings,
  "bell-ring": BellRing,
  sliders: SlidersHorizontal,
  palette: Palette,
  "help-circle": HelpCircle,
  "message-square": MessageSquare,
};

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (pathname === href) return true;
  return pathname.startsWith(href + "/");
}

interface NavLinkProps {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  intelligence?: boolean;
  onNavigate?: () => void;
}

function NavLink({ item, collapsed, active, intelligence, onNavigate }: NavLinkProps) {
  const Icon = ICON_MAP[item.icon] || LayoutDashboard;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-gradient-to-r from-indigo-600/40 to-purple-600/30 text-white shadow-inner"
          : intelligence
            ? "text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-100"
            : "text-slate-400 hover:bg-sidebar-hover hover:text-white",
        collapsed && "justify-center px-2"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
      )}
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          active
            ? "text-purple-200 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]"
            : intelligence
              ? "group-hover:text-indigo-300"
              : ""
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.ai && (
            <span
              aria-hidden
              className="relative h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.7)]"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 live-pulse" />
            </span>
          )}
          {item.badge != null && (
            <span className="rounded-full bg-purple-500 px-1.5 py-0.5 text-[10px] font-bold leading-none">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

interface SectionProps {
  section: NavSection;
  pathname: string;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

function Section({ section, pathname, collapsed, expanded, onToggle, onNavigate }: SectionProps) {
  const activeItem = section.items.some((i) => isActiveRoute(pathname, i.href));
  const isIntelligence = section.accent === "intelligence";

  if (collapsed) {
    return (
      <div className="mt-4 first:mt-0 border-t border-white/[0.04] pt-4 first:border-t-0 first:pt-0">
        <ul className="space-y-0.5">
          {section.items.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                collapsed
                active={isActiveRoute(pathname, item.href)}
                intelligence={isIntelligence}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-6 first:mt-0">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "group/header mb-2 flex w-full items-center justify-between rounded-lg px-3 py-1 text-[10px] font-semibold tracking-[0.14em] transition-colors",
          activeItem
            ? "text-slate-200"
            : isIntelligence
              ? "text-indigo-300/80 hover:text-indigo-200"
              : "text-slate-500 hover:text-slate-300"
        )}
        aria-expanded={expanded}
        aria-controls={`section-${section.id}`}
      >
        <span className="flex items-center gap-1.5">
          {isIntelligence && (
            <Sparkles className="h-3 w-3 text-indigo-300/90 drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
          )}
          {section.label}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded-full bg-white/[0.04] px-1.5 py-px text-[9px] font-medium tabular-nums text-slate-500 group-hover/header:text-slate-400">
            {section.items.length}
          </span>
          <ChevronDown
            className={cn(
              "h-3 w-3 shrink-0 text-slate-500 transition-transform duration-200 group-hover/header:text-slate-300",
              !expanded && "-rotate-90"
            )}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            id={`section-${section.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-0.5 overflow-hidden"
          >
            {section.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  collapsed={false}
                  active={isActiveRoute(pathname, item.href)}
                  intelligence={isIntelligence}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const {
    sidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    toggleSidebar,
    expandedSections,
    toggleSection,
    setSectionExpanded,
  } = useUiStore();

  useEffect(() => {
    const activeSection = NAV_SECTIONS.find((s) =>
      s.items.some((i) => isActiveRoute(pathname, i.href))
    );
    if (activeSection && !expandedSections[activeSection.id]) {
      setSectionExpanded(activeSection.id, true);
    }
  }, [pathname, expandedSections, setSectionExpanded]);

  const handleNavigate = () => setMobileMenuOpen(false);

  const content = (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar text-white shadow-sidebar",
        sidebarCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div
        className={cn(
          "relative flex items-center gap-3 border-b border-white/5 p-5",
          sidebarCollapsed && "justify-center px-3"
        )}
      >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-lg font-bold shadow-[0_0_20px_rgba(99,102,241,0.35)]">
          A
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)] live-pulse" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-wide">AETHER OS</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
              AI Operating System
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <Section
            key={section.id}
            section={section}
            pathname={pathname}
            collapsed={sidebarCollapsed}
            expanded={expandedSections[section.id] ?? section.defaultOpen ?? false}
            onToggle={() => toggleSection(section.id)}
            onNavigate={handleNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-white/5 p-3">
        <ul className="space-y-0.5">
          {BOTTOM_NAV.map((item) => {
            const Icon = ICON_MAP[item.icon] || HelpCircle;
            const active = isActiveRoute(pathname, item.href);
            const isStatus = item.href === "/status";
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleNavigate}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                    active
                      ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white"
                      : "text-slate-400 hover:bg-sidebar-hover hover:text-white",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {isStatus && (
                        <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)] live-pulse" />
                          Operational
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <Button
          variant="ghost"
          size="icon"
          className="mt-2 hidden w-full text-slate-400 hover:text-white lg:flex"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")}
          />
        </Button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden shrink-0 lg:block">{content}</div>
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
                  aria-label="Close menu"
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
