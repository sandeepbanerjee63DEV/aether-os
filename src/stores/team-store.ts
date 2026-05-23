import { create } from "zustand";

export type MemberStatusFilter =
  | "ALL"
  | "ACTIVE"
  | "AWAY"
  | "SUSPENDED"
  | "PENDING_INVITE"
  | "INACTIVE";

export type MemberRoleFilter =
  | "ALL"
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "SALES"
  | "SUPPORT"
  | "VIEWER";

export type MemberSort = "recent" | "name" | "workload" | "score";

export type AssignmentStatusFilter = "ALL" | "ACTIVE" | "REASSIGNED" | "COMPLETED" | "ESCALATED" | "CANCELLED";
export type AssignmentEntityFilter = "ALL" | "LEAD" | "DEAL" | "TASK" | "PROJECT" | "WORKFLOW" | "SUPPORT_TICKET";

interface TeamUiState {
  selectedMemberId: string | null;
  inviteDialogOpen: boolean;
  roleEditorOpen: boolean;
  editingRoleId: string | null;
  memberSearch: string;
  memberStatusFilter: MemberStatusFilter;
  memberRoleFilter: MemberRoleFilter;
  memberDepartmentFilter: string | "ALL";
  memberSort: MemberSort;
  selectedMemberIds: string[];
  assignmentStatusFilter: AssignmentStatusFilter;
  assignmentEntityFilter: AssignmentEntityFilter;
  setSelectedMemberId: (id: string | null) => void;
  setInviteDialogOpen: (open: boolean) => void;
  setRoleEditorOpen: (open: boolean) => void;
  setEditingRoleId: (id: string | null) => void;
  setMemberSearch: (q: string) => void;
  setMemberStatusFilter: (f: MemberStatusFilter) => void;
  setMemberRoleFilter: (f: MemberRoleFilter) => void;
  setMemberDepartmentFilter: (d: string | "ALL") => void;
  setMemberSort: (s: MemberSort) => void;
  toggleMemberSelected: (id: string) => void;
  clearMemberSelection: () => void;
  setAssignmentStatusFilter: (f: AssignmentStatusFilter) => void;
  setAssignmentEntityFilter: (f: AssignmentEntityFilter) => void;
  resetFilters: () => void;
}

export const useTeamStore = create<TeamUiState>((set) => ({
  selectedMemberId: null,
  inviteDialogOpen: false,
  roleEditorOpen: false,
  editingRoleId: null,
  memberSearch: "",
  memberStatusFilter: "ALL",
  memberRoleFilter: "ALL",
  memberDepartmentFilter: "ALL",
  memberSort: "recent",
  selectedMemberIds: [],
  assignmentStatusFilter: "ACTIVE",
  assignmentEntityFilter: "ALL",
  setSelectedMemberId: (id) => set({ selectedMemberId: id }),
  setInviteDialogOpen: (open) => set({ inviteDialogOpen: open }),
  setRoleEditorOpen: (open) => set({ roleEditorOpen: open }),
  setEditingRoleId: (id) => set({ editingRoleId: id }),
  setMemberSearch: (q) => set({ memberSearch: q }),
  setMemberStatusFilter: (f) => set({ memberStatusFilter: f }),
  setMemberRoleFilter: (f) => set({ memberRoleFilter: f }),
  setMemberDepartmentFilter: (d) => set({ memberDepartmentFilter: d }),
  setMemberSort: (s) => set({ memberSort: s }),
  toggleMemberSelected: (id) =>
    set((s) => ({
      selectedMemberIds: s.selectedMemberIds.includes(id)
        ? s.selectedMemberIds.filter((x) => x !== id)
        : [...s.selectedMemberIds, id],
    })),
  clearMemberSelection: () => set({ selectedMemberIds: [] }),
  setAssignmentStatusFilter: (f) => set({ assignmentStatusFilter: f }),
  setAssignmentEntityFilter: (f) => set({ assignmentEntityFilter: f }),
  resetFilters: () =>
    set({
      memberSearch: "",
      memberStatusFilter: "ALL",
      memberRoleFilter: "ALL",
      memberDepartmentFilter: "ALL",
      memberSort: "recent",
    }),
}));
