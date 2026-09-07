import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

let mockShell: any = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };

vi.mock('@so360/shell-context', () => ({
  useShellBridge: () => mockShell,
  useModules: () => ({ isModuleEnabled: () => true }),
  useFeatureFlags: () => ({ isFeatureEnabled: () => true }),
}));

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../services/insightApi', () => ({
  insightApi: {
    getSegments: vi.fn(),
    refreshInsight: vi.fn(),
  },
}));

vi.mock('../components/TabNavigation', () => ({
  TabNavigation: (props: any) => (
    <div data-testid="tab-nav">
      {props.tabs.map((t: any) => (
        <button key={t.id} data-testid={`tab-${t.id}`} onClick={() => props.onChange(t.id)}>{t.label}</button>
      ))}
    </div>
  ),
}));
const atAGlanceRenderCount = { current: 0 };
vi.mock('../components/AtAGlanceView', () => ({
  // Counts renders so we can prove the per-second cooldown tick does NOT
  // re-render the dashboard subtree (only the isolated RefreshButton ticks).
  AtAGlanceView: () => {
    atAGlanceRenderCount.current += 1;
    return <div data-testid="at-a-glance" />;
  },
}));
vi.mock('../components/SegmentTabContent', () => ({
  SegmentTabContent: (props: any) => <div data-testid="segment-tab">{props.segmentCode}</div>,
}));
vi.mock('../components/segments/ManufacturingSegment', () => ({
  ManufacturingSegment: () => <div data-testid="manufacturing" />,
}));
vi.mock('../components/DataFreshnessIndicator', () => ({
  DataFreshnessIndicator: () => <div data-testid="freshness" />,
}));

import { InsightDashboard } from './InsightDashboard';
import { insightApi } from '../services/insightApi';

const mockApi = insightApi as any;

const wrap = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('InsightDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    atAGlanceRenderCount.current = 0;
    mockShell = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };
  });

  describe('Given loading state', () => {
    it('When segments are being fetched / Then shows skeleton', () => {
      mockApi.getSegments.mockReturnValue(new Promise(() => {}));
      wrap(<InsightDashboard />);
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Given error state', () => {
    it('When API fails / Then shows error with retry', async () => {
      mockApi.getSegments.mockRejectedValue(new Error('Failed'));
      wrap(<InsightDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Dashboard')).toBeInTheDocument();
      });
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Given segments loaded', () => {
    it('When rendered / Then shows tab navigation and at-a-glance view', async () => {
      mockApi.getSegments.mockResolvedValue([]);
      wrap(<InsightDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Insight Dashboard')).toBeInTheDocument();
      });
      expect(screen.getByTestId('tab-nav')).toBeInTheDocument();
      expect(screen.getByTestId('at-a-glance')).toBeInTheDocument();
    });

    it('When initialTab is revenue / Then shows segment tab content', async () => {
      mockApi.getSegments.mockResolvedValue([]);
      wrap(<InsightDashboard initialTab="revenue" />);
      await waitFor(() => {
        expect(screen.getByTestId('segment-tab')).toBeInTheDocument();
      });
    });

    it('When initialTab is manufacturing / Then shows manufacturing segment', async () => {
      mockApi.getSegments.mockResolvedValue([]);
      wrap(<InsightDashboard initialTab="manufacturing" />);
      await waitFor(() => {
        expect(screen.getByTestId('manufacturing')).toBeInTheDocument();
      });
    });
  });

  describe('Given effectiveFlagsLoaded is false', () => {
    it('When flags are not yet resolved / Then refresh button is absent', async () => {
      mockShell = { effectiveFlagsLoaded: false, isFeatureEnabled: () => true };
      mockApi.getSegments.mockResolvedValue([]);
      wrap(<InsightDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Insight Dashboard')).toBeInTheDocument();
      });
      expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument();
    });
  });

  describe('Given effectiveFlagsLoaded is true and refresh_on_demand is enabled', () => {
    it('When flags are resolved and feature is on / Then refresh button is present', async () => {
      mockShell = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };
      mockApi.getSegments.mockResolvedValue([]);
      wrap(<InsightDashboard />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });
    });
  });

  describe('Given a refresh that returns a cooldown', () => {
    // NOTE: these use REAL timers + fireEvent (not fake timers + userEvent-with-
    // advanceTimers, which deadlocks against the RefreshButton's per-second
    // setInterval). The cooldown window is several real seconds, so the guarded
    // second click and the cooldown label are asserted synchronously within it.
    it('When a refresh returns a cooldown / Then the button shows the countdown and is disabled', async () => {
      mockApi.getSegments.mockResolvedValue([]);
      mockApi.refreshInsight.mockResolvedValue({ status: 'cooldown', cooldown_seconds_remaining: 5 });

      wrap(<InsightDashboard />);
      await screen.findByText('Insight Dashboard');
      await screen.findByTestId('at-a-glance');

      fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toHaveTextContent(/Refresh in \d+s/);
      });
      // dashboard rendered + the cooldown button is disabled during the window
      expect(screen.getByTestId('at-a-glance')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh/i })).toBeDisabled();
    });

    it('When cooldown is active / Then a second click is rejected (no extra refresh API call)', async () => {
      mockApi.getSegments.mockResolvedValue([]);
      mockApi.refreshInsight.mockResolvedValue({ status: 'cooldown', cooldown_seconds_remaining: 5 });

      wrap(<InsightDashboard />);
      await screen.findByText('Insight Dashboard');

      fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toHaveTextContent(/Refresh in \d+s/);
      });
      expect(mockApi.refreshInsight).toHaveBeenCalledTimes(1);

      // cooldown still active (5s window) → second click must not call the API again
      fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
      expect(mockApi.refreshInsight).toHaveBeenCalledTimes(1);
    });

    it('When a successful refresh returns a cooldown / Then segments are re-fetched and cooldown starts', async () => {
      mockApi.getSegments.mockResolvedValue([]);
      mockApi.refreshInsight.mockResolvedValue({ success: true, cooldown_seconds_remaining: 3 });

      wrap(<InsightDashboard />);
      await screen.findByText('Insight Dashboard');
      expect(mockApi.getSegments).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
      // success path re-fetches segments and starts the cooldown countdown
      await waitFor(() => {
        expect(mockApi.getSegments).toHaveBeenCalledTimes(2);
      });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toHaveTextContent(/Refresh in \d+s/);
      });
    });

    it('When a refresh returns success:false / Then it surfaces the refresh error and no cooldown starts', async () => {
      const user = userEvent.setup();
      mockApi.getSegments.mockResolvedValue([]);
      mockApi.refreshInsight.mockResolvedValue({ success: false });

      wrap(<InsightDashboard />);
      await screen.findByText('Insight Dashboard');

      await user.click(screen.getByRole('button', { name: /refresh/i }));
      await waitFor(() => {
        expect(screen.getByText('Refresh completed with errors.')).toBeInTheDocument();
      });
      // No cooldown → button returns to the plain "Refresh" label
      expect(screen.getByRole('button', { name: /refresh/i })).toHaveTextContent('Refresh');
    });

    it('When a refresh throws / Then it surfaces the thrown error message', async () => {
      const user = userEvent.setup();
      mockApi.getSegments.mockResolvedValue([]);
      mockApi.refreshInsight.mockRejectedValue(new Error('boom'));

      wrap(<InsightDashboard />);
      await screen.findByText('Insight Dashboard');

      await user.click(screen.getByRole('button', { name: /refresh/i }));
      await waitFor(() => {
        expect(screen.getByText('boom')).toBeInTheDocument();
      });
    });
  });

  describe('Given a cooldown longer than a minute', () => {
    it('When rendered / Then the label uses the m/s format', async () => {
      mockApi.getSegments.mockResolvedValue([]);
      mockApi.refreshInsight.mockResolvedValue({ status: 'cooldown', cooldown_seconds_remaining: 90 });

      wrap(<InsightDashboard />);
      await screen.findByText('Insight Dashboard');

      fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toHaveTextContent(/Refresh in 1m \d+s/);
      });
    });
  });

  describe('Given RBAC permissions for financials', () => {
    it('When user lacks financial permissions / Then hides revenue and finance tabs', async () => {
      mockShell = {
        effectiveFlagsLoaded: true,
        isFeatureEnabled: () => true,
        isAdmin: false,
        hasPermission: (p: string) => !['dashboard.financial_kpis', 'reports.view', 'invoices.read', 'journal.read'].includes(p),
        hasAnyPermission: (...perms: string[]) => perms.some(p => !['dashboard.financial_kpis', 'reports.view', 'invoices.read', 'journal.read'].includes(p) && false),
      };
      mockApi.getSegments.mockResolvedValue([]);

      wrap(<InsightDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Insight Dashboard')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('tab-revenue')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-finance')).not.toBeInTheDocument();

      // Reset mockShell
      mockShell = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };
    });

    it('When user has financial permissions / Then shows revenue and finance tabs', async () => {
      mockShell = {
        effectiveFlagsLoaded: true,
        isFeatureEnabled: () => true,
        isAdmin: false,
        hasPermission: (p: string) => p === 'dashboard.financial_kpis',
        hasAnyPermission: (...perms: string[]) => perms.includes('dashboard.financial_kpis'),
      };
      mockApi.getSegments.mockResolvedValue([]);

      wrap(<InsightDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Insight Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByTestId('tab-revenue')).toBeInTheDocument();
      expect(screen.getByTestId('tab-finance')).toBeInTheDocument();

      // Reset mockShell
      mockShell = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };
    });
  });
});
