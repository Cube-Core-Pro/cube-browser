// CUBE Nexum - Search Engine TypeScript Service
// Complete TypeScript client for search engine management

import { invoke } from '@tauri-apps/api/core';

// ==================== Types ====================

export type SearchCategory =
  | 'General'
  | 'Video'
  | 'Images'
  | 'Maps'
  | 'Shopping'
  | 'News'
  | 'Code'
  | 'AI'
  | 'Social'
  | 'Reference'
  | 'Custom';

export type SafeSearchLevel = 'Off' | 'Moderate' | 'Strict';

export type SuggestionType =
  | 'SearchSuggestion'
  | 'Bookmark'
  | 'History'
  | 'OpenTab'
  | 'QuickAction'
  | 'Calculator'
  | 'UnitConversion'
  | 'CurrencyConversion'
  | 'SearchEngine';

export type ConversionType = 'Unit' | 'Currency' | 'Temperature' | 'Time';

export type QuickActionType =
  | { OpenUrl: string }
  | { RunCommand: string }
  | 'CopyToClipboard'
  | 'OpenSettings'
  | 'OpenBookmarks'
  | 'OpenHistory'
  | 'OpenDownloads'
  | 'OpenExtensions'
  | 'ClearData'
  | 'NewTab'
  | 'NewWindow'
  | 'NewIncognito';

export interface SearchEngine {
  id: string;
  name: string;
  keyword: string;
  search_url: string;
  suggest_url: string | null;
  favicon_url: string | null;
  is_default: boolean;
  is_builtin: boolean;
  is_enabled: boolean;
  category: SearchCategory;
  use_count: number;
  last_used: string | null;
  created_at: string;
}

export interface SearchSettings {
  default_engine_id: string;
  show_suggestions: boolean;
  show_search_history: boolean;
  show_bookmarks_in_suggestions: boolean;
  show_history_in_suggestions: boolean;
  show_tabs_in_suggestions: boolean;
  max_suggestions: number;
  suggestion_delay_ms: number;
  enable_quick_keywords: boolean;
  enable_bang_commands: boolean;
  enable_calculator: boolean;
  enable_unit_conversion: boolean;
  enable_currency_conversion: boolean;
  safe_search: SafeSearchLevel;
  region: string | null;
  language: string | null;
}

export interface SearchSuggestion {
  text: string;
  suggestion_type: SuggestionType;
  url: string | null;
  description: string | null;
  favicon: string | null;
  relevance_score: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  engine_id: string;
  searched_at: string;
  result_clicked: string | null;
}

export interface QuickAction {
  id: string;
  name: string;
  keyword: string;
  action_type: QuickActionType;
  icon: string | null;
  is_enabled: boolean;
}

export interface OmniboxResult {
  suggestions: SearchSuggestion[];
  quick_action: QuickAction | null;
  calculator_result: string | null;
  conversion_result: ConversionResult | null;
  matched_engine: SearchEngine | null;
}

export interface ConversionResult {
  input: string;
  output: string;
  conversion_type: ConversionType;
}

export interface SearchStats {
  total_searches: number;
  searches_today: number;
  searches_this_week: number;
  searches_this_month: number;
  searches_by_engine: Record<string, number>;
  top_queries: [string, number][];
  calculator_uses: number;
  conversion_uses: number;
}

// ==================== Settings Commands ====================

export async function getSearchSettings(): Promise<SearchSettings> {
  return invoke<SearchSettings>('search_get_settings');
}

export async function updateSearchSettings(settings: SearchSettings): Promise<void> {
  return invoke('search_update_settings', { settings });
}

// ==================== Engine CRUD Commands ====================

export async function addSearchEngine(engine: SearchEngine): Promise<string> {
  return invoke<string>('search_add_engine', { engine });
}

export async function updateSearchEngine(id: string, engine: SearchEngine): Promise<void> {
  return invoke('search_update_engine', { id, engine });
}

export async function deleteSearchEngine(id: string): Promise<void> {
  return invoke('search_delete_engine', { id });
}

export async function getSearchEngine(id: string): Promise<SearchEngine | null> {
  return invoke<SearchEngine | null>('search_get_engine', { id });
}

export async function getAllSearchEngines(): Promise<SearchEngine[]> {
  return invoke<SearchEngine[]>('search_get_all_engines');
}

export async function getEnabledSearchEngines(): Promise<SearchEngine[]> {
  return invoke<SearchEngine[]>('search_get_enabled_engines');
}

export async function getDefaultSearchEngine(): Promise<SearchEngine | null> {
  return invoke<SearchEngine | null>('search_get_default_engine');
}

export async function setDefaultSearchEngine(id: string): Promise<void> {
  return invoke('search_set_default_engine', { id });
}

export async function toggleSearchEngine(id: string, enabled: boolean): Promise<void> {
  return invoke('search_toggle_engine', { id, enabled });
}

export async function getSearchEngineByKeyword(keyword: string): Promise<SearchEngine | null> {
  return invoke<SearchEngine | null>('search_get_engine_by_keyword', { keyword });
}

export async function getSearchEnginesByCategory(category: SearchCategory): Promise<SearchEngine[]> {
  return invoke<SearchEngine[]>('search_get_engines_by_category', { category });
}

// ==================== Search Commands ====================

export async function buildSearchUrl(query: string, engineId?: string): Promise<string> {
  return invoke<string>('search_build_url', { query, engine_id: engineId });
}

export async function recordSearch(query: string, engineId: string): Promise<void> {
  return invoke('search_record', { query, engine_id: engineId });
}

// ==================== Omnibox Commands ====================

export async function processOmnibox(input: string): Promise<OmniboxResult> {
  return invoke<OmniboxResult>('search_process_omnibox', { input });
}

// ==================== Quick Actions Commands ====================

export async function addQuickAction(action: QuickAction): Promise<string> {
  return invoke<string>('search_add_quick_action', { action });
}

export async function getQuickActions(): Promise<QuickAction[]> {
  return invoke<QuickAction[]>('search_get_quick_actions');
}

export async function deleteQuickAction(id: string): Promise<void> {
  return invoke('search_delete_quick_action', { id });
}

// ==================== History Commands ====================

export async function getSearchHistory(limit?: number): Promise<SearchHistoryItem[]> {
  return invoke<SearchHistoryItem[]>('search_engine_get_history', { limit });
}

export async function clearSearchHistory(): Promise<void> {
  return invoke('search_engine_clear_history');
}

export async function deleteSearchHistoryItem(id: string): Promise<void> {
  return invoke('search_engine_delete_history_item', { id });
}

// ==================== Statistics Commands ====================

export async function getSearchStats(): Promise<SearchStats> {
  return invoke<SearchStats>('search_engine_get_stats');
}

export async function resetSearchStats(): Promise<void> {
  return invoke('search_engine_reset_stats');
}

// ==================== Import/Export Commands ====================

export async function exportSearchEngines(): Promise<SearchEngine[]> {
  return invoke<SearchEngine[]>('search_export_engines');
}

export async function importSearchEngines(engines: SearchEngine[]): Promise<number> {
  return invoke<number>('search_import_engines', { engines });
}

// ==================== Helper Functions ====================

export function formatCategoryIcon(category: SearchCategory): string {
  const icons: Record<SearchCategory, string> = {
    General: '🔍',
    Video: '🎬',
    Images: '🖼️',
    Maps: '🗺️',
    Shopping: '🛒',
    News: '📰',
    Code: '💻',
    AI: '🤖',
    Social: '👥',
    Reference: '📚',
    Custom: '⚙️',
  };
  return icons[category] || '🔍';
}

export function formatCategory(category: SearchCategory): string {
  const names: Record<SearchCategory, string> = {
    General: 'General Search',
    Video: 'Video Search',
    Images: 'Image Search',
    Maps: 'Maps & Navigation',
    Shopping: 'Shopping',
    News: 'News',
    Code: 'Code & Development',
    AI: 'AI & Chat',
    Social: 'Social Media',
    Reference: 'Reference',
    Custom: 'Custom',
  };
  return names[category] || category;
}

export function formatSuggestionType(type: SuggestionType): string {
  const types: Record<SuggestionType, string> = {
    SearchSuggestion: '🔍 Search',
    Bookmark: '⭐ Bookmark',
    History: '📜 History',
    OpenTab: '📑 Open Tab',
    QuickAction: '⚡ Action',
    Calculator: '🧮 Calculator',
    UnitConversion: '📐 Conversion',
    CurrencyConversion: '💱 Currency',
    SearchEngine: '🔎 Engine',
  };
  return types[type] || type;
}

export function parseKeyword(input: string): { keyword: string; query: string } | null {
  const trimmed = input.trim();
  
  // Check for @keyword or !bang style
  if (trimmed.startsWith('@') || trimmed.startsWith('!')) {
    const spaceIndex = trimmed.indexOf(' ');
    if (spaceIndex > 0) {
      return {
        keyword: trimmed.substring(0, spaceIndex),
        query: trimmed.substring(spaceIndex + 1).trim(),
      };
    }
    return { keyword: trimmed, query: '' };
  }
  
  return null;
}

export function isUrl(input: string): boolean {
  const urlPatterns = [
    /^https?:\/\//i,
    /^[a-z0-9][-a-z0-9]*\.[a-z]{2,}(\/|$)/i,
    /^localhost(:\d+)?/i,
  ];
  return urlPatterns.some(pattern => pattern.test(input));
}

export function normalizeUrl(input: string): string {
  if (input.match(/^https?:\/\//i)) {
    return input;
  }
  if (input.match(/^localhost/i)) {
    return `http://${input}`;
  }
  return `https://${input}`;
}

export const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  default_engine_id: 'google',
  show_suggestions: true,
  show_search_history: true,
  show_bookmarks_in_suggestions: true,
  show_history_in_suggestions: true,
  show_tabs_in_suggestions: true,
  max_suggestions: 8,
  suggestion_delay_ms: 150,
  enable_quick_keywords: true,
  enable_bang_commands: true,
  enable_calculator: true,
  enable_unit_conversion: true,
  enable_currency_conversion: true,
  safe_search: 'Moderate',
  region: null,
  language: null,
};

export const ALL_CATEGORIES: SearchCategory[] = [
  'General',
  'Video',
  'Images',
  'Maps',
  'Shopping',
  'News',
  'Code',
  'AI',
  'Social',
  'Reference',
  'Custom',
];

export function sortEnginesByUsage(engines: SearchEngine[]): SearchEngine[] {
  return [...engines].sort((a, b) => b.use_count - a.use_count);
}

export function groupEnginesByCategory(
  engines: SearchEngine[]
): Map<SearchCategory, SearchEngine[]> {
  const grouped = new Map<SearchCategory, SearchEngine[]>();
  
  for (const engine of engines) {
    const existing = grouped.get(engine.category) || [];
    existing.push(engine);
    grouped.set(engine.category, existing);
  }
  
  return grouped;
}
