/**
 * Chart Export Component
 * Allows exporting charts as PNG images or CSV data
 */

import React, { useState } from 'react';
import { Download, FileImage, FileSpreadsheet } from 'lucide-react';

interface ChartExportProps {
    chartId: string;
    chartTitle: string;
    data: any[];
    onExportPNG?: () => void;
    onExportCSV?: () => void;
}

export const ChartExport: React.FC<ChartExportProps> = ({
    chartTitle,
    data,
    onExportPNG,
    onExportCSV,
}) => {
    const [showMenu, setShowMenu] = useState(false);

    const handleExportCSV = () => {
        if (onExportCSV) {
            onExportCSV();
        } else {
            // Default CSV export implementation
            const csv = convertToCSV(data);
            downloadCSV(csv, `${chartTitle}.csv`);
        }
        setShowMenu(false);
    };

    const handleExportPNG = () => {
        if (onExportPNG) {
            onExportPNG();
        } else {
            // Default PNG export would require html2canvas library
            // For now, just show a message
            alert('PNG export requires html2canvas library. Install it to enable this feature.');
        }
        setShowMenu(false);
    };

    const convertToCSV = (data: any[]): string => {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const rows = data.map((row) =>
            headers.map((header) => {
                const value = row[header];
                // Escape commas and quotes in CSV
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    };

    const downloadCSV = (csv: string, filename: string) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Export chart"
            >
                <Download className="w-4 h-4" />
            </button>

            {showMenu && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20">
                        <div className="py-1">
                            <button
                                onClick={handleExportPNG}
                                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 flex items-center gap-2"
                            >
                                <FileImage className="w-4 h-4" />
                                Export as PNG
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 flex items-center gap-2"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Export as CSV
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
