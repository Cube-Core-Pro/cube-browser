// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 ENTERPRISE SERVICE MODULE v7.1.0 - SSO & Enterprise Integration
// ═══════════════════════════════════════════════════════════════════════════════
//
// ROLE: Enterprise features integration for Chrome Extension
//
// RESPONSIBILITIES:
// ✅ SSO Authentication (SAML/OIDC)
// ✅ Organization Settings Sync
// ✅ License Validation
// ✅ Feature Gating based on License
// ✅ Audit Logging
// ✅ White-label Support
// ✅ LDAP User Sync
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} EnterpriseConfig
 * @property {string} organizationId
 * @property {string} organizationName
 * @property {boolean} ssoEnabled
 * @property {string} ssoProvider - 'saml' | 'oidc'
 * @property {Object} ssoConfig
 * @property {Object} branding
 * @property {string[]} enabledFeatures
 */

/**
 * @typedef {Object} License
 * @property {string} type - 'standard' | 'professional' | 'enterprise'
 * @property {number} seats
 * @property {string[]} features
 * @property {number} validUntil
 * @property {string} status
 */

/**
 * @typedef {Object} SSOSession
 * @property {string} userId
 * @property {string} email
 * @property {string} displayName
 * @property {string[]} roles
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {number} expiresAt
 */

// ═══════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════

const EnterpriseState = {
  config: null,
  license: null,
  session: null,
  initialized: false,
  apiBaseUrl: (typeof CubeConfig !== 'undefined' && CubeConfig.SERVER?.API_BASE) || 'https://api.cubeai.tools',
};

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize enterprise services
 * @returns {Promise<void>}
 */
async function initializeEnterprise() {
  console.log('🏢 Initializing Enterprise Services...');
  
  try {
    // Load stored config
    const stored = await chrome.storage.local.get(['enterpriseConfig', 'enterpriseLicense', 'ssoSession']);
    
    if (stored.enterpriseConfig) {
      EnterpriseState.config = stored.enterpriseConfig;
    }
    
    if (stored.enterpriseLicense) {
      EnterpriseState.license = stored.enterpriseLicense;
    }
    
    if (stored.ssoSession) {
      EnterpriseState.session = stored.ssoSession;
      
      // Check if session is still valid
      if (EnterpriseState.session.expiresAt < Date.now()) {
        console.log('⚠️ SSO session expired, attempting refresh...');
        await refreshSSOToken();
      }
    }
    
    // Validate license
    if (EnterpriseState.license) {
      const isValid = await validateLicense();
      if (!isValid) {
        console.warn('⚠️ License validation failed');
        EnterpriseState.license = null;
      }
    }
    
    EnterpriseState.initialized = true;
    console.log('✅ Enterprise Services initialized');
    
    // Broadcast enterprise state to content scripts
    broadcastEnterpriseState();
    
  } catch (error) {
    console.error('❌ Enterprise initialization failed:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SSO AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initiate SSO login flow
 * @param {string} provider - 'saml' | 'oidc'
 * @returns {Promise<SSOSession>}
 */
async function initiateSSOLogin(provider) {
  console.log(`🔐 Initiating ${provider.toUpperCase()} SSO login...`);
  
  if (!EnterpriseState.config?.ssoEnabled) {
    throw new Error('SSO is not enabled for this organization');
  }
  
  const ssoConfig = EnterpriseState.config.ssoConfig;
  
  if (provider === 'saml') {
    return initiateSAMLLogin(ssoConfig);
  } else if (provider === 'oidc') {
    return initiateOIDCLogin(ssoConfig);
  } else {
    throw new Error(`Unknown SSO provider: ${provider}`);
  }
}

/**
 * Initiate SAML login
 * @param {Object} config
 * @returns {Promise<SSOSession>}
 */
async function initiateSAMLLogin(config) {
  // Create SAML AuthnRequest
  const samlRequest = generateSAMLRequest(config);
  
  // Open IdP login page
  const loginUrl = `${config.ssoUrl}?SAMLRequest=${encodeURIComponent(samlRequest)}`;
  
  return new Promise((resolve, reject) => {
    // Open login popup
    chrome.windows.create({
      url: loginUrl,
      type: 'popup',
      width: 600,
      height: 700,
    }, (window) => {
      const windowId = window.id;
      
      // Listen for callback
      const listener = (tabId, changeInfo, tab) => {
        if (tab.windowId === windowId && changeInfo.url) {
          // Check if this is our callback URL
          if (changeInfo.url.includes('/auth/saml/callback')) {
            chrome.tabs.onUpdated.removeListener(listener);
            
            // Extract SAML response
            const url = new URL(changeInfo.url);
            const samlResponse = url.searchParams.get('SAMLResponse');
            
            if (samlResponse) {
              // Process SAML response
              processSAMLResponse(samlResponse)
                .then(session => {
                  chrome.windows.remove(windowId);
                  resolve(session);
                })
                .catch(err => {
                  chrome.windows.remove(windowId);
                  reject(err);
                });
            }
          }
        }
      };
      
      chrome.tabs.onUpdated.addListener(listener);
      
      // Timeout after 5 minutes
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        chrome.windows.remove(windowId);
        reject(new Error('SSO login timeout'));
      }, 300000);
    });
  });
}

/**
 * Initiate OIDC login
 * @param {Object} config
 * @returns {Promise<SSOSession>}
 */
async function initiateOIDCLogin(config) {
  // Generate PKCE challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(32);
  const nonce = generateRandomString(32);
  
  // Store verifier for later
  await chrome.storage.local.set({ oidcVerifier: codeVerifier, oidcState: state });
  
  // Build authorization URL
  const authUrl = new URL(`${config.issuer}/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('scope', config.scopes.join(' '));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  
  return new Promise((resolve, reject) => {
    // Use Chrome identity API for popup
    chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true,
    }, async (redirectUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      try {
        const url = new URL(redirectUrl);
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        
        // Verify state
        const stored = await chrome.storage.local.get(['oidcVerifier', 'oidcState']);
        if (returnedState !== stored.oidcState) {
          reject(new Error('State mismatch - possible CSRF attack'));
          return;
        }
        
        // Exchange code for tokens
        const session = await exchangeOIDCCode(config, code, stored.oidcVerifier);
        resolve(session);
        
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Exchange OIDC authorization code for tokens
 * @param {Object} config
 * @param {string} code
 * @param {string} codeVerifier
 * @returns {Promise<SSOSession>}
 */
async function exchangeOIDCCode(config, code, codeVerifier) {
  const response = await fetch(`${config.issuer}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      code_verifier: codeVerifier,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Token exchange failed');
  }
  
  const tokens = await response.json();
  
  // Decode ID token to get user info
  const idToken = parseJWT(tokens.id_token);
  
  const session = {
    userId: idToken.sub,
    email: idToken.email,
    displayName: idToken.name || idToken.email,
    roles: idToken.roles || ['user'],
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in * 1000),
  };
  
  // Store session
  await saveSession(session);
  
  return session;
}

/**
 * Refresh SSO access token
 * @returns {Promise<boolean>}
 */
async function refreshSSOToken() {
  if (!EnterpriseState.session?.refreshToken) {
    console.warn('No refresh token available');
    return false;
  }
  
  try {
    const config = EnterpriseState.config.ssoConfig;
    
    const response = await fetch(`${config.issuer}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: EnterpriseState.session.refreshToken,
        client_id: config.clientId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const tokens = await response.json();
    
    EnterpriseState.session.accessToken = tokens.access_token;
    EnterpriseState.session.expiresAt = Date.now() + (tokens.expires_in * 1000);
    
    if (tokens.refresh_token) {
      EnterpriseState.session.refreshToken = tokens.refresh_token;
    }
    
    await saveSession(EnterpriseState.session);
    
    console.log('✅ SSO token refreshed');
    return true;
    
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    await logout();
    return false;
  }
}

/**
 * Save session to storage
 * @param {SSOSession} session
 */
async function saveSession(session) {
  EnterpriseState.session = session;
  await chrome.storage.local.set({ ssoSession: session });
  broadcastEnterpriseState();
}

/**
 * Logout user
 */
async function logout() {
  EnterpriseState.session = null;
  await chrome.storage.local.remove(['ssoSession']);
  broadcastEnterpriseState();
  
  console.log('👋 User logged out');
}

// ═══════════════════════════════════════════════════════════════════════════
// LICENSE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate current license
 * @returns {Promise<boolean>}
 */
async function validateLicense() {
  if (!EnterpriseState.license) {
    return false;
  }
  
  try {
    const response = await fetch(`${EnterpriseState.apiBaseUrl}/enterprise/licenses/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EnterpriseState.session?.accessToken || ''}`,
      },
      body: JSON.stringify({
        licenseKey: EnterpriseState.license.id,
        organizationId: EnterpriseState.config?.organizationId,
      }),
    });
    
    const result = await response.json();
    
    if (result.data?.valid) {
      EnterpriseState.license = result.data.license;
      await chrome.storage.local.set({ enterpriseLicense: result.data.license });
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('License validation error:', error);
    // Allow offline usage for grace period
    if (EnterpriseState.license.validUntil > Date.now()) {
      return true;
    }
    return false;
  }
}

/**
 * Check if a feature is enabled by license
 * @param {string} feature
 * @returns {boolean}
 */
function isFeatureEnabled(feature) {
  if (!EnterpriseState.license) {
    // Free tier features
    const freeFeatures = ['autofill', 'basic_automation'];
    return freeFeatures.includes(feature);
  }
  
  return EnterpriseState.license.features.includes(feature);
}

/**
 * Get license type
 * @returns {string}
 */
function getLicenseType() {
  return EnterpriseState.license?.type || 'free';
}

/**
 * Get remaining seats
 * @returns {number}
 */
function getRemainingSeats() {
  if (!EnterpriseState.license) {
    return 0;
  }
  return EnterpriseState.license.seats - (EnterpriseState.license.usedSeats || 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT LOGGING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log an audit event
 * @param {string} action
 * @param {string} resource
 * @param {string} resourceId
 * @param {Object} details
 */
async function logAuditEvent(action, resource, resourceId, details = {}) {
  if (!EnterpriseState.config?.organizationId) {
    return;
  }
  
  try {
    await fetch(`${EnterpriseState.apiBaseUrl}/enterprise/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EnterpriseState.session?.accessToken || ''}`,
      },
      body: JSON.stringify({
        organizationId: EnterpriseState.config.organizationId,
        userId: EnterpriseState.session?.userId || 'anonymous',
        action,
        resource,
        resourceId,
        details,
        timestamp: Date.now(),
      }),
    });
  } catch (error) {
    // Silent fail - audit logs are best-effort
    console.debug('Audit log failed:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WHITE LABEL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get branding configuration
 * @returns {Object}
 */
function getBranding() {
  if (EnterpriseState.config?.branding) {
    return EnterpriseState.config.branding;
  }
  
  // Default branding
  return {
    logoUrl: 'icons/icon128.png',
    appName: 'CUBE Nexum',
    primaryColor: '#8b5cf6',
    secondaryColor: '#1f2937',
    supportEmail: 'support@cubeai.tools',
  };
}

/**
 * Apply branding to extension UI
 */
function applyBranding() {
  const branding = getBranding();
  
  // Store branding for popup and content scripts
  chrome.storage.local.set({ branding });
  
  // Update badge color
  chrome.action.setBadgeBackgroundColor({ color: branding.primaryColor });
}

// ═══════════════════════════════════════════════════════════════════════════
// ORGANIZATION SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch organization configuration
 * @param {string} organizationId
 * @returns {Promise<EnterpriseConfig>}
 */
async function fetchOrganizationConfig(organizationId) {
  const response = await fetch(`${EnterpriseState.apiBaseUrl}/enterprise/organizations/${organizationId}`, {
    headers: {
      'Authorization': `Bearer ${EnterpriseState.session?.accessToken || ''}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch organization config');
  }
  
  const result = await response.json();
  const org = result.data;
  
  // Fetch SSO config
  const ssoResponse = await fetch(`${EnterpriseState.apiBaseUrl}/enterprise/organizations/${organizationId}/sso`, {
    headers: {
      'Authorization': `Bearer ${EnterpriseState.session?.accessToken || ''}`,
    },
  });
  
  const ssoResult = await ssoResponse.json();
  
  // Fetch white label config
  const wlResponse = await fetch(`${EnterpriseState.apiBaseUrl}/enterprise/organizations/${organizationId}/whitelabel`, {
    headers: {
      'Authorization': `Bearer ${EnterpriseState.session?.accessToken || ''}`,
    },
  });
  
  const wlResult = await wlResponse.json();
  
  const config = {
    organizationId: org.id,
    organizationName: org.name,
    ssoEnabled: ssoResult.data?.enabled || false,
    ssoProvider: ssoResult.data?.provider,
    ssoConfig: ssoResult.data?.config,
    branding: wlResult.data?.branding || null,
    enabledFeatures: [], // Will be populated from license
  };
  
  EnterpriseState.config = config;
  await chrome.storage.local.set({ enterpriseConfig: config });
  
  // Apply branding
  applyBranding();
  
  return config;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate SAML AuthnRequest
 * @param {Object} config
 * @returns {string}
 */
function generateSAMLRequest(config) {
  const id = '_' + generateRandomString(32);
  const issueInstant = new Date().toISOString();
  
  const request = `
    <samlp:AuthnRequest
      xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
      xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
      ID="${id}"
      Version="2.0"
      IssueInstant="${issueInstant}"
      Destination="${config.ssoUrl}"
      AssertionConsumerServiceURL="${config.callbackUrl || chrome.runtime.getURL('auth/saml/callback')}">
      <saml:Issuer>${config.entityId}</saml:Issuer>
    </samlp:AuthnRequest>
  `;
  
  // Base64 encode
  return btoa(request.trim());
}

/**
 * Process SAML response
 * @param {string} samlResponse
 * @returns {Promise<SSOSession>}
 */
async function processSAMLResponse(samlResponse) {
  // Decode and parse SAML response
  const xml = atob(samlResponse);
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  // Extract user info from assertion
  const nameId = doc.querySelector('NameID')?.textContent;
  const attributes = {};
  
  doc.querySelectorAll('Attribute').forEach(attr => {
    const name = attr.getAttribute('Name');
    const value = attr.querySelector('AttributeValue')?.textContent;
    if (name && value) {
      attributes[name] = value;
    }
  });
  
  const session = {
    userId: nameId,
    email: attributes.email || attributes.mail || nameId,
    displayName: attributes.displayName || attributes.cn || nameId,
    roles: attributes.roles ? attributes.roles.split(',') : ['user'],
    accessToken: generateRandomString(64), // Generate internal token
    refreshToken: generateRandomString(64),
    expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
  };
  
  await saveSession(session);
  return session;
}

/**
 * Generate random string
 * @param {number} length
 * @returns {string}
 */
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const crypto = globalThis.crypto || window.crypto;
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  values.forEach(val => result += chars[val % chars.length]);
  return result;
}

/**
 * Generate PKCE code verifier
 * @returns {string}
 */
function generateCodeVerifier() {
  return generateRandomString(64);
}

/**
 * Generate PKCE code challenge
 * @param {string} verifier
 * @returns {Promise<string>}
 */
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Parse JWT token
 * @param {string} token
 * @returns {Object}
 */
function parseJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  
  const payload = parts[1];
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}

/**
 * Broadcast enterprise state to all content scripts
 */
function broadcastEnterpriseState() {
  const state = {
    initialized: EnterpriseState.initialized,
    authenticated: !!EnterpriseState.session,
    organizationId: EnterpriseState.config?.organizationId,
    organizationName: EnterpriseState.config?.organizationName,
    licenseType: getLicenseType(),
    branding: getBranding(),
    user: EnterpriseState.session ? {
      id: EnterpriseState.session.userId,
      email: EnterpriseState.session.email,
      displayName: EnterpriseState.session.displayName,
      roles: EnterpriseState.session.roles,
    } : null,
  };
  
  chrome.runtime.sendMessage({ type: 'ENTERPRISE_STATE_UPDATE', payload: state });
  
  // Also send to all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { type: 'ENTERPRISE_STATE_UPDATE', payload: state }).catch((error) => {
        // Tab may be closed or not ready to receive messages
        console.debug(`Enterprise state broadcast to tab ${tab.id} failed:`, error?.message || 'Tab unavailable');
      });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle enterprise-related messages
 * @param {Object} message
 * @param {Object} sender
 * @returns {Promise<Object>}
 */
async function handleEnterpriseMessage(message, sender) {
  switch (message.action) {
    case 'ENTERPRISE_INIT':
      await initializeEnterprise();
      return { success: true };
      
    case 'SSO_LOGIN':
      try {
        const session = await initiateSSOLogin(message.provider || 'oidc');
        return { success: true, session };
      } catch (error) {
        return { success: false, error: error.message };
      }
      
    case 'SSO_LOGOUT':
      await logout();
      return { success: true };
      
    case 'GET_ENTERPRISE_STATE':
      return {
        success: true,
        state: {
          initialized: EnterpriseState.initialized,
          authenticated: !!EnterpriseState.session,
          config: EnterpriseState.config,
          license: EnterpriseState.license,
          session: EnterpriseState.session ? {
            userId: EnterpriseState.session.userId,
            email: EnterpriseState.session.email,
            displayName: EnterpriseState.session.displayName,
            roles: EnterpriseState.session.roles,
          } : null,
        },
      };
      
    case 'CHECK_FEATURE':
      return { 
        success: true, 
        enabled: isFeatureEnabled(message.feature) 
      };
      
    case 'LOG_AUDIT':
      await logAuditEvent(
        message.action,
        message.resource,
        message.resourceId,
        message.details
      );
      return { success: true };
      
    case 'FETCH_ORG_CONFIG':
      try {
        const config = await fetchOrganizationConfig(message.organizationId);
        return { success: true, config };
      } catch (error) {
        return { success: false, error: error.message };
      }
      
    case 'GET_BRANDING':
      return { success: true, branding: getBranding() };
      
    case 'VALIDATE_LICENSE':
      const isValid = await validateLicense();
      return { success: true, valid: isValid, license: EnterpriseState.license };
      
    default:
      return { success: false, error: 'Unknown action' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

// Export for use in background service worker
if (typeof globalThis !== 'undefined') {
  globalThis.EnterpriseService = {
    initialize: initializeEnterprise,
    initiateSSOLogin,
    logout,
    isFeatureEnabled,
    getLicenseType,
    getRemainingSeats,
    logAuditEvent,
    getBranding,
    fetchOrganizationConfig,
    handleMessage: handleEnterpriseMessage,
    getState: () => EnterpriseState,
  };
}

// Initialize on load
initializeEnterprise();
