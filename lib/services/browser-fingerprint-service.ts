/**
 * Browser Fingerprint Service - Anti-Detection & Privacy Protection
 *
 * Provides advanced browser fingerprint management to prevent detection
 * during web automation and ensure privacy.
 *
 * M5 Features:
 * - Browser fingerprint randomization
 * - Canvas/WebGL fingerprint spoofing
 * - User-agent management
 * - Timezone/Language spoofing
 * - Plugin detection bypass
 * - Screen resolution spoofing
 * - Hardware concurrency spoofing
 * - WebRTC leak prevention
 *
 * @module BrowserFingerprintService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService, SpanKind } from './telemetry-service';

// ============================================================================
// Types
// ============================================================================

export interface BrowserFingerprint {
  /**
   * Profile ID
   */
  id: string;

  /**
   * Profile name
   */
  name: string;

  /**
   * User agent string
   */
  userAgent: UserAgentConfig;

  /**
   * Screen configuration
   */
  screen: ScreenConfig;

  /**
   * WebGL configuration
   */
  webgl: WebGLConfig;

  /**
   * Canvas configuration
   */
  canvas: CanvasConfig;

  /**
   * Audio context configuration
   */
  audio: AudioConfig;

  /**
   * Navigator configuration
   */
  navigator: NavigatorConfig;

  /**
   * Timezone configuration
   */
  timezone: TimezoneConfig;

  /**
   * Geolocation configuration
   */
  geolocation: GeolocationConfig;

  /**
   * WebRTC configuration
   */
  webrtc: WebRTCConfig;

  /**
   * Font configuration
   */
  fonts: FontConfig;

  /**
   * Plugin configuration
   */
  plugins: PluginConfig;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last update timestamp
   */
  updatedAt: number;

  /**
   * Is profile active
   */
  isActive: boolean;

  /**
   * Notes
   */
  notes?: string;
}

export interface UserAgentConfig {
  /**
   * Full user agent string
   */
  userAgent: string;

  /**
   * Browser brand
   */
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera';

  /**
   * Browser version
   */
  browserVersion: string;

  /**
   * Operating system
   */
  os: 'windows' | 'macos' | 'linux' | 'android' | 'ios';

  /**
   * OS version
   */
  osVersion: string;

  /**
   * Platform
   */
  platform: string;

  /**
   * Device type
   */
  deviceType: 'desktop' | 'mobile' | 'tablet';

  /**
   * Mobile device model (if mobile)
   */
  mobileModel?: string;

  /**
   * Accept-Language header
   */
  acceptLanguage: string;

  /**
   * Client hints
   */
  clientHints: ClientHints;
}

export interface ClientHints {
  brands: { brand: string; version: string }[];
  mobile: boolean;
  platform: string;
  platformVersion: string;
  architecture: string;
  bitness: string;
  model?: string;
}

export interface ScreenConfig {
  /**
   * Screen width
   */
  width: number;

  /**
   * Screen height
   */
  height: number;

  /**
   * Available width
   */
  availWidth: number;

  /**
   * Available height
   */
  availHeight: number;

  /**
   * Color depth
   */
  colorDepth: number;

  /**
   * Pixel depth
   */
  pixelDepth: number;

  /**
   * Device pixel ratio
   */
  devicePixelRatio: number;

  /**
   * Screen orientation
   */
  orientation: 'portrait' | 'landscape';

  /**
   * Touch support
   */
  touchSupport: {
    maxTouchPoints: number;
    touchEvent: boolean;
    touchStart: boolean;
  };
}

export interface WebGLConfig {
  /**
   * Enable WebGL spoofing
   */
  enabled: boolean;

  /**
   * WebGL vendor
   */
  vendor: string;

  /**
   * WebGL renderer
   */
  renderer: string;

  /**
   * Unmasked vendor
   */
  unmaskedVendor: string;

  /**
   * Unmasked renderer
   */
  unmaskedRenderer: string;

  /**
   * WebGL version
   */
  version: string;

  /**
   * Shading language version
   */
  shadingLanguageVersion: string;

  /**
   * Extensions
   */
  extensions: string[];

  /**
   * Parameters
   */
  parameters: Record<string, number | string>;

  /**
   * Add noise to WebGL data
   */
  addNoise: boolean;
}

export interface CanvasConfig {
  /**
   * Enable canvas spoofing
   */
  enabled: boolean;

  /**
   * Noise type
   */
  noiseType: 'none' | 'uniform' | 'gaussian';

  /**
   * Noise level (0-1)
   */
  noiseLevel: number;

  /**
   * Random seed for consistent noise
   */
  seed?: number;
}

export interface AudioConfig {
  /**
   * Enable audio fingerprint spoofing
   */
  enabled: boolean;

  /**
   * Noise level for AudioContext
   */
  noiseLevel: number;

  /**
   * Sample rate
   */
  sampleRate: number;

  /**
   * Channel count
   */
  channelCount: number;
}

export interface NavigatorConfig {
  /**
   * Hardware concurrency (CPU cores)
   */
  hardwareConcurrency: number;

  /**
   * Device memory (GB)
   */
  deviceMemory: number;

  /**
   * Languages
   */
  languages: string[];

  /**
   * Do Not Track
   */
  doNotTrack: '1' | '0' | null;

  /**
   * Cookies enabled
   */
  cookieEnabled: boolean;

  /**
   * PDF viewer enabled
   */
  pdfViewerEnabled: boolean;

  /**
   * Max touch points
   */
  maxTouchPoints: number;

  /**
   * Connection type
   */
  connection?: {
    effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
    rtt: number;
    downlink: number;
    saveData: boolean;
  };

  /**
   * Battery spoofing
   */
  battery?: {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
  };
}

export interface TimezoneConfig {
  /**
   * Timezone name (e.g., 'America/New_York')
   */
  timezone: string;

  /**
   * UTC offset in minutes
   */
  utcOffset: number;

  /**
   * Locale string
   */
  locale: string;

  /**
   * Date format
   */
  dateFormat: string;
}

export interface GeolocationConfig {
  /**
   * Enable geolocation spoofing
   */
  enabled: boolean;

  /**
   * Latitude
   */
  latitude: number;

  /**
   * Longitude
   */
  longitude: number;

  /**
   * Accuracy in meters
   */
  accuracy: number;

  /**
   * Altitude (optional)
   */
  altitude?: number;

  /**
   * Altitude accuracy
   */
  altitudeAccuracy?: number;

  /**
   * Block geolocation requests
   */
  blockRequests: boolean;
}

export interface WebRTCConfig {
  /**
   * WebRTC mode
   */
  mode: 'real' | 'public-only' | 'disabled' | 'fake';

  /**
   * Public IP to expose (if fake)
   */
  publicIP?: string;

  /**
   * Local IPs handling
   */
  localIPHandling: 'default' | 'default-public-and-private-interfaces' | 'default-public-interface-only' | 'disable-non-proxied-udp';

  /**
   * Block media devices
   */
  blockMediaDevices: boolean;
}

export interface FontConfig {
  /**
   * Enable font spoofing
   */
  enabled: boolean;

  /**
   * Fonts to report as installed
   */
  fonts: string[];

  /**
   * Use system fonts
   */
  useSystemFonts: boolean;

  /**
   * Add common fonts
   */
  addCommonFonts: boolean;
}

export interface PluginConfig {
  /**
   * Enable plugin spoofing
   */
  enabled: boolean;

  /**
   * Plugins to report
   */
  plugins: BrowserPlugin[];

  /**
   * MIME types
   */
  mimeTypes: BrowserMimeType[];
}

export interface BrowserPlugin {
  name: string;
  filename: string;
  description: string;
}

export interface BrowserMimeType {
  type: string;
  suffixes: string;
  description: string;
  plugin: string;
}

export interface FingerprintPreset {
  id: string;
  name: string;
  description: string;
  category: 'desktop' | 'mobile' | 'tablet';
  popularity: number;
  fingerprint: Partial<BrowserFingerprint>;
}

export interface FingerprintValidationResult {
  isValid: boolean;
  score: number;
  issues: FingerprintIssue[];
  suggestions: string[];
}

export interface FingerprintIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  suggestion?: string;
}

// ============================================================================
// Browser Fingerprint Service
// ============================================================================

export const BrowserFingerprintService = {
  /**
   * Create a new fingerprint profile
   */
  createProfile: async (
    name: string,
    config?: Partial<BrowserFingerprint>
  ): Promise<BrowserFingerprint> => {
    TelemetryService.trackEvent('fingerprint_profile_created');

    return invoke<BrowserFingerprint>('browser_create_fingerprint_profile', {
      name,
      config,
    });
  },

  /**
   * Generate a random fingerprint
   */
  generateRandom: async (options?: {
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
    os?: string;
    locale?: string;
  }): Promise<BrowserFingerprint> => {
    return invoke<BrowserFingerprint>('browser_generate_random_fingerprint', {
      options,
    });
  },

  /**
   * Get all fingerprint profiles
   */
  getProfiles: async (): Promise<BrowserFingerprint[]> => {
    return invoke<BrowserFingerprint[]>('browser_get_fingerprint_profiles');
  },

  /**
   * Get fingerprint profile by ID
   */
  getProfile: async (profileId: string): Promise<BrowserFingerprint | null> => {
    return invoke<BrowserFingerprint | null>('browser_get_fingerprint_profile', {
      profileId,
    });
  },

  /**
   * Update fingerprint profile
   */
  updateProfile: async (
    profileId: string,
    updates: Partial<BrowserFingerprint>
  ): Promise<BrowserFingerprint> => {
    return invoke<BrowserFingerprint>('browser_update_fingerprint_profile', {
      profileId,
      updates,
    });
  },

  /**
   * Delete fingerprint profile
   */
  deleteProfile: async (profileId: string): Promise<void> => {
    return invoke('browser_delete_fingerprint_profile', { profileId });
  },

  /**
   * Apply fingerprint to browser session
   */
  applyProfile: async (
    profileId: string,
    sessionId?: string
  ): Promise<void> => {
    const spanId = TelemetryService.startSpan('fingerprint.apply', {
      kind: SpanKind.CLIENT,
    });

    try {
      await invoke('browser_apply_fingerprint_profile', {
        profileId,
        sessionId,
      });
      TelemetryService.trackEvent('fingerprint_applied', { profileId });
      TelemetryService.endSpan(spanId);
    } catch (error) {
      TelemetryService.endSpan(spanId, { code: 2, message: String(error) });
      throw error;
    }
  },

  /**
   * Get available presets
   */
  getPresets: async (category?: string): Promise<FingerprintPreset[]> => {
    return invoke<FingerprintPreset[]>('browser_get_fingerprint_presets', {
      category,
    });
  },

  /**
   * Create profile from preset
   */
  createFromPreset: async (
    presetId: string,
    name: string
  ): Promise<BrowserFingerprint> => {
    return invoke<BrowserFingerprint>('browser_create_from_preset', {
      presetId,
      name,
    });
  },

  /**
   * Validate fingerprint consistency
   */
  validateProfile: async (
    profile: BrowserFingerprint
  ): Promise<FingerprintValidationResult> => {
    return invoke<FingerprintValidationResult>(
      'browser_validate_fingerprint_profile',
      { profile }
    );
  },

  /**
   * Generate consistent user agent
   */
  generateUserAgent: async (options: {
    browser?: string;
    os?: string;
    deviceType?: string;
  }): Promise<UserAgentConfig> => {
    return invoke<UserAgentConfig>('browser_generate_user_agent', { options });
  },

  /**
   * Get matching screen configuration
   */
  getScreenConfig: async (
    deviceType: string,
    resolution?: string
  ): Promise<ScreenConfig> => {
    return invoke<ScreenConfig>('browser_get_screen_config', {
      deviceType,
      resolution,
    });
  },

  /**
   * Generate WebGL configuration
   */
  generateWebGLConfig: async (gpu?: string): Promise<WebGLConfig> => {
    return invoke<WebGLConfig>('browser_generate_webgl_config', { gpu });
  },

  /**
   * Get timezone configuration
   */
  getTimezoneConfig: async (
    timezone: string
  ): Promise<TimezoneConfig> => {
    return invoke<TimezoneConfig>('browser_get_timezone_config', { timezone });
  },

  /**
   * Export profile
   */
  exportProfile: async (profileId: string): Promise<string> => {
    return invoke<string>('browser_export_fingerprint_profile', { profileId });
  },

  /**
   * Import profile
   */
  importProfile: async (data: string): Promise<BrowserFingerprint> => {
    return invoke<BrowserFingerprint>('browser_import_fingerprint_profile', {
      data,
    });
  },

  /**
   * Clone profile
   */
  cloneProfile: async (
    profileId: string,
    name: string
  ): Promise<BrowserFingerprint> => {
    return invoke<BrowserFingerprint>('browser_clone_fingerprint_profile', {
      profileId,
      name,
    });
  },

  /**
   * Get current browser fingerprint
   */
  getCurrentFingerprint: async (): Promise<BrowserFingerprint> => {
    return invoke<BrowserFingerprint>('browser_get_current_fingerprint');
  },

  /**
   * Test fingerprint against detection services
   */
  testFingerprint: async (
    profileId: string
  ): Promise<FingerprintTestResult> => {
    return invoke<FingerprintTestResult>('browser_test_fingerprint', {
      profileId,
    });
  },
};

export interface FingerprintTestResult {
  score: number;
  detectionResults: {
    service: string;
    detected: boolean;
    details: string;
  }[];
  recommendations: string[];
}

// ============================================================================
// Session Replay Service
// ============================================================================

export interface SessionRecording {
  id: string;
  name: string;
  sessionId: string;
  url: string;
  startTime: number;
  endTime?: number;
  duration: number;
  events: SessionEvent[];
  metadata: SessionMetadata;
  status: 'recording' | 'completed' | 'error';
}

export interface SessionEvent {
  id: string;
  type: SessionEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

export type SessionEventType =
  | 'dom-snapshot'
  | 'dom-mutation'
  | 'mouse-move'
  | 'mouse-click'
  | 'mouse-scroll'
  | 'keyboard-input'
  | 'viewport-resize'
  | 'navigation'
  | 'network-request'
  | 'console-log'
  | 'custom';

export interface SessionMetadata {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  timezone: string;
  language: string;
  pageCount: number;
  eventCount: number;
}

export const SessionReplayService = {
  /**
   * Start recording a session
   */
  startRecording: async (
    sessionId: string,
    options?: {
      name?: string;
      captureNetwork?: boolean;
      captureConsole?: boolean;
      maskInputs?: boolean;
    }
  ): Promise<SessionRecording> => {
    TelemetryService.trackEvent('session_recording_started');

    return invoke<SessionRecording>('browser_start_session_recording', {
      sessionId,
      options,
    });
  },

  /**
   * Stop recording
   */
  stopRecording: async (recordingId: string): Promise<SessionRecording> => {
    TelemetryService.trackEvent('session_recording_stopped');

    return invoke<SessionRecording>('browser_stop_session_recording', {
      recordingId,
    });
  },

  /**
   * Get recording
   */
  getRecording: async (recordingId: string): Promise<SessionRecording | null> => {
    return invoke<SessionRecording | null>('browser_get_session_recording', {
      recordingId,
    });
  },

  /**
   * Get all recordings
   */
  getAllRecordings: async (): Promise<SessionRecording[]> => {
    return invoke<SessionRecording[]>('browser_get_all_session_recordings');
  },

  /**
   * Delete recording
   */
  deleteRecording: async (recordingId: string): Promise<void> => {
    return invoke('browser_delete_session_recording', { recordingId });
  },

  /**
   * Export recording
   */
  exportRecording: async (
    recordingId: string,
    format: 'json' | 'rrweb' | 'video'
  ): Promise<string | Blob> => {
    return invoke<string>('browser_export_session_recording', {
      recordingId,
      format,
    });
  },

  /**
   * Replay session
   */
  replaySession: async (
    recordingId: string,
    options?: {
      speed?: number;
      skipInactivity?: boolean;
    }
  ): Promise<void> => {
    return invoke('browser_replay_session', { recordingId, options });
  },

  /**
   * Add custom event to recording
   */
  addCustomEvent: async (
    recordingId: string,
    eventName: string,
    data: Record<string, unknown>
  ): Promise<void> => {
    return invoke('browser_add_custom_session_event', {
      recordingId,
      eventName,
      data,
    });
  },
};

// ============================================================================
// Network Throttling Service
// ============================================================================

export interface NetworkProfile {
  id: string;
  name: string;
  description?: string;
  downloadSpeed: number; // bytes per second
  uploadSpeed: number; // bytes per second
  latency: number; // milliseconds
  packetLoss: number; // percentage (0-100)
  isBuiltIn: boolean;
}

export interface NetworkConditions {
  offline: boolean;
  downloadThroughput: number;
  uploadThroughput: number;
  latency: number;
  packetLoss: number;
}

export const BUILT_IN_NETWORK_PROFILES: NetworkProfile[] = [
  {
    id: 'offline',
    name: 'Offline',
    description: 'No connection',
    downloadSpeed: 0,
    uploadSpeed: 0,
    latency: 0,
    packetLoss: 100,
    isBuiltIn: true,
  },
  {
    id: 'gprs',
    name: 'GPRS',
    description: '50 Kbps',
    downloadSpeed: 50 * 1024 / 8,
    uploadSpeed: 20 * 1024 / 8,
    latency: 500,
    packetLoss: 0,
    isBuiltIn: true,
  },
  {
    id: 'regular2g',
    name: 'Regular 2G',
    description: '250 Kbps',
    downloadSpeed: 250 * 1024 / 8,
    uploadSpeed: 50 * 1024 / 8,
    latency: 300,
    packetLoss: 0,
    isBuiltIn: true,
  },
  {
    id: 'good2g',
    name: 'Good 2G',
    description: '450 Kbps',
    downloadSpeed: 450 * 1024 / 8,
    uploadSpeed: 150 * 1024 / 8,
    latency: 150,
    packetLoss: 0,
    isBuiltIn: true,
  },
  {
    id: 'regular3g',
    name: 'Regular 3G',
    description: '750 Kbps',
    downloadSpeed: 750 * 1024 / 8,
    uploadSpeed: 250 * 1024 / 8,
    latency: 100,
    packetLoss: 0,
    isBuiltIn: true,
  },
  {
    id: 'good3g',
    name: 'Good 3G',
    description: '1.5 Mbps',
    downloadSpeed: 1.5 * 1024 * 1024 / 8,
    uploadSpeed: 750 * 1024 / 8,
    latency: 40,
    packetLoss: 0,
    isBuiltIn: true,
  },
  {
    id: 'regular4g',
    name: 'Regular 4G',
    description: '4 Mbps',
    downloadSpeed: 4 * 1024 * 1024 / 8,
    uploadSpeed: 3 * 1024 * 1024 / 8,
    latency: 20,
    packetLoss: 0,
    isBuiltIn: true,
  },
  {
    id: 'dsl',
    name: 'DSL',
    description: '2 Mbps',
    downloadSpeed: 2 * 1024 * 1024 / 8,
    uploadSpeed: 1 * 1024 * 1024 / 8,
    latency: 5,
    packetLoss: 0,
    isBuiltIn: true,
  },
  {
    id: 'wifi',
    name: 'WiFi',
    description: '30 Mbps',
    downloadSpeed: 30 * 1024 * 1024 / 8,
    uploadSpeed: 15 * 1024 * 1024 / 8,
    latency: 2,
    packetLoss: 0,
    isBuiltIn: true,
  },
];

export const NetworkThrottlingService = {
  /**
   * Apply network throttling
   */
  applyThrottling: async (
    profileId: string,
    sessionId?: string
  ): Promise<void> => {
    TelemetryService.trackEvent('network_throttling_applied', { profileId });

    return invoke('browser_apply_network_throttling', { profileId, sessionId });
  },

  /**
   * Apply custom conditions
   */
  applyCustomConditions: async (
    conditions: NetworkConditions,
    sessionId?: string
  ): Promise<void> => {
    return invoke('browser_apply_custom_network_conditions', {
      conditions,
      sessionId,
    });
  },

  /**
   * Remove throttling
   */
  removeThrottling: async (sessionId?: string): Promise<void> => {
    return invoke('browser_remove_network_throttling', { sessionId });
  },

  /**
   * Get current conditions
   */
  getCurrentConditions: async (
    sessionId?: string
  ): Promise<NetworkConditions | null> => {
    return invoke<NetworkConditions | null>('browser_get_network_conditions', {
      sessionId,
    });
  },

  /**
   * Get all profiles
   */
  getProfiles: async (): Promise<NetworkProfile[]> => {
    return invoke<NetworkProfile[]>('browser_get_network_profiles');
  },

  /**
   * Create custom profile
   */
  createProfile: async (
    profile: Omit<NetworkProfile, 'id' | 'isBuiltIn'>
  ): Promise<NetworkProfile> => {
    return invoke<NetworkProfile>('browser_create_network_profile', {
      profile,
    });
  },

  /**
   * Update profile
   */
  updateProfile: async (
    profileId: string,
    updates: Partial<NetworkProfile>
  ): Promise<NetworkProfile> => {
    return invoke<NetworkProfile>('browser_update_network_profile', {
      profileId,
      updates,
    });
  },

  /**
   * Delete profile
   */
  deleteProfile: async (profileId: string): Promise<void> => {
    return invoke('browser_delete_network_profile', { profileId });
  },

  /**
   * Set offline mode
   */
  setOffline: async (offline: boolean, sessionId?: string): Promise<void> => {
    return invoke('browser_set_offline', { offline, sessionId });
  },

  /**
   * Simulate network error
   */
  simulateError: async (
    errorType: 'timeout' | 'connection-refused' | 'dns-error',
    sessionId?: string
  ): Promise<void> => {
    return invoke('browser_simulate_network_error', { errorType, sessionId });
  },
};

// ============================================================================
// Export
// ============================================================================

export const BrowserAdvancedServices = {
  Fingerprint: BrowserFingerprintService,
  SessionReplay: SessionReplayService,
  NetworkThrottling: NetworkThrottlingService,
};

export default BrowserAdvancedServices;
