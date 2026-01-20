/**
 * CUBE Elite v6 - File Transfer Integration Service
 * 
 * Provides Tauri backend integration for file transfer operations
 * Bridges FTP/SFTP/FTPS commands to React frontend
 * 
 * @module file-transfer-integration-service
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export type FtpProtocol = 'FTP' | 'FTPS' | 'SFTP' | 'FTPES';

export interface FtpSite {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: FtpProtocol;
  username: string;
  password: string;
  remotePath: string;
  localPath: string;
  isConnected: boolean;
  lastConnected?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FtpFileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  permissions: string;
}

export interface FtpTransfer {
  id: string;
  siteId: string;
  fileName: string;
  localPath: string;
  remotePath: string;
  direction: 'upload' | 'download';
  status: 'pending' | 'transferring' | 'completed' | 'failed' | 'paused' | 'cancelled';
  totalBytes: number;
  transferredBytes: number;
  progress: number;
  speed: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface FtpServerConfig {
  host: string;
  port: number;
  passivePort: number;
  rootDir: string;
  maxConnections: number;
  anonymous: boolean;
  users: FtpUser[];
}

export interface FtpUser {
  username: string;
  password: string;
  homeDir: string;
  permissions: string[];
}

export interface FtpServerStatus {
  running: boolean;
  host: string;
  port: number;
  activeConnections: number;
  totalTransfers: number;
  uptime: number;
}

// ============================================================================
// FTP Site Service
// ============================================================================

export class FtpSiteService {
  async create(site: Omit<FtpSite, 'id' | 'isConnected' | 'createdAt' | 'updatedAt'>): Promise<FtpSite> {
    return invoke<FtpSite>('create_ftp_site', { site });
  }

  async getAll(): Promise<FtpSite[]> {
    return invoke<FtpSite[]>('get_ftp_sites');
  }

  async update(siteId: string, updates: Partial<FtpSite>): Promise<FtpSite> {
    return invoke<FtpSite>('update_ftp_site', { siteId, updates });
  }

  async delete(siteId: string): Promise<void> {
    return invoke('delete_ftp_site', { siteId });
  }

  async testConnection(siteId: string): Promise<boolean> {
    return invoke<boolean>('test_ftp_connection', { siteId });
  }
}

// ============================================================================
// FTP Directory Service
// ============================================================================

export class FtpDirectoryService {
  async list(siteId: string, path: string = '/'): Promise<FtpFileEntry[]> {
    return invoke<FtpFileEntry[]>('list_ftp_directory', { siteId, path });
  }

  async mkdir(siteId: string, path: string): Promise<void> {
    return invoke('ftp_mkdir', { siteId, path });
  }

  async rmdir(siteId: string, path: string): Promise<void> {
    return invoke('ftp_rmdir', { siteId, path });
  }

  async delete(siteId: string, path: string): Promise<void> {
    return invoke('ftp_delete', { siteId, path });
  }

  async rename(siteId: string, oldPath: string, newPath: string): Promise<void> {
    return invoke('ftp_rename', { siteId, oldPath, newPath });
  }

  async chmod(siteId: string, path: string, mode: string): Promise<void> {
    return invoke('ftp_chmod', { siteId, path, mode });
  }
}

// ============================================================================
// FTP Transfer Service
// ============================================================================

export class FtpTransferService {
  async upload(siteId: string, localPath: string, remotePath: string): Promise<FtpTransfer> {
    return invoke<FtpTransfer>('upload_ftp_file', { siteId, localPath, remotePath });
  }

  async download(siteId: string, remotePath: string, localPath: string): Promise<FtpTransfer> {
    return invoke<FtpTransfer>('download_ftp_file', { siteId, remotePath, localPath });
  }

  async getQueue(): Promise<FtpTransfer[]> {
    return invoke<FtpTransfer[]>('get_ftp_transfer_queue');
  }

  async pause(transferId: string): Promise<void> {
    return invoke('pause_ftp_transfer', { transferId });
  }

  async resume(transferId: string): Promise<void> {
    return invoke('resume_ftp_transfer', { transferId });
  }

  async cancel(transferId: string): Promise<void> {
    return invoke('cancel_ftp_transfer', { transferId });
  }
}

// ============================================================================
// FTP Server Service (Embedded Server)
// ============================================================================

export class FtpServerService {
  async start(config: FtpServerConfig): Promise<void> {
    return invoke('start_ftp_server', { config });
  }

  async stop(): Promise<void> {
    return invoke('stop_ftp_server');
  }

  async getStatus(): Promise<FtpServerStatus> {
    return invoke<FtpServerStatus>('get_ftp_server_status');
  }
}

// ============================================================================
// Unified File Transfer Service
// ============================================================================

export class FileTransferService {
  public sites: FtpSiteService;
  public directory: FtpDirectoryService;
  public transfer: FtpTransferService;
  public server: FtpServerService;

  constructor() {
    this.sites = new FtpSiteService();
    this.directory = new FtpDirectoryService();
    this.transfer = new FtpTransferService();
    this.server = new FtpServerService();
  }

  // Convenience methods

  async connect(siteId: string): Promise<boolean> {
    return this.sites.testConnection(siteId);
  }

  async uploadFile(siteId: string, localPath: string, remotePath: string): Promise<FtpTransfer> {
    return this.transfer.upload(siteId, localPath, remotePath);
  }

  async downloadFile(siteId: string, remotePath: string, localPath: string): Promise<FtpTransfer> {
    return this.transfer.download(siteId, remotePath, localPath);
  }

  async browse(siteId: string, path?: string): Promise<FtpFileEntry[]> {
    return this.directory.list(siteId, path);
  }
}

// ============================================================================
// React Hook
// ============================================================================

interface UseFileTransferOptions {
  autoRefresh?: number;
  realtime?: boolean;
}

export function useFileTransfer(options: UseFileTransferOptions = {}) {
  const { autoRefresh = 3000, realtime = false } = options;

  const [sites, setSites] = useState<FtpSite[]>([]);
  const [transfers, setTransfers] = useState<FtpTransfer[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState<FtpFileEntry[]>([]);
  const [currentSite, setCurrentSite] = useState<FtpSite | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [serverStatus, setServerStatus] = useState<FtpServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<FileTransferService | null>(null);

  // Initialize
  useEffect(() => {
    serviceRef.current = new FileTransferService();
    loadInitialData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!realtime || autoRefresh <= 0) return;

    const interval = setInterval(() => {
      refreshTransfers();
    }, autoRefresh);

    return () => clearInterval(interval);
  }, [realtime, autoRefresh]);

  // Load initial data
  const loadInitialData = async () => {
    if (!serviceRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const [sitesData, transfersData] = await Promise.all([
        serviceRef.current.sites.getAll(),
        serviceRef.current.transfer.getQueue(),
      ]);

      setSites(sitesData);
      setTransfers(transfersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh transfers
  const refreshTransfers = async () => {
    if (!serviceRef.current) return;

    try {
      const transfersData = await serviceRef.current.transfer.getQueue();
      setTransfers(transfersData);
    } catch {
      // Silent fail for refresh
    }
  };

  // Create site
  const createSite = useCallback(async (site: Omit<FtpSite, 'id' | 'isConnected' | 'createdAt' | 'updatedAt'>) => {
    if (!serviceRef.current) return null;

    try {
      setError(null);
      const newSite = await serviceRef.current.sites.create(site);
      setSites(prev => [...prev, newSite]);
      return newSite;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create site');
      return null;
    }
  }, []);

  // Delete site
  const deleteSite = useCallback(async (siteId: string) => {
    if (!serviceRef.current) return;

    try {
      setError(null);
      await serviceRef.current.sites.delete(siteId);
      setSites(prev => prev.filter(s => s.id !== siteId));
      if (currentSite?.id === siteId) {
        setCurrentSite(null);
        setCurrentDirectory([]);
        setCurrentPath('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete site');
    }
  }, [currentSite]);

  // Connect to site
  const connectToSite = useCallback(async (siteId: string) => {
    if (!serviceRef.current) return false;

    try {
      setError(null);
      const site = sites.find(s => s.id === siteId);
      if (!site) throw new Error('Site not found');

      const connected = await serviceRef.current.connect(siteId);
      if (connected) {
        setCurrentSite(site);
        const entries = await serviceRef.current.browse(siteId, '/');
        setCurrentDirectory(entries);
        setCurrentPath('/');
      }
      return connected;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      return false;
    }
  }, [sites]);

  // Browse directory
  const browse = useCallback(async (path: string) => {
    if (!serviceRef.current || !currentSite) return;

    try {
      setError(null);
      const entries = await serviceRef.current.browse(currentSite.id, path);
      setCurrentDirectory(entries);
      setCurrentPath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to browse directory');
    }
  }, [currentSite]);

  // Upload file
  const uploadFile = useCallback(async (localPath: string, remotePath?: string) => {
    if (!serviceRef.current || !currentSite) return null;

    try {
      setError(null);
      const targetPath = remotePath || `${currentPath}/${localPath.split('/').pop()}`;
      const transfer = await serviceRef.current.uploadFile(currentSite.id, localPath, targetPath);
      setTransfers(prev => [...prev, transfer]);
      return transfer;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      return null;
    }
  }, [currentSite, currentPath]);

  // Download file
  const downloadFile = useCallback(async (remotePath: string, localPath: string) => {
    if (!serviceRef.current || !currentSite) return null;

    try {
      setError(null);
      const transfer = await serviceRef.current.downloadFile(currentSite.id, remotePath, localPath);
      setTransfers(prev => [...prev, transfer]);
      return transfer;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
      return null;
    }
  }, [currentSite]);

  // Pause transfer
  const pauseTransfer = useCallback(async (transferId: string) => {
    if (!serviceRef.current) return;

    try {
      await serviceRef.current.transfer.pause(transferId);
      await refreshTransfers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause transfer');
    }
  }, []);

  // Resume transfer
  const resumeTransfer = useCallback(async (transferId: string) => {
    if (!serviceRef.current) return;

    try {
      await serviceRef.current.transfer.resume(transferId);
      await refreshTransfers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume transfer');
    }
  }, []);

  // Cancel transfer
  const cancelTransfer = useCallback(async (transferId: string) => {
    if (!serviceRef.current) return;

    try {
      await serviceRef.current.transfer.cancel(transferId);
      await refreshTransfers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel transfer');
    }
  }, []);

  // Start embedded server
  const startServer = useCallback(async (config: FtpServerConfig) => {
    if (!serviceRef.current) return;

    try {
      setError(null);
      await serviceRef.current.server.start(config);
      const status = await serviceRef.current.server.getStatus();
      setServerStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start server');
    }
  }, []);

  // Stop embedded server
  const stopServer = useCallback(async () => {
    if (!serviceRef.current) return;

    try {
      await serviceRef.current.server.stop();
      setServerStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop server');
    }
  }, []);

  return {
    // State
    sites,
    transfers,
    currentDirectory,
    currentSite,
    currentPath,
    serverStatus,
    loading,
    error,

    // Site actions
    createSite,
    deleteSite,
    connectToSite,
    refreshSites: loadInitialData,

    // Directory actions
    browse,
    goUp: () => {
      const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
      browse(parentPath);
    },

    // Transfer actions
    uploadFile,
    downloadFile,
    pauseTransfer,
    resumeTransfer,
    cancelTransfer,
    refreshTransfers,

    // Server actions
    startServer,
    stopServer,
    refreshServerStatus: async () => {
      if (!serviceRef.current) return;
      try {
        const status = await serviceRef.current.server.getStatus();
        setServerStatus(status);
      } catch {
        setServerStatus(null);
      }
    },

    // Service reference
    service: serviceRef.current,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default FileTransferService;
