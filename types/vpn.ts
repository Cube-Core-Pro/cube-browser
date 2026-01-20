/**
 * VPN Type Definitions
 * 
 * TypeScript interfaces matching the Rust backend VPN structures.
 */

/**
 * VPN Server information
 */
export interface VPNServer {
  id: string;
  name: string;
  country: string;
  city: string;
  ip: string;
  protocol: 'OpenVPN' | 'WireGuard';
  load: number; // 0-100 (percentage)
  ping: number; // milliseconds
  premium: boolean;
}

/**
 * VPN Connection status
 */
export interface VPNStatus {
  connected: boolean;
  server: VPNServer | null;
  publicIp: string;
  connectionTime: number | null; // Unix timestamp in seconds
  bytesSent: number;
  bytesReceived: number;
}

/**
 * Split tunnel configuration
 */
export interface SplitTunnelConfig {
  enabled: boolean;
  mode: 'include' | 'exclude';
  apps: string[]; // app bundle IDs or paths
  domains: string[]; // domains for split tunneling
}

/**
 * VPN Configuration settings
 */
export interface VPNConfig {
  killSwitchEnabled: boolean;
  autoConnect: boolean;
  protocol: 'OpenVPN' | 'WireGuard';
  dnsServers: string[];
  splitTunneling: SplitTunnelConfig;
}

/**
 * VPN Connection log entry
 */
export interface ConnectionLog {
  timestamp: number; // Unix timestamp in seconds
  event: string;
  server: string | null;
  success: boolean;
  message: string;
}

/**
 * VPN Protocol type
 */
export type VPNProtocol = 'OpenVPN' | 'WireGuard';

/**
 * Server load status
 */
export type LoadStatus = 'low' | 'medium' | 'high';

/**
 * Connection event types
 */
export type VPNEventType = 'connect' | 'disconnect' | 'config_update' | 'kill_switch' | 'split_tunnel' | 'refresh_servers';

/**
 * VPN Provider types (for premium features)
 */
export interface VPNProvider {
  provider: string;
  tier: string;
}

/**
 * VPN Pricing tier
 */
export interface VPNPricingTier {
  name: string;
  price: number;
  features: string[];
  servers: number;
  bandwidth: string;
  devices: number;
}

/**
 * VPN Subscription tracking
 */
export interface VPNSubscription {
  userId: string;
  provider: string;
  tier: string;
  price: number;
  timestamp: number;
}

/**
 * Server filter options
 */
export interface ServerFilters {
  country?: string;
  protocol?: VPNProtocol;
  premiumOnly?: boolean;
  maxPing?: number;
  maxLoad?: number;
}

/**
 * Helper function to get load status
 */
export function getLoadStatus(load: number): LoadStatus {
  if (load < 40) return 'low';
  if (load < 70) return 'medium';
  return 'high';
}

/**
 * Helper function to format bytes
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Helper function to format connection time
 */
export function formatConnectionTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Helper function to get country flag emoji
 */
export function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Japan': '🇯🇵',
    'Australia': '🇦🇺',
    'Canada': '🇨🇦',
    'Netherlands': '🇳🇱',
    'Switzerland': '🇨🇭',
    'Singapore': '🇸🇬',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
  };
  return flags[country] || '🌍';
}

/**
 * Helper function to sort servers by ping
 */
export function sortServersByPing(servers: VPNServer[]): VPNServer[] {
  return [...servers].sort((a, b) => a.ping - b.ping);
}

/**
 * Helper function to sort servers by load
 */
export function sortServersByLoad(servers: VPNServer[]): VPNServer[] {
  return [...servers].sort((a, b) => a.load - b.load);
}

/**
 * Helper function to filter servers
 */
export function filterServers(servers: VPNServer[], filters: ServerFilters): VPNServer[] {
  return servers.filter(server => {
    if (filters.country && server.country !== filters.country) return false;
    if (filters.protocol && server.protocol !== filters.protocol) return false;
    if (filters.premiumOnly && !server.premium) return false;
    if (filters.maxPing && server.ping > filters.maxPing) return false;
    if (filters.maxLoad && server.load > filters.maxLoad) return false;
    return true;
  });
}

/**
 * Helper function to get unique countries
 */
export function getUniqueCountries(servers: VPNServer[]): string[] {
  return Array.from(new Set(servers.map(s => s.country))).sort();
}
