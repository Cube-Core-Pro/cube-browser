/**
 * Password Service - CUBE Nexum
 * 
 * Unified service layer for password vault operations including:
 * - Password CRUD operations
 * - Password generation
 * - Strength checking
 * - Secure encryption/decryption
 * 
 * Backend Integration: src-tauri/src/commands/passwords_new.rs
 * 
 * @module PasswordService
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('Password');

// ============================================
// Types - Match Rust models/passwords.rs
// ============================================

export interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  encrypted_password: string;
  url?: string;
  notes?: string;
  category: string;
  tags: string[];
  date_created: number;
  date_modified: number;
  last_used?: number;
  favorite: boolean;
  strength_score: number;
  totp_secret?: string;
}

// Legacy alias for backwards compatibility
export type Password = PasswordEntry;

export interface PasswordGeneratorConfig {
  length: number;
  include_lowercase: boolean;
  include_uppercase: boolean;
  include_numbers: boolean;
  include_symbols: boolean;
  exclude_ambiguous?: boolean;
}

export interface PasswordStrength {
  score: number;
  feedback: string[];
  estimated_crack_time: string;
}

export interface PasswordCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  count: number;
}

export interface PasswordStats {
  total_passwords: number;
  weak_passwords: number;
  medium_passwords: number;
  strong_passwords: number;
  reused_passwords: number;
  by_category: Record<string, number>;
}

export interface MasterPasswordConfig {
  salt: string;
  is_set: boolean;
  created_at: number;
  updated_at: number;
}

export interface SavePasswordParams {
  name: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category: string;
  masterPassword: string;
  tags?: string[];
  favorite?: boolean;
}

export interface UpdatePasswordParams {
  entryId: string;
  name: string;
  username: string;
  password?: string;
  url?: string;
  notes?: string;
  category: string;
  masterPassword: string;
  tags?: string[];
  favorite?: boolean;
}

// ============================================
// Master Password Service
// ============================================

export const MasterPasswordService = {
  /**
   * Setup initial master password
   */
  async setup(masterPassword: string): Promise<void> {
    return invoke<void>('setup_master_password', { masterPassword });
  },

  /**
   * Verify master password is correct
   */
  async verify(masterPassword: string): Promise<boolean> {
    return invoke<boolean>('verify_master_password', { masterPassword });
  },

  /**
   * Get master password configuration
   */
  async getConfig(): Promise<MasterPasswordConfig> {
    return invoke<MasterPasswordConfig>('get_master_password_config');
  },

  /**
   * Change master password (re-encrypts all passwords)
   */
  async change(oldPassword: string, newPassword: string): Promise<void> {
    return invoke<void>('change_master_password', { oldPassword, newPassword });
  },
};

// ============================================
// Password Vault Service
// ============================================

export const PasswordVaultService = {
  /**
   * Get all passwords (encrypted)
   * Backend: get_all_passwords
   */
  async getAll(): Promise<PasswordEntry[]> {
    return invoke<PasswordEntry[]>('get_all_passwords');
  },

  /**
   * Get decrypted password value
   * Backend: decrypt_password
   */
  async getPassword(entryId: string, masterPassword: string): Promise<string> {
    return invoke<string>('decrypt_password', { entryId, masterPassword });
  },

  /**
   * Save a new password entry
   * Backend: save_password
   */
  async save(params: SavePasswordParams): Promise<void> {
    const now = Date.now();
    const entry: PasswordEntry = {
      id: crypto.randomUUID(),
      name: params.name,
      username: params.username,
      encrypted_password: '', // Will be set by backend
      url: params.url,
      notes: params.notes,
      category: params.category,
      tags: params.tags || [],
      date_created: now,
      date_modified: now,
      last_used: undefined,
      favorite: params.favorite || false,
      strength_score: 0, // Will be calculated by backend
    };

    return invoke<void>('save_password', {
      password: params.password,
      masterPassword: params.masterPassword,
      entry,
    });
  },

  /**
   * Update an existing password entry
   * Backend: update_password_entry
   */
  async update(params: UpdatePasswordParams): Promise<void> {
    // First get the existing entry
    const entries = await this.getAll();
    const existing = entries.find(e => e.id === params.entryId);
    
    if (!existing) {
      throw new Error('Password entry not found');
    }

    const entry: PasswordEntry = {
      ...existing,
      name: params.name,
      username: params.username,
      url: params.url,
      notes: params.notes,
      category: params.category,
      tags: params.tags || existing.tags,
      date_modified: Date.now(),
      favorite: params.favorite ?? existing.favorite,
    };

    return invoke<void>('update_password_entry', {
      password: params.password || null,
      masterPassword: params.masterPassword,
      entry,
    });
  },

  /**
   * Delete a password entry
   * Backend: delete_password
   */
  async delete(id: string): Promise<void> {
    return invoke<void>('delete_password', { id });
  },

  /**
   * Mark password as recently used
   * Backend: update_password_last_used
   */
  async markUsed(id: string): Promise<void> {
    return invoke<void>('update_password_last_used', { id });
  },

  /**
   * Search passwords by query
   * Backend: search_passwords
   */
  async search(query: string, category?: string): Promise<PasswordEntry[]> {
    return invoke<PasswordEntry[]>('search_passwords', { query, category });
  },

  /**
   * Get password categories
   * Backend: get_password_categories
   */
  async getCategories(): Promise<PasswordCategory[]> {
    return invoke<PasswordCategory[]>('get_password_categories');
  },

  /**
   * Get password statistics
   * Backend: get_password_stats
   */
  async getStats(): Promise<PasswordStats> {
    return invoke<PasswordStats>('get_password_stats');
  },

  /**
   * Get detailed security report including old/compromised passwords
   * This performs additional analysis beyond basic stats
   */
  async getSecurityReport(): Promise<{
    score: number;
    totalPasswords: number;
    weakPasswords: number;
    reusedPasswords: number;
    oldPasswords: number;
    compromisedPasswords: number;
    totpEnabled: number;
  }> {
    try {
      // Get basic stats from backend
      const stats = await invoke<PasswordStats>('get_password_stats');
      
      // Get all passwords for additional analysis
      const passwords = await this.getAll();
      
      // Calculate old passwords (not modified in 90+ days)
      const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
      const oldPasswords = passwords.filter(p => p.date_modified < ninetyDaysAgo).length;
      
      // Count TOTP-enabled entries
      const totpEnabled = passwords.filter(p => p.totp_secret && p.totp_secret.length > 0).length;
      
      // Check for compromised passwords via Have I Been Pwned API
      const compromisedPasswords = 0;
      // Note: This would need master password to decrypt and check
      // For now, we return 0 and the user can run a manual breach check
      
      // Calculate overall security score
      const weakPenalty = stats.weak_passwords * 10;
      const reusedPenalty = stats.reused_passwords * 15;
      const oldPenalty = oldPasswords * 5;
      const totpBonus = totpEnabled * 2;
      const score = Math.max(0, Math.min(100, 100 - weakPenalty - reusedPenalty - oldPenalty + totpBonus));
      
      return {
        score,
        totalPasswords: stats.total_passwords,
        weakPasswords: stats.weak_passwords,
        reusedPasswords: stats.reused_passwords,
        oldPasswords,
        compromisedPasswords,
        totpEnabled,
      };
    } catch (error) {
      log.error('Failed to generate security report:', error);
      return {
        score: 0,
        totalPasswords: 0,
        weakPasswords: 0,
        reusedPasswords: 0,
        oldPasswords: 0,
        compromisedPasswords: 0,
        totpEnabled: 0,
      };
    }
  },

  /**
   * Check if a password has been compromised using Have I Been Pwned API
   * Uses k-anonymity to protect the password
   */
  async checkBreached(passwordHash: string): Promise<{ breached: boolean; count: number }> {
    try {
      // Use SHA-1 hash prefix (k-anonymity)
      const prefix = passwordHash.substring(0, 5).toUpperCase();
      const suffix = passwordHash.substring(5).toUpperCase();
      
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'Add-Padding': 'true' },
      });
      
      if (!response.ok) {
        return { breached: false, count: 0 };
      }
      
      const text = await response.text();
      const lines = text.split('\n');
      
      for (const line of lines) {
        const [hashSuffix, countStr] = line.split(':');
        if (hashSuffix.trim() === suffix) {
          return { breached: true, count: parseInt(countStr.trim(), 10) };
        }
      }
      
      return { breached: false, count: 0 };
    } catch (error) {
      log.error('Breach check failed:', error);
      return { breached: false, count: 0 };
    }
  },

  /**
   * Export passwords (encrypted)
   * Backend: export_passwords
   */
  async export(masterPassword: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    return invoke<string>('export_passwords', { masterPassword, format });
  },

  /**
   * Import passwords
   * Backend: import_passwords
   */
  async import(data: string, masterPassword: string, format: 'json' | 'csv' = 'json'): Promise<number> {
    return invoke<number>('import_passwords', { data, masterPassword, format });
  },
};

// ============================================
// Password Generator Service
// ============================================

export const PasswordGeneratorService = {
  /**
   * Generate a secure password
   * Backend: generate_password
   */
  async generate(config: PasswordGeneratorConfig): Promise<string> {
    return invoke<string>('generate_password', { config });
  },

  /**
   * Analyze password strength
   * Backend: analyze_password_strength
   */
  async checkStrength(password: string): Promise<PasswordStrength> {
    return invoke<PasswordStrength>('analyze_password_strength', { password });
  },

  /**
   * Generate with default config
   */
  async generateDefault(length: number = 16): Promise<string> {
    return this.generate({
      length,
      include_lowercase: true,
      include_uppercase: true,
      include_numbers: true,
      include_symbols: true,
      exclude_ambiguous: true,
    });
  },
};

// ============================================
// Combined Password Service Export
// ============================================

export const PasswordService = {
  Master: MasterPasswordService,
  Vault: PasswordVaultService,
  Generator: PasswordGeneratorService,
};

export default PasswordService;
