/**
 * 🧠 CUBE Nexum v7.0.0 - AI Context Enhancement Service
 * 
 * INTELLIGENT CONTEXT-AWARE AI ASSISTANCE
 * 
 * Features:
 * - Browser context awareness (current page, form fields, DOM structure)
 * - Conversation memory with context injection
 * - Smart prompt enhancement
 * - Action context (what user is trying to do)
 * - Historical context (previous interactions)
 * - Domain-specific knowledge injection
 * 
 * @version 7.0.0
 * @license CUBE Nexum Enterprise
 */

class AIContextEnhancer {
  constructor() {
    this.currentContext = {
      page: null,
      forms: [],
      selections: [],
      actions: [],
      history: []
    };

    this.domainKnowledge = {
      lending: {
        keywords: ['loan', 'mortgage', 'lendingpad', 'borrower', 'lender', 'apr', 'ltv'],
        expertise: 'You are an expert in mortgage lending and loan processing. You understand loan documents, URLA forms, and lending terminology.'
      },
      finance: {
        keywords: ['bank', 'account', 'transaction', 'payment', 'invoice', 'tax'],
        expertise: 'You are a financial expert familiar with banking systems, accounting, and financial documents.'
      },
      ecommerce: {
        keywords: ['cart', 'checkout', 'product', 'order', 'shipping', 'amazon', 'ebay'],
        expertise: 'You are an e-commerce specialist who understands online shopping, checkout processes, and product management.'
      },
      healthcare: {
        keywords: ['patient', 'medical', 'health', 'doctor', 'prescription', 'insurance'],
        expertise: 'You are a healthcare documentation expert familiar with medical forms and patient records.'
      },
      legal: {
        keywords: ['contract', 'agreement', 'legal', 'court', 'attorney', 'lawsuit'],
        expertise: 'You are a legal document specialist who understands contracts and legal terminology.'
      },
      realestate: {
        keywords: ['property', 'listing', 'mls', 'realtor', 'escrow', 'title'],
        expertise: 'You are a real estate expert familiar with property listings, transactions, and documentation.'
      }
    };

    this.conversationMemory = [];
    this.maxMemorySize = 10;
    
    console.log('🧠 AI Context Enhancer initialized');
  }

  /**
   * Capture current page context
   */
  async capturePageContext() {
    try {
      const context = {
        url: window.location.href,
        domain: window.location.hostname,
        title: document.title,
        timestamp: Date.now()
      };

      // Detect page type
      context.pageType = this.detectPageType();

      // Detect forms
      context.forms = this.detectForms();

      // Get current selection
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        context.selectedText = selection.toString().trim().substring(0, 500);
      }

      // Get visible text summary
      context.textSummary = this.getTextSummary();

      // Detect domain expertise
      context.detectedDomain = this.detectDomain(context);

      this.currentContext.page = context;
      return context;

    } catch (error) {
      console.error('Failed to capture page context:', error);
      return null;
    }
  }

  /**
   * Detect page type
   */
  detectPageType() {
    const url = window.location.href.toLowerCase();
    const body = document.body.innerText.toLowerCase();

    if (document.querySelector('form')) {
      if (body.includes('login') || body.includes('sign in')) return 'login';
      if (body.includes('sign up') || body.includes('register')) return 'registration';
      if (body.includes('checkout') || body.includes('payment')) return 'checkout';
      if (body.includes('contact') || body.includes('message')) return 'contact';
      return 'form';
    }

    if (body.includes('search') && document.querySelector('input[type="search"], input[name*="search"], input[placeholder*="search"]')) {
      return 'search';
    }

    if (document.querySelectorAll('article').length > 0 || body.length > 3000) {
      return 'article';
    }

    if (document.querySelectorAll('table').length > 0) {
      return 'data';
    }

    return 'general';
  }

  /**
   * Detect forms on page
   */
  detectForms() {
    const forms = [];
    const formElements = document.querySelectorAll('form');

    formElements.forEach((form, index) => {
      const fields = [];
      const inputs = form.querySelectorAll('input, select, textarea');

      inputs.forEach(input => {
        const field = {
          type: input.type || input.tagName.toLowerCase(),
          name: input.name || input.id || '',
          label: this.findLabel(input),
          placeholder: input.placeholder || '',
          value: input.type === 'password' ? '[REDACTED]' : (input.value || '').substring(0, 100),
          required: input.required
        };
        if (field.name || field.label) {
          fields.push(field);
        }
      });

      if (fields.length > 0) {
        forms.push({
          id: form.id || `form_${index}`,
          name: form.name || '',
          action: form.action || '',
          method: form.method || 'GET',
          fieldCount: fields.length,
          fields: fields.slice(0, 20) // Limit to 20 fields
        });
      }
    });

    return forms;
  }

  /**
   * Find label for an input element
   */
  findLabel(input) {
    // Check for label with for attribute
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return label.textContent.trim();
    }

    // Check for parent label
    const parentLabel = input.closest('label');
    if (parentLabel) {
      return parentLabel.textContent.replace(input.value, '').trim();
    }

    // Check for aria-label
    if (input.getAttribute('aria-label')) {
      return input.getAttribute('aria-label');
    }

    // Check for nearby text
    const prev = input.previousElementSibling;
    if (prev && prev.textContent.trim().length < 100) {
      return prev.textContent.trim();
    }

    return '';
  }

  /**
   * Get text summary of the page
   */
  getTextSummary() {
    // Get main content
    const mainContent = document.querySelector('main, article, .content, #content') || document.body;
    let text = mainContent.innerText || '';

    // Clean and truncate
    text = text.replace(/\s+/g, ' ').trim();
    
    if (text.length > 1000) {
      text = text.substring(0, 1000) + '...';
    }

    return text;
  }

  /**
   * Detect domain expertise based on content
   */
  detectDomain(context) {
    const searchText = (context.url + ' ' + context.title + ' ' + (context.textSummary || '')).toLowerCase();

    for (const [domain, info] of Object.entries(this.domainKnowledge)) {
      const matches = info.keywords.filter(kw => searchText.includes(kw));
      if (matches.length >= 2) {
        return {
          domain,
          expertise: info.expertise,
          confidence: matches.length / info.keywords.length
        };
      }
    }

    return null;
  }

  /**
   * Enhance prompt with context
   * @param {string} userPrompt - Original user prompt
   * @param {Object} options - Enhancement options
   */
  async enhancePrompt(userPrompt, options = {}) {
    const {
      includePageContext = true,
      includeFormContext = true,
      includeConversationHistory = true,
      includeDomainExpertise = true,
      includeSelectedText = true
    } = options;

    // Capture fresh context
    await this.capturePageContext();

    let enhancedPrompt = '';
    let systemContext = '';

    // Add domain expertise
    if (includeDomainExpertise && this.currentContext.page?.detectedDomain) {
      systemContext += this.currentContext.page.detectedDomain.expertise + '\n\n';
    }

    // Add page context
    if (includePageContext && this.currentContext.page) {
      systemContext += `Current Page Context:
- URL: ${this.currentContext.page.url}
- Title: ${this.currentContext.page.title}
- Page Type: ${this.currentContext.page.pageType}
`;
    }

    // Add form context
    if (includeFormContext && this.currentContext.page?.forms?.length > 0) {
      const formInfo = this.currentContext.page.forms.map(f => 
        `Form "${f.name || f.id}" with ${f.fieldCount} fields: ${f.fields.map(field => field.label || field.name).join(', ')}`
      ).join('\n');
      
      systemContext += `\nDetected Forms:\n${formInfo}\n`;
    }

    // Add selected text
    if (includeSelectedText && this.currentContext.page?.selectedText) {
      systemContext += `\nUser has selected this text: "${this.currentContext.page.selectedText}"\n`;
    }

    // Add conversation history
    if (includeConversationHistory && this.conversationMemory.length > 0) {
      const recentHistory = this.conversationMemory.slice(-3).map(m => 
        `User: ${m.user}\nAssistant: ${m.assistant.substring(0, 200)}...`
      ).join('\n\n');
      
      systemContext += `\nRecent Conversation:\n${recentHistory}\n`;
    }

    // Combine everything
    if (systemContext) {
      enhancedPrompt = `[CONTEXT]\n${systemContext}\n[END CONTEXT]\n\nUser Request: ${userPrompt}`;
    } else {
      enhancedPrompt = userPrompt;
    }

    return {
      enhancedPrompt,
      systemContext,
      originalPrompt: userPrompt,
      context: this.currentContext.page
    };
  }

  /**
   * Add to conversation memory
   * @param {string} userMessage - User's message
   * @param {string} assistantResponse - AI's response
   */
  addToMemory(userMessage, assistantResponse) {
    this.conversationMemory.push({
      user: userMessage,
      assistant: assistantResponse,
      timestamp: Date.now()
    });

    // Trim memory if needed
    if (this.conversationMemory.length > this.maxMemorySize) {
      this.conversationMemory = this.conversationMemory.slice(-this.maxMemorySize);
    }
  }

  /**
   * Clear conversation memory
   */
  clearMemory() {
    this.conversationMemory = [];
  }

  /**
   * Get action suggestions based on context
   */
  getActionSuggestions() {
    const suggestions = [];
    const page = this.currentContext.page;

    if (!page) return suggestions;

    if (page.forms.length > 0) {
      suggestions.push({
        action: 'autofill',
        label: 'Auto-fill detected form',
        icon: '📝',
        description: `Fill ${page.forms[0].fieldCount} fields automatically`
      });
    }

    if (page.pageType === 'article') {
      suggestions.push({
        action: 'summarize',
        label: 'Summarize this page',
        icon: '📋',
        description: 'Get a concise summary of the content'
      });
    }

    if (page.selectedText) {
      suggestions.push({
        action: 'explain',
        label: 'Explain selection',
        icon: '💡',
        description: 'Get an explanation of the selected text'
      });
    }

    if (page.detectedDomain) {
      suggestions.push({
        action: 'expert',
        label: `${page.detectedDomain.domain} expert mode`,
        icon: '🎯',
        description: `AI is ready to help with ${page.detectedDomain.domain} tasks`
      });
    }

    return suggestions;
  }

  /**
   * Generate contextual system prompt for AI
   */
  generateSystemPrompt() {
    let prompt = `You are CUBE Nexum AI Assistant, an intelligent browser automation helper.

Your capabilities:
- Form detection and auto-filling
- Document analysis and extraction
- Macro recording and playback
- Screenshot capture
- Browser automation

Communication style:
- Be concise and helpful
- Provide actionable suggestions
- Reference specific elements when relevant
- Offer to execute actions when appropriate
`;

    // Add domain expertise
    if (this.currentContext.page?.detectedDomain) {
      prompt += `\n${this.currentContext.page.detectedDomain.expertise}\n`;
    }

    return prompt;
  }
}

// Create singleton instance
if (typeof window !== 'undefined') {
  if (!window.aiContextEnhancer) {
    window.aiContextEnhancer = new AIContextEnhancer();
    console.log('🧠 AI Context Enhancer Service created');
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIContextEnhancer;
}
