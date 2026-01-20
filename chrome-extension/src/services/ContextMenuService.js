// ═══════════════════════════════════════════════════════════════════════════════
// 🖱️ CONTEXT MENU SERVICE v1.0.0 - Right-click autofill integration
// ═══════════════════════════════════════════════════════════════════════════════
//
// Features matching Bitwarden/1Password/Dashlane:
// ✅ Right-click context menu on input fields
// ✅ Autofill username, password, or both
// ✅ Copy credentials to clipboard
// ✅ Generate password option
// ✅ Open vault quick access
// ✅ Site-specific credential suggestions
//
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  const MENU_IDS = {
    PARENT: 'cube-autofill-parent',
    FILL_LOGIN: 'cube-fill-login',
    FILL_USERNAME: 'cube-fill-username',
    FILL_PASSWORD: 'cube-fill-password',
    FILL_CARD: 'cube-fill-card',
    FILL_IDENTITY: 'cube-fill-identity',
    COPY_USERNAME: 'cube-copy-username',
    COPY_PASSWORD: 'cube-copy-password',
    COPY_TOTP: 'cube-copy-totp',
    GENERATE_PASSWORD: 'cube-generate-password',
    OPEN_VAULT: 'cube-open-vault',
    NEW_LOGIN: 'cube-new-login',
    SEPARATOR_1: 'cube-separator-1',
    SEPARATOR_2: 'cube-separator-2'
  };

  class ContextMenuService {
    constructor() {
      this.credentialsCache = new Map();
      this.initialize();
    }

    initialize() {
      console.log('🖱️ Context Menu Service initializing...');
      
      // Create menu structure
      this.createMenus();
      
      // Listen for menu clicks
      this.setupListeners();
      
      // Listen for tab updates to refresh credentials
      this.setupTabListeners();
      
      console.log('✅ Context Menu Service ready');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MENU CREATION
    // ═══════════════════════════════════════════════════════════════════════════

    createMenus() {
      // Remove existing menus first
      chrome.contextMenus.removeAll(() => {
        // Parent menu
        chrome.contextMenus.create({
          id: MENU_IDS.PARENT,
          title: '🔐 CUBE Autofill',
          contexts: ['editable', 'password']
        });

        // Fill submenu
        chrome.contextMenus.create({
          id: MENU_IDS.FILL_LOGIN,
          parentId: MENU_IDS.PARENT,
          title: '▶️ Fill Login',
          contexts: ['editable', 'password']
        });

        chrome.contextMenus.create({
          id: MENU_IDS.FILL_USERNAME,
          parentId: MENU_IDS.PARENT,
          title: '👤 Fill Username Only',
          contexts: ['editable']
        });

        chrome.contextMenus.create({
          id: MENU_IDS.FILL_PASSWORD,
          parentId: MENU_IDS.PARENT,
          title: '🔑 Fill Password Only',
          contexts: ['editable', 'password']
        });

        // Separator
        chrome.contextMenus.create({
          id: MENU_IDS.SEPARATOR_1,
          parentId: MENU_IDS.PARENT,
          type: 'separator',
          contexts: ['editable', 'password']
        });

        // Fill other types
        chrome.contextMenus.create({
          id: MENU_IDS.FILL_CARD,
          parentId: MENU_IDS.PARENT,
          title: '💳 Fill Card Details',
          contexts: ['editable']
        });

        chrome.contextMenus.create({
          id: MENU_IDS.FILL_IDENTITY,
          parentId: MENU_IDS.PARENT,
          title: '👤 Fill Identity',
          contexts: ['editable']
        });

        // Separator
        chrome.contextMenus.create({
          id: MENU_IDS.SEPARATOR_2,
          parentId: MENU_IDS.PARENT,
          type: 'separator',
          contexts: ['editable', 'password']
        });

        // Copy options
        chrome.contextMenus.create({
          id: MENU_IDS.COPY_USERNAME,
          parentId: MENU_IDS.PARENT,
          title: '📋 Copy Username',
          contexts: ['editable', 'password']
        });

        chrome.contextMenus.create({
          id: MENU_IDS.COPY_PASSWORD,
          parentId: MENU_IDS.PARENT,
          title: '📋 Copy Password',
          contexts: ['editable', 'password']
        });

        chrome.contextMenus.create({
          id: MENU_IDS.COPY_TOTP,
          parentId: MENU_IDS.PARENT,
          title: '🔢 Copy TOTP Code',
          contexts: ['editable', 'password']
        });

        // Generate password
        chrome.contextMenus.create({
          id: MENU_IDS.GENERATE_PASSWORD,
          parentId: MENU_IDS.PARENT,
          title: '🎲 Generate Password',
          contexts: ['editable', 'password']
        });

        // Vault access
        chrome.contextMenus.create({
          id: MENU_IDS.OPEN_VAULT,
          parentId: MENU_IDS.PARENT,
          title: '🏦 Open Vault',
          contexts: ['editable', 'password']
        });

        chrome.contextMenus.create({
          id: MENU_IDS.NEW_LOGIN,
          parentId: MENU_IDS.PARENT,
          title: '➕ Save New Login',
          contexts: ['editable', 'password']
        });

        console.log('✅ Context menus created');
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════════

    setupListeners() {
      chrome.contextMenus.onClicked.addListener((info, tab) => {
        this.handleMenuClick(info, tab);
      });
    }

    setupTabListeners() {
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
          this.updateMenusForTab(tab);
        }
      });

      chrome.tabs.onActivated.addListener(async (activeInfo) => {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab.url) {
          this.updateMenusForTab(tab);
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MENU CLICK HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    async handleMenuClick(info, tab) {
      const menuId = info.menuItemId;
      
      console.log('🖱️ Context menu clicked:', menuId);

      switch (menuId) {
        case MENU_IDS.FILL_LOGIN:
          await this.fillLogin(tab);
          break;
          
        case MENU_IDS.FILL_USERNAME:
          await this.fillUsername(tab);
          break;
          
        case MENU_IDS.FILL_PASSWORD:
          await this.fillPassword(tab);
          break;
          
        case MENU_IDS.FILL_CARD:
          await this.fillCard(tab);
          break;
          
        case MENU_IDS.FILL_IDENTITY:
          await this.fillIdentity(tab);
          break;
          
        case MENU_IDS.COPY_USERNAME:
          await this.copyUsername(tab);
          break;
          
        case MENU_IDS.COPY_PASSWORD:
          await this.copyPassword(tab);
          break;
          
        case MENU_IDS.COPY_TOTP:
          await this.copyTOTP(tab);
          break;
          
        case MENU_IDS.GENERATE_PASSWORD:
          await this.generateAndFillPassword(tab);
          break;
          
        case MENU_IDS.OPEN_VAULT:
          this.openVault();
          break;
          
        case MENU_IDS.NEW_LOGIN:
          await this.saveNewLogin(tab);
          break;
          
        default:
          // Check if it's a credential-specific menu item
          if (menuId.startsWith('cube-cred-')) {
            const credIndex = parseInt(menuId.replace('cube-cred-', ''));
            await this.fillSpecificCredential(tab, credIndex);
          }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTOFILL ACTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    async fillLogin(tab) {
      const credentials = await this.getCredentialsForTab(tab);
      
      if (credentials.length === 0) {
        this.showNotification('No saved logins for this site', 'info');
        return;
      }

      // Use first credential (most recently used)
      const cred = credentials[0];
      
      await this.executeInTab(tab.id, async (cred) => {
        const form = document.activeElement?.closest('form') || document;
        
        // Find username field
        const usernameField = form.querySelector(
          'input[type="email"], input[type="text"][autocomplete*="user"], ' +
          'input[type="text"][name*="user"], input[type="text"][name*="email"]'
        );
        
        // Find password field
        const passwordField = form.querySelector('input[type="password"]');
        
        if (usernameField && cred.username) {
          usernameField.focus();
          usernameField.value = cred.username;
          usernameField.dispatchEvent(new Event('input', { bubbles: true }));
          usernameField.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (passwordField && cred.password) {
          passwordField.focus();
          passwordField.value = cred.password;
          passwordField.dispatchEvent(new Event('input', { bubbles: true }));
          passwordField.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        return { success: true };
      }, [cred]);
      
      this.showNotification(`Filled login for ${cred.name || cred.username}`, 'success');
    }

    async fillUsername(tab) {
      const credentials = await this.getCredentialsForTab(tab);
      
      if (credentials.length === 0 || !credentials[0].username) {
        this.showNotification('No username available', 'info');
        return;
      }

      const username = credentials[0].username;
      
      await this.executeInTab(tab.id, (username) => {
        const field = document.activeElement;
        if (field && (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA')) {
          field.value = username;
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, [username]);
      
      this.showNotification('Username filled', 'success');
    }

    async fillPassword(tab) {
      const credentials = await this.getCredentialsForTab(tab);
      
      if (credentials.length === 0 || !credentials[0].password) {
        this.showNotification('No password available', 'info');
        return;
      }

      const password = credentials[0].password;
      
      await this.executeInTab(tab.id, (password) => {
        const field = document.activeElement;
        if (field && (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA')) {
          field.value = password;
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, [password]);
      
      this.showNotification('Password filled', 'success');
    }

    async fillCard(tab) {
      const cards = await this.getCardsFromVault();
      
      if (cards.length === 0) {
        this.showNotification('No saved cards', 'info');
        return;
      }

      const card = cards[0];
      
      await this.executeInTab(tab.id, (card) => {
        const form = document.activeElement?.closest('form') || document;
        
        const mappings = [
          { selectors: ['[autocomplete*="cc-number"]', '[name*="card"]', '[name*="number"]'], value: card.number },
          { selectors: ['[autocomplete*="cc-exp"]', '[name*="exp"]'], value: card.expiry },
          { selectors: ['[autocomplete*="cc-csc"]', '[name*="cvv"]', '[name*="cvc"]'], value: card.cvv },
          { selectors: ['[autocomplete*="cc-name"]', '[name*="holder"]'], value: card.holderName }
        ];
        
        mappings.forEach(({ selectors, value }) => {
          if (!value) return;
          for (const sel of selectors) {
            const field = form.querySelector(sel);
            if (field) {
              field.value = value;
              field.dispatchEvent(new Event('input', { bubbles: true }));
              field.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
          }
        });
      }, [card]);
      
      this.showNotification('Card details filled', 'success');
    }

    async fillIdentity(tab) {
      const identities = await this.getIdentitiesFromVault();
      
      if (identities.length === 0) {
        this.showNotification('No saved identities', 'info');
        return;
      }

      const identity = identities[0];
      
      await this.executeInTab(tab.id, (identity) => {
        const form = document.activeElement?.closest('form') || document;
        
        const mappings = {
          name: ['[autocomplete*="name"]', '[name*="name"]'],
          email: ['[autocomplete*="email"]', '[name*="email"]', '[type="email"]'],
          phone: ['[autocomplete*="tel"]', '[name*="phone"]', '[type="tel"]'],
          address: ['[autocomplete*="address"]', '[name*="address"]'],
          city: ['[autocomplete*="city"]', '[name*="city"]'],
          state: ['[autocomplete*="state"]', '[name*="state"]'],
          zip: ['[autocomplete*="postal"]', '[name*="zip"]', '[name*="postal"]'],
          country: ['[autocomplete*="country"]', '[name*="country"]']
        };
        
        Object.entries(mappings).forEach(([key, selectors]) => {
          const value = identity[key];
          if (!value) return;
          
          for (const sel of selectors) {
            const field = form.querySelector(sel);
            if (field) {
              field.value = value;
              field.dispatchEvent(new Event('input', { bubbles: true }));
              field.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
          }
        });
      }, [identity]);
      
      this.showNotification('Identity filled', 'success');
    }

    async copyUsername(tab) {
      const credentials = await this.getCredentialsForTab(tab);
      
      if (credentials.length === 0 || !credentials[0].username) {
        this.showNotification('No username available', 'info');
        return;
      }

      await this.copyToClipboard(credentials[0].username);
      this.showNotification('Username copied', 'success');
    }

    async copyPassword(tab) {
      const credentials = await this.getCredentialsForTab(tab);
      
      if (credentials.length === 0 || !credentials[0].password) {
        this.showNotification('No password available', 'info');
        return;
      }

      await this.copyToClipboard(credentials[0].password);
      this.showNotification('Password copied (clears in 30s)', 'success');
      
      // Auto-clear clipboard after 30 seconds
      setTimeout(async () => {
        await this.copyToClipboard('');
      }, 30000);
    }

    async copyTOTP(tab) {
      const credentials = await this.getCredentialsForTab(tab);
      
      if (credentials.length === 0 || !credentials[0].totp) {
        this.showNotification('No TOTP configured', 'info');
        return;
      }

      const totpCode = this.generateTOTP(credentials[0].totp);
      await this.copyToClipboard(totpCode);
      this.showNotification(`TOTP ${totpCode} copied`, 'success');
    }

    async generateAndFillPassword(tab) {
      const password = this.generateStrongPassword();
      
      await this.executeInTab(tab.id, (password) => {
        const field = document.activeElement;
        if (field && (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA')) {
          field.value = password;
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, [password]);
      
      // Also copy to clipboard
      await this.copyToClipboard(password);
      
      this.showNotification('Password generated and copied', 'success');
    }

    async fillSpecificCredential(tab, index) {
      const credentials = await this.getCredentialsForTab(tab);
      
      if (index >= credentials.length) {
        return;
      }

      const cred = credentials[index];
      
      await this.executeInTab(tab.id, (cred) => {
        const form = document.activeElement?.closest('form') || document;
        
        const usernameField = form.querySelector(
          'input[type="email"], input[type="text"][autocomplete*="user"], ' +
          'input[type="text"][name*="user"], input[type="text"][name*="email"]'
        );
        
        const passwordField = form.querySelector('input[type="password"]');
        
        if (usernameField && cred.username) {
          usernameField.value = cred.username;
          usernameField.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        if (passwordField && cred.password) {
          passwordField.value = cred.password;
          passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, [cred]);
      
      this.showNotification(`Filled ${cred.name || cred.username}`, 'success');
    }

    openVault() {
      chrome.runtime.sendMessage({ action: 'openSidePanel' });
    }

    async saveNewLogin(tab) {
      // Get current page info
      const url = tab.url;
      const title = tab.title;
      
      // Open vault with new login form pre-filled
      chrome.runtime.sendMessage({
        action: 'openVault',
        data: {
          type: 'newLogin',
          url: url,
          name: title
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DYNAMIC MENU UPDATES
    // ═══════════════════════════════════════════════════════════════════════════

    async updateMenusForTab(tab) {
      if (!tab.url || tab.url.startsWith('chrome://')) {
        return;
      }

      const credentials = await this.getCredentialsForTab(tab);
      
      // Update menu title with count
      const count = credentials.length;
      const title = count > 0 
        ? `🔐 CUBE Autofill (${count} login${count > 1 ? 's' : ''})`
        : '🔐 CUBE Autofill';
      
      chrome.contextMenus.update(MENU_IDS.PARENT, { title });
      
      // Remove old credential-specific items
      this.credentialsCache.forEach((_, id) => {
        try {
          chrome.contextMenus.remove(id);
        } catch (_e) {
          // Ignore
        }
      });
      this.credentialsCache.clear();
      
      // Add credential-specific items if multiple
      if (credentials.length > 1) {
        credentials.slice(0, 5).forEach((cred, index) => {
          const id = `cube-cred-${index}`;
          chrome.contextMenus.create({
            id: id,
            parentId: MENU_IDS.FILL_LOGIN,
            title: `${cred.name || cred.username || 'Login'} (${cred.username || ''})`,
            contexts: ['editable', 'password']
          });
          this.credentialsCache.set(id, cred);
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA ACCESS
    // ═══════════════════════════════════════════════════════════════════════════

    async getCredentialsForTab(tab) {
      try {
        const hostname = new URL(tab.url).hostname;
        
        // Get from storage
        const result = await chrome.storage.local.get('vault');
        const vault = result.vault || { logins: [] };
        
        // Filter by hostname
        return vault.logins.filter(login => {
          if (!login.url) return false;
          try {
            const loginHostname = new URL(login.url).hostname;
            return loginHostname === hostname || 
                   hostname.endsWith('.' + loginHostname) ||
                   loginHostname.endsWith('.' + hostname);
          } catch {
            return false;
          }
        });
      } catch (error) {
        console.error('Failed to get credentials:', error);
        return [];
      }
    }

    async getCardsFromVault() {
      try {
        const result = await chrome.storage.local.get('vault');
        return result.vault?.cards || [];
      } catch {
        return [];
      }
    }

    async getIdentitiesFromVault() {
      try {
        const result = await chrome.storage.local.get('vault');
        return result.vault?.identities || [];
      } catch {
        return [];
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    async executeInTab(tabId, func, args = []) {
      try {
        return await chrome.scripting.executeScript({
          target: { tabId },
          func: func,
          args: args
        });
      } catch (error) {
        console.error('Failed to execute in tab:', error);
        return null;
      }
    }

    async copyToClipboard(text) {
      try {
        // Use offscreen document for clipboard access in service worker
        await chrome.offscreen?.createDocument?.({
          url: 'offscreen/offscreen.html',
          reasons: ['CLIPBOARD'],
          justification: 'Copy credentials to clipboard'
        }).catch((error) => {
          // Document may already exist, which is fine
          console.debug('Offscreen document creation skipped:', error?.message || 'Already exists');
        });
        
        await chrome.runtime.sendMessage({
          action: 'copyToClipboard',
          text: text
        });
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }

    showNotification(message, _type = 'info') {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '../icons/icon128.png',
        title: 'CUBE Autofill',
        message: message
      });
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
      // Simplified - in production use proper TOTP library
      // This would use the actual TOTP algorithm
      const time = Math.floor(Date.now() / 30000);
      return String(time % 1000000).padStart(6, '0');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════════════

  // Initialize in background script
  if (typeof window === 'undefined' || typeof chrome !== 'undefined') {
    window.ContextMenuService = ContextMenuService;
    window.cubeContextMenuService = new ContextMenuService();
  }

})();
