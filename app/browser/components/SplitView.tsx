"use client";
import { logger } from '@/lib/services/logger-service';
const log = logger.scope('SplitView');
// CUBE Nexum - Split View Component
// Superior to Vivaldi's split view with synchronized scrolling

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  browserSplitViewService,
  SplitViewSettings,
  SplitViewSession,
  SplitViewStats,
  SplitPanel,
  SplitLayout,
  SyncMode,
  type LayoutPreset as _LayoutPreset,
  SplitViewEvent,
} from '../../../lib/services/browser-split-view-service';
import './SplitView.css';

// ==================== Layout Button Component ====================

interface LayoutButtonProps {
  layout: SplitLayout;
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const LayoutButton: React.FC<LayoutButtonProps> = ({
  layout: _layout,
  icon,
  label,
  isActive,
  onClick,
}) => {
  return (
    <button
      className={`layout-button ${isActive ? 'active' : ''}`}
      title={label}
      onClick={onClick}
      aria-label={`Set ${label} layout`}
    >
      {icon}
    </button>
  );
};

// ==================== Sync Mode Selector Component ====================

interface SyncModeSelectorProps {
  currentMode: SyncMode;
  onChange: (mode: SyncMode) => void;
}

const SyncModeSelector: React.FC<SyncModeSelectorProps> = ({
  currentMode,
  onChange,
}) => {
  const modes = browserSplitViewService.getSyncModeOptions();

  return (
    <div className="sync-mode-selector">
      {modes.map(({ mode, label }) => (
        <button
          key={mode}
          className={`sync-mode-button ${currentMode === mode ? 'active' : ''}`}
          onClick={() => onChange(mode)}
          title={label}
        >
          {mode === 'None' && '🔓'}
          {mode === 'Scroll' && '📜'}
          {mode === 'Navigation' && '🔗'}
          {mode === 'Both' && '🔄'}
        </button>
      ))}
    </div>
  );
};

// ==================== Panel Header Component ====================

interface PanelHeaderProps {
  panel: SplitPanel;
  isVisible: boolean;
  onClose: () => void;
  onMuteToggle: () => void;
  onActivate: () => void;
}

const PanelHeader: React.FC<PanelHeaderProps> = ({
  panel,
  isVisible,
  onClose,
  onMuteToggle,
  onActivate,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={`panel-header ${panel.is_active ? 'active' : ''}`}
      onClick={onActivate}
    >
      {panel.favicon ? (
        <img
          src={panel.favicon}
          alt=""
          className="panel-favicon"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="panel-favicon-placeholder">🌐</div>
      )}
      <span className="panel-title">{panel.title || 'New Tab'}</span>
      <span className="panel-url">{panel.url}</span>
      <div className="panel-actions">
        <button
          className="panel-action-button"
          onClick={(e) => {
            e.stopPropagation();
            onMuteToggle();
          }}
          title={panel.is_muted ? 'Unmute' : 'Mute'}
        >
          {panel.is_muted ? '🔇' : '🔊'}
        </button>
        <button
          className="panel-action-button close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Close panel"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// ==================== Split Panel Component ====================

interface SplitPanelComponentProps {
  panel: SplitPanel;
  sessionId: string;
  showHeader: boolean;
  syncMode: SyncMode;
  onRemove: () => void;
  onActivate: () => void;
  onMuteToggle: () => void;
}

const SplitPanelComponent: React.FC<SplitPanelComponentProps> = ({
  panel,
  sessionId,
  showHeader,
  syncMode,
  onRemove,
  onActivate,
  onMuteToggle,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const lastScrollRef = useRef({ x: 0, y: 0 });

  const handleScroll = useCallback(() => {
    if (syncMode === 'None' || syncMode === 'Navigation') return;
    if (!contentRef.current) return;

    const scrollX = contentRef.current.scrollLeft;
    const scrollY = contentRef.current.scrollTop;

    // Prevent infinite loop
    if (
      scrollX === lastScrollRef.current.x &&
      scrollY === lastScrollRef.current.y
    ) {
      return;
    }

    lastScrollRef.current = { x: scrollX, y: scrollY };
    browserSplitViewService.syncScrollDebounced(
      sessionId,
      panel.id,
      scrollX,
      scrollY,
      50
    );
  }, [sessionId, panel.id, syncMode]);

  // Listen for external scroll sync
  useEffect(() => {
    const handleSyncScroll = (event: SplitViewEvent) => {
      if (
        event.sessionId === sessionId &&
        event.panelId !== panel.id &&
        contentRef.current
      ) {
        const data = event.data as { scrollX: number; scrollY: number };
        contentRef.current.scrollLeft = data.scrollX;
        contentRef.current.scrollTop = data.scrollY;
        lastScrollRef.current = { x: data.scrollX, y: data.scrollY };
      }
    };

    browserSplitViewService.on('sync-scroll', handleSyncScroll);
    return () => browserSplitViewService.off('sync-scroll', handleSyncScroll);
  }, [sessionId, panel.id]);

  const style: React.CSSProperties = {
    flex: `0 0 ${panel.width_percent}%`,
    height: `${panel.height_percent}%`,
  };

  return (
    <div
      className={`split-panel ${panel.is_active ? 'active' : ''}`}
      style={style}
      onClick={onActivate}
    >
      <PanelHeader
        panel={panel}
        isVisible={showHeader}
        onClose={onRemove}
        onMuteToggle={onMuteToggle}
        onActivate={onActivate}
      />
      <div
        ref={contentRef}
        className="panel-content"
        onScroll={handleScroll}
      >
        {panel.url ? (
          <iframe
            src={panel.url}
            title={panel.title}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        ) : (
          <div className="panel-placeholder">
            <div className="panel-placeholder-icon">🌐</div>
            <div className="panel-placeholder-text">
              Open a page in this panel
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== Divider Component ====================

interface DividerProps {
  direction: 'horizontal' | 'vertical';
  position: number;
  locked: boolean;
  onDrag: (delta: number) => void;
}

const Divider: React.FC<DividerProps> = ({
  direction,
  position,
  locked,
  onDrag,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (locked) return;
      e.preventDefault();
      setIsDragging(true);
      startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    },
    [locked, direction]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      startPosRef.current = currentPos;
      onDrag(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, onDrag]);

  return (
    <div
      className={`split-divider ${direction} ${isDragging ? 'dragging' : ''} ${
        locked ? 'locked' : ''
      }`}
      style={{
        [direction === 'horizontal' ? 'left' : 'top']: `${position}%`,
      }}
      onMouseDown={handleMouseDown}
    />
  );
};

// ==================== Settings Panel Component ====================

interface SettingsPanelProps {
  settings: SplitViewSettings;
  stats: SplitViewStats;
  savedLayouts: SplitViewSession[];
  onClose: () => void;
  onSettingsChange: (settings: Partial<SplitViewSettings>) => void;
  onLoadLayout: (layoutId: string) => void;
  onDeleteLayout: (layoutId: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  stats,
  savedLayouts,
  onClose,
  onSettingsChange,
  onLoadLayout,
  onDeleteLayout,
}) => {
  const shortcuts = browserSplitViewService.getKeyboardShortcuts();

  return (
    <div className="split-view-settings">
      <div className="settings-header">
        <span className="settings-title">Split View Settings</span>
        <button className="settings-close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="settings-content">
        {/* General Settings */}
        <div className="settings-section">
          <div className="settings-section-title">General</div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Show Panel Headers</div>
              <div className="settings-description">
                Display title and controls for each panel
              </div>
            </div>
            <div
              className={`toggle-switch ${
                settings.show_panel_headers ? 'active' : ''
              }`}
              onClick={() =>
                onSettingsChange({
                  show_panel_headers: !settings.show_panel_headers,
                })
              }
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Show Dividers</div>
              <div className="settings-description">
                Display visible dividers between panels
              </div>
            </div>
            <div
              className={`toggle-switch ${
                settings.show_dividers ? 'active' : ''
              }`}
              onClick={() =>
                onSettingsChange({ show_dividers: !settings.show_dividers })
              }
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Snap to Edges</div>
              <div className="settings-description">
                Panels snap to screen edges when resizing
              </div>
            </div>
            <div
              className={`toggle-switch ${
                settings.snap_to_edges ? 'active' : ''
              }`}
              onClick={() =>
                onSettingsChange({ snap_to_edges: !settings.snap_to_edges })
              }
            />
          </div>
        </div>

        {/* Behavior Settings */}
        <div className="settings-section">
          <div className="settings-section-title">Behavior</div>
          <div className="settings-row">
            <div className="settings-label">Default Layout</div>
            <select
              className="settings-select"
              value={settings.default_layout}
              onChange={(e) =>
                onSettingsChange({
                  default_layout: e.target.value as SplitLayout,
                })
              }
            >
              {browserSplitViewService.getLayoutOptions().map(({ layout, label }) => (
                <option key={layout} value={layout}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="settings-row">
            <div className="settings-label">Default Sync Mode</div>
            <select
              className="settings-select"
              value={settings.default_sync_mode}
              onChange={(e) =>
                onSettingsChange({
                  default_sync_mode: e.target.value as SyncMode,
                })
              }
            >
              {browserSplitViewService.getSyncModeOptions().map(({ mode, label }) => (
                <option key={mode} value={mode}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="settings-row">
            <div className="settings-label">Max Panels</div>
            <input
              type="range"
              className="settings-slider"
              min="2"
              max="9"
              value={settings.max_panels}
              onChange={(e) =>
                onSettingsChange({ max_panels: parseInt(e.target.value, 10) })
              }
            />
            <span>{settings.max_panels}</span>
          </div>
        </div>

        {/* Saved Layouts */}
        <div className="settings-section">
          <div className="settings-section-title">Saved Layouts</div>
          {savedLayouts.length > 0 ? (
            <div className="saved-layouts">
              {savedLayouts.map((layout) => (
                <div
                  key={layout.id}
                  className="saved-layout-item"
                  onClick={() => onLoadLayout(layout.id)}
                >
                  <span className="saved-layout-icon">📑</span>
                  <div className="saved-layout-info">
                    <div className="saved-layout-name">{layout.name}</div>
                    <div className="saved-layout-panels">
                      {layout.panels.length} panels • {layout.layout}
                    </div>
                  </div>
                  <button
                    className="saved-layout-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayout(layout.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="settings-description">
              No saved layouts yet. Save your current layout to quickly restore
              it later.
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="settings-section">
          <div className="settings-section-title">Statistics</div>
          <div className="split-view-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.total_sessions_created}</span>
              <span className="stat-label">Sessions Created</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {stats.current_active_sessions}
              </span>
              <span className="stat-label">Active Sessions</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {stats.total_sync_scroll_events}
              </span>
              <span className="stat-label">Scroll Syncs</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {stats.total_sync_navigation_events}
              </span>
              <span className="stat-label">Navigation Syncs</span>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="settings-section">
          <div className="settings-section-title">Keyboard Shortcuts</div>
          <div className="shortcuts-list">
            {shortcuts.slice(0, 5).map(({ key, description }) => (
              <div key={key} className="shortcut-item">
                <div className="shortcut-keys">
                  {key.split('+').map((k, i) => (
                    <span key={i} className="shortcut-key">
                      {k.trim()}
                    </span>
                  ))}
                </div>
                <span className="shortcut-description">{description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== Empty State Component ====================

interface EmptyStateProps {
  onCreateSession: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateSession }) => {
  return (
    <div className="split-view-empty">
      <div className="split-view-empty-icon">🪟</div>
      <div className="split-view-empty-title">Split View</div>
      <div className="split-view-empty-description">
        View multiple pages side by side with synchronized scrolling. Compare
        content, research efficiently, or monitor multiple sources at once.
      </div>
      <div className="split-view-empty-actions">
        <button
          className="split-view-start-button"
          onClick={onCreateSession}
        >
          <span>🪟</span>
          Start Split View
        </button>
      </div>
    </div>
  );
};

// ==================== Main Split View Component ====================

interface SplitViewProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export const SplitView: React.FC<SplitViewProps> = ({
  isVisible = true,
  onClose,
}) => {
  const [settings, setSettings] = useState<SplitViewSettings | null>(null);
  const [activeSession, setActiveSession] = useState<SplitViewSession | null>(
    null
  );
  const [stats, setStats] = useState<SplitViewStats | null>(null);
  const [savedLayouts, setSavedLayouts] = useState<SplitViewSession[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [loadedSettings, session, loadedStats, layouts] =
          await Promise.all([
            browserSplitViewService.getSettings(),
            browserSplitViewService.getActiveSession(),
            browserSplitViewService.getStats(),
            browserSplitViewService.getSavedLayouts(),
          ]);

        setSettings(loadedSettings);
        setActiveSession(session);
        setStats(loadedStats);
        setSavedLayouts(layouts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (isVisible) {
      loadData();
    }
  }, [isVisible]);

  // Event listeners
  useEffect(() => {
    const handleSessionCreated = (event: SplitViewEvent) => {
      setActiveSession(event.data as SplitViewSession);
    };

    const handleSessionClosed = () => {
      setActiveSession(null);
    };

    const handleLayoutChanged = async () => {
      const session = await browserSplitViewService.getActiveSession();
      setActiveSession(session);
    };

    browserSplitViewService.on('session-created', handleSessionCreated);
    browserSplitViewService.on('session-closed', handleSessionClosed);
    browserSplitViewService.on('layout-changed', handleLayoutChanged);
    browserSplitViewService.on('panel-added', handleLayoutChanged);
    browserSplitViewService.on('panel-removed', handleLayoutChanged);

    return () => {
      browserSplitViewService.off('session-created', handleSessionCreated);
      browserSplitViewService.off('session-closed', handleSessionClosed);
      browserSplitViewService.off('layout-changed', handleLayoutChanged);
      browserSplitViewService.off('panel-added', handleLayoutChanged);
      browserSplitViewService.off('panel-removed', handleLayoutChanged);
    };
  }, []);

  // Create new session
  const handleCreateSession = useCallback(async () => {
    try {
      setError(null);
      const session = await browserSplitViewService.createSession();
      setActiveSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    }
  }, []);

  // Close session
  const handleCloseSession = useCallback(async () => {
    if (!activeSession) return;
    try {
      await browserSplitViewService.closeSession(activeSession.id);
      setActiveSession(null);
      if (onClose) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close session');
    }
  }, [activeSession, onClose]);

  // Change layout
  const handleLayoutChange = useCallback(
    async (layout: SplitLayout) => {
      if (!activeSession) return;
      try {
        await browserSplitViewService.setLayout(activeSession.id, layout);
        const updated = await browserSplitViewService.getActiveSession();
        setActiveSession(updated);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to change layout'
        );
      }
    },
    [activeSession]
  );

  // Change sync mode
  const handleSyncModeChange = useCallback(
    async (mode: SyncMode) => {
      if (!activeSession) return;
      try {
        await browserSplitViewService.setSyncMode(activeSession.id, mode);
        setActiveSession((prev) =>
          prev ? { ...prev, sync_mode: mode } : null
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to change sync mode'
        );
      }
    },
    [activeSession]
  );

  // Handle divider drag
  const handleDividerDrag = useCallback(
    async (delta: number) => {
      if (!activeSession) return;
      const newPosition = activeSession.divider_position + delta * 0.1;
      const clampedPosition = Math.max(20, Math.min(80, newPosition));
      try {
        await browserSplitViewService.setDividerPosition(
          activeSession.id,
          clampedPosition
        );
        setActiveSession((prev) =>
          prev ? { ...prev, divider_position: clampedPosition } : null
        );
      } catch (err) {
        log.error('Failed to update divider position:', err);
      }
    },
    [activeSession]
  );

  // Panel operations
  const handleRemovePanel = useCallback(
    async (panelId: string) => {
      if (!activeSession) return;
      try {
        await browserSplitViewService.removePanel(activeSession.id, panelId);
        const updated = await browserSplitViewService.getActiveSession();
        setActiveSession(updated);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to remove panel'
        );
      }
    },
    [activeSession]
  );

  const handleActivatePanel = useCallback(
    async (panelId: string) => {
      if (!activeSession) return;
      try {
        await browserSplitViewService.setActivePanel(activeSession.id, panelId);
        setActiveSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            panels: prev.panels.map((p) => ({
              ...p,
              is_active: p.id === panelId,
            })),
          };
        });
      } catch (err) {
        log.error('Failed to activate panel:', err);
      }
    },
    [activeSession]
  );

  const handleMuteToggle = useCallback(
    async (panelId: string) => {
      if (!activeSession) return;
      const panel = activeSession.panels.find((p) => p.id === panelId);
      if (!panel) return;

      try {
        await browserSplitViewService.updatePanel(activeSession.id, panelId, {
          is_muted: !panel.is_muted,
        });
        setActiveSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            panels: prev.panels.map((p) =>
              p.id === panelId ? { ...p, is_muted: !p.is_muted } : p
            ),
          };
        });
      } catch (err) {
        log.error('Failed to toggle mute:', err);
      }
    },
    [activeSession]
  );

  // Settings operations
  const handleSettingsChange = useCallback(
    async (changes: Partial<SplitViewSettings>) => {
      if (!settings) return;
      const newSettings = { ...settings, ...changes };
      try {
        await browserSplitViewService.updateSettings(newSettings);
        setSettings(newSettings);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update settings'
        );
      }
    },
    [settings]
  );

  // Saved layout operations
  const handleSaveLayout = useCallback(async () => {
    if (!activeSession) return;
    const name = prompt('Enter a name for this layout:');
    if (!name) return;

    try {
      await browserSplitViewService.saveLayout(activeSession.id, name);
      const layouts = await browserSplitViewService.getSavedLayouts();
      setSavedLayouts(layouts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save layout');
    }
  }, [activeSession]);

  const handleLoadLayout = useCallback(async (layoutId: string) => {
    try {
      const session = await browserSplitViewService.loadSavedLayout(layoutId);
      setActiveSession(session);
      setShowSettings(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load layout');
    }
  }, []);

  const handleDeleteLayout = useCallback(async (layoutId: string) => {
    try {
      await browserSplitViewService.deleteSavedLayout(layoutId);
      const layouts = await browserSplitViewService.getSavedLayouts();
      setSavedLayouts(layouts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete layout');
    }
  }, []);

  // Determine panel layout direction
  const getPanelsDirection = (): 'horizontal' | 'vertical' | 'grid' => {
    if (!activeSession) return 'horizontal';
    switch (activeSession.layout) {
      case 'Vertical':
      case 'TopFocus':
      case 'BottomFocus':
      case 'ThreeRows':
        return 'vertical';
      case 'Grid2x2':
        return 'grid';
      default:
        return 'horizontal';
    }
  };

  if (!isVisible) return null;

  if (loading) {
    return (
      <div className="split-view-container">
        <div className="split-view-empty">
          <div className="split-view-empty-icon">⏳</div>
          <div className="split-view-empty-title">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="split-view-container">
        <div className="split-view-empty">
          <div className="split-view-empty-icon">⚠️</div>
          <div className="split-view-empty-title">Error</div>
          <div className="split-view-empty-description">{error}</div>
          <button
            className="split-view-start-button"
            onClick={() => setError(null)}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="split-view-container">
        <EmptyState onCreateSession={handleCreateSession} />
      </div>
    );
  }

  const layoutOptions = browserSplitViewService.getLayoutOptions();

  return (
    <div className="split-view-container">
      {/* Toolbar */}
      <div className="split-view-toolbar">
        <div className="split-view-toolbar-left">
          <div className="split-view-title">
            <span className="split-view-title-icon">🪟</span>
            Split View
          </div>
        </div>

        <div className="split-view-toolbar-center">
          {layoutOptions.map(({ layout, label, icon }) => (
            <LayoutButton
              key={layout}
              layout={layout}
              icon={icon}
              label={label}
              isActive={activeSession.layout === layout}
              onClick={() => handleLayoutChange(layout)}
            />
          ))}
        </div>

        <div className="split-view-toolbar-right">
          <SyncModeSelector
            currentMode={activeSession.sync_mode}
            onChange={handleSyncModeChange}
          />
          <button
            className="layout-button"
            title="Save Layout"
            onClick={handleSaveLayout}
          >
            💾
          </button>
          <button
            className="layout-button"
            title="Settings"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️
          </button>
          <button
            className="layout-button"
            title="Close Split View"
            onClick={handleCloseSession}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Panels */}
      <div className={`split-view-panels ${getPanelsDirection()}`}>
        {activeSession.panels.map((panel, index) => (
          <React.Fragment key={panel.id}>
            {index > 0 && settings?.show_dividers && (
              <Divider
                direction={getPanelsDirection() === 'vertical' ? 'vertical' : 'horizontal'}
                position={activeSession.divider_position}
                locked={activeSession.divider_locked}
                onDrag={handleDividerDrag}
              />
            )}
            <SplitPanelComponent
              panel={panel}
              sessionId={activeSession.id}
              showHeader={settings?.show_panel_headers ?? true}
              syncMode={activeSession.sync_mode}
              onRemove={() => handleRemovePanel(panel.id)}
              onActivate={() => handleActivatePanel(panel.id)}
              onMuteToggle={() => handleMuteToggle(panel.id)}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Settings Panel */}
      {showSettings && settings && stats && (
        <SettingsPanel
          settings={settings}
          stats={stats}
          savedLayouts={savedLayouts}
          onClose={() => setShowSettings(false)}
          onSettingsChange={handleSettingsChange}
          onLoadLayout={handleLoadLayout}
          onDeleteLayout={handleDeleteLayout}
        />
      )}
    </div>
  );
};

export default SplitView;
