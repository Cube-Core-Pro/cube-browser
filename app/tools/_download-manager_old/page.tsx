"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');

/**
 * Download Manager Page - Main download management interface
 * CUBE Nexum Platform v2.0
 */


import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  DownloadItem,
  DownloadQueue,
  DownloadStats,
  DownloadSettings,
  DownloadFilter,
  DownloadSort,
  BandwidthLimit,
  DownloadStatus,
  generateDownloadId,
  getCategoryFromFilename,
  filterDownloads,
  sortDownloads,
  getDownloadStats,
  extractFilename,
  isValidDownloadUrl,
} from '../../../types/download';
import { DownloadList } from '../../../components/download/DownloadList';
import { DownloadStats as StatsPanel } from '../../../components/download/DownloadStats';
import { AddDownloadDialog } from '../../../components/download/AddDownloadDialog';
import { SettingsPanel } from '../../../components/download/SettingsPanel';
import { FilterPanel } from '../../../components/download/FilterPanel';
import './download.css';

export default function DownloadManagerPage() {
  // State
  const [queue, setQueue] = useState<DownloadQueue>({
    active: [],
    pending: [],
    completed: [],
    failed: [],
  });
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [settings, setSettings] = useState<DownloadSettings>({
    max_concurrent: 3,
    speed_limit: 0,
    default_destination: '',
    auto_organize: true,
    resume_on_startup: true,
    show_notifications: true,
    delete_completed_after: 0,
    chunk_size: 1048576, // 1MB
  });
  const [bandwidthLimit, setBandwidthLimit] = useState<BandwidthLimit>({
    enabled: false,
    limit: 0,
    schedule: [],
  });
  const [filter, setFilter] = useState<DownloadFilter>({});
  const [sort, setSort] = useState<DownloadSort>({
    by: 'date',
    direction: 'desc',
  });
  
  // UI State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'failed'>('active');
  const [_loading, _setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings and queue from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('download-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    const savedQueue = localStorage.getItem('download-queue');
    if (savedQueue) {
      setQueue(JSON.parse(savedQueue));
    }
    
    const savedBandwidth = localStorage.getItem('bandwidth-limit');
    if (savedBandwidth) {
      setBandwidthLimit(JSON.parse(savedBandwidth));
    }
  }, []);

  // Save settings and queue to localStorage
  useEffect(() => {
    localStorage.setItem('download-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('download-queue', JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    localStorage.setItem('bandwidth-limit', JSON.stringify(bandwidthLimit));
  }, [bandwidthLimit]);

  // Update stats when queue changes
  useEffect(() => {
    setStats(getDownloadStats(queue));
  }, [queue]);

  // Start download
  const handleStartDownload = useCallback(async (url: string, destination?: string) => {
    if (!isValidDownloadUrl(url)) {
      setError('Invalid URL');
      return;
    }

    const id = generateDownloadId();
    const filename = extractFilename(url);
    const dest = destination || settings.default_destination || '/Downloads';

    const newItem: DownloadItem = {
      id,
      url,
      filename,
      destination: dest,
      file_size: 0,
      downloaded_bytes: 0,
      status: 'pending',
      category: getCategoryFromFilename(filename),
      speed: 0,
      eta: 0,
      progress: 0,
      start_time: Date.now(),
      resume_supported: false,
    };

    setQueue((prev) => ({
      ...prev,
      pending: [...prev.pending, newItem],
    }));

    // Process queue
    processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.default_destination]);

  // Process download queue
  const processQueue = useCallback(() => {
    setQueue((prev) => {
      const activeCount = prev.active.length;
      if (activeCount >= settings.max_concurrent) return prev;

      const availableSlots = settings.max_concurrent - activeCount;
      const itemsToStart = prev.pending.slice(0, availableSlots);

      if (itemsToStart.length === 0) return prev;

      const newActive = [...prev.active];
      const newPending = prev.pending.slice(availableSlots);

      itemsToStart.forEach((item) => {
        const updatedItem = { ...item, status: 'downloading' as DownloadStatus };
        newActive.push(updatedItem);
        startDownloadBackend(updatedItem);
      });

      return {
        ...prev,
        active: newActive,
        pending: newPending,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.max_concurrent]);

  // Start download in backend
  const startDownloadBackend = async (item: DownloadItem) => {
    try {
      await invoke('toolbar_download_file', {
        url: item.url,
        destination: `${item.destination}/${item.filename}`,
      });

      // Simulate progress updates (in real implementation, use Tauri events)
      simulateDownloadProgress(item.id);
    } catch (err) {
      handleDownloadError(item.id, err instanceof Error ? err.message : 'Download failed');
    }
  };

  // Simulate download progress (replace with real Tauri events)
  const simulateDownloadProgress = (id: string) => {
    const interval = setInterval(() => {
      setQueue((prev) => {
        const item = prev.active.find((d) => d.id === id);
        if (!item) {
          clearInterval(interval);
          return prev;
        }

        const newDownloadedBytes = Math.min(
          item.downloaded_bytes + Math.random() * 100000,
          item.file_size || 1000000
        );
        const progress = item.file_size > 0 ? (newDownloadedBytes / item.file_size) * 100 : 0;
        const elapsed = (Date.now() - item.start_time) / 1000;
        const speed = newDownloadedBytes / elapsed;
        const eta = speed > 0 ? (item.file_size - newDownloadedBytes) / speed : 0;

        if (progress >= 100) {
          clearInterval(interval);
          handleDownloadComplete(id);
          return prev;
        }

        return {
          ...prev,
          active: prev.active.map((d) =>
            d.id === id
              ? { ...d, downloaded_bytes: newDownloadedBytes, progress, speed, eta }
              : d
          ),
        };
      });
    }, 500);
  };

  // Pause download
  const handlePause = useCallback((id: string) => {
    setQueue((prev) => ({
      ...prev,
      active: prev.active.map((item) =>
        item.id === id ? { ...item, status: 'paused', paused_at: Date.now() } : item
      ),
    }));
  }, []);

  // Resume download
  const handleResume = useCallback((id: string) => {
    setQueue((prev) => ({
      ...prev,
      active: prev.active.map((item) =>
        item.id === id ? { ...item, status: 'downloading', paused_at: undefined } : item
      ),
    }));
  }, []);

  // Cancel download
  const handleCancel = useCallback((id: string) => {
    setQueue((prev) => ({
      ...prev,
      active: prev.active.filter((item) => item.id !== id),
      pending: prev.pending.filter((item) => item.id !== id),
    }));
  }, []);

  // Retry failed download
  const handleRetry = useCallback((id: string) => {
    setQueue((prev) => {
      const item = prev.failed.find((d) => d.id === id);
      if (!item) return prev;

      const resetItem = {
        ...item,
        status: 'pending' as DownloadStatus,
        downloaded_bytes: 0,
        progress: 0,
        error: undefined,
        start_time: Date.now(),
      };

      return {
        ...prev,
        failed: prev.failed.filter((d) => d.id !== id),
        pending: [...prev.pending, resetItem],
      };
    });
    processQueue();
  }, [processQueue]);

  // Remove download
  const handleRemove = useCallback((id: string) => {
    setQueue((prev) => ({
      ...prev,
      completed: prev.completed.filter((item) => item.id !== id),
      failed: prev.failed.filter((item) => item.id !== id),
    }));
  }, []);

  // Clear completed downloads
  const handleClearCompleted = useCallback(() => {
    setQueue((prev) => ({
      ...prev,
      completed: [],
    }));
  }, []);

  // Clear failed downloads
  const handleClearFailed = useCallback(() => {
    setQueue((prev) => ({
      ...prev,
      failed: [],
    }));
  }, []);

  // Download complete
  const handleDownloadComplete = (id: string) => {
    setQueue((prev) => {
      const item = prev.active.find((d) => d.id === id);
      if (!item) return prev;

      const completedItem = {
        ...item,
        status: 'completed' as DownloadStatus,
        progress: 100,
        end_time: Date.now(),
      };

      return {
        ...prev,
        active: prev.active.filter((d) => d.id !== id),
        completed: [...prev.completed, completedItem],
      };
    });

    if (settings.show_notifications) {
      // Show notification
      log.debug(`Download completed: ${id}`);
    }

    processQueue();
  };

  // Download error
  const handleDownloadError = (id: string, error: string) => {
    setQueue((prev) => {
      const item = prev.active.find((d) => d.id === id);
      if (!item) return prev;

      const failedItem = {
        ...item,
        status: 'failed' as DownloadStatus,
        error,
        end_time: Date.now(),
      };

      return {
        ...prev,
        active: prev.active.filter((d) => d.id !== id),
        failed: [...prev.failed, failedItem],
      };
    });

    processQueue();
  };

  // Get filtered and sorted downloads
  const getDisplayDownloads = () => {
    let downloads: DownloadItem[] = [];
    
    switch (selectedTab) {
      case 'active':
        downloads = [...queue.active, ...queue.pending];
        break;
      case 'completed':
        downloads = queue.completed;
        break;
      case 'failed':
        downloads = queue.failed;
        break;
    }

    downloads = filterDownloads(downloads, filter);
    downloads = sortDownloads(downloads, sort);

    return downloads;
  };

  return (
    <div className="download-manager-page">
      <div className="download-header">
        <div className="header-title">
          <h1>Download Manager</h1>
        </div>
        <div className="header-actions">
          <button
            className="header-btn"
            onClick={() => setShowAddDialog(true)}
          >
            <span className="icon">+</span>
            New Download
          </button>
          <button
            className={`header-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="icon">🔍</span>
            Filters
          </button>
          <button
            className={`header-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <span className="icon">⚙️</span>
            Settings
          </button>
        </div>
      </div>

      {stats && <StatsPanel stats={stats} bandwidthLimit={bandwidthLimit} />}

      <div className="download-main">
        <div className="download-tabs">
          <button
            className={`tab ${selectedTab === 'active' ? 'active' : ''}`}
            onClick={() => setSelectedTab('active')}
          >
            Active ({queue.active.length + queue.pending.length})
          </button>
          <button
            className={`tab ${selectedTab === 'completed' ? 'active' : ''}`}
            onClick={() => setSelectedTab('completed')}
          >
            Completed ({queue.completed.length})
          </button>
          <button
            className={`tab ${selectedTab === 'failed' ? 'active' : ''}`}
            onClick={() => setSelectedTab('failed')}
          >
            Failed ({queue.failed.length})
          </button>

          {selectedTab === 'completed' && queue.completed.length > 0 && (
            <button className="clear-btn" onClick={handleClearCompleted}>
              Clear All
            </button>
          )}
          {selectedTab === 'failed' && queue.failed.length > 0 && (
            <button className="clear-btn" onClick={handleClearFailed}>
              Clear All
            </button>
          )}
        </div>

        <DownloadList
          downloads={getDisplayDownloads()}
          onPause={handlePause}
          onResume={handleResume}
          onCancel={handleCancel}
          onRetry={handleRetry}
          onRemove={handleRemove}
          sort={sort}
          onSortChange={setSort}
        />

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}
      </div>

      {showAddDialog && (
        <AddDownloadDialog
          settings={settings}
          onAdd={handleStartDownload}
          onClose={() => setShowAddDialog(false)}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          bandwidthLimit={bandwidthLimit}
          onSettingsUpdate={setSettings}
          onBandwidthUpdate={setBandwidthLimit}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showFilters && (
        <FilterPanel
          filter={filter}
          onFilterUpdate={setFilter}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}
