/**
 * Video Player Component - Video playback with subtitles
 * CUBE Nexum Platform v2.0
 */

import React, { forwardRef, useState, useEffect } from 'react';
import {
  MediaItem,
  PlaybackInfo,
  SubtitleTrack,
  SubtitleCue,
  parseSubtitleFile,
} from '../../types/media';
import './VideoPlayer.css';

interface VideoPlayerProps {
  item: MediaItem | null;
  playback: PlaybackInfo;
  subtitles: SubtitleTrack[];
  activeSubtitle: SubtitleTrack | null;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onEnded: () => void;
  onError: (error: string) => void;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ item, playback, subtitles, activeSubtitle, onTimeUpdate, onDurationChange, onEnded, onError }, ref) => {
    const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);
    const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
      if (activeSubtitle && activeSubtitle.content) {
        const cues = parseSubtitleFile(activeSubtitle.content, activeSubtitle.format);
        setSubtitleCues(cues);
      } else {
        setSubtitleCues([]);
        setCurrentCue(null);
      }
    }, [activeSubtitle]);

    useEffect(() => {
      if (subtitleCues.length === 0) {
        setCurrentCue(null);
        return;
      }

      const cue = subtitleCues.find(
        (c) => playback.current_time >= c.start_time && playback.current_time <= c.end_time
      );

      setCurrentCue(cue || null);
    }, [playback.current_time, subtitleCues]);

    const toggleFullscreen = () => {
      if (!ref || !('current' in ref) || !ref.current) return;

      if (!isFullscreen) {
        if (ref.current.requestFullscreen) {
          ref.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }

      setIsFullscreen(!isFullscreen);
    };

    useEffect(() => {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
      <div className={`video-player ${isFullscreen ? 'fullscreen' : ''}`}>
        <video
          ref={ref}
          className="video-element"
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          onDurationChange={(e) => onDurationChange(e.currentTarget.duration)}
          onEnded={onEnded}
          onError={() => onError('Failed to load video')}
        />

        {currentCue && (
          <div className="subtitle-overlay">
            <div className="subtitle-text">{currentCue.text}</div>
          </div>
        )}

        <div className="video-overlay">
          <button
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? '⤓' : '⤢'}
          </button>

          {item && (
            <div className="video-info">
              <h3>{item.title}</h3>
              {item.metadata.resolution && (
                <span className="resolution">{item.metadata.resolution}</span>
              )}
              {playback.quality !== 'auto' && (
                <span className="quality">{playback.quality}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
