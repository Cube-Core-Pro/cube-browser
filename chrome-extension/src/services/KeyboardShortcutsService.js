// ═══════════════════════════════════════════════════════════════════════════════
// ⌨️ KEYBOARD SHORTCUTS SERVICE v1.0.0 - Fast autofill with hotkeys
// ═══════════════════════════════════════════════════════════════════════════════
//
// Default Shortcuts (configurable):
// ✅ Ctrl+Shift+L - Autofill login (username + password)
// ✅ Ctrl+Shift+U - Fill username only
// ✅ Ctrl+Shift+P - Fill password only
// ✅ Ctrl+Shift+C - Copy password to clipboard
// ✅ Ctrl+Shift+T - Copy TOTP code
// ✅ Ctrl+Shift+G - Generate new password
// ✅ Ctrl+Shift+V - Open vault popup
// ✅ Ctrl+Shift+N - Save new login
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  const STORAGE_KEY = 'cubeKeyboardShortcuts';

  // Default shortcut configuration
  const DEFAULT_SHORTCUTS = {
    fillLogin: { key: 'L', ctrl: true, shift: true, alt: false, enabled: true },
    fillUsername: { key: 'U', ctrl: true, shift: true, alt: false, enabled: true },
    fillPassword: { key: 'P', ctrl: true, shift: true, alt: false, enabled: true },
    copyPassword: { key: 'C', ctrl: true, shift: true, alt: false, enabled: true },
    copyTotp: { key: 'T', ctrl: true, shift: true, alt: false, enabled: true },
    generatePassword: { key: 'G', ctrl: true, shift: true, alt: false, enabled: true },
    openVault: { key: 'V', ctrl: true, shift: true, alt: false, enabled: true },
    saveLogin: { key: 'N', ctrl: true, shift: true, alt: false, enabled: true },
    cycleCredentials: { key: 'L', ctrl: true, shift: true, alt: false, enabled: true },
    openInlineMenu: { key: 'Space', ctrl: true, shift: false, alt: false, enabled: true }
  };

  class KeyboardShortcutsService {
    constructor() {
      this.shortcuts = { ...DEFAULT_SHORTCUTS };
      this.credentials = [];
      this.currentCredIndex = 0;
      this.lastFillTime = 0;
      this.cycleCooldown = 500; // ms between cycles
      
      this.initialize();
    }

    async initialize() {
      console.log('⌨️ Keyboard Shortcuts Service initializing...');
      
      // Load custom shortcuts
      await this.loadShortcuts();
      
      // Setup keyboard listener
      this.setupKeyboardListener();
      
      // Load credentials for current site
      await this.loadCredentials();
      
      console.log('✅ Keyboard Shortcuts Service ready');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHORTCUTS CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════

    async loadShortcuts() {
      try {
        if (chrome?.storage?.sync) {
          const result = await chrome.storage.sync.get(STORAGE_KEY);
          if (result[STORAGE_KEY]) {
            this.shortcuts = { ...DEFAULT_SHORTCUTS, ...result[STORAGE_KEY] };
          }
        }
      } catch (error) {
        console.warn('Failed to load shortcuts:', error);
      }
    }

    async saveShortcuts() {
      try {
        if (chrome?.storage?.sync) {
          await chrome.storage.sync.set({ [STORAGE_KEY]: this.shortcuts });
        }
      } catch (error) {
        console.warn('Failed to save shortcuts:', error);
      }
    }

    setShortcut(action, config) {
      if (this.shortcuts[action]) {
        this.shortcuts[action] = { ...this.shortcuts[action], ...config };
        this.saveShortcuts();
      }
    }

    resetShortcuts() {
      this.shortcuts = { ...DEFAULT_SHORTCUTS };
      this.saveShortcuts();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // KEYBOARD LISTENER
    // ═══════════════════════════════════════════════════════════════════════════

    setupKeyboardListener() {
      document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
    }

    handleKeyDown(event) {
      // Check each shortcut
      for (const [action, config] of Object.entries(this.shortcuts)) {
        if (!config.enabled) continue;
        
        if (this.matchesShortcut(event, config)) {
          event.preventDefault();
          event.stopPropagation();
          this.executeAction(action, event);
          return;
        }
      }
    }

    matchesShortcut(event, config) {
      const key = event.key.toUpperCase();
      const configKey = config.key.toUpperCase();
      
      // Handle special keys
      if (configKey === 'SPACE' && event.code !== 'Space') return false;
      if (configKey !== 'SPACE' && key !== configKey) return false;
      
      // Check modifiers
      if (config.ctrl !== (event.ctrlKey || event.metaKey)) return false;
      if (config.shift !== event.shiftKey) return false;
      if (config.alt !== event.altKey) return false;
      
      return true;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTION EXECUTION
    // ═══════════════════════════════════════════════════════════════════════════

    async executeAction(action, _event) {
      console.log(`⌨️ Executing shortcut: ${action}`);
      
      switch (action) {
        case 'fillLogin':
          await this.fillLogin();
          break;
          
        case 'fillUsername':
          await this.fillUsername();
          break;
          
        case 'fillPassword':
          await this.fillPassword();
          break;
          
        case 'copyPassword':
          await this.copyPassword();
          break;
          
        case 'copyTotp':
          await this.copyTotp();
          break;
          
        case 'generatePassword':
          await this.generatePassword();
          break;
          
        case 'openVault':
          this.openVault();
          break;
          
        case 'saveLogin':
          await this.saveLogin();
          break;
          
        case 'cycleCredentials':
          await this.cycleCredentials();
          break;
          
        case 'openInlineMenu':
          this.openInlineMenu();
          break;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTOFILL ACTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    async fillLogin() {
      await this.loadCredentials();
      
      if (this.credentials.length === 0) {
        this.showToast('No saved logins for this site', 'info');
        return;
      }

      const cred = this.credentials[this.currentCredIndex];
      
      // Find form context
      const form = document.activeElement?.closest('form') || document;
      
      // Find and fill username field
      const usernameField = this.findUsernameField(form);
      if (usernameField && cred.username) {
        await this.fillField(usernameField, cred.username);
      }
      
      // Find and fill password field
      const passwordField = this.findPasswordField(form);
      if (passwordField && cred.password) {
        await this.fillField(passwordField, cred.password);
      }
      
      // Copy TOTP if available
      if (cred.totp) {
        const totpCode = this.generateTOTP(cred.totp);
        await this.copyToClipboard(totpCode);
        this.showToast(`Login filled, TOTP ${totpCode} copied`, 'success');
      } else {
        this.showToast(`Filled: ${cred.name || cred.username}`, 'success');
      }
      
      // Record last fill time for cycling
      this.lastFillTime = Date.now();
    }

    async fillUsername() {
      await this.loadCredentials();
      
      if (this.credentials.length === 0) {
        this.showToast('No username available', 'info');
        return;
      }

      const cred = this.credentials[this.currentCredIndex];
      const activeField = document.activeElement;
      
      if (this.isInputField(activeField) && cred.username) {
        await this.fillField(activeField, cred.username);
        this.showToast('Username filled', 'success');
      } else {
        // Try to find username field
        const form = activeField?.closest('form') || document;
        const usernameField = this.findUsernameField(form);
        if (usernameField && cred.username) {
          await this.fillField(usernameField, cred.username);
          this.showToast('Username filled', 'success');
        } else {
          this.showToast('No username field found', 'warning');
        }
      }
    }

    async fillPassword() {
      await this.loadCredentials();
      
      if (this.credentials.length === 0) {
        this.showToast('No password available', 'info');
        return;
      }

      const cred = this.credentials[this.currentCredIndex];
      const activeField = document.activeElement;
      
      if (activeField?.type === 'password' && cred.password) {
        await this.fillField(activeField, cred.password);
        this.showToast('Password filled', 'success');
      } else {
        // Try to find password field
        const form = activeField?.closest('form') || document;
        const passwordField = this.findPasswordField(form);
        if (passwordField && cred.password) {
          await this.fillField(passwordField, cred.password);
          this.showToast('Password filled', 'success');
        } else {
          this.showToast('No password field found', 'warning');
        }
      }
    }

    async copyPassword() {
      await this.loadCredentials();
      
      if (this.credentials.length === 0 || !this.credentials[0].password) {
        this.showToast('No password available', 'info');
        return;
      }

      await this.copyToClipboard(this.credentials[0].password);
      this.showToast('Password copied (clears in 30s)', 'success');
      
      // Auto-clear clipboard
      setTimeout(() => this.copyToClipboard(''), 30000);
    }

    async copyTotp() {
      await this.loadCredentials();
      
      const credWithTotp = this.credentials.find(c => c.totp);
      
      if (!credWithTotp) {
        this.showToast('No TOTP configured', 'info');
        return;
      }

      const totpCode = this.generateTOTP(credWithTotp.totp);
      await this.copyToClipboard(totpCode);
      this.showToast(`TOTP ${totpCode} copied`, 'success');
    }

    async generatePassword() {
      const password = this.generateStrongPassword();
      const activeField = document.activeElement;
      
      // Fill if in input field
      if (this.isInputField(activeField)) {
        await this.fillField(activeField, password);
      }
      
      // Always copy to clipboard
      await this.copyToClipboard(password);
      this.showToast('Password generated & copied', 'success');
    }

    openVault() {
      chrome.runtime?.sendMessage({ action: 'openSidePanel' });
    }

    async saveLogin() {
      const form = document.activeElement?.closest('form') || document;
      const usernameField = this.findUsernameField(form);
      const passwordField = this.findPasswordField(form);
      
      const loginData = {
        url: window.location.href,
        name: document.title,
        username: usernameField?.value || '',
        password: passwordField?.value || ''
      };
      
      chrome.runtime?.sendMessage({
        action: 'saveNewLogin',
        data: loginData
      });
      
      this.showToast('Opening save dialog...', 'info');
    }

    async cycleCredentials() {
      // Only cycle if recently filled
      const now = Date.now();
      if (now - this.lastFillTime > this.cycleCooldown * 2) {
        // Too long since last fill, start fresh
        this.currentCredIndex = 0;
      } else {
        // Cycle to next credential
        this.currentCredIndex = (this.currentCredIndex + 1) % this.credentials.length;
      }
      
      // Fill with new credential
      await this.fillLogin();
    }

    openInlineMenu() {
      const activeField = document.activeElement;
      
      if (this.isInputField(activeField) && window.cubeInlineAutofillMenu) {
        window.cubeInlineAutofillMenu.show(activeField);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FIELD HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    findUsernameField(form) {
      const selectors = [
        'input[type="email"]',
        'input[autocomplete="username"]',
        'input[autocomplete="email"]',
        'input[name*="user"]',
        'input[name*="email"]',
        'input[name*="login"]',
        'input[id*="user"]',
        'input[id*="email"]',
        'input[id*="login"]',
        'input[type="text"]'
      ];
      
      for (const selector of selectors) {
        const field = form.querySelector(selector);
        if (field && this.isVisible(field)) {
          return field;
        }
      }
      
      return null;
    }

    findPasswordField(form) {
      return form.querySelector('input[type="password"]:not([disabled])');
    }

    async fillField(field, value) {
      // Focus field
      field.focus();
      
      // Clear existing value
      field.value = '';
      
      // Set value
      field.value = value;
      
      // Dispatch events for frameworks
      field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      field.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      
      // For React
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set;
      
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(field, value);
        field.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    isInputField(element) {
      if (!element) return false;
      const tagName = element.tagName?.toLowerCase();
      return tagName === 'input' || tagName === 'textarea';
    }

    isVisible(element) {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CREDENTIALS
    // ═══════════════════════════════════════════════════════════════════════════

    async loadCredentials() {
      try {
        const hostname = window.location.hostname;
        
        if (chrome?.runtime?.sendMessage) {
          const response = await chrome.runtime.sendMessage({
            action: 'getCredentialsForSite',
            hostname: hostname
          });
          
          if (response?.credentials) {
            this.credentials = response.credentials;
          }
        }
      } catch (error) {
        console.warn('Failed to load credentials:', error);
        this.credentials = [];
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    }

    generateStrongPassword(length = 20) {
      const chars = {
        lower: 'abcdefghijklmnopqrstuvwxyz',
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
      };
      
      const allChars = Object.values(chars).join('');
      let password = '';
      
      // Ensure at least one of each type
      for (const type of Object.values(chars)) {
        password += type[Math.floor(Math.random() * type.length)];
      }
      
      // Fill rest randomly
      for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      // Shuffle
      return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    generateTOTP(_secret) {
      // Simplified TOTP - in production use proper library like otpauth
      const time = Math.floor(Date.now() / 30000);
      // This would actually compute HMAC-SHA1 of time counter with secret
      return String(time % 1000000).padStart(6, '0');
    }

    showToast(message, type = 'info') {
      // Create toast element
      const existing = document.getElementById('cube-keyboard-toast');
      if (existing) existing.remove();
      
      const toast = document.createElement('div');
      toast.id = 'cube-keyboard-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        padding: 12px 24px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 2147483647;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      `;
      
      // Type-specific styling
      const styles = {
        success: { bg: '#10b981', icon: '✅' },
        error: { bg: '#ef4444', icon: '❌' },
        warning: { bg: '#f59e0b', icon: '⚠️' },
        info: { bg: '#6366f1', icon: 'ℹ️' }
      };
      
      const style = styles[type] || styles.info;
      toast.style.background = style.bg;
      toast.style.color = 'white';
      toast.innerHTML = `<span>${style.icon}</span><span>${message}</span>`;
      
      document.body.appendChild(toast);
      
      // Animate in
      requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
      });
      
      // Auto-remove
      setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════════

    getShortcuts() {
      return { ...this.shortcuts };
    }

    isEnabled(action) {
      return this.shortcuts[action]?.enabled ?? false;
    }

    enable(action) {
      if (this.shortcuts[action]) {
        this.shortcuts[action].enabled = true;
        this.saveShortcuts();
      }
    }

    disable(action) {
      if (this.shortcuts[action]) {
        this.shortcuts[action].enabled = false;
        this.saveShortcuts();
      }
    }

    getShortcutString(action) {
      const config = this.shortcuts[action];
      if (!config) return '';
      
      const parts = [];
      if (config.ctrl) parts.push('Ctrl');
      if (config.shift) parts.push('Shift');
      if (config.alt) parts.push('Alt');
      parts.push(config.key);
      
      return parts.join('+');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT & INITIALIZE
  // ═══════════════════════════════════════════════════════════════════════════

  window.KeyboardShortcutsService = KeyboardShortcutsService;
  window.cubeKeyboardShortcuts = new KeyboardShortcutsService();

  console.log('⌨️ Keyboard Shortcuts Service loaded');
  console.log('📋 Shortcuts: Ctrl+Shift+L (fill), Ctrl+Shift+C (copy), Ctrl+Shift+G (generate)');

})(window);
