/**
 * Stripe Customer Portal API Route
 * Creates a billing portal session for subscription management
 * 
 * POST /api/stripe/portal
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeSecretKey } from '@/lib/config/config-service';

// Get Stripe instance (created lazily to use latest config)
function getStripeInstance(): Stripe | null {
  const secretKey = getStripeSecretKey();
  if (!secretKey) return null;
  
  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
  });
}

export interface PortalRequest {
  customerId: string;
  returnUrl?: string;
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

    const body: PortalRequest = await request.json();
    const { customerId, returnUrl } = body;

    // Validate request
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Determine return URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const finalReturnUrl = returnUrl || `${origin}/settings/subscription`;

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: finalReturnUrl,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('[Stripe Portal] Error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

/**
 * GET - Verify subscription status
 */
export async function GET(request: NextRequest) {
  try {
    // Get Stripe instance (uses centralized config)
    const stripe = getStripeInstance();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in SuperAdmin panel.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (!session.subscription) {
      return NextResponse.json(
        { error: 'No subscription found for this session' },
        { status: 404 }
      );
    }

    const subscription = session.subscription as Stripe.Subscription;
    const customer = session.customer as Stripe.Customer;

    // Get price and tier info - uses centralized config
    const { getConfig } = await import('@/lib/config/config-service');
    const priceId = subscription.items.data[0]?.price.id || '';
    const proPrices = [
      getConfig('STRIPE_PRICE_PRO_MONTHLY', ''),
      getConfig('STRIPE_PRICE_PRO_YEARLY', ''),
    ];
    const elitePrices = [
      getConfig('STRIPE_PRICE_ELITE_MONTHLY', ''),
      getConfig('STRIPE_PRICE_ELITE_YEARLY', ''),
    ];

    let tier: 'free' | 'pro' | 'elite' = 'free';
    if (proPrices.includes(priceId)) tier = 'pro';
    if (elitePrices.includes(priceId)) tier = 'elite';

    // Get billing cycle information from subscription items
    const subscriptionItem = subscription.items.data[0];
    const currentPeriodStart = subscriptionItem?.created || Math.floor(Date.now() / 1000);
    const currentPeriodEnd = subscription.cancel_at || subscription.canceled_at || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    return NextResponse.json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      customerEmail: customer.email,
      status: subscription.status,
      tier,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error('[Stripe Portal] Error verifying session:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify session' },
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
