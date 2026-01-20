import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('Storage');

/**
 * Storage Service - Wrapper for Tauri storage commands
 * Provides persistent key-value storage
 */
class StorageServiceClass {
  /**
   * Set a value in storage
   */
  async set(key: string, value: string): Promise<void> {
    try {
      await invoke('storage_set', { key, value });
    } catch (error) {
      log.error('Storage set failed:', error);
      throw new Error(`Failed to set storage: ${error}`);
    }
  }

  /**
   * Get a value from storage
   */
  async get(key: string): Promise<string | null> {
    try {
      const value = await invoke<string | null>('storage_get', { key });
      return value;
    } catch (error) {
      log.error('Storage get failed:', error);
      return null;
    }
  }

  /**
   * Remove a value from storage
   */
  async remove(key: string): Promise<boolean> {
    try {
      const removed = await invoke<boolean>('storage_remove', { key });
      return removed;
    } catch (error) {
      log.error('Storage remove failed:', error);
      return false;
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      await invoke('storage_clear');
    } catch (error) {
      log.error('Storage clear failed:', error);
      throw new Error(`Failed to clear storage: ${error}`);
    }
  }

  /**
   * Get all keys in storage
   */
  async keys(): Promise<string[]> {
    try {
      const keys = await invoke<string[]>('storage_keys');
      return keys;
    } catch (error) {
      log.error('Storage keys failed:', error);
      return [];
    }
  }

  /**
   * Check if key exists in storage
   */
  async has(key: string): Promise<boolean> {
    try {
      const exists = await invoke<boolean>('storage_has', { key });
      return exists;
    } catch (error) {
      log.error('Storage has failed:', error);
      return false;
    }
  }

  /**
   * Set JSON object in storage
   */
  async setJSON<T>(key: string, value: T): Promise<void> {
    const json = JSON.stringify(value);
    await this.set(key, json);
  }

  /**
   * Get JSON object from storage
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      log.error('Failed to parse JSON:', error);
      return null;
    }
  }
}

// Export singleton instance
export const storageService = new StorageServiceClass();
export default storageService;
