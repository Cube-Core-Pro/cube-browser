/**
 * Search Service - Enterprise Integration Layer
 * 
 * Complete backend integration for all AI Search Engine Tauri commands.
 * Provides typed interfaces and service methods for search queries,
 * suggestions, history, preferences, images, videos, and analytics.
 * 
 * @module lib/services/search-service
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  description: string;
  source: string;
  source_type: SourceType;
  relevance_score: number;
  cached_at: Option<string>;
  metadata: SearchMetadata;
}

export type SourceType = 'Web' | 'Academic' | 'News' | 'Social' | 'Video' | 'Image' | 'Shopping';

export interface SearchMetadata {
  author: Option<string>;
  published_at: Option<string>;
  word_count: Option<number>;
  language: Option<string>;
  reading_time: Option<number>;
}

export interface SearchQuery {
  id: string;
  query: string;
  filters: SearchFilters;
  results_count: number;
  executed_at: string;
}

export interface SearchFilters {
  source_types: SourceType[];
  date_range: Option<DateRange>;
  language: Option<string>;
  safe_search: boolean;
  exclude_domains: string[];
}

export interface DateRange {
  start: string;
  end: string;
}

export interface SearchSuggestion {
  query: string;
  suggestion_type: SuggestionType;
  relevance: number;
}

export type SuggestionType = 'Autocomplete' | 'Related' | 'Trending' | 'History';

export interface SearchHistory {
  id: string;
  query: string;
  results_count: number;
  clicked_results: string[];
  searched_at: string;
}

export interface SearchPreferences {
  default_engine: string;
  safe_search: boolean;
  results_per_page: number;
  preferred_language: string;
  blocked_domains: string[];
  preferred_sources: SourceType[];
  enable_suggestions: boolean;
  save_history: boolean;
}

export interface TrendingSearch {
  query: string;
  category: string;
  volume: number;
  growth: number;
  region: string;
}

export interface SearchStats {
  total_searches: number;
  unique_queries: number;
  avg_results_clicked: number;
  top_sources: SourceStat[];
  search_volume_trend: VolumeTrend[];
}

export interface SourceStat {
  source: string;
  count: number;
  click_rate: number;
}

export interface VolumeTrend {
  date: string;
  searches: number;
}

export interface ImageResult {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string;
  source: string;
  width: number;
  height: number;
  file_size: Option<number>;
  format: string;
}

export interface VideoResult {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string;
  source: string;
  duration: number;
  views: Option<number>;
  published_at: Option<string>;
  channel: Option<string>;
}

export interface SearchQuickStats {
  searches_today: number;
  trending_topics: number;
  saved_searches: number;
  blocked_domains: number;
}

export interface SearchNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

type Option<T> = T | null;

// ============================================================================
// Query Service
// ============================================================================

export const QueryService = {
  /**
   * Execute a search query
   */
  async search(params: {
    query: string;
    sourceTypes?: SourceType[];
    dateRange?: DateRange;
    language?: string;
    safeSearch?: boolean;
    page?: number;
    limit?: number;
  }): Promise<SearchResult[]> {
    return invoke<SearchResult[]>('search_query', {
      query: params.query,
      sourceTypes: params.sourceTypes,
      dateRange: params.dateRange,
      language: params.language,
      safeSearch: params.safeSearch ?? true,
      page: params.page || 1,
      limit: params.limit || 20,
    });
  },

  /**
   * Get search suggestions
   */
  async getSuggestions(partialQuery: string): Promise<SearchSuggestion[]> {
    return invoke<SearchSuggestion[]>('search_suggestions', { partialQuery });
  },

  /**
   * Search for images
   */
  async searchImages(params: {
    query: string;
    size?: 'small' | 'medium' | 'large';
    color?: string;
    imageType?: 'photo' | 'clipart' | 'lineart' | 'animated';
    limit?: number;
  }): Promise<ImageResult[]> {
    return invoke<ImageResult[]>('search_images', {
      query: params.query,
      size: params.size,
      color: params.color,
      imageType: params.imageType,
      limit: params.limit || 20,
    });
  },

  /**
   * Search for videos
   */
  async searchVideos(params: {
    query: string;
    duration?: 'short' | 'medium' | 'long';
    uploadDate?: 'day' | 'week' | 'month' | 'year';
    limit?: number;
  }): Promise<VideoResult[]> {
    return invoke<VideoResult[]>('search_videos', {
      query: params.query,
      duration: params.duration,
      uploadDate: params.uploadDate,
      limit: params.limit || 20,
    });
  },
};

// ============================================================================
// History Service
// ============================================================================

export const HistoryService = {
  /**
   * Get search history
   */
  async getAll(params?: {
    limit?: number;
  }): Promise<SearchHistory[]> {
    return invoke<SearchHistory[]>('search_get_history', {
      limit: params?.limit || 50,
    });
  },

  /**
   * Clear all search history
   */
  async clear(): Promise<boolean> {
    return invoke<boolean>('search_clear_history');
  },

  /**
   * Delete a specific history item
   */
  async deleteItem(historyId: string): Promise<boolean> {
    return invoke<boolean>('search_delete_history_item', { historyId });
  },
};

// ============================================================================
// Preferences Service
// ============================================================================

export const PreferencesService = {
  /**
   * Get search preferences
   */
  async get(): Promise<SearchPreferences> {
    return invoke<SearchPreferences>('search_get_preferences');
  },

  /**
   * Update search preferences
   */
  async update(params: Partial<SearchPreferences>): Promise<SearchPreferences> {
    return invoke<SearchPreferences>('search_update_preferences', params);
  },

  /**
   * Add a blocked domain
   */
  async addBlockedDomain(domain: string): Promise<SearchPreferences> {
    return invoke<SearchPreferences>('search_add_blocked_domain', { domain });
  },

  /**
   * Remove a blocked domain
   */
  async removeBlockedDomain(domain: string): Promise<SearchPreferences> {
    return invoke<SearchPreferences>('search_remove_blocked_domain', { domain });
  },
};

// ============================================================================
// Trending Service
// ============================================================================

export const TrendingService = {
  /**
   * Get trending searches
   */
  async get(params?: {
    category?: string;
    region?: string;
    limit?: number;
  }): Promise<TrendingSearch[]> {
    return invoke<TrendingSearch[]>('search_get_trending', {
      category: params?.category,
      region: params?.region,
      limit: params?.limit || 20,
    });
  },
};

// ============================================================================
// Analytics Service
// ============================================================================

export const SearchAnalyticsService = {
  /**
   * Get search statistics
   */
  async getStats(): Promise<SearchStats> {
    return invoke<SearchStats>('search_get_stats');
  },

  /**
   * Get quick stats for dashboard
   */
  async getQuickStats(): Promise<SearchQuickStats> {
    return invoke<SearchQuickStats>('search_get_quick_stats');
  },

  /**
   * Get notifications
   */
  async getNotifications(): Promise<SearchNotification[]> {
    return invoke<SearchNotification[]>('search_get_notifications');
  },
};

// ============================================================================
// Unified Search Service Export
// ============================================================================

export const SearchService = {
  query: QueryService,
  history: HistoryService,
  preferences: PreferencesService,
  trending: TrendingService,
  analytics: SearchAnalyticsService,
};

export default SearchService;
