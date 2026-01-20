/**
 * CUBE Nexum - Site Configuration Service
 * 
 * Centralized service for managing all site/company configuration
 * that can be updated via SuperAdmin panel.
 * 
 * Features:
 * - Load/save configuration from backend
 * - Real-time updates across all components
 * - Version control and audit trail
 * - Validation before save
 * 
 * @module site-configuration-service
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';
import {
  SiteConfiguration,
  DEFAULT_SITE_CONFIGURATION,
  ContactInfo,
  SocialMediaLinks,
  LegalInfo,
  BrandingConfig,
  InvestorConfig,
  CareersConfig,
} from '../types/site-configuration';

const log = logger.scope('SiteConfig');

// =============================================================================
// CONFIGURATION STATE
// =============================================================================

let currentConfig: SiteConfiguration = { ...DEFAULT_SITE_CONFIGURATION };
const configListeners: Set<(config: SiteConfiguration) => void> = new Set();

// =============================================================================
// EVENT EMITTER
// =============================================================================

/**
 * Subscribe to configuration changes
 */
export function onConfigChange(callback: (config: SiteConfiguration) => void): () => void {
  configListeners.add(callback);
  // Immediately call with current config
  callback(currentConfig);
  return () => configListeners.delete(callback);
}

/**
 * Notify all listeners of configuration change
 */
function notifyListeners(): void {
  configListeners.forEach(callback => {
    try {
      callback(currentConfig);
    } catch (error) {
      log.error('Config listener error:', error);
    }
  });
}

// =============================================================================
// BACKEND API
// =============================================================================

interface ConfigUpdateResult {
  success: boolean;
  version: string;
  timestamp: string;
  error?: string;
}

const BackendConfigAPI = {
  async load(): Promise<SiteConfiguration> {
    try {
      const config = await invoke<SiteConfiguration>('site_config_load');
      return config;
    } catch (error) {
      log.warn('Backend site_config_load failed, using defaults:', error);
      return DEFAULT_SITE_CONFIGURATION;
    }
  },

  async save(config: SiteConfiguration): Promise<ConfigUpdateResult> {
    try {
      return await invoke<ConfigUpdateResult>('site_config_save', { config });
    } catch (error) {
      log.warn('Backend site_config_save failed:', error);
      // Fallback to localStorage
      localStorage.setItem('cube_site_config', JSON.stringify(config));
      return {
        success: true,
        version: config.version,
        timestamp: new Date().toISOString(),
      };
    }
  },

  async getVersion(): Promise<string> {
    try {
      return await invoke<string>('site_config_get_version');
    } catch {
      return currentConfig.version;
    }
  },

  async getHistory(): Promise<{ version: string; timestamp: string; updatedBy: string }[]> {
    try {
      return await invoke('site_config_get_history');
    } catch {
      return [];
    }
  },

  async rollback(version: string): Promise<ConfigUpdateResult> {
    try {
      return await invoke<ConfigUpdateResult>('site_config_rollback', { version });
    } catch (error) {
      log.error('Config rollback failed:', error);
      return {
        success: false,
        version: currentConfig.version,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Rollback failed',
      };
    }
  },
};

// =============================================================================
// MAIN SERVICE
// =============================================================================

export const SiteConfigurationService = {
  /**
   * Initialize and load configuration
   */
  async initialize(): Promise<SiteConfiguration> {
    log.info('Initializing site configuration...');
    
    try {
      // Try to load from backend
      currentConfig = await BackendConfigAPI.load();
      log.info('Configuration loaded from backend, version:', currentConfig.version);
    } catch (error) {
      // Fallback to localStorage
      const stored = localStorage.getItem('cube_site_config');
      if (stored) {
        try {
          currentConfig = JSON.parse(stored);
          log.info('Configuration loaded from localStorage');
        } catch {
          currentConfig = { ...DEFAULT_SITE_CONFIGURATION };
          log.info('Using default configuration');
        }
      } else {
        currentConfig = { ...DEFAULT_SITE_CONFIGURATION };
        log.info('Using default configuration');
      }
    }
    
    notifyListeners();
    return currentConfig;
  },

  /**
   * Get current configuration
   */
  getConfig(): SiteConfiguration {
    return { ...currentConfig };
  },

  /**
   * Get specific section of configuration
   */
  getContact(): ContactInfo {
    return { ...currentConfig.contact };
  },

  getSocial(): SocialMediaLinks {
    return { ...currentConfig.social };
  },

  getLegal(): LegalInfo {
    return { ...currentConfig.legal };
  },

  getBranding(): BrandingConfig {
    return { ...currentConfig.branding };
  },

  getInvestors(): InvestorConfig {
    return { ...currentConfig.investors };
  },

  getCareers(): CareersConfig {
    return { ...currentConfig.careers };
  },

  /**
   * Update entire configuration
   */
  async updateConfig(
    config: Partial<SiteConfiguration>,
    updatedBy: string = 'admin'
  ): Promise<ConfigUpdateResult> {
    log.info('Updating site configuration...');
    
    // Merge with current config
    const newConfig: SiteConfiguration = {
      ...currentConfig,
      ...config,
      version: incrementVersion(currentConfig.version),
      lastUpdated: new Date().toISOString(),
      updatedBy,
    };
    
    // Validate
    const validation = validateConfig(newConfig);
    if (!validation.valid) {
      log.error('Configuration validation failed:', validation.errors);
      return {
        success: false,
        version: currentConfig.version,
        timestamp: new Date().toISOString(),
        error: validation.errors.join(', '),
      };
    }
    
    // Save to backend
    const result = await BackendConfigAPI.save(newConfig);
    
    if (result.success) {
      currentConfig = newConfig;
      notifyListeners();
      log.info('Configuration updated successfully, new version:', newConfig.version);
    }
    
    return result;
  },

  /**
   * Update contact information
   */
  async updateContact(contact: Partial<ContactInfo>, updatedBy?: string): Promise<ConfigUpdateResult> {
    return this.updateConfig({
      contact: { ...currentConfig.contact, ...contact },
    }, updatedBy);
  },

  /**
   * Update social media links
   */
  async updateSocial(social: Partial<SocialMediaLinks>, updatedBy?: string): Promise<ConfigUpdateResult> {
    return this.updateConfig({
      social: { ...currentConfig.social, ...social },
    }, updatedBy);
  },

  /**
   * Update legal information
   */
  async updateLegal(legal: Partial<LegalInfo>, updatedBy?: string): Promise<ConfigUpdateResult> {
    return this.updateConfig({
      legal: { ...currentConfig.legal, ...legal },
    }, updatedBy);
  },

  /**
   * Update branding
   */
  async updateBranding(branding: Partial<BrandingConfig>, updatedBy?: string): Promise<ConfigUpdateResult> {
    return this.updateConfig({
      branding: { ...currentConfig.branding, ...branding },
    }, updatedBy);
  },

  /**
   * Update investor configuration
   */
  async updateInvestors(investors: Partial<InvestorConfig>, updatedBy?: string): Promise<ConfigUpdateResult> {
    return this.updateConfig({
      investors: { ...currentConfig.investors, ...investors },
    }, updatedBy);
  },

  /**
   * Update careers configuration
   */
  async updateCareers(careers: Partial<CareersConfig>, updatedBy?: string): Promise<ConfigUpdateResult> {
    return this.updateConfig({
      careers: { ...currentConfig.careers, ...careers },
    }, updatedBy);
  },

  /**
   * Add a new job position
   */
  async addJobPosition(
    position: CareersConfig['openPositions'][0],
    updatedBy?: string
  ): Promise<ConfigUpdateResult> {
    const careers = this.getCareers();
    careers.openPositions = [...careers.openPositions, position];
    return this.updateCareers(careers, updatedBy);
  },

  /**
   * Remove a job position
   */
  async removeJobPosition(positionId: string, updatedBy?: string): Promise<ConfigUpdateResult> {
    const careers = this.getCareers();
    careers.openPositions = careers.openPositions.filter(p => p.id !== positionId);
    return this.updateCareers(careers, updatedBy);
  },

  /**
   * Update a job position
   */
  async updateJobPosition(
    positionId: string,
    updates: Partial<CareersConfig['openPositions'][0]>,
    updatedBy?: string
  ): Promise<ConfigUpdateResult> {
    const careers = this.getCareers();
    careers.openPositions = careers.openPositions.map(p =>
      p.id === positionId ? { ...p, ...updates } : p
    );
    return this.updateCareers(careers, updatedBy);
  },

  /**
   * Add an investment type
   */
  async addInvestmentType(
    investmentType: InvestorConfig['investmentTypes'][0],
    updatedBy?: string
  ): Promise<ConfigUpdateResult> {
    const investors = this.getInvestors();
    investors.investmentTypes = [...investors.investmentTypes, investmentType];
    return this.updateInvestors(investors, updatedBy);
  },

  /**
   * Get configuration history
   */
  async getHistory(): Promise<{ version: string; timestamp: string; updatedBy: string }[]> {
    return BackendConfigAPI.getHistory();
  },

  /**
   * Rollback to a previous version
   */
  async rollback(version: string): Promise<ConfigUpdateResult> {
    const result = await BackendConfigAPI.rollback(version);
    if (result.success) {
      currentConfig = await BackendConfigAPI.load();
      notifyListeners();
    }
    return result;
  },

  /**
   * Export configuration as JSON
   */
  exportConfig(): string {
    return JSON.stringify(currentConfig, null, 2);
  },

  /**
   * Import configuration from JSON
   */
  async importConfig(json: string, updatedBy?: string): Promise<ConfigUpdateResult> {
    try {
      const config = JSON.parse(json) as SiteConfiguration;
      return this.updateConfig(config, updatedBy);
    } catch (error) {
      return {
        success: false,
        version: currentConfig.version,
        timestamp: new Date().toISOString(),
        error: 'Invalid JSON format',
      };
    }
  },

  /**
   * Reset to default configuration
   */
  async resetToDefaults(updatedBy?: string): Promise<ConfigUpdateResult> {
    return this.updateConfig(DEFAULT_SITE_CONFIGURATION, updatedBy);
  },

  /**
   * Apply branding to document
   */
  applyBranding(): void {
    const { colors } = currentConfig.branding;
    const root = document.documentElement;
    
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-error', colors.error);
    root.style.setProperty('--color-warning', colors.warning);
    
    log.info('Branding applied to document');
  },
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Increment version string (e.g., "1.0.0" -> "1.0.1")
 */
function incrementVersion(version: string): string {
  const parts = version.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}

/**
 * Validate configuration
 */
function validateConfig(config: SiteConfiguration): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate contact
  if (!config.contact.phones.support) {
    errors.push('Support phone is required');
  }
  if (!config.contact.emails.info) {
    errors.push('Info email is required');
  }
  if (!config.contact.emails.support) {
    errors.push('Support email is required');
  }
  
  // Validate email formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  Object.entries(config.contact.emails).forEach(([key, email]) => {
    if (email && !emailRegex.test(email)) {
      errors.push(`Invalid email format for ${key}: ${email}`);
    }
  });
  
  // Validate legal
  if (!config.legal.companyName) {
    errors.push('Company name is required');
  }
  if (!config.legal.registrationCountry) {
    errors.push('Registration country is required');
  }
  
  // Validate branding colors (hex format)
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  Object.entries(config.branding.colors).forEach(([key, color]) => {
    if (color && !hexRegex.test(color)) {
      errors.push(`Invalid color format for ${key}: ${color}`);
    }
  });
  
  // Validate investor config
  if (config.investors.minimumInvestment.amount < 0) {
    errors.push('Minimum investment cannot be negative');
  }
  if (config.investors.expectedReturn.min > config.investors.expectedReturn.max) {
    errors.push('Min expected return cannot be greater than max');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// REACT HOOK
// =============================================================================

import { useState, useEffect } from 'react';

/**
 * React hook for using site configuration
 */
export function useSiteConfig(): SiteConfiguration {
  const [config, setConfig] = useState<SiteConfiguration>(SiteConfigurationService.getConfig());
  
  useEffect(() => {
    return onConfigChange(setConfig);
  }, []);
  
  return config;
}

/**
 * React hook for using specific config section
 */
export function useContactInfo(): ContactInfo {
  const config = useSiteConfig();
  return config.contact;
}

export function useSocialLinks(): SocialMediaLinks {
  const config = useSiteConfig();
  return config.social;
}

export function useLegalInfo(): LegalInfo {
  const config = useSiteConfig();
  return config.legal;
}

export function useBranding(): BrandingConfig {
  const config = useSiteConfig();
  return config.branding;
}

export function useInvestorConfig(): InvestorConfig {
  const config = useSiteConfig();
  return config.investors;
}

export function useCareersConfig(): CareersConfig {
  const config = useSiteConfig();
  return config.careers;
}

// Initialize on module load
if (typeof window !== 'undefined') {
  SiteConfigurationService.initialize().catch(console.error);
}

export default SiteConfigurationService;
