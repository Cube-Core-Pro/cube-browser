import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('windowService');

/**
 * Window Service - Wrapper for Tauri window commands
 * Provides window management functionality
 */
class WindowServiceClass {
  /**
   * Minimize the window
   */
  async minimize(): Promise<void> {
    try {
      await invoke('minimize_window');
    } catch (error) {
      log.error('Failed to minimize window:', error);
      throw new Error(`Failed to minimize window: ${error}`);
    }
  }

  /**
   * Maximize the window
   */
  async maximize(): Promise<void> {
    try {
      await invoke('maximize_window');
    } catch (error) {
      log.error('Failed to maximize window:', error);
      throw new Error(`Failed to maximize window: ${error}`);
    }
  }

  /**
   * Unmaximize the window
   */
  async unmaximize(): Promise<void> {
    try {
      await invoke('unmaximize_window');
    } catch (error) {
      log.error('Failed to unmaximize window:', error);
      throw new Error(`Failed to unmaximize window: ${error}`);
    }
  }

  /**
   * Close the window
   */
  async close(): Promise<void> {
    try {
      await invoke('close_window');
    } catch (error) {
      log.error('Failed to close window:', error);
      throw new Error(`Failed to close window: ${error}`);
    }
  }

  /**
   * Check if window is maximized
   */
  async isMaximized(): Promise<boolean> {
    try {
      return await invoke<boolean>('is_window_maximized');
    } catch (error) {
      log.error('Failed to check if window is maximized:', error);
      return false;
    }
  }

  /**
   * Toggle fullscreen mode
   */
  async toggleFullscreen(): Promise<void> {
    try {
      await invoke('toggle_fullscreen');
    } catch (error) {
      log.error('Failed to toggle fullscreen:', error);
      throw new Error(`Failed to toggle fullscreen: ${error}`);
    }
  }

  /**
   * Set window title
   */
  async setTitle(title: string): Promise<void> {
    try {
      await invoke('set_window_title', { title });
    } catch (error) {
      log.error('Failed to set window title:', error);
      throw new Error(`Failed to set window title: ${error}`);
    }
  }

  /**
   * Get window size
   */
  async getSize(): Promise<{ width: number; height: number }> {
    try {
      return await invoke<{ width: number; height: number }>('get_window_size');
    } catch (error) {
      log.error('Failed to get window size:', error);
      throw new Error(`Failed to get window size: ${error}`);
    }
  }

  /**
   * Set window size
   */
  async setSize(width: number, height: number): Promise<void> {
    try {
      await invoke('set_window_size', { width, height });
    } catch (error) {
      log.error('Failed to set window size:', error);
      throw new Error(`Failed to set window size: ${error}`);
    }
  }

  /**
   * Center window on screen
   */
  async center(): Promise<void> {
    try {
      await invoke('center_window');
    } catch (error) {
      log.error('Failed to center window:', error);
      throw new Error(`Failed to center window: ${error}`);
    }
  }

  /**
   * Show window
   */
  async show(): Promise<void> {
    try {
      await invoke('show_window');
    } catch (error) {
      log.error('Failed to show window:', error);
      throw new Error(`Failed to show window: ${error}`);
    }
  }

  /**
   * Hide window
   */
  async hide(): Promise<void> {
    try {
      await invoke('hide_window');
    } catch (error) {
      log.error('Failed to hide window:', error);
      throw new Error(`Failed to hide window: ${error}`);
    }
  }
}

// Export singleton instance
export const windowService = new WindowServiceClass();
export default windowService;
