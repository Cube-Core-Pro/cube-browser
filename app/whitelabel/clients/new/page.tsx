'use client';

import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, User, Mail, Phone, Globe,
  DollarSign, Users, Database, Check, X, Loader2,
  AlertCircle, HelpCircle, ChevronRight
} from 'lucide-react';
import '../../whitelabel.css';

// ============================================
// Types
// ============================================

interface NewClientForm {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  plan: 'professional' | 'business' | 'enterprise';
  subdomain: string;
  customDomain: string;
  userLimit: number;
  storageLimit: number;
  notes: string;
  sendWelcomeEmail: boolean;
}

interface PlanConfig {
  name: string;
  price: number;
  users: number;
  storage: number;
  features: string[];
}

// ============================================
// Main Component
// ============================================

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);

  const [form, setForm] = useState<NewClientForm>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    plan: 'business',
    subdomain: '',
    customDomain: '',
    userLimit: 50,
    storageLimit: 50,
    notes: '',
    sendWelcomeEmail: true
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NewClientForm, string>>>({});

  const plans: Record<string, PlanConfig> = {
    professional: {
      name: 'Professional',
      price: 79,
      users: 25,
      storage: 25,
      features: [
        'Up to 25 users',
        '25 GB storage',
        'Standard support',
        'Basic analytics',
        'API access'
      ]
    },
    business: {
      name: 'Business',
      price: 99,
      users: 50,
      storage: 50,
      features: [
        'Up to 50 users',
        '50 GB storage',
        'Priority support',
        'Advanced analytics',
        'Full API access',
        'Custom branding'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: 299,
      users: 200,
      storage: 200,
      features: [
        'Up to 200 users',
        '200 GB storage',
        'Dedicated support',
        'Full analytics suite',
        'Unlimited API access',
        'Custom branding',
        'SSO integration',
        'SLA guarantee'
      ]
    }
  };

  const updateForm = (updates: Partial<NewClientForm>) => {
    setForm({ ...form, ...updates });
    // Clear errors when field is updated
    const keys = Object.keys(updates) as (keyof NewClientForm)[];
    const newErrors = { ...errors };
    keys.forEach(key => delete newErrors[key]);
    setErrors(newErrors);
  };

  const generateSubdomain = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
  };

  const checkSubdomain = async () => {
    if (!form.subdomain) return;
    
    setCheckingSubdomain(true);
    try {
      const available = await invoke<boolean>('check_subdomain_availability', {
        subdomain: form.subdomain
      });
      setSubdomainAvailable(available);
    } catch (error) {
      // Mock check for development
      const reserved = ['admin', 'api', 'www', 'app', 'mail', 'support'];
      setSubdomainAvailable(!reserved.includes(form.subdomain.toLowerCase()));
    } finally {
      setCheckingSubdomain(false);
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof NewClientForm, string>> = {};
    
    if (!form.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!form.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }
    
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof NewClientForm, string>> = {};
    
    if (!form.subdomain.trim()) {
      newErrors.subdomain = 'Subdomain is required';
    } else if (!/^[a-z0-9-]+$/.test(form.subdomain)) {
      newErrors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
    } else if (subdomainAvailable === false) {
      newErrors.subdomain = 'This subdomain is not available';
    }
    
    if (form.customDomain && !/^[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/.test(form.customDomain.toLowerCase())) {
      newErrors.customDomain = 'Please enter a valid domain';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      // Auto-generate subdomain from company name if not set
      if (!form.subdomain) {
        const subdomain = generateSubdomain(form.companyName);
        updateForm({ subdomain });
      }
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const planConfig = plans[form.plan];
      
      await invoke('tenant_provision', {
        config: {
          companyName: form.companyName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          plan: form.plan,
          subdomain: form.subdomain,
          customDomain: form.customDomain || null,
          userLimit: form.userLimit,
          storageLimitGb: form.storageLimit,
          notes: form.notes,
          sendWelcomeEmail: form.sendWelcomeEmail
        }
      });

      router.push('/whitelabel/clients?created=true');
    } catch (error) {
      console.error('Failed to create client:', error);
      alert('Failed to create client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans[form.plan];

  return (
    <div className="new-client-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => router.push('/whitelabel/clients')}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="header-title">
            <Building2 className="w-6 h-6" />
            <div>
              <h1>Add New Client</h1>
              <p>Provision a new white-label tenant</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="progress-steps">
        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-number">
            {step > 1 ? <Check className="w-4 h-4" /> : '1'}
          </div>
          <span>Company Info</span>
        </div>
        <div className="step-connector" />
        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-number">
            {step > 2 ? <Check className="w-4 h-4" /> : '2'}
          </div>
          <span>Domain Setup</span>
        </div>
        <div className="step-connector" />
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span>Review & Create</span>
        </div>
      </div>

      <div className="form-container">
        {/* Step 1: Company Information */}
        {step === 1 && (
          <div className="form-step">
            <h2>Company Information</h2>
            <p className="step-description">Enter the basic information about your new client.</p>

            <div className="form-grid">
              <div className="form-group">
                <label>Company Name *</label>
                <div className="input-with-icon">
                  <Building2 className="w-4 h-4" />
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => updateForm({ companyName: e.target.value })}
                    placeholder="Acme Corporation"
                    className={errors.companyName ? 'error' : ''}
                  />
                </div>
                {errors.companyName && (
                  <span className="error-message">
                    <AlertCircle className="w-3 h-3" />
                    {errors.companyName}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Contact Name *</label>
                <div className="input-with-icon">
                  <User className="w-4 h-4" />
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => updateForm({ contactName: e.target.value })}
                    placeholder="John Smith"
                    className={errors.contactName ? 'error' : ''}
                  />
                </div>
                {errors.contactName && (
                  <span className="error-message">
                    <AlertCircle className="w-3 h-3" />
                    {errors.contactName}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <div className="input-with-icon">
                  <Mail className="w-4 h-4" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                    placeholder="john@acme.com"
                    className={errors.email ? 'error' : ''}
                  />
                </div>
                {errors.email && (
                  <span className="error-message">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-with-icon">
                  <Phone className="w-4 h-4" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <div className="plan-selection">
              <h3>Select Plan</h3>
              <div className="plans-grid">
                {Object.entries(plans).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`plan-card ${form.plan === key ? 'selected' : ''}`}
                    onClick={() => updateForm({ 
                      plan: key as NewClientForm['plan'],
                      userLimit: plan.users,
                      storageLimit: plan.storage
                    })}
                  >
                    <div className="plan-header">
                      <h4>{plan.name}</h4>
                      <div className="plan-price">
                        <span className="price">${plan.price}</span>
                        <span className="period">/month</span>
                      </div>
                    </div>
                    <ul className="plan-features">
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>
                          <Check className="w-4 h-4" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {form.plan === key && (
                      <div className="selected-badge">
                        <Check className="w-4 h-4" />
                        Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Domain Setup */}
        {step === 2 && (
          <div className="form-step">
            <h2>Domain Setup</h2>
            <p className="step-description">Configure the subdomain and optional custom domain for your client.</p>

            <div className="form-group">
              <label>Subdomain *</label>
              <div className="subdomain-input">
                <input
                  type="text"
                  value={form.subdomain}
                  onChange={(e) => {
                    updateForm({ subdomain: e.target.value.toLowerCase() });
                    setSubdomainAvailable(null);
                  }}
                  onBlur={checkSubdomain}
                  placeholder="acme"
                  className={errors.subdomain ? 'error' : ''}
                />
                <span className="domain-suffix">.cubeai.tools</span>
                {checkingSubdomain && <Loader2 className="w-4 h-4 animate-spin checking" />}
                {subdomainAvailable === true && <Check className="w-4 h-4 available" />}
                {subdomainAvailable === false && <X className="w-4 h-4 unavailable" />}
              </div>
              {errors.subdomain && (
                <span className="error-message">
                  <AlertCircle className="w-3 h-3" />
                  {errors.subdomain}
                </span>
              )}
              <span className="help-text">
                This will be your client's portal URL: https://{form.subdomain || 'subdomain'}.cubeai.tools
              </span>
            </div>

            <div className="form-group">
              <label>
                Custom Domain (Optional)
                <span className="badge-optional">Optional</span>
              </label>
              <div className="input-with-icon">
                <Globe className="w-4 h-4" />
                <input
                  type="text"
                  value={form.customDomain}
                  onChange={(e) => updateForm({ customDomain: e.target.value.toLowerCase() })}
                  placeholder="app.acme.com"
                  className={errors.customDomain ? 'error' : ''}
                />
              </div>
              {errors.customDomain && (
                <span className="error-message">
                  <AlertCircle className="w-3 h-3" />
                  {errors.customDomain}
                </span>
              )}
              <span className="help-text">
                DNS configuration instructions will be sent after provisioning.
              </span>
            </div>

            <div className="limits-section">
              <h3>Resource Limits</h3>
              <div className="limits-grid">
                <div className="form-group">
                  <label>
                    <Users className="w-4 h-4" />
                    User Limit
                  </label>
                  <input
                    type="number"
                    value={form.userLimit}
                    onChange={(e) => updateForm({ userLimit: parseInt(e.target.value) || 0 })}
                    min={1}
                    max={selectedPlan.users * 2}
                  />
                  <span className="help-text">Max for plan: {selectedPlan.users}</span>
                </div>

                <div className="form-group">
                  <label>
                    <Database className="w-4 h-4" />
                    Storage Limit (GB)
                  </label>
                  <input
                    type="number"
                    value={form.storageLimit}
                    onChange={(e) => updateForm({ storageLimit: parseInt(e.target.value) || 0 })}
                    min={1}
                    max={selectedPlan.storage * 2}
                  />
                  <span className="help-text">Max for plan: {selectedPlan.storage} GB</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Create */}
        {step === 3 && (
          <div className="form-step">
            <h2>Review & Create</h2>
            <p className="step-description">Review the client details before provisioning.</p>

            <div className="review-sections">
              <div className="review-section">
                <h3>Company Information</h3>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="label">Company Name</span>
                    <span className="value">{form.companyName}</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Contact Name</span>
                    <span className="value">{form.contactName}</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Email</span>
                    <span className="value">{form.email}</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Phone</span>
                    <span className="value">{form.phone || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h3>Plan Details</h3>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="label">Plan</span>
                    <span className="value plan-badge">{selectedPlan.name}</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Monthly Price</span>
                    <span className="value">${selectedPlan.price}/month</span>
                  </div>
                  <div className="review-item">
                    <span className="label">User Limit</span>
                    <span className="value">{form.userLimit} users</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Storage Limit</span>
                    <span className="value">{form.storageLimit} GB</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h3>Domain Configuration</h3>
                <div className="review-grid">
                  <div className="review-item full">
                    <span className="label">Portal URL</span>
                    <span className="value domain">https://{form.subdomain}.cubeai.tools</span>
                  </div>
                  {form.customDomain && (
                    <div className="review-item full">
                      <span className="label">Custom Domain</span>
                      <span className="value domain">https://{form.customDomain}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.sendWelcomeEmail}
                    onChange={(e) => updateForm({ sendWelcomeEmail: e.target.checked })}
                  />
                  <span className="checkmark"></span>
                  Send welcome email with login credentials
                </label>
              </div>

              <div className="form-group">
                <label>Internal Notes (Optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm({ notes: e.target.value })}
                  placeholder="Add any notes about this client..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          {step > 1 && (
            <button className="btn-secondary" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div className="spacer" />
          {step < 3 ? (
            <button className="btn-primary" onClick={handleNext}>
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Client
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
