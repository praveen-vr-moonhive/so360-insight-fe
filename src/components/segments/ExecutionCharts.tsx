/**
 * Execution Optimizer Charts
 * Chart visualizations for Execution segment KPIs
 */

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
    BarChartComponent,
    LineChartComponent,
    PieChartComponent,
    formatNumber,
    formatDate,
} from '../charts';
import { insightApi } from '../../services/insightApi';
import { useModules } from '@so360/shell-context';

interface ExecutionChartsProps {
    tenantId: string;
    orgId: string;
}

export const ExecutionCharts: React.FC<ExecutionChartsProps> = ({ tenantId, orgId }) => {
    const { isModuleEnabled } = useModules();
    const [taskCompletionData, setTaskCompletionData] = useState<any>(null);
    const [cycleTimeData, setCycleTimeData] = useState<any>(null);
    const [workflowStatusData, setWorkflowStatusData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchChartData();
    }, [tenantId, orgId]);

    const fetchChartData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all execution charts
            const [taskRes, cycleRes, workflowRes] = await Promise.all([
                insightApi.getChartData('execution', 'task_completion'),
                insightApi.getChartData('execution', 'pr_cycle_time'),
                insightApi.getChartData('execution', 'workflow_status'),
            ]);

            setTaskCompletionData(taskRes.data?.data?.data || []);
            setCycleTimeData(cycleRes.data?.data?.data || []);
            setWorkflowStatusData(workflowRes.data?.data?.statuses || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load execution charts');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
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
            {/* Task Completion (Stacked Bar) */}
            {isModuleEnabled('projects') && taskCompletionData && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-100">Task Completion Status</h3>
                        <p className="text-sm text-slate-400 mt-1">On-time vs delayed tasks by month</p>
                    </div>
                    <BarChartComponent
                        data={taskCompletionData}
                        xAxisKey="week"
                        series={[
                            { key: 'completed', name: 'Completed', color: '#10b981', stackId: 'stack' },
                            { key: 'planned', name: 'Planned', color: '#ef4444', stackId: 'stack' },
                        ]}
                        height={280}
                        segmentColor="execution"
                        formatValue={(value) => formatNumber(value)}
                    />
                </div>
            )}

            {/* PR to PO Cycle Time */}
            {isModuleEnabled('procurement') && cycleTimeData && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-100">PR → PO Cycle Time</h3>
                        <p className="text-sm text-slate-400 mt-1">Average days with 5-day target</p>
                    </div>
                    <LineChartComponent
                        data={cycleTimeData}
                        xAxisKey="month"
                        series={[
                            { key: 'avg_days', name: 'Avg Days', color: '#a855f7' },
                        ]}
                        height={280}
                        segmentColor="execution"
                        formatValue={(value) => `${formatNumber(value, 1)} days`}
                        formatXAxis={(value) => formatDate(value)}
                    />
                </div>
            )}

            {/* Workflow Status Distribution */}
            {isModuleEnabled('flow') && workflowStatusData && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 lg:col-span-2">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-100">Workflow Status Distribution</h3>
                        <p className="text-sm text-slate-400 mt-1">Current workflow state breakdown</p>
                    </div>
                    <PieChartComponent
                        data={workflowStatusData || []}
                        height={320}
                        segmentColor="execution"
                        formatValue={(value) => formatNumber(value)}
                        colors={['#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff']}
                    />
                </div>
            )}
        </div>
    );
};
