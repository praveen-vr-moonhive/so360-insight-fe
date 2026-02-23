/**
 * Workforce Optimizer Charts
 * Chart visualizations for Workforce segment KPIs
 */

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
    LineChartComponent,
    GaugeChartComponent,
    BarChartComponent,
    formatNumber,
    formatPercentage,
    formatDate,
} from '../charts';
import { insightApi } from '../../services/insightApi';

interface WorkforceChartsProps {
    tenantId: string;
    orgId: string;
}

export const WorkforceCharts: React.FC<WorkforceChartsProps> = ({ tenantId, orgId }) => {
    const [utilizationData, setUtilizationData] = useState<any>(null);
    const [complianceData, setComplianceData] = useState<any>(null);
    const [overtimeData, setOvertimeData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchChartData();
    }, [tenantId, orgId]);

    const fetchChartData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [utilizationRes, complianceRes, overtimeRes] = await Promise.all([
                insightApi.getChartData('workforce', 'utilization_trend'),
                insightApi.getChartData('workforce', 'compliance_gauge'),
                insightApi.getChartData('workforce', 'overtime_distribution'),
            ]);

            setUtilizationData(utilizationRes.data?.data?.data || []);
            setComplianceData(complianceRes.data?.data || {});
            setOvertimeData(overtimeRes.data?.data?.departments || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load workforce charts');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
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
            {/* Utilization Rate Trend */}
            {utilizationData && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-100">Team Utilization Rate</h3>
                        <p className="text-sm text-slate-400 mt-1">Average team capacity usage</p>
                    </div>
                    <LineChartComponent
                        data={utilizationData}
                        xAxisKey="month"
                        series={[{ key: 'utilization', name: 'Utilization %', color: '#f97316' }]}
                        height={280}
                        segmentColor="workforce"
                        formatValue={(value) => formatPercentage(value)}
                        formatXAxis={(value) => formatDate(value)}
                    />
                </div>
            )}

            {/* Timesheet Compliance Gauge */}
            {complianceData && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-100">Timesheet Compliance</h3>
                        <p className="text-sm text-slate-400 mt-1">Current compliance rate</p>
                    </div>
                    <GaugeChartComponent
                        value={complianceData.overall_score || 0}
                        title="Compliance"
                        height={250}
                        segmentColor="workforce"
                        thresholds={{ low: 70, medium: 85, high: 100 }}
                    />
                </div>
            )}

            {/* Overtime Distribution */}
            {overtimeData && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 lg:col-span-2">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-100">Overtime Distribution</h3>
                        <p className="text-sm text-slate-400 mt-1">Employee count by weekly hours</p>
                    </div>
                    <BarChartComponent
                        data={overtimeData}
                        xAxisKey="name"
                        series={[{ key: 'overtime_hours', name: 'Employees', color: '#f97316' }]}
                        height={280}
                        segmentColor="workforce"
                        formatValue={(value) => formatNumber(value)}
                    />
                </div>
            )}
        </div>
    );
};
