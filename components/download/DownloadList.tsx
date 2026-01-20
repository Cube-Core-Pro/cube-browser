/**
 * Download List Component - Display download items
 * CUBE Nexum Platform v2.0
 */

import React from 'react';
import {
  DownloadItem,
  DownloadSort,
  formatBytes,
  formatSpeed,
  formatETA,
  getCategoryIcon,
  getStatusIcon,
  getStatusColor,
} from '../../types/download';
import './DownloadList.css';

interface DownloadListProps {
  downloads: DownloadItem[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  sort: DownloadSort;
  onSortChange: (sort: DownloadSort) => void;
}

export const DownloadList: React.FC<DownloadListProps> = ({
  downloads,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onRemove,
  sort,
  onSortChange,
}) => {
  const handleSort = (by: DownloadSort['by']) => {
    if (sort.by === by) {
      onSortChange({ by, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ by, direction: 'desc' });
    }
  };

  if (downloads.length === 0) {
    return (
      <div className="download-list-empty">
        <span className="empty-icon">📥</span>
        <p>No downloads</p>
      </div>
    );
  }

  return (
    <div className="download-list">
      <div className="list-header">
        <div className="header-cell name" onClick={() => handleSort('name')}>
          Name {sort.by === 'name' && (sort.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div className="header-cell size" onClick={() => handleSort('size')}>
          Size {sort.by === 'size' && (sort.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div className="header-cell progress" onClick={() => handleSort('progress')}>
          Progress {sort.by === 'progress' && (sort.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div className="header-cell speed" onClick={() => handleSort('speed')}>
          Speed {sort.by === 'speed' && (sort.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div className="header-cell status" onClick={() => handleSort('status')}>
          Status {sort.by === 'status' && (sort.direction === 'asc' ? '↑' : '↓')}
        </div>
        <div className="header-cell actions">Actions</div>
      </div>

      <div className="list-items">
        {downloads.map((item) => (
          <div key={item.id} className={`download-item ${item.status}`}>
            <div className="item-cell name">
              <span className="category-icon">{getCategoryIcon(item.category)}</span>
              <div className="name-info">
                <span className="filename" title={item.filename}>
                  {item.filename}
                </span>
                <span className="url" title={item.url}>
                  {item.url}
                </span>
              </div>
            </div>

            <div className="item-cell size">
              {item.file_size > 0 ? (
                <>
                  {formatBytes(item.downloaded_bytes)} / {formatBytes(item.file_size)}
                </>
              ) : (
                'Unknown'
              )}
            </div>

            <div className="item-cell progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  ref={(el) => { 
                    if (el) {
                      el.style.width = `${item.progress}%`;
                      el.style.backgroundColor = getStatusColor(item.status);
                    }
                  }}
                />
              </div>
              <span className="progress-text">{item.progress.toFixed(1)}%</span>
            </div>

            <div className="item-cell speed">
              {item.status === 'downloading' && item.speed > 0 ? (
                <>
                  {formatSpeed(item.speed)}
                  <span className="eta">ETA: {formatETA(item.eta)}</span>
                </>
              ) : (
                '-'
              )}
            </div>

            <div className="item-cell status">
              <span
                className="status-badge"
                ref={(el) => { if (el) el.style.color = getStatusColor(item.status); }}
              >
                {getStatusIcon(item.status)} {item.status}
              </span>
              {item.error && (
                <span className="error-text" title={item.error}>
                  {item.error}
                </span>
              )}
            </div>

            <div className="item-cell actions">
              {item.status === 'downloading' && (
                <button
                  className="action-btn pause"
                  onClick={() => onPause(item.id)}
                  title="Pause"
                >
                  ⏸️
                </button>
              )}
              {item.status === 'paused' && (
                <button
                  className="action-btn resume"
                  onClick={() => onResume(item.id)}
                  title="Resume"
                >
                  ▶️
                </button>
              )}
              {(item.status === 'downloading' ||
                item.status === 'pending' ||
                item.status === 'paused') && (
                <button
                  className="action-btn cancel"
                  onClick={() => onCancel(item.id)}
                  title="Cancel"
                >
                  ✕
                </button>
              )}
              {item.status === 'failed' && (
                <button
                  className="action-btn retry"
                  onClick={() => onRetry(item.id)}
                  title="Retry"
                >
                  🔄
                </button>
              )}
              {(item.status === 'completed' || item.status === 'failed') && (
                <button
                  className="action-btn remove"
                  onClick={() => onRemove(item.id)}
                  title="Remove"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
