import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertCircle, Loader2 } from 'lucide-react';
import { insightApi } from '../services/insightApi';
import { TrendChart } from '../components/TrendChart';
import type { SegmentDetail } from '../types/insight';
import * as LucideIcons from 'lucide-react';

export const SegmentDetailPage: React.FC = () => {
    const { segmentCode } = useParams<{ segmentCode: string }>();
    const navigate = useNavigate();
    const [segment, setSegment] = useState<SegmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (segmentCode) {
            fetchSegmentDetail();
        }
    }, [segmentCode]);

    const fetchSegmentDetail = async () => {
        if (!segmentCode) return;

        try {
            setLoading(true);
            const data = await insightApi.getSegmentDetail(segmentCode);
            setSegment(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load segment details');
        } finally {
            setLoading(false);
        }
    };

    const getSegmentIcon = (iconName: string) => {
        const IconComponent = (LucideIcons as any)[iconName];
        if (!IconComponent) return null;
        return <IconComponent className="w-10 h-10" />;
    };

    const getIconColorClass = (colorScheme: { primary: string }) => {
        const colorMap: Record<string, string> = {
            blue: 'text-blue-400',
            purple: 'text-purple-400',
            green: 'text-green-400',
            orange: 'text-orange-400',
            red: 'text-red-400',
        };
        return colorMap[colorScheme.primary] || 'text-slate-400';
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="w-4 h-4 text-green-400" />;
            case 'down':
                return <TrendingDown className="w-4 h-4 text-red-400" />;
            default:
                return <Minus className="w-4 h-4 text-slate-400" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-900/20 border-red-500/30 text-red-400';
            case 'warning':
                return 'bg-amber-900/20 border-amber-500/30 text-amber-400';
            default:
                return 'bg-blue-900/20 border-blue-500/30 text-blue-400';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-slate-400">Loading segment details...</p>
                </div>
            </div>
        );
    }

    if (error || !segment) {
        return (
            <div className="min-h-screen bg-slate-950 p-8">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate('/')}
                        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Overview
                    </button>

                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-400 mb-2">Failed to Load Segment</h3>
                            <p className="text-sm text-red-300">{error || 'Segment not found'}</p>
                            <button
                                onClick={fetchSegmentDetail}
                                className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="mb-4 flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Overview
                    </button>

                    <div className="flex items-start gap-6">
                        <div className={`${getIconColorClass(segment.color_scheme)}`}>
                            {getSegmentIcon(segment.icon_name)}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-slate-100 mb-2">{segment.segment_name}</h1>
                            <p className="text-slate-400 max-w-3xl">{segment.description}</p>
                        </div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">Key Performance Indicators</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {segment.kpis.map((kpi) => (
                            <div
                                key={kpi.kpi_code}
                                className="bg-slate-900/50 rounded-lg border border-slate-800 p-6 hover:border-slate-700 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-sm font-medium text-slate-400">{kpi.kpi_name}</h3>
                                    {getTrendIcon(kpi.trend)}
                                </div>

                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-3xl font-bold text-slate-100">{kpi.value.toFixed(1)}</span>
                                    <span className="text-sm text-slate-400">{kpi.unit}</span>
                                </div>

                                {kpi.trend_percentage !== undefined && (
                                    <div
                                        className={`text-sm font-medium ${
                                            kpi.trend === 'up'
                                                ? 'text-green-400'
                                                : kpi.trend === 'down'
                                                ? 'text-red-400'
                                                : 'text-slate-400'
                                        }`}
                                    >
                                        {kpi.trend === 'up' ? '+' : ''}
                                        {kpi.trend_percentage}%
                                        <span className="text-slate-500 ml-1">from last period</span>
                                    </div>
                                )}

                                <div className="mt-3 pt-3 border-t border-slate-800">
                                    <div className="text-xs text-slate-500">{kpi.category}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {segment.kpis.length === 0 && (
                        <div className="text-center py-12 bg-slate-900/30 rounded-lg border border-slate-800">
                            <p className="text-slate-500">No KPIs available for this segment</p>
                        </div>
                    )}
                </div>

                {/* Trend Charts */}
                {segment.trends && segment.trends.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-100 mb-4">30-Day Trends</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {segment.trends.map((trend) => (
                                <TrendChart
                                    key={trend.kpi_code}
                                    trendData={trend}
                                    color={segment.color_scheme.primary}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Signals */}
                {segment.signals && segment.signals.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold text-slate-100 mb-4">Active Signals</h2>
                        <div className="space-y-4">
                            {segment.signals.slice(0, 5).map((signal) => (
                                <div
                                    key={signal.id}
                                    className={`rounded-lg border p-4 ${getSeverityColor(signal.severity)}`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold">{signal.title}</h3>
                                        <span className="text-xs uppercase font-medium px-2 py-1 bg-slate-900/50 rounded">
                                            {signal.severity}
                                        </span>
                                    </div>
                                    <p className="text-sm opacity-90">{signal.description}</p>
                                    <div className="mt-3 flex items-center gap-4 text-xs opacity-75">
                                        <span>{new Date(signal.created_at).toLocaleDateString()}</span>
                                        {signal.module_code && <span>{signal.module_code}</span>}
                                    </div>
                                </div>
                            ))}

                            {segment.signals.length > 5 && (
                                <button
                                    onClick={() => navigate('/signals')}
                                    className="w-full py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors text-sm font-medium"
                                >
                                    View all {segment.signals.length} signals →
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {(!segment.signals || segment.signals.length === 0) && (
                    <div className="text-center py-12 bg-slate-900/30 rounded-lg border border-slate-800">
                        <p className="text-slate-500">No active signals for this segment</p>
                    </div>
                )}
            </div>
        </div>
    );
};
