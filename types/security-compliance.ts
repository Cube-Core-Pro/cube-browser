/**
 * Enterprise Security & Compliance System
 * CUBE Nexum Platform v2.0 - Enterprise Grade
 * 
 * Features:
 * - Role-Based Access Control (RBAC)
 * - Attribute-Based Access Control (ABAC)
 * - Zero Trust Security Model
 * - Compliance Frameworks (SOC2, GDPR, HIPAA, ISO27001)
 * - Audit Logging
 * - Encryption & Key Management
 * - Security Scanning
 * - Threat Detection
 */

// ============================================================================
// TYPES & ENUMS
// ============================================================================

export type SecurityLevel = 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';

export type ComplianceFramework = 
  | 'SOC2_TYPE1'
  | 'SOC2_TYPE2'
  | 'GDPR'
  | 'HIPAA'
  | 'ISO27001'
  | 'PCI_DSS'
  | 'CCPA'
  | 'NIST'
  | 'FedRAMP'
  | 'HITRUST';

export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export type EncryptionAlgorithm = 'AES-256-GCM' | 'AES-256-CBC' | 'ChaCha20-Poly1305' | 'RSA-OAEP';

export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512' | 'BLAKE3' | 'Argon2id';

export type AuthMethod = 'password' | 'mfa' | 'sso' | 'certificate' | 'biometric' | 'hardware_key';

// ============================================================================
// IDENTITY & ACCESS MANAGEMENT
// ============================================================================

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  // Component compatibility fields
  name?: string;
  mfaEnabled?: boolean;
  lastLogin?: string;
  status: UserStatus;
  roles: string[];
  groups: string[];
  permissions: Permission[];
  attributes: UserAttributes;
  authentication: AuthenticationInfo;
  sessions: SessionInfo[];
  security: UserSecurityProfile;
  compliance: UserCompliance;
  metadata: UserMetadata;
}

export type UserStatus = 'active' | 'inactive' | 'locked' | 'pending' | 'suspended';

export interface UserAttributes {
  department?: string;
  title?: string;
  location?: string;
  manager?: string;
  costCenter?: string;
  employeeId?: string;
  clearanceLevel?: SecurityLevel;
  customAttributes: Record<string, unknown>;
}

export interface AuthenticationInfo {
  methods: AuthMethod[];
  primaryMethod: AuthMethod;
  mfaEnabled: boolean;
  mfaMethods: MFAMethod[];
  passwordPolicy: PasswordPolicyStatus;
  lastPasswordChange: string;
  passwordExpires?: string;
  certificates: CertificateInfo[];
  federatedIdentities: FederatedIdentity[];
}

export interface MFAMethod {
  type: 'totp' | 'sms' | 'email' | 'push' | 'hardware_key' | 'biometric';
  enabled: boolean;
  verified: boolean;
  lastUsed?: string;
  deviceInfo?: string;
}

export interface PasswordPolicyStatus {
  compliant: boolean;
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  violations: string[];
  expiresIn?: number;  // days
}

export interface CertificateInfo {
  id: string;
  subject: string;
  issuer: string;
  serial: string;
  notBefore: string;
  notAfter: string;
  fingerprint: string;
  status: 'valid' | 'expired' | 'revoked';
}

export interface FederatedIdentity {
  provider: string;
  providerId: string;
  email: string;
  linkedAt: string;
  lastUsed?: string;
}

export interface SessionInfo {
  id: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  location?: GeoLocation;
  device?: DeviceInfo;
  riskScore: number;
  status: 'active' | 'expired' | 'revoked';
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  trusted: boolean;
  enrolledAt?: string;
}

export interface UserSecurityProfile {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  anomalies: SecurityAnomaly[];
  failedLogins: number;
  lastFailedLogin?: string;
  lockoutUntil?: string;
  trustedDevices: string[];
  blockedIPs: string[];
}

export interface SecurityAnomaly {
  id: string;
  type: string;
  description: string;
  severity: ThreatSeverity;
  timestamp: string;
  details: Record<string, unknown>;
  resolved: boolean;
}

export interface UserCompliance {
  trainings: ComplianceTraining[];
  acknowledgements: PolicyAcknowledgement[];
  violations: ComplianceViolation[];
  lastReview: string;
  nextReview: string;
}

export interface ComplianceTraining {
  id: string;
  name: string;
  type: string;
  completedAt?: string;
  expiresAt?: string;
  score?: number;
  status: 'required' | 'completed' | 'expired' | 'waived';
}

export interface PolicyAcknowledgement {
  policyId: string;
  policyName: string;
  version: string;
  acknowledgedAt: string;
  expiresAt?: string;
}

export interface ComplianceViolation {
  id: string;
  type: string;
  description: string;
  severity: ThreatSeverity;
  detectedAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface UserMetadata {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  lastLogin?: string;
  loginCount: number;
  source: 'local' | 'ldap' | 'saml' | 'oidc' | 'scim';
}

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================================================

export interface Role {
  id: string;
  name: string;
  description: string;
  type: RoleType;
  permissions: Permission[] | string[];
  inheritsFrom: string[];
  constraints: RoleConstraint[];
  metadata: RoleMetadata;
  // Component compatibility fields
  displayName?: string;
  userCount?: number;
}

export type RoleType = 'system' | 'organization' | 'project' | 'custom';

export interface Permission {
  id: string;
  resource: string;
  action: PermissionAction;
  conditions?: PermissionCondition[];
  effect: 'allow' | 'deny';
}

export type PermissionAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'execute'
  | 'manage'
  | 'admin'
  | '*';

export interface PermissionCondition {
  type: 'attribute' | 'time' | 'ip' | 'resource' | 'custom';
  operator: 'eq' | 'neq' | 'in' | 'not_in' | 'contains' | 'regex' | 'range';
  field: string;
  value: unknown;
}

export interface RoleConstraint {
  type: 'time' | 'location' | 'device' | 'mfa' | 'clearance';
  config: Record<string, unknown>;
}

export interface RoleMetadata {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  builtIn: boolean;
  sensitive: boolean;
  auditRequired: boolean;
}

// ============================================================================
// ATTRIBUTE-BASED ACCESS CONTROL (ABAC)
// ============================================================================

export interface ABACPolicy {
  id: string;
  name: string;
  description: string;
  target: PolicyTarget;
  rules: ABACRule[];
  combiningAlgorithm: CombiningAlgorithm;
  priority: number;
  enabled: boolean;
  metadata: PolicyMetadata;
}

export interface PolicyTarget {
  subjects?: AttributeMatcher[];
  resources?: AttributeMatcher[];
  actions?: string[];
  environments?: AttributeMatcher[];
}

export interface AttributeMatcher {
  attribute: string;
  operator: 'eq' | 'neq' | 'in' | 'not_in' | 'contains' | 'regex' | 'gt' | 'lt' | 'range';
  value: unknown;
}

export interface ABACRule {
  id: string;
  description: string;
  condition: RuleCondition;
  effect: 'permit' | 'deny';
  obligations?: PolicyObligation[];
  advice?: PolicyAdvice[];
}

export interface RuleCondition {
  type: 'simple' | 'and' | 'or' | 'not';
  attribute?: string;
  operator?: string;
  value?: unknown;
  conditions?: RuleCondition[];
}

export type CombiningAlgorithm = 
  | 'deny_overrides'
  | 'permit_overrides'
  | 'first_applicable'
  | 'only_one_applicable'
  | 'deny_unless_permit'
  | 'permit_unless_deny';

export interface PolicyObligation {
  id: string;
  action: string;
  parameters: Record<string, unknown>;
  fulfillOn: 'permit' | 'deny';
}

export interface PolicyAdvice {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface PolicyMetadata {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
  frameworks: ComplianceFramework[];
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  category: AuditCategory;
  action: string;
  outcome: 'success' | 'failure' | 'partial';
  actor: AuditActor;
  target: AuditTarget;
  context: AuditContext;
  changes?: AuditChange[];
  risk: AuditRisk;
  compliance: AuditCompliance;
}

export type AuditEventType = 
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'configuration'
  | 'admin_action'
  | 'security_event'
  | 'compliance_event';

export type AuditCategory = 
  | 'user_management'
  | 'access_control'
  | 'data_operations'
  | 'system_config'
  | 'security'
  | 'compliance'
  | 'integration'
  | 'automation';

export interface AuditActor {
  id: string;
  type: 'user' | 'service' | 'system' | 'api_key' | 'automation';
  name: string;
  email?: string;
  roles?: string[];
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface AuditTarget {
  type: string;
  id: string;
  name?: string;
  path?: string;
  attributes?: Record<string, unknown>;
}

export interface AuditContext {
  requestId: string;
  correlationId?: string;
  source: string;
  method?: string;
  path?: string;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  location?: GeoLocation;
  device?: DeviceInfo;
}

export interface AuditChange {
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
  sensitive?: boolean;
}

export interface AuditRisk {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  anomalous: boolean;
}

export interface AuditCompliance {
  frameworks: ComplianceFramework[];
  controls: string[];
  dataClassification?: SecurityLevel;
  retentionDays: number;
}

// ============================================================================
// ENCRYPTION & KEY MANAGEMENT
// ============================================================================

export interface EncryptionKey {
  id: string;
  name: string;
  type: KeyType;
  algorithm: EncryptionAlgorithm;
  size: number;
  status: KeyStatus;
  purpose: KeyPurpose[];
  metadata: KeyMetadata;
  rotation: KeyRotation;
  access: KeyAccess;
}

export type KeyType = 'symmetric' | 'asymmetric' | 'kek' | 'dek';

export type KeyStatus = 'active' | 'disabled' | 'pending_deletion' | 'deleted' | 'compromised';

export type KeyPurpose = 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'wrap' | 'unwrap';

export interface KeyMetadata {
  createdAt: string;
  createdBy: string;
  expiresAt?: string;
  lastUsed?: string;
  usageCount: number;
  version: number;
  tags: string[];
  description?: string;
}

export interface KeyRotation {
  enabled: boolean;
  intervalDays: number;
  lastRotation?: string;
  nextRotation?: string;
  autoRotate: boolean;
  retainVersions: number;
}

export interface KeyAccess {
  principals: string[];
  roles: string[];
  conditions?: PermissionCondition[];
  auditAccess: boolean;
}

export interface EncryptedData {
  ciphertext: string;
  keyId: string;
  keyVersion: number;
  algorithm: EncryptionAlgorithm;
  iv?: string;
  tag?: string;
  aad?: string;
  encryptedAt: string;
}

export interface SecretEntry {
  id: string;
  name: string;
  path: string;
  value: EncryptedData;
  version: number;
  versions: SecretVersion[];
  metadata: SecretMetadata;
  access: SecretAccess;
}

export interface SecretVersion {
  version: number;
  createdAt: string;
  createdBy: string;
  status: 'current' | 'previous' | 'deprecated' | 'destroyed';
}

export interface SecretMetadata {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  expiresAt?: string;
  rotationEnabled: boolean;
  rotationInterval?: number;
  lastRotation?: string;
  tags: string[];
  description?: string;
}

export interface SecretAccess {
  read: string[];
  write: string[];
  admin: string[];
  auditAccess: boolean;
}

// ============================================================================
// COMPLIANCE MANAGEMENT
// ============================================================================

export interface ComplianceProgram {
  id: string;
  framework: ComplianceFramework;
  status: ComplianceStatus;
  scope: ComplianceScope;
  controls: ComplianceControl[];
  assessments: ComplianceAssessment[];
  evidence: ComplianceEvidence[];
  gaps: ComplianceGap[];
  metrics: ComplianceMetrics;
  metadata: ComplianceMetadata;
}

export type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' | 'not_applicable';

export interface ComplianceScope {
  systems: string[];
  dataTypes: string[];
  locations: string[];
  teams: string[];
  vendors: string[];
  exclusions: string[];
}

export interface ComplianceControl {
  id: string;
  controlId: string;
  name: string;
  description: string;
  category: string;
  status: ComplianceStatus;
  implementation: ControlImplementation;
  testing: ControlTesting;
  evidence: string[];
  risks: string[];
}

export interface ControlImplementation {
  type: 'technical' | 'administrative' | 'physical';
  status: 'implemented' | 'partial' | 'planned' | 'not_implemented';
  description: string;
  tools?: string[];
  policies?: string[];
  procedures?: string[];
}

export interface ControlTesting {
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  lastTested?: string;
  nextTest?: string;
  result?: 'pass' | 'fail' | 'partial';
  tester?: string;
  findings?: string[];
}

export interface ComplianceAssessment {
  id: string;
  type: 'internal' | 'external' | 'automated';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  assessor: string;
  scope: string[];
  findings: AssessmentFinding[];
  report?: string;
}

export interface AssessmentFinding {
  id: string;
  controlId: string;
  type: 'observation' | 'deficiency' | 'material_weakness';
  severity: ThreatSeverity;
  description: string;
  recommendation: string;
  status: 'open' | 'remediated' | 'accepted' | 'deferred';
  dueDate?: string;
  owner?: string;
}

export interface ComplianceEvidence {
  id: string;
  controlId: string;
  type: 'document' | 'screenshot' | 'log' | 'report' | 'policy' | 'procedure';
  name: string;
  description: string;
  path: string;
  hash: string;
  collectedAt: string;
  collectedBy: string;
  expiresAt?: string;
}

export interface ComplianceGap {
  id: string;
  controlId: string;
  description: string;
  severity: ThreatSeverity;
  impact: string;
  remediation: GapRemediation;
  status: 'open' | 'in_progress' | 'remediated' | 'accepted';
}

export interface GapRemediation {
  plan: string;
  owner: string;
  dueDate: string;
  estimatedEffort: string;
  resources: string[];
  milestones: RemediationMilestone[];
}

export interface RemediationMilestone {
  name: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
}

export interface ComplianceMetrics {
  overallScore: number;
  controlsTotal: number;
  controlsCompliant: number;
  controlsPartial: number;
  controlsNonCompliant: number;
  openFindings: number;
  criticalFindings: number;
  averageRemediationDays: number;
  lastAssessment: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ComplianceMetadata {
  createdAt: string;
  updatedAt: string;
  certificationDate?: string;
  expirationDate?: string;
  auditor?: string;
  nextAudit?: string;
}

// ============================================================================
// THREAT DETECTION
// ============================================================================

export interface ThreatAlert {
  id: string;
  type: ThreatType;
  severity: ThreatSeverity;
  status: ThreatStatus;
  source: ThreatSource;
  target: ThreatTarget;
  indicators: ThreatIndicator[];
  analysis: ThreatAnalysis;
  response: ThreatResponse;
  timeline: ThreatEvent[];
  metadata: ThreatMetadata;
}

export type ThreatType = 
  | 'malware'
  | 'phishing'
  | 'brute_force'
  | 'credential_stuffing'
  | 'data_exfiltration'
  | 'insider_threat'
  | 'anomalous_behavior'
  | 'unauthorized_access'
  | 'privilege_escalation'
  | 'ddos'
  | 'injection'
  | 'misconfiguration';

export type ThreatStatus = 
  | 'new'
  | 'investigating'
  | 'confirmed'
  | 'contained'
  | 'remediated'
  | 'false_positive'
  | 'closed';

export interface ThreatSource {
  type: 'external' | 'internal' | 'unknown';
  ipAddress?: string;
  hostname?: string;
  user?: string;
  service?: string;
  location?: GeoLocation;
  reputation?: number;
}

export interface ThreatTarget {
  type: 'user' | 'system' | 'data' | 'service' | 'network';
  id: string;
  name: string;
  sensitivity: SecurityLevel;
}

export interface ThreatIndicator {
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email' | 'behavior' | 'signature';
  value: string;
  confidence: number;
  source: string;
  firstSeen: string;
  lastSeen: string;
  context?: Record<string, unknown>;
}

export interface ThreatAnalysis {
  confidence: number;
  technique?: string;
  tactic?: string;
  mitreAttackId?: string;
  killChainPhase?: string;
  impactAssessment: string;
  riskScore: number;
  relatedAlerts: string[];
}

export interface ThreatResponse {
  automated: boolean;
  actions: ResponseAction[];
  containment: ContainmentStatus;
  owner?: string;
  escalatedTo?: string;
  playbook?: string;
}

export interface ResponseAction {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  automated: boolean;
  executedAt?: string;
  executedBy?: string;
  result?: string;
}

export interface ContainmentStatus {
  contained: boolean;
  actions: string[];
  blockedEntities: string[];
  isolatedSystems: string[];
}

export interface ThreatEvent {
  timestamp: string;
  type: string;
  description: string;
  actor?: string;
  automated: boolean;
  details?: Record<string, unknown>;
}

export interface ThreatMetadata {
  createdAt: string;
  updatedAt: string;
  detectedBy: string;
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
  falsePositiveRate?: number;
  tags: string[];
}

// ============================================================================
// DATA PROTECTION
// ============================================================================

export interface DataClassification {
  id: string;
  name: string;
  level: SecurityLevel;
  description: string;
  handling: DataHandlingRules;
  retention: DataRetention;
  lineage: DataLineage;
}

export interface DataHandlingRules {
  encryption: EncryptionRequirement;
  access: AccessRequirement;
  sharing: SharingPolicy;
  disposal: DisposalPolicy;
  audit: AuditRequirement;
}

export interface EncryptionRequirement {
  atRest: boolean;
  inTransit: boolean;
  algorithm?: EncryptionAlgorithm;
  keyManagement?: string;
}

export interface AccessRequirement {
  authentication: AuthMethod[];
  authorization: string[];
  clearanceLevel?: SecurityLevel;
  approvalRequired?: boolean;
}

export interface SharingPolicy {
  internalSharing: 'allowed' | 'restricted' | 'prohibited';
  externalSharing: 'allowed' | 'restricted' | 'prohibited';
  approvalRequired: boolean;
  allowedRecipients?: string[];
  blockedRecipients?: string[];
}

export interface DisposalPolicy {
  method: 'delete' | 'shred' | 'archive';
  verification: boolean;
  certificate: boolean;
}

export interface AuditRequirement {
  logAccess: boolean;
  logModification: boolean;
  alertOnAccess: boolean;
  retentionDays: number;
}

export interface DataRetention {
  policy: string;
  durationDays: number;
  legalHold: boolean;
  archiveAfterDays?: number;
  deleteAfterDays?: number;
}

export interface DataLineage {
  origin: DataOrigin;
  transformations: DataTransformation[];
  destinations: DataDestination[];
}

export interface DataOrigin {
  source: string;
  type: string;
  timestamp: string;
  owner: string;
}

export interface DataTransformation {
  id: string;
  type: string;
  timestamp: string;
  actor: string;
  description: string;
}

export interface DataDestination {
  target: string;
  type: string;
  timestamp: string;
  purpose: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate user risk score
 */
export function calculateUserRiskScore(user: User): number {
  let score = 0;
  
  // Authentication factors
  if (!user.authentication.mfaEnabled) score += 20;
  if (user.authentication.passwordPolicy.strength === 'weak') score += 15;
  if (user.authentication.passwordPolicy.strength === 'fair') score += 10;
  
  // Security profile factors
  score += user.security.failedLogins * 2;
  score += user.security.anomalies.filter(a => !a.resolved).length * 10;
  
  // Compliance factors
  const overdueTrainings = user.compliance.trainings.filter(
    t => t.status === 'expired' || t.status === 'required'
  ).length;
  score += overdueTrainings * 5;
  
  score += user.compliance.violations.filter(v => !v.resolvedAt).length * 15;
  
  return Math.min(100, score);
}

/**
 * Determine risk level from score
 */
export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

/**
 * Calculate compliance score
 */
export function calculateComplianceScore(program: ComplianceProgram): number {
  const { controlsTotal, controlsCompliant, controlsPartial } = program.metrics;
  if (controlsTotal === 0) return 100;
  
  const score = ((controlsCompliant + controlsPartial * 0.5) / controlsTotal) * 100;
  return Math.round(score * 100) / 100;
}

/**
 * Generate audit log ID
 */
export function generateAuditLogId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 8);
  return `audit_${timestamp}_${random}`;
}

/**
 * Mask sensitive data
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  const masked = '*'.repeat(Math.max(0, data.length - visibleChars * 2));
  return `${start}${masked}${end}`;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): PasswordPolicyStatus {
  const violations: string[] = [];
  let strength: PasswordPolicyStatus['strength'] = 'weak';
  
  if (password.length < 12) violations.push('Minimum 12 characters required');
  if (!/[A-Z]/.test(password)) violations.push('At least one uppercase letter required');
  if (!/[a-z]/.test(password)) violations.push('At least one lowercase letter required');
  if (!/[0-9]/.test(password)) violations.push('At least one number required');
  if (!/[^A-Za-z0-9]/.test(password)) violations.push('At least one special character required');
  if (/(.)\1{2,}/.test(password)) violations.push('No more than 2 consecutive identical characters');
  
  const score = 5 - violations.length;
  if (score >= 5) strength = 'excellent';
  else if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'good';
  else if (score >= 2) strength = 'fair';
  else strength = 'weak';
  
  return {
    compliant: violations.length === 0,
    strength,
    violations,
  };
}

/**
 * Get security level color
 */
export function getSecurityLevelColor(level: SecurityLevel): string {
  const colors: Record<SecurityLevel, string> = {
    public: '#16a34a',
    internal: '#2563eb',
    confidential: '#d97706',
    restricted: '#dc2626',
    top_secret: '#7c2d12',
  };
  return colors[level];
}

/**
 * Get threat severity color
 */
export function getThreatSeverityColor(severity: ThreatSeverity): string {
  const colors: Record<ThreatSeverity, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#2563eb',
    informational: '#6b7280',
  };
  return colors[severity];
}

/**
 * Create default RBAC role
 */
export function createDefaultRole(name: string, type: RoleType): Role {
  return {
    id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    description: '',
    type,
    permissions: [],
    inheritsFrom: [],
    constraints: [],
    metadata: {
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
      builtIn: false,
      sensitive: false,
      auditRequired: true,
    },
  };
}

/**
 * Check if user has permission
 */
export function hasPermission(
  user: User,
  resource: string,
  action: PermissionAction
): boolean {
  // Check direct permissions
  const directPermission = user.permissions.find(
    p => (p.resource === resource || p.resource === '*') && 
         (p.action === action || p.action === '*')
  );
  
  if (directPermission) {
    return directPermission.effect === 'allow';
  }
  
  return false;
}

// ============================================================================
// COMPONENT COMPATIBILITY TYPES
// Used by enterprise dashboard components
// ============================================================================

export interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  type: 'rbac' | 'abac' | 'hybrid';
  rules: PolicyRule[];
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyRule {
  id: string;
  resource: string;
  actions: PermissionAction[];
  effect: 'allow' | 'deny';
  conditions?: Record<string, unknown>;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  type?: AuditEventType;
  category?: AuditCategory;
  action: string;
  outcome?: 'success' | 'failure' | 'partial';
  actor?: {
    id: string;
    name: string;
    type: 'user' | 'service' | 'system';
  };
  resource?: {
    id: string;
    type: string;
    name: string;
  };
  details?: Record<string, unknown>;
  // Component compatibility fields
  userId?: string;
  ipAddress?: string;
  success?: boolean;
  userAgent?: string;
}

export interface EncryptionConfig {
  id: string;
  name: string;
  algorithm: EncryptionAlgorithm;
  keySize: number;
  enabled: boolean;
  rotationDays: number;
  lastRotated?: string;
  scope: 'all' | 'pii' | 'sensitive' | 'custom';
  fields?: string[];
}

export interface SecurityScanResult {
  id: string;
  scanType: 'vulnerability' | 'compliance' | 'penetration' | 'code';
  timestamp: string;
  status: 'passed' | 'failed' | 'warning';
  score: number;
  findings: SecurityFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export interface SecurityFinding {
  id: string;
  severity: ThreatSeverity;
  title: string;
  description: string;
  location?: string;
  recommendation: string;
  status: 'open' | 'resolved' | 'accepted' | 'false_positive';
}

/** Extended User with name for components */
export interface ComponentUser extends User {
  name?: string;
}

/** Extended ComplianceFramework as object for components */
export interface ComplianceFrameworkInfo {
  id: string;
  name: string;
  status: 'compliant' | 'non-compliant' | 'partial' | 'not-assessed';
  lastAudit?: string;
  controlsCompliant: number;
  controlsTotal: number;
}
