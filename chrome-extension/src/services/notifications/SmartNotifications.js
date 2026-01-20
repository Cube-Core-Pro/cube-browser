/**
 * 🔔 CUBE Nexum v7.0.0 - Smart Notifications Service
 * 
 * INTELLIGENT NOTIFICATION SYSTEM
 * 
 * Features:
 * - Context-aware notifications
 * - Productivity tips
 * - Achievement celebrations
 * - Smart reminders
 * - Do Not Disturb mode
 * - Notification grouping
 * 
 * @version 7.0.0
 * @license CUBE Nexum Enterprise
 */

class SmartNotifications {
  constructor() {
    this.settings = {
      enabled: true,
      sound: true,
      dndEnabled: false,
      dndStart: '22:00',
      dndEnd: '08:00',
      showTips: true,
      showAchievements: true,
      showReminders: true,
      groupSimilar: true,
      maxVisible: 5
    };

    this.queue = [];
    this.history = [];
    this.tips = [
      { id: 'tip_macro', icon: '🤖', title: 'Pro Tip', message: 'Press Ctrl+Shift+R to start recording a macro instantly!' },
      { id: 'tip_autofill', icon: '📝', title: 'Did you know?', message: 'Double-click any form field to auto-fill just that field.' },
      { id: 'tip_ai', icon: '🧠', title: 'AI Power', message: 'Ask the AI to generate CSS selectors for you - just describe what you want!' },
      { id: 'tip_keyboard', icon: '⌨️', title: 'Keyboard Shortcut', message: 'Ctrl+Shift+F opens Smart Autofill instantly on any page.' },
      { id: 'tip_screenshot', icon: '📸', title: 'Screenshot Tip', message: 'Press Ctrl+Shift+S to capture the visible area instantly.' },
      { id: 'tip_ocr', icon: '👁️', title: 'OCR Feature', message: 'Capture any image and extract text with built-in OCR!' },
      { id: 'tip_p2p', icon: '📡', title: 'P2P Transfer', message: 'Share files securely without uploading to any server.' },
      { id: 'tip_vpn', icon: '🔒', title: 'Privacy Mode', message: 'Enable VPN for secure browsing with one click.' },
      { id: 'tip_streak', icon: '🔥', title: 'Streak Bonus', message: 'Use CUBE daily to unlock special achievements!' },
      { id: 'tip_export', icon: '💾', title: 'Backup Data', message: 'Export your macros and settings regularly to avoid data loss.' }
    ];

    this.lastTipShown = null;
    this.tipCooldown = 3600000; // 1 hour between tips

    this.initialize();
  }

  /**
   * Initialize notifications service
   */
  async initialize() {
    try {
      await this.loadSettings();
      this.setupListeners();
      console.log('🔔 Smart Notifications initialized');
    } catch (error) {
      console.error('❌ Notifications initialization failed:', error);
    }
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['notificationSettings']);
      if (result.notificationSettings) {
        this.settings = { ...this.settings, ...result.notificationSettings };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      await chrome.storage.local.set({ notificationSettings: this.settings });
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  /**
   * Setup event listeners
   */
  setupListeners() {
    // Listen for achievement unlocks
    document.addEventListener('achievementUnlocked', (e) => {
      if (this.settings.showAchievements) {
        e.detail.forEach(achievement => {
          this.showAchievement(achievement);
        });
      }
    });

    // Listen for productivity updates
    document.addEventListener('productivityUpdate', (e) => {
      this.checkProductivityMilestones(e.detail);
    });

    // Schedule random tips
    if (this.settings.showTips) {
      this.scheduleTips();
    }
  }

  /**
   * Check if in DND mode
   */
  isInDNDMode() {
    if (!this.settings.dndEnabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.settings.dndStart.split(':').map(Number);
    const [endHour, endMin] = this.settings.dndEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Overnight DND (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  /**
   * Show notification
   * @param {Object} notification - Notification data
   */
  async show(notification) {
    if (!this.settings.enabled) return;
    if (this.isInDNDMode()) return;

    const notif = {
      id: notification.id || `notif_${Date.now()}`,
      type: notification.type || 'info',
      icon: notification.icon || '📢',
      title: notification.title || 'CUBE Nexum',
      message: notification.message,
      timestamp: Date.now(),
      priority: notification.priority || 'normal',
      actions: notification.actions || [],
      persistent: notification.persistent || false
    };

    // Add to history
    this.history.unshift(notif);
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }

    // Show Chrome notification
    try {
      await chrome.notifications.create(notif.id, {
        type: 'basic',
        iconUrl: '../icons/icon128.png',
        title: `${notif.icon} ${notif.title}`,
        message: notif.message,
        priority: notif.priority === 'high' ? 2 : 1,
        buttons: notif.actions.slice(0, 2).map(a => ({ title: a.label })),
        requireInteraction: notif.persistent
      });

      // Play sound if enabled
      if (this.settings.sound && notif.type !== 'silent') {
        this.playSound(notif.type);
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }

    // Emit event for in-page notifications
    const event = new CustomEvent('cubeNotification', { detail: notif });
    document.dispatchEvent(event);

    return notif.id;
  }

  /**
   * Show achievement notification
   * @param {Object} achievement - Achievement data
   */
  showAchievement(achievement) {
    this.show({
      type: 'achievement',
      icon: achievement.icon,
      title: '🏆 Achievement Unlocked!',
      message: `${achievement.name}: ${achievement.desc}`,
      priority: 'high'
    });
  }

  /**
   * Show productivity tip
   */
  showTip() {
    if (!this.settings.showTips) return;
    if (this.lastTipShown && Date.now() - this.lastTipShown < this.tipCooldown) return;

    // Get random tip
    const tip = this.tips[Math.floor(Math.random() * this.tips.length)];
    
    this.show({
      type: 'tip',
      icon: tip.icon,
      title: tip.title,
      message: tip.message,
      priority: 'low'
    });

    this.lastTipShown = Date.now();
  }

  /**
   * Schedule random tips
   */
  scheduleTips() {
    // Show a tip every 30-60 minutes of active use
    const interval = 30 * 60 * 1000 + Math.random() * 30 * 60 * 1000;
    
    setTimeout(() => {
      this.showTip();
      this.scheduleTips();
    }, interval);
  }

  /**
   * Check productivity milestones
   * @param {Object} data - Productivity data
   */
  checkProductivityMilestones(data) {
    // Check session milestones
    if (data.session.timeSaved >= 300 && data.session.timeSaved < 360) {
      this.show({
        type: 'milestone',
        icon: '⏰',
        title: 'Great Progress!',
        message: 'You\'ve saved 5 minutes this session. Keep it up!',
        priority: 'low'
      });
    }

    if (data.session.formsAutofilled === 10) {
      this.show({
        type: 'milestone',
        icon: '📝',
        title: 'Form Filling Streak!',
        message: '10 forms auto-filled this session!',
        priority: 'normal'
      });
    }

    // Check daily goal
    if (data.goals.dailyProgress >= 100 && data.goals.dailyProgress < 110) {
      this.show({
        type: 'goal',
        icon: '🎯',
        title: 'Daily Goal Reached!',
        message: 'You\'ve hit your daily time saving goal!',
        priority: 'high'
      });
    }
  }

  /**
   * Play notification sound
   * @param {string} type - Notification type
   */
  playSound(type) {
    // Using Web Audio API for cross-browser support
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different types
      switch (type) {
        case 'achievement':
          oscillator.frequency.value = 880;
          oscillator.type = 'sine';
          break;
        case 'milestone':
          oscillator.frequency.value = 660;
          oscillator.type = 'sine';
          break;
        case 'tip':
          oscillator.frequency.value = 440;
          oscillator.type = 'triangle';
          break;
        default:
          oscillator.frequency.value = 520;
          oscillator.type = 'sine';
      }

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Silently fail if audio not available
    }
  }

  /**
   * Clear notification
   * @param {string} id - Notification ID
   */
  async clear(id) {
    try {
      await chrome.notifications.clear(id);
    } catch (error) {
      console.error('Failed to clear notification:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAll() {
    try {
      const notifications = await chrome.notifications.getAll();
      for (const id of Object.keys(notifications)) {
        await chrome.notifications.clear(id);
      }
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }

  /**
   * Get notification history
   * @param {number} limit - Maximum number of notifications to return
   */
  getHistory(limit = 50) {
    return this.history.slice(0, limit);
  }

  /**
   * Update settings
   * @param {Object} newSettings - New settings
   */
  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  /**
   * Toggle DND mode
   */
  async toggleDND() {
    this.settings.dndEnabled = !this.settings.dndEnabled;
    await this.saveSettings();
    return this.settings.dndEnabled;
  }
}

// Create singleton instance
if (typeof window !== 'undefined') {
  if (!window.smartNotifications) {
    window.smartNotifications = new SmartNotifications();
    console.log('🔔 Smart Notifications Service created');
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartNotifications;
}
