/**
 * CubeMail.pro Landing Page
 * 
 * Main landing page for the free email service competing with
 * Gmail, Yahoo, Outlook, and AOL.
 * 
 * Domain: cubemail.pro
 * Emails: @cubemail.pro
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Mail, Shield, Zap, Cloud, Lock, Smartphone, 
  Check, ArrowRight, Star, Users, Globe, 
  Sparkles, ChevronRight, Play, Download,
  MessageSquare, Calendar, Contact, Search,
  Filter, Bell, Inbox, Send
} from 'lucide-react';

import './cubemail.css';

// ============================================================================
// HERO SECTION
// ============================================================================

function HeroSection() {
  const [email, setEmail] = useState('');

  return (
    <section className="cubemail-hero">
      <div className="cubemail-hero__background">
        <div className="cubemail-hero__gradient" />
        <div className="cubemail-hero__pattern" />
      </div>

      <div className="cubemail-hero__content">
        <div className="cubemail-hero__badge">
          <Sparkles className="h-4 w-4" />
          <span>Now in Public Beta - Join 50,000+ users</span>
        </div>

        <h1 className="cubemail-hero__title">
          Email Without
          <span className="cubemail-hero__title-gradient"> Compromise</span>
        </h1>

        <p className="cubemail-hero__subtitle">
          Free, private, and powerful. Get your @cubemail.pro address today.
          No ads. No tracking. No compromises on your privacy.
        </p>

        <div className="cubemail-hero__signup">
          <div className="cubemail-hero__input-wrapper">
            <input
              type="text"
              placeholder="yourname"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
              className="cubemail-hero__input"
            />
            <span className="cubemail-hero__domain">@cubemail.pro</span>
          </div>
          <Link href={`/signup?email=${email}`} className="cubemail-hero__button">
            Create Free Account
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="cubemail-hero__stats">
          <div className="cubemail-hero__stat">
            <span className="cubemail-hero__stat-value">25 GB</span>
            <span className="cubemail-hero__stat-label">Free Storage</span>
          </div>
          <div className="cubemail-hero__stat-divider" />
          <div className="cubemail-hero__stat">
            <span className="cubemail-hero__stat-value">Zero</span>
            <span className="cubemail-hero__stat-label">Ads Forever</span>
          </div>
          <div className="cubemail-hero__stat-divider" />
          <div className="cubemail-hero__stat">
            <span className="cubemail-hero__stat-value">100%</span>
            <span className="cubemail-hero__stat-label">Private</span>
          </div>
        </div>

        <div className="cubemail-hero__trusted">
          <span>Trusted by teams at</span>
          <div className="cubemail-hero__logos">
            <div className="cubemail-hero__logo">TechCorp</div>
            <div className="cubemail-hero__logo">Startup Inc</div>
            <div className="cubemail-hero__logo">DevStudio</div>
            <div className="cubemail-hero__logo">CloudBase</div>
          </div>
        </div>
      </div>

      <div className="cubemail-hero__preview">
        <div className="cubemail-hero__browser">
          <div className="cubemail-hero__browser-header">
            <div className="cubemail-hero__browser-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="cubemail-hero__browser-url">
              <Lock className="h-3 w-3" />
              mail.cubemail.pro
            </div>
          </div>
          <div className="cubemail-hero__browser-content">
            <div className="cubemail-preview">
              <div className="cubemail-preview__sidebar">
                <div className="cubemail-preview__compose">
                  <Send className="h-4 w-4" />
                  Compose
                </div>
                <div className="cubemail-preview__folders">
                  <div className="cubemail-preview__folder active">
                    <Inbox className="h-4 w-4" />
                    Inbox
                    <span className="cubemail-preview__badge">12</span>
                  </div>
                  <div className="cubemail-preview__folder">
                    <Star className="h-4 w-4" />
                    Starred
                  </div>
                  <div className="cubemail-preview__folder">
                    <Send className="h-4 w-4" />
                    Sent
                  </div>
                </div>
              </div>
              <div className="cubemail-preview__list">
                <div className="cubemail-preview__email unread">
                  <div className="cubemail-preview__avatar">JD</div>
                  <div className="cubemail-preview__content">
                    <div className="cubemail-preview__from">John Doe</div>
                    <div className="cubemail-preview__subject">Welcome to CubeMail!</div>
                    <div className="cubemail-preview__snippet">Your new email is ready...</div>
                  </div>
                  <div className="cubemail-preview__time">Just now</div>
                </div>
                <div className="cubemail-preview__email">
                  <div className="cubemail-preview__avatar">CM</div>
                  <div className="cubemail-preview__content">
                    <div className="cubemail-preview__from">CubeMail Team</div>
                    <div className="cubemail-preview__subject">Get started with CubeMail</div>
                    <div className="cubemail-preview__snippet">Here are some tips...</div>
                  </div>
                  <div className="cubemail-preview__time">2m ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURES SECTION
// ============================================================================

const features = [
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'We never scan your emails for advertising. Your conversations stay private, always.',
    color: 'blue'
  },
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Smart email screener, auto-categorization, and intelligent replies powered by AI.',
    color: 'purple'
  },
  {
    icon: Cloud,
    title: '25GB Free Storage',
    description: 'Generous storage for all your emails and attachments. No surprises, no limits.',
    color: 'cyan'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed. Search millions of emails in milliseconds.',
    color: 'yellow'
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'Optional E2E encryption for sensitive communications. You hold the keys.',
    color: 'green'
  },
  {
    icon: Smartphone,
    title: 'Apps Everywhere',
    description: 'Native apps for iOS, Android, and desktop. Full IMAP/SMTP access included.',
    color: 'pink'
  }
];

function FeaturesSection() {
  return (
    <section className="cubemail-features">
      <div className="cubemail-features__header">
        <span className="cubemail-features__badge">Features</span>
        <h2 className="cubemail-features__title">
          Everything you need from an email service
        </h2>
        <p className="cubemail-features__subtitle">
          All the features you love, without the privacy tradeoffs
        </p>
      </div>

      <div className="cubemail-features__grid">
        {features.map((feature, index) => (
          <div key={index} className={`cubemail-feature cubemail-feature--${feature.color}`}>
            <div className="cubemail-feature__icon">
              <feature.icon className="h-6 w-6" />
            </div>
            <h3 className="cubemail-feature__title">{feature.title}</h3>
            <p className="cubemail-feature__description">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// COMPARISON SECTION
// ============================================================================

const comparisonFeatures = [
  { name: 'Free Storage', cubemail: '25 GB', gmail: '15 GB', yahoo: '1 TB*', outlook: '15 GB' },
  { name: 'Ad-Free Experience', cubemail: true, gmail: false, yahoo: false, outlook: false },
  { name: 'No Email Scanning', cubemail: true, gmail: false, yahoo: false, outlook: false },
  { name: 'AI Email Screener', cubemail: true, gmail: false, yahoo: false, outlook: false },
  { name: 'Free IMAP/SMTP', cubemail: true, gmail: true, yahoo: false, outlook: true },
  { name: 'E2E Encryption', cubemail: true, gmail: false, yahoo: false, outlook: false },
  { name: 'Custom Domain', cubemail: '$2.99/mo', gmail: '$6/user', yahoo: 'N/A', outlook: '$6/user' },
  { name: 'API Access', cubemail: true, gmail: 'Limited', yahoo: false, outlook: 'Limited' },
];

function ComparisonSection() {
  return (
    <section className="cubemail-comparison">
      <div className="cubemail-comparison__header">
        <span className="cubemail-comparison__badge">Compare</span>
        <h2 className="cubemail-comparison__title">
          See how CubeMail stacks up
        </h2>
        <p className="cubemail-comparison__subtitle">
          We built the email service we wanted to use ourselves
        </p>
      </div>

      <div className="cubemail-comparison__table-wrapper">
        <table className="cubemail-comparison__table">
          <thead>
            <tr>
              <th>Feature</th>
              <th className="highlight">
                <div className="cubemail-comparison__provider">
                  <Mail className="h-5 w-5" />
                  CubeMail
                </div>
              </th>
              <th>Gmail</th>
              <th>Yahoo</th>
              <th>Outlook</th>
            </tr>
          </thead>
          <tbody>
            {comparisonFeatures.map((feature, index) => (
              <tr key={index}>
                <td>{feature.name}</td>
                <td className="highlight">
                  {typeof feature.cubemail === 'boolean' ? (
                    feature.cubemail ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <span className="text-red-500">✕</span>
                    )
                  ) : (
                    feature.cubemail
                  )}
                </td>
                <td>
                  {typeof feature.gmail === 'boolean' ? (
                    feature.gmail ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <span className="text-red-500">✕</span>
                    )
                  ) : (
                    feature.gmail
                  )}
                </td>
                <td>
                  {typeof feature.yahoo === 'boolean' ? (
                    feature.yahoo ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <span className="text-red-500">✕</span>
                    )
                  ) : (
                    feature.yahoo
                  )}
                </td>
                <td>
                  {typeof feature.outlook === 'boolean' ? (
                    feature.outlook ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <span className="text-red-500">✕</span>
                    )
                  ) : (
                    feature.outlook
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="cubemail-comparison__note">
          * Yahoo 1TB storage requires premium subscription
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// AI SCREENER SECTION
// ============================================================================

function ScreenerSection() {
  return (
    <section className="cubemail-screener">
      <div className="cubemail-screener__content">
        <div className="cubemail-screener__text">
          <span className="cubemail-screener__badge">
            <Sparkles className="h-4 w-4" />
            AI-Powered
          </span>
          <h2 className="cubemail-screener__title">
            Email Screener: Your AI Gatekeeper
          </h2>
          <p className="cubemail-screener__description">
            New senders are held in a queue until you approve them. Our AI analyzes
            sender reputation, email patterns, and content to help you make informed
            decisions. Say goodbye to unwanted emails forever.
          </p>
          <ul className="cubemail-screener__list">
            <li>
              <Check className="h-5 w-5" />
              Automatic spam detection with 99.9% accuracy
            </li>
            <li>
              <Check className="h-5 w-5" />
              One-click approve or block senders
            </li>
            <li>
              <Check className="h-5 w-5" />
              AI reputation scoring for unknown senders
            </li>
            <li>
              <Check className="h-5 w-5" />
              Automatic unsubscribe detection
            </li>
          </ul>
          <Link href="/features/screener" className="cubemail-screener__link">
            Learn more about Email Screener
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="cubemail-screener__demo">
          <div className="cubemail-screener__card">
            <div className="cubemail-screener__card-header">
              <Filter className="h-5 w-5" />
              <span>Email Screener</span>
              <span className="cubemail-screener__pending">3 pending</span>
            </div>
            <div className="cubemail-screener__card-body">
              <div className="cubemail-screener__sender">
                <div className="cubemail-screener__sender-info">
                  <div className="cubemail-screener__sender-avatar">NS</div>
                  <div>
                    <div className="cubemail-screener__sender-name">Newsletter Service</div>
                    <div className="cubemail-screener__sender-email">news@example.com</div>
                  </div>
                </div>
                <div className="cubemail-screener__sender-score">
                  <span className="cubemail-screener__score good">85%</span>
                  <span>Trust Score</span>
                </div>
                <div className="cubemail-screener__sender-actions">
                  <button className="cubemail-screener__btn approve">
                    <Check className="h-4 w-4" />
                  </button>
                  <button className="cubemail-screener__btn block">✕</button>
                </div>
              </div>
              <div className="cubemail-screener__sender suspicious">
                <div className="cubemail-screener__sender-info">
                  <div className="cubemail-screener__sender-avatar warning">⚠️</div>
                  <div>
                    <div className="cubemail-screener__sender-name">Unknown Sender</div>
                    <div className="cubemail-screener__sender-email">promo@suspicious.xyz</div>
                  </div>
                </div>
                <div className="cubemail-screener__sender-score">
                  <span className="cubemail-screener__score bad">23%</span>
                  <span>Trust Score</span>
                </div>
                <div className="cubemail-screener__sender-actions">
                  <button className="cubemail-screener__btn approve">
                    <Check className="h-4 w-4" />
                  </button>
                  <button className="cubemail-screener__btn block">✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// APPS SECTION
// ============================================================================

function AppsSection() {
  return (
    <section className="cubemail-apps">
      <div className="cubemail-apps__header">
        <span className="cubemail-apps__badge">Apps</span>
        <h2 className="cubemail-apps__title">
          Access your email anywhere
        </h2>
        <p className="cubemail-apps__subtitle">
          Native apps for every platform. Full IMAP/SMTP support for any email client.
        </p>
      </div>

      <div className="cubemail-apps__grid">
        <div className="cubemail-app">
          <div className="cubemail-app__icon">
            <Smartphone className="h-8 w-8" />
          </div>
          <h3>iOS App</h3>
          <p>Native iPhone and iPad app with push notifications</p>
          <Link href="/apps/ios" className="cubemail-app__link">
            <Download className="h-4 w-4" />
            App Store
          </Link>
        </div>

        <div className="cubemail-app">
          <div className="cubemail-app__icon">
            <Smartphone className="h-8 w-8" />
          </div>
          <h3>Android App</h3>
          <p>Material Design app for all Android devices</p>
          <Link href="/apps/android" className="cubemail-app__link">
            <Download className="h-4 w-4" />
            Play Store
          </Link>
        </div>

        <div className="cubemail-app">
          <div className="cubemail-app__icon">
            <Globe className="h-8 w-8" />
          </div>
          <h3>Web App</h3>
          <p>Full-featured webmail at mail.cubemail.pro</p>
          <Link href="https://mail.cubemail.pro" className="cubemail-app__link">
            <ArrowRight className="h-4 w-4" />
            Open Webmail
          </Link>
        </div>

        <div className="cubemail-app">
          <div className="cubemail-app__icon">
            <Mail className="h-8 w-8" />
          </div>
          <h3>IMAP/SMTP</h3>
          <p>Use any email client like Outlook, Thunderbird, or Apple Mail</p>
          <Link href="/help/imap-setup" className="cubemail-app__link">
            <ArrowRight className="h-4 w-4" />
            Setup Guide
          </Link>
        </div>
      </div>

      <div className="cubemail-apps__cube">
        <div className="cubemail-apps__cube-badge">
          <Sparkles className="h-4 w-4" />
          Integrated with CUBE Nexum Desktop
        </div>
        <p>
          CubeMail is fully integrated with{' '}
          <Link href="/downloads" className="cubemail-apps__link">
            CUBE Nexum
          </Link>
          , our powerful desktop automation platform. Download it for Windows, macOS, or Linux 
          to manage emails, automate workflows, and supercharge your productivity.
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// SECURITY SECTION
// ============================================================================

function SecuritySection() {
  return (
    <section className="cubemail-security">
      <div className="cubemail-security__content">
        <div className="cubemail-security__visual">
          <div className="cubemail-security__shield">
            <Shield className="h-24 w-24" />
          </div>
          <div className="cubemail-security__badges">
            <div className="cubemail-security__badge">
              <Lock className="h-4 w-4" />
              TLS 1.3
            </div>
            <div className="cubemail-security__badge">
              <Check className="h-4 w-4" />
              SPF
            </div>
            <div className="cubemail-security__badge">
              <Check className="h-4 w-4" />
              DKIM
            </div>
            <div className="cubemail-security__badge">
              <Check className="h-4 w-4" />
              DMARC
            </div>
          </div>
        </div>

        <div className="cubemail-security__text">
          <span className="cubemail-security__label">Security</span>
          <h2 className="cubemail-security__title">
            Enterprise-grade security for everyone
          </h2>
          <p className="cubemail-security__description">
            Your emails are protected with the same security standards used by
            banks and governments. All connections are encrypted, and we never
            store your password in plain text.
          </p>
          <div className="cubemail-security__features">
            <div className="cubemail-security__feature">
              <h4>Two-Factor Authentication</h4>
              <p>TOTP, SMS, or hardware security keys</p>
            </div>
            <div className="cubemail-security__feature">
              <h4>Zero-Knowledge Encryption</h4>
              <p>Optional E2E encryption where only you have the keys</p>
            </div>
            <div className="cubemail-security__feature">
              <h4>Audit Logs</h4>
              <p>Complete activity logging for your peace of mind</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PRICING SECTION
// ============================================================================

function PricingSection() {
  return (
    <section className="cubemail-pricing">
      <div className="cubemail-pricing__header">
        <span className="cubemail-pricing__badge">Pricing</span>
        <h2 className="cubemail-pricing__title">
          Simple, transparent pricing
        </h2>
        <p className="cubemail-pricing__subtitle">
          Start free, upgrade when you need more
        </p>
      </div>

      <div className="cubemail-pricing__cards">
        <div className="cubemail-pricing__card">
          <div className="cubemail-pricing__card-header">
            <h3>Free</h3>
            <div className="cubemail-pricing__price">
              <span className="cubemail-pricing__amount">$0</span>
              <span className="cubemail-pricing__period">forever</span>
            </div>
          </div>
          <ul className="cubemail-pricing__features">
            <li><Check className="h-4 w-4" /> 25 GB storage</li>
            <li><Check className="h-4 w-4" /> @cubemail.pro address</li>
            <li><Check className="h-4 w-4" /> Full IMAP/SMTP access</li>
            <li><Check className="h-4 w-4" /> Basic AI Screener</li>
            <li><Check className="h-4 w-4" /> Mobile apps</li>
            <li><Check className="h-4 w-4" /> 3 email aliases</li>
            <li><Check className="h-4 w-4" /> 50 MB attachments</li>
          </ul>
          <Link href="/signup" className="cubemail-pricing__button secondary">
            Get Started Free
          </Link>
        </div>

        <div className="cubemail-pricing__card featured">
          <div className="cubemail-pricing__popular">Most Popular</div>
          <div className="cubemail-pricing__card-header">
            <h3>Premium</h3>
            <div className="cubemail-pricing__price">
              <span className="cubemail-pricing__amount">$2.99</span>
              <span className="cubemail-pricing__period">/month</span>
            </div>
          </div>
          <ul className="cubemail-pricing__features">
            <li><Check className="h-4 w-4" /> 100 GB storage</li>
            <li><Check className="h-4 w-4" /> Custom domain support</li>
            <li><Check className="h-4 w-4" /> Advanced AI Screener</li>
            <li><Check className="h-4 w-4" /> Unlimited aliases</li>
            <li><Check className="h-4 w-4" /> 100 MB attachments</li>
            <li><Check className="h-4 w-4" /> Priority support</li>
            <li><Check className="h-4 w-4" /> API access</li>
            <li><Check className="h-4 w-4" /> Full calendar sync</li>
          </ul>
          <Link href="/signup?plan=premium" className="cubemail-pricing__button primary">
            Start Premium Trial
          </Link>
        </div>

        <div className="cubemail-pricing__card">
          <div className="cubemail-pricing__card-header">
            <h3>Business</h3>
            <div className="cubemail-pricing__price">
              <span className="cubemail-pricing__amount">$5.99</span>
              <span className="cubemail-pricing__period">/user/mo</span>
            </div>
          </div>
          <ul className="cubemail-pricing__features">
            <li><Check className="h-4 w-4" /> Everything in Premium</li>
            <li><Check className="h-4 w-4" /> Admin console</li>
            <li><Check className="h-4 w-4" /> Team management</li>
            <li><Check className="h-4 w-4" /> Shared contacts</li>
            <li><Check className="h-4 w-4" /> Audit logs</li>
            <li><Check className="h-4 w-4" /> SSO integration</li>
            <li><Check className="h-4 w-4" /> 24/7 support</li>
          </ul>
          <Link href="/business" className="cubemail-pricing__button secondary">
            Contact Sales
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// TESTIMONIALS SECTION
// ============================================================================

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Product Designer',
    avatar: 'SC',
    content: 'Finally, an email service that respects my privacy. The AI screener has completely eliminated spam from my inbox.',
    rating: 5
  },
  {
    name: 'Marcus Johnson',
    role: 'Software Engineer',
    avatar: 'MJ',
    content: 'The IMAP support is flawless. I can use my favorite email client while still getting all the benefits of CubeMail.',
    rating: 5
  },
  {
    name: 'Emily Rodriguez',
    role: 'Startup Founder',
    avatar: 'ER',
    content: 'Switched my whole team to CubeMail. The custom domain feature at $2.99 is a steal compared to Google Workspace.',
    rating: 5
  }
];

function TestimonialsSection() {
  return (
    <section className="cubemail-testimonials">
      <div className="cubemail-testimonials__header">
        <span className="cubemail-testimonials__badge">Testimonials</span>
        <h2 className="cubemail-testimonials__title">
          Loved by thousands
        </h2>
      </div>

      <div className="cubemail-testimonials__grid">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="cubemail-testimonial">
            <div className="cubemail-testimonial__stars">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="cubemail-testimonial__content">{testimonial.content}</p>
            <div className="cubemail-testimonial__author">
              <div className="cubemail-testimonial__avatar">{testimonial.avatar}</div>
              <div>
                <div className="cubemail-testimonial__name">{testimonial.name}</div>
                <div className="cubemail-testimonial__role">{testimonial.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// FAQ SECTION
// ============================================================================

const faqs = [
  {
    question: 'Is CubeMail really free?',
    answer: 'Yes! The free tier includes 25GB storage, full IMAP/SMTP access, and no ads. We make money from our premium plans, not from selling your data.'
  },
  {
    question: 'Can I use my own domain?',
    answer: 'Yes, custom domains are available with our Premium plan for just $2.99/month. You can use any domain you own with full email functionality.'
  },
  {
    question: 'How is CubeMail different from Gmail?',
    answer: 'Unlike Gmail, we never scan your emails for advertising. We\'re funded by premium subscriptions, not ads. Your privacy is our business model.'
  },
  {
    question: 'Can I import my existing emails?',
    answer: 'Absolutely! We support easy migration from Gmail, Yahoo, Outlook, and any other email service. Our import tool handles everything automatically.'
  },
  {
    question: 'What is the Email Screener?',
    answer: 'The Email Screener is our AI-powered gatekeeper that holds emails from unknown senders until you approve them. It\'s like a bouncer for your inbox.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we use enterprise-grade encryption (TLS 1.3) for all connections, and offer optional end-to-end encryption for sensitive communications.'
  }
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="cubemail-faq">
      <div className="cubemail-faq__header">
        <span className="cubemail-faq__badge">FAQ</span>
        <h2 className="cubemail-faq__title">
          Frequently asked questions
        </h2>
      </div>

      <div className="cubemail-faq__list">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`cubemail-faq__item ${openIndex === index ? 'open' : ''}`}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <div className="cubemail-faq__question">
              <span>{faq.question}</span>
              <ChevronRight className="h-5 w-5" />
            </div>
            <div className="cubemail-faq__answer">
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// CTA SECTION
// ============================================================================

function CTASection() {
  return (
    <section className="cubemail-cta">
      <div className="cubemail-cta__content">
        <h2 className="cubemail-cta__title">
          Ready to take back your inbox?
        </h2>
        <p className="cubemail-cta__subtitle">
          Join 50,000+ people who switched to CubeMail for privacy-first email.
        </p>
        <div className="cubemail-cta__buttons">
          <Link href="/signup" className="cubemail-cta__button primary">
            Create Free Account
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/features" className="cubemail-cta__button secondary">
            Explore Features
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER
// ============================================================================

function Footer() {
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
          <div className="cubemail-footer__social">
            <a href="https://twitter.com/cubemail" aria-label="Twitter">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
              </svg>
            </a>
            <a href="https://github.com/cubemail" aria-label="GitHub">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="cubemail-footer__links">
          <div className="cubemail-footer__column">
            <h4>Product</h4>
            <Link href="/features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/security">Security</Link>
            <Link href="/apps">Apps</Link>
          </div>
          <div className="cubemail-footer__column">
            <h4>Company</h4>
            <Link href="/about">About</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/careers">Careers</Link>
            <Link href="/press">Press</Link>
          </div>
          <div className="cubemail-footer__column">
            <h4>Resources</h4>
            <Link href="/help">Help Center</Link>
            <Link href="/api">API Docs</Link>
            <Link href="/status">Status</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div className="cubemail-footer__column">
            <h4>Legal</h4>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/security">Security</Link>
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
// NAVBAR
// ============================================================================

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`cubemail-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="cubemail-nav__content">
        <Link href="/" className="cubemail-nav__logo">
          <Mail className="h-7 w-7" />
          <span>CubeMail</span>
        </Link>

        <div className="cubemail-nav__links">
          <Link href="/features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/security">Security</Link>
          <Link href="/apps">Apps</Link>
          <Link href="/business">Business</Link>
        </div>

        <div className="cubemail-nav__actions">
          <Link href="/login" className="cubemail-nav__login">
            Log in
          </Link>
          <Link href="/signup" className="cubemail-nav__signup">
            Sign up free
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CubeMailLanding() {
  return (
    <div className="cubemail-landing">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ComparisonSection />
        <ScreenerSection />
        <AppsSection />
        <SecuritySection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
