/**
 * 🎓 CUBE Nexum v7.0.0 - Field Learning Service
 * 
 * ADAPTIVE FIELD RECOGNITION THROUGH USER CORRECTIONS
 * 
 * Features:
 * - Learn from user corrections to autofill
 * - Build domain-specific field mappings
 * - Improve accuracy over time
 * - Export/import learned patterns
 * - Site-specific customization
 * - Neural-like pattern recognition
 * 
 * @version 7.0.0
 * @license CUBE Nexum Enterprise
 */

class FieldLearningService {
  constructor() {
    this.learningData = {
      fieldMappings: {},      // selector -> field type
      sitePatterns: {},       // domain -> patterns
      corrections: [],        // history of corrections
      confidence: {}          // confidence scores per mapping
    };

    this.fieldTypes = [
      'firstName', 'lastName', 'fullName', 'email', 'phone', 'phoneCell', 'phoneWork',
      'address', 'address2', 'city', 'state', 'zip', 'country',
      'ssn', 'dob', 'company', 'title', 'website',
      'cardNumber', 'cardExpiry', 'cardCVV', 'cardName',
      'username', 'password', 'passwordConfirm',
      'income', 'employerName', 'employerAddress', 'occupation',
      'loanAmount', 'propertyValue', 'downPayment',
      'notes', 'comments', 'message', 'subject'
    ];

    this.loadLearningData();
    this.setupAutoLearn();
    
    console.log('🎓 Field Learning Service initialized');
  }

  /**
   * Load learning data from storage
   */
  async loadLearningData() {
    try {
      const stored = await chrome.storage.local.get('cube_field_learning');
      if (stored.cube_field_learning) {
        this.learningData = {
          ...this.learningData,
          ...stored.cube_field_learning
        };
        console.log(`🎓 Loaded ${Object.keys(this.learningData.fieldMappings).length} field mappings`);
      }
    } catch (error) {
      console.error('Failed to load learning data:', error);
    }
  }

  /**
   * Save learning data to storage
   */
  async saveLearningData() {
    try {
      await chrome.storage.local.set({
        cube_field_learning: this.learningData
      });
      console.log('🎓 Learning data saved');
    } catch (error) {
      console.error('Failed to save learning data:', error);
    }
  }

  /**
   * Setup auto-learn from user interactions
   */
  setupAutoLearn() {
    // Listen for input changes after autofill
    document.addEventListener('input', (e) => {
      const target = e.target;
      if (!target || !target.matches('input, select, textarea')) return;

      // Check if this was a correction to autofilled data
      if (target.dataset.cubeFilled && target.dataset.cubeOriginalValue) {
        const newValue = target.value;
        const originalValue = target.dataset.cubeOriginalValue;
        
        if (newValue !== originalValue) {
          this.recordCorrection(target, originalValue, newValue);
        }
      }
    }, { capture: true });

    // Listen for form submissions to validate autofill accuracy
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.dataset.cubeAutoFilled) {
        this.validateFormSubmission(form);
      }
    }, { capture: true });
  }

  /**
   * Record a user correction
   */
  async recordCorrection(element, originalValue, newValue) {
    const correction = {
      selector: this.generateSelector(element),
      domain: window.location.hostname,
      originalFieldType: element.dataset.cubeFieldType || 'unknown',
      originalValue: originalValue,
      newValue: newValue,
      inferredFieldType: this.inferFieldType(newValue),
      timestamp: Date.now(),
      attributes: {
        name: element.name,
        id: element.id,
        type: element.type,
        placeholder: element.placeholder,
        ariaLabel: element.getAttribute('aria-label')
      }
    };

    // Add to corrections history
    this.learningData.corrections.push(correction);

    // Limit history size
    if (this.learningData.corrections.length > 1000) {
      this.learningData.corrections = this.learningData.corrections.slice(-500);
    }

    // Learn from this correction
    if (correction.inferredFieldType !== 'unknown') {
      await this.learnMapping(correction);
    }

    console.log('🎓 Correction recorded:', correction.inferredFieldType);
    await this.saveLearningData();
  }

  /**
   * Learn a new field mapping
   */
  async learnMapping(correction) {
    const key = this.getMappingKey(correction);
    
    // Update field mapping
    if (!this.learningData.fieldMappings[key]) {
      this.learningData.fieldMappings[key] = {
        fieldType: correction.inferredFieldType,
        occurrences: 0,
        confidence: 0.5
      };
    }

    const mapping = this.learningData.fieldMappings[key];
    mapping.occurrences++;
    mapping.lastSeen = Date.now();
    
    // Increase confidence with each confirmation
    mapping.confidence = Math.min(0.99, mapping.confidence + (1 - mapping.confidence) * 0.2);

    // Update site patterns
    const domain = correction.domain;
    if (!this.learningData.sitePatterns[domain]) {
      this.learningData.sitePatterns[domain] = {
        mappings: {},
        visits: 0,
        successRate: 0
      };
    }
    
    const sitePattern = this.learningData.sitePatterns[domain];
    sitePattern.mappings[key] = correction.inferredFieldType;
    sitePattern.visits++;

    // Emit learning event
    document.dispatchEvent(new CustomEvent('cubeFieldLearned', {
      detail: { key, fieldType: correction.inferredFieldType, confidence: mapping.confidence }
    }));
  }

  /**
   * Generate mapping key from correction data
   */
  getMappingKey(data) {
    const parts = [];
    
    if (data.attributes.name) parts.push(`name:${data.attributes.name}`);
    if (data.attributes.id) parts.push(`id:${data.attributes.id}`);
    if (data.attributes.placeholder) parts.push(`ph:${data.attributes.placeholder.substring(0, 30)}`);
    if (data.attributes.ariaLabel) parts.push(`aria:${data.attributes.ariaLabel.substring(0, 30)}`);
    if (data.attributes.type) parts.push(`type:${data.attributes.type}`);
    
    return parts.join('|') || data.selector;
  }

  /**
   * Generate unique selector for element
   */
  generateSelector(element) {
    const parts = [];
    
    // ID is most specific
    if (element.id) {
      return `#${element.id}`;
    }

    // Build path with useful attributes
    parts.push(element.tagName.toLowerCase());
    
    if (element.name) {
      parts.push(`[name="${element.name}"]`);
    }
    
    if (element.type) {
      parts.push(`[type="${element.type}"]`);
    }

    return parts.join('');
  }

  /**
   * Infer field type from value
   */
  inferFieldType(value) {
    if (!value) return 'unknown';

    const val = value.trim().toLowerCase();

    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'email';
    }

    // Phone (various formats)
    if (/^[\d\s\-\+\(\)]{10,}$/.test(value.replace(/\s/g, ''))) {
      return 'phone';
    }

    // SSN
    if (/^\d{3}-?\d{2}-?\d{4}$/.test(value)) {
      return 'ssn';
    }

    // ZIP code (US)
    if (/^\d{5}(-\d{4})?$/.test(value)) {
      return 'zip';
    }

    // Credit card
    if (/^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/.test(value)) {
      return 'cardNumber';
    }

    // CVV
    if (/^\d{3,4}$/.test(value) && value.length <= 4) {
      return 'cardCVV';
    }

    // Date of birth (various formats)
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(value)) {
      return 'dob';
    }

    // Money/currency
    if (/^\$?[\d,]+(\.\d{2})?$/.test(value)) {
      if (val.includes('income') || parseFloat(value.replace(/[$,]/g, '')) > 10000) {
        return 'income';
      }
      return 'loanAmount';
    }

    // State abbreviations
    const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
                      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
    if (usStates.includes(value.toUpperCase())) {
      return 'state';
    }

    // Name detection (simple heuristic)
    if (/^[A-Z][a-z]+$/.test(value)) {
      // Could be first or last name
      return 'name';
    }

    // Full name (two or more words starting with caps)
    if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/.test(value)) {
      return 'fullName';
    }

    // URL/website
    if (/^https?:\/\/|www\./i.test(value)) {
      return 'website';
    }

    // Address (contains numbers and words)
    if (/^\d+\s+.+/.test(value) && value.length > 10) {
      return 'address';
    }

    return 'unknown';
  }

  /**
   * Get predicted field type for an element
   */
  getPrediction(element) {
    const key = this.getMappingKey({
      attributes: {
        name: element.name,
        id: element.id,
        type: element.type,
        placeholder: element.placeholder,
        ariaLabel: element.getAttribute('aria-label')
      }
    });

    // Check direct mapping
    if (this.learningData.fieldMappings[key]) {
      const mapping = this.learningData.fieldMappings[key];
      return {
        fieldType: mapping.fieldType,
        confidence: mapping.confidence,
        source: 'learned'
      };
    }

    // Check site-specific patterns
    const domain = window.location.hostname;
    const sitePattern = this.learningData.sitePatterns[domain];
    if (sitePattern && sitePattern.mappings[key]) {
      return {
        fieldType: sitePattern.mappings[key],
        confidence: 0.8,
        source: 'site-pattern'
      };
    }

    // Fall back to built-in detection
    return {
      fieldType: null,
      confidence: 0,
      source: 'none'
    };
  }

  /**
   * Validate form submission accuracy
   */
  validateFormSubmission(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    let correct = 0;
    let total = 0;

    inputs.forEach(input => {
      if (input.dataset.cubeFilled) {
        total++;
        // If value wasn't changed, count as correct
        if (input.value === input.dataset.cubeOriginalValue) {
          correct++;
        }
      }
    });

    if (total > 0) {
      const accuracy = correct / total;
      
      // Update site success rate
      const domain = window.location.hostname;
      if (this.learningData.sitePatterns[domain]) {
        const site = this.learningData.sitePatterns[domain];
        // Moving average
        site.successRate = (site.successRate * (site.visits - 1) + accuracy) / site.visits;
      }

      // Track analytics if available
      if (window.productivityAnalytics) {
        window.productivityAnalytics.trackFormFill({
          accuracy: accuracy,
          fields: total,
          corrected: total - correct
        });
      }

      console.log(`🎓 Form accuracy: ${(accuracy * 100).toFixed(1)}% (${correct}/${total})`);
    }
  }

  /**
   * Get learning statistics
   */
  getStatistics() {
    return {
      totalMappings: Object.keys(this.learningData.fieldMappings).length,
      totalSites: Object.keys(this.learningData.sitePatterns).length,
      totalCorrections: this.learningData.corrections.length,
      averageConfidence: this.calculateAverageConfidence(),
      topFieldTypes: this.getTopFieldTypes(),
      topSites: this.getTopSites()
    };
  }

  /**
   * Calculate average confidence across all mappings
   */
  calculateAverageConfidence() {
    const mappings = Object.values(this.learningData.fieldMappings);
    if (mappings.length === 0) return 0;
    
    const sum = mappings.reduce((acc, m) => acc + m.confidence, 0);
    return sum / mappings.length;
  }

  /**
   * Get top field types by occurrence
   */
  getTopFieldTypes() {
    const counts = {};
    Object.values(this.learningData.fieldMappings).forEach(m => {
      counts[m.fieldType] = (counts[m.fieldType] || 0) + m.occurrences;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));
  }

  /**
   * Get top sites by visits
   */
  getTopSites() {
    return Object.entries(this.learningData.sitePatterns)
      .sort((a, b) => b[1].visits - a[1].visits)
      .slice(0, 10)
      .map(([domain, data]) => ({
        domain,
        visits: data.visits,
        successRate: data.successRate,
        mappings: Object.keys(data.mappings).length
      }));
  }

  /**
   * Export learning data
   */
  exportData() {
    const data = {
      version: '7.0.0',
      exportDate: new Date().toISOString(),
      data: this.learningData
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `cube-learning-data-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    console.log('🎓 Learning data exported');
  }

  /**
   * Import learning data
   */
  async importData(file) {
    try {
      const text = await file.text();
      const imported = JSON.parse(text);

      if (!imported.version || !imported.data) {
        throw new Error('Invalid learning data format');
      }

      // Merge with existing data
      this.learningData.fieldMappings = {
        ...this.learningData.fieldMappings,
        ...imported.data.fieldMappings
      };

      this.learningData.sitePatterns = {
        ...this.learningData.sitePatterns,
        ...imported.data.sitePatterns
      };

      await this.saveLearningData();
      console.log('🎓 Learning data imported successfully');

      return {
        success: true,
        imported: {
          mappings: Object.keys(imported.data.fieldMappings || {}).length,
          sites: Object.keys(imported.data.sitePatterns || {}).length
        }
      };

    } catch (error) {
      console.error('Failed to import learning data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear all learning data
   */
  async clearData() {
    this.learningData = {
      fieldMappings: {},
      sitePatterns: {},
      corrections: [],
      confidence: {}
    };
    await this.saveLearningData();
    console.log('🎓 Learning data cleared');
  }

  /**
   * Mark an element as filled by autofill
   */
  markAsFilled(element, fieldType, value) {
    element.dataset.cubeFilled = 'true';
    element.dataset.cubeFieldType = fieldType;
    element.dataset.cubeOriginalValue = value;
    element.dataset.cubeTimestamp = Date.now().toString();
  }
}

// Create singleton instance
if (typeof window !== 'undefined') {
  if (!window.fieldLearningService) {
    window.fieldLearningService = new FieldLearningService();
    console.log('🎓 Field Learning Service created');
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FieldLearningService;
}
