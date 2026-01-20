/**
 * CUBE Shield Service - Frontend Integration
 * 
 * Superior to Brave Shields, uBlock Origin, and Privacy Badger
 * AI-powered content blocking with learning capabilities
 * 
 * Features:
 * - Ad Blocking (EasyList compatible)
 * - Tracker Blocking (EasyPrivacy compatible)
 * - Fingerprint Protection (Canvas, WebGL, WebRTC, etc.)
 * - Cookie Management (Block third-party, all, or custom)
 * - Malware Protection
 * - Crypto Miner Blocking
 * - HTTPS Upgrade
 * - Custom Rules
 * - Per-Site Configuration
 * - Statistics Tracking
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================
// Types
// ============================================

export type ShieldLevel = 'off' | 'standard' | 'strict' | 'aggressive' | 'custom';

export type CookieBlockingLevel = 
  | 'allow_all' 
  | 'block_third_party' 
  | 'block_all_except_whitelist' 
  | 'block_all';

export type RuleType = 'url' | 'domain' | 'element' | 'script' | 'cookie' | 'header' | 'regex';

export type RuleAction = 'block' | 'allow' | 'redirect' | 'modify' | 'hide';

export type ResourceType = 
  | 'document' 
  | 'stylesheet' 
  | 'image' 
  | 'media' 
  | 'font' 
  | 'script' 
  | 'xhr' 
  | 'fetch' 
  | 'websocket' 
  | 'other';

export interface ShieldConfig {
  enabled: boolean;
  level: ShieldLevel;
  ad_blocking: boolean;
  tracker_blocking: boolean;
  fingerprint_protection: boolean;
  cookie_blocking: CookieBlockingLevel;
  script_blocking: boolean;
  social_blocking: boolean;
  crypto_mining_blocking: boolean;
  malware_blocking: boolean;
  https_upgrade: boolean;
  webrtc_protection: boolean;
  canvas_protection: boolean;
  font_protection: boolean;
  battery_api_blocking: boolean;
  hardware_concurrency_spoof: boolean;
  custom_rules: CustomRule[];
  whitelist: string[];
  blacklist: string[];
}

export interface CustomRule {
  id: string;
  name: string;
  pattern: string;
  rule_type: RuleType;
  action: RuleAction;
  enabled: boolean;
  priority: number;
}

export interface ShieldStats {
  ads_blocked: number;
  trackers_blocked: number;
  scripts_blocked: number;
  cookies_blocked: number;
  fingerprint_attempts_blocked: number;
  malware_blocked: number;
  crypto_miners_blocked: number;
  https_upgrades: number;
  social_trackers_blocked: number;
  data_saved_bytes: number;
  time_saved_ms: number;
  blocked_by_domain: Record<string, number>;
  blocked_by_category: Record<string, number>;
}

export interface BlockResult {
  should_block: boolean;
  reason: string | null;
  category: string | null;
  rule_id: string | null;
  modified_headers: Record<string, string> | null;
  redirect_url: string | null;
}

export type ShieldPreset = 
  | 'privacy_focused' 
  | 'balanced' 
  | 'performance' 
  | 'maximum_protection' 
  | 'disabled';

// ============================================
// CUBE Shield Service
// ============================================

/**
 * CUBE Shield Service
 * 
 * Provides ad blocking, tracker blocking, fingerprint protection,
 * and other privacy features superior to any browser on the market.
 */
export const CubeShieldService = {
  // ========================================
  // Configuration
  // ========================================

  /**
   * Get current shield configuration
   */
  getConfig: async (): Promise<ShieldConfig> => {
    return invoke<ShieldConfig>('shield_get_config');
  },

  /**
   * Set shield configuration
   */
  setConfig: async (config: ShieldConfig): Promise<void> => {
    return invoke('shield_set_config', { config });
  },

  /**
   * Enable or disable shield
   */
  setEnabled: async (enabled: boolean): Promise<void> => {
    return invoke('shield_set_enabled', { enabled });
  },

  /**
   * Set shield protection level
   */
  setLevel: async (level: ShieldLevel): Promise<void> => {
    return invoke('shield_set_level', { level });
  },

  /**
   * Toggle individual protection features
   */
  toggleFeature: async (feature: keyof Omit<ShieldConfig, 'enabled' | 'level' | 'custom_rules' | 'whitelist' | 'blacklist' | 'cookie_blocking'>, enabled: boolean): Promise<void> => {
    return invoke('shield_toggle_feature', { feature, enabled });
  },

  /**
   * Set cookie blocking level
   */
  setCookieBlocking: async (level: CookieBlockingLevel): Promise<void> => {
    return invoke('shield_set_cookie_blocking', { level });
  },

  // ========================================
  // Site-Specific Configuration
  // ========================================

  /**
   * Set site-specific shield configuration
   */
  setSiteConfig: async (domain: string, config: ShieldConfig): Promise<void> => {
    return invoke('shield_set_site_config', { domain, config });
  },

  /**
   * Get site-specific shield configuration
   */
  getSiteConfig: async (domain: string): Promise<ShieldConfig> => {
    return invoke<ShieldConfig>('shield_get_site_config', { domain });
  },

  // ========================================
  // Whitelist / Blacklist
  // ========================================

  /**
   * Add domain to whitelist (allow all content)
   */
  whitelistAdd: async (domain: string): Promise<void> => {
    return invoke('shield_whitelist_add', { domain });
  },

  /**
   * Remove domain from whitelist
   */
  whitelistRemove: async (domain: string): Promise<void> => {
    return invoke('shield_whitelist_remove', { domain });
  },

  /**
   * Get all whitelisted domains
   */
  whitelistGet: async (): Promise<string[]> => {
    return invoke<string[]>('shield_whitelist_get');
  },

  /**
   * Add domain to blacklist (block all content)
   */
  blacklistAdd: async (domain: string): Promise<void> => {
    return invoke('shield_blacklist_add', { domain });
  },

  /**
   * Get all blacklisted domains
   */
  blacklistGet: async (): Promise<string[]> => {
    return invoke<string[]>('shield_blacklist_get');
  },

  // ========================================
  // Custom Rules
  // ========================================

  /**
   * Add custom blocking rule
   */
  addCustomRule: async (rule: CustomRule): Promise<void> => {
    return invoke('shield_add_custom_rule', { rule });
  },

  /**
   * Remove custom rule by ID
   */
  removeCustomRule: async (ruleId: string): Promise<void> => {
    return invoke('shield_remove_custom_rule', { ruleId });
  },

  /**
   * Get all custom rules
   */
  getCustomRules: async (): Promise<CustomRule[]> => {
    return invoke<CustomRule[]>('shield_get_custom_rules');
  },

  /**
   * Toggle custom rule enabled state
   */
  toggleCustomRule: async (ruleId: string, enabled: boolean): Promise<void> => {
    return invoke('shield_toggle_custom_rule', { ruleId, enabled });
  },

  // ========================================
  // Statistics
  // ========================================

  /**
   * Get shield statistics
   */
  getStats: async (): Promise<ShieldStats> => {
    return invoke<ShieldStats>('shield_get_stats');
  },

  /**
   * Reset shield statistics
   */
  resetStats: async (): Promise<void> => {
    return invoke('shield_reset_stats');
  },

  // ========================================
  // Blocking Checks
  // ========================================

  /**
   * Check if a request should be blocked
   */
  shouldBlock: async (
    url: string,
    method: string,
    resourceType: ResourceType,
    initiator: string | null,
    isThirdParty: boolean,
    pageDomain: string
  ): Promise<BlockResult> => {
    return invoke<BlockResult>('shield_should_block', {
      url,
      method,
      resourceType,
      initiator,
      isThirdParty,
      pageDomain,
    });
  },

  /**
   * Check if a cookie should be blocked
   */
  shouldBlockCookie: async (
    cookieDomain: string,
    pageDomain: string
  ): Promise<boolean> => {
    return invoke<boolean>('shield_should_block_cookie', {
      cookieDomain,
      pageDomain,
    });
  },

  // ========================================
  // Protection Scripts
  // ========================================

  /**
   * Get fingerprint protection JavaScript to inject
   */
  getFingerprintScript: async (): Promise<string> => {
    return invoke<string>('shield_get_fingerprint_script');
  },

  /**
   * Get CSS for hiding ad elements (cosmetic filtering)
   */
  getCosmeticCss: async (): Promise<string> => {
    return invoke<string>('shield_get_cosmetic_css');
  },

  /**
   * Upgrade HTTP URL to HTTPS
   */
  upgradeHttps: async (url: string): Promise<string> => {
    return invoke<string>('shield_upgrade_https', { url });
  },

  // ========================================
  // Presets
  // ========================================

  /**
   * Apply a preset configuration
   * 
   * Available presets:
   * - privacy_focused: Maximum privacy, may break some sites
   * - balanced: Good privacy with minimal breakage
   * - performance: Fast loading, ads blocked, minimal privacy
   * - maximum_protection: Everything enabled, expect site breakage
   * - disabled: Shield off
   */
  applyPreset: async (preset: ShieldPreset): Promise<ShieldConfig> => {
    return invoke<ShieldConfig>('shield_apply_preset', { preset });
  },

  // ========================================
  // Import / Export
  // ========================================

  /**
   * Export shield configuration as JSON string
   */
  exportConfig: async (): Promise<string> => {
    return invoke<string>('shield_export_config');
  },

  /**
   * Import shield configuration from JSON string
   */
  importConfig: async (json: string): Promise<void> => {
    return invoke('shield_import_config', { json });
  },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Create a new custom rule
 */
export function createCustomRule(
  name: string,
  pattern: string,
  ruleType: RuleType = 'url',
  action: RuleAction = 'block',
  priority: number = 0
): CustomRule {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    pattern,
    rule_type: ruleType,
    action,
    enabled: true,
    priority,
  };
}

/**
 * Calculate data saved in human-readable format
 */
export function formatDataSaved(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Calculate time saved in human-readable format
 */
export function formatTimeSaved(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}min`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Get shield level description
 */
export function getShieldLevelDescription(level: ShieldLevel): string {
  switch (level) {
    case 'off':
      return 'Shield is disabled. No protection.';
    case 'standard':
      return 'Block known ads and trackers. Minimal site breakage.';
    case 'strict':
      return 'Block all third-party content. Some sites may break.';
    case 'aggressive':
      return 'Block everything suspicious. Many sites will break.';
    case 'custom':
      return 'Custom rules defined by user.';
    default:
      return 'Unknown protection level.';
  }
}

/**
 * Get feature description
 */
export function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    ad_blocking: 'Block advertisements and sponsored content',
    tracker_blocking: 'Block analytics and tracking scripts',
    fingerprint_protection: 'Prevent browser fingerprinting',
    script_blocking: 'Block all third-party scripts (may break sites)',
    social_blocking: 'Block social media trackers (Facebook, Twitter, etc.)',
    crypto_mining_blocking: 'Block cryptocurrency miners',
    malware_blocking: 'Block known malware domains',
    https_upgrade: 'Automatically upgrade HTTP to HTTPS',
    webrtc_protection: 'Prevent WebRTC IP leaks',
    canvas_protection: 'Add noise to canvas fingerprinting',
    font_protection: 'Limit detectable fonts',
    battery_api_blocking: 'Hide battery status',
    hardware_concurrency_spoof: 'Spoof CPU core count',
  };
  return descriptions[feature] || 'No description available';
}

// ============================================
// React Hook (optional convenience)
// ============================================

export interface UseShieldReturn {
  config: ShieldConfig | null;
  stats: ShieldStats | null;
  loading: boolean;
  error: string | null;
  setEnabled: (enabled: boolean) => Promise<void>;
  setLevel: (level: ShieldLevel) => Promise<void>;
  toggleFeature: (feature: string, enabled: boolean) => Promise<void>;
  applyPreset: (preset: ShieldPreset) => Promise<void>;
  refreshConfig: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

/**
 * Note: Import this hook from a React component file.
 * This is the service-only file.
 * 
 * Example usage:
 * ```typescript
 * import { useShield } from '@/hooks/useShield';
 * 
 * function ShieldPanel() {
 *   const { config, stats, setEnabled, applyPreset } = useShield();
 *   
 *   return (
 *     <div>
 *       <Switch checked={config?.enabled} onChange={setEnabled} />
 *       <span>Ads blocked: {stats?.ads_blocked}</span>
 *     </div>
 *   );
 * }
 * ```
 */

// Export default service
export default CubeShieldService;
