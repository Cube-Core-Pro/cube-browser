/**
 * Equalizer Component - Audio equalizer controls
 * CUBE Nexum Platform v2.0
 */

import React, { useState } from 'react';
import {
  EqualizerSettings,
  EqualizerPreset,
  getEqualizerBands,
} from '../../types/media';
import './Equalizer.css';

interface EqualizerProps {
  settings: EqualizerSettings;
  onUpdate: (settings: EqualizerSettings) => void;
  onClose: () => void;
}

export const Equalizer: React.FC<EqualizerProps> = ({
  settings,
  onUpdate,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const presets: EqualizerPreset[] = [
    'flat',
    'rock',
    'pop',
    'jazz',
    'classical',
    'electronic',
    'bass_boost',
    'treble_boost',
    'vocal_boost',
    'custom',
  ];

  const handlePresetChange = (preset: EqualizerPreset) => {
    const bands = getEqualizerBands(preset);
    setLocalSettings({
      ...localSettings,
      preset,
      bands,
    });
  };

  const handleBandChange = (index: number, gain: number) => {
    const newBands = [...localSettings.bands];
    newBands[index] = { ...newBands[index], gain };
    setLocalSettings({
      ...localSettings,
      preset: 'custom',
      bands: newBands,
    });
  };

  const handleToggle = () => {
    setLocalSettings({
      ...localSettings,
      enabled: !localSettings.enabled,
    });
  };

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  const handleReset = () => {
    handlePresetChange('flat');
  };

  return (
    <div className="equalizer-overlay" onClick={onClose}>
      <div className="equalizer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="equalizer-header">
          <h2>Equalizer</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="equalizer-content">
          <div className="equalizer-controls">
            <div className="toggle-section">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.enabled}
                  onChange={handleToggle}
                />
                <span>Enable Equalizer</span>
              </label>
            </div>

            <div className="preset-section">
              <label htmlFor="equalizer-preset">Preset:</label>
              <select
                id="equalizer-preset"
                title="Seleccionar preset de ecualizador"
                value={localSettings.preset}
                onChange={(e) => handlePresetChange(e.target.value as EqualizerPreset)}
                disabled={!localSettings.enabled}
              >
                {presets.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="equalizer-bands">
            {localSettings.bands.map((band, index) => (
              <div key={index} className="band">
                <input
                  type="range"
                  className="band-slider vertical-slider"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={band.gain}
                  onChange={(e) => handleBandChange(index, parseFloat(e.target.value))}
                  disabled={!localSettings.enabled}
                  title={`Ajustar banda ${band.frequency >= 1000 ? `${band.frequency / 1000}kHz` : `${band.frequency}Hz`}`}
                  aria-label={`Ecualizador ${band.frequency}Hz: ${band.gain}dB`}
                />
                <span className="band-value">{band.gain > 0 ? '+' : ''}{band.gain} dB</span>
                <span className="band-frequency">
                  {band.frequency >= 1000 ? `${band.frequency / 1000}k` : band.frequency} Hz
                </span>
              </div>
            ))}
          </div>

          <div className="equalizer-actions">
            <button onClick={handleReset} disabled={!localSettings.enabled}>
              Reset
            </button>
            <button onClick={handleSave} className="save-btn">
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
