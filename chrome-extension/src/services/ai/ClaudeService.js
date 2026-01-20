/**
 * 🧠 CUBE Nexum v7.0.2 - Claude Service (Anthropic)
 * 
 * CLAUDE 4.5 FOR COMPLEX DOCUMENT ANALYSIS
 * 
 * Capabilities:
 * - Claude Opus 4.5: Maximum intelligence (200K context)
 * - Claude Sonnet 4.5: Best balance of speed & intelligence
 * - Claude Haiku 4.5: Fastest response times
 * - Superior reasoning for complex documents
 * - Extended thinking capability
 * - Excellent for multi-page analysis
 * 
 * @version 7.0.2
 * @license CUBE Nexum Enterprise
 */

class ClaudeService {
  constructor() {
    this.apiKey = null;
    this.baseURL = 'https://api.anthropic.com/v1';
    this.models = {
      opus: 'claude-opus-4-5-20251101',
      sonnet: 'claude-sonnet-4-5-20250929',
      haiku: 'claude-haiku-4-5-20251001'
    };

    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      averageResponseTime: 0
    };

    console.log('🧠 Claude Service v7.0.0 initialized');
    this.initialize();
  }

  async initialize() {
    try {
      await this.loadAPIKey();
      if (this.apiKey) {
        console.log('✓ Claude Service ready');
      }
    } catch (error) {
      console.warn('⚠️ Claude Service initialization failed:', error);
    }
  }

  async loadAPIKey() {
    try {
      const result = await chrome.storage.local.get(['claude_apiKey']);
      if (result.claude_apiKey) {
        this.apiKey = result.claude_apiKey;
        console.log('✓ Claude API key loaded');
      } else {
        console.warn('⚠️ No Claude API key found');
      }
    } catch (error) {
      console.error('❌ Failed to load API key:', error);
    }
  }

  async saveAPIKey(apiKey) {
    try {
      await chrome.storage.local.set({ claude_apiKey: apiKey });
      this.apiKey = apiKey;
      console.log('✓ Claude API key saved');
      return true;
    } catch (error) {
      console.error('❌ Failed to save API key:', error);
      return false;
    }
  }

  /**
   * Analyze document with Claude
   */
  async analyzeDocument(text, options = {}) {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    console.log('🔍 Analyzing document with Claude...');

    const model = options.model || this.models.sonnet;
    const startTime = Date.now();

    const systemPrompt = options.systemPrompt || `
      You are an expert document analyst specializing in extracting structured data from documents.
      Extract ALL relevant information with 99% accuracy.
      Focus on: names, dates, addresses, amounts, account numbers, and any unique identifiers.
      Return data in clean JSON format optimized for form filling.
    `;

    const userPrompt = options.prompt || `
      Analyze this document and extract all key information.
      Document text:
      ${text}
      
      Return a structured JSON object with all extracted data.
    `;

    try {
      const response = await this.makeRequest('/messages', 'POST', {
        model: model,
        max_tokens: options.maxTokens || 4096,
        temperature: 0.1,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Parse response
      const content = response.content[0].text;
      const extractedData = this.parseExtractedData(content);

      // Update stats
      this.updateStats(response, duration, true, model);

      console.log(`✓ Analysis complete (${duration}ms)`);
      console.log(`📊 Tokens: ${response.usage.input_tokens + response.usage.output_tokens}`);
      console.log(`💰 Cost: $${this.calculateCost(response.usage, model).toFixed(4)}`);

      return {
        success: true,
        data: extractedData,
        rawText: content,
        tokens: response.usage.input_tokens + response.usage.output_tokens,
        cost: this.calculateCost(response.usage, model),
        duration: duration
      };

    } catch (error) {
      this.updateStats(null, 0, false, model);
      console.error('❌ Document analysis failed:', error);
      throw error;
    }
  }

  /**
   * Extract from image (Claude 3 has vision)
   */
  async extractFromImage(imageData, options = {}) {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    console.log('🔍 Extracting from image with Claude...');

    const model = this.models.opus; // Use Opus for vision
    const startTime = Date.now();

    try {
      // Prepare image data
      const base64Image = imageData.startsWith('data:')
        ? imageData.split(',')[1]
        : imageData;

      const response = await this.makeRequest('/messages', 'POST', {
        model: model,
        max_tokens: options.maxTokens || 4096,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: options.prompt || 'Extract all text and data from this image. Return as structured JSON.'
              }
            ]
          }
        ]
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      const content = response.content[0].text;
      const extractedData = this.parseExtractedData(content);

      this.updateStats(response, duration, true, model);

      console.log(`✓ Extraction complete (${duration}ms)`);

      return {
        success: true,
        data: extractedData,
        rawText: content,
        tokens: response.usage.input_tokens + response.usage.output_tokens,
        cost: this.calculateCost(response.usage, model),
        duration: duration
      };

    } catch (error) {
      this.updateStats(null, 0, false, model);
      console.error('❌ Image extraction failed:', error);
      throw error;
    }
  }

  async makeRequest(endpoint, method = 'POST', body = null) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    };

    const options = { method, headers };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  }

  parseExtractedData(content) {
    try {
      if (content.includes('{') && content.includes('}')) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      return { rawText: content };
    } catch (error) {
      return { rawText: content };
    }
  }

  calculateCost(usage, model) {
    // Pricing per 1M tokens (December 2025)
    const pricing = {
      'claude-opus-4-5-20251101': { input: 5, output: 25 },
      'claude-sonnet-4-5-20250929': { input: 3, output: 15 },
      'claude-haiku-4-5-20251001': { input: 1, output: 5 }
    };

    const modelPricing = pricing[model] || pricing['claude-sonnet-4-5-20250929'];
    
    const inputCost = (usage.input_tokens / 1000000) * modelPricing.input;
    const outputCost = (usage.output_tokens / 1000000) * modelPricing.output;

    return inputCost + outputCost;
  }

  updateStats(response, duration, success, model) {
    this.stats.totalRequests++;
    
    if (success) {
      this.stats.successfulRequests++;
      
      if (response?.usage) {
        this.stats.totalTokensUsed += response.usage.input_tokens + response.usage.output_tokens;
        this.stats.totalCost += this.calculateCost(response.usage, model);
      }

      this.stats.averageResponseTime =
        (this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + duration) /
        this.stats.successfulRequests;
    } else {
      this.stats.failedRequests++;
    }
  }

  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0
        ? (this.stats.successfulRequests / this.stats.totalRequests) * 100
        : 0,
      configured: !!this.apiKey
    };
  }

  async clearAPIKey() {
    await chrome.storage.local.remove(['claude_apiKey']);
    this.apiKey = null;
    console.log('✓ Claude API key cleared');
  }
}

if (typeof window !== 'undefined') {
  window.ClaudeService = ClaudeService;
}

console.log('🧠 Claude Service v7.0.0 loaded');
