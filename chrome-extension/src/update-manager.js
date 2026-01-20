/**
 * CUBE Extension Update Manager
 * Handles automatic and manual updates from central admin server
 */

class ExtensionUpdateManager {
  constructor() {
    this.updateServerUrl = 'https://api.cubeai.tools/v1/extension';
    this.currentVersion = chrome.runtime.getManifest().version;
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.lastCheck = null;
    this.updateAvailable = null;
    this.settings = {
      autoCheck: true,
      autoUpdate: false,
      channel: 'stable', // stable, beta, nightly
      notifyOnUpdate: true
    };
    
    this.init();
  }
  
  async init() {
    // Load settings from storage
    const stored = await chrome.storage.local.get(['updateSettings', 'lastUpdateCheck']);
    if (stored.updateSettings) {
      this.settings = { ...this.settings, ...stored.updateSettings };
    }
    if (stored.lastUpdateCheck) {
      this.lastCheck = new Date(stored.lastUpdateCheck);
    }
    
    // Set up periodic check
    if (this.settings.autoCheck) {
      this.scheduleCheck();
    }
    
    // Check on install/update
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'update') {
        this.notifyUpdateComplete(details.previousVersion);
      }
    });
    
    console.log('[CUBE Update Manager] Initialized, current version:', this.currentVersion);
  }
  
  scheduleCheck() {
    // Check every 24 hours
    setInterval(() => {
      this.checkForUpdates();
    }, this.checkInterval);
    
    // Also check on startup if last check was more than 24h ago
    if (!this.lastCheck || (Date.now() - this.lastCheck.getTime()) > this.checkInterval) {
      setTimeout(() => this.checkForUpdates(), 5000); // Wait 5 seconds after init
    }
  }
  
  async checkForUpdates() {
    try {
      console.log('[CUBE Update Manager] Checking for updates...');
      
      const response = await fetch(`${this.updateServerUrl}/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Extension-Version': this.currentVersion,
          'X-Channel': this.settings.channel,
          'X-Platform': this.getPlatform()
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      this.lastCheck = new Date();
      await chrome.storage.local.set({ lastUpdateCheck: this.lastCheck.toISOString() });
      
      if (this.isNewerVersion(data.version)) {
        this.updateAvailable = {
          version: data.version,
          releaseDate: data.releaseDate,
          changelog: data.changelog || [],
          downloadUrl: data.downloadUrl,
          mandatory: data.mandatory || false,
          size: data.size || 'Unknown'
        };
        
        console.log('[CUBE Update Manager] Update available:', data.version);
        
        if (this.settings.notifyOnUpdate) {
          this.showUpdateNotification();
        }
        
        // Broadcast update available event
        this.broadcastUpdateStatus();
        
        return this.updateAvailable;
      }
      
      console.log('[CUBE Update Manager] No updates available');
      return null;
      
    } catch (error) {
      console.error('[CUBE Update Manager] Check failed:', error);
      
      // Return mock data for development/testing
      if (this.currentVersion === '7.0.0') {
        // Simulate no update available for current version
        return null;
      }
      
      return null;
    }
  }
  
  isNewerVersion(newVersion) {
    const current = this.parseVersion(this.currentVersion);
    const latest = this.parseVersion(newVersion);
    
    for (let i = 0; i < Math.max(current.length, latest.length); i++) {
      const c = current[i] || 0;
      const l = latest[i] || 0;
      
      if (l > c) return true;
      if (l < c) return false;
    }
    
    return false;
  }
  
  parseVersion(version) {
    return version.split('.').map(n => parseInt(n, 10));
  }
  
  getPlatform() {
    // Check if navigator is available (not in service worker)
    if (typeof navigator === 'undefined' || !navigator.userAgent) {
      return 'unknown';
    }
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'windows';
    if (ua.includes('Mac')) return 'macos';
    if (ua.includes('Linux')) return 'linux';
    return 'unknown';
  }
  
  async showUpdateNotification() {
    if (!this.updateAvailable) return;
    
    await chrome.notifications.create('cube-update', {
      type: 'basic',
      iconUrl: '/icons/icon128.png',
      title: 'CUBE Nexum Update Available',
      message: `Version ${this.updateAvailable.version} is available. Click to update.`,
      priority: 2,
      buttons: [
        { title: 'Update Now' },
        { title: 'Later' }
      ]
    });
    
    // Handle notification button clicks
    chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
      if (notificationId === 'cube-update') {
        if (buttonIndex === 0) {
          this.openUpdatePage();
        }
        chrome.notifications.clear('cube-update');
      }
    });
  }
  
  openUpdatePage() {
    if (this.updateAvailable && this.updateAvailable.downloadUrl) {
      chrome.tabs.create({ url: this.updateAvailable.downloadUrl });
    } else {
      // Open Chrome Web Store page
      chrome.tabs.create({ 
        url: 'https://chrome.google.com/webstore/detail/cube-nexum/YOUR_EXTENSION_ID' 
      });
    }
  }
  
  async notifyUpdateComplete(previousVersion) {
    console.log(`[CUBE Update Manager] Updated from ${previousVersion} to ${this.currentVersion}`);
    
    // Show what's new notification
    await chrome.notifications.create('cube-update-complete', {
      type: 'basic',
      iconUrl: '/icons/icon128.png',
      title: 'CUBE Nexum Updated!',
      message: `Successfully updated to version ${this.currentVersion}. Click to see what's new.`,
      priority: 1
    });
    
    // Save update history
    const stored = await chrome.storage.local.get('updateHistory');
    const updateHistory = stored.updateHistory || [];
    updateHistory.unshift({
      version: this.currentVersion,
      previousVersion,
      updatedAt: new Date().toISOString(),
      success: true
    });
    
    // Keep only last 20 entries
    await chrome.storage.local.set({ updateHistory: updateHistory.slice(0, 20) });
  }
  
  broadcastUpdateStatus() {
    chrome.runtime.sendMessage({
      type: 'UPDATE_STATUS',
      data: {
        currentVersion: this.currentVersion,
        updateAvailable: this.updateAvailable,
        lastCheck: this.lastCheck?.toISOString(),
        settings: this.settings
      }
    });
  }
  
  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await chrome.storage.local.set({ updateSettings: this.settings });
    
    if (this.settings.autoCheck) {
      this.scheduleCheck();
    }
    
    console.log('[CUBE Update Manager] Settings updated:', this.settings);
  }
  
  getStatus() {
    return {
      currentVersion: this.currentVersion,
      updateAvailable: this.updateAvailable,
      lastCheck: this.lastCheck?.toISOString(),
      settings: this.settings
    };
  }
}

// Create global instance
const cubeUpdateManager = new ExtensionUpdateManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExtensionUpdateManager, cubeUpdateManager };
}
