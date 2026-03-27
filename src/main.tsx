import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

import { ShellContext, ShellContextType } from '@so360/shell-context';

/**
 * Mock Shell Provider for Standalone Development.
 * In production, the Shell host provides real context.
 * This mock allows independent development and testing of the MFE.
 */
const MockShellProvider = ({ children }: { children: React.ReactNode }) => {
    const mockContext: ShellContextType = {
        user: {
            id: '8f4e6a2b-1c3d-4e5f-9a7b-2c3d4e5f6a7b',
            email: 'analytics@so360.com',
            full_name: 'Analytics Admin',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=analytics'
        },
        tenants: [
            { id: '3cf1c619-cb9b-48ac-9387-447418d1beee', name: 'Acme Corp' }
        ],
        currentTenant: { id: '3cf1c619-cb9b-48ac-9387-447418d1beee', name: 'Acme Corp' },
        orgs: [
            { id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', name: 'Primary Org', tenant_id: '3cf1c619-cb9b-48ac-9387-447418d1beee' }
        ],
        currentOrg: { id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', name: 'Primary Org', tenant_id: '3cf1c619-cb9b-48ac-9387-447418d1beee' },
        isLoading: false,
        error: null,
        accessToken: 'mock-access-token',
        refreshContext: async () => { console.log('[Mock] Refresh context'); },
        setUser: () => { },
        setCurrentTenant: () => { },
        setCurrentOrg: () => { },
        enabledModules: ['module:insight'],
        isModuleEnabled: () => true,
        toggleModule: async () => { console.log('[Mock] Toggle module'); },
        refreshModules: async () => { console.log('[Mock] Refresh modules'); },
        modulesLoading: false,
        notifications: [],
        unreadCount: 0,
        markAsRead: async () => { },
        markAllAsRead: async () => { },
        emitNotification: async () => ({ success: true, notificationIds: [], errors: [] }),
        recordActivity: async () => { },
        // Business Settings (mock for standalone development)
        businessSettings: {
            id: 'mock-settings-id',
            org_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            base_currency: 'USD',
            timezone: 'America/New_York',
            fiscal_year_start_month: 1,
            date_format: 'MM/DD/YYYY',
            number_format: '1,234.56',
            document_language: 'en-US',
            is_multi_currency_enabled: false,
            exchange_rate_source: 'manual',
            tax_regime: 'standard',
            default_tax_region: 'US',
            is_tax_inclusive_pricing: false,
            is_reverse_charge_applicable: false,
            accounting_method: 'accrual' as const,
            is_inventory_enabled: true,
            valuation_method: 'FIFO' as const,
            allow_negative_stock: false,
            rounding_precision: 2,
            document_settings: {
                invoice_prefix: 'INV-',
                auto_numbering: true,
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        businessSettingsLoading: false,
        refreshBusinessSettings: async () => { console.log('[Mock] Refresh business settings'); },
    };

    return (
        <ShellContext.Provider value={mockContext}>
            {children}
        </ShellContext.Provider>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <MockShellProvider>
            <App />
        </MockShellProvider>
    </BrowserRouter>
);
