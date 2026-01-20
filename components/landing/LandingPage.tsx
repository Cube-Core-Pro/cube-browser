'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Play, ArrowRight, Check, Star, Globe, Bot,
  Workflow, Database, Lock, Users, BarChart3, Sparkles,
  ChevronRight, ChevronDown, Menu, X, Boxes,
  Twitter, Linkedin, Github, Youtube, Headphones,
  TrendingUp, Clock, Mail,
  MousePointer2, MonitorSmartphone, Puzzle,
  Building2, Loader2, GitBranch, RotateCcw, FileOutput, Type
} from 'lucide-react';
import { CubeLogo } from '@/components/brand/CubeLogo';
import { SalesChatWidget } from '@/components/web/SalesChatWidget';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import { useTranslations } from '@/components/providers/I18nProvider';
import './LandingPage.css';

// ===== Component =====
export const LandingPage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslations();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Handle scroll for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Stripe checkout handler
  const handleCheckout = useCallback(async (tier: string) => {
    if (tier === 'enterprise') {
      router.push('/contact?plan=enterprise');
      return;
    }

    setCheckoutLoading(tier);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          billingCycle,
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/#pricing`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  }, [billingCycle, router]);

  // Features data
  const features = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: 'AI-Powered Automation',
      description: 'Let AI understand your intent and create workflows automatically. Natural language commands, smart suggestions, and self-healing scripts.',
      highlight: 'GPT-5.2 Integration'
    },
    {
      icon: <MousePointer2 className="w-8 h-8" />,
      title: 'Smart Element Detection',
      description: 'Intelligent selectors that adapt to page changes. Never worry about broken automations due to UI updates.',
      highlight: '99.8% Accuracy'
    },
    {
      icon: <Workflow className="w-8 h-8" />,
      title: 'Visual Flow Builder',
      description: 'Drag-and-drop workflow editor with 200+ pre-built actions. Create complex automations without writing code.',
      highlight: 'No-Code'
    },
    {
      icon: <MonitorSmartphone className="w-8 h-8" />,
      title: 'Cross-Platform',
      description: 'Works seamlessly on Windows, macOS, and Linux. Your automations run anywhere.',
      highlight: 'Desktop + Cloud'
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: 'Data Extraction',
      description: 'Extract structured data from any website. Tables, lists, text - automatically formatted and ready for export.',
      highlight: 'Export to CSV/JSON/API'
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: 'Enterprise Security',
      description: 'SOC2 compliant with end-to-end encryption. Your data never leaves your infrastructure.',
      highlight: 'Self-Hosted Option'
    },
    {
      icon: <Puzzle className="w-8 h-8" />,
      title: '8,000+ Integrations',
      description: 'Connect with Salesforce, HubSpot, Slack, Google Sheets, and thousands more through our API.',
      highlight: 'Zapier Compatible'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Scheduled Execution',
      description: 'Run workflows on schedule or trigger them via webhooks. Monitor execution from anywhere.',
      highlight: '24/7 Automation'
    }
  ];

  // Use cases
  const useCases = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Sales & Lead Generation',
      description: 'Automatically enrich leads, update CRM records, and track prospect activity across the web.',
      image: '/images/use-case-sales.png'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Recruiting & HR',
      description: 'Scrape job boards, automate candidate outreach, and sync applicant data with your ATS.',
      image: '/images/use-case-hr.png'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Market Research',
      description: 'Monitor competitor pricing, collect reviews, and aggregate market data automatically.',
      image: '/images/use-case-research.png'
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      title: 'Real Estate',
      description: 'Track listings, automate property research, and sync data with your portfolio management.',
      image: '/images/use-case-realestate.png'
    }
  ];

  // Pricing plans - 4 tiers
  const plans = [
    {
      name: 'Starter',
      tier: 'starter',
      description: 'Perfect for individuals and freelancers',
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
      description: 'For growing teams and agencies',
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
        'White-label option',
        'Advanced analytics',
        'Custom webhooks'
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
        'On-premise deployment',
        'Advanced security audit',
        'Training & onboarding',
        'CUBE Core access included'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  // Testimonials
  const testimonials = [
    {
      quote: "CUBE Nexum saved us 40 hours per week on data entry. The AI features are incredible - it just knows what we need.",
      author: 'Sarah Chen',
      role: 'VP of Operations',
      company: 'TechFlow Inc.',
      avatar: 'SC',
      rating: 5
    },
    {
      quote: "We've tried Make, Zapier, and Bardeen. CUBE Nexum is the only tool that handles complex web scraping reliably.",
      author: 'Marcus Johnson',
      role: 'Data Engineer',
      company: 'DataDriven Analytics',
      avatar: 'MJ',
      rating: 5
    },
    {
      quote: "The visual flow builder is so intuitive. Our non-technical team members create automations without any help.",
      author: 'Emily Rodriguez',
      role: 'Marketing Director',
      company: 'GrowthMetrics',
      avatar: 'ER',
      rating: 5
    }
  ];

  // Stats
  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '10M+', label: 'Automations Run' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9/5', label: 'Customer Rating' }
  ];

  // FAQs
  const faqs = [
    {
      question: 'How is CUBE Nexum different from Zapier or Make?',
      answer: 'CUBE Nexum combines the best of browser automation (like Selenium) with workflow automation (like Zapier). Our AI-powered element detection and visual flow builder make it easy to automate any website, not just apps with APIs. Plus, you can run workflows locally for maximum privacy and speed.'
    },
    {
      question: 'Do I need coding skills to use CUBE Nexum?',
      answer: 'No! CUBE Nexum is designed for everyone. Our visual flow builder and AI assistant let you create complex automations without writing any code. For developers, we also offer a powerful API and scripting capabilities.'
    },
    {
      question: 'Is my data secure with CUBE Nexum?',
      answer: 'Absolutely. We offer both cloud and self-hosted options. For cloud users, we\'re SOC2 compliant with end-to-end encryption. For maximum security, you can run everything on your own infrastructure with our Enterprise plan.'
    },
    {
      question: 'Can I try CUBE Nexum before purchasing?',
      answer: 'Yes! We offer a 14-day free trial with full access to Professional features. No credit card required. You can also start with our free Starter plan which includes 500 actions per month.'
    },
    {
      question: 'What kind of support do you offer?',
      answer: 'All plans include email support with response times under 24 hours. Professional plans get priority support via chat. Enterprise customers get dedicated account managers and 24/7 phone support.'
    }
  ];

  // Company logos
  const companyLogos = [
    'Microsoft', 'Salesforce', 'HubSpot', 'Stripe', 'Shopify', 'Zendesk'
  ];

  return (
    <div className="landing-page">
      {/* Navigation - Clean & Professional */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <a href="/" className="nav-logo" aria-label="CUBE AI Home">
            <CubeLogo variant="horizontal" size="md" theme="dark" />
          </a>

          <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
            <a href="#features">{t('nav.features', 'Features')}</a>
            <a href="#pricing">{t('nav.pricing', 'Pricing')}</a>
            <div className="nav-dropdown">
              <button className="nav-dropdown-trigger">
                {t('nav.products', 'Products')} <ChevronDown className="w-4 h-4" />
              </button>
              <div className="nav-dropdown-menu">
                <a href="/get" className="dropdown-item-featured">
                  <CubeLogo variant="icon" size="sm" theme="dark" />
                  <div className="dropdown-item-text">
                    <span>CUBE Nexum</span>
                    <small>{t('products.browserAutomation', 'Browser Automation')}</small>
                  </div>
                </a>
                <a href="/cubemail">
                  <Mail className="w-5 h-5" />
                  <div className="dropdown-item-text">
                    <span>CubeMail</span>
                    <small>{t('products.privateEmail', 'Private Email')}</small>
                  </div>
                </a>
                <a href="/waitlist/cube-core">
                  <Boxes className="w-5 h-5" />
                  <div className="dropdown-item-text">
                    <span>CUBE Core</span>
                    <small>{t('products.enterpriseSuite', 'Enterprise Suite')}</small>
                  </div>
                </a>
              </div>
            </div>
            <a href="/affiliates">{t('nav.partners', 'Partners')}</a>
            <a href="/investors" className="nav-investors">{t('nav.investors', 'Investors')}</a>
          </div>

          <div className="nav-actions">
            {/* Language Selector */}
            <LanguageSelector variant="compact" theme="dark" />
            
            <a href="/login" className="nav-link">{t('nav.signIn', 'Sign In')}</a>
            <a href="/get" className="btn-nav-primary">
              {t('nav.getStarted', 'Get Started')}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="hero-gradient" />
          <div className="hero-grid" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles className="w-4 h-4" />
            <span>{t('hero.badge', 'Powered by GPT-5.2 AI • Part of CUBE AI Ecosystem')}</span>
          </div>

          <h1 className="hero-title">
            {t('hero.title1', 'Enterprise AI Tools.')}
            <span className="gradient-text">{t('hero.title2', 'Unlimited Potential.')}</span>
          </h1>

          <p className="hero-subtitle">
            {t('hero.subtitle', 'CUBE Nexum: The most powerful browser automation platform. Coming soon: CUBE Core - All-in-One Enterprise Suite with ERP, HR, CRM, Banking & 200+ modules.')}
          </p>

          <div className="hero-ctas">
            <a href="/signup" className="btn-hero-primary">
              {t('hero.startTrial', 'Start Free Trial')}
              <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#demo" className="btn-hero-secondary">
              <Play className="w-5 h-5" />
              {t('hero.watchDemo', 'Watch Demo')}
            </a>
          </div>

          <div className="hero-trust">
            <span>{t('hero.trustedBy', 'Trusted by teams at')}</span>
            <div className="trust-logos">
              {companyLogos.map(logo => (
                <span key={logo} className="trust-logo">{logo}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-browser">
            <div className="browser-header">
              <div className="browser-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="browser-url">cubeai.tools/workflow-builder</div>
            </div>
            <div className="browser-content">
              <div className="workflow-canvas">
                {/* Sidebar */}
                <div className="workflow-sidebar">
                  <div className="sidebar-section">
                    <span className="sidebar-title">Triggers</span>
                    <div className="sidebar-item"><Clock className="w-4 h-4" /> Schedule</div>
                    <div className="sidebar-item"><Globe className="w-4 h-4" /> URL Change</div>
                  </div>
                  <div className="sidebar-section">
                    <span className="sidebar-title">Actions</span>
                    <div className="sidebar-item"><MousePointer2 className="w-4 h-4" /> Click</div>
                    <div className="sidebar-item"><Type className="w-4 h-4" /> Type</div>
                    <div className="sidebar-item"><Database className="w-4 h-4" /> Extract</div>
                  </div>
                </div>
                {/* Main flow */}
                <div className="workflow-flow">
                  <div className="workflow-row">
                    <div className="node trigger">
                      <Globe className="w-5 h-5" />
                      <span>Open URL</span>
                      <span className="node-badge">Start</span>
                    </div>
                    <div className="connector horizontal" />
                    <div className="node action">
                      <MousePointer2 className="w-5 h-5" />
                      <span>Click Login</span>
                    </div>
                    <div className="connector horizontal" />
                    <div className="node action">
                      <Type className="w-5 h-5" />
                      <span>Fill Form</span>
                    </div>
                  </div>
                  <div className="connector vertical right-aligned" />
                  <div className="workflow-row">
                    <div className="node condition">
                      <GitBranch className="w-5 h-5" />
                      <span>If Logged In</span>
                    </div>
                    <div className="connector horizontal" />
                    <div className="node loop">
                      <RotateCcw className="w-5 h-5" />
                      <span>For Each Page</span>
                    </div>
                    <div className="connector horizontal" />
                    <div className="node extract">
                      <Database className="w-5 h-5" />
                      <span>Extract Data</span>
                    </div>
                  </div>
                  <div className="connector vertical right-aligned" />
                  <div className="workflow-row">
                    <div className="node ai">
                      <Sparkles className="w-5 h-5" />
                      <span>AI Analysis</span>
                      <span className="node-badge ai">AI</span>
                    </div>
                    <div className="connector horizontal" />
                    <div className="node output">
                      <FileOutput className="w-5 h-5" />
                      <span>Export CSV</span>
                      <span className="node-badge">End</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CubeMail Promo Banner */}
      <section className="cubemail-promo">
        <div className="promo-container">
          <div className="promo-icon">
            <Mail className="w-8 h-8" />
          </div>
          <div className="promo-content">
            <h3>🎉 Introducing CubeMail - Free Private Email</h3>
            <p>Get your free @cubemail.pro address with 25GB storage, no ads, and AI-powered email screening.</p>
          </div>
          <a href="/cubemail" className="promo-cta">
            Get Free Email
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Products Section - CUBE AI Ecosystem */}
      <section id="products" className="products-section">
        <div className="section-header">
          <span className="section-tag">CUBE AI Ecosystem</span>
          <h2>Enterprise Solutions for Every Need</h2>
          <p>Invest in the future of enterprise AI tools</p>
        </div>

        <div className="products-grid">
          <div className="product-card featured">
            <div className="product-badge">Available Now</div>
            <div className="product-icon">
              <Globe className="w-12 h-12" />
            </div>
            <h3>CUBE Nexum</h3>
            <p className="product-tagline">Browser Automation Platform</p>
            <p className="product-description">
              The most powerful browser automation and data extraction platform. 
              AI-powered workflows, visual builder, and enterprise-grade security.
            </p>
            <ul className="product-features">
              <li><Check className="w-4 h-4" /> AI-Powered Automation</li>
              <li><Check className="w-4 h-4" /> Visual Flow Builder</li>
              <li><Check className="w-4 h-4" /> Data Extraction & Scraping</li>
              <li><Check className="w-4 h-4" /> Cross-Platform Desktop App</li>
            </ul>
            <a href="#pricing" className="product-cta primary">Get Started</a>
          </div>

          <div className="product-card">
            <div className="product-badge coming-soon">Coming 2026</div>
            <div className="product-icon">
              <Building2 className="w-12 h-12" />
            </div>
            <h3>CUBE Core</h3>
            <p className="product-tagline">All-in-One Enterprise Suite</p>
            <p className="product-description">
              Complete enterprise solution with 200+ modules. ERP, HR, CRM, CMS, 
              Banking, Fintech, and much more in a single unified platform.
            </p>
            <ul className="product-features">
              <li><Check className="w-4 h-4" /> ERP & Resource Planning</li>
              <li><Check className="w-4 h-4" /> HR & Talent Management</li>
              <li><Check className="w-4 h-4" /> CRM & Sales Pipeline</li>
              <li><Check className="w-4 h-4" /> Banking & Fintech Modules</li>
            </ul>
            <a href="/investors" className="product-cta secondary">Invest Now</a>
          </div>

          <div className="product-card">
            <div className="product-badge coming-soon">Coming 2026</div>
            <div className="product-icon">
              <Lock className="w-12 h-12" />
            </div>
            <h3>CUBE Finance</h3>
            <p className="product-tagline">Fintech & Banking Solutions</p>
            <p className="product-description">
              Complete fintech infrastructure with digital banking, payment processing, 
              crypto integration, and regulatory compliance built-in.
            </p>
            <ul className="product-features">
              <li><Check className="w-4 h-4" /> Digital Banking Platform</li>
              <li><Check className="w-4 h-4" /> Payment Processing</li>
              <li><Check className="w-4 h-4" /> Crypto & Blockchain</li>
              <li><Check className="w-4 h-4" /> Regulatory Compliance</li>
            </ul>
            <a href="/investors" className="product-cta secondary">Invest Now</a>
          </div>

          <div className="product-card featured">
            <div className="product-badge">Free Service</div>
            <div className="product-icon">
              <Mail className="w-12 h-12" />
            </div>
            <h3>CubeMail</h3>
            <p className="product-tagline">Private Email Service</p>
            <p className="product-description">
              Free, private, and powerful email. No ads, no tracking, 25GB storage. 
              AI-powered email screener and enterprise-grade security.
            </p>
            <ul className="product-features">
              <li><Check className="w-4 h-4" /> 25GB Free Storage</li>
              <li><Check className="w-4 h-4" /> Zero Ads, Full Privacy</li>
              <li><Check className="w-4 h-4" /> AI Email Screener</li>
              <li><Check className="w-4 h-4" /> @cubemail.pro Address</li>
            </ul>
            <a href="/cubemail" className="product-cta primary">Get Free Email</a>
          </div>
        </div>

        <div className="investor-banner">
          <div className="investor-content">
            <h3>🚀 Invest in the CUBE AI Ecosystem</h3>
            <p>Join our investor network and be part of the next generation of enterprise AI tools. 
               Smart contracts, token-based returns, and exclusive investor benefits.</p>
            <a href="/investors" className="investor-cta">
              Become an Investor
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <span className="section-tag">Features</span>
          <h2>Everything You Need to Automate the Web</h2>
          <p>Powerful features that make browser automation accessible to everyone</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="feature-highlight">{feature.highlight}</span>
            </div>
          ))}
        </div>
      </section>

      {/* AI Section */}
      <section className="ai-section">
        <div className="ai-container">
          <div className="ai-content">
            <span className="section-tag">AI Assistant</span>
            <h2>Describe It. We&apos;ll Build It.</h2>
            <p>
              Just tell our AI what you want to automate in plain English. 
              It understands context, suggests improvements, and creates 
              production-ready workflows in seconds.
            </p>
            <ul className="ai-features">
              <li>
                <Check className="w-5 h-5" />
                Natural language workflow creation
              </li>
              <li>
                <Check className="w-5 h-5" />
                Auto-healing selectors that adapt to changes
              </li>
              <li>
                <Check className="w-5 h-5" />
                Smart suggestions as you build
              </li>
              <li>
                <Check className="w-5 h-5" />
                Automatic error handling and retries
              </li>
            </ul>
            <a href="#demo" className="btn-section-primary">
              See AI in Action
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
          <div className="ai-visual">
            <div className="ai-chat">
              <div className="chat-message user">
                <span>Extract all product names and prices from amazon.com search results</span>
              </div>
              <div className="chat-message ai">
                <Bot className="w-5 h-5" />
                <div className="ai-response">
                  <span>I&apos;ll create a workflow that:</span>
                  <ul>
                    <li>1. Navigates to Amazon search</li>
                    <li>2. Scrolls to load all results</li>
                    <li>3. Extracts product data (name, price, rating)</li>
                    <li>4. Exports to your preferred format</li>
                  </ul>
                  <div className="ai-action">
                    <span className="generating">Generating workflow...</span>
                    <div className="progress-bar">
                      <div className="progress-fill" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="usecases-section">
        <div className="section-header">
          <span className="section-tag">Use Cases</span>
          <h2>Built for Every Team</h2>
          <p>See how companies like yours use CUBE Nexum to automate their workflows</p>
        </div>

        <div className="usecases-grid">
          {useCases.map((useCase, index) => (
            <div key={index} className="usecase-card">
              <div className="usecase-icon">{useCase.icon}</div>
              <h3>{useCase.title}</h3>
              <p>{useCase.description}</p>
              <a href="#" className="usecase-link">
                Learn more <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Section - Why CUBE Nexum Wins */}
      <section id="comparison" className="comparison-section">
        <div className="section-header">
          <span className="section-tag">Comparison</span>
          <h2>Why Teams Choose CUBE Nexum</h2>
          <p>See how we stack up against the competition</p>
        </div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="highlight-column">
                  <div className="column-header">
                    <Boxes className="w-6 h-6" />
                    <span>CUBE Nexum</span>
                    <span className="winner-badge">Best Choice</span>
                  </div>
                </th>
                <th>Zapier</th>
                <th>Make</th>
                <th>Selenium</th>
                <th>Bardeen</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="feature-name">
                  <strong>Native Desktop App</strong>
                  <span className="feature-desc">Run locally with full privacy</span>
                </td>
                <td className="highlight-column"><Check className="w-5 h-5 text-green-500" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
              </tr>
              <tr>
                <td className="feature-name">
                  <strong>GPT-5.2 AI Integration</strong>
                  <span className="feature-desc">Natural language automation</span>
                </td>
                <td className="highlight-column"><Check className="w-5 h-5 text-green-500" /></td>
                <td><span className="partial">Basic AI</span></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
              </tr>
              <tr>
                <td className="feature-name">
                  <strong>Self-Hosted Option</strong>
                  <span className="feature-desc">Enterprise security control</span>
                </td>
                <td className="highlight-column"><Check className="w-5 h-5 text-green-500" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
              </tr>
              <tr>
                <td className="feature-name">
                  <strong>Visual Workflow Builder</strong>
                  <span className="feature-desc">Drag-and-drop no-code</span>
                </td>
                <td className="highlight-column"><Check className="w-5 h-5 text-green-500" /></td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
              </tr>
              <tr>
                <td className="feature-name">
                  <strong>Browser Automation</strong>
                  <span className="feature-desc">Full web interaction</span>
                </td>
                <td className="highlight-column"><Check className="w-5 h-5 text-green-500" /></td>
                <td><span className="partial">Limited</span></td>
                <td><span className="partial">Limited</span></td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
                <td><Check className="w-5 h-5 text-green-500" /></td>
              </tr>
              <tr>
                <td className="feature-name">
                  <strong>Built-in VPN + Proxy</strong>
                  <span className="feature-desc">Bypass restrictions</span>
                </td>
                <td className="highlight-column"><Check className="w-5 h-5 text-green-500" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
              </tr>
              <tr>
                <td className="feature-name">
                  <strong>Integrated Terminal</strong>
                  <span className="feature-desc">Run scripts & commands</span>
                </td>
                <td className="highlight-column"><Check className="w-5 h-5 text-green-500" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><span className="partial">External</span></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
              </tr>
              <tr>
                <td className="feature-name">
                  <strong>OCR & Vision AI</strong>
                  <span className="feature-desc">Extract text from images</span>
                </td>
                <td className="highlight-column"><Check className="w-5 h-5 text-green-500" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><X className="w-5 h-5 text-gray-400" /></td>
                <td><span className="partial">Basic</span></td>
              </tr>
              <tr>
                <td className="feature-name">
                  <strong>Starting Price</strong>
                  <span className="feature-desc">Monthly cost</span>
                </td>
                <td className="highlight-column"><span className="price-compare">$24/mo</span></td>
                <td><span className="price-compare">$49/mo</span></td>
                <td><span className="price-compare">$29/mo</span></td>
                <td><span className="price-compare">Free*</span></td>
                <td><span className="price-compare">$29/mo</span></td>
              </tr>
              <tr className="total-row">
                <td className="feature-name">
                  <strong>Total Features</strong>
                </td>
                <td className="highlight-column"><span className="score best">9/9 ⭐</span></td>
                <td><span className="score">3/9</span></td>
                <td><span className="score">2/9</span></td>
                <td><span className="score">3/9</span></td>
                <td><span className="score">4/9</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="comparison-note">
          * Selenium requires significant developer time and infrastructure costs not included in &quot;free&quot;
        </p>

        <div className="comparison-cta">
          <h3>Ready to experience the difference?</h3>
          <a href="/signup" className="btn-comparison-primary">
            Start Your Free 14-Day Trial
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <span className="section-tag">Pricing</span>
          <h2>Simple, Transparent Pricing</h2>
          <p>Start free, scale as you grow</p>
        </div>

        <div className="billing-toggle">
          <button 
            className={billingCycle === 'monthly' ? 'active' : ''}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button 
            className={billingCycle === 'yearly' ? 'active' : ''}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
            <span className="save-badge">Save 20%</span>
          </button>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              <h3>{plan.name}</h3>
              <p className="plan-description">{plan.description}</p>
              <div className="plan-price">
                {typeof plan.price[billingCycle] === 'number' ? (
                  <>
                    <span className="currency">$</span>
                    <span className="amount">{plan.price[billingCycle]}</span>
                    <span className="period">/month</span>
                  </>
                ) : (
                  <span className="custom-price">{plan.price[billingCycle]}</span>
                )}
              </div>
              <ul className="plan-features">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex}>
                    <Check className="w-4 h-4" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                className={`plan-cta ${plan.popular ? 'primary' : 'secondary'}`}
                onClick={() => handleCheckout(plan.tier)}
                disabled={checkoutLoading === plan.tier}
              >
                {checkoutLoading === plan.tier ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="pricing-note">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <span className="section-tag">Testimonials</span>
          <h2>Loved by Teams Worldwide</h2>
          <p>See what our customers have to say</p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="stars">
                {Array(testimonial.rating).fill(0).map((_, i) => (
                  <Star key={i} className="w-4 h-4" />
                ))}
              </div>
              <blockquote>&quot;{testimonial.quote}&quot;</blockquote>
              <div className="testimonial-author">
                <div className="author-avatar">{testimonial.avatar}</div>
                <div className="author-info">
                  <span className="author-name">{testimonial.author}</span>
                  <span className="author-role">{testimonial.role} at {testimonial.company}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="section-header">
          <span className="section-tag">FAQ</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about CUBE Nexum</p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${activeFaq === index ? 'open' : ''}`}
            >
              <button 
                className="faq-question"
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              >
                <span>{faq.question}</span>
                <ChevronDown className="w-5 h-5" />
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Automate?</h2>
          <p>Join 50,000+ users who trust CUBE Nexum for their automation needs.</p>
          <div className="cta-buttons">
            <a href="/signup" className="btn-cta-primary">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </a>
            <a href="/contact" className="btn-cta-secondary">
              <Headphones className="w-5 h-5" />
              Talk to Sales
            </a>
          </div>
          <p className="cta-note">
            <Check className="w-4 h-4" />
            14-day free trial
            <Check className="w-4 h-4" />
            No credit card required
            <Check className="w-4 h-4" />
            Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <CubeLogo variant="horizontal" size="sm" theme="light" />
              </div>
              <p>Enterprise AI tools for the modern workplace. Browser automation, ERP, CRM, and 200+ enterprise modules.</p>
              <div className="social-links">
                <a href="#" aria-label="Twitter"><Twitter className="w-5 h-5" /></a>
                <a href="#" aria-label="LinkedIn"><Linkedin className="w-5 h-5" /></a>
                <a href="#" aria-label="GitHub"><Github className="w-5 h-5" /></a>
                <a href="#" aria-label="YouTube"><Youtube className="w-5 h-5" /></a>
              </div>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Products</h4>
                <a href="/cubemail">CubeMail</a>
                <a href="#products">CUBE Nexum</a>
                <a href="#products">CUBE Core</a>
                <a href="/investors">CUBE Finance</a>
              </div>
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="/get">Download</a>
                <a href="/waitlist/cube-core">CUBE Core</a>
                <a href="/cubemail">CubeMail</a>
              </div>
              <div className="footer-column">
                <h4>Resources</h4>
                <a href="/help">Help Center</a>
                <a href="/developer/api-keys">API Keys</a>
                <a href="/developer/sdk">SDK</a>
                <a href="/developer/changelog">Changelog</a>
                <a href="/contact">Support</a>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <a href="/landing#features">About</a>
                <a href="/affiliates">Affiliates</a>
                <a href="/investors">Investors</a>
                <a href="/contact">Contact</a>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
                <a href="/cookies">Cookie Policy</a>
                <a href="/gdpr">GDPR</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 CUBE AI Tools. All rights reserved.</span>
            <div className="footer-badges">
              <span className="badge">🔒 SOC2 Compliant</span>
              <span className="badge">🛡️ GDPR Ready</span>
              <span className="badge">⚡ 99.9% Uptime</span>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Sales Chat Widget */}
      <SalesChatWidget position="bottom-right" />
    </div>
  );
};

export default LandingPage;
