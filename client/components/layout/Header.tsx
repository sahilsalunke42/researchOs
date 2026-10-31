'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Moon, Sun, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommandPalette } from './CommandPalette';

interface HeaderProps {
  userName?: string;
  onLogout(): void;
}

export function Header({ userName, onLogout }: HeaderProps) {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);

  useEffect(() => {
    const isDarkTheme =
      document.documentElement.classList.contains('dark') ||
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  function toggleTheme() {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  return (
    <>
      <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-border bg-bg-surface select-none">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-sm tracking-tight text-text-primary hover:opacity-90">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span>ResearchOS</span>
          </Link>

          <span className="text-border hidden sm:inline">|</span>

          {/* Quick Search / Command Palette Trigger */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 h-7 px-2.5 rounded border border-border text-xs text-text-muted hover:text-text-primary hover:border-text-muted/40 bg-bg-base transition-colors"
            aria-label="Open command palette"
          >
            <Search className="h-3 w-3 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Search workspace...</span>
            <span className="sm:hidden">Search</span>
            <kbd className="ml-1 px-1 py-0.2 rounded bg-bg-subtle text-[10px] font-mono text-text-muted border border-border">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {userName && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-xs text-text-muted font-mono">
              <User className="h-3 w-3 text-text-muted" />
              <span className="truncate max-w-[120px]">{userName}</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="h-8 w-8 p-0 text-text-muted hover:text-text-primary"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="h-8 px-2.5 text-xs text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5 mr-1 sm:inline" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
