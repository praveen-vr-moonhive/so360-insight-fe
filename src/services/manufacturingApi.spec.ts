import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
    manufacturingApi,
    buildManufacturingHeaders,
    resolveManufacturingBaseUrl,
    MANUFACTURING_UNAVAILABLE_MESSAGE,
} from './manufacturingApi';

const HEADERS = buildManufacturingHeaders('tenant-1', 'org-1');

const jsonResponse = (body: any) => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: () => 'application/json; charset=utf-8' },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
});

describe('manufacturingApi', () => {
    let errorSpy: any;

    beforeEach(() => {
        vi.resetAllMocks();
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        delete (window as any).VITE_SO360_MANUFACTURING_API;
    });

    afterEach(() => {
        errorSpy.mockRestore();
        delete (window as any).VITE_SO360_MANUFACTURING_API;
    });

    describe('Given the base URL must be resolved', () => {
        it('When the Shell injects a runtime override / Then it wins', () => {
            (window as any).VITE_SO360_MANUFACTURING_API = 'https://api.neonbee.app/manufacturing/';
            expect(resolveManufacturingBaseUrl('dashboard.neonbee.app')).toBe(
                'https://api.neonbee.app/manufacturing',
            );
        });

        it('When running on localhost / Then it targets manufacturing-be directly, not a Shell-relative proxy path', () => {
            const base = resolveManufacturingBaseUrl('localhost');
            expect(base).toBe('http://localhost:3034');
            expect(base.startsWith('/manufacturing-api')).toBe(false);
        });

        it('When running on a private LAN IP / Then it still targets the local backend', () => {
            expect(resolveManufacturingBaseUrl('192.168.1.42')).toBe('http://localhost:3034');
        });

        it('When running on the production Shell host / Then it targets the prod gateway', () => {
            expect(resolveManufacturingBaseUrl('dashboard.neonbee.app')).toBe(
                'https://api.neonbee.app/manufacturing',
            );
        });

        it('When running on dev / Then it targets the dev gateway', () => {
            expect(resolveManufacturingBaseUrl('dev.dashboard.neonbee.app')).toBe(
                'https://dev.api.neonbee.app/manufacturing',
            );
        });

        it('When running on staging / Then it targets the staging gateway', () => {
            expect(resolveManufacturingBaseUrl('staging.dashboard.neonbee.app')).toBe(
                'https://staging.api.neonbee.app/manufacturing',
            );
        });
    });

    describe('Given manufacturing-be guards the report routes', () => {
        it('When an access token is available / Then it is sent as a bearer token', () => {
            expect(buildManufacturingHeaders('t', 'o', 'tok-123').Authorization).toBe('Bearer tok-123');
        });

        it('When no access token is available / Then no empty Authorization header is sent', () => {
            expect(buildManufacturingHeaders('t', 'o', null).Authorization).toBeUndefined();
            expect(buildManufacturingHeaders('t', 'o').Authorization).toBeUndefined();
        });
    });

    describe('Given the backend answers with HTML instead of JSON', () => {
        it('When the summary is fetched / Then it throws the business-friendly message and never the parser error', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: { get: () => 'text/html' },
                json: () => Promise.reject(new SyntaxError("Unexpected token '<'")),
                text: () => Promise.resolve('<!doctype html><html></html>'),
            }));

            await expect(manufacturingApi.getSummary(HEADERS)).rejects.toThrow(
                MANUFACTURING_UNAVAILABLE_MESSAGE,
            );
        });

        it('When the summary is fetched / Then the technical detail goes to the application log only', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: { get: () => 'text/html' },
                json: () => Promise.reject(new SyntaxError("Unexpected token '<'")),
                text: () => Promise.resolve('<!doctype html>'),
            }));

            await manufacturingApi.getSummary(HEADERS).catch(() => {});
            expect(errorSpy).toHaveBeenCalled();
            expect(String(errorSpy.mock.calls[0][1])).toContain('text/html');
        });
    });

    describe('Given the backend returns an HTTP error', () => {
        it('When the summary is fetched / Then the status code is not exposed to the caller', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: false,
                status: 502,
                statusText: 'Bad Gateway',
                headers: { get: () => 'text/html' },
                json: () => Promise.reject(new Error('nope')),
                text: () => Promise.resolve('<html>502</html>'),
            }));

            await expect(manufacturingApi.getSummary(HEADERS)).rejects.toThrow(
                MANUFACTURING_UNAVAILABLE_MESSAGE,
            );
        });
    });

    describe('Given the network request itself fails', () => {
        it('When the summary is fetched / Then the raw network error is replaced', async () => {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

            await expect(manufacturingApi.getSummary(HEADERS)).rejects.toThrow(
                MANUFACTURING_UNAVAILABLE_MESSAGE,
            );
        });
    });

    describe('Given the backend responds normally', () => {
        it('When the summary is fetched / Then it resolves with the parsed payload', async () => {
            const payload = { mo_total: 3, mo_in_progress: 1 };
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(payload)));

            await expect(manufacturingApi.getSummary(HEADERS)).resolves.toEqual(payload);
        });

        it('When work-centre utilisation is fetched / Then multi-tenant headers are sent', async () => {
            const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
            vi.stubGlobal('fetch', fetchMock);

            await manufacturingApi.getWorkCenterUtilisation(HEADERS);

            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toContain('/v1/manufacturing/reports/work-center-utilisation');
            expect(options.headers['X-Tenant-Id']).toBe('tenant-1');
            expect(options.headers['X-Org-Id']).toBe('org-1');
        });
    });
});
