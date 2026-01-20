// Terminal Service - TypeScript wrapper for PTY commands
// Provides real terminal execution with command output

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Types
// ============================================================================

/** PTY Session */
export interface PtySession {
  id: string;
  name: string;
  shell: string;
  working_directory: string;
  cols: number;
  rows: number;
  created_at: number;
  is_active: boolean;
  pid: number | null;
}

/** Command execution request */
export interface CommandRequest {
  session_id: string;
  command: string;
  working_directory?: string;
  environment?: Record<string, string>;
  timeout_secs?: number;
}

/** Command execution result */
export interface CommandResult {
  session_id: string;
  command: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  duration_ms: number;
  working_directory: string;
  executed_at: number;
}

/** PTY Configuration */
export interface PtyConfig {
  default_shell: string;
  default_cols: number;
  default_rows: number;
  scrollback_lines: number;
  enable_bell: boolean;
  cursor_style: string;
  font_family: string;
  font_size: number;
}

/** File entry information */
export interface FileEntry {
  name: string;
  path: string;
  file_type: 'file' | 'directory' | 'symlink';
  size: number;
  modified: number | null;
  permissions: string;
}

/** System information */
export interface SystemInfo {
  os: string;
  arch: string;
  user: string;
  home: string;
  cwd: string;
  shell: string;
  path: string;
}

/** PTY Statistics */
export interface PtyStats {
  total_sessions: number;
  active_sessions: number;
  running_processes: number;
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Create a new PTY session
 * @param name - Optional session name
 * @param workingDirectory - Optional starting directory
 * @returns The created session
 */
export async function createSession(
  name?: string,
  workingDirectory?: string
): Promise<PtySession> {
  return invoke<PtySession>('pty_create_session', {
    name,
    workingDirectory,
  });
}

/**
 * Get a specific PTY session
 * @param sessionId - Session ID
 * @returns The session
 */
export async function getSession(sessionId: string): Promise<PtySession> {
  return invoke<PtySession>('pty_get_session', { sessionId });
}

/**
 * Get all PTY sessions
 * @returns Array of all sessions
 */
export async function getAllSessions(): Promise<PtySession[]> {
  return invoke<PtySession[]>('pty_get_all_sessions');
}

/**
 * Get active PTY sessions
 * @returns Array of active sessions
 */
export async function getActiveSessions(): Promise<PtySession[]> {
  return invoke<PtySession[]>('pty_get_active_sessions');
}

/**
 * Close a PTY session
 * @param sessionId - Session ID to close
 */
export async function closeSession(sessionId: string): Promise<void> {
  return invoke('pty_close_session', { sessionId });
}

/**
 * Delete a PTY session
 * @param sessionId - Session ID to delete
 */
export async function deleteSession(sessionId: string): Promise<void> {
  return invoke('pty_delete_session', { sessionId });
}

// ============================================================================
// Command Execution
// ============================================================================

/**
 * Execute a command synchronously
 * @param request - Command execution request
 * @returns Command result with stdout, stderr, and exit code
 */
export async function executeCommand(request: CommandRequest): Promise<CommandResult> {
  return invoke<CommandResult>('pty_execute_command', { input: request });
}

/**
 * Execute a builtin command (pwd, echo, etc.)
 * @param sessionId - Session ID
 * @param command - Builtin command to execute
 * @returns Command output
 */
export async function executeBuiltin(
  sessionId: string,
  command: string
): Promise<string> {
  return invoke<string>('pty_execute_builtin', { sessionId, command });
}

/**
 * Execute multiple commands in batch
 * @param sessionId - Session ID
 * @param commands - Array of commands to execute
 * @returns Array of command results
 */
export async function executeBatch(
  sessionId: string,
  commands: string[]
): Promise<CommandResult[]> {
  return invoke<CommandResult[]>('pty_execute_batch', { sessionId, commands });
}

/**
 * Start streaming execution (for long-running commands)
 * @param request - Command execution request
 * @returns Session ID for tracking
 */
export async function executeStreaming(request: CommandRequest): Promise<string> {
  return invoke<string>('pty_execute_streaming', { input: request });
}

/**
 * Kill a running process
 * @param sessionId - Session ID
 */
export async function killProcess(sessionId: string): Promise<void> {
  return invoke('pty_kill_process', { sessionId });
}

/**
 * Send input to a running process
 * @param sessionId - Session ID
 * @param input - Input to send
 */
export async function sendInput(sessionId: string, input: string): Promise<void> {
  return invoke('pty_send_input', { sessionId, input });
}

// ============================================================================
// Session Configuration
// ============================================================================

/**
 * Update session working directory
 * @param sessionId - Session ID
 * @param directory - New working directory
 */
export async function updateWorkingDirectory(
  sessionId: string,
  directory: string
): Promise<void> {
  return invoke('pty_update_working_directory', { sessionId, directory });
}

/**
 * Resize PTY dimensions
 * @param sessionId - Session ID
 * @param cols - Number of columns
 * @param rows - Number of rows
 */
export async function resize(
  sessionId: string,
  cols: number,
  rows: number
): Promise<void> {
  return invoke('pty_resize', { sessionId, cols, rows });
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Get PTY configuration
 * @returns PTY configuration
 */
export async function getConfig(): Promise<PtyConfig> {
  return invoke<PtyConfig>('pty_get_config');
}

/**
 * Update PTY configuration
 * @param config - New configuration
 */
export async function updateConfig(config: PtyConfig): Promise<void> {
  return invoke('pty_update_config', { config });
}

// ============================================================================
// System Information
// ============================================================================

/**
 * Get environment variables
 * @returns Map of environment variables
 */
export async function getEnvironment(): Promise<Record<string, string>> {
  return invoke<Record<string, string>>('pty_get_environment');
}

/**
 * Get system information
 * @returns System information
 */
export async function getSystemInfo(): Promise<SystemInfo> {
  return invoke<SystemInfo>('pty_get_system_info');
}

/**
 * Get PTY statistics
 * @returns PTY statistics
 */
export async function getStats(): Promise<PtyStats> {
  return invoke<PtyStats>('pty_get_stats');
}

// ============================================================================
// File System Operations
// ============================================================================

/**
 * List directory contents
 * @param directory - Directory path
 * @returns Array of file entries
 */
export async function listDirectory(directory: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>('pty_list_directory', { directory });
}

/**
 * Read file content
 * @param filePath - File path
 * @param maxBytes - Maximum bytes to read (default 1MB)
 * @returns File content
 */
export async function readFile(
  filePath: string,
  maxBytes?: number
): Promise<string> {
  return invoke<string>('pty_read_file', { filePath, maxBytes });
}

/**
 * Write file content
 * @param filePath - File path
 * @param content - Content to write
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  return invoke('pty_write_file', { filePath, content });
}

/**
 * Create a directory
 * @param directory - Directory path to create
 */
export async function createDirectory(directory: string): Promise<void> {
  return invoke('pty_create_directory', { directory });
}

/**
 * Delete a file or directory
 * @param path - Path to delete
 * @param recursive - Whether to delete recursively (for directories)
 */
export async function deletePath(path: string, recursive = false): Promise<void> {
  return invoke('pty_delete_path', { path, recursive });
}

/**
 * Rename or move a file/directory
 * @param from - Source path
 * @param to - Destination path
 */
export async function renamePath(from: string, to: string): Promise<void> {
  return invoke('pty_rename_path', { from, to });
}

/**
 * Copy a file or directory
 * @param from - Source path
 * @param to - Destination path
 */
export async function copyPath(from: string, to: string): Promise<void> {
  return invoke('pty_copy_path', { from, to });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * Format timestamp for display
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Format duration in milliseconds
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

/**
 * Parse command line into parts (respecting quotes)
 * @param command - Command line string
 * @returns Array of command parts
 */
export function parseCommandLine(command: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  
  for (let i = 0; i < command.length; i++) {
    const char = command[i];
    
    if (!inQuote && (char === '"' || char === "'")) {
      inQuote = true;
      quoteChar = char;
    } else if (inQuote && char === quoteChar) {
      inQuote = false;
      quoteChar = '';
    } else if (!inQuote && char === ' ') {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    parts.push(current);
  }
  
  return parts;
}

/**
 * Check if path is absolute
 * @param path - Path to check
 * @returns True if path is absolute
 */
export function isAbsolutePath(path: string): boolean {
  return path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path);
}

/**
 * Join paths safely
 * @param base - Base path
 * @param relative - Relative path to join
 * @returns Joined path
 */
export function joinPath(base: string, relative: string): string {
  if (isAbsolutePath(relative)) {
    return relative;
  }
  
  // Remove trailing slash from base
  const cleanBase = base.replace(/\/$/, '');
  // Remove leading slash from relative
  const cleanRelative = relative.replace(/^\//, '');
  
  return `${cleanBase}/${cleanRelative}`;
}

/**
 * Get parent directory
 * @param path - Path
 * @returns Parent directory path
 */
export function getParentDirectory(path: string): string {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
}

/**
 * Get file name from path
 * @param path - File path
 * @returns File name
 */
export function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

/**
 * Get file extension
 * @param path - File path
 * @returns File extension (without dot)
 */
export function getFileExtension(path: string): string {
  const name = getFileName(path);
  const lastDot = name.lastIndexOf('.');
  return lastDot > 0 ? name.substring(lastDot + 1) : '';
}

// ============================================================================
// Command History Helper
// ============================================================================

/** Command history entry */
export interface HistoryEntry {
  command: string;
  result: CommandResult;
}

/**
 * Create a command history manager
 * @param maxSize - Maximum number of entries to keep
 * @returns History manager object
 */
export function createHistoryManager(maxSize = 1000) {
  const history: HistoryEntry[] = [];
  let position = -1;
  
  return {
    /**
     * Add entry to history
     */
    add(command: string, result: CommandResult): void {
      history.push({ command, result });
      if (history.length > maxSize) {
        history.shift();
      }
      position = history.length;
    },
    
    /**
     * Get previous command
     */
    previous(): string | null {
      if (position > 0) {
        position--;
        return history[position]?.command || null;
      }
      return null;
    },
    
    /**
     * Get next command
     */
    next(): string | null {
      if (position < history.length - 1) {
        position++;
        return history[position]?.command || null;
      }
      position = history.length;
      return null;
    },
    
    /**
     * Reset position to end
     */
    resetPosition(): void {
      position = history.length;
    },
    
    /**
     * Get all history entries
     */
    getAll(): HistoryEntry[] {
      return [...history];
    },
    
    /**
     * Search history
     */
    search(query: string): HistoryEntry[] {
      return history.filter(e => 
        e.command.toLowerCase().includes(query.toLowerCase())
      );
    },
    
    /**
     * Clear history
     */
    clear(): void {
      history.length = 0;
      position = -1;
    },
  };
}

// ============================================================================
// Tab Completion Helper
// ============================================================================

/**
 * Get tab completion suggestions
 * @param input - Current input
 * @param workingDirectory - Current working directory
 * @returns Array of suggestions
 */
export async function getCompletions(
  input: string,
  workingDirectory: string
): Promise<string[]> {
  const parts = parseCommandLine(input);
  const lastPart = parts[parts.length - 1] || '';
  
  // If it looks like a path, complete files
  if (lastPart.includes('/') || parts.length > 1) {
    const isAbsolute = isAbsolutePath(lastPart);
    let searchDir: string;
    let prefix: string;
    
    if (isAbsolute) {
      searchDir = getParentDirectory(lastPart);
      prefix = getFileName(lastPart);
    } else {
      const combined = joinPath(workingDirectory, lastPart);
      searchDir = getParentDirectory(combined);
      prefix = getFileName(lastPart);
    }
    
    try {
      const entries = await listDirectory(searchDir);
      return entries
        .filter(e => e.name.toLowerCase().startsWith(prefix.toLowerCase()))
        .map(e => {
          const fullPath = isAbsolute 
            ? joinPath(searchDir, e.name)
            : e.name.startsWith(prefix) ? e.name : lastPart.replace(prefix, e.name);
          return e.file_type === 'directory' ? fullPath + '/' : fullPath;
        });
    } catch {
      return [];
    }
  }
  
  // Complete common commands
  const commands = [
    'ls', 'cd', 'pwd', 'cat', 'echo', 'grep', 'find', 'mkdir', 'rm', 'cp', 'mv',
    'touch', 'chmod', 'chown', 'curl', 'wget', 'ssh', 'scp', 'git', 'npm', 'node',
    'python', 'python3', 'pip', 'pip3', 'docker', 'docker-compose', 'kubectl',
    'clear', 'history', 'export', 'env', 'which', 'whereis', 'whoami', 'hostname',
  ];
  
  return commands.filter(c => c.startsWith(lastPart.toLowerCase()));
}
