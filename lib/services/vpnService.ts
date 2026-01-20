/**
 * VPN Service - Enterprise-grade VPN management
 * 
 * Provides complete VPN functionality including:
 * - Server selection and connection management
 * - Kill switch and split tunneling
 * - Connection logging and monitoring
 * - Multi-protocol support (OpenVPN, WireGuard)
 * 
 * @module vpnService
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('vpnService');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * VPN Server configuration
 */
export interface VPNServer {
  id: string;
  name: string;
  country: string;
  city: string;
  ip: string;
  protocol: 'OpenVPN' | 'WireGuard';
  load: number; // 0-100 (server load percentage)
  ping: number; // milliseconds
  premium: boolean;
}

/**
 * Current VPN connection status
 */
export interface VPNStatus {
  connected: boolean;
  server: VPNServer | null;
  publicIp: string;
  connectionTime: number | null; // seconds since connection
  bytesSent: number;
  bytesReceived: number;
}

/**
 * VPN configuration settings
 */
export interface VPNConfig {
  killSwitchEnabled: boolean;
  autoConnect: boolean;
  protocol: 'OpenVPN' | 'WireGuard';
  dnsServers: string[];
  splitTunneling: SplitTunnelConfig;
}

/**
 * Split tunneling configuration
 */
export interface SplitTunnelConfig {
  enabled: boolean;
  mode: 'include' | 'exclude';
  apps: string[]; // app bundle IDs or paths
  domains: string[]; // domains for split tunneling
}

/**
 * Connection log entry
 */
export interface ConnectionLog {
  timestamp: number; // Unix timestamp
  event: string;
  server: string | null;
  success: boolean;
  message: string;
}

// ============================================================================
// VPN SERVICE API
// ============================================================================

/**
 * Get list of available VPN servers
 * 
 * @returns Promise resolving to array of VPN servers
 * @throws Error if server list retrieval fails
 * 
 * @example
 * ```typescript
 * const servers = await vpnService.getServers();
 * log.debug(`Available: ${servers.length} servers`);
 * 
 * // Filter by country
 * const usServers = servers.filter(s => s.country === 'United States');
 * ```
 */
export async function getServers(): Promise<VPNServer[]> {
  log.debug('Fetching VPN servers');
  try {
    const servers = await invoke<VPNServer[]>('get_vpn_servers');
    log.debug(`Retrieved ${servers.length} VPN servers`);
    return servers;
  } catch (error) {
    log.error(`Failed to get VPN servers: ${error}`);
    throw new Error(`Failed to get VPN servers: ${error}`);
  }
}

/**
 * Get current VPN connection status
 * 
 * @returns Promise resolving to current VPN status
 * @throws Error if status retrieval fails
 * 
 * @example
 * ```typescript
 * const status = await vpnService.getStatus();
 * if (status.connected) {
 *   log.debug(`Connected to ${status.server?.name}`);
 *   log.debug(`Public IP: ${status.publicIp}`);
 * }
 * ```
 */
export async function getStatus(): Promise<VPNStatus> {
  log.debug('Checking VPN status');
  try {
    const status = await invoke<VPNStatus>('get_vpn_status');
    log.debug(`VPN status: ${status.connected ? 'Connected' : 'Disconnected'}`);
    return status;
  } catch (error) {
    log.error(`Failed to get VPN status: ${error}`);
    throw new Error(`Failed to get VPN status: ${error}`);
  }
}

/**
 * Connect to VPN server
 * 
 * @param serverId - ID of server to connect to
 * @returns Promise resolving to updated VPN status
 * @throws Error if connection fails
 * 
 * @example
 * ```typescript
 * try {
 *   const status = await vpnService.connect('us-ny-01');
 *   log.debug(`Connected! Public IP: ${status.publicIp}`);
 * } catch (error) {
 *   log.error('Connection failed:', error);
 * }
 * ```
 */
export async function connect(serverId: string): Promise<VPNStatus> {
  log.info(`Connecting to VPN server: ${serverId}`);
  try {
    const status = await invoke<VPNStatus>('connect_vpn', { serverId });
    log.info(`VPN connected! Public IP: ${status.publicIp}`);
    return status;
  } catch (error) {
    throw new Error(`Failed to connect to VPN: ${error}`);
  }
}

/**
 * Disconnect from VPN
 * 
 * @returns Promise resolving to updated VPN status
 * @throws Error if disconnection fails
 * 
 * @example
 * ```typescript
 * const status = await vpnService.disconnect();
 * log.debug('Disconnected from VPN');
 * ```
 */
export async function disconnect(): Promise<VPNStatus> {
  try {
    return await invoke<VPNStatus>('disconnect_vpn');
  } catch (error) {
    throw new Error(`Failed to disconnect VPN: ${error}`);
  }
}

/**
 * Get VPN configuration
 * 
 * @returns Promise resolving to current VPN config
 * @throws Error if config retrieval fails
 * 
 * @example
 * ```typescript
 * const config = await vpnService.getConfig();
 * log.debug(`Kill switch: ${config.killSwitchEnabled}`);
 * log.debug(`DNS: ${config.dnsServers.join(', ')}`);
 * ```
 */
export async function getConfig(): Promise<VPNConfig> {
  try {
    return await invoke<VPNConfig>('get_vpn_config');
  } catch (error) {
    throw new Error(`Failed to get VPN config: ${error}`);
  }
}

/**
 * Update VPN configuration
 * 
 * @param config - New VPN configuration
 * @returns Promise resolving to updated config
 * @throws Error if config update fails
 * 
 * @example
 * ```typescript
 * await vpnService.updateConfig({
 *   killSwitchEnabled: true,
 *   autoConnect: false,
 *   protocol: 'WireGuard',
 *   dnsServers: ['1.1.1.1', '1.0.0.1'],
 *   splitTunneling: {
 *     enabled: false,
 *     mode: 'exclude',
 *     apps: [],
 *     domains: []
 *   }
 * });
 * ```
 */
export async function updateConfig(config: VPNConfig): Promise<VPNConfig> {
  try {
    return await invoke<VPNConfig>('update_vpn_config', { config });
  } catch (error) {
    throw new Error(`Failed to update VPN config: ${error}`);
  }
}

/**
 * Toggle kill switch on/off
 * 
 * @param enabled - Whether kill switch should be enabled
 * @returns Promise resolving to new kill switch state
 * @throws Error if toggle fails
 * 
 * @example
 * ```typescript
 * const enabled = await vpnService.toggleKillSwitch(true);
 * log.debug(`Kill switch: ${enabled ? 'ON' : 'OFF'}`);
 * ```
 */
export async function toggleKillSwitch(enabled: boolean): Promise<boolean> {
  try {
    return await invoke<boolean>('toggle_kill_switch', { enabled });
  } catch (error) {
    throw new Error(`Failed to toggle kill switch: ${error}`);
  }
}

/**
 * Configure split tunneling
 * 
 * @param config - Split tunnel configuration
 * @returns Promise resolving to updated split tunnel config
 * @throws Error if configuration fails
 * 
 * @example
 * ```typescript
 * await vpnService.configureSplitTunnel({
 *   enabled: true,
 *   mode: 'exclude',
 *   apps: ['com.google.Chrome'],
 *   domains: ['*.local', 'localhost']
 * });
 * ```
 */
export async function configureSplitTunnel(config: SplitTunnelConfig): Promise<SplitTunnelConfig> {
  try {
    return await invoke<SplitTunnelConfig>('configure_split_tunnel', { config });
  } catch (error) {
    throw new Error(`Failed to configure split tunnel: ${error}`);
  }
}

/**
 * Get current public IP address
 * 
 * @returns Promise resolving to current public IP
 * @throws Error if IP retrieval fails
 * 
 * @example
 * ```typescript
 * const ip = await vpnService.getCurrentIp();
 * log.debug(`Your IP: ${ip}`);
 * ```
 */
export async function getCurrentIp(): Promise<string> {
  try {
    return await invoke<string>('get_current_ip');
  } catch (error) {
    throw new Error(`Failed to get current IP: ${error}`);
  }
}

/**
 * Get VPN connection logs
 * 
 * @returns Promise resolving to array of connection logs
 * @throws Error if log retrieval fails
 * 
 * @example
 * ```typescript
 * const logs = await vpnService.getLogs();
 * logs.forEach(log => {
 *   log.debug(`[${new Date(log.timestamp * 1000)}] ${log.event}: ${log.message}`);
 * });
 * ```
 */
export async function getLogs(): Promise<ConnectionLog[]> {
  try {
    return await invoke<ConnectionLog[]>('get_vpn_logs');
  } catch (error) {
    throw new Error(`Failed to get VPN logs: ${error}`);
  }
}

/**
 * Refresh VPN server list
 * 
 * @returns Promise resolving to updated server list
 * @throws Error if refresh fails
 * 
 * @example
 * ```typescript
 * const servers = await vpnService.refreshServers();
 * log.debug(`Refreshed: ${servers.length} servers`);
 * ```
 */
export async function refreshServers(): Promise<VPNServer[]> {
  try {
    return await invoke<VPNServer[]>('refresh_vpn_servers');
  } catch (error) {
    throw new Error(`Failed to refresh VPN servers: ${error}`);
  }
}

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

/**
 * Get servers sorted by ping (fastest first)
 * 
 * @returns Promise resolving to sorted server list
 * 
 * @example
 * ```typescript
 * const fastest = await vpnService.getFastestServers();
 * log.debug(`Fastest: ${fastest[0].name} (${fastest[0].ping}ms)`);
 * ```
 */
export async function getFastestServers(): Promise<VPNServer[]> {
  const servers = await getServers();
  return servers.sort((a, b) => a.ping - b.ping);
}

/**
 * Get servers by country
 * 
 * @param country - Country name to filter by
 * @returns Promise resolving to filtered server list
 * 
 * @example
 * ```typescript
 * const usServers = await vpnService.getServersByCountry('United States');
 * ```
 */
export async function getServersByCountry(country: string): Promise<VPNServer[]> {
  const servers = await getServers();
  return servers.filter(s => s.country === country);
}

/**
 * Check if currently connected to VPN
 * 
 * @returns Promise resolving to connection status
 * 
 * @example
 * ```typescript
 * if (await vpnService.isConnected()) {
 *   log.debug('VPN is active');
 * }
 * ```
 */
export async function isConnected(): Promise<boolean> {
  const status = await getStatus();
  return status.connected;
}

/**
 * Get connection uptime in seconds
 * 
 * @returns Promise resolving to uptime or null if not connected
 * 
 * @example
 * ```typescript
 * const uptime = await vpnService.getConnectionUptime();
 * if (uptime) {
 *   log.debug(`Connected for ${Math.floor(uptime / 60)} minutes`);
 * }
 * ```
 */
export async function getConnectionUptime(): Promise<number | null> {
  const status = await getStatus();
  return status.connectionTime;
}

/**
 * Default export with all methods
 */
export const vpnService = {
  getServers,
  getStatus,
  connect,
  disconnect,
  getConfig,
  updateConfig,
  toggleKillSwitch,
  configureSplitTunnel,
  getCurrentIp,
  getLogs,
  refreshServers,
  getFastestServers,
  getServersByCountry,
  isConnected,
  getConnectionUptime,
};

export default vpnService;
