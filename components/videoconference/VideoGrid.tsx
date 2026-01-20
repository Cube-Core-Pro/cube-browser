'use client';

import React, { useRef, useEffect } from 'react';
import {
  Participant,
  LayoutConfig,
  getLayoutGridColumns,
  getParticipantColor,
  getRoleDisplayName,
  getConnectionQualityColor,
} from '../../types/videoconference';
import './VideoGrid.css';

interface VideoGridProps {
  participants: Participant[];
  currentParticipant: Participant | null;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  layoutConfig: LayoutConfig;
  onLayoutChange: (config: LayoutConfig) => void;
  isPictureInPicture?: boolean;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  currentParticipant,
  localStream,
  screenStream,
  layoutConfig,
  onLayoutChange,
  isPictureInPicture = false,
}) => {
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Set up local video stream
  useEffect(() => {
    if (localStream && currentParticipant) {
      const videoElement = videoRefs.current.get(currentParticipant.participant_id);
      if (videoElement) {
        videoElement.srcObject = localStream;
      }
    }
  }, [localStream, currentParticipant]);

  // Set up screen share stream
  useEffect(() => {
    if (screenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Get screen sharer
  const screenSharer = participants.find(p => p.is_screen_sharing);

  // Calculate grid layout
  const visibleParticipants = layoutConfig.type === 'spotlight' && layoutConfig.pinned_participant_id
    ? participants.filter(p => p.participant_id === layoutConfig.pinned_participant_id)
    : participants;

  const gridCols = getLayoutGridColumns(visibleParticipants.length);

  // Render participant tile
  const renderParticipantTile = (participant: Participant) => {
    const isCurrentUser = participant.participant_id === currentParticipant?.participant_id;
    const color = getParticipantColor(participant.participant_id);
    const qualityColor = getConnectionQualityColor(participant.connection_quality);

    return (
      <div
        key={participant.participant_id}
        className={`video-tile ${isCurrentUser ? 'local-user' : ''}`}
      >
        <video
          ref={el => {
            if (el) {
              videoRefs.current.set(participant.participant_id, el);
            }
          }}
          autoPlay
          playsInline
          muted={isCurrentUser}
          className={participant.is_video_enabled ? '' : 'hidden'}
        />

        {!participant.is_video_enabled && (
          <div className="video-placeholder" style={{ backgroundColor: color }}>
            <div className="avatar-text">
              {participant.display_name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        <div className="video-overlay">
          <div className="participant-name">
            {participant.display_name}
            {isCurrentUser && ' (You)'}
            {participant.is_screen_sharing && ' 🖥️'}
            {participant.hand_raised && ' ✋'}
          </div>

          <div className="participant-badges">
            <span className="role-badge" style={{ backgroundColor: color }}>
              {getRoleDisplayName(participant.role)}
            </span>
            
            {participant.is_audio_muted && (
              <span className="status-badge muted">🔇</span>
            )}
            
            <span
              className="quality-indicator"
              style={{ backgroundColor: qualityColor }}
              title={`Connection: ${participant.connection_quality}%`}
            />
          </div>
        </div>
      </div>
    );
  };

  // Render screen share view
  if (screenSharer && layoutConfig.showScreenShare) {
    return (
      <div className={`video-grid screen-share-layout ${isPictureInPicture ? 'pip-mode' : ''}`}>
        <div className="screen-share-main">
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            className="screen-share-video"
          />
          <div className="screen-share-info">
            <span>{screenSharer.display_name} is sharing screen</span>
          </div>
        </div>

        <div className="screen-share-sidebar">
          {participants.map(participant => renderParticipantTile(participant))}
        </div>

        <div className="layout-controls">
          <button
            className="layout-button"
            onClick={() =>
              onLayoutChange({
                ...layoutConfig,
                showScreenShare: false,
              })
            }
            title="Hide screen share"
          >
            ⛶
          </button>
        </div>
      </div>
    );
  }

  // Render grid layout
  if (layoutConfig.type === 'grid') {
    return (
      <div
        className={`video-grid grid-layout ${isPictureInPicture ? 'pip-mode' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        }}
      >
        {participants.map(participant => renderParticipantTile(participant))}

        <div className="layout-controls">
          <button
            className="layout-button active"
            onClick={() =>
              onLayoutChange({
                ...layoutConfig,
                type: 'grid',
              })
            }
            title="Grid layout"
          >
            ⊞
          </button>
          <button
            className="layout-button"
            onClick={() =>
              onLayoutChange({
                ...layoutConfig,
                type: 'spotlight',
              })
            }
            title="Spotlight layout"
          >
            ⊡
          </button>
          <button
            className="layout-button"
            onClick={() =>
              onLayoutChange({
                ...layoutConfig,
                type: 'sidebar',
              })
            }
            title="Sidebar layout"
          >
            ⊟
          </button>
        </div>
      </div>
    );
  }

  // Render spotlight layout
  if (layoutConfig.type === 'spotlight') {
    const pinnedParticipant = layoutConfig.pinned_participant_id
      ? participants.find(p => p.participant_id === layoutConfig.pinned_participant_id)
      : participants[0];

    const otherParticipants = participants.filter(
      p => p.participant_id !== pinnedParticipant?.participant_id
    );

    return (
      <div className={`video-grid spotlight-layout ${isPictureInPicture ? 'pip-mode' : ''}`}>
        <div className="spotlight-main">
          {pinnedParticipant && renderParticipantTile(pinnedParticipant)}
        </div>

        {otherParticipants.length > 0 && (
          <div className="spotlight-sidebar">
            {otherParticipants.map(participant => renderParticipantTile(participant))}
          </div>
        )}

        <div className="layout-controls">
          <button
            className="layout-button"
            onClick={() =>
              onLayoutChange({
                ...layoutConfig,
                type: 'grid',
              })
            }
            title="Grid layout"
          >
            ⊞
          </button>
        </div>
      </div>
    );
  }

  // Render sidebar layout
  if (layoutConfig.type === 'sidebar') {
    const [mainParticipant, ...sidebarParticipants] = participants;

    return (
      <div className={`video-grid sidebar-layout ${isPictureInPicture ? 'pip-mode' : ''}`}>
        <div className="sidebar-main">
          {mainParticipant && renderParticipantTile(mainParticipant)}
        </div>

        <div className="sidebar-participants">
          {sidebarParticipants.map(participant => renderParticipantTile(participant))}
        </div>

        <div className="layout-controls">
          <button
            className="layout-button"
            onClick={() =>
              onLayoutChange({
                ...layoutConfig,
                type: 'grid',
              })
            }
            title="Grid layout"
          >
            ⊞
          </button>
        </div>
      </div>
    );
  }

  return null;
};
