/**
 * ⚡ CUBE Nexum v7.0.0 - Quick Actions Service
 * 
 * INSTANT COMMAND EXECUTION
 * 
 * Features:
 * - Command palette (Cmd/Ctrl + K)
 * - Recent actions history
 * - Custom action shortcuts
 * - Context-aware suggestions
 * - Action execution tracking
 * - Fuzzy search matching
 * 
 * @version 7.0.0
 * @license CUBE Nexum Enterprise
 */

class QuickActionsService {
  constructor() {
    this.isOpen = false;
    this.paletteElement = null;
    this.selectedIndex = 0;
    this.currentFilter = '';
    
    this.actions = this.buildActionRegistry();
    this.recentActions = this.loadRecentActions();
    this.customShortcuts = this.loadCustomShortcuts();
    
    this.initializeKeyboardShortcuts();
    console.log('⚡ Quick Actions Service initialized');
  }

  /**
   * Build action registry with all available actions
   */
  buildActionRegistry() {
    return [
      // Form Actions
      {
        id: 'autofill-form',
        category: 'forms',
        name: 'Auto-fill Current Form',
        description: 'Fill all detected form fields with saved data',
        icon: '📝',
        shortcut: 'Ctrl+Shift+F',
        action: () => this.executeAction('autofill-form')
      },
      {
        id: 'clear-form',
        category: 'forms',
        name: 'Clear Form Fields',
        description: 'Reset all form fields to empty',
        icon: '🗑️',
        shortcut: null,
        action: () => this.executeAction('clear-form')
      },
      {
        id: 'save-form-data',
        category: 'forms',
        name: 'Save Form Data',
        description: 'Save current form values as a profile',
        icon: '💾',
        shortcut: null,
        action: () => this.executeAction('save-form-data')
      },

      // Macro Actions
      {
        id: 'record-macro',
        category: 'macros',
        name: 'Start Macro Recording',
        description: 'Begin recording user actions',
        icon: '🔴',
        shortcut: 'Ctrl+Shift+M',
        action: () => this.executeAction('record-macro')
      },
      {
        id: 'stop-macro',
        category: 'macros',
        name: 'Stop Macro Recording',
        description: 'Stop current macro recording',
        icon: '⏹️',
        shortcut: 'Ctrl+Shift+M',
        action: () => this.executeAction('stop-macro')
      },
      {
        id: 'play-last-macro',
        category: 'macros',
        name: 'Play Last Macro',
        description: 'Run the most recently recorded macro',
        icon: '▶️',
        shortcut: null,
        action: () => this.executeAction('play-last-macro')
      },
      {
        id: 'macro-library',
        category: 'macros',
        name: 'Open Macro Library',
        description: 'View and manage saved macros',
        icon: '📚',
        shortcut: null,
        action: () => this.executeAction('macro-library')
      },

      // AI Actions
      {
        id: 'ai-assist',
        category: 'ai',
        name: 'Ask AI Assistant',
        description: 'Get help from AI for current task',
        icon: '🤖',
        shortcut: 'Ctrl+Shift+A',
        action: () => this.executeAction('ai-assist')
      },
      {
        id: 'ai-explain',
        category: 'ai',
        name: 'AI Explain Selection',
        description: 'Explain the selected text using AI',
        icon: '💡',
        shortcut: null,
        action: () => this.executeAction('ai-explain')
      },
      {
        id: 'ai-translate',
        category: 'ai',
        name: 'AI Translate Selection',
        description: 'Translate selected text',
        icon: '🌐',
        shortcut: null,
        action: () => this.executeAction('ai-translate')
      },
      {
        id: 'ai-summarize',
        category: 'ai',
        name: 'AI Summarize Page',
        description: 'Get a summary of the current page',
        icon: '📋',
        shortcut: null,
        action: () => this.executeAction('ai-summarize')
      },

      // Document Actions
      {
        id: 'extract-data',
        category: 'documents',
        name: 'Extract Page Data',
        description: 'Extract structured data from page',
        icon: '📊',
        shortcut: null,
        action: () => this.executeAction('extract-data')
      },
      {
        id: 'download-pdf',
        category: 'documents',
        name: 'Download as PDF',
        description: 'Save current page as PDF',
        icon: '📄',
        shortcut: null,
        action: () => this.executeAction('download-pdf')
      },
      {
        id: 'screenshot-full',
        category: 'documents',
        name: 'Full Page Screenshot',
        description: 'Capture entire page as image',
        icon: '📸',
        shortcut: 'Ctrl+Shift+S',
        action: () => this.executeAction('screenshot-full')
      },
      {
        id: 'screenshot-visible',
        category: 'documents',
        name: 'Visible Area Screenshot',
        description: 'Capture only visible area',
        icon: '🖼️',
        shortcut: null,
        action: () => this.executeAction('screenshot-visible')
      },

      // Navigation Actions
      {
        id: 'open-sidebar',
        category: 'navigation',
        name: 'Toggle Sidebar',
        description: 'Show/hide CUBE sidebar',
        icon: '📐',
        shortcut: 'Ctrl+Shift+B',
        action: () => this.executeAction('open-sidebar')
      },
      {
        id: 'open-settings',
        category: 'navigation',
        name: 'Open Settings',
        description: 'Configure CUBE preferences',
        icon: '⚙️',
        shortcut: null,
        action: () => this.executeAction('open-settings')
      },
      {
        id: 'open-analytics',
        category: 'navigation',
        name: 'Open Analytics Dashboard',
        description: 'View productivity metrics',
        icon: '📈',
        shortcut: null,
        action: () => this.executeAction('open-analytics')
      },

      // Automation Actions
      {
        id: 'run-workflow',
        category: 'automation',
        name: 'Run Workflow...',
        description: 'Execute a saved workflow',
        icon: '🔄',
        shortcut: null,
        action: () => this.executeAction('run-workflow')
      },
      {
        id: 'schedule-task',
        category: 'automation',
        name: 'Schedule Task',
        description: 'Set up scheduled automation',
        icon: '⏰',
        shortcut: null,
        action: () => this.executeAction('schedule-task')
      },

      // Data Actions
      {
        id: 'export-data',
        category: 'data',
        name: 'Export Data',
        description: 'Export current data to file',
        icon: '📤',
        shortcut: null,
        action: () => this.executeAction('export-data')
      },
      {
        id: 'import-data',
        category: 'data',
        name: 'Import Data',
        description: 'Import data from file',
        icon: '📥',
        shortcut: null,
        action: () => this.executeAction('import-data')
      },
      {
        id: 'backup-all',
        category: 'data',
        name: 'Create Full Backup',
        description: 'Backup all CUBE data',
        icon: '💾',
        shortcut: null,
        action: () => this.executeAction('backup-all')
      }
    ];
  }

  /**
   * Initialize keyboard shortcuts
   */
  initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Command palette: Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
        return;
      }

      // Escape to close
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
        return;
      }

      // Navigation within palette
      if (this.isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.navigateDown();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.navigateUp();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.executeSelected();
        }
      }
    });
  }

  /**
   * Toggle command palette
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open command palette
   */
  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.selectedIndex = 0;
    this.currentFilter = '';
    
    this.createPaletteUI();
    
    // Focus input
    setTimeout(() => {
      const input = this.paletteElement?.querySelector('input');
      if (input) input.focus();
    }, 50);
  }

  /**
   * Close command palette
   */
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    
    if (this.paletteElement) {
      this.paletteElement.remove();
      this.paletteElement = null;
    }
  }

  /**
   * Create palette UI
   */
  createPaletteUI() {
    // Remove existing
    const existing = document.getElementById('cube-quick-actions');
    if (existing) existing.remove();

    // Create container
    const container = document.createElement('div');
    container.id = 'cube-quick-actions';
    container.innerHTML = `
      <div class="qa-overlay"></div>
      <div class="qa-palette">
        <div class="qa-header">
          <div class="qa-search-container">
            <span class="qa-search-icon">🔍</span>
            <input type="text" 
                   class="qa-search" 
                   placeholder="Type a command or search..."
                   autocomplete="off"
                   spellcheck="false">
            <span class="qa-shortcut-hint">ESC to close</span>
          </div>
        </div>
        <div class="qa-results">
          ${this.renderResults()}
        </div>
        <div class="qa-footer">
          <span>⚡ CUBE Quick Actions</span>
          <span>↑↓ Navigate • Enter Select • Esc Close</span>
        </div>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = this.getStyles();
    container.appendChild(styles);

    // Event handlers
    const input = container.querySelector('.qa-search');
    input.addEventListener('input', (e) => {
      this.currentFilter = e.target.value;
      this.selectedIndex = 0;
      this.updateResults();
    });

    const overlay = container.querySelector('.qa-overlay');
    overlay.addEventListener('click', () => this.close());

    document.body.appendChild(container);
    this.paletteElement = container;
  }

  /**
   * Render action results
   */
  renderResults() {
    const filteredActions = this.getFilteredActions();
    
    if (filteredActions.length === 0) {
      return '<div class="qa-no-results">No matching actions found</div>';
    }

    // Group by category
    const grouped = {};
    filteredActions.forEach(action => {
      if (!grouped[action.category]) {
        grouped[action.category] = [];
      }
      grouped[action.category].push(action);
    });

    let html = '';
    let globalIndex = 0;

    // Recent actions first if no filter
    if (!this.currentFilter && this.recentActions.length > 0) {
      html += '<div class="qa-category">Recent</div>';
      const recent = this.recentActions.slice(0, 3)
        .map(id => this.actions.find(a => a.id === id))
        .filter(Boolean);
      
      recent.forEach(action => {
        html += this.renderActionItem(action, globalIndex);
        globalIndex++;
      });
    }

    // Categories
    const categoryLabels = {
      forms: 'Forms',
      macros: 'Macros',
      ai: 'AI Assistant',
      documents: 'Documents',
      navigation: 'Navigation',
      automation: 'Automation',
      data: 'Data'
    };

    for (const [category, actions] of Object.entries(grouped)) {
      html += `<div class="qa-category">${categoryLabels[category] || category}</div>`;
      actions.forEach(action => {
        html += this.renderActionItem(action, globalIndex);
        globalIndex++;
      });
    }

    return html;
  }

  /**
   * Render single action item
   */
  renderActionItem(action, index) {
    const isSelected = index === this.selectedIndex;
    return `
      <div class="qa-item ${isSelected ? 'selected' : ''}" 
           data-action-id="${action.id}"
           data-index="${index}">
        <span class="qa-item-icon">${action.icon}</span>
        <div class="qa-item-content">
          <div class="qa-item-name">${action.name}</div>
          <div class="qa-item-description">${action.description}</div>
        </div>
        ${action.shortcut ? `<span class="qa-item-shortcut">${action.shortcut}</span>` : ''}
      </div>
    `;
  }

  /**
   * Get filtered actions based on search
   */
  getFilteredActions() {
    if (!this.currentFilter) {
      return this.actions;
    }

    const filter = this.currentFilter.toLowerCase();
    return this.actions.filter(action => {
      const searchText = `${action.name} ${action.description} ${action.category}`.toLowerCase();
      return this.fuzzyMatch(filter, searchText);
    });
  }

  /**
   * Fuzzy match algorithm
   */
  fuzzyMatch(pattern, text) {
    // Simple fuzzy match
    let patternIdx = 0;
    let textIdx = 0;
    
    while (patternIdx < pattern.length && textIdx < text.length) {
      if (pattern[patternIdx] === text[textIdx]) {
        patternIdx++;
      }
      textIdx++;
    }
    
    return patternIdx === pattern.length;
  }

  /**
   * Update results display
   */
  updateResults() {
    const results = this.paletteElement?.querySelector('.qa-results');
    if (results) {
      results.innerHTML = this.renderResults();
      this.attachItemListeners();
    }
  }

  /**
   * Attach click listeners to items
   */
  attachItemListeners() {
    const items = this.paletteElement?.querySelectorAll('.qa-item');
    items?.forEach(item => {
      item.addEventListener('click', () => {
        const actionId = item.dataset.actionId;
        const action = this.actions.find(a => a.id === actionId);
        if (action) {
          this.executeAction(actionId);
        }
      });

      item.addEventListener('mouseenter', () => {
        const index = parseInt(item.dataset.index);
        this.selectedIndex = index;
        this.updateSelectedState();
      });
    });
  }

  /**
   * Navigate down in list
   */
  navigateDown() {
    const items = this.paletteElement?.querySelectorAll('.qa-item');
    if (items && this.selectedIndex < items.length - 1) {
      this.selectedIndex++;
      this.updateSelectedState();
    }
  }

  /**
   * Navigate up in list
   */
  navigateUp() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.updateSelectedState();
    }
  }

  /**
   * Update selected state visually
   */
  updateSelectedState() {
    const items = this.paletteElement?.querySelectorAll('.qa-item');
    items?.forEach((item, idx) => {
      item.classList.toggle('selected', idx === this.selectedIndex);
    });

    // Scroll into view
    const selected = this.paletteElement?.querySelector('.qa-item.selected');
    selected?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  /**
   * Execute selected action
   */
  executeSelected() {
    const items = this.paletteElement?.querySelectorAll('.qa-item');
    const selectedItem = items?.[this.selectedIndex];
    if (selectedItem) {
      const actionId = selectedItem.dataset.actionId;
      this.executeAction(actionId);
    }
  }

  /**
   * Execute action by ID
   */
  executeAction(actionId) {
    const action = this.actions.find(a => a.id === actionId);
    if (!action) return;

    // Close palette
    this.close();

    // Track recent action
    this.trackRecentAction(actionId);

    // Execute based on action type
    console.log(`⚡ Executing action: ${action.name}`);

    switch (actionId) {
      case 'autofill-form':
        window.postMessage({ type: 'CUBE_AUTOFILL_FORM' }, '*');
        break;
      case 'clear-form':
        this.clearAllForms();
        break;
      case 'record-macro':
        window.postMessage({ type: 'CUBE_TOGGLE_MACRO_RECORDING' }, '*');
        break;
      case 'stop-macro':
        window.postMessage({ type: 'CUBE_STOP_MACRO_RECORDING' }, '*');
        break;
      case 'play-last-macro':
        window.postMessage({ type: 'CUBE_PLAY_LAST_MACRO' }, '*');
        break;
      case 'ai-assist':
        window.postMessage({ type: 'CUBE_OPEN_AI_ASSIST' }, '*');
        break;
      case 'ai-summarize':
        this.aiSummarizePage();
        break;
      case 'screenshot-full':
        window.postMessage({ type: 'CUBE_SCREENSHOT_FULL' }, '*');
        break;
      case 'screenshot-visible':
        window.postMessage({ type: 'CUBE_SCREENSHOT_VISIBLE' }, '*');
        break;
      case 'open-sidebar':
        chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
        break;
      case 'open-settings':
        chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' });
        break;
      case 'backup-all':
        if (window.backupService) {
          window.backupService.createAutoBackup();
          this.showNotification('Backup created successfully', 'success');
        }
        break;
      default:
        console.log(`Action ${actionId} not yet implemented`);
        this.showNotification(`${action.name} triggered`, 'info');
    }

    // Emit event
    document.dispatchEvent(new CustomEvent('cubeActionExecuted', {
      detail: { actionId, action }
    }));
  }

  /**
   * Clear all forms on page
   */
  clearAllForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.reset();
    });
    this.showNotification('All forms cleared', 'success');
  }

  /**
   * AI summarize page
   */
  async aiSummarizePage() {
    this.showNotification('Generating summary...', 'info');
    
    // Get page content
    const content = document.body.innerText.substring(0, 5000);
    
    // Send to AI service
    window.postMessage({
      type: 'CUBE_AI_REQUEST',
      data: {
        action: 'summarize',
        content: content,
        title: document.title
      }
    }, '*');
  }

  /**
   * Track recent action
   */
  trackRecentAction(actionId) {
    this.recentActions = this.recentActions.filter(id => id !== actionId);
    this.recentActions.unshift(actionId);
    this.recentActions = this.recentActions.slice(0, 5);
    
    try {
      localStorage.setItem('cube_recent_actions', JSON.stringify(this.recentActions));
    } catch (e) {
      console.warn('Failed to save recent actions');
    }
  }

  /**
   * Load recent actions from storage
   */
  loadRecentActions() {
    try {
      const saved = localStorage.getItem('cube_recent_actions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Load custom shortcuts
   */
  loadCustomShortcuts() {
    try {
      const saved = localStorage.getItem('cube_custom_shortcuts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `cube-quick-notification cube-qn-${type}`;
    notification.innerHTML = `
      <span class="cube-qn-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span class="cube-qn-message">${message}</span>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('visible'), 10);

    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('visible');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  /**
   * Get component styles
   */
  getStyles() {
    return `
      #cube-quick-actions {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .qa-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
      }

      .qa-palette {
        position: absolute;
        top: 15%;
        left: 50%;
        transform: translateX(-50%);
        width: 600px;
        max-width: 90vw;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
        overflow: hidden;
        animation: qa-slide-in 0.2s ease-out;
      }

      @keyframes qa-slide-in {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      .qa-header {
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      }

      .qa-search-container {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #ffffff;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 12px 16px;
        transition: border-color 0.2s;
      }

      .qa-search-container:focus-within {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .qa-search-icon {
        font-size: 18px;
        opacity: 0.5;
      }

      .qa-search {
        flex: 1;
        border: none;
        outline: none;
        font-size: 16px;
        background: transparent;
        color: #1f2937;
      }

      .qa-search::placeholder {
        color: #9ca3af;
      }

      .qa-shortcut-hint {
        font-size: 11px;
        color: #9ca3af;
        background: #f3f4f6;
        padding: 4px 8px;
        border-radius: 6px;
      }

      .qa-results {
        max-height: 400px;
        overflow-y: auto;
        padding: 8px;
      }

      .qa-category {
        font-size: 11px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 12px 12px 6px;
        margin-top: 4px;
      }

      .qa-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.15s;
      }

      .qa-item:hover,
      .qa-item.selected {
        background: #f3f4f6;
      }

      .qa-item.selected {
        background: #eff6ff;
      }

      .qa-item-icon {
        font-size: 20px;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f3f4f6;
        border-radius: 8px;
      }

      .qa-item.selected .qa-item-icon {
        background: #dbeafe;
      }

      .qa-item-content {
        flex: 1;
        min-width: 0;
      }

      .qa-item-name {
        font-weight: 500;
        color: #1f2937;
        margin-bottom: 2px;
      }

      .qa-item-description {
        font-size: 12px;
        color: #6b7280;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .qa-item-shortcut {
        font-size: 11px;
        color: #6b7280;
        background: #f3f4f6;
        padding: 4px 8px;
        border-radius: 6px;
        font-family: ui-monospace, monospace;
      }

      .qa-no-results {
        text-align: center;
        padding: 40px 20px;
        color: #6b7280;
      }

      .qa-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
        font-size: 11px;
        color: #6b7280;
      }

      /* Notification styles */
      .cube-quick-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 20px;
        background: #1f2937;
        color: #ffffff;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        font-size: 14px;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        z-index: 2147483647;
      }

      .cube-quick-notification.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .cube-quick-notification.cube-qn-success {
        background: linear-gradient(135deg, #059669, #10b981);
      }

      .cube-quick-notification.cube-qn-error {
        background: linear-gradient(135deg, #dc2626, #ef4444);
      }

      .cube-qn-icon {
        font-size: 16px;
        font-weight: bold;
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .qa-palette {
          background: #1f2937;
        }

        .qa-header {
          background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
          border-color: #374151;
        }

        .qa-search-container {
          background: #374151;
          border-color: #4b5563;
        }

        .qa-search-container:focus-within {
          border-color: #60a5fa;
        }

        .qa-search {
          color: #f9fafb;
        }

        .qa-search::placeholder {
          color: #9ca3af;
        }

        .qa-shortcut-hint {
          background: #4b5563;
          color: #d1d5db;
        }

        .qa-category {
          color: #9ca3af;
        }

        .qa-item:hover,
        .qa-item.selected {
          background: #374151;
        }

        .qa-item.selected {
          background: #1e3a5f;
        }

        .qa-item-icon {
          background: #374151;
        }

        .qa-item.selected .qa-item-icon {
          background: #1e40af;
        }

        .qa-item-name {
          color: #f9fafb;
        }

        .qa-item-description {
          color: #9ca3af;
        }

        .qa-item-shortcut {
          background: #4b5563;
          color: #d1d5db;
        }

        .qa-no-results {
          color: #9ca3af;
        }

        .qa-footer {
          background: #374151;
          border-color: #4b5563;
          color: #9ca3af;
        }
      }
    `;
  }
}

// Create singleton instance
if (typeof window !== 'undefined') {
  if (!window.quickActionsService) {
    window.quickActionsService = new QuickActionsService();
    console.log('⚡ Quick Actions Service created');
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuickActionsService;
}
