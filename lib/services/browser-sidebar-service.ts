// CUBE Nexum - Sidebar Service
// TypeScript service for sidebar with messaging, music, and web panels

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('Sidebar');

// ==================== Types ====================

export type SidebarPosition = 'Left' | 'Right';

export type PanelType =
  // Messaging
  | 'Messenger'
  | 'WhatsApp'
  | 'Telegram'
  | 'Discord'
  | 'Slack'
  // Music
  | 'Spotify'
  | 'AppleMusic'
  | 'YouTubeMusic'
  | 'SoundCloud'
  | 'Deezer'
  // Productivity
  | 'Notes'
  | 'Tasks'
  | 'Calendar'
  | 'Bookmarks'
  | 'History'
  | 'Downloads'
  // Web Panels
  | 'CustomWebPanel'
  | 'Twitter'
  | 'LinkedIn'
  | 'Reddit'
  | 'GitHub';

export type PanelStatus = 'Loading' | 'Ready' | 'Error' | 'Unloaded' | 'Suspended';

export type AnimationStyle = 'Slide' | 'Fade' | 'Push' | 'Overlay' | 'None';

export type AutoHideBehavior = 'Never' | 'Always' | 'OnFullscreen' | 'OnNarrowWindow';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface SidebarPanel {
  id: string;
  panel_type: PanelType;
  name: string;
  icon: string;
  url: string | null;
  custom_css: string | null;
  custom_js: string | null;
  status: PanelStatus;
  is_pinned: boolean;
  is_visible: boolean;
  width: number;
  badge_count: number;
  last_accessed: number;
  notifications_enabled: boolean;
  auto_reload_interval: number | null;
  scroll_position: number;
  zoom_level: number;
  user_agent_override: string | null;
}

export interface SidebarSettings {
  enabled: boolean;
  position: SidebarPosition;
  width: number;
  min_width: number;
  max_width: number;
  collapsed_width: number;
  animation_style: AnimationStyle;
  animation_duration_ms: number;
  auto_hide: AutoHideBehavior;
  auto_hide_delay_ms: number;
  show_panel_names: boolean;
  show_badge_counts: boolean;
  compact_mode: boolean;
  hover_expand: boolean;
  hover_expand_delay_ms: number;
  keyboard_shortcut: string;
  panel_keyboard_shortcuts: boolean;
  remember_last_panel: boolean;
  suspend_inactive_panels: boolean;
  suspend_after_minutes: number;
  global_notifications: boolean;
  notification_sound: boolean;
  background_color: string | null;
  accent_color: string | null;
  panel_order: string[];
}

export interface SidebarState {
  is_expanded: boolean;
  is_visible: boolean;
  active_panel_id: string | null;
  width: number;
  last_active_panel_id: string | null;
  pinned_panels: string[];
}

export interface SidebarNote {
  id: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
  color: string;
  is_pinned: boolean;
  tags: string[];
  linked_url: string | null;
}

export interface SidebarTask {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: TaskPriority;
  due_date: number | null;
  created_at: number;
  completed_at: number | null;
  tags: string[];
  linked_url: string | null;
}

export interface SidebarStats {
  total_panels_opened: number;
  total_time_expanded_seconds: number;
  most_used_panel: string | null;
  panel_usage: Record<string, number>;
  messages_received: number;
  notes_created: number;
  tasks_completed: number;
}

export interface PanelUpdate {
  name?: string;
  url?: string;
  icon?: string;
  width?: number;
  is_pinned?: boolean;
  is_visible?: boolean;
  notifications_enabled?: boolean;
  custom_css?: string;
  custom_js?: string;
  zoom_level?: number;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: number;
  tags?: string[];
  linked_url?: string;
}

// ==================== Event Types ====================

export type SidebarEventType =
  | 'toggled'
  | 'expanded'
  | 'collapsed'
  | 'panel-changed'
  | 'panel-added'
  | 'panel-removed'
  | 'note-created'
  | 'note-updated'
  | 'task-created'
  | 'task-completed'
  | 'settings-changed';

export interface SidebarEvent {
  type: SidebarEventType;
  panelId?: string;
  noteId?: string;
  taskId?: string;
  data?: unknown;
  timestamp: number;
}

type SidebarEventListener = (event: SidebarEvent) => void;

// ==================== Panel Category Info ====================

export interface PanelCategoryInfo {
  type: PanelType;
  name: string;
  icon: string;
  category: 'messaging' | 'music' | 'productivity' | 'web';
  url: string | null;
}

const PANEL_CATALOG: PanelCategoryInfo[] = [
  // Messaging
  { type: 'Messenger', name: 'Messenger', icon: '💬', category: 'messaging', url: 'https://www.messenger.com' },
  { type: 'WhatsApp', name: 'WhatsApp', icon: '📱', category: 'messaging', url: 'https://web.whatsapp.com' },
  { type: 'Telegram', name: 'Telegram', icon: '✈️', category: 'messaging', url: 'https://web.telegram.org' },
  { type: 'Discord', name: 'Discord', icon: '🎮', category: 'messaging', url: 'https://discord.com/app' },
  { type: 'Slack', name: 'Slack', icon: '💼', category: 'messaging', url: 'https://app.slack.com' },
  // Music
  { type: 'Spotify', name: 'Spotify', icon: '🎵', category: 'music', url: 'https://open.spotify.com' },
  { type: 'AppleMusic', name: 'Apple Music', icon: '🎧', category: 'music', url: 'https://music.apple.com' },
  { type: 'YouTubeMusic', name: 'YouTube Music', icon: '▶️', category: 'music', url: 'https://music.youtube.com' },
  { type: 'SoundCloud', name: 'SoundCloud', icon: '☁️', category: 'music', url: 'https://soundcloud.com' },
  { type: 'Deezer', name: 'Deezer', icon: '🎶', category: 'music', url: 'https://www.deezer.com' },
  // Productivity
  { type: 'Notes', name: 'Notes', icon: '📝', category: 'productivity', url: null },
  { type: 'Tasks', name: 'Tasks', icon: '✅', category: 'productivity', url: null },
  { type: 'Calendar', name: 'Calendar', icon: '📅', category: 'productivity', url: null },
  { type: 'Bookmarks', name: 'Bookmarks', icon: '⭐', category: 'productivity', url: null },
  { type: 'History', name: 'History', icon: '🕐', category: 'productivity', url: null },
  { type: 'Downloads', name: 'Downloads', icon: '📥', category: 'productivity', url: null },
  // Web Panels
  { type: 'CustomWebPanel', name: 'Custom Web Panel', icon: '🌐', category: 'web', url: null },
  { type: 'Twitter', name: 'Twitter/X', icon: '🐦', category: 'web', url: 'https://twitter.com' },
  { type: 'LinkedIn', name: 'LinkedIn', icon: '💼', category: 'web', url: 'https://www.linkedin.com' },
  { type: 'Reddit', name: 'Reddit', icon: '🔴', category: 'web', url: 'https://www.reddit.com' },
  { type: 'GitHub', name: 'GitHub', icon: '🐙', category: 'web', url: 'https://github.com' },
];

// ==================== Service Class ====================

class BrowserSidebarService {
  private static instance: BrowserSidebarService;
  private listeners: Map<SidebarEventType, Set<SidebarEventListener>> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): BrowserSidebarService {
    if (!BrowserSidebarService.instance) {
      BrowserSidebarService.instance = new BrowserSidebarService();
    }
    return BrowserSidebarService.instance;
  }

  // ==================== Event System ====================

  public on(event: SidebarEventType, listener: SidebarEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  public off(event: SidebarEventType, listener: SidebarEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: SidebarEvent): void {
    this.listeners.get(event.type)?.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        log.error('Error in Sidebar event listener:', error);
      }
    });
  }

  // ==================== Settings ====================

  public async getSettings(): Promise<SidebarSettings> {
    try {
      return await invoke<SidebarSettings>('sidebar_get_settings');
    } catch (error) {
      log.error('Failed to get sidebar settings:', error);
      throw error;
    }
  }

  public async updateSettings(settings: SidebarSettings): Promise<void> {
    try {
      await invoke('sidebar_update_settings', { settings });
      this.emit({ type: 'settings-changed', timestamp: Date.now() });
    } catch (error) {
      log.error('Failed to update sidebar settings:', error);
      throw error;
    }
  }

  public async setPosition(position: SidebarPosition): Promise<void> {
    try {
      await invoke('sidebar_set_position', { position });
    } catch (error) {
      log.error('Failed to set position:', error);
      throw error;
    }
  }

  public async setWidth(width: number): Promise<void> {
    try {
      await invoke('sidebar_set_width', { width });
    } catch (error) {
      log.error('Failed to set width:', error);
      throw error;
    }
  }

  public async setAutoHide(behavior: AutoHideBehavior): Promise<void> {
    try {
      await invoke('sidebar_set_auto_hide', { behavior });
    } catch (error) {
      log.error('Failed to set auto hide:', error);
      throw error;
    }
  }

  public async toggleCompactMode(): Promise<boolean> {
    try {
      return await invoke<boolean>('sidebar_toggle_compact_mode');
    } catch (error) {
      log.error('Failed to toggle compact mode:', error);
      throw error;
    }
  }

  // ==================== State ====================

  public async getState(): Promise<SidebarState> {
    try {
      return await invoke<SidebarState>('sidebar_get_state');
    } catch (error) {
      log.error('Failed to get sidebar state:', error);
      throw error;
    }
  }

  public async toggle(): Promise<boolean> {
    try {
      const isExpanded = await invoke<boolean>('sidebar_toggle');
      this.emit({
        type: isExpanded ? 'expanded' : 'collapsed',
        timestamp: Date.now(),
      });
      return isExpanded;
    } catch (error) {
      log.error('Failed to toggle sidebar:', error);
      throw error;
    }
  }

  public async expand(): Promise<void> {
    try {
      await invoke('sidebar_expand');
      this.emit({ type: 'expanded', timestamp: Date.now() });
    } catch (error) {
      log.error('Failed to expand sidebar:', error);
      throw error;
    }
  }

  public async collapse(): Promise<void> {
    try {
      await invoke('sidebar_collapse');
      this.emit({ type: 'collapsed', timestamp: Date.now() });
    } catch (error) {
      log.error('Failed to collapse sidebar:', error);
      throw error;
    }
  }

  public async setVisible(visible: boolean): Promise<void> {
    try {
      await invoke('sidebar_set_visible', { visible });
    } catch (error) {
      log.error('Failed to set visibility:', error);
      throw error;
    }
  }

  // ==================== Panels ====================

  public async getAllPanels(): Promise<SidebarPanel[]> {
    try {
      return await invoke<SidebarPanel[]>('sidebar_get_all_panels');
    } catch (error) {
      log.error('Failed to get all panels:', error);
      throw error;
    }
  }

  public async getPanel(panelId: string): Promise<SidebarPanel | null> {
    try {
      return await invoke<SidebarPanel | null>('sidebar_get_panel', { panelId });
    } catch (error) {
      log.error('Failed to get panel:', error);
      throw error;
    }
  }

  public async getActivePanel(): Promise<SidebarPanel | null> {
    try {
      return await invoke<SidebarPanel | null>('sidebar_get_active_panel');
    } catch (error) {
      log.error('Failed to get active panel:', error);
      throw error;
    }
  }

  public async setActivePanel(panelId: string): Promise<void> {
    try {
      await invoke('sidebar_set_active_panel', { panelId });
      this.emit({
        type: 'panel-changed',
        panelId,
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Failed to set active panel:', error);
      throw error;
    }
  }

  public async addPanel(panelType: PanelType): Promise<SidebarPanel> {
    try {
      const panel = await invoke<SidebarPanel>('sidebar_add_panel', { panelType });
      this.emit({
        type: 'panel-added',
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

  public async addCustomPanel(
    name: string,
    url: string,
    icon?: string
  ): Promise<SidebarPanel> {
    try {
      const panel = await invoke<SidebarPanel>('sidebar_add_custom_panel', {
        name,
        url,
        icon: icon || null,
      });
      this.emit({
        type: 'panel-added',
        panelId: panel.id,
        data: panel,
        timestamp: Date.now(),
      });
      return panel;
    } catch (error) {
      log.error('Failed to add custom panel:', error);
      throw error;
    }
  }

  public async removePanel(panelId: string): Promise<void> {
    try {
      await invoke('sidebar_remove_panel', { panelId });
      this.emit({
        type: 'panel-removed',
        panelId,
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Failed to remove panel:', error);
      throw error;
    }
  }

  public async updatePanel(panelId: string, updates: PanelUpdate): Promise<void> {
    try {
      await invoke('sidebar_update_panel', { panelId, updates });
    } catch (error) {
      log.error('Failed to update panel:', error);
      throw error;
    }
  }

  public async togglePanelPin(panelId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('sidebar_toggle_panel_pin', { panelId });
    } catch (error) {
      log.error('Failed to toggle panel pin:', error);
      throw error;
    }
  }

  public async setPanelStatus(panelId: string, status: PanelStatus): Promise<void> {
    try {
      await invoke('sidebar_set_panel_status', { panelId, status });
    } catch (error) {
      log.error('Failed to set panel status:', error);
      throw error;
    }
  }

  public async updateBadgeCount(panelId: string, count: number): Promise<void> {
    try {
      await invoke('sidebar_update_badge_count', { panelId, count });
    } catch (error) {
      log.error('Failed to update badge count:', error);
      throw error;
    }
  }

  public async reorderPanels(panelOrder: string[]): Promise<void> {
    try {
      await invoke('sidebar_reorder_panels', { panelOrder });
    } catch (error) {
      log.error('Failed to reorder panels:', error);
      throw error;
    }
  }

  // ==================== Panel Categories ====================

  public async getMessagingPanels(): Promise<SidebarPanel[]> {
    try {
      return await invoke<SidebarPanel[]>('sidebar_get_messaging_panels');
    } catch (error) {
      log.error('Failed to get messaging panels:', error);
      throw error;
    }
  }

  public async getMusicPanels(): Promise<SidebarPanel[]> {
    try {
      return await invoke<SidebarPanel[]>('sidebar_get_music_panels');
    } catch (error) {
      log.error('Failed to get music panels:', error);
      throw error;
    }
  }

  public async getProductivityPanels(): Promise<SidebarPanel[]> {
    try {
      return await invoke<SidebarPanel[]>('sidebar_get_productivity_panels');
    } catch (error) {
      log.error('Failed to get productivity panels:', error);
      throw error;
    }
  }

  public async getWebPanels(): Promise<SidebarPanel[]> {
    try {
      return await invoke<SidebarPanel[]>('sidebar_get_web_panels');
    } catch (error) {
      log.error('Failed to get web panels:', error);
      throw error;
    }
  }

  public async getTotalBadgeCount(): Promise<number> {
    try {
      return await invoke<number>('sidebar_get_total_badge_count');
    } catch (error) {
      log.error('Failed to get total badge count:', error);
      throw error;
    }
  }

  // ==================== Notes ====================

  public async getAllNotes(): Promise<SidebarNote[]> {
    try {
      return await invoke<SidebarNote[]>('sidebar_get_all_notes');
    } catch (error) {
      log.error('Failed to get all notes:', error);
      throw error;
    }
  }

  public async getNote(noteId: string): Promise<SidebarNote | null> {
    try {
      return await invoke<SidebarNote | null>('sidebar_get_note', { noteId });
    } catch (error) {
      log.error('Failed to get note:', error);
      throw error;
    }
  }

  public async createNote(title: string, content: string): Promise<SidebarNote> {
    try {
      const note = await invoke<SidebarNote>('sidebar_create_note', { title, content });
      this.emit({
        type: 'note-created',
        noteId: note.id,
        data: note,
        timestamp: Date.now(),
      });
      return note;
    } catch (error) {
      log.error('Failed to create note:', error);
      throw error;
    }
  }

  public async updateNote(
    noteId: string,
    title?: string,
    content?: string
  ): Promise<void> {
    try {
      await invoke('sidebar_update_note', {
        noteId,
        title: title || null,
        content: content || null,
      });
      this.emit({
        type: 'note-updated',
        noteId,
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Failed to update note:', error);
      throw error;
    }
  }

  public async deleteNote(noteId: string): Promise<void> {
    try {
      await invoke('sidebar_delete_note', { noteId });
    } catch (error) {
      log.error('Failed to delete note:', error);
      throw error;
    }
  }

  public async toggleNotePin(noteId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('sidebar_toggle_note_pin', { noteId });
    } catch (error) {
      log.error('Failed to toggle note pin:', error);
      throw error;
    }
  }

  public async setNoteColor(noteId: string, color: string): Promise<void> {
    try {
      await invoke('sidebar_set_note_color', { noteId, color });
    } catch (error) {
      log.error('Failed to set note color:', error);
      throw error;
    }
  }

  public async linkNoteToUrl(noteId: string, url: string | null): Promise<void> {
    try {
      await invoke('sidebar_link_note_to_url', { noteId, url });
    } catch (error) {
      log.error('Failed to link note to URL:', error);
      throw error;
    }
  }

  // ==================== Tasks ====================

  public async getAllTasks(): Promise<SidebarTask[]> {
    try {
      return await invoke<SidebarTask[]>('sidebar_get_all_tasks');
    } catch (error) {
      log.error('Failed to get all tasks:', error);
      throw error;
    }
  }

  public async getTask(taskId: string): Promise<SidebarTask | null> {
    try {
      return await invoke<SidebarTask | null>('sidebar_get_task', { taskId });
    } catch (error) {
      log.error('Failed to get task:', error);
      throw error;
    }
  }

  public async createTask(title: string): Promise<SidebarTask> {
    try {
      const task = await invoke<SidebarTask>('sidebar_create_task', { title });
      this.emit({
        type: 'task-created',
        taskId: task.id,
        data: task,
        timestamp: Date.now(),
      });
      return task;
    } catch (error) {
      log.error('Failed to create task:', error);
      throw error;
    }
  }

  public async updateTask(taskId: string, updates: TaskUpdate): Promise<void> {
    try {
      await invoke('sidebar_update_task', { taskId, updates });
    } catch (error) {
      log.error('Failed to update task:', error);
      throw error;
    }
  }

  public async toggleTaskComplete(taskId: string): Promise<boolean> {
    try {
      const completed = await invoke<boolean>('sidebar_toggle_task_complete', { taskId });
      if (completed) {
        this.emit({
          type: 'task-completed',
          taskId,
          timestamp: Date.now(),
        });
      }
      return completed;
    } catch (error) {
      log.error('Failed to toggle task complete:', error);
      throw error;
    }
  }

  public async deleteTask(taskId: string): Promise<void> {
    try {
      await invoke('sidebar_delete_task', { taskId });
    } catch (error) {
      log.error('Failed to delete task:', error);
      throw error;
    }
  }

  public async clearCompletedTasks(): Promise<number> {
    try {
      return await invoke<number>('sidebar_clear_completed_tasks');
    } catch (error) {
      log.error('Failed to clear completed tasks:', error);
      throw error;
    }
  }

  // ==================== Statistics ====================

  public async getStats(): Promise<SidebarStats> {
    try {
      return await invoke<SidebarStats>('sidebar_get_stats');
    } catch (error) {
      log.error('Failed to get stats:', error);
      throw error;
    }
  }

  public async resetStats(): Promise<void> {
    try {
      await invoke('sidebar_reset_stats');
    } catch (error) {
      log.error('Failed to reset stats:', error);
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  public getPanelCatalog(): PanelCategoryInfo[] {
    return [...PANEL_CATALOG];
  }

  public getPanelsByCategory(category: 'messaging' | 'music' | 'productivity' | 'web'): PanelCategoryInfo[] {
    return PANEL_CATALOG.filter(p => p.category === category);
  }

  public getPanelInfo(panelType: PanelType): PanelCategoryInfo | undefined {
    return PANEL_CATALOG.find(p => p.type === panelType);
  }

  public getNoteColors(): { name: string; color: string }[] {
    return [
      { name: 'Yellow', color: '#fef08a' },
      { name: 'Green', color: '#bbf7d0' },
      { name: 'Blue', color: '#bfdbfe' },
      { name: 'Purple', color: '#ddd6fe' },
      { name: 'Pink', color: '#fbcfe8' },
      { name: 'Orange', color: '#fed7aa' },
      { name: 'Red', color: '#fecaca' },
      { name: 'Gray', color: '#e5e7eb' },
    ];
  }

  public getTaskPriorities(): { priority: TaskPriority; label: string; color: string }[] {
    return [
      { priority: 'Low', label: 'Low', color: '#6b7280' },
      { priority: 'Medium', label: 'Medium', color: '#3b82f6' },
      { priority: 'High', label: 'High', color: '#f59e0b' },
      { priority: 'Urgent', label: 'Urgent', color: '#ef4444' },
    ];
  }

  public getKeyboardShortcuts(): { key: string; description: string }[] {
    return [
      { key: 'Ctrl+Shift+S', description: 'Toggle sidebar' },
      { key: 'Ctrl+Shift+M', description: 'Open messaging' },
      { key: 'Ctrl+Shift+P', description: 'Open music player' },
      { key: 'Ctrl+Shift+N', description: 'Open notes' },
      { key: 'Ctrl+Shift+T', description: 'Open tasks' },
      { key: 'Ctrl+Shift+B', description: 'Open bookmarks' },
      { key: 'Ctrl+Shift+H', description: 'Open history' },
      { key: 'Ctrl+Shift+D', description: 'Open downloads' },
      { key: 'Escape', description: 'Close sidebar' },
    ];
  }

  public formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp * 1000;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }
}

// Export singleton instance
export const browserSidebarService = BrowserSidebarService.getInstance();

// Export class for testing
export { BrowserSidebarService };
