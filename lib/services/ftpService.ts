/**
 * FTP/SFTP Service - Enterprise file transfer
 * 
 * Provides complete FTP/SFTP functionality including:
 * - Site configuration and connection management
 * - File upload/download with queue management
 * - Local FTP server hosting
 * - File operations (chmod, delete, rename, mkdir)
 * 
 * @module ftpService
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('FTP');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * FTP/SFTP site configuration
 */
export interface FTPSite {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  protocol: 'FTP' | 'SFTP' | 'FTPS';
  passive: boolean;
  sshKeyPath?: string;
  lastConnected?: number; // Unix timestamp
}

/**
 * Remote directory entry
 */
export interface FTPEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number; // bytes
  modified: number; // Unix timestamp
  permissions?: string; // e.g., "rwxr-xr-x"
  owner?: string;
  group?: string;
}

/**
 * File transfer queue item
 */
export interface FTPTransfer {
  id: string;
  siteId: string;
  direction: 'upload' | 'download';
  localPath: string;
  remotePath: string;
  size: number;
  transferred: number;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'failed';
  speed: number; // bytes/sec
  startTime?: number; // Unix timestamp
  endTime?: number; // Unix timestamp
  error?: string;
}

/**
 * FTP server status
 */
export interface FTPServerStatus {
  running: boolean;
  port: number;
  rootPath: string;
  allowAnonymous: boolean;
  activeConnections: number;
  totalConnections: number;
}

/**
 * FTP server configuration
 */
export interface FTPServerConfig {
  port: number;
  rootPath: string;
  allowAnonymous: boolean;
  requireTls: boolean;
  maxConnections: number;
  users: FTPUser[];
}

/**
 * FTP server user
 */
export interface FTPUser {
  username: string;
  password: string;
  permissions: 'readonly' | 'readwrite' | 'admin';
}

/**
 * Connection test result
 */
export interface FTPConnectionTest {
  success: boolean;
  message: string;
  latency?: number; // milliseconds
}

// ============================================================================
// FTP/SFTP SERVICE API
// ============================================================================

/**
 * Create new FTP/SFTP site configuration
 * 
 * @param site - Site configuration object
 * @returns Promise resolving to created site with ID
 * @throws Error if site creation fails
 * 
 * @example
 * ```typescript
 * const site = await ftpService.createSite({
 *   name: 'Production Server',
 *   host: 'ftp.example.com',
 *   port: 22,
 *   username: 'admin',
 *   password: 'secret',
 *   protocol: 'SFTP',
 *   passive: true
 * });
 * log.debug(`Created site: ${site.id}`);
 * ```
 */
export async function createSite(site: Omit<FTPSite, 'id'>): Promise<FTPSite> {
  log.debug(`Creating FTP site: ${site.name} (${site.protocol}://${site.host}:${site.port})`);
  try {
    const result = await invoke<FTPSite>('create_ftp_site', { site });
    log.info(`FTP site created: ${result.id}`);
    return result;
  } catch (error) {
    log.error(`Failed to create FTP site: ${error}`);
    throw new Error(`Failed to create FTP site: ${error}`);
  }
}

/**
 * Get all configured FTP/SFTP sites
 * 
 * @returns Promise resolving to array of sites
 * @throws Error if retrieval fails
 * 
 * @example
 * ```typescript
 * const sites = await ftpService.getSites();
 * sites.forEach(site => {
 *   log.debug(`${site.name}: ${site.protocol}://${site.host}:${site.port}`);
 * });
 * ```
 */
export async function getSites(): Promise<FTPSite[]> {
  log.debug('Fetching all FTP sites');
  try {
    const sites = await invoke<FTPSite[]>('get_ftp_sites');
    log.debug(`Retrieved ${sites.length} FTP sites`);
    return sites;
  } catch (error) {
    log.error(`Failed to get FTP sites: ${error}`);
    throw new Error(`Failed to get FTP sites: ${error}`);
  }
}

/**
 * Delete FTP/SFTP site configuration
 * 
 * @param siteId - ID of site to delete
 * @returns Promise resolving when deletion completes
 * @throws Error if deletion fails
 * 
 * @example
 * ```typescript
 * await ftpService.deleteSite('site-123');
 * log.debug('Site deleted');
 * ```
 */
export async function deleteSite(siteId: string): Promise<void> {
  log.debug(`Deleting FTP site: ${siteId}`);
  try {
    await invoke<void>('delete_ftp_site', { siteId });
    log.info(`FTP site deleted: ${siteId}`);
  } catch (error) {
    log.error(`Failed to delete FTP site: ${error}`);
    throw new Error(`Failed to delete FTP site: ${error}`);
  }
}

/**
 * Update FTP/SFTP site configuration
 * 
 * @param siteId - ID of site to update
 * @param site - Updated site configuration
 * @returns Promise resolving to updated site
 * @throws Error if update fails
 * 
 * @example
 * ```typescript
 * await ftpService.updateSite('site-123', {
 *   name: 'Updated Name',
 *   port: 2222
 * });
 * ```
 */
export async function updateSite(siteId: string, site: Partial<FTPSite>): Promise<FTPSite> {
  try {
    return await invoke<FTPSite>('update_ftp_site', { siteId, site });
  } catch (error) {
    throw new Error(`Failed to update FTP site: ${error}`);
  }
}

/**
 * List directory contents on remote server
 * 
 * @param siteId - ID of site to connect to
 * @param path - Remote directory path (default: root)
 * @returns Promise resolving to array of directory entries
 * @throws Error if listing fails
 * 
 * @example
 * ```typescript
 * const entries = await ftpService.listDirectory('site-123', '/var/www');
 * entries.forEach(entry => {
 *   log.debug(`${entry.isDirectory ? 'DIR' : 'FILE'}: ${entry.name}`);
 * });
 * ```
 */
export async function listDirectory(siteId: string, path: string = '/'): Promise<FTPEntry[]> {
  try {
    return await invoke<FTPEntry[]>('list_ftp_directory', { siteId, path });
  } catch (error) {
    throw new Error(`Failed to list directory: ${error}`);
  }
}

/**
 * Upload file to remote server
 * 
 * @param siteId - ID of site to upload to
 * @param localPath - Local file path
 * @param remotePath - Remote destination path
 * @returns Promise resolving to transfer ID
 * @throws Error if upload fails
 * 
 * @example
 * ```typescript
 * const transferId = await ftpService.uploadFile(
 *   'site-123',
 *   '/Users/me/document.pdf',
 *   '/uploads/document.pdf'
 * );
 * log.debug(`Upload started: ${transferId}`);
 * ```
 */
export async function uploadFile(
  siteId: string,
  localPath: string,
  remotePath: string
): Promise<string> {
  try {
    return await invoke<string>('upload_ftp_file', { siteId, localPath, remotePath });
  } catch (error) {
    throw new Error(`Failed to upload file: ${error}`);
  }
}

/**
 * Download file from remote server
 * 
 * @param siteId - ID of site to download from
 * @param remotePath - Remote file path
 * @param localPath - Local destination path
 * @returns Promise resolving to transfer ID
 * @throws Error if download fails
 * 
 * @example
 * ```typescript
 * const transferId = await ftpService.downloadFile(
 *   'site-123',
 *   '/data/report.csv',
 *   '/Users/me/Downloads/report.csv'
 * );
 * ```
 */
export async function downloadFile(
  siteId: string,
  remotePath: string,
  localPath: string
): Promise<string> {
  try {
    return await invoke<string>('download_ftp_file', { siteId, remotePath, localPath });
  } catch (error) {
    throw new Error(`Failed to download file: ${error}`);
  }
}

/**
 * Get current transfer queue
 * 
 * @returns Promise resolving to array of transfers
 * @throws Error if retrieval fails
 * 
 * @example
 * ```typescript
 * const queue = await ftpService.getTransferQueue();
 * queue.forEach(transfer => {
 *   const progress = (transfer.transferred / transfer.size * 100).toFixed(1);
 *   log.debug(`${transfer.localPath}: ${progress}% (${transfer.status})`);
 * });
 * ```
 */
export async function getTransferQueue(): Promise<FTPTransfer[]> {
  try {
    return await invoke<FTPTransfer[]>('get_ftp_transfer_queue');
  } catch (error) {
    throw new Error(`Failed to get transfer queue: ${error}`);
  }
}

/**
 * Pause active transfer
 * 
 * @param transferId - ID of transfer to pause
 * @returns Promise resolving when transfer is paused
 * @throws Error if pause fails
 * 
 * @example
 * ```typescript
 * await ftpService.pauseTransfer('transfer-456');
 * ```
 */
export async function pauseTransfer(transferId: string): Promise<void> {
  try {
    await invoke<void>('pause_ftp_transfer', { transferId });
  } catch (error) {
    throw new Error(`Failed to pause transfer: ${error}`);
  }
}

/**
 * Resume paused transfer
 * 
 * @param transferId - ID of transfer to resume
 * @returns Promise resolving when transfer resumes
 * @throws Error if resume fails
 * 
 * @example
 * ```typescript
 * await ftpService.resumeTransfer('transfer-456');
 * ```
 */
export async function resumeTransfer(transferId: string): Promise<void> {
  try {
    await invoke<void>('resume_ftp_transfer', { transferId });
  } catch (error) {
    throw new Error(`Failed to resume transfer: ${error}`);
  }
}

/**
 * Cancel transfer
 * 
 * @param transferId - ID of transfer to cancel
 * @returns Promise resolving when transfer is cancelled
 * @throws Error if cancellation fails
 * 
 * @example
 * ```typescript
 * await ftpService.cancelTransfer('transfer-456');
 * ```
 */
export async function cancelTransfer(transferId: string): Promise<void> {
  try {
    await invoke<void>('cancel_ftp_transfer', { transferId });
  } catch (error) {
    throw new Error(`Failed to cancel transfer: ${error}`);
  }
}

/**
 * Start local FTP server
 * 
 * @param config - Server configuration
 * @returns Promise resolving when server starts
 * @throws Error if server start fails
 * 
 * @example
 * ```typescript
 * await ftpService.startServer({
 *   port: 2121,
 *   rootPath: '/Users/me/FTPRoot',
 *   allowAnonymous: false,
 *   requireTls: true,
 *   maxConnections: 10,
 *   users: [
 *     { username: 'admin', password: 'secret', permissions: 'admin' }
 *   ]
 * });
 * ```
 */
export async function startServer(config: FTPServerConfig): Promise<void> {
  try {
    await invoke<void>('start_ftp_server', { config });
  } catch (error) {
    throw new Error(`Failed to start FTP server: ${error}`);
  }
}

/**
 * Stop local FTP server
 * 
 * @returns Promise resolving when server stops
 * @throws Error if server stop fails
 * 
 * @example
 * ```typescript
 * await ftpService.stopServer();
 * log.debug('FTP server stopped');
 * ```
 */
export async function stopServer(): Promise<void> {
  try {
    await invoke<void>('stop_ftp_server');
  } catch (error) {
    throw new Error(`Failed to stop FTP server: ${error}`);
  }
}

/**
 * Get FTP server status
 * 
 * @returns Promise resolving to server status
 * @throws Error if status retrieval fails
 * 
 * @example
 * ```typescript
 * const status = await ftpService.getServerStatus();
 * if (status.running) {
 *   log.debug(`Server running on port ${status.port}`);
 *   log.debug(`Active connections: ${status.activeConnections}`);
 * }
 * ```
 */
export async function getServerStatus(): Promise<FTPServerStatus> {
  try {
    return await invoke<FTPServerStatus>('get_ftp_server_status');
  } catch (error) {
    throw new Error(`Failed to get server status: ${error}`);
  }
}

/**
 * Test connection to FTP site
 * 
 * @param siteId - ID of site to test
 * @returns Promise resolving to test result
 * @throws Error if test fails
 * 
 * @example
 * ```typescript
 * const result = await ftpService.testConnection('site-123');
 * if (result.success) {
 *   log.debug(`Connection OK (${result.latency}ms)`);
 * } else {
 *   log.error(`Connection failed: ${result.message}`);
 * }
 * ```
 */
export async function testConnection(siteId: string): Promise<FTPConnectionTest> {
  try {
    return await invoke<FTPConnectionTest>('test_ftp_connection', { siteId });
  } catch (error) {
    throw new Error(`Failed to test connection: ${error}`);
  }
}

/**
 * Change file/directory permissions (chmod)
 * 
 * @param siteId - ID of site
 * @param path - Remote file/directory path
 * @param permissions - Unix permissions (e.g., "755", "644")
 * @returns Promise resolving when permissions are changed
 * @throws Error if chmod fails
 * 
 * @example
 * ```typescript
 * await ftpService.chmod('site-123', '/var/www/script.sh', '755');
 * ```
 */
export async function chmod(siteId: string, path: string, permissions: string): Promise<void> {
  try {
    await invoke<void>('ftp_chmod', { siteId, path, permissions });
  } catch (error) {
    throw new Error(`Failed to chmod: ${error}`);
  }
}

/**
 * Delete remote file/directory
 * 
 * @param siteId - ID of site
 * @param path - Remote file/directory path
 * @param recursive - Whether to delete directories recursively
 * @returns Promise resolving when deletion completes
 * @throws Error if deletion fails
 * 
 * @example
 * ```typescript
 * await ftpService.deleteRemote('site-123', '/tmp/old-file.txt');
 * await ftpService.deleteRemote('site-123', '/tmp/old-dir', true);
 * ```
 */
export async function deleteRemote(
  siteId: string,
  path: string,
  recursive: boolean = false
): Promise<void> {
  try {
    await invoke<void>('ftp_delete', { siteId, path, recursive });
  } catch (error) {
    throw new Error(`Failed to delete: ${error}`);
  }
}

/**
 * Rename remote file/directory
 * 
 * @param siteId - ID of site
 * @param oldPath - Current path
 * @param newPath - New path
 * @returns Promise resolving when rename completes
 * @throws Error if rename fails
 * 
 * @example
 * ```typescript
 * await ftpService.rename('site-123', '/data/old.txt', '/data/new.txt');
 * ```
 */
export async function rename(siteId: string, oldPath: string, newPath: string): Promise<void> {
  try {
    await invoke<void>('ftp_rename', { siteId, oldPath, newPath });
  } catch (error) {
    throw new Error(`Failed to rename: ${error}`);
  }
}

/**
 * Create remote directory
 * 
 * @param siteId - ID of site
 * @param path - Directory path to create
 * @returns Promise resolving when directory is created
 * @throws Error if mkdir fails
 * 
 * @example
 * ```typescript
 * await ftpService.mkdir('site-123', '/var/www/new-folder');
 * ```
 */
export async function mkdir(siteId: string, path: string): Promise<void> {
  try {
    await invoke<void>('ftp_mkdir', { siteId, path });
  } catch (error) {
    throw new Error(`Failed to create directory: ${error}`);
  }
}

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

/**
 * Get active transfers only
 * 
 * @returns Promise resolving to array of active transfers
 */
export async function getActiveTransfers(): Promise<FTPTransfer[]> {
  const queue = await getTransferQueue();
  return queue.filter(t => t.status === 'active');
}

/**
 * Get total transfer progress percentage
 * 
 * @returns Promise resolving to progress percentage (0-100)
 */
export async function getTotalProgress(): Promise<number> {
  const queue = await getTransferQueue();
  const active = queue.filter(t => t.status === 'active' || t.status === 'completed');
  
  if (active.length === 0) return 0;
  
  const totalSize = active.reduce((sum, t) => sum + t.size, 0);
  const totalTransferred = active.reduce((sum, t) => sum + t.transferred, 0);
  
  return totalSize > 0 ? (totalTransferred / totalSize) * 100 : 0;
}

/**
 * Check if server is running
 * 
 * @returns Promise resolving to true if server is running
 */
export async function isServerRunning(): Promise<boolean> {
  try {
    const status = await getServerStatus();
    return status.running;
  } catch {
    return false;
  }
}

/**
 * Default export with all methods
 */
export const ftpService = {
  createSite,
  getSites,
  deleteSite,
  updateSite,
  listDirectory,
  uploadFile,
  downloadFile,
  getTransferQueue,
  pauseTransfer,
  resumeTransfer,
  cancelTransfer,
  startServer,
  stopServer,
  getServerStatus,
  testConnection,
  chmod,
  deleteRemote,
  rename,
  mkdir,
  getActiveTransfers,
  getTotalProgress,
  isServerRunning,
};

export default ftpService;
