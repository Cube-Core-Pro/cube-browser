/**
 * Search Components
 * CUBE Elite v6 - AI Search Engine
 */

export { default as AISearchEngine } from './AISearchEngine';

// Search Services - Backend Integration
export {
  SearchService,
  QueryService,
  HistoryService,
  PreferencesService,
  TrendingService,
  SearchAnalyticsService,
} from '@/lib/services/search-service';

// Search Types
export type {
  SearchQuery,
  SearchResult,
  SearchSuggestion,
  SearchFilters,
  SearchHistory,
  SearchPreferences,
  TrendingSearch,
  SearchStats,
} from '@/lib/services/search-service';
