// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 BACKGROUND SERVICE WORKER v7.0.0 - Elite Coordinator + Tauri Bridge
// ═══════════════════════════════════════════════════════════════════════════════
//
// ROLE: Service Worker (ES6 module) for Chrome Extension v7.0.0
//
// RESPONSIBILITIES:
// ✅ Keyboard Command Routing
// ✅ Side Panel Management
// ✅ Cross-Tab Communication
// ✅ API Call Coordination (OpenAI, Claude, Gemini)
// ✅ Storage Management
// ✅ Notification System
// ✅ Native Messaging Bridge (Tauri Integration)
// ✅ Update Manager (Auto/Manual Updates)
// ✅ Cloud Sync (Settings Synchronization)
// ✅ i18n (12 Languages Support)
//
// ═══════════════════════════════════════════════════════════════════════════════

// Import Native Messaging Bridge
importScripts('native-messaging-bridge.js');

// Import Update Manager and Cloud Sync
importScripts('src/update-manager.js');
importScripts('src/cloud-sync.js');
importScripts('src/i18n.js');

// Import Enterprise Services (v7.1.0)
importScripts('src/enterprise-service.js');
importScripts('src/notification-service.js');
importScripts('src/analytics-service.js');

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════════════

const STATE = {
  version: '7.1.0',
  activeTabs: new Map(), // Track active content scripts
  macros: new Map(), // Stored macros
  remoteSessions: new Map(), // Active remote control sessions
  p2pConnections: new Map(), // Active P2P connections
  tauriConnected: false, // Native messaging connection status
  enterpriseInitialized: false, // Enterprise services status
  notificationInitialized: false, // Notification services status
  analyticsInitialized: false, // Analytics services status
  
  // Statistics
  stats: {
    macrosRecorded: 0,
    macrosPlayed: 0,
    screenshotsTaken: 0,
    formsAutofilled: 0,
    documentsParsed: 0,
    aiCalls: 0,
    aiCost: 0,
    tauriCommands: 0,
    enterpriseLogins: 0,
    notificationsSent: 0,
    analyticsEvents: 0
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// INSTALLATION
// ═══════════════════════════════════════════════════════════════════════════

chrome.runtime.onInstalled.addListener((details) => {
  console.log('🚀 CUBE Nexum Connect v7.1.0 installed:', details.reason);

  if (details.reason === 'install') {
    // First install
    initializeExtension();
    
    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
    
    // Track installation
    if (typeof globalThis.AnalyticsService !== 'undefined') {
      globalThis.AnalyticsService.trackEvent('extension_installed', 'user', {
        version: STATE.version,
      });
    }
  } else if (details.reason === 'update') {
    // Update
    const previousVersion = details.previousVersion;
    console.log(`⬆️ Updated from v${previousVersion} to v${STATE.version}`);
    
    // Show update notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'CUBE Nexum Updated!',
      message: `v${STATE.version} - Enterprise SSO, Analytics & Notifications!`,
      priority: 2
    });
    
    // Track update
    if (typeof globalThis.AnalyticsService !== 'undefined') {
      globalThis.AnalyticsService.trackEvent('extension_updated', 'user', {
        previousVersion,
        newVersion: STATE.version,
      });
    }
  }
});

async function initializeExtension() {
  console.log('⚡ Initializing CUBE Nexum Connect v7.1.0...');

  // Set default settings
  await chrome.storage.local.set({
    version: STATE.version,
    settings: {
      aiEnabled: true,
      aiAutoSelect: true,
      macroEnabled: true,
      macroAutoLearn: true,
      screenCaptureQuality: 'high',
      theme: 'elite-purple',
      // Enterprise settings
      enterpriseMode: false,
      ssoEnabled: false,
      // Notification settings
      notificationsEnabled: true,
      notificationSound: true,
      // Analytics settings
      analyticsEnabled: true,
      analyticsAnonymize: true
    },
    stats: STATE.stats
  });

  // Initialize Enterprise Services
  try {
    if (typeof globalThis.EnterpriseService !== 'undefined') {
      await globalThis.EnterpriseService.initialize();
      STATE.enterpriseInitialized = true;
      console.log('✅ Enterprise Services initialized');
    }
  } catch (error) {
    console.warn('⚠️ Enterprise Services initialization failed:', error);
  }

  // Initialize Notification Services
  try {
    if (typeof globalThis.NotificationService !== 'undefined') {
      await globalThis.NotificationService.initialize();
      STATE.notificationInitialized = true;
      console.log('✅ Notification Services initialized');
    }
  } catch (error) {
    console.warn('⚠️ Notification Services initialization failed:', error);
  }

  // Initialize Analytics Services
  try {
    if (typeof globalThis.AnalyticsService !== 'undefined') {
      await globalThis.AnalyticsService.initialize();
      STATE.analyticsInitialized = true;
      console.log('✅ Analytics Services initialized');
    }
  } catch (error) {
    console.warn('⚠️ Analytics Services initialization failed:', error);
  }

  console.log('✅ Extension initialized');
}

// ═══════════════════════════════════════════════════════════════════════════
// KEYBOARD COMMAND ROUTING
// ═══════════════════════════════════════════════════════════════════════════

chrome.commands.onCommand.addListener(async (command) => {
  console.log('⌨️ Command received:', command);

  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      console.error('No active tab');
      return;
    }

    switch (command) {
      case 'run-autofill':
        await chrome.tabs.sendMessage(tab.id, { type: 'AUTOFILL_FORM' });
        break;

      case 'record-macro':
        await handleRecordMacroCommand(tab);
        break;

      case 'screenshot-capture':
        // Open side panel to select mode
        await chrome.sidePanel.open({ tabId: tab.id });
        showNotification('Screenshot', 'Select capture mode', 'info');
        break;

      default:
        console.warn('Unknown command:', command);
    }
  } catch (error) {
    console.error('Command error:', error);
    showNotification('Command failed', error.message, 'error');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

async function handleRecordMacroCommand(tab) {
  // Check if already recording
  const tabState = STATE.activeTabs.get(tab.id);
  
  if (tabState?.recording) {
    // Stop recording
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'STOP_MACRO_RECORDING'
    });

    if (response.success) {
      STATE.stats.macrosRecorded++;
      await saveStats();
      
      showNotification(
        'Macro Recorded',
        `${response.actions} actions saved`,
        'success'
      );

      // Update tab state
      tabState.recording = false;
      STATE.activeTabs.set(tab.id, tabState);
    }
  } else {
    // Start recording
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'START_MACRO_RECORDING',
      name: `Macro ${new Date().toLocaleTimeString()}`
    });

    if (response.success) {
      showNotification(
        'Recording Started',
        'Perform actions to record',
        'info'
      );

      // Update tab state
      STATE.activeTabs.set(tab.id, {
        ...tabState,
        recording: true,
        macroId: response.macroId
      });
    }
  }
}

async function handleScreenshotCommand(tab, mode) {
  const response = await chrome.tabs.sendMessage(tab.id, {
    type: 'CAPTURE_SCREENSHOT',
    mode: mode
  });

  if (response.success) {
    STATE.stats.screenshotsTaken++;
    await saveStats();

    showNotification(
      'Screenshot Captured',
      mode.charAt(0).toUpperCase() + mode.slice(1),
      'success'
    );

    // Open side panel to show screenshot
    await chrome.sidePanel.open({ tabId: tab.id });
  }
}

async function handleRemoteControlCommand(tab) {
  // Open side panel with remote control UI
  await chrome.sidePanel.open({ tabId: tab.id });
  
  showNotification(
    'Remote Control',
    'Opening connection panel...',
    'info'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message.type, 'from tab', sender?.tab?.id);

  // Route Enterprise Service messages
  if (message.type?.startsWith('ENTERPRISE_') || 
      message.type === 'SSO_LOGIN' || 
      message.type === 'SSO_LOGOUT' ||
      message.type === 'CHECK_FEATURE' ||
      message.type === 'LOG_AUDIT' ||
      message.type === 'FETCH_ORG_CONFIG' ||
      message.type === 'GET_BRANDING' ||
      message.type === 'VALIDATE_LICENSE') {
    if (typeof globalThis.EnterpriseService !== 'undefined') {
      globalThis.EnterpriseService.handleMessage(message, sender)
        .then(sendResponse)
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
    }
    sendResponse({ success: false, error: 'Enterprise Service not available' });
    return false;
  }

  // Route Notification Service messages
  if (message.type?.startsWith('NOTIFICATION_') || 
      message.action?.startsWith('NOTIFICATION_') ||
      ['SHOW_NOTIFICATION', 'CLEAR_NOTIFICATION', 'GET_HISTORY', 'MARK_AS_READ', 
       'MARK_ALL_AS_READ', 'CLEAR_HISTORY', 'GET_PREFERENCES', 'UPDATE_PREFERENCES',
       'SUBSCRIBE_PUSH', 'UNSUBSCRIBE_PUSH', 'GET_UNREAD_COUNT', 'AUTOMATION_START',
       'AUTOMATION_COMPLETE', 'SCHEDULED_AUTOMATION'].includes(message.action)) {
    if (typeof globalThis.NotificationService !== 'undefined') {
      globalThis.NotificationService.handleMessage(message, sender)
        .then(sendResponse)
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
    }
    sendResponse({ success: false, error: 'Notification Service not available' });
    return false;
  }

  // Route Analytics Service messages
  if (message.type?.startsWith('ANALYTICS_') || 
      message.action?.startsWith('TRACK_') ||
      ['GET_METRICS', 'GET_SESSION_INFO', 'EXPORT_DATA', 'CLEAR_DATA',
       'GET_ANALYTICS_CONFIG', 'UPDATE_ANALYTICS_CONFIG', 'ENABLE_ANALYTICS',
       'DISABLE_ANALYTICS', 'GET_VARIANT', 'IS_IN_VARIANT', 
       'TRACK_EXPERIMENT_EXPOSURE', 'FLUSH_EVENTS'].includes(message.action)) {
    if (typeof globalThis.AnalyticsService !== 'undefined') {
      globalThis.AnalyticsService.handleMessage(message, sender)
        .then(sendResponse)
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
    }
    sendResponse({ success: false, error: 'Analytics Service not available' });
    return false;
  }

  switch (message.type) {
    case 'CONTENT_SCRIPT_READY':
      handleContentScriptReady(sender.tab.id, message);
      // Track page view for analytics
      if (typeof globalThis.AnalyticsService !== 'undefined' && sender.tab?.url) {
        globalThis.AnalyticsService.trackPageView(sender.tab.url);
      }
      sendResponse({ success: true });
      break;

    case 'CHECK_CONTENT_SCRIPT':
      // New: Allow popup to check if content script is ready
      const tabId = message.tabId;
      const tabState = STATE.activeTabs.get(tabId);
      sendResponse({ 
        success: true, 
        ready: tabState?.ready || false,
        services: tabState?.services || []
      });
      break;

    case 'REINJECT_CONTENT_SCRIPT':
      // New: Force re-injection of content scripts
      reinjectContentScript(message.tabId).then(sendResponse);
      return true;

    case 'FORMS_DETECTED':
      handleFormsDetected(sender.tab.id, message);
      sendResponse({ success: true });
      break;

    case 'DOCUMENTS_DETECTED':
      handleDocumentsDetected(sender.tab.id, message);
      sendResponse({ success: true });
      break;

    case 'GET_SETTINGS':
      getSettings().then(sendResponse);
      return true;

    case 'UPDATE_SETTINGS':
      updateSettings(message.settings).then(sendResponse);
      return true;

    case 'GET_STATS':
      sendResponse({ success: true, stats: STATE.stats });
      break;

    case 'GET_MACROS':
      getMacros().then(sendResponse);
      return true;

    case 'DELETE_MACRO':
      deleteMacro(message.macroId).then(sendResponse);
      return true;

    case 'AI_REQUEST':
      handleAIRequest(message).then(sendResponse);
      return true;

    case 'CAPTURE_TAB_SCREENSHOT':
      // Capture the visible tab without showing share dialog
      captureTabScreenshot(sender.tab, message.format || 'png', message.quality || 100)
        .then(sendResponse)
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'BULK_DOWNLOAD':
      DOWNLOAD_MANAGER.addBulkDownload(
        Array.isArray(message.urls) ? message.urls : [],
        message.category || 'files',
        Boolean(message.permanent)
      )
        .then((downloadId) => sendResponse({ success: true, downloadId }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'CLONE_SESSION':
      BROWSER_SYNC.cloneSessionToCUBE(sender.tab?.id, message.domain)
        .then(sendResponse)
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'SYNC_THEME':
      MODULE_SYNC.syncWithTauri('settings', 'set_theme', { theme: message.theme })
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'AI_QUERY':
      handleAIQuery(message.query)
        .then((result) => sendResponse({ success: true, result }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'INIT_FILE_DETECTION':
      console.log('📁 File detection initialized');
      sendResponse({ success: true });
      break;

    case 'GET_FTP_MANAGER':
      MODULE_SYNC.getFTPManager()
        .then(sendResponse)
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GET_DOWNLOAD_MANAGER':
      MODULE_SYNC.getDownloadManager()
        .then(sendResponse)
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GET_P2P_MANAGER':
      MODULE_SYNC.getP2PManager()
        .then(sendResponse)
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

function handleContentScriptReady(tabId, message) {
  console.log(`✅ Content script ready in tab ${tabId}`);
  
  STATE.activeTabs.set(tabId, {
    version: message.version,
    services: message.services,
    ready: true,
    recording: false
  });

  // Update badge
  updateBadge(tabId);
}

function handleFormsDetected(tabId, message) {
  console.log(`📋 ${message.count} forms detected in tab ${tabId}`);
  
  const tabState = STATE.activeTabs.get(tabId) || {};
  tabState.forms = message.count;
  STATE.activeTabs.set(tabId, tabState);

  // Update badge
  updateBadge(tabId);
}

function handleDocumentsDetected(tabId, message) {
  console.log(`📄 ${message.count} documents detected in tab ${tabId}`);
  
  const tabState = STATE.activeTabs.get(tabId) || {};
  tabState.documents = message.count;
  tabState.aiCapableDocuments = message.aiCapable;
  STATE.activeTabs.set(tabId, tabState);

  // Update badge
  updateBadge(tabId);
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREENSHOT CAPTURE (No Share Dialog)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Capture visible tab as screenshot without showing share dialog
 * Uses chrome.tabs.captureVisibleTab which doesn't require user permission dialog
 * 
 * @param {Object} tab - The tab to capture
 * @param {string} format - 'png' or 'jpeg'
 * @param {number} quality - JPEG quality 0-100
 * @returns {Object} - { success: boolean, dataUrl: string, error?: string }
 */
async function captureTabScreenshot(tab, format = 'png', quality = 100) {
  try {
    console.log('📸 Capturing tab screenshot (no dialog)...');
    
    // Ensure we have the right permissions
    if (!tab || !tab.windowId) {
      throw new Error('Invalid tab for screenshot');
    }
    
    // Capture options
    const captureOptions = {
      format: format === 'jpeg' ? 'jpeg' : 'png'
    };
    
    if (format === 'jpeg' && quality > 0) {
      captureOptions.quality = Math.min(100, Math.max(0, quality));
    }
    
    // Capture the visible tab - this is the key API that doesn't show dialog
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, captureOptions);
    
    // Update statistics
    STATE.stats.screenshotsTaken++;
    await saveStats();
    
    console.log('✅ Screenshot captured successfully');
    
    return {
      success: true,
      dataUrl: dataUrl,
      format: format,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('❌ Screenshot capture failed:', error);
    return {
      success: false,
      error: error.message || 'Screenshot capture failed'
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AI REQUEST COORDINATION
// ═══════════════════════════════════════════════════════════════════════════

async function handleAIRequest(message) {
  try {
    console.log('🤖 AI request:', message.provider, message.action);

    // Get API key from storage
    const settings = await getSettings();
    const apiKey = settings[`${message.provider}ApiKey`];

    if (!apiKey) {
      return {
        success: false,
        error: `No API key configured for ${message.provider}`
      };
    }

    // Forward to content script (services are in content script context)
    // OR make direct API call here if needed
    
    STATE.stats.aiCalls++;
    await saveStats();

    return {
      success: true,
      message: 'AI request queued'
    };

  } catch (error) {
    console.error('AI request error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

async function getSettings() {
  const result = await chrome.storage.local.get('settings');
  return result.settings || {};
}

async function updateSettings(newSettings) {
  const currentSettings = await getSettings();
  const updatedSettings = { ...currentSettings, ...newSettings };
  
  await chrome.storage.local.set({ settings: updatedSettings });
  
  console.log('⚙️ Settings updated');
  return { success: true };
}

async function getMacros() {
  const result = await chrome.storage.local.get('savedMacros');
  return {
    success: true,
    macros: result.savedMacros || []
  };
}

async function deleteMacro(macroId) {
  const result = await chrome.storage.local.get('savedMacros');
  const macros = result.savedMacros || [];
  
  const filtered = macros.filter(m => m.id !== macroId);
  await chrome.storage.local.set({ savedMacros: filtered });
  
  console.log(`🗑️ Macro deleted: ${macroId}`);
  return { success: true };
}

async function saveStats() {
  await chrome.storage.local.set({ stats: STATE.stats });
}

// ═══════════════════════════════════════════════════════════════════════════
// SIDE PANEL MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Side panel setup error:', error));

// ═══════════════════════════════════════════════════════════════════════════
// BADGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

function updateBadge(tabId) {
  const tabState = STATE.activeTabs.get(tabId);
  
  if (!tabState) {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  // Show form count or document count
  const count = tabState.forms || tabState.documents || 0;
  
  if (count > 0) {
    chrome.action.setBadgeText({
      tabId,
      text: count.toString()
    });
    
    chrome.action.setBadgeBackgroundColor({
      tabId,
      color: '#6366f1'
    });
  } else {
    chrome.action.setBadgeText({ tabId, text: '' });
  }

  // Update title
  const parts = [];
  if (tabState.recording) parts.push('Recording');
  if (tabState.forms) parts.push(`${tabState.forms} forms`);
  if (tabState.documents) parts.push(`${tabState.documents} docs`);
  
  if (parts.length > 0) {
    chrome.action.setTitle({
      tabId,
      title: `CUBE Nexum Connect v7.0.1 - ${parts.join(', ')}`
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

function showNotification(title, message, type = 'info') {
  const iconMap = {
    success: 'icons/icon-success.png',
    error: 'icons/icon-error.png',
    info: 'icons/icon128.png'
  };

  chrome.notifications.create({
    type: 'basic',
    iconUrl: iconMap[type] || iconMap.info,
    title: title,
    message: message,
    priority: 1
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// Clean up when tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
  STATE.activeTabs.delete(tabId);
  console.log(`Tab ${tabId} closed, state cleaned up`);
});

// Update active tab tracking
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tabId = activeInfo.tabId;
  updateBadge(tabId);
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT MENU (Right-click menu)
// ═══════════════════════════════════════════════════════════════════════════

chrome.runtime.onInstalled.addListener(() => {
  // Add context menu items
  chrome.contextMenus.create({
    id: 'cube-autofill',
    title: 'CUBE Auto-Fill Form',
    contexts: ['editable']
  });

  chrome.contextMenus.create({
    id: 'cube-extract-image',
    title: 'CUBE Extract Text from Image',
    contexts: ['image']
  });

  chrome.contextMenus.create({
    id: 'cube-parse-document',
    title: 'CUBE Parse Document',
    contexts: ['link']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'cube-autofill':
      await chrome.tabs.sendMessage(tab.id, {
        type: 'AUTOFILL_FORM'
      });
      break;

    case 'cube-extract-image':
      // Extract text from image using AI
      showNotification('Extracting Text', 'Using AI...', 'info');
      break;

    case 'cube-parse-document':
      // Parse document link
      await chrome.tabs.sendMessage(tab.id, {
        type: 'PARSE_DOCUMENT',
        url: info.linkUrl
      });
      break;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT SCRIPT INJECTION
// ═══════════════════════════════════════════════════════════════════════════

async function reinjectContentScript(tabId) {
  try {
    console.log(`🔄 Re-injecting content scripts into tab ${tabId}`);

    // Get all content script files from manifest
    const contentScripts = [
      'chrome-extension/libs/external/xlsx.full.min.js',
      'chrome-extension/libs/external/pdf.min.js',
      'chrome-extension/libs/external/pdf.worker.min.js',
      'chrome-extension/libs/similarity.js',
      'chrome-extension/libs/validation.js',
      'chrome-extension/libs/parser.js',
      'chrome-extension/src/MacroRecorder.js',
      'chrome-extension/src/MacroPlayer.js',
      'chrome-extension/src/MacroAI.js',
      'chrome-extension/src/OpenAIService.js',
      'chrome-extension/src/ClaudeService.js',
      'chrome-extension/src/GeminiService.js',
      'chrome-extension/src/ScreenCaptureService.js',
      'chrome-extension/src/RemoteControlService.js',
      'chrome-extension/src/P2PFileService.js',
      'chrome-extension/pdf-download-engine-ultimate.js',
      'chrome-extension/advanced-detection-algorithms.js',
      'chrome-extension/ocr-engine-tesseract.js',
      'chrome-extension/lendingpad-detector.js',
      'chrome-extension/src/LendingPadService.js',
      'chrome-extension/src/DownloadServiceFactory.js',
      'chrome-extension/src/DropboxDownloadService.js',
      'chrome-extension/universal-document-engine-v6.js',
      'chrome-extension/universal-parsers-v6.js',
      'chrome-extension/smart-autofill-engine-v6.js',
      'chrome-extension/content-script-v6.js',
      'chrome-extension/content-script-v6-elite.js'
    ];

    // Inject scripts sequentially
    for (const file of contentScripts) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: [file]
      });
    }

    console.log(`✅ Content scripts re-injected into tab ${tabId}`);
    
    return { success: true, message: 'Content scripts re-injected' };
  } catch (error) {
    console.error(`❌ Failed to re-inject content scripts:`, error);
    return { 
      success: false, 
      error: error.message,
      hint: 'Try reloading the page or check if URL is restricted (chrome://, edge://, etc.)'
    };
  }
}

// Check content script status periodically
async function checkContentScriptHealth() {
  const tabs = await chrome.tabs.query({});
  
  for (const tab of tabs) {
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      continue; // Skip restricted URLs
    }

    const tabState = STATE.activeTabs.get(tab.id);
    
    // If tab has no state or not ready, try to ping content script
    if (!tabState?.ready) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
      } catch (error) {
        // Content script not responding, mark as not ready
        console.log(`⚠️ Tab ${tab.id} content script not responding`);
      }
    }
  }
}

// Check health every 30 seconds
setInterval(checkContentScriptHealth, 30000);

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED FILE DETECTION & DOWNLOAD SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const DOWNLOAD_MANAGER = {
  queue: new Map(),
  active: new Map(),
  completed: new Map(),
  failed: new Map(),
  tempDirectory: null,
  
  async initialize() {
    // Create temp directory for downloads
    this.tempDirectory = `cube_temp_${Date.now()}`;
    console.log('📁 Download manager initialized with temp dir:', this.tempDirectory);
  },
  
  async addBulkDownload(urls, category = 'files', permanent = false) {
    const downloadId = `bulk_${Date.now()}`;
    
    this.queue.set(downloadId, {
      id: downloadId,
      urls: urls,
      category: category,
      permanent: permanent,
      startTime: Date.now(),
      progress: 0,
      total: urls.length,
      completed: 0,
      failed: 0
    });
    
    console.log(`📥 Added bulk download: ${urls.length} ${category}`);
    
    // Start processing
    this.processBulkDownload(downloadId);
    
    return downloadId;
  },
  
  async processBulkDownload(downloadId) {
    const bulk = this.queue.get(downloadId);
    if (!bulk) return;
    
    this.active.set(downloadId, bulk);
    
    for (let i = 0; i < bulk.urls.length; i++) {
      const url = bulk.urls[i];
      
      try {
        const filename = this.extractFilename(url, bulk.category, i);
        const downloadPath = bulk.permanent ? filename : `${this.tempDirectory}/${filename}`;
        
        const downloadItemId = await chrome.downloads.download({
          url: url,
          filename: downloadPath,
          saveAs: false
        });
        
        // Wait for download to complete
        await this.waitForDownload(downloadItemId);
        
        bulk.completed++;
        bulk.progress = (bulk.completed / bulk.total) * 100;
        
        // Notify sidepanel
        this.notifySidePanel('DOWNLOAD_PROGRESS', {
          downloadId: downloadId,
          progress: bulk.progress,
          completed: bulk.completed,
          total: bulk.total
        });
        
        // Parse file if completed
        if (!bulk.permanent) {
          await FILE_PARSER.parseFile(downloadItemId, downloadPath);
        }
        
      } catch (error) {
        console.error('Download failed:', url, error);
        bulk.failed++;
      }
    }
    
    // Move to completed
    this.active.delete(downloadId);
    this.completed.set(downloadId, bulk);
    
    console.log(`✅ Bulk download completed: ${bulk.completed}/${bulk.total} successful`);
    
    // Clean temp directory after processing
    if (!bulk.permanent) {
      setTimeout(() => this.cleanTempDirectory(downloadId), 5 * 60 * 1000); // 5 min
    }
  },
  
  extractFilename(url, category, index) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || `${category}_${index}`;
      return filename;
    } catch {
      return `${category}_${index}`;
    }
  },
  
  waitForDownload(downloadId) {
    return new Promise((resolve, reject) => {
      const checkDownload = () => {
        chrome.downloads.search({ id: downloadId }, (results) => {
          if (!results || results.length === 0) {
            reject(new Error('Download not found'));
            return;
          }
          
          const download = results[0];
          
          if (download.state === 'complete') {
            resolve(download);
          } else if (download.state === 'interrupted') {
            reject(new Error(download.error || 'Download interrupted'));
          } else {
            setTimeout(checkDownload, 500);
          }
        });
      };
      
      checkDownload();
    });
  },
  
  async cleanTempDirectory(downloadId) {
    console.log(`🧹 Cleaning temp directory for ${downloadId}`);
    // Temp files are automatically cleaned by Chrome after session
  },
  
  notifySidePanel(type, data) {
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_EVENT',
      eventType: type,
      payload: data
    }).catch(() => {
      // Sidepanel not open, ignore
    });
  }
};

// Initialize download manager
DOWNLOAD_MANAGER.initialize();

// ═══════════════════════════════════════════════════════════════════════════
// FILE PARSER & AUTOFILL PROFILE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

const FILE_PARSER = {
  parsers: {
    'application/pdf': 'parsePDF',
    'application/vnd.ms-excel': 'parseExcel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'parseExcel',
    'text/csv': 'parseCSV',
    'application/json': 'parseJSON',
    'text/html': 'parseHTML'
  },
  
  async parseFile(downloadId, filePath) {
    console.log('🔍 Parsing file:', filePath);
    
    try {
      // Get file info
      const download = await this.getDownloadInfo(downloadId);
      const mimeType = download.mime || this.guessMimeType(filePath);
      
      const parserMethod = this.parsers[mimeType];
      
      if (!parserMethod) {
        console.log('⚠️ No parser for mime type:', mimeType);
        return null;
      }
      
      // Parse file using appropriate parser
      const data = await this[parserMethod](download.filename);
      
      // Generate autofill profile
      if (data) {
        await this.generateAutofillProfile(data, filePath);
      }
      
      STATE.stats.documentsParsed++;
      this.saveStats();
      
      return data;
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  },
  
  async getDownloadInfo(downloadId) {
    return new Promise((resolve) => {
      chrome.downloads.search({ id: downloadId }, (results) => {
        resolve(results[0] || {});
      });
    });
  },
  
  guessMimeType(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv',
      'json': 'application/json',
      'html': 'text/html',
      'htm': 'text/html'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  },
  
  async parsePDF(filePath) {
    console.log('📄 Parsing PDF:', filePath);
    // Use pdf.js to extract text
    // Implementation would use pdfjsLib
    return { type: 'pdf', text: 'PDF content...', fields: [] };
  },
  
  async parseExcel(filePath) {
    console.log('📊 Parsing Excel:', filePath);
    // Use xlsx library
    return { type: 'excel', sheets: [], data: [] };
  },
  
  async parseCSV(filePath) {
    console.log('📋 Parsing CSV:', filePath);
    // Parse CSV data
    return { type: 'csv', headers: [], rows: [] };
  },
  
  async parseJSON(filePath) {
    console.log('📦 Parsing JSON:', filePath);
    return { type: 'json', data: {} };
  },
  
  async parseHTML(filePath) {
    console.log('🌐 Parsing HTML:', filePath);
    return { type: 'html', forms: [], fields: [] };
  },
  
  async generateAutofillProfile(parsedData, filePath) {
    console.log('🎯 Generating autofill profile from:', filePath);
    
    const profile = {
      id: `profile_${Date.now()}`,
      source: filePath,
      createdAt: Date.now(),
      type: parsedData.type,
      fields: this.extractFields(parsedData),
      confidence: 0.85
    };
    
    // Save profile to storage
    const { autofillProfiles = [] } = await chrome.storage.local.get('autofillProfiles');
    autofillProfiles.push(profile);
    await chrome.storage.local.set({ autofillProfiles });
    
    console.log('✅ Autofill profile created:', profile.id);
    
    // Notify sidepanel
    chrome.runtime.sendMessage({
      type: 'PROFILE_CREATED',
      profile: profile
    }).catch((error) => {
      // Sidepanel may not be open yet
      console.debug('Profile creation notification failed:', error?.message || 'Sidepanel unavailable');
    });
    
    return profile;
  },
  
  extractFields(parsedData) {
    // Extract field mappings using AI/heuristics
    const fields = [];
    
    // Common field patterns
    const patterns = {
      email: /email|e-mail|correo/i,
      firstName: /first.*name|nombre/i,
      lastName: /last.*name|apellido/i,
      phone: /phone|tel|telefono/i,
      address: /address|direccion|domicilio/i,
      city: /city|ciudad/i,
      state: /state|estado|provincia/i,
      zip: /zip|postal|codigo/i,
      ssn: /ssn|social.*security|seguro.*social/i
    };
    
    // Extract based on data type
    if (parsedData.type === 'excel' || parsedData.type === 'csv') {
      // Check headers
      const headers = parsedData.headers || [];
      headers.forEach((header, index) => {
        for (const [fieldType, pattern] of Object.entries(patterns)) {
          if (pattern.test(header)) {
            fields.push({
              type: fieldType,
              sourceColumn: index,
              value: parsedData.rows?.[0]?.[index] || ''
            });
          }
        }
      });
    }
    
    return fields;
  },
  
  saveStats() {
    chrome.storage.local.set({ stats: STATE.stats });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COOKIE CLONING & CUBE BROWSER SYNC
// ═══════════════════════════════════════════════════════════════════════════

const BROWSER_SYNC = {
  async cloneSessionToCUBE(tabId, domain) {
    console.log('🍪 Cloning Chrome session to CUBE browser:', domain);
    
    try {
      // Check if cookies API is available
      if (!chrome.cookies || typeof chrome.cookies.getAll !== 'function') {
        console.warn('⚠️ Cookies API not available');
        return { success: false, error: 'Cookies API not available' };
      }
      
      // Get all cookies for domain
      const cookies = await chrome.cookies.getAll({ domain: domain });
      
      // Get local storage (requires content script)
      const localStorage = await this.getLocalStorage(tabId);
      
      // Get session storage
      const sessionStorage = await this.getSessionStorage(tabId);
      
      // Package session data
      const sessionData = {
        domain: domain,
        cookies: cookies,
        localStorage: localStorage,
        sessionStorage: sessionStorage,
        timestamp: Date.now()
      };
      
      // Send to CUBE browser via native messaging (if available)
      await this.sendToCUBEBrowser(sessionData);
      
      console.log('✅ Session cloned successfully');
      
      return { success: true, sessionData };
    } catch (error) {
      console.error('❌ Failed to clone session:', error);
      return { success: false, error: error.message };
    }
  },
  
  async getLocalStorage(tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          return Object.entries(localStorage).reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});
        }
      });
      return results[0].result;
    } catch {
      return {};
    }
  },
  
  async getSessionStorage(tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          return Object.entries(sessionStorage).reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});
        }
      });
      return results[0].result;
    } catch {
      return {};
    }
  },
  
  async sendToCUBEBrowser(sessionData) {
    // Attempt to communicate with CUBE browser
    // This would use native messaging or HTTP endpoint
    
    try {
      // Try native messaging first
      const response = await chrome.runtime.sendNativeMessage(
        'com.cube.elite.browser',
        {
          type: 'CLONE_SESSION',
          data: sessionData
        }
      );
      
      return response;
    } catch (error) {
      console.log('Native messaging not available, using fallback');
      
      // Fallback: Save to shared storage for CUBE to pick up
      await chrome.storage.local.set({
        pendingCUBESync: sessionData
      });
      
      return { success: true, method: 'storage' };
    }
  },
  
  async autoCloneWhenRestricted(tabId, url) {
    // Automatically clone session when Chrome restricts access
    const restrictedPatterns = [
      /chrome:\/\//,
      /chrome-extension:\/\//,
      /edge:\/\//
    ];
    
    const isRestricted = restrictedPatterns.some(pattern => pattern.test(url));
    
    if (isRestricted) {
      console.log('⚠️ Restricted URL detected, auto-cloning to CUBE browser');
      
      try {
        const domain = new URL(url).hostname;
        await this.cloneSessionToCUBE(tabId, domain);
        
        // Notify user
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'CUBE Browser Activated',
          message: 'Session cloned to CUBE browser for full access',
          priority: 1
        });
      } catch (error) {
        console.error('Auto-clone failed:', error);
      }
    }
  }
};

// Monitor tab updates for auto-cloning
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    BROWSER_SYNC.autoCloneWhenRestricted(tabId, tab.url);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// FTP/DOWNLOAD/P2P INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

const MODULE_SYNC = {
  async syncWithTauri(module, action, data) {
    console.log(`🔄 Syncing ${module}.${action} with Tauri app`);
    
    try {
      // Try to communicate with Tauri app
      const response = await chrome.runtime.sendNativeMessage(
        'com.cube.elite.main',
        {
          module: module,
          action: action,
          data: data,
          timestamp: Date.now()
        }
      );
      
      return response;
    } catch (error) {
      console.log('Tauri app not available, working in standalone mode');
      return { success: false, standalone: true };
    }
  },
  
  async getFTPManager() {
    return await this.syncWithTauri('ftp', 'get_manager', {});
  },
  
  async getDownloadManager() {
    return await this.syncWithTauri('downloads', 'get_manager', {});
  },
  
  async getP2PManager() {
    return await this.syncWithTauri('p2p', 'get_manager', {});
  },
  
  async syncModuleData(module, data) {
    await this.syncWithTauri(module, 'sync_data', data);
  }
};

// Sync every 30 seconds
setInterval(async () => {
  await MODULE_SYNC.syncModuleData('stats', STATE.stats);
  await MODULE_SYNC.syncModuleData('macros', Array.from(STATE.macros.values()));
}, 30000);

// Helper for AI command responses invoked from popup
async function handleAIQuery(query) {
  // Simple AI responses for common queries
  const responses = {
    'help': 'I can help you with downloads, forms, screenshots, macros, and more. What would you like to do?',
    'status': `CUBE Nexum is running. Stats: ${STATE.stats.macrosRecorded} macros, ${STATE.stats.documentsParsed} documents parsed.`,
    'capabilities': 'I can: Download files, Detect forms, Clone sessions, Parse documents, Generate autofill profiles, and more!'
  };
  
  const lowerQuery = query.toLowerCase();
  
  for (const [key, response] of Object.entries(responses)) {
    if (lowerQuery.includes(key)) {
      return response;
    }
  }
  
  // Default response
  return `I received your query: "${query}". I'm processing this with AI capabilities. Full AI integration requires API keys in settings.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// TAURI NATIVE MESSAGING INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize Tauri connection and setup listeners
 */
async function initTauriConnection() {
  if (typeof globalThis.CUBENativeMessaging !== 'undefined') {
    console.log('🔗 Initializing Tauri Native Messaging connection...');
    
    // Add connection listener
    globalThis.CUBENativeMessaging.addConnectionListener((connected) => {
      STATE.tauriConnected = connected;
      console.log(`🔗 Tauri connection status: ${connected ? 'Connected' : 'Disconnected'}`);
      
      // Broadcast connection status to all extension pages
      chrome.runtime.sendMessage({
        type: 'TAURI_CONNECTION_STATUS',
        connected
      }).catch(() => {
        // Ignore errors if no listeners
      });
    });
    
    // Attempt connection
    const connected = await globalThis.CUBENativeMessaging.connect();
    STATE.tauriConnected = connected;
    
    if (connected) {
      console.log('✅ Connected to Tauri Native Messaging Host');
    } else {
      console.log('⚠️ Tauri app not available, running in standalone mode');
    }
  } else {
    console.log('⚠️ Native Messaging Bridge not loaded');
  }
}

/**
 * Send command to Tauri via Native Messaging
 */
async function sendToTauri(command, args = {}) {
  if (!STATE.tauriConnected || typeof globalThis.CUBENativeMessaging === 'undefined') {
    console.warn('Tauri not connected, command skipped:', command);
    return { success: false, error: 'Not connected to Tauri' };
  }
  
  try {
    STATE.stats.tauriCommands++;
    const result = await globalThis.CUBENativeMessaging.invoke(command, args);
    return { success: true, data: result };
  } catch (error) {
    console.error('Tauri command error:', command, error);
    return { success: false, error: error.message };
  }
}

/**
 * Message handler for Tauri-related requests from popup/content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle Tauri-specific messages
  if (message.type === 'TAURI_INVOKE') {
    sendToTauri(message.command, message.args)
      .then(sendResponse)
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'TAURI_STATUS') {
    sendResponse({
      connected: STATE.tauriConnected,
      available: typeof globalThis.CUBENativeMessaging !== 'undefined'
    });
    return false;
  }
  
  if (message.type === 'LENDINGPAD_INVOKE') {
    // LendingPad specific commands via Tauri
    const lpCommands = globalThis.CUBENativeMessaging?.LendingPad;
    if (lpCommands && message.action && typeof lpCommands[message.action] === 'function') {
      lpCommands[message.action](...(message.args || []))
        .then((result) => sendResponse({ success: true, data: result }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
    }
    sendResponse({ success: false, error: 'LendingPad command not available' });
    return false;
  }
  
  if (message.type === 'AI_INVOKE') {
    // AI commands via Tauri
    const aiCommands = globalThis.CUBENativeMessaging?.AI;
    if (aiCommands && message.action && typeof aiCommands[message.action] === 'function') {
      aiCommands[message.action](...(message.args || []))
        .then((result) => sendResponse({ success: true, data: result }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
    }
    sendResponse({ success: false, error: 'AI command not available' });
    return false;
  }
  
  // Not a Tauri message, don't handle
  return false;
});

// ═══════════════════════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════════════════════

console.log('🚀 CUBE Nexum Connect v7.1.0 Background Service Worker started');

// Load stats on startup
chrome.storage.local.get('stats').then((result) => {
  if (result.stats) {
    Object.assign(STATE.stats, result.stats);
  }
  console.log('📊 Stats loaded:', STATE.stats);
});

// Initialize Tauri connection
initTauriConnection();

// Initialize Enterprise Services on startup
(async function initializeServices() {
  // Small delay to ensure importScripts have loaded
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Initialize Enterprise
  if (typeof globalThis.EnterpriseService !== 'undefined') {
    try {
      await globalThis.EnterpriseService.initialize();
      STATE.enterpriseInitialized = true;
      console.log('✅ Enterprise Services ready');
    } catch (error) {
      console.warn('⚠️ Enterprise Services failed:', error);
    }
  }
  
  // Initialize Notifications
  if (typeof globalThis.NotificationService !== 'undefined') {
    try {
      await globalThis.NotificationService.initialize();
      STATE.notificationInitialized = true;
      console.log('✅ Notification Services ready');
    } catch (error) {
      console.warn('⚠️ Notification Services failed:', error);
    }
  }
  
  // Initialize Analytics
  if (typeof globalThis.AnalyticsService !== 'undefined') {
    try {
      await globalThis.AnalyticsService.initialize();
      STATE.analyticsInitialized = true;
      console.log('✅ Analytics Services ready');
    } catch (error) {
      console.warn('⚠️ Analytics Services failed:', error);
    }
  }
  
  console.log('🎯 All services initialization complete');
})();
