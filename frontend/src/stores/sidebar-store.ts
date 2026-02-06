import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isCollapsed: false,
      toggle: () => set({ isCollapsed: !get().isCollapsed }),
    }),
    { name: 'medpulse-sidebar' },
  ),
);
