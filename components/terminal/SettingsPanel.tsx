/**
 * Settings Panel Component - Terminal settings configuration
 * CUBE Nexum Platform v2.0
 */

import React, { useState } from 'react';
import {
  TerminalSettings,
  TerminalTheme,
  ShellType,
  getShellDisplayName,
} from '../../types/terminal';
import './SettingsPanel.css';

interface SettingsPanelProps {
  settings: TerminalSettings;
  onUpdate: (settings: Partial<TerminalSettings>) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdate,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleUpdate = (key: keyof TerminalSettings, value: unknown) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  const themes: TerminalTheme[] = ['dark', 'light', 'monokai', 'solarized', 'dracula', 'nord'];
  const shells: ShellType[] = ['bash', 'zsh', 'fish', 'powershell', 'cmd'];
  const cursorStyles: Array<'block' | 'underline' | 'bar'> = ['block', 'underline', 'bar'];

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Terminal Settings</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>Appearance</h3>

            <div className="setting-item">
              <label id="theme-label">Theme</label>
              <select
                value={localSettings.theme}
                onChange={(e) => handleUpdate('theme', e.target.value as TerminalTheme)}
                aria-labelledby="theme-label"
                title="Select terminal theme"
              >
                {themes.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-item">
              <label>Font Family</label>
              <input
                type="text"
                value={localSettings.font_family}
                onChange={(e) => handleUpdate('font_family', e.target.value)}
                title="Font family name"
                placeholder="e.g., Monaco, Consolas"
              />
            </div>

            <div className="setting-item">
              <label>Font Size</label>
              <input
                type="number"
                min="8"
                max="32"
                value={localSettings.font_size}
                onChange={(e) => handleUpdate('font_size', parseInt(e.target.value))}
                title="Font size in pixels (8-32)"
                aria-label="Font size"
              />
            </div>

            <div className="setting-item">
              <label>Line Height</label>
              <input
                type="number"
                min="1"
                max="3"
                step="0.1"
                value={localSettings.line_height}
                onChange={(e) => handleUpdate('line_height', parseFloat(e.target.value))}
                title="Line height multiplier (1-3)"
                aria-label="Line height"
              />
            </div>

            <div className="setting-item">
              <label id="cursor-label">Cursor Style</label>
              <select
                value={localSettings.cursor_style}
                onChange={(e) => handleUpdate('cursor_style', e.target.value as 'block' | 'underline' | 'bar')}
                aria-labelledby="cursor-label"
                title="Select cursor style"
              >
                {cursorStyles.map((style) => (
                  <option key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.cursor_blink}
                  onChange={(e) => handleUpdate('cursor_blink', e.target.checked)}
                />
                Cursor Blink
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h3>Behavior</h3>

            <div className="setting-item">
              <label>Default Shell</label>
              <select
                value={localSettings.default_shell}
                onChange={(e) => handleUpdate('default_shell', e.target.value as ShellType)}
                title="Select default shell"
                aria-label="Default shell"
              >
                {shells.map((shell) => (
                  <option key={shell} value={shell}>
                    {getShellDisplayName(shell)}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-item">
              <label>Scrollback Lines</label>
              <input
                type="number"
                min="100"
                max="100000"
                step="1000"
                value={localSettings.scrollback_lines}
                onChange={(e) => handleUpdate('scrollback_lines', parseInt(e.target.value))}
                title="Number of scrollback lines (100-100000)"
                aria-label="Scrollback lines"
              />
            </div>

            <div className="setting-item">
              <label>Scroll Sensitivity</label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={localSettings.scroll_sensitivity}
                onChange={(e) => handleUpdate('scroll_sensitivity', parseFloat(e.target.value))}
                title="Scroll sensitivity (0.1-10)"
                aria-label="Scroll sensitivity"
              />
            </div>

            <div className="setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.copy_on_select}
                  onChange={(e) => handleUpdate('copy_on_select', e.target.checked)}
                />
                Copy on Select
              </label>
            </div>

            <div className="setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.paste_on_right_click}
                  onChange={(e) => handleUpdate('paste_on_right_click', e.target.checked)}
                />
                Paste on Right Click
              </label>
            </div>

            <div className="setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.confirm_close_tab}
                  onChange={(e) => handleUpdate('confirm_close_tab', e.target.checked)}
                />
                Confirm Close Tab
              </label>
            </div>

            <div className="setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={localSettings.shell_integration}
                  onChange={(e) => handleUpdate('shell_integration', e.target.checked)}
                />
                Shell Integration
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
