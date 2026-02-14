/**
 * Sparkline Chart Component
 * Mini line chart for KPI cards showing 7-day historical trends
 */

import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { SEGMENT_COLORS, STATUS_COLORS } from './chartUtils';

interface DataPoint {
    date: string;
    value: number;
}

interface SparklineChartProps {
    data: DataPoint[];
    trend?: 'up' | 'down' | 'stable';
    height?: number;
    segmentColor?: keyof typeof SEGMENT_COLORS;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
    data,
    trend = 'stable',
    height = 24,
    segmentColor = 'revenue',
}) => {
    if (!data || data.length === 0) {
        return <div className="h-6 bg-slate-800/30 rounded" />;
    }

    // Determine line color based on trend
    const getLineColor = () => {
        if (trend === 'up') return STATUS_COLORS.positive;
        if (trend === 'down') return STATUS_COLORS.negative;
        return SEGMENT_COLORS[segmentColor]?.primary || STATUS_COLORS.neutral;
    };

    return (
        <div className="w-full" style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={getLineColor()}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
