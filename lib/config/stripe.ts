/**
 * CUBE AI - Stripe Configuration Module
 * 
 * Centralized Stripe configuration using the config service.
 * Provides typed access to Stripe API keys and webhook secrets.
 */

import { getStripeSecretKey, getStripePublishableKey, getStripeWebhookSecret, isConfigSet } from './config-service';

// ============================================================================
// TYPES
// ============================================================================

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  isConfigured: boolean;
  mode: 'live' | 'test' | null;
}

// ============================================================================
// CONFIGURATION GETTER
// ============================================================================

/**
 * Get the complete Stripe configuration
 * Returns all necessary keys and configuration status
 */
export function getStripeConfig(): StripeConfig {
  const secretKey = getStripeSecretKey();
  const publishableKey = getStripePublishableKey();
  const webhookSecret = getStripeWebhookSecret();
  
  // Determine if Stripe is properly configured
  const isConfigured = isConfigSet('STRIPE_SECRET_KEY') && isConfigSet('STRIPE_PUBLISHABLE_KEY');
  
  // Determine mode (live vs test) based on key prefix
  let mode: 'live' | 'test' | null = null;
  if (secretKey) {
    if (secretKey.startsWith('sk_live_PLACEHOLDER')) {
      mode = 'live';
    } else if (secretKey.startsWith('sk_test_PLACEHOLDER')) {
      mode = 'test';
    }
  }
  
  return {
    secretKey,
    publishableKey,
    webhookSecret,
    isConfigured,
    mode,
  };
}

/**
 * Check if Stripe is in test mode
 */
export function isStripeTestMode(): boolean {
  const config = getStripeConfig();
  return config.mode === 'test';
}

/**
 * Check if Stripe is in live mode
 */
export function isStripeLiveMode(): boolean {
  const config = getStripeConfig();
  return config.mode === 'live';
}

/**
 * Get Stripe status for API responses
 */
export function getStripeStatus(): { 
  configured: boolean; 
  mode: 'live' | 'test' | null; 
  message: string; 
} {
  const config = getStripeConfig();
  
  if (!config.isConfigured) {
    return {
      configured: false,
      mode: null,
      message: 'Stripe not configured. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY.',
    };
  }
  
  return {
    configured: true,
    mode: config.mode,
    message: config.mode === 'test' 
      ? 'Stripe is configured in TEST mode' 
      : 'Stripe is configured in LIVE mode',
  };
}
