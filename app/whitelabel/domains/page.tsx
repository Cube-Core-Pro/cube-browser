'use client';

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Globe, Plus, Search, Shield, CheckCircle2,
  Clock, AlertCircle, XCircle, RefreshCw, Loader2,
  Copy, ExternalLink, Settings, Trash2, ChevronDown,
  Lock, Unlock, Server, FileText, HelpCircle
} from 'lucide-react';
import '../whitelabel.css';

// ============================================
// Types
// ============================================

interface Domain {
  id: string;
  domain: string;
  clientId: string;
  clientName: string;
  type: 'subdomain' | 'custom';
  status: 'active' | 'pending' | 'verifying' | 'failed' | 'expired';
  sslStatus: 'active' | 'pending' | 'expired' | 'none';
  sslExpiresAt: string | null;
  verificationMethod: 'dns' | 'file' | null;
  verificationToken: string | null;
  dnsRecords: DnsRecord[];
  createdAt: string;
  verifiedAt: string | null;
}

interface DnsRecord {
  type: 'CNAME' | 'TXT' | 'A';
  name: string;
  value: string;
  status: 'verified' | 'pending' | 'error';
}

interface DomainStats {
  totalDomains: number;
  customDomains: number;
  pendingVerification: number;
  sslActive: number;
  sslExpiringSoon: number;
}

// ============================================
// Main Component
// ============================================

export default function DomainsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [stats, setStats] = useState<DomainStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [selectedClient, setSelectedClient] = useState('');

  useEffect(() => {
    loadDomains();
  }, [filterStatus]);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const [domainsData, statsData] = await Promise.all([
        invoke<Domain[]>('get_all_domains', { status: filterStatus }),
        invoke<DomainStats>('get_domain_stats')
      ]);
      setDomains(domainsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load domains:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setStats({
      totalDomains: 15,
      customDomains: 8,
      pendingVerification: 2,
      sslActive: 13,
      sslExpiringSoon: 1
    });

    setDomains([
      {
        id: '1',
        domain: 'app.techflow.io',
        clientId: 'client-1',
        clientName: 'TechFlow Solutions',
        type: 'custom',
        status: 'active',
        sslStatus: 'active',
        sslExpiresAt: '2026-06-15T00:00:00Z',
        verificationMethod: 'dns',
        verificationToken: null,
        dnsRecords: [
          { type: 'CNAME', name: 'app', value: 'techflow.cubeai.tools', status: 'verified' },
          { type: 'TXT', name: '_cube-verify', value: 'cube-verify=abc123xyz', status: 'verified' }
        ],
        createdAt: '2025-09-20T10:30:00Z',
        verifiedAt: '2025-09-21T08:15:00Z'
      },
      {
        id: '2',
        domain: 'dashboard.growthmetrics.com',
        clientId: 'client-3',
        clientName: 'GrowthMetrics Inc',
        type: 'custom',
        status: 'active',
        sslStatus: 'active',
        sslExpiresAt: '2026-04-20T00:00:00Z',
        verificationMethod: 'dns',
        verificationToken: null,
        dnsRecords: [
          { type: 'CNAME', name: 'dashboard', value: 'growthmetrics.cubeai.tools', status: 'verified' },
          { type: 'TXT', name: '_cube-verify', value: 'cube-verify=def456uvw', status: 'verified' }
        ],
        createdAt: '2025-08-05T14:00:00Z',
        verifiedAt: '2025-08-06T09:30:00Z'
      },
      {
        id: '3',
        domain: 'suite.innovatetech.dev',
        clientId: 'client-7',
        clientName: 'InnovateTech Labs',
        type: 'custom',
        status: 'active',
        sslStatus: 'active',
        sslExpiresAt: '2026-02-28T00:00:00Z',
        verificationMethod: 'dns',
        verificationToken: null,
        dnsRecords: [
          { type: 'CNAME', name: 'suite', value: 'innovatetech.cubeai.tools', status: 'verified' }
        ],
        createdAt: '2025-06-20T11:00:00Z',
        verifiedAt: '2025-06-21T07:45:00Z'
      },
      {
        id: '4',
        domain: 'platform.newclient.com',
        clientId: 'client-10',
        clientName: 'New Client Corp',
        type: 'custom',
        status: 'pending',
        sslStatus: 'none',
        sslExpiresAt: null,
        verificationMethod: 'dns',
        verificationToken: 'cube-verify=pending-token-123',
        dnsRecords: [
          { type: 'CNAME', name: 'platform', value: 'newclient.cubeai.tools', status: 'pending' },
          { type: 'TXT', name: '_cube-verify', value: 'cube-verify=pending-token-123', status: 'pending' }
        ],
        createdAt: '2026-01-05T16:30:00Z',
        verifiedAt: null
      },
      {
        id: '5',
        domain: 'app.faileddomain.io',
        clientId: 'client-11',
        clientName: 'Failed Domain Inc',
        type: 'custom',
        status: 'failed',
        sslStatus: 'none',
        sslExpiresAt: null,
        verificationMethod: 'dns',
        verificationToken: 'cube-verify=old-token',
        dnsRecords: [
          { type: 'CNAME', name: 'app', value: 'faileddomain.cubeai.tools', status: 'error' },
          { type: 'TXT', name: '_cube-verify', value: 'cube-verify=old-token', status: 'error' }
        ],
        createdAt: '2025-12-20T10:00:00Z',
        verifiedAt: null
      },
      {
        id: '6',
        domain: 'techflow.cubeai.tools',
        clientId: 'client-1',
        clientName: 'TechFlow Solutions',
        type: 'subdomain',
        status: 'active',
        sslStatus: 'active',
        sslExpiresAt: '2026-12-31T00:00:00Z',
        verificationMethod: null,
        verificationToken: null,
        dnsRecords: [],
        createdAt: '2025-09-15T10:30:00Z',
        verifiedAt: '2025-09-15T10:30:00Z'
      }
    ]);
  };

  const verifyDomain = async (domainId: string) => {
    setVerifying(domainId);
    try {
      const result = await invoke<boolean>('verify_custom_domain', { domainId });
      if (result) {
        setDomains(domains.map(d => 
          d.id === domainId 
            ? { ...d, status: 'active' as const, verifiedAt: new Date().toISOString() }
            : d
        ));
      } else {
        alert('Domain verification failed. Please check your DNS records.');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      alert('Verification failed. Please try again.');
    } finally {
      setVerifying(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
      active: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Active', className: 'active' },
      pending: { icon: <Clock className="w-3 h-3" />, label: 'Pending', className: 'pending' },
      verifying: { icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Verifying', className: 'verifying' },
      failed: { icon: <XCircle className="w-3 h-3" />, label: 'Failed', className: 'failed' },
      expired: { icon: <AlertCircle className="w-3 h-3" />, label: 'Expired', className: 'expired' }
    };
    const config = configs[status] || configs.pending;
    return (
      <span className={`status-badge ${config.className}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getSslBadge = (sslStatus: string, expiresAt: string | null) => {
    if (sslStatus === 'none') {
      return <span className="ssl-badge none"><Unlock className="w-3 h-3" /> No SSL</span>;
    }
    
    const isExpiring = expiresAt && new Date(expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    if (sslStatus === 'expired') {
      return <span className="ssl-badge expired"><AlertCircle className="w-3 h-3" /> Expired</span>;
    }
    
    if (isExpiring) {
      return <span className="ssl-badge expiring"><AlertCircle className="w-3 h-3" /> Expiring Soon</span>;
    }
    
    return <span className="ssl-badge active"><Lock className="w-3 h-3" /> SSL Active</span>;
  };

  const filteredDomains = domains.filter(d => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      if (!d.domain.toLowerCase().includes(search) && 
          !d.clientName.toLowerCase().includes(search)) {
        return false;
      }
    }
    if (filterStatus !== 'all' && d.status !== filterStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="domains-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => router.push('/whitelabel')}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="header-title">
            <Globe className="w-6 h-6" />
            <div>
              <h1>Domain Management</h1>
              <p>Manage custom domains and SSL certificates</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={loadDomains}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Domain
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="domain-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Globe className="w-5 h-5" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.totalDomains || 0}</span>
            <span className="stat-label">Total Domains</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon custom">
            <Server className="w-5 h-5" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.customDomains || 0}</span>
            <span className="stat-label">Custom Domains</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock className="w-5 h-5" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.pendingVerification || 0}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon ssl">
            <Shield className="w-5 h-5" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.sslActive || 0}</span>
            <span className="stat-label">SSL Active</span>
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box large">
          <Search className="w-4 h-4" />
          <input
            type="text"
            placeholder="Search domains or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Domains List */}
      <div className="domains-list">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p>Loading domains...</p>
          </div>
        ) : filteredDomains.length === 0 ? (
          <div className="empty-state">
            <Globe className="w-12 h-12" />
            <h3>No domains found</h3>
            <p>Add custom domains to your clients' accounts</p>
          </div>
        ) : (
          filteredDomains.map((domain) => (
            <div 
              key={domain.id} 
              className={`domain-card ${domain.status} ${expandedDomain === domain.id ? 'expanded' : ''}`}
            >
              <div 
                className="domain-header"
                onClick={() => setExpandedDomain(expandedDomain === domain.id ? null : domain.id)}
              >
                <div className="domain-info">
                  <div className="domain-icon">
                    {domain.type === 'custom' ? (
                      <Globe className="w-5 h-5" />
                    ) : (
                      <Server className="w-5 h-5" />
                    )}
                  </div>
                  <div className="domain-details">
                    <h3>{domain.domain}</h3>
                    <span className="client-name">{domain.clientName}</span>
                  </div>
                </div>

                <div className="domain-badges">
                  {getStatusBadge(domain.status)}
                  {getSslBadge(domain.sslStatus, domain.sslExpiresAt)}
                  <span className={`type-badge ${domain.type}`}>
                    {domain.type === 'custom' ? 'Custom' : 'Subdomain'}
                  </span>
                </div>

                <div className="domain-actions">
                  {domain.status === 'pending' && (
                    <button
                      className="btn-small primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        verifyDomain(domain.id);
                      }}
                      disabled={verifying === domain.id}
                    >
                      {verifying === domain.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Verify
                        </>
                      )}
                    </button>
                  )}
                  <button 
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://${domain.domain}`, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <ChevronDown className={`chevron ${expandedDomain === domain.id ? 'rotated' : ''}`} />
                </div>
              </div>

              {expandedDomain === domain.id && (
                <div className="domain-expanded">
                  {/* DNS Records */}
                  {domain.type === 'custom' && domain.dnsRecords.length > 0 && (
                    <div className="dns-section">
                      <h4>
                        <FileText className="w-4 h-4" />
                        DNS Records
                      </h4>
                      <div className="dns-records">
                        {domain.dnsRecords.map((record, idx) => (
                          <div key={idx} className={`dns-record ${record.status}`}>
                            <div className="record-type">{record.type}</div>
                            <div className="record-name">
                              <span className="label">Name</span>
                              <code>{record.name}</code>
                              <button 
                                className="copy-btn"
                                onClick={() => copyToClipboard(record.name)}
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="record-value">
                              <span className="label">Value</span>
                              <code>{record.value}</code>
                              <button 
                                className="copy-btn"
                                onClick={() => copyToClipboard(record.value)}
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="record-status">
                              {record.status === 'verified' ? (
                                <CheckCircle2 className="w-4 h-4 success" />
                              ) : record.status === 'error' ? (
                                <XCircle className="w-4 h-4 error" />
                              ) : (
                                <Clock className="w-4 h-4 pending" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SSL Info */}
                  <div className="ssl-section">
                    <h4>
                      <Shield className="w-4 h-4" />
                      SSL Certificate
                    </h4>
                    <div className="ssl-info">
                      <div className="ssl-item">
                        <span className="label">Status</span>
                        <span className="value">{domain.sslStatus === 'active' ? 'Active' : domain.sslStatus === 'none' ? 'Not Configured' : domain.sslStatus}</span>
                      </div>
                      {domain.sslExpiresAt && (
                        <div className="ssl-item">
                          <span className="label">Expires</span>
                          <span className="value">{formatDate(domain.sslExpiresAt)}</span>
                        </div>
                      )}
                      <div className="ssl-item">
                        <span className="label">Provider</span>
                        <span className="value">Let's Encrypt</span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="timestamps">
                    <div className="timestamp">
                      <span className="label">Created</span>
                      <span className="value">{formatDate(domain.createdAt)}</span>
                    </div>
                    {domain.verifiedAt && (
                      <div className="timestamp">
                        <span className="label">Verified</span>
                        <span className="value">{formatDate(domain.verifiedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="domain-footer-actions">
                    <button className="btn-secondary small">
                      <Settings className="w-4 h-4" />
                      Configure
                    </button>
                    {domain.sslStatus !== 'active' && domain.status === 'active' && (
                      <button className="btn-secondary small">
                        <Shield className="w-4 h-4" />
                        Enable SSL
                      </button>
                    )}
                    <button className="btn-secondary small danger">
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Help Section */}
      <section className="help-section">
        <div className="help-card">
          <HelpCircle className="w-6 h-6" />
          <div>
            <h3>Need help with DNS configuration?</h3>
            <p>Check our documentation for step-by-step instructions on setting up custom domains.</p>
          </div>
          <button className="btn-secondary">
            View Documentation
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
