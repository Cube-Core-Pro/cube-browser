/**
 * 🔐 CUBE Nexum v7.0 - Encryption Service
 * 
 * Provides secure encryption for sensitive data like API keys.
 * Uses Web Crypto API with AES-256-GCM encryption.
 * 
 * Security Features:
 * - AES-256-GCM encryption
 * - PBKDF2 key derivation (100,000 iterations)
 * - Per-installation unique salt
 * - Secure random IV for each encryption
 * 
 * @version 1.0.0
 * @license CUBE Nexum Enterprise
 */

class EncryptionService {
  constructor() {
    this.ALGORITHM = 'AES-GCM';
    this.KEY_LENGTH = 256;
    this.IV_LENGTH = 12;
    this.SALT_LENGTH = 16;
    this.ITERATIONS = 100000;
    this.HASH_ALGORITHM = 'SHA-256';
    
    this.masterKey = null;
    this.installationId = null;
    
    console.log('🔐 EncryptionService v1.0.0 initialized');
  }

  /**
   * Initialize encryption service
   * Creates or loads the installation-specific encryption key
   */
  async initialize() {
    try {
      // Get or create installation ID (unique per browser installation)
      await this.ensureInstallationId();
      
      // Derive master key from installation ID
      await this.deriveMasterKey();
      
      console.log('✓ Encryption service ready');
      return true;
    } catch (error) {
      console.error('❌ Encryption service initialization failed:', error);
      return false;
    }
  }

  /**
   * Ensure we have a unique installation ID
   */
  async ensureInstallationId() {
    const result = await chrome.storage.local.get(['cube_installation_id', 'cube_installation_salt']);
    
    if (result.cube_installation_id && result.cube_installation_salt) {
      this.installationId = result.cube_installation_id;
      this.salt = this.base64ToBuffer(result.cube_installation_salt);
    } else {
      // Generate new installation ID and salt
      this.installationId = crypto.randomUUID();
      this.salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      
      await chrome.storage.local.set({
        cube_installation_id: this.installationId,
        cube_installation_salt: this.bufferToBase64(this.salt)
      });
      
      console.log('✓ Generated new installation credentials');
    }
  }

  /**
   * Derive master key from installation ID using PBKDF2
   */
  async deriveMasterKey() {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.installationId),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    this.masterKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.salt,
        iterations: this.ITERATIONS,
        hash: this.HASH_ALGORITHM
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt sensitive data
   * @param {string} plaintext - Data to encrypt
   * @returns {Promise<string>} - Base64 encoded encrypted data
   */
  async encrypt(plaintext) {
    if (!this.masterKey) {
      await this.initialize();
    }

    if (!plaintext) {
      throw new Error('No data to encrypt');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random IV for this encryption
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      this.masterKey,
      data
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    return this.bufferToBase64(combined);
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedBase64 - Base64 encoded encrypted data
   * @returns {Promise<string>} - Decrypted plaintext
   */
  async decrypt(encryptedBase64) {
    if (!this.masterKey) {
      await this.initialize();
    }

    if (!encryptedBase64) {
      throw new Error('No data to decrypt');
    }

    const combined = this.base64ToBuffer(encryptedBase64);
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, this.IV_LENGTH);
    const encryptedData = combined.slice(this.IV_LENGTH);
    
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      this.masterKey,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  }

  /**
   * Securely store an API key
   * @param {string} keyName - Storage key name (e.g., 'openai_apiKey')
   * @param {string} apiKey - The API key to store
   */
  async storeSecurely(keyName, apiKey) {
    const encrypted = await this.encrypt(apiKey);
    const storageKey = `cube_encrypted_${keyName}`;
    
    await chrome.storage.local.set({
      [storageKey]: encrypted,
      [`${storageKey}_version`]: 1 // For future migration support
    });
    
    console.log(`✓ Securely stored: ${keyName}`);
    return true;
  }

  /**
   * Retrieve a securely stored API key
   * @param {string} keyName - Storage key name
   * @returns {Promise<string|null>} - Decrypted API key or null
   */
  async retrieveSecurely(keyName) {
    const storageKey = `cube_encrypted_${keyName}`;
    const result = await chrome.storage.local.get([storageKey]);
    
    if (!result[storageKey]) {
      // Check for legacy unencrypted key and migrate
      const legacyResult = await chrome.storage.local.get([keyName]);
      if (legacyResult[keyName]) {
        console.log(`⚠️ Migrating legacy unencrypted key: ${keyName}`);
        await this.storeSecurely(keyName, legacyResult[keyName]);
        await chrome.storage.local.remove([keyName]);
        return legacyResult[keyName];
      }
      return null;
    }
    
    return await this.decrypt(result[storageKey]);
  }

  /**
   * Remove a securely stored key
   * @param {string} keyName - Storage key name
   */
  async removeSecurely(keyName) {
    const storageKey = `cube_encrypted_${keyName}`;
    await chrome.storage.local.remove([storageKey, `${storageKey}_version`]);
    console.log(`✓ Removed secure storage: ${keyName}`);
  }

  /**
   * Check if a key exists in secure storage
   * @param {string} keyName - Storage key name
   */
  async hasSecureKey(keyName) {
    const storageKey = `cube_encrypted_${keyName}`;
    const result = await chrome.storage.local.get([storageKey]);
    return !!result[storageKey];
  }

  /**
   * Utility: Convert ArrayBuffer to Base64
   */
  bufferToBase64(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Convert Base64 to ArrayBuffer
   */
  base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Generate a secure random string
   * @param {number} length - Length of the string
   */
  generateSecureRandom(length = 32) {
    const array = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash data using SHA-256
   * @param {string} data - Data to hash
   */
  async hash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.bufferToBase64(hashBuffer);
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

// Initialize on load
encryptionService.initialize().catch(console.error);

// Export for use
if (typeof globalThis !== 'undefined') {
  globalThis.EncryptionService = encryptionService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = encryptionService;
}
