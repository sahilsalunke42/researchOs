import React from 'react';
import Link from 'next/link';
import { BookOpen, Search, GitCompare, Sparkles, FileText, Network, Layers, Lightbulb } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-slate-900 selection:bg-accent/10 selection:text-accent font-sans flex flex-col justify-between overflow-x-hidden">

      {/* Full-Screen Two-Column Main Workspace */}
      <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 items-center relative">

        {/* LEFT COLUMN (~55% width): Brand, Statement, 3 Feature Items, & Paper Graph Visual */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-16 xl:p-20 relative bg-slate-50/50 border-r border-slate-200/60 min-h-[50vh] lg:min-h-screen">

          {/* Subtle Radial Glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-70"
            style={{
              background: 'radial-gradient(circle at 15% 20%, rgba(79, 70, 229, 0.08), transparent 45%), radial-gradient(circle at 75% 80%, rgba(99, 102, 241, 0.05), transparent 40%)'
            }}
          />

          {/* Top Brand Header */}
          <div className="relative z-10 animate-in fade-in-50 slide-in-from-left-4 duration-500">
            <Link href="/" className="inline-flex items-center gap-3 group focus:outline-none">
              <div className="h-10 w-10 rounded-[10px] bg-accent flex items-center justify-center text-white shadow-md shadow-accent/25 group-hover:scale-105 transition-transform duration-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">ResearchOS</span>
                <span className="text-[9.5px] uppercase font-semibold text-accent tracking-[0.08em] mt-1">AI Research Intelligence</span>
              </div>
            </Link>
          </div>

          {/* Center Brand Statement & Compact Feature Items */}
          <div className="relative z-10 my-8 lg:my-auto space-y-8 max-w-xl animate-in fade-in-50 slide-in-from-left-4 duration-700">

            {/* Main Heading & Short Paragraph */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]">
                Understand the research. <br />
                <span className="text-accent">Find what is missing.</span>
              </h1>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg">
                Move from large collections of research papers to structured, evidence-backed understanding.
              </p>
            </div>

            {/* 3 Compact Feature Items */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3.5 group">
                <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-accent shrink-0 mt-0.5 group-hover:bg-accent group-hover:text-white transition-colors duration-200">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Discover relevant papers</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Search and retrieve studies that matter across literature.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 group">
                <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-accent shrink-0 mt-0.5 group-hover:bg-accent group-hover:text-white transition-colors duration-200">
                  <GitCompare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Compare evidence</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Connect methods, datasets, findings, and limitations.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 group">
                <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-accent shrink-0 mt-0.5 group-hover:bg-accent group-hover:text-white transition-colors duration-200">
                  <Sparkles className="w-4 h-4 text-accent group-hover:text-white" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Identify research gaps</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Surface underexplored questions backed by evidence.</p>
                </div>
              </div>
            </div>

            {/* Subtle Interactive Research Paper Network Visual */}
            <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-sm relative overflow-hidden hidden sm:block">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pb-3 border-b border-slate-100 mb-4">
                <span className="flex items-center gap-1.5 text-accent font-semibold">
                  <Network className="w-3.5 h-3.5 animate-pulse" /> Literature Knowledge Graph
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-sans font-medium">Vector RAG</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-accent/40 transition-colors">
                  <FileText className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-800">Primary Paper</p>
                  <p className="text-[10px] text-slate-400">Methodology</p>
                </div>

                <div className="p-3 rounded-xl bg-accent-light border border-accent/20 text-accent relative">
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
                  <Layers className="w-4 h-4 text-accent mx-auto mb-1" />
                  <p className="text-xs font-bold text-accent">AI Synthesis</p>
                  <p className="text-[10px] text-accent/70">Cross-Evidence</p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900">
                  <Lightbulb className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-amber-900">Research Gap</p>
                  <p className="text-[10px] text-amber-600 font-medium">Open Opportunity</p>
                </div>
              </div>
            </div>

          </div>



        </div>

        {/* RIGHT COLUMN (~45% width): Centered 420-460px Auth Card */}
        <div className="lg:col-span-5 xl:col-span-5 flex items-center justify-center p-6 sm:p-10 lg:p-12 min-h-[50vh] lg:min-h-screen bg-white lg:bg-transparent">

          <div className="w-full max-w-[440px] bg-white border border-slate-200/90 rounded-[20px] shadow-[0_20px_60px_rgba(15,23,42,0.08)] overflow-hidden animate-in fade-in-50 slide-in-from-right-4 duration-500">
            {/* Thin 2px Indigo Top Accent Line */}
            <div className="h-0.5 w-full bg-accent" />

            {/* Auth Card Inner Body */}
            <div className="p-7 sm:p-9">
              {children}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
