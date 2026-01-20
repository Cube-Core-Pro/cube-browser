'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Boxes, ArrowRight, Check, Clock, Star,
  BarChart3, Users, CreditCard, FileText, Package,
  Briefcase, Calculator, Warehouse, Truck, ShoppingCart,
  HeartPulse, GraduationCap, Factory, Plane, Hotel,
  Utensils, Stethoscope, Scale, Banknote, Shield,
  Mail, Calendar, MessageSquare, Video, Phone,
  HardDrive, Cloud, Lock, Globe, Zap, Sparkles
} from 'lucide-react';
import './cube-core.css';

// ============================================
// Types
// ============================================

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  status: 'available' | 'coming-soon' | 'beta';
  features: string[];
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  modules: Module[];
}

// ============================================
// Data
// ============================================

const CATEGORIES: Category[] = [
  {
    id: 'erp',
    name: 'ERP & Operations',
    description: 'Enterprise Resource Planning modules for complete business management',
    icon: <Building2 className="w-6 h-6" />,
    modules: [
      {
        id: 'finance',
        name: 'Financial Management',
        description: 'GL, AP, AR, budgeting, financial reporting',
        icon: <Calculator className="w-5 h-5" />,
        category: 'erp',
        status: 'coming-soon',
        features: ['General Ledger', 'Accounts Payable', 'Accounts Receivable', 'Budget Management', 'Financial Reports']
      },
      {
        id: 'inventory',
        name: 'Inventory Management',
        description: 'Stock control, warehouse management, batch tracking',
        icon: <Warehouse className="w-5 h-5" />,
        category: 'erp',
        status: 'coming-soon',
        features: ['Stock Control', 'Warehouse Management', 'Batch Tracking', 'Reorder Points', 'Multi-Location']
      },
      {
        id: 'procurement',
        name: 'Procurement',
        description: 'Purchase orders, vendor management, RFQ',
        icon: <Package className="w-5 h-5" />,
        category: 'erp',
        status: 'coming-soon',
        features: ['Purchase Orders', 'Vendor Management', 'RFQ/RFP', 'Approval Workflows', 'Contract Management']
      },
      {
        id: 'manufacturing',
        name: 'Manufacturing',
        description: 'BOM, work orders, production planning',
        icon: <Factory className="w-5 h-5" />,
        category: 'erp',
        status: 'coming-soon',
        features: ['Bill of Materials', 'Work Orders', 'Production Planning', 'Quality Control', 'Shop Floor Control']
      },
      {
        id: 'supply-chain',
        name: 'Supply Chain',
        description: 'Logistics, shipping, delivery management',
        icon: <Truck className="w-5 h-5" />,
        category: 'erp',
        status: 'coming-soon',
        features: ['Logistics Management', 'Shipping Integration', 'Route Optimization', 'Delivery Tracking', 'Returns Management']
      },
    ]
  },
  {
    id: 'hr',
    name: 'HR & Talent',
    description: 'Human resources and talent management suite',
    icon: <Users className="w-6 h-6" />,
    modules: [
      {
        id: 'core-hr',
        name: 'Core HR',
        description: 'Employee records, org charts, documents',
        icon: <Users className="w-5 h-5" />,
        category: 'hr',
        status: 'coming-soon',
        features: ['Employee Database', 'Org Charts', 'Document Management', 'Employee Portal', 'Compliance']
      },
      {
        id: 'recruiting',
        name: 'Recruiting',
        description: 'ATS, job postings, candidate management',
        icon: <Briefcase className="w-5 h-5" />,
        category: 'hr',
        status: 'coming-soon',
        features: ['Job Postings', 'Applicant Tracking', 'Interview Scheduling', 'Offer Management', 'Onboarding']
      },
      {
        id: 'payroll',
        name: 'Payroll',
        description: 'Salary processing, tax calculations, benefits',
        icon: <CreditCard className="w-5 h-5" />,
        category: 'hr',
        status: 'coming-soon',
        features: ['Salary Processing', 'Tax Calculations', 'Benefits Admin', 'Direct Deposit', 'Payslips']
      },
      {
        id: 'performance',
        name: 'Performance',
        description: 'Reviews, goals, 360 feedback',
        icon: <BarChart3 className="w-5 h-5" />,
        category: 'hr',
        status: 'coming-soon',
        features: ['Performance Reviews', 'Goal Setting', '360 Feedback', 'Competency Tracking', 'Development Plans']
      },
      {
        id: 'learning',
        name: 'Learning & Development',
        description: 'LMS, training, certifications',
        icon: <GraduationCap className="w-5 h-5" />,
        category: 'hr',
        status: 'coming-soon',
        features: ['Course Management', 'Training Tracking', 'Certifications', 'Skill Assessments', 'Learning Paths']
      },
    ]
  },
  {
    id: 'crm',
    name: 'CRM & Sales',
    description: 'Customer relationship and sales management',
    icon: <ShoppingCart className="w-6 h-6" />,
    modules: [
      {
        id: 'crm-core',
        name: 'CRM Core',
        description: 'Contacts, companies, deals, activities',
        icon: <Users className="w-5 h-5" />,
        category: 'crm',
        status: 'available',
        features: ['Contact Management', 'Company Records', 'Deal Tracking', 'Activity Timeline', 'Custom Fields']
      },
      {
        id: 'sales-pipeline',
        name: 'Sales Pipeline',
        description: 'Opportunity tracking, forecasting',
        icon: <BarChart3 className="w-5 h-5" />,
        category: 'crm',
        status: 'available',
        features: ['Pipeline View', 'Deal Stages', 'Forecasting', 'Quota Tracking', 'Win/Loss Analysis']
      },
      {
        id: 'marketing',
        name: 'Marketing Automation',
        description: 'Campaigns, email, lead scoring',
        icon: <Mail className="w-5 h-5" />,
        category: 'crm',
        status: 'available',
        features: ['Campaign Management', 'Email Marketing', 'Lead Scoring', 'Landing Pages', 'A/B Testing']
      },
      {
        id: 'customer-service',
        name: 'Customer Service',
        description: 'Ticketing, knowledge base, SLA',
        icon: <MessageSquare className="w-5 h-5" />,
        category: 'crm',
        status: 'available',
        features: ['Ticket Management', 'Knowledge Base', 'SLA Management', 'Customer Portal', 'Escalations']
      },
    ]
  },
  {
    id: 'fintech',
    name: 'Banking & Fintech',
    description: 'Financial services and banking modules',
    icon: <Banknote className="w-6 h-6" />,
    modules: [
      {
        id: 'core-banking',
        name: 'Core Banking',
        description: 'Accounts, transactions, statements',
        icon: <CreditCard className="w-5 h-5" />,
        category: 'fintech',
        status: 'coming-soon',
        features: ['Account Management', 'Transaction Processing', 'Statement Generation', 'Interest Calculation', 'Multi-Currency']
      },
      {
        id: 'lending',
        name: 'Lending',
        description: 'Loan origination, servicing, collections',
        icon: <FileText className="w-5 h-5" />,
        category: 'fintech',
        status: 'coming-soon',
        features: ['Loan Origination', 'Credit Scoring', 'Loan Servicing', 'Collections', 'Document Management']
      },
      {
        id: 'payments',
        name: 'Payments',
        description: 'Payment processing, transfers, reconciliation',
        icon: <Banknote className="w-5 h-5" />,
        category: 'fintech',
        status: 'coming-soon',
        features: ['Payment Gateway', 'Bank Transfers', 'Reconciliation', 'Fraud Detection', 'Settlement']
      },
      {
        id: 'compliance',
        name: 'Compliance & Risk',
        description: 'KYC, AML, regulatory reporting',
        icon: <Shield className="w-5 h-5" />,
        category: 'fintech',
        status: 'coming-soon',
        features: ['KYC/AML', 'Risk Assessment', 'Regulatory Reports', 'Audit Trail', 'Sanctions Screening']
      },
    ]
  },
  {
    id: 'industry',
    name: 'Industry Solutions',
    description: 'Specialized modules for specific industries',
    icon: <Globe className="w-6 h-6" />,
    modules: [
      {
        id: 'healthcare',
        name: 'Healthcare',
        description: 'Patient records, appointments, billing',
        icon: <Stethoscope className="w-5 h-5" />,
        category: 'industry',
        status: 'coming-soon',
        features: ['Patient Records', 'Appointments', 'Medical Billing', 'Prescriptions', 'Lab Integration']
      },
      {
        id: 'hospitality',
        name: 'Hospitality',
        description: 'Reservations, POS, housekeeping',
        icon: <Hotel className="w-5 h-5" />,
        category: 'industry',
        status: 'coming-soon',
        features: ['Reservation System', 'Room Management', 'POS Integration', 'Housekeeping', 'Guest Portal']
      },
      {
        id: 'legal',
        name: 'Legal Practice',
        description: 'Case management, billing, documents',
        icon: <Scale className="w-5 h-5" />,
        category: 'industry',
        status: 'coming-soon',
        features: ['Case Management', 'Time Tracking', 'Legal Billing', 'Document Assembly', 'Court Calendar']
      },
      {
        id: 'restaurant',
        name: 'Restaurant & F&B',
        description: 'POS, orders, inventory, reservations',
        icon: <Utensils className="w-5 h-5" />,
        category: 'industry',
        status: 'coming-soon',
        features: ['POS System', 'Order Management', 'Table Reservations', 'Kitchen Display', 'Inventory']
      },
    ]
  },
  {
    id: 'collaboration',
    name: 'Collaboration',
    description: 'Communication and productivity tools',
    icon: <MessageSquare className="w-6 h-6" />,
    modules: [
      {
        id: 'cube-mail',
        name: 'CUBE Mail',
        description: 'Enterprise email with AI features',
        icon: <Mail className="w-5 h-5" />,
        category: 'collaboration',
        status: 'available',
        features: ['AI Email Screening', 'E2E Encryption', '25GB Storage', 'Custom Domain', 'Calendar Integration']
      },
      {
        id: 'cube-meet',
        name: 'CUBE Meet',
        description: 'Video conferencing and webinars',
        icon: <Video className="w-5 h-5" />,
        category: 'collaboration',
        status: 'available',
        features: ['HD Video', 'Screen Sharing', 'Recording', 'Virtual Backgrounds', 'Webinars']
      },
      {
        id: 'cube-chat',
        name: 'CUBE Chat',
        description: 'Team messaging and channels',
        icon: <MessageSquare className="w-5 h-5" />,
        category: 'collaboration',
        status: 'available',
        features: ['Direct Messages', 'Channels', 'File Sharing', 'Threads', 'Integrations']
      },
      {
        id: 'cube-docs',
        name: 'CUBE Docs',
        description: 'Document collaboration and wiki',
        icon: <FileText className="w-5 h-5" />,
        category: 'collaboration',
        status: 'available',
        features: ['Real-time Editing', 'Version Control', 'Comments', 'Templates', 'Knowledge Base']
      },
    ]
  },
];

const STATS = [
  { value: '200+', label: 'Modules' },
  { value: '50+', label: 'Industries' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '24/7', label: 'Support' },
];

// ============================================
// Main Component
// ============================================

export default function CubeCorePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('erp');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="cube-core-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-grid"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles className="w-4 h-4" />
            <span>Coming 2026 • Part of CUBE AI Ecosystem</span>
          </div>
          
          <h1 className="hero-title">
            CUBE <span className="gradient-text">Core</span>
          </h1>
          
          <p className="hero-subtitle">
            The All-in-One Enterprise Suite with 200+ modules. ERP, HR, CRM, Banking, 
            Healthcare, and more - powered by AI and built for the modern enterprise.
          </p>
          
          <div className="hero-ctas">
            <button 
              className="btn-primary"
              onClick={() => router.push('/investors')}
            >
              Invest Now <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              className="btn-secondary"
              onClick={() => router.push('/waitlist/cube-core')}
            >
              <Clock className="w-5 h-5" /> Join Waitlist
            </button>
          </div>
          
          <div className="hero-stats">
            {STATS.map((stat, i) => (
              <div key={i} className="stat-item">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Navigation */}
      <section className="categories-section">
        <div className="section-header">
          <h2>Explore Module Categories</h2>
          <p>Choose a category to explore available and upcoming modules</p>
        </div>
        
        <div className="categories-nav">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.icon}
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Modules Grid */}
      <section className="modules-section">
        {currentCategory && (
          <>
            <div className="category-header">
              <div className="category-icon">{currentCategory.icon}</div>
              <div className="category-info">
                <h3>{currentCategory.name}</h3>
                <p>{currentCategory.description}</p>
              </div>
            </div>
            
            <div className="modules-grid">
              {currentCategory.modules.map((module) => (
                <div 
                  key={module.id} 
                  className={`module-card ${module.status} ${expandedModule === module.id ? 'expanded' : ''}`}
                  onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                >
                  <div className="module-header">
                    <div className="module-icon">{module.icon}</div>
                    <div className="module-info">
                      <h4>{module.name}</h4>
                      <p>{module.description}</p>
                    </div>
                    <span className={`status-badge ${module.status}`}>
                      {module.status === 'available' && <Check className="w-3 h-3" />}
                      {module.status === 'coming-soon' && <Clock className="w-3 h-3" />}
                      {module.status === 'beta' && <Zap className="w-3 h-3" />}
                      {module.status === 'available' ? 'Available' : module.status === 'beta' ? 'Beta' : 'Coming Soon'}
                    </span>
                  </div>
                  
                  {expandedModule === module.id && (
                    <div className="module-features">
                      <h5>Key Features</h5>
                      <ul>
                        {module.features.map((feature, i) => (
                          <li key={i}>
                            <Check className="w-4 h-4" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {module.status === 'available' && (
                        <button className="btn-module" onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/modules/${module.id}`);
                        }}>
                          Open Module <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Integration Section */}
      <section className="integration-section">
        <div className="section-header">
          <h2>Unified Platform Architecture</h2>
          <p>All modules work together seamlessly with shared data and AI capabilities</p>
        </div>
        
        <div className="integration-grid">
          <div className="integration-card">
            <Cloud className="w-8 h-8" />
            <h4>Cloud Native</h4>
            <p>Deploy anywhere - cloud, hybrid, or on-premise with Kubernetes support</p>
          </div>
          <div className="integration-card">
            <Lock className="w-8 h-8" />
            <h4>Enterprise Security</h4>
            <p>SOC2 Type II, GDPR, HIPAA compliant with end-to-end encryption</p>
          </div>
          <div className="integration-card">
            <Sparkles className="w-8 h-8" />
            <h4>AI-Powered</h4>
            <p>GPT-5.2 integration for automation, insights, and predictions</p>
          </div>
          <div className="integration-card">
            <HardDrive className="w-8 h-8" />
            <h4>Unified Database</h4>
            <p>Single source of truth across all modules with real-time sync</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Be Among the First to Access CUBE Core</h2>
          <p>
            Join our investor program or waitlist to get early access to the most comprehensive 
            enterprise suite ever built.
          </p>
          <div className="cta-buttons">
            <button 
              className="btn-primary"
              onClick={() => router.push('/investors')}
            >
              <Star className="w-5 h-5" /> Become an Investor
            </button>
            <button 
              className="btn-secondary"
              onClick={() => router.push('/waitlist/cube-core')}
            >
              Join Waitlist <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
