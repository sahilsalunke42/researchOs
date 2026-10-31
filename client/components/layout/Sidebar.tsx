'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, FileText, Library, Settings, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/settings', label: 'Settings', icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        'shrink-0 border-r border-border bg-bg-surface transition-[width] duration-200 ease-snap flex flex-col justify-between select-none',
        collapsed ? 'w-14' : 'w-[200px]'
      )}
      aria-label="Primary navigation"
    >
      <div className="py-2">
        <nav className="space-y-0.5 px-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-colors',
                  active
                    ? 'bg-bg-subtle text-text-primary font-medium'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-subtle/60'
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-accent' : 'text-text-muted')} aria-hidden />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-2 border-t border-border space-y-1">
        <button
          type="button"
          onClick={toggleSidebar}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-colors"
          title={collapsed ? 'Expand sidebar (⌘\\)' : 'Collapse sidebar (⌘\\)'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="flex items-center gap-2">
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </div>
          {!collapsed && <kbd className="text-[10px] font-mono text-text-muted">⌘\</kbd>}
        </button>

        {!collapsed && (
          <div className="px-2.5 pt-1">
            <Link
              href="/privacy"
              className="text-[11px] text-text-muted hover:text-text-primary transition-colors block"
            >
              Privacy Policy
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
