/**
 * CEF Browser Service
 * 
 * TypeScript service for interacting with the CEF (Chromium Embedded Framework)
 * browser engine through Tauri commands.
 * 
 * This provides a complete browser engine with:
 * - Full Chromium support
 * - Widevine DRM (Netflix, Disney+, etc.)
 * - All video codecs (VP9, H.264, AV1)
 * - Chrome extension compatibility
 * - Complete cookie/session control
 * - Custom tab architecture
 * 
 * @module cef-browser-service
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

// ===== Type Definitions =====

/**
 * Unique identifier for a browser tab
 */
export type TabId = string;

/**
 * Security state of a page
 */
export type SecurityState = 'None' | 'Secure' | 'Warning' | 'Insecure' | 'Unknown';

/**
 * Same-site cookie policy
 */
export type SameSitePolicy = 'None' | 'Lax' | 'Strict';

/**
 * Screenshot format
 */
export type ScreenshotFormat = 'Png' | 'Jpeg' | 'Webp';

/**
 * Information about a browser tab
 */
export interface TabInfo {
  /** Unique identifier for this tab */
  id: TabId;
  
  /** Current URL of the tab */
  url: string;
  
  /** Page title */
  title: string;
  
  /** Favicon URL or data URI */
  favicon: string | null;
  
  /** Whether the tab is currently loading */
  loading: boolean;
  
  /** Whether the tab can navigate back */
  can_go_back: boolean;
  
  /** Whether the tab can navigate forward */
  can_go_forward: boolean;
  
  /** Security state of the current page */
  security: SecurityState;
  
  /** Whether the tab is muted */
  muted: boolean;
  
  /** Whether audio is playing */
  audible: boolean;
  
  /** Whether the tab is pinned */
  pinned: boolean;
  
  /** Tab creation time (Unix timestamp) */
  created_at: number;
  
  /** Last activity time (Unix timestamp) */
  last_accessed: number;
}

/**
 * Result of JavaScript execution
 */
export interface ScriptResult {
  /** Whether execution succeeded */
  success: boolean;
  
  /** Return value (JSON stringified) */
  value: string | null;
  
  /** Error message if failed */
  error: string | null;
  
  /** Execution time in milliseconds */
  execution_time_ms: number;
}

/**
 * Cookie information
 */
export interface CookieInfo {
  /** Cookie name */
  name: string;
  
  /** Cookie value */
  value: string;
  
  /** Domain */
  domain: string;
  
  /** Path */
  path: string;
  
  /** Expiration time (Unix timestamp) */
  expires: number | null;
  
  /** HttpOnly flag */
  http_only: boolean;
  
  /** Secure flag */
  secure: boolean;
  
  /** SameSite policy */
  same_site: SameSitePolicy;
}

/**
 * Browser settings
 */
export interface BrowserSettings {
  /** Enable JavaScript */
  javascript_enabled: boolean;
  
  /** Enable WebGL */
  webgl_enabled: boolean;
  
  /** Enable local storage */
  local_storage_enabled: boolean;
  
  /** Enable databases (IndexedDB) */
  databases_enabled: boolean;
  
  /** Enable plugins */
  plugins_enabled: boolean;
  
  /** Enable images */
  images_enabled: boolean;
  
  /** Default zoom level (1.0 = 100%) */
  default_zoom: number;
  
  /** User agent string (null = default) */
  user_agent: string | null;
  
  /** Accept-Language header */
  accept_language: string | null;
  
  /** Enable developer tools */
  devtools_enabled: boolean;
  
  /** Enable remote debugging */
  remote_debugging: boolean;
  
  /** Remote debugging port */
  remote_debugging_port: number;
  
  /** Cache path */
  cache_path: string | null;
  
  /** Maximum cache size in bytes */
  max_cache_size: number | null;
  
  /** Enable Widevine CDM (DRM) */
  widevine_enabled: boolean;
}

/**
 * Browser event types
 */
export interface BrowserEvents {
  'cef:title-changed': { tab_id: TabId; title: string };
  'cef:url-changed': { tab_id: TabId; url: string };
  'cef:loading-changed': { tab_id: TabId; loading: boolean };
  'cef:favicon-changed': { tab_id: TabId; favicon: string };
  'cef:load-complete': { tab_id: TabId };
  'cef:load-failed': { tab_id: TabId; error_code: number; error_text: string };
  'cef:console-message': { tab_id: TabId; level: string; message: string; source: string; line: number };
  'cef:download-started': { download: DownloadInfo };
  'cef:download-progress': { download_id: string; received_bytes: number };
  'cef:download-complete': { download_id: string; file_path: string };
  'cef:new-window-requested': { tab_id: TabId; target_url: string };
  'cef:context-menu-requested': { tab_id: TabId; x: number; y: number; selection: string | null };
  'cef:find-results': { tab_id: TabId; count: number; active_index: number };
  'cef:audio-state-changed': { tab_id: TabId; audible: boolean };
  'cef:security-changed': { tab_id: TabId; security: SecurityState };
}

/**
 * Download information
 */
export interface DownloadInfo {
  /** Unique download ID */
  id: string;
  
  /** Source URL */
  url: string;
  
  /** Suggested filename */
  filename: string;
  
  /** MIME type */
  mime_type: string;
  
  /** Total size in bytes (if known) */
  total_bytes: number | null;
  
  /** Received bytes */
  received_bytes: number;
  
  /** Download state */
  state: 'InProgress' | 'Complete' | 'Cancelled' | 'Failed' | 'Paused';
  
  /** Local file path (when complete) */
  file_path: string | null;
}

// ===== CEF Browser Service =====

/**
 * CEF Browser Service
 * 
 * Singleton service that manages the CEF browser engine and provides
 * a high-level API for browser operations.
 * 
 * @example
 * ```typescript
 * const browser = CEFBrowserService.getInstance();
 * 
 * // Initialize the browser engine
 * await browser.initialize();
 * 
 * // Create a new tab
 * const tabId = await browser.createTab('https://youtube.com');
 * 
 * // Navigate
 * await browser.navigate(tabId, 'https://netflix.com');
 * 
 * // Execute JavaScript
 * const result = await browser.executeScript(tabId, 'document.title');
 * 
 * // Close tab
 * await browser.closeTab(tabId);
 * ```
 */
export class CEFBrowserService {
  private static instance: CEFBrowserService | null = null;
  private initialized: boolean = false;
  private tabs: Map<TabId, TabInfo> = new Map();
  private eventListeners: Map<string, UnlistenFn[]> = new Map();
  private tabChangeCallbacks: Set<(tabs: TabInfo[]) => void> = new Set();
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): CEFBrowserService {
    if (!CEFBrowserService.instance) {
      CEFBrowserService.instance = new CEFBrowserService();
    }
    return CEFBrowserService.instance;
  }
  
  // ===== Initialization =====
  
  /**
   * Initialize the CEF browser engine
   * 
   * Must be called before any other operations.
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('CEF Browser Service already initialized');
      return;
    }
    
    try {
      await invoke('cef_initialize');
      await this.subscribeToEvents();
      this.initialized = true;
      console.log('CEF Browser Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize CEF Browser Service:', error);
      throw error;
    }
  }
  
  /**
   * Check if the service is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Subscribe to browser events
   */
  private async subscribeToEvents(): Promise<void> {
    const events: Array<keyof BrowserEvents> = [
      'cef:title-changed',
      'cef:url-changed',
      'cef:loading-changed',
      'cef:favicon-changed',
      'cef:load-complete',
      'cef:load-failed',
      'cef:console-message',
      'cef:download-started',
      'cef:download-progress',
      'cef:download-complete',
      'cef:new-window-requested',
      'cef:context-menu-requested',
      'cef:find-results',
      'cef:audio-state-changed',
      'cef:security-changed',
    ];
    
    for (const eventName of events) {
      const unlisten = await listen(eventName, (event) => {
        this.handleEvent(eventName, event.payload);
      });
      
      const listeners = this.eventListeners.get(eventName) || [];
      listeners.push(unlisten);
      this.eventListeners.set(eventName, listeners);
    }
  }
  
  /**
   * Handle browser events
   */
  private handleEvent(eventName: string, payload: unknown): void {
    const data = payload as Record<string, unknown>;
    const tabId = data.tab_id as TabId | undefined;
    
    if (tabId && this.tabs.has(tabId)) {
      const tab = this.tabs.get(tabId)!;
      
      switch (eventName) {
        case 'cef:title-changed':
          tab.title = data.title as string;
          break;
        case 'cef:url-changed':
          tab.url = data.url as string;
          break;
        case 'cef:loading-changed':
          tab.loading = data.loading as boolean;
          break;
        case 'cef:favicon-changed':
          tab.favicon = data.favicon as string;
          break;
        case 'cef:audio-state-changed':
          tab.audible = data.audible as boolean;
          break;
        case 'cef:security-changed':
          tab.security = data.security as SecurityState;
          break;
      }
      
      this.notifyTabChange();
    }
  }
  
  /**
   * Notify tab change subscribers
   */
  private notifyTabChange(): void {
    const tabs = Array.from(this.tabs.values());
    this.tabChangeCallbacks.forEach(callback => callback(tabs));
  }
  
  /**
   * Subscribe to tab changes
   */
  public onTabsChange(callback: (tabs: TabInfo[]) => void): () => void {
    this.tabChangeCallbacks.add(callback);
    return () => this.tabChangeCallbacks.delete(callback);
  }
  
  // ===== Tab Management =====
  
  /**
   * Create a new browser tab
   * 
   * @param url - Initial URL (default: about:blank)
   * @returns Tab ID
   */
  public async createTab(url: string = 'about:blank'): Promise<TabId> {
    const tabId = await invoke<TabId>('cef_create_tab', { url });
    
    const tabInfo: TabInfo = {
      id: tabId,
      url,
      title: 'Loading...',
      favicon: null,
      loading: true,
      can_go_back: false,
      can_go_forward: false,
      security: url.startsWith('https://') ? 'Secure' : 'None',
      muted: false,
      audible: false,
      pinned: false,
      created_at: Date.now(),
      last_accessed: Date.now(),
    };
    
    this.tabs.set(tabId, tabInfo);
    this.notifyTabChange();
    
    return tabId;
  }
  
  /**
   * Close a browser tab
   * 
   * @param tabId - Tab ID to close
   */
  public async closeTab(tabId: TabId): Promise<void> {
    await invoke('cef_close_tab', { tabId });
    this.tabs.delete(tabId);
    this.notifyTabChange();
  }
  
  /**
   * Get tab information
   * 
   * @param tabId - Tab ID
   * @returns Tab information
   */
  public async getTabInfo(tabId: TabId): Promise<TabInfo> {
    const info = await invoke<TabInfo>('cef_get_tab_info', { tabId });
    this.tabs.set(tabId, info);
    return info;
  }
  
  /**
   * Get all tab IDs
   */
  public async getTabIds(): Promise<TabId[]> {
    return invoke<TabId[]>('cef_get_tab_ids');
  }
  
  /**
   * Get all tabs
   */
  public async getAllTabs(): Promise<TabInfo[]> {
    const tabs = await invoke<TabInfo[]>('cef_get_all_tabs');
    this.tabs.clear();
    tabs.forEach(tab => this.tabs.set(tab.id, tab));
    return tabs;
  }
  
  /**
   * Get cached tabs (synchronous)
   */
  public getCachedTabs(): TabInfo[] {
    return Array.from(this.tabs.values());
  }
  
  // ===== Navigation =====
  
  /**
   * Navigate to a URL
   * 
   * @param tabId - Tab ID
   * @param url - URL to navigate to
   */
  public async navigate(tabId: TabId, url: string): Promise<void> {
    await invoke('cef_navigate', { tabId, url });
    
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.url = url;
      tab.loading = true;
      tab.last_accessed = Date.now();
      this.notifyTabChange();
    }
  }
  
  /**
   * Get current URL
   * 
   * @param tabId - Tab ID
   * @returns Current URL
   */
  public async getUrl(tabId: TabId): Promise<string> {
    return invoke<string>('cef_get_url', { tabId });
  }
  
  /**
   * Go back in history
   * 
   * @param tabId - Tab ID
   * @returns Whether navigation occurred
   */
  public async goBack(tabId: TabId): Promise<boolean> {
    return invoke<boolean>('cef_go_back', { tabId });
  }
  
  /**
   * Go forward in history
   * 
   * @param tabId - Tab ID
   * @returns Whether navigation occurred
   */
  public async goForward(tabId: TabId): Promise<boolean> {
    return invoke<boolean>('cef_go_forward', { tabId });
  }
  
  /**
   * Reload the page
   * 
   * @param tabId - Tab ID
   * @param ignoreCache - Whether to bypass cache
   */
  public async reload(tabId: TabId, ignoreCache: boolean = false): Promise<void> {
    await invoke('cef_reload', { tabId, ignoreCache });
    
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.loading = true;
      this.notifyTabChange();
    }
  }
  
  /**
   * Stop loading
   * 
   * @param tabId - Tab ID
   */
  public async stop(tabId: TabId): Promise<void> {
    await invoke('cef_stop', { tabId });
    
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.loading = false;
      this.notifyTabChange();
    }
  }
  
  // ===== JavaScript Execution =====
  
  /**
   * Execute JavaScript in a tab
   * 
   * @param tabId - Tab ID
   * @param script - JavaScript code
   * @returns Execution result
   */
  public async executeScript(tabId: TabId, script: string): Promise<ScriptResult> {
    return invoke<ScriptResult>('cef_execute_script', { tabId, script });
  }
  
  /**
   * Execute JavaScript and parse result
   * 
   * @param tabId - Tab ID
   * @param script - JavaScript code
   * @returns Parsed result
   */
  public async executeScriptParsed<T>(tabId: TabId, script: string): Promise<T | null> {
    const result = await this.executeScript(tabId, script);
    if (result.success && result.value) {
      try {
        return JSON.parse(result.value) as T;
      } catch {
        return result.value as unknown as T;
      }
    }
    return null;
  }
  
  // ===== Cookie Management =====
  
  /**
   * Get cookies for a domain
   * 
   * @param domain - Domain
   * @returns Cookies
   */
  public async getCookies(domain: string): Promise<CookieInfo[]> {
    return invoke<CookieInfo[]>('cef_get_cookies', { domain });
  }
  
  /**
   * Set a cookie
   * 
   * @param cookie - Cookie info
   */
  public async setCookie(cookie: CookieInfo): Promise<void> {
    await invoke('cef_set_cookie', { cookie });
  }
  
  /**
   * Delete cookies
   * 
   * @param url - URL for filtering
   * @param cookieName - Optional specific cookie name
   * @returns Number deleted
   */
  public async deleteCookies(url: string, cookieName?: string): Promise<number> {
    return invoke<number>('cef_delete_cookies', { url, cookieName });
  }
  
  // ===== Page Actions =====
  
  /**
   * Set zoom level
   * 
   * @param tabId - Tab ID
   * @param zoomLevel - Zoom level (1.0 = 100%)
   */
  public async setZoom(tabId: TabId, zoomLevel: number): Promise<void> {
    await invoke('cef_set_zoom', { tabId, zoomLevel });
  }
  
  /**
   * Toggle mute
   * 
   * @param tabId - Tab ID
   * @returns New mute state
   */
  public async toggleMute(tabId: TabId): Promise<boolean> {
    const muted = await invoke<boolean>('cef_toggle_mute', { tabId });
    
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.muted = muted;
      this.notifyTabChange();
    }
    
    return muted;
  }
  
  /**
   * Find text in page
   * 
   * @param tabId - Tab ID
   * @param text - Search text
   * @param options - Find options
   */
  public async find(
    tabId: TabId,
    text: string,
    options?: { matchCase?: boolean; forward?: boolean; findNext?: boolean }
  ): Promise<void> {
    await invoke('cef_find', {
      tabId,
      text,
      matchCase: options?.matchCase,
      forward: options?.forward,
      findNext: options?.findNext,
    });
  }
  
  /**
   * Stop finding
   * 
   * @param tabId - Tab ID
   * @param clearSelection - Whether to clear selection
   */
  public async stopFinding(tabId: TabId, clearSelection: boolean = true): Promise<void> {
    await invoke('cef_stop_finding', { tabId, clearSelection });
  }
  
  // ===== Developer Tools =====
  
  /**
   * Open DevTools
   * 
   * @param tabId - Tab ID
   */
  public async openDevTools(tabId: TabId): Promise<void> {
    await invoke('cef_open_devtools', { tabId });
  }
  
  /**
   * Close DevTools
   * 
   * @param tabId - Tab ID
   */
  public async closeDevTools(tabId: TabId): Promise<void> {
    await invoke('cef_close_devtools', { tabId });
  }
  
  // ===== Screenshots & Printing =====
  
  /**
   * Take a screenshot
   * 
   * @param tabId - Tab ID
   * @param options - Screenshot options
   * @returns Screenshot as Uint8Array
   */
  public async takeScreenshot(
    tabId: TabId,
    options?: { format?: ScreenshotFormat; quality?: number; fullPage?: boolean }
  ): Promise<Uint8Array> {
    const data = await invoke<number[]>('cef_take_screenshot', {
      tabId,
      format: options?.format?.toLowerCase(),
      quality: options?.quality,
      fullPage: options?.fullPage,
    });
    return new Uint8Array(data);
  }
  
  /**
   * Print to PDF
   * 
   * @param tabId - Tab ID
   * @param options - Print options
   * @returns PDF as Uint8Array
   */
  public async printToPDF(
    tabId: TabId,
    options?: { pdfPath?: string; landscape?: boolean }
  ): Promise<Uint8Array | null> {
    const data = await invoke<number[] | null>('cef_print_to_pdf', {
      tabId,
      pdfPath: options?.pdfPath,
      landscape: options?.landscape,
    });
    return data ? new Uint8Array(data) : null;
  }
  
  // ===== Settings =====
  
  /**
   * Get browser settings
   */
  public async getSettings(): Promise<BrowserSettings> {
    return invoke<BrowserSettings>('cef_get_settings');
  }
  
  /**
   * Update browser settings
   * 
   * @param settings - New settings
   */
  public async updateSettings(settings: Partial<BrowserSettings>): Promise<void> {
    const current = await this.getSettings();
    await invoke('cef_update_settings', { settings: { ...current, ...settings } });
  }
  
  // ===== Cleanup =====
  
  /**
   * Cleanup and unsubscribe from events
   */
  public async cleanup(): Promise<void> {
    // Unsubscribe from all events
    for (const listeners of this.eventListeners.values()) {
      for (const unlisten of listeners) {
        unlisten();
      }
    }
    this.eventListeners.clear();
    this.tabChangeCallbacks.clear();
    this.tabs.clear();
    this.initialized = false;
  }
}

// ===== Convenience Exports =====

/**
 * Get the CEF browser service instance
 */
export function getCEFBrowser(): CEFBrowserService {
  return CEFBrowserService.getInstance();
}

/**
 * Default export
 */
export default CEFBrowserService;
