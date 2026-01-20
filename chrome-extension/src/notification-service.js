// ═══════════════════════════════════════════════════════════════════════════════
// 🔔 NOTIFICATION SERVICE MODULE v7.1.0 - Multi-Channel Notification System
// ═══════════════════════════════════════════════════════════════════════════════
//
// ROLE: Notification management for Chrome Extension
//
// RESPONSIBILITIES:
// ✅ Push Notifications
// ✅ Browser Notifications
// ✅ Badge Updates
// ✅ Notification Preferences
// ✅ Notification Queue
// ✅ Notification History
// ✅ Quiet Hours
// ✅ Digest Mode
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} type - 'info' | 'success' | 'warning' | 'error' | 'automation' | 'system'
 * @property {string} title
 * @property {string} body
 * @property {string} [icon]
 * @property {string} [url]
 * @property {Object} [actions]
 * @property {number} timestamp
 * @property {boolean} read
 */

/**
 * @typedef {Object} NotificationPreferences
 * @property {boolean} enabled
 * @property {boolean} sound
 * @property {boolean} vibrate
 * @property {Object} channels
 * @property {Object} quietHours
 * @property {Object} digest
 */

// ═══════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════

const NotificationState = {
  preferences: {
    enabled: true,
    sound: true,
    vibrate: true,
    channels: {
      automation: true,
      security: true,
      updates: true,
      marketing: false,
      system: true,
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    digest: {
      enabled: false,
      frequency: 'daily',
      time: '09:00',
    },
  },
  history: [],
  queue: [],
  unreadCount: 0,
  initialized: false,
  pushSubscription: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize notification services
 * @returns {Promise<void>}
 */
async function initializeNotifications() {
  console.log('🔔 Initializing Notification Services...');
  
  try {
    // Load stored preferences
    const stored = await chrome.storage.local.get([
      'notificationPreferences',
      'notificationHistory',
      'pushSubscription',
    ]);
    
    if (stored.notificationPreferences) {
      NotificationState.preferences = {
        ...NotificationState.preferences,
        ...stored.notificationPreferences,
      };
    }
    
    if (stored.notificationHistory) {
      NotificationState.history = stored.notificationHistory;
      NotificationState.unreadCount = NotificationState.history.filter(n => !n.read).length;
    }
    
    if (stored.pushSubscription) {
      NotificationState.pushSubscription = stored.pushSubscription;
    }
    
    // Update badge
    updateBadge();
    
    // Request notification permission if enabled
    if (NotificationState.preferences.enabled) {
      await requestNotificationPermission();
    }
    
    // Setup digest scheduler
    if (NotificationState.preferences.digest.enabled) {
      scheduleDigest();
    }
    
    NotificationState.initialized = true;
    console.log('✅ Notification Services initialized');
    
  } catch (error) {
    console.error('❌ Notification initialization failed:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BROWSER NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Request notification permission
 * @returns {Promise<boolean>}
 */
async function requestNotificationPermission() {
  if (!('Notification' in globalThis)) {
    console.warn('Notifications not supported');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    console.warn('Notification permission denied');
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Show a browser notification
 * @param {Notification} notification
 * @returns {Promise<string>} notification id
 */
async function showBrowserNotification(notification) {
  // Check if notifications are enabled
  if (!NotificationState.preferences.enabled) {
    console.log('Notifications disabled');
    return null;
  }
  
  // Check channel
  const channel = notification.type || 'system';
  if (!NotificationState.preferences.channels[channel]) {
    console.log(`Channel ${channel} disabled`);
    return null;
  }
  
  // Check quiet hours
  if (isInQuietHours()) {
    console.log('In quiet hours, queuing notification');
    await queueNotification(notification);
    return null;
  }
  
  // Check digest mode
  if (NotificationState.preferences.digest.enabled && !notification.urgent) {
    console.log('Digest mode enabled, queuing notification');
    await queueNotification(notification);
    return null;
  }
  
  // Create notification
  const notificationId = notification.id || `notification_${Date.now()}`;
  
  const options = {
    type: 'basic',
    iconUrl: notification.icon || chrome.runtime.getURL('icons/icon128.png'),
    title: notification.title,
    message: notification.body,
    silent: !NotificationState.preferences.sound,
    requireInteraction: notification.requireInteraction || false,
  };
  
  // Add buttons if available
  if (notification.actions && Array.isArray(notification.actions)) {
    options.type = 'basic';
    options.buttons = notification.actions.slice(0, 2).map(action => ({
      title: action.label,
    }));
  }
  
  // Show notification using Chrome API
  chrome.notifications.create(notificationId, options);
  
  // Add to history
  await addToHistory({
    ...notification,
    id: notificationId,
    timestamp: Date.now(),
    read: false,
  });
  
  return notificationId;
}

/**
 * Clear a notification
 * @param {string} notificationId
 */
async function clearNotification(notificationId) {
  chrome.notifications.clear(notificationId);
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION HISTORY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add notification to history
 * @param {Notification} notification
 */
async function addToHistory(notification) {
  NotificationState.history.unshift(notification);
  
  // Keep only last 100 notifications
  if (NotificationState.history.length > 100) {
    NotificationState.history = NotificationState.history.slice(0, 100);
  }
  
  NotificationState.unreadCount = NotificationState.history.filter(n => !n.read).length;
  
  await chrome.storage.local.set({ 
    notificationHistory: NotificationState.history 
  });
  
  updateBadge();
  broadcastNotificationUpdate();
}

/**
 * Mark notification as read
 * @param {string} notificationId
 */
async function markAsRead(notificationId) {
  const notification = NotificationState.history.find(n => n.id === notificationId);
  if (notification && !notification.read) {
    notification.read = true;
    NotificationState.unreadCount = Math.max(0, NotificationState.unreadCount - 1);
    
    await chrome.storage.local.set({ 
      notificationHistory: NotificationState.history 
    });
    
    updateBadge();
    broadcastNotificationUpdate();
  }
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead() {
  NotificationState.history.forEach(n => n.read = true);
  NotificationState.unreadCount = 0;
  
  await chrome.storage.local.set({ 
    notificationHistory: NotificationState.history 
  });
  
  updateBadge();
  broadcastNotificationUpdate();
}

/**
 * Clear notification history
 */
async function clearHistory() {
  NotificationState.history = [];
  NotificationState.unreadCount = 0;
  
  await chrome.storage.local.set({ 
    notificationHistory: [] 
  });
  
  updateBadge();
  broadcastNotificationUpdate();
}

/**
 * Get notification history
 * @param {Object} options
 * @returns {Notification[]}
 */
function getHistory(options = {}) {
  let history = [...NotificationState.history];
  
  if (options.unreadOnly) {
    history = history.filter(n => !n.read);
  }
  
  if (options.type) {
    history = history.filter(n => n.type === options.type);
  }
  
  if (options.limit) {
    history = history.slice(0, options.limit);
  }
  
  return history;
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION QUEUE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Queue a notification for later delivery
 * @param {Notification} notification
 */
async function queueNotification(notification) {
  NotificationState.queue.push({
    ...notification,
    queuedAt: Date.now(),
  });
  
  await chrome.storage.local.set({ 
    notificationQueue: NotificationState.queue 
  });
}

/**
 * Process queued notifications
 */
async function processQueue() {
  if (NotificationState.queue.length === 0) {
    return;
  }
  
  // Check if we're still in quiet hours
  if (isInQuietHours()) {
    return;
  }
  
  const toProcess = [...NotificationState.queue];
  NotificationState.queue = [];
  
  for (const notification of toProcess) {
    await showBrowserNotification(notification);
  }
  
  await chrome.storage.local.set({ notificationQueue: [] });
}

// ═══════════════════════════════════════════════════════════════════════════
// QUIET HOURS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if currently in quiet hours
 * @returns {boolean}
 */
function isInQuietHours() {
  if (!NotificationState.preferences.quietHours.enabled) {
    return false;
  }
  
  const now = new Date();
  const timezone = NotificationState.preferences.quietHours.timezone;
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: timezone,
  });
  
  const start = NotificationState.preferences.quietHours.start;
  const end = NotificationState.preferences.quietHours.end;
  
  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }
  
  return currentTime >= start && currentTime < end;
}

/**
 * Schedule quiet hours check
 */
function scheduleQuietHoursCheck() {
  // Check every minute for quiet hours end
  setInterval(() => {
    if (!isInQuietHours() && NotificationState.queue.length > 0) {
      processQueue();
    }
  }, 60000);
}

// ═══════════════════════════════════════════════════════════════════════════
// DIGEST MODE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schedule digest delivery
 */
function scheduleDigest() {
  const digestConfig = NotificationState.preferences.digest;
  
  if (!digestConfig.enabled) {
    return;
  }
  
  // Use Chrome alarms for scheduling
  const alarmName = 'notification_digest';
  
  // Clear existing alarm
  chrome.alarms.clear(alarmName);
  
  // Calculate next digest time
  const now = new Date();
  const [hours, minutes] = digestConfig.time.split(':').map(Number);
  
  let nextDigest = new Date(now);
  nextDigest.setHours(hours, minutes, 0, 0);
  
  // If time has passed today, schedule for tomorrow
  if (nextDigest <= now) {
    if (digestConfig.frequency === 'daily') {
      nextDigest.setDate(nextDigest.getDate() + 1);
    } else if (digestConfig.frequency === 'weekly') {
      nextDigest.setDate(nextDigest.getDate() + 7);
    }
  }
  
  // Create alarm
  chrome.alarms.create(alarmName, {
    when: nextDigest.getTime(),
    periodInMinutes: digestConfig.frequency === 'daily' ? 1440 : 10080,
  });
}

/**
 * Send digest notification
 */
async function sendDigest() {
  const queuedNotifications = NotificationState.queue;
  
  if (queuedNotifications.length === 0) {
    return;
  }
  
  // Group by type
  const grouped = queuedNotifications.reduce((acc, n) => {
    const type = n.type || 'system';
    acc[type] = acc[type] || [];
    acc[type].push(n);
    return acc;
  }, {});
  
  // Create digest notification
  const digestTitle = `📋 CUBE Nexum Digest - ${queuedNotifications.length} notifications`;
  let digestBody = '';
  
  for (const [type, notifications] of Object.entries(grouped)) {
    digestBody += `\n${type}: ${notifications.length} new`;
  }
  
  // Show digest
  await showBrowserNotification({
    id: `digest_${Date.now()}`,
    type: 'system',
    title: digestTitle,
    body: digestBody.trim(),
    urgent: true, // Bypass digest mode for the digest itself
  });
  
  // Clear queue
  NotificationState.queue = [];
  await chrome.storage.local.set({ notificationQueue: [] });
}

// ═══════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Subscribe to push notifications
 * @returns {Promise<Object>}
 */
async function subscribeToPush() {
  try {
    // Get VAPID public key from server
    const apiBase = (typeof CubeConfig !== 'undefined' && CubeConfig.SERVER?.API_BASE) || 'https://api.cubeai.tools';
    const response = await fetch(`${apiBase}/notifications/push/vapid`);
    const { publicKey } = await response.json();
    
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }
    
    // Subscribe
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    
    // Send subscription to server
    await fetch(`${apiBase}/notifications/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'extension_user', // Will be replaced with actual user ID
        subscription: subscription.toJSON(),
      }),
    });
    
    NotificationState.pushSubscription = subscription.toJSON();
    await chrome.storage.local.set({ pushSubscription: NotificationState.pushSubscription });
    
    console.log('✅ Push notifications subscribed');
    return subscription;
    
  } catch (error) {
    console.error('Push subscription failed:', error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 */
async function unsubscribeFromPush() {
  if (!NotificationState.pushSubscription) {
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
    }
    
    // Notify server
    const apiBase = (typeof CubeConfig !== 'undefined' && CubeConfig.SERVER?.API_BASE) || 'https://api.cubeai.tools';
    await fetch(`${apiBase}/notifications/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: NotificationState.pushSubscription.endpoint,
      }),
    });
    
    NotificationState.pushSubscription = null;
    await chrome.storage.local.remove('pushSubscription');
    
    console.log('✅ Push notifications unsubscribed');
    
  } catch (error) {
    console.error('Push unsubscription failed:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PREFERENCES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update notification preferences
 * @param {Partial<NotificationPreferences>} updates
 */
async function updatePreferences(updates) {
  NotificationState.preferences = {
    ...NotificationState.preferences,
    ...updates,
    channels: {
      ...NotificationState.preferences.channels,
      ...(updates.channels || {}),
    },
    quietHours: {
      ...NotificationState.preferences.quietHours,
      ...(updates.quietHours || {}),
    },
    digest: {
      ...NotificationState.preferences.digest,
      ...(updates.digest || {}),
    },
  };
  
  await chrome.storage.local.set({ 
    notificationPreferences: NotificationState.preferences 
  });
  
  // Reschedule digest if changed
  if (updates.digest) {
    scheduleDigest();
  }
  
  broadcastNotificationUpdate();
}

/**
 * Get current preferences
 * @returns {NotificationPreferences}
 */
function getPreferences() {
  return { ...NotificationState.preferences };
}

// ═══════════════════════════════════════════════════════════════════════════
// BADGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update extension badge with unread count
 */
function updateBadge() {
  const count = NotificationState.unreadCount;
  
  if (count > 0) {
    chrome.action.setBadgeText({ text: count > 99 ? '99+' : count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert URL-safe base64 to Uint8Array
 * @param {string} base64String
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Broadcast notification state update
 */
function broadcastNotificationUpdate() {
  const state = {
    unreadCount: NotificationState.unreadCount,
    preferences: NotificationState.preferences,
    hasQueue: NotificationState.queue.length > 0,
    pushEnabled: !!NotificationState.pushSubscription,
  };
  
  chrome.runtime.sendMessage({ type: 'NOTIFICATION_UPDATE', payload: state }).catch((error) => {
    // Extension context may not be available
    console.debug('Notification broadcast to runtime failed:', error?.message || 'Context unavailable');
  });
  
  // Send to all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { type: 'NOTIFICATION_UPDATE', payload: state }).catch((error) => {
        // Tab may be closed or not ready
        console.debug(`Notification broadcast to tab ${tab.id} failed:`, error?.message || 'Tab unavailable');
      });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTOMATION NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send automation start notification
 * @param {string} workflowName
 */
async function notifyAutomationStart(workflowName) {
  await showBrowserNotification({
    type: 'automation',
    title: '🚀 Automation Started',
    body: `Running: ${workflowName}`,
    icon: chrome.runtime.getURL('icons/icon128.png'),
  });
}

/**
 * Send automation complete notification
 * @param {string} workflowName
 * @param {Object} results
 */
async function notifyAutomationComplete(workflowName, results) {
  const success = !results.error;
  
  await showBrowserNotification({
    type: 'automation',
    title: success ? '✅ Automation Complete' : '❌ Automation Failed',
    body: success 
      ? `${workflowName} completed successfully. Processed ${results.itemsProcessed || 0} items.`
      : `${workflowName} failed: ${results.error}`,
    icon: chrome.runtime.getURL('icons/icon128.png'),
  });
}

/**
 * Send scheduled automation reminder
 * @param {string} workflowName
 * @param {Date} scheduledTime
 */
async function notifyScheduledAutomation(workflowName, scheduledTime) {
  await showBrowserNotification({
    type: 'automation',
    title: '⏰ Scheduled Automation',
    body: `${workflowName} will run at ${scheduledTime.toLocaleTimeString()}`,
    icon: chrome.runtime.getURL('icons/icon128.png'),
    actions: [
      { id: 'run_now', label: 'Run Now' },
      { id: 'cancel', label: 'Cancel' },
    ],
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle notification-related messages
 * @param {Object} message
 * @param {Object} sender
 * @returns {Promise<Object>}
 */
async function handleNotificationMessage(message, sender) {
  switch (message.action) {
    case 'NOTIFICATION_INIT':
      await initializeNotifications();
      return { success: true };
      
    case 'SHOW_NOTIFICATION':
      const notificationId = await showBrowserNotification(message.notification);
      return { success: true, notificationId };
      
    case 'CLEAR_NOTIFICATION':
      await clearNotification(message.notificationId);
      return { success: true };
      
    case 'GET_HISTORY':
      return { 
        success: true, 
        history: getHistory(message.options || {}) 
      };
      
    case 'MARK_AS_READ':
      await markAsRead(message.notificationId);
      return { success: true };
      
    case 'MARK_ALL_AS_READ':
      await markAllAsRead();
      return { success: true };
      
    case 'CLEAR_HISTORY':
      await clearHistory();
      return { success: true };
      
    case 'GET_PREFERENCES':
      return { success: true, preferences: getPreferences() };
      
    case 'UPDATE_PREFERENCES':
      await updatePreferences(message.preferences);
      return { success: true };
      
    case 'SUBSCRIBE_PUSH':
      try {
        const subscription = await subscribeToPush();
        return { success: true, subscription };
      } catch (error) {
        return { success: false, error: error.message };
      }
      
    case 'UNSUBSCRIBE_PUSH':
      await unsubscribeFromPush();
      return { success: true };
      
    case 'GET_UNREAD_COUNT':
      return { success: true, count: NotificationState.unreadCount };
      
    case 'AUTOMATION_START':
      await notifyAutomationStart(message.workflowName);
      return { success: true };
      
    case 'AUTOMATION_COMPLETE':
      await notifyAutomationComplete(message.workflowName, message.results);
      return { success: true };
      
    case 'SCHEDULED_AUTOMATION':
      await notifyScheduledAutomation(message.workflowName, new Date(message.scheduledTime));
      return { success: true };
      
    default:
      return { success: false, error: 'Unknown action' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CHROME NOTIFICATION LISTENERS
// ═══════════════════════════════════════════════════════════════════════════

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  markAsRead(notificationId);
  
  // Get notification from history
  const notification = NotificationState.history.find(n => n.id === notificationId);
  
  if (notification?.url) {
    chrome.tabs.create({ url: notification.url });
  }
  
  chrome.notifications.clear(notificationId);
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  const notification = NotificationState.history.find(n => n.id === notificationId);
  
  if (notification?.actions && notification.actions[buttonIndex]) {
    const action = notification.actions[buttonIndex];
    
    // Broadcast action to handle it
    chrome.runtime.sendMessage({
      type: 'NOTIFICATION_ACTION',
      payload: {
        notificationId,
        actionId: action.id,
        action: action,
      },
    });
  }
  
  chrome.notifications.clear(notificationId);
});

// Handle notification close
chrome.notifications.onClosed.addListener((notificationId, byUser) => {
  if (byUser) {
    markAsRead(notificationId);
  }
});

// Handle alarms for digest
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'notification_digest') {
    sendDigest();
  } else if (alarm.name === 'quiet_hours_end') {
    processQueue();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

// Export for use in background service worker
if (typeof globalThis !== 'undefined') {
  globalThis.NotificationService = {
    initialize: initializeNotifications,
    show: showBrowserNotification,
    clear: clearNotification,
    getHistory,
    markAsRead,
    markAllAsRead,
    clearHistory,
    getPreferences,
    updatePreferences,
    subscribeToPush,
    unsubscribeFromPush,
    notifyAutomationStart,
    notifyAutomationComplete,
    notifyScheduledAutomation,
    handleMessage: handleNotificationMessage,
    getState: () => NotificationState,
    getUnreadCount: () => NotificationState.unreadCount,
  };
}

// Schedule quiet hours check
scheduleQuietHoursCheck();

// Initialize on load
initializeNotifications();
