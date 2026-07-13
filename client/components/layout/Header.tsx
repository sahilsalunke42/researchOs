'use client';

import { Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  userName?: string;
  onLogout(): void;
}

export function Header({ userName, onLogout }: HeaderProps) {
  return (
    <header className="h-12 flex items-center gap-4 px-4 border-b border-border bg-bg-surface">
      <div className="flex items-center gap-2 font-semibold">
        <span className="h-2 w-2 rounded-full bg-accent" />
        ResearchOS
      </div>
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-1 rounded-md border border-border text-sm text-text-muted hover:bg-bg-subtle"
        aria-label="Open command palette"
      >
        <Search size={14} aria-hidden />
        <span>Search</span>
        <kbd className="ml-2 text-xs">⌘K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-3">
        {userName && <span className="text-sm text-text-muted">{userName}</span>}
        <Button variant="ghost" size="sm" onClick={onLogout} aria-label="Log out">
          <User size={16} className="mr-1" /> Log out
        </Button>
      </div>
    </header>
  );
}
