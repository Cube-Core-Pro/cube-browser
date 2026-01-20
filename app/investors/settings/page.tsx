'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Bell,
  CreditCard,
  Shield,
  FileText,
  Key,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Save,
  Camera,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Wallet,
  Banknote,
  Lock,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import './settings.css';

interface InvestorProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  investorType: 'individual' | 'institutional' | 'accredited';
  kycStatus: 'pending' | 'verified' | 'expired';
  accreditedStatus: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'bank' | 'crypto' | 'wire';
  name: string;
  details: string;
  isDefault: boolean;
  verified: boolean;
}

interface NotificationSettings {
  emailPayouts: boolean;
  emailReports: boolean;
  emailDividends: boolean;
  emailNews: boolean;
  smsPayouts: boolean;
  smsAlerts: boolean;
  pushNotifications: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
}

const MOCK_PROFILE: InvestorProfile = {
  firstName: 'Jonathan',
  lastName: 'Wellington',
  email: 'jonathan.wellington@investment.com',
  phone: '+1 (555) 987-6543',
  address: '450 Park Avenue, Suite 2800',
  city: 'New York, NY 10022',
  country: 'United States',
  taxId: '***-**-4567',
  investorType: 'accredited',
  kycStatus: 'verified',
  accreditedStatus: true
};

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm_1',
    type: 'bank',
    name: 'Chase Private Client',
    details: 'Account ending in 8924',
    isDefault: true,
    verified: true
  },
  {
    id: 'pm_2',
    type: 'wire',
    name: 'International Wire Transfer',
    details: 'SWIFT: CHASUS33',
    isDefault: false,
    verified: true
  },
  {
    id: 'pm_3',
    type: 'crypto',
    name: 'Ethereum Wallet',
    details: '0x7a3...4f2c',
    isDefault: false,
    verified: true
  }
];

const MOCK_NOTIFICATIONS: NotificationSettings = {
  emailPayouts: true,
  emailReports: true,
  emailDividends: true,
  emailNews: false,
  smsPayouts: true,
  smsAlerts: true,
  pushNotifications: true
};

const MOCK_SECURITY: SecuritySettings = {
  twoFactorEnabled: true,
  sessionTimeout: 30,
  ipWhitelist: ['192.168.1.1', '10.0.0.1']
};

export default function InvestorSettingsPage(): React.ReactElement {
  const [profile, setProfile] = useState<InvestorProfile>(MOCK_PROFILE);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);
  const [notifications, setNotifications] = useState<NotificationSettings>(MOCK_NOTIFICATIONS);
  const [security, setSecurity] = useState<SecuritySettings>(MOCK_SECURITY);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [showTaxId, setShowTaxId] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="settings-section">
            <div className="section-header">
              <h2><User size={20} /> Personal Information</h2>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
                Save Changes
              </button>
            </div>

            <div className="profile-card">
              <div className="avatar-section">
                <div className="avatar">
                  {profile.firstName[0]}{profile.lastName[0]}
                </div>
                <button className="avatar-upload">
                  <Camera size={16} />
                  Change Photo
                </button>
              </div>
              <div className="profile-badges">
                <span className={`badge ${profile.kycStatus}`}>
                  <Shield size={12} />
                  KYC {profile.kycStatus}
                </span>
                {profile.accreditedStatus && (
                  <span className="badge accredited">
                    <Check size={12} />
                    Accredited Investor
                  </span>
                )}
                <span className="badge type">
                  {profile.investorType}
                </span>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input 
                    type="email" 
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-with-icon">
                  <Phone size={18} />
                  <input 
                    type="tel" 
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Address</label>
                <div className="input-with-icon">
                  <MapPin size={18} />
                  <input 
                    type="text" 
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>City</label>
                <input 
                  type="text" 
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <div className="input-with-icon">
                  <Globe size={18} />
                  <select 
                    value={profile.country}
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  >
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Germany</option>
                    <option>Switzerland</option>
                    <option>Singapore</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Tax ID / SSN</label>
                <div className="input-with-action">
                  <input 
                    type={showTaxId ? 'text' : 'password'} 
                    value={profile.taxId}
                    readOnly
                  />
                  <button 
                    className="action-btn"
                    onClick={() => setShowTaxId(!showTaxId)}
                  >
                    {showTaxId ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Investor Type</label>
                <select 
                  value={profile.investorType}
                  onChange={(e) => setProfile({ ...profile, investorType: e.target.value as InvestorProfile['investorType'] })}
                >
                  <option value="individual">Individual</option>
                  <option value="institutional">Institutional</option>
                  <option value="accredited">Accredited</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="settings-section">
            <div className="section-header">
              <h2><CreditCard size={20} /> Payment Methods</h2>
              <button className="btn-secondary">
                <CreditCard size={18} />
                Add Payment Method
              </button>
            </div>

            <div className="payment-methods-list">
              {paymentMethods.map((method) => (
                <div key={method.id} className={`payment-method-card ${method.isDefault ? 'default' : ''}`}>
                  <div className="method-icon">
                    {method.type === 'bank' && <Building size={24} />}
                    {method.type === 'wire' && <Banknote size={24} />}
                    {method.type === 'crypto' && <Wallet size={24} />}
                  </div>
                  <div className="method-info">
                    <span className="method-name">{method.name}</span>
                    <span className="method-details">{method.details}</span>
                  </div>
                  <div className="method-badges">
                    {method.isDefault && <span className="badge default">Default</span>}
                    {method.verified && <span className="badge verified"><Check size={12} /> Verified</span>}
                  </div>
                  <button className="btn-icon">
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="info-card">
              <AlertTriangle size={20} />
              <div>
                <h4>Payout Information</h4>
                <p>Payouts are processed on the 1st and 15th of each month. Minimum payout threshold is $100.</p>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-section">
            <div className="section-header">
              <h2><Bell size={20} /> Notification Preferences</h2>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
                Save Changes
              </button>
            </div>

            <div className="notification-groups">
              <div className="notification-group">
                <h3><Mail size={18} /> Email Notifications</h3>
                <div className="notification-options">
                  <label className="toggle-option">
                    <span>Payout Confirmations</span>
                    <input 
                      type="checkbox" 
                      checked={notifications.emailPayouts}
                      onChange={(e) => setNotifications({ ...notifications, emailPayouts: e.target.checked })}
                    />
                    <span className="toggle-switch"></span>
                  </label>
                  <label className="toggle-option">
                    <span>Monthly Reports</span>
                    <input 
                      type="checkbox" 
                      checked={notifications.emailReports}
                      onChange={(e) => setNotifications({ ...notifications, emailReports: e.target.checked })}
                    />
                    <span className="toggle-switch"></span>
                  </label>
                  <label className="toggle-option">
                    <span>Dividend Announcements</span>
                    <input 
                      type="checkbox" 
                      checked={notifications.emailDividends}
                      onChange={(e) => setNotifications({ ...notifications, emailDividends: e.target.checked })}
                    />
                    <span className="toggle-switch"></span>
                  </label>
                  <label className="toggle-option">
                    <span>Company News & Updates</span>
                    <input 
                      type="checkbox" 
                      checked={notifications.emailNews}
                      onChange={(e) => setNotifications({ ...notifications, emailNews: e.target.checked })}
                    />
                    <span className="toggle-switch"></span>
                  </label>
                </div>
              </div>

              <div className="notification-group">
                <h3><Smartphone size={18} /> SMS Notifications</h3>
                <div className="notification-options">
                  <label className="toggle-option">
                    <span>Payout Alerts</span>
                    <input 
                      type="checkbox" 
                      checked={notifications.smsPayouts}
                      onChange={(e) => setNotifications({ ...notifications, smsPayouts: e.target.checked })}
                    />
                    <span className="toggle-switch"></span>
                  </label>
                  <label className="toggle-option">
                    <span>Security Alerts</span>
                    <input 
                      type="checkbox" 
                      checked={notifications.smsAlerts}
                      onChange={(e) => setNotifications({ ...notifications, smsAlerts: e.target.checked })}
                    />
                    <span className="toggle-switch"></span>
                  </label>
                </div>
              </div>

              <div className="notification-group">
                <h3><Bell size={18} /> Push Notifications</h3>
                <div className="notification-options">
                  <label className="toggle-option">
                    <span>Enable Push Notifications</span>
                    <input 
                      type="checkbox" 
                      checked={notifications.pushNotifications}
                      onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                    />
                    <span className="toggle-switch"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="settings-section">
            <div className="section-header">
              <h2><Shield size={20} /> Security Settings</h2>
            </div>

            <div className="security-options">
              <div className="security-card">
                <div className="security-icon">
                  <Lock size={24} />
                </div>
                <div className="security-info">
                  <h4>Two-Factor Authentication</h4>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <div className={`security-status ${security.twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                  {security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </div>
                <button className="btn-secondary">
                  {security.twoFactorEnabled ? 'Manage' : 'Enable'}
                </button>
              </div>

              <div className="security-card">
                <div className="security-icon">
                  <Key size={24} />
                </div>
                <div className="security-info">
                  <h4>Change Password</h4>
                  <p>Update your password regularly for better security</p>
                </div>
                <button className="btn-secondary">
                  Change Password
                </button>
              </div>

              <div className="security-card">
                <div className="security-icon">
                  <Calendar size={24} />
                </div>
                <div className="security-info">
                  <h4>Session Timeout</h4>
                  <p>Automatically log out after inactivity</p>
                </div>
                <select 
                  value={security.sessionTimeout}
                  onChange={(e) => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) })}
                  className="timeout-select"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div className="security-card">
                <div className="security-icon">
                  <Globe size={24} />
                </div>
                <div className="security-info">
                  <h4>IP Whitelist</h4>
                  <p>Restrict access to specific IP addresses</p>
                </div>
                <button className="btn-secondary">
                  Manage IPs
                </button>
              </div>
            </div>

            <div className="session-history">
              <h3>Recent Sessions</h3>
              <div className="sessions-list">
                <div className="session-item current">
                  <div className="session-device">
                    <Globe size={18} />
                    <div>
                      <span className="device-name">Chrome on macOS</span>
                      <span className="device-location">New York, US · Current session</span>
                    </div>
                  </div>
                  <span className="session-time">Active now</span>
                </div>
                <div className="session-item">
                  <div className="session-device">
                    <Smartphone size={18} />
                    <div>
                      <span className="device-name">Safari on iPhone</span>
                      <span className="device-location">New York, US</span>
                    </div>
                  </div>
                  <span className="session-time">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="settings-section">
            <div className="section-header">
              <h2><FileText size={20} /> Legal Documents</h2>
            </div>

            <div className="documents-list">
              <a href="#" className="document-card">
                <FileText size={24} />
                <div className="document-info">
                  <span className="document-name">Investment Agreement</span>
                  <span className="document-date">Signed: January 15, 2025</span>
                </div>
                <ChevronRight size={18} />
              </a>
              <a href="#" className="document-card">
                <FileText size={24} />
                <div className="document-info">
                  <span className="document-name">Accredited Investor Certificate</span>
                  <span className="document-date">Verified: December 1, 2024</span>
                </div>
                <ChevronRight size={18} />
              </a>
              <a href="#" className="document-card">
                <FileText size={24} />
                <div className="document-info">
                  <span className="document-name">Tax Form W-9</span>
                  <span className="document-date">Submitted: January 5, 2025</span>
                </div>
                <ChevronRight size={18} />
              </a>
              <a href="#" className="document-card">
                <FileText size={24} />
                <div className="document-info">
                  <span className="document-name">Privacy Policy Agreement</span>
                  <span className="document-date">Accepted: January 1, 2025</span>
                </div>
                <ChevronRight size={18} />
              </a>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="investor-settings-page">
        <div className="loading-container">
          <RefreshCw size={32} className="spin" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="investor-settings-page">
      {/* Header */}
      <header className="settings-header">
        <div className="header-title">
          <Settings size={28} />
          <div>
            <h1>Investor Settings</h1>
            <p>Manage your account preferences and security</p>
          </div>
        </div>
      </header>

      {/* Settings Layout */}
      <div className="settings-layout">
        {/* Sidebar Navigation */}
        <nav className="settings-nav">
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            <span>Profile</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            <CreditCard size={20} />
            <span>Payment Methods</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={20} />
            <span>Notifications</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={20} />
            <span>Security</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <FileText size={20} />
            <span>Documents</span>
          </button>
        </nav>

        {/* Content Area */}
        <main className="settings-content">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
