import React from 'react';
import * as LucideIcons from 'lucide-react';
import { useModules } from '@so360/shell-context';

const MODULE_REGISTRY = [
    { id: 'crm',         name: 'CRM',          icon: 'Users',         color: 'blue',   kpis: 5, signals: 2 },
    { id: 'accounting',  name: 'Accounting',   icon: 'Calculator',    color: 'green',  kpis: 7, signals: 4 },
    { id: 'inventory',   name: 'Inventory',    icon: 'Package',       color: 'orange', kpis: 3, signals: 3 },
    { id: 'procurement', name: 'Procurement',  icon: 'ShoppingCart',  color: 'purple', kpis: 3, signals: 2 },
    { id: 'projects',    name: 'Projects',     icon: 'FolderKanban',  color: 'sky',    kpis: 3, signals: 2 },
    { id: 'flow',        name: 'Flow',         icon: 'GitBranch',     color: 'indigo', kpis: 2, signals: 1 },
    { id: 'people',      name: 'People',       icon: 'UserCheck',     color: 'pink',   kpis: 3, signals: 1 },
    { id: 'timesheet',   name: 'Timesheet',    icon: 'Clock',         color: 'yellow', kpis: 2, signals: 2 },
    { id: 'dailystore',  name: 'Daily Store',  icon: 'Store',         color: 'teal',   kpis: 5, signals: 0 },
];

export const ModuleCoveragePanel: React.FC = () => {
    const { isModuleEnabled } = useModules();

    const activeCount = MODULE_REGISTRY.filter(m => isModuleEnabled(m.id)).length;
    const totalKpis = MODULE_REGISTRY.filter(m => isModuleEnabled(m.id)).reduce((s, m) => s + m.kpis, 0);
    const totalSignals = MODULE_REGISTRY.filter(m => isModuleEnabled(m.id)).reduce((s, m) => s + m.signals, 0);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-100">Module Coverage</h2>
                <span className="text-sm text-slate-400">
                    {activeCount} of {MODULE_REGISTRY.length} modules active
                    &nbsp;·&nbsp;{totalKpis} KPIs&nbsp;·&nbsp;{totalSignals} signals
                </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {MODULE_REGISTRY.map(mod => {
                    const enabled = isModuleEnabled(mod.id);
                    const Icon = (LucideIcons as any)[mod.icon];
                    return (
                        <div key={mod.id} className={`
                            rounded-lg border p-3 flex flex-col gap-1.5
                            ${enabled
                                ? 'bg-slate-900/60 border-slate-700'
                                : 'bg-slate-900/20 border-slate-800 opacity-50'}
                        `}>
                            <div className="flex items-center justify-between">
                                {Icon && <Icon className={`w-4 h-4 ${enabled ? 'text-slate-300' : 'text-slate-600'}`} />}
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                    enabled
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-slate-800 text-slate-600'
                                }`}>
                                    {enabled ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className={`text-sm font-semibold ${enabled ? 'text-slate-200' : 'text-slate-600'}`}>
                                {mod.name}
                            </p>
                            <p className={`text-xs ${enabled ? 'text-slate-500' : 'text-slate-700'}`}>
                                {mod.kpis} KPIs · {mod.signals} signals
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
