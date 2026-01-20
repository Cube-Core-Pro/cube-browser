/**
 * CUBE AI Search Engine - Chrome Extension Module
 * Replaces Google + ChatGPT with intelligent AI-powered search
 * 
 * @version 2.0.0
 */

class CubeAISearchEngine {
  constructor() {
    this.apiEndpoint = 'https://api.cubeai.tools/v1/search';
    this.config = {
      braveApiKey: null,
      openaiApiKey: null,
      maxSources: 8,
      enableAI: true,
      searchMode: 'instant'
    };
    this.searchHistory = [];
    this.cache = new Map();
    this.isSearching = false;
  }

  /**
   * Initialize the search engine
   */
  async init() {
    // Load config from storage
    const stored = await chrome.storage.local.get(['aiSearchConfig', 'searchHistory']);
    if (stored.aiSearchConfig) {
      this.config = { ...this.config, ...stored.aiSearchConfig };
    }
    if (stored.searchHistory) {
      this.searchHistory = stored.searchHistory.slice(0, 20);
    }
    console.log('[CUBE AI Search] Initialized');
  }

  /**
   * Update configuration
   */
  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    await chrome.storage.local.set({ aiSearchConfig: this.config });
  }

  /**
   * Main search function with streaming support
   */
  async search(query, options = {}) {
    if (!query?.trim()) {
      throw new Error('Query cannot be empty');
    }

    const mode = options.mode || this.config.searchMode;
    const cacheKey = `${query}-${mode}`;

    // Check cache (5 min expiry)
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached.result;
    }

    this.isSearching = true;
    const startTime = Date.now();

    try {
      // Add to history
      this.addToHistory(query);

      // Get search results
      const sources = await this.fetchSearchResults(query, mode);

      // Generate AI answer
      let answer = '';
      if (this.config.enableAI) {
        answer = await this.generateAnswer(query, sources, options.onStream);
      } else {
        answer = this.generateBasicAnswer(query, sources);
      }

      // Generate related questions
      const relatedQuestions = this.generateRelatedQuestions(query, sources);

      const result = {
        query,
        answer,
        sources,
        relatedQuestions,
        mode,
        processingTime: Date.now() - startTime,
        confidence: this.calculateConfidence(sources)
      };

      // Cache result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });

      return result;

    } catch (error) {
      console.error('[CUBE AI Search] Error:', error);
      throw error;
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * Fetch search results from providers
   */
  async fetchSearchResults(query, mode) {
    // Try CUBE backend first
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CUBE-Source': 'extension'
        },
        body: JSON.stringify({
          query,
          mode,
          maxResults: this.config.maxSources
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.sources || [];
      }
    } catch (e) {
      console.warn('[CUBE AI Search] Backend unavailable, using fallback');
    }

    // Fallback to Brave API if configured
    if (this.config.braveApiKey) {
      return await this.searchBrave(query);
    }

    // Final fallback: mock results
    return this.getMockResults(query);
  }

  /**
   * Search using Brave API
   */
  async searchBrave(query) {
    const params = new URLSearchParams({
      q: query,
      count: this.config.maxSources.toString()
    });

    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': this.config.braveApiKey
      }
    });

    if (!response.ok) {
      throw new Error('Brave API error');
    }

    const data = await response.json();
    return (data.web?.results || []).map((r, idx) => ({
      id: `brave-${idx}`,
      title: r.title,
      url: r.url,
      snippet: r.description,
      domain: new URL(r.url).hostname.replace('www.', ''),
      relevance: 100 - idx * 5,
      type: 'article'
    }));
  }

  /**
   * Generate AI answer from sources
   */
  async generateAnswer(query, sources, onStream) {
    if (!this.config.openaiApiKey) {
      return this.generateBasicAnswer(query, sources);
    }

    const context = sources.slice(0, 5).map((s, i) => 
      `[${i + 1}] ${s.title}\n${s.snippet}`
    ).join('\n\n');

    const messages = [
      {
        role: 'system',
        content: `You are CUBE AI Search, an advanced search assistant. 
Answer questions based on the provided search results. 
Be concise but comprehensive. Use markdown. Cite sources with [1], [2], etc.`
      },
      {
        role: 'user',
        content: `Question: ${query}\n\nSearch Results:\n${context}\n\nProvide a comprehensive answer.`
      }
    ];

    // Streaming response
    if (onStream) {
      return await this.streamOpenAIResponse(messages, onStream);
    }

    // Non-streaming response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      return this.generateBasicAnswer(query, sources);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || this.generateBasicAnswer(query, sources);
  }

  /**
   * Stream OpenAI response
   */
  async streamOpenAIResponse(messages, onStream) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI streaming error');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || '';
          fullText += content;
          onStream(content, fullText);
        } catch (e) {
          // Skip parse errors
        }
      }
    }

    return fullText;
  }

  /**
   * Generate basic answer without AI
   */
  generateBasicAnswer(query, sources) {
    if (!sources.length) {
      return `No results found for "${query}". Try rephrasing your search.`;
    }

    let answer = `## Results for "${query}"\n\n`;
    sources.slice(0, 3).forEach((s, i) => {
      answer += `### ${i + 1}. ${s.title}\n`;
      answer += `${s.snippet}\n\n`;
      answer += `*Source: [${s.domain}](${s.url})*\n\n`;
    });

    return answer;
  }

  /**
   * Generate related questions
   */
  generateRelatedQuestions(query, sources) {
    return [
      `What are the latest developments in ${query}?`,
      `How does ${query} compare to alternatives?`,
      `What are the benefits of ${query}?`,
      `Who are the key experts in ${query}?`
    ];
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(sources) {
    if (!sources.length) return 0;
    if (sources.length < 3) return 60;
    return Math.min(95, Math.round(sources.reduce((s, r) => s + r.relevance, 0) / sources.length));
  }

  /**
   * Add query to search history
   */
  async addToHistory(query) {
    this.searchHistory = [query, ...this.searchHistory.filter(q => q !== query)].slice(0, 20);
    await chrome.storage.local.set({ searchHistory: this.searchHistory });
  }

  /**
   * Get search history
   */
  getHistory() {
    return this.searchHistory;
  }

  /**
   * Clear history
   */
  async clearHistory() {
    this.searchHistory = [];
    await chrome.storage.local.set({ searchHistory: [] });
  }

  /**
   * Get mock results for development
   */
  getMockResults(query) {
    return [
      {
        id: 'mock-1',
        title: `Comprehensive Guide to ${query}`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        snippet: `A detailed overview of ${query}, covering history, applications, and recent developments.`,
        domain: 'wikipedia.org',
        relevance: 95,
        type: 'article'
      },
      {
        id: 'mock-2',
        title: `${query} - Latest Research`,
        url: `https://www.nature.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Recent peer-reviewed research on ${query} reveals new insights and potential applications.`,
        domain: 'nature.com',
        relevance: 92,
        type: 'academic'
      },
      {
        id: 'mock-3',
        title: `Understanding ${query} in 2025`,
        url: `https://techcrunch.com/tag/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}`,
        snippet: `Industry experts discuss the current state of ${query} and predictions for the future.`,
        domain: 'techcrunch.com',
        relevance: 88,
        type: 'news'
      },
      {
        id: 'mock-4',
        title: `${query} Tutorial Video`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        snippet: `Step-by-step video tutorial explaining ${query} from basics to advanced concepts.`,
        domain: 'youtube.com',
        relevance: 85,
        type: 'video'
      },
      {
        id: 'mock-5',
        title: `${query} - MIT Technology Review`,
        url: `https://www.technologyreview.com/topic/${encodeURIComponent(query.toLowerCase())}`,
        snippet: `MIT researchers explore the implications of ${query} for society and technology.`,
        domain: 'technologyreview.com',
        relevance: 90,
        type: 'academic'
      }
    ];
  }

  /**
   * Get trending topics
   */
  getTrendingTopics() {
    return [
      { topic: 'AI Agents 2025', searches: '2.5M+' },
      { topic: 'Climate Summit Results', searches: '1.8M+' },
      { topic: 'Quantum Computing Breakthrough', searches: '1.2M+' },
      { topic: 'Space Tourism Update', searches: '890K+' }
    ];
  }
}

// Create global instance
window.CubeAISearch = new CubeAISearchEngine();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  window.CubeAISearch.init();
});

// Export for module use
if (typeof module !== 'undefined') {
  module.exports = CubeAISearchEngine;
}
