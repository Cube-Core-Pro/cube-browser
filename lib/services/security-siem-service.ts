/**
 * Security SIEM Service - Security Information and Event Management
 *
 * Enterprise-grade security monitoring, threat detection, and incident
 * response for professional automation platforms.
 *
 * M5 Features:
 * - Real-time security event monitoring
 * - Threat detection and alerts
 * - Security incident management
 * - Compliance reporting
 * - Audit trail
 * - SIEM integration (Splunk, ELK, etc.)
 * - Security playbooks automation
 *
 * @module SecuritySIEMService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService, SpanKind } from './telemetry-service';

// ============================================================================
// Types
// ============================================================================

export interface SecurityEvent {
  /**
   * Event ID
   */
  id: string;

  /**
   * Event type
   */
  type: SecurityEventType;

  /**
   * Event severity
   */
  severity: SecuritySeverity;

  /**
   * Event category
   */
  category: SecurityCategory;

  /**
   * Event timestamp
   */
  timestamp: number;

  /**
   * Event source
   */
  source: EventSource;

  /**
   * Event description
   */
  description: string;

  /**
   * Affected resource
   */
  resource?: SecurityResource;

  /**
   * User involved
   */
  user?: SecurityUser;

  /**
   * IP address
   */
  ipAddress?: string;

  /**
   * Geolocation
   */
  geolocation?: GeoLocation;

  /**
   * Additional metadata
   */
  metadata: Record<string, unknown>;

  /**
   * Related events
   */
  relatedEventIds: string[];

  /**
   * Is event acknowledged
   */
  acknowledged: boolean;

  /**
   * Event status
   */
  status: EventStatus;

  /**
   * MITRE ATT&CK mapping
   */
  mitre?: MitreMapping;

  /**
   * Risk score (0-100)
   */
  riskScore: number;
}

export type SecurityEventType =
  | 'authentication-success'
  | 'authentication-failure'
  | 'authentication-mfa'
  | 'authorization-denied'
  | 'data-access'
  | 'data-export'
  | 'data-modification'
  | 'data-deletion'
  | 'config-change'
  | 'api-call'
  | 'network-anomaly'
  | 'malware-detected'
  | 'vulnerability-scan'
  | 'policy-violation'
  | 'session-hijack'
  | 'brute-force'
  | 'privilege-escalation'
  | 'suspicious-activity'
  | 'compliance-violation'
  | 'custom';

export type SecuritySeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational';

export type SecurityCategory =
  | 'authentication'
  | 'authorization'
  | 'data-protection'
  | 'network'
  | 'endpoint'
  | 'application'
  | 'compliance'
  | 'vulnerability'
  | 'malware'
  | 'insider-threat';

export type EventStatus =
  | 'new'
  | 'investigating'
  | 'contained'
  | 'resolved'
  | 'false-positive';

export interface EventSource {
  /**
   * Source type
   */
  type: 'application' | 'system' | 'network' | 'user' | 'external';

  /**
   * Source name
   */
  name: string;

  /**
   * Source version
   */
  version?: string;

  /**
   * Source host
   */
  host?: string;
}

export interface SecurityResource {
  /**
   * Resource type
   */
  type: string;

  /**
   * Resource ID
   */
  id: string;

  /**
   * Resource name
   */
  name: string;

  /**
   * Resource path
   */
  path?: string;
}

export interface SecurityUser {
  /**
   * User ID
   */
  id: string;

  /**
   * Username
   */
  username: string;

  /**
   * Email
   */
  email?: string;

  /**
   * User roles
   */
  roles: string[];

  /**
   * User department
   */
  department?: string;
}

export interface GeoLocation {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface MitreMapping {
  /**
   * Tactic ID
   */
  tacticId: string;

  /**
   * Tactic name
   */
  tacticName: string;

  /**
   * Technique ID
   */
  techniqueId: string;

  /**
   * Technique name
   */
  techniqueName: string;

  /**
   * Sub-technique ID
   */
  subTechniqueId?: string;
}

// ============================================================================
// Security Incident Types
// ============================================================================

export interface SecurityIncident {
  /**
   * Incident ID
   */
  id: string;

  /**
   * Incident title
   */
  title: string;

  /**
   * Incident description
   */
  description: string;

  /**
   * Incident severity
   */
  severity: SecuritySeverity;

  /**
   * Incident status
   */
  status: IncidentStatus;

  /**
   * Incident priority
   */
  priority: IncidentPriority;

  /**
   * Incident category
   */
  category: SecurityCategory;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last update timestamp
   */
  updatedAt: number;

  /**
   * Detection time
   */
  detectedAt: number;

  /**
   * Containment time
   */
  containedAt?: number;

  /**
   * Resolution time
   */
  resolvedAt?: number;

  /**
   * Assigned to
   */
  assignedTo?: string;

  /**
   * Related events
   */
  eventIds: string[];

  /**
   * Affected resources
   */
  affectedResources: SecurityResource[];

  /**
   * Affected users
   */
  affectedUsers: SecurityUser[];

  /**
   * Timeline entries
   */
  timeline: IncidentTimelineEntry[];

  /**
   * Playbook ID used
   */
  playbookId?: string;

  /**
   * Root cause analysis
   */
  rootCause?: string;

  /**
   * Remediation steps
   */
  remediation: string[];

  /**
   * Lessons learned
   */
  lessonsLearned?: string;

  /**
   * Tags
   */
  tags: string[];

  /**
   * Impact score (0-100)
   */
  impactScore: number;
}

export type IncidentStatus =
  | 'open'
  | 'triaging'
  | 'investigating'
  | 'containing'
  | 'eradicating'
  | 'recovering'
  | 'closed'
  | 'false-positive';

export type IncidentPriority = 'critical' | 'high' | 'medium' | 'low';

export interface IncidentTimelineEntry {
  timestamp: number;
  action: string;
  description: string;
  user?: string;
  automated: boolean;
}

// ============================================================================
// Security Alert Types
// ============================================================================

export interface SecurityAlert {
  /**
   * Alert ID
   */
  id: string;

  /**
   * Alert name
   */
  name: string;

  /**
   * Alert description
   */
  description: string;

  /**
   * Alert severity
   */
  severity: SecuritySeverity;

  /**
   * Alert status
   */
  status: AlertStatus;

  /**
   * Triggering rule ID
   */
  ruleId: string;

  /**
   * Event that triggered the alert
   */
  triggeringEventId: string;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Acknowledged timestamp
   */
  acknowledgedAt?: number;

  /**
   * Acknowledged by
   */
  acknowledgedBy?: string;

  /**
   * Associated incident ID
   */
  incidentId?: string;

  /**
   * Is false positive
   */
  isFalsePositive: boolean;

  /**
   * Notes
   */
  notes: string[];
}

export type AlertStatus =
  | 'active'
  | 'acknowledged'
  | 'investigating'
  | 'resolved'
  | 'suppressed';

// ============================================================================
// Detection Rule Types
// ============================================================================

export interface DetectionRule {
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
   * Rule category
   */
  category: SecurityCategory;

  /**
   * Rule severity
   */
  severity: SecuritySeverity;

  /**
   * Rule type
   */
  type: RuleType;

  /**
   * Rule conditions
   */
  conditions: RuleCondition[];

  /**
   * Condition logic
   */
  conditionLogic: 'and' | 'or';

  /**
   * Alert threshold
   */
  threshold: RuleThreshold;

  /**
   * Actions on match
   */
  actions: RuleAction[];

  /**
   * Is rule enabled
   */
  isEnabled: boolean;

  /**
   * MITRE mapping
   */
  mitre?: MitreMapping;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last update
   */
  updatedAt: number;

  /**
   * Last triggered
   */
  lastTriggered?: number;

  /**
   * Trigger count
   */
  triggerCount: number;

  /**
   * False positive rate
   */
  falsePositiveRate: number;
}

export type RuleType =
  | 'threshold'
  | 'sequence'
  | 'anomaly'
  | 'correlation'
  | 'baseline'
  | 'signature';

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean | string[];
  caseSensitive?: boolean;
}

export type ConditionOperator =
  | 'equals'
  | 'not-equals'
  | 'contains'
  | 'not-contains'
  | 'starts-with'
  | 'ends-with'
  | 'matches-regex'
  | 'greater-than'
  | 'less-than'
  | 'in'
  | 'not-in';

export interface RuleThreshold {
  count: number;
  timeWindow: number; // seconds
  groupBy?: string[];
}

export interface RuleAction {
  type: 'alert' | 'incident' | 'playbook' | 'notify' | 'block' | 'quarantine';
  config: Record<string, unknown>;
}

// ============================================================================
// Security Playbook Types
// ============================================================================

export interface SecurityPlaybook {
  /**
   * Playbook ID
   */
  id: string;

  /**
   * Playbook name
   */
  name: string;

  /**
   * Playbook description
   */
  description: string;

  /**
   * Target incident types
   */
  targetIncidentTypes: SecurityEventType[];

  /**
   * Target severity levels
   */
  targetSeverities: SecuritySeverity[];

  /**
   * Playbook steps
   */
  steps: PlaybookStep[];

  /**
   * Is automated
   */
  isAutomated: boolean;

  /**
   * Requires approval
   */
  requiresApproval: boolean;

  /**
   * Approval roles
   */
  approvalRoles?: string[];

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last execution
   */
  lastExecutedAt?: number;

  /**
   * Execution count
   */
  executionCount: number;

  /**
   * Success rate
   */
  successRate: number;

  /**
   * Average duration (ms)
   */
  averageDuration: number;
}

export interface PlaybookStep {
  /**
   * Step ID
   */
  id: string;

  /**
   * Step name
   */
  name: string;

  /**
   * Step description
   */
  description: string;

  /**
   * Step type
   */
  type: PlaybookStepType;

  /**
   * Step configuration
   */
  config: Record<string, unknown>;

  /**
   * Step order
   */
  order: number;

  /**
   * Timeout (ms)
   */
  timeout: number;

  /**
   * Continue on error
   */
  continueOnError: boolean;

  /**
   * Conditions for execution
   */
  conditions?: RuleCondition[];
}

export type PlaybookStepType =
  | 'gather-info'
  | 'enrich-data'
  | 'analyze'
  | 'contain'
  | 'eradicate'
  | 'recover'
  | 'notify'
  | 'approve'
  | 'script'
  | 'api-call'
  | 'create-ticket'
  | 'document';

export interface PlaybookExecution {
  id: string;
  playbookId: string;
  incidentId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'awaiting-approval';
  startedAt: number;
  completedAt?: number;
  steps: PlaybookStepExecution[];
  error?: string;
}

export interface PlaybookStepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: number;
  completedAt?: number;
  output?: unknown;
  error?: string;
}

// ============================================================================
// SIEM Integration Types
// ============================================================================

export interface SIEMIntegration {
  /**
   * Integration ID
   */
  id: string;

  /**
   * Integration name
   */
  name: string;

  /**
   * SIEM type
   */
  type: SIEMType;

  /**
   * Connection configuration
   */
  config: SIEMConfig;

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Last sync timestamp
   */
  lastSync?: number;

  /**
   * Sync status
   */
  syncStatus: 'connected' | 'disconnected' | 'error';

  /**
   * Error message
   */
  error?: string;

  /**
   * Events synced count
   */
  eventsSynced: number;
}

export type SIEMType =
  | 'splunk'
  | 'elastic'
  | 'qradar'
  | 'sentinel'
  | 'logrhythm'
  | 'arcsight'
  | 'sumo-logic'
  | 'chronicle'
  | 'custom';

export interface SIEMConfig {
  endpoint: string;
  apiKey?: string;
  username?: string;
  password?: string;
  index?: string;
  sourcetype?: string;
  batchSize?: number;
  flushInterval?: number;
  tls?: {
    enabled: boolean;
    skipVerify?: boolean;
    certPath?: string;
  };
}

// ============================================================================
// Security SIEM Service
// ============================================================================

export const SecuritySIEMService = {
  /**
   * Log a security event
   */
  logEvent: async (
    event: Omit<SecurityEvent, 'id' | 'timestamp'>
  ): Promise<SecurityEvent> => {
    return invoke<SecurityEvent>('security_log_event', { event });
  },

  /**
   * Get security events
   */
  getEvents: async (filters?: EventFilters): Promise<SecurityEvent[]> => {
    return invoke<SecurityEvent[]>('security_get_events', { filters });
  },

  /**
   * Get event by ID
   */
  getEvent: async (eventId: string): Promise<SecurityEvent | null> => {
    return invoke<SecurityEvent | null>('security_get_event', { eventId });
  },

  /**
   * Acknowledge event
   */
  acknowledgeEvent: async (eventId: string): Promise<void> => {
    return invoke('security_acknowledge_event', { eventId });
  },

  /**
   * Update event status
   */
  updateEventStatus: async (
    eventId: string,
    status: EventStatus
  ): Promise<void> => {
    return invoke('security_update_event_status', { eventId, status });
  },

  /**
   * Get event statistics
   */
  getEventStats: async (timeRange?: TimeRange): Promise<EventStats> => {
    return invoke<EventStats>('security_get_event_stats', { timeRange });
  },

  /**
   * Search events
   */
  searchEvents: async (query: string, options?: SearchOptions): Promise<{
    events: SecurityEvent[];
    total: number;
    facets: Record<string, { value: string; count: number }[]>;
  }> => {
    return invoke('security_search_events', { query, options });
  },

  /**
   * Export events
   */
  exportEvents: async (
    filters: EventFilters,
    format: 'json' | 'csv' | 'cef' | 'syslog'
  ): Promise<string> => {
    return invoke<string>('security_export_events', { filters, format });
  },
};

export interface EventFilters {
  startTime?: number;
  endTime?: number;
  types?: SecurityEventType[];
  severities?: SecuritySeverity[];
  categories?: SecurityCategory[];
  statuses?: EventStatus[];
  sources?: string[];
  users?: string[];
  ipAddresses?: string[];
  riskScoreMin?: number;
  riskScoreMax?: number;
  limit?: number;
  offset?: number;
}

export interface EventStats {
  total: number;
  bySeverity: Record<SecuritySeverity, number>;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byHour: { hour: number; count: number }[];
  topSources: { source: string; count: number }[];
  topUsers: { user: string; count: number }[];
  averageRiskScore: number;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  facets?: string[];
}

// ============================================================================
// Security Incident Service
// ============================================================================

export const SecurityIncidentService = {
  /**
   * Create an incident
   */
  createIncident: async (
    incident: Omit<SecurityIncident, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>
  ): Promise<SecurityIncident> => {
    TelemetryService.trackEvent('security_incident_created');

    return invoke<SecurityIncident>('security_create_incident', { incident });
  },

  /**
   * Get all incidents
   */
  getIncidents: async (filters?: IncidentFilters): Promise<SecurityIncident[]> => {
    return invoke<SecurityIncident[]>('security_get_incidents', { filters });
  },

  /**
   * Get incident by ID
   */
  getIncident: async (incidentId: string): Promise<SecurityIncident | null> => {
    return invoke<SecurityIncident | null>('security_get_incident', {
      incidentId,
    });
  },

  /**
   * Update incident
   */
  updateIncident: async (
    incidentId: string,
    updates: Partial<SecurityIncident>
  ): Promise<SecurityIncident> => {
    return invoke<SecurityIncident>('security_update_incident', {
      incidentId,
      updates,
    });
  },

  /**
   * Update incident status
   */
  updateIncidentStatus: async (
    incidentId: string,
    status: IncidentStatus,
    note?: string
  ): Promise<void> => {
    return invoke('security_update_incident_status', {
      incidentId,
      status,
      note,
    });
  },

  /**
   * Assign incident
   */
  assignIncident: async (
    incidentId: string,
    assignee: string
  ): Promise<void> => {
    return invoke('security_assign_incident', { incidentId, assignee });
  },

  /**
   * Add timeline entry
   */
  addTimelineEntry: async (
    incidentId: string,
    entry: Omit<IncidentTimelineEntry, 'timestamp'>
  ): Promise<void> => {
    return invoke('security_add_timeline_entry', { incidentId, entry });
  },

  /**
   * Link events to incident
   */
  linkEvents: async (incidentId: string, eventIds: string[]): Promise<void> => {
    return invoke('security_link_events', { incidentId, eventIds });
  },

  /**
   * Close incident
   */
  closeIncident: async (
    incidentId: string,
    resolution: {
      rootCause: string;
      remediation: string[];
      lessonsLearned?: string;
    }
  ): Promise<void> => {
    TelemetryService.trackEvent('security_incident_closed');

    return invoke('security_close_incident', { incidentId, resolution });
  },

  /**
   * Get incident statistics
   */
  getIncidentStats: async (timeRange?: TimeRange): Promise<IncidentStats> => {
    return invoke<IncidentStats>('security_get_incident_stats', { timeRange });
  },

  /**
   * Create incident from alert
   */
  createFromAlert: async (alertId: string): Promise<SecurityIncident> => {
    return invoke<SecurityIncident>('security_create_incident_from_alert', {
      alertId,
    });
  },
};

export interface IncidentFilters {
  statuses?: IncidentStatus[];
  severities?: SecuritySeverity[];
  priorities?: IncidentPriority[];
  categories?: SecurityCategory[];
  assignee?: string;
  startTime?: number;
  endTime?: number;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface IncidentStats {
  total: number;
  open: number;
  closed: number;
  bySeverity: Record<SecuritySeverity, number>;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  meanTimeToDetect: number;
  meanTimeToContain: number;
  meanTimeToResolve: number;
}

// ============================================================================
// Security Alert Service
// ============================================================================

export const SecurityAlertService = {
  /**
   * Get alerts
   */
  getAlerts: async (filters?: AlertFilters): Promise<SecurityAlert[]> => {
    return invoke<SecurityAlert[]>('security_get_alerts', { filters });
  },

  /**
   * Get alert by ID
   */
  getAlert: async (alertId: string): Promise<SecurityAlert | null> => {
    return invoke<SecurityAlert | null>('security_get_alert', { alertId });
  },

  /**
   * Acknowledge alert
   */
  acknowledgeAlert: async (alertId: string, note?: string): Promise<void> => {
    return invoke('security_acknowledge_alert', { alertId, note });
  },

  /**
   * Update alert status
   */
  updateAlertStatus: async (
    alertId: string,
    status: AlertStatus
  ): Promise<void> => {
    return invoke('security_update_alert_status', { alertId, status });
  },

  /**
   * Mark as false positive
   */
  markFalsePositive: async (
    alertId: string,
    reason: string
  ): Promise<void> => {
    return invoke('security_mark_false_positive', { alertId, reason });
  },

  /**
   * Suppress alert
   */
  suppressAlert: async (
    alertId: string,
    duration: number
  ): Promise<void> => {
    return invoke('security_suppress_alert', { alertId, duration });
  },

  /**
   * Add note to alert
   */
  addNote: async (alertId: string, note: string): Promise<void> => {
    return invoke('security_add_alert_note', { alertId, note });
  },
};

export interface AlertFilters {
  statuses?: AlertStatus[];
  severities?: SecuritySeverity[];
  ruleIds?: string[];
  startTime?: number;
  endTime?: number;
  acknowledged?: boolean;
  isFalsePositive?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Detection Rule Service
// ============================================================================

export const DetectionRuleService = {
  /**
   * Create a detection rule
   */
  createRule: async (
    rule: Omit<DetectionRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount' | 'falsePositiveRate'>
  ): Promise<DetectionRule> => {
    TelemetryService.trackEvent('detection_rule_created');

    return invoke<DetectionRule>('security_create_detection_rule', { rule });
  },

  /**
   * Get all rules
   */
  getRules: async (filters?: RuleFilters): Promise<DetectionRule[]> => {
    return invoke<DetectionRule[]>('security_get_detection_rules', { filters });
  },

  /**
   * Get rule by ID
   */
  getRule: async (ruleId: string): Promise<DetectionRule | null> => {
    return invoke<DetectionRule | null>('security_get_detection_rule', {
      ruleId,
    });
  },

  /**
   * Update rule
   */
  updateRule: async (
    ruleId: string,
    updates: Partial<DetectionRule>
  ): Promise<DetectionRule> => {
    return invoke<DetectionRule>('security_update_detection_rule', {
      ruleId,
      updates,
    });
  },

  /**
   * Delete rule
   */
  deleteRule: async (ruleId: string): Promise<void> => {
    return invoke('security_delete_detection_rule', { ruleId });
  },

  /**
   * Enable/Disable rule
   */
  setRuleEnabled: async (
    ruleId: string,
    enabled: boolean
  ): Promise<void> => {
    return invoke('security_set_rule_enabled', { ruleId, enabled });
  },

  /**
   * Test rule against sample data
   */
  testRule: async (
    rule: DetectionRule,
    sampleEvents: SecurityEvent[]
  ): Promise<{
    matched: number;
    events: SecurityEvent[];
  }> => {
    return invoke('security_test_detection_rule', { rule, sampleEvents });
  },

  /**
   * Import rules
   */
  importRules: async (
    rules: string,
    format: 'json' | 'sigma' | 'yara'
  ): Promise<{ imported: number; errors: string[] }> => {
    return invoke('security_import_rules', { rules, format });
  },

  /**
   * Export rules
   */
  exportRules: async (
    ruleIds: string[],
    format: 'json' | 'sigma'
  ): Promise<string> => {
    return invoke<string>('security_export_rules', { ruleIds, format });
  },
};

export interface RuleFilters {
  categories?: SecurityCategory[];
  severities?: SecuritySeverity[];
  types?: RuleType[];
  isEnabled?: boolean;
  search?: string;
}

// ============================================================================
// Security Playbook Service
// ============================================================================

export const SecurityPlaybookService = {
  /**
   * Create a playbook
   */
  createPlaybook: async (
    playbook: Omit<SecurityPlaybook, 'id' | 'createdAt' | 'executionCount' | 'successRate' | 'averageDuration'>
  ): Promise<SecurityPlaybook> => {
    TelemetryService.trackEvent('security_playbook_created');

    return invoke<SecurityPlaybook>('security_create_playbook', { playbook });
  },

  /**
   * Get all playbooks
   */
  getPlaybooks: async (): Promise<SecurityPlaybook[]> => {
    return invoke<SecurityPlaybook[]>('security_get_playbooks');
  },

  /**
   * Get playbook by ID
   */
  getPlaybook: async (playbookId: string): Promise<SecurityPlaybook | null> => {
    return invoke<SecurityPlaybook | null>('security_get_playbook', {
      playbookId,
    });
  },

  /**
   * Update playbook
   */
  updatePlaybook: async (
    playbookId: string,
    updates: Partial<SecurityPlaybook>
  ): Promise<SecurityPlaybook> => {
    return invoke<SecurityPlaybook>('security_update_playbook', {
      playbookId,
      updates,
    });
  },

  /**
   * Delete playbook
   */
  deletePlaybook: async (playbookId: string): Promise<void> => {
    return invoke('security_delete_playbook', { playbookId });
  },

  /**
   * Execute playbook
   */
  executePlaybook: async (
    playbookId: string,
    incidentId: string
  ): Promise<PlaybookExecution> => {
    const spanId = TelemetryService.startSpan('security.playbook.execute', {
      kind: SpanKind.CLIENT,
    });

    try {
      const execution = await invoke<PlaybookExecution>(
        'security_execute_playbook',
        { playbookId, incidentId }
      );
      TelemetryService.endSpan(spanId);
      return execution;
    } catch (error) {
      TelemetryService.endSpan(spanId, { code: 2, message: String(error) });
      throw error;
    }
  },

  /**
   * Get playbook execution status
   */
  getExecutionStatus: async (
    executionId: string
  ): Promise<PlaybookExecution | null> => {
    return invoke<PlaybookExecution | null>('security_get_execution_status', {
      executionId,
    });
  },

  /**
   * Cancel playbook execution
   */
  cancelExecution: async (executionId: string): Promise<void> => {
    return invoke('security_cancel_execution', { executionId });
  },

  /**
   * Approve pending step
   */
  approveStep: async (
    executionId: string,
    stepId: string,
    approved: boolean,
    comment?: string
  ): Promise<void> => {
    return invoke('security_approve_step', {
      executionId,
      stepId,
      approved,
      comment,
    });
  },

  /**
   * Clone playbook
   */
  clonePlaybook: async (
    playbookId: string,
    name: string
  ): Promise<SecurityPlaybook> => {
    return invoke<SecurityPlaybook>('security_clone_playbook', {
      playbookId,
      name,
    });
  },
};

// ============================================================================
// SIEM Integration Service
// ============================================================================

export const SIEMIntegrationService = {
  /**
   * Add SIEM integration
   */
  addIntegration: async (
    integration: Omit<SIEMIntegration, 'id' | 'lastSync' | 'syncStatus' | 'eventsSynced'>
  ): Promise<SIEMIntegration> => {
    TelemetryService.trackEvent('siem_integration_added');

    return invoke<SIEMIntegration>('security_add_siem_integration', {
      integration,
    });
  },

  /**
   * Get all integrations
   */
  getIntegrations: async (): Promise<SIEMIntegration[]> => {
    return invoke<SIEMIntegration[]>('security_get_siem_integrations');
  },

  /**
   * Get integration by ID
   */
  getIntegration: async (
    integrationId: string
  ): Promise<SIEMIntegration | null> => {
    return invoke<SIEMIntegration | null>('security_get_siem_integration', {
      integrationId,
    });
  },

  /**
   * Update integration
   */
  updateIntegration: async (
    integrationId: string,
    updates: Partial<SIEMIntegration>
  ): Promise<SIEMIntegration> => {
    return invoke<SIEMIntegration>('security_update_siem_integration', {
      integrationId,
      updates,
    });
  },

  /**
   * Delete integration
   */
  deleteIntegration: async (integrationId: string): Promise<void> => {
    return invoke('security_delete_siem_integration', { integrationId });
  },

  /**
   * Test connection
   */
  testConnection: async (
    integrationId: string
  ): Promise<{ success: boolean; message: string }> => {
    return invoke('security_test_siem_connection', { integrationId });
  },

  /**
   * Sync events
   */
  syncEvents: async (integrationId: string): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> => {
    return invoke('security_sync_siem_events', { integrationId });
  },

  /**
   * Enable/Disable integration
   */
  setEnabled: async (
    integrationId: string,
    enabled: boolean
  ): Promise<void> => {
    return invoke('security_set_siem_enabled', { integrationId, enabled });
  },
};

// ============================================================================
// Export
// ============================================================================

export const SecurityServices = {
  SIEM: SecuritySIEMService,
  Incident: SecurityIncidentService,
  Alert: SecurityAlertService,
  DetectionRule: DetectionRuleService,
  Playbook: SecurityPlaybookService,
  Integration: SIEMIntegrationService,
};

export default SecurityServices;
