// ============================================================================
// CUBE Nexum Elite - VPN Affiliate Service (Frontend)
// ============================================================================
// TypeScript service for VPN with PureVPN affiliate integration
// ============================================================================

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('VPNAffiliate');

// ============================================================================
// Types
// ============================================================================

export interface PureVPNAffiliateInfo {
  name: string;
  partnerId: string;
  signupUrl: string;
  signupUrlWithPromo: string;
  discountPercent: number;
  promoCode: string;
  benefits: string[];
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  moneyBackDays: number;
}

export interface VPNUpgradePrompt {
  showPrompt: boolean;
  title: string;
  message: string;
  cubeProFeatures: string[];
  cubeEliteFeatures: string[];
  purevpnFeatures: string[];
  affiliateUrl: string;
  discountPercent: number;
  promoCode: string;
}

export interface VPNServer {
  id: string;
  name: string;
  country: string;
  city: string;
  ip: string;
  protocol: string;
  load: number;
  ping: number;
  premium: boolean;
}

export interface VPNStatus {
  connected: boolean;
  server: VPNServer | null;
  publicIp: string;
  connectionTime: number | null;
  bytesSent: number;
  bytesReceived: number;
}

export interface VPNConfig {
  killSwitchEnabled: boolean;
  autoConnect: boolean;
  protocol: string;
  dnsServers: string[];
  splitTunneling: {
    enabled: boolean;
    mode: string;
    apps: string[];
    domains: string[];
  };
}

// ============================================================================
// VPN Affiliate Service
// ============================================================================

export class VPNAffiliateService {
  private static instance: VPNAffiliateService;

  private constructor() {}

  static getInstance(): VPNAffiliateService {
    if (!VPNAffiliateService.instance) {
      VPNAffiliateService.instance = new VPNAffiliateService();
    }
    return VPNAffiliateService.instance;
  }

  // ========================================================================
  // Affiliate Methods
  // ========================================================================

  /**
   * Get PureVPN affiliate information
   */
  async getAffiliateInfo(): Promise<PureVPNAffiliateInfo> {
    try {
      return await invoke<PureVPNAffiliateInfo>('get_purevpn_affiliate_info');
    } catch (error) {
      log.error('Failed to get affiliate info:', error);
      throw error;
    }
  }

  /**
   * Get PureVPN affiliate URL
   */
  async getAffiliateUrl(withPromo = true): Promise<string> {
    try {
      return await invoke<string>('get_purevpn_affiliate_url', { withPromo });
    } catch (error) {
      log.error('Failed to get affiliate URL:', error);
      throw error;
    }
  }

  /**
   * Track affiliate click for analytics
   */
  async trackClick(source: string): Promise<void> {
    try {
      await invoke('track_purevpn_click', { source });
    } catch (error) {
      log.error('Failed to track click:', error);
    }
  }

  /**
   * Get VPN upgrade prompt based on license tier
   */
  async getUpgradePrompt(licenseTier: string): Promise<VPNUpgradePrompt> {
    try {
      return await invoke<VPNUpgradePrompt>('get_vpn_upgrade_prompt', { licenseTier });
    } catch (error) {
      log.error('Failed to get upgrade prompt:', error);
      throw error;
    }
  }

  /**
   * Open PureVPN affiliate link in browser
   */
  async openAffiliate(source: string): Promise<void> {
    try {
      await this.trackClick(source);
      await invoke('open_purevpn_affiliate', { source });
    } catch (_error) {
      // Fallback to window.open if invoke fails
      const url = await this.getAffiliateUrl(true);
      window.open(url, '_blank');
    }
  }

  // ========================================================================
  // VPN Connection Methods
  // ========================================================================

  /**
   * Get current VPN status
   */
  async getStatus(): Promise<VPNStatus> {
    try {
      return await invoke<VPNStatus>('get_vpn_status');
    } catch (error) {
      log.error('Failed to get VPN status:', error);
      throw error;
    }
  }

  /**
   * Get available VPN servers
   */
  async getServers(): Promise<VPNServer[]> {
    try {
      return await invoke<VPNServer[]>('get_vpn_servers');
    } catch (error) {
      log.error('Failed to get servers:', error);
      throw error;
    }
  }

  /**
   * Connect to a specific server
   */
  async connect(serverId: string): Promise<VPNStatus> {
    try {
      return await invoke<VPNStatus>('connect_vpn', { serverId });
    } catch (error) {
      log.error('Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Disconnect from VPN
   */
  async disconnect(): Promise<void> {
    try {
      await invoke('disconnect_vpn');
    } catch (error) {
      log.error('Failed to disconnect:', error);
      throw error;
    }
  }

  /**
   * Get VPN configuration
   */
  async getConfig(): Promise<VPNConfig> {
    try {
      return await invoke<VPNConfig>('get_vpn_config');
    } catch (error) {
      log.error('Failed to get config:', error);
      throw error;
    }
  }

  /**
   * Update VPN configuration
   */
  async setConfig(config: Partial<VPNConfig>): Promise<VPNConfig> {
    try {
      return await invoke<VPNConfig>('set_vpn_config', { config });
    } catch (error) {
      log.error('Failed to set config:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const vpnAffiliateService = VPNAffiliateService.getInstance();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Get server load color
 */
export function getLoadColor(load: number): string {
  if (load < 30) return '#22c55e'; // green
  if (load < 70) return '#eab308'; // yellow
  return '#ef4444'; // red
}

/**
 * Get ping quality label
 */
export function getPingQuality(ping: number): { label: string; color: string } {
  if (ping < 50) return { label: 'Excellent', color: '#22c55e' };
  if (ping < 100) return { label: 'Good', color: '#3b82f6' };
  if (ping < 200) return { label: 'Fair', color: '#eab308' };
  return { label: 'Poor', color: '#ef4444' };
}
