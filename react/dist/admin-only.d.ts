import { ComponentType } from 'react';

declare interface AdminGroupConfig {
    id: string;
    label: string;
    order: number;
}

/** Matches the AdminPlugin interface from @cedros/login-react/admin-only */
export declare interface AdminPlugin {
    id: string;
    name: string;
    version: string;
    cssNamespace: string;
    groups?: AdminGroupConfig[];
    sections: AdminSectionConfig[];
    components: Record<string, ComponentType<AdminSectionProps>>;
    createPluginContext: (hostContext: HostContext) => PluginContext;
    checkPermission: (permission: string, hostContext: HostContext) => boolean;
}

declare interface AdminSectionConfig {
    id: string;
    label: string;
    group: string;
    order: number;
    requiredPermission?: string;
}

export declare interface AdminSectionProps {
    pluginContext: PluginContext;
}

export declare const cedrosTradePlugin: AdminPlugin;

export declare interface HostContext {
    cedrosLogin?: {
        user: {
            id: string;
            email?: string;
            name?: string;
        } | null;
        getAccessToken: () => string | null;
        serverUrl: string;
    };
    cedrosTrade?: {
        serverUrl: string;
    };
    org?: {
        orgId: string;
        role: string;
        permissions: string[];
    };
    [key: string]: unknown;
}

export declare interface PluginContext {
    serverUrl: string;
    getAccessToken: () => string | null;
}

export { }
