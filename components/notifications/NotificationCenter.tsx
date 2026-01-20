/**
 * Notification Center Component
 * 
 * In-app notification center with full notification management
 * CUBE Nexum v7.0.0
 * 
 * @component NotificationCenter
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useNotifications,
  useNotificationPreferences,
  useNotificationStats,
  NOTIFICATION_TYPE_CONFIG,
  type PushNotification,
  type NotificationType
} from '@/lib/services/push-notification-service';
import './NotificationCenter.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface NotificationCenterProps {
  onClose?: () => void;
  compact?: boolean;
}

interface NotificationItemProps {
  notification: PushNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: PushNotification) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTimestamp(date: Date | string): string {
  const now = new Date();
  const timestamp = new Date(date);
  const diff = now.getTime() - timestamp.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return timestamp.toLocaleDateString();
}

// ============================================================================
// SUB COMPONENTS
// ============================================================================

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onDelete,
  onClick
}) => {
  const config = NOTIFICATION_TYPE_CONFIG[notification.type];

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    onClick?.(notification);
  };

  return (
    <motion.div
      className={`notification-item ${!notification.read ? 'notification-item--unread' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onClick={handleClick}
      whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
    >
      <div 
        className="notification-item__icon"
        style={{ background: config.color }}
      >
        {config.icon}
      </div>
      <div className="notification-item__content">
        <div className="notification-item__header">
          <span className="notification-item__title">{notification.title}</span>
          <span className="notification-item__time">{formatTimestamp(notification.timestamp)}</span>
        </div>
        <p className="notification-item__body">{notification.body}</p>
        <div className="notification-item__meta">
          <span 
            className="notification-item__type"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
          {notification.priority === 'high' || notification.priority === 'urgent' ? (
            <span className="notification-item__priority">
              {notification.priority === 'urgent' ? '🔴' : '🟠'} {notification.priority}
            </span>
          ) : null}
        </div>
      </div>
      <div className="notification-item__actions">
        {!notification.read && (
          <button
            className="notification-item__action"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
            title="Mark as read"
          >
            ✓
          </button>
        )}
        <button
          className="notification-item__action notification-item__action--delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          title="Delete"
        >
          ✕
        </button>
      </div>
      {!notification.read && <div className="notification-item__unread-dot" />}
    </motion.div>
  );
};

interface FilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  unreadCount: number;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ activeFilter, onFilterChange, unreadCount }) => {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'achievement', label: '🏆' },
    { id: 'social', label: '💬' },
    { id: 'workflow', label: '⚡' },
    { id: 'system', label: '⚙️' }
  ];

  return (
    <div className="notification-filters">
      {filters.map(filter => (
        <button
          key={filter.id}
          className={`notification-filter ${activeFilter === filter.id ? 'notification-filter--active' : ''}`}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
          {filter.count !== undefined && filter.count > 0 && (
            <span className="notification-filter__count">{filter.count}</span>
          )}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onClose,
  compact = false
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build filter based on active tab
  const filter = {
    read: activeFilter === 'unread' ? false : undefined,
    types: activeFilter !== 'all' && activeFilter !== 'unread' 
      ? getTypesForCategory(activeFilter) 
      : undefined,
    limit: 50
  };

  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearAll 
  } = useNotifications(filter);

  const { preferences, permission, updatePreferences, requestPermission } = useNotificationPreferences();
  const stats = useNotificationStats();

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = (notification: PushNotification) => {
    if (notification.data?.url) {
      window.location.href = notification.data.url as string;
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className={`notification-center ${compact ? 'notification-center--compact' : ''}`}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
    >
      {/* Header */}
      <div className="notification-center__header">
        <div className="notification-center__title-row">
          <h3 className="notification-center__title">
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="notification-center__badge">{unreadCount}</span>
            )}
          </h3>
          <div className="notification-center__header-actions">
            <button
              className="notification-center__settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              ⚙️
            </button>
            {onClose && (
              <button
                className="notification-center__close-btn"
                onClick={onClose}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {/* Permission Banner */}
        {permission !== 'granted' && (
          <div className="notification-center__permission">
            <span>Enable push notifications for real-time updates</span>
            <button onClick={requestPermission}>Enable</button>
          </div>
        )}

        <FilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          unreadCount={unreadCount}
        />
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="notification-center__settings"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="notification-setting">
              <span>Push Notifications</span>
              <button
                className={`notification-toggle ${preferences.pushEnabled ? 'notification-toggle--on' : ''}`}
                onClick={() => updatePreferences({ pushEnabled: !preferences.pushEnabled })}
              >
                <span className="notification-toggle__knob" />
              </button>
            </div>
            <div className="notification-setting">
              <span>Sound</span>
              <button
                className={`notification-toggle ${preferences.soundEnabled ? 'notification-toggle--on' : ''}`}
                onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
              >
                <span className="notification-toggle__knob" />
              </button>
            </div>
            <div className="notification-setting">
              <span>In-App Notifications</span>
              <button
                className={`notification-toggle ${preferences.inAppEnabled ? 'notification-toggle--on' : ''}`}
                onClick={() => updatePreferences({ inAppEnabled: !preferences.inAppEnabled })}
              >
                <span className="notification-toggle__knob" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions Bar */}
      {notifications.length > 0 && (
        <div className="notification-center__actions">
          <button onClick={markAllAsRead} disabled={unreadCount === 0}>
            ✓ Mark all read
          </button>
          <button onClick={clearAll} className="notification-center__clear">
            🗑️ Clear all
          </button>
        </div>
      )}

      {/* Notification List */}
      <div className="notification-center__list">
        {loading ? (
          <div className="notification-center__loading">
            <div className="notification-center__spinner" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-center__empty">
            <span className="notification-center__empty-icon">🔔</span>
            <h4>No notifications</h4>
            <p>You&apos;re all caught up!</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={markAsRead}
                onDelete={deleteNotification}
                onClick={handleNotificationClick}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Stats Footer */}
      {!compact && (
        <div className="notification-center__footer">
          <div className="notification-center__stats">
            <span>Today: {stats.today}</span>
            <span>•</span>
            <span>This week: {stats.thisWeek}</span>
            <span>•</span>
            <span>Total: {stats.total}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTypesForCategory(category: string): NotificationType[] {
  const mapping: Record<string, NotificationType[]> = {
    achievement: ['achievement', 'level_up', 'streak', 'reward'],
    social: ['social', 'mention', 'comment', 'like', 'follow', 'share', 'referral'],
    workflow: ['workflow', 'challenge'],
    system: ['system', 'reminder', 'team']
  };
  return mapping[category] || [];
}

// ============================================================================
// NOTIFICATION BELL COMPONENT
// ============================================================================

interface NotificationBellProps {
  onClick?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const { unreadCount } = useNotifications();
  const [showCenter, setShowCenter] = useState(false);

  const handleClick = () => {
    setShowCenter(!showCenter);
    onClick?.();
  };

  return (
    <div className="notification-bell-wrapper">
      <button className="notification-bell" onClick={handleClick}>
        <span className="notification-bell__icon">🔔</span>
        {unreadCount > 0 && (
          <motion.span
            className="notification-bell__badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            key={unreadCount}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>
      
      <AnimatePresence>
        {showCenter && (
          <NotificationCenter onClose={() => setShowCenter(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
