import React from 'react';
import type { TrendData } from '../types/insight';

interface TrendChartProps {
    trendData: TrendData;
    color?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ trendData, color = 'blue' }) => {
    if (!trendData || trendData.data.length === 0) {
        return (
            <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
                <p className="text-sm text-slate-400">No trend data available</p>
            </div>
        );
    }

    const { kpi_name, data } = trendData;

    // Calculate dimensions
    const width = 100;
    const height = 60;
    const padding = 5;

    // Find min/max values for scaling
    const values = data.map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Generate SVG path
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
        const y = height - padding - ((d.value - minValue) / valueRange) * (height - 2 * padding);
        return `${x},${y}`;
    });

    const linePath = `M ${points.join(' L ')}`;
    const areaPath = `${linePath} L ${width - padding},${height} L ${padding},${height} Z`;

    // Calculate change percentage
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const changePercentage = ((lastValue - firstValue) / firstValue) * 100;
    const isPositive = changePercentage >= 0;

    // Format date range
    const firstDate = new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const lastDate = new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Color scheme based on prop
    const colorClasses = {
        blue: {
            gradient: 'from-blue-500/20 to-blue-500/0',
            stroke: 'stroke-blue-500',
            text: 'text-blue-400',
        },
        purple: {
            gradient: 'from-purple-500/20 to-purple-500/0',
            stroke: 'stroke-purple-500',
            text: 'text-purple-400',
        },
        green: {
            gradient: 'from-green-500/20 to-green-500/0',
            stroke: 'stroke-green-500',
            text: 'text-green-400',
        },
        orange: {
            gradient: 'from-orange-500/20 to-orange-500/0',
            stroke: 'stroke-orange-500',
            text: 'text-orange-400',
        },
        red: {
            gradient: 'from-red-500/20 to-red-500/0',
            stroke: 'stroke-red-500',
            text: 'text-red-400',
        },
    };

    const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

    return (
        <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6 hover:border-slate-700 transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h4 className="text-sm font-medium text-slate-100">{kpi_name}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                        {firstDate} - {lastDate}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xl font-semibold text-slate-100">{lastValue.toFixed(1)}</div>
                    <div
                        className={`text-xs font-medium ${
                            isPositive ? 'text-green-400' : 'text-red-400'
                        }`}
                    >
                        {isPositive ? '+' : ''}
                        {changePercentage.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* SVG Chart */}
            <div className="relative">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-24"
                    preserveAspectRatio="none"
                >
                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id={`gradient-${trendData.kpi_code}`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" className={colors.gradient.split(' ')[0].replace('from-', '')} />
                            <stop offset="100%" className={colors.gradient.split(' ')[1].replace('to-', '')} />
                        </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <path
                        d={areaPath}
                        fill={`url(#gradient-${trendData.kpi_code})`}
                        opacity="0.3"
                    />

                    {/* Line */}
                    <path
                        d={linePath}
                        fill="none"
                        className={colors.stroke}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {points.map((point, i) => {
                        const [x, y] = point.split(',').map(Number);
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="1.5"
                                className={colors.stroke}
                                fill="currentColor"
                            />
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};
