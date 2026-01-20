/**
 * Visualizer Component - Audio visualization
 * CUBE Nexum Platform v2.0
 */

import React from 'react';
import {
  VisualizerSettings,
  VisualizerType,
} from '../../types/media';
import './Visualizer.css';

interface VisualizerProps {
  settings: VisualizerSettings;
  onUpdate: (settings: VisualizerSettings) => void;
  onClose: () => void;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  settings,
  onUpdate,
  onClose,
}) => {
  const types: VisualizerType[] = ['bars', 'wave', 'circular', 'particles', 'spectrum'];

  const handleTypeChange = (type: VisualizerType) => {
    onUpdate({ ...settings, type });
  };

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...settings.colors];
    newColors[index] = color;
    onUpdate({ ...settings, colors: newColors });
  };

  const handleSmoothnessChange = (smoothness: number) => {
    onUpdate({ ...settings, smoothness });
  };

  const handleIntensityChange = (intensity: number) => {
    onUpdate({ ...settings, intensity });
  };

  return (
    <div className="visualizer-overlay" onClick={onClose}>
      <div className="visualizer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="visualizer-header">
          <h2>Visualizer Settings</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="visualizer-content">
          <div className="setting-group">
            <label>Type</label>
            <div className="type-buttons">
              {types.map((type) => (
                <button
                  key={type}
                  className={`type-btn ${settings.type === type ? 'active' : ''}`}
                  onClick={() => handleTypeChange(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <label>Colors</label>
            <div className="color-inputs">
              {settings.colors.map((color, index) => (
                <div key={index} className="color-input">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                  />
                  <span>{color}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <label>Smoothness: {settings.smoothness.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.smoothness}
              onChange={(e) => handleSmoothnessChange(parseFloat(e.target.value))}
            />
          </div>

          <div className="setting-group">
            <label>Intensity: {settings.intensity.toFixed(2)}</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={settings.intensity}
              onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
