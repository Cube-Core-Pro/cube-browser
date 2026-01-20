/**
 * Media Player Types - Complete TypeScript Type System
 * CUBE Nexum Platform v2.0
 * 
 * Comprehensive types for media player with playlist management,
 * equalizer, subtitles, and streaming support.
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type MediaType = 'audio' | 'video';
export type MediaFormat = 'mp3' | 'mp4' | 'webm' | 'ogg' | 'wav' | 'flac' | 'm4a' | 'avi' | 'mkv' | 'mov';
export type PlaybackState = 'playing' | 'paused' | 'stopped' | 'loading' | 'error';
export type RepeatMode = 'off' | 'one' | 'all';
export type PlaylistSortBy = 'title' | 'artist' | 'album' | 'duration' | 'date_added';
export type QualityPreset = 'auto' | '360p' | '480p' | '720p' | '1080p' | '4k';

// ============================================================================
// MEDIA ITEM
// ============================================================================

export interface MediaItem {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration: number;
  file_path: string;
  file_size: number;
  format: MediaFormat;
  type: MediaType;
  thumbnail?: string;
  metadata: MediaMetadata;
  added_at: number;
}

export interface MediaMetadata {
  bitrate?: number;
  sample_rate?: number;
  channels?: number;
  codec?: string;
  resolution?: string;
  frame_rate?: number;
  year?: number;
  genre?: string;
  track_number?: number;
  disc_number?: number;
  lyrics?: string;
}

// ============================================================================
// PLAYLIST
// ============================================================================

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  items: MediaItem[];
  current_index: number;
  shuffle_enabled: boolean;
  repeat_mode: RepeatMode;
  created_at: number;
  updated_at: number;
  thumbnail?: string;
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  items?: MediaItem[];
}

// ============================================================================
// PLAYBACK STATE
// ============================================================================

export interface PlaybackInfo {
  state: PlaybackState;
  current_item: MediaItem | null;
  current_time: number;
  duration: number;
  volume: number;
  muted: boolean;
  playback_rate: number;
  buffered_percent: number;
  quality: QualityPreset;
}

// ============================================================================
// EQUALIZER
// ============================================================================

export interface EqualizerSettings {
  enabled: boolean;
  preset: EqualizerPreset;
  bands: EqualizerBand[];
}

export type EqualizerPreset =
  | 'flat'
  | 'rock'
  | 'pop'
  | 'jazz'
  | 'classical'
  | 'electronic'
  | 'bass_boost'
  | 'treble_boost'
  | 'vocal_boost'
  | 'custom';

export interface EqualizerBand {
  frequency: number;
  gain: number; // -12 to +12 dB
}

// ============================================================================
// SUBTITLES
// ============================================================================

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  file_path?: string;
  content?: string;
  format: 'srt' | 'vtt' | 'ass';
  is_active: boolean;
}

export interface SubtitleCue {
  start_time: number;
  end_time: number;
  text: string;
}

// ============================================================================
// STREAMING
// ============================================================================

export interface StreamSource {
  id: string;
  url: string;
  type: 'hls' | 'dash' | 'direct';
  quality_levels: QualityLevel[];
  current_quality: QualityPreset;
}

export interface QualityLevel {
  preset: QualityPreset;
  bitrate: number;
  resolution?: string;
  url?: string;
}

// ============================================================================
// PLAYER SETTINGS
// ============================================================================

export interface PlayerSettings {
  auto_play: boolean;
  auto_play_next: boolean;
  remember_position: boolean;
  default_volume: number;
  default_playback_rate: number;
  default_quality: QualityPreset;
  subtitle_font_size: number;
  subtitle_color: string;
  subtitle_background_color: string;
  skip_forward_seconds: number;
  skip_backward_seconds: number;
  visualizer_enabled: boolean;
  mini_player_enabled: boolean;
}

// ============================================================================
// VISUALIZATION
// ============================================================================

export interface VisualizerSettings {
  enabled: boolean;
  type: VisualizerType;
  colors: string[];
  smoothness: number;
  intensity: number;
}

export type VisualizerType =
  | 'bars'
  | 'wave'
  | 'circular'
  | 'particles'
  | 'spectrum';

// ============================================================================
// PLAYER STATE
// ============================================================================

export interface PlayerState {
  playback: PlaybackInfo;
  playlist: Playlist | null;
  playlists: Playlist[];
  equalizer: EqualizerSettings;
  subtitles: SubtitleTrack[];
  active_subtitle: SubtitleTrack | null;
  settings: PlayerSettings;
  visualizer: VisualizerSettings;
  stream_source: StreamSource | null;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface MediaPlayerEvent {
  type: MediaEventType;
  timestamp: number;
  data?: any;
}

export type MediaEventType =
  | 'play'
  | 'pause'
  | 'stop'
  | 'ended'
  | 'timeupdate'
  | 'volumechange'
  | 'ratechange'
  | 'seeked'
  | 'buffering'
  | 'error'
  | 'metadata'
  | 'trackchange';

// ============================================================================
// SEARCH & FILTER
// ============================================================================

export interface MediaSearchQuery {
  query: string;
  type?: MediaType;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
}

export interface MediaFilter {
  type?: MediaType;
  format?: MediaFormat[];
  min_duration?: number;
  max_duration?: number;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default player settings
 */
export function getDefaultPlayerSettings(): PlayerSettings {
  return {
    auto_play: false,
    auto_play_next: true,
    remember_position: true,
    default_volume: 0.8,
    default_playback_rate: 1.0,
    default_quality: 'auto',
    subtitle_font_size: 16,
    subtitle_color: '#ffffff',
    subtitle_background_color: 'rgba(0, 0, 0, 0.7)',
    skip_forward_seconds: 10,
    skip_backward_seconds: 10,
    visualizer_enabled: false,
    mini_player_enabled: false,
  };
}

/**
 * Get default equalizer settings
 */
export function getDefaultEqualizerSettings(): EqualizerSettings {
  return {
    enabled: false,
    preset: 'flat',
    bands: getEqualizerBands('flat'),
  };
}

/**
 * Get equalizer bands for preset
 */
export function getEqualizerBands(preset: EqualizerPreset): EqualizerBand[] {
  const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

  const presets: Record<EqualizerPreset, number[]> = {
    flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    rock: [4, 3, 2, 1, -1, 0, 1, 3, 4, 4],
    pop: [-1, -1, 0, 1, 3, 3, 2, 0, -1, -1],
    jazz: [3, 2, 1, 0, -1, -1, 0, 1, 2, 3],
    classical: [4, 3, 2, 0, 0, 0, -1, -2, -2, -3],
    electronic: [3, 2, 0, -1, -2, 1, 2, 3, 4, 4],
    bass_boost: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
    treble_boost: [0, 0, 0, 0, 0, 2, 4, 5, 6, 6],
    vocal_boost: [0, -2, -2, -1, 2, 4, 4, 2, 0, 0],
    custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };

  const gains = presets[preset] || presets.flat;

  return frequencies.map((frequency, index) => ({
    frequency,
    gain: gains[index],
  }));
}

/**
 * Format duration to human readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0 || !isFinite(seconds)) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse duration string to seconds
 */
export function parseDuration(duration: string): number {
  const parts = duration.split(':').map(Number);

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }

  return 0;
}

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Get media type from file extension
 */
export function getMediaTypeFromExtension(filename: string): MediaType {
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a'];
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  return audioExts.includes(ext) ? 'audio' : 'video';
}

/**
 * Get format from file extension
 */
export function getFormatFromExtension(filename: string): MediaFormat {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ext as MediaFormat;
}

/**
 * Validate media file
 */
export function validateMediaFile(file: File): boolean {
  const validFormats: MediaFormat[] = [
    'mp3',
    'mp4',
    'webm',
    'ogg',
    'wav',
    'flac',
    'm4a',
    'avi',
    'mkv',
    'mov',
  ];

  const ext = getFormatFromExtension(file.name);
  return validFormats.includes(ext);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Shuffle array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get next item in playlist
 */
export function getNextItem(playlist: Playlist): MediaItem | null {
  if (playlist.items.length === 0) return null;

  if (playlist.repeat_mode === 'one') {
    return playlist.items[playlist.current_index];
  }

  let nextIndex = playlist.current_index + 1;

  if (nextIndex >= playlist.items.length) {
    if (playlist.repeat_mode === 'all') {
      nextIndex = 0;
    } else {
      return null;
    }
  }

  return playlist.items[nextIndex];
}

/**
 * Get previous item in playlist
 */
export function getPreviousItem(playlist: Playlist): MediaItem | null {
  if (playlist.items.length === 0) return null;

  if (playlist.repeat_mode === 'one') {
    return playlist.items[playlist.current_index];
  }

  let prevIndex = playlist.current_index - 1;

  if (prevIndex < 0) {
    if (playlist.repeat_mode === 'all') {
      prevIndex = playlist.items.length - 1;
    } else {
      return null;
    }
  }

  return playlist.items[prevIndex];
}

/**
 * Sort playlist items
 */
export function sortPlaylistItems(
  items: MediaItem[],
  sortBy: PlaylistSortBy
): MediaItem[] {
  const sorted = [...items];

  switch (sortBy) {
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'artist':
      sorted.sort((a, b) => {
        const artistA = a.artist || '';
        const artistB = b.artist || '';
        return artistA.localeCompare(artistB);
      });
      break;
    case 'album':
      sorted.sort((a, b) => {
        const albumA = a.album || '';
        const albumB = b.album || '';
        return albumA.localeCompare(albumB);
      });
      break;
    case 'duration':
      sorted.sort((a, b) => a.duration - b.duration);
      break;
    case 'date_added':
      sorted.sort((a, b) => b.added_at - a.added_at);
      break;
  }

  return sorted;
}

/**
 * Filter media items
 */
export function filterMediaItems(
  items: MediaItem[],
  filter: MediaFilter
): MediaItem[] {
  return items.filter((item) => {
    if (filter.type && item.type !== filter.type) return false;
    if (filter.format && !filter.format.includes(item.format)) return false;
    if (filter.min_duration && item.duration < filter.min_duration) return false;
    if (filter.max_duration && item.duration > filter.max_duration) return false;
    if (filter.artist && item.artist !== filter.artist) return false;
    if (filter.album && item.album !== filter.album) return false;
    if (filter.genre && item.metadata.genre !== filter.genre) return false;
    if (filter.year && item.metadata.year !== filter.year) return false;

    return true;
  });
}

/**
 * Search media items
 */
export function searchMediaItems(
  items: MediaItem[],
  query: MediaSearchQuery
): MediaItem[] {
  const searchText = query.query.toLowerCase();

  return items.filter((item) => {
    // Text search
    const matchText =
      item.title.toLowerCase().includes(searchText) ||
      item.artist?.toLowerCase().includes(searchText) ||
      item.album?.toLowerCase().includes(searchText) ||
      item.metadata.genre?.toLowerCase().includes(searchText);

    if (!matchText) return false;

    // Additional filters
    if (query.type && item.type !== query.type) return false;
    if (query.artist && item.artist !== query.artist) return false;
    if (query.album && item.album !== query.album) return false;
    if (query.genre && item.metadata.genre !== query.genre) return false;
    if (query.year && item.metadata.year !== query.year) return false;

    return true;
  });
}

/**
 * Calculate playlist duration
 */
export function calculatePlaylistDuration(playlist: Playlist): number {
  return playlist.items.reduce((total, item) => total + item.duration, 0);
}

/**
 * Get supported formats
 */
export function getSupportedFormats(type: MediaType): MediaFormat[] {
  if (type === 'audio') {
    return ['mp3', 'ogg', 'wav', 'flac', 'm4a'];
  } else {
    return ['mp4', 'webm', 'ogg', 'avi', 'mkv', 'mov'];
  }
}

/**
 * Parse subtitle file
 */
export function parseSubtitleFile(content: string, format: 'srt' | 'vtt' | 'ass'): SubtitleCue[] {
  const cues: SubtitleCue[] = [];

  if (format === 'srt') {
    const blocks = content.trim().split('\n\n');

    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length < 3) continue;

      const timeLine = lines[1];
      const match = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);

      if (match) {
        const startTime = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 1000;
        const endTime = parseInt(match[5]) * 3600 + parseInt(match[6]) * 60 + parseInt(match[7]) + parseInt(match[8]) / 1000;
        const text = lines.slice(2).join('\n');

        cues.push({ start_time: startTime, end_time: endTime, text });
      }
    }
  } else if (format === 'ass') {
    // Basic ASS/SSA subtitle parsing
    const lines = content.split('\n');
    const dialogueRegex = /^Dialogue:\s*\d+,(\d+):(\d+):(\d+)\.(\d+),(\d+):(\d+):(\d+)\.(\d+),[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,(.+)$/;
    
    for (const line of lines) {
      const match = line.match(dialogueRegex);
      if (match) {
        const startTime = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 100;
        const endTime = parseInt(match[5]) * 3600 + parseInt(match[6]) * 60 + parseInt(match[7]) + parseInt(match[8]) / 100;
        // Remove ASS formatting tags
        const text = match[9].replace(/\{[^}]*\}/g, '').replace(/\\N/g, '\n');
        
        cues.push({ start_time: startTime, end_time: endTime, text });
      }
    }
  }

  return cues;
}

/**
 * Get default visualizer settings
 */
export function getDefaultVisualizerSettings(): VisualizerSettings {
  return {
    enabled: false,
    type: 'bars',
    colors: ['#a855f7', '#ec4899', '#3b82f6'],
    smoothness: 0.7,
    intensity: 1.0,
  };
}
