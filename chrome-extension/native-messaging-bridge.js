/**
 * CUBE Nexum Native Messaging Bridge - Chrome Extension Side
 * Provides bidirectional communication between Chrome Extension and Tauri app
 * 
 * @version 2.0.0
 * @author CUBE Nexum Team
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const NATIVE_HOST_NAME = 'com.cube.elite.native';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const MESSAGE_TIMEOUT_MS = 30000;

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

let nativePort = null;
let isConnected = false;
let reconnectAttempts = 0;
let pendingMessages = new Map();
let messageIdCounter = 0;
let connectionListeners = [];

// ═══════════════════════════════════════════════════════════════════════════════
// CONNECTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Connect to the native messaging host (Tauri app)
 * @returns {Promise<boolean>} Connection success
 */
async function connectToNativeHost() {
  if (isConnected && nativePort) {
    console.log('[NativeMessaging] Already connected');
    return true;
  }

  return new Promise((resolve) => {
    try {
      console.log('[NativeMessaging] Connecting to native host:', NATIVE_HOST_NAME);
      
      nativePort = chrome.runtime.connectNative(NATIVE_HOST_NAME);
      
      nativePort.onMessage.addListener(handleNativeMessage);
      nativePort.onDisconnect.addListener(handleDisconnect);
      
      // Send initial ping to verify connection
      const pingResult = sendPing();
      
      pingResult.then((response) => {
        if (response && response.pong) {
          isConnected = true;
          reconnectAttempts = 0;
          console.log('[NativeMessaging] Connected successfully');
          notifyConnectionListeners(true);
          resolve(true);
        } else {
          handleConnectionFailure();
          resolve(false);
        }
      }).catch(() => {
        handleConnectionFailure();
        resolve(false);
      });
      
    } catch (error) {
      console.error('[NativeMessaging] Connection error:', error);
      handleConnectionFailure();
      resolve(false);
    }
  });
}

/**
 * Disconnect from native host
 */
function disconnectFromNativeHost() {
  if (nativePort) {
    nativePort.disconnect();
    nativePort = null;
  }
  isConnected = false;
  pendingMessages.clear();
  notifyConnectionListeners(false);
  console.log('[NativeMessaging] Disconnected');
}

/**
 * Handle native port disconnect
 * @param {chrome.runtime.Port} port - Disconnected port
 */
function handleDisconnect(port) {
  const error = chrome.runtime.lastError;
  console.warn('[NativeMessaging] Disconnected:', error?.message || 'Unknown reason');
  
  isConnected = false;
  nativePort = null;
  
  // Reject all pending messages
  pendingMessages.forEach((pending) => {
    pending.reject(new Error('Connection lost'));
  });
  pendingMessages.clear();
  
  notifyConnectionListeners(false);
  
  // Attempt reconnection
  scheduleReconnect();
}

/**
 * Handle connection failure
 */
function handleConnectionFailure() {
  isConnected = false;
  if (nativePort) {
    nativePort.disconnect();
    nativePort = null;
  }
  notifyConnectionListeners(false);
  scheduleReconnect();
}

/**
 * Schedule a reconnection attempt
 */
function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.warn('[NativeMessaging] Max reconnection attempts reached. Native messaging with Tauri app is unavailable.');
    console.info('[NativeMessaging] The extension will continue to work in standalone mode. Some features that require the Tauri app may be limited.');
    // Don't throw error, just notify listeners that connection is unavailable
    notifyConnectionListeners(false);
    return;
  }
  
  reconnectAttempts++;
  const delay = RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttempts - 1);
  
  console.log(`[NativeMessaging] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
  
  setTimeout(() => {
    connectToNativeHost();
  }, delay);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Handle incoming native message
 * @param {Object} message - Native message
 */
function handleNativeMessage(message) {
  console.log('[NativeMessaging] Received:', message);
  
  // Check if this is a response to a pending request
  if (message.id && pendingMessages.has(message.id)) {
    const pending = pendingMessages.get(message.id);
    pendingMessages.delete(message.id);
    clearTimeout(pending.timeout);
    
    if (message.success) {
      pending.resolve(message.data);
    } else {
      pending.reject(new Error(message.error || 'Unknown error'));
    }
    return;
  }
  
  // Handle push messages from Tauri
  handlePushMessage(message);
}

/**
 * Handle push messages from Tauri (not response to request)
 * @param {Object} message - Push message
 */
function handlePushMessage(message) {
  switch (message.message_type) {
    case 'autofill_data':
      // Tauri sent autofill data to fill in current page
      performAutofill(message.data);
      break;
      
    case 'dom_command':
      // Tauri wants to execute DOM command
      executeDomCommand(message.data);
      break;
      
    case 'notification':
      // Show notification
      showNotification(message.data);
      break;
      
    case 'state_update':
      // State update from Tauri
      handleStateUpdate(message.data);
      break;
      
    default:
      console.warn('[NativeMessaging] Unknown message type:', message.message_type);
  }
}

/**
 * Send a message to native host
 * @param {string} command - Command name
 * @param {Object} data - Command data
 * @returns {Promise<Object>} Response data
 */
function sendMessage(command, data = {}) {
  return new Promise((resolve, reject) => {
    if (!isConnected || !nativePort) {
      reject(new Error('Not connected to native host'));
      return;
    }
    
    const id = `msg_${++messageIdCounter}_${Date.now()}`;
    const message = {
      message_type: 'request',
      command,
      data,
      id
    };
    
    // Set timeout for response
    const timeout = setTimeout(() => {
      if (pendingMessages.has(id)) {
        pendingMessages.delete(id);
        reject(new Error(`Message timeout: ${command}`));
      }
    }, MESSAGE_TIMEOUT_MS);
    
    // Store pending message
    pendingMessages.set(id, { resolve, reject, timeout });
    
    try {
      nativePort.postMessage(message);
      console.log('[NativeMessaging] Sent:', message);
    } catch (error) {
      pendingMessages.delete(id);
      clearTimeout(timeout);
      reject(error);
    }
  });
}

/**
 * Send ping to verify connection
 * @returns {Promise<Object>} Ping response
 */
function sendPing() {
  return sendMessage('ping', { timestamp: Date.now() });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAURI COMMAND WRAPPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Invoke a Tauri command via native messaging
 * @param {string} command - Tauri command name
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Command result
 */
async function invokeTauriCommand(command, args = {}) {
  if (!isConnected) {
    await connectToNativeHost();
  }
  
  return sendMessage('invoke', {
    command,
    args
  });
}

/**
 * LendingPad Commands
 */
const LendingPad = {
  async detectDocuments() {
    return invokeTauriCommand('detect_lendingpad_documents', {});
  },
  
  async startBatchDownload(documentIds, targetDirectory) {
    return invokeTauriCommand('start_batch_download', {
      document_ids: documentIds,
      target_directory: targetDirectory
    });
  },
  
  async getBatchStatus(batchId) {
    return invokeTauriCommand('get_batch_status', { batch_id: batchId });
  },
  
  async extractDocumentData(documentPath) {
    return invokeTauriCommand('extract_document_data', { document_path: documentPath });
  },
  
  async autofillForm(formId, data) {
    return invokeTauriCommand('autofill_form', { form_id: formId, data });
  },
  
  async login(credentials) {
    return invokeTauriCommand('lendingpad_login_credentials', credentials);
  },
  
  async checkSession() {
    return invokeTauriCommand('lendingpad_check_session', {});
  }
};

/**
 * AI Commands
 */
const AI = {
  async analyzePage(pageContent) {
    return invokeTauriCommand('ai_analyze_page', { content: pageContent });
  },
  
  async suggestSelectors(context) {
    return invokeTauriCommand('ai_suggest_selectors', { context });
  },
  
  async improveSelector(selector, htmlContext) {
    return invokeTauriCommand('ai_improve_selector', { selector, html_context: htmlContext });
  },
  
  async generateSchema(sampleData) {
    return invokeTauriCommand('ai_generate_schema', { sample_data: sampleData });
  },
  
  async chat(message, conversationId) {
    return invokeTauriCommand('ai_chat', { message, conversation_id: conversationId });
  }
};

/**
 * Automation Commands
 */
const Automation = {
  async runWorkflow(workflowId) {
    return invokeTauriCommand('run_workflow', { workflow_id: workflowId });
  },
  
  async pauseWorkflow(workflowId) {
    return invokeTauriCommand('pause_workflow', { workflow_id: workflowId });
  },
  
  async resumeWorkflow(workflowId) {
    return invokeTauriCommand('resume_workflow', { workflow_id: workflowId });
  },
  
  async stopWorkflow(workflowId) {
    return invokeTauriCommand('stop_workflow', { workflow_id: workflowId });
  },
  
  async getWorkflowStatus(workflowId) {
    return invokeTauriCommand('get_workflow_status', { workflow_id: workflowId });
  }
};

/**
 * Extractor Commands
 */
const Extractor = {
  async extractData(selectors, options) {
    return invokeTauriCommand('extract_data', { selectors, options });
  },
  
  async extractTable(tableSelector) {
    return invokeTauriCommand('extract_table', { selector: tableSelector });
  },
  
  async extractLinks(baseUrl) {
    return invokeTauriCommand('extract_links', { base_url: baseUrl });
  }
};

/**
 * Storage Commands (sync with Tauri)
 */
const Storage = {
  async get(keys) {
    return invokeTauriCommand('chrome_extension_storage_get', { keys });
  },
  
  async set(items) {
    return invokeTauriCommand('chrome_extension_storage_set', { items });
  },
  
  async clear() {
    return invokeTauriCommand('chrome_extension_storage_clear', {});
  }
};

/**
 * License Management Commands
 * Secure license validation, trial management, and feature access
 */
const License = {
  /**
   * Validate current license status
   * @returns {Promise<Object>} License info with tier, status, trial info
   */
  async validate() {
    return invokeTauriCommand('validate_license', {});
  },
  
  /**
   * Activate a license with license key
   * @param {string} licenseKey - The license key
   * @param {string} userEmail - User's email address
   * @returns {Promise<Object>} Activation result
   */
  async activate(licenseKey, userEmail) {
    return invokeTauriCommand('activate_license', {
      license_key: licenseKey,
      user_email: userEmail
    });
  },
  
  /**
   * Deactivate current license (for device transfer)
   * @returns {Promise<void>}
   */
  async deactivate() {
    return invokeTauriCommand('deactivate_license', {});
  },
  
  /**
   * Get current license status without server validation
   * @returns {Promise<Object>} Current license status
   */
  async getStatus() {
    return invokeTauriCommand('get_license_status', {});
  },
  
  /**
   * Get current tier (free/pro/elite)
   * @returns {Promise<string>} Current tier
   */
  async getTier() {
    return invokeTauriCommand('get_license_tier', {});
  },
  
  /**
   * Get unique device ID
   * @returns {Promise<string>} Device identifier
   */
  async getDeviceId() {
    return invokeTauriCommand('get_device_id', {});
  },
  
  /**
   * Start 30-day Elite trial
   * @returns {Promise<Object>} Trial start result
   */
  async startTrial() {
    return invokeTauriCommand('start_trial', { tier: 'elite' });
  },
  
  /**
   * Get trial status
   * @returns {Promise<Object|null>} Trial info if active
   */
  async getTrialStatus() {
    return invokeTauriCommand('get_trial_status', {});
  },
  
  /**
   * Get comprehensive license info (for display)
   * @returns {Promise<Object>} Full license information
   */
  async getInfo() {
    return invokeTauriCommand('get_license_info', {});
  },
  
  /**
   * Check if trial is currently active
   * @returns {Promise<boolean>}
   */
  async isTrialActive() {
    return invokeTauriCommand('is_trial_active', {});
  },
  
  /**
   * Check if a specific feature is allowed for current tier
   * @param {string} feature - Feature name to check
   * @returns {Promise<Object>} Feature access info
   */
  async checkFeature(feature) {
    return invokeTauriCommand('check_feature_access', { feature });
  },
  
  /**
   * Check multiple features at once
   * @param {string[]} features - Array of feature names
   * @returns {Promise<Object[]>} Array of feature access info
   */
  async checkFeatures(features) {
    return invokeTauriCommand('check_features_access', { features });
  }
};

/**
 * Stripe Payment Commands
 * Handle subscription and payment flows
 */
const Stripe = {
  /**
   * Create checkout session for subscription
   * @param {string} tier - 'pro' or 'elite'
   * @param {string} billingPeriod - 'monthly' or 'yearly'
   * @param {string} userId - User ID
   * @param {string} userEmail - User email
   * @returns {Promise<Object>} Checkout session with URL
   */
  async createCheckout(tier, billingPeriod, userId, userEmail) {
    const baseUrl = chrome.runtime.getURL('');
    return invokeTauriCommand('create_stripe_checkout_session', {
      tier,
      billing_period: billingPeriod,
      user_id: userId,
      user_email: userEmail,
      success_url: `${baseUrl}popup/checkout-success.html`,
      cancel_url: `${baseUrl}popup/popup.html`
    });
  },
  
  /**
   * Get subscription info
   * @param {string} subscriptionId - Stripe subscription ID
   * @returns {Promise<Object>} Subscription details
   */
  async getSubscription(subscriptionId) {
    return invokeTauriCommand('get_stripe_subscription', {
      subscription_id: subscriptionId
    });
  },
  
  /**
   * Cancel subscription at period end
   * @param {string} subscriptionId - Subscription to cancel
   * @returns {Promise<Object>} Updated subscription
   */
  async cancelSubscription(subscriptionId) {
    return invokeTauriCommand('cancel_stripe_subscription', {
      subscription_id: subscriptionId
    });
  },
  
  /**
   * Resume a canceled subscription
   * @param {string} subscriptionId - Subscription to resume
   * @returns {Promise<Object>} Updated subscription
   */
  async resumeSubscription(subscriptionId) {
    return invokeTauriCommand('resume_stripe_subscription', {
      subscription_id: subscriptionId
    });
  },
  
  /**
   * Get customer portal URL for billing management
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<string>} Portal URL
   */
  async getPortalUrl(customerId) {
    const returnUrl = chrome.runtime.getURL('popup/popup.html');
    return invokeTauriCommand('create_stripe_portal_session', {
      customer_id: customerId,
      return_url: returnUrl
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOM OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Perform autofill on current page
 * @param {Object} data - Autofill data
 */
async function performAutofill(data) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    console.error('[NativeMessaging] No active tab for autofill');
    return;
  }
  
  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'autofillForm',
      data
    });
    console.log('[NativeMessaging] Autofill completed');
  } catch (error) {
    console.error('[NativeMessaging] Autofill error:', error);
  }
}

/**
 * Execute DOM command from Tauri
 * @param {Object} command - DOM command
 */
async function executeDomCommand(command) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    console.error('[NativeMessaging] No active tab for DOM command');
    return;
  }
  
  try {
    const result = await chrome.tabs.sendMessage(tab.id, {
      action: 'executeDomCommand',
      command
    });
    
    // Send result back to Tauri
    if (command.responseRequired) {
      sendMessage('dom_result', {
        commandId: command.id,
        result
      });
    }
  } catch (error) {
    console.error('[NativeMessaging] DOM command error:', error);
    
    if (command.responseRequired) {
      sendMessage('dom_result', {
        commandId: command.id,
        error: error.message
      });
    }
  }
}

/**
 * Show notification
 * @param {Object} notificationData - Notification data
 */
function showNotification(notificationData) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title: notificationData.title || 'CUBE Nexum',
    message: notificationData.message || '',
    priority: notificationData.priority || 1
  });
}

/**
 * Handle state update from Tauri
 * @param {Object} state - State update
 */
function handleStateUpdate(state) {
  // Store state locally
  chrome.storage.local.set({ tauriState: state });
  
  // Broadcast to all extension pages
  chrome.runtime.sendMessage({
    type: 'STATE_UPDATE',
    state
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONNECTION LISTENERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Add connection status listener
 * @param {Function} listener - Callback function
 */
function addConnectionListener(listener) {
  connectionListeners.push(listener);
}

/**
 * Remove connection status listener
 * @param {Function} listener - Callback function
 */
function removeConnectionListener(listener) {
  const index = connectionListeners.indexOf(listener);
  if (index !== -1) {
    connectionListeners.splice(index, 1);
  }
}

/**
 * Notify all connection listeners
 * @param {boolean} connected - Connection status
 */
function notifyConnectionListeners(connected) {
  connectionListeners.forEach((listener) => {
    try {
      listener(connected);
    } catch (error) {
      console.error('[NativeMessaging] Listener error:', error);
    }
  });
}

/**
 * Get connection status
 * @returns {boolean} Connection status
 */
function getConnectionStatus() {
  return isConnected;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize native messaging bridge
 */
async function initNativeMessaging() {
  console.log('[NativeMessaging] Initializing...');
  
  // Try to connect on initialization
  const connected = await connectToNativeHost();
  
  if (connected) {
    console.log('[NativeMessaging] Initialization complete - Connected');
  } else {
    console.warn('[NativeMessaging] Initialization complete - Not connected (will retry)');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT FOR USE IN EXTENSION
// ═══════════════════════════════════════════════════════════════════════════════

// For use in background script
if (typeof globalThis !== 'undefined') {
  globalThis.CUBENativeMessaging = {
    connect: connectToNativeHost,
    disconnect: disconnectFromNativeHost,
    isConnected: getConnectionStatus,
    addConnectionListener,
    removeConnectionListener,
    
    // Command APIs
    invoke: invokeTauriCommand,
    LendingPad,
    AI,
    Automation,
    Extractor,
    Storage,
    License,  // License management
    Stripe,   // Payment processing
    
    // Low-level
    sendMessage,
    sendPing
  };
}

// Auto-initialize when loaded
initNativeMessaging();

console.log('[NativeMessaging] CUBE Nexum Native Messaging Bridge loaded');
