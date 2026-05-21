"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Bell,
  Mail,
  Menu,
  Plus,
  ChevronDown,
  MoreHorizontal,
  LogOut,
  UserCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";

interface NavbarProps {
  title: string;
  subtitle?: string;
  badge?: string;
  showAddLead?: boolean;
  showAddDeal?: boolean;
}

export function Navbar({ title, subtitle, badge, showAddLead, showAddDeal }: NavbarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setMobileMenuOpen, setAddLeadDialogOpen, setAddDealDialogOpen } = useUiStore();
  const { user, setUser } = useAuthStore();
  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications").then((r) => r.json()),
  });
  const unreadCount = (notifData?.notifications ?? []).filter((n: { read: boolean }) => !n.read).length;

  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore — proceed to client cleanup anyway */
    }
    setUser(null);
    queryClient.clear();
    setMenuOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100/80 bg-workspace/95 backdrop-blur-md">
      <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="mt-0.5 lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">{title}</h1>
                {badge && <Badge variant="pipeline">{badge}</Badge>}
              </div>
              {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
          </div>

          <div className="hidden flex-1 items-center justify-center px-8 md:flex max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search anything..."
                className="h-10 rounded-2xl border-slate-200 bg-white pl-10 pr-20 shadow-sm"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">
                Cmd+K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <Button variant="ghost" size="icon" className="relative hidden sm:flex">
              <Bell className="h-5 w-5 text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Mail className="h-5 w-5 text-slate-500" />
            </Button>
            <div className="relative hidden sm:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-slate-50"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar || undefined} />
                  <AvatarFallback>{user?.name?.[0] || "A"}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left lg:block">
                  <p className="text-sm font-semibold text-slate-900">{user?.name || "User"}</p>
                  <p className="text-xs text-slate-500">{user?.title || user?.role || ""}</p>
                </div>
                <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 lg:block" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl"
                >
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user?.name || "Signed in"}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user?.email || ""}</p>
                    {user?.role && (
                      <Badge variant="purple" className="mt-2 text-[10px]">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/settings");
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <UserCircle className="h-4 w-4 text-slate-400" />
                      Profile &amp; settings
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      <LogOut className="h-4 w-4" />
                      {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {showAddLead && (
              <>
                <Button className="sm:hidden" size="icon" onClick={() => setAddLeadDialogOpen(true)} aria-label="Add lead">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button className="hidden sm:inline-flex" onClick={() => setAddLeadDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Lead
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </Button>
              </>
            )}
            {showAddDeal && (
              <>
                <Button className="sm:hidden" size="icon" onClick={() => setAddDealDialogOpen(true)} aria-label="Add deal">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button className="hidden sm:inline-flex" onClick={() => setAddDealDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Deal
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </Button>
              </>
            )}
            <Button variant="secondary" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
