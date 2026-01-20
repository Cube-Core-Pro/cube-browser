/**
 * Settings Service - Application Settings & Updates Integration Layer
 * CUBE Nexum v7 - Complete Settings Operations Service
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Types
// ============================================================================

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  size: string;
  changelog: string[];
  mandatory: boolean;
  downloadUrl: string;
  checksum: string;
  platform: 'all' | 'windows' | 'macos' | 'linux';
}

export interface UpdateProgress {
  status: 'idle' | 'checking' | 'downloading' | 'installing' | 'completed' | 'error';
  progress?: number;
  bytesDownloaded?: number;
  totalBytes?: number;
  speed?: string;
  eta?: string;
  error?: string;
}

export interface UpdateSettings {
  autoCheck: boolean;
  autoDownload: boolean;
  autoInstall: boolean;
  channel: 'stable' | 'beta' | 'nightly';
  notifyOnUpdate: boolean;
}

export interface CloudSyncSettings {
  enabled: boolean;
  syncOnStartup: boolean;
  interval: number;
  syncableData: {
    settings: boolean;
    bookmarks: boolean;
    passwords: boolean;
    history: boolean;
    extensions: boolean;
    automation: boolean;
  };
}

export interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'laptop' | 'tablet' | 'phone';
  platform: string;
  lastSeen: string;
  isCurrent: boolean;
}

export interface Backup {
  id: string;
  name: string;
  date: string;
  size: number;
  type: 'auto' | 'manual';
}

// ============================================================================
// Update Service
// ============================================================================

export const UpdateService = {
  /**
   * Check for available updates
   */
  checkForUpdates: async (): Promise<UpdateInfo | null> => {
    return invoke<UpdateInfo | null>('check_for_updates');
  },

  /**
   * Download an available update
   */
  downloadUpdate: async (version: string): Promise<void> => {
    return invoke('download_update', { version });
  },

  /**
   * Install a downloaded update
   */
  installUpdate: async (): Promise<void> => {
    return invoke('install_update');
  },

  /**
   * Get update settings
   */
  getSettings: async (): Promise<UpdateSettings> => {
    return invoke<UpdateSettings>('get_update_settings');
  },

  /**
   * Update settings
   */
  updateSettings: async (settings: Partial<UpdateSettings>): Promise<void> => {
    return invoke('update_update_settings', { settings });
  },

  /**
   * Get update history
   */
  getHistory: async (): Promise<UpdateInfo[]> => {
    return invoke<UpdateInfo[]>('get_update_history');
  },
};

// ============================================================================
// Cloud Sync Service
// ============================================================================

export const CloudSyncService = {
  /**
   * Get sync status
   */
  getStatus: async (): Promise<{ connected: boolean; lastSync: string | null }> => {
    try {
      const isAuth = await invoke<boolean>('cloud_is_authenticated');
      const _config = await invoke<CloudSyncSettings>('get_sync_config');
      return {
        connected: isAuth,
        lastSync: null, // Can be derived from config if needed
      };
    } catch {
      return { connected: false, lastSync: null };
    }
  },

  /**
   * Get sync settings
   */
  getSettings: async (): Promise<CloudSyncSettings> => {
    return invoke<CloudSyncSettings>('get_sync_config');
  },

  /**
   * Update sync settings
   */
  updateSettings: async (settings: Partial<CloudSyncSettings>): Promise<void> => {
    return invoke('set_sync_config', { config: settings });
  },

  /**
   * Trigger manual sync (push to cloud)
   */
  syncNow: async (): Promise<void> => {
    await invoke('sync_to_cloud', { dataType: 'all' });
  },

  /**
   * Get connected devices
   */
  getDevices: async (): Promise<Device[]> => {
    return invoke<Device[]>('get_synced_devices');
  },

  /**
   * Remove a synced device
   */
  removeDevice: async (deviceId: string): Promise<void> => {
    return invoke('remove_device', { deviceId });
  },
};

// ============================================================================
// Backup Service
// ============================================================================

export const BackupService = {
  /**
   * Get all backups
   */
  getBackups: async (): Promise<Backup[]> => {
    const history = await invoke<{ backups: Backup[] }>('get_backup_history');
    return history.backups || [];
  },

  /**
   * Create a manual backup
   */
  createBackup: async (name?: string): Promise<Backup> => {
    const filename = name || `backup_${Date.now()}`;
    const content = JSON.stringify({ timestamp: Date.now() });
    await invoke('create_backup', { filename, content, reason: name || 'manual' });
    // Return a backup object with the created info
    return {
      id: filename,
      name: filename,
      date: new Date().toISOString(),
      size: content.length,
      type: 'manual',
    };
  },

  /**
   * Restore from a backup (read backup file)
   */
  restoreBackup: async (backupId: string): Promise<void> => {
    await invoke('read_backup_file', { backupId });
  },

  /**
   * Delete a backup
   */
  deleteBackup: async (backupId: string): Promise<void> => {
    return invoke('delete_backup', { backupId });
  },

  /**
   * Export backup to file
   */
  exportBackup: async (backupId: string): Promise<string> => {
    return invoke<string>('export_backup', { backupId });
  },

  /**
   * Import backup from file
   */
  importBackup: async (filePath: string): Promise<Backup> => {
    return invoke<Backup>('import_backup', { filePath });
  },

  /**
   * Get auto-backup settings
   */
  getAutoBackupSettings: async (): Promise<{ enabled: boolean; interval: number }> => {
    return invoke<{ enabled: boolean; interval: number }>('get_auto_backup_settings');
  },

  /**
   * Update auto-backup settings
   */
  updateAutoBackupSettings: async (enabled: boolean, interval: number): Promise<void> => {
    return invoke('update_auto_backup_settings', { enabled, interval });
  },
};

// ============================================================================
// Main Settings Service Export
// ============================================================================

export const SettingsService = {
  Update: UpdateService,
  CloudSync: CloudSyncService,
  Backup: BackupService,
};

export default SettingsService;
