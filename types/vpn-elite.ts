/**
 * VPN Elite - Advanced Types for Enterprise VPN Features
 * 
 * Complete type definitions for:
 * - Threat Protection (DNS filtering, malware blocking)
 * - Meshnet (peer-to-peer networking)
 * - Double VPN & Obfuscated servers
 * - Kill Switch & Split Tunneling
 * - Ad Blocker & Malware Protection
 * - Dedicated IP & Multi-hop
 */

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export type VPNProtocol = 
  | 'nordlynx'      // WireGuard-based
  | 'openvpn_udp'
  | 'openvpn_tcp'
  | 'ikev2'
  | 'wireguard'
  | 'shadowsocks';

export type VPNConnectionStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface VPNServer {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  city: string;
  hostname: string;
  ip: string;
  load: number;           // 0-100 percentage
  latency: number;        // in ms
  features: VPNServerFeature[];
  groups: string[];       // Categories like "Standard", "P2P", "Obfuscated"
  isFavorite: boolean;
  isRecommended: boolean;
}

export type VPNServerFeature = 
  | 'double_vpn'
  | 'onion_over_vpn'
  | 'p2p'
  | 'dedicated_ip'
  | 'obfuscated'
  | 'streaming'
  | 'anti_ddos';

export interface VPNConnection {
  id: string;
  server: VPNServer;
  protocol: VPNProtocol;
  status: VPNConnectionStatus;
  connectedAt?: Date;
  bytesReceived: number;
  bytesSent: number;
  downloadSpeed: number;  // bytes/sec
  uploadSpeed: number;    // bytes/sec
  publicIP?: string;
  virtualIP?: string;
}

// ============================================================================
// THREAT PROTECTION
// ============================================================================

export interface ThreatProtection {
  enabled: boolean;
  malwareBlocking: boolean;
  trackerBlocking: boolean;
  adBlocking: boolean;
  dnsFiltering: boolean;
  customDNS?: string[];
  webProtection: boolean;
  phishingProtection: boolean;
  cryptoMiningBlocking: boolean;
}

export interface ThreatEvent {
  id: string;
  type: ThreatEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  domain: string;
  url?: string;
  source?: string;
  timestamp: Date;
  blockedAt?: Date;
  action: 'blocked' | 'warned' | 'allowed';
  actionTaken?: string;
  category: string;
  description: string;
}

export type ThreatType = ThreatEventType;
export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DNSFilteringCategory = DNSFilterCategory;

export type ThreatEventType = 
  | 'malware'
  | 'phishing'
  | 'tracker'
  | 'ad'
  | 'crypto_miner'
  | 'suspicious'
  | 'dns_query';

export interface ThreatStats {
  malwareBlocked: number;
  trackersBlocked: number;
  adsBlocked: number;
  phishingBlocked: number;
  cryptoMinersBlocked: number;
  totalThreatsBlocked: number;
  lastUpdated: Date;
  periodStart: Date;
  periodEnd: Date;
}

export interface DNSFilter {
  id: string;
  name: string;
  description: string;
  category: DNSFilterCategory;
  isEnabled: boolean;
  rules: number;
  lastUpdated: Date;
}

export type DNSFilterCategory = 
  | 'ads_trackers'
  | 'malware'
  | 'adult'
  | 'social'
  | 'gambling'
  | 'crypto_mining'
  | 'custom'
  | 'phishing'
  | 'ads'
  | 'trackers'
  | 'social_media';

// ============================================================================
// MESHNET
// ============================================================================

export interface MeshnetDevice {
  id: string;
  name: string;
  hostname: string;
  platform: 'windows' | 'macos' | 'linux' | 'android' | 'ios';
  type?: 'desktop' | 'laptop' | 'mobile' | 'tablet' | 'server';
  ip: string;           // Meshnet IP
  publicKey: string;
  isOnline: boolean;
  isOwned: boolean;     // Is this device owned by current user
  lastSeenAt: Date;
  lastSeen?: Date;
  os?: string;
  ownerEmail?: string;
  permissions: MeshnetPermissions;
  connectedSince?: Date;
  trafficRouting: boolean;
  localNetworkAccess: boolean;
}

export interface MeshnetPermissions {
  canRouteTraffic: boolean;       // Allow this device to route traffic through you
  canAccessLocalNetwork: boolean;  // Allow access to your local network
  canSendFiles: boolean;          // Allow file transfer
  canBeDiscovered: boolean;       // Visible in meshnet
  allowInbound?: boolean;
  allowOutbound?: boolean;
  allowRouting?: boolean;
  allowFileSharing?: boolean;
  allowLocalNetwork?: boolean;
}

export interface MeshnetInvitation {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  sentAt: Date;
  createdAt?: Date;
  expiresAt: Date;
  permissions: MeshnetPermissions;
}

export interface MeshnetConfig {
  enabled: boolean;
  allowIncomingConnections: boolean;
  allowTrafficRouting: boolean;
  allowLocalNetworkAccess: boolean;
  autoConnect: boolean;
  hostname: string;
  meshnetIP: string;
}

// ============================================================================
// KILL SWITCH
// ============================================================================

export interface KillSwitch {
  enabled: boolean;
  mode: KillSwitchMode;
  allowLAN: boolean;
  allowedApps: string[];
  blockedApps: string[];
  status: 'active' | 'inactive' | 'triggered';
  lastTriggeredAt?: Date;
}

export type KillSwitchMode = 
  | 'system'    // Block all internet when VPN disconnects
  | 'app'       // Block only specified apps
  | 'advanced'  // Custom rules
  | 'strict';   // Strictest mode

// ============================================================================
// SPLIT TUNNELING
// ============================================================================

export interface SplitTunneling {
  enabled: boolean;
  mode: SplitTunnelingMode;
  apps: SplitTunnelingApp[];
  websites: SplitTunnelingWebsite[];
  ipRanges: string[];
}

export type SplitTunnelingMode = 
  | 'include'   // Only selected apps use VPN
  | 'exclude';  // All except selected apps use VPN

export interface SplitTunnelingApp {
  id: string;
  name: string;
  path: string;
  icon?: string;
  isEnabled?: boolean;
  isIncluded?: boolean;
  isSystem?: boolean;
  category?: string;
}

export interface SplitTunnelingWebsite {
  id: string;
  domain: string;
  isEnabled: boolean;
  addedAt: Date;
}

// ============================================================================
// DOUBLE VPN & MULTI-HOP
// ============================================================================

export interface DoubleVPN {
  enabled: boolean;
  entryServer: VPNServer;
  exitServer: VPNServer;
  connectionChain: VPNServer[];
}

export interface MultiHopConfig {
  enabled: boolean;
  maxHops: number;
  servers: VPNServer[];
  autoOptimize: boolean;
}

export type MultiHopServer = VPNServer;
export type DeviceType = 'desktop' | 'laptop' | 'mobile' | 'tablet' | 'server' | 'phone' | 'router';

// ============================================================================
// OBFUSCATION
// ============================================================================

export interface ObfuscationConfig {
  enabled: boolean;
  method: ObfuscationMethod;
  autoDetect: boolean;
  customPort?: number;
}

export type ObfuscationMethod = 
  | 'xor'
  | 'shadowsocks'
  | 'stunnel'
  | 'obfs4'
  | 'meek';

// ============================================================================
// DEDICATED IP
// ============================================================================

export interface DedicatedIP {
  id: string;
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  server: string;
  assignedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'pending';
  isActive?: boolean;
  purpose?: string;
  usageStats: {
    totalConnections: number;
    lastConnectedAt?: Date;
    lastUsed?: Date;
    bytesTransferred: number;
    totalDataTransferred?: number;
    averageSessionDuration?: number;
  };
}

// ============================================================================
// AD BLOCKER
// ============================================================================

export interface AdBlocker {
  enabled: boolean;
  blockAds: boolean;
  blockTrackers: boolean;
  blockAnalytics: boolean;
  blockSocialMedia: boolean;
  customBlocklist: string[];
  whitelist: string[];
  stats: AdBlockerStats;
}

export interface AdBlockerStats {
  adsBlocked: number;
  trackersBlocked: number;
  analyticsBlocked: number;
  bandwidthSaved: number;  // in bytes
  pagesOptimized: number;
  lastUpdated: Date;
}

// ============================================================================
// VPN SETTINGS
// ============================================================================

export interface VPNSettings {
  autoConnect: boolean;
  autoConnectServer?: string;
  protocol: VPNProtocol;
  dns: DNSSettings;
  ipv6: boolean;
  notifications: boolean;
  startOnBoot: boolean;
  minimizeToTray: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export interface DNSSettings {
  mode: 'automatic' | 'custom';
  primary?: string;
  secondary?: string;
  dnsSec: boolean;
  dnsOverHttps: boolean;
}

// ============================================================================
// VPN STATS
// ============================================================================

export interface VPNStats {
  totalDataTransferred: number;
  totalConnectionTime: number;   // in seconds
  averageSpeed: number;          // bytes/sec
  serversUsed: number;
  countriesConnected: string[];
  threatStats: ThreatStats;
  lastConnectionAt?: Date;
  currentSession?: {
    startedAt: Date;
    bytesReceived: number;
    bytesSent: number;
  };
}

// ============================================================================
// VPN STATE
// ============================================================================

export interface VPNEliteState {
  connection: VPNConnection | null;
  servers: VPNServer[];
  favoriteServers: VPNServer[];
  recentServers: VPNServer[];
  threatProtection: ThreatProtection;
  threatEvents: ThreatEvent[];
  meshnet: MeshnetConfig;
  meshnetDevices: MeshnetDevice[];
  killSwitch: KillSwitch;
  splitTunneling: SplitTunneling;
  doubleVPN: DoubleVPN | null;
  obfuscation: ObfuscationConfig;
  dedicatedIPs: DedicatedIP[];
  adBlocker: AdBlocker;
  settings: VPNSettings;
  stats: VPNStats;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface ConnectRequest {
  serverId: string;
  protocol?: VPNProtocol;
  doubleVPN?: boolean;
  obfuscated?: boolean;
}

export interface ConnectResponse {
  success: boolean;
  connection?: VPNConnection;
  error?: string;
}

export interface ServerListResponse {
  servers: VPNServer[];
  total: number;
  lastUpdated: Date;
}
