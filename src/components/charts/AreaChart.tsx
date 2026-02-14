/**
 * Area Chart Component
 * Area chart with gradient fill for visualizing trends with magnitude
 */

import React from 'react';
import {
    AreaChart as RechartsAreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import {
    SEGMENT_COLORS,
    formatDate,
    formatNumber,
    getTooltipStyle,
    getAxisStyle,
    getGridStyle,
} from './chartUtils';

interface AreaChartProps {
    data: any[];
    xAxisKey: string;
    yAxisKey: string;
    height?: number;
    showGrid?: boolean;
    segmentColor?: keyof typeof SEGMENT_COLORS;
    formatValue?: (value: number) => string;
    formatXAxis?: (value: any) => string;
    targetLine?: {
        value: number;
        label: string;
        color?: string;
    };
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: any;
    formatValue?: (value: number) => string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, formatValue }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div style={getTooltipStyle().contentStyle}>
            <p style={getTooltipStyle().labelStyle}>{typeof label === 'string' ? formatDate(label) : label}</p>
            {payload.map((entry: any, index: number) => (
                <p key={index} style={{ ...getTooltipStyle().itemStyle, color: entry.color }}>
                    {formatValue ? formatValue(entry.value) : formatNumber(entry.value, 2)}
                </p>
            ))}
        </div>
    );
};

export const AreaChartComponent: React.FC<AreaChartProps> = ({
    data,
    xAxisKey,
    yAxisKey,
    height = 300,
    showGrid = true,
    segmentColor = 'revenue',
    formatValue,
    formatXAxis,
    targetLine,
}) => {
    if (!data || data.length === 0) {
        return (
            <div
                className="flex items-center justify-center bg-slate-900/30 rounded-lg border border-slate-800"
                style={{ height: `${height}px` }}
            >
                <p className="text-slate-500 text-sm">No data available</p>
            </div>
        );
    }

    const colors = SEGMENT_COLORS[segmentColor];

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={`gradient-${segmentColor}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {showGrid && <CartesianGrid {...getGridStyle()} />}
                <XAxis
                    dataKey={xAxisKey}
                    {...getAxisStyle()}
                    tickFormatter={formatXAxis || ((value) => formatDate(value))}
                />
                <YAxis {...getAxisStyle()} tickFormatter={formatValue || ((value) => formatNumber(value))} />
                <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
                {targetLine && (
                    <ReferenceLine
                        y={targetLine.value}
                        stroke={targetLine.color || '#f59e0b'}
                        strokeDasharray="5 5"
                        label={{ value: targetLine.label, fill: '#94a3b8', fontSize: 12 }}
                    />
                )}
                <Area
                    type="monotone"
                    dataKey={yAxisKey}
                    stroke={colors.primary}
                    strokeWidth={2}
                    fill={`url(#gradient-${segmentColor})`}
                    fillOpacity={1}
                />
            </RechartsAreaChart>
        </ResponsiveContainer>
    );
};
