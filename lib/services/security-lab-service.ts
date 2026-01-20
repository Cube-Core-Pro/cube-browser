/**
 * Security Lab Service - Exploit Testing & Security Analysis Integration Layer
 * CUBE Nexum v7 - Complete Security Lab Operations Service
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Types
// ============================================================================

export interface ExploitSession {
  session_id: string;
  target_url: string;
  exploit_type: ExploitType;
  status: SessionStatus;
  commands: ExploitCommand[];
  ai_assistance_enabled: boolean;
  last_activity: string;
  created_at: string;
}

export type ExploitType = 
  | 'SQLInjection' 
  | 'XSS' 
  | 'CSRF' 
  | 'RCE' 
  | 'LFI' 
  | 'SSRF' 
  | 'CommandInjection' 
  | 'PathTraversal' 
  | 'Custom';

export type SessionStatus = 'Active' | 'Success' | 'Failed' | 'Blocked' | 'Closed';

export interface ExploitCommand {
  command_id: string;
  command: string;
  payload?: string;
  response?: string;
  success: boolean;
  ai_suggested: boolean;
  timestamp: string;
}

export interface CreateSessionRequest {
  targetUrl: string;
  exploitType: ExploitType;
  enableAI?: boolean;
}

export interface ExecuteCommandRequest {
  sessionId: string;
  command: string;
  payload?: string;
}

export interface VulnerabilityFinding {
  id: string;
  type: ExploitType;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  url: string;
  evidence: string;
  remediation: string;
  cvss_score?: number;
  cwe_id?: string;
}

export interface SecurityScanResult {
  scan_id: string;
  target_url: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  findings: VulnerabilityFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

// ============================================================================
// Legacy Compatibility Types (from securityLabService.ts)
// ============================================================================

export interface SecurityLabConfig {
  aiEnabled: boolean;
  autoVerify: boolean;
  ethicalMode: boolean;
  maxConcurrentScans: number;
  defaultScanDepth: 'quick' | 'standard' | 'deep';
  verifiedDomains: string[];
}

export interface DomainVerification {
  domain: string;
  verified: boolean;
  verificationMethod?: 'dns' | 'file' | 'meta';
  verificationToken?: string;
  verifiedAt?: number;
  expiresAt?: number;
}

export interface SecurityScan {
  id: string;
  targetUrl: string;
  scanType: 'vulnerability' | 'penetration' | 'compliance';
  depth: 'quick' | 'standard' | 'deep';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt?: number;
  completedAt?: number;
  findingsCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
}

export interface SecurityFinding {
  id: string;
  scanId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  url: string;
  method?: string;
  parameter?: string;
  evidence: string;
  remediation: string;
  cwe?: string;
  cvss?: number;
  verified: boolean;
  falsePositive: boolean;
  discoveredAt: number;
}

export interface AISecuritySuggestion {
  findingId: string;
  suggestion: string;
  exploitStrategy: string;
  commands: string[];
  risk: 'low' | 'medium' | 'high';
  confidence: number;
}

// ============================================================================
// Exploit Session Service
// ============================================================================

export const ExploitSessionService = {
  /**
   * Create a new exploit testing session
   */
  createSession: async (request: CreateSessionRequest): Promise<ExploitSession> => {
    return invoke<ExploitSession>('security_lab_create_session', {
      targetUrl: request.targetUrl,
      exploitType: request.exploitType,
      enableAi: request.enableAI ?? true,
    });
  },

  /**
   * Get an existing session by ID
   */
  getSession: async (sessionId: string): Promise<ExploitSession> => {
    return invoke<ExploitSession>('security_lab_get_session', { sessionId });
  },

  /**
   * List all active sessions
   */
  listSessions: async (): Promise<ExploitSession[]> => {
    return invoke<ExploitSession[]>('security_lab_list_sessions');
  },

  /**
   * Close an exploit session
   */
  closeSession: async (sessionId: string): Promise<void> => {
    return invoke('security_lab_close_exploit_session', { sessionId });
  },
};

// ============================================================================
// Exploit Command Service
// ============================================================================

export const ExploitCommandService = {
  /**
   * Execute a command in an exploit session
   */
  executeCommand: async (request: ExecuteCommandRequest): Promise<ExploitCommand> => {
    return invoke<ExploitCommand>('security_lab_execute_exploit_command', {
      sessionId: request.sessionId,
      command: request.command,
      payload: request.payload,
    });
  },

  /**
   * Get AI-powered suggestions for next exploit steps
   */
  getAISuggestions: async (sessionId: string): Promise<string[]> => {
    return invoke<string[]>('security_lab_get_ai_suggestions', { sessionId });
  },

  /**
   * Get command history for a session
   */
  getCommandHistory: async (sessionId: string): Promise<ExploitCommand[]> => {
    return invoke<ExploitCommand[]>('security_lab_get_command_history', { sessionId });
  },
};

// ============================================================================
// Vulnerability Scanning Service
// ============================================================================

export const VulnerabilityScanService = {
  /**
   * Start a vulnerability scan
   */
  startScan: async (targetUrl: string, scanTypes?: ExploitType[]): Promise<SecurityScanResult> => {
    return invoke<SecurityScanResult>('security_lab_start_scan', { targetUrl, scanTypes });
  },

  /**
   * Get scan status and results
   */
  getScanResult: async (scanId: string): Promise<SecurityScanResult> => {
    return invoke<SecurityScanResult>('security_lab_get_scan_result', { scanId });
  },

  /**
   * Cancel an ongoing scan
   */
  cancelScan: async (scanId: string): Promise<void> => {
    return invoke('security_lab_cancel_scan', { scanId });
  },

  /**
   * List all scans
   */
  listScans: async (): Promise<SecurityScanResult[]> => {
    return invoke<SecurityScanResult[]>('security_lab_list_scans');
  },

  /**
   * Export scan report
   */
  exportReport: async (scanId: string, format: 'pdf' | 'html' | 'json'): Promise<string> => {
    return invoke<string>('security_lab_export_report', { scanId, format });
  },
};

// ============================================================================
// Payload Generator Service
// ============================================================================

export const PayloadGeneratorService = {
  /**
   * Generate common payloads for a given exploit type
   */
  generatePayloads: async (exploitType: ExploitType): Promise<string[]> => {
    return invoke<string[]>('security_lab_generate_payloads', { exploitType });
  },

  /**
   * Get AI-enhanced payload suggestions
   */
  getAIPayloads: async (exploitType: ExploitType, context?: string): Promise<string[]> => {
    return invoke<string[]>('security_lab_ai_payloads', { exploitType, context });
  },

  /**
   * Encode a payload
   */
  encodePayload: async (
    payload: string, 
    encoding: 'base64' | 'url' | 'html' | 'unicode'
  ): Promise<string> => {
    return invoke<string>('security_lab_encode_payload', { payload, encoding });
  },
};

// ============================================================================
// Main Security Lab Service Export
// ============================================================================

export const SecurityLabService = {
  Session: ExploitSessionService,
  Command: ExploitCommandService,
  Scan: VulnerabilityScanService,
  Payload: PayloadGeneratorService,
};

// ============================================================================
// Legacy securityLabService Compatibility
// ============================================================================

export const securityLabService = {
  // Config
  getConfig: async (): Promise<SecurityLabConfig> => {
    return invoke<SecurityLabConfig>('security_lab_get_config');
  },
  updateConfig: async (config: Partial<SecurityLabConfig>): Promise<SecurityLabConfig> => {
    return invoke<SecurityLabConfig>('security_lab_update_config', { config });
  },

  // Domain Verification
  verifyDomain: async (domain: string, method: 'dns' | 'file' | 'meta'): Promise<DomainVerification> => {
    return invoke<DomainVerification>('security_lab_verify_domain', { domain, method });
  },
  checkVerification: async (domain: string): Promise<DomainVerification> => {
    return invoke<DomainVerification>('security_lab_check_verification', { domain });
  },

  // Scans
  startScan: async (targetUrl: string, scanType: string, depth?: string): Promise<string> => {
    return invoke<string>('security_lab_start_scan', { targetUrl, scanType, depth });
  },
  getScan: async (scanId: string): Promise<SecurityScan> => {
    return invoke<SecurityScan>('security_lab_get_scan', { scanId });
  },
  listScans: async (): Promise<SecurityScan[]> => {
    return invoke<SecurityScan[]>('security_lab_list_scans');
  },
  cancelScan: async (scanId: string): Promise<void> => {
    return invoke('security_lab_cancel_scan', { scanId });
  },

  // Findings
  getFindings: async (scanId: string, severity?: string): Promise<SecurityFinding[]> => {
    return invoke<SecurityFinding[]>('security_lab_get_findings', { scanId, severity });
  },
  getFinding: async (findingId: string): Promise<SecurityFinding> => {
    return invoke<SecurityFinding>('security_lab_get_finding', { findingId });
  },
  markFalsePositive: async (findingId: string, reason: string): Promise<void> => {
    return invoke('security_lab_mark_false_positive', { findingId, reason });
  },
  verifyFinding: async (findingId: string, verified: boolean): Promise<void> => {
    return invoke('security_lab_verify_finding', { findingId, verified });
  },

  // Exploits
  startExploit: async (findingId: string): Promise<string> => {
    return invoke<string>('security_lab_start_exploit', { findingId });
  },
  executeExploitCommand: async (sessionId: string, command: string): Promise<string> => {
    return invoke<string>('security_lab_execute_exploit_command', { sessionId, command });
  },
  getAISuggestions: async (findingId: string): Promise<AISecuritySuggestion[]> => {
    return invoke<AISecuritySuggestion[]>('security_lab_get_ai_suggestions', { findingId });
  },
  getExploitSession: async (sessionId: string): Promise<ExploitSession> => {
    return ExploitSessionService.getSession(sessionId);
  },
  listExploitSessions: async (): Promise<ExploitSession[]> => {
    return ExploitSessionService.listSessions();
  },
  closeExploit: async (sessionId: string): Promise<void> => {
    return ExploitSessionService.closeSession(sessionId);
  },
};

export default SecurityLabService;
