'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import type { ProjectDTO } from '@/types/api.types';
import { Sparkles, FolderPlus, Database, RefreshCw, Play } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange(v: boolean): void;
  onCreated(project: ProjectDTO): void;
}

export function NewProjectModal({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [paperLimit, setPaperLimit] = useState<5 | 10 | 20>(20);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { project } = await api.post<{ project: ProjectDTO }>('/api/projects', { name, topic, paperLimit });
      onCreated(project);
      onOpenChange(false);
      setName('');
      setTopic('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-2xl space-y-5">
        {/* HEADER SECTION */}
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-accent shadow-2xs">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight">
                New Research Project
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Start a new AI-powered research investigation & vector literature synthesis.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* FORM FIELDS */}
        <form onSubmit={onSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="project-name" className="text-xs font-bold text-slate-700">
              Project name
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Quantum Machine Learning in Drug Discovery"
              required
              className="h-10 rounded-xl border-slate-200 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent bg-slate-50/50 focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-topic" className="text-xs font-bold text-slate-700">
              Research topic & scope
            </Label>
            <Textarea
              id="project-topic"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              required
              rows={3}
              placeholder="Be specific — e.g., &quot;Transformer architectures in medical imaging and synthetic CT generation&quot;"
              className="p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none text-slate-800 bg-slate-50/50 focus:bg-white transition-all leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paper-limit" className="text-xs font-bold text-slate-700">
              Paper limit & capacity
            </Label>
            <Select value={String(paperLimit)} onValueChange={v => setPaperLimit(Number(v) as 5 | 10 | 20)}>
              <SelectTrigger
                id="paper-limit"
                className="h-10 rounded-xl border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                <SelectValue placeholder="Select paper limit" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                <SelectItem value="5" className="text-xs font-medium">5 Papers (Fast Discovery)</SelectItem>
                <SelectItem value="10" className="text-xs font-medium">10 Papers (Balanced Analysis)</SelectItem>
                <SelectItem value="20" className="text-xs font-medium">20 Papers (Exhaustive Synthesis)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-10 px-4 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 px-5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Creating Project…
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Start Research
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
