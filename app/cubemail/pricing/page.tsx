/**
 * CubeMail.pro Pricing Page
 * 
 * Comprehensive pricing page with Free, Premium, and Business tiers.
 * Includes feature comparison and FAQ.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Mail, Check, X, ArrowRight, Star, Sparkles,
  ChevronRight, Users, Building, Zap, Shield,
  Cloud, Lock, Smartphone, HelpCircle
} from 'lucide-react';

import '../cubemail.css';
import './pricing.css';

// ============================================================================
// PRICING DATA
// ============================================================================

const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for personal email',
    price: 0,
    period: 'forever',
    cta: 'Get Started Free',
    ctaLink: '/signup',
    popular: false,
    features: [
      { name: '25 GB storage', included: true },
      { name: '@cubemail.pro address', included: true },
      { name: 'Full IMAP/SMTP access', included: true },
      { name: 'Basic AI Email Screener', included: true },
      { name: 'Mobile apps (iOS & Android)', included: true },
      { name: '3 email aliases', included: true },
      { name: '50 MB attachment size', included: true },
      { name: 'Spam & virus protection', included: true },
      { name: 'Two-factor authentication', included: true },
      { name: 'Custom domain', included: false },
      { name: 'Advanced AI Screener', included: false },
      { name: 'API access', included: false },
      { name: 'Priority support', included: false }
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For power users',
    price: 2.99,
    period: '/month',
    cta: 'Start Free Trial',
    ctaLink: '/signup?plan=premium',
    popular: true,
    features: [
      { name: '100 GB storage', included: true },
      { name: '@cubemail.pro address', included: true },
      { name: 'Full IMAP/SMTP access', included: true },
      { name: 'Advanced AI Email Screener', included: true },
      { name: 'Mobile apps (iOS & Android)', included: true },
      { name: 'Unlimited email aliases', included: true },
      { name: '100 MB attachment size', included: true },
      { name: 'Custom domain support', included: true },
      { name: 'Calendar sync', included: true },
      { name: 'API access', included: true },
      { name: 'Priority support', included: true },
      { name: 'Analytics dashboard', included: true },
      { name: 'Admin console', included: false }
    ]
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For teams & organizations',
    price: 5.99,
    period: '/user/month',
    cta: 'Contact Sales',
    ctaLink: '/business',
    popular: false,
    features: [
      { name: 'Unlimited storage', included: true },
      { name: 'Custom domain required', included: true },
      { name: 'Full IMAP/SMTP access', included: true },
      { name: 'Enterprise AI Screener', included: true },
      { name: 'All apps + desktop', included: true },
      { name: 'Unlimited aliases per user', included: true },
      { name: '150 MB attachment size', included: true },
      { name: 'Admin console', included: true },
      { name: 'Team management', included: true },
      { name: 'SSO integration (SAML)', included: true },
      { name: 'Audit logs', included: true },
      { name: '24/7 priority support', included: true },
      { name: 'Data loss prevention', included: true }
    ]
  }
];

const comparisonCategories = [
  {
    name: 'Storage & Email',
    features: [
      { name: 'Email storage', free: '25 GB', premium: '100 GB', business: 'Unlimited' },
      { name: 'Attachment size', free: '50 MB', premium: '100 MB', business: '150 MB' },
      { name: 'Email aliases', free: '3', premium: 'Unlimited', business: 'Unlimited' },
      { name: '@cubemail.pro address', free: true, premium: true, business: 'Optional' },
      { name: 'Custom domain', free: false, premium: true, business: 'Required' }
    ]
  },
  {
    name: 'AI & Automation',
    features: [
      { name: 'AI Email Screener', free: 'Basic', premium: 'Advanced', business: 'Enterprise' },
      { name: 'Smart categorization', free: true, premium: true, business: true },
      { name: 'Auto-replies', free: true, premium: true, business: true },
      { name: 'AI writing suggestions', free: false, premium: true, business: true },
      { name: 'Custom AI rules', free: false, premium: true, business: true }
    ]
  },
  {
    name: 'Security',
    features: [
      { name: 'Two-factor auth', free: true, premium: true, business: true },
      { name: 'E2E encryption', free: true, premium: true, business: true },
      { name: 'SSO (SAML/OIDC)', free: false, premium: false, business: true },
      { name: 'Audit logs', free: false, premium: 'Basic', business: 'Advanced' },
      { name: 'Data loss prevention', free: false, premium: false, business: true }
    ]
  },
  {
    name: 'Access & Apps',
    features: [
      { name: 'Web app', free: true, premium: true, business: true },
      { name: 'Mobile apps', free: true, premium: true, business: true },
      { name: 'Desktop apps', free: false, premium: true, business: true },
      { name: 'IMAP/SMTP', free: true, premium: true, business: true },
      { name: 'API access', free: false, premium: true, business: true }
    ]
  },
  {
    name: 'Support & Management',
    features: [
      { name: 'Support', free: 'Community', premium: 'Priority', business: '24/7' },
      { name: 'Admin console', free: false, premium: false, business: true },
      { name: 'Team management', free: false, premium: false, business: true },
      { name: 'Analytics', free: false, premium: 'Basic', business: 'Advanced' },
      { name: 'SLA', free: '99%', premium: '99.9%', business: '99.99%' }
    ]
  }
];

const faqItems = [
  {
    question: 'Can I try Premium before committing?',
    answer: 'Yes! Premium comes with a 14-day free trial, no credit card required. You can experience all Premium features risk-free before deciding.'
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely. There are no contracts or commitments. You can upgrade, downgrade, or cancel your subscription at any time from your account settings.'
  },
  {
    question: 'What happens to my emails if I downgrade?',
    answer: 'Your emails are never deleted. If you exceed the free tier\'s 25GB storage after downgrading, you\'ll need to delete some emails or upgrade again to send new messages.'
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes! Pay annually and get 2 months free. That\'s $29.99/year for Premium instead of $35.88 for monthly billing.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, Amex, Discover), PayPal, and Apple Pay. Business plans can also pay by invoice.'
  },
  {
    question: 'Is there a non-profit discount?',
    answer: 'Yes! We offer 50% off for registered non-profits and educational institutions. Contact us with proof of status to get your discount code.'
  },
  {
    question: 'What\'s included in the Business SLA?',
    answer: 'Business tier includes 99.99% uptime guarantee, 1-hour response time for critical issues, dedicated account manager, and priority incident handling.'
  },
  {
    question: 'Can I migrate from Gmail or other providers?',
    answer: 'Yes! We have free migration tools that import all your emails, contacts, and calendar from Gmail, Yahoo, Outlook, and any IMAP-compatible email provider.'
  }
];

// ============================================================================
// COMPONENTS
// ============================================================================

function PricingHero() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section className="pricing-hero">
      <div className="pricing-hero__content">
        <span className="pricing-hero__badge">
          <Sparkles className="h-4 w-4" />
          Simple Pricing
        </span>
        <h1 className="pricing-hero__title">
          Start free, upgrade
          <span className="pricing-hero__gradient"> when you need</span>
        </h1>
        <p className="pricing-hero__subtitle">
          All plans include core features. Upgrade for more storage, 
          custom domains, and premium support.
        </p>

        <div className="pricing-hero__toggle">
          <span className={!isAnnual ? 'active' : ''}>Monthly</span>
          <button 
            className={`pricing-toggle ${isAnnual ? 'annual' : ''}`}
            onClick={() => setIsAnnual(!isAnnual)}
          >
            <span className="pricing-toggle__slider" />
          </button>
          <span className={isAnnual ? 'active' : ''}>
            Annual
            <span className="pricing-hero__savings">Save 16%</span>
          </span>
        </div>
      </div>

      <div className="pricing-cards">
        {pricingPlans.map((plan) => (
          <div 
            key={plan.id} 
            className={`pricing-card ${plan.popular ? 'popular' : ''}`}
          >
            {plan.popular && (
              <div className="pricing-card__badge">Most Popular</div>
            )}
            
            <div className="pricing-card__header">
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
            </div>

            <div className="pricing-card__price">
              <span className="pricing-card__currency">$</span>
              <span className="pricing-card__amount">
                {isAnnual && plan.price > 0 
                  ? (plan.price * 10 / 12).toFixed(2) 
                  : plan.price}
              </span>
              <span className="pricing-card__period">{plan.period}</span>
            </div>

            {isAnnual && plan.price > 0 && (
              <p className="pricing-card__annual">
                Billed ${(plan.price * 10).toFixed(2)} annually
              </p>
            )}

            <Link href={plan.ctaLink} className={`pricing-card__button ${plan.popular ? 'primary' : 'secondary'}`}>
              {plan.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <ul className="pricing-card__features">
              {plan.features.slice(0, 9).map((feature, index) => (
                <li key={index} className={feature.included ? 'included' : 'excluded'}>
                  {feature.included ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span>{feature.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComparisonTable() {
  return (
    <section className="pricing-comparison">
      <div className="pricing-comparison__header">
        <h2>Compare all features</h2>
        <p>Everything you get with each plan</p>
      </div>

      <div className="pricing-comparison__table-wrapper">
        <table className="pricing-comparison__table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Free</th>
              <th className="highlight">Premium</th>
              <th>Business</th>
            </tr>
          </thead>
          <tbody>
            {comparisonCategories.map((category, catIndex) => (
              <React.Fragment key={catIndex}>
                <tr className="category-row">
                  <td colSpan={4}>{category.name}</td>
                </tr>
                {category.features.map((feature, featIndex) => (
                  <tr key={featIndex}>
                    <td>{feature.name}</td>
                    <td>
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300" />
                        )
                      ) : (
                        feature.free
                      )}
                    </td>
                    <td className="highlight">
                      {typeof feature.premium === 'boolean' ? (
                        feature.premium ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300" />
                        )
                      ) : (
                        feature.premium
                      )}
                    </td>
                    <td>
                      {typeof feature.business === 'boolean' ? (
                        feature.business ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300" />
                        )
                      ) : (
                        feature.business
                      )}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="pricing-faq">
      <div className="pricing-faq__header">
        <HelpCircle className="h-8 w-8" />
        <h2>Frequently Asked Questions</h2>
        <p>Everything you need to know about our pricing</p>
      </div>

      <div className="pricing-faq__grid">
        {faqItems.map((item, index) => (
          <div 
            key={index} 
            className={`pricing-faq__item ${openIndex === index ? 'open' : ''}`}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <div className="pricing-faq__question">
              <span>{item.question}</span>
              <ChevronRight className="h-5 w-5" />
            </div>
            <div className="pricing-faq__answer">
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EnterpriseCTA() {
  return (
    <section className="pricing-enterprise">
      <div className="pricing-enterprise__content">
        <Building className="h-12 w-12" />
        <h2>Need a custom plan for your enterprise?</h2>
        <p>
          For organizations with 100+ users, we offer custom pricing, 
          dedicated infrastructure, and advanced compliance features.
        </p>
        <div className="pricing-enterprise__features">
          <div className="pricing-enterprise__feature">
            <Shield className="h-5 w-5" />
            <span>HIPAA Compliance</span>
          </div>
          <div className="pricing-enterprise__feature">
            <Lock className="h-5 w-5" />
            <span>Dedicated Infrastructure</span>
          </div>
          <div className="pricing-enterprise__feature">
            <Users className="h-5 w-5" />
            <span>Custom Integrations</span>
          </div>
        </div>
        <Link href="/enterprise" className="pricing-enterprise__button">
          Contact Enterprise Sales
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}

function PricingNav() {
  return (
    <nav className="pricing-nav">
      <div className="pricing-nav__content">
        <Link href="/cubemail" className="pricing-nav__logo">
          <Mail className="h-7 w-7" />
          <span>CubeMail</span>
        </Link>
        
        <div className="pricing-nav__links">
          <Link href="/cubemail/features">Features</Link>
          <Link href="/cubemail/pricing" className="active">Pricing</Link>
          <Link href="/cubemail/security">Security</Link>
          <Link href="/cubemail/apps">Apps</Link>
        </div>
        
        <div className="pricing-nav__actions">
          <Link href="/login" className="pricing-nav__login">Log in</Link>
          <Link href="/signup" className="pricing-nav__signup">Sign up free</Link>
        </div>
      </div>
    </nav>
  );
}

function PricingFooter() {
  return (
    <footer className="cubemail-footer">
      <div className="cubemail-footer__content">
        <div className="cubemail-footer__brand">
          <div className="cubemail-footer__logo">
            <Mail className="h-8 w-8" />
            <span>CubeMail</span>
          </div>
          <p className="cubemail-footer__tagline">
            Email without compromise. Free, private, powerful.
          </p>
        </div>
        
        <div className="cubemail-footer__links">
          <div className="cubemail-footer__column">
            <h4>Product</h4>
            <Link href="/cubemail/features">Features</Link>
            <Link href="/cubemail/pricing">Pricing</Link>
            <Link href="/cubemail/security">Security</Link>
            <Link href="/cubemail/apps">Apps</Link>
          </div>
          <div className="cubemail-footer__column">
            <h4>Company</h4>
            <Link href="/about">About</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/careers">Careers</Link>
          </div>
          <div className="cubemail-footer__column">
            <h4>Legal</h4>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/gdpr">GDPR</Link>
          </div>
        </div>
      </div>
      
      <div className="cubemail-footer__bottom">
        <p>© 2026 CubeMail. All rights reserved.</p>
        <p>
          Part of the{' '}
          <Link href="https://cubeai.tools" className="cubemail-footer__cube-link">
            CUBE AI.tools
          </Link>{' '}
          ecosystem.
        </p>
      </div>
    </footer>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CubeMailPricing() {
  return (
    <div className="cubemail-pricing-page">
      <PricingNav />
      
      <main>
        <PricingHero />
        <ComparisonTable />
        <PricingFAQ />
        <EnterpriseCTA />
      </main>
      
      <PricingFooter />
    </div>
  );
}
