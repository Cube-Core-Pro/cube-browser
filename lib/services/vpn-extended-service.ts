/**
 * VPN Extended Service - Premium Plans & Custom VPN Integration Layer
 * CUBE Nexum v7 - Complete VPN Extended Operations Service
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Types
// ============================================================================

export interface VPNTier {
  id: string;
  name: string;
  title?: string;
  description?: string;
  summary?: string;
  price?: number;
  display_price?: string;
  billing_interval?: string;
  interval?: string;
  features: string[];
  provider: string;
}

export interface TierItem {
  provider: string;
  tier: VPNTier;
}

export interface CustomVPNConfig {
  id?: string;
  name: string;
  protocol: 'OpenVPN' | 'WireGuard' | 'IKEv2';
  serverAddress: string;
  port: number;
  username?: string;
  password?: string;
  certificate?: string;
  privateKey?: string;
  publicKey?: string;
  presharedKey?: string;
}

export interface VPNConnectionStatus {
  connected: boolean;
  configId?: string;
  configName?: string;
  serverAddress?: string;
  protocol?: string;
  connectedAt?: string;
  bytesReceived?: number;
  bytesSent?: number;
  latency?: number;
}

export interface VPNProvider {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  hasFreeTier: boolean;
  supportedProtocols: string[];
}

// ============================================================================
// Premium Plans Service
// ============================================================================

export const VPNPremiumService = {
  /**
   * Get all available VPN tiers/plans
   */
  getTiers: async (): Promise<TierItem[]> => {
    return invoke<TierItem[]>('get_vpn_tiers');
  },

  /**
   * Get purchase link for a specific tier
   */
  getPurchaseLink: async (provider: string, tier: string): Promise<string> => {
    return invoke<string>('get_vpn_purchase_link', { provider, tier });
  },

  /**
   * Get available VPN providers
   */
  getProviders: async (): Promise<VPNProvider[]> => {
    return invoke<VPNProvider[]>('get_vpn_providers');
  },

  /**
   * Get provider details
   */
  getProviderDetails: async (providerId: string): Promise<VPNProvider> => {
    return invoke<VPNProvider>('get_vpn_provider_details', { providerId });
  },
};

// ============================================================================
// Custom VPN Service
// ============================================================================

export const CustomVPNService = {
  /**
   * Create a custom VPN configuration
   */
  createConfig: async (
    name: string,
    vpnType: string,
    server: string,
    port: number,
    username?: string | null,
    password?: string | null
  ): Promise<string> => {
    return invoke<string>('create_vpn_config', {
      name,
      vpnType,
      server,
      port,
      username,
      password,
    });
  },

  /**
   * Import VPN config from .ovpn file content
   */
  importConfig: async (content: string, name: string): Promise<string> => {
    return invoke<string>('import_vpn_config', { content, name });
  },

  /**
   * Connect to a custom VPN
   */
  connect: async (configId: string): Promise<void> => {
    return invoke('connect_custom_vpn', { configId });
  },

  /**
   * Disconnect from current VPN
   */
  disconnect: async (): Promise<void> => {
    return invoke('disconnect_custom_vpn');
  },

  /**
   * Get all saved custom configs
   */
  getConfigs: async (): Promise<CustomVPNConfig[]> => {
    return invoke<CustomVPNConfig[]>('get_custom_vpn_configs');
  },

  /**
   * Delete a custom config
   */
  deleteConfig: async (configId: string): Promise<void> => {
    return invoke('delete_custom_vpn_config', { configId });
  },

  /**
   * Update a custom config
   */
  updateConfig: async (configId: string, config: Partial<CustomVPNConfig>): Promise<void> => {
    return invoke('update_custom_vpn_config', { configId, config });
  },

  /**
   * Test connection to a VPN server
   */
  testConnection: async (server: string, port: number): Promise<{ success: boolean; latency?: number; error?: string }> => {
    return invoke<{ success: boolean; latency?: number; error?: string }>('test_vpn_connection', { server, port });
  },
};

// ============================================================================
// VPN Status Service
// ============================================================================

export const VPNStatusService = {
  /**
   * Get current VPN connection status
   */
  getStatus: async (): Promise<VPNConnectionStatus> => {
    return invoke<VPNConnectionStatus>('get_vpn_status');
  },

  /**
   * Get connection statistics
   */
  getStats: async (): Promise<{
    bytesReceived: number;
    bytesSent: number;
    connectedDuration: number;
    averageLatency: number;
  }> => {
    return invoke('get_vpn_connection_stats');
  },

  /**
   * Get connection logs
   */
  getLogs: async (limit?: number): Promise<string[]> => {
    return invoke<string[]>('get_vpn_logs', { limit });
  },
};

// ============================================================================
// Main VPN Extended Service Export
// ============================================================================

export const VPNExtendedService = {
  Premium: VPNPremiumService,
  Custom: CustomVPNService,
  Status: VPNStatusService,
};

export default VPNExtendedService;
