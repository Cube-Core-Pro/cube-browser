import { invoke } from '@tauri-apps/api/core';

export interface CheckoutSessionResponse {
  session_id: string;
  url: string;
}

export interface SubscriptionInfo {
  id: string;
  customer_id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  tier: string;
}

export interface StripeConfig {
  secret_key: string;
  webhook_secret: string;
  price_pro_monthly: string;
  price_pro_yearly: string;
  price_elite_monthly: string;
  price_elite_yearly: string;
}

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

// Detect if running in Tauri or browser
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export class StripeService {
  /**
   * Check Stripe configuration status
   */
  static async getStatus(): Promise<StripeStatus> {
    try {
      if (isTauri()) {
        // In Tauri, check via backend command
        return await invoke<StripeStatus>('get_stripe_status');
      } else {
        // In web, use Next.js API
        const response = await fetch('/api/stripe/status');
        if (!response.ok) {
          throw new Error('Failed to get Stripe status');
        }
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get Stripe status:', error);
      return {
        configured: false,
        mode: null,
        publishableKey: null,
        hasSecretKey: false,
        hasWebhookSecret: false,
        pricesConfigured: { starter: false, pro: false, business: false, elite: false },
        message: 'Unable to check Stripe configuration',
      };
    }
  }

  /**
   * Create a Stripe checkout session for subscription
   */
  static async createCheckoutSession(
    tier: 'pro' | 'elite',
    billingPeriod: 'monthly' | 'yearly',
    userId: string,
    userEmail: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSessionResponse> {
    try {
      if (isTauri()) {
        // Use Tauri backend
        const response = await invoke<CheckoutSessionResponse>(
          'create_stripe_checkout_session',
          {
            tier,
            billingPeriod,
            userId,
            userEmail,
            successUrl,
            cancelUrl,
          }
        );
        return response;
      } else {
        // Use Next.js API for web
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier,
            billingPeriod,
            userEmail,
            userId,
            successUrl,
            cancelUrl,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        return await response.json();
      }
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to create checkout session'
      );
    }
  }

  /**
   * Get subscription information
   */
  static async getSubscription(
    subscriptionId: string
  ): Promise<SubscriptionInfo> {
    try {
      const info = await invoke<SubscriptionInfo>('get_stripe_subscription', {
        subscriptionId,
      });
      return info;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to get subscription info'
      );
    }
  }

  /**
   * Cancel subscription (at period end)
   */
  static async cancelSubscription(
    subscriptionId: string
  ): Promise<SubscriptionInfo> {
    try {
      const info = await invoke<SubscriptionInfo>(
        'cancel_stripe_subscription',
        {
          subscriptionId,
        }
      );
      return info;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to cancel subscription'
      );
    }
  }

  /**
   * Resume subscription (remove cancel_at_period_end)
   */
  static async resumeSubscription(
    subscriptionId: string
  ): Promise<SubscriptionInfo> {
    try {
      const info = await invoke<SubscriptionInfo>(
        'resume_stripe_subscription',
        {
          subscriptionId,
        }
      );
      return info;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to resume subscription'
      );
    }
  }

  /**
   * Create customer portal session (for managing payment methods, invoices, etc)
   */
  static async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<string> {
    try {
      const url = await invoke<string>('create_stripe_portal_session', {
        customerId,
        returnUrl,
      });
      return url;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to create portal session'
      );
    }
  }

  /**
   * Set Stripe configuration (API keys and price IDs)
   */
  static async setConfig(config: StripeConfig): Promise<void> {
    try {
      await invoke('set_stripe_config', {
        secretKey: config.secret_key,
        webhookSecret: config.webhook_secret,
        priceProMonthly: config.price_pro_monthly,
        priceProYearly: config.price_pro_yearly,
        priceEliteMonthly: config.price_elite_monthly,
        priceEliteYearly: config.price_elite_yearly,
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to set Stripe config'
      );
    }
  }

  /**
   * Open Stripe checkout in browser
   */
  static async openCheckout(
    tier: 'pro' | 'elite',
    billingPeriod: 'monthly' | 'yearly',
    userId: string,
    userEmail: string
  ): Promise<void> {
    const baseUrl = window.location.origin;
    const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/pricing`;

    const session = await this.createCheckoutSession(
      tier,
      billingPeriod,
      userId,
      userEmail,
      successUrl,
      cancelUrl
    );

    // Open Stripe checkout URL in external browser
    window.open(session.url, '_blank');
  }

  /**
   * Open customer portal in browser
   */
  static async openPortal(customerId: string): Promise<void> {
    const returnUrl = `${window.location.origin}/settings/subscription`;
    const url = await this.createPortalSession(customerId, returnUrl);
    window.open(url, '_blank');
  }
}
