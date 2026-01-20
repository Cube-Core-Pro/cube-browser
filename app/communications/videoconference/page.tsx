"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useRef } from 'react';
import {
  ConferenceRoom,
  Participant,
  RecordingSession,
  ConferenceState,
  ChatMessage,
  LayoutConfig,
  JoinRoomRequest,
  CreateRoomRequest,
  getDefaultRoomSettings,
  sortParticipants,
} from '../../../types/videoconference';
import { VideoGrid } from '../../../components/videoconference/VideoGrid';
import { ParticipantPanel } from '../../../components/videoconference/ParticipantPanel';
import { ChatSidebar } from '../../../components/videoconference/ChatSidebar';
import { ConferenceControls } from '../../../components/videoconference/ConferenceControls';
import { AppLayout } from '@/components/layout';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useTranslation } from '@/hooks/useTranslation';
import './videoconference.css';

// Check if running in Tauri environment
const isTauri = typeof window !== 'undefined' && !!(window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;

// Dynamic imports for Tauri APIs (only when available)
let invoke: (<T>(cmd: string, args?: Record<string, unknown>) => Promise<T>) | null = null;
let listen: ((event: string, handler: (event: { payload: unknown }) => void) => Promise<() => void>) | null = null;

if (isTauri) {
  import('@tauri-apps/api/core').then(mod => { invoke = mod.invoke; });
  import('@tauri-apps/api/event').then(mod => { listen = mod.listen; });
}

// WebRTC configuration for standalone mode
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Safe invoke wrapper that throws if not available
async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!invoke) {
    throw new Error('Tauri invoke not available');
  }
  return invoke<T>(cmd, args);
}

export default function VideoConferencePage() {
  const { t } = useTranslation();
  
  // State
  const [view, setView] = useState<'lobby' | 'conference'>('lobby');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_isTauriReady, setIsTauriReady] = useState(false);
  
  // Lobby state
  const [roomName, setRoomName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(25);
  const [requirePassword, setRequirePassword] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  
  // Conference state
  const [conferenceState, setConferenceState] = useState<ConferenceState>({
    currentRoom: null,
    currentParticipant: null,
    participants: [],
    streams: [],
    localStream: null,
    remoteStreams: new Map(),
    screenStream: null,
    isConnected: false,
    error: null,
  });
  
  // UI state
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    type: 'grid',
    maxTiles: 16,
    showScreenShare: true,
    pinned_participant_id: null,
  });
  const [recording, setRecording] = useState<RecordingSession | null>(null);
  
  // WebRTC state for standalone mode
  const [_peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [offerCode, setOfferCode] = useState<string>('');
  const [answerCode, setAnswerCode] = useState<string>('');
  const [answerCodeInput, setAnswerCodeInput] = useState<string>('');
  const [_showWebRTCPanel, _setShowWebRTCPanel] = useState(false);
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const conferenceContainerRef = useRef<HTMLDivElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Check Tauri availability on mount
  useEffect(() => {
    const checkTauri = async () => {
      if (isTauri) {
        // Wait for dynamic imports to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        setIsTauriReady(!!invoke && !!listen);
      }
    };
    checkTauri();
  }, []);

  // Initialize on mount - only set up listeners if in Tauri
  useEffect(() => {
    if (!isTauri || !listen) {
      log.debug('📹 Running in standalone WebRTC mode (no Tauri backend)');
      return;
    }

    const unlistenPromises: Promise<() => void>[] = [];

    // Set up event listeners (Tauri mode only)
    unlistenPromises.push(
      listen('conference:participant_joined', (event: { payload: unknown }) => {
        const participant = event.payload as Participant;
        setConferenceState(prev => ({
          ...prev,
          participants: sortParticipants([...prev.participants, participant]),
        }));
        addSystemMessage(`${participant.display_name} joined the conference`);
      })
    );

    unlistenPromises.push(
      listen('conference:participant_left', (event: { payload: unknown }) => {
        const participant = event.payload as Participant;
        setConferenceState(prev => ({
          ...prev,
          participants: prev.participants.filter(
            p => p.participant_id !== participant.participant_id
          ),
        }));
        addSystemMessage(`${participant.display_name} left the conference`);
      })
    );

    unlistenPromises.push(
      listen('conference:audio_toggled', (event: { payload: unknown }) => {
        const participant = event.payload as Participant;
        setConferenceState(prev => ({
          ...prev,
          participants: prev.participants.map(p =>
            p.participant_id === participant.participant_id ? participant : p
          ),
        }));
      })
    );

    unlistenPromises.push(
      listen('conference:video_toggled', (event: { payload: unknown }) => {
        const participant = event.payload as Participant;
        setConferenceState(prev => ({
          ...prev,
          participants: prev.participants.map(p =>
            p.participant_id === participant.participant_id ? participant : p
          ),
        }));
      })
    );

    unlistenPromises.push(
      listen('conference:screen_share_started', (event: { payload: unknown }) => {
        const participant = event.payload as Participant;
        setConferenceState(prev => ({
          ...prev,
          participants: prev.participants.map(p =>
            p.participant_id === participant.participant_id ? participant : p
          ),
        }));
        addSystemMessage(`${participant.display_name} started sharing screen`);
      })
    );

    unlistenPromises.push(
      listen('conference:screen_share_stopped', (event: { payload: unknown }) => {
        const participant = event.payload as Participant;
        setConferenceState(prev => ({
          ...prev,
          participants: prev.participants.map(p =>
            p.participant_id === participant.participant_id ? participant : p
          ),
        }));
        addSystemMessage(`${participant.display_name} stopped sharing screen`);
      })
    );

    unlistenPromises.push(
      listen('conference:hand_toggled', (event: { payload: unknown }) => {
        const participant = event.payload as Participant;
        setConferenceState(prev => ({
          ...prev,
          participants: prev.participants.map(p =>
            p.participant_id === participant.participant_id ? participant : p
          ),
        }));
        if (participant.hand_raised) {
          addSystemMessage(`${participant.display_name} raised hand`);
        }
      })
    );

    unlistenPromises.push(
      listen('conference:recording_started', (event: { payload: unknown }) => {
        const rec = event.payload as RecordingSession;
        setRecording(rec);
        addSystemMessage('Recording started');
      })
    );

    unlistenPromises.push(
      listen('conference:recording_stopped', (event: { payload: unknown }) => {
        const rec = event.payload as RecordingSession;
        setRecording(rec);
        addSystemMessage('Recording stopped');
      })
    );

    // Clean up listeners on unmount
    return () => {
      Promise.all(unlistenPromises).then(unlisteners => {
        unlisteners.forEach(unlisten => unlisten());
      });
      
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, []);

  // Add system message to chat
  const addSystemMessage = (content: string) => {
    const message: ChatMessage = {
      id: `system-${Date.now()}`,
      participant_id: 'system',
      participant_name: 'System',
      content,
      timestamp: new Date().toISOString(),
      type: 'system',
    };
    setChatMessages(prev => [...prev, message]);
  };

  // Generate a random access code
  const generateAccessCode = () => {
    return 'CUBE-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Create room - works in both Tauri and standalone mode
  const handleCreateRoom = async () => {
    if (!roomName.trim() || !displayName.trim()) {
      setError('Room name and display name are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Set up local media first
      await setupLocalMedia();

      if (isTauri && invoke) {
        // Tauri mode - use backend
        const settings = getDefaultRoomSettings();
        if (requirePassword && roomPassword) {
          settings.require_password = true;
        }

        const request: CreateRoomRequest = {
          room_name: roomName,
          host_id: 'local-user',
          max_participants: maxParticipants,
          settings,
        };

        const room = await safeInvoke<ConferenceRoom>('conference_create_room', { ...request });
        
        const joinRequest: JoinRoomRequest = {
          access_code: room.access_code,
          display_name: displayName,
          user_id: 'local-user',
        };

        const [updatedRoom, participant] = await safeInvoke<[ConferenceRoom, Participant]>(
          'conference_join_room',
          { ...joinRequest }
        );

        const participants = await safeInvoke<Participant[]>('conference_get_participants', {
          room_id: room.room_id,
        });

        setConferenceState(prev => ({
          ...prev,
          currentRoom: updatedRoom,
          currentParticipant: participant,
          participants: sortParticipants(participants),
          isConnected: true,
        }));

        setView('conference');
        startStatsPolling(room.room_id, participant.participant_id);
      } else {
        // Standalone WebRTC mode
        const newAccessCode = generateAccessCode();
        
        // Create peer connection
        const pc = new RTCPeerConnection(rtcConfig);
        setPeerConnection(pc);

        // Add local stream tracks
        if (conferenceState.localStream) {
          conferenceState.localStream.getTracks().forEach(track => {
            pc.addTrack(track, conferenceState.localStream!);
          });
        }

        // Create data channel
        const dataChannel = pc.createDataChannel('chat');
        dataChannel.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'chat') {
              setChatMessages(prev => [...prev, msg.message]);
            }
          } catch (err) {
            log.error('Data channel message error:', err);
          }
        };

        // Handle ICE candidates
        let iceDone = false;
        pc.onicecandidate = (event) => {
          if (!event.candidate && !iceDone) {
            iceDone = true;
            const code = btoa(JSON.stringify(pc.localDescription));
            setOfferCode(code);
          }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
          const remoteStream = event.streams[0];
          setConferenceState(prev => ({
            ...prev,
            remoteStreams: new Map(prev.remoteStreams).set('remote', remoteStream),
          }));
        };

        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Create mock room and participant for UI
        const mockRoom: ConferenceRoom = {
          room_id: `room-${Date.now()}`,
          room_name: roomName,
          access_code: newAccessCode,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          host_id: 'local-user',
          participant_count: 1,
          max_participants: maxParticipants,
          is_locked: false,
          is_recording: false,
          settings: getDefaultRoomSettings(),
        };

        const mockParticipant: Participant = {
          participant_id: `user-${Date.now()}`,
          user_id: 'local-user',
          display_name: displayName,
          role: 'Host',
          joined_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          is_audio_muted: false,
          is_video_enabled: true,
          is_screen_sharing: false,
          hand_raised: false,
          connection_quality: 100,
          stats: {
            packets_sent: 0,
            packets_received: 0,
            bytes_sent: 0,
            bytes_received: 0,
            packet_loss: 0,
            rtt_ms: 0,
            jitter_ms: 0,
            bitrate: 0,
          },
        };

        setConferenceState(prev => ({
          ...prev,
          currentRoom: mockRoom,
          currentParticipant: mockParticipant,
          participants: [mockParticipant],
          isConnected: true,
        }));

        setView('conference');
        addSystemMessage('Room created! Share the offer code with participants.');

        // Force show offer after timeout
        setTimeout(() => {
          if (!iceDone && pc.localDescription) {
            iceDone = true;
            const code = btoa(JSON.stringify(pc.localDescription));
            setOfferCode(code);
          }
        }, 3000);
      }
    } catch (err) {
      log.error('Create room error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  // Join room
  const handleJoinRoom = async () => {
    if (!accessCode.trim() || !displayName.trim()) {
      setError('Access code and display name are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isTauri) {
        // Tauri mode - use backend
        const request: JoinRoomRequest = {
          access_code: accessCode,
          display_name: displayName,
          password: requirePassword ? roomPassword : undefined,
        };

        const [room, participant] = await safeInvoke<[ConferenceRoom, Participant]>(
          'conference_join_room',
          { ...request }
        );

        // Get participants
        const participants = await safeInvoke<Participant[]>('conference_get_participants', {
          room_id: room.room_id,
        });

        // Set up local media
        await setupLocalMedia();

        // Update state
        setConferenceState(prev => ({
          ...prev,
          currentRoom: room,
          currentParticipant: participant,
          participants: sortParticipants(participants),
          isConnected: true,
        }));

        setView('conference');
        startStatsPolling(room.room_id, participant.participant_id);
      } else {
        // Standalone mode - join via WebRTC with answer
        // Try to parse the access code as an offer
        try {
          const offerData = JSON.parse(atob(accessCode));
          
          // Create peer connection
          const pc = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          });
          peerConnectionRef.current = pc;

          // Get local media first
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, frameRate: 30 },
            audio: true,
          });
          localStreamRef.current = stream;
          setConferenceState(prev => ({ ...prev, localStream: stream }));

          // Add local tracks to connection
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });

          // Handle incoming tracks from remote peer
          pc.ontrack = (event) => {
            log.debug('Received remote track:', event.track.kind);
            const [remoteStream] = event.streams;
            setConferenceState(prev => ({ ...prev, remoteStream }));
          };

          // Generate answer
          let iceDone = false;
          pc.onicecandidate = (event) => {
            if (event.candidate === null && !iceDone) {
              iceDone = true;
              // Generate answer code
              const answerCode = btoa(JSON.stringify(pc.localDescription));
              setAnswerCode(answerCode);
              addSystemMessage('Answer generated! Share this code with the host.');
            }
          };

          pc.oniceconnectionstatechange = () => {
            log.debug('ICE connection state:', pc.iceConnectionState);
            if (pc.iceConnectionState === 'connected') {
              addSystemMessage('Connected to host!');
            } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
              setError('Connection lost');
            }
          };

          // Set remote description (the offer)
          await pc.setRemoteDescription(new RTCSessionDescription(offerData));
          
          // Create and set local answer
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          // Create mock room and participant
          const mockRoom: ConferenceRoom = {
            room_id: `room-${Date.now()}`,
            room_name: 'Video Conference',
            access_code: accessCode.substring(0, 8),
            host_id: 'remote-host',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            max_participants: 10,
            participant_count: 2,
            is_locked: false,
            is_recording: false,
            settings: getDefaultRoomSettings(),
          };

          const mockParticipant: Participant = {
            participant_id: `participant-${Date.now()}`,
            user_id: `user-${Date.now()}`,
            display_name: displayName,
            role: 'Participant',
            joined_at: new Date().toISOString(),
            last_activity: new Date().toISOString(),
            is_audio_muted: false,
            is_video_enabled: true,
            is_screen_sharing: false,
            hand_raised: false,
            connection_quality: 100,
            stats: {
              packets_sent: 0,
              packets_received: 0,
              bytes_sent: 0,
              bytes_received: 0,
              packet_loss: 0,
              rtt_ms: 0,
              jitter_ms: 0,
              bitrate: 0,
            },
          };

          setConferenceState(prev => ({
            ...prev,
            currentRoom: mockRoom,
            currentParticipant: mockParticipant,
            participants: [mockParticipant],
            isConnected: true,
          }));

          setView('conference');
          addSystemMessage('Joined room! Share the answer code with the host to complete connection.');

          // Force show answer after timeout
          setTimeout(() => {
            if (!iceDone && pc.localDescription) {
              iceDone = true;
              const code = btoa(JSON.stringify(pc.localDescription));
              setAnswerCode(code);
            }
          }, 3000);
        } catch (_parseErr) {
          setError('Invalid offer code. Make sure you paste the complete code from the host.');
        }
      }
    } catch (err) {
      log.error('Join room error:', err);
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  // Process answer from participant (host-side)
  const handleProcessAnswer = async (answerCodeInput: string) => {
    if (!peerConnectionRef.current) {
      setError('No active connection. Create a room first.');
      return;
    }

    try {
      const answerData = JSON.parse(atob(answerCodeInput));
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answerData));
      addSystemMessage('Answer processed! Connection established.');
    } catch (err) {
      log.error('Failed to process answer:', err);
      setError('Invalid answer code. Make sure the participant shares the complete code.');
    }
  };

  // Copy code to clipboard
  const copyToClipboard = async (text: string, type: 'offer' | 'answer') => {
    try {
      await navigator.clipboard.writeText(text);
      addSystemMessage(`${type === 'offer' ? 'Offer' : 'Answer'} code copied to clipboard!`);
    } catch (err) {
      log.error('Failed to copy:', err);
    }
  };

  // Set up local media stream
  const setupLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: true,
      });

      setConferenceState(prev => ({ ...prev, localStream: stream }));

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      log.error('Failed to get media:', err);
      setError('Failed to access camera/microphone');
    }
  };

  // Start polling statistics
  const startStatsPolling = (_roomId: string, _participantId: string) => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
    }

    statsIntervalRef.current = setInterval(() => {
      // In production, get real WebRTC stats
      // For now, just keep the connection alive
    }, 5000);
  };

  // Leave conference
  const handleLeaveConference = async () => {
    if (!conferenceState.currentRoom || !conferenceState.currentParticipant) return;

    try {
      await safeInvoke('conference_leave_room', {
        room_id: conferenceState.currentRoom.room_id,
        participant_id: conferenceState.currentParticipant.participant_id,
      });

      // Clean up media
      if (conferenceState.localStream) {
        conferenceState.localStream.getTracks().forEach(track => track.stop());
      }
      if (conferenceState.screenStream) {
        conferenceState.screenStream.getTracks().forEach(track => track.stop());
      }

      // Stop stats polling
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }

      // Reset state
      setConferenceState({
        currentRoom: null,
        currentParticipant: null,
        participants: [],
        streams: [],
        localStream: null,
        remoteStreams: new Map(),
        screenStream: null,
        isConnected: false,
        error: null,
      });

      setView('lobby');
      setChatMessages([]);
    } catch (err) {
      log.error('Failed to leave:', err);
    }
  };

  // Toggle audio
  const handleToggleAudio = async () => {
    if (!conferenceState.currentRoom || !conferenceState.currentParticipant) return;

    const newMuted = !isAudioMuted;
    setIsAudioMuted(newMuted);

    // Mute local stream
    if (conferenceState.localStream) {
      conferenceState.localStream.getAudioTracks().forEach(track => {
        track.enabled = !newMuted;
      });
    }

    try {
      await safeInvoke('conference_toggle_audio', {
        room_id: conferenceState.currentRoom.room_id,
        participant_id: conferenceState.currentParticipant.participant_id,
        muted: newMuted,
      });
    } catch (err) {
      log.error('Failed to toggle audio:', err);
    }
  };

  // Toggle video
  const handleToggleVideo = async () => {
    if (!conferenceState.currentRoom || !conferenceState.currentParticipant) return;

    const newEnabled = !isVideoEnabled;
    setIsVideoEnabled(newEnabled);

    // Enable/disable local stream
    if (conferenceState.localStream) {
      conferenceState.localStream.getVideoTracks().forEach(track => {
        track.enabled = newEnabled;
      });
    }

    try {
      await safeInvoke('conference_toggle_video', {
        room_id: conferenceState.currentRoom.room_id,
        participant_id: conferenceState.currentParticipant.participant_id,
        enabled: newEnabled,
      });
    } catch (err) {
      log.error('Failed to toggle video:', err);
    }
  };

  // Toggle screen share
  const handleToggleScreenShare = async () => {
    if (!conferenceState.currentRoom || !conferenceState.currentParticipant) return;

    if (isScreenSharing) {
      // Stop screen sharing
      if (conferenceState.screenStream) {
        conferenceState.screenStream.getTracks().forEach(track => track.stop());
        setConferenceState(prev => ({ ...prev, screenStream: null }));
      }

      try {
        await safeInvoke('conference_stop_screen_share', {
          room_id: conferenceState.currentRoom.room_id,
          participant_id: conferenceState.currentParticipant.participant_id,
        });
        setIsScreenSharing(false);
      } catch (err) {
        log.error('Failed to stop screen share:', err);
      }
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1920, height: 1080, frameRate: 30 },
          audio: false,
        });

        setConferenceState(prev => ({ ...prev, screenStream: stream }));

        await safeInvoke('conference_start_screen_share', {
          room_id: conferenceState.currentRoom.room_id,
          participant_id: conferenceState.currentParticipant.participant_id,
        });

        setIsScreenSharing(true);

        // Stop sharing when user stops from browser UI
        stream.getVideoTracks()[0].onended = () => {
          handleToggleScreenShare();
        };
      } catch (err) {
        log.error('Failed to start screen share:', err);
        setError('Failed to start screen sharing');
      }
    }
  };

  // Toggle hand
  const handleToggleHand = async () => {
    if (!conferenceState.currentRoom || !conferenceState.currentParticipant) return;

    const newRaised = !handRaised;
    setHandRaised(newRaised);

    try {
      await safeInvoke('conference_toggle_hand', {
        room_id: conferenceState.currentRoom.room_id,
        participant_id: conferenceState.currentParticipant.participant_id,
        raised: newRaised,
      });
    } catch (err) {
      log.error('Failed to toggle hand:', err);
    }
  };

  // Start recording
  const handleStartRecording = async () => {
    if (!conferenceState.currentRoom) return;

    try {
      const recordingId = await safeInvoke<string>('conference_start_recording', {
        room_id: conferenceState.currentRoom.room_id,
        output_path: `/recordings/${conferenceState.currentRoom.room_id}-${Date.now()}.webm`,
      });
      log.debug('Recording started:', recordingId);
    } catch (err) {
      log.error('Failed to start recording:', err);
      setError('Failed to start recording');
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    if (!recording) return;

    try {
      await safeInvoke('conference_stop_recording', {
        recording_id: recording.recording_id,
      });
    } catch (err) {
      log.error('Failed to stop recording:', err);
    }
  };

  // Toggle fullscreen mode
  const handleToggleFullscreen = async () => {
    const container = conferenceContainerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      log.error('Failed to toggle fullscreen:', err);
    }
  };

  // Listen for fullscreen changes (e.g., user presses Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Toggle Picture-in-Picture mode
  const handleTogglePictureInPicture = () => {
    setIsPictureInPicture(!isPictureInPicture);
  };

  // Send chat message
  const handleSendMessage = (content: string) => {
    if (!conferenceState.currentParticipant) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      participant_id: conferenceState.currentParticipant.participant_id,
      participant_name: conferenceState.currentParticipant.display_name,
      content,
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    setChatMessages(prev => [...prev, message]);
  };

  // Render lobby
  if (view === 'lobby') {
    if (isLoading) {
      return (
        <AppLayout tier="elite">
          <div className="videoconference-page">
            <LoadingState
              title={t('communications.videoconference.loading.room')}
              description={t('communications.videoconference.loading.description')}
            />
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout tier="elite">
        <div className="videoconference-page">
        <div className="videoconference-lobby">
          <div className="lobby-header">
            <h1>{t('communications.videoconference.title')}</h1>
            <p>{t('communications.videoconference.subtitle')}</p>
          </div>

          {error && (
            <ErrorState
              title={t('communications.videoconference.errors.title')}
              description={error}
              onRetry={() => setError(null)}
            />
          )}

          <div className="lobby-tabs">
            <button
              className="tab-button active"
              onClick={() => setError(null)}
            >
              {t('communications.videoconference.actions.createRoom')}
            </button>
            <button
              className="tab-button"
              onClick={() => setError(null)}
            >
              {t('communications.videoconference.actions.joinRoom')}
            </button>
          </div>

          <div className="lobby-content">
            <div className="lobby-form">
              <div className="form-group">
                <label>{t('communications.videoconference.form.displayName')}</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={t('communications.videoconference.form.displayNamePlaceholder')}
                  title={t('communications.videoconference.form.displayNameHint')}
                />
              </div>

              <div className="form-group">
                <label>{t('communications.videoconference.form.roomName')}</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder={t('communications.videoconference.form.roomNamePlaceholder')}
                  title={t('communications.videoconference.form.roomNameHint')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxParticipants">{t('communications.videoconference.form.maxParticipants')}</label>
                <select
                  id="maxParticipants"
                  title={t('communications.videoconference.form.maxParticipantsHint')}
                  value={maxParticipants}
                  onChange={e => setMaxParticipants(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={requirePassword}
                    onChange={e => setRequirePassword(e.target.checked)}
                  />
                  <span>{t('communications.videoconference.form.requirePassword')}</span>
                </label>
              </div>

              {requirePassword && (
                <div className="form-group">
                  <label>{t('communications.videoconference.form.password')}</label>
                  <input
                    type="password"
                    value={roomPassword}
                    onChange={e => setRoomPassword(e.target.value)}
                    placeholder={t('communications.videoconference.form.passwordPlaceholder')}
                    title={t('communications.videoconference.form.passwordHint')}
                  />
                </div>
              )}

              <button
                className="create-button"
                onClick={handleCreateRoom}
                disabled={isLoading}
              >
                {isLoading ? t('common.creating') : t('communications.videoconference.actions.createRoom')}
              </button>

              <div className="lobby-divider">
                <span>{t('common.or')}</span>
              </div>

              <div className="form-group">
                <label>{t('communications.videoconference.form.accessCode')}</label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={e => setAccessCode(e.target.value)}
                  placeholder={t('communications.videoconference.form.accessCodePlaceholder')}
                  title={t('communications.videoconference.form.accessCodeHint')}
                  maxLength={6}
                />
              </div>

              <button
                className="join-button"
                onClick={handleJoinRoom}
                disabled={isLoading}
              >
                {isLoading ? t('common.joining') : t('communications.videoconference.actions.joinRoom')}
              </button>

              {/* WebRTC Connection Panel for Standalone Mode */}
              {!isTauri && (offerCode || answerCode) && (
                <div className="webrtc-panel">
                  <h4>🔗 WebRTC Connection</h4>
                  
                  {offerCode && (
                    <div className="code-section">
                      <label>Your Offer Code (share with participant):</label>
                      <div className="code-display">
                        <textarea
                          readOnly
                          value={offerCode}
                          rows={3}
                          title="WebRTC offer code to share with participants"
                        />
                        <button
                          className="copy-button"
                          onClick={() => copyToClipboard(offerCode, 'offer')}
                        >
                          📋 Copy
                        </button>
                      </div>
                      
                      <div className="form-group">
                        <label>Paste Answer Code from participant:</label>
                        <textarea
                          value={answerCodeInput}
                          onChange={e => setAnswerCodeInput(e.target.value)}
                          placeholder="Paste the answer code here..."
                          rows={3}
                          title="Paste the WebRTC answer code from the participant"
                        />
                        <button
                          className="connect-button"
                          onClick={() => handleProcessAnswer(answerCodeInput)}
                          disabled={!answerCodeInput.trim()}
                        >
                          🔗 Connect
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {answerCode && (
                    <div className="code-section">
                      <label>Your Answer Code (share with host):</label>
                      <div className="code-display">
                        <textarea
                          readOnly
                          value={answerCode}
                          rows={3}
                          title="WebRTC answer code to share with the host"
                        />
                        <button
                          className="copy-button"
                          onClick={() => copyToClipboard(answerCode, 'answer')}
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </AppLayout>
    );
  }

  // Render conference
  return (
    <AppLayout tier="elite">
      <div 
        ref={conferenceContainerRef}
        className={`videoconference-page conference-active ${isFullscreen ? 'fullscreen-mode' : ''} ${isPictureInPicture ? 'pip-mode' : ''}`}
      >
      <div className="conference-header">
        <div className="conference-info">
          <h2>{conferenceState.currentRoom?.room_name}</h2>
          <span className="access-code">
            Code: {conferenceState.currentRoom?.access_code}
          </span>
          {recording && (
            <span className="recording-indicator">● Recording</span>
          )}
        </div>
      </div>

      <div className="conference-main">
        <div className="conference-video-area">
          <VideoGrid
            participants={conferenceState.participants}
            currentParticipant={conferenceState.currentParticipant}
            localStream={conferenceState.localStream}
            screenStream={conferenceState.screenStream}
            layoutConfig={layoutConfig}
            onLayoutChange={setLayoutConfig}
            isPictureInPicture={isPictureInPicture}
          />

          <ConferenceControls
            isAudioMuted={isAudioMuted}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            handRaised={handRaised}
            isRecording={recording !== null}
            isHost={conferenceState.currentParticipant?.role === 'Host'}
            isFullscreen={isFullscreen}
            isPictureInPicture={isPictureInPicture}
            participantCount={conferenceState.participants.length}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            onToggleScreenShare={handleToggleScreenShare}
            onToggleHand={handleToggleHand}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onLeave={handleLeaveConference}
            onToggleParticipants={() => setShowParticipants(!showParticipants)}
            onToggleChat={() => setShowChat(!showChat)}
            onToggleSettings={() => setShowSettings(!showSettings)}
            onToggleFullscreen={handleToggleFullscreen}
            onTogglePictureInPicture={handleTogglePictureInPicture}
          />
        </div>

        {showParticipants && (
          <ParticipantPanel
            participants={conferenceState.participants}
            currentParticipant={conferenceState.currentParticipant}
            onClose={() => setShowParticipants(false)}
          />
        )}

        {showChat && (
          <ChatSidebar
            messages={chatMessages}
            currentParticipant={conferenceState.currentParticipant}
            onSendMessage={handleSendMessage}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>
    </div>
    </AppLayout>
  );
}
