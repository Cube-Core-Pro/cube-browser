"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Video, Mic, MicOff, VideoOff, PhoneOff, 
  Users, ScreenShare, Copy, Settings, Maximize, Minimize,
  RefreshCw, UserPlus, Monitor, MonitorOff, Hand,
  Loader2, MessageSquare, Send, X, Check,
  Smile, QrCode, Circle, Square, PenTool,
  PictureInPicture, UserMinus, Image as ImageIcon, Palette, Eraser,
  Undo2, Redo2, Download, Trash2, Type, Minus,
  RectangleHorizontal, CircleIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/hooks/use-toast';
import * as videoConferenceService from '@/lib/services/videoConferenceService';
import type { ConferenceRoom, Participant as ServiceParticipant } from '@/lib/services/videoConferenceService';
import { 
  VirtualBackgroundService, 
  BackgroundType, 
  type BackgroundConfig 
} from '@/lib/services/virtualBackgroundService';
import { 
  WhiteboardService, 
  ToolType, 
  type DrawingSettings, 
  type WhiteboardData 
} from '@/lib/services/whiteboardService';
import { 
  WebRTCConnectionService, 
  type ConnectionConfig, 
  type MediaConfig 
} from '@/lib/services/webrtcConnectionService';
import './video-pro.css';

// ==================== Interfaces ====================
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
}

interface Reaction {
  id: string;
  emoji: string;
  senderId: string;
  senderName: string;
}

interface WaitingParticipant {
  id: string;
  name: string;
  timestamp: Date;
}

interface LocalParticipant {
  id: string;
  name: string;
  roomId: string;
  isHost: boolean;
}

interface PeerConnection {
  participantId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
  dataChannel?: RTCDataChannel;
}

interface VideoLayoutType {
  type: 'grid' | 'speaker' | 'spotlight';
}

interface RemoteStream {
  participantId: string;
  stream: MediaStream;
  participantName: string;
}

// ==================== Constants ====================
const REACTIONS = ['👏', '🎉', '❤️', '😂', '👍', '🔥', '😮', '🤔', '👎', '💯'];

// Virtual background options
const VIRTUAL_BACKGROUNDS: BackgroundConfig[] = [
  { type: BackgroundType.NONE },
  { type: BackgroundType.BLUR, blurStrength: 10 },
  { type: BackgroundType.BLUR, blurStrength: 20 },
  { type: BackgroundType.COLOR, color: '#1a1a24' },
  { type: BackgroundType.COLOR, color: '#0a3d62' },
  { type: BackgroundType.COLOR, color: '#1e3a29' },
  { type: BackgroundType.IMAGE, imageUrl: '/backgrounds/office.jpg' },
  { type: BackgroundType.IMAGE, imageUrl: '/backgrounds/nature.jpg' },
  { type: BackgroundType.IMAGE, imageUrl: '/backgrounds/space.jpg' },
  { type: BackgroundType.IMAGE, imageUrl: '/backgrounds/beach.jpg' },
];

// Whiteboard colors
const WHITEBOARD_COLORS = [
  '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'
];

// Whiteboard brush sizes
const BRUSH_SIZES = [2, 4, 8, 12, 20];

// Signaling server URL
const SIGNALING_SERVER_URL = process.env.NEXT_PUBLIC_SIGNALING_SERVER || 'ws://localhost:8080';

// ==================== Main Component ====================
export default function VideoConferenceProPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // ==================== State ====================
  // Room state
  const [roomId, setRoomId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [currentRoom, setCurrentRoom] = useState<ConferenceRoom | null>(null);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [participants, setParticipants] = useState<ServiceParticipant[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lobbyTab, setLobbyTab] = useState<'create' | 'join'>('create');
  
  // Media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [handRaised, setHandRaised] = useState(false);
  
  // UI state
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Invite modal state
  const [inviteTab, setInviteTab] = useState<'quick' | 'contacts' | 'calendar' | 'advanced'>('quick');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [meetingDuration, setMeetingDuration] = useState(60);
  const [meetingSettings, setMeetingSettings] = useState({
    waitingRoom: true,
    requirePassword: false,
    lockMeeting: false,
    allowScreenShare: true,
    allowChat: true,
    allowRecording: false,
    muteOnEntry: true,
    autoRecord: false,
    enableTranscription: false,
    maxParticipants: 0
  });
  const [isPipMode, setIsPipMode] = useState(false);
  const [layout, setLayout] = useState<VideoLayoutType>({ type: 'grid' });
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [_recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  
  // Waiting room state
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false);
  const [waitingParticipants, setWaitingParticipants] = useState<WaitingParticipant[]>([]);
  const [inWaitingRoom, setInWaitingRoom] = useState(false);
  
  // Reactions state
  const [activeReactions, setActiveReactions] = useState<Reaction[]>([]);
  
  // Call timer
  const [callDuration, setCallDuration] = useState(0);
  
  // Virtual background
  const [selectedBackground, setSelectedBackground] = useState<BackgroundConfig>({ type: BackgroundType.NONE });
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);
  
  // Whiteboard state
  const [whiteboardTool, setWhiteboardTool] = useState<ToolType>(ToolType.PEN);
  const [whiteboardColor, setWhiteboardColor] = useState('#ffffff');
  const [whiteboardBrushSize, setWhiteboardBrushSize] = useState(4);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // WebRTC state
  const [_remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(new Map());
  const [signalingConnected, setSignalingConnected] = useState(false);
  
  // QR Code
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // WebRTC state (legacy)
  const [peerConnections, setPeerConnections] = useState<Map<string, PeerConnection>>(new Map());
  
  // ==================== Refs ====================
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const whiteboardCanvasRef = useRef<HTMLCanvasElement>(null);
  const _remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  
  // Service Refs
  const virtualBackgroundServiceRef = useRef<VirtualBackgroundService | null>(null);
  const whiteboardServiceRef = useRef<WhiteboardService | null>(null);
  const webrtcServiceRef = useRef<WebRTCConnectionService | null>(null);
  const signalingSocketRef = useRef<WebSocket | null>(null);
  
  // ==================== Effects ====================
  
  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInCall]);
  
  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  // Chat scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // Generate QR code when room is created
  useEffect(() => {
    if (currentRoom?.id) {
      // Use consistent URL format between Tauri and Chrome Extension
      // Production URL: https://cubeai.tools/video?room=
      // Development URL: window.location.origin/video?room=
      const isDevelopment = process.env.NODE_ENV === 'development';
      const baseUrl = isDevelopment ? window.location.origin : 'https://cubeai.tools';
      const joinUrl = `${baseUrl}/video?room=${currentRoom.id}`;
      QRCode.toDataURL(joinUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      }).then(setQrCodeUrl).catch(log.error);
    }
  }, [currentRoom?.id]);
  
  // Mark messages as read when chat is open
  useEffect(() => {
    if (showChat) {
      setUnreadMessages(0);
    }
  }, [showChat]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up media streams
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      // Clean up peer connections
      peerConnections.forEach(pc => {
        if (pc.dataChannel) pc.dataChannel.close();
        pc.connection.close();
      });
      // Stop recording if active
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Check for room ID in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam.toUpperCase());
      setLobbyTab('join');
    }
  }, []);
  
  // ==================== Service Initialization ====================
  
  // Initialize Virtual Background Service
  useEffect(() => {
    virtualBackgroundServiceRef.current = new VirtualBackgroundService();
    return () => {
      if (virtualBackgroundServiceRef.current) {
        virtualBackgroundServiceRef.current.cleanup();
      }
    };
  }, []);
  
  // Initialize Whiteboard Service
  useEffect(() => {
    if (showWhiteboard && whiteboardCanvasRef.current) {
      if (!whiteboardServiceRef.current) {
        whiteboardServiceRef.current = new WhiteboardService(whiteboardCanvasRef.current);
        
        // Set up remote draw callback for collaboration
        whiteboardServiceRef.current.setOnRemoteDrawCallback((data: WhiteboardData) => {
          // Send whiteboard data via WebRTC data channel
          if (webrtcServiceRef.current) {
            webrtcServiceRef.current.sendData({
              type: 'whiteboard',
              data: data
            });
          }
        });
      }
      
      // Update settings when they change
      const settings: DrawingSettings = {
        tool: whiteboardTool,
        color: whiteboardColor,
        size: whiteboardBrushSize,
        opacity: 1
      };
      whiteboardServiceRef.current.setSettings(settings);
    }
    
    return () => {
      // Don't cleanup on every toggle, only on unmount
    };
  }, [showWhiteboard, whiteboardTool, whiteboardColor, whiteboardBrushSize]);
  
  // Apply Virtual Background when changed
  useEffect(() => {
    const applyBackground = async () => {
      if (!localStream || !virtualBackgroundServiceRef.current) return;
      
      if (selectedBackground.type === BackgroundType.NONE) {
        // Remove background processing, use original stream
        setProcessedStream(null);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      } else {
        try {
          const processed = await virtualBackgroundServiceRef.current.createProcessedStream(
            localStream,
            selectedBackground
          );
          setProcessedStream(processed);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = processed;
          }
        } catch (error) {
          log.error('Failed to apply virtual background:', error);
          toast({
            title: 'Background Error',
            description: 'Could not apply virtual background',
            variant: 'destructive',
          });
        }
      }
    };
    
    applyBackground();
  }, [selectedBackground, localStream, toast]);
  
  // ==================== Signaling Server Connection ====================
  
  const connectToSignalingServer = useCallback(() => {
    if (signalingSocketRef.current?.readyState === WebSocket.OPEN) return;
    
    const socket = new WebSocket(SIGNALING_SERVER_URL);
    
    socket.onopen = () => {
      log.debug('Connected to signaling server');
      setSignalingConnected(true);
      
      // Join the room on signaling server
      if (currentRoom && localParticipant) {
        socket.send(JSON.stringify({
          type: 'join',
          roomId: currentRoom.id,
          participantId: localParticipant.id,
          participantName: localParticipant.name,
          isHost: localParticipant.isHost
        }));
      }
    };
    
    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      await handleSignalingMessage(message);
    };
    
    socket.onclose = () => {
      log.debug('Disconnected from signaling server');
      setSignalingConnected(false);
      // Attempt reconnection after 3 seconds
      setTimeout(() => {
        if (isInCall) {
          connectToSignalingServer();
        }
      }, 3000);
    };
    
    socket.onerror = (error) => {
      log.error('Signaling server error:', error);
    };
    
    signalingSocketRef.current = socket;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom, localParticipant, isInCall]);
  
  const handleSignalingMessage = async (message: { 
    type: string; 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any 
  }) => {
    switch (message.type) {
      case 'participant-joined': {
        // New participant joined, create peer connection
        if (message.participantId !== localParticipant?.id) {
          await createPeerConnectionForParticipant(message.participantId, message.participantName, true);
        }
        break;
      }
      
      case 'participant-left': {
        // Participant left, clean up connection
        removePeerConnection(message.participantId);
        break;
      }
      
      case 'offer': {
        // Received offer from another peer
        await handleOffer(message.fromParticipant, message.offer);
        break;
      }
      
      case 'answer': {
        // Received answer to our offer
        await handleAnswer(message.fromParticipant, message.answer);
        break;
      }
      
      case 'ice-candidate': {
        // Received ICE candidate
        await handleIceCandidate(message.fromParticipant, message.candidate);
        break;
      }
      
      case 'chat': {
        // Received chat message
        const chatMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          senderId: message.fromParticipant,
          senderName: message.fromName,
          text: message.text,
          timestamp: new Date(message.timestamp),
          isOwn: false
        };
        setChatMessages(prev => [...prev, chatMsg]);
        if (!showChat) {
          setUnreadMessages(prev => prev + 1);
        }
        break;
      }
      
      case 'whiteboard': {
        // Received whiteboard data
        if (whiteboardServiceRef.current && message.data) {
          whiteboardServiceRef.current.receiveRemoteData(message.data);
        }
        break;
      }
      
      case 'reaction': {
        // Received reaction
        const reaction: Reaction = {
          id: `reaction_${Date.now()}`,
          emoji: message.emoji,
          senderId: message.fromParticipant,
          senderName: message.fromName
        };
        setActiveReactions(prev => [...prev, reaction]);
        setTimeout(() => {
          setActiveReactions(prev => prev.filter(r => r.id !== reaction.id));
        }, 3000);
        break;
      }
      
      case 'room-participants': {
        // Update participants list
        // This is handled by the existing polling mechanism
        break;
      }
    }
  };
  
  // ==================== WebRTC Peer Connection Management ====================
  
  const createPeerConnectionForParticipant = async (
    participantId: string, 
    participantName: string, 
    isInitiator: boolean
  ) => {
    const config: ConnectionConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
      enableDataChannel: true,
      dataChannelConfig: {
        label: 'cube-data',
        ordered: true
      }
    };
    
    const mediaConfig: MediaConfig = {
      video: isVideoOn,
      audio: !isMuted,
    };
    
    const service = new WebRTCConnectionService(config, mediaConfig);
    
    // Set up event handlers
    service.onTrack((stream) => {
      log.debug('Received remote track from:', participantId);
      const newRemoteStream: RemoteStream = {
        participantId,
        stream,
        participantName
      };
      setRemoteStreams(prev => new Map(prev).set(participantId, newRemoteStream));
    });
    
    service.onIceCandidate((candidate) => {
      // Send ICE candidate to peer via signaling server
      if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
        signalingSocketRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          toParticipant: participantId,
          candidate: candidate.toJSON()
        }));
      }
    });
    
    service.onConnectionStateChange((connected) => {
      log.debug(`Connection to ${participantId}: ${connected ? 'connected' : 'disconnected'}`);
      if (!connected) {
        // Handle reconnection logic
        toast({
          title: 'Connection Issue',
          description: `Connection to ${participantName} lost`,
          variant: 'destructive',
        });
      }
    });
    
    service.onDataChannelMessage((data) => {
      handleDataChannelMessage(participantId, data);
    });
    
    // Add local stream
    const streamToSend = processedStream || localStream;
    if (streamToSend) {
      service.addStream(streamToSend);
    }
    
    // Store the peer connection
    const pc: PeerConnection = {
      participantId,
      connection: service.getConnection()!,
      dataChannel: service.getDataChannel() || undefined
    };
    setPeerConnections(prev => new Map(prev).set(participantId, pc));
    
    // If initiator, create and send offer
    if (isInitiator) {
      try {
        const offer = await service.createSimpleOffer();
        if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
          signalingSocketRef.current.send(JSON.stringify({
            type: 'offer',
            toParticipant: participantId,
            offer: offer
          }));
        }
      } catch (error) {
        log.error('Failed to create offer:', error);
      }
    }
    
    return service;
  };
  
  const handleOffer = async (fromParticipant: string, offer: RTCSessionDescriptionInit) => {
    // Find or create peer connection for this participant
    let pc = peerConnections.get(fromParticipant);
    
    if (!pc) {
      // Need to find participant name from participants list
      const participant = participants.find(p => p.id === fromParticipant);
      await createPeerConnectionForParticipant(
        fromParticipant, 
        participant?.name || 'Unknown', 
        false
      );
      pc = peerConnections.get(fromParticipant);
    }
    
    if (pc) {
      try {
        await pc.connection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.connection.createAnswer();
        await pc.connection.setLocalDescription(answer);
        
        // Send answer via signaling server
        if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
          signalingSocketRef.current.send(JSON.stringify({
            type: 'answer',
            toParticipant: fromParticipant,
            answer: answer
          }));
        }
      } catch (error) {
        log.error('Error handling offer:', error);
      }
    }
  };
  
  const handleAnswer = async (fromParticipant: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnections.get(fromParticipant);
    if (pc) {
      try {
        await pc.connection.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        log.error('Error handling answer:', error);
      }
    }
  };
  
  const handleIceCandidate = async (fromParticipant: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnections.get(fromParticipant);
    if (pc) {
      try {
        await pc.connection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        log.error('Error adding ICE candidate:', error);
      }
    }
  };
  
  const removePeerConnection = (participantId: string) => {
    const pc = peerConnections.get(participantId);
    if (pc) {
      if (pc.dataChannel) pc.dataChannel.close();
      pc.connection.close();
      setPeerConnections(prev => {
        const newMap = new Map(prev);
        newMap.delete(participantId);
        return newMap;
      });
    }
    
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(participantId);
      return newMap;
    });
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDataChannelMessage = (fromParticipant: string, data: any) => {
    if (data.type === 'whiteboard' && whiteboardServiceRef.current) {
      whiteboardServiceRef.current.receiveRemoteData(data.data);
    } else if (data.type === 'chat') {
      const chatMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        senderId: fromParticipant,
        senderName: data.senderName,
        text: data.text,
        timestamp: new Date(),
        isOwn: false
      };
      setChatMessages(prev => [...prev, chatMsg]);
      if (!showChat) {
        setUnreadMessages(prev => prev + 1);
      }
    }
  };
  
  // Connect to signaling server when in call
  useEffect(() => {
    if (isInCall && currentRoom && localParticipant) {
      connectToSignalingServer();
    }
    
    return () => {
      if (signalingSocketRef.current) {
        signalingSocketRef.current.close();
        signalingSocketRef.current = null;
      }
    };
  }, [isInCall, currentRoom, localParticipant, connectToSignalingServer]);
  
  // ==================== Utility Functions ====================
  
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const generateRoomId = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  const generateParticipantId = (): string => {
    return `participant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };
  
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const getGridClass = (): string => {
    const total = participants.length + 1;
    if (total <= 1) return 'grid-1';
    if (total <= 2) return 'grid-2';
    if (total <= 4) return 'grid-4';
    if (total <= 6) return 'grid-6';
    return 'grid-9';
  };
  
  // ==================== Cleanup Functions ====================
  
  const cleanupMediaStreams = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
  };
  
  const cleanupPeerConnections = () => {
    peerConnections.forEach(pc => {
      if (pc.dataChannel) pc.dataChannel.close();
      pc.connection.close();
    });
    setPeerConnections(new Map());
  };
  
  // ==================== Room Functions ====================
  
  const handleGenerateRoomId = () => {
    const id = generateRoomId();
    setRoomId(id);
    navigator.clipboard.writeText(id);
    toast({
      title: 'Room ID Generated',
      description: `${id} copied to clipboard`,
    });
  };
  
  const createRoom = async () => {
    if (!roomId.trim() || !displayName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter room ID and your name',
        variant: 'destructive',
      });
      return;
    }
    
    setIsConnecting(true);
    try {
      // Get media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create room on backend
      const room = await videoConferenceService.createRoom(
        roomId,
        displayName,
        50 // Max participants
      );
      
      const participantId = generateParticipantId();
      
      // Join room
      await videoConferenceService.joinRoom(room.id, participantId, displayName);
      
      setCurrentRoom(room);
      setLocalParticipant({
        id: participantId,
        name: displayName,
        roomId: room.id,
        isHost: true,
      });
      setIsInCall(true);
      setCallDuration(0);
      
      toast({
        title: 'Room Created',
        description: `Room ${roomId} is ready. Share the code to invite others.`,
      });
      
      // Start polling for participants
      startParticipantPolling();
    } catch (error) {
      log.error('Failed to create room:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create room',
        variant: 'destructive',
      });
      cleanupMediaStreams();
    } finally {
      setIsConnecting(false);
    }
  };
  
  const joinRoom = async () => {
    if (!roomId.trim() || !displayName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter room ID and your name',
        variant: 'destructive',
      });
      return;
    }
    
    setIsConnecting(true);
    try {
      // Get media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Get room info
      const room = await videoConferenceService.getRoom(roomId);
      const participantId = generateParticipantId();
      
      // Check if waiting room is enabled (simulated)
      if (waitingRoomEnabled && !localParticipant?.isHost) {
        setInWaitingRoom(true);
        toast({
          title: 'Waiting Room',
          description: 'Please wait for the host to admit you.',
        });
        return;
      }
      
      // Join room
      await videoConferenceService.joinRoom(room.id, participantId, displayName);
      
      setCurrentRoom(room);
      setLocalParticipant({
        id: participantId,
        name: displayName,
        roomId: room.id,
        isHost: false,
      });
      setIsInCall(true);
      setCallDuration(0);
      
      toast({
        title: 'Joined Room',
        description: `Connected to ${roomId}`,
      });
      
      // Start polling for participants
      startParticipantPolling();
    } catch (error) {
      log.error('Failed to join room:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Room not found or unable to join',
        variant: 'destructive',
      });
      cleanupMediaStreams();
    } finally {
      setIsConnecting(false);
    }
  };
  
  const startParticipantPolling = useCallback(() => {
    const interval = setInterval(async () => {
      if (!currentRoom?.id) return;
      
      try {
        const roomParticipants = await videoConferenceService.getParticipants(currentRoom.id);
        setParticipants(roomParticipants.filter(p => p.id !== localParticipant?.id));
      } catch (error) {
        log.error('Failed to fetch participants:', error);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [currentRoom?.id, localParticipant?.id]);
  
  useEffect(() => {
    if (isInCall && currentRoom) {
      const cleanup = startParticipantPolling();
      return cleanup;
    }
  }, [isInCall, currentRoom, startParticipantPolling]);
  
  const endCall = async () => {
    try {
      if (currentRoom && localParticipant) {
        await videoConferenceService.leaveRoom(currentRoom.id, localParticipant.id);
      }
    } catch (error) {
      log.error('Failed to leave room:', error);
    }
    
    // Stop recording if active
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
    
    cleanupMediaStreams();
    cleanupPeerConnections();
    
    setIsInCall(false);
    setCurrentRoom(null);
    setLocalParticipant(null);
    setParticipants([]);
    setCallDuration(0);
    setChatMessages([]);
    setActiveReactions([]);
    setShowChat(false);
    setShowParticipants(false);
    setShowSettings(false);
    setShowQR(false);
    
    toast({ title: 'Call Ended' });
  };
  
  // ==================== Media Control Functions ====================
  
  const toggleMute = async () => {
    if (localStream && currentRoom && localParticipant) {
      const newMutedState = !isMuted;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
      setIsMuted(newMutedState);
      
      try {
        await videoConferenceService.toggleAudio(
          currentRoom.id,
          localParticipant.id,
          !newMutedState
        );
      } catch (error) {
        log.error('Failed to toggle audio:', error);
      }
    }
  };
  
  const toggleVideo = async () => {
    if (localStream && currentRoom && localParticipant) {
      const newVideoState = !isVideoOn;
      localStream.getVideoTracks().forEach(track => {
        track.enabled = newVideoState;
      });
      setIsVideoOn(newVideoState);
      
      try {
        await videoConferenceService.toggleVideo(
          currentRoom.id,
          localParticipant.id,
          newVideoState
        );
      } catch (error) {
        log.error('Failed to toggle video:', error);
      }
    }
  };
  
  const toggleScreenShare = async () => {
    if (!currentRoom || !localParticipant) return;
    
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        
        setScreenStream(stream);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);
        
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          stopScreenShare();
        });
        
        await videoConferenceService.startScreenShare(currentRoom.id, localParticipant.id);
        
        toast({
          title: 'Screen Sharing',
          description: 'Started sharing your screen',
        });
      } catch (error) {
        log.error('Failed to share screen:', error);
        toast({
          title: 'Error',
          description: 'Could not share screen',
          variant: 'destructive',
        });
      }
    } else {
      await stopScreenShare();
    }
  };
  
  const stopScreenShare = async () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);
    
    if (currentRoom && localParticipant) {
      try {
        await videoConferenceService.stopScreenShare(currentRoom.id, localParticipant.id);
      } catch (error) {
        log.error('Failed to stop screen share:', error);
      }
    }
    
    toast({
      title: 'Screen Sharing',
      description: 'Stopped sharing',
    });
  };
  
  const toggleHandRaise = async () => {
    if (!currentRoom || !localParticipant) return;
    
    const newHandState = !handRaised;
    setHandRaised(newHandState);
    
    try {
      await videoConferenceService.toggleHand(currentRoom.id, localParticipant.id, newHandState);
      toast({
        title: newHandState ? 'Hand Raised' : 'Hand Lowered',
        description: newHandState ? 'You raised your hand' : 'You lowered your hand',
      });
    } catch (error) {
      log.error('Failed to toggle hand:', error);
    }
  };
  
  // ==================== Recording Functions ====================
  
  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };
  
  const startRecording = async () => {
    if (!localStream) return;
    
    try {
      const streams: MediaStream[] = [localStream];
      if (screenStream) streams.push(screenStream);
      
      const combinedStream = new MediaStream();
      streams.forEach(s => {
        s.getTracks().forEach(track => combinedStream.addTrack(track));
      });
      
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CUBE-Meeting-${roomId}-${new Date().toISOString()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecordedChunks([]);
      };
      
      recorder.start(1000);
      setMediaRecorder(recorder);
      setRecordedChunks(chunks);
      setIsRecording(true);
      setRecordingTime(0);
      
      toast({
        title: 'Recording Started',
        description: 'Meeting is now being recorded',
      });
    } catch (error) {
      log.error('Failed to start recording:', error);
      toast({
        title: 'Error',
        description: 'Could not start recording',
        variant: 'destructive',
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      toast({
        title: 'Recording Stopped',
        description: 'Recording saved to downloads',
      });
    }
  };
  
  // ==================== Chat Functions ====================
  
  const sendChatMessage = () => {
    if (!chatInput.trim() || !localParticipant) return;
    
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: localParticipant.id,
      senderName: localParticipant.name,
      text: chatInput.trim(),
      timestamp: new Date(),
      isOwn: true,
    };
    
    setChatMessages(prev => [...prev, message]);
    setChatInput('');
    
    // Send via signaling server
    if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
      signalingSocketRef.current.send(JSON.stringify({
        type: 'chat',
        text: chatInput.trim(),
        timestamp: new Date().toISOString()
      }));
    }
    
    // Also send via WebRTC data channels for direct peer communication
    peerConnections.forEach(pc => {
      if (pc.dataChannel && pc.dataChannel.readyState === 'open') {
        pc.dataChannel.send(JSON.stringify({
          type: 'chat',
          senderName: localParticipant.name,
          text: chatInput.trim()
        }));
      }
    });
  };
  
  // ==================== Reaction Functions ====================
  
  const sendReaction = (emoji: string) => {
    if (!localParticipant) return;
    
    const reaction: Reaction = {
      id: `reaction_${Date.now()}`,
      emoji,
      senderId: localParticipant.id,
      senderName: localParticipant.name,
    };
    
    setActiveReactions(prev => [...prev, reaction]);
    
    // Remove reaction after animation
    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
    
    // Send via signaling server
    if (signalingSocketRef.current?.readyState === WebSocket.OPEN) {
      signalingSocketRef.current.send(JSON.stringify({
        type: 'reaction',
        emoji
      }));
    }
    
    setShowReactions(false);
  };
  
  // ==================== Whiteboard Functions ====================
  
  const toggleWhiteboard = () => {
    setShowWhiteboard(!showWhiteboard);
  };
  
  const handleWhiteboardUndo = () => {
    if (whiteboardServiceRef.current) {
      whiteboardServiceRef.current.undo();
    }
  };
  
  const handleWhiteboardRedo = () => {
    if (whiteboardServiceRef.current) {
      whiteboardServiceRef.current.redo();
    }
  };
  
  const handleWhiteboardClear = () => {
    if (whiteboardServiceRef.current) {
      whiteboardServiceRef.current.clear();
    }
  };
  
  const handleWhiteboardExport = () => {
    if (whiteboardServiceRef.current) {
      const dataUrl = whiteboardServiceRef.current.exportToPNG();
      const link = document.createElement('a');
      link.download = `whiteboard-${roomId}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: 'Whiteboard Exported',
        description: 'Whiteboard saved as PNG',
      });
    }
  };
  
  // ==================== Virtual Background Functions ====================
  
  const handleBackgroundChange = (background: BackgroundConfig) => {
    setSelectedBackground(background);
    setShowBackgroundPicker(false);
    
    const getBackgroundName = () => {
      switch (background.type) {
        case BackgroundType.NONE: return 'None';
        case BackgroundType.BLUR: return `Blur (${background.blurStrength})`;
        case BackgroundType.COLOR: return `Color (${background.color})`;
        case BackgroundType.IMAGE: return 'Image';
        case BackgroundType.VIDEO: return 'Video';
        default: return 'Unknown';
      }
    };
    
    toast({
      title: 'Background Changed',
      description: `Virtual background: ${getBackgroundName()}`,
    });
  };
  
  // ==================== Waiting Room Functions ====================
  
  const admitParticipant = (participantId: string) => {
    setWaitingParticipants(prev => prev.filter(p => p.id !== participantId));
    toast({
      title: 'Participant Admitted',
      description: 'Participant has been admitted to the meeting',
    });
  };
  
  const denyParticipant = (participantId: string) => {
    setWaitingParticipants(prev => prev.filter(p => p.id !== participantId));
    toast({
      title: 'Participant Denied',
      description: 'Participant has been denied entry',
    });
  };
  
  // ==================== Fullscreen & PiP Functions ====================
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  const togglePipMode = () => {
    setIsPipMode(!isPipMode);
  };
  
  // ==================== Copy & Share Functions ====================
  
  const copyRoomId = () => {
    if (currentRoom?.id) {
      navigator.clipboard.writeText(currentRoom.id);
      toast({
        title: 'Copied',
        description: 'Room ID copied to clipboard',
      });
    }
  };
  
  const _copyShareLink = () => {
    const link = `${window.location.origin}/video?room=${currentRoom?.id}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied',
      description: 'Share link copied to clipboard',
    });
  };
  
  // ==================== Enterprise Share Functions ====================
  
  const getJoinUrl = () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const baseUrl = isDevelopment ? window.location.origin : 'https://cubeai.tools';
    return `${baseUrl}/video?room=${currentRoom?.id || ''}`;
  };
  
  const getInviteMessage = () => {
    let message = `🎥 Join my CUBE Nexum Video Call!\n\n`;
    message += `📋 Meeting ID: ${currentRoom?.id}\n`;
    message += `🔗 Join Link: ${getJoinUrl()}\n`;
    if (meetingPassword) {
      message += `🔐 Password: ${meetingPassword}\n`;
    }
    message += `\n📱 Or scan the QR code in the meeting invite.`;
    return message;
  };
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };
  
  const copyAllInfo = () => {
    navigator.clipboard.writeText(getInviteMessage());
    toast({
      title: 'Copied',
      description: 'All meeting info copied to clipboard',
    });
  };
  
  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join my CUBE Nexum Video Call');
    const body = encodeURIComponent(getInviteMessage());
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };
  
  const shareViaSMS = () => {
    const message = encodeURIComponent(getInviteMessage());
    window.open(`sms:?body=${message}`);
  };
  
  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(getInviteMessage());
    window.open(`https://wa.me/?text=${message}`);
  };
  
  const shareViaTelegram = () => {
    const message = encodeURIComponent(getInviteMessage());
    window.open(`https://t.me/share/url?url=${encodeURIComponent(getJoinUrl())}&text=${message}`);
  };
  
  const shareViaSlack = () => {
    navigator.clipboard.writeText(getInviteMessage());
    toast({
      title: 'Copied for Slack',
      description: 'Invite copied - paste it in Slack',
    });
  };
  
  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `CUBE-Meeting-${currentRoom?.id || 'QR'}.png`;
      link.href = qrCodeUrl;
      link.click();
      toast({
        title: 'QR Downloaded',
        description: 'QR code saved as PNG',
      });
    }
  };
  
  const printQRCode = () => {
    if (qrCodeUrl) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>CUBE Nexum Meeting QR Code</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              .qr-container {
                text-align: center;
                padding: 40px;
                border: 2px solid #8b5cf6;
                border-radius: 16px;
              }
              h1 { color: #8b5cf6; margin-bottom: 20px; }
              img { margin: 20px 0; }
              .meeting-id { font-size: 1.5rem; font-weight: bold; margin-top: 16px; }
              .instructions { color: #666; margin-top: 12px; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>📹 Join CUBE Nexum Meeting</h1>
              <img src="${qrCodeUrl}" width="250" height="250" alt="QR Code">
              <div class="meeting-id">Meeting ID: ${currentRoom?.id}</div>
              <p class="instructions">Scan the QR code with your phone camera to join instantly</p>
            </div>
            <script>window.onload = () => { window.print(); }</script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };
  
  const generateMeetingPassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    setMeetingPassword(password);
  };
  
  const addToGoogleCalendar = () => {
    const start = scheduledTime ? new Date(scheduledTime) : new Date();
    const end = new Date(start.getTime() + meetingDuration * 60000);
    
    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', 'CUBE Nexum Video Meeting');
    url.searchParams.set('dates', `${formatDate(start)}/${formatDate(end)}`);
    url.searchParams.set('details', getInviteMessage());
    url.searchParams.set('location', getJoinUrl());
    
    window.open(url.toString());
    toast({ title: 'Google Calendar', description: 'Opening Google Calendar...' });
  };
  
  const addToOutlookCalendar = () => {
    const start = scheduledTime ? new Date(scheduledTime) : new Date();
    const end = new Date(start.getTime() + meetingDuration * 60000);
    
    const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    url.searchParams.set('subject', 'CUBE Nexum Video Meeting');
    url.searchParams.set('startdt', start.toISOString());
    url.searchParams.set('enddt', end.toISOString());
    url.searchParams.set('body', getInviteMessage());
    url.searchParams.set('location', getJoinUrl());
    
    window.open(url.toString());
    toast({ title: 'Outlook Calendar', description: 'Opening Outlook Calendar...' });
  };
  
  const addToYahooCalendar = () => {
    const start = scheduledTime ? new Date(scheduledTime) : new Date();
    
    const formatDate = (d: Date) => d.toISOString().slice(0, 19).replace(/-|:/g, '');
    
    const url = new URL('https://calendar.yahoo.com/');
    url.searchParams.set('v', '60');
    url.searchParams.set('title', 'CUBE Nexum Video Meeting');
    url.searchParams.set('st', formatDate(start));
    const hrs = Math.floor(meetingDuration / 60).toString().padStart(2, '0');
    const mins = (meetingDuration % 60).toString().padStart(2, '0');
    url.searchParams.set('dur', `${hrs}${mins}`);
    url.searchParams.set('desc', getInviteMessage());
    url.searchParams.set('in_loc', getJoinUrl());
    
    window.open(url.toString());
    toast({ title: 'Yahoo Calendar', description: 'Opening Yahoo Calendar...' });
  };
  
  const downloadICSFile = () => {
    const start = scheduledTime ? new Date(scheduledTime) : new Date();
    const end = new Date(start.getTime() + meetingDuration * 60000);
    
    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CUBE Nexum//Video Conference//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      'SUMMARY:CUBE Nexum Video Meeting',
      `DESCRIPTION:${getInviteMessage().replace(/\n/g, '\\n')}`,
      `URL:${getJoinUrl()}`,
      `LOCATION:${getJoinUrl()}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `CUBE-Meeting-${currentRoom?.id}.ics`;
    link.click();
    
    toast({ title: 'Calendar File', description: 'ICS file downloaded' });
  };
  
  const scheduleMeeting = () => {
    if (!scheduledTime) {
      toast({ title: 'Error', description: 'Please select a date and time', variant: 'destructive' });
      return;
    }
    
    toast({ title: 'Meeting Scheduled', description: `Scheduled for ${new Date(scheduledTime).toLocaleString()}` });
    addToGoogleCalendar();
  };
  
  // ==================== Render Functions ====================
  
  const renderLobby = () => (
    <div className="vc-lobby">
      <div className="vc-lobby-card">
        <div className="vc-lobby-header">
          <div className="vc-lobby-logo">
            <Video size={32} />
            CUBE Video Pro
          </div>
          <p className="vc-lobby-subtitle">Enterprise Video Conferencing</p>
        </div>
        
        <div className="vc-lobby-tabs">
          <button 
            className={`vc-lobby-tab ${lobbyTab === 'create' ? 'active' : ''}`}
            onClick={() => setLobbyTab('create')}
          >
            Create Room
          </button>
          <button 
            className={`vc-lobby-tab ${lobbyTab === 'join' ? 'active' : ''}`}
            onClick={() => setLobbyTab('join')}
          >
            Join Room
          </button>
        </div>
        
        <div className="vc-lobby-form">
          <div className="vc-form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              disabled={isConnecting}
            />
          </div>
          
          <div className="vc-form-group">
            <label>Room ID</label>
            <div className="vc-room-input-group">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder={lobbyTab === 'create' ? 'Generate or enter ID' : 'Enter room ID'}
                disabled={isConnecting}
                maxLength={10}
              />
              {lobbyTab === 'create' && (
                <button 
                  className="vc-generate-btn"
                  onClick={handleGenerateRoomId}
                  disabled={isConnecting}
                  title="Generate Room ID"
                >
                  <RefreshCw size={20} />
                </button>
              )}
            </div>
          </div>
          
          {lobbyTab === 'create' && (
            <div className="vc-checkbox-group">
              <input
                type="checkbox"
                id="waitingRoom"
                checked={waitingRoomEnabled}
                onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
              />
              <label htmlFor="waitingRoom">Enable waiting room</label>
            </div>
          )}
          
          <button
            className="vc-submit-btn"
            onClick={lobbyTab === 'create' ? createRoom : joinRoom}
            disabled={isConnecting || !displayName.trim() || !roomId.trim()}
          >
            {isConnecting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                {lobbyTab === 'create' ? 'Creating...' : 'Joining...'}
              </>
            ) : (
              <>
                {lobbyTab === 'create' ? <Video size={20} /> : <UserPlus size={20} />}
                {lobbyTab === 'create' ? 'Create Room' : 'Join Room'}
              </>
            )}
          </button>
        </div>
        
        <div className="vc-lobby-features">
          <h4>Features</h4>
          <div className="vc-features-grid">
            <div className="vc-feature-item">
              <Video size={16} /> HD Video
            </div>
            <div className="vc-feature-item">
              <ScreenShare size={16} /> Screen Share
            </div>
            <div className="vc-feature-item">
              <MessageSquare size={16} /> Chat
            </div>
            <div className="vc-feature-item">
              <Circle size={16} /> Recording
            </div>
            <div className="vc-feature-item">
              <QrCode size={16} /> QR Share
            </div>
            <div className="vc-feature-item">
              <Smile size={16} /> Reactions
            </div>
            <div className="vc-feature-item">
              <PenTool size={16} /> Whiteboard
            </div>
            <div className="vc-feature-item">
              <PictureInPicture size={16} /> PiP Mode
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderTopBar = () => (
    <div className="vc-top-bar">
      <div className="vc-top-left">
        <button className="vc-back-btn" onClick={() => router.back()} title="Go back" aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <div className="vc-logo">
          <Video size={20} />
          CUBE Video Pro
        </div>
      </div>
      
      <div className="vc-top-center">
        <div className="vc-room-info">
          <span className="vc-room-id">{currentRoom?.id || roomId}</span>
          <button className="vc-copy-btn" onClick={copyRoomId} title="Copy Room ID">
            <Copy size={16} />
          </button>
        </div>
        
        {isRecording && (
          <div className="vc-recording-badge">
            <span className="vc-recording-dot"></span>
            REC {formatTime(recordingTime)}
          </div>
        )}
      </div>
      
      <div className="vc-top-right">
        <span className="vc-timer">{formatTime(callDuration)}</span>
        
        <div className="vc-participant-count">
          <Users size={16} />
          {participants.length + 1}
        </div>
        
        <button className="vc-qr-btn" onClick={() => setShowQR(true)} title="Share via QR">
          <QrCode size={20} />
        </button>
        
        <button className="vc-settings-btn" onClick={() => setShowSettings(!showSettings)} title="Settings">
          <Settings size={20} />
        </button>
        
        <button className="vc-fullscreen-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>
    </div>
  );
  
  const renderVideoGrid = () => (
    <div className={`vc-video-grid ${getGridClass()}`}>
      {/* Local Video */}
      <div className={`vc-video-tile local ${!isVideoOn ? 'video-off' : ''}`}>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
        />
        {!isVideoOn && (
          <div className="vc-avatar-placeholder">
            <div className="vc-avatar">
              {getInitials(localParticipant?.name || 'You')}
            </div>
          </div>
        )}
        <div className="vc-tile-info">
          <span className="vc-participant-name">
            {localParticipant?.name || 'You'} (You)
            {localParticipant?.isHost && <span className="vc-host-badge">Host</span>}
          </span>
          <div className="vc-tile-indicators">
            {isMuted && (
              <span className="vc-indicator muted">
                <MicOff size={12} />
              </span>
            )}
            {!isVideoOn && (
              <span className="vc-indicator video-off">
                <VideoOff size={12} />
              </span>
            )}
            {handRaised && (
              <span className="vc-indicator hand-raised">
                <Hand size={12} />
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Screen Share */}
      {isScreenSharing && (
        <div className="vc-screen-share-container">
          <video
            ref={screenVideoRef}
            autoPlay
            muted
            playsInline
          />
          <div className="vc-screen-share-banner">
            <Monitor size={16} />
            You are sharing your screen
          </div>
        </div>
      )}
      
      {/* Remote Participants */}
      {participants.map(participant => (
        <div key={participant.id} className={`vc-video-tile ${!participant.videoEnabled ? 'video-off' : ''}`}>
          <div className="vc-avatar-placeholder">
            <div className="vc-avatar">
              {getInitials(participant.name)}
            </div>
          </div>
          <div className="vc-tile-info">
            <span className="vc-participant-name">
              {participant.name}
            </span>
            <div className="vc-tile-indicators">
              {!participant.audioEnabled && (
                <span className="vc-indicator muted">
                  <MicOff size={12} />
                </span>
              )}
              {!participant.videoEnabled && (
                <span className="vc-indicator video-off">
                  <VideoOff size={12} />
                </span>
              )}
              {participant.handRaised && (
                <span className="vc-indicator hand-raised">
                  <Hand size={12} />
                </span>
              )}
              {participant.screenSharing && (
                <span className="vc-indicator screen-sharing">
                  <Monitor size={12} />
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
  
  const renderReactionsOverlay = () => (
    <div className="vc-reactions-overlay">
      {activeReactions.map(reaction => (
        <div key={reaction.id} className="vc-reaction">
          {reaction.emoji}
        </div>
      ))}
    </div>
  );
  
  const renderToolbar = () => (
    <div className="vc-bottom-toolbar">
      <div className="vc-toolbar-group">
        <button 
          className={`vc-toolbar-btn ${isMuted ? 'off' : ''}`}
          onClick={toggleMute}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>
        
        <button 
          className={`vc-toolbar-btn ${!isVideoOn ? 'off' : ''}`}
          onClick={toggleVideo}
        >
          {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
          <span>{isVideoOn ? 'Stop' : 'Start'}</span>
        </button>
        
        <button 
          className={`vc-toolbar-btn ${showBackgroundPicker ? 'active' : ''}`}
          onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
        >
          <ImageIcon size={20} />
          <span>Background</span>
        </button>
      </div>
      
      <div className="vc-toolbar-group">
        <button 
          className={`vc-toolbar-btn ${isScreenSharing ? 'active' : ''}`}
          onClick={toggleScreenShare}
        >
          {isScreenSharing ? <MonitorOff size={20} /> : <ScreenShare size={20} />}
          <span>Share</span>
        </button>
        
        <button 
          className={`vc-toolbar-btn ${isRecording ? 'active' : ''}`}
          onClick={toggleRecording}
        >
          {isRecording ? <Square size={20} /> : <Circle size={20} />}
          <span>{isRecording ? 'Stop' : 'Record'}</span>
        </button>
        
        <button 
          className={`vc-toolbar-btn ${showWhiteboard ? 'active' : ''}`}
          onClick={toggleWhiteboard}
        >
          <PenTool size={20} />
          <span>Whiteboard</span>
        </button>
      </div>
      
      <div className="vc-toolbar-group">
        <button 
          className={`vc-toolbar-btn ${showChat ? 'active' : ''}`}
          onClick={() => {
            setShowChat(!showChat);
            setShowParticipants(false);
            setShowSettings(false);
          }}
        >
          <MessageSquare size={20} />
          <span>Chat</span>
          {unreadMessages > 0 && (
            <span className="vc-badge">{unreadMessages}</span>
          )}
        </button>
        
        <button 
          className={`vc-toolbar-btn ${showParticipants ? 'active' : ''}`}
          onClick={() => {
            setShowParticipants(!showParticipants);
            setShowChat(false);
            setShowSettings(false);
          }}
        >
          <Users size={20} />
          <span>People</span>
        </button>
        
        <button 
          className={`vc-toolbar-btn ${showReactions ? 'active' : ''}`}
          onClick={() => setShowReactions(!showReactions)}
        >
          <Smile size={20} />
          <span>React</span>
        </button>
      </div>
      
      <div className="vc-toolbar-group">
        <button 
          className={`vc-toolbar-btn ${handRaised ? 'active' : ''}`}
          onClick={toggleHandRaise}
        >
          <Hand size={20} />
          <span>Hand</span>
        </button>
        
        <button 
          className="vc-toolbar-btn"
          onClick={togglePipMode}
        >
          <PictureInPicture size={20} />
          <span>PiP</span>
        </button>
        
        <button 
          className="vc-toolbar-btn"
          onClick={() => setLayout({ type: layout.type === 'grid' ? 'speaker' : 'grid' })}
        >
          <Monitor size={20} />
          <span>{layout.type === 'grid' ? 'Speaker' : 'Grid'}</span>
        </button>
      </div>
      
      <div className="vc-toolbar-group">
        <button 
          className="vc-toolbar-btn danger"
          onClick={endCall}
        >
          <PhoneOff size={20} />
          <span>End</span>
        </button>
      </div>
    </div>
  );
  
  const renderChatPanel = () => (
    <div className="vc-side-panel">
      <div className="vc-panel-header">
        <h3>Chat</h3>
        <button className="vc-panel-close" onClick={() => setShowChat(false)} title="Close chat" aria-label="Close chat panel">
          <X size={20} />
        </button>
      </div>
      
      <div className="vc-chat-messages">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          chatMessages.map(message => (
            <div key={message.id} className={`vc-chat-message ${message.isOwn ? 'own' : ''}`}>
              <span className="vc-chat-sender">{message.senderName}</span>
              <p className="vc-chat-text">{message.text}</p>
              <span className="vc-chat-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      
      <div className="vc-chat-input">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
        />
        <button onClick={sendChatMessage} disabled={!chatInput.trim()} title="Send message" aria-label="Send message">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
  
  const renderParticipantsPanel = () => (
    <div className="vc-side-panel">
      <div className="vc-panel-header">
        <h3>Participants ({participants.length + 1})</h3>
        <button className="vc-panel-close" onClick={() => setShowParticipants(false)} title="Close participants" aria-label="Close participants panel">
          <X size={20} />
        </button>
      </div>
      
      <div className="vc-panel-content">
        {/* Waiting Room */}
        {localParticipant?.isHost && waitingParticipants.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-yellow-500 mb-2">Waiting Room</h4>
            {waitingParticipants.map(p => (
              <div key={p.id} className="vc-participant-item waiting">
                <div className="vc-participant-avatar">
                  {getInitials(p.name)}
                </div>
                <div className="vc-participant-info">
                  <span className="vc-participant-info-name">{p.name}</span>
                  <span className="vc-participant-role">Waiting to join</span>
                </div>
                <div className="vc-waiting-actions">
                  <button className="vc-admit-btn" onClick={() => admitParticipant(p.id)}>
                    <Check size={12} /> Admit
                  </button>
                  <button className="vc-deny-btn" onClick={() => denyParticipant(p.id)}>
                    <X size={12} /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* In Meeting */}
        <div className="vc-participants-list">
          {/* Local Participant */}
          <div className="vc-participant-item">
            <div className="vc-participant-avatar">
              {getInitials(localParticipant?.name || 'You')}
            </div>
            <div className="vc-participant-info">
              <span className="vc-participant-info-name">
                {localParticipant?.name} (You)
                {localParticipant?.isHost && <span className="vc-host-badge ml-2">Host</span>}
              </span>
            </div>
            <div className="vc-participant-actions">
              <button onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button onClick={toggleVideo} title={isVideoOn ? 'Stop Video' : 'Start Video'}>
                {isVideoOn ? <Video size={16} /> : <VideoOff size={16} />}
              </button>
            </div>
          </div>
          
          {/* Remote Participants */}
          {participants.map(participant => (
            <div key={participant.id} className="vc-participant-item">
              <div className="vc-participant-avatar">
                {getInitials(participant.name)}
              </div>
              <div className="vc-participant-info">
                <span className="vc-participant-info-name">
                  {participant.name}
                  {participant.handRaised && <Hand size={14} className="inline ml-2 text-yellow-500" />}
                </span>
              </div>
              <div className="vc-participant-actions">
                <button title={participant.audioEnabled ? 'Muted' : 'Unmuted'}>
                  {participant.audioEnabled ? <Mic size={16} /> : <MicOff size={16} className="text-red-500" />}
                </button>
                <button title={participant.videoEnabled ? 'Video On' : 'Video Off'}>
                  {participant.videoEnabled ? <Video size={16} /> : <VideoOff size={16} className="text-red-500" />}
                </button>
                {localParticipant?.isHost && (
                  <button className="danger" title="Remove Participant">
                    <UserMinus size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  const renderReactionsPanel = () => (
    showReactions && (
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-card rounded-xl p-4 shadow-xl z-50">
        <div className="vc-reactions-grid">
          {REACTIONS.map(emoji => (
            <button
              key={emoji}
              className="vc-reaction-btn"
              onClick={() => sendReaction(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    )
  );
  
  const renderWhiteboardPanel = () => (
    showWhiteboard && (
      <div className="vc-whiteboard-overlay">
        <div className="vc-whiteboard-container">
          <div className="vc-whiteboard-header">
            <h3>Collaborative Whiteboard</h3>
            <div className="vc-whiteboard-tools">
              {/* Tool buttons */}
              <div className="vc-tool-group">
                <button
                  className={`vc-tool-btn ${whiteboardTool === ToolType.PEN ? 'active' : ''}`}
                  onClick={() => setWhiteboardTool(ToolType.PEN)}
                  title="Pen"
                >
                  <PenTool size={18} />
                </button>
                <button
                  className={`vc-tool-btn ${whiteboardTool === ToolType.HIGHLIGHTER ? 'active' : ''}`}
                  onClick={() => setWhiteboardTool(ToolType.HIGHLIGHTER)}
                  title="Highlighter"
                >
                  <Palette size={18} />
                </button>
                <button
                  className={`vc-tool-btn ${whiteboardTool === ToolType.ERASER ? 'active' : ''}`}
                  onClick={() => setWhiteboardTool(ToolType.ERASER)}
                  title="Eraser"
                >
                  <Eraser size={18} />
                </button>
                <button
                  className={`vc-tool-btn ${whiteboardTool === ToolType.TEXT ? 'active' : ''}`}
                  onClick={() => setWhiteboardTool(ToolType.TEXT)}
                  title="Text"
                >
                  <Type size={18} />
                </button>
                <button
                  className={`vc-tool-btn ${whiteboardTool === ToolType.LINE ? 'active' : ''}`}
                  onClick={() => setWhiteboardTool(ToolType.LINE)}
                  title="Line"
                >
                  <Minus size={18} />
                </button>
                <button
                  className={`vc-tool-btn ${whiteboardTool === ToolType.RECTANGLE ? 'active' : ''}`}
                  onClick={() => setWhiteboardTool(ToolType.RECTANGLE)}
                  title="Rectangle"
                >
                  <RectangleHorizontal size={18} />
                </button>
                <button
                  className={`vc-tool-btn ${whiteboardTool === ToolType.ELLIPSE ? 'active' : ''}`}
                  onClick={() => setWhiteboardTool(ToolType.ELLIPSE)}
                  title="Circle"
                >
                  <CircleIcon size={18} />
                </button>
              </div>
              
              {/* Color picker */}
              <div className="vc-tool-group">
                <button
                  className="vc-tool-btn color-btn"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  style={{ backgroundColor: whiteboardColor }}
                  title="Color"
                >
                  <div className="color-preview" style={{ backgroundColor: whiteboardColor }} />
                </button>
                {showColorPicker && (
                  <div className="vc-color-picker">
                    {WHITEBOARD_COLORS.map(color => (
                      <button
                        key={color}
                        className={`vc-color-option ${whiteboardColor === color ? 'active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setWhiteboardColor(color);
                          setShowColorPicker(false);
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Brush size */}
              <div className="vc-tool-group">
                <select
                  value={whiteboardBrushSize}
                  onChange={(e) => setWhiteboardBrushSize(Number(e.target.value))}
                  className="vc-brush-select"
                  title="Brush Size"
                >
                  {BRUSH_SIZES.map(size => (
                    <option key={size} value={size}>{size}px</option>
                  ))}
                </select>
              </div>
              
              {/* Actions */}
              <div className="vc-tool-group">
                <button className="vc-tool-btn" onClick={handleWhiteboardUndo} title="Undo">
                  <Undo2 size={18} />
                </button>
                <button className="vc-tool-btn" onClick={handleWhiteboardRedo} title="Redo">
                  <Redo2 size={18} />
                </button>
                <button className="vc-tool-btn" onClick={handleWhiteboardClear} title="Clear">
                  <Trash2 size={18} />
                </button>
                <button className="vc-tool-btn" onClick={handleWhiteboardExport} title="Export PNG">
                  <Download size={18} />
                </button>
              </div>
            </div>
            <button
              className="vc-whiteboard-close"
              onClick={() => setShowWhiteboard(false)}
              title="Close Whiteboard"
            >
              <X size={20} />
            </button>
          </div>
          
          <canvas
            ref={whiteboardCanvasRef}
            className="vc-whiteboard-canvas"
            width={1280}
            height={720}
          />
        </div>
      </div>
    )
  );
  
  const renderVirtualBackgroundPicker = () => (
    showBackgroundPicker && (
      <div className="vc-background-picker-overlay" onClick={() => setShowBackgroundPicker(false)}>
        <div className="vc-background-picker" onClick={(e) => e.stopPropagation()}>
          <div className="vc-background-picker-header">
            <h3>Virtual Backgrounds</h3>
            <button
              className="vc-background-picker-close"
              onClick={() => setShowBackgroundPicker(false)}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="vc-background-grid">
            {VIRTUAL_BACKGROUNDS.map((bg, index) => (
              <button
                key={index}
                className={`vc-background-option ${
                  selectedBackground.type === bg.type && 
                  (bg.type !== BackgroundType.BLUR || selectedBackground.blurStrength === bg.blurStrength) &&
                  (bg.type !== BackgroundType.COLOR || selectedBackground.color === bg.color) &&
                  (bg.type !== BackgroundType.IMAGE || selectedBackground.imageUrl === bg.imageUrl)
                    ? 'active' 
                    : ''
                }`}
                onClick={() => handleBackgroundChange(bg)}
                title={getBackgroundLabel(bg)}
              >
                {bg.type === BackgroundType.NONE && (
                  <div className="bg-option-none">
                    <VideoOff size={24} />
                    <span>None</span>
                  </div>
                )}
                {bg.type === BackgroundType.BLUR && (
                  <div className="bg-option-blur" style={{ backdropFilter: `blur(${bg.blurStrength}px)` }}>
                    <span>Blur {bg.blurStrength}</span>
                  </div>
                )}
                {bg.type === BackgroundType.COLOR && (
                  <div className="bg-option-color" style={{ backgroundColor: bg.color }}>
                    <span>Color</span>
                  </div>
                )}
                {bg.type === BackgroundType.IMAGE && (
                  <div 
                    className="bg-option-image"
                    style={{ backgroundImage: `url(${bg.imageUrl})` }}
                  >
                    <span>{bg.imageUrl?.split('/').pop()?.split('.')[0]}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="vc-background-custom">
            <label className="vc-custom-upload">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    handleBackgroundChange({ type: BackgroundType.IMAGE, imageUrl: url });
                  }
                }}
              />
              <ImageIcon size={20} />
              Upload Custom Image
            </label>
          </div>
        </div>
      </div>
    )
  );
  
  const getBackgroundLabel = (bg: BackgroundConfig): string => {
    switch (bg.type) {
      case BackgroundType.NONE: return 'No background';
      case BackgroundType.BLUR: return `Blur (${bg.blurStrength}px)`;
      case BackgroundType.COLOR: return `Color: ${bg.color}`;
      case BackgroundType.IMAGE: return bg.imageUrl?.split('/').pop() || 'Image';
      case BackgroundType.VIDEO: return 'Video';
      default: return 'Unknown';
    }
  };
  
  const renderQRModal = () => (
    showQR && (
      <div className="vc-modal-overlay" onClick={() => setShowQR(false)}>
        <div className="vc-modal vc-modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="vc-modal-header">
            <h2>👥 Invite Participants</h2>
            <button className="vc-modal-close" onClick={() => setShowQR(false)} title="Close" aria-label="Close modal">
              <X size={20} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="vc-invite-tabs">
            <button 
              className={`vc-invite-tab ${inviteTab === 'quick' ? 'active' : ''}`}
              onClick={() => setInviteTab('quick')}
            >
              Quick Invite
            </button>
            <button 
              className={`vc-invite-tab ${inviteTab === 'contacts' ? 'active' : ''}`}
              onClick={() => setInviteTab('contacts')}
            >
              Contacts
            </button>
            <button 
              className={`vc-invite-tab ${inviteTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setInviteTab('calendar')}
            >
              Calendar
            </button>
            <button 
              className={`vc-invite-tab ${inviteTab === 'advanced' ? 'active' : ''}`}
              onClick={() => setInviteTab('advanced')}
            >
              Advanced
            </button>
          </div>
          
          <div className="vc-modal-body">
            {/* Quick Invite Tab */}
            {inviteTab === 'quick' && (
              <div className="vc-quick-invite">
                <div className="vc-quick-invite-grid">
                  {/* QR Section */}
                  <div className="vc-qr-section">
                    {qrCodeUrl && (
                      <div className="vc-qr-code">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCodeUrl} alt="QR Code for meeting invite" width={180} height={180} />
                      </div>
                    )}
                    <div className="vc-qr-actions">
                      <button className="vc-btn vc-btn-sm" onClick={downloadQRCode} title="Download QR">
                        ⬇️ Save
                      </button>
                      <button className="vc-btn vc-btn-sm" onClick={printQRCode} title="Print QR">
                        🖨️ Print
                      </button>
                    </div>
                    <p className="vc-qr-hint">Scan with phone camera to join</p>
                  </div>
                  
                  {/* Meeting Info */}
                  <div className="vc-meeting-info-section">
                    <div className="vc-meeting-detail">
                      <label>Meeting ID</label>
                      <div className="vc-copy-field">
                        <span className="vc-meeting-id">{currentRoom?.id || '---'}</span>
                        <button className="vc-btn-icon" onClick={() => copyToClipboard(currentRoom?.id || '', 'Meeting ID')} title="Copy">
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="vc-meeting-detail">
                      <label>Join Link</label>
                      <div className="vc-copy-field">
                        <input 
                          type="text" 
                          value={getJoinUrl()} 
                          readOnly 
                        />
                        <button className="vc-btn-icon" onClick={() => copyToClipboard(getJoinUrl(), 'Join link')} title="Copy">
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {meetingPassword && (
                      <div className="vc-meeting-detail">
                        <label>Password</label>
                        <div className="vc-copy-field">
                          <span>{meetingPassword}</span>
                          <button className="vc-btn-icon" onClick={() => copyToClipboard(meetingPassword, 'Password')} title="Copy">
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Share Methods */}
                <div className="vc-share-methods">
                  <button className="vc-share-btn vc-share-email" onClick={shareViaEmail}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    <span className="label">Email</span>
                  </button>
                  <button className="vc-share-btn vc-share-sms" onClick={shareViaSMS}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                    <span className="label">SMS</span>
                  </button>
                  <button className="vc-share-btn vc-share-whatsapp" onClick={shareViaWhatsApp}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <span className="label">WhatsApp</span>
                  </button>
                  <button className="vc-share-btn vc-share-telegram" onClick={shareViaTelegram}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    <span className="label">Telegram</span>
                  </button>
                  <button className="vc-share-btn vc-share-slack" onClick={shareViaSlack}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
                    <span className="label">Slack</span>
                  </button>
                  <button className="vc-share-btn vc-share-copy" onClick={copyAllInfo}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    <span className="label">Copy All</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Contacts Tab */}
            {inviteTab === 'contacts' && (
              <div className="vc-contacts-tab">
                <div className="vc-contacts-search">
                  <input type="text" placeholder="🔍 Search contacts by name or email..." />
                </div>
                <div className="vc-contacts-list">
                  <div className="vc-contacts-empty">
                    <span style={{ fontSize: '3rem' }}>📇</span>
                    <p>No contacts saved yet</p>
                    <button className="vc-btn vc-btn-secondary">Import Contacts</button>
                  </div>
                </div>
                <div className="vc-invite-direct">
                  <label>Or invite by email directly:</label>
                  <div className="vc-email-input-group">
                    <input type="email" placeholder="Enter email address..." />
                    <button className="vc-btn vc-btn-primary" onClick={() => {
                      toast({
                        title: 'Invite Sent',
                        description: 'Email invitation sent successfully'
                      });
                    }}>Send Invite</button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Calendar Tab */}
            {inviteTab === 'calendar' && (
              <div className="vc-calendar-tab">
                <div className="vc-calendar-integrations">
                  <button className="vc-calendar-btn" onClick={addToGoogleCalendar}>
                    <span className="icon">📅</span>
                    <span className="name">Google Calendar</span>
                    <span className="action">Add Event</span>
                  </button>
                  <button className="vc-calendar-btn" onClick={addToOutlookCalendar}>
                    <span className="icon">📆</span>
                    <span className="name">Outlook Calendar</span>
                    <span className="action">Add Event</span>
                  </button>
                  <button className="vc-calendar-btn" onClick={downloadICSFile}>
                    <span className="icon">🗓️</span>
                    <span className="name">Apple Calendar</span>
                    <span className="action">Download .ics</span>
                  </button>
                  <button className="vc-calendar-btn" onClick={addToYahooCalendar}>
                    <span className="icon">📋</span>
                    <span className="name">Yahoo Calendar</span>
                    <span className="action">Add Event</span>
                  </button>
                </div>
                
                <div className="vc-schedule-meeting">
                  <h4>Schedule for Later</h4>
                  <div className="vc-form-group">
                    <label>Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                  <div className="vc-form-group">
                    <label>Duration</label>
                    <select value={meetingDuration} onChange={(e) => setMeetingDuration(Number(e.target.value))}>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                  <button className="vc-btn vc-btn-primary" style={{ width: '100%' }} onClick={scheduleMeeting}>
                    📅 Schedule & Send Invites
                  </button>
                </div>
              </div>
            )}
            
            {/* Advanced Tab */}
            {inviteTab === 'advanced' && (
              <div className="vc-advanced-tab">
                <div className="vc-option-group">
                  <h4>🔒 Security Settings</h4>
                  <label className="vc-toggle-label">
                    <input 
                      type="checkbox" 
                      checked={meetingSettings.waitingRoom}
                      onChange={(e) => setMeetingSettings({...meetingSettings, waitingRoom: e.target.checked})}
                    />
                    <span className="vc-toggle-slider"></span>
                    Enable Waiting Room
                  </label>
                  <label className="vc-toggle-label">
                    <input 
                      type="checkbox" 
                      checked={meetingSettings.requirePassword}
                      onChange={(e) => {
                        setMeetingSettings({...meetingSettings, requirePassword: e.target.checked});
                        if (e.target.checked && !meetingPassword) {
                          generateMeetingPassword();
                        }
                      }}
                    />
                    <span className="vc-toggle-slider"></span>
                    Require Password
                  </label>
                  {meetingSettings.requirePassword && (
                    <div className="vc-password-field">
                      <input 
                        type="text" 
                        value={meetingPassword} 
                        onChange={(e) => setMeetingPassword(e.target.value)}
                        placeholder="Meeting password"
                      />
                      <button className="vc-btn-icon" onClick={generateMeetingPassword} title="Generate">🎲</button>
                    </div>
                  )}
                  <label className="vc-toggle-label">
                    <input 
                      type="checkbox" 
                      checked={meetingSettings.lockMeeting}
                      onChange={(e) => setMeetingSettings({...meetingSettings, lockMeeting: e.target.checked})}
                    />
                    <span className="vc-toggle-slider"></span>
                    Lock Meeting After Start
                  </label>
                </div>
                
                <div className="vc-option-group">
                  <h4>👤 Participant Permissions</h4>
                  <label className="vc-toggle-label">
                    <input 
                      type="checkbox" 
                      checked={meetingSettings.allowScreenShare}
                      onChange={(e) => setMeetingSettings({...meetingSettings, allowScreenShare: e.target.checked})}
                    />
                    <span className="vc-toggle-slider"></span>
                    Allow Screen Sharing
                  </label>
                  <label className="vc-toggle-label">
                    <input 
                      type="checkbox" 
                      checked={meetingSettings.allowChat}
                      onChange={(e) => setMeetingSettings({...meetingSettings, allowChat: e.target.checked})}
                    />
                    <span className="vc-toggle-slider"></span>
                    Allow Chat
                  </label>
                  <label className="vc-toggle-label">
                    <input 
                      type="checkbox" 
                      checked={meetingSettings.muteOnEntry}
                      onChange={(e) => setMeetingSettings({...meetingSettings, muteOnEntry: e.target.checked})}
                    />
                    <span className="vc-toggle-slider"></span>
                    Mute Participants on Entry
                  </label>
                </div>
                
                <div className="vc-option-group">
                  <h4>📊 Meeting Options</h4>
                  <label className="vc-toggle-label">
                    <input 
                      type="checkbox" 
                      checked={meetingSettings.autoRecord}
                      onChange={(e) => setMeetingSettings({...meetingSettings, autoRecord: e.target.checked})}
                    />
                    <span className="vc-toggle-slider"></span>
                    Auto-Record Meeting
                  </label>
                  <label className="vc-toggle-label">
                    <input 
                      type="checkbox" 
                      checked={meetingSettings.enableTranscription}
                      onChange={(e) => setMeetingSettings({...meetingSettings, enableTranscription: e.target.checked})}
                    />
                    <span className="vc-toggle-slider"></span>
                    Enable Live Transcription
                  </label>
                </div>
                
                <button className="vc-btn vc-btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={() => {
                  toast({
                    title: 'Settings Applied',
                    description: 'Meeting settings have been updated'
                  });
                }}>
                  ✅ Apply Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  );
  
  const renderWaitingRoom = () => (
    inWaitingRoom && (
      <div className="vc-waiting-room">
        <div className="vc-waiting-content">
          <div className="vc-waiting-spinner"></div>
          <h2>Waiting Room</h2>
          <p>Please wait for the host to admit you to the meeting.</p>
          <button
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg"
            onClick={() => {
              setInWaitingRoom(false);
              cleanupMediaStreams();
            }}
          >
            Leave Waiting Room
          </button>
        </div>
      </div>
    )
  );
  
  // ==================== Main Render ====================
  
  if (inWaitingRoom) {
    return (
      <AppLayout>
        <div className={`video-conference-pro ${isPipMode ? 'pip-mode' : ''}`}>
          {renderWaitingRoom()}
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className={`video-conference-pro ${isPipMode ? 'pip-mode' : ''} ${layout.type === 'speaker' ? 'speaker-layout' : ''}`}>
        {!isInCall ? (
          renderLobby()
        ) : (
          <>
            {renderTopBar()}
            
            <div className="vc-main-content">
              <div className="vc-video-area">
                {renderVideoGrid()}
                {renderReactionsOverlay()}
                {renderReactionsPanel()}
              </div>
              
              {showChat && renderChatPanel()}
              {showParticipants && renderParticipantsPanel()}
            </div>
            
            {renderToolbar()}
            {renderQRModal()}
            {renderWhiteboardPanel()}
            {renderVirtualBackgroundPicker()}
            
            {/* Connection status indicator */}
            {signalingConnected && (
              <div className="vc-connection-status connected">
                <span className="status-dot"></span>
                Connected
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
