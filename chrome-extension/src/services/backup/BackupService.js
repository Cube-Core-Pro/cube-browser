/**
 * 💾 CUBE Nexum v7.0.0 - Backup & Export Service
 * 
 * ENTERPRISE-GRADE DATA MANAGEMENT
 * 
 * Features:
 * - Full configuration backup
 * - Selective export (macros, workflows, settings)
 * - Import from backup file
 * - Cloud sync support
 * - Encrypted backups
 * - Auto-backup scheduling
 * 
 * @version 7.0.0
 * @license CUBE Nexum Enterprise
 */

class BackupService {
  constructor() {
    this.version = '7.0.0';
    this.backupHistory = [];
    this.autoBackupEnabled = false;
    this.autoBackupInterval = null;
    
    this.exportableData = [
      { key: 'macros', name: 'Macros', icon: '🤖', description: 'All recorded automation macros' },
      { key: 'settings', name: 'Settings', icon: '⚙️', description: 'Extension preferences and configuration' },
      { key: 'aiSettings', name: 'AI Configuration', icon: '🧠', description: 'AI provider keys and preferences' },
      { key: 'formHistory', name: 'Form History', icon: '📝', description: 'Saved form data and field mappings' },
      { key: 'workflows', name: 'Workflows', icon: '⚡', description: 'Automation workflows and schedules' },
      { key: 'passwords', name: 'Passwords', icon: '🔐', description: 'Encrypted password vault (requires master password)' },
      { key: 'bookmarks', name: 'Collections', icon: '📚', description: 'Bookmarks and reading list' },
      { key: 'analytics', name: 'Analytics', icon: '📊', description: 'Productivity metrics and achievements' },
      { key: 'vpnConfigs', name: 'VPN Configs', icon: '🔒', description: 'Custom VPN configurations' },
      { key: 'ftpSites', name: 'FTP Sites', icon: '📁', description: 'Saved FTP/SFTP connections' }
    ];

    this.initialize();
  }

  /**
   * Initialize backup service
   */
  async initialize() {
    try {
      await this.loadBackupHistory();
      await this.checkAutoBackup();
      console.log('💾 Backup Service initialized');
    } catch (error) {
      console.error('❌ Backup Service initialization failed:', error);
    }
  }

  /**
   * Load backup history from storage
   */
  async loadBackupHistory() {
    try {
      const result = await chrome.storage.local.get(['backupHistory']);
      if (result.backupHistory) {
        this.backupHistory = result.backupHistory;
      }
    } catch (error) {
      console.error('Failed to load backup history:', error);
    }
  }

  /**
   * Save backup history to storage
   */
  async saveBackupHistory() {
    try {
      // Keep only last 20 backup records
      const history = this.backupHistory.slice(0, 20);
      await chrome.storage.local.set({ backupHistory: history });
    } catch (error) {
      console.error('Failed to save backup history:', error);
    }
  }

  /**
   * Check and setup auto-backup
   */
  async checkAutoBackup() {
    try {
      const result = await chrome.storage.local.get(['autoBackupSettings']);
      if (result.autoBackupSettings?.enabled) {
        this.enableAutoBackup(result.autoBackupSettings.intervalHours || 24);
      }
    } catch (error) {
      console.error('Failed to check auto-backup settings:', error);
    }
  }

  /**
   * Enable auto-backup
   * @param {number} intervalHours - Backup interval in hours
   */
  async enableAutoBackup(intervalHours = 24) {
    this.autoBackupEnabled = true;
    
    // Clear existing interval
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
    }

    // Setup new interval
    const intervalMs = intervalHours * 60 * 60 * 1000;
    this.autoBackupInterval = setInterval(() => {
      this.createAutoBackup();
    }, intervalMs);

    // Save settings
    await chrome.storage.local.set({
      autoBackupSettings: {
        enabled: true,
        intervalHours,
        lastBackup: Date.now()
      }
    });

    console.log(`✅ Auto-backup enabled every ${intervalHours} hours`);
  }

  /**
   * Disable auto-backup
   */
  async disableAutoBackup() {
    this.autoBackupEnabled = false;
    
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
      this.autoBackupInterval = null;
    }

    await chrome.storage.local.set({
      autoBackupSettings: {
        enabled: false
      }
    });

    console.log('❌ Auto-backup disabled');
  }

  /**
   * Create automatic backup
   */
  async createAutoBackup() {
    try {
      console.log('🔄 Creating auto-backup...');
      
      const backup = await this.createBackup({
        includeAll: true,
        isAutoBackup: true
      });

      // Store in local storage (not downloaded)
      await chrome.storage.local.set({
        lastAutoBackup: backup
      });

      // Update settings
      const settings = await chrome.storage.local.get(['autoBackupSettings']);
      if (settings.autoBackupSettings) {
        settings.autoBackupSettings.lastBackup = Date.now();
        await chrome.storage.local.set({ autoBackupSettings: settings.autoBackupSettings });
      }

      console.log('✅ Auto-backup completed');
      return backup;
    } catch (error) {
      console.error('❌ Auto-backup failed:', error);
      return null;
    }
  }

  /**
   * Create a backup of selected data
   * @param {Object} options - Backup options
   */
  async createBackup(options = {}) {
    const {
      includeAll = false,
      includeMacros = true,
      includeSettings = true,
      includeAiSettings = true,
      includeFormHistory = true,
      includeWorkflows = true,
      includePasswords = false, // Requires explicit consent
      includeBookmarks = true,
      includeAnalytics = true,
      includeVpnConfigs = false,
      includeFtpSites = false,
      isAutoBackup = false,
      encrypt = false,
      password = null
    } = options;

    console.log('📦 Creating backup...');

    const backup = {
      metadata: {
        version: this.version,
        createdAt: new Date().toISOString(),
        type: isAutoBackup ? 'auto' : 'manual',
        encrypted: encrypt
      },
      data: {}
    };

    try {
      // Collect all selected data
      const storageKeys = [];
      
      if (includeAll || includeMacros) {
        storageKeys.push('macros', 'macroHistory');
      }
      if (includeAll || includeSettings) {
        storageKeys.push('settings', 'theme', 'language', 'notificationSettings');
      }
      if (includeAll || includeAiSettings) {
        storageKeys.push('openai_apiKey', 'anthropic_apiKey', 'gemini_apiKey', 'aiActiveProvider', 'aiPersonality');
      }
      if (includeAll || includeFormHistory) {
        storageKeys.push('formHistory', 'fieldPatterns', 'formProfiles');
      }
      if (includeAll || includeWorkflows) {
        storageKeys.push('workflows', 'automationFlows', 'schedules');
      }
      if (includePasswords) {
        storageKeys.push('passwords', 'passwordCategories', 'masterPasswordHash');
      }
      if (includeAll || includeBookmarks) {
        storageKeys.push('collections', 'readingList', 'bookmarks');
      }
      if (includeAll || includeAnalytics) {
        storageKeys.push('productivityMetrics', 'stats');
      }
      if (includeVpnConfigs) {
        storageKeys.push('vpnConfigs', 'vpnServers');
      }
      if (includeFtpSites) {
        storageKeys.push('ftpSites', 'sshConfigs');
      }

      // Get all data from storage
      const result = await chrome.storage.local.get(storageKeys);
      backup.data = result;

      // Add record to history
      const historyRecord = {
        id: `backup_${Date.now()}`,
        timestamp: Date.now(),
        type: isAutoBackup ? 'auto' : 'manual',
        size: JSON.stringify(backup).length,
        itemCount: Object.keys(backup.data).length,
        encrypted: encrypt
      };
      this.backupHistory.unshift(historyRecord);
      await this.saveBackupHistory();

      // Encrypt if requested
      if (encrypt && password) {
        backup.data = await this.encryptData(JSON.stringify(backup.data), password);
        backup.metadata.encrypted = true;
      }

      console.log('✅ Backup created successfully');
      return backup;

    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      throw error;
    }
  }

  /**
   * Export backup as downloadable file
   * @param {Object} options - Export options
   */
  async exportBackup(options = {}) {
    try {
      const backup = await this.createBackup(options);
      
      // Create filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `cube-nexum-backup-${timestamp}.json`;
      
      // Create download
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`✅ Backup exported: ${filename}`);
      
      // Emit event
      const event = new CustomEvent('backupExported', {
        detail: { filename, size: blob.size }
      });
      document.dispatchEvent(event);

      return { success: true, filename, size: blob.size };

    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    }
  }

  /**
   * Import backup from file
   * @param {File} file - Backup file
   * @param {Object} options - Import options
   */
  async importBackup(file, options = {}) {
    const {
      mergeData = false, // If false, replaces existing data
      password = null    // For encrypted backups
    } = options;

    console.log('📥 Importing backup...');

    try {
      // Read file
      const content = await this.readFile(file);
      let backup = JSON.parse(content);

      // Validate backup structure
      if (!backup.metadata || !backup.data) {
        throw new Error('Invalid backup file format');
      }

      // Check version compatibility
      const backupVersion = backup.metadata.version;
      console.log(`📋 Backup version: ${backupVersion}, Current version: ${this.version}`);

      // Decrypt if needed
      if (backup.metadata.encrypted) {
        if (!password) {
          throw new Error('Password required for encrypted backup');
        }
        backup.data = JSON.parse(await this.decryptData(backup.data, password));
      }

      // Import data
      if (mergeData) {
        // Merge with existing data
        const existing = await chrome.storage.local.get(null);
        const merged = { ...existing, ...backup.data };
        await chrome.storage.local.set(merged);
      } else {
        // Replace existing data
        await chrome.storage.local.set(backup.data);
      }

      console.log('✅ Backup imported successfully');

      // Emit event
      const event = new CustomEvent('backupImported', {
        detail: { 
          version: backupVersion,
          itemCount: Object.keys(backup.data).length,
          merged: mergeData
        }
      });
      document.dispatchEvent(event);

      return {
        success: true,
        version: backupVersion,
        itemCount: Object.keys(backup.data).length
      };

    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
  }

  /**
   * Read file content
   * @param {File} file - File to read
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /**
   * Encrypt data with password
   * @param {string} data - Data to encrypt
   * @param {string} password - Encryption password
   */
  async encryptData(data, password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    // Combine salt + iv + encrypted data
    const result = {
      salt: Array.from(salt),
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };

    return btoa(JSON.stringify(result));
  }

  /**
   * Decrypt data with password
   * @param {string} encryptedData - Encrypted data
   * @param {string} password - Decryption password
   */
  async decryptData(encryptedData, password) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const { salt, iv, data } = JSON.parse(atob(encryptedData));

    // Derive key from password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );

    return decoder.decode(decrypted);
  }

  /**
   * Get backup history
   */
  getHistory() {
    return this.backupHistory;
  }

  /**
   * Get exportable data types
   */
  getExportableTypes() {
    return this.exportableData;
  }

  /**
   * Calculate estimated backup size
   */
  async estimateBackupSize() {
    try {
      const all = await chrome.storage.local.get(null);
      const size = JSON.stringify(all).length;
      return {
        bytes: size,
        formatted: this.formatSize(size)
      };
    } catch (error) {
      return { bytes: 0, formatted: '0 B' };
    }
  }

  /**
   * Format file size
   * @param {number} bytes - Size in bytes
   */
  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Delete all local data (factory reset)
   */
  async factoryReset() {
    console.log('⚠️ Performing factory reset...');
    
    try {
      await chrome.storage.local.clear();
      console.log('✅ Factory reset complete');
      
      // Emit event
      const event = new CustomEvent('factoryReset');
      document.dispatchEvent(event);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Factory reset failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
if (typeof window !== 'undefined') {
  if (!window.backupService) {
    window.backupService = new BackupService();
    console.log('💾 Backup Service created');
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackupService;
}
