import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

let mockShell: any = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };
const DEFAULT_SHELL_CTX = {
  currentOrg: { id: 'mock-org-id', tenant_id: 'mock-tenant-id', name: 'Mock Org' },
  accessToken: null as string | null,
};
let mockShellCtx: any = { ...DEFAULT_SHELL_CTX };

vi.mock('@so360/shell-context', () => ({
  useShellBridge: () => mockShell,
  useModules: () => ({ isModuleEnabled: () => true }),
  useFeatureFlags: () => ({ isFeatureEnabled: (key: string) => mockShell.isFeatureEnabled(key) }),
  useShell: () => mockShellCtx,
}));

vi.mock('../services/insightApi', () => ({
  insightApi: {
    getAlerts: vi.fn(),
    getSegmentDetail: vi.fn(),
    resolveAlert: vi.fn(),
    getAiSummary: vi.fn(),
    regenerateAiSummary: vi.fn(),
    getCorrelations: vi.fn(),
  },
}));

vi.mock('./KPICard', () => ({
  KPICard: (props: any) => <div data-testid="kpi-card">{props.kpi.kpi_name}</div>,
}));
vi.mock('./AlertCard', () => ({
  AlertCard: (props: any) => <div data-testid="alert-card">{props.alert.title}</div>,
}));
vi.mock('./NeuraSummaryCard', () => ({
  NeuraSummaryCard: (props: any) => (
    <div data-testid="neura-card" data-degraded={String(!!props.degraded)}>{props.title}</div>
  ),
}));
vi.mock('./ModuleCoveragePanel', () => ({
  ModuleCoveragePanel: () => <div data-testid="module-coverage" />,
}));

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ mo_in_progress: 5, mo_planned: 3, wo_open: 2, scrap_pct: 1 }),
}));

import { AtAGlanceView } from './AtAGlanceView';
import { insightApi } from '../services/insightApi';

const mockApi = insightApi as any;

const mockSegments = [
  {
    segment_code: 'revenue',
    segment_name: 'Revenue',
    description: 'Revenue segment',
    icon_name: 'TrendingUp',
    color_scheme: { primary: 'green', secondary: 'green' },
    primary_kpi: { kpi_code: 'r1', kpi_name: 'Total Revenue', value: 50000, unit: 'USD', trend: 'up' as const, category: 'critical', module_code: 'crm' },
    kpi_count: 5,
    signal_count: 2,
    trend: 'up' as const,
  },
];

describe('AtAGlanceView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockShell = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };
    mockShellCtx = { ...DEFAULT_SHELL_CTX };
    mockApi.getAlerts.mockResolvedValue({ data: [] });
    mockApi.getSegmentDetail.mockResolvedValue({
      kpis: [{ kpi_code: 'r1', kpi_name: 'Total Revenue', value: 50000, unit: 'USD', trend: 'up', category: 'critical', module_code: 'module:crm' }],
    });
    mockApi.getAiSummary.mockResolvedValue({ summary: 'AI text', sections: null, generated_at: '2024-01-01', cached: false });
    mockApi.getCorrelations.mockResolvedValue([]);
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ mo_in_progress: 5, mo_planned: 3, wo_open: 2, scrap_pct: 1 }),
    });
  });

  describe('Given the Manufacturing at-a-glance card', () => {
    it('When the backend returns metrics / Then the open-MO count is shown', async () => {
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => expect(screen.getByText('Manufacturing')).toBeInTheDocument());
      // mo_in_progress (5) + mo_planned (3)
      await waitFor(() => expect(screen.getByText('8')).toBeInTheDocument());
    });

    it('When the Shell supplies an access token / Then the request carries it as a bearer token', async () => {
      mockShellCtx = { ...DEFAULT_SHELL_CTX, accessToken: 'tok-xyz' };
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);

      await waitFor(() => expect(globalThis.fetch as any).toHaveBeenCalled());
      const [, options] = (globalThis.fetch as any).mock.calls[0];
      expect(options.headers['Authorization']).toBe('Bearer tok-xyz');
      expect(options.headers['X-Org-Id']).toBe('mock-org-id');
    });

    it('When the request hits the Shell SPA fallback / Then the card degrades quietly with no parser detail', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: () => 'text/html' },
        json: () => Promise.reject(new SyntaxError("Unexpected token '<'")),
        text: () => Promise.resolve('<!doctype html>'),
      });

      const { container } = render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => expect(screen.getByText('Manufacturing')).toBeInTheDocument());

      expect(screen.getByText('Connecting…')).toBeInTheDocument();
      const rendered = container.textContent ?? '';
      expect(rendered).not.toContain('Unexpected token');
      expect(rendered).not.toContain('3034');
      // Detail is logged internally instead.
      await waitFor(() => expect(errorSpy).toHaveBeenCalled());
      errorSpy.mockRestore();
    });
  });

  describe('Given loading state', () => {
    it('When data is being fetched / Then shows skeleton', () => {
      mockApi.getAlerts.mockReturnValue(new Promise(() => {}));
      const { container } = render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Given data loaded', () => {
    it('When rendered / Then shows business segments section', async () => {
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('Business Segments')).toBeInTheDocument();
      });
    });

    it('When segments provided / Then shows segment cards', async () => {
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
      });
    });

    it('When AI summary enabled / Then shows AI Executive Summary', async () => {
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('AI Executive Summary')).toBeInTheDocument();
      });
    });

    it('When no critical alerts / Then shows no alerts message', async () => {
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('No critical alerts at this time')).toBeInTheDocument();
      });
    });

    it('When KPIs available / Then shows important KPIs section', async () => {
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('Important KPIs Across All Segments')).toBeInTheDocument();
      });
    });

    it('When the backend flags a summary as degraded (Neura failed, stale data served) / Then it is passed through to NeuraSummaryCard', async () => {
      mockApi.getAiSummary.mockResolvedValue({
        summary: 'Old text', sections: null, generated_at: '2024-01-01', cached: true, degraded: true,
      });
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getAllByTestId('neura-card')[0]).toHaveAttribute('data-degraded', 'true');
      });
    });
  });

  describe('Given segment click', () => {
    it('When segment button clicked / Then calls onSegmentClick', async () => {
      const onClick = vi.fn();
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={onClick} />);
      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
      });
      screen.getByText('Revenue').closest('button')?.click();
      expect(onClick).toHaveBeenCalledWith('revenue');
    });
  });

  describe('Given effectiveFlagsLoaded is false', () => {
    it('When flags are not yet resolved / Then AI Executive Summary section is absent', async () => {
      mockShell = { effectiveFlagsLoaded: false, isFeatureEnabled: () => true };
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('Business Segments')).toBeInTheDocument();
      });
      expect(screen.queryByText('AI Executive Summary')).not.toBeInTheDocument();
    });
  });

  describe('Given effectiveFlagsLoaded is true and ai_summary is enabled', () => {
    it('When flags are resolved and feature is on / Then AI Executive Summary section is present', async () => {
      mockShell = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('AI Executive Summary')).toBeInTheDocument();
      });
    });
  });

  describe('Given correlations are available and analytics is enabled', () => {
    it('When rendered / Then shows the Related Movements panel with resolved KPI names', async () => {
      mockApi.getCorrelations.mockResolvedValue([
        { kpi_code_a: 'r1', kpi_code_b: 'inv_turnover', correlation: 0.72, direction: 'inverse' },
      ]);
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('Related Movements')).toBeInTheDocument();
      });
      // 'Total Revenue' is resolved from the loaded KPI map (kpi_code r1);
      // 'inv_turnover' has no matching KPI in the loaded map so falls back to its code.
      expect(screen.getByText(/Total Revenue.*moved with inv_turnover.*r=0\.72, inverse/)).toBeInTheDocument();
    });
  });

  describe('Given correlations are empty', () => {
    it('When rendered / Then does not show the Related Movements panel', async () => {
      mockApi.getCorrelations.mockResolvedValue([]);
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('Business Segments')).toBeInTheDocument();
      });
      expect(screen.queryByText('Related Movements')).not.toBeInTheDocument();
    });
  });

  describe('Given analytics feature flag is disabled', () => {
    it('When flags are resolved and feature is off / Then does not fetch or show correlations', async () => {
      mockShell = { effectiveFlagsLoaded: true, isFeatureEnabled: (key: string) => key !== 'submodule:insight:analytics' };
      mockApi.getCorrelations.mockResolvedValue([
        { kpi_code_a: 'r1', kpi_code_b: 'inv_turnover', correlation: 0.72, direction: 'inverse' },
      ]);
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('Business Segments')).toBeInTheDocument();
      });
      expect(screen.queryByText('Related Movements')).not.toBeInTheDocument();
      expect(mockApi.getCorrelations).not.toHaveBeenCalled();
    });
  });
});
