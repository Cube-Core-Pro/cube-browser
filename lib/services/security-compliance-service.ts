/**
 * Security Compliance Service - Audit & Compliance Management
 *
 * Enterprise-grade compliance monitoring, audit trail, and regulatory
 * reporting for professional automation platforms.
 *
 * M5 Features:
 * - Comprehensive audit trail
 * - Compliance framework support (SOC2, GDPR, HIPAA, etc.)
 * - Policy management
 * - Access control audit
 * - Data handling compliance
 * - Compliance reporting
 * - Risk assessment
 *
 * @module SecurityComplianceService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService } from './telemetry-service';

// ============================================================================
// Audit Trail Types
// ============================================================================

export interface AuditEntry {
  /**
   * Audit entry ID
   */
  id: string;

  /**
   * Entry timestamp
   */
  timestamp: number;

  /**
   * Action type
   */
  action: AuditAction;

  /**
   * Action category
   */
  category: AuditCategory;

  /**
   * Actor (user or system)
   */
  actor: AuditActor;

  /**
   * Target resource
   */
  target: AuditTarget;

  /**
   * Action result
   */
  result: AuditResult;

  /**
   * Previous state (for changes)
   */
  previousState?: Record<string, unknown>;

  /**
   * New state (for changes)
   */
  newState?: Record<string, unknown>;

  /**
   * Request details
   */
  request?: AuditRequest;

  /**
   * Additional metadata
   */
  metadata: Record<string, unknown>;

  /**
   * Related audit IDs
   */
  relatedIds: string[];

  /**
   * Risk level
   */
  riskLevel: 'high' | 'medium' | 'low' | 'none';

  /**
   * Compliance tags
   */
  complianceTags: string[];

  /**
   * Is immutable (cannot be modified)
   */
  isImmutable: boolean;

  /**
   * Digital signature
   */
  signature?: string;
}

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'login-failed'
  | 'password-change'
  | 'mfa-enabled'
  | 'mfa-disabled'
  | 'permission-grant'
  | 'permission-revoke'
  | 'role-assign'
  | 'role-remove'
  | 'export'
  | 'import'
  | 'share'
  | 'download'
  | 'upload'
  | 'encrypt'
  | 'decrypt'
  | 'config-change'
  | 'api-key-create'
  | 'api-key-revoke'
  | 'session-start'
  | 'session-end'
  | 'automation-run'
  | 'custom';

export type AuditCategory =
  | 'authentication'
  | 'authorization'
  | 'data-access'
  | 'data-modification'
  | 'configuration'
  | 'security'
  | 'compliance'
  | 'automation'
  | 'integration'
  | 'system';

export interface AuditActor {
  /**
   * Actor type
   */
  type: 'user' | 'service' | 'system' | 'automation';

  /**
   * Actor ID
   */
  id: string;

  /**
   * Actor name/username
   */
  name: string;

  /**
   * Actor email
   */
  email?: string;

  /**
   * Actor roles
   */
  roles: string[];

  /**
   * IP address
   */
  ipAddress?: string;

  /**
   * User agent
   */
  userAgent?: string;

  /**
   * Session ID
   */
  sessionId?: string;

  /**
   * Geolocation
   */
  geolocation?: {
    country: string;
    city?: string;
  };
}

export interface AuditTarget {
  /**
   * Target type
   */
  type: string;

  /**
   * Target ID
   */
  id: string;

  /**
   * Target name
   */
  name: string;

  /**
   * Target path
   */
  path?: string;

  /**
   * Target owner
   */
  owner?: string;

  /**
   * Data classification
   */
  classification?: DataClassification;
}

export type DataClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'pii'
  | 'phi'
  | 'financial';

export interface AuditResult {
  /**
   * Was successful
   */
  success: boolean;

  /**
   * Result code
   */
  code: number;

  /**
   * Result message
   */
  message?: string;

  /**
   * Error details
   */
  error?: string;

  /**
   * Duration (ms)
   */
  duration?: number;
}

export interface AuditRequest {
  /**
   * HTTP method
   */
  method?: string;

  /**
   * Request URL/path
   */
  path?: string;

  /**
   * Request headers
   */
  headers?: Record<string, string>;

  /**
   * Request body (sanitized)
   */
  body?: Record<string, unknown>;

  /**
   * Query parameters
   */
  query?: Record<string, string>;
}

// ============================================================================
// Compliance Framework Types
// ============================================================================

export interface ComplianceFramework {
  /**
   * Framework ID
   */
  id: string;

  /**
   * Framework name
   */
  name: string;

  /**
   * Framework version
   */
  version: string;

  /**
   * Framework description
   */
  description: string;

  /**
   * Framework type
   */
  type: FrameworkType;

  /**
   * Requirements
   */
  requirements: ComplianceRequirement[];

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Last assessment date
   */
  lastAssessment?: number;

  /**
   * Compliance score (0-100)
   */
  complianceScore?: number;
}

export type FrameworkType =
  | 'soc2'
  | 'gdpr'
  | 'hipaa'
  | 'pci-dss'
  | 'iso27001'
  | 'nist'
  | 'ccpa'
  | 'fedramp'
  | 'custom';

export interface ComplianceRequirement {
  /**
   * Requirement ID
   */
  id: string;

  /**
   * Requirement code (e.g., CC6.1)
   */
  code: string;

  /**
   * Requirement title
   */
  title: string;

  /**
   * Requirement description
   */
  description: string;

  /**
   * Category
   */
  category: string;

  /**
   * Controls that satisfy this requirement
   */
  controlIds: string[];

  /**
   * Compliance status
   */
  status: ComplianceStatus;

  /**
   * Evidence
   */
  evidence: ComplianceEvidence[];

  /**
   * Risk if not compliant
   */
  risk: 'critical' | 'high' | 'medium' | 'low';

  /**
   * Due date for compliance
   */
  dueDate?: number;

  /**
   * Notes
   */
  notes?: string;
}

export type ComplianceStatus =
  | 'compliant'
  | 'non-compliant'
  | 'partial'
  | 'not-applicable'
  | 'pending-review'
  | 'in-progress';

export interface ComplianceEvidence {
  /**
   * Evidence ID
   */
  id: string;

  /**
   * Evidence type
   */
  type: EvidenceType;

  /**
   * Evidence title
   */
  title: string;

  /**
   * Evidence description
   */
  description: string;

  /**
   * File path or URL
   */
  location?: string;

  /**
   * Collection date
   */
  collectedAt: number;

  /**
   * Collector
   */
  collector: string;

  /**
   * Is automated evidence
   */
  isAutomated: boolean;

  /**
   * Valid until
   */
  validUntil?: number;
}

export type EvidenceType =
  | 'policy'
  | 'procedure'
  | 'screenshot'
  | 'log'
  | 'report'
  | 'configuration'
  | 'test-result'
  | 'certificate'
  | 'audit-report'
  | 'other';

// ============================================================================
// Policy Types
// ============================================================================

export interface SecurityPolicy {
  /**
   * Policy ID
   */
  id: string;

  /**
   * Policy name
   */
  name: string;

  /**
   * Policy description
   */
  description: string;

  /**
   * Policy category
   */
  category: PolicyCategory;

  /**
   * Policy type
   */
  type: PolicyType;

  /**
   * Policy rules
   */
  rules: PolicyRule[];

  /**
   * Enforcement level
   */
  enforcement: 'enforce' | 'audit' | 'disabled';

  /**
   * Applicable frameworks
   */
  frameworkIds: string[];

  /**
   * Version
   */
  version: string;

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last update
   */
  updatedAt: number;

  /**
   * Owner
   */
  owner: string;

  /**
   * Approved by
   */
  approvedBy?: string;

  /**
   * Approval date
   */
  approvedAt?: number;

  /**
   * Review due date
   */
  reviewDueDate?: number;
}

export type PolicyCategory =
  | 'access-control'
  | 'data-protection'
  | 'password'
  | 'session'
  | 'encryption'
  | 'network'
  | 'audit'
  | 'incident-response'
  | 'backup'
  | 'custom';

export type PolicyType =
  | 'technical'
  | 'operational'
  | 'administrative';

export interface PolicyRule {
  /**
   * Rule ID
   */
  id: string;

  /**
   * Rule name
   */
  name: string;

  /**
   * Rule description
   */
  description: string;

  /**
   * Rule condition
   */
  condition: PolicyCondition;

  /**
   * Action on violation
   */
  action: PolicyViolationAction;

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Severity
   */
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface PolicyCondition {
  type: string;
  field: string;
  operator: string;
  value: unknown;
  logic?: 'and' | 'or';
  nested?: PolicyCondition[];
}

export interface PolicyViolationAction {
  type: 'block' | 'warn' | 'log' | 'notify' | 'remediate';
  config: Record<string, unknown>;
}

export interface PolicyViolation {
  id: string;
  policyId: string;
  ruleId: string;
  timestamp: number;
  actor: AuditActor;
  target: AuditTarget;
  description: string;
  severity: string;
  status: 'open' | 'resolved' | 'ignored' | 'false-positive';
  resolution?: string;
  resolvedAt?: number;
  resolvedBy?: string;
}

// ============================================================================
// Risk Assessment Types
// ============================================================================

export interface RiskAssessment {
  /**
   * Assessment ID
   */
  id: string;

  /**
   * Assessment name
   */
  name: string;

  /**
   * Assessment scope
   */
  scope: string;

  /**
   * Assessment date
   */
  assessmentDate: number;

  /**
   * Assessor
   */
  assessor: string;

  /**
   * Risk items
   */
  risks: RiskItem[];

  /**
   * Overall risk score
   */
  overallRiskScore: number;

  /**
   * Risk level
   */
  riskLevel: 'critical' | 'high' | 'medium' | 'low';

  /**
   * Status
   */
  status: 'draft' | 'in-review' | 'approved' | 'archived';

  /**
   * Next review date
   */
  nextReviewDate?: number;

  /**
   * Notes
   */
  notes?: string;
}

export interface RiskItem {
  /**
   * Risk ID
   */
  id: string;

  /**
   * Risk title
   */
  title: string;

  /**
   * Risk description
   */
  description: string;

  /**
   * Risk category
   */
  category: string;

  /**
   * Likelihood (1-5)
   */
  likelihood: number;

  /**
   * Impact (1-5)
   */
  impact: number;

  /**
   * Risk score (likelihood * impact)
   */
  riskScore: number;

  /**
   * Current controls
   */
  currentControls: string[];

  /**
   * Residual risk after controls
   */
  residualRisk: number;

  /**
   * Risk treatment
   */
  treatment: RiskTreatment;

  /**
   * Mitigation plan
   */
  mitigationPlan?: string;

  /**
   * Owner
   */
  owner: string;

  /**
   * Due date for mitigation
   */
  dueDate?: number;

  /**
   * Status
   */
  status: 'identified' | 'analyzing' | 'treating' | 'monitoring' | 'closed';
}

export type RiskTreatment =
  | 'accept'
  | 'mitigate'
  | 'transfer'
  | 'avoid';

// ============================================================================
// Audit Trail Service
// ============================================================================

export const AuditTrailService = {
  /**
   * Log an audit entry
   */
  log: async (
    entry: Omit<AuditEntry, 'id' | 'timestamp' | 'isImmutable' | 'signature'>
  ): Promise<AuditEntry> => {
    return invoke<AuditEntry>('audit_log_entry', { entry });
  },

  /**
   * Get audit entries
   */
  getEntries: async (filters?: AuditFilters): Promise<AuditEntry[]> => {
    return invoke<AuditEntry[]>('audit_get_entries', { filters });
  },

  /**
   * Get audit entry by ID
   */
  getEntry: async (entryId: string): Promise<AuditEntry | null> => {
    return invoke<AuditEntry | null>('audit_get_entry', { entryId });
  },

  /**
   * Search audit trail
   */
  search: async (
    query: string,
    options?: AuditSearchOptions
  ): Promise<{
    entries: AuditEntry[];
    total: number;
  }> => {
    return invoke('audit_search', { query, options });
  },

  /**
   * Get audit statistics
   */
  getStats: async (timeRange?: { start: number; end: number }): Promise<AuditStats> => {
    return invoke<AuditStats>('audit_get_stats', { timeRange });
  },

  /**
   * Export audit log
   */
  export: async (
    filters: AuditFilters,
    format: 'json' | 'csv' | 'pdf'
  ): Promise<string> => {
    return invoke<string>('audit_export', { filters, format });
  },

  /**
   * Verify audit entry integrity
   */
  verifyIntegrity: async (entryId: string): Promise<{
    isValid: boolean;
    message: string;
  }> => {
    return invoke('audit_verify_integrity', { entryId });
  },

  /**
   * Get audit trail for resource
   */
  getResourceHistory: async (
    resourceType: string,
    resourceId: string
  ): Promise<AuditEntry[]> => {
    return invoke<AuditEntry[]>('audit_get_resource_history', {
      resourceType,
      resourceId,
    });
  },

  /**
   * Get user activity log
   */
  getUserActivity: async (
    userId: string,
    timeRange?: { start: number; end: number }
  ): Promise<AuditEntry[]> => {
    return invoke<AuditEntry[]>('audit_get_user_activity', {
      userId,
      timeRange,
    });
  },
};

export interface AuditFilters {
  startTime?: number;
  endTime?: number;
  actions?: AuditAction[];
  categories?: AuditCategory[];
  actorIds?: string[];
  actorTypes?: string[];
  targetTypes?: string[];
  targetIds?: string[];
  results?: boolean;
  riskLevels?: string[];
  complianceTags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditSearchOptions {
  limit?: number;
  offset?: number;
  fields?: string[];
  highlight?: boolean;
}

export interface AuditStats {
  total: number;
  byAction: Record<string, number>;
  byCategory: Record<string, number>;
  byActor: Record<string, number>;
  byResult: { success: number; failure: number };
  byRiskLevel: Record<string, number>;
  byHour: { hour: number; count: number }[];
  topActors: { id: string; name: string; count: number }[];
  topTargets: { id: string; name: string; count: number }[];
}

// ============================================================================
// Compliance Service
// ============================================================================

export const ComplianceService = {
  /**
   * Get compliance frameworks
   */
  getFrameworks: async (): Promise<ComplianceFramework[]> => {
    return invoke<ComplianceFramework[]>('compliance_get_frameworks');
  },

  /**
   * Get framework by ID
   */
  getFramework: async (
    frameworkId: string
  ): Promise<ComplianceFramework | null> => {
    return invoke<ComplianceFramework | null>('compliance_get_framework', {
      frameworkId,
    });
  },

  /**
   * Enable/Disable framework
   */
  setFrameworkEnabled: async (
    frameworkId: string,
    enabled: boolean
  ): Promise<void> => {
    return invoke('compliance_set_framework_enabled', { frameworkId, enabled });
  },

  /**
   * Update requirement status
   */
  updateRequirementStatus: async (
    frameworkId: string,
    requirementId: string,
    status: ComplianceStatus,
    notes?: string
  ): Promise<void> => {
    return invoke('compliance_update_requirement_status', {
      frameworkId,
      requirementId,
      status,
      notes,
    });
  },

  /**
   * Add evidence
   */
  addEvidence: async (
    frameworkId: string,
    requirementId: string,
    evidence: Omit<ComplianceEvidence, 'id' | 'collectedAt'>
  ): Promise<ComplianceEvidence> => {
    return invoke<ComplianceEvidence>('compliance_add_evidence', {
      frameworkId,
      requirementId,
      evidence,
    });
  },

  /**
   * Remove evidence
   */
  removeEvidence: async (
    frameworkId: string,
    requirementId: string,
    evidenceId: string
  ): Promise<void> => {
    return invoke('compliance_remove_evidence', {
      frameworkId,
      requirementId,
      evidenceId,
    });
  },

  /**
   * Run compliance assessment
   */
  runAssessment: async (
    frameworkId: string
  ): Promise<ComplianceAssessmentResult> => {
    TelemetryService.trackEvent('compliance_assessment_run');

    return invoke<ComplianceAssessmentResult>('compliance_run_assessment', {
      frameworkId,
    });
  },

  /**
   * Get compliance report
   */
  getReport: async (
    frameworkId: string,
    options?: ReportOptions
  ): Promise<ComplianceReport> => {
    return invoke<ComplianceReport>('compliance_get_report', {
      frameworkId,
      options,
    });
  },

  /**
   * Export compliance report
   */
  exportReport: async (
    frameworkId: string,
    format: 'pdf' | 'docx' | 'html'
  ): Promise<string> => {
    return invoke<string>('compliance_export_report', { frameworkId, format });
  },

  /**
   * Get compliance dashboard data
   */
  getDashboard: async (): Promise<ComplianceDashboard> => {
    return invoke<ComplianceDashboard>('compliance_get_dashboard');
  },
};

export interface ComplianceAssessmentResult {
  frameworkId: string;
  timestamp: number;
  score: number;
  status: 'compliant' | 'non-compliant' | 'partial';
  requirementResults: {
    requirementId: string;
    status: ComplianceStatus;
    gaps: string[];
  }[];
  recommendations: string[];
}

export interface ReportOptions {
  includeEvidence?: boolean;
  includeTimeline?: boolean;
  includeRecommendations?: boolean;
  periodStart?: number;
  periodEnd?: number;
}

export interface ComplianceReport {
  frameworkId: string;
  frameworkName: string;
  generatedAt: number;
  period: { start: number; end: number };
  score: number;
  status: string;
  summary: string;
  requirementSummary: {
    total: number;
    compliant: number;
    nonCompliant: number;
    partial: number;
    notApplicable: number;
  };
  sections: {
    title: string;
    requirements: ComplianceRequirement[];
  }[];
  recommendations: string[];
}

export interface ComplianceDashboard {
  frameworks: {
    id: string;
    name: string;
    score: number;
    status: string;
    lastAssessment?: number;
  }[];
  overallScore: number;
  upcomingDeadlines: {
    frameworkId: string;
    requirementId: string;
    title: string;
    dueDate: number;
  }[];
  recentChanges: {
    timestamp: number;
    framework: string;
    change: string;
  }[];
  riskSummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// ============================================================================
// Policy Service
// ============================================================================

export const PolicyService = {
  /**
   * Create a policy
   */
  createPolicy: async (
    policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SecurityPolicy> => {
    TelemetryService.trackEvent('security_policy_created');

    return invoke<SecurityPolicy>('policy_create', { policy });
  },

  /**
   * Get all policies
   */
  getPolicies: async (filters?: PolicyFilters): Promise<SecurityPolicy[]> => {
    return invoke<SecurityPolicy[]>('policy_get_all', { filters });
  },

  /**
   * Get policy by ID
   */
  getPolicy: async (policyId: string): Promise<SecurityPolicy | null> => {
    return invoke<SecurityPolicy | null>('policy_get', { policyId });
  },

  /**
   * Update policy
   */
  updatePolicy: async (
    policyId: string,
    updates: Partial<SecurityPolicy>
  ): Promise<SecurityPolicy> => {
    return invoke<SecurityPolicy>('policy_update', { policyId, updates });
  },

  /**
   * Delete policy
   */
  deletePolicy: async (policyId: string): Promise<void> => {
    return invoke('policy_delete', { policyId });
  },

  /**
   * Enable/Disable policy
   */
  setEnabled: async (policyId: string, enabled: boolean): Promise<void> => {
    return invoke('policy_set_enabled', { policyId, enabled });
  },

  /**
   * Set enforcement level
   */
  setEnforcement: async (
    policyId: string,
    enforcement: 'enforce' | 'audit' | 'disabled'
  ): Promise<void> => {
    return invoke('policy_set_enforcement', { policyId, enforcement });
  },

  /**
   * Approve policy
   */
  approvePolicy: async (policyId: string): Promise<void> => {
    return invoke('policy_approve', { policyId });
  },

  /**
   * Get policy violations
   */
  getViolations: async (
    filters?: ViolationFilters
  ): Promise<PolicyViolation[]> => {
    return invoke<PolicyViolation[]>('policy_get_violations', { filters });
  },

  /**
   * Resolve violation
   */
  resolveViolation: async (
    violationId: string,
    resolution: string
  ): Promise<void> => {
    return invoke('policy_resolve_violation', { violationId, resolution });
  },

  /**
   * Test policy against data
   */
  testPolicy: async (
    policy: SecurityPolicy,
    testData: Record<string, unknown>[]
  ): Promise<{
    violations: number;
    results: { data: Record<string, unknown>; violated: boolean; rule?: string }[];
  }> => {
    return invoke('policy_test', { policy, testData });
  },
};

export interface PolicyFilters {
  categories?: PolicyCategory[];
  types?: PolicyType[];
  enforcement?: string[];
  isEnabled?: boolean;
  frameworkIds?: string[];
}

export interface ViolationFilters {
  policyIds?: string[];
  severities?: string[];
  statuses?: string[];
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Risk Assessment Service
// ============================================================================

export const RiskAssessmentService = {
  /**
   * Create risk assessment
   */
  createAssessment: async (
    assessment: Omit<RiskAssessment, 'id' | 'overallRiskScore' | 'riskLevel'>
  ): Promise<RiskAssessment> => {
    TelemetryService.trackEvent('risk_assessment_created');

    return invoke<RiskAssessment>('risk_create_assessment', { assessment });
  },

  /**
   * Get all assessments
   */
  getAssessments: async (): Promise<RiskAssessment[]> => {
    return invoke<RiskAssessment[]>('risk_get_assessments');
  },

  /**
   * Get assessment by ID
   */
  getAssessment: async (
    assessmentId: string
  ): Promise<RiskAssessment | null> => {
    return invoke<RiskAssessment | null>('risk_get_assessment', {
      assessmentId,
    });
  },

  /**
   * Update assessment
   */
  updateAssessment: async (
    assessmentId: string,
    updates: Partial<RiskAssessment>
  ): Promise<RiskAssessment> => {
    return invoke<RiskAssessment>('risk_update_assessment', {
      assessmentId,
      updates,
    });
  },

  /**
   * Delete assessment
   */
  deleteAssessment: async (assessmentId: string): Promise<void> => {
    return invoke('risk_delete_assessment', { assessmentId });
  },

  /**
   * Add risk item
   */
  addRiskItem: async (
    assessmentId: string,
    risk: Omit<RiskItem, 'id' | 'riskScore'>
  ): Promise<RiskItem> => {
    return invoke<RiskItem>('risk_add_item', { assessmentId, risk });
  },

  /**
   * Update risk item
   */
  updateRiskItem: async (
    assessmentId: string,
    riskId: string,
    updates: Partial<RiskItem>
  ): Promise<RiskItem> => {
    return invoke<RiskItem>('risk_update_item', {
      assessmentId,
      riskId,
      updates,
    });
  },

  /**
   * Remove risk item
   */
  removeRiskItem: async (
    assessmentId: string,
    riskId: string
  ): Promise<void> => {
    return invoke('risk_remove_item', { assessmentId, riskId });
  },

  /**
   * Calculate risk score
   */
  calculateScore: async (assessmentId: string): Promise<{
    overallScore: number;
    riskLevel: string;
    breakdown: { category: string; score: number }[];
  }> => {
    return invoke('risk_calculate_score', { assessmentId });
  },

  /**
   * Get risk matrix
   */
  getRiskMatrix: async (assessmentId: string): Promise<RiskMatrix> => {
    return invoke<RiskMatrix>('risk_get_matrix', { assessmentId });
  },

  /**
   * Export assessment
   */
  exportAssessment: async (
    assessmentId: string,
    format: 'pdf' | 'docx' | 'xlsx'
  ): Promise<string> => {
    return invoke<string>('risk_export_assessment', { assessmentId, format });
  },

  /**
   * Approve assessment
   */
  approveAssessment: async (assessmentId: string): Promise<void> => {
    return invoke('risk_approve_assessment', { assessmentId });
  },
};

export interface RiskMatrix {
  rows: { likelihood: number; label: string }[];
  columns: { impact: number; label: string }[];
  cells: {
    likelihood: number;
    impact: number;
    level: string;
    color: string;
    risks: RiskItem[];
  }[][];
}

// ============================================================================
// Export
// ============================================================================

export const ComplianceServices = {
  AuditTrail: AuditTrailService,
  Compliance: ComplianceService,
  Policy: PolicyService,
  RiskAssessment: RiskAssessmentService,
};

export default ComplianceServices;
