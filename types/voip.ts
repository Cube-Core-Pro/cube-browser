// VoIP Type Definitions
// Complete TypeScript interfaces for WebRTC VoIP system

/**
 * VoIP Configuration
 * Settings for WebRTC connection initialization
 */
export interface VoIPConfig {
  ice_servers: string[];
  enable_audio: boolean;
  enable_video: boolean;
  audio_codec: AudioCodec;
  video_codec: VideoCodec;
}

/**
 * Audio Codec Options
 */
export type AudioCodec = 'Opus' | 'PCMU' | 'PCMA';

/**
 * Video Codec Options
 */
export type VideoCodec = 'VP8' | 'VP9' | 'H264' | 'AV1';

/**
 * Call State
 * Current status of VoIP call
 */
export interface CallState {
  is_active: boolean;
  is_muted: boolean;
  is_video_enabled: boolean;
  connection_state: ConnectionState;
  ice_connection_state: IceConnectionState;
  remote_peer_id: string | null;
}

/**
 * WebRTC Connection States
 */
export type ConnectionState = 
  | 'new' 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'failed' 
  | 'closed';

/**
 * ICE Connection States
 */
export type IceConnectionState = 
  | 'new' 
  | 'checking' 
  | 'connected' 
  | 'completed' 
  | 'failed' 
  | 'disconnected' 
  | 'closed';

/**
 * Contact Information
 */
export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status: ContactStatus;
  lastSeen?: Date;
  favorite: boolean;
  tags: string[];
}

/**
 * Contact Online Status
 */
export type ContactStatus = 'online' | 'offline' | 'busy' | 'away';

/**
 * Call History Entry
 */
export interface CallHistoryEntry {
  id: string;
  contact_id: string;
  contact_name: string;
  type: CallType;
  direction: CallDirection;
  duration: number; // seconds
  timestamp: Date;
  quality: CallQuality;
  has_video: boolean;
  ended_reason: EndReason;
}

/**
 * Call Type
 */
export type CallType = 'audio' | 'video';

/**
 * Call Direction
 */
export type CallDirection = 'incoming' | 'outgoing';

/**
 * Call Quality Rating
 */
export type CallQuality = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * Call End Reason
 */
export type EndReason = 
  | 'completed' 
  | 'declined' 
  | 'missed' 
  | 'failed' 
  | 'cancelled' 
  | 'busy';

/**
 * Audio Device Information
 */
export interface AudioDevice {
  id: string;
  name: string;
  type: DeviceType;
  is_default: boolean;
}

/**
 * Device Type
 */
export type DeviceType = 'input' | 'output';

/**
 * Call Statistics
 */
export interface CallStatistics {
  bytes_sent: number;
  bytes_received: number;
  packets_sent: number;
  packets_received: number;
  packets_lost: number;
  jitter: number; // milliseconds
  rtt: number; // round trip time in milliseconds
  codec: string;
  bitrate: number; // bits per second
}

/**
 * VoIP Event Types
 */
export type VoIPEventType = 
  | 'call:incoming' 
  | 'call:answered' 
  | 'call:ended' 
  | 'call:failed' 
  | 'connection:state_changed' 
  | 'audio:muted' 
  | 'audio:unmuted' 
  | 'video:enabled' 
  | 'video:disabled';

/**
 * VoIP Event Payload
 */
export interface VoIPEvent {
  type: VoIPEventType;
  timestamp: Date;
  data: any;
}

/**
 * Dialer Input State
 */
export interface DialerState {
  input: string;
  contacts_filtered: Contact[];
  is_calling: boolean;
}

/**
 * Call Session
 * Active call information
 */
export interface CallSession {
  id: string;
  contact: Contact;
  type: CallType;
  direction: CallDirection;
  start_time: Date;
  duration: number; // seconds (updated live)
  state: CallState;
  statistics: CallStatistics | null;
}

// Helper Functions

/**
 * Get connection state display text
 */
export const getConnectionStateText = (state: ConnectionState): string => {
  const stateMap: Record<ConnectionState, string> = {
    new: 'Initializing',
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    failed: 'Connection Failed',
    closed: 'Closed'
  };
  return stateMap[state] || state;
};

/**
 * Get ICE connection state display text
 */
export const getIceStateText = (state: IceConnectionState): string => {
  const stateMap: Record<IceConnectionState, string> = {
    new: 'New',
    checking: 'Checking...',
    connected: 'Connected',
    completed: 'Completed',
    failed: 'Failed',
    disconnected: 'Disconnected',
    closed: 'Closed'
  };
  return stateMap[state] || state;
};

/**
 * Get contact status color
 */
export const getStatusColor = (status: ContactStatus): string => {
  const colorMap: Record<ContactStatus, string> = {
    online: '#10b981',
    offline: '#6b7280',
    busy: '#ef4444',
    away: '#f59e0b'
  };
  return colorMap[status];
};

/**
 * Get call quality color
 */
export const getQualityColor = (quality: CallQuality): string => {
  const colorMap: Record<CallQuality, string> = {
    excellent: '#10b981',
    good: '#3b82f6',
    fair: '#f59e0b',
    poor: '#ef4444'
  };
  return colorMap[quality];
};

/**
 * Format call duration
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Format call duration short (for active calls)
 */
export const formatDurationShort = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  } else {
    return `${pad(minutes)}:${pad(secs)}`;
  }
};

/**
 * Format bitrate
 */
export const formatBitrate = (bitsPerSecond: number): string => {
  if (bitsPerSecond >= 1000000) {
    return `${(bitsPerSecond / 1000000).toFixed(1)} Mbps`;
  } else if (bitsPerSecond >= 1000) {
    return `${(bitsPerSecond / 1000).toFixed(1)} Kbps`;
  } else {
    return `${bitsPerSecond} bps`;
  }
};

/**
 * Format bytes
 */
export const formatBytes = (bytes: number): string => {
  if (bytes >= 1073741824) {
    return `${(bytes / 1073741824).toFixed(2)} GB`;
  } else if (bytes >= 1048576) {
    return `${(bytes / 1048576).toFixed(2)} MB`;
  } else if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${bytes} B`;
  }
};

/**
 * Get call type icon
 */
export const getCallTypeIcon = (type: CallType): string => {
  return type === 'video' ? '📹' : '📞';
};

/**
 * Get call direction icon
 */
export const getCallDirectionIcon = (direction: CallDirection): string => {
  return direction === 'incoming' ? '📥' : '📤';
};

/**
 * Get end reason display text
 */
export const getEndReasonText = (reason: EndReason): string => {
  const reasonMap: Record<EndReason, string> = {
    completed: 'Completed',
    declined: 'Declined',
    missed: 'Missed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    busy: 'Busy'
  };
  return reasonMap[reason];
};

/**
 * Get codec display name
 */
export const getCodecDisplayName = (codec: AudioCodec | VideoCodec): string => {
  const codecMap: Record<string, string> = {
    Opus: 'Opus (High Quality)',
    PCMU: 'μ-law (G.711)',
    PCMA: 'A-law (G.711)',
    VP8: 'VP8',
    VP9: 'VP9',
    H264: 'H.264',
    AV1: 'AV1'
  };
  return codecMap[codec] || codec;
};

/**
 * Filter contacts by search term
 */
export const filterContacts = (
  contacts: Contact[],
  searchTerm: string
): Contact[] => {
  if (!searchTerm.trim()) return contacts;
  
  const term = searchTerm.toLowerCase();
  return contacts.filter(contact => 
    contact.name.toLowerCase().includes(term) ||
    contact.email?.toLowerCase().includes(term) ||
    contact.phone?.includes(term) ||
    contact.tags.some(tag => tag.toLowerCase().includes(term))
  );
};

/**
 * Sort contacts by name
 */
export const sortContactsByName = (contacts: Contact[]): Contact[] => {
  return [...contacts].sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Sort contacts by status (online first)
 */
export const sortContactsByStatus = (contacts: Contact[]): Contact[] => {
  const statusOrder: Record<ContactStatus, number> = {
    online: 0,
    away: 1,
    busy: 2,
    offline: 3
  };
  
  return [...contacts].sort((a, b) => {
    const orderDiff = statusOrder[a.status] - statusOrder[b.status];
    if (orderDiff !== 0) return orderDiff;
    return a.name.localeCompare(b.name);
  });
};

/**
 * Get favorite contacts
 */
export const getFavoriteContacts = (contacts: Contact[]): Contact[] => {
  return contacts.filter(contact => contact.favorite);
};

/**
 * Calculate call quality from statistics
 */
export const calculateCallQuality = (stats: CallStatistics): CallQuality => {
  const { packets_lost, packets_received, jitter, rtt } = stats;
  
  if (packets_received === 0) return 'poor';
  
  const packetLossRate = packets_lost / (packets_received + packets_lost);
  
  // Excellent: <1% loss, <30ms jitter, <100ms RTT
  if (packetLossRate < 0.01 && jitter < 30 && rtt < 100) {
    return 'excellent';
  }
  // Good: <3% loss, <50ms jitter, <200ms RTT
  else if (packetLossRate < 0.03 && jitter < 50 && rtt < 200) {
    return 'good';
  }
  // Fair: <5% loss, <100ms jitter, <300ms RTT
  else if (packetLossRate < 0.05 && jitter < 100 && rtt < 300) {
    return 'fair';
  }
  // Poor: everything else
  else {
    return 'poor';
  }
};

/**
 * Default VoIP configuration
 */
export const getDefaultVoIPConfig = (): VoIPConfig => ({
  ice_servers: [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302'
  ],
  enable_audio: true,
  enable_video: false,
  audio_codec: 'Opus',
  video_codec: 'VP8'
});

/**
 * Parse phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};
