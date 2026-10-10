'use client';

import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  BookOpen,
  Layers,
  AlertCircle,
  Compass,
  CheckCircle2,
  Calendar,
  Users,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MarkdownReportViewProps {
  content: string;
  projectName?: string;
}

/**
 * Parses inline formatting like **bold**, *italic*, `code` without showing asterisks
 */
function renderInlineFormatted(text: string): React.ReactNode[] {
  // Regex to split by bold (**...**), italic (*...*), or code (`...`)
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-slate-900">
          {inner}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-slate-600">
          {inner}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-accent font-semibold"
        >
          {inner}
        </code>
      );
    }
    // Clean up any stray single asterisks or hashes
    const cleanText = part.replace(/^[*#]+\s*/, '');
    return <span key={index}>{cleanText}</span>;
  });
}

function getSectionIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('executive') || lower.includes('summary')) {
    return <BookOpen className="w-4 h-4 text-accent" />;
  }
  if (lower.includes('corpus') || lower.includes('methodolog')) {
    return <Layers className="w-4 h-4 text-indigo-600" />;
  }
  if (lower.includes('gap') || lower.includes('challenge') || lower.includes('vulnerabilit')) {
    return <AlertCircle className="w-4 h-4 text-amber-600" />;
  }
  if (lower.includes('recommend') || lower.includes('future') || lower.includes('scope')) {
    return <Compass className="w-4 h-4 text-emerald-600" />;
  }
  return <FileText className="w-4 h-4 text-slate-500" />;
}

export function MarkdownReportView({ content, projectName }: MarkdownReportViewProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(projectName || 'research-report').replace(/\s+/g, '-').toLowerCase()}-synthesis.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Parse markdown into blocks
  const rawLines = content.split('\n');
  const blocks: Array<{
    type: 'h1' | 'h2' | 'h3' | 'bullet' | 'numbered' | 'paragraph' | 'divider' | 'footer';
    raw: string;
    number?: string;
  }> = [];

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', raw: line.slice(2).trim() });
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', raw: line.slice(3).trim() });
    } else if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', raw: line.slice(4).trim() });
    } else if (/^[-*]\s+/.test(line)) {
      blocks.push({ type: 'bullet', raw: line.replace(/^[-*]\s+/, '').trim() });
    } else if (/^\d+\.\s+/.test(line)) {
      const match = line.match(/^(\d+)\.\s+(.*)$/);
      if (match && match[1] && match[2]) {
        blocks.push({ type: 'numbered', number: match[1], raw: match[2].trim() });
      } else {
        blocks.push({ type: 'paragraph', raw: line });
      }
    } else if (line === '---' || line === '***') {
      blocks.push({ type: 'divider', raw: line });
    } else if (line.toLowerCase().includes('synthesized autonomously') || line.toLowerCase().includes('evidence engine')) {
      blocks.push({ type: 'footer', raw: line.replace(/^[*_]+|[*_]+$/g, '').trim() });
    } else {
      blocks.push({ type: 'paragraph', raw: line });
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-accent">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Executive Evidence Brief</h4>
            <p className="text-[11px] text-slate-500">Autonomous literature matrix and synthesis review</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 border-slate-200 hover:bg-slate-50"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            {copied ? 'Copied' : 'Copy Markdown'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 border-slate-200 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Download
          </Button>
        </div>
      </div>

      {/* Structured Report Content */}
      <div className="space-y-6">
        {blocks.map((block, idx) => {
          if (block.type === 'h1') {
            return (
              <div key={idx} className="pb-4 border-b border-slate-200/70">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-snug">
                  {renderInlineFormatted(block.raw)}
                </h1>
              </div>
            );
          }

          if (block.type === 'h2') {
            const icon = getSectionIcon(block.raw);
            return (
              <div key={idx} className="pt-6 pb-2 border-b border-slate-100 first:pt-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60 shadow-2xs">
                    {icon}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {renderInlineFormatted(block.raw)}
                  </h2>
                </div>
              </div>
            );
          }

          if (block.type === 'h3') {
            return (
              <div
                key={idx}
                className="mt-5 p-4 rounded-xl bg-gradient-to-r from-slate-50 via-white to-indigo-50/20 border border-slate-200/90 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    {renderInlineFormatted(block.raw)}
                  </h3>
                </div>
              </div>
            );
          }

          if (block.type === 'bullet') {
            const isAuthor = block.raw.toLowerCase().includes('authors');
            const isYear = block.raw.toLowerCase().includes('year');
            const isSource = block.raw.toLowerCase().includes('source');
            const isAbstract = block.raw.toLowerCase().includes('abstract');

            if (isAuthor || isYear || isSource) {
              return (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 pl-4 py-0.5">
                  {isAuthor && <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  {isYear && <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  {isSource && <Database className="w-3.5 h-3.5 text-accent shrink-0" />}
                  <div className="leading-relaxed">{renderInlineFormatted(block.raw)}</div>
                </div>
              );
            }

            if (isAbstract) {
              return (
                <div
                  key={idx}
                  className="my-2.5 ml-4 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-700 leading-relaxed space-y-1"
                >
                  {renderInlineFormatted(block.raw)}
                </div>
              );
            }

            return (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <div className="flex-1">{renderInlineFormatted(block.raw)}</div>
              </div>
            );
          }

          if (block.type === 'numbered') {
            return (
              <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                <span className="w-6 h-6 rounded-full bg-accent/10 text-accent font-bold text-[11px] flex items-center justify-center shrink-0">
                  {block.number}
                </span>
                <div className="flex-1 pt-0.5">
                  {renderInlineFormatted(block.raw)}
                </div>
              </div>
            );
          }

          if (block.type === 'divider') {
            return <hr key={idx} className="my-6 border-slate-200/80" />;
          }

          if (block.type === 'footer') {
            return (
              <div
                key={idx}
                className="mt-8 p-4 rounded-xl bg-gradient-to-r from-indigo-50/60 to-emerald-50/40 border border-indigo-100/80 flex items-center justify-between text-xs text-slate-600 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-800">{block.raw}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                  Verified Synthesis
                </span>
              </div>
            );
          }

          return (
            <p key={idx} className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {renderInlineFormatted(block.raw)}
            </p>
          );
        })}
      </div>
    </div>
  );
}
