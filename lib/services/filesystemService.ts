import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('filesystemService');

/**
 * File information structure
 */
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  is_dir: boolean;
  is_file: boolean;
  is_symlink: boolean;
  modified: number;
  created: number;
}

/**
 * Filesystem Service - Wrapper for Tauri filesystem commands
 * Provides file and directory operations
 */
class FilesystemServiceClass {
  /**
   * Read file as text
   */
  async readFile(path: string): Promise<string> {
    try {
      return await invoke<string>('read_file', { path });
    } catch (error) {
      log.error('Failed to read file:', error);
      throw new Error(`Failed to read file: ${error}`);
    }
  }

  /**
   * Read file as binary
   */
  async readFileBinary(path: string): Promise<Uint8Array> {
    try {
      return await invoke<Uint8Array>('read_file_binary', { path });
    } catch (error) {
      log.error('Failed to read file binary:', error);
      throw new Error(`Failed to read file binary: ${error}`);
    }
  }

  /**
   * Write file with text content
   */
  async writeFile(path: string, content: string): Promise<void> {
    try {
      await invoke('write_file', { path, content });
    } catch (error) {
      log.error('Failed to write file:', error);
      throw new Error(`Failed to write file: ${error}`);
    }
  }

  /**
   * Write file with binary content
   */
  async writeFileBinary(path: string, content: Uint8Array): Promise<void> {
    try {
      await invoke('write_file_binary', { path, content: Array.from(content) });
    } catch (error) {
      log.error('Failed to write file binary:', error);
      throw new Error(`Failed to write file binary: ${error}`);
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(path: string): Promise<void> {
    try {
      await invoke('delete_file', { path });
    } catch (error) {
      log.error('Failed to delete file:', error);
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(path: string): Promise<void> {
    try {
      await invoke('create_directory', { path });
    } catch (error) {
      log.error('Failed to create directory:', error);
      throw new Error(`Failed to create directory: ${error}`);
    }
  }

  /**
   * Delete a directory
   */
  async deleteDirectory(path: string): Promise<void> {
    try {
      await invoke('delete_directory', { path });
    } catch (error) {
      log.error('Failed to delete directory:', error);
      throw new Error(`Failed to delete directory: ${error}`);
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(path: string): Promise<FileInfo[]> {
    try {
      return await invoke<FileInfo[]>('list_directory', { path });
    } catch (error) {
      log.error('Failed to list directory:', error);
      throw new Error(`Failed to list directory: ${error}`);
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      return await invoke<boolean>('file_exists', { path });
    } catch (error) {
      log.error('Failed to check file exists:', error);
      return false;
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(path: string): Promise<FileInfo> {
    try {
      return await invoke<FileInfo>('get_file_info', { path });
    } catch (error) {
      log.error('Failed to get file info:', error);
      throw new Error(`Failed to get file info: ${error}`);
    }
  }

  /**
   * Copy file
   */
  async copyFile(source: string, destination: string): Promise<void> {
    try {
      await invoke('copy_file', { source, destination });
    } catch (error) {
      log.error('Failed to copy file:', error);
      throw new Error(`Failed to copy file: ${error}`);
    }
  }

  /**
   * Move file
   */
  async moveFile(source: string, destination: string): Promise<void> {
    try {
      await invoke('move_file', { source, destination });
    } catch (error) {
      log.error('Failed to move file:', error);
      throw new Error(`Failed to move file: ${error}`);
    }
  }

  /**
   * Write JSON to file
   */
  async writeJSON<T>(path: string, data: T): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    await this.writeFile(path, json);
  }

  /**
   * Read JSON from file
   */
  async readJSON<T>(path: string): Promise<T> {
    const content = await this.readFile(path);
    return JSON.parse(content) as T;
  }
}

// Export singleton instance
export const filesystemService = new FilesystemServiceClass();
export default filesystemService;
