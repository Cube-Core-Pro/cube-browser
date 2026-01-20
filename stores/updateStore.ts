/**
 * Update Store - Manages application updates for Tauri and Extension
 * Syncs with central admin panel for version control and distribution
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  size: string;
  changelog: string[];
  mandatory: boolean;
  downloadUrl: string;
  checksum: string;
  platform: 'windows' | 'macos' | 'linux' | 'extension' | 'all';
}

export interface UpdateSettings {
  autoCheck: boolean;
  autoDownload: boolean;
  autoInstall: boolean;
  checkInterval: 'hourly' | 'daily' | 'weekly' | 'manual';
  channel: 'stable' | 'beta' | 'nightly';
  notifyOnUpdate: boolean;
  installOnExit: boolean;
}

export interface UpdateHistory {
  version: string;
  installedAt: string;
  previousVersion: string;
  success: boolean;
  notes?: string;
}

export interface UpdateProgress {
  status: 'idle' | 'checking' | 'downloading' | 'installing' | 'completed' | 'error';
  progress: number;
  bytesDownloaded: number;
  totalBytes: number;
  speed: string;
  eta: string;
  error?: string;
}

interface UpdateState {
  currentVersion: string;
  extensionVersion: string;
  latestVersion: UpdateInfo | null;
  latestExtensionVersion: UpdateInfo | null;
  settings: UpdateSettings;
  progress: UpdateProgress;
  updateHistory: UpdateHistory[];
  lastChecked: string | null;
  
  // Actions
  setCurrentVersion: (version: string) => void;
  setExtensionVersion: (version: string) => void;
  setLatestVersion: (info: UpdateInfo | null) => void;
  setLatestExtensionVersion: (info: UpdateInfo | null) => void;
  updateSettings: (settings: Partial<UpdateSettings>) => void;
  setProgress: (progress: Partial<UpdateProgress>) => void;
  addToHistory: (entry: UpdateHistory) => void;
  setLastChecked: (date: string) => void;
  
  // Computed
  isUpdateAvailable: () => boolean;
  isExtensionUpdateAvailable: () => boolean;
  
  // Reset
  resetProgress: () => void;
}

const defaultSettings: UpdateSettings = {
  autoCheck: true,
  autoDownload: false,
  autoInstall: false,
  checkInterval: 'daily',
  channel: 'stable',
  notifyOnUpdate: true,
  installOnExit: true,
};

const defaultProgress: UpdateProgress = {
  status: 'idle',
  progress: 0,
  bytesDownloaded: 0,
  totalBytes: 0,
  speed: '0 KB/s',
  eta: '--',
};

export const useUpdateStore = create<UpdateState>()(
  persist(
    (set, get) => ({
      currentVersion: '7.0.0',
      extensionVersion: '7.0.0',
      latestVersion: null,
      latestExtensionVersion: null,
      settings: defaultSettings,
      progress: defaultProgress,
      updateHistory: [],
      lastChecked: null,
      
      setCurrentVersion: (version) => set({ currentVersion: version }),
      
      setExtensionVersion: (version) => set({ extensionVersion: version }),
      
      setLatestVersion: (info) => set({ latestVersion: info }),
      
      setLatestExtensionVersion: (info) => set({ latestExtensionVersion: info }),
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      setProgress: (newProgress) => set((state) => ({
        progress: { ...state.progress, ...newProgress }
      })),
      
      addToHistory: (entry) => set((state) => ({
        updateHistory: [entry, ...state.updateHistory].slice(0, 50)
      })),
      
      setLastChecked: (date) => set({ lastChecked: date }),
      
      isUpdateAvailable: () => {
        const state = get();
        if (!state.latestVersion) return false;
        return compareVersions(state.latestVersion.version, state.currentVersion) > 0;
      },
      
      isExtensionUpdateAvailable: () => {
        const state = get();
        if (!state.latestExtensionVersion) return false;
        return compareVersions(state.latestExtensionVersion.version, state.extensionVersion) > 0;
      },
      
      resetProgress: () => set({ progress: defaultProgress }),
    }),
    {
      name: 'cube-update-store',
      partialize: (state) => ({
        currentVersion: state.currentVersion,
        extensionVersion: state.extensionVersion,
        settings: state.settings,
        updateHistory: state.updateHistory,
        lastChecked: state.lastChecked,
      }),
    }
  )
);

/**
 * Compare semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  
  return 0;
}

export default useUpdateStore;
