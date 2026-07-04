'use client';

import { useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/store/ui.store';

interface ShellProps {
  userName?: string;
  onLogout(): void;
  children: React.ReactNode;
}

export function Shell({ userName, onLogout, children }: ShellProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        toggleSidebar();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar]);

  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
      <Header userName={userName} onLogout={onLogout} />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1100px] mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
