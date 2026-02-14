/**
 * Line Chart Component
 * Full-featured line chart with tooltips, grid, and multiple data series support
 */

import React from 'react';
import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    SEGMENT_COLORS,
    formatDate,
    formatNumber,
    getTooltipStyle,
    getAxisStyle,
    getGridStyle,
    getLegendStyle,
} from './chartUtils';

interface DataSeries {
    key: string;
    name: string;
    color?: string;
}

interface LineChartProps {
    data: any[];
    xAxisKey: string;
    series: DataSeries[];
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
    segmentColor?: keyof typeof SEGMENT_COLORS;
    formatValue?: (value: number) => string;
    formatXAxis?: (value: any) => string;
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
                    <span className="font-medium">{entry.name}: </span>
                    {formatValue ? formatValue(entry.value) : formatNumber(entry.value, 2)}
                </p>
            ))}
        </div>
    );
};

export const LineChartComponent: React.FC<LineChartProps> = ({
    data,
    xAxisKey,
    series,
    height = 300,
    showGrid = true,
    showLegend = true,
    segmentColor = 'revenue',
    formatValue,
    formatXAxis,
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
            <RechartsLineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                {showGrid && <CartesianGrid {...getGridStyle()} />}
                <XAxis
                    dataKey={xAxisKey}
                    {...getAxisStyle()}
                    tickFormatter={formatXAxis || ((value) => formatDate(value))}
                />
                <YAxis {...getAxisStyle()} tickFormatter={formatValue || ((value) => formatNumber(value))} />
                <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
                {showLegend && <Legend {...getLegendStyle()} />}
                {series.map((s, index) => (
                    <Line
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        name={s.name}
                        stroke={s.color || (index === 0 ? colors.primary : colors.secondary)}
                        strokeWidth={2}
                        dot={{ fill: s.color || (index === 0 ? colors.primary : colors.secondary), r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                ))}
            </RechartsLineChart>
        </ResponsiveContainer>
    );
};
