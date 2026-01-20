// CUBE Nexum - Picture-in-Picture Service
// TypeScript service for multi-PiP system

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('PiP');

// ==================== Types ====================

export type PipPosition = 
  | 'TopLeft'
  | 'TopRight'
  | 'BottomLeft'
  | 'BottomRight'
  | 'TopCenter'
  | 'BottomCenter'
  | 'LeftCenter'
  | 'RightCenter'
  | 'Center'
  | 'Custom';

export type PipSize = 'Small' | 'Medium' | 'Large' | 'ExtraLarge' | 'Custom';

export type PipContentType = 'Video' | 'Canvas' | 'Iframe' | 'Element' | 'Stream' | 'Screen' | 'Camera';

export interface PipWindowConfig {
  id: string;
  tab_id: string;
  source_selector: string;
  content_type: PipContentType;
  title: string;
  position: PipPosition;
  size: PipSize;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  always_on_top: boolean;
  muted: boolean;
  volume: number;
  playback_rate: number;
  paused: boolean;
  loop_enabled: boolean;
  current_time: number;
  duration: number;
  is_fullscreen: boolean;
  is_minimized: boolean;
  snap_to_edges: boolean;
  snap_threshold: number;
  created_at: number;
  last_active: number;
}

export interface PipSettings {
  enabled: boolean;
  max_windows: number;
  default_position: PipPosition;
  default_size: PipSize;
  default_opacity: number;
  auto_pip_on_tab_switch: boolean;
  auto_close_on_tab_close: boolean;
  remember_positions: boolean;
  keyboard_shortcuts_enabled: boolean;
  hover_controls: boolean;
  pip_for_any_video: boolean;
  pip_for_canvas: boolean;
  pip_for_iframes: boolean;
  show_pip_button: boolean;
  snap_zones_enabled: boolean;
  snap_threshold: number;
  cascade_new_windows: boolean;
  auto_mute_others: boolean;
  sync_playback: boolean;
}

export interface SnapZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  position: PipPosition;
  active: boolean;
}

export interface PipStats {
  total_windows_created: number;
  current_active_windows: number;
  total_watch_time_seconds: number;
  most_used_position: PipPosition | null;
  videos_pip_count: number;
  canvas_pip_count: number;
  iframe_pip_count: number;
  screen_pip_count: number;
  camera_pip_count: number;
}

// ==================== Event Types ====================

export type PipEventType = 
  | 'window-created'
  | 'window-closed'
  | 'window-moved'
  | 'window-resized'
  | 'playback-changed'
  | 'volume-changed'
  | 'fullscreen-changed'
  | 'settings-changed';

export interface PipEvent {
  type: PipEventType;
  windowId?: string;
  data?: unknown;
  timestamp: number;
}

type PipEventListener = (event: PipEvent) => void;

// ==================== Service Class ====================

class BrowserPipService {
  private static instance: BrowserPipService;
  private listeners: Map<PipEventType, Set<PipEventListener>> = new Map();
  private watchTimeInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): BrowserPipService {
    if (!BrowserPipService.instance) {
      BrowserPipService.instance = new BrowserPipService();
    }
    return BrowserPipService.instance;
  }

  // ==================== Event System ====================

  public on(event: PipEventType, listener: PipEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  public off(event: PipEventType, listener: PipEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: PipEvent): void {
    this.listeners.get(event.type)?.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        log.error('Error in PiP event listener:', error);
      }
    });
  }

  // ==================== Settings Management ====================

  public async getSettings(): Promise<PipSettings> {
    try {
      return await invoke<PipSettings>('pip_get_settings');
    } catch (error) {
      log.error('Failed to get PiP settings:', error);
      throw error;
    }
  }

  public async updateSettings(settings: PipSettings): Promise<void> {
    try {
      await invoke('pip_update_settings', { settings });
      this.emit({ type: 'settings-changed', timestamp: Date.now() });
    } catch (error) {
      log.error('Failed to update PiP settings:', error);
      throw error;
    }
  }

  public async setEnabled(enabled: boolean): Promise<void> {
    try {
      await invoke('pip_set_enabled', { enabled });
    } catch (error) {
      log.error('Failed to set PiP enabled:', error);
      throw error;
    }
  }

  public async setMaxWindows(max: number): Promise<void> {
    try {
      await invoke('pip_set_max_windows', { max });
    } catch (error) {
      log.error('Failed to set max windows:', error);
      throw error;
    }
  }

  public async setDefaultPosition(position: PipPosition): Promise<void> {
    try {
      await invoke('pip_set_default_position', { position });
    } catch (error) {
      log.error('Failed to set default position:', error);
      throw error;
    }
  }

  public async setDefaultSize(size: PipSize): Promise<void> {
    try {
      await invoke('pip_set_default_size', { size });
    } catch (error) {
      log.error('Failed to set default size:', error);
      throw error;
    }
  }

  public async setAutoPip(enabled: boolean): Promise<void> {
    try {
      await invoke('pip_set_auto_pip', { enabled });
    } catch (error) {
      log.error('Failed to set auto PiP:', error);
      throw error;
    }
  }

  public async setSnapZonesEnabled(enabled: boolean): Promise<void> {
    try {
      await invoke('pip_set_snap_zones_enabled', { enabled });
    } catch (error) {
      log.error('Failed to set snap zones enabled:', error);
      throw error;
    }
  }

  // ==================== Window Management ====================

  public async createWindow(
    tabId: string,
    selector: string,
    contentType: PipContentType,
    title?: string
  ): Promise<PipWindowConfig> {
    try {
      const window = await invoke<PipWindowConfig>('pip_create_window', {
        tabId,
        selector,
        contentType,
        title: title || null,
      });
      
      this.emit({
        type: 'window-created',
        windowId: window.id,
        data: window,
        timestamp: Date.now(),
      });
      
      this.startWatchTimeTracking();
      
      return window;
    } catch (error) {
      log.error('Failed to create PiP window:', error);
      throw error;
    }
  }

  public async closeWindow(windowId: string): Promise<void> {
    try {
      await invoke('pip_close_window', { windowId });
      
      this.emit({
        type: 'window-closed',
        windowId,
        timestamp: Date.now(),
      });
      
      // Check if we need to stop watch time tracking
      const windows = await this.getAllWindows();
      if (windows.length === 0) {
        this.stopWatchTimeTracking();
      }
    } catch (error) {
      log.error('Failed to close PiP window:', error);
      throw error;
    }
  }

  public async closeAllWindows(): Promise<number> {
    try {
      const count = await invoke<number>('pip_close_all_windows');
      
      this.emit({
        type: 'window-closed',
        data: { count },
        timestamp: Date.now(),
      });
      
      this.stopWatchTimeTracking();
      
      return count;
    } catch (error) {
      log.error('Failed to close all PiP windows:', error);
      throw error;
    }
  }

  public async closeWindowsForTab(tabId: string): Promise<number> {
    try {
      return await invoke<number>('pip_close_windows_for_tab', { tabId });
    } catch (error) {
      log.error('Failed to close windows for tab:', error);
      throw error;
    }
  }

  public async getWindow(windowId: string): Promise<PipWindowConfig | null> {
    try {
      return await invoke<PipWindowConfig | null>('pip_get_window', { windowId });
    } catch (error) {
      log.error('Failed to get PiP window:', error);
      throw error;
    }
  }

  public async getAllWindows(): Promise<PipWindowConfig[]> {
    try {
      return await invoke<PipWindowConfig[]>('pip_get_all_windows');
    } catch (error) {
      log.error('Failed to get all PiP windows:', error);
      throw error;
    }
  }

  public async getWindowsForTab(tabId: string): Promise<PipWindowConfig[]> {
    try {
      return await invoke<PipWindowConfig[]>('pip_get_windows_for_tab', { tabId });
    } catch (error) {
      log.error('Failed to get windows for tab:', error);
      throw error;
    }
  }

  // ==================== Window Control ====================

  public async updatePosition(windowId: string, x: number, y: number): Promise<void> {
    try {
      await invoke('pip_update_position', { windowId, x, y });
      
      this.emit({
        type: 'window-moved',
        windowId,
        data: { x, y },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Failed to update position:', error);
      throw error;
    }
  }

  public async updateSize(windowId: string, width: number, height: number): Promise<void> {
    try {
      await invoke('pip_update_size', { windowId, width, height });
      
      this.emit({
        type: 'window-resized',
        windowId,
        data: { width, height },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Failed to update size:', error);
      throw error;
    }
  }

  public async setOpacity(windowId: string, opacity: number): Promise<void> {
    try {
      await invoke('pip_set_opacity', { windowId, opacity });
    } catch (error) {
      log.error('Failed to set opacity:', error);
      throw error;
    }
  }

  public async setAlwaysOnTop(windowId: string, alwaysOnTop: boolean): Promise<void> {
    try {
      await invoke('pip_set_always_on_top', { windowId, alwaysOnTop });
    } catch (error) {
      log.error('Failed to set always on top:', error);
      throw error;
    }
  }

  public async minimizeWindow(windowId: string): Promise<void> {
    try {
      await invoke('pip_minimize_window', { windowId });
    } catch (error) {
      log.error('Failed to minimize window:', error);
      throw error;
    }
  }

  public async restoreWindow(windowId: string): Promise<void> {
    try {
      await invoke('pip_restore_window', { windowId });
    } catch (error) {
      log.error('Failed to restore window:', error);
      throw error;
    }
  }

  public async toggleFullscreen(windowId: string): Promise<boolean> {
    try {
      const isFullscreen = await invoke<boolean>('pip_toggle_fullscreen', { windowId });
      
      this.emit({
        type: 'fullscreen-changed',
        windowId,
        data: { isFullscreen },
        timestamp: Date.now(),
      });
      
      return isFullscreen;
    } catch (error) {
      log.error('Failed to toggle fullscreen:', error);
      throw error;
    }
  }

  // ==================== Playback Control ====================

  public async play(windowId: string): Promise<void> {
    try {
      await invoke('pip_play', { windowId });
      
      this.emit({
        type: 'playback-changed',
        windowId,
        data: { playing: true },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Failed to play:', error);
      throw error;
    }
  }

  public async pause(windowId: string): Promise<void> {
    try {
      await invoke('pip_pause', { windowId });
      
      this.emit({
        type: 'playback-changed',
        windowId,
        data: { playing: false },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Failed to pause:', error);
      throw error;
    }
  }

  public async togglePlayback(windowId: string): Promise<boolean> {
    try {
      const isPlaying = await invoke<boolean>('pip_toggle_playback', { windowId });
      
      this.emit({
        type: 'playback-changed',
        windowId,
        data: { playing: isPlaying },
        timestamp: Date.now(),
      });
      
      return isPlaying;
    } catch (error) {
      log.error('Failed to toggle playback:', error);
      throw error;
    }
  }

  public async mute(windowId: string): Promise<void> {
    try {
      await invoke('pip_mute', { windowId });
      
      this.emit({
        type: 'volume-changed',
        windowId,
        data: { muted: true },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Failed to mute:', error);
      throw error;
    }
  }

  public async unmute(windowId: string): Promise<void> {
    try {
      await invoke('pip_unmute', { windowId });
      
      this.emit({
        type: 'volume-changed',
        windowId,
        data: { muted: false },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Failed to unmute:', error);
      throw error;
    }
  }

  public async toggleMute(windowId: string): Promise<boolean> {
    try {
      const muted = await invoke<boolean>('pip_toggle_mute', { windowId });
      
      this.emit({
        type: 'volume-changed',
        windowId,
        data: { muted },
        timestamp: Date.now(),
      });
      
      return muted;
    } catch (error) {
      log.error('Failed to toggle mute:', error);
      throw error;
    }
  }

  public async setVolume(windowId: string, volume: number): Promise<void> {
    try {
      await invoke('pip_set_volume', { windowId, volume });
      
      this.emit({
        type: 'volume-changed',
        windowId,
        data: { volume },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Failed to set volume:', error);
      throw error;
    }
  }

  public async setPlaybackRate(windowId: string, rate: number): Promise<void> {
    try {
      await invoke('pip_set_playback_rate', { windowId, rate });
    } catch (error) {
      log.error('Failed to set playback rate:', error);
      throw error;
    }
  }

  public async seek(windowId: string, time: number): Promise<void> {
    try {
      await invoke('pip_seek', { windowId, time });
    } catch (error) {
      log.error('Failed to seek:', error);
      throw error;
    }
  }

  public async seekRelative(windowId: string, delta: number): Promise<number> {
    try {
      return await invoke<number>('pip_seek_relative', { windowId, delta });
    } catch (error) {
      log.error('Failed to seek relative:', error);
      throw error;
    }
  }

  public async toggleLoop(windowId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('pip_toggle_loop', { windowId });
    } catch (error) {
      log.error('Failed to toggle loop:', error);
      throw error;
    }
  }

  public async updatePlaybackState(
    windowId: string,
    currentTime: number,
    duration: number,
    paused: boolean
  ): Promise<void> {
    try {
      await invoke('pip_update_playback_state', {
        windowId,
        currentTime,
        duration,
        paused,
      });
    } catch (error) {
      log.error('Failed to update playback state:', error);
      throw error;
    }
  }

  // ==================== Multi-PiP Control ====================

  public async muteAll(): Promise<void> {
    try {
      await invoke('pip_mute_all');
    } catch (error) {
      log.error('Failed to mute all:', error);
      throw error;
    }
  }

  public async muteAllExcept(exceptId: string): Promise<void> {
    try {
      await invoke('pip_mute_all_except', { exceptId });
    } catch (error) {
      log.error('Failed to mute all except:', error);
      throw error;
    }
  }

  public async pauseAll(): Promise<void> {
    try {
      await invoke('pip_pause_all');
    } catch (error) {
      log.error('Failed to pause all:', error);
      throw error;
    }
  }

  public async playAll(): Promise<void> {
    try {
      await invoke('pip_play_all');
    } catch (error) {
      log.error('Failed to play all:', error);
      throw error;
    }
  }

  public async syncPlaybackTo(sourceWindowId: string): Promise<void> {
    try {
      await invoke('pip_sync_playback_to', { sourceWindowId });
    } catch (error) {
      log.error('Failed to sync playback:', error);
      throw error;
    }
  }

  // ==================== Snap Zones ====================

  public async getSnapZones(): Promise<SnapZone[]> {
    try {
      return await invoke<SnapZone[]>('pip_get_snap_zones');
    } catch (error) {
      log.error('Failed to get snap zones:', error);
      throw error;
    }
  }

  public async updateSnapZones(screenWidth: number, screenHeight: number): Promise<void> {
    try {
      await invoke('pip_update_snap_zones', { screenWidth, screenHeight });
    } catch (error) {
      log.error('Failed to update snap zones:', error);
      throw error;
    }
  }

  public async setSnapZoneActive(zoneId: string, active: boolean): Promise<void> {
    try {
      await invoke('pip_set_snap_zone_active', { zoneId, active });
    } catch (error) {
      log.error('Failed to set snap zone active:', error);
      throw error;
    }
  }

  // ==================== Statistics ====================

  public async getStats(): Promise<PipStats> {
    try {
      return await invoke<PipStats>('pip_get_stats');
    } catch (error) {
      log.error('Failed to get stats:', error);
      throw error;
    }
  }

  public async resetStats(): Promise<void> {
    try {
      await invoke('pip_reset_stats');
    } catch (error) {
      log.error('Failed to reset stats:', error);
      throw error;
    }
  }

  private async addWatchTime(seconds: number): Promise<void> {
    try {
      await invoke('pip_add_watch_time', { seconds });
    } catch (error) {
      log.error('Failed to add watch time:', error);
    }
  }

  private startWatchTimeTracking(): void {
    if (this.watchTimeInterval) return;
    
    // Track watch time every 10 seconds
    this.watchTimeInterval = setInterval(async () => {
      const windows = await this.getAllWindows();
      const activeWindows = windows.filter(w => !w.paused);
      
      if (activeWindows.length > 0) {
        await this.addWatchTime(10);
      }
    }, 10000);
  }

  private stopWatchTimeTracking(): void {
    if (this.watchTimeInterval) {
      clearInterval(this.watchTimeInterval);
      this.watchTimeInterval = null;
    }
  }

  // ==================== Position Memory ====================

  public async clearPositionMemory(): Promise<void> {
    try {
      await invoke('pip_clear_position_memory');
    } catch (error) {
      log.error('Failed to clear position memory:', error);
      throw error;
    }
  }

  public async getRememberedPosition(
    tabId: string,
    selector: string
  ): Promise<[number, number] | null> {
    try {
      return await invoke<[number, number] | null>('pip_get_remembered_position', {
        tabId,
        selector,
      });
    } catch (error) {
      log.error('Failed to get remembered position:', error);
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  public getSizePresets(): { size: PipSize; width: number; height: number; label: string }[] {
    return [
      { size: 'Small', width: 320, height: 180, label: 'Small (320x180)' },
      { size: 'Medium', width: 480, height: 270, label: 'Medium (480x270)' },
      { size: 'Large', width: 640, height: 360, label: 'Large (640x360)' },
      { size: 'ExtraLarge', width: 800, height: 450, label: 'Extra Large (800x450)' },
    ];
  }

  public getPositionPresets(): { position: PipPosition; label: string; icon: string }[] {
    return [
      { position: 'TopLeft', label: 'Top Left', icon: '↖' },
      { position: 'TopRight', label: 'Top Right', icon: '↗' },
      { position: 'BottomLeft', label: 'Bottom Left', icon: '↙' },
      { position: 'BottomRight', label: 'Bottom Right', icon: '↘' },
      { position: 'TopCenter', label: 'Top Center', icon: '↑' },
      { position: 'BottomCenter', label: 'Bottom Center', icon: '↓' },
      { position: 'LeftCenter', label: 'Left Center', icon: '←' },
      { position: 'RightCenter', label: 'Right Center', icon: '→' },
      { position: 'Center', label: 'Center', icon: '⊙' },
    ];
  }

  public getPlaybackRates(): { rate: number; label: string }[] {
    return [
      { rate: 0.25, label: '0.25x' },
      { rate: 0.5, label: '0.5x' },
      { rate: 0.75, label: '0.75x' },
      { rate: 1.0, label: '1x' },
      { rate: 1.25, label: '1.25x' },
      { rate: 1.5, label: '1.5x' },
      { rate: 1.75, label: '1.75x' },
      { rate: 2.0, label: '2x' },
      { rate: 3.0, label: '3x' },
      { rate: 4.0, label: '4x' },
    ];
  }

  public formatDuration(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  public formatWatchTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
  }
}

// Export singleton instance
export const browserPipService = BrowserPipService.getInstance();

// Export class for testing
export { BrowserPipService };
