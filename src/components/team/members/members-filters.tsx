"use client";

import { Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTeamStore } from "@/stores/team-store";

interface MembersFiltersProps {
  departments: { id: string; name: string }[];
}

export function MembersFilters({ departments }: MembersFiltersProps) {
  const {
    memberSearch,
    memberStatusFilter,
    memberRoleFilter,
    memberDepartmentFilter,
    memberSort,
    setMemberSearch,
    setMemberStatusFilter,
    setMemberRoleFilter,
    setMemberDepartmentFilter,
    setMemberSort,
    resetFilters,
  } = useTeamStore();

  const isFiltered =
    memberSearch !== "" ||
    memberStatusFilter !== "ALL" ||
    memberRoleFilter !== "ALL" ||
    memberDepartmentFilter !== "ALL" ||
    memberSort !== "recent";

  return (
    <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-100/80 bg-white p-3 shadow-card md:grid-cols-12">
      <div className="relative md:col-span-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by name, email, or title…"
          className="h-9 rounded-xl border-slate-200 pl-9 text-sm"
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
        />
      </div>
      <div className="md:col-span-2">
        <Select
          size="sm"
          className="h-9"
          value={memberStatusFilter}
          onChange={(e) => setMemberStatusFilter(e.target.value as typeof memberStatusFilter)}
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="AWAY">Away</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="PENDING_INVITE">Pending</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </div>
      <div className="md:col-span-2">
        <Select
          size="sm"
          className="h-9"
          value={memberRoleFilter}
          onChange={(e) => setMemberRoleFilter(e.target.value as typeof memberRoleFilter)}
        >
          <option value="ALL">All roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="SALES">Sales</option>
          <option value="SUPPORT">Support</option>
          <option value="VIEWER">Viewer</option>
        </Select>
      </div>
      <div className="md:col-span-2">
        <Select
          size="sm"
          className="h-9"
          value={memberDepartmentFilter}
          onChange={(e) => setMemberDepartmentFilter(e.target.value as string | "ALL")}
        >
          <option value="ALL">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex gap-2 md:col-span-2">
        <Select
          size="sm"
          className="h-9 flex-1"
          value={memberSort}
          onChange={(e) => setMemberSort(e.target.value as typeof memberSort)}
        >
          <option value="recent">Recent</option>
          <option value="name">Name</option>
          <option value="workload">Workload</option>
          <option value="score">Ops Score</option>
        </Select>
        {isFiltered && (
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={resetFilters} title="Reset filters">
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
