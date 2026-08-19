import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

let mockShellBridge: any = {};

// Entitlements default to unrestricted so the flag/routing specs below exercise
// flag behaviour alone; the permission specs drive this down to a real code set.
const unrestricted = {
  permissionsLoaded: true,
  hasPermission: () => true,
  hasAnyPermission: () => true,
};

vi.mock('@so360/shell-context', () => ({
  useShellBridge: () => mockShellBridge,
  useModules: () => ({ isModuleEnabled: () => true }),
  useFeatureFlags: () => ({ isFeatureEnabled: () => true }),
  useShell: () => ({ businessSettings: { base_currency: 'USD', document_language: 'en-US', timezone: 'UTC' } }),
}));

vi.mock('./services/insightApi', () => ({
  insightApi: {
    setTenantId: vi.fn(),
    setOrgId: vi.fn(),
    setAccessToken: vi.fn(),
  },
}));

vi.mock('./pages/InsightDashboard', () => ({
  InsightDashboard: ({ initialTab }: { initialTab?: string }) => (
    <div data-testid="insight-dash" data-tab={initialTab ?? ''}>InsightDashboard</div>
  ),
}));
vi.mock('./pages/AlertsPage', () => ({
  AlertsPage: () => <div>AlertsPage</div>,
}));

import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockShellBridge = {};
  });

  describe('Given no shell context', () => {
    it('When not synced / Then shows initializing', () => {
      mockShellBridge = { currentTenant: null, currentOrg: null };
      render(<MemoryRouter><App /></MemoryRouter>);
      expect(screen.getByText('Initializing Insight module...')).toBeInTheDocument();
    });
  });

  describe('Given shell context', () => {
    it('When synced / Then lazily resolves and renders the dashboard route', async () => {
      mockShellBridge = {
        currentTenant: { id: 't1' },
        currentOrg: { id: 'o1' },
        accessToken: 'tok',
        effectiveFlagsLoaded: true,
        ...unrestricted,
      };
      render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
      // Route components are React.lazy → resolved asynchronously under Suspense.
      await waitFor(() => {
        expect(screen.getByText('InsightDashboard')).toBeInTheDocument();
      });
    });

    it('When navigating to alerts / Then renders alerts page', async () => {
      mockShellBridge = {
        currentTenant: { id: 't1' },
        currentOrg: { id: 'o1' },
        accessToken: 'tok',
        effectiveFlagsLoaded: true,
        ...unrestricted,
      };
      render(<MemoryRouter initialEntries={['/alerts']}><App /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('AlertsPage')).toBeInTheDocument();
      });
    });
  });

  describe('Given SegmentRoute with SEGMENT_FLAG_MAP', () => {
    const syncedBridge = (overrides: Record<string, any> = {}) => ({
      currentTenant: { id: 't1' },
      currentOrg: { id: 'o1' },
      accessToken: 'tok',
      effectiveFlagsLoaded: true,
      ...unrestricted,
      ...overrides,
    });

    describe('When navigating to /finance and action:insight:export is hidden', () => {
      it('Then redirects to overview (InsightDashboard at root, no initialTab)', async () => {
        mockShellBridge = syncedBridge({
          getFeatureState: (key: string) => (key === 'action:insight:export' ? 'hidden' : 'enabled'),
        });
        render(<MemoryRouter initialEntries={['/finance']}><App /></MemoryRouter>);
        await waitFor(() => {
          const dash = screen.getByTestId('insight-dash');
          expect(dash).toBeInTheDocument();
          expect(dash.getAttribute('data-tab')).toBe('');
        });
      });
    });

    describe('When navigating to /finance and action:insight:export is enabled', () => {
      it('Then renders InsightDashboard with initialTab=finance', async () => {
        mockShellBridge = syncedBridge({ getFeatureState: () => 'enabled' });
        render(<MemoryRouter initialEntries={['/finance']}><App /></MemoryRouter>);
        await waitFor(() => {
          const dash = screen.getByTestId('insight-dash');
          expect(dash).toBeInTheDocument();
          expect(dash.getAttribute('data-tab')).toBe('finance');
        });
      });
    });

    describe('When navigating to /finance and action:insight:export is locked', () => {
      it('Then shows the upgrade prompt instead of the dashboard', async () => {
        mockShellBridge = syncedBridge({ getFeatureState: () => 'locked' });
        render(<MemoryRouter initialEntries={['/finance']}><App /></MemoryRouter>);
        await waitFor(() => {
          expect(screen.getByText(/upgrade plan/i)).toBeInTheDocument();
        });
        expect(screen.queryByTestId('insight-dash')).not.toBeInTheDocument();
      });
    });

    describe('When navigating to /finance and action:insight:export is disabled', () => {
      it('Then shows the unavailable panel and NO upgrade prompt', async () => {
        mockShellBridge = syncedBridge({ getFeatureState: () => 'disabled' });
        render(<MemoryRouter initialEntries={['/finance']}><App /></MemoryRouter>);
        await waitFor(() => {
          expect(screen.getByText(/feature unavailable/i)).toBeInTheDocument();
        });
        expect(screen.queryByText(/upgrade plan/i)).not.toBeInTheDocument();
        expect(screen.queryByTestId('insight-dash')).not.toBeInTheDocument();
      });
    });

    describe('When navigating to /revenue (not in SEGMENT_FLAG_MAP)', () => {
      it('Then renders InsightDashboard with initialTab=revenue without any flag check', async () => {
        mockShellBridge = syncedBridge({ getFeatureState: () => 'hidden' });
        render(<MemoryRouter initialEntries={['/revenue']}><App /></MemoryRouter>);
        await waitFor(() => {
          const dash = screen.getByTestId('insight-dash');
          expect(dash).toBeInTheDocument();
          expect(dash.getAttribute('data-tab')).toBe('revenue');
        });
      });
    });

    describe('When navigating to a segment with no getFeatureState on the bridge', () => {
      it('Then SegmentRoute fails open to enabled and renders InsightDashboard', async () => {
        mockShellBridge = syncedBridge({ getFeatureState: undefined });
        render(<MemoryRouter initialEntries={['/finance']}><App /></MemoryRouter>);
        await waitFor(() => {
          const dash = screen.getByTestId('insight-dash');
          expect(dash.getAttribute('data-tab')).toBe('finance');
        });
      });
    });
  });

  describe('Given a page gated on role permissions', () => {
    const bridge = (overrides: Record<string, any> = {}) => ({
      currentTenant: { id: 't1' },
      currentOrg: { id: 'o1' },
      accessToken: 'tok',
      effectiveFlagsLoaded: true,
      ...unrestricted,
      ...overrides,
    });

    it('When the user holds analytics.view / Then the segment page renders', async () => {
      mockShellBridge = bridge({ hasAnyPermission: (...c: string[]) => c.includes('analytics.view') });
      render(<MemoryRouter initialEntries={['/revenue']}><App /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByTestId('insight-dash').getAttribute('data-tab')).toBe('revenue');
      });
      expect(screen.queryByText(/don't have access/i)).not.toBeInTheDocument();
    });

    it('When the user lacks analytics.view / Then the page is withheld with a notice', async () => {
      mockShellBridge = bridge({ hasAnyPermission: () => false, hasPermission: () => false });
      render(<MemoryRouter initialEntries={['/revenue']}><App /></MemoryRouter>);
      expect(await screen.findByText(/don't have access to this page/i)).toBeInTheDocument();
      expect(screen.queryByTestId('insight-dash')).not.toBeInTheDocument();
    });

    it('When the alerts page is opened without analytics.view / Then it is withheld', async () => {
      mockShellBridge = bridge({ hasAnyPermission: () => false, hasPermission: () => false });
      render(<MemoryRouter initialEntries={['/alerts']}><App /></MemoryRouter>);
      expect(await screen.findByText(/don't have access to this page/i)).toBeInTheDocument();
      expect(screen.queryByText('AlertsPage')).not.toBeInTheDocument();
    });

    it('When entitlements have not resolved / Then no denial flashes', async () => {
      mockShellBridge = bridge({ permissionsLoaded: false, hasAnyPermission: () => false });
      render(<MemoryRouter initialEntries={['/revenue']}><App /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.queryByText(/don't have access/i)).not.toBeInTheDocument();
      });
      expect(screen.queryByTestId('insight-dash')).not.toBeInTheDocument();
    });

    it('When the overview is opened with no codes at all / Then it stays reachable', async () => {
      mockShellBridge = bridge({ hasAnyPermission: () => false, hasPermission: () => false });
      render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByTestId('insight-dash')).toBeInTheDocument();
      });
      expect(screen.queryByText(/don't have access/i)).not.toBeInTheDocument();
    });
  });
});
