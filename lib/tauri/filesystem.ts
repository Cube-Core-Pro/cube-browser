import { invoke } from '@tauri-apps/api/core';

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  is_dir: boolean;
  modified: string;
}

/**
 * Filesystem management functions
 */
export const filesystemCommands = {
  /**
   * Read text file contents
   */
  readFile: async (path: string): Promise<string> => {
    try {
      return await invoke<string>('read_file', { path });
    } catch (error) {
      throw new Error(`Failed to read file ${path}: ${error}`);
    }
  },

  /**
   * Read binary file contents
   */
  readFileBinary: async (path: string): Promise<Uint8Array> => {
    try {
      const data = await invoke<number[]>('read_file_binary', { path });
      return new Uint8Array(data);
    } catch (error) {
      throw new Error(`Failed to read binary file ${path}: ${error}`);
    }
  },

  /**
   * Write text file contents
   */
  writeFile: async (path: string, content: string): Promise<void> => {
    try {
      await invoke('write_file', { path, content });
    } catch (error) {
      throw new Error(`Failed to write file ${path}: ${error}`);
    }
  },

  /**
   * Write binary file contents
   */
  writeFileBinary: async (path: string, content: Uint8Array): Promise<void> => {
    try {
      const data = Array.from(content);
      await invoke('write_file_binary', { path, content: data });
    } catch (error) {
      throw new Error(`Failed to write binary file ${path}: ${error}`);
    }
  },

  /**
   * Delete file
   */
  deleteFile: async (path: string): Promise<void> => {
    try {
      await invoke('delete_file', { path });
    } catch (error) {
      throw new Error(`Failed to delete file ${path}: ${error}`);
    }
  },

  /**
   * Create directory (recursively creates parent directories)
   */
  createDirectory: async (path: string): Promise<void> => {
    try {
      await invoke('create_directory', { path });
    } catch (error) {
      throw new Error(`Failed to create directory ${path}: ${error}`);
    }
  },

  /**
   * Delete directory (recursively deletes all contents)
   */
  deleteDirectory: async (path: string): Promise<void> => {
    try {
      await invoke('delete_directory', { path });
    } catch (error) {
      throw new Error(`Failed to delete directory ${path}: ${error}`);
    }
  },

  /**
   * List directory contents
   */
  listDirectory: async (path: string): Promise<FileInfo[]> => {
    try {
      return await invoke<FileInfo[]>('list_directory', { path });
    } catch (error) {
      throw new Error(`Failed to list directory ${path}: ${error}`);
    }
  },

  /**
   * Check if file exists
   */
  fileExists: async (path: string): Promise<boolean> => {
    try {
      return await invoke<boolean>('file_exists', { path });
    } catch (error) {
      throw new Error(`Failed to check if file exists ${path}: ${error}`);
    }
  },

  /**
   * Get file information
   */
  getFileInfo: async (path: string): Promise<FileInfo> => {
    try {
      return await invoke<FileInfo>('get_file_info', { path });
    } catch (error) {
      throw new Error(`Failed to get file info for ${path}: ${error}`);
    }
  },

  /**
   * Copy file
   */
  copyFile: async (source: string, destination: string): Promise<void> => {
    try {
      await invoke('copy_file', { source, destination });
    } catch (error) {
      throw new Error(`Failed to copy file from ${source} to ${destination}: ${error}`);
    }
  },

  /**
   * Move file
   */
  moveFile: async (source: string, destination: string): Promise<void> => {
    try {
      await invoke('move_file', { source, destination });
    } catch (error) {
      throw new Error(`Failed to move file from ${source} to ${destination}: ${error}`);
    }
  },
};
