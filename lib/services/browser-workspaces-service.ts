// CUBE Nexum - Workspaces TypeScript Service
// Superior to Chrome Profiles, Arc Spaces, Vivaldi Workspaces
// Full TypeScript implementation with all types and methods

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('BrowserWorkspaces');

// ==================== Enums ====================

export type PresetIcon = 
  | 'Work'
  | 'Personal'
  | 'Shopping'
  | 'Research'
  | 'Development'
  | 'Design'
  | 'Finance'
  | 'Social'
  | 'Entertainment'
  | 'Education'
  | 'Travel'
  | 'Health'
  | 'News'
  | 'Gaming'
  | 'Custom';

export type WorkspaceIconType = 
  | { type: 'Emoji'; value: string }
  | { type: 'Letter'; value: string }
  | { type: 'Image'; value: string }
  | { type: 'Preset'; value: PresetIcon };

export type WorkspaceColor = 
  | 'Blue'
  | 'Green'
  | 'Red'
  | 'Purple'
  | 'Orange'
  | 'Pink'
  | 'Teal'
  | 'Yellow'
  | 'Gray'
  | { Custom: string };

export type WorkspaceLayout = 'Tabs' | 'Grid' | 'List' | 'Tree';

export type WorkspaceStatus = 'Active' | 'Sleeping' | 'Archived';

export type SwitchAnimation = 'None' | 'Fade' | 'Slide' | 'Scale';

// ==================== Interfaces ====================

export interface WorkspaceSettings {
  enabled: boolean;
  show_workspace_bar: boolean;
  workspace_bar_position: string;
  default_layout: WorkspaceLayout;
  switch_animation: SwitchAnimation;
  auto_sleep_minutes: number;
  max_workspaces: number;
  sync_across_devices: boolean;
  remember_window_positions: boolean;
  isolate_cookies: boolean;
  isolate_storage: boolean;
  isolate_cache: boolean;
  show_tab_count: boolean;
  keyboard_shortcuts: boolean;
  quick_switch_enabled: boolean;
}

export interface WorkspaceTab {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  pinned: boolean;
  muted: boolean;
  position: number;
  group_id: string | null;
  scroll_position: number;
  last_accessed: number;
  created_at: number;
}

export interface WorkspaceWindow {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
  fullscreen: boolean;
  tabs: string[];
  active_tab: string | null;
}

export interface ProxyConfig {
  enabled: boolean;
  proxy_type: string;
  host: string;
  port: number;
  username: string | null;
  password: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  icon: WorkspaceIconType;
  color: WorkspaceColor;
  description: string | null;
  status: WorkspaceStatus;
  layout: WorkspaceLayout;
  tabs: WorkspaceTab[];
  windows: WorkspaceWindow[];
  active_tab_id: string | null;
  pinned: boolean;
  locked: boolean;
  default_url: string | null;
  allowed_domains: string[];
  blocked_domains: string[];
  custom_user_agent: string | null;
  proxy_config: ProxyConfig | null;
  container_id: string | null;
  keyboard_shortcut: string | null;
  position: number;
  created_at: number;
  last_accessed: number;
  total_time_seconds: number;
}

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  icon: WorkspaceIconType;
  color: WorkspaceColor;
  default_tabs: string[];
  allowed_domains: string[];
  is_builtin: boolean;
}

export interface WorkspaceSnapshot {
  id: string;
  workspace_id: string;
  name: string;
  tabs: WorkspaceTab[];
  windows: WorkspaceWindow[];
  created_at: number;
  auto_created: boolean;
}

export interface WorkspaceStats {
  total_workspaces: number;
  active_workspaces: number;
  sleeping_workspaces: number;
  archived_workspaces: number;
  total_tabs: number;
  total_time_hours: number;
  most_used_workspace: string | null;
  switches_today: number;
  tabs_opened_today: number;
}

export interface QuickSwitchItem {
  workspace_id: string;
  name: string;
  icon: WorkspaceIconType;
  color: WorkspaceColor;
  tab_count: number;
  keyboard_shortcut: string | null;
  last_accessed: number;
}

// ==================== Constants ====================

export const WORKSPACE_COLORS: { name: string; value: WorkspaceColor; hex: string }[] = [
  { name: 'Blue', value: 'Blue', hex: '#3b82f6' },
  { name: 'Green', value: 'Green', hex: '#22c55e' },
  { name: 'Red', value: 'Red', hex: '#ef4444' },
  { name: 'Purple', value: 'Purple', hex: '#a855f7' },
  { name: 'Orange', value: 'Orange', hex: '#f97316' },
  { name: 'Pink', value: 'Pink', hex: '#ec4899' },
  { name: 'Teal', value: 'Teal', hex: '#14b8a6' },
  { name: 'Yellow', value: 'Yellow', hex: '#eab308' },
  { name: 'Gray', value: 'Gray', hex: '#6b7280' },
];

export const WORKSPACE_ICONS: string[] = [
  '💼', '🏠', '🛒', '🔬', '💻', '🎨', '💰', '👥', '🎬', '📚',
  '✈️', '❤️', '📰', '🎮', '📁', '⭐', '🔧', '📊', '🎯', '🚀',
];

export const WORKSPACE_LAYOUTS: { name: string; value: WorkspaceLayout }[] = [
  { name: 'Tabs', value: 'Tabs' },
  { name: 'Grid', value: 'Grid' },
  { name: 'List', value: 'List' },
  { name: 'Tree', value: 'Tree' },
];

export const SWITCH_ANIMATIONS: { name: string; value: SwitchAnimation }[] = [
  { name: 'None', value: 'None' },
  { name: 'Fade', value: 'Fade' },
  { name: 'Slide', value: 'Slide' },
  { name: 'Scale', value: 'Scale' },
];

export const PRESET_ICONS: { name: string; value: PresetIcon; emoji: string }[] = [
  { name: 'Work', value: 'Work', emoji: '💼' },
  { name: 'Personal', value: 'Personal', emoji: '🏠' },
  { name: 'Shopping', value: 'Shopping', emoji: '🛒' },
  { name: 'Research', value: 'Research', emoji: '🔬' },
  { name: 'Development', value: 'Development', emoji: '💻' },
  { name: 'Design', value: 'Design', emoji: '🎨' },
  { name: 'Finance', value: 'Finance', emoji: '💰' },
  { name: 'Social', value: 'Social', emoji: '👥' },
  { name: 'Entertainment', value: 'Entertainment', emoji: '🎬' },
  { name: 'Education', value: 'Education', emoji: '📚' },
  { name: 'Travel', value: 'Travel', emoji: '✈️' },
  { name: 'Health', value: 'Health', emoji: '❤️' },
  { name: 'News', value: 'News', emoji: '📰' },
  { name: 'Gaming', value: 'Gaming', emoji: '🎮' },
  { name: 'Custom', value: 'Custom', emoji: '📁' },
];

// ==================== Event Types ====================

export type WorkspaceEventType =
  | 'workspace-created'
  | 'workspace-switched'
  | 'workspace-updated'
  | 'workspace-deleted'
  | 'workspace-archived'
  | 'tab-added'
  | 'tab-removed'
  | 'tab-moved'
  | 'tab-updated'
  | 'settings-changed'
  | 'snapshot-created'
  | 'snapshot-restored'
  | 'quick-switch';

export interface WorkspaceEvent {
  type: WorkspaceEventType;
  workspace_id?: string;
  tab_id?: string;
  data?: unknown;
  timestamp: number;
}

// ==================== Utility Functions ====================

export function getColorHex(color: WorkspaceColor): string {
  if (typeof color === 'object' && 'Custom' in color) {
    return color.Custom;
  }
  const found = WORKSPACE_COLORS.find(c => c.value === color);
  return found?.hex || '#6b7280';
}

export function getIconEmoji(icon: WorkspaceIconType): string {
  switch (icon.type) {
    case 'Emoji':
      return icon.value;
    case 'Letter':
      return icon.value;
    case 'Preset':
      const preset = PRESET_ICONS.find(p => p.value === icon.value);
      return preset?.emoji || '📁';
    case 'Image':
      return '🖼️';
    default:
      return '📁';
  }
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// ==================== Service Class ====================

type EventCallback = (event: WorkspaceEvent) => void;

export class BrowserWorkspacesService {
  private eventCallbacks: Map<WorkspaceEventType, Set<EventCallback>> = new Map();
  private activeWorkspaceId: string | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const activeId = await this.getActiveWorkspaceId();
      this.activeWorkspaceId = activeId;
    } catch (error) {
      log.error('Failed to initialize workspaces service:', error);
    }
  }

  // ==================== Event System ====================

  public on(event: WorkspaceEventType, callback: EventCallback): () => void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)!.add(callback);

    return () => {
      this.eventCallbacks.get(event)?.delete(callback);
    };
  }

  public off(event: WorkspaceEventType, callback: EventCallback): void {
    this.eventCallbacks.get(event)?.delete(callback);
  }

  private emit(type: WorkspaceEventType, data?: Partial<WorkspaceEvent>): void {
    const event: WorkspaceEvent = {
      type,
      timestamp: Date.now(),
      ...data,
    };

    this.eventCallbacks.get(type)?.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        log.error('Event callback error:', error);
      }
    });
  }

  // ==================== Settings ====================

  async getSettings(): Promise<WorkspaceSettings> {
    return invoke<WorkspaceSettings>('workspaces_get_settings');
  }

  async updateSettings(settings: WorkspaceSettings): Promise<void> {
    await invoke('workspaces_update_settings', { settings });
    this.emit('settings-changed', { data: settings });
  }

  async setEnabled(enabled: boolean): Promise<void> {
    await invoke('workspaces_set_enabled', { enabled });
  }

  async setBarPosition(position: string): Promise<void> {
    await invoke('workspaces_set_bar_position', { position });
  }

  async setDefaultLayout(layout: WorkspaceLayout): Promise<void> {
    await invoke('workspaces_set_default_layout', { layout });
  }

  async setSwitchAnimation(animation: SwitchAnimation): Promise<void> {
    await invoke('workspaces_set_switch_animation', { animation });
  }

  async setAutoSleepMinutes(minutes: number): Promise<void> {
    await invoke('workspaces_set_auto_sleep', { minutes });
  }

  async setIsolationSettings(cookies: boolean, storage: boolean, cache: boolean): Promise<void> {
    await invoke('workspaces_set_isolation', { cookies, storage, cache });
  }

  // ==================== Workspace Management ====================

  async createWorkspace(name: string, templateId?: string): Promise<Workspace> {
    const workspace = await invoke<Workspace>('workspaces_create', { 
      name, 
      templateId: templateId || null 
    });
    this.emit('workspace-created', { workspace_id: workspace.id, data: workspace });
    return workspace;
  }

  async createFromTemplate(templateId: string): Promise<Workspace> {
    const workspace = await invoke<Workspace>('workspaces_create_from_template', { templateId });
    this.emit('workspace-created', { workspace_id: workspace.id, data: workspace });
    return workspace;
  }

  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    return invoke<Workspace | null>('workspaces_get', { workspaceId });
  }

  async getAllWorkspaces(): Promise<Workspace[]> {
    return invoke<Workspace[]>('workspaces_get_all');
  }

  async getActiveWorkspace(): Promise<Workspace | null> {
    return invoke<Workspace | null>('workspaces_get_active');
  }

  async getActiveWorkspaceId(): Promise<string | null> {
    return invoke<string | null>('workspaces_get_active_id');
  }

  async switchWorkspace(workspaceId: string): Promise<Workspace> {
    const workspace = await invoke<Workspace>('workspaces_switch', { workspaceId });
    this.activeWorkspaceId = workspaceId;
    this.emit('workspace-switched', { workspace_id: workspaceId, data: workspace });
    return workspace;
  }

  async updateWorkspace(
    workspaceId: string,
    name?: string,
    description?: string,
    icon?: WorkspaceIconType,
    color?: WorkspaceColor
  ): Promise<Workspace> {
    const workspace = await invoke<Workspace>('workspaces_update', {
      workspaceId,
      name: name || null,
      description: description || null,
      icon: icon || null,
      color: color || null,
    });
    this.emit('workspace-updated', { workspace_id: workspaceId, data: workspace });
    return workspace;
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await invoke('workspaces_delete', { workspaceId });
    this.emit('workspace-deleted', { workspace_id: workspaceId });
  }

  async archiveWorkspace(workspaceId: string): Promise<void> {
    await invoke('workspaces_archive', { workspaceId });
    this.emit('workspace-archived', { workspace_id: workspaceId });
  }

  async unarchiveWorkspace(workspaceId: string): Promise<void> {
    await invoke('workspaces_unarchive', { workspaceId });
  }

  async pinWorkspace(workspaceId: string, pinned: boolean): Promise<void> {
    await invoke('workspaces_pin', { workspaceId, pinned });
  }

  async lockWorkspace(workspaceId: string, locked: boolean): Promise<void> {
    await invoke('workspaces_lock', { workspaceId, locked });
  }

  async setWorkspaceLayout(workspaceId: string, layout: WorkspaceLayout): Promise<void> {
    await invoke('workspaces_set_layout', { workspaceId, layout });
  }

  async setWorkspaceShortcut(workspaceId: string, shortcut: string | null): Promise<void> {
    await invoke('workspaces_set_shortcut', { workspaceId, shortcut });
  }

  async reorderWorkspaces(workspaceIds: string[]): Promise<void> {
    await invoke('workspaces_reorder', { workspaceIds });
  }

  // ==================== Tab Management ====================

  async addTab(workspaceId: string, url: string, title?: string): Promise<WorkspaceTab> {
    const tab = await invoke<WorkspaceTab>('workspaces_add_tab', {
      workspaceId,
      url,
      title: title || null,
    });
    this.emit('tab-added', { workspace_id: workspaceId, tab_id: tab.id, data: tab });
    return tab;
  }

  async removeTab(workspaceId: string, tabId: string): Promise<void> {
    await invoke('workspaces_remove_tab', { workspaceId, tabId });
    this.emit('tab-removed', { workspace_id: workspaceId, tab_id: tabId });
  }

  async updateTab(
    workspaceId: string,
    tabId: string,
    url?: string,
    title?: string,
    favicon?: string
  ): Promise<WorkspaceTab> {
    const tab = await invoke<WorkspaceTab>('workspaces_update_tab', {
      workspaceId,
      tabId,
      url: url || null,
      title: title || null,
      favicon: favicon || null,
    });
    this.emit('tab-updated', { workspace_id: workspaceId, tab_id: tabId, data: tab });
    return tab;
  }

  async moveTab(fromWorkspaceId: string, toWorkspaceId: string, tabId: string): Promise<void> {
    await invoke('workspaces_move_tab', { fromWorkspaceId, toWorkspaceId, tabId });
    this.emit('tab-moved', { workspace_id: toWorkspaceId, tab_id: tabId });
  }

  async setActiveTab(workspaceId: string, tabId: string): Promise<void> {
    await invoke('workspaces_set_active_tab', { workspaceId, tabId });
  }

  async pinTab(workspaceId: string, tabId: string, pinned: boolean): Promise<void> {
    await invoke('workspaces_pin_tab', { workspaceId, tabId, pinned });
  }

  async muteTab(workspaceId: string, tabId: string, muted: boolean): Promise<void> {
    await invoke('workspaces_mute_tab', { workspaceId, tabId, muted });
  }

  // ==================== Domain Rules ====================

  async addAllowedDomain(workspaceId: string, domain: string): Promise<void> {
    await invoke('workspaces_add_allowed_domain', { workspaceId, domain });
  }

  async removeAllowedDomain(workspaceId: string, domain: string): Promise<void> {
    await invoke('workspaces_remove_allowed_domain', { workspaceId, domain });
  }

  async addBlockedDomain(workspaceId: string, domain: string): Promise<void> {
    await invoke('workspaces_add_blocked_domain', { workspaceId, domain });
  }

  async removeBlockedDomain(workspaceId: string, domain: string): Promise<void> {
    await invoke('workspaces_remove_blocked_domain', { workspaceId, domain });
  }

  async isDomainAllowed(workspaceId: string, domain: string): Promise<boolean> {
    return invoke<boolean>('workspaces_is_domain_allowed', { workspaceId, domain });
  }

  // ==================== Snapshots ====================

  async createSnapshot(workspaceId: string, name: string): Promise<WorkspaceSnapshot> {
    const snapshot = await invoke<WorkspaceSnapshot>('workspaces_create_snapshot', { workspaceId, name });
    this.emit('snapshot-created', { workspace_id: workspaceId, data: snapshot });
    return snapshot;
  }

  async getSnapshots(workspaceId: string): Promise<WorkspaceSnapshot[]> {
    return invoke<WorkspaceSnapshot[]>('workspaces_get_snapshots', { workspaceId });
  }

  async restoreSnapshot(workspaceId: string, snapshotId: string): Promise<void> {
    await invoke('workspaces_restore_snapshot', { workspaceId, snapshotId });
    this.emit('snapshot-restored', { workspace_id: workspaceId, data: { snapshotId } });
  }

  async deleteSnapshot(workspaceId: string, snapshotId: string): Promise<void> {
    await invoke('workspaces_delete_snapshot', { workspaceId, snapshotId });
  }

  // ==================== Templates ====================

  async getTemplates(): Promise<WorkspaceTemplate[]> {
    return invoke<WorkspaceTemplate[]>('workspaces_get_templates');
  }

  async createTemplate(
    name: string,
    description: string,
    icon: WorkspaceIconType,
    color: WorkspaceColor,
    defaultTabs: string[]
  ): Promise<WorkspaceTemplate> {
    return invoke<WorkspaceTemplate>('workspaces_create_template', {
      name,
      description,
      icon,
      color,
      defaultTabs,
    });
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await invoke('workspaces_delete_template', { templateId });
  }

  // ==================== Quick Switch ====================

  async getQuickSwitchItems(): Promise<QuickSwitchItem[]> {
    return invoke<QuickSwitchItem[]>('workspaces_get_quick_switch_items');
  }

  async quickSwitchNext(): Promise<Workspace | null> {
    const workspace = await invoke<Workspace | null>('workspaces_quick_switch_next');
    if (workspace) {
      this.activeWorkspaceId = workspace.id;
      this.emit('quick-switch', { workspace_id: workspace.id, data: workspace });
    }
    return workspace;
  }

  async quickSwitchPrevious(): Promise<Workspace | null> {
    const workspace = await invoke<Workspace | null>('workspaces_quick_switch_previous');
    if (workspace) {
      this.activeWorkspaceId = workspace.id;
      this.emit('quick-switch', { workspace_id: workspace.id, data: workspace });
    }
    return workspace;
  }

  // ==================== Statistics ====================

  async getStats(): Promise<WorkspaceStats> {
    return invoke<WorkspaceStats>('workspaces_get_stats');
  }

  async resetDailyStats(): Promise<void> {
    await invoke('workspaces_reset_daily_stats');
  }

  async addTimeToWorkspace(workspaceId: string, seconds: number): Promise<void> {
    await invoke('workspaces_add_time', { workspaceId, seconds });
  }

  // ==================== Export/Import ====================

  async exportWorkspace(workspaceId: string): Promise<string> {
    return invoke<string>('workspaces_export', { workspaceId });
  }

  async importWorkspace(json: string): Promise<Workspace> {
    const workspace = await invoke<Workspace>('workspaces_import', { json });
    this.emit('workspace-created', { workspace_id: workspace.id, data: workspace });
    return workspace;
  }

  // ==================== Utility ====================

  async getAvailableIcons(): Promise<string[]> {
    return invoke<string[]>('workspaces_get_icons');
  }

  async getAvailableColors(): Promise<string[]> {
    return invoke<string[]>('workspaces_get_colors');
  }

  async getAvailableLayouts(): Promise<string[]> {
    return invoke<string[]>('workspaces_get_layouts');
  }

  async getAvailableAnimations(): Promise<string[]> {
    return invoke<string[]>('workspaces_get_animations');
  }
}

// ==================== Singleton Export ====================

export const workspacesService = new BrowserWorkspacesService();
export default workspacesService;
