'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, FileText, Library, Settings } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

const WORKSPACE_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/library', label: 'Library', icon: Library }
];

const SYSTEM_NAV = [
  { href: '/settings', label: 'Settings', icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <aside
      className={cn(
        'shrink-0 border-r border-slate-800 bg-slate-900 transition-[width] duration-200 ease-in-out select-none h-full overflow-y-auto shadow-md',
        collapsed ? 'w-16' : 'w-[230px]'
      )}
      aria-label="Primary navigation"
    >
      <div className="flex flex-col justify-between h-full py-5 space-y-6">
        {/* WORKSPACE SECTION */}
        <div className="space-y-1.5">
          {!collapsed && (
            <p className="px-4 text-[10.5px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Workspace
            </p>
          )}
          <nav className="space-y-1 px-2.5">
            {WORKSPACE_NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13px] transition-all duration-200 ease-in-out group',
                    active
                      ? 'bg-accent text-white font-bold shadow-md shadow-accent/25 border-l-4 border-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 font-medium'
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={18} className={cn(active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')} aria-hidden />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* SYSTEM SECTION */}
        <div className="space-y-1.5">
          {!collapsed && (
            <p className="px-4 text-[10.5px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              System
            </p>
          )}
          <nav className="space-y-1 px-2.5">
            {SYSTEM_NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/settings' && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13px] transition-all duration-200 ease-in-out group',
                    active
                      ? 'bg-accent text-white font-bold shadow-md shadow-accent/25 border-l-4 border-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 font-medium'
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={18} className={cn(active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')} aria-hidden />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
