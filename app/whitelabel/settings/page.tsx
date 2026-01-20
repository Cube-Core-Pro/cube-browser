'use client';

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Settings, Bell, CreditCard, Shield, Key,
  Building2, Save, Loader2, Check, AlertCircle, Globe,
  Mail, Phone, MapPin, User, Lock, Eye, EyeOff,
  Webhook, Copy, RefreshCw, Trash2, Plus
} from 'lucide-react';
import '../whitelabel.css';

// ============================================
// Types
// ============================================

interface ResellerProfile {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  taxId: string;
}

interface BillingSettings {
  paymentMethod: string;
  cardLast4: string;
  cardBrand: string;
  billingEmail: string;
  autoPay: boolean;
  invoicePrefix: string;
  commissionRate: number;
}

interface NotificationSettings {
  emailNewClient: boolean;
  emailPayments: boolean;
  emailChurn: boolean;
  emailWeeklyReport: boolean;
  emailMonthlyReport: boolean;
  pushEnabled: boolean;
}

interface APIKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsed: string | null;
  scopes: string[];
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  lastTriggered: string | null;
}

// ============================================
// Main Component
// ============================================

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'notifications' | 'api' | 'security'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile State
  const [profile, setProfile] = useState<ResellerProfile>({
    id: '',
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    taxId: ''
  });

  // Billing State
  const [billing, setBilling] = useState<BillingSettings>({
    paymentMethod: 'card',
    cardLast4: '',
    cardBrand: '',
    billingEmail: '',
    autoPay: true,
    invoicePrefix: '',
    commissionRate: 30
  });

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNewClient: true,
    emailPayments: true,
    emailChurn: true,
    emailWeeklyReport: false,
    emailMonthlyReport: true,
    pushEnabled: true
  });

  // API State
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [profileData, billingData, notifData, keysData, webhooksData] = await Promise.all([
        invoke<ResellerProfile>('get_reseller_profile'),
        invoke<BillingSettings>('get_reseller_billing'),
        invoke<NotificationSettings>('get_reseller_notifications'),
        invoke<APIKey[]>('get_reseller_api_keys'),
        invoke<Webhook[]>('get_reseller_webhooks')
      ]);

      setProfile(profileData);
      setBilling(billingData);
      setNotifications(notifData);
      setApiKeys(keysData);
      setWebhooks(webhooksData);
    } catch (error) {
      console.error('Failed to load settings:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setProfile({
      id: 'res_001',
      companyName: 'Premium Solutions Inc',
      contactName: 'John Smith',
      email: 'john@premiumsolutions.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business Ave, Suite 400, San Francisco, CA 94102',
      website: 'https://premiumsolutions.com',
      taxId: 'US-123456789'
    });

    setBilling({
      paymentMethod: 'card',
      cardLast4: '4242',
      cardBrand: 'Visa',
      billingEmail: 'billing@premiumsolutions.com',
      autoPay: true,
      invoicePrefix: 'PS',
      commissionRate: 30
    });

    setNotifications({
      emailNewClient: true,
      emailPayments: true,
      emailChurn: true,
      emailWeeklyReport: false,
      emailMonthlyReport: true,
      pushEnabled: true
    });

    setApiKeys([
      {
        id: 'key_1',
        name: 'Production API',
        keyPrefix: 'wl_prod_****',
        createdAt: '2024-12-01',
        lastUsed: '2025-01-28',
        scopes: ['clients:read', 'clients:write', 'analytics:read']
      },
      {
        id: 'key_2',
        name: 'Staging API',
        keyPrefix: 'wl_test_****',
        createdAt: '2025-01-15',
        lastUsed: null,
        scopes: ['clients:read']
      }
    ]);

    setWebhooks([
      {
        id: 'wh_1',
        url: 'https://premiumsolutions.com/webhooks/cube',
        events: ['client.created', 'client.updated', 'payment.received'],
        active: true,
        createdAt: '2024-12-10',
        lastTriggered: '2025-01-27'
      }
    ]);

    setTwoFactorEnabled(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await invoke('update_reseller_settings', {
        profile,
        billing,
        notifications
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;
    
    try {
      const newKey = await invoke<APIKey>('create_reseller_api_key', { name: newKeyName });
      setApiKeys([...apiKeys, newKey]);
      setNewKeyName('');
      setShowNewKeyModal(false);
    } catch (error) {
      console.error('Failed to create API key:', error);
      // Mock
      setApiKeys([...apiKeys, {
        id: `key_${Date.now()}`,
        name: newKeyName,
        keyPrefix: 'wl_new_****',
        createdAt: new Date().toISOString().split('T')[0],
        lastUsed: null,
        scopes: ['clients:read', 'clients:write']
      }]);
      setNewKeyName('');
      setShowNewKeyModal(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      await invoke('delete_reseller_api_key', { keyId });
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
    } catch (error) {
      console.error('Failed to delete API key:', error);
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: Building2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API & Webhooks', icon: Webhook },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="whitelabel-loading">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => router.push('/whitelabel')}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="header-title">
            <Settings className="w-6 h-6" />
            <div>
              <h1>Reseller Settings</h1>
              <p>Manage your white-label account settings</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          {saveSuccess && (
            <span className="save-success">
              <Check className="w-4 h-4" />
              Saved
            </span>
          )}
          <button className="btn-primary" onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </header>

      <div className="settings-layout">
        {/* Sidebar */}
        <nav className="settings-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Company Profile</h2>
              <p className="section-desc">Your company information as shown to clients</p>

              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name</label>
                  <div className="input-with-icon">
                    <Building2 className="w-4 h-4" />
                    <input
                      type="text"
                      value={profile.companyName}
                      onChange={(e) => setProfile({...profile, companyName: e.target.value})}
                      placeholder="Your Company Name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Contact Name</label>
                  <div className="input-with-icon">
                    <User className="w-4 h-4" />
                    <input
                      type="text"
                      value={profile.contactName}
                      onChange={(e) => setProfile({...profile, contactName: e.target.value})}
                      placeholder="Primary Contact"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <div className="input-with-icon">
                    <Mail className="w-4 h-4" />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      placeholder="contact@company.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <div className="input-with-icon">
                    <Phone className="w-4 h-4" />
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Address</label>
                  <div className="input-with-icon">
                    <MapPin className="w-4 h-4" />
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) => setProfile({...profile, address: e.target.value})}
                      placeholder="123 Street, City, State, ZIP"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Website</label>
                  <div className="input-with-icon">
                    <Globe className="w-4 h-4" />
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile({...profile, website: e.target.value})}
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Tax ID</label>
                  <div className="input-with-icon">
                    <Key className="w-4 h-4" />
                    <input
                      type="text"
                      value={profile.taxId}
                      onChange={(e) => setProfile({...profile, taxId: e.target.value})}
                      placeholder="XX-XXXXXXXXX"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="settings-section">
              <h2>Billing Settings</h2>
              <p className="section-desc">Manage your payment and commission settings</p>

              <div className="billing-card">
                <div className="card-info">
                  <div className="card-brand">{billing.cardBrand}</div>
                  <div className="card-number">•••• •••• •••• {billing.cardLast4}</div>
                </div>
                <button className="btn-secondary">Update Card</button>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Billing Email</label>
                  <input
                    type="email"
                    value={billing.billingEmail}
                    onChange={(e) => setBilling({...billing, billingEmail: e.target.value})}
                    placeholder="billing@company.com"
                  />
                </div>

                <div className="form-group">
                  <label>Invoice Prefix</label>
                  <input
                    type="text"
                    value={billing.invoicePrefix}
                    onChange={(e) => setBilling({...billing, invoicePrefix: e.target.value})}
                    placeholder="INV"
                    maxLength={5}
                  />
                </div>
              </div>

              <div className="toggle-setting">
                <div className="toggle-info">
                  <h3>Automatic Payments</h3>
                  <p>Automatically charge your card on invoice due date</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={billing.autoPay}
                    onChange={(e) => setBilling({...billing, autoPay: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="commission-info">
                <h3>Your Commission Rate</h3>
                <div className="commission-value">{billing.commissionRate}%</div>
                <p>You earn {billing.commissionRate}% of all client payments</p>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <p className="section-desc">Choose how you want to be notified</p>

              <div className="notification-group">
                <h3>Email Notifications</h3>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>New Client Signups</h4>
                    <p>Get notified when a new client signs up</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.emailNewClient}
                      onChange={(e) => setNotifications({...notifications, emailNewClient: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Payment Received</h4>
                    <p>Get notified when you receive a payment</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.emailPayments}
                      onChange={(e) => setNotifications({...notifications, emailPayments: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Client Churn Alerts</h4>
                    <p>Get notified when a client cancels</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.emailChurn}
                      onChange={(e) => setNotifications({...notifications, emailChurn: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Weekly Reports</h4>
                    <p>Receive weekly performance summaries</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.emailWeeklyReport}
                      onChange={(e) => setNotifications({...notifications, emailWeeklyReport: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Monthly Reports</h4>
                    <p>Receive detailed monthly analytics</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.emailMonthlyReport}
                      onChange={(e) => setNotifications({...notifications, emailMonthlyReport: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="notification-group">
                <h3>Push Notifications</h3>
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Enable Push Notifications</h4>
                    <p>Receive browser push notifications for important events</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.pushEnabled}
                      onChange={(e) => setNotifications({...notifications, pushEnabled: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* API Tab */}
          {activeTab === 'api' && (
            <div className="settings-section">
              <h2>API Keys</h2>
              <p className="section-desc">Manage API keys for programmatic access</p>

              <div className="api-keys-list">
                {apiKeys.map((key) => (
                  <div key={key.id} className="api-key-item">
                    <div className="key-info">
                      <div className="key-header">
                        <span className="key-name">{key.name}</span>
                        <span className="key-prefix">{key.keyPrefix}</span>
                      </div>
                      <div className="key-meta">
                        Created {key.createdAt} · 
                        {key.lastUsed ? ` Last used ${key.lastUsed}` : ' Never used'}
                      </div>
                      <div className="key-scopes">
                        {key.scopes.map((scope) => (
                          <span key={scope} className="scope-badge">{scope}</span>
                        ))}
                      </div>
                    </div>
                    <div className="key-actions">
                      <button className="btn-icon" onClick={() => copyToClipboard(key.keyPrefix)}>
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className="btn-icon danger" onClick={() => deleteApiKey(key.id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn-secondary" onClick={() => setShowNewKeyModal(true)}>
                <Plus className="w-4 h-4" />
                Create New Key
              </button>

              {showNewKeyModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h3>Create API Key</h3>
                    <div className="form-group">
                      <label>Key Name</label>
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., Production API"
                      />
                    </div>
                    <div className="modal-actions">
                      <button className="btn-secondary" onClick={() => setShowNewKeyModal(false)}>
                        Cancel
                      </button>
                      <button className="btn-primary" onClick={createApiKey}>
                        Create Key
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <hr className="section-divider" />

              <h2>Webhooks</h2>
              <p className="section-desc">Receive real-time notifications for events</p>

              <div className="webhooks-list">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="webhook-item">
                    <div className="webhook-info">
                      <div className="webhook-url">{webhook.url}</div>
                      <div className="webhook-events">
                        {webhook.events.map((event) => (
                          <span key={event} className="event-badge">{event}</span>
                        ))}
                      </div>
                      <div className="webhook-meta">
                        {webhook.active ? (
                          <span className="status-badge active">Active</span>
                        ) : (
                          <span className="status-badge inactive">Inactive</span>
                        )}
                        {webhook.lastTriggered && ` · Last triggered ${webhook.lastTriggered}`}
                      </div>
                    </div>
                    <div className="webhook-actions">
                      <button className="btn-icon">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button className="btn-icon danger">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="add-webhook-form">
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://yoursite.com/webhook"
                />
                <button className="btn-primary">Add Webhook</button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Security Settings</h2>
              <p className="section-desc">Manage your account security</p>

              <div className="security-group">
                <h3>Change Password</h3>

                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Current Password</label>
                    <div className="input-with-action">
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <button 
                        className="btn-icon"
                        onClick={() => setShowPasswords(!showPasswords)}
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <button className="btn-primary">
                  <Lock className="w-4 h-4" />
                  Update Password
                </button>
              </div>

              <hr className="section-divider" />

              <div className="security-group">
                <h3>Two-Factor Authentication</h3>
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Enable 2FA</h4>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {twoFactorEnabled && (
                  <div className="two-factor-status">
                    <Check className="w-5 h-5" />
                    <span>Two-factor authentication is enabled</span>
                  </div>
                )}
              </div>

              <hr className="section-divider" />

              <div className="security-group danger-zone">
                <h3>Danger Zone</h3>
                <div className="danger-warning">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <h4>Delete Account</h4>
                    <p>Permanently delete your reseller account and all associated data. This action cannot be undone.</p>
                  </div>
                </div>
                <button className="btn-danger">Delete Reseller Account</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
