/**
 * Player Controls Component - Media playback controls
 * CUBE Nexum Platform v2.0
 */

import React from 'react';
import {
  PlaybackInfo,
  Playlist,
  formatDuration,
} from '../../types/media';
import './PlayerControls.css';

interface PlayerControlsProps {
  playback: PlaybackInfo;
  playlist: Playlist | null;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onRepeatToggle: () => void;
  onShuffleToggle: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  playback,
  playlist,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onPlaybackRateChange,
  onNext,
  onPrevious,
  onRepeatToggle,
  onShuffleToggle,
  onSkipForward,
  onSkipBackward,
}) => {
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    onSeek(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    onVolumeChange(volume);
  };

  const getRepeatIcon = () => {
    switch (playlist?.repeat_mode) {
      case 'one':
        return '🔂';
      case 'all':
        return '🔁';
      default:
        return '↻';
    }
  };

  const getVolumeIcon = () => {
    if (playback.muted || playback.volume === 0) return '🔇';
    if (playback.volume < 0.5) return '🔉';
    return '🔊';
  };

  return (
    <div className="player-controls">
      <div className="progress-container">
        <span className="time-current">{formatDuration(playback.current_time)}</span>
        <input
          type="range"
          className="progress-bar"
          min="0"
          max={playback.duration || 0}
          value={playback.current_time}
          onChange={handleSeekChange}
          disabled={!playback.current_item}
          title="Seek through media"
          aria-label="Media playback position"
        />
        <span className="time-total">{formatDuration(playback.duration)}</span>
      </div>

      <div className="controls-main">
        <div className="controls-left">
          <button
            className={`control-btn shuffle ${playlist?.shuffle_enabled ? 'active' : ''}`}
            onClick={onShuffleToggle}
            disabled={!playlist}
            title="Shuffle (S)"
          >
            🔀
          </button>
          <button
            className="control-btn"
            onClick={onPrevious}
            disabled={!playlist}
            title="Previous (P)"
          >
            ⏮️
          </button>
          <button
            className="control-btn skip"
            onClick={onSkipBackward}
            disabled={!playback.current_item}
            title="Skip Backward (←)"
          >
            ⏪
          </button>
        </div>

        <div className="controls-center">
          <button
            className="control-btn stop"
            onClick={onStop}
            disabled={!playback.current_item}
            title="Stop"
          >
            ⏹️
          </button>
          {playback.state === 'playing' ? (
            <button
              className="control-btn play-pause"
              onClick={onPause}
              title="Pause (Space)"
            >
              ⏸️
            </button>
          ) : (
            <button
              className="control-btn play-pause"
              onClick={onPlay}
              disabled={!playback.current_item}
              title="Play (Space)"
            >
              ▶️
            </button>
          )}
        </div>

        <div className="controls-right">
          <button
            className="control-btn skip"
            onClick={onSkipForward}
            disabled={!playback.current_item}
            title="Skip Forward (→)"
          >
            ⏩
          </button>
          <button
            className="control-btn"
            onClick={onNext}
            disabled={!playlist}
            title="Next (N)"
          >
            ⏭️
          </button>
          <button
            className={`control-btn repeat ${playlist?.repeat_mode !== 'off' ? 'active' : ''}`}
            onClick={onRepeatToggle}
            disabled={!playlist}
            title="Repeat (R)"
          >
            {getRepeatIcon()}
          </button>
        </div>
      </div>

      <div className="controls-bottom">
        <div className="info-section">
          {playback.current_item && (
            <>
              <div className="now-playing">
                <span className="track-title">{playback.current_item.title}</span>
                {playback.current_item.artist && (
                  <span className="track-artist">{playback.current_item.artist}</span>
                )}
              </div>
              {playback.state === 'loading' && (
                <div className="buffering">
                  <div className="buffering-spinner"></div>
                  <span>Loading...</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="volume-section">
          <button className="volume-btn" onClick={onMuteToggle} title="Mute (M)">
            {getVolumeIcon()}
          </button>
          <input
            type="range"
            className="volume-bar"
            min="0"
            max="1"
            step="0.01"
            value={playback.muted ? 0 : playback.volume}
            onChange={handleVolumeChange}
            title="Adjust volume"
            aria-label="Volume control"
          />
          <span className="volume-percent">{Math.round(playback.volume * 100)}%</span>
        </div>

        <div className="rate-section">
          <label>Speed:</label>
          <select
            value={playback.playback_rate}
            onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
            className="rate-select"
            title="Playback speed"
            aria-label="Playback speed"
          >
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="1.75">1.75x</option>
            <option value="2">2x</option>
          </select>
        </div>

        {playback.buffered_percent > 0 && playback.buffered_percent < 100 && (
          <div className="buffer-info">
            <span>Buffered: {playback.buffered_percent}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
