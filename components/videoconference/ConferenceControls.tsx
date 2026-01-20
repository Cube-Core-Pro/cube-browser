'use client';

import React, { useState, useCallback } from 'react';
import './ConferenceControls.css';

interface ConferenceControlsProps {
  isAudioMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  handRaised: boolean;
  isRecording: boolean;
  isHost: boolean;
  isFullscreen?: boolean;
  isPictureInPicture?: boolean;
  participantCount?: number;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onLeave: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  onToggleSettings: () => void;
  onToggleFullscreen?: () => void;
  onTogglePictureInPicture?: () => void;
  onShareScreen?: (type: 'screen' | 'window' | 'tab') => void;
}

export const ConferenceControls: React.FC<ConferenceControlsProps> = ({
  isAudioMuted,
  isVideoEnabled,
  isScreenSharing,
  handRaised,
  isRecording,
  isHost,
  isFullscreen = false,
  isPictureInPicture = false,
  participantCount = 1,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHand,
  onStartRecording,
  onStopRecording,
  onLeave,
  onToggleParticipants,
  onToggleChat,
  onToggleSettings,
  onToggleFullscreen,
  onTogglePictureInPicture,
  onShareScreen,
}) => {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const handleLeaveClick = useCallback(() => {
    setShowLeaveConfirm(true);
  }, []);

  const handleConfirmLeave = useCallback(() => {
    onLeave();
    setShowLeaveConfirm(false);
  }, [onLeave]);

  const handleCancelLeave = useCallback(() => {
    setShowLeaveConfirm(false);
  }, []);

  const handleShareClick = useCallback(() => {
    if (isScreenSharing) {
      onToggleScreenShare();
    } else {
      setShowShareOptions(true);
    }
  }, [isScreenSharing, onToggleScreenShare]);

  const handleShareOption = useCallback((type: 'screen' | 'window' | 'tab') => {
    setShowShareOptions(false);
    if (onShareScreen) {
      onShareScreen(type);
    } else {
      onToggleScreenShare();
    }
  }, [onShareScreen, onToggleScreenShare]);

  return (
    <div className="conference-controls">
      {/* Main Controls Group */}
      <div className="controls-group main-controls">
        {/* Audio control */}
        <button
          className={`control-button ${isAudioMuted ? 'danger' : 'active-state'}`}
          onClick={onToggleAudio}
          title={isAudioMuted ? 'Unmute (Alt+A)' : 'Mute (Alt+A)'}
          aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          <span className="control-icon">
            {isAudioMuted ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </span>
          <span className="control-label">
            {isAudioMuted ? 'Unmute' : 'Mute'}
          </span>
        </button>

        {/* Video control */}
        <button
          className={`control-button ${!isVideoEnabled ? 'danger' : 'active-state'}`}
          onClick={onToggleVideo}
          title={isVideoEnabled ? 'Stop video (Alt+V)' : 'Start video (Alt+V)'}
          aria-label={isVideoEnabled ? 'Stop camera' : 'Start camera'}
        >
          <span className="control-icon">
            {isVideoEnabled ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
              </svg>
            )}
          </span>
          <span className="control-label">
            {isVideoEnabled ? 'Stop Video' : 'Start Video'}
          </span>
        </button>

        {/* Screen share control with dropdown */}
        <div className="control-with-dropdown">
          <button
            className={`control-button ${isScreenSharing ? 'sharing' : ''}`}
            onClick={handleShareClick}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen (Alt+S)'}
            aria-label={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
          >
            <span className="control-icon">
              {isScreenSharing ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                  <path d="M9 10l2 2 4-4" stroke="#22c55e" strokeWidth="2.5" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              )}
            </span>
            <span className="control-label">
              {isScreenSharing ? 'Stop Share' : 'Share'}
            </span>
          </button>
          
          {/* Share options dropdown */}
          {showShareOptions && (
            <div className="share-dropdown">
              <div className="dropdown-header">Share your screen</div>
              <button className="dropdown-item" onClick={() => handleShareOption('screen')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <div className="dropdown-item-content">
                  <span>Entire Screen</span>
                  <span className="dropdown-hint">Share everything on your screen</span>
                </div>
              </button>
              <button className="dropdown-item" onClick={() => handleShareOption('window')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <circle cx="6" cy="6" r="1" fill="currentColor" />
                  <circle cx="9" cy="6" r="1" fill="currentColor" />
                </svg>
                <div className="dropdown-item-content">
                  <span>Application Window</span>
                  <span className="dropdown-hint">Share a specific app window</span>
                </div>
              </button>
              <button className="dropdown-item" onClick={() => handleShareOption('tab')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <div className="dropdown-item-content">
                  <span>Browser Tab</span>
                  <span className="dropdown-hint">Share a Chrome tab with audio</span>
                </div>
              </button>
              <button className="dropdown-close" onClick={() => setShowShareOptions(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Raise hand control */}
        <button
          className={`control-button ${handRaised ? 'hand-raised' : ''}`}
          onClick={onToggleHand}
          title={handRaised ? 'Lower hand' : 'Raise hand (Alt+H)'}
          aria-label={handRaised ? 'Lower hand' : 'Raise hand'}
        >
          <span className="control-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
              <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
              <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
            </svg>
          </span>
          <span className="control-label">
            {handRaised ? 'Lower' : 'Raise'}
          </span>
        </button>

        {/* Recording control (host only) */}
        {isHost && (
          <button
            className={`control-button ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? onStopRecording : onStartRecording}
            title={isRecording ? 'Stop recording' : 'Start recording (Alt+R)'}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <span className="control-icon">
              {isRecording ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="6" width="12" height="12" rx="2" fill="#ef4444" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" fill="currentColor" />
                </svg>
              )}
            </span>
            <span className="control-label">
              {isRecording ? 'Stop Rec' : 'Record'}
            </span>
            {isRecording && <span className="recording-dot" />}
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="controls-divider" />

      {/* Secondary Controls Group */}
      <div className="controls-group secondary-controls">
        {/* Participants panel */}
        <button
          className="control-button"
          onClick={onToggleParticipants}
          title="Participants"
          aria-label="Toggle participants panel"
        >
          <span className="control-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span className="control-label">People</span>
          {participantCount > 1 && (
            <span className="participant-badge">{participantCount}</span>
          )}
        </button>

        {/* Chat panel */}
        <button
          className="control-button"
          onClick={onToggleChat}
          title="Chat"
          aria-label="Toggle chat panel"
        >
          <span className="control-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span className="control-label">Chat</span>
        </button>

        {/* Fullscreen */}
        {onToggleFullscreen && (
          <button
            className={`control-button ${isFullscreen ? 'active-state' : ''}`}
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen (Alt+F)'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <span className="control-icon">
              {isFullscreen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </span>
            <span className="control-label">
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </span>
          </button>
        )}

        {/* Picture-in-Picture */}
        {onTogglePictureInPicture && (
          <button
            className={`control-button ${isPictureInPicture ? 'active-state' : ''}`}
            onClick={onTogglePictureInPicture}
            title={isPictureInPicture ? 'Exit mini view' : 'Mini view (Alt+P)'}
            aria-label={isPictureInPicture ? 'Exit picture-in-picture' : 'Enter picture-in-picture'}
          >
            <span className="control-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <rect x="12" y="9" width="8" height="6" rx="1" fill={isPictureInPicture ? 'currentColor' : 'none'} />
              </svg>
            </span>
            <span className="control-label">Mini</span>
          </button>
        )}

        {/* More options */}
        <div className="control-with-dropdown">
          <button
            className="control-button"
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            title="More options"
            aria-label="More options"
          >
            <span className="control-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" fill="currentColor" />
                <circle cx="19" cy="12" r="1" fill="currentColor" />
                <circle cx="5" cy="12" r="1" fill="currentColor" />
              </svg>
            </span>
            <span className="control-label">More</span>
          </button>

          {showMoreOptions && (
            <div className="more-dropdown">
              <button className="dropdown-item" onClick={() => { onToggleSettings(); setShowMoreOptions(false); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Settings</span>
              </button>
              <button className="dropdown-item" onClick={() => setShowMoreOptions(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy invite link</span>
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => setShowMoreOptions(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Help & Support</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="controls-divider" />

      {/* Leave Button */}
      <div className="controls-group leave-group">
        <button
          className="control-button leave-button"
          onClick={handleLeaveClick}
          title="Leave conference"
          aria-label="Leave conference"
        >
          <span className="control-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)" />
            </svg>
          </span>
          <span className="control-label">Leave</span>
        </button>
      </div>

      {/* Leave confirmation modal */}
      {showLeaveConfirm && (
        <div className="leave-confirm-modal" onClick={handleCancelLeave}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h3>Leave Conference?</h3>
            <p>Are you sure you want to leave? You can rejoin anytime using the access code.</p>
            <div className="modal-buttons">
              <button className="cancel-button" onClick={handleCancelLeave}>
                Cancel
              </button>
              <button className="confirm-button" onClick={handleConfirmLeave}>
                Leave Conference
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showShareOptions || showMoreOptions) && (
        <div 
          className="dropdown-backdrop" 
          onClick={() => {
            setShowShareOptions(false);
            setShowMoreOptions(false);
          }} 
        />
      )}
    </div>
  );
};
