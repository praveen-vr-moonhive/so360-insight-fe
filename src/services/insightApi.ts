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

class InsightApiClient {
    private client: AxiosInstance;
    private tenantId: string | null = null;
    private orgId: string | null = null;

    constructor() {
        this.client = axios.create({
            baseURL: '/v1/insight',
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
            return config;
        });
    }

    setTenantId(tenantId: string) {
        this.tenantId = tenantId;
    }

    setOrgId(orgId: string) {
        this.orgId = orgId;
    }

    async getDashboard(): Promise<Dashboard> {
        const response = await this.client.get<Dashboard>('/dashboard');
        return response.data;
    }

    async getModuleInsights(moduleCode: string): Promise<ModuleInsights> {
        const response = await this.client.get<ModuleInsights>(`/module/${moduleCode}`);
        return response.data;
    }

    async getSignals(params?: {
        severity?: string;
        module_code?: string;
        unresolved_only?: boolean;
        page?: number;
        limit?: number;
    }): Promise<SignalsResponse> {
        const response = await this.client.get<SignalsResponse>('/signals', { params });
        return response.data;
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
        const response = await this.client.get<SegmentSummary[]>('/segments');
        return response.data;
    }

    async getSegmentDetail(segmentCode: string): Promise<SegmentDetail> {
        const response = await this.client.get<SegmentDetail>(`/segment/${segmentCode}`);
        return response.data;
    }

    async getSegmentContext(segmentCode: string): Promise<any> {
        const response = await this.client.get(`/segment/${segmentCode}/context`);
        return response.data;
    }

    async getKPITrend(kpiCode: string, days: number = 30): Promise<TrendData> {
        const response = await this.client.get<TrendData>(`/kpi/${kpiCode}/trend`, {
            params: { days },
        });
        return response.data;
    }

    // ===== CHART DATA METHODS (Pre-computed) =====

    async getChartData(segmentCode: string, chartType: string): Promise<any> {
        const response = await this.client.get(`/chart-data/${segmentCode}/${chartType}`);
        return response.data;
    }

    async getDataFreshness(): Promise<any> {
        const response = await this.client.get('/data-freshness');
        return response.data;
    }

    // ===== ADMIN METHODS =====

    async triggerComputation(): Promise<any> {
        const response = await this.client.post('/admin/trigger-computation');
        return response.data;
    }
}

export const insightApi = new InsightApiClient();
