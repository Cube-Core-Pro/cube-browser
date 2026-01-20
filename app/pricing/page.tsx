/**
 * Public Pricing Page
 * Web-only version without Tauri dependencies
 * Route: /pricing (via route group)
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Check, X, Zap, Crown, Rocket, ArrowRight, 
  Star, Menu, ChevronDown, ChevronUp, Building2,
  CreditCard
} from 'lucide-react';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { CubeLogo } from '@/components/brand/CubeLogo';

// ============================================================================
// TYPES
// ============================================================================

interface StripeStatus {
  configured: boolean;
  mode: 'live' | 'test' | null;
  message: string;
}

interface Plan {
  name: string;
  tier: string;
  description: string;
  price: { monthly: number | string; yearly: number | string };
  features: string[];
  cta: string;
  popular: boolean;
}

// ============================================================================
// PRICING PAGE COMPONENT
// ============================================================================

export default function PublicPricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Check Stripe status on mount
  useEffect(() => {
    const checkStripe = async () => {
      try {
        const res = await fetch('/api/stripe/status');
        if (res.ok) {
          setStripeStatus(await res.json());
        }
      } catch {
        console.log('Stripe status check failed');
      }
    };
    checkStripe();
  }, []);

  // Handle checkout
  const handleCheckout = useCallback(async (tier: string) => {
    if (tier === 'enterprise') {
      window.location.href = '/contact?plan=enterprise';
      return;
    }

    if (!stripeStatus?.configured) {
      alert('Payment system is being configured. Please try again later.');
      return;
    }

    setCheckoutLoading(tier);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          billingPeriod: billingCycle === 'yearly' ? 'yearly' : 'monthly',
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing`
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Checkout failed');
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  }, [billingCycle, stripeStatus]);

  // Pricing plans
  const plans: Plan[] = [
    {
      name: 'Starter',
      tier: 'starter',
      description: 'Perfect for individuals',
      price: { monthly: 29, yearly: 24 },
      features: [
        '5,000 actions/month',
        '3 concurrent workflows',
        'Chrome extension',
        'Email support',
        'Basic integrations',
        'Data export (CSV)'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      tier: 'pro',
      description: 'For growing teams',
      price: { monthly: 79, yearly: 66 },
      features: [
        '50,000 actions/month',
        '10 concurrent workflows',
        'Desktop app + Cloud',
        'Priority support',
        'Advanced integrations',
        'API access',
        'Team collaboration (5 users)',
        'Scheduled workflows'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Business',
      tier: 'business',
      description: 'For scaling companies',
      price: { monthly: 99, yearly: 83 },
      features: [
        '200,000 actions/month',
        '25 concurrent workflows',
        'Desktop + Cloud + Mobile',
        'Dedicated account manager',
        'Premium integrations',
        'Full API access',
        'Team collaboration (15 users)',
        'White-label option'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Enterprise',
      tier: 'enterprise',
      description: 'For large organizations',
      price: { monthly: 'Custom', yearly: 'Custom' },
      features: [
        'Unlimited actions',
        'Unlimited workflows',
        'Self-hosted option',
        '24/7 Dedicated support',
        'SSO & SAML',
        'Custom integrations',
        'SLA guarantee (99.99%)',
        'On-premise deployment'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  // FAQs
  const faqs = [
    {
      question: 'Do I need a credit card to start the free trial?',
      answer: 'No! Start your 14-day free trial without entering any payment information. You\'ll only be asked for payment details when you decide to upgrade.'
    },
    {
      question: 'Can I change plans later?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any price differences.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and process payments securely through Stripe.'
    },
    {
      question: 'Is there a refund policy?',
      answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied, contact us within 30 days for a full refund.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Navigation */}
      <SiteHeader variant="dark" />

      {/* Header */}
      <div className="pt-32 pb-12 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          Choose the plan that fits your needs. All plans include a 14-day free trial.
        </p>

        {/* Stripe Status - Hidden from public, only shown in admin context */}

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                billingCycle === 'yearly' ? 'left-8' : 'left-1'
              }`}
            />
          </button>
          <span className={`text-sm ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}>
            Yearly
          </span>
          {billingCycle === 'yearly' && (
            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
              Save 17%
            </span>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`relative rounded-2xl p-6 ${
                plan.popular
                  ? 'bg-gradient-to-b from-blue-600/20 to-purple-600/20 border-2 border-blue-500'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                {typeof plan.price.monthly === 'number' ? (
                  <>
                    <span className="text-4xl font-bold text-white">
                      ${billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly}
                    </span>
                    <span className="text-gray-400">/month</span>
                    {billingCycle === 'yearly' && typeof plan.price.yearly === 'number' && (
                      <p className="text-sm text-gray-500 mt-1">
                        Billed annually (${plan.price.yearly as number * 12}/year)
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-3xl font-bold text-white">Custom Pricing</span>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.tier)}
                disabled={checkoutLoading === plan.tier}
                className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                } disabled:opacity-50`}
              >
                {checkoutLoading === plan.tier ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <span className="text-white font-medium">{faq.question}</span>
                {expandedFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {expandedFaq === index && (
                <div className="px-6 pb-4 text-gray-400 text-sm">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <CubeLogo variant="icon" size="sm" theme="light" />
            © 2026 CUBE AI. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
