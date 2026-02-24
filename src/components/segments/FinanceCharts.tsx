/**
 * Financial Control Charts
 * Chart visualizations for Finance segment KPIs
 */

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
    WaterfallChartComponent,
    LineChartComponent,
    BarChartComponent,
    formatCurrency,
} from '../charts';
import { insightApi } from '../../services/insightApi';
import { useModules } from '@so360/shell-context';

interface FinanceChartsProps {
    tenantId: string;
    orgId: string;
}

export const FinanceCharts: React.FC<FinanceChartsProps> = ({ tenantId, orgId }) => {
    const { isModuleEnabled } = useModules();
    const [cashFlowData, setCashFlowData] = useState<any>(null);
    const [burnRateData, setBurnRateData] = useState<any>(null);
    const [expenseData, setExpenseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchChartData();
    }, [tenantId, orgId]);

    const fetchChartData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [cashFlowRes, burnRateRes, expenseRes] = await Promise.all([
                insightApi.getChartData('finance', 'cash_flow_waterfall'),
                insightApi.getChartData('finance', 'burn_rate_projection'),
                insightApi.getChartData('finance', 'expense_variance'),
            ]);

            setCashFlowData(cashFlowRes.data?.data?.data || []);
            setBurnRateData(burnRateRes.data?.data?.data || []);
            setExpenseData(expenseRes.data?.data?.data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load finance charts');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
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
            {/* Cash Flow Waterfall */}
            {isModuleEnabled('accounting') && cashFlowData && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 lg:col-span-2">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-100">Cash Flow Waterfall</h3>
                        <p className="text-sm text-slate-400 mt-1">Receivables, payables, and net position</p>
                    </div>
                    <WaterfallChartComponent
                        data={cashFlowData}
                        height={320}
                        formatValue={(value) => formatCurrency(value)}
                    />
                </div>
            )}

            {/* Burn Rate with Projection */}
            {isModuleEnabled('accounting') && burnRateData && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-100">Burn Rate & Projection</h3>
                        <p className="text-sm text-slate-400 mt-1">Historical and forecasted burn</p>
                    </div>
                    <LineChartComponent
                        data={burnRateData}
                        xAxisKey="month"
                        series={[
                            { key: 'actual', name: 'Actual Burn', color: '#ef4444' },
                            { key: 'projected', name: 'Projected', color: '#f87171' },
                        ]}
                        height={280}
                        segmentColor="finance"
                        formatValue={(value) => formatCurrency(value)}
                    />
                </div>
            )}

            {/* Expense Variance */}
            {isModuleEnabled('accounting') && expenseData && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-100">Expense Variance</h3>
                        <p className="text-sm text-slate-400 mt-1">Budget vs actual by category</p>
                    </div>
                    <BarChartComponent
                        data={expenseData}
                        xAxisKey="category"
                        series={[
                            { key: 'budgeted', name: 'Budget', color: '#94a3b8' },
                            { key: 'actual', name: 'Actual', color: '#ef4444' },
                        ]}
                        height={280}
                        segmentColor="finance"
                        formatValue={(value) => formatCurrency(value)}
                    />
                </div>
            )}
        </div>
    );
};
