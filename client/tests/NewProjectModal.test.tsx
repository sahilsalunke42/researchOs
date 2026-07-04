import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewProjectModal } from '@/components/workspace/NewProjectModal';
import * as apiModule from '@/lib/api';

describe('NewProjectModal', () => {
  it('creates a project and calls onCreated', async () => {
    const project = { id: 'p1', name: 'X', topic: 'Y', paperLimit: 10, status: 'QUEUED', createdAt: '', updatedAt: '', agentRuns: [] };
    const post = vi.spyOn(apiModule.api, 'post').mockResolvedValue({ project });
    const onCreated = vi.fn();
    render(<NewProjectModal open onOpenChange={() => {}} onCreated={onCreated} />);
    await userEvent.type(screen.getByLabelText(/project name/i), 'X');
    await userEvent.type(screen.getByLabelText(/research topic/i), 'Y');
    await userEvent.click(screen.getByRole('button', { name: /start research/i }));
    expect(post).toHaveBeenCalledWith('/api/projects', { name: 'X', topic: 'Y', paperLimit: 20 });
    expect(onCreated).toHaveBeenCalledWith(project);
  });
});
