import React from 'react';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface NeuraSummaryCardProps {
    title: string;
    icon: string;
    color: 'blue' | 'green' | 'purple' | 'orange';
    summary: string | null;
    metrics?: Record<string, any>;
    generatedAt?: string | null;  // ISO timestamp of when summary was generated
    cached?: boolean;             // Whether this came from cache
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    onRegenerate?: () => void;    // Force-refresh from Neura
    regenerating?: boolean;       // True while regeneration is in progress
}

export const NeuraSummaryCard: React.FC<NeuraSummaryCardProps> = ({
    title,
    icon,
    color,
    summary,
    generatedAt,
    cached,
    loading = false,
    error = null,
    onRetry,
    onRegenerate,
    regenerating = false,
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
            regenerate: 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10',
        },
        green: {
            gradient: 'from-green-900/20 to-green-800/10',
            border: 'border-green-500/30',
            icon: 'text-green-400',
            badge: 'bg-green-500/20 text-green-400',
            button: 'bg-green-600 hover:bg-green-700',
            regenerate: 'text-green-400 hover:text-green-300 hover:bg-green-500/10',
        },
        purple: {
            gradient: 'from-purple-900/20 to-purple-800/10',
            border: 'border-purple-500/30',
            icon: 'text-purple-400',
            badge: 'bg-purple-500/20 text-purple-400',
            button: 'bg-purple-600 hover:bg-purple-700',
            regenerate: 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10',
        },
        orange: {
            gradient: 'from-orange-900/20 to-orange-800/10',
            border: 'border-orange-500/30',
            icon: 'text-orange-400',
            badge: 'bg-orange-500/20 text-orange-400',
            button: 'bg-orange-600 hover:bg-orange-700',
            regenerate: 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10',
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
                <div className="flex items-center gap-3">
                    {IconComponent && <IconComponent className={`w-8 h-8 ${colors.icon}`} />}
                </div>
                <div className="flex items-center gap-2">
                    {/* Regenerate button */}
                    {onRegenerate && (
                        <button
                            onClick={onRegenerate}
                            disabled={regenerating}
                            title="Regenerate AI summary"
                            className={`
                                ${colors.regenerate}
                                p-1.5 rounded transition-colors disabled:opacity-40
                            `}
                        >
                            <RefreshCw
                                className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`}
                            />
                        </button>
                    )}
                    <span className={`${colors.badge} px-2 py-1 text-xs rounded-full flex items-center gap-1`}>
                        <Sparkles className="w-3 h-3" />
                        AI
                    </span>
                </div>
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

            {/* Footer: generated timestamp */}
            {generatedAt && (
                <p className="text-xs text-slate-500 mt-3">
                    {cached ? 'Cached' : 'Generated'} {formatRelativeTime(generatedAt)}
                </p>
            )}
        </div>
    );
};

function formatRelativeTime(isoTimestamp: string): string {
    const diff = Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}
