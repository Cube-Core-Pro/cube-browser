// CUBE Web Engine - Frontend Service
// Provides true embedded browser tabs using iframes with backend-fetched content
// Bypasses CORS and provides full control over the browsing experience

import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

// ============================================
// Types
// ============================================

export interface CubeWebTab {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  zoomLevel: number;
  isMuted: boolean;
  isPinned: boolean;
  bounds: TabBounds;
  createdAt: number;
  lastAccessed: number;
}

export interface TabBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FetchResponse {
  status: number;
  headers: Record<string, string>;
  contentType: string;
  body: number[]; // byte array
  url: string;
}

export interface PageContent {
  html: string;
  baseUrl: string;
  scripts: string[];
  styles: string[];
  resources: Record<string, number[]>;
  domReady: boolean;
}

export interface CubeWebEngineConfig {
  javascriptEnabled: boolean;
  webglEnabled: boolean;
  localStorageEnabled: boolean;
  cookiesEnabled: boolean;
  userAgent: string;
  devtoolsEnabled: boolean;
  customHeaders: Record<string, string>;
  proxy: ProxyConfig | null;
}

export interface ProxyConfig {
  host: string;
  port: number;
  username: string | null;
  password: string | null;
  proxyType: 'Http' | 'Https' | 'Socks5';
}

export interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
}

export interface ScreenshotOptions {
  fullPage: boolean;
  clip?: ClipRegion;
  format: 'Png' | 'Jpeg' | 'Webp';
  quality: number;
}

export interface ClipRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PrintOptions {
  landscape: boolean;
  displayHeaderFooter: boolean;
  printBackground: boolean;
  scale: number;
  paperWidth: number;
  paperHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

export interface DomCommand {
  action: string;
  [key: string]: unknown;
}

// ============================================
// Tab Management
// ============================================

/**
 * Create a new browser tab
 */
export async function createTab(
  url?: string,
  bounds?: TabBounds
): Promise<CubeWebTab> {
  const tab = await invoke<CubeWebTab>('cube_engine_create_tab', {
    url,
    bounds,
  });
  return tab;
}

/**
 * Close a browser tab
 */
export async function closeTab(tabId: string): Promise<void> {
  await invoke('cube_engine_close_tab', { tabId });
}

/**
 * Close all tabs
 */
export async function closeAllTabs(): Promise<void> {
  await invoke('cube_engine_close_all_tabs');
}

/**
 * Get all tabs
 */
export async function getTabs(): Promise<CubeWebTab[]> {
  return await invoke<CubeWebTab[]>('cube_engine_get_tabs');
}

/**
 * Get a specific tab
 */
export async function getTab(tabId: string): Promise<CubeWebTab | null> {
  return await invoke<CubeWebTab | null>('cube_engine_get_tab', { tabId });
}

/**
 * Set active tab
 */
export async function setActiveTab(tabId: string): Promise<void> {
  await invoke('cube_engine_set_active_tab', { tabId });
}

/**
 * Get active tab ID
 */
export async function getActiveTab(): Promise<string | null> {
  return await invoke<string | null>('cube_engine_get_active_tab');
}

/**
 * Update tab bounds
 */
export async function updateBounds(
  tabId: string,
  bounds: TabBounds
): Promise<void> {
  await invoke('cube_engine_update_bounds', { tabId, bounds });
}

// ============================================
// Navigation
// ============================================

/**
 * Navigate to a URL
 */
export async function navigate(tabId: string, url: string): Promise<void> {
  await invoke('cube_engine_navigate', { tabId, url });
}

/**
 * Fetch a URL directly (bypasses CORS)
 */
export async function fetchUrl(
  url: string,
  headers?: Record<string, string>
): Promise<FetchResponse> {
  return await invoke<FetchResponse>('cube_engine_fetch_url', { url, headers });
}

/**
 * Fetch page content for rendering
 */
export async function fetchPage(url: string): Promise<PageContent> {
  return await invoke<PageContent>('cube_engine_fetch_page', { url });
}

/**
 * Go back in history
 */
export async function goBack(tabId: string): Promise<void> {
  await invoke('cube_engine_go_back', { tabId });
}

/**
 * Go forward in history
 */
export async function goForward(tabId: string): Promise<void> {
  await invoke('cube_engine_go_forward', { tabId });
}

/**
 * Reload current page
 */
export async function reload(tabId: string): Promise<void> {
  await invoke('cube_engine_reload', { tabId });
}

/**
 * Stop loading
 */
export async function stop(tabId: string): Promise<void> {
  await invoke('cube_engine_stop', { tabId });
}

// ============================================
// Content & DOM
// ============================================

/**
 * Execute JavaScript in tab
 */
export async function executeScript(
  tabId: string,
  script: string
): Promise<void> {
  await invoke('cube_engine_execute_script', { tabId, script });
}

/**
 * Execute DOM command
 */
export async function executeDomCommand(
  tabId: string,
  command: DomCommand
): Promise<unknown> {
  return await invoke('cube_engine_dom_command', { tabId, command });
}

/**
 * Get page source
 */
export async function getPageSource(tabId: string): Promise<string> {
  return await invoke<string>('cube_engine_get_page_source', { tabId });
}

/**
 * Update tab info from frontend
 */
export async function updateTabInfo(
  tabId: string,
  info: {
    title?: string;
    url?: string;
    favicon?: string;
    isLoading?: boolean;
  }
): Promise<void> {
  await invoke('cube_engine_update_tab_info', {
    tabId,
    title: info.title,
    url: info.url,
    favicon: info.favicon,
    isLoading: info.isLoading,
  });
}

// ============================================
// Configuration
// ============================================

/**
 * Get engine configuration
 */
export async function getConfig(): Promise<CubeWebEngineConfig> {
  return await invoke<CubeWebEngineConfig>('cube_engine_get_config');
}

/**
 * Set engine configuration
 */
export async function setConfig(config: CubeWebEngineConfig): Promise<void> {
  await invoke('cube_engine_set_config', { config });
}

/**
 * Set custom headers
 */
export async function setHeaders(
  headers: Record<string, string>
): Promise<void> {
  await invoke('cube_engine_set_headers', { headers });
}

/**
 * Set user agent
 */
export async function setUserAgent(userAgent: string): Promise<void> {
  await invoke('cube_engine_set_user_agent', { userAgent });
}

// ============================================
// Zoom & Display
// ============================================

/**
 * Set zoom level
 */
export async function setZoom(tabId: string, zoomLevel: number): Promise<void> {
  await invoke('cube_engine_set_zoom', { tabId, zoomLevel });
}

/**
 * Get zoom level
 */
export async function getZoom(tabId: string): Promise<number> {
  return await invoke<number>('cube_engine_get_zoom', { tabId });
}

// ============================================
// History
// ============================================

/**
 * Get tab history
 */
export async function getHistory(tabId: string): Promise<HistoryEntry[]> {
  return await invoke<HistoryEntry[]>('cube_engine_get_history', { tabId });
}

/**
 * Clear history
 */
export async function clearHistory(tabId?: string): Promise<void> {
  await invoke('cube_engine_clear_history', { tabId });
}

// ============================================
// Screenshot & Print
// ============================================

/**
 * Take screenshot
 */
export async function screenshot(
  tabId: string,
  options?: ScreenshotOptions
): Promise<string> {
  return await invoke<string>('cube_engine_screenshot', { tabId, options });
}

/**
 * Print to PDF
 */
export async function printToPdf(
  tabId: string,
  options?: PrintOptions
): Promise<string> {
  return await invoke<string>('cube_engine_print_to_pdf', { tabId, options });
}

// ============================================
// Events
// ============================================

export type CubeWebEventType =
  | 'cube-engine-tab-created'
  | 'cube-engine-tab-closed'
  | 'cube-engine-tab-updated'
  | 'cube-engine-tab-activated'
  | 'cube-engine-navigation-started'
  | 'cube-engine-navigation-completed'
  | 'cube-engine-navigation-failed'
  | 'cube-engine-reload'
  | 'cube-engine-stopped'
  | 'cube-engine-zoom-changed'
  | 'cube-engine-execute-script'
  | 'cube-engine-dom-command'
  | 'cube-engine-screenshot-request'
  | 'cube-engine-print-request'
  | 'cube-engine-devtools-request'
  | 'cube-engine-all-tabs-closed';

/**
 * Listen for tab created events
 */
export async function onTabCreated(
  callback: (tab: CubeWebTab) => void
): Promise<UnlistenFn> {
  return await listen<CubeWebTab>('cube-engine-tab-created', (event) => {
    callback(event.payload);
  });
}

/**
 * Listen for tab closed events
 */
export async function onTabClosed(
  callback: (data: { tabId: string }) => void
): Promise<UnlistenFn> {
  return await listen<{ tabId: string }>('cube-engine-tab-closed', (event) => {
    callback(event.payload);
  });
}

/**
 * Listen for tab updated events
 */
export async function onTabUpdated(
  callback: (tab: CubeWebTab) => void
): Promise<UnlistenFn> {
  return await listen<CubeWebTab>('cube-engine-tab-updated', (event) => {
    callback(event.payload);
  });
}

/**
 * Listen for tab activated events
 */
export async function onTabActivated(
  callback: (data: { tabId: string }) => void
): Promise<UnlistenFn> {
  return await listen<{ tabId: string }>(
    'cube-engine-tab-activated',
    (event) => {
      callback(event.payload);
    }
  );
}

/**
 * Listen for navigation started events
 */
export async function onNavigationStarted(
  callback: (data: { tabId: string; url: string }) => void
): Promise<UnlistenFn> {
  return await listen<{ tabId: string; url: string }>(
    'cube-engine-navigation-started',
    (event) => {
      callback(event.payload);
    }
  );
}

/**
 * Listen for navigation completed events
 */
export async function onNavigationCompleted(
  callback: (data: { tabId: string; url: string; html: string; baseUrl: string }) => void
): Promise<UnlistenFn> {
  return await listen<{ tabId: string; url: string; html: string; baseUrl: string }>(
    'cube-engine-navigation-completed',
    (event) => {
      callback(event.payload);
    }
  );
}

/**
 * Listen for navigation failed events
 */
export async function onNavigationFailed(
  callback: (data: { tabId: string; url: string; error: string }) => void
): Promise<UnlistenFn> {
  return await listen<{ tabId: string; url: string; error: string }>(
    'cube-engine-navigation-failed',
    (event) => {
      callback(event.payload);
    }
  );
}

/**
 * Listen for all tabs closed events
 */
export async function onAllTabsClosed(
  callback: () => void
): Promise<UnlistenFn> {
  return await listen('cube-engine-all-tabs-closed', () => {
    callback();
  });
}

// ============================================
// Content Rendering Utilities
// ============================================

/**
 * Create a sandboxed iframe for rendering fetched content
 */
export function createRenderFrame(
  container: HTMLElement,
  tabId: string
): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.id = `cube-frame-${tabId}`;
  iframe.className = 'cube-render-frame';
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    background: white;
  `;
  
  // Sandbox with necessary permissions
  iframe.sandbox.add('allow-scripts');
  iframe.sandbox.add('allow-same-origin');
  iframe.sandbox.add('allow-forms');
  iframe.sandbox.add('allow-popups');
  iframe.sandbox.add('allow-modals');
  
  container.appendChild(iframe);
  return iframe;
}

/**
 * Render fetched HTML content in an iframe
 */
export function renderContent(
  iframe: HTMLIFrameElement,
  content: PageContent,
  onLoad?: () => void
): void {
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  // Inject base tag for relative URLs
  const baseTag = `<base href="${content.baseUrl}">`;
  
  // Inject our monitoring scripts
  const monitorScript = `
    <script>
      (function() {
        // Intercept navigation
        window.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (link && link.href) {
            e.preventDefault();
            window.parent.postMessage({
              type: 'cube-navigate',
              url: link.href
            }, '*');
          }
        }, true);

        // Intercept form submissions
        window.addEventListener('submit', function(e) {
          e.preventDefault();
          const form = e.target;
          const formData = new FormData(form);
          window.parent.postMessage({
            type: 'cube-form-submit',
            action: form.action,
            method: form.method,
            data: Object.fromEntries(formData)
          }, '*');
        }, true);

        // Report title changes
        const observer = new MutationObserver(function() {
          window.parent.postMessage({
            type: 'cube-title-change',
            title: document.title
          }, '*');
        });
        observer.observe(document.querySelector('title') || document.head, {
          childList: true,
          subtree: true,
          characterData: true
        });

        // Report favicon
        const favicon = document.querySelector('link[rel*="icon"]');
        if (favicon) {
          window.parent.postMessage({
            type: 'cube-favicon-change',
            favicon: favicon.href
          }, '*');
        }

        // Report console messages
        const origLog = console.log;
        const origWarn = console.warn;
        const origError = console.error;
        
        console.log = function(...args) {
          window.parent.postMessage({
            type: 'cube-console',
            level: 'log',
            message: args.map(a => String(a)).join(' ')
          }, '*');
          origLog.apply(console, args);
        };
        
        console.warn = function(...args) {
          window.parent.postMessage({
            type: 'cube-console',
            level: 'warn',
            message: args.map(a => String(a)).join(' ')
          }, '*');
          origWarn.apply(console, args);
        };
        
        console.error = function(...args) {
          window.parent.postMessage({
            type: 'cube-console',
            level: 'error',
            message: args.map(a => String(a)).join(' ')
          }, '*');
          origError.apply(console, args);
        };

        // Report load complete
        window.addEventListener('load', function() {
          window.parent.postMessage({
            type: 'cube-load-complete'
          }, '*');
        });
      })();
    </script>
  `;

  // Modify HTML to include base and monitoring
  let html = content.html;
  
  // Insert base tag in head
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>${baseTag}`);
  } else if (html.includes('<html>')) {
    html = html.replace('<html>', `<html><head>${baseTag}</head>`);
  } else {
    html = `${baseTag}${html}`;
  }

  // Insert monitoring script before </body>
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${monitorScript}</body>`);
  } else {
    html = `${html}${monitorScript}`;
  }

  // Write content to iframe
  doc.open();
  doc.write(html);
  doc.close();

  if (onLoad) {
    iframe.onload = onLoad;
  }
}

/**
 * Execute script in render frame
 */
export function executeInFrame(
  iframe: HTMLIFrameElement,
  script: string
): unknown {
  const win = iframe.contentWindow;
  if (!win) return null;
  
  try {
    // Use Function constructor as a safer alternative to eval
    const fn = new (win as Window & typeof globalThis).Function(script);
    return fn();
  } catch (error) {
    console.error('[CUBE Engine] Script execution error:', error);
    return null;
  }
}

/**
 * Get DOM from render frame
 */
export function getFrameDOM(iframe: HTMLIFrameElement): Document | null {
  return iframe.contentDocument || iframe.contentWindow?.document || null;
}

// ============================================
// Service Factory
// ============================================

export interface CubeWebEngineService {
  // Tab management
  createTab: typeof createTab;
  closeTab: typeof closeTab;
  closeAllTabs: typeof closeAllTabs;
  getTabs: typeof getTabs;
  getTab: typeof getTab;
  setActiveTab: typeof setActiveTab;
  getActiveTab: typeof getActiveTab;
  updateBounds: typeof updateBounds;
  
  // Navigation
  navigate: typeof navigate;
  fetchUrl: typeof fetchUrl;
  fetchPage: typeof fetchPage;
  goBack: typeof goBack;
  goForward: typeof goForward;
  reload: typeof reload;
  stop: typeof stop;
  
  // Content
  executeScript: typeof executeScript;
  executeDomCommand: typeof executeDomCommand;
  getPageSource: typeof getPageSource;
  updateTabInfo: typeof updateTabInfo;
  
  // Config
  getConfig: typeof getConfig;
  setConfig: typeof setConfig;
  setHeaders: typeof setHeaders;
  setUserAgent: typeof setUserAgent;
  
  // Zoom
  setZoom: typeof setZoom;
  getZoom: typeof getZoom;
  
  // History
  getHistory: typeof getHistory;
  clearHistory: typeof clearHistory;
  
  // Screenshot/Print
  screenshot: typeof screenshot;
  printToPdf: typeof printToPdf;
  
  // Events
  onTabCreated: typeof onTabCreated;
  onTabClosed: typeof onTabClosed;
  onTabUpdated: typeof onTabUpdated;
  onTabActivated: typeof onTabActivated;
  onNavigationStarted: typeof onNavigationStarted;
  onNavigationCompleted: typeof onNavigationCompleted;
  onNavigationFailed: typeof onNavigationFailed;
  onAllTabsClosed: typeof onAllTabsClosed;
  
  // Rendering utilities
  createRenderFrame: typeof createRenderFrame;
  renderContent: typeof renderContent;
  executeInFrame: typeof executeInFrame;
  getFrameDOM: typeof getFrameDOM;
}

/**
 * Create a CUBE Web Engine service instance
 */
export function createCubeWebEngineService(): CubeWebEngineService {
  return {
    createTab,
    closeTab,
    closeAllTabs,
    getTabs,
    getTab,
    setActiveTab,
    getActiveTab,
    updateBounds,
    navigate,
    fetchUrl,
    fetchPage,
    goBack,
    goForward,
    reload,
    stop,
    executeScript,
    executeDomCommand,
    getPageSource,
    updateTabInfo,
    getConfig,
    setConfig,
    setHeaders,
    setUserAgent,
    setZoom,
    getZoom,
    getHistory,
    clearHistory,
    screenshot,
    printToPdf,
    onTabCreated,
    onTabClosed,
    onTabUpdated,
    onTabActivated,
    onNavigationStarted,
    onNavigationCompleted,
    onNavigationFailed,
    onAllTabsClosed,
    createRenderFrame,
    renderContent,
    executeInFrame,
    getFrameDOM,
  };
}

export default createCubeWebEngineService;
