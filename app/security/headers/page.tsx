'use client';

import React, { useState } from 'react';
import {
  Shield,
  FileCode,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Download,
  RefreshCw,
  Copy,
  Edit2,
  Trash2,
  Info,
  X,
  ChevronDown,
  ChevronRight,
  Globe,
  Code,
  Zap,
  ExternalLink
} from 'lucide-react';
import './security-headers.css';

interface SecurityHeader {
  id: string;
  name: string;
  value: string;
  description: string;
  category: 'xss' | 'clickjacking' | 'transport' | 'content' | 'permissions' | 'csp';
  enabled: boolean;
  recommended: boolean;
  impact: 'critical' | 'high' | 'medium' | 'low';
  compatibility: string;
}

interface HeaderPreset {
  id: string;
  name: string;
  description: string;
  headers: string[];
  securityLevel: 'strict' | 'balanced' | 'permissive';
}

const SECURITY_HEADERS: SecurityHeader[] = [
  {
    id: 'csp',
    name: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.cube-elite.io",
    description: 'Controls resources the browser is allowed to load for the page, mitigating XSS and data injection attacks',
    category: 'csp',
    enabled: true,
    recommended: true,
    impact: 'critical',
    compatibility: 'All modern browsers'
  },
  {
    id: 'hsts',
    name: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
    description: 'Forces browsers to use HTTPS for all future requests to the domain',
    category: 'transport',
    enabled: true,
    recommended: true,
    impact: 'critical',
    compatibility: 'All modern browsers'
  },
  {
    id: 'xfo',
    name: 'X-Frame-Options',
    value: 'DENY',
    description: 'Prevents the page from being embedded in iframes, protecting against clickjacking',
    category: 'clickjacking',
    enabled: true,
    recommended: true,
    impact: 'high',
    compatibility: 'All browsers'
  },
  {
    id: 'xcto',
    name: 'X-Content-Type-Options',
    value: 'nosniff',
    description: 'Prevents browsers from MIME-sniffing a response away from the declared content-type',
    category: 'content',
    enabled: true,
    recommended: true,
    impact: 'medium',
    compatibility: 'All modern browsers'
  },
  {
    id: 'xxss',
    name: 'X-XSS-Protection',
    value: '1; mode=block',
    description: 'Enables the cross-site scripting filter built into most browsers',
    category: 'xss',
    enabled: true,
    recommended: false,
    impact: 'low',
    compatibility: 'Legacy - deprecated in modern browsers'
  },
  {
    id: 'rp',
    name: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
    description: 'Controls how much referrer information is included with requests',
    category: 'content',
    enabled: true,
    recommended: true,
    impact: 'medium',
    compatibility: 'All modern browsers'
  },
  {
    id: 'pp',
    name: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
    description: 'Controls which browser features and APIs can be used on the page',
    category: 'permissions',
    enabled: true,
    recommended: true,
    impact: 'medium',
    compatibility: 'Chrome, Edge, Firefox'
  },
  {
    id: 'coop',
    name: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
    description: 'Isolates the browsing context from cross-origin documents',
    category: 'content',
    enabled: false,
    recommended: true,
    impact: 'high',
    compatibility: 'All modern browsers'
  },
  {
    id: 'coep',
    name: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp',
    description: 'Prevents documents from loading cross-origin resources that don\'t explicitly grant permission',
    category: 'content',
    enabled: false,
    recommended: false,
    impact: 'medium',
    compatibility: 'Chrome, Firefox'
  },
  {
    id: 'corp',
    name: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
    description: 'Protects against certain cross-origin requests like Spectre attacks',
    category: 'content',
    enabled: true,
    recommended: true,
    impact: 'medium',
    compatibility: 'All modern browsers'
  }
];

const PRESETS: HeaderPreset[] = [
  {
    id: 'strict',
    name: 'Maximum Security',
    description: 'Strictest settings for highest security. May break some features.',
    headers: ['csp', 'hsts', 'xfo', 'xcto', 'rp', 'pp', 'coop', 'coep', 'corp'],
    securityLevel: 'strict'
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Recommended balance between security and compatibility.',
    headers: ['csp', 'hsts', 'xfo', 'xcto', 'rp', 'pp', 'corp'],
    securityLevel: 'balanced'
  },
  {
    id: 'permissive',
    name: 'Permissive',
    description: 'Minimal restrictions for development or legacy support.',
    headers: ['hsts', 'xfo', 'xcto'],
    securityLevel: 'permissive'
  }
];

const CATEGORY_CONFIG: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  'csp': { color: 'primary', label: 'CSP', icon: Shield },
  'xss': { color: 'danger', label: 'XSS Protection', icon: AlertTriangle },
  'clickjacking': { color: 'warning', label: 'Clickjacking', icon: Eye },
  'transport': { color: 'success', label: 'Transport', icon: Lock },
  'content': { color: 'info', label: 'Content', icon: FileCode },
  'permissions': { color: 'purple', label: 'Permissions', icon: Shield }
};

const IMPACT_CONFIG: Record<string, { color: string; label: string }> = {
  'critical': { color: 'danger', label: 'Critical' },
  'high': { color: 'warning', label: 'High' },
  'medium': { color: 'info', label: 'Medium' },
  'low': { color: 'muted', label: 'Low' }
};

export default function SecurityHeadersPage() {
  const [activeTab, setActiveTab] = useState<'headers' | 'presets' | 'test'>('headers');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState<SecurityHeader | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [headers, setHeaders] = useState<SecurityHeader[]>(SECURITY_HEADERS);
  const [expandedHeader, setExpandedHeader] = useState<string | null>(null);

  const enabledHeaders = headers.filter(h => h.enabled).length;
  const criticalEnabled = headers.filter(h => h.enabled && h.impact === 'critical').length;
  const criticalTotal = headers.filter(h => h.impact === 'critical').length;
  const securityScore = Math.round((enabledHeaders / headers.length) * 100);

  const filteredHeaders = headers.filter(header => {
    const matchesSearch = header.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         header.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || header.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleHeader = (headerId: string) => {
    setHeaders(prev => prev.map(h =>
      h.id === headerId ? { ...h, enabled: !h.enabled } : h
    ));
  };

  const openEditModal = (header: SecurityHeader) => {
    setSelectedHeader(header);
    setShowEditModal(true);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  return (
    <div className="security-headers">
      <header className="security-headers__header">
        <div className="security-headers__title-section">
          <div className="security-headers__icon">
            <FileCode size={28} />
          </div>
          <div>
            <h1>Security Headers</h1>
            <p>Configure HTTP security headers for enhanced protection</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Test Headers
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export Config
          </button>
          <button className="btn-primary">
            <Zap size={16} />
            Apply Changes
          </button>
        </div>
      </header>

      <div className="security-headers__stats">
        <div className="stat-card score-card">
          <div className={`score-circle ${getScoreColor(securityScore)}`}>
            <span className="score-value">{securityScore}</span>
            <span className="score-label">Score</span>
          </div>
          <div className="stat-content">
            <span className="stat-value">Security Grade</span>
            <span className="stat-label">{securityScore >= 80 ? 'Excellent' : securityScore >= 60 ? 'Good' : 'Needs Improvement'}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon enabled">
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{enabledHeaders}/{headers.length}</span>
            <span className="stat-label">Headers Enabled</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon critical">
            <Shield size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{criticalEnabled}/{criticalTotal}</span>
            <span className="stat-label">Critical Headers</span>
          </div>
          {criticalEnabled < criticalTotal && (
            <span className="stat-warning">
              <AlertTriangle size={14} />
              {criticalTotal - criticalEnabled} disabled
            </span>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-icon recommended">
            <Zap size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{headers.filter(h => h.enabled && h.recommended).length}</span>
            <span className="stat-label">Recommended Active</span>
          </div>
        </div>
      </div>

      <div className="security-headers__tabs">
        <button
          className={`tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
          onClick={() => setActiveTab('headers')}
        >
          <FileCode size={16} />
          Headers
        </button>
        <button
          className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          <Zap size={16} />
          Presets
        </button>
        <button
          className={`tab-btn ${activeTab === 'test' ? 'active' : ''}`}
          onClick={() => setActiveTab('test')}
        >
          <Globe size={16} />
          Test Results
        </button>
      </div>

      {activeTab === 'headers' && (
        <div className="headers-section">
          <div className="headers-filters">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search headers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="category-filter">
              <button
                className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </button>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  className={`category-btn ${selectedCategory === key ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(key)}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          <div className="headers-list">
            {filteredHeaders.map(header => {
              const CategoryIcon = CATEGORY_CONFIG[header.category].icon;
              return (
                <div key={header.id} className={`header-card ${!header.enabled ? 'disabled' : ''}`}>
                  <div className="header-main">
                    <div className="header-toggle">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={header.enabled}
                          onChange={() => toggleHeader(header.id)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className={`header-category-icon ${CATEGORY_CONFIG[header.category].color}`}>
                      <CategoryIcon size={18} />
                    </div>
                    <div className="header-info">
                      <div className="header-name-row">
                        <h3>{header.name}</h3>
                        <div className="header-badges">
                          <span className={`impact-badge ${IMPACT_CONFIG[header.impact].color}`}>
                            {IMPACT_CONFIG[header.impact].label}
                          </span>
                          {header.recommended && (
                            <span className="recommended-badge">
                              <CheckCircle size={12} />
                              Recommended
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="header-description">{header.description}</p>
                    </div>
                    <div className="header-actions">
                      <button
                        className="expand-btn"
                        onClick={() => setExpandedHeader(expandedHeader === header.id ? null : header.id)}
                      >
                        {expandedHeader === header.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                      <button className="action-btn" onClick={() => openEditModal(header)}>
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                  {expandedHeader === header.id && (
                    <div className="header-expanded">
                      <div className="value-section">
                        <h4>Current Value</h4>
                        <div className="value-display">
                          <code>{header.value}</code>
                          <button className="copy-btn" title="Copy">
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="compatibility-section">
                        <h4>Browser Compatibility</h4>
                        <span className="compatibility-text">{header.compatibility}</span>
                      </div>
                      <div className="expanded-actions">
                        <button className="btn-sm" onClick={() => openEditModal(header)}>
                          <Edit2 size={14} />
                          Edit Value
                        </button>
                        <button className="btn-sm">
                          <Info size={14} />
                          Learn More
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'presets' && (
        <div className="presets-section">
          <div className="presets-grid">
            {PRESETS.map(preset => (
              <div key={preset.id} className={`preset-card ${preset.securityLevel}`}>
                <div className="preset-header">
                  <div className={`preset-icon ${preset.securityLevel}`}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3>{preset.name}</h3>
                    <span className={`level-badge ${preset.securityLevel}`}>
                      {preset.securityLevel}
                    </span>
                  </div>
                </div>
                <p className="preset-description">{preset.description}</p>
                <div className="preset-headers">
                  <h4>Included Headers ({preset.headers.length})</h4>
                  <div className="header-tags">
                    {preset.headers.slice(0, 5).map(headerId => {
                      const header = headers.find(h => h.id === headerId);
                      return header ? (
                        <span key={headerId} className="header-tag">{header.name}</span>
                      ) : null;
                    })}
                    {preset.headers.length > 5 && (
                      <span className="header-tag more">+{preset.headers.length - 5} more</span>
                    )}
                  </div>
                </div>
                <button className="apply-preset-btn">
                  <Zap size={14} />
                  Apply Preset
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'test' && (
        <div className="test-section">
          <div className="test-card">
            <div className="test-header">
              <h3>Security Headers Test</h3>
              <button className="btn-outline">
                <RefreshCw size={14} />
                Run Test
              </button>
            </div>
            <div className="test-url">
              <label>Test URL</label>
              <div className="url-input-group">
                <input type="text" defaultValue="https://app.cube-elite.io" />
                <button className="test-btn">
                  <Globe size={14} />
                  Test
                </button>
              </div>
            </div>
            <div className="test-results">
              <div className="result-placeholder">
                <Shield size={48} />
                <h4>Run a test to see results</h4>
                <p>Enter a URL and click Test to analyze security headers</p>
              </div>
            </div>
          </div>
          <div className="external-tools">
            <h3>External Testing Tools</h3>
            <div className="tools-grid">
              <a href="#" className="tool-link">
                <Globe size={18} />
                <span>SecurityHeaders.com</span>
                <ExternalLink size={14} />
              </a>
              <a href="#" className="tool-link">
                <Globe size={18} />
                <span>Mozilla Observatory</span>
                <ExternalLink size={14} />
              </a>
              <a href="#" className="tool-link">
                <Globe size={18} />
                <span>SSL Labs</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedHeader && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit {selectedHeader.name}</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="info-box">
                <Info size={16} />
                <p>{selectedHeader.description}</p>
              </div>
              <div className="form-group">
                <label>Header Value</label>
                <textarea
                  rows={4}
                  defaultValue={selectedHeader.value}
                  className="code-input"
                />
                <span className="form-hint">Use the appropriate syntax for this header type</span>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked={selectedHeader.enabled} />
                  <span>Enable this header</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                <CheckCircle size={16} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
