'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { GapCandidateDTO } from '@/types/api.types';
import { api } from '@/lib/api';
import { Sparkles, ChevronDown, ChevronUp, Quote, CheckCircle2, AlertCircle, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  projectId: string;
}

function getValidationMetrics(gap: GapCandidateDTO) {
  const supportingPassages = (gap.evidence || []).filter(
    (e) => e.relation === 'SUPPORTS' || e.relation === 'PARTIALLY_SUPPORTS'
  );
  const contradictingPassages = (gap.evidence || []).filter(
    (e) => e.relation === 'CONTRADICTS' || e.relation === 'ADDRESSES_ALREADY'
  );

  const supportingCount = supportingPassages.length;
  const contradictingCount = contradictingPassages.length;

  if (gap.validationStatus === 'SUPPORTED') {
    return {
      label: 'Corroborated by 2+ Sources',
      detail: `${supportingCount} Supporting Passage${supportingCount === 1 ? '' : 's'}`,
      badgeClass: 'text-accent-green bg-accent-green/15 border-accent-green/20'
    };
  }
  if (gap.validationStatus === 'PARTIALLY_SUPPORTED') {
    return {
      label: 'Preliminary Single-Source Evidence',
      detail: `${supportingCount} Supporting Passage${supportingCount === 1 ? '' : 's'}`,
      badgeClass: 'text-accent-amber bg-accent-amber/15 border-accent-amber/20'
    };
  }
  if (gap.validationStatus === 'UNSUPPORTED') {
    return {
      label: 'Addressed or Contradicted in Literature',
      detail: `${contradictingCount} Contradicting Passage${contradictingCount === 1 ? '' : 's'}`,
      badgeClass: 'text-accent-red bg-accent-red/15 border-accent-red/20'
    };
  }
  return {
    label: 'Inconclusive / Background Only',
    detail: 'No Open Limitation Found',
    badgeClass: 'text-text-muted bg-bg-subtle border-border'
  };
}

export function GapsView({ projectId }: Props) {
  const [gaps, setGaps] = useState<GapCandidateDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'INCONCLUSIVE' | 'UNSUPPORTED'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.get<{ gaps: GapCandidateDTO[] }>(`/api/projects/${projectId}/gaps`)
      .then((res) => {
        if (isMounted) {
          setGaps(res.gaps || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch research gaps');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const filteredGaps = useMemo(() => {
    return gaps.filter((g) => {
      if (statusFilter !== 'ALL' && g.validationStatus !== statusFilter) return false;
      return true;
    });
  }, [gaps, statusFilter]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono text-text-muted animate-pulse">
        Analyzing keyword co-occurrence matrix & evaluating multi-paper evidence...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-accent-red/30 bg-accent-red/10 text-accent-red text-xs">
        {error}
      </div>
    );
  }

  if (gaps.length === 0) {
    return (
      <div className="p-10 text-center rounded-lg border border-border bg-bg-surface text-text-muted space-y-2">
        <Sparkles className="mx-auto h-6 w-6 text-text-muted/60" />
        <p className="font-semibold text-sm text-text-primary">No candidate gaps detected yet</p>
        <p className="text-xs max-w-md mx-auto leading-relaxed">
          The Analysis & Gap Detection pipeline will extract candidate limitations and cross-validate them across your indexed papers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Methodology Specification Banner */}
      <div className="p-4 rounded-lg border border-border bg-bg-surface text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-text-primary">
          <Sparkles className="h-4 w-4 text-accent shrink-0" />
          <span>Double-Threshold Keyword Co-occurrence & Cross-Paper Validation</span>
        </div>
        <p className="text-text-muted leading-relaxed">
          Gaps reflect under-explored conceptual intersections across indexed pre-prints. Every candidate is verified against multi-paper citation passages to distinguish genuine scientific opportunities from already-addressed limitations.
        </p>
      </div>

      {/* Filter by validation status */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-text-muted text-[11px] uppercase mr-1">Filter Status:</span>
        {(['ALL', 'SUPPORTED', 'PARTIALLY_SUPPORTED', 'INCONCLUSIVE', 'UNSUPPORTED'] as const).map((s) => {
          const count = s === 'ALL' ? gaps.length : gaps.filter((g) => g.validationStatus === s).length;
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-2.5 py-1 rounded text-xs transition-colors',
                isActive
                  ? 'bg-accent text-white font-medium shadow-sm'
                  : 'bg-bg-subtle text-text-muted hover:text-text-primary border border-border'
              )}
            >
              {s === 'ALL' ? 'All' : s.replace('_', ' ')} <span className="tabular-nums">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Gaps Ledger */}
      <div className="divide-y divide-border rounded-lg border border-border bg-bg-surface overflow-hidden shadow-sm">
        {filteredGaps.map((gap) => {
          const isExpanded = expandedId === gap.id;
          const status = gap.validationStatus;
          const valMetrics = getValidationMetrics(gap);

          return (
            <div key={gap.id} className="p-4 transition-colors hover:bg-bg-subtle/30">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-mono font-medium bg-bg-subtle text-text-primary border border-border">
                      {gap.topicA} <span className="text-text-muted">↔</span> {gap.topicB}
                    </span>

                    <span
                      className={cn(
                        'text-[11px] px-2 py-0.5 rounded font-mono font-medium inline-flex items-center gap-1.5 border',
                        status === 'SUPPORTED' && 'bg-accent-green/15 text-accent-green border-accent-green/20',
                        status === 'PARTIALLY_SUPPORTED' && 'bg-accent-amber/15 text-accent-amber border-accent-amber/20',
                        status === 'UNSUPPORTED' && 'bg-accent-red/15 text-accent-red border-accent-red/20',
                        status === 'INCONCLUSIVE' && 'bg-bg-subtle text-text-muted border-border'
                      )}
                    >
                      {status === 'SUPPORTED' && <CheckCircle2 className="h-3 w-3" />}
                      {status === 'PARTIALLY_SUPPORTED' && <AlertCircle className="h-3 w-3" />}
                      {status === 'UNSUPPORTED' && <XCircle className="h-3 w-3" />}
                      {status === 'INCONCLUSIVE' && <HelpCircle className="h-3 w-3" />}
                      {status.replace('_', ' ')}
                    </span>

                    <span className={cn('text-[11px] px-2 py-0.5 rounded font-mono border inline-flex items-center gap-1', valMetrics.badgeClass)}>
                      {valMetrics.detail}
                    </span>
                  </div>

                  <p className="text-sm text-text-primary font-medium leading-relaxed">
                    {gap.statement}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : gap.id)}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-border bg-bg-subtle text-text-muted hover:text-text-primary transition-colors shrink-0 font-mono"
                >
                  <span>Evidence ({gap.evidence?.length || 0})</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Expandable Evidence items */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                    Corroborating Evidence Passages
                  </div>

                  {(!gap.evidence || gap.evidence.length === 0) ? (
                    <p className="text-xs text-text-muted italic">
                      No supporting or contradicting passages linked yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {gap.evidence.map((ev, eIdx) => (
                        <div
                          key={ev.id || eIdx}
                          className="p-3 rounded-md bg-bg-subtle/80 border border-border text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-text-primary truncate">
                              {ev.paperTitle || 'Referenced Paper'}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded font-mono font-medium',
                                ev.relation === 'SUPPORTS' && 'bg-accent-green/15 text-accent-green',
                                ev.relation === 'CONTRADICTS' && 'bg-accent-red/15 text-accent-red',
                                ev.relation === 'PARTIALLY_SUPPORTS' && 'bg-accent-amber/15 text-accent-amber',
                                ev.relation === 'ADDRESSES_ALREADY' && 'bg-accent/15 text-accent',
                                ev.relation === 'UNCLEAR' && 'bg-bg-surface text-text-muted'
                              )}
                            >
                              {ev.relation}
                            </span>
                          </div>

                          <div className="flex items-start gap-2 text-text-muted italic">
                            <Quote className="h-3.5 w-3.5 shrink-0 mt-0.5 text-text-muted opacity-60" />
                            <p className="leading-relaxed font-sans">{ev.passage}</p>
                          </div>

                          {(ev.pageNumber || ev.sectionTitle) && (
                            <div className="text-[11px] text-text-muted font-mono pt-1">
                              {ev.sectionTitle && `Section: ${ev.sectionTitle} `}
                              {ev.pageNumber && `(p. ${ev.pageNumber})`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
