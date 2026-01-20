/**
 * CubeMail.pro Features Page
 * 
 * Comprehensive feature breakdown for the free email service.
 * Shows all features with detailed explanations and comparisons.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Mail, Shield, Zap, Cloud, Lock, Smartphone, 
  Check, ArrowRight, Star, Globe, Sparkles, 
  Filter, Bell, Inbox, Send, Search, Tag,
  Folder, Users, Key, Eye, EyeOff, RefreshCw,
  Clock, Calendar, Contact, BarChart, Code,
  Database, Server, FileText, Trash2, Archive
} from 'lucide-react';

import '../cubemail.css';
import './features.css';

// ============================================================================
// FEATURE DATA
// ============================================================================

const mainFeatures = [
  {
    id: 'privacy',
    icon: Shield,
    title: 'Privacy First Design',
    subtitle: 'Your emails are your business, not ours',
    color: 'blue',
    description: 'Unlike major email providers, CubeMail was built from the ground up with privacy as a core principle. We never scan your emails for advertising purposes, sell your data to third parties, or use your content to train AI models.',
    benefits: [
      'Zero email scanning for ads',
      'No data selling to third parties',
      'No tracking pixels or analytics on your emails',
      'Open source server components for transparency',
      'GDPR, CCPA, and LGPD compliant'
    ],
    stats: [
      { label: 'Data Sold', value: '0 bytes' },
      { label: 'Ads Shown', value: 'Zero' },
      { label: 'Privacy Score', value: 'A+' }
    ]
  },
  {
    id: 'screener',
    icon: Filter,
    title: 'AI Email Screener',
    subtitle: 'Your personal gatekeeper for unwanted emails',
    color: 'purple',
    description: 'The Email Screener is our revolutionary approach to email management. Instead of relying solely on spam filters, we give you control over who can reach your inbox. New senders are held in a screening queue until you decide to accept or block them.',
    benefits: [
      'Automatic sender verification with AI',
      'Trust scores based on reputation analysis',
      'One-click approve or block decisions',
      'Automatic unsubscribe link detection',
      'Machine learning improves over time'
    ],
    stats: [
      { label: 'Spam Blocked', value: '99.9%' },
      { label: 'False Positives', value: '<0.01%' },
      { label: 'AI Accuracy', value: '98.7%' }
    ]
  },
  {
    id: 'storage',
    icon: Cloud,
    title: '25GB Free Storage',
    subtitle: 'More space than you\'ll ever need',
    color: 'cyan',
    description: 'Start with a generous 25GB of storage completely free. Unlike other providers that nickel and dime you for space, we believe email storage should be abundant. Store years of emails, large attachments, and never worry about hitting limits.',
    benefits: [
      '25GB storage on free tier',
      '100GB on Premium ($2.99/mo)',
      'Unlimited on Business tier',
      '50MB attachment size (100MB Premium)',
      'Automatic storage optimization'
    ],
    stats: [
      { label: 'Free Storage', value: '25 GB' },
      { label: 'Max Attachment', value: '50 MB' },
      { label: 'Retention', value: 'Forever' }
    ]
  },
  {
    id: 'speed',
    icon: Zap,
    title: 'Lightning Fast Search',
    subtitle: 'Find any email in milliseconds',
    color: 'yellow',
    description: 'Powered by Elasticsearch, our search engine indexes every email instantly. Search through millions of messages in milliseconds with advanced filters, natural language queries, and smart suggestions.',
    benefits: [
      'Full-text search across all emails',
      'Advanced filters and operators',
      'Natural language queries',
      'Search in attachments (PDF, DOC, etc.)',
      'Saved searches and smart folders'
    ],
    stats: [
      { label: 'Search Time', value: '<100ms' },
      { label: 'Index Speed', value: 'Instant' },
      { label: 'Searchable', value: 'Everything' }
    ]
  },
  {
    id: 'encryption',
    icon: Lock,
    title: 'End-to-End Encryption',
    subtitle: 'Messages only you can read',
    color: 'green',
    description: 'For your most sensitive communications, enable end-to-end encryption. Your messages are encrypted on your device before being sent, and can only be decrypted by the intended recipient. Even we can\'t read them.',
    benefits: [
      'PGP/GPG key management built-in',
      'Zero-knowledge encryption option',
      'Automatic key exchange with CubeMail users',
      'Hardware security key support',
      'Encrypted attachment support'
    ],
    stats: [
      { label: 'Encryption', value: 'AES-256' },
      { label: 'Key Size', value: '4096-bit' },
      { label: 'Protocol', value: 'TLS 1.3' }
    ]
  },
  {
    id: 'apps',
    icon: Smartphone,
    title: 'Apps Everywhere',
    subtitle: 'Native apps for every platform',
    color: 'pink',
    description: 'Access your email from any device with our native applications. iOS, Android, macOS, Windows, and Linux apps are all available, plus full IMAP/SMTP support means you can use any email client you prefer.',
    benefits: [
      'Native iOS and Android apps',
      'Desktop apps for Mac, Windows, Linux',
      'Progressive Web App (PWA) support',
      'Full IMAP/SMTP access included free',
      'Real-time push notifications'
    ],
    stats: [
      { label: 'Platforms', value: '6+' },
      { label: 'Sync Speed', value: 'Real-time' },
      { label: 'Offline Mode', value: 'Full' }
    ]
  }
];

const additionalFeatures = [
  {
    icon: Tag,
    title: 'Smart Labels & Categories',
    description: 'AI-powered categorization automatically organizes your inbox into Primary, Social, Promotions, and Updates.'
  },
  {
    icon: Folder,
    title: 'Custom Folders & Rules',
    description: 'Create unlimited folders and set up powerful filtering rules to automatically sort incoming mail.'
  },
  {
    icon: Clock,
    title: 'Send Later & Snooze',
    description: 'Schedule emails to send at the perfect time, or snooze emails to reappear when you need them.'
  },
  {
    icon: RefreshCw,
    title: 'Undo Send',
    description: '30-second undo window gives you time to catch mistakes before emails are actually sent.'
  },
  {
    icon: Eye,
    title: 'Read Receipts',
    description: 'Optional read receipts let you know when your important emails have been opened.'
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'AI learns which emails are important to you and only notifies you about what matters.'
  },
  {
    icon: Calendar,
    title: 'Calendar Integration',
    description: 'Full calendar support with event detection, meeting scheduling, and RSVP management.'
  },
  {
    icon: Contact,
    title: 'Contact Management',
    description: 'Automatic contact enrichment, groups, and sync with your phone\'s contacts.'
  },
  {
    icon: Archive,
    title: 'Archive & Export',
    description: 'Export all your data in standard formats anytime. Your data is always yours.'
  },
  {
    icon: Trash2,
    title: 'Spam Protection',
    description: 'Multi-layer spam protection catches 99.9% of spam before it reaches your inbox.'
  },
  {
    icon: Key,
    title: 'Two-Factor Auth',
    description: 'Secure your account with TOTP, SMS, or hardware security keys like YubiKey.'
  },
  {
    icon: Code,
    title: 'API Access',
    description: 'Full REST API for developers to integrate CubeMail into their applications.'
  }
];

const premiumFeatures = [
  {
    icon: Database,
    title: '100GB Storage',
    description: '4x more storage for power users'
  },
  {
    icon: Globe,
    title: 'Custom Domain',
    description: 'Use your own domain with CubeMail'
  },
  {
    icon: Users,
    title: 'Unlimited Aliases',
    description: 'Create unlimited email aliases'
  },
  {
    icon: FileText,
    title: '100MB Attachments',
    description: 'Send larger files with ease'
  },
  {
    icon: BarChart,
    title: 'Analytics Dashboard',
    description: 'Insights into your email patterns'
  },
  {
    icon: Server,
    title: 'Priority Delivery',
    description: 'Your emails get priority processing'
  }
];

// ============================================================================
// COMPONENTS
// ============================================================================

function FeatureHero() {
  return (
    <section className="features-hero">
      <div className="features-hero__content">
        <span className="features-hero__badge">
          <Sparkles className="h-4 w-4" />
          All Features
        </span>
        <h1 className="features-hero__title">
          Everything you need, 
          <span className="features-hero__gradient"> nothing you don't</span>
        </h1>
        <p className="features-hero__subtitle">
          CubeMail combines powerful features with a clean, focused experience.
          No bloat, no unnecessary complexity—just great email.
        </p>
        <div className="features-hero__actions">
          <Link href="/signup" className="features-hero__button primary">
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/pricing" className="features-hero__button secondary">
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}

function MainFeatureCard({ feature, index }: { feature: typeof mainFeatures[0], index: number }) {
  const isReversed = index % 2 === 1;
  
  return (
    <div id={feature.id} className={`main-feature ${isReversed ? 'reversed' : ''}`}>
      <div className="main-feature__content">
        <div className={`main-feature__icon main-feature__icon--${feature.color}`}>
          <feature.icon className="h-8 w-8" />
        </div>
        <h2 className="main-feature__title">{feature.title}</h2>
        <p className="main-feature__subtitle">{feature.subtitle}</p>
        <p className="main-feature__description">{feature.description}</p>
        
        <ul className="main-feature__benefits">
          {feature.benefits.map((benefit, i) => (
            <li key={i}>
              <Check className="h-5 w-5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="main-feature__stats">
        <div className="main-feature__stats-card">
          {feature.stats.map((stat, i) => (
            <div key={i} className="main-feature__stat">
              <span className="main-feature__stat-value">{stat.value}</span>
              <span className="main-feature__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdditionalFeaturesSection() {
  return (
    <section className="additional-features">
      <div className="additional-features__header">
        <h2>And so much more...</h2>
        <p>Every feature you'd expect from a modern email service, built with care.</p>
      </div>
      
      <div className="additional-features__grid">
        {additionalFeatures.map((feature, index) => (
          <div key={index} className="additional-feature">
            <div className="additional-feature__icon">
              <feature.icon className="h-5 w-5" />
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PremiumFeaturesSection() {
  return (
    <section className="premium-features">
      <div className="premium-features__header">
        <span className="premium-features__badge">
          <Star className="h-4 w-4" />
          Premium
        </span>
        <h2>Upgrade to Premium for just $2.99/month</h2>
        <p>Unlock powerful features for power users and professionals.</p>
      </div>
      
      <div className="premium-features__grid">
        {premiumFeatures.map((feature, index) => (
          <div key={index} className="premium-feature">
            <div className="premium-feature__icon">
              <feature.icon className="h-6 w-6" />
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
      
      <div className="premium-features__cta">
        <Link href="/signup?plan=premium" className="premium-features__button">
          Start Premium Free Trial
          <ArrowRight className="h-5 w-5" />
        </Link>
        <p>14-day free trial. No credit card required.</p>
      </div>
    </section>
  );
}

function FeaturesCTA() {
  return (
    <section className="features-cta">
      <div className="features-cta__content">
        <h2>Ready to switch?</h2>
        <p>Import your emails from Gmail, Yahoo, or Outlook in minutes.</p>
        <div className="features-cta__buttons">
          <Link href="/signup" className="features-cta__button primary">
            Create Free Account
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/help/migration" className="features-cta__button secondary">
            Migration Guide
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturesNav() {
  return (
    <nav className="features-nav">
      <div className="features-nav__content">
        <Link href="/cubemail" className="features-nav__logo">
          <Mail className="h-7 w-7" />
          <span>CubeMail</span>
        </Link>
        
        <div className="features-nav__links">
          <Link href="/cubemail/features" className="active">Features</Link>
          <Link href="/cubemail/pricing">Pricing</Link>
          <Link href="/cubemail/security">Security</Link>
          <Link href="/cubemail/apps">Apps</Link>
        </div>
        
        <div className="features-nav__actions">
          <Link href="/login" className="features-nav__login">Log in</Link>
          <Link href="/signup" className="features-nav__signup">Sign up free</Link>
        </div>
      </div>
    </nav>
  );
}

function FeaturesFooter() {
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

export default function CubeMailFeatures() {
  return (
    <div className="cubemail-features-page">
      <FeaturesNav />
      
      <main>
        <FeatureHero />
        
        <div className="main-features">
          {mainFeatures.map((feature, index) => (
            <MainFeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>
        
        <AdditionalFeaturesSection />
        <PremiumFeaturesSection />
        <FeaturesCTA />
      </main>
      
      <FeaturesFooter />
    </div>
  );
}
