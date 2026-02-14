/**
 * Gauge Chart Component
 * Radial gauge chart for displaying progress/compliance metrics (0-100%)
 */

import React from 'react';
import { STATUS_COLORS } from './chartUtils';

interface GaugeChartProps {
    value: number; // 0-100
    title: string;
    height?: number;
    segmentColor?: string;
    thresholds?: {
        low: number; // Red zone (< this value)
        medium: number; // Yellow zone (< this value)
        high: number; // Green zone (>= this value)
    };
}

export const GaugeChartComponent: React.FC<GaugeChartProps> = ({
    value,
    title,
    height = 250,
    thresholds = { low: 70, medium: 85, high: 100 },
}) => {
    // Constrain value to 0-100
    const normalizedValue = Math.max(0, Math.min(100, value));

    // Determine color based on thresholds
    const getColor = () => {
        if (normalizedValue < thresholds.low) return STATUS_COLORS.negative;
        if (normalizedValue < thresholds.medium) return STATUS_COLORS.warning;
        return STATUS_COLORS.positive;
    };

    const color = getColor();

    // SVG parameters for arc
    const size = 200;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;

    // Arc path (starts at -135 degrees, ends at +135 degrees)
    const startAngle = -135;
    const endAngle = 135;
    const centerX = size / 2;
    const centerY = size / 2;

    const polarToCartesian = (angle: number) => {
        const angleInRadians = ((angle - 90) * Math.PI) / 180;
        return {
            x: centerX + radius * Math.cos(angleInRadians),
            y: centerY + radius * Math.sin(angleInRadians),
        };
    };

    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);

    const backgroundPath = `
        M ${start.x} ${start.y}
        A ${radius} ${radius} 0 1 1 ${end.x} ${end.y}
    `;

    const valueAngle = startAngle + ((endAngle - startAngle) * normalizedValue) / 100;
    const valueEnd = polarToCartesian(valueAngle);

    const valuePath = `
        M ${start.x} ${start.y}
        A ${radius} ${radius} 0 ${normalizedValue > 50 ? 1 : 0} 1 ${valueEnd.x} ${valueEnd.y}
    `;

    return (
        <div className="flex flex-col items-center justify-center" style={{ height: `${height}px` }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background Arc */}
                <path
                    d={backgroundPath}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Value Arc */}
                <path
                    d={valuePath}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Center Text */}
                <text
                    x={centerX}
                    y={centerY - 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="36"
                    fontWeight="700"
                    fill="#f1f5f9"
                >
                    {Math.round(normalizedValue)}%
                </text>
                <text
                    x={centerX}
                    y={centerY + 20}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill="#94a3b8"
                >
                    {title}
                </text>
            </svg>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.negative }} />
                    <span>&lt; {thresholds.low}%</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.warning }} />
                    <span>{thresholds.low}-{thresholds.medium}%</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.positive }} />
                    <span>&ge; {thresholds.medium}%</span>
                </div>
            </div>
        </div>
    );
};
