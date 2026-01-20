// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 INLINE AUTOFILL MENU v1.0.0 - Enterprise-grade inline suggestions
// ═══════════════════════════════════════════════════════════════════════════════
//
// Features matching Bitwarden/1Password/Dashlane:
// ✅ Inline menu appears on field focus
// ✅ Shows matching credentials for current site
// ✅ Quick-fill with single click
// ✅ Create new credential option
// ✅ Keyboard navigation support
// ✅ Shadow DOM isolation
// ✅ Smart positioning (avoids viewport edges)
// ✅ Theme support (light/dark)
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  const MENU_ID = 'cube-inline-autofill-menu';
  const STORAGE_KEY = 'cubeInlineMenuSettings';

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  const CONFIG = {
    enabled: true,
    showOnFocus: true,
    showIconOnly: false, // Show icon in field, expand on click
    showCards: true,
    showIdentities: true,
    maxSuggestions: 5,
    animationDuration: 200,
    menuWidth: 320,
    menuMaxHeight: 400,
    zIndex: 2147483647,
    theme: 'auto' // 'light', 'dark', 'auto'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INLINE AUTOFILL MENU CLASS
  // ═══════════════════════════════════════════════════════════════════════════

  class InlineAutofillMenu {
    constructor() {
      this.config = { ...CONFIG };
      this.currentField = null;
      this.menuHost = null;
      this.shadowRoot = null;
      this.menuElement = null;
      this.isVisible = false;
      this.credentials = [];
      this.cards = [];
      this.identities = [];
      this.selectedIndex = -1;
      this.fieldIcons = new Map();
      
      this.initialize();
    }

    async initialize() {
      console.log('🎯 Inline Autofill Menu initializing...');
      
      // Load settings
      await this.loadSettings();
      
      // Create menu host with shadow DOM
      this.createMenuHost();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Load credentials for current site
      await this.loadCredentials();
      
      // Inject field icons
      this.injectFieldIcons();
      
      console.log('✅ Inline Autofill Menu ready');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════════════════════

    async loadSettings() {
      try {
        if (chrome?.storage?.local) {
          const result = await chrome.storage.local.get(STORAGE_KEY);
          if (result[STORAGE_KEY]) {
            this.config = { ...this.config, ...result[STORAGE_KEY] };
          }
        }
      } catch (error) {
        console.warn('Failed to load inline menu settings:', error);
      }
    }

    async saveSettings() {
      try {
        if (chrome?.storage?.local) {
          await chrome.storage.local.set({ [STORAGE_KEY]: this.config });
        }
      } catch (error) {
        console.warn('Failed to save inline menu settings:', error);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MENU HOST CREATION
    // ═══════════════════════════════════════════════════════════════════════════

    createMenuHost() {
      // Remove existing host if any
      const existing = document.getElementById(MENU_ID);
      if (existing) existing.remove();

      // Create host element
      this.menuHost = document.createElement('div');
      this.menuHost.id = MENU_ID;
      this.menuHost.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        overflow: visible;
        pointer-events: none;
        z-index: ${this.config.zIndex};
      `;

      // Attach shadow DOM
      this.shadowRoot = this.menuHost.attachShadow({ mode: 'closed' });
      
      // Inject styles and menu structure
      this.shadowRoot.innerHTML = this.getMenuHTML();
      
      // Cache menu element
      this.menuElement = this.shadowRoot.querySelector('.inline-menu');
      
      // Append to document
      document.documentElement.appendChild(this.menuHost);
    }

    getMenuHTML() {
      const isDark = this.isDarkTheme();
      
      return `
        <style>
          :host {
            all: initial;
          }
          
          *, *::before, *::after {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }

          .inline-menu {
            position: fixed;
            width: ${this.config.menuWidth}px;
            max-height: ${this.config.menuMaxHeight}px;
            background: ${isDark ? 'rgba(15, 15, 25, 0.98)' : 'rgba(255, 255, 255, 0.99)'};
            border: 1px solid ${isDark ? 'rgba(124, 58, 237, 0.3)' : 'rgba(124, 58, 237, 0.2)'};
            border-radius: 12px;
            box-shadow: 
              0 20px 40px rgba(0, 0, 0, ${isDark ? '0.4' : '0.15'}),
              0 0 0 1px ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
            backdrop-filter: blur(20px);
            overflow: hidden;
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
            transition: all ${this.config.animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
            display: none;
            color: ${isDark ? '#f8fafc' : '#0f172a'};
          }

          .inline-menu.visible {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
            display: block;
          }

          .menu-header {
            padding: 12px 16px;
            background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .menu-header-title {
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .menu-header-title::before {
            content: '🔐';
            font-size: 16px;
          }

          .menu-close {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s;
          }

          .menu-close:hover {
            background: rgba(255,255,255,0.3);
          }

          .menu-content {
            max-height: calc(${this.config.menuMaxHeight}px - 100px);
            overflow-y: auto;
          }

          .menu-content::-webkit-scrollbar {
            width: 6px;
          }

          .menu-content::-webkit-scrollbar-track {
            background: transparent;
          }

          .menu-content::-webkit-scrollbar-thumb {
            background: ${isDark ? 'rgba(124, 58, 237, 0.3)' : 'rgba(124, 58, 237, 0.2)'};
            border-radius: 3px;
          }

          .menu-section {
            padding: 8px 0;
          }

          .menu-section-title {
            padding: 6px 16px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: ${isDark ? '#a5b4fc' : '#6366f1'};
          }

          .credential-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 16px;
            cursor: pointer;
            transition: background 0.15s;
            border: none;
            background: transparent;
            width: 100%;
            text-align: left;
            color: inherit;
          }

          .credential-item:hover,
          .credential-item.selected {
            background: ${isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)'};
          }

          .credential-item:focus {
            outline: none;
            background: ${isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.12)'};
          }

          .credential-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            background: linear-gradient(135deg, ${isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)'}, ${isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)'});
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
          }

          .credential-icon img {
            width: 20px;
            height: 20px;
            border-radius: 4px;
          }

          .credential-info {
            flex: 1;
            min-width: 0;
          }

          .credential-name {
            font-size: 13px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .credential-username {
            font-size: 11px;
            color: ${isDark ? '#94a3b8' : '#64748b'};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .credential-fill-btn {
            padding: 6px 12px;
            border-radius: 6px;
            border: none;
            background: linear-gradient(135deg, #7c3aed, #6366f1);
            color: white;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.15s;
            flex-shrink: 0;
          }

          .credential-item:hover .credential-fill-btn,
          .credential-item.selected .credential-fill-btn {
            opacity: 1;
          }

          .credential-fill-btn:hover {
            filter: brightness(1.1);
          }

          .menu-footer {
            padding: 10px 16px;
            border-top: 1px solid ${isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)'};
            display: flex;
            gap: 8px;
          }

          .footer-btn {
            flex: 1;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid ${isDark ? 'rgba(124, 58, 237, 0.3)' : 'rgba(124, 58, 237, 0.2)'};
            background: ${isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)'};
            color: ${isDark ? '#a5b4fc' : '#6366f1'};
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }

          .footer-btn:hover {
            background: ${isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)'};
            border-color: ${isDark ? 'rgba(124, 58, 237, 0.5)' : 'rgba(124, 58, 237, 0.3)'};
          }

          .empty-state {
            padding: 24px 16px;
            text-align: center;
          }

          .empty-state-icon {
            font-size: 32px;
            margin-bottom: 8px;
          }

          .empty-state-text {
            font-size: 13px;
            color: ${isDark ? '#94a3b8' : '#64748b'};
            margin-bottom: 12px;
          }

          .empty-state-btn {
            padding: 8px 16px;
            border-radius: 8px;
            border: none;
            background: linear-gradient(135deg, #7c3aed, #6366f1);
            color: white;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
          }

          .empty-state-btn:hover {
            filter: brightness(1.1);
          }

          /* Field Icon Styles */
          .field-icon {
            position: absolute;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            background: linear-gradient(135deg, #7c3aed, #6366f1);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
            transition: transform 0.15s, box-shadow 0.15s;
            z-index: ${this.config.zIndex - 1};
          }

          .field-icon:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
          }

          .field-icon::after {
            content: '🔐';
            font-size: 12px;
          }

          @keyframes pulse {
            0%, 100% { box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3); }
            50% { box-shadow: 0 2px 16px rgba(124, 58, 237, 0.5); }
          }

          .field-icon.has-credentials {
            animation: pulse 2s ease-in-out infinite;
          }
        </style>

        <div class="inline-menu" role="listbox" aria-label="Autofill suggestions">
          <div class="menu-header">
            <span class="menu-header-title">CUBE Autofill</span>
            <button class="menu-close" aria-label="Close menu">✕</button>
          </div>
          <div class="menu-content">
            <div class="menu-section credentials-section">
              <div class="menu-section-title">Logins</div>
              <div class="credentials-list"></div>
            </div>
            <div class="menu-section cards-section" style="display: none;">
              <div class="menu-section-title">Cards</div>
              <div class="cards-list"></div>
            </div>
            <div class="menu-section identities-section" style="display: none;">
              <div class="menu-section-title">Identities</div>
              <div class="identities-list"></div>
            </div>
          </div>
          <div class="menu-footer">
            <button class="footer-btn" data-action="new">
              <span>➕</span> New Item
            </button>
            <button class="footer-btn" data-action="generator">
              <span>🔑</span> Generator
            </button>
          </div>
        </div>
      `;
    }

    isDarkTheme() {
      if (this.config.theme === 'dark') return true;
      if (this.config.theme === 'light') return false;
      
      // Auto-detect
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════════

    setupEventListeners() {
      // Focus events on input fields
      document.addEventListener('focusin', this.handleFocusIn.bind(this), true);
      document.addEventListener('focusout', this.handleFocusOut.bind(this), true);
      
      // Click outside to close
      document.addEventListener('click', this.handleDocumentClick.bind(this), true);
      
      // Keyboard navigation
      document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
      
      // Scroll to reposition
      window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
      window.addEventListener('resize', this.handleResize.bind(this), { passive: true });
      
      // Menu internal events
      this.setupMenuEvents();
      
      // Observe DOM changes for new fields
      this.observeDOMChanges();
    }

    setupMenuEvents() {
      if (!this.shadowRoot) return;

      // Close button
      const closeBtn = this.shadowRoot.querySelector('.menu-close');
      closeBtn?.addEventListener('click', () => this.hide());

      // Footer buttons
      const footerBtns = this.shadowRoot.querySelectorAll('.footer-btn');
      footerBtns.forEach(btn => {
        btn.addEventListener('click', (_e) => {
          const action = btn.dataset.action;
          this.handleFooterAction(action);
        });
      });
    }

    observeDOMChanges() {
      const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        
        for (const mutation of mutations) {
          if (mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'INPUT' || node.tagName === 'FORM' || 
                    node.querySelector?.('input, form')) {
                  shouldUpdate = true;
                  break;
                }
              }
            }
          }
        }
        
        if (shouldUpdate) {
          this.injectFieldIcons();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FIELD DETECTION & ICONS
    // ═══════════════════════════════════════════════════════════════════════════

    injectFieldIcons() {
      if (!this.config.enabled) return;

      // Find all fillable fields
      const fields = this.findFillableFields();
      
      fields.forEach(field => {
        if (!this.fieldIcons.has(field)) {
          this.createFieldIcon(field);
        }
      });
    }

    findFillableFields() {
      const selectors = [
        'input[type="text"]',
        'input[type="email"]',
        'input[type="password"]',
        'input[type="tel"]',
        'input[type="number"]',
        'input[type="url"]',
        'input:not([type])',
        'textarea'
      ].join(', ');

      const fields = document.querySelectorAll(selectors);
      
      return Array.from(fields).filter(field => {
        // Skip hidden fields
        if (field.type === 'hidden') return false;
        
        // Skip disabled/readonly
        if (field.disabled || field.readOnly) return false;
        
        // Check visibility
        const rect = field.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        
        const style = window.getComputedStyle(field);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        
        return true;
      });
    }

    createFieldIcon(field) {
      // Create icon element
      const icon = document.createElement('button');
      icon.className = 'cube-field-icon';
      icon.setAttribute('aria-label', 'Open CUBE Autofill');
      icon.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 4px;
        background: linear-gradient(135deg, #7c3aed, #6366f1);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
        z-index: ${this.config.zIndex - 1};
        transition: transform 0.15s, opacity 0.15s;
        opacity: 0;
        pointer-events: none;
      `;
      icon.innerHTML = '🔐';
      
      // Position icon
      this.positionFieldIcon(icon, field);
      
      // Add to document
      document.body.appendChild(icon);
      
      // Store reference
      this.fieldIcons.set(field, icon);
      
      // Show icon on field hover/focus
      field.addEventListener('mouseenter', () => this.showFieldIcon(field));
      field.addEventListener('mouseleave', () => this.hideFieldIcon(field));
      field.addEventListener('focus', () => this.showFieldIcon(field));
      field.addEventListener('blur', () => {
        setTimeout(() => this.hideFieldIcon(field), 200);
      });
      
      // Icon click opens menu
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.show(field);
      });
    }

    positionFieldIcon(icon, field) {
      const rect = field.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      
      // Position inside field, right side
      icon.style.top = `${rect.top + scrollY + (rect.height - 20) / 2}px`;
      icon.style.left = `${rect.right + scrollX - 28}px`;
    }

    showFieldIcon(field) {
      const icon = this.fieldIcons.get(field);
      if (icon) {
        this.positionFieldIcon(icon, field);
        icon.style.opacity = '1';
        icon.style.pointerEvents = 'auto';
        
        // Add pulse if credentials available
        if (this.credentials.length > 0) {
          icon.classList.add('has-credentials');
        }
      }
    }

    hideFieldIcon(field) {
      const icon = this.fieldIcons.get(field);
      if (icon && !this.isVisible) {
        icon.style.opacity = '0';
        icon.style.pointerEvents = 'none';
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CREDENTIALS LOADING
    // ═══════════════════════════════════════════════════════════════════════════

    async loadCredentials() {
      try {
        const hostname = window.location.hostname;
        
        // Request credentials from background service
        if (chrome?.runtime?.sendMessage) {
          const response = await chrome.runtime.sendMessage({
            action: 'getCredentialsForSite',
            hostname: hostname
          });
          
          if (response?.credentials) {
            this.credentials = response.credentials;
          }
          if (response?.cards) {
            this.cards = response.cards;
          }
          if (response?.identities) {
            this.identities = response.identities;
          }
        }
        
        console.log(`📋 Loaded ${this.credentials.length} credentials for ${hostname}`);
        
      } catch (error) {
        console.warn('Failed to load credentials:', error);
        this.credentials = [];
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MENU DISPLAY
    // ═══════════════════════════════════════════════════════════════════════════

    show(field) {
      if (!this.config.enabled || !this.menuElement) return;

      this.currentField = field;
      this.selectedIndex = -1;
      
      // Render credentials
      this.renderCredentials();
      
      // Position menu
      this.positionMenu(field);
      
      // Show menu
      this.menuElement.classList.add('visible');
      this.isVisible = true;
      
      // Focus first item
      this.focusItem(0);
    }

    hide() {
      if (!this.menuElement) return;

      this.menuElement.classList.remove('visible');
      this.isVisible = false;
      this.currentField = null;
      this.selectedIndex = -1;
    }

    positionMenu(field) {
      if (!this.menuElement) return;

      const fieldRect = field.getBoundingClientRect();
      const menuWidth = this.config.menuWidth;
      const menuHeight = Math.min(this.config.menuMaxHeight, 300); // Estimate
      
      let top = fieldRect.bottom + 4;
      let left = fieldRect.left;
      
      // Check if menu would go off right edge
      if (left + menuWidth > window.innerWidth - 16) {
        left = window.innerWidth - menuWidth - 16;
      }
      
      // Check if menu would go off bottom edge
      if (top + menuHeight > window.innerHeight - 16) {
        // Show above field instead
        top = fieldRect.top - menuHeight - 4;
      }
      
      // Ensure not off left edge
      if (left < 16) {
        left = 16;
      }
      
      // Ensure not off top edge
      if (top < 16) {
        top = 16;
      }
      
      this.menuElement.style.top = `${top}px`;
      this.menuElement.style.left = `${left}px`;
    }

    renderCredentials() {
      if (!this.shadowRoot) return;

      const credentialsList = this.shadowRoot.querySelector('.credentials-list');
      const cardsSection = this.shadowRoot.querySelector('.cards-section');
      const identitiesSection = this.shadowRoot.querySelector('.identities-section');
      
      // Clear existing
      credentialsList.innerHTML = '';
      
      if (this.credentials.length === 0) {
        // Show empty state
        credentialsList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-text">No saved logins for this site</div>
            <button class="empty-state-btn" data-action="new">Save New Login</button>
          </div>
        `;
        
        // Bind empty state button
        const btn = credentialsList.querySelector('.empty-state-btn');
        btn?.addEventListener('click', () => this.handleFooterAction('new'));
        
      } else {
        // Render credentials
        this.credentials.slice(0, this.config.maxSuggestions).forEach((cred, index) => {
          const item = this.createCredentialItem(cred, index);
          credentialsList.appendChild(item);
        });
      }
      
      // Show/hide cards section
      if (this.config.showCards && this.cards.length > 0) {
        cardsSection.style.display = 'block';
        const cardsList = cardsSection.querySelector('.cards-list');
        cardsList.innerHTML = '';
        this.cards.forEach((card, index) => {
          const item = this.createCardItem(card, index);
          cardsList.appendChild(item);
        });
      } else {
        cardsSection.style.display = 'none';
      }
      
      // Show/hide identities section
      if (this.config.showIdentities && this.identities.length > 0) {
        identitiesSection.style.display = 'block';
        const identitiesList = identitiesSection.querySelector('.identities-list');
        identitiesList.innerHTML = '';
        this.identities.forEach((identity, index) => {
          const item = this.createIdentityItem(identity, index);
          identitiesList.appendChild(item);
        });
      } else {
        identitiesSection.style.display = 'none';
      }
    }

    createCredentialItem(cred, index) {
      const item = document.createElement('button');
      item.className = 'credential-item';
      item.dataset.index = index;
      item.dataset.type = 'credential';
      item.setAttribute('role', 'option');
      
      const favicon = cred.favicon || this.getFaviconUrl(cred.url);
      
      item.innerHTML = `
        <div class="credential-icon">
          ${favicon ? `<img src="${favicon}" alt="" onerror="this.style.display='none'">` : '🔐'}
        </div>
        <div class="credential-info">
          <div class="credential-name">${this.escapeHtml(cred.name || cred.url || 'Login')}</div>
          <div class="credential-username">${this.escapeHtml(cred.username || cred.email || '')}</div>
        </div>
        <button class="credential-fill-btn">Fill</button>
      `;
      
      // Click to fill
      item.addEventListener('click', () => this.fillCredential(cred));
      
      return item;
    }

    createCardItem(card, index) {
      const item = document.createElement('button');
      item.className = 'credential-item';
      item.dataset.index = index;
      item.dataset.type = 'card';
      item.setAttribute('role', 'option');
      
      const lastFour = card.number?.slice(-4) || '****';
      
      item.innerHTML = `
        <div class="credential-icon">💳</div>
        <div class="credential-info">
          <div class="credential-name">${this.escapeHtml(card.name || 'Card')}</div>
          <div class="credential-username">•••• ${lastFour}</div>
        </div>
        <button class="credential-fill-btn">Fill</button>
      `;
      
      item.addEventListener('click', () => this.fillCard(card));
      
      return item;
    }

    createIdentityItem(identity, index) {
      const item = document.createElement('button');
      item.className = 'credential-item';
      item.dataset.index = index;
      item.dataset.type = 'identity';
      item.setAttribute('role', 'option');
      
      item.innerHTML = `
        <div class="credential-icon">👤</div>
        <div class="credential-info">
          <div class="credential-name">${this.escapeHtml(identity.name || 'Identity')}</div>
          <div class="credential-username">${this.escapeHtml(identity.email || '')}</div>
        </div>
        <button class="credential-fill-btn">Fill</button>
      `;
      
      item.addEventListener('click', () => this.fillIdentity(identity));
      
      return item;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTOFILL ACTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    async fillCredential(cred) {
      console.log('🎯 Filling credential:', cred.name);
      
      // Get form fields
      const form = this.currentField?.closest('form') || document;
      const usernameField = this.findUsernameField(form);
      const passwordField = this.findPasswordField(form);
      
      // Fill username
      if (usernameField && cred.username) {
        await this.fillField(usernameField, cred.username);
      }
      
      // Fill password
      if (passwordField && cred.password) {
        await this.fillField(passwordField, cred.password);
      }
      
      // Copy TOTP if available
      if (cred.totp) {
        const totpCode = this.generateTOTP(cred.totp);
        await navigator.clipboard?.writeText(totpCode);
        this.showNotification('TOTP copied to clipboard');
      }
      
      this.hide();
    }

    async fillCard(card) {
      console.log('💳 Filling card:', card.name);
      
      const form = this.currentField?.closest('form') || document;
      
      // Find card fields
      const numberField = form.querySelector('input[autocomplete*="cc-number"], input[name*="card"], input[name*="number"]');
      const expField = form.querySelector('input[autocomplete*="cc-exp"], input[name*="exp"]');
      const cvvField = form.querySelector('input[autocomplete*="cc-csc"], input[name*="cvv"], input[name*="cvc"]');
      const nameField = form.querySelector('input[autocomplete*="cc-name"], input[name*="holder"]');
      
      if (numberField && card.number) await this.fillField(numberField, card.number);
      if (expField && card.expiry) await this.fillField(expField, card.expiry);
      if (cvvField && card.cvv) await this.fillField(cvvField, card.cvv);
      if (nameField && card.holderName) await this.fillField(nameField, card.holderName);
      
      this.hide();
    }

    async fillIdentity(identity) {
      console.log('👤 Filling identity:', identity.name);
      
      const form = this.currentField?.closest('form') || document;
      
      // Map identity fields
      const fieldMappings = {
        'name': ['name', 'full-name', 'fullname'],
        'firstName': ['first-name', 'firstname', 'fname'],
        'lastName': ['last-name', 'lastname', 'lname'],
        'email': ['email', 'e-mail'],
        'phone': ['phone', 'tel', 'telephone'],
        'address': ['address', 'street'],
        'city': ['city'],
        'state': ['state', 'province'],
        'zip': ['zip', 'postal', 'postcode'],
        'country': ['country']
      };
      
      for (const [key, selectors] of Object.entries(fieldMappings)) {
        if (identity[key]) {
          for (const sel of selectors) {
            const field = form.querySelector(
              `input[autocomplete*="${sel}"], input[name*="${sel}"], input[id*="${sel}"]`
            );
            if (field) {
              await this.fillField(field, identity[key]);
              break;
            }
          }
        }
      }
      
      this.hide();
    }

    async fillField(field, value) {
      field.focus();
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }

    findUsernameField(form) {
      return form.querySelector(
        'input[type="email"], input[type="text"][autocomplete*="user"], ' +
        'input[type="text"][name*="user"], input[type="text"][name*="email"], ' +
        'input[type="text"][id*="user"], input[type="text"][id*="email"]'
      );
    }

    findPasswordField(form) {
      return form.querySelector('input[type="password"]');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    handleFocusIn(e) {
      const field = e.target;
      
      if (!this.isInputField(field)) return;
      if (!this.config.showOnFocus) return;
      
      // Delay to allow click events on menu
      setTimeout(() => {
        if (document.activeElement === field && !this.isVisible) {
          this.show(field);
        }
      }, 100);
    }

    handleFocusOut(_e) {
      // Don't hide if focusing within menu
      setTimeout(() => {
        if (!this.shadowRoot?.contains(document.activeElement) && 
            !this.isInputField(document.activeElement)) {
          this.hide();
        }
      }, 150);
    }

    handleDocumentClick(e) {
      if (!this.isVisible) return;
      
      // Check if click is outside menu
      const path = e.composedPath();
      if (!path.includes(this.menuHost) && !path.includes(this.currentField)) {
        this.hide();
      }
    }

    handleKeyDown(e) {
      if (!this.isVisible) {
        // Keyboard shortcut to open (Ctrl+Shift+L)
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
          e.preventDefault();
          const activeField = document.activeElement;
          if (this.isInputField(activeField)) {
            this.show(activeField);
          }
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          this.hide();
          this.currentField?.focus();
          break;
          
        case 'ArrowDown':
          e.preventDefault();
          this.focusNextItem();
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          this.focusPreviousItem();
          break;
          
        case 'Enter':
          e.preventDefault();
          this.selectCurrentItem();
          break;
          
        case 'Tab':
          this.hide();
          break;
      }
    }

    handleScroll() {
      if (this.isVisible && this.currentField) {
        this.positionMenu(this.currentField);
      }
    }

    handleResize() {
      if (this.isVisible && this.currentField) {
        this.positionMenu(this.currentField);
      }
    }

    handleFooterAction(action) {
      switch (action) {
        case 'new':
          this.openNewCredential();
          break;
        case 'generator':
          this.openPasswordGenerator();
          break;
      }
      this.hide();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // KEYBOARD NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════════

    focusItem(index) {
      if (!this.shadowRoot) return;
      
      const items = this.shadowRoot.querySelectorAll('.credential-item');
      if (items.length === 0) return;
      
      // Remove previous selection
      items.forEach(item => item.classList.remove('selected'));
      
      // Clamp index
      this.selectedIndex = Math.max(0, Math.min(index, items.length - 1));
      
      // Select new item
      const item = items[this.selectedIndex];
      if (item) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      }
    }

    focusNextItem() {
      this.focusItem(this.selectedIndex + 1);
    }

    focusPreviousItem() {
      this.focusItem(this.selectedIndex - 1);
    }

    selectCurrentItem() {
      if (!this.shadowRoot) return;
      
      const items = this.shadowRoot.querySelectorAll('.credential-item');
      const item = items[this.selectedIndex];
      
      if (item) {
        item.click();
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    isInputField(element) {
      if (!element) return false;
      const tagName = element.tagName?.toLowerCase();
      return tagName === 'input' || tagName === 'textarea';
    }

    getFaviconUrl(url) {
      try {
        const hostname = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
      } catch {
        return null;
      }
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text || '';
      return div.innerHTML;
    }

    generateTOTP(_secret) {
      // Simplified TOTP generation - in production use proper library
      // This is a placeholder - actual implementation would use crypto
      return '000000';
    }

    showNotification(message) {
      // Could use chrome.notifications or custom toast
      console.log('📢', message);
    }

    openNewCredential() {
      chrome.runtime?.sendMessage({ action: 'openVault', tab: 'new' });
    }

    openPasswordGenerator() {
      chrome.runtime?.sendMessage({ action: 'openGenerator' });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════════

    enable() {
      this.config.enabled = true;
      this.saveSettings();
      this.injectFieldIcons();
    }

    disable() {
      this.config.enabled = false;
      this.saveSettings();
      this.hide();
      
      // Remove all field icons
      this.fieldIcons.forEach(icon => icon.remove());
      this.fieldIcons.clear();
    }

    setTheme(theme) {
      this.config.theme = theme;
      this.saveSettings();
      this.createMenuHost(); // Recreate with new theme
    }

    refresh() {
      this.loadCredentials();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT & INITIALIZE
  // ═══════════════════════════════════════════════════════════════════════════

  window.InlineAutofillMenu = InlineAutofillMenu;
  window.cubeInlineAutofillMenu = new InlineAutofillMenu();

  console.log('🎯 Inline Autofill Menu loaded');

})(window);
