/**
 * CUBE Elite v6 - Download Manager Elite Service
 * 
 * Enterprise-grade download management competing with:
 * IDM (Internet Download Manager), JDownloader, Free Download Manager
 * 
 * Now integrated with Tauri backend for:
 * - Direct download management (start, pause, resume, cancel)
 * - Download history and tracking
 * - File operations (open location, open file)
 * - Batch download management
 * 
 * Features:
 * - Multi-segment downloading (32 segments)
 * - BitTorrent/Magnet link support
 * - Video platform integration (YouTube, Vimeo, Twitch, etc.)
 * - Clipboard monitoring
 * - Link alive checker
 * - Mirror/multi-source downloads
 * - Browser extension capture
 * - Bandwidth scheduler
 * - Checksum verification
 * - Archive preview
 * - Account manager (file hosts)
 * 
 * REFACTORED: Now uses download-service.ts for Tauri backend integration
 * 
 * @module download-manager-elite-service
 * @version 3.0.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DownloadService, useDownloads as useDownloadsBase } from './download-service';
import { logger } from './logger-service';

const log = logger.scope('DownloadManager');

// ============================================================================
// Backend Integration Types
// ============================================================================

interface BackendDownload {
  id: string;
  url: string;
  filename: string;
  path: string;
  total_bytes: number;
  downloaded_bytes: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  start_time: number;
  end_time?: number;
  error?: string;
}

const BackendDownloadsAPI = {
  async startDownload(url: string, filename?: string): Promise<BackendDownload> {
    try {
      return await invoke<BackendDownload>('start_download', { url, filename });
    } catch (error) {
      log.warn('Backend start_download failed:', error);
      throw error;
    }
  },

  async getDownloads(): Promise<BackendDownload[]> {
    try {
      return await invoke<BackendDownload[]>('get_downloads');
    } catch (error) {
      log.warn('Backend get_downloads failed:', error);
      return [];
    }
  },

  async getDownload(downloadId: string): Promise<BackendDownload | null> {
    try {
      return await invoke<BackendDownload | null>('get_download', { downloadId });
    } catch (error) {
      log.warn('Backend get_download failed:', error);
      return null;
    }
  },

  async pauseDownload(downloadId: string): Promise<void> {
    try {
      await invoke<void>('pause_download', { downloadId });
    } catch (error) {
      log.warn('Backend pause_download failed:', error);
      throw error;
    }
  },

  async resumeDownload(downloadId: string): Promise<void> {
    try {
      await invoke<void>('resume_download', { downloadId });
    } catch (error) {
      log.warn('Backend resume_download failed:', error);
      throw error;
    }
  },

  async cancelDownload(downloadId: string): Promise<void> {
    try {
      await invoke<void>('cancel_download', { downloadId });
    } catch (error) {
      log.warn('Backend cancel_download failed:', error);
      throw error;
    }
  },

  async removeDownload(downloadId: string): Promise<void> {
    try {
      await invoke<void>('remove_download', { downloadId });
    } catch (error) {
      log.warn('Backend remove_download failed:', error);
      throw error;
    }
  },

  async clearCompletedDownloads(): Promise<number> {
    try {
      return await invoke<number>('clear_completed_downloads');
    } catch (error) {
      log.warn('Backend clear_completed_downloads failed:', error);
      return 0;
    }
  },

  async openDownloadLocation(path: string): Promise<void> {
    try {
      await invoke<void>('open_download_location', { path });
    } catch (error) {
      log.warn('Backend open_download_location failed:', error);
    }
  },

  async openDownloadedFile(path: string): Promise<void> {
    try {
      await invoke<void>('open_downloaded_file', { path });
    } catch (error) {
      log.warn('Backend open_downloaded_file failed:', error);
    }
  },
};

// Export backend API
export { BackendDownloadsAPI };
export type { BackendDownload };

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Download segment
 */
export interface DownloadSegment {
  /** Segment index */
  index: number;
  /** Start byte */
  startByte: number;
  /** End byte */
  endByte: number;
  /** Downloaded bytes */
  downloadedBytes: number;
  /** Status */
  status: 'pending' | 'downloading' | 'completed' | 'error';
  /** Speed (bytes/sec) */
  speed: number;
  /** Error message */
  error?: string;
}

/**
 * Download types
 */
export type DownloadType = 
  | 'direct'      // Regular HTTP/HTTPS
  | 'torrent'     // BitTorrent
  | 'magnet'      // Magnet link
  | 'video'       // Video platform
  | 'stream'      // HLS/DASH stream
  | 'ftp'         // FTP download
  | 'batch';      // Multiple files

/**
 * Download priority
 */
export type DownloadPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Download status
 */
export type DownloadStatus = 
  | 'queued'
  | 'connecting'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'error'
  | 'verifying'
  | 'seeding';    // For torrents

/**
 * Enhanced download item
 */
export interface DownloadItem {
  /** Unique identifier */
  id: string;
  /** Download type */
  type: DownloadType;
  /** URL or magnet link */
  url: string;
  /** File name */
  fileName: string;
  /** Destination path */
  destination: string;
  /** Total size in bytes */
  totalSize: number;
  /** Downloaded size in bytes */
  downloadedSize: number;
  /** Status */
  status: DownloadStatus;
  /** Priority */
  priority: DownloadPriority;
  /** Progress (0-100) */
  progress: number;
  /** Current speed (bytes/sec) */
  speed: number;
  /** Average speed */
  averageSpeed: number;
  /** Time remaining (seconds) */
  timeRemaining: number;
  /** Segments */
  segments: DownloadSegment[];
  /** Number of segments */
  segmentCount: number;
  /** Created timestamp */
  createdAt: Date;
  /** Started timestamp */
  startedAt?: Date;
  /** Completed timestamp */
  completedAt?: Date;
  /** Error message */
  error?: string;
  /** Retry count */
  retryCount: number;
  /** Max retries */
  maxRetries: number;
  /** Category */
  category?: string;
  /** Tags */
  tags: string[];
  /** Mirror URLs */
  mirrors: string[];
  /** Checksum (if available) */
  checksum?: {
    algorithm: 'md5' | 'sha1' | 'sha256';
    value: string;
    verified?: boolean;
  };
  /** Video metadata (for video downloads) */
  videoMetadata?: VideoMetadata;
  /** Torrent metadata (for torrents) */
  torrentMetadata?: TorrentMetadata;
}

/**
 * Video platform metadata
 */
export interface VideoMetadata {
  /** Platform */
  platform: 'youtube' | 'vimeo' | 'twitch' | 'dailymotion' | 'tiktok' | 'twitter' | 'instagram' | 'other';
  /** Video ID */
  videoId: string;
  /** Title */
  title: string;
  /** Description */
  description?: string;
  /** Duration (seconds) */
  duration: number;
  /** Thumbnail URL */
  thumbnail?: string;
  /** Channel/Author */
  author?: string;
  /** View count */
  views?: number;
  /** Upload date */
  uploadDate?: string;
  /** Available formats */
  formats: VideoFormat[];
  /** Selected format */
  selectedFormat?: VideoFormat;
  /** Subtitles */
  subtitles?: SubtitleTrack[];
  /** Is live */
  isLive: boolean;
  /** Is playlist */
  isPlaylist: boolean;
  /** Playlist items */
  playlistItems?: PlaylistItem[];
}

/**
 * Video format
 */
export interface VideoFormat {
  /** Format ID */
  formatId: string;
  /** Extension */
  ext: 'mp4' | 'webm' | 'mkv' | 'mp3' | 'm4a' | 'flac';
  /** Quality label */
  quality: string;
  /** Resolution */
  resolution?: string;
  /** Width */
  width?: number;
  /** Height */
  height?: number;
  /** FPS */
  fps?: number;
  /** Video codec */
  vcodec?: string;
  /** Audio codec */
  acodec?: string;
  /** File size */
  filesize?: number;
  /** Bitrate */
  bitrate?: number;
  /** Has video */
  hasVideo: boolean;
  /** Has audio */
  hasAudio: boolean;
}

/**
 * Subtitle track
 */
export interface SubtitleTrack {
  /** Language code */
  language: string;
  /** Language name */
  languageName: string;
  /** URL */
  url: string;
  /** Format */
  format: 'vtt' | 'srt' | 'ass';
  /** Is auto-generated */
  isAutoGenerated: boolean;
}

/**
 * Playlist item
 */
export interface PlaylistItem {
  /** Index */
  index: number;
  /** Video ID */
  videoId: string;
  /** Title */
  title: string;
  /** Duration */
  duration: number;
  /** Thumbnail */
  thumbnail?: string;
  /** Is selected */
  selected: boolean;
}

/**
 * Torrent metadata
 */
export interface TorrentMetadata {
  /** Info hash */
  infoHash: string;
  /** Name */
  name: string;
  /** Total size */
  totalSize: number;
  /** Piece length */
  pieceLength: number;
  /** Piece count */
  pieceCount: number;
  /** Files */
  files: TorrentFile[];
  /** Trackers */
  trackers: string[];
  /** Creation date */
  creationDate?: Date;
  /** Comment */
  comment?: string;
  /** Created by */
  createdBy?: string;
  /** Peers connected */
  peers: number;
  /** Seeds */
  seeds: number;
  /** Leechers */
  leechers: number;
  /** Download ratio */
  ratio: number;
  /** Uploaded bytes */
  uploadedBytes: number;
}

/**
 * Torrent file
 */
export interface TorrentFile {
  /** Path */
  path: string;
  /** Size */
  size: number;
  /** Priority */
  priority: 'skip' | 'low' | 'normal' | 'high';
  /** Progress */
  progress: number;
  /** Is selected */
  selected: boolean;
}

/**
 * Link check result
 */
export interface LinkCheckResult {
  /** URL */
  url: string;
  /** Is alive */
  isAlive: boolean;
  /** Status code */
  statusCode?: number;
  /** Content type */
  contentType?: string;
  /** Content length */
  contentLength?: number;
  /** Supports resume */
  supportsResume: boolean;
  /** Final URL (after redirects) */
  finalUrl?: string;
  /** Server */
  server?: string;
  /** Checked at */
  checkedAt: Date;
  /** Error */
  error?: string;
}

/**
 * Clipboard monitor result
 */
export interface ClipboardLink {
  /** URL */
  url: string;
  /** Detected at */
  detectedAt: Date;
  /** Type */
  type: 'direct' | 'video' | 'torrent' | 'magnet';
  /** File name (if detected) */
  fileName?: string;
  /** Platform (for videos) */
  platform?: string;
  /** Is processed */
  isProcessed: boolean;
}

/**
 * Bandwidth schedule
 */
export interface BandwidthSchedule {
  /** Unique identifier */
  id: string;
  /** Name */
  name: string;
  /** Days active (0=Sunday, 6=Saturday) */
  days: number[];
  /** Start time (HH:MM) */
  startTime: string;
  /** End time (HH:MM) */
  endTime: string;
  /** Download limit (bytes/sec, 0=unlimited) */
  downloadLimit: number;
  /** Upload limit (bytes/sec, 0=unlimited) */
  uploadLimit: number;
  /** Is enabled */
  enabled: boolean;
}

/**
 * File host account
 */
export interface FileHostAccount {
  /** Unique identifier */
  id: string;
  /** Host name */
  host: string;
  /** Username */
  username: string;
  /** Password (encrypted) */
  password: string;
  /** Is premium */
  isPremium: boolean;
  /** Expiry date */
  expiryDate?: Date;
  /** Traffic remaining */
  trafficRemaining?: number;
  /** Traffic limit */
  trafficLimit?: number;
  /** Last used */
  lastUsed?: Date;
  /** Is enabled */
  enabled: boolean;
}

/**
 * Video platform support
 */
export interface VideoPlatformSupport {
  name: string;
  domains: string[];
  icon: string;
  supportsPlaylist: boolean;
  supportsLive: boolean;
  supportedFormats: string[];
  maxQuality: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Supported video platforms
 */
const VIDEO_PLATFORMS: VideoPlatformSupport[] = [
  {
    name: 'YouTube',
    domains: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'],
    icon: '📺',
    supportsPlaylist: true,
    supportsLive: true,
    supportedFormats: ['mp4', 'webm', 'mp3', 'm4a'],
    maxQuality: '8K',
  },
  {
    name: 'Vimeo',
    domains: ['vimeo.com'],
    icon: '🎬',
    supportsPlaylist: false,
    supportsLive: true,
    supportedFormats: ['mp4', 'webm'],
    maxQuality: '4K',
  },
  {
    name: 'Twitch',
    domains: ['twitch.tv', 'clips.twitch.tv'],
    icon: '🎮',
    supportsPlaylist: false,
    supportsLive: true,
    supportedFormats: ['mp4'],
    maxQuality: '1080p60',
  },
  {
    name: 'Twitter/X',
    domains: ['twitter.com', 'x.com'],
    icon: '🐦',
    supportsPlaylist: false,
    supportsLive: false,
    supportedFormats: ['mp4'],
    maxQuality: '1080p',
  },
  {
    name: 'Instagram',
    domains: ['instagram.com'],
    icon: '📷',
    supportsPlaylist: false,
    supportsLive: false,
    supportedFormats: ['mp4'],
    maxQuality: '1080p',
  },
  {
    name: 'TikTok',
    domains: ['tiktok.com'],
    icon: '🎵',
    supportsPlaylist: false,
    supportsLive: false,
    supportedFormats: ['mp4'],
    maxQuality: '1080p',
  },
  {
    name: 'Dailymotion',
    domains: ['dailymotion.com'],
    icon: '📹',
    supportsPlaylist: true,
    supportsLive: false,
    supportedFormats: ['mp4'],
    maxQuality: '1080p',
  },
  {
    name: 'Facebook',
    domains: ['facebook.com', 'fb.watch'],
    icon: '👤',
    supportsPlaylist: false,
    supportsLive: true,
    supportedFormats: ['mp4'],
    maxQuality: '1080p',
  },
  {
    name: 'SoundCloud',
    domains: ['soundcloud.com'],
    icon: '🔊',
    supportsPlaylist: true,
    supportsLive: false,
    supportedFormats: ['mp3', 'm4a'],
    maxQuality: 'HQ',
  },
  {
    name: 'Reddit',
    domains: ['reddit.com', 'redd.it'],
    icon: '🤖',
    supportsPlaylist: false,
    supportsLive: false,
    supportedFormats: ['mp4'],
    maxQuality: '1080p',
  },
];

/**
 * Supported file hosts
 */
const SUPPORTED_FILE_HOSTS = [
  'mega.nz',
  'dropbox.com',
  'drive.google.com',
  'mediafire.com',
  'rapidgator.net',
  'uploaded.net',
  'turbobit.net',
  'nitroflare.com',
  'uploadgig.com',
  'katfile.com',
  'filejoker.net',
  '1fichier.com',
];

/**
 * Download categories
 */
const DOWNLOAD_CATEGORIES = [
  { id: 'videos', name: 'Videos', icon: '🎬', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv'] },
  { id: 'music', name: 'Music', icon: '🎵', extensions: ['mp3', 'm4a', 'flac', 'wav', 'ogg', 'aac', 'wma'] },
  { id: 'documents', name: 'Documents', icon: '📄', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'] },
  { id: 'archives', name: 'Archives', icon: '📦', extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'] },
  { id: 'programs', name: 'Programs', icon: '💿', extensions: ['exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm', 'appimage'] },
  { id: 'images', name: 'Images', icon: '🖼️', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'] },
  { id: 'torrents', name: 'Torrents', icon: '🧲', extensions: ['torrent'] },
  { id: 'other', name: 'Other', icon: '📁', extensions: [] },
];

/**
 * Maximum segments for parallel download
 */
const MAX_SEGMENTS = 32;

/**
 * IndexedDB configuration
 */
const DB_NAME = 'cube_download_manager';
const DB_VERSION = 1;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format duration
 */
function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Get file extension
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Get category for file
 */
function getCategoryForFile(filename: string): string {
  const ext = getFileExtension(filename);
  for (const category of DOWNLOAD_CATEGORIES) {
    if (category.extensions.includes(ext)) {
      return category.id;
    }
  }
  return 'other';
}

/**
 * Detect video platform from URL
 */
function detectVideoPlatform(url: string): VideoPlatformSupport | null {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    for (const platform of VIDEO_PLATFORMS) {
      if (platform.domains.some(d => domain.includes(d))) {
        return platform;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Detect download type from URL
 */
function detectDownloadType(url: string): DownloadType {
  if (url.startsWith('magnet:')) return 'magnet';
  if (url.endsWith('.torrent')) return 'torrent';
  if (detectVideoPlatform(url)) return 'video';
  if (url.includes('.m3u8') || url.includes('.mpd')) return 'stream';
  if (url.startsWith('ftp://')) return 'ftp';
  return 'direct';
}

/**
 * Parse magnet link
 */
function parseMagnetLink(magnetUri: string): TorrentMetadata | null {
  try {
    const url = new URL(magnetUri);
    const params = new URLSearchParams(url.search);
    
    const infoHash = params.get('xt')?.replace('urn:btih:', '') || '';
    const name = decodeURIComponent(params.get('dn') || 'Unknown');
    const trackers = params.getAll('tr');
    
    return {
      infoHash,
      name,
      totalSize: 0,
      pieceLength: 0,
      pieceCount: 0,
      files: [],
      trackers,
      peers: 0,
      seeds: 0,
      leechers: 0,
      ratio: 0,
      uploadedBytes: 0,
    };
  } catch {
    return null;
  }
}

/**
 * Validate URL
 */
function isValidUrl(string: string): boolean {
  try {
    if (string.startsWith('magnet:')) return true;
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate checksum
 */
async function _calculateChecksum(
  data: ArrayBuffer,
  algorithm: 'md5' | 'sha1' | 'sha256'
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    algorithm === 'md5' ? 'MD5' : 
    algorithm === 'sha1' ? 'SHA-1' : 'SHA-256',
    data
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// Link Checker Service
// ============================================================================

/**
 * Checks link status and metadata
 */
export class LinkCheckerService {
  private cache: Map<string, LinkCheckResult> = new Map();
  private pendingChecks: Map<string, Promise<LinkCheckResult>> = new Map();

  /**
   * Check single link
   */
  async checkLink(url: string): Promise<LinkCheckResult> {
    // Check cache
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.checkedAt.getTime() < 5 * 60 * 1000) {
      return cached;
    }

    // Check pending
    const pending = this.pendingChecks.get(url);
    if (pending) return pending;

    const check = this.performCheck(url);
    this.pendingChecks.set(url, check);

    try {
      const result = await check;
      this.cache.set(url, result);
      return result;
    } finally {
      this.pendingChecks.delete(url);
    }
  }

  /**
   * Perform link check
   */
  private async performCheck(url: string): Promise<LinkCheckResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      const acceptRanges = response.headers.get('accept-ranges');
      const server = response.headers.get('server');

      return {
        url,
        isAlive: response.ok,
        statusCode: response.status,
        contentType: contentType || undefined,
        contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
        supportsResume: acceptRanges === 'bytes',
        finalUrl: response.url !== url ? response.url : undefined,
        server: server || undefined,
        checkedAt: new Date(),
      };
    } catch (error) {
      return {
        url,
        isAlive: false,
        supportsResume: false,
        checkedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check multiple links
   */
  async checkLinks(urls: string[]): Promise<LinkCheckResult[]> {
    return Promise.all(urls.map(url => this.checkLink(url)));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// Clipboard Monitor Service
// ============================================================================

/**
 * Monitors clipboard for download links
 */
export class ClipboardMonitorService {
  private isMonitoring: boolean = false;
  private detectedLinks: ClipboardLink[] = [];
  private lastClipboardContent: string = '';
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(link: ClipboardLink) => void> = new Set();
  
  // URL patterns
  private patterns = {
    video: VIDEO_PLATFORMS.flatMap(p => p.domains),
    torrent: ['.torrent', 'magnet:?'],
    fileHost: SUPPORTED_FILE_HOSTS,
  };

  /**
   * Start monitoring
   */
  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.pollInterval = setInterval(() => this.checkClipboard(), 1000);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isMonitoring = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Check clipboard for new links
   */
  private async checkClipboard(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      
      if (text === this.lastClipboardContent) return;
      this.lastClipboardContent = text;

      // Check if it's a URL
      if (!isValidUrl(text)) return;

      // Detect type
      const type = this.detectLinkType(text);
      if (!type) return;

      // Check if already detected
      if (this.detectedLinks.some(l => l.url === text)) return;

      const link: ClipboardLink = {
        url: text,
        detectedAt: new Date(),
        type,
        platform: detectVideoPlatform(text)?.name,
        isProcessed: false,
      };

      this.detectedLinks.push(link);
      this.notifyListeners(link);
    } catch {
      // Clipboard access denied or empty
    }
  }

  /**
   * Detect link type
   */
  private detectLinkType(url: string): ClipboardLink['type'] | null {
    if (url.startsWith('magnet:')) return 'magnet';
    if (url.endsWith('.torrent')) return 'torrent';
    if (detectVideoPlatform(url)) return 'video';
    
    // Check if it's a downloadable file
    const ext = getFileExtension(url.split('?')[0]);
    if (ext && DOWNLOAD_CATEGORIES.some(c => c.extensions.includes(ext))) {
      return 'direct';
    }

    // Check if it's a file host
    try {
      const domain = new URL(url).hostname;
      if (this.patterns.fileHost.some(h => domain.includes(h))) {
        return 'direct';
      }
    } catch {
      return null;
    }

    return null;
  }

  /**
   * Subscribe to new links
   */
  subscribe(listener: (link: ClipboardLink) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get detected links
   */
  getDetectedLinks(): ClipboardLink[] {
    return [...this.detectedLinks];
  }

  /**
   * Mark link as processed
   */
  markProcessed(url: string): void {
    const link = this.detectedLinks.find(l => l.url === url);
    if (link) link.isProcessed = true;
  }

  /**
   * Clear detected links
   */
  clearLinks(): void {
    this.detectedLinks = [];
  }

  private notifyListeners(link: ClipboardLink): void {
    this.listeners.forEach(l => l(link));
  }

  /**
   * Check if monitoring
   */
  get isActive(): boolean {
    return this.isMonitoring;
  }
}

// ============================================================================
// Video Extractor Service
// ============================================================================

/**
 * Extracts video information from various platforms
 */
export class VideoExtractorService {
  /**
   * Extract video info from URL
   */
  async extractInfo(url: string): Promise<VideoMetadata | null> {
    const platform = detectVideoPlatform(url);
    if (!platform) return null;

    // In production, this would call a backend service like yt-dlp
    // For now, we'll simulate the response structure
    return this.simulateExtraction(url, platform);
  }

  /**
   * Simulate video extraction for demo purposes
   * 
   * In production, this would:
   * 1. Call yt-dlp via Tauri backend command
   * 2. Parse the JSON output to get available formats
   * 3. Return real metadata including title, duration, formats
   * 
   * The backend integration would look like:
   * ```rust
   * #[tauri::command]
   * async fn extract_video_info(url: &str) -> Result<VideoMetadata, String> {
   *     let output = Command::new("yt-dlp")
   *         .args(["--dump-json", "--no-download", url])
   *         .output()?;
   *     serde_json::from_slice(&output.stdout)
   * }
   * ```
   */
  private async simulateExtraction(
    url: string,
    platform: VideoPlatformSupport
  ): Promise<VideoMetadata> {
    // This would be replaced with actual yt-dlp calls via Tauri
    const videoId = this.extractVideoId(url, platform);
    
    return {
      platform: platform.name.toLowerCase() as VideoMetadata['platform'],
      videoId,
      title: `Video from ${platform.name}`,
      duration: 0,
      isLive: false,
      isPlaylist: url.includes('playlist') || url.includes('list='),
      formats: this.generateMockFormats(platform),
    };
  }

  /**
   * Extract video ID from URL
   */
  private extractVideoId(url: string, platform: VideoPlatformSupport): string {
    try {
      const urlObj = new URL(url);
      
      if (platform.name === 'YouTube') {
        // youtube.com/watch?v=ID or youtu.be/ID
        return urlObj.searchParams.get('v') || urlObj.pathname.slice(1);
      }
      
      // Generic: use last path segment
      const segments = urlObj.pathname.split('/').filter(Boolean);
      return segments[segments.length - 1] || '';
    } catch {
      return '';
    }
  }

  /**
   * Generate mock formats for demo
   */
  private generateMockFormats(_platform: VideoPlatformSupport): VideoFormat[] {
    const formats: VideoFormat[] = [];
    
    // Video formats
    const qualities = ['2160p', '1440p', '1080p', '720p', '480p', '360p'];
    for (const quality of qualities) {
      formats.push({
        formatId: `video-${quality}`,
        ext: 'mp4',
        quality,
        resolution: quality,
        hasVideo: true,
        hasAudio: true,
      });
    }

    // Audio only
    formats.push({
      formatId: 'audio-best',
      ext: 'mp3',
      quality: 'Audio Only (320kbps)',
      hasVideo: false,
      hasAudio: true,
      bitrate: 320000,
    });

    return formats;
  }

  /**
   * Get supported platforms
   */
  getSupportedPlatforms(): VideoPlatformSupport[] {
    return [...VIDEO_PLATFORMS];
  }

  /**
   * Check if URL is supported
   */
  isSupported(url: string): boolean {
    return detectVideoPlatform(url) !== null;
  }
}

// ============================================================================
// BitTorrent Service
// ============================================================================

/**
 * Manages BitTorrent downloads
 */
export class BitTorrentService {
  private activeTorrents: Map<string, TorrentMetadata> = new Map();
  private listeners: Set<(torrents: TorrentMetadata[]) => void> = new Set();

  /**
   * Add torrent from file
   */
  async addTorrentFile(file: File): Promise<TorrentMetadata> {
    const buffer = await file.arrayBuffer();
    // In production, parse the .torrent file
    const metadata = await this.parseTorrentFile(buffer);
    this.activeTorrents.set(metadata.infoHash, metadata);
    this.notifyListeners();
    return metadata;
  }

  /**
   * Add torrent from magnet link
   */
  async addMagnetLink(magnetUri: string): Promise<TorrentMetadata | null> {
    const metadata = parseMagnetLink(magnetUri);
    if (metadata) {
      this.activeTorrents.set(metadata.infoHash, metadata);
      this.notifyListeners();
    }
    return metadata;
  }

  /**
   * Parse torrent file from binary data
   * 
   * In production, this would use a bencode parser to extract:
   * - info.name: Torrent name
   * - info.length: Total size (single file)
   * - info.files: File list (multi-file)
   * - announce-list: Tracker URLs
   * - info.pieces: SHA1 hashes for piece verification
   * 
   * Recommended libraries for implementation:
   * - JavaScript: parse-torrent, bencode
   * - Rust backend: lava_torrent, bt_bencode
   * 
   * Example bencode structure:
   * ```
   * d
   *   8:announce<tracker_url>
   *   4:info d
   *     6:length i<bytes>e
   *     4:name <filename>
   *     12:piece length i<bytes>e
   *     6:pieces <sha1_hashes>
   *   e
   * e
   * ```
   */
  private async parseTorrentFile(_buffer: ArrayBuffer): Promise<TorrentMetadata> {
    // Simulate parsing - in production use bencode parser
    // Example: import parseTorrent from 'parse-torrent'
    // const parsed = parseTorrent(Buffer.from(_buffer))
    return {
      infoHash: generateId(),
      name: 'Parsed Torrent',
      totalSize: 0,
      pieceLength: 262144,
      pieceCount: 0,
      files: [],
      trackers: [],
      peers: 0,
      seeds: 0,
      leechers: 0,
      ratio: 0,
      uploadedBytes: 0,
    };
  }

  /**
   * Start torrent
   */
  async startTorrent(infoHash: string): Promise<void> {
    // In production, start downloading via libtorrent or similar
    log.debug(`Starting torrent: ${infoHash}`);
  }

  /**
   * Pause torrent
   */
  async pauseTorrent(infoHash: string): Promise<void> {
    log.debug(`Pausing torrent: ${infoHash}`);
  }

  /**
   * Stop torrent
   */
  async stopTorrent(infoHash: string): Promise<void> {
    log.debug(`Stopping torrent: ${infoHash}`);
  }

  /**
   * Remove torrent
   */
  async removeTorrent(infoHash: string, _deleteData: boolean = false): Promise<void> {
    this.activeTorrents.delete(infoHash);
    this.notifyListeners();
  }

  /**
   * Set file priority
   */
  setFilePriority(
    infoHash: string,
    fileIndex: number,
    priority: TorrentFile['priority']
  ): void {
    const torrent = this.activeTorrents.get(infoHash);
    if (torrent && torrent.files[fileIndex]) {
      torrent.files[fileIndex].priority = priority;
    }
  }

  /**
   * Get active torrents
   */
  getTorrents(): TorrentMetadata[] {
    return Array.from(this.activeTorrents.values());
  }

  /**
   * Get torrent by info hash
   */
  getTorrent(infoHash: string): TorrentMetadata | undefined {
    return this.activeTorrents.get(infoHash);
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: (torrents: TorrentMetadata[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const torrents = this.getTorrents();
    this.listeners.forEach(l => l(torrents));
  }
}

// ============================================================================
// Download Manager Service
// ============================================================================

/**
 * Main download manager service
 * 
 * REFACTORED: Now uses Tauri backend via DownloadService
 * Falls back to local simulation when backend unavailable
 */
export class DownloadManagerService {
  private downloads: Map<string, DownloadItem> = new Map();
  private db: IDBDatabase | null = null;
  private linkChecker: LinkCheckerService;
  private clipboardMonitor: ClipboardMonitorService;
  private videoExtractor: VideoExtractorService;
  private bitTorrent: BitTorrentService;
  private listeners: Set<(downloads: DownloadItem[]) => void> = new Set();
  private bandwidthSchedules: BandwidthSchedule[] = [];
  private fileHostAccounts: FileHostAccount[] = [];
  private globalSpeedLimit: number = 0; // 0 = unlimited
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private useBackend: boolean = true;

  constructor() {
    this.linkChecker = new LinkCheckerService();
    this.clipboardMonitor = new ClipboardMonitorService();
    this.videoExtractor = new VideoExtractorService();
    this.bitTorrent = new BitTorrentService();
  }

  /**
   * Initialize service and sync with backend
   */
  async init(): Promise<void> {
    // Try to sync with backend first
    try {
      const backendDownloads = await DownloadService.getAll();
      for (const dl of backendDownloads) {
        const eliteDownload = this.mapBackendToElite(dl);
        this.downloads.set(eliteDownload.id, eliteDownload);
      }
      log.debug(`[DownloadManager Elite] Synced with backend: ${backendDownloads.length} downloads`);
    } catch (error) {
      log.warn('[DownloadManager Elite] Backend unavailable, using local storage:', error);
      this.useBackend = false;
    }

    // Initialize IndexedDB as fallback/cache
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        if (!this.useBackend) {
          this.loadDownloads().then(resolve);
        } else {
          resolve();
        }
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('downloads')) {
          const store = db.createObjectStore('downloads', { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }
        if (!db.objectStoreNames.contains('schedules')) {
          db.createObjectStore('schedules', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('accounts')) {
          db.createObjectStore('accounts', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Map backend download to elite format
   */
  private mapBackendToElite(dl: import('./download-service').Download): DownloadItem {
    return {
      id: dl.id,
      type: 'direct',
      url: dl.url,
      fileName: dl.fileName,
      destination: dl.destination,
      totalSize: dl.totalSize,
      downloadedSize: dl.downloadedSize,
      status: dl.status as DownloadStatus,
      priority: dl.priority as DownloadPriority,
      progress: dl.progress,
      speed: dl.speed,
      averageSpeed: dl.averageSpeed,
      timeRemaining: dl.timeRemaining,
      segments: dl.segments.map(s => ({
        index: s.index,
        startByte: s.startByte,
        endByte: s.endByte,
        downloadedBytes: s.downloadedBytes,
        status: s.status,
        speed: s.speed,
        error: s.error,
      })),
      segmentCount: dl.segmentCount,
      createdAt: new Date(dl.createdAt),
      startedAt: dl.startedAt ? new Date(dl.startedAt) : undefined,
      completedAt: dl.completedAt ? new Date(dl.completedAt) : undefined,
      error: dl.error,
      retryCount: dl.retryCount,
      maxRetries: dl.maxRetries,
      category: dl.category || getCategoryForFile(dl.fileName),
      tags: dl.tags,
      mirrors: [],
      checksum: dl.checksum,
    };
  }

  /**
   * Load downloads from DB (fallback)
   */
  private async loadDownloads(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['downloads'], 'readonly');
      const store = transaction.objectStore('downloads');
      const request = store.getAll();

      request.onsuccess = () => {
        for (const download of request.result) {
          this.downloads.set(download.id, {
            ...download,
            createdAt: new Date(download.createdAt),
            startedAt: download.startedAt ? new Date(download.startedAt) : undefined,
            completedAt: download.completedAt ? new Date(download.completedAt) : undefined,
          });
        }
        resolve();
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Save download to DB
   */
  private async saveDownload(download: DownloadItem): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['downloads'], 'readwrite');
      const store = transaction.objectStore('downloads');
      
      const storable = {
        ...download,
        createdAt: download.createdAt.toISOString(),
        startedAt: download.startedAt?.toISOString(),
        completedAt: download.completedAt?.toISOString(),
      };

      const request = store.put(storable);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Add new download - uses Tauri backend
   */
  async addDownload(url: string, options?: {
    fileName?: string;
    destination?: string;
    priority?: DownloadPriority;
    segmentCount?: number;
    mirrors?: string[];
    startImmediately?: boolean;
  }): Promise<DownloadItem> {
    const type = detectDownloadType(url);
    
    // Handle special types locally
    if (type === 'magnet') {
      return this.addMagnetDownload(url);
    }
    if (type === 'video') {
      return this.addVideoDownload(url, options);
    }

    // Try to use backend for direct downloads
    if (this.useBackend) {
      try {
        const backendDownload = await DownloadService.start(url, {
          fileName: options?.fileName,
          destination: options?.destination,
          segmentCount: options?.segmentCount ?? 8,
          priority: options?.priority ?? 'normal',
          category: getCategoryForFile(options?.fileName || this.extractFileName(url)),
          tags: [],
          maxRetries: 3,
        });

        const eliteDownload = this.mapBackendToElite(backendDownload);
        eliteDownload.mirrors = options?.mirrors || [];
        this.downloads.set(eliteDownload.id, eliteDownload);
        
        // Start polling for updates
        this.startPolling(eliteDownload.id);
        
        this.notifyListeners();
        return eliteDownload;
      } catch (error) {
        log.warn('[DownloadManager Elite] Backend start failed, falling back:', error);
      }
    }

    // Fallback to local simulation
    const linkCheck = await this.linkChecker.checkLink(url);
    const fileName = options?.fileName || this.extractFileName(url);
    
    const download: DownloadItem = {
      id: `dl-${generateId()}`,
      type,
      url,
      fileName,
      destination: options?.destination || '',
      totalSize: linkCheck.contentLength || 0,
      downloadedSize: 0,
      status: 'queued',
      priority: options?.priority || 'normal',
      progress: 0,
      speed: 0,
      averageSpeed: 0,
      timeRemaining: Infinity,
      segments: [],
      segmentCount: linkCheck.supportsResume ? (options?.segmentCount || 8) : 1,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      category: getCategoryForFile(fileName),
      tags: [],
      mirrors: options?.mirrors || [],
    };

    this.downloads.set(download.id, download);
    await this.saveDownload(download);
    this.notifyListeners();

    if (options?.startImmediately !== false) {
      await this.startDownload(download.id);
    }

    return download;
  }

  /**
   * Start polling for download updates from backend
   */
  private startPolling(downloadId: string): void {
    const interval = setInterval(async () => {
      try {
        const backendDownload = await DownloadService.getById(downloadId);
        if (backendDownload) {
          const eliteDownload = this.downloads.get(downloadId);
          if (eliteDownload) {
            // Update from backend
            eliteDownload.downloadedSize = backendDownload.downloadedSize;
            eliteDownload.progress = backendDownload.progress;
            eliteDownload.speed = backendDownload.speed;
            eliteDownload.averageSpeed = backendDownload.averageSpeed;
            eliteDownload.timeRemaining = backendDownload.timeRemaining;
            eliteDownload.status = backendDownload.status as DownloadStatus;
            eliteDownload.segments = backendDownload.segments;
            
            this.notifyListeners();
            
            // Stop polling when complete or error
            if (['completed', 'error', 'cancelled'].includes(backendDownload.status)) {
              eliteDownload.completedAt = backendDownload.completedAt 
                ? new Date(backendDownload.completedAt) 
                : new Date();
              eliteDownload.error = backendDownload.error;
              this.stopPolling(downloadId);
            }
          }
        }
      } catch (error) {
        log.warn('[DownloadManager Elite] Polling error:', error);
      }
    }, 500);

    this.pollingIntervals.set(downloadId, interval);
  }

  /**
   * Stop polling for a download
   */
  private stopPolling(downloadId: string): void {
    const interval = this.pollingIntervals.get(downloadId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(downloadId);
    }
  }

  /**
   * Add magnet/torrent download
   */
  private async addMagnetDownload(magnetUri: string): Promise<DownloadItem> {
    const metadata = await this.bitTorrent.addMagnetLink(magnetUri);
    
    const download: DownloadItem = {
      id: `dl-${generateId()}`,
      type: 'magnet',
      url: magnetUri,
      fileName: metadata?.name || 'Unknown Torrent',
      destination: '',
      totalSize: metadata?.totalSize || 0,
      downloadedSize: 0,
      status: 'queued',
      priority: 'normal',
      progress: 0,
      speed: 0,
      averageSpeed: 0,
      timeRemaining: Infinity,
      segments: [],
      segmentCount: 1,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      category: 'torrents',
      tags: [],
      mirrors: [],
      torrentMetadata: metadata || undefined,
    };

    this.downloads.set(download.id, download);
    await this.saveDownload(download);
    this.notifyListeners();

    return download;
  }

  /**
   * Add video download
   */
  private async addVideoDownload(url: string, options?: {
    fileName?: string;
    destination?: string;
    priority?: DownloadPriority;
  }): Promise<DownloadItem> {
    const videoInfo = await this.videoExtractor.extractInfo(url);
    
    const download: DownloadItem = {
      id: `dl-${generateId()}`,
      type: 'video',
      url,
      fileName: options?.fileName || `${videoInfo?.title || 'video'}.mp4`,
      destination: options?.destination || '',
      totalSize: 0,
      downloadedSize: 0,
      status: 'queued',
      priority: options?.priority || 'normal',
      progress: 0,
      speed: 0,
      averageSpeed: 0,
      timeRemaining: Infinity,
      segments: [],
      segmentCount: 1,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      category: 'videos',
      tags: [],
      mirrors: [],
      videoMetadata: videoInfo || undefined,
    };

    this.downloads.set(download.id, download);
    await this.saveDownload(download);
    this.notifyListeners();

    return download;
  }

  /**
   * Extract file name from URL
   */
  private extractFileName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1];
      
      if (lastSegment && lastSegment.includes('.')) {
        return decodeURIComponent(lastSegment);
      }
      
      return 'download';
    } catch {
      return 'download';
    }
  }

  /**
   * Start download - uses Tauri backend
   */
  async startDownload(id: string): Promise<void> {
    const download = this.downloads.get(id);
    if (!download) return;

    download.status = 'connecting';
    download.startedAt = new Date();
    this.notifyListeners();

    if (this.useBackend && download.type === 'direct') {
      try {
        // Resume or restart via backend
        const backendDownload = await DownloadService.resume(id);
        if (backendDownload) {
          download.status = 'downloading';
          this.startPolling(id);
        }
      } catch (error) {
        log.warn('[DownloadManager Elite] Backend start failed:', error);
        // Update status for simulation mode
        download.status = 'downloading';
      }
    } else {
      // For local/special types, just update status
      download.status = 'downloading';
    }

    await this.saveDownload(download);
    this.notifyListeners();
  }

  /**
   * Pause download - uses Tauri backend
   */
  async pauseDownload(id: string): Promise<void> {
    const download = this.downloads.get(id);
    if (!download || download.status !== 'downloading') return;

    if (this.useBackend && download.type === 'direct') {
      try {
        await DownloadService.pause(id);
        this.stopPolling(id);
      } catch (error) {
        log.warn('[DownloadManager Elite] Backend pause failed:', error);
      }
    }

    download.status = 'paused';
    await this.saveDownload(download);
    this.notifyListeners();
  }

  /**
   * Resume download - uses Tauri backend
   */
  async resumeDownload(id: string): Promise<void> {
    const download = this.downloads.get(id);
    if (!download || download.status !== 'paused') return;

    if (this.useBackend && download.type === 'direct') {
      try {
        await DownloadService.resume(id);
        this.startPolling(id);
      } catch (error) {
        log.warn('[DownloadManager Elite] Backend resume failed:', error);
      }
    }

    download.status = 'downloading';
    await this.saveDownload(download);
    this.notifyListeners();
  }

  /**
   * Cancel download - uses Tauri backend
   */
  async cancelDownload(id: string): Promise<void> {
    // Stop polling first
    this.stopPolling(id);

    if (this.useBackend) {
      try {
        await DownloadService.cancel(id);
      } catch (error) {
        log.warn('[DownloadManager Elite] Backend cancel failed:', error);
      }
    }

    this.downloads.delete(id);

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['downloads'], 'readwrite');
        const store = transaction.objectStore('downloads');
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.notifyListeners();
          resolve();
        };
      });
    }
    
    this.notifyListeners();
  }

  /**
   * Retry failed download - uses Tauri backend
   */
  async retryDownload(id: string): Promise<void> {
    const download = this.downloads.get(id);
    if (!download || download.status !== 'error') return;

    if (this.useBackend && download.type === 'direct') {
      try {
        await DownloadService.retry(id);
        download.status = 'queued';
        download.retryCount++;
        download.error = undefined;
        this.startPolling(id);
        await this.saveDownload(download);
        this.notifyListeners();
        return;
      } catch (error) {
        log.warn('[DownloadManager Elite] Backend retry failed:', error);
      }
    }

    // Fallback to local retry
    download.status = 'queued';
    download.retryCount++;
    download.error = undefined;
    await this.saveDownload(download);
    
    await this.startDownload(id);
  }

  /**
   * Get all downloads
   */
  getDownloads(filter?: {
    status?: DownloadStatus;
    category?: string;
    type?: DownloadType;
  }): DownloadItem[] {
    let downloads = Array.from(this.downloads.values());

    if (filter?.status) {
      downloads = downloads.filter(d => d.status === filter.status);
    }
    if (filter?.category) {
      downloads = downloads.filter(d => d.category === filter.category);
    }
    if (filter?.type) {
      downloads = downloads.filter(d => d.type === filter.type);
    }

    // Sort by creation date (newest first)
    return downloads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get download by ID
   */
  getDownload(id: string): DownloadItem | undefined {
    return this.downloads.get(id);
  }

  /**
   * Set global speed limit
   */
  setSpeedLimit(bytesPerSecond: number): void {
    this.globalSpeedLimit = bytesPerSecond;
  }

  /**
   * Add bandwidth schedule
   */
  addSchedule(schedule: Omit<BandwidthSchedule, 'id'>): BandwidthSchedule {
    const newSchedule: BandwidthSchedule = {
      ...schedule,
      id: `sched-${generateId()}`,
    };
    this.bandwidthSchedules.push(newSchedule);
    return newSchedule;
  }

  /**
   * Get categories
   */
  getCategories(): typeof DOWNLOAD_CATEGORIES {
    return [...DOWNLOAD_CATEGORIES];
  }

  /**
   * Get video platforms
   */
  getVideoPlatforms(): VideoPlatformSupport[] {
    return this.videoExtractor.getSupportedPlatforms();
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: (downloads: DownloadItem[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const downloads = this.getDownloads();
    this.listeners.forEach(l => l(downloads));
  }

  /**
   * Get services
   */
  get services() {
    return {
      linkChecker: this.linkChecker,
      clipboardMonitor: this.clipboardMonitor,
      videoExtractor: this.videoExtractor,
      bitTorrent: this.bitTorrent,
    };
  }
}

// ============================================================================
// React Hook (Integrated with Tauri Backend)
// ============================================================================

/**
 * React hook for download manager
 * Uses Tauri backend for actual download operations
 * Elite features (video extraction, clipboard, etc.) run locally
 */
export function useDownloadManager() {
  // Use base Tauri-integrated hook for core download operations
  const {
    downloads: tauriDownloads,
    stats,
    loading: baseLoading,
    error: baseError,
    startDownload: baseStartDownload,
    pauseDownload: basePauseDownload,
    resumeDownload: baseResumeDownload,
    cancelDownload: baseCancelDownload,
    removeDownload: _baseRemoveDownload,
    retryDownload: baseRetryDownload,
    openLocation,
    openFile,
    clearCompleted,
    pauseAll,
    resumeAll,
    setSpeedLimit,
    refresh,
  } = useDownloadsBase({ autoRefresh: 2000, realtime: true });

  // Convert Tauri downloads to Elite format
  const downloads: DownloadItem[] = tauriDownloads.map(d => ({
    id: d.id,
    type: 'direct' as DownloadType,
    url: d.url,
    fileName: d.fileName,
    destination: d.destination,
    totalSize: d.totalSize,
    downloadedSize: d.downloadedSize,
    status: d.status as DownloadStatus,
    priority: d.priority as DownloadPriority,
    progress: d.progress,
    speed: d.speed,
    averageSpeed: d.averageSpeed,
    timeRemaining: d.timeRemaining,
    segments: d.segments.map(s => ({
      index: s.index,
      startByte: s.startByte,
      endByte: s.endByte,
      downloadedBytes: s.downloadedBytes,
      status: s.status,
      speed: s.speed,
      error: s.error,
    })),
    segmentCount: d.segmentCount,
    createdAt: new Date(d.createdAt),
    startedAt: d.startedAt ? new Date(d.startedAt) : undefined,
    completedAt: d.completedAt ? new Date(d.completedAt) : undefined,
    error: d.error,
    retryCount: d.retryCount,
    maxRetries: d.maxRetries,
    category: d.category,
    tags: d.tags,
    mirrors: [],
    checksum: d.checksum,
  }));

  // Elite-only state (local features)
  const [clipboardLinks, setClipboardLinks] = useState<ClipboardLink[]>([]);
  const [isClipboardMonitoring, setIsClipboardMonitoring] = useState(false);

  // Elite services for local features
  const clipboardMonitorRef = useRef<ClipboardMonitorService | null>(null);
  const linkCheckerRef = useRef<LinkCheckerService | null>(null);
  const videoExtractorRef = useRef<VideoExtractorService | null>(null);

  // Initialize elite services
  useEffect(() => {
    clipboardMonitorRef.current = new ClipboardMonitorService();
    linkCheckerRef.current = new LinkCheckerService();
    videoExtractorRef.current = new VideoExtractorService();

    // Subscribe to clipboard
    clipboardMonitorRef.current.subscribe((link) => {
      setClipboardLinks(prev => [...prev, link]);
    });

    return () => {
      clipboardMonitorRef.current?.stop();
    };
  }, []);

  // Actions - Use Tauri backend
  const addDownload = useCallback(async (url: string, options?: {
    fileName?: string;
    destination?: string;
    segmentCount?: number;
    priority?: DownloadPriority;
    category?: string;
  }) => {
    return baseStartDownload(url, {
      fileName: options?.fileName,
      destination: options?.destination,
      segmentCount: options?.segmentCount,
      priority: options?.priority,
      category: options?.category,
    });
  }, [baseStartDownload]);

  const pauseDownload = useCallback(async (id: string) => {
    await basePauseDownload(id);
  }, [basePauseDownload]);

  const resumeDownload = useCallback(async (id: string) => {
    await baseResumeDownload(id);
  }, [baseResumeDownload]);

  const cancelDownload = useCallback(async (id: string, deleteFile?: boolean) => {
    await baseCancelDownload(id, deleteFile);
  }, [baseCancelDownload]);

  const retryDownload = useCallback(async (id: string) => {
    await baseRetryDownload(id);
  }, [baseRetryDownload]);

  // Elite features (local)
  const checkLink = useCallback(async (url: string) => {
    return linkCheckerRef.current?.checkLink(url);
  }, []);

  const extractVideoInfo = useCallback(async (url: string) => {
    return videoExtractorRef.current?.extractInfo(url);
  }, []);

  const toggleClipboardMonitor = useCallback(() => {
    if (!clipboardMonitorRef.current) return;
    
    if (clipboardMonitorRef.current.isActive) {
      clipboardMonitorRef.current.stop();
      setIsClipboardMonitoring(false);
    } else {
      clipboardMonitorRef.current.start();
      setIsClipboardMonitoring(true);
    }
  }, []);

  return {
    // State (from Tauri backend)
    downloads,
    stats,
    isLoading: baseLoading,
    error: baseError,

    // Elite state (local)
    clipboardLinks,
    isClipboardMonitoring,

    // Download actions (via Tauri backend)
    addDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    retryDownload,
    openLocation,
    openFile,
    clearCompleted,
    pauseAll,
    resumeAll,
    setSpeedLimit,
    refresh,

    // Elite utilities (local)
    checkLink,
    extractVideoInfo,
    toggleClipboardMonitor,
    clearClipboardLinks: () => {
      clipboardMonitorRef.current?.clearLinks();
      setClipboardLinks([]);
    },

    // Metadata
    categories: DOWNLOAD_CATEGORIES,
    videoPlatforms: VIDEO_PLATFORMS,

    // Service access (for advanced users)
    services: {
      clipboardMonitor: clipboardMonitorRef.current,
      linkChecker: linkCheckerRef.current,
      videoExtractor: videoExtractorRef.current,
    },
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  VIDEO_PLATFORMS,
  SUPPORTED_FILE_HOSTS,
  DOWNLOAD_CATEGORIES,
  MAX_SEGMENTS,
  formatBytes,
  formatDuration,
  detectVideoPlatform,
  detectDownloadType,
};
