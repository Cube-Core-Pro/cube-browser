"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');

/**
 * Terminal Page - Main Terminal Emulator Interface
 * CUBE Nexum Platform v2.0
 * 
 * Complete terminal emulator with multi-tab support, split panes,
 * command history, and session management.
 */


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  TerminalTab,
  TerminalSession,
  TerminalSettings,
  CommandHistoryEntry,
  CommandSuggestion,
  TerminalOutputEvent,
  TerminalExitEvent,
  getDefaultSettings,
  generateId,
} from '../../../types/terminal';
import { TerminalPane } from '../../../components/terminal/TerminalPane';
import { TabBar } from '../../../components/terminal/TabBar';
import { SettingsPanel } from '../../../components/terminal/SettingsPanel';
import { CommandHistory } from '../../../components/terminal/CommandHistory';
import { SearchPanel } from '../../../components/terminal/SearchPanel';
import './terminal.css';

export default function TerminalPage() {
  // State
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [sessions, setSessions] = useState<Record<string, TerminalSession>>({});
  const [settings, setSettings] = useState<TerminalSettings>(getDefaultSettings());
  const [history, setHistory] = useState<CommandHistoryEntry[]>([]);
  const [_suggestions, _setSuggestions] = useState<CommandSuggestion[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const unlistenRefs = useRef<(() => void)[]>([]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    initializeTerminal();

    return () => {
      // Cleanup event listeners
      // eslint-disable-next-line react-hooks/exhaustive-deps
      unlistenRefs.current.forEach((unlisten) => unlisten());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeTerminal = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load settings
      await loadSettings();

      // Load history
      await loadHistory();

      // Create initial tab
      await createNewTab();

      // Setup event listeners
      await setupEventListeners();

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize terminal');
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = localStorage.getItem('terminal_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (err) {
      log.error('Failed to load settings:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const savedHistory = localStorage.getItem('terminal_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (err) {
      log.error('Failed to load history:', err);
    }
  };

  const setupEventListeners = async () => {
    try {
      // Listen for terminal output
      const unlistenOutput = await listen<TerminalOutputEvent>(
        'terminal:output',
        (event) => {
          handleTerminalOutput(event.payload);
        }
      );
      unlistenRefs.current.push(unlistenOutput);

      // Listen for terminal exit
      const unlistenExit = await listen<TerminalExitEvent>(
        'terminal:exit',
        (event) => {
          handleTerminalExit(event.payload);
        }
      );
      unlistenRefs.current.push(unlistenExit);
    } catch (err) {
      log.error('Failed to setup event listeners:', err);
    }
  };

  // ============================================================================
  // TAB MANAGEMENT
  // ============================================================================

  const createNewTab = async (title?: string, cwd?: string) => {
    try {
      const tabId = generateId();
      const paneId = generateId();
      const sessionId = generateId();

      // Create session (using shell plugin)
      const session: TerminalSession = {
        id: sessionId,
        title: title || 'Terminal',
        shell: settings.default_shell,
        cwd: cwd || process.cwd?.() || '~',
        status: 'idle',
        created_at: Date.now(),
        last_activity: Date.now(),
        command_history: [],
        environment: settings.environment_variables,
      };

      // Create tab with single pane
      const tab: TerminalTab = {
        id: tabId,
        title: title || 'Terminal',
        panes: [
          {
            id: paneId,
            session_id: sessionId,
            position: { row: 0, col: 0, rowspan: 1, colspan: 1 },
            size: { width: 800, height: 600 },
            is_active: true,
          },
        ],
        active_pane_id: paneId,
        split_layout: null,
      };

      setTabs((prev) => [...prev, tab]);
      setActiveTabId(tabId);
      setSessions((prev) => ({ ...prev, [sessionId]: session }));

      return tab;
    } catch (err) {
      throw new Error(`Failed to create tab: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const closeTab = async (tabId: string) => {
    try {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;

      // Close all sessions in the tab
      for (const pane of tab.panes) {
        const session = sessions[pane.session_id];
        if (session) {
          // Clean up session
          delete sessions[pane.session_id];
        }
      }

      // Remove tab
      setTabs((prev) => prev.filter((t) => t.id !== tabId));

      // Update active tab
      if (activeTabId === tabId) {
        const remainingTabs = tabs.filter((t) => t.id !== tabId);
        if (remainingTabs.length > 0) {
          setActiveTabId(remainingTabs[0].id);
        } else {
          // Create new tab if no tabs left
          await createNewTab();
        }
      }

      setSessions({ ...sessions });
    } catch (err) {
      log.error('Failed to close tab:', err);
    }
  };

  const renameTab = (tabId: string, newTitle: string) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === tabId ? { ...tab, title: newTitle } : tab
      )
    );
  };

  // ============================================================================
  // PANE MANAGEMENT
  // ============================================================================

  const splitPane = async (direction: 'horizontal' | 'vertical') => {
    try {
      const activeTab = tabs.find((t) => t.id === activeTabId);
      if (!activeTab) return;

      const activePaneId = activeTab.active_pane_id;
      const activePane = activeTab.panes.find((p) => p.id === activePaneId);
      if (!activePane) return;

      // Create new session
      const newSessionId = generateId();
      const newPaneId = generateId();
      const activeSession = sessions[activePane.session_id];

      const newSession: TerminalSession = {
        id: newSessionId,
        title: activeTab.title,
        shell: settings.default_shell,
        cwd: activeSession?.cwd || '~',
        status: 'idle',
        created_at: Date.now(),
        last_activity: Date.now(),
        command_history: [],
        environment: settings.environment_variables,
      };

      // Calculate new pane sizes
      const newSize = direction === 'horizontal'
        ? { width: activePane.size.width, height: Math.floor(activePane.size.height / 2) }
        : { width: Math.floor(activePane.size.width / 2), height: activePane.size.height };

      // Create new pane
      const newPane = {
        id: newPaneId,
        session_id: newSessionId,
        position: { ...activePane.position },
        size: newSize,
        is_active: false,
      };

      // Update active pane size
      const updatedActivePane = {
        ...activePane,
        size: newSize,
      };

      // Update tab
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                panes: tab.panes.map((p) =>
                  p.id === activePaneId ? updatedActivePane : p
                ).concat(newPane),
              }
            : tab
        )
      );

      setSessions((prev) => ({ ...prev, [newSessionId]: newSession }));
    } catch (err) {
      log.error('Failed to split pane:', err);
    }
  };

  const closePane = (paneId: string) => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab || activeTab.panes.length === 1) {
      // Close tab if last pane
      closeTab(activeTabId);
      return;
    }

    const pane = activeTab.panes.find((p) => p.id === paneId);
    if (!pane) return;

    // Clean up session
    const session = sessions[pane.session_id];
    if (session) {
      delete sessions[pane.session_id];
    }

    // Remove pane
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              panes: tab.panes.filter((p) => p.id !== paneId),
              active_pane_id:
                tab.active_pane_id === paneId
                  ? tab.panes[0]?.id
                  : tab.active_pane_id,
            }
          : tab
      )
    );

    setSessions({ ...sessions });
  };

  const setActivePane = (paneId: string) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              active_pane_id: paneId,
              panes: tab.panes.map((p) => ({
                ...p,
                is_active: p.id === paneId,
              })),
            }
          : tab
      )
    );
  };

  // ============================================================================
  // COMMAND EXECUTION
  // ============================================================================

  const executeCommand = async (sessionId: string, command: string) => {
    try {
      const session = sessions[sessionId];
      if (!session) return;

      const startTime = Date.now();

      // Update session status
      setSessions((prev) => ({
        ...prev,
        [sessionId]: {
          ...prev[sessionId],
          status: 'running',
          last_activity: Date.now(),
          command_history: [...prev[sessionId].command_history, command],
        },
      }));

      // Execute command using Tauri shell plugin
      // Note: This is a simplified implementation
      // In production, you would use a PTY backend for true terminal emulation
      const result = await invoke<string>('plugin:shell|execute', {
        program: session.shell,
        args: ['-c', command],
        options: {
          cwd: session.cwd,
          env: session.environment,
        },
      });

      const endTime = Date.now();

      // Add to history
      const historyEntry: CommandHistoryEntry = {
        id: generateId(),
        command,
        output: result,
        exit_code: 0,
        timestamp: startTime,
        duration: endTime - startTime,
        session_id: sessionId,
        cwd: session.cwd,
      };

      setHistory((prev) => {
        const newHistory = [...prev, historyEntry];
        localStorage.setItem('terminal_history', JSON.stringify(newHistory.slice(-1000)));
        return newHistory;
      });

      // Update session status
      setSessions((prev) => ({
        ...prev,
        [sessionId]: {
          ...prev[sessionId],
          status: 'idle',
          last_activity: Date.now(),
        },
      }));

      return result;
    } catch (err) {
      // Update session status
      setSessions((prev) => ({
        ...prev,
        [sessionId]: {
          ...prev[sessionId],
          status: 'error',
          last_activity: Date.now(),
        },
      }));

      throw new Error(`Command failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleTerminalOutput = (event: TerminalOutputEvent) => {
    // Handle real-time terminal output
    log.debug('Terminal output:', event);
  };

  const handleTerminalExit = (event: TerminalExitEvent) => {
    // Handle terminal exit
    setSessions((prev) => ({
      ...prev,
      [event.session_id]: {
        ...prev[event.session_id],
        status: event.exit_code === 0 ? 'exited' : 'error',
      },
    }));
  };

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // New tab: Ctrl+Shift+T
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        createNewTab();
      }

      // Close tab: Ctrl+Shift+W
      if (e.ctrlKey && e.shiftKey && e.key === 'W') {
        e.preventDefault();
        closeTab(activeTabId);
      }

      // Next tab: Ctrl+Tab
      if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        const nextIndex = (currentIndex + 1) % tabs.length;
        setActiveTabId(tabs[nextIndex].id);
      }

      // Previous tab: Ctrl+Shift+Tab
      if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        setActiveTabId(tabs[prevIndex].id);
      }

      // Split horizontal: Ctrl+Shift+D
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        splitPane('horizontal');
      }

      // Split vertical: Ctrl+Shift+E
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        splitPane('vertical');
      }

      // Settings: Ctrl+,
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
      }

      // History: Ctrl+Shift+H
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        setShowHistory(true);
      }

      // Search: Ctrl+Shift+F
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs, activeTabId]);

  // ============================================================================
  // SETTINGS MANAGEMENT
  // ============================================================================

  const updateSettings = useCallback((newSettings: Partial<TerminalSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('terminal_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (loading) {
    return (
      <div className="terminal-page loading">
        <div className="spinner"></div>
        <p>Initializing terminal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="terminal-page error">
        <div className="error-icon">⚠</div>
        <h2>Terminal Error</h2>
        <p>{error}</p>
        <button onClick={initializeTerminal}>Retry</button>
      </div>
    );
  }

  return (
    <div className="terminal-page">
      <div className="terminal-header">
        <h1>Terminal</h1>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => setShowHistory(true)}
            title="Command History"
          >
            <span className="icon">📜</span>
          </button>
          <button
            className="icon-btn"
            onClick={() => setShowSearch(true)}
            title="Search"
          >
            <span className="icon">🔍</span>
          </button>
          <button
            className="icon-btn"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <span className="icon">⚙️</span>
          </button>
        </div>
      </div>

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        onTabClose={closeTab}
        onTabRename={renameTab}
        onNewTab={createNewTab}
      />

      <div className="terminal-content">
        {activeTab && (
          <div className="panes-container">
            {activeTab.panes.map((pane) => {
              const session = sessions[pane.session_id];
              return (
                <TerminalPane
                  key={pane.id}
                  pane={pane}
                  session={session}
                  settings={settings}
                  onCommand={(cmd) => executeCommand(pane.session_id, cmd)}
                  onClose={() => closePane(pane.id)}
                  onFocus={() => setActivePane(pane.id)}
                  onSplit={splitPane}
                />
              );
            })}
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showHistory && (
        <CommandHistory
          history={history}
          onSelect={(entry) => {
            // Copy command to active terminal
            log.debug('Selected command:', entry.command);
            setShowHistory(false);
          }}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showSearch && (
        <SearchPanel
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
