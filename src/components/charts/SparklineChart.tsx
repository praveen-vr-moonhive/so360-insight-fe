/**
 * Sparkline Chart Component
 * Mini line chart for KPI cards showing 7-day historical trends.
 * Pure SVG — no recharts dependency to avoid MFE singleton conflicts.
 */

import React from 'react';

interface DataPoint {
    date: string;
    value: number;
}

interface SparklineChartProps {
    data: DataPoint[];
    trend?: 'up' | 'down' | 'stable';
    height?: number;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
    data,
    trend = 'stable',
    height = 24,
}) => {
    if (!data || data.length === 0) {
        return <div className="h-6 bg-slate-800/30 rounded" />;
    }

    const getLineColor = () => {
        if (trend === 'up') return '#22c55e';
        if (trend === 'down') return '#ef4444';
        return '#64748b';
    };

    const svgWidth = 200;
    const padding = 2;
    const chartH = height - padding * 2;

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = data
        .map((d, i) => {
            const x = data.length === 1 ? svgWidth / 2 : (i / (data.length - 1)) * svgWidth;
            const y = padding + chartH - ((d.value - min) / range) * chartH;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <div className="w-full" style={{ height: `${height}px` }}>
            <svg
                viewBox={`0 0 ${svgWidth} ${height}`}
                preserveAspectRatio="none"
                className="w-full h-full"
            >
                <polyline
                    points={points}
                    fill="none"
                    stroke={getLineColor()}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
};
