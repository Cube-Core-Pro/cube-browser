'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { CubeLogo } from '@/components/brand/CubeLogo';
import { useTranslations } from '@/components/providers/I18nProvider';
import './features.css';

interface Feature {
  icon: string;
  title: string;
  description: string;
  category: 'automation' | 'ai' | 'security' | 'collaboration' | 'analytics';
}

const FEATURES: Feature[] = [
  // Automation
  {
    icon: '🤖',
    title: 'Browser Automation',
    description: 'Automate any browser task with our visual workflow builder. No coding required.',
    category: 'automation',
  },
  {
    icon: '📝',
    title: 'Smart Form Filling',
    description: 'AI-powered form detection and auto-fill across any website.',
    category: 'automation',
  },
  {
    icon: '🔄',
    title: 'Workflow Orchestration',
    description: 'Chain multiple automations together with conditional logic and scheduling.',
    category: 'automation',
  },
  {
    icon: '📊',
    title: 'Data Extraction',
    description: 'Extract structured data from any webpage with smart selectors.',
    category: 'automation',
  },
  // AI
  {
    icon: '🧠',
    title: 'AI Assistant',
    description: 'Natural language commands to create and modify automations.',
    category: 'ai',
  },
  {
    icon: '💬',
    title: 'Smart Chat',
    description: 'Voice-enabled AI chat with text-to-speech responses.',
    category: 'ai',
  },
  {
    icon: '🎯',
    title: 'Intelligent Selectors',
    description: 'AI suggests the best CSS selectors for reliable automation.',
    category: 'ai',
  },
  {
    icon: '📈',
    title: 'Predictive Analytics',
    description: 'AI-powered insights to optimize your workflows.',
    category: 'ai',
  },
  // Security
  {
    icon: '🔐',
    title: 'End-to-End Encryption',
    description: 'Military-grade encryption for all your data and credentials.',
    category: 'security',
  },
  {
    icon: '🛡️',
    title: 'Secure Vault',
    description: 'Store passwords and sensitive data in our encrypted vault.',
    category: 'security',
  },
  {
    icon: '👁️',
    title: 'Privacy First',
    description: 'GDPR, CCPA, and SOC2 compliant. Your data stays yours.',
    category: 'security',
  },
  {
    icon: '🔑',
    title: 'SSO Integration',
    description: 'Enterprise SSO with SAML, OAuth, and OpenID Connect.',
    category: 'security',
  },
  // Collaboration
  {
    icon: '👥',
    title: 'Team Workspaces',
    description: 'Collaborate on automations with role-based access control.',
    category: 'collaboration',
  },
  {
    icon: '📹',
    title: 'Video Conferencing',
    description: 'Built-in P2P video calls for real-time collaboration.',
    category: 'collaboration',
  },
  {
    icon: '💼',
    title: 'Template Marketplace',
    description: 'Share and monetize your automation templates.',
    category: 'collaboration',
  },
  {
    icon: '📧',
    title: 'CubeMail',
    description: 'Secure, encrypted email built for privacy-conscious teams.',
    category: 'collaboration',
  },
  // Analytics
  {
    icon: '📊',
    title: 'Real-time Dashboard',
    description: 'Monitor all your automations from a single dashboard.',
    category: 'analytics',
  },
  {
    icon: '⏱️',
    title: 'Time Savings Reports',
    description: 'Track how much time your automations save.',
    category: 'analytics',
  },
  {
    icon: '🔔',
    title: 'Smart Alerts',
    description: 'Get notified when automations fail or need attention.',
    category: 'analytics',
  },
  {
    icon: '📈',
    title: 'ROI Calculator',
    description: 'Calculate the return on investment for your automation.',
    category: 'analytics',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Features', icon: '✨' },
  { id: 'automation', label: 'Automation', icon: '🤖' },
  { id: 'ai', label: 'AI & ML', icon: '🧠' },
  { id: 'security', label: 'Security', icon: '🔐' },
  { id: 'collaboration', label: 'Collaboration', icon: '👥' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
];

export default function FeaturesPage() {
  const t = useTranslations();
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredFeatures = activeCategory === 'all' 
    ? FEATURES 
    : FEATURES.filter(f => f.category === activeCategory);

  return (
    <div className="features-page">
      <SiteHeader />
      
      {/* Hero Section */}
      <section className="features-hero">
        <div className="hero-content">
          <span className="hero-badge">
            <span className="badge-icon">✨</span>
            Powerful Features
          </span>
          <h1>Everything you need to automate at scale</h1>
          <p>
            CUBE combines browser automation, AI intelligence, and enterprise security 
            into one powerful platform. Discover what makes us different.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="btn-primary">
              Start Free Trial
            </Link>
            <Link href="/pricing" className="btn-secondary">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="category-filter">
        <div className="filter-container">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              className={`filter-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="filter-icon">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-grid-section">
        <div className="features-grid">
          {filteredFeatures.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="enterprise-section">
        <div className="enterprise-content">
          <h2>Enterprise-Ready</h2>
          <p>
            CUBE is built for enterprises with advanced security, compliance, 
            and scalability requirements.
          </p>
          <div className="enterprise-features">
            <div className="ent-feature">
              <span className="ent-icon">🏢</span>
              <span>SOC2 Type II</span>
            </div>
            <div className="ent-feature">
              <span className="ent-icon">🇪🇺</span>
              <span>GDPR Compliant</span>
            </div>
            <div className="ent-feature">
              <span className="ent-icon">🔒</span>
              <span>SSO & SCIM</span>
            </div>
            <div className="ent-feature">
              <span className="ent-icon">📊</span>
              <span>99.9% SLA</span>
            </div>
            <div className="ent-feature">
              <span className="ent-icon">🌍</span>
              <span>Global CDN</span>
            </div>
            <div className="ent-feature">
              <span className="ent-icon">💬</span>
              <span>24/7 Support</span>
            </div>
          </div>
          <Link href="/enterprise" className="btn-enterprise">
            Contact Enterprise Sales
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to transform your workflow?</h2>
          <p>Join thousands of teams automating with CUBE.</p>
          <div className="cta-actions">
            <Link href="/signup" className="btn-primary">
              Get Started Free
            </Link>
            <Link href="/contact" className="btn-outline">
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="features-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <CubeLogo size="md" />
            <p>© 2026 CUBE AI. All rights reserved.</p>
          </div>
          <div className="footer-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
