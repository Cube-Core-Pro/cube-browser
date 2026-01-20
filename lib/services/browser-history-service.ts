/**
 * CUBE Nexum - History Service
 * Superior to Chrome, Firefox, Safari, Brave history systems
 * TypeScript service for Tauri backend integration
 */

import { invoke } from '@tauri-apps/api/core';

// ==================== Enums ====================

export type VisitType = 
  | 'Link'
  | 'Typed'
  | 'Bookmark'
  | 'Redirect'
  | 'Reload'
  | 'FormSubmit'
  | 'ContextMenu'
  | 'Generated'
  | 'StartPage'
  | 'Restore';

export type PageType = 
  | 'Article'
  | 'Video'
  | 'Image'
  | 'Document'
  | 'Social'
  | 'Shopping'
  | 'News'
  | 'Search'
  | 'Email'
  | 'Forum'
  | 'Wiki'
  | 'Blog'
  | 'Entertainment'
  | 'Education'
  | 'Business'
  | 'Unknown';

export type SessionStatus = 'Active' | 'Closed' | 'Crashed' | 'Restored';

export type TimeRange = 
  | 'LastHour'
  | 'Today'
  | 'Yesterday'
  | 'LastWeek'
  | 'LastMonth'
  | 'LastThreeMonths'
  | 'LastSixMonths'
  | 'LastYear'
  | 'AllTime'
  | 'Custom';

export type SortOrder = 
  | 'DateDesc'
  | 'DateAsc'
  | 'VisitCountDesc'
  | 'TitleAsc'
  | 'DurationDesc';

// ==================== Interfaces ====================

export interface HistorySettings {
  enabled: boolean;
  retention_days: number;
  max_entries: number;
  track_visit_duration: boolean;
  track_scroll_position: boolean;
  save_page_content: boolean;
  sync_enabled: boolean;
  excluded_domains: string[];
  excluded_patterns: string[];
  private_mode_history: boolean;
  auto_delete_on_close: boolean;
  group_by_domain: boolean;
  show_previews: boolean;
  analytics_enabled: boolean;
}

export interface Visit {
  id: string;
  timestamp: number;
  visit_type: VisitType;
  duration_ms: number;
  from_url: string | null;
  session_id: string | null;
  tab_id: string | null;
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  favicon_url: string | null;
  domain: string;
  page_type: PageType;
  visit_count: number;
  first_visit: number;
  last_visit: number;
  total_duration_ms: number;
  scroll_position: number | null;
  search_query: string | null;
  referrer: string | null;
  tags: string[];
  starred: boolean;
  preview_image: string | null;
  preview_text: string | null;
  visits: Visit[];
}

export interface BrowsingSession {
  id: string;
  name: string | null;
  started_at: number;
  ended_at: number | null;
  status: SessionStatus;
  entry_ids: string[];
  tabs_count: number;
  windows_count: number;
  total_duration_ms: number;
  device_name: string;
}

export interface DomainStats {
  domain: string;
  visit_count: number;
  total_duration_ms: number;
  first_visit: number;
  last_visit: number;
  entry_count: number;
  average_duration_ms: number;
}

export interface HistoryStats {
  total_entries: number;
  total_visits: number;
  total_duration_ms: number;
  unique_domains: number;
  visits_today: number;
  visits_this_week: number;
  visits_this_month: number;
  most_visited_domains: DomainStats[];
  page_type_distribution: Record<string, number>;
  hourly_distribution: number[];
  daily_average_visits: number;
}

export interface HistoryFilter {
  search_query?: string;
  domains: string[];
  page_types: PageType[];
  time_range: TimeRange;
  date_from?: number;
  date_to?: number;
  min_visits?: number;
  min_duration_ms?: number;
  starred_only: boolean;
  tags: string[];
  sort_by: SortOrder;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  entry: HistoryEntry;
  score: number;
  matched_fields: string[];
  snippet: string | null;
}

export interface FrequentSite {
  domain: string;
  title: string;
  url: string;
  favicon_url: string | null;
  visit_count: number;
  last_visit: number;
}

export interface RecentlyClosed {
  id: string;
  url: string;
  title: string;
  favicon_url: string | null;
  closed_at: number;
  tab_id: string | null;
  session_id: string | null;
}

// ==================== Settings Functions ====================

export async function getHistorySettings(): Promise<HistorySettings> {
  return invoke<HistorySettings>('history_get_settings');
}

export async function updateHistorySettings(settings: HistorySettings): Promise<void> {
  return invoke('history_update_settings', { settings });
}

export async function addExcludedDomain(domain: string): Promise<void> {
  return invoke('history_add_excluded_domain', { domain });
}

export async function removeExcludedDomain(domain: string): Promise<void> {
  return invoke('history_remove_excluded_domain', { domain });
}

export async function setRetentionDays(days: number): Promise<void> {
  return invoke('history_set_retention_days', { days });
}

// ==================== Entry Operations ====================

export async function addHistoryEntry(
  url: string, 
  title: string, 
  visitType: VisitType
): Promise<HistoryEntry> {
  return invoke<HistoryEntry>('history_add_entry', { url, title, visitType });
}

export async function updateHistoryEntry(
  entryId: string, 
  updates: HistoryEntry
): Promise<HistoryEntry> {
  return invoke<HistoryEntry>('history_update_entry', { entryId, updates });
}

export async function updateDuration(entryId: string, durationMs: number): Promise<void> {
  return invoke('history_update_duration', { entryId, durationMs });
}

export async function updateScrollPosition(entryId: string, position: number): Promise<void> {
  return invoke('history_update_scroll_position', { entryId, position });
}

export async function deleteHistoryEntry(entryId: string): Promise<void> {
  return invoke('history_delete_entry', { entryId });
}

export async function deleteHistoryEntries(entryIds: string[]): Promise<number> {
  return invoke<number>('history_delete_entries', { entryIds });
}

// ==================== Retrieval Functions ====================

export async function getHistoryEntry(entryId: string): Promise<HistoryEntry | null> {
  return invoke<HistoryEntry | null>('history_get_entry', { entryId });
}

export async function getHistoryEntryByUrl(url: string): Promise<HistoryEntry | null> {
  return invoke<HistoryEntry | null>('history_get_entry_by_url', { url });
}

export async function getAllHistoryEntries(): Promise<HistoryEntry[]> {
  return invoke<HistoryEntry[]>('history_get_all_entries');
}

export async function getRecentEntries(limit: number): Promise<HistoryEntry[]> {
  return invoke<HistoryEntry[]>('history_get_recent_entries', { limit });
}

export async function getEntriesByDomain(domain: string): Promise<HistoryEntry[]> {
  return invoke<HistoryEntry[]>('history_get_entries_by_domain', { domain });
}

export async function getEntriesByPageType(pageType: PageType): Promise<HistoryEntry[]> {
  return invoke<HistoryEntry[]>('history_get_entries_by_page_type', { pageType });
}

export async function getStarredEntries(): Promise<HistoryEntry[]> {
  return invoke<HistoryEntry[]>('history_get_starred_entries');
}

export async function filterHistoryEntries(filter: HistoryFilter): Promise<HistoryEntry[]> {
  return invoke<HistoryEntry[]>('history_filter_entries', { filter });
}

// ==================== Search Functions ====================

export async function searchHistory(query: string): Promise<SearchResult[]> {
  return invoke<SearchResult[]>('history_search', { query });
}

export async function suggestUrls(query: string, limit: number): Promise<string[]> {
  return invoke<string[]>('history_suggest', { query, limit });
}

// ==================== Tags Functions ====================

export async function addHistoryTag(entryId: string, tag: string): Promise<void> {
  return invoke('history_add_tag', { entryId, tag });
}

export async function removeHistoryTag(entryId: string, tag: string): Promise<void> {
  return invoke('history_remove_tag', { entryId, tag });
}

export async function toggleStarred(entryId: string): Promise<boolean> {
  return invoke<boolean>('history_toggle_starred', { entryId });
}

export async function getAllTags(): Promise<string[]> {
  return invoke<string[]>('history_get_all_tags');
}

// ==================== Session Functions ====================

export async function startSession(deviceName: string): Promise<BrowsingSession> {
  return invoke<BrowsingSession>('history_start_session', { deviceName });
}

export async function endSession(): Promise<BrowsingSession> {
  return invoke<BrowsingSession>('history_end_session');
}

export async function getCurrentSession(): Promise<BrowsingSession | null> {
  return invoke<BrowsingSession | null>('history_get_current_session');
}

export async function getSession(sessionId: string): Promise<BrowsingSession | null> {
  return invoke<BrowsingSession | null>('history_get_session', { sessionId });
}

export async function getAllSessions(): Promise<BrowsingSession[]> {
  return invoke<BrowsingSession[]>('history_get_all_sessions');
}

export async function getRecentSessions(limit: number): Promise<BrowsingSession[]> {
  return invoke<BrowsingSession[]>('history_get_recent_sessions', { limit });
}

export async function restoreSession(sessionId: string): Promise<string[]> {
  return invoke<string[]>('history_restore_session', { sessionId });
}

export async function renameSession(sessionId: string, name: string): Promise<void> {
  return invoke('history_rename_session', { sessionId, name });
}

export async function deleteSession(sessionId: string): Promise<void> {
  return invoke('history_delete_session', { sessionId });
}

// ==================== Recently Closed Functions ====================

export async function addRecentlyClosed(
  url: string, 
  title: string, 
  tabId?: string
): Promise<void> {
  return invoke('history_add_recently_closed', { url, title, tabId });
}

export async function getRecentlyClosed(limit: number): Promise<RecentlyClosed[]> {
  return invoke<RecentlyClosed[]>('history_get_recently_closed', { limit });
}

export async function restoreRecentlyClosed(id: string): Promise<RecentlyClosed> {
  return invoke<RecentlyClosed>('history_restore_recently_closed', { id });
}

export async function clearRecentlyClosed(): Promise<void> {
  return invoke('history_clear_recently_closed');
}

// ==================== Frequent Sites Functions ====================

export async function getFrequentSites(limit: number): Promise<FrequentSite[]> {
  return invoke<FrequentSite[]>('history_get_frequent_sites', { limit });
}

// ==================== Statistics Functions ====================

export async function getHistoryStats(): Promise<HistoryStats> {
  return invoke<HistoryStats>('history_get_stats');
}

export async function getDomainStats(domain: string): Promise<DomainStats | null> {
  return invoke<DomainStats | null>('history_get_domain_stats', { domain });
}

export async function getAllDomains(): Promise<string[]> {
  return invoke<string[]>('history_get_all_domains');
}

// ==================== Cleanup Functions ====================

export async function clearHistory(timeRange: TimeRange): Promise<number> {
  return invoke<number>('history_clear', { timeRange });
}

export async function clearDomainHistory(domain: string): Promise<number> {
  return invoke<number>('history_clear_domain', { domain });
}

export async function cleanupOldEntries(): Promise<number> {
  return invoke<number>('history_cleanup_old_entries');
}

// ==================== Export/Import Functions ====================

export async function exportHistory(): Promise<string> {
  return invoke<string>('history_export');
}

export async function importHistory(json: string): Promise<number> {
  return invoke<number>('history_import', { json });
}

// ==================== Utility Functions ====================

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function formatVisitCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export function getPageTypeIcon(pageType: PageType): string {
  const icons: Record<PageType, string> = {
    Article: '📰',
    Video: '🎬',
    Image: '🖼️',
    Document: '📄',
    Social: '👥',
    Shopping: '🛒',
    News: '📢',
    Search: '🔍',
    Email: '📧',
    Forum: '💬',
    Wiki: '📖',
    Blog: '✍️',
    Entertainment: '🎭',
    Education: '🎓',
    Business: '💼',
    Unknown: '🌐',
  };
  return icons[pageType] || '🌐';
}

export function getVisitTypeLabel(visitType: VisitType): string {
  const labels: Record<VisitType, string> = {
    Link: 'Clicked Link',
    Typed: 'Typed URL',
    Bookmark: 'From Bookmark',
    Redirect: 'Redirected',
    Reload: 'Page Reload',
    FormSubmit: 'Form Submit',
    ContextMenu: 'Context Menu',
    Generated: 'Generated',
    StartPage: 'Start Page',
    Restore: 'Restored Tab',
  };
  return labels[visitType] || visitType;
}

export function getTimeRangeLabel(timeRange: TimeRange): string {
  const labels: Record<TimeRange, string> = {
    LastHour: 'Last Hour',
    Today: 'Today',
    Yesterday: 'Yesterday',
    LastWeek: 'Last 7 Days',
    LastMonth: 'Last 30 Days',
    LastThreeMonths: 'Last 3 Months',
    LastSixMonths: 'Last 6 Months',
    LastYear: 'Last Year',
    AllTime: 'All Time',
    Custom: 'Custom Range',
  };
  return labels[timeRange] || timeRange;
}

export function groupEntriesByDate(entries: HistoryEntry[]): Map<string, HistoryEntry[]> {
  const groups = new Map<string, HistoryEntry[]>();
  
  entries.forEach(entry => {
    const date = new Date(entry.last_visit * 1000);
    const key = date.toLocaleDateString();
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(entry);
  });
  
  return groups;
}

export function groupEntriesByDomain(entries: HistoryEntry[]): Map<string, HistoryEntry[]> {
  const groups = new Map<string, HistoryEntry[]>();
  
  entries.forEach(entry => {
    if (!groups.has(entry.domain)) {
      groups.set(entry.domain, []);
    }
    groups.get(entry.domain)!.push(entry);
  });
  
  return groups;
}

// ==================== Default Filter ====================

export function createDefaultFilter(): HistoryFilter {
  return {
    search_query: undefined,
    domains: [],
    page_types: [],
    time_range: 'AllTime',
    date_from: undefined,
    date_to: undefined,
    min_visits: undefined,
    min_duration_ms: undefined,
    starred_only: false,
    tags: [],
    sort_by: 'DateDesc',
    limit: 100,
    offset: 0,
  };
}

// ==================== Default Export ====================

const BrowserHistoryService = {
  // Settings
  getSettings: getHistorySettings,
  updateSettings: updateHistorySettings,
  addExcludedDomain,
  removeExcludedDomain,
  setRetentionDays,
  
  // Entry Operations
  addEntry: addHistoryEntry,
  updateEntry: updateHistoryEntry,
  updateDuration,
  updateScrollPosition,
  deleteEntry: deleteHistoryEntry,
  deleteEntries: deleteHistoryEntries,
  
  // Retrieval
  getEntry: getHistoryEntry,
  getEntryByUrl: getHistoryEntryByUrl,
  getAllEntries: getAllHistoryEntries,
  getRecentEntries,
  getEntriesByDomain,
  getEntriesByPageType,
  getStarredEntries,
  filter: filterHistoryEntries,
  
  // Search
  search: searchHistory,
  suggest: suggestUrls,
  
  // Tags
  addTag: addHistoryTag,
  removeTag: removeHistoryTag,
  toggleStarred,
  getAllTags,
  
  // Sessions
  startSession,
  endSession,
  getCurrentSession,
  getSession,
  getAllSessions,
  getRecentSessions,
  restoreSession,
  renameSession,
  deleteSession,
  
  // Recently Closed
  addRecentlyClosed,
  getRecentlyClosed,
  restoreRecentlyClosed,
  clearRecentlyClosed,
  
  // Frequent Sites
  getFrequentSites,
  
  // Statistics
  getStats: getHistoryStats,
  getDomainStats,
  getAllDomains,
  
  // Cleanup
  clear: clearHistory,
  clearDomain: clearDomainHistory,
  cleanupOldEntries,
  
  // Export/Import
  export: exportHistory,
  import: importHistory,
  
  // Utils
  formatDuration,
  formatVisitCount,
  formatTimestamp,
  getPageTypeIcon,
  getVisitTypeLabel,
  getTimeRangeLabel,
  groupEntriesByDate,
  groupEntriesByDomain,
  createDefaultFilter,
};

export default BrowserHistoryService;
