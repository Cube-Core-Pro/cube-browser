/**
 * CUBE Elite Subscription Service
 * 
 * Manages subscription tiers, feature gating, and license validation
 * for the Chrome extension.
 * 
 * @version 1.0.0
 * @license CUBE Nexum Enterprise
 */

class SubscriptionService {
  static TIERS = {
    FREE: 'free',
    PRO: 'pro', 
    ELITE: 'elite'
  };

  static TIER_FEATURES = {
    free: {
      // Automation
      maxWorkflows: 5,
      advancedAutomation: false,
      scheduledWorkflows: false,
      aiAssistedAutomation: false,
      
      // AI
      aiModel: 'gpt-4o-mini',
      aiRequestsPerDay: 50,
      customAITraining: false,
      aiAnalysis: false,
      
      // Autofill
      smartAutofill: true,
      advancedFieldDetection: false,
      customProfiles: 3,
      formTemplates: false,
      
      // File Detection
      fileDetectionTypes: ['pdf', 'doc'],
      ocrEnabled: false,
      batchProcessing: false,
      
      // VPN
      vpnLocations: 3,
      vpnPremiumServers: false,
      
      // Video/Chat
      videoConference: false,
      groupChats: false,
      screenSharing: false,
      
      // Remote Desktop
      remoteDesktop: false,
      
      // Security Scanner
      securityScanner: false,
      
      // Project Management
      projectManagement: false,
      
      // Support
      supportLevel: 'community',
      prioritySupport: false
    },
    
    pro: {
      // Automation
      maxWorkflows: 50,
      advancedAutomation: true,
      scheduledWorkflows: true,
      aiAssistedAutomation: true,
      
      // AI
      aiModel: 'gpt-4o',
      aiRequestsPerDay: 500,
      customAITraining: false,
      aiAnalysis: true,
      
      // Autofill
      smartAutofill: true,
      advancedFieldDetection: true,
      customProfiles: 25,
      formTemplates: true,
      
      // File Detection  
      fileDetectionTypes: ['pdf', 'doc', 'xls', 'ppt', 'img'],
      ocrEnabled: true,
      batchProcessing: true,
      
      // VPN
      vpnLocations: 'all',
      vpnPremiumServers: true,
      
      // Video/Chat
      videoConference: true,
      groupChats: true,
      screenSharing: true,
      
      // Remote Desktop
      remoteDesktop: true,
      
      // Security Scanner
      securityScanner: true,
      
      // Project Management
      projectManagement: true,
      
      // Support
      supportLevel: 'email',
      prioritySupport: false
    },
    
    elite: {
      // Automation
      maxWorkflows: 'unlimited',
      advancedAutomation: true,
      scheduledWorkflows: true,
      aiAssistedAutomation: true,
      
      // AI
      aiModel: 'gpt-4-turbo',
      aiRequestsPerDay: 'unlimited',
      customAITraining: true,
      aiAnalysis: true,
      
      // Autofill
      smartAutofill: true,
      advancedFieldDetection: true,
      customProfiles: 'unlimited',
      formTemplates: true,
      
      // File Detection
      fileDetectionTypes: ['all'],
      ocrEnabled: true,
      batchProcessing: true,
      
      // VPN
      vpnLocations: 'all',
      vpnPremiumServers: true,
      
      // Video/Chat
      videoConference: true,
      groupChats: true,
      screenSharing: true,
      
      // Remote Desktop
      remoteDesktop: true,
      
      // Security Scanner
      securityScanner: true,
      
      // Project Management
      projectManagement: true,
      
      // Support
      supportLevel: 'priority',
      prioritySupport: true
    }
  };

  static PRICING = {
    pro: {
      monthly: 19.99,
      yearly: 199.99,
      currency: 'USD'
    },
    elite: {
      monthly: 49.99,
      yearly: 499.99,
      currency: 'USD'
    }
  };

  constructor() {
    this.currentTier = SubscriptionService.TIERS.FREE;
    this.subscription = null;
    this.licenseKey = null;
    this.initialized = false;
  }

  /**
   * Initialize the subscription service
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      const stored = await chrome.storage.local.get([
        'subscription',
        'licenseKey',
        'currentTier'
      ]);
      
      if (stored.subscription) {
        this.subscription = stored.subscription;
        this.currentTier = stored.subscription.tier || SubscriptionService.TIERS.FREE;
      }
      
      if (stored.licenseKey) {
        this.licenseKey = stored.licenseKey;
        await this.validateLicense(stored.licenseKey);
      }
      
      this.initialized = true;
      console.log('✅ SubscriptionService initialized, tier:', this.currentTier);
      
    } catch (error) {
      console.error('Failed to initialize SubscriptionService:', error);
      this.currentTier = SubscriptionService.TIERS.FREE;
    }
  }

  /**
   * Get current tier
   */
  getTier() {
    return this.currentTier;
  }

  /**
   * Get tier features
   */
  getFeatures(tier = null) {
    const t = tier || this.currentTier;
    return SubscriptionService.TIER_FEATURES[t] || SubscriptionService.TIER_FEATURES.free;
  }

  /**
   * Check if a feature is available for current tier
   */
  hasFeature(featureName) {
    const features = this.getFeatures();
    const value = features[featureName];
    
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (value === 'unlimited') return true;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.length > 0;
    
    return false;
  }

  /**
   * Get feature limit
   */
  getFeatureLimit(featureName) {
    const features = this.getFeatures();
    return features[featureName];
  }

  /**
   * Check if current tier is at least the specified tier
   */
  isAtLeastTier(requiredTier) {
    const tierOrder = ['free', 'pro', 'elite'];
    const currentIndex = tierOrder.indexOf(this.currentTier);
    const requiredIndex = tierOrder.indexOf(requiredTier);
    return currentIndex >= requiredIndex;
  }

  /**
   * Validate license key
   */
  async validateLicense(licenseKey) {
    try {
      // Try to validate with CUBE desktop app first
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'VALIDATE_LICENSE', 
          licenseKey 
        }, (response) => {
          resolve(response);
        });
      });
      
      if (response?.valid) {
        this.licenseKey = licenseKey;
        this.currentTier = response.tier || SubscriptionService.TIERS.PRO;
        this.subscription = {
          id: response.subscriptionId || `ext-${Date.now()}`,
          tier: this.currentTier,
          status: 'active',
          validUntil: response.validUntil,
          licenseKey
        };
        
        await this.saveSubscription();
        return { valid: true, tier: this.currentTier };
      }
      
      // Fallback: local license key validation (demo mode)
      if (this.isValidLocalLicenseFormat(licenseKey)) {
        const tier = this.getTierFromLicenseKey(licenseKey);
        this.licenseKey = licenseKey;
        this.currentTier = tier;
        this.subscription = {
          id: `local-${Date.now()}`,
          tier,
          status: 'active',
          validUntil: this.getDefaultExpiryDate(),
          licenseKey
        };
        
        await this.saveSubscription();
        return { valid: true, tier };
      }
      
      return { valid: false, error: 'Invalid license key' };
      
    } catch (error) {
      console.error('License validation failed:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Validate local license format
   */
  isValidLocalLicenseFormat(key) {
    // Format: CUBE-XXXXX-XXXXX-XXXXX-XXXXX
    const pattern = /^CUBE-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
    return pattern.test(key?.toUpperCase());
  }

  /**
   * Get tier from license key prefix
   */
  getTierFromLicenseKey(key) {
    const upperKey = key?.toUpperCase() || '';
    if (upperKey.includes('ELITE') || upperKey.startsWith('CUBE-E')) {
      return SubscriptionService.TIERS.ELITE;
    }
    if (upperKey.includes('PRO') || upperKey.startsWith('CUBE-P')) {
      return SubscriptionService.TIERS.PRO;
    }
    return SubscriptionService.TIERS.FREE;
  }

  /**
   * Get default expiry date (1 year from now)
   */
  getDefaultExpiryDate() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString();
  }

  /**
   * Activate license key
   */
  async activateLicense(licenseKey) {
    const result = await this.validateLicense(licenseKey);
    
    if (result.valid) {
      // Notify UI of tier change
      this.notifyTierChange();
    }
    
    return result;
  }

  /**
   * Deactivate/remove license
   */
  async deactivateLicense() {
    this.licenseKey = null;
    this.currentTier = SubscriptionService.TIERS.FREE;
    this.subscription = null;
    
    await chrome.storage.local.remove(['subscription', 'licenseKey', 'currentTier']);
    this.notifyTierChange();
    
    return { success: true };
  }

  /**
   * Save subscription to storage
   */
  async saveSubscription() {
    await chrome.storage.local.set({
      subscription: this.subscription,
      licenseKey: this.licenseKey,
      currentTier: this.currentTier
    });
  }

  /**
   * Notify UI of tier change
   */
  notifyTierChange() {
    window.dispatchEvent(new CustomEvent('subscription-changed', {
      detail: {
        tier: this.currentTier,
        features: this.getFeatures()
      }
    }));
  }

  /**
   * Get subscription status
   */
  getStatus() {
    return {
      tier: this.currentTier,
      subscription: this.subscription,
      features: this.getFeatures(),
      isActive: this.subscription?.status === 'active',
      isPro: this.currentTier === SubscriptionService.TIERS.PRO,
      isElite: this.currentTier === SubscriptionService.TIERS.ELITE,
      isFree: this.currentTier === SubscriptionService.TIERS.FREE
    };
  }

  /**
   * Get upgrade URL
   */
  getUpgradeUrl(tier) {
    return `https://cubeai.tools/pricing?tier=${tier}&source=extension`;
  }

  /**
   * Show upgrade prompt
   */
  showUpgradePrompt(feature, requiredTier = 'pro') {
    const tierName = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);
    
    return {
      title: `🔒 ${tierName} Feature`,
      message: `"${feature}" requires CUBE ${tierName}. Upgrade to unlock this feature.`,
      upgradeUrl: this.getUpgradeUrl(requiredTier),
      currentTier: this.currentTier,
      requiredTier
    };
  }

  /**
   * Get tier badge info
   */
  getTierBadge() {
    const badges = {
      free: { label: 'Free', color: '#6b7280', icon: '🆓' },
      pro: { label: 'Pro', color: '#3b82f6', icon: '⭐' },
      elite: { label: 'Elite', color: '#8b5cf6', icon: '👑' }
    };
    return badges[this.currentTier] || badges.free;
  }

  /**
   * Check remaining AI requests
   */
  async checkAIQuota() {
    const limit = this.getFeatureLimit('aiRequestsPerDay');
    
    if (limit === 'unlimited') {
      return { remaining: Infinity, limit: 'unlimited', used: 0 };
    }
    
    const stored = await chrome.storage.local.get(['aiRequestsToday', 'aiRequestsDate']);
    const today = new Date().toDateString();
    
    let used = 0;
    if (stored.aiRequestsDate === today) {
      used = stored.aiRequestsToday || 0;
    }
    
    return {
      remaining: Math.max(0, limit - used),
      limit,
      used
    };
  }

  /**
   * Increment AI request counter
   */
  async incrementAIUsage() {
    const today = new Date().toDateString();
    const stored = await chrome.storage.local.get(['aiRequestsToday', 'aiRequestsDate']);
    
    let count = 1;
    if (stored.aiRequestsDate === today) {
      count = (stored.aiRequestsToday || 0) + 1;
    }
    
    await chrome.storage.local.set({
      aiRequestsToday: count,
      aiRequestsDate: today
    });
    
    return count;
  }
}

// Create singleton instance
const subscriptionService = new SubscriptionService();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.SubscriptionService = SubscriptionService;
  window.subscriptionService = subscriptionService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SubscriptionService, subscriptionService };
}
