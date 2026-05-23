import { create } from "zustand";

export type LeadStatusFilter =
  | "ALL"
  | "HOT"
  | "WARM"
  | "AI_CLASSIFIED"
  | "ASSIGNED"
  | "FOLLOW_UP"
  | "NURTURING";

export type LeadSort = "recent" | "score" | "name" | "probability";

interface UiState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  selectedLeadId: string | null;
  selectedDealId: string | null;
  searchOpen: boolean;
  aetherAiOpen: boolean;
  aetherAiExpanded: boolean;
  addLeadDialogOpen: boolean;
  addDealDialogOpen: boolean;
  leadStatusFilter: LeadStatusFilter;
  leadSearch: string;
  leadSort: LeadSort;
  leadMinScore: number;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSelectedLeadId: (id: string | null) => void;
  setSelectedDealId: (id: string | null) => void;
  setSearchOpen: (open: boolean) => void;
  setAetherAiOpen: (open: boolean) => void;
  toggleAetherAi: () => void;
  setAetherAiExpanded: (expanded: boolean) => void;
  setAddLeadDialogOpen: (open: boolean) => void;
  setAddDealDialogOpen: (open: boolean) => void;
  setLeadStatusFilter: (filter: LeadStatusFilter) => void;
  setLeadSearch: (search: string) => void;
  setLeadSort: (sort: LeadSort) => void;
  setLeadMinScore: (score: number) => void;
  resetLeadFilters: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  selectedLeadId: null,
  selectedDealId: null,
  searchOpen: false,
  aetherAiOpen: true,
  aetherAiExpanded: false,
  addLeadDialogOpen: false,
  addDealDialogOpen: false,
  leadStatusFilter: "ALL",
  leadSearch: "",
  leadSort: "recent",
  leadMinScore: 0,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setSelectedLeadId: (id) => set({ selectedLeadId: id }),
  setSelectedDealId: (id) => set({ selectedDealId: id }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setAetherAiOpen: (open) => set({ aetherAiOpen: open }),
  toggleAetherAi: () => set((s) => ({ aetherAiOpen: !s.aetherAiOpen })),
  setAetherAiExpanded: (expanded) => set({ aetherAiExpanded: expanded }),
  setAddLeadDialogOpen: (open) => set({ addLeadDialogOpen: open }),
  setAddDealDialogOpen: (open) => set({ addDealDialogOpen: open }),
  setLeadStatusFilter: (filter) => set({ leadStatusFilter: filter }),
  setLeadSearch: (search) => set({ leadSearch: search }),
  setLeadSort: (sort) => set({ leadSort: sort }),
  setLeadMinScore: (score) => set({ leadMinScore: score }),
  resetLeadFilters: () =>
    set({
      leadStatusFilter: "ALL",
      leadSearch: "",
      leadSort: "recent",
      leadMinScore: 0,
    }),
}));
