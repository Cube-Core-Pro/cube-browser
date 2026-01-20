/**
 * CUBE Elite v6 - Advanced Terminal Service
 * 
 * Enterprise-grade terminal with AI-powered features.
 * Competes with: Warp, iTerm2, Termius, SecureCRT, MobaXterm
 * 
 * Features:
 * - AI Agent with full terminal control
 * - Natural language command generation
 * - Command blocks with structured output
 * - Parameterized workflows
 * - Team vaults with encrypted sync
 * - Session audit logging
 * - Multi-execution (broadcast to servers)
 * - Shell integration
 * - Trigger-based automation
 * - GPU-accelerated rendering info
 * 
 * Now integrated with Tauri backend terminal commands
 * 
 * @module terminal-advanced-service
 * @version 1.1.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('TerminalAdvanced');

// ============================================================================
// Backend Integration
// ============================================================================

interface BackendTerminalSession {
  id: string;
  name: string;
  shell: string;
  cwd: string;
  created_at: number;
  last_activity: number;
  is_active: boolean;
  pid?: number;
}

interface BackendCommandHistory {
  id: string;
  session_id: string;
  command: string;
  output: string;
  exit_code: number;
  executed_at: number;
  duration_ms: number;
}

interface BackendTerminalConfig {
  default_shell: string;
  font_family: string;
  font_size: number;
  theme: string;
  cursor_style: string;
  scrollback_lines: number;
  bell_enabled: boolean;
  copy_on_select: boolean;
}

interface BackendTerminalStats {
  total_sessions: number;
  active_sessions: number;
  commands_executed: number;
  total_time_ms: number;
  most_used_commands: Record<string, number>;
}

const BackendTerminalAPI = {
  async createSession(session: BackendTerminalSession): Promise<void> {
    try {
      await invoke<void>('create_terminal_session', { session });
    } catch (error) {
      log.warn('Backend createSession failed:', error);
      throw error;
    }
  },

  async getAllSessions(): Promise<BackendTerminalSession[]> {
    try {
      return await invoke<BackendTerminalSession[]>('get_all_terminal_sessions');
    } catch (error) {
      log.warn('Backend getAllSessions failed:', error);
      return [];
    }
  },

  async getActiveSessions(): Promise<BackendTerminalSession[]> {
    try {
      return await invoke<BackendTerminalSession[]>('get_active_terminal_sessions');
    } catch (error) {
      log.warn('Backend getActiveSessions failed:', error);
      return [];
    }
  },

  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await invoke<void>('update_terminal_session_activity', { sessionId });
    } catch (error) {
      log.warn('Backend updateSessionActivity failed:', error);
    }
  },

  async closeSession(sessionId: string): Promise<void> {
    try {
      await invoke<void>('close_terminal_session', { sessionId });
    } catch (error) {
      log.warn('Backend closeSession failed:', error);
    }
  },

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await invoke<void>('delete_terminal_session', { sessionId });
    } catch (error) {
      log.warn('Backend deleteSession failed:', error);
    }
  },

  async addCommandHistory(history: BackendCommandHistory): Promise<void> {
    try {
      await invoke<void>('add_terminal_command_history', { history });
    } catch (error) {
      log.warn('Backend addCommandHistory failed:', error);
    }
  },

  async getSessionHistory(sessionId: string, limit: number): Promise<BackendCommandHistory[]> {
    try {
      return await invoke<BackendCommandHistory[]>('get_terminal_session_history', { sessionId, limit });
    } catch (error) {
      log.warn('Backend getSessionHistory failed:', error);
      return [];
    }
  },

  async searchHistory(query: string, limit: number): Promise<BackendCommandHistory[]> {
    try {
      return await invoke<BackendCommandHistory[]>('search_terminal_history', { query, limit });
    } catch (error) {
      log.warn('Backend searchHistory failed:', error);
      return [];
    }
  },

  async clearSessionHistory(sessionId: string): Promise<void> {
    try {
      await invoke<void>('clear_terminal_session_history', { sessionId });
    } catch (error) {
      log.warn('Backend clearSessionHistory failed:', error);
    }
  },

  async getConfig(): Promise<BackendTerminalConfig | null> {
    try {
      return await invoke<BackendTerminalConfig>('get_terminal_config');
    } catch (error) {
      log.warn('Backend getConfig failed:', error);
      return null;
    }
  },

  async updateConfig(config: BackendTerminalConfig): Promise<void> {
    try {
      await invoke<void>('update_terminal_config', { config });
    } catch (error) {
      log.warn('Backend updateConfig failed:', error);
    }
  },

  async getStats(): Promise<BackendTerminalStats | null> {
    try {
      return await invoke<BackendTerminalStats>('get_terminal_stats');
    } catch (error) {
      log.warn('Backend getStats failed:', error);
      return null;
    }
  }
};

// ============================================================================
// Types
// ============================================================================

/**
 * AI Agent task types
 */
export type AIAgentTaskType = 
  | 'execute_command' 
  | 'debug_error' 
  | 'explain_output'
  | 'generate_script'
  | 'fix_issue'
  | 'deploy'
  | 'research';

/**
 * Command block structure (Warp-style)
 */
export interface CommandBlock {
  id: string;
  sessionId: string;
  command: string;
  prompt: string;
  workingDirectory: string;
  timestamp: Date;
  duration: number;
  exitCode: number;
  output: BlockOutput;
  isBookmarked: boolean;
  tags: string[];
  aiAnalysis?: AIAnalysis;
}

/**
 * Structured output
 */
export interface BlockOutput {
  stdout: string;
  stderr: string;
  combined: string;
  lineCount: number;
  hasError: boolean;
  detectedFormat?: 'json' | 'table' | 'log' | 'diff' | 'plain';
  parsedData?: unknown;
}

/**
 * AI analysis of command output
 */
export interface AIAnalysis {
  summary: string;
  errors: DetectedError[];
  suggestions: string[];
  relatedCommands: string[];
  riskLevel: 'safe' | 'caution' | 'dangerous';
}

/**
 * Detected error from output
 */
export interface DetectedError {
  type: 'syntax' | 'runtime' | 'permission' | 'network' | 'resource' | 'unknown';
  message: string;
  line?: number;
  suggestedFix?: string;
  confidence: number;
}

/**
 * Parameterized workflow
 */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  commands: WorkflowCommand[];
  parameters: WorkflowParameter[];
  triggers?: WorkflowTrigger[];
  isShared: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  runCount: number;
}

/**
 * Workflow command
 */
export interface WorkflowCommand {
  id: string;
  order: number;
  command: string;
  description?: string;
  onError: 'stop' | 'continue' | 'retry';
  retryCount?: number;
  timeout?: number;
  condition?: string;
}

/**
 * Workflow parameter
 */
export interface WorkflowParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'file' | 'directory';
  defaultValue?: unknown;
  required: boolean;
  options?: string[];
  validation?: string;
}

/**
 * Workflow trigger
 */
export interface WorkflowTrigger {
  type: 'cron' | 'file_change' | 'webhook' | 'event';
  config: Record<string, unknown>;
  enabled: boolean;
}

/**
 * Team vault
 */
export interface TeamVault {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  encryptionKey: string;
  members: VaultMember[];
  credentials: VaultCredential[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vault member
 */
export interface VaultMember {
  userId: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: VaultPermission[];
  addedAt: Date;
  addedBy: string;
}

/**
 * Vault permissions
 */
export interface VaultPermission {
  resource: 'credentials' | 'workflows' | 'sessions' | 'audit';
  actions: ('view' | 'create' | 'edit' | 'delete' | 'use')[];
}

/**
 * Vault credential
 */
export interface VaultCredential {
  id: string;
  name: string;
  type: 'ssh_password' | 'ssh_key' | 'api_key' | 'certificate' | 'other';
  host?: string;
  port?: number;
  username?: string;
  encryptedData: string;
  tags: string[];
  createdAt: Date;
  lastUsed?: Date;
}

/**
 * SSH connection with jump hosts
 */
export interface SSHConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key' | 'agent';
  keyPath?: string;
  passphrase?: string;
  jumpHosts?: JumpHost[];
  environment?: Record<string, string>;
  startupCommands?: string[];
  keepAlive?: boolean;
  compression?: boolean;
  forwardAgent?: boolean;
}

/**
 * Jump host configuration
 */
export interface JumpHost {
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key';
  keyPath?: string;
}

/**
 * Session audit log
 */
export interface SessionAudit {
  id: string;
  sessionId: string;
  userId: string;
  connectionId: string;
  startTime: Date;
  endTime?: Date;
  commands: AuditCommand[];
  fileTransfers: AuditFileTransfer[];
  metadata: {
    clientIp: string;
    userAgent: string;
    location?: string;
  };
}

/**
 * Audit command entry
 */
export interface AuditCommand {
  timestamp: Date;
  command: string;
  exitCode?: number;
  duration?: number;
}

/**
 * Audit file transfer
 */
export interface AuditFileTransfer {
  timestamp: Date;
  direction: 'upload' | 'download';
  localPath: string;
  remotePath: string;
  size: number;
  status: 'success' | 'failed';
}

/**
 * Multi-execution request
 */
export interface MultiExecRequest {
  id: string;
  command: string;
  targets: string[];
  parallel: boolean;
  timeout: number;
  onError: 'stop' | 'continue';
  results: MultiExecResult[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Multi-execution result
 */
export interface MultiExecResult {
  targetId: string;
  targetName: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  output?: string;
  error?: string;
  exitCode?: number;
  duration?: number;
}

/**
 * Shell integration
 */
export interface ShellIntegration {
  enabled: boolean;
  shell: 'bash' | 'zsh' | 'fish' | 'powershell';
  features: {
    commandHistory: boolean;
    directoryTracking: boolean;
    promptDetection: boolean;
    semanticPrompts: boolean;
    autoProfile: boolean;
  };
  currentDirectory: string;
  recentDirectories: string[];
  commandHistory: string[];
}

/**
 * Trigger definition
 */
export interface Trigger {
  id: string;
  name: string;
  pattern: string;
  isRegex: boolean;
  caseSensitive: boolean;
  action: TriggerAction;
  enabled: boolean;
}

/**
 * Trigger action
 */
export interface TriggerAction {
  type: 'highlight' | 'notify' | 'sound' | 'execute' | 'respond';
  config: {
    color?: string;
    backgroundColor?: string;
    notification?: {
      title: string;
      body: string;
    };
    soundFile?: string;
    command?: string;
    response?: string;
  };
}

/**
 * AI agent context
 */
export interface AIAgentContext {
  sessionId: string;
  workingDirectory: string;
  environment: Record<string, string>;
  recentCommands: CommandBlock[];
  recentErrors: DetectedError[];
  projectContext?: ProjectContext;
}

/**
 * Project context
 */
export interface ProjectContext {
  type: 'node' | 'python' | 'rust' | 'go' | 'java' | 'unknown';
  hasGit: boolean;
  branch?: string;
  packageManager?: string;
  scripts?: Record<string, string>;
}

// ============================================================================
// Constants
// ============================================================================

const DB_NAME = 'cube_terminal_advanced';
const DB_VERSION = 1;

const ERROR_PATTERNS: Record<string, RegExp> = {
  permission: /permission denied|access denied|EACCES/i,
  notFound: /command not found|no such file|ENOENT/i,
  network: /connection refused|timeout|ECONNREFUSED|ETIMEDOUT/i,
  syntax: /syntax error|unexpected token|parse error/i,
  memory: /out of memory|heap|ENOMEM/i,
  disk: /no space left|disk quota|ENOSPC/i,
};

const DANGEROUS_COMMANDS = [
  'rm -rf /',
  'rm -rf /*',
  'dd if=/dev/zero',
  'mkfs',
  ':(){:|:&};:',
  '> /dev/sda',
  'chmod -R 777 /',
  'chown -R',
];

// ============================================================================
// Storage Service
// ============================================================================

class TerminalStorageService {
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

        // Command blocks store
        if (!db.objectStoreNames.contains('blocks')) {
          const blocksStore = db.createObjectStore('blocks', { keyPath: 'id' });
          blocksStore.createIndex('sessionId', 'sessionId', { unique: false });
          blocksStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Workflows store
        if (!db.objectStoreNames.contains('workflows')) {
          const workflowsStore = db.createObjectStore('workflows', { keyPath: 'id' });
          workflowsStore.createIndex('category', 'category', { unique: false });
        }

        // Vaults store
        if (!db.objectStoreNames.contains('vaults')) {
          db.createObjectStore('vaults', { keyPath: 'id' });
        }

        // Connections store
        if (!db.objectStoreNames.contains('connections')) {
          db.createObjectStore('connections', { keyPath: 'id' });
        }

        // Audit store
        if (!db.objectStoreNames.contains('audits')) {
          const auditsStore = db.createObjectStore('audits', { keyPath: 'id' });
          auditsStore.createIndex('sessionId', 'sessionId', { unique: false });
          auditsStore.createIndex('userId', 'userId', { unique: false });
        }

        // Triggers store
        if (!db.objectStoreNames.contains('triggers')) {
          db.createObjectStore('triggers', { keyPath: 'id' });
        }
      };
    });
  }

  // Generic save/get methods
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

  async getByIndex<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

// ============================================================================
// AI Agent Service
// ============================================================================

class AIAgentService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate command from natural language
   */
  async generateCommand(request: string, context: AIAgentContext): Promise<{
    command: string;
    explanation: string;
    riskLevel: 'safe' | 'caution' | 'dangerous';
    alternatives?: string[];
  }> {
    const prompt = this.buildPrompt(request, context);

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
              content: `You are an expert terminal assistant. Generate safe, correct shell commands.
              
Rules:
1. Always provide the exact command to run
2. Explain what the command does
3. Warn about dangerous operations (rm -rf, sudo, etc.)
4. Consider the working directory and environment
5. Suggest alternatives when appropriate

Return JSON with: command, explanation, riskLevel (safe/caution/dangerous), alternatives[]` 
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      log.error('AI command generation failed:', error);
      throw error;
    }
  }

  /**
   * Analyze command output for errors
   */
  async analyzeOutput(block: CommandBlock): Promise<AIAnalysis> {
    const prompt = `Analyze this command output:

Command: ${block.command}
Exit Code: ${block.exitCode}
Working Directory: ${block.workingDirectory}

STDOUT:
${block.output.stdout.slice(0, 5000)}

STDERR:
${block.output.stderr.slice(0, 2000)}

Provide:
1. Brief summary
2. Any errors detected (type, message, line, fix)
3. Suggestions for next steps
4. Related useful commands
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
              content: 'You are a terminal output analyzer. Return JSON with: summary, errors[], suggestions[], relatedCommands[], riskLevel' 
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      log.error('Output analysis failed:', error);
      return {
        summary: 'Analysis unavailable',
        errors: [],
        suggestions: [],
        relatedCommands: [],
        riskLevel: 'safe',
      };
    }
  }

  /**
   * Debug error and suggest fix
   */
  async debugError(error: DetectedError, context: AIAgentContext): Promise<{
    diagnosis: string;
    fixCommand?: string;
    steps: string[];
    prevention: string;
  }> {
    const prompt = `Debug this error:

Error Type: ${error.type}
Error Message: ${error.message}
Line: ${error.line || 'N/A'}

Recent Commands:
${context.recentCommands.slice(-5).map(c => `- ${c.command}`).join('\n')}

Working Directory: ${context.workingDirectory}
Environment: ${JSON.stringify(context.environment)}

Provide diagnosis, fix command if possible, step-by-step resolution, and prevention tips.`;

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
            { role: 'system', content: 'You are a debugging expert. Return JSON with: diagnosis, fixCommand, steps[], prevention' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate script from description
   */
  async generateScript(
    description: string,
    shell: 'bash' | 'zsh' | 'powershell' | 'python',
    context: AIAgentContext
  ): Promise<{
    script: string;
    explanation: string;
    dependencies?: string[];
  }> {
    const prompt = `Generate a ${shell} script:

Description: ${description}
Working Directory: ${context.workingDirectory}
Project Type: ${context.projectContext?.type || 'unknown'}

Requirements:
1. Include error handling
2. Add comments explaining each section
3. Make it portable when possible
4. List any dependencies`;

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
            { role: 'system', content: 'You are a script generator. Return JSON with: script, explanation, dependencies[]' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      throw error;
    }
  }

  private buildPrompt(request: string, context: AIAgentContext): string {
    return `User Request: ${request}

Context:
- Working Directory: ${context.workingDirectory}
- Shell: ${context.environment.SHELL || 'bash'}
- OS: ${context.environment.OS || 'unknown'}
- Recent Commands: ${context.recentCommands.slice(-3).map(c => c.command).join(', ')}
- Project Type: ${context.projectContext?.type || 'unknown'}
${context.projectContext?.hasGit ? `- Git Branch: ${context.projectContext.branch}` : ''}`;
  }
}

// ============================================================================
// Command Block Service
// ============================================================================

class CommandBlockService {
  private storage: TerminalStorageService;

  constructor(storage: TerminalStorageService) {
    this.storage = storage;
  }

  /**
   * Create command block from execution
   */
  createBlock(
    sessionId: string,
    command: string,
    prompt: string,
    workingDirectory: string,
    stdout: string,
    stderr: string,
    exitCode: number,
    duration: number
  ): CommandBlock {
    const combined = stdout + stderr;
    
    return {
      id: `block_${Date.now()}`,
      sessionId,
      command,
      prompt,
      workingDirectory,
      timestamp: new Date(),
      duration,
      exitCode,
      output: {
        stdout,
        stderr,
        combined,
        lineCount: combined.split('\n').length,
        hasError: exitCode !== 0 || stderr.length > 0,
        detectedFormat: this.detectFormat(combined),
        parsedData: this.parseOutput(combined),
      },
      isBookmarked: false,
      tags: [],
    };
  }

  /**
   * Detect output format
   */
  private detectFormat(output: string): BlockOutput['detectedFormat'] {
    const trimmed = output.trim();
    
    // JSON detection
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        // Not valid JSON
      }
    }

    // Diff detection
    if (trimmed.startsWith('diff ') || trimmed.includes('\n@@') || /^[+-]{3}/.test(trimmed)) {
      return 'diff';
    }

    // Table detection (multiple columns with consistent spacing)
    const lines = trimmed.split('\n');
    if (lines.length > 1) {
      const hasConsistentSpacing = lines.slice(0, 5).every(line => 
        line.includes('  ') || line.includes('\t')
      );
      if (hasConsistentSpacing) {
        return 'table';
      }
    }

    // Log detection (timestamps at start of lines)
    const logPattern = /^\d{4}-\d{2}-\d{2}|\[\d+:\d+:\d+\]|^\w{3}\s+\d+\s+\d+:\d+/m;
    if (logPattern.test(trimmed)) {
      return 'log';
    }

    return 'plain';
  }

  /**
   * Parse output based on format
   */
  private parseOutput(output: string): unknown {
    const format = this.detectFormat(output);
    
    switch (format) {
      case 'json':
        try {
          return JSON.parse(output.trim());
        } catch {
          return null;
        }
      case 'table':
        return this.parseTable(output);
      default:
        return null;
    }
  }

  /**
   * Parse table output
   */
  private parseTable(output: string): unknown {
    const lines = output.trim().split('\n');
    if (lines.length < 2) return null;

    // Try to detect column positions from header
    const header = lines[0];
    const columns: { name: string; start: number; end: number }[] = [];
    
    let currentStart = 0;
    let currentWord = '';
    
    for (let i = 0; i < header.length; i++) {
      const char = header[i];
      if (char !== ' ' && char !== '\t') {
        if (currentWord === '') {
          currentStart = i;
        }
        currentWord += char;
      } else if (currentWord !== '') {
        columns.push({
          name: currentWord,
          start: currentStart,
          end: i,
        });
        currentWord = '';
      }
    }
    
    if (currentWord !== '') {
      columns.push({
        name: currentWord,
        start: currentStart,
        end: header.length,
      });
    }

    // Parse data rows
    return lines.slice(1).map(line => {
      const row: Record<string, string> = {};
      columns.forEach((col, i) => {
        const nextStart = columns[i + 1]?.start || line.length;
        row[col.name] = line.substring(col.start, nextStart).trim();
      });
      return row;
    });
  }

  /**
   * Detect errors in output
   */
  detectErrors(output: string, stderr: string, exitCode: number): DetectedError[] {
    const errors: DetectedError[] = [];
    const combined = output + stderr;

    // Check exit code
    if (exitCode !== 0) {
      errors.push({
        type: 'runtime',
        message: `Command exited with code ${exitCode}`,
        confidence: 1.0,
      });
    }

    // Check for common error patterns
    for (const [type, pattern] of Object.entries(ERROR_PATTERNS)) {
      const match = combined.match(pattern);
      if (match) {
        errors.push({
          type: type as DetectedError['type'],
          message: match[0],
          confidence: 0.9,
        });
      }
    }

    return errors;
  }

  /**
   * Save block
   */
  async saveBlock(block: CommandBlock): Promise<void> {
    await this.storage.save('blocks', block);
  }

  /**
   * Get blocks for session
   */
  async getSessionBlocks(sessionId: string): Promise<CommandBlock[]> {
    return await this.storage.getByIndex<CommandBlock>('blocks', 'sessionId', sessionId);
  }

  /**
   * Search blocks
   */
  async searchBlocks(query: string): Promise<CommandBlock[]> {
    const all = await this.storage.getAll<CommandBlock>('blocks');
    const lowerQuery = query.toLowerCase();
    
    return all.filter(block => 
      block.command.toLowerCase().includes(lowerQuery) ||
      block.output.combined.toLowerCase().includes(lowerQuery) ||
      block.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

// ============================================================================
// Workflow Service
// ============================================================================

class WorkflowService {
  private storage: TerminalStorageService;

  constructor(storage: TerminalStorageService) {
    this.storage = storage;
  }

  /**
   * Create workflow
   */
  async createWorkflow(
    name: string,
    description: string,
    category: string,
    commands: WorkflowCommand[],
    parameters: WorkflowParameter[]
  ): Promise<Workflow> {
    const workflow: Workflow = {
      id: `workflow_${Date.now()}`,
      name,
      description,
      category,
      commands,
      parameters,
      isShared: false,
      createdBy: 'local',
      createdAt: new Date(),
      updatedAt: new Date(),
      runCount: 0,
    };

    await this.storage.save('workflows', workflow);
    return workflow;
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    workflow: Workflow,
    params: Record<string, unknown>,
    executeCommand: (cmd: string) => Promise<{ exitCode: number; output: string }>
  ): Promise<{
    success: boolean;
    results: { command: string; exitCode: number; output: string }[];
    error?: string;
  }> {
    const results: { command: string; exitCode: number; output: string }[] = [];

    for (const cmd of workflow.commands.sort((a, b) => a.order - b.order)) {
      // Substitute parameters
      let command = cmd.command;
      for (const [key, value] of Object.entries(params)) {
        command = command.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      }

      // Check condition
      if (cmd.condition) {
        // Simple condition evaluation
        const conditionResult = await executeCommand(cmd.condition);
        if (conditionResult.exitCode !== 0) {
          continue;
        }
      }

      // Execute with retry
      let result: { exitCode: number; output: string };
      let attempts = 0;
      const maxAttempts = cmd.onError === 'retry' ? (cmd.retryCount || 3) : 1;

      do {
        attempts++;
        result = await executeCommand(command);
      } while (result.exitCode !== 0 && attempts < maxAttempts);

      results.push({
        command,
        exitCode: result.exitCode,
        output: result.output,
      });

      // Handle error
      if (result.exitCode !== 0 && cmd.onError === 'stop') {
        return {
          success: false,
          results,
          error: `Command failed: ${command}`,
        };
      }
    }

    // Update run count
    workflow.runCount++;
    workflow.updatedAt = new Date();
    await this.storage.save('workflows', workflow);

    return { success: true, results };
  }

  /**
   * Get all workflows
   */
  async getWorkflows(): Promise<Workflow[]> {
    return await this.storage.getAll<Workflow>('workflows');
  }

  /**
   * Get workflow by id
   */
  async getWorkflow(id: string): Promise<Workflow | null> {
    return await this.storage.get<Workflow>('workflows', id);
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    await this.storage.delete('workflows', id);
  }
}

// ============================================================================
// Multi-Execution Service
// ============================================================================

class MultiExecService {
  private runningJobs: Map<string, AbortController> = new Map();

  /**
   * Execute command on multiple targets
   */
  async execute(
    request: MultiExecRequest,
    executeOnTarget: (targetId: string, command: string, signal: AbortSignal) => Promise<MultiExecResult>
  ): Promise<MultiExecRequest> {
    const controller = new AbortController();
    this.runningJobs.set(request.id, controller);

    request.status = 'running';
    request.startedAt = new Date();

    try {
      if (request.parallel) {
        // Execute in parallel
        const promises = request.targets.map(async targetId => {
          if (controller.signal.aborted) {
            return {
              targetId,
              targetName: targetId,
              status: 'skipped' as const,
            };
          }
          return await executeOnTarget(targetId, request.command, controller.signal);
        });

        request.results = await Promise.all(promises);
      } else {
        // Execute sequentially
        for (const targetId of request.targets) {
          if (controller.signal.aborted) {
            request.results.push({
              targetId,
              targetName: targetId,
              status: 'skipped',
            });
            continue;
          }

          const result = await executeOnTarget(targetId, request.command, controller.signal);
          request.results.push(result);

          if (result.status === 'failed' && request.onError === 'stop') {
            break;
          }
        }
      }

      request.status = 'completed';
    } catch (_error) {
      request.status = 'failed';
    }

    request.completedAt = new Date();
    this.runningJobs.delete(request.id);

    return request;
  }

  /**
   * Cancel execution
   */
  cancel(requestId: string): void {
    const controller = this.runningJobs.get(requestId);
    if (controller) {
      controller.abort();
      this.runningJobs.delete(requestId);
    }
  }
}

// ============================================================================
// Trigger Service
// ============================================================================

class TriggerService {
  private triggers: Trigger[] = [];
  private storage: TerminalStorageService;

  constructor(storage: TerminalStorageService) {
    this.storage = storage;
  }

  /**
   * Load triggers
   */
  async load(): Promise<void> {
    this.triggers = await this.storage.getAll<Trigger>('triggers');
  }

  /**
   * Add trigger
   */
  async addTrigger(trigger: Omit<Trigger, 'id'>): Promise<Trigger> {
    const newTrigger: Trigger = {
      ...trigger,
      id: `trigger_${Date.now()}`,
    };
    
    await this.storage.save('triggers', newTrigger);
    this.triggers.push(newTrigger);
    
    return newTrigger;
  }

  /**
   * Process output for triggers
   */
  processOutput(output: string): TriggerMatch[] {
    const matches: TriggerMatch[] = [];

    for (const trigger of this.triggers) {
      if (!trigger.enabled) continue;

      const flags = trigger.caseSensitive ? 'g' : 'gi';
      const pattern = trigger.isRegex 
        ? new RegExp(trigger.pattern, flags)
        : new RegExp(this.escapeRegex(trigger.pattern), flags);

      let match: RegExpExecArray | null;
      while ((match = pattern.exec(output)) !== null) {
        matches.push({
          trigger,
          match: match[0],
          position: match.index,
        });
      }
    }

    return matches;
  }

  /**
   * Execute trigger action
   */
  executeAction(trigger: Trigger, match: string): void {
    switch (trigger.action.type) {
      case 'notify':
        if (trigger.action.config.notification) {
          new Notification(
            trigger.action.config.notification.title.replace('{match}', match),
            { body: trigger.action.config.notification.body.replace('{match}', match) }
          );
        }
        break;

      case 'sound':
        if (trigger.action.config.soundFile) {
          const audio = new Audio(trigger.action.config.soundFile);
          audio.play().catch(console.error);
        }
        break;

      case 'execute':
        // Emit event for command execution
        window.dispatchEvent(new CustomEvent('terminal:trigger-execute', {
          detail: { command: trigger.action.config.command }
        }));
        break;
    }
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get all triggers
   */
  getTriggers(): Trigger[] {
    return this.triggers;
  }

  /**
   * Delete trigger
   */
  async deleteTrigger(id: string): Promise<void> {
    await this.storage.delete('triggers', id);
    this.triggers = this.triggers.filter(t => t.id !== id);
  }
}

interface TriggerMatch {
  trigger: Trigger;
  match: string;
  position: number;
}

// ============================================================================
// Audit Service
// ============================================================================

class AuditService {
  private storage: TerminalStorageService;
  private currentAudit: SessionAudit | null = null;

  constructor(storage: TerminalStorageService) {
    this.storage = storage;
  }

  /**
   * Start session audit
   */
  startAudit(sessionId: string, userId: string, connectionId: string, metadata: SessionAudit['metadata']): SessionAudit {
    this.currentAudit = {
      id: `audit_${Date.now()}`,
      sessionId,
      userId,
      connectionId,
      startTime: new Date(),
      commands: [],
      fileTransfers: [],
      metadata,
    };
    
    return this.currentAudit;
  }

  /**
   * Log command
   */
  logCommand(command: string, exitCode?: number, duration?: number): void {
    if (!this.currentAudit) return;

    this.currentAudit.commands.push({
      timestamp: new Date(),
      command,
      exitCode,
      duration,
    });
  }

  /**
   * Log file transfer
   */
  logFileTransfer(
    direction: 'upload' | 'download',
    localPath: string,
    remotePath: string,
    size: number,
    status: 'success' | 'failed'
  ): void {
    if (!this.currentAudit) return;

    this.currentAudit.fileTransfers.push({
      timestamp: new Date(),
      direction,
      localPath,
      remotePath,
      size,
      status,
    });
  }

  /**
   * End session audit
   */
  async endAudit(): Promise<void> {
    if (!this.currentAudit) return;

    this.currentAudit.endTime = new Date();
    await this.storage.save('audits', this.currentAudit);
    this.currentAudit = null;
  }

  /**
   * Get audits
   */
  async getAudits(filter?: { sessionId?: string; userId?: string }): Promise<SessionAudit[]> {
    const all = await this.storage.getAll<SessionAudit>('audits');
    
    if (!filter) return all;

    return all.filter(audit => {
      if (filter.sessionId && audit.sessionId !== filter.sessionId) return false;
      if (filter.userId && audit.userId !== filter.userId) return false;
      return true;
    });
  }
}

// ============================================================================
// Command Safety Service
// ============================================================================

class CommandSafetyService {
  /**
   * Check if command is dangerous
   */
  checkSafety(command: string): {
    isSafe: boolean;
    riskLevel: 'safe' | 'caution' | 'dangerous';
    warnings: string[];
  } {
    const warnings: string[] = [];
    let riskLevel: 'safe' | 'caution' | 'dangerous' = 'safe';

    // Check for dangerous commands
    const normalizedCommand = command.toLowerCase().replace(/\s+/g, ' ').trim();
    
    for (const dangerous of DANGEROUS_COMMANDS) {
      if (normalizedCommand.includes(dangerous.toLowerCase())) {
        return {
          isSafe: false,
          riskLevel: 'dangerous',
          warnings: [`This command matches dangerous pattern: ${dangerous}`],
        };
      }
    }

    // Check for sudo
    if (normalizedCommand.startsWith('sudo ')) {
      warnings.push('This command uses sudo and will run with elevated privileges');
      riskLevel = 'caution';
    }

    // Check for rm with force
    if (normalizedCommand.includes('rm ') && normalizedCommand.includes(' -rf')) {
      warnings.push('This command will forcefully remove files without confirmation');
      riskLevel = 'caution';
    }

    // Check for redirect to system files
    if (normalizedCommand.includes('> /dev/') || normalizedCommand.includes('> /etc/')) {
      warnings.push('This command writes to system locations');
      riskLevel = 'caution';
    }

    // Check for chmod/chown
    if (normalizedCommand.includes('chmod ') || normalizedCommand.includes('chown ')) {
      warnings.push('This command modifies file permissions');
      if (normalizedCommand.includes('-R')) {
        warnings.push('Recursive permission changes can affect many files');
        riskLevel = 'caution';
      }
    }

    // Check for package installation
    if (
      normalizedCommand.includes('apt install') ||
      normalizedCommand.includes('brew install') ||
      normalizedCommand.includes('npm install') ||
      normalizedCommand.includes('pip install')
    ) {
      warnings.push('This command installs packages');
    }

    // At this point, if we haven't returned 'dangerous', the command is safe
    // The type guard ensures riskLevel is 'safe' | 'caution' here
    return {
      isSafe: riskLevel === 'safe' || riskLevel === 'caution',
      riskLevel,
      warnings,
    };
  }
}

// ============================================================================
// Main Service
// ============================================================================

export class AdvancedTerminalService {
  private storage: TerminalStorageService;
  private aiAgent: AIAgentService | null = null;
  private blockService: CommandBlockService;
  private workflowService: WorkflowService;
  private multiExecService: MultiExecService;
  private triggerService: TriggerService;
  private auditService: AuditService;
  private safetyService: CommandSafetyService;

  constructor(openaiKey?: string) {
    this.storage = new TerminalStorageService();
    if (openaiKey) {
      this.aiAgent = new AIAgentService(openaiKey);
    }
    this.blockService = new CommandBlockService(this.storage);
    this.workflowService = new WorkflowService(this.storage);
    this.multiExecService = new MultiExecService();
    this.triggerService = new TriggerService(this.storage);
    this.auditService = new AuditService(this.storage);
    this.safetyService = new CommandSafetyService();
  }

  async init(): Promise<void> {
    await this.storage.init();
    await this.triggerService.load();
    // Sync with backend
    await this.syncWithBackend();
  }

  // ---------------------------------------------------------------------------
  // Backend Sync Methods
  // ---------------------------------------------------------------------------

  /**
   * Sync local data with backend
   */
  private async syncWithBackend(): Promise<void> {
    try {
      // Fetch backend stats
      const stats = await BackendTerminalAPI.getStats();
      if (stats) {
        log.debug('[Terminal] Backend stats:', stats);
      }

      // Fetch backend config
      const config = await BackendTerminalAPI.getConfig();
      if (config) {
        log.debug('[Terminal] Backend config loaded:', config.default_shell);
      }

      // Fetch active sessions from backend
      const backendSessions = await BackendTerminalAPI.getActiveSessions();
      log.debug('[Terminal] Active backend sessions:', backendSessions.length);
    } catch (error) {
      log.warn('[Terminal] Backend sync failed:', error);
    }
  }

  /**
   * Get all sessions from backend
   */
  async getBackendSessions(): Promise<BackendTerminalSession[]> {
    return BackendTerminalAPI.getAllSessions();
  }

  /**
   * Create a new terminal session and sync with backend
   */
  async createBackendSession(name: string, shell: string, cwd: string): Promise<string> {
    const sessionId = `term_${Date.now()}`;
    const session: BackendTerminalSession = {
      id: sessionId,
      name,
      shell,
      cwd,
      created_at: Date.now(),
      last_activity: Date.now(),
      is_active: true,
    };
    await BackendTerminalAPI.createSession(session);
    return sessionId;
  }

  /**
   * Close session and sync with backend
   */
  async closeBackendSession(sessionId: string): Promise<void> {
    await BackendTerminalAPI.closeSession(sessionId);
  }

  /**
   * Delete session and sync with backend
   */
  async deleteBackendSession(sessionId: string): Promise<void> {
    await BackendTerminalAPI.deleteSession(sessionId);
  }

  /**
   * Update session activity (heartbeat)
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    await BackendTerminalAPI.updateSessionActivity(sessionId);
  }

  /**
   * Save command to backend history
   */
  async saveCommandToBackend(
    sessionId: string,
    command: string,
    output: string,
    exitCode: number,
    durationMs: number
  ): Promise<void> {
    const history: BackendCommandHistory = {
      id: `cmd_${Date.now()}`,
      session_id: sessionId,
      command,
      output,
      exit_code: exitCode,
      executed_at: Date.now(),
      duration_ms: durationMs,
    };
    await BackendTerminalAPI.addCommandHistory(history);
  }

  /**
   * Search command history in backend
   */
  async searchBackendHistory(query: string, limit = 50): Promise<BackendCommandHistory[]> {
    return BackendTerminalAPI.searchHistory(query, limit);
  }

  /**
   * Get session history from backend
   */
  async getBackendSessionHistory(sessionId: string, limit = 100): Promise<BackendCommandHistory[]> {
    return BackendTerminalAPI.getSessionHistory(sessionId, limit);
  }

  /**
   * Clear session history in backend
   */
  async clearBackendSessionHistory(sessionId: string): Promise<void> {
    await BackendTerminalAPI.clearSessionHistory(sessionId);
  }

  /**
   * Get terminal config from backend
   */
  async getBackendConfig(): Promise<BackendTerminalConfig | null> {
    return BackendTerminalAPI.getConfig();
  }

  /**
   * Update terminal config in backend
   */
  async updateBackendConfig(config: BackendTerminalConfig): Promise<void> {
    await BackendTerminalAPI.updateConfig(config);
  }

  /**
   * Get terminal stats from backend
   */
  async getBackendStats(): Promise<BackendTerminalStats | null> {
    return BackendTerminalAPI.getStats();
  }

  // AI features
  async generateCommand(request: string, context: AIAgentContext) {
    if (!this.aiAgent) throw new Error('AI not configured');
    return await this.aiAgent.generateCommand(request, context);
  }

  async analyzeOutput(block: CommandBlock) {
    if (!this.aiAgent) throw new Error('AI not configured');
    return await this.aiAgent.analyzeOutput(block);
  }

  async debugError(error: DetectedError, context: AIAgentContext) {
    if (!this.aiAgent) throw new Error('AI not configured');
    return await this.aiAgent.debugError(error, context);
  }

  async generateScript(description: string, shell: 'bash' | 'zsh' | 'powershell' | 'python', context: AIAgentContext) {
    if (!this.aiAgent) throw new Error('AI not configured');
    return await this.aiAgent.generateScript(description, shell, context);
  }

  // Block service methods
  createBlock(
    sessionId: string,
    command: string,
    prompt: string,
    workingDirectory: string,
    stdout: string,
    stderr: string,
    exitCode: number,
    duration: number
  ) {
    return this.blockService.createBlock(sessionId, command, prompt, workingDirectory, stdout, stderr, exitCode, duration);
  }
  
  saveBlock(block: CommandBlock) {
    return this.blockService.saveBlock(block);
  }
  
  getSessionBlocks(sessionId: string) {
    return this.blockService.getSessionBlocks(sessionId);
  }
  
  searchBlocks(query: string) {
    return this.blockService.searchBlocks(query);
  }
  
  detectErrors(output: string, stderr: string, exitCode: number) {
    return this.blockService.detectErrors(output, stderr, exitCode);
  }

  // Workflow service methods
  createWorkflow(
    name: string,
    description: string,
    category: string,
    commands: WorkflowCommand[],
    parameters: WorkflowParameter[]
  ) {
    return this.workflowService.createWorkflow(name, description, category, commands, parameters);
  }
  
  executeWorkflow(
    workflow: Workflow,
    params: Record<string, unknown>,
    executeCommand: (cmd: string) => Promise<{ exitCode: number; output: string }>
  ) {
    return this.workflowService.executeWorkflow(workflow, params, executeCommand);
  }
  
  getWorkflows() {
    return this.workflowService.getWorkflows();
  }
  
  getWorkflow(id: string) {
    return this.workflowService.getWorkflow(id);
  }
  
  deleteWorkflow(id: string) {
    return this.workflowService.deleteWorkflow(id);
  }

  // Multi-exec service methods
  multiExecute(
    request: MultiExecRequest,
    executeOnTarget: (targetId: string, command: string, signal: AbortSignal) => Promise<MultiExecResult>
  ) {
    return this.multiExecService.execute(request, executeOnTarget);
  }
  
  cancelMultiExec(requestId: string) {
    return this.multiExecService.cancel(requestId);
  }

  // Trigger service methods
  addTrigger(trigger: Omit<Trigger, 'id'>) {
    return this.triggerService.addTrigger(trigger);
  }
  
  getTriggers() {
    return this.triggerService.getTriggers();
  }
  
  deleteTrigger(id: string) {
    return this.triggerService.deleteTrigger(id);
  }
  
  processOutput(output: string) {
    return this.triggerService.processOutput(output);
  }
  
  executeTriggerAction(trigger: Trigger, match: string) {
    return this.triggerService.executeAction(trigger, match);
  }

  // Audit service methods
  startAudit(sessionId: string, userId: string, connectionId: string, metadata: SessionAudit['metadata']) {
    return this.auditService.startAudit(sessionId, userId, connectionId, metadata);
  }
  
  logCommand(command: string, exitCode?: number, duration?: number) {
    return this.auditService.logCommand(command, exitCode, duration);
  }
  
  logFileTransfer(
    direction: 'upload' | 'download',
    localPath: string,
    remotePath: string,
    size: number,
    status: 'success' | 'failed'
  ) {
    return this.auditService.logFileTransfer(direction, localPath, remotePath, size, status);
  }
  
  endAudit() {
    return this.auditService.endAudit();
  }
  
  getAudits(filter?: { sessionId?: string; userId?: string }) {
    return this.auditService.getAudits(filter);
  }

  // Safety service methods
  checkCommandSafety(command: string) {
    return this.safetyService.checkSafety(command);
  }
}

// ============================================================================
// React Hook
// ============================================================================

export function useAdvancedTerminal(openaiKey?: string) {
  const [service, setService] = useState<AdvancedTerminalService | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<AdvancedTerminalService | null>(null);

  useEffect(() => {
    const svc = new AdvancedTerminalService(openaiKey);
    serviceRef.current = svc;

    svc.init()
      .then(async () => {
        setService(svc);
        setWorkflows(await svc.getWorkflows());
        setTriggers(svc.getTriggers());
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [openaiKey]);

  const createWorkflow = useCallback(async (
    name: string,
    description: string,
    category: string,
    commands: WorkflowCommand[],
    parameters: WorkflowParameter[]
  ) => {
    if (!service) return null;
    const workflow = await service.createWorkflow(name, description, category, commands, parameters);
    setWorkflows(await service.getWorkflows());
    return workflow;
  }, [service]);

  const addTrigger = useCallback(async (trigger: Omit<Trigger, 'id'>) => {
    if (!service) return null;
    const newTrigger = await service.addTrigger(trigger);
    setTriggers(service.getTriggers());
    return newTrigger;
  }, [service]);

  return {
    isLoading,
    error,
    workflows,
    triggers,
    
    // AI features
    generateCommand: service?.generateCommand.bind(service),
    analyzeOutput: service?.analyzeOutput.bind(service),
    debugError: service?.debugError.bind(service),
    generateScript: service?.generateScript.bind(service),
    
    // Block features
    createBlock: service?.createBlock.bind(service),
    saveBlock: service?.saveBlock.bind(service),
    getSessionBlocks: service?.getSessionBlocks.bind(service),
    searchBlocks: service?.searchBlocks.bind(service),
    detectErrors: service?.detectErrors.bind(service),
    
    // Workflow features
    createWorkflow,
    executeWorkflow: service?.executeWorkflow.bind(service),
    deleteWorkflow: service?.deleteWorkflow.bind(service),
    
    // Multi-exec
    multiExecute: service?.multiExecute.bind(service),
    cancelMultiExec: service?.cancelMultiExec.bind(service),
    
    // Triggers
    addTrigger,
    deleteTrigger: service?.deleteTrigger.bind(service),
    processOutput: service?.processOutput.bind(service),
    
    // Audit
    startAudit: service?.startAudit.bind(service),
    endAudit: service?.endAudit.bind(service),
    getAudits: service?.getAudits.bind(service),
    
    // Safety
    checkCommandSafety: service?.checkCommandSafety.bind(service),
    
    service,
  };
}

// ============================================================================
// Export
// ============================================================================

export {
  DANGEROUS_COMMANDS,
  ERROR_PATTERNS,
};
