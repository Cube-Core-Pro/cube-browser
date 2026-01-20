// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 POPUP v7.1.0 - Enterprise Edition Popup Script
// ═══════════════════════════════════════════════════════════════════════════════
//
// ROLE: Main popup script for Chrome Extension v7.1.0
//
// RESPONSIBILITIES:
// ✅ Tab Navigation
// ✅ Enterprise SSO Integration
// ✅ Notification Center
// ✅ Analytics Dashboard
// ✅ Document Detection
// ✅ Autofill Management
// ✅ Macro Control
// ✅ Settings Management
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

const PopupState = {
  currentTab: 'docs',
  enterpriseState: null,
  notificationState: null,
  analyticsState: null,
  settings: {},
  activeTabId: null,
};

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 CUBE Nexum Connect v7.1.0 Popup initialized');
  
  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  PopupState.activeTabId = tab?.id;
  
  // Initialize UI components
  initializeTabs();
  initializeModals();
  
  // Load states from background
  await loadEnterpriseState();
  await loadNotificationState();
  await loadAnalyticsState();
  await loadSettings();
  
  // Update UI based on states
  updateEnterpriseUI();
  updateNotificationUI();
  updateAnalyticsUI();
  
  // Setup event listeners
  setupEnterpriseListeners();
  setupNotificationListeners();
  setupAnalyticsListeners();
  setupSettingsListeners();
  setupDocumentListeners();
  setupAutofillListeners();
  setupMacroListeners();
  
  // Listen for background messages
  setupMessageListeners();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

function initializeTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active panel
      panels.forEach(p => p.classList.remove('active'));
      const panel = document.getElementById(`${tabName}-panel`);
      if (panel) {
        panel.classList.add('active');
      }
      
      PopupState.currentTab = tabName;
      
      // Track tab change
      trackEvent('popup_tab_changed', { tab: tabName });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTERPRISE FEATURES
// ═══════════════════════════════════════════════════════════════════════════════

async function loadEnterpriseState() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_ENTERPRISE_STATE',
    });
    
    if (response?.success) {
      PopupState.enterpriseState = response.state;
    }
  } catch (error) {
    console.warn('Failed to load enterprise state:', error);
  }
}

function updateEnterpriseUI() {
  const state = PopupState.enterpriseState;
  
  // Update header elements
  const licenseBadge = document.getElementById('license-badge');
  const userAvatar = document.getElementById('user-avatar');
  const enterpriseBanner = document.getElementById('enterprise-banner');
  const userInfoBar = document.getElementById('user-info-bar');
  const logoContainer = document.getElementById('logo-container');
  const appName = document.getElementById('app-name');
  
  if (state?.authenticated) {
    // User is logged in
    enterpriseBanner?.classList.add('hidden');
    userInfoBar?.classList.remove('hidden');
    
    // Update user info
    const displayName = document.getElementById('user-display-name');
    const organization = document.getElementById('user-organization');
    const avatarImg = document.getElementById('user-avatar-img');
    
    if (displayName && state.session) {
      displayName.textContent = state.session.displayName || state.session.email;
    }
    
    if (organization && state.config) {
      organization.textContent = state.config.organizationName;
    }
    
    // Update license badge
    if (licenseBadge && state.license) {
      licenseBadge.textContent = state.license.type || 'Enterprise';
      licenseBadge.classList.add('enterprise');
    }
    
    // Apply branding if available
    if (state.branding) {
      applyBranding(state.branding);
    }
    
    // Update enterprise settings section
    const notLoggedIn = document.getElementById('enterprise-not-logged-in');
    const loggedIn = document.getElementById('enterprise-logged-in');
    
    if (notLoggedIn) notLoggedIn.classList.add('hidden');
    if (loggedIn) loggedIn.classList.remove('hidden');
    
    // Update org info
    const orgName = document.getElementById('org-name');
    const orgId = document.getElementById('org-id');
    const licenseType = document.getElementById('settings-license-type');
    const licenseSeats = document.getElementById('settings-license-seats');
    
    if (orgName && state.config) {
      orgName.textContent = state.config.organizationName;
    }
    if (orgId && state.config) {
      orgId.textContent = `ID: ${state.config.organizationId}`;
    }
    if (licenseType && state.license) {
      licenseType.textContent = state.license.type;
    }
    if (licenseSeats && state.license) {
      licenseSeats.textContent = `${state.license.seats} seats`;
    }
    
  } else {
    // User not logged in
    enterpriseBanner?.classList.remove('hidden');
    userInfoBar?.classList.add('hidden');
    
    // Reset to default branding
    if (licenseBadge) {
      licenseBadge.textContent = 'Free';
      licenseBadge.classList.remove('enterprise');
    }
    
    // Update enterprise settings section
    const notLoggedIn = document.getElementById('enterprise-not-logged-in');
    const loggedIn = document.getElementById('enterprise-logged-in');
    
    if (notLoggedIn) notLoggedIn.classList.remove('hidden');
    if (loggedIn) loggedIn.classList.add('hidden');
  }
}

function applyBranding(branding) {
  const logoContainer = document.getElementById('logo-container');
  const appName = document.getElementById('app-name');
  const footerText = document.getElementById('footer-text');
  
  if (branding.logoUrl && logoContainer) {
    logoContainer.innerHTML = `<img src="${branding.logoUrl}" alt="Logo" style="width: 24px; height: 24px;">`;
  }
  
  if (branding.appName && appName) {
    appName.textContent = branding.appName;
  }
  
  if (branding.primaryColor) {
    document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
  }
  
  if (branding.footerText && footerText) {
    footerText.textContent = branding.footerText;
  }
}

function setupEnterpriseListeners() {
  // SSO Login buttons
  const btnEnterpriseLogin = document.getElementById('btn-enterprise-login');
  const btnSsoLogin = document.getElementById('btn-sso-login');
  const btnLogout = document.getElementById('btn-logout');
  const btnStartSso = document.getElementById('btn-start-sso');
  const closeSsoModal = document.getElementById('close-sso-modal');
  
  btnEnterpriseLogin?.addEventListener('click', () => openSsoModal());
  btnSsoLogin?.addEventListener('click', () => openSsoModal());
  
  btnLogout?.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'SSO_LOGOUT' });
    await loadEnterpriseState();
    updateEnterpriseUI();
    showNotification('Logged out', 'You have been logged out successfully', 'success');
  });
  
  btnStartSso?.addEventListener('click', async () => {
    const orgId = document.getElementById('sso-org-id')?.value;
    const provider = document.getElementById('sso-provider-select')?.value || 'oidc';
    
    if (!orgId) {
      showStatus('sso-status', 'Please enter your organization ID', 'error');
      return;
    }
    
    showStatus('sso-status', 'Initiating SSO login...', 'info');
    
    try {
      // First fetch org config
      await chrome.runtime.sendMessage({
        type: 'FETCH_ORG_CONFIG',
        organizationId: orgId,
      });
      
      // Then initiate SSO
      const response = await chrome.runtime.sendMessage({
        type: 'SSO_LOGIN',
        provider: provider,
      });
      
      if (response?.success) {
        closeSsoModal.click();
        await loadEnterpriseState();
        updateEnterpriseUI();
        showNotification('Login successful', 'Welcome back!', 'success');
      } else {
        showStatus('sso-status', response?.error || 'SSO login failed', 'error');
      }
    } catch (error) {
      showStatus('sso-status', error.message || 'SSO login failed', 'error');
    }
  });
  
  closeSsoModal?.addEventListener('click', () => {
    document.getElementById('sso-modal')?.classList.add('hidden');
  });
  
  // SSO provider buttons
  document.querySelectorAll('.sso-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.dataset.provider;
      const providerSelect = document.getElementById('sso-provider-select');
      if (providerSelect) {
        if (provider === 'saml') providerSelect.value = 'saml';
        else providerSelect.value = 'oidc';
      }
      openSsoModal();
    });
  });
}

function openSsoModal() {
  document.getElementById('sso-modal')?.classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CENTER
// ═══════════════════════════════════════════════════════════════════════════════

async function loadNotificationState() {
  try {
    const [historyResponse, prefsResponse, countResponse] = await Promise.all([
      chrome.runtime.sendMessage({ action: 'GET_HISTORY' }),
      chrome.runtime.sendMessage({ action: 'GET_PREFERENCES' }),
      chrome.runtime.sendMessage({ action: 'GET_UNREAD_COUNT' }),
    ]);
    
    PopupState.notificationState = {
      history: historyResponse?.history || [],
      preferences: prefsResponse?.preferences || {},
      unreadCount: countResponse?.count || 0,
    };
  } catch (error) {
    console.warn('Failed to load notification state:', error);
    PopupState.notificationState = {
      history: [],
      preferences: {},
      unreadCount: 0,
    };
  }
}

function updateNotificationUI() {
  const state = PopupState.notificationState;
  
  // Update badge
  const notificationCount = document.getElementById('notification-count');
  if (notificationCount) {
    notificationCount.textContent = state.unreadCount > 99 ? '99+' : state.unreadCount;
    notificationCount.style.display = state.unreadCount > 0 ? 'flex' : 'none';
  }
  
  // Update unread count text
  const unreadCountText = document.getElementById('unread-count');
  if (unreadCountText) {
    unreadCountText.textContent = `${state.unreadCount} unread`;
  }
  
  // Update notification list
  const notificationList = document.getElementById('notification-list');
  if (notificationList) {
    if (state.history.length === 0) {
      notificationList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <p>No notifications</p>
          <small>You're all caught up!</small>
        </div>
      `;
    } else {
      notificationList.innerHTML = state.history.map(notification => `
        <div class="notification-item ${notification.read ? '' : 'unread'} type-${notification.type || 'info'}"
             data-id="${notification.id}">
          <span class="notification-icon">${getNotificationIcon(notification.type)}</span>
          <div class="notification-content">
            <div class="notification-title">${escapeHtml(notification.title)}</div>
            <div class="notification-body">${escapeHtml(notification.body)}</div>
            <div class="notification-time">${formatTime(notification.timestamp)}</div>
          </div>
        </div>
      `).join('');
      
      // Add click listeners
      notificationList.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.id;
          markNotificationAsRead(id);
        });
      });
    }
  }
  
  // Update preferences
  const prefsEnabled = document.getElementById('pref-notifications-enabled');
  const prefsSound = document.getElementById('pref-notification-sound');
  const prefsAutomation = document.getElementById('pref-automation-alerts');
  const prefsQuietHours = document.getElementById('pref-quiet-hours');
  
  if (prefsEnabled && state.preferences) {
    prefsEnabled.checked = state.preferences.enabled !== false;
  }
  if (prefsSound && state.preferences) {
    prefsSound.checked = state.preferences.sound !== false;
  }
  if (prefsAutomation && state.preferences?.channels) {
    prefsAutomation.checked = state.preferences.channels.automation !== false;
  }
  if (prefsQuietHours && state.preferences?.quietHours) {
    prefsQuietHours.checked = state.preferences.quietHours.enabled === true;
    
    const quietHoursConfig = document.getElementById('quiet-hours-config');
    if (quietHoursConfig) {
      quietHoursConfig.classList.toggle('hidden', !state.preferences.quietHours.enabled);
    }
    
    const startTime = document.getElementById('quiet-hours-start');
    const endTime = document.getElementById('quiet-hours-end');
    if (startTime) startTime.value = state.preferences.quietHours.start || '22:00';
    if (endTime) endTime.value = state.preferences.quietHours.end || '08:00';
  }
}

function getNotificationIcon(type) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    automation: '🤖',
    system: '⚙️',
  };
  return icons[type] || icons.info;
}

async function markNotificationAsRead(id) {
  await chrome.runtime.sendMessage({
    action: 'MARK_AS_READ',
    notificationId: id,
  });
  
  await loadNotificationState();
  updateNotificationUI();
}

function setupNotificationListeners() {
  // Mark all as read
  document.getElementById('btn-mark-all-read')?.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ action: 'MARK_ALL_AS_READ' });
    await loadNotificationState();
    updateNotificationUI();
  });
  
  // Clear all notifications
  document.getElementById('btn-clear-notifications')?.addEventListener('click', async () => {
    if (confirm('Clear all notifications?')) {
      await chrome.runtime.sendMessage({ action: 'CLEAR_HISTORY' });
      await loadNotificationState();
      updateNotificationUI();
    }
  });
  
  // Notification bell click
  document.getElementById('notification-bell')?.addEventListener('click', () => {
    // Switch to notifications tab
    const notificationsTab = document.querySelector('[data-tab="notifications"]');
    notificationsTab?.click();
  });
  
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filter = btn.dataset.filter;
      filterNotifications(filter);
    });
  });
  
  // Preference toggles
  document.getElementById('pref-notifications-enabled')?.addEventListener('change', (e) => {
    updateNotificationPreference('enabled', e.target.checked);
  });
  
  document.getElementById('pref-notification-sound')?.addEventListener('change', (e) => {
    updateNotificationPreference('sound', e.target.checked);
  });
  
  document.getElementById('pref-automation-alerts')?.addEventListener('change', (e) => {
    updateNotificationPreference('channels', { automation: e.target.checked });
  });
  
  document.getElementById('pref-quiet-hours')?.addEventListener('change', (e) => {
    const quietHoursConfig = document.getElementById('quiet-hours-config');
    quietHoursConfig?.classList.toggle('hidden', !e.target.checked);
    updateNotificationPreference('quietHours', { enabled: e.target.checked });
  });
  
  document.getElementById('quiet-hours-start')?.addEventListener('change', (e) => {
    updateNotificationPreference('quietHours', { start: e.target.value });
  });
  
  document.getElementById('quiet-hours-end')?.addEventListener('change', (e) => {
    updateNotificationPreference('quietHours', { end: e.target.value });
  });
}

function filterNotifications(filter) {
  const items = document.querySelectorAll('.notification-item');
  
  items.forEach(item => {
    if (filter === 'all') {
      item.style.display = '';
    } else if (filter === 'unread') {
      item.style.display = item.classList.contains('unread') ? '' : 'none';
    } else {
      item.style.display = item.classList.contains(`type-${filter}`) ? '' : 'none';
    }
  });
}

async function updateNotificationPreference(key, value) {
  const preferences = PopupState.notificationState.preferences || {};
  
  if (typeof value === 'object') {
    preferences[key] = { ...preferences[key], ...value };
  } else {
    preferences[key] = value;
  }
  
  await chrome.runtime.sendMessage({
    action: 'UPDATE_PREFERENCES',
    preferences: { [key]: preferences[key] },
  });
  
  PopupState.notificationState.preferences = preferences;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

async function loadAnalyticsState() {
  try {
    const [metricsResponse, sessionResponse, configResponse] = await Promise.all([
      chrome.runtime.sendMessage({ action: 'GET_METRICS' }),
      chrome.runtime.sendMessage({ action: 'GET_SESSION_INFO' }),
      chrome.runtime.sendMessage({ action: 'GET_ANALYTICS_CONFIG' }),
    ]);
    
    PopupState.analyticsState = {
      metrics: metricsResponse?.metrics || {},
      session: sessionResponse?.session || {},
      config: configResponse?.config || {},
    };
  } catch (error) {
    console.warn('Failed to load analytics state:', error);
    PopupState.analyticsState = {
      metrics: {},
      session: {},
      config: {},
    };
  }
}

function updateAnalyticsUI() {
  const state = PopupState.analyticsState;
  
  // Session stats
  const sessionDuration = document.getElementById('stat-session-duration');
  const sessionEvents = document.getElementById('stat-session-events');
  const sessionPages = document.getElementById('stat-session-pages');
  
  if (sessionDuration && state.session?.duration) {
    const minutes = Math.floor(state.session.duration / 60000);
    sessionDuration.textContent = minutes >= 60 
      ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` 
      : `${minutes}m`;
  }
  
  if (sessionEvents) {
    sessionEvents.textContent = state.session?.eventCount || 0;
  }
  
  if (sessionPages) {
    sessionPages.textContent = state.session?.pagesVisited || 0;
  }
  
  // Feature usage
  const featureUsage = state.metrics?.featureUsage || {};
  const maxUsage = Math.max(...Object.values(featureUsage), 1);
  
  updateFeatureBar('Document Detection', featureUsage.documentDetection || 0, maxUsage);
  updateFeatureBar('Autofill', featureUsage.autofill || 0, maxUsage);
  updateFeatureBar('Macros', featureUsage.macros || 0, maxUsage);
  updateFeatureBar('AI Calls', featureUsage.aiCalls || 0, maxUsage);
  
  // Lifetime stats
  const totalSessions = document.getElementById('stat-total-sessions');
  const totalEvents = document.getElementById('stat-total-events');
  const totalDocs = document.getElementById('stat-total-docs');
  
  if (totalSessions) {
    totalSessions.textContent = state.metrics?.sessionsCount || 0;
  }
  if (totalEvents) {
    totalEvents.textContent = state.metrics?.totalEvents || 0;
  }
  if (totalDocs) {
    totalDocs.textContent = (state.metrics?.eventsByCategory?.feature || 0);
  }
  
  // Config toggles
  const analyticsEnabled = document.getElementById('pref-analytics-enabled');
  const analyticsAnonymize = document.getElementById('pref-analytics-anonymize');
  
  if (analyticsEnabled) {
    analyticsEnabled.checked = state.config?.enabled !== false;
  }
  if (analyticsAnonymize) {
    analyticsAnonymize.checked = state.config?.anonymize !== false;
  }
}

function updateFeatureBar(name, count, max) {
  const items = document.querySelectorAll('.feature-usage-item');
  items.forEach(item => {
    const featureName = item.querySelector('.feature-name')?.textContent;
    if (featureName === name) {
      const bar = item.querySelector('.feature-bar');
      const countEl = item.querySelector('.feature-count');
      
      if (bar) {
        bar.style.width = `${(count / max) * 100}%`;
      }
      if (countEl) {
        countEl.textContent = count;
      }
    }
  });
}

function setupAnalyticsListeners() {
  // Analytics toggle
  document.getElementById('pref-analytics-enabled')?.addEventListener('change', async (e) => {
    if (e.target.checked) {
      await chrome.runtime.sendMessage({ action: 'ENABLE_ANALYTICS' });
    } else {
      await chrome.runtime.sendMessage({ action: 'DISABLE_ANALYTICS' });
    }
  });
  
  // Anonymize toggle
  document.getElementById('pref-analytics-anonymize')?.addEventListener('change', async (e) => {
    await chrome.runtime.sendMessage({
      action: 'UPDATE_ANALYTICS_CONFIG',
      config: { anonymize: e.target.checked },
    });
  });
  
  // Export button
  document.getElementById('btn-export-analytics')?.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ action: 'EXPORT_DATA' });
    
    if (response?.success) {
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cube-analytics-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showNotification('Export Complete', 'Analytics data exported successfully', 'success');
    }
  });
  
  // Clear button
  document.getElementById('btn-clear-analytics')?.addEventListener('click', async () => {
    if (confirm('Clear all analytics data? This cannot be undone.')) {
      await chrome.runtime.sendMessage({ action: 'CLEAR_DATA' });
      await loadAnalyticsState();
      updateAnalyticsUI();
      showNotification('Data Cleared', 'Analytics data has been cleared', 'success');
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

function setupDocumentListeners() {
  document.getElementById('btn-detect-docs')?.addEventListener('click', async () => {
    const status = document.getElementById('detection-status');
    const message = document.getElementById('detection-message');
    
    status?.classList.remove('hidden');
    if (message) message.textContent = 'Scanning page...';
    
    try {
      const response = await chrome.tabs.sendMessage(PopupState.activeTabId, {
        type: 'DETECT_DOCUMENTS',
      });
      
      if (response?.success) {
        if (message) message.textContent = `Found ${response.count} documents`;
        setTimeout(() => status?.classList.add('hidden'), 2000);
        
        // Track feature usage
        trackFeature('documentDetection');
      }
    } catch (error) {
      if (message) message.textContent = 'Detection failed';
      setTimeout(() => status?.classList.add('hidden'), 2000);
    }
  });
  
  document.getElementById('btn-parse-all')?.addEventListener('click', async () => {
    try {
      await chrome.tabs.sendMessage(PopupState.activeTabId, {
        type: 'PARSE_ALL_DOCUMENTS',
      });
      
      trackFeature('documentParsing');
    } catch (error) {
      console.error('Parse failed:', error);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTOFILL
// ═══════════════════════════════════════════════════════════════════════════════

function setupAutofillListeners() {
  document.getElementById('btn-autofill-form')?.addEventListener('click', async () => {
    const profileSelector = document.getElementById('profile-selector');
    const profileId = profileSelector?.value;
    
    try {
      await chrome.tabs.sendMessage(PopupState.activeTabId, {
        type: 'AUTOFILL_FORM',
        profileId: profileId,
      });
      
      trackFeature('autofill');
      showNotification('Autofill', 'Form filled successfully', 'success');
    } catch (error) {
      showNotification('Autofill Failed', error.message, 'error');
    }
  });
  
  document.getElementById('btn-ai-suggest')?.addEventListener('click', async () => {
    try {
      await chrome.tabs.sendMessage(PopupState.activeTabId, {
        type: 'AI_SUGGEST_FIELDS',
      });
      
      trackFeature('aiSuggest');
    } catch (error) {
      console.error('AI suggest failed:', error);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MACROS
// ═══════════════════════════════════════════════════════════════════════════════

function setupMacroListeners() {
  document.getElementById('btn-record-macro')?.addEventListener('click', async () => {
    const btnText = document.getElementById('btn-record-text');
    const isRecording = btnText?.textContent === 'Stop Recording';
    
    if (isRecording) {
      // Stop recording
      await chrome.runtime.sendMessage({ type: 'STOP_MACRO_RECORDING' });
      if (btnText) btnText.textContent = 'Start Recording';
      document.getElementById('recording-status')?.classList.add('hidden');
    } else {
      // Start recording
      await chrome.runtime.sendMessage({ type: 'START_MACRO_RECORDING' });
      if (btnText) btnText.textContent = 'Stop Recording';
      document.getElementById('recording-status')?.classList.remove('hidden');
      
      trackFeature('macros');
    }
  });
  
  document.getElementById('btn-view-macros')?.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_MACROS' });
    
    if (response?.success) {
      displayMacros(response.macros);
    }
  });
}

function displayMacros(macros) {
  const macrosList = document.getElementById('macros-list');
  
  if (!macrosList) return;
  
  if (macros.length === 0) {
    macrosList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎬</div>
        <p>No macros saved</p>
        <small>Record your first macro to automate tasks</small>
      </div>
    `;
    return;
  }
  
  macrosList.innerHTML = macros.map(macro => `
    <div class="macro-item" data-id="${macro.id}">
      <div class="macro-info">
        <span class="macro-icon">🎬</span>
        <div class="macro-details">
          <div class="macro-name">${escapeHtml(macro.name)}</div>
          <div class="macro-meta">${macro.actions?.length || 0} actions • ${formatTime(macro.createdAt)}</div>
        </div>
      </div>
      <div class="macro-actions">
        <button class="macro-btn play" data-id="${macro.id}" title="Play">▶️</button>
        <button class="macro-btn delete" data-id="${macro.id}" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners
  macrosList.querySelectorAll('.macro-btn.play').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playMacro(btn.dataset.id);
    });
  });
  
  macrosList.querySelectorAll('.macro-btn.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteMacro(btn.dataset.id);
    });
  });
}

async function playMacro(macroId) {
  try {
    await chrome.runtime.sendMessage({
      type: 'PLAY_MACRO',
      macroId: macroId,
    });
    
    showNotification('Macro Playing', 'Running macro...', 'info');
  } catch (error) {
    showNotification('Macro Failed', error.message, 'error');
  }
}

async function deleteMacro(macroId) {
  if (confirm('Delete this macro?')) {
    await chrome.runtime.sendMessage({
      type: 'DELETE_MACRO',
      macroId: macroId,
    });
    
    // Refresh list
    const response = await chrome.runtime.sendMessage({ type: 'GET_MACROS' });
    if (response?.success) {
      displayMacros(response.macros);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

async function loadSettings() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  PopupState.settings = response || {};
  
  // Populate API keys (masked)
  const openaiKey = document.getElementById('openai-key');
  const claudeKey = document.getElementById('claude-key');
  const geminiKey = document.getElementById('gemini-key');
  
  if (openaiKey && PopupState.settings.openaiApiKey) {
    openaiKey.value = '••••••••••••••••';
  }
  if (claudeKey && PopupState.settings.claudeApiKey) {
    claudeKey.value = '••••••••••••••••';
  }
  if (geminiKey && PopupState.settings.geminiApiKey) {
    geminiKey.value = '••••••••••••••••';
  }
  
  // Checkboxes
  const autoDetect = document.getElementById('auto-detect-docs');
  const autoParse = document.getElementById('auto-parse-docs');
  
  if (autoDetect) autoDetect.checked = PopupState.settings.autoDetectDocs !== false;
  if (autoParse) autoParse.checked = PopupState.settings.autoParseDocs === true;
}

function setupSettingsListeners() {
  // Save API keys
  document.getElementById('btn-save-keys')?.addEventListener('click', async () => {
    const openaiKey = document.getElementById('openai-key')?.value;
    const claudeKey = document.getElementById('claude-key')?.value;
    const geminiKey = document.getElementById('gemini-key')?.value;
    
    const settings = {};
    
    // Only save if not masked
    if (openaiKey && !openaiKey.includes('••••')) {
      settings.openaiApiKey = openaiKey;
    }
    if (claudeKey && !claudeKey.includes('••••')) {
      settings.claudeApiKey = claudeKey;
    }
    if (geminiKey && !geminiKey.includes('••••')) {
      settings.geminiApiKey = geminiKey;
    }
    
    if (Object.keys(settings).length > 0) {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: settings,
      });
      
      showNotification('Settings Saved', 'API keys updated successfully', 'success');
    }
  });
  
  // Reset settings
  document.getElementById('btn-reset-settings')?.addEventListener('click', async () => {
    if (confirm('Reset all settings to defaults?')) {
      await chrome.runtime.sendMessage({
        type: 'RESET_SETTINGS',
      });
      
      await loadSettings();
      showNotification('Settings Reset', 'All settings restored to defaults', 'success');
    }
  });
  
  // Auto-detect toggle
  document.getElementById('auto-detect-docs')?.addEventListener('change', async (e) => {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { autoDetectDocs: e.target.checked },
    });
  });
  
  // Auto-parse toggle
  document.getElementById('auto-parse-docs')?.addEventListener('change', async (e) => {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { autoParseDocs: e.target.checked },
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE LISTENERS
// ═══════════════════════════════════════════════════════════════════════════════

function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'ENTERPRISE_STATE_UPDATE':
        PopupState.enterpriseState = message.payload;
        updateEnterpriseUI();
        break;
        
      case 'NOTIFICATION_UPDATE':
        PopupState.notificationState = {
          ...PopupState.notificationState,
          unreadCount: message.payload.unreadCount,
        };
        updateNotificationBadge();
        break;
        
      case 'DOWNLOAD_EVENT':
        handleDownloadEvent(message);
        break;
    }
  });
}

function handleDownloadEvent(message) {
  switch (message.eventType) {
    case 'DOWNLOAD_PROGRESS':
      const progress = document.getElementById('download-progress');
      const total = document.getElementById('download-total');
      const status = document.getElementById('download-status');
      
      if (progress) progress.textContent = message.payload.completed;
      if (total) total.textContent = message.payload.total;
      status?.classList.remove('hidden');
      break;
  }
}

function updateNotificationBadge() {
  const badge = document.getElementById('notification-count');
  const count = PopupState.notificationState?.unreadCount || 0;
  
  if (badge) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════════════════════

function initializeModals() {
  // Close modals when clicking outside
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function showNotification(title, message, type = 'info') {
  // Use browser notification API
  chrome.runtime.sendMessage({
    action: 'SHOW_NOTIFICATION',
    notification: {
      type: type,
      title: title,
      body: message,
    },
  });
}

function showStatus(elementId, message, type) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.classList.remove('hidden', 'info', 'success', 'error');
  element.classList.add(type);
  element.innerHTML = `<span>${message}</span>`;
}

function trackEvent(name, properties = {}) {
  chrome.runtime.sendMessage({
    action: 'TRACK_EVENT',
    name: name,
    category: 'popup',
    properties: properties,
  }).catch(() => {});
}

function trackFeature(featureName) {
  chrome.runtime.sendMessage({
    action: 'TRACK_FEATURE',
    feature: featureName,
    metadata: {},
  }).catch(() => {});
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString();
}

console.log('✅ CUBE Nexum Connect v7.1.0 Popup script loaded');
