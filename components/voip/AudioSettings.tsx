import React, { useState } from 'react';
import { logger } from '@/lib/services/logger-service';
import {
  VoIPConfig,
  AudioDevice,
  AudioCodec,
  VideoCodec,
  getCodecDisplayName
} from '../../types/voip';
import './AudioSettings.css';

const log = logger.scope('AudioSettings');

interface AudioSettingsProps {
  config: VoIPConfig;
  devices: AudioDevice[];
  onUpdateConfig: (config: Partial<VoIPConfig>) => void;
  onRefreshDevices: () => void;
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({
  config,
  devices,
  onUpdateConfig,
  onRefreshDevices
}) => {
  const [editing, setEditing] = useState(false);
  const [editedConfig, setEditedConfig] = useState<VoIPConfig>(config);
  const [saving, setSaving] = useState(false);
  const [refreshingDevices, setRefreshingDevices] = useState(false);
  const [newIceServer, setNewIceServer] = useState('');

  const inputDevices = devices.filter(d => d.type === 'input');
  const outputDevices = devices.filter(d => d.type === 'output');

  const handleEdit = () => {
    setEditedConfig(config);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditedConfig(config);
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateConfig(editedConfig);
      setEditing(false);
    } catch (err) {
      log.error('Failed to save config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshDevices = async () => {
    setRefreshingDevices(true);
    await onRefreshDevices();
    setTimeout(() => setRefreshingDevices(false), 500);
  };

  const handleAddIceServer = () => {
    if (!newIceServer.trim()) return;
    
    setEditedConfig(prev => ({
      ...prev,
      ice_servers: [...prev.ice_servers, newIceServer.trim()]
    }));
    setNewIceServer('');
  };

  const handleRemoveIceServer = (index: number) => {
    setEditedConfig(prev => ({
      ...prev,
      ice_servers: prev.ice_servers.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="audio-settings" data-tour="audio-settings">
      <div className="settings-header">
        <h2>
          <span className="header-icon">⚙️</span>
          VoIP Settings
        </h2>
        {!editing ? (
          <button className="btn-edit" onClick={handleEdit}>
            ✏️ Edit
          </button>
        ) : (
          <div className="edit-actions">
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? '💾 Saving...' : '💾 Save'}
            </button>
            <button className="btn-cancel" onClick={handleCancel}>
              ❌ Cancel
            </button>
          </div>
        )}
      </div>

      <div className="settings-sections">
        {/* Audio Devices */}
        <section className="settings-section" data-tour="audio-devices">
          <div className="section-header">
            <h3>
              <span className="section-icon">🎤</span>
              Audio Devices
            </h3>
            <button
              className={`btn-refresh-small ${refreshingDevices ? 'refreshing' : ''}`}
              onClick={handleRefreshDevices}
              disabled={refreshingDevices}
            >
              🔄
            </button>
          </div>

          <div className="device-groups">
            <div className="device-group">
              <h4>Input Devices (Microphones)</h4>
              <div className="device-list">
                {inputDevices.length === 0 ? (
                  <p className="no-devices">No input devices found</p>
                ) : (
                  inputDevices.map(device => (
                    <div key={device.id} className="device-item">
                      <span className="device-icon">🎤</span>
                      <span className="device-name">{device.name}</span>
                      {device.is_default && (
                        <span className="device-badge">Default</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="device-group">
              <h4>Output Devices (Speakers)</h4>
              <div className="device-list">
                {outputDevices.length === 0 ? (
                  <p className="no-devices">No output devices found</p>
                ) : (
                  outputDevices.map(device => (
                    <div key={device.id} className="device-item">
                      <span className="device-icon">🔊</span>
                      <span className="device-name">{device.name}</span>
                      {device.is_default && (
                        <span className="device-badge">Default</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Media Settings */}
        <section className="settings-section" data-tour="codec-settings">
          <h3>
            <span className="section-icon">📹</span>
            Media Settings
          </h3>

          <div className="setting-item">
            <div className="setting-label">
              <label id="enable-audio-label">Enable Audio</label>
              <p className="setting-description">Allow audio during calls</p>
            </div>
            {editing ? (
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={editedConfig.enable_audio}
                  onChange={(e) => setEditedConfig(prev => ({
                    ...prev,
                    enable_audio: e.target.checked
                  }))}
                  title="Toggle audio"
                  aria-labelledby="enable-audio-label"
                />
                <span className="toggle-slider"></span>
              </label>
            ) : (
              <span className={`status-badge ${config.enable_audio ? 'enabled' : 'disabled'}`}>
                {config.enable_audio ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <label id="enable-video-label">Enable Video</label>
              <p className="setting-description">Allow video during calls</p>
            </div>
            {editing ? (
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={editedConfig.enable_video}
                  onChange={(e) => setEditedConfig(prev => ({
                    ...prev,
                    enable_video: e.target.checked
                  }))}
                  title="Toggle video"
                  aria-labelledby="enable-video-label"
                />
                <span className="toggle-slider"></span>
              </label>
            ) : (
              <span className={`status-badge ${config.enable_video ? 'enabled' : 'disabled'}`}>
                {config.enable_video ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>
        </section>

        {/* Codec Settings */}
        <section className="settings-section">
          <h3>
            <span className="section-icon">🎵</span>
            Codec Settings
          </h3>

          <div className="setting-item">
            <div className="setting-label">
              <label id="audio-codec-label">Audio Codec</label>
              <p className="setting-description">Codec for audio encoding</p>
            </div>
            {editing ? (
              <select
                className="codec-select"
                value={editedConfig.audio_codec}
                onChange={(e) => setEditedConfig(prev => ({
                  ...prev,
                  audio_codec: e.target.value as AudioCodec
                }))}
                aria-labelledby="audio-codec-label"
                title="Select audio codec"
              >
                <option value="Opus">Opus (Recommended)</option>
                <option value="PCMU">PCMU (G.711 μ-law)</option>
                <option value="PCMA">PCMA (G.711 A-law)</option>
              </select>
            ) : (
              <span className="codec-badge">{getCodecDisplayName(config.audio_codec)}</span>
            )}
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <label>Video Codec</label>
              <p className="setting-description">Codec for video encoding</p>
            </div>
            {editing ? (
              <select
                className="codec-select"
                value={editedConfig.video_codec}
                onChange={(e) => setEditedConfig(prev => ({
                  ...prev,
                  video_codec: e.target.value as VideoCodec
                }))}
                title="Select video codec"
                aria-label="Select video codec"
              >
                <option value="VP8">VP8 (Recommended)</option>
                <option value="VP9">VP9 (Better quality)</option>
                <option value="H264">H.264 (Compatibility)</option>
                <option value="AV1">AV1 (Experimental)</option>
              </select>
            ) : (
              <span className="codec-badge">{getCodecDisplayName(config.video_codec)}</span>
            )}
          </div>
        </section>

        {/* ICE Servers */}
        <section className="settings-section" data-tour="turn-servers">
          <h3>
            <span className="section-icon">🌐</span>
            ICE Servers (STUN/TURN)
          </h3>

          <div className="ice-servers-list">
            {(editing ? editedConfig : config).ice_servers.map((server, index) => (
              <div key={index} className="ice-server-item">
                <span className="server-icon">🌐</span>
                <span className="server-url">{server}</span>
                {editing && (
                  <button
                    className="btn-remove-server"
                    onClick={() => handleRemoveIceServer(index)}
                    title="Remove server"
                  >
                    ❌
                  </button>
                )}
              </div>
            ))}
          </div>

          {editing && (
            <div className="add-server-form">
              <input
                type="text"
                placeholder="stun:stun.example.com:19302"
                value={newIceServer}
                onChange={(e) => setNewIceServer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddIceServer()}
              />
              <button
                className="btn-add-server"
                onClick={handleAddIceServer}
                disabled={!newIceServer.trim()}
              >
                ➕ Add
              </button>
            </div>
          )}

          <div className="ice-server-info">
            <p>
              <strong>STUN servers</strong> help discover your public IP address for peer-to-peer connections.
            </p>
            <p>
              <strong>TURN servers</strong> relay media when direct connections fail (requires authentication).
            </p>
          </div>
        </section>

        {/* Connection Info */}
        <section className="settings-section">
          <h3>
            <span className="section-icon">ℹ️</span>
            Connection Information
          </h3>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Protocol:</span>
              <span className="info-value">WebRTC</span>
            </div>
            <div className="info-item">
              <span className="info-label">Transport:</span>
              <span className="info-value">UDP/TCP</span>
            </div>
            <div className="info-item">
              <span className="info-label">Encryption:</span>
              <span className="info-value">DTLS-SRTP</span>
            </div>
            <div className="info-item">
              <span className="info-label">Signaling:</span>
              <span className="info-value">SDP Offer/Answer</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
