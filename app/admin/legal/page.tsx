'use client';

/**
 * CUBE Nexum - SuperAdmin Legal Settings Page
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, Building2, Save, RefreshCw, Plus, Edit2, Trash2,
  Globe, ChevronDown, ChevronRight, Check, AlertCircle, Eye
} from 'lucide-react';
import './legal.css';

interface LegalDocument {
  id: string;
  title: string;
  slug: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  isActive: boolean;
  requiresAcceptance: boolean;
  hasTranslations: boolean;
  availableLanguages: string[];
}

interface CompanyInfo {
  companyName: string;
  companyLegalName: string;
  companyAddress: string;
  companyCity: string;
  companyCountry: string;
  companyRegistrationNumber: string;
  companyVatNumber: string;
  companyEmail: string;
  companyPhone: string;
  dataProtectionOfficer: string;
  dpoEmail: string;
}

export default function LegalSettingsPage() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: 'CUBE AI',
    companyLegalName: 'CUBE AI Technologies Inc.',
    companyAddress: '123 Innovation Drive, Suite 500',
    companyCity: 'San Francisco, CA 94105',
    companyCountry: 'United States',
    companyRegistrationNumber: 'DE-123456789',
    companyVatNumber: 'US123456789',
    companyEmail: 'legal@cubeai.tools',
    companyPhone: '+1 (555) 123-4567',
    dataProtectionOfficer: 'Privacy Officer',
    dpoEmail: 'dpo@cubeai.tools'
  });

  const [documents, setDocuments] = useState<LegalDocument[]>([
    { id: 'terms-of-service', title: 'Terms of Service', slug: 'terms', version: '1.0.0', effectiveDate: '2026-01-15', lastUpdated: '2026-01-15', isActive: true, requiresAcceptance: true, hasTranslations: false, availableLanguages: ['en'] },
    { id: 'privacy-policy', title: 'Privacy Policy', slug: 'privacy', version: '1.0.0', effectiveDate: '2026-01-15', lastUpdated: '2026-01-15', isActive: true, requiresAcceptance: true, hasTranslations: false, availableLanguages: ['en'] },
    { id: 'cookie-policy', title: 'Cookie Policy', slug: 'cookies', version: '1.0.0', effectiveDate: '2026-01-15', lastUpdated: '2026-01-15', isActive: true, requiresAcceptance: false, hasTranslations: false, availableLanguages: ['en'] },
    { id: 'refund-policy', title: 'Refund Policy', slug: 'refunds', version: '1.0.0', effectiveDate: '2026-01-15', lastUpdated: '2026-01-15', isActive: true, requiresAcceptance: false, hasTranslations: false, availableLanguages: ['en'] },
    { id: 'acceptable-use', title: 'Acceptable Use Policy', slug: 'acceptable-use', version: '1.0.0', effectiveDate: '2026-01-15', lastUpdated: '2026-01-15', isActive: true, requiresAcceptance: true, hasTranslations: false, availableLanguages: ['en'] },
    { id: 'dpa', title: 'Data Processing Agreement', slug: 'dpa', version: '1.0.0', effectiveDate: '2026-01-15', lastUpdated: '2026-01-15', isActive: true, requiresAcceptance: true, hasTranslations: false, availableLanguages: ['en'] }
  ]);

  const [activeSection, setActiveSection] = useState<'company' | 'documents'>('company');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingDoc, setEditingDoc] = useState<string | null>(null);

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateCompanyInfo', ...companyInfo })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Company information saved successfully!' });
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save company information' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleInputChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="legal-settings">
      <header className="legal-header">
        <div className="legal-header__content">
          <div className="legal-header__icon">
            <FileText className="w-8 h-8" />
          </div>
          <div className="legal-header__text">
            <h1>Legal Settings</h1>
            <p>Manage legal documents, company information, and compliance</p>
          </div>
        </div>
      </header>

      {message && (
        <div className={`legal-message legal-message--${message.type}`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="legal-tabs">
        <button
          className={`legal-tab ${activeSection === 'company' ? 'active' : ''}`}
          onClick={() => setActiveSection('company')}
        >
          <Building2 className="w-4 h-4" />
          Company Information
        </button>
        <button
          className={`legal-tab ${activeSection === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveSection('documents')}
        >
          <FileText className="w-4 h-4" />
          Legal Documents
        </button>
      </div>

      <div className="legal-content">
        {activeSection === 'company' && (
          <div className="legal-section">
            <div className="legal-form">
              <div className="form-group">
                <label>Company Name (Display)</label>
                <input type="text" value={companyInfo.companyName} onChange={e => handleInputChange('companyName', e.target.value)} placeholder="CUBE AI" />
              </div>
              <div className="form-group">
                <label>Legal Name</label>
                <input type="text" value={companyInfo.companyLegalName} onChange={e => handleInputChange('companyLegalName', e.target.value)} placeholder="CUBE AI Technologies Inc." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Registration Number</label>
                  <input type="text" value={companyInfo.companyRegistrationNumber} onChange={e => handleInputChange('companyRegistrationNumber', e.target.value)} placeholder="DE-123456789" />
                </div>
                <div className="form-group">
                  <label>VAT Number</label>
                  <input type="text" value={companyInfo.companyVatNumber} onChange={e => handleInputChange('companyVatNumber', e.target.value)} placeholder="US123456789" />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" value={companyInfo.companyAddress} onChange={e => handleInputChange('companyAddress', e.target.value)} placeholder="123 Innovation Drive" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input type="text" value={companyInfo.companyCity} onChange={e => handleInputChange('companyCity', e.target.value)} placeholder="San Francisco, CA 94105" />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input type="text" value={companyInfo.companyCountry} onChange={e => handleInputChange('companyCountry', e.target.value)} placeholder="United States" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Legal Email</label>
                  <input type="email" value={companyInfo.companyEmail} onChange={e => handleInputChange('companyEmail', e.target.value)} placeholder="legal@cubeai.tools" />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" value={companyInfo.companyPhone} onChange={e => handleInputChange('companyPhone', e.target.value)} placeholder="+1 (555) 123-4567" />
                </div>
              </div>
              <div className="form-divider">
                <span>Data Protection (GDPR)</span>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Data Protection Officer</label>
                  <input type="text" value={companyInfo.dataProtectionOfficer} onChange={e => handleInputChange('dataProtectionOfficer', e.target.value)} placeholder="Privacy Officer" />
                </div>
                <div className="form-group">
                  <label>DPO Email</label>
                  <input type="email" value={companyInfo.dpoEmail} onChange={e => handleInputChange('dpoEmail', e.target.value)} placeholder="dpo@cubeai.tools" />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={handleSaveCompany} disabled={saving}>
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'documents' && (
          <div className="legal-section">
            <div className="documents-header">
              <h2>Legal Documents</h2>
              <button className="btn-secondary">
                <Plus className="w-4 h-4" />
                Add Document
              </button>
            </div>
            <div className="documents-list">
              {documents.map(doc => (
                <div key={doc.id} className="document-card">
                  <div className="document-info">
                    <div className="document-title">
                      <FileText className="w-5 h-5" />
                      <span>{doc.title}</span>
                      {doc.isActive && <span className="badge badge--active">Active</span>}
                      {doc.requiresAcceptance && <span className="badge badge--required">Required</span>}
                    </div>
                    <div className="document-meta">
                      <span>v{doc.version}</span>
                      <span>•</span>
                      <span>Effective: {doc.effectiveDate}</span>
                      <span>•</span>
                      <span>/{doc.slug}</span>
                    </div>
                  </div>
                  <div className="document-actions">
                    <button className="btn-icon" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="btn-icon" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="btn-icon" title="Languages">
                      <Globe className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
