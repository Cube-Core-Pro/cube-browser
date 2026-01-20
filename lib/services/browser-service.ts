/**
 * Browser Service - CUBE Nexum
 * 
 * Unified service layer for browser operations including:
 * - Proxy management for full site access
 * - Embedded webview control
 * - Tab management
 * - DevTools integration
 * - Download and bookmark functions
 * 
 * @module BrowserService
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('Browser');

// ============================================
// Types
// ============================================

export interface WebviewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DOMNode {
  nodeType: number;
  nodeName: string;
  attributes: Record<string, string>;
  children: DOMNode[];
  textContent?: string;
}

export interface ConsoleEntry {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug' | 'command' | 'result';
  args: string[];
  timestamp: number;
}

export interface NetworkRequest {
  type: 'fetch' | 'xhr';
  url: string;
  method: string;
  status?: number;
  duration?: number;
  size?: number;
  error?: string;
  timestamp: number;
}

export interface PerformanceMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstByte: number;
  domInteractive: number;
  dns: number;
  tcp: number;
  request: number;
  response: number;
  domParsing: number;
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  resourceCount: number;
  resources: Array<{
    name: string;
    type: string;
    duration: number;
    size: number;
  }>;
}

export interface ElementStyles {
  [property: string]: string;
}

// ============================================
// Proxy Service
// ============================================

export const ProxyService = {
  /**
   * Start the browser proxy server
   */
  async start(port: number = 9876): Promise<number> {
    return invoke<number>('browser_proxy_start', { port });
  },

  /**
   * Stop the browser proxy server
   */
  async stop(): Promise<void> {
    return invoke<void>('browser_proxy_stop');
  },

  /**
   * Get proxy URL for a target URL
   */
  getProxyUrl(targetUrl: string, proxyPort: number): string {
    const encoded = encodeURIComponent(targetUrl);
    return `http://127.0.0.1:${proxyPort}/proxy?url=${encoded}`;
  },
};

// ============================================
// Embedded Webview Service
// ============================================

export interface WebviewServiceType {
  create(tabId: string, url: string, bounds: WebviewBounds): Promise<void>;
  navigate(tabId: string, url: string): Promise<void>;
  close(tabId: string): Promise<void>;
}

export const WebviewService: WebviewServiceType = {
  /**
   * Create a new embedded webview
   */
  async create(tabId: string, url: string, bounds: WebviewBounds): Promise<void> {
    return invoke<void>('embedded_webview_create', { tabId, url, bounds });
  },

  /**
   * Navigate webview to URL
   */
  async navigate(tabId: string, url: string): Promise<void> {
    return invoke<void>('embedded_webview_navigate', { tabId, url });
  },

  /**
   * Close embedded webview
   */
  async close(tabId: string): Promise<void> {
    return invoke<void>('embedded_webview_close', { tabId });
  },
};

// ============================================
// Tab Service
// ============================================

export const TabService = {
  /**
   * Create a new browser tab
   */
  async create(url: string): Promise<void> {
    return invoke<void>('create_browser_tab', { url });
  },

  /**
   * Close a browser tab
   */
  async close(tabId: string): Promise<void> {
    return invoke<void>('close_browser_tab', { tabId });
  },

  /**
   * Navigate tab to URL
   */
  async navigate(tabId: string, url: string): Promise<void> {
    return invoke<void>('navigate_tab', { tabId, url });
  },

  /**
   * Go back in tab history
   */
  async goBack(tabId: string): Promise<void> {
    return invoke<void>('tab_go_back', { tabId });
  },

  /**
   * Go forward in tab history
   */
  async goForward(tabId: string): Promise<void> {
    return invoke<void>('tab_go_forward', { tabId });
  },

  /**
   * Reload current tab
   */
  async reload(tabId: string): Promise<void> {
    return invoke<void>('reload_tab', { tabId });
  },
};

// ============================================
// Browser Actions Service
// ============================================

export const BrowserActionsService = {
  /**
   * Download current page
   * Note: Uses browser's native download functionality
   */
  async downloadPage(url: string, filename?: string): Promise<void> {
    // Use anchor download trick for web-based downloading
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || url.split('/').pop() || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Add bookmark
   * Note: Stores in local storage until backend implementation
   */
  async addBookmark(url: string, title: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const bookmarks = JSON.parse(localStorage.getItem('cube_bookmarks') || '[]');
    bookmarks.push({
      id: `bookmark-${Date.now()}`,
      url,
      title,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('cube_bookmarks', JSON.stringify(bookmarks));
  },

  /**
   * Get all bookmarks
   */
  getBookmarks(): Array<{ id: string; url: string; title: string; createdAt: string }> {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('cube_bookmarks') || '[]');
  },

  /**
   * Remove bookmark
   */
  removeBookmark(id: string): void {
    if (typeof window === 'undefined') return;
    const bookmarks = JSON.parse(localStorage.getItem('cube_bookmarks') || '[]');
    const filtered = bookmarks.filter((b: { id: string }) => b.id !== id);
    localStorage.setItem('cube_bookmarks', JSON.stringify(filtered));
  },

  /**
   * Print current page
   * Note: Uses browser's native print dialog
   */
  printPage(): void {
    window.print();
  },

  /**
   * Take screenshot of current viewport
   * Uses canvas-based screenshot capture
   */
  async takeScreenshot(): Promise<string | null> {
    try {
      // Method 1: Try html2canvas if available
      const html2canvas = (window as unknown as { html2canvas?: unknown }).html2canvas as 
        ((element: HTMLElement, options?: object) => Promise<HTMLCanvasElement>) | undefined;
      
      if (html2canvas) {
        const canvas = await html2canvas(document.body, {
          useCORS: true,
          logging: false,
          scale: window.devicePixelRatio || 1,
        });
        return canvas.toDataURL('image/png');
      }

      // Method 2: Use built-in canvas with SVG foreignObject
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
      canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

      // Clone the document for rendering
      const clone = document.documentElement.cloneNode(true) as HTMLElement;
      
      // Remove scripts to avoid execution
      clone.querySelectorAll('script').forEach(s => s.remove());

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${window.innerWidth}" height="${window.innerHeight}">
          <foreignObject width="100%" height="100%">
            ${new XMLSerializer().serializeToString(clone)}
          </foreignObject>
        </svg>
      `;

      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          log.warn('Screenshot capture failed - CORS or rendering issue');
          resolve(null);
        };
        img.src = url;
        
        // Timeout fallback
        setTimeout(() => resolve(null), 5000);
      });
    } catch (error) {
      log.error('Screenshot failed:', error);
      return null;
    }
  },
};

// ============================================
// DevTools Service
// ============================================

export const DevToolsService = {
  /**
   * Get DOM tree for tab
   */
  async getDom(tabId: string): Promise<DOMNode> {
    return invoke<DOMNode>('cube_devtools_get_dom', { tabId });
  },

  /**
   * Get console entries for tab
   */
  async getConsole(tabId: string): Promise<ConsoleEntry[]> {
    return invoke<ConsoleEntry[]>('cube_devtools_get_console', { tabId });
  },

  /**
   * Get network requests for tab
   */
  async getNetwork(tabId: string): Promise<NetworkRequest[]> {
    return invoke<NetworkRequest[]>('cube_devtools_get_network', { tabId });
  },

  /**
   * Get performance metrics for tab
   */
  async getPerformance(tabId: string): Promise<PerformanceMetrics> {
    return invoke<PerformanceMetrics>('cube_devtools_get_performance', { tabId });
  },

  /**
   * Inject console monitor script
   */
  async injectConsoleMonitor(tabId: string): Promise<void> {
    return invoke<void>('cube_devtools_inject_console_monitor', { tabId });
  },

  /**
   * Inject network monitor script
   */
  async injectNetworkMonitor(tabId: string): Promise<void> {
    return invoke<void>('cube_devtools_inject_network_monitor', { tabId });
  },

  /**
   * Execute console command
   */
  async executeConsole(tabId: string, command: string): Promise<void> {
    return invoke<void>('cube_devtools_execute_console', { tabId, command });
  },

  /**
   * Highlight element in page
   */
  async highlightElement(tabId: string, selector: string): Promise<void> {
    return invoke<void>('cube_devtools_highlight_element', { tabId, selector });
  },

  /**
   * Get computed styles for element
   */
  async getStyles(tabId: string, selector: string): Promise<ElementStyles> {
    return invoke<ElementStyles>('cube_devtools_get_styles', { tabId, selector });
  },
};

// ============================================
// Combined Browser Service Export
// ============================================

export const BrowserService = {
  Proxy: ProxyService,
  Webview: WebviewService,
  Tab: TabService,
  Actions: BrowserActionsService,
  DevTools: DevToolsService,
};

// ============================================
// Legacy browserService Compatibility
// ============================================

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  active: boolean;
  pinned: boolean;
  groupId?: string;
  createdAt: number;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  tabIds: string[];
  collapsed: boolean;
}

// Tab Operations (Legacy compatibility)
export async function createTab(url: string): Promise<string> {
  return await invoke<string>('create_browser_tab', { url });
}

export async function closeTab(tabId: string): Promise<void> {
  await invoke<void>('close_browser_tab', { tabId });
}

export async function navigate(tabId: string, url: string): Promise<void> {
  await invoke<void>('navigate_tab', { tabId, url });
}

export async function getAllTabs(): Promise<BrowserTab[]> {
  return await invoke<BrowserTab[]>('get_all_tabs');
}

export async function getActiveTab(): Promise<BrowserTab | null> {
  return await invoke<BrowserTab | null>('get_active_tab');
}

export async function switchTab(tabId: string): Promise<void> {
  await invoke<void>('activate_tab', { tabId });
}

export async function pinTab(tabId: string, pinned: boolean): Promise<void> {
  await invoke<void>('set_tab_pinned', { tabId, pinned });
}

export async function duplicateTab(tabId: string): Promise<string> {
  return await invoke<string>('duplicate_tab', { tabId });
}

// Tab Groups
export async function createGroup(name: string, color: string, tabIds: string[]): Promise<string> {
  return await invoke<string>('create_tab_group', { name, color, tabIds });
}

export async function addToGroup(groupId: string, tabIds: string[]): Promise<void> {
  await invoke<void>('add_tabs_to_group', { groupId, tabIds });
}

export async function removeFromGroup(groupId: string, tabIds: string[]): Promise<void> {
  await invoke<void>('remove_tabs_from_group', { groupId, tabIds });
}

export async function deleteGroup(groupId: string): Promise<void> {
  await invoke<void>('delete_tab_group', { groupId });
}

export async function getAllGroups(): Promise<TabGroup[]> {
  return await invoke<TabGroup[]>('get_all_tab_groups');
}

// Chrome Extension Bridge
export async function sendMessageToExtension(message: unknown): Promise<unknown> {
  return await invoke<unknown>('send_message_to_extension', { message });
}

export async function injectScript(tabId: string, script: string): Promise<void> {
  await invoke<void>('inject_script_to_tab', { tabId, script });
}

export async function executeAutomation(tabId: string, steps: unknown[]): Promise<void> {
  await invoke<void>('execute_automation_steps', { tabId, steps });
}

// Legacy browserService object for backward compatibility
export const browserService = {
  createTab,
  closeTab,
  navigate,
  getAllTabs,
  getActiveTab,
  switchTab,
  pinTab,
  duplicateTab,
  createGroup,
  addToGroup,
  removeFromGroup,
  deleteGroup,
  getAllGroups,
  sendMessageToExtension,
  injectScript,
  executeAutomation,
};

export default BrowserService;
