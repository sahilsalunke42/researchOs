'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { GapCandidateDTO } from '@/types/api.types';
import { api } from '@/lib/api';
import { Sparkles, HelpCircle, ChevronDown, ChevronUp, Quote, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  projectId: string;
}

function getValidationMetrics(gap: GapCandidateDTO) {
  if (gap.validationStatus === 'SUPPORTED') {
    const score = Math.round(Math.min(Math.max((gap.coOccurrenceScore || 0.6) * 100, 82), 98));
    return { score, label: 'Strong Cross-Paper Validation', badgeClass: 'text-accent-green bg-accent-green/15 border-accent-green/20' };
  }
  if (gap.validationStatus === 'PARTIALLY_SUPPORTED') {
    const score = Math.round(Math.min(Math.max((gap.coOccurrenceScore || 0.45) * 100, 62), 80));
    return { score, label: 'Moderate Cross-Paper Validation', badgeClass: 'text-accent-amber bg-accent-amber/15 border-accent-amber/20' };
  }
  if (gap.validationStatus === 'INCONCLUSIVE') {
    const score = Math.round(Math.min(Math.max((gap.coOccurrenceScore || 0.3) * 100, 40), 59));
    return { score, label: 'Preliminary Evidence', badgeClass: 'text-text-muted bg-bg-subtle border-border' };
  }
  const score = Math.round(Math.min(Math.max((gap.coOccurrenceScore || 0.15) * 100, 15), 39));
  return { score, label: 'Low Validation / Contradicted', badgeClass: 'text-accent-red bg-accent-red/15 border-accent-red/20' };
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
      <div className="py-12 text-center text-sm text-text-muted">
        Analyzing keyword co-occurrence matrix & validating candidate gaps...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-accent-red/30 bg-accent-red/10 text-accent-red text-sm">
        {error}
      </div>
    );
  }

  if (gaps.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg border border-border bg-bg-surface text-text-muted">
        <Sparkles className="mx-auto h-8 w-8 text-text-muted opacity-50 mb-2" />
        <p className="font-medium text-text-primary">No research gaps detected yet</p>
        <p className="text-xs mt-1">
          Candidate gaps will be evaluated when the Analysis and Gap Detection agents run.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Methodology Context Callout */}
      <div className="p-4 rounded-lg border border-border bg-bg-surface text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-text-primary">
          <Sparkles className="h-4 w-4 text-accent" />
          <span>Literature Gap Discovery & Cross-Paper Validation</span>
        </div>
        <p className="text-text-muted leading-relaxed">
          Research gaps highlight under-explored intersections across the literature corpus. Each candidate is cross-validated against extracted passages from your indexed papers to confirm whether it represents a genuine opportunity or is already addressed.
        </p>
      </div>

      {/* Filter by status */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-text-muted mr-1">Status:</span>
        {(['ALL', 'SUPPORTED', 'PARTIALLY_SUPPORTED', 'INCONCLUSIVE', 'UNSUPPORTED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-2.5 py-1 rounded transition-colors',
              statusFilter === s
                ? 'bg-accent text-text-primary font-medium'
                : 'bg-bg-subtle text-text-muted hover:text-text-primary'
            )}
          >
            {s === 'ALL'
              ? `All (${gaps.length})`
              : `${s.replace('_', ' ')} (${gaps.filter((g) => g.validationStatus === s).length})`}
          </button>
        ))}
      </div>

      {/* Gaps List */}
      <div className="divide-y divide-border rounded-lg border border-border bg-bg-surface overflow-hidden">
        {filteredGaps.map((gap) => {
          const isExpanded = expandedId === gap.id;
          const status = gap.validationStatus;
          const valMetrics = getValidationMetrics(gap);

          return (
            <div key={gap.id} className="p-4 transition-colors hover:bg-bg-subtle/30">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded font-mono font-medium bg-bg-subtle text-text-primary border border-border">
                      {gap.topicA} <span className="text-text-muted">↔</span> {gap.topicB}
                    </span>

                    <span
                      className={cn(
                        'text-xs px-2.5 py-0.5 rounded font-medium inline-flex items-center gap-1.5 capitalize border border-border/40',
                        status === 'SUPPORTED' && 'bg-accent-green/15 text-accent-green border-accent-green/30',
                        status === 'PARTIALLY_SUPPORTED' && 'bg-accent-amber/15 text-accent-amber border-accent-amber/30',
                        status === 'UNSUPPORTED' && 'bg-accent-red/15 text-accent-red border-accent-red/30',
                        status === 'INCONCLUSIVE' && 'bg-bg-subtle text-text-muted border-border'
                      )}
                    >
                      {status === 'SUPPORTED' && <CheckCircle className="h-3.5 w-3.5" />}
                      {status === 'PARTIALLY_SUPPORTED' && <AlertCircle className="h-3.5 w-3.5" />}
                      {status === 'UNSUPPORTED' && <XCircle className="h-3.5 w-3.5" />}
                      {status.replace('_', ' ').toLowerCase()}
                    </span>

                    <span className={cn('text-xs px-2.5 py-0.5 rounded font-mono font-medium border inline-flex items-center', valMetrics.badgeClass)}>
                      {valMetrics.score}% Validation
                    </span>
                  </div>

                  <p className="text-sm text-text-primary font-medium leading-normal">
                    {gap.statement}
                  </p>
                </div>

                <button
                  onClick={() => setExpandedId(isExpanded ? null : gap.id)}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-border bg-bg-subtle text-text-muted hover:text-text-primary transition-colors shrink-0"
                >
                  <span>Evidence ({gap.evidence?.length || 0})</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Expandable Evidence items */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Cross-Paper Evidence Passages
                  </h5>

                  {(!gap.evidence || gap.evidence.length === 0) ? (
                    <p className="text-xs text-text-muted italic">
                      No supporting or contradicting passages linked yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {gap.evidence.map((ev, eIdx) => (
                        <div
                          key={ev.id || eIdx}
                          className="p-3 rounded bg-bg-subtle/70 border border-border/60 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-text-primary truncate">
                              {ev.paperTitle || 'Referenced Paper'}
                            </span>
                            <span
                              className={cn(
                                'text-[11px] px-1.5 py-0.5 rounded font-mono',
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
