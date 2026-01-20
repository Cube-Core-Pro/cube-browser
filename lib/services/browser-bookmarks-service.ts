// CUBE Nexum - Bookmarks Service
// TypeScript client for bookmark management

import { invoke } from '@tauri-apps/api/core';

// ==================== Types ====================

export type BookmarkType = 'Url' | 'Folder' | 'Separator';
export type BookmarkSource = 'Manual' | 'Import' | 'Sync' | 'Extension' | 'ReadingList';
export type SortOrder = 'Manual' | 'Alphabetical' | 'DateAdded' | 'DateModified' | 'VisitCount' | 'RecentlyUsed';
export type ViewMode = 'List' | 'Grid' | 'Compact' | 'Cards';

export interface BookmarkSettings {
  sync_enabled: boolean;
  auto_thumbnail: boolean;
  track_visits: boolean;
  show_favicons: boolean;
  default_folder_id: string;
  sort_order: SortOrder;
  view_mode: ViewMode;
  show_tags_bar: boolean;
  max_recent: number;
  backup_enabled: boolean;
  backup_interval_hours: number;
}

export interface Bookmark {
  id: string;
  bookmark_type: BookmarkType;
  title: string;
  url: string | null;
  description: string | null;
  favicon: string | null;
  thumbnail: string | null;
  parent_id: string | null;
  position: number;
  tags: string[];
  is_favorite: boolean;
  is_pinned: boolean;
  color: string | null;
  icon: string | null;
  source: BookmarkSource;
  visit_count: number;
  last_visited: string | null;
  created_at: string;
  modified_at: string;
  synced_at: string | null;
  metadata: Record<string, string>;
}

export interface BookmarkTag {
  name: string;
  color: string;
  bookmark_count: number;
  created_at: string;
}

export interface BookmarkStats {
  total_bookmarks: number;
  total_folders: number;
  total_tags: number;
  most_visited: Bookmark[];
  recently_added: Bookmark[];
  favorites_count: number;
  orphaned_count: number;
  duplicate_count: number;
}

export interface BookmarkFilter {
  query?: string;
  folder_id?: string;
  tags?: string[];
  is_favorite?: boolean;
  bookmark_type?: BookmarkType;
  source?: BookmarkSource;
  date_from?: string;
  date_to?: string;
  min_visits?: number;
  sort_by: SortOrder;
  limit?: number;
}

export interface BookmarkTreeNode {
  bookmark: Bookmark;
  children: BookmarkTreeNode[];
}

export interface ImportResult {
  imported_count: number;
  folders_count: number;
  duplicates_skipped: number;
  errors: string[];
}

// ==================== Settings ====================

export async function getBookmarkSettings(): Promise<BookmarkSettings> {
  return await invoke<BookmarkSettings>('browser_bookmarks_get_settings');
}

export async function updateBookmarkSettings(settings: BookmarkSettings): Promise<void> {
  return await invoke<void>('browser_bookmarks_update_settings', { settings });
}

// ==================== CRUD Operations ====================

export async function createBookmark(
  title: string,
  url: string,
  parentId?: string
): Promise<Bookmark> {
  return await invoke<Bookmark>('browser_bookmarks_create', {
    title,
    url,
    parentId,
  });
}

export async function createFolder(
  title: string,
  parentId?: string
): Promise<Bookmark> {
  return await invoke<Bookmark>('browser_bookmarks_create_folder', {
    title,
    parentId,
  });
}

export async function getBookmark(id: string): Promise<Bookmark | null> {
  return await invoke<Bookmark | null>('browser_bookmarks_get', { id });
}

export async function updateBookmark(id: string, bookmark: Bookmark): Promise<Bookmark> {
  return await invoke<Bookmark>('browser_bookmarks_update', { id, bookmark });
}

export async function deleteBookmark(id: string): Promise<void> {
  return await invoke<void>('browser_bookmarks_delete', { id });
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  return await invoke<Bookmark[]>('browser_bookmarks_get_all');
}

// ==================== Movement ====================

export async function moveBookmark(
  id: string,
  newParentId: string,
  position?: number
): Promise<void> {
  return await invoke<void>('browser_bookmarks_move', {
    id,
    newParentId,
    position,
  });
}

export async function reorderBookmark(id: string, newPosition: number): Promise<void> {
  return await invoke<void>('browser_bookmarks_reorder', { id, newPosition });
}

export async function moveToBar(id: string): Promise<void> {
  return await invoke<void>('browser_bookmarks_move_to_bar', { id });
}

export async function moveToOther(id: string): Promise<void> {
  return await invoke<void>('browser_bookmarks_move_to_other', { id });
}

// ==================== Tags ====================

export async function addTag(bookmarkId: string, tagName: string): Promise<void> {
  return await invoke<void>('browser_bookmarks_add_tag', { bookmarkId, tagName });
}

export async function removeTag(bookmarkId: string, tagName: string): Promise<void> {
  return await invoke<void>('browser_bookmarks_remove_tag', { bookmarkId, tagName });
}

export async function getAllTags(): Promise<BookmarkTag[]> {
  return await invoke<BookmarkTag[]>('browser_bookmarks_get_all_tags');
}

export async function getBookmarksByTag(tagName: string): Promise<Bookmark[]> {
  return await invoke<Bookmark[]>('browser_bookmarks_get_by_tag', { tagName });
}

export async function setTags(bookmarkId: string, tags: string[]): Promise<void> {
  return await invoke<void>('browser_bookmarks_set_tags', { bookmarkId, tags });
}

// ==================== Favorites ====================

export async function toggleFavorite(id: string): Promise<boolean> {
  return await invoke<boolean>('browser_bookmarks_toggle_favorite', { id });
}

export async function setFavorite(id: string, isFavorite: boolean): Promise<void> {
  return await invoke<void>('browser_bookmarks_set_favorite', { id, isFavorite });
}

export async function getFavorites(): Promise<Bookmark[]> {
  return await invoke<Bookmark[]>('browser_bookmarks_get_favorites');
}

// ==================== Search & Filter ====================

export async function searchBookmarks(query: string): Promise<Bookmark[]> {
  return await invoke<Bookmark[]>('browser_bookmarks_search', { query });
}

export async function filterBookmarks(filter: BookmarkFilter): Promise<Bookmark[]> {
  return await invoke<Bookmark[]>('browser_bookmarks_filter', { filter });
}

export async function searchByUrl(url: string): Promise<Bookmark | null> {
  return await invoke<Bookmark | null>('browser_bookmarks_search_by_url', { url });
}

export async function searchInFolder(folderId: string, query: string): Promise<Bookmark[]> {
  return await invoke<Bookmark[]>('browser_bookmarks_search_in_folder', {
    folderId,
    query,
  });
}

// ==================== Tree Operations ====================

export async function getFolderContents(folderId: string): Promise<Bookmark[]> {
  return await invoke<Bookmark[]>('browser_bookmarks_get_folder_contents', { folderId });
}

export async function getBookmarkTree(rootId?: string): Promise<BookmarkTreeNode | null> {
  return await invoke<BookmarkTreeNode | null>('browser_bookmarks_get_tree', { rootId });
}

export async function getAllFolders(): Promise<Bookmark[]> {
  return await invoke<Bookmark[]>('browser_bookmarks_get_all_folders');
}

export async function getBookmarksBar(): Promise<Bookmark[]> {
  return await invoke<Bookmark[]>('browser_bookmarks_get_bar');
}

export async function getOtherBookmarks(): Promise<Bookmark[]> {
  return await invoke<Bookmark[]>('browser_bookmarks_get_other');
}

export async function getMobileBookmarks(): Promise<Bookmark[]> {
  return await invoke<Bookmark[]>('browser_bookmarks_get_mobile');
}

// ==================== Visit Tracking ====================

export async function recordVisit(id: string): Promise<void> {
  return await invoke<void>('browser_bookmarks_record_visit', { id });
}

export async function getMostVisited(limit?: number): Promise<Bookmark[]> {
  return await invoke<Bookmark[]>('browser_bookmarks_get_most_visited', { limit });
}

export async function getRecentlyAdded(limit?: number): Promise<Bookmark[]> {
  return await invoke<Bookmark[]>('browser_bookmarks_get_recently_added', { limit });
}

export async function getRecentlyUsed(limit?: number): Promise<Bookmark[]> {
  return await invoke<Bookmark[]>('browser_bookmarks_get_recently_used', { limit });
}

// ==================== Statistics ====================

export async function getBookmarkStats(): Promise<BookmarkStats> {
  return await invoke<BookmarkStats>('browser_bookmarks_get_stats');
}

export async function getBookmarkCount(): Promise<number> {
  return await invoke<number>('browser_bookmarks_get_count');
}

export async function getFolderCount(): Promise<number> {
  return await invoke<number>('browser_bookmarks_get_folder_count');
}

// ==================== Import/Export ====================

export async function exportBookmarksJson(): Promise<string> {
  return await invoke<string>('browser_bookmarks_export_json');
}

export async function exportBookmarksHtml(): Promise<string> {
  return await invoke<string>('browser_bookmarks_export_html');
}

export async function importBookmarksJson(json: string): Promise<ImportResult> {
  return await invoke<ImportResult>('browser_bookmarks_import_json', { json });
}

export async function importFromFile(path: string): Promise<ImportResult> {
  return await invoke<ImportResult>('browser_bookmarks_import_from_file', { path });
}

export async function exportToFile(path: string, format: 'json' | 'html'): Promise<void> {
  return await invoke<void>('browser_bookmarks_export_to_file', { path, format });
}

// ==================== Utility ====================

export async function checkUrlExists(url: string): Promise<Bookmark | null> {
  return await invoke<Bookmark | null>('browser_bookmarks_check_url_exists', { url });
}

export async function findDuplicates(): Promise<[Bookmark, Bookmark][]> {
  return await invoke<[Bookmark, Bookmark][]>('browser_bookmarks_find_duplicates');
}

export async function cleanupOrphaned(): Promise<number> {
  return await invoke<number>('browser_bookmarks_cleanup_orphaned');
}

// ==================== Quick Actions ====================

export async function quickAdd(url: string, title: string): Promise<Bookmark> {
  return await invoke<Bookmark>('browser_bookmarks_quick_add', { url, title });
}

export async function quickAddToFolder(
  url: string,
  title: string,
  folderName: string
): Promise<Bookmark> {
  return await invoke<Bookmark>('browser_bookmarks_quick_add_to_folder', {
    url,
    title,
    folderName,
  });
}

// ==================== Batch Operations ====================

export async function batchDelete(ids: string[]): Promise<number> {
  return await invoke<number>('browser_bookmarks_batch_delete', { ids });
}

export async function batchMove(ids: string[], targetFolderId: string): Promise<number> {
  return await invoke<number>('browser_bookmarks_batch_move', { ids, targetFolderId });
}

export async function batchAddTag(ids: string[], tag: string): Promise<number> {
  return await invoke<number>('browser_bookmarks_batch_add_tag', { ids, tag });
}

export async function batchSetFavorite(ids: string[], isFavorite: boolean): Promise<number> {
  return await invoke<number>('browser_bookmarks_batch_set_favorite', { ids, isFavorite });
}

// ==================== Convenience Functions ====================

export async function isBookmarked(url: string): Promise<boolean> {
  const bookmark = await checkUrlExists(url);
  return bookmark !== null;
}

export async function bookmarkCurrentPage(
  url: string,
  title: string,
  favicon?: string
): Promise<Bookmark> {
  const bookmark = await createBookmark(title, url);
  
  if (favicon && bookmark) {
    const updated = { ...bookmark, favicon };
    return await updateBookmark(bookmark.id, updated);
  }
  
  return bookmark;
}

export async function getFolderPath(bookmarkId: string): Promise<string[]> {
  const path: string[] = [];
  let currentId: string | null = bookmarkId;
  
  while (currentId) {
    const bookmark = await getBookmark(currentId);
    if (bookmark) {
      path.unshift(bookmark.title);
      currentId = bookmark.parent_id;
    } else {
      break;
    }
  }
  
  return path;
}

export async function getOrCreateFolder(
  name: string,
  parentId?: string
): Promise<Bookmark> {
  const folders = await getAllFolders();
  const existing = folders.find(
    f => f.title.toLowerCase() === name.toLowerCase() &&
         (parentId ? f.parent_id === parentId : true)
  );
  
  if (existing) {
    return existing;
  }
  
  return await createFolder(name, parentId);
}

export function sortBookmarks(bookmarks: Bookmark[], order: SortOrder): Bookmark[] {
  const sorted = [...bookmarks];
  
  switch (order) {
    case 'Alphabetical':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'DateAdded':
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'DateModified':
      sorted.sort((a, b) => new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime());
      break;
    case 'VisitCount':
      sorted.sort((a, b) => b.visit_count - a.visit_count);
      break;
    case 'RecentlyUsed':
      sorted.sort((a, b) => {
        const aTime = a.last_visited ? new Date(a.last_visited).getTime() : 0;
        const bTime = b.last_visited ? new Date(b.last_visited).getTime() : 0;
        return bTime - aTime;
      });
      break;
    case 'Manual':
    default:
      sorted.sort((a, b) => a.position - b.position);
      break;
  }
  
  return sorted;
}

export function groupBookmarksByTag(bookmarks: Bookmark[]): Map<string, Bookmark[]> {
  const groups = new Map<string, Bookmark[]>();
  
  for (const bookmark of bookmarks) {
    for (const tag of bookmark.tags) {
      if (!groups.has(tag)) {
        groups.set(tag, []);
      }
      groups.get(tag)!.push(bookmark);
    }
    
    // Untagged group
    if (bookmark.tags.length === 0) {
      if (!groups.has('Untagged')) {
        groups.set('Untagged', []);
      }
      groups.get('Untagged')!.push(bookmark);
    }
  }
  
  return groups;
}

export function groupBookmarksByDomain(bookmarks: Bookmark[]): Map<string, Bookmark[]> {
  const groups = new Map<string, Bookmark[]>();
  
  for (const bookmark of bookmarks) {
    if (bookmark.url) {
      try {
        const url = new URL(bookmark.url);
        const domain = url.hostname;
        
        if (!groups.has(domain)) {
          groups.set(domain, []);
        }
        groups.get(domain)!.push(bookmark);
      } catch {
        // Invalid URL, skip
      }
    }
  }
  
  return groups;
}

// ==================== Export All ====================

export const bookmarksService = {
  // Settings
  getSettings: getBookmarkSettings,
  updateSettings: updateBookmarkSettings,
  
  // CRUD
  create: createBookmark,
  createFolder,
  get: getBookmark,
  update: updateBookmark,
  delete: deleteBookmark,
  getAll: getAllBookmarks,
  
  // Movement
  move: moveBookmark,
  reorder: reorderBookmark,
  moveToBar,
  moveToOther,
  
  // Tags
  addTag,
  removeTag,
  getAllTags,
  getByTag: getBookmarksByTag,
  setTags,
  
  // Favorites
  toggleFavorite,
  setFavorite,
  getFavorites,
  
  // Search
  search: searchBookmarks,
  filter: filterBookmarks,
  searchByUrl,
  searchInFolder,
  
  // Tree
  getFolderContents,
  getTree: getBookmarkTree,
  getAllFolders,
  getBar: getBookmarksBar,
  getOther: getOtherBookmarks,
  getMobile: getMobileBookmarks,
  
  // Visits
  recordVisit,
  getMostVisited,
  getRecentlyAdded,
  getRecentlyUsed,
  
  // Stats
  getStats: getBookmarkStats,
  getCount: getBookmarkCount,
  getFolderCount,
  
  // Import/Export
  exportJson: exportBookmarksJson,
  exportHtml: exportBookmarksHtml,
  importJson: importBookmarksJson,
  importFromFile,
  exportToFile,
  
  // Utility
  checkUrlExists,
  findDuplicates,
  cleanupOrphaned,
  
  // Quick Actions
  quickAdd,
  quickAddToFolder,
  
  // Batch
  batchDelete,
  batchMove,
  batchAddTag,
  batchSetFavorite,
  
  // Convenience
  isBookmarked,
  bookmarkCurrentPage,
  getFolderPath,
  getOrCreateFolder,
  sortBookmarks,
  groupByTag: groupBookmarksByTag,
  groupByDomain: groupBookmarksByDomain,
};
