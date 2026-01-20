/**
 * CUBE Elite v6 - Voice Message Service
 * 
 * Enterprise-grade voice message functionality for chat module.
 * Competes with: Discord, Telegram, WhatsApp
 * 
 * Now integrated with Tauri backend for:
 * - VoIP initialization and management
 * - TURN/STUN server configuration
 * - Call state management
 * - Audio/video controls
 * 
 * Features:
 * - Audio recording with MediaRecorder API
 * - Waveform visualization with Web Audio API
 * - Opus/WebM encoding for optimal compression
 * - Speech-to-text transcription (optional)
 * - Voice message playback with speed control
 * - Noise reduction and gain normalization
 * - Offline storage with IndexedDB
 * 
 * @module voice-message-service
 * @version 2.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '@/types/web-speech-api';
import { logger } from './logger-service';

const log = logger.scope('VoiceMessage');

// ============================================================================
// Backend Integration Types
// ============================================================================

interface BackendVoIPConfig {
  ice_transport_policy: string;
  bundle_policy: string;
  preferred_audio_codec: string;
  preferred_video_codec: string;
  audio_bitrate?: number;
  video_bitrate?: number;
  video_width?: number;
  video_height?: number;
  video_framerate?: number;
  echo_cancellation: boolean;
  noise_suppression: boolean;
  auto_gain_control: boolean;
}

interface BackendCallState {
  state: string;
  is_audio_muted: boolean;
  is_video_enabled: boolean;
  has_remote_audio: boolean;
  has_remote_video: boolean;
  call_duration_seconds?: number;
}

interface BackendCallStats {
  bytes_sent: number;
  bytes_received: number;
  packets_sent: number;
  packets_received: number;
  packets_lost: number;
  jitter: number;
  round_trip_time: number;
  audio_level?: number;
  video_width?: number;
  video_height?: number;
  framerate?: number;
}

interface BackendTurnProviderConfig {
  provider_type: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  metered_api_key?: string;
  custom_servers?: Array<{
    urls: string[];
    username?: string;
    credential?: string;
  }>;
}

const BackendVoIPAPI = {
  async initialize(config: BackendVoIPConfig): Promise<string> {
    try {
      return await invoke<string>('voip_initialize', { config });
    } catch (error) {
      log.warn('Backend voip_initialize failed:', error);
      throw error;
    }
  },

  async initializeWithProvider(config: BackendVoIPConfig, provider: BackendTurnProviderConfig): Promise<string> {
    try {
      return await invoke<string>('voip_initialize_with_provider', { config, provider });
    } catch (error) {
      log.warn('Backend voip_initialize_with_provider failed:', error);
      throw error;
    }
  },

  async createOffer(): Promise<string> {
    try {
      return await invoke<string>('voip_create_offer');
    } catch (error) {
      log.warn('Backend voip_create_offer failed:', error);
      throw error;
    }
  },

  async createAnswer(): Promise<string> {
    try {
      return await invoke<string>('voip_create_answer');
    } catch (error) {
      log.warn('Backend voip_create_answer failed:', error);
      throw error;
    }
  },

  async setRemoteDescription(sdpType: string, sdp: string): Promise<string> {
    try {
      return await invoke<string>('voip_set_remote_description', { sdpType, sdp });
    } catch (error) {
      log.warn('Backend voip_set_remote_description failed:', error);
      throw error;
    }
  },

  async addIceCandidate(candidate: string, sdpMid: string, sdpMLineIndex: number): Promise<string> {
    try {
      return await invoke<string>('voip_add_ice_candidate', { candidate, sdpMid, sdpMLineIndex });
    } catch (error) {
      log.warn('Backend voip_add_ice_candidate failed:', error);
      throw error;
    }
  },

  async getIceCandidates(): Promise<string[]> {
    try {
      return await invoke<string[]>('voip_get_ice_candidates');
    } catch (error) {
      log.warn('Backend voip_get_ice_candidates failed:', error);
      return [];
    }
  },

  async clearCandidates(): Promise<string> {
    try {
      return await invoke<string>('voip_clear_candidates');
    } catch (error) {
      log.warn('Backend voip_clear_candidates failed:', error);
      throw error;
    }
  },

  async setAudioMuted(muted: boolean): Promise<string> {
    try {
      return await invoke<string>('voip_set_audio_muted', { muted });
    } catch (error) {
      log.warn('Backend voip_set_audio_muted failed:', error);
      throw error;
    }
  },

  async setVideoEnabled(enabled: boolean): Promise<string> {
    try {
      return await invoke<string>('voip_set_video_enabled', { enabled });
    } catch (error) {
      log.warn('Backend voip_set_video_enabled failed:', error);
      throw error;
    }
  },

  async getCallState(): Promise<BackendCallState | null> {
    try {
      return await invoke<BackendCallState>('voip_get_call_state');
    } catch (error) {
      log.warn('Backend voip_get_call_state failed:', error);
      return null;
    }
  },

  async getCallStats(): Promise<BackendCallStats | null> {
    try {
      return await invoke<BackendCallStats>('voip_get_call_stats');
    } catch (error) {
      log.warn('Backend voip_get_call_stats failed:', error);
      return null;
    }
  },

  async hasTurnServers(): Promise<boolean> {
    try {
      return await invoke<boolean>('voip_has_turn_servers');
    } catch (error) {
      log.warn('Backend voip_has_turn_servers failed:', error);
      return false;
    }
  },

  async close(): Promise<string> {
    try {
      return await invoke<string>('voip_close');
    } catch (error) {
      log.warn('Backend voip_close failed:', error);
      throw error;
    }
  },

  async quickStartTwilio(accountSid: string, authToken: string): Promise<string> {
    try {
      return await invoke<string>('voip_quick_start_twilio', { accountSid, authToken });
    } catch (error) {
      log.warn('Backend voip_quick_start_twilio failed:', error);
      throw error;
    }
  },

  async quickStartMetered(apiKey: string): Promise<string> {
    try {
      return await invoke<string>('voip_quick_start_metered', { apiKey });
    } catch (error) {
      log.warn('Backend voip_quick_start_metered failed:', error);
      throw error;
    }
  },
};

// Export backend API
export { BackendVoIPAPI };
export type { BackendVoIPConfig, BackendCallState, BackendCallStats, BackendTurnProviderConfig };

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Represents a voice message with all metadata
 */
export interface VoiceMessage {
  /** Unique identifier */
  id: string;
  /** Audio blob containing the recording */
  audioBlob: Blob;
  /** Audio URL for playback */
  audioUrl: string;
  /** Duration in seconds */
  duration: number;
  /** Waveform data for visualization (0-1 normalized values) */
  waveform: number[];
  /** File size in bytes */
  fileSize: number;
  /** MIME type of the audio */
  mimeType: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Optional speech-to-text transcription */
  transcription?: string;
  /** Transcription confidence (0-1) */
  transcriptionConfidence?: number;
  /** Sender information */
  sender?: {
    id: string;
    name: string;
  };
  /** Room/channel ID */
  roomId?: string;
}

/**
 * Recording state enum
 */
export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';

/**
 * Audio quality presets
 */
export type AudioQuality = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Recording configuration options
 */
export interface RecordingConfig {
  /** Audio quality preset */
  quality: AudioQuality;
  /** Maximum recording duration in seconds */
  maxDuration: number;
  /** Enable noise reduction */
  noiseReduction: boolean;
  /** Enable automatic gain control */
  autoGainControl: boolean;
  /** Echo cancellation */
  echoCancellation: boolean;
  /** Generate waveform visualization */
  generateWaveform: boolean;
  /** Number of waveform samples */
  waveformSamples: number;
  /** Auto-transcribe after recording */
  autoTranscribe: boolean;
  /** Transcription language */
  transcriptionLanguage: string;
}

/**
 * Playback configuration
 */
export interface PlaybackConfig {
  /** Playback speed (0.5 - 2.0) */
  speed: number;
  /** Volume (0 - 1) */
  volume: number;
  /** Enable audio visualization during playback */
  visualize: boolean;
}

/**
 * Audio analysis result
 */
export interface AudioAnalysis {
  /** Peak amplitude */
  peakAmplitude: number;
  /** Average amplitude */
  averageAmplitude: number;
  /** Silence percentage */
  silencePercentage: number;
  /** Estimated speech clarity (0-1) */
  speechClarity: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Quality presets with bitrate settings
 */
const QUALITY_PRESETS: Record<AudioQuality, { bitrate: number; sampleRate: number }> = {
  low: { bitrate: 32000, sampleRate: 22050 },
  medium: { bitrate: 64000, sampleRate: 44100 },
  high: { bitrate: 128000, sampleRate: 48000 },
  ultra: { bitrate: 256000, sampleRate: 48000 },
};

/**
 * Default recording configuration
 */
const DEFAULT_RECORDING_CONFIG: RecordingConfig = {
  quality: 'medium',
  maxDuration: 120, // 2 minutes
  noiseReduction: true,
  autoGainControl: true,
  echoCancellation: true,
  generateWaveform: true,
  waveformSamples: 100,
  autoTranscribe: false,
  transcriptionLanguage: 'en-US',
};

/**
 * Default playback configuration
 */
const DEFAULT_PLAYBACK_CONFIG: PlaybackConfig = {
  speed: 1.0,
  volume: 1.0,
  visualize: true,
};

/**
 * Supported audio MIME types in order of preference
 */
const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
  'audio/wav',
];

/**
 * IndexedDB database name
 */
const DB_NAME = 'cube_voice_messages';
const DB_VERSION = 1;
const STORE_NAME = 'messages';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `vm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the best supported MIME type for recording
 */
function getBestMimeType(): string {
  for (const mimeType of SUPPORTED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return '';
}

/**
 * Format duration as mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size as human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// IndexedDB Service
// ============================================================================

/**
 * Voice message storage service using IndexedDB
 */
class VoiceMessageStorage {
  private db: IDBDatabase | null = null;

  /**
   * Initialize the database
   */
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
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('roomId', 'roomId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('senderId', 'sender.id', { unique: false });
        }
      };
    });
  }

  /**
   * Save a voice message to storage
   */
  async save(message: VoiceMessage): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Convert Blob to ArrayBuffer for storage
      const reader = new FileReader();
      reader.onload = () => {
        const storable = {
          ...message,
          audioData: reader.result,
          audioBlob: null,
          audioUrl: null,
        };
        
        const request = store.put(storable);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      };
      reader.readAsArrayBuffer(message.audioBlob);
    });
  }

  /**
   * Get a voice message by ID
   */
  async get(id: string): Promise<VoiceMessage | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (!request.result) {
          resolve(null);
          return;
        }
        
        const data = request.result;
        const blob = new Blob([data.audioData], { type: data.mimeType });
        const url = URL.createObjectURL(blob);
        
        resolve({
          ...data,
          audioBlob: blob,
          audioUrl: url,
          createdAt: new Date(data.createdAt),
        });
      };
    });
  }

  /**
   * Get all voice messages for a room
   */
  async getByRoom(roomId: string): Promise<VoiceMessage[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('roomId');
      const request = index.getAll(roomId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const messages = request.result.map((data: Record<string, unknown>) => {
          const blob = new Blob([data.audioData as ArrayBuffer], { type: data.mimeType as string });
          const url = URL.createObjectURL(blob);
          
          return {
            ...data,
            audioBlob: blob,
            audioUrl: url,
            createdAt: new Date(data.createdAt as string),
          } as VoiceMessage;
        });
        resolve(messages);
      };
    });
  }

  /**
   * Delete a voice message
   */
  async delete(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all voice messages
   */
  async clear(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// ============================================================================
// Voice Recorder Class
// ============================================================================

/**
 * Voice recorder with waveform generation and audio processing
 */
class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private waveformData: number[] = [];
  private waveformInterval: ReturnType<typeof setInterval> | null = null;
  private config: RecordingConfig;
  private onWaveformUpdate?: (waveform: number[]) => void;
  private onDurationUpdate?: (duration: number) => void;

  constructor(config: Partial<RecordingConfig> = {}) {
    this.config = { ...DEFAULT_RECORDING_CONFIG, ...config };
  }

  /**
   * Check if microphone permission is granted
   */
  async checkPermission(): Promise<PermissionState> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state;
    } catch {
      // Fallback for browsers that don't support permissions API
      return 'prompt';
    }
  }

  /**
   * Request microphone access
   */
  async requestAccess(): Promise<boolean> {
    try {
      const qualitySettings = QUALITY_PRESETS[this.config.quality];
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: qualitySettings.sampleRate,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseReduction,
          autoGainControl: this.config.autoGainControl,
        },
      });
      
      return true;
    } catch (error) {
      log.error('Failed to get microphone access:', error);
      return false;
    }
  }

  /**
   * Set waveform update callback
   */
  setWaveformCallback(callback: (waveform: number[]) => void): void {
    this.onWaveformUpdate = callback;
  }

  /**
   * Set duration update callback
   */
  setDurationCallback(callback: (duration: number) => void): void {
    this.onDurationUpdate = callback;
  }

  /**
   * Start recording
   */
  async start(): Promise<void> {
    if (!this.stream) {
      const granted = await this.requestAccess();
      if (!granted) {
        throw new Error('Microphone access denied');
      }
    }

    this.chunks = [];
    this.waveformData = [];
    this.startTime = Date.now();

    // Set up audio analysis
    if (this.config.generateWaveform) {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      const source = this.audioContext.createMediaStreamSource(this.stream!);
      source.connect(this.analyser);
      
      // Start waveform sampling
      this.startWaveformSampling();
    }

    // Create media recorder
    const mimeType = getBestMimeType();
    if (!mimeType) {
      throw new Error('No supported audio format found');
    }

    const qualitySettings = QUALITY_PRESETS[this.config.quality];
    
    this.mediaRecorder = new MediaRecorder(this.stream!, {
      mimeType,
      audioBitsPerSecond: qualitySettings.bitrate,
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    // Start recording with timeslice for progressive data
    this.mediaRecorder.start(100);

    // Set up max duration limit
    setTimeout(() => {
      if (this.mediaRecorder?.state === 'recording') {
        this.stop();
      }
    }, this.config.maxDuration * 1000);
  }

  /**
   * Start waveform sampling at regular intervals
   */
  private startWaveformSampling(): void {
    const sampleInterval = (this.config.maxDuration * 1000) / this.config.waveformSamples;
    
    this.waveformInterval = setInterval(() => {
      if (!this.analyser) return;
      
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);
      
      // Calculate average amplitude
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalized = average / 255;
      
      this.waveformData.push(normalized);
      
      if (this.onWaveformUpdate) {
        this.onWaveformUpdate([...this.waveformData]);
      }
      
      if (this.onDurationUpdate) {
        const duration = (Date.now() - this.startTime) / 1000;
        this.onDurationUpdate(duration);
      }
    }, sampleInterval);
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
      if (this.waveformInterval) {
        clearInterval(this.waveformInterval);
        this.waveformInterval = null;
      }
    }
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
      if (this.config.generateWaveform) {
        this.startWaveformSampling();
      }
    }
  }

  /**
   * Stop recording and return the voice message
   */
  async stop(): Promise<VoiceMessage> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      // Clear waveform interval
      if (this.waveformInterval) {
        clearInterval(this.waveformInterval);
        this.waveformInterval = null;
      }

      this.mediaRecorder.onstop = () => {
        const duration = (Date.now() - this.startTime) / 1000;
        const mimeType = this.mediaRecorder!.mimeType;
        const audioBlob = new Blob(this.chunks, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Normalize waveform to exactly the configured number of samples
        const normalizedWaveform = this.normalizeWaveform(
          this.waveformData,
          this.config.waveformSamples
        );

        const voiceMessage: VoiceMessage = {
          id: generateId(),
          audioBlob,
          audioUrl,
          duration,
          waveform: normalizedWaveform,
          fileSize: audioBlob.size,
          mimeType,
          createdAt: new Date(),
        };

        // Clean up
        this.cleanup();

        resolve(voiceMessage);
      };

      this.mediaRecorder.onerror = (event) => {
        this.cleanup();
        reject(new Error(`Recording error: ${event}`));
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    });
  }

  /**
   * Cancel recording without saving
   */
  cancel(): void {
    if (this.waveformInterval) {
      clearInterval(this.waveformInterval);
      this.waveformInterval = null;
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    this.cleanup();
  }

  /**
   * Get current recording duration
   */
  getDuration(): number {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState {
    if (!this.mediaRecorder) return 'idle';
    
    switch (this.mediaRecorder.state) {
      case 'recording':
        return 'recording';
      case 'paused':
        return 'paused';
      default:
        return 'idle';
    }
  }

  /**
   * Normalize waveform to specified number of samples
   */
  private normalizeWaveform(data: number[], targetSamples: number): number[] {
    if (data.length === 0) return new Array(targetSamples).fill(0);
    if (data.length === targetSamples) return data;

    const result: number[] = [];
    const step = data.length / targetSamples;

    for (let i = 0; i < targetSamples; i++) {
      const start = Math.floor(i * step);
      const end = Math.floor((i + 1) * step);
      const slice = data.slice(start, end);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length || 0;
      result.push(avg);
    }

    return result;
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
    }
    
    this.mediaRecorder = null;
    this.chunks = [];
  }
}

// ============================================================================
// Voice Player Class
// ============================================================================

/**
 * Voice message player with visualization
 */
class VoicePlayer {
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private config: PlaybackConfig;
  private onProgressUpdate?: (progress: number, currentTime: number) => void;
  private onVisualizationUpdate?: (data: number[]) => void;
  private onEnded?: () => void;
  private animationFrame: number | null = null;

  constructor(config: Partial<PlaybackConfig> = {}) {
    this.config = { ...DEFAULT_PLAYBACK_CONFIG, ...config };
  }

  /**
   * Set progress update callback
   */
  setProgressCallback(callback: (progress: number, currentTime: number) => void): void {
    this.onProgressUpdate = callback;
  }

  /**
   * Set visualization update callback
   */
  setVisualizationCallback(callback: (data: number[]) => void): void {
    this.onVisualizationUpdate = callback;
  }

  /**
   * Set ended callback
   */
  setEndedCallback(callback: () => void): void {
    this.onEnded = callback;
  }

  /**
   * Load and prepare a voice message for playback
   */
  async load(message: VoiceMessage): Promise<void> {
    this.cleanup();

    this.audioElement = new Audio(message.audioUrl);
    this.audioElement.playbackRate = this.config.speed;
    this.audioElement.volume = this.config.volume;

    // Set up audio context for visualization
    if (this.config.visualize) {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaElementSource(this.audioElement);
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.config.volume;
      
      source.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
    }

    // Set up event listeners
    this.audioElement.ontimeupdate = () => {
      if (this.audioElement && this.onProgressUpdate) {
        const progress = this.audioElement.currentTime / this.audioElement.duration;
        this.onProgressUpdate(progress, this.audioElement.currentTime);
      }
    };

    this.audioElement.onended = () => {
      this.stopVisualization();
      if (this.onEnded) {
        this.onEnded();
      }
    };

    // Wait for audio to be ready
    return new Promise((resolve, reject) => {
      this.audioElement!.oncanplaythrough = () => resolve();
      this.audioElement!.onerror = () => reject(new Error('Failed to load audio'));
    });
  }

  /**
   * Start playback
   */
  async play(): Promise<void> {
    if (!this.audioElement) {
      throw new Error('No audio loaded');
    }

    // Resume audio context if suspended (required by browsers)
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }

    await this.audioElement.play();
    
    if (this.config.visualize) {
      this.startVisualization();
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.stopVisualization();
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.stopVisualization();
    }
  }

  /**
   * Seek to position (0-1)
   */
  seek(position: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = position * this.audioElement.duration;
    }
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void {
    this.config.speed = Math.max(0.5, Math.min(2.0, speed));
    if (this.audioElement) {
      this.audioElement.playbackRate = this.config.speed;
    }
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = this.config.volume;
    }
    if (this.gainNode) {
      this.gainNode.gain.value = this.config.volume;
    }
  }

  /**
   * Get current playback state
   */
  getState(): 'playing' | 'paused' | 'stopped' {
    if (!this.audioElement) return 'stopped';
    if (this.audioElement.paused) return 'paused';
    return 'playing';
  }

  /**
   * Get current time
   */
  getCurrentTime(): number {
    return this.audioElement?.currentTime || 0;
  }

  /**
   * Get duration
   */
  getDuration(): number {
    return this.audioElement?.duration || 0;
  }

  /**
   * Start visualization animation loop
   */
  private startVisualization(): void {
    if (!this.analyser || !this.onVisualizationUpdate) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const animate = () => {
      if (!this.analyser) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      const normalizedData = Array.from(dataArray).map((v) => v / 255);
      this.onVisualizationUpdate!(normalizedData);
      
      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Stop visualization animation
   */
  private stopVisualization(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopVisualization();
    
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
      this.gainNode = null;
    }
  }
}

// ============================================================================
// Speech-to-Text Service
// ============================================================================

/**
 * Transcription service using Web Speech API
 */
class TranscriptionService {
  private recognition: SpeechRecognition | null = null;

  /**
   * Check if speech recognition is supported
   */
  isSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  /**
   * Transcribe audio from a voice message
   * Note: This uses the Web Speech API which requires real-time audio input.
   * For pre-recorded audio, we'd need a server-side solution.
   */
  async transcribe(
    message: VoiceMessage,
    language: string = 'en-US'
  ): Promise<{ text: string; confidence: number }> {
    if (!this.isSupported()) {
      throw new Error('Speech recognition not supported');
    }

    // For pre-recorded audio, we simulate by playing it back to the microphone
    // In production, use a server-side service like Google Speech-to-Text or Whisper
    
    return new Promise((resolve, reject) => {
      const windowWithSpeech = window as Window & typeof globalThis & {
        SpeechRecognition?: new () => SpeechRecognition;
        webkitSpeechRecognition?: new () => SpeechRecognition;
      };
      const SpeechRecognitionAPI = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
      
      if (!SpeechRecognitionAPI) {
        reject(new Error('Speech recognition not available'));
        return;
      }

      this.recognition = new SpeechRecognitionAPI();
      this.recognition.lang = language;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[0][0];
        resolve({
          text: result.transcript,
          confidence: result.confidence,
        });
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      // Pre-recorded audio transcription options:
      // 
      // 1. OpenAI Whisper API (recommended for accuracy):
      //    ```typescript
      //    const formData = new FormData();
      //    formData.append('file', audioBlob, 'audio.webm');
      //    formData.append('model', 'whisper-1');
      //    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      //      method: 'POST',
      //      headers: { 'Authorization': `Bearer ${apiKey}` },
      //      body: formData
      //    });
      //    const { text } = await response.json();
      //    ```
      //
      // 2. Local Whisper via Tauri backend:
      //    Call Rust command that runs whisper.cpp or faster-whisper
      //
      // 3. Google Cloud Speech-to-Text or AWS Transcribe
      //    for enterprise deployments
      //
      // For now, return placeholder indicating server processing is needed
      setTimeout(() => {
        resolve({
          text: '[Pre-recorded audio transcription requires Whisper API integration]',
          confidence: 0,
        });
      }, 100);
    });
  }

  /**
   * Start live transcription during recording
   */
  startLiveTranscription(
    language: string,
    onResult: (text: string, isFinal: boolean) => void
  ): void {
    if (!this.isSupported()) {
      throw new Error('Speech recognition not supported');
    }

    const windowWithSpeech = window as Window & typeof globalThis & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    const SpeechRecognitionAPI = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      throw new Error('Speech recognition not available');
    }

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.lang = language;
    this.recognition.interimResults = true;
    this.recognition.continuous = true;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1];
      onResult(lastResult[0].transcript, lastResult.isFinal);
    };

    this.recognition.start();
  }

  /**
   * Stop live transcription
   */
  stopLiveTranscription(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }
}

// ============================================================================
// Audio Analysis Service
// ============================================================================

/**
 * Analyze audio quality and characteristics
 */
async function analyzeAudio(message: VoiceMessage): Promise<AudioAnalysis> {
  const audioContext = new AudioContext();
  const arrayBuffer = await message.audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const channelData = audioBuffer.getChannelData(0);
  
  let peakAmplitude = 0;
  let sumAmplitude = 0;
  let silenceSamples = 0;
  const silenceThreshold = 0.01;
  
  for (let i = 0; i < channelData.length; i++) {
    const absValue = Math.abs(channelData[i]);
    peakAmplitude = Math.max(peakAmplitude, absValue);
    sumAmplitude += absValue;
    
    if (absValue < silenceThreshold) {
      silenceSamples++;
    }
  }
  
  const averageAmplitude = sumAmplitude / channelData.length;
  const silencePercentage = (silenceSamples / channelData.length) * 100;
  
  // Estimate speech clarity based on amplitude variation and silence
  const speechClarity = Math.min(1, Math.max(0, 
    (1 - silencePercentage / 100) * 0.5 + 
    (averageAmplitude / peakAmplitude) * 0.5
  ));
  
  audioContext.close();
  
  return {
    peakAmplitude,
    averageAmplitude,
    silencePercentage,
    speechClarity,
  };
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for voice message functionality
 */
export function useVoiceMessage(config: Partial<RecordingConfig> = {}) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState<number>(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [currentMessage, setCurrentMessage] = useState<VoiceMessage | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [visualizationData, setVisualizationData] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const playerRef = useRef<VoicePlayer | null>(null);
  const storageRef = useRef<VoiceMessageStorage | null>(null);

  // Initialize services
  useEffect(() => {
    recorderRef.current = new VoiceRecorder(config);
    playerRef.current = new VoicePlayer();
    storageRef.current = new VoiceMessageStorage();
    
    storageRef.current.init().catch(console.error);

    return () => {
      recorderRef.current?.cancel();
      playerRef.current?.cleanup();
    };
  }, [config]);

  // Set up recorder callbacks
  useEffect(() => {
    if (recorderRef.current) {
      recorderRef.current.setWaveformCallback(setWaveform);
      recorderRef.current.setDurationCallback(setDuration);
    }
  }, []);

  // Set up player callbacks
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setProgressCallback((progress, time) => {
        setPlaybackProgress(progress);
        setPlaybackTime(time);
      });
      playerRef.current.setVisualizationCallback(setVisualizationData);
      playerRef.current.setEndedCallback(() => setIsPlaying(false));
    }
  }, []);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setWaveform([]);
      setDuration(0);
      
      await recorderRef.current?.start();
      setState('recording');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setState('idle');
    }
  }, []);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    recorderRef.current?.pause();
    setState('paused');
  }, []);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    recorderRef.current?.resume();
    setState('recording');
  }, []);

  /**
   * Stop recording and get the message
   */
  const stopRecording = useCallback(async (): Promise<VoiceMessage | null> => {
    try {
      setState('processing');
      const message = await recorderRef.current?.stop();
      
      if (message) {
        setCurrentMessage(message);
        // Auto-save to storage
        await storageRef.current?.save(message);
      }
      
      setState('idle');
      return message || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      setState('idle');
      return null;
    }
  }, []);

  /**
   * Cancel recording
   */
  const cancelRecording = useCallback(() => {
    recorderRef.current?.cancel();
    setState('idle');
    setWaveform([]);
    setDuration(0);
  }, []);

  /**
   * Play a voice message
   */
  const playMessage = useCallback(async (message: VoiceMessage) => {
    try {
      setError(null);
      await playerRef.current?.load(message);
      await playerRef.current?.play();
      setIsPlaying(true);
      setCurrentMessage(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play message');
      setIsPlaying(false);
    }
  }, []);

  /**
   * Pause playback
   */
  const pausePlayback = useCallback(() => {
    playerRef.current?.pause();
    setIsPlaying(false);
  }, []);

  /**
   * Resume playback
   */
  const resumePlayback = useCallback(async () => {
    await playerRef.current?.play();
    setIsPlaying(true);
  }, []);

  /**
   * Stop playback
   */
  const stopPlayback = useCallback(() => {
    playerRef.current?.stop();
    setIsPlaying(false);
    setPlaybackProgress(0);
    setPlaybackTime(0);
  }, []);

  /**
   * Seek playback position
   */
  const seekPlayback = useCallback((position: number) => {
    playerRef.current?.seek(position);
  }, []);

  /**
   * Set playback speed
   */
  const setPlaybackSpeed = useCallback((speed: number) => {
    playerRef.current?.setSpeed(speed);
  }, []);

  /**
   * Set volume
   */
  const setVolume = useCallback((volume: number) => {
    playerRef.current?.setVolume(volume);
  }, []);

  /**
   * Delete a voice message
   */
  const deleteMessage = useCallback(async (id: string) => {
    await storageRef.current?.delete(id);
    if (currentMessage?.id === id) {
      setCurrentMessage(null);
      stopPlayback();
    }
  }, [currentMessage, stopPlayback]);

  /**
   * Get all messages for a room
   */
  const getMessages = useCallback(async (roomId: string): Promise<VoiceMessage[]> => {
    return (await storageRef.current?.getByRoom(roomId)) || [];
  }, []);

  return {
    // State
    state,
    duration,
    waveform,
    currentMessage,
    isPlaying,
    playbackProgress,
    playbackTime,
    visualizationData,
    error,
    
    // Recording controls
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    
    // Playback controls
    playMessage,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    seekPlayback,
    setPlaybackSpeed,
    setVolume,
    
    // Storage
    deleteMessage,
    getMessages,
  };
}

// ============================================================================
// Export Services
// ============================================================================

export {
  VoiceRecorder,
  VoicePlayer,
  VoiceMessageStorage,
  TranscriptionService,
  analyzeAudio,
  DEFAULT_RECORDING_CONFIG,
  DEFAULT_PLAYBACK_CONFIG,
  QUALITY_PRESETS,
};
