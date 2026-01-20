/**
 * CUBE Nexum Analytics Service
 * 
 * Collects anonymous usage analytics for product improvement
 * Respects user privacy settings and GDPR compliance
 * 
 * @version 1.0.0
 */

class AnalyticsService {
  constructor() {
    this.enabled = true;
    this.sessionId = null;
    this.eventQueue = [];
    this.flushInterval = 30000; // 30 seconds
    this.maxQueueSize = 50;
    this.initialized = false;
  }

  /**
   * Initialize analytics service
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Check privacy settings
      const settings = await this.getPrivacySettings();
      this.enabled = settings.analyticsEnabled !== false;
      
      if (!this.enabled) {
        console.log('[Analytics] Disabled by user preference');
        return;
      }
      
      // Generate session ID
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Start flush interval
      this.startFlushInterval();
      
      // Track session start
      this.track('session_start', {
        referrer: document.referrer,
        url: location.href,
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('[Analytics] Initialize error:', error);
    }
  }

  /**
   * Track an event
   */
  track(eventType, eventData = {}) {
    if (!this.enabled) return;
    
    const event = {
      eventType,
      eventData: this.sanitizeData(eventData),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      platform: this.getPlatform(),
      version: this.getVersion(),
    };
    
    this.eventQueue.push(event);
    
    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  pageView(pageName, properties = {}) {
    this.track('page_view', {
      page: pageName,
      url: location.href,
      ...properties,
    });
  }

  /**
   * Track feature usage
   */
  feature(featureName, properties = {}) {
    this.track('feature_used', {
      feature: featureName,
      ...properties,
    });
  }

  /**
   * Track error
   */
  error(errorType, errorMessage, properties = {}) {
    this.track('error', {
      errorType,
      errorMessage: this.truncate(errorMessage, 500),
      ...properties,
    });
  }

  /**
   * Track timing
   */
  timing(category, variable, duration, properties = {}) {
    this.track('timing', {
      category,
      variable,
      duration,
      ...properties,
    });
  }

  /**
   * Flush event queue to server
   */
  async flush() {
    if (!this.enabled || this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      if (window.CubeConnectionManager) {
        await window.CubeConnectionManager.request('/analytics/events', {
          method: 'POST',
          body: JSON.stringify({ events }),
        });
      }
    } catch (error) {
      // Re-queue events on failure (up to limit)
      if (this.eventQueue.length + events.length <= this.maxQueueSize * 2) {
        this.eventQueue.push(...events);
      }
      console.error('[Analytics] Flush error:', error);
    }
  }

  /**
   * Start periodic flush
   */
  startFlushInterval() {
    if (this.flushTimer) return;
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop periodic flush
   */
  stopFlushInterval() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Sanitize data to remove PII
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = {};
    const piiPatterns = [
      /email/i,
      /password/i,
      /credit.?card/i,
      /ssn/i,
      /social.?security/i,
      /phone/i,
      /address/i,
      /name/i,
      /birth/i,
    ];
    
    for (const [key, value] of Object.entries(data)) {
      // Skip PII fields
      if (piiPatterns.some(pattern => pattern.test(key))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      
      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Truncate string to max length
   */
  truncate(str, maxLength) {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  }

  /**
   * Get platform info
   */
  getPlatform() {
    return {
      type: 'extension',
      browser: navigator.userAgent.includes('Chrome') ? 'chrome' : 'unknown',
      os: navigator.platform,
      language: navigator.language,
    };
  }

  /**
   * Get extension version
   */
  getVersion() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
        return chrome.runtime.getManifest().version;
      }
    } catch (error) {
      // Extension context may not be available (e.g., during tests)
      console.debug('Unable to get extension version:', error?.message || 'Context unavailable');
    }
    return 'unknown';
  }

  /**
   * Get privacy settings
   */
  async getPrivacySettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get('cube_privacy_settings');
        return result.cube_privacy_settings || {};
      }
    } catch (error) {
      // Storage may not be available in all contexts
      console.debug('Unable to get privacy settings:', error?.message || 'Storage unavailable');
    }
    return {};
  }

  /**
   * Enable/disable analytics
   */
  async setEnabled(enabled) {
    this.enabled = enabled;
    
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          'cube_privacy_settings': { analyticsEnabled: enabled },
        });
      }
    } catch (error) {
      console.error('[Analytics] Save settings error:', error);
    }
    
    if (enabled && !this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Clean up on page unload
   */
  destroy() {
    this.track('session_end', {
      duration: Date.now() - parseInt(this.sessionId?.split('_')[1] || '0'),
    });
    this.flush();
    this.stopFlushInterval();
  }
}

// Export as singleton
window.CubeAnalytics = new AnalyticsService();

// Initialize on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.CubeAnalytics.initialize();
  });
  
  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    window.CubeAnalytics.destroy();
  });
}
