import React, { useEffect, useState, useContext } from 'react';
import { ShellContext } from '@so360/shell-context';
import { insightApi } from '../services/insightApi';

interface MfeShellInitializerProps {
    children: React.ReactNode;
}

export const MfeShellInitializer: React.FC<MfeShellInitializerProps> = ({ children }) => {
    const shell = useContext(ShellContext);
    const [isSynced, setIsSynced] = useState(false);

    useEffect(() => {
        if (shell?.currentTenant?.id && shell?.currentOrg?.id) {
            // Sync tenant and org IDs with API client
            insightApi.setTenantId(shell.currentTenant.id);
            insightApi.setOrgId(shell.currentOrg.id);
            setIsSynced(true);
            console.log('Insight MFE synced with Shell context', {
                tenant: shell.currentTenant.id,
                org: shell.currentOrg.id,
            });
        } else {
            setIsSynced(false);
        }
    }, [shell?.currentTenant?.id, shell?.currentOrg?.id]);

    if (!isSynced) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400">Initializing Insight module...</div>
            </div>
        );
    }

    return <>{children}</>;
};
