import { invoke } from '@tauri-apps/api/core';

/**
 * Window management functions
 */
export const windowCommands = {
  /**
   * Minimize the application window
   */
  minimize: async (): Promise<void> => {
    try {
      await invoke('minimize_window');
    } catch (error) {
      throw new Error(`Failed to minimize window: ${error}`);
    }
  },

  /**
   * Maximize the application window
   */
  maximize: async (): Promise<void> => {
    try {
      await invoke('maximize_window');
    } catch (error) {
      throw new Error(`Failed to maximize window: ${error}`);
    }
  },

  /**
   * Unmaximize (restore) the application window
   */
  unmaximize: async (): Promise<void> => {
    try {
      await invoke('unmaximize_window');
    } catch (error) {
      throw new Error(`Failed to unmaximize window: ${error}`);
    }
  },

  /**
   * Close the application window
   */
  close: async (): Promise<void> => {
    try {
      await invoke('close_window');
    } catch (error) {
      throw new Error(`Failed to close window: ${error}`);
    }
  },

  /**
   * Check if window is maximized
   */
  isMaximized: async (): Promise<boolean> => {
    try {
      return await invoke<boolean>('is_window_maximized');
    } catch (error) {
      throw new Error(`Failed to check window state: ${error}`);
    }
  },

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen: async (): Promise<void> => {
    try {
      await invoke('toggle_fullscreen');
    } catch (error) {
      throw new Error(`Failed to toggle fullscreen: ${error}`);
    }
  },

  /**
   * Set window title
   */
  setTitle: async (title: string): Promise<void> => {
    try {
      await invoke('set_window_title', { title });
    } catch (error) {
      throw new Error(`Failed to set window title: ${error}`);
    }
  },

  /**
   * Get window size
   */
  getSize: async (): Promise<{ width: number; height: number }> => {
    try {
      const [width, height] = await invoke<[number, number]>('get_window_size');
      return { width, height };
    } catch (error) {
      throw new Error(`Failed to get window size: ${error}`);
    }
  },

  /**
   * Set window size
   */
  setSize: async (width: number, height: number): Promise<void> => {
    try {
      await invoke('set_window_size', { width, height });
    } catch (error) {
      throw new Error(`Failed to set window size: ${error}`);
    }
  },

  /**
   * Center window on screen
   */
  center: async (): Promise<void> => {
    try {
      await invoke('center_window');
    } catch (error) {
      throw new Error(`Failed to center window: ${error}`);
    }
  },

  /**
   * Show window
   */
  show: async (): Promise<void> => {
    try {
      await invoke('show_window');
    } catch (error) {
      throw new Error(`Failed to show window: ${error}`);
    }
  },

  /**
   * Hide window
   */
  hide: async (): Promise<void> => {
    try {
      await invoke('hide_window');
    } catch (error) {
      throw new Error(`Failed to hide window: ${error}`);
    }
  },
};
