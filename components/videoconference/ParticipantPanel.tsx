'use client';

import React, { useState, useMemo } from 'react';
import {
  Participant,
  sortParticipants,
  getRoleDisplayName,
  getRoleColor,
  getConnectionQualityText,
  getConnectionQualityColor,
  formatTimestamp,
  formatBitrate,
} from '../../types/videoconference';
import './ParticipantPanel.css';

interface ParticipantPanelProps {
  participants: Participant[];
  currentParticipant: Participant | null;
  onClose: () => void;
}

export const ParticipantPanel: React.FC<ParticipantPanelProps> = ({
  participants,
  currentParticipant,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Filter and sort participants
  const filteredParticipants = useMemo(() => {
    const filtered = participants.filter(p =>
      p.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return sortParticipants(filtered);
  }, [participants, searchQuery]);

  // Get participant counts by role
  const roleCounts = useMemo(() => {
    const counts = { Host: 0, Moderator: 0, Participant: 0, Guest: 0 };
    participants.forEach(p => {
      counts[p.role]++;
    });
    return counts;
  }, [participants]);

  return (
    <div className="participant-panel">
      <div className="panel-header">
        <h3>Participants ({participants.length})</h3>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-search">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search participants..."
        />
      </div>

      <div className="role-summary">
        {roleCounts.Host > 0 && (
          <div className="role-count host">
            <span className="count">{roleCounts.Host}</span>
            <span className="label">Host</span>
          </div>
        )}
        {roleCounts.Moderator > 0 && (
          <div className="role-count moderator">
            <span className="count">{roleCounts.Moderator}</span>
            <span className="label">Moderator</span>
          </div>
        )}
        {roleCounts.Participant > 0 && (
          <div className="role-count participant">
            <span className="count">{roleCounts.Participant}</span>
            <span className="label">Participants</span>
          </div>
        )}
        {roleCounts.Guest > 0 && (
          <div className="role-count guest">
            <span className="count">{roleCounts.Guest}</span>
            <span className="label">Guests</span>
          </div>
        )}
      </div>

      <div className="participant-list">
        {filteredParticipants.map(participant => {
          const isCurrentUser = participant.participant_id === currentParticipant?.participant_id;
          const roleColor = getRoleColor(participant.role);
          const qualityColor = getConnectionQualityColor(participant.connection_quality);

          return (
            <div
              key={participant.participant_id}
              className={`participant-item ${isCurrentUser ? 'current-user' : ''}`}
              onClick={() => setSelectedParticipant(participant)}
            >
              <div className="participant-avatar">
                <div className="avatar-circle" style={{ backgroundColor: roleColor }}>
                  {participant.display_name.charAt(0).toUpperCase()}
                </div>
                {participant.is_video_enabled ? (
                  <div className="status-indicator video">📹</div>
                ) : (
                  <div className="status-indicator no-video">📹</div>
                )}
              </div>

              <div className="participant-info">
                <div className="participant-name">
                  {participant.display_name}
                  {isCurrentUser && <span className="you-badge">(You)</span>}
                </div>
                <div className="participant-meta">
                  <span className="role-badge" style={{ color: roleColor }}>
                    {getRoleDisplayName(participant.role)}
                  </span>
                  <span className="separator">•</span>
                  <span className="joined-time">
                    {formatTimestamp(participant.joined_at)}
                  </span>
                </div>
              </div>

              <div className="participant-status">
                {participant.hand_raised && (
                  <div className="status-icon hand-raised" title="Hand raised">
                    ✋
                  </div>
                )}
                {participant.is_screen_sharing && (
                  <div className="status-icon screen-sharing" title="Sharing screen">
                    🖥️
                  </div>
                )}
                {participant.is_audio_muted ? (
                  <div className="status-icon muted" title="Muted">
                    🔇
                  </div>
                ) : (
                  <div className="status-icon unmuted" title="Unmuted">
                    🔊
                  </div>
                )}
                <div
                  className="connection-indicator"
                  style={{ backgroundColor: qualityColor }}
                  title={`Connection: ${getConnectionQualityText(participant.connection_quality)}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {filteredParticipants.length === 0 && (
        <div className="empty-state">
          <p>No participants found</p>
        </div>
      )}

      {selectedParticipant && (
        <div className="participant-detail-modal" onClick={() => setSelectedParticipant(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedParticipant.display_name}</h3>
              <button
                className="close-button"
                onClick={() => setSelectedParticipant(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Role:</span>
                  <span className="detail-value">
                    {getRoleDisplayName(selectedParticipant.role)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Joined:</span>
                  <span className="detail-value">
                    {new Date(selectedParticipant.joined_at).toLocaleString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Connection:</span>
                  <span
                    className="detail-value"
                    style={{
                      color: getConnectionQualityColor(selectedParticipant.connection_quality),
                    }}
                  >
                    {getConnectionQualityText(selectedParticipant.connection_quality)} (
                    {selectedParticipant.connection_quality}%)
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <div className="section-header">
                  <h4>Network Statistics</h4>
                  <button
                    className="toggle-button"
                    onClick={() => setShowStats(!showStats)}
                  >
                    {showStats ? '▼' : '▶'}
                  </button>
                </div>
                {showStats && (
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Packets Sent:</span>
                      <span className="stat-value">
                        {selectedParticipant.stats.packets_sent.toLocaleString()}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Packets Received:</span>
                      <span className="stat-value">
                        {selectedParticipant.stats.packets_received.toLocaleString()}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Bytes Sent:</span>
                      <span className="stat-value">
                        {(selectedParticipant.stats.bytes_sent / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Bytes Received:</span>
                      <span className="stat-value">
                        {(selectedParticipant.stats.bytes_received / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Packet Loss:</span>
                      <span className="stat-value">
                        {selectedParticipant.stats.packet_loss.toFixed(2)}%
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">RTT:</span>
                      <span className="stat-value">
                        {selectedParticipant.stats.rtt_ms} ms
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Jitter:</span>
                      <span className="stat-value">
                        {selectedParticipant.stats.jitter_ms} ms
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Bitrate:</span>
                      <span className="stat-value">
                        {formatBitrate(selectedParticipant.stats.bitrate)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h4>Status</h4>
                <div className="status-badges">
                  <div className={`status-badge ${selectedParticipant.is_audio_muted ? 'inactive' : 'active'}`}>
                    {selectedParticipant.is_audio_muted ? '🔇 Muted' : '🔊 Unmuted'}
                  </div>
                  <div className={`status-badge ${selectedParticipant.is_video_enabled ? 'active' : 'inactive'}`}>
                    {selectedParticipant.is_video_enabled ? '📹 Video On' : '📹 Video Off'}
                  </div>
                  {selectedParticipant.is_screen_sharing && (
                    <div className="status-badge active">
                      🖥️ Sharing Screen
                    </div>
                  )}
                  {selectedParticipant.hand_raised && (
                    <div className="status-badge active">
                      ✋ Hand Raised
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
