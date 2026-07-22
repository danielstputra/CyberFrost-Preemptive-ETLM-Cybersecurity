import { create } from 'zustand';

type SidebarState = 'expanded' | 'collapsed';

interface UiState {
  sidebar: SidebarState;
  theme: 'light' | 'dark';
  notificationCount: number;

  toggleSidebar: () => void;
  setSidebar: (state: SidebarState) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setNotificationCount: (count: number) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebar: 'expanded',
  theme: 'light',
  notificationCount: 0,

  toggleSidebar: () => set((s) => ({ sidebar: s.sidebar === 'expanded' ? 'collapsed' : 'expanded' })),
  setSidebar: (sidebar) => set({ sidebar }),
  setTheme: (theme) => set({ theme }),
  setNotificationCount: (notificationCount) => set({ notificationCount }),
}));
