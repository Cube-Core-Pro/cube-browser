'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Check, ArrowRight, Mail, User,
  Briefcase, Globe, Sparkles, Users, Calendar
} from 'lucide-react';
import { SiteHeader } from '@/components/shared/SiteHeader';
import './cube-core-waitlist.css';

// ============================================
// Types
// ============================================

interface WaitlistFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
  companySize: string;
  interestedModules: string[];
  country: string;
  useCase: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  role?: string;
  companySize?: string;
  interestedModules?: string;
}

// ============================================
// Data
// ============================================

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const ROLES = [
  { value: 'ceo', label: 'CEO / Founder' },
  { value: 'cto', label: 'CTO / Technical Lead' },
  { value: 'cfo', label: 'CFO / Finance Lead' },
  { value: 'coo', label: 'COO / Operations' },
  { value: 'hr', label: 'HR / People Ops' },
  { value: 'it', label: 'IT / Systems Admin' },
  { value: 'developer', label: 'Developer' },
  { value: 'consultant', label: 'Consultant / Advisor' },
  { value: 'other', label: 'Other' },
];

const MODULE_CATEGORIES = [
  { id: 'erp', label: 'ERP & Operations' },
  { id: 'hr', label: 'HR & Talent' },
  { id: 'crm', label: 'CRM & Sales' },
  { id: 'fintech', label: 'Banking & Fintech' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'hospitality', label: 'Hospitality' },
  { id: 'legal', label: 'Legal Practice' },
  { id: 'collaboration', label: 'Collaboration Tools' },
];

const BENEFITS = [
  { icon: <Calendar className="w-5 h-5" />, title: 'Early Access', description: 'Be first to use new modules' },
  { icon: <Sparkles className="w-5 h-5" />, title: 'Exclusive Pricing', description: 'Founding member discounts' },
  { icon: <Users className="w-5 h-5" />, title: 'Priority Support', description: 'Direct access to our team' },
];

// ============================================
// Main Component
// ============================================

export default function CubeCoreWaitlistPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<WaitlistFormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    companySize: '',
    interestedModules: [],
    country: '',
    useCase: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }
    
    if (!formData.role) {
      newErrors.role = 'Please select your role';
    }
    
    if (!formData.companySize) {
      newErrors.companySize = 'Please select company size';
    }
    
    if (formData.interestedModules.length === 0) {
      newErrors.interestedModules = 'Please select at least one module category';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate random waitlist position (mock)
      const position = Math.floor(Math.random() * 500) + 100;
      setWaitlistPosition(position);
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit waitlist form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof WaitlistFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      interestedModules: prev.interestedModules.includes(moduleId)
        ? prev.interestedModules.filter(m => m !== moduleId)
        : [...prev.interestedModules, moduleId]
    }));
    if (errors.interestedModules) {
      setErrors(prev => ({ ...prev, interestedModules: undefined }));
    }
  };

  if (submitted) {
    return (
      <div className="waitlist-page">
        <div className="success-container">
          <div className="success-icon">
            <Check className="w-10 h-10" />
          </div>
          <h1>You&apos;re on the List!</h1>
          <p className="success-message">
            Thank you for joining the CUBE Core waitlist. We&apos;ll notify you as soon as 
            early access becomes available.
          </p>
          
          {waitlistPosition && (
            <div className="position-badge">
              <span className="position-label">Your Position</span>
              <span className="position-number">#{waitlistPosition}</span>
            </div>
          )}
          
          <div className="success-benefits">
            <h3>What&apos;s Next?</h3>
            <ul>
              <li><Check className="w-4 h-4" /> Check your email for confirmation</li>
              <li><Check className="w-4 h-4" /> Follow us for updates and previews</li>
              <li><Check className="w-4 h-4" /> Share with colleagues to move up the list</li>
            </ul>
          </div>
          
          <div className="success-actions">
            <button 
              className="btn-primary"
              onClick={() => router.push('/cube-core')}
            >
              Explore CUBE Core <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              className="btn-secondary"
              onClick={() => router.push('/investors')}
            >
              Become an Investor
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="waitlist-page">
      <SiteHeader variant="dark" />
      
      <div className="waitlist-container">
        {/* Left Side - Info */}
        <div className="waitlist-info">
          <div className="info-header">
            <div className="logo-icon">
              <Building2 className="w-8 h-8" />
            </div>
            <h1>
              Join the <span className="gradient-text">CUBE Core</span> Waitlist
            </h1>
            <p>
              Be among the first to access the most comprehensive enterprise suite ever built. 
              200+ modules, AI-powered, and built for the modern business.
            </p>
          </div>
          
          <div className="benefits-list">
            {BENEFITS.map((benefit, i) => (
              <div key={i} className="benefit-item">
                <div className="benefit-icon">{benefit.icon}</div>
                <div className="benefit-content">
                  <h4>{benefit.title}</h4>
                  <p>{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="info-footer">
            <div className="waitlist-count">
              <span className="count-number">2,847</span>
              <span className="count-label">people already on the waitlist</span>
            </div>
          </div>
        </div>
        
        {/* Right Side - Form */}
        <div className="waitlist-form-container">
          <form className="waitlist-form" onSubmit={handleSubmit}>
            <h2>Request Early Access</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">
                  <User className="w-4 h-4" />
                  First Name *
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={errors.firstName ? 'error' : ''}
                />
                {errors.firstName && <span className="error-text">{errors.firstName}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">
                  <User className="w-4 h-4" />
                  Last Name *
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={errors.lastName ? 'error' : ''}
                />
                {errors.lastName && <span className="error-text">{errors.lastName}</span>}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">
                <Mail className="w-4 h-4" />
                Work Email *
              </label>
              <input
                id="email"
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="company">
                  <Building2 className="w-4 h-4" />
                  Company *
                </label>
                <input
                  id="company"
                  type="text"
                  placeholder="Acme Inc."
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className={errors.company ? 'error' : ''}
                />
                {errors.company && <span className="error-text">{errors.company}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="country">
                  <Globe className="w-4 h-4" />
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  placeholder="United States"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">
                  <Briefcase className="w-4 h-4" />
                  Role *
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className={errors.role ? 'error' : ''}
                >
                  <option value="">Select role...</option>
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                {errors.role && <span className="error-text">{errors.role}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="companySize">
                  <Users className="w-4 h-4" />
                  Company Size *
                </label>
                <select
                  id="companySize"
                  value={formData.companySize}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                  className={errors.companySize ? 'error' : ''}
                >
                  <option value="">Select size...</option>
                  {COMPANY_SIZES.map(size => (
                    <option key={size.value} value={size.value}>{size.label}</option>
                  ))}
                </select>
                {errors.companySize && <span className="error-text">{errors.companySize}</span>}
              </div>
            </div>
            
            <div className="form-group">
              <label>
                <Sparkles className="w-4 h-4" />
                Interested Modules *
              </label>
              <div className="module-chips">
                {MODULE_CATEGORIES.map(module => (
                  <button
                    key={module.id}
                    type="button"
                    className={`module-chip ${formData.interestedModules.includes(module.id) ? 'selected' : ''}`}
                    onClick={() => toggleModule(module.id)}
                  >
                    {formData.interestedModules.includes(module.id) && <Check className="w-3 h-3" />}
                    {module.label}
                  </button>
                ))}
              </div>
              {errors.interestedModules && <span className="error-text">{errors.interestedModules}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="useCase">
                What challenges are you looking to solve?
              </label>
              <textarea
                id="useCase"
                placeholder="Tell us about your business needs..."
                value={formData.useCase}
                onChange={(e) => handleInputChange('useCase', e.target.value)}
                rows={3}
              />
            </div>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  Joining Waitlist...
                </>
              ) : (
                <>
                  Join Waitlist <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            <p className="form-disclaimer">
              By joining, you agree to receive updates about CUBE Core. 
              No spam, unsubscribe anytime.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
