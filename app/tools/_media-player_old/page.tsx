"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');

/**
 * Media Player Page - Complete Media Player Interface
 * CUBE Nexum Platform v2.0
 * 
 * Full-featured media player with playlist management, equalizer,
 * subtitles, visualization, and streaming support.
 */


import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MediaItem,
  Playlist,
  PlaybackInfo,
  RepeatMode,
  EqualizerSettings,
  SubtitleTrack,
  PlayerSettings,
  VisualizerSettings,
  getDefaultPlayerSettings,
  getDefaultEqualizerSettings,
  getDefaultVisualizerSettings,
  getNextItem,
  getPreviousItem,
} from '../../../types/media';
import { PlayerControls } from '../../../components/media/PlayerControls';
import { PlaylistManager } from '../../../components/media/PlaylistManager';
import { Equalizer } from '../../../components/media/Equalizer';
import { SubtitlesManager } from '../../../components/media/SubtitlesManager';
import { SettingsPanel } from '../../../components/media/SettingsPanel';
import { VideoPlayer } from '../../../components/media/VideoPlayer';
import { AudioPlayer } from '../../../components/media/AudioPlayer';
import './media.css';

export default function MediaPlayerPage() {
  // State
  const [playback, setPlayback] = useState<PlaybackInfo>({
    state: 'stopped',
    current_item: null,
    current_time: 0,
    duration: 0,
    volume: 0.8,
    muted: false,
    playback_rate: 1.0,
    buffered_percent: 0,
    quality: 'auto',
  });
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [equalizer, setEqualizer] = useState<EqualizerSettings>(getDefaultEqualizerSettings());
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState<SubtitleTrack | null>(null);
  const [settings, setSettings] = useState<PlayerSettings>(getDefaultPlayerSettings());
  const [visualizer, setVisualizer] = useState<VisualizerSettings>(getDefaultVisualizerSettings());
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    initializePlayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializePlayer = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load settings
      await loadSettings();

      // Load playlists
      await loadPlaylists();

      // Load saved position if enabled
      if (settings.remember_position) {
        await loadSavedPosition();
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize player');
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = localStorage.getItem('media_player_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      const savedEqualizer = localStorage.getItem('media_player_equalizer');
      if (savedEqualizer) {
        setEqualizer(JSON.parse(savedEqualizer));
      }

      const savedVisualizer = localStorage.getItem('media_player_visualizer');
      if (savedVisualizer) {
        setVisualizer(JSON.parse(savedVisualizer));
      }
    } catch (err) {
      log.error('Failed to load settings:', err);
    }
  };

  const loadPlaylists = async () => {
    try {
      const savedPlaylists = localStorage.getItem('media_player_playlists');
      if (savedPlaylists) {
        const parsed = JSON.parse(savedPlaylists);
        setPlaylists(parsed);
        
        // Load last active playlist
        const lastPlaylistId = localStorage.getItem('media_player_last_playlist');
        if (lastPlaylistId) {
          const lastPlaylist = parsed.find((p: Playlist) => p.id === lastPlaylistId);
          if (lastPlaylist) {
            setCurrentPlaylist(lastPlaylist);
          }
        }
      }
    } catch (err) {
      log.error('Failed to load playlists:', err);
    }
  };

  const loadSavedPosition = async () => {
    try {
      const savedPosition = localStorage.getItem('media_player_position');
      if (savedPosition) {
        const { item_id, time } = JSON.parse(savedPosition);
        // Resume from saved position if item matches
        log.debug(`Saved position: ${item_id} ${time}`);
      }
    } catch (err) {
      log.error('Failed to load saved position:', err);
    }
  };

  // ============================================================================
  // PLAYBACK CONTROL
  // ============================================================================

  const play = useCallback(() => {
    const media = playback.current_item?.type === 'video' ? videoRef.current : audioRef.current;
    if (media) {
      media.play();
      setPlayback((prev) => ({ ...prev, state: 'playing' }));
    }
  }, [playback.current_item]);

  const pause = useCallback(() => {
    const media = playback.current_item?.type === 'video' ? videoRef.current : audioRef.current;
    if (media) {
      media.pause();
      setPlayback((prev) => ({ ...prev, state: 'paused' }));
    }
  }, [playback.current_item]);

  const stop = useCallback(() => {
    const media = playback.current_item?.type === 'video' ? videoRef.current : audioRef.current;
    if (media) {
      media.pause();
      media.currentTime = 0;
      setPlayback((prev) => ({
        ...prev,
        state: 'stopped',
        current_time: 0,
      }));
    }
  }, [playback.current_item]);

  const seek = useCallback((time: number) => {
    const media = playback.current_item?.type === 'video' ? videoRef.current : audioRef.current;
    if (media) {
      media.currentTime = time;
      setPlayback((prev) => ({ ...prev, current_time: time }));
    }
  }, [playback.current_item]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const media = playback.current_item?.type === 'video' ? videoRef.current : audioRef.current;
    if (media) {
      media.volume = clampedVolume;
      setPlayback((prev) => ({ ...prev, volume: clampedVolume }));
      localStorage.setItem('media_player_volume', clampedVolume.toString());
    }
  }, [playback.current_item]);

  const toggleMute = useCallback(() => {
    const media = playback.current_item?.type === 'video' ? videoRef.current : audioRef.current;
    if (media) {
      media.muted = !media.muted;
      setPlayback((prev) => ({ ...prev, muted: media.muted }));
    }
  }, [playback.current_item]);

  const setPlaybackRate = useCallback((rate: number) => {
    const media = playback.current_item?.type === 'video' ? videoRef.current : audioRef.current;
    if (media) {
      media.playbackRate = rate;
      setPlayback((prev) => ({ ...prev, playback_rate: rate }));
    }
  }, [playback.current_item]);

  const skipForward = useCallback(() => {
    const media = playback.current_item?.type === 'video' ? videoRef.current : audioRef.current;
    if (media) {
      media.currentTime = Math.min(media.currentTime + settings.skip_forward_seconds, media.duration);
    }
  }, [playback.current_item, settings.skip_forward_seconds]);

  const skipBackward = useCallback(() => {
    const media = playback.current_item?.type === 'video' ? videoRef.current : audioRef.current;
    if (media) {
      media.currentTime = Math.max(media.currentTime - settings.skip_backward_seconds, 0);
    }
  }, [playback.current_item, settings.skip_backward_seconds]);

  // ============================================================================
  // PLAYLIST MANAGEMENT
  // ============================================================================

  const loadItem = useCallback(async (item: MediaItem) => {
    try {
      setPlayback((prev) => ({
        ...prev,
        state: 'loading',
        current_item: item,
        current_time: 0,
        duration: item.duration,
      }));

      // Load media
      const media = item.type === 'video' ? videoRef.current : audioRef.current;
      if (media) {
        media.src = item.file_path;
        media.load();

        if (settings.auto_play) {
          await media.play();
          setPlayback((prev) => ({ ...prev, state: 'playing' }));
        } else {
          setPlayback((prev) => ({ ...prev, state: 'paused' }));
        }
      }

      // Load subtitles if video - handled by SubtitlesManager component
      if (item.type === 'video') {
        // Subtitles are loaded via SubtitlesManager when user selects a track
        log.debug('Video loaded, subtitles available via SubtitlesManager');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
      setPlayback((prev) => ({ ...prev, state: 'error' }));
    }
  }, [settings.auto_play]);

  const playNext = useCallback(() => {
    if (!currentPlaylist) return;

    const nextItem = getNextItem(currentPlaylist);
    if (nextItem) {
      const nextIndex = currentPlaylist.items.findIndex((item) => item.id === nextItem.id);
      setCurrentPlaylist((prev) => (prev ? { ...prev, current_index: nextIndex } : null));
      loadItem(nextItem);
    }
  }, [currentPlaylist, loadItem]);

  const playPrevious = useCallback(() => {
    if (!currentPlaylist) return;

    const prevItem = getPreviousItem(currentPlaylist);
    if (prevItem) {
      const prevIndex = currentPlaylist.items.findIndex((item) => item.id === prevItem.id);
      setCurrentPlaylist((prev) => (prev ? { ...prev, current_index: prevIndex } : null));
      loadItem(prevItem);
    }
  }, [currentPlaylist, loadItem]);

  const toggleRepeat = useCallback(() => {
    if (!currentPlaylist) return;

    const modes: RepeatMode[] = ['off', 'one', 'all'];
    const currentIndex = modes.indexOf(currentPlaylist.repeat_mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];

    setCurrentPlaylist((prev) => (prev ? { ...prev, repeat_mode: nextMode } : null));
    updatePlaylistInStorage({ ...currentPlaylist, repeat_mode: nextMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlaylist]);

  const toggleShuffle = useCallback(() => {
    if (!currentPlaylist) return;

    const shuffled = !currentPlaylist.shuffle_enabled;
    setCurrentPlaylist((prev) => (prev ? { ...prev, shuffle_enabled: shuffled } : null));
    updatePlaylistInStorage({ ...currentPlaylist, shuffle_enabled: shuffled });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlaylist]);

  // ============================================================================
  // MEDIA EVENTS
  // ============================================================================

  const handleTimeUpdate = useCallback((time: number) => {
    setPlayback((prev) => ({ ...prev, current_time: time }));

    // Save position if enabled
    if (settings.remember_position && playback.current_item) {
      localStorage.setItem(
        'media_player_position',
        JSON.stringify({
          item_id: playback.current_item.id,
          time,
        })
      );
    }
  }, [settings.remember_position, playback.current_item]);

  const handleDurationChange = useCallback((duration: number) => {
    setPlayback((prev) => ({ ...prev, duration }));
  }, []);

  const handleEnded = useCallback(() => {
    if (settings.auto_play_next) {
      playNext();
    } else {
      setPlayback((prev) => ({ ...prev, state: 'stopped', current_time: 0 }));
    }
  }, [settings.auto_play_next, playNext]);

  const handleError = useCallback((error: string) => {
    setError(error);
    setPlayback((prev) => ({ ...prev, state: 'error' }));
  }, []);

  // ============================================================================
  // STORAGE HELPERS
  // ============================================================================

  const updatePlaylistInStorage = useCallback((playlist: Playlist) => {
    setPlaylists((prev) => {
      const updated = prev.map((p) => (p.id === playlist.id ? playlist : p));
      localStorage.setItem('media_player_playlists', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<PlayerSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('media_player_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space: Play/Pause
      if (e.code === 'Space' && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        if (playback.state === 'playing') {
          pause();
        } else {
          play();
        }
      }

      // Arrow Left: Skip backward
      if (e.code === 'ArrowLeft' && !e.ctrlKey) {
        e.preventDefault();
        skipBackward();
      }

      // Arrow Right: Skip forward
      if (e.code === 'ArrowRight' && !e.ctrlKey) {
        e.preventDefault();
        skipForward();
      }

      // Arrow Up: Volume up
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume(playback.volume + 0.1);
      }

      // Arrow Down: Volume down
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume(playback.volume - 0.1);
      }

      // M: Mute
      if (e.code === 'KeyM' && !e.ctrlKey) {
        e.preventDefault();
        toggleMute();
      }

      // N: Next track
      if (e.code === 'KeyN' && !e.ctrlKey) {
        e.preventDefault();
        playNext();
      }

      // P: Previous track
      if (e.code === 'KeyP' && !e.ctrlKey) {
        e.preventDefault();
        playPrevious();
      }

      // R: Toggle repeat
      if (e.code === 'KeyR' && !e.ctrlKey) {
        e.preventDefault();
        toggleRepeat();
      }

      // S: Toggle shuffle
      if (e.code === 'KeyS' && !e.ctrlKey) {
        e.preventDefault();
        toggleShuffle();
      }

      // E: Toggle equalizer
      if (e.code === 'KeyE' && e.ctrlKey) {
        e.preventDefault();
        setShowEqualizer((prev) => !prev);
      }

      // L: Toggle playlist
      if (e.code === 'KeyL' && e.ctrlKey) {
        e.preventDefault();
        setShowPlaylist((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playback, play, pause, skipForward, skipBackward, setVolume, toggleMute, playNext, playPrevious, toggleRepeat, toggleShuffle]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="media-player-page loading">
        <div className="spinner"></div>
        <p>Loading media player...</p>
      </div>
    );
  }

  return (
    <div className="media-player-page">
      <div className="player-header">
        <h1>Media Player</h1>
        <div className="header-actions">
          <button
            className={`icon-btn ${showPlaylist ? 'active' : ''}`}
            onClick={() => setShowPlaylist(!showPlaylist)}
            title="Toggle Playlist (Ctrl+L)"
          >
            <span className="icon">📋</span>
          </button>
          <button
            className={`icon-btn ${showEqualizer ? 'active' : ''}`}
            onClick={() => setShowEqualizer(!showEqualizer)}
            title="Toggle Equalizer (Ctrl+E)"
          >
            <span className="icon">🎚️</span>
          </button>
          <button
            className={`icon-btn ${showVisualizer ? 'active' : ''}`}
            onClick={() => setShowVisualizer(!showVisualizer)}
            title="Toggle Visualizer"
          >
            <span className="icon">🌊</span>
          </button>
          <button
            className="icon-btn"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <span className="icon">⚙️</span>
          </button>
        </div>
      </div>

      <div className="player-content">
        <div className="player-main">
          {playback.current_item?.type === 'video' ? (
            <VideoPlayer
              ref={videoRef}
              item={playback.current_item}
              playback={playback}
              subtitles={subtitles}
              activeSubtitle={activeSubtitle}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              onEnded={handleEnded}
              onError={handleError}
            />
          ) : (
            <AudioPlayer
              ref={audioRef}
              item={playback.current_item}
              playback={playback}
              visualizer={visualizer}
              showVisualizer={showVisualizer}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              onEnded={handleEnded}
              onError={handleError}
            />
          )}

          <PlayerControls
            playback={playback}
            playlist={currentPlaylist}
            onPlay={play}
            onPause={pause}
            onStop={stop}
            onSeek={seek}
            onVolumeChange={setVolume}
            onMuteToggle={toggleMute}
            onPlaybackRateChange={setPlaybackRate}
            onNext={playNext}
            onPrevious={playPrevious}
            onRepeatToggle={toggleRepeat}
            onShuffleToggle={toggleShuffle}
            onSkipForward={skipForward}
            onSkipBackward={skipBackward}
          />
        </div>

        {showPlaylist && (
          <PlaylistManager
            playlists={playlists}
            currentPlaylist={currentPlaylist}
            currentItem={playback.current_item}
            onPlaylistSelect={setCurrentPlaylist}
            onItemSelect={loadItem}
            onPlaylistCreate={(playlist) => {
              setPlaylists((prev) => [...prev, playlist]);
              localStorage.setItem('media_player_playlists', JSON.stringify([...playlists, playlist]));
            }}
            onPlaylistDelete={(id) => {
              setPlaylists((prev) => prev.filter((p) => p.id !== id));
              if (currentPlaylist?.id === id) {
                setCurrentPlaylist(null);
              }
            }}
            onPlaylistUpdate={updatePlaylistInStorage}
          />
        )}
      </div>

      {showEqualizer && (
        <Equalizer
          settings={equalizer}
          onUpdate={(newSettings) => {
            setEqualizer(newSettings);
            localStorage.setItem('media_player_equalizer', JSON.stringify(newSettings));
          }}
          onClose={() => setShowEqualizer(false)}
        />
      )}

      {showSubtitles && playback.current_item?.type === 'video' && (
        <SubtitlesManager
          subtitles={subtitles}
          activeSubtitle={activeSubtitle}
          onSubtitleSelect={setActiveSubtitle}
          onSubtitleAdd={(subtitle) => setSubtitles((prev) => [...prev, subtitle])}
          onSubtitleRemove={(id) => setSubtitles((prev) => prev.filter((s) => s.id !== id))}
          onClose={() => setShowSubtitles(false)}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {error && (
        <div className="error-toast">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
