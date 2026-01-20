// ============================================================================
// Remote Desktop Pro Type Definitions
// CUBE Elite v6 - Enterprise Remote Desktop Features
// ============================================================================

// ============================================================================
// PRIVACY MODE TYPES
// ============================================================================

export type PrivacyLevel = 'none' | 'blur' | 'blackout' | 'custom';
export type PrivacyScope = 'all' | 'selected' | 'sensitive';

export interface PrivacyZone {
  id: string;
  name: string;
  type: 'rectangle' | 'window' | 'application';
  bounds?: { x: number; y: number; width: number; height: number };
  windowTitle?: string;
  applicationName?: string;
  effect: PrivacyLevel;
  enabled: boolean;
}

export interface PrivacyModeConfig {
  enabled: boolean;
  level: PrivacyLevel;
  scope: PrivacyScope;
  zones: PrivacyZone[];
  hideNotifications: boolean;
  hideTaskbar: boolean;
  hideDesktopIcons: boolean;
  blurIntensity: number;
  autoActivate: {
    enabled: boolean;
    triggers: ('screen-share' | 'recording' | 'presentation' | 'guest-mode')[];
  };
  sensitivePatterns: string[];
  passwordFields: boolean;
}

// ============================================================================
// WHITEBOARD TYPES
// ============================================================================

export type WhiteboardTool = 'pen' | 'highlighter' | 'eraser' | 'text' | 'shape' | 'arrow' | 'pointer' | 'laser';
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow' | 'star';

export interface WhiteboardStroke {
  id: string;
  tool: WhiteboardTool;
  color: string;
  width: number;
  points: { x: number; y: number }[];
  opacity: number;
  timestamp: Date;
  userId: string;
}

export interface WhiteboardShape {
  id: string;
  type: ShapeType;
  color: string;
  fill: string | null;
  width: number;
  bounds: { x: number; y: number; width: number; height: number };
  rotation: number;
  timestamp: Date;
  userId: string;
}

export interface WhiteboardText {
  id: string;
  text: string;
  position: { x: number; y: number };
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  timestamp: Date;
  userId: string;
}

export interface WhiteboardPage {
  id: string;
  name: string;
  background: 'white' | 'grid' | 'dots' | 'lines' | 'custom';
  backgroundImage?: string;
  strokes: WhiteboardStroke[];
  shapes: WhiteboardShape[];
  texts: WhiteboardText[];
  createdAt: Date;
  modifiedAt: Date;
}

export interface WhiteboardConfig {
  enabled: boolean;
  defaultTool: WhiteboardTool;
  defaultColor: string;
  defaultWidth: number;
  snapToGrid: boolean;
  gridSize: number;
  maxPages: number;
  autoSave: boolean;
  collaborators: WhiteboardCollaborator[];
}

export interface WhiteboardCollaborator {
  id: string;
  name: string;
  email: string;
  color: string;
  cursor: { x: number; y: number } | null;
  activeTool: WhiteboardTool | null;
  isActive: boolean;
}

// ============================================================================
// SESSION RECORDING TYPES
// ============================================================================

export type RecordingQuality = 'low' | 'medium' | 'high' | 'lossless';
export type RecordingFormat = 'mp4' | 'webm' | 'mkv' | 'avi';
export type RecordingSource = 'screen' | 'window' | 'region' | 'all-monitors';

export interface RecordingSession {
  id: string;
  name: string;
  source: RecordingSource;
  windowTitle?: string;
  region?: { x: number; y: number; width: number; height: number };
  startedAt: Date;
  endedAt?: Date;
  duration: number;
  fileSize: number;
  filePath?: string;
  quality: RecordingQuality;
  format: RecordingFormat;
  hasAudio: boolean;
  hasMicrophone: boolean;
  hasWebcam: boolean;
  thumbnailPath?: string;
  bookmarks: RecordingBookmark[];
  status: 'recording' | 'paused' | 'stopped' | 'processing' | 'completed' | 'failed';
}

export interface RecordingBookmark {
  id: string;
  timestamp: number;
  label: string;
  description?: string;
  createdAt: Date;
}

export interface RecordingConfig {
  enabled: boolean;
  quality: RecordingQuality;
  format: RecordingFormat;
  frameRate: 15 | 24 | 30 | 60;
  captureAudio: boolean;
  captureMicrophone: boolean;
  captureWebcam: boolean;
  webcamPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  webcamSize: 'small' | 'medium' | 'large';
  showCursor: boolean;
  highlightClicks: boolean;
  highlightColor: string;
  autoStop: {
    enabled: boolean;
    maxDuration: number;
    maxFileSize: number;
  };
  storage: {
    path: string;
    autoCleanup: boolean;
    retentionDays: number;
    maxStorageSize: number;
  };
  hotkeys: {
    startStop: string;
    pause: string;
    bookmark: string;
  };
}

// ============================================================================
// MULTI-MONITOR TYPES
// ============================================================================

export interface MonitorInfo {
  id: string;
  name: string;
  isPrimary?: boolean;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  isActive?: boolean;
  isShared?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'adaptive';
  bounds?: { x: number; y: number; width: number; height: number };
  workArea?: { x: number; y: number; width: number; height: number };
  scaleFactor?: number;
  refreshRate?: number;
  colorDepth?: number;
  orientation?: 'landscape' | 'portrait';
  isConnected?: boolean;
}

export interface MonitorLayout {
  id: string;
  name: string;
  monitors: {
    monitorId: string;
    position: { x: number; y: number };
    enabled: boolean;
  }[];
  isDefault: boolean;
  createdAt: Date;
}

export interface RemoteMonitorConfig {
  id: string;
  localMonitorId: string;
  remoteMonitorId: string;
  mode: 'mirror' | 'extend' | 'single';
  quality: 'low' | 'medium' | 'high' | 'adaptive';
  scaling: 'fit' | 'fill' | 'stretch' | '1:1';
}

export interface MultiMonitorConfig {
  enabled: boolean;
  monitors: MonitorInfo[];
  remoteMonitors?: MonitorInfo[];
  layouts: MonitorLayout[];
  activeLayout: string | null;
  remoteConfigs: RemoteMonitorConfig[];
  seamlessMode: boolean;
  sharedClipboard: boolean;
  cursorWrapping: boolean;
  performance?: {
    quality: 'low' | 'medium' | 'high' | 'auto';
    frameRate: number;
    colorDepth: number;
    compression: number;
  };
  hotkeys: {
    switchMonitor: string;
    toggleLayout: string;
    fullscreen: string;
    toggleFullscreen?: string;
  };
}

// ============================================================================
// REMOTE SESSION TYPES
// ============================================================================

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor';
export type SessionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface RemoteSession {
  id: string;
  hostName: string;
  hostIp: string;
  hostOs: string;
  startedAt: Date;
  duration: number;
  state: SessionState;
  quality: ConnectionQuality;
  latency: number;
  bandwidth: { upload: number; download: number };
  frameRate: number;
  resolution: { width: number; height: number };
  encryption: string;
  features: {
    fileTransfer: boolean;
    clipboard: boolean;
    audio: boolean;
    multiMonitor: boolean;
    whiteboard: boolean;
    recording: boolean;
  };
}

export interface SessionPermissions {
  viewOnly: boolean;
  allowKeyboard: boolean;
  allowMouse: boolean;
  allowClipboard: boolean;
  allowFileTransfer: boolean;
  allowAudio: boolean;
  allowPrinting: boolean;
  allowRecording: boolean;
}

export interface ConnectionProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  privateKey?: string;
  domain?: string;
  gateway?: string;
  quality: 'low' | 'medium' | 'high' | 'auto';
  colorDepth: 8 | 16 | 24 | 32;
  resolution: 'auto' | 'native' | { width: number; height: number };
  permissions: SessionPermissions;
  autoReconnect: boolean;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  createdAt: Date;
  lastConnected?: Date;
  isFavorite: boolean;
  tags: string[];
}

// ============================================================================
// PERFORMANCE TYPES
// ============================================================================

export interface PerformanceStats {
  cpuUsage: number;
  memoryUsage: number;
  networkUsage: { upload: number; download: number };
  frameRate: number;
  latency: number;
  packetLoss: number;
  jitter: number;
  encodingTime: number;
  decodingTime: number;
  compressionRatio: number;
}

export interface AdaptiveQualityConfig {
  enabled: boolean;
  targetFrameRate: number;
  minQuality: 'low' | 'medium';
  maxQuality: 'high' | 'lossless';
  latencyThreshold: number;
  bandwidthThreshold: number;
  adjustInterval: number;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export interface RemoteDesktopState {
  session: RemoteSession | null;
  privacyMode: PrivacyModeConfig;
  whiteboard: WhiteboardConfig;
  recording: RecordingConfig;
  multiMonitor: MultiMonitorConfig;
  performance: PerformanceStats | null;
  adaptiveQuality: AdaptiveQualityConfig;
  savedProfiles: ConnectionProfile[];
  recentSessions: RemoteSession[];
}

// Alias export for compatibility
export type RemoteMonitor = MonitorInfo;
