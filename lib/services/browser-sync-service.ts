// CUBE Nexum - Sync Service TypeScript Client
// Complete TypeScript client for cross-device sync

import { invoke } from '@tauri-apps/api/core';

// ==================== Types ====================

export type SyncStatus = 'Idle' | 'Syncing' | { Error: string } | 'Paused' | 'Offline';

export type SyncDataType =
  | 'Tabs'
  | 'Bookmarks'
  | 'History'
  | 'Passwords'
  | 'Extensions'
  | 'Settings'
  | 'Autofill'
  | 'ReadingList'
  | 'Notes'
  | 'Workspaces';

export type ConflictResolution = 'ServerWins' | 'ClientWins' | 'MostRecent' | 'Manual';

export type DeviceType = 'Desktop' | 'Laptop' | 'Mobile' | 'Tablet' | 'Unknown';

export type SubscriptionTier = 'Free' | 'Pro' | 'Enterprise';

export type SyncType = 'Full' | 'Incremental' | { DataType: SyncDataType } | 'Manual';

export type SyncResultStatus = 'Success' | 'PartialSuccess' | 'Failed' | 'Cancelled' | 'InProgress';

export type KeyType = 'Primary' | 'Recovery' | 'Device';

export interface SyncSettings {
  sync_enabled: boolean;
  sync_frequency_minutes: number;
  sync_on_startup: boolean;
  sync_on_change: boolean;
  sync_tabs: boolean;
  sync_bookmarks: boolean;
  sync_history: boolean;
  sync_passwords: boolean;
  sync_extensions: boolean;
  sync_settings: boolean;
  sync_autofill: boolean;
  sync_reading_list: boolean;
  sync_notes: boolean;
  sync_workspaces: boolean;
  e2e_encryption_enabled: boolean;
  encryption_key_id: string | null;
  wifi_only: boolean;
  data_limit_mb: number | null;
  conflict_resolution: ConflictResolution;
}

export interface SyncDevice {
  device_id: string;
  device_name: string;
  device_type: DeviceType;
  os: string;
  browser_version: string;
  last_sync: string;
  is_current: boolean;
  sync_enabled: boolean;
  created_at: string;
}

export interface SyncAccount {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_login: string;
  subscription_tier: SubscriptionTier;
  storage_used_bytes: number;
  storage_limit_bytes: number;
}

export interface SyncItem {
  id: string;
  data_type: SyncDataType;
  data: unknown;
  version: number;
  created_at: string;
  modified_at: string;
  device_id: string;
  is_deleted: boolean;
  checksum: string;
}

export interface SyncConflict {
  id: string;
  item_id: string;
  data_type: SyncDataType;
  local_version: SyncItem;
  server_version: SyncItem;
  detected_at: string;
  resolved: boolean;
  resolution: ConflictResolution | null;
}

export interface SyncHistory {
  id: string;
  sync_type: SyncType;
  started_at: string;
  completed_at: string | null;
  status: SyncResultStatus;
  items_uploaded: number;
  items_downloaded: number;
  bytes_uploaded: number;
  bytes_downloaded: number;
  errors: string[];
}

export interface SyncStats {
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  total_items_synced: number;
  total_bytes_uploaded: number;
  total_bytes_downloaded: number;
  last_sync: string | null;
  next_sync: string | null;
  average_sync_duration_ms: number;
  items_by_type: Record<string, number>;
}

export interface EncryptionKey {
  key_id: string;
  key_type: KeyType;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface SyncExportData {
  settings: SyncSettings;
  devices: SyncDevice[];
  stats: SyncStats;
  exported_at: string;
}

// ==================== Settings Commands ====================

export async function getSyncSettings(): Promise<SyncSettings> {
  return invoke<SyncSettings>('sync_get_settings');
}

export async function updateSyncSettings(settings: SyncSettings): Promise<void> {
  return invoke('sync_update_settings', { settings });
}

export async function toggleSync(enabled: boolean): Promise<void> {
  return invoke('sync_toggle', { enabled });
}

export async function setSyncDataType(
  dataType: SyncDataType,
  enabled: boolean
): Promise<void> {
  return invoke('sync_set_data_type', { data_type: dataType, enabled });
}

// ==================== Status Commands ====================

export async function getSyncStatus(): Promise<SyncStatus> {
  return invoke<SyncStatus>('sync_get_status');
}

export async function isSyncing(): Promise<boolean> {
  return invoke<boolean>('sync_is_syncing');
}

// ==================== Account Commands ====================

export async function syncLogin(email: string, userId: string): Promise<SyncAccount> {
  return invoke<SyncAccount>('sync_login', { email, user_id: userId });
}

export async function syncLogout(): Promise<void> {
  return invoke('sync_logout');
}

export async function getSyncAccount(): Promise<SyncAccount | null> {
  return invoke<SyncAccount | null>('sync_get_account');
}

export async function isSyncLoggedIn(): Promise<boolean> {
  return invoke<boolean>('sync_is_logged_in');
}

// ==================== Device Commands ====================

export async function getSyncDevices(): Promise<SyncDevice[]> {
  return invoke<SyncDevice[]>('sync_get_devices');
}

export async function getCurrentDevice(): Promise<SyncDevice | null> {
  return invoke<SyncDevice | null>('sync_get_current_device');
}

export async function getSyncDevice(deviceId: string): Promise<SyncDevice | null> {
  return invoke<SyncDevice | null>('sync_get_device', { device_id: deviceId });
}

export async function renameSyncDevice(deviceId: string, newName: string): Promise<void> {
  return invoke('sync_rename_device', { device_id: deviceId, new_name: newName });
}

export async function removeSyncDevice(deviceId: string): Promise<void> {
  return invoke('sync_remove_device', { device_id: deviceId });
}

export async function toggleDeviceSync(deviceId: string, enabled: boolean): Promise<void> {
  return invoke('sync_toggle_device', { device_id: deviceId, enabled });
}

// ==================== Sync Operations Commands ====================

export async function queueSyncItem(dataType: SyncDataType, data: unknown): Promise<string> {
  return invoke<string>('sync_queue_item', { data_type: dataType, data });
}

export async function getSyncQueue(): Promise<SyncItem[]> {
  return invoke<SyncItem[]>('sync_get_queue');
}

export async function clearSyncQueue(): Promise<void> {
  return invoke('sync_clear_queue');
}

export async function startSync(): Promise<string> {
  return invoke<string>('sync_start');
}

export async function completeSync(
  historyId: string,
  success: boolean,
  itemsUp: number,
  itemsDown: number,
  bytesUp: number,
  bytesDown: number
): Promise<void> {
  return invoke('sync_complete', {
    history_id: historyId,
    success,
    items_up: itemsUp,
    items_down: itemsDown,
    bytes_up: bytesUp,
    bytes_down: bytesDown,
  });
}

export async function cancelSync(historyId: string): Promise<void> {
  return invoke('sync_cancel', { history_id: historyId });
}

export async function syncDataType(dataType: SyncDataType): Promise<string> {
  return invoke<string>('sync_data_type', { data_type: dataType });
}

// ==================== Conflict Commands ====================

export async function getSyncConflicts(): Promise<SyncConflict[]> {
  return invoke<SyncConflict[]>('sync_get_conflicts');
}

export async function getUnresolvedConflicts(): Promise<SyncConflict[]> {
  return invoke<SyncConflict[]>('sync_get_unresolved_conflicts');
}

export async function resolveSyncConflict(
  conflictId: string,
  resolution: ConflictResolution
): Promise<void> {
  return invoke('sync_resolve_conflict', { conflict_id: conflictId, resolution });
}

export async function resolveWithLocal(conflictId: string): Promise<void> {
  return invoke('sync_resolve_with_local', { conflict_id: conflictId });
}

export async function resolveWithServer(conflictId: string): Promise<void> {
  return invoke('sync_resolve_with_server', { conflict_id: conflictId });
}

// ==================== History Commands ====================

export async function getSyncHistory(limit?: number): Promise<SyncHistory[]> {
  return invoke<SyncHistory[]>('sync_get_history', { limit });
}

export async function getLastSync(): Promise<SyncHistory | null> {
  return invoke<SyncHistory | null>('sync_get_last');
}

export async function clearSyncHistory(): Promise<void> {
  return invoke('sync_clear_history');
}

// ==================== Encryption Commands ====================

export async function generateEncryptionKey(): Promise<EncryptionKey> {
  return invoke<EncryptionKey>('sync_generate_key');
}

export async function getEncryptionKeys(): Promise<EncryptionKey[]> {
  return invoke<EncryptionKey[]>('sync_get_keys');
}

export async function getActiveEncryptionKey(): Promise<EncryptionKey | null> {
  return invoke<EncryptionKey | null>('sync_get_active_key');
}

export async function rotateEncryptionKey(): Promise<EncryptionKey> {
  return invoke<EncryptionKey>('sync_rotate_key');
}

export async function createRecoveryKey(): Promise<EncryptionKey> {
  return invoke<EncryptionKey>('sync_create_recovery_key');
}

// ==================== Statistics Commands ====================

export async function getSyncStats(): Promise<SyncStats> {
  return invoke<SyncStats>('sync_get_stats');
}

export async function getStorageUsage(): Promise<[number, number]> {
  return invoke<[number, number]>('sync_get_storage_usage');
}

export async function resetSyncStats(): Promise<void> {
  return invoke('sync_reset_stats');
}

// ==================== Export/Import Commands ====================

export async function exportSyncData(): Promise<SyncExportData> {
  return invoke<SyncExportData>('sync_export');
}

export async function importSyncData(data: SyncExportData): Promise<void> {
  return invoke('sync_import', { data });
}

// ==================== Helper Functions ====================

export function formatDeviceType(type: DeviceType): string {
  const types: Record<DeviceType, string> = {
    Desktop: '🖥️ Desktop',
    Laptop: '💻 Laptop',
    Mobile: '📱 Mobile',
    Tablet: '📱 Tablet',
    Unknown: '❓ Unknown',
  };
  return types[type] || type;
}

export function formatDataType(type: SyncDataType): string {
  const types: Record<SyncDataType, string> = {
    Tabs: '📑 Tabs',
    Bookmarks: '⭐ Bookmarks',
    History: '📜 History',
    Passwords: '🔐 Passwords',
    Extensions: '🧩 Extensions',
    Settings: '⚙️ Settings',
    Autofill: '📝 Autofill',
    ReadingList: '📚 Reading List',
    Notes: '📔 Notes',
    Workspaces: '🗂️ Workspaces',
  };
  return types[type] || type;
}

export function formatSyncStatus(status: SyncStatus): string {
  if (typeof status === 'string') {
    const statuses: Record<string, string> = {
      Idle: '✅ Ready',
      Syncing: '🔄 Syncing...',
      Paused: '⏸️ Paused',
      Offline: '📵 Offline',
    };
    return statuses[status] || status;
  }
  if ('Error' in status) {
    return `❌ Error: ${status.Error}`;
  }
  return 'Unknown';
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatStorageUsage(used: number, total: number): string {
  const percentage = total > 0 ? ((used / total) * 100).toFixed(1) : '0';
  return `${formatBytes(used)} / ${formatBytes(total)} (${percentage}%)`;
}

export function getStorageColor(used: number, total: number): string {
  if (total === 0) return '#6b7280';
  const percentage = (used / total) * 100;
  if (percentage >= 90) return '#ef4444'; // Red
  if (percentage >= 70) return '#f97316'; // Orange
  if (percentage >= 50) return '#eab308'; // Yellow
  return '#22c55e'; // Green
}

export function formatTimeSinceSync(lastSync: string | null): string {
  if (!lastSync) return 'Never';
  
  const diff = Date.now() - new Date(lastSync).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
}

export function isDataTypeEnabled(settings: SyncSettings, type: SyncDataType): boolean {
  const mapping: Record<SyncDataType, keyof SyncSettings> = {
    Tabs: 'sync_tabs',
    Bookmarks: 'sync_bookmarks',
    History: 'sync_history',
    Passwords: 'sync_passwords',
    Extensions: 'sync_extensions',
    Settings: 'sync_settings',
    Autofill: 'sync_autofill',
    ReadingList: 'sync_reading_list',
    Notes: 'sync_notes',
    Workspaces: 'sync_workspaces',
  };
  return settings[mapping[type]] as boolean;
}

export const ALL_SYNC_DATA_TYPES: SyncDataType[] = [
  'Tabs',
  'Bookmarks',
  'History',
  'Passwords',
  'Extensions',
  'Settings',
  'Autofill',
  'ReadingList',
  'Notes',
  'Workspaces',
];

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  sync_enabled: true,
  sync_frequency_minutes: 15,
  sync_on_startup: true,
  sync_on_change: true,
  sync_tabs: true,
  sync_bookmarks: true,
  sync_history: true,
  sync_passwords: true,
  sync_extensions: false,
  sync_settings: true,
  sync_autofill: true,
  sync_reading_list: true,
  sync_notes: true,
  sync_workspaces: true,
  e2e_encryption_enabled: true,
  encryption_key_id: null,
  wifi_only: false,
  data_limit_mb: null,
  conflict_resolution: 'ServerWins',
};
