/**
 * CUBE Nexum - Downloads Manager Component
 * Superior to Chrome, Firefox, Safari, Brave download managers
 * Full-featured download management UI
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import BrowserDownloadsService, {
  Download,
  DownloadSettings,
  DownloadStats,
  type DownloadQueue as _DownloadQueue,
  DownloadStatus,
  FileCategory,
  DownloadPriority,
} from '@/lib/services/browser-downloads-service';
import './Downloads.css';

// ==================== Sub-Components ====================

interface DownloadItemProps {
  download: Download;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string, deleteFile: boolean) => void;
  onOpenFile: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onSetPriority: (id: string, priority: DownloadPriority) => void;
  selected: boolean;
  onSelect: (id: string) => void;
}

const DownloadItem: React.FC<DownloadItemProps> = ({
  download,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onDelete,
  onOpenFile,
  onOpenFolder,
  onSetPriority,
  selected,
  onSelect,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const percentage = download.total_bytes > 0 
    ? (download.downloaded_bytes / download.total_bytes) * 100 
    : 0;

  const getStatusIcon = (status: DownloadStatus): string => {
    const icons: Record<DownloadStatus, string> = {
      Pending: '⏳',
      Downloading: '📥',
      Paused: '⏸️',
      Completed: '✅',
      Failed: '❌',
      Cancelled: '🚫',
      Queued: '📋',
      Verifying: '🔍',
      Extracting: '📦',
    };
    return icons[status] || '📄';
  };

  return (
    <div 
      className={`download-item ${selected ? 'selected' : ''} status-${download.status.toLowerCase()}`}
      onClick={() => onSelect(download.id)}
    >
      <div className="download-checkbox">
        <input 
          type="checkbox" 
          checked={selected} 
          onChange={() => onSelect(download.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="download-icon">
        {BrowserDownloadsService.getFileIcon(download.category)}
      </div>

      <div className="download-info">
        <div className="download-filename" title={download.filename}>
          {download.filename}
        </div>
        <div className="download-url" title={download.url}>
          {download.url}
        </div>
        <div className="download-meta">
          <span className="download-size">
            {BrowserDownloadsService.formatBytes(download.downloaded_bytes)}
            {download.total_bytes > 0 && ` / ${BrowserDownloadsService.formatBytes(download.total_bytes)}`}
          </span>
          {download.status === 'Downloading' && (
            <>
              <span className="download-speed">
                {BrowserDownloadsService.formatSpeed(download.speed_bps)}
              </span>
              <span className="download-eta">
                {BrowserDownloadsService.formatEta(download.eta_seconds)}
              </span>
            </>
          )}
          <span className="download-category">{download.category}</span>
        </div>
      </div>

      {(download.status === 'Downloading' || download.status === 'Paused') && (
        <div className="download-progress">
          <div 
            className="download-progress-bar" 
            style={{ width: `${percentage}%` }}
          />
          <span className="download-percentage">{percentage.toFixed(1)}%</span>
        </div>
      )}

      <div className="download-status">
        <span 
          className="status-badge"
          style={{ backgroundColor: BrowserDownloadsService.getStatusColor(download.status) }}
        >
          {getStatusIcon(download.status)} {download.status}
        </span>
      </div>

      <div className="download-actions">
        {download.status === 'Downloading' && (
          <button 
            className="action-btn pause" 
            onClick={(e) => { e.stopPropagation(); onPause(download.id); }}
            title="Pause"
          >
            ⏸️
          </button>
        )}
        {download.status === 'Paused' && (
          <button 
            className="action-btn resume" 
            onClick={(e) => { e.stopPropagation(); onResume(download.id); }}
            title="Resume"
          >
            ▶️
          </button>
        )}
        {(download.status === 'Downloading' || download.status === 'Paused' || download.status === 'Queued') && (
          <button 
            className="action-btn cancel" 
            onClick={(e) => { e.stopPropagation(); onCancel(download.id); }}
            title="Cancel"
          >
            ✕
          </button>
        )}
        {download.status === 'Failed' && (
          <button 
            className="action-btn retry" 
            onClick={(e) => { e.stopPropagation(); onRetry(download.id); }}
            title="Retry"
          >
            🔄
          </button>
        )}
        {download.status === 'Completed' && (
          <>
            <button 
              className="action-btn open" 
              onClick={(e) => { e.stopPropagation(); onOpenFile(download.id); }}
              title="Open File"
            >
              📂
            </button>
            <button 
              className="action-btn folder" 
              onClick={(e) => { e.stopPropagation(); onOpenFolder(download.id); }}
              title="Open Folder"
            >
              📁
            </button>
          </>
        )}
        <button 
          className="action-btn menu" 
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          title="More Options"
        >
          ⋮
        </button>

        {showMenu && (
          <div className="download-menu" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { onSetPriority(download.id, 'Critical'); setShowMenu(false); }}>
              ⚡ Critical Priority
            </button>
            <button onClick={() => { onSetPriority(download.id, 'High'); setShowMenu(false); }}>
              🔼 High Priority
            </button>
            <button onClick={() => { onSetPriority(download.id, 'Normal'); setShowMenu(false); }}>
              ➖ Normal Priority
            </button>
            <button onClick={() => { onSetPriority(download.id, 'Low'); setShowMenu(false); }}>
              🔽 Low Priority
            </button>
            <div className="menu-divider" />
            <button onClick={() => { onDelete(download.id, false); setShowMenu(false); }}>
              🗑️ Remove from List
            </button>
            {download.status === 'Completed' && (
              <button 
                className="danger"
                onClick={() => { onDelete(download.id, true); setShowMenu(false); }}
              >
                🗑️ Delete File
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface StatsBarProps {
  stats: DownloadStats;
  totalSpeed: number;
}

const StatsBar: React.FC<StatsBarProps> = ({ stats, totalSpeed }) => {
  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-label">Active</span>
        <span className="stat-value">{stats.downloads_today}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Completed</span>
        <span className="stat-value">{stats.completed_downloads}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Failed</span>
        <span className="stat-value">{stats.failed_downloads}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Speed</span>
        <span className="stat-value speed">{BrowserDownloadsService.formatSpeed(totalSpeed)}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Downloaded</span>
        <span className="stat-value">{BrowserDownloadsService.formatBytes(stats.total_bytes_downloaded)}</span>
      </div>
    </div>
  );
};

interface FilterBarProps {
  filter: {
    status: DownloadStatus | 'all';
    category: FileCategory | 'all';
    search: string;
  };
  onFilterChange: (filter: { status: DownloadStatus | 'all'; category: FileCategory | 'all'; search: string }) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filter, onFilterChange }) => {
  return (
    <div className="filter-bar">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search downloads..."
          value={filter.search}
          onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
        />
        {filter.search && (
          <button 
            className="clear-search"
            onClick={() => onFilterChange({ ...filter, search: '' })}
          >
            ✕
          </button>
        )}
      </div>

      <select
        value={filter.status}
        onChange={(e) => onFilterChange({ ...filter, status: e.target.value as DownloadStatus | 'all' })}
        className="filter-select"
      >
        <option value="all">All Status</option>
        <option value="Downloading">Downloading</option>
        <option value="Paused">Paused</option>
        <option value="Completed">Completed</option>
        <option value="Failed">Failed</option>
        <option value="Queued">Queued</option>
        <option value="Cancelled">Cancelled</option>
      </select>

      <select
        value={filter.category}
        onChange={(e) => onFilterChange({ ...filter, category: e.target.value as FileCategory | 'all' })}
        className="filter-select"
      >
        <option value="all">All Categories</option>
        <option value="Document">📄 Documents</option>
        <option value="Image">🖼️ Images</option>
        <option value="Video">🎬 Videos</option>
        <option value="Audio">🎵 Audio</option>
        <option value="Archive">📦 Archives</option>
        <option value="Executable">⚙️ Executables</option>
        <option value="Code">💻 Code</option>
        <option value="Other">📁 Other</option>
      </select>
    </div>
  );
};

interface AddDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (url: string, filename?: string) => void;
}

const AddDownloadModal: React.FC<AddDownloadModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [url, setUrl] = useState('');
  const [filename, setFilename] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAdd(url.trim(), filename.trim() || undefined);
      setUrl('');
      setFilename('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-download-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>➕ Add Download</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>URL</label>
            <input
              type="url"
              placeholder="https://example.com/file.zip"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Filename (optional)</label>
            <input
              type="text"
              placeholder="Leave empty to auto-detect"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary">
              Add Download
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DownloadSettings;
  onSave: (settings: DownloadSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚙️ Download Settings</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="settings-content">
          <div className="settings-section">
            <h4>General</h4>
            <div className="setting-item">
              <label>Default Download Directory</label>
              <input
                type="text"
                value={localSettings.default_directory}
                onChange={(e) => setLocalSettings({ ...localSettings, default_directory: e.target.value })}
              />
            </div>
            <div className="setting-item toggle">
              <label>Ask where to save each file</label>
              <input
                type="checkbox"
                checked={localSettings.ask_where_to_save}
                onChange={(e) => setLocalSettings({ ...localSettings, ask_where_to_save: e.target.checked })}
              />
            </div>
            <div className="setting-item toggle">
              <label>Open file when download completes</label>
              <input
                type="checkbox"
                checked={localSettings.auto_open_when_done}
                onChange={(e) => setLocalSettings({ ...localSettings, auto_open_when_done: e.target.checked })}
              />
            </div>
            <div className="setting-item toggle">
              <label>Show notification on complete</label>
              <input
                type="checkbox"
                checked={localSettings.notify_on_complete}
                onChange={(e) => setLocalSettings({ ...localSettings, notify_on_complete: e.target.checked })}
              />
            </div>
          </div>

          <div className="settings-section">
            <h4>Performance</h4>
            <div className="setting-item">
              <label>Max Concurrent Downloads</label>
              <input
                type="number"
                min="1"
                max="20"
                value={localSettings.max_concurrent_downloads}
                onChange={(e) => setLocalSettings({ ...localSettings, max_concurrent_downloads: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="setting-item">
              <label>Max Connections Per Download</label>
              <input
                type="number"
                min="1"
                max="32"
                value={localSettings.max_connections_per_download}
                onChange={(e) => setLocalSettings({ ...localSettings, max_connections_per_download: parseInt(e.target.value) || 8 })}
              />
            </div>
            <div className="setting-item toggle">
              <label>Enable Bandwidth Limit</label>
              <input
                type="checkbox"
                checked={localSettings.bandwidth_limit_enabled}
                onChange={(e) => setLocalSettings({ ...localSettings, bandwidth_limit_enabled: e.target.checked })}
              />
            </div>
            {localSettings.bandwidth_limit_enabled && (
              <div className="setting-item">
                <label>Bandwidth Limit (KB/s)</label>
                <input
                  type="number"
                  min="0"
                  value={localSettings.bandwidth_limit_kbps}
                  onChange={(e) => setLocalSettings({ ...localSettings, bandwidth_limit_kbps: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
          </div>

          <div className="settings-section">
            <h4>Organization</h4>
            <div className="setting-item toggle">
              <label>Organize downloads by file type</label>
              <input
                type="checkbox"
                checked={localSettings.organize_by_type}
                onChange={(e) => setLocalSettings({ ...localSettings, organize_by_type: e.target.checked })}
              />
            </div>
            <div className="setting-item toggle">
              <label>Auto-extract archives</label>
              <input
                type="checkbox"
                checked={localSettings.auto_extract_archives}
                onChange={(e) => setLocalSettings({ ...localSettings, auto_extract_archives: e.target.checked })}
              />
            </div>
            <div className="setting-item toggle">
              <label>Scan downloads for viruses</label>
              <input
                type="checkbox"
                checked={localSettings.virus_scan_enabled}
                onChange={(e) => setLocalSettings({ ...localSettings, virus_scan_enabled: e.target.checked })}
              />
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
};

// ==================== Main Component ====================

const Downloads: React.FC = () => {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [settings, setSettings] = useState<DownloadSettings | null>(null);
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [totalSpeed, setTotalSpeed] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<{
    status: DownloadStatus | 'all';
    category: FileCategory | 'all';
    search: string;
  }>({ status: 'all', category: 'all', search: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [allDownloads, downloadSettings, downloadStats, speed] = await Promise.all([
        BrowserDownloadsService.getAll(),
        BrowserDownloadsService.getSettings(),
        BrowserDownloadsService.getStats(),
        BrowserDownloadsService.getTotalSpeed(),
      ]);
      setDownloads(allDownloads);
      setSettings(downloadSettings);
      setStats(downloadStats);
      setTotalSpeed(speed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load downloads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1000); // Refresh every second for active downloads
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredDownloads = downloads.filter(d => {
    if (filter.status !== 'all' && d.status !== filter.status) return false;
    if (filter.category !== 'all' && d.category !== filter.category) return false;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      if (!d.filename.toLowerCase().includes(search) && !d.url.toLowerCase().includes(search)) {
        return false;
      }
    }
    return true;
  });

  const handlePause = async (id: string) => {
    try {
      await BrowserDownloadsService.pause(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause download');
    }
  };

  const handleResume = async (id: string) => {
    try {
      await BrowserDownloadsService.resume(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume download');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await BrowserDownloadsService.cancel(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel download');
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await BrowserDownloadsService.retry(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry download');
    }
  };

  const handleDelete = async (id: string, deleteFile: boolean) => {
    try {
      await BrowserDownloadsService.delete(id, deleteFile);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete download');
    }
  };

  const handleOpenFile = async (id: string) => {
    try {
      await BrowserDownloadsService.openFile(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open file');
    }
  };

  const handleOpenFolder = async (id: string) => {
    try {
      await BrowserDownloadsService.openFolder(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open folder');
    }
  };

  const handleSetPriority = async (id: string, priority: DownloadPriority) => {
    try {
      await BrowserDownloadsService.setPriority(id, priority);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set priority');
    }
  };

  const handleAddDownload = async (url: string, filename?: string) => {
    try {
      const download = await BrowserDownloadsService.create(url, filename);
      await BrowserDownloadsService.start(download.id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add download');
    }
  };

  const handleSaveSettings = async (newSettings: DownloadSettings) => {
    try {
      await BrowserDownloadsService.updateSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  const handleBulkAction = async (action: 'pause' | 'resume' | 'cancel' | 'delete') => {
    try {
      switch (action) {
        case 'pause':
          await BrowserDownloadsService.pauseAll();
          break;
        case 'resume':
          await BrowserDownloadsService.resumeAll();
          break;
        case 'cancel':
          await BrowserDownloadsService.cancelAll();
          break;
        case 'delete':
          for (const id of selectedIds) {
            await BrowserDownloadsService.delete(id, false);
          }
          setSelectedIds(new Set());
          break;
      }
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} downloads`);
    }
  };

  const handleClearCompleted = async () => {
    try {
      await BrowserDownloadsService.clearCompleted();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear completed');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredDownloads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDownloads.map(d => d.id)));
    }
  };

  if (loading) {
    return (
      <div className="downloads-page loading">
        <div className="loading-spinner">
          <span>📥</span>
          <p>Loading downloads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="downloads-page">
      <header className="downloads-header">
        <div className="header-left">
          <h1>📥 Downloads Manager</h1>
          <span className="download-count">{downloads.length} downloads</span>
        </div>
        <div className="header-actions">
          <button className="btn primary" onClick={() => setShowAddModal(true)}>
            ➕ Add Download
          </button>
          <button className="btn secondary" onClick={handleClearCompleted}>
            🧹 Clear Completed
          </button>
          <button className="btn icon" onClick={() => setShowSettingsModal(true)} title="Settings">
            ⚙️
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {stats && <StatsBar stats={stats} totalSpeed={totalSpeed} />}

      <FilterBar filter={filter} onFilterChange={setFilter} />

      {selectedIds.size > 0 && (
        <div className="bulk-actions">
          <span>{selectedIds.size} selected</span>
          <button onClick={() => handleBulkAction('pause')}>⏸️ Pause All</button>
          <button onClick={() => handleBulkAction('resume')}>▶️ Resume All</button>
          <button onClick={() => handleBulkAction('cancel')}>✕ Cancel All</button>
          <button onClick={() => handleBulkAction('delete')}>🗑️ Remove Selected</button>
          <button onClick={() => setSelectedIds(new Set())}>Clear Selection</button>
        </div>
      )}

      <div className="downloads-list-header">
        <div className="select-all">
          <input
            type="checkbox"
            checked={selectedIds.size === filteredDownloads.length && filteredDownloads.length > 0}
            onChange={selectAll}
          />
          <span>Select All</span>
        </div>
        <div className="sort-options">
          <span>Sort by:</span>
          <button className="active">Date</button>
          <button>Name</button>
          <button>Size</button>
          <button>Status</button>
        </div>
      </div>

      <div className="downloads-list">
        {filteredDownloads.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No downloads</h3>
            <p>
              {filter.search || filter.status !== 'all' || filter.category !== 'all'
                ? 'No downloads match your filters'
                : 'Click "Add Download" to start downloading files'}
            </p>
          </div>
        ) : (
          filteredDownloads.map(download => (
            <DownloadItem
              key={download.id}
              download={download}
              onPause={handlePause}
              onResume={handleResume}
              onCancel={handleCancel}
              onRetry={handleRetry}
              onDelete={handleDelete}
              onOpenFile={handleOpenFile}
              onOpenFolder={handleOpenFolder}
              onSetPriority={handleSetPriority}
              selected={selectedIds.has(download.id)}
              onSelect={toggleSelect}
            />
          ))
        )}
      </div>

      <AddDownloadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddDownload}
      />

      {settings && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          settings={settings}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
};

export default Downloads;
