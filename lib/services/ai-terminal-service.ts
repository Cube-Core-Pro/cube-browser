/**
 * CUBE Elite v6 - AI Terminal Service
 * 
 * Enterprise-grade AI-powered terminal functionality.
 * Competes with: Warp, Wave Terminal, GitHub Copilot CLI
 * 
 * Now integrated with Tauri backend for:
 * - Session management (create, get, close, delete)
 * - Command history (add, search, clear)
 * - Terminal configuration
 * - Usage statistics
 * 
 * Features:
 * - Natural language to shell commands
 * - AI command suggestions based on context
 * - Command explanation and documentation
 * - Error diagnosis and fix suggestions
 * - Command blocks (Warp-style) grouping
 * - Intelligent autocomplete
 * - History-aware suggestions
 * - Multi-platform command translation
 * 
 * @module ai-terminal-service
 * @version 2.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('AITerminal');

// ============================================================================
// Backend Integration Types
// ============================================================================

interface BackendTerminalSession {
  id: string;
  name: string;
  working_directory: string;
  shell: string;
  created_at: number;
  last_used_at: number;
  is_active: boolean;
  environment_vars?: string;
}

interface BackendCommandHistory {
  id: string;
  session_id: string;
  command: string;
  output?: string;
  exit_code: number;
  executed_at: number;
  duration_ms: number;
  working_directory: string;
}

interface BackendTerminalConfig {
  id: string;
  font_family: string;
  font_size: number;
  theme: string;
  cursor_style: string;
  cursor_blink: boolean;
  scrollback_lines: number;
  bell_enabled: boolean;
}

interface BackendTerminalStats {
  total_sessions: number;
  active_sessions: number;
  total_commands: number;
  most_used_commands: Array<{ command: string; count: number }>;
}

// ============================================================================
// Backend API
// ============================================================================

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

  async getSessionHistory(sessionId: string, limit: number = 100): Promise<BackendCommandHistory[]> {
    try {
      return await invoke<BackendCommandHistory[]>('get_terminal_session_history', { sessionId, limit });
    } catch (error) {
      log.warn('Backend getSessionHistory failed:', error);
      return [];
    }
  },

  async searchHistory(query: string, limit: number = 50): Promise<BackendCommandHistory[]> {
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
  },
};

// Export backend API
export { BackendTerminalAPI };
export type { BackendTerminalSession, BackendCommandHistory, BackendTerminalConfig, BackendTerminalStats };

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Shell types supported by the AI
 */
export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd' | 'sh';

/**
 * Operating system types
 */
export type OSType = 'macos' | 'linux' | 'windows';

/**
 * Command suggestion from AI
 */
export interface AICommandSuggestion {
  /** Unique identifier */
  id: string;
  /** The generated shell command */
  command: string;
  /** Human-readable explanation */
  explanation: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Whether the command is potentially dangerous */
  isDangerous: boolean;
  /** Warning message if dangerous */
  dangerWarning?: string;
  /** Alternative commands */
  alternatives: string[];
  /** Command category */
  category: CommandCategory;
  /** Estimated execution time */
  estimatedTime?: string;
  /** Required permissions */
  requiredPermissions?: string[];
}

/**
 * Command categories
 */
export type CommandCategory = 
  | 'file-operations'
  | 'network'
  | 'process-management'
  | 'git'
  | 'docker'
  | 'kubernetes'
  | 'package-management'
  | 'system-info'
  | 'text-processing'
  | 'disk-operations'
  | 'user-management'
  | 'database'
  | 'cloud'
  | 'other';

/**
 * Command block - Warp-style grouping
 */
export interface CommandBlock {
  /** Unique identifier */
  id: string;
  /** The executed command */
  command: string;
  /** Command output */
  output: string;
  /** Exit code */
  exitCode: number;
  /** Execution timestamp */
  timestamp: Date;
  /** Execution duration in ms */
  duration: number;
  /** Working directory */
  workingDirectory: string;
  /** Whether the command succeeded */
  success: boolean;
  /** AI-generated summary of output */
  aiSummary?: string;
  /** Tags for categorization */
  tags: string[];
  /** Whether block is bookmarked */
  isBookmarked: boolean;
  /** Associated AI suggestion if any */
  suggestion?: AICommandSuggestion;
}

/**
 * Error diagnosis result
 */
export interface ErrorDiagnosis {
  /** Original error message */
  errorMessage: string;
  /** Root cause explanation */
  rootCause: string;
  /** Suggested fixes */
  fixes: {
    description: string;
    command?: string;
    confidence: number;
  }[];
  /** Related documentation links */
  documentation: string[];
  /** Similar issues from history */
  similarIssues?: string[];
}

/**
 * Command history entry with AI context
 */
export interface CommandHistoryEntry {
  /** The command */
  command: string;
  /** Number of times executed */
  frequency: number;
  /** Last execution timestamp */
  lastUsed: Date;
  /** Associated directories */
  directories: string[];
  /** Success rate */
  successRate: number;
  /** AI-generated tags */
  tags: string[];
}

/**
 * Terminal context for AI understanding
 */
export interface TerminalContext {
  /** Current working directory */
  workingDirectory: string;
  /** Current shell type */
  shell: ShellType;
  /** Operating system */
  os: OSType;
  /** Environment variables */
  env: Record<string, string>;
  /** Recent commands (last 20) */
  recentCommands: string[];
  /** Git repository status if in repo */
  gitStatus?: {
    branch: string;
    isDirty: boolean;
    hasUntracked: boolean;
  };
  /** Currently running processes */
  runningProcesses?: string[];
  /** User intent/goal if known */
  userIntent?: string;
}

/**
 * AI service configuration
 */
export interface AITerminalConfig {
  /** OpenAI API key */
  apiKey: string;
  /** Model to use */
  model: 'gpt-5.2' | 'gpt-5-mini' | 'gpt-5-nano' | 'gpt-5-pro';
  /** Temperature for generation */
  temperature: number;
  /** Maximum tokens */
  maxTokens: number;
  /** Enable dangerous command warnings */
  enableDangerWarnings: boolean;
  /** Preferred shell */
  preferredShell: ShellType;
  /** OS type */
  osType: OSType;
  /** Enable command explanation */
  enableExplanations: boolean;
  /** Enable autocomplete */
  enableAutocomplete: boolean;
  /** Custom system prompt additions */
  customPrompt?: string;
}

/**
 * Autocomplete suggestion
 */
export interface AutocompleteSuggestion {
  /** Completion text */
  text: string;
  /** Type of completion */
  type: 'command' | 'flag' | 'path' | 'variable' | 'history';
  /** Description */
  description?: string;
  /** Icon/emoji */
  icon?: string;
  /** Insert position */
  insertAt: number;
}

/**
 * Workflow template (Warp Drive-style)
 */
export interface WorkflowTemplate {
  /** Unique identifier */
  id: string;
  /** Template name */
  name: string;
  /** Description */
  description: string;
  /** Commands in sequence */
  commands: string[];
  /** Variables to fill */
  variables: {
    name: string;
    description: string;
    defaultValue?: string;
    required: boolean;
  }[];
  /** Tags */
  tags: string[];
  /** Created by */
  author: string;
  /** Is shared publicly */
  isPublic: boolean;
  /** Usage count */
  usageCount: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AITerminalConfig = {
  apiKey: '',
  model: 'gpt-5.2',
  temperature: 0.3,
  maxTokens: 1000,
  enableDangerWarnings: true,
  preferredShell: 'zsh',
  osType: 'macos',
  enableExplanations: true,
  enableAutocomplete: true,
};

/**
 * Dangerous command patterns
 */
const DANGEROUS_PATTERNS = [
  /rm\s+(-rf?|--recursive)\s+[\/~]/i,
  /rm\s+-rf?\s+\*/i,
  />\s*\/dev\/sda/i,
  /mkfs\./i,
  /dd\s+if=.*of=\/dev/i,
  /:.*:\(\)\s*{\s*:.*\|\s*:.*&\s*}/i, // Fork bomb
  /chmod\s+-R\s+777\s+\//i,
  /chmod\s+777\s+\//i,
  /curl.*\|\s*(bash|sh)/i,
  /wget.*-O-\s*\|\s*(bash|sh)/i,
  /sudo\s+rm\s+-rf\s+--no-preserve-root/i,
  /:(){ :|:& };:/,
  />\s*\/etc\/passwd/i,
  />\s*\/etc\/shadow/i,
];

/**
 * Command category patterns
 */
const CATEGORY_PATTERNS: Record<CommandCategory, RegExp[]> = {
  'file-operations': [/^(ls|cd|cp|mv|rm|mkdir|touch|cat|head|tail|less|more|find|locate)/],
  'network': [/^(curl|wget|ping|netstat|ss|ifconfig|ip|nmap|traceroute|dig|nslookup)/],
  'process-management': [/^(ps|top|htop|kill|pkill|pgrep|bg|fg|jobs|nohup)/],
  'git': [/^git\s/],
  'docker': [/^docker\s|^docker-compose/],
  'kubernetes': [/^kubectl|^k9s|^helm/],
  'package-management': [/^(npm|yarn|pnpm|pip|brew|apt|yum|dnf|pacman)/],
  'system-info': [/^(uname|whoami|hostname|uptime|df|du|free|lscpu)/],
  'text-processing': [/^(grep|sed|awk|cut|sort|uniq|wc|tr|xargs)/],
  'disk-operations': [/^(fdisk|parted|mount|umount|lsblk|blkid)/],
  'user-management': [/^(useradd|userdel|usermod|passwd|chown|chmod|groups)/],
  'database': [/^(mysql|psql|mongo|redis-cli|sqlite3)/],
  'cloud': [/^(aws|gcloud|az|terraform|pulumi)/],
  'other': [],
};

/**
 * System prompt for AI
 */
const SYSTEM_PROMPT = `You are an expert shell command assistant integrated into CUBE Elite terminal.
Your role is to help users with shell commands by:
1. Converting natural language requests into shell commands
2. Explaining what commands do
3. Diagnosing errors and suggesting fixes
4. Providing safer alternatives for dangerous commands

Guidelines:
- Always provide the most efficient command for the task
- Warn about potentially destructive commands
- Consider the user's shell type and OS
- Use modern, widely-supported command options
- Provide explanations that are concise but complete
- When suggesting fixes, explain why they work

Response format for command generation:
{
  "command": "the shell command",
  "explanation": "what it does",
  "confidence": 0.95,
  "isDangerous": false,
  "alternatives": ["alt1", "alt2"],
  "category": "category-name"
}`;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique ID
 */
function generateId(): string {
  return `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if command is potentially dangerous
 */
function isDangerousCommand(command: string): { isDangerous: boolean; warning?: string } {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return {
        isDangerous: true,
        warning: getDangerWarning(command, pattern),
      };
    }
  }
  return { isDangerous: false };
}

/**
 * Get danger warning message
 */
function getDangerWarning(command: string, pattern: RegExp): string {
  if (/rm\s+(-rf?|--recursive)/.test(command)) {
    return '⚠️ This command will recursively delete files/directories. This action cannot be undone.';
  }
  if (/chmod\s+(-R\s+)?777/.test(command)) {
    return '⚠️ Setting permissions to 777 makes files world-writable, which is a security risk.';
  }
  if (/curl.*\|\s*(bash|sh)/.test(command)) {
    return '⚠️ Piping remote scripts directly to shell can execute malicious code. Consider downloading and inspecting first.';
  }
  if (/dd\s+if=.*of=\/dev/.test(command)) {
    return '⚠️ dd writing to device can overwrite your disk. Double-check the target device.';
  }
  if (/mkfs\./.test(command)) {
    return '⚠️ mkfs will format the specified partition, erasing all data.';
  }
  return `⚠️ This command matches a dangerous pattern: ${pattern.source}`;
}

/**
 * Categorize a command
 */
function categorizeCommand(command: string): CommandCategory {
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(command)) {
        return category as CommandCategory;
      }
    }
  }
  return 'other';
}

/**
 * Parse AI response to command suggestion
 */
function parseAIResponse(response: string): AICommandSuggestion | null {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // If no JSON, try to extract command from code block
      const codeMatch = response.match(/```(?:bash|sh|shell)?\n?([\s\S]*?)```/);
      if (codeMatch) {
        return {
          id: generateId(),
          command: codeMatch[1].trim(),
          explanation: response.replace(codeMatch[0], '').trim(),
          confidence: 0.7,
          isDangerous: false,
          alternatives: [],
          category: 'other',
        };
      }
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const dangerCheck = isDangerousCommand(parsed.command);

    return {
      id: generateId(),
      command: parsed.command,
      explanation: parsed.explanation || '',
      confidence: parsed.confidence || 0.8,
      isDangerous: dangerCheck.isDangerous || parsed.isDangerous || false,
      dangerWarning: dangerCheck.warning || parsed.dangerWarning,
      alternatives: parsed.alternatives || [],
      category: parsed.category || categorizeCommand(parsed.command),
    };
  } catch (error) {
    log.error('Failed to parse AI response:', error);
    return null;
  }
}

/**
 * Get context string for AI
 */
function buildContextString(context: TerminalContext): string {
  let contextStr = `Current context:
- Shell: ${context.shell}
- OS: ${context.os}
- Working directory: ${context.workingDirectory}`;

  if (context.gitStatus) {
    contextStr += `\n- Git branch: ${context.gitStatus.branch} (${context.gitStatus.isDirty ? 'dirty' : 'clean'})`;
  }

  if (context.recentCommands.length > 0) {
    contextStr += `\n- Recent commands: ${context.recentCommands.slice(-5).join(', ')}`;
  }

  return contextStr;
}

// ============================================================================
// AI Terminal Service Class
// ============================================================================

/**
 * AI-powered terminal service
 */
export class AITerminalService {
  private config: AITerminalConfig;
  private context: TerminalContext;
  private commandHistory: CommandHistoryEntry[] = [];
  private commandBlocks: CommandBlock[] = [];
  private workflows: WorkflowTemplate[] = [];

  constructor(config: Partial<AITerminalConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.context = {
      workingDirectory: '~',
      shell: this.config.preferredShell,
      os: this.config.osType,
      env: {},
      recentCommands: [],
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AITerminalConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Update terminal context
   */
  updateContext(context: Partial<TerminalContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Generate command from natural language
   */
  async generateCommand(naturalLanguage: string): Promise<AICommandSuggestion> {
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }

    const contextStr = buildContextString(this.context);
    
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `${contextStr}\n\nUser request: ${naturalLanguage}` },
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from AI');
      }

      const suggestion = parseAIResponse(content);
      if (!suggestion) {
        throw new Error('Failed to parse AI response');
      }

      // Check for dangerous commands
      if (this.config.enableDangerWarnings) {
        const dangerCheck = isDangerousCommand(suggestion.command);
        if (dangerCheck.isDangerous) {
          suggestion.isDangerous = true;
          suggestion.dangerWarning = dangerCheck.warning;
        }
      }

      return suggestion;
    } catch (error) {
      log.error('AI command generation failed:', error);
      throw error;
    }
  }

  /**
   * Explain a command
   */
  async explainCommand(command: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }

    const messages = [
      { 
        role: 'system', 
        content: 'You are a shell command expert. Explain commands in a clear, educational way. Break down each part of the command and explain what it does.' 
      },
      { 
        role: 'user', 
        content: `Explain this command in detail: ${command}` 
      },
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Unable to explain command';
    } catch (error) {
      log.error('Command explanation failed:', error);
      throw error;
    }
  }

  /**
   * Diagnose an error and suggest fixes
   */
  async diagnoseError(command: string, errorOutput: string): Promise<ErrorDiagnosis> {
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }

    const contextStr = buildContextString(this.context);
    
    const messages = [
      { 
        role: 'system', 
        content: `You are a shell error diagnosis expert. Analyze errors and provide actionable fixes.
        
Response format (JSON):
{
  "rootCause": "explanation of what went wrong",
  "fixes": [
    {"description": "fix description", "command": "optional fix command", "confidence": 0.9}
  ],
  "documentation": ["relevant doc links"]
}` 
      },
      { 
        role: 'user', 
        content: `${contextStr}\n\nCommand: ${command}\nError: ${errorOutput}` 
      },
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            errorMessage: errorOutput,
            rootCause: parsed.rootCause || 'Unknown cause',
            fixes: parsed.fixes || [],
            documentation: parsed.documentation || [],
          };
        }
      } catch {
        // If JSON parsing fails, return basic diagnosis
      }

      return {
        errorMessage: errorOutput,
        rootCause: content,
        fixes: [],
        documentation: [],
      };
    } catch (error) {
      log.error('Error diagnosis failed:', error);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocomplete(partialCommand: string, cursorPosition: number): Promise<AutocompleteSuggestion[]> {
    const suggestions: AutocompleteSuggestion[] = [];

    // Get last word being typed
    const beforeCursor = partialCommand.slice(0, cursorPosition);
    const lastWord = beforeCursor.split(/\s+/).pop() || '';

    // History-based suggestions
    const historyMatches = this.commandHistory
      .filter((h) => h.command.startsWith(partialCommand))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);

    for (const match of historyMatches) {
      suggestions.push({
        text: match.command,
        type: 'history',
        description: `Used ${match.frequency} times`,
        icon: '📜',
        insertAt: 0,
      });
    }

    // Flag suggestions for common commands
    const flagSuggestions = this.getFlagSuggestions(partialCommand, lastWord);
    suggestions.push(...flagSuggestions);

    // If AI autocomplete is enabled and we have partial input
    if (this.config.enableAutocomplete && this.config.apiKey && partialCommand.length > 2) {
      try {
        const aiSuggestions = await this.getAIAutocomplete(partialCommand);
        suggestions.push(...aiSuggestions);
      } catch (error) {
        log.error('AI autocomplete failed:', error);
      }
    }

    return suggestions.slice(0, 10);
  }

  /**
   * Get flag suggestions for common commands
   */
  private getFlagSuggestions(command: string, lastWord: string): AutocompleteSuggestion[] {
    const suggestions: AutocompleteSuggestion[] = [];

    // Only suggest flags if last word starts with -
    if (!lastWord.startsWith('-')) return suggestions;

    const commonFlags: Record<string, { flag: string; desc: string }[]> = {
      'ls': [
        { flag: '-la', desc: 'Long format with hidden files' },
        { flag: '-lh', desc: 'Human-readable sizes' },
        { flag: '-R', desc: 'Recursive listing' },
      ],
      'grep': [
        { flag: '-i', desc: 'Case insensitive' },
        { flag: '-r', desc: 'Recursive' },
        { flag: '-n', desc: 'Show line numbers' },
        { flag: '-v', desc: 'Invert match' },
      ],
      'find': [
        { flag: '-name', desc: 'Search by name' },
        { flag: '-type f', desc: 'Files only' },
        { flag: '-type d', desc: 'Directories only' },
        { flag: '-exec', desc: 'Execute command' },
      ],
      'git': [
        { flag: '--all', desc: 'All branches/remotes' },
        { flag: '--verbose', desc: 'Verbose output' },
        { flag: '--force', desc: 'Force operation' },
      ],
      'docker': [
        { flag: '-it', desc: 'Interactive terminal' },
        { flag: '--rm', desc: 'Remove after exit' },
        { flag: '-d', desc: 'Detached mode' },
      ],
    };

    // Find the base command
    const baseCommand = command.split(/\s+/)[0];
    const flags = commonFlags[baseCommand] || [];

    for (const { flag, desc } of flags) {
      if (flag.startsWith(lastWord)) {
        suggestions.push({
          text: flag,
          type: 'flag',
          description: desc,
          icon: '🚩',
          insertAt: command.lastIndexOf(lastWord),
        });
      }
    }

    return suggestions;
  }

  /**
   * Get AI-powered autocomplete
   */
  private async getAIAutocomplete(partialCommand: string): Promise<AutocompleteSuggestion[]> {
    const messages = [
      { 
        role: 'system', 
        content: 'Complete this shell command. Return only the completed command, nothing else.' 
      },
      { role: 'user', content: partialCommand },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-mini', // Use faster model for autocomplete
        messages,
        temperature: 0.2,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const completion = data.choices[0]?.message?.content?.trim();

    if (completion && completion !== partialCommand) {
      return [{
        text: completion,
        type: 'command',
        description: 'AI suggestion',
        icon: '✨',
        insertAt: 0,
      }];
    }

    return [];
  }

  /**
   * Create a command block from execution
   * Also syncs with Tauri backend for persistence
   */
  createCommandBlock(
    command: string,
    output: string,
    exitCode: number,
    duration: number,
    suggestion?: AICommandSuggestion
  ): CommandBlock {
    const blockId = generateId();
    const block: CommandBlock = {
      id: blockId,
      command,
      output,
      exitCode,
      timestamp: new Date(),
      duration,
      workingDirectory: this.context.workingDirectory,
      success: exitCode === 0,
      tags: [categorizeCommand(command)],
      isBookmarked: false,
      suggestion,
    };

    this.commandBlocks.push(block);
    this.updateCommandHistory(command, exitCode === 0);

    // Sync with backend
    this.syncCommandToBackend(block);

    return block;
  }

  /**
   * Sync command to Tauri backend
   */
  private async syncCommandToBackend(block: CommandBlock): Promise<void> {
    try {
      const backendHistory: BackendCommandHistory = {
        id: block.id,
        session_id: 'default', // Could be dynamic in future
        command: block.command,
        output: block.output,
        exit_code: block.exitCode,
        executed_at: block.timestamp.getTime(),
        duration_ms: block.duration,
        working_directory: block.workingDirectory,
      };
      await BackendTerminalAPI.addCommandHistory(backendHistory);
    } catch (error) {
      // Non-blocking - just log the error
      log.warn('Failed to sync command to backend:', error);
    }
  }

  /**
   * Load command history from backend
   */
  async loadHistoryFromBackend(sessionId: string = 'default', limit: number = 100): Promise<CommandBlock[]> {
    try {
      const history = await BackendTerminalAPI.getSessionHistory(sessionId, limit);
      return history.map(h => ({
        id: h.id,
        command: h.command,
        output: h.output || '',
        exitCode: h.exit_code,
        timestamp: new Date(h.executed_at),
        duration: h.duration_ms,
        workingDirectory: h.working_directory,
        success: h.exit_code === 0,
        tags: [categorizeCommand(h.command)],
        isBookmarked: false,
      }));
    } catch (error) {
      log.warn('Failed to load history from backend:', error);
      return [];
    }
  }

  /**
   * Search command history using backend
   */
  async searchHistoryBackend(query: string, limit: number = 50): Promise<CommandBlock[]> {
    try {
      const history = await BackendTerminalAPI.searchHistory(query, limit);
      return history.map(h => ({
        id: h.id,
        command: h.command,
        output: h.output || '',
        exitCode: h.exit_code,
        timestamp: new Date(h.executed_at),
        duration: h.duration_ms,
        workingDirectory: h.working_directory,
        success: h.exit_code === 0,
        tags: [categorizeCommand(h.command)],
        isBookmarked: false,
      }));
    } catch (error) {
      log.warn('Failed to search history from backend:', error);
      return [];
    }
  }

  /**
   * Summarize command output using AI
   */
  async summarizeOutput(block: CommandBlock): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }

    if (block.output.length < 100) {
      return block.output;
    }

    const messages = [
      { 
        role: 'system', 
        content: 'Summarize this command output in 1-2 sentences. Be concise but include key information.' 
      },
      { 
        role: 'user', 
        content: `Command: ${block.command}\nOutput:\n${block.output.slice(0, 2000)}` 
      },
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          messages,
          temperature: 0.3,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.choices[0]?.message?.content || '';
      
      block.aiSummary = summary;
      return summary;
    } catch (error) {
      log.error('Output summary failed:', error);
      return '';
    }
  }

  /**
   * Translate command between OSes/shells
   */
  async translateCommand(
    command: string, 
    fromOS: OSType, 
    toOS: OSType
  ): Promise<AICommandSuggestion> {
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }

    const messages = [
      { 
        role: 'system', 
        content: `You are a cross-platform shell expert. Translate commands between operating systems.
        
Response format (JSON):
{
  "command": "translated command",
  "explanation": "what changed and why",
  "confidence": 0.9
}` 
      },
      { 
        role: 'user', 
        content: `Translate this command from ${fromOS} to ${toOS}: ${command}` 
      },
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: 0.3,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      const parsed = parseAIResponse(content);

      if (!parsed) {
        throw new Error('Failed to parse translation');
      }

      return parsed;
    } catch (error) {
      log.error('Command translation failed:', error);
      throw error;
    }
  }

  /**
   * Update command history
   */
  private updateCommandHistory(command: string, success: boolean): void {
    const existing = this.commandHistory.find((h) => h.command === command);
    
    if (existing) {
      existing.frequency++;
      existing.lastUsed = new Date();
      existing.successRate = (existing.successRate * (existing.frequency - 1) + (success ? 1 : 0)) / existing.frequency;
      
      if (!existing.directories.includes(this.context.workingDirectory)) {
        existing.directories.push(this.context.workingDirectory);
      }
    } else {
      this.commandHistory.push({
        command,
        frequency: 1,
        lastUsed: new Date(),
        directories: [this.context.workingDirectory],
        successRate: success ? 1 : 0,
        tags: [categorizeCommand(command)],
      });
    }

    // Keep only last 1000 entries
    if (this.commandHistory.length > 1000) {
      this.commandHistory = this.commandHistory
        .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
        .slice(0, 1000);
    }

    // Update recent commands in context
    this.context.recentCommands.push(command);
    if (this.context.recentCommands.length > 20) {
      this.context.recentCommands.shift();
    }
  }

  /**
   * Get command blocks
   */
  getCommandBlocks(): CommandBlock[] {
    return this.commandBlocks;
  }

  /**
   * Get command history
   */
  getCommandHistory(): CommandHistoryEntry[] {
    return this.commandHistory;
  }

  /**
   * Toggle block bookmark
   */
  toggleBookmark(blockId: string): void {
    const block = this.commandBlocks.find((b) => b.id === blockId);
    if (block) {
      block.isBookmarked = !block.isBookmarked;
    }
  }

  /**
   * Search command blocks
   */
  searchBlocks(query: string): CommandBlock[] {
    const lowerQuery = query.toLowerCase();
    return this.commandBlocks.filter((b) => 
      b.command.toLowerCase().includes(lowerQuery) ||
      b.output.toLowerCase().includes(lowerQuery) ||
      b.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Export blocks to clipboard format
   */
  exportBlocks(blockIds: string[]): string {
    const blocks = this.commandBlocks.filter((b) => blockIds.includes(b.id));
    return blocks.map((b) => `$ ${b.command}\n${b.output}`).join('\n\n');
  }

  // ============================================================================
  // Workflow Templates
  // ============================================================================

  /**
   * Save a workflow template
   */
  saveWorkflow(workflow: Omit<WorkflowTemplate, 'id' | 'usageCount'>): WorkflowTemplate {
    const template: WorkflowTemplate = {
      ...workflow,
      id: generateId(),
      usageCount: 0,
    };
    this.workflows.push(template);
    return template;
  }

  /**
   * Get all workflows
   */
  getWorkflows(): WorkflowTemplate[] {
    return this.workflows;
  }

  /**
   * Execute workflow with variables
   */
  async executeWorkflow(
    workflowId: string, 
    variables: Record<string, string>
  ): Promise<string[]> {
    const workflow = this.workflows.find((w) => w.id === workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Replace variables in commands
    const commands = workflow.commands.map((cmd) => {
      let result = cmd;
      for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
        result = result.replace(new RegExp(`\\$${key}`, 'g'), value);
      }
      return result;
    });

    workflow.usageCount++;
    return commands;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.commandBlocks = [];
    this.commandHistory = [];
    this.context.recentCommands = [];
  }
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for AI terminal functionality
 */
export function useAITerminal(config: Partial<AITerminalConfig> = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [suggestion, setSuggestion] = useState<AICommandSuggestion | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<ErrorDiagnosis | null>(null);
  const [autocomplete, setAutocomplete] = useState<AutocompleteSuggestion[]>([]);
  const [commandBlocks, setCommandBlocks] = useState<CommandBlock[]>([]);
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<AITerminalService | null>(null);
  const autocompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize service
  useEffect(() => {
    serviceRef.current = new AITerminalService(config);
    return () => {
      serviceRef.current = null;
    };
  }, [config]);

  /**
   * Generate command from natural language
   */
  const generateCommand = useCallback(async (naturalLanguage: string) => {
    if (!serviceRef.current) return null;
    
    setIsGenerating(true);
    setError(null);
    setSuggestion(null);

    try {
      const result = await serviceRef.current.generateCommand(naturalLanguage);
      setSuggestion(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate command';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Explain a command
   */
  const explainCommand = useCallback(async (command: string) => {
    if (!serviceRef.current) return null;
    
    setIsGenerating(true);
    setError(null);
    setExplanation(null);

    try {
      const result = await serviceRef.current.explainCommand(command);
      setExplanation(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to explain command';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Diagnose an error
   */
  const diagnoseError = useCallback(async (command: string, errorOutput: string) => {
    if (!serviceRef.current) return null;
    
    setIsDiagnosing(true);
    setError(null);
    setDiagnosis(null);

    try {
      const result = await serviceRef.current.diagnoseError(command, errorOutput);
      setDiagnosis(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to diagnose error';
      setError(message);
      return null;
    } finally {
      setIsDiagnosing(false);
    }
  }, []);

  /**
   * Get autocomplete suggestions (debounced)
   */
  const getAutocomplete = useCallback((partialCommand: string, cursorPosition: number) => {
    if (!serviceRef.current) return;

    // Clear previous timeout
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current);
    }

    // Debounce autocomplete requests
    autocompleteTimeoutRef.current = setTimeout(async () => {
      try {
        const suggestions = await serviceRef.current!.getAutocomplete(
          partialCommand, 
          cursorPosition
        );
        setAutocomplete(suggestions);
      } catch (err) {
        log.error('Autocomplete failed:', err);
      }
    }, 200);
  }, []);

  /**
   * Record command execution
   */
  const recordExecution = useCallback((
    command: string,
    output: string,
    exitCode: number,
    duration: number
  ) => {
    if (!serviceRef.current) return null;

    const block = serviceRef.current.createCommandBlock(
      command,
      output,
      exitCode,
      duration,
      suggestion || undefined
    );

    setCommandBlocks(serviceRef.current.getCommandBlocks());
    return block;
  }, [suggestion]);

  /**
   * Update context
   */
  const updateContext = useCallback((context: Partial<TerminalContext>) => {
    serviceRef.current?.updateContext(context);
  }, []);

  /**
   * Translate command
   */
  const translateCommand = useCallback(async (
    command: string,
    fromOS: OSType,
    toOS: OSType
  ) => {
    if (!serviceRef.current) return null;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await serviceRef.current.translateCommand(command, fromOS, toOS);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to translate command';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Clear suggestion
   */
  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
    setExplanation(null);
    setDiagnosis(null);
    setError(null);
  }, []);

  return {
    // State
    isGenerating,
    isDiagnosing,
    suggestion,
    explanation,
    diagnosis,
    autocomplete,
    commandBlocks,
    error,

    // Actions
    generateCommand,
    explainCommand,
    diagnoseError,
    getAutocomplete,
    recordExecution,
    updateContext,
    translateCommand,
    clearSuggestion,

    // Service access
    service: serviceRef.current,
  };
}

// ============================================================================
// Export
// ============================================================================

export {
  isDangerousCommand,
  categorizeCommand,
  DEFAULT_CONFIG as DEFAULT_AI_TERMINAL_CONFIG,
};
