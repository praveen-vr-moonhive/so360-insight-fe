import axios, { AxiosInstance } from 'axios';
import { attachToastErrorHandler } from '@so360/design-system';
import { createTtlCache } from './ttlCache';
import type {
    Dashboard,
    ModuleInsights,
    AlertsResponse,
    Alert,
    SegmentSummary,
    SegmentDetail,
    TrendData,
    KpiTarget,
    CorrelationPair,
} from '../types/insight';

// Bounded TTL cache for API responses — prevents re-fetches on tab switches and
// re-renders. Hard-capped (CACHE_MAX) so a long session with many distinct keys
// cannot grow the map without limit — expired entries are reclaimed lazily on
// read, so without a ceiling unread keys would accumulate for the whole session.
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
const CACHE_MAX = 100; // hard ceiling on retained entries
const apiCache = createTtlCache<any>({ ttlMs: CACHE_TTL, maxEntries: CACHE_MAX });

function cachedGet<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = apiCache.get(key);
    if (cached !== undefined) {
        return Promise.resolve(cached as T);
    }
    return fetcher().then(data => {
        apiCache.set(key, data);
        return data;
    });
}

function invalidateCache(prefix?: string): void {
    apiCache.invalidate(prefix);
}

class InsightApiClient {
    private client: AxiosInstance;
    private tenantId: string | null = null;
    private orgId: string | null = null;
    private accessToken: string | null = null;

    constructor() {
        this.client = axios.create({
            baseURL: `${(typeof window !== 'undefined' && (window as any).VITE_SO360_INSIGHT_API) || (import.meta as any).env?.VITE_SO360_INSIGHT_API || ''}/v1/insight`,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add multi-tenant headers
        this.client.interceptors.request.use((config) => {
            if (this.tenantId) {
                config.headers['X-Tenant-Id'] = this.tenantId;
            }
            if (this.orgId) {
                config.headers['X-Org-Id'] = this.orgId;
            }
            if (this.accessToken) {
                config.headers['Authorization'] = `Bearer ${this.accessToken}`;
            }
            return config;
        });

        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 402 && error.response?.data?.error === 'QUOTA_EXCEEDED') {
                    window.dispatchEvent(new CustomEvent('__so360_quota_exceeded', { detail: error.response.data.resolution || error.response.data }));
                }
                return Promise.reject(error);
            },
        );

        // Baseline user-visible error surfacing: every failed MUTATION toasts the
        // normalized server message. 401/402 stay with their existing handlers;
        // reads never toast; opt out per-call with { suppressToast: true }.
        attachToastErrorHandler(this.client);
    }

    setTenantId(tenantId: string) {
        this.tenantId = tenantId;
    }

    setOrgId(orgId: string) {
        this.orgId = orgId;
    }

    setAccessToken(token: string) {
        this.accessToken = token;
    }

    getAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (this.tenantId) headers['X-Tenant-Id'] = this.tenantId;
        if (this.orgId) headers['X-Org-Id'] = this.orgId;
        if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`;
        return headers;
    }

    async getDashboard(): Promise<Dashboard> {
        return cachedGet('dashboard', async () => {
            const response = await this.client.get<Dashboard>('/dashboard');
            return response.data;
        });
    }

    async getModuleInsights(moduleCode: string): Promise<ModuleInsights> {
        return cachedGet(`module:${moduleCode}`, async () => {
            const response = await this.client.get<ModuleInsights>(`/module/${moduleCode}`);
            return response.data;
        });
    }

    async getAlerts(params?: {
        severity?: string;
        module_code?: string;
        unresolved_only?: boolean;
        page?: number;
        limit?: number;
    }): Promise<AlertsResponse> {
        return cachedGet(`alerts:${JSON.stringify(params || {})}`, async () => {
            const response = await this.client.get<AlertsResponse>('/alerts', { params });
            return response.data;
        });
    }

    async resolveAlert(alertId: string, resolutionNote?: string): Promise<Alert> {
        const response = await this.client.post<Alert>(`/alert/resolve/${alertId}`, {
            resolution_note: resolutionNote,
        });
        return response.data;
    }

    async getContextInsights(entityType: string, entityId: string): Promise<any> {
        const response = await this.client.get(`/context/${entityType}/${entityId}`);
        return response.data;
    }

    // ===== SEGMENT SYSTEM METHODS =====

    async getSegments(): Promise<SegmentSummary[]> {
        return cachedGet('segments', async () => {
            const response = await this.client.get<SegmentSummary[]>('/segments');
            return response.data;
        });
    }

    async getSegmentDetail(segmentCode: string): Promise<SegmentDetail> {
        return cachedGet(`segment:${segmentCode}`, async () => {
            const response = await this.client.get<SegmentDetail>(`/segment/${segmentCode}`);
            return response.data;
        });
    }

    async getSegmentContext(segmentCode: string): Promise<any> {
        return cachedGet(`segment-ctx:${segmentCode}`, async () => {
            const response = await this.client.get(`/segment/${segmentCode}/context`);
            return response.data;
        });
    }

    async getKPITrend(kpiCode: string, days: number = 30): Promise<TrendData> {
        return cachedGet(`trend:${kpiCode}:${days}`, async () => {
            const response = await this.client.get<TrendData>(`/kpi/${kpiCode}/trend`, {
                params: { days },
            });
            return response.data;
        });
    }

    // ===== CHART DATA METHODS (Pre-computed) =====

    async getChartData(segmentCode: string, chartType: string): Promise<any> {
        return cachedGet(`chart:${segmentCode}:${chartType}`, async () => {
            const response = await this.client.get(`/chart-data/${segmentCode}/${chartType}`);
            return response.data;
        });
    }

    async getDataFreshness(): Promise<any> {
        return cachedGet('freshness', async () => {
            const response = await this.client.get('/data-freshness');
            return response.data;
        });
    }

    // ===== KPI TARGETS =====

    async getTargets(): Promise<KpiTarget[]> {
        return cachedGet('targets', async () => {
            const response = await this.client.get<KpiTarget[]>('/targets');
            return response.data;
        });
    }

    async setTarget(kpiCode: string, targetValue: number): Promise<KpiTarget> {
        const response = await this.client.put<KpiTarget>(`/targets/${kpiCode}`, {
            target_value: targetValue,
        });
        // Dashboard/segment KPI payloads embed target/variance fields, so any
        // cached copies are now stale — clear them alongside the targets cache.
        invalidateCache('targets');
        invalidateCache('dashboard');
        invalidateCache('segment:');
        invalidateCache('module:');
        return response.data;
    }

    // ===== CORRELATIONS =====

    async getCorrelations(): Promise<CorrelationPair[]> {
        return cachedGet('correlations', async () => {
            const response = await this.client.get<CorrelationPair[]>('/correlations');
            return response.data;
        });
    }

    // ===== ON-DEMAND REFRESH =====

    async refreshInsight(): Promise<{
        success: boolean;
        status: 'refreshed' | 'cooldown';
        message: string;
        refreshed_at?: string;
        cooldown_seconds_remaining?: number;
        summary?: { kpis_computed: number; charts_generated: number; errors: string[] };
    }> {
        invalidateCache(); // Clear all cached data on manual refresh
        const response = await this.client.post('/refresh');
        return response.data;
    }

    // ===== ADMIN METHODS =====

    async triggerComputation(): Promise<any> {
        const response = await this.client.post('/admin/trigger-computation');
        return response.data;
    }

    // ===== AI SUMMARY METHODS =====

    async getAiSummary(segmentCode: string): Promise<any> {
        return cachedGet(`ai-summary:${segmentCode}`, async () => {
            const response = await this.client.get(`/ai-summary/${segmentCode}`);
            return response.data;
        });
    }

    async regenerateAiSummary(segmentCode: string): Promise<any> {
        invalidateCache('ai-summary:');
        const response = await this.client.post(`/ai-summary/${segmentCode}/regenerate`);
        return response.data;
    }
}

export const insightApi = new InsightApiClient();
