import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { KPICard } from './KPICard';
import { SignalCard } from './SignalCard';
import { TrendChart } from './TrendChart';
import { DataFreshnessIndicator } from './DataFreshnessIndicator';
import { TimeRangeSelector, TimeRange, getDaysForRange } from './TimeRangeSelector';
import { RevenueCharts } from './segments/RevenueCharts';
import { ExecutionCharts } from './segments/ExecutionCharts';
import { DeliveryCharts } from './segments/DeliveryCharts';
import { WorkforceCharts } from './segments/WorkforceCharts';
import { FinanceCharts } from './segments/FinanceCharts';
import { NeuraSummaryCard } from './NeuraSummaryCard';
import { insightApi } from '../services/insightApi';
import { useModules } from '@so360/shell-context';
import type { SegmentDetail, AiSummarySections } from '../types/insight';

// Modules that must have at least one enabled for the AI summary to be shown/fetched
const SEGMENT_MODULE_DEPS: Record<string, string[]> = {
    finance:   ['accounting'],
    revenue:   ['crm', 'accounting', 'dailystore'],
    execution: ['projects', 'flow', 'procurement'],
    delivery:  ['inventory', 'procurement', 'dailystore'],
    workforce: ['people', 'timesheet'],
};

interface SegmentTabContentProps {
    segmentCode: string;
}

export const SegmentTabContent: React.FC<SegmentTabContentProps> = ({ segmentCode }) => {
    const { isModuleEnabled } = useModules();
    const [segment, setSegment] = useState<SegmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const [loadingTrends, setLoadingTrends] = useState(false);
    const [neuraLoading, setNeuraLoading] = useState(true);
    const [neuraSummary, setNeuraSummary] = useState<string | null>(null);
    const [neuraSections, setNeuraSections] = useState<AiSummarySections | null>(null);
    const [neuraGeneratedAt, setNeuraGeneratedAt] = useState<string | null>(null);
    const [neuraCached, setNeuraCached] = useState(false);
    const [neuraRegenerating, setNeuraRegenerating] = useState(false);
    const [neuraError, setNeuraError] = useState<string | null>(null);

    // AI summary is only shown when at least one of the segment's required modules is enabled
    const summaryModules = SEGMENT_MODULE_DEPS[segmentCode] ?? [];
    const canShowAiSummary = summaryModules.length === 0 || summaryModules.some(m => isModuleEnabled(m));

    useEffect(() => {
        fetchSegmentDetail();
        if (canShowAiSummary) {
            fetchNeuraInsight();
        } else {
            setNeuraLoading(false);
        }
    }, [segmentCode, canShowAiSummary]);

    useEffect(() => {
        if (segment) {
            fetchTrendsForRange();
        }
    }, [timeRange, segment?.segment_code]);

    const fetchNeuraInsight = async () => {
        try {
            setNeuraLoading(true);
            setNeuraError(null);
            const response = await fetch(`/v1/insight/ai-summary/${segmentCode}`, {
                method: 'GET',
                headers: insightApi.getAuthHeaders(),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            setNeuraSummary(data.summary || null);
            setNeuraSections(data.sections || null);
            setNeuraGeneratedAt(data.generated_at || null);
            setNeuraCached(data.cached ?? false);
        } catch (err) {
            setNeuraError(err instanceof Error ? err.message : 'Failed to load AI insights');
        } finally {
            setNeuraLoading(false);
        }
    };

    const handleNeuraRegenerate = async () => {
        try {
            setNeuraRegenerating(true);
            setNeuraError(null);
            const response = await fetch(`/v1/insight/ai-summary/${segmentCode}/regenerate`, {
                method: 'POST',
                headers: insightApi.getAuthHeaders(),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            setNeuraSummary(data.summary || null);
            setNeuraSections(data.sections || null);
            setNeuraGeneratedAt(data.generated_at || null);
            setNeuraCached(false);
        } catch (err) {
            setNeuraError(err instanceof Error ? err.message : 'Regeneration failed');
        } finally {
            setNeuraRegenerating(false);
        }
    };

    const fetchSegmentDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await insightApi.getSegmentDetail(segmentCode);
            setSegment(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load segment details');
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendsForRange = async () => {
        if (!segment) return;

        try {
            setLoadingTrends(true);
            const days = getDaysForRange(timeRange);

            // Fetch trends for each KPI with the selected time range
            const trendPromises = segment.kpis.map((kpi) =>
                insightApi.getKPITrend(kpi.kpi_code, days)
            );

            const trends = await Promise.all(trendPromises);

            // Update segment with new trends
            setSegment({
                ...segment,
                trends: trends.filter((t) => t !== null),
            });
        } catch (err) {
            console.error('Failed to fetch trends:', err);
        } finally {
            setLoadingTrends(false);
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

    const handleResolveSignal = async (signalId: string) => {
        try {
            await insightApi.resolveSignal(signalId);
            if (segment) {
                setSegment({
                    ...segment,
                    signals: segment.signals.filter((s) => s.id !== signalId),
                });
            }
        } catch (err) {
            console.error('Failed to resolve signal:', err);
        }
    };

    const renderSegmentCharts = () => {
        if (!segment) return null;

        const chartComponents: Record<string, React.ComponentType<any>> = {
            revenue: RevenueCharts,
            execution: ExecutionCharts,
            delivery: DeliveryCharts,
            workforce: WorkforceCharts,
            finance: FinanceCharts,
        };

        const ChartComponent = chartComponents[segmentCode];

        if (!ChartComponent) {
            return null;
        }

        // Pass dummy tenant/org IDs - charts will use global context from insightApi
        return <ChartComponent tenantId="" orgId="" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-slate-400">Loading segment details...</p>
                </div>
            </div>
        );
    }

    if (error || !segment) {
        return (
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
        );
    }

    const unresolvedSignals = segment.signals.filter((s) => !s.resolved_at);

    return (
        <div className="space-y-8">
            {/* Section 1: Segment Header */}
            <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-6">
                    <div className={getIconColorClass(segment.color_scheme)}>
                        {getSegmentIcon(segment.icon_name)}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-100 mb-2">{segment.segment_name}</h1>
                        <p className="text-slate-400 max-w-3xl">{segment.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="text-slate-500">{segment.kpis.length} KPIs</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-500">{unresolvedSignals.length} Active Signals</span>
                        </div>
                    </div>
                </div>
                <DataFreshnessIndicator />
            </div>

            {/* Section 1.5: Neura AI Insights — only shown when at least one required module is enabled */}
            {canShowAiSummary && (() => {
                const segmentColors: Record<string, 'blue' | 'green' | 'purple' | 'orange'> = {
                    revenue: 'green',
                    execution: 'purple',
                    delivery: 'orange',
                    workforce: 'blue',
                    finance: 'blue',
                };
                const unresolvedForCard = segment.signals.filter((s) => !s.resolved_at).slice(0, 3);
                return (
                    <NeuraSummaryCard
                        title={`${segment.segment_name} AI Insights`}
                        icon="Sparkles"
                        color={segmentColors[segmentCode] ?? 'blue'}
                        summary={neuraSummary}
                        sections={neuraSections}
                        signals={unresolvedForCard}
                        generatedAt={neuraGeneratedAt}
                        cached={neuraCached}
                        loading={neuraLoading}
                        regenerating={neuraRegenerating}
                        error={neuraError}
                        onRetry={fetchNeuraInsight}
                        onRegenerate={handleNeuraRegenerate}
                    />
                );
            })()}

            {/* Section 2: KPIs Grid */}
            {segment.kpis.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">Key Performance Indicators</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {segment.kpis.map((kpi) => (
                            <KPICard key={kpi.kpi_code} kpi={kpi} />
                        ))}
                    </div>
                </div>
            )}

            {/* Section 2.5: Rich Chart Gallery */}
            {renderSegmentCharts() && (
                <div>
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">Analytics Dashboard</h2>
                    {renderSegmentCharts()}
                </div>
            )}

            {/* Section 3: Trend Charts with Time Range Selector */}
            {segment.trends && segment.trends.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-slate-100">Historical Trends</h2>
                        <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
                    </div>
                    {loadingTrends ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {segment.trends.map((trend) => (
                                <TrendChart
                                    key={trend.kpi_code}
                                    trendData={trend}
                                    color={segment.color_scheme.primary}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Section 4: Active Signals */}
            {unresolvedSignals.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">
                        Active Signals ({unresolvedSignals.length})
                    </h2>
                    <div className="space-y-3">
                        {unresolvedSignals.slice(0, 10).map((signal) => (
                            <SignalCard key={signal.id} signal={signal} onResolve={handleResolveSignal} />
                        ))}
                    </div>

                    {unresolvedSignals.length > 10 && (
                        <div className="mt-4 text-center">
                            <p className="text-sm text-slate-400">
                                Showing first 10 of {unresolvedSignals.length} signals
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Empty States */}
            {segment.kpis.length === 0 && (
                <div className="text-center py-12 bg-slate-900/30 rounded-lg border border-slate-800">
                    <p className="text-slate-500">No KPIs available for this segment</p>
                </div>
            )}

            {unresolvedSignals.length === 0 && segment.kpis.length > 0 && (
                <div className="text-center py-8 bg-slate-900/30 rounded-lg border border-slate-800">
                    <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No active signals for this segment</p>
                </div>
            )}
        </div>
    );
};
