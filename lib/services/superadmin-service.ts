// CUBE Nexum - SuperAdmin Ultimate Service
// 
// Complete service for enterprise-grade SuperAdmin panel
// Full control over: Users, Teams, Roles, Billing, Security, Compliance, Analytics

import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  User, UserStatus, Team, Role, Permission,
  Subscription, Invoice, PaymentMethod,
  SecuritySettings, AuditLog, AuditLogFilter, AuditLogExport,
  ComplianceSettings, ComplianceFramework,
  BrandingSettings, APISettings, APIKey, WebhookConfig,
  IntegrationSettings, InstalledIntegration,
  Organization, Tenant,
  AnalyticsDashboard, Report,
  SystemHealth, SuperAdminDashboard,
  AdminAlert, PendingAction
} from '../types/superadmin';

// =============================================================================
// SUPERADMIN SERVICE CLASS
// =============================================================================

class SuperAdminService {
  private static instance: SuperAdminService;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): SuperAdminService {
    if (!SuperAdminService.instance) {
      SuperAdminService.instance = new SuperAdminService();
    }
    return SuperAdminService.instance;
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // ===========================================================================
  // USER MANAGEMENT
  // ===========================================================================

  async getUsers(filters?: {
    status?: UserStatus[];
    roles?: string[];
    teams?: string[];
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    try {
      const result = await invoke<{ users: User[]; total: number }>('superadmin_get_users', { filters });
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      return {
        ...result,
        page,
        totalPages: Math.ceil(result.total / limit),
      };
    } catch (error) {
      console.error('Failed to get users:', error);
      throw new Error(`Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUser(userId: string): Promise<User> {
    const cacheKey = `user_${userId}`;
    const cached = this.getCached<User>(cacheKey);
    if (cached) return cached;

    try {
      const user = await invoke<User>('superadmin_get_user', { userId });
      this.setCache(cacheKey, user);
      return user;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const user = await invoke<User>('superadmin_create_user', { userData });
      this.clearCache('users');
      return user;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const user = await invoke<User>('superadmin_update_user', { userId, updates });
      this.clearCache(`user_${userId}`);
      this.clearCache('users');
      return user;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteUser(userId: string, options?: { hardDelete?: boolean; transferTo?: string }): Promise<void> {
    try {
      await invoke('superadmin_delete_user', { userId, options });
      this.clearCache(`user_${userId}`);
      this.clearCache('users');
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async bulkUpdateUsers(
    userIds: string[],
    updates: Partial<User>
  ): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
    try {
      const result = await invoke<{ success: string[]; failed: { id: string; error: string }[] }>(
        'superadmin_bulk_update_users',
        { userIds, updates }
      );
      this.clearCache('users');
      return result;
    } catch (error) {
      console.error('Failed to bulk update users:', error);
      throw new Error(`Failed to bulk update users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async suspendUser(userId: string, reason: string, until?: string): Promise<void> {
    try {
      await invoke('superadmin_suspend_user', { userId, reason, until });
      this.clearCache(`user_${userId}`);
      this.clearCache('users');
    } catch (error) {
      console.error('Failed to suspend user:', error);
      throw new Error(`Failed to suspend user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async reactivateUser(userId: string): Promise<void> {
    try {
      await invoke('superadmin_reactivate_user', { userId });
      this.clearCache(`user_${userId}`);
      this.clearCache('users');
    } catch (error) {
      console.error('Failed to reactivate user:', error);
      throw new Error(`Failed to reactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async impersonateUser(userId: string): Promise<{ token: string; expiresAt: string }> {
    try {
      return await invoke<{ token: string; expiresAt: string }>('superadmin_impersonate_user', { userId });
    } catch (error) {
      console.error('Failed to impersonate user:', error);
      throw new Error(`Failed to impersonate user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async forcePasswordReset(userId: string): Promise<void> {
    try {
      await invoke('superadmin_force_password_reset', { userId });
    } catch (error) {
      console.error('Failed to force password reset:', error);
      throw new Error(`Failed to force password reset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async terminateSessions(userId: string, sessionIds?: string[]): Promise<void> {
    try {
      await invoke('superadmin_terminate_sessions', { userId, sessionIds });
    } catch (error) {
      console.error('Failed to terminate sessions:', error);
      throw new Error(`Failed to terminate sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserSessions(userId: string): Promise<Array<{
    id: string;
    device: string;
    location: string;
    ipAddress: string;
    lastActive: string;
    createdAt: string;
  }>> {
    try {
      return await invoke('superadmin_get_user_sessions', { userId });
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      throw new Error(`Failed to get user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===========================================================================
  // TEAM MANAGEMENT
  // ===========================================================================

  async getTeams(filters?: {
    parentId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ teams: Team[]; total: number }> {
    try {
      return await invoke<{ teams: Team[]; total: number }>('superadmin_get_teams', { filters });
    } catch (error) {
      console.error('Failed to get teams:', error);
      throw new Error(`Failed to get teams: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTeam(teamId: string): Promise<Team> {
    try {
      return await invoke<Team>('superadmin_get_team', { teamId });
    } catch (error) {
      console.error('Failed to get team:', error);
      throw new Error(`Failed to get team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createTeam(teamData: Partial<Team>): Promise<Team> {
    try {
      return await invoke<Team>('superadmin_create_team', { teamData });
    } catch (error) {
      console.error('Failed to create team:', error);
      throw new Error(`Failed to create team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    try {
      return await invoke<Team>('superadmin_update_team', { teamId, updates });
    } catch (error) {
      console.error('Failed to update team:', error);
      throw new Error(`Failed to update team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteTeam(teamId: string, options?: { transferMembersTo?: string }): Promise<void> {
    try {
      await invoke('superadmin_delete_team', { teamId, options });
    } catch (error) {
      console.error('Failed to delete team:', error);
      throw new Error(`Failed to delete team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addTeamMembers(teamId: string, userIds: string[], role?: string): Promise<void> {
    try {
      await invoke('superadmin_add_team_members', { teamId, userIds, role });
    } catch (error) {
      console.error('Failed to add team members:', error);
      throw new Error(`Failed to add team members: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeTeamMembers(teamId: string, userIds: string[]): Promise<void> {
    try {
      await invoke('superadmin_remove_team_members', { teamId, userIds });
    } catch (error) {
      console.error('Failed to remove team members:', error);
      throw new Error(`Failed to remove team members: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===========================================================================
  // ROLE & PERMISSION MANAGEMENT
  // ===========================================================================

  async getRoles(): Promise<Role[]> {
    const cacheKey = 'roles';
    const cached = this.getCached<Role[]>(cacheKey);
    if (cached) return cached;

    try {
      const roles = await invoke<Role[]>('superadmin_get_roles');
      this.setCache(cacheKey, roles);
      return roles;
    } catch (error) {
      console.error('Failed to get roles:', error);
      throw new Error(`Failed to get roles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRole(roleId: string): Promise<Role> {
    try {
      return await invoke<Role>('superadmin_get_role', { roleId });
    } catch (error) {
      console.error('Failed to get role:', error);
      throw new Error(`Failed to get role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createRole(roleData: Partial<Role>): Promise<Role> {
    try {
      const role = await invoke<Role>('superadmin_create_role', { roleData });
      this.clearCache('roles');
      return role;
    } catch (error) {
      console.error('Failed to create role:', error);
      throw new Error(`Failed to create role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    try {
      const role = await invoke<Role>('superadmin_update_role', { roleId, updates });
      this.clearCache('roles');
      return role;
    } catch (error) {
      console.error('Failed to update role:', error);
      throw new Error(`Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteRole(roleId: string, transferTo: string): Promise<void> {
    try {
      await invoke('superadmin_delete_role', { roleId, transferTo });
      this.clearCache('roles');
    } catch (error) {
      console.error('Failed to delete role:', error);
      throw new Error(`Failed to delete role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPermissions(): Promise<Permission[]> {
    try {
      return await invoke<Permission[]>('superadmin_get_permissions');
    } catch (error) {
      console.error('Failed to get permissions:', error);
      throw new Error(`Failed to get permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    try {
      await invoke('superadmin_assign_role', { userId, roleId });
      this.clearCache(`user_${userId}`);
    } catch (error) {
      console.error('Failed to assign role:', error);
      throw new Error(`Failed to assign role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      await invoke('superadmin_remove_role', { userId, roleId });
      this.clearCache(`user_${userId}`);
    } catch (error) {
      console.error('Failed to remove role:', error);
      throw new Error(`Failed to remove role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===========================================================================
  // BILLING & SUBSCRIPTION MANAGEMENT
  // ===========================================================================

  async getSubscription(organizationId?: string): Promise<Subscription> {
    try {
      return await invoke<Subscription>('superadmin_get_subscription', { organizationId });
    } catch (error) {
      console.error('Failed to get subscription:', error);
      throw new Error(`Failed to get subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateSubscription(
    subscriptionId: string,
    updates: { plan?: string; seats?: number; addons?: string[] }
  ): Promise<Subscription> {
    try {
      return await invoke<Subscription>('superadmin_update_subscription', { subscriptionId, updates });
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw new Error(`Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelSubscription(subscriptionId: string, options?: {
    atPeriodEnd?: boolean;
    reason?: string;
    feedback?: string;
  }): Promise<void> {
    try {
      await invoke('superadmin_cancel_subscription', { subscriptionId, options });
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getInvoices(filters?: {
    status?: string[];
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ invoices: Invoice[]; total: number }> {
    try {
      return await invoke<{ invoices: Invoice[]; total: number }>('superadmin_get_invoices', { filters });
    } catch (error) {
      console.error('Failed to get invoices:', error);
      throw new Error(`Failed to get invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    try {
      return await invoke<Invoice>('superadmin_get_invoice', { invoiceId });
    } catch (error) {
      console.error('Failed to get invoice:', error);
      throw new Error(`Failed to get invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadInvoice(invoiceId: string): Promise<string> {
    try {
      return await invoke<string>('superadmin_download_invoice', { invoiceId });
    } catch (error) {
      console.error('Failed to download invoice:', error);
      throw new Error(`Failed to download invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      return await invoke<PaymentMethod[]>('superadmin_get_payment_methods');
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      throw new Error(`Failed to get payment methods: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addPaymentMethod(paymentMethodData: Partial<PaymentMethod>): Promise<PaymentMethod> {
    try {
      return await invoke<PaymentMethod>('superadmin_add_payment_method', { paymentMethodData });
    } catch (error) {
      console.error('Failed to add payment method:', error);
      throw new Error(`Failed to add payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await invoke('superadmin_remove_payment_method', { paymentMethodId });
    } catch (error) {
      console.error('Failed to remove payment method:', error);
      throw new Error(`Failed to remove payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await invoke('superadmin_set_default_payment_method', { paymentMethodId });
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      throw new Error(`Failed to set default payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBillingUsage(period?: { start: string; end: string }): Promise<{
    seats: { used: number; included: number; overage: number };
    apiCalls: { used: number; included: number; overage: number };
    storage: { used: number; included: number; overage: number };
    callMinutes: { used: number; included: number; overage: number };
    estimatedBill: number;
  }> {
    try {
      return await invoke('superadmin_get_billing_usage', { period });
    } catch (error) {
      console.error('Failed to get billing usage:', error);
      throw new Error(`Failed to get billing usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===========================================================================
  // SECURITY SETTINGS
  // ===========================================================================

  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      return await invoke<SecuritySettings>('superadmin_get_security_settings');
    } catch (error) {
      console.error('Failed to get security settings:', error);
      throw new Error(`Failed to get security settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateSecuritySettings(updates: Partial<SecuritySettings>): Promise<SecuritySettings> {
    try {
      return await invoke<SecuritySettings>('superadmin_update_security_settings', { updates });
    } catch (error) {
      console.error('Failed to update security settings:', error);
      throw new Error(`Failed to update security settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async configureSSOProvider(provider: Partial<SecuritySettings['authentication']['ssoProviders'][0]>): Promise<void> {
    try {
      await invoke('superadmin_configure_sso_provider', { provider });
    } catch (error) {
      console.error('Failed to configure SSO provider:', error);
      throw new Error(`Failed to configure SSO provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testSSOConnection(providerId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await invoke('superadmin_test_sso_connection', { providerId });
    } catch (error) {
      console.error('Failed to test SSO connection:', error);
      throw new Error(`Failed to test SSO connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addIPToWhitelist(ip: string, description?: string): Promise<void> {
    try {
      await invoke('superadmin_add_ip_whitelist', { ip, description });
    } catch (error) {
      console.error('Failed to add IP to whitelist:', error);
      throw new Error(`Failed to add IP to whitelist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeIPFromWhitelist(ip: string): Promise<void> {
    try {
      await invoke('superadmin_remove_ip_whitelist', { ip });
    } catch (error) {
      console.error('Failed to remove IP from whitelist:', error);
      throw new Error(`Failed to remove IP from whitelist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async enforceMFAForAll(): Promise<{ affected: number; errors: string[] }> {
    try {
      return await invoke('superadmin_enforce_mfa_all');
    } catch (error) {
      console.error('Failed to enforce MFA:', error);
      throw new Error(`Failed to enforce MFA: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===========================================================================
  // AUDIT LOGS
  // ===========================================================================

  async getAuditLogs(filters?: AuditLogFilter & { page?: number; limit?: number }): Promise<{
    logs: AuditLog[];
    total: number;
  }> {
    try {
      return await invoke<{ logs: AuditLog[]; total: number }>('superadmin_get_audit_logs', { filters });
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      throw new Error(`Failed to get audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAuditLog(logId: string): Promise<AuditLog> {
    try {
      return await invoke<AuditLog>('superadmin_get_audit_log', { logId });
    } catch (error) {
      console.error('Failed to get audit log:', error);
      throw new Error(`Failed to get audit log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exportAuditLogs(filter: AuditLogFilter, format: 'json' | 'csv' | 'pdf'): Promise<AuditLogExport> {
    try {
      return await invoke<AuditLogExport>('superadmin_export_audit_logs', { filter, format });
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      throw new Error(`Failed to export audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAuditLogExport(exportId: string): Promise<AuditLogExport> {
    try {
      return await invoke<AuditLogExport>('superadmin_get_audit_export', { exportId });
    } catch (error) {
      console.error('Failed to get audit export:', error);
      throw new Error(`Failed to get audit export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===========================================================================
  // COMPLIANCE
  // ===========================================================================

  async getComplianceSettings(): Promise<ComplianceSettings> {
    try {
      return await invoke<ComplianceSettings>('superadmin_get_compliance_settings');
    } catch (error) {
      console.error('Failed to get compliance settings:', error);
      throw new Error(`Failed to get compliance settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateComplianceSettings(updates: Partial<ComplianceSettings>): Promise<ComplianceSettings> {
    try {
      return await invoke<ComplianceSettings>('superadmin_update_compliance_settings', { updates });
    } catch (error) {
      console.error('Failed to update compliance settings:', error);
      throw new Error(`Failed to update compliance settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async runComplianceAssessment(framework: ComplianceFramework): Promise<{
    score: number;
    issues: Array<{ control: string; status: string; recommendation: string }>;
  }> {
    try {
      return await invoke('superadmin_run_compliance_assessment', { framework });
    } catch (error) {
      console.error('Failed to run compliance assessment:', error);
      throw new Error(`Failed to run compliance assessment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleDataSubjectRequest(request: {
    type: 'access' | 'deletion' | 'portability' | 'rectification';
    subjectEmail: string;
    details?: string;
  }): Promise<{ requestId: string; status: string }> {
    try {
      return await invoke('superadmin_handle_dsr', { request });
    } catch (error) {
      console.error('Failed to handle data subject request:', error);
      throw new Error(`Failed to handle data subject request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createLegalHold(hold: {
    name: string;
    description: string;
    scope: { users?: string[]; teams?: string[]; dateRange?: { start: string; end: string } };
  }): Promise<{ holdId: string }> {
    try {
      return await invoke('superadmin_create_legal_hold', { hold });
    } catch (error) {
      console.error('Failed to create legal hold:', error);
      throw new Error(`Failed to create legal hold: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async releaseLegalHold(holdId: string): Promise<void> {
    try {
      await invoke('superadmin_release_legal_hold', { holdId });
    } catch (error) {
      console.error('Failed to release legal hold:', error);
      throw new Error(`Failed to release legal hold: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===========================================================================
  // BRANDING & WHITE-LABEL
  // ===========================================================================

  async getBrandingSettings(): Promise<BrandingSettings> {
    try {
      return await invoke<BrandingSettings>('superadmin_get_branding_settings');
    } catch (error) {
      console.error('Failed to get branding settings:', error);
      throw new Error(`Failed to get branding settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateBrandingSettings(updates: Partial<BrandingSettings>): Promise<BrandingSettings> {
    try {
      return await invoke<BrandingSettings>('superadmin_update_branding_settings', { updates });
    } catch (error) {
      console.error('Failed to update branding settings:', error);
      throw new Error(`Failed to update branding settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadBrandingAsset(type: 'logo' | 'favicon' | 'background', file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const bytes = Array.from(new Uint8Array(buffer));
      return await invoke<string>('superadmin_upload_branding_asset', {
        assetType: type,
        filename: file.name,
        mimeType: file.type,
        data: bytes,
      });
    } catch (error) {
      console.error('Failed to upload branding asset:', error);
      throw new Error(`Failed to upload branding asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyCustomDomain(domain: string): Promise<{
    verified: boolean;
    dnsRecords: Array<{ type: string; name: string; value: string; verified: boolean }>;
  }> {
    try {
      return await invoke('superadmin_verify_custom_domain', { domain });
    } catch (error) {
      console.error('Failed to verify custom domain:', error);
      throw new Error(`Failed to verify custom domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===========================================================================
  // API MANAGEMENT
  // ===========================================================================

  async getAPISettings(): Promise<APISettings> {
    try {
      return await invoke<APISettings>('superadmin_get_api_settings');
    } catch (error) {
      console.error('Failed to get API settings:', error);
      throw new Error(`Failed to get API settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateAPISettings(updates: Partial<APISettings>): Promise<APISettings> {
    try {
      return await invoke<APISettings>('superadmin_update_api_settings', { updates });
    } catch (error) {
      console.error('Failed to update API settings:', error);
      throw new Error(`Failed to update API settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createAPIKey(keyData: {
    name: string;
    description?: string;
    scopes: string[];
    expiresAt?: string;
    ipRestrictions?: string[];
  }): Promise<APIKey & { secretKey: string }> {
    try {
      return await invoke('superadmin_create_api_key', { keyData });
    } catch (error) {
      console.error('Failed to create API key:', error);
      throw new Error(`Failed to create API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async revokeAPIKey(keyId: string): Promise<void> {
    try {
      await invoke('superadmin_revoke_api_key', { keyId });
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      throw new Error(`Failed to revoke API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createWebhook(webhookData: Partial<WebhookConfig>): Promise<WebhookConfig> {
    try {
      return await invoke<WebhookConfig>('superadmin_create_webhook', { webhookData });
    } catch (error) {
      console.error('Failed to create webhook:', error);
      throw new Error(`Failed to create webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateWebhook(webhookId: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig> {
    try {
      return await invoke<WebhookConfig>('superadmin_update_webhook', { webhookId, updates });
    } catch (error) {
      console.error('Failed to update webhook:', error);
      throw new Error(`Failed to update webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      await invoke('superadmin_delete_webhook', { webhookId });
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      throw new Error(`Failed to delete webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testWebhook(webhookId: string): Promise<{ success: boolean; response?: unknown; error?: string }> {
    try {
      return await invoke('superadmin_test_webhook', { webhookId });
    } catch (error) {
      console.error('Failed to test webhook:', error);
      throw new Error(`Failed to test webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===========================================================================
  // INTEGRATION MANAGEMENT
  // ===========================================================================

  async getIntegrationSettings(): Promise<IntegrationSettings> {
    try {
      return await invoke<IntegrationSettings>('superadmin_get_integration_settings');
    } catch (error) {
      console.error('Failed to get integration settings:', error);
      throw new Error(`Failed to get integration settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getInstalledIntegrations(): Promise<InstalledIntegration[]> {
    try {
      return await invoke<InstalledIntegration[]>('superadmin_get_installed_integrations');
    } catch (error) {
      console.error('Failed to get installed integrations:', error);
      throw new Error(`Failed to get installed integrations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async installIntegration(appId: string, config?: Record<string, unknown>): Promise<InstalledIntegration> {
    try {
      return await invoke<InstalledIntegration>('superadmin_install_integration', { appId, config });
    } catch (error) {
      console.error('Failed to install integration:', error);
      throw new Error(`Failed to install integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uninstallIntegration(integrationId: string): Promise<void> {
    try {
      await invoke('superadmin_uninstall_integration', { integrationId });
    } catch (error) {
      console.error('Failed to uninstall integration:', error);
      throw new Error(`Failed to uninstall integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async suspendIntegration(integrationId: string, reason: string): Promise<void> {
    try {
      await invoke('superadmin_suspend_integration', { integrationId, reason });
    } catch (error) {
      console.error('Failed to suspend integration:', error);
      throw new Error(`Failed to suspend integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===========================================================================
  // ORGANIZATION & TENANT MANAGEMENT
  // ===========================================================================

  async getOrganization(organizationId?: string): Promise<Organization> {
    try {
      return await invoke<Organization>('superadmin_get_organization', { organizationId });
    } catch (error) {
      console.error('Failed to get organization:', error);
      throw new Error(`Failed to get organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateOrganization(organizationId: string, updates: Partial<Organization>): Promise<Organization> {
    try {
      return await invoke<Organization>('superadmin_update_organization', { organizationId, updates });
    } catch (error) {
      console.error('Failed to update organization:', error);
      throw new Error(`Failed to update organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTenants(): Promise<Tenant[]> {
    try {
      return await invoke<Tenant[]>('superadmin_get_tenants');
    } catch (error) {
      console.error('Failed to get tenants:', error);
      throw new Error(`Failed to get tenants: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createTenant(tenantData: Partial<Tenant>): Promise<Tenant> {
    try {
      return await invoke<Tenant>('superadmin_create_tenant', { tenantData });
    } catch (error) {
      console.error('Failed to create tenant:', error);
      throw new Error(`Failed to create tenant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    try {
      return await invoke<Tenant>('superadmin_update_tenant', { tenantId, updates });
    } catch (error) {
      console.error('Failed to update tenant:', error);
      throw new Error(`Failed to update tenant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async suspendTenant(tenantId: string, reason: string): Promise<void> {
    try {
      await invoke('superadmin_suspend_tenant', { tenantId, reason });
    } catch (error) {
      console.error('Failed to suspend tenant:', error);
      throw new Error(`Failed to suspend tenant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===========================================================================
  // ANALYTICS & REPORTING
  // ===========================================================================

  async getAnalyticsDashboards(): Promise<AnalyticsDashboard[]> {
    try {
      return await invoke<AnalyticsDashboard[]>('superadmin_get_analytics_dashboards');
    } catch (error) {
      console.error('Failed to get analytics dashboards:', error);
      throw new Error(`Failed to get analytics dashboards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAnalyticsDashboard(dashboardId: string): Promise<AnalyticsDashboard> {
    try {
      return await invoke<AnalyticsDashboard>('superadmin_get_analytics_dashboard', { dashboardId });
    } catch (error) {
      console.error('Failed to get analytics dashboard:', error);
      throw new Error(`Failed to get analytics dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createAnalyticsDashboard(dashboardData: Partial<AnalyticsDashboard>): Promise<AnalyticsDashboard> {
    try {
      return await invoke<AnalyticsDashboard>('superadmin_create_analytics_dashboard', { dashboardData });
    } catch (error) {
      console.error('Failed to create analytics dashboard:', error);
      throw new Error(`Failed to create analytics dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getReports(): Promise<Report[]> {
    try {
      return await invoke<Report[]>('superadmin_get_reports');
    } catch (error) {
      console.error('Failed to get reports:', error);
      throw new Error(`Failed to get reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createReport(reportData: Partial<Report>): Promise<Report> {
    try {
      return await invoke<Report>('superadmin_create_report', { reportData });
    } catch (error) {
      console.error('Failed to create report:', error);
      throw new Error(`Failed to create report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async runReport(reportId: string): Promise<{ downloadUrl: string; expiresAt: string }> {
    try {
      return await invoke('superadmin_run_report', { reportId });
    } catch (error) {
      console.error('Failed to run report:', error);
      throw new Error(`Failed to run report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===========================================================================
  // SYSTEM HEALTH & MONITORING
  // ===========================================================================

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      return await invoke<SystemHealth>('superadmin_get_system_health');
    } catch (error) {
      console.error('Failed to get system health:', error);
      throw new Error(`Failed to get system health: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRealtimeMetrics(): Promise<{
    activeConnections: number;
    requestsPerSecond: number;
    averageLatency: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  }> {
    try {
      return await invoke('superadmin_get_realtime_metrics');
    } catch (error) {
      console.error('Failed to get realtime metrics:', error);
      throw new Error(`Failed to get realtime metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===========================================================================
  // SUPERADMIN DASHBOARD
  // ===========================================================================

  async getSuperAdminDashboard(): Promise<SuperAdminDashboard> {
    try {
      return await invoke<SuperAdminDashboard>('superadmin_get_dashboard');
    } catch (error) {
      console.error('Failed to get SuperAdmin dashboard:', error);
      throw new Error(`Failed to get SuperAdmin dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAdminAlerts(filters?: { types?: string[]; acknowledged?: boolean }): Promise<AdminAlert[]> {
    try {
      return await invoke<AdminAlert[]>('superadmin_get_alerts', { filters });
    } catch (error) {
      console.error('Failed to get admin alerts:', error);
      throw new Error(`Failed to get admin alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      await invoke('superadmin_acknowledge_alert', { alertId });
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      throw new Error(`Failed to acknowledge alert: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPendingActions(): Promise<PendingAction[]> {
    try {
      return await invoke<PendingAction[]>('superadmin_get_pending_actions');
    } catch (error) {
      console.error('Failed to get pending actions:', error);
      throw new Error(`Failed to get pending actions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async approvePendingAction(actionId: string, comment?: string): Promise<void> {
    try {
      await invoke('superadmin_approve_action', { actionId, comment });
    } catch (error) {
      console.error('Failed to approve action:', error);
      throw new Error(`Failed to approve action: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async rejectPendingAction(actionId: string, reason: string): Promise<void> {
    try {
      await invoke('superadmin_reject_action', { actionId, reason });
    } catch (error) {
      console.error('Failed to reject action:', error);
      throw new Error(`Failed to reject action: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===========================================================================
  // SYSTEM CONFIGURATION
  // ===========================================================================

  async getSystemSettings(): Promise<Record<string, unknown>> {
    try {
      return await invoke('superadmin_get_system_settings');
    } catch (error) {
      console.error('Failed to get system settings:', error);
      throw new Error(`Failed to get system settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateSystemSettings(updates: Record<string, unknown>): Promise<void> {
    try {
      await invoke('superadmin_update_system_settings', { updates });
    } catch (error) {
      console.error('Failed to update system settings:', error);
      throw new Error(`Failed to update system settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async enableMaintenanceMode(options: {
    message?: string;
    allowedIPs?: string[];
    estimatedEndTime?: string;
  }): Promise<void> {
    try {
      await invoke('superadmin_enable_maintenance_mode', { options });
    } catch (error) {
      console.error('Failed to enable maintenance mode:', error);
      throw new Error(`Failed to enable maintenance mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disableMaintenanceMode(): Promise<void> {
    try {
      await invoke('superadmin_disable_maintenance_mode');
    } catch (error) {
      console.error('Failed to disable maintenance mode:', error);
      throw new Error(`Failed to disable maintenance mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async broadcastAnnouncement(announcement: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'critical';
    expiresAt?: string;
  }): Promise<void> {
    try {
      await invoke('superadmin_broadcast_announcement', { announcement });
    } catch (error) {
      console.error('Failed to broadcast announcement:', error);
      throw new Error(`Failed to broadcast announcement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const superAdminService = SuperAdminService.getInstance();

// =============================================================================
// REACT HOOKS
// =============================================================================

export function useSuperAdminDashboard() {
  const [dashboard, setDashboard] = useState<SuperAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superAdminService.getSuperAdminDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refresh]);

  return { dashboard, loading, error, refresh };
}

export function useUsers(filters?: Parameters<SuperAdminService['getUsers']>[0]) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await superAdminService.getUsers(filters);
      setUsers(result.users);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { users, total, loading, error, refresh };
}

export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await superAdminService.getUser(userId);
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateUser = async (updates: Partial<User>) => {
    try {
      const updated = await superAdminService.updateUser(userId, updates);
      setUser(updated);
      return updated;
    } catch (err) {
      throw err;
    }
  };

  return { user, loading, error, refresh, updateUser };
}

export function useTeams(filters?: Parameters<SuperAdminService['getTeams']>[0]) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await superAdminService.getTeams(filters);
      setTeams(result.teams);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { teams, total, loading, error, refresh };
}

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superAdminService.getRoles();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createRole = async (roleData: Partial<Role>) => {
    const role = await superAdminService.createRole(roleData);
    await refresh();
    return role;
  };

  const updateRole = async (roleId: string, updates: Partial<Role>) => {
    const role = await superAdminService.updateRole(roleId, updates);
    await refresh();
    return role;
  };

  const deleteRole = async (roleId: string, transferTo: string) => {
    await superAdminService.deleteRole(roleId, transferTo);
    await refresh();
  };

  return { roles, loading, error, refresh, createRole, updateRole, deleteRole };
}

export function useSecuritySettings() {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superAdminService.getSecuritySettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateSettings = async (updates: Partial<SecuritySettings>) => {
    const updated = await superAdminService.updateSecuritySettings(updates);
    setSettings(updated);
    return updated;
  };

  return { settings, loading, error, refresh, updateSettings };
}

export function useAuditLogs(filters?: AuditLogFilter & { page?: number; limit?: number }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await superAdminService.getAuditLogs(filters);
      setLogs(result.logs);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { logs, total, loading, error, refresh };
}

export function useSubscription(organizationId?: string) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superAdminService.getSubscription(organizationId);
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { subscription, loading, error, refresh };
}

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superAdminService.getSystemHealth();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [refresh]);

  return { health, loading, error, refresh };
}

export function useRealtimeMetrics() {
  const [metrics, setMetrics] = useState<{
    activeConnections: number;
    requestsPerSecond: number;
    averageLatency: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await superAdminService.getRealtimeMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [refresh]);

  return { metrics, loading, error, refresh };
}

export function useAdminAlerts() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superAdminService.getAdminAlerts();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refresh]);

  const acknowledge = async (alertId: string) => {
    await superAdminService.acknowledgeAlert(alertId);
    await refresh();
  };

  return { alerts, loading, error, refresh, acknowledge };
}

export function usePendingActions() {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superAdminService.getPendingActions();
      setActions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending actions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const approve = async (actionId: string, comment?: string) => {
    await superAdminService.approvePendingAction(actionId, comment);
    await refresh();
  };

  const reject = async (actionId: string, reason: string) => {
    await superAdminService.rejectPendingAction(actionId, reason);
    await refresh();
  };

  return { actions, loading, error, refresh, approve, reject };
}
