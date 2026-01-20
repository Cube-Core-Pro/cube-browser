"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Video,
  Square,
  Circle,
  Play,
  Pause,
  StopCircle,
  Mic,
  Camera,
  Monitor,
  AppWindow,
  Settings,
  Bookmark,
  Clock,
  HardDrive,
  Trash2,
  Share2,
  FolderOpen,
  Film,
  Volume2,
  Loader2,
} from 'lucide-react';
import {
  RecordingConfig,
  RecordingSession,
  RecordingQuality,
  RecordingSource,
} from '@/types/remote-desktop-pro';
import { logger } from '@/lib/services/logger-service';
import './SessionRecording.css';

const log = logger.scope('SessionRecording');

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendRecording {
  id: string;
  name: string;
  duration: number;
  sizeBytes: number;
  createdAt: number;
  thumbnail: string | null;
  isShared: boolean;
}

interface BackendSessionRecordingConfig {
  recordings: BackendRecording[];
  isRecording: boolean;
  autoRecord: boolean;
  quality: string;
  storageUsedBytes: number;
  storageLimitBytes: number;
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

function convertBackendRecording(rec: BackendRecording): RecordingSession {
  return {
    id: rec.id,
    name: rec.name,
    source: 'screen',
    startedAt: new Date(rec.createdAt),
    endedAt: new Date(rec.createdAt + rec.duration * 1000),
    duration: rec.duration,
    fileSize: rec.sizeBytes,
    filePath: `/Recordings/${rec.name}.mp4`,
    quality: 'high',
    format: 'mp4',
    hasAudio: true,
    hasMicrophone: true,
    hasWebcam: false,
    thumbnailPath: rec.thumbnail ?? undefined,
    bookmarks: [],
    status: 'completed',
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const _formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getSourceIcon = (source: RecordingSource) => {
  switch (source) {
    case 'screen':
      return Monitor;
    case 'window':
      return AppWindow;
    case 'region':
      return Square;
    case 'all-monitors':
      return Monitor;
    default:
      return Monitor;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'recording':
      return '#ef4444';
    case 'paused':
      return '#f59e0b';
    case 'processing':
      return '#3b82f6';
    case 'completed':
      return '#22c55e';
    case 'failed':
      return '#dc2626';
    default:
      return '#6b7280';
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface RecordingCardProps {
  recording: RecordingSession;
  onPlay: (recording: RecordingSession) => void;
  onDelete: (id: string) => void;
  onShare: (recording: RecordingSession) => void;
}

function RecordingCard({ recording, onPlay, onDelete, onShare }: RecordingCardProps) {
  const SourceIcon = getSourceIcon(recording.source);
  const isActive = recording.status === 'recording' || recording.status === 'paused';
  
  return (
    <div className={`recording-card ${isActive ? 'active' : ''}`}>
      <div className="recording-thumbnail">
        <Film className="h-8 w-8 text-muted-foreground" />
        {isActive && (
          <div className="recording-live">
            <Circle className="h-2 w-2 fill-current" />
            <span>LIVE</span>
          </div>
        )}
      </div>
      
      <div className="recording-info">
        <div className="flex items-center gap-2">
          <span className="font-medium">{recording.name}</span>
          <Badge 
            variant="secondary"
            style={{ 
              backgroundColor: `${getStatusColor(recording.status)}15`,
              color: getStatusColor(recording.status),
              border: `1px solid ${getStatusColor(recording.status)}30`
            }}
          >
            {recording.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <SourceIcon className="h-3 w-3" />
            {recording.source}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(recording.duration)}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            {formatBytes(recording.fileSize)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {recording.hasAudio && <Volume2 className="h-3 w-3" />}
          {recording.hasMicrophone && <Mic className="h-3 w-3" />}
          {recording.hasWebcam && <Camera className="h-3 w-3" />}
          {recording.bookmarks.length > 0 && (
            <span className="flex items-center gap-1">
              <Bookmark className="h-3 w-3" />
              {recording.bookmarks.length}
            </span>
          )}
        </div>
      </div>
      
      <div className="recording-actions">
        {recording.status === 'completed' && (
          <>
            <Button size="sm" variant="ghost" onClick={() => onPlay(recording)}>
              <Play className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onShare(recording)}>
              <Share2 className="h-4 w-4" />
            </Button>
          </>
        )}
        {!isActive && (
          <Button size="sm" variant="ghost" onClick={() => onDelete(recording.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface SessionRecordingProps {
  onClose?: () => void;
}

export function SessionRecording({ onClose: _onClose }: SessionRecordingProps) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<RecordingConfig>({
    enabled: true,
    quality: 'high',
    format: 'mp4',
    frameRate: 30,
    captureAudio: true,
    captureMicrophone: true,
    captureWebcam: false,
    webcamPosition: 'bottom-right',
    webcamSize: 'small',
    showCursor: true,
    highlightClicks: true,
    highlightColor: '#ef4444',
    autoStop: { enabled: true, maxDuration: 3600, maxFileSize: 2 * 1024 * 1024 * 1024 },
    storage: { path: '/Recordings', autoCleanup: true, retentionDays: 30, maxStorageSize: 50 * 1024 * 1024 * 1024 },
    hotkeys: { startStop: 'Ctrl+Shift+R', pause: 'Ctrl+Shift+P', bookmark: 'Ctrl+Shift+B' },
  });
  const [recordings, setRecordings] = useState<RecordingSession[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSource, _setRecordingSource] = useState<RecordingSource>('screen');
  const [activeTab, setActiveTab] = useState('recordings');
  const { toast } = useToast();

  const activeRecording = recordings.find(r => r.status === 'recording');
  const _completedRecordings = recordings.filter(r => r.status === 'completed');
  const totalStorageUsed = recordings.reduce((acc, r) => acc + r.fileSize, 0);

  useEffect(() => {
    let mounted = true;

    const fetchRecordingConfig = async () => {
      try {
        const backendConfig = await invoke<BackendSessionRecordingConfig>('get_session_recording_config');
        
        if (mounted) {
          const convertedRecordings = backendConfig.recordings.map(convertBackendRecording);
          setRecordings(convertedRecordings);
          setIsRecording(backendConfig.isRecording);
          setConfig(prev => ({
            ...prev,
            quality: backendConfig.quality as RecordingQuality || 'high',
          }));
        }
      } catch (error) {
        log.error('Failed to fetch recording config:', error);
        if (mounted) {
          toast({
            title: 'Error',
            description: 'Failed to load recording configuration',
            variant: 'destructive',
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchRecordingConfig();
    return () => { mounted = false; };
  }, [toast]);

  const handleStartRecording = useCallback(async () => {
    try {
      await invoke('toggle_recording', { enabled: true });
      setIsRecording(true);
      toast({
        title: 'Recording Started',
        description: `Recording ${recordingSource}...`,
      });
    } catch (error) {
      log.error('Failed to start recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to start recording',
        variant: 'destructive',
      });
    }
  }, [recordingSource, toast]);

  const handleStopRecording = useCallback(async () => {
    try {
      await invoke('toggle_recording', { enabled: false });
      setIsRecording(false);
      setIsPaused(false);
      toast({
        title: 'Recording Stopped',
        description: 'Processing your recording...',
      });
    } catch (error) {
      log.error('Failed to stop recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to stop recording',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handlePauseRecording = useCallback(() => {
    setIsPaused(!isPaused);
    toast({
      title: isPaused ? 'Recording Resumed' : 'Recording Paused',
    });
  }, [isPaused, toast]);

  const handlePlayRecording = useCallback((recording: RecordingSession) => {
    toast({
      title: 'Opening Recording',
      description: recording.name,
    });
  }, [toast]);

  const handleDeleteRecording = useCallback(async (id: string) => {
    try {
      await invoke('delete_session_recording', { recordingId: id });
      setRecordings(prev => prev.filter(r => r.id !== id));
      toast({
        title: 'Recording Deleted',
      });
    } catch (error) {
      log.error('Failed to delete recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete recording',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleShareRecording = useCallback((_recording: RecordingSession) => {
    toast({
      title: 'Share Recording',
      description: 'Opening share options...',
    });
  }, [toast]);

  return (
    <div className="session-recording">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && (
        <>
          {/* Header */}
          <div className={`recording-header ${isRecording ? 'recording' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Video className="h-6 w-6" />
            {isRecording && <span className="recording-indicator" />}
          </div>
          <div>
            <h2 className="text-xl font-semibold">Session Recording</h2>
            <p className="text-sm text-muted-foreground">
              Record and manage screen recordings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRecording ? (
            <>
              <Button variant="outline" onClick={handlePauseRecording}>
                {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button variant="destructive" onClick={handleStopRecording}>
                <StopCircle className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          ) : (
            <Button onClick={handleStartRecording}>
              <Circle className="h-4 w-4 mr-2 fill-current" />
              Start Recording
            </Button>
          )}
        </div>
      </div>

      {/* Active Recording Banner */}
      {activeRecording && (
        <div className="active-recording-banner">
          <div className="flex items-center gap-3">
            <div className="recording-pulse" />
            <div>
              <span className="font-medium">{activeRecording.name}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {formatDuration(activeRecording.duration)}
              </span>
            </div>
          </div>
          <Badge variant="destructive">
            {formatBytes(activeRecording.fileSize)}
          </Badge>
        </div>
      )}

      {/* Stats */}
      <div className="recording-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{recordings.length}</span>
            <span className="stat-label">Recordings</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{formatBytes(totalStorageUsed)}</span>
            <span className="stat-label">Storage Used</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">
              {formatDuration(recordings.reduce((acc, r) => acc + r.duration, 0))}
            </span>
            <span className="stat-label">Total Duration</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Bookmark className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">
              {recordings.reduce((acc, r) => acc + r.bookmarks.length, 0)}
            </span>
            <span className="stat-label">Bookmarks</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="recordings">
            <Film className="h-4 w-4 mr-2" />
            Recordings ({recordings.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recordings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Your Recordings</CardTitle>
                  <CardDescription>
                    Manage and view recorded sessions
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Open Folder
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {recordings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No recordings yet</p>
                    </div>
                  ) : (
                    recordings.map(recording => (
                      <RecordingCard
                        key={recording.id}
                        recording={recording}
                        onPlay={handlePlayRecording}
                        onDelete={handleDeleteRecording}
                        onShare={handleShareRecording}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recording Settings</CardTitle>
              <CardDescription>
                Configure recording preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Recording Quality</Label>
                  <p className="text-sm text-muted-foreground">
                    Higher quality = larger file size
                  </p>
                </div>
                <Select 
                  value={config.quality} 
                  onValueChange={(quality: RecordingQuality) => 
                    setConfig(prev => ({ ...prev, quality }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="lossless">Lossless</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="setting-row">
                <div>
                  <Label>Frame Rate</Label>
                  <p className="text-sm text-muted-foreground">
                    Frames per second
                  </p>
                </div>
                <Select 
                  value={config.frameRate.toString()} 
                  onValueChange={(value) => 
                    setConfig(prev => ({ ...prev, frameRate: parseInt(value) as 15 | 24 | 30 | 60 }))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 fps</SelectItem>
                    <SelectItem value="24">24 fps</SelectItem>
                    <SelectItem value="30">30 fps</SelectItem>
                    <SelectItem value="60">60 fps</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="setting-row">
                <div>
                  <Label>Capture System Audio</Label>
                  <p className="text-sm text-muted-foreground">
                    Record audio from applications
                  </p>
                </div>
                <Switch
                  checked={config.captureAudio}
                  onCheckedChange={(captureAudio) => 
                    setConfig(prev => ({ ...prev, captureAudio }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Capture Microphone</Label>
                  <p className="text-sm text-muted-foreground">
                    Record your voice
                  </p>
                </div>
                <Switch
                  checked={config.captureMicrophone}
                  onCheckedChange={(captureMicrophone) => 
                    setConfig(prev => ({ ...prev, captureMicrophone }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Show Cursor</Label>
                  <p className="text-sm text-muted-foreground">
                    Include mouse cursor in recording
                  </p>
                </div>
                <Switch
                  checked={config.showCursor}
                  onCheckedChange={(showCursor) => 
                    setConfig(prev => ({ ...prev, showCursor }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Highlight Clicks</Label>
                  <p className="text-sm text-muted-foreground">
                    Show visual effect on mouse clicks
                  </p>
                </div>
                <Switch
                  checked={config.highlightClicks}
                  onCheckedChange={(highlightClicks) => 
                    setConfig(prev => ({ ...prev, highlightClicks }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}

export default SessionRecording;
