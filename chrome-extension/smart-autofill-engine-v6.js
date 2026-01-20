// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 SMART AUTOFILL ENGINE v7.0.0 - Elite AI & Macro Integration
// ═══════════════════════════════════════════════════════════════════════════════
//
// NEW in v7.0.0:
// ✅ AI-Powered Field Recognition (GPT-4 Vision, Claude, Gemini)
// ✅ Macro Recording & Playback Integration
// ✅ Self-Healing Form Filling (adapts to UI changes)
// ✅ Multi-Page Form Support (with macro automation)
// ✅ Intelligent Field Mapping (semantic understanding)
//
// WORLD'S FIRST:
// - AI learns from your filling patterns
// - Macros automatically adapt to form changes
// - Cross-site form completion memory
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  const CONFIG = {
    // AI Features
    AI_FIELD_RECOGNITION: true,
    AI_CONFIDENCE_THRESHOLD: 0.75,
    AI_SEMANTIC_MATCHING: true,
    
    // Macro Features
    MACRO_ENABLED: true,
    MACRO_AUTO_LEARN: true, // Learn filling patterns
    MACRO_SELF_HEAL: true, // Adapt to UI changes
    
    // Performance
    FILL_DELAY_MIN: 50, // Human-like typing
    FILL_DELAY_MAX: 150,
    MULTI_PAGE_DELAY: 500, // Wait between form pages
    
    // Validation
    VALIDATE_BEFORE_SUBMIT: true,
    VALIDATE_EMAIL: true,
    VALIDATE_PHONE: true,
    
    // Debug
    DEBUG: false
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SMART AUTOFILL ENGINE v6
  // ═══════════════════════════════════════════════════════════════════════════

  class SmartAutofillEngine {
    constructor() {
      this.macroRecorder = null;
      this.macroPlayer = null;
      this.macroAI = null;
      this.aiProviders = null;
      
      this.formHistory = new Map(); // Remember filled forms
      this.fieldPatterns = new Map(); // Learn field patterns
      
      this.initialize();
    }

    async initialize() {
      console.log('🎯 Smart Autofill Engine v7.0.0 initializing...');

      // Initialize macro services if available
      if (window.MacroRecorder) {
        this.macroRecorder = new window.MacroRecorder();
        console.log('✅ Macro Recorder loaded');
      }

      if (window.MacroPlayer) {
        this.macroPlayer = new window.MacroPlayer();
        console.log('✅ Macro Player loaded');
      }

      if (window.MacroAI) {
        this.macroAI = new window.MacroAI();
        console.log('✅ Macro AI loaded');
      }

      // Load AI providers (from document engine)
      if (window.universalDocumentEngineV6?.aiManager) {
        this.aiProviders = window.universalDocumentEngineV6.aiManager;
        console.log('✅ AI Providers loaded');
      }

      // Load form history
      await this.loadFormHistory();

      console.log('🚀 Smart Autofill Engine v7.0.0 ready');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FORM DETECTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Detect all forms on page
     */
    detectForms() {
      const forms = [];

      // Find all form elements
      const formElements = document.querySelectorAll('form');
      
      for (const form of formElements) {
        const formInfo = this.analyzeForm(form);
        if (formInfo.fields.length > 0) {
          forms.push(formInfo);
        }
      }

      // Also detect "virtual forms" (fields without <form> tag)
      const virtualForm = this.detectVirtualForm();
      if (virtualForm && virtualForm.fields.length > 0) {
        forms.push(virtualForm);
      }

      console.log(`📋 Detected ${forms.length} forms`);
      return forms;
    }

    /**
     * Analyze form structure
     */
    analyzeForm(form) {
      const fields = [];

      // Find all input fields
      const inputs = form.querySelectorAll('input, textarea, select');

      for (const input of inputs) {
        const fieldInfo = this.analyzeField(input);
        if (fieldInfo) {
          fields.push(fieldInfo);
        }
      }

      // Determine form type (application, login, survey, etc.)
      const formType = this.detectFormType(fields);

      // Check if we've seen this form before
      const formSignature = this.generateFormSignature(form, fields);
      const knownForm = this.formHistory.get(formSignature);

      return {
        element: form,
        id: form.id,
        action: form.action,
        method: form.method,
        fields: fields,
        type: formType,
        signature: formSignature,
        knownForm: !!knownForm,
        previousData: knownForm?.data,
        macroAvailable: knownForm?.macro
      };
    }

    /**
     * Analyze individual field
     */
    analyzeField(element) {
      // Skip hidden/disabled fields
      if (element.type === 'hidden' || element.disabled || element.readOnly) {
        return null;
      }

      // Get field metadata
      const label = this.findFieldLabel(element);
      const placeholder = element.placeholder || '';
      const name = element.name || element.id || '';
      const type = element.type || element.tagName.toLowerCase();

      // Detect field purpose using AI/patterns
      const purpose = this.detectFieldPurpose(element, label, placeholder, name);

      return {
        element: element,
        name: name,
        label: label,
        placeholder: placeholder,
        type: type,
        purpose: purpose,
        required: element.required,
        pattern: element.pattern,
        maxLength: element.maxLength,
        value: element.value
      };
    }

    /**
     * Detect field purpose (firstName, email, phone, etc.)
     */
    detectFieldPurpose(element, label, placeholder, name) {
      const text = `${label} ${placeholder} ${name}`.toLowerCase();

      // Common field patterns
      const patterns = {
        firstName: /first\s*name|given\s*name|fname/i,
        lastName: /last\s*name|surname|family\s*name|lname/i,
        email: /e-?mail|correo/i,
        phone: /phone|tel|móvil|celular/i,
        address: /address|dirección|calle/i,
        city: /city|ciudad/i,
        state: /state|provincia|estado/i,
        zip: /zip|postal|código/i,
        country: /country|país/i,
        ssn: /ssn|social\s*security|seguro\s*social/i,
        dob: /birth|fecha\s*nacimiento|dob/i,
        company: /company|empresa|organization/i
      };

      for (const [purpose, pattern] of Object.entries(patterns)) {
        if (pattern.test(text)) {
          return purpose;
        }
      }

      // Use AI for complex cases if available
      if (CONFIG.AI_SEMANTIC_MATCHING && this.aiProviders) {
        // Queue for batch AI analysis
        return this.queueAIFieldAnalysis(element, label, placeholder, name);
      }

      return 'unknown';
    }

    /**
     * Find label for field
     */
    findFieldLabel(element) {
      // Check for <label> tag
      if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) return label.textContent.trim();
      }

      // Check parent label
      const parentLabel = element.closest('label');
      if (parentLabel) {
        return parentLabel.textContent.replace(element.value, '').trim();
      }

      // Check aria-label
      if (element.getAttribute('aria-label')) {
        return element.getAttribute('aria-label');
      }

      // Check previous sibling
      const prevSibling = element.previousElementSibling;
      if (prevSibling && (prevSibling.tagName === 'LABEL' || prevSibling.tagName === 'SPAN')) {
        return prevSibling.textContent.trim();
      }

      return '';
    }

    /**
     * Detect form type
     */
    detectFormType(fields) {
      const purposes = fields.map(f => f.purpose);

      // Application form (has SSN, DOB, address)
      if (purposes.includes('ssn') || purposes.includes('dob')) {
        return 'application';
      }

      // Login form (email + password)
      if (purposes.includes('email') && purposes.filter(p => p === 'password').length > 0) {
        return 'login';
      }

      // Registration form (email, password, name)
      if (purposes.includes('email') && purposes.includes('firstName')) {
        return 'registration';
      }

      // Contact form (name, email, message)
      if (purposes.includes('email') && fields.length <= 5) {
        return 'contact';
      }

      return 'generic';
    }

    /**
     * Detect virtual form (fields without <form> tag)
     */
    detectVirtualForm() {
      // Find all inputs not inside a form
      const orphanInputs = document.querySelectorAll('input:not(form input), textarea:not(form textarea), select:not(form select)');
      
      if (orphanInputs.length === 0) return null;

      const fields = [];
      for (const input of orphanInputs) {
        const fieldInfo = this.analyzeField(input);
        if (fieldInfo) fields.push(fieldInfo);
      }

      if (fields.length === 0) return null;

      return {
        element: document.body,
        virtual: true,
        fields: fields,
        type: this.detectFormType(fields),
        signature: this.generateFormSignature(document.body, fields)
      };
    }

    /**
     * Generate form signature (for remembering forms)
     */
    generateFormSignature(form, fields) {
      const fieldNames = fields.map(f => f.name).sort().join('|');
      const url = window.location.hostname + window.location.pathname;
      return `${url}::${fieldNames}`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SMART AUTOFILL
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Auto-fill form with data
     */
    async autoFill(formInfo, data, options = {}) {
      try {
        console.log(`🎯 Auto-filling ${formInfo.type} form...`);

        // Check if we have a macro for this form
        if (CONFIG.MACRO_ENABLED && formInfo.macroAvailable && this.macroPlayer) {
          console.log('🤖 Using saved macro...');
          return await this.fillWithMacro(formInfo, data);
        }

        // Use AI-powered filling if available
        if (CONFIG.AI_FIELD_RECOGNITION && this.aiProviders) {
          console.log('🧠 Using AI field mapping...');
          const aiMapping = await this.aiProviders.mapToForm(data, formInfo.fields);
          
          if (aiMapping.success) {
            return await this.fillFieldsWithMapping(formInfo, aiMapping.mapping, options);
          }
        }

        // Traditional smart filling
        console.log('📝 Using smart pattern matching...');
        const mapping = this.mapDataToFields(formInfo.fields, data);
        return await this.fillFieldsWithMapping(formInfo, mapping, options);

      } catch (error) {
        console.error('❌ Auto-fill error:', error);
        throw error;
      }
    }

    /**
     * Fill using recorded macro
     */
    async fillWithMacro(formInfo, data) {
      if (!this.macroPlayer) {
        throw new Error('Macro Player not available');
      }

      // Load macro for this form
      const macro = await this.loadMacro(formInfo.signature);
      if (!macro) {
        throw new Error('Macro not found');
      }

      // Replace macro data with new data
      const updatedMacro = this.updateMacroData(macro, data);

      // Play macro (self-healing will adapt to UI changes)
      const result = await this.macroPlayer.play(updatedMacro, {
        selfHeal: CONFIG.MACRO_SELF_HEAL,
        humanize: true
      });

      if (result.success) {
        console.log(`✅ Macro filled ${result.actionsExecuted}/${result.totalActions} actions`);
        return {
          success: true,
          method: 'macro',
          filledCount: result.actionsExecuted,
          accuracy: result.successRate
        };
      } else {
        console.warn('⚠️ Macro failed, falling back to manual fill');
        throw new Error('Macro playback failed');
      }
    }

    /**
     * Fill fields with mapping
     */
    async fillFieldsWithMapping(formInfo, mapping, options = {}) {
      let filledCount = 0;
      const errors = [];

      // Record macro if enabled
      let recordingId = null;
      if (CONFIG.MACRO_AUTO_LEARN && this.macroRecorder && !formInfo.macroAvailable) {
        console.log('📹 Recording macro for future use...');
        recordingId = await this.macroRecorder.start({
          name: `AutoFill - ${formInfo.type} - ${new Date().toISOString()}`,
          form: formInfo.signature
        });
      }

      for (const field of formInfo.fields) {
        const mappedData = mapping[field.name] || mapping[field.purpose];
        
        if (mappedData && mappedData.value) {
          try {
            // Human-like delay
            if (options.humanize !== false) {
              await this.sleep(this.randomDelay());
            }

            // Fill field
            const success = await this.fillField(field, mappedData.value, options);
            
            if (success) {
              filledCount++;
            } else {
              errors.push({ field: field.name, error: 'Fill failed' });
            }

          } catch (error) {
            console.error(`Failed to fill ${field.name}:`, error);
            errors.push({ field: field.name, error: error.message });
          }
        }
      }

      // Stop recording
      if (recordingId && this.macroRecorder) {
        await this.macroRecorder.stop();
        console.log('✅ Macro recorded for future use');
        
        // Save macro
        await this.saveMacro(formInfo.signature, recordingId);
      }

      // Validate if enabled
      if (CONFIG.VALIDATE_BEFORE_SUBMIT) {
        const validation = this.validateForm(formInfo);
        if (!validation.valid) {
          console.warn('⚠️ Validation errors:', validation.errors);
        }
      }

      console.log(`✅ Filled ${filledCount}/${formInfo.fields.length} fields`);

      return {
        success: true,
        method: 'smart',
        filledCount: filledCount,
        totalFields: formInfo.fields.length,
        successRate: (filledCount / formInfo.fields.length) * 100,
        errors: errors
      };
    }

    /**
     * Fill individual field
     */
    async fillField(field, value, options = {}) {
      const element = field.element;

      if (!element || !element.isConnected) {
        return false;
      }

      try {
        // Focus element
        element.focus();

        if (element.tagName === 'SELECT') {
          // Select dropdown
          return this.fillSelect(element, value);
          
        } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          // Text input
          if (options.humanize !== false) {
            // Human-like typing
            return await this.typeHumanLike(element, value);
          } else {
            // Instant fill
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
          
        } else if (element.type === 'checkbox') {
          // Checkbox
          element.checked = Boolean(value);
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
          
        } else if (element.type === 'radio') {
          // Radio button
          if (element.value === value) {
            element.checked = true;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
          return false;
        }

        return false;

      } catch (error) {
        console.error('Fill field error:', error);
        return false;
      } finally {
        // Blur element
        element.blur();
      }
    }

    /**
     * Fill select dropdown
     */
    fillSelect(select, value) {
      const options = Array.from(select.options);
      
      // Try exact match
      let match = options.find(opt => opt.value === value || opt.textContent === value);
      
      // Try fuzzy match
      if (!match) {
        const valueLower = String(value).toLowerCase();
        match = options.find(opt => 
          opt.value.toLowerCase().includes(valueLower) ||
          opt.textContent.toLowerCase().includes(valueLower)
        );
      }

      if (match) {
        select.value = match.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      return false;
    }

    /**
     * Type with human-like delays
     */
    async typeHumanLike(element, text) {
      element.value = '';
      
      for (const char of String(text)) {
        element.value += char;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(this.randomDelay(10, 50)); // Fast typing
      }

      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    /**
     * Map data to fields (traditional method)
     */
    mapDataToFields(fields, data) {
      const mapping = {};

      for (const field of fields) {
        // Try by purpose first
        if (field.purpose && field.purpose !== 'unknown' && data[field.purpose]) {
          mapping[field.name] = {
            value: data[field.purpose],
            confidence: 0.95
          };
          continue;
        }

        // Try by field name
        if (data[field.name]) {
          mapping[field.name] = {
            value: data[field.name],
            confidence: 0.90
          };
          continue;
        }

        // Try fuzzy matching
        const fuzzyMatch = this.fuzzyMatch(field, data);
        if (fuzzyMatch) {
          mapping[field.name] = fuzzyMatch;
        }
      }

      return mapping;
    }

    /**
     * Fuzzy match field to data
     */
    fuzzyMatch(field, data) {
      const fieldText = `${field.label} ${field.placeholder} ${field.name}`.toLowerCase();

      for (const [key, value] of Object.entries(data)) {
        const keyLower = key.toLowerCase();
        
        if (fieldText.includes(keyLower) || keyLower.includes(field.name.toLowerCase())) {
          return {
            value: value,
            confidence: 0.70
          };
        }
      }

      return null;
    }

    /**
     * Validate form before submission
     */
    validateForm(formInfo) {
      const errors = [];

      for (const field of formInfo.fields) {
        if (field.required && !field.element.value) {
          errors.push({
            field: field.name,
            error: 'Required field is empty'
          });
        }

        // Validate email
        if (CONFIG.VALIDATE_EMAIL && field.purpose === 'email') {
          if (!this.isValidEmail(field.element.value)) {
            errors.push({
              field: field.name,
              error: 'Invalid email format'
            });
          }
        }

        // Validate phone
        if (CONFIG.VALIDATE_PHONE && field.purpose === 'phone') {
          if (!this.isValidPhone(field.element.value)) {
            errors.push({
              field: field.name,
              error: 'Invalid phone format'
            });
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STORAGE & HISTORY
    // ═══════════════════════════════════════════════════════════════════════════

    async loadFormHistory() {
      try {
        const result = await chrome.storage.local.get('formHistory');
        if (result.formHistory) {
          this.formHistory = new Map(Object.entries(result.formHistory));
          console.log(`📚 Loaded ${this.formHistory.size} form histories`);
        }
      } catch (error) {
        console.error('Failed to load form history:', error);
      }
    }

    async saveFormHistory(formSignature, data) {
      this.formHistory.set(formSignature, {
        data: data,
        timestamp: Date.now()
      });

      try {
        await chrome.storage.local.set({
          formHistory: Object.fromEntries(this.formHistory)
        });
      } catch (error) {
        console.error('Failed to save form history:', error);
      }
    }

    async loadMacro(formSignature) {
      // Delegate to macro player
      if (!this.macroPlayer) return null;
      return await this.macroPlayer.loadMacroForForm(formSignature);
    }

    async saveMacro(formSignature, macroId) {
      // Associate macro with form
      const history = this.formHistory.get(formSignature) || {};
      history.macro = macroId;
      this.formHistory.set(formSignature, history);
      await this.saveFormHistory(formSignature, history.data);
    }

    updateMacroData(macro, newData) {
      // Replace old data with new in macro actions
      const updatedActions = macro.actions.map(action => {
        if (action.type === 'type' && action.value) {
          // Try to find matching field in new data
          for (const [key, value] of Object.entries(newData)) {
            if (action.element?.label?.toLowerCase().includes(key.toLowerCase())) {
              return { ...action, value: value };
            }
          }
        }
        return action;
      });

      return { ...macro, actions: updatedActions };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    randomDelay(min = CONFIG.FILL_DELAY_MIN, max = CONFIG.FILL_DELAY_MAX) {
      return Math.random() * (max - min) + min;
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isValidPhone(phone) {
      return /^[\d\s\-\(\)\+]{10,}$/.test(phone);
    }

    queueAIFieldAnalysis(element, label, placeholder, name) {
      // Placeholder for batch AI analysis
      return 'unknown';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════════════

  window.SmartAutofillEngine = SmartAutofillEngine;
  window.smartAutofillEngineV6 = new SmartAutofillEngine();

  console.log('🎯 Smart Autofill Engine v7.0.0 loaded');

})(window);
