"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { 
  VPNStatus, 
  VPNServer, 
  VPNConfig, 
  ConnectionLog 
} from '../../../types/vpn';
import { ConnectionStatus } from '../../../components/vpn/ConnectionStatus';
import { VPNServerList } from '../../../components/vpn/VPNServerList';
import { VPNConfigPanel } from '../../../components/vpn/VPNConfigPanel';
import { ConnectionLogs } from '../../../components/vpn/ConnectionLogs';
import { AppLayout } from '@/components/layout';
import './vpn-controls.css';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

/**
 * VPN Controls Page
 * 
 * Main interface for VPN management featuring:
 * - Real-time connection status display
 * - Server selection and management
 * - Configuration options (kill switch, auto-connect, split tunneling)
 * - Connection logs and history
 * - Protocol selection (OpenVPN/WireGuard)
 */
export default function VPNControlsPage() {
  // State management
  const [status, setStatus] = useState<VPNStatus | null>(null);
  const [servers, setServers] = useState<VPNServer[]>([]);
  const [config, setConfig] = useState<VPNConfig | null>(null);
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'status' | 'servers' | 'config' | 'logs'>('status');
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Toast notification helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  // Load initial data
  useEffect(() => {
    loadVPNData();
  }, []);

  // Set up event listeners for real-time updates
  useEffect(() => {
    const unlistenStatus = listen<VPNStatus>('vpn:status_changed', (event) => {
      setStatus(event.payload);
    });

    const unlistenConfig = listen<VPNConfig>('vpn:config_changed', (event) => {
      setConfig(event.payload);
    });

    const unlistenServers = listen<VPNServer[]>('vpn:servers_updated', (event) => {
      setServers(event.payload);
    });

    return () => {
      unlistenStatus.then(fn => fn());
      unlistenConfig.then(fn => fn());
      unlistenServers.then(fn => fn());
    };
  }, []);

  /**
   * Load all VPN data from backend
   */
  const loadVPNData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statusData, serversData, configData, logsData] = await Promise.all([
        invoke<VPNStatus>('get_vpn_status'),
        invoke<VPNServer[]>('get_vpn_servers'),
        invoke<VPNConfig>('get_vpn_config'),
        invoke<ConnectionLog[]>('get_vpn_logs'),
      ]);

      setStatus(statusData);
      setServers(serversData);
      setConfig(configData);
      setLogs(logsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load VPN data';
      setError(message);
      log.error('Failed to load VPN data:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connect to a VPN server
   */
  const handleConnect = async (serverId: string) => {
    setError(null);
    try {
      const newStatus = await invoke<VPNStatus>('connect_vpn', { serverId });
      setStatus(newStatus);
      
      // Reload logs to show connection event
      const newLogs = await invoke<ConnectionLog[]>('get_vpn_logs');
      setLogs(newLogs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to VPN';
      setError(message);
      log.error('Failed to connect:', err);
    }
  };

  /**
   * Disconnect from VPN
   */
  const handleDisconnect = async () => {
    setError(null);
    try {
      const newStatus = await invoke<VPNStatus>('disconnect_vpn');
      setStatus(newStatus);
      
      // Reload logs to show disconnection event
      const newLogs = await invoke<ConnectionLog[]>('get_vpn_logs');
      setLogs(newLogs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disconnect from VPN';
      setError(message);
      log.error('Failed to disconnect:', err);
    }
  };

  /**
   * Update VPN configuration
   */
  const handleConfigUpdate = async (newConfig: VPNConfig) => {
    setError(null);
    try {
      const updatedConfig = await invoke<VPNConfig>('update_vpn_config', { config: newConfig });
      setConfig(updatedConfig);
      
      // Reload logs
      const newLogs = await invoke<ConnectionLog[]>('get_vpn_logs');
      setLogs(newLogs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update configuration';
      setError(message);
      log.error('Failed to update config:', err);
    }
  };

  /**
   * Toggle kill switch
   */
  const handleKillSwitchToggle = async (enabled: boolean) => {
    setError(null);
    try {
      await invoke<boolean>('toggle_kill_switch', { enabled });
      
      // Reload config to show change
      const newConfig = await invoke<VPNConfig>('get_vpn_config');
      setConfig(newConfig);
      
      // Reload logs
      const newLogs = await invoke<ConnectionLog[]>('get_vpn_logs');
      setLogs(newLogs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle kill switch';
      setError(message);
      log.error('Failed to toggle kill switch:', err);
    }
  };

  /**
   * Refresh server list
   */
  const handleRefreshServers = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const newServers = await invoke<VPNServer[]>('refresh_vpn_servers');
      setServers(newServers);
      
      // Reload logs
      const newLogs = await invoke<ConnectionLog[]>('get_vpn_logs');
      setLogs(newLogs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh servers';
      setError(message);
      log.error('Failed to refresh servers:', err);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Get current public IP
   */
  const handleCheckIP = async () => {
    setError(null);
    try {
      const ip = await invoke<string>('get_current_ip');
      showToast('info', `Your current public IP: ${ip}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get current IP';
      setError(message);
      showToast('error', message);
      log.error('Failed to get IP:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <AppLayout tier="elite">
        <div className="vpn-controls-page">
          <div className="vpn-loading">
            <div className="loading-spinner"></div>
            <p>Loading VPN controls...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout tier="elite">
      <div className="vpn-controls-page">
      {/* Header */}
      <header className="vpn-header">
        <div className="header-content">
          <div className="header-title">
            <svg className="vpn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h1>VPN Controls</h1>
              <p>Secure your connection with enterprise-grade VPN</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              onClick={handleCheckIP} 
              className="btn-secondary"
              title="Check your current public IP"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Check IP
            </button>
            <button 
              onClick={handleRefreshServers} 
              className="btn-secondary"
              disabled={refreshing}
              title="Refresh server list"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={refreshing ? 'spinning' : ''}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="view-tabs">
          <button
            className={`tab-button ${activeView === 'status' ? 'active' : ''}`}
            onClick={() => setActiveView('status')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Connection Status
          </button>
          <button
            className={`tab-button ${activeView === 'servers' ? 'active' : ''}`}
            onClick={() => setActiveView('servers')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            Servers ({servers.length})
          </button>
          <button
            className={`tab-button ${activeView === 'config' ? 'active' : ''}`}
            onClick={() => setActiveView('config')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuration
          </button>
          <button
            className={`tab-button ${activeView === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveView('logs')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Logs ({logs.length})
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button title="Dismiss error" aria-label="Dismiss error message" onClick={() => setError(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="vpn-content">
        {activeView === 'status' && status && (
          <ConnectionStatus
            status={status}
            config={config}
            onDisconnect={handleDisconnect}
            onKillSwitchToggle={handleKillSwitchToggle}
          />
        )}

        {activeView === 'servers' && (
          <VPNServerList
            servers={servers}
            currentServer={status?.server || null}
            connected={status?.connected || false}
            onConnect={handleConnect}
            onRefresh={handleRefreshServers}
            refreshing={refreshing}
          />
        )}

        {activeView === 'config' && config && (
          <VPNConfigPanel
            config={config}
            onUpdate={handleConfigUpdate}
          />
        )}

        {activeView === 'logs' && (
          <ConnectionLogs
            logs={logs}
            onRefresh={loadVPNData}
          />
        )}
      </main>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
    </AppLayout>
  );
}
