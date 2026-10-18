import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Database, Trash2, Globe, Cpu } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — ResearchOS',
  description: 'ResearchOS Privacy Policy and Data Handling Practices'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/15 text-accent">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
              <p className="text-xs text-text-muted mt-0.5">
                Effective Date: October 2026 • ResearchOS Intelligence Platform
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-bg-surface text-xs leading-relaxed text-text-muted">
          This Privacy Policy explains how ResearchOS collects, processes, stores, and protects data when you use the platform. We are committed to transparency, data minimization, and academic integrity.
        </div>

        <div className="space-y-6 text-sm">
          {/* 1. Data Collected */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-accent" />
              <h2 className="text-base font-semibold text-text-primary">1. Information We Collect</h2>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              We collect only the minimum data necessary to provide literature intelligence services:
            </p>
            <ul className="list-disc pl-5 text-xs text-text-muted space-y-1.5">
              <li>
                <strong className="text-text-primary">Account Credentials:</strong> Your name, email address, and a securely hashed representation of your password (salted and hashed with bcrypt; plaintext passwords are never stored).
              </li>
              <li>
                <strong className="text-text-primary">Research Inputs:</strong> Research topics, project titles, and queries you submit to initiate autonomous discovery pipelines.
              </li>
              <li>
                <strong className="text-text-primary">Public Academic Literature:</strong> Open-access metadata, abstracts, and full-text documents retrieved from external scholarly sources (such as arXiv and Semantic Scholar) solely for your research workflows.
              </li>
            </ul>
          </section>

          {/* 2. How Data is Used */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-accent-green" />
              <h2 className="text-base font-semibold text-text-primary">2. How Your Data Is Processed</h2>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Data submitted to ResearchOS is processed strictly to:
            </p>
            <ul className="list-disc pl-5 text-xs text-text-muted space-y-1.5">
              <li>Discover and rank relevant scientific papers based on your research topic.</li>
              <li>Extract structured problem definitions, methodologies, datasets, findings, and limitations.</li>
              <li>Compute keyword co-occurrence scores and validate candidate research gaps (Curiac et al., 2022).</li>
              <li>Synthesize evidence-grounded reports with verified citations and provide contextual Q&amp;A.</li>
            </ul>
            <p className="text-xs text-text-muted leading-relaxed">
              Your research queries and private workspace data are never sold, rented, or monetized for advertising.
            </p>
          </section>

          {/* 3. Multi-Tenant Vector & Storage Isolation */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-accent-amber" />
              <h2 className="text-base font-semibold text-text-primary">3. Multi-Tenant Storage &amp; Isolation</h2>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              We implement architectural defenses to ensure strict data separation between users:
            </p>
            <ul className="list-disc pl-5 text-xs text-text-muted space-y-1.5">
              <li>
                <strong className="text-text-primary">Relational Partitioning:</strong> User projects, papers, candidate gaps, and reports stored in PostgreSQL are isolated by authenticated user IDs enforced on the server.
              </li>
              <li>
                <strong className="text-text-primary">Vector Isolation:</strong> All vector embeddings stored in Qdrant carry mandatory <code className="font-mono text-accent">project_id</code> and <code className="font-mono text-accent">user_id</code> metadata. Retrieval operations strictly require project and tenant scoping filters, preventing cross-tenant vector leakage.
              </li>
            </ul>
          </section>

          {/* 4. External Services & AI Providers */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-accent" />
              <h2 className="text-base font-semibold text-text-primary">4. External Services &amp; Third-Party APIs</h2>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              To discover academic literature and generate reports, ResearchOS interfaces with:
            </p>
            <ul className="list-disc pl-5 text-xs text-text-muted space-y-1.5">
              <li>
                <strong className="text-text-primary">Scholarly APIs:</strong> Semantic Scholar and arXiv APIs for retrieving public academic papers and abstracts.
              </li>
              <li>
                <strong className="text-text-primary">Language Model Engine:</strong> Local language models (via Ollama or local OpenAI-compatible endpoints) or external LLMs configured in your deployment. Only paper excerpts and research topic prompts necessary for synthesis are passed to the model.
              </li>
              <li>
                <strong className="text-text-primary">SSRF Protection:</strong> Outbound requests to fetch paper PDFs pass through a strict Server-Side Request Forgery (SSRF) validator that blocks loopback, link-local, private IP addresses (RFC 1918), and cloud metadata endpoints.
              </li>
            </ul>
          </section>

          {/* 5. Retention & Deletion */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-accent-red" />
              <h2 className="text-base font-semibold text-text-primary">5. Retention &amp; Cascading Deletion</h2>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              You retain full control over your research data. When you delete a research project:
            </p>
            <ul className="list-disc pl-5 text-xs text-text-muted space-y-1.5">
              <li>The project record in PostgreSQL is permanently deleted.</li>
              <li>Database foreign-key constraints trigger automatic cascading deletion of all associated papers, candidate gaps, cross-paper evidence passages, agent execution runs, and synthesized reports.</li>
            </ul>
          </section>

          {/* 6. Contact & Rights */}
          <section className="space-y-2 pt-4 border-t border-border">
            <h2 className="text-base font-semibold text-text-primary">6. Contact &amp; Privacy Requests</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              If you have questions about your data, security architecture, or wish to request complete deletion of your account and associated data, please contact the ResearchOS administrator through your institutional deployment channel.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-border flex items-center justify-between text-xs text-text-muted">
          <span>&copy; {new Date().getFullYear()} ResearchOS Platform</span>
          <Link href="/settings" className="hover:text-text-primary underline">
            Settings &amp; Security
          </Link>
        </div>
      </div>
    </div>
  );
}
