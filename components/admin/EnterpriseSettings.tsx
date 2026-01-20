'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  OrganizationService,
  SSOService,
  LDAPService,
  TenantService,
  RoleService,
  EnterpriseAuditService,
  WhiteLabelService,
} from '@/lib/services/enterprise-service';
import type {
  Organization,
  SSOConfig,
  LDAPConfig,
  Tenant,
  Role,
  EnterpriseAuditLog,
  OrganizationBranding,
  SSOProvider,
} from '@/lib/services/enterprise-service';
import {
  Building2, Shield, Key, Palette,
  Server, UserCheck, RefreshCw, CheckCircle,
  XCircle, AlertTriangle, Eye, EyeOff, Copy,
  Plus, Trash2, Edit, Search, Download,
  FileText, Activity, Layers,
} from 'lucide-react';
import './EnterpriseSettings.css';

// ============================================================================
// Types
// ============================================================================

type EnterpriseTab = 
  | 'organization' 
  | 'sso' 
  | 'ldap' 
  | 'tenants' 
  | 'roles' 
  | 'licenses' 
  | 'audit' 
  | 'whitelabel';

interface TabConfig {
  id: EnterpriseTab;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// ============================================================================
// Component
// ============================================================================

export const EnterpriseSettings: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<EnterpriseTab>('organization');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Organization State
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgForm, setOrgForm] = useState({
    name: '',
    slug: '',
    contactEmail: '',
    domain: '',
  });

  // SSO State
  const [ssoConfig, setSsoConfig] = useState<SSOConfig | null>(null);
  const [ssoForm, setSsoForm] = useState<{
    provider: SSOProvider;
    entityId: string;
    ssoUrl: string;
    certificate: string;
    autoProvision: boolean;
    defaultRole: string;
  }>({
    provider: 'saml',
    entityId: '',
    ssoUrl: '',
    certificate: '',
    autoProvision: true,
    defaultRole: 'member',
  });
  const [showSsoSecret, setShowSsoSecret] = useState(false);

  // LDAP State
  const [ldapConfig, setLdapConfig] = useState<LDAPConfig | null>(null);
  const [ldapForm, setLdapForm] = useState({
    serverUrl: '',
    port: 389,
    useSsl: false,
    bindDn: '',
    bindPassword: '',
    baseDn: '',
    userSearchFilter: '(uid={{username}})',
    syncInterval: 60,
  });
  const [showLdapPassword, setShowLdapPassword] = useState(false);
  const [ldapTestResult, setLdapTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Tenants State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [_selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantForm, setTenantForm] = useState({
    name: '',
    slug: '',
    maxUsers: 100,
    maxStorage: 10737418240, // 10GB
  });

  // Roles State
  const [roles, setRoles] = useState<Role[]>([]);
  const [_selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  // Audit State
  const [auditLogs, setAuditLogs] = useState<EnterpriseAuditLog[]>([]);
  const [auditFilters, setAuditFilters] = useState({
    userId: '',
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
  });

  // WhiteLabel State
  const [_whiteLabelConfig, setWhiteLabelConfig] = useState<OrganizationBranding | null>(null);
  const [whiteLabelForm, setWhiteLabelForm] = useState({
    appName: 'CUBE Elite',
    companyName: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    logoUrl: '',
    faviconUrl: '',
    customCss: '',
    hidePoweredBy: false,
  });

  // Tab configuration
  const tabs: TabConfig[] = [
    { id: 'organization', label: 'Organization', icon: <Building2 size={18} />, description: 'Manage organization settings' },
    { id: 'sso', label: 'SSO', icon: <Shield size={18} />, description: 'Single Sign-On configuration' },
    { id: 'ldap', label: 'LDAP', icon: <Server size={18} />, description: 'LDAP/Active Directory sync' },
    { id: 'tenants', label: 'Tenants', icon: <Layers size={18} />, description: 'Multi-tenant management' },
    { id: 'roles', label: 'Roles', icon: <UserCheck size={18} />, description: 'Role-based access control' },
    { id: 'licenses', label: 'Licenses', icon: <Key size={18} />, description: 'License management' },
    { id: 'audit', label: 'Audit Log', icon: <FileText size={18} />, description: 'Security audit trail' },
    { id: 'whitelabel', label: 'White Label', icon: <Palette size={18} />, description: 'Branding customization' },
  ];

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadOrganization = useCallback(async () => {
    try {
      setLoading(true);
      const org = await OrganizationService.get('current');
      if (org) {
        setOrganization(org);
        setOrgForm({
          name: org.name,
          slug: org.slug,
          contactEmail: org.contactEmail,
          domain: org.domain || '',
        });
      }
    } catch (_err) {
      setError('Failed to load organization');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSsoConfig = useCallback(async () => {
    if (!organization) return;
    try {
      setLoading(true);
      const config = await SSOService.getConfig(organization.id);
      if (config) {
        setSsoConfig(config);
        if (config.saml) {
          setSsoForm({
            provider: 'saml',
            entityId: config.saml.entityId,
            ssoUrl: config.saml.ssoUrl,
            certificate: config.saml.certificate,
            autoProvision: config.autoProvision,
            defaultRole: config.defaultRole,
          });
        }
      }
    } catch (_err) {
      setError('Failed to load SSO configuration');
    } finally {
      setLoading(false);
    }
  }, [organization]);

  const loadLdapConfig = useCallback(async () => {
    if (!organization) return;
    try {
      setLoading(true);
      const config = await LDAPService.getConfig(organization.id);
      if (config) {
        setLdapConfig(config);
        setLdapForm({
          serverUrl: config.serverUrl,
          port: config.port,
          useSsl: config.useSsl,
          bindDn: config.bindDn,
          bindPassword: '',
          baseDn: config.baseDn,
          userSearchFilter: config.userSearchFilter,
          syncInterval: config.syncInterval,
        });
      }
    } catch (_err) {
      setError('Failed to load LDAP configuration');
    } finally {
      setLoading(false);
    }
  }, [organization]);

  const loadTenants = useCallback(async () => {
    if (!organization) return;
    try {
      setLoading(true);
      const data = await TenantService.getAll(organization.id);
      setTenants(data);
    } catch (_err) {
      setError('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }, [organization]);

  const loadRoles = useCallback(async () => {
    if (!organization) return;
    try {
      setLoading(true);
      const data = await RoleService.getAll(organization.id);
      setRoles(data);
    } catch (_err) {
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [organization]);

  const loadAuditLogs = useCallback(async () => {
    if (!organization) return;
    try {
      setLoading(true);
      const result = await EnterpriseAuditService.getLogs(organization.id, {
        actorId: auditFilters.userId || undefined,
        action: auditFilters.action || undefined,
        resourceType: auditFilters.resourceType || undefined,
        startDate: auditFilters.startDate ? new Date(auditFilters.startDate).getTime() : undefined,
        endDate: auditFilters.endDate ? new Date(auditFilters.endDate).getTime() : undefined,
        limit: 100,
      });
      setAuditLogs(result.logs);
    } catch (_err) {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [organization, auditFilters]);

  const loadWhiteLabelConfig = useCallback(async () => {
    if (!organization) return;
    try {
      setLoading(true);
      const branding = await WhiteLabelService.getBranding(organization.id);
      if (branding) {
        setWhiteLabelConfig(branding);
        setWhiteLabelForm({
          appName: 'CUBE Elite',
          companyName: branding.footerText || '',
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          logoUrl: branding.logoUrl || '',
          faviconUrl: branding.faviconUrl || '',
          customCss: branding.customCss || '',
          hidePoweredBy: false,
        });
      }
    } catch (_err) {
      setError('Failed to load white label configuration');
    } finally {
      setLoading(false);
    }
  }, [organization]);

  // Initial load
  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  // Load tab-specific data
  useEffect(() => {
    if (!organization) return;
    
    switch (activeTab) {
      case 'sso':
        loadSsoConfig();
        break;
      case 'ldap':
        loadLdapConfig();
        break;
      case 'tenants':
        loadTenants();
        break;
      case 'roles':
        loadRoles();
        break;
      case 'audit':
        loadAuditLogs();
        break;
      case 'whitelabel':
        loadWhiteLabelConfig();
        break;
    }
  }, [activeTab, organization, loadSsoConfig, loadLdapConfig, loadTenants, loadRoles, loadAuditLogs, loadWhiteLabelConfig]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSaveOrganization = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (organization) {
        await OrganizationService.update(organization.id, orgForm);
      } else {
        await OrganizationService.create({
          name: orgForm.name,
          slug: orgForm.slug,
          contactEmail: orgForm.contactEmail,
          domain: orgForm.domain || undefined,
          type: 'enterprise',
          ownerId: 'current-user',
          status: 'active',
          settings: {
            timezone: 'UTC',
            language: 'en',
            dateFormat: 'YYYY-MM-DD',
            security: {
              enforceSSO: false,
              enforce2FA: false,
              sessionTimeout: 3600,
              passwordPolicy: {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: false,
                preventReuse: 3,
                maxAge: 90,
              },
            },
            features: {},
            limits: {
              maxUsers: 100,
              maxWorkspaces: 50,
              maxStorage: 10737418240,
              maxApiRequests: 100000,
            },
            notifications: {
              adminEmails: [orgForm.contactEmail],
              alertOnSecurityEvent: true,
              alertOnLimitReached: true,
            },
          },
          branding: {
            primaryColor: '#3b82f6',
            secondaryColor: '#1e40af',
          },
          license: {
            key: '',
            type: 'enterprise',
            isValid: true,
            features: [],
            limits: {},
            issuedAt: Date.now(),
          },
        });
      }
      
      setSuccess('Organization saved successfully');
      await loadOrganization();
    } catch (_err) {
      setError('Failed to save organization');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSso = async () => {
    if (!organization) return;
    try {
      setLoading(true);
      setError(null);
      
      await SSOService.configure(organization.id, {
        enabled: true,
        provider: ssoForm.provider,
        saml: ssoForm.provider === 'saml' ? {
          entityId: ssoForm.entityId,
          ssoUrl: ssoForm.ssoUrl,
          certificate: ssoForm.certificate,
          signRequest: true,
          signatureAlgorithm: 'sha256',
          nameIdFormat: 'email',
        } : undefined,
        autoProvision: ssoForm.autoProvision,
        defaultRole: ssoForm.defaultRole,
      });
      
      setSuccess('SSO configuration saved');
      await loadSsoConfig();
    } catch (_err) {
      setError('Failed to save SSO configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSso = async () => {
    if (!organization) return;
    try {
      setLoading(true);
      const result = await SSOService.test(organization.id);
      if (result.success) {
        setSuccess('SSO connection test successful');
      } else {
        setError(`SSO test failed: ${result.error}`);
      }
    } catch (_err) {
      setError('SSO test failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLdap = async () => {
    if (!organization) return;
    try {
      setLoading(true);
      setError(null);
      
      await LDAPService.configure(organization.id, {
        enabled: true,
        serverUrl: ldapForm.serverUrl,
        port: ldapForm.port,
        useSsl: ldapForm.useSsl,
        bindDn: ldapForm.bindDn,
        bindPassword: ldapForm.bindPassword,
        baseDn: ldapForm.baseDn,
        userSearchFilter: ldapForm.userSearchFilter,
        syncInterval: ldapForm.syncInterval,
        autoProvision: true,
        defaultRole: 'member',
        attributeMappings: {
          username: 'uid',
          email: 'mail',
          firstName: 'givenName',
          lastName: 'sn',
        },
      });
      
      setSuccess('LDAP configuration saved');
      await loadLdapConfig();
    } catch (_err) {
      setError('Failed to save LDAP configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLdap = async () => {
    try {
      setLoading(true);
      setLdapTestResult(null);
      
      const result = await LDAPService.testConnection({
        enabled: true,
        serverUrl: ldapForm.serverUrl,
        port: ldapForm.port,
        useSsl: ldapForm.useSsl,
        bindDn: ldapForm.bindDn,
        bindPassword: ldapForm.bindPassword,
        baseDn: ldapForm.baseDn,
        userSearchFilter: ldapForm.userSearchFilter,
        syncInterval: ldapForm.syncInterval,
        autoProvision: true,
        defaultRole: 'member',
        attributeMappings: {
          username: 'uid',
          email: 'mail',
          firstName: 'givenName',
          lastName: 'sn',
        },
      });
      
      setLdapTestResult({
        success: result.success,
        message: result.success 
          ? `Connected successfully. Found ${result.userCount} users.`
          : result.error || 'Connection failed',
      });
    } catch (_err) {
      setLdapTestResult({
        success: false,
        message: 'Connection test failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLdap = async () => {
    if (!organization) return;
    try {
      setLoading(true);
      const result = await LDAPService.syncUsers(organization.id);
      setSuccess(`LDAP sync completed: ${result.usersAdded} added, ${result.usersUpdated} updated`);
    } catch (_err) {
      setError('LDAP sync failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!organization) return;
    try {
      setLoading(true);
      setError(null);
      
      await TenantService.create({
        organizationId: organization.id,
        name: tenantForm.name,
        slug: tenantForm.slug,
        config: {
          features: {},
          settings: {},
        },
        quotas: {
          maxUsers: tenantForm.maxUsers,
          maxStorage: tenantForm.maxStorage,
          maxApiRequests: 100000,
          maxWorkflows: 50,
          maxIntegrations: 100,
        },
        isolationLevel: 'schema',
        status: 'active',
      });
      
      setSuccess('Tenant created successfully');
      setTenantForm({ name: '', slug: '', maxUsers: 100, maxStorage: 10737418240 });
      await loadTenants();
    } catch (_err) {
      setError('Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    try {
      setLoading(true);
      await TenantService.delete(tenantId);
      setSuccess('Tenant deleted');
      await loadTenants();
    } catch (_err) {
      setError('Failed to delete tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!organization) return;
    try {
      setLoading(true);
      setError(null);
      
      await RoleService.create({
        organizationId: organization.id,
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions.map(p => ({
          resource: p,
          actions: ['read', 'create', 'update', 'delete'],
        })),
        level: 10,
      });
      
      setSuccess('Role created successfully');
      setRoleForm({ name: '', description: '', permissions: [] });
      await loadRoles();
    } catch (_err) {
      setError('Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      setLoading(true);
      await RoleService.delete(roleId);
      setSuccess('Role deleted');
      await loadRoles();
    } catch (_err) {
      setError('Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAuditLogs = async () => {
    if (!organization) return;
    try {
      setLoading(true);
      const startDate = auditFilters.startDate 
        ? new Date(auditFilters.startDate).getTime() 
        : Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
      const endDate = auditFilters.endDate 
        ? new Date(auditFilters.endDate).getTime() 
        : Date.now();
      await EnterpriseAuditService.export(
        organization.id,
        startDate,
        endDate,
        'csv'
      );
      setSuccess('Audit log export started');
    } catch (_err) {
      setError('Failed to export audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWhiteLabel = async () => {
    if (!organization) return;
    try {
      setLoading(true);
      setError(null);
      
      await WhiteLabelService.updateBranding(organization.id, {
        primaryColor: whiteLabelForm.primaryColor,
        secondaryColor: whiteLabelForm.secondaryColor,
        logoUrl: whiteLabelForm.logoUrl || undefined,
        faviconUrl: whiteLabelForm.faviconUrl || undefined,
        customCss: whiteLabelForm.customCss || undefined,
        footerText: whiteLabelForm.companyName || undefined,
      });
      
      setSuccess('White label settings saved');
      await loadWhiteLabelConfig();
    } catch (_err) {
      setError('Failed to save white label settings');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const renderOrganizationTab = () => (
    <div className="enterprise-form">
      <h3>Organization Settings</h3>
      <p className="enterprise-form-description">
        Configure your organization&apos;s basic information and settings.
      </p>

      <div className="form-group">
        <label>Organization Name</label>
        <input
          type="text"
          value={orgForm.name}
          onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
          placeholder="Acme Corporation"
        />
      </div>

      <div className="form-group">
        <label>Slug (URL-friendly identifier)</label>
        <input
          type="text"
          value={orgForm.slug}
          onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
          placeholder="acme-corp"
        />
      </div>

      <div className="form-group">
        <label>Contact Email</label>
        <input
          type="email"
          value={orgForm.contactEmail}
          onChange={(e) => setOrgForm({ ...orgForm, contactEmail: e.target.value })}
          placeholder="admin@acme.com"
        />
      </div>

      <div className="form-group">
        <label>Custom Domain (optional)</label>
        <input
          type="text"
          value={orgForm.domain}
          onChange={(e) => setOrgForm({ ...orgForm, domain: e.target.value })}
          placeholder="cube.acme.com"
        />
      </div>

      <div className="form-actions">
        <button className="btn-primary" onClick={handleSaveOrganization} disabled={loading}>
          {loading ? <RefreshCw className="spin" size={16} /> : <CheckCircle size={16} />}
          Save Organization
        </button>
      </div>
    </div>
  );

  const renderSsoTab = () => (
    <div className="enterprise-form">
      <h3>Single Sign-On (SSO)</h3>
      <p className="enterprise-form-description">
        Configure SAML 2.0 or OIDC for enterprise single sign-on.
      </p>

      <div className="form-group">
        <label>SSO Provider</label>
        <select
          value={ssoForm.provider}
          onChange={(e) => setSsoForm({ ...ssoForm, provider: e.target.value as SSOProvider })}
        >
          <option value="saml">SAML 2.0</option>
          <option value="oidc">OpenID Connect (OIDC)</option>
          <option value="okta">Okta</option>
          <option value="azure-ad">Azure AD</option>
          <option value="google">Google Workspace</option>
        </select>
      </div>

      {ssoForm.provider === 'saml' && (
        <>
          <div className="form-group">
            <label>Entity ID (Issuer)</label>
            <input
              type="text"
              value={ssoForm.entityId}
              onChange={(e) => setSsoForm({ ...ssoForm, entityId: e.target.value })}
              placeholder="https://idp.example.com/entity"
            />
          </div>

          <div className="form-group">
            <label>SSO URL (Login URL)</label>
            <input
              type="text"
              value={ssoForm.ssoUrl}
              onChange={(e) => setSsoForm({ ...ssoForm, ssoUrl: e.target.value })}
              placeholder="https://idp.example.com/sso/saml"
            />
          </div>

          <div className="form-group">
            <label>X.509 Certificate</label>
            <div className="password-input">
              <textarea
                value={showSsoSecret ? ssoForm.certificate : '••••••••••••••••'}
                onChange={(e) => setSsoForm({ ...ssoForm, certificate: e.target.value })}
                placeholder="-----BEGIN CERTIFICATE-----"
                rows={4}
                readOnly={!showSsoSecret}
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowSsoSecret(!showSsoSecret)}
              >
                {showSsoSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={ssoForm.autoProvision}
            onChange={(e) => setSsoForm({ ...ssoForm, autoProvision: e.target.checked })}
          />
          Auto-provision users on first login
        </label>
      </div>

      <div className="form-group">
        <label>Default Role for New Users</label>
        <select
          value={ssoForm.defaultRole}
          onChange={(e) => setSsoForm({ ...ssoForm, defaultRole: e.target.value })}
        >
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="form-actions">
        <button className="btn-secondary" onClick={handleTestSso} disabled={loading}>
          <Activity size={16} />
          Test Connection
        </button>
        <button className="btn-primary" onClick={handleSaveSso} disabled={loading}>
          {loading ? <RefreshCw className="spin" size={16} /> : <CheckCircle size={16} />}
          Save SSO Config
        </button>
      </div>

      {ssoConfig && (
        <div className="info-box">
          <h4>Service Provider Details</h4>
          <p>Share these details with your identity provider:</p>
          <div className="sp-details">
            <div className="detail-row">
              <span>ACS URL:</span>
              <code>https://cube.app/api/auth/saml/callback</code>
              <button onClick={() => navigator.clipboard.writeText('https://cube.app/api/auth/saml/callback')}>
                <Copy size={14} />
              </button>
            </div>
            <div className="detail-row">
              <span>Entity ID:</span>
              <code>https://cube.app/saml/metadata</code>
              <button onClick={() => navigator.clipboard.writeText('https://cube.app/saml/metadata')}>
                <Copy size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLdapTab = () => (
    <div className="enterprise-form">
      <h3>LDAP / Active Directory</h3>
      <p className="enterprise-form-description">
        Sync users and groups from your LDAP or Active Directory server.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Server URL</label>
          <input
            type="text"
            value={ldapForm.serverUrl}
            onChange={(e) => setLdapForm({ ...ldapForm, serverUrl: e.target.value })}
            placeholder="ldap://ldap.example.com"
          />
        </div>
        <div className="form-group small">
          <label>Port</label>
          <input
            type="number"
            value={ldapForm.port}
            onChange={(e) => setLdapForm({ ...ldapForm, port: parseInt(e.target.value) || 389 })}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={ldapForm.useSsl}
            onChange={(e) => setLdapForm({ ...ldapForm, useSsl: e.target.checked })}
          />
          Use SSL/TLS (LDAPS)
        </label>
      </div>

      <div className="form-group">
        <label>Bind DN</label>
        <input
          type="text"
          value={ldapForm.bindDn}
          onChange={(e) => setLdapForm({ ...ldapForm, bindDn: e.target.value })}
          placeholder="cn=admin,dc=example,dc=com"
        />
      </div>

      <div className="form-group">
        <label>Bind Password</label>
        <div className="password-input">
          <input
            type={showLdapPassword ? 'text' : 'password'}
            value={ldapForm.bindPassword}
            onChange={(e) => setLdapForm({ ...ldapForm, bindPassword: e.target.value })}
            placeholder="Enter bind password"
          />
          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setShowLdapPassword(!showLdapPassword)}
          >
            {showLdapPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Base DN</label>
        <input
          type="text"
          value={ldapForm.baseDn}
          onChange={(e) => setLdapForm({ ...ldapForm, baseDn: e.target.value })}
          placeholder="dc=example,dc=com"
        />
      </div>

      <div className="form-group">
        <label>User Search Filter</label>
        <input
          type="text"
          value={ldapForm.userSearchFilter}
          onChange={(e) => setLdapForm({ ...ldapForm, userSearchFilter: e.target.value })}
          placeholder="(uid={{username}})"
        />
      </div>

      <div className="form-group">
        <label>Sync Interval (minutes)</label>
        <input
          type="number"
          value={ldapForm.syncInterval}
          onChange={(e) => setLdapForm({ ...ldapForm, syncInterval: parseInt(e.target.value) || 60 })}
          min={5}
          max={1440}
        />
      </div>

      {ldapTestResult && (
        <div className={`test-result ${ldapTestResult.success ? 'success' : 'error'}`}>
          {ldapTestResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {ldapTestResult.message}
        </div>
      )}

      <div className="form-actions">
        <button className="btn-secondary" onClick={handleTestLdap} disabled={loading}>
          <Activity size={16} />
          Test Connection
        </button>
        <button className="btn-secondary" onClick={handleSyncLdap} disabled={loading || !ldapConfig}>
          <RefreshCw size={16} />
          Sync Now
        </button>
        <button className="btn-primary" onClick={handleSaveLdap} disabled={loading}>
          {loading ? <RefreshCw className="spin" size={16} /> : <CheckCircle size={16} />}
          Save LDAP Config
        </button>
      </div>
    </div>
  );

  const renderTenantsTab = () => (
    <div className="enterprise-form">
      <h3>Multi-Tenant Management</h3>
      <p className="enterprise-form-description">
        Create and manage isolated tenant environments for different teams or customers.
      </p>

      <div className="create-form">
        <h4>Create New Tenant</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Tenant Name</label>
            <input
              type="text"
              value={tenantForm.name}
              onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
              placeholder="Engineering Team"
            />
          </div>
          <div className="form-group">
            <label>Slug</label>
            <input
              type="text"
              value={tenantForm.slug}
              onChange={(e) => setTenantForm({ ...tenantForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder="engineering"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Max Users</label>
            <input
              type="number"
              value={tenantForm.maxUsers}
              onChange={(e) => setTenantForm({ ...tenantForm, maxUsers: parseInt(e.target.value) || 100 })}
              min={1}
            />
          </div>
          <div className="form-group">
            <label>Max Storage (GB)</label>
            <input
              type="number"
              value={Math.round(tenantForm.maxStorage / 1073741824)}
              onChange={(e) => setTenantForm({ ...tenantForm, maxStorage: (parseInt(e.target.value) || 10) * 1073741824 })}
              min={1}
            />
          </div>
        </div>
        <button className="btn-primary" onClick={handleCreateTenant} disabled={loading || !tenantForm.name}>
          <Plus size={16} />
          Create Tenant
        </button>
      </div>

      <div className="data-table">
        <h4>Existing Tenants ({tenants.length})</h4>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Users</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td>{tenant.name}</td>
                <td><code>{tenant.slug}</code></td>
                <td>
                  <span className={`status-badge ${tenant.status}`}>
                    {tenant.status}
                  </span>
                </td>
                <td>{tenant.quotas.maxUsers}</td>
                <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button title="Edit" onClick={() => setSelectedTenant(tenant)}>
                      <Edit size={14} />
                    </button>
                    <button 
                      title="Delete" 
                      className="danger"
                      onClick={() => handleDeleteTenant(tenant.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  No tenants created yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRolesTab = () => {
    const availablePermissions = [
      'users', 'workspaces', 'automations', 'integrations', 
      'analytics', 'settings', 'billing', 'audit'
    ];

    return (
      <div className="enterprise-form">
        <h3>Role-Based Access Control</h3>
        <p className="enterprise-form-description">
          Define custom roles with granular permissions for your organization.
        </p>

        <div className="create-form">
          <h4>Create New Role</h4>
          <div className="form-group">
            <label>Role Name</label>
            <input
              type="text"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              placeholder="Team Lead"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              placeholder="Can manage team members and view analytics"
            />
          </div>
          <div className="form-group">
            <label>Permissions</label>
            <div className="permissions-grid">
              {availablePermissions.map((perm) => (
                <label key={perm} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={roleForm.permissions.includes(perm)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRoleForm({ ...roleForm, permissions: [...roleForm.permissions, perm] });
                      } else {
                        setRoleForm({ ...roleForm, permissions: roleForm.permissions.filter(p => p !== perm) });
                      }
                    }}
                  />
                  {perm.charAt(0).toUpperCase() + perm.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={handleCreateRole} disabled={loading || !roleForm.name}>
            <Plus size={16} />
            Create Role
          </button>
        </div>

        <div className="data-table">
          <h4>Existing Roles ({roles.length})</h4>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Permissions</th>
                <th>System</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td><strong>{role.name}</strong></td>
                  <td>{role.description}</td>
                  <td>
                    <div className="permission-tags">
                      {role.permissions.slice(0, 3).map((p) => (
                        <span key={p.resource} className="tag">{p.resource}</span>
                      ))}
                      {role.permissions.length > 3 && (
                        <span className="tag more">+{role.permissions.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>{role.isSystem ? '✓' : '—'}</td>
                  <td>
                    <div className="action-buttons">
                      <button title="Edit" onClick={() => setSelectedRole(role)}>
                        <Edit size={14} />
                      </button>
                      {!role.isSystem && (
                        <button 
                          title="Delete" 
                          className="danger"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No custom roles created yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderLicensesTab = () => (
    <div className="enterprise-form">
      <h3>License Management</h3>
      <p className="enterprise-form-description">
        View and manage enterprise licenses, seats, and feature entitlements.
      </p>

      {organization && (
        <div className="license-overview">
          <div className="license-card">
            <h4>Current License</h4>
            <div className="license-details">
              <div className="detail">
                <span className="label">Plan</span>
                <span className="value enterprise">Enterprise</span>
              </div>
              <div className="detail">
                <span className="label">Status</span>
                <span className="value active">Active</span>
              </div>
              <div className="detail">
                <span className="label">Seats</span>
                <span className="value">45 / 100</span>
              </div>
              <div className="detail">
                <span className="label">Expires</span>
                <span className="value">Dec 31, 2026</span>
              </div>
            </div>
          </div>

          <div className="feature-entitlements">
            <h4>Feature Entitlements</h4>
            <div className="features-grid">
              {[
                { name: 'SSO', enabled: true },
                { name: 'LDAP Sync', enabled: true },
                { name: 'Multi-tenant', enabled: true },
                { name: 'White Label', enabled: true },
                { name: 'Custom Integrations', enabled: true },
                { name: 'Priority Support', enabled: true },
                { name: 'SLA Guarantee', enabled: true },
                { name: 'Dedicated Instance', enabled: false },
              ].map((feature) => (
                <div key={feature.name} className={`feature ${feature.enabled ? 'enabled' : 'disabled'}`}>
                  {feature.enabled ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {feature.name}
                </div>
              ))}
            </div>
          </div>

          <div className="usage-stats">
            <h4>Usage This Month</h4>
            <div className="stats-grid">
              <div className="stat">
                <span className="label">API Requests</span>
                <span className="value">1.2M / 5M</span>
                <div className="progress-bar">
                  <div className="progress" style={{ width: '24%' }} />
                </div>
              </div>
              <div className="stat">
                <span className="label">Storage</span>
                <span className="value">45GB / 100GB</span>
                <div className="progress-bar">
                  <div className="progress" style={{ width: '45%' }} />
                </div>
              </div>
              <div className="stat">
                <span className="label">Automations</span>
                <span className="value">234 / 500</span>
                <div className="progress-bar">
                  <div className="progress" style={{ width: '47%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAuditTab = () => (
    <div className="enterprise-form">
      <h3>Security Audit Log</h3>
      <p className="enterprise-form-description">
        Review all security-relevant actions taken within your organization.
      </p>

      <div className="audit-filters">
        <div className="form-row">
          <div className="form-group">
            <label>User ID</label>
            <input
              type="text"
              value={auditFilters.userId}
              onChange={(e) => setAuditFilters({ ...auditFilters, userId: e.target.value })}
              placeholder="Filter by user"
            />
          </div>
          <div className="form-group">
            <label>Action</label>
            <select
              value={auditFilters.action}
              onChange={(e) => setAuditFilters({ ...auditFilters, action: e.target.value })}
            >
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="export">Export</option>
            </select>
          </div>
          <div className="form-group">
            <label>Resource Type</label>
            <select
              value={auditFilters.resourceType}
              onChange={(e) => setAuditFilters({ ...auditFilters, resourceType: e.target.value })}
            >
              <option value="">All Resources</option>
              <option value="user">User</option>
              <option value="workspace">Workspace</option>
              <option value="automation">Automation</option>
              <option value="integration">Integration</option>
              <option value="settings">Settings</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={auditFilters.startDate}
              onChange={(e) => setAuditFilters({ ...auditFilters, startDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={auditFilters.endDate}
              onChange={(e) => setAuditFilters({ ...auditFilters, endDate: e.target.value })}
            />
          </div>
          <div className="form-group actions">
            <button className="btn-secondary" onClick={loadAuditLogs}>
              <Search size={16} />
              Search
            </button>
            <button className="btn-secondary" onClick={handleExportAuditLogs}>
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="audit-log-table">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>IP Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.actor.email || log.actor.name}</td>
                <td>
                  <span className={`action-badge ${typeof log.action === 'string' ? log.action : 'custom'}`}>
                    {typeof log.action === 'string' ? log.action : 'custom'}
                  </span>
                </td>
                <td>
                  <code>{log.resource.type}/{log.resource.id.slice(0, 8)}</code>
                </td>
                <td>{log.actor.ip || '—'}</td>
                <td>
                  <span className={`status-badge ${log.status}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
            {auditLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  No audit logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWhiteLabelTab = () => (
    <div className="enterprise-form">
      <h3>White Label Configuration</h3>
      <p className="enterprise-form-description">
        Customize the appearance and branding of your CUBE deployment.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Application Name</label>
          <input
            type="text"
            value={whiteLabelForm.appName}
            onChange={(e) => setWhiteLabelForm({ ...whiteLabelForm, appName: e.target.value })}
            placeholder="CUBE Elite"
          />
        </div>
        <div className="form-group">
          <label>Company Name</label>
          <input
            type="text"
            value={whiteLabelForm.companyName}
            onChange={(e) => setWhiteLabelForm({ ...whiteLabelForm, companyName: e.target.value })}
            placeholder="Acme Corporation"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Primary Color</label>
          <div className="color-input">
            <input
              type="color"
              value={whiteLabelForm.primaryColor}
              onChange={(e) => setWhiteLabelForm({ ...whiteLabelForm, primaryColor: e.target.value })}
            />
            <input
              type="text"
              value={whiteLabelForm.primaryColor}
              onChange={(e) => setWhiteLabelForm({ ...whiteLabelForm, primaryColor: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Secondary Color</label>
          <div className="color-input">
            <input
              type="color"
              value={whiteLabelForm.secondaryColor}
              onChange={(e) => setWhiteLabelForm({ ...whiteLabelForm, secondaryColor: e.target.value })}
            />
            <input
              type="text"
              value={whiteLabelForm.secondaryColor}
              onChange={(e) => setWhiteLabelForm({ ...whiteLabelForm, secondaryColor: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Logo URL</label>
        <input
          type="text"
          value={whiteLabelForm.logoUrl}
          onChange={(e) => setWhiteLabelForm({ ...whiteLabelForm, logoUrl: e.target.value })}
          placeholder="https://example.com/logo.svg"
        />
      </div>

      <div className="form-group">
        <label>Favicon URL</label>
        <input
          type="text"
          value={whiteLabelForm.faviconUrl}
          onChange={(e) => setWhiteLabelForm({ ...whiteLabelForm, faviconUrl: e.target.value })}
          placeholder="https://example.com/favicon.ico"
        />
      </div>

      <div className="form-group">
        <label>Custom CSS</label>
        <textarea
          value={whiteLabelForm.customCss}
          onChange={(e) => setWhiteLabelForm({ ...whiteLabelForm, customCss: e.target.value })}
          placeholder="/* Custom CSS overrides */"
          rows={6}
        />
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={whiteLabelForm.hidePoweredBy}
            onChange={(e) => setWhiteLabelForm({ ...whiteLabelForm, hidePoweredBy: e.target.checked })}
          />
          Hide &quot;Powered by CUBE&quot; branding
        </label>
      </div>

      <div className="preview-section">
        <h4>Preview</h4>
        <div 
          className="brand-preview"
          style={{ 
            '--primary-color': whiteLabelForm.primaryColor,
            '--secondary-color': whiteLabelForm.secondaryColor,
          } as React.CSSProperties}
        >
          <div className="preview-header">
            {whiteLabelForm.logoUrl ? (
              <img src={whiteLabelForm.logoUrl} alt="Logo" className="preview-logo" />
            ) : (
              <span className="preview-app-name">{whiteLabelForm.appName}</span>
            )}
          </div>
          <div className="preview-content">
            <button className="preview-btn primary">Primary Button</button>
            <button className="preview-btn secondary">Secondary Button</button>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn-primary" onClick={handleSaveWhiteLabel} disabled={loading}>
          {loading ? <RefreshCw className="spin" size={16} /> : <CheckCircle size={16} />}
          Save White Label Settings
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'organization':
        return renderOrganizationTab();
      case 'sso':
        return renderSsoTab();
      case 'ldap':
        return renderLdapTab();
      case 'tenants':
        return renderTenantsTab();
      case 'roles':
        return renderRolesTab();
      case 'licenses':
        return renderLicensesTab();
      case 'audit':
        return renderAuditTab();
      case 'whitelabel':
        return renderWhiteLabelTab();
      default:
        return renderOrganizationTab();
    }
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="enterprise-settings">
      {/* Header */}
      <div className="enterprise-header">
        <div className="header-content">
          <Building2 size={32} />
          <div>
            <h2>Enterprise Settings</h2>
            <p>Configure enterprise features for your organization</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="notification error">
          <AlertTriangle size={16} />
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {success && (
        <div className="notification success">
          <CheckCircle size={16} />
          {success}
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Main Content */}
      <div className="enterprise-content">
        {/* Sidebar Navigation */}
        <nav className="enterprise-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="enterprise-main">
          {loading && (
            <div className="loading-overlay">
              <RefreshCw className="spin" size={24} />
              Loading...
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseSettings;
