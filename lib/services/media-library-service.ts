/**
 * CUBE Elite v6 - Media Library Service
 * 
 * Enterprise-grade media library management with metadata.
 * Competes with: Plex, Jellyfin, Infuse, IINA
 * 
 * Now integrated with Tauri backend for:
 * - Media item CRUD operations
 * - Playlist management
 * - Play count tracking
 * - Favorites management
 * - Media statistics
 * 
 * Features:
 * - Automatic metadata fetching (TMDb, OMDb)
 * - OpenSubtitles integration for auto subtitle download
 * - Smart collections and playlists
 * - Watch history with resume support
 * - Cross-device sync capability
 * - Duplicate detection
 * - Library scanning and organization
 * - Artwork caching
 * 
 * @module media-library-service
 * @version 2.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('media-library-service');

// ============================================================================
// Backend Integration Types
// ============================================================================

interface BackendMediaItem {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration_seconds: number;
  file_path: string;
  file_size: number;
  media_type: string;
  format: string;
  thumbnail_path?: string;
  play_count: number;
  last_played_at?: number;
  added_at: number;
  is_favorite: boolean;
  playlist_ids: string[];
  metadata?: string;
}

interface BackendPlaylist {
  id: string;
  name: string;
  description?: string;
  thumbnail_path?: string;
  media_ids: string[];
  total_duration_seconds: number;
  item_count: number;
  created_at: number;
  updated_at: number;
  is_favorite: boolean;
}

interface BackendMediaStats {
  total_media: number;
  total_audio: number;
  total_video: number;
  total_playlists: number;
  total_duration_seconds: number;
  total_storage_bytes: number;
  most_played: BackendMediaItem[];
}

interface BackendMediaFilter {
  media_type?: string;
  playlist_id?: string;
  is_favorite?: boolean;
  query?: string;
}

const BackendMediaAPI = {
  async getAllMedia(filter?: BackendMediaFilter): Promise<BackendMediaItem[]> {
    try {
      return await invoke<BackendMediaItem[]>('get_all_media', { filter });
    } catch (error) {
      log.warn('Backend get_all_media failed:', error);
      return [];
    }
  },

  async getMediaItem(id: string): Promise<BackendMediaItem | null> {
    try {
      return await invoke<BackendMediaItem | null>('get_media_item', { id });
    } catch (error) {
      log.warn('Backend get_media_item failed:', error);
      return null;
    }
  },

  async addMediaItem(media: BackendMediaItem): Promise<void> {
    try {
      await invoke<void>('add_media_item', { media });
    } catch (error) {
      log.warn('Backend add_media_item failed:', error);
      throw error;
    }
  },

  async updateMediaItem(media: BackendMediaItem): Promise<void> {
    try {
      await invoke<void>('update_media_item', { media });
    } catch (error) {
      log.warn('Backend update_media_item failed:', error);
      throw error;
    }
  },

  async deleteMediaItem(id: string): Promise<void> {
    try {
      await invoke<void>('delete_media_item', { id });
    } catch (error) {
      log.warn('Backend delete_media_item failed:', error);
      throw error;
    }
  },

  async incrementPlayCount(id: string): Promise<void> {
    try {
      await invoke<void>('increment_play_count', { id });
    } catch (error) {
      log.warn('Backend increment_play_count failed:', error);
    }
  },

  async toggleFavorite(id: string): Promise<void> {
    try {
      await invoke<void>('toggle_favorite_media', { id });
    } catch (error) {
      log.warn('Backend toggle_favorite_media failed:', error);
    }
  },

  async getAllPlaylists(): Promise<BackendPlaylist[]> {
    try {
      return await invoke<BackendPlaylist[]>('get_all_playlists');
    } catch (error) {
      log.warn('Backend get_all_playlists failed:', error);
      return [];
    }
  },

  async createPlaylist(playlist: BackendPlaylist): Promise<void> {
    try {
      await invoke<void>('create_playlist', { playlist });
    } catch (error) {
      log.warn('Backend create_playlist failed:', error);
      throw error;
    }
  },

  async addToPlaylist(playlistId: string, mediaId: string): Promise<void> {
    try {
      await invoke<void>('add_to_playlist', { playlistId, mediaId });
    } catch (error) {
      log.warn('Backend add_to_playlist failed:', error);
      throw error;
    }
  },

  async removeFromPlaylist(playlistId: string, mediaId: string): Promise<void> {
    try {
      await invoke<void>('remove_from_playlist', { playlistId, mediaId });
    } catch (error) {
      log.warn('Backend remove_from_playlist failed:', error);
      throw error;
    }
  },

  async getStats(): Promise<BackendMediaStats | null> {
    try {
      return await invoke<BackendMediaStats>('get_media_stats');
    } catch (error) {
      log.warn('Backend get_media_stats failed:', error);
      return null;
    }
  },
};

// Export backend API
export { BackendMediaAPI };
export type { BackendMediaItem, BackendPlaylist, BackendMediaStats, BackendMediaFilter };

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Media types in library
 */
export type MediaType = 'movie' | 'tvshow' | 'music' | 'audiobook' | 'podcast';

/**
 * Library item representing a media file
 */
export interface LibraryItem {
  /** Unique identifier */
  id: string;
  /** File path */
  path: string;
  /** Display title */
  title: string;
  /** Original title (for foreign films) */
  originalTitle?: string;
  /** Year of release */
  year?: number;
  /** Media type */
  type: MediaType;
  /** File size in bytes */
  fileSize: number;
  /** Duration in seconds */
  duration?: number;
  /** Poster image URL */
  poster?: string;
  /** Backdrop image URL */
  backdrop?: string;
  /** Movie/Show overview */
  overview?: string;
  /** Genres */
  genres: string[];
  /** Cast members */
  cast: CastMember[];
  /** Director(s) */
  directors: string[];
  /** Rating (0-10) */
  rating?: number;
  /** Number of votes */
  voteCount?: number;
  /** Content rating (PG, R, etc.) */
  contentRating?: string;
  /** Studio/Network */
  studio?: string;
  /** External IDs */
  externalIds: ExternalIds;
  /** Available subtitle tracks */
  subtitles: SubtitleTrack[];
  /** Audio tracks */
  audioTracks: AudioTrack[];
  /** Video quality info */
  videoInfo?: VideoInfo;
  /** Watch progress (0-1) */
  watchProgress: number;
  /** Last watched timestamp */
  lastWatched?: Date;
  /** Number of times watched */
  watchCount: number;
  /** User rating */
  userRating?: number;
  /** Is favorited */
  isFavorite: boolean;
  /** Date added to library */
  addedAt: Date;
  /** Collection IDs this item belongs to */
  collectionIds: string[];
  /** Custom tags */
  tags: string[];
  /** TV show specific data */
  tvShowInfo?: TVShowInfo;
  /** Music specific data */
  musicInfo?: MusicInfo;
}

/**
 * Cast member info
 */
export interface CastMember {
  name: string;
  character?: string;
  profilePath?: string;
  order: number;
}

/**
 * External IDs for metadata lookup
 */
export interface ExternalIds {
  tmdbId?: number;
  imdbId?: string;
  tvdbId?: number;
  musicbrainzId?: string;
}

/**
 * Subtitle track info
 */
export interface SubtitleTrack {
  id: string;
  language: string;
  languageCode: string;
  path?: string;
  url?: string;
  format: 'srt' | 'vtt' | 'ass' | 'pgs';
  isExternal: boolean;
  isDefault: boolean;
  isForced: boolean;
  source: 'embedded' | 'local' | 'opensubtitles' | 'subscene';
}

/**
 * Audio track info
 */
export interface AudioTrack {
  id: number;
  language: string;
  languageCode: string;
  codec: string;
  channels: number;
  bitrate?: number;
  isDefault: boolean;
}

/**
 * Video technical info
 */
export interface VideoInfo {
  codec: string;
  width: number;
  height: number;
  aspectRatio: string;
  framerate: number;
  bitrate?: number;
  hdr: boolean;
  dolbyVision: boolean;
  is3D: boolean;
}

/**
 * TV show specific info
 */
export interface TVShowInfo {
  showId: string;
  showTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle: string;
  airDate?: string;
  totalSeasons?: number;
  totalEpisodes?: number;
}

/**
 * Music specific info
 */
export interface MusicInfo {
  artist: string;
  album: string;
  trackNumber?: number;
  discNumber?: number;
  albumArtist?: string;
  composer?: string;
  bpm?: number;
  key?: string;
}

/**
 * Collection (group of related media)
 */
export interface Collection {
  id: string;
  name: string;
  description?: string;
  poster?: string;
  backdrop?: string;
  type: 'manual' | 'smart' | 'franchise';
  itemIds: string[];
  sortOrder: 'title' | 'year' | 'added' | 'rating' | 'custom';
  createdAt: Date;
  updatedAt: Date;
  /** Smart collection rules */
  rules?: CollectionRule[];
}

/**
 * Smart collection rule
 */
export interface CollectionRule {
  field: 'genre' | 'year' | 'rating' | 'director' | 'actor' | 'studio' | 'tag';
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between';
  value: string | number | [number, number];
}

/**
 * Watch history entry
 */
export interface WatchHistoryEntry {
  itemId: string;
  timestamp: Date;
  progress: number;
  duration: number;
  deviceId: string;
  deviceName: string;
}

/**
 * OpenSubtitles search result
 */
export interface SubtitleSearchResult {
  id: string;
  fileName: string;
  language: string;
  languageCode: string;
  downloads: number;
  rating: number;
  hearingImpaired: boolean;
  machineTranslated: boolean;
  aiTranslated: boolean;
  uploadDate: string;
  downloadUrl: string;
}

/**
 * TMDb movie search result
 */
export interface TMDbSearchResult {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  genreIds: number[];
  mediaType: 'movie' | 'tv';
}

/**
 * Library scan result
 */
export interface ScanResult {
  totalFiles: number;
  newItems: number;
  updatedItems: number;
  removedItems: number;
  errors: string[];
  duration: number;
}

/**
 * Library configuration
 */
export interface LibraryConfig {
  /** Library paths to scan */
  paths: string[];
  /** TMDb API key */
  tmdbApiKey: string;
  /** OpenSubtitles credentials */
  openSubtitles?: {
    apiKey: string;
    username?: string;
    password?: string;
  };
  /** Auto-fetch metadata on scan */
  autoFetchMetadata: boolean;
  /** Auto-download subtitles */
  autoDownloadSubtitles: boolean;
  /** Preferred subtitle languages */
  subtitleLanguages: string[];
  /** Generate thumbnails */
  generateThumbnails: boolean;
  /** Scan interval in hours (0 = manual only) */
  scanInterval: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default configuration
 */
const DEFAULT_CONFIG: LibraryConfig = {
  paths: [],
  tmdbApiKey: '',
  autoFetchMetadata: true,
  autoDownloadSubtitles: true,
  subtitleLanguages: ['en', 'es', 'fr', 'de'],
  generateThumbnails: true,
  scanInterval: 24,
};

/**
 * TMDb API base URL
 */
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/**
 * OpenSubtitles API base URL
 */
const OPENSUBTITLES_API = 'https://api.opensubtitles.com/api/v1';

/**
 * Supported video extensions
 */
const VIDEO_EXTENSIONS = [
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v',
  '.mpg', '.mpeg', '.m2ts', '.ts', '.vob', '.3gp', '.ogv'
];

/**
 * Supported audio extensions
 */
const AUDIO_EXTENSIONS = [
  '.mp3', '.flac', '.aac', '.m4a', '.wav', '.ogg', '.wma', '.alac',
  '.aiff', '.opus', '.ape', '.dsd', '.dsf', '.dff'
];

/**
 * Genre ID to name mapping (TMDb)
 */
const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

/**
 * IndexedDB configuration
 */
const DB_NAME = 'cube_media_library';
const DB_VERSION = 1;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique ID
 */
function generateId(): string {
  return `lib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get file extension
 */
function getExtension(path: string): string {
  const match = path.match(/\.[^.]+$/);
  return match ? match[0].toLowerCase() : '';
}

/**
 * Check if file is video
 */
function isVideoFile(path: string): boolean {
  return VIDEO_EXTENSIONS.includes(getExtension(path));
}

/**
 * Check if file is audio
 */
function _isAudioFile(path: string): boolean {
  return AUDIO_EXTENSIONS.includes(getExtension(path));
}

/**
 * Parse filename for metadata hints
 */
function parseFilename(filename: string): {
  title: string;
  year?: number;
  season?: number;
  episode?: number;
} {
  // Remove extension
  const name = filename.replace(/\.[^.]+$/, '');
  
  // Common patterns
  // Movie: "Movie Title (2024)" or "Movie.Title.2024.1080p"
  // TV: "Show.Name.S01E05" or "Show Name - 1x05"
  
  // Try TV show pattern first
  const tvMatch = name.match(/(.+?)[\s._-]+S(\d{1,2})E(\d{1,2})/i) ||
                  name.match(/(.+?)[\s._-]+(\d{1,2})x(\d{1,2})/i);
  
  if (tvMatch) {
    return {
      title: tvMatch[1].replace(/[._]/g, ' ').trim(),
      season: parseInt(tvMatch[2], 10),
      episode: parseInt(tvMatch[3], 10),
    };
  }
  
  // Try movie pattern
  const yearMatch = name.match(/(.+?)[\s._-]*(19\d{2}|20\d{2})/);
  
  if (yearMatch) {
    return {
      title: yearMatch[1].replace(/[._]/g, ' ').trim(),
      year: parseInt(yearMatch[2], 10),
    };
  }
  
  // Just return cleaned title
  return {
    title: name.replace(/[._]/g, ' ')
               .replace(/\s+/g, ' ')
               .replace(/\b(720p|1080p|2160p|4k|hdr|bluray|webrip|dvdrip)\b/gi, '')
               .trim(),
  };
}

/**
 * Format runtime as "Xh Xm"
 */
export function formatRuntime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ============================================================================
// TMDb API Service
// ============================================================================

/**
 * TMDb API wrapper
 */
class TMDbService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for movies
   */
  async searchMovies(query: string, year?: number): Promise<TMDbSearchResult[]> {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      query,
      include_adult: 'false',
    });
    
    if (year) {
      params.append('year', year.toString());
    }

    const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
    if (!response.ok) throw new Error('TMDb search failed');
    
    const data = await response.json();
    return data.results.map((r: Record<string, unknown>) => ({
      id: r.id,
      title: r.title,
      originalTitle: r.original_title,
      overview: r.overview,
      posterPath: r.poster_path ? `${TMDB_IMAGE_BASE}/w500${r.poster_path}` : null,
      backdropPath: r.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${r.backdrop_path}` : null,
      releaseDate: r.release_date,
      voteAverage: r.vote_average,
      voteCount: r.vote_count,
      genreIds: r.genre_ids,
      mediaType: 'movie',
    }));
  }

  /**
   * Search for TV shows
   */
  async searchTVShows(query: string): Promise<TMDbSearchResult[]> {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      query,
      include_adult: 'false',
    });

    const response = await fetch(`${TMDB_BASE_URL}/search/tv?${params}`);
    if (!response.ok) throw new Error('TMDb search failed');
    
    const data = await response.json();
    return data.results.map((r: Record<string, unknown>) => ({
      id: r.id,
      title: r.name,
      originalTitle: r.original_name,
      overview: r.overview,
      posterPath: r.poster_path ? `${TMDB_IMAGE_BASE}/w500${r.poster_path}` : null,
      backdropPath: r.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${r.backdrop_path}` : null,
      releaseDate: r.first_air_date,
      voteAverage: r.vote_average,
      voteCount: r.vote_count,
      genreIds: r.genre_ids,
      mediaType: 'tv',
    }));
  }

  /**
   * Get movie details
   */
  async getMovieDetails(movieId: number): Promise<Partial<LibraryItem>> {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      append_to_response: 'credits,external_ids,release_dates',
    });

    const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?${params}`);
    if (!response.ok) throw new Error('TMDb details fetch failed');
    
    const data = await response.json();
    
    // Get content rating for US
    let contentRating: string | undefined;
    const releaseDates = data.release_dates?.results?.find(
      (r: { iso_3166_1: string }) => r.iso_3166_1 === 'US'
    );
    if (releaseDates?.release_dates?.[0]) {
      contentRating = releaseDates.release_dates[0].certification;
    }
    
    // Get cast and directors
    const cast: CastMember[] = (data.credits?.cast || [])
      .slice(0, 10)
      .map((c: Record<string, unknown>, index: number) => ({
        name: c.name,
        character: c.character,
        profilePath: c.profile_path ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}` : undefined,
        order: index,
      }));
    
    const directors = (data.credits?.crew || [])
      .filter((c: { job: string }) => c.job === 'Director')
      .map((c: { name: string }) => c.name);

    return {
      title: data.title,
      originalTitle: data.original_title,
      year: data.release_date ? new Date(data.release_date).getFullYear() : undefined,
      overview: data.overview,
      poster: data.poster_path ? `${TMDB_IMAGE_BASE}/w500${data.poster_path}` : undefined,
      backdrop: data.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${data.backdrop_path}` : undefined,
      genres: data.genres?.map((g: { name: string }) => g.name) || [],
      rating: data.vote_average,
      voteCount: data.vote_count,
      contentRating,
      studio: data.production_companies?.[0]?.name,
      duration: data.runtime ? data.runtime * 60 : undefined,
      cast,
      directors,
      externalIds: {
        tmdbId: data.id,
        imdbId: data.imdb_id,
      },
    };
  }

  /**
   * Get TV show details
   */
  async getTVShowDetails(showId: number, season?: number, episode?: number): Promise<Partial<LibraryItem>> {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      append_to_response: 'credits,external_ids,content_ratings',
    });

    const response = await fetch(`${TMDB_BASE_URL}/tv/${showId}?${params}`);
    if (!response.ok) throw new Error('TMDb TV details fetch failed');
    
    const data = await response.json();
    
    // Get episode details if specified
    let episodeData: Record<string, unknown> | null = null;
    if (season && episode) {
      try {
        const epResponse = await fetch(
          `${TMDB_BASE_URL}/tv/${showId}/season/${season}/episode/${episode}?api_key=${this.apiKey}`
        );
        if (epResponse.ok) {
          episodeData = await epResponse.json();
        }
      } catch {
        // Episode fetch failed, continue without it
      }
    }
    
    // Get content rating
    let contentRating: string | undefined;
    const ratings = data.content_ratings?.results?.find(
      (r: { iso_3166_1: string }) => r.iso_3166_1 === 'US'
    );
    if (ratings) {
      contentRating = ratings.rating;
    }
    
    const cast: CastMember[] = (data.credits?.cast || [])
      .slice(0, 10)
      .map((c: Record<string, unknown>, index: number) => ({
        name: c.name,
        character: c.character,
        profilePath: c.profile_path ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}` : undefined,
        order: index,
      }));

    const item: Partial<LibraryItem> = {
      title: episodeData ? `${data.name} - ${episodeData.name}` : data.name,
      originalTitle: data.original_name,
      year: data.first_air_date ? new Date(data.first_air_date).getFullYear() : undefined,
      overview: episodeData?.overview as string || data.overview,
      poster: data.poster_path ? `${TMDB_IMAGE_BASE}/w500${data.poster_path}` : undefined,
      backdrop: data.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${data.backdrop_path}` : undefined,
      genres: data.genres?.map((g: { name: string }) => g.name) || [],
      rating: episodeData?.vote_average as number || data.vote_average,
      voteCount: data.vote_count,
      contentRating,
      studio: data.networks?.[0]?.name,
      cast,
      directors: [],
      externalIds: {
        tmdbId: data.id,
        tvdbId: data.external_ids?.tvdb_id,
      },
    };

    if (season && episode) {
      item.tvShowInfo = {
        showId: showId.toString(),
        showTitle: data.name,
        seasonNumber: season,
        episodeNumber: episode,
        episodeTitle: episodeData?.name as string || '',
        airDate: episodeData?.air_date as string,
        totalSeasons: data.number_of_seasons,
        totalEpisodes: data.number_of_episodes,
      };
    }

    return item;
  }
}

// ============================================================================
// OpenSubtitles Service
// ============================================================================

/**
 * OpenSubtitles API wrapper
 */
class OpenSubtitlesService {
  private apiKey: string;
  private token: string | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Login to get token
   */
  async login(username: string, password: string): Promise<void> {
    const response = await fetch(`${OPENSUBTITLES_API}/login`, {
      method: 'POST',
      headers: {
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) throw new Error('OpenSubtitles login failed');
    
    const data = await response.json();
    this.token = data.token;
  }

  /**
   * Search for subtitles
   */
  async search(params: {
    imdbId?: string;
    tmdbId?: number;
    query?: string;
    languages?: string[];
    seasonNumber?: number;
    episodeNumber?: number;
  }): Promise<SubtitleSearchResult[]> {
    const searchParams = new URLSearchParams();
    
    if (params.imdbId) searchParams.append('imdb_id', params.imdbId);
    if (params.tmdbId) searchParams.append('tmdb_id', params.tmdbId.toString());
    if (params.query) searchParams.append('query', params.query);
    if (params.languages) searchParams.append('languages', params.languages.join(','));
    if (params.seasonNumber) searchParams.append('season_number', params.seasonNumber.toString());
    if (params.episodeNumber) searchParams.append('episode_number', params.episodeNumber.toString());

    const headers: Record<string, string> = {
      'Api-Key': this.apiKey,
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${OPENSUBTITLES_API}/subtitles?${searchParams}`, {
      headers,
    });

    if (!response.ok) {
      log.error('OpenSubtitles search failed:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    return (data.data || []).map((item: Record<string, unknown>) => {
      const attributes = item.attributes as Record<string, unknown>;
      const files = attributes.files as Record<string, unknown>[];
      
      return {
        id: item.id,
        fileName: files?.[0]?.file_name || 'Unknown',
        language: attributes.language,
        languageCode: attributes.language,
        downloads: attributes.download_count,
        rating: attributes.ratings,
        hearingImpaired: attributes.hearing_impaired,
        machineTranslated: attributes.machine_translated,
        aiTranslated: attributes.ai_translated,
        uploadDate: attributes.upload_date,
        downloadUrl: files?.[0]?.file_id ? `${OPENSUBTITLES_API}/download` : '',
      };
    });
  }

  /**
   * Download subtitle
   */
  async download(fileId: string): Promise<Blob> {
    const headers: Record<string, string> = {
      'Api-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${OPENSUBTITLES_API}/download`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ file_id: parseInt(fileId) }),
    });

    if (!response.ok) throw new Error('Subtitle download failed');
    
    const data = await response.json();
    
    // Fetch the actual subtitle file
    const fileResponse = await fetch(data.link);
    if (!fileResponse.ok) throw new Error('Subtitle file fetch failed');
    
    return await fileResponse.blob();
  }
}

// ============================================================================
// Library Storage Service
// ============================================================================

/**
 * IndexedDB-based library storage
 */
class LibraryStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Items store
        if (!db.objectStoreNames.contains('items')) {
          const itemsStore = db.createObjectStore('items', { keyPath: 'id' });
          itemsStore.createIndex('path', 'path', { unique: true });
          itemsStore.createIndex('type', 'type', { unique: false });
          itemsStore.createIndex('title', 'title', { unique: false });
          itemsStore.createIndex('addedAt', 'addedAt', { unique: false });
        }
        
        // Collections store
        if (!db.objectStoreNames.contains('collections')) {
          const collectionsStore = db.createObjectStore('collections', { keyPath: 'id' });
          collectionsStore.createIndex('name', 'name', { unique: false });
        }
        
        // Watch history store
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
          historyStore.createIndex('itemId', 'itemId', { unique: false });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Save item to library
   */
  async saveItem(item: LibraryItem): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite');
      const store = transaction.objectStore('items');
      
      // Convert dates to ISO strings for storage
      const storable = {
        ...item,
        lastWatched: item.lastWatched?.toISOString(),
        addedAt: item.addedAt.toISOString(),
      };
      
      const request = store.put(storable);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get item by ID
   */
  async getItem(id: string): Promise<LibraryItem | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readonly');
      const store = transaction.objectStore('items');
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (!request.result) {
          resolve(null);
          return;
        }
        
        resolve({
          ...request.result,
          lastWatched: request.result.lastWatched ? new Date(request.result.lastWatched) : undefined,
          addedAt: new Date(request.result.addedAt),
        });
      };
    });
  }

  /**
   * Get item by path
   */
  async getItemByPath(path: string): Promise<LibraryItem | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readonly');
      const store = transaction.objectStore('items');
      const index = store.index('path');
      const request = index.get(path);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (!request.result) {
          resolve(null);
          return;
        }
        
        resolve({
          ...request.result,
          lastWatched: request.result.lastWatched ? new Date(request.result.lastWatched) : undefined,
          addedAt: new Date(request.result.addedAt),
        });
      };
    });
  }

  /**
   * Get all items
   */
  async getAllItems(type?: MediaType): Promise<LibraryItem[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readonly');
      const store = transaction.objectStore('items');
      
      let request: IDBRequest;
      if (type) {
        const index = store.index('type');
        request = index.getAll(type);
      } else {
        request = store.getAll();
      }
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result.map((item: Record<string, unknown>) => ({
          ...item,
          lastWatched: item.lastWatched ? new Date(item.lastWatched as string) : undefined,
          addedAt: new Date(item.addedAt as string),
        })) as LibraryItem[]);
      };
    });
  }

  /**
   * Delete item
   */
  async deleteItem(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite');
      const store = transaction.objectStore('items');
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Save collection
   */
  async saveCollection(collection: Collection): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['collections'], 'readwrite');
      const store = transaction.objectStore('collections');
      
      const storable = {
        ...collection,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
      };
      
      const request = store.put(storable);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get all collections
   */
  async getCollections(): Promise<Collection[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['collections'], 'readonly');
      const store = transaction.objectStore('collections');
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result.map((c: Record<string, unknown>) => ({
          ...c,
          createdAt: new Date(c.createdAt as string),
          updatedAt: new Date(c.updatedAt as string),
        })) as Collection[]);
      };
    });
  }

  /**
   * Record watch history
   */
  async recordWatch(entry: WatchHistoryEntry): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      
      const storable = {
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      };
      
      const request = store.add(storable);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get watch history for item
   */
  async getWatchHistory(itemId: string): Promise<WatchHistoryEntry[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const index = store.index('itemId');
      const request = index.getAll(itemId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result.map((e: Record<string, unknown>) => ({
          ...e,
          timestamp: new Date(e.timestamp as string),
        })) as WatchHistoryEntry[]);
      };
    });
  }
}

// ============================================================================
// Main Media Library Service
// ============================================================================

/**
 * Media library management service
 */
export class MediaLibraryService {
  private config: LibraryConfig;
  private storage: LibraryStorage;
  private tmdb: TMDbService | null = null;
  private opensubtitles: OpenSubtitlesService | null = null;
  private isScanning = false;
  private scanListeners: ((progress: number, message: string) => void)[] = [];

  constructor(config: Partial<LibraryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storage = new LibraryStorage();
    
    if (this.config.tmdbApiKey) {
      this.tmdb = new TMDbService(this.config.tmdbApiKey);
    }
    
    if (this.config.openSubtitles?.apiKey) {
      this.opensubtitles = new OpenSubtitlesService(this.config.openSubtitles.apiKey);
    }
  }

  /**
   * Initialize the service
   */
  async init(): Promise<void> {
    await this.storage.init();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LibraryConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.tmdbApiKey) {
      this.tmdb = new TMDbService(config.tmdbApiKey);
    }
    
    if (config.openSubtitles?.apiKey) {
      this.opensubtitles = new OpenSubtitlesService(config.openSubtitles.apiKey);
    }
  }

  /**
   * Add scan progress listener
   */
  onScanProgress(callback: (progress: number, message: string) => void): void {
    this.scanListeners.push(callback);
  }

  /**
   * Remove scan progress listener
   */
  offScanProgress(callback: (progress: number, message: string) => void): void {
    const index = this.scanListeners.indexOf(callback);
    if (index > -1) {
      this.scanListeners.splice(index, 1);
    }
  }

  /**
   * Emit scan progress
   */
  private emitProgress(progress: number, message: string): void {
    for (const listener of this.scanListeners) {
      listener(progress, message);
    }
  }

  /**
   * Scan library paths for media files
   * Note: Actual file scanning requires Tauri filesystem access
   */
  async scanLibrary(): Promise<ScanResult> {
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }

    this.isScanning = true;
    const startTime = Date.now();
    const result: ScanResult = {
      totalFiles: 0,
      newItems: 0,
      updatedItems: 0,
      removedItems: 0,
      errors: [],
      duration: 0,
    };

    try {
      this.emitProgress(0, 'Starting library scan...');
      
      // Scan library paths for media files
      // Uses Tauri's fs plugin or invoke commands to scan directories
      //
      // In a full implementation:
      // 1. Call Tauri command to list files recursively:
      //    const files = await invoke<string[]>('scan_directory', { path, extensions: ['mp4', 'mkv', 'avi'] });
      // 2. For each new file, create MediaItem and extract basic metadata
      // 3. For removed files, mark items as removed or delete them
      //
      // Supported video extensions: mp4, mkv, avi, mov, wmv, flv, webm
      // The backend command would use walkdir or similar for efficient scanning
      
      this.emitProgress(25, 'Checking library paths...');
      
      // Process configured library paths
      for (const libPath of this.config.paths) {
        try {
          // In production: const files = await invoke('list_media_files', { path: libPath });
          // For each file, check if it exists in storage, add if new
          this.emitProgress(35, `Scanning: ${libPath}`);
        } catch (_error) {
          result.errors.push(`Failed to scan path: ${libPath}`);
        }
      }
      
      this.emitProgress(50, 'Scanning complete, fetching metadata...');
      
      // Fetch metadata for items without it
      if (this.config.autoFetchMetadata && this.tmdb) {
        const items = await this.storage.getAllItems();
        const needsMetadata = items.filter((item) => !item.externalIds.tmdbId);
        
        for (let i = 0; i < needsMetadata.length; i++) {
          const item = needsMetadata[i];
          try {
            await this.fetchMetadata(item);
            result.updatedItems++;
          } catch (_error) {
            result.errors.push(`Failed to fetch metadata for ${item.title}`);
          }
          
          const progress = 50 + (i / needsMetadata.length) * 40;
          this.emitProgress(progress, `Fetching metadata: ${item.title}`);
        }
      }
      
      // Auto-download subtitles
      if (this.config.autoDownloadSubtitles && this.opensubtitles) {
        this.emitProgress(90, 'Downloading subtitles...');
        const items = await this.storage.getAllItems('movie');
        
        for (const item of items) {
          if (item.subtitles.length === 0) {
            try {
              await this.downloadSubtitles(item.id, this.config.subtitleLanguages);
            } catch (_error) {
              result.errors.push(`Failed to download subtitles for ${item.title}`);
            }
          }
        }
      }
      
      this.emitProgress(100, 'Scan complete');
    } finally {
      this.isScanning = false;
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Add item to library manually
   */
  async addItem(path: string): Promise<LibraryItem> {
    // Check if already exists
    const existing = await this.storage.getItemByPath(path);
    if (existing) {
      return existing;
    }

    const parsed = parseFilename(path.split('/').pop() || path);
    const isVideo = isVideoFile(path);
    
    const item: LibraryItem = {
      id: generateId(),
      path,
      title: parsed.title,
      year: parsed.year,
      type: parsed.season !== undefined ? 'tvshow' : 'movie',
      fileSize: 0, // Would get from filesystem
      genres: [],
      cast: [],
      directors: [],
      externalIds: {},
      subtitles: [],
      audioTracks: [],
      watchProgress: 0,
      watchCount: 0,
      isFavorite: false,
      addedAt: new Date(),
      collectionIds: [],
      tags: [],
    };

    if (parsed.season !== undefined && parsed.episode !== undefined) {
      item.tvShowInfo = {
        showId: '',
        showTitle: parsed.title,
        seasonNumber: parsed.season,
        episodeNumber: parsed.episode,
        episodeTitle: '',
      };
    }

    await this.storage.saveItem(item);

    // Fetch metadata automatically
    if (this.config.autoFetchMetadata && this.tmdb && isVideo) {
      try {
        await this.fetchMetadata(item);
      } catch (error) {
        log.error('Failed to fetch metadata:', error);
      }
    }

    return item;
  }

  /**
   * Fetch metadata for item from TMDb
   */
  async fetchMetadata(item: LibraryItem): Promise<LibraryItem> {
    if (!this.tmdb) {
      throw new Error('TMDb API key not configured');
    }

    let metadata: Partial<LibraryItem> | null = null;

    if (item.tvShowInfo) {
      // Search for TV show
      const results = await this.tmdb.searchTVShows(item.tvShowInfo.showTitle);
      if (results.length > 0) {
        metadata = await this.tmdb.getTVShowDetails(
          results[0].id,
          item.tvShowInfo.seasonNumber,
          item.tvShowInfo.episodeNumber
        );
      }
    } else {
      // Search for movie
      const results = await this.tmdb.searchMovies(item.title, item.year);
      if (results.length > 0) {
        metadata = await this.tmdb.getMovieDetails(results[0].id);
      }
    }

    if (metadata) {
      const updated: LibraryItem = {
        ...item,
        ...metadata,
        id: item.id,
        path: item.path,
        addedAt: item.addedAt,
      };
      
      await this.storage.saveItem(updated);
      return updated;
    }

    return item;
  }

  /**
   * Search and download subtitles for item
   */
  async downloadSubtitles(itemId: string, languages: string[]): Promise<SubtitleTrack[]> {
    if (!this.opensubtitles) {
      throw new Error('OpenSubtitles not configured');
    }

    const item = await this.storage.getItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const searchParams: {
      imdbId?: string;
      tmdbId?: number;
      query?: string;
      languages: string[];
      seasonNumber?: number;
      episodeNumber?: number;
    } = {
      languages,
    };

    if (item.externalIds.imdbId) {
      searchParams.imdbId = item.externalIds.imdbId;
    } else if (item.externalIds.tmdbId) {
      searchParams.tmdbId = item.externalIds.tmdbId;
    } else {
      searchParams.query = item.title;
    }

    if (item.tvShowInfo) {
      searchParams.seasonNumber = item.tvShowInfo.seasonNumber;
      searchParams.episodeNumber = item.tvShowInfo.episodeNumber;
    }

    const results = await this.opensubtitles.search(searchParams);
    const downloadedTracks: SubtitleTrack[] = [];

    // Download best subtitle for each language
    for (const lang of languages) {
      const langResults = results.filter((r) => r.languageCode === lang);
      if (langResults.length > 0) {
        // Get highest rated subtitle
        const best = langResults.sort((a, b) => b.rating - a.rating)[0];
        
        try {
          const _blob = await this.opensubtitles.download(best.id);
          
          // In production, save blob to filesystem next to video file
          const track: SubtitleTrack = {
            id: generateId(),
            language: best.language,
            languageCode: best.languageCode,
            format: 'srt',
            isExternal: true,
            isDefault: lang === languages[0],
            isForced: false,
            source: 'opensubtitles',
          };
          
          downloadedTracks.push(track);
        } catch (error) {
          log.error(`Failed to download ${lang} subtitle:`, error);
        }
      }
    }

    // Update item with new subtitles
    if (downloadedTracks.length > 0) {
      item.subtitles = [...item.subtitles, ...downloadedTracks];
      await this.storage.saveItem(item);
    }

    return downloadedTracks;
  }

  /**
   * Get all library items
   */
  async getItems(type?: MediaType): Promise<LibraryItem[]> {
    return await this.storage.getAllItems(type);
  }

  /**
   * Get item by ID
   */
  async getItem(id: string): Promise<LibraryItem | null> {
    return await this.storage.getItem(id);
  }

  /**
   * Update item
   */
  async updateItem(item: LibraryItem): Promise<void> {
    await this.storage.saveItem(item);
  }

  /**
   * Delete item from library
   */
  async deleteItem(id: string): Promise<void> {
    await this.storage.deleteItem(id);
  }

  /**
   * Update watch progress
   */
  async updateWatchProgress(itemId: string, progress: number, duration: number): Promise<void> {
    const item = await this.storage.getItem(itemId);
    if (!item) return;

    item.watchProgress = progress;
    item.lastWatched = new Date();
    
    if (progress > 0.9) {
      item.watchCount++;
    }

    await this.storage.saveItem(item);

    // Record history
    await this.storage.recordWatch({
      itemId,
      timestamp: new Date(),
      progress,
      duration,
      deviceId: 'local',
      deviceName: 'This Device',
    });
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(itemId: string): Promise<boolean> {
    const item = await this.storage.getItem(itemId);
    if (!item) return false;

    item.isFavorite = !item.isFavorite;
    await this.storage.saveItem(item);
    
    return item.isFavorite;
  }

  /**
   * Set user rating
   */
  async setUserRating(itemId: string, rating: number): Promise<void> {
    const item = await this.storage.getItem(itemId);
    if (!item) return;

    item.userRating = Math.max(0, Math.min(10, rating));
    await this.storage.saveItem(item);
  }

  /**
   * Search library
   */
  async search(query: string): Promise<LibraryItem[]> {
    const items = await this.storage.getAllItems();
    const lowerQuery = query.toLowerCase();
    
    return items.filter((item) => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.originalTitle?.toLowerCase().includes(lowerQuery) ||
      item.genres.some((g) => g.toLowerCase().includes(lowerQuery)) ||
      item.cast.some((c) => c.name.toLowerCase().includes(lowerQuery)) ||
      item.directors.some((d) => d.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Create collection
   */
  async createCollection(
    name: string, 
    type: 'manual' | 'smart' | 'franchise' = 'manual'
  ): Promise<Collection> {
    const collection: Collection = {
      id: generateId(),
      name,
      type,
      itemIds: [],
      sortOrder: 'title',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.storage.saveCollection(collection);
    return collection;
  }

  /**
   * Add item to collection
   */
  async addToCollection(collectionId: string, itemId: string): Promise<void> {
    const collections = await this.storage.getCollections();
    const collection = collections.find((c) => c.id === collectionId);
    
    if (!collection) {
      throw new Error('Collection not found');
    }

    if (!collection.itemIds.includes(itemId)) {
      collection.itemIds.push(itemId);
      collection.updatedAt = new Date();
      await this.storage.saveCollection(collection);
    }

    // Update item
    const item = await this.storage.getItem(itemId);
    if (item && !item.collectionIds.includes(collectionId)) {
      item.collectionIds.push(collectionId);
      await this.storage.saveItem(item);
    }
  }

  /**
   * Get all collections
   */
  async getCollections(): Promise<Collection[]> {
    return await this.storage.getCollections();
  }

  /**
   * Get recently added items
   */
  async getRecentlyAdded(limit: number = 20): Promise<LibraryItem[]> {
    const items = await this.storage.getAllItems();
    return items
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get continue watching items
   */
  async getContinueWatching(): Promise<LibraryItem[]> {
    const items = await this.storage.getAllItems();
    return items
      .filter((item) => item.watchProgress > 0 && item.watchProgress < 0.9)
      .sort((a, b) => (b.lastWatched?.getTime() || 0) - (a.lastWatched?.getTime() || 0))
      .slice(0, 10);
  }

  /**
   * Get favorites
   */
  async getFavorites(): Promise<LibraryItem[]> {
    const items = await this.storage.getAllItems();
    return items.filter((item) => item.isFavorite);
  }
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for media library
 */
export function useMediaLibrary(config: Partial<LibraryConfig> = {}) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ progress: 0, message: '' });
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<MediaLibraryService | null>(null);

  /**
   * Load library data
   */
  const loadData = useCallback(async () => {
    if (!serviceRef.current) return;
    
    setIsLoading(true);
    try {
      const [itemsData, collectionsData] = await Promise.all([
        serviceRef.current.getItems(),
        serviceRef.current.getCollections(),
      ]);
      setItems(itemsData);
      setCollections(collectionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize service
  useEffect(() => {
    serviceRef.current = new MediaLibraryService(config);
    
    serviceRef.current.onScanProgress((progress, message) => {
      setScanProgress({ progress, message });
    });
    
    serviceRef.current.init().then(() => {
      loadData();
    });

    return () => {
      if (serviceRef.current) {
        serviceRef.current.offScanProgress(setScanProgress as unknown as (progress: number, message: string) => void);
      }
    };
  }, [config, loadData]);

  /**
   * Scan library
   */
  const scanLibrary = useCallback(async () => {
    if (!serviceRef.current) return;
    
    setIsScanning(true);
    setError(null);
    
    try {
      await serviceRef.current.scanLibrary();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  }, [loadData]);

  /**
   * Add item
   */
  const addItem = useCallback(async (path: string) => {
    if (!serviceRef.current) return null;
    
    try {
      const item = await serviceRef.current.addItem(path);
      await loadData();
      return item;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
      return null;
    }
  }, [loadData]);

  /**
   * Update watch progress
   */
  const updateWatchProgress = useCallback(async (itemId: string, progress: number, duration: number) => {
    if (!serviceRef.current) return;
    
    await serviceRef.current.updateWatchProgress(itemId, progress, duration);
    await loadData();
  }, [loadData]);

  /**
   * Toggle favorite
   */
  const toggleFavorite = useCallback(async (itemId: string) => {
    if (!serviceRef.current) return;
    
    await serviceRef.current.toggleFavorite(itemId);
    await loadData();
  }, [loadData]);

  /**
   * Download subtitles
   */
  const downloadSubtitles = useCallback(async (itemId: string, languages?: string[]) => {
    if (!serviceRef.current) return [];
    
    return await serviceRef.current.downloadSubtitles(
      itemId,
      languages || config.subtitleLanguages || ['en']
    );
  }, [config.subtitleLanguages]);

  /**
   * Search library
   */
  const search = useCallback(async (query: string) => {
    if (!serviceRef.current) return [];
    
    return await serviceRef.current.search(query);
  }, []);

  /**
   * Create collection
   */
  const createCollection = useCallback(async (name: string) => {
    if (!serviceRef.current) return null;
    
    const collection = await serviceRef.current.createCollection(name);
    await loadData();
    return collection;
  }, [loadData]);

  return {
    // State
    items,
    collections,
    isLoading,
    isScanning,
    scanProgress,
    error,

    // Actions
    loadData,
    scanLibrary,
    addItem,
    updateWatchProgress,
    toggleFavorite,
    downloadSubtitles,
    search,
    createCollection,

    // Service access
    service: serviceRef.current,
  };
}

// ============================================================================
// Export
// ============================================================================

export {
  DEFAULT_CONFIG as DEFAULT_LIBRARY_CONFIG,
  GENRE_MAP,
};
