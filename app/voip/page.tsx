"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Phone, PhoneCall, PhoneOff, PhoneMissed,
  Mic, MicOff, Volume2, User, Clock, Settings,
  Hash, Signal, SignalHigh, SignalLow, SignalMedium, Wifi, WifiOff,
  Copy, Check, Info, Video, VideoOff,
  ScreenShare, ScreenShareOff, Users, UserPlus, MessageSquare,
  Send, Circle, Square,
  Download, Play, Pause, Voicemail, Star,
  PhoneForwarded, PhoneIncoming,
  VolumeX, Radio, Disc, Share2, QrCode, Mail,
  MessageCircle, Maximize2,
  Minimize2, X, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  voipService, 
  CallState, 
  CallStats,
  getConnectionQuality,
  VoIPContact,
  VoIPCallHistoryEntry,
} from '@/lib/services/voipService';

// ============================================
// Interfaces - Discord-like VoIP
// ============================================

interface Contact {
  id: string;
  name: string;
  number: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
  isFavorite?: boolean;
  email?: string;
}

interface CallRecord {
  id: string;
  contact: Contact;
  type: 'incoming' | 'outgoing' | 'missed';
  duration: number;
  timestamp: Date;
  hasRecording?: boolean;
  hasVoicemail?: boolean;
  notes?: string;
}

interface ConferenceParticipant {
  id: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  isHost: boolean;
  joinedAt: Date;
}

interface ConferenceRoom {
  id: string;
  name: string;
  code: string;
  host: ConferenceParticipant;
  participants: ConferenceParticipant[];
  isRecording: boolean;
  startedAt: Date;
  maxParticipants: number;
  settings: {
    allowScreenShare: boolean;
    allowChat: boolean;
    muteOnJoin: boolean;
    requirePassword: boolean;
    password?: string;
  };
}

interface Recording {
  id: string;
  callId: string;
  contactName: string;
  duration: number;
  size: number;
  createdAt: Date;
  filePath: string;
  isPlaying?: boolean;
}

interface Voicemail {
  id: string;
  from: Contact;
  duration: number;
  createdAt: Date;
  isRead: boolean;
  transcription?: string;
  audioUrl: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'emoji';
  fileUrl?: string;
  fileName?: string;
}

type TurnProviderType = 'google_stun' | 'twilio' | 'metered' | 'custom';

export default function VoIPPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // ============================================
  // State - Basic Call
  // ============================================
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState<CallState | null>(null);
  const [callStats, setCallStats] = useState<CallStats | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // ============================================
  // State - Video & Screen Share
  // ============================================
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [volume, setVolume] = useState(80);
  
  // ============================================
  // State - Conference
  // ============================================
  const [isInConference, setIsInConference] = useState(false);
  const [conferenceRoom, setConferenceRoom] = useState<ConferenceRoom | null>(null);
  const [showCreateConference, setShowCreateConference] = useState(false);
  const [showJoinConference, setShowJoinConference] = useState(false);
  const [conferenceCode, setConferenceCode] = useState('');
  const [newConference, setNewConference] = useState({
    name: '',
    maxParticipants: 10,
    allowScreenShare: true,
    allowChat: true,
    muteOnJoin: false,
    requirePassword: false,
    password: ''
  });
  
  // ============================================
  // State - Recording
  // ============================================
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [showRecordings, setShowRecordings] = useState(false);
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  
  // ============================================
  // State - Voicemail
  // ============================================
  const [voicemails, _setVoicemails] = useState<Voicemail[]>([]);
  const [_showVoicemail, setShowVoicemail] = useState(false);
  const [unreadVoicemails, _setUnreadVoicemails] = useState(0);
  
  // ============================================
  // State - Chat (in-call)
  // ============================================
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // ============================================
  // State - Share & QR
  // ============================================
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // ============================================
  // State - UI
  // ============================================
  const [activeTab, setActiveTab] = useState('dialpad');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [_viewMode, _setViewMode] = useState<'grid' | 'list'>('list');
  
  // Signaling state (for manual code exchange)
  const [localSdp, setLocalSdp] = useState('');
  const [remoteSdp, setRemoteSdp] = useState('');
  const [_localCandidates, setLocalCandidates] = useState<string[]>([]);
  const [showSignaling, setShowSignaling] = useState(false);
  const [copiedOffer, setCopiedOffer] = useState(false);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  
  // TURN settings
  const [showSettings, setShowSettings] = useState(false);
  const [turnProvider, setTurnProvider] = useState<TurnProviderType>('google_stun');
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [meteredApiKey, setMeteredApiKey] = useState('');
  const [hasTurnServers, setHasTurnServers] = useState(false);
  
  // Contacts and history - loaded from service
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // ============================================
  // Helper Functions
  // ============================================
  
  const generateConferenceCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 9; i++) {
      if (i === 3 || i === 6) code += '-';
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const generateQRCode = (data: string): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  };

  const getShareUrl = (): string => {
    if (conferenceRoom) {
      return `cube://voip/join/${conferenceRoom.code}`;
    }
    return `cube://voip/call/${phoneNumber}`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDurationDisplay = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================
  // Share Functions
  // ============================================

  const handleShareVia = (method: 'email' | 'whatsapp' | 'qr' | 'copy') => {
    const shareUrl = getShareUrl();
    const code = conferenceRoom?.code || generateConferenceCode();
    
    switch (method) {
      case 'email':
        const emailSubject = 'Join my CUBE VoIP Call';
        const emailBody = `Join my call using this link: ${shareUrl}\n\nOr use code: ${code}`;
        window.open(`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`);
        break;
      case 'whatsapp':
        const whatsappText = `Join my CUBE VoIP call!\n\nLink: ${shareUrl}\nCode: ${code}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`);
        break;
      case 'qr':
        setShowQRDialog(true);
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: 'Copied!', description: 'Link copied to clipboard' });
        break;
    }
  };

  // ============================================
  // Recording Functions
  // ============================================

  const startRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingDuration(d => d + 1);
    }, 1000);
    toast({ title: 'Recording Started', description: 'Call is being recorded' });
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    const newRecording: Recording = {
      id: `rec-${Date.now()}`,
      callId: `call-${Date.now()}`,
      contactName: phoneNumber || 'Unknown',
      duration: recordingDuration,
      size: recordingDuration * 16000,
      createdAt: new Date(),
      filePath: `/recordings/call-${Date.now()}.webm`
    };
    
    setRecordings(prev => [newRecording, ...prev]);
    toast({ title: 'Recording Saved', description: `${formatDurationDisplay(recordingDuration)} recorded` });
  };

  const playRecording = (recording: Recording) => {
    if (playingRecordingId === recording.id) {
      setPlayingRecordingId(null);
    } else {
      setPlayingRecordingId(recording.id);
      toast({ title: 'Playing', description: recording.contactName });
    }
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Deleted', description: 'Recording removed' });
  };

  // ============================================
  // Conference Functions
  // ============================================

  const createConference = () => {
    const code = generateConferenceCode();
    const room: ConferenceRoom = {
      id: `conf-${Date.now()}`,
      name: newConference.name || 'My Conference',
      code,
      host: {
        id: 'self',
        name: 'You',
        isMuted: false,
        isSpeaking: false,
        isScreenSharing: false,
        isHost: true,
        joinedAt: new Date()
      },
      participants: [],
      isRecording: false,
      startedAt: new Date(),
      maxParticipants: newConference.maxParticipants,
      settings: {
        allowScreenShare: newConference.allowScreenShare,
        allowChat: newConference.allowChat,
        muteOnJoin: newConference.muteOnJoin,
        requirePassword: newConference.requirePassword,
        password: newConference.password
      }
    };
    
    setConferenceRoom(room);
    setIsInConference(true);
    setShowCreateConference(false);
    setShowShareDialog(true);
    toast({ title: 'Conference Created', description: `Code: ${code}` });
  };

  const joinConference = () => {
    if (!conferenceCode.trim()) {
      toast({ title: 'Error', description: 'Please enter a conference code', variant: 'destructive' });
      return;
    }
    
    const room: ConferenceRoom = {
      id: `conf-${Date.now()}`,
      name: 'Conference Call',
      code: conferenceCode,
      host: {
        id: 'host-1',
        name: 'Host',
        isMuted: false,
        isSpeaking: true,
        isScreenSharing: false,
        isHost: true,
        joinedAt: new Date(Date.now() - 300000)
      },
      participants: [
        {
          id: 'self',
          name: 'You',
          isMuted: false,
          isSpeaking: false,
          isScreenSharing: false,
          isHost: false,
          joinedAt: new Date()
        }
      ],
      isRecording: false,
      startedAt: new Date(Date.now() - 300000),
      maxParticipants: 10,
      settings: {
        allowScreenShare: true,
        allowChat: true,
        muteOnJoin: false,
        requirePassword: false
      }
    };
    
    setConferenceRoom(room);
    setIsInConference(true);
    setShowJoinConference(false);
    toast({ title: 'Joined Conference', description: `Connected to ${conferenceCode}` });
  };

  const leaveConference = () => {
    setIsInConference(false);
    setConferenceRoom(null);
    if (isRecording) stopRecording();
    toast({ title: 'Left Conference' });
  };

  // ============================================
  // Chat Functions
  // ============================================

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'self',
      senderName: 'You',
      content: chatInput,
      timestamp: new Date(),
      type: 'text'
    };
    
    setChatMessages(prev => [...prev, message]);
    setChatInput('');
    
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // ============================================
  // Screen Share Functions
  // ============================================

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      toast({ title: 'Screen Share Stopped' });
    } else {
      try {
        setIsScreenSharing(true);
        toast({ title: 'Screen Sharing', description: 'Your screen is now visible' });
      } catch (_error) {
        toast({ title: 'Error', description: 'Failed to share screen', variant: 'destructive' });
      }
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    toast({ title: isVideoEnabled ? 'Camera Off' : 'Camera On' });
  };

  // ============================================
  // VoIP Service Functions (existing)
  // ============================================
  const initializeVoIP = useCallback(async () => {
    if (isInitialized || isInitializing) return;
    
    setIsInitializing(true);
    try {
      let result: string;
      
      switch (turnProvider) {
        case 'twilio':
          if (!twilioAccountSid || !twilioAuthToken) {
            toast({ 
              title: 'Configuration Required', 
              description: 'Please enter Twilio credentials',
              variant: 'destructive'
            });
            setIsInitializing(false);
            return;
          }
          result = await voipService.initializeWithTwilio(twilioAccountSid, twilioAuthToken, false);
          break;
        case 'metered':
          if (!meteredApiKey) {
            toast({ 
              title: 'Configuration Required', 
              description: 'Please enter Metered API key',
              variant: 'destructive'
            });
            setIsInitializing(false);
            return;
          }
          result = await voipService.initializeWithMetered(meteredApiKey, false);
          break;
        default:
          result = await voipService.quickStart(false);
      }
      
      setIsInitialized(true);
      const hasTurn = await voipService.hasTurnServers();
      setHasTurnServers(hasTurn);
      
      toast({ 
        title: 'VoIP Ready', 
        description: result 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize VoIP';
      toast({ 
        title: 'Initialization Failed', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setIsInitializing(false);
    }
  }, [turnProvider, twilioAccountSid, twilioAuthToken, meteredApiKey, isInitialized, isInitializing, toast]);

  // Call duration timer
  useEffect(() => {
    if (isInCall) {
      intervalRef.current = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);
      
      // Poll call state and stats
      statsIntervalRef.current = setInterval(async () => {
        try {
          const state = await voipService.getCallState();
          setCallState(state);
          
          if (state.is_active) {
            const stats = await voipService.getCallStats();
            setCallStats(stats);
          }
        } catch (error) {
          log.error('Failed to get call state:', error);
        }
      }, 2000);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, [isInCall]);

  // Load contacts and call history from service
  useEffect(() => {
    const loadData = async () => {
      setLoadingContacts(true);
      try {
        // Load contacts
        const serviceContacts = await voipService.getContacts();
        const mappedContacts: Contact[] = serviceContacts.map((c: VoIPContact) => ({
          id: c.id,
          name: c.name,
          number: c.phone || c.sipUri || '',
          avatar: c.avatar,
        }));
        setContacts(mappedContacts);

        // Load call history
        const serviceHistory = await voipService.getCallHistory(50);
        const mappedHistory: CallRecord[] = serviceHistory.map((h: VoIPCallHistoryEntry) => ({
          id: h.id,
          contact: {
            id: h.contactId || h.id,
            name: h.contactName,
            number: h.phone || '',
          },
          type: h.type === 'outgoing' ? 'outgoing' : h.type === 'incoming' ? 'incoming' : 'missed',
          duration: h.duration,
          timestamp: new Date(h.startTime),
        }));
        setCallHistory(mappedHistory);
      } catch (error) {
        log.error('Failed to load VoIP data:', error);
        // Arrays stay empty on error - no mock data
      } finally {
        setLoadingContacts(false);
      }
    };

    loadData();
  }, []);

  const handleDial = (digit: string) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  // Create WebRTC offer
  const createOffer = async () => {
    if (!isInitialized) {
      await initializeVoIP();
    }
    
    setIsCreatingOffer(true);
    try {
      const offer = await voipService.createOffer();
      setLocalSdp(JSON.stringify(offer, null, 2));
      
      // Wait a bit for ICE candidates to gather
      setTimeout(async () => {
        const candidates = await voipService.getIceCandidates();
        setLocalCandidates(candidates);
        setShowSignaling(true);
        
        toast({ title: 'Offer Created', description: 'Share the offer with your peer' });
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create offer';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsCreatingOffer(false);
    }
  };

  // Accept remote SDP (offer or answer)
  const acceptRemoteSdp = async () => {
    if (!remoteSdp.trim()) {
      toast({ title: 'Error', description: 'Please paste the remote SDP', variant: 'destructive' });
      return;
    }

    try {
      const sdp = JSON.parse(remoteSdp);
      await voipService.setRemoteDescription(sdp);
      
      // If it's an offer, create an answer
      if (sdp.type === 'offer') {
        const answer = await voipService.createAnswer();
        setLocalSdp(JSON.stringify(answer, null, 2));
        
        setTimeout(async () => {
          const candidates = await voipService.getIceCandidates();
          setLocalCandidates(candidates);
        }, 2000);
        
        toast({ title: 'Answer Created', description: 'Share the answer with your peer' });
      } else {
        toast({ title: 'Connected', description: 'Remote answer accepted' });
      }
      
      setIsInCall(true);
      setCallDuration(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set remote description';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const startCall = async (number?: string) => {
    const dialNumber = number || phoneNumber;
    if (!dialNumber.trim()) {
      toast({ title: 'Error', description: 'Please enter a phone number', variant: 'destructive' });
      return;
    }
    
    // For real calls, we need to establish a WebRTC connection
    // Show signaling dialog for manual code exchange
    await createOffer();
  };

  const endCall = async () => {
    try {
      await voipService.close();
    } catch (error) {
      log.error('Error closing VoIP:', error);
    }
    
    setIsInCall(false);
    setIsInitialized(false);
    setLocalSdp('');
    setRemoteSdp('');
    setLocalCandidates([]);
    setCallState(null);
    setCallStats(null);
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    
    toast({ title: 'Call Ended', description: `Duration: ${formatDurationDisplay(callDuration)}` });
  };

  const toggleMute = async () => {
    try {
      await voipService.setMuted(!isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      log.error('Error toggling mute:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOffer(true);
    setTimeout(() => setCopiedOffer(false), 2000);
    toast({ title: 'Copied', description: 'SDP copied to clipboard' });
  };

  const getSignalIcon = () => {
    if (!callStats) return <Signal className="h-4 w-4" />;
    const { quality } = getConnectionQuality(callStats);
    switch (quality) {
      case 'excellent': return <SignalHigh className="h-4 w-4 text-green-500" />;
      case 'good': return <SignalMedium className="h-4 w-4 text-green-400" />;
      case 'fair': return <SignalLow className="h-4 w-4 text-yellow-500" />;
      case 'poor': return <Signal className="h-4 w-4 text-red-500" />;
    }
  };

  const dialPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">VoIP Pro</h1>
            </div>
            <Badge variant="secondary">Discord-like</Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* Voicemail Badge */}
            {unreadVoicemails > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowVoicemail(true)} className="relative">
                <Voicemail className="h-4 w-4 mr-1" />
                Voicemail
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadVoicemails}
                </Badge>
              </Button>
            )}
            {/* Recordings */}
            <Button variant="outline" size="sm" onClick={() => setShowRecordings(true)}>
              <Disc className="h-4 w-4 mr-1" />
              Recordings ({recordings.length})
            </Button>
            {/* Connection Status */}
            {isInitialized && (
              <Badge variant={hasTurnServers ? "default" : "secondary"} className="gap-1">
                {hasTurnServers ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {hasTurnServers ? 'TURN' : 'STUN'}
              </Badge>
            )}
            {/* Settings Button */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>VoIP Settings</DialogTitle>
                  <DialogDescription>
                    Configure TURN servers and audio settings.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {/* Audio Settings */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Audio</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Speaker Volume</Label>
                        <span className="text-sm text-muted-foreground">{volume}%</span>
                      </div>
                      <Slider value={[volume]} onValueChange={(v) => setVolume(v[0])} max={100} step={1} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Noise Suppression</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Echo Cancellation</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* TURN Provider */}
                  <div className="space-y-2">
                    <Label>TURN Provider</Label>
                    <Select value={turnProvider} onValueChange={(v) => setTurnProvider(v as TurnProviderType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google_stun">Google STUN (Free, Limited)</SelectItem>
                        <SelectItem value="twilio">Twilio (Requires Account)</SelectItem>
                        <SelectItem value="metered">Metered.ca (Free Tier Available)</SelectItem>
                        <SelectItem value="custom">Custom Server</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {turnProvider === 'twilio' && (
                    <>
                      <div className="space-y-2">
                        <Label>Account SID</Label>
                        <Input 
                          value={twilioAccountSid} 
                          onChange={(e) => setTwilioAccountSid(e.target.value)}
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Auth Token</Label>
                        <Input 
                          type="password"
                          value={twilioAuthToken} 
                          onChange={(e) => setTwilioAuthToken(e.target.value)}
                          placeholder="Your auth token"
                        />
                      </div>
                    </>
                  )}
                  
                  {turnProvider === 'metered' && (
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input 
                        value={meteredApiKey} 
                        onChange={(e) => setMeteredApiKey(e.target.value)}
                        placeholder="Your Metered.ca API key"
                      />
                    </div>
                  )}
                  
                  {turnProvider === 'google_stun' && (
                    <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-700 dark:text-yellow-500">Limited NAT Traversal</h4>
                          <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80 mt-1">
                            Google STUN servers only help discover your public IP.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => {
                      setIsInitialized(false);
                      setShowSettings(false);
                      toast({ title: 'Settings Saved' });
                    }}
                    className="w-full"
                  >
                    Save & Reinitialize
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Action Bar */}
        {!isInCall && !isInConference && (
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border-b">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Conference Calls</h3>
                  <p className="text-sm text-muted-foreground">Host or join video conferences</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowJoinConference(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join Conference
                </Button>
                <Button onClick={() => setShowCreateConference(true)}>
                  <Radio className="h-4 w-4 mr-2" />
                  Start Conference
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Tabs */}
          <div className="w-80 border-r border-border flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="m-2 grid grid-cols-4">
                <TabsTrigger value="dialpad"><Hash className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="contacts"><User className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="history"><Clock className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="voicemail"><Voicemail className="h-4 w-4" /></TabsTrigger>
              </TabsList>

              <TabsContent value="dialpad" className="flex-1 overflow-hidden m-0 p-4">
                <Card className="p-4">
                  {/* Number Display */}
                  <div className="text-center mb-4">
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="text-xl text-center font-mono h-12"
                      placeholder="Enter number"
                    />
                  </div>

                  {/* Dial Pad */}
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {dialPad.flat().map((digit) => (
                      <Button
                        key={digit}
                        variant="outline"
                        className="h-12 text-lg font-medium"
                        onClick={() => handleDial(digit)}
                      >
                        {digit}
                      </Button>
                    ))}
                  </div>

                  {/* Call Buttons */}
                  <div className="flex justify-center gap-3 mt-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12"
                      onClick={handleBackspace}
                    >
                      ⌫
                    </Button>
                    <Button
                      className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700"
                      onClick={() => startCall()}
                      disabled={isCreatingOffer || isInitializing}
                    >
                      {isCreatingOffer || isInitializing ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <PhoneCall className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 w-12 rounded-full"
                      onClick={() => {
                        setIsVideoEnabled(true);
                        startCall();
                      }}
                    >
                      <Video className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="contacts" className="flex-1 overflow-hidden m-0">
                <div className="p-2">
                  <Input 
                    placeholder="Search contacts..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <ScrollArea className="flex-1 px-2">
                  {loadingContacts ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      Loading contacts...
                    </div>
                  ) : contacts.filter(c => 
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.number.includes(searchQuery)
                  ).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <User className="h-8 w-8 mb-2 opacity-50" />
                      <p>No contacts found</p>
                    </div>
                  ) : (
                    contacts.filter(c => 
                      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.number.includes(searchQuery)
                    ).map(contact => (
                      <Card
                        key={contact.id}
                        className="p-3 mb-2 cursor-pointer hover:shadow-md transition-all"
                        onClick={() => startCall(contact.number)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback>{contact.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{contact.name}</span>
                              {contact.isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <span className="text-sm text-muted-foreground">{contact.number}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); startCall(contact.number); }}>
                              <PhoneCall className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setIsVideoEnabled(true); startCall(contact.number); }}>
                              <Video className="h-4 w-4 text-blue-600" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full p-2">
                  {callHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Clock className="h-8 w-8 mb-2 opacity-50" />
                      <p>No call history</p>
                    </div>
                  ) : (
                    callHistory.map(record => (
                      <Card
                        key={record.id}
                        className="p-3 mb-2 cursor-pointer hover:shadow-md transition-all"
                        onClick={() => startCall(record.contact.number)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            record.type === 'missed' ? 'bg-red-500/10' : 
                            record.type === 'incoming' ? 'bg-blue-500/10' : 'bg-green-500/10'
                          }`}>
                            {record.type === 'missed' ? (
                              <PhoneMissed className="h-5 w-5 text-red-500" />
                            ) : record.type === 'incoming' ? (
                              <PhoneIncoming className="h-5 w-5 text-blue-500" />
                            ) : (
                              <PhoneForwarded className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{record.contact.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {record.type === 'missed' ? 'Missed' : formatDurationDisplay(record.duration)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              {record.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {record.hasRecording && <Disc className="h-3 w-3 text-primary mt-1 ml-auto" />}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="voicemail" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full p-2">
                  {voicemails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Voicemail className="h-8 w-8 mb-2 opacity-50" />
                      <p>No voicemails</p>
                    </div>
                  ) : (
                    voicemails.map(vm => (
                      <Card key={vm.id} className={`p-3 mb-2 ${!vm.isRead ? 'border-primary' : ''}`}>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{vm.from.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{vm.from.name}</span>
                              {!vm.isRead && <Circle className="h-2 w-2 fill-primary text-primary" />}
                            </div>
                            <div className="text-sm text-muted-foreground">{formatDurationDisplay(vm.duration)}</div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                        {vm.transcription && (
                          <p className="text-sm text-muted-foreground mt-2 italic">&quot;{vm.transcription}&quot;</p>
                        )}
                      </Card>
                    ))
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Panel - Call/Conference View */}
          <div className="flex-1 p-4 overflow-hidden">
            {isInConference && conferenceRoom ? (
              /* Conference View */
              <Card className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <span className="font-medium">{conferenceRoom.name}</span>
                      <Badge variant="outline" className="ml-2 font-mono">{conferenceRoom.code}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isRecording && (
                      <Badge variant="destructive" className="gap-1 animate-pulse">
                        <Circle className="h-2 w-2 fill-current" /> REC {formatDurationDisplay(recordingDuration)}
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                      <Share2 className="h-4 w-4 mr-1" />Share
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                {/* Video Grid */}
                <div className="flex-1 bg-[var(--video-bg)] p-4 grid grid-cols-2 gap-4">
                  {/* Host */}
                  <div className="relative bg-[var(--video-container)] rounded-lg flex items-center justify-center">
                    {isVideoEnabled ? (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg" />
                    ) : (
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-2xl">YOU</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="absolute bottom-2 left-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{conferenceRoom.host.name}</Badge>
                      {isMuted && <MicOff className="h-3 w-3 text-red-500" />}
                    </div>
                    {isScreenSharing && (
                      <Badge className="absolute top-2 right-2 text-xs">Sharing Screen</Badge>
                    )}
                  </div>
                  
                  {/* Participants */}
                  {conferenceRoom.participants.map(p => (
                    <div key={p.id} className="relative bg-[var(--video-container)] rounded-lg flex items-center justify-center">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-2xl">{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-2 left-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{p.name}</Badge>
                        {p.isMuted && <MicOff className="h-3 w-3 text-red-500" />}
                        {p.isSpeaking && <Volume2 className="h-3 w-3 text-green-500 animate-pulse" />}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Controls */}
                <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-center gap-3">
                  <Button variant={isMuted ? "destructive" : "secondary"} size="lg" className="rounded-full h-12 w-12" onClick={toggleMute}>
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <Button variant={isVideoEnabled ? "secondary" : "outline"} size="lg" className="rounded-full h-12 w-12" onClick={toggleVideo}>
                    {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  <Button variant={isScreenSharing ? "default" : "outline"} size="lg" className="rounded-full h-12 w-12" onClick={toggleScreenShare}>
                    {isScreenSharing ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
                  </Button>
                  <Button variant={isRecording ? "destructive" : "outline"} size="lg" className="rounded-full h-12 w-12" onClick={isRecording ? stopRecording : startRecording}>
                    {isRecording ? <Square className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-full h-12 w-12" onClick={() => setShowChat(!showChat)}>
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                  <Button variant="destructive" size="lg" className="rounded-full h-12 w-12" onClick={leaveConference}>
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </div>
              </Card>
            ) : isInCall ? (
              /* In-Call UI */
              <Card className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="gap-1">{getSignalIcon()} {callState?.connection_state || 'Connected'}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {isRecording && (
                      <Badge variant="destructive" className="gap-1 animate-pulse">
                        <Circle className="h-2 w-2 fill-current" /> {formatDurationDisplay(recordingDuration)}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-muted/50 to-background">
                  {isVideoEnabled ? (
                    <div className="w-64 h-48 bg-[var(--video-container)] rounded-lg flex items-center justify-center mb-4">
                      <Video className="h-16 w-16 text-muted-foreground" />
                    </div>
                  ) : (
                    <Avatar className="h-32 w-32 mb-4">
                      <AvatarFallback className="text-4xl">{phoneNumber?.slice(0, 2) || 'UN'}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <h2 className="text-2xl font-semibold mb-1">{phoneNumber || 'Unknown'}</h2>
                  <p className="text-3xl font-mono text-muted-foreground mb-2">{formatDurationDisplay(callDuration)}</p>
                  
                  {callStats && (
                    <div className="text-xs text-muted-foreground mb-4">
                      RTT: {callStats.rtt_ms}ms • Loss: {callStats.packet_loss.toFixed(1)}% • {(callStats.audio_bitrate / 1000).toFixed(0)}kbps
                    </div>
                  )}
                </div>
                
                {/* Controls */}
                <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-center gap-4">
                  <Button variant={isMuted ? "destructive" : "secondary"} size="lg" className="rounded-full h-14 w-14" onClick={toggleMute}>
                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>
                  <Button variant={isVideoEnabled ? "secondary" : "outline"} size="lg" className="rounded-full h-14 w-14" onClick={toggleVideo}>
                    {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                  </Button>
                  <Button variant={isScreenSharing ? "default" : "outline"} size="lg" className="rounded-full h-14 w-14" onClick={toggleScreenShare}>
                    {isScreenSharing ? <ScreenShareOff className="h-6 w-6" /> : <ScreenShare className="h-6 w-6" />}
                  </Button>
                  <Button variant={isRecording ? "destructive" : "outline"} size="lg" className="rounded-full h-14 w-14" onClick={isRecording ? stopRecording : startRecording}>
                    {isRecording ? <Square className="h-6 w-6" /> : <Disc className="h-6 w-6" />}
                  </Button>
                  <Button variant={isSpeakerOn ? "secondary" : "outline"} size="lg" className="rounded-full h-14 w-14" onClick={() => setIsSpeakerOn(!isSpeakerOn)}>
                    {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                  </Button>
                  <Button variant="destructive" size="lg" className="rounded-full h-14 w-14" onClick={endCall}>
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                </div>
              </Card>
            ) : (
              /* Empty State */
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-lg">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => setShowCreateConference(true)}>
                      <Radio className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <h3 className="font-semibold mb-1">Start Conference</h3>
                      <p className="text-sm text-muted-foreground">Host a video call</p>
                    </Card>
                    <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => setShowJoinConference(true)}>
                      <UserPlus className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <h3 className="font-semibold mb-1">Join Conference</h3>
                      <p className="text-sm text-muted-foreground">Enter a room code</p>
                    </Card>
                  </div>
                  <Separator className="my-6" />
                  <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-xl font-semibold mb-2">Make a Call</h2>
                  <p className="text-muted-foreground">Use the dialpad or select a contact to start</p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Panel (collapsible) */}
          {showChat && (isInCall || isInConference) && (
            <div className="w-80 border-l border-border flex flex-col">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Chat</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowChat(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`mb-3 ${msg.senderId === 'self' ? 'text-right' : ''}`}>
                    <div className={`inline-block max-w-[80%] p-2 rounded-lg ${msg.senderId === 'self' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {msg.senderId !== 'self' && <p className="text-xs font-medium mb-1">{msg.senderName}</p>}
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </ScrollArea>
              <div className="p-3 border-t border-border flex gap-2">
                <Input placeholder="Type a message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()} />
                <Button size="icon" onClick={sendChatMessage}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </div>

        {/* Dialogs */}
        
        {/* Create Conference Dialog */}
        <Dialog open={showCreateConference} onOpenChange={setShowCreateConference}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Conference</DialogTitle>
              <DialogDescription>Create a new conference call</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Conference Name</Label>
                <Input placeholder="Team Meeting" value={newConference.name} onChange={(e) => setNewConference(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow Screen Share</Label>
                <Switch checked={newConference.allowScreenShare} onCheckedChange={(v) => setNewConference(prev => ({ ...prev, allowScreenShare: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow Chat</Label>
                <Switch checked={newConference.allowChat} onCheckedChange={(v) => setNewConference(prev => ({ ...prev, allowChat: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Mute on Join</Label>
                <Switch checked={newConference.muteOnJoin} onCheckedChange={(v) => setNewConference(prev => ({ ...prev, muteOnJoin: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require Password</Label>
                <Switch checked={newConference.requirePassword} onCheckedChange={(v) => setNewConference(prev => ({ ...prev, requirePassword: v }))} />
              </div>
              {newConference.requirePassword && (
                <Input type="password" placeholder="Password" value={newConference.password} onChange={(e) => setNewConference(prev => ({ ...prev, password: e.target.value }))} />
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateConference(false)}>Cancel</Button>
              <Button onClick={createConference}><Radio className="h-4 w-4 mr-2" />Start</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Join Conference Dialog */}
        <Dialog open={showJoinConference} onOpenChange={setShowJoinConference}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Join Conference</DialogTitle>
              <DialogDescription>Enter the conference code</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input placeholder="XXX-XXX-XXX" value={conferenceCode} onChange={(e) => setConferenceCode(e.target.value.toUpperCase())} className="text-center font-mono text-lg tracking-wider" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowJoinConference(false)}>Cancel</Button>
              <Button onClick={joinConference}><UserPlus className="h-4 w-4 mr-2" />Join</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Conference</DialogTitle>
              <DialogDescription>Invite others to join</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Conference Code</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={conferenceRoom?.code || ''} readOnly className="font-mono text-lg tracking-wider text-center" />
                  <Button variant="outline" size="icon" onClick={() => handleShareVia('copy')}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Share via</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" className="flex-col h-20 gap-2" onClick={() => handleShareVia('email')}>
                    <Mail className="h-5 w-5" /><span className="text-xs">Email</span>
                  </Button>
                  <Button variant="outline" className="flex-col h-20 gap-2" onClick={() => handleShareVia('whatsapp')}>
                    <MessageCircle className="h-5 w-5" /><span className="text-xs">WhatsApp</span>
                  </Button>
                  <Button variant="outline" className="flex-col h-20 gap-2" onClick={() => handleShareVia('qr')}>
                    <QrCode className="h-5 w-5" /><span className="text-xs">QR Code</span>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Scan to Join</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={generateQRCode(getShareUrl())} alt="QR Code" className="w-48 h-48" />
              </div>
              <p className="font-mono text-lg tracking-wider">{conferenceRoom?.code}</p>
              <Button variant="outline" className="w-full" onClick={() => handleShareVia('copy')}>
                <Copy className="h-4 w-4 mr-2" />Copy Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Recordings Dialog */}
        <Dialog open={showRecordings} onOpenChange={setShowRecordings}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Recordings</DialogTitle>
              <DialogDescription>Your call recordings</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px]">
              {recordings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Disc className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recordings yet</p>
                </div>
              ) : (
                recordings.map(rec => (
                  <Card key={rec.id} className="p-3 mb-2">
                    <div className="flex items-center gap-3">
                      <Button variant={playingRecordingId === rec.id ? "default" : "outline"} size="icon" className="h-10 w-10 rounded-full" onClick={() => playRecording(rec)}>
                        {playingRecordingId === rec.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <div className="flex-1">
                        <p className="font-medium">{rec.contactName}</p>
                        <p className="text-xs text-muted-foreground">{formatDurationDisplay(rec.duration)} • {formatBytes(rec.size)}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteRecording(rec.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Signaling Dialog */}
        <Dialog open={showSignaling} onOpenChange={setShowSignaling}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>WebRTC Connection</DialogTitle>
              <DialogDescription>Exchange codes with your peer</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {localSdp && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Your SDP</Label>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(localSdp)}>
                      {copiedOffer ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Textarea value={localSdp} readOnly className="h-24 font-mono text-xs" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Peer&apos;s SDP</Label>
                <Textarea value={remoteSdp} onChange={(e) => setRemoteSdp(e.target.value)} placeholder="Paste SDP here..." className="h-24 font-mono text-xs" />
              </div>
              <div className="flex gap-2">
                <Button onClick={acceptRemoteSdp} className="flex-1" disabled={!remoteSdp.trim()}>Accept & Connect</Button>
                <Button variant="outline" onClick={() => { setShowSignaling(false); setLocalSdp(''); setRemoteSdp(''); }}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
