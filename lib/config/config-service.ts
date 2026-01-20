/**
 * CUBE AI - Centralized Configuration Service
 * 
 * This service provides configuration values from multiple sources:
 * 1. Runtime config (set via SuperAdmin panel)
 * 2. Environment variables (from Railway/deployment)
 * 3. Default values
 * 
 * Priority: Runtime > Environment > Default
 */

// Runtime configuration storage (in production, use database)
let runtimeConfig: Record<string, string> = {};

/**
 * Get a configuration value
 * Checks runtime config first, then environment, then returns default
 */
export function getConfig(key: string, defaultValue: string = ''): string {
  // First check runtime config (set by SuperAdmin)
  if (runtimeConfig[key] !== undefined && runtimeConfig[key] !== '') {
    return runtimeConfig[key];
  }
  
  // Then check environment variables
  const envValue = process.env[key];
  if (envValue !== undefined && envValue !== '') {
    return envValue;
  }
  
  // Return default
  return defaultValue;
}

/**
 * Set a configuration value at runtime
 */
export function setConfig(key: string, value: string): void {
  runtimeConfig[key] = value;
}

/**
 * Set multiple configuration values at runtime
 */
export function setConfigs(configs: Record<string, string>): void {
  runtimeConfig = { ...runtimeConfig, ...configs };
}

/**
 * Clear a specific runtime configuration
 */
export function clearConfig(key: string): void {
  delete runtimeConfig[key];
}

/**
 * Clear all runtime configurations
 */
export function clearAllConfigs(): void {
  runtimeConfig = {};
}

/**
 * Get all runtime configs (for debugging)
 */
export function getAllRuntimeConfigs(): Record<string, string> {
  return { ...runtimeConfig };
}

/**
 * Check if a configuration is set (either runtime or env)
 */
export function isConfigSet(key: string): boolean {
  const value = getConfig(key);
  return value !== undefined && value !== '' && !value.includes('...');
}

// Common configuration getters

export function getStripeSecretKey(): string {
  return getConfig('STRIPE_SECRET_KEY', '');
}

export function getStripePublishableKey(): string {
  return getConfig('STRIPE_PUBLISHABLE_KEY', '');
}

export function getStripeWebhookSecret(): string {
  return getConfig('STRIPE_WEBHOOK_SECRET', '');
}

export function getOpenAIKey(): string {
  return getConfig('OPENAI_API_KEY', '');
}

export function getOpenAIModel(): string {
  return getConfig('OPENAI_MODEL', 'gpt-4-turbo-preview');
}

export function getSMTPConfig(): {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  fromName: string;
} {
  return {
    host: getConfig('SMTP_HOST', ''),
    port: parseInt(getConfig('SMTP_PORT', '587')),
    user: getConfig('SMTP_USER', ''),
    password: getConfig('SMTP_PASSWORD', ''),
    from: getConfig('SMTP_FROM', ''),
    fromName: getConfig('SMTP_FROM_NAME', 'CUBE AI'),
  };
}

export function isFeatureEnabled(feature: string): boolean {
  const value = getConfig(`ENABLE_${feature.toUpperCase()}`, 'true');
  return value === 'true' || value === '1';
}

export function isMaintenanceMode(): boolean {
  return getConfig('MAINTENANCE_MODE', 'false') === 'true';
}
