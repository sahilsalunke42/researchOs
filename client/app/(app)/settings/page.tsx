'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import type { UserDTO } from '@/types/api.types';
import { Shield, Lock, Database, FileCheck, User } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<UserDTO | null>(null);

  useEffect(() => {
    getSession().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settings & Security</h1>
        <p className="text-xs text-text-muted mt-1">
          Account details, privacy architecture, and academic integrity policies
        </p>
      </div>

      {/* Account Info */}
      <div className="p-5 rounded-lg border border-border bg-bg-surface space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-text-primary">User Profile</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-text-muted block">Full Name</span>
            <span className="font-medium text-text-primary text-sm">{user?.name || 'Researcher'}</span>
          </div>
          <div>
            <span className="text-text-muted block">Email Address</span>
            <span className="font-mono text-text-primary text-sm">{user?.email || '—'}</span>
          </div>
        </div>
      </div>

      {/* Privacy Architecture & Security Guarantees */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Security & Privacy Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border bg-bg-surface space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent-green" />
              <h3 className="text-xs font-semibold text-text-primary">Multi-Tenant Vector Isolation</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Every embedding indexed into Qdrant is strictly partitioned by cryptographically authenticated <code className="font-mono text-accent">project_id</code> and <code className="font-mono text-accent">user_id</code> payload filters. Cross-tenant retrieval is blocked at the database engine level.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-bg-surface space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-accent" />
              <h3 className="text-xs font-semibold text-text-primary">SSRF & Document Sanitization</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Inbound PDF URLs are subjected to strict SSRF pre-flight validation blocking link-local, loopback, private IPv4/IPv6 subnets, and cloud metadata endpoints. All parsed text is treated as untrusted input.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-bg-surface space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-accent-amber" />
              <h3 className="text-xs font-semibold text-text-primary">Prompt Injection Defense</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Literature excerpts supplied to language models are wrapped in protective delimiter boundaries (<code className="font-mono text-accent">&lt;context&gt;</code>) with adversarial override filters ensuring untrusted paper text cannot hijack reasoning logic.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-bg-surface space-y-2">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-accent-green" />
              <h3 className="text-xs font-semibold text-text-primary">Ground-Truth Citations</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              ResearchOS strictly enforces zero fabricated citations. Candidate gaps are evaluated using the double-threshold co-occurrence algorithm (Curiac et al., 2022) with cross-paper passage verification.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Policy Callout & Link */}
      <div className="p-5 rounded-lg border border-border bg-bg-surface flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Platform Privacy Policy</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Detailed policies regarding collected metadata, scholarly APIs, LLM inference data handling, and cascading deletion.
          </p>
        </div>
        <Link
          href="/privacy"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-md bg-accent text-text-primary hover:opacity-90 transition-opacity shrink-0"
        >
          View Privacy Policy
        </Link>
      </div>
    </div>
  );
}
