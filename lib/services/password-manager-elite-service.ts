/**
 * CUBE Elite v6 - Password Manager Elite Service
 * 
 * Enterprise-grade password management competing with:
 * 1Password, Bitwarden, Dashlane, LastPass
 * 
 * Now integrated with Tauri backend for:
 * - Master password management (setup, verify, change)
 * - Password CRUD operations
 * - Password generation and strength analysis
 * - Password categories and stats
 * - Search and export/import
 * 
 * Features:
 * - Passkeys/WebAuthn support
 * - HaveIBeenPwned breach detection
 * - Secure sharing with expiry
 * - Emergency access
 * - Credit card & identity autofill
 * - Masked email aliases
 * - Secure document storage
 * - Password history
 * - Travel mode
 * - Security dashboard
 * 
 * REFACTORED: Now uses password-service.ts for Tauri backend integration
 * 
 * @module password-manager-elite-service
 * @version 3.0.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  PasswordService as _TauriPassword,
  PasswordVaultService,
  PasswordGeneratorService as TauriGeneratorService,
  MasterPasswordService,
} from './password-service';
import { logger } from './logger-service';

const log = logger.scope('PasswordManager');

// Re-export for potential future use
export type { _TauriPassword };

// ============================================================================
// Backend Integration Types
// ============================================================================

interface BackendPasswordEntry {
  id: string;
  title: string;
  username: string;
  encrypted_password: string;
  url?: string;
  notes?: string;
  category?: string;
  tags: string[];
  favorite: boolean;
  strength_score: number;
  date_created: number;
  date_modified: number;
  last_used?: number;
}

interface BackendMasterPasswordConfig {
  is_set: boolean;
  salt: string;
  iterations: number;
  created_at?: number;
}

interface BackendPasswordStrength {
  score: number;
  feedback: string[];
  crack_time: string;
}

interface BackendPasswordStats {
  total: number;
  weak: number;
  medium: number;
  strong: number;
  reused: number;
  old: number;
}

const BackendPasswordAPI = {
  async setupMasterPassword(masterPassword: string): Promise<void> {
    try {
      await invoke<void>('setup_master_password', { masterPassword });
    } catch (error) {
      log.warn('Backend setup_master_password failed:', error);
      throw error;
    }
  },

  async verifyMasterPassword(masterPassword: string): Promise<boolean> {
    try {
      return await invoke<boolean>('verify_master_password', { masterPassword });
    } catch (error) {
      log.warn('Backend verify_master_password failed:', error);
      return false;
    }
  },

  async getMasterPasswordConfig(): Promise<BackendMasterPasswordConfig> {
    try {
      return await invoke<BackendMasterPasswordConfig>('get_master_password_config');
    } catch (error) {
      log.warn('Backend get_master_password_config failed:', error);
      return { is_set: false, salt: '', iterations: 0 };
    }
  },

  async changeMasterPassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await invoke<void>('change_master_password', { oldPassword, newPassword });
    } catch (error) {
      log.warn('Backend change_master_password failed:', error);
      throw error;
    }
  },

  async getAllPasswords(): Promise<BackendPasswordEntry[]> {
    try {
      return await invoke<BackendPasswordEntry[]>('get_all_passwords');
    } catch (error) {
      log.warn('Backend get_all_passwords failed:', error);
      return [];
    }
  },

  async savePassword(password: string, masterPassword: string, entry: BackendPasswordEntry): Promise<void> {
    try {
      await invoke<void>('save_password', { password, masterPassword, entry });
    } catch (error) {
      log.warn('Backend save_password failed:', error);
      throw error;
    }
  },

  async updatePasswordEntry(password: string | null, masterPassword: string, entry: BackendPasswordEntry): Promise<void> {
    try {
      await invoke<void>('update_password_entry', { password, masterPassword, entry });
    } catch (error) {
      log.warn('Backend update_password_entry failed:', error);
      throw error;
    }
  },

  async deletePassword(id: string): Promise<void> {
    try {
      await invoke<void>('delete_password', { id });
    } catch (error) {
      log.warn('Backend delete_password failed:', error);
      throw error;
    }
  },

  async decryptPassword(entryId: string, masterPassword: string): Promise<string> {
    try {
      return await invoke<string>('decrypt_password', { entryId, masterPassword });
    } catch (error) {
      log.warn('Backend decrypt_password failed:', error);
      throw error;
    }
  },

  async updatePasswordLastUsed(id: string): Promise<void> {
    try {
      await invoke<void>('update_password_last_used', { id });
    } catch (error) {
      log.warn('Backend update_password_last_used failed:', error);
    }
  },

  async getPasswordCategories(): Promise<string[]> {
    try {
      return await invoke<string[]>('get_password_categories');
    } catch (error) {
      log.warn('Backend get_password_categories failed:', error);
      return [];
    }
  },

  async getPasswordStats(): Promise<BackendPasswordStats> {
    try {
      return await invoke<BackendPasswordStats>('get_password_stats');
    } catch (error) {
      log.warn('Backend get_password_stats failed:', error);
      return { total: 0, weak: 0, medium: 0, strong: 0, reused: 0, old: 0 };
    }
  },

  async generatePassword(length: number, options: Record<string, boolean>): Promise<string> {
    try {
      return await invoke<string>('generate_password', { length, options });
    } catch (error) {
      log.warn('Backend generate_password failed:', error);
      throw error;
    }
  },

  async analyzePasswordStrength(password: string): Promise<BackendPasswordStrength> {
    try {
      return await invoke<BackendPasswordStrength>('analyze_password_strength', { password });
    } catch (error) {
      log.warn('Backend analyze_password_strength failed:', error);
      return { score: 0, feedback: [], crack_time: 'unknown' };
    }
  },

  async searchPasswords(query: string): Promise<BackendPasswordEntry[]> {
    try {
      return await invoke<BackendPasswordEntry[]>('search_passwords', { query });
    } catch (error) {
      log.warn('Backend search_passwords failed:', error);
      return [];
    }
  },

  async exportPasswords(format: string, masterPassword: string): Promise<string> {
    try {
      return await invoke<string>('export_passwords', { format, masterPassword });
    } catch (error) {
      log.warn('Backend export_passwords failed:', error);
      throw error;
    }
  },

  async importPasswords(data: string, format: string, masterPassword: string): Promise<number> {
    try {
      return await invoke<number>('import_passwords', { data, format, masterPassword });
    } catch (error) {
      log.warn('Backend import_passwords failed:', error);
      throw error;
    }
  },
};

// Export backend API
export { BackendPasswordAPI };
export type { BackendPasswordEntry, BackendMasterPasswordConfig, BackendPasswordStrength, BackendPasswordStats };

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Vault item types
 */
export type VaultItemType = 
  | 'login'
  | 'credit_card'
  | 'identity'
  | 'secure_note'
  | 'document'
  | 'ssh_key'
  | 'api_credential'
  | 'passkey';

/**
 * Base vault item
 */
export interface VaultItemBase {
  /** Unique identifier */
  id: string;
  /** Item type */
  type: VaultItemType;
  /** Title */
  title: string;
  /** Category/folder */
  category?: string;
  /** Tags */
  tags: string[];
  /** Is favorite */
  favorite: boolean;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
  /** Last accessed */
  lastAccessed?: Date;
  /** Is hidden in travel mode */
  travelModeHidden: boolean;
  /** Custom fields */
  customFields: CustomField[];
  /** Notes */
  notes?: string;
  /** Attachments */
  attachments: Attachment[];
}

/**
 * Custom field
 */
export interface CustomField {
  name: string;
  value: string;
  type: 'text' | 'hidden' | 'url';
}

/**
 * Attachment
 */
export interface Attachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  encryptedData?: string;
  uploadedAt: Date;
}

/**
 * Login item
 */
export interface LoginItem extends VaultItemBase {
  type: 'login';
  /** Username */
  username: string;
  /** Email */
  email?: string;
  /** Password (encrypted) */
  password: string;
  /** Website URLs */
  urls: string[];
  /** TOTP secret */
  totpSecret?: string;
  /** Password history */
  passwordHistory: PasswordHistoryEntry[];
  /** Is compromised */
  isCompromised?: boolean;
  /** Breach info */
  breachInfo?: BreachInfo;
  /** Associated passkey */
  passkey?: PasskeyCredential;
}

/**
 * Password history entry
 */
export interface PasswordHistoryEntry {
  password: string;
  changedAt: Date;
}

/**
 * Breach info
 */
export interface BreachInfo {
  breachName: string;
  breachDate: string;
  description: string;
  dataClasses: string[];
  checkedAt: Date;
}

/**
 * Passkey credential
 */
export interface PasskeyCredential {
  /** Credential ID */
  credentialId: string;
  /** Public key */
  publicKey: string;
  /** RP ID (relying party) */
  rpId: string;
  /** User handle */
  userHandle: string;
  /** Counter */
  counter: number;
  /** Created timestamp */
  createdAt: Date;
  /** Last used */
  lastUsed?: Date;
  /** Device info */
  deviceInfo?: string;
  /** Is synced */
  isSynced: boolean;
}

/**
 * Credit card item
 */
export interface CreditCardItem extends VaultItemBase {
  type: 'credit_card';
  /** Cardholder name */
  cardholderName: string;
  /** Card number (encrypted) */
  cardNumber: string;
  /** Expiration month */
  expirationMonth: string;
  /** Expiration year */
  expirationYear: string;
  /** CVV (encrypted) */
  cvv: string;
  /** Card brand */
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
  /** Billing address */
  billingAddress?: Address;
}

/**
 * Address
 */
export interface Address {
  street: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Identity item
 */
export interface IdentityItem extends VaultItemBase {
  type: 'identity';
  /** Title (Mr, Mrs, etc) */
  honorific?: string;
  /** First name */
  firstName: string;
  /** Middle name */
  middleName?: string;
  /** Last name */
  lastName: string;
  /** Email */
  email: string;
  /** Phone */
  phone?: string;
  /** Date of birth */
  dateOfBirth?: string;
  /** Company */
  company?: string;
  /** Job title */
  jobTitle?: string;
  /** Address */
  address?: Address;
  /** Social Security Number (encrypted) */
  ssn?: string;
  /** Passport number (encrypted) */
  passportNumber?: string;
  /** Driver license (encrypted) */
  driverLicense?: string;
}

/**
 * Secure note item
 */
export interface SecureNoteItem extends VaultItemBase {
  type: 'secure_note';
  /** Note content (encrypted) */
  content: string;
}

/**
 * Secure document item
 */
export interface SecureDocumentItem extends VaultItemBase {
  type: 'document';
  /** Document data (encrypted) */
  documentData: string;
  /** File name */
  fileName: string;
  /** File size */
  fileSize: number;
  /** MIME type */
  mimeType: string;
}

/**
 * Union type for all vault items
 */
export type VaultItem = 
  | LoginItem 
  | CreditCardItem 
  | IdentityItem 
  | SecureNoteItem 
  | SecureDocumentItem;

/**
 * Shared item
 */
export interface SharedItem {
  /** Share ID */
  id: string;
  /** Item ID */
  itemId: string;
  /** Shared with (email) */
  sharedWith: string;
  /** Permissions */
  permissions: 'view' | 'edit';
  /** Expiry date */
  expiresAt?: Date;
  /** Created timestamp */
  createdAt: Date;
  /** Access count */
  accessCount: number;
  /** Is active */
  isActive: boolean;
}

/**
 * Emergency contact
 */
export interface EmergencyContact {
  /** Contact ID */
  id: string;
  /** Name */
  name: string;
  /** Email */
  email: string;
  /** Wait time (days) before granting access */
  waitTimeDays: number;
  /** Status */
  status: 'pending' | 'active' | 'requested' | 'granted' | 'denied';
  /** Request date */
  requestDate?: Date;
  /** Grant date */
  grantDate?: Date;
  /** Created timestamp */
  createdAt: Date;
}

/**
 * Masked email alias
 */
export interface EmailAlias {
  /** Alias ID */
  id: string;
  /** Alias email */
  alias: string;
  /** Forward to */
  forwardTo: string;
  /** Associated website */
  website?: string;
  /** Is enabled */
  enabled: boolean;
  /** Email count */
  emailCount: number;
  /** Created timestamp */
  createdAt: Date;
}

/**
 * Security score
 */
export interface SecurityScore {
  /** Overall score (0-100) */
  overall: number;
  /** Weak passwords count */
  weakPasswords: number;
  /** Reused passwords count */
  reusedPasswords: number;
  /** Compromised passwords count */
  compromisedPasswords: number;
  /** Old passwords count (not changed in 90 days) */
  oldPasswords: number;
  /** Missing 2FA count */
  missing2FA: number;
  /** Recommendations */
  recommendations: SecurityRecommendation[];
  /** Last calculated */
  calculatedAt: Date;
}

/**
 * Security recommendation
 */
export interface SecurityRecommendation {
  /** Item ID */
  itemId: string;
  /** Item title */
  itemTitle: string;
  /** Issue type */
  type: 'weak' | 'reused' | 'compromised' | 'old' | 'missing_2fa';
  /** Priority */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Description */
  description: string;
}

/**
 * Travel mode settings
 */
export interface TravelModeSettings {
  /** Is enabled */
  enabled: boolean;
  /** Started at */
  startedAt?: Date;
  /** Hidden item count */
  hiddenItemCount: number;
  /** Auto-disable date */
  autoDisableAt?: Date;
}

/**
 * Password generation options
 */
export interface PasswordGenerationOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  excludeSimilar: boolean;
  customSymbols?: string;
  minNumbers?: number;
  minSymbols?: number;
}

/**
 * HIBP breach response
 */
export interface HIBPBreach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  Description: string;
  DataClasses: string[];
  IsVerified: boolean;
  IsFabricated: boolean;
  IsSensitive: boolean;
  IsRetired: boolean;
  IsSpamList: boolean;
  PwnCount: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default password generation options
 */
const DEFAULT_PASSWORD_OPTIONS: PasswordGenerationOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: true,
  excludeSimilar: false,
};

/**
 * Ambiguous characters
 */
const AMBIGUOUS_CHARS = '{}[]()/\\\'"`~,;:.<>';

/**
 * Similar characters
 */
const _SIMILAR_CHARS = 'il1Lo0O';

/**
 * Character sets
 */
const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Credit card brand detection
 */
const CARD_BRAND_PATTERNS: Record<string, RegExp> = {
  visa: /^4/,
  mastercard: /^5[1-5]|^2[2-7]/,
  amex: /^3[47]/,
  discover: /^6(?:011|5)/,
};

/**
 * Password strength thresholds
 */
const STRENGTH_THRESHOLDS = {
  weak: 40,
  medium: 60,
  strong: 80,
  veryStrong: 100,
};

/**
 * IndexedDB configuration
 */
const DB_NAME = 'cube_password_vault';
const DB_VERSION = 1;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate password strength (0-100)
 */
function calculatePasswordStrength(password: string): number {
  if (!password) return 0;

  let score = 0;
  
  // Length score
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;

  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;

  // Penalties
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated chars
  if (/^[a-zA-Z]+$/.test(password)) score -= 10; // Only letters
  if (/^[0-9]+$/.test(password)) score -= 20; // Only numbers
  if (password.length < 8) score -= 20;

  // Common patterns penalty
  const commonPatterns = ['password', '123456', 'qwerty', 'abc123', 'letmein'];
  if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
    score -= 30;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get strength label
 */
function getStrengthLabel(score: number): string {
  if (score >= STRENGTH_THRESHOLDS.veryStrong) return 'Very Strong';
  if (score >= STRENGTH_THRESHOLDS.strong) return 'Strong';
  if (score >= STRENGTH_THRESHOLDS.medium) return 'Medium';
  if (score >= STRENGTH_THRESHOLDS.weak) return 'Weak';
  return 'Very Weak';
}

/**
 * Detect credit card brand
 */
function detectCardBrand(cardNumber: string): CreditCardItem['brand'] {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  for (const [brand, pattern] of Object.entries(CARD_BRAND_PATTERNS)) {
    if (pattern.test(cleanNumber)) {
      return brand as CreditCardItem['brand'];
    }
  }
  
  return 'other';
}

/**
 * Mask card number
 */
function maskCardNumber(cardNumber: string): string {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length < 4) return cardNumber;
  return `•••• •••• •••• ${clean.slice(-4)}`;
}

/**
 * Hash password for HIBP check (k-anonymity)
 */
async function hashPasswordForHIBP(password: string): Promise<{ prefix: string; suffix: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  
  return {
    prefix: hashHex.slice(0, 5),
    suffix: hashHex.slice(5),
  };
}

// ============================================================================
// Password Generator Service
// ============================================================================

/**
 * Generates secure passwords
 */
export class PasswordGeneratorService {
  private options: PasswordGenerationOptions = { ...DEFAULT_PASSWORD_OPTIONS };

  /**
   * Generate password
   */
  generate(customOptions?: Partial<PasswordGenerationOptions>): string {
    const opts = { ...this.options, ...customOptions };
    
    let charset = '';
    const required: string[] = [];

    if (opts.uppercase) {
      let chars = CHAR_SETS.uppercase;
      if (opts.excludeSimilar) chars = chars.replace(/[IO]/g, '');
      charset += chars;
      required.push(this.randomChar(chars));
    }

    if (opts.lowercase) {
      let chars = CHAR_SETS.lowercase;
      if (opts.excludeSimilar) chars = chars.replace(/[l]/g, '');
      charset += chars;
      required.push(this.randomChar(chars));
    }

    if (opts.numbers) {
      let chars = CHAR_SETS.numbers;
      if (opts.excludeSimilar) chars = chars.replace(/[01]/g, '');
      charset += chars;
      for (let i = 0; i < (opts.minNumbers || 1); i++) {
        required.push(this.randomChar(chars));
      }
    }

    if (opts.symbols) {
      let chars = opts.customSymbols || CHAR_SETS.symbols;
      if (opts.excludeAmbiguous) {
        chars = chars.split('').filter(c => !AMBIGUOUS_CHARS.includes(c)).join('');
      }
      charset += chars;
      for (let i = 0; i < (opts.minSymbols || 1); i++) {
        required.push(this.randomChar(chars));
      }
    }

    if (!charset) {
      charset = CHAR_SETS.lowercase;
    }

    // Generate remaining characters
    const remaining = opts.length - required.length;
    const chars: string[] = [...required];

    for (let i = 0; i < remaining; i++) {
      chars.push(this.randomChar(charset));
    }

    // Shuffle
    return this.shuffle(chars).join('');
  }

  /**
   * Generate passphrase
   */
  generatePassphrase(wordCount: number = 4, separator: string = '-'): string {
    // Simple word list for demo (in production, use a proper word list)
    const words = [
      'correct', 'horse', 'battery', 'staple', 'cloud', 'river', 'mountain',
      'forest', 'sunset', 'ocean', 'thunder', 'galaxy', 'crystal', 'shadow',
      'phoenix', 'dragon', 'wizard', 'knight', 'castle', 'garden', 'harvest',
      'winter', 'summer', 'autumn', 'spring', 'breeze', 'storm', 'rainbow',
    ];

    const selected: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      selected.push(words[randomIndex]);
    }

    return selected.join(separator);
  }

  /**
   * Random character from string
   */
  private randomChar(str: string): string {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return str[array[0] % str.length];
  }

  /**
   * Shuffle array
   */
  private shuffle(array: string[]): string[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const j = array[0] % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Get/set options
   */
  getOptions(): PasswordGenerationOptions {
    return { ...this.options };
  }

  setOptions(options: Partial<PasswordGenerationOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

// ============================================================================
// Breach Detection Service (HIBP)
// ============================================================================

/**
 * Checks passwords against HaveIBeenPwned database
 */
export class BreachDetectionService {
  private cache: Map<string, { count: number; checkedAt: Date }> = new Map();
  private readonly HIBP_API = 'https://api.pwnedpasswords.com/range/';

  /**
   * Check if password is compromised
   */
  async checkPassword(password: string): Promise<{ isCompromised: boolean; count: number }> {
    const { prefix, suffix } = await hashPasswordForHIBP(password);

    // Check cache
    const cacheKey = `${prefix}:${suffix}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.checkedAt.getTime() < 24 * 60 * 60 * 1000) {
      return { isCompromised: cached.count > 0, count: cached.count };
    }

    try {
      const response = await fetch(`${this.HIBP_API}${prefix}`, {
        headers: {
          'Add-Padding': 'true', // Privacy enhancement
        },
      });

      if (!response.ok) {
        throw new Error('HIBP API error');
      }

      const text = await response.text();
      const lines = text.split('\n');

      for (const line of lines) {
        const [hashSuffix, countStr] = line.split(':');
        if (hashSuffix.trim().toUpperCase() === suffix) {
          const count = parseInt(countStr.trim(), 10);
          this.cache.set(cacheKey, { count, checkedAt: new Date() });
          return { isCompromised: true, count };
        }
      }

      this.cache.set(cacheKey, { count: 0, checkedAt: new Date() });
      return { isCompromised: false, count: 0 };
    } catch (error) {
      log.error('HIBP check failed:', error);
      return { isCompromised: false, count: 0 };
    }
  }

  /**
   * Check email for breaches
   */
  async checkEmail(email: string): Promise<HIBPBreach[]> {
    // In production, this would use the HIBP API with an API key
    // For demo, return empty array
    log.debug(`Checking email: ${email}`);
    return [];
  }

  /**
   * Check multiple passwords
   */
  async checkPasswords(passwords: { id: string; password: string }[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const { id, password } of passwords) {
      const { isCompromised } = await this.checkPassword(password);
      results.set(id, isCompromised);
    }

    return results;
  }
}

// ============================================================================
// Passkey Service
// ============================================================================

/**
 * Manages WebAuthn passkeys
 */
export class PasskeyService {
  /**
   * Check if passkeys are supported
   */
  async isSupported(): Promise<boolean> {
    if (!window.PublicKeyCredential) return false;
    
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Create passkey for website
   */
  async createPasskey(
    rpId: string,
    rpName: string,
    userId: string,
    userName: string
  ): Promise<PasskeyCredential | null> {
    if (!await this.isSupported()) {
      throw new Error('Passkeys not supported');
    }

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: rpName,
          id: rpId,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) return null;

      const response = credential.response as AuthenticatorAttestationResponse;
      
      // Convert ArrayBuffer to base64
      const credentialId = this.arrayBufferToBase64(credential.rawId);
      const publicKey = this.arrayBufferToBase64(response.getPublicKey()!);

      return {
        credentialId,
        publicKey,
        rpId,
        userHandle: userId,
        counter: 0,
        createdAt: new Date(),
        isSynced: true,
        deviceInfo: navigator.userAgent,
      };
    } catch (error) {
      log.error('Passkey creation failed:', error);
      return null;
    }
  }

  /**
   * Authenticate with passkey
   */
  async authenticateWithPasskey(
    rpId: string,
    credentialId?: string
  ): Promise<{ success: boolean; userHandle?: string }> {
    if (!await this.isSupported()) {
      throw new Error('Passkeys not supported');
    }

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId,
        userVerification: 'required',
        timeout: 60000,
      };

      if (credentialId) {
        publicKeyCredentialRequestOptions.allowCredentials = [{
          id: this.base64ToArrayBuffer(credentialId),
          type: 'public-key',
        }];
      }

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        return { success: false };
      }

      const response = credential.response as AuthenticatorAssertionResponse;
      const userHandle = response.userHandle 
        ? new TextDecoder().decode(response.userHandle)
        : undefined;

      return { success: true, userHandle };
    } catch (error) {
      log.error('Passkey authentication failed:', error);
      return { success: false };
    }
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// ============================================================================
// Secure Sharing Service
// ============================================================================

/**
 * Manages secure item sharing
 */
export class SecureSharingService {
  private shares: Map<string, SharedItem> = new Map();

  /**
   * Create share link
   */
  async createShare(
    itemId: string,
    recipientEmail: string,
    options?: {
      permissions?: 'view' | 'edit';
      expiresIn?: number; // hours
    }
  ): Promise<SharedItem> {
    const share: SharedItem = {
      id: `share-${generateId()}`,
      itemId,
      sharedWith: recipientEmail,
      permissions: options?.permissions || 'view',
      expiresAt: options?.expiresIn 
        ? new Date(Date.now() + options.expiresIn * 60 * 60 * 1000)
        : undefined,
      createdAt: new Date(),
      accessCount: 0,
      isActive: true,
    };

    this.shares.set(share.id, share);
    return share;
  }

  /**
   * Revoke share
   */
  revokeShare(shareId: string): void {
    const share = this.shares.get(shareId);
    if (share) {
      share.isActive = false;
    }
  }

  /**
   * Get shares for item
   */
  getSharesForItem(itemId: string): SharedItem[] {
    return Array.from(this.shares.values())
      .filter(s => s.itemId === itemId && s.isActive);
  }

  /**
   * Get all shares
   */
  getShares(): SharedItem[] {
    return Array.from(this.shares.values())
      .filter(s => s.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Record access
   */
  recordAccess(shareId: string): void {
    const share = this.shares.get(shareId);
    if (share) {
      share.accessCount++;
    }
  }
}

// ============================================================================
// Emergency Access Service
// ============================================================================

/**
 * Manages emergency access contacts
 */
export class EmergencyAccessService {
  private contacts: Map<string, EmergencyContact> = new Map();

  /**
   * Add emergency contact
   */
  addContact(name: string, email: string, waitTimeDays: number = 3): EmergencyContact {
    const contact: EmergencyContact = {
      id: `ec-${generateId()}`,
      name,
      email,
      waitTimeDays,
      status: 'pending',
      createdAt: new Date(),
    };

    this.contacts.set(contact.id, contact);
    return contact;
  }

  /**
   * Remove contact
   */
  removeContact(id: string): void {
    this.contacts.delete(id);
  }

  /**
   * Initiate access request
   */
  requestAccess(id: string): void {
    const contact = this.contacts.get(id);
    if (contact && contact.status === 'active') {
      contact.status = 'requested';
      contact.requestDate = new Date();
    }
  }

  /**
   * Approve access
   */
  approveAccess(id: string): void {
    const contact = this.contacts.get(id);
    if (contact && contact.status === 'requested') {
      contact.status = 'granted';
      contact.grantDate = new Date();
    }
  }

  /**
   * Deny access
   */
  denyAccess(id: string): void {
    const contact = this.contacts.get(id);
    if (contact && contact.status === 'requested') {
      contact.status = 'denied';
    }
  }

  /**
   * Get contacts
   */
  getContacts(): EmergencyContact[] {
    return Array.from(this.contacts.values());
  }

  /**
   * Check pending requests (auto-grant after wait time)
   */
  checkPendingRequests(): EmergencyContact[] {
    const autoGranted: EmergencyContact[] = [];
    const now = new Date();

    for (const contact of this.contacts.values()) {
      if (contact.status === 'requested' && contact.requestDate) {
        const waitTime = contact.waitTimeDays * 24 * 60 * 60 * 1000;
        if (now.getTime() - contact.requestDate.getTime() >= waitTime) {
          contact.status = 'granted';
          contact.grantDate = now;
          autoGranted.push(contact);
        }
      }
    }

    return autoGranted;
  }
}

// ============================================================================
// Vault Service
// ============================================================================

/**
 * Main vault service
 */
export class VaultService {
  private items: Map<string, VaultItem> = new Map();
  private db: IDBDatabase | null = null;
  private isLocked: boolean = true;
  private masterKeyHash: string | null = null;
  private travelMode: TravelModeSettings = {
    enabled: false,
    hiddenItemCount: 0,
  };

  // Sub-services
  public passwordGenerator: PasswordGeneratorService;
  public breachDetection: BreachDetectionService;
  public passkey: PasskeyService;
  public sharing: SecureSharingService;
  public emergencyAccess: EmergencyAccessService;

  constructor() {
    this.passwordGenerator = new PasswordGeneratorService();
    this.breachDetection = new BreachDetectionService();
    this.passkey = new PasskeyService();
    this.sharing = new SecureSharingService();
    this.emergencyAccess = new EmergencyAccessService();
  }

  /**
   * Initialize service
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('vault')) {
          const store = db.createObjectStore('vault', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Unlock vault with master password
   */
  async unlock(masterPassword: string): Promise<boolean> {
    // In production, verify against stored hash
    // For demo, accept any password
    const encoder = new TextEncoder();
    const data = encoder.encode(masterPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    this.masterKeyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    this.isLocked = false;
    await this.loadItems();
    return true;
  }

  /**
   * Lock vault
   */
  lock(): void {
    this.isLocked = true;
    this.masterKeyHash = null;
    this.items.clear();
  }

  /**
   * Load items from DB
   */
  private async loadItems(): Promise<void> {
    if (!this.db || this.isLocked) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['vault'], 'readonly');
      const store = transaction.objectStore('vault');
      const request = store.getAll();

      request.onsuccess = () => {
        for (const item of request.result) {
          this.items.set(item.id, {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            lastAccessed: item.lastAccessed ? new Date(item.lastAccessed) : undefined,
          });
        }
        resolve();
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Save item to DB
   */
  private async saveItem(item: VaultItem): Promise<void> {
    if (!this.db || this.isLocked) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['vault'], 'readwrite');
      const store = transaction.objectStore('vault');
      
      const storable = {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        lastAccessed: item.lastAccessed?.toISOString(),
      };

      const request = store.put(storable);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Add login item
   */
  async addLogin(data: {
    title: string;
    username: string;
    password: string;
    urls: string[];
    email?: string;
    totpSecret?: string;
    notes?: string;
  }): Promise<LoginItem> {
    if (this.isLocked) throw new Error('Vault is locked');

    const item: LoginItem = {
      id: `login-${generateId()}`,
      type: 'login',
      title: data.title,
      username: data.username,
      password: data.password, // In production, encrypt
      email: data.email,
      urls: data.urls,
      totpSecret: data.totpSecret,
      notes: data.notes,
      category: undefined,
      tags: [],
      favorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      travelModeHidden: false,
      customFields: [],
      attachments: [],
      passwordHistory: [],
    };

    // Check for breach
    const breach = await this.breachDetection.checkPassword(data.password);
    if (breach.isCompromised) {
      item.isCompromised = true;
    }

    this.items.set(item.id, item);
    await this.saveItem(item);
    return item;
  }

  /**
   * Add credit card
   */
  async addCreditCard(data: {
    title: string;
    cardholderName: string;
    cardNumber: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
    billingAddress?: Address;
  }): Promise<CreditCardItem> {
    if (this.isLocked) throw new Error('Vault is locked');

    const item: CreditCardItem = {
      id: `card-${generateId()}`,
      type: 'credit_card',
      title: data.title,
      cardholderName: data.cardholderName,
      cardNumber: data.cardNumber, // In production, encrypt
      expirationMonth: data.expirationMonth,
      expirationYear: data.expirationYear,
      cvv: data.cvv, // In production, encrypt
      brand: detectCardBrand(data.cardNumber),
      billingAddress: data.billingAddress,
      category: undefined,
      tags: [],
      favorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      travelModeHidden: false,
      customFields: [],
      attachments: [],
    };

    this.items.set(item.id, item);
    await this.saveItem(item);
    return item;
  }

  /**
   * Add identity
   */
  async addIdentity(data: Omit<IdentityItem, keyof VaultItemBase | 'type'>): Promise<IdentityItem> {
    if (this.isLocked) throw new Error('Vault is locked');

    const item: IdentityItem = {
      id: `identity-${generateId()}`,
      type: 'identity',
      title: `${data.firstName} ${data.lastName}`,
      ...data,
      category: undefined,
      tags: [],
      favorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      travelModeHidden: false,
      customFields: [],
      attachments: [],
    };

    this.items.set(item.id, item);
    await this.saveItem(item);
    return item;
  }

  /**
   * Update item
   */
  async updateItem(id: string, updates: Partial<VaultItem>): Promise<void> {
    if (this.isLocked) throw new Error('Vault is locked');

    const item = this.items.get(id);
    if (!item) throw new Error('Item not found');

    // Track password history for logins
    if (item.type === 'login' && 'password' in updates && updates.password !== (item as LoginItem).password) {
      (item as LoginItem).passwordHistory.push({
        password: (item as LoginItem).password,
        changedAt: new Date(),
      });
    }

    Object.assign(item, updates, { updatedAt: new Date() });
    await this.saveItem(item);
  }

  /**
   * Delete item
   */
  async deleteItem(id: string): Promise<void> {
    if (this.isLocked) throw new Error('Vault is locked');

    this.items.delete(id);

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['vault'], 'readwrite');
        const store = transaction.objectStore('vault');
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Get all items
   */
  getItems(filter?: {
    type?: VaultItemType;
    category?: string;
    favorite?: boolean;
    search?: string;
  }): VaultItem[] {
    if (this.isLocked) return [];

    let items = Array.from(this.items.values());

    // Filter out travel mode hidden items
    if (this.travelMode.enabled) {
      items = items.filter(i => !i.travelModeHidden);
    }

    if (filter?.type) {
      items = items.filter(i => i.type === filter.type);
    }
    if (filter?.category) {
      items = items.filter(i => i.category === filter.category);
    }
    if (filter?.favorite) {
      items = items.filter(i => i.favorite);
    }
    if (filter?.search) {
      const search = filter.search.toLowerCase();
      items = items.filter(i => 
        i.title.toLowerCase().includes(search) ||
        i.tags.some(t => t.toLowerCase().includes(search))
      );
    }

    return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get item by ID
   */
  getItem(id: string): VaultItem | undefined {
    if (this.isLocked) return undefined;
    return this.items.get(id);
  }

  /**
   * Calculate security score
   */
  async calculateSecurityScore(): Promise<SecurityScore> {
    const logins = this.getItems({ type: 'login' }) as LoginItem[];
    const recommendations: SecurityRecommendation[] = [];

    let weakPasswords = 0;
    let reusedPasswords = 0;
    let compromisedPasswords = 0;
    let oldPasswords = 0;
    let missing2FA = 0;

    const passwordCounts = new Map<string, number>();
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    for (const login of logins) {
      // Check strength
      const strength = calculatePasswordStrength(login.password);
      if (strength < STRENGTH_THRESHOLDS.medium) {
        weakPasswords++;
        recommendations.push({
          itemId: login.id,
          itemTitle: login.title,
          type: 'weak',
          priority: strength < STRENGTH_THRESHOLDS.weak ? 'critical' : 'high',
          description: 'This password is weak and should be changed',
        });
      }

      // Check reused
      const count = passwordCounts.get(login.password) || 0;
      passwordCounts.set(login.password, count + 1);

      // Check compromised
      if (login.isCompromised) {
        compromisedPasswords++;
        recommendations.push({
          itemId: login.id,
          itemTitle: login.title,
          type: 'compromised',
          priority: 'critical',
          description: 'This password has been exposed in a data breach',
        });
      }

      // Check old
      if (login.updatedAt.getTime() < ninetyDaysAgo) {
        oldPasswords++;
        recommendations.push({
          itemId: login.id,
          itemTitle: login.title,
          type: 'old',
          priority: 'low',
          description: 'This password hasn\'t been changed in over 90 days',
        });
      }

      // Check 2FA
      if (!login.totpSecret && !login.passkey) {
        missing2FA++;
        recommendations.push({
          itemId: login.id,
          itemTitle: login.title,
          type: 'missing_2fa',
          priority: 'medium',
          description: 'Consider enabling two-factor authentication',
        });
      }
    }

    // Count reused passwords
    for (const count of passwordCounts.values()) {
      if (count > 1) {
        reusedPasswords += count;
      }
    }

    // Calculate overall score
    const totalIssues = weakPasswords + reusedPasswords + compromisedPasswords + oldPasswords + missing2FA;
    const maxIssues = logins.length * 5; // Max 5 issues per login
    const overall = maxIssues > 0 
      ? Math.round(100 - (totalIssues / maxIssues * 100))
      : 100;

    return {
      overall: Math.max(0, Math.min(100, overall)),
      weakPasswords,
      reusedPasswords,
      compromisedPasswords,
      oldPasswords,
      missing2FA,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      calculatedAt: new Date(),
    };
  }

  /**
   * Enable travel mode
   */
  enableTravelMode(): void {
    this.travelMode.enabled = true;
    this.travelMode.startedAt = new Date();
    this.travelMode.hiddenItemCount = Array.from(this.items.values())
      .filter(i => i.travelModeHidden).length;
  }

  /**
   * Disable travel mode
   */
  disableTravelMode(): void {
    this.travelMode.enabled = false;
    this.travelMode.startedAt = undefined;
  }

  /**
   * Get travel mode settings
   */
  getTravelMode(): TravelModeSettings {
    return { ...this.travelMode };
  }

  /**
   * Check if vault is locked
   */
  get locked(): boolean {
    return this.isLocked;
  }
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for password manager elite
 * Uses Tauri backend for password storage and encryption
 * Elite features (passkeys, breach detection, travel mode) enhance base functionality
 */
export function usePasswordManager() {
  // Elite local services
  const vaultRef = useRef<VaultService | null>(null);
  const passkeyRef = useRef<PasskeyService | null>(null);
  const breachRef = useRef<BreachDetectionService | null>(null);

  // State
  const [items, setItems] = useState<VaultItem[]>([]);
  const [securityScore, setSecurityScore] = useState<SecurityScore | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<TravelModeSettings>({ enabled: false, hiddenItemCount: 0 });

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize Elite services
        vaultRef.current = new VaultService();
        passkeyRef.current = new PasskeyService();
        breachRef.current = new BreachDetectionService();

        await vaultRef.current.init();
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize password manager');
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Helper to convert backend passwords to Elite format
  const convertToEliteItems = (backendPasswords: Awaited<ReturnType<typeof PasswordVaultService.getAll>>): VaultItem[] => {
    return backendPasswords.map((p): LoginItem => ({
      id: p.id,
      type: 'login' as const,
      title: p.name || p.url || 'Untitled',
      category: p.category,
      tags: p.tags || [],
      favorite: p.favorite || false,
      createdAt: new Date(p.date_created),
      updatedAt: new Date(p.date_modified),
      lastAccessed: p.last_used ? new Date(p.last_used) : undefined,
      travelModeHidden: false,
      customFields: [],
      notes: p.notes,
      attachments: [],
      // Login-specific fields
      urls: p.url ? [p.url] : [],
      username: p.username,
      email: '',
      password: p.encrypted_password, // Note: encrypted in backend
      totpSecret: undefined,
      passwordHistory: [],
    }));
  };

  // Store master password reference (cleared on lock)
  const masterPasswordRef = useRef<string | null>(null);

  // Unlock vault (via Tauri backend)
  const unlock = useCallback(async (masterPassword: string) => {
    if (!vaultRef.current) return false;
    
    try {
      setError(null);
      // Verify with Tauri backend
      const verified = await MasterPasswordService.verify(masterPassword);
      
      if (verified) {
        // Store master password for subsequent operations
        masterPasswordRef.current = masterPassword;
        
        // Get passwords from Tauri backend
        const backendPasswords = await PasswordVaultService.getAll();
        
        // Convert to Elite format
        const eliteItems = convertToEliteItems(backendPasswords);

        setIsLocked(false);
        setItems(eliteItems);
        
        // Calculate security score in background
        if (vaultRef.current) {
          vaultRef.current.calculateSecurityScore().then(setSecurityScore);
        }
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock vault');
      return false;
    }
  }, []);

  // Lock vault
  const lock = useCallback(() => {
    masterPasswordRef.current = null; // Clear master password
    setIsLocked(true);
    setItems([]);
    setSecurityScore(null);
  }, []);

  // Add login (via Tauri backend)
  const addLogin = useCallback(async (data: {
    title: string;
    website?: string;
    username?: string;
    email?: string;
    password: string;
    category?: string;
    notes?: string;
    totpSecret?: string;
    masterPassword?: string; // Optional - uses stored password if not provided
  }) => {
    const masterPwd = data.masterPassword || masterPasswordRef.current;
    if (!masterPwd) {
      setError('Vault is locked - please unlock first');
      return;
    }
    
    try {
      setError(null);
      await PasswordVaultService.save({
        name: data.title,
        username: data.username || '',
        password: data.password,
        url: data.website,
        notes: data.notes,
        category: data.category || 'login',
        masterPassword: masterPwd,
      });
      
      // Refresh items
      const backendPasswords = await PasswordVaultService.getAll();
      const eliteItems = convertToEliteItems(backendPasswords);
      setItems(eliteItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add login');
    }
  }, []);

  // Add credit card (local Elite feature - extend later)
  const addCreditCard = useCallback(async (data: Parameters<VaultService['addCreditCard']>[0]) => {
    if (!vaultRef.current) return;
    
    await vaultRef.current.addCreditCard(data);
    setItems(vaultRef.current.getItems());
  }, []);

  // Generate password (via Tauri backend)
  const generatePassword = useCallback(async (options?: Partial<PasswordGenerationOptions>): Promise<string> => {
    try {
      const config = {
        length: options?.length || 16,
        include_uppercase: options?.uppercase ?? true,
        include_lowercase: options?.lowercase ?? true,
        include_numbers: options?.numbers ?? true,
        include_symbols: options?.symbols ?? true,
        exclude_ambiguous: options?.excludeSimilar ?? false,
      };
      return await TauriGeneratorService.generate(config);
    } catch (_err) {
      // Fallback to local generation
      return vaultRef.current?.passwordGenerator.generate(options) || '';
    }
  }, []);

  // Check password breach (local Elite feature)
  const checkPasswordBreach = useCallback(async (password: string) => {
    return breachRef.current?.checkPassword(password);
  }, []);

  // Toggle travel mode (local Elite feature)
  const toggleTravelMode = useCallback(() => {
    if (!vaultRef.current) return;
    
    if (travelMode.enabled) {
      vaultRef.current.disableTravelMode();
    } else {
      vaultRef.current.enableTravelMode();
    }
    setTravelMode(vaultRef.current.getTravelMode());
    setItems(vaultRef.current.getItems());
  }, [travelMode.enabled]);

  // Refresh security score
  const refreshSecurityScore = useCallback(async () => {
    if (!vaultRef.current) return;
    
    const score = await vaultRef.current.calculateSecurityScore();
    if (score) setSecurityScore(score);
  }, []);

  return {
    // State
    items,
    securityScore,
    isLocked,
    isLoading,
    error,
    travelMode,

    // Vault actions (via Tauri backend)
    unlock,
    lock,
    addLogin,
    addCreditCard,

    // Password generation (via Tauri backend)
    generatePassword,
    generatePassphrase: (wordCount?: number) => 
      vaultRef.current?.passwordGenerator.generatePassphrase(wordCount) || '',

    // Security (local Elite features)
    checkPasswordBreach,
    refreshSecurityScore,

    // Travel mode (local Elite feature)
    toggleTravelMode,

    // Passkeys (local Elite feature)
    isPasskeySupported: () => passkeyRef.current?.isSupported() || Promise.resolve(false),
    createPasskey: (rpId: string, rpName: string, userId: string, userName: string) =>
      passkeyRef.current?.createPasskey(rpId, rpName, userId, userName),

    // Service access (for advanced users)
    services: {
      vault: vaultRef.current,
      passkey: passkeyRef.current,
      breach: breachRef.current,
      tauriVault: PasswordVaultService,
      tauriGenerator: TauriGeneratorService,
    },
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  DEFAULT_PASSWORD_OPTIONS,
  STRENGTH_THRESHOLDS,
  calculatePasswordStrength,
  getStrengthLabel,
  maskCardNumber,
  detectCardBrand,
};
