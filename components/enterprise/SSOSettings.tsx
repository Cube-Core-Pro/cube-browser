/**
 * SSO Settings Panel Component
 * 
 * Enterprise SSO/LDAP configuration panel for CUBE Elite v6
 * Supports SAML 2.0, OIDC, and LDAP/Active Directory
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  Shield, 
  Key, 
  Server, 
  Users, 
  Plus, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Trash2,
  Edit,
  TestTube,
  Download,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import './SSOSettings.css';

// Types
interface SSOProvider {
  id: string;
  tenant_id: string;
  name: string;
  protocol: 'SAML' | 'OIDC';
  enabled: boolean;
  status: 'Active' | 'Inactive' | 'Testing';
  entity_id?: string;
  sso_url?: string;
  client_id?: string;
  authorization_url?: string;
  jit_provisioning: boolean;
  default_role: string;
  allowed_domains: string[];
  created_at: string;
  updated_at: string;
}

interface LDAPConfig {
  id: string;
  tenant_id: string;
  name: string;
  enabled: boolean;
  server_url: string;
  port: number;
  use_ssl: boolean;
  use_tls: boolean;
  base_dn: string;
  sync_interval_minutes: number;
  last_sync_at?: string;
  sync_status?: string;
}

interface LDAPGroup {
  id: string;
  common_name: string;
  description?: string;
  mapped_role?: string;
  member_count: number;
}

interface SSOSettingsProps {
  tenantId: string;
  onClose?: () => void;
}

type TabType = 'providers' | 'ldap' | 'audit';

export const SSOSettings: React.FC<SSOSettingsProps> = ({ tenantId, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('providers');
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [ldapConfigs, setLdapConfigs] = useState<LDAPConfig[]>([]);
  const [ldapGroups, setLdapGroups] = useState<LDAPGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showAddLDAP, setShowAddLDAP] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<SSOProvider | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [syncingLDAP, setSyncingLDAP] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [providersData, ldapData] = await Promise.all([
        invoke<SSOProvider[]>('get_tenant_sso_providers', { tenantId }),
        invoke<LDAPConfig[]>('get_tenant_ldap_configs', { tenantId })
      ]);
      setProviders(providersData);
      setLdapConfigs(ldapData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SSO settings');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Test provider connection
  const handleTestProvider = async (providerId: string) => {
    setTestingProvider(providerId);
    try {
      const result = await invoke<{ status: string; message: string }>('test_sso_provider', { providerId });
      alert(result.message);
    } catch (err) {
      alert(`Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTestingProvider(null);
    }
  };

  // Delete provider
  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this SSO provider?')) return;
    try {
      await invoke('delete_sso_provider', { providerId });
      setProviders(providers.filter(p => p.id !== providerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider');
    }
  };

  // Sync LDAP users
  const handleSyncLDAP = async (configId: string) => {
    setSyncingLDAP(configId);
    try {
      const result = await invoke<{ created: number; updated: number; total: number }>('sync_ldap_users', { configId });
      alert(`Sync complete: ${result.created} created, ${result.updated} updated, ${result.total} total users`);
      
      // Load groups after sync
      const groups = await invoke<LDAPGroup[]>('get_ldap_groups', { configId });
      setLdapGroups(groups);
    } catch (err) {
      alert(`Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSyncingLDAP(null);
    }
  };

  // Test LDAP connection
  const handleTestLDAP = async (configId: string) => {
    try {
      const result = await invoke<{ status: string; message: string }>('test_ldap_connection', { configId });
      alert(result.message);
    } catch (err) {
      alert(`Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Get SP Metadata
  const handleDownloadMetadata = async () => {
    try {
      const metadata = await invoke<{ entity_id: string; sso_url: string; certificate: string }>('get_sp_metadata', { tenantId });
      const xml = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${metadata.entity_id}">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${metadata.sso_url}" index="0"/>
  </SPSSODescriptor>
</EntityDescriptor>`;
      
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cube-sp-metadata.xml';
      a.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate metadata');
    }
  };

  if (loading) {
    return (
      <div className="sso-settings">
        <div className="sso-loading">
          <RefreshCw className="animate-spin" size={32} />
          <span>Loading SSO settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sso-settings">
      {/* Header */}
      <div className="sso-header">
        <div className="sso-header-title">
          <Shield size={24} />
          <h2>Single Sign-On & LDAP</h2>
        </div>
        <div className="sso-header-actions">
          <button className="btn-secondary" onClick={handleDownloadMetadata}>
            <Download size={16} />
            SP Metadata
          </button>
          {onClose && (
            <button className="btn-ghost" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="sso-error">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="sso-tabs">
        <button 
          className={`sso-tab ${activeTab === 'providers' ? 'active' : ''}`}
          onClick={() => setActiveTab('providers')}
        >
          <Key size={16} />
          SSO Providers
        </button>
        <button 
          className={`sso-tab ${activeTab === 'ldap' ? 'active' : ''}`}
          onClick={() => setActiveTab('ldap')}
        >
          <Server size={16} />
          LDAP / Active Directory
        </button>
        <button 
          className={`sso-tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <Users size={16} />
          Audit Log
        </button>
      </div>

      {/* Content */}
      <div className="sso-content">
        {/* SSO Providers Tab */}
        {activeTab === 'providers' && (
          <div className="sso-providers">
            <div className="sso-section-header">
              <h3>Identity Providers</h3>
              <button className="btn-primary" onClick={() => setShowAddProvider(true)}>
                <Plus size={16} />
                Add Provider
              </button>
            </div>

            {providers.length === 0 ? (
              <div className="sso-empty">
                <Shield size={48} />
                <h4>No SSO Providers Configured</h4>
                <p>Add a SAML or OIDC identity provider to enable single sign-on for your organization.</p>
                <button className="btn-primary" onClick={() => setShowAddProvider(true)}>
                  <Plus size={16} />
                  Add Your First Provider
                </button>
              </div>
            ) : (
              <div className="sso-provider-list">
                {providers.map(provider => (
                  <div key={provider.id} className={`sso-provider-card ${provider.enabled ? '' : 'disabled'}`}>
                    <div className="provider-icon">
                      {provider.protocol === 'SAML' ? <Shield size={24} /> : <Key size={24} />}
                    </div>
                    <div className="provider-info">
                      <div className="provider-name">
                        {provider.name}
                        <span className={`provider-badge ${provider.protocol.toLowerCase()}`}>
                          {provider.protocol}
                        </span>
                        <span className={`provider-status ${provider.status.toLowerCase()}`}>
                          {provider.status}
                        </span>
                      </div>
                      <div className="provider-details">
                        {provider.protocol === 'SAML' ? (
                          <span>Entity ID: {provider.entity_id}</span>
                        ) : (
                          <span>Client ID: {provider.client_id}</span>
                        )}
                      </div>
                      <div className="provider-meta">
                        <span>JIT Provisioning: {provider.jit_provisioning ? 'Enabled' : 'Disabled'}</span>
                        <span>Default Role: {provider.default_role}</span>
                        {provider.allowed_domains.length > 0 && (
                          <span>Domains: {provider.allowed_domains.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="provider-actions">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleTestProvider(provider.id)}
                        disabled={testingProvider === provider.id}
                        title="Test Connection"
                      >
                        {testingProvider === provider.id ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <TestTube size={16} />
                        )}
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => setSelectedProvider(provider)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => handleDeleteProvider(provider.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LDAP Tab */}
        {activeTab === 'ldap' && (
          <div className="sso-ldap">
            <div className="sso-section-header">
              <h3>LDAP / Active Directory</h3>
              <button className="btn-primary" onClick={() => setShowAddLDAP(true)}>
                <Plus size={16} />
                Add LDAP Server
              </button>
            </div>

            {ldapConfigs.length === 0 ? (
              <div className="sso-empty">
                <Server size={48} />
                <h4>No LDAP Servers Configured</h4>
                <p>Connect your LDAP or Active Directory server to sync users and groups.</p>
                <button className="btn-primary" onClick={() => setShowAddLDAP(true)}>
                  <Plus size={16} />
                  Connect LDAP Server
                </button>
              </div>
            ) : (
              <div className="sso-ldap-list">
                {ldapConfigs.map(config => (
                  <div key={config.id} className={`sso-ldap-card ${config.enabled ? '' : 'disabled'}`}>
                    <div className="ldap-header">
                      <Server size={20} />
                      <span className="ldap-name">{config.name}</span>
                      <span className={`ldap-status ${config.sync_status || 'unknown'}`}>
                        {config.sync_status || 'Not synced'}
                      </span>
                    </div>
                    <div className="ldap-details">
                      <div className="ldap-row">
                        <span>Server:</span>
                        <span>{config.server_url}:{config.port}</span>
                      </div>
                      <div className="ldap-row">
                        <span>Base DN:</span>
                        <span>{config.base_dn}</span>
                      </div>
                      <div className="ldap-row">
                        <span>Security:</span>
                        <span>
                          {config.use_ssl ? 'SSL' : config.use_tls ? 'TLS' : 'None'}
                        </span>
                      </div>
                      <div className="ldap-row">
                        <span>Last Sync:</span>
                        <span>{config.last_sync_at ? new Date(config.last_sync_at).toLocaleString() : 'Never'}</span>
                      </div>
                      <div className="ldap-row">
                        <span>Sync Interval:</span>
                        <span>{config.sync_interval_minutes} minutes</span>
                      </div>
                    </div>
                    <div className="ldap-actions">
                      <button 
                        className="btn-secondary"
                        onClick={() => handleTestLDAP(config.id)}
                      >
                        <TestTube size={14} />
                        Test
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={() => handleSyncLDAP(config.id)}
                        disabled={syncingLDAP === config.id}
                      >
                        {syncingLDAP === config.id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        Sync Now
                      </button>
                      <button className="btn-icon">
                        <Settings size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* LDAP Groups */}
                {ldapGroups.length > 0 && (
                  <div className="ldap-groups">
                    <h4>Synchronized Groups</h4>
                    <div className="ldap-groups-list">
                      {ldapGroups.map(group => (
                        <div key={group.id} className="ldap-group-row">
                          <Users size={16} />
                          <span className="group-name">{group.common_name}</span>
                          <span className="group-count">{group.member_count} members</span>
                          <ChevronRight size={16} />
                          <select 
                            value={group.mapped_role || ''} 
                            onChange={(e) => {
                              // Map group to role
                              invoke('map_ldap_group_role', { 
                                request: { group_id: group.id, role: e.target.value }
                              });
                            }}
                          >
                            <option value="">Select Role...</option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="sso-audit">
            <SSOAuditLog tenantId={tenantId} />
          </div>
        )}
      </div>
    </div>
  );
};

// Audit Log Component
const SSOAuditLog: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [events, setEvents] = useState<Array<{
    id: string;
    event_type: string;
    user_id?: string;
    success: boolean;
    ip_address?: string;
    created_at: string;
    error_message?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAudit = async () => {
      try {
        const data = await invoke<typeof events>('get_sso_audit_log', { 
          tenantId, 
          limit: 50 
        });
        setEvents(data);
      } catch (err) {
        console.error('Failed to load audit log:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAudit();
  }, [tenantId]);

  if (loading) {
    return <div className="audit-loading">Loading audit log...</div>;
  }

  return (
    <div className="audit-log">
      <h3>Authentication Events</h3>
      <div className="audit-table">
        <div className="audit-header">
          <span>Time</span>
          <span>Event</span>
          <span>User</span>
          <span>IP Address</span>
          <span>Status</span>
        </div>
        {events.map(event => (
          <div key={event.id} className={`audit-row ${event.success ? 'success' : 'failure'}`}>
            <span>{new Date(event.created_at).toLocaleString()}</span>
            <span>{event.event_type}</span>
            <span>{event.user_id || '-'}</span>
            <span>{event.ip_address || '-'}</span>
            <span>
              {event.success ? (
                <CheckCircle2 size={14} className="text-green" />
              ) : (
                <XCircle size={14} className="text-red" />
              )}
              {event.error_message && (
                <span className="error-tooltip" title={event.error_message}>
                  <AlertCircle size={12} />
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SSOSettings;
