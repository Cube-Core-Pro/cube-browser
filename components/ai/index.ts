export { AIAssistant } from './AIAssistant';
export { AIChat } from './AIChat';
export { FloatingAIButton } from './FloatingAIButton';
export { AISearchTour } from './AISearchTour';

// Search Services - Backend Integration (used by AI Search features)
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
  SearchHistory as HistoryEntry,
  SearchPreferences,
  TrendingSearch as TrendingTopic,
  SearchStats as SearchAnalytics,
  SearchStats,
} from '@/lib/services/search-service';

// AI Services - Backend Integration (used by AI Chat & Assistant features)
export {
  AIService,
  ChatService,
  OpenAIService,
  AIWorkflowService,
  AISelectorService,
  AIAnalysisService,
} from '@/lib/services/ai-service';

// AI Types
export type {
  ChatMessage,
  BrowserContext,
  CommandSuggestion,
  ChatSession,
  AISettings,
  WorkflowSuggestion,
  WorkflowStep,
  SelectorSuggestion,
} from '@/lib/services/ai-service';
