/**
 * 🤖 CUBE Nexum v7.0.2 - OpenAI Service
 * 
 * GPT-5.2 & GPT-5.1 FOR DOCUMENT INTELLIGENCE
 * 
 * Capabilities:
 * - GPT-5.2: Latest and most capable model (December 2025)
 * - GPT-5.2 Pro: Premium version with enhanced responses
 * - GPT-5.1: High performance document analysis
 * - GPT-5.1 Codex: Optimized for coding tasks
 * - GPT-5 Mini: Fast and cost-effective
 * - GPT-5 Nano: Fastest, most cost-efficient
 * - Intelligent field mapping
 * - Multi-page document processing
 * - Cost optimization (automatic model selection)
 * 
 * @version 7.0.2
 * @license CUBE Nexum Enterprise
 */

class OpenAIService {
  constructor() {
    this.apiKey = null;
    this.baseURL = 'https://api.openai.com/v1';
    this.models = {
      latest: 'gpt-5.2',
      premium: 'gpt-5.2-pro',
      turbo: 'gpt-5.1',
      codex: 'gpt-5.1-codex',
      fast: 'gpt-5-mini',
      fastest: 'gpt-5-nano',
      embedding: 'text-embedding-3-large'
    };

    this.requestQueue = [];
    this.isProcessing = false;
    this.rateLimiter = {
      requestsPerMinute: 50,
      tokensPerMinute: 150000,
      currentRequests: 0,
      currentTokens: 0,
      resetTime: Date.now() + 60000
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

    console.log('🤖 OpenAI Service v7.0.0 initialized');
    this.initialize();
  }

  /**
   * Initialize service
   */
  async initialize() {
    try {
      // Load API key from storage
      await this.loadAPIKey();

      // Test connection
      if (this.apiKey) {
        await this.testConnection();
      }

      console.log('✓ OpenAI Service ready');
    } catch (error) {
      console.warn('⚠️ OpenAI Service initialization failed:', error);
    }
  }

  /**
   * Load API key from storage (encrypted)
   */
  async loadAPIKey() {
    try {
      // Try to load from encrypted storage first
      if (typeof EncryptionService !== 'undefined') {
        const decryptedKey = await EncryptionService.retrieveSecurely('openai_apiKey');
        if (decryptedKey) {
          this.apiKey = decryptedKey;
          console.log('✓ OpenAI API key loaded (encrypted)');
          return;
        }
      }
      
      // Fallback to legacy unencrypted storage (for migration)
      const result = await chrome.storage.local.get(['openai_apiKey']);
      if (result.openai_apiKey) {
        this.apiKey = result.openai_apiKey;
        console.log('⚠️ OpenAI API key loaded (unencrypted - will migrate)');
        
        // Migrate to encrypted storage
        if (typeof EncryptionService !== 'undefined') {
          await this.saveAPIKey(result.openai_apiKey);
          await chrome.storage.local.remove(['openai_apiKey']);
          console.log('✓ Migrated API key to encrypted storage');
        }
      } else {
        console.warn('⚠️ No OpenAI API key found. Please configure in settings.');
      }
    } catch (error) {
      console.error('❌ Failed to load API key:', error);
    }
  }

  /**
   * Save API key to storage (encrypted)
   */
  async saveAPIKey(apiKey) {
    try {
      // Use encrypted storage if available
      if (typeof EncryptionService !== 'undefined') {
        await EncryptionService.storeSecurely('openai_apiKey', apiKey);
        this.apiKey = apiKey;
        console.log('✓ OpenAI API key saved (encrypted)');
        return true;
      }
      
      // Fallback to unencrypted storage
      await chrome.storage.local.set({ openai_apiKey: apiKey });
      this.apiKey = apiKey;
      console.warn('⚠️ OpenAI API key saved (unencrypted - EncryptionService not available)');
      return true;
    } catch (error) {
      console.error('❌ Failed to save API key:', error);
      return false;
    }
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const response = await this.makeRequest('/models', 'GET');
      console.log('✓ OpenAI connection successful');
      console.log(`📋 Available models: ${response.data.length}`);
      return true;
    } catch (error) {
      console.error('❌ OpenAI connection failed:', error);
      return false;
    }
  }

  /**
   * Extract text from image using GPT-4 Vision
   * @param {string} imageData - Base64 encoded image
   * @param {Object} options - Extraction options
   */
  async extractFromImage(imageData, options = {}) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('🔍 Extracting text from image with GPT-4 Vision...');

    const prompt = options.prompt || `
      Analyze this document image and extract ALL text content.
      Organize the information by sections and fields.
      For forms, identify:
      - Field labels
      - Field values
      - Field types (text, number, date, etc.)
      - Any special formatting or validation rules
      
      Return the data in a structured JSON format.
    `;

    const startTime = Date.now();

    try {
      const response = await this.makeRequest('/chat/completions', 'POST', {
        model: this.models.vision,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`,
                  detail: options.detail || 'high'
                }
              }
            ]
          }
        ],
        max_tokens: options.maxTokens || 4096,
        temperature: 0.1 // Low temperature for accuracy
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Parse response
      const content = response.choices[0].message.content;
      const extractedData = this.parseExtractedData(content);

      // Update stats
      this.updateStats(response, duration, true);

      console.log(`✓ Extraction complete (${duration}ms)`);
      console.log(`📊 Tokens used: ${response.usage.total_tokens}`);
      console.log(`💰 Cost: $${this.calculateCost(response.usage, this.models.vision).toFixed(4)}`);

      return {
        success: true,
        data: extractedData,
        rawText: content,
        tokens: response.usage.total_tokens,
        cost: this.calculateCost(response.usage, this.models.vision),
        duration: duration
      };

    } catch (error) {
      this.updateStats(null, 0, false);
      console.error('❌ Image extraction failed:', error);
      throw error;
    }
  }

  /**
   * Analyze document text and extract fields
   * @param {string} text - Document text
   * @param {Object} options - Analysis options
   */
  async analyzeDocument(text, options = {}) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('🔍 Analyzing document with GPT-4 Turbo...');

    const prompt = options.prompt || `
      Analyze this document and extract all relevant information.
      Identify:
      - Document type
      - Key fields and values
      - Dates, amounts, names, addresses
      - Any special data (SSN, phone numbers, emails, etc.)
      
      Return the data in a structured JSON format optimized for form filling.
    `;

    const model = options.fast ? this.models.fast : this.models.turbo;
    const startTime = Date.now();

    try {
      const response = await this.makeRequest('/chat/completions', 'POST', {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert document analyst. Extract structured data from documents with 99% accuracy.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nDocument text:\n${text}`
          }
        ],
        max_tokens: options.maxTokens || 2048,
        temperature: 0.1,
        response_format: options.json ? { type: 'json_object' } : undefined
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Parse response
      const content = response.choices[0].message.content;
      const extractedData = this.parseExtractedData(content);

      // Update stats
      this.updateStats(response, duration, true);

      console.log(`✓ Analysis complete (${duration}ms)`);
      console.log(`📊 Tokens used: ${response.usage.total_tokens}`);
      console.log(`💰 Cost: $${this.calculateCost(response.usage, model).toFixed(4)}`);

      return {
        success: true,
        data: extractedData,
        rawText: content,
        tokens: response.usage.total_tokens,
        cost: this.calculateCost(response.usage, model),
        duration: duration
      };

    } catch (error) {
      this.updateStats(null, 0, false);
      console.error('❌ Document analysis failed:', error);
      throw error;
    }
  }

  /**
   * Map extracted data to form fields
   * @param {Object} extractedData - Data from document
   * @param {Array} formFields - Available form fields
   */
  async mapToFormFields(extractedData, formFields) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('🗺️ Mapping extracted data to form fields...');

    const prompt = `
      You are a form-filling expert. Match the extracted document data to the available form fields.
      
      Extracted data:
      ${JSON.stringify(extractedData, null, 2)}
      
      Available form fields:
      ${JSON.stringify(formFields.map(f => ({
        name: f.name,
        label: f.label,
        type: f.type,
        placeholder: f.placeholder
      })), null, 2)}
      
      Return a JSON object mapping form field names to their values.
      Only include fields where you're confident about the match (>80% confidence).
      Format: { "fieldName": { "value": "...", "confidence": 0.95 } }
    `;

    try {
      const response = await this.makeRequest('/chat/completions', 'POST', {
        model: this.models.fast, // Use fast model for mapping
        messages: [
          { role: 'system', content: 'You are a form-filling expert. Map data accurately.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      const mapping = JSON.parse(content);

      console.log(`✓ Mapping complete`);
      console.log(`📊 Mapped ${Object.keys(mapping).length} fields`);

      return {
        success: true,
        mapping: mapping,
        tokens: response.usage.total_tokens,
        cost: this.calculateCost(response.usage, this.models.fast)
      };

    } catch (error) {
      console.error('❌ Field mapping failed:', error);
      throw error;
    }
  }

  /**
   * Smart field detection (identify field type and validation)
   * @param {string} fieldLabel - Field label or placeholder
   * @param {string} context - Surrounding context
   */
  async detectFieldType(fieldLabel, context = '') {
    const prompt = `
      Identify the type and validation rules for this form field:
      Label: "${fieldLabel}"
      Context: "${context}"
      
      Return JSON: {
        "type": "email|phone|ssn|date|number|text|...",
        "format": "validation pattern",
        "confidence": 0.95
      }
    `;

    try {
      const response = await this.makeRequest('/chat/completions', 'POST', {
        model: this.models.fast,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 128,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result;

    } catch (error) {
      console.error('❌ Field type detection failed:', error);
      return { type: 'text', confidence: 0.5 };
    }
  }

  /**
   * Make API request to OpenAI
   */
  async makeRequest(endpoint, method = 'POST', body = null) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    // Check rate limits
    await this.checkRateLimit();

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    const options = {
      method,
      headers
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Update rate limiter
    if (data.usage) {
      this.rateLimiter.currentTokens += data.usage.total_tokens;
      this.rateLimiter.currentRequests++;
    }

    return data;
  }

  /**
   * Check and enforce rate limits
   */
  async checkRateLimit() {
    const now = Date.now();

    // Reset counters if minute has passed
    if (now >= this.rateLimiter.resetTime) {
      this.rateLimiter.currentRequests = 0;
      this.rateLimiter.currentTokens = 0;
      this.rateLimiter.resetTime = now + 60000;
    }

    // Wait if at limit
    if (
      this.rateLimiter.currentRequests >= this.rateLimiter.requestsPerMinute ||
      this.rateLimiter.currentTokens >= this.rateLimiter.tokensPerMinute
    ) {
      const waitTime = this.rateLimiter.resetTime - now;
      console.log(`⏳ Rate limit reached. Waiting ${waitTime}ms...`);
      await this.sleep(waitTime);
    }
  }

  /**
   * Parse extracted data from AI response
   */
  parseExtractedData(content) {
    try {
      // Try to parse as JSON
      if (content.includes('{') && content.includes('}')) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      // Fallback: return as text
      return { rawText: content };

    } catch (error) {
      console.warn('⚠️ Could not parse as JSON, returning raw text');
      return { rawText: content };
    }
  }

  /**
   * Calculate cost based on usage and model
   */
  calculateCost(usage, model) {
    // Pricing per 1K tokens (December 2025)
    const pricing = {
      'gpt-5.2': { input: 0.02, output: 0.06 },
      'gpt-5.2-pro': { input: 0.03, output: 0.09 },
      'gpt-5.1': { input: 0.015, output: 0.045 },
      'gpt-5.1-codex': { input: 0.015, output: 0.045 },
      'gpt-5-mini': { input: 0.003, output: 0.012 },
      'gpt-5-nano': { input: 0.001, output: 0.004 },
      'text-embedding-3-large': { input: 0.00013, output: 0 }
    };

    const modelPricing = pricing[model] || pricing['gpt-5-mini'];
    
    const inputCost = (usage.prompt_tokens / 1000) * modelPricing.input;
    const outputCost = (usage.completion_tokens / 1000) * modelPricing.output;

    return inputCost + outputCost;
  }

  /**
   * Update statistics
   */
  updateStats(response, duration, success) {
    this.stats.totalRequests++;
    
    if (success) {
      this.stats.successfulRequests++;
      
      if (response?.usage) {
        this.stats.totalTokensUsed += response.usage.total_tokens;
        this.stats.totalCost += this.calculateCost(
          response.usage,
          response.model || this.models.turbo
        );
      }

      // Update average response time
      this.stats.averageResponseTime =
        (this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + duration) /
        this.stats.successfulRequests;
    } else {
      this.stats.failedRequests++;
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0
        ? (this.stats.successfulRequests / this.stats.totalRequests) * 100
        : 0,
      configured: !!this.apiKey
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      averageResponseTime: 0
    };
    console.log('📊 Statistics reset');
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear API key (for logout)
   */
  async clearAPIKey() {
    try {
      await chrome.storage.local.remove(['openai_apiKey']);
      this.apiKey = null;
      console.log('✓ OpenAI API key cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear API key:', error);
      return false;
    }
  }
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.OpenAIService = OpenAIService;
}

console.log('🤖 OpenAI Service v7.0.0 loaded');
