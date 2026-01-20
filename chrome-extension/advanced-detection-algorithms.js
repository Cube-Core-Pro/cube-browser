// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 ADVANCED DETECTION ALGORITHMS v1.0
// ═══════════════════════════════════════════════════════════════════════════════
//
// Algoritmos inteligentes para detección de documentos y formularios:
// - Computer Vision (detección de elementos visuales)
// - Pattern Recognition (reconocimiento de patrones de formularios)
// - DOM Analysis (análisis profundo del DOM)
// - Semantic Understanding (comprensión semántica)
// - Machine Learning Ready (preparado para ML)
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  const CONFIG = {
    // Detection thresholds
    SIMILARITY_THRESHOLD: 0.7,
    CONFIDENCE_THRESHOLD: 0.6,
    MIN_FORM_FIELDS: 3,
    
    // Scanning
    SCAN_DEPTH: 10,
    MAX_ELEMENTS: 10000,
    DEBOUNCE_MS: 500,
    
    // Visual detection
    ENABLE_VISUAL_DETECTION: true,
    ENABLE_SEMANTIC_ANALYSIS: true,
    ENABLE_PATTERN_MATCHING: true,
    
    DEBUG: false
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM PATTERN DATABASE
  // ═══════════════════════════════════════════════════════════════════════════

  const FORM_PATTERNS = {
    // Loan Application Forms
    loanApplication: {
      keywords: ['loan', 'mortgage', 'credit', 'financing', 'borrow', 'préstamo', 'crédito'],
      requiredFields: ['amount', 'income', 'employment'],
      optionalFields: ['property', 'down_payment', 'credit_score'],
      confidence: 0.9
    },

    // Personal Information Forms
    personalInfo: {
      keywords: ['personal', 'information', 'profile', 'account', 'datos personales'],
      requiredFields: ['name', 'email', 'phone'],
      optionalFields: ['address', 'dob', 'ssn'],
      confidence: 0.85
    },

    // Employment Forms
    employment: {
      keywords: ['employment', 'job', 'employer', 'work', 'empleo', 'trabajo'],
      requiredFields: ['employer', 'position', 'income'],
      optionalFields: ['start_date', 'end_date', 'supervisor'],
      confidence: 0.88
    },

    // Financial Forms
    financial: {
      keywords: ['financial', 'income', 'assets', 'liabilities', 'bank', 'financiero'],
      requiredFields: ['income', 'assets', 'debts'],
      optionalFields: ['bank_account', 'investments', 'credit_cards'],
      confidence: 0.87
    },

    // Contact Forms
    contact: {
      keywords: ['contact', 'message', 'inquiry', 'contacto', 'mensaje'],
      requiredFields: ['name', 'email', 'message'],
      optionalFields: ['phone', 'subject', 'company'],
      confidence: 0.75
    },

    // Registration Forms
    registration: {
      keywords: ['register', 'sign up', 'create account', 'registro', 'inscribirse'],
      requiredFields: ['email', 'password'],
      optionalFields: ['name', 'username', 'confirm_password'],
      confidence: 0.8
    },

    // Property/Real Estate Forms
    property: {
      keywords: ['property', 'real estate', 'home', 'house', 'propiedad', 'inmueble'],
      requiredFields: ['address', 'property_type', 'value'],
      optionalFields: ['bedrooms', 'bathrooms', 'square_feet'],
      confidence: 0.86
    },

    // Tax Forms
    tax: {
      keywords: ['tax', 'irs', 'w-2', '1040', 'impuesto', 'fiscal'],
      requiredFields: ['ssn', 'income', 'year'],
      optionalFields: ['dependents', 'deductions', 'credits'],
      confidence: 0.92
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SEMANTIC ANALYZER - Comprende el significado de los campos
  // ═══════════════════════════════════════════════════════════════════════════

  class SemanticAnalyzer {
    static analyzeField(element) {
      const context = this.extractContext(element);
      const semanticType = this.inferSemanticType(context);
      const confidence = this.calculateConfidence(context, semanticType);

      return {
        element: element,
        semanticType: semanticType,
        confidence: confidence,
        context: context
      };
    }

    static extractContext(element) {
      return {
        // Element attributes
        id: element.id || '',
        name: element.name || '',
        type: element.type || '',
        placeholder: element.placeholder || '',
        title: element.title || '',
        autocomplete: element.autocomplete || '',
        pattern: element.pattern || '',
        
        // Labels
        label: this.findLabel(element),
        ariaLabel: element.getAttribute('aria-label') || '',
        
        // Visual context
        nearbyText: this.getNearbyText(element),
        parentText: this.getParentText(element),
        
        // Position
        position: this.getPositionContext(element),
        
        // Siblings
        siblings: this.getSiblingContext(element)
      };
    }

    static findLabel(element) {
      // Try <label for="id">
      if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) return label.textContent.trim();
      }

      // Try parent <label>
      const parentLabel = element.closest('label');
      if (parentLabel) {
        return parentLabel.textContent.replace(element.value || '', '').trim();
      }

      // Try aria-labelledby
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const labelEl = document.getElementById(labelledBy);
        if (labelEl) return labelEl.textContent.trim();
      }

      return '';
    }

    static getNearbyText(element, radius = 100) {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const textNodes = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.trim()) {
          const range = document.createRange();
          range.selectNode(node);
          const rects = range.getClientRects();
          
          for (const r of rects) {
            const dx = (r.left + r.width / 2) - centerX;
            const dy = (r.top + r.height / 2) - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < radius) {
              textNodes.push({
                text: node.textContent.trim(),
                distance: distance
              });
            }
          }
        }
      }

      textNodes.sort((a, b) => a.distance - b.distance);
      return textNodes.slice(0, 5).map(n => n.text).join(' ');
    }

    static getParentText(element) {
      let parent = element.parentElement;
      let depth = 0;
      const texts = [];

      while (parent && depth < 3) {
        const text = Array.from(parent.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent.trim())
          .filter(text => text)
          .join(' ');
        
        if (text) texts.push(text);
        
        parent = parent.parentElement;
        depth++;
      }

      return texts.join(' ');
    }

    static getPositionContext(element) {
      const allInputs = Array.from(document.querySelectorAll('input, select, textarea'));
      const index = allInputs.indexOf(element);
      
      return {
        index: index,
        total: allInputs.length,
        position: index >= 0 ? (index / allInputs.length) : 0.5,
        isFirst: index === 0,
        isLast: index === allInputs.length - 1
      };
    }

    static getSiblingContext(element) {
      const form = element.closest('form');
      if (!form) return { count: 0, types: [] };

      const siblings = form.querySelectorAll('input, select, textarea');
      const types = Array.from(siblings).map(el => el.type || el.tagName.toLowerCase());
      
      return {
        count: siblings.length,
        types: [...new Set(types)]
      };
    }

    static inferSemanticType(context) {
      const combinedText = [
        context.id,
        context.name,
        context.label,
        context.ariaLabel,
        context.placeholder,
        context.nearbyText
      ].join(' ').toLowerCase();

      // Pattern matching with scores
      const scores = {};

      // Name patterns
      if (/first.*name|fname|given.*name|nombre/i.test(combinedText)) {
        scores.firstName = 0.9;
      }
      if (/last.*name|lname|surname|apellido/i.test(combinedText)) {
        scores.lastName = 0.9;
      }
      if (/^name$/i.test(context.name) || /^name$/i.test(context.id)) {
        scores.fullName = 0.85;
      }

      // Contact patterns
      if (/e?-?mail|correo/i.test(combinedText)) {
        scores.email = 0.95;
      }
      if (/phone|tel|mobile|cell|telefono/i.test(combinedText)) {
        scores.phone = 0.9;
      }

      // Address patterns
      if (/address|street|direccion|calle/i.test(combinedText) && !/email/i.test(combinedText)) {
        scores.address = 0.85;
      }
      if (/city|ciudad/i.test(combinedText)) {
        scores.city = 0.9;
      }
      if (/state|province|estado/i.test(combinedText)) {
        scores.state = 0.9;
      }
      if (/zip|postal.*code|codigo.*postal/i.test(combinedText)) {
        scores.zipCode = 0.9;
      }

      // Financial patterns
      if (/ssn|social.*security|seguro.*social/i.test(combinedText)) {
        scores.ssn = 0.95;
      }
      if (/income|salary|ingreso|salario/i.test(combinedText)) {
        scores.income = 0.9;
      }
      if (/loan.*amount|monto/i.test(combinedText)) {
        scores.loanAmount = 0.9;
      }

      // Employment patterns
      if (/employer|company|empresa/i.test(combinedText)) {
        scores.employer = 0.85;
      }
      if (/job.*title|position|occupation|puesto/i.test(combinedText)) {
        scores.jobTitle = 0.85;
      }

      // Date patterns
      if (/birth|dob|nacimiento/i.test(combinedText) || context.type === 'date') {
        scores.dateOfBirth = 0.9;
      }

      // Password patterns
      if (/password|contraseña/i.test(combinedText) || context.type === 'password') {
        scores.password = 0.95;
      }

      // Find highest score
      const entries = Object.entries(scores);
      if (entries.length === 0) {
        return 'unknown';
      }

      entries.sort((a, b) => b[1] - a[1]);
      return entries[0][1] >= CONFIG.CONFIDENCE_THRESHOLD ? entries[0][0] : 'unknown';
    }

    static calculateConfidence(context, semanticType) {
      if (semanticType === 'unknown') return 0;

      let confidence = 0.5;

      // Boost confidence based on multiple indicators
      const indicators = [
        context.label,
        context.ariaLabel,
        context.placeholder,
        context.name,
        context.id
      ].filter(Boolean);

      confidence += indicators.length * 0.1;

      // Autocomplete attribute adds confidence
      if (context.autocomplete) {
        confidence += 0.15;
      }

      // Pattern attribute adds confidence
      if (context.pattern) {
        confidence += 0.1;
      }

      // Type attribute matching adds confidence
      const typeMatches = {
        email: 'email',
        tel: 'phone',
        date: 'dateOfBirth',
        password: 'password'
      };

      if (typeMatches[context.type] === semanticType) {
        confidence += 0.15;
      }

      return Math.min(confidence, 1.0);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN RECOGNIZER - Reconoce patrones de formularios
  // ═══════════════════════════════════════════════════════════════════════════

  class PatternRecognizer {
    static recognizeForm(form) {
      log('🔍 Analyzing form pattern...');

      const fields = this.extractFields(form);
      const keywords = this.extractKeywords(form);
      const structure = this.analyzeStructure(form);

      // Match against known patterns
      let bestMatch = null;
      let highestScore = 0;

      for (const [type, pattern] of Object.entries(FORM_PATTERNS)) {
        const score = this.calculatePatternScore(fields, keywords, pattern);
        
        if (score > highestScore) {
          highestScore = score;
          bestMatch = { type, pattern, score };
        }
      }

      return {
        match: bestMatch,
        fields: fields,
        keywords: keywords,
        structure: structure,
        confidence: highestScore
      };
    }

    static extractFields(form) {
      const inputs = form.querySelectorAll('input, select, textarea');
      const fields = [];

      for (const input of inputs) {
        const analysis = SemanticAnalyzer.analyzeField(input);
        fields.push(analysis);
      }

      return fields;
    }

    static extractKeywords(form) {
      const text = form.textContent.toLowerCase();
      const keywords = new Set();

      // Extract all words
      const words = text.match(/\b[a-z]{3,}\b/g) || [];
      
      // Filter common words
      const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']);

      for (const word of words) {
        if (!stopWords.has(word)) {
          keywords.add(word);
        }
      }

      return Array.from(keywords);
    }

    static analyzeStructure(form) {
      return {
        fieldCount: form.querySelectorAll('input, select, textarea').length,
        hasSubmit: !!form.querySelector('button[type="submit"], input[type="submit"]'),
        hasFieldsets: form.querySelectorAll('fieldset').length,
        sections: form.querySelectorAll('section, .section, .form-section').length,
        hasValidation: !!form.getAttribute('novalidate') === false
      };
    }

    static calculatePatternScore(fields, keywords, pattern) {
      let score = 0;

      // Keyword matching (40% weight)
      const keywordMatches = keywords.filter(kw => 
        pattern.keywords.some(pk => kw.includes(pk) || pk.includes(kw))
      );
      score += (keywordMatches.length / pattern.keywords.length) * 0.4;

      // Required fields matching (40% weight)
      const fieldTypes = fields.map(f => f.semanticType);
      const requiredMatches = pattern.requiredFields.filter(rf => 
        fieldTypes.includes(rf)
      );
      score += (requiredMatches.length / pattern.requiredFields.length) * 0.4;

      // Optional fields matching (20% weight)
      const optionalMatches = pattern.optionalFields.filter(of => 
        fieldTypes.includes(of)
      );
      score += (optionalMatches.length / pattern.optionalFields.length) * 0.2;

      return score * pattern.confidence;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VISUAL DETECTOR - Detecta elementos visualmente
  // ═══════════════════════════════════════════════════════════════════════════

  class VisualDetector {
    static detectVisualElements() {
      log('👁️ Visual element detection...');

      const elements = {
        forms: this.detectVisualForms(),
        tables: this.detectVisualTables(),
        buttons: this.detectVisualButtons(),
        cards: this.detectVisualCards()
      };

      return elements;
    }

    static detectVisualForms() {
      const forms = [];
      
      // Detect actual <form> elements
      document.querySelectorAll('form').forEach(form => {
        if (this.isVisible(form)) {
          forms.push({
            element: form,
            type: 'form',
            bounds: form.getBoundingClientRect(),
            confidence: 1.0
          });
        }
      });

      // Detect form-like structures (div with inputs)
      const containers = document.querySelectorAll('div, section');
      for (const container of containers) {
        const inputs = container.querySelectorAll('input, select, textarea');
        
        if (inputs.length >= CONFIG.MIN_FORM_FIELDS && 
            !container.closest('form') &&
            this.isVisible(container)) {
          
          forms.push({
            element: container,
            type: 'form-like',
            bounds: container.getBoundingClientRect(),
            confidence: 0.7,
            fieldCount: inputs.length
          });
        }
      }

      return forms;
    }

    static detectVisualTables() {
      const tables = [];

      document.querySelectorAll('table').forEach(table => {
        if (this.isVisible(table) && table.rows.length >= 2) {
          tables.push({
            element: table,
            type: 'table',
            bounds: table.getBoundingClientRect(),
            rows: table.rows.length,
            columns: table.rows[0]?.cells.length || 0,
            confidence: 1.0
          });
        }
      });

      // Detect grid-like structures
      const grids = document.querySelectorAll('[role="grid"], [role="table"], .table, .data-grid');
      grids.forEach(grid => {
        if (this.isVisible(grid) && !grid.closest('table')) {
          tables.push({
            element: grid,
            type: 'grid',
            bounds: grid.getBoundingClientRect(),
            confidence: 0.8
          });
        }
      });

      return tables;
    }

    static detectVisualButtons() {
      const buttons = [];
      const selectors = 'button, input[type="button"], input[type="submit"], [role="button"]';

      document.querySelectorAll(selectors).forEach(button => {
        if (this.isVisible(button)) {
          buttons.push({
            element: button,
            text: button.textContent.trim() || button.value,
            bounds: button.getBoundingClientRect(),
            confidence: 1.0
          });
        }
      });

      return buttons;
    }

    static detectVisualCards() {
      const cards = [];
      const selectors = '.card, [role="article"], .panel, .box, .item';

      document.querySelectorAll(selectors).forEach(card => {
        if (this.isVisible(card)) {
          const bounds = card.getBoundingClientRect();
          
          // Cards should have reasonable dimensions
          if (bounds.width > 100 && bounds.height > 100) {
            cards.push({
              element: card,
              bounds: bounds,
              confidence: 0.7
            });
          }
        }
      });

      return cards;
    }

    static isVisible(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             style.opacity !== '0' &&
             rect.width > 0 &&
             rect.height > 0;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOM ANALYZER - Análisis profundo del DOM
  // ═══════════════════════════════════════════════════════════════════════════

  class DOMAnalyzer {
    static analyze() {
      log('🔬 Deep DOM analysis...');

      return {
        structure: this.analyzeStructure(),
        semantics: this.analyzeSemantics(),
        interactivity: this.analyzeInteractivity(),
        complexity: this.calculateComplexity()
      };
    }

    static analyzeStructure() {
      return {
        depth: this.calculateDepth(document.body),
        nodeCount: document.querySelectorAll('*').length,
        forms: document.querySelectorAll('form').length,
        inputs: document.querySelectorAll('input, select, textarea').length,
        iframes: document.querySelectorAll('iframe').length,
        scripts: document.querySelectorAll('script').length
      };
    }

    static calculateDepth(element, current = 0) {
      if (!element.children.length) return current;

      let maxDepth = current;
      for (const child of element.children) {
        const depth = this.calculateDepth(child, current + 1);
        maxDepth = Math.max(maxDepth, depth);
      }

      return maxDepth;
    }

    static analyzeSemantics() {
      return {
        hasMain: !!document.querySelector('main'),
        hasNav: !!document.querySelector('nav'),
        hasHeader: !!document.querySelector('header'),
        hasFooter: !!document.querySelector('footer'),
        hasArticle: !!document.querySelector('article'),
        hasAside: !!document.querySelector('aside'),
        landmarks: document.querySelectorAll('[role]').length
      };
    }

    static analyzeInteractivity() {
      return {
        links: document.querySelectorAll('a[href]').length,
        buttons: document.querySelectorAll('button, input[type="button"], input[type="submit"]').length,
        inputs: document.querySelectorAll('input, select, textarea').length,
        clickables: document.querySelectorAll('[onclick], [ng-click], [data-click]').length
      };
    }

    static calculateComplexity() {
      const structure = this.analyzeStructure();
      
      let score = 0;
      score += Math.min(structure.depth / 20, 1) * 20;
      score += Math.min(structure.nodeCount / 1000, 1) * 30;
      score += Math.min(structure.forms / 5, 1) * 20;
      score += Math.min(structure.inputs / 50, 1) * 15;
      score += Math.min(structure.scripts / 20, 1) * 15;

      return {
        score: score,
        level: score < 30 ? 'simple' : score < 60 ? 'medium' : 'complex'
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  function log(...args) {
    if (CONFIG.DEBUG) {
      console.log('[AdvancedDetection]', ...args);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL API
  // ═══════════════════════════════════════════════════════════════════════════

  window.AdvancedDetection = {
    // Analyzers
    SemanticAnalyzer: SemanticAnalyzer,
    PatternRecognizer: PatternRecognizer,
    VisualDetector: VisualDetector,
    DOMAnalyzer: DOMAnalyzer,
    
    // Quick methods
    analyzePage: () => ({
      visual: VisualDetector.detectVisualElements(),
      dom: DOMAnalyzer.analyze(),
      forms: Array.from(document.querySelectorAll('form')).map(f => 
        PatternRecognizer.recognizeForm(f)
      )
    }),
    
    analyzeForm: (form) => PatternRecognizer.recognizeForm(form),
    analyzeField: (field) => SemanticAnalyzer.analyzeField(field),
    
    // Configuration
    config: CONFIG,
    patterns: FORM_PATTERNS,
    
    version: '1.0.0'
  };

  log('═'.repeat(80));
  log('✅ ADVANCED DETECTION ALGORITHMS v1.0 LOADED');
  log('═'.repeat(80));
  log('🎯 Features: Semantic Analysis, Pattern Recognition, Visual Detection');
  log('═'.repeat(80));

})(window);
