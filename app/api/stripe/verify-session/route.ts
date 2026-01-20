/**
 * Verify Stripe Checkout Session API
 * Route: GET /api/stripe/verify-session?session_id=xxx
 * 
 * Verifies a completed checkout session and returns subscription details.
 * Used by the checkout success page to confirm payment.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeConfig } from '@/lib/config/stripe';

// ============================================================================
// CORS HEADERS
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ============================================================================
// OPTIONS HANDLER
// ============================================================================

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// ============================================================================
// GET HANDLER - Verify Session
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing session_id parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get Stripe configuration
    const config = getStripeConfig();
    
    if (!config.secretKey) {
      return NextResponse.json(
        { success: false, error: 'Payment system not configured' },
        { status: 503, headers: corsHeaders }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(config.secretKey, {
      apiVersion: '2025-12-15.clover',
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer', 'line_items'],
    });

    // Validate session
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check payment status
    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Extract subscription data if available
    let subscriptionData = null;
    if (session.subscription && typeof session.subscription === 'object') {
      // Use unknown to access properties that may vary by API version
      const subscription = session.subscription as unknown as Record<string, unknown>;
      const currentPeriodEnd = subscription.current_period_end as number || 0;
      const cancelAtPeriodEnd = subscription.cancel_at_period_end as boolean || false;
      
      subscriptionData = {
        id: subscription.id as string,
        tier: session.metadata?.tier || 'pro',
        status: subscription.status as string,
        currentPeriodEnd: currentPeriodEnd > 0 
          ? new Date(currentPeriodEnd * 1000).toISOString() 
          : new Date().toISOString(),
        cancelAtPeriodEnd,
      };
    }

    // Extract customer data
    let customerData = null;
    if (session.customer && typeof session.customer === 'object') {
      const customer = session.customer as Stripe.Customer;
      customerData = {
        email: customer.email || session.customer_email || '',
        name: customer.name || '',
      };
    } else if (session.customer_email) {
      customerData = {
        email: session.customer_email,
        name: session.customer_details?.name || '',
      };
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        subscription: subscriptionData,
        customer: customerData,
        sessionId: session.id,
        mode: session.mode,
        status: session.status,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[Stripe Verify Session] Error:', error);
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: error.code 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to verify session' 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
