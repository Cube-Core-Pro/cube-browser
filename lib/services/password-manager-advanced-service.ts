/**
 * Password Manager Advanced Service - Enterprise Credential Management
 *
 * Enterprise-grade password and credential management with FIDO2/WebAuthn
 * support, passkeys, breach monitoring, and advanced security features.
 *
 * M5 Features:
 * - FIDO2/WebAuthn authentication
 * - Passkeys support
 * - Password rotation policies
 * - Breach monitoring (HaveIBeenPwned integration)
 * - Secure sharing
 * - Emergency access
 * - Password health scoring
 * - One-time passwords (TOTP/HOTP)
 * - Secure notes encryption
 *
 * @module PasswordManagerAdvancedService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService, SpanKind } from './telemetry-service';

// ============================================================================
// FIDO2/WebAuthn Types
// ============================================================================

export interface WebAuthnCredential {
  /**
   * Credential ID
   */
  id: string;

  /**
   * Credential name/label
   */
  name: string;

  /**
   * Credential type
   */
  type: 'platform' | 'cross-platform';

  /**
   * Authenticator type
   */
  authenticatorType: AuthenticatorType;

  /**
   * Public key
   */
  publicKey: string;

  /**
   * Sign count
   */
  signCount: number;

  /**
   * User ID
   */
  userId: string;

  /**
   * AAGUID (Authenticator Attestation GUID)
   */
  aaguid?: string;

  /**
   * Attestation format
   */
  attestationFormat?: string;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last used timestamp
   */
  lastUsedAt?: number;

  /**
   * Usage count
   */
  usageCount: number;

  /**
   * Transports
   */
  transports: AuthenticatorTransport[];

  /**
   * Is revoked
   */
  isRevoked: boolean;

  /**
   * Device info
   */
  deviceInfo?: {
    name: string;
    platform?: string;
    browser?: string;
  };
}

export type AuthenticatorType =
  | 'platform'
  | 'roaming'
  | 'security-key'
  | 'built-in';

export type AuthenticatorTransport =
  | 'usb'
  | 'nfc'
  | 'ble'
  | 'internal'
  | 'hybrid';

export interface WebAuthnRegistrationOptions {
  /**
   * Relying party info
   */
  rp: RelyingParty;

  /**
   * User info
   */
  user: WebAuthnUser;

  /**
   * Challenge (base64)
   */
  challenge: string;

  /**
   * Attestation preference
   */
  attestation: 'none' | 'indirect' | 'direct' | 'enterprise';

  /**
   * Authenticator selection
   */
  authenticatorSelection?: AuthenticatorSelection;

  /**
   * Timeout (ms)
   */
  timeout?: number;

  /**
   * Excluded credentials
   */
  excludeCredentials?: PublicKeyCredentialDescriptor[];

  /**
   * Extensions
   */
  extensions?: AuthenticationExtensions;
}

export interface RelyingParty {
  id: string;
  name: string;
  icon?: string;
}

export interface WebAuthnUser {
  id: string;
  name: string;
  displayName: string;
}

export interface AuthenticatorSelection {
  authenticatorAttachment?: 'platform' | 'cross-platform';
  residentKey?: 'discouraged' | 'preferred' | 'required';
  requireResidentKey?: boolean;
  userVerification?: 'required' | 'preferred' | 'discouraged';
}

export interface PublicKeyCredentialDescriptor {
  type: 'public-key';
  id: string;
  transports?: AuthenticatorTransport[];
}

export interface AuthenticationExtensions {
  credProps?: boolean;
  largeBlob?: {
    support?: 'required' | 'preferred';
    read?: boolean;
    write?: ArrayBuffer;
  };
  prf?: {
    eval?: { first: ArrayBuffer; second?: ArrayBuffer };
    evalByCredential?: Record<string, { first: ArrayBuffer; second?: ArrayBuffer }>;
  };
}

export interface WebAuthnAuthenticationOptions {
  /**
   * Challenge (base64)
   */
  challenge: string;

  /**
   * Relying party ID
   */
  rpId: string;

  /**
   * Allowed credentials
   */
  allowCredentials?: PublicKeyCredentialDescriptor[];

  /**
   * User verification requirement
   */
  userVerification?: 'required' | 'preferred' | 'discouraged';

  /**
   * Timeout (ms)
   */
  timeout?: number;

  /**
   * Extensions
   */
  extensions?: AuthenticationExtensions;
}

export interface WebAuthnRegistrationResult {
  credentialId: string;
  publicKey: string;
  attestationObject: string;
  clientDataJSON: string;
  transports: AuthenticatorTransport[];
  authenticatorData?: string;
}

export interface WebAuthnAuthenticationResult {
  credentialId: string;
  authenticatorData: string;
  clientDataJSON: string;
  signature: string;
  userHandle?: string;
}

// ============================================================================
// Passkey Types
// ============================================================================

export interface Passkey {
  /**
   * Passkey ID
   */
  id: string;

  /**
   * Credential ID (from WebAuthn)
   */
  credentialId: string;

  /**
   * Associated domain
   */
  domain: string;

  /**
   * Username
   */
  username: string;

  /**
   * Display name
   */
  displayName: string;

  /**
   * User handle
   */
  userHandle: string;

  /**
   * Public key
   */
  publicKey: string;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last used timestamp
   */
  lastUsedAt?: number;

  /**
   * Usage count
   */
  usageCount: number;

  /**
   * Backup eligible
   */
  backupEligible: boolean;

  /**
   * Backup state (synced to cloud)
   */
  backedUp: boolean;

  /**
   * Device info
   */
  device?: {
    name: string;
    type: 'mobile' | 'desktop' | 'tablet';
    platform: string;
  };

  /**
   * Notes
   */
  notes?: string;

  /**
   * Tags
   */
  tags: string[];
}

export interface PasskeyCreateOptions {
  domain: string;
  username: string;
  displayName?: string;
  userHandle?: string;
}

// ============================================================================
// Password Rotation Types
// ============================================================================

export interface PasswordRotationPolicy {
  /**
   * Policy ID
   */
  id: string;

  /**
   * Policy name
   */
  name: string;

  /**
   * Policy description
   */
  description?: string;

  /**
   * Rotation interval (days)
   */
  rotationInterval: number;

  /**
   * Password requirements
   */
  requirements: PasswordRequirements;

  /**
   * Notification settings
   */
  notifications: NotificationSettings;

  /**
   * Auto-rotation settings
   */
  autoRotation: AutoRotationSettings;

  /**
   * Applies to entries
   */
  entryIds: string[];

  /**
   * Applies to categories
   */
  categoryIds: string[];

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Creation timestamp
   */
  createdAt: number;
}

export interface PasswordRequirements {
  minLength: number;
  maxLength?: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  excludeSimilar: boolean; // Exclude similar chars (l, 1, I, O, 0)
  excludeAmbiguous: boolean; // Exclude ambiguous chars ({, }, [, ], etc.)
  customExclude?: string; // Custom characters to exclude
  noRepeating: boolean; // No repeating characters
  maxRepeating?: number; // Max repeating allowed
  preventPreviousPasswords: number; // Prevent last N passwords
}

export interface NotificationSettings {
  notifyDaysBefore: number[];
  notifyEmail: boolean;
  notifyInApp: boolean;
  notifySlack?: string;
  notifyWebhook?: string;
}

export interface AutoRotationSettings {
  enabled: boolean;
  generatePassword: boolean;
  updateOnSite: boolean; // Attempt auto-update on website
  requireApproval: boolean;
}

export interface PasswordRotationSchedule {
  entryId: string;
  policyId: string;
  lastRotated: number;
  nextRotation: number;
  status: 'scheduled' | 'due' | 'overdue' | 'rotating' | 'completed' | 'failed';
  failureReason?: string;
  rotationHistory: PasswordRotationRecord[];
}

export interface PasswordRotationRecord {
  timestamp: number;
  success: boolean;
  method: 'manual' | 'auto' | 'forced';
  previousPasswordHash?: string;
  error?: string;
}

// ============================================================================
// Breach Monitoring Types
// ============================================================================

export interface BreachMonitor {
  /**
   * Monitor ID
   */
  id: string;

  /**
   * Email address to monitor
   */
  email: string;

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Last checked timestamp
   */
  lastChecked?: number;

  /**
   * Check interval (hours)
   */
  checkInterval: number;

  /**
   * Known breaches
   */
  knownBreaches: string[];

  /**
   * Notification settings
   */
  notifications: {
    email: boolean;
    inApp: boolean;
  };

  /**
   * Creation timestamp
   */
  createdAt: number;
}

export interface BreachResult {
  /**
   * Email checked
   */
  email: string;

  /**
   * Was found in breaches
   */
  isBreached: boolean;

  /**
   * Number of breaches
   */
  breachCount: number;

  /**
   * Breach details
   */
  breaches: Breach[];

  /**
   * Check timestamp
   */
  checkedAt: number;
}

export interface Breach {
  /**
   * Breach name
   */
  name: string;

  /**
   * Breach title
   */
  title: string;

  /**
   * Breach domain
   */
  domain: string;

  /**
   * Breach date
   */
  breachDate: string;

  /**
   * Date added to database
   */
  addedDate: string;

  /**
   * Modified date
   */
  modifiedDate?: string;

  /**
   * Number of accounts affected
   */
  pwnCount: number;

  /**
   * Description
   */
  description: string;

  /**
   * Data classes exposed
   */
  dataClasses: string[];

  /**
   * Is verified
   */
  isVerified: boolean;

  /**
   * Is fabricated
   */
  isFabricated: boolean;

  /**
   * Is sensitive
   */
  isSensitive: boolean;

  /**
   * Is retired
   */
  isRetired: boolean;

  /**
   * Is spam list
   */
  isSpamList: boolean;

  /**
   * Logo path
   */
  logoPath?: string;
}

export interface PasswordBreachCheck {
  /**
   * Password hash (first 5 chars of SHA-1)
   */
  hashPrefix: string;

  /**
   * Is breached
   */
  isBreached: boolean;

  /**
   * Times seen in breaches
   */
  occurrences: number;

  /**
   * Check timestamp
   */
  checkedAt: number;
}

// ============================================================================
// Password Health Types
// ============================================================================

export interface PasswordHealthReport {
  /**
   * Overall score (0-100)
   */
  overallScore: number;

  /**
   * Total entries analyzed
   */
  totalEntries: number;

  /**
   * Weak passwords count
   */
  weakCount: number;

  /**
   * Reused passwords count
   */
  reusedCount: number;

  /**
   * Old passwords count
   */
  oldCount: number;

  /**
   * Breached passwords count
   */
  breachedCount: number;

  /**
   * No 2FA count
   */
  no2FACount: number;

  /**
   * Issues by category
   */
  issues: PasswordHealthIssue[];

  /**
   * Recommendations
   */
  recommendations: string[];

  /**
   * Generated timestamp
   */
  generatedAt: number;
}

export interface PasswordHealthIssue {
  type: 'weak' | 'reused' | 'old' | 'breached' | 'no-2fa' | 'short' | 'no-special';
  entryId: string;
  entryName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

export interface PasswordStrength {
  score: number; // 0-4 (very weak to very strong)
  level: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  feedback: {
    warning?: string;
    suggestions: string[];
  };
  crackTime: {
    onlineThrottled: string;
    onlineNoThrottling: string;
    offlineSlow: string;
    offlineFast: string;
  };
  guesses: number;
  sequence: PasswordPattern[];
}

export interface PasswordPattern {
  pattern: 'dictionary' | 'spatial' | 'repeat' | 'sequence' | 'date' | 'bruteforce';
  token: string;
  baseGuesses: number;
  guesses: number;
  guessesLog10: number;
}

// ============================================================================
// TOTP/HOTP Types
// ============================================================================

export interface TOTPSecret {
  /**
   * Secret ID
   */
  id: string;

  /**
   * Associated entry ID
   */
  entryId?: string;

  /**
   * Issuer name
   */
  issuer: string;

  /**
   * Account name
   */
  accountName: string;

  /**
   * Secret key (base32)
   */
  secret: string;

  /**
   * Algorithm
   */
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';

  /**
   * Digits count
   */
  digits: 6 | 8;

  /**
   * Period (seconds)
   */
  period: number;

  /**
   * Counter (for HOTP)
   */
  counter?: number;

  /**
   * Type
   */
  type: 'totp' | 'hotp';

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Notes
   */
  notes?: string;
}

export interface TOTPCode {
  code: string;
  remaining: number; // seconds until expiry
  period: number;
}

// ============================================================================
// Secure Sharing Types
// ============================================================================

export interface SecureShare {
  /**
   * Share ID
   */
  id: string;

  /**
   * Entry ID
   */
  entryId: string;

  /**
   * Shared by user
   */
  sharedBy: string;

  /**
   * Shared with (email or user ID)
   */
  sharedWith: string;

  /**
   * Share type
   */
  type: 'view' | 'edit' | 'full';

  /**
   * Expiration timestamp
   */
  expiresAt?: number;

  /**
   * Access count limit
   */
  accessLimit?: number;

  /**
   * Current access count
   */
  accessCount: number;

  /**
   * Require password
   */
  requirePassword: boolean;

  /**
   * Password hash (if required)
   */
  passwordHash?: string;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last accessed
   */
  lastAccessedAt?: number;

  /**
   * Is active
   */
  isActive: boolean;

  /**
   * One-time link
   */
  oneTimeLink?: string;
}

export interface ShareLink {
  url: string;
  expiresAt?: number;
  accessLimit?: number;
  passwordProtected: boolean;
}

// ============================================================================
// Emergency Access Types
// ============================================================================

export interface EmergencyContact {
  /**
   * Contact ID
   */
  id: string;

  /**
   * Contact name
   */
  name: string;

  /**
   * Contact email
   */
  email: string;

  /**
   * Access type
   */
  accessType: 'view' | 'takeover';

  /**
   * Wait time (days)
   */
  waitTime: number;

  /**
   * Status
   */
  status: EmergencyContactStatus;

  /**
   * Request timestamp
   */
  requestedAt?: number;

  /**
   * Approval timestamp
   */
  approvedAt?: number;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Notes
   */
  notes?: string;
}

export type EmergencyContactStatus =
  | 'invited'
  | 'confirmed'
  | 'request-pending'
  | 'request-approved'
  | 'request-denied'
  | 'active';

export interface EmergencyAccessRequest {
  id: string;
  contactId: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  requestedAt: number;
  waitUntil: number;
  respondedAt?: number;
  grantedAt?: number;
}

// ============================================================================
// FIDO2/WebAuthn Service
// ============================================================================

export const WebAuthnService = {
  /**
   * Register a new credential
   */
  register: async (
    options: WebAuthnRegistrationOptions
  ): Promise<WebAuthnRegistrationResult> => {
    const spanId = TelemetryService.startSpan('webauthn.register', {
      kind: SpanKind.CLIENT,
    });

    try {
      const result = await invoke<WebAuthnRegistrationResult>(
        'webauthn_register',
        { options }
      );
      TelemetryService.trackEvent('webauthn_credential_registered');
      TelemetryService.endSpan(spanId);
      return result;
    } catch (error) {
      TelemetryService.endSpan(spanId, { code: 2, message: String(error) });
      throw error;
    }
  },

  /**
   * Authenticate with credential
   */
  authenticate: async (
    options: WebAuthnAuthenticationOptions
  ): Promise<WebAuthnAuthenticationResult> => {
    const spanId = TelemetryService.startSpan('webauthn.authenticate', {
      kind: SpanKind.CLIENT,
    });

    try {
      const result = await invoke<WebAuthnAuthenticationResult>(
        'webauthn_authenticate',
        { options }
      );
      TelemetryService.trackEvent('webauthn_authentication_success');
      TelemetryService.endSpan(spanId);
      return result;
    } catch (error) {
      TelemetryService.trackEvent('webauthn_authentication_failed');
      TelemetryService.endSpan(spanId, { code: 2, message: String(error) });
      throw error;
    }
  },

  /**
   * Get all credentials
   */
  getCredentials: async (): Promise<WebAuthnCredential[]> => {
    return invoke<WebAuthnCredential[]>('webauthn_get_credentials');
  },

  /**
   * Get credential by ID
   */
  getCredential: async (
    credentialId: string
  ): Promise<WebAuthnCredential | null> => {
    return invoke<WebAuthnCredential | null>('webauthn_get_credential', {
      credentialId,
    });
  },

  /**
   * Revoke credential
   */
  revokeCredential: async (credentialId: string): Promise<void> => {
    TelemetryService.trackEvent('webauthn_credential_revoked');

    return invoke('webauthn_revoke_credential', { credentialId });
  },

  /**
   * Delete credential
   */
  deleteCredential: async (credentialId: string): Promise<void> => {
    return invoke('webauthn_delete_credential', { credentialId });
  },

  /**
   * Update credential name
   */
  updateCredentialName: async (
    credentialId: string,
    name: string
  ): Promise<void> => {
    return invoke('webauthn_update_credential_name', { credentialId, name });
  },

  /**
   * Check if platform authenticator is available
   */
  isPlatformAvailable: async (): Promise<boolean> => {
    return invoke<boolean>('webauthn_is_platform_available');
  },

  /**
   * Check if conditional mediation is available
   */
  isConditionalMediationAvailable: async (): Promise<boolean> => {
    return invoke<boolean>('webauthn_is_conditional_available');
  },
};

// ============================================================================
// Passkey Service
// ============================================================================

export const PasskeyService = {
  /**
   * Create a passkey
   */
  create: async (options: PasskeyCreateOptions): Promise<Passkey> => {
    TelemetryService.trackEvent('passkey_created');

    return invoke<Passkey>('passkey_create', { options });
  },

  /**
   * Get all passkeys
   */
  getPasskeys: async (domain?: string): Promise<Passkey[]> => {
    return invoke<Passkey[]>('passkey_get_all', { domain });
  },

  /**
   * Get passkey by ID
   */
  getPasskey: async (passkeyId: string): Promise<Passkey | null> => {
    return invoke<Passkey | null>('passkey_get', { passkeyId });
  },

  /**
   * Delete passkey
   */
  deletePasskey: async (passkeyId: string): Promise<void> => {
    TelemetryService.trackEvent('passkey_deleted');

    return invoke('passkey_delete', { passkeyId });
  },

  /**
   * Authenticate with passkey
   */
  authenticate: async (
    domain: string,
    options?: { conditional?: boolean }
  ): Promise<WebAuthnAuthenticationResult> => {
    return invoke<WebAuthnAuthenticationResult>('passkey_authenticate', {
      domain,
      options,
    });
  },

  /**
   * Update passkey
   */
  updatePasskey: async (
    passkeyId: string,
    updates: Partial<Passkey>
  ): Promise<Passkey> => {
    return invoke<Passkey>('passkey_update', { passkeyId, updates });
  },

  /**
   * Export passkeys
   */
  exportPasskeys: async (): Promise<string> => {
    return invoke<string>('passkey_export');
  },

  /**
   * Import passkeys
   */
  importPasskeys: async (data: string): Promise<{ imported: number }> => {
    return invoke('passkey_import', { data });
  },
};

// ============================================================================
// Password Rotation Service
// ============================================================================

export const PasswordRotationService = {
  /**
   * Create rotation policy
   */
  createPolicy: async (
    policy: Omit<PasswordRotationPolicy, 'id' | 'createdAt'>
  ): Promise<PasswordRotationPolicy> => {
    TelemetryService.trackEvent('rotation_policy_created');

    return invoke<PasswordRotationPolicy>('rotation_create_policy', { policy });
  },

  /**
   * Get all policies
   */
  getPolicies: async (): Promise<PasswordRotationPolicy[]> => {
    return invoke<PasswordRotationPolicy[]>('rotation_get_policies');
  },

  /**
   * Get policy by ID
   */
  getPolicy: async (
    policyId: string
  ): Promise<PasswordRotationPolicy | null> => {
    return invoke<PasswordRotationPolicy | null>('rotation_get_policy', {
      policyId,
    });
  },

  /**
   * Update policy
   */
  updatePolicy: async (
    policyId: string,
    updates: Partial<PasswordRotationPolicy>
  ): Promise<PasswordRotationPolicy> => {
    return invoke<PasswordRotationPolicy>('rotation_update_policy', {
      policyId,
      updates,
    });
  },

  /**
   * Delete policy
   */
  deletePolicy: async (policyId: string): Promise<void> => {
    return invoke('rotation_delete_policy', { policyId });
  },

  /**
   * Get rotation schedules
   */
  getSchedules: async (
    filters?: { status?: string; entryIds?: string[] }
  ): Promise<PasswordRotationSchedule[]> => {
    return invoke<PasswordRotationSchedule[]>('rotation_get_schedules', {
      filters,
    });
  },

  /**
   * Get schedule for entry
   */
  getScheduleForEntry: async (
    entryId: string
  ): Promise<PasswordRotationSchedule | null> => {
    return invoke<PasswordRotationSchedule | null>(
      'rotation_get_schedule_for_entry',
      { entryId }
    );
  },

  /**
   * Rotate password now
   */
  rotateNow: async (
    entryId: string,
    newPassword?: string
  ): Promise<{ success: boolean; error?: string }> => {
    TelemetryService.trackEvent('password_rotated');

    return invoke('rotation_rotate_now', { entryId, newPassword });
  },

  /**
   * Skip rotation
   */
  skipRotation: async (
    entryId: string,
    reason: string
  ): Promise<void> => {
    return invoke('rotation_skip', { entryId, reason });
  },

  /**
   * Get due rotations
   */
  getDueRotations: async (): Promise<PasswordRotationSchedule[]> => {
    return invoke<PasswordRotationSchedule[]>('rotation_get_due');
  },
};

// ============================================================================
// Breach Monitoring Service
// ============================================================================

export const BreachMonitorService = {
  /**
   * Add email to monitor
   */
  addMonitor: async (
    email: string,
    options?: Partial<BreachMonitor>
  ): Promise<BreachMonitor> => {
    TelemetryService.trackEvent('breach_monitor_added');

    return invoke<BreachMonitor>('breach_add_monitor', { email, options });
  },

  /**
   * Get all monitors
   */
  getMonitors: async (): Promise<BreachMonitor[]> => {
    return invoke<BreachMonitor[]>('breach_get_monitors');
  },

  /**
   * Delete monitor
   */
  deleteMonitor: async (monitorId: string): Promise<void> => {
    return invoke('breach_delete_monitor', { monitorId });
  },

  /**
   * Check email for breaches
   */
  checkEmail: async (email: string): Promise<BreachResult> => {
    return invoke<BreachResult>('breach_check_email', { email });
  },

  /**
   * Check all monitored emails
   */
  checkAllMonitors: async (): Promise<{
    checked: number;
    breached: number;
    results: BreachResult[];
  }> => {
    return invoke('breach_check_all');
  },

  /**
   * Check if password is breached (HIBP API)
   */
  checkPassword: async (password: string): Promise<PasswordBreachCheck> => {
    return invoke<PasswordBreachCheck>('breach_check_password', { password });
  },

  /**
   * Get breach details
   */
  getBreachDetails: async (breachName: string): Promise<Breach | null> => {
    return invoke<Breach | null>('breach_get_details', { breachName });
  },

  /**
   * Mark breach as acknowledged
   */
  acknowledgeBreaches: async (
    monitorId: string,
    breachNames: string[]
  ): Promise<void> => {
    return invoke('breach_acknowledge', { monitorId, breachNames });
  },
};

// ============================================================================
// Password Health Service
// ============================================================================

export const PasswordHealthService = {
  /**
   * Generate health report
   */
  generateReport: async (): Promise<PasswordHealthReport> => {
    TelemetryService.trackEvent('password_health_report_generated');

    return invoke<PasswordHealthReport>('password_health_generate_report');
  },

  /**
   * Check password strength
   */
  checkStrength: async (password: string): Promise<PasswordStrength> => {
    return invoke<PasswordStrength>('password_health_check_strength', {
      password,
    });
  },

  /**
   * Find reused passwords
   */
  findReused: async (): Promise<{
    groups: { passwordHash: string; entryIds: string[] }[];
  }> => {
    return invoke('password_health_find_reused');
  },

  /**
   * Find weak passwords
   */
  findWeak: async (
    minStrength?: number
  ): Promise<{ entryId: string; strength: PasswordStrength }[]> => {
    return invoke('password_health_find_weak', { minStrength });
  },

  /**
   * Find old passwords
   */
  findOld: async (
    olderThanDays: number
  ): Promise<{ entryId: string; lastChanged: number }[]> => {
    return invoke('password_health_find_old', { olderThanDays });
  },

  /**
   * Generate secure password
   */
  generatePassword: async (
    requirements: PasswordRequirements
  ): Promise<string> => {
    return invoke<string>('password_health_generate', { requirements });
  },

  /**
   * Generate passphrase
   */
  generatePassphrase: async (options?: {
    wordCount?: number;
    separator?: string;
    capitalize?: boolean;
    includeNumber?: boolean;
  }): Promise<string> => {
    return invoke<string>('password_health_generate_passphrase', { options });
  },
};

// ============================================================================
// TOTP Service
// ============================================================================

export const TOTPService = {
  /**
   * Add TOTP secret
   */
  addSecret: async (
    secret: Omit<TOTPSecret, 'id' | 'createdAt'>
  ): Promise<TOTPSecret> => {
    TelemetryService.trackEvent('totp_secret_added');

    return invoke<TOTPSecret>('totp_add_secret', { secret });
  },

  /**
   * Get all secrets
   */
  getSecrets: async (): Promise<TOTPSecret[]> => {
    return invoke<TOTPSecret[]>('totp_get_secrets');
  },

  /**
   * Get secret by ID
   */
  getSecret: async (secretId: string): Promise<TOTPSecret | null> => {
    return invoke<TOTPSecret | null>('totp_get_secret', { secretId });
  },

  /**
   * Delete secret
   */
  deleteSecret: async (secretId: string): Promise<void> => {
    return invoke('totp_delete_secret', { secretId });
  },

  /**
   * Generate current code
   */
  generateCode: async (secretId: string): Promise<TOTPCode> => {
    return invoke<TOTPCode>('totp_generate_code', { secretId });
  },

  /**
   * Verify code
   */
  verifyCode: async (
    secretId: string,
    code: string
  ): Promise<{ valid: boolean; drift?: number }> => {
    return invoke('totp_verify_code', { secretId, code });
  },

  /**
   * Parse OTP Auth URI
   */
  parseUri: async (uri: string): Promise<Omit<TOTPSecret, 'id' | 'createdAt'>> => {
    return invoke('totp_parse_uri', { uri });
  },

  /**
   * Generate QR code
   */
  generateQR: async (secretId: string): Promise<string> => {
    return invoke<string>('totp_generate_qr', { secretId });
  },
};

// ============================================================================
// Secure Sharing Service
// ============================================================================

export const SecureSharingService = {
  /**
   * Share entry
   */
  shareEntry: async (
    entryId: string,
    options: {
      sharedWith: string;
      type: 'view' | 'edit' | 'full';
      expiresAt?: number;
      accessLimit?: number;
      requirePassword?: boolean;
      password?: string;
    }
  ): Promise<SecureShare> => {
    TelemetryService.trackEvent('entry_shared');

    return invoke<SecureShare>('sharing_share_entry', { entryId, options });
  },

  /**
   * Get shares
   */
  getShares: async (entryId?: string): Promise<SecureShare[]> => {
    return invoke<SecureShare[]>('sharing_get_shares', { entryId });
  },

  /**
   * Get shares with me
   */
  getSharesWithMe: async (): Promise<SecureShare[]> => {
    return invoke<SecureShare[]>('sharing_get_shares_with_me');
  },

  /**
   * Revoke share
   */
  revokeShare: async (shareId: string): Promise<void> => {
    return invoke('sharing_revoke', { shareId });
  },

  /**
   * Generate one-time link
   */
  generateLink: async (
    entryId: string,
    options?: {
      expiresIn?: number;
      accessLimit?: number;
      password?: string;
    }
  ): Promise<ShareLink> => {
    return invoke<ShareLink>('sharing_generate_link', { entryId, options });
  },

  /**
   * Access shared entry
   */
  accessSharedEntry: async (
    shareId: string,
    password?: string
  ): Promise<unknown> => {
    return invoke('sharing_access', { shareId, password });
  },
};

// ============================================================================
// Emergency Access Service
// ============================================================================

export const EmergencyAccessService = {
  /**
   * Add emergency contact
   */
  addContact: async (
    contact: Omit<EmergencyContact, 'id' | 'status' | 'createdAt'>
  ): Promise<EmergencyContact> => {
    TelemetryService.trackEvent('emergency_contact_added');

    return invoke<EmergencyContact>('emergency_add_contact', { contact });
  },

  /**
   * Get all contacts
   */
  getContacts: async (): Promise<EmergencyContact[]> => {
    return invoke<EmergencyContact[]>('emergency_get_contacts');
  },

  /**
   * Remove contact
   */
  removeContact: async (contactId: string): Promise<void> => {
    return invoke('emergency_remove_contact', { contactId });
  },

  /**
   * Request emergency access
   */
  requestAccess: async (contactId: string): Promise<EmergencyAccessRequest> => {
    TelemetryService.trackEvent('emergency_access_requested');

    return invoke<EmergencyAccessRequest>('emergency_request_access', {
      contactId,
    });
  },

  /**
   * Get pending requests
   */
  getPendingRequests: async (): Promise<EmergencyAccessRequest[]> => {
    return invoke<EmergencyAccessRequest[]>('emergency_get_pending');
  },

  /**
   * Respond to request
   */
  respondToRequest: async (
    requestId: string,
    approved: boolean
  ): Promise<void> => {
    return invoke('emergency_respond', { requestId, approved });
  },

  /**
   * Confirm contact invitation
   */
  confirmInvitation: async (token: string): Promise<void> => {
    return invoke('emergency_confirm_invitation', { token });
  },
};

// ============================================================================
// Export
// ============================================================================

export const PasswordManagerAdvancedServices = {
  WebAuthn: WebAuthnService,
  Passkey: PasskeyService,
  Rotation: PasswordRotationService,
  Breach: BreachMonitorService,
  Health: PasswordHealthService,
  TOTP: TOTPService,
  Sharing: SecureSharingService,
  Emergency: EmergencyAccessService,
};

export default PasswordManagerAdvancedServices;
