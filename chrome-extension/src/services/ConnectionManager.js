/**
 * CUBE Nexum Connection Manager
 * 
 * Manages hybrid connectivity between:
 * - Cloud Server (always available)
 * - Tauri Desktop App (when installed)
 * 
 * Features:
 * - Automatic Tauri detection
 * - Fallback to cloud when Tauri unavailable
 * - Seamless switching between modes
 * - Unified API for all services
 * 
 * @version 1.0.0
 */

class ConnectionManager {
  constructor() {
    this.config = globalThis.CubeConfig || {};
    this.tauriAvailable = false;
    this.serverAvailable = false;
    this.preferTauri = true; // Prefer local when available
    this.connectionState = 'disconnected';
    this.listeners = new Map();
    this.healthCheckInterval = null;
    
    // Initialize
    this.init();
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  async init() {
    console.log('[ConnectionManager] Initializing...');
    
    // Check both connections in parallel
    const [tauriStatus, serverStatus] = await Promise.all([
      this.checkTauriConnection(),
      this.checkServerConnection(),
    ]);
    
    this.tauriAvailable = tauriStatus;
    this.serverAvailable = serverStatus;
    
    // Start health checks
    this.startHealthChecks();
    
    // Emit initial state
    this.emit('connection:ready', {
      tauri: this.tauriAvailable,
      server: this.serverAvailable,
      primary: this.getPrimaryConnection(),
    });
    
    console.log('[ConnectionManager] Ready:', {
      tauri: this.tauriAvailable,
      server: this.serverAvailable,
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONNECTION CHECKS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Check if Tauri desktop app is available
   */
  async checkTauriConnection() {
    try {
      // Method 1: Native messaging
      if (typeof chrome !== 'undefined' && chrome.runtime?.connectNative) {
        const result = await this.pingNativeHost();
        if (result) return true;
      }
      
      // Method 2: Local HTTP API (if Tauri runs local server)
      const localApi = this.config.TAURI?.LOCAL_API || 'http://localhost:23847';
      const timeout = this.config.TAURI?.DETECTION_TIMEOUT || 2000;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${localApi}/health`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return data.status === 'ok' || data.healthy === true;
      }
      
      return false;
    } catch (error) {
      console.log('[ConnectionManager] Tauri not available:', error.message);
      return false;
    }
  }
  
  /**
   * Ping native messaging host
   */
  pingNativeHost() {
    return new Promise((resolve) => {
      if (!chrome?.runtime?.connectNative) {
        resolve(false);
        return;
      }
      
      try {
        const hostName = this.config.TAURI?.NATIVE_HOST || 'com.cube.elite.native';
        const port = chrome.runtime.connectNative(hostName);
        
        const timeout = setTimeout(() => {
          port.disconnect();
          resolve(false);
        }, 2000);
        
        port.onMessage.addListener((response) => {
          clearTimeout(timeout);
          if (response?.pong || response?.type === 'pong') {
            resolve(true);
          } else {
            resolve(false);
          }
          port.disconnect();
        });
        
        port.onDisconnect.addListener(() => {
          clearTimeout(timeout);
          resolve(false);
        });
        
        port.postMessage({ type: 'ping' });
      } catch (error) {
        resolve(false);
      }
    });
  }
  
  /**
   * Check if cloud server is available
   */
  async checkServerConnection() {
    try {
      const healthUrl = this.config.SERVER?.HEALTH || 'https://api.cubeai.tools/health';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(healthUrl, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      return response.ok;
    } catch (error) {
      console.log('[ConnectionManager] Server not available:', error.message);
      return false;
    }
  }
  
  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    // Check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      const previousTauri = this.tauriAvailable;
      const previousServer = this.serverAvailable;
      
      this.tauriAvailable = await this.checkTauriConnection();
      this.serverAvailable = await this.checkServerConnection();
      
      // Emit if changed
      if (previousTauri !== this.tauriAvailable || previousServer !== this.serverAvailable) {
        this.emit('connection:changed', {
          tauri: this.tauriAvailable,
          server: this.serverAvailable,
          primary: this.getPrimaryConnection(),
        });
      }
    }, 30000);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // API CALLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Make an API request with automatic routing
   */
  async request(endpoint, options = {}) {
    const primary = this.getPrimaryConnection();
    
    try {
      if (primary === 'tauri' && this.tauriAvailable) {
        return await this.requestViaTauri(endpoint, options);
      } else if (this.serverAvailable) {
        return await this.requestViaServer(endpoint, options);
      } else {
        throw new Error('No connection available');
      }
    } catch (error) {
      // Fallback: try the other connection
      if (primary === 'tauri' && this.serverAvailable) {
        console.log('[ConnectionManager] Tauri failed, falling back to server');
        return await this.requestViaServer(endpoint, options);
      } else if (primary === 'server' && this.tauriAvailable) {
        console.log('[ConnectionManager] Server failed, falling back to Tauri');
        return await this.requestViaTauri(endpoint, options);
      }
      
      throw error;
    }
  }
  
  /**
   * Make request via Tauri native messaging
   */
  async requestViaTauri(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      if (!chrome?.runtime?.connectNative) {
        reject(new Error('Native messaging not available'));
        return;
      }
      
      const hostName = this.config.TAURI?.NATIVE_HOST || 'com.cube.elite.native';
      const port = chrome.runtime.connectNative(hostName);
      
      const timeout = setTimeout(() => {
        port.disconnect();
        reject(new Error('Request timeout'));
      }, options.timeout || 30000);
      
      port.onMessage.addListener((response) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data || response);
        }
        port.disconnect();
      });
      
      port.onDisconnect.addListener(() => {
        clearTimeout(timeout);
        const error = chrome.runtime.lastError;
        reject(new Error(error?.message || 'Disconnected'));
      });
      
      port.postMessage({
        type: 'api_request',
        endpoint,
        method: options.method || 'GET',
        body: options.body,
        headers: options.headers,
      });
    });
  }
  
  /**
   * Make request via cloud server
   */
  async requestViaServer(endpoint, options = {}) {
    const baseUrl = this.config.SERVER?.API_BASE || 'https://api.cubeai.tools';
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Server error: ${response.status} - ${error}`);
    }
    
    return await response.json();
  }
  
  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const headers = {};
    
    // Add license key if available
    const licenseKey = this.getLicenseKey();
    if (licenseKey) {
      headers['X-License-Key'] = licenseKey;
    }
    
    // Add auth token if available
    const authToken = this.getAuthToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
  }
  
  getLicenseKey() {
    // Get from chrome.storage.local
    return globalThis.CUBE_LICENSE_KEY || null;
  }
  
  getAuthToken() {
    // Get from chrome.storage.local
    return globalThis.CUBE_AUTH_TOKEN || null;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIALIZED REQUESTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * AI request (uses proxy when available)
   */
  async aiRequest(messages, options = {}) {
    const useProxy = this.config.AI?.USE_PROXY ?? true;
    
    if (useProxy && this.serverAvailable) {
      return await this.requestViaServer('/ai/chat', {
        method: 'POST',
        body: {
          messages,
          model: options.model || this.config.AI?.PROVIDERS?.OPENAI?.defaultModel,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens,
        },
      });
    }
    
    // Direct call (requires user's API key)
    const apiKey = options.apiKey || globalThis.CUBE_OPENAI_KEY;
    if (!apiKey) {
      throw new Error('No AI API key available');
    }
    
    const provider = this.config.AI?.PROVIDERS?.OPENAI;
    const response = await fetch(`${provider.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || provider.defaultModel,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * License validation
   */
  async validateLicense(licenseKey) {
    return await this.request('/license/validate', {
      method: 'POST',
      body: { license_key: licenseKey },
    });
  }
  
  /**
   * Get WebRTC ICE credentials (TURN server auth)
   */
  async getIceCredentials() {
    if (this.serverAvailable) {
      return await this.requestViaServer('/p2p/ice-credentials');
    }
    
    // Return static STUN-only config
    return {
      iceServers: this.config.P2P?.ICE_SERVERS?.filter(s => s.urls?.startsWith('stun:')) || [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Get primary connection type
   */
  getPrimaryConnection() {
    if (this.preferTauri && this.tauriAvailable) {
      return 'tauri';
    }
    if (this.serverAvailable) {
      return 'server';
    }
    if (this.tauriAvailable) {
      return 'tauri';
    }
    return 'none';
  }
  
  /**
   * Set connection preference
   */
  setPreferTauri(prefer) {
    this.preferTauri = prefer;
    this.emit('connection:preference', { preferTauri: prefer });
  }
  
  /**
   * Get connection status
   */
  getStatus() {
    return {
      tauri: this.tauriAvailable,
      server: this.serverAvailable,
      primary: this.getPrimaryConnection(),
      state: this.connectionState,
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }
  
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════
  
  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.listeners.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

const connectionManager = new ConnectionManager();

// Export for Chrome Extension
if (typeof globalThis !== 'undefined') {
  globalThis.ConnectionManager = ConnectionManager;
  globalThis.connectionManager = connectionManager;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConnectionManager, connectionManager };
}
