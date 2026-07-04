import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import type { ProjectDTO } from '@/types/api.types';

const project: ProjectDTO = {
  id: 'p1', name: 'Quantum ML', topic: 'quantum machine learning',
  paperLimit: 14, status: 'QUEUED', createdAt: '', updatedAt: '', agentRuns: []
};

describe('ProjectCard', () => {
  it('renders project name and status', () => {
    render(<ProjectCard project={project} />);
    expect(screen.getByText('Quantum ML')).toBeInTheDocument();
    expect(screen.getByText(/topic set/i)).toBeInTheDocument();
  });
});
