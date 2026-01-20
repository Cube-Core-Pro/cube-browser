'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import './page.css';

interface AffiliateFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  company: string;
  website: string;
  socialMedia: string;
  audienceSize: string;
  niche: string;
  promotionMethods: string[];
  tier: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
}

const TIERS = [
  { id: 'starter', name: 'Starter', commission: '20%', color: '#6b7280' },
  { id: 'professional', name: 'Professional', commission: '30%', color: '#3b82f6' },
  { id: 'elite', name: 'Elite', commission: '40%', color: '#8b5cf6' },
  { id: 'enterprise', name: 'Enterprise', commission: '50%', color: '#f59e0b' },
];

const NICHES = [
  'Technology',
  'Business & Finance',
  'Marketing & Sales',
  'Developer Tools',
  'Productivity',
  'E-commerce',
  'SaaS',
  'Education',
  'Other',
];

const PROMOTION_METHODS = [
  { id: 'blog', label: 'Blog/Website Content' },
  { id: 'youtube', label: 'YouTube Videos' },
  { id: 'social', label: 'Social Media' },
  { id: 'email', label: 'Email Newsletter' },
  { id: 'podcast', label: 'Podcast' },
  { id: 'courses', label: 'Online Courses' },
  { id: 'communities', label: 'Online Communities' },
  { id: 'ads', label: 'Paid Advertising' },
];

const AUDIENCE_SIZES = [
  { value: 'under-1k', label: 'Under 1,000' },
  { value: '1k-10k', label: '1,000 - 10,000' },
  { value: '10k-50k', label: '10,000 - 50,000' },
  { value: '50k-100k', label: '50,000 - 100,000' },
  { value: '100k-500k', label: '100,000 - 500,000' },
  { value: 'over-500k', label: '500,000+' },
];

export default function AffiliateSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTier = searchParams.get('tier') || 'starter';
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<AffiliateFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    website: '',
    socialMedia: '',
    audienceSize: '',
    niche: '',
    promotionMethods: [],
    tier: preselectedTier,
    agreeTerms: false,
    agreePrivacy: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePromotionMethodToggle = (methodId: string) => {
    setFormData(prev => ({
      ...prev,
      promotionMethods: prev.promotionMethods.includes(methodId)
        ? prev.promotionMethods.filter(m => m !== methodId)
        : [...prev.promotionMethods, methodId],
    }));
  };

  const validateStep1 = (): boolean => {
    if (!formData.firstName || !formData.lastName) {
      setError('Please enter your full name');
      return false;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.niche) {
      setError('Please select your niche');
      return false;
    }
    if (!formData.audienceSize) {
      setError('Please select your audience size');
      return false;
    }
    if (formData.promotionMethods.length === 0) {
      setError('Please select at least one promotion method');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!formData.agreeTerms || !formData.agreePrivacy) {
      setError('Please accept the terms and privacy policy');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError(null);
    
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateStep3()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/affiliates/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          company: formData.company,
          website: formData.website,
          socialMedia: formData.socialMedia,
          audienceSize: formData.audienceSize,
          niche: formData.niche,
          promotionMethods: formData.promotionMethods,
          tier: formData.tier,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }
      
      setSuccess(true);
      
      setTimeout(() => {
        router.push('/affiliates/dashboard');
      }, 3000);
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="affiliate-signup-page">
        <div className="signup-success">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2>Application Submitted!</h2>
          <p>Thank you for applying to become a CUBE affiliate.</p>
          <p>We'll review your application and get back to you within 24-48 hours.</p>
          <p className="redirect-notice">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  const selectedTier = TIERS.find(t => t.id === formData.tier);

  return (
    <div className="affiliate-signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <Link href="/" className="logo">
            <span className="logo-cube">CUBE</span>
            <span className="logo-affiliates">Affiliates</span>
          </Link>
          <h1>Become an Affiliate Partner</h1>
          <p>Earn up to 50% commission on every sale</p>
        </div>

        <div className="progress-bar">
          <div className="progress-steps">
            {[1, 2, 3].map(s => (
              <div key={s} className={`progress-step ${step >= s ? 'active' : ''} ${step > s ? 'completed' : ''}`}>
                <div className="step-number">{step > s ? '✓' : s}</div>
                <div className="step-label">
                  {s === 1 ? 'Account' : s === 2 ? 'Profile' : 'Review'}
                </div>
              </div>
            ))}
          </div>
          <div className="progress-line">
            <div className="progress-fill" style={{ width: `${((step - 1) / 2) * 100}%` }} />
          </div>
        </div>

        {error && (
          <div className="error-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form">
          {step === 1 && (
            <div className="form-step">
              <h2>Create Your Account</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="company">Company/Brand (Optional)</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Your company or brand name"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <h2>Tell Us About Your Audience</h2>
              
              <div className="form-group">
                <label htmlFor="website">Website URL (Optional)</label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="socialMedia">Main Social Media Profile</label>
                <input
                  type="text"
                  id="socialMedia"
                  name="socialMedia"
                  value={formData.socialMedia}
                  onChange={handleInputChange}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>

              <div className="form-group">
                <label htmlFor="niche">Your Niche *</label>
                <select
                  id="niche"
                  name="niche"
                  value={formData.niche}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select your niche</option>
                  {NICHES.map(niche => (
                    <option key={niche} value={niche}>{niche}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="audienceSize">Audience Size *</label>
                <select
                  id="audienceSize"
                  name="audienceSize"
                  value={formData.audienceSize}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select audience size</option>
                  {AUDIENCE_SIZES.map(size => (
                    <option key={size.value} value={size.value}>{size.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Promotion Methods *</label>
                <p className="form-hint">Select all that apply</p>
                <div className="checkbox-grid">
                  {PROMOTION_METHODS.map(method => (
                    <label key={method.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.promotionMethods.includes(method.id)}
                        onChange={() => handlePromotionMethodToggle(method.id)}
                      />
                      <span className="checkbox-label">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <h2>Select Your Tier & Review</h2>
              
              <div className="tier-selector">
                <label>Select Your Starting Tier</label>
                <div className="tier-options">
                  {TIERS.map(tier => (
                    <div
                      key={tier.id}
                      className={`tier-option ${formData.tier === tier.id ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, tier: tier.id }))}
                      style={{ borderColor: formData.tier === tier.id ? tier.color : undefined }}
                    >
                      <div className="tier-badge" style={{ backgroundColor: tier.color }}>
                        {tier.commission}
                      </div>
                      <div className="tier-name">{tier.name}</div>
                    </div>
                  ))}
                </div>
                <p className="tier-note">
                  Start with {selectedTier?.name} tier and earn {selectedTier?.commission} commission. 
                  You can upgrade as your performance grows!
                </p>
              </div>

              <div className="review-summary">
                <h3>Application Summary</h3>
                <div className="summary-item">
                  <span className="summary-label">Name:</span>
                  <span className="summary-value">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Email:</span>
                  <span className="summary-value">{formData.email}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Niche:</span>
                  <span className="summary-value">{formData.niche || 'Not specified'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Audience Size:</span>
                  <span className="summary-value">
                    {AUDIENCE_SIZES.find(s => s.value === formData.audienceSize)?.label || 'Not specified'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Tier:</span>
                  <span className="summary-value">{selectedTier?.name} ({selectedTier?.commission})</span>
                </div>
              </div>

              <div className="agreements">
                <label className="checkbox-item agreement">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                  />
                  <span>
                    I agree to the <Link href="/terms">Terms of Service</Link> and{' '}
                    <Link href="/affiliates/terms">Affiliate Program Terms</Link>
                  </span>
                </label>
                <label className="checkbox-item agreement">
                  <input
                    type="checkbox"
                    name="agreePrivacy"
                    checked={formData.agreePrivacy}
                    onChange={handleInputChange}
                  />
                  <span>
                    I agree to the <Link href="/privacy">Privacy Policy</Link>
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="form-actions">
            {step > 1 && (
              <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button type="button" className="btn-primary" onClick={handleNextStep}>
                Continue →
              </button>
            ) : (
              <button type="submit" className="btn-primary btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            )}
          </div>
        </form>

        <div className="signup-footer">
          <p>Already have an account? <Link href="/login">Sign in</Link></p>
          <p>Questions? <Link href="/contact">Contact us</Link></p>
        </div>
      </div>

      <div className="signup-benefits">
        <h2>Why Partner with CUBE?</h2>
        <div className="benefits-list">
          <div className="benefit-item">
            <div className="benefit-icon">💰</div>
            <h3>Industry-Leading Commissions</h3>
            <p>Earn up to 50% on every sale with our tiered commission structure</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🚀</div>
            <h3>High Converting Product</h3>
            <p>CUBE's enterprise automation platform has a 40%+ conversion rate</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">📊</div>
            <h3>Real-Time Analytics</h3>
            <p>Track clicks, conversions, and earnings with our advanced dashboard</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">💳</div>
            <h3>Reliable Payments</h3>
            <p>Monthly payouts via Stripe with no minimum threshold</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🎨</div>
            <h3>Marketing Resources</h3>
            <p>Access banners, email templates, and promotional content</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🤝</div>
            <h3>Dedicated Support</h3>
            <p>Personal affiliate manager for Professional tier and above</p>
          </div>
        </div>
      </div>
    </div>
  );
}
