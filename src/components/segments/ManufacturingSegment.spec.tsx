import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ManufacturingSegment } from './ManufacturingSegment';

const SUMMARY = {
  mo_total: 50, mo_in_progress: 10, mo_done: 30, mo_planned: 10,
  wo_open: 15, on_time_pct: 92, scrap_pct: 2.5, cost_variance_pct: 3,
  total_produced: 5000, total_scrap_qty: 125,
};

const jsonOk = (body: any) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: { get: () => 'application/json' },
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(JSON.stringify(body)),
});

// A Shell-origin proxy miss: HTTP 200 with the SPA's index.html.
const htmlFallback = () => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: { get: () => 'text/html' },
  json: () => Promise.reject(new SyntaxError("Unexpected token '<', \"<!doctype \"... is not valid JSON")),
  text: () => Promise.resolve('<!doctype html><html></html>'),
});

describe('ManufacturingSegment', () => {
  let errorSpy: any;

  beforeEach(() => {
    vi.resetAllMocks();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  describe('Given loading state', () => {
    it('When fetching / Then shows spinner', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
      render(<ManufacturingSegment />);
      expect(screen.getByTestId('icon-Loader2')).toBeInTheDocument();
    });
  });

  describe('Given error state', () => {
    it('When API fails / Then shows error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      render(<ManufacturingSegment />);
      await waitFor(() => {
        expect(screen.getByText('Manufacturing metrics unavailable')).toBeInTheDocument();
      });
    });
  });

  describe('Given data loaded', () => {
    it('When rendered / Then shows KPI tiles', async () => {
      const summary = {
        mo_total: 50, mo_in_progress: 10, mo_done: 30, mo_planned: 10,
        wo_open: 15, on_time_pct: 92, scrap_pct: 2.5, cost_variance_pct: 3,
        total_produced: 5000, total_scrap_qty: 125,
      };
      const util = [
        { work_center_id: 'wc1', code: 'WC01', name: 'Assembly', wos_total: 20, wos_done: 15, oee_pct: 85, target_pct: 80 },
      ];
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(summary) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(util) })
      );
      render(<ManufacturingSegment />);
      await waitFor(() => {
        expect(screen.getByText('Manufacturing')).toBeInTheDocument();
      });
      expect(screen.getByText('Open MOs')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Work Centre Utilisation (OEE)')).toBeInTheDocument();
      expect(screen.getByText('Assembly')).toBeInTheDocument();
    });

    it('When rendered / Then formats whole-number tiles with thousands separators', async () => {
      const summary = {
        mo_total: 50, mo_in_progress: 10, mo_done: 30, mo_planned: 10,
        wo_open: 15, on_time_pct: 92, scrap_pct: 2.5, cost_variance_pct: 3,
        total_produced: 5000, total_scrap_qty: 125,
      };
      const util: any[] = [];
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(summary) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(util) })
      );
      render(<ManufacturingSegment />);
      await waitFor(() => {
        expect(screen.getByText('Total Produced')).toBeInTheDocument();
      });
      expect(screen.getByText('5,000')).toBeInTheDocument();
    });

    it('When rendered / Then requests use the logged-in org/tenant, not a hardcoded UUID', async () => {
      const summary = {
        mo_total: 1, mo_in_progress: 0, mo_done: 1, mo_planned: 0,
        wo_open: 0, on_time_pct: 100, scrap_pct: 0, cost_variance_pct: 0,
        total_produced: 1, total_scrap_qty: 0,
      };
      const fetchMock = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(summary) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
      vi.stubGlobal('fetch', fetchMock);
      render(<ManufacturingSegment />);
      await waitFor(() => expect(fetchMock).toHaveBeenCalled());

      const [, callOptions] = fetchMock.mock.calls[0];
      // shell-context mock's currentOrg — never the previously hardcoded UUIDs
      expect(callOptions.headers['X-Org-Id']).toBe('mock-org-id');
      expect(callOptions.headers['X-Tenant-Id']).toBe('mock-tenant-id');
      expect(callOptions.headers['X-Org-Id']).not.toBe('8317fe18-6ac4-4ac4-b71d-dc13122a905d');
    });
  });

  describe('Given manufacturing-be requires an authenticated caller', () => {
    it('When the Shell supplies an access token / Then requests carry it as a bearer token', async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonOk(SUMMARY));
      vi.stubGlobal('fetch', fetchMock);
      const shellMock = await import('@so360/shell-context');
      const spy = vi.spyOn(shellMock, 'useShell').mockReturnValue({
        currentOrg: { id: 'org-1', tenant_id: 'tenant-1' },
        accessToken: 'tok-abc',
      } as any);

      render(<ManufacturingSegment />);
      await waitFor(() => expect(fetchMock).toHaveBeenCalled());

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['Authorization']).toBe('Bearer tok-abc');
      spy.mockRestore();
    });
  });

  describe('Given the request lands on the Shell SPA fallback instead of manufacturing-be', () => {
    it('When rendered / Then it shows the business-friendly message, not the JSON parser error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlFallback()));
      const { container } = render(<ManufacturingSegment />);

      await waitFor(() => {
        expect(screen.getByText('Manufacturing data is currently unavailable. Please try again later.'))
          .toBeInTheDocument();
      });

      const rendered = container.textContent ?? '';
      expect(rendered).not.toContain('Unexpected token');
      expect(rendered).not.toContain('not valid JSON');
      expect(rendered).not.toContain('<!doctype');
    });

    it('When rendered / Then no backend port or host is exposed in the UI', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlFallback()));
      const { container } = render(<ManufacturingSegment />);

      await waitFor(() => {
        expect(screen.getByText('Manufacturing metrics unavailable')).toBeInTheDocument();
      });

      const rendered = container.textContent ?? '';
      expect(rendered).not.toContain('3034');
      expect(rendered).not.toContain('3043');
      expect(rendered).not.toContain('localhost');
      expect(rendered).not.toMatch(/port\s*\d{4}/i);
    });

    it('When rendered / Then the technical detail is logged internally', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlFallback()));
      render(<ManufacturingSegment />);

      await waitFor(() => expect(errorSpy).toHaveBeenCalled());
      expect(String(errorSpy.mock.calls[0][0])).toContain('Manufacturing metrics request failed');
    });
  });

  describe('Given the failure state offers recovery', () => {
    it('When Retry is clicked after a failure / Then metrics load and the error clears', async () => {
      const fetchMock = vi.fn().mockResolvedValue(htmlFallback());
      vi.stubGlobal('fetch', fetchMock);

      render(<ManufacturingSegment />);
      const retry = await screen.findByRole('button', { name: /retry/i });

      fetchMock.mockImplementation((url: string) =>
        Promise.resolve(url.includes('work-center-utilisation') ? jsonOk([]) : jsonOk(SUMMARY)));
      fireEvent.click(retry);

      await waitFor(() => expect(screen.getByText('Open MOs')).toBeInTheDocument());
      expect(screen.queryByText('Manufacturing metrics unavailable')).not.toBeInTheDocument();
    });
  });

  describe('Given no active organization is selected', () => {
    it('When rendered / Then shows an error instead of fetching with a fallback org', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      const shellMock = await import('@so360/shell-context');
      const spy = vi.spyOn(shellMock, 'useShell').mockReturnValue({ currentOrg: null } as any);

      render(<ManufacturingSegment />);
      await waitFor(() => {
        expect(screen.getByText('Manufacturing metrics unavailable')).toBeInTheDocument();
      });
      expect(fetchMock).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
