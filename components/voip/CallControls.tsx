import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/services/logger-service';
import {
  CallSession,
  ConnectionState,
  IceConnectionState,
  formatDurationShort,
  getConnectionStateText,
  getIceStateText
} from '../../types/voip';
import './CallControls.css';

const log = logger.scope('CallControls');

interface CallControlsProps {
  session: CallSession;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  session,
  onEndCall,
  onToggleMute,
  onToggleVideo
}) => {
  const [showStats, setShowStats] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Get user media for local preview
  useEffect(() => {
    const getUserMedia = async () => {
      try {
        const constraints = {
          audio: true,
          video: session.type === 'video'
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
      } catch (err) {
        log.error('Failed to get user media:', err);
      }
    };

    getUserMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.type]);

  // Setup video preview
  useEffect(() => {
    if (!localStream || session.type !== 'video') return;

    const videoElement = document.getElementById('local-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.srcObject = localStream;
    }
  }, [localStream, session.type]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { contact, type, direction, start_time: _start_time, duration, state, statistics } = session;
  const { is_muted, is_video_enabled, connection_state, ice_connection_state } = state;

  return (
    <div className="call-controls" data-tour="call-controls">
      <div className="call-header">
        <div className="call-contact-info">
          {contact.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={contact.avatar} alt={contact.name} className="call-avatar" />
          ) : (
            <div className="call-avatar-placeholder">
              {contact.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="call-details">
            <h2 className="call-contact-name">{contact.name}</h2>
            <p className="call-type">
              {type === 'video' ? '📹' : '📞'} {type === 'video' ? 'Video' : 'Audio'} Call
              <span className="call-direction">
                {direction === 'incoming' ? ' (Incoming)' : ' (Outgoing)'}
              </span>
            </p>
          </div>
        </div>

        <div className="call-status">
          <div className="connection-status">
            <span className={`status-dot ${connection_state === 'connected' ? 'connected' : 'connecting'}`} />
            <span className="status-text">
              {getConnectionStateText(connection_state as ConnectionState)}
            </span>
          </div>
          <div className="call-duration">
            <span className="duration-icon">⏱️</span>
            <span className="duration-time">{formatDurationShort(duration)}</span>
          </div>
        </div>
      </div>

      <div className="call-media">
        {type === 'video' ? (
          <div className="video-grid">
            <div className="video-remote">
              <video
                id="remote-video"
                autoPlay
                playsInline
                className="remote-video"
              />
              <div className="video-overlay">
                <span className="video-label">{contact.name}</span>
              </div>
            </div>

            {is_video_enabled && (
              <div className="video-local">
                <video
                  id="local-video"
                  autoPlay
                  playsInline
                  muted
                  className="local-video"
                />
                <div className="video-overlay">
                  <span className="video-label">You</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="audio-visual">
            <div className="audio-avatar">
              {contact.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={contact.avatar} alt={contact.name} />
              ) : (
                <div className="audio-avatar-placeholder">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="audio-waves">
              <div className="wave wave-1"></div>
              <div className="wave wave-2"></div>
              <div className="wave wave-3"></div>
              <div className="wave wave-4"></div>
              <div className="wave wave-5"></div>
            </div>
          </div>
        )}
      </div>

      <div className="call-controls-panel">
        <div className="control-buttons">
          <button
            className={`control-btn ${is_muted ? 'active' : ''}`}
            onClick={onToggleMute}
            title={is_muted ? 'Unmute' : 'Mute'}
            data-tour="mute-control"
          >
            <span className="btn-icon">{is_muted ? '🔇' : '🔊'}</span>
            <span className="btn-label">{is_muted ? 'Unmute' : 'Mute'}</span>
          </button>

          {type === 'video' && (
            <button
              className={`control-btn ${!is_video_enabled ? 'active' : ''}`}
              onClick={onToggleVideo}
              title={is_video_enabled ? 'Turn off video' : 'Turn on video'}
              data-tour="video-control"
            >
              <span className="btn-icon">{is_video_enabled ? '📹' : '📷'}</span>
              <span className="btn-label">{is_video_enabled ? 'Stop Video' : 'Start Video'}</span>
            </button>
          )}

          <button
            className="control-btn"
            onClick={() => setShowStats(!showStats)}
            title="Call statistics"
            data-tour="call-stats"
          >
            <span className="btn-icon">📊</span>
            <span className="btn-label">Stats</span>
          </button>

          <button
            className="control-btn btn-end-call"
            onClick={onEndCall}
            title="End call"
            data-tour="end-call"
          >
            <span className="btn-icon">📵</span>
            <span className="btn-label">End Call</span>
          </button>
        </div>
      </div>

      {showStats && (
        <div className="call-statistics">
          <div className="stats-header">
            <h3>Call Statistics</h3>
            <button className="stats-close" onClick={() => setShowStats(false)}>×</button>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Connection:</span>
              <span className="stat-value">{getConnectionStateText(connection_state as ConnectionState)}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">ICE State:</span>
              <span className="stat-value">{getIceStateText(ice_connection_state as IceConnectionState)}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Duration:</span>
              <span className="stat-value">{formatDurationShort(duration)}</span>
            </div>

            {statistics && (
              <>
                <div className="stat-item">
                  <span className="stat-label">Codec:</span>
                  <span className="stat-value">{statistics.codec}</span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Bitrate:</span>
                  <span className="stat-value">{(statistics.bitrate / 1000).toFixed(1)} Kbps</span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Packet Loss:</span>
                  <span className="stat-value">
                    {statistics.packets_received > 0
                      ? ((statistics.packets_lost / (statistics.packets_received + statistics.packets_lost)) * 100).toFixed(2)
                      : '0.00'}%
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Jitter:</span>
                  <span className="stat-value">{statistics.jitter.toFixed(1)} ms</span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">RTT:</span>
                  <span className="stat-value">{statistics.rtt} ms</span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Bytes Sent:</span>
                  <span className="stat-value">{(statistics.bytes_sent / 1024).toFixed(1)} KB</span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Bytes Received:</span>
                  <span className="stat-value">{(statistics.bytes_received / 1024).toFixed(1)} KB</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
