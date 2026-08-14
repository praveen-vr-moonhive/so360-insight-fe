/**
 * Manufacturing metrics client for the Insight dashboard.
 *
 * Insight renders inside the Shell host, so a bare relative `/manufacturing-api/...`
 * fetch resolves against the Shell origin — which has no such proxy. The Shell's
 * SPA fallback then answers with `index.html`, and `res.json()` blows up with a
 * raw parser error that used to be painted straight onto the dashboard.
 *
 * Base URL resolution (first match wins):
 *   1. window.VITE_SO360_MANUFACTURING_API   — runtime override injected by the Shell
 *   2. import.meta.env.VITE_SO360_MANUFACTURING_API — build-time value (CI)
 *   3. hostname-derived cloud gateway         — dev/staging/prod deployments
 *   4. http://localhost:3034                  — local dev / LAN
 *
 * Every response is content-type checked before parsing. Technical detail
 * (status codes, parser errors, upstream bodies) is logged to the console only;
 * callers receive a single business-friendly message.
 */

/** The only manufacturing-failure text that may ever reach the UI. */
export const MANUFACTURING_UNAVAILABLE_MESSAGE =
    'Manufacturing data is currently unavailable. Please try again later.';

const LOCAL_MANUFACTURING_API = 'http://localhost:3034';

function readWindowValue(key: string): string | undefined {
    if (typeof window === 'undefined') return undefined;
    const value = (window as any)[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function currentHostname(): string {
    if (typeof window === 'undefined') return 'localhost';
    return window.location.hostname;
}

function isLocalHostname(hostname: string): boolean {
    return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.local') ||
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
}

function cloudBaseForHostname(hostname: string): string | undefined {
    if (isLocalHostname(hostname)) return undefined;
    if (hostname.startsWith('dev.')) return 'https://dev.api.neonbee.app/manufacturing';
    if (hostname.startsWith('staging.')) return 'https://staging.api.neonbee.app/manufacturing';
    if (hostname.endsWith('.neonbee.app') || hostname.endsWith('.skyoffice360.com')) {
        return 'https://api.neonbee.app/manufacturing';
    }
    return undefined;
}

export function resolveManufacturingBaseUrl(hostname = currentHostname()): string {
    const fromWindow = readWindowValue('VITE_SO360_MANUFACTURING_API');
    if (fromWindow) return fromWindow.replace(/\/$/, '');

    // Accessed as a literal so Vite's define-replacement actually substitutes it.
    const fromBuild = import.meta.env.VITE_SO360_MANUFACTURING_API;
    if (typeof fromBuild === 'string' && fromBuild.trim()) {
        return fromBuild.trim().replace(/\/$/, '');
    }

    return cloudBaseForHostname(hostname) ?? LOCAL_MANUFACTURING_API;
}

function logInternal(path: string, detail: unknown): void {
    // Technical detail stays in the browser/application log — never in the UI.
    console.error(`[insight] Manufacturing metrics request failed: ${path}`, detail);
}

async function getJson<T>(path: string, headers: Record<string, string>, signal?: AbortSignal): Promise<T> {
    const url = `${resolveManufacturingBaseUrl()}${path}`;
    let res: Response;
    try {
        res = await fetch(url, { headers, signal });
    } catch (e) {
        logInternal(path, e);
        throw new Error(MANUFACTURING_UNAVAILABLE_MESSAGE);
    }

    if (!res.ok) {
        const body = await res.text?.().catch(() => '') ?? '';
        logInternal(path, `HTTP ${res.status} ${res.statusText} — ${body.slice(0, 500)}`);
        throw new Error(MANUFACTURING_UNAVAILABLE_MESSAGE);
    }

    // A proxy miss or SPA fallback answers 200 with HTML. Reject it before parsing
    // so the parser error can never become the user-facing message.
    const contentType = res.headers?.get?.('content-type') ?? null;
    if (contentType && !contentType.toLowerCase().includes('json')) {
        logInternal(path, `Expected JSON, received content-type "${contentType}" from ${url}`);
        throw new Error(MANUFACTURING_UNAVAILABLE_MESSAGE);
    }

    try {
        return (await res.json()) as T;
    } catch (e) {
        logInternal(path, e);
        throw new Error(MANUFACTURING_UNAVAILABLE_MESSAGE);
    }
}

export interface MfgSummary {
    mo_total: number;
    mo_in_progress: number;
    mo_done: number;
    mo_planned: number;
    wo_open: number;
    on_time_pct: number;
    scrap_pct: number;
    cost_variance_pct: number;
    total_produced: number;
    total_scrap_qty: number;
}

export interface WcUtil {
    work_center_id: string;
    code: string;
    name: string;
    wos_total: number;
    wos_done: number;
    oee_pct: number;
    target_pct: number;
}

export function buildManufacturingHeaders(
    tenantId: string,
    orgId: string,
    accessToken?: string | null,
): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Tenant-Id': tenantId,
        'X-Org-Id': orgId,
    };
    // manufacturing-be guards the report routes with ModuleAccessGuard +
    // PermissionsGuard, both of which need the Shell's Supabase bearer token.
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return headers;
}

export const manufacturingApi = {
    getSummary: (headers: Record<string, string>, signal?: AbortSignal) =>
        getJson<MfgSummary>('/v1/manufacturing/reports/summary', headers, signal),

    getWorkCenterUtilisation: (headers: Record<string, string>, signal?: AbortSignal) =>
        getJson<WcUtil[]>('/v1/manufacturing/reports/work-center-utilisation', headers, signal),
};
