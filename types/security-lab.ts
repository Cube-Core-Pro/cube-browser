export interface SecurityLabConfig {
  zap_enabled: boolean;
  zap_host: string;
  zap_port: number;
  zap_api_key: string;
  nuclei_enabled: boolean;
  nuclei_binary_path: string;
  max_scan_threads: number;
  scan_timeout: number;
  require_domain_verification: boolean;
  ethical_mode: boolean;
  allowed_targets: string[];
  openai_api_key: string | null;
}

export type ScanType = 'Quick' | 'Standard' | 'Full' | 'Custom';
export type ScanStatus = 'Pending' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';
export type Scanner = 'ZAP' | 'Nuclei' | 'Both';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export interface VulnerabilityScan {
  scanId: string;
  targetUrl: string;
  scanType: ScanType;
  scanner: Scanner;
  status: ScanStatus;
  progress: number;
  startedAt: string;
  completedAt: string | null;
  findingsCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  errorMessage: string | null;
  // Additional props for UI compatibility (snake_case aliases)
  scan_id?: string;
  target_url?: string;
  scan_type?: ScanType;
  started_at?: string;
  completed_at?: string | null;
  findings_count?: number;
  critical_count?: number;
  high_count?: number;
  medium_count?: number;
  low_count?: number;
  info_count?: number;
  error_message?: string | null;
}

export interface VulnerabilityFinding {
  finding_id: string;
  scan_id: string;
  name: string;
  description: string;
  severity: Severity;
  cvss_score: number | null;
  cwe_id: string | null;
  cve_id: string | null;
  affected_url: string;
  affected_parameter: string | null;
  evidence: string | null;
  solution: string | null;
  references: string[];
  scanner: Scanner;
  discovered_at: string;
  verified: boolean;
  false_positive: boolean;
  // Additional props for UI compatibility
  id?: string;
  title?: string;
  vulnerability_type?: string;
  proof_of_concept?: string;
  remediation?: string;
  request?: string;
  response?: string;
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

export type ExploitStatus = 'Active' | 'Success' | 'Failed' | 'Blocked';

export interface ExploitCommand {
  command_id: string;
  command: string;
  payload: string;
  response: string | null;
  success: boolean;
  timestamp: string;
  ai_suggested: boolean;
}

export interface ExploitSession {
  session_id: string;
  finding_id: string;
  target_url: string;
  exploit_type: ExploitType;
  status: ExploitStatus;
  commands: ExploitCommand[];
  ai_assistance_enabled: boolean;
  created_at: string;
  last_activity: string;
  // Additional props for UI compatibility
  id?: string;
}

export type VerificationMethod = 'DNSTxt' | 'HttpFile' | 'MetaTag';

export interface DomainVerification {
  domain: string;
  verification_method: VerificationMethod;
  verification_token: string;
  verified: boolean;
  verified_at: string | null;
  expires_at: string;
}
