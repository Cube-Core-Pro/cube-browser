/**
 * CUBE Elite v6 - Browser Advanced Features Service
 * 
 * Enterprise-grade browser features competing with:
 * Opera GX, Arc, Vivaldi, Brave, Edge, Firefox
 * 
 * Features:
 * - Resource Limiter (CPU/RAM/Network) - Opera GX style
 * - Tab Islands/Visual Grouping - Opera One style
 * - Multi-Account Containers - Firefox style
 * - Sleeping/Hibernating Tabs - Edge style
 * - Site-Specific CSS/JS (Boosts) - Arc style
 * - Session Management - Vivaldi style
 * - Snooze Tabs - SigmaOS style
 * - Command Bar - Arc/Vivaldi style
 * - Focus Mode - SigmaOS style
 * - Picture-in-Picture - Firefox style
 * 
 * Now integrated with Tauri backend browser commands
 * 
 * @module browser-advanced-service
 * @version 1.1.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('Browser');

// ============================================================================
// Backend Integration
// ============================================================================

interface BackendTabInfo {
  id: string;
  url: string;
  title: string;
}

interface BackendElementInfo {
  tag_name: string;
  text: string;
  attributes: Record<string, string>;
  is_visible: boolean;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const BackendBrowserAPI = {
  async launch(): Promise<string> {
    try {
      return await invoke<string>('browser_launch');
    } catch (error) {
      log.warn('Backend browser launch failed:', error);
      throw error;
    }
  },

  async isRunning(): Promise<boolean> {
    try {
      return await invoke<boolean>('browser_is_running');
    } catch (error) {
      log.warn('Backend browser isRunning failed:', error);
      return false;
    }
  },

  async close(): Promise<void> {
    try {
      await invoke<void>('browser_close');
    } catch (error) {
      log.warn('Backend browser close failed:', error);
    }
  },

  async newTab(): Promise<string> {
    try {
      return await invoke<string>('browser_new_tab');
    } catch (error) {
      log.warn('Backend newTab failed:', error);
      throw error;
    }
  },

  async closeTab(tabId: string): Promise<void> {
    try {
      await invoke<void>('browser_close_tab', { tabId });
    } catch (error) {
      log.warn('Backend closeTab failed:', error);
    }
  },

  async getTabs(): Promise<BackendTabInfo[]> {
    try {
      return await invoke<BackendTabInfo[]>('browser_get_tabs');
    } catch (error) {
      log.warn('Backend getTabs failed:', error);
      return [];
    }
  },

  async navigate(tabId: string, url: string): Promise<void> {
    try {
      await invoke<void>('browser_navigate', { tabId, url });
    } catch (error) {
      log.warn('Backend navigate failed:', error);
    }
  },

  async reload(tabId: string): Promise<void> {
    try {
      await invoke<void>('browser_reload', { tabId });
    } catch (error) {
      log.warn('Backend reload failed:', error);
    }
  },

  async goBack(tabId: string): Promise<void> {
    try {
      await invoke<void>('browser_go_back', { tabId });
    } catch (error) {
      log.warn('Backend goBack failed:', error);
    }
  },

  async goForward(tabId: string): Promise<void> {
    try {
      await invoke<void>('browser_go_forward', { tabId });
    } catch (error) {
      log.warn('Backend goForward failed:', error);
    }
  },

  async click(tabId: string, selector: string): Promise<void> {
    try {
      await invoke<void>('browser_click', { tabId, selector });
    } catch (error) {
      log.warn('Backend click failed:', error);
    }
  },

  async typeText(tabId: string, selector: string, text: string): Promise<void> {
    try {
      await invoke<void>('browser_type', { tabId, selector, text });
    } catch (error) {
      log.warn('Backend type failed:', error);
    }
  },

  async getText(tabId: string, selector: string): Promise<string> {
    try {
      return await invoke<string>('browser_get_text', { tabId, selector });
    } catch (error) {
      log.warn('Backend getText failed:', error);
      return '';
    }
  },

  async getAttribute(tabId: string, selector: string, attribute: string): Promise<string | null> {
    try {
      return await invoke<string | null>('browser_get_attribute', { tabId, selector, attribute });
    } catch (error) {
      log.warn('Backend getAttribute failed:', error);
      return null;
    }
  },

  async getElementInfo(tabId: string, selector: string): Promise<BackendElementInfo | null> {
    try {
      return await invoke<BackendElementInfo>('browser_get_element_info', { tabId, selector });
    } catch (error) {
      log.warn('Backend getElementInfo failed:', error);
      return null;
    }
  },

  async screenshot(tabId: string): Promise<Uint8Array> {
    try {
      return await invoke<Uint8Array>('browser_screenshot', { tabId });
    } catch (error) {
      log.warn('Backend screenshot failed:', error);
      return new Uint8Array();
    }
  },

  async screenshotElement(tabId: string, selector: string): Promise<Uint8Array> {
    try {
      return await invoke<Uint8Array>('browser_screenshot_element', { tabId, selector });
    } catch (error) {
      log.warn('Backend screenshotElement failed:', error);
      return new Uint8Array();
    }
  },

  async evaluate(tabId: string, script: string): Promise<unknown> {
    try {
      return await invoke<unknown>('browser_evaluate', { tabId, script });
    } catch (error) {
      log.warn('Backend evaluate failed:', error);
      return null;
    }
  },

  async getHtml(tabId: string): Promise<string> {
    try {
      return await invoke<string>('browser_get_html', { tabId });
    } catch (error) {
      log.warn('Backend getHtml failed:', error);
      return '';
    }
  },

  async getTitle(tabId: string): Promise<string> {
    try {
      return await invoke<string>('browser_get_title', { tabId });
    } catch (error) {
      log.warn('Backend getTitle failed:', error);
      return '';
    }
  },

  async getUrl(tabId: string): Promise<string> {
    try {
      return await invoke<string>('browser_get_url', { tabId });
    } catch (error) {
      log.warn('Backend getUrl failed:', error);
      return '';
    }
  },

  async findElements(tabId: string, selector: string): Promise<string[]> {
    try {
      return await invoke<string[]>('browser_find_elements', { tabId, selector });
    } catch (error) {
      log.warn('Backend findElements failed:', error);
      return [];
    }
  },

  async countElements(tabId: string, selector: string): Promise<number> {
    try {
      return await invoke<number>('browser_count_elements', { tabId, selector });
    } catch (error) {
      log.warn('Backend countElements failed:', error);
      return 0;
    }
  },

  async waitForElement(tabId: string, selector: string, timeoutMs?: number): Promise<void> {
    try {
      await invoke<void>('browser_wait_for_element', { tabId, selector, timeoutMs });
    } catch (error) {
      log.warn('Backend waitForElement failed:', error);
    }
  }
};

// ============================================================================
// Types
// ============================================================================

/**
 * Resource limits for browser performance control
 */
export interface ResourceLimits {
  /** CPU limit (0-100%) */
  cpuLimit: number;
  /** RAM limit in MB (0 = unlimited) */
  ramLimit: number;
  /** Network bandwidth limit in KB/s (0 = unlimited) */
  networkLimit: number;
  /** Enable hot tabs killer */
  hotTabsKiller: boolean;
  /** Hot tabs memory threshold in MB */
  hotTabsThreshold: number;
}

/**
 * Tab Island - Visual group of related tabs
 */
export interface TabIsland {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
  tabIds: string[];
  createdAt: Date;
}

/**
 * Multi-Account Container
 */
export interface BrowserContainer {
  id: string;
  name: string;
  color: string;
  icon: string;
  cookieStoreId: string;
  /** Isolated from other containers */
  isolated: boolean;
  /** Auto-open URLs matching patterns */
  urlPatterns: string[];
  /** Proxy settings for this container */
  proxy?: ContainerProxy;
}

/**
 * Container proxy settings
 */
export interface ContainerProxy {
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
}

/**
 * Sleeping tab configuration
 */
export interface SleepingTabConfig {
  enabled: boolean;
  /** Time in minutes before tab sleeps */
  inactivityTime: number;
  /** Never sleep pinned tabs */
  excludePinned: boolean;
  /** Never sleep tabs playing audio */
  excludeAudio: boolean;
  /** Excluded URLs */
  excludedUrls: string[];
  /** Fade out sleeping tabs */
  fadeEffect: boolean;
}

/**
 * Browser Advanced Service - CUBE Elite v6
 * 
 * Advanced browser features with Tauri backend integration:
 * - Resource Limiter (CPU/RAM monitoring and limits)
 * - Tab Islands (visual tab grouping)
 * - Multi-Account Containers (cookie isolation)
 * - Sleeping Tabs (automatic tab suspension)
 * - Site Boosts (custom CSS/JS injection)
 * - Session Manager (save/restore browser state)
 * - Snooze Tabs (tab reminders)
 * - Command Bar (quick actions palette)
 * - Focus Mode (distraction-free browsing)
 * - Picture-in-Picture (floating video)
 * 
 * Integration: Uses BrowserService for Tauri backend communication
 * 
 * @module BrowserAdvancedService
 * @version 2.0.0 - Backend Integration
 */

import { BrowserService, DevToolsService, WebviewService } from './browser-service';

/**
 * Backend integration flag - set to true when Tauri backend is available
 */
const useBackend = typeof window !== 'undefined' && '__TAURI__' in window;

/**
 * Sleeping tab state
 */
export interface SleepingTab {
  tabId: string;
  url: string;
  title: string;
  favicon?: string;
  sleepingSince: Date;
  memoryFreed: number;
}

/**
 * Site Boost (custom CSS/JS)
 */
export interface SiteBoost {
  id: string;
  name: string;
  description?: string;
  urlPattern: string;
  enabled: boolean;
  css?: string;
  js?: string;
  createdAt: Date;
  updatedAt: Date;
  /** From community or user-created */
  source: 'user' | 'community';
  /** Rating from community */
  rating?: number;
}

/**
 * Session (saved browser state)
 */
export interface BrowserSession {
  id: string;
  name: string;
  description?: string;
  windows: SessionWindow[];
  createdAt: Date;
  autoSave: boolean;
}

/**
 * Session window
 */
export interface SessionWindow {
  id: string;
  tabs: SessionTab[];
  bounds?: { x: number; y: number; width: number; height: number };
}

/**
 * Session tab
 */
export interface SessionTab {
  url: string;
  title: string;
  pinned: boolean;
  groupId?: string;
  scrollPosition?: number;
}

/**
 * Snoozed tab
 */
export interface SnoozedTab {
  id: string;
  tabId: string;
  url: string;
  title: string;
  favicon?: string;
  snoozedAt: Date;
  wakeAt: Date;
  /** Notification when tab wakes */
  notify: boolean;
}

/**
 * Command for command bar
 */
export interface BrowserCommand {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  icon: string;
  category: 'navigation' | 'tabs' | 'tools' | 'settings' | 'ai' | 'custom';
  action: () => void | Promise<void>;
  /** Keywords for search */
  keywords: string[];
}

/**
 * Focus mode settings
 */
export interface FocusModeConfig {
  enabled: boolean;
  /** Hide all UI except content */
  hideUI: boolean;
  /** Block distracting sites */
  blockSites: string[];
  /** Duration in minutes (0 = until manually stopped) */
  duration: number;
  /** Play ambient sounds */
  ambientSounds: boolean;
  /** Sound to play */
  soundType: 'rain' | 'ocean' | 'forest' | 'cafe' | 'fireplace' | 'none';
}

/**
 * Picture-in-Picture window
 */
export interface PipWindow {
  id: string;
  tabId: string;
  videoUrl: string;
  bounds: { x: number; y: number; width: number; height: number };
  alwaysOnTop: boolean;
}

/**
 * Resource usage stats
 */
export interface ResourceStats {
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  networkDown: number;
  networkUp: number;
  tabCount: number;
  sleepingTabCount: number;
  memoryByTab: TabMemory[];
}

/**
 * Tab memory usage
 */
export interface TabMemory {
  tabId: string;
  title: string;
  memoryUsage: number;
  isHot: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_RESOURCE_LIMITS: ResourceLimits = {
  cpuLimit: 100,
  ramLimit: 0,
  networkLimit: 0,
  hotTabsKiller: false,
  hotTabsThreshold: 500,
};

const DEFAULT_SLEEPING_CONFIG: SleepingTabConfig = {
  enabled: true,
  inactivityTime: 30,
  excludePinned: true,
  excludeAudio: true,
  excludedUrls: [],
  fadeEffect: true,
};

const DEFAULT_FOCUS_MODE: FocusModeConfig = {
  enabled: false,
  hideUI: true,
  blockSites: [
    'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
    'reddit.com', 'tiktok.com', 'youtube.com'
  ],
  duration: 25, // Pomodoro
  ambientSounds: false,
  soundType: 'rain',
};

const CONTAINER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const CONTAINER_ICONS = [
  '👤', '💼', '🛒', '🎮', '📚', '🔬', '💰', '🏠', '✈️', '🔒'
];

const DB_NAME = 'cube_browser_advanced';
const DB_VERSION = 1;

// ============================================================================
// Storage Service
// ============================================================================

class BrowserStorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Islands store
        if (!db.objectStoreNames.contains('islands')) {
          db.createObjectStore('islands', { keyPath: 'id' });
        }

        // Containers store
        if (!db.objectStoreNames.contains('containers')) {
          db.createObjectStore('containers', { keyPath: 'id' });
        }

        // Boosts store
        if (!db.objectStoreNames.contains('boosts')) {
          const boostsStore = db.createObjectStore('boosts', { keyPath: 'id' });
          boostsStore.createIndex('urlPattern', 'urlPattern', { unique: false });
        }

        // Sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }

        // Snoozed tabs store
        if (!db.objectStoreNames.contains('snoozed')) {
          const snoozedStore = db.createObjectStore('snoozed', { keyPath: 'id' });
          snoozedStore.createIndex('wakeAt', 'wakeAt', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async save<T>(store: string, data: T): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get<T>(store: string, key: string): Promise<T | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAll<T>(store: string): Promise<T[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(store: string, key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const result = await this.get<{ key: string; value: T }>('settings', key);
    return result?.value ?? defaultValue;
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    await this.save('settings', { key, value });
  }
}

// ============================================================================
// Resource Limiter Service
// ============================================================================

class ResourceLimiterService {
  private limits: ResourceLimits = DEFAULT_RESOURCE_LIMITS;
  private monitoring = false;
  private monitorInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: ((stats: ResourceStats) => void)[] = [];

  setLimits(limits: Partial<ResourceLimits>): void {
    this.limits = { ...this.limits, ...limits };
  }

  getLimits(): ResourceLimits {
    return { ...this.limits };
  }

  startMonitoring(): void {
    if (this.monitoring) return;
    this.monitoring = true;

    this.monitorInterval = setInterval(() => {
      this.checkResourceUsage();
    }, 2000);
  }

  stopMonitoring(): void {
    this.monitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  onStats(callback: (stats: ResourceStats) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private async checkResourceUsage(): Promise<void> {
    let stats: ResourceStats;

    if (useBackend) {
      // Try to get stats from DevTools service for each active tab
      try {
        // For now, we collect what we can from browser APIs
        // In future, DevToolsService.getPerformance() can provide per-tab metrics
        const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
        
        stats = {
          cpuUsage: 0,
          memoryUsage: memory?.usedJSHeapSize || 0,
          memoryTotal: memory?.totalJSHeapSize || 0,
          networkDown: 0,
          networkUp: 0,
          tabCount: 0,
          sleepingTabCount: 0,
          memoryByTab: [],
        };
      } catch (error) {
        log.warn('Failed to get resource stats from backend:', error);
        stats = this.getSimulatedStats();
      }
    } else {
      stats = this.getSimulatedStats();
    }

    // Notify listeners
    for (const listener of this.listeners) {
      listener(stats);
    }

    // Apply limits
    this.applyLimits(stats);
  }

  private getSimulatedStats(): ResourceStats {
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
    
    return {
      cpuUsage: 0,
      memoryUsage: memory?.usedJSHeapSize || 0,
      memoryTotal: memory?.totalJSHeapSize || 0,
      networkDown: 0,
      networkUp: 0,
      tabCount: 0,
      sleepingTabCount: 0,
      memoryByTab: [],
    };
  }

  private applyLimits(stats: ResourceStats): void {
    // Hot tabs killer
    if (this.limits.hotTabsKiller) {
      const hotTabs = stats.memoryByTab.filter(
        t => t.memoryUsage > this.limits.hotTabsThreshold * 1024 * 1024
      );
      for (const tab of hotTabs) {
        // Emit event to sleep this tab
        window.dispatchEvent(new CustomEvent('cube:killHotTab', {
          detail: { tabId: tab.tabId }
        }));
      }
    }

    // Network throttling (would need service worker)
    if (this.limits.networkLimit > 0) {
      // Simulate network throttling
    }
  }
}

// ============================================================================
// Tab Islands Service
// ============================================================================

class TabIslandsService {
  private storage: BrowserStorageService;
  private islands: Map<string, TabIsland> = new Map();

  constructor(storage: BrowserStorageService) {
    this.storage = storage;
  }

  async init(): Promise<void> {
    const saved = await this.storage.getAll<TabIsland>('islands');
    for (const island of saved) {
      island.createdAt = new Date(island.createdAt);
      this.islands.set(island.id, island);
    }
  }

  async createIsland(name: string, color?: string, tabIds?: string[]): Promise<TabIsland> {
    const island: TabIsland = {
      id: `island_${Date.now()}`,
      name,
      color: color || CONTAINER_COLORS[this.islands.size % CONTAINER_COLORS.length],
      collapsed: false,
      tabIds: tabIds || [],
      createdAt: new Date(),
    };

    this.islands.set(island.id, island);
    await this.storage.save('islands', island);
    return island;
  }

  async addTabToIsland(islandId: string, tabId: string): Promise<void> {
    const island = this.islands.get(islandId);
    if (!island) throw new Error('Island not found');

    // Remove from any other island first
    for (const [, i] of this.islands) {
      if (i.tabIds.includes(tabId)) {
        i.tabIds = i.tabIds.filter(t => t !== tabId);
        await this.storage.save('islands', i);
      }
    }

    island.tabIds.push(tabId);
    await this.storage.save('islands', island);
  }

  async removeTabFromIsland(tabId: string): Promise<void> {
    for (const [, island] of this.islands) {
      if (island.tabIds.includes(tabId)) {
        island.tabIds = island.tabIds.filter(t => t !== tabId);
        await this.storage.save('islands', island);
        break;
      }
    }
  }

  async deleteIsland(islandId: string): Promise<void> {
    this.islands.delete(islandId);
    await this.storage.delete('islands', islandId);
  }

  async toggleCollapse(islandId: string): Promise<void> {
    const island = this.islands.get(islandId);
    if (island) {
      island.collapsed = !island.collapsed;
      await this.storage.save('islands', island);
    }
  }

  getIslands(): TabIsland[] {
    return Array.from(this.islands.values());
  }

  getIslandForTab(tabId: string): TabIsland | undefined {
    for (const [, island] of this.islands) {
      if (island.tabIds.includes(tabId)) {
        return island;
      }
    }
    return undefined;
  }
}

// ============================================================================
// Container Service (Multi-Account Containers)
// ============================================================================

class ContainerService {
  private storage: BrowserStorageService;
  private containers: Map<string, BrowserContainer> = new Map();

  constructor(storage: BrowserStorageService) {
    this.storage = storage;
  }

  async init(): Promise<void> {
    const saved = await this.storage.getAll<BrowserContainer>('containers');
    for (const container of saved) {
      this.containers.set(container.id, container);
    }

    // Create default containers if none exist
    if (this.containers.size === 0) {
      await this.createContainer('Personal', CONTAINER_COLORS[0], '👤');
      await this.createContainer('Work', CONTAINER_COLORS[1], '💼');
      await this.createContainer('Shopping', CONTAINER_COLORS[2], '🛒');
      await this.createContainer('Banking', CONTAINER_COLORS[3], '💰');
    }
  }

  async createContainer(
    name: string,
    color?: string,
    icon?: string,
    urlPatterns?: string[]
  ): Promise<BrowserContainer> {
    const container: BrowserContainer = {
      id: `container_${Date.now()}`,
      name,
      color: color || CONTAINER_COLORS[this.containers.size % CONTAINER_COLORS.length],
      icon: icon || CONTAINER_ICONS[this.containers.size % CONTAINER_ICONS.length],
      cookieStoreId: `cube_cookies_${Date.now()}`,
      isolated: true,
      urlPatterns: urlPatterns || [],
    };

    this.containers.set(container.id, container);
    await this.storage.save('containers', container);
    return container;
  }

  async updateContainer(id: string, updates: Partial<BrowserContainer>): Promise<void> {
    const container = this.containers.get(id);
    if (!container) throw new Error('Container not found');

    Object.assign(container, updates);
    await this.storage.save('containers', container);
  }

  async deleteContainer(id: string): Promise<void> {
    this.containers.delete(id);
    await this.storage.delete('containers', id);
  }

  getContainers(): BrowserContainer[] {
    return Array.from(this.containers.values());
  }

  getContainer(id: string): BrowserContainer | undefined {
    return this.containers.get(id);
  }

  getContainerForUrl(url: string): BrowserContainer | undefined {
    for (const [, container] of this.containers) {
      for (const pattern of container.urlPatterns) {
        if (this.matchesPattern(url, pattern)) {
          return container;
        }
      }
    }
    return undefined;
  }

  private matchesPattern(url: string, pattern: string): boolean {
    try {
      const urlObj = new URL(url);
      const regex = new RegExp(
        pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
      );
      return regex.test(urlObj.hostname);
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Sleeping Tabs Service
// ============================================================================

class SleepingTabsService {
  private storage: BrowserStorageService;
  private config: SleepingTabConfig = DEFAULT_SLEEPING_CONFIG;
  private sleepingTabs: Map<string, SleepingTab> = new Map();
  private tabActivity: Map<string, number> = new Map();
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor(storage: BrowserStorageService) {
    this.storage = storage;
  }

  async init(): Promise<void> {
    this.config = await this.storage.getSetting('sleepingConfig', DEFAULT_SLEEPING_CONFIG);
    if (this.config.enabled) {
      this.startChecking();
    }
  }

  async setConfig(config: Partial<SleepingTabConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.storage.setSetting('sleepingConfig', this.config);

    if (this.config.enabled) {
      this.startChecking();
    } else {
      this.stopChecking();
    }
  }

  getConfig(): SleepingTabConfig {
    return { ...this.config };
  }

  recordActivity(tabId: string): void {
    this.tabActivity.set(tabId, Date.now());
    
    // Wake up if sleeping
    if (this.sleepingTabs.has(tabId)) {
      this.sleepingTabs.delete(tabId);
    }
  }

  async sleepTab(tabId: string, url: string, title: string, favicon?: string): Promise<void> {
    const sleepingTab: SleepingTab = {
      tabId,
      url,
      title,
      favicon,
      sleepingSince: new Date(),
      memoryFreed: 0, // Would calculate actual memory
    };

    this.sleepingTabs.set(tabId, sleepingTab);

    // Emit event for UI to handle
    window.dispatchEvent(new CustomEvent('cube:tabSlept', {
      detail: sleepingTab
    }));
  }

  wakeTab(tabId: string): SleepingTab | undefined {
    const tab = this.sleepingTabs.get(tabId);
    if (tab) {
      this.sleepingTabs.delete(tabId);
      this.tabActivity.set(tabId, Date.now());

      // Emit event
      window.dispatchEvent(new CustomEvent('cube:tabWoke', {
        detail: tab
      }));
    }
    return tab;
  }

  getSleepingTabs(): SleepingTab[] {
    return Array.from(this.sleepingTabs.values());
  }

  isSleeping(tabId: string): boolean {
    return this.sleepingTabs.has(tabId);
  }

  private startChecking(): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.checkInactiveTabs();
    }, 60000); // Check every minute
  }

  private stopChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private checkInactiveTabs(): void {
    const now = Date.now();
    const threshold = this.config.inactivityTime * 60 * 1000;

    for (const [tabId, lastActivity] of this.tabActivity) {
      if (now - lastActivity > threshold && !this.sleepingTabs.has(tabId)) {
        // Request sleep (UI will handle actual sleeping)
        window.dispatchEvent(new CustomEvent('cube:shouldSleepTab', {
          detail: { tabId }
        }));
      }
    }
  }
}

// ============================================================================
// Site Boosts Service
// ============================================================================

class SiteBoostsService {
  private storage: BrowserStorageService;
  private boosts: Map<string, SiteBoost> = new Map();

  constructor(storage: BrowserStorageService) {
    this.storage = storage;
  }

  async init(): Promise<void> {
    const saved = await this.storage.getAll<SiteBoost>('boosts');
    for (const boost of saved) {
      boost.createdAt = new Date(boost.createdAt);
      boost.updatedAt = new Date(boost.updatedAt);
      this.boosts.set(boost.id, boost);
    }
  }

  async createBoost(
    name: string,
    urlPattern: string,
    css?: string,
    js?: string
  ): Promise<SiteBoost> {
    const boost: SiteBoost = {
      id: `boost_${Date.now()}`,
      name,
      urlPattern,
      enabled: true,
      css,
      js,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'user',
    };

    this.boosts.set(boost.id, boost);
    await this.storage.save('boosts', boost);
    return boost;
  }

  async updateBoost(id: string, updates: Partial<SiteBoost>): Promise<void> {
    const boost = this.boosts.get(id);
    if (!boost) throw new Error('Boost not found');

    Object.assign(boost, updates, { updatedAt: new Date() });
    await this.storage.save('boosts', boost);
  }

  async deleteBoost(id: string): Promise<void> {
    this.boosts.delete(id);
    await this.storage.delete('boosts', id);
  }

  async toggleBoost(id: string): Promise<boolean> {
    const boost = this.boosts.get(id);
    if (!boost) throw new Error('Boost not found');

    boost.enabled = !boost.enabled;
    boost.updatedAt = new Date();
    await this.storage.save('boosts', boost);
    return boost.enabled;
  }

  getBoosts(): SiteBoost[] {
    return Array.from(this.boosts.values());
  }

  getBoostsForUrl(url: string): SiteBoost[] {
    return this.getBoosts().filter(boost => {
      if (!boost.enabled) return false;
      try {
        const regex = new RegExp(
          boost.urlPattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
        );
        return regex.test(url);
      } catch {
        return false;
      }
    });
  }

  injectBoost(iframe: HTMLIFrameElement, boost: SiteBoost): void {
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;

      if (boost.css) {
        const style = doc.createElement('style');
        style.textContent = boost.css;
        style.setAttribute('data-cube-boost', boost.id);
        doc.head.appendChild(style);
      }

      if (boost.js) {
        const script = doc.createElement('script');
        script.textContent = boost.js;
        script.setAttribute('data-cube-boost', boost.id);
        doc.body.appendChild(script);
      }
    } catch (error) {
      log.error('Failed to inject boost:', error);
    }
  }
}

// ============================================================================
// Session Manager Service
// ============================================================================

class SessionManagerService {
  private storage: BrowserStorageService;
  private sessions: Map<string, BrowserSession> = new Map();
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;

  constructor(storage: BrowserStorageService) {
    this.storage = storage;
  }

  async init(): Promise<void> {
    const saved = await this.storage.getAll<BrowserSession>('sessions');
    for (const session of saved) {
      session.createdAt = new Date(session.createdAt);
      this.sessions.set(session.id, session);
    }
  }

  async saveCurrentSession(name: string, description?: string): Promise<BrowserSession> {
    const session: BrowserSession = {
      id: `session_${Date.now()}`,
      name,
      description,
      windows: [], // Would be populated with current window/tab state
      createdAt: new Date(),
      autoSave: false,
    };

    this.sessions.set(session.id, session);
    await this.storage.save('sessions', session);
    return session;
  }

  async updateSession(id: string, windows: SessionWindow[]): Promise<void> {
    const session = this.sessions.get(id);
    if (!session) throw new Error('Session not found');

    session.windows = windows;
    await this.storage.save('sessions', session);
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
    await this.storage.delete('sessions', id);
  }

  getSessions(): BrowserSession[] {
    return Array.from(this.sessions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getSession(id: string): BrowserSession | undefined {
    return this.sessions.get(id);
  }

  startAutoSave(sessionId: string, intervalMs: number = 60000): void {
    this.stopAutoSave();
    
    this.autoSaveInterval = setInterval(() => {
      // Emit event for UI to trigger save
      window.dispatchEvent(new CustomEvent('cube:autoSaveSession', {
        detail: { sessionId }
      }));
    }, intervalMs);
  }

  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }
}

// ============================================================================
// Snooze Tabs Service
// ============================================================================

class SnoozeTabsService {
  private storage: BrowserStorageService;
  private snoozedTabs: Map<string, SnoozedTab> = new Map();
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor(storage: BrowserStorageService) {
    this.storage = storage;
  }

  async init(): Promise<void> {
    const saved = await this.storage.getAll<SnoozedTab>('snoozed');
    for (const tab of saved) {
      tab.snoozedAt = new Date(tab.snoozedAt);
      tab.wakeAt = new Date(tab.wakeAt);
      this.snoozedTabs.set(tab.id, tab);
    }

    this.startChecking();
  }

  async snoozeTab(
    tabId: string,
    url: string,
    title: string,
    wakeAt: Date,
    notify: boolean = true,
    favicon?: string
  ): Promise<SnoozedTab> {
    const snoozed: SnoozedTab = {
      id: `snooze_${Date.now()}`,
      tabId,
      url,
      title,
      favicon,
      snoozedAt: new Date(),
      wakeAt,
      notify,
    };

    this.snoozedTabs.set(snoozed.id, snoozed);
    await this.storage.save('snoozed', snoozed);

    // Close the original tab (emit event for UI)
    window.dispatchEvent(new CustomEvent('cube:tabSnoozed', {
      detail: snoozed
    }));

    return snoozed;
  }

  async cancelSnooze(id: string): Promise<SnoozedTab | undefined> {
    const tab = this.snoozedTabs.get(id);
    if (tab) {
      this.snoozedTabs.delete(id);
      await this.storage.delete('snoozed', id);
    }
    return tab;
  }

  getSnoozedTabs(): SnoozedTab[] {
    return Array.from(this.snoozedTabs.values())
      .sort((a, b) => a.wakeAt.getTime() - b.wakeAt.getTime());
  }

  private startChecking(): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.checkWakeTabs();
    }, 60000); // Check every minute
  }

  private async checkWakeTabs(): Promise<void> {
    const now = new Date();

    for (const [id, tab] of this.snoozedTabs) {
      if (tab.wakeAt <= now) {
        this.snoozedTabs.delete(id);
        await this.storage.delete('snoozed', id);

        // Emit wake event
        window.dispatchEvent(new CustomEvent('cube:tabWaking', {
          detail: tab
        }));

        // Show notification if enabled
        if (tab.notify && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('Tab Reminder', {
              body: `Time to check: ${tab.title}`,
              icon: tab.favicon,
            });
          }
        }
      }
    }
  }

  // Quick snooze presets
  snoozeUntil(tabId: string, url: string, title: string, preset: string, favicon?: string): Promise<SnoozedTab> {
    const wakeAt = new Date();
    
    switch (preset) {
      case 'later_today':
        wakeAt.setHours(wakeAt.getHours() + 3);
        break;
      case 'this_evening':
        wakeAt.setHours(18, 0, 0, 0);
        break;
      case 'tomorrow':
        wakeAt.setDate(wakeAt.getDate() + 1);
        wakeAt.setHours(9, 0, 0, 0);
        break;
      case 'this_weekend':
        const dayOfWeek = wakeAt.getDay();
        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
        wakeAt.setDate(wakeAt.getDate() + daysUntilSaturday);
        wakeAt.setHours(10, 0, 0, 0);
        break;
      case 'next_week':
        wakeAt.setDate(wakeAt.getDate() + 7);
        wakeAt.setHours(9, 0, 0, 0);
        break;
      default:
        wakeAt.setHours(wakeAt.getHours() + 1);
    }

    return this.snoozeTab(tabId, url, title, wakeAt, true, favicon);
  }
}

// ============================================================================
// Command Bar Service
// ============================================================================

class CommandBarService {
  private commands: Map<string, BrowserCommand> = new Map();

  registerCommand(command: BrowserCommand): void {
    this.commands.set(command.id, command);
  }

  unregisterCommand(id: string): void {
    this.commands.delete(id);
  }

  getCommands(): BrowserCommand[] {
    return Array.from(this.commands.values());
  }

  search(query: string): BrowserCommand[] {
    const lower = query.toLowerCase();
    return this.getCommands().filter(cmd => 
      cmd.name.toLowerCase().includes(lower) ||
      cmd.description.toLowerCase().includes(lower) ||
      cmd.keywords.some(k => k.toLowerCase().includes(lower))
    );
  }

  executeCommand(id: string): void | Promise<void> {
    const command = this.commands.get(id);
    if (command) {
      return command.action();
    }
  }

  // Register default browser commands
  registerDefaults(): void {
    this.registerCommand({
      id: 'new-tab',
      name: 'New Tab',
      description: 'Open a new tab',
      shortcut: 'Ctrl+T',
      icon: 'Plus',
      category: 'tabs',
      keywords: ['tab', 'new', 'create'],
      action: () => {
        window.dispatchEvent(new CustomEvent('cube:command', { detail: 'new-tab' }));
      },
    });

    this.registerCommand({
      id: 'close-tab',
      name: 'Close Tab',
      description: 'Close current tab',
      shortcut: 'Ctrl+W',
      icon: 'X',
      category: 'tabs',
      keywords: ['tab', 'close', 'remove'],
      action: () => {
        window.dispatchEvent(new CustomEvent('cube:command', { detail: 'close-tab' }));
      },
    });

    this.registerCommand({
      id: 'toggle-devtools',
      name: 'Toggle Developer Tools',
      description: 'Open or close DevTools',
      shortcut: 'F12',
      icon: 'Code',
      category: 'tools',
      keywords: ['devtools', 'developer', 'inspect', 'console'],
      action: () => {
        window.dispatchEvent(new CustomEvent('cube:command', { detail: 'toggle-devtools' }));
      },
    });

    this.registerCommand({
      id: 'toggle-focus-mode',
      name: 'Toggle Focus Mode',
      description: 'Enter or exit focus mode',
      icon: 'Focus',
      category: 'tools',
      keywords: ['focus', 'distraction', 'concentrate'],
      action: () => {
        window.dispatchEvent(new CustomEvent('cube:command', { detail: 'toggle-focus' }));
      },
    });

    this.registerCommand({
      id: 'ai-summarize',
      name: 'AI: Summarize Page',
      description: 'Get an AI summary of the current page',
      icon: 'Sparkles',
      category: 'ai',
      keywords: ['ai', 'summarize', 'summary', 'tldr'],
      action: () => {
        window.dispatchEvent(new CustomEvent('cube:command', { detail: 'ai-summarize' }));
      },
    });

    this.registerCommand({
      id: 'screenshot',
      name: 'Take Screenshot',
      description: 'Capture the current page',
      shortcut: 'Ctrl+Shift+S',
      icon: 'Camera',
      category: 'tools',
      keywords: ['screenshot', 'capture', 'image'],
      action: () => {
        window.dispatchEvent(new CustomEvent('cube:command', { detail: 'screenshot' }));
      },
    });
  }
}

// ============================================================================
// Focus Mode Service
// ============================================================================

class FocusModeService {
  private storage: BrowserStorageService;
  private config: FocusModeConfig = DEFAULT_FOCUS_MODE;
  private active = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private audioContext: AudioContext | null = null;
  private listeners: ((active: boolean, timeRemaining?: number) => void)[] = [];

  constructor(storage: BrowserStorageService) {
    this.storage = storage;
  }

  async init(): Promise<void> {
    this.config = await this.storage.getSetting('focusModeConfig', DEFAULT_FOCUS_MODE);
  }

  async setConfig(config: Partial<FocusModeConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.storage.setSetting('focusModeConfig', this.config);
  }

  getConfig(): FocusModeConfig {
    return { ...this.config };
  }

  isActive(): boolean {
    return this.active;
  }

  start(): void {
    if (this.active) return;
    this.active = true;

    // Start timer if duration is set
    if (this.config.duration > 0) {
      this.timer = setTimeout(() => {
        this.stop();
      }, this.config.duration * 60 * 1000);
    }

    // Start ambient sounds
    if (this.config.ambientSounds) {
      this.startAmbientSounds();
    }

    this.notifyListeners();

    // Emit event
    window.dispatchEvent(new CustomEvent('cube:focusModeStarted', {
      detail: this.config
    }));
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.stopAmbientSounds();
    this.notifyListeners();

    // Emit event
    window.dispatchEvent(new CustomEvent('cube:focusModeStopped'));
  }

  toggle(): void {
    if (this.active) {
      this.stop();
    } else {
      this.start();
    }
  }

  isUrlBlocked(url: string): boolean {
    if (!this.active) return false;

    try {
      const urlObj = new URL(url);
      return this.config.blockSites.some(site => 
        urlObj.hostname.includes(site)
      );
    } catch {
      return false;
    }
  }

  onStateChange(callback: (active: boolean, timeRemaining?: number) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.active);
    }
  }

  private startAmbientSounds(): void {
    // Would integrate with actual audio files
    // For now, just log
    log.debug('Starting ambient sounds:', this.config.soundType);
  }

  private stopAmbientSounds(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// ============================================================================
// Picture-in-Picture Service
// ============================================================================

class PictureInPictureService {
  private activeWindows: Map<string, PipWindow> = new Map();

  async openPip(tabId: string, videoElement: HTMLVideoElement): Promise<string> {
    if (!document.pictureInPictureEnabled) {
      throw new Error('Picture-in-Picture not supported');
    }

    try {
      await videoElement.requestPictureInPicture();
      
      const pipWindow: PipWindow = {
        id: `pip_${Date.now()}`,
        tabId,
        videoUrl: videoElement.src,
        bounds: { x: 0, y: 0, width: 400, height: 225 },
        alwaysOnTop: true,
      };

      this.activeWindows.set(pipWindow.id, pipWindow);

      videoElement.addEventListener('leavepictureinpicture', () => {
        this.activeWindows.delete(pipWindow.id);
      });

      return pipWindow.id;
    } catch (error) {
      throw new Error(`Failed to open PiP: ${error}`);
    }
  }

  async closePip(): Promise<void> {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }
  }

  getActiveWindows(): PipWindow[] {
    return Array.from(this.activeWindows.values());
  }
}

// ============================================================================
// Main Browser Advanced Service
// ============================================================================

export class BrowserAdvancedService {
  private storage: BrowserStorageService;
  
  public resourceLimiter: ResourceLimiterService;
  public tabIslands: TabIslandsService;
  public containers: ContainerService;
  public sleepingTabs: SleepingTabsService;
  public siteBoosts: SiteBoostsService;
  public sessions: SessionManagerService;
  public snoozeTabs: SnoozeTabsService;
  public commandBar: CommandBarService;
  public focusMode: FocusModeService;
  public pip: PictureInPictureService;

  /**
   * Backend integration available flag
   */
  public readonly backendAvailable: boolean;

  constructor() {
    this.storage = new BrowserStorageService();
    this.resourceLimiter = new ResourceLimiterService();
    this.tabIslands = new TabIslandsService(this.storage);
    this.containers = new ContainerService(this.storage);
    this.sleepingTabs = new SleepingTabsService(this.storage);
    this.siteBoosts = new SiteBoostsService(this.storage);
    this.sessions = new SessionManagerService(this.storage);
    this.snoozeTabs = new SnoozeTabsService(this.storage);
    this.commandBar = new CommandBarService();
    this.focusMode = new FocusModeService(this.storage);
    this.pip = new PictureInPictureService();
    this.backendAvailable = useBackend;
  }

  async init(): Promise<void> {
    await this.storage.init();
    
    await Promise.all([
      this.tabIslands.init(),
      this.containers.init(),
      this.sleepingTabs.init(),
      this.siteBoosts.init(),
      this.sessions.init(),
      this.snoozeTabs.init(),
      this.focusMode.init(),
    ]);

    this.commandBar.registerDefaults();
    this.resourceLimiter.startMonitoring();

    // Log backend status
    if (useBackend) {
      log.debug('[BrowserAdvancedService] Tauri backend integration enabled');
    } else {
      log.debug('[BrowserAdvancedService] Running in simulation mode (no Tauri backend)');
    }
  }

  destroy(): void {
    this.resourceLimiter.stopMonitoring();
    this.sessions.stopAutoSave();
  }

  /**
   * Create a new webview tab using backend
   * Requires Tauri backend
   */
  async createTab(url: string): Promise<void> {
    if (!useBackend) {
      log.warn('[BrowserAdvancedService] createTab requires Tauri backend');
      return;
    }
    try {
      await BrowserService.Tab.create(url);
    } catch (error) {
      log.error('[BrowserAdvancedService] Failed to create tab:', error);
      throw error;
    }
  }

  /**
   * Close a webview tab using backend
   * Requires Tauri backend
   */
  async closeTab(tabId: string): Promise<void> {
    if (!useBackend) {
      log.warn('[BrowserAdvancedService] closeTab requires Tauri backend');
      return;
    }
    try {
      await BrowserService.Tab.close(tabId);
    } catch (error) {
      log.error('[BrowserAdvancedService] Failed to close tab:', error);
      throw error;
    }
  }

  /**
   * Get DevTools performance metrics for a tab
   * Requires Tauri backend
   */
  async getTabPerformance(tabId: string): Promise<import('./browser-service').PerformanceMetrics | null> {
    if (!useBackend) {
      return null;
    }
    try {
      return await DevToolsService.getPerformance(tabId);
    } catch (error) {
      log.error('[BrowserAdvancedService] Failed to get tab performance:', error);
      return null;
    }
  }

  /**
   * Get DevTools console entries for a tab
   * Requires Tauri backend
   */
  async getTabConsole(tabId: string): Promise<import('./browser-service').ConsoleEntry[]> {
    if (!useBackend) {
      return [];
    }
    try {
      return await DevToolsService.getConsole(tabId);
    } catch (error) {
      log.error('[BrowserAdvancedService] Failed to get tab console:', error);
      return [];
    }
  }

  /**
   * Get DevTools network requests for a tab
   * Requires Tauri backend
   */
  async getTabNetwork(tabId: string): Promise<import('./browser-service').NetworkRequest[]> {
    if (!useBackend) {
      return [];
    }
    try {
      return await DevToolsService.getNetwork(tabId);
    } catch (error) {
      log.error('[BrowserAdvancedService] Failed to get tab network:', error);
      return [];
    }
  }

  /**
   * Navigate to URL using backend webview
   * Requires Tauri backend
   */
  async navigateTab(tabId: string, url: string): Promise<void> {
    if (!useBackend) {
      log.warn('[BrowserAdvancedService] navigateTab requires Tauri backend');
      return;
    }
    try {
      await WebviewService.navigate(tabId, url);
    } catch (error) {
      log.error('[BrowserAdvancedService] Failed to navigate tab:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Direct Backend Browser API Methods
  // ---------------------------------------------------------------------------

  /**
   * Launch headless browser using direct Tauri backend command
   */
  async launchHeadlessBrowser(): Promise<string> {
    return BackendBrowserAPI.launch();
  }

  /**
   * Check if headless browser is running
   */
  async isHeadlessBrowserRunning(): Promise<boolean> {
    return BackendBrowserAPI.isRunning();
  }

  /**
   * Close headless browser
   */
  async closeHeadlessBrowser(): Promise<void> {
    return BackendBrowserAPI.close();
  }

  /**
   * Create new tab in headless browser
   */
  async createHeadlessTab(): Promise<string> {
    return BackendBrowserAPI.newTab();
  }

  /**
   * Close tab in headless browser
   */
  async closeHeadlessTab(tabId: string): Promise<void> {
    return BackendBrowserAPI.closeTab(tabId);
  }

  /**
   * Get all tabs from headless browser
   */
  async getHeadlessTabs(): Promise<BackendTabInfo[]> {
    return BackendBrowserAPI.getTabs();
  }

  /**
   * Navigate headless tab to URL
   */
  async navigateHeadlessTab(tabId: string, url: string): Promise<void> {
    return BackendBrowserAPI.navigate(tabId, url);
  }

  /**
   * Click element in headless browser
   */
  async clickElement(tabId: string, selector: string): Promise<void> {
    return BackendBrowserAPI.click(tabId, selector);
  }

  /**
   * Type text into element in headless browser
   */
  async typeInElement(tabId: string, selector: string, text: string): Promise<void> {
    return BackendBrowserAPI.typeText(tabId, selector, text);
  }

  /**
   * Get text from element in headless browser
   */
  async getElementText(tabId: string, selector: string): Promise<string> {
    return BackendBrowserAPI.getText(tabId, selector);
  }

  /**
   * Get element info from headless browser
   */
  async getHeadlessElementInfo(tabId: string, selector: string): Promise<BackendElementInfo | null> {
    return BackendBrowserAPI.getElementInfo(tabId, selector);
  }

  /**
   * Take screenshot of headless tab
   */
  async takeHeadlessScreenshot(tabId: string): Promise<Uint8Array> {
    return BackendBrowserAPI.screenshot(tabId);
  }

  /**
   * Take screenshot of element in headless browser
   */
  async takeElementScreenshot(tabId: string, selector: string): Promise<Uint8Array> {
    return BackendBrowserAPI.screenshotElement(tabId, selector);
  }

  /**
   * Execute JavaScript in headless browser
   */
  async executeScript(tabId: string, script: string): Promise<unknown> {
    return BackendBrowserAPI.evaluate(tabId, script);
  }

  /**
   * Get page HTML from headless browser
   */
  async getPageHtml(tabId: string): Promise<string> {
    return BackendBrowserAPI.getHtml(tabId);
  }

  /**
   * Get page title from headless browser
   */
  async getPageTitle(tabId: string): Promise<string> {
    return BackendBrowserAPI.getTitle(tabId);
  }

  /**
   * Get page URL from headless browser
   */
  async getPageUrl(tabId: string): Promise<string> {
    return BackendBrowserAPI.getUrl(tabId);
  }

  /**
   * Find elements in headless browser
   */
  async findElements(tabId: string, selector: string): Promise<string[]> {
    return BackendBrowserAPI.findElements(tabId, selector);
  }

  /**
   * Count elements in headless browser
   */
  async countElements(tabId: string, selector: string): Promise<number> {
    return BackendBrowserAPI.countElements(tabId, selector);
  }

  /**
   * Wait for element in headless browser
   */
  async waitForElement(tabId: string, selector: string, timeoutMs?: number): Promise<void> {
    return BackendBrowserAPI.waitForElement(tabId, selector, timeoutMs);
  }
}

// ============================================================================
// React Hook
// ============================================================================

export function useBrowserAdvanced() {
  const [service, setService] = useState<BrowserAdvancedService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(false);

  // State for UI
  const [islands, setIslands] = useState<TabIsland[]>([]);
  const [containers, setContainers] = useState<BrowserContainer[]>([]);
  const [sleepingTabs, setSleepingTabs] = useState<SleepingTab[]>([]);
  const [boosts, setBoosts] = useState<SiteBoost[]>([]);
  const [sessions, setSessions] = useState<BrowserSession[]>([]);
  const [snoozedTabs, setSnoozedTabs] = useState<SnoozedTab[]>([]);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [resourceStats, setResourceStats] = useState<ResourceStats | null>(null);

  const serviceRef = useRef<BrowserAdvancedService | null>(null);

  const refreshState = useCallback((svc: BrowserAdvancedService) => {
    setIslands(svc.tabIslands.getIslands());
    setContainers(svc.containers.getContainers());
    setSleepingTabs(svc.sleepingTabs.getSleepingTabs());
    setBoosts(svc.siteBoosts.getBoosts());
    setSessions(svc.sessions.getSessions());
    setSnoozedTabs(svc.snoozeTabs.getSnoozedTabs());
    setFocusModeActive(svc.focusMode.isActive());
    setBackendAvailable(svc.backendAvailable);
  }, []);

  // Initialize
  useEffect(() => {
    const svc = new BrowserAdvancedService();
    serviceRef.current = svc;

    svc.init()
      .then(() => {
        setService(svc);
        refreshState(svc);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      });

    // Resource stats listener
    const unsubStats = svc.resourceLimiter.onStats(stats => {
      setResourceStats(stats);
    });

    // Focus mode listener
    const unsubFocus = svc.focusMode.onStateChange(active => {
      setFocusModeActive(active);
    });

    return () => {
      unsubStats();
      unsubFocus();
      svc.destroy();
    };
  }, [refreshState]);

  // Tab Islands
  const createIsland = useCallback(async (name: string, color?: string, tabIds?: string[]) => {
    if (!service) return null;
    const island = await service.tabIslands.createIsland(name, color, tabIds);
    setIslands(service.tabIslands.getIslands());
    return island;
  }, [service]);

  const addTabToIsland = useCallback(async (islandId: string, tabId: string) => {
    if (!service) return;
    await service.tabIslands.addTabToIsland(islandId, tabId);
    setIslands(service.tabIslands.getIslands());
  }, [service]);

  // Containers
  const createContainer = useCallback(async (name: string, color?: string, icon?: string) => {
    if (!service) return null;
    const container = await service.containers.createContainer(name, color, icon);
    setContainers(service.containers.getContainers());
    return container;
  }, [service]);

  // Boosts
  const createBoost = useCallback(async (name: string, urlPattern: string, css?: string, js?: string) => {
    if (!service) return null;
    const boost = await service.siteBoosts.createBoost(name, urlPattern, css, js);
    setBoosts(service.siteBoosts.getBoosts());
    return boost;
  }, [service]);

  // Snooze
  const snoozeTab = useCallback(async (tabId: string, url: string, title: string, preset: string, favicon?: string) => {
    if (!service) return null;
    const snoozed = await service.snoozeTabs.snoozeUntil(tabId, url, title, preset, favicon);
    setSnoozedTabs(service.snoozeTabs.getSnoozedTabs());
    return snoozed;
  }, [service]);

  // Focus Mode
  const toggleFocusMode = useCallback(() => {
    if (!service) return;
    service.focusMode.toggle();
    setFocusModeActive(service.focusMode.isActive());
  }, [service]);

  // Command Bar
  const searchCommands = useCallback((query: string) => {
    if (!service) return [];
    return service.commandBar.search(query);
  }, [service]);

  const executeCommand = useCallback((id: string) => {
    if (!service) return;
    service.commandBar.executeCommand(id);
  }, [service]);

  return {
    // State
    isLoading,
    error,
    islands,
    containers,
    sleepingTabs,
    boosts,
    sessions,
    snoozedTabs,
    focusModeActive,
    resourceStats,
    backendAvailable,

    // Tab Islands
    createIsland,
    addTabToIsland,
    removeTabFromIsland: service?.tabIslands.removeTabFromIsland.bind(service.tabIslands),
    deleteIsland: service?.tabIslands.deleteIsland.bind(service.tabIslands),

    // Containers
    createContainer,
    updateContainer: service?.containers.updateContainer.bind(service.containers),
    deleteContainer: service?.containers.deleteContainer.bind(service.containers),

    // Sleeping Tabs
    sleepTab: service?.sleepingTabs.sleepTab.bind(service.sleepingTabs),
    wakeTab: service?.sleepingTabs.wakeTab.bind(service.sleepingTabs),
    setSleepingConfig: service?.sleepingTabs.setConfig.bind(service.sleepingTabs),
    getSleepingConfig: service?.sleepingTabs.getConfig.bind(service.sleepingTabs),

    // Boosts
    createBoost,
    updateBoost: service?.siteBoosts.updateBoost.bind(service.siteBoosts),
    deleteBoost: service?.siteBoosts.deleteBoost.bind(service.siteBoosts),
    toggleBoost: service?.siteBoosts.toggleBoost.bind(service.siteBoosts),
    getBoostsForUrl: service?.siteBoosts.getBoostsForUrl.bind(service.siteBoosts),

    // Sessions
    saveSession: service?.sessions.saveCurrentSession.bind(service.sessions),
    deleteSession: service?.sessions.deleteSession.bind(service.sessions),

    // Snooze
    snoozeTab,
    cancelSnooze: service?.snoozeTabs.cancelSnooze.bind(service.snoozeTabs),

    // Focus Mode
    toggleFocusMode,
    setFocusModeConfig: service?.focusMode.setConfig.bind(service.focusMode),
    getFocusModeConfig: service?.focusMode.getConfig.bind(service.focusMode),
    isUrlBlocked: service?.focusMode.isUrlBlocked.bind(service.focusMode),

    // Resource Limiter
    setResourceLimits: service?.resourceLimiter.setLimits.bind(service.resourceLimiter),
    getResourceLimits: service?.resourceLimiter.getLimits.bind(service.resourceLimiter),

    // Command Bar
    searchCommands,
    executeCommand,
    registerCommand: service?.commandBar.registerCommand.bind(service.commandBar),

    // PiP
    openPip: service?.pip.openPip.bind(service.pip),
    closePip: service?.pip.closePip.bind(service.pip),

    // Backend Tab Operations (requires Tauri)
    createTab: service?.createTab.bind(service),
    closeTab: service?.closeTab.bind(service),
    navigateTab: service?.navigateTab.bind(service),
    getTabPerformance: service?.getTabPerformance.bind(service),
    getTabConsole: service?.getTabConsole.bind(service),
    getTabNetwork: service?.getTabNetwork.bind(service),

    // Service access
    service,
  };
}

// ============================================================================
// Export
// ============================================================================

export {
  DEFAULT_RESOURCE_LIMITS,
  DEFAULT_SLEEPING_CONFIG,
  DEFAULT_FOCUS_MODE,
  CONTAINER_COLORS,
  CONTAINER_ICONS,
};
