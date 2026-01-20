'use client';

import React, { useState } from 'react';
import { 
  DollarSign, Users, TrendingUp, Gift, Award, 
  ArrowRight, Check, Star, Zap, Globe, Shield,
  BarChart3, Boxes, Building2, Sparkles
} from 'lucide-react';
import { SiteHeader } from '@/components/shared/SiteHeader';
import './AffiliatePage.css';

export const AffiliatePage: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<string>('professional');

  const tiers = [
    {
      id: 'starter',
      name: 'Starter',
      commission: '20%',
      bonus: '$0',
      recurring: '6 months',
      minPayout: '$100',
      features: [
        'Basic tracking dashboard',
        'Standard affiliate links',
        'Email support',
        'Marketing materials kit',
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      commission: '30%',
      bonus: '$25',
      recurring: '12 months',
      minPayout: '$50',
      popular: true,
      features: [
        'All Starter benefits',
        'Priority support',
        'Custom landing pages',
        'Sub-affiliate program',
        'API access',
        'Weekly payouts option',
      ],
    },
    {
      id: 'elite',
      name: 'Elite Partner',
      commission: '40%',
      bonus: '$50',
      recurring: '24 months',
      minPayout: '$25',
      features: [
        'All Professional benefits',
        'White-label option',
        'Dedicated account manager',
        'Custom commission rates',
        'Co-marketing opportunities',
        'Revenue sharing deals',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      commission: '50%',
      bonus: '$100',
      recurring: 'Lifetime',
      minPayout: '$0',
      features: [
        'All Elite benefits',
        'Full white-label platform',
        'Custom domain support',
        'API white-label',
        'Custom contracts',
        'Equity consideration',
      ],
    },
  ];

  const benefits = [
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'High Commissions',
      description: 'Earn up to 50% recurring commission on every sale. The more you refer, the more you earn.',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Recurring Revenue',
      description: 'Get paid month after month for up to lifetime on subscription renewals.',
    },
    {
      icon: <Gift className="w-8 h-8" />,
      title: 'Signup Bonuses',
      description: 'Earn instant bonuses for every new customer you bring, on top of commissions.',
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'White-Label Ready',
      description: 'Launch your own branded version of CUBE AI tools with custom domain and branding.',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Sub-Affiliates',
      description: 'Build your own network and earn from your sub-affiliates\' referrals.',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Real-Time Analytics',
      description: 'Track clicks, conversions, and earnings in real-time with our advanced dashboard.',
    },
  ];

  const products = [
    {
      name: 'CUBE Nexum',
      description: 'Browser automation platform',
      avgSale: '$79/mo',
      commission: 'Up to $39.50/mo',
    },
    {
      name: 'CUBE Core',
      description: 'Enterprise suite (200+ modules)',
      avgSale: '$299/mo',
      commission: 'Up to $149.50/mo',
    },
    {
      name: 'CUBE Finance',
      description: 'Fintech & banking solutions',
      avgSale: '$499/mo',
      commission: 'Up to $249.50/mo',
    },
    {
      name: 'Investor Referrals',
      description: 'Refer investors to CUBE AI',
      avgSale: '$25,000+',
      commission: 'Up to 5% of investment',
    },
  ];

  return (
    <div className="affiliate-page">
      {/* Site Header */}
      <SiteHeader 
        variant="default" 
        ctaText="Become an Affiliate" 
        ctaHref="/affiliates/signup" 
      />

      {/* Hero Section */}
      <section className="affiliate-hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">
            <Award className="w-4 h-4" />
            <span>Partner Program</span>
          </div>
          <h1>
            Earn Up to <span className="gradient-text">50% Commission</span>
            <br />on Every Sale
          </h1>
          <p>
            Join the CUBE AI affiliate program and earn recurring commissions 
            promoting the most powerful enterprise AI tools. White-label options available.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-value">$2.5M+</span>
              <span className="stat-label">Paid to Affiliates</span>
            </div>
            <div className="stat">
              <span className="stat-value">5,000+</span>
              <span className="stat-label">Active Affiliates</span>
            </div>
            <div className="stat">
              <span className="stat-value">45%</span>
              <span className="stat-label">Avg. Commission</span>
            </div>
          </div>
          <div className="hero-ctas">
            <a href="/affiliates/signup" className="btn-hero-primary">
              Start Earning Today
              <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#calculator" className="btn-hero-secondary">
              <DollarSign className="w-5 h-5" />
              Calculate Earnings
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="section-header">
          <span className="section-tag">Why Join Us</span>
          <h2>Industry-Leading Affiliate Program</h2>
          <p>Everything you need to succeed as a CUBE AI partner</p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-card">
              <div className="benefit-icon">{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products to Promote */}
      <section className="products-section">
        <div className="section-header">
          <span className="section-tag">Products</span>
          <h2>What You&apos;ll Be Promoting</h2>
          <p>High-value enterprise products with excellent conversion rates</p>
        </div>

        <div className="products-grid">
          {products.map((product, index) => (
            <div key={index} className="product-card">
              <div className="product-icon">
                {index === 0 && <Globe className="w-8 h-8" />}
                {index === 1 && <Building2 className="w-8 h-8" />}
                {index === 2 && <Shield className="w-8 h-8" />}
                {index === 3 && <Sparkles className="w-8 h-8" />}
              </div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="product-stats">
                <div className="product-stat">
                  <span className="label">Avg. Sale</span>
                  <span className="value">{product.avgSale}</span>
                </div>
                <div className="product-stat">
                  <span className="label">Your Commission</span>
                  <span className="value highlight">{product.commission}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Commission Tiers */}
      <section className="tiers-section">
        <div className="section-header">
          <span className="section-tag">Commission Tiers</span>
          <h2>More Referrals = Higher Commissions</h2>
          <p>Automatically upgrade as you grow your network</p>
        </div>

        <div className="tiers-grid">
          {tiers.map((tier) => (
            <div 
              key={tier.id} 
              className={`tier-card ${tier.popular ? 'popular' : ''} ${selectedTier === tier.id ? 'selected' : ''}`}
              onClick={() => setSelectedTier(tier.id)}
            >
              {tier.popular && <div className="popular-badge">Most Popular</div>}
              <h3>{tier.name}</h3>
              <div className="tier-commission">
                <span className="commission-value">{tier.commission}</span>
                <span className="commission-label">Commission</span>
              </div>
              <div className="tier-details">
                <div className="detail">
                  <span className="label">Signup Bonus</span>
                  <span className="value">{tier.bonus}</span>
                </div>
                <div className="detail">
                  <span className="label">Recurring</span>
                  <span className="value">{tier.recurring}</span>
                </div>
                <div className="detail">
                  <span className="label">Min Payout</span>
                  <span className="value">{tier.minPayout}</span>
                </div>
              </div>
              <ul className="tier-features">
                {tier.features.map((feature, index) => (
                  <li key={index}>
                    <Check className="w-4 h-4" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="tier-cta">
                {tier.id === 'starter' ? 'Get Started' : 'Unlock This Tier'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* White Label Section */}
      <section className="whitelabel-section">
        <div className="whitelabel-container">
          <div className="whitelabel-content">
            <span className="section-tag">White-Label</span>
            <h2>Launch Your Own Branded Platform</h2>
            <p>
              Elite and Enterprise partners can fully white-label CUBE AI products 
              with custom branding, domains, and pricing.
            </p>
            <ul className="whitelabel-features">
              <li><Check className="w-5 h-5" /> Custom domain (yourcompany.com)</li>
              <li><Check className="w-5 h-5" /> Your logo and branding</li>
              <li><Check className="w-5 h-5" /> Custom pricing tiers</li>
              <li><Check className="w-5 h-5" /> Your support email</li>
              <li><Check className="w-5 h-5" /> Sub-affiliate program</li>
              <li><Check className="w-5 h-5" /> API white-labeling</li>
            </ul>
            <a href="/affiliates/whitelabel" className="btn-whitelabel">
              Learn About White-Label
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
          <div className="whitelabel-visual">
            <div className="browser-mockup">
              <div className="browser-header">
                <div className="browser-dots">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
                <div className="browser-url">yourcompany.com</div>
              </div>
              <div className="browser-content">
                <div className="mockup-header">
                  <Boxes className="w-6 h-6" />
                  <span>Your Brand</span>
                </div>
                <div className="mockup-body">
                  <div className="mockup-text" />
                  <div className="mockup-text short" />
                  <div className="mockup-button" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Start Earning?</h2>
          <p>Join thousands of affiliates earning recurring commissions with CUBE AI</p>
          <div className="cta-buttons">
            <a href="/affiliates/signup" className="btn-cta-primary">
              Create Affiliate Account
              <ArrowRight className="w-5 h-5" />
            </a>
            <a href="/contact?subject=affiliate" className="btn-cta-secondary">
              Contact Partnership Team
            </a>
          </div>
          <p className="cta-note">
            <Zap className="w-4 h-4" />
            Get approved in 24 hours and start earning immediately
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="affiliate-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <Boxes className="w-8 h-8" />
            <span>CUBE AI</span>
          </div>
          <div className="footer-links">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/affiliates/terms">Affiliate Terms</a>
            <a href="/contact">Contact</a>
          </div>
          <p className="footer-copyright">© 2026 CUBE AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AffiliatePage;
