/**
 * Chart Container Component
 * Wraps charts with a consistent header, description, and export functionality
 */

import React from 'react';
import { ChartExport } from './ChartExport';

interface ChartContainerProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    chartId: string;
    exportData?: any[];
    onExportPNG?: () => void;
    onExportCSV?: () => void;
    className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
    title,
    description,
    children,
    chartId,
    exportData = [],
    onExportPNG,
    onExportCSV,
    className = '',
}) => {
    return (
        <div className={`bg-slate-900/50 border border-slate-800 rounded-lg p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
                    {description && (
                        <p className="text-sm text-slate-400 mt-1">{description}</p>
                    )}
                </div>
                {exportData.length > 0 && (
                    <ChartExport
                        chartId={chartId}
                        chartTitle={title}
                        data={exportData}
                        onExportPNG={onExportPNG}
                        onExportCSV={onExportCSV}
                    />
                )}
            </div>

            {/* Chart Content */}
            <div id={chartId}>{children}</div>
        </div>
    );
};
