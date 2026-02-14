import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { TabNavigation, type Tab } from '../components/TabNavigation';
import { AtAGlanceView } from '../components/AtAGlanceView';
import { SegmentTabContent } from '../components/SegmentTabContent';
import { insightApi } from '../services/insightApi';
import type { SegmentSummary } from '../types/insight';

export const InsightDashboard: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<string>('at-a-glance');
    const [segments, setSegments] = useState<SegmentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize active tab from URL param
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, []);

    // Fetch segments on mount
    useEffect(() => {
        fetchSegments();
    }, []);

    const fetchSegments = async () => {
        try {
            setLoading(true);
            const data = await insightApi.getSegments();
            setSegments(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load segments');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        // Update URL param
        setSearchParams({ tab: tabId });
    };

    const handleSegmentClick = (segmentCode: string) => {
        setActiveTab(segmentCode);
        setSearchParams({ tab: segmentCode });
    };

    // Build tabs array
    const tabs: Tab[] = [
        { id: 'at-a-glance', label: 'At a Glance', icon: 'LayoutDashboard' },
        { id: 'revenue', label: 'Revenue', icon: 'TrendingUp' },
        { id: 'execution', label: 'Execution', icon: 'Zap' },
        { id: 'delivery', label: 'Delivery', icon: 'Truck' },
        { id: 'workforce', label: 'Workforce', icon: 'Users' },
        { id: 'finance', label: 'Finance', icon: 'DollarSign' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-10 bg-slate-800 rounded w-64 mb-8"></div>
                        <div className="h-12 bg-slate-900 rounded mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-48 bg-slate-900 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-400 mb-2">Failed to Load Dashboard</h3>
                            <p className="text-sm text-red-300">{error}</p>
                            <button
                                onClick={fetchSegments}
                                className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Page Header */}
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-100">Insight Dashboard</h1>
                    <p className="text-slate-400 mt-1">
                        Monitor key metrics across all business segments
                    </p>
                </header>

                {/* Tab Navigation */}
                <TabNavigation tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

                {/* Tab Content */}
                <div className="mt-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'at-a-glance' ? (
                                <AtAGlanceView segments={segments} onSegmentClick={handleSegmentClick} />
                            ) : (
                                <SegmentTabContent segmentCode={activeTab} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
