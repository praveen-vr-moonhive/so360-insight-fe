import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from '@so360/design-system';
import { insightApi } from '../services/insightApi';
import { KPICard } from '../components/KPICard';
import { AlertCard } from '../components/AlertCard';
import type { Dashboard as DashboardType, Alert } from '../types/insight';
import { useFormatters } from '@so360/formatters';
import { useShell } from '@so360/shell-context';

export const Dashboard: React.FC = () => {
    const [dashboard, setDashboard] = useState<DashboardType | null>(null);
    const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { businessSettings } = useShell();
    const formatters = useFormatters({
        currency: businessSettings?.base_currency || 'USD',
        locale: businessSettings?.document_language || 'en-US',
        timezone: businessSettings?.timezone || 'UTC',
    });

    useEffect(() => {
        loadDashboard();
        loadRecentAlerts();

        // Auto-refresh every 5 minutes so stale KPI data is updated without user interaction
        const pollInterval = setInterval(() => {
            loadDashboard();
            loadRecentAlerts();
        }, 5 * 60 * 1000);

        return () => clearInterval(pollInterval);
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const data = await insightApi.getDashboard();
            setDashboard(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load dashboard:', err);
            setError(err.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const loadRecentAlerts = async () => {
        try {
            const response = await insightApi.getAlerts({ unresolved_only: true, limit: 5 });
            setRecentAlerts(response.data);
        } catch (err) {
            console.error('Failed to load alerts:', err);
        }
    };

    const handleResolveAlert = async (alertId: string) => {
        try {
            await insightApi.resolveAlert(alertId, 'Resolved from dashboard');
            toast.success('Alert resolved');
            loadRecentAlerts();
            loadDashboard();
        } catch (err) {
            console.error('Failed to resolve alert:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400">Loading insights...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-red-400">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div>
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-8 h-8 text-blue-500" />
                        <h1 className="text-3xl font-bold text-slate-100">Insight Dashboard</h1>
                    </div>
                    <p className="text-slate-400">Real-time KPIs and intelligent alerts across all modules</p>
                </div>

                {/* Alerts Summary */}
                {dashboard && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">Total Alerts</p>
                                    <p className="text-2xl font-bold text-slate-100">{dashboard.signals_summary.total}</p>
                                </div>
                                <AlertCircle className="w-8 h-8 text-slate-600" />
                            </div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-red-400 mb-1">Critical</p>
                                    <p className="text-2xl font-bold text-red-500">{dashboard.signals_summary.critical}</p>
                                </div>
                                <AlertCircle className="w-8 h-8 text-red-500/50" />
                            </div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-yellow-400 mb-1">Warning</p>
                                    <p className="text-2xl font-bold text-yellow-500">{dashboard.signals_summary.warning}</p>
                                </div>
                                <AlertCircle className="w-8 h-8 text-yellow-500/50" />
                            </div>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-400 mb-1">Info</p>
                                    <p className="text-2xl font-bold text-blue-500">{dashboard.signals_summary.info}</p>
                                </div>
                                <AlertCircle className="w-8 h-8 text-blue-500/50" />
                            </div>
                        </div>
                    </div>
                )}

                {/* KPIs Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        <h2 className="text-xl font-semibold text-slate-100">Key Performance Indicators</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboard?.kpis.map((kpi) => (
                            <KPICard key={kpi.kpi_code} kpi={kpi} />
                        ))}
                    </div>
                </div>

                {/* Recent Alerts */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        <h2 className="text-xl font-semibold text-slate-100">Active Alerts</h2>
                    </div>
                    <div className="space-y-4">
                        {recentAlerts.length > 0 ? (
                            recentAlerts.map((alert) => (
                                <AlertCard key={alert.id} alert={alert} onResolve={handleResolveAlert} />
                            ))
                        ) : (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 text-center">
                                <p className="text-slate-400">No active alerts. Everything looks good!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-slate-500">
                    Last updated: {dashboard ? formatters.formatDateTime(dashboard.computed_at) : 'N/A'}
                </div>
            </div>
        </div>
    );
};
