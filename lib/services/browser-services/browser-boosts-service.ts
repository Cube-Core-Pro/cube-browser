/**
 * CUBE Elite v6 - Browser Boosts & Collections Service
 * 
 * Site customization and web clipping features competing with:
 * Arc (Boosts), Edge (Collections), Vivaldi (Notes), Safari (Reading List)
 * 
 * Features:
 * - Boosts (custom CSS/JS per site) - Arc style
 * - Collections (web clipping) - Edge style
 * - Notes with screenshots - Vivaldi style
 * - Link previews - SigmaOS style
 * - Reading List with offline - Safari style
 * - Page annotations
 * - Custom site themes
 * 
 * @module browser-boosts-service
 * @version 1.0.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Boost (site customization)
 */
export interface Boost {
  /** Unique identifier */
  id: string;
  /** Boost name */
  name: string;
  /** Target domain or URL pattern */
  pattern: string;
  /** Custom CSS */
  css?: string;
  /** Custom JavaScript */
  js?: string;
  /** Is enabled */
  enabled: boolean;
  /** Apply to all subdomains */
  includeSubdomains: boolean;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
  /** Author (for shared boosts) */
  author?: string;
  /** Description */
  description?: string;
  /** Tags */
  tags: string[];
  /** Use count */
  useCount: number;
}

/**
 * Boost template (pre-made boosts)
 */
export interface BoostTemplate {
  id: string;
  name: string;
  description: string;
  category: 'dark-mode' | 'focus' | 'accessibility' | 'productivity' | 'custom';
  pattern: string;
  css: string;
  js?: string;
  downloads: number;
  rating: number;
}

/**
 * Collection (web clipping group)
 */
export interface Collection {
  /** Unique identifier */
  id: string;
  /** Collection name */
  name: string;
  /** Description */
  description?: string;
  /** Cover image */
  cover?: string;
  /** Color theme */
  color: string;
  /** Items in collection */
  items: CollectionItem[];
  /** Is shared */
  isShared: boolean;
  /** Share URL */
  shareUrl?: string;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
  /** Tags */
  tags: string[];
}

/**
 * Collection item types
 */
export type CollectionItemType = 'link' | 'note' | 'image' | 'text' | 'screenshot';

/**
 * Collection item
 */
export interface CollectionItem {
  /** Unique identifier */
  id: string;
  /** Item type */
  type: CollectionItemType;
  /** Title */
  title: string;
  /** URL (for links) */
  url?: string;
  /** Content (for notes/text) */
  content?: string;
  /** Image data URL or path */
  image?: string;
  /** Thumbnail */
  thumbnail?: string;
  /** Favicon */
  favicon?: string;
  /** Source page URL */
  sourceUrl?: string;
  /** Position in collection */
  position: number;
  /** Created timestamp */
  createdAt: Date;
  /** Annotations */
  annotations?: Annotation[];
}

/**
 * Page annotation
 */
export interface Annotation {
  /** Unique identifier */
  id: string;
  /** Annotation type */
  type: 'highlight' | 'note' | 'drawing';
  /** Selected text (for highlights) */
  selectedText?: string;
  /** Note content */
  note?: string;
  /** Color */
  color: string;
  /** Position on page */
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  /** CSS selector of target element */
  selector?: string;
  /** Created timestamp */
  createdAt: Date;
}

/**
 * Browser note
 */
export interface BrowserNote {
  /** Unique identifier */
  id: string;
  /** Note title */
  title: string;
  /** Note content (markdown) */
  content: string;
  /** Associated URL */
  url?: string;
  /** Screenshot */
  screenshot?: string;
  /** Tags */
  tags: string[];
  /** Is pinned */
  pinned: boolean;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
  /** Collection ID */
  collectionId?: string;
}

/**
 * Reading list item
 */
export interface ReadingListItem {
  /** Unique identifier */
  id: string;
  /** Page title */
  title: string;
  /** Page URL */
  url: string;
  /** Excerpt/description */
  excerpt?: string;
  /** Thumbnail image */
  thumbnail?: string;
  /** Favicon */
  favicon?: string;
  /** Estimated read time in minutes */
  readTime?: number;
  /** Is read */
  isRead: boolean;
  /** Read progress (0-1) */
  progress: number;
  /** Offline content (HTML) */
  offlineContent?: string;
  /** Is available offline */
  isOffline: boolean;
  /** Added timestamp */
  addedAt: Date;
  /** Tags */
  tags: string[];
}

/**
 * Link preview data
 */
export interface LinkPreview {
  /** URL */
  url: string;
  /** Page title */
  title: string;
  /** Description */
  description?: string;
  /** OG image */
  image?: string;
  /** Favicon */
  favicon?: string;
  /** Site name */
  siteName?: string;
  /** Content type */
  type?: 'article' | 'video' | 'product' | 'profile' | 'website';
  /** Author */
  author?: string;
  /** Published date */
  publishedDate?: string;
  /** Fetched timestamp */
  fetchedAt: Date;
}

/**
 * Site theme customization
 */
export interface SiteTheme {
  /** Unique identifier */
  id: string;
  /** Domain pattern */
  pattern: string;
  /** Theme name */
  name: string;
  /** Background color */
  backgroundColor?: string;
  /** Text color */
  textColor?: string;
  /** Link color */
  linkColor?: string;
  /** Font family */
  fontFamily?: string;
  /** Font size multiplier */
  fontSizeMultiplier?: number;
  /** Hide elements (CSS selectors) */
  hideElements?: string[];
  /** Dark mode override */
  forceDarkMode?: boolean;
  /** Created timestamp */
  createdAt: Date;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default boost templates
 */
export const BOOST_TEMPLATES: BoostTemplate[] = [
  {
    id: 'dark-everywhere',
    name: 'Dark Mode Everywhere',
    description: 'Force dark mode on any website',
    category: 'dark-mode',
    pattern: '*',
    css: `
      html {
        filter: invert(1) hue-rotate(180deg);
      }
      img, video, canvas, [style*="background-image"] {
        filter: invert(1) hue-rotate(180deg);
      }
    `,
    downloads: 50000,
    rating: 4.5,
  },
  {
    id: 'focus-mode',
    name: 'Focus Mode',
    description: 'Hide distracting elements',
    category: 'focus',
    pattern: '*',
    css: `
      [class*="sidebar"], [class*="recommended"], [class*="related"],
      [class*="comment"], [class*="social"], [class*="share"],
      [id*="sidebar"], [id*="recommended"], [id*="related"] {
        display: none !important;
      }
    `,
    downloads: 30000,
    rating: 4.3,
  },
  {
    id: 'youtube-focus',
    name: 'YouTube Focus',
    description: 'Hide YouTube distractions',
    category: 'focus',
    pattern: 'youtube.com',
    css: `
      #secondary, #comments, ytd-watch-next-secondary-results-renderer,
      ytd-merch-shelf-renderer, #related, .ytp-endscreen-content,
      .ytp-ce-element, ytd-compact-video-renderer {
        display: none !important;
      }
      #primary { max-width: 100% !important; }
    `,
    downloads: 45000,
    rating: 4.7,
  },
  {
    id: 'twitter-declutter',
    name: 'Twitter/X Declutter',
    description: 'Clean up Twitter interface',
    category: 'focus',
    pattern: 'twitter.com,x.com',
    css: `
      [data-testid="sidebarColumn"], [aria-label="Timeline: Trending now"],
      [aria-label="Who to follow"], [data-testid="placementTracking"] {
        display: none !important;
      }
    `,
    downloads: 25000,
    rating: 4.4,
  },
  {
    id: 'readable-fonts',
    name: 'Readable Fonts',
    description: 'Improve readability with better fonts',
    category: 'accessibility',
    pattern: '*',
    css: `
      body, p, article, .content, main {
        font-family: 'Georgia', 'Times New Roman', serif !important;
        font-size: 18px !important;
        line-height: 1.6 !important;
        max-width: 800px !important;
        margin: 0 auto !important;
      }
    `,
    downloads: 15000,
    rating: 4.2,
  },
];

/**
 * Collection colors
 */
export const COLLECTION_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

/**
 * IndexedDB configuration
 */
const DB_NAME = 'cube_browser_boosts';
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
 * Check if URL matches pattern
 */
function urlMatchesPattern(url: string, pattern: string): boolean {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Wildcard pattern
    if (pattern === '*') return true;

    // Multiple patterns (comma-separated)
    const patterns = pattern.split(',').map(p => p.trim());
    
    for (const p of patterns) {
      // Exact domain match
      if (domain === p || domain === `www.${p}`) return true;
      
      // Subdomain match
      if (domain.endsWith(`.${p}`)) return true;
      
      // Wildcard subdomain (*.example.com)
      if (p.startsWith('*.')) {
        const baseDomain = p.slice(2);
        if (domain === baseDomain || domain.endsWith(`.${baseDomain}`)) return true;
      }
      
      // URL path pattern
      if (p.includes('/')) {
        const fullUrl = urlObj.href.replace(/^https?:\/\//, '').replace(/^www\./, '');
        if (fullUrl.startsWith(p)) return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Estimate read time from HTML content
 */
function estimateReadTime(html: string): number {
  // Remove HTML tags and get text
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(' ').length;
  
  // Average reading speed: 200 words per minute
  return Math.ceil(words / 200);
}

/**
 * Extract excerpt from HTML
 */
function extractExcerpt(html: string, maxLength: number = 200): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

// ============================================================================
// Boosts Service (Arc Style)
// ============================================================================

/**
 * Manages site customizations
 */
export class BoostsService {
  private boosts: Map<string, Boost> = new Map();
  private activeBoosts: Map<string, string[]> = new Map(); // URL -> applied boost IDs
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.loadBoosts().then(resolve);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('boosts')) {
          const store = db.createObjectStore('boosts', { keyPath: 'id' });
          store.createIndex('pattern', 'pattern', { unique: false });
        }
        if (!db.objectStoreNames.contains('collections')) {
          const store = db.createObjectStore('collections', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
        }
        if (!db.objectStoreNames.contains('notes')) {
          const store = db.createObjectStore('notes', { keyPath: 'id' });
          store.createIndex('url', 'url', { unique: false });
        }
        if (!db.objectStoreNames.contains('reading_list')) {
          const store = db.createObjectStore('reading_list', { keyPath: 'id' });
          store.createIndex('isRead', 'isRead', { unique: false });
        }
        if (!db.objectStoreNames.contains('site_themes')) {
          db.createObjectStore('site_themes', { keyPath: 'id' });
        }
      };
    });
  }

  private async loadBoosts(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['boosts'], 'readonly');
      const store = transaction.objectStore('boosts');
      const request = store.getAll();

      request.onsuccess = () => {
        for (const boost of request.result) {
          this.boosts.set(boost.id, {
            ...boost,
            createdAt: new Date(boost.createdAt),
            updatedAt: new Date(boost.updatedAt),
          });
        }
        resolve();
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Create new boost
   */
  async createBoost(data: {
    name: string;
    pattern: string;
    css?: string;
    js?: string;
    description?: string;
    tags?: string[];
  }): Promise<Boost> {
    const boost: Boost = {
      id: `boost-${generateId()}`,
      name: data.name,
      pattern: data.pattern,
      css: data.css,
      js: data.js,
      enabled: true,
      includeSubdomains: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: data.description,
      tags: data.tags || [],
      useCount: 0,
    };

    this.boosts.set(boost.id, boost);
    await this.saveBoost(boost);
    return boost;
  }

  /**
   * Create boost from template
   */
  async createFromTemplate(templateId: string, customPattern?: string): Promise<Boost | null> {
    const template = BOOST_TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    return this.createBoost({
      name: template.name,
      pattern: customPattern || template.pattern,
      css: template.css,
      js: template.js,
      description: template.description,
      tags: [template.category],
    });
  }

  /**
   * Save boost to DB
   */
  private async saveBoost(boost: Boost): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['boosts'], 'readwrite');
      const store = transaction.objectStore('boosts');
      
      const storable = {
        ...boost,
        createdAt: boost.createdAt.toISOString(),
        updatedAt: boost.updatedAt.toISOString(),
      };

      const request = store.put(storable);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Update boost
   */
  async updateBoost(id: string, updates: Partial<Boost>): Promise<void> {
    const boost = this.boosts.get(id);
    if (boost) {
      Object.assign(boost, updates, { updatedAt: new Date() });
      await this.saveBoost(boost);
    }
  }

  /**
   * Delete boost
   */
  async deleteBoost(id: string): Promise<void> {
    this.boosts.delete(id);
    
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['boosts'], 'readwrite');
        const store = transaction.objectStore('boosts');
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Toggle boost enabled state
   */
  async toggleBoost(id: string): Promise<boolean> {
    const boost = this.boosts.get(id);
    if (boost) {
      boost.enabled = !boost.enabled;
      boost.updatedAt = new Date();
      await this.saveBoost(boost);
      return boost.enabled;
    }
    return false;
  }

  /**
   * Get all boosts
   */
  getBoosts(): Boost[] {
    return Array.from(this.boosts.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get boosts for URL
   */
  getBoostsForUrl(url: string): Boost[] {
    return Array.from(this.boosts.values())
      .filter(b => b.enabled && urlMatchesPattern(url, b.pattern));
  }

  /**
   * Apply boosts to page
   */
  applyBoosts(url: string): { css: string; js: string } {
    const boosts = this.getBoostsForUrl(url);
    const appliedIds: string[] = [];
    
    let combinedCss = '';
    let combinedJs = '';

    for (const boost of boosts) {
      if (boost.css) {
        combinedCss += `/* Boost: ${boost.name} */\n${boost.css}\n\n`;
      }
      if (boost.js) {
        combinedJs += `// Boost: ${boost.name}\n${boost.js}\n\n`;
      }
      appliedIds.push(boost.id);
      boost.useCount++;
    }

    this.activeBoosts.set(url, appliedIds);
    
    return { css: combinedCss, js: combinedJs };
  }

  /**
   * Get boost templates
   */
  getTemplates(): BoostTemplate[] {
    return [...BOOST_TEMPLATES];
  }

  /**
   * Export boost
   */
  exportBoost(id: string): string {
    const boost = this.boosts.get(id);
    if (!boost) throw new Error('Boost not found');
    
    return JSON.stringify({
      name: boost.name,
      pattern: boost.pattern,
      css: boost.css,
      js: boost.js,
      description: boost.description,
      tags: boost.tags,
    }, null, 2);
  }

  /**
   * Import boost
   */
  async importBoost(json: string): Promise<Boost> {
    const data = JSON.parse(json);
    return this.createBoost(data);
  }
}

// ============================================================================
// Collections Service (Edge Style)
// ============================================================================

/**
 * Manages web clipping collections
 */
export class CollectionsService {
  private collections: Map<string, Collection> = new Map();
  private db: IDBDatabase | null = null;

  async init(db: IDBDatabase): Promise<void> {
    this.db = db;
    await this.loadCollections();
  }

  private async loadCollections(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['collections'], 'readonly');
      const store = transaction.objectStore('collections');
      const request = store.getAll();

      request.onsuccess = () => {
        for (const collection of request.result) {
          this.collections.set(collection.id, {
            ...collection,
            createdAt: new Date(collection.createdAt),
            updatedAt: new Date(collection.updatedAt),
            items: collection.items.map((item: Record<string, unknown>) => ({
              ...item,
              createdAt: new Date(item.createdAt as string),
            })),
          });
        }
        resolve();
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Create new collection
   */
  async createCollection(name: string, description?: string): Promise<Collection> {
    const collection: Collection = {
      id: `col-${generateId()}`,
      name,
      description,
      color: COLLECTION_COLORS[this.collections.size % COLLECTION_COLORS.length],
      items: [],
      isShared: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    };

    this.collections.set(collection.id, collection);
    await this.saveCollection(collection);
    return collection;
  }

  /**
   * Save collection to DB
   */
  private async saveCollection(collection: Collection): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['collections'], 'readwrite');
      const store = transaction.objectStore('collections');
      
      const storable = {
        ...collection,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
        items: collection.items.map(item => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        })),
      };

      const request = store.put(storable);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Add item to collection
   */
  async addItem(
    collectionId: string,
    item: Omit<CollectionItem, 'id' | 'position' | 'createdAt'>
  ): Promise<CollectionItem> {
    const collection = this.collections.get(collectionId);
    if (!collection) throw new Error('Collection not found');

    const newItem: CollectionItem = {
      ...item,
      id: `item-${generateId()}`,
      position: collection.items.length,
      createdAt: new Date(),
    };

    collection.items.push(newItem);
    collection.updatedAt = new Date();
    await this.saveCollection(collection);
    
    return newItem;
  }

  /**
   * Add link to collection
   */
  async addLink(
    collectionId: string,
    url: string,
    title: string,
    favicon?: string
  ): Promise<CollectionItem> {
    return this.addItem(collectionId, {
      type: 'link',
      title,
      url,
      favicon,
      sourceUrl: url,
    });
  }

  /**
   * Add note to collection
   */
  async addNote(collectionId: string, title: string, content: string): Promise<CollectionItem> {
    return this.addItem(collectionId, {
      type: 'note',
      title,
      content,
    });
  }

  /**
   * Add screenshot to collection
   */
  async addScreenshot(
    collectionId: string,
    title: string,
    imageData: string,
    sourceUrl?: string
  ): Promise<CollectionItem> {
    return this.addItem(collectionId, {
      type: 'screenshot',
      title,
      image: imageData,
      thumbnail: imageData, // Could generate smaller thumbnail
      sourceUrl,
    });
  }

  /**
   * Add selected text to collection
   */
  async addSelectedText(
    collectionId: string,
    text: string,
    sourceUrl: string
  ): Promise<CollectionItem> {
    return this.addItem(collectionId, {
      type: 'text',
      title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
      content: text,
      sourceUrl,
    });
  }

  /**
   * Remove item from collection
   */
  async removeItem(collectionId: string, itemId: string): Promise<void> {
    const collection = this.collections.get(collectionId);
    if (!collection) return;

    collection.items = collection.items.filter(i => i.id !== itemId);
    collection.updatedAt = new Date();
    await this.saveCollection(collection);
  }

  /**
   * Reorder items in collection
   */
  async reorderItems(collectionId: string, itemIds: string[]): Promise<void> {
    const collection = this.collections.get(collectionId);
    if (!collection) return;

    const itemMap = new Map(collection.items.map(i => [i.id, i]));
    collection.items = itemIds
      .map((id, index) => {
        const item = itemMap.get(id);
        if (item) item.position = index;
        return item;
      })
      .filter((i): i is CollectionItem => i !== undefined);

    collection.updatedAt = new Date();
    await this.saveCollection(collection);
  }

  /**
   * Add annotation to item
   */
  async addAnnotation(
    collectionId: string,
    itemId: string,
    annotation: Omit<Annotation, 'id' | 'createdAt'>
  ): Promise<void> {
    const collection = this.collections.get(collectionId);
    if (!collection) return;

    const item = collection.items.find(i => i.id === itemId);
    if (!item) return;

    if (!item.annotations) {
      item.annotations = [];
    }

    item.annotations.push({
      ...annotation,
      id: `ann-${generateId()}`,
      createdAt: new Date(),
    });

    collection.updatedAt = new Date();
    await this.saveCollection(collection);
  }

  /**
   * Get all collections
   */
  getCollections(): Collection[] {
    return Array.from(this.collections.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get collection by ID
   */
  getCollection(id: string): Collection | null {
    return this.collections.get(id) || null;
  }

  /**
   * Delete collection
   */
  async deleteCollection(id: string): Promise<void> {
    this.collections.delete(id);
    
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['collections'], 'readwrite');
        const store = transaction.objectStore('collections');
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Share collection
   */
  async shareCollection(id: string): Promise<string> {
    const collection = this.collections.get(id);
    if (!collection) throw new Error('Collection not found');

    collection.isShared = true;
    collection.shareUrl = `https://cube.app/collections/${id}`;
    await this.saveCollection(collection);
    
    return collection.shareUrl;
  }

  /**
   * Export collection
   */
  exportCollection(id: string, format: 'json' | 'html' | 'markdown'): string {
    const collection = this.collections.get(id);
    if (!collection) throw new Error('Collection not found');

    switch (format) {
      case 'json':
        return JSON.stringify(collection, null, 2);
      
      case 'html':
        return this.collectionToHtml(collection);
      
      case 'markdown':
        return this.collectionToMarkdown(collection);
      
      default:
        throw new Error('Unknown format');
    }
  }

  private collectionToHtml(collection: Collection): string {
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${collection.name}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .item { margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .item-link { color: #3b82f6; text-decoration: none; }
    .item-note { white-space: pre-wrap; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <h1>${collection.name}</h1>
  ${collection.description ? `<p>${collection.description}</p>` : ''}
`;

    for (const item of collection.items) {
      html += `  <div class="item">
    <h3>${item.title}</h3>
`;
      if (item.url) {
        html += `    <a class="item-link" href="${item.url}">${item.url}</a>\n`;
      }
      if (item.content) {
        html += `    <p class="item-note">${item.content}</p>\n`;
      }
      if (item.image) {
        html += `    <img src="${item.image}" alt="${item.title}">\n`;
      }
      html += `  </div>\n`;
    }

    html += `</body>
</html>`;

    return html;
  }

  private collectionToMarkdown(collection: Collection): string {
    let md = `# ${collection.name}\n\n`;
    
    if (collection.description) {
      md += `${collection.description}\n\n`;
    }

    md += `---\n\n`;

    for (const item of collection.items) {
      md += `## ${item.title}\n\n`;
      
      if (item.url) {
        md += `[${item.url}](${item.url})\n\n`;
      }
      if (item.content) {
        md += `${item.content}\n\n`;
      }
      if (item.image) {
        md += `![${item.title}](${item.image})\n\n`;
      }

      md += `---\n\n`;
    }

    return md;
  }
}

// ============================================================================
// Notes Service (Vivaldi Style)
// ============================================================================

/**
 * Manages browser notes with screenshots
 */
export class BrowserNotesService {
  private notes: Map<string, BrowserNote> = new Map();
  private db: IDBDatabase | null = null;

  async init(db: IDBDatabase): Promise<void> {
    this.db = db;
    await this.loadNotes();
  }

  private async loadNotes(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const request = store.getAll();

      request.onsuccess = () => {
        for (const note of request.result) {
          this.notes.set(note.id, {
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
          });
        }
        resolve();
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Create new note
   */
  async createNote(data: {
    title: string;
    content?: string;
    url?: string;
    screenshot?: string;
    tags?: string[];
  }): Promise<BrowserNote> {
    const note: BrowserNote = {
      id: `note-${generateId()}`,
      title: data.title,
      content: data.content || '',
      url: data.url,
      screenshot: data.screenshot,
      tags: data.tags || [],
      pinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notes.set(note.id, note);
    await this.saveNote(note);
    return note;
  }

  /**
   * Save note to DB
   */
  private async saveNote(note: BrowserNote): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      
      const storable = {
        ...note,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      };

      const request = store.put(storable);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Update note
   */
  async updateNote(id: string, updates: Partial<BrowserNote>): Promise<void> {
    const note = this.notes.get(id);
    if (note) {
      Object.assign(note, updates, { updatedAt: new Date() });
      await this.saveNote(note);
    }
  }

  /**
   * Delete note
   */
  async deleteNote(id: string): Promise<void> {
    this.notes.delete(id);
    
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['notes'], 'readwrite');
        const store = transaction.objectStore('notes');
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Toggle pinned
   */
  async togglePinned(id: string): Promise<boolean> {
    const note = this.notes.get(id);
    if (note) {
      note.pinned = !note.pinned;
      note.updatedAt = new Date();
      await this.saveNote(note);
      return note.pinned;
    }
    return false;
  }

  /**
   * Get all notes
   */
  getNotes(): BrowserNote[] {
    return Array.from(this.notes.values())
      .sort((a, b) => {
        // Pinned first, then by date
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
  }

  /**
   * Get notes for URL
   */
  getNotesForUrl(url: string): BrowserNote[] {
    return Array.from(this.notes.values())
      .filter(n => n.url === url)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Search notes
   */
  searchNotes(query: string): BrowserNote[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.notes.values())
      .filter(n => 
        n.title.toLowerCase().includes(lowerQuery) ||
        n.content.toLowerCase().includes(lowerQuery) ||
        n.tags.some(t => t.toLowerCase().includes(lowerQuery))
      );
  }
}

// ============================================================================
// Reading List Service (Safari Style)
// ============================================================================

/**
 * Manages reading list with offline support
 */
export class ReadingListService {
  private items: Map<string, ReadingListItem> = new Map();
  private db: IDBDatabase | null = null;

  async init(db: IDBDatabase): Promise<void> {
    this.db = db;
    await this.loadItems();
  }

  private async loadItems(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['reading_list'], 'readonly');
      const store = transaction.objectStore('reading_list');
      const request = store.getAll();

      request.onsuccess = () => {
        for (const item of request.result) {
          this.items.set(item.id, {
            ...item,
            addedAt: new Date(item.addedAt),
          });
        }
        resolve();
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Add page to reading list
   */
  async addToList(data: {
    url: string;
    title: string;
    excerpt?: string;
    thumbnail?: string;
    favicon?: string;
    tags?: string[];
  }): Promise<ReadingListItem> {
    // Check if already in list
    const existing = Array.from(this.items.values()).find(i => i.url === data.url);
    if (existing) return existing;

    const item: ReadingListItem = {
      id: `read-${generateId()}`,
      url: data.url,
      title: data.title,
      excerpt: data.excerpt,
      thumbnail: data.thumbnail,
      favicon: data.favicon,
      isRead: false,
      progress: 0,
      isOffline: false,
      addedAt: new Date(),
      tags: data.tags || [],
    };

    this.items.set(item.id, item);
    await this.saveItem(item);
    return item;
  }

  /**
   * Save item to DB
   */
  private async saveItem(item: ReadingListItem): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['reading_list'], 'readwrite');
      const store = transaction.objectStore('reading_list');
      
      const storable = {
        ...item,
        addedAt: item.addedAt.toISOString(),
      };

      const request = store.put(storable);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Remove from reading list
   */
  async removeFromList(id: string): Promise<void> {
    this.items.delete(id);
    
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['reading_list'], 'readwrite');
        const store = transaction.objectStore('reading_list');
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Mark as read
   */
  async markAsRead(id: string): Promise<void> {
    const item = this.items.get(id);
    if (item) {
      item.isRead = true;
      item.progress = 1;
      await this.saveItem(item);
    }
  }

  /**
   * Update read progress
   */
  async updateProgress(id: string, progress: number): Promise<void> {
    const item = this.items.get(id);
    if (item) {
      item.progress = Math.min(1, Math.max(0, progress));
      if (item.progress > 0.9) {
        item.isRead = true;
      }
      await this.saveItem(item);
    }
  }

  /**
   * Save for offline reading
   */
  async saveOffline(id: string, htmlContent: string): Promise<void> {
    const item = this.items.get(id);
    if (item) {
      item.offlineContent = htmlContent;
      item.isOffline = true;
      item.readTime = estimateReadTime(htmlContent);
      item.excerpt = item.excerpt || extractExcerpt(htmlContent);
      await this.saveItem(item);
    }
  }

  /**
   * Get reading list
   */
  getList(filter?: 'all' | 'unread' | 'read' | 'offline'): ReadingListItem[] {
    let items = Array.from(this.items.values());

    switch (filter) {
      case 'unread':
        items = items.filter(i => !i.isRead);
        break;
      case 'read':
        items = items.filter(i => i.isRead);
        break;
      case 'offline':
        items = items.filter(i => i.isOffline);
        break;
    }

    return items.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }

  /**
   * Get item by ID
   */
  getItem(id: string): ReadingListItem | null {
    return this.items.get(id) || null;
  }

  /**
   * Get total unread count
   */
  getUnreadCount(): number {
    return Array.from(this.items.values()).filter(i => !i.isRead).length;
  }
}

// ============================================================================
// Link Preview Service (SigmaOS Style)
// ============================================================================

/**
 * Fetches and caches link previews
 */
export class LinkPreviewService {
  private cache: Map<string, LinkPreview> = new Map();
  private pendingRequests: Map<string, Promise<LinkPreview | null>> = new Map();

  /**
   * Get link preview
   */
  async getPreview(url: string): Promise<LinkPreview | null> {
    // Check cache
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.fetchedAt.getTime() < 24 * 60 * 60 * 1000) {
      return cached;
    }

    // Check pending request
    const pending = this.pendingRequests.get(url);
    if (pending) return pending;

    // Fetch preview
    const request = this.fetchPreview(url);
    this.pendingRequests.set(url, request);

    try {
      const preview = await request;
      if (preview) {
        this.cache.set(url, preview);
      }
      return preview;
    } finally {
      this.pendingRequests.delete(url);
    }
  }

  /**
   * Fetch preview from URL
   */
  private async fetchPreview(url: string): Promise<LinkPreview | null> {
    try {
      // In production, use a backend service or CORS proxy
      // For now, simulate with basic data extraction
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CUBEBot/1.0',
        },
      });

      if (!response.ok) return null;

      const html = await response.text();
      return this.parsePreviewFromHtml(url, html);
    } catch {
      // Fetch failed, return basic preview
      try {
        const urlObj = new URL(url);
        return {
          url,
          title: urlObj.hostname,
          siteName: urlObj.hostname,
          favicon: `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
          fetchedAt: new Date(),
        };
      } catch {
        return null;
      }
    }
  }

  /**
   * Parse preview data from HTML
   */
  private parsePreviewFromHtml(url: string, html: string): LinkPreview {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const urlObj = new URL(url);

    // Get title
    const title = 
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      doc.querySelector('title')?.textContent ||
      urlObj.hostname;

    // Get description
    const description = 
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="description"]')?.getAttribute('content');

    // Get image
    const image = 
      doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');

    // Get site name
    const siteName = 
      doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
      urlObj.hostname;

    // Get type
    const ogType = doc.querySelector('meta[property="og:type"]')?.getAttribute('content');
    let type: LinkPreview['type'];
    if (ogType?.includes('article')) type = 'article';
    else if (ogType?.includes('video')) type = 'video';
    else if (ogType?.includes('product')) type = 'product';
    else if (ogType?.includes('profile')) type = 'profile';
    else type = 'website';

    // Get author
    const author = 
      doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="article:author"]')?.getAttribute('content');

    // Get published date
    const publishedDate = 
      doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content');

    // Get favicon
    const favicon = 
      doc.querySelector('link[rel="icon"]')?.getAttribute('href') ||
      doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
      `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;

    return {
      url,
      title: title || '',
      description: description ?? undefined,
      image: image ? new URL(image, url).href : undefined,
      favicon: favicon ? new URL(favicon, url).href : undefined,
      siteName: siteName ?? undefined,
      type: type ?? undefined,
      author: author ?? undefined,
      publishedDate: publishedDate ?? undefined,
      fetchedAt: new Date(),
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached previews
   */
  getCachedPreviews(): LinkPreview[] {
    return Array.from(this.cache.values());
  }
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for browser boosts and collections
 */
export function useBrowserBoosts() {
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [notes, setNotes] = useState<BrowserNote[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const boostsServiceRef = useRef<BoostsService | null>(null);
  const collectionsServiceRef = useRef<CollectionsService | null>(null);
  const notesServiceRef = useRef<BrowserNotesService | null>(null);
  const readingListServiceRef = useRef<ReadingListService | null>(null);
  const linkPreviewServiceRef = useRef<LinkPreviewService | null>(null);

  // Initialize services
  useEffect(() => {
    const init = async () => {
      boostsServiceRef.current = new BoostsService();
      linkPreviewServiceRef.current = new LinkPreviewService();

      await boostsServiceRef.current.init();
      
      // Initialize dependent services with shared DB
      const db = (boostsServiceRef.current as unknown as { db: IDBDatabase }).db;
      if (db) {
        collectionsServiceRef.current = new CollectionsService();
        notesServiceRef.current = new BrowserNotesService();
        readingListServiceRef.current = new ReadingListService();

        await collectionsServiceRef.current.init(db);
        await notesServiceRef.current.init(db);
        await readingListServiceRef.current.init(db);
      }

      // Load data
      setBoosts(boostsServiceRef.current.getBoosts());
      setCollections(collectionsServiceRef.current?.getCollections() || []);
      setNotes(notesServiceRef.current?.getNotes() || []);
      setReadingList(readingListServiceRef.current?.getList() || []);
      setIsLoading(false);
    };

    init();
  }, []);

  // Boost actions
  const createBoost = useCallback(async (data: Parameters<BoostsService['createBoost']>[0]) => {
    const boost = await boostsServiceRef.current?.createBoost(data);
    if (boost) {
      setBoosts(boostsServiceRef.current!.getBoosts());
    }
    return boost;
  }, []);

  const toggleBoost = useCallback(async (id: string) => {
    await boostsServiceRef.current?.toggleBoost(id);
    setBoosts(boostsServiceRef.current!.getBoosts());
  }, []);

  // Collection actions
  const createCollection = useCallback(async (name: string, description?: string) => {
    const collection = await collectionsServiceRef.current?.createCollection(name, description);
    if (collection) {
      setCollections(collectionsServiceRef.current!.getCollections());
    }
    return collection;
  }, []);

  const addToCollection = useCallback(async (
    collectionId: string,
    item: Omit<CollectionItem, 'id' | 'position' | 'createdAt'>
  ) => {
    const newItem = await collectionsServiceRef.current?.addItem(collectionId, item);
    if (newItem) {
      setCollections(collectionsServiceRef.current!.getCollections());
    }
    return newItem;
  }, []);

  // Note actions
  const createNote = useCallback(async (data: Parameters<BrowserNotesService['createNote']>[0]) => {
    const note = await notesServiceRef.current?.createNote(data);
    if (note) {
      setNotes(notesServiceRef.current!.getNotes());
    }
    return note;
  }, []);

  // Reading list actions
  const addToReadingList = useCallback(async (data: Parameters<ReadingListService['addToList']>[0]) => {
    const item = await readingListServiceRef.current?.addToList(data);
    if (item) {
      setReadingList(readingListServiceRef.current!.getList());
    }
    return item;
  }, []);

  // Link preview
  const getLinkPreview = useCallback(async (url: string) => {
    return linkPreviewServiceRef.current?.getPreview(url);
  }, []);

  return {
    // State
    boosts,
    collections,
    notes,
    readingList,
    isLoading,

    // Boost actions
    createBoost,
    toggleBoost,
    getBoostTemplates: () => boostsServiceRef.current?.getTemplates() || [],
    applyBoosts: (url: string) => boostsServiceRef.current?.applyBoosts(url),

    // Collection actions
    createCollection,
    addToCollection,

    // Note actions
    createNote,

    // Reading list actions
    addToReadingList,
    markAsRead: async (id: string) => {
      await readingListServiceRef.current?.markAsRead(id);
      setReadingList(readingListServiceRef.current!.getList());
    },

    // Link preview
    getLinkPreview,

    // Services
    services: {
      boosts: boostsServiceRef.current,
      collections: collectionsServiceRef.current,
      notes: notesServiceRef.current,
      readingList: readingListServiceRef.current,
      linkPreview: linkPreviewServiceRef.current,
    },
  };
}
