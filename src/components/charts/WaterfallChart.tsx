/**
 * Waterfall Chart Component
 * Shows cumulative effect of sequential positive and negative values (e.g., cash flow)
 */

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from 'recharts';
import {
    STATUS_COLORS,
    formatCurrency,
    getTooltipStyle,
    getAxisStyle,
    getGridStyle,
} from './chartUtils';

interface WaterfallData {
    name: string;
    value: number;
    isTotal?: boolean;
}

interface WaterfallChartProps {
    data: WaterfallData[];
    height?: number;
    formatValue?: (value: number) => string;
    title?: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    formatValue?: (value: number) => string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, formatValue }) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;

    return (
        <div style={getTooltipStyle().contentStyle}>
            <p style={getTooltipStyle().labelStyle}>{data.name}</p>
            <p style={{ ...getTooltipStyle().itemStyle, color: data.value >= 0 ? STATUS_COLORS.positive : STATUS_COLORS.negative }}>
                {formatValue ? formatValue(Math.abs(data.value)) : formatCurrency(Math.abs(data.value))}
            </p>
        </div>
    );
};

export const WaterfallChartComponent: React.FC<WaterfallChartProps> = ({
    data,
    height = 350,
    formatValue,
    title,
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

    // Calculate cumulative values for positioning
    let cumulativeValue = 0;
    const chartData = data.map((item) => {
        const startValue = item.isTotal ? 0 : cumulativeValue;
        const endValue = item.isTotal ? item.value : cumulativeValue + item.value;
        cumulativeValue = item.isTotal ? item.value : endValue;

        return {
            ...item,
            start: Math.min(startValue, endValue),
            end: Math.max(startValue, endValue),
            displayValue: [Math.min(startValue, endValue), Math.max(startValue, endValue)],
        };
    });

    return (
        <div className="w-full">
            {title && <h3 className="text-sm font-medium text-slate-300 mb-2 px-4">{title}</h3>}
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid {...getGridStyle()} />
                    <XAxis
                        dataKey="name"
                        {...getAxisStyle()}
                        angle={-15}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis
                        {...getAxisStyle()}
                        tickFormatter={formatValue || ((value) => formatCurrency(value))}
                    />
                    <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
                    <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
                    <Bar dataKey="displayValue" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => {
                            let fillColor;
                            if (entry.isTotal) {
                                fillColor = '#3b82f6'; // blue for totals
                            } else if (entry.value >= 0) {
                                fillColor = STATUS_COLORS.positive;
                            } else {
                                fillColor = STATUS_COLORS.negative;
                            }

                            return <Cell key={`cell-${index}`} fill={fillColor} />;
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
