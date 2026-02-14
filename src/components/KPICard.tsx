import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SparklineChart } from './charts/SparklineChart';
import type { KPI } from '../types/insight';

interface KPICardProps {
    kpi: KPI;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi }) => {
    const getTrendIcon = () => {
        if (kpi.trend === 'up') return <TrendingUp className="w-5 h-5 text-green-500" />;
        if (kpi.trend === 'down') return <TrendingDown className="w-5 h-5 text-red-500" />;
        return <Minus className="w-5 h-5 text-slate-400" />;
    };

    const getTrendColor = () => {
        if (kpi.trend === 'up') return 'text-green-500';
        if (kpi.trend === 'down') return 'text-red-500';
        return 'text-slate-400';
    };

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 hover:bg-slate-900/70 transition-all">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-sm text-slate-400 mb-1">{kpi.kpi_name}</p>
                    <p className="text-xs text-slate-500">{kpi.category}</p>
                </div>
                {getTrendIcon()}
            </div>

            <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-slate-100">{kpi.value}</span>
                <span className="text-sm text-slate-400">{kpi.unit}</span>
            </div>

            {kpi.trend_percentage !== undefined && (
                <div className={`text-sm ${getTrendColor()}`}>
                    {kpi.trend === 'up' ? '+' : kpi.trend === 'down' ? '-' : ''}
                    {Math.abs(kpi.trend_percentage)}% from last period
                </div>
            )}

            {/* 7-Day Sparkline */}
            {kpi.sparkline_data && kpi.sparkline_data.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Last 7 days</p>
                    <SparklineChart
                        data={kpi.sparkline_data}
                        trend={kpi.trend}
                        height={24}
                    />
                </div>
            )}
        </div>
    );
};
