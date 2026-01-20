/**
 * FTP Types - Complete TypeScript Type System
 * CUBE Nexum Platform v2.0
 * 
 * Comprehensive types for FTP/FTPS/SFTP client with dual-pane file browser,
 * transfer queue management, and server connection handling.
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type FtpProtocol = 'ftp' | 'ftps' | 'sftp' | 'ftpes';
export type TransferMode = 'binary' | 'ascii' | 'auto';
export type TransferType = 'upload' | 'download';
export type TransferStatus = 'queued' | 'transferring' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type FileViewMode = 'list' | 'grid' | 'details';
export type PaneType = 'local' | 'remote';

// ============================================================================
// FTP SITE CONFIGURATION
// ============================================================================

export interface FtpSite {
  id: string;
  name: string;
  protocol: FtpProtocol;
  host: string;
  port: number;
  username: string;
  password_encrypted?: string;
  ssh_key_path?: string;
  passive_mode: boolean;
  transfer_mode: TransferMode;
  remote_path: string;
  local_path: string;
  max_connections: number;
  retry_attempts: number;
  timeout_seconds: number;
  created_at: number;
  last_used?: number;
}

export interface CreateSiteRequest {
  name: string;
  protocol: FtpProtocol;
  host: string;
  port?: number;
  username: string;
  password_encrypted?: string;
  ssh_key_path?: string;
}

export interface UpdateSiteRequest {
  id: string;
  name?: string;
  protocol?: FtpProtocol;
  host?: string;
  port?: number;
  username?: string;
  password_encrypted?: string;
  ssh_key_path?: string;
  passive_mode?: boolean;
  transfer_mode?: TransferMode;
  remote_path?: string;
  local_path?: string;
  max_connections?: number;
  retry_attempts?: number;
  timeout_seconds?: number;
}

// ============================================================================
// FILE & DIRECTORY ENTRIES
// ============================================================================

export interface FtpEntry {
  name: string;
  path: string;
  is_directory: boolean;
  size: number;
  modified: number;
  permissions: string;
}

export interface LocalEntry {
  name: string;
  path: string;
  is_directory: boolean;
  size: number;
  modified: number;
  permissions?: string;
  readable: boolean;
  writable: boolean;
}

export interface FileSelection {
  entries: (FtpEntry | LocalEntry)[];
  pane: PaneType;
}

// ============================================================================
// TRANSFER QUEUE
// ============================================================================

export interface TransferItem {
  id: string;
  site_id: string;
  transfer_type: TransferType;
  local_path: string;
  remote_path: string;
  file_size: number;
  bytes_transferred: number;
  status: TransferStatus;
  speed: number;
  eta?: number;
  error?: string;
}

export interface TransferProgress {
  transfer_id: string;
  bytes_transferred: number;
  speed: number;
  eta?: number;
  percentage: number;
}

export interface TransferStats {
  total_transfers: number;
  active_transfers: number;
  completed_transfers: number;
  failed_transfers: number;
  total_bytes_transferred: number;
  average_speed: number;
}

// ============================================================================
// FTP SERVER CONFIGURATION (Embedded Server)
// ============================================================================

export interface FtpServerConfig {
  enabled: boolean;
  port: number;
  passive_ports: [number, number];
  max_connections: number;
  anonymous_allowed: boolean;
  root_directory: string;
  users: FtpUser[];
}

export interface FtpUser {
  username: string;
  password_encrypted: string;
  home_directory: string;
  permissions: FtpPermissions;
}

export interface FtpPermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  create_directories: boolean;
}

export interface FtpServerStatus {
  running: boolean;
  port?: number;
  active_connections: number;
  total_connections: number;
  start_time?: number;
  uptime?: number;
}

// ============================================================================
// OPERATIONS
// ============================================================================

export interface ListDirectoryRequest {
  siteId: string;
  path: string;
}

export interface UploadFileRequest {
  siteId: string;
  localPath: string;
  remotePath: string;
}

export interface DownloadFileRequest {
  siteId: string;
  remotePath: string;
  localPath: string;
}

export interface DeleteFileRequest {
  siteId: string;
  remotePath: string;
  isDirectory: boolean;
}

export interface RenameFileRequest {
  siteId: string;
  oldPath: string;
  newPath: string;
}

export interface CreateDirectoryRequest {
  siteId: string;
  remotePath: string;
}

export interface ChmodRequest {
  siteId: string;
  remotePath: string;
  mode: number;
}

export interface TransferControlRequest {
  transferId: string;
}

export interface TestConnectionRequest {
  siteId: string;
}

// ============================================================================
// UI STATE
// ============================================================================

export interface FtpClientState {
  connected_site?: FtpSite;
  local_path: string;
  remote_path: string;
  local_entries: LocalEntry[];
  remote_entries: FtpEntry[];
  selected_local: string[];
  selected_remote: string[];
  view_mode: FileViewMode;
  show_hidden: boolean;
  transfer_queue: TransferItem[];
  transfer_stats: TransferStats;
}

export interface PaneState {
  current_path: string;
  entries: (FtpEntry | LocalEntry)[];
  selected: string[];
  loading: boolean;
  error?: string;
  sort_by: 'name' | 'size' | 'modified' | 'type';
  sort_order: 'asc' | 'desc';
}

export interface ConnectionState {
  site?: FtpSite;
  connected: boolean;
  connecting: boolean;
  error?: string;
  last_activity?: number;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface FtpTransferProgressEvent {
  transfer_id: string;
  bytes_transferred: number;
  speed: number;
  eta?: number;
}

export interface FtpTransferCompleteEvent {
  transfer_id: string;
  status: TransferStatus;
  error?: string;
}

export interface FtpConnectionEvent {
  site_id: string;
  connected: boolean;
  error?: string;
}

export type FtpEventType = 
  | 'ftp:transfer:progress'
  | 'ftp:transfer:complete'
  | 'ftp:transfer:error'
  | 'ftp:connection:established'
  | 'ftp:connection:lost'
  | 'ftp:server:started'
  | 'ftp:server:stopped';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default port for protocol
 */
export function getDefaultPort(protocol: FtpProtocol): number {
  switch (protocol) {
    case 'ftp':
    case 'ftps':
    case 'ftpes':
      return 21;
    case 'sftp':
      return 22;
    default:
      return 21;
  }
}

/**
 * Get protocol display name
 */
export function getProtocolDisplayName(protocol: FtpProtocol): string {
  switch (protocol) {
    case 'ftp':
      return 'FTP (Plain)';
    case 'ftps':
      return 'FTPS (Implicit TLS)';
    case 'ftpes':
      return 'FTPES (Explicit TLS)';
    case 'sftp':
      return 'SFTP (SSH)';
    default: {
      const exhaustiveCheck: never = protocol;
      return String(exhaustiveCheck).toUpperCase();
    }
  }
}

/**
 * Get protocol color
 */
export function getProtocolColor(protocol: FtpProtocol): string {
  switch (protocol) {
    case 'ftp':
      return '#6b7280'; // gray
    case 'ftps':
      return '#10b981'; // green
    case 'ftpes':
      return '#3b82f6'; // blue
    case 'sftp':
      return '#8b5cf6'; // purple
    default:
      return '#6b7280';
  }
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format transfer speed
 */
export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  return `${(bytesPerSecond / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format time duration
 */
export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '--:--';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format timestamp
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than 1 day
  if (diff < 86400000) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  
  // Less than 1 year
  if (diff < 31536000000) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // More than 1 year
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Get transfer status display text
 */
export function getTransferStatusText(status: TransferStatus): string {
  switch (status) {
    case 'queued':
      return 'Queued';
    case 'transferring':
      return 'Transferring';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Get transfer status color
 */
export function getTransferStatusColor(status: TransferStatus): string {
  switch (status) {
    case 'queued':
      return '#6b7280'; // gray
    case 'transferring':
      return '#3b82f6'; // blue
    case 'paused':
      return '#f59e0b'; // amber
    case 'completed':
      return '#10b981'; // green
    case 'failed':
      return '#ef4444'; // red
    case 'cancelled':
      return '#6b7280'; // gray
    default:
      return '#6b7280';
  }
}

/**
 * Calculate transfer percentage
 */
export function calculatePercentage(bytesTransferred: number, fileSize: number): number {
  if (fileSize === 0) return 0;
  return Math.min(100, Math.round((bytesTransferred / fileSize) * 100));
}

/**
 * Get file icon based on extension
 */
export function getFileIcon(filename: string, isDirectory: boolean): string {
  if (isDirectory) return '📁';
  
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'txt':
    case 'md':
    case 'log':
      return '📄';
    case 'pdf':
      return '📕';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
      return '🖼️';
    case 'mp4':
    case 'avi':
    case 'mov':
      return '🎬';
    case 'mp3':
    case 'wav':
    case 'flac':
      return '🎵';
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return '📦';
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return '📜';
    case 'html':
    case 'css':
      return '🌐';
    case 'json':
    case 'xml':
      return '📋';
    default:
      return '📄';
  }
}

/**
 * Parse Unix permissions string to number
 */
export function parsePermissions(perms: string): number {
  if (perms.length !== 10) return 0o644;
  
  let mode = 0;
  
  // Owner
  if (perms[1] === 'r') mode += 0o400;
  if (perms[2] === 'w') mode += 0o200;
  if (perms[3] === 'x') mode += 0o100;
  
  // Group
  if (perms[4] === 'r') mode += 0o040;
  if (perms[5] === 'w') mode += 0o020;
  if (perms[6] === 'x') mode += 0o010;
  
  // Others
  if (perms[7] === 'r') mode += 0o004;
  if (perms[8] === 'w') mode += 0o002;
  if (perms[9] === 'x') mode += 0o001;
  
  return mode;
}

/**
 * Format Unix permissions number to string
 */
export function formatPermissions(mode: number): string {
  const owner = (mode >> 6) & 0o7;
  const group = (mode >> 3) & 0o7;
  const others = mode & 0o7;
  
  return `${owner}${group}${others}`;
}

/**
 * Sort entries
 */
export function sortEntries<T extends FtpEntry | LocalEntry>(
  entries: T[],
  sortBy: 'name' | 'size' | 'modified' | 'type',
  sortOrder: 'asc' | 'desc'
): T[] {
  const sorted = [...entries].sort((a, b) => {
    // Directories first
    if (a.is_directory && !b.is_directory) return -1;
    if (!a.is_directory && b.is_directory) return 1;
    
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'modified':
        comparison = a.modified - b.modified;
        break;
      case 'type':
        const extA = a.name.split('.').pop() || '';
        const extB = b.name.split('.').pop() || '';
        comparison = extA.localeCompare(extB);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

/**
 * Filter entries by search term
 */
export function filterEntries<T extends FtpEntry | LocalEntry>(
  entries: T[],
  searchTerm: string
): T[] {
  if (!searchTerm.trim()) return entries;
  
  const term = searchTerm.toLowerCase();
  return entries.filter(entry => 
    entry.name.toLowerCase().includes(term)
  );
}

/**
 * Get parent directory path
 */
export function getParentPath(path: string): string {
  if (path === '/' || path === '') return '/';
  
  const parts = path.split('/').filter(p => p);
  parts.pop();
  
  return '/' + parts.join('/');
}

/**
 * Join path parts
 */
export function joinPath(...parts: string[]): string {
  return parts
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
}

/**
 * Get basename from path
 */
export function getBasename(path: string): string {
  const parts = path.split('/').filter(p => p);
  return parts[parts.length - 1] || '/';
}

/**
 * Validate site configuration
 */
export function validateSite(site: Partial<CreateSiteRequest>): string | null {
  if (!site.name?.trim()) {
    return 'Site name is required';
  }
  
  if (!site.host?.trim()) {
    return 'Host is required';
  }
  
  if (!site.username?.trim()) {
    return 'Username is required';
  }
  
  if (site.port && (site.port < 1 || site.port > 65535)) {
    return 'Port must be between 1 and 65535';
  }
  
  return null;
}

/**
 * Get default site settings
 */
export function getDefaultSiteSettings(): Partial<FtpSite> {
  return {
    protocol: 'sftp',
    port: 22,
    passive_mode: true,
    transfer_mode: 'auto',
    remote_path: '/',
    local_path: '/Users',
    max_connections: 5,
    retry_attempts: 3,
    timeout_seconds: 30,
  };
}

/**
 * Get default transfer stats
 */
export function getDefaultTransferStats(): TransferStats {
  return {
    total_transfers: 0,
    active_transfers: 0,
    completed_transfers: 0,
    failed_transfers: 0,
    total_bytes_transferred: 0,
    average_speed: 0,
  };
}

/**
 * Calculate transfer stats from queue
 */
export function calculateTransferStats(queue: TransferItem[]): TransferStats {
  return {
    total_transfers: queue.length,
    active_transfers: queue.filter(t => t.status === 'transferring').length,
    completed_transfers: queue.filter(t => t.status === 'completed').length,
    failed_transfers: queue.filter(t => t.status === 'failed').length,
    total_bytes_transferred: queue.reduce((sum, t) => sum + t.bytes_transferred, 0),
    average_speed: queue.length > 0
      ? queue.reduce((sum, t) => sum + t.speed, 0) / queue.length
      : 0,
  };
}
