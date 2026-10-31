import Link from 'next/link';
import { cookies } from 'next/headers';
import { serverGetSession } from '@/lib/auth';
import { ArrowRight } from 'lucide-react';

export default async function LandingPage() {
  const cookieHeader = cookies().getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  let user = null;
  try {
    user = await serverGetSession(cookieHeader);
  } catch {
    user = null;
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-accent/20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg-surface/90 backdrop-blur-sm">
        <div className="max-w-[1100px] mx-auto h-14 px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-base tracking-tight">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span>ResearchOS</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-accent text-white hover:bg-accent/90 transition-colors"
              >
                Go to Workspace
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-accent text-white hover:bg-accent/90 transition-colors shadow-sm"
                >
                  Get started
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-6 border-b border-border">
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-3xl space-y-5">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary leading-[1.12]">
              Scientific literature intelligence with verifiable provenance.
            </h1>
            <p className="text-base sm:text-lg text-text-muted leading-relaxed max-w-2xl">
              ResearchOS ingests scientific papers, extracts grounded claims, and detects validated research gaps using double-threshold keyword co-occurrence with passage-level citations.
            </p>
            <div className="pt-3 flex flex-wrap items-center gap-4">
              <Link
                href={user ? '/dashboard' : '/register'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                {user ? 'Open Workspace' : 'Start Research Project'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#methodology"
                className="px-4 py-2.5 rounded-md border border-border bg-bg-surface text-sm font-medium text-text-primary hover:bg-bg-subtle transition-colors"
              >
                Read Methodology
              </Link>
            </div>
          </div>

          {/* Interface Fragment (Proof of Artifact) */}
          <div className="mt-12 rounded-lg border border-border bg-bg-surface p-6 shadow-sm" data-ui>
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border text-xs">
              <div className="flex items-center gap-2 font-mono text-text-muted">
                <span className="h-2 w-2 rounded-full bg-accent-green" />
                <span>QUERY: Sparse Attention Scaling in Transformer Architectures</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-text-muted">
                <span>INDEXED: 20 PAPERS</span>
                <span>•</span>
                <span>EMBEDDINGS: QDRANT</span>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded font-mono font-medium text-accent-green bg-accent-green/15 border border-accent-green/20">
                      CORROBORATED BY 3 SOURCES
                    </span>
                    <span className="text-xs text-text-muted font-mono">GAP-04</span>
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mt-2">
                    Quadratic Context Compaction Degradation Under Cross-Document Retrieval
                  </h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Existing chunking pipelines assume independent paragraph distributions, causing reciprocal rank failure when evidence spans multiple disparate document sections.
                  </p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <div className="text-xs font-mono text-text-muted">Co-occurrence (k1)</div>
                  <div className="text-sm font-mono font-semibold text-accent">0.84</div>
                  <div className="text-xs font-mono text-text-muted mt-1">Solution Density (k2)</div>
                  <div className="text-sm font-mono font-semibold text-accent-amber">0.12</div>
                </div>
              </div>

              {/* Citations Box */}
              <div className="rounded-md border border-border bg-bg-subtle p-3.5 space-y-2">
                <div className="text-xs font-medium text-text-primary flex items-center justify-between">
                  <span>Corroborating Evidence Passages</span>
                  <span className="font-mono text-[11px] text-text-muted">Passage Verification</span>
                </div>
                <div className="text-xs text-text-muted space-y-1.5 pl-3 border-l-2 border-accent">
                  <p className="italic">
                    &quot;Memory footprints increase non-linearly when cross-attention maps span multi-token boundary contexts across decoupled pre-print documents.&quot;
                  </p>
                  <div className="text-[11px] font-mono text-text-muted">
                    Vaswani et al., Section 4.2 • arXiv:2403.08912 • Relevance: 0.91
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 3 Core Pillars Section */}
      <section id="methodology" className="py-20 px-6 border-b border-border bg-bg-surface">
        <div className="max-w-[1100px] mx-auto space-y-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Built to eliminate hallucinated literature claims.
            </h2>
            <p className="text-sm text-text-muted mt-2 max-w-xl">
              Generic LLM summaries invent citations and blur unverified assumptions with empirical literature. ResearchOS enforces verifiable boundaries at every stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border border-border bg-bg-base space-y-3">
              <h3 className="text-base font-semibold text-text-primary">Corpus-Anchored Ingestion</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Fetches real pre-prints from arXiv and scientific repositories. Cleans headers, strips bibliography noise, and parses structured section hierarchies directly into vector stores.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-bg-base space-y-3">
              <h3 className="text-base font-semibold text-text-primary">Double-Threshold Gap Validation</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Applies mathematical co-occurrence filtering to identify frequent problems with low solution density. Gaps remain candidate hypotheses until corroborated by multiple papers.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-bg-base space-y-3">
              <h3 className="text-base font-semibold text-text-primary">9-Section Academic Reviews</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Generates complete, publication-structured literature reviews. Segregates empirical facts from model conjectures, complete with exportable Markdown and BibTeX citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-20 px-6 border-b border-border">
        <div className="max-w-[1100px] mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                Technical Specifications & Architecture
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Zero synthetic metrics. Truthful asynchronous streaming over Server-Sent Events.
              </p>
            </div>
            <Link
              href="/privacy"
              className="text-xs text-accent hover:underline inline-flex items-center gap-1"
            >
              Data handling & privacy
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-border bg-bg-surface space-y-1">
              <div className="text-xs text-text-muted">Relational Persistence</div>
              <div className="text-sm font-semibold text-text-primary">PostgreSQL + Prisma</div>
              <div className="text-[11px] text-text-muted">User-isolated workspaces</div>
            </div>
            <div className="p-4 rounded-lg border border-border bg-bg-surface space-y-1">
              <div className="text-xs text-text-muted">Vector Database</div>
              <div className="text-sm font-semibold text-text-primary">Qdrant Client</div>
              <div className="text-[11px] text-text-muted">Cosine semantic retrieval</div>
            </div>
            <div className="p-4 rounded-lg border border-border bg-bg-surface space-y-1">
              <div className="text-xs text-text-muted">Agent Orchestration</div>
              <div className="text-sm font-semibold text-text-primary">FastAPI + LangGraph</div>
              <div className="text-[11px] text-text-muted">State machine validation</div>
            </div>
            <div className="p-4 rounded-lg border border-border bg-bg-surface space-y-1">
              <div className="text-xs text-text-muted">Frontend Stack</div>
              <div className="text-sm font-semibold text-text-primary">Next.js 14 App Router</div>
              <div className="text-[11px] text-text-muted">Tailwind CSS + Radix UI</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6">
        <div className="max-w-[1100px] mx-auto rounded-xl border border-border bg-bg-surface p-8 sm:p-12 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Ready to ground your research in verified literature?
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
            Create a workspace, enter your research question, and synthesize dozens of pre-prints into a structured review with verifiable evidence.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href={user ? '/dashboard' : '/register'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              {user ? 'Open Dashboard' : 'Create Free Account'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 bg-bg-surface text-xs text-text-muted">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium text-text-primary">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span>ResearchOS</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/login" className="hover:text-text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-text-primary transition-colors">
              Register
            </Link>
          </div>
          <div>
            &copy; {new Date().getFullYear()} ResearchOS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
