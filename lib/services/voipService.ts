/**
 * VoIP Service - WebRTC Audio/Video Communication with TURN/STUN Support
 * CUBE Elite v6 - Production-Ready Implementation
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 * 
 * This service provides a complete TypeScript interface for the Tauri VoIP backend,
 * supporting TURN servers from multiple providers (Twilio, Xirsys, Metered, coturn).
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('VoIP');

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * ICE Server configuration with optional TURN credentials
 */
export interface IceServerConfig {
  /** Server URLs (stun:host:port or turn:host:port) */
  urls: string[];
  /** Username for TURN authentication (optional for STUN) */
  username?: string;
  /** Credential/password for TURN authentication */
  credential?: string;
  /** Credential type (password or oauth) */
  credential_type?: string;
}

/**
 * ICE Transport Policy - controls which ICE candidates to use
 */
export type IceTransportPolicy = 'All' | 'Relay';

/**
 * Bundle Policy for media streams
 */
export type BundlePolicy = 'MaxBundle' | 'Balanced' | 'MaxCompat';

/**
 * Audio codec options
 */
export type AudioCodec = 'Opus' | 'PCMU' | 'PCMA';

/**
 * Video codec options
 */
export type VideoCodec = 'VP8' | 'VP9' | 'H264' | 'AV1';

/**
 * TURN provider types
 */
export type TurnProviderType = 
  | 'google_stun' 
  | 'twilio' 
  | 'xirsys' 
  | 'coturn' 
  | 'metered' 
  | 'custom';

/**
 * TURN provider configuration for frontend
 */
export interface TurnProviderConfig {
  /** Provider type */
  provider_type: TurnProviderType;
  /** Twilio credentials */
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  /** Xirsys credentials */
  xirsys_ident?: string;
  xirsys_secret?: string;
  xirsys_channel?: string;
  /** Coturn (self-hosted) credentials */
  coturn_host?: string;
  coturn_port?: number;
  coturn_username?: string;
  coturn_password?: string;
  /** Metered.ca credentials */
  metered_api_key?: string;
  /** Custom server configuration */
  custom_servers?: IceServerConfig[];
}

/**
 * Full VoIP configuration
 */
export interface VoIPConfig {
  /** ICE servers configuration */
  ice_servers: IceServerConfig[];
  /** TURN provider preset (alternative to manual ice_servers) */
  turn_provider?: TurnProviderType;
  /** Enable audio track */
  enable_audio: boolean;
  /** Enable video track */
  enable_video: boolean;
  /** Audio codec preference */
  audio_codec: AudioCodec;
  /** Video codec preference */
  video_codec: VideoCodec;
  /** ICE transport policy */
  ice_transport_policy: IceTransportPolicy;
  /** Bundle policy */
  bundle_policy: BundlePolicy;
}

/**
 * Call statistics for quality monitoring
 */
export interface CallStats {
  /** Round-trip time in milliseconds */
  rtt_ms: number;
  /** Packet loss percentage */
  packet_loss: number;
  /** Jitter in milliseconds */
  jitter_ms: number;
  /** Audio bitrate in bps */
  audio_bitrate: number;
  /** Video bitrate in bps */
  video_bitrate: number;
  /** Bytes sent */
  bytes_sent: number;
  /** Bytes received */
  bytes_received: number;
}

/**
 * Current call state
 */
export interface CallState {
  /** Whether a call is active */
  is_active: boolean;
  /** Whether audio is muted */
  is_muted: boolean;
  /** Whether video is enabled */
  is_video_enabled: boolean;
  /** WebRTC connection state */
  connection_state: string;
  /** ICE connection state */
  ice_connection_state: string;
  /** ICE gathering state */
  ice_gathering_state: string;
  /** Remote peer ID if connected */
  remote_peer_id?: string;
  /** Gathered local ICE candidates */
  local_candidates: string[];
  /** Call statistics */
  stats: CallStats;
}

/**
 * SDP Session Description
 */
export interface SessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

/**
 * VoIP Contact for addressbook
 */
export interface VoIPContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  sipUri?: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  favorite: boolean;
  tags: string[];
}

/**
 * VoIP Call History Entry
 */
export interface VoIPCallHistoryEntry {
  id: string;
  contactId?: string;
  contactName: string;
  phone?: string;
  type: 'incoming' | 'outgoing' | 'missed';
  status: 'completed' | 'missed' | 'rejected' | 'failed';
  startTime: number;
  endTime?: number;
  duration: number;
  isVideo: boolean;
}

/**
 * VoIP Audio Device
 */
export interface VoIPAudioDevice {
  id: string;
  name: string;
  type: 'input' | 'output';
  isDefault: boolean;
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default VoIP configuration (Google STUN only)
 */
export const DEFAULT_VOIP_CONFIG: VoIPConfig = {
  ice_servers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
      ],
    },
  ],
  enable_audio: true,
  enable_video: false,
  audio_codec: 'Opus',
  video_codec: 'VP8',
  ice_transport_policy: 'All',
  bundle_policy: 'MaxBundle',
};

/**
 * Create Twilio provider config
 */
export function createTwilioConfig(accountSid: string, authToken: string): TurnProviderConfig {
  return {
    provider_type: 'twilio',
    twilio_account_sid: accountSid,
    twilio_auth_token: authToken,
  };
}

/**
 * Create Xirsys provider config
 */
export function createXirsysConfig(ident: string, secret: string, channel: string): TurnProviderConfig {
  return {
    provider_type: 'xirsys',
    xirsys_ident: ident,
    xirsys_secret: secret,
    xirsys_channel: channel,
  };
}

/**
 * Create Metered provider config
 */
export function createMeteredConfig(apiKey: string): TurnProviderConfig {
  return {
    provider_type: 'metered',
    metered_api_key: apiKey,
  };
}

/**
 * Create self-hosted coturn config
 */
export function createCoturnConfig(
  host: string, 
  port: number, 
  username: string, 
  password: string
): TurnProviderConfig {
  return {
    provider_type: 'coturn',
    coturn_host: host,
    coturn_port: port,
    coturn_username: username,
    coturn_password: password,
  };
}

/**
 * Create custom ICE servers config
 */
export function createCustomConfig(servers: IceServerConfig[]): TurnProviderConfig {
  return {
    provider_type: 'custom',
    custom_servers: servers,
  };
}

// ============================================================================
// VoIP Service Class
// ============================================================================

/**
 * VoIP Service - Main class for WebRTC communication
 * 
 * @example
 * ```typescript
 * const voip = new VoIPService();
 * 
 * // Initialize with default config (Google STUN)
 * await voip.initialize();
 * 
 * // Or initialize with Twilio TURN servers
 * await voip.initializeWithTwilio('account_sid', 'auth_token', true);
 * 
 * // Create an offer for outgoing call
 * const offer = await voip.createOffer();
 * 
 * // Send offer to remote peer via signaling server
 * // ...
 * 
 * // Receive answer from remote peer
 * await voip.setRemoteDescription(answer);
 * 
 * // Exchange ICE candidates
 * const candidates = await voip.getIceCandidates();
 * // Send candidates to remote peer
 * 
 * // Add remote ICE candidates received from peer
 * await voip.addIceCandidate(remoteCandidate);
 * 
 * // Control call
 * await voip.setMuted(true);
 * await voip.setVideoEnabled(false);
 * 
 * // Get call state and stats
 * const state = await voip.getCallState();
 * const stats = await voip.getCallStats();
 * 
 * // End call
 * await voip.close();
 * ```
 */
export class VoIPService {
  private initialized: boolean = false;

  /**
   * Initialize VoIP service with custom configuration
   */
  async initialize(config?: Partial<VoIPConfig>): Promise<string> {
    const fullConfig: VoIPConfig = {
      ...DEFAULT_VOIP_CONFIG,
      ...config,
    };

    const result = await invoke<string>('voip_initialize', { config: fullConfig });
    this.initialized = true;
    return result;
  }

  /**
   * Initialize with a TURN provider preset
   */
  async initializeWithProvider(
    providerConfig: TurnProviderConfig,
    enableAudio: boolean = true,
    enableVideo: boolean = false
  ): Promise<string> {
    const result = await invoke<string>('voip_initialize_with_provider', {
      providerConfig,
      enableAudio,
      enableVideo,
    });
    this.initialized = true;
    return result;
  }

  /**
   * Quick start with Twilio TURN servers
   */
  async initializeWithTwilio(
    accountSid: string,
    authToken: string,
    enableVideo: boolean = false
  ): Promise<string> {
    const result = await invoke<string>('voip_quick_start_twilio', {
      accountSid,
      authToken,
      enableVideo,
    });
    this.initialized = true;
    return result;
  }

  /**
   * Quick start with Metered TURN servers (free tier available)
   */
  async initializeWithMetered(apiKey: string, enableVideo: boolean = false): Promise<string> {
    const result = await invoke<string>('voip_quick_start_metered', {
      apiKey,
      enableVideo,
    });
    this.initialized = true;
    return result;
  }

  /**
   * Quick start with default config (Google STUN only)
   */
  async quickStart(enableVideo: boolean = false): Promise<string> {
    const result = await invoke<string>('voip_quick_start', { enableVideo });
    this.initialized = true;
    return result;
  }

  /**
   * Create SDP offer for outgoing call
   */
  async createOffer(): Promise<SessionDescription> {
    this.ensureInitialized();
    const offerJson = await invoke<string>('voip_create_offer');
    return JSON.parse(offerJson);
  }

  /**
   * Create SDP answer for incoming call
   */
  async createAnswer(): Promise<SessionDescription> {
    this.ensureInitialized();
    const answerJson = await invoke<string>('voip_create_answer');
    return JSON.parse(answerJson);
  }

  /**
   * Set remote SDP description
   */
  async setRemoteDescription(sdp: SessionDescription): Promise<string> {
    this.ensureInitialized();
    const sdpJson = JSON.stringify(sdp);
    return invoke<string>('voip_set_remote_description', { sdpJson });
  }

  /**
   * Add a remote ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit | string): Promise<string> {
    this.ensureInitialized();
    const candidateJson = typeof candidate === 'string' 
      ? candidate 
      : JSON.stringify(candidate);
    return invoke<string>('voip_add_ice_candidate', { candidateJson });
  }

  /**
   * Get local ICE candidates
   */
  async getIceCandidates(): Promise<string[]> {
    this.ensureInitialized();
    return invoke<string[]>('voip_get_ice_candidates');
  }

  /**
   * Clear ICE candidates (for new call)
   */
  async clearCandidates(): Promise<string> {
    this.ensureInitialized();
    return invoke<string>('voip_clear_candidates');
  }

  /**
   * Set audio muted state
   */
  async setMuted(muted: boolean): Promise<string> {
    this.ensureInitialized();
    return invoke<string>('voip_set_audio_muted', { muted });
  }

  /**
   * Set video enabled state
   */
  async setVideoEnabled(enabled: boolean): Promise<string> {
    this.ensureInitialized();
    return invoke<string>('voip_set_video_enabled', { enabled });
  }

  /**
   * Get current call state
   */
  async getCallState(): Promise<CallState> {
    this.ensureInitialized();
    return invoke<CallState>('voip_get_call_state');
  }

  /**
   * Get connection statistics (raw)
   */
  async getStats(): Promise<string> {
    this.ensureInitialized();
    return invoke<string>('voip_get_stats');
  }

  /**
   * Get call quality statistics
   */
  async getCallStats(): Promise<CallStats> {
    this.ensureInitialized();
    return invoke<CallStats>('voip_get_call_stats');
  }

  /**
   * Check if TURN servers are configured
   */
  async hasTurnServers(): Promise<boolean> {
    this.ensureInitialized();
    return invoke<boolean>('voip_has_turn_servers');
  }

  /**
   * Close the VoIP connection
   */
  async close(): Promise<string> {
    if (!this.initialized) {
      return 'VoIP service not initialized';
    }
    const result = await invoke<string>('voip_close');
    this.initialized = false;
    return result;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Ensure service is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('VoIP service not initialized. Call initialize() first.');
    }
  }

  // ==========================================================================
  // Contact Management
  // ==========================================================================

  /**
   * Get VoIP contacts from backend
   */
  async getContacts(): Promise<VoIPContact[]> {
    try {
      const contacts = await invoke<VoIPContact[]>('voip_get_contacts');
      return contacts;
    } catch (error) {
      log.error('Failed to get VoIP contacts:', error);
      return [];
    }
  }

  /**
   * Add a new contact
   */
  async addContact(contact: Omit<VoIPContact, 'id'>): Promise<VoIPContact> {
    try {
      const contactWithId = {
        ...contact,
        id: '', // Backend will generate ID
      };
      const newContact = await invoke<VoIPContact>('voip_add_contact', { contact: contactWithId });
      return newContact;
    } catch (error) {
      throw new Error(`Failed to add contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(contactId: string): Promise<void> {
    try {
      await invoke('voip_delete_contact', { contactId });
    } catch (error) {
      throw new Error(`Failed to delete contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing contact
   */
  async updateContact(contact: VoIPContact): Promise<VoIPContact> {
    try {
      const updatedContact = await invoke<VoIPContact>('voip_update_contact', { contact });
      return updatedContact;
    } catch (error) {
      throw new Error(`Failed to update contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==========================================================================
  // Call History
  // ==========================================================================

  /**
   * Get call history from backend
   */
  async getCallHistory(limit: number = 50): Promise<VoIPCallHistoryEntry[]> {
    try {
      const history = await invoke<VoIPCallHistoryEntry[]>('voip_get_call_history', { limit });
      return history;
    } catch (error) {
      log.error('Failed to get call history:', error);
      return [];
    }
  }

  /**
   * Add call to history
   */
  async addCallHistory(entry: Omit<VoIPCallHistoryEntry, 'id'>): Promise<VoIPCallHistoryEntry> {
    try {
      const entryWithId = {
        ...entry,
        id: '', // Backend will generate ID
      };
      const newEntry = await invoke<VoIPCallHistoryEntry>('voip_add_call_history', { entry: entryWithId });
      return newEntry;
    } catch (error) {
      throw new Error(`Failed to add call history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear call history
   */
  async clearCallHistory(): Promise<void> {
    try {
      await invoke('voip_clear_call_history');
    } catch (error) {
      throw new Error(`Failed to clear call history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete specific call history entry
   */
  async deleteCallHistoryEntry(entryId: string): Promise<void> {
    try {
      await invoke('voip_delete_call_history_entry', { entryId });
    } catch (error) {
      throw new Error(`Failed to delete call history entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==========================================================================
  // Audio Device Management
  // ==========================================================================

  /**
   * Get available audio devices from backend
   */
  async getAudioDevices(): Promise<VoIPAudioDevice[]> {
    try {
      const devices = await invoke<VoIPAudioDevice[]>('voip_get_audio_devices');
      return devices;
    } catch (error) {
      log.error('Failed to get audio devices:', error);
      return [];
    }
  }

  /**
   * Set active input device
   */
  async setInputDevice(deviceId: string): Promise<void> {
    try {
      await invoke('voip_set_input_device', { deviceId });
    } catch (error) {
      throw new Error(`Failed to set input device: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set active output device
   */
  async setOutputDevice(deviceId: string): Promise<void> {
    try {
      await invoke('voip_set_output_device', { deviceId });
    } catch (error) {
      throw new Error(`Failed to set output device: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current input device
   */
  async getInputDevice(): Promise<string | null> {
    try {
      const deviceId = await invoke<string | null>('voip_get_input_device');
      return deviceId;
    } catch (error) {
      log.error('Failed to get input device:', error);
      return null;
    }
  }

  /**
   * Get current output device
   */
  async getOutputDevice(): Promise<string | null> {
    try {
      const deviceId = await invoke<string | null>('voip_get_output_device');
      return deviceId;
    } catch (error) {
      log.error('Failed to get output device:', error);
      return null;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/** Global VoIP service instance */
export const voipService = new VoIPService();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse SDP to extract media information
 */
export function parseSdpMediaInfo(sdp: string): {
  hasAudio: boolean;
  hasVideo: boolean;
  audioCodecs: string[];
  videoCodecs: string[];
} {
  const lines = sdp.split('\n');
  const result = {
    hasAudio: false,
    hasVideo: false,
    audioCodecs: [] as string[],
    videoCodecs: [] as string[],
  };

  let currentMedia = '';

  for (const line of lines) {
    if (line.startsWith('m=audio')) {
      result.hasAudio = true;
      currentMedia = 'audio';
    } else if (line.startsWith('m=video')) {
      result.hasVideo = true;
      currentMedia = 'video';
    } else if (line.startsWith('a=rtpmap:')) {
      const match = line.match(/a=rtpmap:\d+ ([^/]+)/);
      if (match) {
        const codec = match[1];
        if (currentMedia === 'audio') {
          result.audioCodecs.push(codec);
        } else if (currentMedia === 'video') {
          result.videoCodecs.push(codec);
        }
      }
    }
  }

  return result;
}

/**
 * Format call duration
 */
export function formatCallDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get connection quality description
 */
export function getConnectionQuality(stats: CallStats): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
} {
  const { rtt_ms, packet_loss, jitter_ms } = stats;

  if (rtt_ms < 100 && packet_loss < 1 && jitter_ms < 30) {
    return { quality: 'excellent', description: 'Excellent connection quality' };
  }
  if (rtt_ms < 200 && packet_loss < 3 && jitter_ms < 50) {
    return { quality: 'good', description: 'Good connection quality' };
  }
  if (rtt_ms < 400 && packet_loss < 5 && jitter_ms < 100) {
    return { quality: 'fair', description: 'Fair connection - some issues possible' };
  }
  return { quality: 'poor', description: 'Poor connection - expect issues' };
}

/**
 * Check if WebRTC is supported in this environment
 */
export function isWebRTCSupported(): boolean {
  return typeof window !== 'undefined' && 
    'RTCPeerConnection' in window &&
    'RTCSessionDescription' in window &&
    'RTCIceCandidate' in window;
}

export default voipService;
