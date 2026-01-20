/**
 * Stripe Checkout Session API Route
 * Creates a checkout session for web users (non-Tauri)
 * 
 * POST /api/stripe/checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeSecretKey, getConfig } from '@/lib/config/config-service';

// Get Stripe instance (created lazily to use latest config)
function getStripeInstance(): Stripe | null {
  const secretKey = getStripeSecretKey();
  if (!secretKey) return null;
  
  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
  });
}

// Get Price IDs from config (supports SuperAdmin override)
function getPriceIds(): Record<string, { monthly: string; yearly: string }> {
  return {
    starter: {
      monthly: getConfig('STRIPE_PRICE_STARTER_MONTHLY', 'price_starter_monthly'),
      yearly: getConfig('STRIPE_PRICE_STARTER_YEARLY', 'price_starter_yearly'),
    },
    pro: {
      monthly: getConfig('STRIPE_PRICE_PRO_MONTHLY', 'price_pro_monthly'),
      yearly: getConfig('STRIPE_PRICE_PRO_YEARLY', 'price_pro_yearly'),
    },
    business: {
      monthly: getConfig('STRIPE_PRICE_BUSINESS_MONTHLY', 'price_business_monthly'),
      yearly: getConfig('STRIPE_PRICE_BUSINESS_YEARLY', 'price_business_yearly'),
    },
    elite: {
      monthly: getConfig('STRIPE_PRICE_ELITE_MONTHLY', 'price_elite_monthly'),
      yearly: getConfig('STRIPE_PRICE_ELITE_YEARLY', 'price_elite_yearly'),
    },
  };
}

export interface CheckoutRequest {
  tier: 'starter' | 'pro' | 'business' | 'elite';
  billingPeriod?: 'monthly' | 'yearly';
  billingCycle?: 'monthly' | 'yearly';
  userEmail?: string;
  userId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get Stripe instance (uses centralized config)
    const stripe = getStripeInstance();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in SuperAdmin panel.' },
        { status: 500 }
      );
    }

    const body: CheckoutRequest = await request.json();
    const { tier, userEmail, userId, successUrl: customSuccessUrl, cancelUrl: customCancelUrl } = body;
    // Support both billingPeriod and billingCycle for flexibility
    const billingPeriod = body.billingPeriod || body.billingCycle || 'monthly';

    // Validate request
    if (!tier || !['starter', 'pro', 'business', 'elite'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "starter", "pro", "business", or "elite"' },
        { status: 400 }
      );
    }

    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return NextResponse.json(
        { error: 'Invalid billing period. Must be "monthly" or "yearly"' },
        { status: 400 }
      );
    }

    // Get price ID from config
    const PRICE_IDS = getPriceIds();
    const priceId = PRICE_IDS[tier][billingPeriod];

    // Determine URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = customSuccessUrl || `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = customCancelUrl || `${origin}/pricing`;

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_email: userEmail || undefined,
      metadata: {
        tier,
        billingPeriod,
        userId: userId || 'web_user',
        source: 'web',
      },
      subscription_data: {
        metadata: {
          tier,
          billingPeriod,
          userId: userId || 'web_user',
        },
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('[Stripe Checkout] Error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
