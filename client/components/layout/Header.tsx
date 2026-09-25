'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Search, LogOut, User as UserIcon, Settings, ChevronDown, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  userName?: string;
  onLogout(): void;
}

export function Header({ userName = 'Gaurav Rajendra Patil', onLogout }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayUser = userName || 'Gaurav Rajendra Patil';
  const initial = displayUser.charAt(0).toUpperCase();

  return (
    <header className="h-14 flex items-center justify-between gap-4 px-6 border-b border-slate-200/90 bg-white shadow-2xs sticky top-0 z-40">
      {/* Left Brand Header */}
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group focus:outline-none">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">ResearchOS</span>
            <span className="text-[8.5px] uppercase font-semibold text-accent tracking-[0.08em] mt-0.5">AI Research Intelligence</span>
          </div>
        </Link>
      </div>

      {/* Right User Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/20"
          aria-expanded={dropdownOpen}
          aria-label="User Profile Menu"
        >
          <div className="w-6 h-6 rounded-full bg-accent text-white font-bold text-xs flex items-center justify-center shadow-2xs">
            {initial}
          </div>
          <span className="text-xs font-bold text-slate-800 hidden md:inline-block max-w-[140px] truncate">
            {displayUser}
          </span>
          <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-accent' : ''}`} />
        </button>

        {/* Clickable Profile Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-lg py-2 text-xs animate-fade-in-up z-50 divide-y divide-slate-100">
            {/* User Details Header */}
            <div className="px-4 py-3 space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-accent text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {initial}
                </div>
                <div className="truncate">
                  <p className="font-bold text-slate-900 truncate">{displayUser}</p>
                  <p className="text-[11px] text-slate-500 truncate">gaurav.patil@researchos.ai</p>
                </div>
              </div>
              <div className="pt-1 flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-accent text-[10px] font-bold">
                  Pro AI Research Tier
                </span>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Active
                </span>
              </div>
            </div>

            {/* Menu Links */}
            <div className="py-1">
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-accent font-medium transition-colors"
              >
                <UserIcon size={14} className="text-slate-400" />
                <span>Profile</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-accent font-medium transition-colors"
              >
                <Settings size={14} className="text-slate-400" />
                <span>Settings & Preferences</span>
              </Link>
            </div>

            {/* Logout Action */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 font-semibold transition-colors text-left"
              >
                <LogOut size={14} className="text-red-500" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
