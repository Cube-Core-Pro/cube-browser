'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  browserPipService,
  PipWindowConfig,
  PipSettings,
  PipStats,
  PipPosition,
  PipSize,
  type PipContentType as _PipContentType,
} from '@/lib/services/browser-pip-service';
import { logger } from '@/lib/services/logger-service';
import './PictureInPicture.css';

const log = logger.scope('PictureInPicture');

// ==================== Icons ====================

const PipIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <rect x="12" y="9" width="8" height="6" rx="1" fill="currentColor" />
  </svg>
);

const PlayIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
);

const VolumeHighIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

const VolumeMuteIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

const FullscreenIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);

const MinimizeIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
    <path d="M6 19h12v2H6z" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

const LoopIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
  </svg>
);

const PinIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
  </svg>
);

// ==================== PiP Window Component ====================

interface PipWindowProps {
  window: PipWindowConfig;
  onClose: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onSizeChange: (id: string, width: number, height: number) => void;
}

const PipWindow: React.FC<PipWindowProps> = ({
  window,
  onClose,
  onPositionChange,
  onSizeChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [localWindow, setLocalWindow] = useState(window);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 });

  useEffect(() => {
    setLocalWindow(window);
  }, [window]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.pip-header')) {
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - localWindow.x,
        y: e.clientY - localWindow.y,
      };
    }
  }, [localWindow.x, localWindow.y]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = {
      width: localWindow.width,
      height: localWindow.height,
      x: e.clientX,
      y: e.clientY,
    };
  }, [localWindow.width, localWindow.height]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;
        setLocalWindow(prev => ({ ...prev, x: newX, y: newY }));
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        const newWidth = Math.max(240, resizeStart.current.width + deltaX);
        const newHeight = Math.max(135, resizeStart.current.height + deltaY);
        setLocalWindow(prev => ({ ...prev, width: newWidth, height: newHeight }));
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onPositionChange(localWindow.id, localWindow.x, localWindow.y);
      }
      if (isResizing) {
        setIsResizing(false);
        onSizeChange(localWindow.id, localWindow.width, localWindow.height);
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, localWindow, onPositionChange, onSizeChange]);

  const handlePlayPause = async () => {
    try {
      await browserPipService.togglePlayback(localWindow.id);
      setLocalWindow(prev => ({ ...prev, paused: !prev.paused }));
    } catch (error) {
      log.error('Failed to toggle playback:', error);
    }
  };

  const handleMuteToggle = async () => {
    try {
      await browserPipService.toggleMute(localWindow.id);
      setLocalWindow(prev => ({ ...prev, muted: !prev.muted }));
    } catch (error) {
      log.error('Failed to toggle mute:', error);
    }
  };

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    try {
      await browserPipService.setVolume(localWindow.id, volume);
      setLocalWindow(prev => ({ ...prev, volume, muted: volume === 0 }));
    } catch (error) {
      log.error('Failed to set volume:', error);
    }
  };

  const handleSeek = async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * localWindow.duration;
    try {
      await browserPipService.seek(localWindow.id, time);
      setLocalWindow(prev => ({ ...prev, current_time: time }));
    } catch (error) {
      log.error('Failed to seek:', error);
    }
  };

  const handleFullscreenToggle = async () => {
    try {
      const isFullscreen = await browserPipService.toggleFullscreen(localWindow.id);
      setLocalWindow(prev => ({ ...prev, is_fullscreen: isFullscreen }));
    } catch (error) {
      log.error('Failed to toggle fullscreen:', error);
    }
  };

  const handleLoopToggle = async () => {
    try {
      const loopEnabled = await browserPipService.toggleLoop(localWindow.id);
      setLocalWindow(prev => ({ ...prev, loop_enabled: loopEnabled }));
    } catch (error) {
      log.error('Failed to toggle loop:', error);
    }
  };

  const progress = localWindow.duration > 0 
    ? (localWindow.current_time / localWindow.duration) * 100 
    : 0;

  if (localWindow.is_minimized) {
    return (
      <div
        ref={windowRef}
        className="pip-window is-minimized"
        style={{
          left: localWindow.x,
          top: localWindow.y,
          opacity: localWindow.opacity,
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="pip-header">
          <span className="pip-title">{localWindow.title}</span>
          <div className="pip-header-buttons">
            <button
              className="pip-header-btn"
              onClick={() => browserPipService.restoreWindow(localWindow.id)}
              title="Restore"
              type="button"
            >
              □
            </button>
            <button
              className="pip-header-btn close"
              onClick={() => onClose(localWindow.id)}
              title="Close"
              type="button"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      className={`pip-window ${isDragging ? 'is-dragging' : ''} ${localWindow.is_fullscreen ? 'is-fullscreen' : ''}`}
      style={{
        left: localWindow.is_fullscreen ? 0 : localWindow.x,
        top: localWindow.is_fullscreen ? 0 : localWindow.y,
        width: localWindow.is_fullscreen ? '100vw' : localWindow.width,
        height: localWindow.is_fullscreen ? '100vh' : localWindow.height,
        opacity: localWindow.opacity,
        zIndex: localWindow.always_on_top ? 10001 : 10000,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setControlsVisible(true)}
      onMouseLeave={() => setControlsVisible(false)}
    >
      <div className="pip-header">
        <span className="pip-title">{localWindow.title}</span>
        <div className="pip-header-buttons">
          <button
            className={`pip-header-btn ${localWindow.always_on_top ? 'active' : ''}`}
            onClick={() => browserPipService.setAlwaysOnTop(localWindow.id, !localWindow.always_on_top)}
            title="Always on top"
            type="button"
          >
            <PinIcon />
          </button>
          <button
            className="pip-header-btn"
            onClick={() => browserPipService.minimizeWindow(localWindow.id)}
            title="Minimize"
            type="button"
          >
            <MinimizeIcon />
          </button>
          <button
            className="pip-header-btn close"
            onClick={() => onClose(localWindow.id)}
            title="Close"
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="pip-content">
        {localWindow.content_type === 'Video' ? (
          <div className="pip-placeholder">
            <span>Video content from: {localWindow.source_selector}</span>
          </div>
        ) : (
          <div className="pip-placeholder">
            <span>{localWindow.content_type} content</span>
          </div>
        )}

        <div className={`pip-controls ${controlsVisible ? 'always-visible' : ''}`}>
          <div className="pip-progress" onClick={handleSeek}>
            <div className="pip-progress-bar" style={{ width: `${progress}%` }} />
          </div>

          <div className="pip-control-row">
            <div className="pip-control-group">
              <button
                className="pip-control-btn play-pause"
                onClick={handlePlayPause}
                title={localWindow.paused ? 'Play' : 'Pause'}
                type="button"
              >
                {localWindow.paused ? <PlayIcon /> : <PauseIcon />}
              </button>

              <div className="pip-volume-container">
                <button
                  className="pip-control-btn"
                  onClick={handleMuteToggle}
                  title={localWindow.muted ? 'Unmute' : 'Mute'}
                  type="button"
                >
                  {localWindow.muted ? <VolumeMuteIcon /> : <VolumeHighIcon />}
                </button>
                <input
                  type="range"
                  className="pip-volume-slider"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localWindow.muted ? 0 : localWindow.volume}
                  onChange={handleVolumeChange}
                />
              </div>

              <span className="pip-time">
                {browserPipService.formatDuration(localWindow.current_time)} / {browserPipService.formatDuration(localWindow.duration)}
              </span>
            </div>

            <div className="pip-control-group">
              <button
                className={`pip-control-btn ${localWindow.loop_enabled ? 'active' : ''}`}
                onClick={handleLoopToggle}
                title="Loop"
                type="button"
              >
                <LoopIcon />
              </button>

              <select
                className="pip-speed-select"
                value={localWindow.playback_rate}
                onChange={async (e) => {
                  const rate = parseFloat(e.target.value);
                  await browserPipService.setPlaybackRate(localWindow.id, rate);
                  setLocalWindow(prev => ({ ...prev, playback_rate: rate }));
                }}
              >
                {browserPipService.getPlaybackRates().map(({ rate, label }) => (
                  <option key={rate} value={rate}>{label}</option>
                ))}
              </select>

              <button
                className="pip-control-btn"
                onClick={handleFullscreenToggle}
                title="Fullscreen"
                type="button"
              >
                <FullscreenIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {!localWindow.is_fullscreen && (
        <div
          className="pip-resize-handle"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
};

// ==================== PiP Panel Component ====================

interface PipPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PipPanel: React.FC<PipPanelProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<PipSettings | null>(null);
  const [windows, setWindows] = useState<PipWindowConfig[]>([]);
  const [stats, setStats] = useState<PipStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [settingsData, windowsData, statsData] = await Promise.all([
        browserPipService.getSettings(),
        browserPipService.getAllWindows(),
        browserPipService.getStats(),
      ]);
      setSettings(settingsData);
      setWindows(windowsData);
      setStats(statsData);
    } catch (error) {
      log.error('Failed to load PiP data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleToggleSetting = async (key: keyof PipSettings) => {
    if (!settings) return;
    
    const newValue = !settings[key];
    const newSettings = { ...settings, [key]: newValue };
    
    try {
      await browserPipService.updateSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      log.error('Failed to update setting:', error);
    }
  };

  const handlePositionChange = async (position: PipPosition) => {
    if (!settings) return;
    
    try {
      await browserPipService.setDefaultPosition(position);
      setSettings({ ...settings, default_position: position });
    } catch (error) {
      log.error('Failed to update position:', error);
    }
  };

  const handleSizeChange = async (size: PipSize) => {
    if (!settings) return;
    
    try {
      await browserPipService.setDefaultSize(size);
      setSettings({ ...settings, default_size: size });
    } catch (error) {
      log.error('Failed to update size:', error);
    }
  };

  const handleCloseWindow = async (windowId: string) => {
    try {
      await browserPipService.closeWindow(windowId);
      setWindows(prev => prev.filter(w => w.id !== windowId));
    } catch (error) {
      log.error('Failed to close window:', error);
    }
  };

  const handleCloseAllWindows = async () => {
    try {
      await browserPipService.closeAllWindows();
      setWindows([]);
    } catch (error) {
      log.error('Failed to close all windows:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pip-panel">
      <div className="pip-panel-header">
        <div className="pip-panel-title">
          <PipIcon />
          <span>Picture-in-Picture</span>
        </div>
        <button className="pip-panel-close" onClick={onClose} type="button">
          <CloseIcon />
        </button>
      </div>

      <div className="pip-panel-content">
        {loading ? (
          <div className="pip-empty">
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {/* Active Windows */}
            <div className="pip-section">
              <h3 className="pip-section-title">Active Windows ({windows.length})</h3>
              {windows.length === 0 ? (
                <div className="pip-empty">
                  <PipIcon />
                  <p>No active PiP windows</p>
                </div>
              ) : (
                <div className="pip-windows-list">
                  {windows.map((window) => (
                    <div key={window.id} className="pip-window-item">
                      <div className="pip-window-thumbnail">
                        <div style={{ background: '#333', width: '100%', height: '100%' }} />
                      </div>
                      <div className="pip-window-info">
                        <div className="pip-window-name">{window.title}</div>
                        <div className="pip-window-meta">
                          {window.paused ? 'Paused' : 'Playing'} • {browserPipService.formatDuration(window.current_time)}
                        </div>
                      </div>
                      <div className="pip-window-actions">
                        <button
                          className="pip-window-action"
                          onClick={() => browserPipService.togglePlayback(window.id)}
                          title={window.paused ? 'Play' : 'Pause'}
                          type="button"
                        >
                          {window.paused ? <PlayIcon /> : <PauseIcon />}
                        </button>
                        <button
                          className="pip-window-action close"
                          onClick={() => handleCloseWindow(window.id)}
                          title="Close"
                          type="button"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {windows.length > 0 && (
                <div className="pip-actions">
                  <button
                    className="pip-action-btn secondary"
                    onClick={() => browserPipService.pauseAll()}
                    type="button"
                  >
                    Pause All
                  </button>
                  <button
                    className="pip-action-btn secondary"
                    onClick={() => browserPipService.muteAll()}
                    type="button"
                  >
                    Mute All
                  </button>
                  <button
                    className="pip-action-btn secondary"
                    onClick={handleCloseAllWindows}
                    type="button"
                  >
                    Close All
                  </button>
                </div>
              )}
            </div>

            {/* Settings */}
            {settings && (
              <div className="pip-section">
                <h3 className="pip-section-title">Settings</h3>
                
                <div className="pip-setting-row">
                  <div>
                    <div className="pip-setting-label">Enable PiP</div>
                    <div className="pip-setting-description">Allow picture-in-picture windows</div>
                  </div>
                  <div
                    className={`pip-toggle ${settings.enabled ? 'active' : ''}`}
                    onClick={() => handleToggleSetting('enabled')}
                    role="switch"
                    aria-checked={settings.enabled}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleToggleSetting('enabled');
                      }
                    }}
                  >
                    <div className="pip-toggle-knob" />
                  </div>
                </div>

                <div className="pip-setting-row">
                  <div>
                    <div className="pip-setting-label">Default Position</div>
                  </div>
                  <select
                    className="pip-select"
                    value={settings.default_position}
                    onChange={(e) => handlePositionChange(e.target.value as PipPosition)}
                  >
                    {browserPipService.getPositionPresets().map(({ position, label }) => (
                      <option key={position} value={position}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="pip-setting-row">
                  <div>
                    <div className="pip-setting-label">Default Size</div>
                  </div>
                  <select
                    className="pip-select"
                    value={settings.default_size}
                    onChange={(e) => handleSizeChange(e.target.value as PipSize)}
                  >
                    {browserPipService.getSizePresets().map(({ size, label }) => (
                      <option key={size} value={size}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="pip-setting-row">
                  <div>
                    <div className="pip-setting-label">Max Windows</div>
                  </div>
                  <input
                    type="number"
                    className="pip-number-input"
                    value={settings.max_windows}
                    min={1}
                    max={16}
                    onChange={async (e) => {
                      const value = parseInt(e.target.value, 10);
                      if (value >= 1 && value <= 16) {
                        await browserPipService.setMaxWindows(value);
                        setSettings({ ...settings, max_windows: value });
                      }
                    }}
                  />
                </div>

                <div className="pip-setting-row">
                  <div>
                    <div className="pip-setting-label">Snap Zones</div>
                    <div className="pip-setting-description">Snap windows to screen edges</div>
                  </div>
                  <div
                    className={`pip-toggle ${settings.snap_zones_enabled ? 'active' : ''}`}
                    onClick={() => handleToggleSetting('snap_zones_enabled')}
                    role="switch"
                    aria-checked={settings.snap_zones_enabled}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleToggleSetting('snap_zones_enabled');
                      }
                    }}
                  >
                    <div className="pip-toggle-knob" />
                  </div>
                </div>

                <div className="pip-setting-row">
                  <div>
                    <div className="pip-setting-label">Auto-Mute Others</div>
                    <div className="pip-setting-description">Mute other windows when new one opens</div>
                  </div>
                  <div
                    className={`pip-toggle ${settings.auto_mute_others ? 'active' : ''}`}
                    onClick={() => handleToggleSetting('auto_mute_others')}
                    role="switch"
                    aria-checked={settings.auto_mute_others}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleToggleSetting('auto_mute_others');
                      }
                    }}
                  >
                    <div className="pip-toggle-knob" />
                  </div>
                </div>

                <div className="pip-setting-row">
                  <div>
                    <div className="pip-setting-label">Remember Positions</div>
                    <div className="pip-setting-description">Remember window positions</div>
                  </div>
                  <div
                    className={`pip-toggle ${settings.remember_positions ? 'active' : ''}`}
                    onClick={() => handleToggleSetting('remember_positions')}
                    role="switch"
                    aria-checked={settings.remember_positions}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleToggleSetting('remember_positions');
                      }
                    }}
                  >
                    <div className="pip-toggle-knob" />
                  </div>
                </div>
              </div>
            )}

            {/* Statistics */}
            {stats && (
              <div className="pip-section">
                <h3 className="pip-section-title">Statistics</h3>
                <div className="pip-stats">
                  <div className="pip-stat">
                    <div className="pip-stat-value">{stats.total_windows_created}</div>
                    <div className="pip-stat-label">Windows Created</div>
                  </div>
                  <div className="pip-stat">
                    <div className="pip-stat-value">{browserPipService.formatWatchTime(stats.total_watch_time_seconds)}</div>
                    <div className="pip-stat-label">Watch Time</div>
                  </div>
                  <div className="pip-stat">
                    <div className="pip-stat-value">{stats.videos_pip_count}</div>
                    <div className="pip-stat-label">Videos</div>
                  </div>
                  <div className="pip-stat">
                    <div className="pip-stat-value">{stats.screen_pip_count}</div>
                    <div className="pip-stat-label">Screen Shares</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ==================== Main PiP Container Component ====================

interface PictureInPictureProps {
  children?: React.ReactNode;
}

export const PictureInPicture: React.FC<PictureInPictureProps> = ({ children }) => {
  const [windows, setWindows] = useState<PipWindowConfig[]>([]);

  useEffect(() => {
    const loadWindows = async () => {
      try {
        const windowsData = await browserPipService.getAllWindows();
        setWindows(windowsData);
      } catch (error) {
        log.error('Failed to load PiP windows:', error);
      }
    };

    loadWindows();

    // Listen for window events
    const handleWindowCreated = () => loadWindows();
    const handleWindowClosed = () => loadWindows();

    browserPipService.on('window-created', handleWindowCreated);
    browserPipService.on('window-closed', handleWindowClosed);

    return () => {
      browserPipService.off('window-created', handleWindowCreated);
      browserPipService.off('window-closed', handleWindowClosed);
    };
  }, []);

  const handleCloseWindow = async (windowId: string) => {
    try {
      await browserPipService.closeWindow(windowId);
      setWindows(prev => prev.filter(w => w.id !== windowId));
    } catch (error) {
      log.error('Failed to close window:', error);
    }
  };

  const handlePositionChange = async (windowId: string, x: number, y: number) => {
    try {
      await browserPipService.updatePosition(windowId, x, y);
      setWindows(prev => prev.map(w => 
        w.id === windowId ? { ...w, x, y } : w
      ));
    } catch (error) {
      log.error('Failed to update position:', error);
    }
  };

  const handleSizeChange = async (windowId: string, width: number, height: number) => {
    try {
      await browserPipService.updateSize(windowId, width, height);
      setWindows(prev => prev.map(w => 
        w.id === windowId ? { ...w, width, height } : w
      ));
    } catch (error) {
      log.error('Failed to update size:', error);
    }
  };

  return (
    <>
      {children}
      <div className="pip-container">
        {windows.map((window) => (
          <PipWindow
            key={window.id}
            window={window}
            onClose={handleCloseWindow}
            onPositionChange={handlePositionChange}
            onSizeChange={handleSizeChange}
          />
        ))}
      </div>
    </>
  );
};

export default PictureInPicture;
