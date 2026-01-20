"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  Download, 
  Play, 
  Pause, 
  X, 
  Folder, 
  FileText, 
  Plus, 
  Search,
  Settings,
  Clock,
  Zap,
  Video,
  Music,
  Archive,
  Image as ImageIcon,
  File,
  RefreshCw,
  Trash2,
  FolderOpen,
  Calendar,
  Gauge,
  Layers,
  CheckCircle,
  AlertCircle,
  Timer
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { useTranslation } from "@/hooks/useTranslation";

// ==================== Types ====================
interface DownloadItem {
  id: string;
  url: string;
  filename: string;
  file_path: string;
  total_size: number;
  downloaded_size: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled' | 'scheduled';
  speed: number;
  started_at: number;
  completed_at?: number;
  category: string;
  segments: number;
  priority: 'low' | 'normal' | 'high';
  scheduledTime?: number;
}

interface DownloadStats {
  total_downloads: number;
  active_downloads: number;
  completed_downloads: number;
  failed_downloads: number;
  total_downloaded_size: number;
}

interface DownloadSettings {
  maxConcurrentDownloads: number;
  maxSegments: number;
  speedLimit: number; // 0 = unlimited
  autoStartDownloads: boolean;
  showNotifications: boolean;
  defaultCategory: string;
  downloadPath: string;
}

interface ScheduledDownload {
  id: string;
  url: string;
  filename: string;
  scheduledTime: Date;
  repeat: 'once' | 'daily' | 'weekly';
  enabled: boolean;
}

interface VideoGrabberResult {
  title: string;
  url: string;
  quality: string;
  size: number;
  format: string;
}

// ==================== Category Icons ====================
const categoryIcons: Record<string, React.ReactNode> = {
  'Videos': <Video className="w-4 h-4" />,
  'Music': <Music className="w-4 h-4" />,
  'Documents': <FileText className="w-4 h-4" />,
  'Archives': <Archive className="w-4 h-4" />,
  'Images': <ImageIcon className="w-4 h-4" />,
  'Programs': <Layers className="w-4 h-4" />,
  'Other': <File className="w-4 h-4" />,
};

const defaultCategories = ['Videos', 'Music', 'Documents', 'Archives', 'Images', 'Programs', 'Other'];

// ==================== Component ====================
export default function DownloadsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed' | 'scheduled'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('downloads');
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [_showSettingsDialog, _setShowSettingsDialog] = useState(false);
  const [_showScheduleDialog, _setShowScheduleDialog] = useState(false);
  const [showVideoGrabber, setShowVideoGrabber] = useState(false);
  
  // New download form
  const [newDownloadUrl, setNewDownloadUrl] = useState('');
  const [newDownloadFilename, setNewDownloadFilename] = useState('');
  const [newDownloadCategory, setNewDownloadCategory] = useState('Other');
  const [newDownloadSegments, setNewDownloadSegments] = useState(8);
  const [newDownloadPriority, setNewDownloadPriority] = useState<'low' | 'normal' | 'high'>('normal');
  
  // Settings
  const [settings, setSettings] = useState<DownloadSettings>({
    maxConcurrentDownloads: 3,
    maxSegments: 16,
    speedLimit: 0,
    autoStartDownloads: true,
    showNotifications: true,
    defaultCategory: 'Other',
    downloadPath: '~/Downloads',
  });
  
  // Scheduler
  const [scheduledDownloads, setScheduledDownloads] = useState<ScheduledDownload[]>([]);
  const [scheduleUrl, setScheduleUrl] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleRepeat, setScheduleRepeat] = useState<'once' | 'daily' | 'weekly'>('once');
  
  // Video Grabber
  const [videoGrabberUrl, setVideoGrabberUrl] = useState('');
  const [videoGrabberResults, setVideoGrabberResults] = useState<VideoGrabberResult[]>([]);
  const [grabberLoading, setGrabberLoading] = useState(false);

  // ==================== Effects ====================
  useEffect(() => {
    loadData();
    
    // Poll for updates every 2 seconds
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Check scheduled downloads
  useEffect(() => {
    const checkScheduled = setInterval(() => {
      const now = new Date();
      scheduledDownloads.forEach(sd => {
        if (sd.enabled && new Date(sd.scheduledTime) <= now) {
          handleStartDownload(sd.url, sd.filename);
          if (sd.repeat === 'once') {
            setScheduledDownloads(prev => prev.filter(s => s.id !== sd.id));
          } else {
            // Update next scheduled time
            const nextTime = new Date(sd.scheduledTime);
            if (sd.repeat === 'daily') nextTime.setDate(nextTime.getDate() + 1);
            if (sd.repeat === 'weekly') nextTime.setDate(nextTime.getDate() + 7);
            setScheduledDownloads(prev => 
              prev.map(s => s.id === sd.id ? { ...s, scheduledTime: nextTime } : s)
            );
          }
        }
      });
    }, 60000); // Check every minute
    return () => clearInterval(checkScheduled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledDownloads]);

  // ==================== Data Loading ====================
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load downloads
      const downloadsData = await invoke<DownloadItem[]>('get_all_downloads');
      setDownloads(downloadsData);

      // Load statistics
      const statsData = await invoke<DownloadStats>('get_download_stats');
      setStats(statsData);
    } catch (err) {
      log.error('Failed to load downloads:', err);
      setError(err instanceof Error ? err.message : t('downloads.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Retry handler
  const handleRetry = useCallback(() => {
    setError(null);
    loadData();
  }, [loadData]);

  // ==================== Download Actions ====================
  const handleStartDownload = async (url: string, filename: string) => {
    try {
      await invoke('start_download', { 
        url, 
        filename,
        segments: newDownloadSegments,
        category: newDownloadCategory,
        priority: newDownloadPriority,
      });
      toast({
        title: "Download Started",
        description: `${filename} has been added to the queue`,
      });
      await loadData();
      setShowAddDialog(false);
      setNewDownloadUrl('');
      setNewDownloadFilename('');
    } catch (error) {
      log.error('Failed to start download:', error);
      toast({
        title: "Download Failed",
        description: "Could not start the download",
        variant: "destructive",
      });
    }
  };

  const pauseDownload = async (id: string) => {
    try {
      await invoke('pause_download', { id });
      toast({ title: "Download Paused" });
      await loadData();
    } catch (error) {
      log.error('Failed to pause download:', error);
    }
  };

  const resumeDownload = async (id: string) => {
    try {
      await invoke('resume_download', { id });
      toast({ title: "Download Resumed" });
      await loadData();
    } catch (error) {
      log.error('Failed to resume download:', error);
    }
  };

  const cancelDownload = async (id: string) => {
    try {
      await invoke('cancel_download', { id });
      toast({ title: "Download Cancelled" });
      await loadData();
    } catch (error) {
      log.error('Failed to cancel download:', error);
    }
  };

  const removeDownload = async (id: string) => {
    try {
      await invoke('remove_download', { id });
      toast({ title: "Download Removed" });
      await loadData();
    } catch (error) {
      log.error('Failed to remove download:', error);
    }
  };
  
  const pauseAllDownloads = async () => {
    try {
      const activeDownloads = downloads.filter(d => d.status === 'downloading');
      for (const d of activeDownloads) {
        await invoke('pause_download', { id: d.id });
      }
      toast({ title: "All Downloads Paused" });
      await loadData();
    } catch (error) {
      log.error('Failed to pause all downloads:', error);
    }
  };
  
  const resumeAllDownloads = async () => {
    try {
      const pausedDownloads = downloads.filter(d => d.status === 'paused');
      for (const d of pausedDownloads) {
        await invoke('resume_download', { id: d.id });
      }
      toast({ title: "All Downloads Resumed" });
      await loadData();
    } catch (error) {
      log.error('Failed to resume all downloads:', error);
    }
  };
  
  const clearCompletedDownloads = async () => {
    try {
      const completedDownloads = downloads.filter(d => d.status === 'completed');
      for (const d of completedDownloads) {
        await invoke('remove_download', { id: d.id });
      }
      toast({ title: "Completed Downloads Cleared" });
      await loadData();
    } catch (error) {
      log.error('Failed to clear completed downloads:', error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filename = newDownloadFilename || newDownloadUrl.split('/').pop() || 'download';
    await handleStartDownload(newDownloadUrl, filename);
  };
  
  // ==================== Scheduler Functions ====================
  const addScheduledDownload = () => {
    if (!scheduleUrl || !scheduleTime) return;
    
    const newSchedule: ScheduledDownload = {
      id: Date.now().toString(),
      url: scheduleUrl,
      filename: scheduleUrl.split('/').pop() || 'scheduled_download',
      scheduledTime: new Date(scheduleTime),
      repeat: scheduleRepeat,
      enabled: true,
    };
    
    setScheduledDownloads(prev => [...prev, newSchedule]);
    setScheduleUrl('');
    setScheduleTime('');
    toast({ title: "Download Scheduled", description: `Will start at ${new Date(scheduleTime).toLocaleString()}` });
  };
  
  const removeScheduledDownload = (id: string) => {
    setScheduledDownloads(prev => prev.filter(s => s.id !== id));
    toast({ title: "Scheduled Download Removed" });
  };
  
  const toggleScheduledDownload = (id: string) => {
    setScheduledDownloads(prev => 
      prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  };
  
  // ==================== Video Grabber ====================
  const grabVideos = async () => {
    if (!videoGrabberUrl) return;
    
    setGrabberLoading(true);
    try {
      // Simulate video detection (in production, use yt-dlp or similar)
      const mockResults: VideoGrabberResult[] = [
        { title: 'Video 1080p', url: videoGrabberUrl, quality: '1080p', size: 150000000, format: 'mp4' },
        { title: 'Video 720p', url: videoGrabberUrl, quality: '720p', size: 80000000, format: 'mp4' },
        { title: 'Video 480p', url: videoGrabberUrl, quality: '480p', size: 40000000, format: 'mp4' },
        { title: 'Audio Only', url: videoGrabberUrl, quality: '128kbps', size: 5000000, format: 'mp3' },
      ];
      setVideoGrabberResults(mockResults);
      toast({ title: "Videos Detected", description: `Found ${mockResults.length} formats` });
    } catch (error) {
      log.error('Failed to grab videos:', error);
      toast({ title: "No Videos Found", variant: "destructive" });
    } finally {
      setGrabberLoading(false);
    }
  };
  
  const downloadGrabbedVideo = (result: VideoGrabberResult) => {
    handleStartDownload(result.url, `${result.title}.${result.format}`);
    setShowVideoGrabber(false);
    setVideoGrabberResults([]);
  };

  // ==================== Utility Functions ====================

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  const calculateProgress = (download: DownloadItem) => {
    if (download.total_size === 0) return 0;
    return Math.round((download.downloaded_size / download.total_size) * 100);
  };

  const calculateETA = (download: DownloadItem) => {
    if (download.speed === 0) return 'Unknown';
    const remaining = download.total_size - download.downloaded_size;
    const seconds = Math.round(remaining / download.speed);
    
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };
  
  const detectCategory = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const programExts = ['exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm', 'app'];
    
    if (videoExts.includes(ext)) return 'Videos';
    if (audioExts.includes(ext)) return 'Music';
    if (docExts.includes(ext)) return 'Documents';
    if (archiveExts.includes(ext)) return 'Archives';
    if (imageExts.includes(ext)) return 'Images';
    if (programExts.includes(ext)) return 'Programs';
    return 'Other';
  };
  
  const getTotalSpeed = (): number => {
    return downloads
      .filter(d => d.status === 'downloading')
      .reduce((sum, d) => sum + d.speed, 0);
  };

  const filteredDownloads = downloads
    .filter(d => {
      if (filter === 'active') return d.status === 'downloading' || d.status === 'pending';
      if (filter === 'completed') return d.status === 'completed';
      if (filter === 'failed') return d.status === 'failed';
      if (filter === 'scheduled') return d.status === 'scheduled';
      return true;
    })
    .filter(d => categoryFilter === 'all' || (d.category || detectCategory(d.filename)) === categoryFilter)
    .filter(d => d.filename.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading && downloads.length === 0) {
    return (
      <AppLayout tier="elite">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingState
            title={t('downloads.loading.title')}
            description={t('downloads.loading.description')}
          />
        </div>
      </AppLayout>
    );
  }

  if (error && downloads.length === 0) {
    return (
      <AppLayout tier="elite">
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorState
            title={t('downloads.errors.title')}
            description={error}
            onRetry={handleRetry}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout tier="elite">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Download className="w-8 h-8" />
              {t('downloads.title')}
            </h1>
            <p className="text-muted-foreground">{t('downloads.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowVideoGrabber(true)}>
              <Video className="mr-2 h-4 w-4" />
              {t('downloads.actions.videoGrabber')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => _setShowScheduleDialog(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              {t('downloads.actions.schedule')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => _setShowSettingsDialog(true)}>
              <Settings className="mr-2 h-4 w-4" />
              {t('common.settings')}
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('downloads.actions.newDownload')}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_downloads || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Play className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats?.active_downloads || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats?.completed_downloads || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats?.failed_downloads || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Speed</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatSpeed(getTotalSpeed())}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downloaded</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats?.total_downloaded_size || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="downloads" className="gap-2">
              <Download className="h-4 w-4" />
              Downloads
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Folder className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="gap-2">
              <Clock className="h-4 w-4" />
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Downloads Tab */}
          <TabsContent value="downloads" className="space-y-4">
            {/* Filters and Actions */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {(['all', 'active', 'completed', 'failed'] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={pauseAllDownloads}>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause All
                </Button>
                <Button variant="outline" size="sm" onClick={resumeAllDownloads}>
                  <Play className="mr-2 h-4 w-4" />
                  Resume All
                </Button>
                <Button variant="outline" size="sm" onClick={clearCompletedDownloads}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Completed
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search downloads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Downloads List */}
            <div className="space-y-3">
              {filteredDownloads.map((download) => {
                const progress = calculateProgress(download);
                const category = download.category || detectCategory(download.filename);
                
                return (
                  <Card key={download.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Category Icon */}
                        <div className="p-2 bg-muted rounded-lg">
                          {categoryIcons[category] || <File className="w-5 h-5" />}
                        </div>
                        
                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold truncate">{download.filename}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                download.status === 'completed' ? 'default' :
                                download.status === 'downloading' ? 'secondary' :
                                download.status === 'paused' ? 'outline' :
                                'destructive'
                              }>
                                {download.status}
                              </Badge>
                              {download.priority && download.priority !== 'normal' && (
                                <Badge variant="outline" className={
                                  download.priority === 'high' ? 'border-orange-500 text-orange-500' : 'border-gray-500'
                                }>
                                  {download.priority}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate mb-2">{download.url}</p>
                          
                          {/* Progress Bar */}
                          {download.status !== 'completed' && download.status !== 'cancelled' && (
                            <div className="space-y-1">
                              <Progress value={progress} className="h-2" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{formatBytes(download.downloaded_size)} / {formatBytes(download.total_size)}</span>
                                <span>{progress}%</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Stats Row */}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {download.status === 'downloading' && (
                              <>
                                <span className="flex items-center gap-1">
                                  <Gauge className="h-3 w-3" />
                                  {formatSpeed(download.speed)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  ETA: {calculateETA(download)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Layers className="h-3 w-3" />
                                  {download.segments || 8} segments
                                </span>
                              </>
                            )}
                            <span className="flex items-center gap-1">
                              {categoryIcons[category]}
                              {category}
                            </span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          {download.status === 'downloading' && (
                            <Button variant="ghost" size="icon" onClick={() => pauseDownload(download.id)}>
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          {download.status === 'paused' && (
                            <Button variant="ghost" size="icon" onClick={() => resumeDownload(download.id)}>
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {(download.status === 'downloading' || download.status === 'paused') && (
                            <Button variant="ghost" size="icon" onClick={() => cancelDownload(download.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          {download.status === 'completed' && (
                            <Button variant="ghost" size="icon">
                              <FolderOpen className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => removeDownload(download.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredDownloads.length === 0 && (
                <div className="text-center py-12">
                  <Download className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No downloads found</p>
                  <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Download
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {defaultCategories.map((category) => {
                const count = downloads.filter(d => 
                  (d.category || detectCategory(d.filename)) === category
                ).length;
                const size = downloads
                  .filter(d => (d.category || detectCategory(d.filename)) === category)
                  .reduce((sum, d) => sum + d.total_size, 0);
                
                return (
                  <Card 
                    key={category} 
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      categoryFilter === category ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      setCategoryFilter(categoryFilter === category ? 'all' : category);
                      setActiveTab('downloads');
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="p-3 bg-muted rounded-full w-fit mx-auto mb-2">
                        {categoryIcons[category]}
                      </div>
                      <h3 className="font-medium">{category}</h3>
                      <p className="text-sm text-muted-foreground">{count} files</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(size)}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Scheduled Tab */}
          <TabsContent value="scheduled" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Downloads</CardTitle>
                <CardDescription>Downloads that will start automatically at specified times</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Schedule Form */}
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label>URL</Label>
                    <Input
                      placeholder="https://example.com/file.zip"
                      value={scheduleUrl}
                      onChange={(e) => setScheduleUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Repeat</Label>
                    <select
                      value={scheduleRepeat}
                      onChange={(e) => setScheduleRepeat(e.target.value as 'once' | 'daily' | 'weekly')}
                      className="h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="once">Once</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <Button onClick={addScheduledDownload}>
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                </div>

                {/* Scheduled List */}
                <div className="space-y-2">
                  {scheduledDownloads.map((sd) => (
                    <div key={sd.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={sd.enabled}
                          onCheckedChange={() => toggleScheduledDownload(sd.id)}
                        />
                        <div>
                          <p className="font-medium truncate max-w-md">{sd.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sd.scheduledTime).toLocaleString()} • {sd.repeat}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeScheduledDownload(sd.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {scheduledDownloads.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No scheduled downloads</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Download Settings</CardTitle>
                <CardDescription>Configure download behavior and limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Max Concurrent Downloads */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Max Concurrent Downloads</Label>
                    <span className="text-sm text-muted-foreground">{settings.maxConcurrentDownloads}</span>
                  </div>
                  <Slider
                    value={[settings.maxConcurrentDownloads]}
                    onValueChange={([v]) => setSettings(s => ({ ...s, maxConcurrentDownloads: v }))}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                {/* Max Segments */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Max Segments per Download</Label>
                    <span className="text-sm text-muted-foreground">{settings.maxSegments}</span>
                  </div>
                  <Slider
                    value={[settings.maxSegments]}
                    onValueChange={([v]) => setSettings(s => ({ ...s, maxSegments: v }))}
                    min={1}
                    max={32}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">More segments = faster downloads (up to 8x acceleration)</p>
                </div>

                {/* Speed Limit */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Speed Limit</Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.speedLimit === 0 ? 'Unlimited' : `${settings.speedLimit} KB/s`}
                    </span>
                  </div>
                  <Slider
                    value={[settings.speedLimit]}
                    onValueChange={([v]) => setSettings(s => ({ ...s, speedLimit: v }))}
                    min={0}
                    max={10000}
                    step={100}
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-start Downloads</Label>
                      <p className="text-sm text-muted-foreground">Start downloads immediately when added</p>
                    </div>
                    <Switch
                      checked={settings.autoStartDownloads}
                      onCheckedChange={(c) => setSettings(s => ({ ...s, autoStartDownloads: c }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Notifications</Label>
                      <p className="text-sm text-muted-foreground">Notify when downloads complete</p>
                    </div>
                    <Switch
                      checked={settings.showNotifications}
                      onCheckedChange={(c) => setSettings(s => ({ ...s, showNotifications: c }))}
                    />
                  </div>
                </div>

                {/* Download Path */}
                <div className="space-y-2">
                  <Label>Download Location</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.downloadPath}
                      onChange={(e) => setSettings(s => ({ ...s, downloadPath: e.target.value }))}
                    />
                    <Button variant="outline">
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Download Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>New Download</CardTitle>
              <CardDescription>Add a new download with advanced options</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    type="url"
                    placeholder="https://example.com/file.zip"
                    value={newDownloadUrl}
                    onChange={(e) => setNewDownloadUrl(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Filename (optional)</Label>
                  <Input
                    placeholder="Auto-detect from URL"
                    value={newDownloadFilename}
                    onChange={(e) => setNewDownloadFilename(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      value={newDownloadCategory}
                      onChange={(e) => setNewDownloadCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      {defaultCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <select
                      value={newDownloadPriority}
                      onChange={(e) => setNewDownloadPriority(e.target.value as 'low' | 'normal' | 'high')}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Segments</Label>
                    <span className="text-sm text-muted-foreground">{newDownloadSegments}</span>
                  </div>
                  <Slider
                    value={[newDownloadSegments]}
                    onValueChange={([v]) => setNewDownloadSegments(v)}
                    min={1}
                    max={32}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">More segments = faster download speed</p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Start Download
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Video Grabber Dialog */}
      {showVideoGrabber && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video Grabber
              </CardTitle>
              <CardDescription>Detect and download videos from web pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Paste video page URL..."
                  value={videoGrabberUrl}
                  onChange={(e) => setVideoGrabberUrl(e.target.value)}
                />
                <Button onClick={grabVideos} disabled={grabberLoading}>
                  {grabberLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {videoGrabberResults.length > 0 && (
                <div className="space-y-2">
                  {videoGrabberResults.map((result, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{result.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {result.quality} • {result.format.toUpperCase()} • {formatBytes(result.size)}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => downloadGrabbedVideo(result)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => {
                  setShowVideoGrabber(false);
                  setVideoGrabberResults([]);
                }}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
