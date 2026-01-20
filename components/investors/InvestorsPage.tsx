'use client';

import React, { useState } from 'react';
import {
  TrendingUp, Users, Globe, Shield, Zap, Award,
  ChevronRight, Check, Star, ArrowRight,
  Building2, Rocket, BarChart3, DollarSign,
  Mail, FileText, Calendar, Target
} from 'lucide-react';
import './InvestorsPage.css';
import { SiteHeader } from '@/components/shared/SiteHeader';

// Investment tiers
const investmentTiers = [
  {
    name: 'Angel',
    minInvestment: 5000,
    maxInvestment: 25000,
    equity: '0.05% - 0.25%',
    benefits: [
      'Lifetime Pro subscription',
      'Early access to new features',
      'Investor newsletter updates',
      'Name in credits (optional)',
      'Priority support channel',
    ],
    highlight: false,
  },
  {
    name: 'Seed',
    minInvestment: 25000,
    maxInvestment: 100000,
    equity: '0.25% - 1%',
    benefits: [
      'Everything in Angel tier',
      'Lifetime Elite subscription',
      'Quarterly investor calls',
      'Advisory board observer seat',
      'Co-marketing opportunities',
      'Beta access to enterprise features',
    ],
    highlight: true,
  },
  {
    name: 'Strategic',
    minInvestment: 100000,
    maxInvestment: 500000,
    equity: '1% - 5%',
    benefits: [
      'Everything in Seed tier',
      'Board advisor position',
      'Revenue share option (1%)',
      'White-label licensing rights',
      'Custom feature development',
      'Dedicated account manager',
      'Annual strategy sessions',
    ],
    highlight: false,
  },
];

// Company metrics
const metrics = [
  { label: 'Lines of Code', value: '300K+', icon: <FileText className="w-6 h-6" /> },
  { label: 'Rust Backend', value: '156K LOC', icon: <Shield className="w-6 h-6" /> },
  { label: 'Test Coverage', value: '275 Tests', icon: <Check className="w-6 h-6" /> },
  { label: 'Build Status', value: 'Production', icon: <Rocket className="w-6 h-6" /> },
];

// Market opportunity
const marketData = [
  { label: 'TAM (Browser Automation)', value: '$15.2B', growth: '+23% CAGR' },
  { label: 'SAM (Enterprise Tools)', value: '$4.8B', growth: '+31% CAGR' },
  { label: 'SOM (First 3 Years)', value: '$50M', growth: 'Target' },
];

// Competitive advantages
const advantages = [
  {
    title: 'Full Desktop App',
    description: 'Unlike web-only competitors, we offer a native desktop app with Tauri/Rust for maximum performance and privacy.',
    icon: <Zap className="w-8 h-8" />,
  },
  {
    title: 'AI-First Architecture',
    description: 'GPT-5 integration for natural language automation, smart selectors, and self-healing workflows.',
    icon: <Star className="w-8 h-8" />,
  },
  {
    title: 'Enterprise Security',
    description: 'SOC2 compliance path, self-hosted options, and end-to-end encryption for sensitive data.',
    icon: <Shield className="w-8 h-8" />,
  },
  {
    title: 'Complete Tech Stack',
    description: 'Browser, VPN, terminal, automation, and AI all in one platform - no competitors offer this combination.',
    icon: <Building2 className="w-8 h-8" />,
  },
];

// Team (placeholder - customize)
const team = [
  {
    name: 'Founder',
    role: 'CEO & Technical Lead',
    background: 'Full-stack developer with 10+ years in automation and AI',
    linkedin: '#',
  },
];

// Roadmap
const roadmap = [
  { quarter: 'Q1 2026', milestone: 'Public Launch', status: 'current' },
  { quarter: 'Q2 2026', milestone: '1,000 Paying Users', status: 'upcoming' },
  { quarter: 'Q3 2026', milestone: 'Enterprise Tier Launch', status: 'upcoming' },
  { quarter: 'Q4 2026', milestone: 'Series A Preparation', status: 'upcoming' },
  { quarter: 'Q1 2027', milestone: '$1M ARR Target', status: 'future' },
];

export const InvestorsPage: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="investors-page">
      {/* Site Header */}
      <SiteHeader 
        variant="investors" 
        ctaText="Invest Now" 
        ctaHref="#investment-tiers" 
      />

      {/* Hero Section */}
      <section className="investor-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <TrendingUp className="w-4 h-4" />
            <span>Seeking Strategic Investment</span>
          </div>
          
          <h1>Invest in the Future of<br /><span className="gradient-text">Browser Automation</span></h1>
          
          <p className="hero-subtitle">
            CUBE Nexum is building the most comprehensive automation platform for enterprises.
            Join us as we revolutionize how businesses interact with the web.
          </p>
          
          <div className="hero-stats">
            {metrics.map((metric, index) => (
              <div key={index} className="stat-item">
                {metric.icon}
                <div>
                  <span className="stat-value">{metric.value}</span>
                  <span className="stat-label">{metric.label}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="hero-ctas">
            <a href="#investment-tiers" className="btn-primary">
              View Investment Tiers
              <ChevronRight className="w-5 h-5" />
            </a>
            <a href="#contact" className="btn-secondary" onClick={() => setShowContactForm(true)}>
              Schedule a Call
              <Calendar className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="market-section">
        <div className="section-header">
          <h2>Market Opportunity</h2>
          <p>The browser automation market is experiencing explosive growth</p>
        </div>
        
        <div className="market-grid">
          {marketData.map((item, index) => (
            <div key={index} className="market-card">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              <span className="market-value">{item.value}</span>
              <span className="market-label">{item.label}</span>
              <span className="market-growth">{item.growth}</span>
            </div>
          ))}
        </div>
        
        <div className="market-narrative">
          <h3>Why Now?</h3>
          <ul>
            <li>
              <Check className="w-5 h-5 text-green-500" />
              <span>AI revolution making automation accessible to non-developers</span>
            </li>
            <li>
              <Check className="w-5 h-5 text-green-500" />
              <span>Remote work driving demand for productivity tools</span>
            </li>
            <li>
              <Check className="w-5 h-5 text-green-500" />
              <span>Enterprises seeking alternatives to fragmented tool stacks</span>
            </li>
            <li>
              <Check className="w-5 h-5 text-green-500" />
              <span>Privacy concerns pushing demand for self-hosted solutions</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="advantages-section">
        <div className="section-header">
          <h2>Competitive Advantages</h2>
          <p>What sets CUBE Nexum apart from the competition</p>
        </div>
        
        <div className="advantages-grid">
          {advantages.map((advantage, index) => (
            <div key={index} className="advantage-card">
              <div className="advantage-icon">{advantage.icon}</div>
              <h3>{advantage.title}</h3>
              <p>{advantage.description}</p>
            </div>
          ))}
        </div>
        
        <div className="competitors-comparison">
          <h3>vs. Competitors</h3>
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>CUBE Nexum</th>
                <th>Zapier</th>
                <th>Selenium</th>
                <th>Bardeen</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Desktop App</td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td>AI Integration</td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
                <td>Limited</td>
                <td>-</td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
              </tr>
              <tr>
                <td>Self-Hosted</td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
                <td>-</td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
                <td>-</td>
              </tr>
              <tr>
                <td>Visual Builder</td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
                <td>-</td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
              </tr>
              <tr>
                <td>Browser + VPN + Terminal</td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Investment Tiers */}
      <section id="investment-tiers" className="tiers-section">
        <div className="section-header">
          <h2>Investment Opportunities</h2>
          <p>Choose the tier that matches your investment goals</p>
        </div>
        
        <div className="tiers-grid">
          {investmentTiers.map((tier, index) => (
            <div
              key={index}
              className={`tier-card ${tier.highlight ? 'highlighted' : ''} ${selectedTier === tier.name ? 'selected' : ''}`}
              onClick={() => setSelectedTier(tier.name)}
            >
              {tier.highlight && <div className="tier-badge">Most Popular</div>}
              
              <h3 className="tier-name">{tier.name}</h3>
              
              <div className="tier-investment">
                <span className="investment-range">
                  {formatCurrency(tier.minInvestment)} - {formatCurrency(tier.maxInvestment)}
                </span>
                <span className="equity-range">{tier.equity} equity</span>
              </div>
              
              <ul className="tier-benefits">
                {tier.benefits.map((benefit, idx) => (
                  <li key={idx}>
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <button
                className="tier-cta"
                onClick={() => setShowContactForm(true)}
              >
                Express Interest
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="investment-note">
          <Shield className="w-6 h-6" />
          <p>
            All investments are structured through a SAFE (Simple Agreement for Future Equity)
            or convertible note, depending on investor preference and jurisdiction.
          </p>
        </div>
      </section>

      {/* Roadmap */}
      <section className="roadmap-section">
        <div className="section-header">
          <h2>Product Roadmap</h2>
          <p>Our path to market leadership</p>
        </div>
        
        <div className="roadmap-timeline">
          {roadmap.map((item, index) => (
            <div key={index} className={`roadmap-item ${item.status}`}>
              <div className="roadmap-marker" />
              <div className="roadmap-content">
                <span className="roadmap-quarter">{item.quarter}</span>
                <span className="roadmap-milestone">{item.milestone}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Use of Funds */}
      <section className="funds-section">
        <div className="section-header">
          <h2>Use of Funds</h2>
          <p>How your investment will accelerate growth</p>
        </div>
        
        <div className="funds-allocation">
          <div className="fund-item">
            <div className="fund-bar fund-bar-40" />
            <div className="fund-details">
              <span className="fund-percentage">40%</span>
              <span className="fund-label">Engineering & Product</span>
              <span className="fund-description">Expand team, build enterprise features</span>
            </div>
          </div>
          <div className="fund-item">
            <div className="fund-bar fund-bar-30" />
            <div className="fund-details">
              <span className="fund-percentage">30%</span>
              <span className="fund-label">Sales & Marketing</span>
              <span className="fund-description">Growth marketing, enterprise sales team</span>
            </div>
          </div>
          <div className="fund-item">
            <div className="fund-bar fund-bar-15" />
            <div className="fund-details">
              <span className="fund-percentage">15%</span>
              <span className="fund-label">Infrastructure</span>
              <span className="fund-description">Servers, security certifications, compliance</span>
            </div>
          </div>
          <div className="fund-item">
            <div className="fund-bar fund-bar-15" />
            <div className="fund-details">
              <span className="fund-percentage">15%</span>
              <span className="fund-label">Operations & Legal</span>
              <span className="fund-description">Legal, accounting, SOC2 certification</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="contact-section">
        <div className="section-header">
          <h2>Get in Touch</h2>
          <p>Interested in investing? Let&apos;s talk.</p>
        </div>
        
        <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" placeholder="John Smith" required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" placeholder="john@company.com" required />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="company">Company/Fund</label>
              <input type="text" id="company" placeholder="Acme Ventures" />
            </div>
            <div className="form-group">
              <label htmlFor="tier">Investment Tier</label>
              <select id="tier" defaultValue="">
                <option value="" disabled>Select a tier</option>
                <option value="angel">Angel ($5K - $25K)</option>
                <option value="seed">Seed ($25K - $100K)</option>
                <option value="strategic">Strategic ($100K - $500K)</option>
                <option value="custom">Custom Amount</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              rows={4}
              placeholder="Tell us about your investment interests and any questions you have..."
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              <Mail className="w-5 h-5" />
              Send Message
            </button>
            <a href="mailto:investors@cubenexum.com" className="btn-secondary">
              Or email directly: investors@cubenexum.com
            </a>
          </div>
        </form>
        
        <div className="legal-disclaimer">
          <p>
            <strong>Disclaimer:</strong> This page is for informational purposes only and does not constitute
            an offer to sell or a solicitation of an offer to buy any securities. Any investment involves
            significant risk and may result in the loss of your entire investment. Please consult with
            your financial advisor before making any investment decisions.
          </p>
        </div>
      </section>
    </div>
  );
};

export default InvestorsPage;
