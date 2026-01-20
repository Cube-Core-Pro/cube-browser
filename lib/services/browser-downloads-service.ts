/**
 * CUBE Nexum - Downloads Manager Service
 * Superior to Chrome, Firefox, Safari, Brave download managers
 * TypeScript service for Tauri backend integration
 */

import { invoke } from '@tauri-apps/api/core';

// ==================== Enums ====================

export type DownloadStatus = 
  | 'Pending'
  | 'Downloading'
  | 'Paused'
  | 'Completed'
  | 'Failed'
  | 'Cancelled'
  | 'Queued'
  | 'Verifying'
  | 'Extracting';

export type DownloadPriority = 'Low' | 'Normal' | 'High' | 'Critical';

export type FileCategory = 
  | 'Document'
  | 'Image'
  | 'Video'
  | 'Audio'
  | 'Archive'
  | 'Executable'
  | 'Code'
  | 'Font'
  | 'Ebook'
  | 'Other';

export type DownloadAction = 
  | 'Open'
  | 'OpenFolder'
  | 'Delete'
  | 'Retry'
  | 'CopyLink'
  | 'Rename'
  | 'MoveToCategory';

export type SpeedUnit = 'BPS' | 'KBPS' | 'MBPS' | 'Auto';

export type ScheduleType = 
  | 'Immediate'
  | 'Scheduled'
  | 'WhenIdle'
  | 'OnWifi'
  | 'OffPeakHours';

// ==================== Interfaces ====================

export interface DownloadSettings {
  enabled: boolean;
  default_directory: string;
  ask_where_to_save: boolean;
  show_download_panel: boolean;
  auto_open_when_done: boolean;
  notify_on_complete: boolean;
  sound_on_complete: boolean;
  max_concurrent_downloads: number;
  max_connections_per_download: number;
  bandwidth_limit_enabled: boolean;
  bandwidth_limit_kbps: number;
  auto_resume_on_startup: boolean;
  virus_scan_enabled: boolean;
  auto_extract_archives: boolean;
  organize_by_type: boolean;
  schedule_enabled: boolean;
  off_peak_start_hour: number;
  off_peak_end_hour: number;
  category_folders: Record<string, string>;
  blocked_extensions: string[];
  blocked_domains: string[];
  download_history_days: number;
}

export interface Download {
  id: string;
  url: string;
  filename: string;
  file_path: string;
  mime_type: string;
  category: FileCategory;
  status: DownloadStatus;
  priority: DownloadPriority;
  total_bytes: number;
  downloaded_bytes: number;
  speed_bps: number;
  eta_seconds: number;
  connections: number;
  resumable: boolean;
  created_at: number;
  started_at: number | null;
  completed_at: number | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  referrer: string | null;
  source_tab_id: string | null;
  tags: string[];
  checksum: string | null;
  checksum_type: string | null;
  schedule_type: ScheduleType;
  scheduled_time: number | null;
  auto_extract: boolean;
  virus_scanned: boolean;
  virus_clean: boolean | null;
}

export interface DownloadQueue {
  id: string;
  name: string;
  download_ids: string[];
  max_concurrent: number;
  bandwidth_limit_kbps: number | null;
  schedule_type: ScheduleType;
  created_at: number;
  paused: boolean;
}

export interface DownloadStats {
  total_downloads: number;
  completed_downloads: number;
  failed_downloads: number;
  total_bytes_downloaded: number;
  average_speed_bps: number;
  downloads_today: number;
  bytes_today: number;
  downloads_this_week: number;
  bytes_this_week: number;
  category_stats: Record<string, number>;
}

export interface BandwidthSchedule {
  hour: number;
  limit_kbps: number;
  enabled: boolean;
}

export interface DownloadFilter {
  status?: DownloadStatus;
  category?: FileCategory;
  priority?: DownloadPriority;
  search_query?: string;
  date_from?: number;
  date_to?: number;
  min_size?: number;
  max_size?: number;
  tags: string[];
}

// ==================== Settings Functions ====================

export async function getDownloadSettings(): Promise<DownloadSettings> {
  return invoke<DownloadSettings>('download_get_settings');
}

export async function updateDownloadSettings(settings: DownloadSettings): Promise<void> {
  return invoke('download_update_settings', { settings });
}

export async function setDefaultDirectory(directory: string): Promise<void> {
  return invoke('download_set_default_directory', { directory });
}

export async function setMaxConcurrent(max: number): Promise<void> {
  return invoke('download_set_max_concurrent', { max });
}

export async function setBandwidthLimit(enabled: boolean, limitKbps: number): Promise<void> {
  return invoke('download_set_bandwidth_limit', { enabled, limitKbps });
}

export async function setCategoryFolder(category: string, folder: string): Promise<void> {
  return invoke('download_set_category_folder', { category, folder });
}

export async function addBlockedExtension(ext: string): Promise<void> {
  return invoke('download_add_blocked_extension', { ext });
}

export async function removeBlockedExtension(ext: string): Promise<void> {
  return invoke('download_remove_blocked_extension', { ext });
}

// ==================== Download Operations ====================

export async function createDownload(
  url: string, 
  filename?: string, 
  directory?: string
): Promise<Download> {
  return invoke<Download>('download_create', { url, filename, directory });
}

export async function startDownload(downloadId: string): Promise<Download> {
  return invoke<Download>('download_start', { downloadId });
}

export async function pauseDownload(downloadId: string): Promise<Download> {
  return invoke<Download>('download_pause', { downloadId });
}

export async function resumeDownload(downloadId: string): Promise<Download> {
  return invoke<Download>('download_resume', { downloadId });
}

export async function cancelDownload(downloadId: string): Promise<void> {
  return invoke('download_cancel', { downloadId });
}

export async function retryDownload(downloadId: string): Promise<Download> {
  return invoke<Download>('download_retry', { downloadId });
}

export async function deleteDownload(downloadId: string, deleteFile: boolean): Promise<void> {
  return invoke('download_delete', { downloadId, deleteFile });
}

export async function updateDownloadProgress(
  downloadId: string,
  downloaded: number,
  total: number,
  speed: number
): Promise<void> {
  return invoke('download_update_progress', { downloadId, downloaded, total, speed });
}

export async function setDownloadFailed(downloadId: string, error: string): Promise<void> {
  return invoke('download_set_failed', { downloadId, error });
}

// ==================== Download Management ====================

export async function getDownload(downloadId: string): Promise<Download | null> {
  return invoke<Download | null>('download_get', { downloadId });
}

export async function getAllDownloads(): Promise<Download[]> {
  return invoke<Download[]>('download_get_all');
}

export async function getActiveDownloads(): Promise<Download[]> {
  return invoke<Download[]>('download_get_active');
}

export async function getDownloadsByStatus(status: DownloadStatus): Promise<Download[]> {
  return invoke<Download[]>('download_get_by_status', { status });
}

export async function getDownloadsByCategory(category: FileCategory): Promise<Download[]> {
  return invoke<Download[]>('download_get_by_category', { category });
}

export async function filterDownloads(filter: DownloadFilter): Promise<Download[]> {
  return invoke<Download[]>('download_filter', { filter });
}

export async function searchDownloads(query: string): Promise<Download[]> {
  return invoke<Download[]>('download_search', { query });
}

// ==================== Priority & Scheduling ====================

export async function setDownloadPriority(
  downloadId: string, 
  priority: DownloadPriority
): Promise<void> {
  return invoke('download_set_priority', { downloadId, priority });
}

export async function scheduleDownload(
  downloadId: string,
  scheduleType: ScheduleType,
  time?: number
): Promise<void> {
  return invoke('download_schedule', { downloadId, scheduleType, time });
}

// ==================== Tags ====================

export async function addDownloadTag(downloadId: string, tag: string): Promise<void> {
  return invoke('download_add_tag', { downloadId, tag });
}

export async function removeDownloadTag(downloadId: string, tag: string): Promise<void> {
  return invoke('download_remove_tag', { downloadId, tag });
}

// ==================== Queue Operations ====================

export async function createDownloadQueue(name: string): Promise<DownloadQueue> {
  return invoke<DownloadQueue>('download_create_queue', { name });
}

export async function addToQueue(queueId: string, downloadId: string): Promise<void> {
  return invoke('download_add_to_queue', { queueId, downloadId });
}

export async function removeFromQueue(queueId: string, downloadId: string): Promise<void> {
  return invoke('download_remove_from_queue', { queueId, downloadId });
}

export async function getDownloadQueue(queueId: string): Promise<DownloadQueue | null> {
  return invoke<DownloadQueue | null>('download_get_queue', { queueId });
}

export async function getAllQueues(): Promise<DownloadQueue[]> {
  return invoke<DownloadQueue[]>('download_get_all_queues');
}

export async function deleteQueue(queueId: string): Promise<void> {
  return invoke('download_delete_queue', { queueId });
}

export async function pauseQueue(queueId: string): Promise<void> {
  return invoke('download_pause_queue', { queueId });
}

export async function resumeQueue(queueId: string): Promise<void> {
  return invoke('download_resume_queue', { queueId });
}

// ==================== Bandwidth Schedule ====================

export async function setBandwidthSchedule(schedule: BandwidthSchedule[]): Promise<void> {
  return invoke('download_set_bandwidth_schedule', { schedule });
}

export async function getBandwidthSchedule(): Promise<BandwidthSchedule[]> {
  return invoke<BandwidthSchedule[]>('download_get_bandwidth_schedule');
}

export async function getCurrentBandwidthLimit(): Promise<number | null> {
  return invoke<number | null>('download_get_current_bandwidth_limit');
}

// ==================== Statistics ====================

export async function getDownloadStats(): Promise<DownloadStats> {
  return invoke<DownloadStats>('download_get_stats');
}

export async function getTotalSpeed(): Promise<number> {
  return invoke<number>('download_get_total_speed');
}

export async function getCategoryStats(): Promise<Record<string, number>> {
  return invoke<Record<string, number>>('download_get_category_stats');
}

// ==================== Bulk Operations ====================

export async function pauseAllDownloads(): Promise<number> {
  return invoke<number>('download_pause_all');
}

export async function resumeAllDownloads(): Promise<number> {
  return invoke<number>('download_resume_all');
}

export async function cancelAllDownloads(): Promise<number> {
  return invoke<number>('download_cancel_all');
}

export async function clearCompletedDownloads(): Promise<number> {
  return invoke<number>('download_clear_completed');
}

export async function clearFailedDownloads(): Promise<number> {
  return invoke<number>('download_clear_failed');
}

// ==================== File Operations ====================

export async function openDownloadedFile(downloadId: string): Promise<void> {
  return invoke('download_open_file', { downloadId });
}

export async function openDownloadFolder(downloadId: string): Promise<void> {
  return invoke('download_open_folder', { downloadId });
}

export async function renameDownloadedFile(downloadId: string, newName: string): Promise<void> {
  return invoke('download_rename_file', { downloadId, newName });
}

export async function moveToCategory(downloadId: string, category: FileCategory): Promise<void> {
  return invoke('download_move_to_category', { downloadId, category });
}

// ==================== Virus Scan ====================

export async function scanDownload(downloadId: string): Promise<boolean> {
  return invoke<boolean>('download_scan', { downloadId });
}

// ==================== Export/Import ====================

export async function exportDownloadsList(): Promise<string> {
  return invoke<string>('download_export_list');
}

export async function importDownloadsList(json: string): Promise<number> {
  return invoke<number>('download_import_list', { json });
}

// ==================== Utility Functions ====================

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatSpeed(bytesPerSecond: number): string {
  return formatBytes(bytesPerSecond) + '/s';
}

export function formatEta(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function getFileIcon(category: FileCategory): string {
  const icons: Record<FileCategory, string> = {
    Document: '📄',
    Image: '🖼️',
    Video: '🎬',
    Audio: '🎵',
    Archive: '📦',
    Executable: '⚙️',
    Code: '💻',
    Font: '🔤',
    Ebook: '📚',
    Other: '📁',
  };
  return icons[category] || '📁';
}

export function getStatusColor(status: DownloadStatus): string {
  const colors: Record<DownloadStatus, string> = {
    Pending: '#f59e0b',
    Downloading: '#3b82f6',
    Paused: '#6b7280',
    Completed: '#10b981',
    Failed: '#ef4444',
    Cancelled: '#9ca3af',
    Queued: '#8b5cf6',
    Verifying: '#06b6d4',
    Extracting: '#f97316',
  };
  return colors[status] || '#6b7280';
}

export function getPriorityLabel(priority: DownloadPriority): string {
  const labels: Record<DownloadPriority, string> = {
    Low: '🔽 Low',
    Normal: '➖ Normal',
    High: '🔼 High',
    Critical: '⚡ Critical',
  };
  return labels[priority] || 'Normal';
}

// ==================== Default Export ====================

const BrowserDownloadsService = {
  // Settings
  getSettings: getDownloadSettings,
  updateSettings: updateDownloadSettings,
  setDefaultDirectory,
  setMaxConcurrent,
  setBandwidthLimit,
  setCategoryFolder,
  addBlockedExtension,
  removeBlockedExtension,
  
  // Operations
  create: createDownload,
  start: startDownload,
  pause: pauseDownload,
  resume: resumeDownload,
  cancel: cancelDownload,
  retry: retryDownload,
  delete: deleteDownload,
  updateProgress: updateDownloadProgress,
  setFailed: setDownloadFailed,
  
  // Management
  get: getDownload,
  getAll: getAllDownloads,
  getActive: getActiveDownloads,
  getByStatus: getDownloadsByStatus,
  getByCategory: getDownloadsByCategory,
  filter: filterDownloads,
  search: searchDownloads,
  
  // Priority & Scheduling
  setPriority: setDownloadPriority,
  schedule: scheduleDownload,
  
  // Tags
  addTag: addDownloadTag,
  removeTag: removeDownloadTag,
  
  // Queues
  createQueue: createDownloadQueue,
  addToQueue,
  removeFromQueue,
  getQueue: getDownloadQueue,
  getAllQueues,
  deleteQueue,
  pauseQueue,
  resumeQueue,
  
  // Bandwidth
  setBandwidthSchedule,
  getBandwidthSchedule,
  getCurrentBandwidthLimit,
  
  // Stats
  getStats: getDownloadStats,
  getTotalSpeed,
  getCategoryStats,
  
  // Bulk
  pauseAll: pauseAllDownloads,
  resumeAll: resumeAllDownloads,
  cancelAll: cancelAllDownloads,
  clearCompleted: clearCompletedDownloads,
  clearFailed: clearFailedDownloads,
  
  // File Operations
  openFile: openDownloadedFile,
  openFolder: openDownloadFolder,
  rename: renameDownloadedFile,
  moveToCategory,
  
  // Virus Scan
  scan: scanDownload,
  
  // Export/Import
  export: exportDownloadsList,
  import: importDownloadsList,
  
  // Utils
  formatBytes,
  formatSpeed,
  formatEta,
  getFileIcon,
  getStatusColor,
  getPriorityLabel,
};

export default BrowserDownloadsService;
