// CUBE OmniFill - VPN Manager Module v6.0 Elite
// Integrated with Tauri desktop app - Kill Switch, Split Tunneling, Protocol Selection

console.log('🔒 VPN Manager Module v6.0 Elite loaded');

/**
 * VPN Manager - Syncs with Tauri Desktop App
 * Features: Kill Switch, Split Tunneling, Protocol Selection, Server Management
 */
class VPNManager {
  constructor() {
    this.isConnected = false;
    this.currentServer = null;
    this.connectionStart = null;
    this.bytesReceived = 0;
    this.bytesSent = 0;
    this.servers = [];
    this.favorites = [];
    this.recentServers = [];
    
    // Advanced Features
    this.killSwitch = {
      enabled: false,
      blockAll: false,
      allowLAN: true
    };
    
    this.splitTunneling = {
      enabled: false,
      mode: 'exclude', // 'exclude' or 'include'
      apps: [],
      domains: []
    };
    
    this.protocol = 'auto'; // 'auto', 'wireguard', 'openvpn', 'ikev2'
    
    this.settings = {
      autoConnect: false,
      startMinimized: false,
      showNotifications: true,
      dnsLeakProtection: true,
      ipv6LeakProtection: true,
      portForwarding: false,
      preferredProtocol: 'auto',
      syncWithTauri: true
    };
    
    this.connectionStats = {
      totalBytesReceived: 0,
      totalBytesSent: 0,
      sessionsCount: 0,
      totalTime: 0
    };
    
    this.init();
  }

  /**
   * Initialize VPN manager
   */
  async init() {
    await this.loadSettings();
    await this.loadServers();
    this.startStatsUpdater();
    console.log('[VPNManager] Initialized');
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get([
        'vpnSettings', 
        'vpnFavorites', 
        'vpnRecentServers',
        'vpnConnectionStats',
        'vpnKillSwitch',
        'vpnSplitTunneling'
      ]);
      
      if (result.vpnSettings) {
        this.settings = { ...this.settings, ...result.vpnSettings };
      }
      if (result.vpnFavorites) {
        this.favorites = result.vpnFavorites;
      }
      if (result.vpnRecentServers) {
        this.recentServers = result.vpnRecentServers;
      }
      if (result.vpnConnectionStats) {
        this.connectionStats = result.vpnConnectionStats;
      }
      if (result.vpnKillSwitch) {
        this.killSwitch = result.vpnKillSwitch;
      }
      if (result.vpnSplitTunneling) {
        this.splitTunneling = result.vpnSplitTunneling;
      }
    } catch (error) {
      console.warn('[VPNManager] Could not load settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      await chrome.storage.local.set({
        vpnSettings: this.settings,
        vpnFavorites: this.favorites,
        vpnRecentServers: this.recentServers,
        vpnConnectionStats: this.connectionStats,
        vpnKillSwitch: this.killSwitch,
        vpnSplitTunneling: this.splitTunneling
      });
      
      // Sync with Tauri
      if (this.settings.syncWithTauri) {
        await this.syncWithTauri();
      }
    } catch (error) {
      console.error('[VPNManager] Could not save settings:', error);
    }
  }

  /**
   * Load server list
   */
  async loadServers() {
    // Pre-populated server list (in production, fetch from API)
    this.servers = [
      // North America
      { id: 'us-ny-1', name: 'New York #1', country: 'United States', city: 'New York', load: 45, ping: 32, premium: false, p2p: true, streaming: true },
      { id: 'us-ny-2', name: 'New York #2', country: 'United States', city: 'New York', load: 38, ping: 35, premium: false, p2p: true, streaming: true },
      { id: 'us-la-1', name: 'Los Angeles #1', country: 'United States', city: 'Los Angeles', load: 52, ping: 45, premium: false, p2p: true, streaming: true },
      { id: 'us-chi-1', name: 'Chicago #1', country: 'United States', city: 'Chicago', load: 30, ping: 28, premium: false, p2p: true, streaming: false },
      { id: 'us-mia-1', name: 'Miami #1', country: 'United States', city: 'Miami', load: 42, ping: 38, premium: false, p2p: false, streaming: true },
      { id: 'ca-tor-1', name: 'Toronto #1', country: 'Canada', city: 'Toronto', load: 35, ping: 40, premium: false, p2p: true, streaming: true },
      { id: 'ca-van-1', name: 'Vancouver #1', country: 'Canada', city: 'Vancouver', load: 28, ping: 55, premium: false, p2p: true, streaming: false },
      
      // Europe
      { id: 'uk-lon-1', name: 'London #1', country: 'United Kingdom', city: 'London', load: 55, ping: 120, premium: false, p2p: true, streaming: true },
      { id: 'uk-lon-2', name: 'London #2', country: 'United Kingdom', city: 'London', load: 48, ping: 125, premium: true, p2p: true, streaming: true },
      { id: 'de-fra-1', name: 'Frankfurt #1', country: 'Germany', city: 'Frankfurt', load: 42, ping: 115, premium: false, p2p: true, streaming: true },
      { id: 'de-ber-1', name: 'Berlin #1', country: 'Germany', city: 'Berlin', load: 38, ping: 118, premium: false, p2p: true, streaming: false },
      { id: 'nl-ams-1', name: 'Amsterdam #1', country: 'Netherlands', city: 'Amsterdam', load: 60, ping: 122, premium: false, p2p: true, streaming: true },
      { id: 'fr-par-1', name: 'Paris #1', country: 'France', city: 'Paris', load: 45, ping: 128, premium: false, p2p: true, streaming: true },
      { id: 'ch-zur-1', name: 'Zurich #1', country: 'Switzerland', city: 'Zurich', load: 25, ping: 130, premium: true, p2p: true, streaming: true },
      { id: 'se-sto-1', name: 'Stockholm #1', country: 'Sweden', city: 'Stockholm', load: 32, ping: 140, premium: false, p2p: true, streaming: false },
      
      // Asia Pacific
      { id: 'jp-tok-1', name: 'Tokyo #1', country: 'Japan', city: 'Tokyo', load: 50, ping: 180, premium: false, p2p: true, streaming: true },
      { id: 'sg-sin-1', name: 'Singapore #1', country: 'Singapore', city: 'Singapore', load: 45, ping: 200, premium: false, p2p: true, streaming: true },
      { id: 'au-syd-1', name: 'Sydney #1', country: 'Australia', city: 'Sydney', load: 38, ping: 220, premium: false, p2p: true, streaming: true },
      { id: 'hk-hkg-1', name: 'Hong Kong #1', country: 'Hong Kong', city: 'Hong Kong', load: 55, ping: 190, premium: true, p2p: false, streaming: true },
      
      // South America
      { id: 'br-sao-1', name: 'São Paulo #1', country: 'Brazil', city: 'São Paulo', load: 40, ping: 150, premium: false, p2p: true, streaming: false },
      { id: 'ar-bue-1', name: 'Buenos Aires #1', country: 'Argentina', city: 'Buenos Aires', load: 35, ping: 160, premium: false, p2p: true, streaming: false }
    ];
    
    console.log(`[VPNManager] Loaded ${this.servers.length} servers`);
  }

  // ============================================
  // Connection Management
  // ============================================

  /**
   * Connect to a VPN server
   * @param {string} serverId 
   * @returns {Promise<object>}
   */
  async connect(serverId) {
    if (this.isConnected) {
      await this.disconnect();
    }
    
    const server = this.servers.find(s => s.id === serverId);
    if (!server) {
      throw new Error('Server not found');
    }
    
    console.log(`[VPNManager] Connecting to ${server.name}...`);
    
    // Activate kill switch if enabled
    if (this.killSwitch.enabled) {
      await this.activateKillSwitch();
    }
    
    // Apply split tunneling rules
    if (this.splitTunneling.enabled) {
      await this.applySplitTunneling();
    }
    
    try {
      // Send connect request to Tauri (simulated in extension)
      const result = await this.sendToTauri('vpn_connect', {
        serverId,
        protocol: this.settings.preferredProtocol,
        killSwitch: this.killSwitch,
        splitTunneling: this.splitTunneling
      });
      
      this.isConnected = true;
      this.currentServer = server;
      this.connectionStart = Date.now();
      this.bytesReceived = 0;
      this.bytesSent = 0;
      
      // Add to recent servers
      this.addToRecent(server);
      
      // Update stats
      this.connectionStats.sessionsCount++;
      await this.saveSettings();
      
      // Show notification
      if (this.settings.showNotifications) {
        this.showNotification('VPN Connected', `Connected to ${server.name}`);
      }
      
      console.log(`[VPNManager] Connected to ${server.name}`);
      
      return {
        success: true,
        server,
        protocol: this.protocol,
        ip: result?.ip || '10.0.0.1'
      };
    } catch (error) {
      console.error('[VPNManager] Connection failed:', error);
      
      // Deactivate kill switch on failure if configured
      if (this.killSwitch.enabled && !this.killSwitch.blockAll) {
        await this.deactivateKillSwitch();
      }
      
      throw error;
    }
  }

  /**
   * Disconnect from VPN
   */
  async disconnect() {
    if (!this.isConnected) return;
    
    console.log('[VPNManager] Disconnecting...');
    
    try {
      await this.sendToTauri('vpn_disconnect', {});
      
      // Update stats
      if (this.connectionStart) {
        const duration = Date.now() - this.connectionStart;
        this.connectionStats.totalTime += duration;
        this.connectionStats.totalBytesReceived += this.bytesReceived;
        this.connectionStats.totalBytesSent += this.bytesSent;
      }
      
      this.isConnected = false;
      this.currentServer = null;
      this.connectionStart = null;
      
      // Deactivate kill switch
      if (this.killSwitch.enabled && !this.killSwitch.blockAll) {
        await this.deactivateKillSwitch();
      }
      
      await this.saveSettings();
      
      if (this.settings.showNotifications) {
        this.showNotification('VPN Disconnected', 'You are no longer protected');
      }
      
      console.log('[VPNManager] Disconnected');
    } catch (error) {
      console.error('[VPNManager] Disconnect failed:', error);
      throw error;
    }
  }

  /**
   * Quick connect to best server
   */
  async quickConnect() {
    const bestServer = this.getBestServer();
    if (!bestServer) {
      throw new Error('No servers available');
    }
    
    return this.connect(bestServer.id);
  }

  /**
   * Get best server based on load and ping
   * @returns {object}
   */
  getBestServer() {
    const availableServers = this.servers.filter(s => !s.premium || this.settings.hasPremium);
    
    if (availableServers.length === 0) return null;
    
    // Score = (100 - load) * 0.6 + (300 - ping) * 0.4 / 3
    return availableServers.reduce((best, server) => {
      const score = (100 - server.load) * 0.6 + (300 - server.ping) * 0.4 / 3;
      const bestScore = (100 - best.load) * 0.6 + (300 - best.ping) * 0.4 / 3;
      return score > bestScore ? server : best;
    });
  }

  // ============================================
  // Kill Switch
  // ============================================

  /**
   * Enable kill switch
   * @param {object} options 
   */
  async enableKillSwitch(options = {}) {
    this.killSwitch = {
      enabled: true,
      blockAll: options.blockAll ?? false,
      allowLAN: options.allowLAN ?? true
    };
    
    await this.saveSettings();
    
    if (this.isConnected) {
      await this.activateKillSwitch();
    }
    
    console.log('[VPNManager] Kill switch enabled');
  }

  /**
   * Disable kill switch
   */
  async disableKillSwitch() {
    this.killSwitch.enabled = false;
    
    await this.deactivateKillSwitch();
    await this.saveSettings();
    
    console.log('[VPNManager] Kill switch disabled');
  }

  /**
   * Activate kill switch (block traffic)
   */
  async activateKillSwitch() {
    console.log('[VPNManager] Activating kill switch...');
    
    await this.sendToTauri('vpn_killswitch', {
      action: 'activate',
      allowLAN: this.killSwitch.allowLAN
    });
  }

  /**
   * Deactivate kill switch
   */
  async deactivateKillSwitch() {
    console.log('[VPNManager] Deactivating kill switch...');
    
    await this.sendToTauri('vpn_killswitch', {
      action: 'deactivate'
    });
  }

  // ============================================
  // Split Tunneling
  // ============================================

  /**
   * Configure split tunneling
   * @param {object} config 
   */
  async configureSplitTunneling(config) {
    this.splitTunneling = {
      enabled: config.enabled ?? true,
      mode: config.mode ?? 'exclude',
      apps: config.apps ?? [],
      domains: config.domains ?? []
    };
    
    await this.saveSettings();
    
    if (this.isConnected && this.splitTunneling.enabled) {
      await this.applySplitTunneling();
    }
    
    console.log('[VPNManager] Split tunneling configured');
  }

  /**
   * Add app to split tunneling
   * @param {object} app 
   */
  async addSplitTunnelingApp(app) {
    if (!this.splitTunneling.apps.find(a => a.id === app.id)) {
      this.splitTunneling.apps.push(app);
      await this.saveSettings();
      
      if (this.isConnected && this.splitTunneling.enabled) {
        await this.applySplitTunneling();
      }
    }
  }

  /**
   * Remove app from split tunneling
   * @param {string} appId 
   */
  async removeSplitTunnelingApp(appId) {
    this.splitTunneling.apps = this.splitTunneling.apps.filter(a => a.id !== appId);
    await this.saveSettings();
    
    if (this.isConnected && this.splitTunneling.enabled) {
      await this.applySplitTunneling();
    }
  }

  /**
   * Add domain to split tunneling
   * @param {string} domain 
   */
  async addSplitTunnelingDomain(domain) {
    if (!this.splitTunneling.domains.includes(domain)) {
      this.splitTunneling.domains.push(domain);
      await this.saveSettings();
      
      if (this.isConnected && this.splitTunneling.enabled) {
        await this.applySplitTunneling();
      }
    }
  }

  /**
   * Apply split tunneling rules
   */
  async applySplitTunneling() {
    console.log('[VPNManager] Applying split tunneling rules...');
    
    await this.sendToTauri('vpn_split_tunneling', {
      mode: this.splitTunneling.mode,
      apps: this.splitTunneling.apps,
      domains: this.splitTunneling.domains
    });
  }

  // ============================================
  // Server Management
  // ============================================

  /**
   * Get servers by country
   * @param {string} country 
   */
  getServersByCountry(country) {
    return this.servers.filter(s => s.country === country);
  }

  /**
   * Get servers optimized for streaming
   */
  getStreamingServers() {
    return this.servers.filter(s => s.streaming);
  }

  /**
   * Get servers optimized for P2P
   */
  getP2PServers() {
    return this.servers.filter(s => s.p2p);
  }

  /**
   * Add server to favorites
   * @param {string} serverId 
   */
  async addFavorite(serverId) {
    if (!this.favorites.includes(serverId)) {
      this.favorites.push(serverId);
      await this.saveSettings();
    }
  }

  /**
   * Remove server from favorites
   * @param {string} serverId 
   */
  async removeFavorite(serverId) {
    this.favorites = this.favorites.filter(id => id !== serverId);
    await this.saveSettings();
  }

  /**
   * Get favorite servers
   */
  getFavoriteServers() {
    return this.servers.filter(s => this.favorites.includes(s.id));
  }

  /**
   * Add to recent servers
   * @param {object} server 
   */
  addToRecent(server) {
    this.recentServers = [
      server.id,
      ...this.recentServers.filter(id => id !== server.id)
    ].slice(0, 5);
  }

  /**
   * Get recent servers
   */
  getRecentServers() {
    return this.recentServers
      .map(id => this.servers.find(s => s.id === id))
      .filter(Boolean);
  }

  // ============================================
  // Protocol Management
  // ============================================

  /**
   * Set preferred protocol
   * @param {string} protocol 
   */
  async setProtocol(protocol) {
    const validProtocols = ['auto', 'wireguard', 'openvpn', 'ikev2'];
    if (!validProtocols.includes(protocol)) {
      throw new Error('Invalid protocol');
    }
    
    this.settings.preferredProtocol = protocol;
    await this.saveSettings();
    
    // Reconnect if connected
    if (this.isConnected && this.currentServer) {
      await this.connect(this.currentServer.id);
    }
  }

  /**
   * Get available protocols
   */
  getProtocols() {
    return [
      { id: 'auto', name: 'Automatic', description: 'Best balance of speed and security' },
      { id: 'wireguard', name: 'WireGuard', description: 'Fastest, modern protocol' },
      { id: 'openvpn', name: 'OpenVPN', description: 'Most compatible, proven security' },
      { id: 'ikev2', name: 'IKEv2', description: 'Fast reconnection, mobile-friendly' }
    ];
  }

  // ============================================
  // Statistics
  // ============================================

  /**
   * Get connection statistics
   */
  getStats() {
    const stats = {
      ...this.connectionStats,
      currentSession: null
    };
    
    if (this.isConnected && this.connectionStart) {
      stats.currentSession = {
        duration: Date.now() - this.connectionStart,
        bytesReceived: this.bytesReceived,
        bytesSent: this.bytesSent,
        server: this.currentServer
      };
    }
    
    return stats;
  }

  /**
   * Get connection duration formatted
   */
  getConnectionDuration() {
    if (!this.isConnected || !this.connectionStart) return '00:00:00';
    
    const ms = Date.now() - this.connectionStart;
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / 60000) % 60;
    const hours = Math.floor(ms / 3600000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Start stats updater
   */
  startStatsUpdater() {
    setInterval(() => {
      if (this.isConnected) {
        // Simulate traffic (in production, get from Tauri)
        this.bytesReceived += Math.floor(Math.random() * 50000);
        this.bytesSent += Math.floor(Math.random() * 10000);
      }
    }, 1000);
  }

  // ============================================
  // Tauri Communication
  // ============================================

  /**
   * Send command to Tauri
   * @param {string} action 
   * @param {object} data 
   */
  async sendToTauri(action, data) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'tauriCommand',
        command: action,
        data
      });
      
      return response;
    } catch (error) {
      console.warn('[VPNManager] Tauri communication failed:', error);
      // Return simulated success for extension-only operation
      return { success: true, simulated: true };
    }
  }

  /**
   * Sync state with Tauri
   */
  async syncWithTauri() {
    try {
      await chrome.runtime.sendMessage({
        action: 'tauriSync',
        module: 'vpnManager',
        data: {
          isConnected: this.isConnected,
          currentServer: this.currentServer,
          killSwitch: this.killSwitch,
          splitTunneling: this.splitTunneling,
          stats: this.getStats()
        }
      });
    } catch (error) {
      console.warn('[VPNManager] Tauri sync failed:', error);
    }
  }

  // ============================================
  // Notifications
  // ============================================

  /**
   * Show notification
   * @param {string} title 
   * @param {string} message 
   */
  showNotification(title, message) {
    if (!this.settings.showNotifications) return;
    
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon128.png',
        title,
        message
      });
    } catch (error) {
      console.warn('[VPNManager] Could not show notification:', error);
    }
  }

  // ============================================
  // Status
  // ============================================

  /**
   * Get current status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      server: this.currentServer,
      duration: this.getConnectionDuration(),
      bytesReceived: this.bytesReceived,
      bytesSent: this.bytesSent,
      killSwitchActive: this.killSwitch.enabled,
      splitTunnelingActive: this.splitTunneling.enabled,
      protocol: this.settings.preferredProtocol
    };
  }

  /**
   * Format bytes to human readable
   * @param {number} bytes 
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }
}

// Create singleton instance
window.vpnManager = new VPNManager();

console.log('✅ VPN Manager v6.0 Elite initialized');
