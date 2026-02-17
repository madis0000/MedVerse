import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  openGroups: string[];
  toggle: () => void;
  toggleGroup: (path: string) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isCollapsed: false,
      openGroups: [],
      toggle: () => set({ isCollapsed: !get().isCollapsed }),
      toggleGroup: (path: string) => {
        const groups = get().openGroups;
        set({
          openGroups: groups.includes(path)
            ? groups.filter((g) => g !== path)
            : [...groups, path],
        });
      },
    }),
    { name: 'medpulse-sidebar' },
  ),
);
