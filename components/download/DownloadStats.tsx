/**
 * Download Stats Component - Statistics panel
 * CUBE Nexum Platform v2.0
 */

import React from 'react';
import {
  DownloadStats as Stats,
  BandwidthLimit,
  formatBytes,
  formatSpeed,
  getActiveBandwidthLimit,
} from '../../types/download';
import './DownloadStats.css';

interface DownloadStatsProps {
  stats: Stats;
  bandwidthLimit: BandwidthLimit;
}

export const DownloadStats: React.FC<DownloadStatsProps> = ({
  stats,
  bandwidthLimit,
}) => {
  const activeLimit = getActiveBandwidthLimit(bandwidthLimit);
  const limitPercentage = activeLimit > 0 ? (stats.overall_speed / activeLimit) * 100 : 0;

  return (
    <div className="download-stats">
      <div className="stat-card">
        <div className="stat-icon">📊</div>
        <div className="stat-content">
          <div className="stat-value">{stats.total_downloads}</div>
          <div className="stat-label">Total Downloads</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">⬇️</div>
        <div className="stat-content">
          <div className="stat-value">{stats.active_downloads}</div>
          <div className="stat-label">Active</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-content">
          <div className="stat-value">{stats.completed_downloads}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">❌</div>
        <div className="stat-content">
          <div className="stat-value">{stats.failed_downloads}</div>
          <div className="stat-label">Failed</div>
        </div>
      </div>

      <div className="stat-card speed">
        <div className="stat-icon">🚀</div>
        <div className="stat-content">
          <div className="stat-value">{formatSpeed(stats.overall_speed)}</div>
          <div className="stat-label">Download Speed</div>
          {bandwidthLimit.enabled && activeLimit > 0 && (
            <div className="stat-progress">
              <div
                className="progress-bar"
                ref={(el) => { if (el) el.style.width = `${Math.min(limitPercentage, 100)}%`; }}
              />
              <span className="progress-text">
                {limitPercentage.toFixed(0)}% of {formatSpeed(activeLimit)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">💾</div>
        <div className="stat-content">
          <div className="stat-value">{formatBytes(stats.total_bytes_downloaded)}</div>
          <div className="stat-label">Downloaded</div>
        </div>
      </div>
    </div>
  );
};
