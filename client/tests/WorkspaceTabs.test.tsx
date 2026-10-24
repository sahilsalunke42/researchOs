import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkspaceTabs } from '@/components/workspace/WorkspaceTabs';

vi.mock('@/hooks/useResearchJob', () => ({
  useResearchJob: () => ({
    status: 'INGESTING',
    agentStages: [],
    discoveredCount: 5,
    gapsCount: 2,
    isStreaming: true,
    error: null,
    refresh: vi.fn(),
  })
}));

vi.mock('@/components/workspace/ProgressView', () => ({
  ProgressView: () => <div data-testid="progress-view">Progress</div>
}));
vi.mock('@/components/workspace/PapersView', () => ({
  PapersView: () => <div data-testid="papers-view">Papers</div>
}));
vi.mock('@/components/workspace/GapsView', () => ({
  GapsView: () => <div data-testid="gaps-view">Gaps</div>
}));
vi.mock('@/components/workspace/ReportView', () => ({
  ReportView: () => <div data-testid="report-view">Report</div>
}));

describe('WorkspaceTabs', () => {
  it('renders standard research tabs and does not expose Ask Assistant in the visible UI', () => {
    render(<WorkspaceTabs projectId="test-proj-123" />);

    const tabs = screen.getAllByRole('tab');
    const tabTexts = tabs.map((t) => t.textContent);
    expect(tabTexts.some((txt) => txt?.includes('Pipeline'))).toBe(true);
    expect(tabTexts.some((txt) => txt?.includes('Papers'))).toBe(true);
    expect(tabTexts.some((txt) => txt?.includes('Research Gaps'))).toBe(true);
    expect(tabTexts.some((txt) => txt?.includes('Report'))).toBe(true);

    // Verify Ask Assistant is completely removed from the visible MVP
    expect(tabTexts.some((txt) => txt?.toLowerCase().includes('ask'))).toBe(false);
    expect(screen.queryByText(/ask assistant/i)).not.toBeInTheDocument();
  });
});
