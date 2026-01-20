/**
 * CUBE Elite v6 - Advanced Security Service
 * 
 * Enterprise-grade security testing and attack surface management.
 * Competes with: Burp Suite Pro, Nuclei, Metasploit, Qualys, Censys
 * 
 * Now integrated with Tauri backend for:
 * - Security lab configuration
 * - Domain verification
 * - Vulnerability scanning
 * - Findings management
 * - Exploit sessions (manual testing)
 * - AI-powered suggestions
 * 
 * Features:
 * - Template-based vulnerability detection (Nuclei-style)
 * - AI-powered vulnerability analysis
 * - Out-of-Band security testing (OAST)
 * - Attack surface management
 * - Predictive risk scoring
 * - Auto-exploitation suggestions
 * - Real-time team collaboration
 * - CI/CD pipeline integration
 * - Compliance framework mapping
 * 
 * Integration: Uses SecurityLabService for Tauri backend communication
 * 
 * @module security-advanced-service
 * @version 3.0.0 - Backend Integration
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';
import { 
  SecurityLabService as _SecurityLabService, 
  ExploitSessionService, 
  VulnerabilityScanService,
  PayloadGeneratorService,
  type ExploitType,
  type ExploitSession,
  type SecurityScanResult,
  type VulnerabilityFinding as _VulnerabilityFinding
} from './security-lab-service';

const log = logger.scope('SecurityAdvanced');

// Re-export for potential future use
export type { SecurityScanResult, _VulnerabilityFinding };
export { _SecurityLabService };

// ============================================================================
// Backend Integration Types
// ============================================================================

type BackendScanType = 'quick' | 'full' | 'passive' | 'active' | 'compliance';
type BackendScanner = 'nuclei' | 'zap' | 'burp' | 'custom';
type BackendVerificationMethod = 'dns' | 'http' | 'meta';
type BackendExploitType = 'manual' | 'automated' | 'ai_assisted';

interface BackendSecurityLabConfig {
  max_concurrent_scans: number;
  max_scan_duration_seconds: number;
  verified_domains: string[];
  api_keys: Record<string, string>;
}

interface BackendDomainVerification {
  domain: string;
  verified: boolean;
  method: BackendVerificationMethod;
  token: string;
  expires_at: number;
}

interface BackendVulnerabilityScan {
  id: string;
  target_url: string;
  scan_type: BackendScanType;
  scanner: BackendScanner;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  findings_count: number;
  started_at: number;
  completed_at?: number;
  error?: string;
}

interface BackendVulnerabilityFinding {
  id: string;
  scan_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: string;
  url: string;
  parameter?: string;
  payload?: string;
  evidence?: string;
  remediation: string;
  cve_ids: string[];
  cvss_score?: number;
  is_verified: boolean;
  is_false_positive: boolean;
  created_at: number;
}

interface BackendExploitSession {
  id: string;
  finding_id: string;
  exploit_type: BackendExploitType;
  ai_assistance: boolean;
  commands: BackendExploitCommand[];
  started_at: number;
  ended_at?: number;
}

interface BackendExploitCommand {
  id: string;
  command: string;
  payload: string;
  output: string;
  success: boolean;
  executed_at: number;
}

const BackendSecurityLabAPI = {
  async getConfig(): Promise<BackendSecurityLabConfig> {
    try {
      return await invoke<BackendSecurityLabConfig>('security_lab_get_config');
    } catch (error) {
      log.warn('Backend security_lab_get_config failed:', { error });
      return { max_concurrent_scans: 3, max_scan_duration_seconds: 3600, verified_domains: [], api_keys: {} };
    }
  },

  async updateConfig(config: BackendSecurityLabConfig): Promise<void> {
    try {
      await invoke<void>('security_lab_update_config', { config });
    } catch (error) {
      log.warn('Backend security_lab_update_config failed:', { error });
      throw error;
    }
  },

  async verifyDomain(domain: string, method: BackendVerificationMethod): Promise<BackendDomainVerification> {
    try {
      return await invoke<BackendDomainVerification>('security_lab_verify_domain', { domain, method });
    } catch (error) {
      log.warn('Backend security_lab_verify_domain failed:', { error });
      throw error;
    }
  },

  async checkVerification(domain: string, token: string, method: BackendVerificationMethod): Promise<boolean> {
    try {
      return await invoke<boolean>('security_lab_check_verification', { domain, token, method });
    } catch (error) {
      log.warn('Backend security_lab_check_verification failed:', { error });
      return false;
    }
  },

  async startScan(targetUrl: string, scanType: BackendScanType, scanner: BackendScanner): Promise<BackendVulnerabilityScan> {
    try {
      return await invoke<BackendVulnerabilityScan>('security_lab_start_scan', { targetUrl, scanType, scanner });
    } catch (error) {
      log.warn('Backend security_lab_start_scan failed:', { error });
      throw error;
    }
  },

  async getScan(scanId: string): Promise<BackendVulnerabilityScan | null> {
    try {
      return await invoke<BackendVulnerabilityScan>('security_lab_get_scan', { scanId });
    } catch (error) {
      log.warn('Backend security_lab_get_scan failed:', { error });
      return null;
    }
  },

  async listScans(): Promise<BackendVulnerabilityScan[]> {
    try {
      return await invoke<BackendVulnerabilityScan[]>('security_lab_list_scans');
    } catch (error) {
      log.warn('Backend security_lab_list_scans failed:', { error });
      return [];
    }
  },

  async cancelScan(scanId: string): Promise<void> {
    try {
      await invoke<void>('security_lab_cancel_scan', { scanId });
    } catch (error) {
      log.warn('Backend security_lab_cancel_scan failed:', { error });
    }
  },

  async getFindings(scanId: string): Promise<BackendVulnerabilityFinding[]> {
    try {
      return await invoke<BackendVulnerabilityFinding[]>('security_lab_get_findings', { scanId });
    } catch (error) {
      log.warn('Backend security_lab_get_findings failed:', { error });
      return [];
    }
  },

  async getFinding(findingId: string): Promise<BackendVulnerabilityFinding | null> {
    try {
      return await invoke<BackendVulnerabilityFinding>('security_lab_get_finding', { findingId });
    } catch (error) {
      log.warn('Backend security_lab_get_finding failed:', { error });
      return null;
    }
  },

  async markFalsePositive(findingId: string): Promise<void> {
    try {
      await invoke<void>('security_lab_mark_false_positive', { findingId });
    } catch (error) {
      log.warn('Backend security_lab_mark_false_positive failed:', { error });
    }
  },

  async verifyFinding(findingId: string): Promise<void> {
    try {
      await invoke<void>('security_lab_verify_finding', { findingId });
    } catch (error) {
      log.warn('Backend security_lab_verify_finding failed:', { error });
    }
  },

  async startExploit(findingId: string, exploitType: BackendExploitType, aiAssistance: boolean): Promise<BackendExploitSession> {
    try {
      return await invoke<BackendExploitSession>('security_lab_start_exploit', { findingId, exploitType, aiAssistance });
    } catch (error) {
      log.warn('Backend security_lab_start_exploit failed:', { error });
      throw error;
    }
  },

  async executeExploitCommand(sessionId: string, command: string, payload: string): Promise<BackendExploitCommand> {
    try {
      return await invoke<BackendExploitCommand>('security_lab_execute_exploit_command', { sessionId, command, payload });
    } catch (error) {
      log.warn('Backend security_lab_execute_exploit_command failed:', { error });
      throw error;
    }
  },

  async getAISuggestions(sessionId: string): Promise<string[]> {
    try {
      return await invoke<string[]>('security_lab_get_ai_suggestions', { sessionId });
    } catch (error) {
      log.warn('Backend security_lab_get_ai_suggestions failed:', { error });
      return [];
    }
  },

  async getExploitSession(sessionId: string): Promise<BackendExploitSession | null> {
    try {
      return await invoke<BackendExploitSession>('security_lab_get_exploit_session', { sessionId });
    } catch (error) {
      log.warn('Backend security_lab_get_exploit_session failed:', { error });
      return null;
    }
  },

  async listExploitSessions(): Promise<BackendExploitSession[]> {
    try {
      return await invoke<BackendExploitSession[]>('security_lab_list_exploit_sessions');
    } catch (error) {
      log.warn('Backend security_lab_list_exploit_sessions failed:', { error });
      return [];
    }
  },

  async closeExploitSession(sessionId: string): Promise<void> {
    try {
      await invoke<void>('security_lab_close_exploit', { sessionId });
    } catch (error) {
      log.warn('Backend security_lab_close_exploit failed:', { error });
    }
  },
};

// Export backend API
export { BackendSecurityLabAPI };
export type {
  BackendSecurityLabConfig,
  BackendDomainVerification,
  BackendVulnerabilityScan,
  BackendVulnerabilityFinding,
  BackendExploitSession,
  BackendExploitCommand,
};

/**
 * Backend integration flag - set to true when Tauri backend is available
 */
const useBackend = typeof window !== 'undefined' && '__TAURI__' in window;

// ============================================================================
// Types
// ============================================================================

/**
 * Vulnerability template (Nuclei-style YAML)
 */
export interface VulnerabilityTemplate {
  id: string;
  name: string;
  author: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  tags: string[];
  classification: {
    cveId?: string[];
    cweId?: string[];
    cvss?: {
      score: number;
      vector: string;
    };
    cpe?: string;
  };
  matchers: TemplateMatcher[];
  requests: TemplateRequest[];
  extractors?: TemplateExtractor[];
  metadata: {
    verified: boolean;
    maxRequest?: number;
    shodan?: string;
    fofa?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Template request definition
 */
export interface TemplateRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  path: string | string[];
  headers?: Record<string, string>;
  body?: string;
  raw?: string;
  payloads?: Record<string, string[]>;
  attackType?: 'batteringram' | 'pitchfork' | 'clusterbomb';
  stopAtFirstMatch?: boolean;
  followRedirects?: boolean;
}

/**
 * Template matcher
 */
export interface TemplateMatcher {
  type: 'word' | 'regex' | 'status' | 'binary' | 'dsl' | 'xpath' | 'size';
  part?: 'body' | 'header' | 'all' | 'raw' | 'interactsh_protocol';
  words?: string[];
  regex?: string[];
  status?: number[];
  condition?: 'and' | 'or';
  negative?: boolean;
  dsl?: string[];
}

/**
 * Template extractor
 */
export interface TemplateExtractor {
  type: 'regex' | 'kval' | 'xpath' | 'json' | 'dsl';
  name?: string;
  part?: string;
  group?: number;
  regex?: string[];
  kval?: string[];
  json?: string[];
  internal?: boolean;
}

/**
 * Out-of-Band (OAST) callback
 */
export interface OASTCallback {
  id: string;
  protocol: 'dns' | 'http' | 'smtp' | 'ftp' | 'ldap';
  timestamp: Date;
  sourceIp: string;
  sourcePort: number;
  rawRequest: string;
  correlationId: string;
  vulnerabilityType?: string;
}

/**
 * OAST session
 */
export interface OASTSession {
  id: string;
  domain: string;
  isActive: boolean;
  callbacks: OASTCallback[];
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Attack surface asset
 */
export interface AttackSurfaceAsset {
  id: string;
  domain: string;
  ipAddress?: string;
  ports: ServicePort[];
  technologies: Technology[];
  certificates?: Certificate[];
  firstSeen: Date;
  lastSeen: Date;
  riskScore: number;
  isNew: boolean;
  isShadowIT: boolean;
  changes: AssetChange[];
}

/**
 * Service port information
 */
export interface ServicePort {
  port: number;
  protocol: 'tcp' | 'udp';
  service: string;
  version?: string;
  banner?: string;
  vulnerabilities: string[];
}

/**
 * Technology detection
 */
export interface Technology {
  name: string;
  version?: string;
  category: 'framework' | 'server' | 'cms' | 'library' | 'cdn' | 'analytics' | 'other';
  confidence: number;
}

/**
 * SSL/TLS certificate
 */
export interface Certificate {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  fingerprint: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  grade?: string;
}

/**
 * Asset change detection
 */
export interface AssetChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  detectedAt: Date;
  riskImpact: 'increase' | 'decrease' | 'neutral';
}

/**
 * Predictive risk score
 */
export interface RiskScore {
  overall: number;
  factors: RiskFactor[];
  trend: 'increasing' | 'decreasing' | 'stable';
  predictedBreachProbability: number;
  recommendations: string[];
}

/**
 * Risk factor
 */
export interface RiskFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

/**
 * Auto-exploitation suggestion
 */
export interface ExploitSuggestion {
  findingId: string;
  exploitName: string;
  source: 'metasploit' | 'exploitdb' | 'nuclei' | 'custom';
  confidence: number;
  payload?: string;
  prerequisites: string[];
  steps: ExploitStep[];
  riskLevel: 'safe' | 'moderate' | 'dangerous';
  successProbability: number;
}

/**
 * Exploit step
 */
export interface ExploitStep {
  order: number;
  action: string;
  command?: string;
  expectedResult?: string;
  screenshot?: boolean;
}

/**
 * Proof of concept
 */
export interface ProofOfConcept {
  findingId: string;
  type: 'curl' | 'python' | 'javascript' | 'burp' | 'nuclei';
  code: string;
  description: string;
  expectedResult: string;
  generatedAt: Date;
}

/**
 * Compliance framework
 */
export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  controls: ComplianceControl[];
}

/**
 * Compliance control
 */
export interface ComplianceControl {
  id: string;
  title: string;
  description: string;
  category: string;
  vulnerabilityTypes: string[];
  status: 'pass' | 'fail' | 'partial' | 'not_applicable';
  findings: string[];
}

/**
 * Compliance report
 */
export interface ComplianceReport {
  frameworkId: string;
  frameworkName: string;
  scanId: string;
  generatedAt: Date;
  passRate: number;
  controls: ComplianceControl[];
  executiveSummary: string;
}

/**
 * Team collaboration session
 */
export interface CollaborationSession {
  id: string;
  projectId: string;
  participants: Participant[];
  sharedFindings: string[];
  sharedAssets: string[];
  chat: ChatMessage[];
  isActive: boolean;
  createdAt: Date;
}

/**
 * Participant
 */
export interface Participant {
  userId: string;
  name: string;
  role: 'owner' | 'operator' | 'viewer';
  joinedAt: Date;
  lastActivity: Date;
}

/**
 * Chat message
 */
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  attachments?: {
    type: 'finding' | 'asset' | 'screenshot';
    id: string;
  }[];
}

/**
 * CI/CD webhook
 */
export interface CICDWebhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: ('scan_started' | 'scan_completed' | 'critical_found' | 'threshold_exceeded')[];
  thresholds?: {
    critical: number;
    high: number;
  };
  enabled: boolean;
}

/**
 * AI vulnerability analysis
 */
export interface AIVulnerabilityAnalysis {
  findingId: string;
  summary: string;
  technicalExplanation: string;
  businessImpact: string;
  exploitScenarios: string[];
  remediationSteps: {
    step: number;
    action: string;
    code?: string;
  }[];
  references: string[];
  confidence: number;
}

// ============================================================================
// Constants
// ============================================================================

const DB_NAME = 'cube_security_advanced';
const DB_VERSION = 1;

const OWASP_TOP_10_2021 = [
  { id: 'A01', name: 'Broken Access Control', cweIds: ['CWE-200', 'CWE-201', 'CWE-352'] },
  { id: 'A02', name: 'Cryptographic Failures', cweIds: ['CWE-259', 'CWE-327', 'CWE-331'] },
  { id: 'A03', name: 'Injection', cweIds: ['CWE-79', 'CWE-89', 'CWE-73'] },
  { id: 'A04', name: 'Insecure Design', cweIds: ['CWE-209', 'CWE-256', 'CWE-501'] },
  { id: 'A05', name: 'Security Misconfiguration', cweIds: ['CWE-16', 'CWE-611'] },
  { id: 'A06', name: 'Vulnerable Components', cweIds: ['CWE-1104'] },
  { id: 'A07', name: 'Authentication Failures', cweIds: ['CWE-287', 'CWE-384'] },
  { id: 'A08', name: 'Software/Data Integrity', cweIds: ['CWE-829', 'CWE-494', 'CWE-502'] },
  { id: 'A09', name: 'Security Logging Failures', cweIds: ['CWE-778'] },
  { id: 'A10', name: 'SSRF', cweIds: ['CWE-918'] },
];

const DEFAULT_TEMPLATES: VulnerabilityTemplate[] = [
  {
    id: 'sqli-basic',
    name: 'SQL Injection - Basic',
    author: 'cube-security',
    severity: 'critical',
    description: 'Detects basic SQL injection vulnerabilities',
    tags: ['sqli', 'injection', 'owasp-top-10'],
    classification: {
      cweId: ['CWE-89'],
      cvss: { score: 9.8, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' },
    },
    matchers: [
      {
        type: 'regex',
        regex: ['SQL syntax.*MySQL', 'Warning.*mysql_', 'valid MySQL result', 'MySqlClient\\.'],
        condition: 'or',
      },
    ],
    requests: [
      {
        method: 'GET',
        path: '{{BaseURL}}{{path}}?{{param}}=1\'',
      },
    ],
    metadata: { verified: true },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'xss-reflected',
    name: 'XSS - Reflected',
    author: 'cube-security',
    severity: 'high',
    description: 'Detects reflected XSS vulnerabilities',
    tags: ['xss', 'injection', 'owasp-top-10'],
    classification: {
      cweId: ['CWE-79'],
      cvss: { score: 6.1, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N' },
    },
    matchers: [
      {
        type: 'word',
        words: ['<script>alert(', '<img src=x onerror='],
        part: 'body',
      },
    ],
    requests: [
      {
        method: 'GET',
        path: '{{BaseURL}}{{path}}?{{param}}=<script>alert(1)</script>',
      },
    ],
    metadata: { verified: true },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const COMPLIANCE_FRAMEWORKS: Record<string, { id: string; name: string; version: string }> = {
  'owasp-top-10': { id: 'owasp-top-10', name: 'OWASP Top 10', version: '2021' },
  'pci-dss': { id: 'pci-dss', name: 'PCI DSS', version: '4.0' },
  'hipaa': { id: 'hipaa', name: 'HIPAA', version: '2023' },
  'soc2': { id: 'soc2', name: 'SOC 2 Type II', version: '2022' },
  'cis': { id: 'cis', name: 'CIS Controls', version: '8' },
};

// ============================================================================
// Storage Service
// ============================================================================

class SecurityStorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Templates store
        if (!db.objectStoreNames.contains('templates')) {
          const templatesStore = db.createObjectStore('templates', { keyPath: 'id' });
          templatesStore.createIndex('severity', 'severity', { unique: false });
          templatesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        // Assets store
        if (!db.objectStoreNames.contains('assets')) {
          const assetsStore = db.createObjectStore('assets', { keyPath: 'id' });
          assetsStore.createIndex('domain', 'domain', { unique: false });
          assetsStore.createIndex('riskScore', 'riskScore', { unique: false });
        }

        // OAST sessions store
        if (!db.objectStoreNames.contains('oast_sessions')) {
          db.createObjectStore('oast_sessions', { keyPath: 'id' });
        }

        // Collaboration store
        if (!db.objectStoreNames.contains('collaboration')) {
          db.createObjectStore('collaboration', { keyPath: 'id' });
        }

        // Webhooks store
        if (!db.objectStoreNames.contains('webhooks')) {
          db.createObjectStore('webhooks', { keyPath: 'id' });
        }
      };
    });
  }

  async save<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// ============================================================================
// Template Engine Service
// ============================================================================

class TemplateEngineService {
  private storage: SecurityStorageService;
  private templates: Map<string, VulnerabilityTemplate> = new Map();

  constructor(storage: SecurityStorageService) {
    this.storage = storage;
  }

  /**
   * Load templates
   */
  async loadTemplates(): Promise<void> {
    const stored = await this.storage.getAll<VulnerabilityTemplate>('templates');
    
    // Load defaults if empty
    if (stored.length === 0) {
      for (const template of DEFAULT_TEMPLATES) {
        await this.storage.save('templates', template);
        this.templates.set(template.id, template);
      }
    } else {
      stored.forEach(t => this.templates.set(t.id, t));
    }
  }

  /**
   * Import Nuclei template from YAML
   */
  async importNucleiTemplate(yaml: string): Promise<VulnerabilityTemplate> {
    // Parse YAML (simplified - would need yaml library)
    const lines = yaml.split('\n');
    const template: Partial<VulnerabilityTemplate> = {
      id: `nuclei_${Date.now()}`,
      tags: [],
      matchers: [],
      requests: [],
      classification: {},
      metadata: { verified: false },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // State tracking for YAML parsing (simplified, full implementation would use proper YAML parser)
    let currentSection: 'matchers' | 'requests' | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('id:')) {
        template.id = trimmed.replace('id:', '').trim();
      } else if (trimmed.startsWith('name:')) {
        template.name = trimmed.replace('name:', '').trim();
      } else if (trimmed.startsWith('author:')) {
        template.author = trimmed.replace('author:', '').trim();
      } else if (trimmed.startsWith('severity:')) {
        template.severity = trimmed.replace('severity:', '').trim() as VulnerabilityTemplate['severity'];
      } else if (trimmed.startsWith('description:')) {
        template.description = trimmed.replace('description:', '').trim();
      } else if (trimmed === 'matchers:') {
        currentSection = 'matchers';
      } else if (trimmed === 'requests:' || trimmed === 'http:') {
        currentSection = 'requests';
      }
      
      // Note: Full matcher/request parsing would be added here using currentSection
      void currentSection; // Acknowledge the variable for future use
    }

    const fullTemplate = template as VulnerabilityTemplate;
    await this.storage.save('templates', fullTemplate);
    this.templates.set(fullTemplate.id, fullTemplate);
    
    return fullTemplate;
  }

  /**
   * Execute template against target
   */
  async executeTemplate(
    template: VulnerabilityTemplate,
    targetUrl: string,
    params?: Record<string, string>
  ): Promise<{
    matched: boolean;
    evidence?: string;
    request?: string;
    response?: string;
  }> {
    for (const request of template.requests) {
      // Build URL
      let path = Array.isArray(request.path) ? request.path[0] : request.path;
      path = path.replace('{{BaseURL}}', targetUrl);
      
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          path = path.replace(`{{${key}}}`, value);
        }
      }

      try {
        const response = await fetch(path, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });

        const body = await response.text();
        const headers = Object.fromEntries(response.headers.entries());

        // Check matchers
        for (const matcher of template.matchers) {
          const matched = this.checkMatcher(matcher, body, headers, response.status);
          
          if (matched !== matcher.negative) {
            return {
              matched: true,
              evidence: body.slice(0, 500),
              request: `${request.method} ${path}`,
              response: `HTTP ${response.status}\n${body.slice(0, 1000)}`,
            };
          }
        }
      } catch (error) {
        log.error('Template execution error', error);
      }
    }

    return { matched: false };
  }

  /**
   * Check matcher against response
   */
  private checkMatcher(
    matcher: TemplateMatcher,
    body: string,
    headers: Record<string, string>,
    status: number
  ): boolean {
    const content = matcher.part === 'header' 
      ? JSON.stringify(headers) 
      : matcher.part === 'all' 
        ? JSON.stringify(headers) + body 
        : body;

    switch (matcher.type) {
      case 'word':
        if (matcher.condition === 'and') {
          return (matcher.words || []).every(w => content.includes(w));
        }
        return (matcher.words || []).some(w => content.includes(w));

      case 'regex':
        for (const pattern of matcher.regex || []) {
          if (new RegExp(pattern, 'i').test(content)) return true;
        }
        return false;

      case 'status':
        return (matcher.status || []).includes(status);

      case 'size':
        return body.length > 0;

      default:
        return false;
    }
  }

  /**
   * Get all templates
   */
  getTemplates(): VulnerabilityTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by tag
   */
  getTemplatesByTag(tag: string): VulnerabilityTemplate[] {
    return this.getTemplates().filter(t => t.tags.includes(tag));
  }

  /**
   * Get templates by severity
   */
  getTemplatesBySeverity(severity: VulnerabilityTemplate['severity']): VulnerabilityTemplate[] {
    return this.getTemplates().filter(t => t.severity === severity);
  }
}

// ============================================================================
// OAST Service
// ============================================================================

class OASTService {
  private storage: SecurityStorageService;
  private activeSession: OASTSession | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor(storage: SecurityStorageService) {
    this.storage = storage;
  }

  /**
   * Start OAST session
   */
  async startSession(): Promise<OASTSession> {
    // Generate unique domain for callbacks
    const sessionId = `oast_${Date.now()}`;
    const domain = `${sessionId.slice(-8)}.oast.cube.local`;

    const session: OASTSession = {
      id: sessionId,
      domain,
      isActive: true,
      callbacks: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    await this.storage.save('oast_sessions', session);
    this.activeSession = session;

    // Start polling for callbacks (would connect to real OAST server)
    this.startPolling();

    return session;
  }

  /**
   * Stop OAST session
   */
  async stopSession(): Promise<void> {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.activeSession) {
      this.activeSession.isActive = false;
      await this.storage.save('oast_sessions', this.activeSession);
      this.activeSession = null;
    }
  }

  /**
   * Generate OAST payload
   */
  generatePayload(vulnerabilityType: string, correlationId: string): string {
    if (!this.activeSession) {
      throw new Error('No active OAST session');
    }

    const payload = `${correlationId}.${vulnerabilityType}.${this.activeSession.domain}`;
    
    switch (vulnerabilityType) {
      case 'ssrf':
        return `http://${payload}`;
      case 'xxe':
        return `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://${payload}">]>`;
      case 'sqli':
        return `'; LOAD_FILE('http://${payload}')-- `;
      case 'rce':
        return `$(curl http://${payload})`;
      case 'xss':
        return `<script>fetch('http://${payload}')</script>`;
      default:
        return payload;
    }
  }

  /**
   * Get callbacks for correlation ID
   */
  getCallbacks(correlationId?: string): OASTCallback[] {
    if (!this.activeSession) return [];
    
    if (correlationId) {
      return this.activeSession.callbacks.filter(c => c.correlationId === correlationId);
    }
    
    return this.activeSession.callbacks;
  }

  private startPolling(): void {
    // In real implementation, this would connect to OAST server
    // For now, simulate with mock data
    this.pollInterval = setInterval(() => {
      // Would poll server for new callbacks
    }, 5000);
  }
}

// ============================================================================
// Attack Surface Service
// ============================================================================

class AttackSurfaceService {
  private storage: SecurityStorageService;
  private assets: Map<string, AttackSurfaceAsset> = new Map();

  constructor(storage: SecurityStorageService) {
    this.storage = storage;
  }

  /**
   * Discover assets for domain
   */
  async discoverAssets(domain: string): Promise<AttackSurfaceAsset[]> {
    const discovered: AttackSurfaceAsset[] = [];

    // DNS enumeration
    const subdomains = await this.enumerateSubdomains(domain);
    
    for (const subdomain of subdomains) {
      const asset = await this.analyzeAsset(subdomain);
      if (asset) {
        discovered.push(asset);
        this.assets.set(asset.id, asset);
        await this.storage.save('assets', asset);
      }
    }

    return discovered;
  }

  /**
   * Enumerate subdomains
   */
  private async enumerateSubdomains(domain: string): Promise<string[]> {
    // Common subdomain prefixes
    const prefixes = [
      'www', 'mail', 'ftp', 'admin', 'api', 'dev', 'staging', 'test',
      'app', 'portal', 'secure', 'blog', 'shop', 'store', 'cdn',
      'm', 'mobile', 'webmail', 'vpn', 'remote', 'git', 'jenkins',
      'jira', 'confluence', 'wiki', 'docs', 'support', 'help'
    ];

    // In real implementation, would use DNS resolution
    // For now, return base domain and common prefixes
    return [domain, ...prefixes.map(p => `${p}.${domain}`)];
  }

  /**
   * Analyze single asset
   */
  private async analyzeAsset(domain: string): Promise<AttackSurfaceAsset | null> {
    try {
      // Check if domain resolves
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        mode: 'no-cors',
      }).catch(() => null);

      if (!response) return null;

      const asset: AttackSurfaceAsset = {
        id: `asset_${domain.replace(/\./g, '_')}`,
        domain,
        ports: [],
        technologies: [],
        firstSeen: new Date(),
        lastSeen: new Date(),
        riskScore: 0,
        isNew: true,
        isShadowIT: false,
        changes: [],
      };

      // Detect technologies
      asset.technologies = await this.detectTechnologies(domain);

      // Calculate risk score
      asset.riskScore = this.calculateRiskScore(asset);

      return asset;
    } catch {
      return null;
    }
  }

  /**
   * Detect technologies
   */
  private async detectTechnologies(domain: string): Promise<Technology[]> {
    const technologies: Technology[] = [];

    try {
      const response = await fetch(`https://${domain}`, {
        headers: { 'User-Agent': 'CUBE-Security-Scanner/1.0' },
      });

      const headers = response.headers;
      const body = await response.text();

      // Server detection
      const server = headers.get('server');
      if (server) {
        technologies.push({
          name: server.split('/')[0],
          version: server.split('/')[1],
          category: 'server',
          confidence: 1.0,
        });
      }

      // Framework detection from headers
      const poweredBy = headers.get('x-powered-by');
      if (poweredBy) {
        technologies.push({
          name: poweredBy.split('/')[0],
          version: poweredBy.split('/')[1],
          category: 'framework',
          confidence: 0.9,
        });
      }

      // CMS detection from meta
      if (body.includes('wp-content')) {
        technologies.push({
          name: 'WordPress',
          category: 'cms',
          confidence: 0.95,
        });
      }

      // Framework detection from patterns
      if (body.includes('react') || body.includes('__NEXT_DATA__')) {
        technologies.push({
          name: 'React',
          category: 'framework',
          confidence: 0.8,
        });
      }

    } catch {
      // Ignore errors
    }

    return technologies;
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(asset: AttackSurfaceAsset): number {
    let score = 0;

    // Exposed services add risk
    score += asset.ports.length * 5;

    // Outdated technologies
    for (const tech of asset.technologies) {
      if (tech.category === 'cms') score += 10;
      if (tech.category === 'server' && tech.version) {
        // Check if version is outdated (simplified)
        score += 5;
      }
    }

    // SSL issues
    if (asset.certificates?.some(c => c.isExpired)) {
      score += 20;
    }

    // Shadow IT
    if (asset.isShadowIT) {
      score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * Monitor for changes
   */
  async monitorChanges(assetId: string): Promise<AssetChange[]> {
    const current = this.assets.get(assetId);
    if (!current) return [];

    const freshAsset = await this.analyzeAsset(current.domain);
    if (!freshAsset) return [];

    const changes: AssetChange[] = [];

    // Check for port changes
    const oldPorts = new Set(current.ports.map(p => p.port));
    const newPorts = new Set(freshAsset.ports.map(p => p.port));

    for (const port of newPorts) {
      if (!oldPorts.has(port)) {
        changes.push({
          field: 'ports',
          oldValue: null,
          newValue: port,
          detectedAt: new Date(),
          riskImpact: 'increase',
        });
      }
    }

    // Check for technology changes
    const oldTechs = new Set(current.technologies.map(t => t.name));
    const newTechs = new Set(freshAsset.technologies.map(t => t.name));

    for (const tech of newTechs) {
      if (!oldTechs.has(tech)) {
        changes.push({
          field: 'technologies',
          oldValue: null,
          newValue: tech,
          detectedAt: new Date(),
          riskImpact: 'neutral',
        });
      }
    }

    // Update asset
    current.lastSeen = new Date();
    current.changes.push(...changes);
    current.isNew = false;
    await this.storage.save('assets', current);

    return changes;
  }

  /**
   * Get all assets
   */
  getAssets(): AttackSurfaceAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Get high-risk assets
   */
  getHighRiskAssets(threshold: number = 50): AttackSurfaceAsset[] {
    return this.getAssets().filter(a => a.riskScore >= threshold);
  }
}

// ============================================================================
// AI Security Service
// ============================================================================

class AISecurityService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyze vulnerability with AI
   */
  async analyzeVulnerability(finding: {
    title: string;
    description: string;
    severity: string;
    url: string;
    evidence: string;
  }): Promise<AIVulnerabilityAnalysis> {
    const prompt = `Analyze this security vulnerability:

Title: ${finding.title}
Severity: ${finding.severity}
URL: ${finding.url}
Description: ${finding.description}
Evidence: ${finding.evidence}

Provide:
1. Plain language summary for non-technical stakeholders
2. Technical explanation for developers
3. Business impact assessment
4. Possible exploit scenarios
5. Step-by-step remediation guide with code examples
6. References to relevant security resources`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5.2',
          messages: [
            { 
              role: 'system', 
              content: 'You are a security expert. Analyze vulnerabilities and provide actionable guidance. Return JSON.' 
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      throw new Error(`AI analysis failed: ${error}`);
    }
  }

  /**
   * Generate exploit suggestions
   */
  async suggestExploits(finding: {
    title: string;
    category: string;
    url: string;
    parameter?: string;
  }): Promise<ExploitSuggestion[]> {
    const prompt = `For this vulnerability:

Title: ${finding.title}
Category: ${finding.category}
URL: ${finding.url}
Parameter: ${finding.parameter || 'N/A'}

Suggest safe exploitation techniques to verify the vulnerability. Include:
1. Exploit name and source
2. Step-by-step instructions
3. Sample payloads (safe, non-destructive)
4. Expected results if vulnerable
5. Risk assessment`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5.2',
          messages: [
            { 
              role: 'system', 
              content: 'You are an ethical security researcher. Suggest safe exploitation techniques. Return JSON with array of suggestions.' 
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
        }),
      });

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return parsed.suggestions || [];
    } catch (error) {
      throw new Error(`Exploit suggestion failed: ${error}`);
    }
  }

  /**
   * Generate proof of concept
   */
  async generatePOC(finding: {
    title: string;
    category: string;
    url: string;
    method?: string;
    parameter?: string;
    payload?: string;
  }, format: ProofOfConcept['type']): Promise<ProofOfConcept> {
    const prompt = `Generate a proof of concept in ${format} format for:

Vulnerability: ${finding.title}
Category: ${finding.category}
URL: ${finding.url}
Method: ${finding.method || 'GET'}
Parameter: ${finding.parameter || 'N/A'}
Payload: ${finding.payload || 'N/A'}

The PoC should be safe, well-commented, and demonstrate the vulnerability clearly.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5.2',
          messages: [
            { 
              role: 'system', 
              content: `You are a security researcher. Generate safe proof of concept code. Return JSON with: code, description, expectedResult` 
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      
      return {
        findingId: '',
        type: format,
        code: parsed.code,
        description: parsed.description,
        expectedResult: parsed.expectedResult,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`POC generation failed: ${error}`);
    }
  }

  /**
   * Generate vulnerability template from description
   */
  async generateTemplate(description: string): Promise<VulnerabilityTemplate> {
    const prompt = `Generate a security scanning template (similar to Nuclei YAML format) for:

${description}

Include:
1. Template ID, name, author
2. Severity level
3. Description
4. HTTP requests with payloads
5. Matchers to detect vulnerability
6. Classification (CWE, CVSS)`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5.2',
          messages: [
            { 
              role: 'system', 
              content: 'You are a security template expert. Generate vulnerability detection templates. Return JSON.' 
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
        }),
      });

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      
      return {
        id: `ai_${Date.now()}`,
        name: parsed.name || description.slice(0, 50),
        author: 'cube-ai',
        severity: parsed.severity || 'medium',
        description: parsed.description || description,
        tags: parsed.tags || [],
        classification: parsed.classification || {},
        matchers: parsed.matchers || [],
        requests: parsed.requests || [],
        metadata: { verified: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Template generation failed: ${error}`);
    }
  }
}

// ============================================================================
// Compliance Service
// ============================================================================

class ComplianceService {
  /**
   * Generate compliance report
   */
  generateReport(
    frameworkId: string,
    scanId: string,
    findings: Array<{ category: string; severity: string; cweId?: string }>
  ): ComplianceReport {
    const framework = COMPLIANCE_FRAMEWORKS[frameworkId];
    if (!framework) throw new Error(`Unknown framework: ${frameworkId}`);

    const controls: ComplianceControl[] = [];

    if (frameworkId === 'owasp-top-10') {
      for (const category of OWASP_TOP_10_2021) {
        const relatedFindings = findings.filter(f => 
          category.cweIds.some(cwe => f.cweId?.includes(cwe)) ||
          f.category.toLowerCase().includes(category.name.toLowerCase().split(' ')[0])
        );

        controls.push({
          id: category.id,
          title: category.name,
          description: `OWASP Top 10 2021 - ${category.name}`,
          category: 'OWASP',
          vulnerabilityTypes: category.cweIds,
          status: relatedFindings.length === 0 ? 'pass' : 
                  relatedFindings.some(f => f.severity === 'critical') ? 'fail' : 'partial',
          findings: relatedFindings.map(f => f.category),
        });
      }
    }

    const passCount = controls.filter(c => c.status === 'pass').length;
    const passRate = (passCount / controls.length) * 100;

    return {
      frameworkId,
      frameworkName: framework.name,
      scanId,
      generatedAt: new Date(),
      passRate,
      controls,
      executiveSummary: this.generateExecutiveSummary(framework.name, passRate, controls),
    };
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(
    frameworkName: string,
    passRate: number,
    controls: ComplianceControl[]
  ): string {
    const failedCount = controls.filter(c => c.status === 'fail').length;
    const partialCount = controls.filter(c => c.status === 'partial').length;

    let summary = `${frameworkName} Compliance Report Summary\n\n`;
    summary += `Overall Compliance: ${passRate.toFixed(1)}%\n`;
    summary += `Controls Passed: ${controls.filter(c => c.status === 'pass').length}\n`;
    summary += `Controls Failed: ${failedCount}\n`;
    summary += `Controls Partial: ${partialCount}\n\n`;

    if (failedCount > 0) {
      summary += `Critical Issues:\n`;
      controls
        .filter(c => c.status === 'fail')
        .forEach(c => {
          summary += `- ${c.id}: ${c.title}\n`;
        });
    }

    return summary;
  }

  /**
   * Get available frameworks
   */
  getFrameworks(): Array<{ id: string; name: string; version: string }> {
    return Object.values(COMPLIANCE_FRAMEWORKS);
  }
}

// ============================================================================
// Main Service
// ============================================================================

export class AdvancedSecurityService {
  private storage: SecurityStorageService;
  private templateEngine: TemplateEngineService;
  private oastService: OASTService;
  private attackSurface: AttackSurfaceService;
  private aiService: AISecurityService | null = null;
  private complianceService: ComplianceService;

  /**
   * Backend integration available flag
   */
  public readonly backendAvailable: boolean;

  constructor(openaiKey?: string) {
    this.storage = new SecurityStorageService();
    this.templateEngine = new TemplateEngineService(this.storage);
    this.oastService = new OASTService(this.storage);
    this.attackSurface = new AttackSurfaceService(this.storage);
    this.complianceService = new ComplianceService();
    this.backendAvailable = useBackend;
    
    if (openaiKey) {
      this.aiService = new AISecurityService(openaiKey);
    }
  }

  async init(): Promise<void> {
    await this.storage.init();
    await this.templateEngine.loadTemplates();

    // Log backend status
    if (useBackend) {
      log.debug('[AdvancedSecurityService] Tauri backend integration enabled');
    } else {
      log.debug('[AdvancedSecurityService] Running in simulation mode (no Tauri backend)');
    }
  }

  // Template methods
  getTemplates = () => this.templateEngine.getTemplates();
  getTemplatesByTag = (tag: string) => this.templateEngine.getTemplatesByTag(tag);
  getTemplatesBySeverity = (severity: VulnerabilityTemplate['severity']) => 
    this.templateEngine.getTemplatesBySeverity(severity);
  importNucleiTemplate = (yaml: string) => this.templateEngine.importNucleiTemplate(yaml);
  executeTemplate = (template: VulnerabilityTemplate, targetUrl: string, params?: Record<string, string>) =>
    this.templateEngine.executeTemplate(template, targetUrl, params);

  // OAST methods
  startOASTSession = () => this.oastService.startSession();
  stopOASTSession = () => this.oastService.stopSession();
  generateOASTPayload = (vulnerabilityType: string, correlationId: string) =>
    this.oastService.generatePayload(vulnerabilityType, correlationId);
  getOASTCallbacks = (correlationId?: string) => this.oastService.getCallbacks(correlationId);

  // Attack surface methods
  discoverAssets = (domain: string) => this.attackSurface.discoverAssets(domain);
  getAssets = () => this.attackSurface.getAssets();
  getHighRiskAssets = (threshold?: number) => this.attackSurface.getHighRiskAssets(threshold);
  monitorAssetChanges = (assetId: string) => this.attackSurface.monitorChanges(assetId);

  // AI methods
  async analyzeVulnerability(finding: Parameters<AISecurityService['analyzeVulnerability']>[0]) {
    if (!this.aiService) throw new Error('AI not configured');
    return this.aiService.analyzeVulnerability(finding);
  }

  async suggestExploits(finding: Parameters<AISecurityService['suggestExploits']>[0]) {
    if (!this.aiService) throw new Error('AI not configured');
    return this.aiService.suggestExploits(finding);
  }

  async generatePOC(
    finding: Parameters<AISecurityService['generatePOC']>[0], 
    format: ProofOfConcept['type']
  ) {
    if (!this.aiService) throw new Error('AI not configured');
    return this.aiService.generatePOC(finding, format);
  }

  async generateTemplate(description: string) {
    if (!this.aiService) throw new Error('AI not configured');
    return this.aiService.generateTemplate(description);
  }

  // Compliance methods
  generateComplianceReport = (
    frameworkId: string, 
    scanId: string, 
    findings: Parameters<ComplianceService['generateReport']>[2]
  ) => this.complianceService.generateReport(frameworkId, scanId, findings);
  
  getComplianceFrameworks = () => this.complianceService.getFrameworks();

  // =========================================================================
  // Backend Integration Methods (require Tauri)
  // =========================================================================

  /**
   * Create an exploit session using backend
   * Requires Tauri backend
   */
  async createExploitSession(targetUrl: string, exploitType: ExploitType, enableAI: boolean = true): Promise<ExploitSession | null> {
    if (!useBackend) {
      log.warn('createExploitSession requires Tauri backend');
      return null;
    }
    try {
      return await ExploitSessionService.createSession({
        targetUrl,
        exploitType,
        enableAI,
      });
    } catch (error) {
      log.error('[AdvancedSecurityService] Failed to create exploit session:', error);
      throw error;
    }
  }

  /**
   * Get an existing exploit session
   * Requires Tauri backend
   */
  async getExploitSession(sessionId: string): Promise<ExploitSession | null> {
    if (!useBackend) {
      return null;
    }
    try {
      return await ExploitSessionService.getSession(sessionId);
    } catch (error) {
      log.error('[AdvancedSecurityService] Failed to get exploit session:', error);
      return null;
    }
  }

  /**
   * List all active exploit sessions
   * Requires Tauri backend
   */
  async listExploitSessions(): Promise<ExploitSession[]> {
    if (!useBackend) {
      return [];
    }
    try {
      return await ExploitSessionService.listSessions();
    } catch (error) {
      log.error('[AdvancedSecurityService] Failed to list exploit sessions:', error);
      return [];
    }
  }

  /**
   * Close an exploit session
   * Requires Tauri backend
   */
  async closeExploitSession(sessionId: string): Promise<void> {
    if (!useBackend) {
      log.warn('closeExploitSession requires Tauri backend');
      return;
    }
    try {
      await ExploitSessionService.closeSession(sessionId);
    } catch (error) {
      log.error('[AdvancedSecurityService] Failed to close exploit session:', error);
      throw error;
    }
  }

  /**
   * Start a vulnerability scan using backend
   * Requires Tauri backend
   */
  async startVulnerabilityScan(targetUrl: string, scanTypes?: ExploitType[]): Promise<SecurityScanResult | null> {
    if (!useBackend) {
      log.warn('startVulnerabilityScan requires Tauri backend');
      return null;
    }
    try {
      return await VulnerabilityScanService.startScan(targetUrl, scanTypes);
    } catch (error) {
      log.error('[AdvancedSecurityService] Failed to start vulnerability scan:', error);
      throw error;
    }
  }

  /**
   * Get scan results from backend
   * Requires Tauri backend
   */
  async getScanResult(scanId: string): Promise<SecurityScanResult | null> {
    if (!useBackend) {
      return null;
    }
    try {
      return await VulnerabilityScanService.getScanResult(scanId);
    } catch (error) {
      log.error('[AdvancedSecurityService] Failed to get scan result:', error);
      return null;
    }
  }

  /**
   * List all scans from backend
   * Requires Tauri backend
   */
  async listScans(): Promise<SecurityScanResult[]> {
    if (!useBackend) {
      return [];
    }
    try {
      return await VulnerabilityScanService.listScans();
    } catch (error) {
      log.error('[AdvancedSecurityService] Failed to list scans:', error);
      return [];
    }
  }

  /**
   * Cancel an ongoing scan
   * Requires Tauri backend
   */
  async cancelScan(scanId: string): Promise<void> {
    if (!useBackend) {
      log.warn('cancelScan requires Tauri backend');
      return;
    }
    try {
      await VulnerabilityScanService.cancelScan(scanId);
    } catch (error) {
      log.error('[AdvancedSecurityService] Failed to cancel scan:', error);
      throw error;
    }
  }

  /**
   * Export scan report
   * Requires Tauri backend
   */
  async exportScanReport(scanId: string, format: 'pdf' | 'html' | 'json'): Promise<string | null> {
    if (!useBackend) {
      log.warn('exportScanReport requires Tauri backend');
      return null;
    }
    try {
      return await VulnerabilityScanService.exportReport(scanId, format);
    } catch (error) {
      log.error('[AdvancedSecurityService] Failed to export scan report:', error);
      throw error;
    }
  }

  /**
   * Generate payloads using backend
   * Requires Tauri backend
   */
  async generatePayloads(exploitType: ExploitType): Promise<string[]> {
    if (!useBackend) {
      // Return simulated payloads if backend not available
      return this.getSimulatedPayloads(exploitType);
    }
    try {
      return await PayloadGeneratorService.generatePayloads(exploitType);
    } catch (error) {
      log.error('[AdvancedSecurityService] Failed to generate payloads:', error);
      return this.getSimulatedPayloads(exploitType);
    }
  }

  /**
   * Get AI-enhanced payloads
   * Requires Tauri backend
   */
  async getAIPayloads(exploitType: ExploitType, context?: string): Promise<string[]> {
    if (!useBackend) {
      return [];
    }
    try {
      return await PayloadGeneratorService.getAIPayloads(exploitType, context);
    } catch (error) {
      log.error('[AdvancedSecurityService] Failed to get AI payloads:', error);
      return [];
    }
  }

  /**
   * Encode a payload
   * Requires Tauri backend
   */
  async encodePayload(
    payload: string, 
    encoding: 'base64' | 'url' | 'html' | 'unicode'
  ): Promise<string> {
    if (!useBackend) {
      // Fallback to JavaScript encoding
      return this.encodePayloadLocally(payload, encoding);
    }
    try {
      return await PayloadGeneratorService.encodePayload(payload, encoding);
    } catch (error) {
      log.error('[AdvancedSecurityService] Failed to encode payload:', error);
      return this.encodePayloadLocally(payload, encoding);
    }
  }

  /**
   * Local payload encoding fallback
   */
  private encodePayloadLocally(payload: string, encoding: 'base64' | 'url' | 'html' | 'unicode'): string {
    switch (encoding) {
      case 'base64':
        return btoa(payload);
      case 'url':
        return encodeURIComponent(payload);
      case 'html':
        return payload.replace(/&/g, '&amp;')
                     .replace(/</g, '&lt;')
                     .replace(/>/g, '&gt;')
                     .replace(/"/g, '&quot;')
                     .replace(/'/g, '&#039;');
      case 'unicode':
        return Array.from(payload).map(c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`).join('');
      default:
        return payload;
    }
  }

  /**
   * Get simulated payloads when backend not available
   */
  private getSimulatedPayloads(exploitType: ExploitType): string[] {
    switch (exploitType) {
      case 'SQLInjection':
        return ["' OR 1=1--", "1' OR '1'='1", "'; DROP TABLE users;--", "1 UNION SELECT NULL,NULL,NULL--"];
      case 'XSS':
        return ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '<svg onload=alert(1)>'];
      case 'CSRF':
        return ['<img src="http://target.com/action?param=value">'];
      case 'RCE':
        return ['; ls -la', '| cat /etc/passwd', '`id`', '$(whoami)'];
      case 'LFI':
        return ['../../../etc/passwd', '....//....//....//etc/passwd', '/etc/passwd%00'];
      case 'SSRF':
        return ['http://127.0.0.1', 'http://localhost', 'file:///etc/passwd'];
      case 'CommandInjection':
        return ['; id', '| id', '`id`', '$(id)'];
      case 'PathTraversal':
        return ['../../../', '..\\..\\..\\', '....//....//'];
      default:
        return [];
    }
  }
}

// ============================================================================
// React Hook
// ============================================================================

export function useAdvancedSecurity(openaiKey?: string) {
  const [service, setService] = useState<AdvancedSecurityService | null>(null);
  const [templates, setTemplates] = useState<VulnerabilityTemplate[]>([]);
  const [assets, setAssets] = useState<AttackSurfaceAsset[]>([]);
  const [exploitSessions, setExploitSessions] = useState<ExploitSession[]>([]);
  const [scanResults, setScanResults] = useState<SecurityScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(false);

  const serviceRef = useRef<AdvancedSecurityService | null>(null);

  useEffect(() => {
    const svc = new AdvancedSecurityService(openaiKey);
    serviceRef.current = svc;

    svc.init()
      .then(() => {
        setService(svc);
        setTemplates(svc.getTemplates());
        setAssets(svc.getAssets());
        setBackendAvailable(svc.backendAvailable);
        setIsLoading(false);

        // Load backend data if available
        if (svc.backendAvailable) {
          svc.listExploitSessions().then(setExploitSessions);
          svc.listScans().then(setScanResults);
        }
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      });
  }, [openaiKey]);

  const refreshTemplates = useCallback(() => {
    if (service) {
      setTemplates(service.getTemplates());
    }
  }, [service]);

  const refreshAssets = useCallback(() => {
    if (service) {
      setAssets(service.getAssets());
    }
  }, [service]);

  const refreshExploitSessions = useCallback(async () => {
    if (service && service.backendAvailable) {
      const sessions = await service.listExploitSessions();
      setExploitSessions(sessions);
    }
  }, [service]);

  const refreshScanResults = useCallback(async () => {
    if (service && service.backendAvailable) {
      const scans = await service.listScans();
      setScanResults(scans);
    }
  }, [service]);

  const discoverAssets = useCallback(async (domain: string) => {
    if (!service) return [];
    const discovered = await service.discoverAssets(domain);
    refreshAssets();
    return discovered;
  }, [service, refreshAssets]);

  const createExploitSession = useCallback(async (
    targetUrl: string, 
    exploitType: ExploitType, 
    enableAI: boolean = true
  ) => {
    if (!service) return null;
    const session = await service.createExploitSession(targetUrl, exploitType, enableAI);
    refreshExploitSessions();
    return session;
  }, [service, refreshExploitSessions]);

  const startScan = useCallback(async (targetUrl: string, scanTypes?: ExploitType[]) => {
    if (!service) return null;
    const result = await service.startVulnerabilityScan(targetUrl, scanTypes);
    refreshScanResults();
    return result;
  }, [service, refreshScanResults]);

  return {
    isLoading,
    error,
    templates,
    assets,
    exploitSessions,
    scanResults,
    backendAvailable,
    refreshTemplates,
    refreshAssets,
    refreshExploitSessions,
    refreshScanResults,
    discoverAssets,
    
    // Template methods
    getTemplatesByTag: service?.getTemplatesByTag,
    getTemplatesBySeverity: service?.getTemplatesBySeverity,
    importNucleiTemplate: service?.importNucleiTemplate,
    executeTemplate: service?.executeTemplate,
    
    // OAST methods
    startOASTSession: service?.startOASTSession,
    stopOASTSession: service?.stopOASTSession,
    generateOASTPayload: service?.generateOASTPayload,
    getOASTCallbacks: service?.getOASTCallbacks,
    
    // Attack surface
    getHighRiskAssets: service?.getHighRiskAssets,
    monitorAssetChanges: service?.monitorAssetChanges,
    
    // AI methods
    analyzeVulnerability: service?.analyzeVulnerability.bind(service),
    suggestExploits: service?.suggestExploits.bind(service),
    generatePOC: service?.generatePOC.bind(service),
    generateTemplate: service?.generateTemplate.bind(service),
    
    // Compliance
    generateComplianceReport: service?.generateComplianceReport,
    getComplianceFrameworks: service?.getComplianceFrameworks,

    // Backend Exploit Session Methods (require Tauri)
    createExploitSession,
    getExploitSession: service?.getExploitSession.bind(service),
    closeExploitSession: service?.closeExploitSession.bind(service),

    // Backend Scan Methods (require Tauri)
    startScan,
    getScanResult: service?.getScanResult.bind(service),
    cancelScan: service?.cancelScan.bind(service),
    exportScanReport: service?.exportScanReport.bind(service),

    // Backend Payload Methods (require Tauri)
    generatePayloads: service?.generatePayloads.bind(service),
    getAIPayloads: service?.getAIPayloads.bind(service),
    encodePayload: service?.encodePayload.bind(service),
    
    service,
  };
}

// ============================================================================
// Export
// ============================================================================

export {
  OWASP_TOP_10_2021,
  COMPLIANCE_FRAMEWORKS,
  DEFAULT_TEMPLATES,
};
