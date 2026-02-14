import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { insightApi } from '../services/insightApi';
import type { SegmentSummary } from '../types/insight';
import * as LucideIcons from 'lucide-react';

export const SegmentOverview: React.FC = () => {
    const navigate = useNavigate();
    const [segments, setSegments] = useState<SegmentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSegments();
    }, []);

    const fetchSegments = async () => {
        try {
            setLoading(true);
            const data = await insightApi.getSegments();
            setSegments(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load segments');
        } finally {
            setLoading(false);
        }
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="w-5 h-5 text-green-400" />;
            case 'down':
                return <TrendingDown className="w-5 h-5 text-red-400" />;
            default:
                return <Minus className="w-5 h-5 text-slate-400" />;
        }
    };

    const getSegmentIcon = (iconName: string) => {
        const IconComponent = (LucideIcons as any)[iconName];
        if (!IconComponent) return null;
        return <IconComponent className="w-8 h-8" />;
    };

    const getColorClass = (colorScheme: { primary: string }) => {
        const colorMap: Record<string, string> = {
            blue: 'border-blue-500/30 hover:border-blue-500',
            purple: 'border-purple-500/30 hover:border-purple-500',
            green: 'border-green-500/30 hover:border-green-500',
            orange: 'border-orange-500/30 hover:border-orange-500',
            red: 'border-red-500/30 hover:border-red-500',
        };
        return colorMap[colorScheme.primary] || 'border-slate-700 hover:border-slate-600';
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

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-10 bg-slate-800 rounded w-64 mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-48 bg-slate-900 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-400 mb-2">Failed to Load Segments</h3>
                            <p className="text-sm text-red-300">{error}</p>
                            <button
                                onClick={fetchSegments}
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
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">Business Intelligence</h1>
                    <p className="text-slate-400">
                        Monitor key performance indicators across 5 business segments
                    </p>
                </div>

                {/* Segment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {segments.map((segment) => (
                        <button
                            key={segment.segment_code}
                            onClick={() => navigate(`/${segment.segment_code}`)}
                            className={`bg-slate-900/50 rounded-lg border ${getColorClass(
                                segment.color_scheme
                            )} p-6 text-left transition-all hover:shadow-lg hover:shadow-${
                                segment.color_scheme.primary
                            }-500/10 group`}
                        >
                            {/* Icon & Name */}
                            <div className="flex items-start justify-between mb-4">
                                <div className={`${getIconColorClass(segment.color_scheme)}`}>
                                    {getSegmentIcon(segment.icon_name)}
                                </div>
                                <div className="flex items-center gap-2">
                                    {getTrendIcon(segment.trend)}
                                </div>
                            </div>

                            <h3 className="text-xl font-semibold text-slate-100 mb-2 group-hover:text-white transition-colors">
                                {segment.segment_name}
                            </h3>
                            <p className="text-sm text-slate-400 mb-4 line-clamp-2">{segment.description}</p>

                            {/* Primary KPI */}
                            {segment.primary_kpi && (
                                <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                                    <div className="text-xs text-slate-500 mb-1">{segment.primary_kpi.kpi_name}</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-slate-100">
                                            {segment.primary_kpi.value.toFixed(1)}
                                        </span>
                                        <span className="text-sm text-slate-400">{segment.primary_kpi.unit}</span>
                                    </div>
                                    {segment.primary_kpi.trend_percentage !== undefined && (
                                        <div
                                            className={`text-xs font-medium mt-1 ${
                                                segment.primary_kpi.trend === 'up'
                                                    ? 'text-green-400'
                                                    : segment.primary_kpi.trend === 'down'
                                                    ? 'text-red-400'
                                                    : 'text-slate-400'
                                            }`}
                                        >
                                            {segment.primary_kpi.trend === 'up' ? '+' : ''}
                                            {segment.primary_kpi.trend_percentage}% from last period
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Stats */}
                            <div className="flex items-center justify-between text-sm">
                                <div>
                                    <span className="text-slate-400">{segment.kpi_count} KPIs</span>
                                </div>
                                {segment.signal_count > 0 && (
                                    <div className="flex items-center gap-1.5 text-amber-400">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>{segment.signal_count} signals</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Empty State */}
                {segments.length === 0 && (
                    <div className="text-center py-16">
                        <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-400 mb-2">No Segments Available</h3>
                        <p className="text-sm text-slate-500">Segment data will appear here once configured.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
