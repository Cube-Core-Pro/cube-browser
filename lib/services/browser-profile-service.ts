/**
 * Browser Profile Service - Multi-Profile Session Management
 *
 * Provides isolated browser sessions with separate cookies, storage,
 * and fingerprints for professional automation and testing.
 *
 * M5 Features:
 * - Isolated browser profiles
 * - Session persistence
 * - Cookie management
 * - Storage isolation
 * - Profile groups
 * - Import/Export
 * - Cloud sync
 *
 * @module BrowserProfileService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService, SpanKind } from './telemetry-service';
import type { BrowserFingerprint } from './browser-fingerprint-service';

// ============================================================================
// Types
// ============================================================================

export interface BrowserProfile {
  /**
   * Unique profile identifier
   */
  id: string;

  /**
   * Profile display name
   */
  name: string;

  /**
   * Profile color for UI
   */
  color: ProfileColor;

  /**
   * Profile icon
   */
  icon?: string;

  /**
   * Profile group
   */
  groupId?: string;

  /**
   * Associated fingerprint profile
   */
  fingerprintId?: string;

  /**
   * Proxy configuration
   */
  proxy?: ProxyConfig;

  /**
   * Startup URL
   */
  startupUrl?: string;

  /**
   * Homepage URL
   */
  homepage?: string;

  /**
   * User data directory
   */
  userDataDir: string;

  /**
   * Cookie settings
   */
  cookieSettings: CookieSettings;

  /**
   * Storage settings
   */
  storageSettings: StorageSettings;

  /**
   * Extensions to load
   */
  extensions: string[];

  /**
   * Launch arguments
   */
  launchArgs: string[];

  /**
   * Environment variables
   */
  envVars: Record<string, string>;

  /**
   * Notes
   */
  notes?: string;

  /**
   * Tags for organization
   */
  tags: string[];

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last used timestamp
   */
  lastUsedAt?: number;

  /**
   * Total usage count
   */
  usageCount: number;

  /**
   * Is profile active
   */
  isActive: boolean;

  /**
   * Profile status
   */
  status: ProfileStatus;
}

export type ProfileColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'gray';

export type ProfileStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'error';

export interface ProxyConfig {
  /**
   * Proxy type
   */
  type: 'http' | 'https' | 'socks4' | 'socks5';

  /**
   * Proxy host
   */
  host: string;

  /**
   * Proxy port
   */
  port: number;

  /**
   * Username for authentication
   */
  username?: string;

  /**
   * Password for authentication
   */
  password?: string;

  /**
   * Bypass list (comma-separated)
   */
  bypassList?: string;

  /**
   * Enable proxy rotation
   */
  rotation?: {
    enabled: boolean;
    interval: number; // seconds
    proxies: ProxyConfig[];
  };
}

export interface CookieSettings {
  /**
   * Accept cookies
   */
  acceptCookies: boolean;

  /**
   * Third-party cookies
   */
  thirdPartyCookies: 'allow' | 'block' | 'block-known-trackers';

  /**
   * Clear cookies on close
   */
  clearOnClose: boolean;

  /**
   * Cookie lifetime override
   */
  lifetimeOverride?: number;

  /**
   * Cookie whitelist (domains)
   */
  whitelist: string[];

  /**
   * Cookie blacklist (domains)
   */
  blacklist: string[];
}

export interface StorageSettings {
  /**
   * Enable local storage
   */
  localStorage: boolean;

  /**
   * Enable session storage
   */
  sessionStorage: boolean;

  /**
   * Enable IndexedDB
   */
  indexedDB: boolean;

  /**
   * Enable Web SQL
   */
  webSQL: boolean;

  /**
   * Clear on close
   */
  clearOnClose: boolean;

  /**
   * Storage quota (bytes)
   */
  quota?: number;
}

export interface ProfileGroup {
  /**
   * Group ID
   */
  id: string;

  /**
   * Group name
   */
  name: string;

  /**
   * Group color
   */
  color: ProfileColor;

  /**
   * Group description
   */
  description?: string;

  /**
   * Profile IDs in this group
   */
  profileIds: string[];

  /**
   * Sort order
   */
  sortOrder: number;

  /**
   * Creation timestamp
   */
  createdAt: number;
}

export interface ProfileSession {
  /**
   * Session ID
   */
  id: string;

  /**
   * Profile ID
   */
  profileId: string;

  /**
   * Process ID
   */
  pid?: number;

  /**
   * Debug port
   */
  debugPort?: number;

  /**
   * WebSocket URL
   */
  wsUrl?: string;

  /**
   * Current URL
   */
  currentUrl?: string;

  /**
   * Session status
   */
  status: 'connecting' | 'connected' | 'disconnected' | 'error';

  /**
   * Start timestamp
   */
  startedAt: number;

  /**
   * Error message if any
   */
  error?: string;
}

export interface ProfileExport {
  version: string;
  exportedAt: number;
  profiles: BrowserProfile[];
  groups: ProfileGroup[];
  fingerprints?: BrowserFingerprint[];
}

export interface ProfileImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ============================================================================
// Browser Profile Service
// ============================================================================

export const BrowserProfileService = {
  /**
   * Create a new browser profile
   */
  createProfile: async (
    name: string,
    options?: Partial<BrowserProfile>
  ): Promise<BrowserProfile> => {
    TelemetryService.trackEvent('browser_profile_created');

    return invoke<BrowserProfile>('browser_create_profile', {
      name,
      options,
    });
  },

  /**
   * Get all profiles
   */
  getProfiles: async (options?: {
    groupId?: string;
    tags?: string[];
    includeInactive?: boolean;
  }): Promise<BrowserProfile[]> => {
    return invoke<BrowserProfile[]>('browser_get_profiles', { options });
  },

  /**
   * Get profile by ID
   */
  getProfile: async (profileId: string): Promise<BrowserProfile | null> => {
    return invoke<BrowserProfile | null>('browser_get_profile', { profileId });
  },

  /**
   * Update profile
   */
  updateProfile: async (
    profileId: string,
    updates: Partial<BrowserProfile>
  ): Promise<BrowserProfile> => {
    return invoke<BrowserProfile>('browser_update_profile', {
      profileId,
      updates,
    });
  },

  /**
   * Delete profile
   */
  deleteProfile: async (
    profileId: string,
    deleteData?: boolean
  ): Promise<void> => {
    TelemetryService.trackEvent('browser_profile_deleted');

    return invoke('browser_delete_profile', { profileId, deleteData });
  },

  /**
   * Launch profile
   */
  launchProfile: async (
    profileId: string,
    options?: {
      url?: string;
      headless?: boolean;
      windowSize?: { width: number; height: number };
    }
  ): Promise<ProfileSession> => {
    const spanId = TelemetryService.startSpan('browser.profile.launch', {
      kind: SpanKind.CLIENT,
    });

    try {
      const session = await invoke<ProfileSession>('browser_launch_profile', {
        profileId,
        options,
      });
      TelemetryService.trackEvent('browser_profile_launched', { profileId });
      TelemetryService.endSpan(spanId);
      return session;
    } catch (error) {
      TelemetryService.endSpan(spanId, { code: 2, message: String(error) });
      throw error;
    }
  },

  /**
   * Close profile session
   */
  closeSession: async (sessionId: string): Promise<void> => {
    return invoke('browser_close_session', { sessionId });
  },

  /**
   * Get active sessions
   */
  getActiveSessions: async (): Promise<ProfileSession[]> => {
    return invoke<ProfileSession[]>('browser_get_active_sessions');
  },

  /**
   * Get session by profile
   */
  getSessionByProfile: async (
    profileId: string
  ): Promise<ProfileSession | null> => {
    return invoke<ProfileSession | null>('browser_get_session_by_profile', {
      profileId,
    });
  },

  /**
   * Clone profile
   */
  cloneProfile: async (
    profileId: string,
    name: string,
    includeData?: boolean
  ): Promise<BrowserProfile> => {
    return invoke<BrowserProfile>('browser_clone_profile', {
      profileId,
      name,
      includeData,
    });
  },

  /**
   * Export profiles
   */
  exportProfiles: async (
    profileIds: string[],
    includeFingerprints?: boolean
  ): Promise<string> => {
    return invoke<string>('browser_export_profiles', {
      profileIds,
      includeFingerprints,
    });
  },

  /**
   * Import profiles
   */
  importProfiles: async (data: string): Promise<ProfileImportResult> => {
    return invoke<ProfileImportResult>('browser_import_profiles', { data });
  },

  /**
   * Create profile group
   */
  createGroup: async (
    name: string,
    options?: Partial<ProfileGroup>
  ): Promise<ProfileGroup> => {
    return invoke<ProfileGroup>('browser_create_profile_group', {
      name,
      options,
    });
  },

  /**
   * Get all groups
   */
  getGroups: async (): Promise<ProfileGroup[]> => {
    return invoke<ProfileGroup[]>('browser_get_profile_groups');
  },

  /**
   * Update group
   */
  updateGroup: async (
    groupId: string,
    updates: Partial<ProfileGroup>
  ): Promise<ProfileGroup> => {
    return invoke<ProfileGroup>('browser_update_profile_group', {
      groupId,
      updates,
    });
  },

  /**
   * Delete group
   */
  deleteGroup: async (
    groupId: string,
    deleteProfiles?: boolean
  ): Promise<void> => {
    return invoke('browser_delete_profile_group', { groupId, deleteProfiles });
  },

  /**
   * Add profile to group
   */
  addToGroup: async (profileId: string, groupId: string): Promise<void> => {
    return invoke('browser_add_profile_to_group', { profileId, groupId });
  },

  /**
   * Remove profile from group
   */
  removeFromGroup: async (profileId: string): Promise<void> => {
    return invoke('browser_remove_profile_from_group', { profileId });
  },

  /**
   * Get profile cookies
   */
  getCookies: async (
    profileId: string,
    domain?: string
  ): Promise<ProfileCookie[]> => {
    return invoke<ProfileCookie[]>('browser_get_profile_cookies', {
      profileId,
      domain,
    });
  },

  /**
   * Set profile cookies
   */
  setCookies: async (
    profileId: string,
    cookies: ProfileCookie[]
  ): Promise<void> => {
    return invoke('browser_set_profile_cookies', { profileId, cookies });
  },

  /**
   * Clear profile cookies
   */
  clearCookies: async (profileId: string, domain?: string): Promise<void> => {
    return invoke('browser_clear_profile_cookies', { profileId, domain });
  },

  /**
   * Get profile storage
   */
  getStorage: async (
    profileId: string,
    origin: string,
    storageType: 'local' | 'session'
  ): Promise<Record<string, string>> => {
    return invoke<Record<string, string>>('browser_get_profile_storage', {
      profileId,
      origin,
      storageType,
    });
  },

  /**
   * Set profile storage
   */
  setStorage: async (
    profileId: string,
    origin: string,
    storageType: 'local' | 'session',
    data: Record<string, string>
  ): Promise<void> => {
    return invoke('browser_set_profile_storage', {
      profileId,
      origin,
      storageType,
      data,
    });
  },

  /**
   * Clear profile storage
   */
  clearStorage: async (
    profileId: string,
    origin?: string,
    storageType?: 'local' | 'session' | 'all'
  ): Promise<void> => {
    return invoke('browser_clear_profile_storage', {
      profileId,
      origin,
      storageType,
    });
  },

  /**
   * Get profile size
   */
  getProfileSize: async (profileId: string): Promise<ProfileSize> => {
    return invoke<ProfileSize>('browser_get_profile_size', { profileId });
  },

  /**
   * Clean profile data
   */
  cleanProfile: async (
    profileId: string,
    options: CleanOptions
  ): Promise<void> => {
    return invoke('browser_clean_profile', { profileId, options });
  },

  /**
   * Set proxy for profile
   */
  setProxy: async (profileId: string, proxy: ProxyConfig): Promise<void> => {
    return invoke('browser_set_profile_proxy', { profileId, proxy });
  },

  /**
   * Clear proxy for profile
   */
  clearProxy: async (profileId: string): Promise<void> => {
    return invoke('browser_clear_profile_proxy', { profileId });
  },

  /**
   * Test proxy connection
   */
  testProxy: async (proxy: ProxyConfig): Promise<ProxyTestResult> => {
    return invoke<ProxyTestResult>('browser_test_proxy', { proxy });
  },

  /**
   * Link fingerprint to profile
   */
  linkFingerprint: async (
    profileId: string,
    fingerprintId: string
  ): Promise<void> => {
    return invoke('browser_link_fingerprint', { profileId, fingerprintId });
  },

  /**
   * Unlink fingerprint from profile
   */
  unlinkFingerprint: async (profileId: string): Promise<void> => {
    return invoke('browser_unlink_fingerprint', { profileId });
  },
};

// ============================================================================
// Additional Types
// ============================================================================

export interface ProfileCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
}

export interface ProfileSize {
  total: number;
  cookies: number;
  localStorage: number;
  indexedDB: number;
  cache: number;
  history: number;
}

export interface CleanOptions {
  cookies?: boolean;
  localStorage?: boolean;
  sessionStorage?: boolean;
  indexedDB?: boolean;
  cache?: boolean;
  history?: boolean;
  passwords?: boolean;
  autofill?: boolean;
}

export interface ProxyTestResult {
  success: boolean;
  latency?: number;
  ip?: string;
  country?: string;
  error?: string;
}

// ============================================================================
// Bulk Operations
// ============================================================================

export const BrowserProfileBulkOperations = {
  /**
   * Launch multiple profiles
   */
  launchMultiple: async (
    profileIds: string[],
    options?: {
      delay?: number;
      headless?: boolean;
    }
  ): Promise<ProfileSession[]> => {
    return invoke<ProfileSession[]>('browser_launch_multiple_profiles', {
      profileIds,
      options,
    });
  },

  /**
   * Close multiple sessions
   */
  closeMultiple: async (sessionIds: string[]): Promise<void> => {
    return invoke('browser_close_multiple_sessions', { sessionIds });
  },

  /**
   * Delete multiple profiles
   */
  deleteMultiple: async (
    profileIds: string[],
    deleteData?: boolean
  ): Promise<{ deleted: number; errors: string[] }> => {
    return invoke('browser_delete_multiple_profiles', {
      profileIds,
      deleteData,
    });
  },

  /**
   * Clean multiple profiles
   */
  cleanMultiple: async (
    profileIds: string[],
    options: CleanOptions
  ): Promise<void> => {
    return invoke('browser_clean_multiple_profiles', { profileIds, options });
  },

  /**
   * Apply settings to multiple profiles
   */
  applySettings: async (
    profileIds: string[],
    settings: Partial<BrowserProfile>
  ): Promise<void> => {
    return invoke('browser_apply_settings_to_profiles', {
      profileIds,
      settings,
    });
  },
};

// ============================================================================
// Export
// ============================================================================

export default BrowserProfileService;
