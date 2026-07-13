import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/store/ui.store';

describe('ui store', () => {
  beforeEach(() => {
    localStorage.clear();
    useUIStore.setState({ sidebarCollapsed: false });
  });

  it('toggles sidebar', () => {
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });

  it('persists to localStorage', () => {
    useUIStore.getState().setSidebarCollapsed(true);
    expect(localStorage.getItem('ros.ui.sidebar')).toBe('true');
  });
});
