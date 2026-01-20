// Video Conference Types
// CUBE Nexum All-in-One Platform
// Complete TypeScript type definitions for video conferencing

// ==================== Core Types ====================

export interface ConferenceRoom {
  room_id: string;
  room_name: string;
  access_code: string;
  host_id: string;
  max_participants: number;
  participant_count: number;
  created_at: string;
  expires_at: string;
  is_locked: boolean;
  is_recording: boolean;
  settings: RoomSettings;
}

export interface RoomSettings {
  allow_screen_share: boolean;
  allow_file_share: boolean;
  allow_chat: boolean;
  require_password: boolean;
  password_hash: string | null;
  enable_waiting_room: boolean;
  mute_on_join: boolean;
  video_quality: VideoQuality;
  audio_quality: AudioQuality;
}

export type VideoQuality = 'Low' | 'Medium' | 'High' | 'Ultra';
export type AudioQuality = 'Low' | 'Medium' | 'High';

export interface Participant {
  participant_id: string;
  display_name: string;
  user_id: string | null;
  role: ParticipantRole;
  is_audio_muted: boolean;
  is_video_enabled: boolean;
  is_screen_sharing: boolean;
  hand_raised: boolean;
  connection_quality: number;
  joined_at: string;
  last_activity: string;
  stats: NetworkStats;
}

export type ParticipantRole = 'Host' | 'Moderator' | 'Participant' | 'Guest';

export interface NetworkStats {
  packets_sent: number;
  packets_received: number;
  bytes_sent: number;
  bytes_received: number;
  packet_loss: number;
  rtt_ms: number;
  jitter_ms: number;
  bitrate: number;
}

export interface MediaStreamConfig {
  stream_type: StreamType;
  stream_id: string;
  participant_id: string;
  video_codec: string | null;
  audio_codec: string | null;
  resolution: Resolution | null;
  frame_rate: number | null;
  bitrate: number | null;
}

export type StreamType = 'Audio' | 'Video' | 'Screen';

export interface Resolution {
  width: number;
  height: number;
}

export interface RecordingSession {
  recording_id: string;
  room_id: string;
  status: RecordingStatus;
  started_at: string;
  ended_at: string | null;
  output_path: string;
  file_size: number;
  duration_seconds: number;
}

export type RecordingStatus = 
  | 'Recording' 
  | 'Paused' 
  | 'Stopped' 
  | 'Processing' 
  | 'Completed' 
  | 'Failed';

// ==================== UI State Types ====================

export interface ConferenceState {
  currentRoom: ConferenceRoom | null;
  currentParticipant: Participant | null;
  participants: Participant[];
  streams: MediaStreamConfig[];
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  screenStream: MediaStream | null;
  isConnected: boolean;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  participant_id: string;
  participant_name: string;
  content: string;
  timestamp: string;
  type: 'text' | 'system' | 'file';
}

export interface LayoutConfig {
  type: 'grid' | 'spotlight' | 'sidebar';
  maxTiles: number;
  showScreenShare: boolean;
  pinned_participant_id: string | null;
}

// ==================== Event Types ====================

export type ConferenceEventType =
  | 'conference:room_created'
  | 'conference:room_updated'
  | 'conference:participant_joined'
  | 'conference:participant_left'
  | 'conference:audio_toggled'
  | 'conference:video_toggled'
  | 'conference:screen_share_started'
  | 'conference:screen_share_stopped'
  | 'conference:hand_toggled'
  | 'conference:recording_started'
  | 'conference:recording_stopped'
  | 'conference:chat_message';

export interface ConferenceEvent<T = any> {
  type: ConferenceEventType;
  payload: T;
  timestamp: string;
}

// ==================== Create Room Request ====================

export interface CreateRoomRequest {
  room_name: string;
  host_id: string;
  max_participants: number;
  settings?: Partial<RoomSettings>;
}

export interface JoinRoomRequest {
  access_code: string;
  display_name: string;
  user_id?: string;
  password?: string;
}

// ==================== Helper Functions ====================

/**
 * Get video quality settings
 */
export function getVideoQualitySettings(quality: VideoQuality): {
  resolution: Resolution;
  frameRate: number;
  bitrate: number;
} {
  switch (quality) {
    case 'Low':
      return {
        resolution: { width: 320, height: 240 },
        frameRate: 15,
        bitrate: 200000,
      };
    case 'Medium':
      return {
        resolution: { width: 640, height: 480 },
        frameRate: 24,
        bitrate: 500000,
      };
    case 'High':
      return {
        resolution: { width: 1280, height: 720 },
        frameRate: 30,
        bitrate: 1500000,
      };
    case 'Ultra':
      return {
        resolution: { width: 1920, height: 1080 },
        frameRate: 60,
        bitrate: 4000000,
      };
  }
}

/**
 * Get audio quality settings
 */
export function getAudioQualitySettings(quality: AudioQuality): {
  sampleRate: number;
  channels: number;
  bitrate: number;
} {
  switch (quality) {
    case 'Low':
      return { sampleRate: 8000, channels: 1, bitrate: 32000 };
    case 'Medium':
      return { sampleRate: 16000, channels: 1, bitrate: 64000 };
    case 'High':
      return { sampleRate: 48000, channels: 2, bitrate: 128000 };
  }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: ParticipantRole): string {
  const roleMap: Record<ParticipantRole, string> = {
    Host: 'Host',
    Moderator: 'Moderator',
    Participant: 'Participant',
    Guest: 'Guest',
  };
  return roleMap[role];
}

/**
 * Get role color
 */
export function getRoleColor(role: ParticipantRole): string {
  const colorMap: Record<ParticipantRole, string> = {
    Host: '#6366f1',
    Moderator: '#f59e0b',
    Participant: '#10b981',
    Guest: '#6b7280',
  };
  return colorMap[role];
}

/**
 * Get connection quality text
 */
export function getConnectionQualityText(quality: number): string {
  if (quality >= 80) return 'Excellent';
  if (quality >= 60) return 'Good';
  if (quality >= 40) return 'Fair';
  if (quality >= 20) return 'Poor';
  return 'Very Poor';
}

/**
 * Get connection quality color
 */
export function getConnectionQualityColor(quality: number): string {
  if (quality >= 80) return '#10b981';
  if (quality >= 60) return '#3b82f6';
  if (quality >= 40) return '#f59e0b';
  if (quality >= 20) return '#ef4444';
  return '#991b1b';
}

/**
 * Format duration from seconds
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format bitrate
 */
export function formatBitrate(bps: number): string {
  if (bps >= 1000000) {
    return `${(bps / 1000000).toFixed(1)} Mbps`;
  }
  if (bps >= 1000) {
    return `${(bps / 1000).toFixed(0)} Kbps`;
  }
  return `${bps} bps`;
}

/**
 * Format bytes
 */
export function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) {
    return `${(bytes / 1073741824).toFixed(2)} GB`;
  }
  if (bytes >= 1048576) {
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} B`;
}

/**
 * Format timestamp
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Get recording status text
 */
export function getRecordingStatusText(status: RecordingStatus): string {
  const statusMap: Record<RecordingStatus, string> = {
    Recording: '● Recording',
    Paused: '⏸ Paused',
    Stopped: '⏹ Stopped',
    Processing: '⏳ Processing',
    Completed: '✓ Completed',
    Failed: '✗ Failed',
  };
  return statusMap[status];
}

/**
 * Get recording status color
 */
export function getRecordingStatusColor(status: RecordingStatus): string {
  const colorMap: Record<RecordingStatus, string> = {
    Recording: '#ef4444',
    Paused: '#f59e0b',
    Stopped: '#6b7280',
    Processing: '#3b82f6',
    Completed: '#10b981',
    Failed: '#991b1b',
  };
  return colorMap[status];
}

/**
 * Generate participant color based on ID
 */
export function getParticipantColor(participantId: string): string {
  const colors = [
    '#6366f1', '#8b5cf6', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#30cfd0',
  ];
  
  let hash = 0;
  for (let i = 0; i < participantId.length; i++) {
    hash = participantId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get layout grid columns
 */
export function getLayoutGridColumns(participantCount: number): number {
  if (participantCount <= 1) return 1;
  if (participantCount <= 4) return 2;
  if (participantCount <= 9) return 3;
  if (participantCount <= 16) return 4;
  return 5;
}

/**
 * Sort participants (host first, then by role, then by name)
 */
export function sortParticipants(participants: Participant[]): Participant[] {
  return [...participants].sort((a, b) => {
    if (a.role === 'Host' && b.role !== 'Host') return -1;
    if (a.role !== 'Host' && b.role === 'Host') return 1;
    
    const roleOrder: Record<ParticipantRole, number> = {
      Host: 0,
      Moderator: 1,
      Participant: 2,
      Guest: 3,
    };
    
    const roleCompare = roleOrder[a.role] - roleOrder[b.role];
    if (roleCompare !== 0) return roleCompare;
    
    return a.display_name.localeCompare(b.display_name);
  });
}

/**
 * Calculate grid layout positions
 */
export function calculateGridLayout(
  count: number,
  containerWidth: number,
  containerHeight: number
): { width: number; height: number; cols: number; rows: number } {
  const cols = getLayoutGridColumns(count);
  const rows = Math.ceil(count / cols);
  
  const tileWidth = containerWidth / cols;
  const tileHeight = containerHeight / rows;
  
  return { width: tileWidth, height: tileHeight, cols, rows };
}

/**
 * Get default room settings
 */
export function getDefaultRoomSettings(): RoomSettings {
  return {
    allow_screen_share: true,
    allow_file_share: true,
    allow_chat: true,
    require_password: false,
    password_hash: null,
    enable_waiting_room: false,
    mute_on_join: false,
    video_quality: 'High',
    audio_quality: 'High',
  };
}

/**
 * Get default network stats
 */
export function getDefaultNetworkStats(): NetworkStats {
  return {
    packets_sent: 0,
    packets_received: 0,
    bytes_sent: 0,
    bytes_received: 0,
    packet_loss: 0,
    rtt_ms: 0,
    jitter_ms: 0,
    bitrate: 0,
  };
}

/**
 * Check if participant can control feature
 */
export function canParticipantControl(
  participant: Participant,
  feature: 'screen_share' | 'recording' | 'lock_room'
): boolean {
  if (participant.role === 'Host') return true;
  if (participant.role === 'Moderator' && feature !== 'lock_room') return true;
  return false;
}

/**
 * Validate room name
 */
export function validateRoomName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Room name is required' };
  }
  if (name.length < 3) {
    return { valid: false, error: 'Room name must be at least 3 characters' };
  }
  if (name.length > 50) {
    return { valid: false, error: 'Room name must be less than 50 characters' };
  }
  return { valid: true };
}

/**
 * Validate access code
 */
export function validateAccessCode(code: string): { valid: boolean; error?: string } {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Access code is required' };
  }
  if (!/^\d{6}$/.test(code)) {
    return { valid: false, error: 'Access code must be 6 digits' };
  }
  return { valid: true };
}

/**
 * Validate display name
 */
export function validateDisplayName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Display name is required' };
  }
  if (name.length < 2) {
    return { valid: false, error: 'Display name must be at least 2 characters' };
  }
  if (name.length > 30) {
    return { valid: false, error: 'Display name must be less than 30 characters' };
  }
  return { valid: true };
}
