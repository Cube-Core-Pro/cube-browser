// CUBE OmniFill - Enterprise Popup Script v3.5
// Universal autofill with Voice, AI, Sound, and CRM integrations

console.log('🚀 CUBE OmniFill Enterprise v3.5 initializing...');

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (must be defined before use)
// ═══════════════════════════════════════════════════════════════════════════

function getSelectedFormats() {
  const checkboxes = document.querySelectorAll('.format-checkbox:checked');
  const formats = Array.from(checkboxes)
    .map(cb => cb.value)
    .filter(v => v !== 'all');
  
  // If "all" is selected, return comprehensive list
  if (Array.from(checkboxes).some(cb => cb.value === 'all')) {
    return ['pdf', 'xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt', 'images', 'csv', 'txt', 'rtf', 'json', 'xml'];
  }
  
  // If no formats selected, default to PDF only
  if (formats.length === 0) {
    return ['pdf'];
  }
  
  return formats;
}

// Enhanced message sending with timeout
function sendMessageWithTimeout(tabId, message, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let responded = false;
    
    // Set timeout
    const timeout = setTimeout(() => {
      if (!responded) {
        responded = true;
        reject(new Error(`Timeout after ${timeoutMs}ms. The page may be loading or the extension may not be active.`));
      }
    }, timeoutMs);
    
    // Send message
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (!responded) {
        responded = true;
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      }
    });
  });
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const targetPanel = tab.dataset.tab;
    
    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show target panel
    document.querySelectorAll('.tab-content').forEach(panel => {
      panel.classList.remove('active');
    });
    document.getElementById(`${targetPanel}-panel`).classList.add('active');
  });
});

// Initialize connection status
let isConnected = false;
let currentPageInfo = {
  url: '',
  title: '',
  hasContentScript: false
};
let stats = {
  pdfs: 0,
  filled: 0,
  accuracy: 0
};
let pdfParseStatus = {}; // Track which PDFs have been parsed
let currentPDFList = []; // Cache current PDF list

// Helper to get current PDFs
function getCurrentPDFs() {
  return currentPDFList;
}

// Helper to set current PDFs
function setCurrentPDFs(pdfs) {
  currentPDFList = pdfs;
}

// Get current page info
function updatePageInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      currentPageInfo.url = tabs[0].url;
      currentPageInfo.title = tabs[0].title;
      
      // Update UI with page info
      const pageInfoDiv = document.getElementById('current-page-info');
      const pageUrl = document.getElementById('page-url');
      const pageTitle = document.getElementById('page-title');
      
      if (pageUrl && pageTitle && pageInfoDiv) {
        try {
          const url = new URL(currentPageInfo.url);
          pageUrl.textContent = url.hostname + url.pathname;
          pageTitle.textContent = currentPageInfo.title || 'Untitled';
          pageInfoDiv.style.display = 'block';
        } catch (e) {
          pageUrl.textContent = currentPageInfo.url;
          pageTitle.textContent = currentPageInfo.title || 'Untitled';
          pageInfoDiv.style.display = 'block';
        }
      }
      
      // Check if URL is accessible (not chrome:// or other restricted)
      const isAccessible = !tabs[0].url.startsWith('chrome://') && 
                          !tabs[0].url.startsWith('chrome-extension://') &&
                          !tabs[0].url.startsWith('about:');
      
      if (isAccessible) {
        // Try to inject content script if needed
        checkContentScript(tabs[0].id);
      } else {
        updateConnectionStatus(false, 'Not available on this page');
      }
    }
  });
}

// Check if content script is loaded
function checkContentScript(tabId) {
  chrome.tabs.sendMessage(tabId, { 
    type: 'ping'
  }, (response) => {
    if (chrome.runtime.lastError) {
      // Content script not loaded, try to inject it
      injectContentScript(tabId);
    } else {
      currentPageInfo.hasContentScript = true;
      updateConnectionStatus(true, `Connected to ${currentPageInfo.title}`);
    }
  });
}

// Inject content script dynamically
function injectContentScript(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content-advanced.js']
  }).then(() => {
    currentPageInfo.hasContentScript = true;
    updateConnectionStatus(true, 'Connected • Ready');
    showNotification('Extension loaded successfully', 'success');
  }).catch((error) => {
    console.error('Failed to inject content script:', error);
    updateConnectionStatus(false, 'Click "Reload" to activate');
  });
}

function updateConnectionStatus(connected, message) {
  isConnected = connected;
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const reloadBtn = document.getElementById('reload-content-script');
  
  if (connected) {
    statusDot.classList.add('active');
    statusText.textContent = message || 'Connected • Ready';
    reloadBtn.style.display = 'none';
  } else {
    statusDot.classList.remove('active');
    statusText.textContent = message || 'Not connected';
    // Show reload button if not connected
    if (currentPageInfo.url && !currentPageInfo.url.startsWith('chrome://')) {
      reloadBtn.style.display = 'inline-block';
    }
  }
}

// Reload content script button
document.getElementById('reload-content-script').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      showNotification('Reloading extension...', 'info');
      injectContentScript(tabs[0].id);
    }
  });
});

// Voice Control
let isListening = false;
const voiceStartBtn = document.getElementById('voice-start');
const voiceStopBtn = document.getElementById('voice-stop');
const voiceStatus = document.getElementById('voice-status');

voiceStartBtn.addEventListener('click', () => {
  startVoiceControl();
});

voiceStopBtn.addEventListener('click', () => {
  stopVoiceControl();
});

function startVoiceControl() {
  isListening = true;
  voiceStartBtn.style.display = 'none';
  voiceStopBtn.style.display = 'flex';
  voiceStatus.textContent = 'Listening...';
  voiceStatus.classList.add('listening');
  
  // Send message to content script to start voice recognition
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { 
        type: 'start-voice'
      });
    }
  });
  
  showNotification('Voice control activated', 'success');
}

function stopVoiceControl() {
  isListening = false;
  voiceStartBtn.style.display = 'flex';
  voiceStopBtn.style.display = 'none';
  voiceStatus.textContent = 'Ready';
  voiceStatus.classList.remove('listening');
  
  // Send message to content script to stop voice recognition
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { 
        type: 'stop-voice'
      });
    }
  });
  
  showNotification('Voice control deactivated', 'info');
}

// Detect PDFs button with page info
document.getElementById('detect-pdfs').addEventListener('click', async () => {
  const btn = document.getElementById('detect-pdfs');
  btn.classList.add('loading');
  btn.disabled = true;
  
  // Get selected formats
  const selectedFormats = getSelectedFormats();
  
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tabs[0]) {
      throw new Error('No active tab found');
    }
    
    // Update page info first
    currentPageInfo.url = tabs[0].url;
    currentPageInfo.title = tabs[0].title;
    
    // Check if page is accessible
    const isAccessible = !tabs[0].url.startsWith('chrome://') && 
                        !tabs[0].url.startsWith('chrome-extension://') &&
                        !tabs[0].url.startsWith('about:');
    
    if (!isAccessible) {
      throw new Error('Cannot access chrome:// pages or extension pages');
    }
    
    // Try to detect documents with timeout
    showNotification('Detecting documents...', 'info');
    
    const response = await sendMessageWithTimeout(tabs[0].id, { 
      type: 'detect-documents',
      formats: selectedFormats
    }, 15000);
    
    // Parse response
    let docs = [];
    if (response && response.success) {
      // Try multiple response formats for compatibility
      docs = response.documents || 
             response.data?.documents || 
             response.data?.pdfs || 
             [];
    }
    
    // Update UI
    stats.pdfs = docs.length;
    updateStats();
    refreshPDFList(docs);
    
    if (docs.length > 0) {
      updateConnectionStatus(true, `Found ${docs.length} doc(s) [${selectedFormats.join(', ')}] on ${new URL(currentPageInfo.url).hostname}`);
      showNotification(`✅ Found ${docs.length} document(s) [${selectedFormats.join(', ')}]`, 'success');
    } else {
      updateConnectionStatus(true, `No docs on ${new URL(currentPageInfo.url).hostname}`);
      showNotification('No documents found on this page', 'info');
    }
    
  } catch (error) {
    console.error('Detection error:', error);
    
    // Handle specific errors
    if (error.message.includes('Timeout')) {
      showNotification('Detection timeout. Try reloading the page.', 'error');
    } else if (error.message.includes('Could not establish connection')) {
      showNotification('Extension not loaded. Reloading...', 'info');
      try {
        await injectContentScript(tabs[0].id);
        showNotification('Extension loaded. Try again.', 'success');
      } catch (injectError) {
        showNotification('Failed to load extension', 'error');
      }
    } else {
      showNotification(error.message, 'error');
    }
    
    refreshPDFList([]);
    updateConnectionStatus(false, 'Detection failed');
    
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});

// Run Autofill button
document.getElementById('run-autofill').addEventListener('click', () => {
  const btn = document.getElementById('run-autofill');
  btn.classList.add('loading');
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      btn.classList.remove('loading');
      showNotification('No active tab found', 'error');
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, { 
      type: 'run-autofill',
      data: { profile: 'full-loan-application' }
    }, (response) => {
      btn.classList.remove('loading');
      
      if (chrome.runtime.lastError) {
        console.error('Chrome runtime error:', chrome.runtime.lastError);
        showNotification('Extension not loaded on this page. Please reload.', 'error');
        return;
      }
      
      if (response && response.success && response.data) {
        const fieldsCount = response.data.fieldsFilled || 0;
        stats.filled += fieldsCount;
        updateStats();
        showNotification(`Successfully filled ${fieldsCount} field(s)`, 'success');
      } else {
        showNotification('Autofill failed. Please detect documents first.', 'error');
      }
    });
  });
});

// Parse All PDFs button
const parseAllButton = document.getElementById('parse-all-pdfs');
if (parseAllButton) {
  parseAllButton.addEventListener('click', () => {
    console.log('[Parse All] Button clicked');
    const btn = document.getElementById('parse-all-pdfs');
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      showNotification('No active tab found', 'error');
      return;
    }
    
    console.log('[Parse All] Detecting PDFs...');
    
    // Get current PDFs
    chrome.tabs.sendMessage(tabs[0].id, { 
      type: 'detect-pdfs'
    }, (response) => {
      console.log('[Parse All] Detect response:', response);
      
      if (chrome.runtime.lastError) {
        console.error('[Parse All] Chrome runtime error:', chrome.runtime.lastError);
        showNotification('Failed to detect documents', 'error');
        return;
      }
      
      if (!response || !response.success) {
        console.error('[Parse All] Detection failed:', response);
        showNotification('Failed to detect documents', 'error');
        return;
      }
      
      const pdfs = response.data?.pdfs || [];
      console.log('[Parse All] PDFs found:', pdfs.length, 'Parse status:', pdfParseStatus);
      
      const unparsedPdfs = pdfs.filter((pdf, index) => !pdfParseStatus[index]?.parsed);
      console.log('[Parse All] Unparsed PDFs:', unparsedPdfs.length);
      
      if (unparsedPdfs.length === 0) {
        showNotification('All documents are already parsed', 'info');
        return;
      }
      
      // Confirm
      const confirmed = confirm(
        `🚀 Parse All Documents\n\n` +
        `This will parse ${unparsedPdfs.length} unparsed document(s).\n\n` +
        `Continue?`
      );
      
      if (!confirmed) {
        console.log('[Parse All] User cancelled');
        return;
      }
      
      console.log('[Parse All] Starting batch parse...');
      
      // Disable button
      btn.disabled = true;
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px; animation: spin 1s linear infinite;">
          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
        </svg>
        Parsing...
      `;
      
      let completed = 0;
      let failed = 0;
      
      // Parse each unparsed PDF sequentially
      const parseNext = (pdfIndex) => {
        console.log(`[Parse All] Processing index ${pdfIndex}/${pdfs.length}`);
        
        if (pdfIndex >= pdfs.length) {
          // All done
          console.log('[Parse All] All done!', {completed, failed});
          btn.disabled = false;
          btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11z"/>
            </svg>
            Parse All
          `;
          
          showNotification(
            `Parse All Complete!\n✅ ${completed} parsed${failed > 0 ? `\n❌ ${failed} failed` : ''}`,
            failed > 0 ? 'warning' : 'success'
          );
          
          // Refresh list with current PDFs
          refreshPDFList(pdfs);
          
          return;
        }
        
        // Skip if already parsed
        if (pdfParseStatus[pdfIndex]?.parsed) {
          console.log(`[Parse All] Skipping index ${pdfIndex} (already parsed)`);
          parseNext(pdfIndex + 1);
          return;
        }
        
        console.log(`[Parse All] Parsing PDF at index ${pdfIndex}:`, pdfs[pdfIndex]);
        
        // Parse this PDF
        chrome.tabs.sendMessage(tabs[0].id, { 
          type: 'parse-pdf',
          data: { index: pdfIndex }
        }, (parseResponse) => {
          console.log(`[Parse All] Parse response for index ${pdfIndex}:`, parseResponse);
          if (chrome.runtime.lastError || !parseResponse || !parseResponse.success) {
            failed++;
          } else {
            completed++;
            const fieldCount = Object.keys(parseResponse.data).length;
            
            // Mark as parsed
            pdfParseStatus[pdfIndex] = {
              parsed: true,
              fields: fieldCount,
              data: parseResponse.data
            };
            
            // Add to history
            addToHistory('parse', {
              document: pdfs[pdfIndex].name || pdfs[pdfIndex].title || `Document ${pdfIndex + 1}`,
              description: `Extracted ${fieldCount} fields from PDF`,
              fields: fieldCount,
              url: pdfs[pdfIndex].url
            });
          }
          
          // Parse next
          setTimeout(() => parseNext(pdfIndex + 1), 300);
        });
      };
      
      // Start parsing
      parseNext(0);
    });
  });
  });
} else {
  console.error('[Parse All] Button not found in DOM!');
}

// Download All PDFs button
const downloadAllButton = document.getElementById('download-all-pdfs');
if (downloadAllButton) {
  downloadAllButton.addEventListener('click', () => {
    console.log('[Download All] Button clicked');
    downloadAllPDFs();
  });
} else {
  console.error('[Download All] Button not found in DOM!');
}

// Refresh PDFs button
document.getElementById('refresh-pdfs').addEventListener('click', async () => {
  const btn = document.getElementById('refresh-pdfs');
  btn.classList.add('loading');
  btn.disabled = true;
  
  // Get selected formats
  const selectedFormats = getSelectedFormats();
  
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tabs[0]) {
      throw new Error('No active tab found');
    }
    
    // Show detecting message
    showNotification('Detecting documents...', 'info');
    
    // Try to detect documents with timeout
    const response = await sendMessageWithTimeout(tabs[0].id, { 
      type: 'detect-documents',
      formats: selectedFormats
    }, 15000);
    
    // Parse response - support multiple formats
    let docs = [];
    if (response && response.success) {
      docs = response.documents || 
             response.data?.documents || 
             response.data?.pdfs || 
             [];
    }
    
    // Update list
    refreshPDFList(docs);
    
    if (docs.length > 0) {
      showNotification(`✅ Found ${docs.length} document(s) [${selectedFormats.join(', ')}]`, 'success');
    } else {
      showNotification('No documents found', 'info');
    }
    
  } catch (error) {
    console.error('Detection error:', error);
    
    if (error.message.includes('Timeout')) {
      showNotification('Detection timeout. Page may still be loading.', 'error');
    } else if (error.message.includes('Could not establish connection')) {
      showNotification('Extension not loaded on this page. Please reload.', 'error');
    } else {
      showNotification(`Error: ${error.message}`, 'error');
    }
    
    refreshPDFList([]);
    
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});

// Update stats display
function updateStats() {
  document.getElementById('total-pdfs').textContent = stats.pdfs || 0;
  document.getElementById('filled-fields').textContent = stats.filled || 0;
  
  // Calculate accuracy (mock data for now)
  const accuracy = stats.filled > 0 ? Math.min(98, 85 + Math.random() * 10) : 0;
  stats.accuracy = accuracy;
  document.getElementById('accuracy-rate').textContent = stats.filled > 0 ? `${Math.round(accuracy)}%` : '0%';
}

// Refresh PDF list
function refreshPDFList(pdfs) {
  console.log('[refreshPDFList] Called with:', pdfs, 'Parse status:', pdfParseStatus);
  const pdfList = document.getElementById('pdf-list');
  const parseAllBtn = document.getElementById('parse-all-pdfs');
  const downloadAllBtn = document.getElementById('download-all-pdfs');
  
  // Save to cache
  setCurrentPDFs(pdfs);
  
  if (!pdfs || pdfs.length === 0) {
    // Hide buttons
    if (parseAllBtn) parseAllBtn.style.display = 'none';
    if (downloadAllBtn) downloadAllBtn.style.display = 'none';
    
    pdfList.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/>
        </svg>
        <p>No documents detected</p>
        <small>Works on any website with PDFs or forms</small>
      </div>
    `;
    return;
  }
  
  // Show buttons if there are PDFs
  if (parseAllBtn) parseAllBtn.style.display = 'flex';
  if (downloadAllBtn) downloadAllBtn.style.display = 'flex';
  
  pdfList.innerHTML = pdfs.map((pdf, index) => {
    const isParsed = pdfParseStatus[index]?.parsed;
    const fieldCount = pdfParseStatus[index]?.fields || 0;
    const isFilled = pdfParseStatus[index]?.filled;
    const fieldsFilled = pdfParseStatus[index]?.fieldsFilled || 0;
    
    console.log(`[refreshPDFList] PDF ${index}:`, {pdf, isParsed, fieldCount, isFilled, fieldsFilled});
    
    return `
    <div class="pdf-item" style="padding: 18px; background: white; border: 1px solid var(--gray-200); border-radius: 12px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s ease;">
      <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px;">
        <div style="flex: 1; min-width: 0; max-width: calc(100% - 110px);">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
            <div style="font-weight: 600; font-size: 14px; color: var(--gray-900); line-height: 1.4; word-break: break-word; overflow: hidden; text-overflow: ellipsis;">
              ${pdf.filename || pdf.name || pdf.title || `Document ${index + 1}`}
            </div>
            ${isParsed ? `
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #ECFDF5; color: #059669; border-radius: 14px; font-size: 11px; font-weight: 600; box-shadow: 0 1px 2px rgba(5,150,105,0.1); white-space: nowrap;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
                Parsed (${fieldCount} fields)
              </span>
            ` : ''}
            ${isFilled ? `
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #EFF6FF; color: #2563EB; border-radius: 14px; font-size: 11px; font-weight: 600; box-shadow: 0 1px 2px rgba(37,99,235,0.1); white-space: nowrap;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
                Filled (${fieldsFilled} fields)
              </span>
            ` : ''}
          </div>
          <div style="font-size: 11.5px; color: var(--gray-500); margin-bottom: 8px; font-weight: 500;">
            📍 ${pdf.url ? new URL(pdf.url).hostname : 'Current page'}
          </div>
          <div style="display: flex; gap: 7px; flex-wrap: wrap;">
            <span style="display: inline-block; padding: 4px 10px; background: var(--gray-100); border-radius: 12px; font-size: 10.5px; font-weight: 600; color: var(--gray-700); text-transform: uppercase; letter-spacing: 0.3px;">
              ${pdf.type || 'PDF'}
            </span>
            <span style="display: inline-block; padding: 4px 10px; background: var(--gray-100); border-radius: 12px; font-size: 10.5px; font-weight: 600; color: var(--gray-700);">
              ${pdf.source || 'detected'}
            </span>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; width: 95px; margin-left: auto;">
          <button class="btn ${isParsed ? 'btn-success' : 'btn-secondary'} parse-btn" 
                  style="padding: 8px 14px; font-size: 11.5px; white-space: nowrap; min-height: 34px; font-weight: 600; width: 100%; ${isParsed ? 'opacity: 0.8; cursor: not-allowed;' : ''}" 
                  data-pdf-index="${index}" 
                  ${isParsed ? 'disabled' : ''}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 5px;">
              ${isParsed ? '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>' : '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/>'}
            </svg>
            ${isParsed ? '✓ Parsed' : 'Parse'}
          </button>
          <button class="btn ${isFilled ? 'btn-success' : 'btn-primary'} fill-btn" 
                  style="padding: 8px 14px; font-size: 11.5px; white-space: nowrap; min-height: 34px; font-weight: 600; width: 100%; ${isFilled ? 'opacity: 0.9;' : ''}" 
                  data-pdf-index="${index}"
                  ${isFilled ? 'disabled' : ''}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 5px;">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            ${isFilled ? '✓ Filled' : 'Fill'}
          </button>
          <button class="btn btn-accent download-btn" 
                  style="padding: 8px 14px; font-size: 11.5px; white-space: nowrap; min-height: 34px; font-weight: 600; width: 100%;" 
                  data-pdf-index="${index}"
                  title="Download PDF">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 5px;">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  `;
  }).join('');
  
  // Add event listeners to parse buttons
  pdfList.querySelectorAll('.parse-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.pdfIndex);
      parsePDF(pdfs[index], index);
    });
  });
  
  // Add event listeners to fill buttons
  pdfList.querySelectorAll('.fill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.pdfIndex);
      fillPDF(pdfs[index], index);
    });
  });
  
  // Add event listeners to download buttons
  pdfList.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.pdfIndex);
      downloadPDFIndividual(pdfs[index], index);
    });
  });
}

// Parse individual PDF
function parsePDF(pdf, index) {
  console.log('[Parse] Starting parse for PDF:', index, pdf);
  const btn = document.querySelector(`.parse-btn[data-pdf-index="${index}"]`);
  if (btn) btn.classList.add('loading');
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      if (btn) btn.classList.remove('loading');
      showNotification('No active tab found', 'error');
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, { 
      type: 'parse-pdf',
      data: { index: index }
    }, (response) => {
      console.log('[Parse] Response received:', response);
      if (btn) btn.classList.remove('loading');
      
      if (chrome.runtime.lastError) {
        console.error('Chrome runtime error:', chrome.runtime.lastError);
        showNotification('Failed to parse document', 'error');
        return;
      }
      
      if (response && response.success && response.data) {
        const fieldCount = Object.keys(response.data).length;
        console.log('[Parse] Success! Fields:', fieldCount, 'Data:', response.data);
        showNotification(`Parsed successfully! ${fieldCount} field(s) extracted`, 'success');
        
        // Mark as parsed
        pdfParseStatus[index] = {
          parsed: true,
          fields: fieldCount,
          data: response.data
        };
        console.log('[Parse] Status updated:', pdfParseStatus);
        
        // Force immediate UI update
        const currentPdfs = getCurrentPDFs();
        if (currentPdfs && currentPdfs.length > 0) {
          console.log('[Parse] Refreshing PDF list with:', currentPdfs);
          refreshPDFList(currentPdfs);
        } else {
          // Fallback: re-detect PDFs
          chrome.tabs.sendMessage(tabs[0].id, { type: 'detect-pdfs' }, (detectResponse) => {
            console.log('[Parse] Re-detect response:', detectResponse);
            if (detectResponse && detectResponse.data && detectResponse.data.pdfs) {
              refreshPDFList(detectResponse.data.pdfs);
            }
          });
        }
        
        // Add to history
        addToHistory('parse', {
          document: pdf.name || pdf.title || `Document ${index + 1}`,
          description: `Extracted ${fieldCount} fields from PDF`,
          fields: fieldCount,
          url: pdf.url
        });
      } else {
        console.error('[Parse] Failed - Invalid response:', response);
        showNotification('Failed to parse document', 'error');
      }
    });
  });
}

// Fill individual PDF
function fillPDF(pdf, index) {
  console.log('[Fill] Starting fill for PDF:', index, pdf);
  
  // Confirmation dialog
  const docName = pdf.name || pdf.title || `Document ${index + 1}`;
  const confirmed = confirm(
    `🔄 Auto-Fill Confirmation\n\n` +
    `Document: ${docName}\n\n` +
    `This will automatically fill detected form fields.\n\n` +
    `⚠️ This action cannot be undone.\n\n` +
    `Continue?`
  );
  
  if (!confirmed) {
    console.log('[Fill] User cancelled');
    return;
  }
  
  const btn = document.querySelector(`.fill-btn[data-pdf-index="${index}"]`);
  if (btn) btn.classList.add('loading');
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      if (btn) btn.classList.remove('loading');
      showNotification('No active tab found', 'error');
      return;
    }
    
    // First parse the PDF if not already parsed
    if (!pdfParseStatus[index]?.parsed) {
      console.log('[Fill] Parsing first...');
      chrome.tabs.sendMessage(tabs[0].id, { 
        type: 'parse-pdf',
        data: { index: index }
      }, (parseResponse) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          if (btn) btn.classList.remove('loading');
          showNotification('Extension not loaded on this page', 'error');
          return;
        }
        
        if (!parseResponse || !parseResponse.success) {
          if (btn) btn.classList.remove('loading');
          showNotification('Failed to parse document', 'error');
          return;
        }
        
        // Mark as parsed
        const fieldCount = Object.keys(parseResponse.data || {}).length;
        pdfParseStatus[index] = {
          parsed: true,
          fields: fieldCount,
          data: parseResponse.data
        };
        
        // Now run autofill
        runAutofill(tabs[0].id, pdf, index, btn);
      });
    } else {
      // Already parsed, just run autofill
      console.log('[Fill] Already parsed, running autofill...');
      runAutofill(tabs[0].id, pdf, index, btn);
    }
  });
}

// Helper function to run autofill
function runAutofill(tabId, pdf, index, btn) {
  console.log('[Fill] Running autofill for index:', index);
  
  chrome.tabs.sendMessage(tabId, { 
    type: 'run-autofill',
    data: { profile: 'full-loan-application' }
  }, (fillResponse) => {
    if (btn) btn.classList.remove('loading');
    
    console.log('[Fill] Autofill response:', fillResponse);
    
    if (fillResponse && fillResponse.success && fillResponse.data) {
      const fieldsCount = fillResponse.data.fieldsFilled || 0;
      stats.filled += fieldsCount;
      updateStats();
      showNotification(`Document filled: ${fieldsCount} fields`, 'success');
      
      // Mark as filled
      if (!pdfParseStatus[index]) {
        pdfParseStatus[index] = {};
      }
      pdfParseStatus[index].filled = true;
      pdfParseStatus[index].fieldsFilled = fieldsCount;
      
      console.log('[Fill] Status updated:', pdfParseStatus);
      
      // Update UI
      const currentPdfs = getCurrentPDFs();
      if (currentPdfs && currentPdfs.length > 0) {
        refreshPDFList(currentPdfs);
      }
      
      // Add to history
      addToHistory('fill', {
        document: pdf.name || pdf.title || `Document ${index + 1}`,
        description: `Auto-filled ${fieldsCount} fields in form`,
        fields: fieldsCount,
        url: pdf.url
      });
    } else {
      showNotification('Failed to fill document', 'error');
    }
  });
}

// OpenAI Settings Management
document.getElementById('save-ai-settings')?.addEventListener('click', () => {
  const apiKey = document.getElementById('openai-api-key').value.trim();
  const model = document.getElementById('openai-model').value;
  const smartMapping = document.getElementById('smart-mapping').checked;
  
  if (!apiKey) {
    showNotification('Please enter your OpenAI API Key', 'error');
    return;
  }
  
  if (!apiKey.startsWith('sk-')) {
    showNotification('Invalid API Key format. Must start with "sk-"', 'error');
    return;
  }
  
  // Save to chrome storage
  const aiConfig = {
    apiKey: apiKey,
    model: model,
    smartMapping: smartMapping,
    provider: 'openai',
    updatedAt: new Date().toISOString()
  };
  
  chrome.storage.local.set({ aiConfig }, () => {
    showNotification('AI configuration saved successfully!', 'success');
    
    // Send to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'update-ai-config',
          data: aiConfig
        });
      }
    });
  });
});

// Test API Connection
document.getElementById('test-api-connection')?.addEventListener('click', async () => {
  const apiKey = document.getElementById('openai-api-key').value.trim();
  const model = document.getElementById('openai-model').value;
  const resultDiv = document.getElementById('api-test-result');
  const btn = document.getElementById('test-api-connection');
  
  if (!apiKey) {
    showNotification('Please enter API Key first', 'error');
    return;
  }
  
  if (!apiKey.startsWith('sk-')) {
    showNotification('Invalid API Key format', 'error');
    return;
  }
  
  // Show loading
  btn.disabled = true;
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/></svg> Testing...';
  resultDiv.style.display = 'none';
  
  try {
    // Test API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 5
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      resultDiv.style.display = 'block';
      resultDiv.style.background = '#ECFDF5';
      resultDiv.style.color = '#10B981';
      resultDiv.style.border = '1px solid #10B981';
      resultDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
          </svg>
          <div>
            <strong>✅ Connection Successful!</strong><br>
            Model: ${data.model || model}<br>
            Status: Active and ready
          </div>
        </div>
      `;
      showNotification('API connection successful!', 'success');
    } else {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }
  } catch (error) {
    resultDiv.style.display = 'block';
    resultDiv.style.background = '#FEF2F2';
    resultDiv.style.color = '#EF4444';
    resultDiv.style.border = '1px solid #EF4444';
    resultDiv.innerHTML = `
      <div style="display: flex; align-items: start; gap: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <div>
          <strong>❌ Connection Failed</strong><br>
          ${error.message}<br>
          <small>Check your API key and try again</small>
        </div>
      </div>
    `;
    showNotification('API connection failed', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> Test Connection';
  }
});

// Load saved OpenAI settings
chrome.storage.local.get(['aiConfig'], (result) => {
  if (result.aiConfig) {
    const config = result.aiConfig;
    const apiKeyInput = document.getElementById('openai-api-key');
    const modelSelect = document.getElementById('openai-model');
    const smartMappingCheck = document.getElementById('smart-mapping');
    
    if (apiKeyInput) apiKeyInput.value = config.apiKey || '';
    if (modelSelect) modelSelect.value = config.model || 'gpt-5.2';
    if (smartMappingCheck) smartMappingCheck.checked = config.smartMapping !== false;
  }
});

// Load and Save Autofill Profile
chrome.storage.local.get(['autofillProfile'], (result) => {
  const profileSelect = document.getElementById('autofill-profile');
  if (profileSelect && result.autofillProfile) {
    profileSelect.value = result.autofillProfile;
  }
});

// Save profile when changed
document.getElementById('autofill-profile')?.addEventListener('change', (e) => {
  const profile = e.target.value;
  chrome.storage.local.set({ autofillProfile: profile }, () => {
    console.log('✅ Autofill profile saved:', profile);
    
    // Send to content script for immediate use
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'update-autofill-profile',
          data: { profile }
        });
      }
    });
    
    // Show notification if it's auto-detect
    if (profile === 'auto-detect') {
      showNotification('🤖 Auto-detection enabled - Form type will be detected automatically', 'success');
    } else {
      // Get friendly name from the select option
      const selectedOption = e.target.options[e.target.selectedIndex];
      const profileName = selectedOption.text;
      showNotification(`Profile changed to: ${profileName}`, 'success');
    }
  });
});

// CRM Connection Handlers
document.getElementById('connect-salesforce')?.addEventListener('click', () => {
  const url = document.getElementById('salesforce-url').value.trim();
  const token = document.getElementById('salesforce-token').value.trim();
  
  if (!url || !token) {
    showNotification('Please enter Salesforce URL and API token', 'error');
    return;
  }
  
  // Validate Salesforce URL
  const salesforcePattern = /^https:\/\/[a-zA-Z0-9-]+\.salesforce\.com/;
  if (!salesforcePattern.test(url)) {
    showNotification('Invalid Salesforce URL. Must be https://yourcompany.salesforce.com', 'error');
    return;
  }
  
  const crmConfig = { salesforce: { url, token, connected: true } };
  chrome.storage.local.get(['crmConnections'], (result) => {
    const connections = result.crmConnections || {};
    connections.salesforce = crmConfig.salesforce;
    
    chrome.storage.local.set({ crmConnections: connections }, () => {
      document.getElementById('salesforce-badge').textContent = 'Connected';
      document.getElementById('salesforce-badge').className = 'crm-status-badge connected';
      showNotification('Salesforce connected successfully!', 'success');
      updateCRMStatus(connections);
    });
  });
});

document.getElementById('connect-hubspot')?.addEventListener('click', () => {
  const key = document.getElementById('hubspot-key').value.trim();
  
  if (!key) {
    showNotification('Please enter HubSpot API key', 'error');
    return;
  }
  
  const crmConfig = { hubspot: { key, connected: true } };
  chrome.storage.local.get(['crmConnections'], (result) => {
    const connections = result.crmConnections || {};
    connections.hubspot = crmConfig.hubspot;
    
    chrome.storage.local.set({ crmConnections: connections }, () => {
      document.getElementById('hubspot-badge').textContent = 'Connected';
      document.getElementById('hubspot-badge').className = 'crm-status-badge connected';
      showNotification('HubSpot connected successfully!', 'success');
      updateCRMStatus(connections);
    });
  });
});

document.getElementById('connect-dynamics')?.addEventListener('click', () => {
  const url = document.getElementById('dynamics-url').value.trim();
  const clientId = document.getElementById('dynamics-client-id').value.trim();
  const secret = document.getElementById('dynamics-secret').value.trim();
  
  if (!url || !clientId || !secret) {
    showNotification('Please enter all Dynamics 365 credentials', 'error');
    return;
  }
  
  // Validate Dynamics URL
  const dynamicsPattern = /^https:\/\/[a-zA-Z0-9-]+\.crm\d*\.dynamics\.com/;
  if (!dynamicsPattern.test(url)) {
    showNotification('Invalid Dynamics URL. Must be https://yourorg.crm.dynamics.com', 'error');
    return;
  }
  
  const crmConfig = { dynamics365: { url, clientId, secret, connected: true } };
  chrome.storage.local.get(['crmConnections'], (result) => {
    const connections = result.crmConnections || {};
    connections.dynamics365 = crmConfig.dynamics365;
    
    chrome.storage.local.set({ crmConnections: connections }, () => {
      document.getElementById('dynamics-badge').textContent = 'Connected';
      document.getElementById('dynamics-badge').className = 'crm-status-badge connected';
      showNotification('Dynamics 365 connected successfully!', 'success');
      updateCRMStatus(connections);
    });
  });
});

// Load saved CRM connections
chrome.storage.local.get(['crmConnections'], (result) => {
  if (result.crmConnections) {
    const connections = result.crmConnections;
    
    // Salesforce
    if (connections.salesforce) {
      const sfUrl = document.getElementById('salesforce-url');
      const sfToken = document.getElementById('salesforce-token');
      const sfBadge = document.getElementById('salesforce-badge');
      
      if (sfUrl) sfUrl.value = connections.salesforce.url || '';
      if (sfToken) sfToken.value = connections.salesforce.token || '';
      if (sfBadge && connections.salesforce.connected) {
        sfBadge.textContent = 'Connected';
        sfBadge.className = 'crm-status-badge connected';
      }
    }
    
    // HubSpot
    if (connections.hubspot) {
      const hsKey = document.getElementById('hubspot-key');
      const hsBadge = document.getElementById('hubspot-badge');
      
      if (hsKey) hsKey.value = connections.hubspot.key || '';
      if (hsBadge && connections.hubspot.connected) {
        hsBadge.textContent = 'Connected';
        hsBadge.className = 'crm-status-badge connected';
      }
    }
    
    // Dynamics 365
    if (connections.dynamics365) {
      const dynUrl = document.getElementById('dynamics-url');
      const dynClientId = document.getElementById('dynamics-client-id');
      const dynSecret = document.getElementById('dynamics-secret');
      const dynBadge = document.getElementById('dynamics-badge');
      
      if (dynUrl) dynUrl.value = connections.dynamics365.url || '';
      if (dynClientId) dynClientId.value = connections.dynamics365.clientId || '';
      if (dynSecret) dynSecret.value = connections.dynamics365.secret || '';
      if (dynBadge && connections.dynamics365.connected) {
        dynBadge.textContent = 'Connected';
        dynBadge.className = 'crm-status-badge connected';
      }
    }
    
    updateCRMStatus(connections);
  }
});

// Notification system
function showNotification(message, type = 'info') {
  const statusMessage = document.getElementById('status-message');
  const originalText = statusMessage.textContent;
  
  // Color mapping
  const colors = {
    success: 'var(--accent-green)',
    error: '#ef4444',
    info: 'var(--primary-blue)',
    warning: '#f59e0b'
  };
  
  statusMessage.textContent = message;
  statusMessage.style.color = colors[type] || colors.info;
  
  setTimeout(() => {
    statusMessage.textContent = originalText;
    statusMessage.style.color = '';
  }, 3000);
}

// Load stored data on popup open
chrome.storage.local.get(['stats', 'crmConnections'], (result) => {
  if (result.stats) {
    stats = result.stats;
    updateStats();
  }
  
  if (result.crmConnections) {
    updateCRMStatus(result.crmConnections);
  }
});

// History Management
let activityHistory = [];

// Load history from storage
chrome.storage.local.get(['activityHistory'], (result) => {
  if (result.activityHistory) {
    activityHistory = result.activityHistory;
    renderHistory();
  }
});

// Add activity to history
function addToHistory(type, details) {
  const activity = {
    id: Date.now(),
    type: type, // 'parse', 'fill', 'export'
    details: details,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString()
  };
  
  activityHistory.unshift(activity); // Add to beginning
  
  // Keep only last 100 activities
  if (activityHistory.length > 100) {
    activityHistory = activityHistory.slice(0, 100);
  }
  
  // Save to storage
  chrome.storage.local.set({ activityHistory }, () => {
    renderHistory();
  });
}

// Render history list
function renderHistory() {
  const historyList = document.getElementById('history-list');
  const filter = document.getElementById('history-filter')?.value || 'all';
  const period = document.getElementById('history-period')?.value || 'all';
  
  if (!historyList) return;
  
  // Filter activities
  let filtered = activityHistory;
  
  // Filter by type
  if (filter !== 'all') {
    filtered = filtered.filter(item => item.type === filter);
  }
  
  // Filter by period
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  if (period === 'today') {
    filtered = filtered.filter(item => new Date(item.timestamp) >= today);
  } else if (period === 'week') {
    filtered = filtered.filter(item => new Date(item.timestamp) >= weekAgo);
  } else if (period === 'month') {
    filtered = filtered.filter(item => new Date(item.timestamp) >= monthAgo);
  }
  
  if (filtered.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
        </svg>
        <p>No activities found</p>
        <small>Try changing the filter or period</small>
      </div>
    `;
    return;
  }
  
  // Render activities
  historyList.innerHTML = filtered.map(item => {
    const typeColors = {
      parse: { bg: '#EFF6FF', color: '#2563EB', label: 'Parse' },
      fill: { bg: '#ECFDF5', color: '#10B981', label: 'Fill' },
      export: { bg: '#F3F4F6', color: '#6B7280', label: 'Export' }
    };
    
    const style = typeColors[item.type] || typeColors.parse;
    
    return `
      <div style="background: white; border: 1px solid var(--gray-200); border-radius: 12px; padding: 12px 16px;">
        <div style="display: flex; align-items: start; gap: 12px;">
          <div style="flex-shrink: 0; width: 40px; height: 40px; background: ${style.bg}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: ${style.color};">
            ${item.type === 'parse' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/></svg>' : ''}
            ${item.type === 'fill' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>' : ''}
            ${item.type === 'export' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/></svg>' : ''}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-weight: 600; font-size: 13px; color: var(--gray-800);">${item.details.document || 'Document'}</span>
              <span style="display: inline-block; padding: 2px 8px; background: ${style.bg}; color: ${style.color}; border-radius: 10px; font-size: 10px; font-weight: 600;">
                ${style.label}
              </span>
            </div>
            <div style="font-size: 11px; color: var(--gray-500); margin-bottom: 4px;">
              ${item.details.description || 'No description'}
            </div>
            <div style="display: flex; align-items: center; gap: 12px; font-size: 10px; color: var(--gray-400);">
              <span>${item.date}</span>
              <span>•</span>
              <span>${item.time}</span>
              ${item.details.fields ? `<span>•</span><span>${item.details.fields} fields</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// History filter handlers
document.getElementById('history-filter')?.addEventListener('change', renderHistory);
document.getElementById('history-period')?.addEventListener('change', renderHistory);

// Export history
document.getElementById('export-history')?.addEventListener('click', () => {
  const filter = document.getElementById('history-filter')?.value || 'all';
  const period = document.getElementById('history-period')?.value || 'all';
  
  // Get filtered data
  let dataToExport = activityHistory;
  if (filter !== 'all') {
    dataToExport = dataToExport.filter(item => item.type === filter);
  }
  
  // Create CSV
  const csv = [
    ['Date', 'Time', 'Type', 'Document', 'Description', 'Fields'],
    ...dataToExport.map(item => [
      item.date,
      item.time,
      item.type,
      item.details.document || '',
      item.details.description || '',
      item.details.fields || ''
    ])
  ].map(row => row.join(',')).join('\n');
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cube-history-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('History exported successfully!', 'success');
  
  // Add to history
  addToHistory('export', {
    document: 'Activity History',
    description: `Exported ${dataToExport.length} activities to CSV`,
    format: 'CSV'
  });
});

// Clear history
document.getElementById('clear-history')?.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all activity history? This cannot be undone.')) {
    activityHistory = [];
    chrome.storage.local.set({ activityHistory: [] }, () => {
      renderHistory();
      showNotification('History cleared', 'info');
    });
  }
});

// Update CRM connection status
function updateCRMStatus(connections) {
  const crmItems = document.querySelectorAll('.crm-item');
  
  crmItems.forEach((item, index) => {
    const badge = item.querySelector('.crm-status-badge');
    const crmName = ['salesforce', 'hubspot', 'dynamics365'][index];
    
    if (connections && connections[crmName]) {
      badge.textContent = 'Connected';
      badge.className = 'crm-status-badge connected';
    } else {
      badge.textContent = 'Not Connected';
      badge.className = 'crm-status-badge disconnected';
    }
  });
}

// Listen for messages from content script and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Popup] Message received:', request);
  
  switch (request.action) {
    case 'updateStats':
      if (request.stats) {
        stats = { ...stats, ...request.stats };
        updateStats();
      }
      break;
      
    case 'connectionStatus':
      updateConnectionStatus(request.connected);
      break;
      
    case 'crmUpdate':
      if (request.connections) {
        updateCRMStatus(request.connections);
      }
      break;
      
    case 'voiceCommand':
      showNotification(`Voice: "${request.command}"`, 'info');
      break;
      
    case 'pdfsUpdated':
      // Background worker detected PDFs
      console.log('[Popup] PDFs updated from background:', request.count);
      if (request.pdfs) {
        stats.pdfs = request.count;
        updateStats();
        refreshPDFList(request.pdfs);
        showNotification(`Found ${request.count} document(s)`, 'success');
      }
      break;
  }
});

// Load PDFs from storage when popup opens
async function loadPDFsFromStorage() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) return;
    
    const tabId = tabs[0].id;
    console.log('[Popup] Loading PDFs for tab:', tabId);
    
    const result = await chrome.storage.local.get([`pdfs_${tabId}`]);
    const pdfs = result[`pdfs_${tabId}`];
    
    if (pdfs && pdfs.length > 0) {
      console.log('[Popup] Loaded PDFs from storage:', pdfs.length);
      stats.pdfs = pdfs.length;
      updateStats();
      refreshPDFList(pdfs);
      updateConnectionStatus(true, `${pdfs.length} doc(s) detected`);
    } else {
      console.log('[Popup] No PDFs in storage for this tab');
      refreshPDFList([]);
    }
  } catch (error) {
    console.error('[Popup] Error loading PDFs:', error);
  }
}

// ==================== DOWNLOAD FUNCTIONS ====================

// Download individual PDF
async function downloadPDFIndividual(pdf, index) {
  console.log('[Download] Starting download for PDF:', index, pdf);
  
  if (!pdf.url) {
    showNotification('Cannot download: No URL available', 'error');
    return;
  }
  
  const btn = document.querySelector(`.download-btn[data-pdf-index="${index}"]`);
  if (btn) {
    btn.classList.add('loading');
    btn.disabled = true;
  }
  
  try {
    // Verify URL is actually a PDF or can be downloaded
    let downloadUrl = pdf.url;
    
    // Transform Dropbox URLs to force direct download
    if (downloadUrl.includes('dropbox.com')) {
      console.log('[Download] Dropbox URL detected, transforming...', downloadUrl);
      
      // Add dl=1 and raw=1 parameters
      try {
        const urlObj = new URL(downloadUrl);
        urlObj.searchParams.set('dl', '1');
        urlObj.searchParams.set('raw', '1');
        downloadUrl = urlObj.toString();
        console.log('[Download] Transformed to:', downloadUrl);
      } catch (e) {
        console.warn('[Download] Failed to parse URL, using fallback:', e);
        const separator = downloadUrl.includes('?') ? '&' : '?';
        downloadUrl = `${downloadUrl}${separator}dl=1&raw=1`;
      }
    }
    
    // If URL is a blob or data URL, use it directly
    if (pdf.url.startsWith('blob:') || pdf.url.startsWith('data:')) {
      downloadUrl = pdf.url;
    }
    // If URL ends with .pdf, it's likely a direct PDF link
    else if (pdf.url.toLowerCase().includes('.pdf')) {
      downloadUrl = downloadUrl; // Already set above
    }
    // Otherwise, warn the user it might not be a PDF
    else {
      console.warn('[Download] URL may not be a PDF:', pdf.url);
      // Try to download anyway, but Chrome will handle the file type
    }
    
    console.log('[Download] Final download URL:', downloadUrl);
    
    const downloadId = await window.downloadManager.downloadPDF({
      ...pdf,
      url: downloadUrl
    });
    
    showNotification(`Downloading: ${pdf.filename || pdf.name || 'document.pdf'}`, 'success');
    
    // Update button state
    if (btn) {
      btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 5px;">
          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
        </svg>
        Downloading...
      `;
    }
    
    // Add to history
    addToHistory('download', {
      document: pdf.filename || pdf.name || pdf.title || `Document ${index + 1}`,
      description: 'PDF downloaded',
      url: pdf.url
    });
    
    // Auto-parse after successful download (if not already parsed)
    if (!pdfParseStatus[index]?.parsed) {
      console.log('[Download] Auto-parsing after download...');
      setTimeout(() => {
        parsePDF(pdf, index);
      }, 1000); // Wait 1 second for download to start
    }
    
  } catch (error) {
    console.error('[Download] Error:', error);
    showNotification(`Download failed: ${error.message}`, 'error');
  } finally {
    if (btn) {
      btn.classList.remove('loading');
      btn.disabled = false;
      // Reset button text after 2 seconds
      setTimeout(() => {
        if (btn) {
          btn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 5px;">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            Download
          `;
        }
      }, 2000);
    }
  }
}

// Download all PDFs
async function downloadAllPDFs() {
  const pdfs = getCurrentPDFs();
  
  if (!pdfs || pdfs.length === 0) {
    showNotification('No documents to download', 'warning');
    return;
  }
  
  const confirmed = confirm(`Download all ${pdfs.length} document(s)?`);
  if (!confirmed) return;
  
  showNotification(`Starting download of ${pdfs.length} document(s)...`, 'info');
  
  try {
    // Transform Dropbox URLs before downloading
    const transformedPdfs = pdfs.map(pdf => {
      let url = pdf.url;
      
      // Transform Dropbox URLs
      if (url.includes('dropbox.com')) {
        try {
          const urlObj = new URL(url);
          urlObj.searchParams.set('dl', '1');
          urlObj.searchParams.set('raw', '1');
          url = urlObj.toString();
          console.log('[Download All] Transformed Dropbox URL:', url);
        } catch (e) {
          const separator = url.includes('?') ? '&' : '?';
          url = `${url}${separator}dl=1&raw=1`;
        }
      }
      
      return { ...pdf, url };
    });
    
    const results = await window.downloadManager.downloadMultiple(transformedPdfs);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    if (failCount === 0) {
      showNotification(`Successfully started ${successCount} download(s)`, 'success');
    } else {
      showNotification(`Started ${successCount} download(s), ${failCount} failed`, 'warning');
    }
    
    // Add to history
    addToHistory('download-multiple', {
      document: `${successCount} documents`,
      description: 'Batch download completed',
      count: successCount
    });
    
  } catch (error) {
    console.error('[Download All] Error:', error);
    showNotification(`Batch download failed: ${error.message}`, 'error');
  }
}

// Setup download manager listeners
if (window.downloadManager) {
  window.downloadManager.addListener((event, downloadId, downloadInfo) => {
    console.log('[Download Manager Event]:', event, downloadId, downloadInfo);
    
    if (event === 'complete') {
      showNotification(`Download complete: ${downloadInfo.filename}`, 'success');
    } else if (event === 'error') {
      showNotification(`Download failed: ${downloadInfo.filename}`, 'error');
    }
  });
}

// ==================== END DOWNLOAD FUNCTIONS ====================

// Check connection on load and update page info
updatePageInfo();
loadPDFsFromStorage(); // Load any detected PDFs

// Re-check connection when tab changes
chrome.tabs.onActivated.addListener(() => {
  updatePageInfo();
  loadPDFsFromStorage(); // Reload PDFs for new tab
});

// Re-check when tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id === tabId) {
        updatePageInfo();
        loadPDFsFromStorage(); // Reload PDFs after page load
      }
    });
  }
});

// Footer links
document.getElementById('terms-link').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://cubeadvisors.io/terms' });
});

document.getElementById('privacy-link').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://cubeadvisors.io/privacy' });
});

// ═══════════════════════════════════════════════════════════════════════════
// FORMAT SELECTION HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

// Note: getSelectedFormats() is defined at top of file

// Handle "All Formats" checkbox
document.getElementById('format-all')?.addEventListener('change', (e) => {
  const allChecked = e.target.checked;
  const checkboxes = document.querySelectorAll('.format-checkbox:not(#format-all)');
  
  if (allChecked) {
    checkboxes.forEach(cb => {
      cb.checked = false;
      cb.disabled = true;
    });
  } else {
    checkboxes.forEach(cb => {
      cb.disabled = false;
    });
  }
});

// Uncheck "All" when individual format is checked
document.querySelectorAll('.format-checkbox:not(#format-all)').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      const allCheckbox = document.getElementById('format-all');
      if (allCheckbox.checked) {
        allCheckbox.checked = false;
        document.querySelectorAll('.format-checkbox:not(#format-all)').forEach(cb => {
          cb.disabled = false;
        });
      }
    }
  });
});

// Save format preferences
document.querySelectorAll('.format-checkbox').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    const formats = getSelectedFormats();
    chrome.storage.local.set({ preferredFormats: formats });
  });
});

// Load saved format preferences
chrome.storage.local.get(['preferredFormats'], (result) => {
  if (result.preferredFormats && result.preferredFormats.length > 0) {
    document.querySelectorAll('.format-checkbox').forEach(cb => {
      cb.checked = result.preferredFormats.includes(cb.value);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CHAT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

document.getElementById('chat-send-btn')?.addEventListener('click', async () => {
  await sendChatMessage();
});

document.getElementById('chat-input')?.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    await sendChatMessage();
  }
});

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Check if API is configured
  const settings = await chrome.storage.local.get(['aiConfig']);
  if (!settings.aiConfig || !settings.aiConfig.apiKey) {
    addChatMessage(
      '⚠️ Please configure your OpenAI API key first in Settings tab.',
      'assistant'
    );
    updateStatus('OpenAI API not configured', 'error');
    return;
  }
  
  // Add user message
  addChatMessage(message, 'user');
  input.value = '';
  
  // Show loading
  document.getElementById('chat-loading').style.display = 'flex';
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: settings.aiConfig.model || 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for CUBE OmniFill, a document processing and auto-fill extension. Help users with PDF extraction, form filling, and document management.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }
    
    const data = await response.json();
    const reply = data.choices[0].message.content;
    
    addChatMessage(reply, 'assistant');
    
  } catch (error) {
    console.error('Chat error:', error);
    addChatMessage(
      `❌ Error: ${error.message}. Please check your API key in Settings.`,
      'assistant'
    );
    updateStatus('Chat error: ' + error.message, 'error');
  } finally {
    document.getElementById('chat-loading').style.display = 'none';
  }
}

function addChatMessage(content, role) {
  const messagesDiv = document.getElementById('chat-messages');
  const messageEl = document.createElement('div');
  messageEl.className = `chat-message ${role}`;
  messageEl.textContent = content;
  messagesDiv.appendChild(messageEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTOFILL TAB HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

document.getElementById('detect-forms')?.addEventListener('click', async () => {
  const btn = document.getElementById('detect-forms');
  btn.classList.add('loading');
  btn.disabled = true;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'detect-forms' });
    
    if (response.success) {
      displayDetectedForms(response.forms);
      updateStatus(`Found ${response.forms.length} forms`, 'success');
    } else {
      updateStatus('Form detection failed: ' + response.error, 'error');
    }
  } catch (error) {
    updateStatus('Error: ' + error.message, 'error');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});

document.getElementById('upload-figure-zip')?.addEventListener('click', () => {
  document.getElementById('figure-zip-upload').click();
});

document.getElementById('figure-zip-upload')?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const statusEl = document.getElementById('figure-upload-status');
  statusEl.style.display = 'block';
  statusEl.innerHTML = '⏳ Processing ZIP bundle...';
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'upload-figure-zip',
      zipData: arrayBuffer
    });
    
    if (response.success) {
      statusEl.innerHTML = `
        ✅ ZIP processed successfully!<br>
        <small>
          Documents: ${response.result.metadata.documentsAnalyzed}<br>
          Required docs found: ${response.result.metadata.requiredDocsFound}<br>
          Fields ready: ${countFields(response.result)}
        </small>
      `;
      updateStatus('FIGURE ZIP processed', 'success');
    } else {
      statusEl.innerHTML = '❌ Processing failed: ' + response.error;
    }
  } catch (error) {
    statusEl.innerHTML = '❌ Error: ' + error.message;
  }
});

document.getElementById('run-ocr-page')?.addEventListener('click', async () => {
  const btn = document.getElementById('run-ocr-page');
  const language = document.getElementById('ocr-language').value;
  
  btn.classList.add('loading');
  btn.disabled = true;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'run-ocr',
      language: language
    });
    
    if (response.success) {
      displayOCRResults(response.results);
      updateStatus(response.results.summary, 'success');
    } else {
      updateStatus('OCR failed: ' + response.error, 'error');
    }
  } catch (error) {
    updateStatus('Error: ' + error.message, 'error');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});

document.getElementById('run-intelligent-autofill')?.addEventListener('click', async () => {
  const btn = document.getElementById('run-intelligent-autofill');
  const formType = document.getElementById('form-type-selector').value;
  
  btn.classList.add('loading');
  btn.disabled = true;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'run-intelligent-autofill',
      formType: formType
    });
    
    if (response.success) {
      displayAutoFillResults(response.results);
      updateStatus(`Filled ${response.results.filled}/${response.results.total} fields`, 'success');
    } else {
      updateStatus('AutoFill failed: ' + response.error, 'error');
    }
  } catch (error) {
    updateStatus('Error: ' + error.message, 'error');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});

// Helper functions for AutoFill tab
function displayDetectedForms(forms) {
  const list = document.getElementById('detected-forms-list');
  list.style.display = 'block';
  list.innerHTML = forms.map((form, i) => `
    <div style="padding: 10px; background: var(--gray-50); border-radius: 8px; margin-top: 8px;">
      <div style="font-weight: 600; font-size: 13px; color: var(--gray-800);">
        Form ${i + 1}: ${form.type}
      </div>
      <div style="font-size: 11px; color: var(--gray-500); margin-top: 4px;">
        ${form.fields} fields • ${Math.round(form.confidence * 100)}% confidence
      </div>
      <div style="font-size: 10px; color: var(--gray-400); margin-top: 4px;">
        Keywords: ${form.keywords.join(', ')}
      </div>
    </div>
  `).join('');
}

function displayOCRResults(results) {
  const el = document.getElementById('ocr-results');
  el.style.display = 'block';
  el.innerHTML = `
    <div style="padding: 10px; background: var(--gray-50); border-radius: 8px;">
      <div style="font-weight: 600; font-size: 13px; color: var(--gray-800); margin-bottom: 8px;">
        ${results.summary}
      </div>
      ${results.results.slice(0, 3).map(r => `
        <div style="font-size: 11px; color: var(--gray-600); margin-top: 4px; padding: 6px; background: white; border-radius: 4px;">
          <strong>${Math.round(r.confidence)}%:</strong> ${r.text.substring(0, 100)}...
        </div>
      `).join('')}
    </div>
  `;
}

function displayAutoFillResults(results) {
  const el = document.getElementById('autofill-results');
  el.style.display = 'block';
  el.innerHTML = `
    <div style="padding: 10px; background: var(--gray-50); border-radius: 8px;">
      <div style="font-weight: 600; font-size: 13px; color: var(--gray-800);">
        ✅ AutoFill Complete
      </div>
      <div style="font-size: 12px; color: var(--gray-600); margin-top: 4px;">
        Filled: ${results.filled}/${results.total} fields (${Math.round(results.confidence * 100)}% confidence)
      </div>
    </div>
  `;
}

function countFields(obj) {
  let count = 0;
  const traverse = (o) => {
    for (const v of Object.values(o)) {
      if (v && typeof v === 'object') traverse(v);
      else if (v !== null && v !== undefined) count++;
    }
  };
  traverse(obj);
  return count;
}

console.log('✅ CUBE OmniFill Enterprise v2.0 ready');
