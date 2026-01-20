import React, { useState, useCallback } from 'react';
import { logger } from '@/lib/services/logger-service';
import { VPNConfig } from '../../types/vpn';
import './VPNConfigPanel.css';

const log = logger.scope('VPNConfigPanel');

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface VPNConfigPanelProps {
  config: VPNConfig;
  onUpdate: (config: VPNConfig) => Promise<void>;
}

/**
 * VPNConfigPanel Component
 * 
 * Configuration panel for VPN settings including:
 * - Kill switch toggle
 * - Auto-connect setting
 * - Protocol selection (OpenVPN/WireGuard)
 * - Custom DNS servers
 * - Split tunneling configuration
 */
export const VPNConfigPanel: React.FC<VPNConfigPanelProps> = ({
  config,
  onUpdate,
}) => {
  const [editing, setEditing] = useState(false);
  const [editedConfig, setEditedConfig] = useState<VPNConfig>(config);
  const [saving, setSaving] = useState(false);
  const [newDNS, setNewDNS] = useState('');
  const [newApp, setNewApp] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Toast notification helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  /**
   * Handle save configuration
   */
  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(editedConfig);
      setEditing(false);
    } catch (error) {
      log.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle cancel editing
   */
  const handleCancel = () => {
    setEditedConfig(config);
    setEditing(false);
  };

  /**
   * Add DNS server
   */
  const handleAddDNS = () => {
    if (!newDNS.trim()) return;
    
    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newDNS)) {
      showToast('error', 'Please enter a valid IP address');
      return;
    }

    setEditedConfig({
      ...editedConfig,
      dnsServers: [...editedConfig.dnsServers, newDNS.trim()],
    });
    setNewDNS('');
    showToast('success', 'DNS server added');
  };

  /**
   * Remove DNS server
   */
  const handleRemoveDNS = (index: number) => {
    setEditedConfig({
      ...editedConfig,
      dnsServers: editedConfig.dnsServers.filter((_, i) => i !== index),
    });
  };

  /**
   * Add app to split tunneling
   */
  const handleAddApp = () => {
    if (!newApp.trim()) return;
    
    setEditedConfig({
      ...editedConfig,
      splitTunneling: {
        ...editedConfig.splitTunneling,
        apps: [...editedConfig.splitTunneling.apps, newApp.trim()],
      },
    });
    setNewApp('');
  };

  /**
   * Remove app from split tunneling
   */
  const handleRemoveApp = (index: number) => {
    setEditedConfig({
      ...editedConfig,
      splitTunneling: {
        ...editedConfig.splitTunneling,
        apps: editedConfig.splitTunneling.apps.filter((_, i) => i !== index),
      },
    });
  };

  /**
   * Add domain to split tunneling
   */
  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    
    setEditedConfig({
      ...editedConfig,
      splitTunneling: {
        ...editedConfig.splitTunneling,
        domains: [...editedConfig.splitTunneling.domains, newDomain.trim()],
      },
    });
    setNewDomain('');
  };

  /**
   * Remove domain from split tunneling
   */
  const handleRemoveDomain = (index: number) => {
    setEditedConfig({
      ...editedConfig,
      splitTunneling: {
        ...editedConfig.splitTunneling,
        domains: editedConfig.splitTunneling.domains.filter((_, i) => i !== index),
      },
    });
  };

  const currentConfig = editing ? editedConfig : config;

  return (
    <div className="vpn-config-panel">
      {/* Header */}
      <div className="config-header">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          VPN Configuration
        </h2>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Configuration
          </button>
        ) : (
          <div className="edit-actions">
            <button onClick={handleCancel} className="btn-cancel" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSave} className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* General Settings */}
      <div className="config-section">
        <h3>General Settings</h3>
        
        {/* Kill Switch */}
        <div className="config-item">
          <div className="config-item-header">
            <div className="config-item-info">
              <label className="config-label">Kill Switch</label>
              <p className="config-description">
                Block all internet traffic if VPN connection drops
              </p>
            </div>
            {editing ? (
              <button
                className={`toggle-switch ${currentConfig.killSwitchEnabled ? 'enabled' : ''}`}
                onClick={() =>
                  setEditedConfig({
                    ...editedConfig,
                    killSwitchEnabled: !editedConfig.killSwitchEnabled,
                  })
                }
              >
                <div className="toggle-slider"></div>
              </button>
            ) : (
              <span className={`status-badge ${currentConfig.killSwitchEnabled ? 'enabled' : 'disabled'}`}>
                {currentConfig.killSwitchEnabled ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>
        </div>

        {/* Auto Connect */}
        <div className="config-item">
          <div className="config-item-header">
            <div className="config-item-info">
              <label className="config-label">Auto Connect</label>
              <p className="config-description">
                Automatically connect to VPN on application startup
              </p>
            </div>
            {editing ? (
              <button
                className={`toggle-switch ${currentConfig.autoConnect ? 'enabled' : ''}`}
                onClick={() =>
                  setEditedConfig({
                    ...editedConfig,
                    autoConnect: !editedConfig.autoConnect,
                  })
                }
              >
                <div className="toggle-slider"></div>
              </button>
            ) : (
              <span className={`status-badge ${currentConfig.autoConnect ? 'enabled' : 'disabled'}`}>
                {currentConfig.autoConnect ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>
        </div>

        {/* Protocol Selection */}
        <div className="config-item">
          <label className="config-label">Protocol</label>
          <p className="config-description">
            VPN protocol to use for connections
          </p>
          {editing ? (
            <div className="protocol-selector">
              <button
                className={`protocol-option ${currentConfig.protocol === 'WireGuard' ? 'selected' : ''}`}
                onClick={() => setEditedConfig({ ...editedConfig, protocol: 'WireGuard' })}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <div className="option-name">WireGuard</div>
                  <div className="option-desc">Faster, modern protocol</div>
                </div>
              </button>
              <button
                className={`protocol-option ${currentConfig.protocol === 'OpenVPN' ? 'selected' : ''}`}
                onClick={() => setEditedConfig({ ...editedConfig, protocol: 'OpenVPN' })}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <div className="option-name">OpenVPN</div>
                  <div className="option-desc">Traditional, widely supported</div>
                </div>
              </button>
            </div>
          ) : (
            <div className={`protocol-badge ${currentConfig.protocol.toLowerCase()}`}>
              {currentConfig.protocol}
            </div>
          )}
        </div>
      </div>

      {/* DNS Settings */}
      <div className="config-section">
        <h3>DNS Servers</h3>
        <p className="section-description">
          Custom DNS servers to use when connected to VPN
        </p>
        
        <div className="dns-list">
          {currentConfig.dnsServers.map((dns, index) => (
            <div key={index} className="dns-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              <span className="dns-address">{dns}</span>
              {editing && (
                <button
                  onClick={() => handleRemoveDNS(index)}
                  className="btn-remove-item"
                  title="Remove DNS server"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {editing && (
          <div className="add-item-form">
            <input
              type="text"
              placeholder="Enter DNS server IP (e.g., 1.1.1.1)"
              value={newDNS}
              onChange={(e) => setNewDNS(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddDNS()}
            />
            <button onClick={handleAddDNS} className="btn-add">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add DNS
            </button>
          </div>
        )}
      </div>

      {/* Split Tunneling */}
      <div className="config-section">
        <h3>Split Tunneling</h3>
        <p className="section-description">
          Choose which apps and domains use or bypass the VPN
        </p>

        {/* Enable/Disable Split Tunneling */}
        <div className="config-item">
          <div className="config-item-header">
            <div className="config-item-info">
              <label className="config-label">Enable Split Tunneling</label>
            </div>
            {editing ? (
              <button
                className={`toggle-switch ${currentConfig.splitTunneling.enabled ? 'enabled' : ''}`}
                onClick={() =>
                  setEditedConfig({
                    ...editedConfig,
                    splitTunneling: {
                      ...editedConfig.splitTunneling,
                      enabled: !editedConfig.splitTunneling.enabled,
                    },
                  })
                }
              >
                <div className="toggle-slider"></div>
              </button>
            ) : (
              <span className={`status-badge ${currentConfig.splitTunneling.enabled ? 'enabled' : 'disabled'}`}>
                {currentConfig.splitTunneling.enabled ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>
        </div>

        {/* Split Tunnel Mode */}
        {currentConfig.splitTunneling.enabled && editing && (
          <div className="config-item">
            <label className="config-label">Mode</label>
            <div className="mode-selector">
              <button
                className={`mode-option ${currentConfig.splitTunneling.mode === 'include' ? 'selected' : ''}`}
                onClick={() =>
                  setEditedConfig({
                    ...editedConfig,
                    splitTunneling: {
                      ...editedConfig.splitTunneling,
                      mode: 'include',
                    },
                  })
                }
              >
                <div className="option-name">Include</div>
                <div className="option-desc">Only listed apps use VPN</div>
              </button>
              <button
                className={`mode-option ${currentConfig.splitTunneling.mode === 'exclude' ? 'selected' : ''}`}
                onClick={() =>
                  setEditedConfig({
                    ...editedConfig,
                    splitTunneling: {
                      ...editedConfig.splitTunneling,
                      mode: 'exclude',
                    },
                  })
                }
              >
                <div className="option-name">Exclude</div>
                <div className="option-desc">Listed apps bypass VPN</div>
              </button>
            </div>
          </div>
        )}

        {/* Apps List */}
        {currentConfig.splitTunneling.enabled && (
          <>
            <div className="split-tunnel-subsection">
              <h4>Applications</h4>
              <div className="item-list">
                {currentConfig.splitTunneling.apps.length === 0 ? (
                  <p className="empty-message">No applications configured</p>
                ) : (
                  currentConfig.splitTunneling.apps.map((app, index) => (
                    <div key={index} className="list-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      <span className="item-text">{app}</span>
                      {editing && (
                        <button
                          onClick={() => handleRemoveApp(index)}
                          className="btn-remove-item"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
              {editing && (
                <div className="add-item-form">
                  <input
                    type="text"
                    placeholder="App bundle ID or path"
                    value={newApp}
                    onChange={(e) => setNewApp(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddApp()}
                  />
                  <button onClick={handleAddApp} className="btn-add">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add App
                  </button>
                </div>
              )}
            </div>

            {/* Domains List */}
            <div className="split-tunnel-subsection">
              <h4>Domains</h4>
              <div className="item-list">
                {currentConfig.splitTunneling.domains.length === 0 ? (
                  <p className="empty-message">No domains configured</p>
                ) : (
                  currentConfig.splitTunneling.domains.map((domain, index) => (
                    <div key={index} className="list-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span className="item-text">{domain}</span>
                      {editing && (
                        <button
                          onClick={() => handleRemoveDomain(index)}
                          className="btn-remove-item"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
              {editing && (
                <div className="add-item-form">
                  <input
                    type="text"
                    placeholder="Domain (e.g., example.com)"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                  />
                  <button onClick={handleAddDomain} className="btn-add">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Domain
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

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
  );
};
