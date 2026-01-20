/**
 * RDP Service - Remote Desktop Protocol management
 * 
 * Provides complete RDP functionality including:
 * - Connection configuration and management
 * - Remote desktop sessions
 * - Display settings management
 * - Connection testing
 * 
 * @module rdpService
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('RDP');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * RDP connection configuration
 */
export interface RDPConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  domain?: string;
  displayWidth: number;
  displayHeight: number;
  colorDepth: 16 | 24 | 32;
  fullscreen: boolean;
  enableAudio: boolean;
  enableClipboard: boolean;
  enablePrinters: boolean;
  enableDrives: boolean;
  compression: boolean;
  lastConnected?: number; // Unix timestamp
}

/**
 * Active RDP session
 */
export interface RDPSession {
  id: string;
  configId: string;
  host: string;
  username: string;
  connectedAt: number; // Unix timestamp
  lastActivity: number; // Unix timestamp
  displayResolution: string; // e.g., "1920x1080"
  status: 'connected' | 'idle' | 'active';
}

/**
 * Display settings
 */
export interface RDPDisplaySettings {
  width: number;
  height: number;
  colorDepth: 16 | 24 | 32;
  fullscreen: boolean;
  scaling: number; // percentage (100 = no scaling)
}

/**
 * Connection test result
 */
export interface RDPConnectionTest {
  success: boolean;
  message: string;
  latency?: number; // milliseconds
  serverVersion?: string;
}

/**
 * RDP statistics
 */
export interface RDPStats {
  sessionId: string;
  bytesSent: number;
  bytesReceived: number;
  framesReceived: number;
  fps: number; // frames per second
  latency: number; // milliseconds
  packetLoss: number; // percentage
}

// ============================================================================
// RDP SERVICE API
// ============================================================================

/**
 * Create new RDP connection configuration
 * 
 * @param config - RDP configuration object
 * @returns Promise resolving to created config with ID
 * @throws Error if config creation fails
 * 
 * @example
 * ```typescript
 * const config = await rdpService.createConfig({
 *   name: 'Windows Server',
 *   host: 'server.example.com',
 *   port: 3389,
 *   username: 'Administrator',
 *   password: 'secret',
 *   domain: 'COMPANY',
 *   displayWidth: 1920,
 *   displayHeight: 1080,
 *   colorDepth: 32,
 *   fullscreen: false,
 *   enableAudio: true,
 *   enableClipboard: true,
 *   enablePrinters: false,
 *   enableDrives: false,
 *   compression: true
 * });
 * ```
 */
export async function createConfig(config: Omit<RDPConfig, 'id'>): Promise<RDPConfig> {
  log.debug(`Creating RDP config: ${config.name} (${config.host}:${config.port})`);
  try {
    const result = await invoke<RDPConfig>('create_rdp_config', { config });
    log.info(`RDP config created: ${result.id}`);
    return result;
  } catch (error) {
    log.error(`Failed to create RDP config: ${error}`);
    throw new Error(`Failed to create RDP config: ${error}`);
  }
}

/**
 * Get all RDP configurations
 * 
 * @returns Promise resolving to array of RDP configs
 * @throws Error if retrieval fails
 * 
 * @example
 * ```typescript
 * const configs = await rdpService.getConfigs();
 * configs.forEach(config => {
 *   log.debug(`${config.name}: ${config.host}:${config.port}`);
 * });
 * ```
 */
export async function getConfigs(): Promise<RDPConfig[]> {
  try {
    return await invoke<RDPConfig[]>('get_rdp_configs');
  } catch (error) {
    throw new Error(`Failed to get RDP configs: ${error}`);
  }
}

/**
 * Delete RDP configuration
 * 
 * @param configId - ID of config to delete
 * @returns Promise resolving when deletion completes
 * @throws Error if deletion fails
 * 
 * @example
 * ```typescript
 * await rdpService.deleteConfig('config-123');
 * ```
 */
export async function deleteConfig(configId: string): Promise<void> {
  log.debug(`Deleting RDP config: ${configId}`);
  try {
    await invoke<void>('delete_rdp_config', { configId });
    log.info(`RDP config deleted: ${configId}`);
  } catch (error) {
    log.error(`Failed to delete RDP config: ${error}`);
    throw new Error(`Failed to delete RDP config: ${error}`);
  }
}

/**
 * Connect to RDP server
 * 
 * @param configId - ID of RDP configuration to use
 * @returns Promise resolving to session ID
 * @throws Error if connection fails
 * 
 * @example
 * ```typescript
 * const sessionId = await rdpService.connect('config-123');
 * log.debug(`Connected: ${sessionId}`);
 * ```
 */
export async function connect(configId: string): Promise<string> {
  try {
    return await invoke<string>('connect_rdp', { configId });
  } catch (error) {
    throw new Error(`Failed to connect RDP: ${error}`);
  }
}

/**
 * Disconnect RDP session
 * 
 * @param sessionId - ID of session to disconnect
 * @returns Promise resolving when disconnection completes
 * @throws Error if disconnection fails
 * 
 * @example
 * ```typescript
 * await rdpService.disconnect('session-456');
 * log.debug('Disconnected');
 * ```
 */
export async function disconnect(sessionId: string): Promise<void> {
  try {
    await invoke<void>('disconnect_rdp', { sessionId });
  } catch (error) {
    throw new Error(`Failed to disconnect RDP: ${error}`);
  }
}

/**
 * Get all active RDP sessions
 * 
 * @returns Promise resolving to array of active sessions
 * @throws Error if retrieval fails
 * 
 * @example
 * ```typescript
 * const sessions = await rdpService.getActiveSessions();
 * sessions.forEach(session => {
 *   log.debug(`${session.host}: ${session.status} (${session.displayResolution})`);
 * });
 * ```
 */
export async function getActiveSessions(): Promise<RDPSession[]> {
  try {
    return await invoke<RDPSession[]>('get_active_rdp_sessions');
  } catch (error) {
    throw new Error(`Failed to get active RDP sessions: ${error}`);
  }
}

/**
 * Update display settings for active session
 * 
 * @param sessionId - ID of session to update
 * @param settings - New display settings
 * @returns Promise resolving when settings are updated
 * @throws Error if update fails
 * 
 * @example
 * ```typescript
 * await rdpService.updateDisplay('session-456', {
 *   width: 2560,
 *   height: 1440,
 *   colorDepth: 32,
 *   fullscreen: true,
 *   scaling: 100
 * });
 * ```
 */
export async function updateDisplay(
  sessionId: string,
  settings: RDPDisplaySettings
): Promise<void> {
  try {
    await invoke<void>('update_rdp_display', { sessionId, settings });
  } catch (error) {
    throw new Error(`Failed to update RDP display: ${error}`);
  }
}

/**
 * Test connection to RDP server
 * 
 * @param configId - ID of config to test
 * @returns Promise resolving to test result
 * @throws Error if test fails
 * 
 * @example
 * ```typescript
 * const result = await rdpService.testConnection('config-123');
 * if (result.success) {
 *   log.debug(`Connection OK (${result.latency}ms)`);
 *   log.debug(`Server: ${result.serverVersion}`);
 * } else {
 *   log.error(`Connection failed: ${result.message}`);
 * }
 * ```
 */
export async function testConnection(configId: string): Promise<RDPConnectionTest> {
  try {
    return await invoke<RDPConnectionTest>('test_rdp_connection', { configId });
  } catch (error) {
    throw new Error(`Failed to test RDP connection: ${error}`);
  }
}

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

/**
 * Check if session is active
 * 
 * @param sessionId - ID of session to check
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
 * Get config by name
 * 
 * @param name - Name of config to find
 * @returns Promise resolving to config or null if not found
 */
export async function getConfigByName(name: string): Promise<RDPConfig | null> {
  const configs = await getConfigs();
  return configs.find(c => c.name === name) || null;
}

/**
 * Quick connect using config name
 * 
 * @param configName - Name of RDP configuration
 * @returns Promise resolving to session ID
 * @throws Error if config not found or connection fails
 */
export async function quickConnect(configName: string): Promise<string> {
  const config = await getConfigByName(configName);
  if (!config) {
    throw new Error(`RDP config "${configName}" not found`);
  }
  return await connect(config.id);
}

/**
 * Disconnect all active sessions
 * 
 * @returns Promise resolving when all sessions are disconnected
 */
export async function disconnectAll(): Promise<void> {
  const sessions = await getActiveSessions();
  await Promise.all(sessions.map(s => disconnect(s.id)));
}

/**
 * Get session by config ID
 * 
 * @param configId - ID of configuration
 * @returns Promise resolving to session or null if not found
 */
export async function getSessionByConfig(configId: string): Promise<RDPSession | null> {
  const sessions = await getActiveSessions();
  return sessions.find(s => s.configId === configId) || null;
}

/**
 * Toggle fullscreen for session
 * 
 * @param sessionId - ID of session
 * @param fullscreen - Whether to enable fullscreen
 * @returns Promise resolving when fullscreen is toggled
 */
export async function toggleFullscreen(sessionId: string, fullscreen: boolean): Promise<void> {
  const sessions = await getActiveSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // Parse current resolution
  const [width, height] = session.displayResolution.split('x').map(Number);

  await updateDisplay(sessionId, {
    width,
    height,
    colorDepth: 32,
    fullscreen,
    scaling: 100,
  });
}

/**
 * Change session resolution
 * 
 * @param sessionId - ID of session
 * @param width - Display width
 * @param height - Display height
 * @returns Promise resolving when resolution is changed
 */
export async function changeResolution(
  sessionId: string,
  width: number,
  height: number
): Promise<void> {
  await updateDisplay(sessionId, {
    width,
    height,
    colorDepth: 32,
    fullscreen: false,
    scaling: 100,
  });
}

/**
 * Get common resolutions for quick selection
 * 
 * @returns Array of common display resolutions
 */
export function getCommonResolutions(): Array<{ width: number; height: number; label: string }> {
  return [
    { width: 1280, height: 720, label: '720p (HD)' },
    { width: 1366, height: 768, label: 'WXGA' },
    { width: 1920, height: 1080, label: '1080p (Full HD)' },
    { width: 2560, height: 1440, label: '1440p (QHD)' },
    { width: 3840, height: 2160, label: '4K (UHD)' },
  ];
}

/**
 * Create quick config with defaults
 * 
 * @param name - Config name
 * @param host - Server hostname/IP
 * @param username - Username
 * @param password - Password (optional)
 * @returns Promise resolving to created config
 */
export async function createQuickConfig(
  name: string,
  host: string,
  username: string,
  password?: string
): Promise<RDPConfig> {
  return await createConfig({
    name,
    host,
    port: 3389,
    username,
    password,
    displayWidth: 1920,
    displayHeight: 1080,
    colorDepth: 32,
    fullscreen: false,
    enableAudio: true,
    enableClipboard: true,
    enablePrinters: false,
    enableDrives: false,
    compression: true,
  });
}

/**
 * Default export with all methods
 */
export const rdpService = {
  createConfig,
  getConfigs,
  deleteConfig,
  connect,
  disconnect,
  getActiveSessions,
  updateDisplay,
  testConnection,
  isSessionActive,
  getSessionUptime,
  getConfigByName,
  quickConnect,
  disconnectAll,
  getSessionByConfig,
  toggleFullscreen,
  changeResolution,
  getCommonResolutions,
  createQuickConfig,
};

export default rdpService;
