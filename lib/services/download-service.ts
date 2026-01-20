/**
 * CUBE Elite v7 - Download Manager Service
 * 
 * Backend integration layer for download management.
 * Connects to Rust Tauri commands for actual download operations.
 * 
 * Features:
 * - Start/pause/resume/cancel downloads
 * - Multi-segment downloading support
 * - Progress tracking
 * - Queue management
 * - File verification
 * 
 * @module lib/services/download-service
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('Downloads');

// ============================================================================
// Types
// ============================================================================

export type DownloadStatus = 
  | 'queued'
  | 'connecting'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'error'
  | 'verifying';

export type DownloadPriority = 'low' | 'normal' | 'high' | 'critical';

export interface DownloadSegment {
  index: number;
  startByte: number;
  endByte: number;
  downloadedBytes: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  speed: number;
  error?: string;
}

export interface Download {
  id: string;
  url: string;
  fileName: string;
  destination: string;
  totalSize: number;
  downloadedSize: number;
  status: DownloadStatus;
  priority: DownloadPriority;
  progress: number;
  speed: number;
  averageSpeed: number;
  timeRemaining: number;
  segments: DownloadSegment[];
  segmentCount: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
  category?: string;
  tags: string[];
  checksum?: {
    algorithm: 'md5' | 'sha1' | 'sha256';
    value: string;
    verified?: boolean;
  };
}

export interface DownloadOptions {
  fileName?: string;
  destination?: string;
  segmentCount?: number;
  priority?: DownloadPriority;
  category?: string;
  tags?: string[];
  maxRetries?: number;
  checksum?: {
    algorithm: 'md5' | 'sha1' | 'sha256';
    value: string;
  };
}

export interface DownloadStats {
  totalDownloads: number;
  activeDownloads: number;
  completedDownloads: number;
  failedDownloads: number;
  pausedDownloads: number;
  totalBytesDownloaded: number;
  currentSpeed: number;
}

export interface DownloadFilters {
  status?: DownloadStatus;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Download Service
// ============================================================================

export const DownloadService = {
  /**
   * Start a new download
   * @param url - URL to download
   * @param options - Download options
   * @returns The created download
   */
  async start(url: string, options?: DownloadOptions): Promise<Download> {
    return invoke<Download>('start_download', {
      url,
      fileName: options?.fileName,
      destination: options?.destination,
      segmentCount: options?.segmentCount ?? 8,
      priority: options?.priority ?? 'normal',
      category: options?.category,
      tags: options?.tags ?? [],
      maxRetries: options?.maxRetries ?? 3,
      checksum: options?.checksum,
    });
  },

  /**
   * Get all downloads with optional filters
   * @param filters - Optional filters
   * @returns Array of downloads
   */
  async getAll(filters?: DownloadFilters): Promise<Download[]> {
    return invoke<Download[]>('get_downloads', {
      status: filters?.status,
      category: filters?.category,
      search: filters?.search,
      limit: filters?.limit,
      offset: filters?.offset,
    });
  },

  /**
   * Get a single download by ID
   * @param id - Download ID
   * @returns Download or null if not found
   */
  async getById(id: string): Promise<Download | null> {
    return invoke<Download | null>('get_download', { id });
  },

  /**
   * Pause a download
   * @param id - Download ID
   * @returns Updated download
   */
  async pause(id: string): Promise<Download> {
    return invoke<Download>('pause_download', { id });
  },

  /**
   * Resume a paused download
   * @param id - Download ID
   * @returns Updated download
   */
  async resume(id: string): Promise<Download> {
    return invoke<Download>('resume_download', { id });
  },

  /**
   * Cancel and remove a download
   * @param id - Download ID
   * @param deleteFile - Whether to delete the partial file
   * @returns Success status
   */
  async cancel(id: string, deleteFile: boolean = false): Promise<boolean> {
    return invoke<boolean>('cancel_download', { id, deleteFile });
  },

  /**
   * Remove a download from the list
   * @param id - Download ID
   * @param deleteFile - Whether to delete the file
   * @returns Success status
   */
  async remove(id: string, deleteFile: boolean = false): Promise<boolean> {
    return invoke<boolean>('remove_download', { id, deleteFile });
  },

  /**
   * Clear all completed downloads from the list
   * @returns Number of downloads cleared
   */
  async clearCompleted(): Promise<number> {
    return invoke<number>('clear_completed_downloads');
  },

  /**
   * Open the folder containing the download
   * @param id - Download ID
   */
  async openLocation(id: string): Promise<void> {
    return invoke<void>('open_download_location', { id });
  },

  /**
   * Open the downloaded file
   * @param id - Download ID
   */
  async openFile(id: string): Promise<void> {
    return invoke<void>('open_downloaded_file', { id });
  },

  /**
   * Retry a failed download
   * @param id - Download ID
   * @returns Updated download
   */
  async retry(id: string): Promise<Download> {
    return invoke<Download>('retry_download', { id });
  },

  /**
   * Update download priority
   * @param id - Download ID
   * @param priority - New priority
   * @returns Updated download
   */
  async setPriority(id: string, priority: DownloadPriority): Promise<Download> {
    return invoke<Download>('set_download_priority', { id, priority });
  },

  /**
   * Get download statistics
   * @returns Download stats
   */
  async getStats(): Promise<DownloadStats> {
    return invoke<DownloadStats>('get_download_stats');
  },

  /**
   * Pause all active downloads
   * @returns Number of downloads paused
   */
  async pauseAll(): Promise<number> {
    return invoke<number>('pause_all_downloads');
  },

  /**
   * Resume all paused downloads
   * @returns Number of downloads resumed
   */
  async resumeAll(): Promise<number> {
    return invoke<number>('resume_all_downloads');
  },

  /**
   * Set global download speed limit
   * @param bytesPerSecond - Speed limit in bytes/second (0 for unlimited)
   */
  async setSpeedLimit(bytesPerSecond: number): Promise<void> {
    return invoke<void>('set_download_speed_limit', { bytesPerSecond });
  },

  /**
   * Get current global speed limit
   * @returns Speed limit in bytes/second (0 = unlimited)
   */
  async getSpeedLimit(): Promise<number> {
    return invoke<number>('get_download_speed_limit');
  },

  /**
   * Set maximum concurrent downloads
   * @param maxConcurrent - Maximum number of concurrent downloads
   */
  async setMaxConcurrent(maxConcurrent: number): Promise<void> {
    return invoke<void>('set_max_concurrent_downloads', { maxConcurrent });
  },

  /**
   * Verify checksum of a completed download
   * @param id - Download ID
   * @returns Whether checksum matches
   */
  async verifyChecksum(id: string): Promise<boolean> {
    return invoke<boolean>('verify_download_checksum', { id });
  },
};

// ============================================================================
// React Hook
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export interface UseDownloadsOptions {
  /** Auto-refresh interval in ms */
  autoRefresh?: number;
  /** Enable real-time updates via Tauri events */
  realtime?: boolean;
  /** Initial filters */
  initialFilters?: DownloadFilters;
}

export interface UseDownloadsReturn {
  downloads: Download[];
  stats: DownloadStats | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  startDownload: (url: string, options?: DownloadOptions) => Promise<Download>;
  pauseDownload: (id: string) => Promise<void>;
  resumeDownload: (id: string) => Promise<void>;
  cancelDownload: (id: string, deleteFile?: boolean) => Promise<void>;
  removeDownload: (id: string, deleteFile?: boolean) => Promise<void>;
  retryDownload: (id: string) => Promise<void>;
  openLocation: (id: string) => Promise<void>;
  openFile: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  pauseAll: () => Promise<void>;
  resumeAll: () => Promise<void>;
  setSpeedLimit: (bytesPerSecond: number) => Promise<void>;
  
  // Refresh
  refresh: () => Promise<void>;
  
  // Filters
  setFilters: (filters: DownloadFilters) => void;
}

export function useDownloads(options: UseDownloadsOptions = {}): UseDownloadsReturn {
  const { autoRefresh, realtime = true, initialFilters } = options;
  
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<DownloadFilters>(initialFilters || {});
  
  const unlistenRef = useRef<UnlistenFn | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch downloads
  const fetchDownloads = useCallback(async () => {
    try {
      const [downloadList, downloadStats] = await Promise.all([
        DownloadService.getAll(filters),
        DownloadService.getStats(),
      ]);
      setDownloads(downloadList);
      setStats(downloadStats);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch downloads';
      setError(message);
      log.error('useDownloads: Failed to fetch downloads:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial fetch and setup
  useEffect(() => {
    fetchDownloads();

    // Auto-refresh
    if (autoRefresh && autoRefresh > 0) {
      intervalRef.current = setInterval(fetchDownloads, autoRefresh);
    }

    // Real-time events
    if (realtime) {
      const setupListener = async () => {
        try {
          unlistenRef.current = await listen<Download>('download-progress', (event) => {
            setDownloads(prev => {
              const index = prev.findIndex(d => d.id === event.payload.id);
              if (index >= 0) {
                const updated = [...prev];
                updated[index] = event.payload;
                return updated;
              }
              return [...prev, event.payload];
            });
          });
        } catch (err) {
          log.error('Failed to setup download listener:', err);
        }
      };
      setupListener();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, [fetchDownloads, autoRefresh, realtime]);

  // Actions
  const startDownload = useCallback(async (url: string, downloadOptions?: DownloadOptions) => {
    const download = await DownloadService.start(url, downloadOptions);
    setDownloads(prev => [download, ...prev]);
    return download;
  }, []);

  const pauseDownload = useCallback(async (id: string) => {
    const updated = await DownloadService.pause(id);
    setDownloads(prev => prev.map(d => d.id === id ? updated : d));
  }, []);

  const resumeDownload = useCallback(async (id: string) => {
    const updated = await DownloadService.resume(id);
    setDownloads(prev => prev.map(d => d.id === id ? updated : d));
  }, []);

  const cancelDownload = useCallback(async (id: string, deleteFile?: boolean) => {
    await DownloadService.cancel(id, deleteFile);
    setDownloads(prev => prev.filter(d => d.id !== id));
  }, []);

  const removeDownload = useCallback(async (id: string, deleteFile?: boolean) => {
    await DownloadService.remove(id, deleteFile);
    setDownloads(prev => prev.filter(d => d.id !== id));
  }, []);

  const retryDownload = useCallback(async (id: string) => {
    const updated = await DownloadService.retry(id);
    setDownloads(prev => prev.map(d => d.id === id ? updated : d));
  }, []);

  const openLocation = useCallback(async (id: string) => {
    await DownloadService.openLocation(id);
  }, []);

  const openFile = useCallback(async (id: string) => {
    await DownloadService.openFile(id);
  }, []);

  const clearCompleted = useCallback(async () => {
    await DownloadService.clearCompleted();
    setDownloads(prev => prev.filter(d => d.status !== 'completed'));
  }, []);

  const pauseAll = useCallback(async () => {
    await DownloadService.pauseAll();
    await fetchDownloads();
  }, [fetchDownloads]);

  const resumeAll = useCallback(async () => {
    await DownloadService.resumeAll();
    await fetchDownloads();
  }, [fetchDownloads]);

  const setSpeedLimit = useCallback(async (bytesPerSecond: number) => {
    await DownloadService.setSpeedLimit(bytesPerSecond);
  }, []);

  const setFilters = useCallback((newFilters: DownloadFilters) => {
    setFiltersState(newFilters);
  }, []);

  return {
    downloads,
    stats,
    loading,
    error,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    removeDownload,
    retryDownload,
    openLocation,
    openFile,
    clearCompleted,
    pauseAll,
    resumeAll,
    setSpeedLimit,
    refresh: fetchDownloads,
    setFilters,
  };
}

export default DownloadService;
