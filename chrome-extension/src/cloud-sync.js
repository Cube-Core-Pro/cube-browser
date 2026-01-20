/**
 * CUBE Extension Cloud Sync Manager
 * Synchronizes settings and data with central admin server
 */

class ExtensionCloudSync {
  constructor() {
    this.apiEndpoint = 'https://api.cubeai.tools/v1/sync';
    this.isConnected = false;
    this.userId = null;
    this.sessionToken = null;
    this.syncInterval = 15 * 60 * 1000; // 15 minutes
    this.pendingChanges = [];
    this.syncableData = {
      settings: true,
      macros: true,
      shortcuts: true,
      preferences: true,
      themes: true
    };
    
    this.init();
  }
  
  async init() {
    // Load stored credentials and settings
    const stored = await chrome.storage.local.get([
      'cloudSyncCredentials',
      'cloudSyncSettings',
      'syncableData'
    ]);
    
    if (stored.cloudSyncCredentials) {
      this.userId = stored.cloudSyncCredentials.userId;
      this.sessionToken = stored.cloudSyncCredentials.sessionToken;
      this.isConnected = true;
    }
    
    if (stored.cloudSyncSettings) {
      Object.assign(this, stored.cloudSyncSettings);
    }
    
    if (stored.syncableData) {
      this.syncableData = { ...this.syncableData, ...stored.syncableData };
    }
    
    // Listen for changes to sync
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && this.isConnected) {
        this.handleLocalChanges(changes);
      }
    });
    
    // Set up periodic sync
    if (this.isConnected) {
      this.scheduleSync();
    }
    
    console.log('[CUBE Cloud Sync] Initialized, connected:', this.isConnected);
  }
  
  scheduleSync() {
    setInterval(() => {
      if (this.isConnected && this.pendingChanges.length > 0) {
        this.syncToCloud();
      }
    }, this.syncInterval);
  }
  
  handleLocalChanges(changes) {
    for (const [key, change] of Object.entries(changes)) {
      // Check if this key should be synced
      if (this.shouldSync(key)) {
        this.pendingChanges.push({
          key,
          value: change.newValue,
          timestamp: Date.now()
        });
      }
    }
    
    // Debounce sync - wait 5 seconds after last change
    this.debouncedSync();
  }
  
  shouldSync(key) {
    const syncableKeys = [
      'cubeSettings',
      'cubeMacros',
      'cubeShortcuts',
      'cubePreferences',
      'cubeTheme'
    ];
    return syncableKeys.includes(key);
  }
  
  debouncedSync = (() => {
    let timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => this.syncToCloud(), 5000);
    };
  })();
  
  async syncToCloud() {
    if (!this.isConnected || this.pendingChanges.length === 0) {
      return { success: true, synced: 0 };
    }
    
    try {
      console.log('[CUBE Cloud Sync] Syncing', this.pendingChanges.length, 'changes...');
      
      const response = await fetch(`${this.apiEndpoint}/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sessionToken}`,
          'X-User-Id': this.userId
        },
        body: JSON.stringify({
          changes: this.pendingChanges,
          deviceId: await this.getDeviceId(),
          timestamp: Date.now()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Clear synced changes
      const syncedCount = this.pendingChanges.length;
      this.pendingChanges = [];
      
      // Update last sync time
      await chrome.storage.local.set({
        lastCloudSync: new Date().toISOString()
      });
      
      console.log('[CUBE Cloud Sync] Synced', syncedCount, 'changes successfully');
      
      return { success: true, synced: syncedCount };
      
    } catch (error) {
      console.error('[CUBE Cloud Sync] Sync failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  async pullFromCloud() {
    if (!this.isConnected) {
      return { success: false, error: 'Not connected' };
    }
    
    try {
      console.log('[CUBE Cloud Sync] Pulling from cloud...');
      
      const deviceId = await this.getDeviceId();
      const lastSync = await this.getLastSyncTime();
      
      const response = await fetch(`${this.apiEndpoint}/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sessionToken}`,
          'X-User-Id': this.userId
        },
        body: JSON.stringify({
          deviceId,
          since: lastSync,
          dataTypes: Object.keys(this.syncableData).filter(k => this.syncableData[k])
        })
      });
      
      if (!response.ok) {
        throw new Error(`Pull failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Apply received changes
      if (data.changes && data.changes.length > 0) {
        await this.applyCloudChanges(data.changes);
      }
      
      await chrome.storage.local.set({
        lastCloudSync: new Date().toISOString()
      });
      
      console.log('[CUBE Cloud Sync] Pulled', data.changes?.length || 0, 'changes');
      
      return { success: true, received: data.changes?.length || 0 };
      
    } catch (error) {
      console.error('[CUBE Cloud Sync] Pull failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  async applyCloudChanges(changes) {
    for (const change of changes) {
      await chrome.storage.local.set({ [change.key]: change.value });
    }
  }
  
  async getDeviceId() {
    let { deviceId } = await chrome.storage.local.get('deviceId');
    
    if (!deviceId) {
      deviceId = 'ext_' + Math.random().toString(36).substring(2, 15);
      await chrome.storage.local.set({ deviceId });
    }
    
    return deviceId;
  }
  
  async getLastSyncTime() {
    const { lastCloudSync } = await chrome.storage.local.get('lastCloudSync');
    return lastCloudSync || null;
  }
  
  async connect(userId, sessionToken) {
    this.userId = userId;
    this.sessionToken = sessionToken;
    this.isConnected = true;
    
    await chrome.storage.local.set({
      cloudSyncCredentials: { userId, sessionToken }
    });
    
    // Register this device
    await this.registerDevice();
    
    // Initial pull
    await this.pullFromCloud();
    
    // Start sync schedule
    this.scheduleSync();
    
    console.log('[CUBE Cloud Sync] Connected as user:', userId);
    
    return { success: true };
  }
  
  async disconnect() {
    this.userId = null;
    this.sessionToken = null;
    this.isConnected = false;
    this.pendingChanges = [];
    
    await chrome.storage.local.remove(['cloudSyncCredentials', 'lastCloudSync']);
    
    console.log('[CUBE Cloud Sync] Disconnected');
    
    return { success: true };
  }
  
  async registerDevice() {
    try {
      const deviceId = await this.getDeviceId();
      
      await fetch(`${this.apiEndpoint}/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sessionToken}`
        },
        body: JSON.stringify({
          deviceId,
          type: 'extension',
          browser: this.getBrowserInfo(),
          platform: this.getPlatform(),
          version: chrome.runtime.getManifest().version
        })
      });
      
      console.log('[CUBE Cloud Sync] Device registered:', deviceId);
      
    } catch (error) {
      console.error('[CUBE Cloud Sync] Device registration failed:', error);
    }
  }
  
  getPlatform() {
    // navigator.platform is not available in service worker context
    if (typeof navigator === 'undefined' || !navigator.platform) {
      return 'unknown';
    }
    return navigator.platform;
  }
  
  getBrowserInfo() {
    // navigator.userAgent is not available in service worker context
    if (typeof navigator === 'undefined' || !navigator.userAgent) {
      return 'Unknown';
    }
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }
  
  async updateSyncableData(settings) {
    this.syncableData = { ...this.syncableData, ...settings };
    await chrome.storage.local.set({ syncableData: this.syncableData });
  }
  
  getStatus() {
    return {
      isConnected: this.isConnected,
      userId: this.userId,
      pendingChanges: this.pendingChanges.length,
      syncableData: this.syncableData
    };
  }
}

// Create global instance
const cubeCloudSync = new ExtensionCloudSync();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExtensionCloudSync, cubeCloudSync };
}
