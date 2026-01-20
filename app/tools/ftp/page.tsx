"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useConfirm } from '@/components/ui/confirm-dialog';
import {
  FtpSite,
  FtpEntry,
  LocalEntry,
  TransferItem,
  TransferStats,
  PaneState,
  ConnectionState,
  FtpTransferProgressEvent,
  FtpTransferCompleteEvent,
  CreateSiteRequest,
  getDefaultTransferStats,
  calculateTransferStats,
} from '../../../types/ftp';
import FilePane from '../../../components/ftp/FilePane';
import TransferQueue from '../../../components/ftp/TransferQueue';
import ServerManager from '../../../components/ftp/ServerManager';
import ConnectionDialog from '../../../components/ftp/ConnectionDialog';
import './ftp.css';

/**
 * FTP Client Page
 * 
 * Dual-pane FTP client with:
 * - Local and remote file browsing
 * - FTP/FTPS/SFTP protocol support
 * - Transfer queue with resume capability
 * - Server connection management
 * - File operations (upload, download, delete, rename, chmod)
 */
export default function FTPClientPage() {
  // Connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    connected: false,
    connecting: false,
  });

  // Local pane state
  const [localPane, setLocalPane] = useState<PaneState>({
    current_path: '/Users',
    entries: [],
    selected: [],
    loading: false,
    sort_by: 'name',
    sort_order: 'asc',
  });

  // Remote pane state
  const [remotePane, setRemotePane] = useState<PaneState>({
    current_path: '/',
    entries: [],
    selected: [],
    loading: false,
    sort_by: 'name',
    sort_order: 'asc',
  });

  // Transfer state
  const [transferQueue, setTransferQueue] = useState<TransferItem[]>([]);
  const [transferStats, setTransferStats] = useState<TransferStats>(getDefaultTransferStats());

  // UI state
  const [sites, setSites] = useState<FtpSite[]>([]);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showServerManager, setShowServerManager] = useState(false);
  const [showTransferQueue, setShowTransferQueue] = useState(true);
  const { confirm } = useConfirm();

  // Load sites on mount
  useEffect(() => {
    loadSites();
  }, []);

  // Load transfer queue on mount and periodically
  useEffect(() => {
    loadTransferQueue();
    
    const interval = setInterval(() => {
      if (connectionState.connected) {
        loadTransferQueue();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [connectionState.connected]);

  // Listen for transfer events
  useEffect(() => {
    const progressUnlisten = listen<FtpTransferProgressEvent>(
      'ftp:transfer:progress',
      (event) => {
        setTransferQueue((prev) =>
          prev.map((t) =>
            t.id === event.payload.transfer_id
              ? {
                  ...t,
                  bytes_transferred: event.payload.bytes_transferred,
                  speed: event.payload.speed,
                  eta: event.payload.eta,
                }
              : t
          )
        );
      }
    );

    const completeUnlisten = listen<FtpTransferCompleteEvent>(
      'ftp:transfer:complete',
      (event) => {
        setTransferQueue((prev) =>
          prev.map((t) =>
            t.id === event.payload.transfer_id
              ? {
                  ...t,
                  status: event.payload.status,
                  error: event.payload.error,
                }
              : t
          )
        );
        
        // Refresh both panes after transfer completes
        refreshLocalPane();
        if (connectionState.connected) {
          refreshRemotePane();
        }
      }
    );

    return () => {
      progressUnlisten.then((fn) => fn());
      completeUnlisten.then((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState.connected]);

  // Update transfer stats when queue changes
  useEffect(() => {
    setTransferStats(calculateTransferStats(transferQueue));
  }, [transferQueue]);

  // Load sites from backend
  const loadSites = async () => {
    try {
      const result = await invoke<FtpSite[]>('get_ftp_sites');
      setSites(result);
    } catch (error) {
      log.error('Failed to load sites:', error);
    }
  };

  // Load transfer queue
  const loadTransferQueue = async () => {
    try {
      const result = await invoke<TransferItem[]>('get_ftp_transfer_queue');
      setTransferQueue(result);
    } catch (error) {
      log.error('Failed to load transfer queue:', error);
    }
  };

  // Refresh local pane
  const refreshLocalPane = useCallback(async () => {
    setLocalPane((prev) => ({ ...prev, loading: true, error: undefined }));
    
    try {
      // Use Node.js fs or Tauri file system API
      const entries = await invoke<LocalEntry[]>('list_local_directory', {
        path: localPane.current_path,
      });
      
      setLocalPane((prev) => ({
        ...prev,
        entries,
        loading: false,
      }));
    } catch (error) {
      setLocalPane((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to list directory',
      }));
    }
  }, [localPane.current_path]);

  // Refresh remote pane
  const refreshRemotePane = useCallback(async () => {
    if (!connectionState.site) return;
    
    setRemotePane((prev) => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const entries = await invoke<FtpEntry[]>('list_ftp_directory', {
        siteId: connectionState.site.id,
        path: remotePane.current_path,
      });
      
      setRemotePane((prev) => ({
        ...prev,
        entries,
        loading: false,
      }));
    } catch (error) {
      setRemotePane((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to list directory',
      }));
    }
  }, [connectionState.site, remotePane.current_path]);

  // Connect to site
  const handleConnect = async (site: FtpSite) => {
    setConnectionState({ connected: false, connecting: true });
    
    try {
      // Test connection
      const success = await invoke<boolean>('test_ftp_connection', {
        siteId: site.id,
      });
      
      if (success) {
        setConnectionState({
          site,
          connected: true,
          connecting: false,
          last_activity: Date.now(),
        });
        
        // Set initial remote path
        setRemotePane((prev) => ({ ...prev, current_path: site.remote_path }));
        
        // Load remote directory
        await refreshRemotePane();
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      setConnectionState({
        connected: false,
        connecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  };

  // Disconnect from site
  const handleDisconnect = () => {
    setConnectionState({
      connected: false,
      connecting: false,
    });
    
    setRemotePane({
      current_path: '/',
      entries: [],
      selected: [],
      loading: false,
      sort_by: 'name',
      sort_order: 'asc',
    });
  };

  // Create new site
  const handleCreateSite = async (siteData: CreateSiteRequest) => {
    try {
      await invoke('create_ftp_site', { site: siteData });
      await loadSites();
      setShowConnectionDialog(false);
    } catch (error) {
      throw error;
    }
  };

  // Delete site
  const handleDeleteSite = async (siteId: string) => {
    try {
      await invoke('delete_ftp_site', { siteId });
      await loadSites();
      
      // If deleting connected site, disconnect
      if (connectionState.site?.id === siteId) {
        handleDisconnect();
      }
    } catch (error) {
      log.error('Failed to delete site:', error);
    }
  };

  // Navigate local directory
  const handleLocalNavigate = (path: string) => {
    setLocalPane((prev) => ({
      ...prev,
      current_path: path,
      selected: [],
    }));
  };

  // Navigate remote directory
  const handleRemoteNavigate = (path: string) => {
    setRemotePane((prev) => ({
      ...prev,
      current_path: path,
      selected: [],
    }));
  };

  // Upload files
  const handleUpload = async () => {
    if (!connectionState.site || localPane.selected.length === 0) return;
    
    try {
      for (const filename of localPane.selected) {
        const localPath = `${localPane.current_path}/${filename}`;
        const remotePath = `${remotePane.current_path}/${filename}`;
        
        await invoke('upload_ftp_file', {
          siteId: connectionState.site.id,
          localPath,
          remotePath,
        });
      }
      
      // Clear selection
      setLocalPane((prev) => ({ ...prev, selected: [] }));
      
      // Refresh transfer queue
      await loadTransferQueue();
    } catch (error) {
      log.error('Upload failed:', error);
    }
  };

  // Download files
  const handleDownload = async () => {
    if (!connectionState.site || remotePane.selected.length === 0) return;
    
    try {
      for (const filename of remotePane.selected) {
        const remotePath = `${remotePane.current_path}/${filename}`;
        const localPath = `${localPane.current_path}/${filename}`;
        
        await invoke('download_ftp_file', {
          siteId: connectionState.site.id,
          remotePath,
          localPath,
        });
      }
      
      // Clear selection
      setRemotePane((prev) => ({ ...prev, selected: [] }));
      
      // Refresh transfer queue
      await loadTransferQueue();
    } catch (error) {
      log.error('Download failed:', error);
    }
  };

  // Delete remote files
  const handleDeleteRemote = async () => {
    if (!connectionState.site || remotePane.selected.length === 0) return;
    
    const confirmed = await confirm({
      title: 'Delete Files',
      description: `Are you sure you want to delete ${remotePane.selected.length} file(s)? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    
    if (!confirmed) return;
    
    try {
      for (const filename of remotePane.selected) {
        const entry = remotePane.entries.find((e) => e.name === filename);
        if (!entry) continue;
        
        const remotePath = `${remotePane.current_path}/${filename}`;
        
        await invoke('ftp_delete', {
          siteId: connectionState.site.id,
          remotePath,
          isDirectory: entry.is_directory,
        });
      }
      
      // Clear selection and refresh
      setRemotePane((prev) => ({ ...prev, selected: [] }));
      await refreshRemotePane();
    } catch (error) {
      log.error('Delete failed:', error);
    }
  };

  // Rename remote file
  const handleRenameRemote = async (oldName: string, newName: string) => {
    if (!connectionState.site) return;
    
    try {
      const oldPath = `${remotePane.current_path}/${oldName}`;
      const newPath = `${remotePane.current_path}/${newName}`;
      
      await invoke('ftp_rename', {
        siteId: connectionState.site.id,
        oldPath,
        newPath,
      });
      
      await refreshRemotePane();
    } catch (error) {
      log.error('Rename failed:', error);
    }
  };

  // Create remote directory
  const handleCreateRemoteDir = async (dirName: string) => {
    if (!connectionState.site) return;
    
    try {
      const remotePath = `${remotePane.current_path}/${dirName}`;
      
      await invoke('ftp_mkdir', {
        siteId: connectionState.site.id,
        remotePath,
      });
      
      await refreshRemotePane();
    } catch (error) {
      log.error('Create directory failed:', error);
    }
  };

  // Change permissions (SFTP only)
  const handleChmod = async (filename: string, mode: number) => {
    if (!connectionState.site || connectionState.site.protocol !== 'sftp') return;
    
    try {
      const remotePath = `${remotePane.current_path}/${filename}`;
      
      await invoke('ftp_chmod', {
        siteId: connectionState.site.id,
        remotePath,
        mode,
      });
      
      await refreshRemotePane();
    } catch (error) {
      log.error('Chmod failed:', error);
    }
  };

  // Pause transfer
  const handlePauseTransfer = async (transferId: string) => {
    try {
      await invoke('pause_ftp_transfer', { transferId });
      await loadTransferQueue();
    } catch (error) {
      log.error('Pause failed:', error);
    }
  };

  // Resume transfer
  const handleResumeTransfer = async (transferId: string) => {
    try {
      await invoke('resume_ftp_transfer', { transferId });
      await loadTransferQueue();
    } catch (error) {
      log.error('Resume failed:', error);
    }
  };

  // Cancel transfer
  const handleCancelTransfer = async (transferId: string) => {
    try {
      await invoke('cancel_ftp_transfer', { transferId });
      await loadTransferQueue();
    } catch (error) {
      log.error('Cancel failed:', error);
    }
  };

  // Load local directory on path change
  useEffect(() => {
    refreshLocalPane();
  }, [localPane.current_path, refreshLocalPane]);

  // Load remote directory on path change or connection
  useEffect(() => {
    if (connectionState.connected) {
      refreshRemotePane();
    }
  }, [remotePane.current_path, connectionState.connected, refreshRemotePane]);

  return (
    <div className="ftp-client-page">
      {/* Header */}
      <header className="ftp-header">
        <div className="ftp-header-left">
          <h1 className="ftp-title">FTP Client</h1>
          {connectionState.connected && connectionState.site && (
            <div className="ftp-connection-badge">
              <div className="connection-indicator active" />
              <span>{connectionState.site.name}</span>
            </div>
          )}
        </div>
        
        <div className="ftp-header-actions">
          {!connectionState.connected ? (
            <button
              className="btn-primary"
              onClick={() => setShowConnectionDialog(true)}
            >
              Connect
            </button>
          ) : (
            <button className="btn-danger" onClick={handleDisconnect}>
              Disconnect
            </button>
          )}
          
          <button
            className="btn-secondary"
            onClick={() => setShowServerManager(true)}
          >
            Manage Sites
          </button>
          
          <button
            className={`btn-secondary ${showTransferQueue ? 'active' : ''}`}
            onClick={() => setShowTransferQueue(!showTransferQueue)}
          >
            Transfers ({transferStats.active_transfers})
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="ftp-content">
        {/* Dual Panes */}
        <div className="ftp-panes">
          {/* Local Pane */}
          <FilePane
            paneType="local"
            state={localPane}
            onNavigate={handleLocalNavigate}
            onSelectionChange={(selected) =>
              setLocalPane((prev) => ({ ...prev, selected }))
            }
            onRefresh={refreshLocalPane}
            onSortChange={(sortBy, sortOrder) =>
              setLocalPane((prev) => ({ ...prev, sort_by: sortBy, sort_order: sortOrder }))
            }
          />

          {/* Transfer Actions */}
          <div className="ftp-transfer-actions">
            <button
              className="btn-action"
              disabled={!connectionState.connected || localPane.selected.length === 0}
              onClick={handleUpload}
              title="Upload selected files"
            >
              →
            </button>
            <button
              className="btn-action"
              disabled={!connectionState.connected || remotePane.selected.length === 0}
              onClick={handleDownload}
              title="Download selected files"
            >
              ←
            </button>
          </div>

          {/* Remote Pane */}
          <FilePane
            paneType="remote"
            state={remotePane}
            connected={connectionState.connected}
            protocol={connectionState.site?.protocol}
            onNavigate={handleRemoteNavigate}
            onSelectionChange={(selected) =>
              setRemotePane((prev) => ({ ...prev, selected }))
            }
            onRefresh={refreshRemotePane}
            onDelete={handleDeleteRemote}
            onRename={handleRenameRemote}
            onCreateDir={handleCreateRemoteDir}
            onChmod={handleChmod}
            onSortChange={(sortBy, sortOrder) =>
              setRemotePane((prev) => ({ ...prev, sort_by: sortBy, sort_order: sortOrder }))
            }
          />
        </div>

        {/* Transfer Queue */}
        {showTransferQueue && (
          <TransferQueue
            transfers={transferQueue}
            stats={transferStats}
            onPause={handlePauseTransfer}
            onResume={handleResumeTransfer}
            onCancel={handleCancelTransfer}
            onClear={() => setTransferQueue([])}
          />
        )}
      </div>

      {/* Connection Dialog */}
      {showConnectionDialog && (
        <ConnectionDialog
          sites={sites}
          onConnect={handleConnect}
          onCreateSite={handleCreateSite}
          onClose={() => setShowConnectionDialog(false)}
        />
      )}

      {/* Server Manager */}
      {showServerManager && (
        <ServerManager
          sites={sites}
          onConnect={handleConnect}
          onDelete={handleDeleteSite}
          onRefresh={loadSites}
          onClose={() => setShowServerManager(false)}
        />
      )}
    </div>
  );
}
