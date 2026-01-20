// CUBE Nexum - SuperAdmin Ultimate Types
// 
// Complete type definitions for enterprise-grade SuperAdmin panel
// Competing with: Salesforce Admin, Slack Enterprise, Teams Admin Center,
// RingCentral, Aircall, Five9, Zendesk, HubSpot

// =============================================================================
// USER & TEAM MANAGEMENT
// =============================================================================

export type UserStatus = 'active' | 'suspended' | 'deactivated' | 'pending' | 'locked';
export type UserType = 'internal' | 'external' | 'guest' | 'service_account' | 'bot';

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  timezone: string;
  locale: string;
  status: UserStatus;
  userType: UserType;
  roles: string[];
  teams: string[];
  permissions: string[];
  mfaEnabled: boolean;
  mfaMethods: MFAMethod[];
  ssoEnabled: boolean;
  ssoProvider?: string;
  lastLoginAt?: string;
  lastActivityAt?: string;
  loginCount: number;
  failedLoginAttempts: number;
  passwordChangedAt?: string;
  mustChangePassword: boolean;
  customFields: Record<string, unknown>;
  metadata: UserMetadata;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  invitedBy?: string;
}

export interface UserMetadata {
  deviceCount: number;
  activeSessions: number;
  storageUsed: number;
  apiCallsToday: number;
  riskScore: number;
  complianceStatus: 'compliant' | 'warning' | 'violation';
}

export interface MFAMethod {
  type: 'totp' | 'sms' | 'email' | 'hardware_key' | 'biometric' | 'push';
  enabled: boolean;
  primary: boolean;
  verifiedAt?: string;
  lastUsedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  slug: string;
  parentId?: string;
  children: string[];
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  guestIds: string[];
  visibility: 'public' | 'private' | 'secret';
  settings: TeamSettings;
  quotas: TeamQuotas;
  metrics: TeamMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface TeamSettings {
  allowGuestAccess: boolean;
  allowExternalSharing: boolean;
  requireApprovalToJoin: boolean;
  autoAddNewUsers: boolean;
  defaultRole: string;
  notificationDefaults: Record<string, boolean>;
}

export interface TeamQuotas {
  maxMembers: number;
  maxStorage: number;
  maxApiCalls: number;
  maxIntegrations: number;
}

export interface TeamMetrics {
  memberCount: number;
  activeMembers: number;
  storageUsed: number;
  messagesThisMonth: number;
  callMinutesThisMonth: number;
}

// =============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// =============================================================================

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export' | 'admin';
export type PermissionResource = 
  | 'users' | 'teams' | 'roles' | 'permissions'
  | 'billing' | 'subscriptions' | 'invoices'
  | 'analytics' | 'reports' | 'dashboards'
  | 'security' | 'audit_logs' | 'compliance'
  | 'integrations' | 'api_keys' | 'webhooks'
  | 'workflows' | 'automations' | 'triggers'
  | 'branding' | 'settings' | 'configurations'
  | 'conversations' | 'calls' | 'messages'
  | 'agents' | 'queues' | 'knowledge_base'
  | 'tenants' | 'organizations' | 'workspaces'
  | 'files' | 'storage' | 'backups'
  | 'all';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: PermissionResource;
  action: PermissionAction;
  scope: 'global' | 'organization' | 'team' | 'own';
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in';
  value: unknown;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  level: number; // Hierarchy level (1 = highest)
  permissions: string[];
  inheritsFrom?: string[];
  restrictions?: RoleRestriction[];
  maxUsers?: number;
  assignableBy: string[]; // Role IDs that can assign this role
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface RoleRestriction {
  type: 'ip_whitelist' | 'time_based' | 'mfa_required' | 'device_trust' | 'geo';
  config: Record<string, unknown>;
}

// System Roles (Salesforce/Slack Enterprise Model)
export type SystemRole = 
  | 'super_admin'        // Full system access
  | 'org_admin'          // Organization-wide settings
  | 'billing_admin'      // Billing and subscriptions
  | 'security_admin'     // Security settings
  | 'audit_admin'        // Audit logs access
  | 'users_admin'        // User management
  | 'analytics_admin'    // Analytics dashboards
  | 'content_admin'      // Content moderation
  | 'workflow_admin'     // Workflow management
  | 'integrations_admin' // Integration management
  | 'compliance_admin'   // Compliance features
  | 'support_admin'      // Customer support
  | 'call_center_admin'  // Call center management
  | 'supervisor'         // Team oversight
  | 'agent'              // Standard agent
  | 'member'             // Standard member
  | 'guest';             // Limited access

// =============================================================================
// BILLING & SUBSCRIPTION
// =============================================================================

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
export type BillingCycle = 'monthly' | 'yearly' | 'custom';

export interface Subscription {
  id: string;
  organizationId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  seats: SubscriptionSeats;
  features: SubscriptionFeatures;
  pricing: SubscriptionPricing;
  trial?: SubscriptionTrial;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionSeats {
  total: number;
  used: number;
  available: number;
  includedInPlan: number;
  additionalSeats: number;
  pricePerSeat: number;
}

export interface SubscriptionFeatures {
  // Core Features
  maxUsers: number;
  maxTeams: number;
  maxStorage: number; // in GB
  maxApiCalls: number; // per month
  
  // Call Center Features
  maxConcurrentCalls: number;
  maxCallMinutes: number; // per month
  callRecording: boolean;
  voicemail: boolean;
  ivr: boolean;
  
  // Messaging Features
  maxMessages: number;
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  
  // AI Features
  aiAgents: number;
  aiConversationsPerMonth: number;
  sentimentAnalysis: boolean;
  intentDetection: boolean;
  
  // Enterprise Features
  ssoEnabled: boolean;
  auditLogs: boolean;
  customRoles: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  customBranding: boolean;
  whiteLabel: boolean;
  dedicatedSupport: boolean;
  sla: string;
}

export interface SubscriptionPricing {
  basePrice: number;
  currency: string;
  seatPrice: number;
  usageCharges: UsageCharge[];
  discounts: Discount[];
  totalMonthly: number;
  totalYearly: number;
}

export interface UsageCharge {
  name: string;
  unit: string;
  pricePerUnit: number;
  includedUnits: number;
  usedUnits: number;
  overage: number;
  overageCharge: number;
}

export interface Discount {
  type: 'percentage' | 'fixed' | 'seats' | 'feature';
  value: number;
  reason: string;
  expiresAt?: string;
}

export interface SubscriptionTrial {
  startedAt: string;
  endsAt: string;
  daysRemaining: number;
  convertedAt?: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  subscriptionId: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  lineItems: InvoiceLineItem[];
  taxAmount: number;
  discountAmount: number;
  billingDetails: BillingDetails;
  paymentMethod?: PaymentMethod;
  pdfUrl?: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: 'subscription' | 'seat' | 'usage' | 'addon' | 'discount';
}

export interface BillingDetails {
  companyName: string;
  email: string;
  address: Address;
  taxId?: string;
  poNumber?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'wire' | 'paypal';
  isDefault: boolean;
  card?: CardDetails;
  bankAccount?: BankAccountDetails;
}

export interface CardDetails {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface BankAccountDetails {
  bankName: string;
  last4: string;
  accountType: 'checking' | 'savings';
}

// =============================================================================
// SECURITY SETTINGS
// =============================================================================

export interface SecuritySettings {
  id: string;
  organizationId: string;
  authentication: AuthenticationSettings;
  accessControl: AccessControlSettings;
  dataProtection: DataProtectionSettings;
  monitoring: SecurityMonitoringSettings;
  updatedAt: string;
  updatedBy: string;
}

export interface AuthenticationSettings {
  // Password Policies
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordExpiryDays: number;
  passwordHistoryCount: number;
  passwordMaxAttempts: number;
  passwordLockoutDuration: number; // minutes
  
  // MFA Settings
  mfaRequired: boolean;
  mfaRequiredForAdmins: boolean;
  mfaAllowedMethods: MFAMethod['type'][];
  mfaGracePeriodDays: number;
  
  // SSO Settings
  ssoEnabled: boolean;
  ssoRequired: boolean;
  ssoProviders: SSOProvider[];
  ssoAutoProvisioning: boolean;
  ssoJitProvisioning: boolean;
  
  // Session Settings
  sessionTimeout: number; // minutes
  sessionMaxConcurrent: number;
  sessionRequireReauth: boolean;
  sessionReauthInterval: number; // hours
  rememberMeEnabled: boolean;
  rememberMeDuration: number; // days
}

export interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oidc' | 'oauth2';
  enabled: boolean;
  isPrimary: boolean;
  config: SSOConfig;
  attributeMapping: Record<string, string>;
  domains: string[];
  createdAt: string;
}

export interface SSOConfig {
  // SAML Config
  entityId?: string;
  ssoUrl?: string;
  sloUrl?: string;
  certificate?: string;
  
  // OIDC Config
  issuer?: string;
  clientId?: string;
  clientSecret?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
  
  // Common
  scopes?: string[];
  responseType?: string;
}

export interface AccessControlSettings {
  // IP Controls
  ipWhitelistEnabled: boolean;
  ipWhitelist: string[];
  ipBlacklist: string[];
  
  // Geo Controls
  geoRestrictionsEnabled: boolean;
  allowedCountries: string[];
  blockedCountries: string[];
  
  // Time Controls
  timeBasedAccessEnabled: boolean;
  allowedHours: TimeRange[];
  timezone: string;
  
  // Device Controls
  deviceTrustRequired: boolean;
  trustedDevices: TrustedDevice[];
  maxDevicesPerUser: number;
  
  // Browser Controls
  browserRestrictionsEnabled: boolean;
  allowedBrowsers: string[];
}

export interface TimeRange {
  dayOfWeek: number; // 0-6
  startTime: string; // HH:mm
  endTime: string;
}

export interface TrustedDevice {
  id: string;
  userId: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  fingerprint: string;
  trustedAt: string;
  lastUsedAt: string;
  expiresAt?: string;
}

export interface DataProtectionSettings {
  // Encryption
  encryptionAtRestEnabled: boolean;
  encryptionAlgorithm: string;
  keyRotationDays: number;
  
  // Data Residency
  dataResidency: string; // Region
  allowedRegions: string[];
  
  // Data Masking
  dataMaskingEnabled: boolean;
  maskedFields: string[];
  
  // DLP
  dlpEnabled: boolean;
  dlpRules: DLPRule[];
  
  // File Security
  fileTypeRestrictions: string[];
  maxFileSize: number;
  virusScanEnabled: boolean;
  
  // Retention
  dataRetentionDays: number;
  autoDeleteEnabled: boolean;
}

export interface DLPRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  type: 'regex' | 'keyword' | 'classifier';
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  action: 'alert' | 'block' | 'redact';
  enabled: boolean;
}

export interface SecurityMonitoringSettings {
  // Threat Detection
  threatDetectionEnabled: boolean;
  anomalyDetectionEnabled: boolean;
  
  // Alerts
  suspiciousLoginAlerts: boolean;
  failedLoginAlerts: boolean;
  failedLoginThreshold: number;
  newDeviceAlerts: boolean;
  geoAnomalyAlerts: boolean;
  
  // Notifications
  securityAlertEmails: string[];
  securityAlertWebhook?: string;
  
  // Logging
  enhancedLoggingEnabled: boolean;
  logRetentionDays: number;
}

// =============================================================================
// AUDIT LOGS
// =============================================================================

export type AuditEventSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AuditEventCategory = 
  | 'authentication'
  | 'user_management'
  | 'permission_change'
  | 'data_access'
  | 'configuration'
  | 'integration'
  | 'security'
  | 'billing'
  | 'compliance';

export interface AuditLog {
  id: string;
  organizationId: string;
  timestamp: string;
  category: AuditEventCategory;
  action: string;
  severity: AuditEventSeverity;
  actor: AuditActor;
  target?: AuditTarget;
  context: AuditContext;
  changes?: AuditChange[];
  result: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  metadata: Record<string, unknown>;
}

export interface AuditActor {
  id: string;
  type: 'user' | 'system' | 'api' | 'integration';
  email?: string;
  name?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface AuditTarget {
  id: string;
  type: string;
  name?: string;
}

export interface AuditContext {
  requestId: string;
  source: 'web' | 'api' | 'mobile' | 'integration' | 'system';
  endpoint?: string;
  method?: string;
  geoLocation?: GeoLocation;
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditLogFilter {
  startDate?: string;
  endDate?: string;
  categories?: AuditEventCategory[];
  severities?: AuditEventSeverity[];
  actors?: string[];
  actions?: string[];
  results?: ('success' | 'failure')[];
  search?: string;
}

export interface AuditLogExport {
  id: string;
  format: 'json' | 'csv' | 'pdf';
  filter: AuditLogFilter;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: string;
  createdAt: string;
  createdBy: string;
}

// =============================================================================
// COMPLIANCE
// =============================================================================

export type ComplianceFramework = 'gdpr' | 'ccpa' | 'hipaa' | 'soc2' | 'iso27001' | 'pci_dss';
export type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';

export interface ComplianceSettings {
  id: string;
  organizationId: string;
  frameworks: ComplianceFrameworkConfig[];
  dataSubjectRights: DataSubjectRightsConfig;
  consentManagement: ConsentManagementConfig;
  retentionPolicies: RetentionPolicy[];
  legalHolds: LegalHold[];
  dpaStatus: DPAStatus;
  updatedAt: string;
}

export interface ComplianceFrameworkConfig {
  framework: ComplianceFramework;
  enabled: boolean;
  status: ComplianceStatus;
  lastAssessment?: string;
  nextAssessment?: string;
  controls: ComplianceControl[];
  score: number;
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  status: ComplianceStatus;
  evidence: string[];
  lastVerified?: string;
  notes?: string;
}

export interface DataSubjectRightsConfig {
  accessRequestsEnabled: boolean;
  deletionRequestsEnabled: boolean;
  portabilityEnabled: boolean;
  rectificationEnabled: boolean;
  restrictionEnabled: boolean;
  objectionEnabled: boolean;
  autoProcessRequests: boolean;
  requestResponseDays: number;
  verificationRequired: boolean;
}

export interface ConsentManagementConfig {
  enabled: boolean;
  consentTypes: ConsentType[];
  doubleOptIn: boolean;
  granularConsent: boolean;
  consentExpiry: number; // days
  reConsentReminders: boolean;
}

export interface ConsentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  defaultValue: boolean;
}

export interface RetentionPolicy {
  id: string;
  name: string;
  dataType: string;
  retentionDays: number;
  action: 'delete' | 'archive' | 'anonymize';
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface LegalHold {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'released';
  scope: LegalHoldScope;
  createdAt: string;
  createdBy: string;
  releasedAt?: string;
  releasedBy?: string;
}

export interface LegalHoldScope {
  users: string[];
  teams: string[];
  dateRange?: { start: string; end: string };
  dataTypes: string[];
  keywords?: string[];
}

export interface DPAStatus {
  signed: boolean;
  signedAt?: string;
  signedBy?: string;
  documentUrl?: string;
  expiresAt?: string;
}

// =============================================================================
// BRANDING & WHITE-LABEL
// =============================================================================

export interface BrandingSettings {
  id: string;
  organizationId: string;
  visual: VisualBranding;
  emails: EmailBranding;
  whiteLabel: WhiteLabelConfig;
  customDomain?: CustomDomainConfig;
  updatedAt: string;
}

export interface VisualBranding {
  logo: LogoConfig;
  colors: ColorScheme;
  favicon?: string;
  loginBackground?: string;
  customCss?: string;
}

export interface LogoConfig {
  primary: string;
  secondary?: string;
  icon?: string;
  width?: number;
  height?: number;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface EmailBranding {
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  headerLogo?: string;
  footerText?: string;
  socialLinks?: SocialLink[];
  templates: Record<string, EmailTemplate>;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface EmailTemplate {
  subject: string;
  htmlTemplate: string;
  textTemplate: string;
}

export interface WhiteLabelConfig {
  enabled: boolean;
  removePlatformBranding: boolean;
  customProductName?: string;
  customSupportEmail?: string;
  customSupportUrl?: string;
  customTermsUrl?: string;
  customPrivacyUrl?: string;
  customHelpCenterUrl?: string;
}

export interface CustomDomainConfig {
  domain: string;
  verified: boolean;
  sslEnabled: boolean;
  sslCertificate?: string;
  dnsRecords: DNSRecord[];
}

export interface DNSRecord {
  type: 'CNAME' | 'A' | 'TXT' | 'MX';
  name: string;
  value: string;
  verified: boolean;
}

// =============================================================================
// API MANAGEMENT
// =============================================================================

export interface APISettings {
  id: string;
  organizationId: string;
  enabled: boolean;
  rateLimits: RateLimitConfig;
  keys: APIKey[];
  oauthApps: OAuthApp[];
  webhooks: WebhookConfig[];
  updatedAt: string;
}

export interface RateLimitConfig {
  enabled: boolean;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  customLimits: Record<string, number>;
}

export interface APIKey {
  id: string;
  name: string;
  description?: string;
  key: string; // Masked
  keyPrefix: string;
  scopes: string[];
  ipRestrictions?: string[];
  expiresAt?: string;
  lastUsedAt?: string;
  usageCount: number;
  createdAt: string;
  createdBy: string;
  status: 'active' | 'revoked' | 'expired';
}

export interface OAuthApp {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  clientSecret?: string; // Masked
  redirectUris: string[];
  scopes: string[];
  grantTypes: string[];
  tokenLifetime: number;
  refreshTokenLifetime: number;
  status: 'active' | 'suspended' | 'revoked';
  createdAt: string;
  createdBy: string;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
  retryPolicy: RetryPolicy;
  lastTriggeredAt?: string;
  lastStatus?: number;
  failureCount: number;
  createdAt: string;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// =============================================================================
// INTEGRATION MANAGEMENT
// =============================================================================

export interface IntegrationSettings {
  id: string;
  organizationId: string;
  approvedApps: string[];
  blockedApps: string[];
  dataAccessPolicy: DataAccessPolicy;
  installedIntegrations: InstalledIntegration[];
}

export interface DataAccessPolicy {
  allowReadUserData: boolean;
  allowWriteUserData: boolean;
  allowReadTeamData: boolean;
  allowWriteTeamData: boolean;
  allowFileAccess: boolean;
  requireApproval: boolean;
  approvers: string[];
}

export interface InstalledIntegration {
  id: string;
  appId: string;
  appName: string;
  appIcon?: string;
  category: string;
  status: 'active' | 'suspended' | 'pending_approval';
  scopes: string[];
  installedBy: string;
  installedAt: string;
  lastUsedAt?: string;
  usageStats: IntegrationUsageStats;
}

export interface IntegrationUsageStats {
  apiCallsToday: number;
  apiCallsThisMonth: number;
  dataReadBytes: number;
  dataWriteBytes: number;
  errorRate: number;
}

// =============================================================================
// TENANT & ORGANIZATION
// =============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'standard' | 'enterprise' | 'reseller' | 'partner';
  parentId?: string;
  children: string[];
  ownerId: string;
  adminIds: string[];
  settings: OrganizationSettings;
  subscription: Subscription;
  branding: BrandingSettings;
  security: SecuritySettings;
  compliance: ComplianceSettings;
  metrics: OrganizationMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  timezone: string;
  locale: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  weekStartsOn: number;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

export interface OrganizationMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTeams: number;
  storageUsed: number;
  apiCallsThisMonth: number;
  revenue: number;
  mrr: number;
  arr: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
  status: 'active' | 'suspended' | 'archived';
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  settings: TenantSettings;
  quotas: TenantQuotas;
  usage: TenantUsage;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  isolationLevel: 'shared' | 'dedicated';
  dataResidency: string;
  customDomain?: string;
  features: string[];
}

export interface TenantQuotas {
  maxUsers: number;
  maxStorage: number;
  maxApiCalls: number;
  maxIntegrations: number;
}

export interface TenantUsage {
  currentUsers: number;
  currentStorage: number;
  apiCallsThisMonth: number;
  activeIntegrations: number;
}

// =============================================================================
// ANALYTICS & REPORTING
// =============================================================================

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description?: string;
  type: 'system' | 'custom';
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  refreshInterval: number;
  createdAt: string;
  createdBy?: string;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'map' | 'heatmap' | 'funnel';
  title: string;
  dataSource: string;
  query: WidgetQuery;
  visualization: VisualizationConfig;
  position: { x: number; y: number; w: number; h: number };
}

export interface WidgetQuery {
  metrics: string[];
  dimensions?: string[];
  filters?: QueryFilter[];
  timeRange: TimeRangeConfig;
  groupBy?: string;
  orderBy?: string;
  limit?: number;
}

export interface QueryFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface TimeRangeConfig {
  type: 'relative' | 'absolute';
  relative?: { value: number; unit: 'hour' | 'day' | 'week' | 'month' | 'year' };
  absolute?: { start: string; end: string };
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter';
  colors?: string[];
  showLegend?: boolean;
  showLabels?: boolean;
  stacked?: boolean;
  format?: string;
}

export interface DashboardFilter {
  id: string;
  field: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text';
  options?: { label: string; value: string }[];
  defaultValue?: unknown;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  type: 'scheduled' | 'on_demand';
  template: string;
  query: WidgetQuery;
  format: 'pdf' | 'csv' | 'excel' | 'json';
  schedule?: ReportSchedule;
  recipients: string[];
  lastRunAt?: string;
  nextRunAt?: string;
  status: 'active' | 'paused' | 'error';
  createdAt: string;
  createdBy: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
}

// =============================================================================
// SYSTEM HEALTH & MONITORING
// =============================================================================

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  lastChecked: string;
  uptime: number;
  services: ServiceHealth[];
  incidents: Incident[];
  maintenanceWindows: MaintenanceWindow[];
}

export interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  latency?: number;
  errorRate?: number;
  lastIncident?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  affectedServices: string[];
  startedAt: string;
  resolvedAt?: string;
  updates: IncidentUpdate[];
}

export interface IncidentUpdate {
  timestamp: string;
  status: string;
  message: string;
  updatedBy: string;
}

export interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  scheduledStart: string;
  scheduledEnd: string;
  affectedServices: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'canceled';
}

// =============================================================================
// SUPERADMIN DASHBOARD
// =============================================================================

export interface SuperAdminDashboard {
  overview: SystemOverview;
  realtimeMetrics: RealtimeMetrics;
  alerts: AdminAlert[];
  pendingActions: PendingAction[];
  recentActivity: AuditLog[];
}

export interface SystemOverview {
  totalOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  mrr: number;
  arr: number;
  churnRate: number;
  nps: number;
  systemHealth: SystemHealth;
}

export interface RealtimeMetrics {
  activeConnections: number;
  requestsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeCalls: number;
  activeChats: number;
  queuedConversations: number;
}

export interface AdminAlert {
  id: string;
  type: 'security' | 'billing' | 'compliance' | 'system' | 'usage';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface PendingAction {
  id: string;
  type: 'approval' | 'review' | 'action';
  category: string;
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  dueAt?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}
