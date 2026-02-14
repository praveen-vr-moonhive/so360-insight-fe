import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

export interface Tab {
    id: string;
    label: string;
    icon?: string;
}

interface TabNavigationProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (tabId: string) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onChange }) => {
    const getIcon = (iconName?: string) => {
        if (!iconName) return null;
        const IconComponent = (LucideIcons as any)[iconName];
        if (!IconComponent) return null;
        return <IconComponent className="w-5 h-5" />;
    };

    return (
        <div className="bg-slate-900/50 border-b border-slate-800 overflow-x-auto">
            <div className="flex min-w-max">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={`
                                relative px-6 py-3 text-sm font-medium transition-all duration-200
                                flex items-center gap-2 whitespace-nowrap
                                ${
                                    isActive
                                        ? 'text-blue-500 bg-slate-900/70'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                                }
                            `}
                        >
                            {tab.icon && getIcon(tab.icon)}
                            <span>{tab.label}</span>

                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
