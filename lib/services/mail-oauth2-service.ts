/**
 * CUBE Mail OAuth2 Service
 * 
 * Handles OAuth2 authentication flow for email providers:
 * - Google (Gmail)
 * - Microsoft (Outlook, Office 365)
 * - Yahoo
 * 
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// TYPES
// ============================================================================

export type OAuth2Provider = 'google' | 'microsoft' | 'yahoo';

export interface OAuth2Config {
  provider: OAuth2Provider;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuth2AuthUrlResponse {
  authUrl: string;
  state: string;
}

export interface OAuth2TokensResponse {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  userEmail: string | null;
  userName: string | null;
}

// ============================================================================
// DEFAULT CONFIGS
// ============================================================================

/**
 * Default scopes for each provider
 */
export const DEFAULT_SCOPES: Record<OAuth2Provider, string[]> = {
  google: [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  microsoft: [
    'https://outlook.office.com/IMAP.AccessAsUser.All',
    'https://outlook.office.com/SMTP.Send',
    'offline_access',
    'openid',
    'profile',
    'email',
  ],
  yahoo: [
    'mail-r',
    'mail-w',
    'sdps-r',
    'sdpp-w',
    'openid',
    'profile',
    'email',
  ],
};

/**
 * Provider display names
 */
export const PROVIDER_NAMES: Record<OAuth2Provider, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
  yahoo: 'Yahoo',
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

class OAuth2Service {
  private static instance: OAuth2Service;
  private isTauri: boolean;
  private registeredConfigs: Map<OAuth2Provider, OAuth2Config> = new Map();

  private constructor() {
    this.isTauri = typeof window !== 'undefined' && 
      (window as Window & { __TAURI__?: unknown }).__TAURI__ !== undefined;
  }

  static getInstance(): OAuth2Service {
    if (!OAuth2Service.instance) {
      OAuth2Service.instance = new OAuth2Service();
    }
    return OAuth2Service.instance;
  }

  // ==========================================================================
  // REGISTRATION
  // ==========================================================================

  /**
   * Register OAuth2 configuration for a provider
   */
  async registerProvider(config: OAuth2Config): Promise<void> {
    if (this.isTauri) {
      await invoke('cube_mail_oauth2_register', {
        provider: config.provider,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: config.redirectUri,
        scopes: config.scopes,
      });
    }
    
    this.registeredConfigs.set(config.provider, config);
  }

  /**
   * Check if provider is registered
   */
  isProviderRegistered(provider: OAuth2Provider): boolean {
    return this.registeredConfigs.has(provider);
  }

  /**
   * Get registered config
   */
  getConfig(provider: OAuth2Provider): OAuth2Config | undefined {
    return this.registeredConfigs.get(provider);
  }

  // ==========================================================================
  // AUTH FLOW
  // ==========================================================================

  /**
   * Start OAuth2 authorization flow
   * Returns URL to redirect user to for authorization
   */
  async getAuthorizationUrl(provider: OAuth2Provider): Promise<OAuth2AuthUrlResponse> {
    if (!this.registeredConfigs.has(provider)) {
      throw new Error(`Provider ${provider} not registered. Call registerProvider first.`);
    }

    if (this.isTauri) {
      return invoke('cube_mail_oauth2_get_auth_url', { provider });
    }
    
    // Web fallback - construct URL manually
    const config = this.registeredConfigs.get(provider)!;
    const state = this.generateState();
    const authUrl = this.buildAuthUrl(config, state);
    
    return { authUrl, state };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(
    provider: OAuth2Provider,
    code: string,
    state: string
  ): Promise<OAuth2TokensResponse> {
    if (this.isTauri) {
      return invoke('cube_mail_oauth2_exchange_code', { provider, code, state });
    }
    
    // Web fallback - API call
    const response = await fetch('/api/mail/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, code, state }),
    });
    
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    provider: OAuth2Provider,
    refreshToken: string
  ): Promise<OAuth2TokensResponse> {
    if (this.isTauri) {
      return invoke('cube_mail_oauth2_refresh', { provider, refreshToken });
    }
    
    const response = await fetch('/api/mail/oauth2/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  // ==========================================================================
  // ACCOUNT CREATION
  // ==========================================================================

  /**
   * Add email account with OAuth2 tokens
   */
  async addAccountWithOAuth(
    email: string,
    name: string,
    provider: OAuth2Provider,
    accessToken: string,
    refreshToken?: string
  ): Promise<unknown> {
    if (this.isTauri) {
      return invoke('cube_mail_add_account_with_oauth', {
        email,
        name,
        provider,
        accessToken,
        refreshToken,
      });
    }
    
    const response = await fetch('/api/mail/accounts/oauth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, provider, accessToken, refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error(`Account creation failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Generate state parameter for CSRF protection
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Build authorization URL
   */
  private buildAuthUrl(config: OAuth2Config, state: string): string {
    const baseUrls: Record<OAuth2Provider, string> = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      yahoo: 'https://api.login.yahoo.com/oauth2/request_auth',
    };

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `${baseUrls[config.provider]}?${params.toString()}`;
  }

  /**
   * Handle OAuth2 callback from redirect
   */
  handleCallback(callbackUrl: string): { code: string; state: string } | null {
    try {
      const url = new URL(callbackUrl);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Missing code or state in callback');
      }

      return { code, state };
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const oauth2Service = OAuth2Service.getInstance();

// Export class for testing
export { OAuth2Service };
