// ═══════════════════════════════════════════════════════════════════════════════
// 📊 ANALYTICS SERVICE MODULE v7.1.0 - Usage Tracking & Metrics Collection
// ═══════════════════════════════════════════════════════════════════════════════
//
// ROLE: Analytics and telemetry for Chrome Extension
//
// RESPONSIBILITIES:
// ✅ Event Tracking
// ✅ Feature Usage Metrics
// ✅ Performance Monitoring
// ✅ Error Tracking
// ✅ Session Analytics
// ✅ Conversion Tracking
// ✅ A/B Testing Support
// ✅ Data Export
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} AnalyticsEvent
 * @property {string} name
 * @property {string} category
 * @property {Object} properties
 * @property {number} timestamp
 * @property {string} sessionId
 */

/**
 * @typedef {Object} AnalyticsSession
 * @property {string} id
 * @property {number} startTime
 * @property {number} lastActivity
 * @property {number} eventCount
 * @property {string[]} pagesVisited
 */

/**
 * @typedef {Object} AnalyticsConfig
 * @property {boolean} enabled
 * @property {boolean} anonymize
 * @property {string[]} disabledCategories
 * @property {number} batchSize
 * @property {number} flushInterval
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const EVENT_CATEGORIES = {
  AUTOMATION: 'automation',
  AUTOFILL: 'autofill',
  AI: 'ai',
  SECURITY: 'security',
  NAVIGATION: 'navigation',
  FEATURE: 'feature',
  ERROR: 'error',
  PERFORMANCE: 'performance',
  USER: 'user',
  CONVERSION: 'conversion',
};

const DEFAULT_CONFIG = {
  enabled: true,
  anonymize: true,
  disabledCategories: [],
  batchSize: 50,
  flushInterval: 60000, // 1 minute
};

// ═══════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════

const AnalyticsState = {
  config: { ...DEFAULT_CONFIG },
  session: null,
  eventQueue: [],
  metrics: {
    totalEvents: 0,
    eventsByCategory: {},
    featureUsage: {},
    errorCount: 0,
    sessionsCount: 0,
  },
  experiments: {},
  initialized: false,
  flushTimer: null,
  apiBaseUrl: (typeof CubeConfig !== 'undefined' && CubeConfig.SERVER?.API_BASE) ? `${CubeConfig.SERVER.API_BASE}/analytics` : 'https://api.cubeai.tools/analytics',
};

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize analytics services
 * @returns {Promise<void>}
 */
async function initializeAnalytics() {
  console.log('📊 Initializing Analytics Services...');
  
  try {
    // Load stored config
    const stored = await chrome.storage.local.get([
      'analyticsConfig',
      'analyticsMetrics',
      'analyticsSession',
      'analyticsExperiments',
    ]);
    
    if (stored.analyticsConfig) {
      AnalyticsState.config = {
        ...DEFAULT_CONFIG,
        ...stored.analyticsConfig,
      };
    }
    
    if (stored.analyticsMetrics) {
      AnalyticsState.metrics = stored.analyticsMetrics;
    }
    
    if (stored.analyticsExperiments) {
      AnalyticsState.experiments = stored.analyticsExperiments;
    }
    
    // Start or resume session
    if (stored.analyticsSession && isSessionValid(stored.analyticsSession)) {
      AnalyticsState.session = stored.analyticsSession;
      AnalyticsState.session.lastActivity = Date.now();
    } else {
      await startNewSession();
    }
    
    // Start flush timer
    startFlushTimer();
    
    // Load A/B test assignments
    await loadExperiments();
    
    AnalyticsState.initialized = true;
    console.log('✅ Analytics Services initialized');
    
    // Track initialization
    trackEvent('extension_initialized', EVENT_CATEGORIES.USER, {
      version: chrome.runtime.getManifest().version,
    });
    
  } catch (error) {
    console.error('❌ Analytics initialization failed:', error);
  }
}

/**
 * Check if session is still valid (30 minute inactivity timeout)
 * @param {AnalyticsSession} session
 * @returns {boolean}
 */
function isSessionValid(session) {
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  return (Date.now() - session.lastActivity) < SESSION_TIMEOUT;
}

/**
 * Start a new analytics session
 */
async function startNewSession() {
  const sessionId = generateSessionId();
  
  AnalyticsState.session = {
    id: sessionId,
    startTime: Date.now(),
    lastActivity: Date.now(),
    eventCount: 0,
    pagesVisited: [],
  };
  
  AnalyticsState.metrics.sessionsCount++;
  
  await saveSession();
  
  // Track session start
  trackEvent('session_start', EVENT_CATEGORIES.USER, {
    sessionId,
    totalSessions: AnalyticsState.metrics.sessionsCount,
  });
}

/**
 * Generate unique session ID
 * @returns {string}
 */
function generateSessionId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TRACKING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track an analytics event
 * @param {string} name
 * @param {string} category
 * @param {Object} properties
 */
function trackEvent(name, category = EVENT_CATEGORIES.FEATURE, properties = {}) {
  if (!AnalyticsState.config.enabled) {
    return;
  }
  
  // Check if category is disabled
  if (AnalyticsState.config.disabledCategories.includes(category)) {
    return;
  }
  
  // Update session activity
  if (AnalyticsState.session) {
    AnalyticsState.session.lastActivity = Date.now();
    AnalyticsState.session.eventCount++;
  }
  
  // Create event
  const event = {
    name,
    category,
    properties: AnalyticsState.config.anonymize ? anonymizeProperties(properties) : properties,
    timestamp: Date.now(),
    sessionId: AnalyticsState.session?.id,
    version: chrome.runtime.getManifest().version,
  };
  
  // Add to queue
  AnalyticsState.eventQueue.push(event);
  
  // Update metrics
  AnalyticsState.metrics.totalEvents++;
  AnalyticsState.metrics.eventsByCategory[category] = 
    (AnalyticsState.metrics.eventsByCategory[category] || 0) + 1;
  
  // Auto-flush if batch size reached
  if (AnalyticsState.eventQueue.length >= AnalyticsState.config.batchSize) {
    flushEvents();
  }
  
  // Log in debug mode
  console.debug(`📊 Event: ${name}`, { category, properties });
}

/**
 * Anonymize sensitive properties
 * @param {Object} properties
 * @returns {Object}
 */
function anonymizeProperties(properties) {
  const sensitiveFields = ['email', 'name', 'phone', 'address', 'ip', 'userId'];
  const anonymized = { ...properties };
  
  for (const field of sensitiveFields) {
    if (anonymized[field]) {
      if (field === 'email') {
        // Keep domain for analytics
        const [, domain] = anonymized[field].split('@');
        anonymized[field] = `***@${domain}`;
      } else {
        anonymized[field] = '[REDACTED]';
      }
    }
  }
  
  return anonymized;
}

// ═══════════════════════════════════════════════════════════════════════════
// SPECIFIC EVENT TRACKERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track feature usage
 * @param {string} featureName
 * @param {Object} metadata
 */
function trackFeatureUsage(featureName, metadata = {}) {
  // Update feature usage metrics
  AnalyticsState.metrics.featureUsage[featureName] = 
    (AnalyticsState.metrics.featureUsage[featureName] || 0) + 1;
  
  trackEvent('feature_used', EVENT_CATEGORIES.FEATURE, {
    feature: featureName,
    usageCount: AnalyticsState.metrics.featureUsage[featureName],
    ...metadata,
  });
  
  saveMetrics();
}

/**
 * Track automation execution
 * @param {string} workflowId
 * @param {Object} results
 */
function trackAutomation(workflowId, results) {
  trackEvent('automation_executed', EVENT_CATEGORIES.AUTOMATION, {
    workflowId,
    success: !results.error,
    duration: results.duration,
    stepsExecuted: results.stepsExecuted,
    itemsProcessed: results.itemsProcessed,
    error: results.error?.message,
  });
}

/**
 * Track autofill action
 * @param {Object} data
 */
function trackAutofill(data) {
  trackEvent('autofill_triggered', EVENT_CATEGORIES.AUTOFILL, {
    fieldsFilled: data.fieldsFilled,
    formType: data.formType,
    domain: data.domain,
    success: data.success,
  });
}

/**
 * Track AI usage
 * @param {string} action
 * @param {Object} metadata
 */
function trackAIUsage(action, metadata = {}) {
  trackEvent('ai_used', EVENT_CATEGORIES.AI, {
    action,
    model: metadata.model,
    tokensUsed: metadata.tokensUsed,
    responseTime: metadata.responseTime,
    success: metadata.success,
  });
}

/**
 * Track error
 * @param {Error|string} error
 * @param {Object} context
 */
function trackError(error, context = {}) {
  AnalyticsState.metrics.errorCount++;
  
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  trackEvent('error_occurred', EVENT_CATEGORIES.ERROR, {
    message: errorMessage,
    stack: errorStack,
    context: context.context,
    component: context.component,
    action: context.action,
  });
  
  saveMetrics();
}

/**
 * Track page view
 * @param {string} url
 */
function trackPageView(url) {
  // Anonymize URL
  const anonymizedUrl = AnalyticsState.config.anonymize 
    ? new URL(url).hostname 
    : url;
  
  // Update session pages
  if (AnalyticsState.session) {
    if (!AnalyticsState.session.pagesVisited.includes(anonymizedUrl)) {
      AnalyticsState.session.pagesVisited.push(anonymizedUrl);
    }
  }
  
  trackEvent('page_view', EVENT_CATEGORIES.NAVIGATION, {
    url: anonymizedUrl,
    uniquePages: AnalyticsState.session?.pagesVisited.length,
  });
}

/**
 * Track conversion
 * @param {string} type
 * @param {Object} metadata
 */
function trackConversion(type, metadata = {}) {
  trackEvent('conversion', EVENT_CATEGORIES.CONVERSION, {
    type,
    ...metadata,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE MONITORING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track performance metric
 * @param {string} name
 * @param {number} value
 * @param {string} unit
 */
function trackPerformance(name, value, unit = 'ms') {
  trackEvent('performance', EVENT_CATEGORIES.PERFORMANCE, {
    metric: name,
    value,
    unit,
  });
}

/**
 * Measure and track operation duration
 * @param {string} operationName
 * @param {Function} operation
 * @returns {Promise<any>}
 */
async function measureOperation(operationName, operation) {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    trackPerformance(operationName, duration);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    trackPerformance(`${operationName}_failed`, duration);
    trackError(error, { context: operationName });
    
    throw error;
  }
}

/**
 * Create a performance marker
 * @param {string} name
 * @returns {Function} End marker function
 */
function startMeasure(name) {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    trackPerformance(name, duration);
    return duration;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// A/B TESTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Load A/B test experiments
 */
async function loadExperiments() {
  try {
    const response = await fetch(`${AnalyticsState.apiBaseUrl}/experiments`);
    if (response.ok) {
      const { data } = await response.json();
      
      // Assign variants for new experiments
      for (const experiment of data || []) {
        if (!AnalyticsState.experiments[experiment.id]) {
          AnalyticsState.experiments[experiment.id] = {
            id: experiment.id,
            name: experiment.name,
            variant: assignVariant(experiment),
            assignedAt: Date.now(),
          };
        }
      }
      
      await chrome.storage.local.set({ 
        analyticsExperiments: AnalyticsState.experiments 
      });
    }
  } catch (error) {
    console.debug('Failed to load experiments:', error);
  }
}

/**
 * Assign experiment variant
 * @param {Object} experiment
 * @returns {string}
 */
function assignVariant(experiment) {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const variant of experiment.variants || []) {
    cumulative += variant.weight;
    if (random < cumulative) {
      return variant.id;
    }
  }
  
  return 'control';
}

/**
 * Get experiment variant
 * @param {string} experimentId
 * @returns {string|null}
 */
function getVariant(experimentId) {
  return AnalyticsState.experiments[experimentId]?.variant || null;
}

/**
 * Check if user is in experiment variant
 * @param {string} experimentId
 * @param {string} variant
 * @returns {boolean}
 */
function isInVariant(experimentId, variant) {
  return getVariant(experimentId) === variant;
}

/**
 * Track experiment exposure
 * @param {string} experimentId
 */
function trackExperimentExposure(experimentId) {
  const experiment = AnalyticsState.experiments[experimentId];
  if (experiment) {
    trackEvent('experiment_exposure', EVENT_CATEGORIES.FEATURE, {
      experimentId,
      variant: experiment.variant,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Start flush timer
 */
function startFlushTimer() {
  if (AnalyticsState.flushTimer) {
    clearInterval(AnalyticsState.flushTimer);
  }
  
  AnalyticsState.flushTimer = setInterval(() => {
    flushEvents();
  }, AnalyticsState.config.flushInterval);
}

/**
 * Flush events to server
 */
async function flushEvents() {
  if (AnalyticsState.eventQueue.length === 0) {
    return;
  }
  
  const eventsToFlush = [...AnalyticsState.eventQueue];
  AnalyticsState.eventQueue = [];
  
  try {
    const response = await fetch(`${AnalyticsState.apiBaseUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: eventsToFlush,
        sessionId: AnalyticsState.session?.id,
      }),
    });
    
    if (!response.ok) {
      // Re-queue events on failure
      AnalyticsState.eventQueue.unshift(...eventsToFlush);
    }
  } catch (error) {
    // Re-queue events on network error
    AnalyticsState.eventQueue.unshift(...eventsToFlush);
    console.debug('Failed to flush events:', error);
  }
}

/**
 * Save session to storage
 */
async function saveSession() {
  await chrome.storage.local.set({ 
    analyticsSession: AnalyticsState.session 
  });
}

/**
 * Save metrics to storage
 */
async function saveMetrics() {
  await chrome.storage.local.set({ 
    analyticsMetrics: AnalyticsState.metrics 
  });
}

/**
 * Get current metrics
 * @returns {Object}
 */
function getMetrics() {
  return { ...AnalyticsState.metrics };
}

/**
 * Get session info
 * @returns {Object}
 */
function getSessionInfo() {
  if (!AnalyticsState.session) {
    return null;
  }
  
  return {
    id: AnalyticsState.session.id,
    duration: Date.now() - AnalyticsState.session.startTime,
    eventCount: AnalyticsState.session.eventCount,
    pagesVisited: AnalyticsState.session.pagesVisited.length,
  };
}

/**
 * Export analytics data
 * @returns {Object}
 */
function exportData() {
  return {
    metrics: AnalyticsState.metrics,
    session: getSessionInfo(),
    experiments: AnalyticsState.experiments,
    config: AnalyticsState.config,
    exportedAt: Date.now(),
  };
}

/**
 * Clear analytics data
 */
async function clearData() {
  AnalyticsState.metrics = {
    totalEvents: 0,
    eventsByCategory: {},
    featureUsage: {},
    errorCount: 0,
    sessionsCount: 0,
  };
  
  AnalyticsState.eventQueue = [];
  AnalyticsState.experiments = {};
  
  await chrome.storage.local.remove([
    'analyticsMetrics',
    'analyticsSession',
    'analyticsExperiments',
  ]);
  
  await startNewSession();
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update analytics configuration
 * @param {Partial<AnalyticsConfig>} updates
 */
async function updateConfig(updates) {
  AnalyticsState.config = {
    ...AnalyticsState.config,
    ...updates,
  };
  
  await chrome.storage.local.set({ 
    analyticsConfig: AnalyticsState.config 
  });
  
  // Restart flush timer if interval changed
  if (updates.flushInterval) {
    startFlushTimer();
  }
}

/**
 * Get current configuration
 * @returns {AnalyticsConfig}
 */
function getConfig() {
  return { ...AnalyticsState.config };
}

/**
 * Enable analytics
 */
async function enable() {
  await updateConfig({ enabled: true });
  trackEvent('analytics_enabled', EVENT_CATEGORIES.USER);
}

/**
 * Disable analytics
 */
async function disable() {
  trackEvent('analytics_disabled', EVENT_CATEGORIES.USER);
  await updateConfig({ enabled: false });
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle analytics-related messages
 * @param {Object} message
 * @param {Object} sender
 * @returns {Promise<Object>}
 */
async function handleAnalyticsMessage(message, sender) {
  switch (message.action) {
    case 'ANALYTICS_INIT':
      await initializeAnalytics();
      return { success: true };
      
    case 'TRACK_EVENT':
      trackEvent(message.name, message.category, message.properties);
      return { success: true };
      
    case 'TRACK_FEATURE':
      trackFeatureUsage(message.feature, message.metadata);
      return { success: true };
      
    case 'TRACK_AUTOMATION':
      trackAutomation(message.workflowId, message.results);
      return { success: true };
      
    case 'TRACK_AUTOFILL':
      trackAutofill(message.data);
      return { success: true };
      
    case 'TRACK_AI':
      trackAIUsage(message.aiAction, message.metadata);
      return { success: true };
      
    case 'TRACK_ERROR':
      trackError(message.error, message.context);
      return { success: true };
      
    case 'TRACK_PAGE_VIEW':
      trackPageView(message.url);
      return { success: true };
      
    case 'TRACK_CONVERSION':
      trackConversion(message.type, message.metadata);
      return { success: true };
      
    case 'TRACK_PERFORMANCE':
      trackPerformance(message.name, message.value, message.unit);
      return { success: true };
      
    case 'GET_METRICS':
      return { success: true, metrics: getMetrics() };
      
    case 'GET_SESSION_INFO':
      return { success: true, session: getSessionInfo() };
      
    case 'EXPORT_DATA':
      return { success: true, data: exportData() };
      
    case 'CLEAR_DATA':
      await clearData();
      return { success: true };
      
    case 'GET_ANALYTICS_CONFIG':
      return { success: true, config: getConfig() };
      
    case 'UPDATE_ANALYTICS_CONFIG':
      await updateConfig(message.config);
      return { success: true };
      
    case 'ENABLE_ANALYTICS':
      await enable();
      return { success: true };
      
    case 'DISABLE_ANALYTICS':
      await disable();
      return { success: true };
      
    case 'GET_VARIANT':
      return { success: true, variant: getVariant(message.experimentId) };
      
    case 'IS_IN_VARIANT':
      return { 
        success: true, 
        result: isInVariant(message.experimentId, message.variant) 
      };
      
    case 'TRACK_EXPERIMENT_EXPOSURE':
      trackExperimentExposure(message.experimentId);
      return { success: true };
      
    case 'FLUSH_EVENTS':
      await flushEvents();
      return { success: true };
      
    default:
      return { success: false, error: 'Unknown action' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LIFECYCLE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

// Flush events before unload
globalThis.addEventListener?.('beforeunload', () => {
  flushEvents();
});

// Track extension suspend
chrome.runtime.onSuspend?.addListener(() => {
  trackEvent('extension_suspended', EVENT_CATEGORIES.USER);
  flushEvents();
});

// Track extension startup
chrome.runtime.onStartup?.addListener(() => {
  trackEvent('extension_startup', EVENT_CATEGORIES.USER);
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

// Export for use in background service worker
if (typeof globalThis !== 'undefined') {
  globalThis.AnalyticsService = {
    initialize: initializeAnalytics,
    trackEvent,
    trackFeatureUsage,
    trackAutomation,
    trackAutofill,
    trackAIUsage,
    trackError,
    trackPageView,
    trackConversion,
    trackPerformance,
    measureOperation,
    startMeasure,
    getMetrics,
    getSessionInfo,
    exportData,
    clearData,
    getConfig,
    updateConfig,
    enable,
    disable,
    getVariant,
    isInVariant,
    trackExperimentExposure,
    handleMessage: handleAnalyticsMessage,
    getState: () => AnalyticsState,
    EVENT_CATEGORIES,
  };
}

// Initialize on load
initializeAnalytics();
