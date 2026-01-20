/**
 * 🏦 LendingPadService - Enterprise-Grade Complete Service
 * 
 * CUBE OmniFill v5.2 Ultimate - LendingPad Integration Service
 * 
 * Funcionalidades Completas:
 * ✅ Detección de documentos (4 métodos)
 * ✅ Descarga de PDFs (batch + individual)
 * ✅ Extracción de datos (OCR + parsing)
 * ✅ Auto-fill de formularios
 * ✅ Validación de datos
 * ✅ Gestión de estado
 * ✅ Retry logic con backoff exponencial
 * ✅ Analytics y métricas
 * 
 * Arquitectura:
 * - Service Layer Pattern
 * - Strategy Pattern para detección
 * - Observer Pattern para eventos
 * - State Pattern para gestión de estado
 * - Factory Pattern para creación de objetos
 * 
 * @version 5.2.0-ultimate
 * @author CUBE Collective LLC
 * @license MIT
 */

class LendingPadService {
  constructor(config = {}) {
    this.config = {
      // Detection settings
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 500,
      retryMultiplier: config.retryMultiplier || 1.5,
      timeout: config.timeout || 15000,
      
      // Download settings
      maxConcurrentDownloads: config.maxConcurrentDownloads || 3,
      downloadTimeout: config.downloadTimeout || 30000,
      validatePDF: config.validatePDF !== false,
      
      // Auto-fill settings
      autoFillDelay: config.autoFillDelay || 300,
      autoFillMaxRetries: config.autoFillMaxRetries || 3,
      stopOnError: config.stopOnError || false,
      
      // Logging
      debugMode: config.debugMode || false,
      enableLogging: config.enableLogging !== false,
      
      ...config
    };
    
    // Core components
    this.detector = null; // Será window.LendingPadDetector
    this.algorithmEngine = null; // Será window.LendingPadAlgorithm
    this.state = new LendingPadState();
    this.logger = new ServiceLogger('LendingPadService', this.config.enableLogging);
    this.metrics = new ServiceMetrics();
    this.eventBus = new EventBus();
    
    // Download queue
    this.downloadQueue = [];
    this.activeDownloads = new Set();
    
    // Auto-fill state
    this.extractedData = null;
    this.formFields = new Map();
    
    this.logger.info('🏦 LendingPadService v5.2 Ultimate initialized', this.config);
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🔍 DETECTION METHODS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Inicializar detector (link con lendingpad-detector.js)
   */
  initialize() {
    try {
      if (typeof window.LendingPadDetector === 'undefined') {
        throw new Error('LendingPadDetector not found. Ensure lendingpad-detector.js is loaded.');
      }
      
      this.detector = window.LendingPadDetector;
      this.algorithmEngine = window.LendingPadAlgorithm || null;
      
      this.logger.success('✅ Detector and Algorithm linked successfully');
      this.state.setInitialized(true);
      this.eventBus.emit('initialized', { timestamp: new Date() });
      
      return true;
    } catch (error) {
      this.logger.error('❌ Initialization failed:', error);
      this.state.setError(error);
      return false;
    }
  }
  
  /**
   * Detectar documentos en la página actual
   * @returns {Promise<DetectionResult>}
   */
  async detectDocuments() {
    this.logger.group('🔍 Document Detection Started');
    
    try {
      // Verificar que estamos en lendingpad.com
      if (!this.isLendingPadDomain()) {
        throw new Error('Not on lendingpad.com domain');
      }
      
      // Verificar inicialización
      if (!this.state.isInitialized()) {
        this.initialize();
      }
      
      this.state.setDetecting(true);
      this.metrics.incrementAttempts('detection');
      
      // Llamar al detector v2.0 Enterprise
      const result = await this.detector.detectDocuments();
      
      if (result.success && result.documents.length > 0) {
        this.state.setDocuments(result.documents);
        this.state.setDetecting(false);
        
        this.logger.success(`✅ Found ${result.documents.length} documents`);
        this.logger.info('📊 Detection Stats:', result.stats);
        
        // Emit event
        this.eventBus.emit('documents-detected', {
          documents: result.documents,
          stats: result.stats
        });
        
        this.metrics.recordSuccess('detection');
        this.logger.groupEnd();
        
        return {
          success: true,
          documents: result.documents,
          count: result.documents.length,
          stats: result.stats,
          methods: result.stats?.methods || {}
        };
      } else {
        this.state.setDetecting(false);
        this.logger.warn('⚠️ No documents found');
        this.logger.groupEnd();
        
        return {
          success: false,
          documents: [],
          count: 0,
          error: result.errors || ['No documents detected']
        };
      }
      
    } catch (error) {
      this.state.setDetecting(false);
      this.state.setError(error);
      this.metrics.recordFailure('detection', error);
      this.logger.error('❌ Detection failed:', error);
      this.logger.groupEnd();
      
      return {
        success: false,
        documents: [],
        count: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Re-detectar documentos con retry logic
   */
  async detectWithRetry() {
    let attempts = 0;
    let lastError = null;
    
    while (attempts < this.config.maxRetries) {
      try {
        attempts++;
        this.logger.info(`🔄 Detection attempt ${attempts}/${this.config.maxRetries}`);
        
        const result = await this.detectDocuments();
        
        if (result.success && result.count > 0) {
          return result;
        }
        
        // No documents found, retry
        if (attempts < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(this.config.retryMultiplier, attempts - 1);
          this.logger.info(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
        
      } catch (error) {
        lastError = error;
        this.logger.warn(`⚠️ Attempt ${attempts} failed:`, error.message);
        
        if (attempts < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(this.config.retryMultiplier, attempts - 1);
          await this.sleep(delay);
        }
      }
    }
    
    throw new Error(`Detection failed after ${attempts} attempts: ${lastError?.message || 'Unknown error'}`);
  }
  
  // ═══════════════════════════════════════════════════════════
  // 📥 DOWNLOAD METHODS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Descargar un documento individual
   */
  async downloadDocument(document, index = 0) {
    this.logger.group(`📥 Downloading: ${document.text || `Document ${index + 1}`}`);
    
    try {
      const downloadUrl = document.downloadUrl || document.url || document.href;
      
      if (!downloadUrl) {
        throw new Error('No download URL available');
      }
      
      this.metrics.incrementAttempts('download');
      
      // Usar Chrome Downloads API
      const downloadId = await chrome.downloads.download({
        url: downloadUrl,
        filename: this.sanitizeFilename(document.text || `lendingpad_doc_${index + 1}.pdf`),
        saveAs: false,
        conflictAction: 'uniquify'
      });
      
      this.logger.success(`✅ Download started (ID: ${downloadId})`);
      this.metrics.recordSuccess('download');
      this.logger.groupEnd();
      
      return {
        success: true,
        downloadId,
        document
      };
      
    } catch (error) {
      this.logger.error('❌ Download failed:', error);
      this.metrics.recordFailure('download', error);
      this.logger.groupEnd();
      
      return {
        success: false,
        error: error.message,
        document
      };
    }
  }
  
  /**
   * Descargar múltiples documentos (batch)
   */
  async downloadBatch(documents) {
    this.logger.group(`📦 Batch Download: ${documents.length} documents`);
    
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    
    // Process in batches of maxConcurrentDownloads
    for (let i = 0; i < documents.length; i += this.config.maxConcurrentDownloads) {
      const batch = documents.slice(i, i + this.config.maxConcurrentDownloads);
      
      this.logger.info(`📥 Processing batch ${Math.floor(i / this.config.maxConcurrentDownloads) + 1}`);
      
      const batchResults = await Promise.allSettled(
        batch.map((doc, idx) => this.downloadDocument(doc, i + idx))
      );
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
          results.push(result.value);
        } else {
          failureCount++;
          results.push({
            success: false,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });
      
      // Small delay between batches
      if (i + this.config.maxConcurrentDownloads < documents.length) {
        await this.sleep(500);
      }
    }
    
    this.logger.success(`✅ Batch complete: ${successCount} success, ${failureCount} failed`);
    this.logger.groupEnd();
    
    this.eventBus.emit('batch-download-complete', {
      total: documents.length,
      success: successCount,
      failed: failureCount,
      results
    });
    
    return {
      success: successCount > 0,
      total: documents.length,
      successful: successCount,
      failed: failureCount,
      results
    };
  }
  
  /**
   * Descargar TODOS los documentos detectados
   */
  async downloadAll() {
    const documents = this.state.getDocuments();
    
    if (!documents || documents.length === 0) {
      this.logger.warn('⚠️ No documents to download. Run detectDocuments() first.');
      return { success: false, error: 'No documents available' };
    }
    
    return await this.downloadBatch(documents);
  }
  
  // ═══════════════════════════════════════════════════════════
  // 📄 DATA EXTRACTION METHODS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Extraer datos de documentos usando FIGURE algorithm
   */
  async extractData(documents) {
    this.logger.group('📄 Data Extraction Started');
    
    try {
      if (!this.algorithmEngine) {
        this.logger.warn('⚠️ Algorithm engine not available. Data extraction limited.');
        return { success: false, error: 'Algorithm not loaded' };
      }
      
      this.metrics.incrementAttempts('extraction');
      
      // Procesar cada documento
      const extractedData = [];
      
      for (const doc of documents) {
        try {
          // Llamar al algoritmo FIGURE
          const data = await this.algorithmEngine.extractFromDocument(doc);
          extractedData.push({
            document: doc,
            data: data,
            success: true
          });
        } catch (error) {
          this.logger.warn(`⚠️ Failed to extract from ${doc.text}:`, error);
          extractedData.push({
            document: doc,
            error: error.message,
            success: false
          });
        }
      }
      
      this.extractedData = extractedData;
      this.metrics.recordSuccess('extraction');
      
      this.logger.success(`✅ Extracted data from ${extractedData.filter(d => d.success).length}/${documents.length} documents`);
      this.logger.groupEnd();
      
      return {
        success: true,
        data: extractedData,
        summary: this.summarizeExtractedData(extractedData)
      };
      
    } catch (error) {
      this.metrics.recordFailure('extraction', error);
      this.logger.error('❌ Extraction failed:', error);
      this.logger.groupEnd();
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Resumir datos extraídos
   */
  summarizeExtractedData(extractedData) {
    const successful = extractedData.filter(d => d.success);
    const failed = extractedData.filter(d => !d.success);
    
    // Consolidar campos comunes
    const commonFields = {};
    successful.forEach(item => {
      if (item.data) {
        Object.entries(item.data).forEach(([key, value]) => {
          if (!commonFields[key]) {
            commonFields[key] = [];
          }
          commonFields[key].push(value);
        });
      }
    });
    
    return {
      total: extractedData.length,
      successful: successful.length,
      failed: failed.length,
      fields: Object.keys(commonFields),
      commonFields
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // ✍️ AUTO-FILL METHODS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Auto-fill formulario con datos extraídos
   */
  async autoFillForm(data, formSelector = 'form') {
    this.logger.group('✍️ Auto-Fill Started');
    
    try {
      const form = document.querySelector(formSelector);
      
      if (!form) {
        throw new Error(`Form not found with selector: ${formSelector}`);
      }
      
      this.metrics.incrementAttempts('autofill');
      
      let filledCount = 0;
      let errorCount = 0;
      const fieldResults = [];
      
      // Mapeo de campos
      for (const [fieldName, value] of Object.entries(data)) {
        try {
          const filled = await this.fillField(form, fieldName, value);
          
          if (filled) {
            filledCount++;
            fieldResults.push({ field: fieldName, value, success: true });
            this.logger.info(`✅ Filled: ${fieldName} = ${value}`);
          } else {
            errorCount++;
            fieldResults.push({ field: fieldName, value, success: false, error: 'Field not found' });
            this.logger.warn(`⚠️ Field not found: ${fieldName}`);
          }
          
          // Delay entre campos
          await this.sleep(this.config.autoFillDelay);
          
        } catch (error) {
          errorCount++;
          fieldResults.push({ field: fieldName, value, success: false, error: error.message });
          this.logger.error(`❌ Error filling ${fieldName}:`, error);
          
          if (this.config.stopOnError) {
            break;
          }
        }
      }
      
      this.metrics.recordSuccess('autofill');
      
      this.logger.success(`✅ Auto-fill complete: ${filledCount} fields filled, ${errorCount} errors`);
      this.logger.groupEnd();
      
      this.eventBus.emit('autofill-complete', {
        filled: filledCount,
        errors: errorCount,
        results: fieldResults
      });
      
      return {
        success: true,
        filled: filledCount,
        errors: errorCount,
        results: fieldResults
      };
      
    } catch (error) {
      this.metrics.recordFailure('autofill', error);
      this.logger.error('❌ Auto-fill failed:', error);
      this.logger.groupEnd();
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Llenar un campo individual
   */
  async fillField(form, fieldName, value) {
    // Buscar campo por múltiples estrategias
    const strategies = [
      () => form.querySelector(`[name="${fieldName}"]`),
      () => form.querySelector(`[id="${fieldName}"]`),
      () => form.querySelector(`[data-field="${fieldName}"]`),
      () => form.querySelector(`[aria-label="${fieldName}"]`),
      () => form.querySelector(`input[placeholder*="${fieldName}" i]`)
    ];
    
    let field = null;
    for (const strategy of strategies) {
      field = strategy();
      if (field) break;
    }
    
    if (!field) {
      return false;
    }
    
    // Llenar según tipo de campo
    if (field.tagName === 'SELECT') {
      // Select dropdown
      const option = Array.from(field.options).find(opt => 
        opt.value === value || opt.text === value
      );
      if (option) {
        field.value = option.value;
        field.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    } else if (field.type === 'checkbox' || field.type === 'radio') {
      // Checkbox/Radio
      field.checked = Boolean(value);
      field.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } else {
      // Text input
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    
    return false;
  }
  
  // ═══════════════════════════════════════════════════════════
  // ✔️ VALIDATION METHODS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Validar documentos detectados
   */
  validateDocuments(documents) {
    this.logger.group('✔️ Document Validation');
    
    const validationResults = documents.map(doc => {
      const errors = [];
      
      // Validar URL
      if (!doc.url && !doc.href && !doc.downloadUrl) {
        errors.push('No download URL');
      }
      
      // Validar nombre/texto
      if (!doc.text && !doc.title) {
        errors.push('No document title');
      }
      
      // Validar fuente
      if (!doc.source) {
        errors.push('No source information');
      }
      
      // Calcular confidence score
      let confidence = 1.0;
      if (errors.length > 0) {
        confidence -= (errors.length * 0.2);
      }
      
      return {
        document: doc,
        valid: errors.length === 0,
        errors,
        confidence: Math.max(0, confidence)
      };
    });
    
    const validCount = validationResults.filter(r => r.valid).length;
    
    this.logger.success(`✅ Validation complete: ${validCount}/${documents.length} valid`);
    this.logger.groupEnd();
    
    return {
      total: documents.length,
      valid: validCount,
      invalid: documents.length - validCount,
      results: validationResults
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 📊 METRICS & ANALYTICS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Obtener métricas del servicio
   */
  getMetrics() {
    return this.metrics.getReport();
  }
  
  /**
   * Obtener estado actual
   */
  getState() {
    return this.state.getState();
  }
  
  /**
   * Reset métricas
   */
  resetMetrics() {
    this.metrics.reset();
    this.logger.info('📊 Metrics reset');
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🔧 UTILITY METHODS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Verificar si estamos en lendingpad.com
   */
  isLendingPadDomain() {
    return window.location.hostname.includes('lendingpad.com');
  }
  
  /**
   * Sanitizar nombre de archivo
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-z0-9_\-\.]/gi, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 200) + (filename.endsWith('.pdf') ? '' : '.pdf');
  }
  
  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Subscribe to events
   */
  on(event, callback) {
    return this.eventBus.on(event, callback);
  }
  
  /**
   * Unsubscribe from events
   */
  off(event, callback) {
    this.eventBus.off(event, callback);
  }
  
  /**
   * Dispose service (cleanup)
   */
  dispose() {
    this.eventBus.removeAllListeners();
    this.state.reset();
    this.logger.info('🧹 Service disposed');
  }
}

// ═══════════════════════════════════════════════════════════
// 📦 SUPPORTING CLASSES
// ═══════════════════════════════════════════════════════════

/**
 * State Management
 */
class LendingPadState {
  constructor() {
    this.state = {
      initialized: false,
      detecting: false,
      downloading: false,
      extracting: false,
      autoFilling: false,
      documents: [],
      errors: [],
      lastUpdate: null
    };
  }
  
  setInitialized(value) {
    this.state.initialized = value;
    this.state.lastUpdate = new Date();
  }
  
  setDetecting(value) {
    this.state.detecting = value;
    this.state.lastUpdate = new Date();
  }
  
  setDocuments(documents) {
    this.state.documents = documents;
    this.state.lastUpdate = new Date();
  }
  
  getDocuments() {
    return this.state.documents;
  }
  
  setError(error) {
    this.state.errors.push({
      message: error.message || error,
      timestamp: new Date()
    });
  }
  
  getState() {
    return { ...this.state };
  }
  
  isInitialized() {
    return this.state.initialized;
  }
  
  reset() {
    this.state = {
      initialized: false,
      detecting: false,
      downloading: false,
      extracting: false,
      autoFilling: false,
      documents: [],
      errors: [],
      lastUpdate: null
    };
  }
}

/**
 * Event Bus
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }
  
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
  
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
  
  removeAllListeners() {
    this.listeners.clear();
  }
}

/**
 * Service Logger
 */
class ServiceLogger {
  constructor(name, enabled = true) {
    this.name = name;
    this.enabled = enabled;
    this.prefix = `[${name}]`;
  }
  
  info(...args) {
    if (this.enabled) console.log(this.prefix, '📘', ...args);
  }
  
  success(...args) {
    if (this.enabled) console.log(this.prefix, '✅', ...args);
  }
  
  warn(...args) {
    if (this.enabled) console.warn(this.prefix, '⚠️', ...args);
  }
  
  error(...args) {
    if (this.enabled) console.error(this.prefix, '❌', ...args);
  }
  
  group(label) {
    if (this.enabled) console.group(this.prefix, label);
  }
  
  groupEnd() {
    if (this.enabled) console.groupEnd();
  }
}

/**
 * Service Metrics
 */
class ServiceMetrics {
  constructor() {
    this.metrics = {
      detection: { attempts: 0, successes: 0, failures: 0 },
      download: { attempts: 0, successes: 0, failures: 0 },
      extraction: { attempts: 0, successes: 0, failures: 0 },
      autofill: { attempts: 0, successes: 0, failures: 0 }
    };
  }
  
  incrementAttempts(operation) {
    if (this.metrics[operation]) {
      this.metrics[operation].attempts++;
    }
  }
  
  recordSuccess(operation) {
    if (this.metrics[operation]) {
      this.metrics[operation].successes++;
    }
  }
  
  recordFailure(operation, error) {
    if (this.metrics[operation]) {
      this.metrics[operation].failures++;
    }
  }
  
  getReport() {
    const report = {};
    
    Object.entries(this.metrics).forEach(([operation, stats]) => {
      const successRate = stats.attempts > 0 
        ? (stats.successes / stats.attempts * 100).toFixed(2) + '%'
        : '0%';
      
      report[operation] = {
        ...stats,
        successRate
      };
    });
    
    return report;
  }
  
  reset() {
    Object.keys(this.metrics).forEach(operation => {
      this.metrics[operation] = { attempts: 0, successes: 0, failures: 0 };
    });
  }
}

// ═══════════════════════════════════════════════════════════
// 🌐 EXPORT
// ═══════════════════════════════════════════════════════════

// Export singleton instance
const lendingPadService = new LendingPadService({
  debugMode: false,
  enableLogging: true,
  maxRetries: 3,
  maxConcurrentDownloads: 3,
  validatePDF: true
});

// Make available globally for easy access
if (typeof window !== 'undefined') {
  window.LendingPadService = lendingPadService;
}
