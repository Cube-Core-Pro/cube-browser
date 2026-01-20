/**
 * Settings Panel Component - Download manager settings
 * CUBE Nexum Platform v2.0
 */

import React, { useState } from 'react';
import {
  DownloadSettings,
  BandwidthLimit,
  BandwidthSchedule,
  generateDownloadId,
} from '../../types/download';
import './SettingsPanel.css';

interface SettingsPanelProps {
  settings: DownloadSettings;
  bandwidthLimit: BandwidthLimit;
  onSettingsUpdate: (settings: DownloadSettings) => void;
  onBandwidthUpdate: (limit: BandwidthLimit) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  bandwidthLimit,
  onSettingsUpdate,
  onBandwidthUpdate,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [localBandwidth, setLocalBandwidth] = useState(bandwidthLimit);
  const [activeTab, setActiveTab] = useState<'general' | 'bandwidth'>('general');

  const handleSave = () => {
    onSettingsUpdate(localSettings);
    onBandwidthUpdate(localBandwidth);
    onClose();
  };

  const handleAddSchedule = () => {
    const newSchedule: BandwidthSchedule = {
      id: generateDownloadId(),
      start_time: '00:00',
      end_time: '23:59',
      days: [0, 1, 2, 3, 4, 5, 6],
      limit: 1048576, // 1 MB/s
    };

    setLocalBandwidth((prev) => ({
      ...prev,
      schedule: [...(prev.schedule || []), newSchedule],
    }));
  };

  const handleRemoveSchedule = (id: string) => {
    setLocalBandwidth((prev) => ({
      ...prev,
      schedule: prev.schedule?.filter((s) => s.id !== id) || [],
    }));
  };

  const handleScheduleUpdate = (
    id: string,
    updates: Partial<BandwidthSchedule>
  ) => {
    setLocalBandwidth((prev) => ({
      ...prev,
      schedule: prev.schedule?.map((s) => (s.id === id ? { ...s, ...updates } : s)) || [],
    }));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel-download" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>Download Settings</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="panel-tabs">
          <button
            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`tab ${activeTab === 'bandwidth' ? 'active' : ''}`}
            onClick={() => setActiveTab('bandwidth')}
          >
            Bandwidth
          </button>
        </div>

        <div className="panel-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <div className="setting-item">
                <label>Maximum Concurrent Downloads</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={localSettings.max_concurrent}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      max_concurrent: parseInt(e.target.value),
                    }))
                  }
                  title="Maximum concurrent downloads (1-10)"
                  aria-label="Maximum concurrent downloads"
                />
              </div>

              <div className="setting-item">
                <label>Default Download Location</label>
                <input
                  type="text"
                  placeholder="/path/to/downloads"
                  value={localSettings.default_destination}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      default_destination: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="setting-item">
                <label id="chunk-size-label">Chunk Size</label>
                <select
                  value={localSettings.chunk_size}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      chunk_size: parseInt(e.target.value),
                    }))
                  }
                  aria-labelledby="chunk-size-label"
                  title="Select download chunk size"
                >
                  <option value={524288}>512 KB</option>
                  <option value={1048576}>1 MB</option>
                  <option value={2097152}>2 MB</option>
                  <option value={5242880}>5 MB</option>
                </select>
              </div>

              <div className="setting-item checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={localSettings.auto_organize}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        auto_organize: e.target.checked,
                      }))
                    }
                  />
                  Auto-organize files by category
                </label>
              </div>

              <div className="setting-item checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={localSettings.resume_on_startup}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        resume_on_startup: e.target.checked,
                      }))
                    }
                  />
                  Resume downloads on startup
                </label>
              </div>

              <div className="setting-item checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={localSettings.show_notifications}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        show_notifications: e.target.checked,
                      }))
                    }
                  />
                  Show completion notifications
                </label>
              </div>

              <div className="setting-item">
                <label>Delete completed downloads after (days, 0 = never)</label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={localSettings.delete_completed_after}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      delete_completed_after: parseInt(e.target.value),
                    }))
                  }
                  title="Days to keep completed downloads (0 = forever)"
                  aria-label="Delete completed downloads after days"
                />
              </div>
            </div>
          )}

          {activeTab === 'bandwidth' && (
            <div className="settings-section">
              <div className="setting-item checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={localBandwidth.enabled}
                    onChange={(e) =>
                      setLocalBandwidth((prev) => ({
                        ...prev,
                        enabled: e.target.checked,
                      }))
                    }
                  />
                  Enable bandwidth limiting
                </label>
              </div>

              {localBandwidth.enabled && (
                <>
                  <div className="setting-item">
                    <label>Global Speed Limit</label>
                    <div className="speed-input">
                      <input
                        type="number"
                        min="0"
                        value={Math.round(localBandwidth.limit / 1024)}
                        onChange={(e) =>
                          setLocalBandwidth((prev) => ({
                            ...prev,
                            limit: parseInt(e.target.value) * 1024,
                          }))
                        }
                        title="Speed limit in KB/s (0 for unlimited)"
                        aria-label="Global speed limit"
                      />
                      <span>KB/s (0 = unlimited)</span>
                    </div>
                  </div>

                  <div className="schedules-section">
                    <div className="schedules-header">
                      <h3>Bandwidth Schedules</h3>
                      <button className="add-btn" onClick={handleAddSchedule}>
                        + Add Schedule
                      </button>
                    </div>

                    {localBandwidth.schedule && localBandwidth.schedule.length > 0 ? (
                      <div className="schedules-list">
                        {localBandwidth.schedule.map((schedule) => (
                          <div key={schedule.id} className="schedule-item">
                            <div className="schedule-row">
                              <div className="schedule-field">
                                <label>Start Time</label>
                                <input
                                  type="time"
                                  value={schedule.start_time}
                                  onChange={(e) =>
                                    handleScheduleUpdate(schedule.id, {
                                      start_time: e.target.value,
                                    })
                                  }
                                  title="Schedule start time"
                                  aria-label="Schedule start time"
                                />
                              </div>

                              <div className="schedule-field">
                                <label>End Time</label>
                                <input
                                  type="time"
                                  value={schedule.end_time}
                                  onChange={(e) =>
                                    handleScheduleUpdate(schedule.id, {
                                      end_time: e.target.value,
                                    })
                                  }
                                  title="Schedule end time"
                                  aria-label="Schedule end time"
                                />
                              </div>

                              <div className="schedule-field">
                                <label>Limit (KB/s)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={Math.round(schedule.limit / 1024)}
                                  onChange={(e) =>
                                    handleScheduleUpdate(schedule.id, {
                                      limit: parseInt(e.target.value) * 1024,
                                    })
                                  }
                                  title="Speed limit in KB/s"
                                  aria-label="Schedule speed limit"
                                />
                              </div>

                              <button
                                className="remove-btn"
                                onClick={() => handleRemoveSchedule(schedule.id)}
                                title="Remove Schedule"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="schedule-days">
                              {dayNames.map((day, index) => (
                                <label key={index} className="day-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={schedule.days.includes(index)}
                                    onChange={(e) => {
                                      const newDays = e.target.checked
                                        ? [...schedule.days, index]
                                        : schedule.days.filter((d) => d !== index);
                                      handleScheduleUpdate(schedule.id, { days: newDays });
                                    }}
                                  />
                                  {day}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-schedules">No schedules configured</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="panel-footer">
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
