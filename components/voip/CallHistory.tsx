import React, { useState, useMemo } from 'react';
import {
  CallHistoryEntry,
  Contact,
  EndReason,
  formatDuration,
  getCallTypeIcon,
  getCallDirectionIcon,
  getEndReasonText,
  getQualityColor
} from '../../types/voip';
import './CallHistory.css';

interface CallHistoryProps {
  history: CallHistoryEntry[];
  contacts: Contact[];
  onCallBack: (contact: Contact) => void;
  onRefresh: () => void;
}

type HistoryFilter = 'all' | 'missed' | 'audio' | 'video';

export const CallHistory: React.FC<CallHistoryProps> = ({
  history,
  contacts,
  onCallBack,
  onRefresh
}) => {
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Filter history
  const filteredHistory = useMemo(() => {
    let result = history;

    switch (filter) {
      case 'missed':
        result = history.filter(entry => entry.ended_reason === 'missed');
        break;
      case 'audio':
        result = history.filter(entry => entry.type === 'audio');
        break;
      case 'video':
        result = history.filter(entry => entry.type === 'video');
        break;
    }

    return result;
  }, [history, filter]);

  // Group by date
  const groupedHistory = useMemo(() => {
    const groups: Record<string, CallHistoryEntry[]> = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    filteredHistory.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      let groupKey: string;

      if (entryDate.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (entryDate.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = entryDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(entry);
    });

    return groups;
  }, [filteredHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleCallBack = (entry: CallHistoryEntry) => {
    const contact = contacts.find(c => c.id === entry.contact_id);
    if (contact) {
      onCallBack(contact);
    }
  };

  const getEndReasonClass = (reason: EndReason): string => {
    switch (reason) {
      case 'completed':
        return 'reason-completed';
      case 'missed':
        return 'reason-missed';
      case 'declined':
      case 'cancelled':
        return 'reason-declined';
      case 'failed':
      case 'busy':
        return 'reason-failed';
      default:
        return '';
    }
  };

  return (
    <div className="call-history" data-tour="call-history">
      <div className="history-controls">
        <div className="filter-buttons" data-tour="history-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({history.length})
          </button>
          <button
            className={`filter-btn ${filter === 'missed' ? 'active' : ''}`}
            onClick={() => setFilter('missed')}
          >
            📵 Missed ({history.filter(e => e.ended_reason === 'missed').length})
          </button>
          <button
            className={`filter-btn ${filter === 'audio' ? 'active' : ''}`}
            onClick={() => setFilter('audio')}
          >
            📞 Audio ({history.filter(e => e.type === 'audio').length})
          </button>
          <button
            className={`filter-btn ${filter === 'video' ? 'active' : ''}`}
            onClick={() => setFilter('video')}
          >
            📹 Video ({history.filter(e => e.type === 'video').length})
          </button>
        </div>

        <button
          className={`btn-refresh ${refreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          🔄 Refresh
        </button>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>No call history</h3>
          <p>
            {filter === 'missed'
              ? 'No missed calls'
              : filter === 'audio'
              ? 'No audio calls in history'
              : filter === 'video'
              ? 'No video calls in history'
              : 'Your call history will appear here'}
          </p>
        </div>
      ) : (
        <div className="history-list">
          {Object.entries(groupedHistory).map(([date, entries]) => (
            <div key={date} className="history-group">
              <h3 className="group-date">{date}</h3>
              
              <div className="history-entries">
                {entries.map((entry, entryIndex) => (
                  <div key={entry.id} className="history-entry" data-tour={entryIndex === 0 ? 'history-entry' : undefined}>
                    <div className="entry-icon">
                      <span className="type-icon">{getCallTypeIcon(entry.type)}</span>
                      <span className="direction-icon">{getCallDirectionIcon(entry.direction)}</span>
                    </div>

                    <div className="entry-info">
                      <h4 className="entry-contact">{entry.contact_name}</h4>
                      
                      <div className="entry-details">
                        <span className="entry-type">
                          {entry.type === 'video' ? 'Video Call' : 'Audio Call'}
                        </span>
                        <span className="entry-separator">•</span>
                        <span className="entry-time">
                          {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                        {entry.duration > 0 && (
                          <>
                            <span className="entry-separator">•</span>
                            <span className="entry-duration">{formatDuration(entry.duration)}</span>
                          </>
                        )}
                      </div>

                      <div className="entry-meta">
                        <span className={`entry-reason ${getEndReasonClass(entry.ended_reason)}`}>
                          {getEndReasonText(entry.ended_reason)}
                        </span>
                        
                        {entry.duration > 0 && (
                          <>
                            <span className="entry-separator">•</span>
                            <span
                              className="entry-quality"
                              ref={(el) => { if (el) el.style.color = getQualityColor(entry.quality); }}
                            >
                              Quality: {entry.quality}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="entry-actions">
                      <button
                        className="btn-callback"
                        onClick={() => handleCallBack(entry)}
                        title="Call back"
                        data-tour={entryIndex === 0 ? 'callback-button' : undefined}
                      >
                        📞
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
