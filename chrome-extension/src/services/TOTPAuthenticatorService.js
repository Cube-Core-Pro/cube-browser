// ═══════════════════════════════════════════════════════════════════════════════
// 🔢 TOTP AUTHENTICATOR SERVICE v1.0.0 - Time-based One-Time Password generator
// ═══════════════════════════════════════════════════════════════════════════════
//
// Features matching Google Authenticator / Bitwarden / 1Password:
// ✅ TOTP code generation (RFC 6238)
// ✅ Multiple accounts support
// ✅ QR code scanner for adding accounts
// ✅ Manual secret entry
// ✅ Auto-copy on field detection
// ✅ Visual countdown timer
// ✅ Backup/export secrets (encrypted)
// ✅ SHA-1, SHA-256, SHA-512 algorithm support
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  const STORAGE_KEY = 'cubeTotpAccounts';

  // ═══════════════════════════════════════════════════════════════════════════
  // TOTP ALGORITHM IMPLEMENTATION (RFC 6238)
  // ═══════════════════════════════════════════════════════════════════════════

  class TOTPAlgorithm {
    /**
     * Generate TOTP code
     * @param {string} secret - Base32 encoded secret
     * @param {number} time - Unix timestamp (defaults to now)
     * @param {number} period - Time step in seconds (default 30)
     * @param {number} digits - Number of digits (default 6)
     * @param {string} algorithm - Hash algorithm (SHA-1, SHA-256, SHA-512)
     */
    static async generate(secret, time = Date.now(), period = 30, digits = 6, algorithm = 'SHA-1') {
      // Decode base32 secret
      const keyBytes = this.base32Decode(secret);
      
      // Calculate time counter
      const counter = Math.floor(time / 1000 / period);
      const counterBytes = this.int64ToBytes(counter);
      
      // Import key for HMAC
      const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: algorithm },
        false,
        ['sign']
      );
      
      // Calculate HMAC
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        counterBytes
      );
      
      const hmac = new Uint8Array(signature);
      
      // Dynamic truncation (RFC 4226)
      const offset = hmac[hmac.length - 1] & 0x0f;
      const binary = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
      );
      
      // Generate OTP
      const otp = binary % Math.pow(10, digits);
      return otp.toString().padStart(digits, '0');
    }

    /**
     * Calculate remaining seconds until next code
     */
    static getTimeRemaining(period = 30) {
      return period - (Math.floor(Date.now() / 1000) % period);
    }

    /**
     * Base32 decode
     */
    static base32Decode(encoded) {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const cleanedInput = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
      
      let bits = '';
      for (const char of cleanedInput) {
        const val = alphabet.indexOf(char);
        if (val === -1) continue;
        bits += val.toString(2).padStart(5, '0');
      }
      
      const bytes = [];
      for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.substr(i, 8), 2));
      }
      
      return new Uint8Array(bytes);
    }

    /**
     * Convert 64-bit integer to byte array
     */
    static int64ToBytes(num) {
      const bytes = new Uint8Array(8);
      for (let i = 7; i >= 0; i--) {
        bytes[i] = num & 0xff;
        num = Math.floor(num / 256);
      }
      return bytes;
    }

    /**
     * Parse otpauth:// URI
     */
    static parseOtpAuthUri(uri) {
      try {
        const url = new URL(uri);
        
        if (url.protocol !== 'otpauth:') {
          throw new Error('Invalid protocol');
        }
        
        const type = url.hostname; // totp or hotp
        const path = decodeURIComponent(url.pathname.slice(1));
        const params = new URLSearchParams(url.search);
        
        // Parse label (issuer:account or just account)
        let issuer = params.get('issuer') || '';
        let account = path;
        
        if (path.includes(':')) {
          const parts = path.split(':');
          issuer = issuer || parts[0];
          account = parts.slice(1).join(':');
        }
        
        return {
          type: type,
          issuer: issuer,
          account: account,
          secret: params.get('secret') || '',
          algorithm: params.get('algorithm') || 'SHA1',
          digits: parseInt(params.get('digits') || '6'),
          period: parseInt(params.get('period') || '30'),
          counter: params.get('counter') ? parseInt(params.get('counter')) : null
        };
      } catch (error) {
        console.error('Failed to parse OTP auth URI:', error);
        return null;
      }
    }

    /**
     * Generate otpauth:// URI
     */
    static generateOtpAuthUri(account) {
      const label = account.issuer 
        ? `${encodeURIComponent(account.issuer)}:${encodeURIComponent(account.name)}`
        : encodeURIComponent(account.name);
      
      const params = new URLSearchParams({
        secret: account.secret,
        issuer: account.issuer || '',
        algorithm: account.algorithm || 'SHA1',
        digits: String(account.digits || 6),
        period: String(account.period || 30)
      });
      
      return `otpauth://totp/${label}?${params.toString()}`;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOTP AUTHENTICATOR SERVICE
  // ═══════════════════════════════════════════════════════════════════════════

  class TOTPAuthenticatorService {
    constructor() {
      this.accounts = [];
      this.codes = new Map(); // Cache current codes
      this.updateInterval = null;
      this.listeners = new Set();
      
      this.initialize();
    }

    async initialize() {
      console.log('🔢 TOTP Authenticator Service initializing...');
      
      // Load accounts
      await this.loadAccounts();
      
      // Start code update loop
      this.startUpdateLoop();
      
      console.log(`✅ TOTP Authenticator ready with ${this.accounts.length} accounts`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACCOUNT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    async loadAccounts() {
      try {
        if (chrome?.storage?.local) {
          const result = await chrome.storage.local.get(STORAGE_KEY);
          this.accounts = result[STORAGE_KEY] || [];
        }
      } catch (error) {
        console.warn('Failed to load TOTP accounts:', error);
        this.accounts = [];
      }
    }

    async saveAccounts() {
      try {
        if (chrome?.storage?.local) {
          await chrome.storage.local.set({ [STORAGE_KEY]: this.accounts });
        }
      } catch (error) {
        console.warn('Failed to save TOTP accounts:', error);
      }
    }

    async addAccount(accountData) {
      const account = {
        id: this.generateId(),
        name: accountData.name || accountData.account || 'Unknown',
        issuer: accountData.issuer || '',
        secret: accountData.secret.replace(/\s/g, '').toUpperCase(),
        algorithm: accountData.algorithm || 'SHA-1',
        digits: accountData.digits || 6,
        period: accountData.period || 30,
        createdAt: Date.now(),
        lastUsed: null,
        favicon: accountData.favicon || null
      };
      
      // Validate secret
      if (!this.validateSecret(account.secret)) {
        throw new Error('Invalid secret key');
      }
      
      // Check for duplicate
      const existing = this.accounts.find(a => 
        a.secret === account.secret || 
        (a.issuer === account.issuer && a.name === account.name)
      );
      
      if (existing) {
        throw new Error('Account already exists');
      }
      
      this.accounts.push(account);
      await this.saveAccounts();
      
      // Generate initial code
      await this.updateCode(account);
      
      this.notifyListeners('accountAdded', account);
      
      return account;
    }

    async addAccountFromUri(uri) {
      const parsed = TOTPAlgorithm.parseOtpAuthUri(uri);
      
      if (!parsed || parsed.type !== 'totp') {
        throw new Error('Invalid OTP auth URI');
      }
      
      return await this.addAccount({
        name: parsed.account,
        issuer: parsed.issuer,
        secret: parsed.secret,
        algorithm: parsed.algorithm.replace('SHA', 'SHA-'),
        digits: parsed.digits,
        period: parsed.period
      });
    }

    async removeAccount(accountId) {
      const index = this.accounts.findIndex(a => a.id === accountId);
      
      if (index === -1) {
        throw new Error('Account not found');
      }
      
      const removed = this.accounts.splice(index, 1)[0];
      this.codes.delete(accountId);
      
      await this.saveAccounts();
      this.notifyListeners('accountRemoved', removed);
      
      return removed;
    }

    async updateAccount(accountId, updates) {
      const account = this.accounts.find(a => a.id === accountId);
      
      if (!account) {
        throw new Error('Account not found');
      }
      
      Object.assign(account, updates, { id: accountId });
      
      await this.saveAccounts();
      this.notifyListeners('accountUpdated', account);
      
      return account;
    }

    getAccount(accountId) {
      return this.accounts.find(a => a.id === accountId);
    }

    getAccounts() {
      return [...this.accounts];
    }

    searchAccounts(query) {
      const lowerQuery = query.toLowerCase();
      return this.accounts.filter(account =>
        account.name.toLowerCase().includes(lowerQuery) ||
        account.issuer.toLowerCase().includes(lowerQuery)
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CODE GENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    async getCode(accountId) {
      const cached = this.codes.get(accountId);
      
      if (cached && cached.validUntil > Date.now()) {
        return cached;
      }
      
      const account = this.getAccount(accountId);
      if (!account) {
        throw new Error('Account not found');
      }
      
      return await this.updateCode(account);
    }

    async updateCode(account) {
      try {
        const code = await TOTPAlgorithm.generate(
          account.secret,
          Date.now(),
          account.period,
          account.digits,
          account.algorithm
        );
        
        const timeRemaining = TOTPAlgorithm.getTimeRemaining(account.period);
        const validUntil = Date.now() + (timeRemaining * 1000);
        
        const codeData = {
          code: code,
          timeRemaining: timeRemaining,
          period: account.period,
          validUntil: validUntil
        };
        
        this.codes.set(account.id, codeData);
        
        return codeData;
      } catch (error) {
        console.error('Failed to generate TOTP code:', error);
        return null;
      }
    }

    async getAllCodes() {
      const results = [];
      
      for (const account of this.accounts) {
        const codeData = await this.getCode(account.id);
        results.push({
          account: account,
          ...codeData
        });
      }
      
      return results;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UPDATE LOOP
    // ═══════════════════════════════════════════════════════════════════════════

    startUpdateLoop() {
      // Clear existing interval
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      
      // Update every second
      this.updateInterval = setInterval(async () => {
        const currentSecond = Math.floor(Date.now() / 1000);
        
        for (const account of this.accounts) {
          // Check if code needs refresh (every period seconds)
          if (currentSecond % account.period === 0) {
            await this.updateCode(account);
            this.notifyListeners('codeUpdated', {
              accountId: account.id,
              code: this.codes.get(account.id)
            });
          }
        }
        
        // Notify time remaining update
        this.notifyListeners('tick', {
          timeRemaining: TOTPAlgorithm.getTimeRemaining()
        });
        
      }, 1000);
    }

    stopUpdateLoop() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IMPORT/EXPORT
    // ═══════════════════════════════════════════════════════════════════════════

    exportAccounts(password = null) {
      const data = {
        version: 1,
        exportDate: new Date().toISOString(),
        accounts: this.accounts.map(account => ({
          name: account.name,
          issuer: account.issuer,
          secret: account.secret,
          algorithm: account.algorithm,
          digits: account.digits,
          period: account.period
        }))
      };
      
      if (password) {
        // Encrypt data
        return this.encryptData(JSON.stringify(data), password);
      }
      
      return JSON.stringify(data, null, 2);
    }

    async importAccounts(data, password = null) {
      let parsed;
      
      try {
        if (password) {
          const decrypted = await this.decryptData(data, password);
          parsed = JSON.parse(decrypted);
        } else {
          parsed = JSON.parse(data);
        }
      } catch {
        throw new Error('Invalid import data or wrong password');
      }
      
      if (!parsed.accounts || !Array.isArray(parsed.accounts)) {
        throw new Error('Invalid import format');
      }
      
      let imported = 0;
      let skipped = 0;
      
      for (const accountData of parsed.accounts) {
        try {
          await this.addAccount(accountData);
          imported++;
        } catch {
          skipped++;
        }
      }
      
      return { imported, skipped };
    }

    exportAsOtpAuthUris() {
      return this.accounts.map(account => 
        TOTPAlgorithm.generateOtpAuthUri(account)
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTOFILL INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════════

    async findAccountForSite(hostname) {
      const lowerHostname = hostname.toLowerCase();
      
      // Try to match by issuer or name containing hostname
      const matches = this.accounts.filter(account => {
        const issuer = account.issuer.toLowerCase();
        const name = account.name.toLowerCase();
        
        return issuer.includes(lowerHostname) ||
               name.includes(lowerHostname) ||
               lowerHostname.includes(issuer.replace(/\s/g, '')) ||
               lowerHostname.includes(name.replace(/\s/g, ''));
      });
      
      // Sort by last used
      matches.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
      
      return matches[0] || null;
    }

    async autofillTOTP(hostname) {
      const account = await this.findAccountForSite(hostname);
      
      if (!account) {
        return null;
      }
      
      const codeData = await this.getCode(account.id);
      
      // Update last used
      account.lastUsed = Date.now();
      await this.saveAccounts();
      
      return {
        account: account,
        code: codeData.code,
        timeRemaining: codeData.timeRemaining
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    generateId() {
      return `totp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    validateSecret(secret) {
      // Must be valid base32
      const base32Regex = /^[A-Z2-7]+=*$/i;
      const cleaned = secret.replace(/\s/g, '').toUpperCase();
      return base32Regex.test(cleaned) && cleaned.length >= 16;
    }

    async encryptData(data, password) {
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(data);
      
      // Derive key from password
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBytes
      );
      
      // Combine salt + iv + encrypted
      const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      result.set(salt, 0);
      result.set(iv, salt.length);
      result.set(new Uint8Array(encrypted), salt.length + iv.length);
      
      return btoa(String.fromCharCode(...result));
    }

    async decryptData(encryptedBase64, password) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      const encryptedBytes = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
      
      const salt = encryptedBytes.slice(0, 16);
      const iv = encryptedBytes.slice(16, 28);
      const data = encryptedBytes.slice(28);
      
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );
      
      return decoder.decode(decrypted);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    addListener(callback) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }

    notifyListeners(event, data) {
      for (const listener of this.listeners) {
        try {
          listener(event, data);
        } catch (error) {
          console.error('Listener error:', error);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════════

    destroy() {
      this.stopUpdateLoop();
      this.listeners.clear();
      this.codes.clear();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════════════

  window.TOTPAlgorithm = TOTPAlgorithm;
  window.TOTPAuthenticatorService = TOTPAuthenticatorService;
  window.cubeTotpAuthenticator = new TOTPAuthenticatorService();

  console.log('🔢 TOTP Authenticator Service loaded');

})(window);
