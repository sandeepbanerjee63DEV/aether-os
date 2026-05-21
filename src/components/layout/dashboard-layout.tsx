"use client";

import { Sidebar } from "./sidebar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AetherAiCommand } from "@/components/intelligence/aether-ai-command";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { AddDealDialog } from "@/components/deals/add-deal-dialog";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <div className="flex min-h-screen bg-workspace">
          <Sidebar />
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
          <AetherAiCommand />
          <AddLeadDialog />
          <AddDealDialog />
        </div>
      </AuthProvider>
    </QueryProvider>
  );
}
