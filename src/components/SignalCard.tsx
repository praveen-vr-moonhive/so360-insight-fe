import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, ArrowRight } from 'lucide-react';
import type { Signal } from '../types/insight';
import { useFormatters } from '@so360/formatters';
import { useShell } from '@so360/shell-context';

interface SignalCardProps {
    signal: Signal;
    onResolve: (signalId: string) => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal, onResolve }) => {
    const { businessSettings } = useShell();
    const formatters = useFormatters({
        currency: businessSettings?.base_currency || 'USD',
        locale: businessSettings?.document_language || 'en-US',
        timezone: businessSettings?.timezone || 'UTC',
    });

    const getSeverityIcon = () => {
        switch (signal.severity) {
            case 'critical':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getSeverityColor = () => {
        switch (signal.severity) {
            case 'critical':
                return 'border-red-500/30 bg-red-500/5';
            case 'warning':
                return 'border-yellow-500/30 bg-yellow-500/5';
            case 'info':
                return 'border-blue-500/30 bg-blue-500/5';
        }
    };

    const getSeverityBadgeColor = () => {
        switch (signal.severity) {
            case 'critical':
                return 'bg-red-500/20 text-red-400';
            case 'warning':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'info':
                return 'bg-blue-500/20 text-blue-400';
        }
    };

    const hasActions = signal.recommended_actions && signal.recommended_actions.length > 0;

    const handleNavigate = (path: string) => {
        window.location.href = path;
    };

    return (
        <div className={`border rounded-lg p-4 ${getSeverityColor()}`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon()}
                    <div className="flex-1">
                        <h3 className="text-slate-100 font-semibold mb-1">{signal.title}</h3>
                        <p className="text-sm text-slate-400">{signal.description}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadgeColor()}`}>
                    {signal.severity.toUpperCase()}
                </span>
            </div>

            {/* Recommended Actions */}
            {hasActions && !signal.resolved_at && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {signal.recommended_actions!.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleNavigate(action.path)}
                            title={action.description}
                            className="flex items-center gap-1.5 px-2.5 py-1 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-slate-100 text-xs rounded transition-colors bg-slate-800/50 hover:bg-slate-700/50"
                        >
                            {action.label}
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-slate-500">
                    {formatters.formatDateTime(signal.created_at)}
                </div>

                {!signal.resolved_at ? (
                    <button
                        onClick={() => onResolve(signal.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    >
                        Resolve
                    </button>
                ) : (
                    <div className="flex items-center gap-1 text-green-500 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Resolved
                    </div>
                )}
            </div>
        </div>
    );
};
