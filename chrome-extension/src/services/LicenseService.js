/**
 * CUBE Nexum License Validation Service
 * 
 * Handles license key validation, activation tracking, and feature gating
 * Works both online (via server) and offline (local validation)
 * 
 * @version 1.0.0
 */

class LicenseService {
  constructor() {
    this.cachedLicense = null;
    this.lastValidation = null;
    this.validationInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.offlineGracePeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  /**
   * Initialize license service
   */
  async initialize() {
    try {
      // Load cached license from storage
      const cached = await this.getCachedLicense();
      
      if (cached) {
        this.cachedLicense = cached;
        
        // Check if we need to revalidate
        if (this.shouldRevalidate(cached)) {
          await this.validateLicense(cached.key);
        }
      }
      
      return this.cachedLicense;
    } catch (error) {
      console.error('[LicenseService] Initialize error:', error);
      return this.getDefaultLicense();
    }
  }

  /**
   * Validate a license key
   * @param {string} licenseKey - The license key to validate
   * @returns {Promise<object>} License info
   */
  async validateLicense(licenseKey) {
    try {
      // Try online validation first
      if (window.CubeConnectionManager) {
        const result = await window.CubeConnectionManager.request('/license/validate', {
          method: 'POST',
          body: JSON.stringify({ 
            licenseKey,
            deviceId: await this.getDeviceId(),
            platform: this.getPlatform(),
          }),
        });
        
        if (result.valid) {
          const license = {
            key: licenseKey,
            tier: result.tier,
            valid: true,
            validUntil: result.validUntil,
            features: result.features,
            limits: result.limits,
            lastValidated: Date.now(),
            onlineValidated: true,
          };
          
          await this.cacheLicense(license);
          this.cachedLicense = license;
          return license;
        } else {
          throw new Error(result.error || 'Invalid license key');
        }
      }
    } catch (error) {
      console.warn('[LicenseService] Online validation failed:', error);
      
      // Fall back to offline validation
      return this.validateOffline(licenseKey);
    }
  }

  /**
   * Offline license validation
   * Uses cached data and basic key format validation
   */
  validateOffline(licenseKey) {
    // Check cache first
    if (this.cachedLicense && this.cachedLicense.key === licenseKey) {
      // Check if still within grace period
      const lastValidated = this.cachedLicense.lastValidated || 0;
      if (Date.now() - lastValidated < this.offlineGracePeriod) {
        return this.cachedLicense;
      }
    }

    // Basic format validation for demo/dev keys
    const keyFormat = this.parseKeyFormat(licenseKey);
    
    if (keyFormat) {
      const license = {
        key: licenseKey,
        tier: keyFormat.tier,
        valid: true,
        validUntil: null,
        features: this.getFeaturesForTier(keyFormat.tier),
        limits: this.getLimitsForTier(keyFormat.tier),
        lastValidated: Date.now(),
        onlineValidated: false,
        offlineMode: true,
      };
      
      this.cacheLicense(license);
      this.cachedLicense = license;
      return license;
    }

    // Return free tier if invalid
    return this.getDefaultLicense();
  }

  /**
   * Parse license key format
   * Formats:
   * - CUBE-FREE-XXXXXX (Free)
   * - CUBE-PRO-XXXXXX (Pro)
   * - CUBE-ELITE-XXXXXX (Elite)
   * - CUBE-ENT-XXXXXX (Enterprise)
   */
  parseKeyFormat(key) {
    if (!key || typeof key !== 'string') return null;
    
    const patterns = {
      'CUBE-FREE-': 'free',
      'CUBE-PRO-': 'pro',
      'CUBE-ELITE-': 'elite',
      'CUBE-ENT-': 'enterprise',
    };
    
    for (const [prefix, tier] of Object.entries(patterns)) {
      if (key.toUpperCase().startsWith(prefix)) {
        return { tier, prefix };
      }
    }
    
    return null;
  }

  /**
   * Get features available for a tier
   */
  getFeaturesForTier(tier) {
    const features = {
      free: {
        autofill: true,
        profiles: 1,
        documentParsing: true,
        basicMacros: true,
        cloudSync: false,
        aiFeatures: false,
        p2p: false,
        vpn: false,
        advancedMacros: false,
        teamFeatures: false,
        prioritySupport: false,
      },
      pro: {
        autofill: true,
        profiles: 5,
        documentParsing: true,
        basicMacros: true,
        cloudSync: true,
        aiFeatures: true,
        p2p: true,
        vpn: false,
        advancedMacros: true,
        teamFeatures: false,
        prioritySupport: false,
      },
      elite: {
        autofill: true,
        profiles: 'unlimited',
        documentParsing: true,
        basicMacros: true,
        cloudSync: true,
        aiFeatures: true,
        p2p: true,
        vpn: true,
        advancedMacros: true,
        teamFeatures: true,
        prioritySupport: true,
      },
      enterprise: {
        autofill: true,
        profiles: 'unlimited',
        documentParsing: true,
        basicMacros: true,
        cloudSync: true,
        aiFeatures: true,
        p2p: true,
        vpn: true,
        advancedMacros: true,
        teamFeatures: true,
        prioritySupport: true,
        customIntegrations: true,
        sso: true,
        auditLogs: true,
        dedicatedSupport: true,
      },
    };
    
    return features[tier] || features.free;
  }

  /**
   * Get usage limits for a tier
   */
  getLimitsForTier(tier) {
    const limits = {
      free: {
        aiRequestsPerDay: 10,
        cloudStorageMB: 0,
        macroSteps: 20,
        workflowsPerMonth: 5,
        devicesPerLicense: 1,
      },
      pro: {
        aiRequestsPerDay: 100,
        cloudStorageMB: 500,
        macroSteps: 100,
        workflowsPerMonth: 50,
        devicesPerLicense: 3,
      },
      elite: {
        aiRequestsPerDay: 500,
        cloudStorageMB: 5000,
        macroSteps: 'unlimited',
        workflowsPerMonth: 'unlimited',
        devicesPerLicense: 5,
      },
      enterprise: {
        aiRequestsPerDay: 'unlimited',
        cloudStorageMB: 'unlimited',
        macroSteps: 'unlimited',
        workflowsPerMonth: 'unlimited',
        devicesPerLicense: 'unlimited',
      },
    };
    
    return limits[tier] || limits.free;
  }

  /**
   * Check if a feature is available
   */
  hasFeature(featureName) {
    if (!this.cachedLicense) {
      return this.getFeaturesForTier('free')[featureName] || false;
    }
    
    const features = this.cachedLicense.features || this.getFeaturesForTier(this.cachedLicense.tier);
    return features[featureName] || false;
  }

  /**
   * Get current tier
   */
  getTier() {
    return this.cachedLicense?.tier || 'free';
  }

  /**
   * Check if license needs revalidation
   */
  shouldRevalidate(license) {
    if (!license || !license.lastValidated) return true;
    return Date.now() - license.lastValidated > this.validationInterval;
  }

  /**
   * Get default free license
   */
  getDefaultLicense() {
    return {
      key: null,
      tier: 'free',
      valid: true,
      validUntil: null,
      features: this.getFeaturesForTier('free'),
      limits: this.getLimitsForTier('free'),
      lastValidated: Date.now(),
      isDefault: true,
    };
  }

  /**
   * Cache license to storage
   */
  async cacheLicense(license) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ 
          'cube_license': license,
          'cube_license_cached_at': Date.now(),
        });
      } else {
        localStorage.setItem('cube_license', JSON.stringify(license));
        localStorage.setItem('cube_license_cached_at', Date.now().toString());
      }
    } catch (error) {
      console.error('[LicenseService] Cache error:', error);
    }
  }

  /**
   * Get cached license from storage
   */
  async getCachedLicense() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['cube_license', 'cube_license_cached_at']);
        return result.cube_license || null;
      } else {
        const cached = localStorage.getItem('cube_license');
        return cached ? JSON.parse(cached) : null;
      }
    } catch (error) {
      console.error('[LicenseService] Get cache error:', error);
      return null;
    }
  }

  /**
   * Get unique device ID
   */
  async getDeviceId() {
    try {
      // Check cache first
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get('cube_device_id');
        if (result.cube_device_id) return result.cube_device_id;
      } else {
        const cached = localStorage.getItem('cube_device_id');
        if (cached) return cached;
      }

      // Generate new device ID
      const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
      
      // Cache it
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ 'cube_device_id': deviceId });
      } else {
        localStorage.setItem('cube_device_id', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('[LicenseService] Device ID error:', error);
      return 'unknown_device';
    }
  }

  /**
   * Get platform info
   */
  getPlatform() {
    const ua = navigator.userAgent;
    
    if (ua.includes('Chrome')) {
      return {
        type: 'extension',
        browser: 'chrome',
        version: ua.match(/Chrome\/(\d+)/)?.[1] || 'unknown',
      };
    }
    
    return { type: 'extension', browser: 'unknown' };
  }

  /**
   * Activate license on this device
   */
  async activateLicense(licenseKey) {
    try {
      const license = await this.validateLicense(licenseKey);
      
      if (license.valid) {
        // Track activation
        if (window.CubeConnectionManager) {
          await window.CubeConnectionManager.request('/license/activate', {
            method: 'POST',
            body: JSON.stringify({
              licenseKey,
              deviceId: await this.getDeviceId(),
              platform: this.getPlatform(),
            }),
          });
        }
        
        return { success: true, license };
      }
      
      return { success: false, error: 'Invalid license key' };
    } catch (error) {
      console.error('[LicenseService] Activation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deactivate license from this device
   */
  async deactivateLicense() {
    try {
      if (this.cachedLicense && window.CubeConnectionManager) {
        await window.CubeConnectionManager.request('/license/deactivate', {
          method: 'POST',
          body: JSON.stringify({
            licenseKey: this.cachedLicense.key,
            deviceId: await this.getDeviceId(),
          }),
        });
      }
      
      // Clear local cache
      this.cachedLicense = null;
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.remove(['cube_license', 'cube_license_cached_at']);
      } else {
        localStorage.removeItem('cube_license');
        localStorage.removeItem('cube_license_cached_at');
      }
      
      return { success: true };
    } catch (error) {
      console.error('[LicenseService] Deactivation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check usage limits
   */
  async checkLimit(limitName, currentUsage) {
    const limits = this.cachedLicense?.limits || this.getLimitsForTier('free');
    const limit = limits[limitName];
    
    if (limit === 'unlimited') return { allowed: true, remaining: 'unlimited' };
    if (typeof limit === 'number') {
      return {
        allowed: currentUsage < limit,
        remaining: Math.max(0, limit - currentUsage),
        limit,
        used: currentUsage,
      };
    }
    
    return { allowed: false, remaining: 0 };
  }

  /**
   * Get subscription management URL
   */
  getManageSubscriptionUrl() {
    const config = window.CubeConfig || {};
    return config.SERVER?.STRIPE_PORTAL || 'https://billing.cubeai.tools';
  }

  /**
   * Get upgrade URL
   */
  getUpgradeUrl(targetTier = 'pro') {
    const config = window.CubeConfig || {};
    return `${config.SERVER?.API || 'https://api.cubeai.tools'}/subscribe?tier=${targetTier}`;
  }
}

// Export as singleton
window.CubeLicenseService = new LicenseService();

// Initialize on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.CubeLicenseService.initialize();
  });
} else {
  window.CubeLicenseService.initialize();
}
