"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  ArrowLeft, Network, Users, Share2, Shield, Copy, Check, 
  Upload, Download, X, Plus, UserPlus, QrCode, Mail, MessageCircle,
  Link2, FolderSync, Pause, Play, RefreshCw, Zap, Lock,
  Smartphone, Monitor, Laptop, Tablet, HardDrive, Clock, FileText,
  Image as ImageIcon, Video, Music, Archive, File, Trash2,
  Wifi, WifiOff, Signal, Settings, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/layout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface P2PRoom {
  id: string;
  code: string;
  host_id: string;
  peers: P2PPeer[];
  created_at: string;
  max_peers: number;
  encryption_key?: string;
  is_private: boolean;
  password?: string;
}

interface P2PPeer {
  id: string;
  name: string;
  device_type: 'desktop' | 'laptop' | 'tablet' | 'phone';
  os: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  avatar_color: string;
  bandwidth: number;
  joined_at: string;
}

interface P2PTransfer {
  id: string;
  file_name: string;
  file_size: number;
  transferred: number;
  speed: number;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled' | 'paused' | 'queued';
  from_peer: string;
  to_peer: string;
  room_id: string;
  file_type: string;
  eta_seconds: number;
  is_folder: boolean;
  files_count?: number;
  files_completed?: number;
  can_resume: boolean;
  checksum?: string;
  started_at: string;
  completed_at?: string;
}

interface TransferHistory {
  id: string;
  file_name: string;
  file_size: number;
  peer_name: string;
  direction: 'sent' | 'received';
  completed_at: string;
  status: 'completed' | 'failed';
}

interface P2PSettings {
  auto_accept_from_contacts: boolean;
  download_location: string;
  max_upload_speed: number;
  max_download_speed: number;
  enable_encryption: boolean;
  device_name: string;
  visible_to_nearby: boolean;
}

export default function P2PPage() {
  const { t: _t } = useTranslation();
  const router = useRouter();
  const [activeRoom, setActiveRoom] = useState<P2PRoom | null>(null);
  const [transfers, setTransfers] = useState<P2PTransfer[]>([]);
  const [transferHistory, setTransferHistory] = useState<TransferHistory[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [maxPeers, setMaxPeers] = useState(10);
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState('room');
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState<P2PPeer[]>([]);
  const [selectedPeers, setSelectedPeers] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [settings, setSettings] = useState<P2PSettings>({
    auto_accept_from_contacts: false,
    download_location: '~/Downloads',
    max_upload_speed: 0,
    max_download_speed: 0,
    enable_encryption: true,
    device_name: 'My Device',
    visible_to_nearby: true,
  });

  // Load transfers periodically
  useEffect(() => {
    loadTransfers();
    loadTransferHistory();
    scanNearbyDevices();
    const interval = setInterval(loadTransfers, 2000);
    const scanInterval = setInterval(scanNearbyDevices, 10000);
    return () => {
      clearInterval(interval);
      clearInterval(scanInterval);
    };
  }, []);

  const loadTransfers = async () => {
    try {
      const result = await invoke<P2PTransfer[]>('p2p_list_transfers');
      setTransfers(result);
    } catch (err) {
      log.error('Failed to load transfers:', err);
      // Mock data for UI development
      setTransfers([
        {
          id: '1',
          file_name: 'Project_Files.zip',
          file_size: 1024 * 1024 * 250,
          transferred: 1024 * 1024 * 125,
          speed: 1024 * 1024 * 5,
          status: 'active',
          from_peer: 'me',
          to_peer: 'peer1',
          room_id: 'room1',
          file_type: 'archive',
          eta_seconds: 25,
          is_folder: false,
          can_resume: true,
          checksum: 'abc123',
          started_at: new Date().toISOString(),
        },
        {
          id: '2',
          file_name: 'Documents',
          file_size: 1024 * 1024 * 500,
          transferred: 1024 * 1024 * 450,
          speed: 1024 * 1024 * 10,
          status: 'active',
          from_peer: 'peer2',
          to_peer: 'me',
          room_id: 'room1',
          file_type: 'folder',
          eta_seconds: 5,
          is_folder: true,
          files_count: 45,
          files_completed: 40,
          can_resume: true,
          started_at: new Date().toISOString(),
        },
      ]);
    }
  };

  const loadTransferHistory = async () => {
    try {
      const result = await invoke<TransferHistory[]>('p2p_get_history');
      setTransferHistory(result);
    } catch (_err) {
      // Mock data
      setTransferHistory([
        { id: '1', file_name: 'Report.pdf', file_size: 1024 * 1024 * 5, peer_name: 'MacBook Pro', direction: 'sent', completed_at: new Date(Date.now() - 3600000).toISOString(), status: 'completed' },
        { id: '2', file_name: 'Photos.zip', file_size: 1024 * 1024 * 150, peer_name: 'iPhone 15', direction: 'received', completed_at: new Date(Date.now() - 7200000).toISOString(), status: 'completed' },
        { id: '3', file_name: 'Video.mp4', file_size: 1024 * 1024 * 500, peer_name: 'iPad Air', direction: 'sent', completed_at: new Date(Date.now() - 86400000).toISOString(), status: 'completed' },
      ]);
    }
  };

  const scanNearbyDevices = async () => {
    try {
      const result = await invoke<P2PPeer[]>('p2p_scan_nearby');
      setNearbyDevices(result);
    } catch (_err) {
      // Mock nearby devices
      setNearbyDevices([
        { id: 'p1', name: 'MacBook Pro', device_type: 'laptop', os: 'macOS', status: 'online', avatar_color: '#3b82f6', bandwidth: 100, joined_at: '' },
        { id: 'p2', name: 'iPhone 15', device_type: 'phone', os: 'iOS', status: 'online', avatar_color: '#10b981', bandwidth: 50, joined_at: '' },
        { id: 'p3', name: 'Windows PC', device_type: 'desktop', os: 'Windows', status: 'away', avatar_color: '#f59e0b', bandwidth: 150, joined_at: '' },
        { id: 'p4', name: 'iPad Air', device_type: 'tablet', os: 'iPadOS', status: 'online', avatar_color: '#8b5cf6', bandwidth: 75, joined_at: '' },
      ]);
    }
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    setError(null);
    try {
      const room = await invoke<P2PRoom>('p2p_create_room', { 
        maxPeers, 
        isPrivate: isPrivateRoom,
        password: isPrivateRoom ? roomPassword : undefined 
      });
      setActiveRoom(room);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      // Mock room for UI development
      setActiveRoom({
        id: 'mock-room',
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        host_id: 'me',
        peers: [
          { id: 'me', name: settings.device_name, device_type: 'laptop', os: 'macOS', status: 'online', avatar_color: '#3b82f6', bandwidth: 100, joined_at: new Date().toISOString() },
        ],
        created_at: new Date().toISOString(),
        max_peers: maxPeers,
        is_private: isPrivateRoom,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const room = await invoke<P2PRoom>('p2p_join_room', { 
        roomCode: roomCode.trim(),
        password: roomPassword || undefined 
      });
      setActiveRoom(room);
      setRoomCode('');
      setRoomPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!activeRoom) return;
    try {
      await invoke('p2p_leave_room', { roomId: activeRoom.id });
      setActiveRoom(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave room');
      setActiveRoom(null);
    }
  };

  const handleSendFile = async () => {
    if (!activeRoom) return;
    try {
      const filePath = await invoke<string>('open_file_dialog');
      if (filePath) {
        await invoke('p2p_send_file', { 
          roomId: activeRoom.id, 
          filePath,
          targetPeers: selectedPeers.length > 0 ? selectedPeers : undefined
        });
        loadTransfers();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send file');
    }
  };

  const handleSendFolder = async () => {
    if (!activeRoom) return;
    try {
      const folderPath = await invoke<string>('open_folder_dialog');
      if (folderPath) {
        await invoke('p2p_send_folder', { 
          roomId: activeRoom.id, 
          folderPath,
          targetPeers: selectedPeers.length > 0 ? selectedPeers : undefined
        });
        loadTransfers();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send folder');
    }
  };

  const handleQuickSend = async (peerId: string) => {
    try {
      const filePath = await invoke<string>('open_file_dialog');
      if (filePath) {
        await invoke('p2p_quick_send', { peerId, filePath });
        loadTransfers();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send file');
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    try {
      await invoke('p2p_cancel_transfer', { transferId });
      loadTransfers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel transfer');
    }
  };

  const handlePauseTransfer = async (transferId: string) => {
    try {
      await invoke('p2p_pause_transfer', { transferId });
      loadTransfers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause transfer');
    }
  };

  const handleResumeTransfer = async (transferId: string) => {
    try {
      await invoke('p2p_resume_transfer', { transferId });
      loadTransfers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume transfer');
    }
  };

  const copyRoomCode = useCallback(() => {
    if (activeRoom) {
      navigator.clipboard.writeText(activeRoom.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }, [activeRoom]);

  const generateShareLink = useCallback(() => {
    if (!activeRoom) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/p2p/join?code=${activeRoom.code}`;
  }, [activeRoom]);

  const shareViaEmail = useCallback(() => {
    if (!activeRoom) return;
    const subject = encodeURIComponent('Join my CUBE P2P Room');
    const body = encodeURIComponent(`Join my P2P file sharing room!\n\nRoom Code: ${activeRoom.code}\nOr click this link: ${generateShareLink()}\n\nDownload CUBE: https://cubeai.tools`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }, [activeRoom, generateShareLink]);

  const shareViaWhatsApp = useCallback(() => {
    if (!activeRoom) return;
    const text = encodeURIComponent(`Join my CUBE P2P Room!\n\n🔗 Room Code: ${activeRoom.code}\n\nOr click: ${generateShareLink()}`);
    window.open(`https://wa.me/?text=${text}`);
  }, [activeRoom, generateShareLink]);

  const copyShareLink = useCallback(() => {
    navigator.clipboard.writeText(generateShareLink());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [generateShareLink]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!activeRoom) return;

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      try {
        await invoke('p2p_send_dropped_file', { 
          roomId: activeRoom.id, 
          fileName: file.name,
          fileSize: file.size,
        });
      } catch (err) {
        log.error('Failed to send file:', err);
      }
    }
    loadTransfers();
  }, [activeRoom]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec: number) => {
    return formatBytes(bytesPerSec) + '/s';
  };

  const formatETA = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const getProgress = (transfer: P2PTransfer) => {
    if (transfer.file_size === 0) return 0;
    return Math.round((transfer.transferred / transfer.file_size) * 100);
  };

  const getFileIcon = (fileType: string, isFolder: boolean) => {
    if (isFolder) return <FolderSync className="w-5 h-5 text-yellow-500" />;
    switch (fileType) {
      case 'image': return <ImageIcon className="w-5 h-5 text-pink-500" />;
      case 'video': return <Video className="w-5 h-5 text-purple-500" />;
      case 'audio': return <Music className="w-5 h-5 text-green-500" />;
      case 'archive': return <Archive className="w-5 h-5 text-orange-500" />;
      case 'document': return <FileText className="w-5 h-5 text-blue-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop': return <Monitor className="w-5 h-5" />;
      case 'laptop': return <Laptop className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      case 'phone': return <Smartphone className="w-5 h-5" />;
      default: return <HardDrive className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const generateQRCodeSVG = (text: string, size: number = 200) => {
    // Simple QR-like pattern generator (visual representation)
    const modules = 21;
    const moduleSize = size / modules;
    const _data = text.split('').map(c => c.charCodeAt(0) % 2);
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;
    
    // Corner patterns
    const drawCorner = (x: number, y: number) => {
      svg += `<rect x="${x}" y="${y}" width="${moduleSize * 7}" height="${moduleSize * 7}" fill="black"/>`;
      svg += `<rect x="${x + moduleSize}" y="${y + moduleSize}" width="${moduleSize * 5}" height="${moduleSize * 5}" fill="white"/>`;
      svg += `<rect x="${x + moduleSize * 2}" y="${y + moduleSize * 2}" width="${moduleSize * 3}" height="${moduleSize * 3}" fill="black"/>`;
    };
    
    drawCorner(0, 0);
    drawCorner(size - moduleSize * 7, 0);
    drawCorner(0, size - moduleSize * 7);
    
    // Data pattern
    for (let i = 0; i < modules; i++) {
      for (let j = 0; j < modules; j++) {
        if ((i < 7 && j < 7) || (i < 7 && j > modules - 8) || (i > modules - 8 && j < 7)) continue;
        const idx = (i * modules + j) % text.length;
        if ((text.charCodeAt(idx) + i + j) % 3 === 0) {
          svg += `<rect x="${j * moduleSize}" y="${i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
        }
      }
    }
    
    svg += '</svg>';
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  const activeTransfers = useMemo(() => transfers.filter(t => ['active', 'pending', 'paused', 'queued'].includes(t.status)), [transfers]);
  const completedTransfers = useMemo(() => transfers.filter(t => ['completed', 'failed', 'cancelled'].includes(t.status)), [transfers]);
  const totalProgress = useMemo(() => {
    const active = activeTransfers.filter(t => t.status === 'active');
    if (active.length === 0) return 0;
    const total = active.reduce((acc, t) => acc + t.file_size, 0);
    const transferred = active.reduce((acc, t) => acc + t.transferred, 0);
    return total > 0 ? Math.round((transferred / total) * 100) : 0;
  }, [activeTransfers]);

  return (
    <AppLayout tier="elite">
      <div 
        className={`p-6 space-y-6 min-h-screen ${dragOver ? 'bg-blue-500/10' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Drag overlay */}
        {dragOver && (
          <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-card p-8 rounded-2xl border-2 border-dashed border-blue-500 text-center">
              <Upload className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <h2 className="text-xl font-bold">Drop files to share</h2>
              <p className="text-muted-foreground">Files will be sent to all peers in the room</p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <Network className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">P2P Elite</h1>
                    <p className="text-sm text-muted-foreground">
                      {activeRoom ? `Room: ${activeRoom.code}` : 'AirDrop-like File Sharing'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {activeTransfers.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Zap className="w-3 h-3" />
                    {activeTransfers.length} Active
                  </Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSettingsDialog(true)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-4">
          <div className="max-w-6xl mx-auto space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center justify-between">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-600 dark:text-red-400 hover:text-red-500 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="room" className="gap-2">
                  <Network className="w-4 h-4" />
                  Room
                </TabsTrigger>
                <TabsTrigger value="nearby" className="gap-2">
                  <Wifi className="w-4 h-4" />
                  Nearby
                </TabsTrigger>
                <TabsTrigger value="transfers" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Transfers
                  {activeTransfers.length > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                      {activeTransfers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="w-4 h-4" />
                  History
                </TabsTrigger>
              </TabsList>

              {/* Room Tab */}
              <TabsContent value="room" className="space-y-6">
                {!activeRoom ? (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Create Room */}
                    <Card className="p-6 bg-card border">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                          <Plus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">Create Room</h2>
                          <p className="text-sm text-muted-foreground">Host a new file sharing room</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Max Peers</label>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[maxPeers]}
                              onValueChange={(v) => setMaxPeers(v[0])}
                              min={2}
                              max={50}
                              step={1}
                              className="flex-1"
                            />
                            <span className="text-sm font-mono w-8">{maxPeers}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Private Room</span>
                          </div>
                          <Switch
                            checked={isPrivateRoom}
                            onCheckedChange={setIsPrivateRoom}
                          />
                        </div>

                        {isPrivateRoom && (
                          <Input
                            type="password"
                            value={roomPassword}
                            onChange={(e) => setRoomPassword(e.target.value)}
                            placeholder="Room password"
                            className="bg-background"
                          />
                        )}

                        <Button
                          onClick={handleCreateRoom}
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 h-12"
                        >
                          {loading ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          Create Room
                        </Button>
                      </div>
                    </Card>

                    {/* Join Room */}
                    <Card className="p-6 bg-card border">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                          <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">Join Room</h2>
                          <p className="text-sm text-muted-foreground">Enter a room code to join</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Room Code</label>
                          <Input
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            placeholder="Enter 6-character code"
                            className="bg-background font-mono text-lg tracking-widest text-center h-12"
                            maxLength={6}
                          />
                        </div>

                        <Input
                          type="password"
                          value={roomPassword}
                          onChange={(e) => setRoomPassword(e.target.value)}
                          placeholder="Password (if required)"
                          className="bg-background"
                        />

                        <Button
                          onClick={handleJoinRoom}
                          disabled={loading || !roomCode.trim()}
                          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 h-12"
                        >
                          {loading ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4 mr-2" />
                          )}
                          Join Room
                        </Button>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Active Room Card */}
                    <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Room Info */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                                <Network className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h2 className="text-lg font-semibold">Active Room</h2>
                                <p className="text-sm text-muted-foreground">
                                  {activeRoom.peers.length} / {activeRoom.max_peers} peers
                                  {activeRoom.is_private && (
                                    <Badge variant="outline" className="ml-2">
                                      <Lock className="w-3 h-3 mr-1" />
                                      Private
                                    </Badge>
                                  )}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={handleLeaveRoom}
                              variant="destructive"
                              size="sm"
                            >
                              Leave Room
                            </Button>
                          </div>

                          {/* Room Code Display */}
                          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border mb-4">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">Room Code</p>
                              <p className="text-3xl font-mono font-bold tracking-[0.3em]">{activeRoom.code}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={copyRoomCode}
                                variant="outline"
                                size="icon"
                              >
                                {copiedCode ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                onClick={() => setShowQRDialog(true)}
                                variant="outline"
                                size="icon"
                              >
                                <QrCode className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => setShowShareDialog(true)}
                                variant="outline"
                                size="icon"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              onClick={handleSendFile}
                              className="h-14 bg-gradient-to-r from-green-500 to-emerald-500"
                            >
                              <Upload className="w-5 h-5 mr-2" />
                              Send File
                            </Button>
                            <Button
                              onClick={handleSendFolder}
                              variant="outline"
                              className="h-14"
                            >
                              <FolderSync className="w-5 h-5 mr-2" />
                              Send Folder
                            </Button>
                          </div>
                        </div>

                        {/* Connected Peers */}
                        <div className="lg:w-80">
                          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Connected Peers
                          </h3>
                          <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-2">
                              {activeRoom.peers.map((peer) => (
                                <div
                                  key={peer.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    selectedPeers.includes(peer.id) ? 'bg-purple-500/10 border-purple-500/30' : 'bg-card hover:bg-muted'
                                  }`}
                                  onClick={() => {
                                    setSelectedPeers(prev =>
                                      prev.includes(peer.id)
                                        ? prev.filter(id => id !== peer.id)
                                        : [...prev, peer.id]
                                    );
                                  }}
                                >
                                  <div className="relative">
                                    <div 
                                      className="w-10 h-10 rounded-full flex items-center justify-center"
                                      style={{ backgroundColor: peer.avatar_color + '20' }}
                                    >
                                      {getDeviceIcon(peer.device_type)}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${getStatusColor(peer.status)}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{peer.name}</p>
                                    <p className="text-xs text-muted-foreground">{peer.os}</p>
                                  </div>
                                  {peer.id !== 'me' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickSend(peer.id);
                                      }}
                                    >
                                      <Upload className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </Card>

                    {/* Active Transfers in Room */}
                    {activeTransfers.length > 0 && (
                      <Card className="p-6 bg-card border">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            Active Transfers ({activeTransfers.length})
                          </h3>
                          <div className="flex items-center gap-2">
                            <Progress value={totalProgress} className="w-32" />
                            <span className="text-sm text-muted-foreground">{totalProgress}%</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {activeTransfers.slice(0, 3).map((transfer) => (
                            <TransferItem
                              key={transfer.id}
                              transfer={transfer}
                              onPause={handlePauseTransfer}
                              onResume={handleResumeTransfer}
                              onCancel={handleCancelTransfer}
                              formatBytes={formatBytes}
                              formatSpeed={formatSpeed}
                              formatETA={formatETA}
                              getProgress={getProgress}
                              getFileIcon={getFileIcon}
                            />
                          ))}
                          {activeTransfers.length > 3 && (
                            <Button
                              variant="ghost"
                              className="w-full"
                              onClick={() => setActiveTab('transfers')}
                            >
                              View all {activeTransfers.length} transfers
                            </Button>
                          )}
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {/* Features */}
                {!activeRoom && (
                  <div className="grid md:grid-cols-4 gap-4">
                    <Card className="p-5 bg-card border hover:border-purple-500/30 transition-colors">
                      <Shield className="w-8 h-8 text-purple-500 mb-3" />
                      <h3 className="font-semibold mb-1">End-to-End Encrypted</h3>
                      <p className="text-sm text-muted-foreground">
                        256-bit AES encryption for all transfers
                      </p>
                    </Card>
                    <Card className="p-5 bg-card border hover:border-blue-500/30 transition-colors">
                      <Network className="w-8 h-8 text-blue-500 mb-3" />
                      <h3 className="font-semibold mb-1">Direct P2P</h3>
                      <p className="text-sm text-muted-foreground">
                        No server storage, peer-to-peer only
                      </p>
                    </Card>
                    <Card className="p-5 bg-card border hover:border-green-500/30 transition-colors">
                      <Zap className="w-8 h-8 text-green-500 mb-3" />
                      <h3 className="font-semibold mb-1">Blazing Fast</h3>
                      <p className="text-sm text-muted-foreground">
                        Full network speed transfers
                      </p>
                    </Card>
                    <Card className="p-5 bg-card border hover:border-orange-500/30 transition-colors">
                      <RefreshCw className="w-8 h-8 text-orange-500 mb-3" />
                      <h3 className="font-semibold mb-1">Resumable</h3>
                      <p className="text-sm text-muted-foreground">
                        Resume interrupted transfers
                      </p>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Nearby Devices Tab */}
              <TabsContent value="nearby" className="space-y-6">
                <Card className="p-6 bg-card border">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                        <Wifi className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">Nearby Devices</h2>
                        <p className="text-sm text-muted-foreground">
                          {nearbyDevices.filter(d => d.status === 'online').length} devices available
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={scanNearbyDevices}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Scan
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nearbyDevices.map((device) => (
                      <Card
                        key={device.id}
                        className={`p-4 border cursor-pointer transition-all hover:scale-[1.02] ${
                          device.status === 'online' 
                            ? 'hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10' 
                            : 'opacity-60'
                        }`}
                        onClick={() => device.status === 'online' && handleQuickSend(device.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div 
                              className="w-14 h-14 rounded-2xl flex items-center justify-center"
                              style={{ backgroundColor: device.avatar_color + '20' }}
                            >
                              {getDeviceIcon(device.device_type)}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${getStatusColor(device.status)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{device.name}</p>
                            <p className="text-sm text-muted-foreground">{device.os}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Signal className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{device.bandwidth} Mbps</span>
                            </div>
                          </div>
                        </div>
                        {device.status === 'online' && (
                          <Button
                            className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500"
                            size="sm"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Send Files
                          </Button>
                        )}
                      </Card>
                    ))}
                  </div>

                  {nearbyDevices.length === 0 && (
                    <div className="text-center py-12">
                      <WifiOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-medium mb-2">No devices found</h3>
                      <p className="text-sm text-muted-foreground">
                        Make sure other devices have CUBE P2P open and are on the same network
                      </p>
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Transfers Tab */}
              <TabsContent value="transfers" className="space-y-6">
                {activeTransfers.length > 0 && (
                  <Card className="p-6 bg-card border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Active Transfers ({activeTransfers.length})
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Progress value={totalProgress} className="w-32" />
                          <span className="text-sm font-medium">{totalProgress}%</span>
                        </div>
                      </div>
                    </div>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {activeTransfers.map((transfer) => (
                          <TransferItem
                            key={transfer.id}
                            transfer={transfer}
                            onPause={handlePauseTransfer}
                            onResume={handleResumeTransfer}
                            onCancel={handleCancelTransfer}
                            formatBytes={formatBytes}
                            formatSpeed={formatSpeed}
                            formatETA={formatETA}
                            getProgress={getProgress}
                            getFileIcon={getFileIcon}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </Card>
                )}

                {completedTransfers.length > 0 && (
                  <Card className="p-6 bg-card border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Recent Completed ({completedTransfers.length})
                    </h3>
                    <div className="space-y-2">
                      {completedTransfers.map((transfer) => (
                        <div
                          key={transfer.id}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            transfer.status === 'completed' ? 'bg-green-500/5' :
                            transfer.status === 'failed' ? 'bg-red-500/5' : 'bg-muted'
                          }`}
                        >
                          {getFileIcon(transfer.file_type, transfer.is_folder)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{transfer.file_name}</p>
                            <p className="text-xs text-muted-foreground">{formatBytes(transfer.file_size)}</p>
                          </div>
                          <Badge variant={transfer.status === 'completed' ? 'default' : 'destructive'}>
                            {transfer.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {transfers.length === 0 && (
                  <Card className="p-12 bg-card border text-center">
                    <Share2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">No transfers yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create or join a room to start sharing files
                    </p>
                    <Button onClick={() => setActiveTab('room')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Room
                    </Button>
                  </Card>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card className="p-6 bg-card border">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Transfer History
                    </h3>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear History
                    </Button>
                  </div>

                  {transferHistory.length > 0 ? (
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-3">
                        {transferHistory.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className={`p-2 rounded-lg ${
                              item.direction === 'sent' 
                                ? 'bg-blue-500/10' 
                                : 'bg-green-500/10'
                            }`}>
                              {item.direction === 'sent' ? (
                                <Upload className="w-5 h-5 text-blue-500" />
                              ) : (
                                <Download className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.file_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.direction === 'sent' ? 'Sent to' : 'Received from'} {item.peer_name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatBytes(item.file_size)}</p>
                              <p className="text-xs text-muted-foreground">{formatTimeAgo(item.completed_at)}</p>
                            </div>
                            <Badge variant={item.status === 'completed' ? 'default' : 'destructive'}>
                              {item.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-medium mb-2">No transfer history</h3>
                      <p className="text-sm text-muted-foreground">
                        Your completed transfers will appear here
                      </p>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Room QR Code
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              <div className="bg-white p-4 rounded-2xl mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={generateQRCodeSVG(activeRoom?.code || '', 200)} 
                  alt="Room QR Code"
                  className="w-[200px] h-[200px]"
                />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Scan to join room</p>
              <p className="text-2xl font-mono font-bold tracking-[0.3em]">{activeRoom?.code}</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share Room
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Room Code</p>
                <p className="text-2xl font-mono font-bold tracking-[0.3em]">{activeRoom?.code}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={shareViaEmail}
                >
                  <Mail className="w-6 h-6 text-blue-500" />
                  <span className="text-xs">Email</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={shareViaWhatsApp}
                >
                  <MessageCircle className="w-6 h-6 text-green-500" />
                  <span className="text-xs">WhatsApp</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={copyShareLink}
                >
                  <Link2 className="w-6 h-6 text-purple-500" />
                  <span className="text-xs">{copiedCode ? 'Copied!' : 'Copy Link'}</span>
                </Button>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Input
                  value={generateShareLink()}
                  readOnly
                  className="bg-background text-xs"
                />
                <Button size="sm" variant="ghost" onClick={copyShareLink}>
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                P2P Settings
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Device Name</label>
                  <Input
                    value={settings.device_name}
                    onChange={(e) => setSettings({ ...settings, device_name: e.target.value })}
                    placeholder="My Device"
                    className="bg-background"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Download Location</label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.download_location}
                      readOnly
                      className="bg-background"
                    />
                    <Button variant="outline">Browse</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Privacy & Security</h4>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Enable Encryption</p>
                      <p className="text-xs text-muted-foreground">256-bit AES encryption</p>
                    </div>
                    <Switch
                      checked={settings.enable_encryption}
                      onCheckedChange={(v) => setSettings({ ...settings, enable_encryption: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Visible to Nearby</p>
                      <p className="text-xs text-muted-foreground">Allow discovery on local network</p>
                    </div>
                    <Switch
                      checked={settings.visible_to_nearby}
                      onCheckedChange={(v) => setSettings({ ...settings, visible_to_nearby: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Auto-accept from contacts</p>
                      <p className="text-xs text-muted-foreground">Skip confirmation for known devices</p>
                    </div>
                    <Switch
                      checked={settings.auto_accept_from_contacts}
                      onCheckedChange={(v) => setSettings({ ...settings, auto_accept_from_contacts: v })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Bandwidth Limits</h4>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm">Upload Speed Limit</label>
                      <span className="text-sm text-muted-foreground">
                        {settings.max_upload_speed === 0 ? 'Unlimited' : `${settings.max_upload_speed} MB/s`}
                      </span>
                    </div>
                    <Slider
                      value={[settings.max_upload_speed]}
                      onValueChange={(v) => setSettings({ ...settings, max_upload_speed: v[0] })}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm">Download Speed Limit</label>
                      <span className="text-sm text-muted-foreground">
                        {settings.max_download_speed === 0 ? 'Unlimited' : `${settings.max_download_speed} MB/s`}
                      </span>
                    </div>
                    <Slider
                      value={[settings.max_download_speed]}
                      onValueChange={(v) => setSettings({ ...settings, max_download_speed: v[0] })}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

// Transfer Item Component
interface TransferItemProps {
  transfer: P2PTransfer;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  formatBytes: (bytes: number) => string;
  formatSpeed: (speed: number) => string;
  formatETA: (seconds: number) => string;
  getProgress: (transfer: P2PTransfer) => number;
  getFileIcon: (type: string, isFolder: boolean) => React.ReactNode;
}

const TransferItem: React.FC<TransferItemProps> = ({
  transfer,
  onPause,
  onResume,
  onCancel,
  formatBytes,
  formatSpeed,
  formatETA,
  getProgress,
  getFileIcon,
}) => {
  const progress = getProgress(transfer);
  
  return (
    <div className="p-4 bg-muted/50 rounded-xl border">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-background">
          {getFileIcon(transfer.file_type, transfer.is_folder)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-sm truncate">{transfer.file_name}</p>
            <div className="flex items-center gap-1">
              {transfer.status === 'active' && transfer.can_resume && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onPause(transfer.id)}
                >
                  <Pause className="w-3 h-3" />
                </Button>
              )}
              {transfer.status === 'paused' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onResume(transfer.id)}
                >
                  <Play className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-600"
                onClick={() => onCancel(transfer.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span>{formatBytes(transfer.transferred)} / {formatBytes(transfer.file_size)}</span>
            {transfer.status === 'active' && (
              <>
                <span>•</span>
                <span className="text-blue-500">{formatSpeed(transfer.speed)}</span>
                <span>•</span>
                <span>ETA: {formatETA(transfer.eta_seconds)}</span>
              </>
            )}
            {transfer.is_folder && transfer.files_count && (
              <>
                <span>•</span>
                <span>{transfer.files_completed}/{transfer.files_count} files</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-xs font-medium w-10 text-right">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
