// ═══════════════════════════════════════════════════════════════════════════════
// 🔗 CUBE SERVICES LOADER v1.0.0 - Unified service initialization
// ═══════════════════════════════════════════════════════════════════════════════
//
// This file initializes and coordinates all CUBE Nexum services
// Load this file in content scripts to enable all features
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  const CUBE_VERSION = '7.0.0';
  const SERVICES_LOADED = new Set();

  // Service manifest
  const SERVICES = [
    {
      name: 'InlineAutofillMenu',
      path: 'src/ui/InlineAutofillMenu.js',
      global: 'cubeInlineAutofill',
      description: 'Dropdown menu on field focus'
    },
    {
      name: 'ContextMenuService',
      path: 'src/services/ContextMenuService.js',
      global: 'cubeContextMenu',
      description: 'Right-click context menu'
    },
    {
      name: 'KeyboardShortcutsService',
      path: 'src/services/KeyboardShortcutsService.js',
      global: 'cubeKeyboardShortcuts',
      description: 'Keyboard shortcuts (Ctrl+Shift+L)'
    },
    {
      name: 'TOTPAuthenticatorService',
      path: 'src/services/TOTPAuthenticatorService.js',
      global: 'cubeTotpAuthenticator',
      description: 'TOTP 2FA code generator'
    },
    {
      name: 'PasskeysService',
      path: 'src/services/PasskeysService.js',
      global: 'cubePasskeys',
      description: 'WebAuthn/Passkeys support'
    },
    {
      name: 'PhishingProtectionService',
      path: 'src/services/PhishingProtectionService.js',
      global: 'cubePhishingProtection',
      description: 'Phishing detection & warnings'
    },
    {
      name: 'SecurityWatchtowerService',
      path: 'src/services/SecurityWatchtowerService.js',
      global: 'cubeWatchtower',
      description: 'Password health & breach monitoring'
    },
    {
      name: 'DragDropFillService',
      path: 'src/services/DragDropFillService.js',
      global: 'cubeDragDropFill',
      description: 'Drag & drop credential filling'
    },
    {
      name: 'PageLoadAutofillService',
      path: 'src/services/PageLoadAutofillService.js',
      global: 'cubePageLoadAutofill',
      description: 'Automatic form filling on page load'
    },
    {
      name: 'EnterpriseSSOService',
      path: 'src/services/EnterpriseSSOService.js',
      global: 'cubeEnterpriseSSO',
      description: 'Enterprise SSO integration'
    }
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICE LOADER
  // ═══════════════════════════════════════════════════════════════════════════

  class CubeServicesLoader {
    constructor() {
      this.services = new Map();
      this.loadPromises = new Map();
      this.initialized = false;
    }

    async initialize() {
      if (this.initialized) return;
      
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🧊 CUBE NEXUM v${CUBE_VERSION}                    ║
║           Enterprise Password & Autofill Platform             ║
╠═══════════════════════════════════════════════════════════════╣
║  Features:                                                    ║
║  • Inline Autofill Menu      • TOTP Authenticator            ║
║  • Context Menu Integration  • Passkeys/WebAuthn             ║
║  • Keyboard Shortcuts        • Phishing Protection           ║
║  • Security Watchtower       • Drag & Drop Fill              ║
║  • Page Load Autofill        • Enterprise SSO                ║
╚═══════════════════════════════════════════════════════════════╝
      `);
      
      // Check which services are already loaded
      for (const service of SERVICES) {
        if (window[service.global]) {
          this.services.set(service.name, window[service.global]);
          SERVICES_LOADED.add(service.name);
          console.log(`✅ ${service.name} already loaded`);
        }
      }
      
      this.initialized = true;
      
      console.log(`\n🚀 CUBE Nexum initialized with ${this.services.size} services\n`);
    }

    getService(name) {
      return this.services.get(name);
    }

    isLoaded(name) {
      return SERVICES_LOADED.has(name);
    }

    getLoadedServices() {
      return Array.from(SERVICES_LOADED);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SERVICE API
    // ═══════════════════════════════════════════════════════════════════════════

    // Inline Autofill Menu
    showAutofillMenu(field) {
      const menu = this.getService('InlineAutofillMenu');
      return menu?.show?.(field);
    }

    hideAutofillMenu() {
      const menu = this.getService('InlineAutofillMenu');
      return menu?.hide?.();
    }

    // Context Menu
    updateContextMenu(items) {
      const ctx = this.getService('ContextMenuService');
      return ctx?.updateMenuItems?.(items);
    }

    // Keyboard Shortcuts
    registerShortcut(shortcut, callback) {
      const kb = this.getService('KeyboardShortcutsService');
      return kb?.registerCustomShortcut?.(shortcut, callback);
    }

    // TOTP
    async getTOTPCode(accountId) {
      const totp = this.getService('TOTPAuthenticatorService');
      return totp?.getCode?.(accountId);
    }

    async addTOTPAccount(uri) {
      const totp = this.getService('TOTPAuthenticatorService');
      return totp?.addAccountFromUri?.(uri);
    }

    // Passkeys
    async createPasskey(options) {
      const pk = this.getService('PasskeysService');
      return pk?.createCredential?.(options);
    }

    async getPasskey(options) {
      const pk = this.getService('PasskeysService');
      return pk?.getCredential?.(options);
    }

    // Phishing
    async verifyUrl(url, savedDomain) {
      const phish = this.getService('PhishingProtectionService');
      return phish?.verifyUrl?.(url, savedDomain);
    }

    // Watchtower
    async runSecurityScan(credentials) {
      const wt = this.getService('SecurityWatchtowerService');
      return wt?.runFullScan?.(credentials);
    }

    async checkPasswordStrength(password) {
      const wt = this.getService('SecurityWatchtowerService');
      return wt?.analyzePasswordStrength?.(password);
    }

    async checkPasswordBreach(password) {
      const wt = this.getService('SecurityWatchtowerService');
      return wt?.checkPasswordBreach?.(password);
    }

    // Drag & Drop
    createDraggable(data) {
      const dd = this.getService('DragDropFillService');
      return dd?.createDraggableCredential?.(data);
    }

    // Page Load Autofill
    async triggerAutofill() {
      const pla = this.getService('PageLoadAutofillService');
      return pla?.fillNow?.();
    }

    disableAutofillForSite() {
      const pla = this.getService('PageLoadAutofillService');
      return pla?.disableForCurrentSite?.();
    }

    // Enterprise SSO
    async initiateSSOLogin() {
      const sso = this.getService('EnterpriseSSOService');
      return sso?.initiateSSO?.();
    }

    isSSOConfigured() {
      const sso = this.getService('EnterpriseSSOService');
      return sso?.isConfigured?.();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    getVersion() {
      return CUBE_VERSION;
    }

    getServiceStatus() {
      const status = {};
      for (const service of SERVICES) {
        status[service.name] = {
          loaded: SERVICES_LOADED.has(service.name),
          description: service.description,
          global: service.global
        };
      }
      return status;
    }

    destroy() {
      // Cleanup all services
      for (const [_name, service] of this.services) {
        if (service.destroy) {
          service.destroy();
        }
      }
      this.services.clear();
      SERVICES_LOADED.clear();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════════════

  window.CubeServicesLoader = CubeServicesLoader;
  window.CUBE = new CubeServicesLoader();
  
  // Auto-initialize
  window.CUBE.initialize();

})(window);
