// CUBE Nexum - Split View Service
// TypeScript service for split view with sync scrolling

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('Browser');

// ==================== Types ====================

export type SplitLayout =
  | 'Horizontal'
  | 'Vertical'
  | 'Grid2x2'
  | 'LeftFocus'
  | 'RightFocus'
  | 'TopFocus'
  | 'BottomFocus'
  | 'ThreeColumns'
  | 'ThreeRows'
  | 'Custom';

export type PanelPosition =
  | 'Left'
  | 'Right'
  | 'Top'
  | 'Bottom'
  | 'TopLeft'
  | 'TopRight'
  | 'BottomLeft'
  | 'BottomRight'
  | 'Center';

export type SyncMode = 'None' | 'Scroll' | 'Navigation' | 'Both';

export type LinkClickBehavior = 'SamePanel' | 'OtherPanel' | 'NewPanel' | 'AskUser';

export type NewTabBehavior = 'OpenInSplit' | 'OpenNormal' | 'ReplaceInactive';

export interface SplitPanel {
  id: string;
  tab_id: string;
  position: PanelPosition;
  width_percent: number;
  height_percent: number;
  x_offset: number;
  y_offset: number;
  scroll_x: number;
  scroll_y: number;
  zoom_level: number;
  is_active: boolean;
  is_muted: boolean;
  title: string;
  url: string;
  favicon: string | null;
}

export interface SplitViewSession {
  id: string;
  name: string;
  layout: SplitLayout;
  panels: SplitPanel[];
  sync_mode: SyncMode;
  sync_group: string | null;
  divider_position: number;
  divider_locked: boolean;
  created_at: number;
  last_active: number;
}

export interface SplitViewSettings {
  enabled: boolean;
  max_panels: number;
  default_layout: SplitLayout;
  default_sync_mode: SyncMode;
  show_dividers: boolean;
  divider_width: number;
  snap_to_edges: boolean;
  snap_threshold: number;
  remember_layouts: boolean;
  sync_scroll_debounce_ms: number;
  link_click_behavior: LinkClickBehavior;
  new_tab_behavior: NewTabBehavior;
  keyboard_shortcuts_enabled: boolean;
  show_panel_headers: boolean;
  auto_collapse_single: boolean;
}

export interface LayoutPreset {
  id: string;
  name: string;
  layout: SplitLayout;
  panel_configs: PanelPresetConfig[];
  icon: string;
  is_custom: boolean;
}

export interface PanelPresetConfig {
  position: PanelPosition;
  width_percent: number;
  height_percent: number;
  x_offset: number;
  y_offset: number;
}

export interface SplitViewStats {
  total_sessions_created: number;
  current_active_sessions: number;
  total_sync_scroll_events: number;
  total_sync_navigation_events: number;
  most_used_layout: SplitLayout | null;
  layout_usage: Record<string, number>;
}

export interface PanelUpdate {
  title?: string;
  url?: string;
  favicon?: string | null;
  scroll_x?: number;
  scroll_y?: number;
  zoom_level?: number;
  is_muted?: boolean;
}

// ==================== Event Types ====================

export type SplitViewEventType =
  | 'session-created'
  | 'session-closed'
  | 'layout-changed'
  | 'panel-added'
  | 'panel-removed'
  | 'sync-scroll'
  | 'sync-navigation'
  | 'divider-moved'
  | 'settings-changed';

export interface SplitViewEvent {
  type: SplitViewEventType;
  sessionId?: string;
  panelId?: string;
  data?: unknown;
  timestamp: number;
}

type SplitViewEventListener = (event: SplitViewEvent) => void;

// ==================== Service Class ====================

class BrowserSplitViewService {
  private static instance: BrowserSplitViewService;
  private listeners: Map<SplitViewEventType, Set<SplitViewEventListener>> = new Map();
  private scrollDebounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): BrowserSplitViewService {
    if (!BrowserSplitViewService.instance) {
      BrowserSplitViewService.instance = new BrowserSplitViewService();
    }
    return BrowserSplitViewService.instance;
  }

  // ==================== Event System ====================

  public on(event: SplitViewEventType, listener: SplitViewEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  public off(event: SplitViewEventType, listener: SplitViewEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: SplitViewEvent): void {
    this.listeners.get(event.type)?.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        log.error('Error in Split View event listener:', error);
      }
    });
  }

  // ==================== Settings Management ====================

  public async getSettings(): Promise<SplitViewSettings> {
    try {
      return await invoke<SplitViewSettings>('split_view_get_settings');
    } catch (error) {
      log.error('Failed to get split view settings:', error);
      throw error;
    }
  }

  public async updateSettings(settings: SplitViewSettings): Promise<void> {
    try {
      await invoke('split_view_update_settings', { settings });
      this.emit({ type: 'settings-changed', timestamp: Date.now() });
    } catch (error) {
      log.error('Failed to update split view settings:', error);
      throw error;
    }
  }

  public async setEnabled(enabled: boolean): Promise<void> {
    try {
      await invoke('split_view_set_enabled', { enabled });
    } catch (error) {
      log.error('Failed to set enabled:', error);
      throw error;
    }
  }

  public async setDefaultLayout(layout: SplitLayout): Promise<void> {
    try {
      await invoke('split_view_set_default_layout', { layout });
    } catch (error) {
      log.error('Failed to set default layout:', error);
      throw error;
    }
  }

  public async setDefaultSyncMode(mode: SyncMode): Promise<void> {
    try {
      await invoke('split_view_set_default_sync_mode', { mode });
    } catch (error) {
      log.error('Failed to set default sync mode:', error);
      throw error;
    }
  }

  public async setShowPanelHeaders(show: boolean): Promise<void> {
    try {
      await invoke('split_view_set_show_panel_headers', { show });
    } catch (error) {
      log.error('Failed to set show panel headers:', error);
      throw error;
    }
  }

  // ==================== Session Management ====================

  public async createSession(
    name?: string,
    layout?: SplitLayout
  ): Promise<SplitViewSession> {
    try {
      const session = await invoke<SplitViewSession>('split_view_create_session', {
        name: name || null,
        layout: layout || null,
      });

      this.emit({
        type: 'session-created',
        sessionId: session.id,
        data: session,
        timestamp: Date.now(),
      });

      return session;
    } catch (error) {
      log.error('Failed to create session:', error);
      throw error;
    }
  }

  public async closeSession(sessionId: string): Promise<void> {
    try {
      await invoke('split_view_close_session', { sessionId });

      this.emit({
        type: 'session-closed',
        sessionId,
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Failed to close session:', error);
      throw error;
    }
  }

  public async closeAllSessions(): Promise<number> {
    try {
      return await invoke<number>('split_view_close_all_sessions');
    } catch (error) {
      log.error('Failed to close all sessions:', error);
      throw error;
    }
  }

  public async getSession(sessionId: string): Promise<SplitViewSession | null> {
    try {
      return await invoke<SplitViewSession | null>('split_view_get_session', { sessionId });
    } catch (error) {
      log.error('Failed to get session:', error);
      throw error;
    }
  }

  public async getAllSessions(): Promise<SplitViewSession[]> {
    try {
      return await invoke<SplitViewSession[]>('split_view_get_all_sessions');
    } catch (error) {
      log.error('Failed to get all sessions:', error);
      throw error;
    }
  }

  public async getActiveSession(): Promise<SplitViewSession | null> {
    try {
      return await invoke<SplitViewSession | null>('split_view_get_active_session');
    } catch (error) {
      log.error('Failed to get active session:', error);
      throw error;
    }
  }

  public async setActiveSession(sessionId: string): Promise<void> {
    try {
      await invoke('split_view_set_active_session', { sessionId });
    } catch (error) {
      log.error('Failed to set active session:', error);
      throw error;
    }
  }

  // ==================== Layout Management ====================

  public async setLayout(sessionId: string, layout: SplitLayout): Promise<void> {
    try {
      await invoke('split_view_set_layout', { sessionId, layout });

      this.emit({
        type: 'layout-changed',
        sessionId,
        data: { layout },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Failed to set layout:', error);
      throw error;
    }
  }

  public async setDividerPosition(sessionId: string, position: number): Promise<void> {
    try {
      await invoke('split_view_set_divider_position', { sessionId, position });

      this.emit({
        type: 'divider-moved',
        sessionId,
        data: { position },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Failed to set divider position:', error);
      throw error;
    }
  }

  public async toggleDividerLock(sessionId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('split_view_toggle_divider_lock', { sessionId });
    } catch (error) {
      log.error('Failed to toggle divider lock:', error);
      throw error;
    }
  }

  public async getLayoutPresets(): Promise<LayoutPreset[]> {
    try {
      return await invoke<LayoutPreset[]>('split_view_get_layout_presets');
    } catch (error) {
      log.error('Failed to get layout presets:', error);
      throw error;
    }
  }

  // ==================== Panel Management ====================

  public async addPanel(
    sessionId: string,
    tabId: string,
    position?: PanelPosition
  ): Promise<SplitPanel> {
    try {
      const panel = await invoke<SplitPanel>('split_view_add_panel', {
        sessionId,
        tabId,
        position: position || null,
      });

      this.emit({
        type: 'panel-added',
        sessionId,
        panelId: panel.id,
        data: panel,
        timestamp: Date.now(),
      });

      return panel;
    } catch (error) {
      log.error('Failed to add panel:', error);
      throw error;
    }
  }

  public async removePanel(sessionId: string, panelId: string): Promise<void> {
    try {
      await invoke('split_view_remove_panel', { sessionId, panelId });

      this.emit({
        type: 'panel-removed',
        sessionId,
        panelId,
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Failed to remove panel:', error);
      throw error;
    }
  }

  public async setActivePanel(sessionId: string, panelId: string): Promise<void> {
    try {
      await invoke('split_view_set_active_panel', { sessionId, panelId });
    } catch (error) {
      log.error('Failed to set active panel:', error);
      throw error;
    }
  }

  public async updatePanel(
    sessionId: string,
    panelId: string,
    updates: PanelUpdate
  ): Promise<void> {
    try {
      await invoke('split_view_update_panel', { sessionId, panelId, updates });
    } catch (error) {
      log.error('Failed to update panel:', error);
      throw error;
    }
  }

  public async swapPanels(
    sessionId: string,
    panel1Id: string,
    panel2Id: string
  ): Promise<void> {
    try {
      await invoke('split_view_swap_panels', { sessionId, panel1Id, panel2Id });
    } catch (error) {
      log.error('Failed to swap panels:', error);
      throw error;
    }
  }

  // ==================== Synchronization ====================

  public async setSyncMode(sessionId: string, mode: SyncMode): Promise<void> {
    try {
      await invoke('split_view_set_sync_mode', { sessionId, mode });
    } catch (error) {
      log.error('Failed to set sync mode:', error);
      throw error;
    }
  }

  public async syncScroll(
    sessionId: string,
    sourcePanelId: string,
    scrollX: number,
    scrollY: number
  ): Promise<string[]> {
    try {
      const syncedPanels = await invoke<string[]>('split_view_sync_scroll', {
        sessionId,
        sourcePanelId,
        scrollX,
        scrollY,
      });

      this.emit({
        type: 'sync-scroll',
        sessionId,
        panelId: sourcePanelId,
        data: { scrollX, scrollY, syncedPanels },
        timestamp: Date.now(),
      });

      return syncedPanels;
    } catch (error) {
      log.error('Failed to sync scroll:', error);
      throw error;
    }
  }

  // Debounced scroll sync to prevent flooding
  public syncScrollDebounced(
    sessionId: string,
    sourcePanelId: string,
    scrollX: number,
    scrollY: number,
    debounceMs: number = 50
  ): void {
    const key = `${sessionId}:${sourcePanelId}`;
    
    const existingTimer = this.scrollDebounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.syncScroll(sessionId, sourcePanelId, scrollX, scrollY);
      this.scrollDebounceTimers.delete(key);
    }, debounceMs);

    this.scrollDebounceTimers.set(key, timer);
  }

  public async syncNavigation(
    sessionId: string,
    sourcePanelId: string,
    url: string
  ): Promise<string[]> {
    try {
      const syncedPanels = await invoke<string[]>('split_view_sync_navigation', {
        sessionId,
        sourcePanelId,
        url,
      });

      this.emit({
        type: 'sync-navigation',
        sessionId,
        panelId: sourcePanelId,
        data: { url, syncedPanels },
        timestamp: Date.now(),
      });

      return syncedPanels;
    } catch (error) {
      log.error('Failed to sync navigation:', error);
      throw error;
    }
  }

  // ==================== Saved Layouts ====================

  public async saveLayout(sessionId: string, name: string): Promise<string> {
    try {
      return await invoke<string>('split_view_save_layout', { sessionId, name });
    } catch (error) {
      log.error('Failed to save layout:', error);
      throw error;
    }
  }

  public async loadSavedLayout(savedId: string): Promise<SplitViewSession> {
    try {
      return await invoke<SplitViewSession>('split_view_load_saved_layout', { savedId });
    } catch (error) {
      log.error('Failed to load saved layout:', error);
      throw error;
    }
  }

  public async getSavedLayouts(): Promise<SplitViewSession[]> {
    try {
      return await invoke<SplitViewSession[]>('split_view_get_saved_layouts');
    } catch (error) {
      log.error('Failed to get saved layouts:', error);
      throw error;
    }
  }

  public async deleteSavedLayout(savedId: string): Promise<void> {
    try {
      await invoke('split_view_delete_saved_layout', { savedId });
    } catch (error) {
      log.error('Failed to delete saved layout:', error);
      throw error;
    }
  }

  // ==================== Statistics ====================

  public async getStats(): Promise<SplitViewStats> {
    try {
      return await invoke<SplitViewStats>('split_view_get_stats');
    } catch (error) {
      log.error('Failed to get stats:', error);
      throw error;
    }
  }

  public async resetStats(): Promise<void> {
    try {
      await invoke('split_view_reset_stats');
    } catch (error) {
      log.error('Failed to reset stats:', error);
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  public getLayoutOptions(): { layout: SplitLayout; label: string; icon: string }[] {
    return [
      { layout: 'Horizontal', label: 'Side by Side', icon: '⬜⬜' },
      { layout: 'Vertical', label: 'Top & Bottom', icon: '⬜\n⬜' },
      { layout: 'Grid2x2', label: '2x2 Grid', icon: '⬜⬜\n⬜⬜' },
      { layout: 'LeftFocus', label: 'Left Focus', icon: '⬛⬜' },
      { layout: 'RightFocus', label: 'Right Focus', icon: '⬜⬛' },
      { layout: 'TopFocus', label: 'Top Focus', icon: '⬛\n⬜' },
      { layout: 'BottomFocus', label: 'Bottom Focus', icon: '⬜\n⬛' },
      { layout: 'ThreeColumns', label: 'Three Columns', icon: '⬜⬜⬜' },
      { layout: 'ThreeRows', label: 'Three Rows', icon: '⬜\n⬜\n⬜' },
    ];
  }

  public getSyncModeOptions(): { mode: SyncMode; label: string; description: string }[] {
    return [
      { mode: 'None', label: 'No Sync', description: 'Panels scroll independently' },
      { mode: 'Scroll', label: 'Sync Scroll', description: 'Scroll positions sync between panels' },
      { mode: 'Navigation', label: 'Sync Navigation', description: 'URL changes sync between panels' },
      { mode: 'Both', label: 'Full Sync', description: 'Both scroll and navigation sync' },
    ];
  }

  public getKeyboardShortcuts(): { key: string; description: string }[] {
    return [
      { key: 'Ctrl+Alt+S', description: 'Toggle split view' },
      { key: 'Ctrl+Alt+H', description: 'Horizontal split' },
      { key: 'Ctrl+Alt+V', description: 'Vertical split' },
      { key: 'Ctrl+Alt+G', description: '2x2 grid' },
      { key: 'Ctrl+Alt+Left', description: 'Focus left panel' },
      { key: 'Ctrl+Alt+Right', description: 'Focus right panel' },
      { key: 'Ctrl+Alt+Up', description: 'Focus top panel' },
      { key: 'Ctrl+Alt+Down', description: 'Focus bottom panel' },
      { key: 'Ctrl+Alt+X', description: 'Close split view' },
      { key: 'Ctrl+Alt+W', description: 'Swap panels' },
    ];
  }
}

// Export singleton instance
export const browserSplitViewService = BrowserSplitViewService.getInstance();

// Export class for testing
export { BrowserSplitViewService };
