import axios, { AxiosInstance } from 'axios';
import type {
    Dashboard,
    ModuleInsights,
    SignalsResponse,
    Signal,
    SegmentSummary,
    SegmentDetail,
    TrendData,
} from '../types/insight';

// TTL cache for API responses — prevents re-fetches on tab switches and re-renders
const apiCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function cachedGet<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = apiCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        return Promise.resolve(cached.data as T);
    }
    return fetcher().then(data => {
        apiCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
        return data;
    });
}

function invalidateCache(prefix?: string): void {
    if (!prefix) { apiCache.clear(); return; }
    for (const key of apiCache.keys()) {
        if (key.startsWith(prefix)) apiCache.delete(key);
    }
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

    async getSignals(params?: {
        severity?: string;
        module_code?: string;
        unresolved_only?: boolean;
        page?: number;
        limit?: number;
    }): Promise<SignalsResponse> {
        return cachedGet(`signals:${JSON.stringify(params || {})}`, async () => {
            const response = await this.client.get<SignalsResponse>('/signals', { params });
            return response.data;
        });
    }

    async resolveSignal(signalId: string, resolutionNote?: string): Promise<Signal> {
        const response = await this.client.post<Signal>(`/signal/resolve/${signalId}`, {
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
