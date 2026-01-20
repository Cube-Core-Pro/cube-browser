// Media Player Service - TypeScript wrapper for media operations
// Provides real HTML5 audio/video playback with controls

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('MediaPlayer');

// ============================================================================
// Types
// ============================================================================

/** Media item */
export interface MediaItem {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  media_type: 'audio' | 'video';
  file_path: string;
  duration?: number;
  thumbnail?: string;
  play_count: number;
  is_favorite: boolean;
  added_at: number;
  metadata?: MediaMetadata;
}

/** Media metadata */
export interface MediaMetadata {
  bitrate?: number;
  sample_rate?: number;
  channels?: number;
  codec?: string;
  resolution?: { width: number; height: number };
  file_size?: number;
}

/** Playlist */
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  items: string[]; // MediaItem IDs
  created_at: number;
  updated_at: number;
}

/** Playback state */
export interface PlaybackState {
  is_playing: boolean;
  current_time: number;
  duration: number;
  volume: number;
  is_muted: boolean;
  playback_rate: number;
  loop_mode: 'none' | 'one' | 'all';
  shuffle: boolean;
}

/** Media library statistics */
export interface MediaStats {
  total_items: number;
  audio_count: number;
  video_count: number;
  total_duration: number;
  favorites_count: number;
  total_size: number;
}

/** Equalizer preset */
export interface EqualizerPreset {
  name: string;
  bands: number[]; // 10-band EQ values (-12 to +12 dB)
}

/** Audio visualizer data */
export interface VisualizerData {
  frequencies: number[];
  waveform: number[];
}

// ============================================================================
// Media Library Management
// ============================================================================

/**
 * Get all media items
 * @param filter - Optional filter by media type
 * @returns Array of media items
 */
export async function getAllMedia(
  filter?: { media_type?: 'audio' | 'video'; favorites_only?: boolean }
): Promise<MediaItem[]> {
  try {
    return await invoke<MediaItem[]>('get_all_media', { filter });
  } catch (error) {
    log.error('Failed to get media:', error);
    return [];
  }
}

/**
 * Get a specific media item
 * @param id - Media item ID
 * @returns Media item or null
 */
export async function getMedia(id: string): Promise<MediaItem | null> {
  try {
    return await invoke<MediaItem>('get_media', { id });
  } catch (error) {
    log.error('Failed to get media:', error);
    return null;
  }
}

/**
 * Add a media item to the library
 * @param item - Media item to add
 * @returns Created media item
 */
export async function addMedia(item: Omit<MediaItem, 'id' | 'play_count' | 'added_at'>): Promise<MediaItem> {
  return invoke<MediaItem>('add_media', { item });
}

/**
 * Update a media item
 * @param id - Media item ID
 * @param updates - Fields to update
 */
export async function updateMedia(id: string, updates: Partial<MediaItem>): Promise<void> {
  return invoke('update_media', { id, updates });
}

/**
 * Delete a media item
 * @param id - Media item ID
 */
export async function deleteMedia(id: string): Promise<void> {
  return invoke('delete_media', { id });
}

/**
 * Toggle favorite status
 * @param id - Media item ID
 * @returns New favorite status
 */
export async function toggleFavorite(id: string): Promise<boolean> {
  return invoke<boolean>('toggle_media_favorite', { id });
}

/**
 * Increment play count
 * @param id - Media item ID
 */
export async function incrementPlayCount(id: string): Promise<void> {
  return invoke('increment_play_count', { id });
}

/**
 * Get media library statistics
 * @returns Media statistics
 */
export async function getMediaStats(): Promise<MediaStats> {
  return invoke<MediaStats>('get_media_stats');
}

/**
 * Search media library
 * @param query - Search query
 * @returns Matching media items
 */
export async function searchMedia(query: string): Promise<MediaItem[]> {
  return invoke<MediaItem[]>('search_media', { query });
}

// ============================================================================
// Playlist Management
// ============================================================================

/**
 * Get all playlists
 * @returns Array of playlists
 */
export async function getAllPlaylists(): Promise<Playlist[]> {
  try {
    return await invoke<Playlist[]>('get_all_playlists');
  } catch (error) {
    log.error('Failed to get playlists:', error);
    return [];
  }
}

/**
 * Get a specific playlist
 * @param id - Playlist ID
 * @returns Playlist or null
 */
export async function getPlaylist(id: string): Promise<Playlist | null> {
  try {
    return await invoke<Playlist>('get_playlist', { id });
  } catch (error) {
    log.error('Failed to get playlist:', error);
    return null;
  }
}

/**
 * Create a new playlist
 * @param name - Playlist name
 * @param description - Optional description
 * @returns Created playlist
 */
export async function createPlaylist(name: string, description?: string): Promise<Playlist> {
  return invoke<Playlist>('create_playlist', { name, description });
}

/**
 * Update a playlist
 * @param id - Playlist ID
 * @param updates - Fields to update
 */
export async function updatePlaylist(id: string, updates: Partial<Playlist>): Promise<void> {
  return invoke('update_playlist', { id, updates });
}

/**
 * Delete a playlist
 * @param id - Playlist ID
 */
export async function deletePlaylist(id: string): Promise<void> {
  return invoke('delete_playlist', { id });
}

/**
 * Add item to playlist
 * @param playlistId - Playlist ID
 * @param mediaId - Media item ID
 */
export async function addToPlaylist(playlistId: string, mediaId: string): Promise<void> {
  return invoke('add_to_playlist', { playlistId, mediaId });
}

/**
 * Remove item from playlist
 * @param playlistId - Playlist ID
 * @param mediaId - Media item ID
 */
export async function removeFromPlaylist(playlistId: string, mediaId: string): Promise<void> {
  return invoke('remove_from_playlist', { playlistId, mediaId });
}

/**
 * Reorder playlist items
 * @param playlistId - Playlist ID
 * @param itemIds - New order of item IDs
 */
export async function reorderPlaylist(playlistId: string, itemIds: string[]): Promise<void> {
  return invoke('reorder_playlist', { playlistId, itemIds });
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Open file picker for media files
 * @param type - Media type to filter
 * @returns Selected file paths
 */
export async function pickMediaFiles(type: 'audio' | 'video' | 'all' = 'all'): Promise<string[]> {
  const filters = [];
  
  if (type === 'audio' || type === 'all') {
    filters.push({
      name: 'Audio',
      extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'],
    });
  }
  
  if (type === 'video' || type === 'all') {
    filters.push({
      name: 'Video',
      extensions: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'wmv', 'flv'],
    });
  }
  
  const result = await open({
    multiple: true,
    filters,
    title: 'Select Media Files',
  });
  
  if (result === null) {
    return [];
  }
  
  return Array.isArray(result) ? result : [result];
}

/**
 * Convert file path to playable URL
 * @param filePath - Local file path
 * @returns URL that can be used in audio/video elements
 */
export function getPlayableUrl(filePath: string): string {
  return convertFileSrc(filePath);
}

/**
 * Get media type from file extension
 * @param filePath - File path
 * @returns Media type
 */
export function getMediaType(filePath: string): 'audio' | 'video' {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'];
  return audioExtensions.includes(ext) ? 'audio' : 'video';
}

/**
 * Extract filename without extension
 * @param filePath - File path
 * @returns Filename without extension
 */
export function extractTitle(filePath: string): string {
  const filename = filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
  return filename.replace(/\.[^/.]+$/, '');
}

// ============================================================================
// HTML5 Player Controller Class
// ============================================================================

export class MediaPlayerController {
  private element: HTMLAudioElement | HTMLVideoElement | null = null;
  private mediaItem: MediaItem | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private eqNodes: BiquadFilterNode[] = [];
  private onStateChange: ((state: PlaybackState) => void) | null = null;
  private onVisualizerUpdate: ((data: VisualizerData) => void) | null = null;
  private animationFrame: number | null = null;
  
  // State
  private _state: PlaybackState = {
    is_playing: false,
    current_time: 0,
    duration: 0,
    volume: 1,
    is_muted: false,
    playback_rate: 1,
    loop_mode: 'none',
    shuffle: false,
  };
  
  // Playlist state
  private playlist: MediaItem[] = [];
  private currentIndex = -1;
  
  constructor() {
    this.setupAudioContext();
  }
  
  /**
   * Get current playback state
   */
  get state(): PlaybackState {
    return { ...this._state };
  }
  
  /**
   * Get current media item
   */
  get currentMedia(): MediaItem | null {
    return this.mediaItem;
  }
  
  /**
   * Set state change callback
   */
  setOnStateChange(callback: (state: PlaybackState) => void): void {
    this.onStateChange = callback;
  }
  
  /**
   * Set visualizer update callback
   */
  setOnVisualizerUpdate(callback: (data: VisualizerData) => void): void {
    this.onVisualizerUpdate = callback;
  }
  
  /**
   * Setup Web Audio API context
   */
  private setupAudioContext(): void {
    if (typeof window === 'undefined') return;
    
    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.gainNode = this.audioContext.createGain();
      
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Create 10-band EQ
      const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      this.eqNodes = frequencies.map((freq) => {
        const filter = this.audioContext!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });
    } catch (error) {
      log.error('Failed to setup audio context:', error);
    }
  }
  
  /**
   * Connect audio element to Web Audio API
   */
  private connectAudioNodes(): void {
    if (!this.element || !this.audioContext || !this.analyser || !this.gainNode) return;
    if (this.source) return; // Already connected
    
    try {
      this.source = this.audioContext.createMediaElementSource(this.element);
      
      // Connect chain: source -> EQ -> gain -> analyser -> destination
      let lastNode: AudioNode = this.source;
      
      for (const eqNode of this.eqNodes) {
        lastNode.connect(eqNode);
        lastNode = eqNode;
      }
      
      lastNode.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    } catch (error) {
      log.error('Failed to connect audio nodes:', error);
    }
  }
  
  /**
   * Start visualizer animation loop
   */
  private startVisualizerLoop(): void {
    if (!this.analyser || !this.onVisualizerUpdate) return;
    
    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    const waveformData = new Uint8Array(this.analyser.fftSize);
    
    const update = () => {
      if (!this.analyser || !this.onVisualizerUpdate) return;
      
      this.analyser.getByteFrequencyData(frequencyData);
      this.analyser.getByteTimeDomainData(waveformData);
      
      this.onVisualizerUpdate({
        frequencies: Array.from(frequencyData),
        waveform: Array.from(waveformData),
      });
      
      if (this._state.is_playing) {
        this.animationFrame = requestAnimationFrame(update);
      }
    };
    
    this.animationFrame = requestAnimationFrame(update);
  }
  
  /**
   * Stop visualizer animation loop
   */
  private stopVisualizerLoop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<PlaybackState>): void {
    this._state = { ...this._state, ...updates };
    this.onStateChange?.(this._state);
  }
  
  /**
   * Load a media item
   */
  async load(item: MediaItem): Promise<void> {
    // Create appropriate element
    if (item.media_type === 'audio') {
      this.element = document.createElement('audio');
    } else {
      this.element = document.createElement('video');
    }
    
    this.mediaItem = item;
    
    // Set source
    const url = getPlayableUrl(item.file_path);
    this.element.src = url;
    
    // Set initial state
    this.element.volume = this._state.volume;
    this.element.muted = this._state.is_muted;
    this.element.playbackRate = this._state.playback_rate;
    
    // Setup event listeners
    this.element.addEventListener('loadedmetadata', () => {
      this.updateState({ duration: this.element?.duration || 0 });
    });
    
    this.element.addEventListener('timeupdate', () => {
      this.updateState({ current_time: this.element?.currentTime || 0 });
    });
    
    this.element.addEventListener('play', () => {
      this.updateState({ is_playing: true });
      this.startVisualizerLoop();
    });
    
    this.element.addEventListener('pause', () => {
      this.updateState({ is_playing: false });
      this.stopVisualizerLoop();
    });
    
    this.element.addEventListener('ended', () => {
      this.handleEnded();
    });
    
    this.element.addEventListener('volumechange', () => {
      this.updateState({
        volume: this.element?.volume || 1,
        is_muted: this.element?.muted || false,
      });
    });
    
    // Connect to Web Audio API for visualizer
    if (item.media_type === 'audio') {
      this.connectAudioNodes();
    }
    
    // Load the media
    await this.element.load();
    
    // Increment play count
    try {
      await incrementPlayCount(item.id);
    } catch (error) {
      log.error('Failed to increment play count:', error);
    }
  }
  
  /**
   * Play
   */
  async play(): Promise<void> {
    if (!this.element) return;
    
    // Resume audio context if suspended
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    await this.element.play();
  }
  
  /**
   * Pause
   */
  pause(): void {
    this.element?.pause();
  }
  
  /**
   * Toggle play/pause
   */
  async togglePlay(): Promise<void> {
    if (this._state.is_playing) {
      this.pause();
    } else {
      await this.play();
    }
  }
  
  /**
   * Stop and reset
   */
  stop(): void {
    if (this.element) {
      this.element.pause();
      this.element.currentTime = 0;
    }
    this.updateState({ is_playing: false, current_time: 0 });
  }
  
  /**
   * Seek to position
   */
  seek(time: number): void {
    if (this.element) {
      this.element.currentTime = Math.max(0, Math.min(time, this._state.duration));
    }
  }
  
  /**
   * Seek relative
   */
  seekRelative(delta: number): void {
    this.seek(this._state.current_time + delta);
  }
  
  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    const v = Math.max(0, Math.min(1, volume));
    if (this.element) {
      this.element.volume = v;
    }
    if (this.gainNode) {
      this.gainNode.gain.value = v;
    }
    this.updateState({ volume: v });
  }
  
  /**
   * Toggle mute
   */
  toggleMute(): void {
    if (this.element) {
      this.element.muted = !this.element.muted;
    }
  }
  
  /**
   * Set playback rate
   */
  setPlaybackRate(rate: number): void {
    const r = Math.max(0.25, Math.min(4, rate));
    if (this.element) {
      this.element.playbackRate = r;
    }
    this.updateState({ playback_rate: r });
  }
  
  /**
   * Set loop mode
   */
  setLoopMode(mode: 'none' | 'one' | 'all'): void {
    if (this.element) {
      this.element.loop = mode === 'one';
    }
    this.updateState({ loop_mode: mode });
  }
  
  /**
   * Toggle shuffle
   */
  toggleShuffle(): void {
    this.updateState({ shuffle: !this._state.shuffle });
  }
  
  /**
   * Set EQ band gain
   */
  setEqBand(index: number, gain: number): void {
    if (index >= 0 && index < this.eqNodes.length) {
      this.eqNodes[index].gain.value = Math.max(-12, Math.min(12, gain));
    }
  }
  
  /**
   * Apply EQ preset
   */
  applyEqPreset(preset: EqualizerPreset): void {
    preset.bands.forEach((gain, index) => {
      this.setEqBand(index, gain);
    });
  }
  
  /**
   * Reset EQ to flat
   */
  resetEq(): void {
    this.eqNodes.forEach(node => {
      node.gain.value = 0;
    });
  }
  
  /**
   * Get video element (for rendering)
   */
  getVideoElement(): HTMLVideoElement | null {
    if (this.mediaItem?.media_type === 'video' && this.element instanceof HTMLVideoElement) {
      return this.element;
    }
    return null;
  }
  
  // ============================================================================
  // Playlist Controls
  // ============================================================================
  
  /**
   * Load playlist
   */
  loadPlaylist(items: MediaItem[], startIndex = 0): void {
    this.playlist = items;
    this.currentIndex = startIndex;
    
    if (items.length > 0 && startIndex < items.length) {
      this.load(items[startIndex]);
    }
  }
  
  /**
   * Handle track ended
   */
  private handleEnded(): void {
    this.updateState({ is_playing: false });
    
    if (this._state.loop_mode === 'one') {
      this.seek(0);
      this.play();
    } else if (this._state.loop_mode === 'all' || this.currentIndex < this.playlist.length - 1) {
      this.next();
    }
  }
  
  /**
   * Play next track
   */
  async next(): Promise<void> {
    if (this.playlist.length === 0) return;
    
    let nextIndex: number;
    
    if (this._state.shuffle) {
      nextIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      nextIndex = (this.currentIndex + 1) % this.playlist.length;
    }
    
    this.currentIndex = nextIndex;
    await this.load(this.playlist[nextIndex]);
    await this.play();
  }
  
  /**
   * Play previous track
   */
  async previous(): Promise<void> {
    if (this.playlist.length === 0) return;
    
    // If more than 3 seconds in, restart current track
    if (this._state.current_time > 3) {
      this.seek(0);
      return;
    }
    
    let prevIndex: number;
    
    if (this._state.shuffle) {
      prevIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      prevIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    }
    
    this.currentIndex = prevIndex;
    await this.load(this.playlist[prevIndex]);
    await this.play();
  }
  
  /**
   * Play specific track from playlist
   */
  async playAt(index: number): Promise<void> {
    if (index < 0 || index >= this.playlist.length) return;
    
    this.currentIndex = index;
    await this.load(this.playlist[index]);
    await this.play();
  }
  
  /**
   * Get current playlist index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }
  
  /**
   * Get playlist
   */
  getPlaylist(): MediaItem[] {
    return [...this.playlist];
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    this.stopVisualizerLoop();
    this.stop();
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.element = null;
    this.mediaItem = null;
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.gainNode = null;
    this.eqNodes = [];
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format duration for display
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (MM:SS or HH:MM:SS)
 */
export function formatDuration(seconds: number | undefined): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * Get default EQ presets
 */
export function getEqPresets(): EqualizerPreset[] {
  return [
    { name: 'Flat', bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: 'Bass Boost', bands: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
    { name: 'Treble Boost', bands: [0, 0, 0, 0, 0, 0, 2, 4, 5, 6] },
    { name: 'Rock', bands: [5, 4, 3, 1, -1, -1, 2, 3, 4, 5] },
    { name: 'Pop', bands: [-1, 1, 4, 5, 4, 2, 0, -1, -1, -1] },
    { name: 'Jazz', bands: [4, 3, 1, 2, -2, -2, 0, 1, 3, 4] },
    { name: 'Classical', bands: [5, 4, 3, 2, -1, -1, 0, 2, 3, 4] },
    { name: 'Electronic', bands: [5, 4, 2, 0, -2, -1, 0, 2, 4, 5] },
    { name: 'Vocal', bands: [-2, -1, 0, 3, 5, 5, 4, 2, 0, -2] },
  ];
}

/**
 * Singleton instance
 */
let playerInstance: MediaPlayerController | null = null;

/**
 * Get player instance (singleton)
 */
export function getPlayer(): MediaPlayerController {
  if (!playerInstance) {
    playerInstance = new MediaPlayerController();
  }
  return playerInstance;
}

/**
 * Create new player instance
 */
export function createPlayer(): MediaPlayerController {
  return new MediaPlayerController();
}
