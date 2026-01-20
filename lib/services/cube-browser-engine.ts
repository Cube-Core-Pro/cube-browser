// CUBE Browser Engine - TypeScript Service
// Real Chromium-based browser with full DOM access
// All rendering happens INSIDE CUBE as integrated tabs

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('BrowserEngine');

// ============================================
// Types
// ============================================

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface DOMElement {
  nodeId: number;
  tagName: string;
  attributes: Record<string, string>;
  textContent: string | null;
  childrenCount: number;
  boundingBox: BoundingBox | null;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CookieData {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number | null;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string | null;
}

export interface ScreenshotOptions {
  format: 'png' | 'jpeg' | 'webp';
  quality?: number;
  fullPage: boolean;
  clip?: BoundingBox;
}

export interface BrowserConfig {
  headless: boolean;
  windowSize: [number, number];
  userAgent?: string;
  proxy?: string;
  disableGpu: boolean;
  sandbox: boolean;
  enableLogging: boolean;
  userDataDir?: string;
}

// ============================================
// CUBE Browser Engine Service
// ============================================

export class CubeBrowserEngine {
  private static instance: CubeBrowserEngine | null = null;
  private initialized = false;
  private tabs: Map<string, BrowserTab> = new Map();
  private activeTabId: string | null = null;
  private frameCallbacks: Map<string, (frame: string) => void> = new Map();

  private constructor() {}

  static getInstance(): CubeBrowserEngine {
    if (!CubeBrowserEngine.instance) {
      CubeBrowserEngine.instance = new CubeBrowserEngine();
    }
    return CubeBrowserEngine.instance;
  }

  // ============================================
  // Lifecycle
  // ============================================

  /**
   * Initialize the CUBE Browser Engine
   * Must be called before any other methods
   */
  async initialize(config?: Partial<BrowserConfig>): Promise<void> {
    if (this.initialized) {
      log.warn('[CUBE ENGINE] Already initialized');
      return;
    }

    const defaultConfig: BrowserConfig = {
      headless: false,
      windowSize: [1920, 1080],
      disableGpu: false,
      sandbox: true,
      enableLogging: true,
      ...config,
    };

    try {
      await invoke('cube_engine_init', { config: defaultConfig });
      this.initialized = true;
      log.debug('🚀 [CUBE ENGINE] Initialized successfully');
    } catch (error) {
      log.error('[CUBE ENGINE] Initialization failed:', error);
      throw new Error(`Failed to initialize CUBE Browser Engine: ${error}`);
    }
  }

  /**
   * Shutdown the browser engine
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) return;

    try {
      await invoke('cube_engine_shutdown');
      this.initialized = false;
      this.tabs.clear();
      this.activeTabId = null;
      log.debug('🛑 [CUBE ENGINE] Shutdown complete');
    } catch (error) {
      log.error('[CUBE ENGINE] Shutdown failed:', error);
      throw error;
    }
  }

  /**
   * Check if engine is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ============================================
  // Tab Management
  // ============================================

  /**
   * Create a new browser tab
   */
  async createTab(url: string): Promise<BrowserTab> {
    this.ensureInitialized();

    try {
      const tab = await invoke<BrowserTab>('cube_create_tab', { url });
      this.tabs.set(tab.id, tab);
      
      if (!this.activeTabId) {
        this.activeTabId = tab.id;
      }

      log.debug(`📑 [CUBE ENGINE] Created tab: ${tab.id} -> ${url}`);
      return tab;
    } catch (error) {
      throw new Error(`Failed to create tab: ${error}`);
    }
  }

  /**
   * Navigate a tab to a URL
   */
  async navigate(tabId: string, url: string): Promise<void> {
    this.ensureInitialized();

    try {
      await invoke('cube_navigate', { tabId, url });
      
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.url = url;
        tab.loading = true;
      }

      log.debug(`🔗 [CUBE ENGINE] Navigating ${tabId} to ${url}`);
    } catch (error) {
      throw new Error(`Navigation failed: ${error}`);
    }
  }

  /**
   * Close a tab
   */
  async closeTab(tabId: string): Promise<void> {
    this.ensureInitialized();

    try {
      await invoke('cube_close_tab', { tabId });
      this.tabs.delete(tabId);

      if (this.activeTabId === tabId) {
        const remaining = Array.from(this.tabs.keys());
        this.activeTabId = remaining.length > 0 ? remaining[0] : null;
      }

      log.debug(`❌ [CUBE ENGINE] Closed tab: ${tabId}`);
    } catch (error) {
      throw new Error(`Failed to close tab: ${error}`);
    }
  }

  /**
   * Go back in history
   */
  async goBack(tabId?: string): Promise<void> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    await invoke('cube_go_back', { tabId: id });
  }

  /**
   * Go forward in history
   */
  async goForward(tabId?: string): Promise<void> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    await invoke('cube_go_forward', { tabId: id });
  }

  /**
   * Reload the page
   */
  async reload(tabId?: string): Promise<void> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    await invoke('cube_reload', { tabId: id });
  }

  /**
   * Get current URL
   */
  async getUrl(tabId?: string): Promise<string> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<string>('cube_get_url', { tabId: id });
  }

  /**
   * Get page title
   */
  async getTitle(tabId?: string): Promise<string> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<string>('cube_get_title', { tabId: id });
  }

  /**
   * Get all tabs
   */
  getTabs(): BrowserTab[] {
    return Array.from(this.tabs.values());
  }

  /**
   * Get active tab
   */
  getActiveTab(): BrowserTab | null {
    if (!this.activeTabId) return null;
    return this.tabs.get(this.activeTabId) ?? null;
  }

  /**
   * Set active tab
   */
  setActiveTab(tabId: string): void {
    if (this.tabs.has(tabId)) {
      this.activeTabId = tabId;
    }
  }

  // ============================================
  // DOM Access - Full Control
  // ============================================

  /**
   * Execute JavaScript on the page
   */
  async executeScript<T = unknown>(script: string, tabId?: string): Promise<T> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<T>('cube_execute_script', { tabId: id, script });
  }

  /**
   * Query selector for single element
   */
  async querySelector(selector: string, tabId?: string): Promise<DOMElement | null> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<DOMElement | null>('cube_query_selector', { tabId: id, selector });
  }

  /**
   * Query selector for multiple elements
   */
  async querySelectorAll(selector: string, tabId?: string): Promise<DOMElement[]> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<DOMElement[]>('cube_query_selector_all', { tabId: id, selector });
  }

  /**
   * Get full page HTML
   */
  async getPageHtml(tabId?: string): Promise<string> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<string>('cube_get_page_html', { tabId: id });
  }

  /**
   * Get element inner HTML
   */
  async getInnerHtml(selector: string, tabId?: string): Promise<string> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<string>('cube_get_inner_html', { tabId: id, selector });
  }

  /**
   * Set element value
   */
  async setValue(selector: string, value: string, tabId?: string): Promise<void> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    await invoke('cube_set_value', { tabId: id, selector, value });
  }

  /**
   * Click an element
   */
  async click(selector: string, tabId?: string): Promise<void> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    await invoke('cube_click', { tabId: id, selector });
  }

  /**
   * Type text into element
   */
  async typeText(selector: string, text: string, tabId?: string): Promise<void> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    await invoke('cube_type_text', { tabId: id, selector, text });
  }

  /**
   * Focus an element
   */
  async focus(selector: string, tabId?: string): Promise<void> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    await invoke('cube_focus', { tabId: id, selector });
  }

  /**
   * Scroll to element
   */
  async scrollTo(selector: string, tabId?: string): Promise<void> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    await invoke('cube_scroll_to', { tabId: id, selector });
  }

  // ============================================
  // Screenshots & Frame Capture
  // ============================================

  /**
   * Take a screenshot (returns base64)
   */
  async screenshot(options?: Partial<ScreenshotOptions>, tabId?: string): Promise<string> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    const defaultOptions: ScreenshotOptions = {
      format: 'png',
      fullPage: false,
      ...options,
    };

    return invoke<string>('cube_screenshot', { tabId: id, options: defaultOptions });
  }

  /**
   * Capture current frame as base64 image
   */
  async captureFrame(tabId?: string): Promise<string> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<string>('cube_capture_frame', { tabId: id });
  }

  /**
   * Start continuous frame capture for rendering
   * @param callback Called with base64 frame data
   * @param fps Frames per second (default 30)
   */
  startFrameCapture(
    tabId: string,
    callback: (frame: string) => void,
    fps = 30
  ): () => void {
    const intervalMs = Math.floor(1000 / fps);
    let running = true;

    this.frameCallbacks.set(tabId, callback);

    const capture = async () => {
      if (!running) return;

      try {
        const frame = await this.captureFrame(tabId);
        const cb = this.frameCallbacks.get(tabId);
        if (cb) {
          cb(frame);
        }
      } catch (error) {
        log.error('[CUBE ENGINE] Frame capture error:', error);
      }

      if (running) {
        setTimeout(capture, intervalMs);
      }
    };

    capture();

    // Return stop function
    return () => {
      running = false;
      this.frameCallbacks.delete(tabId);
    };
  }

  // ============================================
  // Cookies & Storage
  // ============================================

  /**
   * Get all cookies
   */
  async getCookies(tabId?: string): Promise<CookieData[]> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<CookieData[]>('cube_get_cookies', { tabId: id });
  }

  /**
   * Set a cookie
   */
  async setCookie(cookie: CookieData, tabId?: string): Promise<void> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    await invoke('cube_set_cookie', { tabId: id, cookie });
  }

  /**
   * Get localStorage value
   */
  async getLocalStorage(key: string, tabId?: string): Promise<string | null> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<string | null>('cube_get_local_storage', { tabId: id, key });
  }

  /**
   * Set localStorage value
   */
  async setLocalStorage(key: string, value: string, tabId?: string): Promise<void> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    await invoke('cube_set_local_storage', { tabId: id, key, value });
  }

  /**
   * Get sessionStorage value
   */
  async getSessionStorage(key: string, tabId?: string): Promise<string | null> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<string | null>('cube_get_session_storage', { tabId: id, key });
  }

  /**
   * Set sessionStorage value
   */
  async setSessionStorage(key: string, value: string, tabId?: string): Promise<void> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    await invoke('cube_set_session_storage', { tabId: id, key, value });
  }

  // ============================================
  // Form Interaction (for Autofill)
  // ============================================

  /**
   * Get all form fields on the page
   */
  async getFormFields(tabId?: string): Promise<DOMElement[]> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<DOMElement[]>('cube_get_form_fields', { tabId: id });
  }

  /**
   * Fill form with data
   * @param data Map of selector -> value
   */
  async fillForm(data: Record<string, string>, tabId?: string): Promise<void> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    await invoke('cube_fill_form', { tabId: id, data });
  }

  /**
   * Submit a form
   */
  async submitForm(formSelector: string, tabId?: string): Promise<void> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    await invoke('cube_submit_form', { tabId: id, formSelector });
  }

  // ============================================
  // Data Extraction
  // ============================================

  /**
   * Extract structured data from page
   * @param schema Map of field name -> selector
   */
  async extractData(schema: Record<string, string>, tabId?: string): Promise<Record<string, string>> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<Record<string, string>>('cube_extract_data', { tabId: id, schema });
  }

  /**
   * Extract table data
   */
  async extractTable(tableSelector: string, tabId?: string): Promise<string[][]> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<string[][]>('cube_extract_table', { tabId: id, tableSelector });
  }

  // ============================================
  // PDF Generation
  // ============================================

  /**
   * Generate PDF from page (returns base64)
   */
  async printToPdf(tabId?: string): Promise<string> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    return invoke<string>('cube_print_to_pdf', { tabId: id });
  }

  /**
   * Download PDF to file
   */
  async savePdfToFile(filePath: string, tabId?: string): Promise<void> {
    const pdfBase64 = await this.printToPdf(tabId);
    
    // Convert base64 to binary and save
    const binary = atob(pdfBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Use Tauri filesystem API to write
    await invoke('write_file_binary', {
      path: filePath,
      data: Array.from(bytes),
    });
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Wait for element to appear
   */
  async waitForElement(
    selector: string,
    timeout = 10000,
    tabId?: string
  ): Promise<DOMElement | null> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    const startTime = Date.now();
    const pollInterval = 100;

    while (Date.now() - startTime < timeout) {
      const element = await this.querySelector(selector, id);
      if (element) {
        return element;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    return null;
  }

  /**
   * Wait for page to load
   */
  async waitForNavigation(timeout = 30000, tabId?: string): Promise<void> {
    this.ensureInitialized();
    const id = tabId ?? this.activeTabId;
    if (!id) throw new Error('No active tab');

    const startTime = Date.now();
    const pollInterval = 100;

    while (Date.now() - startTime < timeout) {
      const result = await this.executeScript<string>(
        'document.readyState',
        id
      );
      if (result === 'complete') {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error('Navigation timeout');
  }

  /**
   * Evaluate and return value
   */
  async evaluate<T = unknown>(
    expression: string,
    tabId?: string
  ): Promise<T> {
    return this.executeScript<T>(expression, tabId);
  }

  // ============================================
  // Private Methods
  // ============================================

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('CUBE Browser Engine not initialized. Call initialize() first.');
    }
  }
}

// ============================================
// Export singleton instance
// ============================================

export const cubeEngine = CubeBrowserEngine.getInstance();

// ============================================
// Convenience functions
// ============================================

/**
 * Initialize CUBE Browser Engine
 */
export async function initCubeEngine(config?: Partial<BrowserConfig>): Promise<void> {
  return cubeEngine.initialize(config);
}

/**
 * Create a new tab
 */
export async function createTab(url: string): Promise<BrowserTab> {
  return cubeEngine.createTab(url);
}

/**
 * Navigate to URL
 */
export async function navigateTo(url: string, tabId?: string): Promise<void> {
  return cubeEngine.navigate(tabId ?? cubeEngine.getActiveTab()?.id ?? '', url);
}

/**
 * Execute JavaScript
 */
export async function executeScript<T = unknown>(
  script: string,
  tabId?: string
): Promise<T> {
  return cubeEngine.executeScript<T>(script, tabId);
}

/**
 * Get page HTML
 */
export async function getPageHtml(tabId?: string): Promise<string> {
  return cubeEngine.getPageHtml(tabId);
}

/**
 * Take screenshot
 */
export async function screenshot(
  options?: Partial<ScreenshotOptions>,
  tabId?: string
): Promise<string> {
  return cubeEngine.screenshot(options, tabId);
}

/**
 * Fill form
 */
export async function fillForm(
  data: Record<string, string>,
  tabId?: string
): Promise<void> {
  return cubeEngine.fillForm(data, tabId);
}

/**
 * Extract data
 */
export async function extractData(
  schema: Record<string, string>,
  tabId?: string
): Promise<Record<string, string>> {
  return cubeEngine.extractData(schema, tabId);
}
