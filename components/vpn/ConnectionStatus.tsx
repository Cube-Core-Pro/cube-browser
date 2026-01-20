import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/services/logger-service';
import { VPNStatus, VPNConfig, formatBytes, formatConnectionTime } from '../../types/vpn';
import './ConnectionStatus.css';

const log = logger.scope('ConnectionStatus');

interface ConnectionStatusProps {
  status: VPNStatus;
  config: VPNConfig | null;
  onDisconnect: () => Promise<void>;
  onKillSwitchToggle: (enabled: boolean) => Promise<void>;
}

/**
 * ConnectionStatus Component
 * 
 * Displays real-time VPN connection status including:
 * - Connection state (connected/disconnected)
 * - Current server information
 * - Public IP address
 * - Connection duration
 * - Data transfer statistics
 * - Kill switch status
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  config,
  onDisconnect,
  onKillSwitchToggle,
}) => {
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectionDuration, setConnectionDuration] = useState(0);
  const [togglingKillSwitch, setTogglingKillSwitch] = useState(false);

  // Update connection duration every second
  useEffect(() => {
    if (!status.connected || !status.connectionTime) {
      setConnectionDuration(0);
      return;
    }

    const updateDuration = () => {
      const now = Math.floor(Date.now() / 1000);
      const duration = now - (status.connectionTime || 0);
      setConnectionDuration(duration);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [status.connected, status.connectionTime]);

  /**
   * Handle disconnect button click
   */
  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await onDisconnect();
    } catch (error) {
      log.error('Failed to disconnect:', error);
    } finally {
      setDisconnecting(false);
    }
  };

  /**
   * Handle kill switch toggle
   */
  const handleKillSwitchToggle = async () => {
    if (!config) return;
    
    setTogglingKillSwitch(true);
    try {
      await onKillSwitchToggle(!config.killSwitchEnabled);
    } catch (error) {
      log.error('Failed to toggle kill switch:', error);
    } finally {
      setTogglingKillSwitch(false);
    }
  };

  return (
    <div className="connection-status">
      {/* Connection State Card */}
      <div className={`status-card main-status ${status.connected ? 'connected' : 'disconnected'}`}>
        <div className="status-indicator">
          <div className={`status-pulse ${status.connected ? 'active' : ''}`}></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {status.connected ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            )}
          </svg>
        </div>
        <div className="status-info">
          <h2>{status.connected ? 'Protected' : 'Disconnected'}</h2>
          <p>
            {status.connected
              ? `Connected to ${status.server?.name || 'VPN Server'}`
              : 'Not connected to any VPN server'}
          </p>
        </div>
        {status.connected && (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="btn-disconnect"
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="status-stats-grid">
        {/* Public IP Card */}
        <div className="stat-card">
          <div className="stat-icon ip-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Public IP</div>
            <div className="stat-value">{status.publicIp}</div>
          </div>
        </div>

        {/* Connection Time Card */}
        <div className="stat-card">
          <div className="stat-icon time-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Connection Time</div>
            <div className="stat-value">
              {status.connected ? formatConnectionTime(connectionDuration) : 'N/A'}
            </div>
          </div>
        </div>

        {/* Data Sent Card */}
        <div className="stat-card">
          <div className="stat-icon upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Data Sent</div>
            <div className="stat-value">{formatBytes(status.bytesSent)}</div>
          </div>
        </div>

        {/* Data Received Card */}
        <div className="stat-card">
          <div className="stat-icon download-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Data Received</div>
            <div className="stat-value">{formatBytes(status.bytesReceived)}</div>
          </div>
        </div>
      </div>

      {/* Server Details (if connected) */}
      {status.connected && status.server && (
        <div className="server-details-card">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            Server Details
          </h3>
          <div className="server-details-grid">
            <div className="detail-item">
              <span className="detail-label">Server Name</span>
              <span className="detail-value">{status.server.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Location</span>
              <span className="detail-value">
                {status.server.city}, {status.server.country}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">IP Address</span>
              <span className="detail-value mono">{status.server.ip}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Protocol</span>
              <span className={`protocol-badge ${status.server.protocol.toLowerCase()}`}>
                {status.server.protocol}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Server Load</span>
              <div className="load-indicator">
                <div className="load-bar">
                  <div
                    className={`load-fill ${
                      status.server.load < 40
                        ? 'low'
                        : status.server.load < 70
                        ? 'medium'
                        : 'high'
                    }`}
                    style={{ width: `${status.server.load}%` }}
                  ></div>
                </div>
                <span className="load-value">{status.server.load}%</span>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-label">Latency</span>
              <span className={`ping-badge ${
                status.server.ping < 50 ? 'excellent' : 
                status.server.ping < 100 ? 'good' : 
                status.server.ping < 150 ? 'fair' : 'poor'
              }`}>
                {status.server.ping}ms
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Security Features */}
      {config && (
        <div className="security-features-card">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Security Features
          </h3>
          <div className="security-features-list">
            {/* Kill Switch */}
            <div className="feature-item">
              <div className="feature-info">
                <div className="feature-icon kill-switch-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <div className="feature-name">Kill Switch</div>
                  <div className="feature-description">
                    Blocks internet if VPN disconnects
                  </div>
                </div>
              </div>
              <button
                className={`toggle-switch ${config.killSwitchEnabled ? 'enabled' : ''}`}
                onClick={handleKillSwitchToggle}
                disabled={togglingKillSwitch}
              >
                <div className="toggle-slider"></div>
              </button>
            </div>

            {/* Auto Connect */}
            <div className="feature-item">
              <div className="feature-info">
                <div className="feature-icon auto-connect-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="feature-name">Auto Connect</div>
                  <div className="feature-description">
                    Connect automatically on startup
                  </div>
                </div>
              </div>
              <span className={`status-badge ${config.autoConnect ? 'enabled' : 'disabled'}`}>
                {config.autoConnect ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Split Tunneling */}
            <div className="feature-item">
              <div className="feature-info">
                <div className="feature-icon split-tunnel-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <div className="feature-name">Split Tunneling</div>
                  <div className="feature-description">
                    Choose which apps use VPN
                  </div>
                </div>
              </div>
              <span className={`status-badge ${config.splitTunneling.enabled ? 'enabled' : 'disabled'}`}>
                {config.splitTunneling.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* DNS Servers */}
            <div className="feature-item">
              <div className="feature-info">
                <div className="feature-icon dns-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <div>
                  <div className="feature-name">DNS Servers</div>
                  <div className="feature-description">
                    {config.dnsServers.length} custom DNS server{config.dnsServers.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <span className="dns-count">{config.dnsServers.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
