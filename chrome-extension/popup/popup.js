/**
 * Popup Interface Controller - LendingPad PDF Auditor
 * Provides an accessible, resilient UI for managing PDF automation flows.
 */

const ICON_PATHS = {
  document: 'M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z',
  history: 'M13 3C8.03 3 4 7.03 4 12H1L4.89 15.89L4.96 16.03L9 12H6C6 8.13 9.13 5 13 5C16.87 5 20 8.13 20 12C20 15.87 16.87 19 13 19C11.07 19 9.32 18.21 8.06 16.94L6.64 18.36C8.27 19.99 10.51 21 13 21C17.97 21 22 16.97 22 12C22 7.03 17.97 3 13 3Z'
};

const HISTORY_STATUS_LABELS = {
  success: 'Completed',
  error: 'Failed',
  warning: 'Warning',
  partial: 'Partial',
  pending: 'Pending',
  info: 'Info'
};

let currentTab = 'pdfs';
let detectedPDFs = [];
let history = [];
let settings = {};
let statusResetHandle = null;

document.addEventListener('DOMContentLoaded', () => {
  init().catch(error => {
    console.error('[Popup] Initialization error:', error);
    showStatus('Unable to initialize popup', 'error');
  });
});

async function init() {
  await loadSettings();
  setupEventListeners();
  await Promise.all([loadHistory(), refreshPDFs()]);
  initializeRangeInputs();
  console.log('[Popup] Ready');
}

function setupEventListeners() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', handleTabClick);
  });

  document.getElementById('detect-pdfs')?.addEventListener('click', detectPDFs);
  document.getElementById('refresh-pdfs')?.addEventListener('click', refreshPDFs);
  document.getElementById('process-all')?.addEventListener('click', processAll);

  document.getElementById('export-history')?.addEventListener('click', exportHistory);
  document.getElementById('clear-history')?.addEventListener('click', clearHistory);

  document.getElementById('save-settings')?.addEventListener('click', saveSettings);
  document.getElementById('reset-settings')?.addEventListener('click', resetSettings);

  document.getElementById('pdf-list')?.addEventListener('click', handlePdfListClick);
}

function handleTabClick(event) {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const tabName = target.dataset.tab;
  if (!tabName || tabName === currentTab) {
    return;
  }
  switchTab(tabName);
}

function switchTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.tab').forEach(tab => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
    tab.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  document.querySelectorAll('.tab-content').forEach(panel => {
    const isActive = panel.id === `${tabName}-panel`;
    panel.classList.toggle('active', isActive);
    panel.setAttribute('aria-hidden', String(!isActive));
    panel.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  if (tabName === 'history') {
    loadHistory();
  }
}

async function detectPDFs() {
  const detectButton = document.getElementById('detect-pdfs');
  const refreshButton = document.getElementById('refresh-pdfs');
  setBusyState([detectButton, refreshButton], true);

  try {
    showStatus('Detecting PDFs...', 'loading');
    const tab = await getActiveTab();

    if (!tab || !isLendingPadUrl(tab.url)) {
      detectedPDFs = [];
      renderPDFList();
      showStatus('Open a LendingPad loan page to continue', 'warning');
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectPDFs' });

    if (response?.success && Array.isArray(response.data)) {
      detectedPDFs = response.data;
      renderPDFList();
      const count = response.count ?? detectedPDFs.length;
      showStatus(`${count} PDFs detected`, count > 0 ? 'success' : 'info');
    } else {
      detectedPDFs = [];
      renderPDFList();
      showStatus('No PDFs found on this page', 'warning');
    }
  } catch (error) {
    handleDetectionError(error);
  } finally {
    setBusyState([detectButton, refreshButton], false);
  }
}

async function refreshPDFs() {
  await detectPDFs();
}

function handleDetectionError(error) {
  console.error('[Popup] detectPDFs error:', error);
  detectedPDFs = [];
  renderPDFList();

  const message = typeof error?.message === 'string' ? error.message : '';
  if (message.includes('Could not establish connection')) {
    showStatus('Please refresh the LendingPad tab and try again', 'warning');
    return;
  }
  showStatus('Error detecting PDFs', 'error');
}

function renderPDFList() {
  const container = document.getElementById('pdf-list');
  if (!container) {
    return;
  }

  container.textContent = '';

  if (detectedPDFs.length === 0) {
    renderEmptyState('pdf-list', {
      title: 'No PDFs detected',
      description: 'Navigate to a LendingPad loan and click “Detect PDFs”.',
      icon: ICON_PATHS.document
    });
    updateStats();
    return;
  }

  const fragment = document.createDocumentFragment();
  detectedPDFs.forEach((pdf, index) => {
    fragment.appendChild(createPdfCard(pdf, index));
  });
  container.appendChild(fragment);
  updateStats();
}

function createPdfCard(pdf, index) {
  const card = document.createElement('article');
  card.className = `pdf-card${pdf.parsed ? ' pdf-card--processed' : ''}`;
  card.dataset.index = String(index);
  card.setAttribute('role', 'listitem');

  const icon = document.createElement('div');
  icon.className = 'pdf-card__icon';
  icon.textContent = pdf.parsed ? '✅' : '📄';

  const info = document.createElement('div');
  info.className = 'pdf-card__info';

  const name = document.createElement('p');
  name.className = 'pdf-card__name';
  name.title = pdf.name || pdf.url || 'PDF document';
  name.textContent = pdf.name || extractFileName(pdf.url) || 'Untitled PDF';
  info.appendChild(name);

  const meta = document.createElement('div');
  meta.className = 'pdf-card__meta';
  const { typeClass, typeLabel } = normalizePdfType(pdf.type);
  const typeChip = document.createElement('span');
  typeChip.className = `pdf-type ${typeClass}`.trim();
  typeChip.textContent = typeLabel;
  meta.appendChild(typeChip);

  const status = pdf.parsed ? 'success' : 'pending';
  const statusPill = document.createElement('span');
  statusPill.className = `status-pill status-pill--${status}`;
  statusPill.textContent = pdf.parsed ? 'Processed' : 'Pending';
  meta.appendChild(statusPill);
  info.appendChild(meta);

  if (typeof pdf.confidence === 'number') {
    const confidence = document.createElement('div');
    confidence.className = 'pdf-card__confidence';
    confidence.textContent = `Confidence ${Math.round(pdf.confidence)}%`;
    info.appendChild(confidence);
  }

  if (typeof pdf.pages === 'number' || typeof pdf.size === 'number') {
    const metrics = document.createElement('div');
    metrics.className = 'pdf-card__metrics';
    if (typeof pdf.pages === 'number') {
      metrics.appendChild(createMetricChip('Pages', pdf.pages));
    }
    if (typeof pdf.size === 'number') {
      metrics.appendChild(createMetricChip('Size', formatFileSize(pdf.size)));
    }
    info.appendChild(metrics);
  }

  const actions = document.createElement('div');
  actions.className = 'pdf-actions';

  const primaryAction = document.createElement('button');
  primaryAction.type = 'button';
  primaryAction.className = pdf.parsed ? 'btn btn-secondary btn-small' : 'btn btn-primary btn-small';
  primaryAction.dataset.action = pdf.parsed ? 'autofill' : 'parse';
  primaryAction.textContent = pdf.parsed ? 'Autofill' : 'Parse';
  primaryAction.setAttribute('aria-label', `${primaryAction.textContent} ${name.textContent}`);
  actions.appendChild(primaryAction);

  const viewButton = document.createElement('button');
  viewButton.type = 'button';
  viewButton.className = 'icon-button';
  viewButton.dataset.action = 'view';
  viewButton.setAttribute('title', `Open ${name.textContent}`);
  viewButton.setAttribute('aria-label', `Open ${name.textContent} in a new tab`);
  viewButton.appendChild(createSvgElement('M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 11c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z'));
  actions.appendChild(viewButton);

  card.append(icon, info, actions);
  return card;
}

function createMetricChip(label, value) {
  const chip = document.createElement('span');
  chip.textContent = `${label}: ${value}`;
  return chip;
}

function normalizePdfType(rawType) {
  if (!rawType) {
    return { typeClass: 'pdf-type--other', typeLabel: 'Document' };
  }
  const normalized = rawType.toLowerCase();
  if (normalized.includes('appraisal')) {
    return { typeClass: 'pdf-type--appraisal', typeLabel: 'Appraisal' };
  }
  if (normalized.includes('closing')) {
    return { typeClass: 'pdf-type--closing-disclosure', typeLabel: 'Closing Disclosure' };
  }
  if (normalized.includes('demographic')) {
    return { typeClass: 'pdf-type--demographic', typeLabel: 'Demographic' };
  }
  return { typeClass: 'pdf-type--other', typeLabel: rawType };
}

function handlePdfListClick(event) {
  const actionButton = event.target instanceof HTMLElement ? event.target.closest('[data-action]') : null;
  if (!actionButton) {
    return;
  }
  const card = actionButton.closest('.pdf-card');
  if (!card) {
    return;
  }
  const index = Number(card.dataset.index);
  if (Number.isNaN(index)) {
    return;
  }

  const action = actionButton.dataset.action;
  if (action === 'parse') {
    parsePdfByIndex(index);
  } else if (action === 'autofill') {
    autofillPdf(index);
  } else if (action === 'view') {
    openPdf(index);
  }
}

function updateStats() {
  const total = detectedPDFs.length;
  const processed = detectedPDFs.filter(pdf => pdf.parsed).length;
  const pending = Math.max(total - processed, 0);

  setStatValue('total-pdfs', total, `${total} total PDFs detected`);
  setStatValue('processed-pdfs', processed, `${processed} PDFs processed`);
  setStatValue('pending-pdfs', pending, `${pending} PDFs pending`);
}

function setStatValue(elementId, value, label) {
  const element = document.getElementById(elementId);
  if (!element) {
    return;
  }
  element.textContent = String(value);
  element.setAttribute('aria-label', label);
}

async function parsePdfByIndex(index) {
  const pdf = detectedPDFs[index];
  if (!pdf) {
    return;
  }

  try {
    showStatus(`Parsing ${pdf.name || 'PDF'}...`, 'loading');
    const tab = await getActiveTab();
    if (!tab) {
      showStatus('Active tab not available', 'error');
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'parsePDF',
      pdfUrl: pdf.url
    });

    if (response?.success) {
      pdf.parsed = true;
      pdf.data = response.data;
      renderPDFList();
      showStatus(`${pdf.name || 'PDF'} processed successfully`, 'success');
    } else {
      showStatus(response?.error ? `Error: ${response.error}` : 'Unable to process PDF', 'error');
    }
  } catch (error) {
    console.error('[Popup] parsePdfByIndex error:', error);
    showStatus('Error processing PDF', 'error');
  }
}

async function autofillPdf(index) {
  const pdf = detectedPDFs[index];
  if (!pdf?.parsed || !pdf.data) {
    showStatus('Parse the PDF before autofilling', 'warning');
    return;
  }

  try {
    showStatus(`Auto-filling with ${pdf.name || 'PDF'}...`, 'loading');
    const tab = await getActiveTab();
    if (!tab) {
      showStatus('Active tab not available', 'error');
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'autofillForm',
      data: pdf.data
    });

    if (response?.success) {
      showStatus('Form completed successfully', 'success');
    } else {
      showStatus(response?.error ? `Error: ${response.error}` : 'Unable to autofill form', 'error');
    }
  } catch (error) {
    console.error('[Popup] autofillPdf error:', error);
    showStatus('Error auto-filling form', 'error');
  }
}

function openPdf(index) {
  const pdf = detectedPDFs[index];
  if (!pdf?.url) {
    showStatus('PDF URL missing', 'error');
    return;
  }
  chrome.tabs.create({ url: pdf.url });
}

async function processAll() {
  const processButton = document.getElementById('process-all');
  if (!detectedPDFs.length) {
    showStatus('Detect PDFs before processing', 'warning');
    return;
  }

  setBusyState([processButton], true);

  try {
    showStatus('Processing all PDFs...', 'loading');
    const tab = await getActiveTab();
    if (!tab) {
      showStatus('Active tab not available', 'error');
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'processAll' });
    if (response?.success) {
      await refreshPDFs();
      showStatus(`${response.processed ?? 0} PDFs processed`, 'success');
    } else {
      showStatus('Error processing PDFs', 'error');
    }
  } catch (error) {
    console.error('[Popup] processAll error:', error);
    showStatus('Error processing PDFs', 'error');
  } finally {
    setBusyState([processButton], false);
  }
}

async function loadHistory() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getHistory' });
    if (response?.success && Array.isArray(response.data)) {
      history = response.data;
      renderHistory();
    } else {
      showStatus('Unable to load history', 'warning');
    }
  } catch (error) {
    console.error('[Popup] loadHistory error:', error);
    showStatus('History unavailable', 'error');
  }
}

function renderHistory() {
  const container = document.getElementById('history-list');
  if (!container) {
    return;
  }

  container.textContent = '';

  if (!history.length) {
    renderEmptyState('history-list', {
      title: 'No history yet',
      description: 'Operations will appear here after you process PDFs.',
      icon: ICON_PATHS.history
    });
    return;
  }

  const fragment = document.createDocumentFragment();
  history.slice(0, 50).forEach(entry => {
    fragment.appendChild(createHistoryCard(entry));
  });
  container.appendChild(fragment);
}

function createHistoryCard(entry) {
  const labelKey = normalizeHistoryStatusKey(entry.status);
  const borderStatus = normalizeHistoryBorderStatus(labelKey);
  const card = document.createElement('article');
  card.className = `history-item history-item--${borderStatus}`;
  card.setAttribute('role', 'listitem');

  const header = document.createElement('div');
  header.className = 'history-header';

  const name = document.createElement('p');
  name.className = 'history-filename';
  name.textContent = entry.filename || 'Unnamed PDF';
  header.appendChild(name);

  const pillVariant = getStatusPillVariant(labelKey);
  const statusPill = document.createElement('span');
  statusPill.className = `status-pill status-pill--${pillVariant}`;
  statusPill.textContent = HISTORY_STATUS_LABELS[labelKey] || HISTORY_STATUS_LABELS.info;
  header.appendChild(statusPill);

  const meta = document.createElement('div');
  meta.className = 'history-meta';
  meta.appendChild(createMetaChip('Action', entry.action || '—'));
  meta.appendChild(createMetaChip('Time', formatDate(entry.timestamp)));
  if (typeof entry.duration === 'number') {
    meta.appendChild(createMetaChip('Duration', `${entry.duration} ms`));
  }

  card.append(header, meta);

  if (entry.message || entry.details) {
    const notes = document.createElement('p');
    notes.className = 'history-notes';
    notes.textContent = entry.message || entry.details;
    card.appendChild(notes);
  }

  return card;
}

function createMetaChip(label, value) {
  const span = document.createElement('span');
  const strong = document.createElement('strong');
  strong.textContent = `${label}:`;
  span.append(strong, document.createTextNode(` ${value}`));
  return span;
}

function normalizeHistoryStatusKey(status) {
  const key = typeof status === 'string' ? status.toLowerCase() : 'info';
  return HISTORY_STATUS_LABELS[key] ? key : 'info';
}

function normalizeHistoryBorderStatus(status) {
  switch (status) {
    case 'success':
    case 'error':
    case 'warning':
    case 'partial':
      return status;
    case 'pending':
      return 'warning';
    default:
      return 'info';
  }
}

function getStatusPillVariant(status) {
  switch (status) {
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'warning':
    case 'partial':
    case 'pending':
      return 'pending';
    default:
      return 'info';
  }
}

function formatDate(timestamp) {
  if (!timestamp) {
    return '—';
  }
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function exportHistory() {
  if (!history.length) {
    showStatus('Nothing to export yet', 'warning');
    return;
  }

  try {
    showStatus('Exporting history...', 'loading');
    await chrome.runtime.sendMessage({ action: 'exportHistory', format: 'csv' });
    showStatus('History exported', 'success');
  } catch (error) {
    console.error('[Popup] exportHistory error:', error);
    showStatus('Error exporting history', 'error');
  }
}

async function clearHistory() {
  if (!history.length) {
    showStatus('History is already empty', 'info');
    return;
  }

  if (!confirm('Clear all history entries? This cannot be undone.')) {
    return;
  }

  try {
    await chrome.runtime.sendMessage({ action: 'clearHistory' });
    history = [];
    renderHistory();
    showStatus('History cleared', 'success');
  } catch (error) {
    console.error('[Popup] clearHistory error:', error);
    showStatus('Error clearing history', 'error');
  }
}

async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    settings = response?.success ? response.data ?? getDefaultSettings() : getDefaultSettings();
  } catch (error) {
    console.error('[Popup] loadSettings error:', error);
    settings = getDefaultSettings();
  }

  applySettings();
}

function getDefaultSettings() {
  return {
    autoDetect: true,
    notifications: true,
    autoParse: false,
    confidenceThreshold: 75,
    retryAttempts: 3
  };
}

function applySettings() {
  const autoDetect = document.getElementById('auto-detect');
  const notifications = document.getElementById('notifications');
  const autoParse = document.getElementById('auto-parse');
  const confidenceThreshold = document.getElementById('confidence-threshold');
  const retryAttempts = document.getElementById('retry-attempts');

  if (autoDetect) autoDetect.checked = settings.autoDetect !== false;
  if (notifications) notifications.checked = settings.notifications !== false;
  if (autoParse) autoParse.checked = settings.autoParse === true;
  if (confidenceThreshold) confidenceThreshold.value = String(settings.confidenceThreshold ?? 75);
  if (retryAttempts) retryAttempts.value = String(settings.retryAttempts ?? 3);

  initializeRangeInputs();
}

function initializeRangeInputs() {
  const ranges = document.querySelectorAll('input[type="range"]');
  ranges.forEach(range => {
    if (!range.dataset.initialized) {
      range.addEventListener('input', handleRangeInput);
      range.dataset.initialized = 'true';
    }
    updateRangeDisplay(range);
  });
}

function handleRangeInput(event) {
  if (!(event.target instanceof HTMLInputElement)) {
    return;
  }
  updateRangeDisplay(event.target);
}

function updateRangeDisplay(rangeElement) {
  updateRangeValue(rangeElement);
  updateRangeBackground(rangeElement);
}

function updateRangeValue(rangeElement) {
  const labelId = rangeElement.getAttribute('aria-describedby');
  const display = labelId ? document.getElementById(labelId) : rangeElement.parentElement?.querySelector('.range-value');
  if (!display) {
    return;
  }
  const value = Number(rangeElement.value);
  display.textContent = rangeElement.id === 'confidence-threshold' ? `${value}%` : String(value);
}

function updateRangeBackground(rangeElement) {
  const min = Number(rangeElement.min || 0);
  const max = Number(rangeElement.max || 100);
  const value = Number(rangeElement.value || 0);
  const denominator = max - min || 1;
  const percentage = ((value - min) / denominator) * 100;
  rangeElement.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percentage}%, var(--divider) ${percentage}%, var(--divider) 100%)`;
}

async function saveSettings() {
  try {
    const autoDetect = document.getElementById('auto-detect');
    const notifications = document.getElementById('notifications');
    const autoParse = document.getElementById('auto-parse');
    const confidenceThreshold = document.getElementById('confidence-threshold');
    const retryAttempts = document.getElementById('retry-attempts');

    settings = {
      autoDetect: autoDetect ? autoDetect.checked : true,
      notifications: notifications ? notifications.checked : true,
      autoParse: autoParse ? autoParse.checked : false,
      confidenceThreshold: confidenceThreshold ? Number(confidenceThreshold.value) : 75,
      retryAttempts: retryAttempts ? Number(retryAttempts.value) : 3
    };

    const response = await chrome.runtime.sendMessage({ action: 'saveSettings', settings });
    if (response?.success) {
      showStatus('Settings saved successfully', 'success');
    } else {
      showStatus('Error saving settings', 'error');
    }
  } catch (error) {
    console.error('[Popup] saveSettings error:', error);
    showStatus('Error saving settings', 'error');
  }
}

async function resetSettings() {
  if (!confirm('Reset all settings to default values?')) {
    return;
  }

  settings = getDefaultSettings();

  try {
    const response = await chrome.runtime.sendMessage({ action: 'saveSettings', settings });
    if (response?.success) {
      applySettings();
      showStatus('Settings reset to defaults', 'success');
    } else {
      showStatus('Error resetting settings', 'error');
    }
  } catch (error) {
    console.error('[Popup] resetSettings error:', error);
    showStatus('Error resetting settings', 'error');
  }
}

function showStatus(message, type = 'info') {
  const statusMessage = document.getElementById('status-message');
  const statusIndicator = document.getElementById('status-indicator');

  if (statusResetHandle) {
    window.clearTimeout(statusResetHandle);
  }

  if (statusMessage) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
  }

  if (statusIndicator) {
    statusIndicator.className = `status-indicator status-${type}`;
  }

  if (type !== 'loading') {
    statusResetHandle = window.setTimeout(() => {
      if (statusMessage) {
        statusMessage.textContent = 'Ready';
        statusMessage.className = 'status-message';
      }
      if (statusIndicator) {
        statusIndicator.className = 'status-indicator status-ready';
      }
    }, 4000);
  }
}

function renderEmptyState(containerId, { title, description, icon }) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  container.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'empty-state';

  const svg = createSvgElement(icon ?? ICON_PATHS.document, 48, true);
  wrapper.appendChild(svg);

  const titleElement = document.createElement('p');
  titleElement.className = 'empty-title';
  titleElement.textContent = title;
  wrapper.appendChild(titleElement);

  const descriptionElement = document.createElement('p');
  descriptionElement.className = 'empty-description';
  descriptionElement.textContent = description;
  wrapper.appendChild(descriptionElement);

  container.appendChild(wrapper);
}

function createSvgElement(path, size = 20, muted = false) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');
  if (muted) {
    svg.setAttribute('opacity', '0.3');
  }
  const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathElement.setAttribute('d', path);
  svg.appendChild(pathElement);
  return svg;
}

function setBusyState(buttons, isBusy) {
  if (!Array.isArray(buttons)) {
    return;
  }
  buttons.filter(Boolean).forEach(button => {
    button.disabled = isBusy;
    if (isBusy) {
      button.setAttribute('aria-busy', 'true');
    } else {
      button.removeAttribute('aria-busy');
    }
  });
}

function extractFileName(url) {
  if (!url) {
    return '';
  }
  try {
    const parsed = new URL(url);
    return decodeURIComponent(parsed.pathname.split('/').pop() || '');
  } catch (error) {
    return '';
  }
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return '—';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function isLendingPadUrl(url) {
  return typeof url === 'string' && /lendingpad\.com/i.test(url);
}

console.log('[Popup] Script loaded');
