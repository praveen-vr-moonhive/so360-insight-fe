/**
 * Delivery Optimizer Charts
 * Chart visualizations for Delivery segment KPIs
 */

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
    AreaChartComponent,
    LineChartComponent,
    BarChartComponent,
    formatNumber,
    formatPercentage,
    formatDate,
} from '../charts';
import { insightApi } from '../../services/insightApi';
import { useModules } from '@so360/shell-context';

interface DeliveryChartsProps {
    tenantId: string;
    orgId: string;
}

export const DeliveryCharts: React.FC<DeliveryChartsProps> = ({ tenantId, orgId }) => {
    const { isModuleEnabled } = useModules();
    const [deliveryRateData, setDeliveryRateData] = useState<any>(null);
    const [turnoverData, setTurnoverData] = useState<any>(null);
    const [backorderData, setBackorderData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchChartData();
    }, [tenantId, orgId]);

    const fetchChartData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [rateRes, turnoverRes, backorderRes] = await Promise.all([
                insightApi.getChartData('delivery', 'delivery_rate'),
                insightApi.getChartData('delivery', 'inventory_turnover'),
                insightApi.getChartData('delivery', 'backorder_analysis'),
            ]);

            setDeliveryRateData(rateRes.data?.data?.data || []);
            setTurnoverData(turnoverRes.data?.data?.data || []);
            setBackorderData(backorderRes.data?.data?.data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load delivery charts');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
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
            {/* On-Time Delivery Rate */}
            {isModuleEnabled('procurement') && deliveryRateData && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 lg:col-span-2">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-100">On-Time Delivery Rate</h3>
                        <p className="text-sm text-slate-400 mt-1">Trend with 80% target band</p>
                    </div>
                    <AreaChartComponent
                        data={deliveryRateData}
                        xAxisKey="month"
                        yAxisKey="on_time"
                        height={280}
                        segmentColor="delivery"
                        formatValue={(value) => formatPercentage(value)}
                        formatXAxis={(value) => formatDate(value)}
                        targetLine={{ value: 80, label: '80% Target', color: '#f59e0b' }}
                    />
                </div>
            )}

            {/* Inventory Turnover */}
            {isModuleEnabled('inventory') && turnoverData && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-100">Inventory Turnover</h3>
                        <p className="text-sm text-slate-400 mt-1">Top categories comparison</p>
                    </div>
                    <LineChartComponent
                        data={turnoverData}
                        xAxisKey="category"
                        series={[{ key: 'turnover', name: 'Inventory Turnover', color: '#10b981' }]}
                        height={280}
                        segmentColor="delivery"
                        formatValue={(value) => formatNumber(value, 1)}
                    />
                </div>
            )}

            {/* Backorder Analysis */}
            {(isModuleEnabled('procurement') || isModuleEnabled('inventory')) && backorderData && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-100">Backorders by Category</h3>
                        <p className="text-sm text-slate-400 mt-1">Items on backorder</p>
                    </div>
                    <BarChartComponent
                        data={backorderData}
                        xAxisKey="week"
                        series={[{ key: 'backorders', name: 'Backorders', color: '#ef4444' }]}
                        height={280}
                        segmentColor="delivery"
                        formatValue={(value) => formatNumber(value)}
                        layout="horizontal"
                    />
                </div>
            )}
        </div>
    );
};
