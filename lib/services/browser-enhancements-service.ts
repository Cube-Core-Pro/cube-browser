/**
 * CUBE Elite v6 - Browser Enhancements Service
 * 
 * Advanced productivity features competing with:
 * Vivaldi (Web Panels, Tab Stacks), Arc (Sidebar), Opera (Flow), Brave (Speedreader)
 * 
 * Now integrated with Tauri backend for:
 * - Workspace CRUD operations
 * - Tab management within workspaces
 * - Layout and panel management
 * - Focus mode and auto-archive
 * 
 * Features:
 * - Picture-in-Picture Manager
 * - Web Panels (sidebars)
 * - Tab Stacks (vertical grouping)
 * - Enhanced Reader Mode
 * - Split View Management
 * - Workspaces with sync
 * - Flow (cross-device sync)
 * - Speed Dial
 * - Page Actions (quick actions)
 * 
 * @module browser-enhancements-service
 * @version 2.0.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('BrowserEnhancements');

// ============================================================================
// Backend Integration Types
// ============================================================================

interface BackendWorkspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
  layout: BackendWorkspaceLayout;
}

interface BackendWorkspaceLayout {
  mode: string;
  panels: BackendWorkspacePanel[];
}

interface BackendWorkspacePanel {
  id: string;
  tabs: BackendWorkspaceTab[];
  active_tab_id?: string;
}

interface BackendWorkspaceTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  is_pinned: boolean;
  is_muted: boolean;
  created_at: number;
}

interface WorkspaceListResponse {
  workspaces: BackendWorkspace[];
  active_id?: string;
}

interface WorkspaceUpdates {
  name?: string;
  icon?: string;
  color?: string;
}

interface TabUpdates {
  url?: string;
  title?: string;
  is_pinned?: boolean;
  is_muted?: boolean;
}

const BackendWorkspaceAPI = {
  async listWorkspaces(): Promise<WorkspaceListResponse> {
    try {
      return await invoke<WorkspaceListResponse>('workspace_list');
    } catch (error) {
      log.warn('Backend workspace_list failed:', error);
      return { workspaces: [] };
    }
  },

  async createWorkspace(name: string, icon: string, color: string): Promise<BackendWorkspace> {
    try {
      return await invoke<BackendWorkspace>('workspace_create', { name, icon, color });
    } catch (error) {
      log.warn('Backend workspace_create failed:', error);
      throw error;
    }
  },

  async updateWorkspace(id: string, updates: WorkspaceUpdates): Promise<void> {
    try {
      await invoke<void>('workspace_update', { id, updates });
    } catch (error) {
      log.warn('Backend workspace_update failed:', error);
      throw error;
    }
  },

  async deleteWorkspace(id: string): Promise<void> {
    try {
      await invoke<void>('workspace_delete', { id });
    } catch (error) {
      log.warn('Backend workspace_delete failed:', error);
      throw error;
    }
  },

  async switchWorkspace(id: string): Promise<void> {
    try {
      await invoke<void>('workspace_switch', { id });
    } catch (error) {
      log.warn('Backend workspace_switch failed:', error);
    }
  },

  async duplicateWorkspace(id: string): Promise<BackendWorkspace> {
    try {
      return await invoke<BackendWorkspace>('workspace_duplicate', { id });
    } catch (error) {
      log.warn('Backend workspace_duplicate failed:', error);
      throw error;
    }
  },

  async addTab(workspaceId: string, panelId: string, url: string, title: string): Promise<BackendWorkspaceTab> {
    try {
      return await invoke<BackendWorkspaceTab>('workspace_tab_add', { workspaceId, panelId, url, title });
    } catch (error) {
      log.warn('Backend workspace_tab_add failed:', error);
      throw error;
    }
  },

  async removeTab(workspaceId: string, panelId: string, tabId: string): Promise<void> {
    try {
      await invoke<void>('workspace_tab_remove', { workspaceId, panelId, tabId });
    } catch (error) {
      log.warn('Backend workspace_tab_remove failed:', error);
      throw error;
    }
  },

  async updateTab(workspaceId: string, panelId: string, tabId: string, updates: TabUpdates): Promise<void> {
    try {
      await invoke<void>('workspace_tab_update', { workspaceId, panelId, tabId, updates });
    } catch (error) {
      log.warn('Backend workspace_tab_update failed:', error);
      throw error;
    }
  },

  async moveTab(
    fromWorkspaceId: string,
    fromPanelId: string,
    tabId: string,
    toWorkspaceId: string,
    toPanelId: string
  ): Promise<void> {
    try {
      await invoke<void>('workspace_tab_move', {
        fromWorkspaceId,
        fromPanelId,
        tabId,
        toWorkspaceId,
        toPanelId
      });
    } catch (error) {
      log.warn('Backend workspace_tab_move failed:', error);
    }
  },

  async pinTab(workspaceId: string, panelId: string, tabId: string): Promise<void> {
    try {
      await invoke<void>('workspace_tab_pin', { workspaceId, panelId, tabId });
    } catch (error) {
      log.warn('Backend workspace_tab_pin failed:', error);
    }
  },

  async switchTab(workspaceId: string, panelId: string, tabId: string): Promise<void> {
    try {
      await invoke<void>('workspace_tab_switch', { workspaceId, panelId, tabId });
    } catch (error) {
      log.warn('Backend workspace_tab_switch failed:', error);
    }
  },

  async setLayout(workspaceId: string, mode: string): Promise<void> {
    try {
      await invoke<void>('workspace_layout_set', { workspaceId, mode });
    } catch (error) {
      log.warn('Backend workspace_layout_set failed:', error);
    }
  },

  async addPanel(workspaceId: string): Promise<BackendWorkspacePanel> {
    try {
      return await invoke<BackendWorkspacePanel>('workspace_panel_add', { workspaceId });
    } catch (error) {
      log.warn('Backend workspace_panel_add failed:', error);
      throw error;
    }
  },

  async removePanel(workspaceId: string, panelId: string): Promise<void> {
    try {
      await invoke<void>('workspace_panel_remove', { workspaceId, panelId });
    } catch (error) {
      log.warn('Backend workspace_panel_remove failed:', error);
    }
  },

  async toggleFocusMode(workspaceId: string): Promise<void> {
    try {
      await invoke<void>('workspace_focus_mode_toggle', { workspaceId });
    } catch (error) {
      log.warn('Backend workspace_focus_mode_toggle failed:', error);
    }
  },

  async setAutoArchive(workspaceId: string, hours: number | null): Promise<void> {
    try {
      await invoke<void>('workspace_auto_archive_set', { workspaceId, hours });
    } catch (error) {
      log.warn('Backend workspace_auto_archive_set failed:', error);
    }
  },

  async checkAutoArchive(): Promise<void> {
    try {
      await invoke<void>('workspace_auto_archive_check');
    } catch (error) {
      log.warn('Backend workspace_auto_archive_check failed:', error);
    }
  },
};

// Export backend API
export { BackendWorkspaceAPI };
export type { 
  BackendWorkspace, 
  BackendWorkspaceLayout, 
  BackendWorkspacePanel, 
  BackendWorkspaceTab,
  WorkspaceListResponse,
  WorkspaceUpdates,
  TabUpdates
};

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Picture-in-Picture window
 */
export interface PiPWindow {
  /** Unique identifier */
  id: string;
  /** Video source URL */
  sourceUrl: string;
  /** Video title */
  title: string;
  /** Position */
  position: {
    x: number;
    y: number;
  };
  /** Size */
  size: {
    width: number;
    height: number;
  };
  /** Is playing */
  isPlaying: boolean;
  /** Volume (0-1) */
  volume: number;
  /** Is muted */
  isMuted: boolean;
  /** Current time */
  currentTime: number;
  /** Duration */
  duration: number;
  /** Always on top */
  alwaysOnTop: boolean;
  /** Opacity */
  opacity: number;
  /** Created timestamp */
  createdAt: Date;
}

/**
 * PiP preset position
 */
export type PiPPresetPosition = 
  | 'top-left' | 'top-right' 
  | 'bottom-left' | 'bottom-right'
  | 'center';

/**
 * Web panel (sidebar)
 */
export interface WebPanel {
  /** Unique identifier */
  id: string;
  /** Panel title */
  title: string;
  /** Panel URL */
  url: string;
  /** Icon */
  icon?: string;
  /** Width in pixels */
  width: number;
  /** Position (left/right) */
  position: 'left' | 'right';
  /** Mobile view */
  mobileView: boolean;
  /** Auto-refresh interval (ms) */
  refreshInterval?: number;
  /** Is expanded */
  isExpanded: boolean;
  /** Order in panel bar */
  order: number;
  /** Custom CSS */
  customCss?: string;
}

/**
 * Tab stack (vertical group)
 */
export interface TabStack {
  /** Unique identifier */
  id: string;
  /** Stack name */
  name?: string;
  /** Tab IDs in stack */
  tabIds: string[];
  /** Is collapsed */
  isCollapsed: boolean;
  /** Active tab index */
  activeIndex: number;
  /** Color */
  color?: string;
  /** Created timestamp */
  createdAt: Date;
}

/**
 * Reader mode settings
 */
export interface ReaderModeSettings {
  /** Font family */
  fontFamily: 'serif' | 'sans-serif' | 'monospace' | 'custom';
  /** Custom font */
  customFont?: string;
  /** Font size */
  fontSize: number;
  /** Line height */
  lineHeight: number;
  /** Maximum width */
  maxWidth: number;
  /** Background color */
  backgroundColor: string;
  /** Text color */
  textColor: string;
  /** Link color */
  linkColor: string;
  /** Theme */
  theme: 'light' | 'dark' | 'sepia' | 'custom';
  /** Text alignment */
  textAlign: 'left' | 'center' | 'justify';
  /** Show images */
  showImages: boolean;
  /** Estimated read time */
  showReadTime: boolean;
  /** Progress bar */
  showProgress: boolean;
}

/**
 * Reader mode article
 */
export interface ReaderArticle {
  /** URL */
  url: string;
  /** Title */
  title: string;
  /** Author */
  author?: string;
  /** Published date */
  publishedDate?: string;
  /** Content HTML */
  content: string;
  /** Excerpt */
  excerpt?: string;
  /** Lead image */
  leadImage?: string;
  /** Site name */
  siteName?: string;
  /** Word count */
  wordCount: number;
  /** Estimated read time (minutes) */
  readTime: number;
}

/**
 * Split view configuration
 */
export interface SplitView {
  /** Unique identifier */
  id: string;
  /** Layout type */
  layout: 'horizontal' | 'vertical' | 'grid';
  /** Panes */
  panes: SplitPane[];
  /** Is synced scroll */
  syncScroll: boolean;
  /** Created timestamp */
  createdAt: Date;
}

/**
 * Split view pane
 */
export interface SplitPane {
  /** Unique identifier */
  id: string;
  /** Tab ID */
  tabId: string;
  /** URL */
  url: string;
  /** Size percentage */
  size: number;
  /** Position */
  position: number;
}

/**
 * Workspace (browser context)
 */
export interface Workspace {
  /** Unique identifier */
  id: string;
  /** Workspace name */
  name: string;
  /** Description */
  description?: string;
  /** Icon/emoji */
  icon: string;
  /** Color */
  color: string;
  /** Tabs */
  tabs: WorkspaceTab[];
  /** Is active */
  isActive: boolean;
  /** Created timestamp */
  createdAt: Date;
  /** Last accessed */
  lastAccessed: Date;
  /** Sync enabled */
  syncEnabled: boolean;
  /** Sync ID */
  syncId?: string;
}

/**
 * Workspace tab
 */
export interface WorkspaceTab {
  /** Tab ID */
  id: string;
  /** URL */
  url: string;
  /** Title */
  title: string;
  /** Favicon */
  favicon?: string;
  /** Is pinned */
  pinned: boolean;
  /** Group/stack ID */
  groupId?: string;
}

/**
 * Flow item (cross-device sync)
 */
export interface FlowItem {
  /** Unique identifier */
  id: string;
  /** Item type */
  type: 'link' | 'text' | 'file' | 'image';
  /** Content */
  content: string;
  /** Title */
  title?: string;
  /** Thumbnail */
  thumbnail?: string;
  /** Source device */
  sourceDevice: string;
  /** Timestamp */
  timestamp: Date;
  /** Is read */
  isRead: boolean;
}

/**
 * Speed dial item
 */
export interface SpeedDialItem {
  /** Unique identifier */
  id: string;
  /** Title */
  title: string;
  /** URL */
  url: string;
  /** Thumbnail (screenshot) */
  thumbnail?: string;
  /** Favicon */
  favicon?: string;
  /** Background color */
  backgroundColor?: string;
  /** Position */
  position: number;
  /** Folder ID */
  folderId?: string;
  /** Visit count */
  visitCount: number;
  /** Last visited */
  lastVisited?: Date;
}

/**
 * Speed dial folder
 */
export interface SpeedDialFolder {
  /** Unique identifier */
  id: string;
  /** Folder name */
  name: string;
  /** Position */
  position: number;
  /** Color */
  color: string;
}

/**
 * Page action (quick action)
 */
export interface PageAction {
  /** Unique identifier */
  id: string;
  /** Action name */
  name: string;
  /** Description */
  description?: string;
  /** Icon */
  icon: string;
  /** Action type */
  type: 'script' | 'bookmark' | 'command' | 'link';
  /** Action content */
  content: string;
  /** URL pattern */
  pattern?: string;
  /** Keyboard shortcut */
  shortcut?: string;
  /** Is enabled */
  enabled: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default reader mode settings
 */
const DEFAULT_READER_SETTINGS: ReaderModeSettings = {
  fontFamily: 'serif',
  fontSize: 20,
  lineHeight: 1.8,
  maxWidth: 700,
  backgroundColor: '#fffdf7',
  textColor: '#1a1a1a',
  linkColor: '#2563eb',
  theme: 'light',
  textAlign: 'left',
  showImages: true,
  showReadTime: true,
  showProgress: true,
};

/**
 * Reader themes
 */
const READER_THEMES = {
  light: {
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    linkColor: '#2563eb',
  },
  dark: {
    backgroundColor: '#1a1a1a',
    textColor: '#e5e5e5',
    linkColor: '#60a5fa',
  },
  sepia: {
    backgroundColor: '#f4ecd8',
    textColor: '#5b4636',
    linkColor: '#7c4a03',
  },
};

/**
 * Default PiP size
 */
const DEFAULT_PIP_SIZE = { width: 400, height: 225 };

/**
 * Default web panels
 */
const DEFAULT_PANELS: Partial<WebPanel>[] = [
  { title: 'Messenger', url: 'https://www.messenger.com', icon: '💬' },
  { title: 'WhatsApp', url: 'https://web.whatsapp.com', icon: '📱' },
  { title: 'Twitter', url: 'https://twitter.com', icon: '🐦' },
  { title: 'Spotify', url: 'https://open.spotify.com', icon: '🎵' },
];

/**
 * Workspace colors
 */
const WORKSPACE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

/**
 * Workspace icons
 */
const WORKSPACE_ICONS = [
  '💼', '🏠', '🎮', '📚', '🎨', '🛒', '💰', '✈️',
  '🎵', '📧', '🔬', '🎯', '🌟', '🔥', '⚡', '🌈',
];

/**
 * IndexedDB configuration
 */
const DB_NAME = 'cube_browser_enhancements';
const DB_VERSION = 1;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get PiP preset position coordinates
 */
function getPiPPresetCoordinates(
  preset: PiPPresetPosition,
  windowSize: { width: number; height: number },
  pipSize: { width: number; height: number }
): { x: number; y: number } {
  const margin = 20;
  
  switch (preset) {
    case 'top-left':
      return { x: margin, y: margin };
    case 'top-right':
      return { x: windowSize.width - pipSize.width - margin, y: margin };
    case 'bottom-left':
      return { x: margin, y: windowSize.height - pipSize.height - margin };
    case 'bottom-right':
      return { 
        x: windowSize.width - pipSize.width - margin, 
        y: windowSize.height - pipSize.height - margin 
      };
    case 'center':
      return {
        x: (windowSize.width - pipSize.width) / 2,
        y: (windowSize.height - pipSize.height) / 2,
      };
    default:
      return { x: margin, y: margin };
  }
}

/**
 * Extract readable content from HTML
 */
function extractReadableContent(html: string, url: string): ReaderArticle {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Remove scripts, styles, ads
  const removeSelectors = [
    'script', 'style', 'nav', 'header', 'footer', 'aside',
    '[class*="ad-"]', '[class*="advertisement"]', '[class*="sidebar"]',
    '[id*="sidebar"]', '[class*="comment"]', '[class*="share"]',
    '[class*="social"]', '[class*="related"]', '[class*="recommend"]',
  ];
  
  for (const selector of removeSelectors) {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  }

  // Try to find article content
  const articleSelectors = [
    'article', 'main', '[role="main"]', '.post-content',
    '.article-content', '.entry-content', '.content',
  ];
  
  let contentEl: Element | null = null;
  for (const selector of articleSelectors) {
    contentEl = doc.querySelector(selector);
    if (contentEl) break;
  }
  
  if (!contentEl) {
    contentEl = doc.body;
  }

  // Get title
  const title = 
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.querySelector('h1')?.textContent ||
    doc.querySelector('title')?.textContent ||
    'Untitled';

  // Get author
  const author = 
    doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
    doc.querySelector('[rel="author"]')?.textContent ||
    doc.querySelector('.author')?.textContent;

  // Get published date
  const publishedDate = 
    doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
    doc.querySelector('time')?.getAttribute('datetime') ||
    doc.querySelector('.date')?.textContent;

  // Get lead image
  const leadImage = 
    doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    doc.querySelector('article img')?.getAttribute('src');

  // Get site name
  const siteName = 
    doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
    new URL(url).hostname;

  // Clean content
  const content = contentEl.innerHTML;

  // Count words
  const textContent = contentEl.textContent || '';
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
  const readTime = Math.ceil(wordCount / 200);

  // Get excerpt
  const firstParagraph = contentEl.querySelector('p');
  const excerpt = firstParagraph?.textContent?.slice(0, 200);

  return {
    url,
    title: title.trim(),
    author: author?.trim(),
    publishedDate,
    content,
    excerpt,
    leadImage: leadImage ? new URL(leadImage, url).href : undefined,
    siteName,
    wordCount,
    readTime,
  };
}

// ============================================================================
// Picture-in-Picture Service
// ============================================================================

/**
 * Manages PiP windows
 */
export class PiPService {
  private windows: Map<string, PiPWindow> = new Map();
  private listeners: Set<(windows: PiPWindow[]) => void> = new Set();

  /**
   * Create PiP window
   */
  createWindow(
    sourceUrl: string,
    title: string,
    position: PiPPresetPosition = 'bottom-right'
  ): PiPWindow {
    const coords = getPiPPresetCoordinates(
      position,
      { width: window.innerWidth, height: window.innerHeight },
      DEFAULT_PIP_SIZE
    );

    const pipWindow: PiPWindow = {
      id: `pip-${generateId()}`,
      sourceUrl,
      title,
      position: coords,
      size: { ...DEFAULT_PIP_SIZE },
      isPlaying: true,
      volume: 1,
      isMuted: false,
      currentTime: 0,
      duration: 0,
      alwaysOnTop: true,
      opacity: 1,
      createdAt: new Date(),
    };

    this.windows.set(pipWindow.id, pipWindow);
    this.notifyListeners();
    return pipWindow;
  }

  /**
   * Close PiP window
   */
  closeWindow(id: string): void {
    this.windows.delete(id);
    this.notifyListeners();
  }

  /**
   * Update window position
   */
  updatePosition(id: string, position: { x: number; y: number }): void {
    const window = this.windows.get(id);
    if (window) {
      window.position = position;
      this.notifyListeners();
    }
  }

  /**
   * Update window size
   */
  updateSize(id: string, size: { width: number; height: number }): void {
    const window = this.windows.get(id);
    if (window) {
      window.size = size;
      this.notifyListeners();
    }
  }

  /**
   * Toggle play/pause
   */
  togglePlay(id: string): void {
    const window = this.windows.get(id);
    if (window) {
      window.isPlaying = !window.isPlaying;
      this.notifyListeners();
    }
  }

  /**
   * Toggle mute
   */
  toggleMute(id: string): void {
    const window = this.windows.get(id);
    if (window) {
      window.isMuted = !window.isMuted;
      this.notifyListeners();
    }
  }

  /**
   * Set volume
   */
  setVolume(id: string, volume: number): void {
    const window = this.windows.get(id);
    if (window) {
      window.volume = Math.max(0, Math.min(1, volume));
      this.notifyListeners();
    }
  }

  /**
   * Set opacity
   */
  setOpacity(id: string, opacity: number): void {
    const window = this.windows.get(id);
    if (window) {
      window.opacity = Math.max(0.1, Math.min(1, opacity));
      this.notifyListeners();
    }
  }

  /**
   * Snap to preset position
   */
  snapToPosition(id: string, preset: PiPPresetPosition): void {
    const window = this.windows.get(id);
    if (window) {
      window.position = getPiPPresetCoordinates(
        preset,
        { width: globalThis.window?.innerWidth || 1920, height: globalThis.window?.innerHeight || 1080 },
        window.size
      );
      this.notifyListeners();
    }
  }

  /**
   * Get all windows
   */
  getWindows(): PiPWindow[] {
    return Array.from(this.windows.values());
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: (windows: PiPWindow[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const windows = this.getWindows();
    this.listeners.forEach(l => l(windows));
  }
}

// ============================================================================
// Web Panels Service (Vivaldi Style)
// ============================================================================

/**
 * Manages sidebar web panels
 */
export class WebPanelsService {
  private panels: Map<string, WebPanel> = new Map();
  private activePanel: string | null = null;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.loadPanels().then(resolve);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('panels')) {
          db.createObjectStore('panels', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tab_stacks')) {
          db.createObjectStore('tab_stacks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('workspaces')) {
          const store = db.createObjectStore('workspaces', { keyPath: 'id' });
          store.createIndex('isActive', 'isActive', { unique: false });
        }
        if (!db.objectStoreNames.contains('speed_dial')) {
          db.createObjectStore('speed_dial', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('page_actions')) {
          db.createObjectStore('page_actions', { keyPath: 'id' });
        }
      };
    });
  }

  private async loadPanels(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['panels'], 'readonly');
      const store = transaction.objectStore('panels');
      const request = store.getAll();

      request.onsuccess = () => {
        if (request.result.length === 0) {
          // Add default panels
          for (const panel of DEFAULT_PANELS) {
            this.addPanel(
              panel.title!,
              panel.url!,
              panel.icon
            );
          }
        } else {
          for (const panel of request.result) {
            this.panels.set(panel.id, panel);
          }
        }
        resolve();
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Add web panel
   */
  async addPanel(
    title: string,
    url: string,
    icon?: string
  ): Promise<WebPanel> {
    const panel: WebPanel = {
      id: `panel-${generateId()}`,
      title,
      url,
      icon,
      width: 400,
      position: 'left',
      mobileView: true,
      isExpanded: false,
      order: this.panels.size,
    };

    this.panels.set(panel.id, panel);
    await this.savePanel(panel);
    return panel;
  }

  /**
   * Save panel to DB
   */
  private async savePanel(panel: WebPanel): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['panels'], 'readwrite');
      const store = transaction.objectStore('panels');
      const request = store.put(panel);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Remove panel
   */
  async removePanel(id: string): Promise<void> {
    this.panels.delete(id);
    if (this.activePanel === id) {
      this.activePanel = null;
    }

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['panels'], 'readwrite');
        const store = transaction.objectStore('panels');
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Toggle panel
   */
  togglePanel(id: string): boolean {
    if (this.activePanel === id) {
      const panel = this.panels.get(id);
      if (panel) {
        panel.isExpanded = !panel.isExpanded;
        if (!panel.isExpanded) {
          this.activePanel = null;
        }
        return panel.isExpanded;
      }
    } else {
      // Close previous panel
      if (this.activePanel) {
        const prev = this.panels.get(this.activePanel);
        if (prev) prev.isExpanded = false;
      }
      // Open new panel
      const panel = this.panels.get(id);
      if (panel) {
        panel.isExpanded = true;
        this.activePanel = id;
        return true;
      }
    }
    return false;
  }

  /**
   * Update panel width
   */
  async updateWidth(id: string, width: number): Promise<void> {
    const panel = this.panels.get(id);
    if (panel) {
      panel.width = Math.max(200, Math.min(800, width));
      await this.savePanel(panel);
    }
  }

  /**
   * Toggle mobile view
   */
  async toggleMobileView(id: string): Promise<boolean> {
    const panel = this.panels.get(id);
    if (panel) {
      panel.mobileView = !panel.mobileView;
      await this.savePanel(panel);
      return panel.mobileView;
    }
    return false;
  }

  /**
   * Set refresh interval
   */
  async setRefreshInterval(id: string, interval?: number): Promise<void> {
    const panel = this.panels.get(id);
    if (panel) {
      panel.refreshInterval = interval;
      await this.savePanel(panel);
    }
  }

  /**
   * Reorder panels
   */
  async reorderPanels(panelIds: string[]): Promise<void> {
    for (let i = 0; i < panelIds.length; i++) {
      const panel = this.panels.get(panelIds[i]);
      if (panel) {
        panel.order = i;
        await this.savePanel(panel);
      }
    }
  }

  /**
   * Get all panels
   */
  getPanels(): WebPanel[] {
    return Array.from(this.panels.values())
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get active panel
   */
  getActivePanel(): WebPanel | null {
    return this.activePanel ? this.panels.get(this.activePanel) || null : null;
  }
}

// ============================================================================
// Tab Stacks Service
// ============================================================================

/**
 * Manages tab stacks (vertical groups)
 */
export class TabStacksService {
  private stacks: Map<string, TabStack> = new Map();
  private db: IDBDatabase | null = null;

  async init(db: IDBDatabase): Promise<void> {
    this.db = db;
    await this.loadStacks();
  }

  private async loadStacks(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['tab_stacks'], 'readonly');
      const store = transaction.objectStore('tab_stacks');
      const request = store.getAll();

      request.onsuccess = () => {
        for (const stack of request.result) {
          this.stacks.set(stack.id, {
            ...stack,
            createdAt: new Date(stack.createdAt),
          });
        }
        resolve();
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Create tab stack
   */
  async createStack(tabIds: string[], name?: string): Promise<TabStack> {
    const stack: TabStack = {
      id: `stack-${generateId()}`,
      name,
      tabIds,
      isCollapsed: false,
      activeIndex: 0,
      createdAt: new Date(),
    };

    this.stacks.set(stack.id, stack);
    await this.saveStack(stack);
    return stack;
  }

  /**
   * Save stack to DB
   */
  private async saveStack(stack: TabStack): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tab_stacks'], 'readwrite');
      const store = transaction.objectStore('tab_stacks');
      
      const storable = {
        ...stack,
        createdAt: stack.createdAt.toISOString(),
      };

      const request = store.put(storable);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Add tab to stack
   */
  async addTab(stackId: string, tabId: string): Promise<void> {
    const stack = this.stacks.get(stackId);
    if (stack && !stack.tabIds.includes(tabId)) {
      stack.tabIds.push(tabId);
      await this.saveStack(stack);
    }
  }

  /**
   * Remove tab from stack
   */
  async removeTab(stackId: string, tabId: string): Promise<void> {
    const stack = this.stacks.get(stackId);
    if (stack) {
      stack.tabIds = stack.tabIds.filter(id => id !== tabId);
      if (stack.tabIds.length === 0) {
        await this.deleteStack(stackId);
      } else {
        if (stack.activeIndex >= stack.tabIds.length) {
          stack.activeIndex = stack.tabIds.length - 1;
        }
        await this.saveStack(stack);
      }
    }
  }

  /**
   * Toggle stack collapse
   */
  async toggleCollapse(stackId: string): Promise<boolean> {
    const stack = this.stacks.get(stackId);
    if (stack) {
      stack.isCollapsed = !stack.isCollapsed;
      await this.saveStack(stack);
      return stack.isCollapsed;
    }
    return false;
  }

  /**
   * Set active tab in stack
   */
  async setActiveTab(stackId: string, index: number): Promise<void> {
    const stack = this.stacks.get(stackId);
    if (stack && index >= 0 && index < stack.tabIds.length) {
      stack.activeIndex = index;
      await this.saveStack(stack);
    }
  }

  /**
   * Delete stack (ungroup tabs)
   */
  async deleteStack(stackId: string): Promise<void> {
    this.stacks.delete(stackId);

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['tab_stacks'], 'readwrite');
        const store = transaction.objectStore('tab_stacks');
        const request = store.delete(stackId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Get all stacks
   */
  getStacks(): TabStack[] {
    return Array.from(this.stacks.values());
  }

  /**
   * Get stack for tab
   */
  getStackForTab(tabId: string): TabStack | null {
    for (const stack of this.stacks.values()) {
      if (stack.tabIds.includes(tabId)) {
        return stack;
      }
    }
    return null;
  }
}

// ============================================================================
// Reader Mode Service (Brave Style)
// ============================================================================

/**
 * Manages reader mode
 */
export class ReaderModeService {
  private settings: ReaderModeSettings = { ...DEFAULT_READER_SETTINGS };
  private articles: Map<string, ReaderArticle> = new Map();

  /**
   * Parse page for reader mode
   */
  parseArticle(html: string, url: string): ReaderArticle {
    const article = extractReadableContent(html, url);
    this.articles.set(url, article);
    return article;
  }

  /**
   * Get cached article
   */
  getArticle(url: string): ReaderArticle | null {
    return this.articles.get(url) || null;
  }

  /**
   * Check if page is readable
   */
  isReadable(html: string): boolean {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Check for article-like content
    const articleEl = doc.querySelector('article, main, .post-content, .article-content');
    if (articleEl) return true;

    // Check paragraph count
    const paragraphs = doc.querySelectorAll('p');
    const longParagraphs = Array.from(paragraphs).filter(
      p => (p.textContent?.length || 0) > 100
    );
    
    return longParagraphs.length >= 3;
  }

  /**
   * Get settings
   */
  getSettings(): ReaderModeSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<ReaderModeSettings>): void {
    this.settings = { ...this.settings, ...updates };
    
    // Save to localStorage
    localStorage.setItem('reader_settings', JSON.stringify(this.settings));
  }

  /**
   * Apply theme
   */
  applyTheme(theme: 'light' | 'dark' | 'sepia'): void {
    const colors = READER_THEMES[theme];
    this.updateSettings({
      theme,
      ...colors,
    });
  }

  /**
   * Generate reader HTML
   */
  generateReaderHtml(article: ReaderArticle): string {
    const s = this.settings;
    
    return `<!DOCTYPE html>
<html>
<head>
  <title>${article.title}</title>
  <style>
    * { box-sizing: border-box; }
    
    body {
      font-family: ${s.fontFamily === 'custom' ? s.customFont : 
        s.fontFamily === 'serif' ? 'Georgia, "Times New Roman", serif' :
        s.fontFamily === 'sans-serif' ? 'system-ui, -apple-system, sans-serif' :
        'ui-monospace, "SF Mono", monospace'};
      font-size: ${s.fontSize}px;
      line-height: ${s.lineHeight};
      background-color: ${s.backgroundColor};
      color: ${s.textColor};
      max-width: ${s.maxWidth}px;
      margin: 0 auto;
      padding: 40px 20px;
      text-align: ${s.textAlign};
    }
    
    a { color: ${s.linkColor}; }
    
    h1 {
      font-size: 2em;
      line-height: 1.3;
      margin-bottom: 0.5em;
    }
    
    .meta {
      color: ${s.textColor}80;
      font-size: 0.9em;
      margin-bottom: 2em;
      padding-bottom: 1em;
      border-bottom: 1px solid ${s.textColor}20;
    }
    
    .lead-image {
      width: 100%;
      max-height: 400px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 2em;
    }
    
    img {
      max-width: 100%;
      height: auto;
      ${s.showImages ? '' : 'display: none;'}
    }
    
    p { margin: 1em 0; }
    
    blockquote {
      border-left: 3px solid ${s.linkColor};
      padding-left: 1em;
      margin-left: 0;
      color: ${s.textColor}cc;
    }
    
    pre, code {
      background: ${s.textColor}10;
      border-radius: 4px;
    }
    
    pre {
      padding: 1em;
      overflow-x: auto;
    }
    
    code {
      padding: 0.2em 0.4em;
      font-size: 0.9em;
    }
    
    .progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background: ${s.linkColor};
      transition: width 0.1s;
      ${s.showProgress ? '' : 'display: none;'}
    }
  </style>
</head>
<body>
  <div class="progress-bar" id="progress"></div>
  
  <article>
    <h1>${article.title}</h1>
    
    <div class="meta">
      ${article.author ? `<span>By ${article.author}</span>` : ''}
      ${article.publishedDate ? `<span> · ${new Date(article.publishedDate).toLocaleDateString()}</span>` : ''}
      ${s.showReadTime ? `<span> · ${article.readTime} min read</span>` : ''}
    </div>
    
    ${article.leadImage ? `<img class="lead-image" src="${article.leadImage}" alt="">` : ''}
    
    ${article.content}
  </article>
  
  <script>
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrolled / max) * 100;
      document.getElementById('progress').style.width = progress + '%';
    });
  </script>
</body>
</html>`;
  }
}

// ============================================================================
// Workspaces Service
// ============================================================================

/**
 * Manages browser workspaces
 */
export class WorkspacesService {
  private workspaces: Map<string, Workspace> = new Map();
  private activeWorkspace: string | null = null;
  private db: IDBDatabase | null = null;

  async init(db: IDBDatabase): Promise<void> {
    this.db = db;
    await this.loadWorkspaces();
  }

  private async loadWorkspaces(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['workspaces'], 'readonly');
      const store = transaction.objectStore('workspaces');
      const request = store.getAll();

      request.onsuccess = () => {
        if (request.result.length === 0) {
          // Create default workspace
          this.createWorkspace('Personal', '🏠').then(() => resolve());
        } else {
          for (const workspace of request.result) {
            this.workspaces.set(workspace.id, {
              ...workspace,
              createdAt: new Date(workspace.createdAt),
              lastAccessed: new Date(workspace.lastAccessed),
            });
            if (workspace.isActive) {
              this.activeWorkspace = workspace.id;
            }
          }
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Create workspace
   */
  async createWorkspace(name: string, icon?: string): Promise<Workspace> {
    const workspace: Workspace = {
      id: `ws-${generateId()}`,
      name,
      icon: icon || WORKSPACE_ICONS[this.workspaces.size % WORKSPACE_ICONS.length],
      color: WORKSPACE_COLORS[this.workspaces.size % WORKSPACE_COLORS.length],
      tabs: [],
      isActive: this.workspaces.size === 0,
      createdAt: new Date(),
      lastAccessed: new Date(),
      syncEnabled: false,
    };

    this.workspaces.set(workspace.id, workspace);
    if (workspace.isActive) {
      this.activeWorkspace = workspace.id;
    }
    await this.saveWorkspace(workspace);
    return workspace;
  }

  /**
   * Save workspace to DB
   */
  private async saveWorkspace(workspace: Workspace): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['workspaces'], 'readwrite');
      const store = transaction.objectStore('workspaces');
      
      const storable = {
        ...workspace,
        createdAt: workspace.createdAt.toISOString(),
        lastAccessed: workspace.lastAccessed.toISOString(),
      };

      const request = store.put(storable);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Switch to workspace
   */
  async switchWorkspace(id: string): Promise<Workspace | null> {
    const workspace = this.workspaces.get(id);
    if (!workspace) return null;

    // Deactivate current
    if (this.activeWorkspace && this.activeWorkspace !== id) {
      const current = this.workspaces.get(this.activeWorkspace);
      if (current) {
        current.isActive = false;
        await this.saveWorkspace(current);
      }
    }

    // Activate new
    workspace.isActive = true;
    workspace.lastAccessed = new Date();
    this.activeWorkspace = id;
    await this.saveWorkspace(workspace);

    return workspace;
  }

  /**
   * Add tab to workspace
   */
  async addTab(workspaceId: string, tab: Omit<WorkspaceTab, 'id'>): Promise<void> {
    const workspace = this.workspaces.get(workspaceId);
    if (workspace) {
      workspace.tabs.push({
        ...tab,
        id: `tab-${generateId()}`,
      });
      await this.saveWorkspace(workspace);
    }
  }

  /**
   * Remove tab from workspace
   */
  async removeTab(workspaceId: string, tabId: string): Promise<void> {
    const workspace = this.workspaces.get(workspaceId);
    if (workspace) {
      workspace.tabs = workspace.tabs.filter(t => t.id !== tabId);
      await this.saveWorkspace(workspace);
    }
  }

  /**
   * Update workspace
   */
  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<void> {
    const workspace = this.workspaces.get(id);
    if (workspace) {
      Object.assign(workspace, updates);
      await this.saveWorkspace(workspace);
    }
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(id: string): Promise<void> {
    if (id === this.activeWorkspace) {
      throw new Error('Cannot delete active workspace');
    }

    this.workspaces.delete(id);

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['workspaces'], 'readwrite');
        const store = transaction.objectStore('workspaces');
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Get all workspaces
   */
  getWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values())
      .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());
  }

  /**
   * Get active workspace
   */
  getActiveWorkspace(): Workspace | null {
    return this.activeWorkspace ? this.workspaces.get(this.activeWorkspace) || null : null;
  }

  /**
   * Enable sync for workspace
   */
  async enableSync(id: string): Promise<string> {
    const workspace = this.workspaces.get(id);
    if (workspace) {
      workspace.syncEnabled = true;
      workspace.syncId = `sync-${generateId()}`;
      await this.saveWorkspace(workspace);
      return workspace.syncId;
    }
    throw new Error('Workspace not found');
  }
}

// ============================================================================
// Speed Dial Service
// ============================================================================

/**
 * Manages speed dial
 */
export class SpeedDialService {
  private items: Map<string, SpeedDialItem> = new Map();
  private folders: Map<string, SpeedDialFolder> = new Map();
  private db: IDBDatabase | null = null;

  async init(db: IDBDatabase): Promise<void> {
    this.db = db;
    await this.loadItems();
  }

  private async loadItems(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['speed_dial'], 'readonly');
      const store = transaction.objectStore('speed_dial');
      const request = store.getAll();

      request.onsuccess = () => {
        for (const item of request.result) {
          if (item.type === 'folder') {
            this.folders.set(item.id, item);
          } else {
            this.items.set(item.id, {
              ...item,
              lastVisited: item.lastVisited ? new Date(item.lastVisited) : undefined,
            });
          }
        }
        resolve();
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Add speed dial item
   */
  async addItem(
    title: string,
    url: string,
    thumbnail?: string,
    folderId?: string
  ): Promise<SpeedDialItem> {
    const item: SpeedDialItem = {
      id: `sd-${generateId()}`,
      title,
      url,
      thumbnail,
      position: this.items.size,
      folderId,
      visitCount: 0,
    };

    this.items.set(item.id, item);
    await this.saveItem(item);
    return item;
  }

  /**
   * Save item to DB
   */
  private async saveItem(item: SpeedDialItem | SpeedDialFolder): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['speed_dial'], 'readwrite');
      const store = transaction.objectStore('speed_dial');
      const request = store.put(item);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Create folder
   */
  async createFolder(name: string): Promise<SpeedDialFolder> {
    const folder: SpeedDialFolder = {
      id: `folder-${generateId()}`,
      name,
      position: this.folders.size,
      color: WORKSPACE_COLORS[this.folders.size % WORKSPACE_COLORS.length],
    };

    this.folders.set(folder.id, folder);
    await this.saveItem(folder as unknown as SpeedDialItem);
    return folder;
  }

  /**
   * Record visit
   */
  async recordVisit(id: string): Promise<void> {
    const item = this.items.get(id);
    if (item) {
      item.visitCount++;
      item.lastVisited = new Date();
      await this.saveItem(item);
    }
  }

  /**
   * Update thumbnail
   */
  async updateThumbnail(id: string, thumbnail: string): Promise<void> {
    const item = this.items.get(id);
    if (item) {
      item.thumbnail = thumbnail;
      await this.saveItem(item);
    }
  }

  /**
   * Remove item
   */
  async removeItem(id: string): Promise<void> {
    this.items.delete(id);

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['speed_dial'], 'readwrite');
        const store = transaction.objectStore('speed_dial');
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Get items
   */
  getItems(folderId?: string): SpeedDialItem[] {
    return Array.from(this.items.values())
      .filter(i => i.folderId === folderId)
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Get folders
   */
  getFolders(): SpeedDialFolder[] {
    return Array.from(this.folders.values())
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Get most visited
   */
  getMostVisited(limit: number = 10): SpeedDialItem[] {
    return Array.from(this.items.values())
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, limit);
  }
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for browser enhancements
 */
export function useBrowserEnhancements() {
  const [pipWindows, setPipWindows] = useState<PiPWindow[]>([]);
  const [panels, setPanels] = useState<WebPanel[]>([]);
  const [stacks, setStacks] = useState<TabStack[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [speedDial, setSpeedDial] = useState<SpeedDialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const pipServiceRef = useRef<PiPService | null>(null);
  const panelsServiceRef = useRef<WebPanelsService | null>(null);
  const stacksServiceRef = useRef<TabStacksService | null>(null);
  const readerServiceRef = useRef<ReaderModeService | null>(null);
  const workspacesServiceRef = useRef<WorkspacesService | null>(null);
  const speedDialServiceRef = useRef<SpeedDialService | null>(null);

  // Initialize services
  useEffect(() => {
    const init = async () => {
      pipServiceRef.current = new PiPService();
      readerServiceRef.current = new ReaderModeService();
      panelsServiceRef.current = new WebPanelsService();

      await panelsServiceRef.current.init();
      
      const db = (panelsServiceRef.current as unknown as { db: IDBDatabase }).db;
      if (db) {
        stacksServiceRef.current = new TabStacksService();
        workspacesServiceRef.current = new WorkspacesService();
        speedDialServiceRef.current = new SpeedDialService();

        await stacksServiceRef.current.init(db);
        await workspacesServiceRef.current.init(db);
        await speedDialServiceRef.current.init(db);
      }

      // Subscribe to PiP changes
      pipServiceRef.current.subscribe(setPipWindows);

      // Load data
      setPanels(panelsServiceRef.current.getPanels());
      setStacks(stacksServiceRef.current?.getStacks() || []);
      setWorkspaces(workspacesServiceRef.current?.getWorkspaces() || []);
      setSpeedDial(speedDialServiceRef.current?.getItems() || []);
      setIsLoading(false);
    };

    init();

    return () => {
      // Cleanup subscriptions
    };
  }, []);

  // PiP actions
  const createPiP = useCallback((sourceUrl: string, title: string) => {
    return pipServiceRef.current?.createWindow(sourceUrl, title);
  }, []);

  const closePiP = useCallback((id: string) => {
    pipServiceRef.current?.closeWindow(id);
  }, []);

  // Panel actions
  const addPanel = useCallback(async (title: string, url: string, icon?: string) => {
    const panel = await panelsServiceRef.current?.addPanel(title, url, icon);
    if (panel) {
      setPanels(panelsServiceRef.current!.getPanels());
    }
    return panel;
  }, []);

  const togglePanel = useCallback((id: string) => {
    panelsServiceRef.current?.togglePanel(id);
    setPanels([...panelsServiceRef.current!.getPanels()]);
  }, []);

  // Workspace actions
  const createWorkspace = useCallback(async (name: string, icon?: string) => {
    const workspace = await workspacesServiceRef.current?.createWorkspace(name, icon);
    if (workspace) {
      setWorkspaces(workspacesServiceRef.current!.getWorkspaces());
    }
    return workspace;
  }, []);

  const switchWorkspace = useCallback(async (id: string) => {
    await workspacesServiceRef.current?.switchWorkspace(id);
    setWorkspaces(workspacesServiceRef.current!.getWorkspaces());
  }, []);

  // Reader mode
  const parseForReader = useCallback((html: string, url: string) => {
    return readerServiceRef.current?.parseArticle(html, url);
  }, []);

  const getReaderHtml = useCallback((article: ReaderArticle) => {
    return readerServiceRef.current?.generateReaderHtml(article);
  }, []);

  return {
    // State
    pipWindows,
    panels,
    stacks,
    workspaces,
    speedDial,
    isLoading,

    // PiP
    createPiP,
    closePiP,

    // Panels
    addPanel,
    togglePanel,
    getActivePanel: () => panelsServiceRef.current?.getActivePanel(),

    // Workspaces
    createWorkspace,
    switchWorkspace,
    getActiveWorkspace: () => workspacesServiceRef.current?.getActiveWorkspace(),

    // Reader mode
    parseForReader,
    getReaderHtml,
    getReaderSettings: () => readerServiceRef.current?.getSettings(),
    updateReaderSettings: (settings: Partial<ReaderModeSettings>) => {
      readerServiceRef.current?.updateSettings(settings);
    },

    // Services
    services: {
      pip: pipServiceRef.current,
      panels: panelsServiceRef.current,
      stacks: stacksServiceRef.current,
      reader: readerServiceRef.current,
      workspaces: workspacesServiceRef.current,
      speedDial: speedDialServiceRef.current,
    },
  };
}

// ============================================================================
// Export
// ============================================================================

export {
  DEFAULT_READER_SETTINGS,
  READER_THEMES,
  WORKSPACE_COLORS,
  WORKSPACE_ICONS,
};
