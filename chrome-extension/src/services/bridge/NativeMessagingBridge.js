/**
 * 🔗 CUBE Nexum v7.0 - Native Messaging Bridge
 * 
 * Provides communication between Chrome Extension and Tauri Desktop App.
 * Uses Chrome's native messaging API for secure, high-performance IPC.
 * 
 * Features:
 * - Automatic Tauri detection and connection
 * - Reconnection with exponential backoff
 * - Message queueing when disconnected
 * - Promise-based API with timeouts
 * - Standalone mode fallback (server API)
 * 
 * @version 2.0.0
 * @license CUBE Nexum Enterprise
 */

class NativeMessagingBridge {
  constructor() {
    // Configuration
    this.NATIVE_HOST = 'com.cube.elite.native';
    this.MESSAGE_TIMEOUT = 30000; // 30 seconds
    this.MAX_RECONNECT_ATTEMPTS = 5;
    this.RECONNECT_DELAY = 3000;
    this.RECONNECT_BACKOFF = 1.5;

    // State
    this.port = null;
    this.isConnected = false;
    this.isTauriAvailable = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    
    // Message handling
    this.pendingRequests = new Map();
    this.messageQueue = [];
    this.messageId = 0;
    
    // Event handlers
    this.onConnectionChange = null;
    this.onMessage = null;

    console.log('🔗 NativeMessagingBridge v2.0.0 initialized');
    this.initialize();
  }

  /**
   * Initialize and attempt connection to Tauri
   */
  async initialize() {
    try {
      // Check if we're in a Chrome extension context
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        console.warn('⚠️ Not in Chrome extension context');
        this.isTauriAvailable = false;
        return;
      }

      // Attempt connection to Tauri
      await this.connect();
    } catch (error) {
      console.warn('⚠️ NativeMessaging initialization failed:', error);
      this.isTauriAvailable = false;
    }
  }

  /**
   * Connect to Tauri native messaging host
   */
  async connect() {
    return new Promise((resolve) => {
      try {
        // Create native messaging port
        this.port = chrome.runtime.connectNative(this.NATIVE_HOST);

        // Handle incoming messages
        this.port.onMessage.addListener((message) => {
          this.handleMessage(message);
        });

        // Handle disconnection
        this.port.onDisconnect.addListener(() => {
          this.handleDisconnect();
        });

        // Test connection with ping
        this.ping()
          .then(() => {
            this.isConnected = true;
            this.isTauriAvailable = true;
            this.reconnectAttempts = 0;
            console.log('✓ Connected to Tauri via native messaging');
            this.notifyConnectionChange(true);
            this.flushQueue();
            resolve(true);
          })
          .catch((error) => {
            console.warn('⚠️ Ping failed:', error);
            this.isConnected = false;
            resolve(false);
          });

      } catch (error) {
        console.error('❌ Native messaging connection failed:', error);
        this.isConnected = false;
        this.isTauriAvailable = false;
        resolve(false);
      }
    });
  }

  /**
   * Handle incoming message from Tauri
   */
  handleMessage(message) {
    console.debug('📨 Received from Tauri:', message);

    // Check if this is a response to a pending request
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject, timer } = this.pendingRequests.get(message.id);
      clearTimeout(timer);
      this.pendingRequests.delete(message.id);

      if (message.success) {
        resolve(message.data);
      } else {
        reject(new Error(message.error || 'Unknown error'));
      }
      return;
    }

    // Otherwise, it's a push notification from Tauri
    if (this.onMessage) {
      this.onMessage(message);
    }
  }

  /**
   * Handle disconnection from Tauri
   */
  handleDisconnect() {
    const error = chrome.runtime.lastError;
    console.warn('🔌 Disconnected from Tauri:', error?.message || 'Unknown reason');
    
    this.port = null;
    this.isConnected = false;
    this.notifyConnectionChange(false);

    // Reject all pending requests
    for (const [id, { reject, timer }] of this.pendingRequests) {
      clearTimeout(timer);
      reject(new Error('Disconnected from Tauri'));
    }
    this.pendingRequests.clear();

    // Schedule reconnection
    this.scheduleReconnect();
  }

  /**
   * Schedule a reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.info('📋 Max reconnection attempts reached. Extension will continue in standalone mode.');
      this.isTauriAvailable = false;
      return;
    }

    const delay = this.RECONNECT_DELAY * Math.pow(this.RECONNECT_BACKOFF, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Send a message to Tauri and wait for response
   */
  async sendMessage(command, data = {}) {
    const id = `msg_${++this.messageId}_${Date.now()}`;
    
    const message = {
      message_type: 'command',
      command,
      data,
      id
    };

    // If not connected, queue the message or reject
    if (!this.isConnected || !this.port) {
      if (this.isTauriAvailable !== false) {
        // Queue for later
        return new Promise((resolve, reject) => {
          this.messageQueue.push({ message, resolve, reject });
        });
      }
      throw new Error('Tauri not available');
    }

    return new Promise((resolve, reject) => {
      // Set timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${command}`));
      }, this.MESSAGE_TIMEOUT);

      // Store pending request
      this.pendingRequests.set(id, { resolve, reject, timer });

      // Send message
      try {
        this.port.postMessage(message);
        console.debug('📤 Sent to Tauri:', message);
      } catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  /**
   * Flush queued messages after reconnection
   */
  flushQueue() {
    if (this.messageQueue.length === 0) return;

    console.log(`📬 Flushing ${this.messageQueue.length} queued messages`);

    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const { message, resolve, reject } of queue) {
      this.sendMessage(message.command, message.data)
        .then(resolve)
        .catch(reject);
    }
  }

  /**
   * Notify listeners of connection state change
   */
  notifyConnectionChange(connected) {
    if (this.onConnectionChange) {
      this.onConnectionChange(connected);
    }
  }

  // ============================================
  // Public API Methods
  // ============================================

  /**
   * Ping Tauri to test connection
   */
  async ping() {
    return this.sendMessage('ping', { timestamp: Date.now() });
  }

  /**
   * Check if Tauri is available
   */
  get available() {
    return this.isTauriAvailable && this.isConnected;
  }

  // ============================================
  // LendingPad Commands
  // ============================================

  get LendingPad() {
    return {
      detectDocuments: () => this.sendMessage('lendingpad.detectDocuments'),
      startBatchDownload: (documentIds, targetDirectory) => 
        this.sendMessage('lendingpad.startBatchDownload', { documentIds, targetDirectory }),
      extractDocumentData: (documentPath) => 
        this.sendMessage('lendingpad.extractDocumentData', { documentPath }),
      getDownloadProgress: () => this.sendMessage('lendingpad.getDownloadProgress'),
    };
  }

  // ============================================
  // AI Commands
  // ============================================

  get AI() {
    return {
      analyzePage: (pageContent) => 
        this.sendMessage('ai.analyzePage', { pageContent }),
      suggestSelectors: (context) => 
        this.sendMessage('ai.suggestSelectors', { context }),
      improveSelector: (selector, htmlContext) => 
        this.sendMessage('ai.improveSelector', { selector, htmlContext }),
      generateWorkflow: (description) => 
        this.sendMessage('ai.generateWorkflow', { description }),
      processDocument: (documentData, options) => 
        this.sendMessage('ai.processDocument', { documentData, options }),
    };
  }

  // ============================================
  // Automation Commands
  // ============================================

  get Automation() {
    return {
      runWorkflow: (workflowId, params) => 
        this.sendMessage('automation.runWorkflow', { workflowId, params }),
      pauseWorkflow: (workflowId) => 
        this.sendMessage('automation.pauseWorkflow', { workflowId }),
      resumeWorkflow: (workflowId) => 
        this.sendMessage('automation.resumeWorkflow', { workflowId }),
      stopWorkflow: (workflowId) => 
        this.sendMessage('automation.stopWorkflow', { workflowId }),
      getWorkflowStatus: (workflowId) => 
        this.sendMessage('automation.getWorkflowStatus', { workflowId }),
      listWorkflows: () => this.sendMessage('automation.listWorkflows'),
    };
  }

  // ============================================
  // Storage Commands
  // ============================================

  get Storage() {
    return {
      get: (key) => this.sendMessage('storage.get', { key }),
      set: (key, value) => this.sendMessage('storage.set', { key, value }),
      remove: (key) => this.sendMessage('storage.remove', { key }),
      list: (prefix) => this.sendMessage('storage.list', { prefix }),
      clear: () => this.sendMessage('storage.clear'),
    };
  }

  // ============================================
  // License Commands
  // ============================================

  get License() {
    return {
      validate: () => this.sendMessage('license.validate'),
      activate: (licenseKey, userEmail) => 
        this.sendMessage('license.activate', { licenseKey, userEmail }),
      deactivate: () => this.sendMessage('license.deactivate'),
      getStatus: () => this.sendMessage('license.getStatus'),
      checkFeature: (feature) => 
        this.sendMessage('license.checkFeature', { feature }),
    };
  }

  // ============================================
  // Extractor Commands
  // ============================================

  get Extractor() {
    return {
      extractFromPage: (selectors) => 
        this.sendMessage('extractor.extractFromPage', { selectors }),
      extractFromDocument: (documentPath, schema) => 
        this.sendMessage('extractor.extractFromDocument', { documentPath, schema }),
      validateData: (data, schema) => 
        this.sendMessage('extractor.validateData', { data, schema }),
    };
  }

  // ============================================
  // Browser Commands
  // ============================================

  get Browser() {
    return {
      captureScreenshot: (options) => 
        this.sendMessage('browser.captureScreenshot', { options }),
      executeScript: (script) => 
        this.sendMessage('browser.executeScript', { script }),
      getPageInfo: () => this.sendMessage('browser.getPageInfo'),
      cloneSession: () => this.sendMessage('browser.cloneSession'),
    };
  }

  // ============================================
  // Remote Desktop Commands
  // ============================================

  get Remote() {
    return {
      createSession: (config) => 
        this.sendMessage('remote.createSession', { config }),
      joinSession: (sessionId, credentials) => 
        this.sendMessage('remote.joinSession', { sessionId, credentials }),
      leaveSession: (sessionId) => 
        this.sendMessage('remote.leaveSession', { sessionId }),
      listSessions: () => this.sendMessage('remote.listSessions'),
      sendInput: (sessionId, inputEvent) => 
        this.sendMessage('remote.sendInput', { sessionId, inputEvent }),
    };
  }
}

// Create singleton instance
const nativeMessagingBridge = new NativeMessagingBridge();

// Export for use
if (typeof globalThis !== 'undefined') {
  globalThis.NativeMessagingBridge = nativeMessagingBridge;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = nativeMessagingBridge;
}
