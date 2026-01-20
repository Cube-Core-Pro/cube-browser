/**
 * Stripe Status API Route
 * Returns Stripe configuration status for frontend
 * 
 * GET /api/stripe/status
 */

import { NextResponse } from 'next/server';
import { getStripeSecretKey, getStripePublishableKey, getConfig } from '@/lib/config/config-service';

export interface StripeStatus {
  configured: boolean;
  mode: 'live' | 'test' | null;
  publishableKey: string | null;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  pricesConfigured: {
    starter: boolean;
    pro: boolean;
    business: boolean;
    elite: boolean;
  };
  message: string;
}

export async function GET(): Promise<NextResponse<StripeStatus>> {
  try {
    const secretKey = getStripeSecretKey();
    const publishableKey = getStripePublishableKey();
    const webhookSecret = getConfig('STRIPE_WEBHOOK_SECRET', '');
    
    // Check which prices are configured (not placeholder values)
    const pricesConfigured = {
      starter: !getConfig('STRIPE_PRICE_STARTER_MONTHLY', '').includes('price_starter'),
      pro: !getConfig('STRIPE_PRICE_PRO_MONTHLY', '').includes('price_pro'),
      business: !getConfig('STRIPE_PRICE_BUSINESS_MONTHLY', '').includes('price_business'),
      elite: !getConfig('STRIPE_PRICE_ELITE_MONTHLY', '').includes('price_elite'),
    };
    
    // Determine mode from key prefix
    let mode: 'live' | 'test' | null = null;
    if (secretKey) {
      mode = secretKey.startsWith('sk_live_PLACEHOLDER') ? 'live' : 'test';
    }
    
    // Build status message
    let message = '';
    if (!secretKey) {
      message = 'Stripe not configured. Set STRIPE_SECRET_KEY in SuperAdmin.';
    } else if (!publishableKey) {
      message = 'Missing STRIPE_PUBLISHABLE_KEY in SuperAdmin.';
    } else if (!Object.values(pricesConfigured).some(v => v)) {
      message = `Stripe connected (${mode} mode). Configure product prices in SuperAdmin.`;
    } else {
      message = `Stripe ready (${mode} mode)`;
    }
    
    return NextResponse.json({
      configured: Boolean(secretKey && publishableKey),
      mode,
      publishableKey: publishableKey || null,
      hasSecretKey: Boolean(secretKey),
      hasWebhookSecret: Boolean(webhookSecret),
      pricesConfigured,
      message,
    });
  } catch (error) {
    console.error('[Stripe Status] Error:', error);
    return NextResponse.json({
      configured: false,
      mode: null,
      publishableKey: null,
      hasSecretKey: false,
      hasWebhookSecret: false,
      pricesConfigured: {
        starter: false,
        pro: false,
        business: false,
        elite: false,
      },
      message: 'Error checking Stripe status',
    });
  }
}
