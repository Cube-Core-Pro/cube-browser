/**
 * SSH Service - Enterprise SSH terminal and automation
 * 
 * Provides complete SSH functionality including:
 * - Connection configuration and management
 * - Remote command execution
 * - SSH key generation and management
 * - Port forwarding
 * - Command history tracking
 * 
 * @module sshService
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('sshService');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * SSH connection configuration
 */
export interface SSHConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key';
  password?: string;
  privateKeyPath?: string;
  passphrase?: string;
  lastConnected?: number; // Unix timestamp
}

/**
 * Active SSH session
 */
export interface SSHSession {
  id: string;
  configId: string;
  host: string;
  username: string;
  connectedAt: number; // Unix timestamp
  lastActivity: number; // Unix timestamp
  commandsExecuted: number;
}

/**
 * SSH command result
 */
export interface SSHCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number; // milliseconds
}

/**
 * SSH key pair
 */
export interface SSHKey {
  id: string;
  name: string;
  type: 'RSA' | 'ED25519' | 'ECDSA';
  publicKeyPath: string;
  privateKeyPath: string;
  fingerprint: string;
  createdAt: number; // Unix timestamp
  hasPassphrase: boolean;
}

/**
 * Command history entry
 */
export interface SSHCommandHistory {
  sessionId: string;
  command: string;
  timestamp: number; // Unix timestamp
  exitCode: number;
  duration: number; // milliseconds
}

/**
 * Port forward configuration
 */
export interface SSHPortForward {
  id: string;
  sessionId: string;
  localPort: number;
  remoteHost: string;
  remotePort: number;
  active: boolean;
}

// ============================================================================
// SSH SERVICE API
// ============================================================================

/**
 * Create new SSH connection configuration
 * 
 * @param config - SSH configuration object
 * @returns Promise resolving to created config with ID
 * @throws Error if config creation fails
 * 
 * @example
 * ```typescript
 * const config = await sshService.createConfig({
 *   name: 'Production Server',
 *   host: 'server.example.com',
 *   port: 22,
 *   username: 'admin',
 *   authMethod: 'key',
 *   privateKeyPath: '/Users/me/.ssh/id_rsa'
 * });
 * ```
 */
export async function createConfig(config: Omit<SSHConfig, 'id'>): Promise<SSHConfig> {
  log.debug(`Creating SSH config: ${config.name} (${config.username}@${config.host}:${config.port})`);
  try {
    const result = await invoke<SSHConfig>('create_ssh_config', { config });
    log.info(`SSH config created: ${result.id}`);
    return result;
  } catch (error) {
    log.error(`Failed to create SSH config: ${error}`);
    throw new Error(`Failed to create SSH config: ${error}`);
  }
}

/**
 * Get all SSH configurations
 * 
 * @returns Promise resolving to array of SSH configs
 * @throws Error if retrieval fails
 * 
 * @example
 * ```typescript
 * const configs = await sshService.getConfigs();
 * configs.forEach(config => {
 *   log.debug(`${config.name}: ${config.username}@${config.host}`);
 * });
 * ```
 */
export async function getConfigs(): Promise<SSHConfig[]> {
  log.debug('Fetching all SSH configs');
  try {
    const configs = await invoke<SSHConfig[]>('get_ssh_configs');
    log.debug(`Retrieved ${configs.length} SSH configs`);
    return configs;
  } catch (error) {
    log.error(`Failed to get SSH configs: ${error}`);
    throw new Error(`Failed to get SSH configs: ${error}`);
  }
}

/**
 * Delete SSH configuration
 * 
 * @param configId - ID of config to delete
 * @returns Promise resolving when deletion completes
 * @throws Error if deletion fails
 * 
 * @example
 * ```typescript
 * await sshService.deleteConfig('config-123');
 * ```
 */
export async function deleteConfig(configId: string): Promise<void> {
  try {
    await invoke<void>('delete_ssh_config', { configId });
  } catch (error) {
    throw new Error(`Failed to delete SSH config: ${error}`);
  }
}

/**
 * Connect to SSH server
 * 
 * @param configId - ID of SSH configuration to use
 * @returns Promise resolving to session ID
 * @throws Error if connection fails
 * 
 * @example
 * ```typescript
 * const sessionId = await sshService.connect('config-123');
 * log.debug(`Connected: ${sessionId}`);
 * ```
 */
export async function connect(configId: string): Promise<string> {
  try {
    return await invoke<string>('connect_ssh', { configId });
  } catch (error) {
    throw new Error(`Failed to connect SSH: ${error}`);
  }
}

/**
 * Execute command on remote server
 * 
 * @param sessionId - ID of SSH session
 * @param command - Command to execute
 * @returns Promise resolving to command result
 * @throws Error if execution fails
 * 
 * @example
 * ```typescript
 * const result = await sshService.executeCommand(
 *   'session-456',
 *   'ls -la /var/www'
 * );
 * log.debug(result.stdout);
 * if (result.exitCode !== 0) {
 *   log.error(result.stderr);
 * }
 * ```
 */
export async function executeCommand(
  sessionId: string,
  command: string
): Promise<SSHCommandResult> {
  try {
    return await invoke<SSHCommandResult>('execute_ssh_command', { sessionId, command });
  } catch (error) {
    throw new Error(`Failed to execute SSH command: ${error}`);
  }
}

/**
 * Disconnect SSH session
 * 
 * @param sessionId - ID of session to disconnect
 * @returns Promise resolving when disconnection completes
 * @throws Error if disconnection fails
 * 
 * @example
 * ```typescript
 * await sshService.disconnect('session-456');
 * log.debug('Disconnected');
 * ```
 */
export async function disconnect(sessionId: string): Promise<void> {
  try {
    await invoke<void>('disconnect_ssh', { sessionId });
  } catch (error) {
    throw new Error(`Failed to disconnect SSH: ${error}`);
  }
}

/**
 * Get all active SSH sessions
 * 
 * @returns Promise resolving to array of active sessions
 * @throws Error if retrieval fails
 * 
 * @example
 * ```typescript
 * const sessions = await sshService.getActiveSessions();
 * sessions.forEach(session => {
 *   const uptime = Date.now() - session.connectedAt;
 *   log.debug(`${session.host}: ${Math.floor(uptime / 1000)}s uptime`);
 * });
 * ```
 */
export async function getActiveSessions(): Promise<SSHSession[]> {
  try {
    return await invoke<SSHSession[]>('get_active_ssh_sessions');
  } catch (error) {
    throw new Error(`Failed to get active SSH sessions: ${error}`);
  }
}

/**
 * Generate new SSH key pair
 * 
 * @param name - Name for the key pair
 * @param type - Key type (RSA, ED25519, ECDSA)
 * @param passphrase - Optional passphrase for private key
 * @returns Promise resolving to generated key info
 * @throws Error if generation fails
 * 
 * @example
 * ```typescript
 * const key = await sshService.generateKey(
 *   'my-server-key',
 *   'ED25519',
 *   'optional-passphrase'
 * );
 * log.debug(`Public key: ${key.publicKeyPath}`);
 * log.debug(`Fingerprint: ${key.fingerprint}`);
 * ```
 */
export async function generateKey(
  name: string,
  type: 'RSA' | 'ED25519' | 'ECDSA' = 'ED25519',
  passphrase?: string
): Promise<SSHKey> {
  try {
    return await invoke<SSHKey>('generate_ssh_key', { name, keyType: type, passphrase });
  } catch (error) {
    throw new Error(`Failed to generate SSH key: ${error}`);
  }
}

/**
 * Get all SSH keys
 * 
 * @returns Promise resolving to array of SSH keys
 * @throws Error if retrieval fails
 * 
 * @example
 * ```typescript
 * const keys = await sshService.getKeys();
 * keys.forEach(key => {
 *   log.debug(`${key.name} (${key.type}): ${key.fingerprint}`);
 * });
 * ```
 */
export async function getKeys(): Promise<SSHKey[]> {
  try {
    return await invoke<SSHKey[]>('get_ssh_keys');
  } catch (error) {
    throw new Error(`Failed to get SSH keys: ${error}`);
  }
}

/**
 * Delete SSH key pair
 * 
 * @param keyId - ID of key to delete
 * @returns Promise resolving when deletion completes
 * @throws Error if deletion fails
 * 
 * @example
 * ```typescript
 * await sshService.deleteKey('key-789');
 * ```
 */
export async function deleteKey(keyId: string): Promise<void> {
  try {
    await invoke<void>('delete_ssh_key', { keyId });
  } catch (error) {
    throw new Error(`Failed to delete SSH key: ${error}`);
  }
}

/**
 * Get command history
 * 
 * @param sessionId - Optional session ID to filter by
 * @returns Promise resolving to array of command history
 * @throws Error if retrieval fails
 * 
 * @example
 * ```typescript
 * const history = await sshService.getCommandHistory('session-456');
 * history.forEach(entry => {
 *   log.debug(`${entry.command} -> exit ${entry.exitCode}`);
 * });
 * ```
 */
export async function getCommandHistory(sessionId?: string): Promise<SSHCommandHistory[]> {
  try {
    return await invoke<SSHCommandHistory[]>('get_ssh_command_history', { sessionId });
  } catch (error) {
    throw new Error(`Failed to get command history: ${error}`);
  }
}

/**
 * Clear command history
 * 
 * @returns Promise resolving when history is cleared
 * @throws Error if clearing fails
 * 
 * @example
 * ```typescript
 * await sshService.clearCommandHistory();
 * ```
 */
export async function clearCommandHistory(): Promise<void> {
  try {
    await invoke<void>('clear_ssh_command_history');
  } catch (error) {
    throw new Error(`Failed to clear command history: ${error}`);
  }
}

/**
 * Setup SSH port forwarding
 * 
 * @param sessionId - ID of SSH session
 * @param localPort - Local port to forward from
 * @param remoteHost - Remote host to forward to
 * @param remotePort - Remote port to forward to
 * @returns Promise resolving to port forward ID
 * @throws Error if setup fails
 * 
 * @example
 * ```typescript
 * // Forward local port 8080 to remote localhost:80
 * const forwardId = await sshService.setupPortForward(
 *   'session-456',
 *   8080,
 *   'localhost',
 *   80
 * );
 * log.debug(`Port forwarding active: ${forwardId}`);
 * ```
 */
export async function setupPortForward(
  sessionId: string,
  localPort: number,
  remoteHost: string,
  remotePort: number
): Promise<string> {
  try {
    return await invoke<string>('setup_ssh_port_forward', {
      sessionId,
      localPort,
      remoteHost,
      remotePort,
    });
  } catch (error) {
    throw new Error(`Failed to setup port forward: ${error}`);
  }
}

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

/**
 * Execute command and get stdout only
 * 
 * @param sessionId - ID of SSH session
 * @param command - Command to execute
 * @returns Promise resolving to stdout string
 * @throws Error if command fails or exits non-zero
 */
export async function exec(sessionId: string, command: string): Promise<string> {
  const result = await executeCommand(sessionId, command);
  if (result.exitCode !== 0) {
    throw new Error(`Command failed with exit code ${result.exitCode}: ${result.stderr}`);
  }
  return result.stdout;
}

/**
 * Test if session is still active
 * 
 * @param sessionId - ID of session to test
 * @returns Promise resolving to true if session is active
 */
export async function isSessionActive(sessionId: string): Promise<boolean> {
  try {
    const sessions = await getActiveSessions();
    return sessions.some(s => s.id === sessionId);
  } catch {
    return false;
  }
}

/**
 * Get session uptime in seconds
 * 
 * @param sessionId - ID of session
 * @returns Promise resolving to uptime or null if not found
 */
export async function getSessionUptime(sessionId: string): Promise<number | null> {
  const sessions = await getActiveSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return null;
  return Math.floor((Date.now() - session.connectedAt) / 1000);
}

/**
 * Execute multiple commands in sequence
 * 
 * @param sessionId - ID of SSH session
 * @param commands - Array of commands to execute
 * @returns Promise resolving to array of results
 * @throws Error if any command fails
 */
export async function executeCommands(
  sessionId: string,
  commands: string[]
): Promise<SSHCommandResult[]> {
  const results: SSHCommandResult[] = [];
  for (const command of commands) {
    const result = await executeCommand(sessionId, command);
    results.push(result);
    if (result.exitCode !== 0) {
      throw new Error(`Command "${command}" failed: ${result.stderr}`);
    }
  }
  return results;
}

/**
 * Get config by name
 * 
 * @param name - Name of config to find
 * @returns Promise resolving to config or null if not found
 */
export async function getConfigByName(name: string): Promise<SSHConfig | null> {
  const configs = await getConfigs();
  return configs.find(c => c.name === name) || null;
}

/**
 * Quick connect using config name
 * 
 * @param configName - Name of SSH configuration
 * @returns Promise resolving to session ID
 * @throws Error if config not found or connection fails
 */
export async function quickConnect(configName: string): Promise<string> {
  const config = await getConfigByName(configName);
  if (!config) {
    throw new Error(`SSH config "${configName}" not found`);
  }
  return await connect(config.id);
}

/**
 * Default export with all methods
 */
export const sshService = {
  createConfig,
  getConfigs,
  deleteConfig,
  connect,
  executeCommand,
  disconnect,
  getActiveSessions,
  generateKey,
  getKeys,
  deleteKey,
  getCommandHistory,
  clearCommandHistory,
  setupPortForward,
  exec,
  isSessionActive,
  getSessionUptime,
  executeCommands,
  getConfigByName,
  quickConnect,
};

export default sshService;
