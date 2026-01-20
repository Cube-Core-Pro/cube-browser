'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, User, Mail, Phone, Building, CreditCard,
  Wallet, Shield, Bell, Globe, Link, Copy, Check,
  Save, RefreshCw, Eye, EyeOff, AlertTriangle, Lock
} from 'lucide-react';
import './settings.css';

// ============================================
// Types
// ============================================

interface AffiliateProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  referralCode: string;
  tier: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'pending' | 'suspended';
}

interface PaymentSettings {
  method: 'bank' | 'paypal' | 'stripe' | 'crypto';
  minimumPayout: number;
  automaticPayout: boolean;
  payoutSchedule: 'weekly' | 'biweekly' | 'monthly';
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    accountType: 'checking' | 'savings';
  };
  paypalEmail?: string;
  cryptoWallet?: string;
  stripeAccountId?: string;
}

interface NotificationSettings {
  emailNewReferral: boolean;
  emailCommissionEarned: boolean;
  emailPayoutProcessed: boolean;
  emailWeeklyReport: boolean;
  emailProductUpdates: boolean;
  pushNotifications: boolean;
}

// ============================================
// Mock Data
// ============================================

const MOCK_PROFILE: AffiliateProfile = {
  id: 'AFF-001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  company: 'Digital Marketing Pro',
  website: 'https://digitalmarketingpro.com',
  referralCode: 'JOHNDOE25',
  tier: 'professional',
  status: 'active'
};

const MOCK_PAYMENT: PaymentSettings = {
  method: 'bank',
  minimumPayout: 100,
  automaticPayout: true,
  payoutSchedule: 'monthly',
  bankDetails: {
    bankName: 'Chase Bank',
    accountNumber: '****1234',
    routingNumber: '****5678',
    accountType: 'checking'
  }
};

const MOCK_NOTIFICATIONS: NotificationSettings = {
  emailNewReferral: true,
  emailCommissionEarned: true,
  emailPayoutProcessed: true,
  emailWeeklyReport: true,
  emailProductUpdates: false,
  pushNotifications: true
};

// ============================================
// Main Component
// ============================================

export default function AffiliateSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null);
  const [copied, setCopied] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProfile(MOCK_PROFILE);
      setPayment(MOCK_PAYMENT);
      setNotifications(MOCK_NOTIFICATIONS);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const copyReferralCode = () => {
    if (profile) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyReferralLink = () => {
    if (profile) {
      navigator.clipboard.writeText(`https://cubeai.tools/ref/${profile.referralCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const updateProfile = (field: keyof AffiliateProfile, value: string) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
      setHasChanges(true);
    }
  };

  const updatePayment = (field: keyof PaymentSettings, value: unknown) => {
    if (payment) {
      setPayment({ ...payment, [field]: value });
      setHasChanges(true);
    }
  };

  const updateNotification = (field: keyof NotificationSettings, value: boolean) => {
    if (notifications) {
      setNotifications({ ...notifications, [field]: value });
      setHasChanges(true);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-container">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <header className="settings-header">
        <div className="header-content">
          <div className="header-title">
            <Settings className="w-8 h-8" />
            <div>
              <h1>Affiliate Settings</h1>
              <p>Manage your account and preferences</p>
            </div>
          </div>
          <div className="header-actions">
            {hasChanges && (
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            <button className="btn-secondary" onClick={() => router.push('/affiliates/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="settings-layout">
        {/* Navigation */}
        <nav className="settings-nav">
          <button
            className={`nav-btn ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            <User className="w-5 h-5" /> Profile
          </button>
          <button
            className={`nav-btn ${activeSection === 'referral' ? 'active' : ''}`}
            onClick={() => setActiveSection('referral')}
          >
            <Link className="w-5 h-5" /> Referral Links
          </button>
          <button
            className={`nav-btn ${activeSection === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveSection('payment')}
          >
            <CreditCard className="w-5 h-5" /> Payment
          </button>
          <button
            className={`nav-btn ${activeSection === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveSection('notifications')}
          >
            <Bell className="w-5 h-5" /> Notifications
          </button>
          <button
            className={`nav-btn ${activeSection === 'security' ? 'active' : ''}`}
            onClick={() => setActiveSection('security')}
          >
            <Shield className="w-5 h-5" /> Security
          </button>
        </nav>

        {/* Content */}
        <main className="settings-content">
          {/* Profile Section */}
          {activeSection === 'profile' && profile && (
            <section className="settings-section">
              <h2><User className="w-5 h-5" /> Profile Information</h2>
              <p className="section-desc">Update your personal and business information</p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => updateProfile('firstName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => updateProfile('lastName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <Mail className="w-4 h-4" />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => updateProfile('email', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="input-with-icon">
                    <Phone className="w-4 h-4" />
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => updateProfile('phone', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Company Name</label>
                  <div className="input-with-icon">
                    <Building className="w-4 h-4" />
                    <input
                      type="text"
                      value={profile.company}
                      onChange={(e) => updateProfile('company', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Website URL</label>
                  <div className="input-with-icon">
                    <Globe className="w-4 h-4" />
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) => updateProfile('website', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="tier-info">
                <div className="tier-badge">{profile.tier}</div>
                <span>Current affiliate tier - <a href="#">Upgrade to Enterprise</a></span>
              </div>
            </section>
          )}

          {/* Referral Links Section */}
          {activeSection === 'referral' && profile && (
            <section className="settings-section">
              <h2><Link className="w-5 h-5" /> Referral Links</h2>
              <p className="section-desc">Share these links to earn commissions</p>

              <div className="referral-card">
                <div className="referral-item">
                  <label>Your Referral Code</label>
                  <div className="copy-field">
                    <code>{profile.referralCode}</code>
                    <button className="copy-btn" onClick={copyReferralCode}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="referral-item">
                  <label>Referral Link</label>
                  <div className="copy-field">
                    <code>https://cubeai.tools/ref/{profile.referralCode}</code>
                    <button className="copy-btn" onClick={copyReferralLink}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="commission-rates">
                <h3>Your Commission Rates</h3>
                <div className="rates-grid">
                  <div className="rate-item">
                    <span className="rate-value">30%</span>
                    <span className="rate-label">Level 1 (Direct)</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-value">10%</span>
                    <span className="rate-label">Level 2</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-value">5%</span>
                    <span className="rate-label">Level 3</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Payment Section */}
          {activeSection === 'payment' && payment && (
            <section className="settings-section">
              <h2><CreditCard className="w-5 h-5" /> Payment Settings</h2>
              <p className="section-desc">Configure how you receive your earnings</p>

              <div className="form-group">
                <label>Payment Method</label>
                <div className="payment-methods">
                  <button
                    className={`method-btn ${payment.method === 'bank' ? 'selected' : ''}`}
                    onClick={() => updatePayment('method', 'bank')}
                  >
                    <Building className="w-5 h-5" />
                    <span>Bank Transfer</span>
                  </button>
                  <button
                    className={`method-btn ${payment.method === 'paypal' ? 'selected' : ''}`}
                    onClick={() => updatePayment('method', 'paypal')}
                  >
                    <Wallet className="w-5 h-5" />
                    <span>PayPal</span>
                  </button>
                  <button
                    className={`method-btn ${payment.method === 'stripe' ? 'selected' : ''}`}
                    onClick={() => updatePayment('method', 'stripe')}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Stripe</span>
                  </button>
                  <button
                    className={`method-btn ${payment.method === 'crypto' ? 'selected' : ''}`}
                    onClick={() => updatePayment('method', 'crypto')}
                  >
                    <Wallet className="w-5 h-5" />
                    <span>Crypto</span>
                  </button>
                </div>
              </div>

              {payment.method === 'bank' && payment.bankDetails && (
                <div className="bank-details">
                  <h3>Bank Account Details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Bank Name</label>
                      <input type="text" value={payment.bankDetails.bankName} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Account Type</label>
                      <input type="text" value={payment.bankDetails.accountType} readOnly className="capitalize" />
                    </div>
                    <div className="form-group">
                      <label>Account Number</label>
                      <div className="masked-field">
                        <input
                          type={showBankDetails ? 'text' : 'password'}
                          value={payment.bankDetails.accountNumber}
                          readOnly
                        />
                        <button onClick={() => setShowBankDetails(!showBankDetails)}>
                          {showBankDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Routing Number</label>
                      <div className="masked-field">
                        <input
                          type={showBankDetails ? 'text' : 'password'}
                          value={payment.bankDetails.routingNumber}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                  <button className="btn-outline">Update Bank Details</button>
                </div>
              )}

              <div className="payout-settings">
                <h3>Payout Preferences</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Minimum Payout Amount</label>
                    <select
                      value={payment.minimumPayout}
                      onChange={(e) => updatePayment('minimumPayout', parseInt(e.target.value))}
                    >
                      <option value={50}>$50</option>
                      <option value={100}>$100</option>
                      <option value={250}>$250</option>
                      <option value={500}>$500</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Payout Schedule</label>
                    <select
                      value={payment.payoutSchedule}
                      onChange={(e) => updatePayment('payoutSchedule', e.target.value)}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">Automatic Payouts</span>
                    <span className="toggle-desc">Automatically process payouts when minimum is reached</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={payment.automaticPayout}
                      onChange={(e) => updatePayment('automaticPayout', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && notifications && (
            <section className="settings-section">
              <h2><Bell className="w-5 h-5" /> Notification Preferences</h2>
              <p className="section-desc">Choose what notifications you receive</p>

              <div className="notifications-list">
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">New Referral</span>
                    <span className="toggle-desc">Get notified when someone signs up using your link</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.emailNewReferral}
                      onChange={(e) => updateNotification('emailNewReferral', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">Commission Earned</span>
                    <span className="toggle-desc">Receive alerts when you earn a commission</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.emailCommissionEarned}
                      onChange={(e) => updateNotification('emailCommissionEarned', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">Payout Processed</span>
                    <span className="toggle-desc">Get notified when your payout is sent</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.emailPayoutProcessed}
                      onChange={(e) => updateNotification('emailPayoutProcessed', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">Weekly Performance Report</span>
                    <span className="toggle-desc">Receive a summary of your affiliate stats</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.emailWeeklyReport}
                      onChange={(e) => updateNotification('emailWeeklyReport', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">Product Updates</span>
                    <span className="toggle-desc">News about new features and improvements</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.emailProductUpdates}
                      onChange={(e) => updateNotification('emailProductUpdates', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <span className="toggle-label">Push Notifications</span>
                    <span className="toggle-desc">Enable browser push notifications</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={(e) => updateNotification('pushNotifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <section className="settings-section">
              <h2><Shield className="w-5 h-5" /> Security Settings</h2>
              <p className="section-desc">Protect your account with additional security</p>

              <div className="security-options">
                <div className="security-item">
                  <div className="security-icon">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="security-info">
                    <h4>Change Password</h4>
                    <p>Update your password regularly for better security</p>
                  </div>
                  <button className="btn-outline">Change</button>
                </div>

                <div className="security-item">
                  <div className="security-icon">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="security-info">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account</p>
                    <span className="security-status enabled">Enabled</span>
                  </div>
                  <button className="btn-outline">Configure</button>
                </div>

                <div className="security-item">
                  <div className="security-icon warning">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="security-info">
                    <h4>Active Sessions</h4>
                    <p>View and manage your logged-in devices</p>
                    <span className="security-status">3 active sessions</span>
                  </div>
                  <button className="btn-outline">View</button>
                </div>
              </div>

              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p>These actions are irreversible. Please proceed with caution.</p>
                <div className="danger-actions">
                  <button className="btn-danger">Delete Account</button>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
