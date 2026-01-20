'use client';

import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Key,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Trash2,
  Copy,
  ExternalLink,
  Calendar,
  Server,
  Globe,
  FileText,
  Settings,
  X,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import './ssl-certificates.css';

interface Certificate {
  id: string;
  domain: string;
  altDomains: string[];
  issuer: string;
  type: 'EV' | 'OV' | 'DV' | 'Self-Signed';
  status: 'valid' | 'expiring' | 'expired' | 'revoked' | 'pending';
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  fingerprint: string;
  keySize: number;
  algorithm: string;
  autoRenew: boolean;
  managed: boolean;
  lastChecked: string;
}

interface CertificateRequest {
  id: string;
  domain: string;
  status: 'pending' | 'validating' | 'issued' | 'failed';
  type: 'new' | 'renewal';
  requestedAt: string;
  validationMethod: 'dns' | 'http' | 'email';
}

const CERTIFICATES: Certificate[] = [
  {
    id: 'cert-1',
    domain: '*.cube-elite.io',
    altDomains: ['cube-elite.io', 'api.cube-elite.io', 'app.cube-elite.io', 'docs.cube-elite.io'],
    issuer: "Let's Encrypt Authority X3",
    type: 'DV',
    status: 'valid',
    validFrom: '2024-11-15',
    validTo: '2025-02-13',
    daysUntilExpiry: 45,
    fingerprint: 'SHA256:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90',
    keySize: 2048,
    algorithm: 'RSA',
    autoRenew: true,
    managed: true,
    lastChecked: '5 minutes ago'
  },
  {
    id: 'cert-2',
    domain: 'payments.cube-elite.io',
    altDomains: [],
    issuer: 'DigiCert Inc',
    type: 'EV',
    status: 'valid',
    validFrom: '2024-06-01',
    validTo: '2025-06-01',
    daysUntilExpiry: 152,
    fingerprint: 'SHA256:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF',
    keySize: 4096,
    algorithm: 'RSA',
    autoRenew: false,
    managed: false,
    lastChecked: '1 hour ago'
  },
  {
    id: 'cert-3',
    domain: 'internal.cube-corp.local',
    altDomains: ['vpn.cube-corp.local', 'mail.cube-corp.local'],
    issuer: 'CUBE Internal CA',
    type: 'Self-Signed',
    status: 'expiring',
    validFrom: '2024-01-01',
    validTo: '2025-01-10',
    daysUntilExpiry: 12,
    fingerprint: 'SHA256:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD',
    keySize: 2048,
    algorithm: 'RSA',
    autoRenew: false,
    managed: false,
    lastChecked: '30 minutes ago'
  },
  {
    id: 'cert-4',
    domain: 'staging.cube-elite.io',
    altDomains: ['dev.cube-elite.io', 'test.cube-elite.io'],
    issuer: "Let's Encrypt Authority X3",
    type: 'DV',
    status: 'expired',
    validFrom: '2024-06-15',
    validTo: '2024-09-13',
    daysUntilExpiry: -108,
    fingerprint: 'SHA256:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78',
    keySize: 2048,
    algorithm: 'RSA',
    autoRenew: true,
    managed: true,
    lastChecked: '2 hours ago'
  },
  {
    id: 'cert-5',
    domain: 'api-v2.cube-elite.io',
    altDomains: [],
    issuer: 'Cloudflare Inc ECC CA-3',
    type: 'DV',
    status: 'valid',
    validFrom: '2024-12-01',
    validTo: '2025-12-01',
    daysUntilExpiry: 337,
    fingerprint: 'SHA256:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34',
    keySize: 256,
    algorithm: 'ECDSA',
    autoRenew: true,
    managed: true,
    lastChecked: '15 minutes ago'
  }
];

const PENDING_REQUESTS: CertificateRequest[] = [
  {
    id: 'req-1',
    domain: 'new-service.cube-elite.io',
    status: 'validating',
    type: 'new',
    requestedAt: '10 minutes ago',
    validationMethod: 'dns'
  },
  {
    id: 'req-2',
    domain: 'blog.cube-elite.io',
    status: 'pending',
    type: 'new',
    requestedAt: '2 hours ago',
    validationMethod: 'http'
  }
];

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  valid: { color: 'success', label: 'Valid', icon: CheckCircle },
  expiring: { color: 'warning', label: 'Expiring Soon', icon: AlertTriangle },
  expired: { color: 'danger', label: 'Expired', icon: AlertCircle },
  revoked: { color: 'danger', label: 'Revoked', icon: AlertCircle },
  pending: { color: 'info', label: 'Pending', icon: Clock }
};

const TYPE_CONFIG: Record<string, { color: string; label: string; description: string }> = {
  'EV': { color: 'success', label: 'EV', description: 'Extended Validation' },
  'OV': { color: 'info', label: 'OV', description: 'Organization Validation' },
  'DV': { color: 'primary', label: 'DV', description: 'Domain Validation' },
  'Self-Signed': { color: 'warning', label: 'Self', description: 'Self-Signed' }
};

export default function SSLCertificatesPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'requests' | 'ca'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedCert, setExpandedCert] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>(CERTIFICATES);

  const activeCerts = certificates.filter(c => c.status === 'valid').length;
  const expiringCerts = certificates.filter(c => c.status === 'expiring' || c.daysUntilExpiry <= 30).length;
  const expiredCerts = certificates.filter(c => c.status === 'expired').length;
  const autoRenewEnabled = certificates.filter(c => c.autoRenew).length;

  const filteredCerts = certificates.filter(cert => {
    const matchesSearch = cert.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cert.issuer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || cert.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const toggleAutoRenew = (certId: string) => {
    setCertificates(prev => prev.map(cert =>
      cert.id === certId ? { ...cert, autoRenew: !cert.autoRenew } : cert
    ));
  };

  const getExpiryColor = (days: number): string => {
    if (days <= 0) return 'danger';
    if (days <= 14) return 'danger';
    if (days <= 30) return 'warning';
    return 'success';
  };

  return (
    <div className="ssl-certificates">
      <header className="ssl-certificates__header">
        <div className="ssl-certificates__title-section">
          <div className="ssl-certificates__icon">
            <Shield size={28} />
          </div>
          <div>
            <h1>SSL/TLS Certificates</h1>
            <p>Manage certificates, renewals, and encryption settings</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Check All
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Request Certificate
          </button>
        </div>
      </header>

      <div className="ssl-certificates__stats">
        <div className="stat-card">
          <div className="stat-icon valid">
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{activeCerts}</span>
            <span className="stat-label">Active Certificates</span>
          </div>
          <span className="stat-secondary">{certificates.length} total</span>
        </div>
        <div className="stat-card warning-glow">
          <div className="stat-icon expiring">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{expiringCerts}</span>
            <span className="stat-label">Expiring Soon</span>
          </div>
          <span className="stat-secondary">within 30 days</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon expired">
            <AlertCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{expiredCerts}</span>
            <span className="stat-label">Expired</span>
          </div>
          <span className="stat-trend danger">Needs attention</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon auto">
            <RefreshCw size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{autoRenewEnabled}</span>
            <span className="stat-label">Auto-Renew Enabled</span>
          </div>
          <span className="stat-secondary">of {certificates.length}</span>
        </div>
      </div>

      <div className="ssl-certificates__tabs">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <Lock size={16} />
          Active Certificates
        </button>
        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <Clock size={16} />
          Pending Requests
          {PENDING_REQUESTS.length > 0 && (
            <span className="tab-badge">{PENDING_REQUESTS.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'ca' ? 'active' : ''}`}
          onClick={() => setActiveTab('ca')}
        >
          <Key size={16} />
          Certificate Authorities
        </button>
      </div>

      {activeTab === 'active' && (
        <div className="certificates-section">
          <div className="certificates-filters">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search certificates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="status-filter">
              {['all', 'valid', 'expiring', 'expired'].map(status => (
                <button
                  key={status}
                  className={`status-btn ${selectedStatus === status ? 'active' : ''}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status === 'all' ? 'All' : STATUS_CONFIG[status]?.label || status}
                </button>
              ))}
            </div>
          </div>

          <div className="certificates-list">
            {filteredCerts.map(cert => {
              const StatusIcon = STATUS_CONFIG[cert.status].icon;
              return (
                <div key={cert.id} className={`cert-card ${cert.status}`}>
                  <div className="cert-main">
                    <div className={`cert-status-icon ${STATUS_CONFIG[cert.status].color}`}>
                      <StatusIcon size={20} />
                    </div>
                    <div className="cert-info">
                      <div className="cert-header">
                        <h3>{cert.domain}</h3>
                        <div className="cert-badges">
                          <span className={`type-badge ${TYPE_CONFIG[cert.type].color}`}>
                            {TYPE_CONFIG[cert.type].label}
                          </span>
                          <span className={`status-badge ${STATUS_CONFIG[cert.status].color}`}>
                            {STATUS_CONFIG[cert.status].label}
                          </span>
                          {cert.managed && (
                            <span className="managed-badge">Managed</span>
                          )}
                        </div>
                      </div>
                      <p className="cert-issuer">Issued by {cert.issuer}</p>
                      <div className="cert-meta">
                        <span className="meta-item">
                          <Key size={12} />
                          {cert.algorithm} {cert.keySize}-bit
                        </span>
                        <span className="meta-item">
                          <Calendar size={12} />
                          Valid until {cert.validTo}
                        </span>
                        <span className="meta-item">
                          <Clock size={12} />
                          Checked {cert.lastChecked}
                        </span>
                      </div>
                    </div>
                    <div className="cert-expiry">
                      <div className={`expiry-display ${getExpiryColor(cert.daysUntilExpiry)}`}>
                        <span className="expiry-value">
                          {cert.daysUntilExpiry > 0 ? cert.daysUntilExpiry : Math.abs(cert.daysUntilExpiry)}
                        </span>
                        <span className="expiry-label">
                          {cert.daysUntilExpiry > 0 ? 'days left' : 'days expired'}
                        </span>
                      </div>
                    </div>
                    <div className="cert-auto-renew">
                      <span className="auto-renew-label">Auto-Renew</span>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={cert.autoRenew}
                          onChange={() => toggleAutoRenew(cert.id)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="cert-actions">
                      <button
                        className="expand-btn"
                        onClick={() => setExpandedCert(expandedCert === cert.id ? null : cert.id)}
                      >
                        {expandedCert === cert.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                      <button className="action-btn" title="View">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn" title="Download">
                        <Download size={16} />
                      </button>
                      <button className="action-btn" title="Renew">
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>
                  {expandedCert === cert.id && (
                    <div className="cert-expanded">
                      <div className="expanded-grid">
                        <div className="expanded-section">
                          <h4>Alternative Names</h4>
                          {cert.altDomains.length > 0 ? (
                            <div className="domain-tags">
                              {cert.altDomains.map(domain => (
                                <span key={domain} className="domain-tag">
                                  <Globe size={12} />
                                  {domain}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="no-data">No alternative names</span>
                          )}
                        </div>
                        <div className="expanded-section">
                          <h4>Fingerprint</h4>
                          <div className="fingerprint-display">
                            <code>{cert.fingerprint}</code>
                            <button className="copy-btn" title="Copy">
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="expanded-section">
                          <h4>Validity Period</h4>
                          <div className="validity-info">
                            <div className="validity-item">
                              <span className="validity-label">From</span>
                              <span className="validity-value">{cert.validFrom}</span>
                            </div>
                            <div className="validity-item">
                              <span className="validity-label">To</span>
                              <span className="validity-value">{cert.validTo}</span>
                            </div>
                          </div>
                        </div>
                        <div className="expanded-section">
                          <h4>Key Information</h4>
                          <div className="key-info">
                            <span className="key-item">Algorithm: {cert.algorithm}</span>
                            <span className="key-item">Key Size: {cert.keySize}-bit</span>
                          </div>
                        </div>
                      </div>
                      <div className="expanded-actions">
                        <button className="btn-sm">
                          <FileText size={14} />
                          View Full Certificate
                        </button>
                        <button className="btn-sm">
                          <Download size={14} />
                          Download PEM
                        </button>
                        <button className="btn-sm danger">
                          <Trash2 size={14} />
                          Revoke Certificate
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

      {activeTab === 'requests' && (
        <div className="requests-section">
          {PENDING_REQUESTS.length > 0 ? (
            <div className="requests-list">
              {PENDING_REQUESTS.map(request => (
                <div key={request.id} className="request-card">
                  <div className={`request-status-icon ${request.status}`}>
                    {request.status === 'validating' ? (
                      <RefreshCw size={20} className="spinning" />
                    ) : (
                      <Clock size={20} />
                    )}
                  </div>
                  <div className="request-info">
                    <div className="request-header">
                      <h3>{request.domain}</h3>
                      <div className="request-badges">
                        <span className={`type-badge ${request.type}`}>
                          {request.type === 'new' ? 'New' : 'Renewal'}
                        </span>
                        <span className={`status-badge ${request.status}`}>
                          {request.status === 'validating' ? 'Validating...' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="request-meta">
                      <span className="meta-item">
                        <Clock size={12} />
                        Requested {request.requestedAt}
                      </span>
                      <span className="meta-item">
                        <Server size={12} />
                        {request.validationMethod.toUpperCase()} validation
                      </span>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button className="action-btn" title="View Details">
                      <Eye size={16} />
                    </button>
                    <button className="action-btn danger" title="Cancel">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Clock size={48} />
              <h3>No Pending Requests</h3>
              <p>All certificate requests have been processed</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ca' && (
        <div className="ca-section">
          <div className="ca-grid">
            <div className="ca-card trusted">
              <div className="ca-header">
                <div className="ca-icon">
                  <Shield size={24} />
                </div>
                <div>
                  <h3>Let's Encrypt</h3>
                  <span className="ca-status">Trusted</span>
                </div>
              </div>
              <p className="ca-description">Free, automated SSL/TLS certificates with auto-renewal support</p>
              <div className="ca-stats">
                <div className="ca-stat">
                  <span className="ca-stat-value">3</span>
                  <span className="ca-stat-label">Certificates</span>
                </div>
                <div className="ca-stat">
                  <span className="ca-stat-value">DV</span>
                  <span className="ca-stat-label">Cert Type</span>
                </div>
              </div>
              <button className="ca-btn">
                <Settings size={14} />
                Configure
              </button>
            </div>
            <div className="ca-card trusted">
              <div className="ca-header">
                <div className="ca-icon premium">
                  <Shield size={24} />
                </div>
                <div>
                  <h3>DigiCert</h3>
                  <span className="ca-status">Trusted</span>
                </div>
              </div>
              <p className="ca-description">Enterprise-grade EV and OV certificates for high-assurance needs</p>
              <div className="ca-stats">
                <div className="ca-stat">
                  <span className="ca-stat-value">1</span>
                  <span className="ca-stat-label">Certificates</span>
                </div>
                <div className="ca-stat">
                  <span className="ca-stat-value">EV</span>
                  <span className="ca-stat-label">Cert Type</span>
                </div>
              </div>
              <button className="ca-btn">
                <Settings size={14} />
                Configure
              </button>
            </div>
            <div className="ca-card internal">
              <div className="ca-header">
                <div className="ca-icon internal">
                  <Key size={24} />
                </div>
                <div>
                  <h3>CUBE Internal CA</h3>
                  <span className="ca-status internal">Internal</span>
                </div>
              </div>
              <p className="ca-description">Private certificate authority for internal services and VPN</p>
              <div className="ca-stats">
                <div className="ca-stat">
                  <span className="ca-stat-value">1</span>
                  <span className="ca-stat-label">Certificates</span>
                </div>
                <div className="ca-stat">
                  <span className="ca-stat-value">Self</span>
                  <span className="ca-stat-label">Cert Type</span>
                </div>
              </div>
              <button className="ca-btn">
                <Settings size={14} />
                Manage CA
              </button>
            </div>
            <div className="ca-card add">
              <div className="ca-add-content">
                <Plus size={32} />
                <h3>Add Certificate Authority</h3>
                <p>Connect a new CA provider or upload a custom root certificate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request SSL Certificate</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Domain Name</label>
                <input type="text" placeholder="e.g., api.cube-elite.io" />
              </div>
              <div className="form-group">
                <label>Alternative Names (Optional)</label>
                <textarea placeholder="One domain per line&#10;www.example.com&#10;api.example.com" rows={3} />
                <span className="form-hint">Add additional domains to be included in the certificate</span>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Certificate Authority</label>
                  <select>
                    <option value="letsencrypt">Let's Encrypt (Free)</option>
                    <option value="digicert">DigiCert (Paid)</option>
                    <option value="cloudflare">Cloudflare</option>
                    <option value="internal">Internal CA</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Validation Method</label>
                  <select>
                    <option value="dns">DNS Challenge</option>
                    <option value="http">HTTP Challenge</option>
                    <option value="email">Email Validation</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Key Algorithm</label>
                  <select>
                    <option value="rsa-2048">RSA 2048-bit</option>
                    <option value="rsa-4096">RSA 4096-bit</option>
                    <option value="ecdsa-256">ECDSA P-256</option>
                    <option value="ecdsa-384">ECDSA P-384</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Validity Period</label>
                  <select>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                    <option value="730">2 years</option>
                  </select>
                </div>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Enable auto-renewal before expiration</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                <Lock size={16} />
                Request Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
