/**
 * ⚡ CUBE Nexum v7.0.2 - Gemini Service (Google AI)
 * 
 * GEMINI 3 PRO FOR INTELLIGENT DOCUMENT PROCESSING
 * 
 * Capabilities:
 * - Gemini 3 Pro: Most intelligent, best for multimodal & agents
 * - Gemini 2.5 Flash: Fast with near-frontier intelligence
 * - Gemini 2.5 Flash-Lite: Ultra-fast, cost-efficient
 * - Gemini 2.5 Pro: Advanced thinking model
 * - Cost-effective for high-volume
 * - Excellent at structured data extraction
 * - Native multimodal (text + images + video)
 * 
 * @version 7.0.2
 * @license CUBE Nexum Enterprise
 */

class GeminiService {
  constructor() {
    this.apiKey = null;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    this.models = {
      latest: 'gemini-3-pro',
      pro: 'gemini-2.5-pro',
      flash: 'gemini-2.5-flash',
      flashLite: 'gemini-2.5-flash-lite'
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

    console.log('⚡ Gemini Service v7.0.0 initialized');
    this.initialize();
  }

  async initialize() {
    try {
      await this.loadAPIKey();
      if (this.apiKey) {
        console.log('✓ Gemini Service ready');
      }
    } catch (error) {
      console.warn('⚠️ Gemini Service initialization failed:', error);
    }
  }

  async loadAPIKey() {
    try {
      const result = await chrome.storage.local.get(['gemini_apiKey']);
      if (result.gemini_apiKey) {
        this.apiKey = result.gemini_apiKey;
        console.log('✓ Gemini API key loaded');
      } else {
        console.warn('⚠️ No Gemini API key found');
      }
    } catch (error) {
      console.error('❌ Failed to load API key:', error);
    }
  }

  async saveAPIKey(apiKey) {
    try {
      await chrome.storage.local.set({ gemini_apiKey: apiKey });
      this.apiKey = apiKey;
      console.log('✓ Gemini API key saved');
      return true;
    } catch (error) {
      console.error('❌ Failed to save API key:', error);
      return false;
    }
  }

  /**
   * Analyze document with Gemini
   */
  async analyzeDocument(text, options = {}) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    console.log('🔍 Analyzing document with Gemini...');

    const model = options.fast ? this.models.flash : this.models.pro;
    const startTime = Date.now();

    const prompt = options.prompt || `
      Extract all key information from this document.
      Focus on: names, dates, addresses, amounts, identifiers, and any structured data.
      Return as clean JSON optimized for form filling.
      
      Document:
      ${text}
    `;

    try {
      const response = await this.makeRequest(
        `/models/${model}:generateContent`,
        'POST',
        {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.1,
            maxOutputTokens: options.maxTokens || 8192
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ]
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Parse response
      const content = response.candidates[0].content.parts[0].text;
      const extractedData = this.parseExtractedData(content);

      // Update stats
      const tokenCount = response.usageMetadata?.totalTokenCount || 0;
      this.updateStats({ usage: { total_tokens: tokenCount } }, duration, true, model);

      console.log(`✓ Analysis complete (${duration}ms)`);
      console.log(`📊 Tokens: ${tokenCount}`);
      console.log(`💰 Cost: $${this.calculateCost(tokenCount, model).toFixed(4)}`);

      return {
        success: true,
        data: extractedData,
        rawText: content,
        tokens: tokenCount,
        cost: this.calculateCost(tokenCount, model),
        duration: duration
      };

    } catch (error) {
      this.updateStats(null, 0, false, model);
      console.error('❌ Document analysis failed:', error);
      throw error;
    }
  }

  /**
   * Extract from image
   */
  async extractFromImage(imageData, options = {}) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    console.log('🔍 Extracting from image with Gemini...');

    const model = this.models.pro;
    const startTime = Date.now();

    try {
      // Prepare image data
      const base64Image = imageData.startsWith('data:')
        ? imageData.split(',')[1]
        : imageData;

      const response = await this.makeRequest(
        `/models/${model}:generateContent`,
        'POST',
        {
          contents: [{
            parts: [
              { text: options.prompt || 'Extract all text and data from this image. Return as structured JSON.' },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: options.maxTokens || 8192
          }
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      const content = response.candidates[0].content.parts[0].text;
      const extractedData = this.parseExtractedData(content);

      const tokenCount = response.usageMetadata?.totalTokenCount || 0;
      this.updateStats({ usage: { total_tokens: tokenCount } }, duration, true, model);

      console.log(`✓ Extraction complete (${duration}ms)`);

      return {
        success: true,
        data: extractedData,
        rawText: content,
        tokens: tokenCount,
        cost: this.calculateCost(tokenCount, model),
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

    const url = `${this.baseURL}${endpoint}?key=${this.apiKey}`;
    const headers = { 'Content-Type': 'application/json' };

    const options = { method, headers };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
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

  calculateCost(tokenCount, model) {
    // Pricing per 1M tokens (as of 2024)
    const pricing = {
      'gemini-1.5-pro-latest': 0.00035,  // $0.35 per 1M tokens
      'gemini-1.5-flash-latest': 0.000035, // $0.035 per 1M tokens
      'gemini-pro-vision': 0.00025
    };

    const rate = pricing[model] || pricing['gemini-1.5-flash-latest'];
    return (tokenCount / 1000000) * rate;
  }

  updateStats(response, duration, success, model) {
    this.stats.totalRequests++;
    
    if (success) {
      this.stats.successfulRequests++;
      
      if (response?.usage) {
        this.stats.totalTokensUsed += response.usage.total_tokens;
        this.stats.totalCost += this.calculateCost(response.usage.total_tokens, model);
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
    await chrome.storage.local.remove(['gemini_apiKey']);
    this.apiKey = null;
    console.log('✓ Gemini API key cleared');
  }
}

if (typeof window !== 'undefined') {
  window.GeminiService = GeminiService;
}

console.log('⚡ Gemini Service v7.0.0 loaded');
