// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 PAGE LOAD AUTOFILL SERVICE v1.0.0 - Automatic form filling on page load
// ═══════════════════════════════════════════════════════════════════════════════
//
// Features matching Dashlane / 1Password auto-fill:
// ✅ Detect login forms on page load
// ✅ Auto-fill credentials automatically
// ✅ Multi-page form handling
// ✅ Submit button auto-click (optional)
// ✅ Site-specific rules
// ✅ Delay/timing configuration
// ✅ Shadow DOM support
// ✅ Dynamic form detection
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  const STORAGE_KEY = 'cubePageLoadAutofill';
  const SITE_RULES_KEY = 'cubeAutofillSiteRules';

  // Default settings
  const DEFAULT_SETTINGS = {
    enabled: true,
    autoFillOnLoad: true,
    autoSubmit: false,
    delay: 500, // ms before autofill
    notifyOnFill: true,
    requireUserGesture: false,
    fillHiddenFields: false,
    respectAutocompleteOff: true
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE LOAD AUTOFILL SERVICE
  // ═══════════════════════════════════════════════════════════════════════════

  class PageLoadAutofillService {
    constructor() {
      this.settings = { ...DEFAULT_SETTINGS };
      this.siteRules = new Map();
      this.filledForms = new WeakSet();
      this.observer = null;
      this.fillTimeout = null;
      
      this.initialize();
    }

    async initialize() {
      console.log('🚀 Page Load Autofill Service initializing...');
      
      await this.loadSettings();
      await this.loadSiteRules();
      
      if (this.settings.enabled) {
        this.setupAutoFill();
      }
      
      console.log('✅ Page Load Autofill ready');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════════════════════

    async loadSettings() {
      try {
        if (chrome?.storage?.local) {
          const result = await chrome.storage.local.get([STORAGE_KEY, SITE_RULES_KEY]);
          this.settings = { ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] };
          
          if (result[SITE_RULES_KEY]) {
            this.siteRules = new Map(Object.entries(result[SITE_RULES_KEY]));
          }
        }
      } catch (error) {
        console.warn('Failed to load autofill settings:', error);
      }
    }

    async saveSettings() {
      try {
        if (chrome?.storage?.local) {
          await chrome.storage.local.set({
            [STORAGE_KEY]: this.settings,
            [SITE_RULES_KEY]: Object.fromEntries(this.siteRules)
          });
        }
      } catch (error) {
        console.warn('Failed to save autofill settings:', error);
      }
    }

    async loadSiteRules() {
      // Site-specific autofill rules
      // Can be expanded with user preferences
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTOFILL SETUP
    // ═══════════════════════════════════════════════════════════════════════════

    setupAutoFill() {
      // Wait for DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.onPageReady());
      } else {
        this.onPageReady();
      }
      
      // Watch for dynamic forms
      this.setupMutationObserver();
      
      // Handle SPA navigation
      this.setupNavigationListener();
    }

    onPageReady() {
      console.log('📄 Page ready, checking for forms...');
      
      // Check site rules
      const hostname = window.location.hostname;
      const siteRule = this.siteRules.get(hostname);
      
      if (siteRule?.disabled) {
        console.log('⏸️ Autofill disabled for this site');
        return;
      }
      
      // Delay before autofill
      const delay = siteRule?.delay ?? this.settings.delay;
      
      this.fillTimeout = setTimeout(() => {
        this.attemptAutoFill();
      }, delay);
    }

    setupMutationObserver() {
      // Watch for dynamically added forms
      this.observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'FORM' || node.querySelector?.('form, input')) {
                  shouldCheck = true;
                  break;
                }
              }
            }
          }
        }
        
        if (shouldCheck) {
          // Debounce
          clearTimeout(this.fillTimeout);
          this.fillTimeout = setTimeout(() => {
            this.attemptAutoFill();
          }, 200);
        }
      });
      
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    setupNavigationListener() {
      // Handle SPA navigation
      let lastUrl = window.location.href;
      
      const checkUrlChange = () => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          console.log('🔄 URL changed, rechecking forms');
          
          // Reset filled forms
          this.filledForms = new WeakSet();
          
          // Attempt fill
          clearTimeout(this.fillTimeout);
          this.fillTimeout = setTimeout(() => {
            this.attemptAutoFill();
          }, this.settings.delay);
        }
      };
      
      // Check periodically for SPA navigation
      setInterval(checkUrlChange, 500);
      
      // Also listen to popstate
      window.addEventListener('popstate', () => {
        checkUrlChange();
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FORM DETECTION
    // ═══════════════════════════════════════════════════════════════════════════

    async attemptAutoFill() {
      if (!this.settings.autoFillOnLoad) return;
      
      console.log('🔍 Searching for fillable forms...');
      
      // Find all login forms
      const forms = this.findLoginForms();
      
      if (forms.length === 0) {
        console.log('No login forms found');
        return;
      }
      
      console.log(`Found ${forms.length} potential form(s)`);
      
      // Get credentials for this site
      const credentials = await this.getCredentialsForSite();
      
      if (!credentials || credentials.length === 0) {
        console.log('No credentials found for this site');
        return;
      }
      
      // Fill each form
      for (const form of forms) {
        if (this.filledForms.has(form.element)) {
          continue;
        }
        
        await this.fillForm(form, credentials[0]);
      }
    }

    findLoginForms() {
      const forms = [];
      
      // Find all forms
      const formElements = document.querySelectorAll('form');
      
      for (const form of formElements) {
        const analysis = this.analyzeForm(form);
        if (analysis.isLogin) {
          forms.push({
            element: form,
            ...analysis
          });
        }
      }
      
      // Also check for standalone inputs (no form wrapper)
      const standaloneInputs = this.findStandaloneLoginInputs();
      if (standaloneInputs.passwordField) {
        forms.push({
          element: document.body,
          ...standaloneInputs,
          isStandalone: true
        });
      }
      
      // Check Shadow DOM
      const shadowForms = this.findShadowDOMForms();
      forms.push(...shadowForms);
      
      return forms;
    }

    analyzeForm(form) {
      const inputs = form.querySelectorAll('input');
      let usernameField = null;
      let passwordField = null;
      let emailField = null;
      let submitButton = null;
      
      for (const input of inputs) {
        const type = input.type?.toLowerCase();
        const name = input.name?.toLowerCase() || '';
        const id = input.id?.toLowerCase() || '';
        const autocomplete = input.autocomplete?.toLowerCase() || '';
        
        // Skip hidden and disabled
        if (type === 'hidden' || input.disabled) continue;
        
        // Password field
        if (type === 'password') {
          passwordField = input;
          continue;
        }
        
        // Email field
        if (type === 'email' || autocomplete === 'email' ||
            name.includes('email') || id.includes('email')) {
          emailField = input;
          continue;
        }
        
        // Username field
        if (autocomplete === 'username' ||
            name.includes('user') || id.includes('user') ||
            name.includes('login') || id.includes('login') ||
            name.includes('account') || id.includes('account')) {
          usernameField = input;
          continue;
        }
        
        // Generic text field before password
        if (type === 'text' && !usernameField) {
          usernameField = input;
        }
      }
      
      // Find submit button
      submitButton = form.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
      
      // If no dedicated username but have email, use that
      if (!usernameField && emailField) {
        usernameField = emailField;
        emailField = null;
      }
      
      const isLogin = !!passwordField && !!(usernameField || emailField);
      
      return {
        isLogin,
        usernameField,
        passwordField,
        emailField,
        submitButton
      };
    }

    findStandaloneLoginInputs() {
      // Find password inputs not in a form
      const passwordInputs = document.querySelectorAll('input[type="password"]:not(form input)');
      
      if (passwordInputs.length === 0) {
        return { isLogin: false };
      }
      
      const passwordField = passwordInputs[0];
      
      // Look for nearby username field
      let usernameField = null;
      
      // Check siblings and parents
      const parent = passwordField.parentElement;
      if (parent) {
        const siblings = parent.querySelectorAll('input[type="text"], input[type="email"]');
        for (const sibling of siblings) {
          if (sibling !== passwordField) {
            usernameField = sibling;
            break;
          }
        }
      }
      
      return {
        isLogin: !!passwordField,
        usernameField,
        passwordField,
        isStandalone: true
      };
    }

    findShadowDOMForms() {
      const forms = [];
      
      // Find all elements with shadow roots
      const elementsWithShadow = document.querySelectorAll('*');
      
      for (const element of elementsWithShadow) {
        if (element.shadowRoot) {
          const shadowForms = element.shadowRoot.querySelectorAll('form');
          
          for (const form of shadowForms) {
            const analysis = this.analyzeForm(form);
            if (analysis.isLogin) {
              forms.push({
                element: form,
                ...analysis,
                isShadowDOM: true,
                shadowHost: element
              });
            }
          }
        }
      }
      
      return forms;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CREDENTIAL RETRIEVAL
    // ═══════════════════════════════════════════════════════════════════════════

    async getCredentialsForSite() {
      const hostname = window.location.hostname;
      
      // Try to get from global credential store
      if (window.cubeCredentialStore) {
        const credentials = await window.cubeCredentialStore.getForDomain?.(hostname);
        if (credentials?.length > 0) {
          return credentials;
        }
      }
      
      // Try Chrome storage
      try {
        if (chrome?.storage?.local) {
          const result = await chrome.storage.local.get('cubeCredentials');
          const allCredentials = result.cubeCredentials || [];
          
          return allCredentials.filter(cred => 
            this.matchesDomain(cred.domain, hostname)
          );
        }
      } catch (error) {
        console.warn('Failed to get credentials:', error);
      }
      
      return [];
    }

    matchesDomain(credentialDomain, currentDomain) {
      if (!credentialDomain || !currentDomain) return false;
      
      // Normalize
      const cred = credentialDomain.toLowerCase().replace(/^www\./, '');
      const curr = currentDomain.toLowerCase().replace(/^www\./, '');
      
      // Exact match
      if (cred === curr) return true;
      
      // Subdomain match
      if (curr.endsWith('.' + cred)) return true;
      if (cred.endsWith('.' + curr)) return true;
      
      // Root domain match
      const credRoot = this.getRootDomain(cred);
      const currRoot = this.getRootDomain(curr);
      
      return credRoot === currRoot;
    }

    getRootDomain(domain) {
      const parts = domain.split('.');
      if (parts.length <= 2) return domain;
      
      // Handle special TLDs
      const specialTlds = ['co.uk', 'com.au', 'co.jp', 'com.br'];
      const lastTwo = parts.slice(-2).join('.');
      
      if (specialTlds.includes(lastTwo)) {
        return parts.slice(-3).join('.');
      }
      
      return parts.slice(-2).join('.');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FORM FILLING
    // ═══════════════════════════════════════════════════════════════════════════

    async fillForm(form, credential) {
      console.log('📝 Filling form...');
      
      const { usernameField, passwordField, emailField } = form;
      
      // Check autocomplete="off" setting
      if (this.settings.respectAutocompleteOff) {
        if (form.element.autocomplete === 'off') {
          console.log('Form has autocomplete="off", skipping');
          return false;
        }
      }
      
      // Fill username/email
      if (usernameField && !this.isFieldFilled(usernameField)) {
        const value = credential.username || credential.email;
        if (value) {
          this.fillField(usernameField, value);
        }
      }
      
      // Fill email if separate
      if (emailField && emailField !== usernameField && !this.isFieldFilled(emailField)) {
        if (credential.email) {
          this.fillField(emailField, credential.email);
        }
      }
      
      // Fill password
      if (passwordField && !this.isFieldFilled(passwordField)) {
        if (credential.password) {
          this.fillField(passwordField, credential.password);
        }
      }
      
      // Mark form as filled
      this.filledForms.add(form.element);
      
      // Show notification
      if (this.settings.notifyOnFill) {
        this.showFillNotification(credential);
      }
      
      // Auto-submit if enabled
      if (this.settings.autoSubmit && form.submitButton) {
        setTimeout(() => {
          this.autoSubmit(form);
        }, 500);
      }
      
      console.log('✅ Form filled successfully');
      return true;
    }

    isFieldFilled(field) {
      return field.value && field.value.length > 0;
    }

    fillField(field, value) {
      // Focus field
      field.focus();
      
      // Use native setter for React compatibility
      const nativeInputSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set;
      
      if (nativeInputSetter) {
        nativeInputSetter.call(field, value);
      } else {
        field.value = value;
      }
      
      // Dispatch events
      field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      field.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      
      // For Angular
      field.dispatchEvent(new Event('blur', { bubbles: true }));
      
      // Visual feedback
      field.style.transition = 'background-color 0.3s';
      const originalBg = field.style.backgroundColor;
      field.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
      setTimeout(() => {
        field.style.backgroundColor = originalBg;
      }, 500);
    }

    autoSubmit(form) {
      if (!form.submitButton) return;
      
      console.log('🚀 Auto-submitting form...');
      
      // Click submit button
      form.submitButton.click();
    }

    showFillNotification(credential) {
      const notification = document.createElement('div');
      notification.innerHTML = `
        <style>
          .cube-fill-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 2147483647;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: cube-slide-in 0.3s ease;
          }
          @keyframes cube-slide-in {
            from {
              opacity: 0;
              transform: translateX(100px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .cube-fill-notification-icon {
            font-size: 18px;
          }
        </style>
        <div class="cube-fill-notification">
          <span class="cube-fill-notification-icon">🔐</span>
          <span>Filled login for ${credential.username || credential.domain}</span>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'cube-slide-in 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SITE RULES
    // ═══════════════════════════════════════════════════════════════════════════

    async setSiteRule(hostname, rule) {
      this.siteRules.set(hostname, rule);
      await this.saveSettings();
    }

    async removeSiteRule(hostname) {
      this.siteRules.delete(hostname);
      await this.saveSettings();
    }

    getSiteRule(hostname) {
      return this.siteRules.get(hostname);
    }

    async disableForCurrentSite() {
      const hostname = window.location.hostname;
      await this.setSiteRule(hostname, { disabled: true });
    }

    async enableForCurrentSite() {
      const hostname = window.location.hostname;
      await this.removeSiteRule(hostname);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MANUAL TRIGGER
    // ═══════════════════════════════════════════════════════════════════════════

    async fillNow() {
      // Reset filled forms to allow re-fill
      this.filledForms = new WeakSet();
      
      // Force fill
      await this.attemptAutoFill();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENABLE/DISABLE
    // ═══════════════════════════════════════════════════════════════════════════

    async enable() {
      this.settings.enabled = true;
      this.settings.autoFillOnLoad = true;
      await this.saveSettings();
      this.setupAutoFill();
    }

    async disable() {
      this.settings.enabled = false;
      this.settings.autoFillOnLoad = false;
      await this.saveSettings();
      
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      
      clearTimeout(this.fillTimeout);
    }

    isEnabled() {
      return this.settings.enabled && this.settings.autoFillOnLoad;
    }

    async setAutoSubmit(enabled) {
      this.settings.autoSubmit = enabled;
      await this.saveSettings();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════════

    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      
      clearTimeout(this.fillTimeout);
      this.filledForms = new WeakSet();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════════════

  window.PageLoadAutofillService = PageLoadAutofillService;
  window.cubePageLoadAutofill = new PageLoadAutofillService();

  console.log('🚀 Page Load Autofill Service loaded');

})(window);
