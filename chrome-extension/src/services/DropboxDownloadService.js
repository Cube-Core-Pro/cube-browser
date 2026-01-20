/**
 * DropboxDownloadService - Enterprise-Grade PDF Download Manager
 * 
 * Architecture:
 * - Service Layer Pattern
 * - Strategy Pattern for download methods
 * - Factory Pattern for URL generation
 * - Observer Pattern for progress tracking
 * - Chain of Responsibility for error handling
 * 
 * @version 4.0.0-enterprise
 * @license MIT
 */

class DropboxDownloadService {
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 15000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      validatePDF: config.validatePDF !== false,
      enableLogging: config.enableLogging !== false,
      ...config
    };
    
    this.strategies = this.initializeStrategies();
    this.urlFactory = new DropboxURLFactory();
    this.validator = new PDFValidator();
    this.logger = new DownloadLogger(this.config.enableLogging);
    this.metrics = new DownloadMetrics();
    
    this.logger.info('DropboxDownloadService initialized', this.config);
  }
  
  /**
   * Main download method - orchestrates the entire download process
   * @param {Object} pdf - PDF metadata {url, filename, size}
   * @returns {Promise<DownloadResult>}
   */
  async download(pdf) {
    const downloadId = this.generateDownloadId();
    this.logger.group(`Download ${downloadId}: ${pdf.filename}`);
    
    try {
      // Validate input
      this.validateInput(pdf);
      
      // Generate URL variations
      const urls = this.urlFactory.generateURLs(pdf.url);
      this.logger.info(`Generated ${urls.length} URL variations`);
      
      // Try each strategy with each URL
      for (const strategy of this.strategies) {
        for (const urlVariation of urls) {
          try {
            const result = await this.attemptDownload(
              strategy,
              urlVariation,
              pdf,
              downloadId
            );
            
            if (result.success) {
              this.metrics.recordSuccess(strategy.name, urlVariation.type);
              this.logger.success(`Downloaded via ${strategy.name}`);
              this.logger.groupEnd();
              return result;
            }
          } catch (error) {
            this.logger.warn(`${strategy.name} failed:`, error.message);
            continue;
          }
        }
      }
      
      // All strategies failed
      throw new DownloadError('All download strategies exhausted', 'EXHAUSTED');
      
    } catch (error) {
      this.metrics.recordFailure(error);
      this.logger.error('Download failed:', error);
      this.logger.groupEnd();
      throw error;
    }
  }
  
  /**
   * Attempt download with specific strategy and URL
   */
  async attemptDownload(strategy, urlVariation, pdf, downloadId) {
    const startTime = Date.now();
    
    this.logger.info(`Trying ${strategy.name} with ${urlVariation.type}`);
    
    // Execute strategy
    const blob = await strategy.execute(urlVariation.url, {
      timeout: this.config.timeout,
      headers: this.buildHeaders(urlVariation)
    });
    
    // Validate blob
    if (this.config.validatePDF) {
      const isValid = await this.validator.validate(blob);
      if (!isValid) {
        throw new ValidationError('Invalid PDF content', 'INVALID_PDF');
      }
    }
    
    // Trigger download
    await this.triggerBrowserDownload(blob, pdf.filename);
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      strategy: strategy.name,
      urlType: urlVariation.type,
      size: blob.size,
      duration,
      downloadId
    };
  }
  
  /**
   * Initialize download strategies
   */
  initializeStrategies() {
    return [
      new FetchStrategy(),
      new XHRStrategy(),
      new ChromeDownloadStrategy(),
      new IframeStrategy(),
      new ServiceWorkerStrategy()
    ];
  }
  
  /**
   * Build HTTP headers for request
   */
  buildHeaders(urlVariation) {
    const headers = {
      'Accept': 'application/pdf,*/*',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    if (urlVariation.requiresAuth) {
      headers['Authorization'] = 'Bearer ' + this.getAuthToken();
    }
    
    return headers;
  }
  
  /**
   * Trigger browser download
   */
  async triggerBrowserDownload(blob, filename) {
    return new Promise((resolve, reject) => {
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          resolve();
        }, 100);
      } catch (error) {
        reject(new DownloadError('Failed to trigger download', 'TRIGGER_FAILED'));
      }
    });
  }
  
  /**
   * Validate input parameters
   */
  validateInput(pdf) {
    if (!pdf || typeof pdf !== 'object') {
      throw new ValidationError('Invalid PDF object', 'INVALID_INPUT');
    }
    if (!pdf.url || typeof pdf.url !== 'string') {
      throw new ValidationError('Invalid URL', 'INVALID_URL');
    }
    if (!pdf.filename || typeof pdf.filename !== 'string') {
      throw new ValidationError('Invalid filename', 'INVALID_FILENAME');
    }
  }
  
  /**
   * Generate unique download ID
   */
  generateDownloadId() {
    return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get metrics report
   */
  getMetrics() {
    return this.metrics.getReport();
  }
  
  /**
   * Get authentication token from storage
   * Supports Chrome extension storage and localStorage fallback
   * @returns {Promise<string|null>} OAuth token or null
   */
  async getAuthToken() {
    try {
      // Try Chrome extension storage first
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
          chrome.storage.local.get(['dropbox_auth_token', 'dropbox_token_expiry'], (result) => {
            if (chrome.runtime.lastError) {
              this.logger.warn('Chrome storage error:', chrome.runtime.lastError);
              resolve(null);
              return;
            }
            
            // Check if token exists and is not expired
            if (result.dropbox_auth_token) {
              const expiry = result.dropbox_token_expiry || 0;
              if (Date.now() < expiry) {
                this.logger.info('Retrieved valid OAuth token from storage');
                resolve(result.dropbox_auth_token);
                return;
              } else {
                this.logger.info('OAuth token expired');
              }
            }
            resolve(null);
          });
        });
      }
      
      // Fallback to localStorage for web context
      const token = localStorage.getItem('dropbox_auth_token');
      const expiry = parseInt(localStorage.getItem('dropbox_token_expiry') || '0', 10);
      
      if (token && Date.now() < expiry) {
        this.logger.info('Retrieved valid OAuth token from localStorage');
        return token;
      }
      
      return null;
    } catch (error) {
      this.logger.warn('Failed to retrieve OAuth token:', error.message);
      return null;
    }
  }
  
  /**
   * Store authentication token
   * @param {string} token - OAuth access token
   * @param {number} expiresIn - Token lifetime in seconds
   * @returns {Promise<boolean>} Success status
   */
  async setAuthToken(token, expiresIn = 14400) {
    const expiry = Date.now() + (expiresIn * 1000);
    
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
          chrome.storage.local.set({
            dropbox_auth_token: token,
            dropbox_token_expiry: expiry
          }, () => {
            if (chrome.runtime.lastError) {
              this.logger.warn('Failed to store token:', chrome.runtime.lastError);
              resolve(false);
            } else {
              this.logger.info('OAuth token stored successfully');
              resolve(true);
            }
          });
        });
      }
      
      // Fallback to localStorage
      localStorage.setItem('dropbox_auth_token', token);
      localStorage.setItem('dropbox_token_expiry', expiry.toString());
      this.logger.info('OAuth token stored in localStorage');
      return true;
    } catch (error) {
      this.logger.warn('Failed to store OAuth token:', error.message);
      return false;
    }
  }
  
  /**
   * Clear authentication token
   * @returns {Promise<boolean>} Success status
   */
  async clearAuthToken() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
          chrome.storage.local.remove(['dropbox_auth_token', 'dropbox_token_expiry'], () => {
            resolve(!chrome.runtime.lastError);
          });
        });
      }
      
      localStorage.removeItem('dropbox_auth_token');
      localStorage.removeItem('dropbox_token_expiry');
      return true;
    } catch (error) {
      this.logger.warn('Failed to clear OAuth token:', error.message);
      return false;
    }
  }
  
  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    const token = await this.getAuthToken();
    return token !== null;
  }
}

/**
 * Strategy: Fetch API
 */
class FetchStrategy {
  constructor() {
    this.name = 'FetchAPI';
  }
  
  async execute(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: options.headers,
        credentials: 'include',
        signal: controller.signal,
        cache: 'no-cache',
        redirect: 'follow'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      return blob;
      
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Strategy: XMLHttpRequest
 */
class XHRStrategy {
  constructor() {
    this.name = 'XMLHttpRequest';
  }
  
  async execute(url, options) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'blob';
      xhr.timeout = options.timeout;
      xhr.withCredentials = true;
      
      // Set headers
      Object.entries(options.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(xhr.response);
        } else {
          reject(new Error(`HTTP ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.ontimeout = () => reject(new Error('Timeout'));
      
      xhr.send();
    });
  }
}

/**
 * Strategy: Chrome Downloads API
 */
class ChromeDownloadStrategy {
  constructor() {
    this.name = 'ChromeAPI';
  }
  
  async execute(url, options) {
    // First fetch the blob
    const response = await fetch(url, {
      method: 'GET',
      headers: options.headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.blob();
  }
}

/**
 * Strategy: Hidden Iframe
 */
class IframeStrategy {
  constructor() {
    this.name = 'Iframe';
  }
  
  async execute(url, options) {
    // This strategy doesn't return a blob, it triggers direct download
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          document.body.removeChild(iframe);
          reject(new Error('Iframe timeout'));
        }
      }, options.timeout);
      
      iframe.onload = () => {
        resolved = true;
        clearTimeout(timeout);
        // Can't get blob from iframe, so we'll fetch it
        fetch(url).then(r => r.blob()).then(resolve).catch(reject);
        document.body.removeChild(iframe);
      };
      
      iframe.onerror = () => {
        resolved = true;
        clearTimeout(timeout);
        document.body.removeChild(iframe);
        reject(new Error('Iframe error'));
      };
      
      document.body.appendChild(iframe);
    });
  }
}

/**
 * Strategy: Service Worker Proxy
 */
class ServiceWorkerStrategy {
  constructor() {
    this.name = 'ServiceWorker';
  }
  
  async execute(url, options) {
    // Send message to service worker
    const response = await chrome.runtime.sendMessage({
      type: 'proxy-download',
      url,
      options
    });
    
    if (!response || !response.success) {
      throw new Error('Service worker download failed');
    }
    
    // Convert base64 back to blob
    const byteCharacters = atob(response.data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'application/pdf' });
  }
}

/**
 * Dropbox URL Factory - generates all possible URL variations
 */
class DropboxURLFactory {
  generateURLs(originalUrl) {
    const variations = [];
    const parsed = new URL(originalUrl);
    
    // Variation 1: raw=1
    const raw1 = new URL(originalUrl);
    raw1.searchParams.delete('dl');
    raw1.searchParams.set('raw', '1');
    variations.push({ url: raw1.toString(), type: 'raw=1', priority: 1 });
    
    // Variation 2: dl=1
    const dl1 = new URL(originalUrl);
    dl1.searchParams.delete('raw');
    dl1.searchParams.set('dl', '1');
    variations.push({ url: dl1.toString(), type: 'dl=1', priority: 2 });
    
    // Variation 3: raw=1&dl=1
    const rawdl = new URL(originalUrl);
    rawdl.searchParams.set('raw', '1');
    rawdl.searchParams.set('dl', '1');
    variations.push({ url: rawdl.toString(), type: 'raw=1&dl=1', priority: 3 });
    
    // Variation 4: dl.dropboxusercontent.com
    if (parsed.hostname === 'www.dropbox.com') {
      const directUrl = originalUrl.replace(
        'www.dropbox.com',
        'dl.dropboxusercontent.com'
      );
      variations.push({ url: directUrl, type: 'direct-domain', priority: 4 });
    }
    
    // Variation 5: No params
    const noParams = `${parsed.origin}${parsed.pathname}`;
    variations.push({ url: noParams, type: 'no-params', priority: 5 });
    
    // Variation 6: API endpoint (if we have file ID)
    const fileIdMatch = originalUrl.match(/\/s\/([^\/]+)/);
    if (fileIdMatch) {
      const apiUrl = `https://content.dropboxapi.com/2/files/download`;
      variations.push({ 
        url: apiUrl, 
        type: 'api-endpoint', 
        priority: 6,
        requiresAuth: true 
      });
    }
    
    // Sort by priority
    return variations.sort((a, b) => a.priority - b.priority);
  }
}

/**
 * PDF Validator - validates PDF content
 */
class PDFValidator {
  async validate(blob) {
    if (!blob || blob.size === 0) {
      return false;
    }
    
    // Check size (HTML pages are usually small)
    if (blob.size < 1024) {
      return false; // Less than 1KB, probably HTML
    }
    
    // Check magic number
    try {
      const hasMagicNumber = await this.checkMagicNumber(blob);
      if (!hasMagicNumber) {
        return false;
      }
    } catch (error) {
      // If we can't check, assume it's valid (permissive)
      return true;
    }
    
    return true;
  }
  
  async checkMagicNumber(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target.result);
        const header = String.fromCharCode(...arr.slice(0, 5));
        resolve(header === '%PDF-');
      };
      reader.onerror = () => resolve(true); // Permissive on error
      reader.readAsArrayBuffer(blob.slice(0, 5));
    });
  }
}

/**
 * Download Logger - enterprise logging
 */
class DownloadLogger {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.prefix = '[DropboxService]';
  }
  
  info(...args) {
    if (this.enabled) {
      console.log(this.prefix, '📘', ...args);
    }
  }
  
  success(...args) {
    if (this.enabled) {
      console.log(this.prefix, '✅', ...args);
    }
  }
  
  warn(...args) {
    if (this.enabled) {
      console.warn(this.prefix, '⚠️', ...args);
    }
  }
  
  error(...args) {
    if (this.enabled) {
      console.error(this.prefix, '❌', ...args);
    }
  }
  
  group(label) {
    if (this.enabled) {
      console.group(this.prefix, label);
    }
  }
  
  groupEnd() {
    if (this.enabled) {
      console.groupEnd();
    }
  }
}

/**
 * Download Metrics - track success rates
 */
class DownloadMetrics {
  constructor() {
    this.attempts = 0;
    this.successes = 0;
    this.failures = 0;
    this.strategyStats = new Map();
  }
  
  recordSuccess(strategy, urlType) {
    this.attempts++;
    this.successes++;
    
    if (!this.strategyStats.has(strategy)) {
      this.strategyStats.set(strategy, { successes: 0, failures: 0 });
    }
    this.strategyStats.get(strategy).successes++;
  }
  
  recordFailure(error) {
    this.attempts++;
    this.failures++;
  }
  
  getReport() {
    return {
      attempts: this.attempts,
      successes: this.successes,
      failures: this.failures,
      successRate: this.attempts > 0 ? (this.successes / this.attempts * 100).toFixed(2) + '%' : '0%',
      strategies: Object.fromEntries(this.strategyStats)
    };
  }
}

/**
 * Custom Errors
 */
class DownloadError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'DownloadError';
    this.code = code;
  }
}

class ValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

// Export singleton instance
const dropboxDownloadService = new DropboxDownloadService({
  enableLogging: true,
  validatePDF: true,
  timeout: 15000,
  maxRetries: 3
});
