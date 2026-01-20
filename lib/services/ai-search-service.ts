/**
 * CUBE AI Search API Service
 * Real integration with search APIs and AI providers
 * 
 * Now integrated with Tauri backend search commands
 * 
 * Supports:
 * - Brave Search API
 * - SerpAPI (Google, Bing, DuckDuckGo)
 * - Exa.ai (Semantic Search)
 * - Tavily Search
 * - OpenAI for answer generation
 * - Tauri Backend Search Engine
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('AISearch');

// ===== Backend Integration =====

interface BackendSearchFilters {
  date_range?: { from?: string; to?: string; preset?: string };
  language?: string;
  region?: string;
  domain?: string;
  exclude_domains: string[];
  file_type?: string;
  safe_search: 'Off' | 'Moderate' | 'Strict';
  exact_match: boolean;
}

interface BackendSearchResultItem {
  id: string;
  title: string;
  url: string;
  display_url: string;
  snippet: string;
  source_engine: string;
  category: string;
  favicon?: string;
  thumbnail?: string;
  published_at?: string;
  relevance_score: number;
  is_sponsored: boolean;
  is_ai_generated: boolean;
  metadata: {
    site_name?: string;
    author?: string;
    reading_time?: number;
    word_count?: number;
    language?: string;
    rating?: number;
    reviews_count?: number;
    price?: string;
  };
}

interface BackendAISummary {
  summary: string;
  key_points: string[];
  sources: string[];
  confidence: number;
  generated_at: string;
}

interface BackendSearchResponse {
  query_id: string;
  query: string;
  total_results: number;
  search_time_ms: number;
  results: BackendSearchResultItem[];
  suggestions: string[];
  related_searches: string[];
  ai_summary?: BackendAISummary;
  knowledge_panel?: {
    title: string;
    description: string;
    image_url?: string;
    facts: Array<{ label: string; value: string }>;
    links: Array<{ title: string; url: string }>;
  };
  pagination: { page: number; per_page: number; total_pages: number; has_next: boolean; has_prev: boolean };
}

interface BackendSearchHistory {
  id: string;
  query: string;
  engines: string[];
  category: string;
  result_count: number;
  searched_at: string;
  clicked_results: string[];
}

interface BackendSearchPreferences {
  default_engine: string;
  safe_search: string;
  language: string;
  region: string;
  results_per_page: number;
  enable_suggestions: boolean;
  enable_history: boolean;
  enable_ai_summaries: boolean;
  blocked_domains: string[];
}

interface BackendTrendingTopic {
  id: string;
  topic: string;
  category: string;
  search_volume: number;
  trend_direction: string;
  change_percentage: number;
  region: string;
  related_queries: string[];
}

interface BackendSearchStats {
  total_searches: number;
  searches_today: number;
  searches_this_week: number;
  top_categories: Array<{ category: string; count: number }>;
  favorite_engines: Array<{ engine: string; usage: number }>;
  avg_results_clicked: number;
  ai_summaries_generated: number;
}

const BackendSearchAPI = {
  async query(
    query: string,
    engines?: string[],
    category?: string,
    page?: number,
    filters?: BackendSearchFilters
  ): Promise<BackendSearchResponse> {
    try {
      return await invoke<BackendSearchResponse>('search_query', {
        query,
        engines,
        category,
        page,
        filters,
      });
    } catch (error) {
      log.warn('Backend search query failed:', error);
      throw error;
    }
  },

  async getSuggestions(query: string, limit?: number): Promise<string[]> {
    try {
      return await invoke<string[]>('search_suggestions', { query, limit });
    } catch (error) {
      log.warn('Backend suggestions failed:', error);
      return [];
    }
  },

  async getHistory(limit?: number): Promise<BackendSearchHistory[]> {
    try {
      return await invoke<BackendSearchHistory[]>('search_get_history', { limit });
    } catch (error) {
      log.warn('Backend getHistory failed:', error);
      return [];
    }
  },

  async clearHistory(): Promise<void> {
    try {
      await invoke<void>('search_clear_history');
    } catch (error) {
      log.warn('Backend clearHistory failed:', error);
    }
  },

  async deleteHistoryItem(itemId: string): Promise<void> {
    try {
      await invoke<void>('search_delete_history_item', { itemId });
    } catch (error) {
      log.warn('Backend deleteHistoryItem failed:', error);
    }
  },

  async getPreferences(): Promise<BackendSearchPreferences | null> {
    try {
      return await invoke<BackendSearchPreferences>('search_get_preferences');
    } catch (error) {
      log.warn('Backend getPreferences failed:', error);
      return null;
    }
  },

  async updatePreferences(preferences: Partial<BackendSearchPreferences>): Promise<void> {
    try {
      await invoke<void>('search_update_preferences', { preferences });
    } catch (error) {
      log.warn('Backend updatePreferences failed:', error);
    }
  },

  async addBlockedDomain(domain: string): Promise<void> {
    try {
      await invoke<void>('search_add_blocked_domain', { domain });
    } catch (error) {
      log.warn('Backend addBlockedDomain failed:', error);
    }
  },

  async removeBlockedDomain(domain: string): Promise<void> {
    try {
      await invoke<void>('search_remove_blocked_domain', { domain });
    } catch (error) {
      log.warn('Backend removeBlockedDomain failed:', error);
    }
  },

  async getTrending(region?: string, category?: string): Promise<BackendTrendingTopic[]> {
    try {
      return await invoke<BackendTrendingTopic[]>('search_get_trending', { region, category });
    } catch (error) {
      log.warn('Backend getTrending failed:', error);
      return [];
    }
  },

  async getStats(): Promise<BackendSearchStats | null> {
    try {
      return await invoke<BackendSearchStats>('search_get_stats');
    } catch (error) {
      log.warn('Backend getStats failed:', error);
      return null;
    }
  },

  async searchImages(query: string, page?: number): Promise<BackendSearchResponse> {
    try {
      return await invoke<BackendSearchResponse>('search_images', { query, page });
    } catch (error) {
      log.warn('Backend searchImages failed:', error);
      throw error;
    }
  },

  async searchVideos(query: string, page?: number): Promise<BackendSearchResponse> {
    try {
      return await invoke<BackendSearchResponse>('search_videos', { query, page });
    } catch (error) {
      log.warn('Backend searchVideos failed:', error);
      throw error;
    }
  },
};

// Export backend API
export { BackendSearchAPI };
export type { 
  BackendSearchResponse, 
  BackendSearchResultItem, 
  BackendSearchHistory, 
  BackendSearchPreferences,
  BackendTrendingTopic,
  BackendSearchStats 
};

// ===== Types =====
export interface SearchSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  favicon?: string;
  date?: string;
  relevance: number;
  type: 'article' | 'academic' | 'video' | 'image' | 'product' | 'social' | 'news';
}

export interface SearchResult {
  query: string;
  answer: string;
  sources: SearchSource[];
  relatedQuestions: string[];
  processingTime: number;
  confidence: number;
}

export interface SearchConfig {
  braveApiKey?: string;
  serpApiKey?: string;
  exaApiKey?: string;
  tavilyApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  preferredProvider: 'brave' | 'serp' | 'exa' | 'tavily';
  maxSources: number;
  enableAI: boolean;
}

// ===== API Endpoints =====
const API_ENDPOINTS = {
  brave: 'https://api.search.brave.com/res/v1/web/search',
  serp: 'https://serpapi.com/search',
  exa: 'https://api.exa.ai/search',
  tavily: 'https://api.tavily.com/search',
  cubeBackend: 'https://api.cubeai.tools/v1/search'
};

// ===== Search Service Class =====
export class AISearchService {
  private config: SearchConfig;
  private cache: Map<string, SearchResult> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor(config?: Partial<SearchConfig>) {
    this.config = {
      preferredProvider: 'brave',
      maxSources: 10,
      enableAI: true,
      ...config
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SearchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Main search function
   */
  async search(query: string, options?: {
    mode?: 'instant' | 'deep' | 'academic' | 'news';
    category?: 'all' | 'news' | 'images' | 'videos';
    freshness?: 'day' | 'week' | 'month' | 'year';
  }): Promise<SearchResult> {
    const startTime = Date.now();
    const cacheKey = `${query}-${JSON.stringify(options)}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - startTime < this.cacheExpiry) {
      return cached;
    }

    try {
      // Get search results from provider
      const sources = await this.fetchSearchResults(query, options);

      // Generate AI answer if enabled
      let answer = '';
      if (this.config.enableAI && sources.length > 0) {
        answer = await this.generateAIAnswer(query, sources);
      }

      // Generate related questions
      const relatedQuestions = this.generateRelatedQuestions(query, sources);

      const result: SearchResult = {
        query,
        answer,
        sources,
        relatedQuestions,
        processingTime: Date.now() - startTime,
        confidence: this.calculateConfidence(sources)
      };

      // Cache result
      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      log.error('Search error:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch results from search provider
   */
  private async fetchSearchResults(query: string, options?: {
    mode?: string;
    category?: string;
    freshness?: string;
  }): Promise<SearchSource[]> {
    // Try CUBE backend first (has all APIs aggregated)
    try {
      return await this.searchCubeBackend(query, options);
    } catch {
      // Fallback to direct API calls
    }

    // Try providers in order of preference
    const providers = ['brave', 'tavily', 'exa', 'serp'] as const;
    
    for (const provider of providers) {
      try {
        switch (provider) {
          case 'brave':
            if (this.config.braveApiKey) {
              return await this.searchBrave(query, options);
            }
            break;
          case 'tavily':
            if (this.config.tavilyApiKey) {
              return await this.searchTavily(query, options);
            }
            break;
          case 'exa':
            if (this.config.exaApiKey) {
              return await this.searchExa(query, options);
            }
            break;
          case 'serp':
            if (this.config.serpApiKey) {
              return await this.searchSerp(query, options);
            }
            break;
        }
      } catch (error) {
        log.warn(`${provider} search failed:`, error);
        continue;
      }
    }

    // Final fallback: mock results for development
    return this.getMockResults(query);
  }

  /**
   * CUBE Backend Search (Aggregated API)
   * Now uses Tauri backend first, falls back to HTTP API
   */
  private async searchCubeBackend(query: string, options?: {
    mode?: string;
    category?: string;
    freshness?: string;
  }): Promise<SearchSource[]> {
    // Try Tauri backend first
    try {
      const tauriResponse = await BackendSearchAPI.query(
        query,
        undefined, // engines - let backend decide
        options?.category,
        1, // page
        {
          exclude_domains: [],
          safe_search: 'Moderate',
          exact_match: false,
        }
      );

      // Convert backend response to SearchSource format
      return tauriResponse.results.map(result => {
        // Extract domain from URL
        let domain = '';
        try {
          domain = new URL(result.url).hostname;
        } catch {
          domain = result.display_url || '';
        }

        return {
          id: result.id,
          title: result.title,
          url: result.url,
          snippet: result.snippet,
          domain,
          favicon: result.favicon,
          date: result.published_at,
          relevance: result.relevance_score,
          type: this.mapCategoryToType(result.category),
        };
      });
    } catch (tauriError) {
      log.warn('Tauri backend search unavailable, trying HTTP API:', tauriError);
    }

    // Fallback to HTTP API
    const response = await fetch(API_ENDPOINTS.cubeBackend, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openaiApiKey || ''}`
      },
      body: JSON.stringify({
        query,
        mode: options?.mode || 'instant',
        category: options?.category || 'all',
        freshness: options?.freshness,
        maxResults: this.config.maxSources
      })
    });

    if (!response.ok) {
      throw new Error('CUBE backend unavailable');
    }

    const data = await response.json();
    return this.normalizeResults(data.results, 'cube');
  }

  /**
   * Map category string to SearchSource type
   */
  private mapCategoryToType(category: string): SearchSource['type'] {
    switch (category?.toLowerCase()) {
      case 'news': return 'news';
      case 'images': return 'image';
      case 'videos': return 'video';
      case 'academic': return 'academic';
      case 'social': return 'social';
      case 'shopping':
      case 'products': return 'product';
      default: return 'article';
    }
  }

  /**
   * Brave Search API
   */
  private async searchBrave(query: string, options?: {
    category?: string;
    freshness?: string;
  }): Promise<SearchSource[]> {
    const params = new URLSearchParams({
      q: query,
      count: this.config.maxSources.toString(),
      text_decorations: 'false',
      search_lang: 'en'
    });

    if (options?.freshness) {
      params.set('freshness', options.freshness);
    }

    const response = await fetch(`${API_ENDPOINTS.brave}?${params}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': this.config.braveApiKey!
      }
    });

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`);
    }

    const data = await response.json();
    return this.normalizeResults(data.web?.results || [], 'brave');
  }

  /**
   * Tavily Search API
   */
  private async searchTavily(query: string, options?: {
    mode?: string;
    category?: string;
  }): Promise<SearchSource[]> {
    const response = await fetch(API_ENDPOINTS.tavily, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: this.config.tavilyApiKey,
        query,
        search_depth: options?.mode === 'deep' ? 'advanced' : 'basic',
        max_results: this.config.maxSources,
        include_domains: [],
        exclude_domains: []
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();
    return this.normalizeResults(data.results || [], 'tavily');
  }

  /**
   * Exa.ai Semantic Search
   */
  private async searchExa(query: string, _options?: {
    category?: string;
  }): Promise<SearchSource[]> {
    const response = await fetch(API_ENDPOINTS.exa, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.exaApiKey!
      },
      body: JSON.stringify({
        query,
        numResults: this.config.maxSources,
        useAutoprompt: true,
        type: 'neural',
        contents: {
          text: { maxCharacters: 500 }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Exa API error: ${response.status}`);
    }

    const data = await response.json();
    return this.normalizeResults(data.results || [], 'exa');
  }

  /**
   * SerpAPI (Google/Bing/DuckDuckGo)
   */
  private async searchSerp(query: string, _options?: {
    category?: string;
  }): Promise<SearchSource[]> {
    const params = new URLSearchParams({
      q: query,
      api_key: this.config.serpApiKey!,
      engine: 'google',
      num: this.config.maxSources.toString()
    });

    const response = await fetch(`${API_ENDPOINTS.serp}?${params}`);

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data = await response.json();
    return this.normalizeResults(data.organic_results || [], 'serp');
  }

  /**
   * Normalize results from different providers
   */
  private normalizeResults(results: unknown[], provider: string): SearchSource[] {
    return (results as Record<string, unknown>[]).map((result, index) => {
      const normalized: SearchSource = {
        id: `${provider}-${index}`,
        title: '',
        url: '',
        snippet: '',
        domain: '',
        relevance: 100 - index * 5,
        type: 'article'
      };

      switch (provider) {
        case 'brave':
          normalized.title = (result.title as string) || '';
          normalized.url = (result.url as string) || '';
          normalized.snippet = (result.description as string) || '';
          normalized.favicon = (result.favicon as string) || undefined;
          break;

        case 'tavily':
          normalized.title = (result.title as string) || '';
          normalized.url = (result.url as string) || '';
          normalized.snippet = (result.content as string) || '';
          normalized.relevance = Math.round(((result.score as number) || 0) * 100);
          break;

        case 'exa':
          normalized.title = (result.title as string) || '';
          normalized.url = (result.url as string) || '';
          normalized.snippet = (result.text as string) || '';
          normalized.date = (result.publishedDate as string) || undefined;
          break;

        case 'serp':
          normalized.title = (result.title as string) || '';
          normalized.url = (result.link as string) || '';
          normalized.snippet = (result.snippet as string) || '';
          normalized.favicon = (result.favicon as string) || undefined;
          break;

        case 'cube':
          normalized.title = (result.title as string) || '';
          normalized.url = (result.url as string) || '';
          normalized.snippet = (result.snippet as string) || '';
          normalized.domain = (result.domain as string) || '';
          normalized.type = (result.type as SearchSource['type']) || 'article';
          normalized.relevance = (result.relevance as number) || 90;
          break;
      }

      // Extract domain from URL
      if (!normalized.domain && normalized.url) {
        try {
          normalized.domain = new URL(normalized.url).hostname.replace('www.', '');
        } catch {
          normalized.domain = 'unknown';
        }
      }

      return normalized;
    });
  }

  /**
   * Generate AI answer from sources
   */
  private async generateAIAnswer(query: string, sources: SearchSource[]): Promise<string> {
    if (!this.config.openaiApiKey && !this.config.anthropicApiKey) {
      return this.generateBasicAnswer(query, sources);
    }

    const context = sources
      .slice(0, 5)
      .map((s, i) => `[${i + 1}] ${s.title}\n${s.snippet}`)
      .join('\n\n');

    const systemPrompt = `You are CUBE AI Search, an advanced AI search assistant. 
Answer the user's question based on the provided search results. 
Be concise but comprehensive. Use markdown formatting.
Cite sources using [1], [2], etc. when referencing information.
If the search results don't fully answer the question, acknowledge this.`;

    const userPrompt = `Question: ${query}

Search Results:
${context}

Provide a comprehensive answer based on these sources.`;

    // Try OpenAI first
    if (this.config.openaiApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-5-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 1000,
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.choices[0]?.message?.content || this.generateBasicAnswer(query, sources);
        }
      } catch (error) {
        log.warn('OpenAI answer generation failed:', error);
      }
    }

    // Try Anthropic
    if (this.config.anthropicApiKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userPrompt }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.content[0]?.text || this.generateBasicAnswer(query, sources);
        }
      } catch (error) {
        log.warn('Anthropic answer generation failed:', error);
      }
    }

    return this.generateBasicAnswer(query, sources);
  }

  /**
   * Generate basic answer without AI
   */
  private generateBasicAnswer(query: string, sources: SearchSource[]): string {
    if (sources.length === 0) {
      return `No results found for "${query}". Try rephrasing your search.`;
    }

    const topSources = sources.slice(0, 3);
    let answer = `## Results for "${query}"\n\n`;
    answer += `Based on ${sources.length} sources, here's what we found:\n\n`;

    topSources.forEach((source, index) => {
      answer += `### ${index + 1}. ${source.title}\n`;
      answer += `${source.snippet}\n`;
      answer += `*Source: ${source.domain}*\n\n`;
    });

    return answer;
  }

  /**
   * Generate related questions
   */
  private generateRelatedQuestions(query: string, sources: SearchSource[]): string[] {
    const questions: string[] = [];
    const words = query.toLowerCase().split(' ');
    
    // Extract key terms from sources
    const terms = new Set<string>();
    sources.slice(0, 5).forEach(s => {
      const snippetWords = s.snippet.toLowerCase().split(/\s+/);
      snippetWords.forEach(w => {
        if (w.length > 5 && !words.includes(w)) {
          terms.add(w);
        }
      });
    });

    // Generate questions
    questions.push(`What are the latest developments in ${query}?`);
    questions.push(`How does ${query} compare to alternatives?`);
    questions.push(`What are the benefits of ${query}?`);
    questions.push(`Who are the key experts in ${query}?`);

    return questions.slice(0, 4);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(sources: SearchSource[]): number {
    if (sources.length === 0) return 0;
    if (sources.length < 3) return 60;
    
    const avgRelevance = sources.reduce((sum, s) => sum + s.relevance, 0) / sources.length;
    return Math.min(95, Math.round(avgRelevance));
  }

  /**
   * Mock results for development
   */
  private getMockResults(query: string): SearchSource[] {
    return [
      {
        id: 'mock-1',
        title: `Comprehensive Guide to ${query}`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        snippet: `A detailed overview of ${query}, covering history, applications, and recent developments in the field. This article provides comprehensive information for beginners and experts alike.`,
        domain: 'wikipedia.org',
        relevance: 95,
        type: 'article'
      },
      {
        id: 'mock-2',
        title: `${query} - Latest Research and Insights`,
        url: `https://www.nature.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Recent peer-reviewed research on ${query} reveals new insights and potential applications. Scientists have made significant progress in understanding the underlying mechanisms.`,
        domain: 'nature.com',
        relevance: 92,
        type: 'academic'
      },
      {
        id: 'mock-3',
        title: `Understanding ${query} in 2025`,
        url: `https://techcrunch.com/tag/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}`,
        snippet: `Industry experts discuss the current state of ${query} and predictions for the future. Key trends include increased adoption and new technological breakthroughs.`,
        domain: 'techcrunch.com',
        relevance: 88,
        type: 'news'
      },
      {
        id: 'mock-4',
        title: `${query} Tutorial - Complete Guide`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        snippet: `Step-by-step video tutorial explaining ${query} from basics to advanced concepts. Perfect for visual learners who want hands-on guidance.`,
        domain: 'youtube.com',
        relevance: 85,
        type: 'video'
      },
      {
        id: 'mock-5',
        title: `${query} - MIT Technology Review`,
        url: `https://www.technologyreview.com/topic/${encodeURIComponent(query.toLowerCase())}`,
        snippet: `MIT researchers explore the implications of ${query} for society and technology. Analysis covers both opportunities and challenges ahead.`,
        domain: 'technologyreview.com',
        relevance: 90,
        type: 'academic'
      }
    ];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ===== Singleton Instance =====
let searchServiceInstance: AISearchService | null = null;

export function getSearchService(config?: Partial<SearchConfig>): AISearchService {
  if (!searchServiceInstance) {
    searchServiceInstance = new AISearchService(config);
  } else if (config) {
    searchServiceInstance.updateConfig(config);
  }
  return searchServiceInstance;
}

export default AISearchService;
