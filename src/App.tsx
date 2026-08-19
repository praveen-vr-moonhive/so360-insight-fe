import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useShellBridge } from '@so360/shell-context';
import { FeatureRoute } from '@so360/design-system';
import { MfeShellInitializer } from './components/MfeShellInitializer';

// Route components are lazy-loaded so recharts (~150KB gz, pulled in transitively
// by the dashboard's chart components) and the route trees are split out of the
// initial federated chunk and fetched only when a route actually renders.
const InsightDashboard = lazy(() =>
    import('./pages/InsightDashboard').then(m => ({ default: m.InsightDashboard }))
);
const AlertsPage = lazy(() =>
    import('./pages/AlertsPage').then(m => ({ default: m.AlertsPage }))
);

// Lightweight fallback shown while a lazy route chunk loads. Mirrors the
// existing "initializing" visual language so the swap is imperceptible.
const RouteFallback: React.FC = () => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading…</div>
    </div>
);

// Flag-to-segment map: segments that require a specific plan flag
const SEGMENT_FLAG_MAP: Record<string, string> = {
    finance: 'action:insight:export',
};

// Route-level upgrade prompt shown when a segment's feature is `locked`.
const UpgradeLocked = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center px-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-100">This feature is part of a higher plan</h2>
                <p className="text-sm text-slate-400 mt-1">Upgrade your plan to unlock it.</p>
            </div>
            <button
                type="button"
                onClick={() => navigate('/org/billing')}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
                Upgrade plan
            </button>
        </div>
    );
};

// Route-level panel shown when a segment's feature is `disabled` (admin turned it off).
const FeatureUnavailable = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 text-center px-6">
        <h2 className="text-lg font-semibold text-slate-100">Feature unavailable</h2>
        <p className="text-sm text-slate-400">This feature has been turned off for your organization.</p>
    </div>
);

// Guards a route on the signed-in user's ROLE PERMISSIONS — the page-level
// counterpart to the plan-flag gate above. A plan flag answers "is this feature
// in the plan"; this answers "may this user open it". Both must pass, so the two
// compose rather than replace one another.
//
// Fail-closed: while entitlements resolve (or with no bridge at all) the page is
// withheld rather than flashed. Denial renders an explanatory notice instead of
// a blank screen so "not allowed" is distinguishable from "broken". Codes are
// wildcard-aware via the shell bridge, matching the backend resolver exactly.
const PermissionGuard = ({ permission, children }: { permission: string | string[]; children: React.ReactNode }) => {
    const shell = useShellBridge();
    if (!shell || !shell.permissionsLoaded) return null;
    const codes = Array.isArray(permission) ? permission : [permission];
    const allowed = shell.hasAnyPermission
        ? shell.hasAnyPermission(...codes)
        : codes.some((c: string) => shell.hasPermission?.(c) ?? false);
    if (allowed) return <>{children}</>;
    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">You don&apos;t have access to this page</h2>
            <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
                Your role doesn&apos;t include permission for this page. Ask an administrator if you need it.
            </p>
        </div>
    );
};

// Renders InsightDashboard with the correct tab active for path-based routes
// e.g. /insight/revenue → InsightDashboard with initialTab="revenue"
// Keeps URL as-is so shell sidenav active state matches correctly.
// Segments listed in SEGMENT_FLAG_MAP are gated on the resolved 5-state model:
// enabled→render · read_only→inert · locked→upgrade prompt · disabled→unavailable · hidden→redirect.
const SegmentRoute: React.FC = () => {
    const { segmentCode } = useParams<{ segmentCode: string }>();
    const shell = useShellBridge();
    const requiredFlag = segmentCode ? SEGMENT_FLAG_MAP[segmentCode] : undefined;
    const dashboard = <InsightDashboard initialTab={segmentCode} />;
    if (!requiredFlag) return dashboard;
    const state = shell?.getFeatureState ? shell.getFeatureState(requiredFlag) : 'enabled';
    return (
        <FeatureRoute
            state={state}
            loading={(shell?.effectiveFlagsLoaded === false)}
            hiddenFallback={<Navigate to="/" replace />}
            lockedFallback={<UpgradeLocked />}
            disabledFallback={<FeatureUnavailable />}
        >
            {dashboard}
        </FeatureRoute>
    );
};

function App() {
    return (
        <MfeShellInitializer>
            <Suspense fallback={<RouteFallback />}>
                <Routes>
                    <Route path="/" element={<InsightDashboard />} />
                    <Route path="alerts" element={<PermissionGuard permission="analytics.view"><AlertsPage /></PermissionGuard>} />

                    {/* Path-based segment routes — URL stays as /insight/revenue etc. */}
                    <Route path=":segmentCode" element={<PermissionGuard permission="analytics.view"><SegmentRoute /></PermissionGuard>} />
                </Routes>
            </Suspense>
        </MfeShellInitializer>
    );
}

export default App;
