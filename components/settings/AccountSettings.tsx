'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('AccountSettings');

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  User,
  CreditCard,
  Bell,
  Camera,
  Save,
  Upload,
  Trash2,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { 
  useAccountStore, 
  COUNTRY_OPTIONS, 
  TIMEZONE_OPTIONS, 
  DATE_FORMAT_OPTIONS,
  BillingAddress,
  UserProfile,
  CommunicationPreferences,
} from '@/stores/accountStore';
import './AccountSettings.css';

// ============================================================================
// Types
// ============================================================================

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AccountSettingsProps {
  onSave?: () => void;
  onCancel?: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  onSave,
  onCancel,
  className = '',
}) => {
  // Store
  const {
    profile,
    billingAddress,
    billingHistory,
    communicationPreferences,
    isLoading,
    error,
    updateProfile,
    setAvatar,
    removeAvatar,
    setBillingAddress,
    updateCommunicationPreferences,
    saveAccount,
    getInitials,
    getAvatarUrl,
  } = useAccountStore();

  // Local State
  const [localProfile, setLocalProfile] = useState<Partial<UserProfile>>({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    displayName: profile?.displayName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    timezone: profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: profile?.locale || 'en-US',
    dateFormat: profile?.dateFormat || 'MM/DD/YYYY',
  });

  const [localBilling, setLocalBilling] = useState<Partial<BillingAddress>>({
    firstName: billingAddress?.firstName || '',
    lastName: billingAddress?.lastName || '',
    company: billingAddress?.company || '',
    addressLine1: billingAddress?.addressLine1 || '',
    addressLine2: billingAddress?.addressLine2 || '',
    city: billingAddress?.city || '',
    state: billingAddress?.state || '',
    postalCode: billingAddress?.postalCode || '',
    country: billingAddress?.country || 'US',
    phone: billingAddress?.phone || '',
    vatNumber: billingAddress?.vatNumber || '',
  });

  const [localComms, setLocalComms] = useState<CommunicationPreferences>({
    ...communicationPreferences,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingBilling, setEditingBilling] = useState(!billingAddress);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast notification helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Update local state when store changes
  useEffect(() => {
    if (profile) {
      setLocalProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        email: profile.email,
        phone: profile.phone,
        timezone: profile.timezone,
        locale: profile.locale,
        dateFormat: profile.dateFormat,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (billingAddress) {
      setLocalBilling({
        firstName: billingAddress.firstName,
        lastName: billingAddress.lastName,
        company: billingAddress.company,
        addressLine1: billingAddress.addressLine1,
        addressLine2: billingAddress.addressLine2,
        city: billingAddress.city,
        state: billingAddress.state,
        postalCode: billingAddress.postalCode,
        country: billingAddress.country,
        phone: billingAddress.phone,
        vatNumber: billingAddress.vatNumber,
      });
    }
  }, [billingAddress]);

  useEffect(() => {
    setLocalComms({ ...communicationPreferences });
  }, [communicationPreferences]);

  // Handlers
  const handleProfileChange = useCallback((field: keyof UserProfile, value: string) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  const handleBillingChange = useCallback((field: keyof BillingAddress, value: string) => {
    setLocalBilling(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  const handleCommsChange = useCallback((field: keyof CommunicationPreferences, value: boolean) => {
    setLocalComms(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  const handleAvatarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatar(result, 'base64');
      setHasChanges(true);
      showToast('success', 'Avatar updated successfully');
    };
    reader.readAsDataURL(file);
  }, [setAvatar, showToast]);

  const handleRemoveAvatar = useCallback(() => {
    removeAvatar();
    setHasChanges(true);
  }, [removeAvatar]);

  const handleSave = useCallback(async () => {
    try {
      await updateProfile(localProfile);
      
      if (editingBilling) {
        const fullBilling: BillingAddress = {
          firstName: localBilling.firstName || '',
          lastName: localBilling.lastName || '',
          company: localBilling.company,
          addressLine1: localBilling.addressLine1 || '',
          addressLine2: localBilling.addressLine2,
          city: localBilling.city || '',
          state: localBilling.state || '',
          postalCode: localBilling.postalCode || '',
          country: localBilling.country || 'US',
          phone: localBilling.phone,
          vatNumber: localBilling.vatNumber,
        };
        setBillingAddress(fullBilling);
      }
      
      updateCommunicationPreferences(localComms);
      await saveAccount();
      
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      if (onSave) onSave();
    } catch (err) {
      log.error('Failed to save account:', err);
    }
  }, [localProfile, localBilling, localComms, editingBilling, updateProfile, setBillingAddress, updateCommunicationPreferences, saveAccount, onSave]);

  const handleCancel = useCallback(() => {
    if (profile) {
      setLocalProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        email: profile.email,
        phone: profile.phone,
        timezone: profile.timezone,
        locale: profile.locale,
        dateFormat: profile.dateFormat,
      });
    }
    
    if (billingAddress) {
      setLocalBilling({ ...billingAddress });
    }
    
    setLocalComms({ ...communicationPreferences });
    setHasChanges(false);
    
    if (onCancel) onCancel();
  }, [profile, billingAddress, communicationPreferences, onCancel]);

  const avatarUrl = getAvatarUrl();
  const initials = getInitials();

  return (
    <div className={`account-settings ${className}`}>
      {/* Profile Section */}
      <section className="profile-section">
        <div className="section-header">
          <h3><User size={18} /> Profile Information</h3>
          <span className="section-badge">Personal</span>
        </div>

        {/* Avatar */}
        <div className="avatar-section">
          <div className="avatar-container">
            <div className="avatar-preview">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profile" />
              ) : (
                initials
              )}
            </div>
            <button 
              className="avatar-edit-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Change avatar"
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden-input"
              title="Upload profile photo"
            />
          </div>
          <div className="avatar-controls">
            <h4>Profile Photo</h4>
            <p>This photo will be displayed in communications and chat modules.</p>
            <div className="avatar-buttons">
              <button 
                className="avatar-btn primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} /> Upload Photo
              </button>
              {avatarUrl && (
                <button 
                  className="avatar-btn secondary"
                  onClick={handleRemoveAvatar}
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="form-grid">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              value={localProfile.firstName || ''}
              onChange={(e) => handleProfileChange('firstName', e.target.value)}
              placeholder="Enter your first name"
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              value={localProfile.lastName || ''}
              onChange={(e) => handleProfileChange('lastName', e.target.value)}
              placeholder="Enter your last name"
            />
          </div>
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              value={localProfile.displayName || ''}
              onChange={(e) => handleProfileChange('displayName', e.target.value)}
              placeholder="How you want to be called"
            />
            <span className="input-hint">This name will be shown in chats and comments</span>
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={localProfile.email || ''}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={localProfile.phone || ''}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="form-group">
            <label>Timezone</label>
            <select
              value={localProfile.timezone || ''}
              onChange={(e) => handleProfileChange('timezone', e.target.value)}
              title="Select your timezone"
            >
              {TIMEZONE_OPTIONS.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Date Format</label>
            <select
              value={localProfile.dateFormat || 'MM/DD/YYYY'}
              onChange={(e) => handleProfileChange('dateFormat', e.target.value)}
              title="Select date format"
            >
              {DATE_FORMAT_OPTIONS.map(df => (
                <option key={df.value} value={df.value}>{df.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Locale</label>
            <select
              value={localProfile.locale || 'en-US'}
              onChange={(e) => handleProfileChange('locale', e.target.value)}
              title="Select your locale"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Español (España)</option>
              <option value="es-MX">Español (México)</option>
              <option value="fr-FR">Français</option>
              <option value="de-DE">Deutsch</option>
              <option value="it-IT">Italiano</option>
              <option value="pt-BR">Português (Brasil)</option>
              <option value="ja-JP">日本語</option>
              <option value="ko-KR">한국어</option>
              <option value="zh-CN">中文 (简体)</option>
              <option value="zh-TW">中文 (繁體)</option>
              <option value="ar-SA">العربية</option>
              <option value="ru-RU">Русский</option>
              <option value="tr-TR">Türkçe</option>
            </select>
          </div>
        </div>
      </section>

      {/* Billing Address Section */}
      <section className="billing-section">
        <div className="section-header">
          <h3><CreditCard size={18} /> Billing Address</h3>
          {billingAddress && !editingBilling && (
            <button 
              className="avatar-btn secondary"
              onClick={() => setEditingBilling(true)}
            >
              Edit
            </button>
          )}
        </div>

        {billingAddress && !editingBilling ? (
          <div className="address-preview">
            {localBilling.company && <p className="company">{localBilling.company}</p>}
            <p>
              {localBilling.firstName} {localBilling.lastName}<br />
              {localBilling.addressLine1}<br />
              {localBilling.addressLine2 && <>{localBilling.addressLine2}<br /></>}
              {localBilling.city}, {localBilling.state} {localBilling.postalCode}<br />
              {COUNTRY_OPTIONS.find(c => c.code === localBilling.country)?.name || localBilling.country}
            </p>
            {localBilling.vatNumber && (
              <p className="vat-display">
                VAT: {localBilling.vatNumber}
              </p>
            )}
          </div>
        ) : (
          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={localBilling.firstName || ''}
                onChange={(e) => handleBillingChange('firstName', e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={localBilling.lastName || ''}
                onChange={(e) => handleBillingChange('lastName', e.target.value)}
                placeholder="Last name"
              />
            </div>
            <div className="form-group full-width">
              <label>Company (Optional)</label>
              <input
                type="text"
                value={localBilling.company || ''}
                onChange={(e) => handleBillingChange('company', e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div className="form-group full-width">
              <label>Address Line 1</label>
              <input
                type="text"
                value={localBilling.addressLine1 || ''}
                onChange={(e) => handleBillingChange('addressLine1', e.target.value)}
                placeholder="Street address"
              />
            </div>
            <div className="form-group full-width">
              <label>Address Line 2 (Optional)</label>
              <input
                type="text"
                value={localBilling.addressLine2 || ''}
                onChange={(e) => handleBillingChange('addressLine2', e.target.value)}
                placeholder="Apartment, suite, etc."
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={localBilling.city || ''}
                onChange={(e) => handleBillingChange('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="form-group">
              <label>State / Province</label>
              <input
                type="text"
                value={localBilling.state || ''}
                onChange={(e) => handleBillingChange('state', e.target.value)}
                placeholder="State or province"
              />
            </div>
            <div className="form-group">
              <label>Postal Code</label>
              <input
                type="text"
                value={localBilling.postalCode || ''}
                onChange={(e) => handleBillingChange('postalCode', e.target.value)}
                placeholder="Postal code"
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <select
                value={localBilling.country || 'US'}
                onChange={(e) => handleBillingChange('country', e.target.value)}
                title="Select your country"
              >
                {COUNTRY_OPTIONS.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Phone (Optional)</label>
              <input
                type="tel"
                value={localBilling.phone || ''}
                onChange={(e) => handleBillingChange('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="form-group">
              <label>VAT Number (Optional)</label>
              <input
                type="text"
                value={localBilling.vatNumber || ''}
                onChange={(e) => handleBillingChange('vatNumber', e.target.value)}
                placeholder="VAT/Tax ID"
              />
            </div>
          </div>
        )}
      </section>

      {/* Communication Preferences Section */}
      <section className="communication-section">
        <div className="section-header">
          <h3><Bell size={18} /> Communication Preferences</h3>
        </div>

        <div className="preference-list">
          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-label">Email Notifications</span>
              <span className="preference-description">Receive important updates via email</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localComms.emailNotifications}
                onChange={(e) => handleCommsChange('emailNotifications', e.target.checked)}
                title="Toggle email notifications"
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-label">Product Updates</span>
              <span className="preference-description">New features and improvements</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localComms.productUpdates}
                onChange={(e) => handleCommsChange('productUpdates', e.target.checked)}
                title="Toggle product updates"
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-label">Marketing Emails</span>
              <span className="preference-description">Promotions, offers, and tips</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localComms.marketingEmails}
                onChange={(e) => handleCommsChange('marketingEmails', e.target.checked)}
                title="Toggle marketing emails"
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-label">Security Alerts</span>
              <span className="preference-description">Important security notifications</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localComms.securityAlerts}
                onChange={(e) => handleCommsChange('securityAlerts', e.target.checked)}
                title="Toggle security alerts"
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-label">Weekly Digest</span>
              <span className="preference-description">Summary of your weekly activity</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localComms.weeklyDigest}
                onChange={(e) => handleCommsChange('weeklyDigest', e.target.checked)}
                title="Toggle weekly digest"
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-label">Push Notifications</span>
              <span className="preference-description">Desktop and mobile push alerts</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localComms.pushNotifications}
                onChange={(e) => handleCommsChange('pushNotifications', e.target.checked)}
                title="Toggle push notifications"
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </section>

      {/* Billing History Section */}
      {billingHistory.length > 0 && (
        <section className="billing-history">
          <div className="billing-history-header">
            <h3><FileText size={18} /> Billing History</h3>
          </div>
          <table className="billing-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>{item.description}</td>
                  <td>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: item.currency,
                    }).format(item.amount / 100)}
                  </td>
                  <td>
                    <span className={`status-pill ${item.status}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {item.invoiceUrl && (
                      <a href={item.invoiceUrl} className="invoice-link" target="_blank" rel="noopener noreferrer">
                        <Download size={14} /> PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Save Section */}
      <div className="save-section">
        {saveSuccess && (
          <span className="save-success-message">
            <CheckCircle size={16} /> Changes saved successfully
          </span>
        )}
        {error && (
          <span className="save-error-message">
            <AlertCircle size={16} /> {error}
          </span>
        )}
        <button className="cancel-btn" onClick={handleCancel} disabled={isLoading}>
          Cancel
        </button>
        <button 
          className="save-btn" 
          onClick={handleSave}
          disabled={isLoading || !hasChanges}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="spin" /> Saving...
            </>
          ) : (
            <>
              <Save size={16} /> Save Changes
            </>
          )}
        </button>
      </div>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.type === 'success' && <CheckCircle size={16} />}
              {toast.type === 'error' && <AlertTriangle size={16} />}
              {toast.type === 'info' && <AlertCircle size={16} />}
              <span>{toast.message}</span>
              <button onClick={() => dismissToast(toast.id)} className="toast-dismiss">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
