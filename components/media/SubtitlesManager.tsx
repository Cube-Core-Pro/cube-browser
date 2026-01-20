/**
 * Subtitles Manager Component - Subtitle track management
 * CUBE Nexum Platform v2.0
 */

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('SubtitlesManager');

import React from 'react';
import { SubtitleTrack, generateId } from '../../types/media';
import './SubtitlesManager.css';

interface SubtitlesManagerProps {
  subtitles: SubtitleTrack[];
  activeSubtitle: SubtitleTrack | null;
  onSubtitleSelect: (subtitle: SubtitleTrack | null) => void;
  onSubtitleAdd: (subtitle: SubtitleTrack) => void;
  onSubtitleRemove: (id: string) => void;
  onClose: () => void;
}

export const SubtitlesManager: React.FC<SubtitlesManagerProps> = ({
  subtitles,
  activeSubtitle,
  onSubtitleSelect,
  onSubtitleAdd,
  onSubtitleRemove,
  onClose,
}) => {
  const handleAddSubtitle = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Subtitle Files',
          extensions: ['srt', 'vtt', 'ass', 'ssa', 'sub']
        }]
      });
      
      if (selected && typeof selected === 'string') {
        const fileName = selected.split('/').pop() || 'Unknown';
        const extension = fileName.split('.').pop()?.toLowerCase() || 'srt';
        
        const newSubtitle: SubtitleTrack = {
          id: generateId(),
          label: fileName.replace(/\.[^/.]+$/, ''),
          language: 'en',
          file_path: selected,
          format: extension as 'srt' | 'vtt' | 'ass',
          is_active: false
        };
        
        onSubtitleAdd(newSubtitle);
      }
    } catch (error) {
      log.error('Failed to open file picker:', error);
    }
  };

  return (
    <div className="subtitles-overlay" onClick={onClose}>
      <div className="subtitles-panel" onClick={(e) => e.stopPropagation()}>
        <div className="subtitles-header">
          <h2>Subtitles</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="subtitles-content">
          <div className="subtitles-list">
            <div
              className={`subtitle-item ${!activeSubtitle ? 'active' : ''}`}
              onClick={() => onSubtitleSelect(null)}
            >
              <span className="subtitle-label">None</span>
            </div>

            {subtitles.map((subtitle) => (
              <div
                key={subtitle.id}
                className={`subtitle-item ${activeSubtitle?.id === subtitle.id ? 'active' : ''}`}
                onClick={() => onSubtitleSelect(subtitle)}
              >
                <div className="subtitle-info">
                  <span className="subtitle-label">{subtitle.label}</span>
                  <span className="subtitle-language">{subtitle.language}</span>
                  <span className="subtitle-format">{subtitle.format.toUpperCase()}</span>
                </div>
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubtitleRemove(subtitle.id);
                  }}
                  title="Remove Subtitle"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button className="add-subtitle-btn" onClick={handleAddSubtitle}>
            <span className="icon">+</span>
            Add Subtitle File
          </button>
        </div>
      </div>
    </div>
  );
};
