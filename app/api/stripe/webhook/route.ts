/**
 * Stripe Webhook Handler API Route
 * Handles Stripe events for subscription management
 * 
 * POST /api/stripe/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import db from '@/lib/database';
import { getStripeSecretKey, getStripeWebhookSecret, getConfig } from '@/lib/config/config-service';

// Get Stripe instance (created lazily to use latest config)
function getStripeInstance(): Stripe | null {
  const secretKey = getStripeSecretKey();
  if (!secretKey) return null;
  
  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
  });
}

// Subscription tier based on price
function getTierFromPrice(priceId: string): 'FREE' | 'PRO' | 'ELITE' {
  const proPrices = [
    getConfig('STRIPE_PRICE_PRO_MONTHLY', ''),
    getConfig('STRIPE_PRICE_PRO_YEARLY', ''),
  ];
  const elitePrices = [
    getConfig('STRIPE_PRICE_ELITE_MONTHLY', ''),
    getConfig('STRIPE_PRICE_ELITE_YEARLY', ''),
  ];

  if (proPrices.includes(priceId)) return 'PRO';
  if (elitePrices.includes(priceId)) return 'ELITE';
  return 'FREE';
}

// Helper to update or create subscription
async function upsertSubscription(
  customerId: string,
  subscriptionId: string,
  priceId: string,
  status: string,
  currentPeriodStart?: Date,
  currentPeriodEnd?: Date,
  cancelAt?: Date | null
) {
  const tier = getTierFromPrice(priceId);
  
  // Find user by stripe customer ID or email
  const userResult = await db.query<{ id: string }>(
    `SELECT id FROM users WHERE stripe_customer_id = $1 LIMIT 1`,
    [customerId]
  );
  
  if (userResult.rows.length === 0) {
    console.warn(`[Stripe Webhook] No user found for customer ${customerId}`);
    return null;
  }
  
  const userId = userResult.rows[0].id;
  
  // Upsert subscription
  const result = await db.query(
    `INSERT INTO subscriptions (
      user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
      tier, status, current_period_start, current_period_end, cancel_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      stripe_price_id = EXCLUDED.stripe_price_id,
      tier = EXCLUDED.tier,
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at = EXCLUDED.cancel_at,
      updated_at = NOW()
    RETURNING *`,
    [
      userId,
      customerId,
      subscriptionId,
      priceId,
      tier,
      status.toUpperCase(),
      currentPeriodStart,
      currentPeriodEnd,
      cancelAt
    ]
  );
  
  // Also update license key tier
  await db.query(
    `UPDATE license_keys SET tier = $1, updated_at = NOW() WHERE user_id = $2 AND is_active = true`,
    [tier, userId]
  );
  
  return result.rows[0];
}

export async function POST(request: NextRequest) {
  try {
    // Get Stripe instance
    const stripe = getStripeInstance();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }
    
    const webhookSecret = getStripeWebhookSecret();
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.warn('[Stripe Webhook] Webhook secret not configured, skipping verification');
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } else {
        event = JSON.parse(body) as Stripe.Event;
      }
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[Stripe Webhook] Checkout completed:', session.id);
        
        // Get subscription details
        if (session.subscription && session.customer) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subscription: any = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          const priceId = subscription.items.data[0]?.price.id || '';
          const tier = getTierFromPrice(priceId);
          
          // Save subscription to database
          await upsertSubscription(
            session.customer as string,
            session.subscription as string,
            priceId,
            subscription.status,
            new Date((subscription.current_period_start || 0) * 1000),
            new Date((subscription.current_period_end || 0) * 1000),
            subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null
          );
          
          console.log('[Stripe Webhook] Subscription saved:', {
            customerId: session.customer,
            subscriptionId: session.subscription,
            tier,
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription: any = event.data.object;
        console.log('[Stripe Webhook] Subscription updated:', subscription.id);
        
        const priceId = subscription.items.data[0]?.price.id || '';
        
        // Update subscription in database
        await upsertSubscription(
          subscription.customer as string,
          subscription.id,
          priceId,
          subscription.status,
          new Date((subscription.current_period_start || 0) * 1000),
          new Date((subscription.current_period_end || 0) * 1000),
          subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null
        );
        
        console.log('[Stripe Webhook] Subscription updated in DB:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[Stripe Webhook] Subscription cancelled:', subscription.id);
        
        // Update subscription status to cancelled and downgrade tier
        await db.query(
          `UPDATE subscriptions SET status = 'CANCELED', canceled_at = NOW(), updated_at = NOW() 
           WHERE stripe_subscription_id = $1`,
          [subscription.id]
        );
        
        // Downgrade user's license to FREE
        await db.query(
          `UPDATE license_keys SET tier = 'FREE', updated_at = NOW() 
           WHERE user_id = (SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1)
           AND is_active = true`,
          [subscription.id]
        );
        
        console.log('[Stripe Webhook] User downgraded to FREE tier');
        break;
      }

      case 'invoice.payment_succeeded': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice: any = event.data.object;
        console.log('[Stripe Webhook] Payment succeeded:', invoice.id);
        
        const subscriptionId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription?.id;
          
        if (subscriptionId) {
          // Update billing period
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
          const periodStart = subscription.current_period_start || 0;
          const periodEnd = subscription.current_period_end || 0;
          
          await db.query(
            `UPDATE subscriptions SET 
              status = 'ACTIVE',
              current_period_start = $1,
              current_period_end = $2,
              updated_at = NOW()
             WHERE stripe_subscription_id = $3`,
            [
              new Date(periodStart * 1000),
              new Date(periodEnd * 1000),
              subscriptionId
            ]
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice: any = event.data.object;
        console.log('[Stripe Webhook] Payment failed:', invoice.id);
        
        const subscriptionId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription?.id;
          
        if (subscriptionId) {
          // Mark subscription as past due
          await db.query(
            `UPDATE subscriptions SET status = 'PAST_DUE', updated_at = NOW() 
             WHERE stripe_subscription_id = $1`,
            [subscriptionId]
          );
          
          // Log event for notification system to pick up
          console.log('[Stripe Webhook] Subscription marked as PAST_DUE, notification pending');
        }
        break;
      }

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
