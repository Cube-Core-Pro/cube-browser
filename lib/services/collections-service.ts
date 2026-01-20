/**
 * Collections Service - Page Collections & Bookmarks Integration Layer
 * CUBE Nexum v7 - Complete Collections Operations Service
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Types
// ============================================================================

export interface Collection {
  id: string;
  title: string;
  description?: string;
  color: string;
  icon?: string;
  pages: CollectionPage[];
  created_at: number;
  updated_at: number;
  is_shared: boolean;
  share_code?: string;
}

export interface CollectionPage {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  preview_image?: string;
  notes?: string;
  date_added: number;
}

export interface CreateCollectionRequest {
  title: string;
  description?: string;
  color: string;
  icon?: string;
}

export interface UpdateCollectionRequest {
  collectionId: string;
  title?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface AddPageRequest {
  collectionId: string;
  url: string;
  title: string;
  favicon?: string;
  notes?: string;
}

export interface CollectionShareSettings {
  isPublic: boolean;
  allowComments: boolean;
  allowCopy: boolean;
  expiresAt?: string;
}

// ============================================================================
// Collection Management Service
// ============================================================================

export const CollectionManagementService = {
  /**
   * Get all collections
   */
  getAll: async (): Promise<Collection[]> => {
    return invoke<Collection[]>('get_collections');
  },

  /**
   * Get a specific collection by ID
   */
  getById: async (collectionId: string): Promise<Collection> => {
    return invoke<Collection>('get_collection', { collectionId });
  },

  /**
   * Create a new collection
   */
  create: async (request: CreateCollectionRequest): Promise<Collection> => {
    return invoke<Collection>('create_collection', {
      title: request.title,
      description: request.description,
      color: request.color,
      icon: request.icon,
    });
  },

  /**
   * Update an existing collection
   */
  update: async (request: UpdateCollectionRequest): Promise<Collection> => {
    return invoke<Collection>('update_collection', {
      collectionId: request.collectionId,
      title: request.title,
      description: request.description,
      color: request.color,
    });
  },

  /**
   * Delete a collection
   */
  delete: async (collectionId: string): Promise<void> => {
    return invoke('delete_collection', { collectionId });
  },

  /**
   * Duplicate a collection
   */
  duplicate: async (collectionId: string): Promise<Collection> => {
    return invoke<Collection>('duplicate_collection', { collectionId });
  },
};

// ============================================================================
// Collection Pages Service
// ============================================================================

export const CollectionPagesService = {
  /**
   * Add a page to a collection
   */
  addPage: async (request: AddPageRequest): Promise<CollectionPage> => {
    return invoke<CollectionPage>('add_page_to_collection', {
      collectionId: request.collectionId,
      url: request.url,
      title: request.title,
      favicon: request.favicon,
      notes: request.notes,
    });
  },

  /**
   * Remove a page from a collection
   */
  removePage: async (collectionId: string, pageId: string): Promise<void> => {
    return invoke('remove_page_from_collection', { collectionId, pageId });
  },

  /**
   * Update page notes
   */
  updateNotes: async (collectionId: string, pageId: string, notes: string): Promise<void> => {
    return invoke('update_page_notes', { collectionId, pageId, notes });
  },

  /**
   * Move page to another collection
   */
  movePage: async (
    sourceCollectionId: string, 
    pageId: string, 
    targetCollectionId: string
  ): Promise<void> => {
    return invoke('move_page_to_collection', { 
      sourceCollectionId, 
      pageId, 
      targetCollectionId 
    });
  },

  /**
   * Reorder pages within a collection
   */
  reorderPages: async (collectionId: string, pageIds: string[]): Promise<void> => {
    return invoke('reorder_collection_pages', { collectionId, pageIds });
  },
};

// ============================================================================
// Collection Sharing Service
// ============================================================================

export const CollectionSharingService = {
  /**
   * Share a collection and get a share link
   */
  share: async (
    collectionId: string, 
    settings?: CollectionShareSettings
  ): Promise<string> => {
    return invoke<string>('share_collection', { collectionId, settings });
  },

  /**
   * Stop sharing a collection
   */
  unshare: async (collectionId: string): Promise<void> => {
    return invoke('unshare_collection', { collectionId });
  },

  /**
   * Get share settings for a collection
   */
  getShareSettings: async (collectionId: string): Promise<CollectionShareSettings | null> => {
    return invoke<CollectionShareSettings | null>('get_collection_share_settings', { collectionId });
  },

  /**
   * Update share settings
   */
  updateShareSettings: async (
    collectionId: string, 
    settings: CollectionShareSettings
  ): Promise<void> => {
    return invoke('update_collection_share_settings', { collectionId, settings });
  },

  /**
   * Import a shared collection
   */
  importShared: async (shareCode: string): Promise<Collection> => {
    return invoke<Collection>('import_shared_collection', { shareCode });
  },
};

// ============================================================================
// Collection Export Service
// ============================================================================

export const CollectionExportService = {
  /**
   * Export collection to HTML
   */
  exportToHtml: async (collectionId: string): Promise<string> => {
    return invoke<string>('export_collection_html', { collectionId });
  },

  /**
   * Export collection to JSON
   */
  exportToJson: async (collectionId: string): Promise<string> => {
    return invoke<string>('export_collection_json', { collectionId });
  },

  /**
   * Import collection from JSON
   */
  importFromJson: async (json: string): Promise<Collection> => {
    return invoke<Collection>('import_collection_json', { json });
  },

  /**
   * Export all collections
   */
  exportAll: async (format: 'html' | 'json'): Promise<string> => {
    return invoke<string>('export_all_collections', { format });
  },
};

// ============================================================================
// Main Collections Service Export
// ============================================================================

export const CollectionsService = {
  Collection: CollectionManagementService,
  Pages: CollectionPagesService,
  Sharing: CollectionSharingService,
  Export: CollectionExportService,
};

export default CollectionsService;
