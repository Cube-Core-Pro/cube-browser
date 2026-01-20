/**
 * Cloud Sync Store - Synchronizes user settings with central admin server
 * Enables cross-device settings sync, backup/restore, and online account management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CloudSyncStatus {
  lastSync: string | null;
  isSyncing: boolean;
  syncError: string | null;
  pendingChanges: number;
  conflictCount: number;
}

export interface SyncableData {
  settings: boolean;
  passwords: boolean;
  bookmarks: boolean;
  collections: boolean;
  macros: boolean;
  workflows: boolean;
  themes: boolean;
  extensions: boolean;
}

export interface DeviceInfo {
  id: string;
  name: string;
  platform: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'extension';
  lastActive: string;
  isCurrentDevice: boolean;
  browser?: string;
  version: string;
}

export interface CloudBackup {
  id: string;
  name: string;
  createdAt: string;
  size: string;
  dataTypes: string[];
  isAutomatic: boolean;
}

export interface OnlinePortalSettings {
  portalUrl: string;
  billingUrl: string;
  supportUrl: string;
  docsUrl: string;
  apiEndpoint: string;
}

interface CloudSyncState {
  // Connection
  isConnected: boolean;
  userId: string | null;
  sessionToken: string | null;
  
  // Sync settings
  syncEnabled: boolean;
  syncOnStartup: boolean;
  syncInterval: 'realtime' | '5min' | '15min' | '30min' | 'hourly' | 'manual';
  syncableData: SyncableData;
  
  // Status
  status: CloudSyncStatus;
  
  // Devices
  devices: DeviceInfo[];
  currentDeviceId: string | null;
  
  // Backups
  backups: CloudBackup[];
  autoBackupEnabled: boolean;
  autoBackupInterval: 'daily' | 'weekly' | 'monthly';
  
  // Portal
  portalSettings: OnlinePortalSettings;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setUserId: (userId: string | null) => void;
  setSessionToken: (token: string | null) => void;
  setSyncEnabled: (enabled: boolean) => void;
  setSyncOnStartup: (enabled: boolean) => void;
  setSyncInterval: (interval: CloudSyncState['syncInterval']) => void;
  updateSyncableData: (data: Partial<SyncableData>) => void;
  setStatus: (status: Partial<CloudSyncStatus>) => void;
  setDevices: (devices: DeviceInfo[]) => void;
  addDevice: (device: DeviceInfo) => void;
  removeDevice: (deviceId: string) => void;
  setCurrentDeviceId: (deviceId: string) => void;
  setBackups: (backups: CloudBackup[]) => void;
  addBackup: (backup: CloudBackup) => void;
  deleteBackup: (backupId: string) => void;
  setAutoBackupEnabled: (enabled: boolean) => void;
  setAutoBackupInterval: (interval: CloudSyncState['autoBackupInterval']) => void;
  
  // Sync actions
  startSync: () => void;
  completeSync: () => void;
  failSync: (error: string) => void;
  
  // Reset
  disconnect: () => void;
}

const defaultSyncableData: SyncableData = {
  settings: true,
  passwords: true,
  bookmarks: true,
  collections: true,
  macros: true,
  workflows: true,
  themes: true,
  extensions: false,
};

const defaultPortalSettings: OnlinePortalSettings = {
  portalUrl: 'https://account.cubeai.tools',
  billingUrl: 'https://account.cubeai.tools/billing',
  supportUrl: 'https://support.cubeai.tools',
  docsUrl: 'https://docs.cubeai.tools',
  apiEndpoint: 'https://api.cubeai.tools/v1',
};

const defaultStatus: CloudSyncStatus = {
  lastSync: null,
  isSyncing: false,
  syncError: null,
  pendingChanges: 0,
  conflictCount: 0,
};

export const useCloudSyncStore = create<CloudSyncState>()(
  persist(
    (set, get) => ({
      // Connection
      isConnected: false,
      userId: null,
      sessionToken: null,
      
      // Sync settings
      syncEnabled: true,
      syncOnStartup: true,
      syncInterval: '15min',
      syncableData: defaultSyncableData,
      
      // Status
      status: defaultStatus,
      
      // Devices
      devices: [],
      currentDeviceId: null,
      
      // Backups
      backups: [],
      autoBackupEnabled: true,
      autoBackupInterval: 'weekly',
      
      // Portal
      portalSettings: defaultPortalSettings,
      
      // Actions
      setConnected: (connected) => set({ isConnected: connected }),
      
      setUserId: (userId) => set({ userId }),
      
      setSessionToken: (token) => set({ sessionToken: token }),
      
      setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),
      
      setSyncOnStartup: (enabled) => set({ syncOnStartup: enabled }),
      
      setSyncInterval: (interval) => set({ syncInterval: interval }),
      
      updateSyncableData: (data) => set((state) => ({
        syncableData: { ...state.syncableData, ...data }
      })),
      
      setStatus: (newStatus) => set((state) => ({
        status: { ...state.status, ...newStatus }
      })),
      
      setDevices: (devices) => set({ devices }),
      
      addDevice: (device) => set((state) => ({
        devices: [...state.devices, device]
      })),
      
      removeDevice: (deviceId) => set((state) => ({
        devices: state.devices.filter(d => d.id !== deviceId)
      })),
      
      setCurrentDeviceId: (deviceId) => set({ currentDeviceId: deviceId }),
      
      setBackups: (backups) => set({ backups }),
      
      addBackup: (backup) => set((state) => ({
        backups: [backup, ...state.backups].slice(0, 20)
      })),
      
      deleteBackup: (backupId) => set((state) => ({
        backups: state.backups.filter(b => b.id !== backupId)
      })),
      
      setAutoBackupEnabled: (enabled) => set({ autoBackupEnabled: enabled }),
      
      setAutoBackupInterval: (interval) => set({ autoBackupInterval: interval }),
      
      // Sync actions
      startSync: () => set((state) => ({
        status: { ...state.status, isSyncing: true, syncError: null }
      })),
      
      completeSync: () => set((state) => ({
        status: {
          ...state.status,
          isSyncing: false,
          lastSync: new Date().toISOString(),
          pendingChanges: 0,
          syncError: null
        }
      })),
      
      failSync: (error) => set((state) => ({
        status: { ...state.status, isSyncing: false, syncError: error }
      })),
      
      // Reset
      disconnect: () => set({
        isConnected: false,
        userId: null,
        sessionToken: null,
        status: defaultStatus,
        devices: [],
      }),
    }),
    {
      name: 'cube-cloud-sync-store',
      partialize: (state) => ({
        syncEnabled: state.syncEnabled,
        syncOnStartup: state.syncOnStartup,
        syncInterval: state.syncInterval,
        syncableData: state.syncableData,
        currentDeviceId: state.currentDeviceId,
        autoBackupEnabled: state.autoBackupEnabled,
        autoBackupInterval: state.autoBackupInterval,
      }),
    }
  )
);

export default useCloudSyncStore;
