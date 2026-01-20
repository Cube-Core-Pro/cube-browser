// ============================================================================
// CUBE Nexum Elite - License Service (Frontend)
// ============================================================================
// TypeScript service for license management
// ============================================================================

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Types
// ============================================================================

export interface LicenseInfo {
  has_license: boolean;
  tier: 'free' | 'pro' | 'elite';
  status: 'valid' | 'expired' | 'revoked' | 'invalid' | 'not_activated' | 'server_error' | 'offline_grace_period';
  user_email: string | null;
  expires_at: number | null;
  days_remaining: number | null;
  device_id: string;
  is_offline_mode: boolean;
}

export interface FeatureAccess {
  feature: string;
  allowed: boolean;
  required_tier: 'free' | 'pro' | 'elite';
  current_tier: 'free' | 'pro' | 'elite';
}

export interface LicenseConfig {
  serverUrl: string;
  serverPublicKey?: string;
  appSecret: string;
  offlineGracePeriod?: number;
  cacheDuration?: number;
}

// ============================================================================
// Feature Definitions
// ============================================================================

export const FEATURES = {
  // Free tier features
  FREE: [
    'basic_automation',
    'basic_forms', 
    'basic_browser',
  ],
  
  // Pro tier features
  PRO: [
    'ai_assistant',
    'vpn_basic',
    'unlimited_workflows',
    'advanced_extraction',
    'priority_support',
  ],
  
  // Elite tier features
  ELITE: [
    'vpn_premium',
    'collaboration',
    'api_access',
    'custom_branding',
    'enterprise_sso',
    'audit_logs',
    'video_conference',
    'p2p_transfer',
    'security_lab',
  ],
} as const;

export type FeatureName = 
  | typeof FEATURES.FREE[number]
  | typeof FEATURES.PRO[number]
  | typeof FEATURES.ELITE[number];

// ============================================================================
// License Service Class
// ============================================================================

export class LicenseService {
  private static instance: LicenseService;
  private cachedLicense: LicenseInfo | null = null;
  private lastValidation: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): LicenseService {
    if (!LicenseService.instance) {
      LicenseService.instance = new LicenseService();
    }
    return LicenseService.instance;
  }

  // ==========================================================================
  // Configuration
  // ==========================================================================

  /**
   * Configure the license server connection
   */
  async configure(config: LicenseConfig): Promise<void> {
    try {
      await invoke('set_license_config', {
        serverUrl: config.serverUrl,
        serverPublicKey: config.serverPublicKey,
        appSecret: config.appSecret,
        offlineGracePeriod: config.offlineGracePeriod,
        cacheDuration: config.cacheDuration,
      });
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to configure license service'
      );
    }
  }

  // ==========================================================================
  // License Validation
  // ==========================================================================

  /**
   * Validate the current license with server
   */
  async validateLicense(forceRefresh = false): Promise<LicenseInfo> {
    const now = Date.now();
    
    // Return cached if still valid and not forcing refresh
    if (!forceRefresh && this.cachedLicense && (now - this.lastValidation < this.CACHE_DURATION)) {
      return this.cachedLicense;
    }

    try {
      const info = await invoke<LicenseInfo>('validate_license');
      this.cachedLicense = info;
      this.lastValidation = now;
      return info;
    } catch (_error) {
      // Return free tier on error
      return this.getFreeTierInfo();
    }
  }

  /**
   * Get current license status without server call
   */
  async getLicenseStatus(): Promise<LicenseInfo> {
    if (this.cachedLicense) {
      return this.cachedLicense;
    }

    try {
      const info = await invoke<LicenseInfo>('get_license_status');
      this.cachedLicense = info;
      return info;
    } catch (_error) {
      return this.getFreeTierInfo();
    }
  }

  /**
   * Get current tier quickly
   */
  async getTier(): Promise<'free' | 'pro' | 'elite'> {
    try {
      const tier = await invoke<string>('get_license_tier');
      return tier as 'free' | 'pro' | 'elite';
    } catch (_error) {
      return 'free';
    }
  }

  // ==========================================================================
  // License Activation
  // ==========================================================================

  /**
   * Activate a license with a license key
   */
  async activateLicense(licenseKey: string, userEmail: string): Promise<LicenseInfo> {
    try {
      const info = await invoke<LicenseInfo>('activate_license', {
        licenseKey,
        userEmail,
      });
      this.cachedLicense = info;
      this.lastValidation = Date.now();
      return info;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to activate license'
      );
    }
  }

  /**
   * Deactivate current license (for switching devices)
   */
  async deactivateLicense(): Promise<void> {
    try {
      await invoke('deactivate_license');
      this.cachedLicense = null;
      this.lastValidation = 0;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to deactivate license'
      );
    }
  }

  // ==========================================================================
  // Feature Access
  // ==========================================================================

  /**
   * Check if a feature is allowed
   */
  async checkFeature(feature: FeatureName): Promise<FeatureAccess> {
    try {
      const access = await invoke<FeatureAccess>('check_feature_access', { feature });
      return access;
    } catch (_error) {
      return {
        feature,
        allowed: false,
        required_tier: 'elite',
        current_tier: 'free',
      };
    }
  }

  /**
   * Check multiple features at once
   */
  async checkFeatures(features: FeatureName[]): Promise<FeatureAccess[]> {
    try {
      const access = await invoke<FeatureAccess[]>('check_features_access', { features });
      return access;
    } catch (_error) {
      return features.map(feature => ({
        feature,
        allowed: false,
        required_tier: 'elite' as const,
        current_tier: 'free' as const,
      }));
    }
  }

  /**
   * Quick check if feature is allowed (uses cache)
   */
  async isFeatureAllowed(feature: FeatureName): Promise<boolean> {
    const license = await this.getLicenseStatus();
    
    // Free features always allowed
    if ((FEATURES.FREE as readonly string[]).includes(feature)) {
      return true;
    }
    
    // Pro features require Pro or Elite
    if ((FEATURES.PRO as readonly string[]).includes(feature)) {
      return license.tier === 'pro' || license.tier === 'elite';
    }
    
    // Elite features require Elite
    if ((FEATURES.ELITE as readonly string[]).includes(feature)) {
      return license.tier === 'elite';
    }
    
    return false;
  }

  // ==========================================================================
  // Device Info
  // ==========================================================================

  /**
   * Get the device ID (for display to user)
   */
  async getDeviceId(): Promise<string> {
    try {
      const deviceId = await invoke<string>('get_device_id');
      return deviceId;
    } catch (_error) {
      return 'unknown';
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private async getFreeTierInfo(): Promise<LicenseInfo> {
    const deviceId = await this.getDeviceId();
    return {
      has_license: false,
      tier: 'free',
      status: 'not_activated',
      user_email: null,
      expires_at: null,
      days_remaining: null,
      device_id: deviceId,
      is_offline_mode: false,
    };
  }

  /**
   * Clear cached license info
   */
  clearCache(): void {
    this.cachedLicense = null;
    this.lastValidation = 0;
  }

  /**
   * Format expiration date
   */
  formatExpirationDate(timestamp: number | null): string {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Get status display text
   */
  getStatusText(status: LicenseInfo['status']): string {
    const statusMap: Record<LicenseInfo['status'], string> = {
      valid: 'Active',
      expired: 'Expired',
      revoked: 'Revoked',
      invalid: 'Invalid',
      not_activated: 'Not Activated',
      server_error: 'Server Error',
      offline_grace_period: 'Offline Mode',
    };
    return statusMap[status] || 'Unknown';
  }
}

// Export singleton instance
export const licenseService = LicenseService.getInstance();
