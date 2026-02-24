/**
 * Revenue Optimizer Charts
 * Chart visualizations for Revenue segment KPIs
 */

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
    LineChartComponent,
    FunnelChartComponent,
    BarChartComponent,
    formatCurrency,
    formatDate,
} from '../charts';
import { ChartContainer } from '../charts/ChartContainer';
import { insightApi } from '../../services/insightApi';
import { useModules } from '@so360/shell-context';

interface RevenueChartsProps {
    tenantId: string;
    orgId: string;
}

export const RevenueCharts: React.FC<RevenueChartsProps> = ({ tenantId, orgId }) => {
    const { isModuleEnabled } = useModules();
    const [revenueTrendData, setRevenueTrendData] = useState<any>(null);
    const [funnelData, setFunnelData] = useState<any>(null);
    const [agingData, setAgingData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchChartData();
    }, [tenantId, orgId]);

    const fetchChartData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all revenue charts
            const [trendRes, funnelRes, agingRes] = await Promise.all([
                insightApi.getChartData('revenue', 'revenue_trend'),
                insightApi.getChartData('revenue', 'conversion_funnel'),
                insightApi.getChartData('revenue', 'aging_buckets'),
            ]);

            setRevenueTrendData(trendRes.data?.data?.data || []);
            setFunnelData(funnelRes.data?.data?.stages || []);
            setAgingData(agingRes.data?.data?.buckets || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load revenue charts');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-2">Failed to Load Charts</h3>
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Target Trend */}
            {(isModuleEnabled('crm') || isModuleEnabled('accounting')) && revenueTrendData && (
                <ChartContainer
                    title="Revenue vs Target"
                    description="Monthly performance comparison"
                    chartId="revenue-trend-chart"
                    exportData={revenueTrendData}
                >
                    <LineChartComponent
                        data={revenueTrendData}
                        xAxisKey="date"
                        series={[
                            { key: 'actual', name: 'Actual Revenue', color: '#3b82f6' },
                            { key: 'target', name: 'Target Revenue', color: '#60a5fa' },
                        ]}
                        height={280}
                        segmentColor="revenue"
                        formatValue={(value) => formatCurrency(value)}
                        formatXAxis={(value) => formatDate(value)}
                    />
                </ChartContainer>
            )}

            {/* Deal Conversion Funnel */}
            {isModuleEnabled('crm') && funnelData && (
                <ChartContainer
                    title="Deal Conversion Funnel"
                    description="Sales pipeline progression"
                    chartId="conversion-funnel-chart"
                    exportData={funnelData}
                >
                    <FunnelChartComponent
                        data={funnelData}
                        height={320}
                        segmentColor="revenue"
                        formatValue={(value) => formatCurrency(value)}
                    />
                </ChartContainer>
            )}

            {/* Invoice Aging Distribution */}
            {isModuleEnabled('accounting') && agingData && (
                <ChartContainer
                    title="Invoice Aging Distribution"
                    description="Outstanding invoices by age bucket"
                    chartId="aging-buckets-chart"
                    exportData={agingData}
                    className="lg:col-span-2"
                >
                    <BarChartComponent
                        data={agingData}
                        xAxisKey="name"
                        series={[{ key: 'value', name: 'Amount', color: '#3b82f6' }]}
                        height={280}
                        segmentColor="revenue"
                        formatValue={(value) => formatCurrency(value)}
                    />
                </ChartContainer>
            )}
        </div>
    );
};
