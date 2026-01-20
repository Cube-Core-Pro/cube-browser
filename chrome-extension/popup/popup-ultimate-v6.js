/**
 * CUBE Nexum Popup Ultimate v6
 * Advanced popup controller with Social Hub integration
 */

// State management
let currentTab = 'docs';
let detectedDocuments = [];
let settings = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await init();
    console.log('[CUBE Popup] Initialized successfully');
  } catch (error) {
    console.error('[CUBE Popup] Initialization error:', error);
  }
});

async function init() {
  setupEventListeners();
  await loadSettings();
  updateStats();
}

function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', handleTabClick);
  });

  // Document panel
  document.getElementById('btn-scan-page')?.addEventListener('click', scanPage);
  document.getElementById('btn-process-all')?.addEventListener('click', processAllDocuments);
  document.getElementById('btn-view-history')?.addEventListener('click', viewHistory);

  // Autofill panel
  document.getElementById('btn-smart-fill')?.addEventListener('click', smartFill);
  document.getElementById('btn-fill-form')?.addEventListener('click', fillForm);
  document.getElementById('btn-save-profile')?.addEventListener('click', saveProfile);
  document.getElementById('btn-load-profile')?.addEventListener('click', loadProfile);

  // Social Hub panel
  document.getElementById('btn-open-social-hub')?.addEventListener('click', openSocialHub);
  document.getElementById('btn-quick-post')?.addEventListener('click', quickPost);
  document.getElementById('btn-video-creator')?.addEventListener('click', openVideoCreator);
  document.getElementById('btn-viral-analytics')?.addEventListener('click', openViralAnalytics);

  // Macros panel
  document.getElementById('btn-record-macro')?.addEventListener('click', toggleMacroRecording);
  document.getElementById('btn-view-macros')?.addEventListener('click', viewMacros);

  // Capture panel
  document.getElementById('btn-screenshot')?.addEventListener('click', takeScreenshot);
  document.getElementById('btn-full-page')?.addEventListener('click', fullPageScreenshot);
  document.getElementById('btn-element')?.addEventListener('click', elementScreenshot);
  document.getElementById('btn-record-video')?.addEventListener('click', recordVideo);

  // Remote panel
  document.getElementById('btn-connect-rdp')?.addEventListener('click', connectRDP);
  document.getElementById('btn-connect-ssh')?.addEventListener('click', connectSSH);
  document.getElementById('btn-connections')?.addEventListener('click', viewConnections);

  // Settings panel
  document.getElementById('btn-save-settings')?.addEventListener('click', saveSettings);
  document.getElementById('btn-reset-settings')?.addEventListener('click', resetSettings);
  document.getElementById('btn-export-data')?.addEventListener('click', exportData);
  document.getElementById('btn-import-data')?.addEventListener('click', importData);
}

function handleTabClick(event) {
  const target = event.currentTarget;
  const tabName = target.dataset.tab;
  if (!tabName || tabName === currentTab) return;
  switchTab(tabName);
}

function switchTab(tabName) {
  currentTab = tabName;
  
  // Update tab buttons
  document.querySelectorAll('.tab').forEach(tab => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle('active', isActive);
  });

  // Update panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    const isActive = panel.id === `${tabName}-panel`;
    panel.classList.toggle('active', isActive);
  });

  // Refresh data for specific tabs
  if (tabName === 'docs') updateStats();
  if (tabName === 'social') updateSocialStats();
}

// ========================================
// Document Functions
// ========================================

async function scanPage() {
  showStatus('docs-status', 'Scanning page for documents...', 'loading');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.tabs.sendMessage(tab.id, { action: 'scanDocuments' });
    detectedDocuments = results.documents || [];
    updateDocumentList();
    showStatus('docs-status', `Found ${detectedDocuments.length} documents`, 'success');
  } catch (error) {
    showStatus('docs-status', 'Error scanning page', 'error');
    console.error('[Scan]', error);
  }
}

async function processAllDocuments() {
  if (detectedDocuments.length === 0) {
    showStatus('docs-status', 'No documents to process', 'warning');
    return;
  }
  showStatus('docs-status', 'Processing all documents...', 'loading');
  // Implementation would call content script
}

function viewHistory() {
  chrome.tabs.create({ url: chrome.runtime.getURL('popup/history.html') });
}

function updateDocumentList() {
  const container = document.getElementById('detected-docs');
  if (!container) return;
  
  if (detectedDocuments.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; opacity: 0.6;">
        <div style="font-size: 32px; margin-bottom: 8px;">📄</div>
        <div>No documents detected yet</div>
        <div style="font-size: 11px; margin-top: 4px;">Click "Scan Page" to detect</div>
      </div>
    `;
    return;
  }

  container.innerHTML = detectedDocuments.map((doc, i) => `
    <div class="doc-item" data-index="${i}">
      <span class="doc-icon">${getDocIcon(doc.type)}</span>
      <div class="doc-info">
        <div class="doc-name">${doc.name || 'Untitled'}</div>
        <div class="doc-meta">${doc.type} • ${formatSize(doc.size)}</div>
      </div>
      <button class="doc-action" data-action="process" data-index="${i}">Process</button>
    </div>
  `).join('');
}

// ========================================
// Autofill Functions
// ========================================

async function smartFill() {
  showStatus('autofill-status', 'AI analyzing form...', 'loading');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action: 'smartFill' });
    showStatus('autofill-status', 'Form filled successfully!', 'success');
  } catch (error) {
    showStatus('autofill-status', 'Error filling form', 'error');
  }
}

async function fillForm() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'fillForm' });
}

function saveProfile() {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings/profiles.html') });
}

function loadProfile() {
  // Show profile selector
}

// ========================================
// Social Hub Functions
// ========================================

const APP_BASE_URL = (typeof CubeConfig !== 'undefined' && CubeConfig.SERVER?.WEB_APP) || 'https://cubeai.tools';

function openSocialHub() {
  // Open main social command center in new tab
  chrome.tabs.create({ url: `${APP_BASE_URL}/social` });
}

function quickPost() {
  // Open quick post modal or new tab
  chrome.tabs.create({ url: `${APP_BASE_URL}/social?mode=quick-post` });
}

function openVideoCreator() {
  chrome.tabs.create({ url: `${APP_BASE_URL}/social/video-creator` });
}

function openViralAnalytics() {
  chrome.tabs.create({ url: `${APP_BASE_URL}/social/analytics` });
}

function updateSocialStats() {
  // Update social media stats in the panel
  // This would typically fetch from a backend API
  const totalFollowers = document.getElementById('social-followers');
  const engagement = document.getElementById('social-engagement');
  
  if (totalFollowers) totalFollowers.textContent = '487K';
  if (engagement) engagement.textContent = '8.7%';
}

// ========================================
// Macro Functions
// ========================================

let isRecording = false;

function toggleMacroRecording() {
  isRecording = !isRecording;
  const btn = document.getElementById('btn-record-macro');
  const textEl = document.getElementById('btn-record-text');
  const statusEl = document.getElementById('recording-status');
  
  if (isRecording) {
    btn?.classList.add('recording');
    if (textEl) textEl.textContent = 'Stop Recording';
    statusEl?.classList.remove('hidden');
    startRecording();
  } else {
    btn?.classList.remove('recording');
    if (textEl) textEl.textContent = 'Start Recording';
    statusEl?.classList.add('hidden');
    stopRecording();
  }
}

async function startRecording() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'startMacroRecording' });
}

async function stopRecording() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const result = await chrome.tabs.sendMessage(tab.id, { action: 'stopMacroRecording' });
  if (result?.macro) {
    saveMacro(result.macro);
  }
}

function saveMacro(macro) {
  chrome.storage.local.get(['savedMacros'], (data) => {
    const macros = data.savedMacros || [];
    macros.unshift({
      ...macro,
      id: Date.now(),
      createdAt: new Date().toISOString()
    });
    chrome.storage.local.set({ savedMacros: macros });
    updateMacroCount();
  });
}

function viewMacros() {
  chrome.tabs.create({ url: chrome.runtime.getURL('popup/macros.html') });
}

function updateMacroCount() {
  chrome.storage.local.get(['savedMacros'], (data) => {
    const count = (data.savedMacros || []).length;
    const el = document.getElementById('macro-count');
    if (el) el.textContent = count.toString();
  });
}

// ========================================
// Capture Functions
// ========================================

async function takeScreenshot() {
  showStatus('capture-status', 'Capturing screenshot...', 'loading');
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab();
    downloadImage(dataUrl, 'screenshot');
    showStatus('capture-status', 'Screenshot saved!', 'success');
  } catch (error) {
    showStatus('capture-status', 'Error capturing screenshot', 'error');
  }
}

async function fullPageScreenshot() {
  showStatus('capture-status', 'Capturing full page...', 'loading');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'fullPageScreenshot' });
}

async function elementScreenshot() {
  showStatus('capture-status', 'Select an element to capture', 'info');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'selectElement' });
}

async function recordVideo() {
  // Start screen recording
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'startVideoRecording' });
}

function downloadImage(dataUrl, prefix) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${prefix}-${timestamp}.png`;
  
  chrome.downloads.download({
    url: dataUrl,
    filename: filename,
    saveAs: true
  });
}

// ========================================
// Remote Functions
// ========================================

function connectRDP() {
  chrome.tabs.create({ url: chrome.runtime.getURL('popup/remote-rdp.html') });
}

function connectSSH() {
  chrome.tabs.create({ url: chrome.runtime.getURL('popup/remote-ssh.html') });
}

function viewConnections() {
  chrome.tabs.create({ url: chrome.runtime.getURL('popup/connections.html') });
}

// ========================================
// Settings Functions
// ========================================

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (data) => {
      settings = data.settings || getDefaultSettings();
      applySettings();
      resolve(settings);
    });
  });
}

function getDefaultSettings() {
  return {
    autoDetect: true,
    notifications: true,
    darkMode: true,
    aiAssist: true,
    language: 'en'
  };
}

function applySettings() {
  // Apply settings to UI
  Object.entries(settings).forEach(([key, value]) => {
    const el = document.getElementById(`setting-${key}`);
    if (el) {
      if (el.type === 'checkbox') {
        el.checked = value;
      } else {
        el.value = value;
      }
    }
  });
}

async function saveSettings() {
  // Collect settings from UI
  const newSettings = {};
  document.querySelectorAll('[id^="setting-"]').forEach(el => {
    const key = el.id.replace('setting-', '');
    newSettings[key] = el.type === 'checkbox' ? el.checked : el.value;
  });
  
  settings = newSettings;
  await chrome.storage.sync.set({ settings });
  showStatus('settings-status', 'Settings saved!', 'success');
}

function resetSettings() {
  settings = getDefaultSettings();
  applySettings();
  chrome.storage.sync.set({ settings });
  showStatus('settings-status', 'Settings reset to defaults', 'info');
}

async function exportData() {
  const data = await chrome.storage.local.get(null);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: url,
    filename: `cube-nexum-backup-${Date.now()}.json`,
    saveAs: true
  });
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const text = await file.text();
    const data = JSON.parse(text);
    await chrome.storage.local.set(data);
    showStatus('settings-status', 'Data imported successfully!', 'success');
  };
  input.click();
}

// ========================================
// Utility Functions
// ========================================

function updateStats() {
  // Update document stats
  const totalEl = document.getElementById('stat-docs-total');
  const processedEl = document.getElementById('stat-docs-processed');
  
  if (totalEl) totalEl.textContent = detectedDocuments.length.toString();
  if (processedEl) processedEl.textContent = '0';
}

function showStatus(containerId, message, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.className = `status ${type}`;
  container.innerHTML = `
    ${type === 'loading' ? '<div class="spinner"></div>' : ''}
    <span>${message}</span>
  `;
  container.classList.remove('hidden');
  
  if (type !== 'loading') {
    setTimeout(() => {
      container.classList.add('hidden');
    }, 3000);
  }
}

function getDocIcon(type) {
  const icons = {
    pdf: '📕',
    excel: '📊',
    word: '📄',
    image: '🖼️',
    csv: '📋',
    default: '📎'
  };
  return icons[type?.toLowerCase()] || icons.default;
}

function formatSize(bytes) {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'documentsDetected') {
    detectedDocuments = message.documents;
    updateDocumentList();
    updateStats();
  }
  
  if (message.type === 'screenshotReady') {
    downloadImage(message.dataUrl, 'screenshot');
    showStatus('capture-status', 'Screenshot saved!', 'success');
  }
  
  if (message.type === 'macroRecorded') {
    isRecording = false;
    toggleMacroRecording();
    showStatus('macros-status', 'Macro recorded successfully!', 'success');
  }
  
  return true;
});

console.log('[CUBE Nexum Popup] v7.0.0 loaded');
