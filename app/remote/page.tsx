"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ansiToSafeHtml } from '@/lib/sanitize';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  ArrowLeft, Monitor, MonitorUp, Power, Wifi, WifiOff,
  Terminal, Plus, Trash2, Key, Eye, EyeOff,
  Maximize2, Minimize2, RefreshCw, AlertCircle, CheckCircle,
  QrCode, Share2, Mail, MessageCircle, Copy, Check, Link2,
  Upload, Download, FolderOpen, FileUp,
  Radio, Users, UserPlus,
  Star, Settings,
  Zap, Mic, MicOff,
  ScreenShare, ScreenShareOff, MousePointer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as sshService from '@/lib/services/sshService';
import type { SSHKey } from '@/lib/services/sshService';

// ============================================
// Types
// ============================================

interface RemoteSession {
  id: string;
  configId: string;
  name: string;
  host: string;
  port: number;
  protocol: 'ssh' | 'rdp' | 'vnc';
  username: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastConnected?: number;
  sessionId?: string;
  isFavorite?: boolean;
}

interface RoomSession {
  id: string;
  code: string;
  name: string;
  host: string;
  participants: Participant[];
  createdAt: number;
  expiresAt: number;
  isHost: boolean;
  settings: RoomSettings;
}

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  hasControl: boolean;
  avatar?: string;
}

interface RoomSettings {
  allowControl: boolean;
  allowFileTransfer: boolean;
  allowChat: boolean;
  requirePassword: boolean;
  password?: string;
  maxParticipants: number;
}

interface FileTransfer {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'downloading' | 'completed' | 'error';
  direction: 'upload' | 'download';
}

interface WakeOnLANDevice {
  id: string;
  name: string;
  macAddress: string;
  ipAddress?: string;
  lastWake?: number;
}

// ============================================
// Main Component
// ============================================

export default function RemoteDesktopPage() {
  const { t: _t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  
  // Core State
  const [sessions, setSessions] = useState<RemoteSession[]>([]);
  const [activeSession, setActiveSession] = useState<RemoteSession | null>(null);
  const [sshKeys, setSshKeys] = useState<SSHKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Room Session State (TeamViewer-like)
  const [roomSession, setRoomSession] = useState<RoomSession | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  
  // File Transfer State
  const [fileTransfers, setFileTransfers] = useState<FileTransfer[]>([]);
  const [showFileManager, setShowFileManager] = useState(false);
  
  // Wake-on-LAN State
  const [wolDevices, setWolDevices] = useState<WakeOnLANDevice[]>([]);
  
  // UI State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('sessions');
  
  // Screen Sharing State
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasRemoteControl, setHasRemoteControl] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [_isVideoOn, _setIsVideoOn] = useState(false);
  
  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);
  const [showJoinRoomDialog, setShowJoinRoomDialog] = useState(false);
  const [showWoLDialog, setShowWoLDialog] = useState(false);
  
  // Share State
  const [copied, setCopied] = useState(false);
  
  // Form state
  const [newSession, setNewSession] = useState({
    name: '',
    host: '',
    port: 22,
    protocol: 'ssh' as 'ssh' | 'rdp' | 'vnc',
    username: '',
    authMethod: 'password' as 'password' | 'key',
    password: '',
    privateKeyPath: '',
  });
  
  const [newKey, setNewKey] = useState({
    name: '',
    type: 'ED25519' as 'RSA' | 'ED25519' | 'ECDSA',
    passphrase: '',
  });
  
  const [newRoom, setNewRoom] = useState<RoomSettings>({
    allowControl: true,
    allowFileTransfer: true,
    allowChat: true,
    requirePassword: false,
    password: '',
    maxParticipants: 5,
  });
  
  const [newWoLDevice, setNewWoLDevice] = useState({
    name: '',
    macAddress: '',
    ipAddress: '',
  });
  
  const terminalRef = useRef<HTMLDivElement>(null);

  // ============================================
  // Data Loading
  // ============================================

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [sshConfigs, keys] = await Promise.all([
        sshService.getConfigs(),
        sshService.getKeys(),
      ]);
      
      setSshKeys(keys);
      
      const sessionsList: RemoteSession[] = sshConfigs.map(config => ({
        id: config.id,
        configId: config.id,
        name: config.name,
        host: config.host,
        port: config.port,
        protocol: 'ssh' as const,
        username: config.username,
        status: 'disconnected' as const,
        lastConnected: config.lastConnected,
        isFavorite: false,
      }));
      
      setSessions(sessionsList);
      
      // Load WoL devices from storage
      const savedWoL = localStorage.getItem('cube_wol_devices');
      if (savedWoL) {
        setWolDevices(JSON.parse(savedWoL));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load configurations';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // ============================================
  // Room Session Functions (TeamViewer-like)
  // ============================================

  const generateRoomCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 9; i++) {
      if (i > 0 && i % 3 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }, []);

  const createRoom = useCallback(() => {
    const code = generateRoomCode();
    const room: RoomSession = {
      id: `room-${Date.now()}`,
      code,
      name: 'My Remote Session',
      host: 'You',
      participants: [{ id: 'self', name: 'You', isHost: true, hasControl: true }],
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      isHost: true,
      settings: newRoom,
    };
    
    setRoomSession(room);
    setRoomCode(code);
    setShowCreateRoomDialog(false);
    setIsScreenSharing(true);
    
    toast({ title: 'Room Created', description: `Share code: ${code}` });
  }, [generateRoomCode, newRoom, toast]);

  const joinRoom = useCallback(() => {
    if (!joinRoomCode.trim()) {
      toast({ title: 'Error', description: 'Please enter a room code', variant: 'destructive' });
      return;
    }
    
    // In production, this would connect to a signaling server
    const room: RoomSession = {
      id: `room-${Date.now()}`,
      code: joinRoomCode.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      name: 'Remote Session',
      host: 'Remote Host',
      participants: [
        { id: 'host', name: 'Remote Host', isHost: true, hasControl: true },
        { id: 'self', name: 'You', isHost: false, hasControl: false },
      ],
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      isHost: false,
      settings: {
        allowControl: true,
        allowFileTransfer: true,
        allowChat: true,
        requirePassword: false,
        maxParticipants: 5,
      },
    };
    
    setRoomSession(room);
    setShowJoinRoomDialog(false);
    
    toast({ title: 'Joined Room', description: `Connected to ${joinRoomCode}` });
  }, [joinRoomCode, toast]);

  const leaveRoom = useCallback(() => {
    setRoomSession(null);
    setIsScreenSharing(false);
    setRoomCode('');
    toast({ title: 'Left Room' });
  }, [toast]);

  // ============================================
  // Sharing Functions
  // ============================================

  const getShareUrl = useCallback(() => {
    return `https://cubeai.tools/remote/join/${roomCode}`;
  }, [roomCode]);

  const generateQRCode = useCallback((text: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  }, []);

  const handleCopyCode = useCallback(async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Room code copied to clipboard' });
  }, [roomCode, toast]);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Link copied to clipboard' });
  }, [getShareUrl, toast]);

  const handleShareVia = useCallback((method: 'email' | 'whatsapp' | 'qr') => {
    const url = getShareUrl();
    const message = `Join my CUBE Remote Desktop session!\n\nRoom Code: ${roomCode}\n\nOr click: ${url}`;
    
    switch (method) {
      case 'email':
        window.open(`mailto:?subject=Join my CUBE Remote Session&body=${encodeURIComponent(message)}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
        break;
      case 'qr':
        setShowShareDialog(false);
        setShowQRDialog(true);
        break;
    }
  }, [getShareUrl, roomCode]);

  // ============================================
  // Wake-on-LAN Functions
  // ============================================

  const addWoLDevice = useCallback(() => {
    if (!newWoLDevice.name || !newWoLDevice.macAddress) {
      toast({ title: 'Error', description: 'Name and MAC address required', variant: 'destructive' });
      return;
    }
    
    const device: WakeOnLANDevice = {
      id: `wol-${Date.now()}`,
      ...newWoLDevice,
    };
    
    const updated = [...wolDevices, device];
    setWolDevices(updated);
    localStorage.setItem('cube_wol_devices', JSON.stringify(updated));
    
    setNewWoLDevice({ name: '', macAddress: '', ipAddress: '' });
    toast({ title: 'Device Added', description: `${device.name} added to Wake-on-LAN` });
  }, [newWoLDevice, wolDevices, toast]);

  const wakeDevice = useCallback(async (device: WakeOnLANDevice) => {
    toast({ title: 'Waking...', description: `Sending magic packet to ${device.name}` });
    
    // In production, this would send via Tauri backend
    setTimeout(() => {
      const updated = wolDevices.map(d => 
        d.id === device.id ? { ...d, lastWake: Date.now() } : d
      );
      setWolDevices(updated);
      localStorage.setItem('cube_wol_devices', JSON.stringify(updated));
      toast({ title: 'Wake Signal Sent', description: `${device.name} should power on shortly` });
    }, 1000);
  }, [wolDevices, toast]);

  // ============================================
  // File Transfer Functions
  // ============================================

  const _handleFileUpload = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      const transfer: FileTransfer = {
        id: `transfer-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'uploading',
        direction: 'upload',
      };
      
      setFileTransfers(prev => [...prev, transfer]);
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setFileTransfers(prev => prev.map(t => {
          if (t.id === transfer.id) {
            const newProgress = Math.min(t.progress + Math.random() * 20, 100);
            if (newProgress >= 100) {
              clearInterval(interval);
              return { ...t, progress: 100, status: 'completed' };
            }
            return { ...t, progress: newProgress };
          }
          return t;
        }));
      }, 500);
    });
  }, []);

  // ============================================
  // SSH Session Functions
  // ============================================

  const connectSession = async (session: RemoteSession) => {
    setSessions(prev => prev.map(s => 
      s.id === session.id ? { ...s, status: 'connecting' as const } : s
    ));
    
    toast({ title: 'Connecting...', description: `SSH to ${session.host}` });
    
    try {
      const sessionId = await sshService.connect(session.configId);
      
      const connectedSession = {
        ...session,
        status: 'connected' as const,
        sessionId,
        lastConnected: Date.now(),
      };
      
      setSessions(prev => prev.map(s => 
        s.id === session.id ? connectedSession : s
      ));
      
      setActiveSession(connectedSession);
      setTerminalOutput([
        `\x1b[32m✓ Connected to ${session.host} via SSH\x1b[0m`,
        `User: ${session.username}`,
        `Port: ${session.port}`,
        '',
        `${session.username}@${session.host}:~$ `
      ]);
      
      toast({ title: 'Connected', description: `Successfully connected to ${session.name}` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      
      setSessions(prev => prev.map(s => 
        s.id === session.id ? { ...s, status: 'error' as const } : s
      ));
      
      setTerminalOutput([`\x1b[31m✗ Connection failed: ${message}\x1b[0m`]);
      toast({ title: 'Connection Failed', description: message, variant: 'destructive' });
    }
  };

  const disconnectSession = async () => {
    if (!activeSession?.sessionId) return;
    
    try {
      await sshService.disconnect(activeSession.sessionId);
      
      setSessions(prev => prev.map(s => 
        s.id === activeSession.id ? { ...s, status: 'disconnected' as const, sessionId: undefined } : s
      ));
      
      setTerminalOutput(prev => [...prev, '', '\x1b[33mConnection closed.\x1b[0m']);
      toast({ title: 'Disconnected', description: `Disconnected from ${activeSession.name}` });
      setActiveSession(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Disconnect failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const executeCommand = async (command: string) => {
    if (!activeSession?.sessionId || isExecuting) return;
    
    setIsExecuting(true);
    setCommandHistory(prev => [...prev.filter(c => c !== command), command]);
    setHistoryIndex(-1);
    
    setTerminalOutput(prev => [
      ...prev,
      `${activeSession.username}@${activeSession.host}:~$ ${command}`
    ]);
    
    if (command === 'clear') {
      setTerminalOutput([`${activeSession.username}@${activeSession.host}:~$ `]);
      setIsExecuting(false);
      return;
    }
    
    if (command === 'exit') {
      await disconnectSession();
      setIsExecuting(false);
      return;
    }
    
    try {
      const result = await sshService.executeCommand(activeSession.sessionId, command);
      
      const output: string[] = [];
      if (result.stdout) output.push(result.stdout);
      if (result.stderr) output.push(`\x1b[31m${result.stderr}\x1b[0m`);
      if (result.exitCode !== 0) output.push(`\x1b[33m[Exit code: ${result.exitCode}]\x1b[0m`);
      
      setTerminalOutput(prev => [...prev, ...output, '']);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Command execution failed';
      setTerminalOutput(prev => [...prev, `\x1b[31mError: ${message}\x1b[0m`, '']);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTerminalInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && terminalInput.trim()) {
      executeCommand(terminalInput.trim());
      setTerminalInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setTerminalInput('');
      }
    }
  };

  const addNewSession = async () => {
    if (!newSession.name || !newSession.host || !newSession.username) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    
    try {
      const config = await sshService.createConfig({
        name: newSession.name,
        host: newSession.host,
        port: newSession.port,
        username: newSession.username,
        authMethod: newSession.authMethod,
        password: newSession.authMethod === 'password' ? newSession.password : undefined,
        privateKeyPath: newSession.authMethod === 'key' ? newSession.privateKeyPath : undefined,
      });
      
      const session: RemoteSession = {
        id: config.id,
        configId: config.id,
        name: config.name,
        host: config.host,
        port: config.port,
        protocol: 'ssh',
        username: config.username,
        status: 'disconnected',
      };
      
      setSessions(prev => [...prev, session]);
      setShowAddDialog(false);
      setNewSession({ name: '', host: '', port: 22, protocol: 'ssh', username: '', authMethod: 'password', password: '', privateKeyPath: '' });
      toast({ title: 'Session Added', description: `${config.name} has been added` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add session';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await sshService.deleteConfig(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Session Deleted' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete session';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const toggleFavorite = (id: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
    ));
  };

  const generateKey = async () => {
    if (!newKey.name) {
      toast({ title: 'Error', description: 'Please provide a key name', variant: 'destructive' });
      return;
    }
    
    try {
      const key = await sshService.generateKey(newKey.name, newKey.type, newKey.passphrase || undefined);
      setSshKeys(prev => [...prev, key]);
      setShowKeyDialog(false);
      setNewKey({ name: '', type: 'ED25519', passphrase: '' });
      toast({ title: 'Key Generated', description: `SSH key "${key.name}" created successfully` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate key';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  // ============================================
  // Render Helpers
  // ============================================

  const getProtocolIcon = (protocol: string) => {
    switch (protocol) {
      case 'ssh': return <Terminal className="h-4 w-4" />;
      case 'rdp': return <Monitor className="h-4 w-4" />;
      case 'vnc': return <MonitorUp className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><Wifi className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'connecting': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Connecting</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default: return <Badge variant="secondary"><WifiOff className="h-3 w-3 mr-1" />Disconnected</Badge>;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  // ============================================
  // Render
  // ============================================

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
              <Monitor className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Remote Desktop Pro</h1>
            </div>
            <Badge variant="secondary">TeamViewer-like</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowWoLDialog(true)}>
              <Zap className="h-4 w-4 mr-2" />
              Wake-on-LAN
            </Button>
            <Button variant="outline" onClick={() => setShowKeyDialog(true)}>
              <Key className="h-4 w-4 mr-2" />
              SSH Keys ({sshKeys.length})
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </div>
        </div>

        {/* Quick Access Bar - Room Session */}
        {!roomSession && (
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border-b">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ScreenShare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Quick Remote Support</h3>
                  <p className="text-sm text-muted-foreground">Share your screen or connect to someone</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowJoinRoomDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join Session
                </Button>
                <Button onClick={() => setShowCreateRoomDialog(true)}>
                  <Radio className="h-4 w-4 mr-2" />
                  Start Session
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Active Room Session Banner */}
        {roomSession && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 border-b border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  {roomSession.isHost ? <Radio className="h-5 w-5 text-green-600 animate-pulse" /> : <ScreenShare className="h-5 w-5 text-green-600" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-green-800 dark:text-green-200">
                      {roomSession.isHost ? 'Hosting Session' : 'Connected to Session'}
                    </span>
                    <Badge variant="outline" className="font-mono text-lg tracking-wider">
                      {roomCode || roomSession.code}
                    </Badge>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {roomSession.participants.length} participant{roomSession.participants.length !== 1 ? 's' : ''} • 
                    {roomSession.settings.allowControl ? ' Control enabled' : ' View only'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Screen Share Controls */}
                <Button 
                  variant={isScreenSharing ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                >
                  {isScreenSharing ? <ScreenShareOff className="h-4 w-4 mr-1" /> : <ScreenShare className="h-4 w-4 mr-1" />}
                  {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                </Button>
                <Button 
                  variant={isMuted ? "outline" : "secondary"} 
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={leaveRoom}>
                  <Power className="h-4 w-4 mr-1" />
                  End
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto h-6">Dismiss</Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Sessions & Tools */}
          <div className="w-80 border-r border-border flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="m-2 grid grid-cols-3">
                <TabsTrigger value="sessions" title="SSH/RDP/VNC Connections">🖥️ Remote</TabsTrigger>
                <TabsTrigger value="transfers" title="File Transfers">📁 Files</TabsTrigger>
                <TabsTrigger value="wol" title="Wake-on-LAN">⚡ WoL</TabsTrigger>
              </TabsList>

              <TabsContent value="sessions" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full p-4">
                  {/* Favorites */}
                  {sessions.filter(s => s.isFavorite).length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                        <Star className="h-3 w-3" /> Favorites
                      </h3>
                      <div className="space-y-2">
                        {sessions.filter(s => s.isFavorite).map(session => (
                          <Card
                            key={session.id}
                            className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                              activeSession?.id === session.id ? 'border-primary bg-primary/5' : ''
                            }`}
                            onClick={() => session.status === 'disconnected' && connectSession(session)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getProtocolIcon(session.protocol)}
                                <span className="font-medium text-sm">{session.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(session.id); }}
                              >
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {session.username}@{session.host}:{session.port}
                            </div>
                            {getStatusBadge(session.status)}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Sessions */}
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">All Sessions</h3>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : sessions.filter(s => !s.isFavorite).length === 0 ? (
                      <div className="text-center py-8">
                        <Terminal className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No sessions configured</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowAddDialog(true)}>
                          <Plus className="h-3 w-3 mr-1" />Add Session
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sessions.filter(s => !s.isFavorite).map(session => (
                          <Card
                            key={session.id}
                            className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                              activeSession?.id === session.id ? 'border-primary bg-primary/5' : ''
                            } ${session.status === 'connected' ? 'border-green-500/50' : ''}`}
                            onClick={() => session.status === 'disconnected' && connectSession(session)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getProtocolIcon(session.protocol)}
                                <span className="font-medium text-sm">{session.name}</span>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => e.stopPropagation()}>
                                    <Settings className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => toggleFavorite(session.id)}>
                                    <Star className="h-4 w-4 mr-2" /> Add to Favorites
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600" onClick={() => deleteSession(session.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {session.username}@{session.host}:{session.port}
                            </div>
                            {getStatusBadge(session.status)}
                            {session.lastConnected && (
                              <div className="text-xs text-muted-foreground mt-2">
                                Last: {new Date(session.lastConnected).toLocaleDateString()}
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="transfers" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-2">
                    {fileTransfers.length === 0 ? (
                      <div className="text-center py-8">
                        <FileUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No file transfers</p>
                        <p className="text-xs text-muted-foreground mt-1">Drag & drop files to transfer</p>
                      </div>
                    ) : (
                      fileTransfers.map(transfer => (
                        <Card key={transfer.id} className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {transfer.direction === 'upload' ? (
                              <Upload className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Download className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-sm font-medium truncate flex-1">{transfer.name}</span>
                            <span className="text-xs text-muted-foreground">{formatBytes(transfer.size)}</span>
                          </div>
                          <Progress value={transfer.progress} className="h-1" />
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">{Math.round(transfer.progress)}%</span>
                            <Badge variant={transfer.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {transfer.status}
                            </Badge>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="wol" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-2">
                    {wolDevices.length === 0 ? (
                      <div className="text-center py-8">
                        <Zap className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No WoL devices</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowWoLDialog(true)}>
                          <Plus className="h-3 w-3 mr-1" />Add Device
                        </Button>
                      </div>
                    ) : (
                      wolDevices.map(device => (
                        <Card key={device.id} className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{device.name}</span>
                            <Button variant="outline" size="sm" onClick={() => wakeDevice(device)}>
                              <Zap className="h-3 w-3 mr-1" />Wake
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">{device.macAddress}</div>
                          {device.lastWake && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Last wake: {new Date(device.lastWake).toLocaleString()}
                            </div>
                          )}
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main View */}
          <div className="flex-1 p-4 overflow-hidden">
            {roomSession ? (
              // Room Session View
              <Card className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    {roomSession.isHost ? <Radio className="h-4 w-4 text-green-500" /> : <ScreenShare className="h-4 w-4 text-green-500" />}
                    <span className="font-medium">{roomSession.isHost ? 'Your Screen' : 'Remote Screen'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!roomSession.isHost && (
                      <Button 
                        variant={hasRemoteControl ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setHasRemoteControl(!hasRemoteControl)}
                      >
                        <MousePointer className="h-4 w-4 mr-1" />
                        {hasRemoteControl ? 'Control Active' : 'Request Control'}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex-1 bg-card flex items-center justify-center">
                  {isScreenSharing ? (
                    <div className="text-center">
                      <Monitor className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg text-muted-foreground">Screen Sharing Active</p>
                      <p className="text-sm text-muted-foreground mt-2">Your screen is being shared</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ScreenShareOff className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg text-muted-foreground">Waiting for screen share</p>
                      <Button className="mt-4" onClick={() => setIsScreenSharing(true)}>
                        <ScreenShare className="h-4 w-4 mr-2" />
                        Start Sharing
                      </Button>
                    </div>
                  )}
                </div>
                {/* Participants Bar */}
                <div className="p-2 border-t border-border bg-muted/30 flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {roomSession.participants.map(p => (
                    <Badge key={p.id} variant={p.isHost ? 'default' : 'secondary'} className="gap-1">
                      {p.name} {p.isHost && '(Host)'}
                    </Badge>
                  ))}
                </div>
              </Card>
            ) : activeSession ? (
              // SSH Terminal View
              <Card className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{activeSession.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {activeSession.username}@{activeSession.host}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowFileManager(!showFileManager)}>
                      <FolderOpen className="h-4 w-4 mr-1" />Files
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={disconnectSession}>
                      <Power className="h-4 w-4 mr-2" />Disconnect
                    </Button>
                  </div>
                </div>
                <div className="flex-1 bg-[var(--terminal-bg)] p-4 font-mono text-sm overflow-hidden">
                  <div ref={terminalRef} className="h-full overflow-y-auto">
                    {terminalOutput.map((line, i) => (
                      <div key={i} className="text-[var(--terminal-text)] whitespace-pre-wrap" dangerouslySetInnerHTML={{ 
                        __html: ansiToSafeHtml(line)
                      }} />
                    ))}
                    {activeSession.status === 'connected' && (
                      <div className="flex items-center text-[var(--terminal-text)]">
                        <span className="text-green-400">{activeSession.username}@{activeSession.host}</span>
                        <span className="text-blue-400">:~$</span>
                        <input
                          type="text"
                          className="flex-1 bg-transparent outline-none text-[var(--terminal-text)] ml-2"
                          value={terminalInput}
                          onChange={(e) => setTerminalInput(e.target.value)}
                          onKeyDown={handleTerminalInput}
                          autoFocus
                          disabled={isExecuting}
                          placeholder={isExecuting ? 'Executing...' : ''}
                        />
                        {isExecuting && <RefreshCw className="h-3 w-3 animate-spin text-yellow-400 ml-2" />}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              // Empty State with Quick Actions
              <div className="h-full flex items-center justify-center">
                <div className="max-w-lg text-center">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => setShowCreateRoomDialog(true)}>
                      <Radio className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <h3 className="font-semibold mb-1">Start Session</h3>
                      <p className="text-sm text-muted-foreground">Share your screen with others</p>
                    </Card>
                    <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => setShowJoinRoomDialog(true)}>
                      <UserPlus className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <h3 className="font-semibold mb-1">Join Session</h3>
                      <p className="text-sm text-muted-foreground">Connect to someone&apos;s screen</p>
                    </Card>
                  </div>
                  <Separator className="my-6" />
                  <div>
                    <Terminal className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-xl font-semibold mb-2">SSH Sessions</h2>
                    <p className="text-muted-foreground mb-4">
                      Select a saved session or create a new one for SSH access.
                    </p>
                    <Button onClick={() => setShowAddDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />Create SSH Session
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dialogs */}
        
        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Session</DialogTitle>
              <DialogDescription>Invite others to join your remote session</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Room Code */}
              <div>
                <Label className="text-xs text-muted-foreground">Room Code</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={roomCode} readOnly className="font-mono text-lg tracking-wider text-center" />
                  <Button variant="outline" size="icon" onClick={handleCopyCode}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Share Link */}
              <div>
                <Label className="text-xs text-muted-foreground">Share Link</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={getShareUrl()} readOnly className="text-sm" />
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Link2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Share Methods */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Share via</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" className="flex-col h-20 gap-2" onClick={() => handleShareVia('email')}>
                    <Mail className="h-5 w-5" />
                    <span className="text-xs">Email</span>
                  </Button>
                  <Button variant="outline" className="flex-col h-20 gap-2" onClick={() => handleShareVia('whatsapp')}>
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-xs">WhatsApp</span>
                  </Button>
                  <Button variant="outline" className="flex-col h-20 gap-2" onClick={() => handleShareVia('qr')}>
                    <QrCode className="h-5 w-5" />
                    <span className="text-xs">QR Code</span>
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
              <DialogDescription>Scan this QR code to join the session</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={generateQRCode(getShareUrl())} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>
              <div className="text-center">
                <p className="font-mono text-lg tracking-wider">{roomCode}</p>
                <p className="text-xs text-muted-foreground mt-1">Room Code</p>
              </div>
              <Button variant="outline" className="w-full" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Room Dialog */}
        <Dialog open={showCreateRoomDialog} onOpenChange={setShowCreateRoomDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Remote Session</DialogTitle>
              <DialogDescription>Configure your remote support session</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Remote Control</Label>
                  <p className="text-xs text-muted-foreground">Let participants control your screen</p>
                </div>
                <Switch checked={newRoom.allowControl} onCheckedChange={(v) => setNewRoom(prev => ({ ...prev, allowControl: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow File Transfer</Label>
                  <p className="text-xs text-muted-foreground">Enable sending and receiving files</p>
                </div>
                <Switch checked={newRoom.allowFileTransfer} onCheckedChange={(v) => setNewRoom(prev => ({ ...prev, allowFileTransfer: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Password</Label>
                  <p className="text-xs text-muted-foreground">Add password protection</p>
                </div>
                <Switch checked={newRoom.requirePassword} onCheckedChange={(v) => setNewRoom(prev => ({ ...prev, requirePassword: v }))} />
              </div>
              {newRoom.requirePassword && (
                <Input 
                  type="password" 
                  placeholder="Session password" 
                  value={newRoom.password} 
                  onChange={(e) => setNewRoom(prev => ({ ...prev, password: e.target.value }))} 
                />
              )}
              <div>
                <Label>Max Participants</Label>
                <Select value={String(newRoom.maxParticipants)} onValueChange={(v) => setNewRoom(prev => ({ ...prev, maxParticipants: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 participants</SelectItem>
                    <SelectItem value="5">5 participants</SelectItem>
                    <SelectItem value="10">10 participants</SelectItem>
                    <SelectItem value="25">25 participants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateRoomDialog(false)}>Cancel</Button>
              <Button onClick={createRoom}>
                <Radio className="h-4 w-4 mr-2" />Start Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Join Room Dialog */}
        <Dialog open={showJoinRoomDialog} onOpenChange={setShowJoinRoomDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Join Remote Session</DialogTitle>
              <DialogDescription>Enter the room code to connect</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Room Code</Label>
                <Input 
                  placeholder="XXX-XXX-XXX" 
                  value={joinRoomCode}
                  onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                  className="font-mono text-lg tracking-wider text-center mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowJoinRoomDialog(false)}>Cancel</Button>
              <Button onClick={joinRoom}>
                <UserPlus className="h-4 w-4 mr-2" />Join Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Wake-on-LAN Dialog */}
        <Dialog open={showWoLDialog} onOpenChange={setShowWoLDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Wake-on-LAN</DialogTitle>
              <DialogDescription>Wake up devices on your network</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Existing Devices */}
              {wolDevices.length > 0 && (
                <div className="space-y-2 mb-4">
                  {wolDevices.map(device => (
                    <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{device.macAddress}</p>
                      </div>
                      <Button size="sm" onClick={() => wakeDevice(device)}>
                        <Zap className="h-3 w-3 mr-1" />Wake
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Device */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Add New Device</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Device Name</Label>
                    <Input 
                      placeholder="Office PC" 
                      value={newWoLDevice.name}
                      onChange={(e) => setNewWoLDevice(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>MAC Address</Label>
                    <Input 
                      placeholder="AA:BB:CC:DD:EE:FF" 
                      value={newWoLDevice.macAddress}
                      onChange={(e) => setNewWoLDevice(prev => ({ ...prev, macAddress: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>IP Address (optional)</Label>
                    <Input 
                      placeholder="192.168.1.100" 
                      value={newWoLDevice.ipAddress}
                      onChange={(e) => setNewWoLDevice(prev => ({ ...prev, ipAddress: e.target.value }))}
                    />
                  </div>
                  <Button className="w-full" onClick={addWoLDevice}>
                    <Plus className="h-4 w-4 mr-2" />Add Device
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Session Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add SSH Connection</DialogTitle>
              <DialogDescription>Configure a new SSH connection</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Session Name</Label>
                <Input placeholder="Production Server" value={newSession.name} onChange={(e) => setNewSession(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label>Host</Label>
                  <Input placeholder="192.168.1.100" value={newSession.host} onChange={(e) => setNewSession(prev => ({ ...prev, host: e.target.value }))} />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input type="number" value={newSession.port} onChange={(e) => setNewSession(prev => ({ ...prev, port: parseInt(e.target.value) || 22 }))} />
                </div>
              </div>
              <div>
                <Label>Username</Label>
                <Input placeholder="root" value={newSession.username} onChange={(e) => setNewSession(prev => ({ ...prev, username: e.target.value }))} />
              </div>
              <div>
                <Label>Authentication</Label>
                <Tabs value={newSession.authMethod} onValueChange={(v) => setNewSession(prev => ({ ...prev, authMethod: v as 'password' | 'key' }))}>
                  <TabsList className="w-full">
                    <TabsTrigger value="password" className="flex-1">Password</TabsTrigger>
                    <TabsTrigger value="key" className="flex-1">SSH Key</TabsTrigger>
                  </TabsList>
                  <TabsContent value="password" className="mt-2">
                    <div className="relative">
                      <Input type={showPassword ? 'text' : 'password'} placeholder="Password" value={newSession.password} onChange={(e) => setNewSession(prev => ({ ...prev, password: e.target.value }))} />
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="key" className="mt-2">
                    <Select value={newSession.privateKeyPath} onValueChange={(v) => setNewSession(prev => ({ ...prev, privateKeyPath: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select SSH key" /></SelectTrigger>
                      <SelectContent>
                        {sshKeys.map(key => (
                          <SelectItem key={key.id} value={key.privateKeyPath}>{key.name} ({key.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={addNewSession}>Add Session</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* SSH Keys Dialog */}
        <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>SSH Keys</DialogTitle>
              <DialogDescription>Manage your SSH key pairs</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {sshKeys.length === 0 ? (
                <div className="text-center py-4">
                  <Key className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No SSH keys generated</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sshKeys.map(key => (
                    <Card key={key.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <p className="text-xs text-muted-foreground">{key.type} • {key.fingerprint.slice(0, 16)}...</p>
                        </div>
                        <Badge variant="secondary">{key.hasPassphrase ? 'Protected' : 'No passphrase'}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Generate New Key</h4>
                <div className="space-y-2">
                  <Input placeholder="Key name" value={newKey.name} onChange={(e) => setNewKey(prev => ({ ...prev, name: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={newKey.type} onValueChange={(v) => setNewKey(prev => ({ ...prev, type: v as 'RSA' | 'ED25519' | 'ECDSA' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ED25519">ED25519 (Recommended)</SelectItem>
                        <SelectItem value="RSA">RSA 4096</SelectItem>
                        <SelectItem value="ECDSA">ECDSA</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="password" placeholder="Passphrase (optional)" value={newKey.passphrase} onChange={(e) => setNewKey(prev => ({ ...prev, passphrase: e.target.value }))} />
                  </div>
                  <Button className="w-full" onClick={generateKey}>
                    <Key className="h-4 w-4 mr-2" />Generate Key
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
