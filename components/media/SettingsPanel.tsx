/**
 * Settings Panel Component - Media player settings
 * CUBE Nexum Platform v2.0
 */

import React, { useState } from 'react';
import { PlayerSettings } from '../../types/media';
import './SettingsPanel.css';

interface SettingsPanelProps {
  settings: PlayerSettings;
  onUpdate: (settings: Partial<PlayerSettings>) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdate,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleUpdate = (key: keyof PlayerSettings, value: unknown) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Player Settings</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>Playback</h3>

            <div className="setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.auto_play}
                  onChange={(e) => handleUpdate('auto_play', e.target.checked)}
                />
                Auto-play when media loads
              </label>
            </div>

            <div className="setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.auto_play_next}
                  onChange={(e) => handleUpdate('auto_play_next', e.target.checked)}
                />
                Auto-play next item
              </label>
            </div>

            <div className="setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.remember_position}
                  onChange={(e) => handleUpdate('remember_position', e.target.checked)}
                />
                Remember playback position
              </label>
            </div>

            <div className="setting-item">
              <label>Skip Forward (seconds)</label>
              <input
                type="number"
                min="5"
                max="60"
                value={localSettings.skip_forward_seconds}
                onChange={(e) => handleUpdate('skip_forward_seconds', parseInt(e.target.value))}
              />
            </div>

            <div className="setting-item">
              <label>Skip Backward (seconds)</label>
              <input
                type="number"
                min="5"
                max="60"
                value={localSettings.skip_backward_seconds}
                onChange={(e) => handleUpdate('skip_backward_seconds', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="settings-section">
            <h3>Audio</h3>

            <div className="setting-item">
              <label>Default Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localSettings.default_volume}
                onChange={(e) => handleUpdate('default_volume', parseFloat(e.target.value))}
              />
              <span>{Math.round(localSettings.default_volume * 100)}%</span>
            </div>
          </div>

          <div className="settings-section">
            <h3>Subtitles</h3>

            <div className="setting-item">
              <label>Font Size</label>
              <input
                type="number"
                min="12"
                max="32"
                value={localSettings.subtitle_font_size}
                onChange={(e) => handleUpdate('subtitle_font_size', parseInt(e.target.value))}
              />
            </div>

            <div className="setting-item">
              <label>Text Color</label>
              <input
                type="color"
                value={localSettings.subtitle_color}
                onChange={(e) => handleUpdate('subtitle_color', e.target.value)}
              />
            </div>

            <div className="setting-item">
              <label>Background Color</label>
              <input
                type="color"
                value={localSettings.subtitle_background_color}
                onChange={(e) => handleUpdate('subtitle_background_color', e.target.value)}
              />
            </div>
          </div>

          <div className="settings-section">
            <h3>Advanced</h3>

            <div className="setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.visualizer_enabled}
                  onChange={(e) => handleUpdate('visualizer_enabled', e.target.checked)}
                />
                Enable visualizer
              </label>
            </div>

            <div className="setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.mini_player_enabled}
                  onChange={(e) => handleUpdate('mini_player_enabled', e.target.checked)}
                />
                Enable mini player
              </label>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
