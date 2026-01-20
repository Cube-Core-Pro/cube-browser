'use client';

import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Palette, Upload, Image as ImageIcon,
  Type, Paintbrush, Eye, Save, Undo, RefreshCw,
  Monitor, Smartphone, Tablet, Check, X, Loader2,
  Sun, Moon, HelpCircle, Globe, Lock, Mail,
  ChevronRight, Copy, ExternalLink
} from 'lucide-react';
import '../whitelabel.css';

// ============================================
// Types
// ============================================

interface BrandingConfig {
  id: string;
  tenantId: string;
  
  // Identity
  companyName: string;
  tagline: string;
  
  // Logo
  logoUrl: string | null;
  logoLightUrl: string | null;
  faviconUrl: string | null;
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  
  // Typography
  fontFamily: string;
  headingFont: string;
  
  // Custom CSS
  customCss: string;
  
  // Footer
  footerText: string;
  hidePoweredBy: boolean;
  
  // Links
  supportUrl: string;
  termsUrl: string;
  privacyUrl: string;
  
  // Email
  emailFromName: string;
  emailFooterText: string;
  
  updatedAt: string;
}

// ============================================
// Main Component
// ============================================

export default function BrandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'identity' | 'colors' | 'typography' | 'footer' | 'email'>('identity');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'logo' | 'logoLight' | 'favicon'>('logo');

  const defaultConfig: BrandingConfig = {
    id: '',
    tenantId: '',
    companyName: 'Your Company',
    tagline: 'Powered by Innovation',
    logoUrl: null,
    logoLightUrl: null,
    faviconUrl: null,
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    accentColor: '#f59e0b',
    textColor: '#0f172a',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter',
    headingFont: 'Inter',
    customCss: '',
    footerText: '© 2026 Your Company. All rights reserved.',
    hidePoweredBy: false,
    supportUrl: '',
    termsUrl: '',
    privacyUrl: '',
    emailFromName: 'Your Company',
    emailFooterText: '',
    updatedAt: ''
  };

  const [config, setConfig] = useState<BrandingConfig>(defaultConfig);
  const [originalConfig, setOriginalConfig] = useState<BrandingConfig>(defaultConfig);

  const fontOptions = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Source Sans Pro',
    'Nunito',
    'Raleway',
    'Work Sans'
  ];

  useEffect(() => {
    loadBrandingConfig();
  }, []);

  useEffect(() => {
    const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setHasChanges(changed);
  }, [config, originalConfig]);

  const loadBrandingConfig = async () => {
    setLoading(true);
    try {
      const data = await invoke<BrandingConfig>('get_white_label_branding');
      setConfig(data);
      setOriginalConfig(data);
    } catch (error) {
      console.error('Failed to load branding config:', error);
      // Use mock data
      const mockConfig: BrandingConfig = {
        id: 'brand-001',
        tenantId: 'tenant-001',
        companyName: 'TechFlow Solutions',
        tagline: 'Automation Made Simple',
        logoUrl: null,
        logoLightUrl: null,
        faviconUrl: null,
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        accentColor: '#10b981',
        textColor: '#0f172a',
        backgroundColor: '#ffffff',
        fontFamily: 'Inter',
        headingFont: 'Inter',
        customCss: '',
        footerText: '© 2026 TechFlow Solutions. All rights reserved.',
        hidePoweredBy: false,
        supportUrl: 'https://support.techflow.io',
        termsUrl: 'https://techflow.io/terms',
        privacyUrl: 'https://techflow.io/privacy',
        emailFromName: 'TechFlow Team',
        emailFooterText: 'You received this email because you are a TechFlow user.',
        updatedAt: new Date().toISOString()
      };
      setConfig(mockConfig);
      setOriginalConfig(mockConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await invoke('update_white_label_config', { config });
      setOriginalConfig(config);
      setHasChanges(false);
      alert('Branding saved successfully!');
    } catch (error) {
      console.error('Failed to save branding:', error);
      alert('Failed to save branding configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(originalConfig);
    setHasChanges(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      switch (uploadType) {
        case 'logo':
          setConfig({ ...config, logoUrl: dataUrl });
          break;
        case 'logoLight':
          setConfig({ ...config, logoLightUrl: dataUrl });
          break;
        case 'favicon':
          setConfig({ ...config, faviconUrl: dataUrl });
          break;
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = (type: 'logo' | 'logoLight' | 'favicon') => {
    setUploadType(type);
    fileInputRef.current?.click();
  };

  const updateConfig = (updates: Partial<BrandingConfig>) => {
    setConfig({ ...config, ...updates });
  };

  if (loading) {
    return (
      <div className="whitelabel-loading">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>Loading branding configuration...</p>
      </div>
    );
  }

  return (
    <div className="branding-page">
      {/* Header */}
      <header className="branding-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => router.push('/whitelabel')}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="header-title">
            <Palette className="w-6 h-6" />
            <div>
              <h1>Brand Customization</h1>
              <p>Customize the look and feel of your white-label deployment</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          {hasChanges && (
            <>
              <button className="btn-secondary" onClick={handleReset}>
                <Undo className="w-4 h-4" />
                Discard
              </button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </>
          )}
        </div>
      </header>

      <div className="branding-content">
        {/* Settings Panel */}
        <div className="settings-panel">
          {/* Tabs */}
          <div className="settings-tabs">
            <button 
              className={`tab ${activeTab === 'identity' ? 'active' : ''}`}
              onClick={() => setActiveTab('identity')}
            >
              <ImageIcon className="w-4 h-4" />
              Identity
            </button>
            <button 
              className={`tab ${activeTab === 'colors' ? 'active' : ''}`}
              onClick={() => setActiveTab('colors')}
            >
              <Paintbrush className="w-4 h-4" />
              Colors
            </button>
            <button 
              className={`tab ${activeTab === 'typography' ? 'active' : ''}`}
              onClick={() => setActiveTab('typography')}
            >
              <Type className="w-4 h-4" />
              Typography
            </button>
            <button 
              className={`tab ${activeTab === 'footer' ? 'active' : ''}`}
              onClick={() => setActiveTab('footer')}
            >
              <Globe className="w-4 h-4" />
              Footer & Links
            </button>
            <button 
              className={`tab ${activeTab === 'email' ? 'active' : ''}`}
              onClick={() => setActiveTab('email')}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>

          {/* Tab Content */}
          <div className="settings-content">
            {/* Identity Tab */}
            {activeTab === 'identity' && (
              <div className="tab-content">
                <h3>Brand Identity</h3>
                
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={config.companyName}
                    onChange={(e) => updateConfig({ companyName: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>

                <div className="form-group">
                  <label>Tagline</label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => updateConfig({ tagline: e.target.value })}
                    placeholder="Your company tagline"
                  />
                </div>

                <div className="form-group">
                  <label>Logo (Dark Mode)</label>
                  <div className="upload-area" onClick={() => triggerUpload('logo')}>
                    {config.logoUrl ? (
                      <img src={config.logoUrl} alt="Logo" className="preview-image" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8" />
                        <span>Click to upload logo</span>
                        <small>Recommended: 200x50px, PNG/SVG</small>
                      </>
                    )}
                  </div>
                  {config.logoUrl && (
                    <button className="remove-btn" onClick={() => updateConfig({ logoUrl: null })}>
                      <X className="w-4 h-4" /> Remove
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Logo (Light Mode)</label>
                  <div className="upload-area" onClick={() => triggerUpload('logoLight')}>
                    {config.logoLightUrl ? (
                      <img src={config.logoLightUrl} alt="Logo Light" className="preview-image" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8" />
                        <span>Click to upload light logo</span>
                        <small>For dark backgrounds</small>
                      </>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Favicon</label>
                  <div className="upload-area small" onClick={() => triggerUpload('favicon')}>
                    {config.faviconUrl ? (
                      <img src={config.faviconUrl} alt="Favicon" className="preview-favicon" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6" />
                        <span>Upload favicon</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Colors Tab */}
            {activeTab === 'colors' && (
              <div className="tab-content">
                <h3>Brand Colors</h3>
                
                <div className="color-grid">
                  <div className="color-input">
                    <label>Primary Color</label>
                    <div className="color-picker">
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                      />
                      <input
                        type="text"
                        value={config.primaryColor}
                        onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="color-input">
                    <label>Secondary Color</label>
                    <div className="color-picker">
                      <input
                        type="color"
                        value={config.secondaryColor}
                        onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                      />
                      <input
                        type="text"
                        value={config.secondaryColor}
                        onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="color-input">
                    <label>Accent Color</label>
                    <div className="color-picker">
                      <input
                        type="color"
                        value={config.accentColor}
                        onChange={(e) => updateConfig({ accentColor: e.target.value })}
                      />
                      <input
                        type="text"
                        value={config.accentColor}
                        onChange={(e) => updateConfig({ accentColor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="color-input">
                    <label>Text Color</label>
                    <div className="color-picker">
                      <input
                        type="color"
                        value={config.textColor}
                        onChange={(e) => updateConfig({ textColor: e.target.value })}
                      />
                      <input
                        type="text"
                        value={config.textColor}
                        onChange={(e) => updateConfig({ textColor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="color-input">
                    <label>Background Color</label>
                    <div className="color-picker">
                      <input
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                      />
                      <input
                        type="text"
                        value={config.backgroundColor}
                        onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="color-preview">
                  <h4>Color Preview</h4>
                  <div className="preview-swatches">
                    <div className="swatch" style={{ background: config.primaryColor }}>
                      <span>Primary</span>
                    </div>
                    <div className="swatch" style={{ background: config.secondaryColor }}>
                      <span>Secondary</span>
                    </div>
                    <div className="swatch" style={{ background: config.accentColor }}>
                      <span>Accent</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Typography Tab */}
            {activeTab === 'typography' && (
              <div className="tab-content">
                <h3>Typography</h3>
                
                <div className="form-group">
                  <label>Body Font</label>
                  <select
                    value={config.fontFamily}
                    onChange={(e) => updateConfig({ fontFamily: e.target.value })}
                  >
                    {fontOptions.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Heading Font</label>
                  <select
                    value={config.headingFont}
                    onChange={(e) => updateConfig({ headingFont: e.target.value })}
                  >
                    {fontOptions.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div className="typography-preview" style={{ fontFamily: config.fontFamily }}>
                  <h4 style={{ fontFamily: config.headingFont }}>Typography Preview</h4>
                  <p>This is how your body text will look with the selected font family.</p>
                  <h5 style={{ fontFamily: config.headingFont }}>Heading Example</h5>
                  <p><strong>Bold text</strong> and <em>italic text</em> demonstration.</p>
                </div>

                <div className="form-group">
                  <label>Custom CSS (Advanced)</label>
                  <textarea
                    value={config.customCss}
                    onChange={(e) => updateConfig({ customCss: e.target.value })}
                    placeholder="/* Add custom CSS here */"
                    rows={8}
                  />
                  <small className="help-text">
                    Advanced: Add custom CSS to further customize the appearance.
                  </small>
                </div>
              </div>
            )}

            {/* Footer Tab */}
            {activeTab === 'footer' && (
              <div className="tab-content">
                <h3>Footer & Links</h3>
                
                <div className="form-group">
                  <label>Footer Text</label>
                  <input
                    type="text"
                    value={config.footerText}
                    onChange={(e) => updateConfig({ footerText: e.target.value })}
                    placeholder="© 2026 Your Company"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.hidePoweredBy}
                      onChange={(e) => updateConfig({ hidePoweredBy: e.target.checked })}
                    />
                    <span className="checkmark"></span>
                    Hide "Powered by CUBE AI" branding
                  </label>
                  <small className="help-text">
                    Available on Enterprise plans only
                  </small>
                </div>

                <div className="form-group">
                  <label>Support URL</label>
                  <input
                    type="url"
                    value={config.supportUrl}
                    onChange={(e) => updateConfig({ supportUrl: e.target.value })}
                    placeholder="https://support.yourcompany.com"
                  />
                </div>

                <div className="form-group">
                  <label>Terms of Service URL</label>
                  <input
                    type="url"
                    value={config.termsUrl}
                    onChange={(e) => updateConfig({ termsUrl: e.target.value })}
                    placeholder="https://yourcompany.com/terms"
                  />
                </div>

                <div className="form-group">
                  <label>Privacy Policy URL</label>
                  <input
                    type="url"
                    value={config.privacyUrl}
                    onChange={(e) => updateConfig({ privacyUrl: e.target.value })}
                    placeholder="https://yourcompany.com/privacy"
                  />
                </div>
              </div>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
              <div className="tab-content">
                <h3>Email Branding</h3>
                
                <div className="form-group">
                  <label>From Name</label>
                  <input
                    type="text"
                    value={config.emailFromName}
                    onChange={(e) => updateConfig({ emailFromName: e.target.value })}
                    placeholder="Your Company Team"
                  />
                  <small className="help-text">
                    This appears as the sender name in emails
                  </small>
                </div>

                <div className="form-group">
                  <label>Email Footer Text</label>
                  <textarea
                    value={config.emailFooterText}
                    onChange={(e) => updateConfig({ emailFooterText: e.target.value })}
                    placeholder="You received this email because..."
                    rows={3}
                  />
                </div>

                <div className="email-preview">
                  <h4>Email Preview</h4>
                  <div className="email-mock">
                    <div className="email-header" style={{ background: config.primaryColor }}>
                      {config.logoUrl ? (
                        <img src={config.logoLightUrl || config.logoUrl} alt="Logo" />
                      ) : (
                        <span>{config.companyName}</span>
                      )}
                    </div>
                    <div className="email-body">
                      <h5>Welcome to {config.companyName}!</h5>
                      <p>This is a preview of how your branded emails will look.</p>
                      <button style={{ background: config.primaryColor }}>
                        Call to Action
                      </button>
                    </div>
                    <div className="email-footer">
                      <p>{config.emailFooterText || 'Footer text will appear here'}</p>
                      <small>{config.footerText}</small>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="preview-panel">
          <div className="preview-header">
            <h3>
              <Eye className="w-5 h-5" />
              Live Preview
            </h3>
            <div className="preview-controls">
              <div className="device-switcher">
                <button 
                  className={previewDevice === 'desktop' ? 'active' : ''}
                  onClick={() => setPreviewDevice('desktop')}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button 
                  className={previewDevice === 'tablet' ? 'active' : ''}
                  onClick={() => setPreviewDevice('tablet')}
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button 
                  className={previewDevice === 'mobile' ? 'active' : ''}
                  onClick={() => setPreviewDevice('mobile')}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
              <div className="theme-switcher">
                <button 
                  className={previewTheme === 'light' ? 'active' : ''}
                  onClick={() => setPreviewTheme('light')}
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button 
                  className={previewTheme === 'dark' ? 'active' : ''}
                  onClick={() => setPreviewTheme('dark')}
                >
                  <Moon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className={`preview-frame ${previewDevice} ${previewTheme}`}>
            <div className="preview-browser">
              <div className="browser-bar">
                <div className="dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="url-bar">app.{config.companyName.toLowerCase().replace(/\s+/g, '')}.com</div>
              </div>
              <div 
                className="browser-content"
                style={{ 
                  '--preview-primary': config.primaryColor,
                  '--preview-secondary': config.secondaryColor,
                  '--preview-accent': config.accentColor,
                  '--preview-text': previewTheme === 'dark' ? '#f8fafc' : config.textColor,
                  '--preview-bg': previewTheme === 'dark' ? '#0f172a' : config.backgroundColor,
                  fontFamily: config.fontFamily
                } as React.CSSProperties}
              >
                {/* Mock Navigation */}
                <nav className="mock-nav">
                  <div className="nav-brand">
                    {config.logoUrl ? (
                      <img 
                        src={previewTheme === 'dark' && config.logoLightUrl ? config.logoLightUrl : config.logoUrl} 
                        alt="Logo" 
                      />
                    ) : (
                      <span style={{ color: config.primaryColor }}>{config.companyName}</span>
                    )}
                  </div>
                  <div className="nav-links">
                    <a>Dashboard</a>
                    <a>Workflows</a>
                    <a>Settings</a>
                  </div>
                </nav>

                {/* Mock Content */}
                <main className="mock-content">
                  <h1 style={{ fontFamily: config.headingFont }}>
                    Welcome to {config.companyName}
                  </h1>
                  <p>{config.tagline}</p>
                  
                  <div className="mock-cards">
                    <div className="mock-card">
                      <div className="card-icon" style={{ background: `${config.primaryColor}20`, color: config.primaryColor }}>
                        <Check className="w-5 h-5" />
                      </div>
                      <h3 style={{ fontFamily: config.headingFont }}>Feature One</h3>
                      <p>Description text</p>
                    </div>
                    <div className="mock-card">
                      <div className="card-icon" style={{ background: `${config.secondaryColor}20`, color: config.secondaryColor }}>
                        <Check className="w-5 h-5" />
                      </div>
                      <h3 style={{ fontFamily: config.headingFont }}>Feature Two</h3>
                      <p>Description text</p>
                    </div>
                  </div>

                  <button 
                    className="mock-button"
                    style={{ background: config.primaryColor }}
                  >
                    Get Started
                  </button>
                </main>

                {/* Mock Footer */}
                <footer className="mock-footer">
                  <span>{config.footerText}</span>
                  {!config.hidePoweredBy && (
                    <span className="powered-by">Powered by CUBE AI</span>
                  )}
                </footer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
}
