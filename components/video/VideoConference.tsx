'use client';

import React, { useState, useEffect, useRef } from 'react';
import { videoConferenceService } from '../../lib/services/videoConferenceService';
import type { ConferenceRoom, Participant, MediaStream as VideoStream } from '../../lib/services/videoConferenceService';
import { logger } from '@/lib/services/logger-service';
import './VideoConference.css';

const log = logger.scope('VideoConference');

// Safe media devices helper for Tauri environment
const getMediaDevicesSafe = () => {
  if (typeof navigator === 'undefined') return null;
  if (!navigator.mediaDevices) return null;
  if (typeof navigator.mediaDevices.getUserMedia !== 'function') return null;
  return navigator.mediaDevices;
};

const isMediaSupported = (): boolean => {
  return getMediaDevicesSafe() !== null;
};

interface VideoConferenceProps {
  roomId: string;
  userId: string;
  userName: string;
}

export const VideoConference: React.FC<VideoConferenceProps> = ({ roomId, userId, userName }) => {
  const [room, setRoom] = useState<ConferenceRoom | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [streams, setStreams] = useState<VideoStream[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    joinRoom();
    const interval = setInterval(updateParticipants, 2000);
    
    return () => {
      clearInterval(interval);
      leaveRoom();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const joinRoom = async () => {
    try {
      // Check media support first
      if (!isMediaSupported()) {
        log.warn('Media devices not available in this environment');
        // Continue without local media - participant can still join
      }
      
      await videoConferenceService.joinRoom(roomId, userId, userName);
      const roomData = await videoConferenceService.getRoom(roomId);
      setRoom(roomData);
      await updateParticipants();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
      // Don't show error for media device issues in Tauri
      if (errorMessage.includes('getUserMedia') || errorMessage.includes('mediaDevices')) {
        log.warn('Media access limited:', errorMessage);
        setError('Camera/microphone not available in this environment. You can still view the conference.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async () => {
    try {
      await videoConferenceService.leaveRoom(roomId, userId);
    } catch (err) {
      log.error('Failed to leave room:', err);
    }
  };

  const updateParticipants = async () => {
    try {
      const parts = await videoConferenceService.getParticipants(roomId);
      setParticipants(parts);
      
      const strms = await videoConferenceService.getStreams(roomId);
      setStreams(strms);
    } catch (err) {
      log.error('Failed to update participants:', err);
    }
  };

  const toggleAudio = async () => {
    try {
      await videoConferenceService.toggleAudio(roomId, userId, !audioEnabled);
      setAudioEnabled(!audioEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle audio');
    }
  };

  const toggleVideo = async () => {
    try {
      await videoConferenceService.toggleVideo(roomId, userId, !videoEnabled);
      setVideoEnabled(!videoEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle video');
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (screenSharing) {
        await videoConferenceService.stopScreenShare(roomId, userId);
        setScreenSharing(false);
      } else {
        await videoConferenceService.startScreenShare(roomId, userId);
        setScreenSharing(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle screen share');
    }
  };

  const toggleHand = async () => {
    try {
      await videoConferenceService.toggleHand(roomId, userId, !handRaised);
      setHandRaised(!handRaised);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle hand');
    }
  };

  const toggleRecording = async () => {
    try {
      if (recording) {
        await videoConferenceService.stopRecording(roomId);
        setRecording(false);
      } else {
        const outputPath = `recording_${Date.now()}.webm`;
        await videoConferenceService.startRecording(roomId, outputPath);
        setRecording(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle recording');
    }
  };

  if (loading) {
    return <div className="video-conference__loading">Joining conference...</div>;
  }

  if (error) {
    return <div className="video-conference__error">{error}</div>;
  }

  const getGridClass = () => {
    if (participants.length === 1) return 'video-conference__grid video-conference__grid--1';
    if (participants.length === 2) return 'video-conference__grid video-conference__grid--2';
    if (participants.length <= 4) return 'video-conference__grid video-conference__grid--4';
    if (participants.length <= 9) return 'video-conference__grid video-conference__grid--9';
    return 'video-conference__grid video-conference__grid--many';
  };

  return (
    <div className="video-conference" data-tour="video-conference">
      {/* Header */}
      <div className="video-conference__header" data-tour="video-header">
        <h2 className="video-conference__title">
          {room?.name || 'Video Conference'}
        </h2>
        <p className="video-conference__subtitle">
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
          {recording && (
            <span className="video-conference__recording-indicator" data-tour="recording-indicator">
              ● Recording
            </span>
          )}
        </p>
      </div>

      {/* Video Grid */}
      <div className="video-conference__grid-container" data-tour="video-grid">
        <div className={getGridClass()}>
          {participants.map((participant) => {
            const stream = streams.find(s => s.participantId === participant.id);
            const isLocal = participant.id === userId;
            
            return (
              <div
                key={participant.id}
                className={`video-conference__participant ${
                  participant.audioEnabled ? 'video-conference__participant--speaking' : ''
                }`}
                data-tour={isLocal ? 'video-participant' : undefined}
              >
                {/* Video Element */}
                {stream?.enabled ? (
                  <video
                    ref={isLocal ? localVideoRef : undefined}
                    className="video-conference__video"
                    autoPlay
                    playsInline
                    muted={isLocal}
                  />
                ) : (
                  <div className="video-conference__avatar">
                    <div className="video-conference__avatar-circle">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}

                {/* Participant Info */}
                <div className="video-conference__info">
                  <div className="video-conference__info-content">
                    <span className="video-conference__name">
                      {participant.name}
                      {isLocal && ' (You)'}
                    </span>
                    <div className="video-conference__indicators">
                      {participant.handRaised && (
                        <span className="video-conference__indicator video-conference__indicator--hand">✋</span>
                      )}
                      {!participant.audioEnabled && (
                        <span className="video-conference__indicator video-conference__indicator--muted">🔇</span>
                      )}
                      {participant.screenSharing && (
                        <span className="video-conference__indicator video-conference__indicator--screen">🖥️</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Speaking Indicator */}
                {participant.audioEnabled && (
                  <div className="video-conference__speaking-dot" data-tour="speaking-indicator" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="video-conference__controls" data-tour="video-controls">
        <div className="video-conference__controls-inner">
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`video-conference__btn ${
              audioEnabled
                ? 'video-conference__btn--default'
                : 'video-conference__btn--danger'
            }`}
            title={audioEnabled ? 'Mute' : 'Unmute'}
            data-tour="audio-toggle"
          >
            {audioEnabled ? '🎤' : '🔇'}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`video-conference__btn ${
              videoEnabled
                ? 'video-conference__btn--default'
                : 'video-conference__btn--danger'
            }`}
            title={videoEnabled ? 'Stop Video' : 'Start Video'}
            data-tour="video-toggle"
          >
            {videoEnabled ? '📹' : '📵'}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`video-conference__btn ${
              screenSharing
                ? 'video-conference__btn--active'
                : 'video-conference__btn--default'
            }`}
            title={screenSharing ? 'Stop Sharing' : 'Share Screen'}
            data-tour="screen-share"
          >
            🖥️
          </button>

          {/* Raise Hand */}
          <button
            onClick={toggleHand}
            className={`video-conference__btn ${
              handRaised
                ? 'video-conference__btn--warning'
                : 'video-conference__btn--default'
            }`}
            title={handRaised ? 'Lower Hand' : 'Raise Hand'}
            data-tour="hand-raise"
          >
            ✋
          </button>

          {/* Recording */}
          <button
            onClick={toggleRecording}
            className={`video-conference__btn ${
              recording
                ? 'video-conference__btn--danger'
                : 'video-conference__btn--default'
            }`}
            title={recording ? 'Stop Recording' : 'Start Recording'}
            data-tour="recording"
          >
            ●
          </button>

          {/* Leave */}
          <button
            onClick={leaveRoom}
            className="video-conference__btn video-conference__btn--leave"
            title="Leave Conference"
            data-tour="leave-meeting"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};
