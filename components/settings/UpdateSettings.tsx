/**
 * UpdateSettings Component
 * Manages application updates, auto-update settings, and cloud sync
 */

"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('UpdateSettings');

import React, { useState } from 'react';
import { UpdateService } from '@/lib/services/settings-service';
import { 
  RefreshCw, 
  Download, 
  Check, 
  AlertCircle, 
  Cloud, 
  CloudOff, 
  Monitor, 
  Smartphone,
  HardDrive,
  Settings,
  History,
  Shield,
  Zap,
  ExternalLink,
  ChevronRight,
  Loader2,
  Clock,
  Package,
  Trash2,
  Upload
} from 'lucide-react';
import { useUpdateStore } from '@/stores/updateStore';
import { useCloudSyncStore } from '@/stores/cloudSyncStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import './UpdateSettings.css';

interface UpdateSettingsProps {
  onNavigateToPortal?: () => void;
}

export const UpdateSettings: React.FC<UpdateSettingsProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onNavigateToPortal
}) => {
  const {
    currentVersion,
    extensionVersion,
    latestVersion,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    latestExtensionVersion,
    settings,
    progress,
    updateHistory,
    lastChecked,
    updateSettings,
    setProgress,
    setLatestVersion,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setLatestExtensionVersion,
    setLastChecked,
    isUpdateAvailable,
    isExtensionUpdateAvailable,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    resetProgress
  } = useUpdateStore();

  const {
    isConnected,
    syncEnabled,
    syncOnStartup,
    syncInterval,
    syncableData,
    status,
    devices,
    backups,
    autoBackupEnabled,
    autoBackupInterval,
    portalSettings,
    setSyncEnabled,
    setSyncOnStartup,
    setSyncInterval,
    updateSyncableData,
    setAutoBackupEnabled,
    setAutoBackupInterval,
    startSync,
    completeSync,
    failSync
  } = useCloudSyncStore();

  const [activeSection, setActiveSection] = useState<'updates' | 'sync' | 'devices' | 'backups'>('updates');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    setProgress({ status: 'checking' });
    
    try {
      // Simulate API call to check for updates
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response - in production this would be an API call
      const mockUpdate = {
        version: '7.1.0',
        releaseDate: new Date().toISOString(),
        size: '45.2 MB',
        changelog: [
          'New AI-powered search functionality',
          'Improved performance and stability',
          'Bug fixes and security updates',
          'New automation templates'
        ],
        mandatory: false,
        downloadUrl: 'https://releases.cubeai.tools/v7.1.0',
        checksum: 'sha256:abc123...',
        platform: 'all' as const
      };

      setLatestVersion(mockUpdate);
      setLastChecked(new Date().toISOString());
      setProgress({ status: 'idle' });
    } catch (error) {
      setProgress({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to check for updates' 
      });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleDownloadUpdate = async () => {
    if (!latestVersion) return;
    
    setProgress({ 
      status: 'downloading', 
      progress: 0,
      bytesDownloaded: 0,
      totalBytes: 47400000 // ~45MB
    });

    // Simulate download progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const bytes = Math.floor((i / 100) * 47400000);
      setProgress({
        progress: i,
        bytesDownloaded: bytes,
        speed: `${(2.5 + Math.random()).toFixed(1)} MB/s`,
        eta: `${Math.ceil((100 - i) / 10)}s`
      });
    }

    setProgress({ status: 'completed', progress: 100 });
  };

  const handleInstallUpdate = async () => {
    setProgress({ status: 'installing' });
    
    try {
      // In production, this would trigger the Tauri updater
      await UpdateService.installUpdate();
    } catch {
      // If Tauri command fails, show manual restart option
      log.debug('Update will be installed on restart');
    }
  };

  const handleSyncNow = async () => {
    startSync();
    
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 3000));
      completeSync();
    } catch (error) {
      failSync(error instanceof Error ? error.message : 'Sync failed');
    }
  };

  const handleOpenPortal = (path: string) => {
    const url = `${portalSettings.portalUrl}${path}`;
    window.open(url, '_blank');
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="update-settings">
      {/* Section Navigation */}
      <div className="update-nav">
        <button 
          className={`update-nav-item ${activeSection === 'updates' ? 'active' : ''}`}
          onClick={() => setActiveSection('updates')}
        >
          <Download size={18} />
          <span>Updates</span>
        </button>
        <button 
          className={`update-nav-item ${activeSection === 'sync' ? 'active' : ''}`}
          onClick={() => setActiveSection('sync')}
        >
          <Cloud size={18} />
          <span>Cloud Sync</span>
        </button>
        <button 
          className={`update-nav-item ${activeSection === 'devices' ? 'active' : ''}`}
          onClick={() => setActiveSection('devices')}
        >
          <Monitor size={18} />
          <span>Devices</span>
        </button>
        <button 
          className={`update-nav-item ${activeSection === 'backups' ? 'active' : ''}`}
          onClick={() => setActiveSection('backups')}
        >
          <HardDrive size={18} />
          <span>Backups</span>
        </button>
      </div>

      {/* Updates Section */}
      {activeSection === 'updates' && (
        <div className="update-section">
          {/* Current Version Card */}
          <div className="version-card">
            <div className="version-header">
              <div className="version-icon">
                <Package size={24} />
              </div>
              <div className="version-info">
                <h3>CUBE Nexum</h3>
                <div className="version-details">
                  <span className="version-number">v{currentVersion}</span>
                  <span className="version-channel">{settings.channel}</span>
                </div>
              </div>
              <div className="version-status">
                {isUpdateAvailable() ? (
                  <span className="status-badge update-available">
                    <Zap size={14} />
                    Update Available
                  </span>
                ) : (
                  <span className="status-badge up-to-date">
                    <Check size={14} />
                    Up to Date
                  </span>
                )}
              </div>
            </div>

            {/* Extension Version */}
            <div className="extension-version">
              <span className="ext-label">Chrome Extension:</span>
              <span className="ext-version">v{extensionVersion}</span>
              {isExtensionUpdateAvailable() && (
                <span className="ext-update-badge">Update</span>
              )}
            </div>

            {/* Check Button */}
            <div className="check-update-row">
              <span className="last-checked">
                Last checked: {formatDate(lastChecked)}
              </span>
              <Button 
                onClick={handleCheckForUpdates}
                disabled={isCheckingUpdate}
                className="check-btn"
              >
                {isCheckingUpdate ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Check for Updates
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Update Available Card */}
          {latestVersion && isUpdateAvailable() && (
            <div className="update-available-card">
              <div className="update-header">
                <div className="update-badge">
                  <Zap size={16} />
                  New Version Available
                </div>
                <span className="new-version">v{latestVersion.version}</span>
              </div>

              <div className="changelog">
                <h4>What&apos;s New</h4>
                <ul>
                  {latestVersion.changelog.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="update-meta">
                <span><Clock size={14} /> {new Date(latestVersion.releaseDate).toLocaleDateString()}</span>
                <span><HardDrive size={14} /> {latestVersion.size}</span>
              </div>

              {/* Download Progress */}
              {progress.status === 'downloading' && (
                <div className="download-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      ref={(el) => { if (el) el.style.width = `${progress.progress}%`; }}
                    />
                  </div>
                  <div className="progress-info">
                    <span>{formatBytes(progress.bytesDownloaded)} / {formatBytes(progress.totalBytes)}</span>
                    <span>{progress.speed} • {progress.eta}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="update-actions">
                {progress.status === 'idle' && (
                  <Button onClick={handleDownloadUpdate} className="download-btn">
                    <Download size={16} />
                    Download Update
                  </Button>
                )}
                {progress.status === 'completed' && (
                  <Button onClick={handleInstallUpdate} className="install-btn">
                    <Check size={16} />
                    Install & Restart
                  </Button>
                )}
                <Button variant="outline" onClick={() => handleOpenPortal('/releases')}>
                  View Release Notes
                  <ExternalLink size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* Update Settings */}
          <div className="settings-card">
            <h3>Update Preferences</h3>
            
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Auto-check for updates</span>
                <span className="setting-desc">Automatically check for new versions</span>
              </div>
              <Switch 
                checked={settings.autoCheck}
                onCheckedChange={(checked) => updateSettings({ autoCheck: checked })}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Auto-download updates</span>
                <span className="setting-desc">Download updates in the background</span>
              </div>
              <Switch 
                checked={settings.autoDownload}
                onCheckedChange={(checked) => updateSettings({ autoDownload: checked })}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Install on exit</span>
                <span className="setting-desc">Apply updates when closing the app</span>
              </div>
              <Switch 
                checked={settings.installOnExit}
                onCheckedChange={(checked) => updateSettings({ installOnExit: checked })}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Check interval</span>
              </div>
              <Select 
                value={settings.checkInterval}
                onValueChange={(value) => updateSettings({ checkInterval: value as typeof settings.checkInterval })}
              >
                <SelectTrigger className="interval-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Every hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="manual">Manual only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Update channel</span>
              </div>
              <Select 
                value={settings.channel}
                onValueChange={(value) => updateSettings({ channel: value as typeof settings.channel })}
              >
                <SelectTrigger className="channel-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="nightly">Nightly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Update History */}
          {updateHistory.length > 0 && (
            <div className="settings-card">
              <h3>
                <History size={18} />
                Update History
              </h3>
              <div className="history-list">
                {updateHistory.slice(0, 5).map((entry, index) => (
                  <div key={index} className="history-item">
                    <div className="history-info">
                      <span className="history-version">v{entry.version}</span>
                      <span className="history-date">{formatDate(entry.installedAt)}</span>
                    </div>
                    <span className={`history-status ${entry.success ? 'success' : 'failed'}`}>
                      {entry.success ? <Check size={14} /> : <AlertCircle size={14} />}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cloud Sync Section */}
      {activeSection === 'sync' && (
        <div className="update-section">
          {/* Sync Status Card */}
          <div className="sync-status-card">
            <div className="sync-header">
              <div className={`sync-icon ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? <Cloud size={24} /> : <CloudOff size={24} />}
              </div>
              <div className="sync-info">
                <h3>Cloud Sync</h3>
                <span className={`sync-state ${isConnected ? 'connected' : 'disconnected'}`}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              {isConnected && (
                <Button 
                  onClick={handleSyncNow}
                  disabled={status.isSyncing}
                  size="sm"
                >
                  {status.isSyncing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      Sync Now
                    </>
                  )}
                </Button>
              )}
            </div>

            {isConnected && (
              <div className="sync-meta">
                <span>Last sync: {formatDate(status.lastSync)}</span>
                {status.pendingChanges > 0 && (
                  <span className="pending-badge">{status.pendingChanges} pending</span>
                )}
              </div>
            )}

            {!isConnected && (
              <div className="connect-prompt">
                <p>Sign in to sync your settings across devices</p>
                <Button onClick={() => handleOpenPortal('/login')}>
                  Sign In
                  <ExternalLink size={14} />
                </Button>
              </div>
            )}
          </div>

          {/* Sync Settings */}
          <div className="settings-card">
            <h3>Sync Settings</h3>
            
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Enable sync</span>
                <span className="setting-desc">Keep your data in sync across devices</span>
              </div>
              <Switch 
                checked={syncEnabled}
                onCheckedChange={setSyncEnabled}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Sync on startup</span>
                <span className="setting-desc">Automatically sync when app opens</span>
              </div>
              <Switch 
                checked={syncOnStartup}
                onCheckedChange={setSyncOnStartup}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Sync frequency</span>
              </div>
              <Select 
                value={syncInterval}
                onValueChange={(value) => setSyncInterval(value as typeof syncInterval)}
              >
                <SelectTrigger className="interval-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="5min">Every 5 minutes</SelectItem>
                  <SelectItem value="15min">Every 15 minutes</SelectItem>
                  <SelectItem value="30min">Every 30 minutes</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="manual">Manual only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* What to Sync */}
          <div className="settings-card">
            <h3>Data to Sync</h3>
            
            {Object.entries(syncableData).map(([key, value]) => (
              <div key={key} className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                </div>
                <Switch 
                  checked={value}
                  onCheckedChange={(checked) => updateSyncableData({ [key]: checked })}
                />
              </div>
            ))}
          </div>

          {/* Online Portal Links */}
          <div className="portal-links-card">
            <h3>Online Account</h3>
            <div className="portal-links">
              <button className="portal-link" onClick={() => handleOpenPortal('/account')}>
                <Settings size={18} />
                <span>Account Settings</span>
                <ChevronRight size={16} />
              </button>
              <button className="portal-link" onClick={() => handleOpenPortal('/billing')}>
                <Shield size={18} />
                <span>Billing & Subscription</span>
                <ChevronRight size={16} />
              </button>
              <button className="portal-link" onClick={() => handleOpenPortal('/plans')}>
                <Zap size={18} />
                <span>Upgrade Plan</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Devices Section */}
      {activeSection === 'devices' && (
        <div className="update-section">
          <div className="settings-card">
            <h3>Connected Devices</h3>
            <p className="section-desc">Manage devices synced to your account</p>
            
            {devices.length === 0 ? (
              <div className="empty-devices">
                <Monitor size={48} />
                <p>No devices connected</p>
                <span>Sign in on other devices to see them here</span>
              </div>
            ) : (
              <div className="devices-list">
                {devices.map((device) => (
                  <div key={device.id} className={`device-item ${device.isCurrentDevice ? 'current' : ''}`}>
                    <div className="device-icon">
                      {device.platform === 'extension' ? <Smartphone size={20} /> : <Monitor size={20} />}
                    </div>
                    <div className="device-info">
                      <span className="device-name">
                        {device.name}
                        {device.isCurrentDevice && <span className="current-badge">This device</span>}
                      </span>
                      <span className="device-meta">
                        {device.platform} • {device.browser || 'Desktop App'} • Last active: {formatDate(device.lastActive)}
                      </span>
                    </div>
                    {!device.isCurrentDevice && (
                      <Button variant="ghost" size="sm" className="remove-device-btn">
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backups Section */}
      {activeSection === 'backups' && (
        <div className="update-section">
          <div className="settings-card">
            <h3>Cloud Backups</h3>
            
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Auto backup</span>
                <span className="setting-desc">Automatically backup your data</span>
              </div>
              <Switch 
                checked={autoBackupEnabled}
                onCheckedChange={setAutoBackupEnabled}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Backup frequency</span>
              </div>
              <Select 
                value={autoBackupInterval}
                onValueChange={(value) => setAutoBackupInterval(value as typeof autoBackupInterval)}
              >
                <SelectTrigger className="interval-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="backup-actions">
              <Button>
                <Upload size={16} />
                Create Backup Now
              </Button>
            </div>
          </div>

          {/* Backup List */}
          <div className="settings-card">
            <h3>Your Backups</h3>
            
            {backups.length === 0 ? (
              <div className="empty-backups">
                <HardDrive size={48} />
                <p>No backups yet</p>
                <span>Create a backup to protect your data</span>
              </div>
            ) : (
              <div className="backups-list">
                {backups.map((backup) => (
                  <div key={backup.id} className="backup-item">
                    <div className="backup-info">
                      <span className="backup-name">{backup.name}</span>
                      <span className="backup-meta">
                        {formatDate(backup.createdAt)} • {backup.size}
                      </span>
                    </div>
                    <div className="backup-actions-row">
                      <Button variant="outline" size="sm">
                        <Download size={14} />
                        Restore
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateSettings;
