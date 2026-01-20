"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PlayCircle, PauseCircle, Music, Video, Plus, List, Heart, Search, 
  SkipBack, SkipForward, Volume2, VolumeX, Repeat, Repeat1, Shuffle,
  Maximize2, Minimize2, X, FolderOpen, Clock, Subtitles,
  Languages, Gauge, SlidersHorizontal
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import * as mediaService from '@/lib/services/mediaPlayerService';
import type { MediaItem, Playlist, MediaStats, PlaybackState } from '@/lib/services/mediaPlayerService';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

// ============================================================================
// Types for Advanced Features
// ============================================================================

interface EqualizerBand {
  frequency: string;
  gain: number;
}

interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src: string;
}

interface AudioTrack {
  id: number;
  label: string;
  language: string;
}

const defaultEqualizerBands: EqualizerBand[] = [
  { frequency: '32Hz', gain: 0 },
  { frequency: '64Hz', gain: 0 },
  { frequency: '125Hz', gain: 0 },
  { frequency: '250Hz', gain: 0 },
  { frequency: '500Hz', gain: 0 },
  { frequency: '1kHz', gain: 0 },
  { frequency: '2kHz', gain: 0 },
  { frequency: '4kHz', gain: 0 },
  { frequency: '8kHz', gain: 0 },
  { frequency: '16kHz', gain: 0 },
];

const equalizerPresets: Record<string, number[]> = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  'Treble Boost': [0, 0, 0, 0, 0, 0, 2, 4, 5, 6],
  'Rock': [5, 4, 2, -1, -2, 0, 2, 3, 4, 5],
  'Pop': [1, 2, 3, 3, 2, 0, -1, -1, 1, 2],
  'Jazz': [4, 3, 1, 2, -2, -2, 0, 1, 3, 4],
  'Classical': [5, 4, 3, 2, -1, -1, 0, 2, 3, 4],
  'Electronic': [5, 4, 1, 0, -2, 2, 1, 2, 4, 5],
  'Hip-Hop': [5, 5, 3, 1, -1, -1, 1, 0, 2, 3],
  'Vocal': [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1],
};

const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// ============================================================================
// Main Component
// ============================================================================

export default function MediaPlayerPage() {
  // i18n
  const { t } = useTranslation();
  
  // M5 State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'audio' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Player state
  const [currentItem, setCurrentItem] = useState<MediaItem | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    is_playing: false,
    current_time: 0,
    duration: 0,
    volume: 1,
    is_muted: false,
    playback_rate: 1,
    loop_mode: 'none',
    shuffle: false,
  });
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [queue, setQueue] = useState<MediaItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  
  // Advanced Features State
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [equalizerBands, setEqualizerBands] = useState<EqualizerBand[]>(defaultEqualizerBands);
  const [equalizerEnabled, setEqualizerEnabled] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('Flat');
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(0);
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showAudioTrackMenu, setShowAudioTrackMenu] = useState(false);
  
  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  
  // Form states
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaArtist, setNewMediaArtist] = useState('');
  const [newMediaPath, setNewMediaPath] = useState('');
  const [newMediaType, setNewMediaType] = useState<'audio' | 'video'>('audio');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const equalizerNodesRef = useRef<BiquadFilterNode[]>([]);
  const { toast } = useToast();

  // ============================================================================
  // Data Loading
  // ============================================================================

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Update progress bar fill width
  useEffect(() => {
    if (progressFillRef.current && playbackState.duration > 0) {
      const percentage = (playbackState.current_time / playbackState.duration) * 100;
      progressFillRef.current.style.width = `${percentage}%`;
    }
  }, [playbackState.current_time, playbackState.duration]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const filterParam = filter === 'all' ? undefined : { media_type: filter };
      
      const [items, playlistsData, statsData] = await Promise.all([
        mediaService.getAllMedia(filterParam),
        mediaService.getAllPlaylists(),
        mediaService.getMediaStats(),
      ]);
      
      setMediaItems(items);
      setPlaylists(playlistsData);
      setStats(statsData);
    } catch (err) {
      log.error('Failed to load media data:', err);
      const errorMessage = err instanceof Error ? err.message : t('mediaPlayer.errors.loadFailed', 'Failed to load media library');
      setError(errorMessage);
      toast({
        title: t('common.error', 'Error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // M5 Retry Handler
  const handleRetry = useCallback(() => {
    setError(null);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // Playback Controls
  // ============================================================================

  const getMediaElement = useCallback((): HTMLAudioElement | HTMLVideoElement | null => {
    return currentItem?.media_type === 'video' ? videoRef.current : audioRef.current;
  }, [currentItem]);

  const playMedia = useCallback(async (item: MediaItem) => {
    try {
      const url = mediaService.getPlayableUrl(item.file_path);
      const element = item.media_type === 'video' ? videoRef.current : audioRef.current;
      
      if (!element) return;
      
      // If switching media type, pause the other element
      if (item.media_type === 'video' && audioRef.current) {
        audioRef.current.pause();
      } else if (item.media_type === 'audio' && videoRef.current) {
        videoRef.current.pause();
      }
      
      element.src = url;
      element.volume = playbackState.volume;
      element.muted = playbackState.is_muted;
      element.playbackRate = playbackState.playback_rate;
      
      await element.play();
      
      setCurrentItem(item);
      setPlaybackState(prev => ({ ...prev, is_playing: true }));
      
      // Increment play count
      await mediaService.incrementPlayCount(item.id);
      
      // Update in list
      setMediaItems(prev => prev.map(m => 
        m.id === item.id ? { ...m, play_count: m.play_count + 1 } : m
      ));
      
      // Add to queue if not already playing from queue
      if (queueIndex === -1 || queue[queueIndex]?.id !== item.id) {
        setQueue([item]);
        setQueueIndex(0);
      }
      
      toast({ title: 'Now Playing', description: item.title });
    } catch (error) {
      log.error('Failed to play media:', error);
      toast({
        title: 'Playback Error',
        description: 'Failed to play media file',
        variant: 'destructive',
      });
    }
  }, [playbackState.volume, playbackState.is_muted, playbackState.playback_rate, queue, queueIndex, toast]);

  const togglePlayPause = useCallback(() => {
    const element = getMediaElement();
    if (!element) return;
    
    if (playbackState.is_playing) {
      element.pause();
      setPlaybackState(prev => ({ ...prev, is_playing: false }));
    } else {
      element.play().catch(log.error);
      setPlaybackState(prev => ({ ...prev, is_playing: true }));
    }
  }, [getMediaElement, playbackState.is_playing]);

  const skipPrevious = useCallback(() => {
    const element = getMediaElement();
    if (!element) return;
    
    if (element.currentTime > 3) {
      element.currentTime = 0;
      return;
    }
    
    if (queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      setQueueIndex(prevIndex);
      playMedia(queue[prevIndex]);
    }
  }, [getMediaElement, queue, queueIndex, playMedia]);

  const skipNext = useCallback(() => {
    if (queueIndex < queue.length - 1) {
      const nextIndex = playbackState.shuffle 
        ? Math.floor(Math.random() * queue.length)
        : queueIndex + 1;
      setQueueIndex(nextIndex);
      playMedia(queue[nextIndex]);
    } else if (playbackState.loop_mode === 'all' && queue.length > 0) {
      setQueueIndex(0);
      playMedia(queue[0]);
    }
  }, [queue, queueIndex, playbackState.shuffle, playbackState.loop_mode, playMedia]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const element = getMediaElement();
    if (!element || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    element.currentTime = percent * element.duration;
  }, [getMediaElement]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const element = getMediaElement();
    if (element) {
      element.volume = newVolume;
    }
    setPlaybackState(prev => ({ ...prev, volume: newVolume, is_muted: newVolume === 0 }));
  }, [getMediaElement]);

  const toggleMute = useCallback(() => {
    const element = getMediaElement();
    if (element) {
      element.muted = !playbackState.is_muted;
    }
    setPlaybackState(prev => ({ ...prev, is_muted: !prev.is_muted }));
  }, [getMediaElement, playbackState.is_muted]);

  const cycleLoopMode = useCallback(() => {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(playbackState.loop_mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    const element = getMediaElement();
    if (element) {
      element.loop = nextMode === 'one';
    }
    
    setPlaybackState(prev => ({ ...prev, loop_mode: nextMode }));
  }, [getMediaElement, playbackState.loop_mode]);

  const toggleShuffle = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, shuffle: !prev.shuffle }));
  }, []);

  // ============================================================================
  // Advanced Features: Equalizer
  // ============================================================================
  
  const initializeEqualizer = useCallback(() => {
    if (audioContextRef.current) return;
    
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    const element = getMediaElement();
    if (!element) return;
    
    const source = audioContext.createMediaElementSource(element);
    
    // Create equalizer bands
    const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    const filters = frequencies.map((freq, index) => {
      const filter = audioContext.createBiquadFilter();
      filter.type = index === 0 ? 'lowshelf' : index === frequencies.length - 1 ? 'highshelf' : 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1;
      filter.gain.value = equalizerBands[index].gain;
      return filter;
    });
    
    // Connect filters in series
    source.connect(filters[0]);
    filters.forEach((filter, index) => {
      if (index < filters.length - 1) {
        filter.connect(filters[index + 1]);
      }
    });
    filters[filters.length - 1].connect(audioContext.destination);
    
    equalizerNodesRef.current = filters;
  }, [getMediaElement, equalizerBands]);
  
  const updateEqualizerBand = useCallback((index: number, gain: number) => {
    setEqualizerBands(prev => prev.map((band, i) => 
      i === index ? { ...band, gain } : band
    ));
    
    if (equalizerNodesRef.current[index]) {
      equalizerNodesRef.current[index].gain.value = gain;
    }
  }, []);
  
  const applyEqualizerPreset = useCallback((presetName: string) => {
    const gains = equalizerPresets[presetName];
    if (!gains) return;
    
    setSelectedPreset(presetName);
    setEqualizerBands(prev => prev.map((band, index) => ({
      ...band,
      gain: gains[index],
    })));
    
    equalizerNodesRef.current.forEach((node, index) => {
      node.gain.value = gains[index];
    });
    
    toast({ title: 'Preset Applied', description: presetName });
  }, [toast]);
  
  const resetEqualizer = useCallback(() => {
    applyEqualizerPreset('Flat');
  }, [applyEqualizerPreset]);

  // ============================================================================
  // Advanced Features: Playback Speed
  // ============================================================================
  
  const setPlaybackSpeed = useCallback((speed: number) => {
    const element = getMediaElement();
    if (element) {
      element.playbackRate = speed;
    }
    setPlaybackState(prev => ({ ...prev, playback_rate: speed }));
    setShowSpeedSelector(false);
    toast({ title: 'Playback Speed', description: `${speed}x` });
  }, [getMediaElement, toast]);

  // ============================================================================
  // Advanced Features: Subtitles
  // ============================================================================
  
  const _loadSubtitles = useCallback((subtitles: SubtitleTrack[]) => {
    setSubtitleTracks(subtitles);
    
    const video = videoRef.current;
    if (!video) return;
    
    // Remove existing tracks
    while (video.textTracks.length > 0) {
      const track = video.querySelector('track');
      if (track) track.remove();
    }
    
    // Add new tracks
    subtitles.forEach(sub => {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = sub.label;
      track.srclang = sub.language;
      track.src = sub.src;
      video.appendChild(track);
    });
  }, []);
  
  const selectSubtitle = useCallback((trackId: string | null) => {
    setSelectedSubtitle(trackId);
    
    const video = videoRef.current;
    if (!video) return;
    
    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      track.mode = subtitleTracks[i]?.id === trackId ? 'showing' : 'hidden';
    }
    
    setShowSubtitleMenu(false);
    toast({ 
      title: 'Subtitles', 
      description: trackId ? subtitleTracks.find(s => s.id === trackId)?.label || 'Enabled' : 'Disabled' 
    });
  }, [subtitleTracks, toast]);

  // ============================================================================
  // Advanced Features: Audio Tracks
  // ============================================================================
  
  const _detectAudioTracks = useCallback(() => {
    const video = videoRef.current;
    if (!video || !('audioTracks' in video)) return;
    
    const tracks: AudioTrack[] = [];
    const audioTrackList = (video as unknown as { audioTracks: { length: number; [key: number]: { label: string; language: string } } }).audioTracks;
    
    for (let i = 0; i < audioTrackList.length; i++) {
      tracks.push({
        id: i,
        label: audioTrackList[i].label || `Track ${i + 1}`,
        language: audioTrackList[i].language || 'unknown',
      });
    }
    
    setAudioTracks(tracks);
  }, []);
  
  const selectAudioTrack = useCallback((trackId: number) => {
    const video = videoRef.current;
    if (!video || !('audioTracks' in video)) return;
    
    const audioTrackList = (video as unknown as { audioTracks: { length: number; [key: number]: { enabled: boolean } } }).audioTracks;
    for (let i = 0; i < audioTrackList.length; i++) {
      audioTrackList[i].enabled = i === trackId;
    }
    
    setSelectedAudioTrack(trackId);
    setShowAudioTrackMenu(false);
    toast({ 
      title: 'Audio Track', 
      description: audioTracks[trackId]?.label || `Track ${trackId + 1}` 
    });
  }, [audioTracks, toast]);

  // ============================================================================
  // Media Element Event Handlers
  // ============================================================================

  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLAudioElement | HTMLVideoElement>) => {
    const element = e.currentTarget;
    setPlaybackState(prev => ({
      ...prev,
      current_time: element.currentTime,
      duration: element.duration || 0,
    }));
  }, []);

  const handleEnded = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, is_playing: false }));
    
    if (playbackState.loop_mode === 'one') {
      const element = getMediaElement();
      if (element) {
        element.currentTime = 0;
        element.play().catch(log.error);
      }
    } else {
      skipNext();
    }
  }, [playbackState.loop_mode, getMediaElement, skipNext]);

  // ============================================================================
  // Media Library Actions
  // ============================================================================

  const toggleFavorite = async (id: string) => {
    try {
      await mediaService.toggleFavorite(id);
      setMediaItems(prev => prev.map(item => 
        item.id === id ? { ...item, is_favorite: !item.is_favorite } : item
      ));
    } catch (error) {
      log.error('Failed to toggle favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorite',
        variant: 'destructive',
      });
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMediaTitle || !newMediaPath) {
      toast({
        title: 'Error',
        description: 'Title and file path are required',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await mediaService.addMedia({
        title: newMediaTitle,
        artist: newMediaArtist || undefined,
        file_path: newMediaPath,
        media_type: newMediaType,
        is_favorite: false,
      });
      
      setShowAddDialog(false);
      setNewMediaTitle('');
      setNewMediaArtist('');
      setNewMediaPath('');
      setNewMediaType('audio');
      
      await loadData();
      toast({ title: 'Success', description: 'Media added to library' });
    } catch (error) {
      log.error('Failed to add media:', error);
      toast({
        title: 'Error',
        description: 'Failed to add media',
        variant: 'destructive',
      });
    }
  };

  const handlePickFiles = async () => {
    try {
      const files = await mediaService.pickMediaFiles('all');
      
      for (const filePath of files) {
        const title = mediaService.extractTitle(filePath);
        const mediaType = mediaService.getMediaType(filePath);
        
        await mediaService.addMedia({
          title,
          file_path: filePath,
          media_type: mediaType,
          is_favorite: false,
        });
      }
      
      if (files.length > 0) {
        await loadData();
        toast({ title: 'Success', description: `Added ${files.length} file(s) to library` });
      }
    } catch (error) {
      log.error('Failed to pick files:', error);
      toast({
        title: 'Error',
        description: 'Failed to add files',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPlaylistName) {
      toast({
        title: 'Error',
        description: 'Playlist name is required',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await mediaService.createPlaylist(newPlaylistName, newPlaylistDesc || undefined);
      
      setShowPlaylistDialog(false);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      
      await loadData();
      toast({ title: 'Success', description: 'Playlist created' });
    } catch (error) {
      log.error('Failed to create playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to create playlist',
        variant: 'destructive',
      });
    }
  };

  const addAllToQueue = useCallback(() => {
    const filtered = filteredItems;
    setQueue(filtered);
    setQueueIndex(-1);
    toast({ title: 'Queue Updated', description: `${filtered.length} items added to queue` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const playAllShuffled = useCallback(() => {
    const shuffled = [...filteredItems].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setQueueIndex(0);
    if (shuffled.length > 0) {
      playMedia(shuffled[0]);
    }
    setPlaybackState(prev => ({ ...prev, shuffle: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playMedia]);

  // ============================================================================
  // Helpers
  // ============================================================================

  const formatDuration = (seconds?: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredItems = mediaItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ============================================================================
  // Render
  // ============================================================================

  // M5 Loading State
  if (loading) {
    return (
      <AppLayout tier="elite">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingState
            variant="spinner"
            size="lg"
            message={t('mediaPlayer.loading.library', 'Loading Media Library...')}
            description={t('mediaPlayer.loading.preparing', 'Preparing your collection')}
            testId="media-player-loading"
          />
        </div>
      </AppLayout>
    );
  }

  // M5 Error State
  if (error) {
    return (
      <AppLayout tier="elite">
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorState
            preset="server"
            title={t('mediaPlayer.errors.title', 'Failed to Load Media')}
            message={error}
            onRetry={handleRetry}
            retryLabel={t('common.retry', 'Try Again')}
            testId="media-player-error"
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout tier="elite">
      <div className="p-6 space-y-6 pb-32">
        {/* Hidden Media Elements */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={handleTimeUpdate}
          className="hidden"
        />
        <video
          ref={videoRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={handleTimeUpdate}
          className={`${isPlayerExpanded && currentItem?.media_type === 'video' ? 'fixed inset-0 z-50 w-full h-full bg-black' : 'hidden'}`}
          onClick={togglePlayPause}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Media Player</h1>
            <p className="text-muted-foreground">Your personal media library</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePickFiles}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-secondary-foreground font-medium transition-colors"
            >
              <FolderOpen className="w-5 h-5" />
              Browse Files
            </button>
            <button
              onClick={() => setShowAddDialog(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 rounded-lg text-white font-medium transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Add Media
            </button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-card border border-border backdrop-blur-sm rounded-lg p-6">
              <div className="text-muted-foreground text-sm mb-1">Total Items</div>
              <div className="text-3xl font-bold text-foreground">{stats.total_items}</div>
            </div>
            <div className="bg-card border border-border backdrop-blur-sm rounded-lg p-6">
              <div className="text-muted-foreground text-sm mb-1">Audio</div>
              <div className="text-3xl font-bold text-purple-500">{stats.audio_count}</div>
            </div>
            <div className="bg-card border border-border backdrop-blur-sm rounded-lg p-6">
              <div className="text-muted-foreground text-sm mb-1">Video</div>
              <div className="text-3xl font-bold text-blue-500">{stats.video_count}</div>
            </div>
            <div className="bg-card border border-border backdrop-blur-sm rounded-lg p-6">
              <div className="text-muted-foreground text-sm mb-1">Favorites</div>
              <div className="text-3xl font-bold text-yellow-500">{stats.favorites_count}</div>
            </div>
            <div className="bg-card border border-border backdrop-blur-sm rounded-lg p-6">
              <div className="text-muted-foreground text-sm mb-1">Total Duration</div>
              <div className="text-3xl font-bold text-foreground">{formatDuration(stats.total_duration)}</div>
            </div>
          </div>
        )}

        {/* Filters, Search, and Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('audio')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                filter === 'audio'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              <Music className="w-4 h-4" />
              Audio
            </button>
            <button
              onClick={() => setFilter('video')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                filter === 'video'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              <Video className="w-4 h-4" />
              Video
            </button>
          </div>
          
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={addAllToQueue}
              className="px-4 py-2 bg-muted hover:bg-accent rounded-lg text-foreground font-medium transition-colors flex items-center gap-2"
              title="Add all to queue"
            >
              <List className="w-4 h-4" />
              Add to Queue
            </button>
            <button
              onClick={playAllShuffled}
              className="px-4 py-2 bg-muted hover:bg-accent rounded-lg text-foreground font-medium transition-colors flex items-center gap-2"
              title={t('mediaPlayer.actions.shuffleAll', 'Play all shuffled')}
            >
              <Shuffle className="w-4 h-4" />
              {t('mediaPlayer.actions.shuffleAllLabel', 'Shuffle All')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Media Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.length === 0 ? (
                mediaItems.length === 0 ? (
                  /* M5 Empty State - No media at all */
                  <div className="col-span-full">
                    <EmptyState
                      preset="noFiles"
                      title={t('mediaPlayer.empty.noMedia', 'No Media Found')}
                      description={t('mediaPlayer.empty.noMediaDesc', 'Add some audio or video files to get started with your media library.')}
                      action={{
                        label: t('mediaPlayer.actions.addMedia', 'Add Media'),
                        onClick: () => setShowAddDialog(true)
                      }}
                      testId="media-empty-state"
                    />
                  </div>
                ) : (
                  /* M5 Empty State - Search/filter returned nothing */
                  <div className="col-span-full">
                    <EmptyState
                      preset="search"
                      title={t('mediaPlayer.empty.noResults', 'No Results Found')}
                      description={t('mediaPlayer.empty.noResultsDesc', 'Try adjusting your search or filter to find what you\'re looking for.')}
                      testId="media-search-empty"
                    />
                  </div>
                )
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-card border backdrop-blur-sm rounded-lg p-4 hover:bg-accent transition-colors ${
                      currentItem?.id === item.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-foreground font-semibold truncate">{item.title}</h3>
                        {item.artist && (
                          <p className="text-muted-foreground text-sm truncate">{item.artist}</p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className="text-muted-foreground hover:text-yellow-500 transition-colors ml-2 flex-shrink-0"
                        title={item.is_favorite ? t('mediaPlayer.actions.removeFromFavorites', 'Remove from favorites') : t('mediaPlayer.actions.addToFavorites', 'Add to favorites')}
                        aria-label={item.is_favorite ? t('mediaPlayer.actions.removeFromFavorites', 'Remove from favorites') : t('mediaPlayer.actions.addToFavorites', 'Add to favorites')}
                      >
                        <Heart
                          className={`w-5 h-5 ${item.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''}`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between text-muted-foreground text-sm mb-3">
                      <span className="flex items-center gap-1">
                        {item.media_type === 'audio' ? (
                          <Music className="w-4 h-4" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                        {item.media_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(item.duration)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">{item.play_count} plays</span>
                      <button
                        onClick={() => playMedia(item)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 rounded-lg text-white text-sm font-medium transition-opacity"
                      >
                        {currentItem?.id === item.id && playbackState.is_playing ? (
                          <>
                            <PauseCircle className="w-4 h-4" />
                            Playing
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-4 h-4" />
                            Play
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Playlists Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border backdrop-blur-sm rounded-lg p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <List className="w-5 h-5" />
                  Playlists
                </h2>
                <button
                  onClick={() => setShowPlaylistDialog(true)}
                  className="p-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground transition-colors"
                  title="Create playlist"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {playlists.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No playlists yet
                  </p>
                ) : (
                  playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="bg-muted rounded-lg p-3 hover:bg-accent transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-foreground font-semibold text-sm truncate">
                            {playlist.name}
                          </h3>
                          {playlist.description && (
                            <p className="text-muted-foreground text-xs truncate">
                              {playlist.description}
                            </p>
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs ml-2 flex-shrink-0">
                          {playlist.items?.length || 0}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Queue Panel */}
            {queue.length > 0 && (
              <div className="bg-card border border-border backdrop-blur-sm rounded-lg p-6 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Queue</h2>
                  <span className="text-muted-foreground text-sm">
                    {queueIndex + 1} / {queue.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {queue.slice(queueIndex, queueIndex + 5).map((item, idx) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        idx === 0 ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <span className="text-xs w-4">{queueIndex + idx + 1}</span>
                      <span className="truncate flex-1 text-sm">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Player */}
        {currentItem && (
          <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-4 z-40">
            <div className="max-w-7xl mx-auto">
              {/* Progress Bar */}
              <div
                ref={progressRef}
                className="w-full h-1 bg-muted rounded-full mb-4 cursor-pointer group"
                onClick={handleSeek}
                role="progressbar"
                aria-label="Playback progress"
              >
                <div
                  ref={progressFillRef}
                  className="progress-bar-fill h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full relative transition-all"
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                {/* Current Track Info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    {currentItem.media_type === 'audio' ? (
                      <Music className="w-6 h-6 text-white" />
                    ) : (
                      <Video className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-foreground font-semibold truncate">{currentItem.title}</h3>
                    <p className="text-muted-foreground text-sm truncate">
                      {currentItem.artist || 'Unknown Artist'}
                    </p>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleShuffle}
                    className={`p-2 rounded-lg transition-colors ${
                      playbackState.shuffle
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Shuffle"
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={skipPrevious}
                    className="p-2 text-foreground hover:text-primary transition-colors"
                    title="Previous"
                  >
                    <SkipBack className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={togglePlayPause}
                    className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white hover:opacity-90 transition-opacity"
                    title={playbackState.is_playing ? 'Pause' : 'Play'}
                  >
                    {playbackState.is_playing ? (
                      <PauseCircle className="w-8 h-8" />
                    ) : (
                      <PlayCircle className="w-8 h-8" />
                    )}
                  </button>
                  
                  <button
                    onClick={skipNext}
                    className="p-2 text-foreground hover:text-primary transition-colors"
                    title="Next"
                  >
                    <SkipForward className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={cycleLoopMode}
                    className={`p-2 rounded-lg transition-colors ${
                      playbackState.loop_mode !== 'none'
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={`Loop: ${playbackState.loop_mode}`}
                  >
                    {playbackState.loop_mode === 'one' ? (
                      <Repeat1 className="w-5 h-5" />
                    ) : (
                      <Repeat className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Time and Volume */}
                <div className="flex items-center gap-4 flex-1 justify-end">
                  <span className="text-muted-foreground text-sm tabular-nums">
                    {formatDuration(playbackState.current_time)} / {formatDuration(playbackState.duration)}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      title={playbackState.is_muted ? 'Unmute' : 'Mute'}
                    >
                      {playbackState.is_muted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={playbackState.is_muted ? 0 : playbackState.volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-24 accent-primary"
                      title="Volume"
                    />
                  </div>

                  {/* Playback Speed */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSpeedSelector(!showSpeedSelector)}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      title="Playback Speed"
                    >
                      <Gauge className="w-5 h-5" />
                    </button>
                    {showSpeedSelector && (
                      <div className="absolute bottom-full mb-2 right-0 bg-card border border-border rounded-lg p-2 shadow-lg min-w-[100px]">
                        {playbackSpeeds.map(speed => (
                          <button
                            key={speed}
                            onClick={() => setPlaybackSpeed(speed)}
                            className={`block w-full text-left px-3 py-1 rounded hover:bg-accent ${
                              playbackState.playback_rate === speed ? 'bg-primary text-primary-foreground' : ''
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Equalizer Toggle */}
                  <button
                    onClick={() => setShowEqualizer(!showEqualizer)}
                    className={`p-2 transition-colors ${showEqualizer ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    title="Equalizer"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>

                  {/* Subtitles (Video Only) */}
                  {currentItem.media_type === 'video' && subtitleTracks.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                        className={`p-2 transition-colors ${selectedSubtitle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Subtitles"
                      >
                        <Subtitles className="w-5 h-5" />
                      </button>
                      {showSubtitleMenu && (
                        <div className="absolute bottom-full mb-2 right-0 bg-card border border-border rounded-lg p-2 shadow-lg min-w-[150px]">
                          <button
                            onClick={() => selectSubtitle(null)}
                            className={`block w-full text-left px-3 py-1 rounded hover:bg-accent ${
                              !selectedSubtitle ? 'bg-primary text-primary-foreground' : ''
                            }`}
                          >
                            Off
                          </button>
                          {subtitleTracks.map(track => (
                            <button
                              key={track.id}
                              onClick={() => selectSubtitle(track.id)}
                              className={`block w-full text-left px-3 py-1 rounded hover:bg-accent ${
                                selectedSubtitle === track.id ? 'bg-primary text-primary-foreground' : ''
                              }`}
                            >
                              {track.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audio Tracks (Video Only) */}
                  {currentItem.media_type === 'video' && audioTracks.length > 1 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowAudioTrackMenu(!showAudioTrackMenu)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Audio Track"
                      >
                        <Languages className="w-5 h-5" />
                      </button>
                      {showAudioTrackMenu && (
                        <div className="absolute bottom-full mb-2 right-0 bg-card border border-border rounded-lg p-2 shadow-lg min-w-[150px]">
                          {audioTracks.map(track => (
                            <button
                              key={track.id}
                              onClick={() => selectAudioTrack(track.id)}
                              className={`block w-full text-left px-3 py-1 rounded hover:bg-accent ${
                                selectedAudioTrack === track.id ? 'bg-primary text-primary-foreground' : ''
                              }`}
                            >
                              {track.label} ({track.language})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {currentItem.media_type === 'video' && (
                    <button
                      onClick={() => setIsPlayerExpanded(!isPlayerExpanded)}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      title={isPlayerExpanded ? 'Minimize' : 'Fullscreen'}
                    >
                      {isPlayerExpanded ? (
                        <Minimize2 className="w-5 h-5" />
                      ) : (
                        <Maximize2 className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Equalizer Panel */}
        {showEqualizer && currentItem && (
          <Card className="fixed bottom-24 right-6 w-[400px] z-40">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5" />
                  Equalizer
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={equalizerEnabled}
                    onCheckedChange={(checked) => {
                      setEqualizerEnabled(checked);
                      if (checked) initializeEqualizer();
                    }}
                  />
                  <Button variant="ghost" size="icon" onClick={() => setShowEqualizer(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preset Selector */}
              <div className="flex flex-wrap gap-1">
                {Object.keys(equalizerPresets).map(preset => (
                  <Badge
                    key={preset}
                    variant={selectedPreset === preset ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => applyEqualizerPreset(preset)}
                  >
                    {preset}
                  </Badge>
                ))}
              </div>
              
              {/* Equalizer Bands */}
              <div className="flex justify-between items-end h-32 gap-1">
                {equalizerBands.map((band, index) => (
                  <div key={band.frequency} className="flex flex-col items-center gap-1 flex-1">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={band.gain}
                      onChange={(e) => updateEqualizerBand(index, parseInt(e.target.value))}
                      className="w-full h-24 accent-primary"
                      style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                      disabled={!equalizerEnabled}
                    />
                    <span className="text-xs text-muted-foreground">{band.frequency}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">-12dB</span>
                <Button variant="outline" size="sm" onClick={resetEqualizer}>
                  Reset
                </Button>
                <span className="text-xs text-muted-foreground">+12dB</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Media Dialog */}
        {showAddDialog && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAddDialog(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div 
                className="bg-card border border-border rounded-lg p-6 w-full max-w-md pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground">Add Media</h2>
                  <button
                    onClick={() => setShowAddDialog(false)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    title="Close dialog"
                    aria-label="Close add media dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleAddMedia}>
                  <input
                    type="text"
                    placeholder="Title"
                    value={newMediaTitle}
                    onChange={(e) => setNewMediaTitle(e.target.value)}
                    className="w-full px-4 py-2 mb-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Artist (optional)"
                    value={newMediaArtist}
                    onChange={(e) => setNewMediaArtist(e.target.value)}
                    className="w-full px-4 py-2 mb-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    placeholder="File Path"
                    value={newMediaPath}
                    onChange={(e) => setNewMediaPath(e.target.value)}
                    className="w-full px-4 py-2 mb-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <select
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value as 'audio' | 'video')}
                    title="Media type"
                    className="w-full px-4 py-2 mb-4 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="audio">Audio</option>
                    <option value="video">Video</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground font-medium transition-colors"
                    >
                      Add to Library
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddDialog(false)}
                      className="flex-1 px-4 py-2 bg-muted hover:bg-accent rounded-lg text-foreground font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Create Playlist Dialog */}
        {showPlaylistDialog && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowPlaylistDialog(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div 
                className="bg-card border border-border rounded-lg p-6 w-full max-w-md pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground">Create Playlist</h2>
                  <button
                    onClick={() => setShowPlaylistDialog(false)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    title="Close dialog"
                    aria-label="Close create playlist dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreatePlaylist}>
                  <input
                    type="text"
                    placeholder="Playlist Name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full px-4 py-2 mb-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newPlaylistDesc}
                    onChange={(e) => setNewPlaylistDesc(e.target.value)}
                    className="w-full px-4 py-2 mb-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground font-medium transition-colors"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPlaylistDialog(false)}
                      className="flex-1 px-4 py-2 bg-muted hover:bg-accent rounded-lg text-foreground font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Fullscreen Video Exit Button */}
        {isPlayerExpanded && currentItem?.media_type === 'video' && (
          <button
            onClick={() => setIsPlayerExpanded(false)}
            className="fixed top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
            title="Exit fullscreen"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
    </AppLayout>
  );
}
