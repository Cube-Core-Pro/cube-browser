/**
 * WebRTC Connection Service
 * Complete peer-to-peer video/audio/data connection management
 * CUBE Nexum - Enterprise Video Conferencing
 * 
 * Now integrated with Tauri backend P2P commands
 */

import { logger } from './logger-service';

const log = logger.scope('Service');

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Backend Integration Types
// ============================================================================

interface BackendP2PRoom {
  id: string;
  code: string;
  max_peers: number;
  connected_peers: number;
  created_at: number;
  is_host: boolean;
}

interface BackendP2PTransfer {
  id: string;
  room_id: string;
  file_name: string;
  file_size: number;
  transferred: number;
  status: string;
  sender_id: string;
  receiver_id: string;
  started_at: number;
}

interface BackendICEServers {
  stun: string[];
  turn: Array<{
    urls: string;
    username: string;
    credential: string;
  }>;
}

// ============================================================================
// Backend P2P API
// ============================================================================

const BackendP2PAPI = {
  async createRoom(maxPeers: number): Promise<BackendP2PRoom> {
    try {
      return await invoke<BackendP2PRoom>('p2p_create_room', { maxPeers });
    } catch (error) {
      log.warn('Backend createRoom failed:', error);
      throw error;
    }
  },

  async joinRoom(roomCode: string): Promise<BackendP2PRoom> {
    try {
      return await invoke<BackendP2PRoom>('p2p_join_room', { roomCode });
    } catch (error) {
      log.warn('Backend joinRoom failed:', error);
      throw error;
    }
  },

  async leaveRoom(roomId: string): Promise<void> {
    try {
      await invoke<void>('p2p_leave_room', { roomId });
    } catch (error) {
      log.warn('Backend leaveRoom failed:', error);
    }
  },

  async sendFile(roomId: string, filePath: string): Promise<string> {
    try {
      return await invoke<string>('p2p_send_file', { roomId, filePath });
    } catch (error) {
      log.warn('Backend sendFile failed:', error);
      throw error;
    }
  },

  async receiveFile(transferId: string, savePath: string): Promise<void> {
    try {
      await invoke<void>('p2p_receive_file', { transferId, savePath });
    } catch (error) {
      log.warn('Backend receiveFile failed:', error);
    }
  },

  async cancelTransfer(transferId: string): Promise<void> {
    try {
      await invoke<void>('p2p_cancel_transfer', { transferId });
    } catch (error) {
      log.warn('Backend cancelTransfer failed:', error);
    }
  },

  async getTransfer(transferId: string): Promise<BackendP2PTransfer | null> {
    try {
      return await invoke<BackendP2PTransfer>('p2p_get_transfer', { transferId });
    } catch (error) {
      log.warn('Backend getTransfer failed:', error);
      return null;
    }
  },

  async listTransfers(): Promise<BackendP2PTransfer[]> {
    try {
      return await invoke<BackendP2PTransfer[]>('p2p_list_transfers');
    } catch (error) {
      log.warn('Backend listTransfers failed:', error);
      return [];
    }
  },

  async getRoom(roomId: string): Promise<BackendP2PRoom | null> {
    try {
      return await invoke<BackendP2PRoom>('p2p_get_room', { roomId });
    } catch (error) {
      log.warn('Backend getRoom failed:', error);
      return null;
    }
  },

  async listRooms(): Promise<BackendP2PRoom[]> {
    try {
      return await invoke<BackendP2PRoom[]>('p2p_list_rooms');
    } catch (error) {
      log.warn('Backend listRooms failed:', error);
      return [];
    }
  },

  async getICEServers(): Promise<BackendICEServers | null> {
    try {
      return await invoke<BackendICEServers>('p2p_get_ice_servers');
    } catch (error) {
      log.warn('Backend getICEServers failed:', error);
      return null;
    }
  },

  async getDownloadsDir(): Promise<string | null> {
    try {
      return await invoke<string>('get_downloads_dir');
    } catch (error) {
      log.warn('Backend getDownloadsDir failed:', error);
      return null;
    }
  }
};

// Export backend API for use by other services
export { BackendP2PAPI };
export type { BackendP2PRoom, BackendP2PTransfer, BackendICEServers };

// ============================================================================
// Original Types
// ============================================================================

export interface ICEServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface PeerInfo {
  id: string;
  name: string;
  isHost: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
}

export interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

// Simplified config for page-pro.tsx
export interface ConnectionConfig {
  iceServers?: ICEServer[];
  enableDataChannel?: boolean;
  dataChannelConfig?: {
    label: string;
    ordered?: boolean;
  };
}

// Media config for page-pro.tsx
export interface MediaConfig {
  video: boolean;
  audio: boolean;
  screen?: boolean;
}

// Full connection config (legacy)
export interface FullConnectionConfig {
  roomId: string;
  userId: string;
  userName: string;
  isHost: boolean;
  iceServers?: ICEServer[];
  mediaConstraints?: MediaConstraints;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'leave' | 'chat' | 'reaction' | 'whiteboard' | 'state-update';
  roomId: string;
  senderId: string;
  senderName: string;
  targetId?: string;
  payload: unknown;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface ReactionMessage {
  emoji: string;
  senderId: string;
  senderName: string;
}

type StreamCallback = (stream: MediaStream) => void;
type IceCandidateCallback = (candidate: RTCIceCandidate) => void;
type ConnectionStateCallback = (state: RTCPeerConnectionState) => void;
type DataChannelMessageCallback = (data: unknown) => void;
type PeerCallback = (peer: PeerInfo) => void;
type ChatCallback = (message: ChatMessage) => void;
type ReactionCallback = (reaction: ReactionMessage) => void;
type ErrorCallback = (error: Error) => void;
type StateCallback = (state: PeerInfo) => void;
type DataCallback = (peerId: string, data: unknown) => void;

// Default ICE servers (public STUN servers)
const DEFAULT_ICE_SERVERS: ICEServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.stunprotocol.org:3478' },
];

// Default media constraints
const _DEFAULT_MEDIA_CONSTRAINTS: MediaConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

export class WebRTCConnectionService {
  private connectionConfig: ConnectionConfig;
  private mediaConfig: MediaConfig;
  private config: FullConnectionConfig | null = null; // Legacy config
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private peers: Map<string, PeerInfo> = new Map();
  
  // WebSocket for signaling
  private signalingSocket: WebSocket | null = null;
  private signalingUrl: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  // State
  private isConnected = false;
  private localPeerInfo: PeerInfo | null = null;
  
  // Pending ICE candidates (received before remote description is set)
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  
  // Callbacks for simplified API
  private onTrackCallback: StreamCallback | null = null;
  private onIceCandidateCallback: IceCandidateCallback | null = null;
  private onConnectionStateChangeCallback: ConnectionStateCallback | null = null;
  private onDataChannelMessageCallback: DataChannelMessageCallback | null = null;
  
  // Legacy callbacks
  private onRemoteStreamCallbacks: ((peerId: string, stream: MediaStream) => void)[] = [];
  private onPeerJoinedCallbacks: PeerCallback[] = [];
  private onPeerLeftCallbacks: PeerCallback[] = [];
  private onChatMessageCallbacks: ChatCallback[] = [];
  private onReactionCallbacks: ReactionCallback[] = [];
  private onErrorCallbacks: ErrorCallback[] = [];
  private onStateUpdateCallbacks: StateCallback[] = [];
  private onDataCallbacks: DataCallback[] = [];
  private onConnectionStateChangeCallbacks: ((connected: boolean) => void)[] = [];

  /**
   * Constructor supports both simple and full config
   */
  constructor(config: ConnectionConfig | FullConnectionConfig, mediaConfig?: MediaConfig) {
    // Check if this is the simple config format
    if ('iceServers' in config && !('roomId' in config)) {
      // Simple format from page-pro.tsx
      this.connectionConfig = config as ConnectionConfig;
      this.mediaConfig = mediaConfig || { video: true, audio: true };
      
      // Create peer connection immediately
      this.createSimplePeerConnection();
    } else {
      // Full format (legacy)
      const fullConfig = config as FullConnectionConfig;
      this.config = fullConfig; // Store for legacy methods
      this.connectionConfig = {
        iceServers: fullConfig.iceServers || DEFAULT_ICE_SERVERS,
        enableDataChannel: true
      };
      this.mediaConfig = {
        video: !!fullConfig.mediaConstraints?.video,
        audio: !!fullConfig.mediaConstraints?.audio
      };
      
      this.localPeerInfo = {
        id: fullConfig.userId,
        name: fullConfig.userName,
        isHost: fullConfig.isHost,
        audioEnabled: true,
        videoEnabled: true,
        screenSharing: false,
        handRaised: false,
      };
    }
  }
  
  /**
   * Create a new RTCPeerConnection (simplified API)
   */
  private createSimplePeerConnection(): void {
    const rtcConfig: RTCConfiguration = {
      iceServers: this.connectionConfig.iceServers?.map(server => ({
        urls: server.urls,
        username: server.username,
        credential: server.credential
      })) || DEFAULT_ICE_SERVERS
    };
    
    this.peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Set up ICE candidate handling
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };
    
    // Set up track handling
    this.peerConnection.ontrack = (event) => {
      if (event.streams[0] && this.onTrackCallback) {
        this.onTrackCallback(event.streams[0]);
      }
    };
    
    // Set up connection state handling
    this.peerConnection.onconnectionstatechange = () => {
      if (this.onConnectionStateChangeCallback && this.peerConnection) {
        this.onConnectionStateChangeCallback(this.peerConnection.connectionState);
      }
    };
    
    // Create data channel if enabled
    if (this.connectionConfig.enableDataChannel) {
      const label = this.connectionConfig.dataChannelConfig?.label || 'data';
      const ordered = this.connectionConfig.dataChannelConfig?.ordered ?? true;
      
      this.dataChannel = this.peerConnection.createDataChannel(label, { ordered });
      this.setupSimpleDataChannel(this.dataChannel);
    }
    
    // Handle incoming data channels
    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupSimpleDataChannel(this.dataChannel);
    };
  }
  
  /**
   * Set up data channel event handlers (simplified API)
   */
  private setupSimpleDataChannel(channel: RTCDataChannel): void {
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onDataChannelMessageCallback) {
          this.onDataChannelMessageCallback(data);
        }
      } catch {
        // Handle non-JSON messages
        if (this.onDataChannelMessageCallback) {
          this.onDataChannelMessageCallback(event.data);
        }
      }
    };
    
    channel.onerror = (error) => {
      log.error('[WebRTC] Data channel error:', error);
    };
  }
  
  /**
   * Callback setters for simplified API
   */
  onTrack(callback: StreamCallback): void {
    this.onTrackCallback = callback;
  }
  
  onIceCandidate(callback: IceCandidateCallback): void {
    this.onIceCandidateCallback = callback;
  }
  
  setConnectionStateChangeCallback(callback: ConnectionStateCallback): void {
    this.onConnectionStateChangeCallback = callback;
  }
  
  onDataChannelMessage(callback: DataChannelMessageCallback): void {
    this.onDataChannelMessageCallback = callback;
  }
  
  /**
   * Add local stream to peer connection
   */
  addStream(stream: MediaStream): void {
    if (this.peerConnection) {
      stream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, stream);
      });
    }
    this.localStream = stream;
  }
  
  /**
   * Create and return an SDP offer (simplified API)
   */
  async createSimpleOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }
  
  /**
   * Create and return an SDP answer (simplified API)
   */
  async createSimpleAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }
  
  /**
   * Set remote description
   */
  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
  }
  
  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
  
  /**
   * Send data through the data channel
   */
  sendData(data: unknown): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
    }
  }
  
  /**
   * Get the RTCPeerConnection instance
   */
  getConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }
  
  /**
   * Get the RTCDataChannel instance
   */
  getDataChannel(): RTCDataChannel | null {
    return this.dataChannel;
  }
  
  /**
   * Close the connection
   */
  close(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }
  
  // ==================== Legacy Methods Below ====================

  /**
   * Initialize local media stream
   */
  async initializeLocalStream(): Promise<MediaStream> {
    if (!this.config) {
      throw new Error('Full config not initialized - use legacy constructor');
    }
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(
        this.config.mediaConstraints!
      );
      log.debug('[WebRTC] Local stream initialized');
      return this.localStream;
    } catch (error) {
      log.error('[WebRTC] Failed to get local stream:', error);
      throw error;
    }
  }

  /**
   * Connect to signaling server
   */
  async connect(signalingUrl: string): Promise<void> {
    if (!this.config) {
      throw new Error('Full config not initialized - use legacy constructor');
    }
    this.signalingUrl = signalingUrl;
    const config = this.config; // Capture for closure
    
    return new Promise((resolve, reject) => {
      try {
        this.signalingSocket = new WebSocket(signalingUrl);
        
        this.signalingSocket.onopen = () => {
          log.debug('[WebRTC] Connected to signaling server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onConnectionStateChangeCallbacks.forEach(cb => cb(true));
          
          // Join room
          this.sendSignalingMessage({
            type: 'join',
            roomId: config.roomId,
            senderId: config.userId,
            senderName: config.userName,
            payload: this.localPeerInfo,
            timestamp: Date.now(),
          });
          
          resolve();
        };
        
        this.signalingSocket.onmessage = (event) => {
          this.handleSignalingMessage(JSON.parse(event.data));
        };
        
        this.signalingSocket.onerror = (error) => {
          log.error('[WebRTC] Signaling error:', error);
          this.onErrorCallbacks.forEach(cb => cb(new Error('Signaling connection error')));
        };
        
        this.signalingSocket.onclose = () => {
          log.debug('[WebRTC] Signaling connection closed');
          this.isConnected = false;
          this.onConnectionStateChangeCallbacks.forEach(cb => cb(false));
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Connect using manual offer/answer exchange (no signaling server)
   */
  async connectManual(): Promise<void> {
    log.debug('[WebRTC] Manual connection mode enabled');
    this.isConnected = true;
  }

  /**
   * Attempt to reconnect to signaling server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      log.error('[WebRTC] Max reconnection attempts reached');
      this.onErrorCallbacks.forEach(cb => cb(new Error('Failed to reconnect to signaling server')));
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    log.debug(`[WebRTC] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected && this.signalingUrl) {
        this.connect(this.signalingUrl).catch(console.error);
      }
    }, delay);
  }

  /**
   * Handle incoming signaling message
   */
  private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    if (!this.config) return;
    
    // Ignore messages from self
    if (message.senderId === this.config.userId) return;
    
    // Ignore messages not for this room
    if (message.roomId !== this.config.roomId) return;
    
    // Ignore messages targeted to other peers
    if (message.targetId && message.targetId !== this.config.userId) return;
    
    log.debug(`[WebRTC] Received ${message.type} from ${message.senderName}`);
    
    switch (message.type) {
      case 'join':
        await this.handlePeerJoined(message);
        break;
      case 'leave':
        this.handlePeerLeft(message);
        break;
      case 'offer':
        await this.handleOffer(message);
        break;
      case 'answer':
        await this.handleAnswer(message);
        break;
      case 'candidate':
        await this.handleCandidate(message);
        break;
      case 'chat':
        this.handleChatMessage(message);
        break;
      case 'reaction':
        this.handleReaction(message);
        break;
      case 'state-update':
        this.handleStateUpdate(message);
        break;
      case 'whiteboard':
        this.handleWhiteboardData(message);
        break;
    }
  }

  /**
   * Handle peer joined
   */
  private async handlePeerJoined(message: SignalingMessage): Promise<void> {
    if (!this.config) return;
    
    const peerInfo = message.payload as PeerInfo;
    this.peers.set(message.senderId, peerInfo);
    
    this.onPeerJoinedCallbacks.forEach(cb => cb(peerInfo));
    
    // Create offer if we're the host or have lower ID
    if (this.config.isHost || this.config.userId < message.senderId) {
      await this.createLegacyPeerConnection(message.senderId);
      await this.createLegacyOffer(message.senderId);
    }
  }

  /**
   * Handle peer left
   */
  private handlePeerLeft(message: SignalingMessage): void {
    const peerInfo = this.peers.get(message.senderId);
    if (peerInfo) {
      this.onPeerLeftCallbacks.forEach(cb => cb(peerInfo));
    }
    
    this.closePeerConnection(message.senderId);
    this.peers.delete(message.senderId);
  }

  /**
   * Handle incoming offer
   */
  private async handleOffer(message: SignalingMessage): Promise<void> {
    if (!this.config) return;
    
    const offer = message.payload as RTCSessionDescriptionInit;
    
    await this.createLegacyPeerConnection(message.senderId);
    const pc = this.peerConnections.get(message.senderId);
    
    if (!pc) {
      log.error('[WebRTC] No peer connection for offer');
      return;
    }
    
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    // Process pending candidates
    await this.processPendingCandidates(message.senderId);
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    this.sendSignalingMessage({
      type: 'answer',
      roomId: this.config.roomId,
      senderId: this.config.userId,
      senderName: this.config.userName,
      targetId: message.senderId,
      payload: answer,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle incoming answer
   */
  private async handleAnswer(message: SignalingMessage): Promise<void> {
    const answer = message.payload as RTCSessionDescriptionInit;
    const pc = this.peerConnections.get(message.senderId);
    
    if (!pc) {
      log.error('[WebRTC] No peer connection for answer');
      return;
    }
    
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    
    // Process pending candidates
    await this.processPendingCandidates(message.senderId);
  }

  /**
   * Handle incoming ICE candidate
   */
  private async handleCandidate(message: SignalingMessage): Promise<void> {
    const candidate = message.payload as RTCIceCandidateInit;
    const pc = this.peerConnections.get(message.senderId);
    
    if (!pc) {
      // Store candidate for later
      if (!this.pendingCandidates.has(message.senderId)) {
        this.pendingCandidates.set(message.senderId, []);
      }
      this.pendingCandidates.get(message.senderId)!.push(candidate);
      return;
    }
    
    if (pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      // Store candidate for later
      if (!this.pendingCandidates.has(message.senderId)) {
        this.pendingCandidates.set(message.senderId, []);
      }
      this.pendingCandidates.get(message.senderId)!.push(candidate);
    }
  }

  /**
   * Process pending ICE candidates
   */
  private async processPendingCandidates(peerId: string): Promise<void> {
    const candidates = this.pendingCandidates.get(peerId);
    const pc = this.peerConnections.get(peerId);
    
    if (!candidates || !pc) return;
    
    for (const candidate of candidates) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    
    this.pendingCandidates.delete(peerId);
  }

  /**
   * Handle chat message
   */
  private handleChatMessage(message: SignalingMessage): void {
    const chatMessage = message.payload as ChatMessage;
    this.onChatMessageCallbacks.forEach(cb => cb(chatMessage));
  }

  /**
   * Handle reaction
   */
  private handleReaction(message: SignalingMessage): void {
    const reaction = message.payload as ReactionMessage;
    this.onReactionCallbacks.forEach(cb => cb(reaction));
  }

  /**
   * Handle state update
   */
  private handleStateUpdate(message: SignalingMessage): void {
    const state = message.payload as PeerInfo;
    this.peers.set(message.senderId, state);
    this.onStateUpdateCallbacks.forEach(cb => cb(state));
  }

  /**
   * Handle whiteboard data
   */
  private handleWhiteboardData(message: SignalingMessage): void {
    this.onDataCallbacks.forEach(cb => cb(message.senderId, message.payload));
  }

  /**
   * Create peer connection (legacy multi-peer API)
   */
  private async createLegacyPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    if (!this.config) {
      throw new Error('Full config not initialized - use legacy constructor');
    }
    // Close existing connection if any
    this.closePeerConnection(peerId);
    
    const pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });
    
    this.peerConnections.set(peerId, pc);
    
    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.config) {
        this.sendSignalingMessage({
          type: 'candidate',
          roomId: this.config.roomId,
          senderId: this.config.userId,
          senderName: this.config.userName,
          targetId: peerId,
          payload: event.candidate.toJSON(),
          timestamp: Date.now(),
        });
      }
    };
    
    // Handle remote tracks
    pc.ontrack = (event) => {
      log.debug(`[WebRTC] Received remote track from ${peerId}`);
      
      let remoteStream = this.remoteStreams.get(peerId);
      if (!remoteStream) {
        remoteStream = new MediaStream();
        this.remoteStreams.set(peerId, remoteStream);
      }
      
      remoteStream.addTrack(event.track);
      this.onRemoteStreamCallbacks.forEach(cb => cb(peerId, remoteStream!));
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      log.debug(`[WebRTC] Connection state with ${peerId}: ${pc.connectionState}`);
      
      if (pc.connectionState === 'failed') {
        this.onErrorCallbacks.forEach(cb => cb(new Error(`Connection with ${peerId} failed`)));
      }
    };
    
    // Create data channel
    const dataChannel = pc.createDataChannel('data', {
      ordered: true,
    });
    this.setupLegacyDataChannel(peerId, dataChannel);
    
    // Handle incoming data channels
    pc.ondatachannel = (event) => {
      this.setupLegacyDataChannel(peerId, event.channel);
    };
    
    return pc;
  }

  /**
   * Setup data channel (legacy multi-peer API)
   */
  private setupLegacyDataChannel(peerId: string, channel: RTCDataChannel): void {
    channel.onopen = () => {
      log.debug(`[WebRTC] Data channel with ${peerId} opened`);
      this.dataChannels.set(peerId, channel);
    };
    
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onDataCallbacks.forEach(cb => cb(peerId, data));
      } catch {
        log.error('[WebRTC] Failed to parse data channel message');
      }
    };
    
    channel.onclose = () => {
      log.debug(`[WebRTC] Data channel with ${peerId} closed`);
      this.dataChannels.delete(peerId);
    };
  }

  /**
   * Create and send offer (legacy multi-peer API)
   */
  private async createLegacyOffer(peerId: string): Promise<void> {
    if (!this.config) return;
    
    const pc = this.peerConnections.get(peerId);
    if (!pc) return;
    
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    
    await pc.setLocalDescription(offer);
    
    this.sendSignalingMessage({
      type: 'offer',
      roomId: this.config.roomId,
      senderId: this.config.userId,
      senderName: this.config.userName,
      targetId: peerId,
      payload: offer,
      timestamp: Date.now(),
    });
  }

  /**
   * Close peer connection
   */
  private closePeerConnection(peerId: string): void {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    
    const dc = this.dataChannels.get(peerId);
    if (dc) {
      dc.close();
      this.dataChannels.delete(peerId);
    }
    
    this.remoteStreams.delete(peerId);
    this.pendingCandidates.delete(peerId);
  }

  /**
   * Send signaling message
   */
  private sendSignalingMessage(message: SignalingMessage): void {
    if (this.signalingSocket && this.signalingSocket.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify(message));
    }
  }

  /**
   * Generate offer for manual exchange
   */
  async generateOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    await this.createLegacyPeerConnection(peerId);
    const pc = this.peerConnections.get(peerId);
    
    if (!pc) {
      throw new Error('Failed to create peer connection');
    }
    
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    
    await pc.setLocalDescription(offer);
    
    // Wait for ICE gathering to complete
    await this.waitForIceGathering(pc);
    
    return pc.localDescription!;
  }

  /**
   * Apply answer for manual exchange
   */
  async applyAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    
    if (!pc) {
      throw new Error('No peer connection found');
    }
    
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Apply offer for manual exchange (joining party)
   */
  async applyOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.createLegacyPeerConnection(peerId);
    const pc = this.peerConnections.get(peerId);
    
    if (!pc) {
      throw new Error('Failed to create peer connection');
    }
    
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    // Wait for ICE gathering to complete
    await this.waitForIceGathering(pc);
    
    return pc.localDescription!;
  }

  /**
   * Wait for ICE gathering to complete
   */
  private waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }
      
      const checkState = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }
      };
      
      pc.addEventListener('icegatheringstatechange', checkState);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        pc.removeEventListener('icegatheringstatechange', checkState);
        resolve();
      }, 10000);
    });
  }

  /**
   * Send chat message
   */
  sendChatMessage(text: string): void {
    if (!this.config) {
      throw new Error('Full config not initialized - use legacy constructor');
    }
    const message: ChatMessage = {
      id: `chat_${Date.now()}`,
      senderId: this.config.userId,
      senderName: this.config.userName,
      text,
      timestamp: Date.now(),
    };
    
    this.sendSignalingMessage({
      type: 'chat',
      roomId: this.config.roomId,
      senderId: this.config.userId,
      senderName: this.config.userName,
      payload: message,
      timestamp: Date.now(),
    });
    
    // Also send through data channels for reliability
    this.broadcastData({ type: 'chat', payload: message });
  }

  /**
   * Send reaction
   */
  sendReaction(emoji: string): void {
    if (!this.config) {
      throw new Error('Full config not initialized - use legacy constructor');
    }
    const reaction: ReactionMessage = {
      emoji,
      senderId: this.config.userId,
      senderName: this.config.userName,
    };
    
    this.sendSignalingMessage({
      type: 'reaction',
      roomId: this.config.roomId,
      senderId: this.config.userId,
      senderName: this.config.userName,
      payload: reaction,
      timestamp: Date.now(),
    });
  }

  /**
   * Update local state and broadcast
   */
  updateLocalState(updates: Partial<PeerInfo>): void {
    if (!this.config || !this.localPeerInfo) return;
    
    this.localPeerInfo = { ...this.localPeerInfo, ...updates };
    
    this.sendSignalingMessage({
      type: 'state-update',
      roomId: this.config.roomId,
      senderId: this.config.userId,
      senderName: this.config.userName,
      payload: this.localPeerInfo,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast data through all data channels
   */
  broadcastData(data: unknown): void {
    const message = JSON.stringify(data);
    this.dataChannels.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(message);
      }
    });
  }

  /**
   * Toggle audio
   */
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
    this.updateLocalState({ audioEnabled: enabled });
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
    this.updateLocalState({ videoEnabled: enabled });
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(): Promise<MediaStream> {
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    
    // Replace video track in all peer connections
    const videoTrack = this.screenStream.getVideoTracks()[0];
    
    this.peerConnections.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    });
    
    // Handle screen share end
    videoTrack.onended = () => {
      this.stopScreenShare();
    };
    
    this.updateLocalState({ screenSharing: true });
    
    return this.screenStream;
  }

  /**
   * Stop screen sharing
   */
  stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
    
    // Restore original video track
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      
      this.peerConnections.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });
    }
    
    this.updateLocalState({ screenSharing: false });
  }

  /**
   * Toggle hand raise
   */
  toggleHandRaise(raised: boolean): void {
    this.updateLocalState({ handRaised: raised });
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get screen stream
   */
  getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  /**
   * Get remote stream for peer
   */
  getRemoteStream(peerId: string): MediaStream | null {
    return this.remoteStreams.get(peerId) || null;
  }

  /**
   * Get all remote streams
   */
  getAllRemoteStreams(): Map<string, MediaStream> {
    return new Map(this.remoteStreams);
  }

  /**
   * Get all peers
   */
  getPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get local peer info
   */
  getLocalPeerInfo(): PeerInfo | null {
    return this.localPeerInfo ? { ...this.localPeerInfo } : null;
  }

  /**
   * Check if connected
   */
  isConnectedToSignaling(): boolean {
    return this.isConnected;
  }

  // Event registration methods
  onRemoteStream(callback: (peerId: string, stream: MediaStream) => void): void {
    this.onRemoteStreamCallbacks.push(callback);
  }

  onPeerJoined(callback: PeerCallback): void {
    this.onPeerJoinedCallbacks.push(callback);
  }

  onPeerLeft(callback: PeerCallback): void {
    this.onPeerLeftCallbacks.push(callback);
  }

  onChatMessage(callback: ChatCallback): void {
    this.onChatMessageCallbacks.push(callback);
  }

  onReaction(callback: ReactionCallback): void {
    this.onReactionCallbacks.push(callback);
  }

  onError(callback: ErrorCallback): void {
    this.onErrorCallbacks.push(callback);
  }

  onStateUpdate(callback: StateCallback): void {
    this.onStateUpdateCallbacks.push(callback);
  }

  onData(callback: DataCallback): void {
    this.onDataCallbacks.push(callback);
  }

  onConnectionStateChange(callback: (connected: boolean) => void): void {
    this.onConnectionStateChangeCallbacks.push(callback);
  }

  /**
   * Leave room and cleanup
   */
  async disconnect(): Promise<void> {
    // Notify others we're leaving
    if (this.config) {
      this.sendSignalingMessage({
        type: 'leave',
        roomId: this.config.roomId,
        senderId: this.config.userId,
        senderName: this.config.userName,
        payload: null,
        timestamp: Date.now(),
      });
    }
    
    // Close all peer connections
    this.peerConnections.forEach((pc, peerId) => {
      this.closePeerConnection(peerId);
    });
    
    // Stop local streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
    
    // Close signaling connection
    if (this.signalingSocket) {
      this.signalingSocket.close();
      this.signalingSocket = null;
    }
    
    // Clear state
    this.peers.clear();
    this.remoteStreams.clear();
    this.dataChannels.clear();
    this.peerConnections.clear();
    this.pendingCandidates.clear();
    this.isConnected = false;
    
    log.debug('[WebRTC] Disconnected');
  }

  // ---------------------------------------------------------------------------
  // Backend P2P Integration Methods
  // ---------------------------------------------------------------------------

  /**
   * Create a P2P room using backend service
   */
  static async createBackendRoom(maxPeers: number = 10): Promise<BackendP2PRoom> {
    return BackendP2PAPI.createRoom(maxPeers);
  }

  /**
   * Join a P2P room using backend service
   */
  static async joinBackendRoom(roomCode: string): Promise<BackendP2PRoom> {
    return BackendP2PAPI.joinRoom(roomCode);
  }

  /**
   * Leave a P2P room using backend service
   */
  static async leaveBackendRoom(roomId: string): Promise<void> {
    return BackendP2PAPI.leaveRoom(roomId);
  }

  /**
   * Send a file to peers in a P2P room
   */
  static async sendFileToRoom(roomId: string, filePath: string): Promise<string> {
    return BackendP2PAPI.sendFile(roomId, filePath);
  }

  /**
   * Receive a file from a P2P transfer
   */
  static async receiveFileFromPeer(transferId: string, savePath: string): Promise<void> {
    return BackendP2PAPI.receiveFile(transferId, savePath);
  }

  /**
   * Cancel an ongoing P2P file transfer
   */
  static async cancelFileTransfer(transferId: string): Promise<void> {
    return BackendP2PAPI.cancelTransfer(transferId);
  }

  /**
   * Get details of a P2P file transfer
   */
  static async getTransferDetails(transferId: string): Promise<BackendP2PTransfer | null> {
    return BackendP2PAPI.getTransfer(transferId);
  }

  /**
   * List all active P2P file transfers
   */
  static async listActiveTransfers(): Promise<BackendP2PTransfer[]> {
    return BackendP2PAPI.listTransfers();
  }

  /**
   * Get details of a P2P room
   */
  static async getRoomDetails(roomId: string): Promise<BackendP2PRoom | null> {
    return BackendP2PAPI.getRoom(roomId);
  }

  /**
   * List all active P2P rooms
   */
  static async listActiveRooms(): Promise<BackendP2PRoom[]> {
    return BackendP2PAPI.listRooms();
  }

  /**
   * Get ICE servers from backend for optimal connectivity
   */
  static async getBackendICEServers(): Promise<ICEServer[]> {
    const backendServers = await BackendP2PAPI.getICEServers();
    if (!backendServers) {
      return DEFAULT_ICE_SERVERS;
    }

    const iceServers: ICEServer[] = [
      // Add STUN servers
      ...backendServers.stun.map((url) => ({ urls: url })),
      // Add TURN servers
      ...backendServers.turn.map((server) => ({
        urls: server.urls,
        username: server.username,
        credential: server.credential,
      })),
    ];

    return iceServers.length > 0 ? iceServers : DEFAULT_ICE_SERVERS;
  }

  /**
   * Get downloads directory from backend
   */
  static async getDownloadsDirectory(): Promise<string | null> {
    return BackendP2PAPI.getDownloadsDir();
  }
}

// Factory function
export function createWebRTCConnection(config: ConnectionConfig): WebRTCConnectionService {
  return new WebRTCConnectionService(config);
}

export default WebRTCConnectionService;
