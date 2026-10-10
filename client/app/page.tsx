'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  GitCompare,
  Sparkles,
  ArrowRight,
  FileText,
  Network,
  Layers,
  Lightbulb,
  CheckCircle2,
  Database,
  Cpu,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  LayoutDashboard,
  Filter,
  FileSearch,
  Zap,
  Download,
  Share2,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import type { UserDTO } from '@/types/api.types';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [sampleQuery, setSampleQuery] = useState('Quantum Machine Learning in Drug Discovery');
  const [activePipelineStage, setActivePipelineStage] = useState(0);

  // Animated Count-Up Statistics State
  const [metricPapersCount, setMetricPapersCount] = useState(0);
  const [metricDimCount, setMetricDimCount] = useState(0);
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    getSession()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoadingAuth(false));

    // Smooth count-up animation for stats on page load
    setStatsLoaded(true);
    let papersStep = 0;
    let dimStep = 0;

    const timer = setInterval(() => {
      papersStep += 5;
      dimStep += 38;

      if (papersStep >= 200) {
        setMetricPapersCount(200);
      } else {
        setMetricPapersCount(papersStep);
      }

      if (dimStep >= 1536) {
        setMetricDimCount(1536);
      } else {
        setMetricDimCount(dimStep);
      }

      if (papersStep >= 200 && dimStep >= 1536) {
        clearInterval(timer);
      }
    }, 20);

    return () => clearInterval(timer);
  }, []);

  const authTarget = user ? '/dashboard' : '/register';

  const pipelineStages = [
    {
      title: "1. Multi-Source Paper Discovery",
      badge: "arXiv & Semantic Scholar",
      desc: "Connect directly to open-access research repositories. ResearchOS queries, filters, and retrieves top relevant studies based on semantic relevance.",
      metrics: "Over 200M+ indexed research papers",
      icon: Search
    },
    {
      title: "2. PDF Ingestion & Parsing",
      badge: "Full-Text Extraction",
      desc: "Automatically parses complex academic PDF structures—extracting abstract, methodology, experimental results, figures, and citations into clean text chunks.",
      metrics: "Sub-second PDF structure parsing",
      icon: Cpu
    },
    {
      title: "3. Vector RAG Embedding",
      badge: "Qdrant Vector Database",
      desc: "Passes extracted chunks through high-dimensional embedding models. Stores 1536-dim vector representations for ultra-fast semantic similarity retrieval.",
      metrics: "0.94+ cosine similarity accuracy",
      icon: Network
    },
    {
      title: "4. Cross-Study Comparison Matrix",
      badge: "Side-by-Side Analysis",
      desc: "Aligns papers into a structured matrix comparing sample sizes, algorithms, performance metrics, and study limitations across all ingested literature.",
      metrics: "Automated comparative schema",
      icon: GitCompare
    },
    {
      title: "5. Automated Gap Surface",
      badge: "AI Pattern Detection",
      desc: "Identifies contradictions, missing baselines, and unexplored research questions where literature evidence remains incomplete or inconclusive.",
      metrics: "Actionable research opportunities",
      icon: Lightbulb
    },
    {
      title: "6. Evidence Synthesis & Report Export",
      badge: "Markdown & PDF Export",
      desc: "Synthesizes cross-paper evidence into a publication-ready Markdown research brief complete with inline citations, executive summaries, and gap matrices.",
      metrics: "One-click literature review output",
      icon: FileText
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-accent/10 selection:text-accent flex flex-col justify-between overflow-x-hidden">

      {/* 1. STICKY NAVBAR */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="h-9 w-9 rounded-[9px] bg-accent flex items-center justify-center text-white shadow-md shadow-accent/20 group-hover:scale-105 transition-transform duration-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">ResearchOS</span>
              <span className="text-[9px] uppercase font-semibold text-accent tracking-[0.08em] mt-0.5">AI Research Intelligence</span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#hero" className="hover:text-accent transition-colors">Home</a>
            <a href="#features" className="hover:text-accent transition-colors">Why ResearchOS</a>
            <a href="#pipeline" className="hover:text-accent transition-colors">Research Pipeline</a>
            <a href="#how-it-works" className="hover:text-accent transition-colors">How It Works</a>
          </nav>

          {/* Dynamic Auth Button (Login vs Dashboard) */}
          <div className="flex items-center gap-3">
            {!loadingAuth && user ? (
              <Link href="/dashboard">
                <Button className="bg-accent hover:bg-accent-hover text-white rounded-lg h-9 px-4 text-xs font-semibold shadow-sm transition-all duration-200">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-xs font-semibold text-slate-700 hover:text-accent px-3 py-2 transition-colors">
                  Sign in
                </Link>
                <Link href="/register">
                  <Button className="bg-accent hover:bg-accent-hover text-white rounded-lg h-9 px-4 text-xs font-semibold shadow-sm transition-all duration-200">
                    Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

        </div>
      </header>

      <main className="flex-1">

        {/* 2. HERO SECTION */}
        <section id="hero" className="relative pt-10 pb-20 lg:pt-16 lg:pb-28 overflow-hidden">
          {/* Background Radial Glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-70"
            style={{
              background: 'radial-gradient(circle at 50% 10%, rgba(79, 70, 229, 0.08), transparent 50%), radial-gradient(circle at 85% 60%, rgba(20, 184, 166, 0.05), transparent 45%)'
            }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

              {/* Left Hero Content */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left animate-fade-in-up">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-accent text-xs font-semibold animate-in fade-in-50 duration-500">
                  <BrainCircuit className="w-4 h-4 text-accent" />
                  <span>Next-Generation AI Research Intelligence Workspace</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
                  Understand the research. <br />
                  <span className="bg-gradient-to-r from-accent via-indigo-600 to-teal-600 bg-clip-text text-transparent">
                    Find what is missing.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                  ResearchOS accelerates academic literature reviews. Automatically discover papers, extract methodologies, compare findings, and surface research gaps with vector RAG.
                </p>

                {/* Live Sample Query Interactive Box */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm max-w-lg mx-auto lg:mx-0 text-left space-y-2.5">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Try a research topic query</span>
                    <span className="text-accent font-medium">Live AI Pipeline</span>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={sampleQuery}
                      onChange={e => setSampleQuery(e.target.value)}
                      className="w-full pl-9 pr-24 h-10 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-accent focus:bg-white transition-all"
                      placeholder="Enter research topic..."
                    />
                    <Link href={authTarget} className="absolute right-1 top-1/2 -translate-y-1/2">
                      <Button size="sm" className="h-8 px-3 text-[11px] bg-accent hover:bg-accent-hover text-white rounded-md">
                        Run Query →
                      </Button>
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 pt-1">
                    <span className="font-semibold text-slate-600">Quick queries:</span>
                    <button
                      onClick={() => setSampleQuery('CRISPR-Cas9 Off-Target Mitigation')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-accent transition-colors"
                    >
                      CRISPR Off-Target
                    </button>
                    <button
                      onClick={() => setSampleQuery('Graph Neural Networks in Material Science')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-accent transition-colors"
                    >
                      GNN Materials
                    </button>
                    <button
                      onClick={() => setSampleQuery('Transformer Attention Mechanism Efficiency')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-accent transition-colors"
                    >
                      Attention Efficiency
                    </button>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-1">
                  <Link href={authTarget} className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto h-12 px-7 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-md shadow-accent/20 transition-all duration-200">
                      Start Research Workspace <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>

                  <a href="#pipeline" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto h-12 px-6 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-all duration-200">
                      See How Pipeline Works
                    </Button>
                  </a>
                </div>

              </div>

              {/* Right Hero Visual (Real SaaS Workspace UI Mockup) */}
              <div className="lg:col-span-6 relative animate-scale-in">
                <div className="relative mx-auto max-w-md lg:max-w-none bg-white rounded-2xl border border-slate-200/90 shadow-[0_25px_70px_rgba(15,23,42,0.1)] overflow-hidden">

                  {/* Top Header Bar */}
                  <div className="h-10 bg-slate-900 px-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="text-[11px] font-mono text-slate-300 ml-2">ResearchOS Workspace / {sampleQuery.slice(0, 22)}…</span>
                    </div>
                    <span className="text-[10px] bg-accent/30 text-accent-light px-2 py-0.5 rounded-full font-mono font-medium border border-accent/40">
                      RAG Active
                    </span>
                  </div>

                  {/* Dashboard Content */}
                  <div className="p-6 space-y-4 bg-slate-50/50">

                    {/* Top Stats Bar */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Papers Ingested</span>
                        <span className="text-base font-bold text-slate-900">24 Studies</span>
                        <span className="text-[9.5px] text-emerald-600 block mt-0.5">arXiv & Scholar</span>
                      </div>

                      <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 shadow-2xs">
                        <span className="text-[10px] font-semibold text-accent/80 uppercase tracking-wide block">Vector Similarity</span>
                        <span className="text-base font-bold text-accent">0.94 Cosine</span>
                        <span className="text-[9.5px] text-accent/70 block mt-0.5">Qdrant Index</span>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 shadow-2xs">
                        <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide block">Gaps Discovered</span>
                        <span className="text-base font-bold text-amber-900">3 Open Gaps</span>
                        <span className="text-[9.5px] text-amber-700 block mt-0.5">High Confidence</span>
                      </div>
                    </div>

                    {/* Vector Node Knowledge Graph Simulation */}
                    <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 relative overflow-hidden">
                      <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-1.5 text-accent-light font-medium">
                          <Network className="w-3.5 h-3.5 text-accent animate-pulse" /> Semantic Vector Space
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">1536 Dimensions</span>
                      </div>

                      <div className="space-y-2">
                        <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="font-semibold text-slate-200 truncate max-w-[200px]">Attention Is All You Need</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">0.96 Match</span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="font-semibold text-slate-200 truncate max-w-[200px]">Linear Attention Mechanisms</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">0.91 Match</span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-semibold text-amber-300">Identified Gap: Long-Context Scaling Limits</span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-400">Actionable</span>
                        </div>
                      </div>
                    </div>

                    {/* Synthesis Output Card */}
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent-light text-accent">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">Literature Review Report Ready</p>
                          <p className="text-[10px] text-slate-500">Synthesized 24 studies into Markdown brief</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-accent bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                        Export PDF
                      </span>
                    </div>

                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. CAPABILITIES METRICS STRIP */}
        <section className="py-12 bg-white border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">

              <div className={`p-4 rounded-xl space-y-1 border border-slate-100 hover:border-slate-200 transition-all duration-500 ${statsLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <span className="text-3xl font-bold text-accent tracking-tight">{metricPapersCount}M+</span>
                <p className="text-xs font-semibold text-slate-900">Academic Papers</p>
                <p className="text-[11px] text-slate-500">Direct arXiv & Semantic Scholar API</p>
              </div>

              <div className={`p-4 rounded-xl space-y-1 border border-slate-100 hover:border-slate-200 transition-all duration-500 delay-100 ${statsLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <span className="text-3xl font-bold text-accent tracking-tight">{metricDimCount}-dim</span>
                <p className="text-xs font-semibold text-slate-900">Vector Embeddings</p>
                <p className="text-[11px] text-slate-500">Qdrant semantic vector similarity</p>
              </div>

              <div className={`p-4 rounded-xl space-y-1 border border-slate-100 hover:border-slate-200 transition-all duration-500 delay-200 ${statsLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <span className="text-3xl font-bold text-accent tracking-tight">Comparative</span>
                <p className="text-xs font-semibold text-slate-900">Evidence Matrix</p>
                <p className="text-[11px] text-slate-500">Methods, datasets & findings aligned</p>
              </div>

              <div className={`p-4 rounded-xl space-y-1 border border-slate-100 hover:border-slate-200 transition-all duration-500 delay-300 ${statsLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <span className="text-3xl font-bold text-accent tracking-tight">Automated</span>
                <p className="text-xs font-semibold text-slate-900">Gap Detection</p>
                <p className="text-[11px] text-slate-500">Unexplored research opportunities</p>
              </div>

            </div>
          </div>
        </section>

        {/* 4. WHY RESEARCHOS (FEATURES SECTION) */}
        <section id="features" className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-semibold text-accent uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Why ResearchOS?
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Designed for serious academic & industrial researchers.
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Stop manually reading dozens of PDFs. ResearchOS extracts, indexes, compares, and synthesizes research automatically.
              </p>
            </div>

            {/* 4 Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 space-y-4 group">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors duration-200">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">1. Discovery & Search</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Queries academic databases in real time. Filters paper collections by publication year, citations, and semantic relevance.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 space-y-4 group">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors duration-200">
                  <GitCompare className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">2. Comparative Matrix</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Extracts structured tables contrasting sample sizes, methodologies, datasets, accuracy benchmarks, and study limitations.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 space-y-4 group">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors duration-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">3. Research Gap Detection</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Surfaces contradictions across studies and highlights open questions where literature evidence remains incomplete.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 space-y-4 group">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors duration-200">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">4. Automated Brief Export</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generates publication-ready Markdown research briefs with structured executive summaries and inline citations.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* 5. DEEP RESEARCH PIPELINE SECTION */}
        <section id="pipeline" className="py-20 lg:py-28 bg-slate-900 text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-semibold text-accent-light uppercase tracking-wider bg-slate-800 px-3.5 py-1 rounded-full border border-slate-700">
                End-to-End RAG Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                How ResearchOS Processes Literature
              </h2>
              <p className="text-slate-400 text-sm">
                Explore the 6-stage AI pipeline powering discovery, ingestion, vector indexing, and evidence synthesis.
              </p>
            </div>

            {/* Interactive Pipeline Selector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

              {/* Pipeline Stage Buttons */}
              <div className="lg:col-span-5 space-y-2.5">
                {pipelineStages.map((stage, idx) => {
                  const Icon = stage.icon;
                  const isActive = activePipelineStage === idx;
                  return (
                    <button
                      key={stage.title}
                      onClick={() => setActivePipelineStage(idx)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${isActive
                        ? 'bg-accent/15 border-accent text-white shadow-sm'
                        : 'bg-slate-800/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-accent text-white' : 'bg-slate-700/60 text-slate-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{stage.title}</p>
                          <p className="text-[10px] text-slate-400">{stage.badge}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-accent rotate-90' : 'text-slate-600'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Active Stage Card Detail */}
              <div className="lg:col-span-7">
                {(() => {
                  const currentStage = pipelineStages[activePipelineStage] ?? pipelineStages[0] ?? {
                    title: "1. Multi-Source Paper Discovery",
                    badge: "arXiv & Semantic Scholar",
                    desc: "Connect directly to open-access research repositories. ResearchOS queries, filters, and retrieves top relevant studies based on semantic relevance.",
                    metrics: "Over 200M+ indexed research papers",
                    icon: Search
                  };
                  return (
                    <div className="p-8 rounded-2xl bg-slate-800 border border-slate-700 space-y-6 relative overflow-hidden min-h-[360px] flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                          <span className="text-xs font-mono font-semibold text-accent-light bg-accent/20 px-3 py-1 rounded-full border border-accent/30">
                            {currentStage.badge}
                          </span>
                          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Automated Pipeline
                          </span>
                        </div>

                        <h3 className="text-2xl font-bold text-white">
                          {currentStage.title}
                        </h3>

                        <p className="text-sm text-slate-300 leading-relaxed">
                          {currentStage.desc}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-750 flex items-center justify-between text-xs font-mono text-slate-300">
                        <span>Performance Benchmark:</span>
                        <span className="text-accent-light font-bold">{currentStage.metrics}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

          </div>
        </section>

        {/* 6. HOW IT WORKS (3-STEP SUMMARY) */}
        <section id="how-it-works" className="py-20 lg:py-28 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-semibold text-accent uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Simple Workflow
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Start your literature analysis in 3 simple steps.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 hover:border-accent/40 transition-colors">
                <span className="text-5xl font-extrabold text-slate-300 font-mono block">01</span>
                <h3 className="text-lg font-bold text-slate-900">Input Research Query</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your topic, hypothesis, or research question. ResearchOS queries open-access APIs to fetch matching papers.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-4 hover:border-accent/40 transition-colors">
                <span className="text-5xl font-extrabold text-accent/40 font-mono block">02</span>
                <h3 className="text-lg font-bold text-slate-900">AI Vector Chunking</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our system ingests PDFs, parses text, embeds vector representations, and structures comparative evidence tables.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-4 hover:border-amber-300 transition-colors">
                <span className="text-5xl font-extrabold text-amber-500/40 font-mono block">03</span>
                <h3 className="text-lg font-bold text-slate-900">Review Gap Brief</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Access structured findings, cross-study limitations, and discovered research gaps ready to export to Markdown.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* 7. FINAL CTA BANNER */}
        <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Ready to understand your research literature?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Transform scattered academic papers into structured, evidence-backed research intelligence today.
            </p>
            <div>
              <Link href={authTarget}>
                <Button className="h-12 px-8 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-md shadow-accent/30 transition-all duration-200">
                  Start Research Workspace <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* 8. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-850 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">

            {/* Brand Column */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center text-white">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-base font-bold text-white tracking-tight">ResearchOS</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                AI-powered research intelligence platform for discovering, comparing, and understanding academic literature.
              </p>
            </div>

            {/* Product Column */}
            <div className="space-y-2.5">
              <p className="font-semibold text-white uppercase text-[11px] tracking-wider">Product</p>
              <ul className="space-y-1.5 text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pipeline" className="hover:text-white transition-colors">RAG Pipeline</a></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/projects" className="hover:text-white transition-colors">Projects</Link></li>
              </ul>
            </div>

            {/* Research Column */}
            <div className="space-y-2.5">
              <p className="font-semibold text-white uppercase text-[11px] tracking-wider">Research</p>
              <ul className="space-y-1.5 text-slate-400">
                <li><a href="#pipeline" className="hover:text-white transition-colors">Paper Discovery</a></li>
                <li><a href="#pipeline" className="hover:text-white transition-colors">Evidence Comparison</a></li>
                <li><a href="#pipeline" className="hover:text-white transition-colors">Gap Detection</a></li>
              </ul>
            </div>

            {/* Account Column */}
            <div className="space-y-2.5">
              <p className="font-semibold text-white uppercase text-[11px] tracking-wider">Account</p>
              <ul className="space-y-1.5 text-slate-400">
                <li><Link href="/login" className="hover:text-white transition-colors">Sign in</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Create account</Link></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-800/80 text-center text-[11px] text-slate-400">
            <p>© 2026 ResearchOS · AI Research Intelligence Platform. All rights reserved.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
