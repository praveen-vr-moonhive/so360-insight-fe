import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Factory, AlertCircle, RefreshCw } from 'lucide-react';
import { formatNumber } from '../charts/chartUtils';
import { useShell } from '@so360/shell-context';
import {
    manufacturingApi,
    buildManufacturingHeaders,
    MANUFACTURING_UNAVAILABLE_MESSAGE,
    type MfgSummary,
    type WcUtil,
} from '../../services/manufacturingApi';

/**
 * Manufacturing segment for the Insight Dashboard.
 *
 * Fetches live data from manufacturing-be through `manufacturingApi`, which resolves
 * the backend base URL per environment and validates responses before parsing.
 * Renders KPIs (open MOs, on-time %, scrap %, cost variance, output) and a work-centre
 * OEE bar list. No write paths — read-only widgets.
 *
 * Failures degrade to a business-friendly state with a Retry action; technical detail
 * is logged by the API client and never rendered. The 30s poll keeps running, so the
 * metrics reappear on their own once the service recovers.
 *
 * The Manufacturing module currently aggregates its own metrics (insight-be does not
 * yet have a manufacturing segment). When insight-be adds one, this component can
 * be replaced with the standard `SegmentTabContent` flow.
 */

const NO_ORG_MESSAGE = 'Select an organization to view Manufacturing metrics.';

const fmtPct = (n: number) => `${(n ?? 0).toFixed(1)}%`;
const fmtNum = (n: number) => formatNumber(n ?? 0);

const Tile: React.FC<{ label: string; value: React.ReactNode; sub?: string; tone?: 'default' | 'pos' | 'neg' }> =
    ({ label, value, sub, tone = 'default' }) => {
        const colour = tone === 'pos' ? 'text-emerald-300' : tone === 'neg' ? 'text-rose-300' : 'text-slate-100';
        return (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 hover:bg-slate-900/70 transition-all">
                <p className="text-sm text-slate-400 mb-3">{label}</p>
                <div className={`text-3xl font-bold ${colour}`}>{value}</div>
                {sub && <div className="text-xs text-slate-500 mt-2">{sub}</div>}
            </div>
        );
    };

export const ManufacturingSegment: React.FC = () => {
    const { currentOrg, accessToken } = useShell();
    const [summary, setSummary] = useState<MfgSummary | null>(null);
    const [util, setUtil] = useState<WcUtil[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [reloadKey, setReloadKey] = useState(0);
    const retry = useCallback(() => setReloadKey((k) => k + 1), []);

    useEffect(() => {
        if (!currentOrg?.id) {
            setLoading(false);
            setError(NO_ORG_MESSAGE);
            return;
        }
        const headers = buildManufacturingHeaders(currentOrg.tenant_id || '', currentOrg.id, accessToken);
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                const [s, u] = await Promise.all([
                    manufacturingApi.getSummary(headers),
                    manufacturingApi.getWorkCenterUtilisation(headers),
                ]);
                if (cancelled) return;
                setSummary(s);
                setUtil(Array.isArray(u) ? u : []);
                // Service recovered — clear the failure state so the poll self-heals.
                setError(null);
            } catch {
                // Detail is already logged by manufacturingApi; the UI only ever
                // shows the business-friendly message.
                if (!cancelled) setError(MANUFACTURING_UNAVAILABLE_MESSAGE);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        const t = setInterval(load, 30_000);
        return () => { cancelled = true; clearInterval(t); };
    }, [currentOrg?.id, currentOrg?.tenant_id, accessToken, reloadKey]);

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
        );
    }
    // Only take over the panel when there is nothing to show. If a later poll fails
    // while data is already on screen, the tiles stay and a slim banner appears.
    if (error && !summary) {
        const isNoOrg = error === NO_ORG_MESSAGE;
        return (
            <div className="m-8 p-6 bg-slate-900/50 border border-slate-800 rounded-lg flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-100 mb-1">Manufacturing metrics unavailable</h3>
                    <p className="text-sm text-slate-400">{error}</p>
                    {!isNoOrg && (
                        <button
                            type="button"
                            onClick={retry}
                            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    )}
                </div>
            </div>
        );
    }
    if (!summary) return null;

    const variance = summary.cost_variance_pct;
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Factory className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-100">Manufacturing</h2>
                    <p className="text-sm text-slate-400">Production execution KPIs · refreshed every 30s</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-sm text-slate-400 flex-1">
                        Showing the last available figures. {error}
                    </p>
                    <button
                        type="button"
                        onClick={retry}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Tile label="Open MOs" value={summary.mo_in_progress + summary.mo_planned} sub={`${summary.mo_total} total · ${summary.mo_done} done`} />
                <Tile label="In Progress" value={summary.mo_in_progress} tone="pos" sub={`${summary.wo_open} work orders open`} />
                <Tile label="On-time %" value={fmtPct(summary.on_time_pct)} tone={summary.on_time_pct >= 90 ? 'pos' : 'neg'} sub="MOs delivered by planned end" />
                <Tile label="Cost Variance" value={fmtPct(variance)} tone={variance > 5 ? 'neg' : variance < -5 ? 'pos' : 'default'} sub={variance > 0 ? 'Actual over standard' : 'Actual under standard'} />
                <Tile label="Total Produced" value={fmtNum(summary.total_produced)} sub="units (life-to-date)" />
                <Tile label="Scrap" value={fmtPct(summary.scrap_pct)} tone={summary.scrap_pct > 3 ? 'neg' : 'default'} sub={`${fmtNum(summary.total_scrap_qty)} units scrapped`} />
                <Tile label="MOs Planned" value={summary.mo_planned} sub="awaiting start" />
                <Tile label="MOs Completed" value={summary.mo_done} tone="pos" sub="lifetime" />
            </div>

            {util.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-slate-100">Work Centre Utilisation (OEE)</h3>
                        <span className="text-xs text-slate-500">{util.length} centres</span>
                    </div>
                    <div className="space-y-4">
                        {util.map((wc) => {
                            const onTarget = wc.oee_pct >= wc.target_pct;
                            return (
                                <div key={wc.work_center_id}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div>
                                            <span className="text-sm text-slate-200">{wc.name}</span>
                                            <span className="text-xs text-slate-500 ml-2 font-mono">{wc.code}</span>
                                        </div>
                                        <div className="text-sm tabular-nums">
                                            <span className={onTarget ? 'text-emerald-300' : 'text-amber-300'}>
                                                {fmtPct(wc.oee_pct)}
                                            </span>
                                            <span className="text-slate-500"> / {wc.target_pct}%</span>
                                            <span className="text-xs text-slate-500 ml-3">{wc.wos_done}/{wc.wos_total} WO</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all ${onTarget ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                             style={{ width: `${Math.min(wc.oee_pct, 100)}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="text-xs text-slate-500 text-center pt-2">
                Source: Manufacturing module · live polling
            </div>
        </div>
    );
};
