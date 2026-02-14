import React, { useEffect, useState } from 'react';
import { AlertCircle, Filter } from 'lucide-react';
import { insightApi } from '../services/insightApi';
import { SignalCard } from '../components/SignalCard';
import type { Signal } from '../types/insight';

export const SignalsPage: React.FC = () => {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [loading, setLoading] = useState(true);
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [unresolvedOnly, setUnresolvedOnly] = useState(true);

    useEffect(() => {
        loadSignals();
    }, [severityFilter, unresolvedOnly]);

    const loadSignals = async () => {
        try {
            setLoading(true);
            const response = await insightApi.getSignals({
                severity: severityFilter !== 'all' ? severityFilter : undefined,
                unresolved_only: unresolvedOnly,
                limit: 50,
            });
            setSignals(response.data);
        } catch (err) {
            console.error('Failed to load signals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResolveSignal = async (signalId: string) => {
        try {
            await insightApi.resolveSignal(signalId, 'Resolved from signals page');
            loadSignals();
        } catch (err) {
            console.error('Failed to resolve signal:', err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-8 h-8 text-yellow-500" />
                        <h1 className="text-3xl font-bold text-slate-100">Signals</h1>
                    </div>
                    <p className="text-slate-400">Manage and resolve intelligent alerts</p>
                </div>

                {/* Filters */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-400">Filters</span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div>
                            <label className="text-sm text-slate-400 block mb-2">Severity</label>
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm"
                            >
                                <option value="all">All</option>
                                <option value="critical">Critical</option>
                                <option value="warning">Warning</option>
                                <option value="info">Info</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-slate-400 block mb-2">Status</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setUnresolvedOnly(true)}
                                    className={`px-3 py-2 text-sm rounded transition-colors ${
                                        unresolvedOnly
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                                >
                                    Unresolved
                                </button>
                                <button
                                    onClick={() => setUnresolvedOnly(false)}
                                    className={`px-3 py-2 text-sm rounded transition-colors ${
                                        !unresolvedOnly
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                                >
                                    All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signals List */}
                {loading ? (
                    <div className="text-center text-slate-400 py-12">Loading signals...</div>
                ) : signals.length > 0 ? (
                    <div className="space-y-4">
                        {signals.map((signal) => (
                            <SignalCard key={signal.id} signal={signal} onResolve={handleResolveSignal} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg mb-2">No signals found</p>
                        <p className="text-slate-500 text-sm">
                            {unresolvedOnly ? 'All signals have been resolved!' : 'No signals match the current filters.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
