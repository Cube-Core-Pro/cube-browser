/**
 * Hybrid Browser Service
 * 
 * This service provides a unified API for browser operations, automatically
 * using CEF (Chromium Embedded Framework) when available, and falling back
 * to the proxy-based iframe approach when CEF is not available.
 * 
 * Architecture:
 * - In release builds: CEF is available → Full browser engine with DRM support
 * - In debug builds: CEF may fail → Falls back to proxy-based iframes
 * 
 * @module hybrid-browser-service
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { CEFBrowserService, TabInfo as CEFTabInfo } from './cef-browser-service';

// ===== Type Definitions =====

export interface HybridTabInfo {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  security: 'secure' | 'insecure' | 'unknown';
  muted: boolean;
  audible: boolean;
  pinned: boolean;
  mode: 'cef' | 'proxy'; // Which engine is rendering this tab
}

export type BrowserMode = 'cef' | 'proxy' | 'auto';

export interface BrowserCapabilities {
  cefAvailable: boolean;
  drmSupport: boolean;
  extensionSupport: boolean;
  fullCodecSupport: boolean;
  proxyFallback: boolean;
}

// ===== Event Types =====

export interface HybridBrowserEvents {
  'tab:created': { tabId: string; url: string; mode: 'cef' | 'proxy' };
  'tab:closed': { tabId: string };
  'tab:url-changed': { tabId: string; url: string };
  'tab:title-changed': { tabId: string; title: string };
  'tab:loading-changed': { tabId: string; loading: boolean };
  'tab:favicon-changed': { tabId: string; favicon: string };
  'mode:changed': { tabId: string; previousMode: 'cef' | 'proxy'; newMode: 'cef' | 'proxy' };
  'cef:initialized': { success: boolean; error?: string };
  'cef:unavailable': { reason: string };
}

// ===== Hybrid Browser Service =====

/**
 * Hybrid Browser Service
 * 
 * Automatically detects CEF availability and provides a unified API
 * for browser operations, regardless of the underlying engine.
 * 
 * @example
 * ```typescript
 * const browser = HybridBrowserService.getInstance();
 * 
 * // Initialize (auto-detects CEF)
 * await browser.initialize();
 * 
 * // Check capabilities
 * const caps = browser.getCapabilities();
 * console.log('CEF available:', caps.cefAvailable);
 * 
 * // Create tab (uses CEF if available, proxy otherwise)
 * const tabId = await browser.createTab('https://youtube.com');
 * 
 * // Navigate
 * await browser.navigate(tabId, 'https://netflix.com');
 * ```
 */
export class HybridBrowserService {
  private static instance: HybridBrowserService | null = null;
  
  private cefService: CEFBrowserService;
  private cefAvailable: boolean = false;
  private cefInitialized: boolean = false;
  private initialized: boolean = false;
  
  private tabs: Map<string, HybridTabInfo> = new Map();
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private proxyPort: number = 9876;
  private proxyReady: boolean = false;
  
  private constructor() {
    this.cefService = CEFBrowserService.getInstance();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): HybridBrowserService {
    if (!HybridBrowserService.instance) {
      HybridBrowserService.instance = new HybridBrowserService();
    }
    return HybridBrowserService.instance;
  }
  
  // ===== Initialization =====
  
  /**
   * Initialize the hybrid browser service
   * 
   * Attempts to initialize CEF first. If CEF fails (e.g., in debug builds),
   * falls back to proxy mode automatically.
   */
  public async initialize(): Promise<BrowserCapabilities> {
    if (this.initialized) {
      return this.getCapabilities();
    }
    
    console.log('🌐 Initializing Hybrid Browser Service...');
    
    // Try to initialize CEF
    try {
      await this.cefService.initialize();
      this.cefAvailable = true;
      this.cefInitialized = true;
      console.log('✅ CEF Browser Engine initialized successfully');
      console.log('   DRM support: enabled');
      console.log('   Full codecs: enabled');
      this.emit('cef:initialized', { success: true });
    } catch (error) {
      this.cefAvailable = false;
      this.cefInitialized = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ CEF initialization failed:', errorMessage);
      console.log('   Falling back to proxy-based iframe mode');
      this.emit('cef:unavailable', { reason: errorMessage });
      this.emit('cef:initialized', { success: false, error: errorMessage });
      
      // Initialize proxy as fallback
      await this.initializeProxy();
    }
    
    this.initialized = true;
    return this.getCapabilities();
  }
  
  /**
   * Initialize the proxy service as fallback
   */
  private async initializeProxy(): Promise<void> {
    try {
      // The proxy is started by the ProxyService in browser-service.ts
      // We just mark it as ready here
      this.proxyReady = true;
      console.log('✅ Proxy fallback mode ready');
    } catch (error) {
      console.error('Failed to initialize proxy:', error);
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
   * Get browser capabilities
   */
  public getCapabilities(): BrowserCapabilities {
    return {
      cefAvailable: this.cefAvailable,
      drmSupport: this.cefAvailable, // DRM only with CEF
      extensionSupport: this.cefAvailable, // Extensions only with CEF
      fullCodecSupport: this.cefAvailable, // Full codecs only with CEF
      proxyFallback: !this.cefAvailable && this.proxyReady,
    };
  }
  
  /**
   * Check if CEF is being used
   */
  public isUsingCEF(): boolean {
    return this.cefAvailable && this.cefInitialized;
  }
  
  /**
   * Get the current browser mode
   */
  public getCurrentMode(): 'cef' | 'proxy' {
    return this.cefAvailable ? 'cef' : 'proxy';
  }
  
  // ===== Tab Management =====
  
  /**
   * Create a new browser tab
   * 
   * Uses CEF if available, otherwise creates a proxy-based tab.
   */
  public async createTab(url: string = 'about:blank'): Promise<string> {
    if (this.cefAvailable) {
      return this.createCEFTab(url);
    } else {
      return this.createProxyTab(url);
    }
  }
  
  /**
   * Create a tab using CEF
   */
  private async createCEFTab(url: string): Promise<string> {
    try {
      const tabId = await invoke<string>('cef_create_tab', { url });
      
      const tabInfo: HybridTabInfo = {
        id: tabId,
        url,
        title: 'Loading...',
        favicon: null,
        loading: true,
        canGoBack: false,
        canGoForward: false,
        security: 'unknown',
        muted: false,
        audible: false,
        pinned: false,
        mode: 'cef',
      };
      
      this.tabs.set(tabId, tabInfo);
      this.emit('tab:created', { tabId, url, mode: 'cef' });
      
      return tabId;
    } catch (error) {
      console.error('Failed to create CEF tab:', error);
      throw error;
    }
  }
  
  /**
   * Create a tab using proxy (iframe)
   * 
   * Returns a unique tab ID that the component can use to manage the iframe.
   */
  private async createProxyTab(url: string): Promise<string> {
    const tabId = `proxy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const tabInfo: HybridTabInfo = {
      id: tabId,
      url,
      title: 'Loading...',
      favicon: null,
      loading: true,
      canGoBack: false,
      canGoForward: false,
      security: url.startsWith('https') ? 'secure' : 'insecure',
      muted: false,
      audible: false,
      pinned: false,
      mode: 'proxy',
    };
    
    this.tabs.set(tabId, tabInfo);
    this.emit('tab:created', { tabId, url, mode: 'proxy' });
    
    return tabId;
  }
  
  /**
   * Close a browser tab
   */
  public async closeTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    
    if (tab.mode === 'cef') {
      try {
        await invoke('cef_close_tab', { tabId });
      } catch (error) {
        console.error('Failed to close CEF tab:', error);
      }
    }
    // Proxy tabs are closed by removing the iframe in the component
    
    this.tabs.delete(tabId);
    this.emit('tab:closed', { tabId });
  }
  
  /**
   * Navigate a tab to a URL
   */
  public async navigate(tabId: string, url: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`);
    }
    
    if (tab.mode === 'cef') {
      try {
        await invoke('cef_navigate', { tabId, url });
        tab.url = url;
        tab.loading = true;
        this.emit('tab:url-changed', { tabId, url });
        this.emit('tab:loading-changed', { tabId, loading: true });
      } catch (error) {
        console.error('Failed to navigate CEF tab:', error);
        throw error;
      }
    } else {
      // Proxy tabs are navigated by changing the iframe src in the component
      tab.url = url;
      tab.loading = true;
      this.emit('tab:url-changed', { tabId, url });
      this.emit('tab:loading-changed', { tabId, loading: true });
    }
  }
  
  /**
   * Go back in history
   */
  public async goBack(tabId: string): Promise<boolean> {
    const tab = this.tabs.get(tabId);
    if (!tab) return false;
    
    if (tab.mode === 'cef') {
      try {
        return await invoke<boolean>('cef_go_back', { tabId });
      } catch (error) {
        console.error('Failed to go back:', error);
        return false;
      }
    }
    // Proxy tabs handle back/forward through iframe.contentWindow.history
    return false;
  }
  
  /**
   * Go forward in history
   */
  public async goForward(tabId: string): Promise<boolean> {
    const tab = this.tabs.get(tabId);
    if (!tab) return false;
    
    if (tab.mode === 'cef') {
      try {
        return await invoke<boolean>('cef_go_forward', { tabId });
      } catch (error) {
        console.error('Failed to go forward:', error);
        return false;
      }
    }
    return false;
  }
  
  /**
   * Reload the current page
   */
  public async reload(tabId: string, ignoreCache: boolean = false): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    
    if (tab.mode === 'cef') {
      try {
        await invoke('cef_reload', { tabId, ignoreCache });
      } catch (error) {
        console.error('Failed to reload:', error);
      }
    }
    // Proxy tabs reload through iframe.contentWindow.location.reload()
  }
  
  /**
   * Stop loading
   */
  public async stop(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    
    if (tab.mode === 'cef') {
      try {
        await invoke('cef_stop', { tabId });
      } catch (error) {
        console.error('Failed to stop loading:', error);
      }
    }
  }
  
  /**
   * Execute JavaScript in a tab
   */
  public async executeScript(tabId: string, script: string): Promise<unknown> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab ${tabId} not found`);
    }
    
    if (tab.mode === 'cef') {
      try {
        const result = await invoke<{ success: boolean; value: string | null; error: string | null }>(
          'cef_execute_script',
          { tabId, script }
        );
        
        if (result.success && result.value) {
          return JSON.parse(result.value);
        } else if (result.error) {
          throw new Error(result.error);
        }
        return null;
      } catch (error) {
        console.error('Failed to execute script:', error);
        throw error;
      }
    } else {
      // Can't execute script in cross-origin iframes
      throw new Error('Script execution not available in proxy mode');
    }
  }
  
  /**
   * Get tab info
   */
  public getTabInfo(tabId: string): HybridTabInfo | undefined {
    return this.tabs.get(tabId);
  }
  
  /**
   * Get all tabs
   */
  public getAllTabs(): HybridTabInfo[] {
    return Array.from(this.tabs.values());
  }
  
  /**
   * Update tab info (called by component for proxy tabs)
   */
  public updateTabInfo(tabId: string, updates: Partial<HybridTabInfo>): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      Object.assign(tab, updates);
      
      if ('url' in updates && updates.url) {
        this.emit('tab:url-changed', { tabId, url: updates.url });
      }
      if ('title' in updates && updates.title) {
        this.emit('tab:title-changed', { tabId, title: updates.title });
      }
      if ('loading' in updates) {
        this.emit('tab:loading-changed', { tabId, loading: updates.loading ?? false });
      }
    }
  }
  
  // ===== Proxy URL Helper =====
  
  /**
   * Get the proxy URL for a target URL
   * 
   * Only relevant in proxy mode.
   */
  public getProxyUrl(targetUrl: string): string {
    if (this.cefAvailable) {
      // In CEF mode, no proxy needed
      return targetUrl;
    }
    
    // Build proxy URL
    const encodedUrl = encodeURIComponent(targetUrl);
    return `http://localhost:${this.proxyPort}/proxy?url=${encodedUrl}`;
  }
  
  /**
   * Set the proxy port
   */
  public setProxyPort(port: number): void {
    this.proxyPort = port;
    this.proxyReady = true;
  }
  
  // ===== Event System =====
  
  /**
   * Subscribe to an event
   */
  public on<K extends keyof HybridBrowserEvents>(
    event: K,
    callback: (data: HybridBrowserEvents[K]) => void
  ): () => void {
    const listeners = this.eventListeners.get(event) || new Set();
    listeners.add(callback as (data: unknown) => void);
    this.eventListeners.set(event, listeners);
    
    return () => {
      listeners.delete(callback as (data: unknown) => void);
    };
  }
  
  /**
   * Emit an event
   */
  private emit<K extends keyof HybridBrowserEvents>(
    event: K,
    data: HybridBrowserEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }
  
  // ===== Cleanup =====
  
  /**
   * Cleanup and shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Hybrid Browser Service...');
    
    // Close all tabs
    for (const tabId of this.tabs.keys()) {
      await this.closeTab(tabId);
    }
    
    // Clear event listeners
    this.eventListeners.clear();
    
    this.initialized = false;
    console.log('✅ Hybrid Browser Service shut down');
  }
}

// ===== Export Singleton Helper =====

/**
 * Get the hybrid browser service instance
 */
export function getHybridBrowser(): HybridBrowserService {
  return HybridBrowserService.getInstance();
}

/**
 * Initialize and get capabilities
 */
export async function initializeHybridBrowser(): Promise<BrowserCapabilities> {
  const browser = HybridBrowserService.getInstance();
  return browser.initialize();
}
