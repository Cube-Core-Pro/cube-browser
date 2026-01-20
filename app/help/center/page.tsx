'use client';

import React, { useState } from 'react';
import { 
  HelpCircle,
  Search,
  Book,
  Video,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Play,
  FileText,
  Zap,
  Settings,
  Users,
  CreditCard,
  Shield,
  Code,
  Database,
  Globe,
  Rocket,
  Lightbulb,
  Award,
  Clock,
  Star,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Phone,
  Calendar
} from 'lucide-react';
import './help.css';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface GuideItem {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  type: 'article' | 'video' | 'tutorial';
  popular: boolean;
}

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: <Rocket size={20} />, color: '#22c55e' },
    { id: 'automation', label: 'Automation', icon: <Zap size={20} />, color: '#8b5cf6' },
    { id: 'api', label: 'API & Developers', icon: <Code size={20} />, color: '#f97316' },
    { id: 'billing', label: 'Billing & Plans', icon: <CreditCard size={20} />, color: '#0ea5e9' },
    { id: 'security', label: 'Security', icon: <Shield size={20} />, color: '#ef4444' },
    { id: 'team', label: 'Team Management', icon: <Users size={20} />, color: '#ec4899' },
    { id: 'integrations', label: 'Integrations', icon: <Globe size={20} />, color: '#06b6d4' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: <Settings size={20} />, color: '#6b7280' }
  ];

  const popularGuides: GuideItem[] = [
    {
      id: '1',
      title: 'Quick Start Guide',
      description: 'Get up and running with CUBE Elite in under 10 minutes',
      category: 'getting-started',
      readTime: '10 min',
      type: 'tutorial',
      popular: true
    },
    {
      id: '2',
      title: 'Creating Your First Automation',
      description: 'Learn how to build powerful automations from scratch',
      category: 'automation',
      readTime: '15 min',
      type: 'video',
      popular: true
    },
    {
      id: '3',
      title: 'API Authentication Guide',
      description: 'Secure your API integrations with proper authentication',
      category: 'api',
      readTime: '8 min',
      type: 'article',
      popular: true
    },
    {
      id: '4',
      title: 'Team Permissions & Roles',
      description: 'Set up the right access levels for your team members',
      category: 'team',
      readTime: '12 min',
      type: 'article',
      popular: true
    },
    {
      id: '5',
      title: 'Advanced Selector Strategies',
      description: 'Master CSS selectors for reliable web automation',
      category: 'automation',
      readTime: '20 min',
      type: 'video',
      popular: true
    },
    {
      id: '6',
      title: 'Webhook Configuration',
      description: 'Connect CUBE Elite with your existing tools',
      category: 'integrations',
      readTime: '10 min',
      type: 'tutorial',
      popular: true
    }
  ];

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking on "Forgot Password" on the login page. Enter your email address and we\'ll send you a secure link to create a new password. The link expires in 24 hours for security purposes.',
      category: 'getting-started',
      helpful: 142
    },
    {
      id: 'faq-2',
      question: 'What browsers are supported for automation?',
      answer: 'CUBE Elite supports Chromium-based browsers (Chrome, Edge, Brave), Firefox, and Safari. For the best experience and most reliable automation, we recommend using the built-in CUBE Browser which is optimized for automation tasks.',
      category: 'automation',
      helpful: 98
    },
    {
      id: 'faq-3',
      question: 'How do I upgrade my subscription plan?',
      answer: 'Navigate to Settings > Subscription > Change Plan. Select your desired plan and follow the checkout process. Your new features will be available immediately, and billing will be prorated for the remainder of your current period.',
      category: 'billing',
      helpful: 87
    },
    {
      id: 'faq-4',
      question: 'Is my data encrypted?',
      answer: 'Yes, all data is encrypted both in transit (TLS 1.3) and at rest (AES-256). We follow industry best practices for data security and are SOC 2 Type II certified. Your automation credentials are additionally encrypted using vault-level security.',
      category: 'security',
      helpful: 156
    },
    {
      id: 'faq-5',
      question: 'Can I invite team members to my account?',
      answer: 'Absolutely! Go to Settings > Team Management > Invite Member. You can invite unlimited team members on Enterprise plans. Each member can be assigned specific roles (Admin, Developer, Viewer) with granular permissions.',
      category: 'team',
      helpful: 72
    },
    {
      id: 'faq-6',
      question: 'How do I generate API keys?',
      answer: 'Navigate to Settings > API Keys > Generate New Key. You can create multiple keys with different permissions and expiration dates. Make sure to copy your key immediately as it won\'t be shown again for security reasons.',
      category: 'api',
      helpful: 134
    },
    {
      id: 'faq-7',
      question: 'What integrations are available?',
      answer: 'CUBE Elite integrates with 50+ popular tools including Slack, Zapier, Make, Google Sheets, Salesforce, HubSpot, Airtable, Notion, and many more. You can also use our webhooks and API for custom integrations.',
      category: 'integrations',
      helpful: 89
    },
    {
      id: 'faq-8',
      question: 'Why is my automation failing?',
      answer: 'Common causes include: 1) Stale selectors - the website may have changed its structure, 2) Timing issues - try adding delays between steps, 3) Authentication problems - ensure cookies/sessions are valid, 4) Rate limiting - slow down your automation speed.',
      category: 'troubleshooting',
      helpful: 203
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} />;
      case 'tutorial': return <Play size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="help-center">
      <header className="help-center__header">
        <div className="header-content">
          <div className="help-center__icon">
            <HelpCircle size={32} />
          </div>
          <h1>Help Center</h1>
          <p>Find answers, tutorials, and get support for CUBE Elite</p>
          
          <div className="search-container">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search for help articles, guides, and FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="header-bg">
          <div className="gradient-orb orb-1" />
          <div className="gradient-orb orb-2" />
        </div>
      </header>

      <div className="help-center__categories">
        <h2>Browse by Category</h2>
        <div className="categories-grid">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-card ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
              style={{ '--category-color': cat.color } as React.CSSProperties}
            >
              <div className="category-icon">
                {cat.icon}
              </div>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="help-center__popular">
        <div className="section-header">
          <h2>
            <Star size={20} />
            Popular Guides
          </h2>
          <a href="/docs" className="view-all">
            View All Documentation
            <ArrowRight size={16} />
          </a>
        </div>
        
        <div className="guides-grid">
          {popularGuides.map(guide => (
            <a key={guide.id} href={`/docs/${guide.id}`} className="guide-card">
              <div className="guide-header">
                <span className={`guide-type ${guide.type}`}>
                  {getTypeIcon(guide.type)}
                  {guide.type}
                </span>
                {guide.popular && (
                  <span className="popular-badge">
                    <Award size={12} />
                    Popular
                  </span>
                )}
              </div>
              <h3>{guide.title}</h3>
              <p>{guide.description}</p>
              <div className="guide-footer">
                <span className="read-time">
                  <Clock size={14} />
                  {guide.readTime}
                </span>
                <span className="guide-category">{guide.category}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="help-center__faq">
        <div className="section-header">
          <h2>
            <Lightbulb size={20} />
            Frequently Asked Questions
          </h2>
        </div>
        
        <div className="faq-list">
          {filteredFAQs.map(faq => (
            <div 
              key={faq.id} 
              className={`faq-item ${expandedFAQ === faq.id ? 'expanded' : ''}`}
            >
              <button 
                className="faq-question"
                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
              >
                <span>{faq.question}</span>
                <ChevronDown size={20} />
              </button>
              
              {expandedFAQ === faq.id && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                  <div className="faq-footer">
                    <span className="helpful-count">
                      <ThumbsUp size={14} />
                      {faq.helpful} found this helpful
                    </span>
                    <div className="feedback-buttons">
                      <span>Was this helpful?</span>
                      <button className="feedback-btn yes">
                        <ThumbsUp size={14} />
                        Yes
                      </button>
                      <button className="feedback-btn no">
                        <ThumbsDown size={14} />
                        No
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="help-center__contact">
        <h2>Still Need Help?</h2>
        <p>Our support team is here to assist you with any questions</p>
        
        <div className="contact-options">
          <a href="/support/tickets/new" className="contact-card">
            <div className="contact-icon">
              <MessageCircle size={24} />
            </div>
            <div className="contact-content">
              <h3>Submit a Ticket</h3>
              <p>Get a response within 24 hours</p>
            </div>
            <ChevronRight size={20} />
          </a>
          
          <a href="/chat" className="contact-card featured">
            <div className="contact-icon">
              <Zap size={24} />
            </div>
            <div className="contact-content">
              <h3>Live Chat</h3>
              <p>Chat with our AI assistant or support team</p>
              <span className="availability">Available 24/7</span>
            </div>
            <ChevronRight size={20} />
          </a>
          
          <a href="mailto:support@cube.app" className="contact-card">
            <div className="contact-icon">
              <Mail size={24} />
            </div>
            <div className="contact-content">
              <h3>Email Support</h3>
              <p>support@cube.app</p>
            </div>
            <ChevronRight size={20} />
          </a>
          
          <a href="/schedule-call" className="contact-card">
            <div className="contact-icon">
              <Calendar size={24} />
            </div>
            <div className="contact-content">
              <h3>Schedule a Call</h3>
              <p>Enterprise customers only</p>
            </div>
            <ChevronRight size={20} />
          </a>
        </div>
      </div>

      <div className="help-center__resources">
        <h2>Additional Resources</h2>
        <div className="resources-grid">
          <a href="/docs" className="resource-card">
            <Book size={24} />
            <h3>Documentation</h3>
            <p>Complete technical documentation</p>
          </a>
          <a href="/api-reference" className="resource-card">
            <Code size={24} />
            <h3>API Reference</h3>
            <p>Full API documentation with examples</p>
          </a>
          <a href="/tutorials" className="resource-card">
            <Video size={24} />
            <h3>Video Tutorials</h3>
            <p>Step-by-step video guides</p>
          </a>
          <a href="/community" className="resource-card">
            <Users size={24} />
            <h3>Community</h3>
            <p>Join the CUBE Elite community</p>
          </a>
        </div>
      </div>
    </div>
  );
}
