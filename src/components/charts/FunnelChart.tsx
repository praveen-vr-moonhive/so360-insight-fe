/**
 * Funnel Chart Component
 * Custom funnel chart for conversion analysis (e.g., sales pipeline)
 */

import React from 'react';
import { SEGMENT_COLORS, formatNumber, formatPercentage } from './chartUtils';

interface FunnelStage {
    name: string;
    value: number;
    color?: string;
}

interface FunnelChartProps {
    data: FunnelStage[];
    height?: number;
    segmentColor?: keyof typeof SEGMENT_COLORS;
    formatValue?: (value: number) => string;
}

export const FunnelChartComponent: React.FC<FunnelChartProps> = ({
    data,
    height = 400,
    segmentColor = 'revenue',
    formatValue,
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
    const maxValue = data[0].value;

    // Calculate conversion rates
    const stagesWithConversion = data.map((stage, index) => {
        const previousValue = index > 0 ? data[index - 1].value : stage.value;
        const conversionRate = index > 0 ? (stage.value / previousValue) * 100 : 100;
        const overallRate = (stage.value / maxValue) * 100;
        return { ...stage, conversionRate, overallRate };
    });

    return (
        <div className="w-full" style={{ height: `${height}px`, padding: '20px' }}>
            {stagesWithConversion.map((stage, index) => {
                const widthPercent = (stage.value / maxValue) * 100;
                const bgColor = stage.color || (
                    index === 0 ? colors.primary :
                    index === 1 ? colors.secondary :
                    colors.tertiary
                );

                return (
                    <div key={stage.name} className="mb-4">
                        {/* Funnel Bar */}
                        <div className="relative">
                            <div
                                className="mx-auto rounded-lg transition-all duration-300 hover:opacity-90"
                                style={{
                                    width: `${Math.max(widthPercent, 20)}%`,
                                    height: '60px',
                                    backgroundColor: bgColor,
                                    opacity: 0.9,
                                }}
                            >
                                {/* Stage Content */}
                                <div className="flex items-center justify-between h-full px-4 text-white">
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{stage.name}</p>
                                        <p className="text-xs opacity-90">
                                            {formatValue ? formatValue(stage.value) : formatNumber(stage.value)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {index > 0 && (
                                            <p className="text-xs font-medium">
                                                {formatPercentage(stage.conversionRate, 1)} conversion
                                            </p>
                                        )}
                                        <p className="text-xs opacity-75">
                                            {formatPercentage(stage.overallRate, 1)} of total
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Conversion Arrow */}
                            {index < data.length - 1 && (
                                <div className="flex justify-center my-1">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        className="text-slate-600"
                                    >
                                        <path
                                            d="M10 4 L10 16 M10 16 L6 12 M10 16 L14 12"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
