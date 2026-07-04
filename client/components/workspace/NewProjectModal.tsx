'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import type { ProjectDTO } from '@/types/api.types';

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
      setName(''); setTopic('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Research Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input id="project-name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-topic">Research topic</Label>
            <Textarea
              id="project-topic"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              required
              rows={4}
              placeholder="Be specific — e.g., &quot;Transformer architectures in medical imaging&quot;"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paper-limit">Paper limit</Label>
            <Select value={String(paperLimit)} onValueChange={(v) => setPaperLimit(Number(v) as 5 | 10 | 20)}>
              <SelectTrigger id="paper-limit"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p role="alert" className="text-sm text-accent-red">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Start Research'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
