/**
 * Chart Utilities
 * Shared utilities for chart components including colors, formatters, and theme constants
 */

// Color Palettes by Segment
export const SEGMENT_COLORS = {
    revenue: {
        primary: '#3b82f6', // blue-500
        secondary: '#60a5fa', // blue-400
        tertiary: '#93c5fd', // blue-300
        gradient: ['#3b82f6', '#60a5fa'],
    },
    execution: {
        primary: '#a855f7', // purple-500
        secondary: '#c084fc', // purple-400
        tertiary: '#d8b4fe', // purple-300
        gradient: ['#a855f7', '#c084fc'],
    },
    delivery: {
        primary: '#10b981', // green-500
        secondary: '#34d399', // green-400
        tertiary: '#6ee7b7', // green-300
        gradient: ['#10b981', '#34d399'],
    },
    workforce: {
        primary: '#f97316', // orange-500
        secondary: '#fb923c', // orange-400
        tertiary: '#fdba74', // orange-300
        gradient: ['#f97316', '#fb923c'],
    },
    finance: {
        primary: '#ef4444', // red-500
        secondary: '#f87171', // red-400
        tertiary: '#fca5a5', // red-300
        gradient: ['#ef4444', '#f87171'],
    },
};

// Status Colors
export const STATUS_COLORS = {
    positive: '#10b981', // green-500
    negative: '#ef4444', // red-500
    neutral: '#94a3b8', // slate-400
    warning: '#f59e0b', // amber-500
    info: '#3b82f6', // blue-500
};

// Dark Theme Colors (consistent with SO360 design system)
export const THEME_COLORS = {
    background: '#0f172a', // slate-900
    cardBackground: 'rgba(15, 23, 42, 0.5)', // slate-900/50
    border: '#1e293b', // slate-800
    text: {
        primary: '#f1f5f9', // slate-100
        secondary: '#94a3b8', // slate-400
        tertiary: '#64748b', // slate-500
    },
    grid: '#1e293b', // slate-800
    tooltip: {
        background: '#0f172a', // slate-900
        border: '#334155', // slate-700
        text: '#cbd5e1', // slate-300
    },
};

// Number Formatters
export const formatNumber = (value: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};

export const formatCurrency = (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
    return `${formatNumber(value, decimals)}%`;
};

export const formatCompactNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    }).format(value);
};

// Date Formatters
export const formatDate = (date: Date | string, format: 'short' | 'medium' | 'long' = 'short'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    switch (format) {
        case 'short':
            return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        case 'medium':
            return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        case 'long':
            return dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        default:
            return dateObj.toLocaleDateString('en-US');
    }
};

export const formatDateTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

// Tooltip Style Generator
export const getTooltipStyle = () => ({
    contentStyle: {
        backgroundColor: THEME_COLORS.tooltip.background,
        border: `1px solid ${THEME_COLORS.tooltip.border}`,
        borderRadius: '0.5rem',
        padding: '0.75rem',
        color: THEME_COLORS.tooltip.text,
    },
    labelStyle: {
        color: THEME_COLORS.text.secondary,
        marginBottom: '0.25rem',
        fontSize: '0.875rem',
    },
    itemStyle: {
        color: THEME_COLORS.text.primary,
        fontSize: '0.875rem',
        padding: '0.125rem 0',
    },
});

// Chart Responsive Container Props
export const getResponsiveContainerProps = (height: number = 300) => ({
    width: '100%',
    height,
});

// Axis Style
export const getAxisStyle = () => ({
    stroke: THEME_COLORS.text.tertiary,
    fontSize: 12,
    fill: THEME_COLORS.text.tertiary,
});

// Grid Style
export const getGridStyle = () => ({
    stroke: THEME_COLORS.grid,
    strokeDasharray: '3 3',
    opacity: 0.2,
});

// Legend Style
export const getLegendStyle = () => ({
    iconSize: 12,
    fontSize: 12,
    color: THEME_COLORS.text.secondary,
});

// Calculate trend percentage
export const calculateTrendPercentage = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
};

// Get trend direction
export const getTrendDirection = (percentage: number): 'up' | 'down' | 'stable' => {
    if (Math.abs(percentage) < 1) return 'stable';
    return percentage > 0 ? 'up' : 'down';
};

// Get color by value (for heatmaps)
export const getHeatmapColor = (value: number, min: number, max: number): string => {
    const normalized = (value - min) / (max - min);

    if (normalized < 0.2) return '#1e293b'; // slate-800
    if (normalized < 0.4) return '#334155'; // slate-700
    if (normalized < 0.6) return '#475569'; // slate-600
    if (normalized < 0.8) return '#64748b'; // slate-500
    return '#94a3b8'; // slate-400
};

// Generate data point labels
export const generateLabels = (data: any[], key: string): string[] => {
    return data.map(item => item[key]);
};

// Find min/max values for scaling
export const getMinMaxValues = (data: any[], key: string): { min: number; max: number } => {
    const values = data.map(item => item[key]);
    return {
        min: Math.min(...values),
        max: Math.max(...values),
    };
};
