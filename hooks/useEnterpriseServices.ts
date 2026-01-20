// ============================================
// CUBE Elite v6 - Enterprise Services Hooks
// Fortune 500 Ready - React Hooks Layer
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

// ============================================
// SSO Types
// ============================================

export interface SSOProviderConfig {
  provider_type: 'saml' | 'oidc' | 'ldap';
  name: string;
  client_id?: string;
  client_secret?: string;
  issuer_url?: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
  redirect_uri: string;
  scopes: string[];
  entity_id?: string;
  sso_url?: string;
  certificate?: string;
  ldap_url?: string;
  ldap_base_dn?: string;
  ldap_bind_dn?: string;
  ldap_bind_password?: string;
}

export interface SSOSession {
  id: string;
  user_id: string;
  provider_id: string;
  email: string;
  name: string;
  roles: string[];
  groups: string[];
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  created_at: number;
}

export interface SSOAuthResult {
  success: boolean;
  session?: SSOSession;
  error?: string;
  redirect_url?: string;
}

// ============================================
// Multi-Tenant Types
// ============================================

export interface TenantSettings {
  custom_domain?: string;
  logo_url?: string;
  primary_color?: string;
  sso_enabled: boolean;
  mfa_required: boolean;
  ip_whitelist: string[];
  allowed_email_domains: string[];
}

export interface TenantLimits {
  max_users: number;
  max_storage_gb: number;
  max_api_calls_per_month: number;
  max_workflows: number;
  max_automations: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'professional' | 'enterprise' | 'unlimited';
  status: 'active' | 'suspended' | 'pending';
  owner_id: string;
  settings: TenantSettings;
  limits: TenantLimits;
  created_at: number;
  updated_at: number;
}

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  joined_at: number;
}

export interface TenantInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  token: string;
  expires_at: number;
  created_at: number;
}

// ============================================
// Payment Types
// ============================================

export interface PaymentCustomer {
  id: string;
  user_id: string;
  email: string;
  name: string;
  stripe_customer_id?: string;
  default_payment_method?: string;
  created_at: number;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  trial_end?: number;
  stripe_subscription_id?: string;
  created_at: number;
}

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripe_price_id?: string;
}

export interface PaymentMethod {
  id: string;
  customer_id: string;
  method_type: 'card' | 'bank_account' | 'paypal';
  last_four?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  stripe_payment_method_id?: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  due_date?: number;
  paid_at?: number;
  stripe_invoice_id?: string;
  pdf_url?: string;
  created_at: number;
}

// ============================================
// Audit Types
// ============================================

export interface AuditEvent {
  id: string;
  tenant_id?: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  category: 'authentication' | 'data_access' | 'security' | 'admin' | 'billing';
  severity: 'info' | 'warning' | 'critical';
  ip_address?: string;
  user_agent?: string;
  details: Record<string, unknown>;
  compliance_tags: string[];
  hash: string;
  previous_hash?: string;
  created_at: number;
}

export interface AuditQuery {
  tenant_id?: string;
  user_id?: string;
  action?: string;
  resource_type?: string;
  category?: string;
  severity?: string;
  start_date?: number;
  end_date?: number;
  compliance_tag?: string;
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  id: string;
  name: string;
  description: string;
  query: AuditQuery;
  generated_at: number;
  total_events: number;
  events_by_category: Record<string, number>;
  events_by_severity: Record<string, number>;
  top_users: [string, number][];
  top_actions: [string, number][];
}

// ============================================
// SSO Hook
// ============================================

export function useSSO() {
  const [providers, setProviders] = useState<SSOProviderConfig[]>([]);
  const [session, setSession] = useState<SSOSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerProvider = useCallback(async (config: SSOProviderConfig): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const providerId = await invoke<string>('sso_register_provider', { config });
      await loadProviders();
      return providerId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register SSO provider';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProviders = useCallback(async () => {
    try {
      const result = await invoke<SSOProviderConfig[]>('sso_list_providers');
      setProviders(result);
    } catch (err) {
      console.error('Failed to load SSO providers:', err);
    }
  }, []);

  const initiateAuth = useCallback(async (providerId: string, redirectUri: string): Promise<SSOAuthResult> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<SSOAuthResult>('sso_initiate_auth', { 
        providerId, 
        redirectUri 
      });
      if (result.redirect_url) {
        window.open(result.redirect_url, '_blank');
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initiate SSO auth';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCallback = useCallback(async (
    providerId: string, 
    code: string, 
    stateParam?: string
  ): Promise<SSOAuthResult> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<SSOAuthResult>('sso_handle_callback', { 
        providerId, 
        code, 
        stateParam 
      });
      if (result.session) {
        setSession(result.session);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to handle SSO callback';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const validateSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      return await invoke<boolean>('sso_validate_session', { sessionId });
    } catch (err) {
      console.error('Failed to validate session:', err);
      return false;
    }
  }, []);

  const logout = useCallback(async (sessionId: string): Promise<void> => {
    setLoading(true);
    try {
      await invoke('sso_logout', { sessionId });
      setSession(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to logout';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  return {
    providers,
    session,
    loading,
    error,
    registerProvider,
    loadProviders,
    initiateAuth,
    handleCallback,
    validateSession,
    logout,
  };
}

// ============================================
// Multi-Tenant Hook
// ============================================

export function useMultiTenant() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTenant = useCallback(async (
    name: string, 
    slug: string, 
    ownerId: string, 
    plan: string
  ): Promise<Tenant> => {
    setLoading(true);
    setError(null);
    try {
      const tenant = await invoke<Tenant>('tenant_create', { 
        name, 
        slug, 
        ownerId, 
        plan 
      });
      setTenants(prev => [...prev, tenant]);
      return tenant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create tenant';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTenant = useCallback(async (tenantId: string): Promise<Tenant> => {
    setLoading(true);
    setError(null);
    try {
      const tenant = await invoke<Tenant>('tenant_get', { tenantId });
      setCurrentTenant(tenant);
      return tenant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get tenant';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const listTenantsForUser = useCallback(async (userId: string): Promise<Tenant[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Tenant[]>('tenant_list_for_user', { userId });
      setTenants(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to list tenants';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (
    tenantId: string, 
    settings: TenantSettings
  ): Promise<Tenant> => {
    setLoading(true);
    setError(null);
    try {
      const tenant = await invoke<Tenant>('tenant_update_settings', { 
        tenantId, 
        settings 
      });
      setCurrentTenant(tenant);
      setTenants(prev => prev.map(t => t.id === tenant.id ? tenant : t));
      return tenant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settings';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const inviteUser = useCallback(async (
    tenantId: string, 
    email: string, 
    role: string
  ): Promise<TenantInvitation> => {
    setLoading(true);
    setError(null);
    try {
      const invitation = await invoke<TenantInvitation>('tenant_invite_user', { 
        tenantId, 
        email, 
        role 
      });
      return invitation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to invite user';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptInvitation = useCallback(async (
    token: string, 
    userId: string
  ): Promise<TenantMember> => {
    setLoading(true);
    setError(null);
    try {
      const member = await invoke<TenantMember>('tenant_accept_invitation', { 
        token, 
        userId 
      });
      setMembers(prev => [...prev, member]);
      return member;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const listMembers = useCallback(async (tenantId: string): Promise<TenantMember[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<TenantMember[]>('tenant_list_members', { tenantId });
      setMembers(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to list members';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeMember = useCallback(async (
    tenantId: string, 
    userId: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await invoke('tenant_remove_member', { tenantId, userId });
      setMembers(prev => prev.filter(m => m.user_id !== userId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tenants,
    currentTenant,
    members,
    loading,
    error,
    createTenant,
    getTenant,
    listTenantsForUser,
    updateSettings,
    inviteUser,
    acceptInvitation,
    listMembers,
    removeMember,
    setCurrentTenant,
  };
}

// ============================================
// Payment Hook
// ============================================

export function usePayment() {
  const [customer, setCustomer] = useState<PaymentCustomer | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCustomer = useCallback(async (
    userId: string, 
    email: string, 
    name: string
  ): Promise<PaymentCustomer> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<PaymentCustomer>('payment_create_customer', { 
        userId, 
        email, 
        name 
      });
      setCustomer(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create customer';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCustomer = useCallback(async (userId: string): Promise<PaymentCustomer> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<PaymentCustomer>('payment_get_customer', { userId });
      setCustomer(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get customer';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlans = useCallback(async (): Promise<PaymentPlan[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<PaymentPlan[]>('payment_list_plans');
      setPlans(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load plans';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubscription = useCallback(async (
    customerId: string, 
    planId: string, 
    trialDays?: number
  ): Promise<Subscription> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Subscription>('payment_create_subscription', { 
        customerId, 
        planId, 
        trialDays 
      });
      setSubscription(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create subscription';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSubscription = useCallback(async (customerId: string): Promise<Subscription> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Subscription>('payment_get_subscription', { customerId });
      setSubscription(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get subscription';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSubscription = useCallback(async (
    subscriptionId: string, 
    immediate: boolean = false
  ): Promise<Subscription> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Subscription>('payment_cancel_subscription', { 
        subscriptionId, 
        immediate 
      });
      setSubscription(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPaymentMethod = useCallback(async (
    customerId: string,
    methodType: string,
    lastFour?: string,
    brand?: string,
    expMonth?: number,
    expYear?: number
  ): Promise<PaymentMethod> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<PaymentMethod>('payment_add_method', { 
        customerId,
        methodType,
        lastFour,
        brand,
        expMonth,
        expYear
      });
      setPaymentMethods(prev => [...prev, result]);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add payment method';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const listPaymentMethods = useCallback(async (customerId: string): Promise<PaymentMethod[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<PaymentMethod[]>('payment_list_methods', { customerId });
      setPaymentMethods(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to list payment methods';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const listInvoices = useCallback(async (customerId: string): Promise<Invoice[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Invoice[]>('payment_list_invoices', { customerId });
      setInvoices(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to list invoices';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  return {
    customer,
    subscription,
    plans,
    paymentMethods,
    invoices,
    loading,
    error,
    createCustomer,
    getCustomer,
    loadPlans,
    createSubscription,
    getSubscription,
    cancelSubscription,
    addPaymentMethod,
    listPaymentMethods,
    listInvoices,
  };
}

// ============================================
// Audit Hook
// ============================================

export function useAudit() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logEvent = useCallback(async (
    userId: string,
    action: string,
    resourceType: string,
    category: string,
    severity: string,
    options?: {
      tenantId?: string;
      resourceId?: string;
      ipAddress?: string;
      userAgent?: string;
      details?: Record<string, unknown>;
      complianceTags?: string[];
    }
  ): Promise<AuditEvent> => {
    try {
      const event = await invoke<AuditEvent>('audit_log_event', {
        tenantId: options?.tenantId,
        userId,
        action,
        resourceType,
        resourceId: options?.resourceId,
        category,
        severity,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        details: options?.details || {},
        complianceTags: options?.complianceTags || [],
      });
      setEvents(prev => [event, ...prev]);
      return event;
    } catch (err) {
      console.error('Failed to log audit event:', err);
      throw err;
    }
  }, []);

  const queryEvents = useCallback(async (query: AuditQuery): Promise<AuditEvent[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<AuditEvent[]>('audit_query_events', { query });
      setEvents(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to query events';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyChain = useCallback(async (
    startId?: string, 
    endId?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<boolean>('audit_verify_chain', { startId, endId });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify chain';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateReport = useCallback(async (
    name: string, 
    description: string, 
    query: AuditQuery
  ): Promise<AuditReport> => {
    setLoading(true);
    setError(null);
    try {
      const report = await invoke<AuditReport>('audit_generate_report', { 
        name, 
        description, 
        query 
      });
      setReports(prev => [report, ...prev]);
      return report;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportEvents = useCallback(async (
    query: AuditQuery, 
    format: 'json' | 'csv'
  ): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoke<string>('audit_export_events', { query, format });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export events';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadExport = useCallback(async (
    query: AuditQuery, 
    format: 'json' | 'csv', 
    filename: string
  ): Promise<void> => {
    const data = await exportEvents(query, format);
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportEvents]);

  return {
    events,
    reports,
    loading,
    error,
    logEvent,
    queryEvents,
    verifyChain,
    generateReport,
    exportEvents,
    downloadExport,
  };
}

// ============================================
// Combined Enterprise Hook
// ============================================

export function useEnterprise() {
  const sso = useSSO();
  const multiTenant = useMultiTenant();
  const payment = usePayment();
  const audit = useAudit();

  const isEnterprise = useCallback((): boolean => {
    const tenant = multiTenant.currentTenant;
    return tenant?.plan === 'enterprise' || tenant?.plan === 'unlimited';
  }, [multiTenant.currentTenant]);

  const getFeatureAccess = useCallback((feature: string): boolean => {
    const tenant = multiTenant.currentTenant;
    if (!tenant) return false;

    const featuresByPlan: Record<string, string[]> = {
      starter: ['basic_automation', 'basic_reports'],
      professional: ['basic_automation', 'basic_reports', 'advanced_automation', 'team_collaboration', 'api_access'],
      enterprise: ['basic_automation', 'basic_reports', 'advanced_automation', 'team_collaboration', 'api_access', 'sso', 'audit_logs', 'custom_integrations', 'priority_support'],
      unlimited: ['basic_automation', 'basic_reports', 'advanced_automation', 'team_collaboration', 'api_access', 'sso', 'audit_logs', 'custom_integrations', 'priority_support', 'white_label', 'dedicated_support', 'custom_development'],
    };

    const allowedFeatures = featuresByPlan[tenant.plan] || [];
    return allowedFeatures.includes(feature);
  }, [multiTenant.currentTenant]);

  const checkLimits = useCallback((resource: keyof TenantLimits, currentUsage: number): boolean => {
    const tenant = multiTenant.currentTenant;
    if (!tenant) return false;

    const limit = tenant.limits[resource];
    if (limit === -1) return true; // Unlimited
    return currentUsage < limit;
  }, [multiTenant.currentTenant]);

  return {
    sso,
    multiTenant,
    payment,
    audit,
    isEnterprise,
    getFeatureAccess,
    checkLimits,
  };
}

export default useEnterprise;
