/**
 * CUBE Nexum Settings v7.0.2
 * Separated JavaScript for Manifest V3 CSP compliance
 */

// ============================================================================
// STATE
// ============================================================================

const state = {
  openaiKey: '',
  geminiKey: '',
  claudeKey: '',
  aiProvider: 'auto',
  openaiModel: 'gpt-5.2',
  geminiModel: 'gemini-3-pro',
  claudeModel: 'claude-opus-4-5',
  autoDetect: true,
  showFloating: true,
  enableNotifications: true,
  macroAutoLearn: true,
  theme: 'elite-purple',
  pageTheme: 'light'
};

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
  // API Keys
  openaiKey: document.getElementById('openaiKey'),
  geminiKey: document.getElementById('geminiKey'),
  claudeKey: document.getElementById('claudeKey'),
  toggleOpenai: document.getElementById('toggleOpenai'),
  toggleGemini: document.getElementById('toggleGemini'),
  toggleClaude: document.getElementById('toggleClaude'),
  openaiStatus: document.getElementById('openaiStatus'),
  geminiStatus: document.getElementById('geminiStatus'),
  claudeStatus: document.getElementById('claudeStatus'),
  
  // Selects
  aiProvider: document.getElementById('aiProvider'),
  openaiModel: document.getElementById('openaiModel'),
  geminiModel: document.getElementById('geminiModel'),
  claudeModel: document.getElementById('claudeModel'),
  
  // Checkboxes
  autoDetect: document.getElementById('autoDetect'),
  showFloating: document.getElementById('showFloating'),
  enableNotifications: document.getElementById('enableNotifications'),
  macroAutoLearn: document.getElementById('macroAutoLearn'),
  
  // Buttons
  testConnection: document.getElementById('testConnection'),
  exportData: document.getElementById('exportData'),
  importData: document.getElementById('importData'),
  clearMacros: document.getElementById('clearMacros'),
  clearChat: document.getElementById('clearChat'),
  resetAll: document.getElementById('resetAll'),
  themeToggle: document.getElementById('themeToggle'),
  
  // Other
  toast: document.getElementById('toast'),
  importFile: document.getElementById('importFile'),
  themeIcon: document.getElementById('themeIcon'),
  themeText: document.getElementById('themeText')
};

// ============================================================================
// HELPERS
// ============================================================================

function showToast(message, type = 'success') {
  console.log(`[Toast] ${type}: ${message}`);
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type} show`;
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

function updateStatus(element, type, text) {
  element.className = `status ${type}`;
  element.querySelector('span:last-child').textContent = text;
}

async function saveToStorage(key, value) {
  try {
    await chrome.storage.local.set({ [key]: value });
    console.log(`[Storage] Saved ${key}`);
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to save ${key}:`, error);
    return false;
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function init() {
  console.log('[Settings] Initializing...');
  
  try {
    // Load all settings from storage
    const result = await chrome.storage.local.get([
      'openai_apiKey', 'gemini_apiKey', 'claude_apiKey',
      'ai_provider', 'openai_model', 'gemini_model', 'claude_model',
      'theme', 'settings_theme', 'settings'
    ]);
    
    console.log('[Settings] Loaded from storage:', Object.keys(result));
    
    // API Keys
    if (result.openai_apiKey) {
      state.openaiKey = result.openai_apiKey;
      elements.openaiKey.value = '•'.repeat(Math.min(result.openai_apiKey.length, 40));
      updateStatus(elements.openaiStatus, 'success', 'API key configured');
    }
    
    if (result.gemini_apiKey) {
      state.geminiKey = result.gemini_apiKey;
      elements.geminiKey.value = '•'.repeat(Math.min(result.gemini_apiKey.length, 40));
      updateStatus(elements.geminiStatus, 'success', 'API key configured');
    }
    
    if (result.claude_apiKey) {
      state.claudeKey = result.claude_apiKey;
      elements.claudeKey.value = '•'.repeat(Math.min(result.claude_apiKey.length, 40));
      updateStatus(elements.claudeStatus, 'success', 'API key configured');
    }
    
    // Selects
    if (result.ai_provider) {
      state.aiProvider = result.ai_provider;
      elements.aiProvider.value = result.ai_provider;
    }
    
    if (result.openai_model) {
      state.openaiModel = result.openai_model;
      elements.openaiModel.value = result.openai_model;
    }
    
    if (result.gemini_model) {
      state.geminiModel = result.gemini_model;
      elements.geminiModel.value = result.gemini_model;
    }
    
    if (result.claude_model) {
      state.claudeModel = result.claude_model;
      elements.claudeModel.value = result.claude_model;
    }
    
    // Theme
    if (result.theme) {
      state.theme = result.theme;
      document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.toggle('active', card.dataset.theme === result.theme);
      });
    }
    
    // Page theme (light/dark)
    if (result.settings_theme) {
      state.pageTheme = result.settings_theme;
      applyPageTheme(result.settings_theme);
    }
    
    // Extension settings
    if (result.settings) {
      if (typeof result.settings.autoDetectForms !== 'undefined') {
        state.autoDetect = result.settings.autoDetectForms;
        elements.autoDetect.checked = result.settings.autoDetectForms;
      }
      if (typeof result.settings.showFloatingButton !== 'undefined') {
        state.showFloating = result.settings.showFloatingButton;
        elements.showFloating.checked = result.settings.showFloatingButton;
      }
      if (typeof result.settings.enableNotifications !== 'undefined') {
        state.enableNotifications = result.settings.enableNotifications;
        elements.enableNotifications.checked = result.settings.enableNotifications;
      }
      if (typeof result.settings.macroAutoLearn !== 'undefined') {
        state.macroAutoLearn = result.settings.macroAutoLearn;
        elements.macroAutoLearn.checked = result.settings.macroAutoLearn;
      }
    }
    
    console.log('[Settings] Initialization complete');
    
  } catch (error) {
    console.error('[Settings] Init failed:', error);
    showToast('Failed to load settings', 'error');
  }
}

function applyPageTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    elements.themeIcon.textContent = '☀️';
    elements.themeText.textContent = 'Light';
  } else {
    elements.themeIcon.textContent = '🌙';
    elements.themeText.textContent = 'Dark';
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

// Page theme toggle
elements.themeToggle.addEventListener('click', async () => {
  const newTheme = state.pageTheme === 'dark' ? 'light' : 'dark';
  state.pageTheme = newTheme;
  applyPageTheme(newTheme);
  await saveToStorage('settings_theme', newTheme);
  showToast(`Theme changed to ${newTheme}`);
});

// API Key visibility toggles
let openaiVisible = false;
let geminiVisible = false;
let claudeVisible = false;

elements.toggleOpenai.addEventListener('click', () => {
  openaiVisible = !openaiVisible;
  elements.openaiKey.type = openaiVisible ? 'text' : 'password';
  if (openaiVisible && state.openaiKey) {
    elements.openaiKey.value = state.openaiKey;
  } else if (!openaiVisible && state.openaiKey) {
    elements.openaiKey.value = '•'.repeat(Math.min(state.openaiKey.length, 40));
  }
});

elements.toggleGemini.addEventListener('click', () => {
  geminiVisible = !geminiVisible;
  elements.geminiKey.type = geminiVisible ? 'text' : 'password';
  if (geminiVisible && state.geminiKey) {
    elements.geminiKey.value = state.geminiKey;
  } else if (!geminiVisible && state.geminiKey) {
    elements.geminiKey.value = '•'.repeat(Math.min(state.geminiKey.length, 40));
  }
});

elements.toggleClaude.addEventListener('click', () => {
  claudeVisible = !claudeVisible;
  elements.claudeKey.type = claudeVisible ? 'text' : 'password';
  if (claudeVisible && state.claudeKey) {
    elements.claudeKey.value = state.claudeKey;
  } else if (!claudeVisible && state.claudeKey) {
    elements.claudeKey.value = '•'.repeat(Math.min(state.claudeKey.length, 40));
  }
});

// API Key input handlers
elements.openaiKey.addEventListener('change', async (e) => {
  const value = e.target.value.trim();
  if (value && !value.startsWith('•')) {
    state.openaiKey = value;
    if (await saveToStorage('openai_apiKey', value)) {
      updateStatus(elements.openaiStatus, 'success', 'API key saved');
      showToast('OpenAI API key saved!');
    }
  }
});

elements.geminiKey.addEventListener('change', async (e) => {
  const value = e.target.value.trim();
  if (value && !value.startsWith('•')) {
    state.geminiKey = value;
    if (await saveToStorage('gemini_apiKey', value)) {
      updateStatus(elements.geminiStatus, 'success', 'API key saved');
      showToast('Gemini API key saved!');
    }
  }
});

elements.claudeKey.addEventListener('change', async (e) => {
  const value = e.target.value.trim();
  if (value && !value.startsWith('•')) {
    state.claudeKey = value;
    if (await saveToStorage('claude_apiKey', value)) {
      updateStatus(elements.claudeStatus, 'success', 'API key saved');
      showToast('Claude API key saved!');
    }
  }
});

// Select handlers
elements.aiProvider.addEventListener('change', async (e) => {
  state.aiProvider = e.target.value;
  await saveToStorage('ai_provider', e.target.value);
  showToast('AI provider updated');
});

elements.openaiModel.addEventListener('change', async (e) => {
  state.openaiModel = e.target.value;
  await saveToStorage('openai_model', e.target.value);
  showToast('OpenAI model updated');
});

elements.geminiModel.addEventListener('change', async (e) => {
  state.geminiModel = e.target.value;
  await saveToStorage('gemini_model', e.target.value);
  showToast('Gemini model updated');
});

elements.claudeModel.addEventListener('change', async (e) => {
  state.claudeModel = e.target.value;
  await saveToStorage('claude_model', e.target.value);
  showToast('Claude model updated');
});

// Checkbox handlers
async function saveExtensionSettings() {
  const settings = {
    autoDetectForms: state.autoDetect,
    showFloatingButton: state.showFloating,
    enableNotifications: state.enableNotifications,
    macroAutoLearn: state.macroAutoLearn
  };
  await saveToStorage('settings', settings);
  showToast('Settings saved');
}

elements.autoDetect.addEventListener('change', async (e) => {
  state.autoDetect = e.target.checked;
  await saveExtensionSettings();
});

elements.showFloating.addEventListener('change', async (e) => {
  state.showFloating = e.target.checked;
  await saveExtensionSettings();
});

elements.enableNotifications.addEventListener('change', async (e) => {
  state.enableNotifications = e.target.checked;
  await saveExtensionSettings();
});

elements.macroAutoLearn.addEventListener('change', async (e) => {
  state.macroAutoLearn = e.target.checked;
  await saveExtensionSettings();
});

// Theme cards
document.querySelectorAll('.theme-card').forEach(card => {
  card.addEventListener('click', async () => {
    const theme = card.dataset.theme;
    console.log('[Theme] Card clicked:', theme);
    
    // Update visual state
    document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    
    // Save to all theme keys for compatibility
    // The sidepanel supports: dark, light, elite-purple, midnight
    state.theme = theme;
    await chrome.storage.local.set({ 
      theme: theme,
      cubeTheme: theme,
      cubeEliteTheme: theme
    });
    
    // Also save to localStorage for immediate effect in sidepanel
    localStorage.setItem('cubeTheme', theme);
    
    showToast(`Theme changed to ${card.querySelector('h4').textContent}`);
  });
});

// Test connection
elements.testConnection.addEventListener('click', async () => {
  elements.testConnection.disabled = true;
  elements.testConnection.textContent = '🔄 Testing...';
  
  try {
    let tested = false;
    
    // Test OpenAI
    if (state.openaiKey) {
      tested = true;
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${state.openaiKey}` }
        });
        updateStatus(elements.openaiStatus, response.ok ? 'success' : 'error', 
          response.ok ? 'Connected ✓' : 'Invalid API key');
      } catch {
        updateStatus(elements.openaiStatus, 'error', 'Connection failed');
      }
    }
    
    // Test Gemini
    if (state.geminiKey) {
      tested = true;
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${state.geminiKey}`
        );
        updateStatus(elements.geminiStatus, response.ok ? 'success' : 'error',
          response.ok ? 'Connected ✓' : 'Invalid API key');
      } catch {
        updateStatus(elements.geminiStatus, 'error', 'Connection failed');
      }
    }
    
    // Test Claude (limited due to CORS)
    if (state.claudeKey) {
      tested = true;
      if (state.claudeKey.startsWith('sk-ant-')) {
        updateStatus(elements.claudeStatus, 'success', 'Key format valid ✓');
      } else {
        updateStatus(elements.claudeStatus, 'error', 'Invalid key format');
      }
    }
    
    showToast(tested ? 'Connection test complete!' : 'No API keys to test');
    
  } catch (error) {
    console.error('[Test] Failed:', error);
    showToast('Connection test failed', 'error');
  } finally {
    elements.testConnection.disabled = false;
    elements.testConnection.textContent = '🧪 Test AI Connection';
  }
});

// Export data
elements.exportData.addEventListener('click', async () => {
  console.log('[Export] Starting export...');
  try {
    const data = await chrome.storage.local.get(null);
    
    // Remove sensitive keys
    const exportData = { ...data };
    delete exportData.openai_apiKey;
    delete exportData.gemini_apiKey;
    delete exportData.claude_apiKey;
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cube-nexum-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Data exported successfully!');
  } catch (error) {
    console.error('[Export] Failed:', error);
    showToast('Export failed: ' + error.message, 'error');
  }
});

// Import data
elements.importData.addEventListener('click', () => {
  console.log('[Import] Opening file picker...');
  elements.importFile.click();
});

elements.importFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  console.log('[Import] File selected:', file.name);
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    await chrome.storage.local.set(data);
    showToast('Data imported! Reloading...');
    setTimeout(() => location.reload(), 1000);
  } catch (error) {
    console.error('[Import] Failed:', error);
    showToast('Import failed - invalid file', 'error');
  }
  
  elements.importFile.value = '';
});

// Clear macros
elements.clearMacros.addEventListener('click', async () => {
  if (confirm('Delete all saved macros?')) {
    await chrome.storage.local.remove(['macros', 'savedMacros']);
    showToast('Macros cleared');
  }
});

// Clear chat
elements.clearChat.addEventListener('click', async () => {
  if (confirm('Delete all chat history?')) {
    await chrome.storage.local.remove(['aiConversations', 'chatConversations', 'chatMessages', 'cubeAIHistory']);
    showToast('Chat history cleared');
  }
});

// Reset all
elements.resetAll.addEventListener('click', async () => {
  if (confirm('⚠️ Reset ALL settings and data?')) {
    if (confirm('This cannot be undone. Continue?')) {
      await chrome.storage.local.clear();
      showToast('All settings reset! Reloading...');
      setTimeout(() => location.reload(), 1000);
    }
  }
});

// ============================================================================
// LICENSE MANAGEMENT
// ============================================================================

// License elements
const licenseElements = {
  currentPlan: document.getElementById('currentPlan'),
  deviceId: document.getElementById('deviceId'),
  trialInfo: document.getElementById('trialInfo'),
  trialText: document.getElementById('trialText'),
  licenseKey: document.getElementById('licenseKey'),
  licenseStatus: document.getElementById('licenseStatus'),
  activateLicense: document.getElementById('activateLicense'),
  startTrial: document.getElementById('startTrial'),
  viewPricing: document.getElementById('viewPricing'),
  manageBilling: document.getElementById('manageBilling'),
  deactivateLicense: document.getElementById('deactivateLicense')
};

// Load license info
async function loadLicenseInfo() {
  console.log('[License] Loading license info...');
  
  try {
    // Check if native messaging is available
    if (typeof CUBENativeMessaging !== 'undefined' && CUBENativeMessaging.isConnected()) {
      // Use Tauri backend
      const licenseInfo = await CUBENativeMessaging.License.getStatus();
      updateLicenseUI(licenseInfo);
    } else {
      // Fallback to local storage
      const stored = await chrome.storage.local.get(['license_tier', 'license_status', 'device_id', 'trial_info']);
      updateLicenseUI({
        tier: stored.license_tier || 'free',
        status: stored.license_status || 'not_activated',
        device_id: stored.device_id || 'Not connected to CUBE app',
        trial: stored.trial_info || null
      });
    }
  } catch (error) {
    console.error('[License] Failed to load:', error);
    updateLicenseUI({
      tier: 'free',
      status: 'error',
      device_id: 'Error loading license info'
    });
  }
}

// Update license UI
function updateLicenseUI(info) {
  console.log('[License] Updating UI:', info);
  
  // Current plan badge
  const tierBadges = {
    free: { text: '🆓 Free Plan', class: 'neutral' },
    pro: { text: '⚡ Pro Plan', class: 'success' },
    elite: { text: '👑 Elite Plan', class: 'success' }
  };
  
  const badge = tierBadges[info.tier] || tierBadges.free;
  if (licenseElements.currentPlan) {
    licenseElements.currentPlan.className = `status ${badge.class}`;
    licenseElements.currentPlan.innerHTML = `<span class="status-dot"></span><span>${badge.text}</span>`;
  }
  
  // Device ID
  if (licenseElements.deviceId) {
    licenseElements.deviceId.value = info.device_id || 'Unknown';
  }
  
  // Trial info
  if (licenseElements.trialInfo && info.trial && info.trial.is_active) {
    licenseElements.trialInfo.style.display = 'block';
    if (licenseElements.trialText) {
      licenseElements.trialText.textContent = `🎁 Trial active - ${info.trial.days_remaining} days remaining`;
    }
    // Hide start trial button if already in trial
    if (licenseElements.startTrial) {
      licenseElements.startTrial.style.display = 'none';
    }
  } else if (licenseElements.trialInfo) {
    licenseElements.trialInfo.style.display = 'none';
    if (licenseElements.startTrial) {
      licenseElements.startTrial.style.display = info.tier === 'free' ? 'block' : 'none';
    }
  }
  
  // Show/hide billing button based on paid status
  if (licenseElements.manageBilling) {
    licenseElements.manageBilling.style.display = (info.tier !== 'free') ? 'inline-flex' : 'none';
  }
  
  // Show/hide deactivate button
  if (licenseElements.deactivateLicense) {
    licenseElements.deactivateLicense.style.display = (info.has_license && info.tier !== 'free') ? 'block' : 'none';
  }
}

// Activate license
if (licenseElements.activateLicense) {
  licenseElements.activateLicense.addEventListener('click', async () => {
    const key = licenseElements.licenseKey?.value?.trim();
    if (!key) {
      showToast('Please enter a license key', 'error');
      return;
    }
    
    console.log('[License] Activating license...');
    
    try {
      if (typeof CUBENativeMessaging !== 'undefined' && CUBENativeMessaging.isConnected()) {
        const email = await promptForEmail();
        if (!email) return;
        
        const result = await CUBENativeMessaging.License.activate(key, email);
        
        if (licenseElements.licenseStatus) {
          licenseElements.licenseStatus.style.display = 'block';
          licenseElements.licenseStatus.className = 'status success';
          licenseElements.licenseStatus.innerHTML = '<span class="status-dot"></span><span>License activated!</span>';
        }
        
        showToast('License activated successfully! 🎉');
        loadLicenseInfo();
      } else {
        showToast('Please open the CUBE Nexum app to activate your license', 'error');
      }
    } catch (error) {
      console.error('[License] Activation failed:', error);
      
      if (licenseElements.licenseStatus) {
        licenseElements.licenseStatus.style.display = 'block';
        licenseElements.licenseStatus.className = 'status error';
        licenseElements.licenseStatus.innerHTML = `<span class="status-dot"></span><span>${error.message}</span>`;
      }
      
      showToast('License activation failed: ' + error.message, 'error');
    }
  });
}

// Start trial
if (licenseElements.startTrial) {
  licenseElements.startTrial.addEventListener('click', async () => {
    console.log('[License] Starting trial...');
    
    try {
      if (typeof CUBENativeMessaging !== 'undefined' && CUBENativeMessaging.isConnected()) {
        const result = await CUBENativeMessaging.License.startTrial();
        showToast(result.message || '30-day Elite trial started! 🎉');
        loadLicenseInfo();
      } else {
        // Offer to open Tauri app or show pricing
        if (confirm('Start your 30-day free trial?\n\nFor full functionality, please open the CUBE Nexum desktop app.')) {
          await chrome.storage.local.set({
            license_tier: 'elite',
            license_status: 'trial',
            trial_info: {
              is_active: true,
              days_remaining: 30,
              started_at: Date.now()
            }
          });
          showToast('Trial started! Download the desktop app for full features.', 'success');
          loadLicenseInfo();
        }
      }
    } catch (error) {
      console.error('[License] Trial start failed:', error);
      showToast('Failed to start trial: ' + error.message, 'error');
    }
  });
}

// View pricing
if (licenseElements.viewPricing) {
  licenseElements.viewPricing.addEventListener('click', () => {
    // Try to open in Tauri app, fallback to web
    window.open('https://cube-nexum.com/pricing', '_blank');
  });
}

// Manage billing
if (licenseElements.manageBilling) {
  licenseElements.manageBilling.addEventListener('click', async () => {
    try {
      if (typeof CUBENativeMessaging !== 'undefined' && CUBENativeMessaging.isConnected()) {
        const stored = await chrome.storage.local.get(['stripe_customer_id']);
        if (stored.stripe_customer_id) {
          const url = await CUBENativeMessaging.Stripe.getPortalUrl(stored.stripe_customer_id);
          window.open(url, '_blank');
        } else {
          showToast('No billing information found', 'error');
        }
      } else {
        window.open('https://cube-nexum.com/account', '_blank');
      }
    } catch (error) {
      console.error('[License] Billing portal error:', error);
      showToast('Failed to open billing portal', 'error');
    }
  });
}

// Deactivate license
if (licenseElements.deactivateLicense) {
  licenseElements.deactivateLicense.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to deactivate your license?\n\nYou can reactivate it on another device.')) {
      return;
    }
    
    try {
      if (typeof CUBENativeMessaging !== 'undefined' && CUBENativeMessaging.isConnected()) {
        await CUBENativeMessaging.License.deactivate();
      }
      
      await chrome.storage.local.remove(['license_tier', 'license_status', 'trial_info', 'stripe_customer_id']);
      showToast('License deactivated');
      loadLicenseInfo();
    } catch (error) {
      console.error('[License] Deactivation failed:', error);
      showToast('Failed to deactivate: ' + error.message, 'error');
    }
  });
}

// Helper to prompt for email
function promptForEmail() {
  return new Promise((resolve) => {
    const email = prompt('Enter your email address for license activation:');
    if (email && email.includes('@')) {
      resolve(email);
    } else if (email) {
      showToast('Please enter a valid email address', 'error');
      resolve(null);
    } else {
      resolve(null);
    }
  });
}

// ============================================================================
// INIT ON LOAD
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Settings] DOM loaded, initializing...');
  init();
  loadLicenseInfo();
});

// Also init immediately in case DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('[Settings] DOM already ready, initializing...');
  init();
}
