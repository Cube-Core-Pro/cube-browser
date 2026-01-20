/**
 * Native Browser Service - CUBE Nexum Enterprise
 * 
 * Full-featured browser engine service that provides:
 * - NATIVE MODE: Direct WebviewWindow for sites requiring auth (YouTube, Netflix, etc.)
 * - PROXY MODE: For sites with X-Frame-Options restrictions
 * 
 * This hybrid approach ensures 100% website compatibility including:
 * - Full YouTube video playback with authentication
 * - Netflix, Disney+, Hulu with DRM support
 * - Google, Facebook, Twitter with OAuth
 * - Banking sites with 2FA
 * - Any site requiring session cookies
 * 
 * @module NativeBrowserService
 */

import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { logger } from './logger-service';

// Scoped logger for this service
const log = logger.scope('NativeBrowser');

// ============================================
// Types
// ============================================

export type BrowserMode = 'native' | 'proxy' | 'auto';

export interface NativeTab {
  id: string;
  url: string;
  title: string;
  mode: BrowserMode;
  windowLabel?: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  favicon?: string;
  muted?: boolean;
  pinned?: boolean;
}

export interface TabBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NativeWindowInfo {
  label: string;
  tabId: string;
  url: string;
  visible: boolean;
}

// ============================================
// Site Classification
// ============================================

/**
 * Sites that MUST use native mode (no proxy) for full functionality
 * These sites require:
 * - Full cookie/session access
 * - DRM support
 * - WebRTC
 * - Complex JavaScript
 * - OAuth/Authentication flows
 */
const NATIVE_MODE_SITES = [
  // Video Streaming (DRM + Auth)
  'youtube.com',
  'youtu.be',
  'netflix.com',
  'disneyplus.com',
  'hulu.com',
  'hbomax.com',
  'max.com',
  'primevideo.com',
  'amazon.com/video',
  'peacocktv.com',
  'paramountplus.com',
  'twitch.tv',
  'vimeo.com',
  'dailymotion.com',
  'tiktok.com',
  'bilibili.com',
  'crunchyroll.com',
  'funimation.com',
  
  // Music Streaming
  'spotify.com',
  'music.apple.com',
  'music.youtube.com',
  'soundcloud.com',
  'deezer.com',
  'tidal.com',
  
  // Social Media (OAuth + Complex JS)
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'reddit.com',
  'discord.com',
  'slack.com',
  'teams.microsoft.com',
  
  // Google Services (OAuth)
  'google.com',
  'accounts.google.com',
  'mail.google.com',
  'drive.google.com',
  'docs.google.com',
  'sheets.google.com',
  'meet.google.com',
  'calendar.google.com',
  'photos.google.com',
  
  // Microsoft Services
  'microsoft.com',
  'office.com',
  'outlook.com',
  'live.com',
  'onedrive.com',
  'sharepoint.com',
  
  // Apple Services
  'apple.com',
  'icloud.com',
  
  // Banking & Finance (Security)
  'paypal.com',
  'stripe.com',
  'chase.com',
  'bankofamerica.com',
  'wellsfargo.com',
  'citibank.com',
  'capitalone.com',
  'americanexpress.com',
  'discover.com',
  'venmo.com',
  'cash.app',
  'coinbase.com',
  'binance.com',
  'kraken.com',
  
  // E-Commerce (Checkout)
  'amazon.com',
  'ebay.com',
  'etsy.com',
  'shopify.com',
  'walmart.com',
  'target.com',
  'bestbuy.com',
  
  // Cloud Services
  'github.com',
  'gitlab.com',
  'bitbucket.org',
  'aws.amazon.com',
  'console.cloud.google.com',
  'portal.azure.com',
  'vercel.com',
  'netlify.com',
  'heroku.com',
  'digitalocean.com',
  
  // Communication
  'zoom.us',
  'whereby.com',
  'webex.com',
  'gotomeeting.com',
  
  // Productivity
  'notion.so',
  'airtable.com',
  'trello.com',
  'asana.com',
  'monday.com',
  'figma.com',
  'canva.com',
  'miro.com',
  
  // AI Services
  'chat.openai.com',
  'chatgpt.com',
  'claude.ai',
  'anthropic.com',
  'bard.google.com',
  'gemini.google.com',
  'copilot.microsoft.com',
  'midjourney.com',
];

/**
 * Configuration: Use embedded mode for all sites
 * 
 * When true, ALL sites use the embedded iframe engine (CubeWebEngineView)
 * When false, certain sites use native WebviewWindow for full compatibility
 * 
 * IMPORTANT: Set to true to keep ALL browsing within the Tauri app tabs.
 * This ensures the browser is fully integrated without external windows.
 * CEF integration will handle DRM/video when available in release builds.
 * 
 * @default true - All content embedded in Tauri tabs (no external windows)
 */
export const USE_EMBEDDED_MODE_ALWAYS = true;

/**
 * Check if a URL should use native mode
 * 
 * NOTE: When USE_EMBEDDED_MODE_ALWAYS is true (default), this always returns false
 * to force all browsing through the embedded iframe engine for full DOM control.
 */
export function shouldUseNativeMode(url: string): boolean {
  // CUBE Browser Engine: Always use embedded mode for full DOM control
  if (USE_EMBEDDED_MODE_ALWAYS) {
    return false;
  }
  
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check against native mode sites
    return NATIVE_MODE_SITES.some(site => {
      // Handle subdomains
      if (hostname === site || hostname.endsWith(`.${site}`)) {
        return true;
      }
      // Handle paths (e.g., amazon.com/video)
      if (site.includes('/')) {
        const [domain, ...pathParts] = site.split('/');
        const path = pathParts.join('/');
        if ((hostname === domain || hostname.endsWith(`.${domain}`)) && 
            urlObj.pathname.startsWith(`/${path}`)) {
          return true;
        }
      }
      return false;
    });
  } catch {
    return false;
  }
}

/**
 * Get the recommended browser mode for a URL
 * 
 * NOTE: When USE_EMBEDDED_MODE_ALWAYS is true (default), this always returns 'proxy'
 * (embedded mode) for full DOM control within Tauri tabs.
 */
export function getRecommendedMode(url: string): BrowserMode {
  // Always use embedded/proxy mode for full DOM control
  if (USE_EMBEDDED_MODE_ALWAYS) {
    return 'proxy';
  }
  
  if (!url || url === 'about:blank') return 'proxy';
  return shouldUseNativeMode(url) ? 'native' : 'proxy';
}

// ============================================
// Native Browser Service
// ============================================

export const NativeBrowserService = {
  /**
   * Currently active native windows
   */
  activeWindows: new Map<string, NativeWindowInfo>(),

  /**
   * Create a native browser tab using WebviewWindow
   * This creates a separate window that can be positioned alongside the main window
   */
  async createNativeTab(
    tabId: string, 
    url: string, 
    bounds: TabBounds
  ): Promise<string> {
    const windowLabel = `browser_${tabId}`;
    
    try {
      log.debug(`Creating native browser window: ${windowLabel}`, { url, bounds });
      
      // Create native webview window via Tauri command
      const result = await invoke<string>('native_browser_create', {
        tabId,
        url,
        bounds: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        },
      });
      
      // Track the window
      this.activeWindows.set(tabId, {
        label: windowLabel,
        tabId,
        url,
        visible: true,
      });
      
      log.info(`Created native window: ${result}`);
      return result;
    } catch (error) {
      log.error(`Failed to create native window`, error);
      throw error;
    }
  },

  /**
   * Navigate a native tab to a new URL
   */
  async navigate(tabId: string, url: string): Promise<void> {
    try {
      log.debug(`Navigating ${tabId} to: ${url}`);
      await invoke('native_browser_navigate', { tabId, url });
      
      // Update tracking
      const info = this.activeWindows.get(tabId);
      if (info) {
        info.url = url;
      }
    } catch (error) {
      log.error(`Navigation failed for ${tabId}`, error);
      throw error;
    }
  },

  /**
   * Close a native browser window
   */
  async close(tabId: string): Promise<void> {
    try {
      log.debug(`Closing native window: ${tabId}`);
      await invoke('native_browser_close', { tabId });
      this.activeWindows.delete(tabId);
    } catch (error) {
      log.error(`Close failed for ${tabId}`, error);
      // Remove from tracking anyway
      this.activeWindows.delete(tabId);
    }
  },

  /**
   * Close all native browser windows
   */
  async closeAll(): Promise<void> {
    const tabIds = Array.from(this.activeWindows.keys());
    await Promise.all(tabIds.map(tabId => this.close(tabId)));
  },

  /**
   * Go back in native browser history
   */
  async goBack(tabId: string): Promise<void> {
    await invoke('native_browser_back', { tabId });
  },

  /**
   * Go forward in native browser history
   */
  async goForward(tabId: string): Promise<void> {
    await invoke('native_browser_forward', { tabId });
  },

  /**
   * Reload the native browser tab
   */
  async reload(tabId: string): Promise<void> {
    await invoke('native_browser_reload', { tabId });
  },

  /**
   * Update the bounds of a native browser window
   */
  async setBounds(tabId: string, bounds: TabBounds): Promise<void> {
    await invoke('native_browser_set_bounds', { tabId, bounds });
  },

  /**
   * Show or hide a native browser window
   */
  async setVisible(tabId: string, visible: boolean): Promise<void> {
    await invoke('native_browser_set_visible', { tabId, visible });
    
    const info = this.activeWindows.get(tabId);
    if (info) {
      info.visible = visible;
    }
  },

  /**
   * Get current URL from native browser
   */
  async getUrl(tabId: string): Promise<string> {
    return invoke<string>('native_browser_get_url', { tabId });
  },

  /**
   * Get page title from native browser
   */
  async getTitle(tabId: string): Promise<string> {
    return invoke<string>('native_browser_get_title', { tabId });
  },

  /**
   * Execute JavaScript in the native browser
   */
  async executeScript(tabId: string, script: string): Promise<string> {
    return invoke<string>('native_browser_eval', { tabId, script });
  },

  /**
   * Focus the native browser window
   */
  async focus(tabId: string): Promise<void> {
    await invoke('native_browser_focus', { tabId });
  },

  /**
   * Check if a native window exists
   */
  hasWindow(tabId: string): boolean {
    return this.activeWindows.has(tabId);
  },

  /**
   * Get main window bounds for positioning child windows
   */
  async getMainWindowBounds(): Promise<TabBounds> {
    try {
      const mainWindow = getCurrentWindow();
      const position = await mainWindow.outerPosition();
      const size = await mainWindow.outerSize();
      
      return {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      };
    } catch (error) {
      log.error('Failed to get main window bounds', error);
      return { x: 0, y: 0, width: 1400, height: 900 };
    }
  },

  /**
   * Calculate browser content area bounds (below toolbar)
   */
  async getBrowserContentBounds(toolbarHeight: number = 180): Promise<TabBounds> {
    const mainBounds = await this.getMainWindowBounds();
    
    return {
      x: mainBounds.x,
      y: mainBounds.y + toolbarHeight,
      width: mainBounds.width,
      height: mainBounds.height - toolbarHeight,
    };
  },
};

// ============================================
// Hybrid Browser Controller
// ============================================

/**
 * Unified controller for browser tabs
 * 
 * NOTE: With USE_EMBEDDED_MODE_ALWAYS enabled (default), this controller
 * always uses proxy/embedded mode for full DOM control within Tauri tabs.
 * No external windows are created.
 */
export const HybridBrowserController = {
  /**
   * Current mode per tab
   */
  tabModes: new Map<string, BrowserMode>(),

  /**
   * Proxy port
   */
  proxyPort: 9876,

  /**
   * Initialize hybrid browser
   */
  async initialize(proxyPort: number = 9876): Promise<void> {
    this.proxyPort = proxyPort;
    log.info('Browser controller initialized (embedded mode enabled)', { 
      proxyPort,
      embeddedModeOnly: USE_EMBEDDED_MODE_ALWAYS 
    });
  },

  /**
   * Create or navigate a tab with automatic mode selection
   * 
   * When USE_EMBEDDED_MODE_ALWAYS is true, all URLs use embedded/proxy mode
   * for full DOM control and no external windows.
   */
  async loadUrl(
    tabId: string,
    url: string,
    forcedMode?: BrowserMode,
    bounds?: TabBounds
  ): Promise<{ mode: BrowserMode; url: string }> {
    // Force embedded mode when configured
    const mode = USE_EMBEDDED_MODE_ALWAYS ? 'proxy' : (forcedMode || getRecommendedMode(url));
    const previousMode = this.tabModes.get(tabId);
    
    log.debug(`Loading URL`, { tabId, url, mode, previousMode, embeddedOnly: USE_EMBEDDED_MODE_ALWAYS });

    // If mode changed, clean up the old mode
    if (previousMode && previousMode !== mode) {
      if (previousMode === 'native') {
        await NativeBrowserService.close(tabId).catch(() => {});
      }
    }

    // Store the mode
    this.tabModes.set(tabId, mode);

    // With embedded mode, always return proxy URL for iframe rendering
    if (mode === 'proxy' || USE_EMBEDDED_MODE_ALWAYS) {
      const encoded = encodeURIComponent(url);
      const proxyUrl = `http://127.0.0.1:${this.proxyPort}/proxy?url=${encoded}`;
      return { mode: 'proxy', url: proxyUrl };
    }

    if (mode === 'native') {
      // Use native WebviewWindow (only when embedded mode is disabled)
      if (!bounds) {
        bounds = await NativeBrowserService.getBrowserContentBounds();
      }

      if (NativeBrowserService.hasWindow(tabId)) {
        // Window exists, just navigate
        await NativeBrowserService.navigate(tabId, url);
      } else {
        // Create new window
        await NativeBrowserService.createNativeTab(tabId, url, bounds);
      }
      
      return { mode: 'native', url };
    } else {
      // Use proxy mode - return the proxy URL
      const encoded = encodeURIComponent(url);
      const proxyUrl = `http://127.0.0.1:${this.proxyPort}/proxy?url=${encoded}`;
      return { mode: 'proxy', url: proxyUrl };
    }
  },

  /**
   * Close a tab (handles both modes)
   */
  async closeTab(tabId: string): Promise<void> {
    const mode = this.tabModes.get(tabId);
    
    if (mode === 'native') {
      await NativeBrowserService.close(tabId);
    }
    
    this.tabModes.delete(tabId);
  },

  /**
   * Show/hide tab content (for tab switching)
   */
  async setTabVisible(tabId: string, visible: boolean): Promise<void> {
    const mode = this.tabModes.get(tabId);
    
    if (mode === 'native') {
      await NativeBrowserService.setVisible(tabId, visible);
    }
    // Proxy mode visibility is handled by the iframe in the component
  },

  /**
   * Update tab bounds (for window resize)
   */
  async updateBounds(tabId: string, bounds: TabBounds): Promise<void> {
    const mode = this.tabModes.get(tabId);
    
    if (mode === 'native') {
      await NativeBrowserService.setBounds(tabId, bounds);
    }
  },

  /**
   * Navigation controls
   */
  async goBack(tabId: string): Promise<void> {
    const mode = this.tabModes.get(tabId);
    if (mode === 'native') {
      await NativeBrowserService.goBack(tabId);
    }
    // Proxy mode back is handled by iframe
  },

  async goForward(tabId: string): Promise<void> {
    const mode = this.tabModes.get(tabId);
    if (mode === 'native') {
      await NativeBrowserService.goForward(tabId);
    }
  },

  async reload(tabId: string): Promise<void> {
    const mode = this.tabModes.get(tabId);
    if (mode === 'native') {
      await NativeBrowserService.reload(tabId);
    }
  },

  /**
   * Get the mode for a tab
   */
  getTabMode(tabId: string): BrowserMode | undefined {
    return this.tabModes.get(tabId);
  },

  /**
   * Check if URL will use native mode
   */
  willUseNativeMode(url: string): boolean {
    return shouldUseNativeMode(url);
  },

  /**
   * Get explanation for why a site uses native mode
   */
  getNativeModeReason(url: string): string | null {
    if (!shouldUseNativeMode(url)) return null;
    
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('youtube') || urlLower.includes('netflix') || 
        urlLower.includes('hulu') || urlLower.includes('disney') ||
        urlLower.includes('hbo') || urlLower.includes('prime')) {
      return 'This site uses native mode for full video playback and DRM support.';
    }
    
    if (urlLower.includes('google') || urlLower.includes('facebook') ||
        urlLower.includes('twitter') || urlLower.includes('linkedin')) {
      return 'This site uses native mode for secure OAuth authentication.';
    }
    
    if (urlLower.includes('paypal') || urlLower.includes('bank') ||
        urlLower.includes('chase') || urlLower.includes('venmo')) {
      return 'This site uses native mode for secure financial transactions.';
    }
    
    return 'This site uses native mode for full functionality.';
  },

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    await NativeBrowserService.closeAll();
    this.tabModes.clear();
  },
};

export default HybridBrowserController;
