// ═══════════════════════════════════════════════════════════════════════════════
// CUBE Nexum v7.1 - Settings Page JavaScript
// Enterprise Edition - Complete Settings Management
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  console.log('⚙️ CUBE Nexum Settings v7.1 loading...');

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  const SettingsState = {
    // General
    theme: 'dark',
    accentColor: '#7c3aed',
    compactMode: false,
    autoStart: true,
    showFloatingAssistant: true,
    contextMenuEnabled: true,
    language: 'en',
    dateFormat: 'MM/DD/YYYY',

    // Enterprise
    enterprise: {
      connected: false,
      organizationId: null,
      organizationName: null,
      ssoProvider: null,
      ssoConfig: {},
      licenseType: null,
      auditLoggingEnabled: false,
      auditRetention: 90,
      customBrandingEnabled: false,
      branding: {
        primaryColor: '#7c3aed',
        secondaryColor: '#6366f1',
        logoUrl: null
      }
    },

    // Notifications
    notifications: {
      enabled: true,
      browserNotifications: true,
      inAppNotifications: true,
      soundNotifications: false,
      pushNotifications: false,
      categories: {
        automation: true,
        documents: true,
        autofill: true,
        ai: true,
        downloads: true,
        system: true,
        marketing: false
      },
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      allowCriticalDuringQuiet: true,
      digestModeEnabled: false,
      digestFrequency: 'daily',
      digestTime: '09:00',
      historyDays: 30
    },

    // Analytics
    analytics: {
      consentGiven: true,
      trackFeatureUsage: true,
      trackPerformance: true,
      trackErrors: true,
      participateABTesting: true
    },

    // AI Services
    ai: {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4o',
      responseStyle: 'concise',
      autoSuggestions: true,
      includeContext: true
    },

    // Automation
    automation: {
      recordMouseMovements: false,
      recordTiming: true,
      playbackSpeed: 1,
      autoDetectForms: true,
      fuzzyMatching: true,
      fillConfidence: 80
    },

    // Security
    security: {
      encryptLocalData: true,
      clearDataOnLogout: false,
      sessionTimeout: 0,
      siteBlacklist: []
    },

    // Advanced
    advanced: {
      debugMode: false,
      perfOverlay: false
    },

    // Usage Stats (read-only)
    stats: {
      autofills: 0,
      macros: 0,
      documents: 0,
      aiRequests: 0,
      timeSaved: 0,
      daysActive: 0,
      featureUsage: {},
      experiments: []
    }
  };

  // DOM Element cache
  const Elements = {};

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  async function initialize() {
    console.log('⚙️ Initializing settings page...');

    try {
      // Cache DOM elements
      cacheElements();

      // Load saved settings
      await loadSettings();

      // Apply settings to UI
      applySettingsToUI();

      // Setup event listeners
      setupEventListeners();

      // Load enterprise state
      await loadEnterpriseState();

      // Load analytics stats
      await loadAnalyticsStats();

      // Set extension ID
      if (chrome.runtime?.id) {
        const extIdEl = document.getElementById('extensionId');
        if (extIdEl) extIdEl.textContent = chrome.runtime.id;
      }

      console.log('✅ Settings page initialized');
    } catch (error) {
      console.error('❌ Settings initialization failed:', error);
      showToast('error', 'Initialization Failed', error.message);
    }
  }

  function cacheElements() {
    // Theme
    Elements.themeToggle = document.getElementById('themeToggle');
    Elements.themeSelect = document.getElementById('themeSelect');
    Elements.accentColor = document.getElementById('accentColor');
    Elements.compactMode = document.getElementById('compactMode');

    // General
    Elements.autoStart = document.getElementById('autoStart');
    Elements.showFloatingAssistant = document.getElementById('showFloatingAssistant');
    Elements.contextMenuEnabled = document.getElementById('contextMenuEnabled');
    Elements.languageSelect = document.getElementById('languageSelect');
    Elements.dateFormat = document.getElementById('dateFormat');

    // Enterprise
    Elements.enterpriseStatusCard = document.getElementById('enterpriseStatusCard');
    Elements.enterpriseStatusIcon = document.getElementById('enterpriseStatusIcon');
    Elements.enterpriseStatusTitle = document.getElementById('enterpriseStatusTitle');
    Elements.enterpriseStatusDesc = document.getElementById('enterpriseStatusDesc');
    Elements.enterpriseConnectBtn = document.getElementById('enterpriseConnectBtn');
    Elements.enterpriseBadge = document.getElementById('enterpriseBadge');
    Elements.ssoProvider = document.getElementById('ssoProvider');
    Elements.ssoConfigFields = document.getElementById('ssoConfigFields');
    Elements.samlConfigFields = document.getElementById('samlConfigFields');
    Elements.ssoClientId = document.getElementById('ssoClientId');
    Elements.ssoIssuerUrl = document.getElementById('ssoIssuerUrl');
    Elements.ssoAuthEndpoint = document.getElementById('ssoAuthEndpoint');
    Elements.ssoTokenEndpoint = document.getElementById('ssoTokenEndpoint');
    Elements.samlEntityId = document.getElementById('samlEntityId');
    Elements.samlSsoUrl = document.getElementById('samlSsoUrl');
    Elements.samlCertificate = document.getElementById('samlCertificate');
    Elements.testSsoBtn = document.getElementById('testSsoBtn');
    Elements.saveSsoBtn = document.getElementById('saveSsoBtn');
    Elements.organizationId = document.getElementById('organizationId');
    Elements.organizationName = document.getElementById('organizationName');
    Elements.licenseBadge = document.getElementById('licenseBadge');
    Elements.auditLoggingEnabled = document.getElementById('auditLoggingEnabled');
    Elements.auditRetention = document.getElementById('auditRetention');
    Elements.exportAuditLogs = document.getElementById('exportAuditLogs');
    Elements.customBrandingEnabled = document.getElementById('customBrandingEnabled');
    Elements.brandingFields = document.getElementById('brandingFields');
    Elements.brandPrimaryColor = document.getElementById('brandPrimaryColor');
    Elements.brandSecondaryColor = document.getElementById('brandSecondaryColor');
    Elements.brandLogoUrl = document.getElementById('brandLogoUrl');

    // Notifications
    Elements.notificationsEnabled = document.getElementById('notificationsEnabled');
    Elements.browserNotifications = document.getElementById('browserNotifications');
    Elements.inAppNotifications = document.getElementById('inAppNotifications');
    Elements.soundNotifications = document.getElementById('soundNotifications');
    Elements.pushNotifications = document.getElementById('pushNotifications');
    Elements.notifAutomation = document.getElementById('notifAutomation');
    Elements.notifDocuments = document.getElementById('notifDocuments');
    Elements.notifAutofill = document.getElementById('notifAutofill');
    Elements.notifAI = document.getElementById('notifAI');
    Elements.notifDownloads = document.getElementById('notifDownloads');
    Elements.notifSystem = document.getElementById('notifSystem');
    Elements.notifMarketing = document.getElementById('notifMarketing');
    Elements.quietHoursEnabled = document.getElementById('quietHoursEnabled');
    Elements.quietHoursConfig = document.getElementById('quietHoursConfig');
    Elements.quietHoursStart = document.getElementById('quietHoursStart');
    Elements.quietHoursEnd = document.getElementById('quietHoursEnd');
    Elements.allowCriticalDuringQuiet = document.getElementById('allowCriticalDuringQuiet');
    Elements.digestModeEnabled = document.getElementById('digestModeEnabled');
    Elements.digestConfig = document.getElementById('digestConfig');
    Elements.digestFrequency = document.getElementById('digestFrequency');
    Elements.digestTime = document.getElementById('digestTime');
    Elements.digestTimeRow = document.getElementById('digestTimeRow');
    Elements.notificationHistoryDays = document.getElementById('notificationHistoryDays');
    Elements.clearNotificationHistory = document.getElementById('clearNotificationHistory');
    Elements.notificationBadge = document.getElementById('notificationBadge');

    // Analytics
    Elements.analyticsConsent = document.getElementById('analyticsConsent');
    Elements.consentLabel = document.getElementById('consentLabel');
    Elements.trackFeatureUsage = document.getElementById('trackFeatureUsage');
    Elements.trackPerformance = document.getElementById('trackPerformance');
    Elements.trackErrors = document.getElementById('trackErrors');
    Elements.participateABTesting = document.getElementById('participateABTesting');
    Elements.statAutofills = document.getElementById('statAutofills');
    Elements.statMacros = document.getElementById('statMacros');
    Elements.statDocuments = document.getElementById('statDocuments');
    Elements.statAIRequests = document.getElementById('statAIRequests');
    Elements.statTimeSaved = document.getElementById('statTimeSaved');
    Elements.statDaysActive = document.getElementById('statDaysActive');
    Elements.featureUsageList = document.getElementById('featureUsageList');
    Elements.experimentsList = document.getElementById('experimentsList');
    Elements.exportAnalyticsData = document.getElementById('exportAnalyticsData');
    Elements.deleteAnalyticsData = document.getElementById('deleteAnalyticsData');

    // AI
    Elements.aiProvider = document.getElementById('aiProvider');
    Elements.aiApiKey = document.getElementById('aiApiKey');
    Elements.toggleApiKeyVisibility = document.getElementById('toggleApiKeyVisibility');
    Elements.aiModel = document.getElementById('aiModel');
    Elements.aiResponseStyle = document.getElementById('aiResponseStyle');
    Elements.aiAutoSuggestions = document.getElementById('aiAutoSuggestions');
    Elements.aiIncludeContext = document.getElementById('aiIncludeContext');

    // Automation
    Elements.recordMouseMovements = document.getElementById('recordMouseMovements');
    Elements.recordTiming = document.getElementById('recordTiming');
    Elements.macroPlaybackSpeed = document.getElementById('macroPlaybackSpeed');
    Elements.autoDetectForms = document.getElementById('autoDetectForms');
    Elements.fuzzyMatching = document.getElementById('fuzzyMatching');
    Elements.fillConfidence = document.getElementById('fillConfidence');
    Elements.fillConfidenceValue = document.getElementById('fillConfidenceValue');

    // Security
    Elements.encryptLocalData = document.getElementById('encryptLocalData');
    Elements.clearDataOnLogout = document.getElementById('clearDataOnLogout');
    Elements.sessionTimeout = document.getElementById('sessionTimeout');
    Elements.manageSiteBlacklist = document.getElementById('manageSiteBlacklist');

    // Advanced
    Elements.debugMode = document.getElementById('debugMode');
    Elements.perfOverlay = document.getElementById('perfOverlay');
    Elements.exportAllSettings = document.getElementById('exportAllSettings');
    Elements.importAllSettings = document.getElementById('importAllSettings');
    Elements.importSettingsFile = document.getElementById('importSettingsFile');
    Elements.resetAllSettings = document.getElementById('resetAllSettings');

    // Footer
    Elements.saveAllSettings = document.getElementById('saveAllSettings');
    Elements.saveStatus = document.getElementById('saveStatus');
    Elements.exportSettings = document.getElementById('exportSettings');
    Elements.importSettings = document.getElementById('importSettings');

    // Modal
    Elements.modalOverlay = document.getElementById('modalOverlay');
    Elements.activeModal = document.getElementById('activeModal');

    // Toast
    Elements.toastContainer = document.getElementById('toastContainer');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD & SAVE SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  async function loadSettings() {
    try {
      const stored = await chrome.storage.local.get(['cubeSettings']);
      if (stored.cubeSettings) {
        // Deep merge stored settings with defaults
        Object.assign(SettingsState, deepMerge(SettingsState, stored.cubeSettings));
      }

      // Load theme separately (may be stored under different key)
      const themeStored = await chrome.storage.local.get(['cubeEliteTheme']);
      if (themeStored.cubeEliteTheme) {
        SettingsState.theme = themeStored.cubeEliteTheme;
      }

      console.log('📂 Settings loaded:', SettingsState);
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  }

  async function saveSettings() {
    try {
      await chrome.storage.local.set({
        cubeSettings: SettingsState,
        cubeEliteTheme: SettingsState.theme
      });

      // Notify background service of settings change
      await chrome.runtime.sendMessage({
        type: 'SETTINGS_UPDATED',
        settings: SettingsState
      });

      showSaveStatus('success', 'Settings saved');
      console.log('💾 Settings saved');
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      showSaveStatus('error', 'Failed to save');
      return false;
    }
  }

  function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPLY SETTINGS TO UI
  // ═══════════════════════════════════════════════════════════════════════════

  function applySettingsToUI() {
    // Apply theme
    document.body.setAttribute('data-theme', SettingsState.theme);
    if (Elements.themeSelect) Elements.themeSelect.value = SettingsState.theme;
    if (Elements.accentColor) Elements.accentColor.value = SettingsState.accentColor;

    // General
    setChecked(Elements.compactMode, SettingsState.compactMode);
    setChecked(Elements.autoStart, SettingsState.autoStart);
    setChecked(Elements.showFloatingAssistant, SettingsState.showFloatingAssistant);
    setChecked(Elements.contextMenuEnabled, SettingsState.contextMenuEnabled);
    setValue(Elements.languageSelect, SettingsState.language);
    setValue(Elements.dateFormat, SettingsState.dateFormat);

    // Enterprise
    setValue(Elements.ssoProvider, SettingsState.enterprise.ssoProvider || '');
    setValue(Elements.organizationId, SettingsState.enterprise.organizationId || '');
    setValue(Elements.organizationName, SettingsState.enterprise.organizationName || '');
    setChecked(Elements.auditLoggingEnabled, SettingsState.enterprise.auditLoggingEnabled);
    setValue(Elements.auditRetention, SettingsState.enterprise.auditRetention);
    setChecked(Elements.customBrandingEnabled, SettingsState.enterprise.customBrandingEnabled);
    setValue(Elements.brandPrimaryColor, SettingsState.enterprise.branding.primaryColor);
    setValue(Elements.brandSecondaryColor, SettingsState.enterprise.branding.secondaryColor);
    setValue(Elements.brandLogoUrl, SettingsState.enterprise.branding.logoUrl || '');

    // SSO Config
    if (SettingsState.enterprise.ssoConfig) {
      setValue(Elements.ssoClientId, SettingsState.enterprise.ssoConfig.clientId || '');
      setValue(Elements.ssoIssuerUrl, SettingsState.enterprise.ssoConfig.issuerUrl || '');
      setValue(Elements.ssoAuthEndpoint, SettingsState.enterprise.ssoConfig.authEndpoint || '');
      setValue(Elements.ssoTokenEndpoint, SettingsState.enterprise.ssoConfig.tokenEndpoint || '');
      setValue(Elements.samlEntityId, SettingsState.enterprise.ssoConfig.entityId || '');
      setValue(Elements.samlSsoUrl, SettingsState.enterprise.ssoConfig.ssoUrl || '');
      setValue(Elements.samlCertificate, SettingsState.enterprise.ssoConfig.certificate || '');
    }

    // Show/hide SSO fields based on provider
    updateSSOFields();
    updateBrandingFields();

    // Notifications
    setChecked(Elements.notificationsEnabled, SettingsState.notifications.enabled);
    setChecked(Elements.browserNotifications, SettingsState.notifications.browserNotifications);
    setChecked(Elements.inAppNotifications, SettingsState.notifications.inAppNotifications);
    setChecked(Elements.soundNotifications, SettingsState.notifications.soundNotifications);
    setChecked(Elements.pushNotifications, SettingsState.notifications.pushNotifications);
    setChecked(Elements.notifAutomation, SettingsState.notifications.categories.automation);
    setChecked(Elements.notifDocuments, SettingsState.notifications.categories.documents);
    setChecked(Elements.notifAutofill, SettingsState.notifications.categories.autofill);
    setChecked(Elements.notifAI, SettingsState.notifications.categories.ai);
    setChecked(Elements.notifDownloads, SettingsState.notifications.categories.downloads);
    setChecked(Elements.notifSystem, SettingsState.notifications.categories.system);
    setChecked(Elements.notifMarketing, SettingsState.notifications.categories.marketing);
    setChecked(Elements.quietHoursEnabled, SettingsState.notifications.quietHoursEnabled);
    setValue(Elements.quietHoursStart, SettingsState.notifications.quietHoursStart);
    setValue(Elements.quietHoursEnd, SettingsState.notifications.quietHoursEnd);
    setChecked(Elements.allowCriticalDuringQuiet, SettingsState.notifications.allowCriticalDuringQuiet);
    setChecked(Elements.digestModeEnabled, SettingsState.notifications.digestModeEnabled);
    setValue(Elements.digestFrequency, SettingsState.notifications.digestFrequency);
    setValue(Elements.digestTime, SettingsState.notifications.digestTime);
    setValue(Elements.notificationHistoryDays, SettingsState.notifications.historyDays);

    // Show/hide quiet hours and digest config
    updateQuietHoursFields();
    updateDigestFields();

    // Analytics
    setChecked(Elements.analyticsConsent, SettingsState.analytics.consentGiven);
    setChecked(Elements.trackFeatureUsage, SettingsState.analytics.trackFeatureUsage);
    setChecked(Elements.trackPerformance, SettingsState.analytics.trackPerformance);
    setChecked(Elements.trackErrors, SettingsState.analytics.trackErrors);
    setChecked(Elements.participateABTesting, SettingsState.analytics.participateABTesting);
    updateConsentLabel();

    // AI
    setValue(Elements.aiProvider, SettingsState.ai.provider);
    setValue(Elements.aiApiKey, SettingsState.ai.apiKey);
    setValue(Elements.aiModel, SettingsState.ai.model);
    setValue(Elements.aiResponseStyle, SettingsState.ai.responseStyle);
    setChecked(Elements.aiAutoSuggestions, SettingsState.ai.autoSuggestions);
    setChecked(Elements.aiIncludeContext, SettingsState.ai.includeContext);

    // Automation
    setChecked(Elements.recordMouseMovements, SettingsState.automation.recordMouseMovements);
    setChecked(Elements.recordTiming, SettingsState.automation.recordTiming);
    setValue(Elements.macroPlaybackSpeed, SettingsState.automation.playbackSpeed);
    setChecked(Elements.autoDetectForms, SettingsState.automation.autoDetectForms);
    setChecked(Elements.fuzzyMatching, SettingsState.automation.fuzzyMatching);
    setValue(Elements.fillConfidence, SettingsState.automation.fillConfidence);
    if (Elements.fillConfidenceValue) {
      Elements.fillConfidenceValue.textContent = SettingsState.automation.fillConfidence + '%';
    }

    // Security
    setChecked(Elements.encryptLocalData, SettingsState.security.encryptLocalData);
    setChecked(Elements.clearDataOnLogout, SettingsState.security.clearDataOnLogout);
    setValue(Elements.sessionTimeout, SettingsState.security.sessionTimeout);

    // Advanced
    setChecked(Elements.debugMode, SettingsState.advanced.debugMode);
    setChecked(Elements.perfOverlay, SettingsState.advanced.perfOverlay);
  }

  function setChecked(element, value) {
    if (element) element.checked = value;
  }

  function setValue(element, value) {
    if (element) element.value = value;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT LISTENERS SETUP
  // ═══════════════════════════════════════════════════════════════════════════

  function setupEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Theme
    Elements.themeToggle?.addEventListener('click', toggleTheme);
    Elements.themeSelect?.addEventListener('change', (e) => {
      setTheme(e.target.value);
    });
    Elements.accentColor?.addEventListener('change', (e) => {
      SettingsState.accentColor = e.target.value;
      applyAccentColor(e.target.value);
    });

    // General toggles
    setupToggleListener(Elements.compactMode, 'compactMode');
    setupToggleListener(Elements.autoStart, 'autoStart');
    setupToggleListener(Elements.showFloatingAssistant, 'showFloatingAssistant');
    setupToggleListener(Elements.contextMenuEnabled, 'contextMenuEnabled');

    Elements.languageSelect?.addEventListener('change', (e) => {
      SettingsState.language = e.target.value;
    });
    Elements.dateFormat?.addEventListener('change', (e) => {
      SettingsState.dateFormat = e.target.value;
    });

    // Enterprise
    setupEnterpriseListeners();

    // Notifications
    setupNotificationListeners();

    // Analytics
    setupAnalyticsListeners();

    // AI
    setupAIListeners();

    // Automation
    setupAutomationListeners();

    // Security
    setupSecurityListeners();

    // Advanced
    setupAdvancedListeners();

    // Footer actions
    Elements.saveAllSettings?.addEventListener('click', saveSettings);
    Elements.exportSettings?.addEventListener('click', exportAllSettings);
    Elements.importSettings?.addEventListener('click', () => {
      Elements.importSettingsFile?.click();
    });
  }

  function setupToggleListener(element, key) {
    element?.addEventListener('change', (e) => {
      SettingsState[key] = e.target.checked;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════════

  function switchTab(tabId) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THEME MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  function toggleTheme() {
    const newTheme = SettingsState.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }

  function setTheme(theme) {
    SettingsState.theme = theme;
    document.body.setAttribute('data-theme', theme);
    if (Elements.themeSelect) Elements.themeSelect.value = theme;

    // Save theme preference
    chrome.storage.local.set({ cubeEliteTheme: theme });
  }

  function applyAccentColor(color) {
    document.documentElement.style.setProperty('--primary', color);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENTERPRISE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  function setupEnterpriseListeners() {
    Elements.enterpriseConnectBtn?.addEventListener('click', handleEnterpriseConnect);
    Elements.ssoProvider?.addEventListener('change', handleSSOProviderChange);
    Elements.testSsoBtn?.addEventListener('click', testSSOConnection);
    Elements.saveSsoBtn?.addEventListener('click', saveSSOConfig);
    
    Elements.auditLoggingEnabled?.addEventListener('change', (e) => {
      SettingsState.enterprise.auditLoggingEnabled = e.target.checked;
    });
    Elements.auditRetention?.addEventListener('change', (e) => {
      SettingsState.enterprise.auditRetention = parseInt(e.target.value);
    });
    Elements.exportAuditLogs?.addEventListener('click', exportAuditLogs);

    Elements.customBrandingEnabled?.addEventListener('change', (e) => {
      SettingsState.enterprise.customBrandingEnabled = e.target.checked;
      updateBrandingFields();
    });
    Elements.brandPrimaryColor?.addEventListener('change', (e) => {
      SettingsState.enterprise.branding.primaryColor = e.target.value;
    });
    Elements.brandSecondaryColor?.addEventListener('change', (e) => {
      SettingsState.enterprise.branding.secondaryColor = e.target.value;
    });
    Elements.brandLogoUrl?.addEventListener('change', (e) => {
      SettingsState.enterprise.branding.logoUrl = e.target.value;
    });
  }

  async function loadEnterpriseState() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_ENTERPRISE_STATE'
      });

      if (response && response.success && response.organization) {
        SettingsState.enterprise.connected = true;
        SettingsState.enterprise.organizationId = response.organization.id;
        SettingsState.enterprise.organizationName = response.organization.name;
        SettingsState.enterprise.licenseType = response.licenseType;
        SettingsState.enterprise.ssoProvider = response.ssoProvider;

        updateEnterpriseStatusUI(true);
      } else {
        updateEnterpriseStatusUI(false);
      }
    } catch (error) {
      console.warn('Failed to load enterprise state:', error);
      updateEnterpriseStatusUI(false);
    }
  }

  function updateEnterpriseStatusUI(connected) {
    if (!Elements.enterpriseStatusCard) return;

    if (connected) {
      Elements.enterpriseStatusCard.classList.add('connected');
      if (Elements.enterpriseStatusIcon) Elements.enterpriseStatusIcon.textContent = '✅';
      if (Elements.enterpriseStatusTitle) {
        Elements.enterpriseStatusTitle.textContent = SettingsState.enterprise.organizationName || 'Connected';
      }
      if (Elements.enterpriseStatusDesc) {
        Elements.enterpriseStatusDesc.textContent = `Organization ID: ${SettingsState.enterprise.organizationId}`;
      }
      if (Elements.enterpriseConnectBtn) {
        Elements.enterpriseConnectBtn.textContent = 'Disconnect';
        Elements.enterpriseConnectBtn.classList.remove('btn-primary');
        Elements.enterpriseConnectBtn.classList.add('btn-secondary');
      }
      if (Elements.enterpriseBadge) {
        Elements.enterpriseBadge.textContent = 'SSO';
        Elements.enterpriseBadge.hidden = false;
      }

      setValue(Elements.organizationId, SettingsState.enterprise.organizationId);
      setValue(Elements.organizationName, SettingsState.enterprise.organizationName);
    } else {
      Elements.enterpriseStatusCard.classList.remove('connected');
      if (Elements.enterpriseStatusIcon) Elements.enterpriseStatusIcon.textContent = '🔒';
      if (Elements.enterpriseStatusTitle) Elements.enterpriseStatusTitle.textContent = 'Not Connected';
      if (Elements.enterpriseStatusDesc) {
        Elements.enterpriseStatusDesc.textContent = 'Sign in with your enterprise account to unlock features';
      }
      if (Elements.enterpriseConnectBtn) {
        Elements.enterpriseConnectBtn.textContent = 'Connect Enterprise Account';
        Elements.enterpriseConnectBtn.classList.add('btn-primary');
        Elements.enterpriseConnectBtn.classList.remove('btn-secondary');
      }
      if (Elements.enterpriseBadge) {
        Elements.enterpriseBadge.hidden = true;
      }
    }
  }

  async function handleEnterpriseConnect() {
    if (SettingsState.enterprise.connected) {
      // Disconnect
      const confirmed = confirm('Are you sure you want to disconnect your enterprise account?');
      if (!confirmed) return;

      try {
        await chrome.runtime.sendMessage({ type: 'ENTERPRISE_LOGOUT' });
        SettingsState.enterprise.connected = false;
        SettingsState.enterprise.organizationId = null;
        SettingsState.enterprise.organizationName = null;
        updateEnterpriseStatusUI(false);
        showToast('success', 'Disconnected', 'Enterprise account disconnected');
      } catch (_error) {
        showToast('error', 'Error', 'Failed to disconnect');
      }
    } else {
      // Connect - initiate SSO
      const provider = Elements.ssoProvider?.value;
      if (!provider) {
        showToast('warning', 'Select Provider', 'Please select an SSO provider first');
        return;
      }

      try {
        await chrome.runtime.sendMessage({
          type: 'INITIATE_SSO_LOGIN',
          provider
        });
        showToast('info', 'SSO Login', 'Opening authentication window...');
      } catch (_error) {
        showToast('error', 'Error', 'Failed to initiate SSO login');
      }
    }
  }

  function handleSSOProviderChange() {
    const provider = Elements.ssoProvider?.value;
    SettingsState.enterprise.ssoProvider = provider;
    updateSSOFields();
  }

  function updateSSOFields() {
    const provider = SettingsState.enterprise.ssoProvider;
    
    const showOIDC = provider && provider !== 'saml' && provider !== '';
    const showSAML = provider === 'saml';

    if (Elements.ssoConfigFields) Elements.ssoConfigFields.hidden = !showOIDC;
    if (Elements.samlConfigFields) Elements.samlConfigFields.hidden = !showSAML;

    // Enable/disable buttons
    const hasProvider = !!provider;
    if (Elements.testSsoBtn) Elements.testSsoBtn.disabled = !hasProvider;
    if (Elements.saveSsoBtn) Elements.saveSsoBtn.disabled = !hasProvider;
  }

  function updateBrandingFields() {
    if (Elements.brandingFields) {
      Elements.brandingFields.hidden = !SettingsState.enterprise.customBrandingEnabled;
    }
  }

  async function testSSOConnection() {
    showToast('info', 'Testing', 'Testing SSO connection...');
    
    try {
      const config = collectSSOConfig();
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_SSO_CONNECTION',
        config
      });

      if (response && response.success) {
        showToast('success', 'Success', 'SSO connection test passed');
      } else {
        showToast('error', 'Failed', response?.error || 'SSO test failed');
      }
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  }

  async function saveSSOConfig() {
    const config = collectSSOConfig();
    SettingsState.enterprise.ssoConfig = config;
    
    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_SSO_CONFIG',
        config,
        provider: SettingsState.enterprise.ssoProvider
      });
      
      await saveSettings();
      showToast('success', 'Saved', 'SSO configuration saved');
    } catch (_error) {
      showToast('error', 'Error', 'Failed to save SSO config');
    }
  }

  function collectSSOConfig() {
    if (SettingsState.enterprise.ssoProvider === 'saml') {
      return {
        entityId: Elements.samlEntityId?.value || '',
        ssoUrl: Elements.samlSsoUrl?.value || '',
        certificate: Elements.samlCertificate?.value || ''
      };
    } else {
      return {
        clientId: Elements.ssoClientId?.value || '',
        issuerUrl: Elements.ssoIssuerUrl?.value || '',
        authEndpoint: Elements.ssoAuthEndpoint?.value || '',
        tokenEndpoint: Elements.ssoTokenEndpoint?.value || ''
      };
    }
  }

  async function exportAuditLogs() {
    showToast('info', 'Exporting', 'Preparing audit logs...');
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXPORT_AUDIT_LOGS'
      });

      if (response && response.success) {
        downloadJSON(response.logs, `audit-logs-${new Date().toISOString().split('T')[0]}.json`);
        showToast('success', 'Exported', 'Audit logs downloaded');
      } else {
        showToast('error', 'Failed', 'No audit logs available');
      }
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  }

  // Continue in Part 2...
  // (Notification, Analytics, AI, Automation, Security, Advanced handlers)

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATION HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  function setupNotificationListeners() {
    Elements.notificationsEnabled?.addEventListener('change', (e) => {
      SettingsState.notifications.enabled = e.target.checked;
      updateNotificationService();
    });

    Elements.browserNotifications?.addEventListener('change', (e) => {
      SettingsState.notifications.browserNotifications = e.target.checked;
    });
    Elements.inAppNotifications?.addEventListener('change', (e) => {
      SettingsState.notifications.inAppNotifications = e.target.checked;
    });
    Elements.soundNotifications?.addEventListener('change', (e) => {
      SettingsState.notifications.soundNotifications = e.target.checked;
    });
    Elements.pushNotifications?.addEventListener('change', async (e) => {
      if (e.target.checked) {
        const granted = await requestPushPermission();
        if (!granted) {
          e.target.checked = false;
          showToast('warning', 'Permission Denied', 'Push notifications require permission');
          return;
        }
      }
      SettingsState.notifications.pushNotifications = e.target.checked;
    });

    // Categories
    Elements.notifAutomation?.addEventListener('change', (e) => {
      SettingsState.notifications.categories.automation = e.target.checked;
    });
    Elements.notifDocuments?.addEventListener('change', (e) => {
      SettingsState.notifications.categories.documents = e.target.checked;
    });
    Elements.notifAutofill?.addEventListener('change', (e) => {
      SettingsState.notifications.categories.autofill = e.target.checked;
    });
    Elements.notifAI?.addEventListener('change', (e) => {
      SettingsState.notifications.categories.ai = e.target.checked;
    });
    Elements.notifDownloads?.addEventListener('change', (e) => {
      SettingsState.notifications.categories.downloads = e.target.checked;
    });
    Elements.notifSystem?.addEventListener('change', (e) => {
      SettingsState.notifications.categories.system = e.target.checked;
    });
    Elements.notifMarketing?.addEventListener('change', (e) => {
      SettingsState.notifications.categories.marketing = e.target.checked;
    });

    // Quiet Hours
    Elements.quietHoursEnabled?.addEventListener('change', (e) => {
      SettingsState.notifications.quietHoursEnabled = e.target.checked;
      updateQuietHoursFields();
    });
    Elements.quietHoursStart?.addEventListener('change', (e) => {
      SettingsState.notifications.quietHoursStart = e.target.value;
    });
    Elements.quietHoursEnd?.addEventListener('change', (e) => {
      SettingsState.notifications.quietHoursEnd = e.target.value;
    });
    Elements.allowCriticalDuringQuiet?.addEventListener('change', (e) => {
      SettingsState.notifications.allowCriticalDuringQuiet = e.target.checked;
    });

    // Digest
    Elements.digestModeEnabled?.addEventListener('change', (e) => {
      SettingsState.notifications.digestModeEnabled = e.target.checked;
      updateDigestFields();
    });
    Elements.digestFrequency?.addEventListener('change', (e) => {
      SettingsState.notifications.digestFrequency = e.target.value;
      updateDigestTimeVisibility();
    });
    Elements.digestTime?.addEventListener('change', (e) => {
      SettingsState.notifications.digestTime = e.target.value;
    });

    // History
    Elements.notificationHistoryDays?.addEventListener('change', (e) => {
      SettingsState.notifications.historyDays = parseInt(e.target.value);
    });
    Elements.clearNotificationHistory?.addEventListener('click', clearNotificationHistory);
  }

  function updateQuietHoursFields() {
    if (Elements.quietHoursConfig) {
      Elements.quietHoursConfig.hidden = !SettingsState.notifications.quietHoursEnabled;
    }
  }

  function updateDigestFields() {
    if (Elements.digestConfig) {
      Elements.digestConfig.hidden = !SettingsState.notifications.digestModeEnabled;
    }
    updateDigestTimeVisibility();
  }

  function updateDigestTimeVisibility() {
    if (Elements.digestTimeRow) {
      Elements.digestTimeRow.style.display = 
        SettingsState.notifications.digestFrequency === 'hourly' ? 'none' : 'flex';
    }
  }

  async function requestPushPermission() {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.warn('Push permission request failed:', error);
      return false;
    }
  }

  async function updateNotificationService() {
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_NOTIFICATION_PREFERENCES',
        preferences: SettingsState.notifications
      });
    } catch (error) {
      console.warn('Failed to update notification service:', error);
    }
  }

  async function clearNotificationHistory() {
    const confirmed = confirm('Are you sure you want to clear all notification history?');
    if (!confirmed) return;

    try {
      await chrome.runtime.sendMessage({
        type: 'CLEAR_NOTIFICATION_HISTORY'
      });
      showToast('success', 'Cleared', 'Notification history cleared');
    } catch (_error) {
      showToast('error', 'Error', 'Failed to clear history');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  function setupAnalyticsListeners() {
    Elements.analyticsConsent?.addEventListener('change', (e) => {
      SettingsState.analytics.consentGiven = e.target.checked;
      updateConsentLabel();
      updateAnalyticsService();
    });

    Elements.trackFeatureUsage?.addEventListener('change', (e) => {
      SettingsState.analytics.trackFeatureUsage = e.target.checked;
    });
    Elements.trackPerformance?.addEventListener('change', (e) => {
      SettingsState.analytics.trackPerformance = e.target.checked;
    });
    Elements.trackErrors?.addEventListener('change', (e) => {
      SettingsState.analytics.trackErrors = e.target.checked;
    });
    Elements.participateABTesting?.addEventListener('change', (e) => {
      SettingsState.analytics.participateABTesting = e.target.checked;
    });

    Elements.exportAnalyticsData?.addEventListener('click', exportAnalyticsData);
    Elements.deleteAnalyticsData?.addEventListener('click', deleteAnalyticsData);
  }

  function updateConsentLabel() {
    if (Elements.consentLabel) {
      Elements.consentLabel.textContent = SettingsState.analytics.consentGiven 
        ? 'Analytics Enabled' 
        : 'Analytics Disabled';
    }
  }

  async function updateAnalyticsService() {
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_ANALYTICS_CONSENT',
        consentGiven: SettingsState.analytics.consentGiven
      });
    } catch (error) {
      console.warn('Failed to update analytics service:', error);
    }
  }

  async function loadAnalyticsStats() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_ANALYTICS_STATS'
      });

      if (response && response.success) {
        SettingsState.stats = response.stats;
        updateStatsUI();
        updateFeatureUsageUI();
        updateExperimentsUI();
      }
    } catch (error) {
      console.warn('Failed to load analytics stats:', error);
    }
  }

  function updateStatsUI() {
    const stats = SettingsState.stats;
    
    if (Elements.statAutofills) Elements.statAutofills.textContent = formatNumber(stats.autofills);
    if (Elements.statMacros) Elements.statMacros.textContent = formatNumber(stats.macros);
    if (Elements.statDocuments) Elements.statDocuments.textContent = formatNumber(stats.documents);
    if (Elements.statAIRequests) Elements.statAIRequests.textContent = formatNumber(stats.aiRequests);
    if (Elements.statTimeSaved) Elements.statTimeSaved.textContent = formatTimeSaved(stats.timeSaved);
    if (Elements.statDaysActive) Elements.statDaysActive.textContent = stats.daysActive;
  }

  function updateFeatureUsageUI() {
    if (!Elements.featureUsageList) return;

    const featureUsage = SettingsState.stats.featureUsage || {};
    const features = Object.entries(featureUsage).sort((a, b) => b[1] - a[1]);
    const maxUsage = Math.max(...features.map(f => f[1]), 1);

    Elements.featureUsageList.innerHTML = features.map(([name, count]) => `
      <div class="feature-usage-item">
        <span class="feature-name">${formatFeatureName(name)}</span>
        <div class="feature-bar-container">
          <div class="feature-bar" style="width: ${(count / maxUsage) * 100}%"></div>
        </div>
        <span class="feature-count">${formatNumber(count)}</span>
      </div>
    `).join('') || '<p class="text-muted">No usage data yet</p>';
  }

  function updateExperimentsUI() {
    if (!Elements.experimentsList) return;

    const experiments = SettingsState.stats.experiments || [];

    if (experiments.length === 0) {
      Elements.experimentsList.innerHTML = '<p class="text-muted">No active experiments</p>';
      return;
    }

    Elements.experimentsList.innerHTML = experiments.map(exp => `
      <div class="experiment-item">
        <div class="experiment-info">
          <div class="experiment-icon">🧪</div>
          <div>
            <div class="experiment-name">${exp.name}</div>
            <div class="experiment-variant">Variant: ${exp.variant}</div>
          </div>
        </div>
        <span class="experiment-badge">Active</span>
      </div>
    `).join('');
  }

  async function exportAnalyticsData() {
    showToast('info', 'Exporting', 'Preparing analytics data...');
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXPORT_ANALYTICS_DATA'
      });

      if (response && response.success) {
        downloadJSON(response.data, `analytics-export-${new Date().toISOString().split('T')[0]}.json`);
        showToast('success', 'Exported', 'Analytics data downloaded');
      } else {
        showToast('error', 'Failed', 'No analytics data available');
      }
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  }

  async function deleteAnalyticsData() {
    const confirmed = confirm(
      'Are you sure you want to delete all your analytics data? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await chrome.runtime.sendMessage({
        type: 'DELETE_ANALYTICS_DATA'
      });
      
      SettingsState.stats = {
        autofills: 0,
        macros: 0,
        documents: 0,
        aiRequests: 0,
        timeSaved: 0,
        daysActive: 0,
        featureUsage: {},
        experiments: []
      };
      
      updateStatsUI();
      updateFeatureUsageUI();
      updateExperimentsUI();
      
      showToast('success', 'Deleted', 'All analytics data has been deleted');
    } catch (_error) {
      showToast('error', 'Error', 'Failed to delete analytics data');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AI HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  function setupAIListeners() {
    Elements.aiProvider?.addEventListener('change', (e) => {
      SettingsState.ai.provider = e.target.value;
      updateAIModelOptions();
    });

    Elements.aiApiKey?.addEventListener('change', (e) => {
      SettingsState.ai.apiKey = e.target.value;
    });

    Elements.toggleApiKeyVisibility?.addEventListener('click', () => {
      if (Elements.aiApiKey) {
        Elements.aiApiKey.type = Elements.aiApiKey.type === 'password' ? 'text' : 'password';
      }
    });

    Elements.aiModel?.addEventListener('change', (e) => {
      SettingsState.ai.model = e.target.value;
    });

    Elements.aiResponseStyle?.addEventListener('change', (e) => {
      SettingsState.ai.responseStyle = e.target.value;
    });

    Elements.aiAutoSuggestions?.addEventListener('change', (e) => {
      SettingsState.ai.autoSuggestions = e.target.checked;
    });

    Elements.aiIncludeContext?.addEventListener('change', (e) => {
      SettingsState.ai.includeContext = e.target.checked;
    });
  }

  function updateAIModelOptions() {
    if (!Elements.aiModel) return;

    const models = {
      openai: [
        { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Faster)' }
      ],
      claude: [
        { value: 'claude-3-opus', label: 'Claude 3 Opus' },
        { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-haiku', label: 'Claude 3 Haiku (Faster)' }
      ],
      gemini: [
        { value: 'gemini-pro', label: 'Gemini Pro' },
        { value: 'gemini-ultra', label: 'Gemini Ultra' }
      ],
      local: [
        { value: 'local', label: 'Local Model' }
      ]
    };

    const provider = SettingsState.ai.provider;
    const options = models[provider] || models.openai;

    Elements.aiModel.innerHTML = options.map(opt => 
      `<option value="${opt.value}">${opt.label}</option>`
    ).join('');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOMATION HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  function setupAutomationListeners() {
    Elements.recordMouseMovements?.addEventListener('change', (e) => {
      SettingsState.automation.recordMouseMovements = e.target.checked;
    });

    Elements.recordTiming?.addEventListener('change', (e) => {
      SettingsState.automation.recordTiming = e.target.checked;
    });

    Elements.macroPlaybackSpeed?.addEventListener('change', (e) => {
      SettingsState.automation.playbackSpeed = parseFloat(e.target.value);
    });

    Elements.autoDetectForms?.addEventListener('change', (e) => {
      SettingsState.automation.autoDetectForms = e.target.checked;
    });

    Elements.fuzzyMatching?.addEventListener('change', (e) => {
      SettingsState.automation.fuzzyMatching = e.target.checked;
    });

    Elements.fillConfidence?.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      SettingsState.automation.fillConfidence = value;
      if (Elements.fillConfidenceValue) {
        Elements.fillConfidenceValue.textContent = value + '%';
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  function setupSecurityListeners() {
    Elements.encryptLocalData?.addEventListener('change', (e) => {
      SettingsState.security.encryptLocalData = e.target.checked;
    });

    Elements.clearDataOnLogout?.addEventListener('change', (e) => {
      SettingsState.security.clearDataOnLogout = e.target.checked;
    });

    Elements.sessionTimeout?.addEventListener('change', (e) => {
      SettingsState.security.sessionTimeout = parseInt(e.target.value);
    });

    Elements.manageSiteBlacklist?.addEventListener('click', showBlacklistModal);
  }

  function showBlacklistModal() {
    showModal('Site Blacklist', `
      <p>Enter sites where the extension should be disabled (one per line):</p>
      <textarea id="blacklistTextarea" class="setting-textarea" rows="10" 
        placeholder="example.com&#10;*.sensitive-site.org">${SettingsState.security.siteBlacklist.join('\n')}</textarea>
    `, [
      { text: 'Cancel', type: 'secondary', action: hideModal },
      { text: 'Save', type: 'primary', action: saveBlacklist }
    ]);
  }

  function saveBlacklist() {
    const textarea = document.getElementById('blacklistTextarea');
    if (textarea) {
      SettingsState.security.siteBlacklist = textarea.value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    hideModal();
    showToast('success', 'Saved', 'Site blacklist updated');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADVANCED HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  function setupAdvancedListeners() {
    Elements.debugMode?.addEventListener('change', (e) => {
      SettingsState.advanced.debugMode = e.target.checked;
    });

    Elements.perfOverlay?.addEventListener('change', (e) => {
      SettingsState.advanced.perfOverlay = e.target.checked;
    });

    Elements.exportAllSettings?.addEventListener('click', exportAllSettings);
    
    Elements.importAllSettings?.addEventListener('click', () => {
      Elements.importSettingsFile?.click();
    });

    Elements.importSettingsFile?.addEventListener('change', handleSettingsImport);

    Elements.resetAllSettings?.addEventListener('click', resetAllSettings);
  }

  function exportAllSettings() {
    downloadJSON(SettingsState, `cube-settings-${new Date().toISOString().split('T')[0]}.json`);
    showToast('success', 'Exported', 'Settings exported successfully');
  }

  function handleSettingsImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        Object.assign(SettingsState, deepMerge(SettingsState, imported));
        applySettingsToUI();
        await saveSettings();
        showToast('success', 'Imported', 'Settings imported successfully');
      } catch (_error) {
        showToast('error', 'Error', 'Invalid settings file');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  }

  async function resetAllSettings() {
    const confirmed = confirm(
      'Are you sure you want to reset all settings to defaults? This cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await chrome.storage.local.remove(['cubeSettings', 'cubeEliteTheme']);
      location.reload();
    } catch (_error) {
      showToast('error', 'Error', 'Failed to reset settings');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  function formatTimeSaved(minutes) {
    if (minutes < 60) return minutes + 'm';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h';
    const days = Math.floor(hours / 24);
    return days + 'd';
  }

  function formatFeatureName(name) {
    return name
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL & TOAST UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  function showModal(title, content, buttons = []) {
    if (!Elements.modalOverlay || !Elements.activeModal) return;

    Elements.activeModal.innerHTML = `
      <div class="modal-header">
        <h3>${title}</h3>
        <button type="button" class="modal-close" onclick="hideModal()">✕</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      <div class="modal-footer">
        ${buttons.map(btn => `
          <button type="button" class="btn btn-${btn.type}" id="modalBtn_${btn.text}">
            ${btn.text}
          </button>
        `).join('')}
      </div>
    `;

    // Attach button handlers
    buttons.forEach(btn => {
      const btnEl = document.getElementById(`modalBtn_${btn.text}`);
      btnEl?.addEventListener('click', btn.action);
    });

    Elements.modalOverlay.hidden = false;
  }

  function hideModal() {
    if (Elements.modalOverlay) {
      Elements.modalOverlay.hidden = true;
    }
  }

  // Make hideModal globally accessible
  window.hideModal = hideModal;

  function showToast(type, title, message) {
    if (!Elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${getToastIcon(type)}</span>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button type="button" class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    Elements.toastContainer.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  function getToastIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
  }

  function showSaveStatus(type, message) {
    if (!Elements.saveStatus) return;
    
    Elements.saveStatus.textContent = message;
    Elements.saveStatus.className = `save-status ${type}`;
    
    setTimeout(() => {
      Elements.saveStatus.textContent = '';
      Elements.saveStatus.className = 'save-status';
    }, 3000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZE ON DOM READY
  // ═══════════════════════════════════════════════════════════════════════════

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  console.log('⚙️ CUBE Nexum Settings v7.1 ready');

})();
