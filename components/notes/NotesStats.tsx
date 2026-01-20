/**
 * Notes Statistics Component
 * CUBE Nexum Platform v2.0
 */

import React from 'react';
import type { NotesStats as NotesStatsType } from '@/types/notes';
import './NotesStats.css';

interface NotesStatsProps {
  stats: NotesStatsType;
}

export const NotesStats: React.FC<NotesStatsProps> = ({ stats }) => {
  return (
    <div className="notes-stats">
      <div className="stat-card">
        <div className="stat-icon">📝</div>
        <div className="stat-content">
          <div className="stat-value">{stats.total_notes}</div>
          <div className="stat-label">Total Notes</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">✓</div>
        <div className="stat-content">
          <div className="stat-value">{stats.active_tasks}</div>
          <div className="stat-label">Active Tasks</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-content">
          <div className="stat-value">{stats.completed_tasks}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="stat-card warning">
        <div className="stat-icon">⚠️</div>
        <div className="stat-content">
          <div className="stat-value">{stats.overdue_tasks}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">📅</div>
        <div className="stat-content">
          <div className="stat-value">{stats.today_tasks}</div>
          <div className="stat-label">Due Today</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">📆</div>
        <div className="stat-content">
          <div className="stat-value">{stats.this_week_tasks}</div>
          <div className="stat-label">This Week</div>
        </div>
      </div>
    </div>
  );
};
