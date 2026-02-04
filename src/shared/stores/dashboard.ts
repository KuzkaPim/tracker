import { create } from 'zustand';

interface DashboardState {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
}));
