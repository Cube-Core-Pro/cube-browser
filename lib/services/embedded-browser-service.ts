// Embedded Browser Service - Frontend bindings for tabbed webview browser
// This service communicates with the Rust backend to manage browser tabs
// that appear as embedded windows within the main Tauri application

import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export interface EmbeddedTab {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isVisible: boolean;
  webviewLabel: string;
}

export interface EmbeddedTabBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EmbeddedBrowserService {
  // Tab Management
  createTab: (tabId: string, url: string, bounds: EmbeddedTabBounds) => Promise<EmbeddedTab>;
  closeTab: (tabId: string) => Promise<void>;
  closeAllTabs: () => Promise<void>;
  switchTab: (tabId: string) => Promise<void>;
  getTabs: () => Promise<EmbeddedTab[]>;
  getActiveTab: () => Promise<string | null>;
  
  // Navigation
  navigate: (tabId: string, url: string) => Promise<void>;
  goBack: (tabId: string) => Promise<void>;
  goForward: (tabId: string) => Promise<void>;
  reload: (tabId: string) => Promise<void>;
  stop: (tabId: string) => Promise<void>;
  
  // Tab Info
  getUrl: (tabId: string) => Promise<string>;
  updateTabInfo: (tabId: string, info: Partial<EmbeddedTab>) => Promise<void>;
  updateBounds: (tabId: string, bounds: EmbeddedTabBounds) => Promise<void>;
  
  // Script Execution
  executeScript: (tabId: string, script: string) => Promise<void>;
  
  // Events
  onTabCreated: (callback: (tab: EmbeddedTab) => void) => Promise<UnlistenFn>;
  onTabClosed: (callback: (data: { tabId: string }) => void) => Promise<UnlistenFn>;
  onTabUpdated: (callback: (tab: EmbeddedTab) => void) => Promise<UnlistenFn>;
  onTabSwitched: (callback: (data: { tabId: string }) => void) => Promise<UnlistenFn>;
  onAllTabsClosed: (callback: () => void) => Promise<UnlistenFn>;
}

/**
 * Create a new browser tab with embedded webview
 */
export async function createEmbeddedTab(
  tabId: string,
  url: string,
  bounds: EmbeddedTabBounds
): Promise<EmbeddedTab> {
  const result = await invoke<EmbeddedTab>('embedded_create_tab', {
    tabId,
    url,
    bounds,
  });
  return result;
}

/**
 * Navigate a tab to a URL
 */
export async function navigateEmbeddedTab(tabId: string, url: string): Promise<void> {
  await invoke('embedded_navigate', { tabId, url });
}

/**
 * Close a browser tab
 */
export async function closeEmbeddedTab(tabId: string): Promise<void> {
  await invoke('embedded_close_tab', { tabId });
}

/**
 * Close all browser tabs
 */
export async function closeAllEmbeddedTabs(): Promise<void> {
  await invoke('embedded_close_all_tabs');
}

/**
 * Switch to a different tab
 */
export async function switchEmbeddedTab(tabId: string): Promise<void> {
  await invoke('embedded_switch_tab', { tabId });
}

/**
 * Update tab position and size
 */
export async function updateEmbeddedTabBounds(
  tabId: string,
  bounds: EmbeddedTabBounds
): Promise<void> {
  await invoke('embedded_update_bounds', { tabId, bounds });
}

/**
 * Go back in history
 */
export async function goBackEmbedded(tabId: string): Promise<void> {
  await invoke('embedded_go_back', { tabId });
}

/**
 * Go forward in history
 */
export async function goForwardEmbedded(tabId: string): Promise<void> {
  await invoke('embedded_go_forward', { tabId });
}

/**
 * Reload page
 */
export async function reloadEmbedded(tabId: string): Promise<void> {
  await invoke('embedded_reload', { tabId });
}

/**
 * Stop loading
 */
export async function stopEmbedded(tabId: string): Promise<void> {
  await invoke('embedded_stop', { tabId });
}

/**
 * Get all tabs
 */
export async function getEmbeddedTabs(): Promise<EmbeddedTab[]> {
  return await invoke<EmbeddedTab[]>('embedded_get_tabs');
}

/**
 * Get active tab ID
 */
export async function getActiveEmbeddedTab(): Promise<string | null> {
  return await invoke<string | null>('embedded_get_active_tab');
}

/**
 * Execute JavaScript in a tab
 */
export async function executeEmbeddedScript(tabId: string, script: string): Promise<void> {
  await invoke('embedded_execute_script', { tabId, script });
}

/**
 * Get current URL
 */
export async function getEmbeddedUrl(tabId: string): Promise<string> {
  return await invoke<string>('embedded_get_url', { tabId });
}

/**
 * Update tab info
 */
export async function updateEmbeddedTabInfo(
  tabId: string,
  title?: string,
  url?: string,
  favicon?: string,
  isLoading?: boolean
): Promise<void> {
  await invoke('embedded_update_tab_info', {
    tabId,
    title,
    url,
    favicon,
    isLoading,
  });
}

// Event listeners
export async function onEmbeddedTabCreated(
  callback: (tab: EmbeddedTab) => void
): Promise<UnlistenFn> {
  return await listen<EmbeddedTab>('embedded-tab-created', (event) => {
    callback(event.payload);
  });
}

export async function onEmbeddedTabClosed(
  callback: (data: { tabId: string }) => void
): Promise<UnlistenFn> {
  return await listen<{ tabId: string }>('embedded-tab-closed', (event) => {
    callback(event.payload);
  });
}

export async function onEmbeddedTabUpdated(
  callback: (tab: EmbeddedTab) => void
): Promise<UnlistenFn> {
  return await listen<EmbeddedTab>('embedded-tab-updated', (event) => {
    callback(event.payload);
  });
}

export async function onEmbeddedTabSwitched(
  callback: (data: { tabId: string }) => void
): Promise<UnlistenFn> {
  return await listen<{ tabId: string }>('embedded-tab-switched', (event) => {
    callback(event.payload);
  });
}

export async function onAllEmbeddedTabsClosed(
  callback: () => void
): Promise<UnlistenFn> {
  return await listen('embedded-all-tabs-closed', () => {
    callback();
  });
}

/**
 * Factory function to create a service instance
 */
export function createEmbeddedBrowserService(): EmbeddedBrowserService {
  return {
    createTab: createEmbeddedTab,
    closeTab: closeEmbeddedTab,
    closeAllTabs: closeAllEmbeddedTabs,
    switchTab: switchEmbeddedTab,
    getTabs: getEmbeddedTabs,
    getActiveTab: getActiveEmbeddedTab,
    navigate: navigateEmbeddedTab,
    goBack: goBackEmbedded,
    goForward: goForwardEmbedded,
    reload: reloadEmbedded,
    stop: stopEmbedded,
    getUrl: getEmbeddedUrl,
    updateTabInfo: async (tabId, info) => {
      await updateEmbeddedTabInfo(
        tabId,
        info.title,
        info.url,
        info.favicon ?? undefined,
        info.isLoading
      );
    },
    updateBounds: updateEmbeddedTabBounds,
    executeScript: executeEmbeddedScript,
    onTabCreated: onEmbeddedTabCreated,
    onTabClosed: onEmbeddedTabClosed,
    onTabUpdated: onEmbeddedTabUpdated,
    onTabSwitched: onEmbeddedTabSwitched,
    onAllTabsClosed: onAllEmbeddedTabsClosed,
  };
}

// Default export
export default createEmbeddedBrowserService;
