/**
 * Pie Chart Component
 * Donut-style pie chart for showing distribution and percentages
 */

import React from 'react';
import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    SEGMENT_COLORS,
    formatNumber,
    formatPercentage,
    getTooltipStyle,
    getLegendStyle,
} from './chartUtils';

interface PieChartProps {
    data: { name: string; value: number }[];
    height?: number;
    showLegend?: boolean;
    segmentColor?: keyof typeof SEGMENT_COLORS;
    formatValue?: (value: number) => string;
    innerRadius?: number; // 0 for full pie, >0 for donut
    colors?: string[];
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    formatValue?: (value: number) => string;
    total: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, formatValue, total }) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0];
    const percentage = (data.value / total) * 100;

    return (
        <div style={getTooltipStyle().contentStyle}>
            <p style={getTooltipStyle().labelStyle}>{data.name}</p>
            <p style={getTooltipStyle().itemStyle}>
                <span className="font-medium">Value: </span>
                {formatValue ? formatValue(data.value) : formatNumber(data.value)}
            </p>
            <p style={getTooltipStyle().itemStyle}>
                <span className="font-medium">Share: </span>
                {formatPercentage(percentage)}
            </p>
        </div>
    );
};

const RADIAN = Math.PI / 180;

const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
}: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Hide labels for slices < 5%

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            fontSize={12}
            fontWeight={600}
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export const PieChartComponent: React.FC<PieChartProps> = ({
    data,
    height = 300,
    showLegend = true,
    segmentColor = 'revenue',
    formatValue,
    innerRadius = 60,
    colors,
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

    const segmentColors = SEGMENT_COLORS[segmentColor];
    const defaultColors = colors || [
        segmentColors.primary,
        segmentColors.secondary,
        segmentColors.tertiary,
        '#60a5fa',
        '#93c5fd',
        '#bfdbfe',
    ];

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsPieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={height / 3}
                    innerRadius={innerRadius}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                >
                    {data.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={defaultColors[index % defaultColors.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip formatValue={formatValue} total={total} />} />
                {showLegend && <Legend {...getLegendStyle()} />}
            </RechartsPieChart>
        </ResponsiveContainer>
    );
};
