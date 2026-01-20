"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useTranslation } from '@/hooks/useTranslation';
import './extensions.css';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface ExtensionManifest {
  manifest_version: number;
  name: string;
  version: string;
  description: string | null;
  permissions: string[] | null;
  host_permissions: string[] | null;
  icons: Record<string, string> | null;
}

interface ExtensionInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  path: string;
  manifest: ExtensionManifest;
  permissions: string[];
  web_store_id: string | null;
}

interface InstallStatus {
  status: 'idle' | 'installing' | 'success' | 'error';
  message: string;
  extensionId?: string;
}

type TabType = 'installed' | 'webstore' | 'install' | 'settings';

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURED EXTENSIONS DATA
// ═══════════════════════════════════════════════════════════════════════════════

const FEATURED_EXTENSIONS = [
  {
    id: 'ublock-origin',
    webStoreId: 'cjpalhdlnbpafiamejdnhcphjbkeiagm',
    name: 'uBlock Origin',
    description: 'Finally, an efficient wide-spectrum content blocker.',
    category: 'Privacy & Security',
    rating: 4.9,
    users: '10M+',
  },
  {
    id: 'bitwarden',
    webStoreId: 'nngceckbapebfimnlniiiahkandclblb',
    name: 'Bitwarden',
    description: 'A secure and free password manager for all of your devices.',
    category: 'Productivity',
    rating: 4.8,
    users: '3M+',
  },
  {
    id: 'react-devtools',
    webStoreId: 'fmkadmapgofadopljbjfkapdkoienihi',
    name: 'React Developer Tools',
    description: 'Adds React debugging tools to the Chrome Developer Tools.',
    category: 'Developer Tools',
    rating: 4.5,
    users: '3M+',
  },
  {
    id: 'grammarly',
    webStoreId: 'kbfnbcaeplbcioakkpcpgfkobkghlhen',
    name: 'Grammarly',
    description: 'Write with confidence across the web.',
    category: 'Productivity',
    rating: 4.7,
    users: '10M+',
  },
  {
    id: 'metamask',
    webStoreId: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
    name: 'MetaMask',
    description: 'An Ethereum Wallet in your Browser.',
    category: 'Finance',
    rating: 4.2,
    users: '10M+',
  },
  {
    id: 'json-viewer',
    webStoreId: 'gbmdgpbipfallnflgajpaliibnhdgobh',
    name: 'JSON Viewer',
    description: 'The most beautiful and customizable JSON/JSONP highlighter.',
    category: 'Developer Tools',
    rating: 4.8,
    users: '1M+',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// EXTENSION MANAGER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ExtensionsPage(): React.ReactElement {
  const { t: _t } = useTranslation();
  // State Management
  const [activeTab, setActiveTab] = useState<TabType>('installed');
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [installStatus, setInstallStatus] = useState<InstallStatus>({
    status: 'idle',
    message: '',
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedExtension, setSelectedExtension] = useState<ExtensionInfo | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
  const [webStoreUrl, setWebStoreUrl] = useState<string>('');
  // fileInputRef removed - unused
  const { confirm } = useConfirm();

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchExtensions = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await invoke<ExtensionInfo[]>('get_all_extensions');
      setExtensions(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch extensions';
      setError(errorMessage);
      log.error('Error fetching extensions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExtensions();
  }, [fetchExtensions]);

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTALLATION HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleInstallUnpacked = async (): Promise<void> => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Extension Directory',
      });

      if (!selected) {
        return;
      }

      setInstallStatus({ status: 'installing', message: 'Installing extension...' });

      const extensionId = await invoke<string>('install_extension_unpacked', {
        path: selected,
        autoEnable: true,
      });

      setInstallStatus({
        status: 'success',
        message: `Extension installed successfully!`,
        extensionId,
      });

      await fetchExtensions();

      setTimeout(() => {
        setInstallStatus({ status: 'idle', message: '' });
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Installation failed';
      setInstallStatus({ status: 'error', message: errorMessage });
      log.error('Error installing unpacked extension:', err);
    }
  };

  const handleInstallFromCrx = async (): Promise<void> => {
    try {
      const selected = await open({
        multiple: false,
        title: 'Select CRX File',
        filters: [{ name: 'Chrome Extension', extensions: ['crx'] }],
      });

      if (!selected) {
        return;
      }

      setInstallStatus({ status: 'installing', message: 'Installing extension from CRX...' });

      const extensionId = await invoke<string>('install_extension_from_crx', {
        crxPath: selected,
        autoEnable: true,
      });

      setInstallStatus({
        status: 'success',
        message: `Extension installed successfully!`,
        extensionId,
      });

      await fetchExtensions();

      setTimeout(() => {
        setInstallStatus({ status: 'idle', message: '' });
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Installation failed';
      setInstallStatus({ status: 'error', message: errorMessage });
      log.error('Error installing CRX extension:', err);
    }
  };

  const handleInstallFromWebStore = async (webStoreId: string): Promise<void> => {
    try {
      setInstallStatus({ status: 'installing', message: 'Downloading from Chrome Web Store...' });

      const extensionId = await invoke<string>('install_extension_from_web_store', {
        webStoreId,
        autoEnable: true,
      });

      setInstallStatus({
        status: 'success',
        message: `Extension installed successfully!`,
        extensionId,
      });

      await fetchExtensions();

      setTimeout(() => {
        setInstallStatus({ status: 'idle', message: '' });
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Installation failed';
      setInstallStatus({ status: 'error', message: errorMessage });
      log.error('Error installing from web store:', err);
    }
  };

  const handleInstallFromUrl = async (): Promise<void> => {
    if (!webStoreUrl.trim()) {
      setInstallStatus({ status: 'error', message: 'Please enter a Chrome Web Store URL' });
      return;
    }

    // Extract extension ID from URL
    const match = webStoreUrl.match(/\/([a-z]{32})/i);
    if (!match) {
      setInstallStatus({ status: 'error', message: 'Invalid Chrome Web Store URL' });
      return;
    }

    const webStoreId = match[1];
    await handleInstallFromWebStore(webStoreId);
    setWebStoreUrl('');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTENSION MANAGEMENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleToggleExtension = async (extensionId: string, enabled: boolean): Promise<void> => {
    try {
      if (enabled) {
        await invoke('disable_extension', { extensionId });
      } else {
        await invoke('enable_extension', { extensionId });
      }
      await fetchExtensions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle extension';
      setError(errorMessage);
      log.error('Error toggling extension:', err);
    }
  };

  const handleUninstallExtension = async (extensionId: string): Promise<void> => {
    try {
      const confirmed = await confirm({
        title: 'Uninstall Extension',
        description: 'Are you sure you want to uninstall this extension? This action cannot be undone.',
        confirmText: 'Uninstall',
        cancelText: 'Cancel',
        variant: 'destructive',
      });
      if (!confirmed) {
        return;
      }

      await invoke('uninstall_extension', { extensionId });
      await fetchExtensions();
      setSelectedExtension(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to uninstall extension';
      setError(errorMessage);
      log.error('Error uninstalling extension:', err);
    }
  };

  const handleUpdateExtension = async (extensionId: string): Promise<void> => {
    try {
      setInstallStatus({ status: 'installing', message: 'Updating extension...' });
      await invoke('update_extension', { extensionId });
      await fetchExtensions();
      setInstallStatus({ status: 'success', message: 'Extension updated!' });
      
      setTimeout(() => {
        setInstallStatus({ status: 'idle', message: '' });
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update extension';
      setInstallStatus({ status: 'error', message: errorMessage });
      log.error('Error updating extension:', err);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTERED EXTENSIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const filteredExtensions = extensions.filter((ext) =>
    ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ext.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enabledCount = extensions.filter((ext) => ext.enabled).length;
  const disabledCount = extensions.filter((ext) => !ext.enabled).length;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderInstallStatusBanner = (): React.ReactNode => {
    if (installStatus.status === 'idle') {
      return null;
    }

    const statusClasses: Record<string, string> = {
      installing: 'status-installing',
      success: 'status-success',
      error: 'status-error',
    };

    return (
      <div className={`install-status-banner ${statusClasses[installStatus.status]}`}>
        {installStatus.status === 'installing' && (
          <div className="status-spinner" />
        )}
        <span>{installStatus.message}</span>
        {installStatus.status !== 'installing' && (
          <button
            className="status-dismiss"
            onClick={() => setInstallStatus({ status: 'idle', message: '' })}
          >
            ×
          </button>
        )}
      </div>
    );
  };

  const renderExtensionCard = (ext: ExtensionInfo): React.ReactNode => {
    return (
      <div
        key={ext.id}
        className={`extension-card ${selectedExtension?.id === ext.id ? 'selected' : ''}`}
        onClick={() => setSelectedExtension(ext)}
      >
        <div className="extension-icon">
          {ext.manifest.icons?.['48'] || ext.manifest.icons?.['128'] ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`file://${ext.path}/${ext.manifest.icons['48'] || ext.manifest.icons['128']}`}
              alt={ext.name}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="extension-icon-placeholder">
              {ext.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="extension-info">
          <div className="extension-header">
            <h3 className="extension-name">{ext.name}</h3>
            <span className="extension-version">v{ext.version}</span>
          </div>
          <p className="extension-description">
            {ext.description || 'No description available'}
          </p>
          <div className="extension-meta">
            <span className={`extension-status ${ext.enabled ? 'enabled' : 'disabled'}`}>
              {ext.enabled ? '● Enabled' : '○ Disabled'}
            </span>
            {ext.permissions.length > 0 && (
              <button
                className="permissions-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedExtension(ext);
                  setShowPermissionsModal(true);
                }}
              >
                🔒 {ext.permissions.length} permissions
              </button>
            )}
          </div>
        </div>
        <div className="extension-actions">
          <button
            className={`toggle-btn ${ext.enabled ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExtension(ext.id, ext.enabled);
            }}
            title={ext.enabled ? 'Disable extension' : 'Enable extension'}
          >
            <div className="toggle-track">
              <div className="toggle-thumb" />
            </div>
          </button>
        </div>
      </div>
    );
  };

  const renderWebStoreCard = (ext: typeof FEATURED_EXTENSIONS[0]): React.ReactNode => {
    const isInstalled = extensions.some((e) => e.web_store_id === ext.webStoreId);

    return (
      <div key={ext.id} className="webstore-card">
        <div className="webstore-icon">
          <div className="webstore-icon-placeholder">
            {ext.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="webstore-info">
          <h3 className="webstore-name">{ext.name}</h3>
          <p className="webstore-description">{ext.description}</p>
          <div className="webstore-meta">
            <span className="webstore-category">{ext.category}</span>
            <span className="webstore-rating">★ {ext.rating}</span>
            <span className="webstore-users">{ext.users} users</span>
          </div>
        </div>
        <div className="webstore-actions">
          {isInstalled ? (
            <button className="installed-btn" disabled>
              ✓ Installed
            </button>
          ) : (
            <button
              className="install-btn"
              onClick={() => handleInstallFromWebStore(ext.webStoreId)}
              disabled={installStatus.status === 'installing'}
            >
              + Add to CUBE
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderExtensionDetails = (): React.ReactNode => {
    if (!selectedExtension) {
      return (
        <div className="extension-details-empty">
          <div className="empty-icon">📦</div>
          <h3>Select an Extension</h3>
          <p>Click on an extension to view its details</p>
        </div>
      );
    }

    return (
      <div className="extension-details">
        <div className="details-header">
          <div className="details-icon">
            {selectedExtension.manifest.icons?.['128'] ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`file://${selectedExtension.path}/${selectedExtension.manifest.icons['128']}`}
                alt={selectedExtension.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="details-icon-placeholder">
                {selectedExtension.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="details-title">
            <h2>{selectedExtension.name}</h2>
            <span className="details-version">Version {selectedExtension.version}</span>
          </div>
        </div>

        <div className="details-status">
          <span className={`status-badge ${selectedExtension.enabled ? 'enabled' : 'disabled'}`}>
            {selectedExtension.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <span className="manifest-version">
            Manifest V{selectedExtension.manifest.manifest_version}
          </span>
        </div>

        <div className="details-section">
          <h4>Description</h4>
          <p>{selectedExtension.description || 'No description available'}</p>
        </div>

        <div className="details-section">
          <h4>Extension ID</h4>
          <code className="extension-id">{selectedExtension.id}</code>
        </div>

        <div className="details-section">
          <h4>Location</h4>
          <code className="extension-path">{selectedExtension.path}</code>
        </div>

        {selectedExtension.permissions.length > 0 && (
          <div className="details-section">
            <h4>Permissions ({selectedExtension.permissions.length})</h4>
            <div className="permissions-list">
              {selectedExtension.permissions.map((perm, idx) => (
                <span key={idx} className="permission-badge">
                  {perm}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="details-actions">
          <button
            className={`action-btn toggle ${selectedExtension.enabled ? 'disable' : 'enable'}`}
            onClick={() => handleToggleExtension(selectedExtension.id, selectedExtension.enabled)}
          >
            {selectedExtension.enabled ? '⏸ Disable' : '▶ Enable'}
          </button>
          {selectedExtension.web_store_id && (
            <button
              className="action-btn update"
              onClick={() => handleUpdateExtension(selectedExtension.id)}
            >
              🔄 Update
            </button>
          )}
          <button
            className="action-btn uninstall"
            onClick={() => handleUninstallExtension(selectedExtension.id)}
          >
            🗑 Uninstall
          </button>
        </div>
      </div>
    );
  };

  const renderInstalledTab = (): React.ReactNode => {
    if (loading) {
      return (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading extensions...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Extensions</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchExtensions}>
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="installed-content">
        <div className="extensions-list-container">
          <div className="list-header">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search extensions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>
                  ×
                </button>
              )}
            </div>
            <div className="extension-stats">
              <span className="stat enabled">{enabledCount} enabled</span>
              <span className="stat disabled">{disabledCount} disabled</span>
            </div>
          </div>

          <div className="extensions-list">
            {filteredExtensions.length === 0 ? (
              <div className="no-extensions">
                {searchQuery ? (
                  <>
                    <div className="empty-icon">🔍</div>
                    <h3>No Results</h3>
                    <p>No extensions match &quot;{searchQuery}&quot;</p>
                  </>
                ) : (
                  <>
                    <div className="empty-icon">📦</div>
                    <h3>No Extensions Installed</h3>
                    <p>Install extensions from the Web Store or load unpacked</p>
                  </>
                )}
              </div>
            ) : (
              filteredExtensions.map(renderExtensionCard)
            )}
          </div>
        </div>

        <div className="extension-details-panel">
          {renderExtensionDetails()}
        </div>
      </div>
    );
  };

  const renderWebStoreTab = (): React.ReactNode => {
    return (
      <div className="webstore-content">
        <div className="webstore-header">
          <h2>Featured Extensions</h2>
          <p>Popular extensions recommended for CUBE Nexum</p>
        </div>

        <div className="webstore-grid">
          {FEATURED_EXTENSIONS.map(renderWebStoreCard)}
        </div>

        <div className="webstore-custom">
          <h3>Install from Chrome Web Store URL</h3>
          <div className="url-input-group">
            <input
              type="text"
              placeholder="https://chrome.google.com/webstore/detail/extension-name/..."
              value={webStoreUrl}
              onChange={(e) => setWebStoreUrl(e.target.value)}
            />
            <button
              className="install-url-btn"
              onClick={handleInstallFromUrl}
              disabled={installStatus.status === 'installing' || !webStoreUrl.trim()}
            >
              Install
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInstallTab = (): React.ReactNode => {
    return (
      <div className="install-content">
        <div className="install-options">
          <div className="install-option" onClick={handleInstallUnpacked}>
            <div className="option-icon">📁</div>
            <div className="option-info">
              <h3>Load Unpacked Extension</h3>
              <p>Install an extension from a local directory containing manifest.json</p>
            </div>
            <div className="option-arrow">→</div>
          </div>

          <div className="install-option" onClick={handleInstallFromCrx}>
            <div className="option-icon">📦</div>
            <div className="option-info">
              <h3>Install from CRX File</h3>
              <p>Install an extension from a downloaded .crx package file</p>
            </div>
            <div className="option-arrow">→</div>
          </div>

          <div
            className="install-option"
            onClick={() => setActiveTab('webstore')}
          >
            <div className="option-icon">🏪</div>
            <div className="option-info">
              <h3>Chrome Web Store</h3>
              <p>Browse and install extensions from the Chrome Web Store</p>
            </div>
            <div className="option-arrow">→</div>
          </div>
        </div>

        <div className="install-info">
          <h3>Developer Mode</h3>
          <p>
            CUBE Nexum supports loading unpacked extensions directly from your
            development directory. This is useful for testing extensions during
            development.
          </p>
          <div className="dev-tips">
            <h4>Tips for Extension Development</h4>
            <ul>
              <li>Ensure your extension has a valid manifest.json</li>
              <li>Use Manifest V3 for best compatibility</li>
              <li>Extensions are automatically enabled after installation</li>
              <li>Reload the browser to apply extension changes</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsTab = (): React.ReactNode => {
    return (
      <div className="settings-content">
        <div className="settings-section">
          <h3>Extension Settings</h3>
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Auto-update Extensions</h4>
              <p>Automatically check for and install extension updates</p>
            </div>
            <div className="setting-control">
              <button className="toggle-btn active" title="Auto-update enabled" aria-label="Toggle auto-update extensions">
                <div className="toggle-track">
                  <div className="toggle-thumb" />
                </div>
              </button>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Allow Extensions in Incognito</h4>
              <p>Extensions can access incognito windows when enabled</p>
            </div>
            <div className="setting-control">
              <button className="toggle-btn" title="Incognito access disabled" aria-label="Toggle incognito access">
                <div className="toggle-track">
                  <div className="toggle-thumb" />
                </div>
              </button>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Extension Sandboxing</h4>
              <p>Run extensions in isolated environment for security</p>
            </div>
            <div className="setting-control">
              <button className="toggle-btn active" title="Sandboxing enabled" aria-label="Toggle extension sandboxing">
                <div className="toggle-track">
                  <div className="toggle-thumb" />
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>CUBE Nexum Extension</h3>
          <p className="cube-ext-description">
            The CUBE Nexum Chrome Extension provides enhanced browser integration
            for automation, form filling, and data extraction.
          </p>
          
          <div className="cube-extension-status">
            <div className="status-indicator connected">
              <span className="indicator-dot" />
              <span>Connected to Tauri Backend</span>
            </div>
          </div>

          <div className="cube-extension-actions">
            <button className="action-btn primary">
              📥 Install CUBE Extension
            </button>
            <button className="action-btn secondary">
              🔄 Reload Extension
            </button>
            <button className="action-btn secondary">
              📋 Copy Extension ID
            </button>
          </div>
        </div>

        <div className="settings-section danger">
          <h3>Danger Zone</h3>
          
          <div className="danger-action">
            <div className="danger-info">
              <h4>Reset All Extensions</h4>
              <p>Remove all installed extensions and reset to default state</p>
            </div>
            <button className="danger-btn">Reset All</button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PERMISSIONS MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  const renderPermissionsModal = (): React.ReactNode => {
    if (!showPermissionsModal || !selectedExtension) {
      return null;
    }

    return (
      <div className="modal-overlay" onClick={() => setShowPermissionsModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Extension Permissions</h2>
            <button className="modal-close" onClick={() => setShowPermissionsModal(false)}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <h3>{selectedExtension.name}</h3>
            <p className="permissions-warning">
              This extension has access to the following:
            </p>
            <div className="permissions-detail-list">
              {selectedExtension.permissions.map((perm, idx) => (
                <div key={idx} className="permission-detail-item">
                  <span className="permission-icon">🔐</span>
                  <span className="permission-name">{perm}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="modal-btn secondary"
              onClick={() => setShowPermissionsModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <AppLayout>
    <div className="extensions-page">
      {renderInstallStatusBanner()}
      
      <div className="extensions-header">
        <div className="header-title">
          <h1>🧩 Extension Manager</h1>
          <p>Install and manage browser extensions for CUBE Nexum</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchExtensions} disabled={loading}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="extensions-tabs">
        <button
          className={`tab-btn ${activeTab === 'installed' ? 'active' : ''}`}
          onClick={() => setActiveTab('installed')}
        >
          📦 Installed ({extensions.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'webstore' ? 'active' : ''}`}
          onClick={() => setActiveTab('webstore')}
        >
          🏪 Web Store
        </button>
        <button
          className={`tab-btn ${activeTab === 'install' ? 'active' : ''}`}
          onClick={() => setActiveTab('install')}
        >
          ➕ Install
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="extensions-content">
        {activeTab === 'installed' && renderInstalledTab()}
        {activeTab === 'webstore' && renderWebStoreTab()}
        {activeTab === 'install' && renderInstallTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {renderPermissionsModal()}
    </div>
    </AppLayout>
  );
}
