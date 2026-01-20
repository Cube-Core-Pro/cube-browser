'use client';

import React, { useMemo } from 'react';
import type {
  TransferItem,
  TransferStats,
} from '../../types/ftp';
import {
  formatFileSize,
  formatSpeed,
  formatDuration,
  getTransferStatusText,
  getTransferStatusColor,
  calculatePercentage,
} from '../../types/ftp';
import './TransferQueue.css';

interface TransferQueueProps {
  transfers: TransferItem[];
  stats: TransferStats;
  onPause: (transferId: string) => void;
  onResume: (transferId: string) => void;
  onCancel: (transferId: string) => void;
  onClear: () => void;
}

/**
 * TransferQueue Component
 * 
 * Shows active and queued file transfers with:
 * - Progress bars
 * - Speed and ETA
 * - Pause/resume/cancel controls
 * - Overall transfer statistics
 */
export default function TransferQueue({
  transfers,
  stats,
  onPause,
  onResume,
  onCancel,
  onClear,
}: TransferQueueProps) {
  // Separate active and completed transfers
  const activeTransfers = useMemo(
    () => transfers.filter((t) => ['queued', 'transferring', 'paused'].includes(t.status)),
    [transfers]
  );

  const completedTransfers = useMemo(
    () => transfers.filter((t) => ['completed', 'failed', 'cancelled'].includes(t.status)),
    [transfers]
  );

  // Calculate total progress for active transfers
  const totalProgress = useMemo(() => {
    if (activeTransfers.length === 0) return 0;
    
    const total = activeTransfers.reduce((sum, t) => sum + t.file_size, 0);
    const transferred = activeTransfers.reduce((sum, t) => sum + t.bytes_transferred, 0);
    
    return total > 0 ? (transferred / total) * 100 : 0;
  }, [activeTransfers]);

  return (
    <div className="transfer-queue" data-tour="transfer-queue">
      {/* Header */}
      <div className="transfer-queue-header">
        <div className="queue-title">Transfer Queue</div>
        
        <div className="queue-actions">
          {completedTransfers.length > 0 && (
            <button className="btn-clear" onClick={onClear}>
              Clear Completed
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="transfer-stats" data-tour="transfer-stats">
        <div className="stat-item">
          <div className="stat-label">Active</div>
          <div className="stat-value">{stats.active_transfers}</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">Completed</div>
          <div className="stat-value completed">{stats.completed_transfers}</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">Failed</div>
          <div className="stat-value failed">{stats.failed_transfers}</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">Total Data</div>
          <div className="stat-value">{formatFileSize(stats.total_bytes_transferred)}</div>
        </div>
        
        {stats.average_speed > 0 && (
          <div className="stat-item">
            <div className="stat-label">Avg Speed</div>
            <div className="stat-value">{formatSpeed(stats.average_speed)}</div>
          </div>
        )}
      </div>

      {/* Overall Progress (for active transfers) */}
      {activeTransfers.length > 0 && (
        <div className="overall-progress">
          <div className="progress-label">
            Overall Progress: {Math.round(totalProgress)}%
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" ref={(el) => { if (el) el.style.width = `${totalProgress}%`; }} />
          </div>
        </div>
      )}

      {/* Active Transfers */}
      {activeTransfers.length > 0 && (
        <div className="transfer-section">
          <div className="section-title">Active ({activeTransfers.length})</div>
          
          <div className="transfer-list">
            {activeTransfers.map((transfer) => (
              <TransferItem
                key={transfer.id}
                transfer={transfer}
                onPause={onPause}
                onResume={onResume}
                onCancel={onCancel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Transfers */}
      {completedTransfers.length > 0 && (
        <div className="transfer-section">
          <div className="section-title">Completed ({completedTransfers.length})</div>
          
          <div className="transfer-list">
            {completedTransfers.map((transfer) => (
              <TransferItem
                key={transfer.id}
                transfer={transfer}
                onPause={onPause}
                onResume={onResume}
                onCancel={onCancel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {transfers.length === 0 && (
        <div className="transfer-empty">
          <span>📦</span>
          <span>No transfers in queue</span>
        </div>
      )}
    </div>
  );
}

/**
 * TransferItem Component
 * Individual transfer item with progress and controls
 */
interface TransferItemProps {
  transfer: TransferItem;
  onPause: (transferId: string) => void;
  onResume: (transferId: string) => void;
  onCancel: (transferId: string) => void;
}

function TransferItem({ transfer, onPause, onResume, onCancel }: TransferItemProps) {
  const percentage = calculatePercentage(transfer.bytes_transferred, transfer.file_size);
  const isActive = transfer.status === 'transferring';
  const isPaused = transfer.status === 'paused';
  const isCompleted = transfer.status === 'completed';
  const isFailed = transfer.status === 'failed';
  const isCancelled = transfer.status === 'cancelled';
  
  // Get filename from path
  const filename = transfer.local_path.split('/').pop() || transfer.local_path;
  
  // Status color
  const statusColor = getTransferStatusColor(transfer.status);

  return (
    <div className={`transfer-item ${transfer.status}`} data-tour="transfer-item">
      {/* Header */}
      <div className="transfer-header">
        <div className="transfer-info">
          <div className="transfer-icon">
            {transfer.transfer_type === 'upload' ? '⬆️' : '⬇️'}
          </div>
          
          <div className="transfer-details">
            <div className="transfer-filename">{filename}</div>
            <div className="transfer-meta">
              {formatFileSize(transfer.file_size)} • {getTransferStatusText(transfer.status)}
            </div>
          </div>
        </div>
        
        <div className="transfer-controls" data-tour="transfer-controls">
          {isActive && (
            <button
              className="btn-control"
              onClick={() => onPause(transfer.id)}
              title="Pause"
            >
              ⏸
            </button>
          )}
          
          {isPaused && (
            <button
              className="btn-control"
              onClick={() => onResume(transfer.id)}
              title="Resume"
            >
              ▶️
            </button>
          )}
          
          {(isActive || isPaused) && (
            <button
              className="btn-control danger"
              onClick={() => onCancel(transfer.id)}
              title="Cancel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {!isCompleted && !isFailed && !isCancelled && (
        <div className="transfer-progress">
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              ref={(el) => { 
                if (el) {
                  el.style.width = `${percentage}%`;
                  el.style.backgroundColor = statusColor;
                }
              }}
            />
          </div>
          
          <div className="progress-info">
            <span className="progress-percentage">{percentage}%</span>
            <span className="progress-transferred">
              {formatFileSize(transfer.bytes_transferred)} / {formatFileSize(transfer.file_size)}
            </span>
          </div>
        </div>
      )}

      {/* Speed and ETA */}
      {isActive && transfer.speed > 0 && (
        <div className="transfer-stats">
          <div className="stat">
            <span className="stat-label">Speed:</span>
            <span className="stat-value">{formatSpeed(transfer.speed)}</span>
          </div>
          
          {transfer.eta && (
            <div className="stat">
              <span className="stat-label">ETA:</span>
              <span className="stat-value">{formatDuration(transfer.eta)}</span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {(isFailed || isCancelled) && transfer.error && (
        <div className="transfer-error">
          ⚠️ {transfer.error}
        </div>
      )}
    </div>
  );
}
