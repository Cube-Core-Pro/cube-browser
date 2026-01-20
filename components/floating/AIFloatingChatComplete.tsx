"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  MessageSquare, X, Send, Minimize2, Maximize2, Bot, Code, Users, 
  Sparkles, Search, Wrench, Workflow, Copy, Check, AlertCircle,
  Phone, Video, PhoneOff, VideoOff, Mic, MicOff, Volume2, VolumeX,
  Paperclip, Image as ImageIcon, FileText, MoreVertical,
  Settings, Moon, Sun, Bell, BellOff, Smile,
  ScreenShare, UserPlus, Trash2, Reply, Pin, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ChatService } from '@/lib/services/ai-service';
import { invoke } from '@tauri-apps/api/core';
import { logger } from '@/lib/services/logger-service';
import './AIFloatingChatComplete.css';

const log = logger.scope('AIFloatingChatComplete');

// ==================== PUBLIC ROUTES (No AI Chat) ====================
// These routes are public-facing pages where the CIPHER AI chat should NOT appear
const PUBLIC_ROUTES = [
  '/',
  '/landing',
  '/pricing',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/gdpr',
  '/affiliates',
  '/investors',
  '/get',
  '/signup',
  '/login',
  '/forgot-password',
  '/waitlist',
  '/cubemail',
  '/help',
  '/developer',
];

/**
 * Check if current path is a public route where AI chat should be hidden
 */
function isPublicRoute(pathname: string): boolean {
  // Exact match
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  
  // Prefix match for sub-routes
  return PUBLIC_ROUTES.some(route => 
    route !== '/' && pathname.startsWith(route + '/')
  );
}

// ==================== TYPES ====================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  replyTo?: string;
  reactions?: { emoji: string; users: string[] }[];
  attachments?: Attachment[];
  isEdited?: boolean;
}

interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  name: string;
  size: number;
  url: string;
  thumbnail?: string;
  duration?: number;
}

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
  isTyping?: boolean;
  unreadCount?: number;
}

interface Group {
  id: string;
  name: string;
  avatar?: string;
  members: Contact[];
  lastMessage?: Message;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
}

interface CallState {
  isActive: boolean;
  type: 'voice' | 'video';
  participant?: Contact;
  duration: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  isScreenSharing: boolean;
}

interface AIPersonality {
  name: string;
  avatar: string;
  greeting: string;
  style: 'professional' | 'friendly' | 'casual' | 'enthusiastic';
  specialties: string[];
}

type ChatMode = 'assistant' | 'nexus' | 'groups' | 'tools' | 'calls';

// ==================== AI PERSONALITIES ====================

const AI_PERSONALITIES: Record<string, AIPersonality> = {
  cipher: {
    name: 'CIPHER',
    avatar: '🔮',
    greeting: 'CIPHER system active. I am your main AI assistant. How can I optimize your workflow today?',
    style: 'professional',
    specialties: ['automation', 'productivity', 'analysis']
  },
  nexus: {
    name: 'NEXUS',
    avatar: '⚡',
    greeting: 'NEXUS online. Code and systems architecture specialist. Give me a technical problem and let\'s solve it.',
    style: 'enthusiastic',
    specialties: ['programming', 'debugging', 'architecture']
  },
  sentinel: {
    name: 'SENTINEL',
    avatar: '🛡️',
    greeting: 'SENTINEL activated. Data protection and analysis at your service. What information do you need to process?',
    style: 'professional',
    specialties: ['security', 'data', 'reports']
  },
  forge: {
    name: 'FORGE',
    avatar: '🔥',
    greeting: 'FORGE ready to create. Design, content, automation - let\'s build something epic together.',
    style: 'casual',
    specialties: ['design', 'content', 'workflows']
  }
};

// ==================== COMPONENT START ====================

export const AIFloatingChatComplete: React.FC = () => {
  // Get current pathname to check if we're on a public route
  const pathname = usePathname();
  
  // NOTE: We check isPublicRoute AFTER all hooks to comply with Rules of Hooks
  // The actual early return happens below after all useState/useEffect declarations
  const isOnPublicRoute = isPublicRoute(pathname);
  
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatMode>('assistant');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Position and Drag State - Start hidden until we calculate position
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // AI Personality State
  const [currentPersonality, setCurrentPersonality] = useState<AIPersonality>(AI_PERSONALITIES.cipher);
  const [showPersonalityPicker, setShowPersonalityPicker] = useState(false);
  
  // Contacts and Groups State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  
  // Call State
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    type: 'voice',
    duration: 0,
    isMuted: false,
    isVideoOff: false,
    isSpeakerOn: true,
    isScreenSharing: false
  });
  
  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // AI Tools State
  const [selectorDescription, setSelectorDescription] = useState('');
  const [generatedSelector, setGeneratedSelector] = useState('');
  const [generatingSelector, setGeneratingSelector] = useState(false);
  const [copiedSelector, setCopiedSelector] = useState(false);
  const [currentSelector, setCurrentSelector] = useState('');
  const [selectorIssue, setSelectorIssue] = useState('');
  const [improvedSelector, setImprovedSelector] = useState('');
  const [improvingSelector, setImprovingSelector] = useState(false);
  const [copiedImprovedSelector, setCopiedImprovedSelector] = useState(false);
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [generatedWorkflow, setGeneratedWorkflow] = useState('');
  const [generatingWorkflow, setGeneratingWorkflow] = useState(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [toolsTab, setToolsTab] = useState('selector');
  const [error, setError] = useState<string | null>(null);

  // ==================== INITIALIZATION ====================
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Position in bottom-right corner by default
      setPosition({ 
        x: window.innerWidth - 80, 
        y: window.innerHeight - 80 
      });
      
      // Load saved position from localStorage
      const savedPosition = localStorage.getItem('cubeChat_position');
      if (savedPosition) {
        try {
          const parsed = JSON.parse(savedPosition);
          setPosition(parsed);
        } catch {
          log.error('Failed to parse saved position');
        }
      }
      
      // Load saved personality
      const savedPersonality = localStorage.getItem('cubeChat_personality');
      if (savedPersonality && AI_PERSONALITIES[savedPersonality]) {
        setCurrentPersonality(AI_PERSONALITIES[savedPersonality]);
      }
      
      // Initialize with welcome message
      initializeChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const initializeChat = () => {
    const welcomeMessage: Message = {
      id: 'welcome-1',
      role: 'assistant',
      content: currentPersonality.greeting,
      timestamp: new Date(),
      status: 'read'
    };
    setMessages([welcomeMessage]);
    
    // Mock contacts for demo
    setContacts([
      { id: '1', name: 'María García', status: 'online', avatar: undefined, unreadCount: 3 },
      { id: '2', name: 'Carlos López', status: 'away', avatar: undefined, unreadCount: 0 },
      { id: '3', name: 'Ana Martínez', status: 'busy', avatar: undefined, unreadCount: 1 },
      { id: '4', name: 'Pedro Sánchez', status: 'offline', avatar: undefined, unreadCount: 0 }
    ]);
    
    // Mock groups for demo
    setGroups([
      { 
        id: 'g1', 
        name: 'Team Workspace', 
        members: [], 
        unreadCount: 5, 
        isPinned: true,
        isMuted: false
      },
      { 
        id: 'g2', 
        name: 'Project Alpha', 
        members: [], 
        unreadCount: 2, 
        isPinned: false,
        isMuted: false
      },
      { 
        id: 'g3', 
        name: 'Design Team', 
        members: [], 
        unreadCount: 0, 
        isPinned: false,
        isMuted: true
      }
    ]);
    
    setUnreadTotal(11);
  };

  // Save position when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !isDragging && position) {
      localStorage.setItem('cubeChat_position', JSON.stringify(position));
    }
  }, [position, isDragging]);

  // ==================== DRAG FUNCTIONALITY (OPTIMIZED) ====================
  
  const dragFrameRef = useRef<number | null>(null);
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (buttonRef.current && !isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      currentPosRef.current = position;
      setIsDragging(true);
      // Add will-change for GPU acceleration
      if (buttonRef.current) {
        buttonRef.current.style.willChange = 'transform';
      }
      e.preventDefault();
    }
  }, [isOpen, position]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isOpen) return;
      
      // Cancel any pending frame
      if (dragFrameRef.current) {
        cancelAnimationFrame(dragFrameRef.current);
      }
      
      // Use requestAnimationFrame for smooth 60fps updates
      dragFrameRef.current = requestAnimationFrame(() => {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        const buttonSize = 56;
        const maxX = window.innerWidth - buttonSize;
        const maxY = window.innerHeight - buttonSize;
        
        const clampedX = Math.max(0, Math.min(newX, maxX));
        const clampedY = Math.max(0, Math.min(newY, maxY));
        
        // Direct DOM manipulation for smooth dragging
        if (buttonRef.current) {
          buttonRef.current.style.left = `${clampedX}px`;
          buttonRef.current.style.top = `${clampedY}px`;
        }
        
        currentPosRef.current = { x: clampedX, y: clampedY };
      });
    };

    const handleMouseUp = () => {
      if (dragFrameRef.current) {
        cancelAnimationFrame(dragFrameRef.current);
      }
      // Update React state only on mouse up
      if (currentPosRef.current && isDragging) {
        setPosition(currentPosRef.current);
      }
      setIsDragging(false);
      // Remove will-change after drag ends
      if (buttonRef.current) {
        buttonRef.current.style.willChange = 'auto';
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      if (dragFrameRef.current) {
        cancelAnimationFrame(dragFrameRef.current);
      }
    };
  }, [isDragging, dragOffset, isOpen]);

  // ==================== AUTO-SCROLL ====================
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ==================== CALL TIMER ====================
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState.isActive) {
      timer = setInterval(() => {
        setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState.isActive]);

  const formatCallDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ==================== MESSAGE HANDLERS ====================

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
      status: 'sending',
      replyTo: replyingTo?.id,
      attachments: selectedFiles.length > 0 ? selectedFiles.map((f, i) => ({
        id: `att-${i}`,
        type: f.type.startsWith('image') ? 'image' : 
              f.type.startsWith('video') ? 'video' : 
              f.type.startsWith('audio') ? 'audio' : 'file',
        name: f.name,
        size: f.size,
        url: URL.createObjectURL(f)
      })) : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setReplyingTo(null);
    setSelectedFiles([]);
    setIsLoading(true);
    setIsTyping(true);

    // Simulate typing indicator
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));

    try {
      let response: string;
      
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const result = await ChatService.sendMessage(input);
        response = result.content;
      } else {
        // Fallback response with personality
        response = generatePersonalityResponse(input, currentPersonality);
      }

      setIsTyping(false);
      
      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        status: 'read'
      };
      
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx].role === 'user') {
          updated[lastIdx] = { ...updated[lastIdx], status: 'read' };
        }
        return [...updated, aiMessage];
      });
    } catch (error) {
      log.error('Chat error:', error);
      setIsTyping(false);
      
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `${currentPersonality.avatar} Ups, algo salió mal. ¿Podrías intentarlo de nuevo? Estoy aquí para ayudarte.`,
        timestamp: new Date(),
        status: 'read'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePersonalityResponse = (input: string, personality: AIPersonality): string => {
    const lowerInput = input.toLowerCase();
    const responses: Record<string, string[]> = {
      greeting: [
        `${personality.avatar} Great to see you! How can I help you today?`,
        `${personality.avatar} Hello! I was hoping to chat with you. What's on your mind?`,
        `${personality.avatar} Hey! Love that you're reaching out. How's your day going?`
      ],
      help: [
        `${personality.avatar} Of course! I can help you with:\n• Answering questions\n• Analyzing code\n• Generating content\n• Automating tasks\n• And much more!\n\nWhere shall we start?`,
        `${personality.avatar} I'm here for you. Tell me what you need and we'll find the best solution together.`
      ],
      thanks: [
        `${personality.avatar} You're welcome! It's my pleasure to help. 💫`,
        `${personality.avatar} That's what I'm here for! If you need anything else, I'll be right here.`,
        `${personality.avatar} Thank you for trusting me! 🌟`
      ],
      default: [
        `${personality.avatar} Interesting point. Let me think about that... I've analyzed your message and I think I can help. Would you like to dive deeper into this?`,
        `${personality.avatar} I understand what you're saying. Based on my experience, I'd suggest exploring some options. Would you like to review them together?`,
        `${personality.avatar} Great question! This is definitely something I can help with. Let me give you a complete answer...`
      ]
    };

    if (lowerInput.match(/hello|hey|hi|good morning|good afternoon|greetings/)) {
      return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
    }
    if (lowerInput.match(/help|what can you|features|capabilities/)) {
      return responses.help[Math.floor(Math.random() * responses.help.length)];
    }
    if (lowerInput.match(/thanks|thank you|great|excellent|perfect|awesome/)) {
      return responses.thanks[Math.floor(Math.random() * responses.thanks.length)];
    }
    return responses.default[Math.floor(Math.random() * responses.default.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ==================== CALL HANDLERS ====================

  const startCall = (type: 'voice' | 'video', contact?: Contact) => {
    setCallState({
      isActive: true,
      type,
      participant: contact,
      duration: 0,
      isMuted: false,
      isVideoOff: type === 'voice',
      isSpeakerOn: true,
      isScreenSharing: false
    });
    setActiveTab('calls');
  };

  const endCall = () => {
    setCallState({
      isActive: false,
      type: 'voice',
      duration: 0,
      isMuted: false,
      isVideoOff: false,
      isSpeakerOn: true,
      isScreenSharing: false
    });
  };

  const toggleMute = () => {
    setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleVideo = () => {
    setCallState(prev => ({ ...prev, isVideoOff: !prev.isVideoOff }));
  };

  const toggleSpeaker = () => {
    setCallState(prev => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }));
  };

  const toggleScreenShare = () => {
    setCallState(prev => ({ ...prev, isScreenSharing: !prev.isScreenSharing }));
  };

  // ==================== FILE HANDLERS ====================

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ==================== REACTION HANDLERS ====================

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      
      const reactions = msg.reactions || [];
      const existingReaction = reactions.find(r => r.emoji === emoji);
      
      if (existingReaction) {
        if (existingReaction.users.includes('me')) {
          existingReaction.users = existingReaction.users.filter(u => u !== 'me');
          if (existingReaction.users.length === 0) {
            return { ...msg, reactions: reactions.filter(r => r.emoji !== emoji) };
          }
        } else {
          existingReaction.users.push('me');
        }
        return { ...msg, reactions: [...reactions] };
      }
      
      return { ...msg, reactions: [...reactions, { emoji, users: ['me'] }] };
    }));
  };

  // ==================== PERSONALITY CHANGE ====================

  const changePersonality = (key: string) => {
    const personality = AI_PERSONALITIES[key];
    if (personality) {
      setCurrentPersonality(personality);
      localStorage.setItem('cubeChat_personality', key);
      setShowPersonalityPicker(false);
      
      const greetingMessage: Message = {
        id: `personality-${Date.now()}`,
        role: 'assistant',
        content: `${personality.avatar} ¡Hola! Ahora soy ${personality.name}. ${personality.greeting}`,
        timestamp: new Date(),
        status: 'read'
      };
      setMessages(prev => [...prev, greetingMessage]);
    }
  };

  // ==================== AI TOOLS HANDLERS ====================

  const handleGenerateSelector = async () => {
    if (!selectorDescription.trim()) return;
    setGeneratingSelector(true);
    setError(null);
    
    try {
      // Use AI service to generate selector
      const result = await invoke<{ selector: string }>('ai_generate_selector', {
        description: selectorDescription
      });
      setGeneratedSelector(result.selector);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate selector');
    } finally {
      setGeneratingSelector(false);
    }
  };

  const handleImproveSelector = async () => {
    if (!currentSelector.trim()) return;
    setImprovingSelector(true);
    setError(null);
    
    try {
      // Use AI service to improve selector
      const result = await invoke<{ selector: string }>('ai_improve_selector', {
        selector: currentSelector
      });
      setImprovedSelector(result.selector);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to improve selector');
    } finally {
      setImprovingSelector(false);
    }
  };

  const handleGenerateWorkflow = async () => {
    if (!workflowDescription.trim()) return;
    setGeneratingWorkflow(true);
    setError(null);
    
    try {
      // Use AI service to generate workflow
      const result = await invoke<{ workflow: object }>('ai_generate_workflow', {
        description: workflowDescription
      });
      setGeneratedWorkflow(JSON.stringify(result.workflow, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate workflow');
    } finally {
      setGeneratingWorkflow(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'selector' | 'improved' | 'workflow') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'selector') {
        setCopiedSelector(true);
        setTimeout(() => setCopiedSelector(false), 2000);
      } else if (type === 'improved') {
        setCopiedImprovedSelector(true);
        setTimeout(() => setCopiedImprovedSelector(false), 2000);
      } else {
        setCopiedWorkflow(true);
        setTimeout(() => setCopiedWorkflow(false), 2000);
      }
    } catch (err) {
      log.error('Failed to copy:', err);
    }
  };

  // ==================== RENDER: FLOATING BUTTON ====================

  // Don't render on public routes (landing, pricing, etc.)
  // The CIPHER AI chat is only for logged-in app users
  if (isOnPublicRoute) {
    return null;
  }

  // Don't render until position is calculated
  if (!position) {
    return null;
  }

  if (!isOpen) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={(el) => {
                if (buttonRef) {
                  (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
                }
                if (el) {
                  el.style.setProperty('--floating-x', `${position.x}px`);
                  el.style.setProperty('--floating-y', `${position.y}px`);
                }
              }}
              onClick={() => !isDragging && setIsOpen(true)}
              onMouseDown={handleMouseDown}
              className={cn(
                "ai-floating-button",
                isDragging ? "ai-floating-button--dragging" : "ai-floating-button--idle"
              )}
              aria-label="Open CUBE Chat"
            >
              <div className="relative">
                <MessageSquare className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 text-lg">{currentPersonality.avatar}</span>
                {unreadTotal > 0 && (
                  <span className="absolute -top-2 -left-2 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    {unreadTotal > 99 ? '99+' : unreadTotal}
                  </span>
                )}
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Chat with {currentPersonality.name} • {unreadTotal} messages</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // ==================== RENDER: MAIN CHAT WINDOW ====================

  return (
    <div
      ref={containerRef}
      className={cn(
        "ai-floating-window",
        isMaximized ? "ai-floating-window--maximized" : isMinimized ? "ai-floating-window--minimized" : "ai-floating-window--normal",
        isDarkMode && "dark"
      )}
    >
      {/* ==================== HEADER ==================== */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-indigo-600/10">
        <div className="flex items-center gap-3">
          <div 
            className="relative cursor-pointer group"
            onClick={() => setShowPersonalityPicker(!showPersonalityPicker)}
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
              {currentPersonality.avatar}
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{currentPersonality.name}</span>
              <Badge variant="secondary" className="text-[10px] h-4">
                {activeTab === 'assistant' && 'AI Assistant'}
                {activeTab === 'nexus' && 'Code Expert'}
                {activeTab === 'groups' && 'Team Chat'}
                {activeTab === 'tools' && 'AI Tools'}
                {activeTab === 'calls' && 'Calls'}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isTyping ? 'Typing...' : 'Online • Ready to help'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Call buttons */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700"
                  onClick={() => startCall('voice')}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voice call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                  onClick={() => startCall('video')}
                >
                  <Video className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Video call</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Window controls */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMaximized(!isMaximized)}
          >
            {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsDarkMode(!isDarkMode)}>
                {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {isDarkMode ? 'Modo claro' : 'Modo oscuro'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
                {notificationsEnabled ? <BellOff className="h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
                {notificationsEnabled ? 'Silenciar' : 'Activar sonidos'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowPersonalityPicker(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Cambiar personalidad
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => setMessages([])}>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-red-100 hover:text-red-600"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Personality Picker Modal */}
      {showPersonalityPicker && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 flex flex-col p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Elige tu asistente</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowPersonalityPicker(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(AI_PERSONALITIES).map(([key, p]) => (
              <button
                key={key}
                onClick={() => changePersonality(key)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all hover:scale-105",
                  currentPersonality.name === p.name 
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950" 
                    : "border-muted hover:border-violet-300"
                )}
              >
                <div className="text-3xl mb-2">{p.avatar}</div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{p.style}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.specialties.slice(0, 2).map(s => (
                    <Badge key={s} variant="secondary" className="text-[9px]">{s}</Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ==================== MAIN CONTENT ==================== */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ChatMode)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <TabsList className="w-full grid grid-cols-5 rounded-none border-b bg-muted/30 h-11 px-1">
              <TabsTrigger value="assistant" className="gap-1.5 text-xs data-[state=active]:bg-background py-2">
                <Bot className="h-3.5 w-3.5" />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="nexus" className="gap-1.5 text-xs data-[state=active]:bg-background py-2">
                <Code className="h-3.5 w-3.5" />
                <span>Code</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-1.5 text-xs data-[state=active]:bg-background py-2 relative">
                <Users className="h-3.5 w-3.5" />
                <span>Teams</span>
                {unreadTotal > 0 && (
                  <span className="absolute -top-1 right-0 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[9px] text-white font-bold flex items-center justify-center">
                    {unreadTotal}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-1.5 text-xs data-[state=active]:bg-background py-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Tools</span>
              </TabsTrigger>
              <TabsTrigger value="calls" className="gap-1.5 text-xs data-[state=active]:bg-background py-2">
                <Phone className="h-3.5 w-3.5" />
                <span>Calls</span>
              </TabsTrigger>
            </TabsList>

            {/* ==================== ASSISTANT TAB ==================== */}
            <TabsContent value="assistant" className="flex-1 flex flex-col m-0 p-0 min-h-0 overflow-hidden data-[state=inactive]:hidden">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2 group",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm shrink-0">
                          {currentPersonality.avatar}
                        </div>
                      )}
                      
                      <div className={cn(
                        "max-w-[80%] space-y-1",
                        message.role === 'user' && "items-end"
                      )}>
                        {message.replyTo && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                            <Reply className="h-3 w-3" />
                            Replying to message
                          </div>
                        )}
                        
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm relative",
                            message.role === 'user'
                              ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-br-sm"
                              : "bg-muted rounded-bl-sm"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map(att => (
                                <div key={att.id} className="flex items-center gap-2 p-2 bg-black/10 rounded-lg">
                                  {att.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                  <span className="text-xs truncate flex-1">{att.name}</span>
                                  <span className="text-[10px] opacity-70">{formatFileSize(att.size)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Message footer */}
                        <div className={cn(
                          "flex items-center gap-2 px-1",
                          message.role === 'user' ? "justify-end" : "justify-start"
                        )}>
                          <span className="text-[10px] text-muted-foreground">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          
                          {message.role === 'user' && message.status && (
                            <span className="text-[10px] text-muted-foreground">
                              {message.status === 'sending' && '⏳'}
                              {message.status === 'sent' && '✓'}
                              {message.status === 'delivered' && '✓✓'}
                              {message.status === 'read' && <span className="text-blue-500">✓✓</span>}
                            </span>
                          )}

                          {/* Reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex gap-1">
                              {message.reactions.map((r, i) => (
                                <button
                                  key={i}
                                  onClick={() => addReaction(message.id, r.emoji)}
                                  className="text-sm hover:scale-125 transition-transform"
                                >
                                  {r.emoji}
                                  {r.users.length > 1 && <span className="text-[9px]">{r.users.length}</span>}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Quick reactions (hidden until hover) */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            {['❤️', '👍', '😂', '😮'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(message.id, emoji)}
                                className="text-xs hover:scale-125 transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {message.role === 'user' && (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          TU
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm">
                        {currentPersonality.avatar}
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce animation-delay-0" />
                          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce animation-delay-150" />
                          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce animation-delay-300" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ==================== NEXUS TAB ==================== */}
            <TabsContent value="nexus" className="flex-1 flex flex-col m-0 p-0 min-h-0 overflow-hidden data-[state=inactive]:hidden">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3">
                      <Code className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">NEXUS Code Assistant</h3>
                    <p className="text-sm text-muted-foreground mt-1">Your expert in programming and debugging</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Search, label: 'Analyze Code', desc: 'Find bugs and improvements' },
                      { icon: Wrench, label: 'Debugging', desc: 'Fix errors quickly' },
                      { icon: Workflow, label: 'Architecture', desc: 'Design structures' },
                      { icon: Zap, label: 'Optimize', desc: 'Improve performance' }
                    ].map((item, i) => (
                      <button
                        key={i}
                        className="p-3 rounded-xl border bg-card hover:bg-accent transition-colors text-left"
                      >
                        <item.icon className="h-5 w-5 mb-2 text-emerald-600" />
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                      </button>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-xs font-medium">Supported languages:</p>
                    <div className="flex flex-wrap gap-1">
                      {['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'C#', 'PHP', 'Ruby', 'Swift'].map(lang => (
                        <Badge key={lang} variant="outline" className="text-[10px]">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* GROUPS TAB */}
            <TabsContent value="groups" className="flex-1 flex flex-col m-0 p-0 min-h-0 overflow-hidden data-[state=inactive]:hidden">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search contacts or groups..." className="pl-9 h-9 text-sm" />
                  </div>

                  {/* Quick actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-8">
                      <UserPlus className="h-3 w-3 mr-1" />
                      New contact
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-8">
                      <Users className="h-3 w-3 mr-1" />
                      Create group
                    </Button>
                  </div>

                  <Separator />

                  {/* Pinned groups */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Pin className="h-3 w-3" /> Pinned
                    </p>
                    {groups.filter(g => g.isPinned).map(group => (
                      <button
                        key={group.id}
                        onClick={() => setSelectedGroup(group)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                          {group.name.charAt(0)}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{group.name}</span>
                            {group.isMuted && <BellOff className="h-3 w-3 text-muted-foreground" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {group.members.length} members
                          </p>
                        </div>
                        {group.unreadCount && group.unreadCount > 0 && (
                          <Badge className="bg-violet-600">{group.unreadCount}</Badge>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* All groups */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Groups</p>
                    {groups.filter(g => !g.isPinned).map(group => (
                      <button
                        key={group.id}
                        onClick={() => setSelectedGroup(group)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-medium">
                          {group.name.charAt(0)}
                        </div>
                        <div className="flex-1 text-left">
                          <span className="font-medium text-sm">{group.name}</span>
                          <p className="text-xs text-muted-foreground">{group.members.length} members</p>
                        </div>
                        {group.unreadCount && group.unreadCount > 0 && (
                          <Badge variant="secondary">{group.unreadCount}</Badge>
                        )}
                      </button>
                    ))}
                  </div>

                  <Separator />

                  {/* Contacts */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Contacts</p>
                    {contacts.map(contact => (
                      <button
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white">
                              {contact.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                            contact.status === 'online' && "bg-green-500",
                            contact.status === 'away' && "bg-yellow-500",
                            contact.status === 'busy' && "bg-red-500",
                            contact.status === 'offline' && "bg-slate-400"
                          )} />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="font-medium text-sm">{contact.name}</span>
                          <p className="text-xs text-muted-foreground capitalize">
                            {contact.isTyping ? 'Typing...' : contact.status}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); startCall('voice', contact); }}>
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); startCall('video', contact); }}>
                            <Video className="h-3 w-3" />
                          </Button>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* TOOLS TAB */}
            <TabsContent value="tools" className="flex-1 flex flex-col m-0 p-0 min-h-0 overflow-hidden data-[state=inactive]:hidden">
              <Tabs value={toolsTab} onValueChange={setToolsTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="w-full grid grid-cols-3 rounded-none border-b h-9">
                  <TabsTrigger value="selector" className="text-xs gap-1">
                    <Search className="h-3 w-3" />
                    Selector
                  </TabsTrigger>
                  <TabsTrigger value="improve" className="text-xs gap-1">
                    <Wrench className="h-3 w-3" />
                    Improve
                  </TabsTrigger>
                  <TabsTrigger value="workflow" className="text-xs gap-1">
                    <Workflow className="h-3 w-3" />
                    Workflow
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 p-3">
                  <TabsContent value="selector" className="mt-0 space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Describe the element:</label>
                      <Input
                        placeholder="E.g: Blue login button in the top right corner"
                        value={selectorDescription}
                        onChange={(e) => setSelectorDescription(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <Button
                      onClick={handleGenerateSelector}
                      disabled={!selectorDescription.trim() || generatingSelector}
                      className="w-full text-xs h-8"
                      size="sm"
                    >
                      {generatingSelector ? (
                        <><Sparkles className="h-3 w-3 mr-1 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="h-3 w-3 mr-1" /> Generate Selector</>
                      )}
                    </Button>
                    {generatedSelector && (
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">Result:</span>
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => copyToClipboard(generatedSelector, 'selector')}>
                            {copiedSelector ? <><Check className="h-3 w-3 mr-1" /> Copied</> : <><Copy className="h-3 w-3 mr-1" /> Copy</>}
                          </Button>
                        </div>
                        <code className="text-xs bg-black/10 p-2 rounded block overflow-x-auto">{generatedSelector}</code>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="improve" className="mt-0 space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Current selector:</label>
                      <Input
                        placeholder="E.g: div > button.submit"
                        value={currentSelector}
                        onChange={(e) => setCurrentSelector(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">What&apos;s the problem?</label>
                      <Input
                        placeholder="E.g: Fails when element order changes"
                        value={selectorIssue}
                        onChange={(e) => setSelectorIssue(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <Button
                      onClick={handleImproveSelector}
                      disabled={!currentSelector.trim() || improvingSelector}
                      className="w-full text-xs h-8"
                      size="sm"
                    >
                      {improvingSelector ? (
                        <><Wrench className="h-3 w-3 mr-1 animate-spin" /> Improving...</>
                      ) : (
                        <><Wrench className="h-3 w-3 mr-1" /> Improve Selector</>
                      )}
                    </Button>
                    {improvedSelector && (
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">Improved selector:</span>
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => copyToClipboard(improvedSelector, 'improved')}>
                            {copiedImprovedSelector ? <><Check className="h-3 w-3 mr-1" /> Copied</> : <><Copy className="h-3 w-3 mr-1" /> Copy</>}
                          </Button>
                        </div>
                        <code className="text-xs bg-black/10 p-2 rounded block overflow-x-auto">{improvedSelector}</code>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="workflow" className="mt-0 space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Describe the automation:</label>
                      <Input
                        placeholder="E.g: Log into Gmail and download attachments"
                        value={workflowDescription}
                        onChange={(e) => setWorkflowDescription(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <Button
                      onClick={handleGenerateWorkflow}
                      disabled={!workflowDescription.trim() || generatingWorkflow}
                      className="w-full text-xs h-8"
                      size="sm"
                    >
                      {generatingWorkflow ? (
                        <><Workflow className="h-3 w-3 mr-1 animate-spin" /> Generating...</>
                      ) : (
                        <><Workflow className="h-3 w-3 mr-1" /> Generate Workflow</>
                      )}
                    </Button>
                    {generatedWorkflow && (
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">Generated workflow:</span>
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => copyToClipboard(generatedWorkflow, 'workflow')}>
                            {copiedWorkflow ? <><Check className="h-3 w-3 mr-1" /> Copied</> : <><Copy className="h-3 w-3 mr-1" /> Copy JSON</>}
                          </Button>
                        </div>
                        <pre className="text-[10px] bg-black/10 p-2 rounded overflow-x-auto max-h-32">{generatedWorkflow}</pre>
                      </div>
                    )}
                  </TabsContent>

                  {error && (
                    <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  )}
                </ScrollArea>
              </Tabs>
            </TabsContent>

            {/* CALLS TAB */}
            <TabsContent value="calls" className="flex-1 flex flex-col m-0 p-0 min-h-0 overflow-hidden data-[state=inactive]:hidden">
              {callState.isActive ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-violet-900 to-purple-900 text-white">
                  {/* Active call UI */}
                  <div className="text-center mb-8">
                    <div className="h-24 w-24 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4 ring-4 ring-white/20 animate-pulse">
                      {callState.type === 'video' && !callState.isVideoOff ? (
                        <Video className="h-10 w-10" />
                      ) : (
                        <span className="text-4xl">👤</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-xl">{callState.participant?.name || currentPersonality.name}</h3>
                    <p className="text-white/70 text-sm mt-1">
                      {callState.type === 'video' ? 'Video call' : 'Voice call'} • {formatCallDuration(callState.duration)}
                    </p>
                  </div>

                  {/* Call controls */}
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-12 w-12 rounded-full", callState.isMuted ? "bg-red-500" : "bg-white/20")}
                      onClick={toggleMute}
                    >
                      {callState.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>

                    {callState.type === 'video' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-12 w-12 rounded-full", callState.isVideoOff ? "bg-red-500" : "bg-white/20")}
                        onClick={toggleVideo}
                      >
                        {callState.isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-12 w-12 rounded-full", callState.isScreenSharing ? "bg-blue-500" : "bg-white/20")}
                      onClick={toggleScreenShare}
                    >
                      <ScreenShare className="h-5 w-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-12 w-12 rounded-full", callState.isSpeakerOn ? "bg-white/20" : "bg-red-500")}
                      onClick={toggleSpeaker}
                    >
                      {callState.isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </Button>

                    <Button
                      size="icon"
                      className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700"
                      onClick={endCall}
                    >
                      <PhoneOff className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <div className="text-center py-6">
                      <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-3">
                        <Phone className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg">Call Center</h3>
                      <p className="text-sm text-muted-foreground mt-1">Voice calls, video calls and screen sharing</p>
                    </div>

                    {/* Quick call buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2"
                        onClick={() => startCall('voice')}
                      >
                        <Phone className="h-6 w-6 text-green-600" />
                        <span className="text-xs">Voice call</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2"
                        onClick={() => startCall('video')}
                      >
                        <Video className="h-6 w-6 text-blue-600" />
                        <span className="text-xs">Video call</span>
                      </Button>
                    </div>

                    <Separator />

                    {/* Recent calls */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Recent calls</p>
                      {[
                        { name: 'Maria Garcia', type: 'video', time: '2h ago', incoming: true },
                        { name: 'Team Workspace', type: 'voice', time: 'Yesterday', incoming: false },
                        { name: 'Carlos Lopez', type: 'voice', time: '2 days ago', incoming: true }
                      ].map((call, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-violet-400 to-purple-500 text-white">
                              {call.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{call.name}</span>
                              {call.type === 'video' ? <Video className="h-3 w-3 text-blue-500" /> : <Phone className="h-3 w-3 text-green-500" />}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {call.incoming ? '↙️ Entrante' : '↗️ Saliente'} • {call.time}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>

          {/* ==================== INPUT AREA ==================== */}
          <div className="p-3 border-t bg-muted/30 space-y-2">
            {/* Reply preview */}
            {replyingTo && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-xs">
                <Reply className="h-3 w-3" />
                <span className="truncate flex-1">{replyingTo.content}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setReplyingTo(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Selected files preview */}
            {selectedFiles.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="relative shrink-0 p-2 bg-muted rounded-lg text-xs flex items-center gap-2">
                    {file.type.startsWith('image') ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    <span className="max-w-20 truncate">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => removeSelectedFile(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Main input */}
            <div className="flex gap-2 items-end">
              <div className="flex gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  title="Seleccionar archivos para adjuntar"
                  aria-label="Seleccionar archivos"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Adjuntar archivo</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-9 w-9", isRecordingVoice && "text-red-500 animate-pulse")}
                        onClick={() => setIsRecordingVoice(!isRecordingVoice)}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isRecordingVoice ? 'Stop recording' : 'Voice message'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`Message ${currentPersonality.name}...`}
                disabled={isLoading}
                className="flex-1 h-10 text-sm rounded-full px-4"
              />

              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Emojis</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
