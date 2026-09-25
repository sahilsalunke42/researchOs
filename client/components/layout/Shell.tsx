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
    <div className="h-screen overflow-hidden flex flex-col bg-bg-base">
      <Header userName={userName} onLogout={onLogout} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-h-0 overflow-y-auto bg-slate-50/60">
          <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
