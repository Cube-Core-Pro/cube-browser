/**
 * CUBE Nexum - SuperAdmin Site Configuration Panel
 * 
 * Comprehensive admin panel for managing all site/company configuration
 * including contact info, branding, legal, investors, and careers.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Phone,
  Mail,
  MapPin,
  Globe,
  Building2,
  Palette,
  Users,
  Briefcase,
  DollarSign,
  FileText,
  Save,
  RefreshCw,
  Download,
  Upload,
  History,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronRight,
  Link,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Github,
  Hash,
  Percent,
  Calendar,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  SiteConfigurationService,
  useSiteConfig,
} from '@/lib/services/site-configuration-service';
import {
  SiteConfiguration,
  ContactInfo,
  SocialMediaLinks,
  LegalInfo,
  BrandingConfig,
  InvestorConfig,
  CareersConfig,
} from '@/lib/types/site-configuration';
import './SiteConfigPanel.css';

type TabId = 'contact' | 'social' | 'legal' | 'branding' | 'investors' | 'careers' | 'history';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: 'contact', label: 'Contact Info', icon: <Phone size={18} /> },
  { id: 'social', label: 'Social Media', icon: <Globe size={18} /> },
  { id: 'legal', label: 'Legal', icon: <Building2 size={18} /> },
  { id: 'branding', label: 'Branding', icon: <Palette size={18} /> },
  { id: 'investors', label: 'Investors', icon: <DollarSign size={18} /> },
  { id: 'careers', label: 'Careers', icon: <Briefcase size={18} /> },
  { id: 'history', label: 'History', icon: <History size={18} /> },
];

export const SiteConfigPanel: React.FC = () => {
  const config = useSiteConfig();
  const [activeTab, setActiveTab] = useState<TabId>('contact');
  const [editedConfig, setEditedConfig] = useState<SiteConfiguration>(config);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedConfig(config);
  }, [config]);

  useEffect(() => {
    const changed = JSON.stringify(editedConfig) !== JSON.stringify(config);
    setHasChanges(changed);
  }, [editedConfig, config]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    
    try {
      const result = await SiteConfigurationService.updateConfig(editedConfig, 'superadmin');
      if (result.success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        console.error('Save failed:', result.error);
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditedConfig(config);
    setHasChanges(false);
  };

  const handleExport = () => {
    const json = JSON.stringify(editedConfig, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cube-config-${editedConfig.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        try {
          const imported = JSON.parse(text);
          setEditedConfig(imported);
        } catch {
          alert('Invalid JSON file');
        }
      }
    };
    input.click();
  };

  const updateContact = (updates: Partial<ContactInfo>) => {
    setEditedConfig(prev => ({
      ...prev,
      contact: { ...prev.contact, ...updates },
    }));
  };

  const updateSocial = (updates: Partial<SocialMediaLinks>) => {
    setEditedConfig(prev => ({
      ...prev,
      social: { ...prev.social, ...updates },
    }));
  };

  const updateLegal = (updates: Partial<LegalInfo>) => {
    setEditedConfig(prev => ({
      ...prev,
      legal: { ...prev.legal, ...updates },
    }));
  };

  const updateBranding = (updates: Partial<BrandingConfig>) => {
    setEditedConfig(prev => ({
      ...prev,
      branding: { ...prev.branding, ...updates },
    }));
  };

  const updateInvestors = (updates: Partial<InvestorConfig>) => {
    setEditedConfig(prev => ({
      ...prev,
      investors: { ...prev.investors, ...updates },
    }));
  };

  const updateCareers = (updates: Partial<CareersConfig>) => {
    setEditedConfig(prev => ({
      ...prev,
      careers: { ...prev.careers, ...updates },
    }));
  };

  return (
    <div className="site-config-panel">
      {/* Header */}
      <div className="config-header">
        <div className="config-header-left">
          <Settings size={24} />
          <div>
            <h1>Site Configuration</h1>
            <p>Version {editedConfig.version} • Last updated {new Date(editedConfig.lastUpdated).toLocaleString()}</p>
          </div>
        </div>
        <div className="config-header-actions">
          <button className="btn-icon" onClick={handleImport} title="Import">
            <Upload size={18} />
          </button>
          <button className="btn-icon" onClick={handleExport} title="Export">
            <Download size={18} />
          </button>
          <button 
            className="btn-secondary" 
            onClick={handleReset}
            disabled={!hasChanges}
          >
            <RefreshCw size={16} />
            Reset
          </button>
          <button 
            className={`btn-primary ${saving ? 'loading' : ''}`}
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <RefreshCw size={16} className="spin" />
            ) : saveStatus === 'success' ? (
              <CheckCircle size={16} />
            ) : saveStatus === 'error' ? (
              <AlertCircle size={16} />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="config-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`config-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="config-content">
        {activeTab === 'contact' && (
          <ContactSection 
            contact={editedConfig.contact}
            onChange={updateContact}
          />
        )}
        {activeTab === 'social' && (
          <SocialSection 
            social={editedConfig.social}
            onChange={updateSocial}
          />
        )}
        {activeTab === 'legal' && (
          <LegalSection 
            legal={editedConfig.legal}
            onChange={updateLegal}
          />
        )}
        {activeTab === 'branding' && (
          <BrandingSection 
            branding={editedConfig.branding}
            onChange={updateBranding}
          />
        )}
        {activeTab === 'investors' && (
          <InvestorsSection 
            investors={editedConfig.investors}
            onChange={updateInvestors}
          />
        )}
        {activeTab === 'careers' && (
          <CareersSection 
            careers={editedConfig.careers}
            onChange={updateCareers}
          />
        )}
        {activeTab === 'history' && (
          <HistorySection config={editedConfig} />
        )}
      </div>
    </div>
  );
};

// =============================================================================
// CONTACT SECTION
// =============================================================================

interface ContactSectionProps {
  contact: ContactInfo;
  onChange: (updates: Partial<ContactInfo>) => void;
}

const ContactSection: React.FC<ContactSectionProps> = ({ contact, onChange }) => {
  return (
    <div className="config-section">
      <h2><Phone size={20} /> Phone Numbers</h2>
      <div className="form-grid">
        <div className="form-field">
          <label>Support Phone</label>
          <input
            type="tel"
            value={contact.phones.support}
            onChange={e => onChange({
              phones: { ...contact.phones, support: e.target.value }
            })}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        <div className="form-field">
          <label>Sales Phone</label>
          <input
            type="tel"
            value={contact.phones.sales}
            onChange={e => onChange({
              phones: { ...contact.phones, sales: e.target.value }
            })}
            placeholder="+1 (555) 123-4568"
          />
        </div>
        <div className="form-field">
          <label>Main Phone</label>
          <input
            type="tel"
            value={contact.phones.main || ''}
            onChange={e => onChange({
              phones: { ...contact.phones, main: e.target.value }
            })}
            placeholder="+1 (555) 123-4500"
          />
        </div>
        <div className="form-field">
          <label>Emergency Phone</label>
          <input
            type="tel"
            value={contact.phones.emergency || ''}
            onChange={e => onChange({
              phones: { ...contact.phones, emergency: e.target.value }
            })}
            placeholder="+1 (555) 123-9999"
          />
        </div>
      </div>

      <h2><Mail size={20} /> Email Addresses</h2>
      <div className="form-grid">
        <div className="form-field">
          <label>Info Email</label>
          <input
            type="email"
            value={contact.emails.info}
            onChange={e => onChange({
              emails: { ...contact.emails, info: e.target.value }
            })}
            placeholder="info@company.com"
          />
        </div>
        <div className="form-field">
          <label>Support Email</label>
          <input
            type="email"
            value={contact.emails.support}
            onChange={e => onChange({
              emails: { ...contact.emails, support: e.target.value }
            })}
            placeholder="support@company.com"
          />
        </div>
        <div className="form-field">
          <label>Careers Email</label>
          <input
            type="email"
            value={contact.emails.careers}
            onChange={e => onChange({
              emails: { ...contact.emails, careers: e.target.value }
            })}
            placeholder="careers@company.com"
          />
        </div>
        <div className="form-field">
          <label>Investors Email</label>
          <input
            type="email"
            value={contact.emails.investors}
            onChange={e => onChange({
              emails: { ...contact.emails, investors: e.target.value }
            })}
            placeholder="investors@company.com"
          />
        </div>
        <div className="form-field">
          <label>Press Email</label>
          <input
            type="email"
            value={contact.emails.press || ''}
            onChange={e => onChange({
              emails: { ...contact.emails, press: e.target.value }
            })}
            placeholder="press@company.com"
          />
        </div>
        <div className="form-field">
          <label>Legal Email</label>
          <input
            type="email"
            value={contact.emails.legal || ''}
            onChange={e => onChange({
              emails: { ...contact.emails, legal: e.target.value }
            })}
            placeholder="legal@company.com"
          />
        </div>
      </div>

      <h2><MapPin size={20} /> Physical Address</h2>
      <div className="form-grid">
        <div className="form-field full-width">
          <label>Street Address</label>
          <input
            type="text"
            value={contact.address.street}
            onChange={e => onChange({
              address: { ...contact.address, street: e.target.value }
            })}
            placeholder="123 Main Street"
          />
        </div>
        <div className="form-field">
          <label>City</label>
          <input
            type="text"
            value={contact.address.city}
            onChange={e => onChange({
              address: { ...contact.address, city: e.target.value }
            })}
            placeholder="San Francisco"
          />
        </div>
        <div className="form-field">
          <label>State/Province</label>
          <input
            type="text"
            value={contact.address.state}
            onChange={e => onChange({
              address: { ...contact.address, state: e.target.value }
            })}
            placeholder="CA"
          />
        </div>
        <div className="form-field">
          <label>Country</label>
          <input
            type="text"
            value={contact.address.country}
            onChange={e => onChange({
              address: { ...contact.address, country: e.target.value }
            })}
            placeholder="USA"
          />
        </div>
        <div className="form-field">
          <label>Postal Code</label>
          <input
            type="text"
            value={contact.address.postalCode}
            onChange={e => onChange({
              address: { ...contact.address, postalCode: e.target.value }
            })}
            placeholder="94105"
          />
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// SOCIAL SECTION
// =============================================================================

interface SocialSectionProps {
  social: SocialMediaLinks;
  onChange: (updates: Partial<SocialMediaLinks>) => void;
}

const SocialSection: React.FC<SocialSectionProps> = ({ social, onChange }) => {
  const socialFields = [
    { key: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={18} />, placeholder: 'https://linkedin.com/company/...' },
    { key: 'twitter', label: 'Twitter/X', icon: <Twitter size={18} />, placeholder: 'https://twitter.com/...' },
    { key: 'instagram', label: 'Instagram', icon: <Instagram size={18} />, placeholder: 'https://instagram.com/...' },
    { key: 'youtube', label: 'YouTube', icon: <Youtube size={18} />, placeholder: 'https://youtube.com/@...' },
    { key: 'github', label: 'GitHub', icon: <Github size={18} />, placeholder: 'https://github.com/...' },
    { key: 'facebook', label: 'Facebook', icon: <Globe size={18} />, placeholder: 'https://facebook.com/...' },
    { key: 'tiktok', label: 'TikTok', icon: <Globe size={18} />, placeholder: 'https://tiktok.com/@...' },
    { key: 'discord', label: 'Discord', icon: <Globe size={18} />, placeholder: 'https://discord.gg/...' },
    { key: 'medium', label: 'Medium', icon: <Globe size={18} />, placeholder: 'https://medium.com/@...' },
  ];

  return (
    <div className="config-section">
      <h2><Globe size={20} /> Social Media Links</h2>
      <p className="section-description">
        Configure your company's social media presence. These links will appear across the website and application.
      </p>
      <div className="form-grid">
        {socialFields.map(field => (
          <div key={field.key} className="form-field">
            <label>
              {field.icon}
              {field.label}
            </label>
            <input
              type="url"
              value={social[field.key as keyof SocialMediaLinks] || ''}
              onChange={e => onChange({ [field.key]: e.target.value || undefined })}
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// LEGAL SECTION
// =============================================================================

interface LegalSectionProps {
  legal: LegalInfo;
  onChange: (updates: Partial<LegalInfo>) => void;
}

const LegalSection: React.FC<LegalSectionProps> = ({ legal, onChange }) => {
  return (
    <div className="config-section">
      <h2><Building2 size={20} /> Company Information</h2>
      <div className="form-grid">
        <div className="form-field">
          <label>Legal Company Name</label>
          <input
            type="text"
            value={legal.companyName}
            onChange={e => onChange({ companyName: e.target.value })}
            placeholder="Company Name Inc."
          />
        </div>
        <div className="form-field">
          <label>Trade Name (DBA)</label>
          <input
            type="text"
            value={legal.tradeName || ''}
            onChange={e => onChange({ tradeName: e.target.value })}
            placeholder="Trading As..."
          />
        </div>
        <div className="form-field">
          <label>Registration Country</label>
          <input
            type="text"
            value={legal.registrationCountry}
            onChange={e => onChange({ registrationCountry: e.target.value })}
            placeholder="USA"
          />
        </div>
        <div className="form-field">
          <label>Tax ID / EIN</label>
          <input
            type="text"
            value={legal.taxId}
            onChange={e => onChange({ taxId: e.target.value })}
            placeholder="XX-XXXXXXX"
          />
        </div>
        <div className="form-field">
          <label>Registration Number</label>
          <input
            type="text"
            value={legal.registrationNumber || ''}
            onChange={e => onChange({ registrationNumber: e.target.value })}
            placeholder="DE-XXXXXXXX"
          />
        </div>
        <div className="form-field">
          <label>VAT Number</label>
          <input
            type="text"
            value={legal.vatNumber || ''}
            onChange={e => onChange({ vatNumber: e.target.value })}
            placeholder="EU VAT Number"
          />
        </div>
        <div className="form-field">
          <label>Incorporation Date</label>
          <input
            type="date"
            value={legal.incorporationDate || ''}
            onChange={e => onChange({ incorporationDate: e.target.value })}
          />
        </div>
        <div className="form-field full-width">
          <label>Legal Address</label>
          <input
            type="text"
            value={legal.legalAddress || ''}
            onChange={e => onChange({ legalAddress: e.target.value })}
            placeholder="Full legal address for documents"
          />
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// BRANDING SECTION
// =============================================================================

interface BrandingSectionProps {
  branding: BrandingConfig;
  onChange: (updates: Partial<BrandingConfig>) => void;
}

const BrandingSection: React.FC<BrandingSectionProps> = ({ branding, onChange }) => {
  const colorFields = [
    { key: 'primary', label: 'Primary Color' },
    { key: 'secondary', label: 'Secondary Color' },
    { key: 'accent', label: 'Accent Color' },
    { key: 'background', label: 'Background' },
    { key: 'text', label: 'Text Color' },
    { key: 'success', label: 'Success' },
    { key: 'error', label: 'Error' },
    { key: 'warning', label: 'Warning' },
  ];

  return (
    <div className="config-section">
      <h2><Palette size={20} /> Brand Colors</h2>
      <div className="color-grid">
        {colorFields.map(field => (
          <div key={field.key} className="color-field">
            <label>{field.label}</label>
            <div className="color-input-group">
              <input
                type="color"
                value={branding.colors[field.key as keyof typeof branding.colors]}
                onChange={e => onChange({
                  colors: { ...branding.colors, [field.key]: e.target.value }
                })}
              />
              <input
                type="text"
                value={branding.colors[field.key as keyof typeof branding.colors]}
                onChange={e => onChange({
                  colors: { ...branding.colors, [field.key]: e.target.value }
                })}
                placeholder="#000000"
              />
            </div>
          </div>
        ))}
      </div>

      <h2><FileText size={20} /> Logo & Assets</h2>
      <div className="form-grid">
        <div className="form-field">
          <label>Main Logo URL</label>
          <input
            type="text"
            value={branding.logo.main}
            onChange={e => onChange({
              logo: { ...branding.logo, main: e.target.value }
            })}
            placeholder="/images/logo.svg"
          />
        </div>
        <div className="form-field">
          <label>Favicon URL</label>
          <input
            type="text"
            value={branding.logo.favicon}
            onChange={e => onChange({
              logo: { ...branding.logo, favicon: e.target.value }
            })}
            placeholder="/favicon.ico"
          />
        </div>
        <div className="form-field">
          <label>Dark Mode Logo</label>
          <input
            type="text"
            value={branding.logo.darkMode || ''}
            onChange={e => onChange({
              logo: { ...branding.logo, darkMode: e.target.value }
            })}
            placeholder="/images/logo-dark.svg"
          />
        </div>
        <div className="form-field">
          <label>Icon (Square)</label>
          <input
            type="text"
            value={branding.logo.icon || ''}
            onChange={e => onChange({
              logo: { ...branding.logo, icon: e.target.value }
            })}
            placeholder="/images/icon.svg"
          />
        </div>
      </div>

      <h2><Hash size={20} /> Tagline & Messaging</h2>
      <div className="form-grid">
        <div className="form-field full-width">
          <label>Tagline</label>
          <input
            type="text"
            value={branding.tagline}
            onChange={e => onChange({ tagline: e.target.value })}
            placeholder="Your company tagline"
          />
        </div>
        <div className="form-field full-width">
          <label>Slogan</label>
          <input
            type="text"
            value={branding.slogan || ''}
            onChange={e => onChange({ slogan: e.target.value })}
            placeholder="Company slogan"
          />
        </div>
        <div className="form-field full-width">
          <label>Mission Statement</label>
          <textarea
            value={branding.mission || ''}
            onChange={e => onChange({ mission: e.target.value })}
            placeholder="Our mission is to..."
            rows={3}
          />
        </div>
        <div className="form-field full-width">
          <label>Vision Statement</label>
          <textarea
            value={branding.vision || ''}
            onChange={e => onChange({ vision: e.target.value })}
            placeholder="Our vision is to..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// INVESTORS SECTION
// =============================================================================

interface InvestorsSectionProps {
  investors: InvestorConfig;
  onChange: (updates: Partial<InvestorConfig>) => void;
}

const InvestorsSection: React.FC<InvestorsSectionProps> = ({ investors, onChange }) => {
  const [showAddType, setShowAddType] = useState(false);

  return (
    <div className="config-section">
      <h2><Percent size={20} /> Expected Returns</h2>
      <div className="form-grid">
        <div className="form-field">
          <label>Minimum Return (%)</label>
          <input
            type="number"
            value={investors.expectedReturn.min}
            onChange={e => onChange({
              expectedReturn: { ...investors.expectedReturn, min: parseFloat(e.target.value) || 0 }
            })}
            min="0"
            max="100"
            step="0.1"
          />
        </div>
        <div className="form-field">
          <label>Maximum Return (%)</label>
          <input
            type="number"
            value={investors.expectedReturn.max}
            onChange={e => onChange({
              expectedReturn: { ...investors.expectedReturn, max: parseFloat(e.target.value) || 0 }
            })}
            min="0"
            max="100"
            step="0.1"
          />
        </div>
        <div className="form-field">
          <label>Average Return (%)</label>
          <input
            type="number"
            value={investors.expectedReturn.average}
            onChange={e => onChange({
              expectedReturn: { ...investors.expectedReturn, average: parseFloat(e.target.value) || 0 }
            })}
            min="0"
            max="100"
            step="0.1"
          />
        </div>
        <div className="form-field">
          <label>Return Period</label>
          <select
            value={investors.expectedReturn.period}
            onChange={e => onChange({
              expectedReturn: { ...investors.expectedReturn, period: e.target.value as 'monthly' | 'quarterly' | 'yearly' }
            })}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <h2><DollarSign size={20} /> Minimum Investment</h2>
      <div className="form-grid">
        <div className="form-field">
          <label>Amount</label>
          <input
            type="number"
            value={investors.minimumInvestment.amount}
            onChange={e => onChange({
              minimumInvestment: { ...investors.minimumInvestment, amount: parseFloat(e.target.value) || 0 }
            })}
            min="0"
            step="100"
          />
        </div>
        <div className="form-field">
          <label>Currency</label>
          <select
            value={investors.minimumInvestment.currency}
            onChange={e => onChange({
              minimumInvestment: { ...investors.minimumInvestment, currency: e.target.value }
            })}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>
        </div>
      </div>

      <h2>
        <Users size={20} /> Investment Types
        <button className="btn-small" onClick={() => setShowAddType(true)}>
          <Plus size={14} /> Add Type
        </button>
      </h2>
      <div className="investment-types-list">
        {investors.investmentTypes.map((type, index) => (
          <div key={type.id} className="investment-type-card">
            <div className="type-header">
              <h4>{type.name}</h4>
              <div className="type-actions">
                <span className={`badge ${type.active ? 'active' : 'inactive'}`}>
                  {type.active ? 'Active' : 'Inactive'}
                </span>
                <button 
                  className="btn-icon-small"
                  onClick={() => {
                    const updated = [...investors.investmentTypes];
                    updated.splice(index, 1);
                    onChange({ investmentTypes: updated });
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p>{type.description}</p>
            <div className="type-details">
              <span>Min: ${type.minAmount.toLocaleString()}</span>
              <span>Return: {type.expectedReturn}%</span>
              <span className={`risk ${type.riskLevel}`}>{type.riskLevel} risk</span>
            </div>
          </div>
        ))}
      </div>

      <h2><Shield size={20} /> Disclaimers</h2>
      <div className="disclaimers-list">
        {investors.disclaimers.map((disclaimer, index) => (
          <div key={index} className="disclaimer-item">
            <input
              type="text"
              value={disclaimer}
              onChange={e => {
                const updated = [...investors.disclaimers];
                updated[index] = e.target.value;
                onChange({ disclaimers: updated });
              }}
            />
            <button 
              className="btn-icon-small"
              onClick={() => {
                const updated = investors.disclaimers.filter((_, i) => i !== index);
                onChange({ disclaimers: updated });
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button 
          className="btn-small"
          onClick={() => onChange({ disclaimers: [...investors.disclaimers, ''] })}
        >
          <Plus size={14} /> Add Disclaimer
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// CAREERS SECTION
// =============================================================================

interface CareersSectionProps {
  careers: CareersConfig;
  onChange: (updates: Partial<CareersConfig>) => void;
}

const CareersSection: React.FC<CareersSectionProps> = ({ careers, onChange }) => {
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [editingPosition, setEditingPosition] = useState<string | null>(null);

  return (
    <div className="config-section">
      <h2>
        <Briefcase size={20} /> Open Positions ({careers.openPositions.length})
        <button className="btn-small" onClick={() => setShowAddPosition(true)}>
          <Plus size={14} /> Add Position
        </button>
      </h2>
      
      {careers.openPositions.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={48} />
          <p>No open positions yet</p>
          <button className="btn-primary" onClick={() => setShowAddPosition(true)}>
            Add First Position
          </button>
        </div>
      ) : (
        <div className="positions-list">
          {careers.openPositions.map((position, index) => (
            <div key={position.id} className="position-card">
              <div className="position-header">
                <div>
                  <h4>{position.title}</h4>
                  <span className="department">{position.department}</span>
                </div>
                <div className="position-actions">
                  <span className={`badge ${position.active ? 'active' : 'inactive'}`}>
                    {position.active ? 'Active' : 'Draft'}
                  </span>
                  {position.featured && <span className="badge featured">Featured</span>}
                  <button 
                    className="btn-icon-small"
                    onClick={() => setEditingPosition(position.id)}
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    className="btn-icon-small"
                    onClick={() => {
                      const updated = careers.openPositions.filter((_, i) => i !== index);
                      onChange({ openPositions: updated });
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="position-details">
                <span><MapPin size={14} /> {position.location}</span>
                <span><Users size={14} /> {position.type}</span>
                <span><Calendar size={14} /> {new Date(position.postedDate).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2><Users size={20} /> Benefits</h2>
      <div className="benefits-grid">
        {careers.benefits.map((benefit, index) => (
          <div key={benefit.id} className="benefit-card">
            <h4>{benefit.name}</h4>
            <p>{benefit.description}</p>
            <span className="category-badge">{benefit.category}</span>
          </div>
        ))}
        <button className="benefit-add-card" onClick={() => {
          const newBenefit = {
            id: `benefit-${Date.now()}`,
            name: 'New Benefit',
            description: 'Description...',
            category: 'other' as const,
          };
          onChange({ benefits: [...careers.benefits, newBenefit] });
        }}>
          <Plus size={24} />
          <span>Add Benefit</span>
        </button>
      </div>

      <h2><Hash size={20} /> Tech Stack</h2>
      <div className="tech-stack-list">
        {careers.techStack.map((category, catIndex) => (
          <div key={catIndex} className="tech-category">
            <h4>{category.category}</h4>
            <div className="tech-tags">
              {category.technologies.map((tech, techIndex) => (
                <span key={techIndex} className="tech-tag">
                  {tech}
                  <button onClick={() => {
                    const updated = [...careers.techStack];
                    updated[catIndex].technologies = updated[catIndex].technologies.filter((_, i) => i !== techIndex);
                    onChange({ techStack: updated });
                  }}>×</button>
                </span>
              ))}
              <input
                type="text"
                placeholder="+ Add"
                className="tech-input"
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    const updated = [...careers.techStack];
                    updated[catIndex].technologies.push(e.currentTarget.value);
                    onChange({ techStack: updated });
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// HISTORY SECTION
// =============================================================================

interface HistorySectionProps {
  config: SiteConfiguration;
}

const HistorySection: React.FC<HistorySectionProps> = ({ config }) => {
  const [history, setHistory] = useState<{ version: string; timestamp: string; updatedBy: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SiteConfigurationService.getHistory()
      .then(setHistory)
      .finally(() => setLoading(false));
  }, []);

  const handleRollback = async (version: string) => {
    if (confirm(`Are you sure you want to rollback to version ${version}?`)) {
      await SiteConfigurationService.rollback(version);
    }
  };

  return (
    <div className="config-section">
      <h2><History size={20} /> Configuration History</h2>
      
      <div className="current-version">
        <h3>Current Version</h3>
        <div className="version-card current">
          <div className="version-info">
            <span className="version-number">{config.version}</span>
            <span className="version-date">{new Date(config.lastUpdated).toLocaleString()}</span>
            <span className="version-author">by {config.updatedBy}</span>
          </div>
        </div>
      </div>

      <h3>Previous Versions</h3>
      {loading ? (
        <div className="loading">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <History size={48} />
          <p>No previous versions</p>
        </div>
      ) : (
        <div className="version-list">
          {history.map((item, index) => (
            <div key={index} className="version-card">
              <div className="version-info">
                <span className="version-number">{item.version}</span>
                <span className="version-date">{new Date(item.timestamp).toLocaleString()}</span>
                <span className="version-author">by {item.updatedBy}</span>
              </div>
              <button 
                className="btn-small"
                onClick={() => handleRollback(item.version)}
              >
                <RefreshCw size={14} />
                Rollback
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SiteConfigPanel;
