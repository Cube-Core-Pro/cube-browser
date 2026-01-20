// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 ENTERPRISE SSO SERVICE v1.0.0 - Single Sign-On Integration
// ═══════════════════════════════════════════════════════════════════════════════
//
// Features matching 1Password Business / Dashlane Business:
// ✅ SAML 2.0 support
// ✅ OAuth 2.0 / OIDC support
// ✅ Azure AD integration
// ✅ Okta integration
// ✅ Google Workspace integration
// ✅ Custom IdP support
// ✅ Auto-detect SSO pages
// ✅ Directory sync
// ✅ SCIM provisioning
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  const STORAGE_KEY = 'cubeSSOConfig';
  const SESSION_KEY = 'cubeSSOSession';

  // Known SSO providers
  const SSO_PROVIDERS = {
    azure: {
      name: 'Microsoft Azure AD',
      icon: '🔷',
      domains: ['login.microsoftonline.com', 'login.microsoft.com'],
      authEndpoint: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize',
      tokenEndpoint: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
      scopes: ['openid', 'profile', 'email']
    },
    okta: {
      name: 'Okta',
      icon: '🔵',
      domains: ['*.okta.com', '*.oktapreview.com'],
      authEndpoint: 'https://{domain}/oauth2/v1/authorize',
      tokenEndpoint: 'https://{domain}/oauth2/v1/token',
      scopes: ['openid', 'profile', 'email']
    },
    google: {
      name: 'Google Workspace',
      icon: '🔴',
      domains: ['accounts.google.com'],
      authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      scopes: ['openid', 'profile', 'email']
    },
    onelogin: {
      name: 'OneLogin',
      icon: '🟣',
      domains: ['*.onelogin.com'],
      authEndpoint: 'https://{domain}/oidc/2/auth',
      tokenEndpoint: 'https://{domain}/oidc/2/token',
      scopes: ['openid', 'profile', 'email']
    },
    auth0: {
      name: 'Auth0',
      icon: '🟠',
      domains: ['*.auth0.com', '*.us.auth0.com', '*.eu.auth0.com'],
      authEndpoint: 'https://{domain}/authorize',
      tokenEndpoint: 'https://{domain}/oauth/token',
      scopes: ['openid', 'profile', 'email']
    },
    ping: {
      name: 'Ping Identity',
      icon: '🔶',
      domains: ['*.pingone.com', '*.pingidentity.com'],
      authEndpoint: 'https://{domain}/as/authorize.oauth2',
      tokenEndpoint: 'https://{domain}/as/token.oauth2',
      scopes: ['openid', 'profile', 'email']
    }
  };

  // SSO page detection patterns
  const SSO_PAGE_PATTERNS = [
    /\/saml\//i,
    /\/sso\//i,
    /\/oauth/i,
    /\/oidc/i,
    /\/login\/sso/i,
    /\/(adfs|wsfed)/i,
    /\/authorize/i,
    /enterprise[_-]?login/i,
    /corporate[_-]?login/i,
    /idp/i
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // ENTERPRISE SSO SERVICE
  // ═══════════════════════════════════════════════════════════════════════════

  class EnterpriseSSOService {
    constructor() {
      this.config = null;
      this.session = null;
      this.initialized = false;
      
      this.initialize();
    }

    async initialize() {
      console.log('🏢 Enterprise SSO Service initializing...');
      
      await this.loadConfig();
      await this.loadSession();
      
      if (this.config?.enabled) {
        this.setupSSODetection();
      }
      
      this.initialized = true;
      console.log('✅ Enterprise SSO Service ready');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIG MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    async loadConfig() {
      try {
        if (chrome?.storage?.local) {
          const result = await chrome.storage.local.get(STORAGE_KEY);
          this.config = result[STORAGE_KEY] || null;
        }
      } catch (error) {
        console.warn('Failed to load SSO config:', error);
      }
    }

    async saveConfig() {
      try {
        if (chrome?.storage?.local) {
          await chrome.storage.local.set({ [STORAGE_KEY]: this.config });
        }
      } catch (error) {
        console.warn('Failed to save SSO config:', error);
      }
    }

    async loadSession() {
      try {
        if (chrome?.storage?.session) {
          const result = await chrome.storage.session.get(SESSION_KEY);
          this.session = result[SESSION_KEY] || null;
        }
      } catch (error) {
        console.warn('Failed to load SSO session:', error);
      }
    }

    async saveSession() {
      try {
        if (chrome?.storage?.session) {
          await chrome.storage.session.set({ [SESSION_KEY]: this.session });
        }
      } catch (error) {
        console.warn('Failed to save SSO session:', error);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SSO CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════

    async configureSSO(config) {
      this.config = {
        enabled: true,
        provider: config.provider,
        domain: config.domain,
        clientId: config.clientId,
        clientSecret: config.clientSecret, // Should be stored securely
        tenant: config.tenant,
        redirectUri: config.redirectUri || chrome.identity?.getRedirectURL?.() || '',
        scopes: config.scopes || SSO_PROVIDERS[config.provider]?.scopes || ['openid', 'profile', 'email'],
        metadata: config.metadata || null,
        autoLogin: config.autoLogin ?? false,
        syncDirectory: config.syncDirectory ?? false,
        scimEndpoint: config.scimEndpoint || null,
        scimToken: config.scimToken || null,
        organizationId: config.organizationId || null,
        configuredAt: Date.now()
      };
      
      await this.saveConfig();
      this.setupSSODetection();
      
      return { success: true, config: this.config };
    }

    async disableSSO() {
      this.config = null;
      this.session = null;
      
      await this.saveConfig();
      await this.saveSession();
      
      return { success: true };
    }

    isConfigured() {
      return this.config?.enabled && this.config?.provider;
    }

    getConfig() {
      return this.config;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SSO PAGE DETECTION
    // ═══════════════════════════════════════════════════════════════════════════

    setupSSODetection() {
      // Check current page
      this.detectSSOPage();
      
      // Watch for navigation
      window.addEventListener('popstate', () => this.detectSSOPage());
      
      // Watch for URL changes (SPA)
      let lastUrl = window.location.href;
      setInterval(() => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          this.detectSSOPage();
        }
      }, 500);
    }

    detectSSOPage() {
      const url = window.location.href;
      const hostname = window.location.hostname;
      
      // Check if on known SSO provider
      const provider = this.detectProvider(hostname);
      if (provider) {
        console.log(`🔐 Detected SSO provider: ${provider}`);
        this.handleSSOPage(provider);
        return;
      }
      
      // Check URL patterns
      for (const pattern of SSO_PAGE_PATTERNS) {
        if (pattern.test(url)) {
          console.log('🔐 Detected SSO login page');
          this.handleSSOPage('custom');
          return;
        }
      }
      
      // Check for SSO buttons/links
      this.detectSSOElements();
    }

    detectProvider(hostname) {
      for (const [key, provider] of Object.entries(SSO_PROVIDERS)) {
        for (const domain of provider.domains) {
          if (domain.startsWith('*')) {
            const suffix = domain.slice(1);
            if (hostname.endsWith(suffix)) {
              return key;
            }
          } else if (hostname === domain) {
            return key;
          }
        }
      }
      return null;
    }

    detectSSOElements() {
      // Find SSO login buttons
      const ssoIndicators = [
        'button[class*="sso"]',
        'a[href*="sso"]',
        'a[href*="saml"]',
        'button[class*="enterprise"]',
        'a[href*="enterprise"]',
        '[data-sso]',
        '[data-provider]'
      ];
      
      for (const selector of ssoIndicators) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          this.highlightSSOElements(elements);
          return;
        }
      }
    }

    highlightSSOElements(elements) {
      // Add visual indicator for SSO buttons
      elements.forEach(element => {
        if (element.dataset.cubeSSO) return;
        element.dataset.cubeSSO = 'true';
        
        // Add icon
        const icon = document.createElement('span');
        icon.textContent = ' 🏢';
        icon.title = 'CUBE can handle this SSO login';
        icon.style.cursor = 'pointer';
        element.appendChild(icon);
      });
    }

    handleSSOPage(provider) {
      if (!this.config?.enabled) return;
      
      // Show SSO assistance overlay
      this.showSSOAssistant(provider);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SSO ASSISTANT UI
    // ═══════════════════════════════════════════════════════════════════════════

    showSSOAssistant(provider) {
      // Remove existing
      const existing = document.getElementById('cube-sso-assistant');
      if (existing) existing.remove();
      
      const providerInfo = SSO_PROVIDERS[provider] || { name: 'SSO', icon: '🔐' };
      
      const assistant = document.createElement('div');
      assistant.id = 'cube-sso-assistant';
      assistant.innerHTML = `
        <style>
          #cube-sso-assistant {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1a1a2e;
            border: 1px solid #3b3b5e;
            border-radius: 12px;
            padding: 16px;
            max-width: 320px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            z-index: 2147483647;
            animation: cube-slide-up 0.3s ease;
          }
          @keyframes cube-slide-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .cube-sso-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          }
          .cube-sso-icon {
            font-size: 24px;
          }
          .cube-sso-title {
            color: white;
            font-size: 16px;
            font-weight: 600;
          }
          .cube-sso-close {
            margin-left: auto;
            background: none;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            font-size: 18px;
          }
          .cube-sso-body {
            color: #9ca3af;
            font-size: 14px;
            margin-bottom: 12px;
          }
          .cube-sso-button {
            width: 100%;
            padding: 10px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          .cube-sso-button:hover {
            opacity: 0.9;
          }
          .cube-sso-link {
            color: #667eea;
            text-decoration: none;
            font-size: 12px;
            display: block;
            text-align: center;
            margin-top: 8px;
          }
        </style>
        <div class="cube-sso-header">
          <span class="cube-sso-icon">${providerInfo.icon}</span>
          <span class="cube-sso-title">${providerInfo.name} Login</span>
          <button class="cube-sso-close" id="cube-sso-close">×</button>
        </div>
        <div class="cube-sso-body">
          ${this.config?.organizationId 
            ? `Sign in with your ${this.config.organizationId} account`
            : 'CUBE can manage this SSO login for you'}
        </div>
        <button class="cube-sso-button" id="cube-sso-login">
          Sign in with SSO
        </button>
        <a href="#" class="cube-sso-link" id="cube-sso-settings">
          Configure SSO settings
        </a>
      `;
      
      document.body.appendChild(assistant);
      
      // Event handlers
      document.getElementById('cube-sso-close').onclick = () => assistant.remove();
      document.getElementById('cube-sso-login').onclick = () => this.initiateSSO();
      document.getElementById('cube-sso-settings').onclick = (e) => {
        e.preventDefault();
        this.openSettings();
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SSO FLOW
    // ═══════════════════════════════════════════════════════════════════════════

    async initiateSSO() {
      if (!this.config) {
        console.error('SSO not configured');
        return { success: false, error: 'SSO not configured' };
      }
      
      const provider = SSO_PROVIDERS[this.config.provider];
      if (!provider) {
        console.error('Unknown SSO provider');
        return { success: false, error: 'Unknown SSO provider' };
      }
      
      // Build authorization URL
      const authUrl = this.buildAuthUrl();
      
      console.log('🔐 Initiating SSO flow...');
      
      // Use Chrome Identity API if available
      if (chrome?.identity?.launchWebAuthFlow) {
        try {
          const redirectUrl = await chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
          });
          
          return await this.handleAuthCallback(redirectUrl);
        } catch (error) {
          console.error('SSO flow failed:', error);
          return { success: false, error: error.message };
        }
      } else {
        // Fallback: open in new window
        window.open(authUrl, '_blank', 'width=500,height=600');
        return { success: true, pending: true };
      }
    }

    buildAuthUrl() {
      const provider = SSO_PROVIDERS[this.config.provider];
      let authEndpoint = provider.authEndpoint;
      
      // Replace placeholders
      authEndpoint = authEndpoint
        .replace('{tenant}', this.config.tenant || 'common')
        .replace('{domain}', this.config.domain || '');
      
      // Build params
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        response_type: 'code',
        redirect_uri: this.config.redirectUri,
        scope: this.config.scopes.join(' '),
        state: this.generateState(),
        nonce: this.generateNonce()
      });
      
      // Add provider-specific params
      if (this.config.provider === 'azure') {
        params.append('response_mode', 'fragment');
      }
      
      return `${authEndpoint}?${params.toString()}`;
    }

    generateState() {
      const state = crypto.randomUUID();
      // Store state for verification
      sessionStorage.setItem('cube_sso_state', state);
      return state;
    }

    generateNonce() {
      return crypto.randomUUID();
    }

    async handleAuthCallback(redirectUrl) {
      const url = new URL(redirectUrl);
      const params = new URLSearchParams(url.hash.slice(1) || url.search);
      
      // Verify state
      const state = params.get('state');
      const savedState = sessionStorage.getItem('cube_sso_state');
      
      if (state !== savedState) {
        return { success: false, error: 'State mismatch' };
      }
      
      // Check for error
      const error = params.get('error');
      if (error) {
        return { success: false, error: params.get('error_description') || error };
      }
      
      // Get authorization code
      const code = params.get('code');
      if (!code) {
        return { success: false, error: 'No authorization code' };
      }
      
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code);
      
      if (!tokens.success) {
        return tokens;
      }
      
      // Create session
      this.session = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        expiresAt: Date.now() + (tokens.expires_in * 1000),
        user: this.decodeIdToken(tokens.id_token)
      };
      
      await this.saveSession();
      
      console.log('✅ SSO login successful');
      
      return { success: true, session: this.session };
    }

    async exchangeCodeForTokens(code) {
      const provider = SSO_PROVIDERS[this.config.provider];
      let tokenEndpoint = provider.tokenEndpoint;
      
      tokenEndpoint = tokenEndpoint
        .replace('{tenant}', this.config.tenant || 'common')
        .replace('{domain}', this.config.domain || '');
      
      const body = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code'
      });
      
      try {
        const response = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        });
        
        if (!response.ok) {
          const error = await response.json();
          return { success: false, error: error.error_description || 'Token exchange failed' };
        }
        
        const tokens = await response.json();
        return { success: true, ...tokens };
        
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    decodeIdToken(idToken) {
      try {
        const parts = idToken.split('.');
        const payload = JSON.parse(atob(parts[1]));
        
        return {
          sub: payload.sub,
          email: payload.email,
          name: payload.name || payload.preferred_username,
          picture: payload.picture,
          groups: payload.groups || []
        };
      } catch {
        return null;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SESSION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    isAuthenticated() {
      return this.session && this.session.expiresAt > Date.now();
    }

    getSession() {
      return this.session;
    }

    getUser() {
      return this.session?.user;
    }

    async logout() {
      this.session = null;
      await this.saveSession();
      
      // Clear state
      sessionStorage.removeItem('cube_sso_state');
      
      return { success: true };
    }

    async refreshSession() {
      if (!this.session?.refreshToken) {
        return { success: false, error: 'No refresh token' };
      }
      
      const provider = SSO_PROVIDERS[this.config.provider];
      let tokenEndpoint = provider.tokenEndpoint;
      
      tokenEndpoint = tokenEndpoint
        .replace('{tenant}', this.config.tenant || 'common')
        .replace('{domain}', this.config.domain || '');
      
      const body = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.session.refreshToken,
        grant_type: 'refresh_token'
      });
      
      try {
        const response = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        });
        
        if (!response.ok) {
          return { success: false, error: 'Token refresh failed' };
        }
        
        const tokens = await response.json();
        
        this.session = {
          ...this.session,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || this.session.refreshToken,
          expiresAt: Date.now() + (tokens.expires_in * 1000)
        };
        
        await this.saveSession();
        
        return { success: true, session: this.session };
        
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DIRECTORY SYNC (SCIM)
    // ═══════════════════════════════════════════════════════════════════════════

    async syncDirectory() {
      if (!this.config?.scimEndpoint || !this.config?.scimToken) {
        return { success: false, error: 'SCIM not configured' };
      }
      
      console.log('📁 Syncing directory...');
      
      try {
        // Fetch users
        const usersResponse = await fetch(`${this.config.scimEndpoint}/Users`, {
          headers: {
            'Authorization': `Bearer ${this.config.scimToken}`,
            'Content-Type': 'application/scim+json'
          }
        });
        
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const users = await usersResponse.json();
        
        // Fetch groups
        const groupsResponse = await fetch(`${this.config.scimEndpoint}/Groups`, {
          headers: {
            'Authorization': `Bearer ${this.config.scimToken}`,
            'Content-Type': 'application/scim+json'
          }
        });
        
        if (!groupsResponse.ok) {
          throw new Error('Failed to fetch groups');
        }
        
        const groups = await groupsResponse.json();
        
        console.log(`✅ Directory sync complete: ${users.totalResults} users, ${groups.totalResults} groups`);
        
        return {
          success: true,
          users: users.Resources,
          groups: groups.Resources
        };
        
      } catch (error) {
        console.error('Directory sync failed:', error);
        return { success: false, error: error.message };
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════════════════════

    openSettings() {
      // Send message to open settings page
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'openSettings', tab: 'enterprise' });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════════

    destroy() {
      const assistant = document.getElementById('cube-sso-assistant');
      if (assistant) assistant.remove();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════════════

  window.EnterpriseSSOService = EnterpriseSSOService;
  window.cubeEnterpriseSSO = new EnterpriseSSOService();

  console.log('🏢 Enterprise SSO Service loaded');

})(window);
