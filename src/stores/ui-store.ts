import { create } from "zustand";

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
}));
