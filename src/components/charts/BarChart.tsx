/**
 * Bar Chart Component
 * Vertical bar chart with support for single and stacked bars
 */

import React from 'react';
import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    SEGMENT_COLORS,
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
    stackId?: string;
}

interface BarChartProps {
    data: any[];
    xAxisKey: string;
    series: DataSeries[];
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
    segmentColor?: keyof typeof SEGMENT_COLORS;
    formatValue?: (value: number) => string;
    formatXAxis?: (value: any) => string;
    layout?: 'vertical' | 'horizontal';
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
            <p style={getTooltipStyle().labelStyle}>{label}</p>
            {payload.map((entry: any, index: number) => (
                <p key={index} style={{ ...getTooltipStyle().itemStyle, color: entry.color }}>
                    <span className="font-medium">{entry.name}: </span>
                    {formatValue ? formatValue(entry.value) : formatNumber(entry.value)}
                </p>
            ))}
        </div>
    );
};

export const BarChartComponent: React.FC<BarChartProps> = ({
    data,
    xAxisKey,
    series,
    height = 300,
    showGrid = true,
    showLegend = true,
    segmentColor = 'revenue',
    formatValue,
    formatXAxis,
    layout = 'horizontal',
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
            <RechartsBarChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                layout={layout}
            >
                {showGrid && <CartesianGrid {...getGridStyle()} />}
                {layout === 'horizontal' ? (
                    <>
                        <XAxis
                            dataKey={xAxisKey}
                            {...getAxisStyle()}
                            tickFormatter={formatXAxis}
                        />
                        <YAxis {...getAxisStyle()} tickFormatter={formatValue || ((value) => formatNumber(value))} />
                    </>
                ) : (
                    <>
                        <XAxis type="number" {...getAxisStyle()} tickFormatter={formatValue || ((value) => formatNumber(value))} />
                        <YAxis
                            type="category"
                            dataKey={xAxisKey}
                            {...getAxisStyle()}
                            tickFormatter={formatXAxis}
                        />
                    </>
                )}
                <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
                {showLegend && <Legend {...getLegendStyle()} />}
                {series.map((s, index) => (
                    <Bar
                        key={s.key}
                        dataKey={s.key}
                        name={s.name}
                        fill={s.color || (index === 0 ? colors.primary : colors.secondary)}
                        stackId={s.stackId}
                        radius={[4, 4, 0, 0]}
                    />
                ))}
            </RechartsBarChart>
        </ResponsiveContainer>
    );
};
