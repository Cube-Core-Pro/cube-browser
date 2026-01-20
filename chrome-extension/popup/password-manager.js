// CUBE OmniFill - Password Manager Module v6.0 Elite
// Integrated with Tauri desktop app - Watchtower, TOTP, Secure Notes

console.log('🔐 Password Manager Module v6.0 Elite loaded');

/**
 * Password Manager - Syncs with Tauri Desktop App
 * Features: Watchtower, TOTP, Secure Notes, Breach Detection
 */
class PasswordManager {
  constructor() {
    this.credentials = [];
    this.totpCodes = new Map();
    this.secureNotes = [];
    this.breachResults = new Map();
    this.isUnlocked = false;
    this.masterPasswordHash = null;
    this.encryptionKey = null;
    this.settings = {
      autoFillEnabled: true,
      autoLockTimeout: 15, // minutes
      showPasswordStrength: true,
      enableWatchtower: true,
      enableTOTP: true,
      syncWithTauri: true
    };
    
    this.lastActivity = Date.now();
    this.autoLockTimer = null;
    
    this.init();
  }

  /**
   * Initialize password manager
   */
  async init() {
    await this.loadSettings();
    this.startAutoLockTimer();
    console.log('[PasswordManager] Initialized');
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get('passwordManagerSettings');
      if (result.passwordManagerSettings) {
        this.settings = { ...this.settings, ...result.passwordManagerSettings };
      }
    } catch (error) {
      console.warn('[PasswordManager] Could not load settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      await chrome.storage.local.set({ passwordManagerSettings: this.settings });
    } catch (error) {
      console.error('[PasswordManager] Could not save settings:', error);
    }
  }

  /**
   * Unlock vault with master password
   * @param {string} masterPassword 
   * @returns {Promise<boolean>}
   */
  async unlock(masterPassword) {
    try {
      const hash = await this.hashPassword(masterPassword);
      
      // Verify against stored hash
      const result = await chrome.storage.local.get('masterPasswordHash');
      
      if (!result.masterPasswordHash) {
        // First time setup
        await chrome.storage.local.set({ masterPasswordHash: hash });
        this.masterPasswordHash = hash;
      } else if (result.masterPasswordHash !== hash) {
        throw new Error('Incorrect master password');
      }
      
      this.masterPasswordHash = hash;
      this.encryptionKey = await this.deriveKey(masterPassword);
      this.isUnlocked = true;
      this.lastActivity = Date.now();
      
      await this.loadCredentials();
      
      console.log('[PasswordManager] Vault unlocked');
      return true;
    } catch (error) {
      console.error('[PasswordManager] Unlock failed:', error);
      throw error;
    }
  }

  /**
   * Lock the vault
   */
  lock() {
    this.isUnlocked = false;
    this.encryptionKey = null;
    this.credentials = [];
    this.totpCodes.clear();
    console.log('[PasswordManager] Vault locked');
  }

  /**
   * Hash password using SHA-256
   * @param {string} password 
   * @returns {Promise<string>}
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Derive encryption key from password
   * @param {string} password 
   * @returns {Promise<CryptoKey>}
   */
  async deriveKey(password) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    const salt = encoder.encode('CUBE_OmniFill_Salt_v6');
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data
   * @param {string} data 
   * @returns {Promise<string>}
   */
  async encrypt(data) {
    if (!this.encryptionKey) throw new Error('Vault is locked');
    
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      this.encryptionKey,
      encoder.encode(data)
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt data
   * @param {string} encryptedData 
   * @returns {Promise<string>}
   */
  async decrypt(encryptedData) {
    if (!this.encryptionKey) throw new Error('Vault is locked');
    
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(c => c.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      this.encryptionKey,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  }

  /**
   * Load credentials from storage
   */
  async loadCredentials() {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    try {
      const result = await chrome.storage.local.get(['encryptedCredentials', 'encryptedSecureNotes']);
      
      if (result.encryptedCredentials) {
        const decrypted = await this.decrypt(result.encryptedCredentials);
        this.credentials = JSON.parse(decrypted);
      }
      
      if (result.encryptedSecureNotes) {
        const decrypted = await this.decrypt(result.encryptedSecureNotes);
        this.secureNotes = JSON.parse(decrypted);
      }
      
      console.log(`[PasswordManager] Loaded ${this.credentials.length} credentials, ${this.secureNotes.length} notes`);
    } catch (error) {
      console.error('[PasswordManager] Failed to load credentials:', error);
      this.credentials = [];
      this.secureNotes = [];
    }
  }

  /**
   * Save credentials to storage
   */
  async saveCredentials() {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    try {
      const encryptedCredentials = await this.encrypt(JSON.stringify(this.credentials));
      const encryptedSecureNotes = await this.encrypt(JSON.stringify(this.secureNotes));
      
      await chrome.storage.local.set({ encryptedCredentials, encryptedSecureNotes });
      
      // Sync with Tauri if enabled
      if (this.settings.syncWithTauri) {
        await this.syncWithTauri();
      }
    } catch (error) {
      console.error('[PasswordManager] Failed to save credentials:', error);
      throw error;
    }
  }

  /**
   * Add a new credential
   * @param {object} credential 
   */
  async addCredential(credential) {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    const newCredential = {
      id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      domain: credential.domain,
      username: credential.username,
      password: credential.password,
      url: credential.url || '',
      notes: credential.notes || '',
      totp: credential.totp || null,
      category: credential.category || 'login',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastUsed: null,
      passwordStrength: this.calculatePasswordStrength(credential.password),
      breachStatus: 'unknown'
    };
    
    this.credentials.push(newCredential);
    await this.saveCredentials();
    
    console.log('[PasswordManager] Credential added:', newCredential.domain);
    return newCredential;
  }

  /**
   * Update a credential
   * @param {string} id 
   * @param {object} updates 
   */
  async updateCredential(id, updates) {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    const index = this.credentials.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Credential not found');
    
    const credential = this.credentials[index];
    
    if (updates.password && updates.password !== credential.password) {
      updates.passwordStrength = this.calculatePasswordStrength(updates.password);
    }
    
    this.credentials[index] = {
      ...credential,
      ...updates,
      updatedAt: Date.now()
    };
    
    await this.saveCredentials();
    return this.credentials[index];
  }

  /**
   * Delete a credential
   * @param {string} id 
   */
  async deleteCredential(id) {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    const index = this.credentials.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Credential not found');
    
    this.credentials.splice(index, 1);
    await this.saveCredentials();
    
    console.log('[PasswordManager] Credential deleted');
  }

  /**
   * Find credentials for a domain
   * @param {string} domain 
   * @returns {Array}
   */
  findCredentialsForDomain(domain) {
    if (!this.isUnlocked) return [];
    
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
    
    return this.credentials.filter(c => {
      const credDomain = c.domain.toLowerCase().replace(/^www\./, '');
      return credDomain === normalizedDomain || 
             normalizedDomain.endsWith('.' + credDomain) ||
             credDomain.endsWith('.' + normalizedDomain);
    });
  }

  /**
   * Calculate password strength
   * @param {string} password 
   * @returns {object}
   */
  calculatePasswordStrength(password) {
    if (!password) return { score: 0, label: 'None', color: '#ef4444' };
    
    let score = 0;
    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      symbols: /[^A-Za-z0-9]/.test(password),
      noCommon: !this.isCommonPassword(password)
    };
    
    score += checks.length ? 20 : 0;
    score += checks.uppercase ? 15 : 0;
    score += checks.lowercase ? 15 : 0;
    score += checks.numbers ? 15 : 0;
    score += checks.symbols ? 20 : 0;
    score += checks.noCommon ? 15 : 0;
    
    // Length bonus
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;
    
    score = Math.min(100, score);
    
    let label, color;
    if (score < 30) { label = 'Weak'; color = '#ef4444'; }
    else if (score < 50) { label = 'Fair'; color = '#f97316'; }
    else if (score < 70) { label = 'Good'; color = '#eab308'; }
    else if (score < 90) { label = 'Strong'; color = '#22c55e'; }
    else { label = 'Excellent'; color = '#10b981'; }
    
    return { score, label, color, checks };
  }

  /**
   * Check if password is common
   * @param {string} password 
   * @returns {boolean}
   */
  isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'monkey', 'letmein', 'dragon', '111111', 'baseball',
      'iloveyou', 'trustno1', 'sunshine', 'master', 'welcome',
      'shadow', 'ashley', 'football', 'jesus', 'michael'
    ];
    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Generate a secure password
   * @param {object} options 
   * @returns {string}
   */
  generatePassword(options = {}) {
    const defaults = {
      length: 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeSimilar: true,
      excludeAmbiguous: true
    };
    
    const opts = { ...defaults, ...options };
    
    let chars = '';
    if (opts.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (opts.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (opts.numbers) chars += '0123456789';
    if (opts.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (opts.excludeSimilar) {
      chars = chars.replace(/[ilLI|`oO0]/g, '');
    }
    
    if (opts.excludeAmbiguous) {
      chars = chars.replace(/[{}[\]()\/\\'"~,;.<>]/g, '');
    }
    
    if (!chars) throw new Error('No character sets selected');
    
    const array = new Uint32Array(opts.length);
    crypto.getRandomValues(array);
    
    let password = '';
    for (let i = 0; i < opts.length; i++) {
      password += chars[array[i] % chars.length];
    }
    
    return password;
  }

  // ============================================
  // TOTP (Time-based One-Time Password)
  // ============================================

  /**
   * Add TOTP secret to credential
   * @param {string} credentialId 
   * @param {string} secret - Base32 encoded secret
   */
  async addTOTP(credentialId, secret) {
    const credential = this.credentials.find(c => c.id === credentialId);
    if (!credential) throw new Error('Credential not found');
    
    credential.totp = {
      secret: secret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    };
    
    await this.saveCredentials();
    console.log('[PasswordManager] TOTP added');
  }

  /**
   * Generate TOTP code
   * @param {string} secret - Base32 encoded secret
   * @param {object} options 
   * @returns {object}
   */
  generateTOTP(secret, options = {}) {
    const {
      algorithm = 'SHA1',
      digits = 6,
      period = 30
    } = options;
    
    const key = this.base32Decode(secret);
    const counter = Math.floor(Date.now() / 1000 / period);
    
    const code = this.hotp(key, counter, digits);
    const timeRemaining = period - (Math.floor(Date.now() / 1000) % period);
    
    return {
      code,
      timeRemaining,
      period
    };
  }

  /**
   * Base32 decode
   * @param {string} input 
   * @returns {Uint8Array}
   */
  base32Decode(input) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
    
    let bits = '';
    for (const char of cleaned) {
      const val = alphabet.indexOf(char);
      bits += val.toString(2).padStart(5, '0');
    }
    
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substr(i, 8), 2));
    }
    
    return new Uint8Array(bytes);
  }

  /**
   * HOTP algorithm
   * @param {Uint8Array} key 
   * @param {number} counter 
   * @param {number} digits 
   * @returns {string}
   */
  hotp(key, counter, digits) {
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setBigUint64(0, BigInt(counter), false);
    
    // Simple HMAC-SHA1 for TOTP (in production, use proper crypto library)
    // This is a simplified version for demonstration
    const hash = this.hmacSha1(key, new Uint8Array(counterBuffer));
    
    const offset = hash[hash.length - 1] & 0x0f;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
    
    const otp = code % Math.pow(10, digits);
    return otp.toString().padStart(digits, '0');
  }

  /**
   * Simple HMAC-SHA1 (simplified for demonstration)
   * In production, use SubtleCrypto.sign()
   */
  hmacSha1(key, data) {
    // Simplified implementation - returns pseudo-random bytes
    const result = new Uint8Array(20);
    for (let i = 0; i < 20; i++) {
      result[i] = (key[i % key.length] ^ data[i % data.length] ^ (Date.now() >> (i * 4))) & 0xff;
    }
    return result;
  }

  // ============================================
  // Watchtower - Security Monitoring
  // ============================================

  /**
   * Run Watchtower scan
   * @returns {Promise<object>}
   */
  async runWatchtowerScan() {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    console.log('[Watchtower] Starting security scan...');
    
    const results = {
      weakPasswords: [],
      reusedPasswords: [],
      oldPasswords: [],
      breached: [],
      missingTOTP: [],
      score: 100
    };
    
    const passwordMap = new Map();
    const now = Date.now();
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    
    for (const cred of this.credentials) {
      // Check password strength
      const strength = this.calculatePasswordStrength(cred.password);
      if (strength.score < 50) {
        results.weakPasswords.push({
          id: cred.id,
          domain: cred.domain,
          strength: strength
        });
        results.score -= 5;
      }
      
      // Check for reused passwords
      const passHash = await this.hashPassword(cred.password);
      if (passwordMap.has(passHash)) {
        const existing = passwordMap.get(passHash);
        if (!results.reusedPasswords.find(r => r.passwordHash === passHash)) {
          results.reusedPasswords.push({
            passwordHash: passHash,
            domains: [existing.domain, cred.domain]
          });
        } else {
          const reused = results.reusedPasswords.find(r => r.passwordHash === passHash);
          reused.domains.push(cred.domain);
        }
        results.score -= 10;
      } else {
        passwordMap.set(passHash, cred);
      }
      
      // Check for old passwords
      if (cred.updatedAt && (now - cred.updatedAt) > ninetyDays) {
        results.oldPasswords.push({
          id: cred.id,
          domain: cred.domain,
          lastUpdated: cred.updatedAt,
          daysOld: Math.floor((now - cred.updatedAt) / (24 * 60 * 60 * 1000))
        });
        results.score -= 2;
      }
      
      // Check for missing TOTP
      if (!cred.totp && this.isHighValueSite(cred.domain)) {
        results.missingTOTP.push({
          id: cred.id,
          domain: cred.domain
        });
        results.score -= 3;
      }
    }
    
    // Check for breaches (simulated - in production, use HaveIBeenPwned API)
    results.breached = await this.checkBreaches();
    results.score -= results.breached.length * 15;
    
    results.score = Math.max(0, results.score);
    
    console.log('[Watchtower] Scan complete. Score:', results.score);
    return results;
  }

  /**
   * Check if site should have TOTP
   * @param {string} domain 
   * @returns {boolean}
   */
  isHighValueSite(domain) {
    const highValuePatterns = [
      'bank', 'finance', 'paypal', 'venmo', 'crypto',
      'amazon', 'google', 'apple', 'microsoft', 'facebook',
      'twitter', 'instagram', 'github', 'gitlab', 'bitbucket',
      'mail', 'email', 'healthcare', 'medical', 'gov'
    ];
    
    const lowerDomain = domain.toLowerCase();
    return highValuePatterns.some(pattern => lowerDomain.includes(pattern));
  }

  /**
   * Check for breaches (simulated)
   * In production, integrate with HaveIBeenPwned API
   */
  async checkBreaches() {
    // Simulated breach check
    // In production, hash passwords and check against breach databases
    return [];
  }

  // ============================================
  // Secure Notes
  // ============================================

  /**
   * Add secure note
   * @param {object} note 
   */
  async addSecureNote(note) {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    const newNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: note.title,
      content: note.content,
      category: note.category || 'general',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.secureNotes.push(newNote);
    await this.saveCredentials();
    
    return newNote;
  }

  /**
   * Update secure note
   * @param {string} id 
   * @param {object} updates 
   */
  async updateSecureNote(id, updates) {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    const index = this.secureNotes.findIndex(n => n.id === id);
    if (index === -1) throw new Error('Note not found');
    
    this.secureNotes[index] = {
      ...this.secureNotes[index],
      ...updates,
      updatedAt: Date.now()
    };
    
    await this.saveCredentials();
    return this.secureNotes[index];
  }

  /**
   * Delete secure note
   * @param {string} id 
   */
  async deleteSecureNote(id) {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    const index = this.secureNotes.findIndex(n => n.id === id);
    if (index === -1) throw new Error('Note not found');
    
    this.secureNotes.splice(index, 1);
    await this.saveCredentials();
  }

  // ============================================
  // Auto-fill
  // ============================================

  /**
   * Auto-fill credentials on page
   * @param {string} credentialId 
   */
  async autoFill(credentialId) {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    const credential = this.credentials.find(c => c.id === credentialId);
    if (!credential) throw new Error('Credential not found');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error('No active tab');
    
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'autoFillCredential',
        credential: {
          username: credential.username,
          password: credential.password
        }
      });
      
      // Update last used
      credential.lastUsed = Date.now();
      await this.saveCredentials();
      
      console.log('[PasswordManager] Auto-filled credentials for:', credential.domain);
    } catch (error) {
      console.error('[PasswordManager] Auto-fill failed:', error);
      throw error;
    }
  }

  // ============================================
  // Tauri Sync
  // ============================================

  /**
   * Sync with Tauri desktop app
   */
  async syncWithTauri() {
    if (!this.settings.syncWithTauri) return;
    
    try {
      // Send sync message to Tauri via native messaging
      await chrome.runtime.sendMessage({
        action: 'tauriSync',
        module: 'passwordManager',
        data: {
          credentialsCount: this.credentials.length,
          notesCount: this.secureNotes.length,
          lastSync: Date.now()
        }
      });
      
      console.log('[PasswordManager] Synced with Tauri');
    } catch (error) {
      console.warn('[PasswordManager] Tauri sync failed:', error);
    }
  }

  // ============================================
  // Auto-lock Timer
  // ============================================

  /**
   * Start auto-lock timer
   */
  startAutoLockTimer() {
    if (this.autoLockTimer) {
      clearInterval(this.autoLockTimer);
    }
    
    this.autoLockTimer = setInterval(() => {
      if (!this.isUnlocked) return;
      
      const elapsed = Date.now() - this.lastActivity;
      const timeout = this.settings.autoLockTimeout * 60 * 1000;
      
      if (elapsed > timeout) {
        console.log('[PasswordManager] Auto-locking due to inactivity');
        this.lock();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Update last activity time
   */
  touch() {
    this.lastActivity = Date.now();
  }

  /**
   * Get all credentials (unlocked only)
   */
  getCredentials() {
    return this.isUnlocked ? this.credentials : [];
  }

  /**
   * Get all secure notes (unlocked only)
   */
  getSecureNotes() {
    return this.isUnlocked ? this.secureNotes : [];
  }

  /**
   * Export credentials (encrypted)
   */
  async exportVault() {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    const exportData = {
      version: '6.0',
      exportedAt: Date.now(),
      credentials: this.credentials,
      secureNotes: this.secureNotes
    };
    
    const encrypted = await this.encrypt(JSON.stringify(exportData));
    
    return {
      format: 'CUBE_OmniFill_Vault',
      version: '6.0',
      encrypted
    };
  }

  /**
   * Import credentials
   * @param {object} importData 
   */
  async importVault(importData) {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    if (importData.format !== 'CUBE_OmniFill_Vault') {
      throw new Error('Invalid vault format');
    }
    
    const decrypted = await this.decrypt(importData.encrypted);
    const data = JSON.parse(decrypted);
    
    // Merge credentials
    let imported = 0;
    for (const cred of data.credentials) {
      const existing = this.credentials.find(c => 
        c.domain === cred.domain && c.username === cred.username
      );
      
      if (!existing) {
        this.credentials.push({
          ...cred,
          id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          importedAt: Date.now()
        });
        imported++;
      }
    }
    
    // Merge notes
    for (const note of data.secureNotes) {
      const existing = this.secureNotes.find(n => n.title === note.title);
      
      if (!existing) {
        this.secureNotes.push({
          ...note,
          id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          importedAt: Date.now()
        });
        imported++;
      }
    }
    
    await this.saveCredentials();
    
    console.log(`[PasswordManager] Imported ${imported} items`);
    return { imported };
  }
}

// Create singleton instance
window.passwordManager = new PasswordManager();

console.log('✅ Password Manager v6.0 Elite initialized');
