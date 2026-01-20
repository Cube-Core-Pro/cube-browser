'use client';

/**
 * CUBE Nexum - SuperAdmin Branding Settings Page
 */

import React, { useState } from 'react';
import { 
  Palette, Image, Type, Globe, Link2, Save, RefreshCw,
  Check, AlertCircle, Upload, Trash2, Eye
} from 'lucide-react';
import './branding.css';

interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

export default function BrandingSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'colors' | 'logos' | 'social'>('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [general, setGeneral] = useState({
    siteName: 'CUBE AI',
    siteTagline: 'Enterprise AI Tools. Unlimited Potential.',
    siteDescription: 'The most powerful browser automation and enterprise AI platform.',
    siteUrl: 'https://cubeai.tools',
    supportEmail: 'support@cubeai.tools',
    salesEmail: 'sales@cubeai.tools',
    copyrightText: '© 2026 CUBE AI Technologies Inc. All rights reserved.'
  });

  const [colors, setColors] = useState<BrandColors>({
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  });

  const [social, setSocial] = useState({
    twitter: 'https://twitter.com/cubeai',
    linkedin: 'https://linkedin.com/company/cubeai',
    github: 'https://github.com/cubeai',
    youtube: 'https://youtube.com/@cubeai',
    discord: 'https://discord.gg/cubeai'
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: activeTab, data: activeTab === 'general' ? general : activeTab === 'colors' ? { colors } : social })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Branding settings saved successfully!' });
      } else {
        throw new Error('Failed');
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="branding-settings">
      <header className="branding-header">
        <div className="branding-header__content">
          <div className="branding-header__icon">
            <Palette className="w-8 h-8" />
          </div>
          <div className="branding-header__text">
            <h1>Branding Settings</h1>
            <p>Customize your brand identity, colors, logos, and social links</p>
          </div>
        </div>
      </header>

      {message && (
        <div className={`branding-message branding-message--${message.type}`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="branding-tabs">
        <button className={`branding-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
          <Type className="w-4 h-4" /> General
        </button>
        <button className={`branding-tab ${activeTab === 'colors' ? 'active' : ''}`} onClick={() => setActiveTab('colors')}>
          <Palette className="w-4 h-4" /> Colors
        </button>
        <button className={`branding-tab ${activeTab === 'logos' ? 'active' : ''}`} onClick={() => setActiveTab('logos')}>
          <Image className="w-4 h-4" /> Logos
        </button>
        <button className={`branding-tab ${activeTab === 'social' ? 'active' : ''}`} onClick={() => setActiveTab('social')}>
          <Link2 className="w-4 h-4" /> Social Links
        </button>
      </div>

      <div className="branding-content">
        {activeTab === 'general' && (
          <div className="branding-section">
            <div className="branding-form">
              <div className="form-group">
                <label>Site Name</label>
                <input type="text" value={general.siteName} onChange={e => setGeneral({...general, siteName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Tagline</label>
                <input type="text" value={general.siteTagline} onChange={e => setGeneral({...general, siteTagline: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={general.siteDescription} onChange={e => setGeneral({...general, siteDescription: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Site URL</label>
                <input type="url" value={general.siteUrl} onChange={e => setGeneral({...general, siteUrl: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Support Email</label>
                  <input type="email" value={general.supportEmail} onChange={e => setGeneral({...general, supportEmail: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Sales Email</label>
                  <input type="email" value={general.salesEmail} onChange={e => setGeneral({...general, salesEmail: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Copyright Text</label>
                <input type="text" value={general.copyrightText} onChange={e => setGeneral({...general, copyrightText: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="branding-section">
            <div className="colors-grid">
              {Object.entries(colors).map(([key, value]) => (
                <div key={key} className="color-picker">
                  <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                  <div className="color-input">
                    <input type="color" value={value} onChange={e => setColors({...colors, [key]: e.target.value})} />
                    <input type="text" value={value} onChange={e => setColors({...colors, [key]: e.target.value})} />
                  </div>
                  <div className="color-preview" style={{ background: value }} />
                </div>
              ))}
            </div>
            <div className="color-preview-section">
              <h3>Preview</h3>
              <div className="preview-buttons">
                <button style={{ background: colors.primary }}>Primary Button</button>
                <button style={{ background: colors.secondary }}>Secondary</button>
                <button style={{ background: colors.accent }}>Accent</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logos' && (
          <div className="branding-section">
            <div className="logos-grid">
              <div className="logo-upload">
                <label>Primary Logo (Light)</label>
                <div className="upload-zone">
                  <Upload className="w-8 h-8" />
                  <p>Click or drag to upload</p>
                  <span>SVG, PNG (max 2MB)</span>
                </div>
              </div>
              <div className="logo-upload">
                <label>Primary Logo (Dark)</label>
                <div className="upload-zone">
                  <Upload className="w-8 h-8" />
                  <p>Click or drag to upload</p>
                  <span>SVG, PNG (max 2MB)</span>
                </div>
              </div>
              <div className="logo-upload">
                <label>Icon / Favicon</label>
                <div className="upload-zone">
                  <Upload className="w-8 h-8" />
                  <p>Click or drag to upload</p>
                  <span>SVG, PNG, ICO</span>
                </div>
              </div>
              <div className="logo-upload">
                <label>Open Graph Image</label>
                <div className="upload-zone">
                  <Upload className="w-8 h-8" />
                  <p>Click or drag to upload</p>
                  <span>1200x630px recommended</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="branding-section">
            <div className="branding-form">
              <div className="form-group">
                <label>Twitter / X</label>
                <input type="url" value={social.twitter} onChange={e => setSocial({...social, twitter: e.target.value})} placeholder="https://twitter.com/..." />
              </div>
              <div className="form-group">
                <label>LinkedIn</label>
                <input type="url" value={social.linkedin} onChange={e => setSocial({...social, linkedin: e.target.value})} placeholder="https://linkedin.com/company/..." />
              </div>
              <div className="form-group">
                <label>GitHub</label>
                <input type="url" value={social.github} onChange={e => setSocial({...social, github: e.target.value})} placeholder="https://github.com/..." />
              </div>
              <div className="form-group">
                <label>YouTube</label>
                <input type="url" value={social.youtube} onChange={e => setSocial({...social, youtube: e.target.value})} placeholder="https://youtube.com/@..." />
              </div>
              <div className="form-group">
                <label>Discord</label>
                <input type="url" value={social.discord} onChange={e => setSocial({...social, discord: e.target.value})} placeholder="https://discord.gg/..." />
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
