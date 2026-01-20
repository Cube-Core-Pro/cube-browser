/**
 * CUBE Elite v7 - useVideoConference Hook
 * 
 * Centralized React hook for Video Conference functionality.
 * Provides state management for rooms, participants, and media streams.
 * 
 * Features:
 * - Room creation and management
 * - Participant management
 * - Audio/Video controls
 * - Screen sharing
 * - Recording
 * - Real-time updates via WebRTC
 * - Connection statistics
 * 
 * @module hooks/useVideoConference
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { logger } from '@/lib/services/logger-service';
import {
  ConferenceRoom,
  Participant,
  MediaStream,
  ConferenceStats,
  createRoom,
  joinRoom,
  leaveRoom,
  toggleAudio,
  toggleVideo,
  startScreenShare,
  stopScreenShare,
  toggleHand,
  startRecording,
  stopRecording,
  getRoom,
  listRooms,
  getParticipants,
  getStreams,
  getICEServers,
} from '@/lib/services/videoConferenceService';

const log = logger.scope('useVideoConference');

// =============================================================================
// Types
// =============================================================================

export interface UseVideoConferenceOptions {
  /** Auto-refresh interval for room list in milliseconds */
  autoRefresh?: number;
  /** Enable real-time updates */
  realtime?: boolean;
  /** Participant ID for the current user */
  participantId?: string;
  /** Participant name for the current user */
  participantName?: string;
}

export interface VideoConferenceState {
  rooms: ConferenceRoom[];
  currentRoom: ConferenceRoom | null;
  participants: Participant[];
  localParticipant: Participant | null;
  streams: MediaStream[];
  stats: ConferenceStats | null;
  iceServers: unknown[];
  isRecording: boolean;
}

export interface VideoConferenceLoadingState {
  rooms: boolean;
  joining: boolean;
  recording: boolean;
  global: boolean;
}

export interface VideoConferenceErrorState {
  rooms: string | null;
  connection: string | null;
  media: string | null;
}

export interface UseVideoConferenceReturn {
  // State
  data: VideoConferenceState;
  loading: VideoConferenceLoadingState;
  errors: VideoConferenceErrorState;
  
  // Room Actions
  createRoomAction: (name: string, maxParticipants?: number) => Promise<ConferenceRoom>;
  joinRoomAction: (roomId: string) => Promise<void>;
  leaveRoomAction: () => Promise<void>;
  refreshRoom: () => Promise<void>;
  
  // Media Controls
  toggleAudioAction: (enabled: boolean) => Promise<void>;
  toggleVideoAction: (enabled: boolean) => Promise<void>;
  startScreenShareAction: () => Promise<void>;
  stopScreenShareAction: () => Promise<void>;
  toggleHandAction: (raised: boolean) => Promise<void>;
  
  // Recording
  startRecordingAction: (outputPath: string) => Promise<void>;
  stopRecordingAction: () => Promise<string>;
  
  // Utility
  refreshRooms: () => Promise<void>;
  refreshParticipants: () => Promise<void>;
  refreshStreams: () => Promise<void>;
  getICEServersAction: () => Promise<unknown[]>;
  
  // Computed
  isInRoom: boolean;
  isHost: boolean;
  participantsWithVideo: Participant[];
  participantsWithAudio: Participant[];
  participantsWithHand: Participant[];
  activeScreenShares: MediaStream[];
  roomCapacity: { current: number; max: number };
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useVideoConference(options: UseVideoConferenceOptions = {}): UseVideoConferenceReturn {
  const { 
    autoRefresh, 
    realtime = true, 
    participantId: optionParticipantId,
    participantName: optionParticipantName,
  } = options;
  
  // Generate participant ID if not provided
  const participantIdRef = useRef(optionParticipantId || crypto.randomUUID());
  const participantNameRef = useRef(optionParticipantName || 'Guest');
  
  // State
  const [data, setData] = useState<VideoConferenceState>({
    rooms: [],
    currentRoom: null,
    participants: [],
    localParticipant: null,
    streams: [],
    stats: null,
    iceServers: [],
    isRecording: false,
  });
  
  const [loading, setLoading] = useState<VideoConferenceLoadingState>({
    rooms: false,
    joining: false,
    recording: false,
    global: true,
  });
  
  const [errors, setErrors] = useState<VideoConferenceErrorState>({
    rooms: null,
    connection: null,
    media: null,
  });
  
  // Refs
  const unlistenRefs = useRef<UnlistenFn[]>([]);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ==========================================================================
  // Data Fetching
  // ==========================================================================
  
  const fetchRooms = useCallback(async () => {
    setLoading(prev => ({ ...prev, rooms: true }));
    setErrors(prev => ({ ...prev, rooms: null }));
    
    try {
      const rooms = await listRooms();
      setData(prev => ({ ...prev, rooms }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch rooms';
      setErrors(prev => ({ ...prev, rooms: message }));
      log.error('useVideoConference: Failed to fetch rooms:', error);
    } finally {
      setLoading(prev => ({ ...prev, rooms: false }));
    }
  }, []);
  
  const fetchParticipants = useCallback(async () => {
    if (!data.currentRoom) return;
    
    try {
      const participants = await getParticipants(data.currentRoom.id);
      const localParticipant = participants.find(p => p.id === participantIdRef.current) || null;
      setData(prev => ({ ...prev, participants, localParticipant }));
    } catch (error) {
      log.error('useVideoConference: Failed to fetch participants:', error);
    }
  }, [data.currentRoom]);
  
  const fetchStreams = useCallback(async () => {
    if (!data.currentRoom) return;
    
    try {
      const streams = await getStreams(data.currentRoom.id);
      setData(prev => ({ ...prev, streams }));
    } catch (error) {
      log.error('useVideoConference: Failed to fetch streams:', error);
    }
  }, [data.currentRoom]);
  
  const fetchRoom = useCallback(async () => {
    if (!data.currentRoom) return;
    
    try {
      const room = await getRoom(data.currentRoom.id);
      setData(prev => ({ 
        ...prev, 
        currentRoom: room,
        isRecording: room.recording,
      }));
    } catch (error) {
      log.error('useVideoConference: Failed to fetch room:', error);
    }
  }, [data.currentRoom]);
  
  // ==========================================================================
  // Room Actions
  // ==========================================================================
  
  const createRoomAction = useCallback(async (name: string, maxParticipants: number = 10) => {
    setLoading(prev => ({ ...prev, joining: true }));
    setErrors(prev => ({ ...prev, connection: null }));
    
    try {
      const room = await createRoom(name, participantNameRef.current, maxParticipants);
      
      setData(prev => ({
        ...prev,
        rooms: [room, ...prev.rooms],
        currentRoom: room,
      }));
      
      return room;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create room';
      setErrors(prev => ({ ...prev, connection: message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, joining: false }));
    }
  }, []);
  
  const joinRoomAction = useCallback(async (roomId: string) => {
    setLoading(prev => ({ ...prev, joining: true }));
    setErrors(prev => ({ ...prev, connection: null }));
    
    try {
      await joinRoom(roomId, participantIdRef.current, participantNameRef.current);
      const room = await getRoom(roomId);
      const participants = await getParticipants(roomId);
      const streams = await getStreams(roomId);
      
      setData(prev => ({
        ...prev,
        currentRoom: room,
        participants,
        streams,
        localParticipant: participants.find(p => p.id === participantIdRef.current) || null,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join room';
      setErrors(prev => ({ ...prev, connection: message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, joining: false }));
    }
  }, []);
  
  const leaveRoomAction = useCallback(async () => {
    if (!data.currentRoom) return;
    
    try {
      await leaveRoom(data.currentRoom.id, participantIdRef.current);
      
      setData(prev => ({
        ...prev,
        currentRoom: null,
        participants: [],
        localParticipant: null,
        streams: [],
        stats: null,
        isRecording: false,
      }));
    } catch (error) {
      log.error('useVideoConference: Failed to leave room:', error);
    }
  }, [data.currentRoom]);
  
  const refreshRoom = useCallback(async () => {
    await Promise.all([
      fetchRoom(),
      fetchParticipants(),
      fetchStreams(),
    ]);
  }, [fetchRoom, fetchParticipants, fetchStreams]);
  
  // ==========================================================================
  // Media Controls
  // ==========================================================================
  
  const toggleAudioAction = useCallback(async (enabled: boolean) => {
    if (!data.currentRoom) return;
    
    setErrors(prev => ({ ...prev, media: null }));
    
    try {
      await toggleAudio(data.currentRoom.id, participantIdRef.current, enabled);
      
      setData(prev => ({
        ...prev,
        localParticipant: prev.localParticipant 
          ? { ...prev.localParticipant, audioEnabled: enabled }
          : null,
        participants: prev.participants.map(p => 
          p.id === participantIdRef.current ? { ...p, audioEnabled: enabled } : p
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle audio';
      setErrors(prev => ({ ...prev, media: message }));
      throw error;
    }
  }, [data.currentRoom]);
  
  const toggleVideoAction = useCallback(async (enabled: boolean) => {
    if (!data.currentRoom) return;
    
    setErrors(prev => ({ ...prev, media: null }));
    
    try {
      await toggleVideo(data.currentRoom.id, participantIdRef.current, enabled);
      
      setData(prev => ({
        ...prev,
        localParticipant: prev.localParticipant 
          ? { ...prev.localParticipant, videoEnabled: enabled }
          : null,
        participants: prev.participants.map(p => 
          p.id === participantIdRef.current ? { ...p, videoEnabled: enabled } : p
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle video';
      setErrors(prev => ({ ...prev, media: message }));
      throw error;
    }
  }, [data.currentRoom]);
  
  const startScreenShareAction = useCallback(async () => {
    if (!data.currentRoom) return;
    
    setErrors(prev => ({ ...prev, media: null }));
    
    try {
      await startScreenShare(data.currentRoom.id, participantIdRef.current);
      
      setData(prev => ({
        ...prev,
        localParticipant: prev.localParticipant 
          ? { ...prev.localParticipant, screenSharing: true }
          : null,
        participants: prev.participants.map(p => 
          p.id === participantIdRef.current ? { ...p, screenSharing: true } : p
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start screen share';
      setErrors(prev => ({ ...prev, media: message }));
      throw error;
    }
  }, [data.currentRoom]);
  
  const stopScreenShareAction = useCallback(async () => {
    if (!data.currentRoom) return;
    
    try {
      await stopScreenShare(data.currentRoom.id, participantIdRef.current);
      
      setData(prev => ({
        ...prev,
        localParticipant: prev.localParticipant 
          ? { ...prev.localParticipant, screenSharing: false }
          : null,
        participants: prev.participants.map(p => 
          p.id === participantIdRef.current ? { ...p, screenSharing: false } : p
        ),
      }));
    } catch (error) {
      log.error('useVideoConference: Failed to stop screen share:', error);
    }
  }, [data.currentRoom]);
  
  const toggleHandAction = useCallback(async (raised: boolean) => {
    if (!data.currentRoom) return;
    
    try {
      await toggleHand(data.currentRoom.id, participantIdRef.current, raised);
      
      setData(prev => ({
        ...prev,
        localParticipant: prev.localParticipant 
          ? { ...prev.localParticipant, handRaised: raised }
          : null,
        participants: prev.participants.map(p => 
          p.id === participantIdRef.current ? { ...p, handRaised: raised } : p
        ),
      }));
    } catch (error) {
      log.error('useVideoConference: Failed to toggle hand:', error);
    }
  }, [data.currentRoom]);
  
  // ==========================================================================
  // Recording
  // ==========================================================================
  
  const startRecordingAction = useCallback(async (outputPath: string) => {
    if (!data.currentRoom) return;
    
    setLoading(prev => ({ ...prev, recording: true }));
    
    try {
      await startRecording(data.currentRoom.id, outputPath);
      
      setData(prev => ({
        ...prev,
        isRecording: true,
        currentRoom: prev.currentRoom 
          ? { ...prev.currentRoom, recording: true }
          : null,
      }));
    } catch (error) {
      log.error('useVideoConference: Failed to start recording:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, recording: false }));
    }
  }, [data.currentRoom]);
  
  const stopRecordingAction = useCallback(async () => {
    if (!data.currentRoom) {
      throw new Error('Not in a room');
    }
    
    setLoading(prev => ({ ...prev, recording: true }));
    
    try {
      const recordingPath = await stopRecording(data.currentRoom.id);
      
      setData(prev => ({
        ...prev,
        isRecording: false,
        currentRoom: prev.currentRoom 
          ? { ...prev.currentRoom, recording: false }
          : null,
      }));
      
      return recordingPath;
    } finally {
      setLoading(prev => ({ ...prev, recording: false }));
    }
  }, [data.currentRoom]);
  
  // ==========================================================================
  // Utility
  // ==========================================================================
  
  const refreshRooms = useCallback(async () => {
    await fetchRooms();
  }, [fetchRooms]);
  
  const refreshParticipants = useCallback(async () => {
    await fetchParticipants();
  }, [fetchParticipants]);
  
  const refreshStreams = useCallback(async () => {
    await fetchStreams();
  }, [fetchStreams]);
  
  const getICEServersAction = useCallback(async () => {
    const servers = await getICEServers();
    setData(prev => ({ ...prev, iceServers: servers }));
    return servers;
  }, []);
  
  // ==========================================================================
  // Computed Values
  // ==========================================================================
  
  const isInRoom = useMemo(() => 
    data.currentRoom !== null,
    [data.currentRoom]
  );
  
  const isHost = useMemo(() => 
    data.currentRoom?.host === participantNameRef.current,
    [data.currentRoom]
  );
  
  const participantsWithVideo = useMemo(() => 
    data.participants.filter(p => p.videoEnabled),
    [data.participants]
  );
  
  const participantsWithAudio = useMemo(() => 
    data.participants.filter(p => p.audioEnabled),
    [data.participants]
  );
  
  const participantsWithHand = useMemo(() => 
    data.participants.filter(p => p.handRaised),
    [data.participants]
  );
  
  const activeScreenShares = useMemo(() => 
    data.streams.filter(s => s.type === 'screen' && s.enabled),
    [data.streams]
  );
  
  const roomCapacity = useMemo(() => ({
    current: data.currentRoom?.participants || 0,
    max: data.currentRoom?.maxParticipants || 0,
  }), [data.currentRoom]);
  
  // ==========================================================================
  // Effects
  // ==========================================================================
  
  // Initial fetch
  useEffect(() => {
    const init = async () => {
      await fetchRooms();
      const servers = await getICEServers();
      setData(prev => ({ ...prev, iceServers: servers }));
      setLoading(prev => ({ ...prev, global: false }));
    };
    
    init();
  }, [fetchRooms]);
  
  // Auto-refresh rooms
  useEffect(() => {
    if (autoRefresh && autoRefresh > 0 && !data.currentRoom) {
      refreshIntervalRef.current = setInterval(fetchRooms, autoRefresh);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, fetchRooms, data.currentRoom]);
  
  // Poll room data when in a room
  useEffect(() => {
    if (data.currentRoom) {
      const pollInterval = setInterval(refreshRoom, 2000);
      
      return () => clearInterval(pollInterval);
    }
  }, [data.currentRoom, refreshRoom]);
  
  // Real-time updates
  useEffect(() => {
    if (!realtime) return;
    
    const setupListeners = async () => {
      try {
        const unlistenJoin = await listen<Participant>('conference:participant:joined', (event) => {
          setData(prev => ({
            ...prev,
            participants: [...prev.participants, event.payload],
          }));
        });
        
        const unlistenLeave = await listen<{ participantId: string }>('conference:participant:left', (event) => {
          setData(prev => ({
            ...prev,
            participants: prev.participants.filter(p => p.id !== event.payload.participantId),
          }));
        });
        
        const unlistenUpdate = await listen<Participant>('conference:participant:updated', (event) => {
          setData(prev => ({
            ...prev,
            participants: prev.participants.map(p => 
              p.id === event.payload.id ? event.payload : p
            ),
            localParticipant: prev.localParticipant?.id === event.payload.id 
              ? event.payload 
              : prev.localParticipant,
          }));
        });
        
        const unlistenStats = await listen<ConferenceStats>('conference:stats', (event) => {
          if (event.payload.participantId === participantIdRef.current) {
            setData(prev => ({ ...prev, stats: event.payload }));
          }
        });
        
        const unlistenRecording = await listen<{ recording: boolean }>('conference:recording:changed', (event) => {
          setData(prev => ({
            ...prev,
            isRecording: event.payload.recording,
            currentRoom: prev.currentRoom 
              ? { ...prev.currentRoom, recording: event.payload.recording }
              : null,
          }));
        });
        
        unlistenRefs.current = [
          unlistenJoin, 
          unlistenLeave, 
          unlistenUpdate, 
          unlistenStats, 
          unlistenRecording
        ];
      } catch (error) {
        log.warn('useVideoConference: Failed to setup Tauri event listeners:', error);
      }
    };
    
    setupListeners();
    
    return () => {
      unlistenRefs.current.forEach(unlisten => unlisten());
      unlistenRefs.current = [];
    };
  }, [realtime]);
  
  // Cleanup on unmount
  useEffect(() => {
    const currentRoom = data.currentRoom;
    const currentParticipantId = participantIdRef.current;
    
    return () => {
      if (currentRoom) {
        leaveRoom(currentRoom.id, currentParticipantId).catch((error) => {
          log.warn('Failed to leave room during cleanup:', error);
        });
      }
    };
  }, [data.currentRoom]);
  
  // ==========================================================================
  // Return
  // ==========================================================================
  
  return {
    // State
    data,
    loading,
    errors,
    
    // Room Actions
    createRoomAction,
    joinRoomAction,
    leaveRoomAction,
    refreshRoom,
    
    // Media Controls
    toggleAudioAction,
    toggleVideoAction,
    startScreenShareAction,
    stopScreenShareAction,
    toggleHandAction,
    
    // Recording
    startRecordingAction,
    stopRecordingAction,
    
    // Utility
    refreshRooms,
    refreshParticipants,
    refreshStreams,
    getICEServersAction,
    
    // Computed
    isInRoom,
    isHost,
    participantsWithVideo,
    participantsWithAudio,
    participantsWithHand,
    activeScreenShares,
    roomCapacity,
  };
}

export default useVideoConference;
