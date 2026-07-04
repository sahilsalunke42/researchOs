import { create } from 'zustand';

const KEY = 'ros.ui.sidebar';

function initial(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY) === 'true';
}

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar(): void;
  setSidebarCollapsed(v: boolean): void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: initial(),
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    if (typeof window !== 'undefined') localStorage.setItem(KEY, String(next));
    set({ sidebarCollapsed: next });
  },
  setSidebarCollapsed: (v) => {
    if (typeof window !== 'undefined') localStorage.setItem(KEY, String(v));
    set({ sidebarCollapsed: v });
  }
}));
