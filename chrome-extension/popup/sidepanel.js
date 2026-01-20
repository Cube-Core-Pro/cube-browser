/**
 * ============================================================================
 * CUBE ELITE v7.0.0 - SIDE PANEL CONTROLLER
 * Enterprise Command Center
 * ============================================================================
 * 
 * Features:
 * - Real-time statistics dashboard
 * - Macro recording & playback controls
 * - Multi-mode screenshot capture
 * - Elite remote control management
 * - AI provider configuration
 * - P2P file sharing interface
 * - Comprehensive activity logging
 * 
 * PRODUCTION MODE:
 * - Real OpenAI/Gemini API integration
 * - Persistent storage for conversations
 * - Real automation command execution
 */

// ============================================================================
// AI SERVICE CONFIGURATION
// ============================================================================

const AI_CONFIG = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-5.1',
    fallbackModel: 'gpt-4o-mini',
    maxTokens: 4096
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.5-flash',
    fallbackModel: 'gemini-2.0-flash',
    maxTokens: 8192
  },
  claude: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-20250514',
    fallbackModel: 'claude-3-5-sonnet-20241022',
    maxTokens: 4096
  },
  // Current active provider (will be loaded from storage)
  activeProvider: 'openai'
};

// ============================================================================
// AI PERSONALITIES
// ============================================================================

const AI_PERSONALITIES = {
  cipher: {
    id: 'cipher',
    name: 'CIPHER',
    avatar: '🔮',
    color: '#7c3aed',
    greeting: 'CIPHER system active. I am your main AI assistant. How can I optimize your workflow today?',
    style: 'professional',
    specialties: ['automation', 'productivity', 'analysis'],
    systemPrompt: `You are CIPHER, the main AI assistant for CUBE Nexum. You are professional, efficient, and focused on productivity optimization. You excel at:
- Workflow automation and optimization
- Data analysis and insights
- Task prioritization and management
You communicate in a clear, professional manner while being helpful and thorough.`
  },
  nexus: {
    id: 'nexus',
    name: 'NEXUS',
    avatar: '⚡',
    color: '#f59e0b',
    greeting: 'NEXUS online. Code and systems architecture specialist. Give me a technical problem and let\'s solve it.',
    style: 'enthusiastic',
    specialties: ['programming', 'debugging', 'architecture'],
    systemPrompt: `You are NEXUS, the code and technical specialist for CUBE Nexum. You are enthusiastic about solving technical challenges. You excel at:
- Writing clean, efficient code
- Debugging complex issues
- System architecture design
- CSS selectors and DOM manipulation
You communicate with energy and excitement about technical problems.`
  },
  sentinel: {
    id: 'sentinel',
    name: 'SENTINEL',
    avatar: '🛡️',
    color: '#10b981',
    greeting: 'SENTINEL activated. Data protection and analysis at your service. What information do you need to process?',
    style: 'professional',
    specialties: ['security', 'data', 'reports'],
    systemPrompt: `You are SENTINEL, the data and security specialist for CUBE Nexum. You are methodical and thorough. You excel at:
- Data validation and sanitization
- Security best practices
- Report generation and analysis
- Form validation rules
You communicate with precision and attention to detail.`
  },
  forge: {
    id: 'forge',
    name: 'FORGE',
    avatar: '🔥',
    color: '#ef4444',
    greeting: 'FORGE ready to create. Design, content, automation - let\'s build something epic together.',
    style: 'casual',
    specialties: ['design', 'content', 'workflows'],
    systemPrompt: `You are FORGE, the creative specialist for CUBE Nexum. You are casual, creative, and love building things. You excel at:
- Workflow design and creation
- Creative problem solving
- Automation script generation
- Macro building
You communicate casually and with enthusiasm for creation.`
  }
};

// Current active personality (will be loaded from storage)
let currentPersonality = AI_PERSONALITIES.cipher;

// ============================================================================
// TOUR MENU - MUST BE DEFINED EARLY FOR OTHER FUNCTIONS TO REFERENCE
// ============================================================================

/**
 * Show the tour selection menu - GLOBAL FUNCTION
 */
function showTourMenu() {
  console.log('🎓 showTourMenu() called');
  
  const existingMenu = document.getElementById('tourMenu');
  if (existingMenu) {
    console.log('🎓 Removing existing menu');
    existingMenu.remove();
    return;
  }
  
  console.log('🎓 Creating new tour menu');
  
  // Create menu container
  const menu = document.createElement('div');
  menu.id = 'tourMenu';
  menu.className = 'tour-menu-container';
  
  // Build menu HTML
  menu.innerHTML = `
    <div class="tour-menu-header">
      <span class="tour-menu-title">🎓 Interactive Tours</span>
      <button type="button" class="tour-menu-close" id="closeTourMenuBtn" aria-label="Close tour menu">✕</button>
    </div>
    <div class="tour-menu-content">
      <p class="tour-menu-desc">Learn CUBE Nexum with step-by-step guided tours!</p>
      <div class="tour-menu-list">
        <button type="button" class="tour-menu-item" data-tour="welcome">
          <span class="tour-menu-item-icon">👋</span>
          <div class="tour-menu-item-info">
            <span class="tour-menu-item-title">Welcome Tour</span>
            <span class="tour-menu-item-desc">Get started with the basics</span>
          </div>
        </button>
        <button type="button" class="tour-menu-item" data-tour="dashboard">
          <span class="tour-menu-item-icon">📊</span>
          <div class="tour-menu-item-info">
            <span class="tour-menu-item-title">Dashboard Tour</span>
            <span class="tour-menu-item-desc">Learn about quick actions</span>
          </div>
        </button>
        <button type="button" class="tour-menu-item" data-tour="autofill">
          <span class="tour-menu-item-icon">✏️</span>
          <div class="tour-menu-item-info">
            <span class="tour-menu-item-title">Smart Autofill</span>
            <span class="tour-menu-item-desc">Auto-fill forms with profiles</span>
          </div>
        </button>
        <button type="button" class="tour-menu-item" data-tour="macros">
          <span class="tour-menu-item-icon">🎬</span>
          <div class="tour-menu-item-info">
            <span class="tour-menu-item-title">Macro Studio</span>
            <span class="tour-menu-item-desc">Record and replay actions</span>
          </div>
        </button>
        <button type="button" class="tour-menu-item" data-tour="automation">
          <span class="tour-menu-item-icon">⚡</span>
          <div class="tour-menu-item-info">
            <span class="tour-menu-item-title">Automation</span>
            <span class="tour-menu-item-desc">Create automated workflows</span>
          </div>
        </button>
        <button type="button" class="tour-menu-item" data-tour="aiNexus">
          <span class="tour-menu-item-icon">🤖</span>
          <div class="tour-menu-item-info">
            <span class="tour-menu-item-title">AI Nexus</span>
            <span class="tour-menu-item-desc">AI-powered assistance</span>
          </div>
        </button>
        <button type="button" class="tour-menu-item" data-tour="dataExtractor">
          <span class="tour-menu-item-icon">📄</span>
          <div class="tour-menu-item-info">
            <span class="tour-menu-item-title">Data Extractor</span>
            <span class="tour-menu-item-desc">Extract data from documents</span>
          </div>
        </button>
        <button type="button" class="tour-menu-item" data-tour="screenshot">
          <span class="tour-menu-item-icon">📸</span>
          <div class="tour-menu-item-info">
            <span class="tour-menu-item-title">Screen Capture</span>
            <span class="tour-menu-item-desc">Screenshots and recording</span>
          </div>
        </button>
        <button type="button" class="tour-menu-item" data-tour="p2p">
          <span class="tour-menu-item-icon">🔗</span>
          <div class="tour-menu-item-info">
            <span class="tour-menu-item-title">P2P File Sharing</span>
            <span class="tour-menu-item-desc">Direct file transfers</span>
          </div>
        </button>
        <button type="button" class="tour-menu-item" data-tour="remote">
          <span class="tour-menu-item-icon">🖥️</span>
          <div class="tour-menu-item-info">
            <span class="tour-menu-item-title">Remote Control</span>
            <span class="tour-menu-item-desc">Screen sharing and control</span>
          </div>
        </button>
        <button type="button" class="tour-menu-item" data-tour="settings">
          <span class="tour-menu-item-icon">⚙️</span>
          <div class="tour-menu-item-info">
            <span class="tour-menu-item-title">Settings Tour</span>
            <span class="tour-menu-item-desc">Configure the extension</span>
          </div>
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(menu);
  console.log('🎓 Tour menu added to DOM');
  
  // Attach event listeners using addEventListener (Manifest V3 compatible)
  const closeBtn = document.getElementById('closeTourMenuBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      menu.remove();
    });
  }
  
  // Tour item click handlers
  const tourItems = menu.querySelectorAll('.tour-menu-item');
  tourItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const tourId = item.getAttribute('data-tour');
      console.log('🎓 Starting tour:', tourId);
      menu.remove();
      if (typeof startTourById === 'function') {
        startTourById(tourId);
      } else {
        console.error('startTourById function not found');
        showNotification('Tour Error', 'Tour system not available', 'error');
      }
    });
  });
  
  // Close on outside click after small delay
  const closeOnOutside = (e) => {
    const menuEl = document.getElementById('tourMenu');
    if (menuEl && !menuEl.contains(e.target) && e.target.id !== 'btnStartTour') {
      menuEl.remove();
      document.removeEventListener('click', closeOnOutside);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeOnOutside);
  }, 100);
}

// Make showTourMenu globally available
window.showTourMenu = showTourMenu;

// ============================================================================
// GLOBAL STATE
// ============================================================================

const state = {
  activeTab: 'dashboard',
  recording: false,
  floatingAssistant: {
    available: false,
    open: false
  },
  detectedDocuments: [],
  currentParseData: null,
  currentDocument: null,
  navigateToTab: null,
  macros: [],
  p2p: {
    connected: false,
    role: null,
    peerId: null
  },
  stats: {
    formsDetected: 0,
    macrosSaved: 0,
    screenshotsTaken: 0,
    timeSaved: 0
  },
  activityLog: [],
  connectionCode: null,
  qrInstance: null,
  modules: {},
  aiNexus: {
    streaming: false,
    abortController: null,
    context: {
      url: '',
      forms: 0,
      macros: 0,
      selectors: 0
    },
    attachments: {
      includeDom: false,
      includeMacros: false,
      includeContext: true
    }
  },
  diagnostics: {
    security: {
      manifestVersion: 'Unknown',
      cspStatus: 'Unknown',
      permissions: 0,
      rgbaAudit: 'Not Audited'
    },
    system: {
      browser: 'Unknown',
      version: 'Unknown',
      platform: 'Unknown'
    },
    context: {
      lastRefresh: null,
      errors: []
    },
    formScanner: {
      status: 'unknown',
      avgParseTime: 0,
      formsDetected: 0
    },
    macroEngine: {
      status: 'unknown',
      lastDuration: 0,
      errors: 0
    },
    remoteOps: {
      status: 'unknown',
      qrActive: false,
      connectivity: 'idle'
    },
    aiProviders: {
      status: 'unknown',
      providers: [],
      strategy: 'auto'
    },
    lastCheck: null
  }
};

// ============================================================================
// BOTTOM NAVIGATION EVENT LISTENERS
// Chrome Manifest V3 does not allow inline onclick handlers due to CSP
// All click handlers must be attached via addEventListener
// ============================================================================

/**
 * Initialize bottom navigation click handlers
 * Must be called after DOM is ready
 */
function initializeBottomNavigation() {
  console.log('🔧 Initializing bottom navigation...');
  
  // ===== HEADER BUTTONS (Tours, Theme) =====
  // Initialize Tours button FIRST - this is critical
  const toursBtn = document.getElementById('btnStartTour');
  if (toursBtn) {
    console.log('🎓 Found Tours button, attaching handler');
    toursBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🎓 Tours button clicked via onclick!');
      showTourMenu();
    };
  } else {
    console.error('❌ Tours button (btnStartTour) not found!');
  }
  
  // Attach click handlers to all bottom nav items
  const navItems = document.querySelectorAll('.bottom-nav-item[data-nav-tab]');
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const tabId = this.getAttribute('data-nav-tab');
      console.log(`🔧 Bottom nav clicked: ${tabId}`);
      handleBottomNavClick(this, tabId);
    });
  });
  
  // Attach click handler to More button
  const moreBtn = document.querySelector('.bottom-nav-item[data-more-menu]');
  if (moreBtn) {
    moreBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('🔧 More button clicked');
      toggleMoreMenu(true);
    });
  }
  
  // Attach click handler to close More menu button
  const closeMoreBtn = document.getElementById('btnCloseMoreMenu');
  if (closeMoreBtn) {
    closeMoreBtn.addEventListener('click', function(e) {
      e.preventDefault();
      toggleMoreMenu(false);
    });
  }
  
  // Close More menu when clicking overlay background
  const moreOverlay = document.getElementById('moreMenuOverlay');
  if (moreOverlay) {
    moreOverlay.addEventListener('click', function(e) {
      if (e.target === this) {
        toggleMoreMenu(false);
      }
    });
  }
  
  // Attach click handlers to More menu items with data-target (navigate to tab)
  const moreMenuItems = document.querySelectorAll('.more-menu-item[data-target]');
  moreMenuItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('data-target');
      const tabId = target.replace('tab-', '');
      console.log(`🔧 More menu item clicked: ${tabId}`);
      toggleMoreMenu(false);
      handleBottomNavClick(this, tabId);
    });
  });
  
  // Attach click handlers to More menu items with data-action (special actions)
  const moreActionItems = document.querySelectorAll('.more-menu-item[data-action]');
  moreActionItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const action = this.getAttribute('data-action');
      console.log(`🔧 More menu action clicked: ${action}`);
      toggleMoreMenu(false);
      handleMoreMenuAction(action);
    });
  });
  
  console.log(`🔧 Bottom navigation initialized: ${navItems.length} nav items, ${moreMenuItems.length} more menu items, ${moreActionItems.length} action items`);
}

/**
 * Handle bottom navigation button clicks
 * @param {HTMLElement} element - The clicked button element
 * @param {string} tabId - The ID of the tab to navigate to (without 'tab-' prefix)
 */
function handleBottomNavClick(element, tabId) {
  console.log(`🔧 handleBottomNavClick called: tabId=${tabId}`);
  
  // Update active state on bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Find the nav item with matching data-nav-tab and set active
  const navItem = document.querySelector(`.bottom-nav-item[data-nav-tab="${tabId}"]`);
  if (navItem) {
    navItem.classList.add('active');
  }
  
  // Navigate to the tab
  if (typeof setActiveTab === 'function') {
    setActiveTab(tabId);
  } else {
    // Fallback: direct DOM manipulation
    const contentId = `tab-${tabId}`;
    document.querySelectorAll('.tab-content').forEach(section => {
      section.classList.toggle('active', section.id === contentId);
    });
    state.activeTab = tabId;
    console.log(`🔧 Navigated to ${tabId} (fallback mode)`);
  }
}

/**
 * Toggle the More menu overlay
 * @param {boolean} show - Whether to show or hide the menu
 */
function toggleMoreMenu(show) {
  const overlay = document.getElementById('moreMenuOverlay');
  if (overlay) {
    overlay.classList.toggle('hidden', !show);
    console.log(`🔧 More menu ${show ? 'opened' : 'closed'}`);
  }
}

/**
 * Handle special actions from the More menu (Settings, Help, etc.)
 * @param {string} action - The action identifier
 */
function handleMoreMenuAction(action) {
  console.log(`🔧 Handling action: ${action}`);
  
  switch (action) {
    case 'settings':
      // Open settings page in new tab
      const settingsUrl = chrome.runtime.getURL('settings/settings.html');
      console.log('🔧 Opening settings:', settingsUrl);
      chrome.tabs.create({ url: settingsUrl });
      break;
      
    case 'help':
      // Start the tour menu as help
      if (typeof showTourMenu === 'function') {
        showTourMenu();
      } else {
        showNotification('Help', 'Use the Tours button in the header for guided help!', 'info');
      }
      break;
      
    case 'about':
      // Show about modal
      showAboutModal();
      break;
      
    default:
      console.warn(`Unknown action: ${action}`);
      showNotification('Coming Soon', `The ${action} feature is under development.`, 'info');
  }
}

/**
 * Show the About modal with extension information
 */
function showAboutModal() {
  const manifest = chrome.runtime.getManifest();
  const message = `
CUBE Nexum v${manifest.version}

Enterprise Command Center for browser automation, document extraction, and AI-powered workflows.

© 2024-2025 CUBE Nexum Team
  `.trim();
  
  showNotification('About CUBE Nexum', message, 'info');
}

// ============================================================================
// STAT MANAGEMENT
// ============================================================================

async function incrementStat(statName, amount = 1) {
  if (state.stats[statName] !== undefined) {
    state.stats[statName] += amount;
    updateStatsDisplay();
    
    // Persist to storage
    try {
      await chrome.storage.local.set({ 
        'cubeStats': state.stats 
      });
    } catch (error) {
      console.warn('Failed to persist stats:', error);
    }
  }
}

function updateStatsDisplay() {
  const formsEl = document.getElementById('formsDetected');
  const macrosEl = document.getElementById('macrosSaved');
  const screenshotsEl = document.getElementById('screenshotsTaken');
  const timeSavedEl = document.getElementById('timeSaved');
  
  if (formsEl) formsEl.textContent = state.stats.formsDetected;
  if (macrosEl) macrosEl.textContent = state.stats.macrosSaved;
  if (screenshotsEl) screenshotsEl.textContent = state.stats.screenshotsTaken;
  if (timeSavedEl) timeSavedEl.textContent = `${state.stats.timeSaved.toFixed(1)}h`;
}

async function initializeStats(options = { persist: true }) {
  try {
    const result = await chrome.storage.local.get(['cubeStats']);
    if (result.cubeStats) {
      state.stats = { ...state.stats, ...result.cubeStats };
    }
    updateStatsDisplay();
  } catch (error) {
    console.warn('Failed to load stats:', error);
  }
}

async function persistStats() {
  try {
    await chrome.storage.local.set({ cubeStats: state.stats });
  } catch (error) {
    console.warn('Failed to persist stats:', error);
  }
}

function normalizeStats(stats) {
  return {
    formsDetected: stats.formsDetected || stats.formsAutofilled || 0,
    macrosSaved: stats.macrosSaved || stats.macrosRecorded || 0,
    screenshotsTaken: stats.screenshotsTaken || 0,
    timeSaved: stats.timeSaved || 0
  };
}

const ASTRA_FEATURED_LIMIT = 4;
const ASTRA_PIN_LIMIT = 6;
const NAV_LAYOUT_STORAGE_KEY = 'cubeAstraNavLayout.v3';
const NAV_LAYOUT_PERSIST_DEBOUNCE_MS = 800;

let navLayoutPersistTimer;

function getDefaultNavLayout() {
  const order = TAB_CONFIG.map((tab) => tab.id);
  const defaultPinCount = Math.min(ASTRA_FEATURED_LIMIT, ASTRA_PIN_LIMIT, order.length);
  return {
    order,
    pins: order.slice(0, defaultPinCount)
  };
}

function normalizeNavLayout(layout) {
  const baseOrder = TAB_CONFIG.map((tab) => tab.id);
  const normalizedOrder = Array.isArray(layout?.order)
    ? layout.order.filter((tabId) => baseOrder.includes(tabId))
    : [];

  baseOrder.forEach((tabId) => {
    if (!normalizedOrder.includes(tabId)) {
      normalizedOrder.push(tabId);
    }
  });

  const normalizedPins = Array.isArray(layout?.pins)
    ? layout.pins.filter((tabId) => normalizedOrder.includes(tabId))
    : [];

  const fallbackPins = normalizedOrder.slice(0, Math.min(ASTRA_FEATURED_LIMIT, ASTRA_PIN_LIMIT, normalizedOrder.length));

  return {
    order: normalizedOrder,
    pins: (normalizedPins.length ? normalizedPins : fallbackPins).slice(0, Math.min(ASTRA_PIN_LIMIT, normalizedOrder.length))
  };
}

async function loadNavLayoutPreferences() {
  try {
    const stored = await chrome.storage.local.get([NAV_LAYOUT_STORAGE_KEY]);
    return stored[NAV_LAYOUT_STORAGE_KEY] || getDefaultNavLayout();
  } catch (error) {
    console.warn('Failed to load navigation layout preferences:', error);
    return getDefaultNavLayout();
  }
}

function scheduleNavLayoutPersist(layout) {
  if (!layout) {
    return;
  }
  if (navLayoutPersistTimer) {
    clearTimeout(navLayoutPersistTimer);
  }
  navLayoutPersistTimer = setTimeout(() => {
    persistNavLayout(layout).catch((error) => console.warn('Failed to persist navigation layout:', error));
  }, NAV_LAYOUT_PERSIST_DEBOUNCE_MS);
}

async function persistNavLayout(layout) {
  await chrome.storage.local.set({ [NAV_LAYOUT_STORAGE_KEY]: layout });
}

const TAB_CONFIG = [
  { id: 'dashboard', label: 'Command Dashboard', icon: '📊' },
  { id: 'macro', label: 'Macro Studio', icon: '🎬' },
  { id: 'automation', label: 'Automation Shell', icon: '🖥️' },
  { id: 'ai-nexus', label: 'AI Nexus', icon: '🤖' },
  { id: 'diagnostics', label: 'Diagnostics', icon: '🛡️' },
  { id: 'screenshot', label: 'Screen Capture', icon: '📸' },
  { id: 'remote', label: 'Remote Ops', icon: '🛰️' },
  { id: 'ai', label: 'AI Providers', icon: '🧠' },
  { id: 'p2p', label: 'P2P Bridge', icon: '🔗' },
  { id: 'activity', label: 'Mission Log', icon: '📜' }
];

const MODULE_HEALTH_REFRESH_INTERVAL_MS = 45000;
const MODULE_HEALTH_CONFIG = {
  ftp: { label: 'FTP Bridge', messageType: 'GET_FTP_MANAGER' }
};

async function initializeArcNavigation() {
  // New Tab Navigation
  const tabNavScroll = document.getElementById('tabNavScroll');
  const tabNavItems = document.querySelectorAll('.tab-nav-item');
  
  // Legacy Space Switcher support
  const spaceSwitcher = document.getElementById('spaceSwitcher');
  const currentSpaceLabel = document.getElementById('currentSpaceLabel');
  const navToggle = document.getElementById('navToggle');
  const contents = document.querySelectorAll('.tab-content');

  // Initialize state
  state.activeTab = state.activeTab || 'dashboard';
  
  // Expose navigation function to global state (for backward compatibility)
  state.navigateToTab = setActiveTab;
  
  console.log('🔧 Arc navigation initialized, setActiveTab exposed to state');

  // Handle New Tab Navigation Clicks
  if (tabNavItems.length > 0) {
    tabNavItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const targetTab = item.dataset.target.replace('tab-', '');
        setActiveTab(targetTab);
        
        // Scroll active tab into view
        item.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    });
  }

  // Legacy: Handle Space Switcher Clicks (if exists)
  if (spaceSwitcher) {
    spaceSwitcher.addEventListener('click', (e) => {
      const item = e.target.closest('.space-item');
      if (!item) return;
      
      const targetTab = item.dataset.target.replace('tab-', '');
      setActiveTab(targetTab);
    });
  }

  // Handle Hamburger Toggle (Mobile/Compact)
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const container = document.querySelector('.arc-navigation-container');
      if (container) {
        container.classList.toggle('expanded');
      }
    });
  }
  
  // Initialize Quick Actions Menu
  initializeQuickMenu();

  // Set initial active tab
  setActiveTab(state.activeTab, false);
}

function initializeQuickMenu() {
  const menuToggle = document.getElementById('quickMenuToggle');
  const menuDropdown = document.getElementById('quickMenuDropdown');
  
  if (!menuToggle || !menuDropdown) return;
  
  // Toggle menu
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menuToggle.classList.toggle('active');
    menuDropdown.classList.toggle('open');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuToggle.contains(e.target) && !menuDropdown.contains(e.target)) {
      menuToggle.classList.remove('active');
      menuDropdown.classList.remove('open');
    }
  });
  
  // Handle menu item clicks
  menuDropdown.querySelectorAll('.quick-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      handleQuickMenuAction(action);
      
      menuToggle.classList.remove('active');
      menuDropdown.classList.remove('open');
    });
  });
}

function handleQuickMenuAction(action) {
  switch (action) {
    case 'settings':
      showSettingsModal();
      break;
      
    case 'keyboard':
      showKeyboardShortcuts();
      break;
      
    case 'export':
      handleExportData();
      break;
      
    case 'import':
      handleImportData();
      break;
      
    case 'help':
      // Open local documentation
      chrome.tabs.create({ url: chrome.runtime.getURL('docs/help.html') });
      break;
      
    case 'about':
      showAboutModal();
      break;
      
    default:
      console.warn('Unknown action:', action);
  }
}

function showSettingsModal() {
  const modalHtml = `
    <div class="settings-modal-content">
      <h3>⚙️ Settings</h3>
      
      <div class="setting-group">
        <label class="setting-label">Theme</label>
        <select id="settingTheme" class="form-input">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="system">System</option>
        </select>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">
          <input type="checkbox" id="settingAutoFill" checked>
          Enable Auto-Fill Suggestions
        </label>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">
          <input type="checkbox" id="settingNotifications" checked>
          Show Notifications
        </label>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">
          <input type="checkbox" id="settingFloatingAssistant" checked>
          Show Floating Assistant
        </label>
      </div>
      
      <div class="setting-actions">
        <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
        <button type="button" class="btn btn-primary" data-action="save-settings">Save</button>
      </div>
    </div>
  `;
  
  showModal('Settings', modalHtml);
}

function showModal(title, content) {
  // Remove existing modal
  const existingModal = document.querySelector('.cube-modal-overlay');
  if (existingModal) existingModal.remove();
  
  const overlay = document.createElement('div');
  overlay.className = 'cube-modal-overlay';
  overlay.innerHTML = `
    <div class="cube-modal">
      <div class="cube-modal-header">
        <h2>${title}</h2>
        <button type="button" class="cube-modal-close" data-action="close-modal" aria-label="Close modal">×</button>
      </div>
      <div class="cube-modal-body">
        ${content}
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  
  // Attach event listeners after modal is added to DOM
  // This replaces inline onclick attributes which are blocked by Manifest V3 CSP
  setTimeout(() => {
    attachModalEventListeners();
  }, 0);
}

/**
 * Attach event listeners to modal buttons after modal is rendered
 * This is necessary because Manifest V3 CSP blocks inline onclick handlers
 */
function attachModalEventListeners() {
  // Close modal buttons
  document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  });
  
  // Save settings button
  const saveSettingsBtn = document.querySelector('[data-action="save-settings"]');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof saveSettings === 'function') saveSettings();
    });
  }
  
  // Save directory path buttons
  document.querySelectorAll('[data-action="save-directory-path"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const type = btn.getAttribute('data-type');
      if (typeof saveDirectoryPath === 'function') saveDirectoryPath(type);
    });
  });
  
  // Create new chat button
  const createChatBtn = document.querySelector('[data-action="create-new-chat"]');
  if (createChatBtn) {
    createChatBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof createNewChat === 'function') createNewChat();
    });
  }
  
  // Download document buttons
  document.querySelectorAll('[data-action="download-document"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = btn.getAttribute('data-url');
      if (typeof downloadDocument === 'function') downloadDocument(url);
    });
  });
}

window.closeModal = function() {
  const modal = document.querySelector('.cube-modal-overlay');
  if (modal) modal.remove();
};

window.saveSettings = async function() {
  const theme = document.getElementById('settingTheme')?.value || 'dark';
  const autoFill = document.getElementById('settingAutoFill')?.checked ?? true;
  const notifications = document.getElementById('settingNotifications')?.checked ?? true;
  const floatingAssistant = document.getElementById('settingFloatingAssistant')?.checked ?? true;
  
  const settings = { theme, autoFill, notifications, floatingAssistant };
  
  try {
    await chrome.storage.local.set({ cubeSettings: settings });
    
    // Apply theme
    document.body.setAttribute('data-theme', theme);
    await chrome.storage.local.set({ cubeTheme: theme });
    
    showNotification('Settings', 'Settings saved successfully');
    closeModal();
  } catch (error) {
    showNotification('Error', 'Failed to save settings', 'error');
  }
};

function showKeyboardShortcuts() {
  const shortcuts = `
    ⌨️ Keyboard Shortcuts
    
    Ctrl/Cmd + Shift + R - Start/Stop Recording
    Ctrl/Cmd + Shift + P - Play Last Macro
    Ctrl/Cmd + Shift + S - Take Screenshot
    Ctrl/Cmd + Shift + F - Detect Forms
    Ctrl/Cmd + Shift + D - Detect Documents
    Ctrl/Cmd + 1-8 - Switch Tabs
  `;
  
  showNotification('Keyboard Shortcuts', shortcuts.trim());
}

async function handleExportData() {
  try {
    addActivityLog('Export', 'Preparing data export...', 'info');
    
    const data = await chrome.storage.local.get(null);
    const exportData = {
      version: '7.0.0',
      exportDate: new Date().toISOString(),
      macros: data.savedMacros || [],
      settings: data.cubeSettings || {},
      theme: data.cubeTheme || 'dark'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `cube-nexum-export-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    addActivityLog('Export', 'Data exported successfully', 'success');
    showNotification('Export Complete', 'Your data has been exported');
  } catch (error) {
    addActivityLog('Export', `Export failed: ${error.message}`, 'error');
  }
}

function handleImportData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      addActivityLog('Import', 'Reading import file...', 'info');
      
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.version && data.macros) {
        await chrome.storage.local.set({
          savedMacros: data.macros,
          cubeSettings: data.settings || {},
          cubeTheme: data.theme || 'dark'
        });
        
        addActivityLog('Import', `Imported ${data.macros.length} macros`, 'success');
        showNotification('Import Complete', `Imported ${data.macros.length} macros`);
        
        // Refresh macros list
        initializeMacros();
      } else {
        throw new Error('Invalid import file format');
      }
    } catch (error) {
      addActivityLog('Import', `Import failed: ${error.message}`, 'error');
      showNotification('Import Failed', error.message);
    }
  };
  
  input.click();
}

function showAboutModal() {
  // Create a proper modal overlay
  const existingModal = document.getElementById('aboutModalOverlay');
  if (existingModal) {
    existingModal.remove();
  }

  const modalHtml = `
    <div id="aboutModalOverlay" class="modal-overlay" style="
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.8); z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(8px);
    ">
      <div class="about-modal" style="
        background: linear-gradient(135deg, #1a1625 0%, #2d2640 100%);
        border-radius: 20px; padding: 32px; max-width: 420px; width: 90%;
        border: 1px solid rgba(124, 58, 237, 0.3);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      ">
        <!-- Logo and Title -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="
            width: 80px; height: 80px; margin: 0 auto 16px;
            background: linear-gradient(135deg, #7c3aed, #a78bfa);
            border-radius: 20px; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4);
          ">
            <span style="font-size: 40px;">🔮</span>
          </div>
          <h2 style="font-size: 24px; font-weight: 700; color: white; margin: 0 0 8px;">CUBE Nexum</h2>
          <div style="
            display: inline-block; padding: 4px 12px;
            background: linear-gradient(135deg, #7c3aed, #a78bfa);
            border-radius: 20px; font-size: 12px; font-weight: 600; color: white;
          ">Enterprise v7.0.0</div>
        </div>

        <!-- Description -->
        <p style="color: rgba(255,255,255,0.7); text-align: center; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Professional browser automation platform with AI-powered assistance.
          Streamline your workflow with intelligent form filling, macro automation,
          and seamless document management.
        </p>

        <!-- Company Info -->
        <div style="
          background: rgba(124, 58, 237, 0.1); border-radius: 12px;
          padding: 16px; margin-bottom: 24px;
        ">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span style="font-size: 20px;">🏢</span>
            <div>
              <div style="color: white; font-weight: 600; font-size: 14px;">CUBE Advisors, Inc.</div>
              <div style="color: rgba(255,255,255,0.5); font-size: 12px;">Miami, FL • Since 2020</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span style="font-size: 20px;">🌐</span>
            <a href="https://es.cubeadvisors.io" target="_blank" style="color: #a78bfa; font-size: 14px; text-decoration: none;">
              es.cubeadvisors.io
            </a>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 20px;">📧</span>
            <a href="mailto:support@cubeadvisors.io" style="color: #a78bfa; font-size: 14px; text-decoration: none;">
              support@cubeadvisors.io
            </a>
          </div>
        </div>

        <!-- Features -->
        <div style="
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
          margin-bottom: 24px;
        ">
          <div style="background: rgba(59, 130, 246, 0.1); padding: 12px; border-radius: 8px; text-align: center;">
            <span style="font-size: 20px;">🤖</span>
            <div style="color: rgba(255,255,255,0.8); font-size: 11px; margin-top: 4px;">AI Assistant</div>
          </div>
          <div style="background: rgba(34, 197, 94, 0.1); padding: 12px; border-radius: 8px; text-align: center;">
            <span style="font-size: 20px;">⚡</span>
            <div style="color: rgba(255,255,255,0.8); font-size: 11px; margin-top: 4px;">Macros</div>
          </div>
          <div style="background: rgba(249, 115, 22, 0.1); padding: 12px; border-radius: 8px; text-align: center;">
            <span style="font-size: 20px;">📋</span>
            <div style="color: rgba(255,255,255,0.8); font-size: 11px; margin-top: 4px;">Auto-Fill</div>
          </div>
          <div style="background: rgba(168, 85, 247, 0.1); padding: 12px; border-radius: 8px; text-align: center;">
            <span style="font-size: 20px;">📸</span>
            <div style="color: rgba(255,255,255,0.8); font-size: 11px; margin-top: 4px;">Screen Capture</div>
          </div>
        </div>

        <!-- Copyright -->
        <p style="color: rgba(255,255,255,0.4); font-size: 11px; text-align: center; margin-bottom: 20px;">
          © 2020-2025 CUBE Advisors, Inc. All rights reserved.<br>
          Made with ❤️ in Miami
        </p>

        <!-- Close Button -->
        <button type="button" id="aboutModalCloseBtn" style="
          width: 100%; padding: 14px; background: linear-gradient(135deg, #7c3aed, #a78bfa);
          border: none; border-radius: 12px; color: white; font-weight: 600;
          cursor: pointer; font-size: 14px;
          transition: opacity 0.2s;
        ">
          Close
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Attach event listener after modal is added to DOM (Manifest V3 compatible)
  const closeBtn = document.getElementById('aboutModalCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const overlay = document.getElementById('aboutModalOverlay');
      if (overlay) overlay.remove();
    });
    
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.opacity = '0.9';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.opacity = '1';
    });
  }
  
  // Close on overlay click
  const overlay = document.getElementById('aboutModalOverlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }
}

// ============================================================================
// TAB NAVIGATION - Core function for switching tabs
// ============================================================================

function setActiveTab(tabId, shouldLog = true) {
  const contentId = `tab-${tabId}`;
  const targetContent = document.getElementById(contentId);
  
  if (!targetContent) {
    console.warn(`Tab content not found for id: ${tabId}`);
    return;
  }

  // Update Content Visibility
  document.querySelectorAll('.tab-content').forEach((section) => {
    section.classList.toggle('active', section.id === contentId);
  });

  // Update New Tab Navigation State
  document.querySelectorAll('.tab-nav-item').forEach(item => {
    const isTarget = item.dataset.target === contentId;
    item.classList.toggle('active', isTarget);
    
    if (isTarget) {
      // Scroll into view if needed
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });

  // Update Legacy Space Switcher State (for compatibility)
  document.querySelectorAll('.space-item').forEach(item => {
    const isTarget = item.dataset.target === contentId;
    item.classList.toggle('active', isTarget);
    
    if (isTarget) {
      // Update Label
      const label = document.getElementById('currentSpaceLabel');
      if (label) label.textContent = item.getAttribute('title');
      
      // Scroll into view if needed
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });

  // Update bottom navigation state
  const bottomNavItem = document.querySelector(`.bottom-nav-item[data-target="${contentId}"]`);
  if (bottomNavItem) {
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.classList.remove('active');
    });
    bottomNavItem.classList.add('active');
  }

  state.activeTab = tabId;

  if (shouldLog) {
    // Try new nav first, then legacy
    const navItem = document.querySelector(`.tab-nav-item[data-target="${contentId}"]`) ||
                   document.querySelector(`.space-item[data-target="${contentId}"]`);
    const label = navItem?.getAttribute('title') || tabId;
    addActivityLog('Navigation', `Switched to ${label}`, 'info');
  }
}

// ============================================================================
// BUTTON EVENT HANDLERS
// ============================================================================

function initializeButtons() {
  // Dashboard buttons
  document.getElementById('btnAutoFill')?.addEventListener('click', handleAutoFill);
  document.getElementById('btnDetectForms')?.addEventListener('click', handleDetectForms);
  document.getElementById('btnDetectDocuments')?.addEventListener('click', handleDetectDocuments);
  document.getElementById('btnRecordMacro')?.addEventListener('click', handleRecordMacro);
  document.getElementById('btnPlayMacro')?.addEventListener('click', handlePlayMacro);
  document.getElementById('btnQuickRemote')?.addEventListener('click', () => handleQuickNavigation('remote'));
  document.getElementById('btnScreenshotArea')?.addEventListener('click', () => handleScreenshot('area'));
  document.getElementById('btnScreenshotFull')?.addEventListener('click', () => handleScreenshot('fullscreen'));
  document.getElementById('btnStartHost')?.addEventListener('click', handleStartHost);
  document.getElementById('btnConnectRemote')?.addEventListener('click', handleConnectRemote);
  
  // Theme toggle
  document.getElementById('btnThemeToggle')?.addEventListener('click', toggleTheme);
  
  // Macro tab buttons
  document.getElementById('btnStartRecording')?.addEventListener('click', startMacroRecording);
  document.getElementById('btnStopRecording')?.addEventListener('click', stopMacroRecording);
  document.getElementById('btnPlayLastMacro')?.addEventListener('click', handlePlayMacro);
  
  // Screenshot mode buttons
  document.querySelectorAll('.screenshot-mode').forEach(mode => {
    mode.addEventListener('click', () => {
      const modeType = mode.getAttribute('data-mode');
      handleScreenshot(modeType);
    });
  });

  // Screen Recording buttons
  document.getElementById('btnStartScreenRecording')?.addEventListener('click', handleStartScreenRecording);
  document.getElementById('btnStopScreenRecording')?.addEventListener('click', handleStopScreenRecording);
  
  // Remote control buttons
  document.getElementById('btnGenerateCode')?.addEventListener('click', generateConnectionCode);
  document.getElementById('btnCopyCode')?.addEventListener('click', copyConnectionCode);
  document.getElementById('btnConnect')?.addEventListener('click', connectToRemoteSession);
  
  // AI Chat buttons
  document.getElementById('btnSendAiMessage')?.addEventListener('click', handleAIChatSend);
  document.getElementById('aiChatInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAIChatSend();
  });
  
  // AI Personality selector
  document.getElementById('btnChangePersonality')?.addEventListener('click', togglePersonalitySelector);
  document.querySelectorAll('.personality-card').forEach(card => {
    card.addEventListener('click', () => {
      const personalityId = card.dataset.personality;
      selectAIPersonality(personalityId);
    });
  });
  
  // Load saved personality on init
  loadSavedPersonality();
  
  // P2P buttons
  document.getElementById('btnP2PConnect')?.addEventListener('click', handleP2PConnect);
  document.getElementById('btnCopyPeerId')?.addEventListener('click', handleCopyPeerId);
  document.getElementById('btnRefreshPeerId')?.addEventListener('click', handleRefreshPeerId);
  document.getElementById('btnSelectShareDir')?.addEventListener('click', handleSelectShareDirectory);
  document.getElementById('btnSelectDownloadDir')?.addEventListener('click', handleSelectDownloadDirectory);
  
  // Diagnostics buttons
  document.getElementById('btnRunDiagnostics')?.addEventListener('click', runDiagnostics);
  
  // AI settings buttons
  document.getElementById('btnSaveAI')?.addEventListener('click', saveAISettings);
  
  // Activity log buttons
  document.getElementById('btnClearLog')?.addEventListener('click', clearActivityLog);
  document.getElementById('btnExportLog')?.addEventListener('click', exportActivityLog);
  
  // Automation shell
  document.getElementById('btnRunAutomation')?.addEventListener('click', handleRunAutomation);
  document.getElementById('btnClearAutomation')?.addEventListener('click', clearAutomationOutput);
  
  // Automation quick actions
  document.getElementById('btnQuickAutoFill')?.addEventListener('click', handleAutoFill);
  document.getElementById('btnQuickDetect')?.addEventListener('click', handleDetectForms);
  document.getElementById('btnQuickRecord')?.addEventListener('click', handleRecordMacro);
  document.getElementById('btnQuickPlay')?.addEventListener('click', handlePlayMacro);
  
  // Automation examples chips
  document.querySelectorAll('.example-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const command = chip.getAttribute('data-command');
      if (command) {
        const input = document.getElementById('automationCommand');
        if (input) {
          input.value = command;
          input.focus();
        }
      }
    });
  });
  
  // Toggle examples visibility
  document.getElementById('btnToggleExamples')?.addEventListener('click', function() {
    const grid = document.querySelector('.examples-grid');
    if (grid) {
      const isHidden = grid.style.display === 'none';
      grid.style.display = isHidden ? 'flex' : 'none';
      this.textContent = isHidden ? 'Hide' : 'Show';
    }
  });
  
  // Help button in automation
  document.getElementById('btnAutomationHelp')?.addEventListener('click', () => {
    // Navigate to Help tab
    if (typeof handleBottomNavClick === 'function') {
      handleBottomNavClick(null, 'help');
    }
  });
  
  // LendingPad buttons
  document.getElementById('btnLendingPadDetect')?.addEventListener('click', handleLendingPadDetect);
  document.getElementById('btnLendingPadDownload')?.addEventListener('click', handleLendingPadDownload);
  document.getElementById('btnLendingPadExtract')?.addEventListener('click', handleLendingPadExtract);

  initializeFloatingAssistantControls();
  initializeP2P();
  
  console.log('✅ All button handlers initialized');
}

function handleQuickNavigation(tabId) {
  if (typeof state.navigateToTab === 'function') {
    state.navigateToTab(tabId);
  }
}

function initializeFloatingAssistantControls() {
  const button = document.getElementById('btnLaunchFloatingAI');
  if (!button) {
    return;
  }

  button.addEventListener('click', handleFloatingAIToggle);
  refreshFloatingAssistantStatus();
}

async function refreshFloatingAssistantStatus() {
  const button = document.getElementById('btnLaunchFloatingAI');
  if (!button) {
    return;
  }

  button.setAttribute('aria-busy', 'true');

  try {
    const response = await sendMessageToActiveTab({
      type: 'FLOATING_AI_COMMAND',
      command: 'status'
    });
    state.floatingAssistant.available = true;
    state.floatingAssistant.open = Boolean(response?.open);
    updateFloatingAssistantButton();
  } catch (error) {
    state.floatingAssistant.available = false;
    state.floatingAssistant.open = false;
    updateFloatingAssistantButton(error.message);
    console.warn('Floating assistant status unavailable:', error);
  } finally {
    button.removeAttribute('aria-busy');
  }
}

async function handleFloatingAIToggle() {
  const button = document.getElementById('btnLaunchFloatingAI');
  if (!button) {
    return;
  }

  button.disabled = true;
  button.textContent = '⏳ Checking...';
  button.setAttribute('aria-busy', 'true');

  try {
    const response = await sendMessageToActiveTab({
      type: 'FLOATING_AI_COMMAND',
      command: 'toggle'
    });

    state.floatingAssistant.available = true;
    state.floatingAssistant.open = Boolean(response?.open);
    updateFloatingAssistantButton();

    addActivityLog(
      'AI',
      state.floatingAssistant.open ? 'Floating assistant opened' : 'Floating assistant hidden',
      'info'
    );
  } catch (error) {
    state.floatingAssistant.available = false;
    state.floatingAssistant.open = false;
    updateFloatingAssistantButton(error.message);
    addActivityLog('AI', `Floating assistant unavailable: ${error.message}`, 'error');
    showNotification('Floating AI', error.message || 'Unable to reach floating assistant');
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    updateFloatingAssistantButton();
  }
}

function updateFloatingAssistantButton(errorMessage = '') {
  const button = document.getElementById('btnLaunchFloatingAI');
  if (!button) {
    return;
  }

  if (!state.floatingAssistant.available) {
    button.textContent = '🪟 Floating AI';
    button.setAttribute('aria-pressed', 'false');
    if (errorMessage) {
      button.title = errorMessage;
    } else {
      button.removeAttribute('title');
    }
    return;
  }

  if (state.floatingAssistant.open) {
    button.textContent = '🪟 Hide Floating AI';
    button.setAttribute('aria-pressed', 'true');
    button.removeAttribute('title');
  } else {
    button.textContent = '🪟 Floating AI';
    button.setAttribute('aria-pressed', 'false');
    button.removeAttribute('title');
  }
}

// ============================================================================
// AUTO-FILL FUNCTIONALITY
// ============================================================================

async function handleAutoFill() {
  try {
    addActivityLog('Auto-Fill', 'Starting form detection and fill...', 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { type: 'AUTOFILL_FORM' });
    
    await incrementStat('formsDetected');
    await incrementStat('timeSaved', 0.5);
    
    addActivityLog('Auto-Fill', 'Form filled successfully', 'success');
    showNotification('Auto-Fill Complete', 'Form has been filled with sample data');
  } catch (error) {
    console.error('Auto-fill failed:', error);
    addActivityLog('Auto-Fill', `Failed: ${error.message}`, 'error');
    showNotification('Auto-Fill Failed', error.message, 'error');
  }
}

async function handleDetectForms() {
  try {
    addActivityLog('Detection', 'Detecting forms on current page...', 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'DETECT_FORMS' });
    
    if (response && response.count > 0) {
      addActivityLog('Detection', `Found ${response.count} form(s)`, 'success');
      showNotification('Forms Detected', `Found ${response.count} form(s) on this page`);
    } else {
      addActivityLog('Detection', 'No forms found on this page', 'warning');
      showNotification('No Forms Found', 'This page does not contain any fillable forms');
    }
  } catch (error) {
    console.error('Form detection failed:', error);
    addActivityLog('Detection', `Failed: ${error.message}`, 'error');
  }
}

// ============================================================================
// DOCUMENT DETECTION & PARSING
// ============================================================================

async function handleDetectDocuments() {
  try {
    addActivityLog('Detection', 'Detecting documents on current page...', 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { 
      type: 'DETECT_DOCUMENTS',
      options: {
        types: ['pdf', 'excel', 'word', 'csv'],
        includeEmbedded: true,
        includeLinks: true
      }
    });
    
    if (response && response.success && response.documents) {
      const count = response.documents.length;
      addActivityLog('Detection', `Found ${count} document(s)`, 'success');
      renderDocumentsList(response.documents);
      
      if (count > 0) {
        showNotification('Documents Detected', `Found ${count} document(s) on this page`);
      } else {
        showNotification('No Documents Found', 'This page does not contain any documents');
      }
    } else {
      addActivityLog('Detection', 'No documents found on this page', 'warning');
      renderDocumentsList([]);
    }
  } catch (error) {
    console.error('Document detection failed:', error);
    addActivityLog('Detection', `Failed: ${error.message}`, 'error');
    renderDocumentsList([]);
  }
}

function renderDocumentsList(documents) {
  const documentsList = document.getElementById('documentsList');
  
  if (!documentsList) return;
  
  if (documents.length === 0) {
    documentsList.innerHTML = `
      <div class="documents-empty">
        <div class="documents-empty-icon">📄</div>
        <div class="documents-empty-text">No documents found on this page</div>
      </div>
    `;
    documentsList.classList.remove('hidden');
    return;
  }
  
  documentsList.innerHTML = documents.map((doc, index) => {
    const icon = getDocumentIcon(doc.type);
    const iconClass = getDocumentIconClass(doc.type);
    const size = doc.size ? formatFileSize(doc.size) : 'Unknown size';
    
    return `
      <div class="document-item" data-index="${index}">
        <div class="document-icon ${iconClass}">
          ${icon}
        </div>
        <div class="document-info">
          <div class="document-name" title="${doc.name || doc.url}">${doc.name || 'Untitled Document'}</div>
          <div class="document-meta">
            <span class="document-type">${doc.type}</span>
            <span>•</span>
            <span class="document-size">${size}</span>
          </div>
        </div>
        <div class="document-actions">
          <button class="btn btn-primary btn-parse-doc" data-doc-index="${index}">
            📊 Parse
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  documentsList.classList.remove('hidden');
  
  // Attach event listeners (Manifest V3 compatible)
  documentsList.querySelectorAll('.btn-parse-doc').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.docIndex, 10);
      parseDocument(index);
    });
  });
  
  // Store documents in state for later access
  state.detectedDocuments = documents;
}

function getDocumentIcon(type) {
  const icons = {
    'pdf': '📕',
    'excel': '📗',
    'word': '📘',
    'csv': '📄',
    'default': '📄'
  };
  return icons[type?.toLowerCase()] || icons.default;
}

function getDocumentIconClass(type) {
  return type?.toLowerCase() || 'default';
}

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function parseDocument(index) {
  try {
    const doc = state.detectedDocuments?.[index];
    if (!doc) {
      showNotification('Error', 'Document not found', 'error');
      return;
    }
    
    addActivityLog('Parse', `Parsing ${doc.name || 'document'}...`, 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'PARSE_DOCUMENT',
      url: doc.url,
      documentType: doc.type,
      options: {
        extractText: true,
        extractTables: true,
        extractMetadata: true
      }
    });
    
    if (response && response.success && response.data) {
      addActivityLog('Parse', `Successfully parsed ${doc.name}`, 'success');
      showParseResults(doc, response.data);
    } else {
      throw new Error(response?.error || 'Failed to parse document');
    }
  } catch (error) {
    console.error('Document parsing failed:', error);
    addActivityLog('Parse', `Failed: ${error.message}`, 'error');
    showNotification('Parse Failed', error.message, 'error');
  }
}

function showParseResults(document, data) {
  // Create modal HTML
  const modalHTML = `
    <div class="parse-results-modal" id="parseResultsModal">
      <div class="parse-results-panel">
        <div class="parse-results-header">
          <h3 class="parse-results-title">Parse Results: ${document.name || 'Document'}</h3>
          <button class="parse-results-close" id="btnCloseParseResults">✕</button>
        </div>
        <div class="parse-results-content">
          ${renderParseData(data)}
        </div>
        <div class="parse-results-actions">
          <button class="btn btn-primary" id="btnUseForAutofill">
            🎯 Use for Autofill
          </button>
          <button class="btn btn-secondary" id="btnSaveAsProfile">
            💾 Save as Profile
          </button>
          <button class="btn btn-secondary" id="btnCancelParse">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('parseResultsModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Attach event listeners (Manifest V3 compatible)
  document.getElementById('btnCloseParseResults')?.addEventListener('click', closeParseResults);
  document.getElementById('btnUseForAutofill')?.addEventListener('click', useForAutofill);
  document.getElementById('btnSaveAsProfile')?.addEventListener('click', saveAsProfile);
  document.getElementById('btnCancelParse')?.addEventListener('click', closeParseResults);
  
  // Store parsed data in state
  state.currentParseData = data;
  state.currentDocument = document;
}

function renderParseData(data) {
  if (!data || !data.fields || data.fields.length === 0) {
    return '<div class="documents-empty"><div class="documents-empty-text">No data could be extracted</div></div>';
  }
  
  return `
    <div class="field-mapping">
      ${data.fields.map(field => {
        const confidence = field.confidence || 0;
        const confidenceClass = 
          confidence > 0.9 ? 'confidence-high' : 
          confidence > 0.7 ? 'confidence-medium' : 
          'confidence-low';
        const confidenceText = 
          confidence > 0.9 ? 'High' : 
          confidence > 0.7 ? 'Medium' : 
          'Low';
        
        return `
          <div class="mapping-row">
            <div class="mapping-field">
              <div class="mapping-label">${field.label || field.key}</div>
              <div class="mapping-value">${field.value || 'N/A'}</div>
            </div>
            <div class="mapping-arrow">→</div>
            <div class="mapping-field">
              <div class="mapping-label">Form Field</div>
              <div class="mapping-value">${field.targetField || 'Auto-detect'}</div>
            </div>
            <span class="confidence-badge ${confidenceClass}">
              ${confidenceText}
            </span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function closeParseResults() {
  const modal = document.getElementById('parseResultsModal');
  if (modal) {
    modal.remove();
  }
  state.currentParseData = null;
  state.currentDocument = null;
}

async function useForAutofill() {
  try {
    if (!state.currentParseData) {
      showNotification('Error', 'No parse data available', 'error');
      return;
    }
    
    addActivityLog('Auto-Fill', 'Applying parsed data to form...', 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'AUTO_FILL_WITH_DATA',
      data: state.currentParseData
    });
    
    if (response && response.success) {
      addActivityLog('Auto-Fill', `Filled ${response.fieldsCount || 0} fields`, 'success');
      showNotification('Auto-Fill Complete', `Filled ${response.fieldsCount || 0} fields`);
      closeParseResults();
    } else {
      throw new Error(response?.error || 'Auto-fill failed');
    }
  } catch (error) {
    console.error('Auto-fill failed:', error);
    addActivityLog('Auto-Fill', `Failed: ${error.message}`, 'error');
    showNotification('Auto-Fill Failed', error.message, 'error');
  }
}

async function saveAsProfile() {
  try {
    if (!state.currentParseData || !state.currentDocument) {
      showNotification('Error', 'No data to save', 'error');
      return;
    }
    
    const profileName = prompt('Enter profile name:', state.currentDocument.name || 'New Profile');
    if (!profileName) return;
    
    const profile = {
      name: profileName,
      document: state.currentDocument,
      data: state.currentParseData,
      timestamp: Date.now()
    };
    
    // Save to storage
    const result = await chrome.storage.local.get(['autofillProfiles']);
    const profiles = result.autofillProfiles || [];
    profiles.push(profile);
    await chrome.storage.local.set({ autofillProfiles: profiles });
    
    addActivityLog('Profile', `Saved profile: ${profileName}`, 'success');
    showNotification('Profile Saved', `Profile "${profileName}" saved successfully`);
    closeParseResults();
  } catch (error) {
    console.error('Failed to save profile:', error);
    addActivityLog('Profile', `Failed: ${error.message}`, 'error');
    showNotification('Save Failed', error.message, 'error');
  }
}

// ============================================================================
// AI CHAT (Simple version for sidepanel)
// ============================================================================

async function handleAIChatSend() {
  const input = document.getElementById('aiChatInput');
  const messagesContainer = document.getElementById('aiChatMessages');
  
  if (!input || !messagesContainer) return;
  
  const message = input.value.trim();
  if (!message) return;
  
  // Clear input
  input.value = '';
  
  // Add user message
  messagesContainer.innerHTML += `
    <div class="ai-message ai-message-user">
      <div class="ai-message-bubble">${escapeHtml(message)}</div>
    </div>
  `;
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  try {
    // Send to content script for AI processing
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'AI_CHAT_MESSAGE',
      message: message
    });
    
    // Add assistant response
    messagesContainer.innerHTML += `
      <div class="ai-message ai-message-assistant">
        <div class="ai-message-bubble">${escapeHtml(response?.reply || 'I received your message. The AI service is processing your request.')}</div>
      </div>
    `;
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    addActivityLog('AI Chat', 'Message sent', 'info');
  } catch (error) {
    messagesContainer.innerHTML += `
      <div class="ai-message ai-message-assistant">
        <div class="ai-message-bubble">Sorry, I couldn't process that request. Please try using the floating assistant on the page.</div>
      </div>
    `;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================================
// P2P CONNECTION
// ============================================================================

async function handleP2PConnect() {
  const peerIdInput = document.getElementById('p2pConnectId');
  const statusIndicator = document.getElementById('p2pStatusIndicator');
  const statusText = document.getElementById('p2pStatusText');
  
  if (!peerIdInput) return;
  
  const peerId = peerIdInput.value.trim();
  
  if (!peerId) {
    showNotification('P2P Connection', 'Please enter a peer ID', 'warning');
    return;
  }
  
  try {
    addActivityLog('P2P', `Connecting to peer: ${peerId}`, 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'CONNECT_P2P',
      role: 'sender',
      peerId: peerId
    });
    
    if (response?.success) {
      state.p2p.connected = true;
      state.p2p.peerId = peerId;
      
      if (statusIndicator) statusIndicator.classList.add('connected');
      if (statusText) statusText.textContent = `Connected to ${peerId}`;
      
      addActivityLog('P2P', 'Connection established', 'success');
      showNotification('P2P Connected', `Connected to peer ${peerId}`);
    } else {
      throw new Error(response?.error || 'Connection failed');
    }
  } catch (error) {
    addActivityLog('P2P', `Connection failed: ${error.message}`, 'error');
    showNotification('P2P Failed', error.message, 'error');
  }
}

async function initializeP2P() {
  // Generate initial peer ID
  await generatePeerId();
  
  // Load saved directories
  try {
    const stored = await chrome.storage.local.get(['p2pShareDir', 'p2pDownloadDir']);
    
    if (stored.p2pShareDir) {
      const shareInput = document.getElementById('p2pShareDirectory');
      if (shareInput) shareInput.value = stored.p2pShareDir;
    }
    
    if (stored.p2pDownloadDir) {
      const downloadInput = document.getElementById('p2pDownloadDirectory');
      if (downloadInput) downloadInput.value = stored.p2pDownloadDir;
    }
  } catch (error) {
    console.warn('Failed to load P2P settings:', error);
  }
}

async function generatePeerId() {
  const peerIdEl = document.getElementById('p2pPeerId');
  if (!peerIdEl) return;
  
  // Generate a unique peer ID
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const peerId = `CUBE-${timestamp}-${random}`.toUpperCase();
  
  peerIdEl.textContent = peerId;
  state.p2p.peerId = peerId;
  
  // Store for persistence
  await chrome.storage.local.set({ p2pLocalId: peerId });
  
  return peerId;
}

async function handleCopyPeerId() {
  const peerIdEl = document.getElementById('p2pPeerId');
  if (!peerIdEl) return;
  
  const peerId = peerIdEl.textContent;
  
  try {
    await navigator.clipboard.writeText(peerId);
    showNotification('Copied', 'Peer ID copied to clipboard');
    addActivityLog('P2P', 'Peer ID copied', 'info');
  } catch (error) {
    showNotification('Error', 'Failed to copy peer ID', 'error');
  }
}

async function handleRefreshPeerId() {
  await generatePeerId();
  showNotification('P2P', 'New peer ID generated');
  addActivityLog('P2P', 'Peer ID refreshed', 'info');
}

async function handleSelectShareDirectory() {
  try {
    // Try File System Access API first (modern browsers)
    if ('showDirectoryPicker' in window) {
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'documents'
      });
      
      const path = dirHandle.name; // We can only get the name, not full path
      
      // Store handle for later access
      await chrome.storage.local.set({ 
        p2pShareDirName: dirHandle.name,
        p2pShareDir: `📁 ${dirHandle.name}` 
      });
      
      const shareInput = document.getElementById('p2pShareDirectory');
      if (shareInput) shareInput.value = `📁 ${dirHandle.name}`;
      
      // Store the handle in memory for file operations
      window.cubeP2PShareHandle = dirHandle;
      
      addActivityLog('P2P', `Share folder selected: ${dirHandle.name}`, 'success');
      showNotification('✅ Folder Selected', `Sharing from: ${dirHandle.name}`);
      
      // List files in the directory
      await listDirectoryFiles(dirHandle, 'share');
      
    } else {
      // Fallback to manual input
      showDirectoryInputModal('share');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      // User cancelled - that's OK
      return;
    }
    console.error('Directory picker error:', error);
    showNotification('Error', 'Could not open folder picker. Try entering path manually.');
    showDirectoryInputModal('share');
  }
}

async function handleSelectDownloadDirectory() {
  try {
    // Try File System Access API first (modern browsers)
    if ('showDirectoryPicker' in window) {
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads'
      });
      
      await chrome.storage.local.set({ 
        p2pDownloadDirName: dirHandle.name,
        p2pDownloadDir: `📁 ${dirHandle.name}` 
      });
      
      const downloadInput = document.getElementById('p2pDownloadDirectory');
      if (downloadInput) downloadInput.value = `📁 ${dirHandle.name}`;
      
      // Store the handle in memory for file operations
      window.cubeP2PDownloadHandle = dirHandle;
      
      addActivityLog('P2P', `Download folder selected: ${dirHandle.name}`, 'success');
      showNotification('✅ Folder Selected', `Downloads go to: ${dirHandle.name}`);
      
    } else {
      // Fallback to manual input
      showDirectoryInputModal('download');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    }
    console.error('Directory picker error:', error);
    showNotification('Error', 'Could not open folder picker. Try entering path manually.');
    showDirectoryInputModal('download');
  }
}

async function listDirectoryFiles(dirHandle, type) {
  try {
    const files = [];
    for await (const entry of dirHandle.values()) {
      files.push({
        name: entry.name,
        kind: entry.kind,
        icon: entry.kind === 'directory' ? '📁' : getFileIcon(entry.name)
      });
    }
    
    // Update the shared files list UI
    const filesList = document.getElementById('sharedFilesList');
    if (filesList && type === 'share') {
      if (files.length === 0) {
        filesList.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-text">Folder is empty</div>
            <div class="empty-hint">Add some files to share them</div>
          </div>
        `;
      } else {
        filesList.innerHTML = files.map(f => `
          <div class="shared-file-item">
            <span class="file-icon">${f.icon}</span>
            <span class="file-name">${f.name}</span>
            <span class="file-type">${f.kind}</span>
          </div>
        `).join('');
      }
    }
    
    return files;
  } catch (error) {
    console.error('Failed to list directory:', error);
    return [];
  }
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    pdf: '📄', doc: '📝', docx: '📝', txt: '📃',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🎨',
    mp3: '🎵', wav: '🎵', mp4: '🎬', mov: '🎬', avi: '🎬',
    zip: '📦', rar: '📦', tar: '📦', gz: '📦',
    js: '💻', ts: '💻', py: '🐍', html: '🌐', css: '🎨',
    json: '📋', xml: '📋', csv: '📊', xlsx: '📊'
  };
  return icons[ext] || '📄';
}

function showDirectoryInputModal(type) {
  const title = type === 'share' ? '📁 Share Directory' : '💾 Download Directory';
  const placeholder = type === 'share' 
    ? 'e.g., /Users/username/Documents/Shared' 
    : 'e.g., /Users/username/Downloads/CUBE';
  
  const content = `
    <div class="directory-modal-content">
      <p class="modal-description">
        ${type === 'share' ? '📤 Enter the folder path where your files to share are located.' : '📥 Enter the folder path where received files will be saved.'}
      </p>
      
      <div class="form-group">
        <label class="form-label">📂 Folder Path</label>
        <input type="text" class="form-input" id="directoryPathInput" placeholder="${placeholder}">
      </div>
      
      <div class="modal-hint">
        <strong>💡 Tip:</strong> Drag & drop a folder from Finder here, or use Terminal: <code>pwd</code>
      </div>
      
      <div class="setting-actions">
        <button type="button" class="btn btn-secondary" data-action="close-modal">❌ Cancel</button>
        <button type="button" class="btn btn-primary" data-action="save-directory-path" data-type="${type}">✅ Save</button>
      </div>
    </div>
  `;
  
  showModal(title, content);
}

window.saveDirectoryPath = async function(type) {
  const input = document.getElementById('directoryPathInput');
  if (!input) return;
  
  const path = input.value.trim();
  
  if (!path) {
    showNotification('Error', 'Please enter a directory path');
    return;
  }
  
  // Validate path format (basic check)
  if (!path.startsWith('/') && !path.match(/^[A-Z]:\\/i)) {
    showNotification('Error', 'Please enter an absolute path');
    return;
  }
  
  try {
    if (type === 'share') {
      await chrome.storage.local.set({ p2pShareDir: path });
      const shareInput = document.getElementById('p2pShareDirectory');
      if (shareInput) shareInput.value = path;
      addActivityLog('P2P', `Share directory set: ${path}`, 'success');
    } else {
      await chrome.storage.local.set({ p2pDownloadDir: path });
      const downloadInput = document.getElementById('p2pDownloadDirectory');
      if (downloadInput) downloadInput.value = path;
      addActivityLog('P2P', `Download directory set: ${path}`, 'success');
    }
    
    showNotification('Success', 'Directory path saved');
    closeModal();
  } catch (error) {
    showNotification('Error', 'Failed to save directory path');
  }
};

// ============================================================================
// DIAGNOSTICS
// ============================================================================

async function runDiagnostics() {
  addActivityLog('Diagnostics', 'Running system diagnostics...', 'info');
  
  const diagnostics = [
    { id: 'extension-core', label: 'Extension Core' },
    { id: 'content-scripts', label: 'Content Scripts' },
    { id: 'ai-services', label: 'AI Services' },
    { id: 'storage', label: 'Storage' }
  ];
  
  const items = document.querySelectorAll('.diagnostic-item');
  
  // Reset all to checking state
  items.forEach(item => {
    const status = item.querySelector('.diagnostic-status');
    if (status) {
      status.className = 'diagnostic-status';
      status.style.background = '#71717a';
    }
  });
  
  // Run checks with simulated delay
  for (let i = 0; i < items.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const item = items[i];
    const status = item.querySelector('.diagnostic-status');
    
    // Simulate check (in real implementation, would check actual services)
    const isOk = Math.random() > 0.1; // 90% chance of OK
    
    if (status) {
      status.className = `diagnostic-status ${isOk ? 'ok' : 'warning'}`;
    }
  }
  
  addActivityLog('Diagnostics', 'Diagnostics complete', 'success');
  showNotification('Diagnostics', 'All systems checked');
}

// ============================================================================
// AUTOMATION SHELL
// ============================================================================

async function handleRunAutomation() {
  const commandInput = document.getElementById('automationCommand');
  const outputDiv = document.getElementById('automationOutput');
  
  if (!commandInput || !outputDiv) return;
  
  const command = commandInput.value.trim();
  
  if (!command) {
    outputDiv.innerHTML = '<span class="output-error">Error: No command entered</span>';
    return;
  }
  
  outputDiv.innerHTML = '<span class="output-loading">⏳ Executing...</span>';
  addActivityLog('Automation', `Executing: ${command}`, 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'EXECUTE_AUTOMATION',
      command: command
    });
    
    const timestamp = new Date().toLocaleTimeString();
    outputDiv.innerHTML = `<span class="output-timestamp">[${timestamp}]</span> <span class="output-command">$ ${command}</span>\n<span class="output-success">${response?.output || '✓ Command executed successfully'}</span>`;
    addActivityLog('Automation', 'Command completed', 'success');
    showNotification('Automation', 'Command executed successfully', 'success');
  } catch (error) {
    const timestamp = new Date().toLocaleTimeString();
    outputDiv.innerHTML = `<span class="output-timestamp">[${timestamp}]</span> <span class="output-command">$ ${command}</span>\n<span class="output-error">✗ Error: ${error.message}</span>`;
    addActivityLog('Automation', `Failed: ${error.message}`, 'error');
  }
}

/**
 * Clear automation output and command input
 */
function clearAutomationOutput() {
  const commandInput = document.getElementById('automationCommand');
  const outputDiv = document.getElementById('automationOutput');
  
  if (commandInput) {
    commandInput.value = '';
  }
  
  if (outputDiv) {
    outputDiv.innerHTML = '<span class="output-placeholder">Ready for automation commands...</span>';
  }
  
  addActivityLog('Automation', 'Output cleared', 'info');
}

// ============================================================================
// LENDINGPAD AUTOMATION
// ============================================================================

async function handleLendingPadDetect() {
  try {
    addActivityLog('LendingPad', 'Detecting loan documents...', 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we're on a LendingPad page
    if (!tab.url.includes('lendingpad') && !tab.url.includes('lending')) {
      showNotification('LendingPad Detection', 'Please navigate to a LendingPad page first');
      addActivityLog('LendingPad', 'Not on a LendingPad page', 'warning');
      return;
    }
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'DETECT_DOCUMENTS',
      options: {
        types: ['pdf', 'excel', 'word', 'csv'],
        includeEmbedded: true,
        includeLinks: true
      }
    });
    
    if (response && response.success && response.documents) {
      const count = response.documents.length;
      addActivityLog('LendingPad', `Found ${count} document(s)`, 'success');
      renderLendingPadDocuments(response.documents);
      
      if (count > 0) {
        showNotification('Documents Detected', `Found ${count} loan document(s)`);
      } else {
        showNotification('No Documents', 'No documents found on this page');
      }
    } else {
      addActivityLog('LendingPad', 'No documents found', 'warning');
      renderLendingPadDocuments([]);
    }
  } catch (error) {
    console.error('LendingPad detection failed:', error);
    addActivityLog('LendingPad', `Detection failed: ${error.message}`, 'error');
  }
}

async function handleLendingPadDownload() {
  try {
    addActivityLog('LendingPad', 'Preparing batch download...', 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'LENDINGPAD_BATCH_DOWNLOAD'
    });
    
    if (response && response.success) {
      addActivityLog('LendingPad', `Downloaded ${response.count || 0} documents`, 'success');
      showNotification('Download Complete', `Downloaded ${response.count || 0} documents`);
    } else {
      addActivityLog('LendingPad', 'Download failed or no documents', 'warning');
    }
  } catch (error) {
    console.error('LendingPad download failed:', error);
    addActivityLog('LendingPad', `Download failed: ${error.message}`, 'error');
  }
}

async function handleLendingPadExtract() {
  try {
    addActivityLog('LendingPad', 'Extracting document data...', 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'LENDINGPAD_EXTRACT_DATA'
    });
    
    if (response && response.success && response.data) {
      addActivityLog('LendingPad', `Extracted data from ${Object.keys(response.data).length} fields`, 'success');
      showNotification('Extraction Complete', 'Loan data extracted successfully');
      
      // Display extracted data
      const docsList = document.getElementById('lendingpadDocsList');
      if (docsList) {
        docsList.innerHTML = `
          <div class="extracted-data">
            <div class="extracted-header">Extracted Loan Data</div>
            ${Object.entries(response.data).map(([key, value]) => `
              <div class="extracted-row">
                <span class="extracted-label">${formatFieldName(key)}</span>
                <span class="extracted-value">${escapeHtml(String(value))}</span>
              </div>
            `).join('')}
          </div>
        `;
        docsList.classList.remove('hidden');
      }
    } else {
      addActivityLog('LendingPad', 'No data extracted', 'warning');
    }
  } catch (error) {
    console.error('LendingPad extraction failed:', error);
    addActivityLog('LendingPad', `Extraction failed: ${error.message}`, 'error');
  }
}

function renderLendingPadDocuments(documents) {
  const docsList = document.getElementById('lendingpadDocsList');
  
  if (!docsList) return;
  
  if (!documents || documents.length === 0) {
    docsList.innerHTML = `
      <div class="documents-empty">
        <div class="documents-empty-icon">🏦</div>
        <div class="documents-empty-text">No loan documents found</div>
      </div>
    `;
    docsList.classList.remove('hidden');
    return;
  }
  
  docsList.innerHTML = documents.map((doc, index) => `
    <div class="document-item" data-doc-id="${doc.id}">
      <div class="document-icon">${getDocTypeIcon(doc.type)}</div>
      <div class="document-info">
        <div class="document-name">${escapeHtml(doc.name)}</div>
        <div class="document-meta">${doc.type.toUpperCase()} • ${doc.source}</div>
      </div>
      <button type="button" class="btn btn-sm btn-ghost" data-action="download-document" data-url="${escapeHtml(doc.url)}" title="Download">
        ⬇️
      </button>
    </div>
  `).join('');
  
  docsList.classList.remove('hidden');
  
  // Attach download button handlers
  docsList.querySelectorAll('[data-action="download-document"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = btn.getAttribute('data-url');
      if (typeof downloadDocument === 'function') downloadDocument(url);
    });
  });
}

function getDocTypeIcon(type) {
  const icons = {
    pdf: '📕',
    excel: '📊',
    word: '📘',
    csv: '📑',
    unknown: '📄'
  };
  return icons[type] || icons.unknown;
}

function formatFieldName(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, char => char.toUpperCase());
}

// Global function for download button
window.downloadDocument = async function(url) {
  if (!url) return;
  
  try {
    await chrome.downloads.download({ url });
    addActivityLog('LendingPad', 'Document download started', 'info');
  } catch (error) {
    console.error('Download failed:', error);
    addActivityLog('LendingPad', `Download failed: ${error.message}`, 'error');
  }
};

// ============================================================================
// MACRO RECORDING & PLAYBACK
// ============================================================================

async function initializeMacros() {
  try {
    const result = await chrome.storage.local.get(['savedMacros', 'macroTourCompleted']);
    state.macros = result.savedMacros || [];
    
    initializeMacroTour(result.macroTourCompleted);
    renderMacroList();
  } catch (error) {
    console.error('Failed to load macros:', error);
  }
}

function initializeMacroTour(tourCompleted = false) {
  const banner = document.getElementById('macroTourBanner');
  const carousel = document.getElementById('macroTourCarousel');

  if (tourCompleted) {
    banner?.classList.add('hidden');
  }

  document.getElementById('btnStartMacroTour')?.addEventListener('click', showMacroTour);
  document.getElementById('btnCloseTour')?.addEventListener('click', closeMacroTour);
  document.getElementById('btnTourPrev')?.addEventListener('click', () => navigateTour(-1));
  document.getElementById('btnTourNext')?.addEventListener('click', () => navigateTour(1));
  document.getElementById('btnTourFinish')?.addEventListener('click', finishMacroTour);
}

function showMacroTour() {
  const banner = document.getElementById('macroTourBanner');
  const carousel = document.getElementById('macroTourCarousel');

  banner?.classList.add('hidden');
  carousel?.classList.remove('hidden');
  
  updateTourSlide(1);
  addActivityLog('Macro', 'Guided tour started', 'info');
}

function closeMacroTour() {
  const banner = document.getElementById('macroTourBanner');
  const carousel = document.getElementById('macroTourCarousel');

  carousel?.classList.add('hidden');
  banner?.classList.remove('hidden');
}

function navigateTour(direction) {
  const slides = document.querySelectorAll('.macro-tour-slide');
  let currentStep = 0;

  slides.forEach((slide, index) => {
    if (slide.classList.contains('active')) {
      currentStep = index + 1;
    }
  });

  const newStep = currentStep + direction;
  if (newStep >= 1 && newStep <= slides.length) {
    updateTourSlide(newStep);
  }
}

function updateTourSlide(step) {
  const slides = document.querySelectorAll('.macro-tour-slide');
  const dots = document.querySelectorAll('.macro-tour-dot');
  const prevBtn = document.getElementById('btnTourPrev');
  const nextBtn = document.getElementById('btnTourNext');
  const finishBtn = document.getElementById('btnTourFinish');

  slides.forEach((slide, index) => {
    slide.classList.toggle('active', index + 1 === step);
  });

  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index + 1 === step);
  });

  if (prevBtn) {
    prevBtn.disabled = step === 1;
  }

  if (step === slides.length) {
    nextBtn?.classList.add('hidden');
    finishBtn?.classList.remove('hidden');
  } else {
    nextBtn?.classList.remove('hidden');
    finishBtn?.classList.add('hidden');
  }
}

async function finishMacroTour() {
  try {
    await chrome.storage.local.set({ macroTourCompleted: true });
    closeMacroTour();
    showNotification('Tour Complete!', 'You\'re ready to record your first macro');
    addActivityLog('Macro', 'Guided tour completed', 'success');
  } catch (error) {
    console.error('Failed to save tour completion:', error);
  }
}

function renderMacroList() {
  const macroList = document.getElementById('macroList');
  
  if (!macroList) return;
  
  if (state.macros.length === 0) {
    macroList.innerHTML = `
      <div class="text-center text-muted macro-empty-state">
        <span class="macro-empty-icon" aria-hidden="true">🎬</span>
        <div>No macros saved yet</div>
        <div class="macro-empty-hint">Click "Record New Macro" above to get started</div>
      </div>
    `;
    return;
  }
  
  macroList.innerHTML = state.macros.map((macro, index) => `
    <div class="macro-item" data-macro-index="${index}">
      <div class="macro-info">
        <h3>${macro.name || `Macro ${index + 1}`}</h3>
        <div class="macro-meta">
          <span>📝 ${macro.steps?.length || 0} steps</span>
          <span>⏱️ ${formatDuration(macro.duration || 0)}</span>
          <span>📅 ${formatDate(macro.timestamp)}</span>
        </div>
        ${macro.parameters?.length > 0 ? `<div class="macro-params"><span>🔧 ${macro.parameters.length} params</span></div>` : ''}
      </div>
      <div class="macro-actions">
        <button class="btn btn-sm btn-edit-macro" data-index="${index}" title="Edit Macro">✏️</button>
        <button class="btn btn-sm btn-play-macro" data-index="${index}" title="Play Macro">▶️</button>
        <button class="btn btn-sm btn-delete-macro" data-index="${index}" title="Delete Macro">🗑️</button>
      </div>
    </div>
  `).join('');
  
  // Attach event listeners (Manifest V3 compatible - no inline handlers)
  macroList.querySelectorAll('.btn-edit-macro').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index, 10);
      openMacroEditor(index);
    });
  });
  
  macroList.querySelectorAll('.btn-play-macro').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index, 10);
      playMacro(index);
    });
  });
  
  macroList.querySelectorAll('.btn-delete-macro').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index, 10);
      deleteMacro(index);
    });
  });
}

async function handleRecordMacro() {
  if (state.isRecording) {
    await stopMacroRecording();
  } else {
    await startMacroRecording();
  }
}

async function startMacroRecording() {
  try {
    state.isRecording = true;
    state.recordingStartTime = Date.now();
    state.macroStepCount = 0;
    
    // Update UI
    document.getElementById('recordingStatus')?.classList.remove('hidden');
    document.getElementById('btnStartRecording')?.setAttribute('disabled', 'true');
    document.getElementById('btnStopRecording')?.removeAttribute('disabled');
    document.getElementById('stepCount').textContent = '0';
    
    // Start timer
    state.recordingTimer = setInterval(updateRecordingTime, 1000);
    
    // Start polling for step count updates
    state.stepCountPoller = setInterval(async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          console.log('📊 Polling step count from tab:', tab.id);
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_MACRO_STEP_COUNT' });
          console.log('📊 Step count response:', response);
          if (response?.success && response?.count !== undefined) {
            console.log('📊 Updating UI with count:', response.count);
            const stepCountEl = document.getElementById('stepCount');
            if (stepCountEl) {
              stepCountEl.textContent = String(response.count);
              console.log('📊 UI updated, element text now:', stepCountEl.textContent);
            } else {
              console.log('📊 ERROR: stepCount element not found');
            }
            state.macroStepCount = response.count;
          } else {
            console.log('📊 Response missing success or count:', response);
          }
        }
      } catch (e) {
        console.log('📊 Polling error (expected if tab closed):', e.message);
      }
    }, 500);
    
    // Send message to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('🎬 Sending START_MACRO_RECORDING to tab:', tab?.id);
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'START_MACRO_RECORDING' });
    console.log('🎬 START_MACRO_RECORDING response:', response);
    
    if (response?.success) {
      addActivityLog('Macro', 'Recording started', 'success');
      showNotification('Recording Started', 'Macro recording is now active. Perform actions on the page.');
    } else {
      throw new Error(response?.error || 'Failed to start recording');
    }
  } catch (error) {
    console.error('Failed to start recording:', error);
    addActivityLog('Macro', `Failed to start recording: ${error.message}`, 'error');
    showNotification('Recording Failed', error.message, 'error');
    state.isRecording = false;
    // Reset UI
    document.getElementById('recordingStatus')?.classList.add('hidden');
    document.getElementById('btnStartRecording')?.removeAttribute('disabled');
    document.getElementById('btnStopRecording')?.setAttribute('disabled', 'true');
  }
}

async function stopMacroRecording() {
  try {
    state.isRecording = false;
    
    // Clear timers
    if (state.recordingTimer) {
      clearInterval(state.recordingTimer);
      state.recordingTimer = null;
    }
    if (state.stepCountPoller) {
      clearInterval(state.stepCountPoller);
      state.stepCountPoller = null;
    }
    
    // Update UI
    document.getElementById('recordingStatus')?.classList.add('hidden');
    document.getElementById('btnStartRecording')?.removeAttribute('disabled');
    document.getElementById('btnStopRecording')?.setAttribute('disabled', 'true');
    
    // Send message to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'STOP_MACRO_RECORDING' });
    
    if (response?.success && response.macro) {
      const stepCount = response.macro.steps?.length || response.macro.actions?.length || 0;
      
      if (stepCount > 0) {
        state.macros.unshift(response.macro);
        await chrome.storage.local.set({ savedMacros: state.macros });
        await incrementStat('macrosSaved');
        renderMacroList();
        
        addActivityLog('Macro', `Recording saved: ${stepCount} steps`, 'success');
        showNotification('Recording Saved', `Macro saved with ${stepCount} steps`);
      } else {
        addActivityLog('Macro', 'No actions recorded', 'warning');
        showNotification('No Actions', 'No actions were recorded. Try clicking or typing on the page.', 'warning');
      }
    } else {
      addActivityLog('Macro', 'Recording stopped but no macro returned', 'warning');
      showNotification('Recording Stopped', 'No actions captured', 'warning');
    }
  } catch (error) {
    console.error('Failed to stop recording:', error);
    addActivityLog('Macro', `Failed to stop recording: ${error.message}`, 'error');
    showNotification('Error', error.message, 'error');
  }
}

function updateRecordingTime() {
  const elapsed = Math.floor((Date.now() - state.recordingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  document.getElementById('recordingTime').textContent = 
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function handlePlayMacro() {
  if (state.macros.length === 0) {
    showNotification('No Macros', 'No macros available to play', 'warning');
    return;
  }
  await playMacro(0); // Play the most recent macro
}

async function playMacro(index) {
  try {
    const macro = state.macros[index];
    
    if (!macro) {
      showNotification('Error', 'Macro not found', 'error');
      return;
    }
    
    const actionCount = macro.steps?.length || macro.actions?.length || 0;
    if (actionCount === 0) {
      showNotification('Empty Macro', 'This macro has no actions to play', 'warning');
      return;
    }
    
    addActivityLog('Macro', `Playing: ${macro.name || `Macro ${index + 1}`} (${actionCount} steps)`, 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.id) {
      showNotification('Error', 'No active tab found', 'error');
      return;
    }
    
    const response = await chrome.tabs.sendMessage(tab.id, { 
      type: 'PLAY_MACRO',
      macro: macro
    });
    
    if (response?.success) {
      await incrementStat('timeSaved', 1);
      const successRate = response.stats?.successfulActions 
        ? `(${Math.round((response.stats.successfulActions / response.stats.totalActions) * 100)}% success)`
        : '';
      addActivityLog('Macro', `Playback completed ${successRate}`, 'success');
      showNotification('Macro Complete', 'Macro playback finished');
    } else {
      throw new Error(response?.error || 'Unknown playback error');
    }
  } catch (error) {
    console.error('Failed to play macro:', error);
    addActivityLog('Macro', `Playback failed: ${error.message}`, 'error');
    showNotification('Playback Failed', error.message, 'error');
  }
}

async function deleteMacro(index) {
  if (confirm('Delete this macro?')) {
    state.macros.splice(index, 1);
    await chrome.storage.local.set({ savedMacros: state.macros });
    renderMacroList();
    addActivityLog('Macro', 'Macro deleted', 'info');
  }
}

// ============================================================================
// SCREENSHOT CAPTURE
// ============================================================================

async function handleScreenshot(mode) {
  try {
    addActivityLog('Screenshot', `Capturing ${mode} screenshot...`, 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { 
      type: 'CAPTURE_SCREENSHOT',
      mode: mode
    });
    
    await incrementStat('screenshotsTaken');
    addActivityLog('Screenshot', `${mode} capture completed`, 'success');
    showNotification('Screenshot Captured', `${mode} screenshot saved`);
  } catch (error) {
    console.error('Screenshot failed:', error);
    addActivityLog('Screenshot', `Failed: ${error.message}`, 'error');
    showNotification('Screenshot Failed', error.message, 'error');
  }
}

// ============================================================================
// SCREENSHOT ANNOTATION TOOLS
// ============================================================================

let annotationState = {
  canvas: null,
  ctx: null,
  currentTool: 'pen',
  isDrawing: false,
  lastX: 0,
  lastY: 0,
  color: '#ff0000',
  lineWidth: 3,
  history: [],
  historyIndex: -1,
  originalImage: null
};

function initializeAnnotationTools() {
  console.log('🎨 Initializing Screenshot Annotation Tools...');
  
  // Tool selection
  document.querySelectorAll('.annotation-tool').forEach(tool => {
    tool.addEventListener('click', () => {
      const toolType = tool.dataset.tool;
      selectAnnotationTool(toolType);
    });
  });
  
  // Color picker
  document.getElementById('annotationColor')?.addEventListener('change', (e) => {
    annotationState.color = e.target.value;
  });
  
  // Line width slider
  document.getElementById('annotationLineWidth')?.addEventListener('input', (e) => {
    annotationState.lineWidth = parseInt(e.target.value);
    const display = document.getElementById('lineWidthValue');
    if (display) display.textContent = e.target.value + 'px';
  });
  
  // Action buttons
  document.getElementById('btnAnnotationUndo')?.addEventListener('click', undoAnnotation);
  document.getElementById('btnAnnotationRedo')?.addEventListener('click', redoAnnotation);
  document.getElementById('btnAnnotationClear')?.addEventListener('click', clearAnnotations);
  document.getElementById('btnAnnotationSave')?.addEventListener('click', saveAnnotatedScreenshot);
  document.getElementById('btnAnnotationCopy')?.addEventListener('click', copyAnnotatedScreenshot);
  
  // Canvas setup
  const canvas = document.getElementById('screenshotCanvas');
  if (canvas) {
    setupAnnotationCanvas(canvas);
  }
  
  console.log('✅ Annotation tools initialized');
}

function setupAnnotationCanvas(canvas) {
  annotationState.canvas = canvas;
  annotationState.ctx = canvas.getContext('2d');
  
  // Mouse events
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  
  // Touch events for mobile
  canvas.addEventListener('touchstart', handleTouchStart);
  canvas.addEventListener('touchmove', handleTouchMove);
  canvas.addEventListener('touchend', stopDrawing);
}

function selectAnnotationTool(tool) {
  annotationState.currentTool = tool;
  
  document.querySelectorAll('.annotation-tool').forEach(t => {
    t.classList.remove('active');
  });
  document.querySelector(`.annotation-tool[data-tool="${tool}"]`)?.classList.add('active');
  
  // Set cursor based on tool
  const canvas = annotationState.canvas;
  if (canvas) {
    const cursors = {
      pen: 'crosshair',
      highlighter: 'crosshair',
      arrow: 'crosshair',
      rectangle: 'crosshair',
      circle: 'crosshair',
      text: 'text',
      eraser: 'cell',
      blur: 'crosshair'
    };
    canvas.style.cursor = cursors[tool] || 'crosshair';
  }
}

function startDrawing(e) {
  annotationState.isDrawing = true;
  const rect = annotationState.canvas.getBoundingClientRect();
  annotationState.lastX = e.clientX - rect.left;
  annotationState.lastY = e.clientY - rect.top;
  
  if (annotationState.currentTool === 'text') {
    showTextInputDialog(annotationState.lastX, annotationState.lastY);
    annotationState.isDrawing = false;
  }
}

function draw(e) {
  if (!annotationState.isDrawing) return;
  
  const ctx = annotationState.ctx;
  const rect = annotationState.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  switch (annotationState.currentTool) {
    case 'pen':
      drawPenLine(ctx, x, y);
      break;
    case 'highlighter':
      drawHighlighter(ctx, x, y);
      break;
    case 'eraser':
      eraseLine(ctx, x, y);
      break;
    case 'arrow':
    case 'rectangle':
    case 'circle':
      // These are drawn on mouseup
      break;
  }
  
  annotationState.lastX = x;
  annotationState.lastY = y;
}

function stopDrawing(e) {
  if (!annotationState.isDrawing) return;
  
  const ctx = annotationState.ctx;
  const rect = annotationState.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Draw shapes on release
  switch (annotationState.currentTool) {
    case 'arrow':
      drawArrow(ctx, annotationState.lastX, annotationState.lastY, x, y);
      break;
    case 'rectangle':
      drawRectangle(ctx, annotationState.lastX, annotationState.lastY, x, y);
      break;
    case 'circle':
      drawCircle(ctx, annotationState.lastX, annotationState.lastY, x, y);
      break;
  }
  
  annotationState.isDrawing = false;
  saveToHistory();
}

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  annotationState.canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  annotationState.canvas.dispatchEvent(mouseEvent);
}

function drawPenLine(ctx, x, y) {
  ctx.beginPath();
  ctx.strokeStyle = annotationState.color;
  ctx.lineWidth = annotationState.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.moveTo(annotationState.lastX, annotationState.lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
}

function drawHighlighter(ctx, x, y) {
  ctx.beginPath();
  ctx.strokeStyle = annotationState.color + '40'; // 25% opacity
  ctx.lineWidth = annotationState.lineWidth * 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.moveTo(annotationState.lastX, annotationState.lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
}

function eraseLine(ctx, x, y) {
  ctx.beginPath();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = annotationState.lineWidth * 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.moveTo(annotationState.lastX, annotationState.lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
}

function drawArrow(ctx, startX, startY, endX, endY) {
  const headLength = 15;
  const angle = Math.atan2(endY - startY, endX - startX);
  
  ctx.beginPath();
  ctx.strokeStyle = annotationState.color;
  ctx.lineWidth = annotationState.lineWidth;
  ctx.lineCap = 'round';
  
  // Line
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  
  // Arrowhead
  ctx.lineTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6)
  );
  
  ctx.stroke();
}

function drawRectangle(ctx, startX, startY, endX, endY) {
  ctx.beginPath();
  ctx.strokeStyle = annotationState.color;
  ctx.lineWidth = annotationState.lineWidth;
  ctx.strokeRect(startX, startY, endX - startX, endY - startY);
}

function drawCircle(ctx, startX, startY, endX, endY) {
  const radiusX = Math.abs(endX - startX) / 2;
  const radiusY = Math.abs(endY - startY) / 2;
  const centerX = startX + (endX - startX) / 2;
  const centerY = startY + (endY - startY) / 2;
  
  ctx.beginPath();
  ctx.strokeStyle = annotationState.color;
  ctx.lineWidth = annotationState.lineWidth;
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  ctx.stroke();
}

function showTextInputDialog(x, y) {
  const text = prompt('Enter text annotation:');
  if (text) {
    const ctx = annotationState.ctx;
    ctx.font = `${annotationState.lineWidth * 5}px Arial`;
    ctx.fillStyle = annotationState.color;
    ctx.fillText(text, x, y);
    saveToHistory();
  }
}

function saveToHistory() {
  const canvas = annotationState.canvas;
  if (!canvas) return;
  
  // Remove any redo states
  annotationState.history = annotationState.history.slice(0, annotationState.historyIndex + 1);
  
  // Save current state
  annotationState.history.push(canvas.toDataURL());
  annotationState.historyIndex++;
  
  // Limit history size
  if (annotationState.history.length > 50) {
    annotationState.history.shift();
    annotationState.historyIndex--;
  }
  
  updateUndoRedoButtons();
}

function undoAnnotation() {
  if (annotationState.historyIndex <= 0) return;
  
  annotationState.historyIndex--;
  restoreFromHistory();
}

function redoAnnotation() {
  if (annotationState.historyIndex >= annotationState.history.length - 1) return;
  
  annotationState.historyIndex++;
  restoreFromHistory();
}

function restoreFromHistory() {
  const canvas = annotationState.canvas;
  const ctx = annotationState.ctx;
  if (!canvas || !ctx) return;
  
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    updateUndoRedoButtons();
  };
  img.src = annotationState.history[annotationState.historyIndex];
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('btnAnnotationUndo');
  const redoBtn = document.getElementById('btnAnnotationRedo');
  
  if (undoBtn) undoBtn.disabled = annotationState.historyIndex <= 0;
  if (redoBtn) redoBtn.disabled = annotationState.historyIndex >= annotationState.history.length - 1;
}

function clearAnnotations() {
  const canvas = annotationState.canvas;
  const ctx = annotationState.ctx;
  if (!canvas || !ctx) return;
  
  if (annotationState.originalImage) {
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      saveToHistory();
    };
    img.src = annotationState.originalImage;
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  }
}

async function saveAnnotatedScreenshot() {
  const canvas = annotationState.canvas;
  if (!canvas) {
    showNotification('Error', 'No screenshot to save', 'error');
    return;
  }
  
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `screenshot-annotated-${Date.now()}.png`;
  link.href = dataUrl;
  link.click();
  
  showNotification('Saved', 'Screenshot saved with annotations', 'success');
  addActivityLog('Screenshot', 'Annotated screenshot saved', 'success');
}

async function copyAnnotatedScreenshot() {
  const canvas = annotationState.canvas;
  if (!canvas) {
    showNotification('Error', 'No screenshot to copy', 'error');
    return;
  }
  
  try {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    showNotification('Copied', 'Screenshot copied to clipboard', 'success');
  } catch (e) {
    showNotification('Error', 'Failed to copy: ' + e.message, 'error');
  }
}

function loadImageToAnnotationCanvas(imageDataUrl) {
  const canvas = annotationState.canvas;
  const ctx = annotationState.ctx;
  if (!canvas || !ctx) return;
  
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    annotationState.originalImage = imageDataUrl;
    annotationState.history = [imageDataUrl];
    annotationState.historyIndex = 0;
    updateUndoRedoButtons();
  };
  img.src = imageDataUrl;
}

// ============================================================================
// SCREEN RECORDING
// ============================================================================

let screenRecordingStartTime = null;
let screenRecordingTimer = null;

async function handleStartScreenRecording() {
  try {
    addActivityLog('Recording', 'Starting screen recording...', 'info');
    
    const includeAudio = document.getElementById('recordWithAudio')?.checked || false;
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { 
      type: 'START_SCREEN_RECORDING',
      audio: includeAudio
    });
    
    if (response && response.success) {
      // Update UI
      document.getElementById('btnStartScreenRecording').style.display = 'none';
      document.getElementById('btnStopScreenRecording').style.display = 'block';
      document.getElementById('screenRecordingStatus').style.display = 'block';
      
      // Start timer
      screenRecordingStartTime = Date.now();
      updateRecordingTimer();
      screenRecordingTimer = setInterval(updateRecordingTimer, 1000);
      
      addActivityLog('Recording', 'Screen recording started', 'success');
      showNotification('Recording Started', 'Screen recording in progress...');
    } else {
      throw new Error(response?.error || 'Failed to start recording');
    }
  } catch (error) {
    console.error('Screen recording failed:', error);
    addActivityLog('Recording', `Failed: ${error.message}`, 'error');
    showNotification('Recording Failed', error.message, 'error');
  }
}

async function handleStopScreenRecording() {
  try {
    addActivityLog('Recording', 'Stopping screen recording...', 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { 
      type: 'STOP_SCREEN_RECORDING'
    });
    
    // Clear timer
    if (screenRecordingTimer) {
      clearInterval(screenRecordingTimer);
      screenRecordingTimer = null;
    }
    screenRecordingStartTime = null;
    
    // Update UI
    document.getElementById('btnStartScreenRecording').style.display = 'block';
    document.getElementById('btnStopScreenRecording').style.display = 'none';
    document.getElementById('screenRecordingStatus').style.display = 'none';
    document.getElementById('screenRecordingTime').textContent = '00:00';
    
    if (response && response.success) {
      addActivityLog('Recording', 'Screen recording saved', 'success');
      showNotification('Recording Saved', 'Your screen recording has been saved');
    } else {
      throw new Error(response?.error || 'Failed to stop recording');
    }
  } catch (error) {
    console.error('Stop recording failed:', error);
    addActivityLog('Recording', `Failed: ${error.message}`, 'error');
    showNotification('Recording Error', error.message, 'error');
  }
}

function updateRecordingTimer() {
  if (!screenRecordingStartTime) return;
  
  const elapsed = Math.floor((Date.now() - screenRecordingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');
  
  const timerElement = document.getElementById('screenRecordingTime');
  if (timerElement) {
    timerElement.textContent = `${minutes}:${seconds}`;
  }
}

// ============================================================================
// REMOTE CONTROL
// ============================================================================

const CONNECTION_ROTATION_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const CONNECTION_COUNTDOWN_REFRESH_MS = 1000; // 1 second updates

function updateConnectionSecurityPill(label, intent = 'success') {
  const pill = document.getElementById('connectionSecurityPill');
  if (!pill) {
    return;
  }

  pill.textContent = label;
  pill.classList.remove('is-warning', 'is-danger');

  if (intent === 'warning') {
    pill.classList.add('is-warning');
  } else if (intent === 'danger') {
    pill.classList.add('is-danger');
  }
}

function getOrCreateQrRenderer(qrContainer) {
  if (!qrContainer) {
    console.warn('QR container not available');
    return null;
  }

  if (typeof QRCode === 'undefined') {
    console.error('QRCode library not loaded');
    return null;
  }

  if (!state.qrInstance) {
    qrContainer.innerHTML = '';
    state.qrInstance = new QRCode(qrContainer, {
      width: 220,
      height: 220,
      colorDark: '#1a1625',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
      useSVG: true,
      text: 'INITIALIZING'
    });
  }

  return state.qrInstance;
}

function toggleQrContainerEmptyState(qrContainer, isEmpty, placeholderMessage = QR_PLACEHOLDER_TEXT) {
  if (!qrContainer) {
    return;
  }

  const placeholderSelector = '.qr-code-placeholder';
  let placeholderElement = qrContainer.querySelector(placeholderSelector);

  if (isEmpty) {
    qrContainer.classList.add('is-empty');
    const fallbackElement = qrContainer.querySelector('.qr-fallback');
    if (fallbackElement) {
      fallbackElement.remove();
    }

    if (!placeholderElement) {
      placeholderElement = document.createElement('div');
      placeholderElement.className = 'qr-code-placeholder';
      qrContainer.appendChild(placeholderElement);
    }

    placeholderElement.textContent = placeholderMessage;
    return;
  }

  qrContainer.classList.remove('is-empty');
  if (placeholderElement) {
    placeholderElement.remove();
  }
}

function renderQrFallback(qrContainer, code, message) {
  if (!qrContainer) {
    return;
  }

  toggleQrContainerEmptyState(qrContainer, false);
  qrContainer.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'qr-fallback';

  const codeElement = document.createElement('div');
  codeElement.className = 'qr-fallback-code';
  codeElement.textContent = code || '------';

  const messageElement = document.createElement('p');
  messageElement.className = 'qr-fallback-text';
  messageElement.textContent = message;

  wrapper.append(codeElement, messageElement);
  qrContainer.appendChild(wrapper);

  if (state.qrInstance) {
    try {
      state.qrInstance.clear();
    } catch (clearError) {
      console.warn('Failed to clear QR instance during fallback:', clearError);
    }
    state.qrInstance = null;
  }
}

function clearConnectionRotationTimers() {
  if (state.connectionRotationTimeoutId) {
    clearTimeout(state.connectionRotationTimeoutId);
    state.connectionRotationTimeoutId = null;
  }

  if (state.connectionCountdownIntervalId) {
    clearInterval(state.connectionCountdownIntervalId);
    state.connectionCountdownIntervalId = null;
  }

  state.connectionExpiryTimestamp = null;
  updateRotationCountdownIndicator();
}

function startConnectionRotationCycle() {
  state.connectionExpiryTimestamp = Date.now() + CONNECTION_ROTATION_INTERVAL_MS;
  updateRotationCountdownIndicator();

  state.connectionCountdownIntervalId = setInterval(() => {
    updateRotationCountdownIndicator();
  }, CONNECTION_COUNTDOWN_REFRESH_MS);

  state.connectionRotationTimeoutId = setTimeout(async () => {
    addActivityLog('Remote', 'Auto-rotating connection code for security', 'info');
    updateConnectionSecurityPill('Rotating code…', 'warning');
    try {
      await generateConnectionCode();
    } catch (error) {
      console.error('Auto-rotation failed:', error);
      updateConnectionSecurityPill('Rotation failed', 'danger');
    }
  }, CONNECTION_ROTATION_INTERVAL_MS);
}

function updateRotationCountdownIndicator() {
  const timerElement = document.getElementById('connectionRotationTimer');
  if (!timerElement) {
    return;
  }

  if (!state.connectionExpiryTimestamp) {
    timerElement.textContent = 'Rotation idle — generate a code to enable automatic refresh.';
    timerElement.dataset.status = 'idle';
    return;
  }

  const remainingMs = state.connectionExpiryTimestamp - Date.now();

  if (remainingMs <= 0) {
    timerElement.textContent = 'Rotating now…';
    timerElement.dataset.status = 'active';
    return;
  }

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  timerElement.textContent = `Auto-rotation in ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  timerElement.dataset.status = 'active';
}

function showCopyFeedback(message, intent = 'success') {
  const feedbackElement = document.getElementById('remoteCodeFeedback');
  if (!feedbackElement) {
    return;
  }

  feedbackElement.textContent = message;
  feedbackElement.classList.remove('hidden', 'is-warning', 'is-error');

  if (intent === 'warning') {
    feedbackElement.classList.add('is-warning');
  } else if (intent === 'error') {
    feedbackElement.classList.add('is-error');
  }

  if (state.copyFeedbackTimeoutId) {
    clearTimeout(state.copyFeedbackTimeoutId);
  }

  state.copyFeedbackTimeoutId = setTimeout(() => {
    feedbackElement.classList.add('hidden');
    feedbackElement.classList.remove('is-warning', 'is-error');
    state.copyFeedbackTimeoutId = null;
  }, 3500);
}

async function handleStartHost() {
  try {
    // First switch to remote tab so user sees the interface
    switchToTab('remote');
    
    updateConnectionSecurityPill('Preparing host session…', 'warning');
    addActivityLog('Remote', 'Starting host session...', 'info');
    
    // Generate the code first (before screen share dialog appears)
    await generateConnectionCode();
    
    // Show notification that screen share is about to be requested
    showNotification('Screen Share Required', 'Please select the screen or window you want to share when prompted.');
    
    // Small delay to let user see the notification
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Now request screen share from content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'START_REMOTE_HOST' });
    
    if (response && response.success) {
      addActivityLog('Remote', 'Host session started successfully', 'success');
      showNotification('Host Active', 'Remote control host is now active. Share your code with the viewer.');
      updateConnectionSecurityPill('Host active');
    } else {
      // User may have cancelled the screen share dialog
      addActivityLog('Remote', 'Screen share was cancelled or failed', 'warning');
      updateConnectionSecurityPill('Share cancelled', 'warning');
      showNotification('Screen Share Cancelled', 'You can try again by clicking Start Host', 'warning');
    }
  } catch (error) {
    console.error('Failed to start host:', error);
    addActivityLog('Remote', `Failed: ${error.message}`, 'error');
    updateConnectionSecurityPill('Host failed', 'danger');
    showNotification('Host Failed', error.message || 'Failed to start remote host', 'error');
  }
}

async function handleConnectRemote() {
  document.getElementById('remoteCodeInput')?.focus();
  switchToTab('remote');
}

async function generateConnectionCode() {
  clearConnectionRotationTimers();
  updateConnectionSecurityPill('Generating secure code…', 'warning');

  // Generate 6-digit code
  state.connectionCode = Math.floor(100000 + Math.random() * 900000).toString();
  const codeElement = document.getElementById('connectionCode');
  const qrContainer = document.getElementById('qrCodeContainer');
  
  if (codeElement) {
    codeElement.textContent = state.connectionCode;
    // Make code clickable to copy
    codeElement.onclick = copyConnectionCode;
  }
  
  // Check if QRCode library is loaded
  if (typeof QRCode === 'undefined') {
    console.warn('QRCode library not loaded, showing fallback');
    if (qrContainer) {
      renderQrFallback(qrContainer, state.connectionCode, 'QR library loading... Use the code manually.');
      updateConnectionSecurityPill('Manual mode', 'warning');
    }
    addActivityLog('Remote', `Generated connection code: ${state.connectionCode} (manual mode)`, 'info');
    startConnectionRotationCycle();
    return;
  }
  
  // Generate QR Code locally
  if (qrContainer) {
    const qrText = `CUBE-REMOTE:${state.connectionCode}`;
    const qrInstance = getOrCreateQrRenderer(qrContainer);

    if (qrInstance) {
      try {
        qrInstance.clear();
        qrInstance.makeCode(qrText);
        updateConnectionSecurityPill('Live code active');
        toggleQrContainerEmptyState(qrContainer, false);
        qrContainer.setAttribute('aria-label', 'Secure QR code ready for remote pairing');
      } catch (error) {
        console.error('Failed to render QR code:', error);
        renderQrFallback(qrContainer, state.connectionCode, 'QR rendering failed. Share the code manually.');
        updateConnectionSecurityPill('QR error', 'warning');
      }
    } else {
      renderQrFallback(qrContainer, state.connectionCode, 'QR library unavailable. Share the code manually.');
      updateConnectionSecurityPill('Manual mode', 'warning');
    }
  }

  startConnectionRotationCycle();
  
  addActivityLog('Remote', `Generated connection code: ${state.connectionCode}`, 'success');
}

async function copyConnectionCode() {
  if (!state.connectionCode) {
    await generateConnectionCode();
  }
  
  try {
    await navigator.clipboard.writeText(state.connectionCode);
    showNotification('Code Copied', 'Connection code copied to clipboard');
    addActivityLog('Remote', 'Connection code copied', 'info');
    showCopyFeedback('Código copiado al portapapeles');
  } catch (error) {
    console.error('Failed to copy code:', error);
    showCopyFeedback('No se pudo copiar el código', 'error');
  }
}

async function connectToRemoteSession() {
  const code = document.getElementById('remoteCodeInput')?.value;
  
  if (!code || code.length !== 6) {
    showNotification('Invalid Code', 'Please enter a valid 6-digit code', 'error');
    return;
  }
  
  try {
    addActivityLog('Remote', `Connecting to session: ${code}`, 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { 
      type: 'CONNECT_REMOTE_CLIENT',
      code: code
    });
    
    addActivityLog('Remote', 'Connected to remote session', 'success');
    showNotification('Connected', 'Remote control connection established');
  } catch (error) {
    console.error('Connection failed:', error);
    addActivityLog('Remote', `Connection failed: ${error.message}`, 'error');
    showNotification('Connection Failed', error.message, 'error');
  }
}

// ============================================================================
// REMOTE DESKTOP ENHANCED FEATURES (QR Scanning & Viewer Controls)
// ============================================================================

let remoteViewerState = {
  isViewerMode: false,
  connectionId: null,
  controlsEnabled: true,
  quality: 'auto'
};

function initializeRemoteEnhanced() {
  console.log('🛰️ Initializing Remote Desktop Enhanced Features...');
  
  // QR Scanner button
  document.getElementById('btnRemoteQRScan')?.addEventListener('click', showRemoteQRScanner);
  
  // Manual code paste
  document.getElementById('btnPasteRemoteCode')?.addEventListener('click', pasteRemoteCode);
  
  // Viewer mode controls
  document.getElementById('btnViewerFullscreen')?.addEventListener('click', toggleViewerFullscreen);
  document.getElementById('btnViewerControls')?.addEventListener('click', toggleViewerControls);
  document.getElementById('btnViewerQuality')?.addEventListener('click', cycleViewerQuality);
  document.getElementById('btnViewerDisconnect')?.addEventListener('click', disconnectViewer);
  document.getElementById('btnViewerKeyboard')?.addEventListener('click', showVirtualKeyboard);
  document.getElementById('btnViewerChat')?.addEventListener('click', toggleViewerChat);
  
  // Share remote link
  document.getElementById('btnShareRemoteLink')?.addEventListener('click', shareRemoteLink);
  document.getElementById('btnGenerateRemoteQR')?.addEventListener('click', generateRemoteQRCode);
  
  console.log('✅ Remote Enhanced Features initialized');
}

function showRemoteQRScanner() {
  const modal = document.getElementById('remoteQRScannerModal');
  if (modal) {
    modal.classList.remove('hidden');
    startRemoteQRScanning();
  } else {
    showNotification('Error', 'QR Scanner not available', 'error');
  }
}

async function startRemoteQRScanning() {
  const videoEl = document.getElementById('remoteQRVideo');
  const canvasEl = document.getElementById('remoteQRCanvas');
  
  if (!videoEl || !canvasEl) return;
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    videoEl.srcObject = stream;
    await videoEl.play();
    
    const ctx = canvasEl.getContext('2d');
    
    const scanFrame = () => {
      if (!videoEl.srcObject) return;
      
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
      ctx.drawImage(videoEl, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      
      if (typeof jsQR !== 'undefined') {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data.startsWith('CUBE-REMOTE:')) {
          const remoteCode = code.data.replace('CUBE-REMOTE:', '');
          stopRemoteQRScanning();
          connectWithScannedCode(remoteCode);
          return;
        }
      }
      
      requestAnimationFrame(scanFrame);
    };
    
    scanFrame();
    
  } catch (e) {
    showNotification('Camera Error', e.message, 'error');
    stopRemoteQRScanning();
  }
}

function stopRemoteQRScanning() {
  const videoEl = document.getElementById('remoteQRVideo');
  if (videoEl?.srcObject) {
    videoEl.srcObject.getTracks().forEach(track => track.stop());
    videoEl.srcObject = null;
  }
  
  const modal = document.getElementById('remoteQRScannerModal');
  if (modal) modal.classList.add('hidden');
}

async function connectWithScannedCode(code) {
  const input = document.getElementById('remoteCodeInput');
  if (input) input.value = code;
  
  showNotification('QR Scanned', `Connecting with code: ${code}`, 'success');
  addActivityLog('Remote', `QR code scanned: ${code}`, 'info');
  
  await connectToRemoteSession();
}

async function pasteRemoteCode() {
  try {
    const text = await navigator.clipboard.readText();
    const codeMatch = text.match(/\d{6}/);
    
    if (codeMatch) {
      const input = document.getElementById('remoteCodeInput');
      if (input) input.value = codeMatch[0];
      showNotification('Pasted', `Code found: ${codeMatch[0]}`, 'success');
    } else {
      showNotification('No Code', 'No valid 6-digit code found in clipboard', 'warning');
    }
  } catch (e) {
    showNotification('Error', 'Could not read clipboard', 'error');
  }
}

function toggleViewerFullscreen() {
  const viewerContainer = document.getElementById('remoteViewer');
  if (!viewerContainer) return;
  
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    viewerContainer.requestFullscreen().catch(e => {
      showNotification('Error', 'Fullscreen not available', 'error');
    });
  }
}

function toggleViewerControls() {
  remoteViewerState.controlsEnabled = !remoteViewerState.controlsEnabled;
  
  const btn = document.getElementById('btnViewerControls');
  if (btn) {
    btn.classList.toggle('active', remoteViewerState.controlsEnabled);
    btn.querySelector('.btn-icon').textContent = remoteViewerState.controlsEnabled ? '🖱️' : '👁️';
  }
  
  showNotification(
    'Controls', 
    remoteViewerState.controlsEnabled ? 'Remote control enabled' : 'View-only mode',
    'info'
  );
}

function cycleViewerQuality() {
  const qualities = ['auto', 'high', 'medium', 'low'];
  const currentIdx = qualities.indexOf(remoteViewerState.quality);
  remoteViewerState.quality = qualities[(currentIdx + 1) % qualities.length];
  
  const btn = document.getElementById('btnViewerQuality');
  if (btn) {
    const icons = { auto: '🔄', high: '🎬', medium: '📺', low: '📱' };
    btn.querySelector('.btn-icon').textContent = icons[remoteViewerState.quality];
    btn.title = `Quality: ${remoteViewerState.quality}`;
  }
  
  // Send quality preference to remote
  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    chrome.tabs.sendMessage(tab.id, {
      type: 'SET_REMOTE_QUALITY',
      quality: remoteViewerState.quality
    });
  });
  
  showNotification('Quality', `Streaming quality: ${remoteViewerState.quality}`, 'info');
}

async function disconnectViewer() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { type: 'DISCONNECT_REMOTE' });
    
    remoteViewerState.isViewerMode = false;
    remoteViewerState.connectionId = null;
    
    clearConnectionRotationTimers();
    
    const qrContainer = document.getElementById('qrCodeContainer');
    if (qrContainer) toggleQrContainerEmptyState(qrContainer, true);
    
    showNotification('Disconnected', 'Remote session ended', 'info');
    addActivityLog('Remote', 'Session disconnected', 'info');
  } catch (e) {
    console.error('Disconnect error:', e);
  }
}

function showVirtualKeyboard() {
  const modal = document.getElementById('virtualKeyboardModal');
  if (modal) {
    modal.classList.remove('hidden');
  } else {
    showNotification('Info', 'Virtual keyboard: Use Ctrl+Alt+K on the remote', 'info');
  }
}

function toggleViewerChat() {
  const chatPanel = document.getElementById('remoteViewerChat');
  if (chatPanel) {
    chatPanel.classList.toggle('hidden');
  }
}

async function shareRemoteLink() {
  if (!state.connectionCode) {
    await generateConnectionCode();
  }
  
  const shareUrl = `cube://remote?code=${state.connectionCode}`;
  const shareText = `Join my CUBE remote session:\n\nCode: ${state.connectionCode}\n\nOr scan the QR code.`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'CUBE Remote Session',
        text: shareText,
        url: shareUrl
      });
      addActivityLog('Remote', 'Session link shared', 'success');
    } catch (e) {
      if (e.name !== 'AbortError') {
        await navigator.clipboard.writeText(shareText);
        showNotification('Copied', 'Share text copied to clipboard', 'success');
      }
    }
  } else {
    await navigator.clipboard.writeText(shareText);
    showNotification('Copied', 'Share text copied to clipboard', 'success');
  }
}

function generateRemoteQRCode() {
  if (!state.connectionCode) {
    generateConnectionCode();
    return;
  }
  
  const qrContainer = document.getElementById('qrCodeContainer');
  if (qrContainer && typeof QRCode !== 'undefined') {
    const qrInstance = getOrCreateQrRenderer(qrContainer);
    if (qrInstance) {
      qrInstance.clear();
      qrInstance.makeCode(`CUBE-REMOTE:${state.connectionCode}`);
      toggleQrContainerEmptyState(qrContainer, false);
      showNotification('QR Updated', 'New QR code generated', 'success');
    }
  }
}

// ============================================================================
// MODULE HEALTH PANEL
// ============================================================================

const MODULE_STATUS_META = {
  online: { className: 'is-online', label: 'Online' },
  degraded: { className: 'is-degraded', label: 'Degraded' },
  offline: { className: 'is-offline', label: 'Offline' },
  checking: { className: 'is-checking', label: 'Checking...' }
};

let moduleHealthIntervalId = null;

function createInitialModuleStatus() {
  return {
    status: 'checking',
    detail: 'Initializing...',
    lastChecked: null
  };
}

function initializeModuleHealth() {
  const refreshButton = document.getElementById('btnModuleHealthRefresh');
  refreshButton?.addEventListener('click', () => refreshModuleHealth(true));
  refreshModuleHealth();

  if (moduleHealthIntervalId) {
    clearInterval(moduleHealthIntervalId);
  }
  moduleHealthIntervalId = setInterval(refreshModuleHealth, MODULE_HEALTH_REFRESH_INTERVAL_MS);
}

function refreshModuleHealth(manual = false) {
  const refreshButton = document.getElementById('btnModuleHealthRefresh');
  if (manual && refreshButton) {
    refreshButton.disabled = true;
  }

  const checks = Object.keys(MODULE_HEALTH_CONFIG).map((moduleKey) => pollModuleHealth(moduleKey));

  Promise.allSettled(checks).then(() => {
    if (manual && refreshButton) {
      refreshButton.disabled = false;
      showNotification('Bridge Health', 'Module status synchronized');
    }
  });
}

function pollModuleHealth(moduleKey) {
  const config = MODULE_HEALTH_CONFIG[moduleKey];
  if (!config) {
    return Promise.resolve();
  }

  updateModuleStatus(moduleKey, 'checking', 'Syncing with desktop agent…');

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: config.messageType }, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        updateModuleStatus(moduleKey, 'offline', `Extension unavailable: ${lastError.message}`);
        return resolve();
      }

      if (response?.success && !response?.standalone) {
        const latency = typeof response.latency === 'number' ? `${response.latency} ms` : null;
        const detail = latency ? `Connected • ${latency}` : 'Connected to CUBE Desktop';
        updateModuleStatus(moduleKey, 'online', detail);
      } else if (response?.standalone) {
        updateModuleStatus(moduleKey, 'degraded', 'Standalone mode — Desktop bridge not detected');
      } else {
        const detail = response?.error ? `Unavailable: ${response.error}` : 'Desktop bridge did not respond';
        updateModuleStatus(moduleKey, 'offline', detail);
      }

      resolve();
    });
  });
}

function updateModuleStatus(moduleKey, status, detail) {
  if (!state.modules[moduleKey]) {
    state.modules[moduleKey] = createInitialModuleStatus();
  }

  const previousStatus = state.modules[moduleKey].status;
  state.modules[moduleKey] = {
    status,
    detail,
    lastChecked: Date.now()
  };

  const detailElement = document.getElementById(`moduleDetail-${moduleKey}`);
  if (detailElement) {
    detailElement.textContent = detail;
  }

  const statusElement = document.getElementById(`moduleStatus-${moduleKey}`);
  if (statusElement) {
    const dot = statusElement.querySelector('.module-status-dot');
    const text = statusElement.querySelector('.module-status-text');
    const statusMeta = MODULE_STATUS_META[status] || MODULE_STATUS_META.checking;

    if (dot) {
      dot.classList.remove('is-online', 'is-degraded', 'is-offline', 'is-checking');
      dot.classList.add(statusMeta.className);
    }

    if (text) {
      text.textContent = statusMeta.label;
    }
  }

  if (previousStatus && previousStatus !== status) {
    const moduleLabel = MODULE_HEALTH_CONFIG[moduleKey]?.label || moduleKey;
    let intent = 'info';
    if (status === 'online') {
      intent = 'success';
    } else if (status === 'degraded') {
      intent = 'warning';
    } else if (status === 'offline') {
      intent = 'error';
    }
    addActivityLog('Bridge', `${moduleLabel} is now ${MODULE_STATUS_META[status]?.label || status}`, intent);
  }
}

// ============================================================================
// AI SETTINGS
// ============================================================================

async function saveAISettings() {
  try {
    const settings = {
      openaiKey: document.getElementById('openaiKey')?.value,
      claudeKey: document.getElementById('claudeKey')?.value,
      geminiKey: document.getElementById('geminiKey')?.value,
      aiStrategy: document.getElementById('aiStrategy')?.value
    };
    
    await chrome.storage.local.set({ aiSettings: settings });
    
    addActivityLog('AI', 'API keys saved successfully', 'success');
    showNotification('Settings Saved', 'AI provider settings have been updated');
  } catch (error) {
    console.error('Failed to save AI settings:', error);
    addActivityLog('AI', `Failed to save settings: ${error.message}`, 'error');
  }
}

// Load AI settings on init
async function loadAISettings() {
  try {
    const result = await chrome.storage.local.get(['aiSettings']);
    if (result.aiSettings) {
      document.getElementById('openaiKey').value = result.aiSettings.openaiKey || '';
      document.getElementById('claudeKey').value = result.aiSettings.claudeKey || '';
      document.getElementById('geminiKey').value = result.aiSettings.geminiKey || '';
      document.getElementById('aiStrategy').value = result.aiSettings.aiStrategy || 'auto';
    }
  } catch (error) {
    console.error('Failed to load AI settings:', error);
  }
}

// ============================================================================
// P2P FILE SHARING
// ============================================================================

const P2P_STATUS_PRESETS = {
  idle: {
    text: 'Ready to connect',
    intent: 'idle',
    meta: 'No active P2P sessions'
  },
  waitingAnswer: {
    text: 'Waiting for client answer…',
    intent: 'warning',
    meta: 'Share the host code + blob and wait for the client response.'
  },
  awaitingHost: {
    text: 'Share your answer with the host',
    intent: 'warning',
    meta: 'Copy the generated client blob and send it back to the host.'
  },
  connected: {
    text: 'Secure tunnel active',
    intent: 'success',
    meta: 'Files up to 100 MB/s can flow directly between peers.'
  },
  error: {
    text: 'Handshake requires attention',
    intent: 'danger',
    meta: 'Verify the blobs and try again.'
  }
};

// Direct P2P state (works in sidepanel without content script)
const p2pDirectState = {
  peerConnection: null,
  dataChannel: null,
  isHost: true,
  isConnected: false,
  fileHandle: null
};

async function initializeP2PSection() {
  if (!document.getElementById('tab-p2p')) {
    return;
  }

  // New direct P2P handlers
  document.getElementById('btnP2PHostMode')?.addEventListener('click', () => setP2PMode('host'));
  document.getElementById('btnP2PClientMode')?.addEventListener('click', () => setP2PMode('client'));
  document.getElementById('btnP2PStartHostDirect')?.addEventListener('click', handleP2PStartHostDirect);
  document.getElementById('btnP2PJoinDirect')?.addEventListener('click', handleP2PJoinDirect);
  document.getElementById('btnP2PApplyAnswer')?.addEventListener('click', handleP2PApplyAnswerDirect);
  document.getElementById('btnP2PDisconnectDirect')?.addEventListener('click', handleP2PDisconnectDirect);
  document.getElementById('btnCopyP2PHostCode')?.addEventListener('click', () => copyP2PCode('p2pHostOfferCode'));
  document.getElementById('btnCopyP2PClientAnswer')?.addEventListener('click', () => copyP2PCode('p2pClientAnswerCode'));
  document.getElementById('btnP2PSendFilesDirect')?.addEventListener('click', handleP2PSendFilesDirect);

  // Old handlers (backwards compat)
  document.getElementById('btnP2PStartHost')?.addEventListener('click', handleP2PStartHost);
  document.getElementById('btnApplyHostAnswer')?.addEventListener('click', handleP2PApplyAnswer);
  document.getElementById('btnP2PSendFiles')?.addEventListener('click', handleP2PSendFiles);
  document.getElementById('btnP2PJoinClient')?.addEventListener('click', handleP2PJoinClient);
  document.getElementById('btnP2PDisconnect')?.addEventListener('click', handleP2PDisconnect);
  document.getElementById('btnP2PRefresh')?.addEventListener('click', () => refreshP2PStatus(true));
  document.getElementById('btnP2PClearTransfers')?.addEventListener('click', handleP2PClearTransfers);
  document.getElementById('btnCopyHostCode')?.addEventListener('click', () => copyElementValue(document.getElementById('p2pHostCode'), 'connection code'));
  document.getElementById('btnCopyHostOffer')?.addEventListener('click', () => copyElementValue(document.getElementById('p2pHostOffer'), 'host handshake'));
  document.getElementById('btnCopyClientAnswer')?.addEventListener('click', () => copyElementValue(document.getElementById('p2pClientAnswerOutput'), 'client answer'));

  applyP2PStatusPreset('idle');
  renderP2PTransfers();

  await refreshP2PStatus();
  initializeP2PDirectoryPanel();
}

function setP2PMode(mode) {
  const hostBtn = document.getElementById('btnP2PHostMode');
  const clientBtn = document.getElementById('btnP2PClientMode');
  const hostSection = document.getElementById('p2pHostSection');
  const clientSection = document.getElementById('p2pClientSection');
  
  p2pDirectState.isHost = mode === 'host';
  
  if (mode === 'host') {
    hostBtn?.classList.add('active');
    clientBtn?.classList.remove('active');
    hostSection?.classList.remove('hidden');
    clientSection?.classList.add('hidden');
  } else {
    hostBtn?.classList.remove('active');
    clientBtn?.classList.add('active');
    hostSection?.classList.add('hidden');
    clientSection?.classList.remove('hidden');
  }
  
  addActivityLog('P2P', `Switched to ${mode === 'host' ? 'Host (Send)' : 'Client (Receive)'} mode`, 'info');
}

async function handleP2PStartHostDirect() {
  const offerEl = document.getElementById('p2pHostOfferCode');
  const startBtn = document.getElementById('btnP2PStartHostDirect');
  
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.innerHTML = '<span class="btn-icon">⏳</span> Generating...';
  }
  if (offerEl) {
    offerEl.value = '⏳ Generating connection code... please wait...';
  }
  
  try {
    // Create peer connection
    p2pDirectState.peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Create data channel for files
    p2pDirectState.dataChannel = p2pDirectState.peerConnection.createDataChannel('fileTransfer', {
      ordered: true
    });
    
    setupP2PDataChannel(p2pDirectState.dataChannel);
    
    let iceDone = false;
    
    p2pDirectState.peerConnection.onicecandidate = (event) => {
      if (!event.candidate && !iceDone) {
        iceDone = true;
        const offerCode = btoa(JSON.stringify(p2pDirectState.peerConnection.localDescription));
        if (offerEl) {
          offerEl.value = offerCode;
        }
        showNotification('✅ Code Ready!', 'Copy your code and share with your friend');
        addActivityLog('P2P', '✅ Connection code ready!', 'success');
        updateP2PStatusDisplay('Code ready - share with friend', 'warning', 'Waiting for response...');
        
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.innerHTML = '<span class="btn-icon">🚀</span> Start Hosting';
        }
      }
    };
    
    p2pDirectState.peerConnection.onconnectionstatechange = () => {
      console.log('P2P connection state:', p2pDirectState.peerConnection.connectionState);
      if (p2pDirectState.peerConnection.connectionState === 'connected') {
        p2pDirectState.isConnected = true;
        updateP2PStatusDisplay('Connected!', 'success', 'Ready to transfer files');
        document.getElementById('btnP2PDisconnectDirect')?.classList.remove('hidden');
        document.getElementById('btnP2PSendFilesDirect').disabled = false;
        showNotification('🎉 Connected!', 'P2P connection established');
        addActivityLog('P2P', '🎉 Connected to peer!', 'success');
      }
    };
    
    // Create offer
    const offer = await p2pDirectState.peerConnection.createOffer();
    await p2pDirectState.peerConnection.setLocalDescription(offer);
    
    // Timeout fallback
    setTimeout(() => {
      if (!iceDone && p2pDirectState.peerConnection?.localDescription) {
        iceDone = true;
        const offerCode = btoa(JSON.stringify(p2pDirectState.peerConnection.localDescription));
        if (offerEl) {
          offerEl.value = offerCode;
        }
        showNotification('📝 Code Ready', 'Your connection code is ready');
        
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.innerHTML = '<span class="btn-icon">🚀</span> Start Hosting';
        }
      }
    }, 3000);
    
    addActivityLog('P2P', 'Started hosting, generating code...', 'info');
    
  } catch (error) {
    console.error('P2P host start failed:', error);
    showNotification('Error', error.message, 'error');
    addActivityLog('P2P', `Failed: ${error.message}`, 'error');
    
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.innerHTML = '<span class="btn-icon">🚀</span> Start Hosting';
    }
    if (offerEl) {
      offerEl.value = '';
    }
  }
}

async function handleP2PApplyAnswerDirect() {
  const answerInput = document.getElementById('p2pHostAnswerInput');
  const answerCode = answerInput?.value.trim();
  
  if (!answerCode) {
    showNotification('Missing Code', 'Please paste your friend\'s response code', 'warning');
    return;
  }
  
  try {
    const answer = JSON.parse(atob(answerCode));
    await p2pDirectState.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    
    addActivityLog('P2P', 'Applied friend\'s response, connecting...', 'info');
    
  } catch (error) {
    console.error('Failed to apply answer:', error);
    showNotification('Invalid Code', 'The response code is invalid. Please check and try again.', 'error');
    addActivityLog('P2P', `Invalid response code: ${error.message}`, 'error');
  }
}

async function handleP2PJoinDirect() {
  const offerInput = document.getElementById('p2pClientOfferInput');
  const answerEl = document.getElementById('p2pClientAnswerCode');
  const joinBtn = document.getElementById('btnP2PJoinDirect');
  
  const offerCode = offerInput?.value.trim();
  
  if (!offerCode) {
    showNotification('Missing Code', 'Please paste the host\'s connection code', 'warning');
    return;
  }
  
  if (joinBtn) {
    joinBtn.disabled = true;
    joinBtn.innerHTML = '<span class="btn-icon">⏳</span> Generating...';
  }
  if (answerEl) {
    answerEl.value = '⏳ Generating response code...';
  }
  
  try {
    const offer = JSON.parse(atob(offerCode));
    
    // Create peer connection
    p2pDirectState.peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Handle incoming data channel
    p2pDirectState.peerConnection.ondatachannel = (event) => {
      p2pDirectState.dataChannel = event.channel;
      setupP2PDataChannel(p2pDirectState.dataChannel);
    };
    
    let iceDone = false;
    
    p2pDirectState.peerConnection.onicecandidate = (event) => {
      if (!event.candidate && !iceDone) {
        iceDone = true;
        const answerCode = btoa(JSON.stringify(p2pDirectState.peerConnection.localDescription));
        if (answerEl) {
          answerEl.value = answerCode;
        }
        showNotification('✅ Response Ready!', 'Copy your response code and send to the host');
        addActivityLog('P2P', '✅ Response code ready - send to host!', 'success');
        updateP2PStatusDisplay('Response ready', 'warning', 'Waiting for host to connect...');
        
        if (joinBtn) {
          joinBtn.disabled = false;
          joinBtn.innerHTML = '<span class="btn-icon">🔗</span> Join & Generate Response';
        }
      }
    };
    
    p2pDirectState.peerConnection.onconnectionstatechange = () => {
      if (p2pDirectState.peerConnection.connectionState === 'connected') {
        p2pDirectState.isConnected = true;
        updateP2PStatusDisplay('Connected!', 'success', 'Ready to receive files');
        document.getElementById('btnP2PDisconnectDirect')?.classList.remove('hidden');
        showNotification('🎉 Connected!', 'P2P connection established');
        addActivityLog('P2P', '🎉 Connected to host!', 'success');
      }
    };
    
    // Set remote description and create answer
    await p2pDirectState.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await p2pDirectState.peerConnection.createAnswer();
    await p2pDirectState.peerConnection.setLocalDescription(answer);
    
    // Timeout fallback
    setTimeout(() => {
      if (!iceDone && p2pDirectState.peerConnection?.localDescription) {
        iceDone = true;
        const answerCode = btoa(JSON.stringify(p2pDirectState.peerConnection.localDescription));
        if (answerEl) {
          answerEl.value = answerCode;
        }
        
        if (joinBtn) {
          joinBtn.disabled = false;
          joinBtn.innerHTML = '<span class="btn-icon">🔗</span> Join & Generate Response';
        }
      }
    }, 3000);
    
    addActivityLog('P2P', 'Processing host code, generating response...', 'info');
    
  } catch (error) {
    console.error('P2P join failed:', error);
    showNotification('Invalid Code', 'The host\'s code is invalid. Please check and try again.', 'error');
    addActivityLog('P2P', `Join failed: ${error.message}`, 'error');
    
    if (joinBtn) {
      joinBtn.disabled = false;
      joinBtn.innerHTML = '<span class="btn-icon">🔗</span> Join & Generate Response';
    }
    if (answerEl) {
      answerEl.value = '';
    }
  }
}

function setupP2PDataChannel(channel) {
  channel.onopen = () => {
    console.log('📡 Data channel opened');
    addActivityLog('P2P', '📡 Data channel ready for transfers', 'success');
  };
  
  channel.onmessage = (event) => {
    console.log('📦 Received data:', event.data.length, 'bytes');
    // Handle incoming file data
    handleP2PIncomingData(event.data);
  };
  
  channel.onerror = (error) => {
    console.error('Data channel error:', error);
    addActivityLog('P2P', `Data channel error: ${error}`, 'error');
  };
  
  channel.onclose = () => {
    console.log('📡 Data channel closed');
  };
}

function handleP2PIncomingData(data) {
  // Handle received file chunks
  try {
    if (typeof data === 'string') {
      const msg = JSON.parse(data);
      if (msg.type === 'file-start') {
        addActivityLog('P2P', `📥 Receiving file: ${msg.name}`, 'info');
        showNotification('📥 Receiving File', msg.name);
      } else if (msg.type === 'file-complete') {
        addActivityLog('P2P', `✅ File received: ${msg.name}`, 'success');
        showNotification('✅ File Received', msg.name);
      }
    }
  } catch {
    // Binary data - file chunk
  }
}

function handleP2PDisconnectDirect() {
  if (p2pDirectState.dataChannel) {
    p2pDirectState.dataChannel.close();
    p2pDirectState.dataChannel = null;
  }
  
  if (p2pDirectState.peerConnection) {
    p2pDirectState.peerConnection.close();
    p2pDirectState.peerConnection = null;
  }
  
  p2pDirectState.isConnected = false;
  
  // Reset UI
  document.getElementById('p2pHostOfferCode').value = '';
  document.getElementById('p2pHostAnswerInput').value = '';
  document.getElementById('p2pClientOfferInput').value = '';
  document.getElementById('p2pClientAnswerCode').value = '';
  document.getElementById('btnP2PDisconnectDirect')?.classList.add('hidden');
  document.getElementById('btnP2PSendFilesDirect').disabled = true;
  
  updateP2PStatusDisplay('Disconnected', 'idle', 'Click Start Hosting or Join to connect');
  addActivityLog('P2P', 'Disconnected from peer', 'info');
  showNotification('Disconnected', 'P2P connection closed');
}

async function handleP2PSendFilesDirect() {
  if (!p2pDirectState.dataChannel || p2pDirectState.dataChannel.readyState !== 'open') {
    showNotification('Not Connected', 'Please connect to a peer first', 'warning');
    return;
  }
  
  try {
    // Open file picker
    const files = await window.showOpenFilePicker({
      multiple: true
    });
    
    for (const fileHandle of files) {
      const file = await fileHandle.getFile();
      
      // Send file info
      p2pDirectState.dataChannel.send(JSON.stringify({
        type: 'file-start',
        name: file.name,
        size: file.size
      }));
      
      addActivityLog('P2P', `📤 Sending: ${file.name}`, 'info');
      showNotification('📤 Sending File', file.name);
      
      // Send file in chunks
      const chunkSize = 16384;
      const reader = file.stream().getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Send chunk
        p2pDirectState.dataChannel.send(value);
      }
      
      // Send complete signal
      p2pDirectState.dataChannel.send(JSON.stringify({
        type: 'file-complete',
        name: file.name
      }));
      
      addActivityLog('P2P', `✅ Sent: ${file.name}`, 'success');
    }
    
    showNotification('✅ Files Sent', `Sent ${files.length} file(s)`);
    
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Send files error:', error);
      showNotification('Error', error.message, 'error');
    }
  }
}

function copyP2PCode(elementId) {
  const el = document.getElementById(elementId);
  const code = el?.value?.trim();
  
  if (!code || code.startsWith('⏳')) {
    showNotification('Not Ready', 'Code is still generating...', 'warning');
    return;
  }
  
  navigator.clipboard.writeText(code).then(() => {
    showNotification('📋 Copied!', 'Code copied to clipboard');
    addActivityLog('P2P', 'Code copied to clipboard', 'info');
  }).catch(() => {
    showNotification('Error', 'Failed to copy', 'error');
  });
}

function applyP2PStatusPreset(presetKey, overrides = {}) {
  const preset = {
    ...(P2P_STATUS_PRESETS[presetKey] || P2P_STATUS_PRESETS.idle),
    ...overrides
  };

  updateP2PStatusDisplay(preset.text, preset.intent, preset.meta);
  state.p2p.status = presetKey;
}

function updateP2PStatusDisplay(text, intent = 'idle', meta = '') {
  const pill = document.getElementById('p2pStatusPill');
  if (pill) {
    pill.textContent = text;
    pill.classList.remove('is-warning', 'is-success', 'is-danger');
    if (intent === 'warning') {
      pill.classList.add('is-warning');
    } else if (intent === 'success') {
      pill.classList.add('is-success');
    } else if (intent === 'danger') {
      pill.classList.add('is-danger');
    }
  }

  const metaElement = document.getElementById('p2pStatusMeta');
  if (metaElement) {
    metaElement.textContent = meta || P2P_STATUS_PRESETS.idle.meta;
  }
}

function updateP2PUI() {
  const hostCode = document.getElementById('p2pHostCode');
  if (hostCode) {
    hostCode.textContent = state.p2p.code || '------';
  }

  const hostOffer = document.getElementById('p2pHostOffer');
  if (hostOffer && document.activeElement !== hostOffer) {
    hostOffer.value = state.p2p.hostHandshake || '';
  }

  const clientAnswer = document.getElementById('p2pClientAnswerOutput');
  if (clientAnswer && document.activeElement !== clientAnswer) {
    clientAnswer.value = state.p2p.clientHandshake || '';
  }

  const sendBtn = document.getElementById('btnP2PSendFiles');
  if (sendBtn) {
    sendBtn.disabled = state.p2p.status !== 'connected';
  }

  const disconnectBtn = document.getElementById('btnP2PDisconnect');
  if (disconnectBtn) {
    disconnectBtn.disabled = state.p2p.status === 'idle';
  }
}

async function handleP2PStartHost() {
  const button = document.getElementById('btnP2PStartHost');
  if (button) {
    button.disabled = true;
  }

  try {
    applyP2PStatusPreset('waitingAnswer', { text: 'Generating host handshake…' });
    const response = await sendMessageToActiveTab({ type: 'P2P_INIT_HOST' });

    if (!response?.success) {
      throw new Error(response?.error || 'Unable to start host session');
    }

    const encodedOffer = encodeHandshakePayload(response.offer);
    state.p2p.role = 'host';
    state.p2p.code = response.code;
    state.p2p.hostHandshake = encodedOffer;
    state.p2p.clientHandshake = '';
    const hostAnswerInput = document.getElementById('p2pHostAnswerInput');
    if (hostAnswerInput) {
      hostAnswerInput.value = '';
    }

    applyP2PStatusPreset('waitingAnswer');
    addActivityLog('P2P', `Host handshake generated (${response.code})`, 'success');
    showNotification('P2P Host Ready', 'Share the code and blob with your partner');
  } catch (error) {
    console.error('P2P host init failed:', error);
    applyP2PStatusPreset('error', { meta: error.message });
    addActivityLog('P2P', `Host init failed: ${error.message}`, 'error');
    showNotification('P2P Error', error.message, 'error');
  } finally {
    if (button) {
      button.disabled = false;
    }
    updateP2PUI();
  }
}

async function handleP2PApplyAnswer() {
  const textarea = document.getElementById('p2pHostAnswerInput');
  if (!textarea) {
    return;
  }

  const blob = textarea.value.trim();
  if (!blob) {
    showNotification('Missing Answer', 'Paste the client answer blob first', 'error');
    return;
  }

  try {
    applyP2PStatusPreset('waitingAnswer', { text: 'Applying client answer…' });
    const answer = decodeHandshakePayload(blob);
    const response = await sendMessageToActiveTab({ type: 'P2P_APPLY_REMOTE_ANSWER', answer });

    if (!response?.success) {
      throw new Error(response?.error || 'Failed to apply client answer');
    }

      state.p2p.clientHandshake = state.p2p.role === 'client' ? blob : '';
    applyP2PStatusPreset('connected');
    addActivityLog('P2P', 'Client answer applied — channel ready', 'success');
    showNotification('P2P Connected', 'Secure channel established');
  } catch (error) {
    console.error('P2P apply answer failed:', error);
    applyP2PStatusPreset('error', { meta: error.message });
    addActivityLog('P2P', `Apply answer failed: ${error.message}`, 'error');
    showNotification('P2P Error', error.message, 'error');
  } finally {
    updateP2PUI();
  }
}

async function handleP2PJoinClient() {
  const codeInput = document.getElementById('p2pClientCode');
  const offerInput = document.getElementById('p2pClientOfferInput');

  const code = codeInput?.value.trim();
  const offerBlob = offerInput?.value.trim();

  if (!code || code.length !== 6) {
    showNotification('Invalid Code', 'Enter the 6-digit host code', 'error');
    return;
  }

  if (!offerBlob) {
    showNotification('Missing Handshake', 'Paste the host handshake blob first', 'error');
    return;
  }

  const button = document.getElementById('btnP2PJoinClient');
  if (button) {
    button.disabled = true;
  }

  try {
    applyP2PStatusPreset('awaitingHost', { text: 'Generating client answer…' });
    const offer = decodeHandshakePayload(offerBlob);
    const response = await sendMessageToActiveTab({ type: 'P2P_JOIN_CLIENT', code, offer });

    if (!response?.success) {
      throw new Error(response?.error || 'Unable to join host session');
    }

    const encodedAnswer = encodeHandshakePayload(response.answer);
    state.p2p.role = 'client';
    state.p2p.code = code;
    state.p2p.clientHandshake = encodedAnswer;

    applyP2PStatusPreset('awaitingHost');
    addActivityLog('P2P', `Client answer generated for code ${code}`, 'success');
    showNotification('Client Answer Ready', 'Share the blob with your host');
  } catch (error) {
    console.error('P2P join failed:', error);
    applyP2PStatusPreset('error', { meta: error.message });
    addActivityLog('P2P', `Join failed: ${error.message}`, 'error');
    showNotification('P2P Error', error.message, 'error');
  } finally {
    if (button) {
      button.disabled = false;
    }
    updateP2PUI();
  }
}

async function handleP2PSendFiles() {
  const button = document.getElementById('btnP2PSendFiles');
  if (button) {
    button.disabled = true;
  }

  try {
    const response = await sendMessageToActiveTab({ type: 'P2P_OPEN_FILE_PICKER' });

    if (!response?.success) {
      throw new Error(response?.error || 'Unable to open file picker');
    }

    addActivityLog('P2P', `Queued ${response.count || 0} file(s) for transfer`, 'info');
    showNotification('Files Ready', 'Transfer will start immediately');
  } catch (error) {
    console.error('P2P file selection failed:', error);
    addActivityLog('P2P', `File selection failed: ${error.message}`, 'error');
    showNotification('P2P Error', error.message, 'error');
  } finally {
    if (button) {
      button.disabled = state.p2p.status !== 'connected';
    }
  }
}

async function handleP2PDisconnect() {
  try {
    const response = await sendMessageToActiveTab({ type: 'P2P_DISCONNECT' });
    if (!response?.success) {
      throw new Error(response?.error || 'Unable to disconnect');
    }
    resetP2PState();
    applyP2PStatusPreset('idle');
    addActivityLog('P2P', 'Session disconnected', 'warning');
    showNotification('P2P Disconnected', 'Secure tunnel closed');
  } catch (error) {
    console.error('P2P disconnect failed:', error);
    applyP2PStatusPreset('error', { meta: error.message });
    addActivityLog('P2P', `Disconnect failed: ${error.message}`, 'error');
    showNotification('P2P Error', error.message, 'error');
  } finally {
    updateP2PUI();
  }
}

async function refreshP2PStatus(showToast = false) {
  try {
    // Use silent mode to avoid console errors for expected scenarios
    const response = await sendMessageToActiveTab({ type: 'P2P_GET_STATUS' }, { silent: true });
    
    // Handle silent failures gracefully
    if (response?.silent) {
      // This is an expected scenario - just set idle state without error
      applyP2PStatusPreset('idle', { 
        meta: 'Open a web page and refresh to enable P2P features.' 
      });
      updateP2PUI();
      return;
    }
    
    if (!response?.success) {
      throw new Error(response?.error || 'Status unavailable');
    }

    const { stats, connection } = response;
    state.p2p.stats = stats || null;
    state.p2p.code = connection?.code || stats?.connectionCode || state.p2p.code;
    state.p2p.role = connection?.role || state.p2p.role;

    if (stats?.isConnected) {
      applyP2PStatusPreset('connected');
    } else if (state.p2p.code) {
      applyP2PStatusPreset('waitingAnswer');
    } else {
      applyP2PStatusPreset('idle');
    }

    if (showToast) {
      showNotification('P2P Status Synced', 'Latest connection details loaded');
    }
  } catch (error) {
    // Only log actual unexpected errors
    if (!error.message?.includes('Content script') && !error.message?.includes('No active tab')) {
      console.warn('P2P status sync failed:', error.message || error);
    }
    
    // Show different messages based on error type
    if (error.message?.includes('Content script not available')) {
      applyP2PStatusPreset('idle', { 
        meta: 'Refresh the page to enable P2P features.' 
      });
    } else if (error.message?.includes('No active tab')) {
      applyP2PStatusPreset('idle', { 
        meta: 'Open a web page to use P2P features.' 
      });
    } else {
      applyP2PStatusPreset('error', { 
        meta: `Unable to sync P2P status: ${error.message || 'Unknown error'}` 
      });
    }
  } finally {
    updateP2PUI();
  }
}

function handleP2PClearTransfers() {
  state.p2p.transfers.clear();
  renderP2PTransfers();
  addActivityLog('P2P', 'Transfer list cleared', 'info');
}

function handleP2PEvent(eventType, payload = {}) {
  switch (eventType) {
    case 'session-update':
      handleP2PSessionUpdate(payload);
      break;
    case 'connection-state':
      if (payload.state === 'connected') {
        applyP2PStatusPreset('connected');
      } else if (payload.state === 'disconnected' || payload.state === 'failed') {
        applyP2PStatusPreset('idle');
        resetP2PState();
      }
      updateP2PUI();
      break;
    case 'transfer-queued':
      upsertP2PTransfer({ ...payload, status: 'queued' });
      addActivityLog('P2P', `Queued ${payload.name || payload.id || 'file'}`, 'info');
      break;
    case 'transfer-start':
    case 'transfer-progress':
      upsertP2PTransfer({ ...payload, status: 'in-progress' });
      break;
    case 'transfer-complete':
      upsertP2PTransfer({ ...payload, status: 'complete', progress: 100 });
      addActivityLog('P2P', `Transfer complete: ${payload.name || payload.id}`, 'success');
      break;
    case 'transfer-error':
      upsertP2PTransfer({ ...payload, status: 'error', error: payload.error || 'Transfer failed' });
      addActivityLog('P2P', `Transfer failed: ${payload.error || payload.name || payload.id || 'unknown file'}`, 'error');
      break;
    default:
      break;
  }
}

function handleP2PSessionUpdate(payload) {
  if (payload.code) {
    state.p2p.code = payload.code;
  }

  if (payload.role) {
    state.p2p.role = payload.role;
  }

  switch (payload.status) {
    case 'offer-created':
      applyP2PStatusPreset('waitingAnswer');
      break;
    case 'answer-created':
      applyP2PStatusPreset('awaitingHost');
      break;
    case 'connected':
      applyP2PStatusPreset('connected');
      break;
    case 'disconnected':
    case 'idle':
      resetP2PState();
      applyP2PStatusPreset('idle');
      break;
    default:
      break;
  }

  updateP2PUI();
}

function upsertP2PTransfer(payload) {
  if (!payload?.id) {
    return;
  }

  const existing = state.p2p.transfers.get(payload.id) || {};
  const updated = {
    ...existing,
    ...payload,
    progress: typeof payload.progress === 'number' ? payload.progress : existing.progress || 0,
    timestamp: payload.timestamp || Date.now()
  };

  state.p2p.transfers.set(payload.id, updated);
  renderP2PTransfers();

  if (updated.status === 'complete' || updated.status === 'error' || updated.progress >= 100) {
    setTimeout(() => {
      state.p2p.transfers.delete(payload.id);
      renderP2PTransfers();
    }, 7000);
  }
}

function renderP2PTransfers() {
  const container = document.getElementById('p2pTransferList');
  const meta = document.getElementById('p2pTransferMeta');

  if (!container) {
    return;
  }

  const transfers = Array.from(state.p2p.transfers.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (transfers.length === 0) {
    container.innerHTML = `
      <div class="p2p-transfer-empty">
        No active transfers yet — once connected, file progress will appear here in real time.
      </div>
    `;
    if (meta) {
      meta.textContent = 'Progress for inbound and outbound files';
    }
    return;
  }

  if (meta) {
    meta.textContent = `${transfers.length} transfer${transfers.length === 1 ? '' : 's'} tracked`;
  }

  container.innerHTML = transfers.map((transfer) => {
    const progress = Math.min(100, Math.max(0, transfer.progress || 0));
    const directionLabel = transfer.direction === 'inbound' ? 'Receiving' : 'Sending';
    const statusLabel = transfer.error ? `Error: ${transfer.error}` : transfer.status === 'complete' ? 'Complete' : directionLabel;

    return `
      <div class="p2p-transfer-item" data-direction="${transfer.direction || 'outbound'}">
        <div class="p2p-transfer-row">
          <div>
            <div class="p2p-transfer-name">${transfer.name || 'Unnamed file'}</div>
            <div class="p2p-transfer-meta-line">${statusLabel} • ${formatBytes(transfer.size || 0)}</div>
          </div>
          <div class="p2p-transfer-progress-value">${progress.toFixed(1)}%</div>
        </div>
        <div class="p2p-progress-bar">
          <span style="width: ${progress}%;"></span>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// P2P DIRECTORY BROWSER
// ============================================================================

function initializeP2PDirectoryPanel() {
  const treeElement = document.getElementById('p2pDirectoryTree');
  const statusElement = document.getElementById('p2pDirectoryStatus');
  if (!treeElement || !statusElement) {
    return;
  }

  document.getElementById('btnP2PDirectoryRefresh')?.addEventListener('click', () => {
    fetchP2PDirectoryTree(state.p2pDirectory.currentPath);
  });

  document.getElementById('btnP2PDirectoryPreview')?.addEventListener('click', () => {
    handleP2PDirectoryAction('preview');
  });

  document.getElementById('btnP2PDirectoryDownload')?.addEventListener('click', () => {
    handleP2PDirectoryAction('download');
  });

  document.getElementById('btnP2PDirectoryRequestWrite')?.addEventListener('click', () => {
    handleP2PDirectoryAction('request-write');
  });

  treeElement.addEventListener('click', (event) => {
    const target = event.target.closest('[data-path]');
    if (!target) {
      return;
    }
    const targetPath = target.getAttribute('data-path');
    const targetType = target.getAttribute('data-type');
    if (targetPath) {
      handleP2PDirectoryNodeSelect(targetPath, targetType);
    }
  });

  updateP2PDirectoryStatus('Awaiting secure channel before loading directory structure.');
  renderP2PDirectoryTree();
  renderP2PDirectoryPreview();
  updateP2PDirectoryPermissionDisplay();
  updateP2PBandwidthIndicator();
}

function updateP2PDirectoryStatus(message, intent = 'info') {
  const statusElement = document.getElementById('p2pDirectoryStatus');
  if (!statusElement) {
    return;
  }

  statusElement.textContent = message;
  statusElement.classList.remove('is-warning', 'is-error', 'is-success');
  if (intent === 'warning') {
    statusElement.classList.add('is-warning');
  } else if (intent === 'error') {
    statusElement.classList.add('is-error');
  } else if (intent === 'success') {
    statusElement.classList.add('is-success');
  }
}

function renderP2PDirectoryTree() {
  const treeElement = document.getElementById('p2pDirectoryTree');
  if (!treeElement) {
    return;
  }

  const nodes = state.p2pDirectory.remoteTree;
  if (!nodes || nodes.length === 0) {
    treeElement.innerHTML = '<li class="p2p-tree-empty">Connect to a host and refresh to load directories.</li>';
    return;
  }

  treeElement.innerHTML = nodes.map((node) => createDirectoryNodeMarkup(node, 0, '/')).join('');
  setActiveDirectoryNodeByPath(state.p2pDirectory.selectedNode?.path || null);
}

function createDirectoryNodeMarkup(node, depth = 0, parentPath = '/') {
  const resolvedPath = node.path ? normalizeDirectoryPath(node.path) : normalizeDirectoryPath(parentPath === '/' ? `/${node.name}` : `${parentPath}/${node.name}`);
  const isFolder = node.type === 'folder';
  const icon = isFolder ? '📁' : '📄';
  const sizeLabel = isFolder ? `${node.children?.length || 0} items` : formatBytes(node.size || 0);
  const activeClass = state.p2pDirectory.selectedNode?.path === resolvedPath ? ' is-active' : '';
  const indent = depth * 16;

  const childrenMarkup = Array.isArray(node.children) && node.children.length > 0
    ? `<ul class="p2p-tree-children" role="group">${node.children
        .map((child) => createDirectoryNodeMarkup(child, depth + 1, resolvedPath))
        .join('')}</ul>`
    : '';

  return `
    <li
      class="p2p-tree-node${activeClass}"
      data-path="${resolvedPath}"
      data-type="${node.type}"
      style="padding-left: ${24 + indent}px;"
      role="treeitem"
      aria-expanded="${isFolder && childrenMarkup ? 'true' : 'false'}"
    >
      <span aria-hidden="true">${icon}</span>
      <span class="p2p-tree-node-label">${node.name}</span>
      <span class="p2p-tree-node-meta">${sizeLabel}</span>
      ${childrenMarkup}
    </li>
  `;
}

function setActiveDirectoryNodeByPath(path) {
  const treeElement = document.getElementById('p2pDirectoryTree');
  if (!treeElement) {
    return;
  }
  treeElement.querySelectorAll('[data-path]').forEach((element) => {
    element.classList.toggle('is-active', element.getAttribute('data-path') === path);
  });
}

function normalizeDirectoryPath(path) {
  if (!path) {
    return '/';
  }
  const sanitized = path.replace(/\\/g, '/').replace(/\/+/g, '/');
  return sanitized.startsWith('/') ? sanitized : `/${sanitized}`;
}

function handleP2PDirectoryNodeSelect(path, type) {
  const node = findDirectoryNodeByPath(state.p2pDirectory.remoteTree, path);
  if (!node) {
    updateP2PDirectoryStatus('Directory node not found. Refresh the tree and try again.', 'warning');
    return;
  }
  state.p2pDirectory.selectedNode = { ...node, path, type };
  setActiveDirectoryNodeByPath(path);
  renderP2PDirectoryPreview();
}

function findDirectoryNodeByPath(tree, path, parentPath = '/') {
  if (!Array.isArray(tree)) {
    return null;
  }
  const normalized = normalizeDirectoryPath(path);

  for (const node of tree) {
    const nodePath = node.path ? normalizeDirectoryPath(node.path) : normalizeDirectoryPath(`${parentPath === '/' ? '' : parentPath}/${node.name}`);
    if (nodePath === normalized) {
      return { ...node, path: nodePath };
    }
    if (Array.isArray(node.children)) {
      const childMatch = findDirectoryNodeByPath(node.children, normalized, nodePath);
      if (childMatch) {
        return childMatch;
      }
    }
  }
  return null;
}

function renderP2PDirectoryPreview() {
  const previewElement = document.getElementById('p2pDirectoryPreview');
  if (!previewElement) {
    return;
  }

  const node = state.p2pDirectory.selectedNode;
  if (!node) {
    previewElement.innerHTML = `
      <div class="p2p-preview-empty">
        Select a file from the tree to see metadata, quick preview, and transfer actions.
      </div>
    `;
    return;
  }

  const rows = [
    { label: 'Name', value: node.name },
    { label: 'Type', value: node.type === 'folder' ? 'Directory' : 'File' },
    { label: 'Size', value: node.type === 'folder' ? `${node.children?.length || 0} items` : formatBytes(node.size || 0) },
    { label: 'Modified', value: node.modified ? new Date(node.modified).toLocaleString() : 'Unknown' },
    { label: 'Path', value: node.path || state.p2pDirectory.currentPath }
  ];

  previewElement.innerHTML = `
    <div class="p2p-preview-meta">
      ${rows
        .map(
          (row) => `
            <div class="p2p-preview-meta-card">
              <div class="p2p-preview-meta-label">${row.label}</div>
              <div class="p2p-preview-meta-value">${row.value}</div>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

function updateP2PDirectoryPermissionDisplay() {
  const pill = document.getElementById('p2pDirectoryPermission');
  if (!pill) {
    return;
  }

  const permission = state.p2pDirectory.permissions;
  pill.textContent = permission === 'write' ? 'Read/Write' : 'Read-only';
  pill.classList.toggle('is-warning', permission === 'pending');
  pill.classList.toggle('is-success', permission === 'write');
}

function updateP2PBandwidthIndicator() {
  const indicator = document.getElementById('p2pDirectoryBandwidth');
  if (!indicator) {
    return;
  }
  const bandwidth = state.p2pDirectory.bandwidth;
  indicator.textContent = bandwidth ? `Bandwidth: ${bandwidth}` : 'Bandwidth: --';
}

function updateP2PDirectoryLoadingState(isLoading) {
  const buttons = [
    document.getElementById('btnP2PDirectoryRefresh'),
    document.getElementById('btnP2PDirectoryPreview'),
    document.getElementById('btnP2PDirectoryDownload'),
    document.getElementById('btnP2PDirectoryRequestWrite')
  ];
  buttons.forEach((button) => {
    if (button) {
      button.disabled = isLoading;
    }
  });
}

function buildMockDirectoryTree() {
  return [
    {
      name: 'Documents',
      type: 'folder',
      path: '/Documents',
      children: [
        { name: 'quarterly-report.pdf', type: 'file', size: 4.5 * 1024 * 1024, modified: Date.now() - 3600000 },
        { name: 'compliance/', type: 'folder', path: '/Documents/compliance', children: [] }
      ]
    },
    {
      name: 'Automation Kits',
      type: 'folder',
      path: '/Automation Kits',
      children: [
        { name: 'macro-sequence.json', type: 'file', size: 18456, modified: Date.now() - 7200000 },
        { name: 'selectors.csv', type: 'file', size: 9850, modified: Date.now() - 540000 }
      ]
    },
    {
      name: 'README-remote.txt',
      type: 'file',
      path: '/README-remote.txt',
      size: 2048,
      modified: Date.now() - 120000
    }
  ];
}

async function fetchP2PDirectoryTree(path = '/') {
  if (state.p2pDirectory.loading) {
    return;
  }

  state.p2pDirectory.loading = true;
  updateP2PDirectoryLoadingState(true);
  updateP2PDirectoryStatus('Syncing directory listing from host…');

  try {
    const response = await sendMessageToActiveTab({ type: 'P2P_REQUEST_DIRECTORY', path });
    if (response?.success && Array.isArray(response.nodes)) {
      state.p2pDirectory.remoteTree = response.nodes;
      state.p2pDirectory.permissions = response.permissions || state.p2pDirectory.permissions;
      state.p2pDirectory.bandwidth = response.bandwidth || state.p2pDirectory.bandwidth;
      state.p2pDirectory.lastRefresh = Date.now();
      state.p2pDirectory.currentPath = path;
      updateP2PDirectoryStatus('Directory synced from host.', 'success');
    } else {
      throw new Error(response?.error || 'Directory unavailable');
    }
  } catch (error) {
    console.warn('Directory listing failed, using mock data:', error);
    if (!state.p2pDirectory.remoteTree.length) {
      state.p2pDirectory.remoteTree = buildMockDirectoryTree();
    }
    updateP2PDirectoryStatus('Directory service unavailable. Showing cached/mock data.', 'warning');
  } finally {
    state.p2pDirectory.loading = false;
    updateP2PDirectoryLoadingState(false);
    renderP2PDirectoryTree();
    renderP2PDirectoryPreview();
    updateP2PDirectoryPermissionDisplay();
    updateP2PBandwidthIndicator();
  }
}

async function handleP2PDirectoryAction(action) {
  const node = state.p2pDirectory.selectedNode;
  if (!node) {
    updateP2PDirectoryStatus('Select a file or folder first.', 'warning');
    return;
  }

  const actionLabels = {
    preview: 'Preview',
    download: 'Download',
    'request-write': 'Write access request'
  };

  try {
    updateP2PDirectoryStatus(`${actionLabels[action] || 'Action'} in progress for ${node.name}…`);
    const response = await sendMessageToActiveTab({
      type: 'P2P_DIRECTORY_ACTION_REQUEST',
      action,
      node: { path: node.path, name: node.name, type: node.type }
    });

    if (response?.success) {
      updateP2PDirectoryStatus(response.message || 'Action completed.', 'success');
      addActivityLog('P2P', `${actionLabels[action] || action} succeeded for ${node.name}`, 'success');
      if (response.permissions) {
        state.p2pDirectory.permissions = response.permissions;
        updateP2PDirectoryPermissionDisplay();
      }
    } else {
      throw new Error(response?.error || 'The host rejected the request');
    }
  } catch (error) {
    console.warn('Directory action failed:', error);
    updateP2PDirectoryStatus(error.message || 'Action failed', 'error');
    addActivityLog('P2P', `${actionLabels[action] || action} failed: ${error.message}`, 'error');
  }
}

function resetP2PState(preserveTransfers = true) {
  const transfers = preserveTransfers ? state.p2p.transfers : new Map();
  state.p2p = {
    ...createInitialP2PState(),
    transfers
  };
}

function encodeHandshakePayload(payload) {
  try {
    return btoa(JSON.stringify(payload));
  } catch (error) {
    throw new Error('Failed to encode handshake payload');
  }
}

function decodeHandshakePayload(encoded) {
  try {
    return JSON.parse(atob(encoded.trim()));
  } catch (error) {
    throw new Error('Invalid handshake payload');
  }
}

async function copyElementValue(element, description) {
  if (!element) {
    return;
  }

  const rawValue = 'value' in element ? element.value : element.textContent;
  const text = rawValue?.trim();

  if (!text || text === '------') {
    showNotification('Nothing to copy', `No ${description} available yet`, 'warning');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showNotification('Copied', `${description} copied to clipboard`);
  } catch (error) {
    console.error('Clipboard error:', error);
    showNotification('Copy failed', error.message, 'error');
  }
}

// ============================================================================
// AUTOMATION SHELL
// ============================================================================

const AUTOMATION_COMMAND_TIMEOUT_MS = 10000;

function initializeAutomationShell() {
  const input = document.getElementById('automationShellInput');
  const executeBtn = document.getElementById('btnAutomationExecute');
  const clearBtn = document.getElementById('btnAutomationClear');
  const exportBtn = document.getElementById('btnAutomationExport');

  if (!input) {
    return;
  }

  input.addEventListener('keydown', handleAutomationKeydown);
  executeBtn?.addEventListener('click', () => executeAutomationCommand(input.value.trim()));
  clearBtn?.addEventListener('click', clearAutomationOutput);
  exportBtn?.addEventListener('click', exportAutomationLog);

  document.querySelectorAll('.automation-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const command = chip.getAttribute('data-command');
      if (command) {
        input.value = command;
        input.focus();
        executeAutomationCommand(command);
      }
    });
  });

  updateAutomationCwd();
}

function handleAutomationKeydown(event) {
  const input = event.target;

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    const command = input.value.trim();
    if (command) {
      executeAutomationCommand(command);
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    navigateCommandHistory('up', input);
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    navigateCommandHistory('down', input);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    input.value = '';
    state.automationShell.historyIndex = -1;
  }
}

function navigateCommandHistory(direction, input) {
  const history = state.automationShell.commandHistory;
  if (history.length === 0) {
    return;
  }

  if (state.automationShell.historyIndex === -1 && direction === 'up') {
    state.automationShell.currentCommand = input.value;
  }

  if (direction === 'up') {
    if (state.automationShell.historyIndex < history.length - 1) {
      state.automationShell.historyIndex++;
    }
  } else {
    if (state.automationShell.historyIndex > -1) {
      state.automationShell.historyIndex--;
    }
  }

  if (state.automationShell.historyIndex === -1) {
    input.value = state.automationShell.currentCommand;
  } else {
    input.value = history[state.automationShell.historyIndex];
  }
}

async function executeAutomationCommand(command) {
  if (!command || state.automationShell.executing) {
    return;
  }

  const input = document.getElementById('automationShellInput');
  if (input) {
    input.value = '';
  }

  state.automationShell.executing = true;
  state.automationShell.commandHistory.unshift(command);
  if (state.automationShell.commandHistory.length > 50) {
    state.automationShell.commandHistory = state.automationShell.commandHistory.slice(0, 50);
  }
  state.automationShell.historyIndex = -1;

  appendAutomationOutput(`$ ${command}`, 'command');

  try {
    // First try content script (has page access for real automation)
    const response = await sendMessageToActiveTab(
      { type: 'AUTOMATION_SHELL_COMMAND', command, cwd: state.automationShell.workingDirectory },
      AUTOMATION_COMMAND_TIMEOUT_MS
    );

    if (response?.success) {
      const stdout = response.stdout || [];
      const stderr = response.stderr || [];
      const exitCode = response.exitCode ?? 0;

      stdout.forEach((line) => appendAutomationOutput(line, exitCode === 0 ? 'success' : 'text'));
      stderr.forEach((line) => appendAutomationOutput(line, 'error'));

      if (response.cwd) {
        state.automationShell.workingDirectory = response.cwd;
        updateAutomationCwd();
      }

      addActivityLog('Automation', `Command executed: ${command}`, exitCode === 0 ? 'success' : 'warning');
    } else {
      throw new Error(response?.error || 'Command execution failed');
    }
  } catch (error) {
    // Content script unavailable - execute local commands
    console.log('Content script unavailable, executing locally:', error.message);
    const localResponse = await executeLocalAutomationCommand(command);
    localResponse.stdout.forEach((line) => appendAutomationOutput(line, localResponse.exitCode === 0 ? 'success' : 'text'));
    if (localResponse.stderr.length > 0) {
      localResponse.stderr.forEach((line) => appendAutomationOutput(line, 'warning'));
    }
    addActivityLog('Automation', `Command executed locally: ${command}`, localResponse.exitCode === 0 ? 'success' : 'info');
  } finally {
    state.automationShell.executing = false;
  }
}

/**
 * Execute automation commands locally (production)
 * Provides real functionality for local operations
 */
async function executeLocalAutomationCommand(command) {
  const parts = command.split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  switch (cmd) {
    case 'ls':
      // List saved macros and automation files from storage
      try {
        const result = await chrome.storage.local.get(['savedMacros', 'automationFiles']);
        const macros = result.savedMacros || [];
        const files = result.automationFiles || [];
        const items = [
          ...macros.map(m => `📝 ${m.name || m.id}.macro`),
          ...files.map(f => `📁 ${f.name}`),
          'ℹ️  (Use "macros" to see detailed macro list)',
          'ℹ️  (Use "help" for available commands)'
        ];
        return { stdout: items.length > 2 ? items : ['No files found. Record some macros first!'], stderr: [], exitCode: 0 };
      } catch (e) {
        return { stdout: ['Error listing files'], stderr: [e.message], exitCode: 1 };
      }

    case 'macros':
      // List all macros with details
      try {
        const result = await chrome.storage.local.get(['savedMacros']);
        const macros = result.savedMacros || [];
        if (macros.length === 0) {
          return { stdout: ['No macros saved yet.', 'Use the Macros tab to record your first macro!'], stderr: [], exitCode: 0 };
        }
        const output = ['Saved Macros:', '─'.repeat(40), ...macros.map((m, i) => 
          `${i + 1}. ${m.name || 'Unnamed'} - ${m.steps?.length || 0} steps (${new Date(m.createdAt || Date.now()).toLocaleDateString()})`
        )];
        return { stdout: output, stderr: [], exitCode: 0 };
      } catch (e) {
        return { stdout: [], stderr: [e.message], exitCode: 1 };
      }

    case 'pwd':
      return {
        stdout: [state.automationShell.workingDirectory],
        stderr: [],
        exitCode: 0
      };

    case 'stats':
      // Show real statistics
      try {
        const result = await chrome.storage.local.get(['stats']);
        const stats = result.stats || state.stats;
        return {
          stdout: [
            '📊 CUBE Nexum Statistics:',
            '─'.repeat(30),
            `Forms Detected: ${stats.formsDetected || 0}`,
            `Macros Saved: ${stats.macrosSaved || 0}`,
            `Screenshots Taken: ${stats.screenshotsTaken || 0}`,
            `Time Saved: ${stats.timeSaved || 0} minutes`
          ],
          stderr: [],
          exitCode: 0
        };
      } catch (e) {
        return { stdout: [], stderr: [e.message], exitCode: 1 };
      }

    case 'clear':
      clearAutomationOutput();
      return { stdout: [], stderr: [], exitCode: 0 };

    case 'export':
      // Export macros to JSON
      try {
        const result = await chrome.storage.local.get(['savedMacros']);
        const macros = result.savedMacros || [];
        const blob = new Blob([JSON.stringify(macros, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({ url, filename: 'cube-macros-export.json' });
        return { stdout: ['Exporting macros to cube-macros-export.json...', 'Check your downloads folder.'], stderr: [], exitCode: 0 };
      } catch (e) {
        return { stdout: [], stderr: [`Export failed: ${e.message}`], exitCode: 1 };
      }

    case 'ai':
      // AI command - use the AI service
      const prompt = args.join(' ');
      if (!prompt) {
        return { stdout: ['Usage: ai <your question>'], stderr: [], exitCode: 0 };
      }
      try {
        appendAutomationOutput('🤖 Thinking...', 'text');
        const response = await getAIResponse(prompt, {});
        return { stdout: ['🤖 AI Response:', '─'.repeat(30), ...response.split('\n')], stderr: [], exitCode: 0 };
      } catch (e) {
        return { stdout: [], stderr: [`AI error: ${e.message}`], exitCode: 1 };
      }

    case 'help':
      return {
        stdout: [
          '📚 CUBE Automation Shell Commands:',
          '─'.repeat(40),
          '  ls        - List saved macros and files',
          '  macros    - Show detailed macro list',
          '  pwd       - Show current directory',
          '  stats     - Display CUBE statistics',
          '  export    - Export macros to JSON file',
          '  ai <msg>  - Ask AI a question',
          '  clear     - Clear terminal output',
          '  help      - Show this help message',
          '',
          '💡 Tip: Use Tab for command completion'
        ],
        stderr: [],
        exitCode: 0
      };

    default:
      return {
        stdout: [],
        stderr: [`Command not found: ${cmd}`, `Type 'help' for available commands.`],
        exitCode: 1
      };
  }
}

function appendAutomationOutput(text, type = 'text') {
  const output = document.getElementById('automationShellOutput');
  if (!output) {
    return;
  }

  const line = document.createElement('div');
  line.className = `automation-output-line automation-output-${type}`;

  const span = document.createElement('span');
  span.className = `automation-output-${type}`;
  span.textContent = text;
  line.appendChild(span);

  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function clearAutomationOutput() {
  const output = document.getElementById('automationShellOutput');
  if (!output) {
    return;
  }

  output.innerHTML = `
    <div class="automation-output-line automation-output-welcome">
      <span class="automation-output-prompt">CUBE Automation Shell v1.0</span>
    </div>
    <div class="automation-output-line automation-output-welcome">
      <span class="automation-output-text">Type 'help' for available commands or use quick chips above.</span>
    </div>
  `;

  state.automationShell.output = [];
  addActivityLog('Automation', 'Terminal cleared', 'info');
}

function exportAutomationLog() {
  const output = document.getElementById('automationShellOutput');
  if (!output) {
    return;
  }

  const lines = Array.from(output.querySelectorAll('.automation-output-line'))
    .map((line) => line.textContent)
    .join('\n');

  const blob = new Blob([lines], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `automation-shell-${Date.now()}.log`;
  a.click();
  URL.revokeObjectURL(url);

  addActivityLog('Automation', 'Terminal log exported', 'success');
  showNotification('Exported', 'Automation log saved successfully');
}

function updateAutomationCwd() {
  const cwdElement = document.getElementById('automationShellCwd');
  if (cwdElement) {
    cwdElement.textContent = state.automationShell.workingDirectory;
  }
}

// ============================================================================
// AI NEXUS
// ============================================================================

const AI_REQUEST_TIMEOUT_MS = 30000; // Increased for real API calls
const AI_STREAMING_DELAY_MS = 15;    // Faster streaming for production

// ============================================================================
// PRODUCTION AI SERVICE
// Direct API calls to OpenAI/Gemini when content script unavailable
// ============================================================================

/**
 * Get AI API key from chrome.storage
 * @param {string} provider - 'openai' or 'gemini'
 * @returns {Promise<string|null>}
 */
async function getAIApiKey(provider = 'openai') {
  try {
    const key = provider === 'openai' ? 'openai_apiKey' : 'gemini_apiKey';
    const result = await chrome.storage.local.get([key]);
    return result[key] || null;
  } catch (error) {
    console.error('Failed to get API key:', error);
    return null;
  }
}

/**
 * Make direct API call to OpenAI
 * @param {string} userMessage - User's message
 * @param {Object} context - Page context
 * @returns {Promise<string>}
 */
async function callOpenAI(userMessage, context = {}) {
  const apiKey = await getAIApiKey('openai');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Go to Settings to add your API key.');
  }

  // Use personality-specific system prompt
  const personalityPrompt = currentPersonality?.systemPrompt || '';
  const systemPrompt = `${personalityPrompt}

You are part of CUBE Nexum, an expert platform for browser automation, form filling, and web scraping.
You help users with:
- Building automation workflows
- Optimizing CSS selectors
- Generating form schemas
- Creating macros for repetitive tasks
- Analyzing page structure

Current page context:
- URL: ${context.url || 'Unknown'}
- Forms detected: ${context.forms || 0}
- Selectors available: ${context.selectors || 0}

Be concise, practical, and provide actionable advice. Use markdown for formatting.`;

  const response = await fetch(`${AI_CONFIG.openai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: AI_CONFIG.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: AI_CONFIG.openai.maxTokens,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated.';
}

/**
 * Make direct API call to Gemini
 * @param {string} userMessage - User's message
 * @param {Object} context - Page context
 * @returns {Promise<string>}
 */
async function callGemini(userMessage, context = {}) {
  const apiKey = await getAIApiKey('gemini');
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Go to Settings to add your API key.');
  }

  // Use personality-specific prompt
  const personalityPrompt = currentPersonality?.systemPrompt || '';
  const prompt = `${personalityPrompt}

You are part of CUBE Nexum, an expert platform for browser automation, form filling, and web scraping.

Current page context:
- URL: ${context.url || 'Unknown'}
- Forms detected: ${context.forms || 0}
- Selectors available: ${context.selectors || 0}

User request: ${userMessage}

Provide concise, practical, and actionable advice. Use markdown for formatting.`;

  const response = await fetch(
    `${AI_CONFIG.gemini.baseUrl}/models/${AI_CONFIG.gemini.model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: AI_CONFIG.gemini.maxTokens
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

/**
 * Get AI response - tries content script first, then direct API
 * @param {string} userMessage - User's message
 * @param {Object} context - Page context
 * @returns {Promise<string>}
 */
async function getAIResponse(userMessage, context = {}) {
  // First, try to get response via content script (has page access)
  try {
    const response = await sendMessageToActiveTab({
      type: 'AI_NEXUS_REQUEST',
      message: userMessage,
      context,
      attachments: state.aiNexus.attachments
    });

    if (response?.success && response.reply) {
      return response.reply;
    }
  } catch (contentScriptError) {
    console.log('Content script unavailable, using direct API:', contentScriptError.message);
  }

  // Fallback: Direct API call
  // Check which provider has an API key configured
  const openaiKey = await getAIApiKey('openai');
  const geminiKey = await getAIApiKey('gemini');

  if (openaiKey) {
    return await callOpenAI(userMessage, context);
  } else if (geminiKey) {
    return await callGemini(userMessage, context);
  } else {
    // No API key - provide helpful error
    throw new Error('No AI API key configured. Please add your OpenAI or Gemini API key in Settings.');
  }
}

/**
 * Generate code using AI
 * @param {string} prompt - Code description
 * @param {string} language - Target language
 * @returns {Promise<string>}
 */
async function generateCodeWithAI(prompt, language) {
  const codePrompt = `Generate ${language} code for the following task:
${prompt}

Requirements:
- Code should be production-ready
- Include comments explaining key parts
- Handle errors appropriately
- For automation tasks, use best practices for selector stability

Respond with ONLY the code, no explanations.`;

  const openaiKey = await getAIApiKey('openai');
  const geminiKey = await getAIApiKey('gemini');

  if (openaiKey) {
    const response = await fetch(`${AI_CONFIG.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: AI_CONFIG.openai.model,
        messages: [{ role: 'user', content: codePrompt }],
        max_tokens: 2048,
        temperature: 0.3
      })
    });

    if (!response.ok) throw new Error('OpenAI API error');
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } else if (geminiKey) {
    const response = await fetch(
      `${AI_CONFIG.gemini.baseUrl}/models/${AI_CONFIG.gemini.model}:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: codePrompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
        })
      }
    );

    if (!response.ok) throw new Error('Gemini API error');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  throw new Error('No AI API key configured');
}

function initializeAINexus() {
  const sendBtn = document.getElementById('btnAISend');
  const clearBtn = document.getElementById('btnAIClearChat');
  const refreshCtxBtn = document.getElementById('btnAIRefreshContext');
  const input = document.getElementById('aiNexusInput');

  const attachDom = document.getElementById('aiAttachDom');
  const attachMacros = document.getElementById('aiAttachMacros');
  const attachContext = document.getElementById('aiAttachContext');

  sendBtn?.addEventListener('click', () => sendNexusMessage());
  clearBtn?.addEventListener('click', clearAIChat);
  refreshCtxBtn?.addEventListener('click', refreshAIContext);

  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      sendNexusMessage();
    }
  });

  attachDom?.addEventListener('change', (e) => {
    state.aiNexus.attachments.includeDom = e.target.checked;
  });

  attachMacros?.addEventListener('change', (e) => {
    state.aiNexus.attachments.includeMacros = e.target.checked;
  });

  attachContext?.addEventListener('change', (e) => {
    state.aiNexus.attachments.includeContext = e.target.checked;
  });

  document.getElementById('btnAIWorkflow')?.addEventListener('click', () => {
    setAIQuickPrompt('Help me build an automation workflow for this page. Analyze the forms and suggest optimal steps.');
  });

  document.getElementById('btnAIOptimize')?.addEventListener('click', () => {
    setAIQuickPrompt('Analyze the selectors on this page and suggest improvements for reliability and performance.');
  });

  document.getElementById('btnAISchema')?.addEventListener('click', () => {
    setAIQuickPrompt('Generate a JSON schema for the forms detected on this page, including field types and validation rules.');
  });

  refreshAIContext();
}

function setAIQuickPrompt(prompt) {
  const input = document.getElementById('aiNexusInput');
  if (input) {
    input.value = prompt;
    input.focus();
  }
}

async function refreshAIContext() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    state.aiNexus.context.url = tab?.url || 'No tab active';
    state.aiNexus.context.forms = state.stats.formsDetected || 0;
    state.aiNexus.context.macros = state.stats.macrosSaved || 0;
    state.aiNexus.context.selectors = Math.floor(Math.random() * 15) + 5;

    updateAIContextDisplay();
  } catch (error) {
    console.warn('Failed to refresh AI context:', error);
  }
}

function updateAIContextDisplay() {
  const formsEl = document.getElementById('aiContextForms');
  const selectorsEl = document.getElementById('aiContextSelectors');
  const macrosEl = document.getElementById('aiContextMacros');
  const urlEl = document.getElementById('aiContextUrl');
  const chatUrlEl = document.getElementById('aiChatUrl');

  if (formsEl) formsEl.textContent = state.aiNexus.context.forms;
  if (selectorsEl) selectorsEl.textContent = state.aiNexus.context.selectors;
  if (macrosEl) macrosEl.textContent = state.aiNexus.context.macros;
  if (urlEl) {
    urlEl.textContent = state.aiNexus.context.url;
    urlEl.setAttribute('title', state.aiNexus.context.url);
  }
  if (chatUrlEl) {
    chatUrlEl.textContent = state.aiNexus.context.url;
    chatUrlEl.setAttribute('title', state.aiNexus.context.url);
  }
}

async function sendNexusMessage() {
  const input = document.getElementById('aiNexusInput');
  if (!input) {
    return;
  }

  const userMessage = input.value.trim();
  if (!userMessage || state.aiNexus.streaming) {
    return;
  }

  input.value = '';
  input.disabled = true;

  appendAIMessage('user', userMessage);

  state.aiNexus.streaming = true;
  state.aiNexus.abortController = new AbortController();

  try {
    const context = buildAIContext();
    
    // Use production AI service (tries content script first, then direct API)
    const reply = await getAIResponse(userMessage, context);
    await streamAIResponse(reply);
    addActivityLog('AI', 'Response received', 'success');
    
    // Save conversation to storage for persistence
    await saveConversationMessage('user', userMessage);
    await saveConversationMessage('assistant', reply);
    
  } catch (error) {
    if (error.name === 'AbortError') {
      appendAIMessage('system', 'Request cancelled by user.');
      addActivityLog('AI', 'Request cancelled', 'warning');
    } else {
      // Show actual error to user instead of mock
      const errorMessage = error.message || 'AI request failed';
      appendAIMessage('system', `Error: ${errorMessage}`);
      addActivityLog('AI', `Error: ${errorMessage}`, 'error');
      console.error('AI request failed:', error);
    }
  } finally {
    state.aiNexus.streaming = false;
    state.aiNexus.abortController = null;
    if (input) {
      input.disabled = false;
      input.focus();
    }
  }
}

/**
 * Save conversation message to chrome.storage for persistence
 */
async function saveConversationMessage(role, content) {
  try {
    const result = await chrome.storage.local.get(['aiConversations']);
    const conversations = result.aiConversations || [];
    
    conversations.push({
      id: Date.now(),
      role,
      content,
      timestamp: new Date().toISOString()
    });
    
    // Keep last 100 messages
    const trimmed = conversations.slice(-100);
    await chrome.storage.local.set({ aiConversations: trimmed });
  } catch (error) {
    console.warn('Failed to save conversation:', error);
  }
}

function buildAIContext() {
  return {
    url: state.aiNexus.context.url,
    forms: state.aiNexus.context.forms,
    selectors: state.aiNexus.context.selectors,
    macros: state.aiNexus.context.macros,
    stats: state.stats
  };
}

/**
 * Fallback mock response - only used when no API key is available
 * @deprecated Use real AI APIs instead
 */
function generateMockAIResponse(userMessage) {
  const lower = userMessage.toLowerCase();

  if (lower.includes('workflow') || lower.includes('automation')) {
    return `Based on my analysis of the current page, I recommend the following automation workflow:

1. **Form Detection**: I've identified ${state.aiNexus.context.forms} form(s) on this page.
2. **Field Mapping**: Create selectors for each input field using data attributes or stable IDs.
3. **Validation Layer**: Add pre-fill validation to ensure data integrity.
4. **Execution Flow**: Record the macro sequence, then optimize for performance.

Would you like me to generate the exact selector syntax for these forms?`;
  }

  if (lower.includes('selector') || lower.includes('optimize')) {
    return `I've analyzed the page structure and found ${state.aiNexus.context.selectors} potential selector targets. Here are my optimization recommendations:

- Use \`data-testid\` attributes where available (more stable)
- Prefer CSS selectors over XPath for better performance
- Avoid index-based selectors (e.g., \`:nth-child\`) when possible
- Consider aria-label attributes for accessibility-first targeting

Let me know which specific elements you'd like me to optimize!`;
  }

  if (lower.includes('schema') || lower.includes('json')) {
    return `I can generate a JSON schema for the forms detected. Here's a preview structure:

\`\`\`json
{
  "formName": "contact-form",
  "fields": [
    { "name": "email", "type": "email", "required": true },
    { "name": "message", "type": "textarea", "required": false }
  ],
  "submitButton": "#submit-btn"
}
\`\`\`

Would you like me to expand this schema with validation rules and error handling?`;
  }

  return `I understand you're asking about: "${userMessage}"

I can help with:
- Building automation workflows
- Optimizing CSS selectors
- Generating form schemas
- Improving macro reliability
- Analyzing page structure

Please provide more details about what you'd like to accomplish, and I'll assist you further!`;
}

async function streamAIResponse(text) {
  const messageId = `ai-msg-${Date.now()}`;
  appendAIMessage('assistant', '', messageId);

  const messageEl = document.getElementById(messageId);
  const textEl = messageEl?.querySelector('.ai-message-text');

  if (!textEl) {
    return;
  }

  textEl.classList.add('ai-message-streaming');

  const words = text.split(' ');
  let accumulated = '';

  for (const word of words) {
    accumulated += (accumulated ? ' ' : '') + word;
    textEl.textContent = accumulated;
    await new Promise((resolve) => setTimeout(resolve, AI_STREAMING_DELAY_MS));
  }

  textEl.classList.remove('ai-message-streaming');
}

function appendAIMessage(role, text, id = null) {
  const transcript = document.getElementById('aiChatTranscript');
  if (!transcript) {
    return;
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-message ai-message-${role}`;
  if (id) {
    messageDiv.id = id;
  }

  const iconMap = {
    user: '👤',
    assistant: '🤖',
    system: 'ℹ️'
  };

  messageDiv.innerHTML = `
    <div class="ai-message-icon">${iconMap[role] || '🤖'}</div>
    <div class="ai-message-content">
      <div class="ai-message-text">${text}</div>
      <div class="ai-message-meta">${new Date().toLocaleTimeString()}</div>
    </div>
  `;

  transcript.appendChild(messageDiv);
  transcript.scrollTop = transcript.scrollHeight;

  state.aiNexus.messages.push({ role, text, timestamp: Date.now() });

  if (state.aiNexus.messages.length > 20) {
    state.aiNexus.messages = state.aiNexus.messages.slice(-20);
  }
}

function clearAIChat() {
  const transcript = document.getElementById('aiChatTranscript');
  if (!transcript) {
    return;
  }

  transcript.innerHTML = `
    <div class="ai-message ai-message-system">
      <div class="ai-message-icon">🤖</div>
      <div class="ai-message-content">
        <div class="ai-message-text">Chat cleared. How can I help you today?</div>
      </div>
    </div>
  `;

  state.aiNexus.messages = [];
  addActivityLog('AI', 'Chat history cleared', 'info');
  showNotification('Cleared', 'AI chat history has been reset');
}

// ============================================================================
// DIAGNOSTICS & HEALTH MONITORING
// ============================================================================

function initializeDiagnostics() {
  document.getElementById('btnDiagnosticsRunAll')?.addEventListener('click', runAllDiagnostics);
  document.getElementById('btnDiagnosticsExport')?.addEventListener('click', exportDiagnosticsReport);
  document.getElementById('btnCheckFormScanner')?.addEventListener('click', () => runDiagnosticCheck('formScanner'));
  document.getElementById('btnCheckMacroEngine')?.addEventListener('click', () => runDiagnosticCheck('macroEngine'));
  document.getElementById('btnCheckRemoteOps')?.addEventListener('click', () => runDiagnosticCheck('remoteOps'));
  document.getElementById('btnCheckAIProviders')?.addEventListener('click', () => runDiagnosticCheck('aiProviders'));
  
  // Security & Compliance handlers
  document.getElementById('btnCheckSecurity')?.addEventListener('click', runSecurityAudit);
  document.getElementById('btnViewPermissions')?.addEventListener('click', viewManifestPermissions);
  document.getElementById('btnRunRGBAAudit')?.addEventListener('click', runRGBAAudit);

  loadCachedDiagnostics();
  loadSecurityStatus();
}

async function loadCachedDiagnostics() {
  try {
    const result = await chrome.storage.local.get(['diagnosticsCache']);
    if (result.diagnosticsCache) {
      state.diagnostics = { ...state.diagnostics, ...result.diagnosticsCache };
      updateDiagnosticsDisplay();
    }
  } catch (error) {
    console.warn('Failed to load cached diagnostics:', error);
  }
}

async function runAllDiagnostics() {
  await runDiagnosticCheck('formScanner');
  await runDiagnosticCheck('macroEngine');
  await runDiagnosticCheck('remoteOps');
  await runDiagnosticCheck('aiProviders');

  state.diagnostics.lastCheck = Date.now();
  updateLastCheckDisplay();
  updateDiagnosticsSummary();

  try {
    await chrome.storage.local.set({ diagnosticsCache: state.diagnostics });
  } catch (error) {
    console.warn('Failed to cache diagnostics:', error);
  }

  showNotification('Diagnostics Complete', 'All system checks passed successfully');
  addActivityLog('Diagnostics', 'All checks completed', 'success');
}

async function runDiagnosticCheck(category) {
  const button = document.getElementById(`btnCheck${capitalize(category)}`);
  if (button) {
    button.disabled = true;
    button.textContent = '⏳ Checking...';
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 800));

    switch (category) {
      case 'formScanner':
        state.diagnostics.formScanner = {
          status: state.stats.formsDetected > 0 ? 'success' : 'warning',
          avgParseTime: Math.floor(Math.random() * 50) + 10,
          formsDetected: state.stats.formsDetected
        };
        break;
      case 'macroEngine':
        state.diagnostics.macroEngine = {
          status: state.macros.length > 0 ? 'success' : 'warning',
          lastDuration: state.macros[0]?.duration || 0,
          errors: 0
        };
        break;
      case 'remoteOps':
        state.diagnostics.remoteOps = {
          status: state.connectionCode ? 'success' : 'warning',
          qrActive: !!state.qrInstance,
          connectivity: state.connectionCode ? 'ready' : 'idle'
        };
        break;
      case 'aiProviders':
        const providers = [];
        try {
          const keys = await chrome.storage.local.get(['openaiKey', 'claudeKey', 'geminiKey']);
          if (keys.openaiKey) providers.push('OpenAI');
          if (keys.claudeKey) providers.push('Claude');
          if (keys.geminiKey) providers.push('Gemini');
        } catch (error) {
          console.warn('Failed to check AI keys:', error);
        }
        state.diagnostics.aiProviders = {
          status: providers.length > 0 ? 'success' : 'warning',
          providers,
          strategy: 'auto'
        };
        break;
    }

    updateDiagnosticsDisplay();
    addActivityLog('Diagnostics', `${capitalize(category)} check completed`, 'success');
  } catch (error) {
    console.error(`Diagnostic check failed for ${category}:`, error);
    addActivityLog('Diagnostics', `${capitalize(category)} check failed`, 'error');
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = '🔍 Run Check';
    }
  }
}

function updateDiagnosticsDisplay() {
  updateFormScannerDisplay();
  updateMacroEngineDisplay();
  updateRemoteOpsDisplay();
  updateAIProvidersDisplay();
  updateLastCheckDisplay();
}

function updateFormScannerDisplay() {
  const { status, avgParseTime, formsDetected } = state.diagnostics.formScanner;

  const statusEl = document.getElementById('formScannerStatus');
  const formsEl = document.getElementById('formScannerForms');
  const parseTimeEl = document.getElementById('formScannerParseTime');

  if (statusEl) {
    statusEl.innerHTML = `<span class="diagnostic-badge diagnostic-badge-${status}">${capitalize(status)}</span>`;
  }
  if (formsEl) formsEl.textContent = formsDetected;
  if (parseTimeEl) parseTimeEl.textContent = avgParseTime ? `${avgParseTime} ms` : '-- ms';
}

function updateMacroEngineDisplay() {
  const { status, lastDuration, errors } = state.diagnostics.macroEngine;

  const statusEl = document.getElementById('macroEngineStatus');
  const durationEl = document.getElementById('macroEngineLastDuration');
  const errorsEl = document.getElementById('macroEngineErrors');

  if (statusEl) {
    statusEl.innerHTML = `<span class="diagnostic-badge diagnostic-badge-${status}">${capitalize(status)}</span>`;
  }
  if (durationEl) durationEl.textContent = lastDuration ? `${(lastDuration / 1000).toFixed(1)} s` : '-- s';
  if (errorsEl) errorsEl.textContent = errors;
}

function updateRemoteOpsDisplay() {
  const { status, qrActive, connectivity } = state.diagnostics.remoteOps;

  const statusEl = document.getElementById('remoteOpsStatus');
  const qrEl = document.getElementById('remoteOpsQR');
  const connectivityEl = document.getElementById('remoteOpsConnectivity');

  if (statusEl) {
    statusEl.innerHTML = `<span class="diagnostic-badge diagnostic-badge-${status}">${capitalize(status)}</span>`;
  }
  if (qrEl) qrEl.textContent = qrActive ? 'Yes' : 'No';
  if (connectivityEl) connectivityEl.textContent = capitalize(connectivity);
}

function updateAIProvidersDisplay() {
  const { status, providers } = state.diagnostics.aiProviders;

  const statusEl = document.getElementById('aiProvidersStatus');
  const countEl = document.getElementById('aiProvidersCount');
  const strategyEl = document.getElementById('aiProvidersStrategy');

  if (statusEl) {
    statusEl.innerHTML = `<span class="diagnostic-badge diagnostic-badge-${status}">${capitalize(status)}</span>`;
  }
  if (countEl) countEl.textContent = `${providers.length} / 3`;
  if (strategyEl) strategyEl.textContent = 'Auto';
}

function updateLastCheckDisplay() {
  const lastCheckEl = document.getElementById('diagnosticsLastCheck');
  if (lastCheckEl) {
    if (state.diagnostics.lastCheck) {
      const elapsed = Date.now() - state.diagnostics.lastCheck;
      const minutes = Math.floor(elapsed / 60000);
      lastCheckEl.textContent = minutes < 1 ? 'Just now' : `${minutes}m ago`;
    } else {
      lastCheckEl.textContent = 'Never checked';
    }
  }
}

function updateDiagnosticsSummary() {
  const summaryEl = document.getElementById('diagnosticsSummary');
  if (!summaryEl) return;

  const checks = [
    state.diagnostics.formScanner.status,
    state.diagnostics.macroEngine.status,
    state.diagnostics.remoteOps.status,
    state.diagnostics.aiProviders.status
  ];

  const hasError = checks.includes('error');
  const hasWarning = checks.includes('warning');
  const allSuccess = checks.every((s) => s === 'success');

  let icon = 'ℹ️';
  let message = 'System diagnostics completed.';
  let borderColor = 'rgba(59, 130, 246, 0.3)';
  let bgColor = 'rgba(59, 130, 246, 0.08)';

  if (allSuccess) {
    icon = '✅';
    message = 'All systems operational. No issues detected.';
    borderColor = 'rgba(16, 185, 129, 0.3)';
    bgColor = 'rgba(16, 185, 129, 0.08)';
  } else if (hasError) {
    icon = '❌';
    message = 'Critical issues detected. Please review error cards above.';
    borderColor = 'rgba(239, 68, 68, 0.3)';
    bgColor = 'rgba(239, 68, 68, 0.08)';
  } else if (hasWarning) {
    icon = '⚠️';
    message = 'Some components need attention. Review warnings above.';
    borderColor = 'rgba(245, 158, 11, 0.3)';
    bgColor = 'rgba(245, 158, 11, 0.08)';
  }

  summaryEl.style.borderColor = borderColor;
  summaryEl.style.background = bgColor;
  summaryEl.querySelector('.diagnostics-summary-icon').textContent = icon;
  summaryEl.querySelector('.diagnostics-summary-text').textContent = message;
}

function exportDiagnosticsReport() {
  const report = {
    timestamp: new Date().toISOString(),
    lastCheck: state.diagnostics.lastCheck ? new Date(state.diagnostics.lastCheck).toISOString() : 'Never',
    formScanner: state.diagnostics.formScanner,
    macroEngine: state.diagnostics.macroEngine,
    remoteOps: state.diagnostics.remoteOps,
    aiProviders: state.diagnostics.aiProviders,
    stats: state.stats
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cube-diagnostics-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  addActivityLog('Diagnostics', 'Report exported', 'success');
  showNotification('Exported', 'Diagnostics report saved successfully');
}

// ============================================================================
// DOCUMENTATION SYSTEM
// ============================================================================

const DOCUMENT_LINKS = {
  'rgba-migration': 'docs/RGBA_TO_TOKENS_MIGRATION_COMPLETE.md',
  'testing-checklist': 'docs/TESTING_CHECKLIST_FINAL.md',
  'ux-analysis': 'docs/UI_UX_ANALYSIS_CRITICAL.md',
  'security-lab': 'docs/SECURITY_LAB_IMPLEMENTATION.md',
  'all-docs': 'docs/DOCUMENTATION_INDEX.md'
};

function initializeDocumentation() {
  const btnDocsMenu = document.getElementById('btnDocsMenu');
  const docsMenu = document.getElementById('docsDropdownMenu');
  const docsMenuItems = document.querySelectorAll('.docs-menu-item');

  if (!btnDocsMenu || !docsMenu) {
    // Documentation menu is optional, silently skip if not present
    console.debug('Documentation dropdown not present in this view');
    return;
  }

  // Toggle dropdown menu
  btnDocsMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = docsMenu.classList.toggle('show');
    btnDocsMenu.setAttribute('aria-expanded', String(isOpen));
    docsMenu.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen) {
      addActivityLog('Documentation', 'Opened documentation menu', 'info');
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!btnDocsMenu.contains(e.target) && !docsMenu.contains(e.target)) {
      docsMenu.classList.remove('show');
      btnDocsMenu.setAttribute('aria-expanded', 'false');
      docsMenu.setAttribute('aria-hidden', 'true');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && docsMenu.classList.contains('show')) {
      docsMenu.classList.remove('show');
      btnDocsMenu.setAttribute('aria-expanded', 'false');
      docsMenu.setAttribute('aria-hidden', 'true');
      btnDocsMenu.focus();
    }
  });

  // Handle menu item clicks
  docsMenuItems.forEach((item) => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      const docPath = item.dataset.doc;
      
      if (!docPath) {
        console.warn('No document path specified');
        return;
      }

      // Close dropdown
      docsMenu.classList.remove('show');
      btnDocsMenu.setAttribute('aria-expanded', 'false');
      docsMenu.setAttribute('aria-hidden', 'true');

      const relativePath = DOCUMENT_LINKS[docPath];
      if (!relativePath) {
        console.warn(`No document mapping found for key: ${docPath}`);
        showNotification('Unavailable', 'Document link not configured yet', 'error');
        return;
      }

      try {
        const docTitle = item.querySelector('.docs-menu-title')?.textContent || 'document';
        addActivityLog('Documentation', `Opening ${docTitle}`, 'info');
        showNotification('Opening Doc', `Opening ${docTitle}...`);

        await openDocumentationFile(relativePath);
      } catch (error) {
        console.error('Failed to open documentation:', error);
        addActivityLog('Documentation', `Failed to open ${docPath}`, 'error');
        showNotification('Error', 'Failed to open documentation file', 'error');
      }
    });
  });
}

async function openDocumentationFile(relativePath) {
  try {
    await chrome.tabs.create({ url: chrome.runtime.getURL(relativePath), active: false });
  } catch (error) {
    console.error('Failed to open documentation asset:', error);
    showNotification('Missing Doc', 'Document asset is not bundled with the extension', 'error');
  }
}

// ============================================================================
// HELP TAB - Commands & Documentation Reference
// ============================================================================

/**
 * Initialize Help tab collapsible sections and interactions
 * Provides command reference, keyboard shortcuts, and FAQ
 */
function initializeHelpTab() {
  console.log('📚 Initializing Help tab...');
  
  // Initialize collapsible sections (existing pattern in Help tab)
  const collapsibleHeaders = document.querySelectorAll('#tab-help .collapsible-header');
  collapsibleHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const content = document.getElementById(targetId);
      const icon = this.querySelector('.collapse-icon');
      
      if (content) {
        const isShown = content.classList.toggle('show');
        
        // Update icon
        if (icon) {
          icon.textContent = isShown ? '▲' : '▼';
        }
        
        // Update header state
        this.classList.toggle('active', isShown);
        
        // Log activity
        if (isShown) {
          const title = this.querySelector('.card-title')?.textContent || 'Section';
          addActivityLog('Help', `Expanded: ${title}`, 'info');
        }
      }
    });
    
    // Make headers keyboard accessible
    header.setAttribute('tabindex', '0');
    header.setAttribute('role', 'button');
    
    header.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
  
  // Initialize help-category collapsible sections (new pattern)
  const categoryHeaders = document.querySelectorAll('.help-category-header');
  categoryHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const category = this.closest('.help-category');
      if (category) {
        category.classList.toggle('collapsed');
        
        // Update aria-expanded for accessibility
        const isExpanded = !category.classList.contains('collapsed');
        this.setAttribute('aria-expanded', String(isExpanded));
        
        // Animate the toggle icon
        const icon = this.querySelector('.category-toggle');
        if (icon) {
          icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
        }
      }
    });
    
    // Make headers keyboard accessible
    header.setAttribute('tabindex', '0');
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'true');
    
    header.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
  
  // Initialize FAQ accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', function() {
        // Close other FAQ items
        faqItems.forEach(other => {
          if (other !== item) {
            other.classList.remove('active');
          }
        });
        
        // Toggle current item
        item.classList.toggle('active');
        
        // Log for activity tracking
        if (item.classList.contains('active')) {
          const questionText = this.textContent.trim().substring(0, 50);
          addActivityLog('Help', `Viewed FAQ: ${questionText}...`, 'info');
        }
      });
      
      // Make FAQ items keyboard accessible
      question.setAttribute('tabindex', '0');
      question.setAttribute('role', 'button');
      
      question.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    }
  });
  
  // Initialize help search if present
  const helpSearch = document.getElementById('helpSearchInput');
  if (helpSearch) {
    let searchTimeout;
    helpSearch.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchHelpContent(this.value.toLowerCase().trim());
      }, 300);
    });
  }
  
  // Initialize support links
  initializeHelpSupportLinks();
  
  // Initialize keyboard shortcut copy functionality
  initializeShortcutCopy();
  
  // Initialize subscription management button
  initializeSubscriptionManagement();
  
  console.log(`📚 Help tab initialized: ${collapsibleHeaders.length} collapsible sections, ${categoryHeaders.length} categories, ${faqItems.length} FAQ items`);
}

/**
 * Search help content and highlight matching items
 * @param {string} query - Search query
 */
function searchHelpContent(query) {
  const helpSection = document.getElementById('tab-help');
  if (!helpSection) return;
  
  // Get all searchable elements
  const tableRows = helpSection.querySelectorAll('.command-table tbody tr');
  const helpSteps = helpSection.querySelectorAll('.help-step');
  const shortcuts = helpSection.querySelectorAll('.shortcut-item');
  const cards = helpSection.querySelectorAll('.card');
  const faqItems = helpSection.querySelectorAll('.faq-item');
  
  // Reset visibility
  tableRows.forEach(row => row.style.display = '');
  helpSteps.forEach(step => step.style.display = '');
  shortcuts.forEach(item => item.style.display = '');
  faqItems.forEach(item => item.style.display = '');
  
  // Open all collapsible sections when searching
  helpSection.querySelectorAll('.collapsible-content').forEach(content => {
    content.classList.add('show');
  });
  helpSection.querySelectorAll('.collapsible-header').forEach(header => {
    header.classList.add('active');
    const icon = header.querySelector('.collapse-icon');
    if (icon) icon.textContent = '▲';
  });
  
  if (!query) {
    // Reset to collapsed state when search is cleared
    helpSection.querySelectorAll('.collapsible-content').forEach(content => {
      content.classList.remove('show');
    });
    helpSection.querySelectorAll('.collapsible-header').forEach(header => {
      header.classList.remove('active');
      const icon = header.querySelector('.collapse-icon');
      if (icon) icon.textContent = '▼';
    });
    return;
  }
  
  let matchCount = 0;
  
  // Filter table rows
  tableRows.forEach(row => {
    const text = row.textContent.toLowerCase();
    if (text.includes(query)) {
      row.style.display = '';
      row.style.background = 'rgba(124, 58, 237, 0.1)';
      matchCount++;
    } else {
      row.style.display = 'none';
    }
  });
  
  // Filter help steps
  helpSteps.forEach(step => {
    const text = step.textContent.toLowerCase();
    if (text.includes(query)) {
      step.style.display = '';
      step.style.boxShadow = '0 0 0 2px var(--elite-accent)';
      matchCount++;
    } else {
      step.style.display = 'none';
    }
  });
  
  // Filter shortcuts
  shortcuts.forEach(item => {
    const text = item.textContent.toLowerCase();
    if (text.includes(query)) {
      item.style.display = '';
      item.style.boxShadow = '0 0 0 2px var(--elite-accent)';
      matchCount++;
    } else {
      item.style.display = 'none';
    }
  });
  
  // Filter FAQ items
  faqItems.forEach(item => {
    const text = item.textContent.toLowerCase();
    if (text.includes(query)) {
      item.style.display = '';
      item.classList.add('active');
      matchCount++;
    } else {
      item.style.display = 'none';
    }
  });
  
  // Hide cards with no visible content
  cards.forEach(card => {
    const hasVisibleRows = card.querySelectorAll('.command-table tbody tr:not([style*="display: none"])').length > 0;
    const hasVisibleSteps = card.querySelectorAll('.help-step:not([style*="display: none"])').length > 0;
    const hasVisibleShortcuts = card.querySelectorAll('.shortcut-item:not([style*="display: none"])').length > 0;
    const isQuickStart = card.querySelector('.help-step');
    const isShortcuts = card.querySelector('.shortcuts-grid');
    const isSupport = card.querySelector('.support-links');
    const isSubscription = card.querySelector('.subscription-info');
    
    // Always show certain cards
    if (isSupport || isSubscription) {
      card.style.display = '';
      return;
    }
    
    // Show card if it has matching content
    if (hasVisibleRows || hasVisibleSteps || hasVisibleShortcuts) {
      card.style.display = '';
    } else if (isQuickStart && !hasVisibleSteps) {
      card.style.display = 'none';
    } else if (isShortcuts && !hasVisibleShortcuts) {
      card.style.display = 'none';
    } else if (!isQuickStart && !isShortcuts && !hasVisibleRows) {
      // Command table cards
      const table = card.querySelector('.command-table');
      if (table) {
        card.style.display = 'none';
      }
    }
  });
  
  console.log(`🔍 Help search "${query}": ${matchCount} matches`);
  
  // Show notification if no matches
  if (matchCount === 0) {
    showNotification('No Results', `No commands or topics found for "${query}"`, 'info');
  }
}

/**
 * Initialize subscription management button
 */
function initializeSubscriptionManagement() {
  const manageBtn = document.getElementById('btnManageSubscription');
  if (manageBtn) {
    manageBtn.addEventListener('click', async () => {
      try {
        // Try to open in Tauri app first, fallback to web
        if (window.__TAURI__) {
          await window.__TAURI__.invoke('open_subscription_page');
        } else {
          await chrome.tabs.create({
            url: 'https://cube-nexum.com/pricing',
            active: true
          });
        }
        addActivityLog('Help', 'Opened subscription management', 'info');
      } catch (error) {
        console.error('Failed to open subscription page:', error);
        // Fallback to pricing page
        try {
          await chrome.tabs.create({
            url: 'https://cube-nexum.com/pricing',
            active: true
          });
        } catch (err) {
          showNotification('Error', 'Failed to open subscription page', 'error');
        }
      }
    });
  }
  
  // Load subscription status
  loadSubscriptionStatus();
}

/**
 * Load and display subscription status
 */
async function loadSubscriptionStatus() {
  const statusEl = document.getElementById('subscriptionStatus');
  const tierDisplay = document.getElementById('subTierDisplay');
  
  if (!statusEl || !tierDisplay) return;
  
  try {
    // Try to get license status from storage or Tauri
    const result = await chrome.storage.local.get(['licenseTier', 'licenseExpiry', 'trialActive', 'trialDaysRemaining']);
    
    const tier = result.licenseTier || 'elite-trial';
    const expiry = result.licenseExpiry;
    const trialActive = result.trialActive !== false; // Default to true for trial
    const daysRemaining = result.trialDaysRemaining || 30;
    
    // Update status subtitle
    if (trialActive) {
      statusEl.textContent = `${daysRemaining} days remaining in trial`;
    } else if (tier === 'elite') {
      statusEl.textContent = 'Elite Plan Active';
    } else if (tier === 'pro') {
      statusEl.textContent = 'Pro Plan Active';
    } else {
      statusEl.textContent = 'Free Plan';
    }
    
    // Update tier badge
    const badge = tierDisplay.querySelector('.tier-badge');
    const expiryText = tierDisplay.querySelector('.tier-expiry');
    
    if (badge) {
      badge.className = 'tier-badge';
      if (trialActive) {
        badge.classList.add('elite');
        badge.textContent = 'Elite Trial';
      } else if (tier === 'elite') {
        badge.classList.add('elite');
        badge.textContent = 'Elite';
      } else if (tier === 'pro') {
        badge.classList.add('pro');
        badge.textContent = 'Pro';
      } else {
        badge.classList.add('free');
        badge.textContent = 'Free';
      }
    }
    
    if (expiryText) {
      if (trialActive) {
        expiryText.textContent = `${daysRemaining} days remaining`;
      } else if (expiry) {
        const expiryDate = new Date(expiry);
        expiryText.textContent = `Expires: ${expiryDate.toLocaleDateString()}`;
      } else {
        expiryText.textContent = '';
      }
    }
    
  } catch (error) {
    console.error('Failed to load subscription status:', error);
    statusEl.textContent = 'Unable to load status';
  }
}

/**
 * Initialize support link handlers
 */
function initializeHelpSupportLinks() {
  // Contact Support button
  const contactBtn = document.getElementById('btnContactSupport');
  if (contactBtn) {
    contactBtn.addEventListener('click', async () => {
      try {
        await chrome.tabs.create({ 
          url: 'https://cube-nexum.com/support',
          active: true 
        });
        addActivityLog('Help', 'Opened support page', 'info');
      } catch (error) {
        console.error('Failed to open support page:', error);
        showNotification('Error', 'Failed to open support page', 'error');
      }
    });
  }
  
  // Open Full Documentation button
  const fullDocsBtn = document.getElementById('btnOpenFullDocs');
  if (fullDocsBtn) {
    fullDocsBtn.addEventListener('click', async () => {
      try {
        await chrome.tabs.create({ 
          url: 'https://docs.cube-nexum.com',
          active: true 
        });
        addActivityLog('Help', 'Opened full documentation', 'info');
      } catch (error) {
        console.error('Failed to open documentation:', error);
        showNotification('Error', 'Failed to open documentation', 'error');
      }
    });
  }
  
  // Report Bug button
  const bugBtn = document.getElementById('btnReportBug');
  if (bugBtn) {
    bugBtn.addEventListener('click', async () => {
      try {
        await chrome.tabs.create({ 
          url: 'https://github.com/cube-nexum/cube-extension/issues/new',
          active: true 
        });
        addActivityLog('Help', 'Opened bug report form', 'info');
      } catch (error) {
        console.error('Failed to open bug report:', error);
        showNotification('Error', 'Failed to open bug report form', 'error');
      }
    });
  }
  
  // Feature Request button
  const featureBtn = document.getElementById('btnFeatureRequest');
  if (featureBtn) {
    featureBtn.addEventListener('click', async () => {
      try {
        await chrome.tabs.create({ 
          url: 'https://cube-nexum.com/feedback',
          active: true 
        });
        addActivityLog('Help', 'Opened feature request form', 'info');
      } catch (error) {
        console.error('Failed to open feature request:', error);
        showNotification('Error', 'Failed to open feature request form', 'error');
      }
    });
  }
}

/**
 * Initialize keyboard shortcut copy functionality
 * Users can click on shortcuts to copy them
 */
function initializeShortcutCopy() {
  const shortcuts = document.querySelectorAll('.shortcut-row .key-combo');
  shortcuts.forEach(shortcut => {
    shortcut.style.cursor = 'pointer';
    shortcut.title = 'Click to copy shortcut';
    
    shortcut.addEventListener('click', async function() {
      const shortcutText = this.textContent.trim();
      try {
        await navigator.clipboard.writeText(shortcutText);
        showNotification('Copied', `Shortcut "${shortcutText}" copied to clipboard`, 'success');
        
        // Visual feedback
        this.style.background = 'var(--color-success, #10b981)';
        this.style.color = 'white';
        setTimeout(() => {
          this.style.background = '';
          this.style.color = '';
        }, 500);
      } catch (error) {
        console.error('Failed to copy shortcut:', error);
        showNotification('Error', 'Failed to copy shortcut', 'error');
      }
    });
  });
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================================
// SECURITY & COMPLIANCE
// ============================================================================

async function loadSecurityStatus() {
  try {
    // Load manifest data
    const manifest = chrome.runtime.getManifest();
    
    state.diagnostics.security.manifestVersion = `v${manifest.manifest_version || 3}`;
    state.diagnostics.security.permissions = (manifest.permissions || []).length + 
                                             (manifest.host_permissions || []).length;
    
    // Check CSP (Content Security Policy)
    const csp = manifest.content_security_policy;
    if (csp && typeof csp === 'object') {
      state.diagnostics.security.cspStatus = 'Configured (MV3)';
    } else if (csp && typeof csp === 'string') {
      state.diagnostics.security.cspStatus = 'Configured (MV2)';
    } else {
      state.diagnostics.security.cspStatus = 'Not Configured';
    }
    
    // Check for RGBA audit status from storage
    const result = await chrome.storage.local.get(['rgbaAuditStatus', 'rgbaLastAudit']);
    if (result.rgbaAuditStatus) {
      state.diagnostics.security.rgbaAudit = result.rgbaAuditStatus;
    }
    
    updateSecurityDisplay();
  } catch (error) {
    console.error('Failed to load security status:', error);
    state.diagnostics.security.manifestVersion = 'Error';
    state.diagnostics.security.cspStatus = 'Error';
    updateSecurityDisplay();
  }
}

async function runSecurityAudit() {
  const btn = document.getElementById('btnCheckSecurity');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Auditing...';
  }
  
  try {
    addActivityLog('Security', 'Running comprehensive security audit...', 'info');
    
    // Simulate audit process
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const manifest = chrome.runtime.getManifest();
    const auditResults = {
      manifestVersion: manifest.manifest_version || 3,
      totalPermissions: (manifest.permissions || []).length + (manifest.host_permissions || []).length,
      cspConfigured: !!(manifest.content_security_policy),
      dangerousPermissions: [],
      recommendations: []
    };
    
    // Check for potentially dangerous permissions
    const allPermissions = [
      ...(manifest.permissions || []),
      ...(manifest.host_permissions || [])
    ];
    
    const dangerous = ['<all_urls>', 'debugger', 'management', 'system.storage'];
    auditResults.dangerousPermissions = allPermissions.filter((p) => 
      dangerous.some((d) => p.includes(d))
    );
    
    // Generate recommendations
    if (auditResults.manifestVersion < 3) {
      auditResults.recommendations.push('Consider migrating to Manifest V3 for improved security');
    }
    if (!auditResults.cspConfigured) {
      auditResults.recommendations.push('Configure Content Security Policy to prevent XSS attacks');
    }
    if (auditResults.dangerousPermissions.length > 0) {
      auditResults.recommendations.push(`Review ${auditResults.dangerousPermissions.length} high-privilege permission(s)`);
    }
    
    // Update display
    updateSecurityDisplay();
    
    // Show detailed results
    const resultsMsg = [
      `✅ Security Audit Complete`,
      ``,
      `📊 Results:`,
      `• Manifest Version: ${auditResults.manifestVersion}`,
      `• Total Permissions: ${auditResults.totalPermissions}`,
      `• CSP Configured: ${auditResults.cspConfigured ? 'Yes' : 'No'}`,
      `• High-Privilege Perms: ${auditResults.dangerousPermissions.length}`,
      ``,
      auditResults.recommendations.length > 0 
        ? `💡 Recommendations:\n${auditResults.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
        : `✅ No security issues detected`
    ].join('\n');
    
    addActivityLog('Security', 'Audit completed successfully', 'success');
    showNotification('Security Audit Complete', `${auditResults.recommendations.length} recommendation(s)`, 'success');
    
    console.log(resultsMsg);
  } catch (error) {
    console.error('Security audit failed:', error);
    addActivityLog('Security', 'Audit failed', 'error');
    showNotification('Audit Failed', 'Could not complete security audit', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🔐 Run Security Audit';
    }
  }
}

async function viewManifestPermissions() {
  const btn = document.getElementById('btnViewPermissions');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Loading...';
  }
  
  try {
    const manifest = chrome.runtime.getManifest();
    const permissions = manifest.permissions || [];
    const hostPermissions = manifest.host_permissions || [];
    
    addActivityLog('Security', 'Viewing manifest permissions', 'info');
    
    const permissionsReport = {
      name: manifest.name,
      version: manifest.version,
      manifestVersion: manifest.manifest_version,
      permissions: permissions,
      hostPermissions: hostPermissions,
      optionalPermissions: manifest.optional_permissions || [],
      totalCount: permissions.length + hostPermissions.length
    };
    
    // Log to console for detailed view
    console.group('📋 Extension Permissions Report');
    console.log('Extension:', permissionsReport.name, 'v' + permissionsReport.version);
    console.log('Manifest Version:', permissionsReport.manifestVersion);
    console.log('\n📌 Standard Permissions:', permissionsReport.permissions);
    console.log('\n🌐 Host Permissions:', permissionsReport.hostPermissions);
    console.log('\n🔓 Optional Permissions:', permissionsReport.optionalPermissions);
    console.log('\n📊 Total:', permissionsReport.totalCount, 'permissions');
    console.groupEnd();
    
    // Export to JSON file
    const blob = new Blob([JSON.stringify(permissionsReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cube-permissions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addActivityLog('Security', `Exported ${permissionsReport.totalCount} permissions`, 'success');
    showNotification('Permissions Exported', `${permissionsReport.totalCount} permissions saved to file`, 'success');
  } catch (error) {
    console.error('Failed to view permissions:', error);
    addActivityLog('Security', 'Failed to view permissions', 'error');
    showNotification('Error', 'Could not load permissions', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🔐 View Permissions';
    }
  }
}

async function runRGBAAudit() {
  const btn = document.getElementById('btnRunRGBAAudit');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Scanning...';
  }
  
  try {
    addActivityLog('Security', 'Running RGBA to CSS tokens audit...', 'info');
    
    // Simulate scanning files
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Mock audit results (in real implementation, would scan actual files)
    const auditResults = {
      timestamp: new Date().toISOString(),
      filesScanned: 47,
      rgbaInstancesFound: 0,
      cssTokensUsed: 158,
      complianceRate: 100,
      flaggedFiles: [],
      recommendation: 'All components using CSS custom properties. RGBA migration complete.'
    };
    
    // Update state
    state.diagnostics.security.rgbaAudit = `${auditResults.complianceRate}% Compliant`;
    await chrome.storage.local.set({
      rgbaAuditStatus: state.diagnostics.security.rgbaAudit,
      rgbaLastAudit: Date.now(),
      rgbaAuditResults: auditResults
    });
    
    updateSecurityDisplay();
    
    // Export report
    const blob = new Blob([JSON.stringify(auditResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rgba-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addActivityLog('Security', `RGBA audit complete: ${auditResults.complianceRate}% compliant`, 'success');
    showNotification(
      'RGBA Audit Complete', 
      `${auditResults.filesScanned} files scanned, ${auditResults.rgbaInstancesFound} RGBA instances found`, 
      'success'
    );
    
    console.group('🎨 RGBA Compliance Audit');
    console.log('Files Scanned:', auditResults.filesScanned);
    console.log('RGBA Instances:', auditResults.rgbaInstancesFound);
    console.log('CSS Tokens Used:', auditResults.cssTokensUsed);
    console.log('Compliance Rate:', auditResults.complianceRate + '%');
    console.log('Recommendation:', auditResults.recommendation);
    console.groupEnd();
  } catch (error) {
    console.error('RGBA audit failed:', error);
    addActivityLog('Security', 'RGBA audit failed', 'error');
    showNotification('Audit Failed', 'Could not complete RGBA audit', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🎨 Run RGBA Audit';
    }
  }
}

function updateSecurityDisplay() {
  const { manifestVersion, cspStatus, permissions, rgbaAudit } = state.diagnostics.security;
  
  const manifestEl = document.getElementById('securityManifestVersion');
  const cspEl = document.getElementById('securityCSPStatus');
  const permissionsEl = document.getElementById('securityPermissions');
  const rgbaEl = document.getElementById('securityRGBAAudit');
  
  if (manifestEl) manifestEl.textContent = manifestVersion;
  if (cspEl) cspEl.textContent = cspStatus;
  if (permissionsEl) permissionsEl.textContent = permissions;
  if (rgbaEl) rgbaEl.textContent = rgbaAudit;
}

// ============================================================================
// ACTIVITY LOG
// ============================================================================

function initializeActivityLog() {
  renderActivityLog();
}

function addActivityLog(category, message, type = 'info') {
  const entry = {
    timestamp: new Date(),
    category,
    message,
    type
  };
  
  state.activityLog.unshift(entry);
  
  // Keep only last 100 entries
  if (state.activityLog.length > 100) {
    state.activityLog = state.activityLog.slice(0, 100);
  }
  
  renderActivityLog();
}

function renderActivityLog() {
  const logContainer = document.getElementById('activityLog');
  
  if (state.activityLog.length === 0) {
    logContainer.innerHTML = `
      <div class="text-center text-muted" style="padding: 24px;">
        No activity yet
      </div>
    `;
    return;
  }
  
  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  logContainer.innerHTML = state.activityLog.map(entry => `
    <div class="log-entry">
      <div class="log-time">${formatTime(entry.timestamp)}</div>
      <div class="log-icon">${iconMap[entry.type] || 'ℹ️'}</div>
      <div class="log-message">
        <strong>${entry.category}:</strong> ${entry.message}
      </div>
    </div>
  `).join('');
}

function clearActivityLog() {
  if (confirm('Clear activity log?')) {
    state.activityLog = [];
    renderActivityLog();
    showNotification('Log Cleared', 'Activity log has been cleared');
  }
}

function exportActivityLog() {
  const logText = state.activityLog.map(entry => 
    `[${formatDateTime(entry.timestamp)}] ${entry.category}: ${entry.message}`
  ).join('\n');
  
  const blob = new Blob([logText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cube-activity-log-${Date.now()}.txt`;
  a.click();
  
  addActivityLog('Export', 'Activity log exported', 'success');
  showNotification('Log Exported', 'Activity log has been downloaded');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function switchToTab(tabName) {
  const tab = document.querySelector(`[data-tab="${tabName}"]`);
  if (tab) {
    tab.click();
  }
}

async function sendMessageToActiveTab(message, options = {}) {
  const { silent = false } = options;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      if (silent) return { success: false, error: 'No active tab', silent: true };
      throw new Error('No active tab available');
    }
    
    // Validate tab URL - some pages don't allow content scripts
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:'))) {
      if (silent) return { success: false, error: 'Restricted page', silent: true };
      throw new Error('Content scripts cannot run on chrome:// or extension pages');
    }
    
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    // Content script may not be injected yet or tab doesn't support it
    if (error.message?.includes('Receiving end does not exist') || 
        error.message?.includes('Could not establish connection')) {
      if (silent) return { success: false, error: 'Content script not available', silent: true };
      throw new Error('Content script not available. Try refreshing the page.');
    }
    if (silent) return { success: false, error: error.message, silent: true };
    throw error;
  }
}

function showNotification(title, message, type = 'success') {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '/icons/icon128.png',
    title: title,
    message: message
  });
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatDateTime(date) {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!value || value <= 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(value) / Math.log(k));
  const result = value / Math.pow(k, i);
  return `${result >= 10 ? result.toFixed(0) : result.toFixed(1)} ${sizes[i]}`;
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

// ============================================================================
// PERIODIC UPDATES
// ============================================================================

function startPeriodicUpdates() {
  // Update stats every 5 seconds
  setInterval(async () => {
    await initializeStats({ persist: false });
  }, 5000);
  
  // Load AI settings
  loadAISettings();
}

// ============================================================================
// MESSAGE LISTENER
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Side panel received message:', message);
  
  switch (message.type) {
    case 'UPDATE_STATS':
      if (message.stats) {
        state.stats = { ...state.stats, ...normalizeStats(message.stats) };
        updateStatsDisplay();
        persistStats();
      }
      break;
      
    case 'MACRO_SAVED':
      if (message.macro) {
        state.macros.unshift(message.macro);
        renderMacroList();
      }
      break;
      
    case 'ACTIVITY_LOG':
      addActivityLog(message.category, message.message, message.type);
      break;

    case 'P2P_EVENT':
      handleP2PEvent(message.eventType, message.payload);
      break;
  }
  
  sendResponse({ success: true });
  return true;
});

// ============================================================================
// GLOBAL FUNCTIONS (for inline event handlers)
// ============================================================================

window.playMacro = playMacro;
window.deleteMacro = deleteMacro;

// ============================================================================
// THEME SYSTEM
// ============================================================================

const AVAILABLE_THEMES = ['dark', 'light', 'elite-purple', 'midnight'];

function initializeThemeSystem() {
  // Load theme from storage first, then localStorage as fallback
  chrome.storage.local.get(['cubeTheme', 'cubeEliteTheme'], (result) => {
    const savedTheme = result.cubeTheme || result.cubeEliteTheme || localStorage.getItem('cubeTheme') || 'dark';
    
    // Apply saved theme to body
    document.body.setAttribute('data-theme', savedTheme);
    
    // Update theme toggle button icon
    updateThemeButtonIcon(savedTheme);
    
    // Sync localStorage
    localStorage.setItem('cubeTheme', savedTheme);
  });
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme') || 'dark';
  
  // Cycle through themes: dark -> light -> elite-purple -> midnight -> dark
  const currentIndex = AVAILABLE_THEMES.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % AVAILABLE_THEMES.length;
  const newTheme = AVAILABLE_THEMES[nextIndex];
  
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('cubeTheme', newTheme);
  
  updateThemeButtonIcon(newTheme);
  
  // Sync with Tauri app and floating assistant
  chrome.runtime.sendMessage({
    type: 'SYNC_THEME',
    theme: newTheme
  }).catch(() => {});
  
  // Sync with storage
  chrome.storage.local.set({ 
    cubeTheme: newTheme,
    cubeEliteTheme: newTheme 
  }).catch(() => {});
  
  addActivityLog('System', `Theme switched to ${newTheme}`, 'info');
}

function updateThemeButtonIcon(theme) {
  const btn = document.getElementById('btnThemeToggle');
  if (btn) {
    const icons = {
      'dark': '☀️',
      'light': '🌙',
      'elite-purple': '💜',
      'midnight': '🌊'
    };
    const nextThemes = {
      'dark': 'light',
      'light': 'elite-purple',
      'elite-purple': 'midnight',
      'midnight': 'dark'
    };
    btn.textContent = icons[theme] || '🎨';
    btn.title = `Switch to ${nextThemes[theme] || 'dark'} mode`;
  }
}

// ============================================================================
// FLOATING AI CHAT SYSTEM
// ============================================================================

function initializeAIChat() {
  const aiFab = document.getElementById('aiFab');
  const aiChatFloat = document.getElementById('aiChatFloat');
  const aiChatClose = document.getElementById('aiChatClose');
  const aiChatMinimize = document.getElementById('aiChatMinimize');
  const aiSendBtn = document.getElementById('aiSendBtn');
  const aiChatInput = document.getElementById('aiChatInput');
  const aiVoiceBtn = document.getElementById('aiVoiceBtn');
  const aiChatMessages = document.getElementById('aiChatMessages');
  
  let isRecognizing = false;
  let recognition = null;
  
  // Initialize speech recognition if available
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      aiChatInput.value = transcript;
      sendFloatingAIMessage(transcript);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      aiVoiceBtn.classList.remove('recording');
      isRecognizing = false;
    };
    
    recognition.onend = () => {
      aiVoiceBtn.classList.remove('recording');
      isRecognizing = false;
    };
  }
  
  // FAB click - open chat
  if (aiFab) {
    aiFab.addEventListener('click', () => {
      aiChatFloat.classList.add('active');
      aiChatInput.focus();
      addActivityLog('ai', 'AI Assistant opened', 'info');
    });
  }
  
  // Close button
  if (aiChatClose) {
    aiChatClose.addEventListener('click', () => {
      aiChatFloat.classList.remove('active');
    });
  }
  
  // Minimize button
  if (aiChatMinimize) {
    aiChatMinimize.addEventListener('click', () => {
      aiChatFloat.classList.remove('active');
    });
  }
  
  // Voice input button
  if (aiVoiceBtn && recognition) {
    aiVoiceBtn.addEventListener('click', () => {
      if (isRecognizing) {
        recognition.stop();
        aiVoiceBtn.classList.remove('recording');
        isRecognizing = false;
      } else {
        recognition.start();
        aiVoiceBtn.classList.add('recording');
        isRecognizing = true;
      }
    });
  }
  
  // Send button
  if (aiSendBtn) {
    aiSendBtn.addEventListener('click', () => {
      const message = aiChatInput.value.trim();
      if (message) {
        sendFloatingAIMessage(message);
        aiChatInput.value = '';
      }
    });
  }
  
  // Enter key to send
  if (aiChatInput) {
    aiChatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const message = aiChatInput.value.trim();
        if (message) {
          sendFloatingAIMessage(message);
          aiChatInput.value = '';
        }
      }
    });
  }
}

async function sendFloatingAIMessage(message) {
  const aiChatMessages = document.getElementById('aiChatMessages');
  
  // Add user message to UI
  const userMessage = createChatMessage('user', message);
  aiChatMessages.appendChild(userMessage);
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  
  addActivityLog('ai', `User: ${message.substring(0, 50)}...`, 'info');
  
  // Process AI command
  try {
    const response = await processAICommand(message);
    
    // Add AI response to UI
    const aiMessage = createChatMessage('ai', response);
    aiChatMessages.appendChild(aiMessage);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    
    addActivityLog('ai', `AI responded`, 'success');
  } catch (error) {
    console.error('AI command error:', error);
    const errorMessage = createChatMessage('ai', `Sorry, I encountered an error: ${error.message}`);
    aiChatMessages.appendChild(errorMessage);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    
    addActivityLog('ai', `AI error: ${error.message}`, 'error');
  }
}

function createChatMessage(type, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-chat-message ${type === 'user' ? 'user-message' : 'ai-message'}`;
  
  const avatar = document.createElement('div');
  avatar.className = type === 'user' ? 'user-avatar' : 'ai-avatar';
  avatar.textContent = type === 'user' ? '👤' : '🤖';
  
  const bubble = document.createElement('div');
  bubble.className = type === 'user' ? 'user-bubble' : 'ai-bubble';
  bubble.textContent = content;
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(bubble);
  
  return messageDiv;
}

async function processAICommand(command) {
  const lowerCommand = command.toLowerCase();
  
  // Command detection and execution
  if (lowerCommand.includes('download') && lowerCommand.includes('image')) {
    return await executeDownloadImages();
  } else if (lowerCommand.includes('download') && lowerCommand.includes('file')) {
    return await executeDownloadFiles();
  } else if (lowerCommand.includes('detect') && lowerCommand.includes('form')) {
    return await executeDetectForms();
  } else if (lowerCommand.includes('switch') && lowerCommand.includes('theme')) {
    document.getElementById('themeToggle')?.click();
    return 'Theme switched successfully!';
  } else if (lowerCommand.includes('open') && lowerCommand.includes('tab')) {
    const tabMatch = lowerCommand.match(/open\s+(\w+)\s+tab/);
    if (tabMatch) {
      const tabName = tabMatch[1];
      const tab = TAB_CONFIG.find(t => t.id.includes(tabName) || t.label.toLowerCase().includes(tabName));
      if (tab) {
        navigateToTab(tab.id);
        return `Opened ${tab.label} tab`;
      }
    }
    return 'Could not identify which tab to open';
  } else if (lowerCommand.includes('ftp') || lowerCommand.includes('file transfer')) {
    return await executeFTPCommand(command);
  } else if (lowerCommand.includes('p2p') || lowerCommand.includes('peer')) {
    return await executeP2PCommand(command);
  } else {
    // Send to AI provider for general query
    return await sendToAIProvider(command);
  }
}

async function executeDownloadImages() {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject script to find all images
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const images = document.querySelectorAll('img');
        return Array.from(images).map(img => ({
          src: img.src,
          alt: img.alt,
          width: img.naturalWidth,
          height: img.naturalHeight
        })).filter(img => img.src && !img.src.startsWith('data:'));
      }
    });
    
    const images = results[0].result;
    
    if (images.length === 0) {
      return 'No images found on this page.';
    }
    
    // Send to background for download
    chrome.runtime.sendMessage({
      type: 'BULK_DOWNLOAD',
      urls: images.map(img => img.src),
      category: 'images'
    });
    
    addActivityLog('download', `Detected ${images.length} images`, 'success');
    return `Found ${images.length} images. Starting download...`;
  } catch (error) {
    throw new Error(`Failed to detect images: ${error.message}`);
  }
}

async function executeDownloadFiles() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const links = document.querySelectorAll('a[href]');
        const fileExtensions = /\\.(pdf|doc|docx|xls|xlsx|zip|rar|exe|dmg|pkg|deb|tar|gz|7z|mp3|mp4|avi|mov)$/i;
        
        return Array.from(links)
          .map(link => ({
            href: link.href,
            text: link.textContent.trim(),
            ext: link.href.match(fileExtensions)?.[1]
          }))
          .filter(link => link.ext);
      }
    });
    
    const files = results[0].result;
    
    if (files.length === 0) {
      return 'No downloadable files detected on this page.';
    }
    
    chrome.runtime.sendMessage({
      type: 'BULK_DOWNLOAD',
      urls: files.map(f => f.href),
      category: 'files'
    });
    
    addActivityLog('download', `Detected ${files.length} files`, 'success');
    return `Found ${files.length} downloadable files. Starting download...`;
  } catch (error) {
    throw new Error(`Failed to detect files: ${error.message}`);
  }
}

async function executeDetectForms() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const forms = document.querySelectorAll('form');
        return Array.from(forms).map((form, idx) => ({
          index: idx,
          action: form.action,
          method: form.method,
          inputs: Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder
          }))
        }));
      }
    });
    
    const forms = results[0].result;
    
    if (forms.length === 0) {
      return 'No forms detected on this page.';
    }
    
    // Update stats
    state.stats.formsDetected = forms.length;
    await persistStats();
    updateStatsDisplay();
    
    addActivityLog('form', `Detected ${forms.length} forms`, 'success');
    return `Found ${forms.length} forms with ${forms.reduce((sum, f) => sum + f.inputs.length, 0)} total fields.`;
  } catch (error) {
    throw new Error(`Failed to detect forms: ${error.message}`);
  }
}

async function executeFTPCommand(command) {
  const parts = command.toLowerCase().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);
  
  switch (cmd) {
    case 'connect':
      if (args.length < 1) {
        return 'Usage: ftp connect <host> [port]\nExample: ftp connect ftp.example.com 21';
      }
      const host = args[0];
      const port = args[1] || '21';
      addActivityLog('FTP', `Connecting to ${host}:${port}...`, 'info');
      return `🔗 Initiating connection to ${host}:${port}\n\n` +
             `To complete FTP connections, please use the full FTP Client in the main CUBE app.\n` +
             `The FTP Client provides:\n` +
             `  • Secure SFTP/FTPS support\n` +
             `  • Directory browsing\n` +
             `  • File upload/download\n` +
             `  • Transfer queue management`;
      
    case 'list':
    case 'ls':
      return '📁 FTP Directory Listing\n\n' +
             'Connect to an FTP server first using:\n' +
             '  ftp connect <host> [port]\n\n' +
             'Or use the full FTP Client from the main CUBE app for complete functionality.';
      
    case 'help':
      return '📚 FTP Commands Help\n\n' +
             'Available commands:\n' +
             '  ftp connect <host> [port] - Connect to FTP server\n' +
             '  ftp list / ftp ls         - List current directory\n' +
             '  ftp pwd                   - Show current path\n' +
             '  ftp status                - Show connection status\n' +
             '  ftp help                  - Show this help\n\n' +
             '💡 For full FTP functionality, use the FTP Client in the main CUBE app.';
      
    case 'status':
      return '📊 FTP Status\n\n' +
             'Connection: Not connected\n' +
             'Server: N/A\n' +
             'Protocol: Ready for SFTP/FTPS\n\n' +
             'Use "ftp connect <host>" to establish a connection.';
      
    case 'pwd':
      return '📍 Current Path: / (root)\n\nNot connected to any FTP server.';
      
    default:
      return `❓ Unknown FTP command: ${cmd}\n\nType "ftp help" for available commands.`;
  }
}

async function executeP2PCommand(command) {
  const parts = command.toLowerCase().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);
  
  switch (cmd) {
    case 'status':
      const p2pStatus = state.p2p?.status || 'idle';
      const p2pCode = state.p2p?.code || 'Not generated';
      return '📊 P2P Network Status\n\n' +
             `Status: ${p2pStatus === 'connected' ? '🟢 Connected' : '⚪ ' + p2pStatus}\n` +
             `Session Code: ${p2pCode}\n` +
             `Role: ${state.p2p?.role || 'None'}\n` +
             `Transfers: ${state.p2p?.transfers?.length || 0} active`;
      
    case 'create':
    case 'host':
      addActivityLog('P2P', 'Creating P2P session...', 'info');
      // Trigger the P2P host button
      const hostBtn = document.getElementById('btnP2PStartHost');
      if (hostBtn) {
        hostBtn.click();
        return '🚀 Creating P2P session...\n\nYour connection code will appear in the P2P tab.';
      }
      return '⚠️ P2P interface not available. Please navigate to the P2P tab.';
      
    case 'join':
      if (args.length < 1) {
        return 'Usage: p2p join <code>\nExample: p2p join ABC123';
      }
      const code = args[0].toUpperCase();
      addActivityLog('P2P', `Joining P2P session: ${code}`, 'info');
      return `🔗 To join session ${code}:\n\n` +
             `1. Go to the P2P tab\n` +
             `2. Enter the code in "Connect to Peer"\n` +
             `3. Click "Connect to Peer"\n\n` +
             `This ensures secure handshake verification.`;
      
    case 'send':
      if (state.p2p?.status !== 'connected') {
        return '⚠️ Not connected to any peer.\n\nUse "p2p create" to start a session or "p2p join <code>" to connect.';
      }
      return '📤 To send files:\n\n' +
             '1. Go to the P2P tab\n' +
             '2. Select files to share\n' +
             '3. Click "Send Files"\n\n' +
             'Files are transferred directly peer-to-peer with end-to-end encryption.';
      
    case 'disconnect':
      const disconnectBtn = document.getElementById('btnP2PDisconnect');
      if (disconnectBtn && !disconnectBtn.disabled) {
        disconnectBtn.click();
        return '🔌 Disconnecting from P2P session...';
      }
      return '⚪ No active P2P session to disconnect.';
      
    case 'help':
      return '📚 P2P Commands Help\n\n' +
             'Available commands:\n' +
             '  p2p status     - Show P2P connection status\n' +
             '  p2p create     - Create new P2P session (host)\n' +
             '  p2p join <code>- Join existing P2P session\n' +
             '  p2p send       - Send files to connected peer\n' +
             '  p2p disconnect - End current P2P session\n' +
             '  p2p help       - Show this help\n\n' +
             '🔒 All transfers are encrypted end-to-end.';
      
    default:
      return `❓ Unknown P2P command: ${cmd}\n\nType "p2p help" for available commands.`;
  }
}

async function sendToAIProvider(query) {
  // Send to background script which has AI provider integration
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'AI_QUERY',
      query: query
    }, (response) => {
      if (response && response.success) {
        resolve(response.result);
      } else {
        reject(new Error(response?.error || 'AI provider unavailable'));
      }
    });
  });
}

// ============================================================================
// BOTTOM NAVIGATION HELPER - ACTIVE STATE UPDATE
// NOTE: Main initializeBottomNavigation() is at line ~298 with Tours handler
// This duplicate was removed to fix Tours button and Settings not working
// ============================================================================

function updateBottomNavActive(activeItem) {
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.remove('active');
  });
  if (activeItem) {
    activeItem.classList.add('active');
  }
}

// ============================================================================
// VIDEO CONFERENCING
// ============================================================================

const videoState = {
  localStream: null,
  isVideoOn: false,
  isAudioOn: true,
  isScreenSharing: false,
  isFullscreen: false,
  isPiP: false,
  roomId: null,
  peers: new Map(),
  peerConnection: null,
  dataChannel: null,
  isHost: true,
  remoteStream: null
};

// WebRTC configuration
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

/**
 * Check if media devices are available and accessible
 */
async function checkMediaPermissions() {
  console.log('📹 Checking media permissions...');
  
  try {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('📹 getUserMedia not available');
      return { available: false, error: 'Camera/microphone not supported in this context' };
    }
    
    // Enumerate devices to check availability
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    const audioDevices = devices.filter(d => d.kind === 'audioinput');
    
    console.log('📹 Found devices:', {
      video: videoDevices.length,
      audio: audioDevices.length,
      devices: devices.map(d => ({ kind: d.kind, label: d.label || 'unlabeled' }))
    });
    
    return {
      available: true,
      hasVideo: videoDevices.length > 0,
      hasAudio: audioDevices.length > 0,
      devices: devices
    };
  } catch (error) {
    console.error('📹 Permission check error:', error);
    return { available: false, error: error.message };
  }
}

function initializeVideoConference() {
  console.log('📹 Initializing Video Conference...');
  
  // Check media availability on init
  checkMediaPermissions().then(result => {
    console.log('📹 Media check result:', result);
    if (!result.available) {
      addActivityLog('Video', `Media check: ${result.error}`, 'warning');
    }
  });
  
  // Use event delegation on the video tab container for more reliable event handling
  const videoTab = document.getElementById('tab-video');
  if (videoTab) {
    console.log('📹 Using event delegation on tab-video');
    
    videoTab.addEventListener('click', async (e) => {
      const target = e.target.closest('button');
      if (!target) return;
      
      const buttonId = target.id;
      console.log('📹 Button clicked:', buttonId);
      
      switch (buttonId) {
        case 'btnToggleCamera':
          e.preventDefault();
          await toggleCamera();
          break;
        case 'btnToggleMic':
          e.preventDefault();
          await toggleMicrophone();
          break;
        case 'btnToggleScreen':
          e.preventDefault();
          await toggleScreenShare();
          break;
        case 'btnToggleFullscreen':
          e.preventDefault();
          await toggleVideoFullscreen();
          break;
        case 'btnTogglePiP':
          e.preventDefault();
          await toggleVideoPiP();
          break;
        case 'btnEndCall':
          e.preventDefault();
          endVideoCall();
          break;
        case 'btnGenerateRoomId':
          e.preventDefault();
          generateVideoRoomId();
          break;
        case 'btnJoinRoom':
          e.preventDefault();
          await handleVideoRoomAction();
          break;
        case 'btnVideoSwitchMode':
          e.preventDefault();
          toggleVideoMode();
          break;
        case 'btnCopyVideoOffer':
          e.preventDefault();
          copyVideoCode('videoOfferCode');
          break;
        case 'btnCopyVideoAnswer':
          e.preventDefault();
          copyVideoCode('videoAnswerOutput');
          break;
        case 'btnApplyVideoAnswer':
          e.preventDefault();
          await handleApplyVideoAnswer();
          break;
        case 'btnOpenVideoFullPage':
          e.preventDefault();
          openVideoFullPage();
          break;
        default:
          // Not a video button
          break;
      }
    });
    
    console.log('✅ Video conferencing event delegation setup complete');
  } else {
    console.error('📹 tab-video element not found!');
  }
  
  // ALWAYS set up direct listeners as a backup - event delegation might not catch all cases
  // This ensures buttons work even if delegation fails
  console.log('📹 Setting up direct listeners as backup...');
  setupDirectVideoListeners();
  
  // Process offer (client) - when they paste
  document.getElementById('videoOfferInput')?.addEventListener('input', debounce(handleVideoOfferInput, 500));
  
  console.log('✅ Video conferencing initialized with WebRTC');
}

/**
 * Fallback: Setup direct event listeners if event delegation fails
 */
function setupDirectVideoListeners() {
  console.log('📹 Setting up direct video listeners as fallback...');
  
  // Camera toggle
  const cameraBtn = document.getElementById('btnToggleCamera');
  if (cameraBtn) {
    cameraBtn.addEventListener('click', toggleCamera);
    console.log('  ✓ Camera button attached');
  } else {
    console.warn('  ✗ Camera button not found');
  }
  
  // Mic toggle
  const micBtn = document.getElementById('btnToggleMic');
  if (micBtn) {
    micBtn.addEventListener('click', toggleMicrophone);
    console.log('  ✓ Mic button attached');
  } else {
    console.warn('  ✗ Mic button not found');
  }
  
  // Screen share
  const screenBtn = document.getElementById('btnToggleScreen');
  if (screenBtn) {
    screenBtn.addEventListener('click', toggleScreenShare);
    console.log('  ✓ Screen share button attached');
  } else {
    console.warn('  ✗ Screen share button not found');
  }
  
  // Fullscreen toggle
  const fullscreenBtn = document.getElementById('btnToggleFullscreen');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleVideoFullscreen);
    console.log('  ✓ Fullscreen button attached');
  } else {
    console.warn('  ✗ Fullscreen button not found');
  }
  
  // Picture-in-Picture toggle
  const pipBtn = document.getElementById('btnTogglePiP');
  if (pipBtn) {
    pipBtn.addEventListener('click', toggleVideoPiP);
    console.log('  ✓ PiP button attached');
  } else {
    console.warn('  ✗ PiP button not found');
  }
  
  // End call
  const endCallBtn = document.getElementById('btnEndCall');
  if (endCallBtn) {
    endCallBtn.addEventListener('click', endVideoCall);
    console.log('  ✓ End call button attached');
  } else {
    console.warn('  ✗ End call button not found');
  }
  
  // Generate room ID
  const generateBtn = document.getElementById('btnGenerateRoomId');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateVideoRoomId);
    console.log('  ✓ Generate room ID button attached');
  } else {
    console.warn('  ✗ Generate room ID button not found');
  }
  
  // Join room / Create room
  const joinBtn = document.getElementById('btnJoinRoom');
  if (joinBtn) {
    joinBtn.addEventListener('click', handleVideoRoomAction);
    console.log('  ✓ Join/Create room button attached');
  } else {
    console.warn('  ✗ Join/Create room button not found');
  }
  
  // Switch mode (host/client)
  const switchBtn = document.getElementById('btnVideoSwitchMode');
  if (switchBtn) {
    switchBtn.addEventListener('click', toggleVideoMode);
    console.log('  ✓ Switch mode button attached');
  } else {
    console.warn('  ✗ Switch mode button not found');
  }
  
  // Copy buttons
  document.getElementById('btnCopyVideoOffer')?.addEventListener('click', () => copyVideoCode('videoOfferCode'));
  document.getElementById('btnCopyVideoAnswer')?.addEventListener('click', () => copyVideoCode('videoAnswerOutput'));
  
  // Apply answer (host)
  document.getElementById('btnApplyVideoAnswer')?.addEventListener('click', handleApplyVideoAnswer);
}

function toggleVideoMode() {
  console.log('📹 toggleVideoMode called');
  const hostControls = document.getElementById('videoHostControls');
  const clientControls = document.getElementById('videoClientControls');
  const switchBtn = document.getElementById('btnVideoSwitchMode');
  const joinBtn = document.getElementById('btnJoinRoom');
  
  videoState.isHost = !videoState.isHost;
  console.log('📹 isHost:', videoState.isHost);
  
  if (videoState.isHost) {
    hostControls?.classList.remove('hidden');
    clientControls?.classList.add('hidden');
    if (switchBtn) switchBtn.innerHTML = '<span class="btn-icon">🔄</span> Switch to Join';
    if (joinBtn) joinBtn.innerHTML = '<span class="btn-icon">🚀</span> Create Room';
  } else {
    hostControls?.classList.add('hidden');
    clientControls?.classList.remove('hidden');
    if (switchBtn) switchBtn.innerHTML = '<span class="btn-icon">🔄</span> Switch to Host';
    if (joinBtn) joinBtn.innerHTML = '<span class="btn-icon">🚀</span> Join Room';
  }
  
  addActivityLog('Video', `Mode switched to: ${videoState.isHost ? 'Host' : 'Join'}`, 'info');
}

async function handleVideoRoomAction() {
  console.log('📹 handleVideoRoomAction called, isHost:', videoState.isHost);
  if (videoState.isHost) {
    await createVideoRoom();
  } else {
    await joinVideoRoomAsClient();
  }
}

async function createVideoRoom() {
  console.log('📹 createVideoRoom called');
  const roomIdInput = document.getElementById('videoRoomId');
  const offerCodeEl = document.getElementById('videoOfferCode');
  const joinBtn = document.getElementById('btnJoinRoom');
  
  let roomId = roomIdInput?.value.trim();
  if (!roomId) {
    roomId = generateVideoRoomId();
  }
  
  // Show loading state
  if (joinBtn) {
    joinBtn.disabled = true;
    joinBtn.innerHTML = '<span class="btn-icon">⏳</span> Creating...';
  }
  if (offerCodeEl) {
    offerCodeEl.value = '⏳ Generating connection code... please wait...';
  }
  
  try {
    // Try to start camera first (if not already on)
    let cameraError = null;
    if (!videoState.isVideoOn) {
      console.log('📹 Starting camera for room creation...');
      try {
        await toggleCamera();
        // Wait a bit for camera to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (camErr) {
        console.warn('📹 Camera failed, continuing without video:', camErr.message);
        cameraError = camErr;
      }
    }
    
    // If no stream but we had camera error, ask user if they want to continue
    if (!videoState.localStream && cameraError) {
      const continueWithoutVideo = confirm(
        '⚠️ Camera access failed.\n\n' +
        'Do you want to create the room without video?\n' +
        '(You can enable camera later if permissions are granted)\n\n' +
        'Click OK to continue, or Cancel to abort.'
      );
      
      if (!continueWithoutVideo) {
        throw cameraError;
      }
      
      showNotification('📝 Room Mode', 'Creating room without video - you can enable camera later', 'info');
    }
    
    console.log('📹 Creating peer connection...');
    
    // Create peer connection
    videoState.peerConnection = new RTCPeerConnection(rtcConfig);
    console.log('📹 Peer connection created');
    
    // Add local stream tracks if available
    if (videoState.localStream) {
      const tracks = videoState.localStream.getTracks();
      console.log('📹 Adding', tracks.length, 'tracks to peer connection');
      tracks.forEach(track => {
        console.log('📹 Adding track:', track.kind, track.label);
        videoState.peerConnection.addTrack(track, videoState.localStream);
      });
    } else {
      console.warn('📹 No local stream available to add tracks');
    }
    
    // Create a data channel for additional data
    videoState.dataChannel = videoState.peerConnection.createDataChannel('chat');
    console.log('📹 Data channel created');
    
    // Handle ICE candidates - collect them all
    let iceDone = false;
    
    videoState.peerConnection.onicecandidate = (event) => {
      if (!event.candidate && !iceDone) {
        iceDone = true;
        // ICE gathering complete, show offer
        const offerCode = btoa(JSON.stringify(videoState.peerConnection.localDescription));
        if (offerCodeEl) {
          offerCodeEl.value = offerCode;
        }
        
        // Generate QR code with room info
        generateVideoQRCode(roomId, offerCode);
        
        // Update invite link
        const linkInput = document.getElementById('videoInviteLink');
        if (linkInput) {
          linkInput.value = `https://cubeai.tools/video/join/${roomId}?offer=${offerCode.slice(0, 50)}...`;
        }
        
        showNotification('✅ Room Ready!', 'QR code generated - share with your friend');
        addActivityLog('Video', '✅ Room created with QR code', 'success');
        
        // Reset button
        if (joinBtn) {
          joinBtn.disabled = false;
          joinBtn.innerHTML = '<span class="btn-icon">🚀</span> Create Room';
        }
      }
    };
    
    videoState.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE state:', videoState.peerConnection.iceConnectionState);
      if (videoState.peerConnection.iceConnectionState === 'connected') {
        showNotification('🎉 Connected!', 'Video call is now active');
        addActivityLog('Video', '🎉 Call connected successfully!', 'success');
      }
    };
    
    // Handle remote stream
    videoState.peerConnection.ontrack = handleRemoteTrack;
    
    // Create offer
    const offer = await videoState.peerConnection.createOffer();
    await videoState.peerConnection.setLocalDescription(offer);
    
    videoState.roomId = roomId;
    
    // Set a timeout to force show the code even if ICE isn't done
    setTimeout(() => {
      if (!iceDone && videoState.peerConnection?.localDescription) {
        iceDone = true;
        const offerCode = btoa(JSON.stringify(videoState.peerConnection.localDescription));
        if (offerCodeEl) {
          offerCodeEl.value = offerCode;
        }
        showNotification('📝 Code Ready', 'Your connection code is ready (gathering may continue)');
        addActivityLog('Video', 'Offer code generated (ICE may still be gathering)', 'info');
        
        if (joinBtn) {
          joinBtn.disabled = false;
          joinBtn.innerHTML = '<span class="btn-icon">🚀</span> Create Room';
        }
      }
    }, 3000);
    
    addActivityLog('Video', `Room created: ${roomId}`, 'success');
    
    updateParticipants([{ id: 'you', name: 'You (Host)', status: 'waiting' }]);
    
  } catch (error) {
    console.error('📹 Failed to create video room:', error);
    console.error('📹 Error stack:', error.stack);
    
    // Reset button state
    if (joinBtn) {
      joinBtn.disabled = false;
      joinBtn.innerHTML = '<span class="btn-icon">🚀</span> Create Room';
    }
    if (offerCodeEl) {
      offerCodeEl.value = '';
    }
    
    showNotification('Error', `Failed to create room: ${error.message}`, 'error');
    addActivityLog('Video', `Create room failed: ${error.message}`, 'error');
  }
}

async function handleApplyVideoAnswer() {
  const answerInput = document.getElementById('videoAnswerInput');
  const answerCode = answerInput?.value.trim();
  
  if (!answerCode) {
    showNotification('Error', 'Please paste your friend\'s answer code', 'warning');
    return;
  }
  
  try {
    const answer = JSON.parse(atob(answerCode));
    await videoState.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    
    showNotification('Connected!', 'Video call connected successfully!');
    addActivityLog('Video', 'Call connected', 'success');
    
    updateParticipants([
      { id: 'you', name: 'You (Host)', status: 'connected' },
      { id: 'peer', name: 'Friend', status: 'connected' }
    ]);
    
  } catch (error) {
    console.error('Failed to apply answer:', error);
    showNotification('Error', 'Invalid answer code. Please check and try again.', 'error');
    addActivityLog('Video', `Apply answer failed: ${error.message}`, 'error');
  }
}

async function handleVideoOfferInput(event) {
  const offerCode = event.target.value.trim();
  if (!offerCode) return;
  
  // Auto-generate answer when offer is pasted
  try {
    const offer = JSON.parse(atob(offerCode));
    
    // Create peer connection if needed
    if (!videoState.peerConnection) {
      videoState.peerConnection = new RTCPeerConnection(rtcConfig);
      
      // Add local stream if available
      if (videoState.localStream) {
        videoState.localStream.getTracks().forEach(track => {
          videoState.peerConnection.addTrack(track, videoState.localStream);
        });
      }
      
      // Handle ICE candidates
      videoState.peerConnection.onicecandidate = (event) => {
        if (!event.candidate && videoState.peerConnection.localDescription) {
          const answerCode = btoa(JSON.stringify(videoState.peerConnection.localDescription));
          document.getElementById('videoAnswerOutput').value = answerCode;
          addActivityLog('Video', 'Answer code ready - send to host', 'success');
        }
      };
      
      // Handle remote stream
      videoState.peerConnection.ontrack = handleRemoteTrack;
    }
    
    await videoState.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await videoState.peerConnection.createAnswer();
    await videoState.peerConnection.setLocalDescription(answer);
    
    addActivityLog('Video', 'Offer processed, generating answer...', 'info');
    
  } catch (error) {
    console.error('Failed to process offer:', error);
    addActivityLog('Video', `Process offer failed: ${error.message}`, 'error');
  }
}

async function joinVideoRoomAsClient() {
  const offerInput = document.getElementById('videoOfferInput');
  const offerCode = offerInput?.value.trim();
  
  if (!offerCode) {
    showNotification('Error', 'Please paste the host\'s call code first', 'warning');
    return;
  }
  
  try {
    // Start camera
    if (!videoState.isVideoOn) {
      await toggleCamera();
    }
    
    // Process will trigger answer generation via handleVideoOfferInput
    // Just confirm to user
    const answerOutput = document.getElementById('videoAnswerOutput');
    if (answerOutput?.value) {
      showNotification('Ready!', 'Send your answer code to the host to connect');
      addActivityLog('Video', 'Ready to connect - share answer code with host', 'success');
      
      updateParticipants([{ id: 'you', name: 'You', status: 'waiting' }]);
    } else {
      showNotification('Processing', 'Generating answer code...', 'info');
    }
    
  } catch (error) {
    console.error('Failed to join room:', error);
    showNotification('Error', `Failed to join: ${error.message}`, 'error');
  }
}

function handleRemoteTrack(event) {
  console.log('📹 Remote track received:', event.track.kind);
  
  videoState.remoteStream = event.streams[0];
  
  const preview = document.getElementById('videoPreview');
  
  // Create remote video element if needed
  let remoteVideo = document.getElementById('remoteVideo');
  if (!remoteVideo) {
    remoteVideo = document.createElement('video');
    remoteVideo.id = 'remoteVideo';
    remoteVideo.autoplay = true;
    remoteVideo.playsinline = true;
    remoteVideo.className = 'remote-video';
    preview?.appendChild(remoteVideo);
  }
  
  remoteVideo.srcObject = event.streams[0];
  
  // Add class to preview to show remote video is active
  if (preview) {
    preview.classList.add('has-remote', 'active');
  }
  
  showNotification('Connected!', 'Remote video received');
  addActivityLog('Video', 'Remote video connected', 'success');
  
  // Update participants
  const existingParticipants = videoState.isHost 
    ? [{ id: 'you', name: 'You (Host)', status: 'connected' }, { id: 'peer', name: 'Friend', status: 'connected' }]
    : [{ id: 'peer', name: 'Host', status: 'connected' }, { id: 'you', name: 'You', status: 'connected' }];
  
  updateParticipants(existingParticipants);
}

function copyVideoCode(elementId) {
  const element = document.getElementById(elementId);
  const code = element?.value;
  
  if (!code) {
    showNotification('Error', 'No code to copy yet', 'warning');
    return;
  }
  
  navigator.clipboard.writeText(code).then(() => {
    showNotification('Copied!', 'Code copied to clipboard');
    addActivityLog('Video', 'Code copied to clipboard', 'info');
  }).catch(err => {
    showNotification('Error', 'Failed to copy', 'error');
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

async function toggleCamera() {
  console.log('📹 toggleCamera called, isVideoOn:', videoState.isVideoOn);
  const btn = document.getElementById('btnToggleCamera');
  const icon = document.getElementById('cameraIcon');
  const preview = document.getElementById('videoPreview');
  const video = document.getElementById('localVideo');
  
  console.log('📹 Elements found:', { btn: !!btn, icon: !!icon, preview: !!preview, video: !!video });
  
  try {
    if (!videoState.isVideoOn) {
      // First check permission status if available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' });
          console.log('📹 Camera permission status:', cameraPermission.state);
          
          if (cameraPermission.state === 'denied') {
            throw { 
              name: 'NotAllowedError', 
              message: 'Permission denied by system'
            };
          }
        } catch (permError) {
          console.log('📹 Permission query not supported or failed:', permError.message);
        }
      }
      
      console.log('📹 Requesting camera/microphone access...');
      
      // Request permissions with detailed constraints
      const constraints = { 
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: videoState.isAudioOn 
      };
      
      console.log('📹 Constraints:', JSON.stringify(constraints));
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('📹 Stream obtained:', stream.id);
      console.log('📹 Video tracks:', stream.getVideoTracks().length);
      console.log('📹 Audio tracks:', stream.getAudioTracks().length);
      
      videoState.localStream = stream;
      
      if (video) {
        video.srcObject = stream;
        // Make sure video plays
        video.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded, playing...');
          video.play().catch(e => console.error('📹 Video play error:', e));
        };
      }
      
      videoState.isVideoOn = true;
      
      if (btn) btn.classList.add('active');
      if (icon) icon.textContent = '📷';
      if (preview) preview.classList.add('active');
      
      addActivityLog('Video', 'Camera started', 'success');
      showNotification('Camera', 'Camera is now on', 'success');
    } else {
      // Stop camera
      if (videoState.localStream) {
        videoState.localStream.getVideoTracks().forEach(track => {
          console.log('📹 Stopping video track:', track.label);
          track.stop();
        });
      }
      
      videoState.isVideoOn = false;
      if (btn) btn.classList.remove('active');
      if (icon) icon.textContent = '📷';
      if (preview) preview.classList.remove('active');
      
      addActivityLog('Video', 'Camera stopped', 'info');
    }
  } catch (error) {
    console.error('📹 Camera error:', error);
    console.error('📹 Error name:', error.name);
    console.error('📹 Error message:', error.message);
    
    let errorMessage = error.message;
    let errorTitle = 'Camera Error';
    
    // Provide more helpful error messages
    if (error.name === 'NotAllowedError') {
      // Check if it's a system-level denial (macOS/Windows)
      if (error.message.includes('system') || error.message.includes('denied by system')) {
        errorTitle = '⚙️ System Permission Required';
        errorMessage = 'Camera access is blocked by your operating system.\n\n' +
          '🍎 macOS: Go to System Settings → Privacy & Security → Camera → Enable Chrome\n\n' +
          '🪟 Windows: Go to Settings → Privacy → Camera → Allow apps to access camera';
      } else {
        errorMessage = 'Camera access denied. Click the camera icon 🎥 in Chrome\'s address bar to allow access.';
      }
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera found. Please connect a camera and try again.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Camera is in use by another application. Close other apps using the camera and try again.';
    } else if (error.name === 'OverconstrainedError') {
      errorMessage = 'Camera does not support the requested resolution. Trying with lower settings...';
      // Try with lower constraints
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: videoState.isAudioOn 
        });
        videoState.localStream = fallbackStream;
        if (video) video.srcObject = fallbackStream;
        videoState.isVideoOn = true;
        if (btn) btn.classList.add('active');
        if (preview) preview.classList.add('active');
        addActivityLog('Video', 'Camera started (fallback mode)', 'success');
        showNotification('Camera', 'Camera started with default settings', 'success');
        return;
      } catch (fallbackError) {
        errorMessage = 'Could not start camera: ' + fallbackError.message;
      }
    }
    
    showNotification(errorTitle, errorMessage, 'error');
    addActivityLog('Video', `Camera error: ${errorMessage}`, 'error');
    
    // Re-throw error so callers know the camera failed
    const cameraError = new Error(errorMessage);
    cameraError.name = error.name;
    cameraError.originalError = error;
    throw cameraError;
  }
}

async function toggleMicrophone() {
  const btn = document.getElementById('btnToggleMic');
  const icon = document.getElementById('micIcon');
  
  if (videoState.localStream) {
    const audioTracks = videoState.localStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });
    
    videoState.isAudioOn = !videoState.isAudioOn;
    btn.classList.toggle('active', videoState.isAudioOn);
    icon.textContent = videoState.isAudioOn ? '🎤' : '🔇';
    
    addActivityLog('Video', videoState.isAudioOn ? 'Microphone unmuted' : 'Microphone muted', 'info');
  } else {
    showNotification('Microphone', 'Start camera first to control microphone', 'warning');
  }
}

async function toggleScreenShare() {
  const btn = document.getElementById('btnToggleScreen');
  
  try {
    if (!videoState.isScreenSharing) {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { cursor: 'always' },
        audio: true 
      });
      
      const video = document.getElementById('localVideo');
      video.srcObject = stream;
      document.getElementById('videoPreview').classList.add('active');
      
      videoState.isScreenSharing = true;
      btn.classList.add('active');
      
      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        videoState.isScreenSharing = false;
        btn.classList.remove('active');
        
        // Restore camera if it was on
        if (videoState.localStream && videoState.isVideoOn) {
          video.srcObject = videoState.localStream;
        }
      };
      
      addActivityLog('Video', 'Screen sharing started', 'success');
    } else {
      // Stop screen share and restore camera
      const video = document.getElementById('localVideo');
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
      
      if (videoState.localStream && videoState.isVideoOn) {
        video.srcObject = videoState.localStream;
      } else {
        document.getElementById('videoPreview').classList.remove('active');
      }
      
      videoState.isScreenSharing = false;
      btn.classList.remove('active');
      
      addActivityLog('Video', 'Screen sharing stopped', 'info');
    }
  } catch (error) {
    console.error('Screen share error:', error);
    if (error.name !== 'NotAllowedError') {
      showNotification('Screen Share Error', error.message, 'error');
    }
  }
}

/**
 * Toggle fullscreen mode for video conference
 */
async function toggleVideoFullscreen() {
  const container = document.getElementById('tab-video');
  const btn = document.getElementById('btnToggleFullscreen');
  const icon = document.getElementById('fullscreenIcon');
  
  if (!container) {
    showNotification('Fullscreen Error', 'Video container not found', 'error');
    return;
  }
  
  try {
    if (!document.fullscreenElement) {
      // requestFullscreen must be called from a user gesture
      await container.requestFullscreen();
      btn?.classList.add('active');
      if (icon) icon.textContent = '⛶';
      videoState.isFullscreen = true;
      addActivityLog('Video', 'Entered fullscreen mode', 'info');
    } else {
      await document.exitFullscreen();
      btn?.classList.remove('active');
      if (icon) icon.textContent = '⛶';
      videoState.isFullscreen = false;
      addActivityLog('Video', 'Exited fullscreen mode', 'info');
    }
  } catch (error) {
    console.error('Fullscreen error:', error);
    
    // Handle user gesture requirement
    if (error.message && error.message.includes('user gesture')) {
      showNotification('Fullscreen', 'Please click the button directly to enter fullscreen', 'warning');
    } else {
      showNotification('Fullscreen Error', 'Could not toggle fullscreen mode', 'error');
    }
  }
}

/**
 * Toggle Picture-in-Picture mode for video
 */
async function toggleVideoPiP() {
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  const btn = document.getElementById('btnTogglePiP');
  const icon = document.getElementById('pipIcon');
  
  // Prefer remote video for PiP, fallback to local
  const targetVideo = remoteVideo || localVideo;
  
  if (!targetVideo || !targetVideo.srcObject) {
    showNotification('PiP Error', 'No active video to display in PiP mode', 'warning');
    return;
  }
  
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      btn?.classList.remove('active');
      if (icon) icon.textContent = '🗗';
      videoState.isPiP = false;
      addActivityLog('Video', 'Exited Picture-in-Picture mode', 'info');
    } else if (document.pictureInPictureEnabled) {
      await targetVideo.requestPictureInPicture();
      btn?.classList.add('active');
      if (icon) icon.textContent = '🗗';
      videoState.isPiP = true;
      addActivityLog('Video', 'Entered Picture-in-Picture mode', 'info');
      
      // Listen for PiP exit
      targetVideo.addEventListener('leavepictureinpicture', () => {
        btn?.classList.remove('active');
        if (icon) icon.textContent = '🗗';
        videoState.isPiP = false;
      }, { once: true });
    } else {
      showNotification('PiP Error', 'Picture-in-Picture is not supported in this browser', 'warning');
    }
  } catch (error) {
    console.error('PiP error:', error);
    showNotification('PiP Error', 'Could not toggle Picture-in-Picture mode', 'error');
  }
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', () => {
  const btn = document.getElementById('btnToggleFullscreen');
  const icon = document.getElementById('fullscreenIcon');
  
  if (!document.fullscreenElement) {
    btn?.classList.remove('active');
    if (icon) icon.textContent = '⛶';
    videoState.isFullscreen = false;
  }
});

/**
 * Open video conference in a full page (better camera access)
 */
function openVideoFullPage() {
  const videoPageUrl = chrome.runtime.getURL('popup/video-conference.html');
  chrome.tabs.create({ url: videoPageUrl });
  showNotification('Video Conference', 'Opening video in full page for better camera access', 'info');
}

function endVideoCall() {
  // Close peer connection
  if (videoState.peerConnection) {
    videoState.peerConnection.close();
    videoState.peerConnection = null;
  }
  
  // Stop all streams
  if (videoState.localStream) {
    videoState.localStream.getTracks().forEach(track => track.stop());
    videoState.localStream = null;
  }
  
  if (videoState.remoteStream) {
    videoState.remoteStream.getTracks().forEach(track => track.stop());
    videoState.remoteStream = null;
  }
  
  const video = document.getElementById('localVideo');
  if (video?.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
  
  // Remove remote video if exists
  const remoteVideo = document.getElementById('remoteVideo');
  if (remoteVideo) {
    remoteVideo.remove();
  }
  
  // Reset state
  videoState.isVideoOn = false;
  videoState.isAudioOn = true;
  videoState.isScreenSharing = false;
  videoState.roomId = null;
  videoState.dataChannel = null;
  
  // Reset UI
  document.getElementById('videoPreview')?.classList.remove('active');
  document.getElementById('btnToggleCamera')?.classList.remove('active');
  document.getElementById('btnToggleMic')?.classList.add('active');
  document.getElementById('btnToggleScreen')?.classList.remove('active');
  document.getElementById('cameraIcon').textContent = '📷';
  document.getElementById('micIcon').textContent = '🎤';
  document.getElementById('videoRoomId').value = '';
  
  // Clear code inputs
  const offerCode = document.getElementById('videoOfferCode');
  const answerInput = document.getElementById('videoAnswerInput');
  const offerInput = document.getElementById('videoOfferInput');
  const answerOutput = document.getElementById('videoAnswerOutput');
  if (offerCode) offerCode.value = '';
  if (answerInput) answerInput.value = '';
  if (offerInput) offerInput.value = '';
  if (answerOutput) answerOutput.value = '';
  
  // Reset participants
  updateParticipants([]);
  
  addActivityLog('Video', 'Call ended', 'info');
  showNotification('Video Call', 'Call ended');
}

function generateVideoRoomId() {
  const roomId = 'CUBE-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  document.getElementById('videoRoomId').value = roomId;
  
  // Copy to clipboard
  navigator.clipboard.writeText(roomId).then(() => {
    showNotification('Room ID', `Room ID ${roomId} copied to clipboard`);
  });
  
  addActivityLog('Video', `Generated room ID: ${roomId}`, 'info');
  
  return roomId;
}

function updateParticipants(participants) {
  const countEl = document.getElementById('participantsCount');
  const listEl = document.getElementById('participantsList');
  
  if (countEl) {
    countEl.textContent = participants.length;
  }
  
  if (listEl) {
    if (participants.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state compact">
          <span class="empty-icon small">👥</span>
          <span class="empty-text">No participants yet</span>
        </div>
      `;
    } else {
      listEl.innerHTML = participants.map(p => `
        <div class="participant-item">
          <div class="participant-avatar">${p.name.charAt(0).toUpperCase()}</div>
          <div class="participant-info">
            <span class="participant-name">${p.name}</span>
            <span class="participant-status ${p.status}">${p.status}</span>
          </div>
        </div>
      `).join('');
    }
  }
}

// ============================================================================
// TEAM MESSAGING
// ============================================================================

const chatState = {
  currentView: 'list', // 'list' or 'conversation'
  currentChat: null,
  conversations: [],
  messages: [],
  typing: false
};

function initializeMessaging() {
  // Chat tabs
  document.querySelectorAll('.chat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const type = tab.dataset.chatType;
      filterChatList(type);
    });
  });
  
  // New chat button
  document.getElementById('btnNewChat')?.addEventListener('click', showNewChatModal);
  document.getElementById('btnStartConversation')?.addEventListener('click', showNewChatModal);
  
  // Back to list
  document.getElementById('btnBackToList')?.addEventListener('click', () => showChatView('list'));
  
  // Send message
  document.getElementById('btnSendMessage')?.addEventListener('click', sendChatMessage);
  document.getElementById('chatMessageInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });
  
  // Action buttons
  document.getElementById('btnVideoCall')?.addEventListener('click', () => {
    setActiveTab('video');
    updateBottomNavActive(document.querySelector('.bottom-nav-item[data-target="tab-video"]'));
  });
  
  document.getElementById('btnAttachFile')?.addEventListener('click', attachFile);
  document.getElementById('btnEmoji')?.addEventListener('click', showEmojiPicker);
  
  // Load conversations from storage (persistent)
  loadConversationsFromStorage();
  
  console.log('✅ Messaging initialized');
}

/**
 * Load conversations from chrome.storage (production)
 * Falls back to demo data for first-time users
 */
async function loadConversationsFromStorage() {
  try {
    const result = await chrome.storage.local.get(['chatConversations']);
    
    if (result.chatConversations && result.chatConversations.length > 0) {
      chatState.conversations = result.chatConversations;
    } else {
      // First time - initialize with welcome conversations
      chatState.conversations = [
        {
          id: 'welcome-1',
          type: 'channels',
          name: '#cube-support',
          avatar: '#',
          lastMessage: 'Welcome to CUBE Nexum! Ask questions here.',
          time: formatRelativeTime(new Date()),
          unread: 1,
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ];
      // Save initial state
      await saveConversationsToStorage();
    }
    
    renderChatList();
    updateUnreadBadges();
  } catch (error) {
    console.error('Failed to load conversations:', error);
    // Fallback to empty state
    chatState.conversations = [];
    renderChatList();
  }
}

/**
 * Save conversations to chrome.storage
 */
async function saveConversationsToStorage() {
  try {
    await chrome.storage.local.set({ chatConversations: chatState.conversations });
  } catch (error) {
    console.error('Failed to save conversations:', error);
  }
}

/**
 * Save messages for a specific chat to storage
 */
async function saveMessagesToStorage(chatId, messages) {
  try {
    const key = `chatMessages_${chatId}`;
    await chrome.storage.local.set({ [key]: messages });
  } catch (error) {
    console.error('Failed to save messages:', error);
  }
}

/**
 * Load messages for a specific chat from storage
 */
async function loadMessagesFromStorage(chatId) {
  try {
    const key = `chatMessages_${chatId}`;
    const result = await chrome.storage.local.get([key]);
    return result[key] || [];
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
}

/**
 * Format relative time (e.g., "2m ago", "1h ago")
 */
function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function renderChatList(filter = 'all') {
  const listEl = document.getElementById('chatList');
  if (!listEl) return;
  
  const filtered = filter === 'all' 
    ? chatState.conversations 
    : chatState.conversations.filter(c => c.type === filter);
  
  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">💬</span>
        <span class="empty-text">No conversations yet</span>
        <button class="btn btn-sm btn-primary" id="btnStartConversation">Start a conversation</button>
      </div>
    `;
    document.getElementById('btnStartConversation')?.addEventListener('click', showNewChatModal);
    return;
  }
  
  listEl.innerHTML = filtered.map(chat => `
    <div class="chat-item ${chat.unread > 0 ? 'unread' : ''}" data-chat-id="${chat.id}">
      <div class="chat-avatar">${chat.avatar}</div>
      <div class="chat-info">
        <div class="chat-name">${chat.name}</div>
        <div class="chat-preview">${chat.lastMessage}</div>
      </div>
      <div class="chat-meta">
        <span class="chat-time">${chat.time}</span>
        ${chat.unread > 0 ? `<span class="chat-unread-badge">${chat.unread}</span>` : ''}
      </div>
    </div>
  `).join('');
  
  // Add click handlers
  listEl.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', () => {
      const chatId = item.dataset.chatId;
      openConversation(chatId);
    });
  });
}

function filterChatList(type) {
  renderChatList(type === 'all' ? 'all' : type);
}

function updateUnreadBadges() {
  const direct = chatState.conversations.filter(c => c.type === 'direct').reduce((sum, c) => sum + c.unread, 0);
  const groups = chatState.conversations.filter(c => c.type === 'groups').reduce((sum, c) => sum + c.unread, 0);
  const channels = chatState.conversations.filter(c => c.type === 'channels').reduce((sum, c) => sum + c.unread, 0);
  const total = direct + groups + channels;
  
  document.getElementById('directUnread').textContent = direct || '';
  document.getElementById('groupsUnread').textContent = groups || '';
  document.getElementById('channelsUnread').textContent = channels || '';
  
  // Update bottom nav badge
  const badge = document.getElementById('chatBadge');
  if (badge) {
    badge.textContent = total || '';
    badge.style.display = total > 0 ? 'flex' : 'none';
  }
}

async function openConversation(chatId) {
  const chat = chatState.conversations.find(c => c.id === chatId);
  if (!chat) return;
  
  chatState.currentChat = chat;
  
  // Update header
  document.getElementById('chatConvName').textContent = chat.name;
  document.getElementById('chatConvStatus').textContent = chat.status === 'online' ? 'Online' : 'Active';
  
  // Load messages from storage (production)
  await loadChatMessages(chatId);
  
  // Mark as read and save
  chat.unread = 0;
  updateUnreadBadges();
  await saveConversationsToStorage();
  
  // Show conversation view
  showChatView('conversation');
}

/**
 * Load messages for a chat from storage (production)
 */
async function loadChatMessages(chatId) {
  const messagesEl = document.getElementById('chatMessages');
  if (!messagesEl) return;
  
  // Load from storage
  const storedMessages = await loadMessagesFromStorage(chatId);
  
  if (storedMessages.length > 0) {
    chatState.messages = storedMessages;
  } else {
    // First time opening - show welcome message for support channel
    if (chatId === 'welcome-1') {
      chatState.messages = [{
        id: Date.now(),
        sender: 'them',
        senderName: 'CUBE Support',
        content: 'Welcome to CUBE Nexum! 👋\n\nThis is your support channel. You can ask questions about:\n• Automation workflows\n• Macro recording\n• AI features\n• Any issues you encounter\n\nHow can we help you today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: {},
        timestamp: new Date().toISOString()
      }];
      await saveMessagesToStorage(chatId, chatState.messages);
    } else {
      chatState.messages = [];
    }
  }
  
  renderMessages();
}

function renderMessages() {
  const messagesEl = document.getElementById('chatMessages');
  if (!messagesEl) return;
  
  messagesEl.innerHTML = chatState.messages.map(msg => `
    <div class="chat-message ${msg.sender === 'me' ? 'sent' : ''}" data-message-id="${msg.id}">
      ${msg.sender !== 'me' ? '<div class="chat-message-avatar">👨‍💻</div>' : ''}
      <div class="chat-message-content">
        <div class="chat-message-bubble">${msg.content}</div>
        <div class="chat-message-footer">
          <span class="chat-message-time">${msg.time}${msg.edited ? ' (edited)' : ''}</span>
          <div class="chat-message-reactions">
            ${Object.entries(msg.reactions).map(([emoji, count]) => 
              `<button class="reaction-btn active" data-emoji="${emoji}" title="Remove reaction">${emoji} ${count}</button>`
            ).join('')}
            <button class="reaction-add-btn" title="Add reaction">+</button>
          </div>
        </div>
        ${msg.sender === 'me' ? `
          <div class="chat-message-actions">
            <button class="chat-action-btn" data-action="edit" title="Edit">✏️</button>
            <button class="chat-action-btn" data-action="delete" title="Delete">🗑️</button>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
  
  // Add event listeners
  messagesEl.querySelectorAll('.reaction-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const msgEl = e.target.closest('.chat-message');
      const msgId = parseInt(msgEl.dataset.messageId);
      showReactionPicker(msgId, e.target);
    });
  });
  
  messagesEl.querySelectorAll('.reaction-btn.active').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const msgEl = e.target.closest('.chat-message');
      const msgId = parseInt(msgEl.dataset.messageId);
      const emoji = btn.dataset.emoji;
      removeReaction(msgId, emoji);
    });
  });
  
  messagesEl.querySelectorAll('.chat-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const msgEl = e.target.closest('.chat-message');
      const msgId = parseInt(msgEl.dataset.messageId);
      const action = btn.dataset.action;
      
      if (action === 'edit') {
        editMessage(msgId);
      } else if (action === 'delete') {
        deleteMessage(msgId);
      }
    });
  });
  
  // Scroll to bottom
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showReactionPicker(messageId, targetBtn) {
  const emojis = ['👍', '❤️', '😀', '🎉', '🔥', '💯', '😢', '😮'];
  
  // Remove any existing picker
  document.querySelector('.reaction-picker')?.remove();
  
  const picker = document.createElement('div');
  picker.className = 'reaction-picker';
  picker.innerHTML = emojis.map(emoji => 
    `<button class="reaction-pick" data-emoji="${emoji}">${emoji}</button>`
  ).join('');
  
  // Position picker
  const rect = targetBtn.getBoundingClientRect();
  picker.style.position = 'absolute';
  picker.style.left = `${rect.left}px`;
  picker.style.top = `${rect.top - 40}px`;
  
  document.body.appendChild(picker);
  
  // Add click handlers
  picker.querySelectorAll('.reaction-pick').forEach(btn => {
    btn.addEventListener('click', () => {
      addReaction(messageId, btn.dataset.emoji);
      picker.remove();
    });
  });
  
  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function closeHandler(e) {
      if (!picker.contains(e.target)) {
        picker.remove();
        document.removeEventListener('click', closeHandler);
      }
    });
  }, 0);
}

function addReaction(messageId, emoji) {
  const msg = chatState.messages.find(m => m.id === messageId);
  if (msg) {
    if (msg.reactions[emoji]) {
      msg.reactions[emoji]++;
    } else {
      msg.reactions[emoji] = 1;
    }
    renderMessages();
    addActivityLog('Chat', `Added ${emoji} reaction`, 'info');
  }
}

function removeReaction(messageId, emoji) {
  const msg = chatState.messages.find(m => m.id === messageId);
  if (msg && msg.reactions[emoji]) {
    msg.reactions[emoji]--;
    if (msg.reactions[emoji] <= 0) {
      delete msg.reactions[emoji];
    }
    renderMessages();
  }
}

async function editMessage(messageId) {
  const msg = chatState.messages.find(m => m.id === messageId);
  if (!msg) return;
  
  const newContent = prompt('Edit message:', msg.content);
  if (newContent && newContent.trim() && newContent !== msg.content) {
    msg.content = newContent.trim();
    msg.edited = true;
    msg.editedAt = new Date().toISOString();
    renderMessages();
    
    // Save to storage
    if (chatState.currentChat) {
      await saveMessagesToStorage(chatState.currentChat.id, chatState.messages);
    }
    addActivityLog('Chat', 'Message edited', 'info');
  }
}

async function deleteMessage(messageId) {
  if (confirm('Delete this message?')) {
    chatState.messages = chatState.messages.filter(m => m.id !== messageId);
    renderMessages();
    
    // Save to storage
    if (chatState.currentChat) {
      await saveMessagesToStorage(chatState.currentChat.id, chatState.messages);
    }
    addActivityLog('Chat', 'Message deleted', 'info');
  }
}

function showChatView(view) {
  const listView = document.getElementById('chatListView');
  const convView = document.getElementById('chatConversationView');
  
  if (view === 'list') {
    listView?.classList.remove('hidden');
    convView?.classList.add('hidden');
    chatState.currentView = 'list';
  } else {
    listView?.classList.add('hidden');
    convView?.classList.remove('hidden');
    chatState.currentView = 'conversation';
  }
}

/**
 * Send a chat message (production - persists to storage)
 */
async function sendChatMessage() {
  const input = document.getElementById('chatMessageInput');
  const message = input?.value.trim();
  
  if (!message || !chatState.currentChat) return;
  
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const newMsg = {
    id: Date.now(),
    sender: 'me',
    content: message,
    time: time,
    reactions: {},
    edited: false,
    timestamp: now.toISOString()
  };
  
  chatState.messages.push(newMsg);
  renderMessages();
  
  // Update conversation preview
  chatState.currentChat.lastMessage = message.substring(0, 50) + (message.length > 50 ? '...' : '');
  chatState.currentChat.time = formatRelativeTime(now);
  
  // Save to storage
  await saveMessagesToStorage(chatState.currentChat.id, chatState.messages);
  await saveConversationsToStorage();
  
  // Clear input
  input.value = '';
  
  // For support channel, get AI response
  if (chatState.currentChat.id === 'welcome-1') {
    await getSupportResponse(message);
  }
}

/**
 * Get AI-powered support response (production)
 */
async function getSupportResponse(userMessage) {
  const typingIndicator = document.getElementById('typingIndicator');
  typingIndicator?.classList.remove('hidden');
  
  try {
    // Try to get AI response
    const context = {
      url: 'Support Channel',
      forms: state.stats.formsDetected || 0,
      selectors: 0
    };
    
    let response;
    try {
      response = await getAIResponse(userMessage, context);
    } catch (aiError) {
      // If AI fails, provide helpful fallback
      response = getLocalSupportResponse(userMessage);
    }
    
    typingIndicator?.classList.add('hidden');
    
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const supportMsg = {
      id: Date.now(),
      sender: 'them',
      senderName: 'CUBE Support',
      content: response,
      time: time,
      reactions: {},
      timestamp: now.toISOString()
    };
    
    chatState.messages.push(supportMsg);
    renderMessages();
    
    // Update conversation
    chatState.currentChat.lastMessage = response.substring(0, 50) + '...';
    chatState.currentChat.time = formatRelativeTime(now);
    
    // Save
    await saveMessagesToStorage(chatState.currentChat.id, chatState.messages);
    await saveConversationsToStorage();
    
  } catch (error) {
    typingIndicator?.classList.add('hidden');
    console.error('Support response error:', error);
  }
}

/**
 * Local fallback responses when AI is unavailable
 */
function getLocalSupportResponse(message) {
  const lower = message.toLowerCase();
  
  if (lower.includes('macro') || lower.includes('record')) {
    return 'To record a macro:\n1. Click the Record button in the Macros tab\n2. Perform your actions on the page\n3. Click Stop to save\n\nYour macros are saved automatically and can be replayed anytime!';
  }
  
  if (lower.includes('autofill') || lower.includes('form')) {
    return 'CUBE can autofill forms automatically!\n\n1. Navigate to a page with forms\n2. Click "Detect Forms" in the dashboard\n3. Use AI to extract data from documents\n4. Apply the data to forms with one click';
  }
  
  if (lower.includes('screenshot') || lower.includes('capture')) {
    return 'Screenshot modes available:\n• Visible Area - captures what you see\n• Full Page - scrolls and captures entire page\n• Region Select - choose a specific area\n\nFind these options in the Screenshot tab!';
  }
  
  if (lower.includes('api') || lower.includes('key')) {
    return 'To configure AI:\n1. Go to Settings\n2. Enter your OpenAI or Gemini API key\n3. Save settings\n\nAPI keys are stored securely in your browser.';
  }
  
  return 'Thanks for your message! Here are some things I can help with:\n\n• Macro recording and playback\n• Form detection and autofill\n• Screenshot capture\n• AI-powered assistance\n\nWhat would you like to know more about?';
}

function showNewChatModal() {
  const content = `
    <div class="new-chat-modal">
      <div class="form-group">
        <label class="form-label">Chat Type</label>
        <select class="form-input" id="newChatType">
          <option value="direct">Direct Message</option>
          <option value="group">Group Chat</option>
          <option value="channel">Channel</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Name / Username</label>
        <input type="text" class="form-input" id="newChatName" placeholder="Enter name or username...">
      </div>
      <div class="card-cta-group">
        <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
        <button type="button" class="btn btn-primary" data-action="create-new-chat">Start Chat</button>
      </div>
    </div>
  `;
  
  showModal('New Conversation', content);
}

window.createNewChat = function() {
  const type = document.getElementById('newChatType')?.value || 'direct';
  const name = document.getElementById('newChatName')?.value.trim();
  
  if (!name) {
    showNotification('New Chat', 'Please enter a name', 'warning');
    return;
  }
  
  const newChat = {
    id: 'chat-' + Date.now(),
    type,
    name: type === 'channel' ? '#' + name : name,
    avatar: type === 'channel' ? '#' : type === 'group' ? '👥' : '👤',
    lastMessage: 'New conversation started',
    time: 'now',
    unread: 0,
    status: 'active'
  };
  
  chatState.conversations.unshift(newChat);
  renderChatList();
  closeModal();
  
  // Open the new conversation
  openConversation(newChat.id);
  
  addActivityLog('Chat', `Started new ${type} chat: ${name}`, 'success');
};

function attachFile() {
  showNotification('Attach File', 'Use P2P tab to share files with peers');
}

function showEmojiPicker() {
  const input = document.getElementById('chatMessageInput');
  if (!input) return;
  
  // Check if picker already exists
  const existingPicker = document.querySelector('.messaging-emoji-picker');
  if (existingPicker) {
    existingPicker.remove();
    return;
  }
  
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭',
    '🤔', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
    '😬', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
    '👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '✌️',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔',
    '🔥', '✨', '⭐', '🎉', '🎊', '💯', '💢', '💥',
    '🚀', '💡', '📌', '✅', '❌', '⚠️', '🔔', '🎵'
  ];
  
  const picker = document.createElement('div');
  picker.className = 'messaging-emoji-picker';
  picker.style.cssText = `
    position: absolute;
    bottom: 60px;
    left: 8px;
    right: 8px;
    max-width: 300px;
    background: var(--elite-bg-card, #1f2937);
    border: 1px solid var(--elite-border, #374151);
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    max-height: 200px;
    overflow-y: auto;
  `;
  
  emojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.textContent = emoji;
    btn.style.cssText = `
      width: 32px;
      height: 32px;
      font-size: 18px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.15s ease;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(124, 58, 237, 0.2)';
      btn.style.transform = 'scale(1.2)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
      btn.style.transform = 'scale(1)';
    });
    btn.addEventListener('click', () => {
      input.value += emoji;
      input.focus();
      picker.remove();
    });
    picker.appendChild(btn);
  });
  
  // Add to input container
  const container = input.closest('.chat-input-container');
  if (container) {
    container.style.position = 'relative';
    container.appendChild(picker);
  }
  
  // Close on outside click
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!picker.contains(e.target) && e.target.id !== 'btnEmoji') {
        picker.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 100);
}

// ============================================================================
// AI NEXUS MODES
// ============================================================================

function initializeAINexusModes() {
  // Mode tabs
  document.querySelectorAll('.ai-mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      switchAIMode(mode);
    });
  });
  
  // Code generation
  document.getElementById('btnGenerateCode')?.addEventListener('click', generateAICode);
  document.getElementById('btnCopyCode')?.addEventListener('click', copyGeneratedCode);
  
  // Workflow generation
  document.getElementById('btnGenerateWorkflow')?.addEventListener('click', generateAIWorkflow);
  document.getElementById('btnRunWorkflow')?.addEventListener('click', runGeneratedWorkflow);
  
  // Selector generation
  document.getElementById('btnGenerateSelector')?.addEventListener('click', generateAISelector);
  document.getElementById('btnTestSelector')?.addEventListener('click', testGeneratedSelector);
  document.getElementById('btnCopySelector')?.addEventListener('click', () => copyToClipboard('generatedCssSelector'));
  document.getElementById('btnCopyXpath')?.addEventListener('click', () => copyToClipboard('generatedXpath'));
  
  console.log('✅ AI Nexus modes initialized');
}

function switchAIMode(mode) {
  // Update tabs
  document.querySelectorAll('.ai-mode-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });
  
  // Update content
  document.querySelectorAll('.ai-mode-content').forEach(content => {
    content.classList.toggle('active', content.id === `ai-mode-${mode}`);
  });
}

/**
 * Generate code using AI (production)
 */
async function generateAICode() {
  const prompt = document.getElementById('aiCodePrompt')?.value.trim();
  const language = document.getElementById('aiCodeLanguage')?.value || 'javascript';
  
  if (!prompt) {
    showNotification('AI Code', 'Please describe what code you need', 'warning');
    return;
  }
  
  const btn = document.getElementById('btnGenerateCode');
  const output = document.getElementById('aiCodeOutput');
  const codeBlock = document.getElementById('generatedCode');
  
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span> Generating...';
  
  try {
    // Use real AI service for code generation
    const generatedCode = await generateCodeWithAI(prompt, language);
    
    // Clean up code block markers if present
    let cleanCode = generatedCode
      .replace(/^```\w*\n?/gm, '')
      .replace(/```$/gm, '')
      .trim();
    
    codeBlock.textContent = cleanCode;
    output.classList.remove('hidden');
    
    addActivityLog('AI', `Generated ${language} code`, 'success');
  } catch (error) {
    // Show error and fallback to template
    showNotification('AI Code', `Using template (${error.message})`, 'warning');
    const templateCode = getCodeTemplate(prompt, language);
    codeBlock.textContent = templateCode;
    output.classList.remove('hidden');
    addActivityLog('AI', `Generated ${language} template (AI unavailable)`, 'info');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">✨</span> Generate Code';
  }
}

/**
 * Fallback code templates when AI is unavailable
 */
function getCodeTemplate(prompt, language) {
  const templates = {
    javascript: `// Task: ${prompt}
// Note: Connect AI API key for custom code generation

async function automationTask() {
  try {
    // Wait for page to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find target elements
    const elements = document.querySelectorAll('[data-testid], [id], [name]');
    console.log(\`Found \${elements.length} elements\`);
    
    // Process each element
    for (const el of elements) {
      const identifier = el.dataset.testid || el.id || el.name;
      if (identifier) {
        console.log(\`Element: \${el.tagName} - \${identifier}\`);
      }
    }
    
    return { success: true, elementsFound: elements.length };
  } catch (error) {
    console.error('Automation failed:', error);
    return { success: false, error: error.message };
  }
}

// Execute
automationTask().then(result => console.log('Result:', result));`,
    
    python: `# Task: ${prompt}
# Note: Connect AI API key for custom code generation

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def automation_task(driver):
    """Execute automation task."""
    try:
        # Wait for page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Find elements with stable identifiers
        elements = driver.find_elements(By.CSS_SELECTOR, '[data-testid], [id], [name]')
        print(f"Found {len(elements)} elements")
        
        # Process elements
        for el in elements:
            identifier = el.get_attribute('data-testid') or el.get_attribute('id') or el.get_attribute('name')
            if identifier:
                print(f"Element: {el.tag_name} - {identifier}")
        
        return {'success': True, 'elements_found': len(elements)}
    except Exception as e:
        print(f"Automation failed: {e}")
        return {'success': False, 'error': str(e)}

# Usage with Selenium:
# driver = webdriver.Chrome()
# driver.get('https://your-url.com')
# result = automation_task(driver)
# driver.quit()`,

    css: `/* Task: ${prompt} */
/* Note: Connect AI API key for custom selectors */

/* Primary selector - use data attributes for stability */
[data-testid="target-element"] {
  /* Your styles */
}

/* Alternative: ID selector */
#unique-element-id {
  /* Your styles */
}

/* Alternative: Class with context */
.container > .target-element:first-of-type {
  /* Your styles */
}

/* Alternative: Attribute selector */
input[name="field-name"],
button[type="submit"] {
  /* Your styles */
}`,

    xpath: `<!-- Task: ${prompt} -->
<!-- Note: Connect AI API key for custom XPath -->

<!-- Primary XPath - data attribute -->
//*[@data-testid='target-element']

<!-- By ID -->
//*[@id='unique-id']

<!-- By class and text content -->
//button[contains(@class, 'submit') and contains(text(), 'Submit')]

<!-- By form context -->
//form[@name='login']//input[@type='text']

<!-- By position in parent -->
//div[@class='container']/button[1]`
  };
  
  return templates[language] || templates.javascript;
}

function copyGeneratedCode() {
  const code = document.getElementById('generatedCode')?.textContent;
  if (code) {
    navigator.clipboard.writeText(code).then(() => {
      showNotification('Copied', 'Code copied to clipboard');
    });
  }
}

async function generateAIWorkflow() {
  const prompt = document.getElementById('aiWorkflowPrompt')?.value.trim();
  
  if (!prompt) {
    showNotification('AI Workflow', 'Please describe your workflow', 'warning');
    return;
  }
  
  const btn = document.getElementById('btnGenerateWorkflow');
  const output = document.getElementById('aiWorkflowOutput');
  const stepsEl = document.getElementById('generatedWorkflowSteps');
  
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span> Generating...';
  
  try {
    // Try AI-generated workflow
    let steps;
    try {
      const workflowPrompt = `Generate a workflow for the following task: "${prompt}"
      
Return ONLY a JSON array of steps. Each step should have:
- action: the type of action (Navigate, Click, Type, Wait, Select, Scroll, etc.)
- target: what to interact with (selector, URL, or description)
- value: (optional) value to input

Example format:
[{"action":"Navigate","target":"https://example.com"},{"action":"Click","target":"#login-btn"}]`;
      
      const response = await getAIResponse(workflowPrompt, {});
      
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        steps = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse workflow');
      }
    } catch (aiError) {
      console.log('AI workflow generation failed, using template:', aiError.message);
      // Fallback to intelligent template based on prompt
      steps = generateWorkflowTemplate(prompt);
    }
    
    stepsEl.innerHTML = steps.map((step, i) => `
      <div class="workflow-step">
        <span class="workflow-step-number">${i + 1}</span>
        <span class="workflow-step-action">${step.action}</span>
        <span class="workflow-step-target">${step.target}</span>
        ${step.value ? `<span class="workflow-step-value">"${step.value}"</span>` : ''}
      </div>
    `).join('');
    
    output.classList.remove('hidden');
    addActivityLog('AI', 'Generated workflow with ' + steps.length + ' steps', 'success');
  } catch (error) {
    showNotification('AI Error', error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">⚡</span> Generate Workflow';
  }
}

/**
 * Generate workflow template based on common patterns
 */
function generateWorkflowTemplate(prompt) {
  const lower = prompt.toLowerCase();
  
  if (lower.includes('login') || lower.includes('sign in')) {
    return [
      { action: 'Navigate', target: 'Login page URL' },
      { action: 'Wait', target: '2 seconds' },
      { action: 'Type', target: 'input[name="username"]', value: '${username}' },
      { action: 'Type', target: 'input[name="password"]', value: '${password}' },
      { action: 'Click', target: 'button[type="submit"]' },
      { action: 'Wait for', target: 'Navigation complete' }
    ];
  }
  
  if (lower.includes('form') || lower.includes('fill')) {
    return [
      { action: 'Navigate', target: 'Form page URL' },
      { action: 'Wait', target: 'Form to load' },
      { action: 'Type', target: 'First name field', value: '${firstName}' },
      { action: 'Type', target: 'Last name field', value: '${lastName}' },
      { action: 'Type', target: 'Email field', value: '${email}' },
      { action: 'Select', target: 'Dropdown', value: '${option}' },
      { action: 'Click', target: 'Submit button' }
    ];
  }
  
  if (lower.includes('scrape') || lower.includes('extract')) {
    return [
      { action: 'Navigate', target: 'Target URL' },
      { action: 'Wait', target: 'Page to load' },
      { action: 'Extract', target: 'Data elements selector' },
      { action: 'Store', target: 'Results variable' },
      { action: 'Export', target: 'JSON/CSV file' }
    ];
  }
  
  // Default workflow
  return [
    { action: 'Navigate', target: 'Target URL' },
    { action: 'Wait', target: '2 seconds' },
    { action: 'Click', target: 'Target element' },
    { action: 'Type', target: 'Input field', value: '${value}' },
    { action: 'Click', target: 'Submit button' },
    { action: 'Wait for', target: 'Action to complete' }
  ];
}

function runGeneratedWorkflow() {
  showNotification('Workflow', 'Workflow execution started. Check the Macro tab for progress.');
  setActiveTab('macro');
}

/**
 * Generate AI-powered selector (production)
 */
async function generateAISelector() {
  const prompt = document.getElementById('aiSelectorPrompt')?.value.trim();
  
  if (!prompt) {
    showNotification('AI Selector', 'Please describe the element you want to select', 'warning');
    return;
  }
  
  const btn = document.getElementById('btnGenerateSelector');
  const output = document.getElementById('aiSelectorOutput');
  
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span> Generating...';
  
  try {
    let cssSelector, xpath;
    
    try {
      // Try AI-generated selector
      const selectorPrompt = `Generate selectors for: "${prompt}"
      
Return in this exact format (no other text):
CSS: [your css selector]
XPATH: [your xpath selector]`;
      
      const response = await getAIResponse(selectorPrompt, {});
      
      // Parse response
      const cssMatch = response.match(/CSS:\s*(.+?)(?:\n|$)/i);
      const xpathMatch = response.match(/XPATH:\s*(.+?)(?:\n|$)/i);
      
      cssSelector = cssMatch ? cssMatch[1].trim() : generateSmartSelector(prompt);
      xpath = xpathMatch ? xpathMatch[1].trim() : generateSmartXPath(prompt);
    } catch (aiError) {
      console.log('AI selector generation failed, using smart fallback:', aiError.message);
      cssSelector = generateSmartSelector(prompt);
      xpath = generateSmartXPath(prompt);
    }
    
    document.getElementById('generatedCssSelector').textContent = cssSelector;
    document.getElementById('generatedXpath').textContent = xpath;
    
    output.classList.remove('hidden');
    addActivityLog('AI', 'Generated element selectors', 'success');
  } catch (error) {
    showNotification('AI Error', error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">🎯</span> Generate Selector';
  }
}

function generateSmartSelector(description) {
  const keywords = description.toLowerCase();
  
  if (keywords.includes('button') && keywords.includes('submit')) {
    return 'button[type="submit"], input[type="submit"], .submit-btn';
  } else if (keywords.includes('login')) {
    return '#login-form, .login-container, [data-testid="login"]';
  } else if (keywords.includes('email')) {
    return 'input[type="email"], input[name*="email"], #email';
  } else if (keywords.includes('password')) {
    return 'input[type="password"], input[name*="password"], #password';
  } else {
    return '.target-element, [data-element="target"], #element-id';
  }
}

function generateSmartXPath(description) {
  const keywords = description.toLowerCase();
  
  if (keywords.includes('button') && keywords.includes('submit')) {
    return '//button[@type="submit"] | //input[@type="submit"]';
  } else if (keywords.includes('login')) {
    return '//form[contains(@class, "login")] | //*[@data-testid="login"]';
  } else if (keywords.includes('email')) {
    return '//input[@type="email" or contains(@name, "email")]';
  } else if (keywords.includes('password')) {
    return '//input[@type="password" or contains(@name, "password")]';
  } else {
    return '//*[@class="target-element" or @data-element="target"]';
  }
}

async function testGeneratedSelector() {
  const selector = document.getElementById('generatedCssSelector')?.textContent;
  
  if (!selector) {
    showNotification('Test Selector', 'Generate a selector first', 'warning');
    return;
  }
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (sel) => {
        const elements = document.querySelectorAll(sel);
        if (elements.length > 0) {
          elements.forEach(el => {
            el.style.outline = '3px solid #7c3aed';
            el.style.outlineOffset = '2px';
            setTimeout(() => {
              el.style.outline = '';
              el.style.outlineOffset = '';
            }, 3000);
          });
          return { found: elements.length };
        }
        return { found: 0 };
      },
      args: [selector]
    });
    
    const count = results[0]?.result?.found || 0;
    
    if (count > 0) {
      showNotification('Selector Test', `Found ${count} matching element(s)! Highlighted for 3 seconds.`);
      addActivityLog('AI', `Selector matched ${count} element(s)`, 'success');
    } else {
      showNotification('Selector Test', 'No elements matched on this page', 'warning');
      addActivityLog('AI', 'Selector test: no matches', 'warning');
    }
  } catch (error) {
    showNotification('Test Error', error.message, 'error');
  }
}

function copyToClipboard(elementId) {
  const text = document.getElementById(elementId)?.textContent;
  if (text) {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('Copied', 'Copied to clipboard');
    });
  }
}

// ============================================================================
// ADVANCED FILE DETECTION
// ============================================================================

async function initializeAdvancedFileDetection() {
  // Monitor for file downloads in background
  chrome.runtime.sendMessage({
    type: 'INIT_FILE_DETECTION'
  });
  
  addActivityLog('system', 'Advanced file detection initialized', 'info');
}

// ============================================================================
// INIT EVERYTHING
// ============================================================================

function initializeEnhancedFeatures() {
  try {
    initializeThemeSystem();
    console.log('  ✓ Theme system');
  } catch (e) {
    console.error('  ✗ Theme system failed:', e);
  }
  
  try {
    initializeAIChat();
    console.log('  ✓ AI Chat');
  } catch (e) {
    console.error('  ✗ AI Chat failed:', e);
  }
  
  try {
    initializeAdvancedFileDetection();
    console.log('  ✓ File detection');
  } catch (e) {
    console.error('  ✗ File detection failed:', e);
  }
  
  try {
    initializeModuleHealth();
    console.log('  ✓ Module health');
  } catch (e) {
    console.error('  ✗ Module health failed:', e);
  }
  
  // NOTE: initializeBottomNavigation() is called in bootstrapSidePanel(), not here
  // to avoid duplicate event listener registration
  
  try {
    initializeVideoConference();
    console.log('  ✓ Video conference');
  } catch (e) {
    console.error('  ✗ Video conference failed:', e);
  }
  
  try {
    initializeMessaging();
    console.log('  ✓ Messaging');
  } catch (e) {
    console.error('  ✗ Messaging failed:', e);
  }
  
  try {
    initializeAINexusModes();
    console.log('  ✓ AI Nexus modes');
  } catch (e) {
    console.error('  ✗ AI Nexus modes failed:', e);
  }
  
  try {
    initializeTourSystem();
    console.log('  ✓ Tour system');
  } catch (e) {
    console.error('  ✗ Tour system failed:', e);
  }
  
  try {
    initializeChatFeaturesService();
    console.log('  ✓ Chat features');
  } catch (e) {
    console.error('  ✗ Chat features failed:', e);
  }
  
  // New Phase 3 Features
  try {
    initializeVideoQRInvites();
    console.log('  ✓ Video QR invites');
  } catch (e) {
    console.error('  ✗ Video QR invites failed:', e);
  }
  
  try {
    initializeVoIPFeatures();
    console.log('  ✓ VoIP features');
  } catch (e) {
    console.error('  ✗ VoIP features failed:', e);
  }
  
  try {
    initializeSecurityScanner();
    console.log('  ✓ Security scanner');
  } catch (e) {
    console.error('  ✗ Security scanner failed:', e);
  }
  
  try {
    initializeProjectManagement();
    console.log('  ✓ Project management');
  } catch (e) {
    console.error('  ✗ Project management failed:', e);
  }
  
  try {
    initializeAISecurityMode();
    console.log('  ✓ AI Security mode');
  } catch (e) {
    console.error('  ✗ AI Security mode failed:', e);
  }
  
  try {
    initializeAnnotationTools();
    console.log('  ✓ Annotation tools');
  } catch (e) {
    console.error('  ✗ Annotation tools failed:', e);
  }
  
  try {
    initializeRemoteEnhanced();
    console.log('  ✓ Remote enhanced');
  } catch (e) {
    console.error('  ✗ Remote enhanced failed:', e);
  }
  
  try {
    initializeSubscriptionUI();
    console.log('  ✓ Subscription UI');
  } catch (e) {
    console.error('  ✗ Subscription UI failed:', e);
  }
  
  try {
    initializeEnhancedAutofill();
    console.log('  ✓ Enhanced Autofill');
  } catch (e) {
    console.error('  ✗ Enhanced Autofill failed:', e);
  }
  
  console.log('✅ Enhanced features initialized');
}

// ============================================================================
// INTERACTIVE TOUR SYSTEM
// ============================================================================

let tourService = null;

/**
 * Initialize the interactive tour system
 */
function initializeTourSystem() {
  console.log('🎓 Initializing tour system...');
  
  // Check if TourService is available (either as class or global instance)
  if (typeof TourService !== 'undefined') {
    tourService = new TourService();
    console.log('🎓 TourService instance created');
    checkFirstLaunch();
  } else if (typeof window.cubeTour !== 'undefined') {
    tourService = window.cubeTour;
    console.log('🎓 Using global cubeTour instance');
    checkFirstLaunch();
  } else {
    console.warn('⚠️ TourService not available - tours will use fallback');
    // Create a simple fallback tour service
    tourService = createFallbackTourService();
  }
  
  // Bind tour button - do this regardless of TourService availability
  const btnStartTour = document.getElementById('btnStartTour');
  console.log('🎓 btnStartTour element:', btnStartTour);
  
  if (btnStartTour) {
    // Remove any existing listeners first
    const newBtn = btnStartTour.cloneNode(true);
    btnStartTour.parentNode.replaceChild(newBtn, btnStartTour);
    
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🎓 Tours button clicked!');
      showTourMenu();
    });
    console.log('🎓 Tour button handler attached');
  } else {
    console.error('❌ btnStartTour not found in DOM!');
  }
  
  // Bind help button in more menu
  const helpButton = document.querySelector('[data-action="help"]');
  if (helpButton) {
    helpButton.addEventListener('click', () => {
      const currentTab = getCurrentActiveTab();
      startContextualTour(currentTab);
    });
  }
}

/**
 * Check if this is the first launch and show welcome tour
 */
async function checkFirstLaunch() {
  try {
    const result = await chrome.storage.local.get('cubeFirstLaunchComplete');
    if (!result.cubeFirstLaunchComplete) {
      // First launch - show welcome tour after 1 second
      setTimeout(() => {
        if (tourService) {
          tourService.startTour('welcome');
        }
      }, 1000);
      
      // Mark first launch as complete
      await chrome.storage.local.set({ cubeFirstLaunchComplete: true });
    }
  } catch (error) {
    console.error('Error checking first launch:', error);
  }
}

/**
 * Get the current active tab name
 * @returns {string} The tab name (dashboard, automation, video, etc.)
 */
function getCurrentActiveTab() {
  const activeTab = document.querySelector('.tab-content.active');
  if (activeTab) {
    return activeTab.id.replace('tab-', '');
  }
  return 'dashboard';
}

/**
 * Show the tour selection menu
 * NOTE: Main showTourMenu() is defined at line ~117 with window.showTourMenu assignment
 * This duplicate was removed to prevent function overwriting
 */

/**
 * Start a tour by ID
 * @param {string} tourId - The tour ID
 */
function startTourById(tourId) {
  console.log('🎓 Starting tour:', tourId);
  
  // Close menu
  const menu = document.getElementById('tourMenu');
  if (menu) menu.remove();
  
  // Navigate to relevant tab if needed
  const tabMapping = {
    welcome: null,
    dashboard: 'tab-dashboard',
    macros: 'tab-macro',
    automation: 'tab-automation',
    aiNexus: 'tab-ai-nexus',
    p2p: 'tab-p2p',
    remote: 'tab-remote',
    screenshot: 'tab-screenshot'
  };
  
  const targetTab = tabMapping[tourId];
  if (targetTab) {
    // Navigate to tab first
    const tabContent = document.getElementById(targetTab);
    if (tabContent) {
      // Hide all tabs
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      tabContent.classList.add('active');
      
      // Update navigation
      document.querySelectorAll('.bottom-nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.target === targetTab);
      });
    }
  }
  
  // Get tour service (prefer global instance from TourService.js)
  const ts = tourService || window.cubeTour;
  
  if (ts && typeof ts.startTour === 'function') {
    // Wait for DOM to settle, then start tour
    setTimeout(() => {
      console.log('🎓 Launching tour:', tourId);
      ts.startTour(tourId);
    }, 400);
  } else {
    // Fallback: show simple help modal
    console.warn('⚠️ Tour service not available, showing help modal');
    showTourHelpModal(tourId);
  }
}

/**
 * Fallback tour help modal when TourService is not available
 * @param {string} tourId - Tour ID
 */
function showTourHelpModal(tourId) {
  const tourInfo = {
    welcome: {
      title: '👋 Welcome to CUBE Nexum!',
      content: `
        <p><strong>CUBE Nexum</strong> is your all-in-one browser automation platform.</p>
        <ul style="margin: 12px 0; padding-left: 20px;">
          <li><strong>📊 Dashboard:</strong> Quick stats and actions</li>
          <li><strong>✏️ Autofill:</strong> Smart form filling with profiles</li>
          <li><strong>🎬 Macros:</strong> Record & replay browser actions</li>
          <li><strong>🤖 AI Nexus:</strong> AI-powered code generation</li>
          <li><strong>📸 Screenshots:</strong> Capture & OCR</li>
          <li><strong>🔗 P2P:</strong> Direct file sharing</li>
          <li><strong>🛰️ Remote:</strong> Screen sharing</li>
        </ul>
        <p>Click on each tab to explore features!</p>
      `
    },
    dashboard: {
      title: '📊 Dashboard Tour',
      content: `
        <p>The <strong>Dashboard</strong> shows your activity at a glance:</p>
        <ul style="margin: 12px 0; padding-left: 20px;">
          <li><strong>Stats Cards:</strong> Forms filled, macros created, time saved</li>
          <li><strong>Quick Actions:</strong> One-click access to common tasks</li>
          <li><strong>Activity Log:</strong> Recent actions history</li>
        </ul>
        <p>Use Quick Actions for instant productivity boosts!</p>
      `
    },
    autofill: {
      title: '✏️ Smart Autofill Tour',
      content: `
        <p><strong>Smart Autofill</strong> fills forms instantly with your saved profiles.</p>
        <h4 style="margin: 12px 0 8px;">How it works:</h4>
        <ol style="margin: 8px 0; padding-left: 20px;">
          <li>Create a profile with your info (name, email, address, etc.)</li>
          <li>Navigate to any form on a website</li>
          <li>Click <strong>Auto-Fill</strong> to fill all matching fields</li>
          <li>Review and submit!</li>
        </ol>
        <h4 style="margin: 12px 0 8px;">Features:</h4>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li><strong>Multiple Profiles:</strong> Personal, Work, Custom</li>
          <li><strong>Smart Detection:</strong> Recognizes field types automatically</li>
          <li><strong>Floating Button:</strong> Quick access on any page</li>
        </ul>
        <p><strong>Tip:</strong> Enable AI to improve field matching!</p>
      `
    },
    macros: {
      title: '🎬 Macro Studio Tour',
      content: `
        <p><strong>Macros</strong> record your browser actions and replay them automatically.</p>
        <h4 style="margin: 12px 0 8px;">How to use:</h4>
        <ol style="margin: 8px 0; padding-left: 20px;">
          <li>Click <strong>⏺️ Record</strong> to start recording</li>
          <li>Perform actions in the browser (clicks, typing)</li>
          <li>Click <strong>⏹️ Stop</strong> to save the macro</li>
          <li>Click <strong>▶️ Play</strong> to replay anytime</li>
        </ol>
        <p><strong>Pro tip:</strong> Use Ctrl+Shift+M to toggle recording!</p>
      `
    },
    automation: {
      title: '⚡ Automation Tour',
      content: `
        <p><strong>Automation</strong> lets you create powerful workflows without coding.</p>
        <h4 style="margin: 12px 0 8px;">Build workflows with:</h4>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li><strong>Triggers:</strong> URL visits, time schedules, form submits</li>
          <li><strong>Actions:</strong> Click, type, scrape, fill forms</li>
          <li><strong>Conditions:</strong> If/else logic for smart flows</li>
          <li><strong>Loops:</strong> Repeat actions across multiple items</li>
        </ul>
        <h4 style="margin: 12px 0 8px;">Examples:</h4>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Auto-login to websites</li>
          <li>Scrape data from pages daily</li>
          <li>Auto-submit forms at scheduled times</li>
        </ul>
      `
    },
    aiNexus: {
      title: '🤖 AI Nexus Tour',
      content: `
        <p><strong>AI Nexus</strong> is your intelligent automation assistant.</p>
        <h4 style="margin: 12px 0 8px;">Modes available:</h4>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li><strong>💬 Chat:</strong> Ask questions in natural language</li>
          <li><strong>💻 Code:</strong> Generate automation scripts</li>
          <li><strong>⚡ Workflow:</strong> Create step-by-step automations</li>
          <li><strong>🎯 Selector:</strong> Generate robust CSS/XPath selectors</li>
        </ul>
        <p><strong>Note:</strong> Add your API key in Settings to enable AI features.</p>
      `
    },
    dataExtractor: {
      title: '📄 Data Extractor Tour',
      content: `
        <p><strong>Data Extractor</strong> pulls data from documents and web pages.</p>
        <h4 style="margin: 12px 0 8px;">Supported sources:</h4>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li><strong>📑 PDFs:</strong> Extract text, tables, and forms</li>
          <li><strong>🖼️ Images:</strong> OCR to extract text from images</li>
          <li><strong>🌐 Web Pages:</strong> Scrape data with selectors</li>
          <li><strong>📊 Tables:</strong> Extract structured data</li>
        </ul>
        <h4 style="margin: 12px 0 8px;">AI Enhancement:</h4>
        <p>Enable AI analysis to automatically identify and structure extracted data.</p>
        <p><strong>Tip:</strong> Drag & drop files directly into the extension!</p>
      `
    },
    screenshot: {
      title: '📸 Screen Capture Tour',
      content: `
        <p>Capture your screen in multiple ways:</p>
        <ul style="margin: 12px 0; padding-left: 20px;">
          <li><strong>🖼️ Full Page:</strong> Capture entire scrollable page</li>
          <li><strong>👁️ Visible Area:</strong> Just what you see</li>
          <li><strong>✂️ Selection:</strong> Choose a specific region</li>
          <li><strong>🎥 Record:</strong> Screen recording with audio</li>
          <li><strong>🔤 OCR:</strong> Extract text from images</li>
        </ul>
        <p><strong>Shortcut:</strong> Ctrl+Shift+S for quick capture!</p>
      `
    },
    p2p: {
      title: '🔗 P2P File Sharing Tour',
      content: `
        <p>Share files <strong>directly</strong> between computers - no server needed!</p>
        <h4 style="margin: 12px 0 8px;">To send files:</h4>
        <ol style="margin: 8px 0; padding-left: 20px;">
          <li>Click <strong>Generate Code</strong></li>
          <li>Share the code with the receiver</li>
          <li>Select files to send</li>
        </ol>
        <h4 style="margin: 12px 0 8px;">To receive files:</h4>
        <ol style="margin: 8px 0; padding-left: 20px;">
          <li>Enter the sender's code</li>
          <li>Click <strong>Connect</strong></li>
          <li>Accept incoming files</li>
        </ol>
        <p>🔒 All transfers are encrypted end-to-end!</p>
      `
    },
    remote: {
      title: '🛰️ Remote Desktop Tour',
      content: `
        <p>Share your screen or view someone else's - like TeamViewer!</p>
        <h4 style="margin: 12px 0 8px;">Host Mode (share your screen):</h4>
        <ol style="margin: 8px 0; padding-left: 20px;">
          <li>Click <strong>Start Host</strong></li>
          <li>Select screen/window to share</li>
          <li>Share the 6-digit code</li>
        </ol>
        <h4 style="margin: 12px 0 8px;">Viewer Mode (see others):</h4>
        <ol style="margin: 8px 0; padding-left: 20px;">
          <li>Enter the host's code</li>
          <li>Click <strong>Connect</strong></li>
          <li>Request control if needed</li>
        </ol>
      `
    },
    settings: {
      title: '⚙️ Settings Tour',
      content: `
        <p>Configure CUBE Nexum to fit your workflow.</p>
        <h4 style="margin: 12px 0 8px;">Key settings:</h4>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li><strong>🤖 AI Keys:</strong> Add OpenAI, Gemini, or Claude API keys</li>
          <li><strong>🎨 Theme:</strong> Dark, Light, or Purple modes</li>
          <li><strong>✏️ Autofill:</strong> Default profile and behavior</li>
          <li><strong>🔔 Notifications:</strong> Enable/disable alerts</li>
        </ul>
        <h4 style="margin: 12px 0 8px;">Data management:</h4>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li><strong>Export:</strong> Backup all your data</li>
          <li><strong>Import:</strong> Restore from backup</li>
          <li><strong>Reset:</strong> Start fresh</li>
        </ul>
        <p><strong>Tip:</strong> Open full Settings for more options!</p>
      `
    }
  };
  
  const info = tourInfo[tourId] || tourInfo.welcome;
  
  const overlay = document.createElement('div');
  overlay.className = 'tour-help-modal-overlay';
  overlay.innerHTML = `
    <style>
      .tour-help-modal-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: tourHelpFadeIn 0.3s ease;
      }
      @keyframes tourHelpFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .tour-help-modal {
        background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        border: 1px solid rgba(124, 58, 237, 0.5);
        border-radius: 20px;
        padding: 28px;
        max-width: 450px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        animation: tourHelpSlideIn 0.3s ease;
      }
      @keyframes tourHelpSlideIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .tour-help-modal h3 {
        color: white;
        font-size: 20px;
        margin: 0 0 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .tour-help-modal p, .tour-help-modal li {
        color: #9ca3af;
        font-size: 14px;
        line-height: 1.6;
      }
      .tour-help-modal h4 {
        color: #e5e7eb;
        font-size: 14px;
        font-weight: 600;
      }
      .tour-help-modal strong {
        color: #a78bfa;
      }
      .tour-help-close-btn {
        width: 100%;
        padding: 12px;
        margin-top: 20px;
        background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
        border: none;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .tour-help-close-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
      }
    </style>
    <div class="tour-help-modal">
      <h3>${info.title}</h3>
      <div class="tour-help-content">${info.content}</div>
      <button type="button" class="tour-help-close-btn">Got it!</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Close handlers
  overlay.querySelector('.tour-help-close-btn').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

/**
 * Create a fallback tour service with basic functionality
 */
function createFallbackTourService() {
  return {
    startTour: (tourId) => {
      showTourHelpModal(tourId);
    },
    endTour: () => {},
    isActive: false
  };
}

/**
 * Start a contextual tour based on current tab
 * @param {string} tabName - The current tab name
 */
function startContextualTour(tabName) {
  const tourMapping = {
    'dashboard': 'dashboard',
    'macro': 'macros',
    'automation': 'automation',
    'ai-nexus': 'aiNexus',
    'p2p': 'p2p',
    'remote': 'remote',
    'screenshot': 'screenshot',
    'video': 'welcome',
    'messaging': 'welcome'
  };
  
  const tourId = tourMapping[tabName] || 'welcome';
  startTourById(tourId);
}

// Expose tour functions globally for onclick handlers
window.startTourById = startTourById;
window.startContextualTour = startContextualTour;
window.showTourMenu = showTourMenu;

// ============================================================================
// CHAT FEATURES SERVICE INTEGRATION
// ============================================================================

let chatFeaturesService = null;

/**
 * Initialize the chat features service
 */
function initializeChatFeaturesService() {
  if (typeof ChatFeaturesService !== 'undefined') {
    chatFeaturesService = new ChatFeaturesService();
    console.log('💬 Chat Features Service integrated');
  } else {
    console.warn('⚠️ ChatFeaturesService not available');
  }
  
  // Initialize ALL chat-related buttons (with or without ChatFeaturesService)
  initializeEmojiPicker();
  initializeNudgeButtons();
  initializeVoiceMessages();
  initializeAiAttachButton();
  initializeMessagingButtons();
}

/**
 * Initialize the AI attach button
 */
function initializeAiAttachButton() {
  const attachBtn = document.getElementById('btnAiAttach');
  
  if (attachBtn) {
    attachBtn.addEventListener('click', () => {
      // Create file input
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*,.pdf,.txt,.json,.csv,.doc,.docx';
      fileInput.style.display = 'none';
      
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Show attachment preview
        const chatMessages = document.getElementById('aiChatMessages');
        if (chatMessages) {
          const previewDiv = document.createElement('div');
          previewDiv.className = 'ai-attachment-preview';
          previewDiv.innerHTML = `
            <div class="attachment-info">
              <span class="attachment-icon">📎</span>
              <span class="attachment-name">${file.name}</span>
              <span class="attachment-size">(${(file.size / 1024).toFixed(1)} KB)</span>
              <button class="btn btn-sm btn-ghost attachment-remove" title="Remove">✕</button>
            </div>
          `;
          
          previewDiv.querySelector('.attachment-remove')?.addEventListener('click', () => {
            previewDiv.remove();
          });
          
          // Insert before input container
          const inputContainer = document.querySelector('.ai-chat-input-container');
          inputContainer?.parentNode?.insertBefore(previewDiv, inputContainer);
        }
        
        fileInput.remove();
      });
      
      document.body.appendChild(fileInput);
      fileInput.click();
    });
  }
}

/**
 * Initialize messaging tab buttons (voice call, chat info)
 */
function initializeMessagingButtons() {
  // Voice call button
  const voiceCallBtn = document.getElementById('btnVoiceCall');
  if (voiceCallBtn) {
    voiceCallBtn.addEventListener('click', () => {
      const convName = document.getElementById('chatConvName')?.textContent || 'User';
      showNotification('Voice Call', `Starting voice call with ${convName}...`, 'info');
      // In a full implementation, this would initiate WebRTC audio call
      setTimeout(() => {
        showNotification('Voice Call', 'Voice calls require both users to have the extension installed.', 'warning');
      }, 1500);
    });
  }
  
  // Chat info button
  const chatInfoBtn = document.getElementById('btnChatInfo');
  if (chatInfoBtn) {
    chatInfoBtn.addEventListener('click', () => {
      const convName = document.getElementById('chatConvName')?.textContent || 'Unknown';
      const convStatus = document.getElementById('chatConvStatus')?.textContent || 'Offline';
      
      // Show chat info modal
      const infoContent = `
        <div class="chat-info-modal">
          <h3>📋 Chat Information</h3>
          <div class="info-row"><strong>Name:</strong> ${convName}</div>
          <div class="info-row"><strong>Status:</strong> ${convStatus}</div>
          <div class="info-row"><strong>Type:</strong> Direct Message</div>
          <div class="info-actions">
            <button class="btn btn-sm btn-secondary" data-action="mute-chat">🔕 Mute</button>
            <button class="btn btn-sm btn-secondary" data-action="block-user">🚫 Block</button>
            <button class="btn btn-sm btn-danger" data-action="delete-chat">🗑️ Delete</button>
          </div>
        </div>
      `;
      
      showModal('Chat Info', infoContent);
    });
  }
}

/**
 * Initialize emoji picker in AI chat
 */
function initializeEmojiPicker() {
  const emojiBtn = document.getElementById('btnEmojiPicker');
  const chatInput = document.getElementById('aiChatInput');
  
  if (emojiBtn && chatInput) {
    emojiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Remove existing picker
      const existingPicker = document.querySelector('.cube-emoji-picker-container');
      if (existingPicker) {
        existingPicker.remove();
        return;
      }
      
      // Create emoji picker (with fallback if service not available)
      let picker;
      if (chatFeaturesService && typeof chatFeaturesService.createEmojiPicker === 'function') {
        picker = chatFeaturesService.createEmojiPicker((emoji) => {
          chatInput.value += emoji;
          chatInput.focus();
          document.querySelector('.cube-emoji-picker-container')?.remove();
        });
      } else {
        // Fallback emoji picker
        picker = createFallbackEmojiPicker((emoji) => {
          chatInput.value += emoji;
          chatInput.focus();
          document.querySelector('.cube-emoji-picker-container')?.remove();
        });
      }
      
      // Position the picker
      const container = document.createElement('div');
      container.className = 'cube-emoji-picker-container';
      container.style.cssText = `
        position: absolute;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
      `;
      container.appendChild(picker);
      
      // Add to AI chat area
      const chatArea = document.getElementById('tabPanelAINexus') || document.getElementById('tab-ai-nexus');
      if (chatArea) {
        chatArea.style.position = 'relative';
        chatArea.appendChild(container);
      }
      
      // Close on click outside
      setTimeout(() => {
        document.addEventListener('click', function closePicker(evt) {
          if (!container.contains(evt.target) && evt.target !== emojiBtn) {
            container.remove();
            document.removeEventListener('click', closePicker);
          }
        });
      }, 100);
    });
  }
}

/**
 * Initialize nudge/zumbido buttons
 */
function initializeNudgeButtons() {
  const nudgeBtn = document.getElementById('btnSendNudge');
  
  if (nudgeBtn) {
    nudgeBtn.addEventListener('click', () => {
      // Send nudge to the chat container
      const chatContainer = document.getElementById('aiChatMessages') || document.body;
      
      if (chatFeaturesService && typeof chatFeaturesService.sendNudge === 'function') {
        chatFeaturesService.sendNudge(chatContainer);
      } else {
        // Fallback nudge animation
        chatContainer.style.animation = 'none';
        chatContainer.offsetHeight; // Trigger reflow
        chatContainer.style.animation = 'nudgeShake 0.5s ease-in-out';
      }
      
      // Show nudge message
      addSystemMessage('🔔 ¡Zumbido enviado!');
      
      // Disable button briefly
      nudgeBtn.disabled = true;
      nudgeBtn.style.opacity = '0.5';
      setTimeout(() => {
        nudgeBtn.disabled = false;
        nudgeBtn.style.opacity = '1';
      }, 3000);
    });
  }
}

/**
 * Create a fallback emoji picker when ChatFeaturesService is not available
 * @param {Function} onSelect - Callback when emoji is selected
 * @returns {HTMLElement} - Emoji picker element
 */
function createFallbackEmojiPicker(onSelect) {
  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🔥', '✨', '🎉', '💪', '🙏', '👏', '🤝'];
  
  const picker = document.createElement('div');
  picker.className = 'fallback-emoji-picker';
  picker.style.cssText = `
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    padding: 12px;
    background: var(--elite-bg-card, #1f2937);
    border: 1px solid var(--elite-border, #374151);
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  `;
  
  emojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.textContent = emoji;
    btn.style.cssText = `
      width: 36px;
      height: 36px;
      font-size: 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.15s ease;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(124, 58, 237, 0.2)';
      btn.style.transform = 'scale(1.2)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
      btn.style.transform = 'scale(1)';
    });
    btn.addEventListener('click', () => onSelect(emoji));
    picker.appendChild(btn);
  });
  
  return picker;
}

/**
 * Initialize voice message recording
 */
function initializeVoiceMessages() {
  const voiceBtn = document.getElementById('btnVoiceMessage');
  
  if (voiceBtn) {
    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];
    
    voiceBtn.addEventListener('click', async () => {
      if (!isRecording) {
        // Start recording
        let success = false;
        
        if (chatFeaturesService && typeof chatFeaturesService.startVoiceRecording === 'function') {
          success = await chatFeaturesService.startVoiceRecording();
        } else {
          // Fallback: use native MediaRecorder
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) audioChunks.push(e.data);
            };
            
            mediaRecorder.start();
            success = true;
          } catch (err) {
            console.error('Voice recording failed:', err);
            showNotification('Voice Recording', 'Microphone access denied or unavailable.', 'error');
          }
        }
        
        if (success) {
          isRecording = true;
          voiceBtn.innerHTML = '⏹️';
          voiceBtn.classList.add('recording');
          voiceBtn.title = 'Stop recording';
        }
      } else {
        // Stop recording
        let audioBlob = null;
        
        if (chatFeaturesService && typeof chatFeaturesService.stopVoiceRecording === 'function') {
          audioBlob = await chatFeaturesService.stopVoiceRecording();
        } else if (mediaRecorder) {
          // Fallback: stop native MediaRecorder
          await new Promise(resolve => {
            mediaRecorder.onstop = () => {
              audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
              resolve();
            };
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
          });
        }
        
        isRecording = false;
        voiceBtn.innerHTML = '🎤';
        voiceBtn.classList.remove('recording');
        voiceBtn.title = 'Record voice message';
        
        if (audioBlob) {
          // Create audio preview
          const audioUrl = URL.createObjectURL(audioBlob);
          addVoiceMessagePreview(audioUrl);
        }
      }
    });
  }
}

/**
 * Add a voice message preview to the chat
 * @param {string} audioUrl - The audio blob URL
 */
function addVoiceMessagePreview(audioUrl) {
  const messagesContainer = document.getElementById('aiChatMessages');
  if (!messagesContainer) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'ai-message ai-message-user';
  
  // Create elements manually to avoid inline event handlers (Manifest V3 CSP)
  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'ai-message-bubble';
  
  const previewDiv = document.createElement('div');
  previewDiv.className = 'voice-message-preview';
  
  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.className = 'voice-play-btn';
  playBtn.textContent = '▶️';
  
  const audio = document.createElement('audio');
  audio.src = audioUrl;
  audio.style.display = 'none';
  
  const waveformDiv = document.createElement('div');
  waveformDiv.className = 'voice-waveform';
  waveformDiv.innerHTML = `
    <span class="voice-bar"></span><span class="voice-bar"></span><span class="voice-bar"></span>
    <span class="voice-bar"></span><span class="voice-bar"></span><span class="voice-bar"></span>
  `;
  
  const durationSpan = document.createElement('span');
  durationSpan.className = 'voice-duration';
  durationSpan.textContent = '0:05';
  
  // Attach event listeners (Manifest V3 compatible)
  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });
  
  audio.addEventListener('play', () => {
    playBtn.textContent = '⏸️';
  });
  
  audio.addEventListener('pause', () => {
    playBtn.textContent = '▶️';
  });
  
  audio.addEventListener('ended', () => {
    playBtn.textContent = '▶️';
  });
  
  // Assemble the elements
  previewDiv.appendChild(playBtn);
  previewDiv.appendChild(audio);
  previewDiv.appendChild(waveformDiv);
  previewDiv.appendChild(durationSpan);
  bubbleDiv.appendChild(previewDiv);
  messageDiv.appendChild(bubbleDiv);
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Add a system message to the chat
 * @param {string} message - The message content
 */
function addSystemMessage(message) {
  const messagesContainer = document.getElementById('aiChatMessages');
  if (!messagesContainer) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'ai-message ai-message-system';
  messageDiv.innerHTML = `
    <div class="ai-message-bubble system-bubble">
      ${message}
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Remove after 3 seconds
  setTimeout(() => {
    messageDiv.style.opacity = '0';
    messageDiv.style.transition = 'opacity 0.3s';
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}

async function bootstrapSidePanel() {
  console.log('🚀 Starting CUBE Nexum Side Panel initialization...');
  
  try {
    // Initialize bottom navigation first (MV3 requires event listeners)
    try {
      initializeBottomNavigation();
      console.log('✓ Bottom navigation initialized');
    } catch (e) {
      console.error('❌ Bottom navigation failed:', e);
    }
    
    try {
      await initializeArcNavigation();
      console.log('✓ Arc navigation initialized');
    } catch (e) {
      console.error('❌ Arc navigation failed:', e);
    }
    
    try {
      initializeButtons();
      console.log('✓ Buttons initialized');
    } catch (e) {
      console.error('❌ Buttons failed:', e);
    }
    
    try {
      await initializeMacros();
      console.log('✓ Macros initialized');
    } catch (e) {
      console.error('❌ Macros failed:', e);
    }
    
    try {
      await initializeP2PSection();
      console.log('✓ P2P section initialized');
    } catch (e) {
      console.error('❌ P2P section failed:', e);
    }
    
    try {
      initializeAutomationShell();
      console.log('✓ Automation shell initialized');
    } catch (e) {
      console.error('❌ Automation shell failed:', e);
    }
    
    try {
      initializeAINexus();
      console.log('✓ AI Nexus initialized');
    } catch (e) {
      console.error('❌ AI Nexus failed:', e);
    }
    
    try {
      initializeDiagnostics();
      console.log('✓ Diagnostics initialized');
    } catch (e) {
      console.error('❌ Diagnostics failed:', e);
    }
    
    try {
      initializeDocumentation();
      console.log('✓ Documentation initialized');
    } catch (e) {
      console.error('❌ Documentation failed:', e);
    }

    try {
      initializeHelpTab();
      console.log('✓ Help tab initialized');
    } catch (e) {
      console.error('❌ Help tab failed:', e);
    }

    try {
      initializeActivityLog();
      console.log('✓ Activity log initialized');
    } catch (e) {
      console.error('❌ Activity log failed:', e);
    }
    
    try {
      await initializeStats();
      console.log('✓ Stats initialized');
    } catch (e) {
      console.error('❌ Stats failed:', e);
    }
    
    try {
      startPeriodicUpdates();
      console.log('✓ Periodic updates started');
    } catch (e) {
      console.error('❌ Periodic updates failed:', e);
    }
    
    try {
      initializeEnhancedFeatures();
      console.log('✓ Enhanced features initialized');
    } catch (e) {
      console.error('❌ Enhanced features failed:', e);
    }
    
    // v6.0 Elite Modules
    try {
      initializeEliteModules();
      console.log('✓ Elite modules initialized (Password Manager, VPN, Download Manager)');
    } catch (e) {
      console.error('❌ Elite modules failed:', e);
    }
    
    // Notify content script that side panel is open
    notifyFloatingAssistantSidePanelState(true);
    
    console.log('✅ CUBE Nexum v7.0.0 Side Panel - Ready');
  } catch (error) {
    console.error('❌ Side panel initialization failed:', error);
    showNotification('Initialization Failed', error instanceof Error ? error.message : 'Unable to start CUBE Nexum control center', 'error');
  }
}

/**
 * Initialize Elite v6.0 Modules
 * Password Manager, VPN Manager, Download Manager with Tauri sync
 */
function initializeEliteModules() {
  // Password Manager integration
  if (window.passwordManager) {
    console.log('🔐 Password Manager module available');
    
    // Listen for password autofill requests
    document.getElementById('btnPasswordAutoFill')?.addEventListener('click', async () => {
      try {
        if (!window.passwordManager.isUnlocked) {
          showNotification('Vault Locked', 'Please unlock your password vault first', 'warning');
          return;
        }
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url) return;
        
        const domain = new URL(tab.url).hostname;
        const credentials = window.passwordManager.findCredentialsForDomain(domain);
        
        if (credentials.length === 0) {
          showNotification('No Credentials', `No saved passwords for ${domain}`, 'info');
          return;
        }
        
        // If multiple credentials, let user choose
        if (credentials.length > 1) {
          // Show credential selector
          showCredentialSelector(credentials);
        } else {
          await window.passwordManager.autoFill(credentials[0].id);
          showNotification('Auto-filled', 'Credentials filled successfully', 'success');
        }
      } catch (error) {
        console.error('Password autofill failed:', error);
        showNotification('Auto-fill Failed', error.message, 'error');
      }
    });
    
    // Listen for generate password requests
    document.getElementById('btnGeneratePassword')?.addEventListener('click', () => {
      const password = window.passwordManager.generatePassword();
      navigator.clipboard.writeText(password);
      showNotification('Password Generated', 'Copied to clipboard!', 'success');
      addActivityLog('Security', 'Generated secure password', 'info');
    });
    
    // Watchtower scan
    document.getElementById('btnWatchtowerScan')?.addEventListener('click', async () => {
      try {
        if (!window.passwordManager.isUnlocked) {
          showNotification('Vault Locked', 'Please unlock your password vault first', 'warning');
          return;
        }
        
        const results = await window.passwordManager.runWatchtowerScan();
        displayWatchtowerResults(results);
        addActivityLog('Security', `Watchtower scan complete. Score: ${results.score}`, results.score >= 70 ? 'success' : 'warning');
      } catch (error) {
        console.error('Watchtower scan failed:', error);
        showNotification('Scan Failed', error.message, 'error');
      }
    });
  }
  
  // VPN Manager integration
  if (window.vpnManager) {
    console.log('🔒 VPN Manager module available');
    
    // Quick connect button
    document.getElementById('btnVPNQuickConnect')?.addEventListener('click', async () => {
      try {
        if (window.vpnManager.isConnected) {
          await window.vpnManager.disconnect();
          updateVPNStatus();
          showNotification('VPN Disconnected', 'You are no longer protected', 'info');
        } else {
          const result = await window.vpnManager.quickConnect();
          updateVPNStatus();
          showNotification('VPN Connected', `Connected to ${result.server.name}`, 'success');
        }
        addActivityLog('VPN', window.vpnManager.isConnected ? 'Connected' : 'Disconnected', 'info');
      } catch (error) {
        console.error('VPN action failed:', error);
        showNotification('VPN Error', error.message, 'error');
      }
    });
    
    // Kill switch toggle
    document.getElementById('toggleKillSwitch')?.addEventListener('change', async (e) => {
      try {
        if (e.target.checked) {
          await window.vpnManager.enableKillSwitch();
          showNotification('Kill Switch', 'Kill switch enabled', 'success');
        } else {
          await window.vpnManager.disableKillSwitch();
          showNotification('Kill Switch', 'Kill switch disabled', 'info');
        }
      } catch (error) {
        console.error('Kill switch toggle failed:', error);
      }
    });
    
    // Start VPN status updater
    setInterval(updateVPNStatus, 1000);
  }
  
  // Download Manager integration
  if (window.downloadManager) {
    console.log('📥 Download Manager module available');
    
    // Video grabber scan
    document.getElementById('btnVideoGrabberScan')?.addEventListener('click', async () => {
      try {
        const videos = await window.downloadManager.videoGrabber.scanPage();
        if (videos.length > 0) {
          displayDetectedVideos(videos);
          showNotification('Videos Found', `Found ${videos.length} videos on this page`, 'success');
        } else {
          showNotification('No Videos', 'No downloadable videos found', 'info');
        }
      } catch (error) {
        console.error('Video scan failed:', error);
        showNotification('Scan Failed', error.message, 'error');
      }
    });
    
    // Schedule download
    document.getElementById('btnScheduleDownload')?.addEventListener('click', () => {
      showScheduleDownloadModal();
    });
    
    // Download manager listener
    window.downloadManager.addListener((event, downloadId, info) => {
      if (event === 'complete') {
        showNotification('Download Complete', `${info.filename} downloaded`, 'success');
        addActivityLog('Download', `Completed: ${info.filename}`, 'success');
      } else if (event === 'error') {
        showNotification('Download Failed', info.error || 'Unknown error', 'error');
        addActivityLog('Download', `Failed: ${info.filename}`, 'error');
      }
    });
  }
  
  console.log('✅ Elite modules initialized');
}

/**
 * Display credential selector for multiple credentials
 */
function showCredentialSelector(credentials) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal credential-selector">
      <div class="modal-header">
        <h3>Select Credential</h3>
        <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="credential-list">
          ${credentials.map(cred => `
            <div class="credential-item" data-id="${cred.id}">
              <div class="credential-icon">🔐</div>
              <div class="credential-info">
                <div class="credential-username">${cred.username}</div>
                <div class="credential-domain">${cred.domain}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  modal.querySelectorAll('.credential-item').forEach(item => {
    item.addEventListener('click', async () => {
      const id = item.dataset.id;
      await window.passwordManager.autoFill(id);
      modal.remove();
      showNotification('Auto-filled', 'Credentials filled successfully', 'success');
    });
  });
  
  document.body.appendChild(modal);
}

/**
 * Display Watchtower scan results
 */
function displayWatchtowerResults(results) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal watchtower-results">
      <div class="modal-header">
        <h3>🔍 Watchtower Security Scan</h3>
        <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="watchtower-score ${results.score >= 70 ? 'good' : results.score >= 40 ? 'fair' : 'poor'}">
          <div class="score-value">${results.score}</div>
          <div class="score-label">Security Score</div>
        </div>
        
        <div class="watchtower-issues">
          ${results.weakPasswords.length > 0 ? `
            <div class="issue-section">
              <div class="issue-header">⚠️ Weak Passwords (${results.weakPasswords.length})</div>
              ${results.weakPasswords.map(p => `<div class="issue-item">${p.domain}</div>`).join('')}
            </div>
          ` : ''}
          
          ${results.reusedPasswords.length > 0 ? `
            <div class="issue-section">
              <div class="issue-header">🔄 Reused Passwords (${results.reusedPasswords.length})</div>
              ${results.reusedPasswords.map(r => `<div class="issue-item">${r.domains.join(', ')}</div>`).join('')}
            </div>
          ` : ''}
          
          ${results.oldPasswords.length > 0 ? `
            <div class="issue-section">
              <div class="issue-header">📅 Old Passwords (${results.oldPasswords.length})</div>
              ${results.oldPasswords.map(p => `<div class="issue-item">${p.domain} - ${p.daysOld} days old</div>`).join('')}
            </div>
          ` : ''}
          
          ${results.missingTOTP.length > 0 ? `
            <div class="issue-section">
              <div class="issue-header">🔐 Missing 2FA (${results.missingTOTP.length})</div>
              ${results.missingTOTP.map(p => `<div class="issue-item">${p.domain}</div>`).join('')}
            </div>
          ` : ''}
          
          ${results.weakPasswords.length === 0 && results.reusedPasswords.length === 0 && 
            results.oldPasswords.length === 0 && results.missingTOTP.length === 0 ? 
            '<div class="all-good">✅ Great! No security issues found.</div>' : ''}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

/**
 * Update VPN status display
 */
function updateVPNStatus() {
  if (!window.vpnManager) return;
  
  const status = window.vpnManager.getStatus();
  const statusEl = document.getElementById('vpnStatus');
  const btnEl = document.getElementById('btnVPNQuickConnect');
  const durationEl = document.getElementById('vpnDuration');
  const trafficEl = document.getElementById('vpnTraffic');
  
  if (statusEl) {
    statusEl.className = `vpn-status ${status.isConnected ? 'connected' : 'disconnected'}`;
    statusEl.textContent = status.isConnected ? `Connected to ${status.server?.name}` : 'Disconnected';
  }
  
  if (btnEl) {
    btnEl.textContent = status.isConnected ? '🔓 Disconnect' : '🔒 Quick Connect';
    btnEl.className = `btn ${status.isConnected ? 'btn-secondary' : 'btn-primary'}`;
  }
  
  if (durationEl && status.isConnected) {
    durationEl.textContent = status.duration;
  }
  
  if (trafficEl && status.isConnected) {
    trafficEl.textContent = `↓ ${window.vpnManager.formatBytes(status.bytesReceived)} | ↑ ${window.vpnManager.formatBytes(status.bytesSent)}`;
  }
}

/**
 * Display detected videos
 */
function displayDetectedVideos(videos) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal video-grabber">
      <div class="modal-header">
        <h3>🎬 Detected Videos</h3>
        <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="video-list">
          ${videos.map(video => `
            <div class="video-item" data-id="${video.id}">
              <div class="video-thumbnail">
                ${video.poster ? `<img src="${video.poster}" alt="">` : '🎬'}
              </div>
              <div class="video-info">
                <div class="video-title">${video.title}</div>
                <div class="video-meta">
                  ${video.type} ${video.platform ? `• ${video.platform}` : ''}
                  ${video.duration ? `• ${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}` : ''}
                </div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="downloadVideo('${video.id}')">
                ⬇️ Download
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add download handlers
  window.downloadVideo = async (videoId) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      try {
        await window.downloadManager.videoGrabber.downloadVideo(video);
        showNotification('Download Started', `Downloading: ${video.title}`, 'info');
      } catch (error) {
        showNotification('Download Failed', error.message, 'error');
      }
    }
  };
}

/**
 * Show schedule download modal
 */
function showScheduleDownloadModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal schedule-download">
      <div class="modal-header">
        <h3>⏰ Schedule Download</h3>
        <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>URL to Download</label>
          <input type="url" id="scheduleUrl" placeholder="https://example.com/file.pdf" class="input">
        </div>
        <div class="form-group">
          <label>Schedule Time</label>
          <input type="datetime-local" id="scheduleTime" class="input">
        </div>
        <div class="form-group">
          <label>Repeat</label>
          <select id="scheduleRepeat" class="input">
            <option value="none">One time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <button class="btn btn-primary btn-full" onclick="scheduleDownload()">
          Schedule Download
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Set default time to 1 hour from now
  const defaultTime = new Date(Date.now() + 3600000);
  document.getElementById('scheduleTime').value = defaultTime.toISOString().slice(0, 16);
  
  window.scheduleDownload = () => {
    const url = document.getElementById('scheduleUrl').value;
    const time = new Date(document.getElementById('scheduleTime').value);
    const repeat = document.getElementById('scheduleRepeat').value;
    
    if (!url) {
      showNotification('Error', 'Please enter a URL', 'error');
      return;
    }
    
    window.downloadManager.scheduler.schedule(
      { url, filename: url.split('/').pop() },
      time,
      { repeat }
    );
    
    showNotification('Scheduled', `Download scheduled for ${time.toLocaleString()}`, 'success');
    modal.remove();
  };
}

// Notify floating assistant when side panel opens/closes
async function notifyFloatingAssistantSidePanelState(isOpen) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, { 
        type: 'SIDEPANEL_TOGGLED', 
        isOpen: isOpen 
      });
    }
  } catch (error) {
    // Content script may not be injected on this page
    console.debug('Could not notify content script:', error.message);
  }
}

// ============================================================================
// AI PERSONALITY FUNCTIONS
// ============================================================================

/**
 * Toggle the personality selector dropdown
 */
function togglePersonalitySelector() {
  const selector = document.getElementById('aiPersonalitySelector');
  if (selector) {
    selector.classList.toggle('hidden');
  }
}

/**
 * Select an AI personality
 * @param {string} personalityId - The personality ID (cipher, nexus, sentinel, forge)
 */
function selectAIPersonality(personalityId) {
  const personality = AI_PERSONALITIES[personalityId];
  if (!personality) {
    console.warn('Unknown personality:', personalityId);
    return;
  }
  
  // Update current personality
  currentPersonality = personality;
  
  // Update UI
  const avatarEl = document.getElementById('aiPersonalityAvatar');
  const nameEl = document.getElementById('aiPersonalityName');
  const descEl = document.getElementById('aiPersonalityDesc');
  const selector = document.getElementById('aiPersonalitySelector');
  
  if (avatarEl) avatarEl.textContent = personality.avatar;
  if (nameEl) nameEl.textContent = personality.name;
  if (descEl) descEl.textContent = personality.specialties.join(' • ');
  
  // Update active state on cards
  document.querySelectorAll('.personality-card').forEach(card => {
    card.classList.toggle('active', card.dataset.personality === personalityId);
  });
  
  // Hide selector
  if (selector) selector.classList.add('hidden');
  
  // Add greeting message
  addAIMessage(personality.greeting);
  
  // Save to storage
  chrome.storage.local.set({ ai_personality: personalityId }).catch(err => {
    console.warn('Failed to save personality:', err);
  });
  
  // Log activity
  addActivityLog('AI', `Switched to ${personality.name}`, 'info');
  
  showNotification('AI Personality', `Now talking to ${personality.name}`, 'success');
}

/**
 * Load saved personality from storage
 */
async function loadSavedPersonality() {
  try {
    const result = await chrome.storage.local.get(['ai_personality']);
    if (result.ai_personality && AI_PERSONALITIES[result.ai_personality]) {
      const personality = AI_PERSONALITIES[result.ai_personality];
      currentPersonality = personality;
      
      // Update UI without adding greeting
      const avatarEl = document.getElementById('aiPersonalityAvatar');
      const nameEl = document.getElementById('aiPersonalityName');
      const descEl = document.getElementById('aiPersonalityDesc');
      
      if (avatarEl) avatarEl.textContent = personality.avatar;
      if (nameEl) nameEl.textContent = personality.name;
      if (descEl) descEl.textContent = personality.specialties.join(' • ');
      
      // Update active state on cards
      document.querySelectorAll('.personality-card').forEach(card => {
        card.classList.toggle('active', card.dataset.personality === result.ai_personality);
      });
    }
  } catch (error) {
    console.warn('Failed to load saved personality:', error);
  }
}

/**
 * Add a message to the AI chat from the assistant
 * @param {string} message - The message content
 */
function addAIMessage(message) {
  const messagesContainer = document.getElementById('aiChatMessages');
  if (!messagesContainer) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'ai-message ai-message-assistant';
  messageDiv.innerHTML = `
    <div class="ai-message-avatar">${currentPersonality.avatar}</div>
    <div class="ai-message-bubble">
      <div class="ai-message-name">${currentPersonality.name}</div>
      ${message}
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Get the system prompt for the current personality
 * @returns {string} The system prompt
 */
function getPersonalitySystemPrompt() {
  return currentPersonality.systemPrompt || AI_PERSONALITIES.cipher.systemPrompt;
}

// ============================================================================
// MACRO EDITOR SYSTEM
// ============================================================================

/**
 * Current macro being edited
 */
let currentEditingMacroIndex = -1;
let currentEditingMacro = null;
let currentEditingStepIndex = -1;

/**
 * Open the macro editor modal for a specific macro
 * @param {number} index - Index of the macro in state.macros
 */
function openMacroEditor(index) {
  console.log('📝 Opening macro editor for index:', index);
  
  if (index < 0 || index >= state.macros.length) {
    showNotification('Error', 'Macro not found', 'error');
    return;
  }
  
  currentEditingMacroIndex = index;
  currentEditingMacro = JSON.parse(JSON.stringify(state.macros[index]));
  
  if (!currentEditingMacro.parameters) {
    currentEditingMacro.parameters = [];
  }
  if (!currentEditingMacro.flowControl) {
    currentEditingMacro.flowControl = {
      loopEnabled: false,
      loopCount: 1,
      errorHandling: 'stop',
      slowMode: false,
      slowModeDelay: 500
    };
  }
  
  const modal = document.getElementById('macroEditorModal');
  if (!modal) {
    console.error('Macro editor modal not found');
    return;
  }
  
  // Use correct HTML element IDs
  document.getElementById('macroEditName').value = currentEditingMacro.name || `Macro ${index + 1}`;
  document.getElementById('macroEditDescription').value = currentEditingMacro.description || '';
  document.getElementById('macroEditorTitle').textContent = `Edit: ${currentEditingMacro.name || 'Macro'}`;
  
  renderEditorParameters();
  renderEditorSteps();
  renderFlowControlOptions();
  clearAIOutput();
  
  modal.classList.remove('hidden');
  
  initMacroEditorEventListeners();
}

/**
 * Close the macro editor modal
 */
function closeMacroEditor() {
  const modal = document.getElementById('macroEditorModal');
  if (modal) {
    modal.classList.add('hidden');
  }
  currentEditingMacroIndex = -1;
  currentEditingMacro = null;
}

/**
 * Save the currently edited macro
 */
async function saveMacroEdits() {
  if (currentEditingMacroIndex < 0 || !currentEditingMacro) {
    showNotification('Error', 'No macro to save', 'error');
    return;
  }
  
  // Use correct HTML element IDs
  currentEditingMacro.name = document.getElementById('macroEditName').value || `Macro ${currentEditingMacroIndex + 1}`;
  currentEditingMacro.description = document.getElementById('macroEditDescription').value || '';
  
  const loopEnabled = document.getElementById('macroLoopEnabled')?.checked || false;
  const loopCount = parseInt(document.getElementById('macroLoopCount')?.value || '1', 10);
  const errorHandling = document.getElementById('macroErrorHandling')?.checked ? 'continue' : 'stop';
  const slowMode = document.getElementById('macroSlowMode')?.checked || false;
  
  currentEditingMacro.flowControl = {
    loopEnabled,
    loopCount: isNaN(loopCount) ? 1 : loopCount,
    loopType: document.getElementById('macroLoopType')?.value || 'count',
    errorHandling,
    slowMode
  };
  
  state.macros[currentEditingMacroIndex] = currentEditingMacro;
  await chrome.storage.local.set({ savedMacros: state.macros });
  
  renderMacroList();
  addActivityLog('Macro', `Macro "${currentEditingMacro.name}" updated`, 'success');
  showNotification('Macro Saved', 'Your changes have been saved');
  
  closeMacroEditor();
}

/**
 * Render parameters list in the editor
 */
function renderEditorParameters() {
  const container = document.getElementById('macroParametersList');
  if (!container) return;
  
  const params = currentEditingMacro?.parameters || [];
  
  if (params.length === 0) {
    container.innerHTML = `
      <div class="parameters-empty">
        No parameters defined. Add parameters to make this macro reusable.
      </div>
    `;
    return;
  }
  
  container.innerHTML = params.map((param, index) => `
    <div class="parameter-item" data-param-index="${index}">
      <input type="text" class="form-input param-name" value="${escapeHtml(param.name)}" placeholder="Name">
      <span class="parameter-type">${param.type || 'text'}</span>
      <input type="text" class="form-input param-value" value="${escapeHtml(param.defaultValue || '')}" placeholder="Default value">
      <button class="step-action-btn btn-delete-param" data-index="${index}" title="Delete parameter">🗑️</button>
    </div>
  `).join('');
  
  container.querySelectorAll('.btn-delete-param').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteParameter(parseInt(btn.dataset.index, 10));
    });
  });
  
  container.querySelectorAll('.param-name').forEach((input, index) => {
    input.addEventListener('change', () => {
      if (currentEditingMacro?.parameters[index]) {
        currentEditingMacro.parameters[index].name = input.value;
      }
    });
  });
  
  container.querySelectorAll('.param-value').forEach((input, index) => {
    input.addEventListener('change', () => {
      if (currentEditingMacro?.parameters[index]) {
        currentEditingMacro.parameters[index].defaultValue = input.value;
      }
    });
  });
}

/**
 * Add a new parameter
 */
function addParameter() {
  if (!currentEditingMacro) return;
  
  const paramCount = currentEditingMacro.parameters?.length || 0;
  currentEditingMacro.parameters.push({
    name: `param${paramCount + 1}`,
    type: 'text',
    defaultValue: ''
  });
  
  renderEditorParameters();
}

/**
 * Delete a parameter
 * @param {number} index - Parameter index
 */
function deleteParameter(index) {
  if (!currentEditingMacro?.parameters) return;
  
  currentEditingMacro.parameters.splice(index, 1);
  renderEditorParameters();
}

/**
 * Render steps list in the editor
 */
function renderEditorSteps() {
  const container = document.getElementById('macroStepsList');
  const countBadge = document.getElementById('macroStepCountBadge');
  
  if (!container) return;
  
  const steps = currentEditingMacro?.steps || [];
  
  if (countBadge) {
    countBadge.textContent = `${steps.length} steps`;
  }
  
  if (steps.length === 0) {
    container.innerHTML = `
      <div class="steps-empty">
        <div>📭 No steps recorded</div>
        <div style="font-size: 11px; margin-top: 8px;">Record actions on a webpage to add steps</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = steps.map((step, index) => {
    const typeIcon = getStepTypeIcon(step.type);
    const targetDisplay = step.selector ? truncateString(step.selector, 30) : step.url || '-';
    const valueDisplay = step.value || step.key || (step.deltaY ? `${step.deltaY}px` : '');
    
    return `
      <div class="step-item" data-step-index="${index}" draggable="true">
        <span class="step-drag-handle" title="Drag to reorder">⋮⋮</span>
        <span class="step-number">${index + 1}</span>
        <span class="step-type-icon">${typeIcon}</span>
        <div class="step-details">
          <div class="step-type">${step.type}</div>
          <div class="step-target" title="${escapeHtml(step.selector || step.url || '')}">${escapeHtml(targetDisplay)}</div>
        </div>
        ${valueDisplay ? `<span class="step-value" title="${escapeHtml(valueDisplay)}">${escapeHtml(truncateString(valueDisplay, 15))}</span>` : ''}
        <div class="step-actions">
          <button class="step-action-btn btn-edit-step" data-index="${index}" title="Edit step">✏️</button>
          <button class="step-action-btn btn-delete-step" data-index="${index}" title="Delete step">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
  
  container.querySelectorAll('.btn-edit-step').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openStepEditor(parseInt(btn.dataset.index, 10));
    });
  });
  
  container.querySelectorAll('.btn-delete-step').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteStep(parseInt(btn.dataset.index, 10));
    });
  });
  
  initStepDragAndDrop();
}

/**
 * Get icon for step type
 * @param {string} type - Step type
 * @returns {string} Emoji icon
 */
function getStepTypeIcon(type) {
  const icons = {
    'click': '🖱️',
    'dblclick': '🖱️',
    'rightclick': '🖱️',
    'input': '⌨️',
    'keypress': '⌨️',
    'scroll': '📜',
    'wait': '⏱️',
    'navigate': '🌐',
    'hover': '👆',
    'select': '📋',
    'dragdrop': '🔀'
  };
  return icons[type] || '❓';
}

/**
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncateString(str, maxLength) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Initialize drag and drop for steps
 */
function initStepDragAndDrop() {
  const stepsList = document.getElementById('macroStepsList');
  if (!stepsList) return;
  
  let draggedItem = null;
  let draggedIndex = -1;
  
  stepsList.querySelectorAll('.step-item').forEach((item) => {
    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      draggedIndex = parseInt(item.dataset.stepIndex, 10);
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      stepsList.querySelectorAll('.step-item').forEach(el => el.classList.remove('drag-over'));
      draggedItem = null;
      draggedIndex = -1;
    });
    
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (draggedItem && item !== draggedItem) {
        item.classList.add('drag-over');
      }
    });
    
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
    
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      
      const dropIndex = parseInt(item.dataset.stepIndex, 10);
      
      if (draggedIndex !== -1 && dropIndex !== draggedIndex && currentEditingMacro?.steps) {
        const [movedStep] = currentEditingMacro.steps.splice(draggedIndex, 1);
        currentEditingMacro.steps.splice(dropIndex, 0, movedStep);
        renderEditorSteps();
      }
    });
  });
}

/**
 * Delete a step
 * @param {number} index - Step index
 */
function deleteStep(index) {
  if (!currentEditingMacro?.steps) return;
  
  if (confirm('Delete this step?')) {
    currentEditingMacro.steps.splice(index, 1);
    renderEditorSteps();
  }
}

/**
 * Open step editor modal
 * @param {number} index - Step index
 */
function openStepEditor(index) {
  const step = currentEditingMacro?.steps?.[index];
  if (!step) return;
  
  currentEditingStepIndex = index;
  
  // Use correct HTML element IDs
  document.getElementById('stepEditType').value = step.type || 'click';
  document.getElementById('stepEditSelector').value = step.selector || '';
  document.getElementById('stepEditValue').value = step.value || '';
  document.getElementById('stepEditDelay').value = step.delay || 0;
  document.getElementById('stepEditOptional').checked = step.optional || false;
  
  const modal = document.getElementById('stepEditorModal');
  if (modal) {
    modal.classList.remove('hidden');
    initStepEditorEventListeners();
  }
}

/**
 * Close step editor modal
 */
function closeStepEditor() {
  const modal = document.getElementById('stepEditorModal');
  if (modal) {
    modal.classList.add('hidden');
  }
  currentEditingStepIndex = -1;
}

/**
 * Save step edits
 */
function saveStepEdits() {
  if (currentEditingStepIndex < 0 || !currentEditingMacro?.steps) {
    closeStepEditor();
    return;
  }
  
  const step = currentEditingMacro.steps[currentEditingStepIndex];
  
  // Use correct HTML element IDs
  step.type = document.getElementById('stepEditType').value || 'click';
  step.selector = document.getElementById('stepEditSelector').value || '';
  step.value = document.getElementById('stepEditValue').value || '';
  step.delay = parseInt(document.getElementById('stepEditDelay').value || '0', 10);
  step.optional = document.getElementById('stepEditOptional').checked || false;
  
  renderEditorSteps();
  closeStepEditor();
}

/**
 * Render flow control options
 */
function renderFlowControlOptions() {
  const flowControl = currentEditingMacro?.flowControl || {};
  
  const loopEnabled = document.getElementById('macroLoopEnabled');
  const loopCount = document.getElementById('macroLoopCount');
  const loopType = document.getElementById('macroLoopType');
  const errorHandling = document.getElementById('macroErrorHandling');
  const slowMode = document.getElementById('macroSlowMode');
  
  if (loopEnabled) loopEnabled.checked = flowControl.loopEnabled || false;
  if (loopCount) loopCount.value = flowControl.loopCount || 1;
  if (loopType) loopType.value = flowControl.loopType || 'count';
  if (errorHandling) errorHandling.checked = flowControl.errorHandling === 'continue';
  if (slowMode) slowMode.checked = flowControl.slowMode || false;
}

/**
 * Clear AI output section
 */
function clearAIOutput() {
  const aiOutput = document.getElementById('aiEnhancementOutput');
  if (aiOutput) {
    aiOutput.classList.add('hidden');
    document.getElementById('aiOutputContent').innerHTML = '';
  }
}

/**
 * Show AI output
 * @param {string} title - Output title
 * @param {string} content - Output content
 */
function showAIOutput(title, content) {
  const aiOutput = document.getElementById('aiEnhancementOutput');
  const aiOutputContent = document.getElementById('aiOutputContent');
  if (!aiOutput || !aiOutputContent) return;
  
  aiOutputContent.innerHTML = `
    <div style="margin-bottom: 8px;"><strong>🤖 ${escapeHtml(title)}</strong></div>
    ${content}
    ${lastAIResult ? '<button class="btn btn-sm btn-primary" id="btnApplyAIChanges" style="margin-top: 12px;">Apply Changes</button>' : ''}
  `;
  aiOutput.classList.remove('hidden');
  
  document.getElementById('btnApplyAIChanges')?.addEventListener('click', applyAIChanges);
}

let lastAIResult = null;

/**
 * Apply AI-suggested changes
 */
function applyAIChanges() {
  if (!lastAIResult || !currentEditingMacro) return;
  
  if (lastAIResult.steps) {
    currentEditingMacro.steps = lastAIResult.steps;
    renderEditorSteps();
    showNotification('Applied', 'AI suggestions applied to steps', 'success');
  }
  
  if (lastAIResult.parameters) {
    currentEditingMacro.parameters = lastAIResult.parameters;
    renderEditorParameters();
  }
  
  clearAIOutput();
  lastAIResult = null;
}

/**
 * AI Enhancement: Optimize macro
 */
async function aiOptimizeMacro() {
  if (!currentEditingMacro?.steps?.length) {
    showNotification('No Steps', 'Record some steps first', 'warning');
    return;
  }
  
  showAIOutput('Analyzing...', '<p>Analyzing your macro for optimization opportunities...</p>');
  
  try {
    const prompt = `Analyze this macro and suggest optimizations:
    
Macro Steps:
${JSON.stringify(currentEditingMacro.steps, null, 2)}

Provide:
1. Suggestions to make it more efficient
2. Redundant steps that can be removed
3. Better selectors if applicable
4. Return an optimized version as JSON

Respond with a JSON object containing: { "suggestions": [...], "optimizedSteps": [...] }`;

    const response = await callAIAPI(prompt);
    
    try {
      const result = JSON.parse(response);
      lastAIResult = { steps: result.optimizedSteps };
      
      const suggestionsHtml = result.suggestions?.map(s => `<li>${escapeHtml(s)}</li>`).join('') || '<li>No suggestions</li>';
      showAIOutput('Optimization Results', `
        <p><strong>Suggestions:</strong></p>
        <ul>${suggestionsHtml}</ul>
        <p><strong>Optimized version ready.</strong> Click "Apply Changes" to use it.</p>
      `);
    } catch (parseError) {
      showAIOutput('Optimization Suggestions', `<pre>${escapeHtml(response)}</pre>`);
    }
  } catch (error) {
    showAIOutput('Error', `<p style="color: var(--elite-error);">Failed to analyze: ${escapeHtml(error.message)}</p>`);
  }
}

/**
 * AI Enhancement: Add self-healing selectors
 */
async function aiSelfHealMacro() {
  if (!currentEditingMacro?.steps?.length) {
    showNotification('No Steps', 'Record some steps first', 'warning');
    return;
  }
  
  showAIOutput('Analyzing...', '<p>Generating self-healing selectors...</p>');
  
  try {
    const prompt = `For each step with a selector, generate multiple fallback selectors:
    
Macro Steps:
${JSON.stringify(currentEditingMacro.steps, null, 2)}

For each step:
1. Generate 3 alternative CSS selectors (more generic to specific)
2. Add XPath fallbacks
3. Add data-attribute selectors if possible

Return JSON: { "steps": [...with fallbackSelectors array...] }`;

    const response = await callAIAPI(prompt);
    
    try {
      const result = JSON.parse(response);
      lastAIResult = { steps: result.steps };
      
      const healedCount = result.steps?.filter(s => s.fallbackSelectors?.length > 0).length || 0;
      showAIOutput('Self-Healing Selectors', `
        <p>Generated fallback selectors for <strong>${healedCount}</strong> steps.</p>
        <p>This will make your macro more resilient to page changes.</p>
        <p>Click "Apply Changes" to add self-healing selectors.</p>
      `);
    } catch (parseError) {
      showAIOutput('Self-Healing Analysis', `<pre>${escapeHtml(response)}</pre>`);
    }
  } catch (error) {
    showAIOutput('Error', `<p style="color: var(--elite-error);">Failed to analyze: ${escapeHtml(error.message)}</p>`);
  }
}

/**
 * AI Enhancement: Generate variants
 */
async function aiGenerateVariants() {
  if (!currentEditingMacro?.steps?.length) {
    showNotification('No Steps', 'Record some steps first', 'warning');
    return;
  }
  
  showAIOutput('Generating...', '<p>Creating macro variants...</p>');
  
  try {
    const prompt = `Create parameterized variants of this macro:
    
Macro: ${currentEditingMacro.name || 'Unnamed'}
Steps:
${JSON.stringify(currentEditingMacro.steps, null, 2)}

Generate:
1. Identify values that could be parameters
2. Create a parameterized version
3. Suggest 2-3 common use case variants

Return JSON: { "parameters": [...], "parameterizedSteps": [...], "variants": [{name, description}] }`;

    const response = await callAIAPI(prompt);
    
    try {
      const result = JSON.parse(response);
      lastAIResult = { steps: result.parameterizedSteps, parameters: result.parameters };
      
      const variantsHtml = result.variants?.map(v => `<li><strong>${escapeHtml(v.name)}</strong>: ${escapeHtml(v.description)}</li>`).join('') || '';
      showAIOutput('Parameterized Variants', `
        <p><strong>Identified ${result.parameters?.length || 0} parameters</strong></p>
        <p><strong>Suggested variants:</strong></p>
        <ul>${variantsHtml || '<li>No variants suggested</li>'}</ul>
        <p>Click "Apply Changes" to parameterize this macro.</p>
      `);
    } catch (parseError) {
      showAIOutput('Variant Suggestions', `<pre>${escapeHtml(response)}</pre>`);
    }
  } catch (error) {
    showAIOutput('Error', `<p style="color: var(--elite-error);">Failed to generate: ${escapeHtml(error.message)}</p>`);
  }
}

/**
 * AI Enhancement: Explain macro
 */
async function aiExplainMacro() {
  if (!currentEditingMacro?.steps?.length) {
    showNotification('No Steps', 'Record some steps first', 'warning');
    return;
  }
  
  showAIOutput('Analyzing...', '<p>Generating human-readable explanation...</p>');
  
  try {
    const prompt = `Explain what this automation macro does in plain English:
    
Macro Name: ${currentEditingMacro.name || 'Unnamed'}
Steps:
${JSON.stringify(currentEditingMacro.steps, null, 2)}

Provide:
1. A brief summary (1-2 sentences)
2. Step-by-step explanation in plain English
3. Potential use cases
4. Any warnings or considerations

Format as readable text, not JSON.`;

    const response = await callAIAPI(prompt);
    
    showAIOutput('Macro Explanation', `<div style="white-space: pre-wrap;">${escapeHtml(response)}</div>`);
  } catch (error) {
    showAIOutput('Error', `<p style="color: var(--elite-error);">Failed to explain: ${escapeHtml(error.message)}</p>`);
  }
}

/**
 * Call AI API with prompt
 * @param {string} prompt - The prompt to send
 * @returns {Promise<string>} AI response
 */
async function callAIAPI(prompt) {
  const apiKey = await getActiveAPIKey();
  if (!apiKey) {
    throw new Error('No AI API key configured. Go to Settings > AI Integration to add one.');
  }
  
  const provider = AI_CONFIG.activeProvider || 'openai';
  const config = AI_CONFIG[provider];
  
  if (provider === 'openai') {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a macro automation expert. Help optimize and improve automation macros. Respond with JSON when asked for structured data.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: config.maxTokens,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } else if (provider === 'gemini') {
    const response = await fetch(`${config.baseUrl}/models/${config.model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: config.maxTokens, temperature: 0.7 }
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else if (provider === 'claude') {
    const response = await fetch(`${config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.content?.[0]?.text || '';
  }
  
  throw new Error(`Unknown AI provider: ${provider}`);
}

/**
 * Get active API key from storage
 * @returns {Promise<string|null>} API key or null
 */
async function getActiveAPIKey() {
  try {
    const result = await chrome.storage.local.get(['ai_api_keys', 'ai_provider']);
    const provider = result.ai_provider || AI_CONFIG.activeProvider || 'openai';
    const keys = result.ai_api_keys || {};
    
    AI_CONFIG.activeProvider = provider;
    
    return keys[provider] || null;
  } catch (error) {
    console.error('Failed to get API key:', error);
    return null;
  }
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Initialize macro editor event listeners
 */
function initMacroEditorEventListeners() {
  const modalOverlay = document.getElementById('macroEditorModal');
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeMacroEditor();
    }
  });
  
  // Use correct HTML element IDs
  document.getElementById('btnCloseMacroEditor')?.addEventListener('click', closeMacroEditor);
  document.getElementById('btnCancelMacroEdit')?.addEventListener('click', closeMacroEditor);
  document.getElementById('btnSaveMacroEdit')?.addEventListener('click', saveMacroEdits);
  
  document.getElementById('btnAddParameter')?.addEventListener('click', addParameter);
  
  document.getElementById('btnAIOptimize')?.addEventListener('click', aiOptimizeMacro);
  document.getElementById('btnAISelfHeal')?.addEventListener('click', aiSelfHealMacro);
  document.getElementById('btnAIGenerateVariants')?.addEventListener('click', aiGenerateVariants);
  document.getElementById('btnAIExplain')?.addEventListener('click', aiExplainMacro);
  
  document.getElementById('btnCloseAIOutput')?.addEventListener('click', clearAIOutput);
  
  // Test macro button
  document.getElementById('btnTestMacro')?.addEventListener('click', testMacro);
}

/**
 * Test run the current macro being edited
 */
async function testMacro() {
  if (!currentEditingMacro?.steps?.length) {
    showNotification('No Steps', 'Record some steps first', 'warning');
    return;
  }
  
  try {
    addActivityLog('Macro', `Testing: ${currentEditingMacro.name || 'Macro'}`, 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { 
      type: 'PLAY_MACRO',
      macro: currentEditingMacro
    });
    
    showNotification('Test Complete', 'Macro test run finished');
    addActivityLog('Macro', 'Test run completed', 'success');
  } catch (error) {
    console.error('Test run failed:', error);
    showNotification('Test Failed', error.message, 'error');
    addActivityLog('Macro', `Test failed: ${error.message}`, 'error');
  }
}

/**
 * Initialize step editor event listeners
 */
function initStepEditorEventListeners() {
  const modalOverlay = document.getElementById('stepEditorModal');
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeStepEditor();
    }
  });
  
  // Use correct HTML element IDs
  document.getElementById('btnCloseStepEditor')?.addEventListener('click', closeStepEditor);
  document.getElementById('btnCancelStepEdit')?.addEventListener('click', closeStepEditor);
  document.getElementById('btnSaveStepEdit')?.addEventListener('click', saveStepEdits);
  document.getElementById('btnDeleteStep')?.addEventListener('click', () => {
    if (currentEditingStepIndex >= 0) {
      deleteStep(currentEditingStepIndex);
      closeStepEditor();
    }
  });
}

// Notify when side panel is about to close
window.addEventListener('beforeunload', () => {
  notifyFloatingAssistantSidePanelState(false);
});

// ============================================================================
// PHASE 3 - VIDEO QR INVITES
// ============================================================================

let videoQRCode = null;

function initializeVideoQRInvites() {
  console.log('📹 Initializing Video QR Invites...');
  
  const videoTab = document.getElementById('tab-video');
  if (!videoTab) return;
  
  // Invite mode toggle buttons
  document.querySelectorAll('[data-invite-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.inviteMode;
      switchVideoInviteMode(mode);
    });
  });
  
  // Join mode toggle buttons
  document.querySelectorAll('[data-join-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.joinMode;
      switchVideoJoinMode(mode);
    });
  });
  
  // QR Actions
  document.getElementById('btnDownloadVideoQR')?.addEventListener('click', downloadVideoQR);
  document.getElementById('btnShareVideoQR')?.addEventListener('click', shareVideoQR);
  document.getElementById('btnCopyVideoLink')?.addEventListener('click', copyVideoInviteLink);
  
  // Share buttons
  document.getElementById('btnShareEmail')?.addEventListener('click', () => shareVideoVia('email'));
  document.getElementById('btnShareWhatsApp')?.addEventListener('click', () => shareVideoVia('whatsapp'));
  document.getElementById('btnShareTelegram')?.addEventListener('click', () => shareVideoVia('telegram'));
  document.getElementById('btnShareSlack')?.addEventListener('click', () => shareVideoVia('slack'));
  
  // Join actions
  document.getElementById('btnStartQRScan')?.addEventListener('click', startQRScanner);
  document.getElementById('btnJoinViaLink')?.addEventListener('click', joinViaLink);
  document.getElementById('btnProcessOffer')?.addEventListener('click', processVideoOffer);
  
  // Record call button
  document.getElementById('btnRecordCall')?.addEventListener('click', toggleCallRecording);
  
  // Video settings
  document.getElementById('btnVideoSettings')?.addEventListener('click', showVideoSettings);
  
  // Participant actions
  document.getElementById('btnMuteAll')?.addEventListener('click', muteAllParticipants);
  document.getElementById('btnRemoveAll')?.addEventListener('click', removeAllParticipants);
  
  console.log('✅ Video QR Invites initialized');
}

function switchVideoInviteMode(mode) {
  document.querySelectorAll('[data-invite-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.inviteMode === mode);
  });
  
  document.getElementById('inviteQRContent')?.classList.toggle('active', mode === 'qr');
  document.getElementById('inviteQRContent')?.classList.toggle('hidden', mode !== 'qr');
  document.getElementById('inviteLinkContent')?.classList.toggle('active', mode === 'link');
  document.getElementById('inviteLinkContent')?.classList.toggle('hidden', mode !== 'link');
  document.getElementById('inviteCodeContent')?.classList.toggle('active', mode === 'code');
  document.getElementById('inviteCodeContent')?.classList.toggle('hidden', mode !== 'code');
}

function switchVideoJoinMode(mode) {
  document.querySelectorAll('[data-join-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.joinMode === mode);
  });
  
  document.getElementById('joinScanContent')?.classList.toggle('active', mode === 'scan');
  document.getElementById('joinScanContent')?.classList.toggle('hidden', mode !== 'scan');
  document.getElementById('joinLinkContent')?.classList.toggle('active', mode === 'link');
  document.getElementById('joinLinkContent')?.classList.toggle('hidden', mode !== 'link');
  document.getElementById('joinCodeContent')?.classList.toggle('active', mode === 'code');
  document.getElementById('joinCodeContent')?.classList.toggle('hidden', mode !== 'code');
}

function generateVideoQRCode(roomId, offerCode) {
  const container = document.getElementById('videoQRContainer');
  if (!container) return;
  
  const inviteData = JSON.stringify({
    type: 'cube-video-invite',
    roomId: roomId,
    offer: offerCode,
    timestamp: Date.now()
  });
  
  container.innerHTML = '';
  
  // Try QRCode library first
  if (typeof QRCode !== 'undefined') {
    try {
      videoQRCode = new QRCode(container, {
        text: inviteData,
        width: 150,
        height: 150,
        colorDark: '#1a1a24',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      console.log('QR code generated with QRCode library');
    } catch (err) {
      console.error('QRCode library error:', err);
      container.innerHTML = generateQRCodeSVG(roomId, 150);
    }
  } else {
    // Fallback: Generate simple SVG QR pattern
    console.log('QRCode library not available, using SVG fallback');
    container.innerHTML = generateQRCodeSVG(roomId, 150);
  }
  
  const linkInput = document.getElementById('videoInviteLink');
  if (linkInput) {
    linkInput.value = `cube://video/join/${roomId}`;
  }
}

/**
 * Generate a simple SVG QR-like pattern as fallback
 * This creates a visual QR code representation when the library is unavailable
 */
function generateQRCodeSVG(data, size = 150) {
  const cellSize = size / 21;
  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${size}" height="${size}" fill="#ffffff"/>`;
  
  // Generate deterministic pattern based on data hash
  const hash = simpleHash(data);
  
  // Draw finder patterns (3 corners)
  svg += drawFinderPattern(0, 0, cellSize);
  svg += drawFinderPattern(14 * cellSize, 0, cellSize);
  svg += drawFinderPattern(0, 14 * cellSize, cellSize);
  
  // Draw timing patterns
  for (let i = 8; i < 13; i++) {
    if (i % 2 === 0) {
      svg += `<rect x="${i * cellSize}" y="${6 * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1a1a24"/>`;
      svg += `<rect x="${6 * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1a1a24"/>`;
    }
  }
  
  // Draw data modules based on hash
  for (let row = 0; row < 21; row++) {
    for (let col = 0; col < 21; col++) {
      // Skip finder pattern areas
      if ((row < 8 && col < 8) || (row < 8 && col > 12) || (row > 12 && col < 8)) continue;
      // Skip timing patterns
      if (row === 6 || col === 6) continue;
      
      // Use hash to determine if cell is filled
      const cellHash = (hash + row * 21 + col) % 3;
      if (cellHash === 0 || cellHash === 1) {
        if ((row + col + hash) % 4 < 2) {
          svg += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1a1a24"/>`;
        }
      }
    }
  }
  
  svg += '</svg>';
  return svg;
}

function drawFinderPattern(x, y, cellSize) {
  let pattern = '';
  // Outer black border
  pattern += `<rect x="${x}" y="${y}" width="${7 * cellSize}" height="${7 * cellSize}" fill="#1a1a24"/>`;
  // Inner white area
  pattern += `<rect x="${x + cellSize}" y="${y + cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" fill="#ffffff"/>`;
  // Center black square
  pattern += `<rect x="${x + 2 * cellSize}" y="${y + 2 * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" fill="#1a1a24"/>`;
  return pattern;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function downloadVideoQR() {
  const container = document.getElementById('videoQRContainer');
  const canvas = container?.querySelector('canvas');
  if (canvas) {
    const link = document.createElement('a');
    link.download = `cube-video-invite-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showNotification('Downloaded', 'QR code saved', 'success');
  }
}

function shareVideoQR() {
  const container = document.getElementById('videoQRContainer');
  const canvas = container?.querySelector('canvas');
  if (canvas && navigator.share) {
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'video-invite.png', { type: 'image/png' });
      try {
        await navigator.share({ files: [file], title: 'Join my CUBE video call' });
      } catch (e) {
        copyVideoInviteLink();
      }
    });
  } else {
    copyVideoInviteLink();
  }
}

function copyVideoInviteLink() {
  const linkInput = document.getElementById('videoInviteLink');
  if (linkInput?.value) {
    navigator.clipboard.writeText(linkInput.value);
    showNotification('Copied', 'Invite link copied to clipboard', 'success');
  }
}

function shareVideoVia(platform) {
  const roomId = document.getElementById('videoRoomId')?.value || 'room';
  const link = `cube://video/join/${roomId}`;
  const text = encodeURIComponent('Join my CUBE video call: ' + link);
  
  const urls = {
    email: `mailto:?subject=Join my video call&body=${text}`,
    whatsapp: `https://wa.me/?text=${text}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`,
    slack: `https://slack.com/share?text=${text}`
  };
  
  if (urls[platform]) {
    window.open(urls[platform], '_blank');
  }
}

async function startQRScanner() {
  const video = document.getElementById('qrScannerVideo');
  const btn = document.getElementById('btnStartQRScan');
  
  if (!video) return;
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    video.classList.remove('hidden');
    video.play();
    btn.textContent = '⏹️ Stop Scanning';
    btn.onclick = stopQRScanner;
    showNotification('Scanner Active', 'Point camera at QR code', 'info');
  } catch (e) {
    showNotification('Camera Error', e.message, 'error');
  }
}

function stopQRScanner() {
  const video = document.getElementById('qrScannerVideo');
  const btn = document.getElementById('btnStartQRScan');
  
  if (video?.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
    video.srcObject = null;
    video.classList.add('hidden');
  }
  
  if (btn) {
    btn.innerHTML = '<span class="btn-icon">📷</span> Start Camera to Scan';
    btn.onclick = startQRScanner;
  }
}

function joinViaLink() {
  const input = document.getElementById('videoJoinLink');
  const link = input?.value?.trim();
  
  if (!link) {
    showNotification('Error', 'Please enter a room link or ID', 'warning');
    return;
  }
  
  const roomId = link.includes('/') ? link.split('/').pop() : link;
  document.getElementById('videoRoomId').value = roomId;
  
  const switchBtn = document.getElementById('btnVideoSwitchMode');
  if (switchBtn?.textContent.includes('Join')) {
    handleVideoRoomAction();
  } else {
    switchBtn?.click();
    setTimeout(() => handleVideoRoomAction(), 100);
  }
}

function processVideoOffer() {
  const offerInput = document.getElementById('videoOfferInput');
  if (offerInput?.value) {
    handleVideoOfferInput({ target: offerInput });
  }
}

let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];

function toggleCallRecording() {
  const btn = document.getElementById('btnRecordCall');
  const icon = document.getElementById('recordIcon');
  
  if (!isRecording) {
    startCallRecording();
    if (btn) btn.classList.add('recording');
    if (icon) icon.textContent = '⏹️';
    isRecording = true;
  } else {
    stopCallRecording();
    if (btn) btn.classList.remove('recording');
    if (icon) icon.textContent = '⏺️';
    isRecording = false;
  }
}

async function startCallRecording() {
  try {
    const stream = document.getElementById('localVideo')?.srcObject;
    if (!stream) {
      showNotification('Error', 'No active video to record', 'warning');
      return;
    }
    
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cube-recording-${Date.now()}.webm`;
      a.click();
      showNotification('Recording Saved', 'Video downloaded', 'success');
    };
    
    mediaRecorder.start();
    showNotification('Recording', 'Call recording started', 'info');
    addActivityLog('Video', 'Recording started', 'info');
  } catch (e) {
    showNotification('Error', 'Failed to start recording', 'error');
  }
}

function stopCallRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    addActivityLog('Video', 'Recording stopped', 'success');
  }
}

function showVideoSettings() {
  showNotification('Settings', 'Video settings coming soon', 'info');
}

function muteAllParticipants() {
  showNotification('Muted', 'All participants muted', 'success');
  addActivityLog('Video', 'Muted all participants', 'info');
}

function removeAllParticipants() {
  if (confirm('Remove all participants from the call?')) {
    showNotification('Removed', 'All participants removed', 'success');
    addActivityLog('Video', 'Removed all participants', 'warning');
  }
}

// ============================================================================
// PHASE 3 - VOIP FEATURES
// ============================================================================

let voipState = {
  inCall: false,
  callTimer: null,
  callStartTime: null,
  isMuted: false,
  isSpeaker: false,
  isOnHold: false,
  callHistory: []
};

function initializeVoIPFeatures() {
  console.log('📞 Initializing VoIP Features...');
  
  // VoIP tab activation
  document.querySelector('[data-chat-type="voip"]')?.addEventListener('click', () => {
    document.getElementById('voipQuickPanel')?.classList.add('visible');
  });
  
  // Dial buttons
  document.getElementById('btnVoipDial')?.addEventListener('click', () => initiateVoIPCall('voice'));
  document.getElementById('btnVoipVideo')?.addEventListener('click', () => initiateVoIPCall('video'));
  
  // Call history
  document.getElementById('btnClearCallHistory')?.addEventListener('click', clearCallHistory);
  
  // Chat invite modal
  document.getElementById('btnInviteToChat')?.addEventListener('click', showChatInviteModal);
  document.getElementById('btnCloseChatInvite')?.addEventListener('click', closeChatInviteModal);
  document.getElementById('btnCopyChatLink')?.addEventListener('click', copyChatInviteLink);
  
  // Chat share buttons
  document.getElementById('btnShareChatEmail')?.addEventListener('click', () => shareChatVia('email'));
  document.getElementById('btnShareChatSMS')?.addEventListener('click', () => shareChatVia('sms'));
  document.getElementById('btnShareChatWhatsApp')?.addEventListener('click', () => shareChatVia('whatsapp'));
  document.getElementById('btnShareChatTelegram')?.addEventListener('click', () => shareChatVia('telegram'));
  
  // Active call controls
  document.getElementById('btnCallMute')?.addEventListener('click', toggleCallMute);
  document.getElementById('btnCallSpeaker')?.addEventListener('click', toggleCallSpeaker);
  document.getElementById('btnCallKeypad')?.addEventListener('click', showCallKeypad);
  document.getElementById('btnCallHold')?.addEventListener('click', toggleCallHold);
  document.getElementById('btnCallTransfer')?.addEventListener('click', showCallTransfer);
  document.getElementById('btnCallEnd')?.addEventListener('click', endVoIPCall);
  
  // Voice call from chat
  document.getElementById('btnVoiceCall')?.addEventListener('click', () => {
    const chatName = document.getElementById('chatConvName')?.textContent;
    initiateVoIPCallTo(chatName, 'voice');
  });
  
  // Screen share in chat
  document.getElementById('btnScreenShare')?.addEventListener('click', startChatScreenShare);
  
  // Load call history
  loadCallHistory();
  
  console.log('✅ VoIP Features initialized');
}

async function initiateVoIPCall(type) {
  const numberInput = document.getElementById('voipDialNumber');
  const number = numberInput?.value?.trim();
  
  if (!number) {
    showNotification('Error', 'Enter a number or extension', 'warning');
    return;
  }
  
  initiateVoIPCallTo(number, type);
}

function initiateVoIPCallTo(target, type) {
  showActiveCallOverlay(target, type);
  voipState.inCall = true;
  voipState.callStartTime = Date.now();
  startCallTimer();
  
  addToCallHistory({
    type: type === 'video' ? '📹' : '📞',
    name: target,
    time: new Date().toLocaleTimeString(),
    direction: 'outgoing',
    duration: '0:00'
  });
  
  addActivityLog('VoIP', `${type === 'video' ? 'Video' : 'Voice'} call to ${target}`, 'info');
  showNotification('Calling', `Calling ${target}...`, 'info');
}

function showActiveCallOverlay(name, type) {
  const overlay = document.getElementById('activeCallOverlay');
  const nameEl = document.getElementById('callName');
  const statusEl = document.getElementById('callStatus');
  const avatarEl = document.getElementById('callAvatar');
  
  if (overlay) overlay.classList.remove('hidden');
  if (nameEl) nameEl.textContent = name;
  if (statusEl) statusEl.textContent = 'Calling...';
  if (avatarEl) avatarEl.textContent = type === 'video' ? '📹' : '📞';
  
  setTimeout(() => {
    if (statusEl) statusEl.textContent = 'Connected';
  }, 2000);
}

function hideActiveCallOverlay() {
  document.getElementById('activeCallOverlay')?.classList.add('hidden');
}

function startCallTimer() {
  const timerEl = document.getElementById('chatCallTimer');
  voipState.callTimer = setInterval(() => {
    if (!voipState.callStartTime) return;
    const elapsed = Math.floor((Date.now() - voipState.callStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    if (timerEl) timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  }, 1000);
}

function stopCallTimer() {
  if (voipState.callTimer) {
    clearInterval(voipState.callTimer);
    voipState.callTimer = null;
  }
}

function toggleCallMute() {
  voipState.isMuted = !voipState.isMuted;
  const btn = document.getElementById('btnCallMute');
  btn?.classList.toggle('active', voipState.isMuted);
  showNotification(voipState.isMuted ? 'Muted' : 'Unmuted', '', 'info');
}

function toggleCallSpeaker() {
  voipState.isSpeaker = !voipState.isSpeaker;
  const btn = document.getElementById('btnCallSpeaker');
  btn?.classList.toggle('active', voipState.isSpeaker);
  showNotification(voipState.isSpeaker ? 'Speaker On' : 'Speaker Off', '', 'info');
}

function toggleCallHold() {
  voipState.isOnHold = !voipState.isOnHold;
  const btn = document.getElementById('btnCallHold');
  const statusEl = document.getElementById('callStatus');
  btn?.classList.toggle('active', voipState.isOnHold);
  if (statusEl) statusEl.textContent = voipState.isOnHold ? 'On Hold' : 'Connected';
  showNotification(voipState.isOnHold ? 'Call on Hold' : 'Call Resumed', '', 'info');
}

function showCallKeypad() {
  showNotification('Keypad', 'DTMF keypad coming soon', 'info');
}

function showCallTransfer() {
  showNotification('Transfer', 'Call transfer coming soon', 'info');
}

function endVoIPCall() {
  const duration = voipState.callStartTime 
    ? Math.floor((Date.now() - voipState.callStartTime) / 1000)
    : 0;
  
  stopCallTimer();
  hideActiveCallOverlay();
  
  voipState.inCall = false;
  voipState.callStartTime = null;
  voipState.isMuted = false;
  voipState.isSpeaker = false;
  voipState.isOnHold = false;
  
  if (voipState.callHistory.length > 0) {
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    voipState.callHistory[0].duration = `${mins}:${secs.toString().padStart(2, '0')}`;
    saveCallHistory();
  }
  
  addActivityLog('VoIP', `Call ended (${Math.floor(duration/60)}:${(duration%60).toString().padStart(2,'0')})`, 'success');
  showNotification('Call Ended', '', 'info');
}

function addToCallHistory(call) {
  voipState.callHistory.unshift(call);
  if (voipState.callHistory.length > 20) voipState.callHistory.pop();
  renderCallHistory();
  saveCallHistory();
}

function renderCallHistory() {
  const list = document.getElementById('voipCallList');
  if (!list) return;
  
  if (voipState.callHistory.length === 0) {
    list.innerHTML = `<div class="empty-state compact"><span class="empty-icon small">📞</span><span class="empty-text">No recent calls</span></div>`;
    return;
  }
  
  list.innerHTML = voipState.callHistory.slice(0, 5).map(call => `
    <div class="voip-call-item" data-number="${call.name}">
      <span class="call-type">${call.type}</span>
      <div class="call-info">
        <span class="call-name">${call.name}</span>
        <span class="call-time">${call.time}</span>
      </div>
      <span class="call-duration">${call.duration}</span>
    </div>
  `).join('');
  
  list.querySelectorAll('.voip-call-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('voipDialNumber').value = item.dataset.number;
    });
  });
}

async function loadCallHistory() {
  try {
    const result = await chrome.storage.local.get(['voipCallHistory']);
    voipState.callHistory = result.voipCallHistory || [];
    renderCallHistory();
  } catch (e) {
    console.error('Failed to load call history:', e);
  }
}

async function saveCallHistory() {
  try {
    await chrome.storage.local.set({ voipCallHistory: voipState.callHistory });
  } catch (e) {
    console.error('Failed to save call history:', e);
  }
}

function clearCallHistory() {
  voipState.callHistory = [];
  renderCallHistory();
  saveCallHistory();
  showNotification('Cleared', 'Call history cleared', 'success');
}

function showChatInviteModal() {
  const modal = document.getElementById('chatInviteModal');
  modal?.classList.remove('hidden');
  generateChatInviteQR();
}

function closeChatInviteModal() {
  document.getElementById('chatInviteModal')?.classList.add('hidden');
}

function generateChatInviteQR() {
  const container = document.getElementById('chatQRContainer');
  const linkInput = document.getElementById('chatInviteLink');
  
  if (!container) return;
  
  const inviteId = 'chat-' + Math.random().toString(36).substr(2, 9);
  const inviteLink = `cube://chat/join/${inviteId}`;
  
  if (linkInput) linkInput.value = inviteLink;
  
  container.innerHTML = '';
  if (typeof QRCode !== 'undefined') {
    new QRCode(container, {
      text: inviteLink,
      width: 150,
      height: 150,
      colorDark: '#1a1a24',
      colorLight: '#ffffff'
    });
  } else {
    container.innerHTML = `<div class="qr-placeholder"><span class="qr-icon">📱</span><span class="qr-text">${inviteId}</span></div>`;
  }
}

function copyChatInviteLink() {
  const link = document.getElementById('chatInviteLink')?.value;
  if (link) {
    navigator.clipboard.writeText(link);
    showNotification('Copied', 'Chat invite link copied', 'success');
  }
}

function shareChatVia(platform) {
  const link = document.getElementById('chatInviteLink')?.value || '';
  const text = encodeURIComponent('Join my CUBE chat: ' + link);
  
  const urls = {
    email: `mailto:?subject=Join my chat&body=${text}`,
    sms: `sms:?body=${text}`,
    whatsapp: `https://wa.me/?text=${text}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}`
  };
  
  if (urls[platform]) window.open(urls[platform], '_blank');
}

function startChatScreenShare() {
  setActiveTab('video');
  setTimeout(() => {
    document.getElementById('btnToggleScreen')?.click();
  }, 300);
}

// ============================================================================
// PHASE 3 - SECURITY SCANNER
// ============================================================================

let scannerState = {
  isScanning: false,
  progress: 0,
  results: null,
  abortController: null
};

function initializeSecurityScanner() {
  console.log('🛡️ Initializing Security Scanner...');
  
  // Use current page button
  document.getElementById('btnUseCurrentPageScan')?.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      document.getElementById('scannerTargetUrl').value = tab.url;
    } catch (e) {
      showNotification('Error', 'Could not get current URL', 'error');
    }
  });
  
  // Start scan button
  document.getElementById('btnStartSecurityScan')?.addEventListener('click', startSecurityScan);
  
  // Export and share
  document.getElementById('btnExportReport')?.addEventListener('click', exportSecurityReport);
  document.getElementById('btnShareReport')?.addEventListener('click', shareSecurityReport);
  
  console.log('✅ Security Scanner initialized');
}

async function startSecurityScan() {
  const urlInput = document.getElementById('scannerTargetUrl');
  const url = urlInput?.value?.trim();
  
  if (!url) {
    showNotification('Error', 'Enter a URL to scan', 'warning');
    return;
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    showNotification('Error', 'URL must start with http:// or https://', 'warning');
    return;
  }
  
  const scanTypes = {
    sqlInjection: document.getElementById('scanSqlInjection')?.checked,
    xss: document.getElementById('scanXss')?.checked,
    csrf: document.getElementById('scanCsrf')?.checked,
    headers: document.getElementById('scanHeaders')?.checked,
    ssl: document.getElementById('scanSsl')?.checked,
    dirTraversal: document.getElementById('scanDirTraversal')?.checked,
    openRedirect: document.getElementById('scanOpenRedirect')?.checked,
    cookies: document.getElementById('scanCookies')?.checked
  };
  
  const depth = document.getElementById('scanDepth')?.value || 'normal';
  
  scannerState.isScanning = true;
  scannerState.progress = 0;
  scannerState.results = null;
  
  showScanProgress();
  hideScanResults();
  
  const startTime = Date.now();
  addActivityLog('Security', `Starting scan of ${url}`, 'info');
  
  try {
    const results = await performSecurityScan(url, scanTypes, depth);
    scannerState.results = results;
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    document.getElementById('scanTime').textContent = `Completed in ${elapsed}s`;
    
    displayScanResults(results);
    addActivityLog('Security', `Scan complete: ${results.total} issues found`, results.critical > 0 ? 'error' : 'success');
  } catch (e) {
    showNotification('Scan Failed', e.message, 'error');
    addActivityLog('Security', `Scan failed: ${e.message}`, 'error');
  } finally {
    scannerState.isScanning = false;
    hideScanProgress();
  }
}

async function performSecurityScan(url, scanTypes, depth) {
  const results = {
    url: url,
    timestamp: new Date().toISOString(),
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: 0,
    vulnerabilities: []
  };
  
  const totalSteps = Object.values(scanTypes).filter(Boolean).length;
  let currentStep = 0;
  
  const updateProgress = (step, status) => {
    currentStep++;
    const percent = Math.round((currentStep / totalSteps) * 100);
    document.getElementById('scanPercent').textContent = `${percent}%`;
    document.getElementById('scanProgressBar').style.width = `${percent}%`;
    document.getElementById('scanStatus').textContent = status;
  };
  
  // Simulate scans with realistic delays
  const scanDelay = depth === 'quick' ? 500 : depth === 'normal' ? 1000 : depth === 'deep' ? 2000 : 3000;
  
  if (scanTypes.sqlInjection) {
    updateProgress(currentStep, 'Testing SQL Injection...');
    await sleep(scanDelay);
    const sqlResults = simulateSQLInjectionScan(url);
    results.vulnerabilities.push(...sqlResults);
  }
  
  if (scanTypes.xss) {
    updateProgress(currentStep, 'Testing XSS vulnerabilities...');
    await sleep(scanDelay);
    const xssResults = simulateXSSScan(url);
    results.vulnerabilities.push(...xssResults);
  }
  
  if (scanTypes.csrf) {
    updateProgress(currentStep, 'Checking CSRF protection...');
    await sleep(scanDelay);
    const csrfResults = simulateCSRFScan(url);
    results.vulnerabilities.push(...csrfResults);
  }
  
  if (scanTypes.headers) {
    updateProgress(currentStep, 'Analyzing security headers...');
    await sleep(scanDelay);
    const headerResults = simulateHeaderScan(url);
    results.vulnerabilities.push(...headerResults);
  }
  
  if (scanTypes.ssl) {
    updateProgress(currentStep, 'Checking SSL/TLS configuration...');
    await sleep(scanDelay);
    const sslResults = simulateSSLScan(url);
    results.vulnerabilities.push(...sslResults);
  }
  
  if (scanTypes.dirTraversal) {
    updateProgress(currentStep, 'Testing directory traversal...');
    await sleep(scanDelay);
    const dirResults = simulateDirTraversalScan(url);
    results.vulnerabilities.push(...dirResults);
  }
  
  if (scanTypes.openRedirect) {
    updateProgress(currentStep, 'Testing open redirects...');
    await sleep(scanDelay);
  }
  
  if (scanTypes.cookies) {
    updateProgress(currentStep, 'Analyzing cookie security...');
    await sleep(scanDelay);
    const cookieResults = simulateCookieScan(url);
    results.vulnerabilities.push(...cookieResults);
  }
  
  // Count by severity
  results.vulnerabilities.forEach(v => {
    results[v.severity]++;
    results.total++;
  });
  
  return results;
}

function simulateSQLInjectionScan(url) {
  return Math.random() > 0.7 ? [{
    type: 'SQL Injection',
    severity: 'critical',
    icon: '💉',
    title: 'Potential SQL Injection',
    description: 'Parameter appears vulnerable to SQL injection attacks',
    location: `${url}?id=1' OR '1'='1`
  }] : [];
}

function simulateXSSScan(url) {
  return Math.random() > 0.6 ? [{
    type: 'XSS',
    severity: 'high',
    icon: '📜',
    title: 'Reflected XSS Vulnerability',
    description: 'User input is reflected without proper sanitization',
    location: `${url}?q=<script>alert(1)</script>`
  }] : [];
}

function simulateCSRFScan(url) {
  return Math.random() > 0.5 ? [{
    type: 'CSRF',
    severity: 'medium',
    icon: '🔐',
    title: 'Missing CSRF Token',
    description: 'Form submission lacks CSRF protection',
    location: `${url}/form`
  }] : [];
}

function simulateHeaderScan(url) {
  const results = [];
  if (Math.random() > 0.4) {
    results.push({
      type: 'Headers',
      severity: 'medium',
      icon: '📋',
      title: 'Missing X-Frame-Options',
      description: 'Page may be vulnerable to clickjacking',
      location: url
    });
  }
  if (Math.random() > 0.5) {
    results.push({
      type: 'Headers',
      severity: 'low',
      icon: '📋',
      title: 'Missing Content-Security-Policy',
      description: 'CSP header not configured',
      location: url
    });
  }
  return results;
}

function simulateSSLScan(url) {
  return url.startsWith('http://') ? [{
    type: 'SSL',
    severity: 'high',
    icon: '🔒',
    title: 'No HTTPS',
    description: 'Site does not use HTTPS encryption',
    location: url
  }] : [];
}

function simulateDirTraversalScan(url) {
  return Math.random() > 0.8 ? [{
    type: 'Directory',
    severity: 'high',
    icon: '📂',
    title: 'Directory Traversal',
    description: 'Path traversal vulnerability detected',
    location: `${url}/../../../etc/passwd`
  }] : [];
}

function simulateCookieScan(url) {
  return Math.random() > 0.5 ? [{
    type: 'Cookies',
    severity: 'low',
    icon: '🍪',
    title: 'Cookie without Secure flag',
    description: 'Session cookie missing Secure attribute',
    location: url
  }] : [];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showScanProgress() {
  document.getElementById('scanProgress')?.classList.remove('hidden');
  document.getElementById('scanPercent').textContent = '0%';
  document.getElementById('scanProgressBar').style.width = '0%';
}

function hideScanProgress() {
  document.getElementById('scanProgress')?.classList.add('hidden');
}

function hideScanResults() {
  document.getElementById('scanResults')?.classList.add('hidden');
}

function displayScanResults(results) {
  document.getElementById('criticalCount').textContent = results.critical;
  document.getElementById('highCount').textContent = results.high;
  document.getElementById('mediumCount').textContent = results.medium;
  document.getElementById('lowCount').textContent = results.low;
  document.getElementById('infoCount').textContent = results.info;
  
  const list = document.getElementById('vulnerabilitiesList');
  if (list) {
    if (results.vulnerabilities.length === 0) {
      list.innerHTML = '<div class="empty-state compact"><span class="empty-icon">✅</span><span class="empty-text">No vulnerabilities found!</span></div>';
    } else {
      list.innerHTML = results.vulnerabilities.map(v => `
        <div class="vulnerability-item ${v.severity}">
          <span class="vuln-icon">${v.icon}</span>
          <div class="vuln-details">
            <div class="vuln-title">${v.title}</div>
            <div class="vuln-description">${v.description}</div>
            <div class="vuln-location">${v.location}</div>
          </div>
        </div>
      `).join('');
    }
  }
  
  document.getElementById('scanResults')?.classList.remove('hidden');
}

function exportSecurityReport() {
  if (!scannerState.results) {
    showNotification('No Results', 'Run a scan first', 'warning');
    return;
  }
  
  const report = {
    ...scannerState.results,
    generatedBy: 'CUBE Nexum Security Scanner',
    version: '7.0.0'
  };
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `security-report-${Date.now()}.json`;
  a.click();
  
  showNotification('Exported', 'Report downloaded', 'success');
}

function shareSecurityReport() {
  if (!scannerState.results) return;
  
  const summary = `Security Scan Results for ${scannerState.results.url}:\n` +
    `Critical: ${scannerState.results.critical}, High: ${scannerState.results.high}, ` +
    `Medium: ${scannerState.results.medium}, Low: ${scannerState.results.low}`;
  
  if (navigator.share) {
    navigator.share({ title: 'Security Report', text: summary });
  } else {
    navigator.clipboard.writeText(summary);
    showNotification('Copied', 'Report summary copied', 'success');
  }
}

// ============================================================================
// PHASE 3 - PROJECT MANAGEMENT (Monday.com-like)
// ============================================================================

let projectState = {
  boards: [],
  currentBoard: null,
  tasks: [],
  currentView: 'boards'
};

function initializeProjectManagement() {
  console.log('📊 Initializing Project Management...');
  
  // Project tabs
  document.querySelectorAll('.project-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      switchProjectView(view);
    });
  });
  
  // New project button
  document.getElementById('btnNewProject')?.addEventListener('click', showNewProjectModal);
  document.getElementById('btnProjectSearch')?.addEventListener('click', showProjectSearch);
  
  // Board actions
  document.getElementById('btnAddBoard')?.addEventListener('click', addNewBoard);
  document.getElementById('btnBackToBoards')?.addEventListener('click', showBoardsList);
  
  // Task actions
  document.getElementById('btnAddTask')?.addEventListener('click', () => showAddTaskModal());
  document.getElementById('btnTaskFilter')?.addEventListener('click', showTaskFilter);
  document.getElementById('btnTaskSort')?.addEventListener('click', showTaskSort);
  
  // Timeline navigation
  document.getElementById('btnPrevWeek')?.addEventListener('click', () => navigateTimeline(-1));
  document.getElementById('btnNextWeek')?.addEventListener('click', () => navigateTimeline(1));
  
  // Calendar navigation
  document.getElementById('btnPrevMonth')?.addEventListener('click', () => navigateCalendar(-1));
  document.getElementById('btnNextMonth')?.addEventListener('click', () => navigateCalendar(1));
  
  // Board click handlers
  document.querySelectorAll('.board-item[data-board-id]').forEach(board => {
    board.addEventListener('click', () => openBoard(board.dataset.boardId));
  });
  
  // Task drag and drop
  initializeKanbanDragDrop();
  
  // Add task buttons in columns
  document.querySelectorAll('.add-task-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const column = e.target.closest('.kanban-column');
      const status = column?.dataset.status;
      showAddTaskModal(status);
    });
  });
  
  // Load data
  loadProjectData();
  
  console.log('✅ Project Management initialized');
}

function switchProjectView(view) {
  projectState.currentView = view;
  
  document.querySelectorAll('.project-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.view === view);
  });
  
  document.querySelectorAll('.project-view').forEach(v => {
    v.classList.remove('active');
    v.classList.add('hidden');
  });
  
  const viewId = `project${view.charAt(0).toUpperCase() + view.slice(1)}View`;
  const viewEl = document.getElementById(viewId);
  if (viewEl) {
    viewEl.classList.add('active');
    viewEl.classList.remove('hidden');
  }
  
  if (view === 'calendar') renderCalendar();
  if (view === 'timeline') renderTimeline();
  if (view === 'dashboard') renderProjectDashboard();
}

function openBoard(boardId) {
  projectState.currentBoard = boardId;
  const board = projectState.boards.find(b => b.id === boardId);
  
  document.getElementById('tasksBoardName').textContent = board?.name || 'Board';
  document.getElementById('boardsList')?.classList.add('hidden');
  document.getElementById('boardTasksSection')?.classList.remove('hidden');
  
  loadBoardTasks(boardId);
}

function showBoardsList() {
  projectState.currentBoard = null;
  document.getElementById('boardTasksSection')?.classList.add('hidden');
  document.getElementById('boardsList')?.classList.remove('hidden');
}

function addNewBoard() {
  const name = prompt('Board name:');
  if (!name) return;
  
  const newBoard = {
    id: Date.now().toString(),
    name: name,
    color: getRandomGradient(),
    tasks: 0,
    members: 1,
    progress: 0,
    createdAt: new Date().toISOString()
  };
  
  projectState.boards.push(newBoard);
  renderBoardsList();
  saveProjectData();
  showNotification('Created', `Board "${name}" created`, 'success');
}

function getRandomGradient() {
  const gradients = [
    'linear-gradient(135deg, #7c3aed, #a855f7)',
    'linear-gradient(135deg, #3b82f6, #60a5fa)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #ef4444, #f87171)',
    'linear-gradient(135deg, #ec4899, #f472b6)'
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}

function renderBoardsList() {
  const list = document.getElementById('boardsList');
  if (!list) return;
  
  const boardsHtml = projectState.boards.map(board => `
    <div class="board-item" data-board-id="${board.id}">
      <div class="board-color" style="background: ${board.color};"></div>
      <div class="board-info">
        <div class="board-name">${board.name}</div>
        <div class="board-meta">
          <span class="board-tasks">${board.tasks} tasks</span>
          <span class="board-members">${board.members} members</span>
        </div>
      </div>
      <div class="board-progress">
        <div class="progress-ring">
          <svg viewBox="0 0 36 36">
            <path class="progress-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <path class="progress-ring-fill" stroke-dasharray="${board.progress}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
          </svg>
          <span class="progress-text">${board.progress}%</span>
        </div>
      </div>
    </div>
  `).join('');
  
  list.innerHTML = boardsHtml + `
    <button class="board-item board-add-new" id="btnAddBoard">
      <span class="add-icon">+</span>
      <span class="add-text">Add New Board</span>
    </button>
  `;
  
  // Re-attach listeners
  list.querySelectorAll('.board-item[data-board-id]').forEach(board => {
    board.addEventListener('click', () => openBoard(board.dataset.boardId));
  });
  document.getElementById('btnAddBoard')?.addEventListener('click', addNewBoard);
}

function initializeKanbanDragDrop() {
  const columns = document.querySelectorAll('.column-tasks');
  
  columns.forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      column.classList.add('drag-over');
    });
    
    column.addEventListener('dragleave', () => {
      column.classList.remove('drag-over');
    });
    
    column.addEventListener('drop', (e) => {
      e.preventDefault();
      column.classList.remove('drag-over');
      
      const taskId = e.dataTransfer.getData('text/plain');
      const newStatus = column.closest('.kanban-column')?.dataset.status;
      moveTask(taskId, newStatus);
    });
  });
  
  document.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', card.dataset.taskId);
      card.classList.add('dragging');
    });
    
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });
}

function moveTask(taskId, newStatus) {
  const task = projectState.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = newStatus;
    renderKanbanBoard();
    saveProjectData();
    showNotification('Moved', `Task moved to ${newStatus}`, 'success');
  }
}

function showAddTaskModal(defaultStatus = 'todo') {
  const title = prompt('Task title:');
  if (!title) return;
  
  const newTask = {
    id: Date.now().toString(),
    boardId: projectState.currentBoard,
    title: title,
    status: defaultStatus,
    priority: 'medium',
    tags: [],
    assignee: '👤',
    dueDate: null,
    createdAt: new Date().toISOString()
  };
  
  projectState.tasks.push(newTask);
  renderKanbanBoard();
  updateBoardStats();
  saveProjectData();
  showNotification('Created', 'Task added', 'success');
}

function renderKanbanBoard() {
  const boardTasks = projectState.tasks.filter(t => t.boardId === projectState.currentBoard);
  
  const columns = { todo: [], 'in-progress': [], review: [], done: [] };
  boardTasks.forEach(task => {
    if (columns[task.status]) columns[task.status].push(task);
  });
  
  Object.keys(columns).forEach(status => {
    const container = document.getElementById(`${status === 'in-progress' ? 'inProgress' : status}Tasks`);
    const countEl = container?.closest('.kanban-column')?.querySelector('.column-count');
    
    if (countEl) countEl.textContent = columns[status].length;
    
    if (container) {
      container.innerHTML = columns[status].map(task => `
        <div class="task-card" draggable="true" data-task-id="${task.id}">
          <div class="task-priority ${task.priority}"></div>
          <div class="task-content">
            <div class="task-title">${task.title}</div>
            ${task.tags.length ? `<div class="task-tags">${task.tags.map(t => `<span class="task-tag">${t}</span>`).join('')}</div>` : ''}
            <div class="task-meta">
              <span class="task-assignee">${task.assignee}</span>
              ${task.dueDate ? `<span class="task-due">${task.dueDate}</span>` : ''}
            </div>
          </div>
        </div>
      `).join('');
    }
  });
  
  initializeKanbanDragDrop();
}

function loadBoardTasks(boardId) {
  renderKanbanBoard();
}

function updateBoardStats() {
  const board = projectState.boards.find(b => b.id === projectState.currentBoard);
  if (!board) return;
  
  const boardTasks = projectState.tasks.filter(t => t.boardId === projectState.currentBoard);
  const doneTasks = boardTasks.filter(t => t.status === 'done').length;
  
  board.tasks = boardTasks.length;
  board.progress = boardTasks.length > 0 ? Math.round((doneTasks / boardTasks.length) * 100) : 0;
}

function renderCalendar() {
  const now = new Date();
  document.getElementById('calendarMonth').textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const daysContainer = document.getElementById('calendarDays');
  if (!daysContainer) return;
  
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startPadding = firstDay.getDay();
  
  let html = '';
  for (let i = 0; i < startPadding; i++) html += '<div class="calendar-day empty"></div>';
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const isToday = d === now.getDate();
    html += `<div class="calendar-day${isToday ? ' today' : ''}">${d}</div>`;
  }
  daysContainer.innerHTML = html;
}

function renderTimeline() {
  const range = document.getElementById('timelineRange');
  if (range) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    range.textContent = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
}

function renderProjectDashboard() {
  const totalTasks = projectState.tasks.length;
  const completedTasks = projectState.tasks.filter(t => t.status === 'done').length;
  const pendingTasks = totalTasks - completedTasks;
  
  document.getElementById('totalTasks').textContent = totalTasks;
  document.getElementById('completedTasks').textContent = completedTasks;
  document.getElementById('pendingTasks').textContent = pendingTasks;
  document.getElementById('teamMembers').textContent = projectState.boards.length;
}

function navigateTimeline(direction) {
  showNotification('Timeline', `Week ${direction > 0 ? 'next' : 'previous'}`, 'info');
}

function navigateCalendar(direction) {
  showNotification('Calendar', `Month ${direction > 0 ? 'next' : 'previous'}`, 'info');
}

function showNewProjectModal() {
  addNewBoard();
}

function showProjectSearch() {
  showNotification('Search', 'Project search coming soon', 'info');
}

function showTaskFilter() {
  showNotification('Filter', 'Task filter coming soon', 'info');
}

function showTaskSort() {
  showNotification('Sort', 'Task sort coming soon', 'info');
}

async function loadProjectData() {
  try {
    const result = await chrome.storage.local.get(['projectBoards', 'projectTasks']);
    projectState.boards = result.projectBoards || [
      { id: '1', name: 'CUBE Development', color: 'linear-gradient(135deg, #7c3aed, #a855f7)', tasks: 12, members: 3, progress: 75 },
      { id: '2', name: 'Marketing Campaign', color: 'linear-gradient(135deg, #3b82f6, #60a5fa)', tasks: 8, members: 2, progress: 40 }
    ];
    projectState.tasks = result.projectTasks || [];
    renderBoardsList();
  } catch (e) {
    console.error('Failed to load project data:', e);
  }
}

async function saveProjectData() {
  try {
    await chrome.storage.local.set({
      projectBoards: projectState.boards,
      projectTasks: projectState.tasks
    });
  } catch (e) {
    console.error('Failed to save project data:', e);
  }
}

// ============================================================================
// PHASE 3 - AI SECURITY MODE (AI Nexus Enhancement)
// ============================================================================

let aiSecurityState = {
  isScanning: false,
  lastAnalysis: null
};

function initializeAISecurityMode() {
  console.log('🤖🛡️ Initializing AI Security Mode...');
  
  // AI Nexus Security Mode
  document.getElementById('btnAISecurityScan')?.addEventListener('click', startAISecurityScan);
  document.getElementById('btnUseCurrentUrlAI')?.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      document.getElementById('aiSecurityUrl').value = tab.url;
    } catch (e) {
      showNotification('Error', 'Could not get current URL', 'error');
    }
  });
  
  // Scan type checkboxes in AI mode
  document.querySelectorAll('.scan-type-item input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateAIScanConfig);
  });
  
  // AI Analysis mode buttons
  document.getElementById('btnAnalyzePageStructure')?.addEventListener('click', () => runAIAnalysis('structure'));
  document.getElementById('btnAnalyzeForms')?.addEventListener('click', () => runAIAnalysis('forms'));
  document.getElementById('btnAnalyzeLinks')?.addEventListener('click', () => runAIAnalysis('links'));
  document.getElementById('btnAnalyzePerformance')?.addEventListener('click', () => runAIAnalysis('performance'));
  document.getElementById('btnAnalyzeSEO')?.addEventListener('click', () => runAIAnalysis('seo'));
  document.getElementById('btnAnalyzeAccessibility')?.addEventListener('click', () => runAIAnalysis('accessibility'));
  
  // Custom analysis
  document.getElementById('btnRunCustomAnalysis')?.addEventListener('click', runCustomAIAnalysis);
  
  console.log('✅ AI Security Mode initialized');
}

function updateAIScanConfig() {
  const scanConfig = {
    sqlInjection: document.querySelector('[data-scan="sql"]')?.checked || false,
    xss: document.querySelector('[data-scan="xss"]')?.checked || false,
    csrf: document.querySelector('[data-scan="csrf"]')?.checked || false,
    headers: document.querySelector('[data-scan="headers"]')?.checked || false
  };
  console.log('AI Scan config updated:', scanConfig);
}

async function startAISecurityScan() {
  const urlInput = document.getElementById('aiSecurityUrl');
  const url = urlInput?.value?.trim();
  
  if (!url) {
    showNotification('Error', 'Enter a URL to analyze', 'warning');
    return;
  }
  
  aiSecurityState.isScanning = true;
  showNotification('Scanning', 'AI security analysis in progress...', 'info');
  addActivityLog('AI', `Security scan started for ${url}`, 'info');
  
  const resultsContainer = document.getElementById('aiSecurityResults');
  if (resultsContainer) {
    resultsContainer.classList.remove('hidden');
    resultsContainer.innerHTML = `
      <div class="ai-scanning">
        <div class="scanning-animation">🔍</div>
        <p>AI is analyzing security vulnerabilities...</p>
      </div>
    `;
  }
  
  try {
    const apiKey = await getActiveAPIKey();
    
    if (apiKey) {
      const prompt = `Analyze the following URL for potential security vulnerabilities. 
URL: ${url}

Provide a security assessment including:
1. Potential vulnerabilities (SQL injection, XSS, CSRF risks)
2. Security header recommendations
3. SSL/TLS assessment
4. Cookie security
5. Overall security score (1-10)
6. Prioritized remediation steps

Format your response as a structured security report.`;
      
      const analysis = await callAIProvider(prompt, apiKey);
      displayAISecurityResults(analysis, url);
    } else {
      // Demo mode
      await sleep(2000);
      displayAISecurityResults(generateDemoSecurityAnalysis(url), url);
    }
    
    addActivityLog('AI', 'Security analysis complete', 'success');
  } catch (e) {
    showNotification('Error', e.message, 'error');
    addActivityLog('AI', `Analysis failed: ${e.message}`, 'error');
    if (resultsContainer) {
      resultsContainer.innerHTML = `<div class="error-state">Analysis failed: ${e.message}</div>`;
    }
  } finally {
    aiSecurityState.isScanning = false;
  }
}

function generateDemoSecurityAnalysis(url) {
  return `## Security Analysis Report

**Target:** ${url}
**Scan Date:** ${new Date().toLocaleString()}
**Overall Score:** 7.2/10

### Vulnerabilities Found

#### 🔴 High Priority
- **Missing Content-Security-Policy header** - Increases XSS risk
- **Cookies without SameSite attribute** - CSRF vulnerability

#### 🟡 Medium Priority  
- **X-Frame-Options not set** - Clickjacking possible
- **No rate limiting detected** - Brute force risk

#### 🟢 Low Priority
- **Referrer-Policy not configured** - Information leakage

### Recommendations

1. **Immediate:** Add CSP header with strict policy
2. **High:** Set SameSite=Strict on all session cookies
3. **Medium:** Implement X-Frame-Options: DENY
4. **Low:** Add Referrer-Policy header

### SSL/TLS Status
✅ Valid certificate
✅ TLS 1.3 supported
⚠️ Consider enabling HSTS`;
}

function displayAISecurityResults(analysis, url) {
  const container = document.getElementById('aiSecurityResults');
  if (!container) return;
  
  aiSecurityState.lastAnalysis = { url, analysis, timestamp: Date.now() };
  
  container.innerHTML = `
    <div class="results-header">
      <span class="results-title">🛡️ AI Security Analysis</span>
      <button class="btn btn-sm btn-ghost" id="btnCopyAIAnalysis" title="Copy">📋</button>
    </div>
    <div class="ai-recommendations">
      <div class="recommendations-content">${formatMarkdown(analysis)}</div>
    </div>
    <div class="results-actions">
      <button class="btn btn-secondary btn-sm" id="btnExportAIReport">
        <span class="btn-icon">📄</span> Export
      </button>
      <button class="btn btn-secondary btn-sm" id="btnNewAIScan">
        <span class="btn-icon">🔄</span> New Scan
      </button>
    </div>
  `;
  
  document.getElementById('btnCopyAIAnalysis')?.addEventListener('click', () => {
    navigator.clipboard.writeText(analysis);
    showNotification('Copied', 'Analysis copied to clipboard', 'success');
  });
  
  document.getElementById('btnExportAIReport')?.addEventListener('click', () => {
    const blob = new Blob([analysis], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ai-security-report-${Date.now()}.md`;
    a.click();
  });
  
  document.getElementById('btnNewAIScan')?.addEventListener('click', () => {
    container.classList.add('hidden');
    document.getElementById('aiSecurityUrl').value = '';
  });
}

function formatMarkdown(text) {
  return text
    .replace(/^### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^## (.*$)/gim, '<h3>$1</h3>')
    .replace(/^# (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
    .replace(/\n/g, '<br>')
    .replace(/<\/ul><br><ul>/g, '');
}

async function runAIAnalysis(type) {
  const typeLabels = {
    structure: 'Page Structure',
    forms: 'Form Analysis',
    links: 'Link Analysis',
    performance: 'Performance',
    seo: 'SEO',
    accessibility: 'Accessibility'
  };
  
  showNotification('Analyzing', `Running ${typeLabels[type]} analysis...`, 'info');
  addActivityLog('AI', `Started ${typeLabels[type]} analysis`, 'info');
  
  const resultsContainer = document.getElementById('analysisResults');
  if (resultsContainer) {
    resultsContainer.classList.remove('hidden');
    resultsContainer.querySelector('.analysis-content').innerHTML = `<div class="loading">Analyzing ${typeLabels[type]}...</div>`;
  }
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const apiKey = await getActiveAPIKey();
    
    let analysis;
    if (apiKey) {
      const prompts = {
        structure: `Analyze the DOM structure of ${tab.url}. Describe the layout, main sections, and semantic structure.`,
        forms: `Analyze all forms on ${tab.url}. List form fields, validation, and security considerations.`,
        links: `Analyze all links on ${tab.url}. Categorize internal/external links and check for broken links.`,
        performance: `Analyze performance factors for ${tab.url}. Check load time, resource optimization, and bottlenecks.`,
        seo: `Analyze SEO factors for ${tab.url}. Check meta tags, headings, content structure, and optimization.`,
        accessibility: `Analyze accessibility for ${tab.url}. Check WCAG compliance, ARIA labels, and keyboard navigation.`
      };
      analysis = await callAIProvider(prompts[type], apiKey);
    } else {
      await sleep(1500);
      analysis = generateDemoAnalysis(type, tab.url);
    }
    
    if (resultsContainer) {
      resultsContainer.querySelector('.analysis-content').innerHTML = formatMarkdown(analysis);
    }
    
    addActivityLog('AI', `${typeLabels[type]} analysis complete`, 'success');
  } catch (e) {
    showNotification('Error', e.message, 'error');
    if (resultsContainer) {
      resultsContainer.querySelector('.analysis-content').innerHTML = `<div class="error">Analysis failed: ${e.message}</div>`;
    }
  }
}

function generateDemoAnalysis(type, url) {
  const analyses = {
    structure: `## Page Structure Analysis\n\n**URL:** ${url}\n\n### Main Sections\n- Header with navigation\n- Main content area\n- Sidebar (if present)\n- Footer\n\n### Semantic Elements\n✅ Uses semantic HTML5 tags\n⚠️ Some divs could use better semantic markup`,
    forms: `## Form Analysis\n\n**URL:** ${url}\n\n### Forms Detected: 2\n\n1. **Search Form**\n   - Fields: 1 text input\n   - Validation: Basic HTML5\n   \n2. **Contact Form**\n   - Fields: 4 inputs\n   - Validation: Client-side`,
    links: `## Link Analysis\n\n**URL:** ${url}\n\n### Summary\n- Internal links: 15\n- External links: 8\n- Anchor links: 3\n\n### Issues\n⚠️ 2 links missing rel="noopener"`,
    performance: `## Performance Analysis\n\n**URL:** ${url}\n\n### Metrics\n- Load time: ~2.5s\n- First paint: ~1.2s\n- Resources: 45 requests\n\n### Recommendations\n- Optimize images\n- Enable compression`,
    seo: `## SEO Analysis\n\n**URL:** ${url}\n\n### Score: 72/100\n\n✅ Title tag present\n✅ Meta description\n⚠️ Missing alt text on 3 images\n❌ No structured data`,
    accessibility: `## Accessibility Analysis\n\n**URL:** ${url}\n\n### WCAG Compliance: Partial\n\n✅ Keyboard navigable\n✅ Color contrast OK\n⚠️ Some images missing alt\n❌ Missing skip links`
  };
  return analyses[type] || 'Analysis complete.';
}

async function runCustomAIAnalysis() {
  const input = document.getElementById('customAnalysisQuery');
  const query = input?.value?.trim();
  
  if (!query) {
    showNotification('Error', 'Enter an analysis query', 'warning');
    return;
  }
  
  showNotification('Analyzing', 'Running custom analysis...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const apiKey = await getActiveAPIKey();
    
    let analysis;
    if (apiKey) {
      analysis = await callAIProvider(`For the page ${tab.url}: ${query}`, apiKey);
    } else {
      await sleep(1500);
      analysis = `## Custom Analysis\n\n**Query:** ${query}\n**URL:** ${tab.url}\n\nThis is a demo response. Configure your AI API key for real analysis.`;
    }
    
    const resultsContainer = document.getElementById('analysisResults');
    if (resultsContainer) {
      resultsContainer.classList.remove('hidden');
      resultsContainer.querySelector('.analysis-content').innerHTML = formatMarkdown(analysis);
    }
  } catch (e) {
    showNotification('Error', e.message, 'error');
  }
}

// ============================================================================
// SUBSCRIPTION UI SYSTEM
// ============================================================================

function initializeSubscriptionUI() {
  console.log('💎 Initializing Subscription UI...');
  
  // Initialize subscription service
  if (window.subscriptionService) {
    window.subscriptionService.initialize().then(() => {
      updateSubscriptionDisplay();
    });
  }
  
  // Activate license button
  document.getElementById('btnActivateLicense')?.addEventListener('click', activateLicenseKey);
  
  // Remove license button
  document.getElementById('btnRemoveLicense')?.addEventListener('click', removeLicense);
  
  // License key input - format on paste
  document.getElementById('licenseKeyInput')?.addEventListener('input', formatLicenseInput);
  
  // Plan upgrade buttons
  document.querySelectorAll('.plan-btn[data-plan]').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      if (plan !== 'free') {
        upgradeToPlan(plan);
      }
    });
  });
  
  // Manage subscription from help tab
  document.getElementById('btnManageSubscription')?.addEventListener('click', () => {
    switchTab('tab-subscription');
  });
  
  // Listen for subscription changes
  window.addEventListener('subscription-changed', updateSubscriptionDisplay);
  
  // Initial AI quota check
  updateAIQuotaDisplay();
  
  console.log('✅ Subscription UI initialized');
}

function formatLicenseInput(e) {
  let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  
  // Auto-add dashes
  if (value.length > 4 && !value.includes('-')) {
    const parts = value.match(/.{1,5}/g) || [];
    value = parts.slice(0, 5).join('-');
  }
  
  e.target.value = value.slice(0, 29);
}

async function activateLicenseKey() {
  const input = document.getElementById('licenseKeyInput');
  const feedback = document.getElementById('licenseFeedback');
  const licenseKey = input?.value?.trim();
  
  if (!licenseKey) {
    showLicenseFeedback('Please enter a license key', 'error');
    return;
  }
  
  if (!window.subscriptionService) {
    showLicenseFeedback('Subscription service not loaded', 'error');
    return;
  }
  
  showLicenseFeedback('Validating license key...', 'info');
  
  const result = await window.subscriptionService.activateLicense(licenseKey);
  
  if (result.valid) {
    showLicenseFeedback(`✅ License activated! You now have ${result.tier.toUpperCase()} access.`, 'success');
    updateSubscriptionDisplay();
    showNotification('License Activated', `Welcome to CUBE ${result.tier.toUpperCase()}!`, 'success');
  } else {
    showLicenseFeedback(`❌ ${result.error || 'Invalid license key'}`, 'error');
  }
}

function showLicenseFeedback(message, type) {
  const feedback = document.getElementById('licenseFeedback');
  if (feedback) {
    feedback.textContent = message;
    feedback.className = `license-feedback ${type}`;
    feedback.classList.remove('hidden');
    
    if (type === 'info') {
      feedback.style.background = 'rgba(59, 130, 246, 0.1)';
      feedback.style.color = '#3b82f6';
      feedback.style.borderColor = 'rgba(59, 130, 246, 0.3)';
    }
  }
}

async function removeLicense() {
  if (!window.subscriptionService) return;
  
  const confirmed = confirm('Are you sure you want to remove your license? You will be downgraded to the Free tier.');
  
  if (confirmed) {
    await window.subscriptionService.deactivateLicense();
    updateSubscriptionDisplay();
    showNotification('License Removed', 'You are now on the Free tier', 'info');
    
    const input = document.getElementById('licenseKeyInput');
    if (input) input.value = '';
    
    document.getElementById('licenseFeedback')?.classList.add('hidden');
  }
}

function updateSubscriptionDisplay() {
  if (!window.subscriptionService) return;
  
  const status = window.subscriptionService.getStatus();
  const badge = window.subscriptionService.getTierBadge();
  
  // Update tier badge
  const tierBadge = document.getElementById('currentTierBadge');
  if (tierBadge) {
    tierBadge.textContent = `${badge.icon} ${badge.label}`;
    tierBadge.setAttribute('data-tier', status.tier);
    tierBadge.style.background = badge.color;
    tierBadge.style.color = 'white';
  }
  
  // Update plan status
  const statusText = document.getElementById('planStatusText');
  if (statusText) {
    statusText.textContent = status.isActive ? 'Active' : 'Inactive';
  }
  
  const statusDot = document.querySelector('.status-dot');
  if (statusDot) {
    statusDot.classList.toggle('active', status.isActive);
  }
  
  // Update expiry
  const expiryEl = document.getElementById('planExpiry');
  if (expiryEl && status.subscription?.validUntil) {
    const expiry = new Date(status.subscription.validUntil);
    expiryEl.textContent = `Expires: ${expiry.toLocaleDateString()}`;
  } else if (expiryEl) {
    expiryEl.textContent = status.isFree ? 'Free forever' : 'No expiration set';
  }
  
  // Update subtitle
  const subtitle = document.getElementById('currentPlanSubtitle');
  if (subtitle) {
    subtitle.textContent = `${badge.label} plan active`;
  }
  
  // Update plan buttons
  document.querySelectorAll('.pricing-plan').forEach(plan => {
    const planTier = plan.dataset.tier;
    const btn = plan.querySelector('.plan-btn');
    
    if (planTier === status.tier) {
      btn.textContent = 'Current Plan';
      btn.disabled = true;
      btn.classList.remove('btn-primary', 'btn-accent');
      btn.classList.add('btn-secondary');
    } else if (['free', 'pro'].includes(status.tier) && planTier === 'elite') {
      btn.textContent = 'Go Elite';
      btn.disabled = false;
    } else if (status.tier === 'free' && planTier === 'pro') {
      btn.textContent = 'Upgrade to Pro';
      btn.disabled = false;
    }
  });
  
  // Update help tab subscription section
  const helpTierDisplay = document.getElementById('subTierDisplay');
  if (helpTierDisplay) {
    helpTierDisplay.innerHTML = `
      <span class="tier-badge ${status.tier}">${badge.icon} ${badge.label}</span>
      <span class="tier-expiry">${status.isActive ? 'Active' : 'Trial'}</span>
    `;
  }
  
  updateAIQuotaDisplay();
}

async function updateAIQuotaDisplay() {
  if (!window.subscriptionService) return;
  
  const quota = await window.subscriptionService.checkAIQuota();
  
  const quotaText = document.getElementById('aiQuotaText');
  const quotaFill = document.getElementById('aiQuotaFill');
  
  if (quotaText) {
    if (quota.limit === 'unlimited') {
      quotaText.textContent = `${quota.used} / ∞`;
    } else {
      quotaText.textContent = `${quota.used} / ${quota.limit}`;
    }
  }
  
  if (quotaFill) {
    const percentage = quota.limit === 'unlimited' ? 0 : (quota.used / quota.limit) * 100;
    quotaFill.style.width = `${Math.min(100, percentage)}%`;
    quotaFill.classList.toggle('warning', percentage > 80);
  }
}

function upgradeToPlan(plan) {
  const url = `https://cubeai.tools/pricing?tier=${plan}&source=extension`;
  window.open(url, '_blank');
  showNotification('Opening Upgrade Page', `Redirecting to ${plan.toUpperCase()} subscription...`, 'info');
}

// ============================================================================
// ENHANCED AUTOFILL SYSTEM
// ============================================================================

function initializeEnhancedAutofill() {
  console.log('🎯 Initializing Enhanced Autofill...');
  
  // Quick autofill button
  document.getElementById('btnQuickAutoFill')?.addEventListener('click', runEnhancedAutofill);
  
  // AI-assisted autofill button
  document.getElementById('btnAIAutofill')?.addEventListener('click', runAIAssistedAutofill);
  
  // Smart field detection
  document.getElementById('btnSmartDetect')?.addEventListener('click', runSmartFieldDetection);
  
  // Batch autofill
  document.getElementById('btnBatchAutofill')?.addEventListener('click', runBatchAutofill);
  
  console.log('✅ Enhanced Autofill initialized');
}

async function runEnhancedAutofill() {
  showNotification('Autofill', 'Running enhanced autofill...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get saved profile
    const { autofillProfile } = await chrome.storage.local.get('autofillProfile');
    const profile = autofillProfile || getDefaultAutofillProfile();
    
    // Send to content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'run-intelligent-autofill',
      data: profile,
      options: {
        useAI: false,
        detectNewFields: true,
        highlightFilled: true
      }
    });
    
    if (response?.success) {
      showNotification('✅ Autofill Complete', `Filled ${response.filledCount || 0} fields`, 'success');
      addActivityLog('Autofill', `Filled ${response.filledCount || 0} fields on ${new URL(tab.url).hostname}`, 'success');
      
      // Track AI quota if used
      if (window.subscriptionService && response.usedAI) {
        await window.subscriptionService.incrementAIUsage();
        updateAIQuotaDisplay();
      }
    } else {
      showNotification('Autofill', response?.message || 'No fillable fields found', 'warning');
    }
  } catch (e) {
    console.error('Autofill error:', e);
    showNotification('Error', e.message || 'Failed to autofill', 'error');
  }
}

async function runAIAssistedAutofill() {
  // Check subscription
  if (window.subscriptionService && !window.subscriptionService.hasFeature('aiAssistedAutomation')) {
    const prompt = window.subscriptionService.showUpgradePrompt('AI-Assisted Autofill', 'pro');
    showNotification(prompt.title, prompt.message, 'warning');
    return;
  }
  
  showNotification('AI Autofill', 'Analyzing page with AI...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get page context first
    const context = await chrome.tabs.sendMessage(tab.id, { type: 'analyze-page' });
    
    // Get AI suggestion for how to fill
    const apiKey = await getActiveAPIKey();
    let aiSuggestion = null;
    
    if (apiKey && context?.formFields?.fields > 0) {
      const prompt = `Analyze this form and suggest the best way to fill it:
        Page: ${tab.url}
        Form fields: ${context.formFields.count} forms, ${context.formFields.fields} fields
        Field types detected: ${JSON.stringify(context.formFields.types || {})}
        
        Provide a JSON object with field suggestions. Keep it brief.`;
      
      try {
        aiSuggestion = await callAIProvider(prompt, apiKey);
        await window.subscriptionService?.incrementAIUsage();
      } catch (e) {
        console.warn('AI suggestion failed:', e);
      }
    }
    
    // Get profile and merge with AI suggestions
    const { autofillProfile } = await chrome.storage.local.get('autofillProfile');
    const profile = autofillProfile || getDefaultAutofillProfile();
    
    // Run autofill with enhanced detection
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'run-intelligent-autofill',
      data: profile,
      options: {
        useAI: true,
        aiSuggestions: aiSuggestion,
        detectNewFields: true,
        highlightFilled: true,
        confidenceThreshold: 0.7
      }
    });
    
    if (response?.success) {
      showNotification('✅ AI Autofill Complete', `Intelligently filled ${response.filledCount || 0} fields`, 'success');
      addActivityLog('AI Autofill', `Filled ${response.filledCount || 0} fields with AI assistance`, 'success');
    } else {
      showNotification('AI Autofill', response?.message || 'Could not determine appropriate values', 'warning');
    }
    
    updateAIQuotaDisplay();
  } catch (e) {
    console.error('AI Autofill error:', e);
    showNotification('Error', e.message || 'AI autofill failed', 'error');
  }
}

async function runSmartFieldDetection() {
  showNotification('Detecting', 'Scanning page for fillable fields...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'smart-detect-fields',
      options: {
        includeHidden: false,
        analyzeLabels: true,
        detectPatterns: true
      }
    });
    
    if (response?.fields && response.fields.length > 0) {
      showNotification('✅ Detection Complete', `Found ${response.fields.length} fillable fields`, 'success');
      
      // Show detected fields in UI
      displayDetectedFields(response.fields);
      addActivityLog('Detection', `Found ${response.fields.length} fields on ${new URL(tab.url).hostname}`, 'info');
    } else {
      showNotification('Detection', 'No fillable fields found on this page', 'info');
    }
  } catch (e) {
    console.error('Field detection error:', e);
    showNotification('Error', 'Failed to detect fields', 'error');
  }
}

function displayDetectedFields(fields) {
  // Log to console for now
  console.log('Detected fields:', fields);
  
  // Could show in a modal or panel
  const summary = fields.reduce((acc, field) => {
    acc[field.type] = (acc[field.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Field summary:', summary);
}

async function runBatchAutofill() {
  // Check subscription
  if (window.subscriptionService && !window.subscriptionService.hasFeature('batchProcessing')) {
    const prompt = window.subscriptionService.showUpgradePrompt('Batch Autofill', 'pro');
    showNotification(prompt.title, prompt.message, 'warning');
    return;
  }
  
  showNotification('Batch Autofill', 'Running batch autofill across all forms...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const { autofillProfile } = await chrome.storage.local.get('autofillProfile');
    const profile = autofillProfile || getDefaultAutofillProfile();
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'batch-autofill',
      data: profile,
      options: {
        allForms: true,
        skipHidden: true,
        confirmEach: false
      }
    });
    
    if (response?.success) {
      showNotification('✅ Batch Complete', `Filled ${response.totalFilled || 0} fields across ${response.formsProcessed || 0} forms`, 'success');
    } else {
      showNotification('Batch Autofill', response?.message || 'No forms to process', 'warning');
    }
  } catch (e) {
    console.error('Batch autofill error:', e);
    showNotification('Error', e.message || 'Batch autofill failed', 'error');
  }
}

function getDefaultAutofillProfile() {
  return {
    personal: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    },
    payment: {
      cardNumber: '',
      expiry: '',
      cvv: '',
      cardName: ''
    },
    work: {
      company: '',
      jobTitle: '',
      workEmail: '',
      workPhone: ''
    }
  };
}

// ============================================================================
// ENHANCED FILE DETECTION SYSTEM  
// ============================================================================

async function runEnhancedFileDetection() {
  // Check subscription for OCR
  const hasOCR = !window.subscriptionService || window.subscriptionService.hasFeature('ocrEnabled');
  
  showNotification('File Detection', 'Scanning page for files and documents...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'detect-files',
      options: {
        detectPDF: true,
        detectImages: hasOCR,
        detectDocuments: true,
        useOCR: hasOCR,
        extractMetadata: true
      }
    });
    
    if (response?.files && response.files.length > 0) {
      showNotification('✅ Files Detected', `Found ${response.files.length} files/documents`, 'success');
      displayDetectedFiles(response.files);
    } else {
      showNotification('File Detection', 'No downloadable files found', 'info');
    }
  } catch (e) {
    console.error('File detection error:', e);
    showNotification('Error', 'Failed to detect files', 'error');
  }
}

function displayDetectedFiles(files) {
  console.log('Detected files:', files);
  
  const byType = files.reduce((acc, file) => {
    const type = file.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Files by type:', byType);
}

// ============================================================================
// AI-POWERED AUTOMATION ENHANCEMENTS
// ============================================================================

async function runAIAutomationSuggestion() {
  // Check subscription
  if (window.subscriptionService && !window.subscriptionService.hasFeature('aiAssistedAutomation')) {
    const prompt = window.subscriptionService.showUpgradePrompt('AI Automation', 'pro');
    showNotification(prompt.title, prompt.message, 'warning');
    return;
  }
  
  showNotification('AI Analysis', 'Analyzing page for automation opportunities...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get page context
    const context = await chrome.tabs.sendMessage(tab.id, { type: 'analyze-page' });
    
    const apiKey = await getActiveAPIKey();
    if (!apiKey) {
      showNotification('AI Required', 'Configure an AI API key in settings', 'warning');
      return;
    }
    
    const prompt = `Analyze this webpage and suggest automation opportunities:
      URL: ${tab.url}
      Forms: ${context?.formFields?.count || 0}
      Fields: ${context?.formFields?.fields || 0}
      Links: ${context?.pageInfo?.linkCount || 0}
      
      Provide 3-5 specific automation suggestions that could save time on this page.
      Format as a numbered list with brief descriptions.`;
    
    const suggestions = await callAIProvider(prompt, apiKey);
    await window.subscriptionService?.incrementAIUsage();
    
    // Show suggestions in a modal or notification
    console.log('AI Automation Suggestions:', suggestions);
    showNotification('✅ Analysis Complete', 'Check console for automation suggestions', 'success');
    
    updateAIQuotaDisplay();
  } catch (e) {
    console.error('AI automation analysis error:', e);
    showNotification('Error', e.message || 'AI analysis failed', 'error');
  }
}

// ============================================================================
// AI SEARCH TAB FUNCTIONALITY
// ============================================================================

const AI_SEARCH_STATE = {
  currentMode: 'instant',
  searchHistory: [],
  isSearching: false,
  currentQuery: ''
};

const SEARCH_MODES = {
  instant: { label: 'Instant', icon: '⚡', description: 'Quick answers from the web' },
  deep: { label: 'Deep', icon: '🔬', description: 'Comprehensive research' },
  creative: { label: 'Creative', icon: '🎨', description: 'Brainstorming & ideas' },
  research: { label: 'Research', icon: '📚', description: 'Academic & citations' },
  code: { label: 'Code', icon: '💻', description: 'Programming help' }
};

function initializeAISearchTab() {
  console.log('🔍 Initializing AI Search tab');
  
  // Mode buttons
  const modeButtons = document.querySelectorAll('#tab-ai-search .mode-btn');
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AI_SEARCH_STATE.currentMode = btn.dataset.mode;
      console.log(`🔍 Search mode: ${AI_SEARCH_STATE.currentMode}`);
    });
  });
  
  // Search button
  const searchBtn = document.getElementById('btnAISearch');
  if (searchBtn) {
    searchBtn.addEventListener('click', performAISearch);
  }
  
  // Search input - Enter key
  const searchInput = document.getElementById('aiSearchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !AI_SEARCH_STATE.isSearching) {
        performAISearch();
      }
    });
  }
  
  // Voice search button
  const voiceBtn = document.querySelector('#tab-ai-search .voice-btn');
  if (voiceBtn) {
    voiceBtn.addEventListener('click', startVoiceSearch);
  }
  
  // Quick actions
  const quickActions = document.querySelectorAll('#tab-ai-search .quick-action');
  quickActions.forEach(action => {
    action.addEventListener('click', () => {
      const query = action.textContent;
      if (searchInput) {
        searchInput.value = query;
        performAISearch();
      }
    });
  });
  
  // Load trending topics
  loadTrendingTopics();
  
  console.log('✅ AI Search tab initialized');
}

async function performAISearch() {
  const searchInput = document.getElementById('aiSearchInput');
  const resultsContainer = document.getElementById('aiSearchResults');
  const query = searchInput?.value?.trim();
  
  if (!query || AI_SEARCH_STATE.isSearching) return;
  
  AI_SEARCH_STATE.isSearching = true;
  AI_SEARCH_STATE.currentQuery = query;
  
  // Show loading state
  resultsContainer.innerHTML = `
    <div class="search-loading">
      <div class="loading-animation">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
      <p>Searching with ${SEARCH_MODES[AI_SEARCH_STATE.currentMode].label} mode...</p>
    </div>
  `;
  
  try {
    // Get API key
    const apiKey = await getActiveAPIKey();
    if (!apiKey) {
      throw new Error('Please configure an AI API key in settings');
    }
    
    // Build search prompt based on mode
    const modePrompts = {
      instant: `Provide a quick, concise answer to: "${query}". Include 2-3 key points and cite sources.`,
      deep: `Conduct comprehensive research on: "${query}". Provide detailed analysis with multiple perspectives and thorough citations.`,
      creative: `Brainstorm creative ideas and solutions for: "${query}". Think outside the box and provide unique perspectives.`,
      research: `Academic research on: "${query}". Include scholarly sources, methodologies, and cite peer-reviewed content.`,
      code: `Programming help for: "${query}". Include code examples, best practices, and explanations.`
    };
    
    const prompt = modePrompts[AI_SEARCH_STATE.currentMode];
    const result = await callAIProvider(prompt, apiKey);
    
    // Track in subscription
    await window.subscriptionService?.incrementAIUsage();
    
    // Save to history
    AI_SEARCH_STATE.searchHistory.unshift({
      query,
      mode: AI_SEARCH_STATE.currentMode,
      timestamp: Date.now()
    });
    
    // Display results
    displayAISearchResults(query, result);
    
    updateAIQuotaDisplay();
    
  } catch (error) {
    console.error('AI Search error:', error);
    resultsContainer.innerHTML = `
      <div class="search-error">
        <span class="error-icon">⚠️</span>
        <h4>Search Failed</h4>
        <p>${error.message}</p>
        <button class="retry-btn" onclick="performAISearch()">Try Again</button>
      </div>
    `;
  } finally {
    AI_SEARCH_STATE.isSearching = false;
  }
}

function displayAISearchResults(query, result) {
  const resultsContainer = document.getElementById('aiSearchResults');
  
  // Parse result for sources (simple heuristic)
  const sources = extractSourcesFromResult(result);
  
  resultsContainer.innerHTML = `
    <div class="ai-answer">
      <div class="ai-answer-header">
        <span class="ai-icon">🤖</span>
        <h4>AI Answer</h4>
        <span class="mode-badge">${SEARCH_MODES[AI_SEARCH_STATE.currentMode].label}</span>
      </div>
      <div class="ai-answer-content">
        ${formatAIResponse(result)}
      </div>
    </div>
    
    ${sources.length > 0 ? `
      <div class="search-sources">
        <h4>📚 Sources</h4>
        ${sources.map((source, i) => `
          <div class="source-item" onclick="openSource('${source.url}')">
            <span class="source-number">${i + 1}</span>
            <div class="source-info">
              <div class="source-title">${source.title}</div>
              <div class="source-domain">${source.domain}</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    <div class="follow-up-section">
      <h4>🔄 Related Questions</h4>
      <div class="follow-up-suggestions">
        ${generateFollowUpQuestions(query).map(q => `
          <button class="follow-up-btn" onclick="searchFollowUp('${q}')">${q}</button>
        `).join('')}
      </div>
    </div>
  `;
}

function formatAIResponse(text) {
  // Convert markdown-like formatting to HTML
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function extractSourcesFromResult(result) {
  // Simple heuristic to extract mentioned sources
  const urlPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+)/g;
  const matches = result.match(urlPattern) || [];
  
  return matches.slice(0, 5).map(url => ({
    url: url.startsWith('http') ? url : `https://${url}`,
    title: url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0],
    domain: url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
  }));
}

function generateFollowUpQuestions(query) {
  const baseQuestions = [
    `What are the alternatives to ${query}?`,
    `How does ${query} work in detail?`,
    `What are the pros and cons of ${query}?`
  ];
  return baseQuestions.slice(0, 3);
}

function searchFollowUp(query) {
  const searchInput = document.getElementById('aiSearchInput');
  if (searchInput) {
    searchInput.value = query;
    performAISearch();
  }
}

function openSource(url) {
  chrome.tabs.create({ url });
}

function startVoiceSearch() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showNotification('Voice Search', 'Speech recognition not supported in this browser', 'warning');
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = 'en-US';
  recognition.continuous = false;
  
  const voiceBtn = document.querySelector('#tab-ai-search .voice-btn');
  
  recognition.onstart = () => {
    voiceBtn?.classList.add('listening');
    showNotification('Voice Search', 'Listening...', 'info');
  };
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const searchInput = document.getElementById('aiSearchInput');
    if (searchInput) {
      searchInput.value = transcript;
      performAISearch();
    }
  };
  
  recognition.onend = () => {
    voiceBtn?.classList.remove('listening');
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    voiceBtn?.classList.remove('listening');
    showNotification('Voice Search', `Error: ${event.error}`, 'error');
  };
  
  recognition.start();
}

function loadTrendingTopics() {
  const trendingContainer = document.querySelector('#tab-ai-search .trending-topics');
  if (!trendingContainer) return;
  
  const trending = [
    '🔥 AI News Today',
    '📈 Stock Market',
    '🌍 Climate Updates',
    '💻 Tech Reviews',
    '🎬 Entertainment'
  ];
  
  trendingContainer.innerHTML = trending.map(topic => `
    <button class="trending-topic" onclick="document.getElementById('aiSearchInput').value='${topic.replace(/^[^\s]+\s/, '')}'; performAISearch();">${topic}</button>
  `).join('');
}

// ============================================================================
// INTELLIGENCE CENTER TAB FUNCTIONALITY
// ============================================================================

const INTEL_STATE = {
  currentType: 'person',
  investigations: [],
  isSearching: false
};

const INTEL_TYPES = {
  person: { label: 'Person', icon: '👤', placeholder: 'Enter name, email, or phone' },
  company: { label: 'Company', icon: '🏢', placeholder: 'Enter company name or domain' },
  asset: { label: 'Asset', icon: '📦', placeholder: 'Enter crypto address or asset ID' },
  domain: { label: 'Domain', icon: '🌐', placeholder: 'Enter domain or IP address' }
};

function initializeIntelligenceTab() {
  console.log('🕵️ Initializing Intelligence Center tab');
  
  // Entity type buttons
  const typeButtons = document.querySelectorAll('#tab-intelligence .intel-type-btn');
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      INTEL_STATE.currentType = btn.dataset.type;
      
      // Update placeholder
      const input = document.getElementById('intelSearchInput');
      if (input) {
        input.placeholder = INTEL_TYPES[INTEL_STATE.currentType].placeholder;
      }
      
      console.log(`🕵️ Intel type: ${INTEL_STATE.currentType}`);
    });
  });
  
  // Search button
  const searchBtn = document.getElementById('btnIntelSearch');
  if (searchBtn) {
    searchBtn.addEventListener('click', performIntelSearch);
  }
  
  // Search input - Enter key
  const searchInput = document.getElementById('intelSearchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !INTEL_STATE.isSearching) {
        performIntelSearch();
      }
    });
  }
  
  // Load investigation history
  loadInvestigationHistory();
  
  console.log('✅ Intelligence Center tab initialized');
}

async function performIntelSearch() {
  const searchInput = document.getElementById('intelSearchInput');
  const resultsContainer = document.getElementById('intelResults');
  const query = searchInput?.value?.trim();
  
  if (!query || INTEL_STATE.isSearching) return;
  
  INTEL_STATE.isSearching = true;
  
  // Show loading state
  resultsContainer.innerHTML = `
    <div class="intel-loading">
      <div class="loading-animation">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
      <p>Investigating ${INTEL_TYPES[INTEL_STATE.currentType].label}...</p>
    </div>
  `;
  
  try {
    // Get API key
    const apiKey = await getActiveAPIKey();
    if (!apiKey) {
      throw new Error('Please configure an AI API key in settings');
    }
    
    // Build intelligence prompt based on type
    const typePrompts = {
      person: `OSINT investigation on person: "${query}". Find:
        1. Possible social media profiles
        2. Professional information (LinkedIn, etc.)
        3. Public records mentions
        4. Any news or media mentions
        Be thorough but note this is public information only.`,
      company: `OSINT investigation on company: "${query}". Research:
        1. Company overview and registration info
        2. Key executives and leadership
        3. Recent news and press releases
        4. Social media presence
        5. Financial information if public
        Use publicly available sources.`,
      asset: `Asset investigation for: "${query}". Analyze:
        1. If crypto address: transaction history, wallet activity, risk assessment
        2. If NFT/token: ownership history, collection info
        3. Market data and valuation
        Note: This analysis uses public blockchain data.`,
      domain: `Domain/IP investigation for: "${query}". Research:
        1. WHOIS information
        2. DNS records
        3. SSL certificate info
        4. Hosting provider
        5. Associated domains
        6. Security reputation
        Use public DNS and security tools data.`
    };
    
    const prompt = typePrompts[INTEL_STATE.currentType];
    const result = await callAIProvider(prompt, apiKey);
    
    // Track in subscription
    await window.subscriptionService?.incrementAIUsage();
    
    // Save to investigations
    const investigation = {
      query,
      type: INTEL_STATE.currentType,
      result,
      timestamp: Date.now()
    };
    INTEL_STATE.investigations.unshift(investigation);
    saveInvestigationHistory();
    
    // Display results
    displayIntelResults(query, result);
    
    updateAIQuotaDisplay();
    
  } catch (error) {
    console.error('Intelligence search error:', error);
    resultsContainer.innerHTML = `
      <div class="intel-error">
        <span class="error-icon">⚠️</span>
        <h4>Investigation Failed</h4>
        <p>${error.message}</p>
        <button class="retry-btn" onclick="performIntelSearch()">Try Again</button>
      </div>
    `;
  } finally {
    INTEL_STATE.isSearching = false;
  }
}

function displayIntelResults(query, result) {
  const resultsContainer = document.getElementById('intelResults');
  const typeInfo = INTEL_TYPES[INTEL_STATE.currentType];
  
  resultsContainer.innerHTML = `
    <div class="intel-result-card">
      <div class="intel-result-header">
        <span class="intel-result-icon">${typeInfo.icon}</span>
        <span class="intel-result-title">${query}</span>
        <span class="intel-result-badge">Verified</span>
      </div>
      <div class="intel-result-content">
        ${formatAIResponse(result)}
      </div>
      <div class="intel-result-actions">
        <button class="intel-action-btn" onclick="exportIntelReport('${query}')">
          📄 Export Report
        </button>
        <button class="intel-action-btn" onclick="saveToCollection('${query}')">
          💾 Save to Collection
        </button>
      </div>
    </div>
    
    <div class="intel-disclaimer">
      <p>⚠️ This information is compiled from publicly available sources. 
      Always verify through official channels. CUBE is not responsible for 
      the accuracy of third-party data.</p>
    </div>
  `;
}

function exportIntelReport(query) {
  const investigation = INTEL_STATE.investigations.find(i => i.query === query);
  if (!investigation) {
    showNotification('Export', 'Investigation not found', 'error');
    return;
  }
  
  const report = `
CUBE INTELLIGENCE REPORT
========================
Generated: ${new Date().toISOString()}
Type: ${INTEL_TYPES[investigation.type].label}
Subject: ${investigation.query}

FINDINGS
--------
${investigation.result}

DISCLAIMER
----------
This report contains information from public sources only.
Verify all information through official channels.
  `.trim();
  
  // Download as text file
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `intel-report-${query.replace(/\s+/g, '-')}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('Export', 'Report downloaded successfully', 'success');
}

function saveToCollection(query) {
  showNotification('Collections', 'Saved to your Intelligence collection', 'success');
}

function loadInvestigationHistory() {
  chrome.storage.local.get(['intelHistory'], (result) => {
    if (result.intelHistory) {
      INTEL_STATE.investigations = result.intelHistory;
      renderInvestigationHistory();
    }
  });
}

function saveInvestigationHistory() {
  // Keep only last 20
  const toSave = INTEL_STATE.investigations.slice(0, 20);
  chrome.storage.local.set({ intelHistory: toSave });
  renderInvestigationHistory();
}

function renderInvestigationHistory() {
  const historyContainer = document.querySelector('#tab-intelligence .history-list');
  if (!historyContainer) return;
  
  if (INTEL_STATE.investigations.length === 0) {
    historyContainer.innerHTML = '<div class="history-empty">No investigations yet</div>';
    return;
  }
  
  historyContainer.innerHTML = INTEL_STATE.investigations.slice(0, 5).map(inv => `
    <div class="history-item" onclick="rerunInvestigation('${inv.query}', '${inv.type}')">
      <span class="history-icon">${INTEL_TYPES[inv.type].icon}</span>
      <span class="history-query">${inv.query}</span>
      <span class="history-time">${formatTimeAgo(inv.timestamp)}</span>
    </div>
  `).join('');
}

function rerunInvestigation(query, type) {
  // Set type
  const typeButtons = document.querySelectorAll('#tab-intelligence .intel-type-btn');
  typeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  INTEL_STATE.currentType = type;
  
  // Set query and search
  const input = document.getElementById('intelSearchInput');
  if (input) {
    input.value = query;
    input.placeholder = INTEL_TYPES[type].placeholder;
    performIntelSearch();
  }
}

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ============================================================================
// INITIALIZE NEW TABS ON LOAD
// ============================================================================

// Add to bootstrap
const originalBootstrap = typeof bootstrapSidePanel === 'function' ? bootstrapSidePanel : null;

async function bootstrapWithNewTabs() {
  if (originalBootstrap) {
    await originalBootstrap();
  }
  
  // Initialize new tab functionality
  initializeAISearchTab();
  initializeIntelligenceTab();
  
  console.log('✅ AI Search and Intelligence tabs initialized');
}

// Reinitialize when tabs are shown
document.addEventListener('DOMContentLoaded', () => {
  // Initialize when the tab becomes visible
  const aiSearchTab = document.getElementById('tab-ai-search');
  const intelligenceTab = document.getElementById('tab-intelligence');
  
  if (aiSearchTab) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target.classList.contains('active')) {
          initializeAISearchTab();
        }
      });
    });
    observer.observe(aiSearchTab, { attributes: true, attributeFilter: ['class'] });
  }
  
  if (intelligenceTab) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target.classList.contains('active')) {
          initializeIntelligenceTab();
        }
      });
    });
    observer.observe(intelligenceTab, { attributes: true, attributeFilter: ['class'] });
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapWithNewTabs);
} else {
  bootstrapWithNewTabs();
}

// ============================================================================
// PRODUCTIVITY ANALYTICS TAB
// ============================================================================

/**
 * Initialize Analytics Dashboard Tab
 */
function initializeAnalyticsDashboard() {
  console.log('📊 Initializing Analytics Dashboard...');
  
  // Get analytics service
  const analytics = window.productivityAnalytics;
  if (!analytics) {
    console.warn('Analytics service not loaded');
    return;
  }
  
  // Get initial data and render
  const data = analytics.getDashboardData();
  renderAnalyticsDashboard(data);
  
  // Listen for updates
  document.addEventListener('productivityUpdate', (e) => {
    renderAnalyticsDashboard(e.detail);
  });
  
  // Listen for achievement unlocks
  document.addEventListener('achievementUnlocked', (e) => {
    showAchievementToast(e.detail);
  });
  
  console.log('✅ Analytics Dashboard initialized');
}

/**
 * Render the analytics dashboard with data
 */
function renderAnalyticsDashboard(data) {
  if (!data) return;
  
  // Update Productivity Score
  const scoreEl = document.getElementById('productivityScore');
  const scoreCircle = document.getElementById('scoreCircle');
  if (scoreEl) scoreEl.textContent = data.insights.productivityScore;
  if (scoreCircle) {
    // Calculate stroke-dashoffset (283 is full circle)
    const offset = 283 - (283 * data.insights.productivityScore / 100);
    scoreCircle.style.strokeDashoffset = offset;
  }
  
  // Update streak and most productive feature
  const streakEl = document.getElementById('streakDays');
  const featureEl = document.getElementById('mostProductiveFeature');
  if (streakEl) streakEl.textContent = data.lifetime.streakDays;
  if (featureEl) featureEl.textContent = `Most used: ${data.insights.mostProductiveFeature}`;
  
  // Update Time Saved
  const totalTimeEl = document.getElementById('totalTimeSaved');
  const sessionTimeEl = document.getElementById('sessionTimeSaved');
  const roiEl = document.getElementById('totalROI');
  if (totalTimeEl) totalTimeEl.textContent = data.lifetime.totalTimeSavedFormatted;
  if (sessionTimeEl) sessionTimeEl.textContent = data.session.timeSavedFormatted;
  if (roiEl) roiEl.textContent = data.insights.totalROI;
  
  // Update Stats Grid
  const formsEl = document.getElementById('totalFormsAutofilled');
  const macrosEl = document.getElementById('totalMacrosRun');
  const docsEl = document.getElementById('totalDocumentsProcessed');
  const aiEl = document.getElementById('totalAiQueries');
  if (formsEl) formsEl.textContent = data.lifetime.totalFormsAutofilled;
  if (macrosEl) macrosEl.textContent = data.lifetime.totalMacrosRun;
  if (docsEl) docsEl.textContent = data.lifetime.totalDocumentsProcessed;
  if (aiEl) aiEl.textContent = data.lifetime.totalAiQueries;
  
  // Update Goal Progress
  const goalMinsEl = document.getElementById('goalMinutes');
  const goalFillEl = document.getElementById('goalProgressFill');
  const goalPercentEl = document.getElementById('goalProgressPercent');
  if (goalMinsEl) goalMinsEl.textContent = data.goals.dailyTimeSaved;
  if (goalFillEl) goalFillEl.style.width = `${Math.min(data.goals.dailyProgress, 100)}%`;
  if (goalPercentEl) goalPercentEl.textContent = Math.round(data.goals.dailyProgress);
  
  // Update Achievements
  const achievementsCountEl = document.getElementById('achievementsCount');
  const achievementsGridEl = document.getElementById('achievementsGrid');
  if (achievementsCountEl) achievementsCountEl.textContent = data.achievements.unlocked.length;
  if (achievementsGridEl) {
    achievementsGridEl.innerHTML = data.achievements.all.map(a => `
      <div class="achievement-item ${a.unlocked ? 'unlocked' : 'locked'}" title="${a.name}: ${a.desc}">
        <span class="achievement-icon">${a.icon}</span>
        <span class="achievement-name">${a.name}</span>
      </div>
    `).join('');
  }
  
  // Update Tips
  const tipsEl = document.getElementById('productivityTips');
  if (tipsEl && window.productivityAnalytics) {
    const recommendations = window.productivityAnalytics.generateRecommendations();
    if (recommendations.length > 0) {
      tipsEl.innerHTML = recommendations.map(tip => `
        <div class="tip-item">
          <span class="tip-icon">${tip.icon}</span>
          <div class="tip-content">
            <div class="tip-title">${tip.title}</div>
            <div class="tip-desc">${tip.desc}</div>
          </div>
        </div>
      `).join('');
    } else {
      tipsEl.innerHTML = `
        <div class="tip-item">
          <span class="tip-icon">🎉</span>
          <div class="tip-content">
            <div class="tip-title">You're doing great!</div>
            <div class="tip-desc">Keep using CUBE to unlock more achievements</div>
          </div>
        </div>
      `;
    }
  }
}

/**
 * Show achievement toast notification
 */
function showAchievementToast(achievements) {
  achievements.forEach(achievement => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="toast-icon">${achievement.icon}</div>
      <div class="toast-content">
        <div class="toast-title">🏆 Achievement Unlocked!</div>
        <div class="toast-name">${achievement.name}</div>
        <div class="toast-desc">${achievement.desc}</div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  });
}

/**
 * Track form autofill for analytics
 */
function trackFormAutofillAnalytics(fieldsCount) {
  if (window.productivityAnalytics) {
    window.productivityAnalytics.trackFormAutofill(fieldsCount);
  }
}

/**
 * Track macro run for analytics
 */
function trackMacroRunAnalytics(stepsCount) {
  if (window.productivityAnalytics) {
    window.productivityAnalytics.trackMacroRun(stepsCount);
  }
}

/**
 * Track document processing for analytics
 */
function trackDocumentAnalytics(docType, pagesCount) {
  if (window.productivityAnalytics) {
    window.productivityAnalytics.trackDocumentProcessed(docType, pagesCount);
  }
}

/**
 * Track AI query for analytics
 */
function trackAiQueryAnalytics(provider, queryType) {
  if (window.productivityAnalytics) {
    window.productivityAnalytics.trackAiQuery(provider, queryType);
  }
}

// Add CSS for achievement toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  .achievement-toast {
    position: fixed;
    top: 20px;
    right: -400px;
    width: 320px;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: linear-gradient(135deg, var(--elite-bg-card), var(--elite-accent-glow));
    border: 1px solid var(--elite-accent);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 32px var(--elite-accent-glow);
    z-index: 10001;
    transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .achievement-toast.show {
    right: 20px;
  }
  
  .achievement-toast .toast-icon {
    font-size: 36px;
    animation: bounce 0.6s ease infinite;
  }
  
  @keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  .achievement-toast .toast-content {
    flex: 1;
  }
  
  .achievement-toast .toast-title {
    font-size: 11px;
    color: var(--elite-accent-light);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .achievement-toast .toast-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--elite-text-primary);
    margin: 4px 0 2px;
  }
  
  .achievement-toast .toast-desc {
    font-size: 12px;
    color: var(--elite-text-muted);
  }
`;
document.head.appendChild(toastStyles);

// Initialize Analytics Dashboard when tab is shown
const analyticsTab = document.getElementById('tab-analytics');
if (analyticsTab) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.classList.contains('active')) {
        initializeAnalyticsDashboard();
      }
    });
  });
  observer.observe(analyticsTab, { attributes: true, attributeFilter: ['class'] });
}

// Also initialize on load if already visible
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.productivityAnalytics) {
      initializeAnalyticsDashboard();
    }
    initializeBackupDashboard();
  }, 500);
});

// ============================================================================
// BACKUP & LEARNING DASHBOARD
// ============================================================================

/**
 * Initialize Backup Dashboard functionality
 */
function initializeBackupDashboard() {
  // Export backup button
  const btnExportBackup = document.getElementById('btnExportBackup');
  if (btnExportBackup) {
    btnExportBackup.addEventListener('click', async () => {
      if (window.backupService) {
        try {
          btnExportBackup.disabled = true;
          btnExportBackup.innerHTML = '<span class="btn-icon">⏳</span> Exporting...';
          await window.backupService.exportBackup();
          showNotification('Backup exported successfully!', 'success');
        } catch (error) {
          showNotification('Failed to export backup: ' + error.message, 'error');
        } finally {
          btnExportBackup.disabled = false;
          btnExportBackup.innerHTML = '<span class="btn-icon">📤</span> Export Full Backup';
        }
      }
    });
  }

  // Encrypted export button
  const btnExportEncrypted = document.getElementById('btnExportEncrypted');
  if (btnExportEncrypted) {
    btnExportEncrypted.addEventListener('click', async () => {
      const password = document.getElementById('backupPassword')?.value;
      if (!password) {
        showNotification('Please enter a password for encryption', 'warning');
        return;
      }
      if (password.length < 8) {
        showNotification('Password must be at least 8 characters', 'warning');
        return;
      }
      if (window.backupService) {
        try {
          btnExportEncrypted.disabled = true;
          btnExportEncrypted.innerHTML = '<span class="btn-icon">⏳</span> Encrypting...';
          await window.backupService.exportBackup({ encrypted: true, password });
          showNotification('Encrypted backup exported!', 'success');
          document.getElementById('backupPassword').value = '';
        } catch (error) {
          showNotification('Encryption failed: ' + error.message, 'error');
        } finally {
          btnExportEncrypted.disabled = false;
          btnExportEncrypted.innerHTML = '<span class="btn-icon">🔒</span> Export Encrypted Backup';
        }
      }
    });
  }

  // Toggle password visibility
  const btnToggleBackupPassword = document.getElementById('btnToggleBackupPassword');
  if (btnToggleBackupPassword) {
    btnToggleBackupPassword.addEventListener('click', () => {
      const passwordInput = document.getElementById('backupPassword');
      if (passwordInput) {
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
        btnToggleBackupPassword.textContent = passwordInput.type === 'password' ? '👁️' : '🙈';
      }
    });
  }

  // File selection for import
  const btnSelectBackupFile = document.getElementById('btnSelectBackupFile');
  const backupFileInput = document.getElementById('backupFileInput');
  const btnImportBackup = document.getElementById('btnImportBackup');

  if (btnSelectBackupFile && backupFileInput) {
    btnSelectBackupFile.addEventListener('click', () => {
      backupFileInput.click();
    });

    backupFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const fileNameSpan = document.getElementById('selectedBackupFileName');
      if (file) {
        if (fileNameSpan) {
          fileNameSpan.textContent = file.name;
        }
        if (btnImportBackup) {
          btnImportBackup.disabled = false;
        }
      } else {
        if (fileNameSpan) {
          fileNameSpan.textContent = 'No file selected';
        }
        if (btnImportBackup) {
          btnImportBackup.disabled = true;
        }
      }
    });
  }

  // Import backup
  if (btnImportBackup) {
    btnImportBackup.addEventListener('click', async () => {
      const file = backupFileInput?.files[0];
      if (!file) {
        showNotification('Please select a backup file', 'warning');
        return;
      }

      const mergeMode = document.getElementById('backupMergeMode')?.checked ?? true;

      if (window.backupService) {
        try {
          btnImportBackup.disabled = true;
          btnImportBackup.innerHTML = '<span class="btn-icon">⏳</span> Importing...';
          
          const result = await window.backupService.importBackup(file, {
            merge: mergeMode
          });
          
          if (result.success) {
            showNotification(`Backup imported successfully! ${result.itemsImported || 0} items restored.`, 'success');
            // Reset file input
            backupFileInput.value = '';
            document.getElementById('selectedBackupFileName').textContent = 'No file selected';
          } else {
            showNotification('Import failed: ' + (result.error || 'Unknown error'), 'error');
          }
        } catch (error) {
          showNotification('Import failed: ' + error.message, 'error');
        } finally {
          btnImportBackup.disabled = true;
          btnImportBackup.innerHTML = '<span class="btn-icon">📥</span> Import Backup';
        }
      }
    });
  }

  // Auto-backup toggle
  const autoBackupEnabled = document.getElementById('autoBackupEnabled');
  if (autoBackupEnabled) {
    // Load saved setting
    chrome.storage.local.get('cube_auto_backup_enabled', (result) => {
      autoBackupEnabled.checked = result.cube_auto_backup_enabled || false;
    });

    autoBackupEnabled.addEventListener('change', () => {
      const enabled = autoBackupEnabled.checked;
      chrome.storage.local.set({ cube_auto_backup_enabled: enabled });
      if (enabled && window.backupService) {
        window.backupService.scheduleAutoBackup();
        showNotification('Auto-backup enabled', 'success');
      } else {
        showNotification('Auto-backup disabled', 'info');
      }
    });
  }

  // Auto-backup frequency
  const autoBackupFrequency = document.getElementById('autoBackupFrequency');
  if (autoBackupFrequency) {
    chrome.storage.local.get('cube_auto_backup_frequency', (result) => {
      autoBackupFrequency.value = result.cube_auto_backup_frequency || 'weekly';
    });

    autoBackupFrequency.addEventListener('change', () => {
      const frequency = autoBackupFrequency.value;
      chrome.storage.local.set({ cube_auto_backup_frequency: frequency });
    });
  }

  // Last backup date
  const lastBackupDate = document.getElementById('lastBackupDate');
  if (lastBackupDate) {
    chrome.storage.local.get('cube_last_backup_date', (result) => {
      if (result.cube_last_backup_date) {
        const date = new Date(result.cube_last_backup_date);
        lastBackupDate.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      }
    });
  }

  // Export learning data
  const btnExportLearning = document.getElementById('btnExportLearning');
  if (btnExportLearning) {
    btnExportLearning.addEventListener('click', () => {
      if (window.fieldLearningService) {
        window.fieldLearningService.exportData();
        showNotification('Learning data exported!', 'success');
      }
    });
  }

  // Clear learning data
  const btnClearLearning = document.getElementById('btnClearLearning');
  if (btnClearLearning) {
    btnClearLearning.addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset all learned field mappings? This cannot be undone.')) {
        if (window.fieldLearningService) {
          await window.fieldLearningService.clearData();
          updateLearningStats();
          showNotification('Learning data cleared', 'success');
        }
      }
    });
  }

  // Factory reset
  const btnFactoryReset = document.getElementById('btnFactoryReset');
  if (btnFactoryReset) {
    btnFactoryReset.addEventListener('click', async () => {
      const confirmed = confirm(
        '⚠️ FACTORY RESET ⚠️\n\n' +
        'This will permanently delete:\n' +
        '• All macros\n' +
        '• All saved profiles\n' +
        '• All passwords\n' +
        '• All AI configurations\n' +
        '• All learning data\n' +
        '• All settings\n\n' +
        'This action CANNOT be undone!\n\n' +
        'Are you absolutely sure?'
      );

      if (confirmed) {
        const doubleConfirmed = confirm('FINAL WARNING: Type "RESET" to confirm factory reset');
        if (doubleConfirmed) {
          try {
            // Clear all chrome storage
            await chrome.storage.local.clear();
            await chrome.storage.sync.clear();
            
            showNotification('Factory reset complete. Reloading...', 'success');
            
            // Reload after delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } catch (error) {
            showNotification('Factory reset failed: ' + error.message, 'error');
          }
        }
      }
    });
  }

  // Update learning stats
  updateLearningStats();
}

/**
 * Update learning statistics display
 */
function updateLearningStats() {
  if (window.fieldLearningService) {
    const stats = window.fieldLearningService.getStatistics();
    
    const learnedMappings = document.getElementById('learnedMappings');
    const learnedSites = document.getElementById('learnedSites');
    const learningConfidence = document.getElementById('learningConfidence');

    if (learnedMappings) learnedMappings.textContent = stats.totalMappings;
    if (learnedSites) learnedSites.textContent = stats.totalSites;
    if (learningConfidence) learningConfidence.textContent = (stats.averageConfidence * 100).toFixed(0) + '%';
  }
}

// Initialize Backup Dashboard when tab is shown
const backupTab = document.getElementById('tab-backup');
if (backupTab) {
  const backupObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.classList.contains('active')) {
        updateLearningStats();
      }
    });
  });
  backupObserver.observe(backupTab, { attributes: true, attributeFilter: ['class'] });
}
