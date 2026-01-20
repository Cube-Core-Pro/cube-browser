// CUBE Nexum - Extensions Manager Service
// TypeScript client for extension management

import { invoke } from '@tauri-apps/api/core';

// ==================== Types ====================

export type ExtensionSource = 
  | 'ChromeWebStore'
  | 'Firefox'
  | 'LocalFile'
  | 'Developer'
  | 'Enterprise';

export type ExtensionStatus = 
  | 'Enabled'
  | 'Disabled'
  | 'NeedsUpdate'
  | 'Error'
  | 'Installing'
  | 'Uninstalling';

export type ExtensionPermission =
  | 'ActiveTab'
  | 'Alarms'
  | 'Background'
  | 'Bookmarks'
  | 'BrowsingData'
  | 'Clipboards'
  | 'ContentSettings'
  | 'ContextMenus'
  | 'Cookies'
  | 'Debugger'
  | 'DeclarativeContent'
  | 'DeclarativeNetRequest'
  | 'DesktopCapture'
  | 'Downloads'
  | 'Enterprise'
  | 'FontSettings'
  | 'Gcm'
  | 'Geolocation'
  | 'History'
  | 'Identity'
  | 'Idle'
  | 'Management'
  | 'NativeMessaging'
  | 'Notifications'
  | 'PageCapture'
  | 'Power'
  | 'Privacy'
  | 'Proxy'
  | 'Sessions'
  | 'Storage'
  | 'System'
  | 'TabCapture'
  | 'Tabs'
  | 'TopSites'
  | 'Tts'
  | 'TtsEngine'
  | 'Unlimitedstrorage'
  | 'WebNavigation'
  | 'WebRequest'
  | 'WebRequestBlocking'
  | 'AllUrls'
  | { SpecificHosts: string[] };

export type ScriptRunAt = 'DocumentStart' | 'DocumentEnd' | 'DocumentIdle';

export interface ExtensionSettings {
  allow_developer_mode: boolean;
  auto_update: boolean;
  update_check_interval_hours: number;
  allow_incognito: boolean;
  show_access_requests: boolean;
  enterprise_policy_enabled: boolean;
  blocked_extensions: string[];
  allowed_hosts_default: string[];
}

export interface ContentScript {
  matches: string[];
  exclude_matches: string[];
  js: string[];
  css: string[];
  run_at: ScriptRunAt;
  all_frames: boolean;
}

export interface BackgroundScript {
  scripts: string[];
  persistent: boolean;
  service_worker: string | null;
}

export interface BrowserAction {
  title: string;
  icon: string | null;
  popup: string | null;
  badge_text: string | null;
  badge_color: string | null;
}

export interface PageAction {
  title: string;
  icon: string | null;
  popup: string | null;
}

export interface OptionsUI {
  page: string;
  open_in_tab: boolean;
}

export interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string | null;
  homepage: string | null;
  icon: string | null;
  icon_128: string | null;
  source: ExtensionSource;
  status: ExtensionStatus;
  permissions: ExtensionPermission[];
  optional_permissions: ExtensionPermission[];
  granted_optional_permissions: ExtensionPermission[];
  host_permissions: string[];
  content_scripts: ContentScript[];
  background_script: BackgroundScript | null;
  browser_action: BrowserAction | null;
  page_action: PageAction | null;
  options_page: string | null;
  options_ui: OptionsUI | null;
  allow_incognito: boolean;
  allow_file_access: boolean;
  is_pinned: boolean;
  is_recommended: boolean;
  install_date: string;
  last_updated: string;
  store_url: string | null;
  rating: number | null;
  users: number | null;
  size_bytes: number;
  error_message: string | null;
  metadata: Record<string, string>;
}

export interface ExtensionStats {
  total_extensions: number;
  enabled_count: number;
  disabled_count: number;
  developer_count: number;
  total_permissions: number;
  extensions_by_source: Record<string, number>;
}

export interface ExtensionUpdateInfo {
  extension_id: string;
  current_version: string;
  new_version: string;
  changelog: string | null;
  release_date: string | null;
}

export interface InstallResult {
  success: boolean;
  extension_id: string | null;
  error_message: string | null;
  new_permissions: ExtensionPermission[];
}

// ==================== Settings ====================

export async function getExtensionSettings(): Promise<ExtensionSettings> {
  return await invoke<ExtensionSettings>('extensions_get_settings');
}

export async function updateExtensionSettings(settings: ExtensionSettings): Promise<void> {
  return await invoke<void>('extensions_update_settings', { settings });
}

export async function toggleDeveloperMode(): Promise<boolean> {
  return await invoke<boolean>('extensions_toggle_developer_mode');
}

// ==================== Installation ====================

export async function installExtension(
  id: string,
  name: string,
  source: ExtensionSource
): Promise<InstallResult> {
  return await invoke<InstallResult>('extensions_install', { id, name, source });
}

export async function installFromStore(storeUrl: string): Promise<InstallResult> {
  return await invoke<InstallResult>('extensions_install_from_store', { storeUrl });
}

export async function uninstallExtension(id: string): Promise<void> {
  return await invoke<void>('extensions_uninstall', { id });
}

// ==================== Enable/Disable ====================

export async function enableExtension(id: string): Promise<void> {
  return await invoke<void>('extensions_enable', { id });
}

export async function disableExtension(id: string): Promise<void> {
  return await invoke<void>('extensions_disable', { id });
}

export async function toggleExtension(id: string): Promise<ExtensionStatus> {
  return await invoke<ExtensionStatus>('extensions_toggle', { id });
}

// ==================== Query ====================

export async function getExtension(id: string): Promise<Extension | null> {
  return await invoke<Extension | null>('extensions_get', { id });
}

export async function getAllExtensions(): Promise<Extension[]> {
  return await invoke<Extension[]>('extensions_get_all');
}

export async function getEnabledExtensions(): Promise<Extension[]> {
  return await invoke<Extension[]>('extensions_get_enabled');
}

export async function getDisabledExtensions(): Promise<Extension[]> {
  return await invoke<Extension[]>('extensions_get_disabled');
}

export async function getRecommendedExtensions(): Promise<Extension[]> {
  return await invoke<Extension[]>('extensions_get_recommended');
}

export async function searchExtensions(query: string): Promise<Extension[]> {
  return await invoke<Extension[]>('extensions_search', { query });
}

// ==================== Permissions ====================

export async function getExtensionPermissions(id: string): Promise<ExtensionPermission[]> {
  return await invoke<ExtensionPermission[]>('extensions_get_permissions', { id });
}

export async function grantPermission(id: string, permission: ExtensionPermission): Promise<void> {
  return await invoke<void>('extensions_grant_permission', { id, permission });
}

export async function revokePermission(id: string, permission: ExtensionPermission): Promise<void> {
  return await invoke<void>('extensions_revoke_permission', { id, permission });
}

export async function setIncognitoAccess(id: string, allow: boolean): Promise<void> {
  return await invoke<void>('extensions_set_incognito_access', { id, allow });
}

export async function setFileAccess(id: string, allow: boolean): Promise<void> {
  return await invoke<void>('extensions_set_file_access', { id, allow });
}

// ==================== Pinning ====================

export async function toggleExtensionPin(id: string): Promise<boolean> {
  return await invoke<boolean>('extensions_toggle_pin', { id });
}

export async function getPinnedExtensions(): Promise<Extension[]> {
  return await invoke<Extension[]>('extensions_get_pinned');
}

// ==================== Updates ====================

export async function checkForUpdates(): Promise<ExtensionUpdateInfo[]> {
  return await invoke<ExtensionUpdateInfo[]>('extensions_check_updates');
}

export async function updateExtension(id: string): Promise<void> {
  return await invoke<void>('extensions_update', { id });
}

export async function updateAllExtensions(): Promise<number> {
  return await invoke<number>('extensions_update_all');
}

// ==================== Statistics ====================

export async function getExtensionStats(): Promise<ExtensionStats> {
  return await invoke<ExtensionStats>('extensions_get_stats');
}

export async function getExtensionCount(): Promise<number> {
  return await invoke<number>('extensions_get_count');
}

export async function getEnabledCount(): Promise<number> {
  return await invoke<number>('extensions_get_enabled_count');
}

// ==================== Import/Export ====================

export async function exportExtensions(): Promise<string> {
  return await invoke<string>('extensions_export');
}

export async function importExtensions(json: string): Promise<number> {
  return await invoke<number>('extensions_import', { json });
}

// ==================== Utility ====================

export async function getExtensionList(): Promise<string[]> {
  return await invoke<string[]>('extensions_get_list');
}

// ==================== Batch ====================

export async function batchEnableExtensions(ids: string[]): Promise<number> {
  return await invoke<number>('extensions_batch_enable', { ids });
}

export async function batchDisableExtensions(ids: string[]): Promise<number> {
  return await invoke<number>('extensions_batch_disable', { ids });
}

export async function batchUninstallExtensions(ids: string[]): Promise<number> {
  return await invoke<number>('extensions_batch_uninstall', { ids });
}

// ==================== Chrome Web Store ====================

export async function searchStore(query: string): Promise<Extension[]> {
  return await invoke<Extension[]>('extensions_search_store', { query });
}

export async function getStoreDetails(extensionId: string): Promise<Extension | null> {
  return await invoke<Extension | null>('extensions_get_store_details', { extensionId });
}

// ==================== Helpers ====================

export function getPermissionDescription(permission: ExtensionPermission): string {
  const descriptions: Record<string, string> = {
    ActiveTab: 'Access the currently active tab',
    Alarms: 'Schedule periodic tasks',
    Background: 'Run in the background',
    Bookmarks: 'Read and modify your bookmarks',
    BrowsingData: 'Clear browsing data',
    Clipboards: 'Access clipboard data',
    ContentSettings: 'Change content settings',
    ContextMenus: 'Add items to context menus',
    Cookies: 'Read and modify cookies',
    Debugger: 'Access the Chrome debugger',
    DeclarativeContent: 'Modify page content declaratively',
    DeclarativeNetRequest: 'Block and modify network requests',
    DesktopCapture: 'Capture screen content',
    Downloads: 'Manage downloads',
    FontSettings: 'Modify font settings',
    Geolocation: 'Access your location',
    History: 'Read and modify browsing history',
    Identity: 'Access your Google account',
    Idle: 'Detect when the machine is idle',
    Management: 'Manage other extensions',
    NativeMessaging: 'Communicate with native applications',
    Notifications: 'Show notifications',
    PageCapture: 'Save complete web pages',
    Power: 'Override power management',
    Privacy: 'Change privacy settings',
    Proxy: 'Manage proxy settings',
    Sessions: 'Access recently closed tabs',
    Storage: 'Store data locally',
    TabCapture: 'Capture tab content',
    Tabs: 'Access browser tabs',
    TopSites: 'Access frequently visited sites',
    Tts: 'Text-to-speech',
    WebNavigation: 'Monitor navigation events',
    WebRequest: 'Observe and analyze network traffic',
    WebRequestBlocking: 'Block or modify network requests',
    AllUrls: 'Access all websites',
  };
  
  if (typeof permission === 'string') {
    return descriptions[permission] || permission;
  }
  
  return `Access specific hosts: ${(permission as { SpecificHosts: string[] }).SpecificHosts.join(', ')}`;
}

export function formatPermissionLevel(extension: Extension): 'low' | 'medium' | 'high' {
  const highRiskPermissions = [
    'AllUrls',
    'WebRequestBlocking',
    'NativeMessaging',
    'Debugger',
    'DesktopCapture',
    'TabCapture',
    'History',
    'Cookies',
    'BrowsingData',
  ];
  
  const mediumRiskPermissions = [
    'Tabs',
    'Storage',
    'WebRequest',
    'Bookmarks',
    'Downloads',
    'Notifications',
  ];
  
  const hasHighRisk = extension.permissions.some(p => 
    typeof p === 'string' && highRiskPermissions.includes(p)
  );
  
  const hasMediumRisk = extension.permissions.some(p => 
    typeof p === 'string' && mediumRiskPermissions.includes(p)
  );
  
  if (hasHighRisk) return 'high';
  if (hasMediumRisk) return 'medium';
  return 'low';
}

export function groupExtensionsBySource(extensions: Extension[]): Map<ExtensionSource, Extension[]> {
  const groups = new Map<ExtensionSource, Extension[]>();
  
  for (const ext of extensions) {
    if (!groups.has(ext.source)) {
      groups.set(ext.source, []);
    }
    groups.get(ext.source)!.push(ext);
  }
  
  return groups;
}

export function sortExtensions(
  extensions: Extension[],
  sortBy: 'name' | 'rating' | 'users' | 'updated' | 'installed'
): Extension[] {
  const sorted = [...extensions];
  
  switch (sortBy) {
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'rating':
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'users':
      sorted.sort((a, b) => (b.users || 0) - (a.users || 0));
      break;
    case 'updated':
      sorted.sort((a, b) => 
        new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      );
      break;
    case 'installed':
      sorted.sort((a, b) => 
        new Date(b.install_date).getTime() - new Date(a.install_date).getTime()
      );
      break;
  }
  
  return sorted;
}

// ==================== Export All ====================

export const extensionsService = {
  // Settings
  getSettings: getExtensionSettings,
  updateSettings: updateExtensionSettings,
  toggleDeveloperMode,
  
  // Installation
  install: installExtension,
  installFromStore,
  uninstall: uninstallExtension,
  
  // Enable/Disable
  enable: enableExtension,
  disable: disableExtension,
  toggle: toggleExtension,
  
  // Query
  get: getExtension,
  getAll: getAllExtensions,
  getEnabled: getEnabledExtensions,
  getDisabled: getDisabledExtensions,
  getRecommended: getRecommendedExtensions,
  search: searchExtensions,
  
  // Permissions
  getPermissions: getExtensionPermissions,
  grantPermission,
  revokePermission,
  setIncognitoAccess,
  setFileAccess,
  
  // Pinning
  togglePin: toggleExtensionPin,
  getPinned: getPinnedExtensions,
  
  // Updates
  checkForUpdates,
  update: updateExtension,
  updateAll: updateAllExtensions,
  
  // Stats
  getStats: getExtensionStats,
  getCount: getExtensionCount,
  getEnabledCount,
  
  // Import/Export
  export: exportExtensions,
  import: importExtensions,
  
  // Utility
  getList: getExtensionList,
  
  // Batch
  batchEnable: batchEnableExtensions,
  batchDisable: batchDisableExtensions,
  batchUninstall: batchUninstallExtensions,
  
  // Store
  searchStore,
  getStoreDetails,
  
  // Helpers
  getPermissionDescription,
  formatPermissionLevel,
  groupBySource: groupExtensionsBySource,
  sort: sortExtensions,
};
