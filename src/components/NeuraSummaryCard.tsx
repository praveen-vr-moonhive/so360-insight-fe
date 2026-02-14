import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface NeuraSummaryCardProps {
    title: string;
    icon: string;
    color: 'blue' | 'green' | 'purple' | 'orange';
    summary: string | null;
    metrics?: Record<string, any>;
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
}

export const NeuraSummaryCard: React.FC<NeuraSummaryCardProps> = ({
    title,
    icon,
    color,
    summary,
    metrics,
    loading = false,
    error = null,
    onRetry,
}) => {
    const IconComponent = (LucideIcons as any)[icon];

    // Color mappings
    const colorClasses = {
        blue: {
            gradient: 'from-blue-900/20 to-blue-800/10',
            border: 'border-blue-500/30',
            icon: 'text-blue-400',
            badge: 'bg-blue-500/20 text-blue-400',
            button: 'bg-blue-600 hover:bg-blue-700',
        },
        green: {
            gradient: 'from-green-900/20 to-green-800/10',
            border: 'border-green-500/30',
            icon: 'text-green-400',
            badge: 'bg-green-500/20 text-green-400',
            button: 'bg-green-600 hover:bg-green-700',
        },
        purple: {
            gradient: 'from-purple-900/20 to-purple-800/10',
            border: 'border-purple-500/30',
            icon: 'text-purple-400',
            badge: 'bg-purple-500/20 text-purple-400',
            button: 'bg-purple-600 hover:bg-purple-700',
        },
        orange: {
            gradient: 'from-orange-900/20 to-orange-800/10',
            border: 'border-orange-500/30',
            icon: 'text-orange-400',
            badge: 'bg-orange-500/20 text-orange-400',
            button: 'bg-orange-600 hover:bg-orange-700',
        },
    };

    const colors = colorClasses[color];

    // Loading state
    if (loading) {
        return (
            <div
                className={`
                    bg-gradient-to-br ${colors.gradient}
                    border ${colors.border}
                    rounded-lg p-6 animate-pulse
                `}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="h-8 w-8 bg-slate-700 rounded"></div>
                    <div className="h-6 w-12 bg-slate-700 rounded-full"></div>
                </div>
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div
                className={`
                    bg-gradient-to-br ${colors.gradient}
                    border ${colors.border}
                    rounded-lg p-6
                `}
            >
                <div className="flex items-center justify-between mb-4">
                    {IconComponent && <IconComponent className={`w-8 h-8 ${colors.icon}`} />}
                    <span className={`${colors.badge} px-2 py-1 text-xs rounded-full flex items-center gap-1`}>
                        <Sparkles className="w-3 h-3" />
                        AI
                    </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-3">{title}</h3>
                <div className="flex items-start gap-2 text-red-400 text-sm mb-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>AI insights temporarily unavailable</p>
                </div>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className={`${colors.button} text-white px-3 py-1.5 rounded text-sm transition-colors`}
                    >
                        Retry
                    </button>
                )}
            </div>
        );
    }

    // Main content state
    return (
        <div
            className={`
                bg-gradient-to-br ${colors.gradient}
                border ${colors.border}
                rounded-lg p-6 transition-all hover:shadow-lg
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                {IconComponent && <IconComponent className={`w-8 h-8 ${colors.icon}`} />}
                <span className={`${colors.badge} px-2 py-1 text-xs rounded-full flex items-center gap-1`}>
                    <Sparkles className="w-3 h-3" />
                    AI
                </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-slate-100 mb-3">{title}</h3>

            {/* Summary */}
            {summary && (
                <div className="text-sm text-slate-300 mb-4 prose-sm max-w-none leading-relaxed">
                    {summary.split('\n').map((line, idx) => {
                        // Handle markdown bold
                        const parts = line.split(/\*\*(.*?)\*\*/g);
                        return (
                            <p key={idx} className="mb-2 last:mb-0">
                                {parts.map((part, i) =>
                                    i % 2 === 0 ? (
                                        <span key={i}>{part}</span>
                                    ) : (
                                        <strong key={i} className="text-slate-100 font-semibold">
                                            {part}
                                        </strong>
                                    )
                                )}
                            </p>
                        );
                    })}
                </div>
            )}

            {/* Metrics */}
            {metrics && Object.keys(metrics).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {Object.entries(metrics)
                        .slice(0, 4) // Show max 4 metrics
                        .map(([key, value]) => (
                            <div
                                key={key}
                                className="bg-slate-800/50 px-3 py-1 rounded text-xs text-slate-300"
                            >
                                <span className="text-slate-400">{formatMetricKey(key)}:</span>{' '}
                                <span className="font-semibold">{formatMetricValue(value)}</span>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

// Helper functions
function formatMetricKey(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
        .trim();
}

function formatMetricValue(value: any): string {
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return value.toLocaleString();
        }
        return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return String(value);
}
