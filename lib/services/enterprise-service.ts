/**
 * Enterprise Service - SSO, LDAP, Multi-tenant & White-label
 *
 * Enterprise-grade features for organizations including SSO,
 * LDAP integration, multi-tenancy, and white-label support.
 *
 * M5 Features:
 * - Single Sign-On (SSO)
 * - LDAP/Active Directory integration
 * - Multi-tenant architecture
 * - White-label/Custom branding
 * - Advanced audit logging
 * - License management
 * - Organization management
 * - Role hierarchy
 *
 * @module EnterpriseService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService } from './telemetry-service';

// ============================================================================
// Organization Types
// ============================================================================

export interface Organization {
  /**
   * Organization ID
   */
  id: string;

  /**
   * Organization name
   */
  name: string;

  /**
   * Slug (URL-friendly identifier)
   */
  slug: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Organization type
   */
  type: OrganizationType;

  /**
   * Parent organization ID (for hierarchy)
   */
  parentId?: string;

  /**
   * Settings
   */
  settings: OrganizationSettings;

  /**
   * Branding
   */
  branding: OrganizationBranding;

  /**
   * License
   */
  license: OrganizationLicense;

  /**
   * Status
   */
  status: OrganizationStatus;

  /**
   * Owner ID
   */
  ownerId: string;

  /**
   * Contact email
   */
  contactEmail: string;

  /**
   * Billing email
   */
  billingEmail?: string;

  /**
   * Domain
   */
  domain?: string;

  /**
   * SSO configuration
   */
  ssoConfig?: SSOConfig;

  /**
   * LDAP configuration
   */
  ldapConfig?: LDAPConfig;

  /**
   * Statistics
   */
  stats: OrganizationStats;

  /**
   * Creation time
   */
  createdAt: number;

  /**
   * Last update
   */
  updatedAt: number;
}

export type OrganizationType =
  | 'free'
  | 'starter'
  | 'professional'
  | 'enterprise'
  | 'custom';

export type OrganizationStatus =
  | 'active'
  | 'trial'
  | 'suspended'
  | 'cancelled'
  | 'pending';

export interface OrganizationSettings {
  /**
   * Default timezone
   */
  timezone: string;

  /**
   * Default language
   */
  language: string;

  /**
   * Date format
   */
  dateFormat: string;

  /**
   * Security settings
   */
  security: {
    enforceSSO: boolean;
    enforce2FA: boolean;
    sessionTimeout: number;
    passwordPolicy: PasswordPolicy;
    allowedIPs?: string[];
    allowedDomains?: string[];
  };

  /**
   * Feature flags
   */
  features: Record<string, boolean>;

  /**
   * Limits
   */
  limits: {
    maxUsers: number;
    maxWorkspaces: number;
    maxStorage: number;
    maxApiRequests: number;
  };

  /**
   * Notifications
   */
  notifications: {
    adminEmails: string[];
    alertOnSecurityEvent: boolean;
    alertOnLimitReached: boolean;
  };
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  maxAge: number;
}

export interface OrganizationBranding {
  /**
   * Primary color
   */
  primaryColor: string;

  /**
   * Secondary color
   */
  secondaryColor: string;

  /**
   * Logo URL
   */
  logoUrl?: string;

  /**
   * Logo dark mode URL
   */
  logoDarkUrl?: string;

  /**
   * Favicon URL
   */
  faviconUrl?: string;

  /**
   * Custom CSS
   */
  customCss?: string;

  /**
   * Custom domain
   */
  customDomain?: string;

  /**
   * Email templates
   */
  emailTemplates?: {
    welcomeTemplate?: string;
    invitationTemplate?: string;
    notificationTemplate?: string;
  };

  /**
   * Footer text
   */
  footerText?: string;

  /**
   * Support URL
   */
  supportUrl?: string;

  /**
   * Privacy URL
   */
  privacyUrl?: string;

  /**
   * Terms URL
   */
  termsUrl?: string;
}

export interface OrganizationLicense {
  /**
   * License key
   */
  key: string;

  /**
   * License type
   */
  type: OrganizationType;

  /**
   * Is valid
   */
  isValid: boolean;

  /**
   * Expires at
   */
  expiresAt?: number;

  /**
   * Features included
   */
  features: string[];

  /**
   * Limits
   */
  limits: Record<string, number>;

  /**
   * Issued at
   */
  issuedAt: number;
}

export interface OrganizationStats {
  userCount: number;
  activeUserCount: number;
  workspaceCount: number;
  storageUsed: number;
  apiRequestsThisMonth: number;
}

// ============================================================================
// SSO Types
// ============================================================================

export interface SSOConfig {
  /**
   * Is enabled
   */
  enabled: boolean;

  /**
   * Provider
   */
  provider: SSOProvider;

  /**
   * SAML configuration
   */
  saml?: SAMLConfig;

  /**
   * OIDC configuration
   */
  oidc?: OIDCConfig;

  /**
   * Auto-provision users
   */
  autoProvision: boolean;

  /**
   * Default role for new users
   */
  defaultRole: string;

  /**
   * Group mappings
   */
  groupMappings?: GroupMapping[];

  /**
   * Attribute mappings
   */
  attributeMappings?: AttributeMapping[];
}

export type SSOProvider =
  | 'saml'
  | 'oidc'
  | 'okta'
  | 'azure-ad'
  | 'google'
  | 'onelogin'
  | 'auth0'
  | 'custom';

export interface SAMLConfig {
  /**
   * Entity ID
   */
  entityId: string;

  /**
   * SSO URL
   */
  ssoUrl: string;

  /**
   * SLO URL
   */
  sloUrl?: string;

  /**
   * Certificate
   */
  certificate: string;

  /**
   * Sign request
   */
  signRequest: boolean;

  /**
   * Signature algorithm
   */
  signatureAlgorithm: 'sha256' | 'sha512';

  /**
   * Name ID format
   */
  nameIdFormat: string;
}

export interface OIDCConfig {
  /**
   * Issuer
   */
  issuer: string;

  /**
   * Client ID
   */
  clientId: string;

  /**
   * Client secret
   */
  clientSecret: string;

  /**
   * Authorization endpoint
   */
  authorizationEndpoint: string;

  /**
   * Token endpoint
   */
  tokenEndpoint: string;

  /**
   * User info endpoint
   */
  userInfoEndpoint: string;

  /**
   * JWKS URI
   */
  jwksUri: string;

  /**
   * Scopes
   */
  scopes: string[];
}

export interface GroupMapping {
  ssoGroup: string;
  localRole: string;
  localTeams?: string[];
}

export interface AttributeMapping {
  ssoAttribute: string;
  localField: string;
}

// ============================================================================
// LDAP Types
// ============================================================================

export interface LDAPConfig {
  /**
   * Is enabled
   */
  enabled: boolean;

  /**
   * Server URL
   */
  serverUrl: string;

  /**
   * Port
   */
  port: number;

  /**
   * Use SSL
   */
  useSsl: boolean;

  /**
   * Bind DN
   */
  bindDn: string;

  /**
   * Bind password
   */
  bindPassword: string;

  /**
   * Base DN
   */
  baseDn: string;

  /**
   * User search filter
   */
  userSearchFilter: string;

  /**
   * User search base
   */
  userSearchBase?: string;

  /**
   * Group search filter
   */
  groupSearchFilter?: string;

  /**
   * Group search base
   */
  groupSearchBase?: string;

  /**
   * Attribute mappings
   */
  attributeMappings: LDAPAttributeMapping;

  /**
   * Sync interval (minutes)
   */
  syncInterval: number;

  /**
   * Auto-provision users
   */
  autoProvision: boolean;

  /**
   * Default role
   */
  defaultRole: string;

  /**
   * Group mappings
   */
  groupMappings?: GroupMapping[];
}

export interface LDAPAttributeMapping {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  memberOf?: string;
}

export interface LDAPSyncResult {
  timestamp: number;
  status: 'success' | 'partial' | 'failed';
  usersAdded: number;
  usersUpdated: number;
  usersRemoved: number;
  groupsSynced: number;
  errors: string[];
  duration: number;
}

// ============================================================================
// Multi-tenant Types
// ============================================================================

export interface Tenant {
  /**
   * Tenant ID
   */
  id: string;

  /**
   * Tenant name
   */
  name: string;

  /**
   * Slug
   */
  slug: string;

  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Configuration
   */
  config: TenantConfig;

  /**
   * Isolation level
   */
  isolationLevel: IsolationLevel;

  /**
   * Status
   */
  status: TenantStatus;

  /**
   * Resource quotas
   */
  quotas: TenantQuotas;

  /**
   * Current usage
   */
  usage: TenantUsage;

  /**
   * Creation time
   */
  createdAt: number;
}

export type IsolationLevel =
  | 'shared'      // Shared database, shared schema
  | 'schema'      // Shared database, separate schema
  | 'database'    // Separate database
  | 'instance';   // Separate instance

export type TenantStatus =
  | 'active'
  | 'suspended'
  | 'provisioning'
  | 'deprovisioning';

export interface TenantConfig {
  /**
   * Custom domain
   */
  customDomain?: string;

  /**
   * Branding
   */
  branding?: Partial<OrganizationBranding>;

  /**
   * Features
   */
  features: Record<string, boolean>;

  /**
   * Settings
   */
  settings: Record<string, unknown>;
}

export interface TenantQuotas {
  maxUsers: number;
  maxStorage: number;
  maxApiRequests: number;
  maxWorkflows: number;
  maxIntegrations: number;
}

export interface TenantUsage {
  users: number;
  storage: number;
  apiRequests: number;
  workflows: number;
  integrations: number;
}

// ============================================================================
// Role & Permission Types
// ============================================================================

export interface Role {
  /**
   * Role ID
   */
  id: string;

  /**
   * Role name
   */
  name: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Is system role
   */
  isSystem: boolean;

  /**
   * Permissions
   */
  permissions: RolePermission[];

  /**
   * Hierarchy level
   */
  level: number;

  /**
   * Parent role ID
   */
  parentRoleId?: string;

  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Creation time
   */
  createdAt: number;
}

export interface RolePermission {
  /**
   * Resource
   */
  resource: string;

  /**
   * Actions
   */
  actions: PermissionAction[];

  /**
   * Conditions
   */
  conditions?: PermissionCondition[];
}

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'execute'
  | 'share'
  | 'admin'
  | '*';

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'contains';
  value: unknown;
}

// ============================================================================
// Audit Types
// ============================================================================

export interface EnterpriseAuditLog {
  /**
   * Log ID
   */
  id: string;

  /**
   * Organization ID
   */
  organizationId: string;

  /**
   * Actor
   */
  actor: {
    type: 'user' | 'system' | 'api';
    id: string;
    name: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  };

  /**
   * Action
   */
  action: string;

  /**
   * Resource
   */
  resource: {
    type: string;
    id: string;
    name?: string;
  };

  /**
   * Details
   */
  details?: Record<string, unknown>;

  /**
   * Previous state
   */
  previousState?: unknown;

  /**
   * New state
   */
  newState?: unknown;

  /**
   * Status
   */
  status: 'success' | 'failure';

  /**
   * Error
   */
  error?: string;

  /**
   * Timestamp
   */
  timestamp: number;

  /**
   * Session ID
   */
  sessionId?: string;

  /**
   * Request ID
   */
  requestId?: string;
}

// ============================================================================
// Organization Service
// ============================================================================

export const OrganizationService = {
  /**
   * Create organization
   */
  create: async (
    org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'stats'>
  ): Promise<Organization> => {
    TelemetryService.trackEvent('organization_created', { type: org.type });

    return invoke<Organization>('organization_create', { org });
  },

  /**
   * Get organization
   */
  get: async (organizationId: string): Promise<Organization | null> => {
    return invoke<Organization | null>('organization_get', { organizationId });
  },

  /**
   * Get by slug
   */
  getBySlug: async (slug: string): Promise<Organization | null> => {
    return invoke<Organization | null>('organization_get_by_slug', { slug });
  },

  /**
   * Update organization
   */
  update: async (
    organizationId: string,
    updates: Partial<Organization>
  ): Promise<Organization> => {
    return invoke<Organization>('organization_update', {
      organizationId,
      updates,
    });
  },

  /**
   * Delete organization
   */
  delete: async (organizationId: string): Promise<void> => {
    return invoke('organization_delete', { organizationId });
  },

  /**
   * Get children
   */
  getChildren: async (
    organizationId: string
  ): Promise<Organization[]> => {
    return invoke<Organization[]>('organization_get_children', {
      organizationId,
    });
  },

  /**
   * Update settings
   */
  updateSettings: async (
    organizationId: string,
    settings: Partial<OrganizationSettings>
  ): Promise<OrganizationSettings> => {
    return invoke<OrganizationSettings>('organization_update_settings', {
      organizationId,
      settings,
    });
  },

  /**
   * Update branding
   */
  updateBranding: async (
    organizationId: string,
    branding: Partial<OrganizationBranding>
  ): Promise<OrganizationBranding> => {
    return invoke<OrganizationBranding>('organization_update_branding', {
      organizationId,
      branding,
    });
  },

  /**
   * Get stats
   */
  getStats: async (organizationId: string): Promise<OrganizationStats> => {
    return invoke<OrganizationStats>('organization_get_stats', {
      organizationId,
    });
  },

  /**
   * Suspend organization
   */
  suspend: async (organizationId: string, reason: string): Promise<void> => {
    return invoke('organization_suspend', { organizationId, reason });
  },

  /**
   * Reactivate organization
   */
  reactivate: async (organizationId: string): Promise<void> => {
    return invoke('organization_reactivate', { organizationId });
  },
};

// ============================================================================
// SSO Service
// ============================================================================

export const SSOService = {
  /**
   * Configure SSO
   */
  configure: async (
    organizationId: string,
    config: SSOConfig
  ): Promise<SSOConfig> => {
    TelemetryService.trackEvent('sso_configured', { provider: config.provider });

    return invoke<SSOConfig>('sso_configure', { organizationId, config });
  },

  /**
   * Get SSO config
   */
  getConfig: async (organizationId: string): Promise<SSOConfig | null> => {
    return invoke<SSOConfig | null>('sso_get_config', { organizationId });
  },

  /**
   * Enable SSO
   */
  enable: async (organizationId: string): Promise<void> => {
    return invoke('sso_enable', { organizationId });
  },

  /**
   * Disable SSO
   */
  disable: async (organizationId: string): Promise<void> => {
    return invoke('sso_disable', { organizationId });
  },

  /**
   * Test SSO
   */
  test: async (
    organizationId: string
  ): Promise<{ success: boolean; error?: string }> => {
    return invoke('sso_test', { organizationId });
  },

  /**
   * Get SAML metadata
   */
  getSAMLMetadata: async (
    organizationId: string
  ): Promise<string> => {
    return invoke<string>('sso_get_saml_metadata', { organizationId });
  },

  /**
   * Initiate SSO login
   */
  initiateLogin: async (
    organizationId: string,
    returnUrl?: string
  ): Promise<{ redirectUrl: string }> => {
    return invoke('sso_initiate_login', { organizationId, returnUrl });
  },

  /**
   * Complete SSO login
   */
  completeLogin: async (
    organizationId: string,
    response: string
  ): Promise<{
    user: { id: string; email: string; name: string };
    token: string;
  }> => {
    return invoke('sso_complete_login', { organizationId, response });
  },

  /**
   * Sync users from SSO
   */
  syncUsers: async (organizationId: string): Promise<{
    added: number;
    updated: number;
    removed: number;
  }> => {
    return invoke('sso_sync_users', { organizationId });
  },
};

// ============================================================================
// LDAP Service
// ============================================================================

export const LDAPService = {
  /**
   * Configure LDAP
   */
  configure: async (
    organizationId: string,
    config: LDAPConfig
  ): Promise<LDAPConfig> => {
    TelemetryService.trackEvent('ldap_configured');

    return invoke<LDAPConfig>('ldap_configure', { organizationId, config });
  },

  /**
   * Get LDAP config
   */
  getConfig: async (organizationId: string): Promise<LDAPConfig | null> => {
    return invoke<LDAPConfig | null>('ldap_get_config', { organizationId });
  },

  /**
   * Test connection
   */
  testConnection: async (
    config: LDAPConfig
  ): Promise<{ success: boolean; error?: string; userCount?: number }> => {
    return invoke('ldap_test_connection', { config });
  },

  /**
   * Sync users
   */
  syncUsers: async (organizationId: string): Promise<LDAPSyncResult> => {
    return invoke<LDAPSyncResult>('ldap_sync_users', { organizationId });
  },

  /**
   * Get sync history
   */
  getSyncHistory: async (
    organizationId: string,
    limit?: number
  ): Promise<LDAPSyncResult[]> => {
    return invoke<LDAPSyncResult[]>('ldap_get_sync_history', {
      organizationId,
      limit,
    });
  },

  /**
   * Search users
   */
  searchUsers: async (
    organizationId: string,
    query: string
  ): Promise<{
    dn: string;
    attributes: Record<string, string | string[]>;
  }[]> => {
    return invoke('ldap_search_users', { organizationId, query });
  },

  /**
   * Search groups
   */
  searchGroups: async (
    organizationId: string,
    query: string
  ): Promise<{
    dn: string;
    name: string;
    members: string[];
  }[]> => {
    return invoke('ldap_search_groups', { organizationId, query });
  },

  /**
   * Enable LDAP
   */
  enable: async (organizationId: string): Promise<void> => {
    return invoke('ldap_enable', { organizationId });
  },

  /**
   * Disable LDAP
   */
  disable: async (organizationId: string): Promise<void> => {
    return invoke('ldap_disable', { organizationId });
  },
};

// ============================================================================
// Tenant Service
// ============================================================================

export const TenantService = {
  /**
   * Create tenant
   */
  create: async (
    tenant: Omit<Tenant, 'id' | 'createdAt' | 'usage'>
  ): Promise<Tenant> => {
    TelemetryService.trackEvent('tenant_created', {
      isolationLevel: tenant.isolationLevel,
    });

    return invoke<Tenant>('tenant_create', { tenant });
  },

  /**
   * Get all tenants
   */
  getAll: async (organizationId: string): Promise<Tenant[]> => {
    return invoke<Tenant[]>('tenant_get_all', { organizationId });
  },

  /**
   * Get tenant
   */
  get: async (tenantId: string): Promise<Tenant | null> => {
    return invoke<Tenant | null>('tenant_get', { tenantId });
  },

  /**
   * Get by slug
   */
  getBySlug: async (slug: string): Promise<Tenant | null> => {
    return invoke<Tenant | null>('tenant_get_by_slug', { slug });
  },

  /**
   * Update tenant
   */
  update: async (
    tenantId: string,
    updates: Partial<Tenant>
  ): Promise<Tenant> => {
    return invoke<Tenant>('tenant_update', { tenantId, updates });
  },

  /**
   * Delete tenant
   */
  delete: async (tenantId: string): Promise<void> => {
    return invoke('tenant_delete', { tenantId });
  },

  /**
   * Update quotas
   */
  updateQuotas: async (
    tenantId: string,
    quotas: Partial<TenantQuotas>
  ): Promise<TenantQuotas> => {
    return invoke<TenantQuotas>('tenant_update_quotas', { tenantId, quotas });
  },

  /**
   * Get usage
   */
  getUsage: async (tenantId: string): Promise<TenantUsage> => {
    return invoke<TenantUsage>('tenant_get_usage', { tenantId });
  },

  /**
   * Suspend tenant
   */
  suspend: async (tenantId: string, reason: string): Promise<void> => {
    return invoke('tenant_suspend', { tenantId, reason });
  },

  /**
   * Reactivate tenant
   */
  reactivate: async (tenantId: string): Promise<void> => {
    return invoke('tenant_reactivate', { tenantId });
  },

  /**
   * Provision tenant
   */
  provision: async (tenantId: string): Promise<void> => {
    return invoke('tenant_provision', { tenantId });
  },

  /**
   * Deprovision tenant
   */
  deprovision: async (tenantId: string): Promise<void> => {
    return invoke('tenant_deprovision', { tenantId });
  },
};

// ============================================================================
// Role Service
// ============================================================================

export const RoleService = {
  /**
   * Create role
   */
  create: async (
    role: Omit<Role, 'id' | 'createdAt' | 'isSystem'>
  ): Promise<Role> => {
    return invoke<Role>('role_create', { role });
  },

  /**
   * Get all roles
   */
  getAll: async (organizationId: string): Promise<Role[]> => {
    return invoke<Role[]>('role_get_all', { organizationId });
  },

  /**
   * Get role
   */
  get: async (roleId: string): Promise<Role | null> => {
    return invoke<Role | null>('role_get', { roleId });
  },

  /**
   * Update role
   */
  update: async (
    roleId: string,
    updates: Partial<Role>
  ): Promise<Role> => {
    return invoke<Role>('role_update', { roleId, updates });
  },

  /**
   * Delete role
   */
  delete: async (roleId: string): Promise<void> => {
    return invoke('role_delete', { roleId });
  },

  /**
   * Add permission
   */
  addPermission: async (
    roleId: string,
    permission: RolePermission
  ): Promise<Role> => {
    return invoke<Role>('role_add_permission', { roleId, permission });
  },

  /**
   * Remove permission
   */
  removePermission: async (
    roleId: string,
    resource: string
  ): Promise<Role> => {
    return invoke<Role>('role_remove_permission', { roleId, resource });
  },

  /**
   * Check permission
   */
  checkPermission: async (
    userId: string,
    resource: string,
    action: PermissionAction
  ): Promise<boolean> => {
    return invoke<boolean>('role_check_permission', {
      userId,
      resource,
      action,
    });
  },

  /**
   * Get effective permissions
   */
  getEffectivePermissions: async (
    userId: string
  ): Promise<RolePermission[]> => {
    return invoke<RolePermission[]>('role_get_effective_permissions', {
      userId,
    });
  },

  /**
   * Duplicate role
   */
  duplicate: async (roleId: string, newName: string): Promise<Role> => {
    return invoke<Role>('role_duplicate', { roleId, newName });
  },
};

// ============================================================================
// License Service
// ============================================================================

export const LicenseService = {
  /**
   * Activate license
   */
  activate: async (
    organizationId: string,
    licenseKey: string
  ): Promise<OrganizationLicense> => {
    TelemetryService.trackEvent('license_activated');

    return invoke<OrganizationLicense>('license_activate', {
      organizationId,
      licenseKey,
    });
  },

  /**
   * Validate license
   */
  validate: async (
    organizationId: string
  ): Promise<{ valid: boolean; reason?: string }> => {
    return invoke('license_validate', { organizationId });
  },

  /**
   * Get license
   */
  get: async (organizationId: string): Promise<OrganizationLicense | null> => {
    return invoke<OrganizationLicense | null>('license_get', {
      organizationId,
    });
  },

  /**
   * Deactivate license
   */
  deactivate: async (organizationId: string): Promise<void> => {
    return invoke('license_deactivate', { organizationId });
  },

  /**
   * Refresh license
   */
  refresh: async (
    organizationId: string
  ): Promise<OrganizationLicense> => {
    return invoke<OrganizationLicense>('license_refresh', { organizationId });
  },

  /**
   * Get usage
   */
  getUsage: async (
    organizationId: string
  ): Promise<{
    feature: string;
    limit: number;
    used: number;
    percentage: number;
  }[]> => {
    return invoke('license_get_usage', { organizationId });
  },

  /**
   * Check feature
   */
  hasFeature: async (
    organizationId: string,
    feature: string
  ): Promise<boolean> => {
    return invoke<boolean>('license_has_feature', { organizationId, feature });
  },

  /**
   * Check limit
   */
  checkLimit: async (
    organizationId: string,
    limitName: string,
    requested: number
  ): Promise<{ allowed: boolean; available: number }> => {
    return invoke('license_check_limit', {
      organizationId,
      limitName,
      requested,
    });
  },
};

// ============================================================================
// Enterprise Audit Service
// ============================================================================

export const EnterpriseAuditService = {
  /**
   * Get audit logs
   */
  getLogs: async (
    organizationId: string,
    options?: {
      actorId?: string;
      action?: string;
      resourceType?: string;
      resourceId?: string;
      status?: 'success' | 'failure';
      startDate?: number;
      endDate?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ logs: EnterpriseAuditLog[]; total: number }> => {
    return invoke('enterprise_audit_get_logs', { organizationId, options });
  },

  /**
   * Get log by ID
   */
  getLog: async (logId: string): Promise<EnterpriseAuditLog | null> => {
    return invoke<EnterpriseAuditLog | null>('enterprise_audit_get_log', {
      logId,
    });
  },

  /**
   * Search logs
   */
  search: async (
    organizationId: string,
    query: string,
    options?: { limit?: number }
  ): Promise<EnterpriseAuditLog[]> => {
    return invoke<EnterpriseAuditLog[]>('enterprise_audit_search', {
      organizationId,
      query,
      options,
    });
  },

  /**
   * Export logs
   */
  export: async (
    organizationId: string,
    startDate: number,
    endDate: number,
    format: 'json' | 'csv' | 'xlsx'
  ): Promise<string> => {
    return invoke<string>('enterprise_audit_export', {
      organizationId,
      startDate,
      endDate,
      format,
    });
  },

  /**
   * Get activity summary
   */
  getActivitySummary: async (
    organizationId: string,
    timeRange: { start: number; end: number }
  ): Promise<{
    totalActions: number;
    byAction: Record<string, number>;
    byActor: { actorId: string; name: string; count: number }[];
    byResource: { type: string; count: number }[];
    failedActions: number;
  }> => {
    return invoke('enterprise_audit_get_summary', {
      organizationId,
      timeRange,
    });
  },

  /**
   * Set retention policy
   */
  setRetentionPolicy: async (
    organizationId: string,
    retentionDays: number
  ): Promise<void> => {
    return invoke('enterprise_audit_set_retention', {
      organizationId,
      retentionDays,
    });
  },
};

// ============================================================================
// White Label Service
// ============================================================================

export const WhiteLabelService = {
  /**
   * Get branding
   */
  getBranding: async (
    organizationId: string
  ): Promise<OrganizationBranding | null> => {
    return invoke<OrganizationBranding | null>('whitelabel_get_branding', {
      organizationId,
    });
  },

  /**
   * Update branding
   */
  updateBranding: async (
    organizationId: string,
    branding: Partial<OrganizationBranding>
  ): Promise<OrganizationBranding> => {
    return invoke<OrganizationBranding>('whitelabel_update_branding', {
      organizationId,
      branding,
    });
  },

  /**
   * Upload logo
   */
  uploadLogo: async (
    organizationId: string,
    file: File,
    type: 'logo' | 'logo-dark' | 'favicon'
  ): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    return invoke<string>('whitelabel_upload_logo', {
      organizationId,
      file: base64,
      fileName: file.name,
      type,
    });
  },

  /**
   * Remove logo
   */
  removeLogo: async (
    organizationId: string,
    type: 'logo' | 'logo-dark' | 'favicon'
  ): Promise<void> => {
    return invoke('whitelabel_remove_logo', { organizationId, type });
  },

  /**
   * Set custom domain
   */
  setCustomDomain: async (
    organizationId: string,
    domain: string
  ): Promise<{ verified: boolean; dnsRecords: DNSRecord[] }> => {
    return invoke('whitelabel_set_custom_domain', { organizationId, domain });
  },

  /**
   * Verify custom domain
   */
  verifyCustomDomain: async (
    organizationId: string
  ): Promise<{ verified: boolean; error?: string }> => {
    return invoke('whitelabel_verify_domain', { organizationId });
  },

  /**
   * Remove custom domain
   */
  removeCustomDomain: async (organizationId: string): Promise<void> => {
    return invoke('whitelabel_remove_domain', { organizationId });
  },

  /**
   * Update email templates
   */
  updateEmailTemplates: async (
    organizationId: string,
    templates: {
      welcome?: string;
      invitation?: string;
      notification?: string;
    }
  ): Promise<void> => {
    return invoke('whitelabel_update_email_templates', {
      organizationId,
      templates,
    });
  },

  /**
   * Preview email template
   */
  previewEmailTemplate: async (
    organizationId: string,
    templateType: 'welcome' | 'invitation' | 'notification',
    sampleData?: Record<string, unknown>
  ): Promise<string> => {
    return invoke<string>('whitelabel_preview_email', {
      organizationId,
      templateType,
      sampleData,
    });
  },
};

export interface DNSRecord {
  type: 'CNAME' | 'TXT' | 'A';
  name: string;
  value: string;
  ttl: number;
}

// ============================================================================
// Export
// ============================================================================

export const EnterpriseServices = {
  Organization: OrganizationService,
  SSO: SSOService,
  LDAP: LDAPService,
  Tenant: TenantService,
  Role: RoleService,
  License: LicenseService,
  Audit: EnterpriseAuditService,
  WhiteLabel: WhiteLabelService,
};

export default EnterpriseServices;
