"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Users } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MembersFilters } from "@/components/team/members/members-filters";
import { MembersTable } from "@/components/team/members/members-table";
import { InviteMemberDialog } from "@/components/team/members/invite-member-dialog";
import { MemberProfileDrawer } from "@/components/team/members/member-profile-drawer";
import { useTeamStore } from "@/stores/team-store";
import { useRealtime } from "@/hooks/use-realtime";

interface DepartmentLite {
  id: string;
  name: string;
}

export default function TeamMembersPage() {
  useRealtime("team");
  const { setInviteDialogOpen } = useTeamStore();

  const { data: deptData } = useQuery<{ departments: DepartmentLite[] }>({
    queryKey: ["team-departments-mini"],
    queryFn: async () => {
      const res = await fetch("/api/team/departments");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <>
      <Navbar
        title="Team Members"
        subtitle="Enterprise workforce directory with AI-assisted role provisioning."
        badge="DIRECTORY"
      />

      <div className="flex-1 space-y-4 px-4 pb-28 pt-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100/60 bg-gradient-to-r from-indigo-50/40 via-white to-purple-50/30 px-4 py-2.5 glass-card"
        >
          <div className="flex items-center gap-3">
            <Badge variant="purple" className="gap-1">
              <Users className="h-3 w-3" />
              Member Directory
            </Badge>
            <span className="hidden text-xs text-slate-500 sm:inline">
              Search, filter, manage roles, and route assignments at scale.
            </span>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Invite member
          </Button>
        </motion.div>

        <MembersFilters departments={deptData?.departments ?? []} />

        <MembersTable />
      </div>

      <InviteMemberDialog />
      <MemberProfileDrawer />
    </>
  );
}
