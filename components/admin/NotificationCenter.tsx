'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  NotificationService,
  NotificationTemplateService,
  NotificationPreferencesService,
  NotificationQueueService,
  PushNotificationService,
  EmailNotificationService,
} from '@/lib/services/notification-service';
import type {
  Notification,
  NotificationTemplate,
  NotificationPreferences,
  NotificationChannel,
  TemplateVariable,
} from '@/lib/services/notification-service';
import {
  Bell, BellOff as _BellOff, Mail, MessageSquare, Smartphone, Send,
  Settings, Plus, Trash2, Edit, RefreshCw, Check, X,
  Clock, AlertTriangle, CheckCircle, XCircle as _XCircle, Eye, Copy,
  Filter as _Filter, Search as _Search, MoreHorizontal as _MoreHorizontal, Play as _Play, Pause as _Pause, Zap,
} from 'lucide-react';
import './NotificationCenter.css';

// ============================================================================
// Types
// ============================================================================

type NotificationTab = 'inbox' | 'templates' | 'preferences' | 'queue' | 'test';

interface NotificationStats {
  total: number;
  unread: number;
  sent: number;
  failed: number;
}

// ============================================================================
// Component
// ============================================================================

export const NotificationCenter: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<NotificationTab>('inbox');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Inbox State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [stats, setStats] = useState<NotificationStats>({
    total: 0, unread: 0, sent: 0, failed: 0,
  });

  // Templates State
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    channel: 'email' as NotificationChannel,
    subject: '',
    body: '',
    variables: [] as string[],
  });

  // Preferences State
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Queue State
  const [queue, setQueue] = useState<Notification[]>([]);
  const [queueStats, setQueueStats] = useState({ pending: 0, processing: 0, failed: 0 });

  // Test State
  const [testChannel, setTestChannel] = useState<NotificationChannel>('email');
  const [testRecipient, setTestRecipient] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testSubject, setTestSubject] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [result, unreadCount] = await Promise.all([
        NotificationService.getAll({ limit: 50 }),
        NotificationService.getUnreadCount(),
      ]);
      const allNotifs = result.notifications;
      setNotifications(allNotifs);
      setStats({
        total: allNotifs.length,
        unread: unreadCount,
        sent: allNotifs.filter((n: Notification) => n.status === 'sent').length,
        failed: allNotifs.filter((n: Notification) => n.status === 'failed').length,
      });
    } catch (_err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await NotificationTemplateService.getAll();
      setTemplates(data);
    } catch (_err) {
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const data = await NotificationPreferencesService.get('user-1');
      setPreferences(data);
    } catch (_err) {
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const queues = await NotificationQueueService.getStatus();
      // Get pending notifications from first queue
      const queueId = queues[0]?.id || 'default';
      const data = await NotificationQueueService.getPending(queueId, 100);
      setQueue(data);
      setQueueStats({
        pending: data.filter((q: Notification) => q.status === 'pending').length,
        processing: data.filter((q: Notification) => q.status === 'scheduled').length,
        failed: data.filter((q: Notification) => q.status === 'failed').length,
      });
    } catch (_err) {
      setError('Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load based on tab
  useEffect(() => {
    switch (activeTab) {
      case 'inbox':
        loadNotifications();
        break;
      case 'templates':
        loadTemplates();
        break;
      case 'preferences':
        loadPreferences();
        break;
      case 'queue':
        loadQueue();
        break;
    }
  }, [activeTab, loadNotifications, loadTemplates, loadPreferences, loadQueue]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead([notificationId]);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, readAt: Date.now() } : n
      ));
      setStats(s => ({ ...s, unread: s.unread - 1 }));
      setSuccess('Marked as read');
    } catch (_err) {
      setError('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await NotificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, readAt: Date.now() })));
      setStats(s => ({ ...s, unread: 0 }));
      setSuccess('All notifications marked as read');
    } catch (_err) {
      setError('Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await NotificationService.delete([notificationId]);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification(null);
      }
      setSuccess('Notification deleted');
    } catch (_err) {
      setError('Failed to delete notification');
    }
  };

  const handleCreateTemplate = async () => {
    try {
      setLoading(true);
      const variables: TemplateVariable[] = templateForm.variables.map(v => ({
        name: v,
        type: 'string' as const,
        required: false,
      }));
      const newTemplate = await NotificationTemplateService.create({
        name: templateForm.name,
        category: 'custom',
        channels: [templateForm.channel],
        titleTemplate: templateForm.subject,
        bodyTemplate: templateForm.body,
        variables,
        defaultPriority: 'normal',
        isEnabled: true,
      });
      setTemplates([...templates, newTemplate]);
      setIsCreatingTemplate(false);
      setTemplateForm({
        name: '',
        channel: 'email',
        subject: '',
        body: '',
        variables: [],
      });
      setSuccess('Template created');
    } catch (_err) {
      setError('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await NotificationTemplateService.delete(templateId);
      setTemplates(templates.filter(t => t.id !== templateId));
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
      }
      setSuccess('Template deleted');
    } catch (_err) {
      setError('Failed to delete template');
    }
  };

  const handleUpdatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      if (!preferences) return;
      const updated = await NotificationPreferencesService.update({
        ...preferences,
        ...updates,
      }, 'user-1');
      setPreferences(updated);
      setSuccess('Preferences updated');
    } catch (_err) {
      setError('Failed to update preferences');
    }
  };

  const handleToggleChannel = async (channel: NotificationChannel, enabled: boolean) => {
    if (!preferences) return;
    const newChannels = { ...preferences.channels };
    if (newChannels[channel]) {
      newChannels[channel] = { ...newChannels[channel], enabled };
    }
    await handleUpdatePreferences({ channels: newChannels });
  };

  const handleRetryQueuedNotification = async (notificationId: string) => {
    try {
      await NotificationService.retry(notificationId);
      await loadQueue();
      setSuccess('Notification queued for retry');
    } catch (_err) {
      setError('Failed to retry notification');
    }
  };

  const handleCancelQueuedNotification = async (notificationId: string) => {
    try {
      await NotificationService.cancel(notificationId);
      setQueue(queue.filter(q => q.id !== notificationId));
      setSuccess('Notification cancelled');
    } catch (_err) {
      setError('Failed to cancel notification');
    }
  };

  const handleSendTestNotification = async () => {
    try {
      setIsSendingTest(true);
      setError(null);

      switch (testChannel) {
        case 'email':
          await EmailNotificationService.send({
            to: testRecipient,
            subject: testSubject,
            body: testMessage,
            html: testMessage,
          });
          break;
        case 'push':
          await PushNotificationService.send(testRecipient, {
            title: testSubject,
            body: testMessage,
            icon: '/icons/notification.png',
          });
          break;
        default:
          await NotificationService.send({
            title: testSubject,
            body: testMessage,
            type: 'info',
            priority: 'normal',
            channel: testChannel,
            category: 'custom',
            recipient: { userId: testRecipient },
            tags: [],
          });
      }

      setSuccess(`Test ${testChannel} notification sent!`);
      setTestRecipient('');
      setTestSubject('');
      setTestMessage('');
    } catch (err) {
      setError(`Failed to send test notification: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const renderInboxTab = () => {
    const filteredNotifications = notifications.filter(n => {
      if (notificationFilter === 'unread') return !n.readAt;
      if (notificationFilter === 'read') return !!n.readAt;
      return true;
    });

    return (
      <div className="notification-section">
        {/* Stats */}
        <div className="inbox-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card highlight">
            <span className="stat-value">{stats.unread}</span>
            <span className="stat-label">Unread</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.sent}</span>
            <span className="stat-label">Sent</span>
          </div>
          <div className="stat-card warning">
            <span className="stat-value">{stats.failed}</span>
            <span className="stat-label">Failed</span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="inbox-actions">
          <div className="filter-buttons">
            {(['all', 'unread', 'read'] as const).map(filter => (
              <button
                key={filter}
                className={`filter-btn ${notificationFilter === filter ? 'active' : ''}`}
                onClick={() => setNotificationFilter(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
          <div className="action-buttons">
            <button className="btn-secondary" onClick={handleMarkAllAsRead} disabled={stats.unread === 0}>
              <Check size={16} />
              Mark All Read
            </button>
            <button className="btn-icon" onClick={loadNotifications}>
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="inbox-layout">
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.readAt ? 'unread' : ''} ${selectedNotification?.id === notification.id ? 'selected' : ''}`}
                onClick={() => setSelectedNotification(notification)}
              >
                <div className="notification-icon">
                  {getChannelIcon(notification.channel)}
                </div>
                <div className="notification-content">
                  <span className="notification-title">{notification.title}</span>
                  <span className="notification-preview">{notification.body.substring(0, 80)}...</span>
                  <span className="notification-time">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </div>
                <div className="notification-actions">
                  {!notification.readAt && (
                    <button
                      className="btn-icon small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    className="btn-icon small danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {filteredNotifications.length === 0 && (
              <div className="empty-inbox">
                <Bell size={48} />
                <h4>No notifications</h4>
                <p>You&apos;re all caught up!</p>
              </div>
            )}
          </div>

          {/* Notification Detail */}
          {selectedNotification && (
            <div className="notification-detail">
              <div className="detail-header">
                <div className="detail-icon">
                  {getChannelIcon(selectedNotification.channel)}
                </div>
                <div className="detail-info">
                  <h4>{selectedNotification.title}</h4>
                  <span className="detail-meta">
                    via {selectedNotification.channel} • {formatRelativeTime(selectedNotification.createdAt)}
                  </span>
                </div>
              </div>
              <div className="detail-body">
                <p>{selectedNotification.body}</p>
              </div>
              {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                <div className="detail-data">
                  <h5>Additional Data</h5>
                  <pre>{JSON.stringify(selectedNotification.data, null, 2)}</pre>
                </div>
              )}
              <div className="detail-actions">
                {selectedNotification.linkUrl && (
                  <a href={selectedNotification.linkUrl} className="btn-primary" target="_blank" rel="noopener noreferrer">
                    View Details
                  </a>
                )}
                <button className="btn-secondary" onClick={() => setSelectedNotification(null)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTemplatesTab = () => (
    <div className="notification-section">
      <div className="section-header">
        <div className="header-left">
          <h3>Notification Templates</h3>
          <span className="count">{templates.length}</span>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setIsCreatingTemplate(true)}>
            <Plus size={16} />
            New Template
          </button>
        </div>
      </div>

      {/* Create Template Form */}
      {isCreatingTemplate && (
        <div className="template-form">
          <h4>Create New Template</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Template Name</label>
              <input
                type="text"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="e.g., Welcome Email"
              />
            </div>
            <div className="form-group">
              <label>Channel</label>
              <select
                value={templateForm.channel}
                onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value as NotificationChannel })}
              >
                <option value="email">Email</option>
                <option value="push">Push</option>
                <option value="sms">SMS</option>
                <option value="in_app">In-App</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Subject</label>
              <input
                type="text"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="Notification subject"
              />
            </div>
            <div className="form-group full-width">
              <label>Body</label>
              <textarea
                value={templateForm.body}
                onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                placeholder="Use {{variable}} for dynamic content"
                rows={6}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setIsCreatingTemplate(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCreateTemplate}
              disabled={!templateForm.name || !templateForm.body}
            >
              Create Template
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="templates-grid">
        {templates.map(template => (
          <div key={template.id} className="template-card">
            <div className="template-header">
              <div className="template-icon">
                {getChannelIcon(template.channels[0] || 'email')}
              </div>
              <div className="template-info">
                <span className="template-name">{template.name}</span>
                <span className="template-channel">{template.channels[0] || 'email'}</span>
              </div>
              <span className={`status-badge ${template.isEnabled ? 'active' : 'inactive'}`}>
                {template.isEnabled ? 'Active' : 'Inactive'}
              </span>
            </div>
            {template.titleTemplate && (
              <div className="template-subject">
                <strong>Subject:</strong> {template.titleTemplate}
              </div>
            )}
            <div className="template-preview">
              {template.bodyTemplate.substring(0, 100)}...
            </div>
            {template.variables.length > 0 && (
              <div className="template-variables">
                {template.variables.map(v => (
                  <span key={v.name} className="variable-tag">{'{{' + v.name + '}}'}</span>
                ))}
              </div>
            )}
            <div className="template-actions">
              <button className="btn-icon">
                <Eye size={14} />
              </button>
              <button className="btn-icon">
                <Edit size={14} />
              </button>
              <button className="btn-icon">
                <Copy size={14} />
              </button>
              <button
                className="btn-icon danger"
                onClick={() => handleDeleteTemplate(template.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && !isCreatingTemplate && (
          <div className="empty-templates">
            <Mail size={48} />
            <h4>No templates yet</h4>
            <p>Create templates for consistent messaging</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPreferencesTab = () => {
    if (!preferences) return <div className="loading">Loading preferences...</div>;

    return (
      <div className="notification-section">
        <div className="section-header">
          <div className="header-left">
            <h3>Notification Preferences</h3>
          </div>
        </div>

        {/* Global Settings */}
        <div className="preferences-section">
          <h4>Global Settings</h4>
          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-label">Enable All Notifications</span>
              <span className="preference-description">
                Master switch for all notification channels
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.enabled}
                onChange={(e) => handleUpdatePreferences({ enabled: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Channel Settings */}
        <div className="preferences-section">
          <h4>Channels</h4>
          {Object.entries(preferences.channels).map(([channel, settings]) => (
            <div key={channel} className="preference-item channel">
              <div className="channel-icon">
                {getChannelIcon(channel as NotificationChannel)}
              </div>
              <div className="preference-info">
                <span className="preference-label">
                  {channel.charAt(0).toUpperCase() + channel.slice(1).replace('_', ' ')}
                </span>
                <span className="preference-description">
                  Receive notifications via {channel.replace('_', ' ')}
                </span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleToggleChannel(channel as NotificationChannel, e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          ))}
        </div>

        {/* Quiet Hours */}
        <div className="preferences-section">
          <h4>Quiet Hours</h4>
          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-label">Enable Quiet Hours</span>
              <span className="preference-description">
                Mute notifications during specific times
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.quietHours?.enabled || false}
                onChange={(e) => handleUpdatePreferences({
                  quietHours: { ...preferences.quietHours, enabled: e.target.checked, startTime: '22:00', endTime: '08:00', timezone: 'UTC', allowUrgent: true }
                })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          {preferences.quietHours?.enabled && (
            <div className="quiet-hours-config">
              <div className="time-input">
                <label>Start</label>
                <input
                  type="time"
                  value={preferences.quietHours.startTime}
                  onChange={(e) => handleUpdatePreferences({
                    quietHours: { ...preferences.quietHours, startTime: e.target.value, enabled: true, endTime: preferences.quietHours?.endTime || '08:00', timezone: preferences.quietHours?.timezone || 'UTC', allowUrgent: preferences.quietHours?.allowUrgent ?? true }
                  })}
                />
              </div>
              <span className="time-separator">to</span>
              <div className="time-input">
                <label>End</label>
                <input
                  type="time"
                  value={preferences.quietHours.endTime}
                  onChange={(e) => handleUpdatePreferences({
                    quietHours: { ...preferences.quietHours, endTime: e.target.value, enabled: true, startTime: preferences.quietHours?.startTime || '22:00', timezone: preferences.quietHours?.timezone || 'UTC', allowUrgent: preferences.quietHours?.allowUrgent ?? true }
                  })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Digest Settings */}
        <div className="preferences-section">
          <h4>Email Digest</h4>
          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-label">Receive Digest</span>
              <span className="preference-description">
                Get a summary of notifications via email
              </span>
            </div>
            <select
              value={preferences.digest?.frequency || 'none'}
              onChange={(e) => handleUpdatePreferences({
                digest: { frequency: e.target.value as 'daily' | 'weekly', time: '09:00', timezone: 'UTC', enabled: e.target.value !== 'none' }
              })}
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderQueueTab = () => (
    <div className="notification-section">
      <div className="section-header">
        <div className="header-left">
          <h3>Notification Queue</h3>
          <span className="count">{queue.length}</span>
        </div>
        <div className="header-actions">
          <button className="btn-icon" onClick={loadQueue}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="queue-stats">
        <div className="stat-card">
          <Clock size={20} />
          <span className="stat-value">{queueStats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card highlight">
          <Zap size={20} />
          <span className="stat-value">{queueStats.processing}</span>
          <span className="stat-label">Processing</span>
        </div>
        <div className="stat-card warning">
          <AlertTriangle size={20} />
          <span className="stat-value">{queueStats.failed}</span>
          <span className="stat-label">Failed</span>
        </div>
      </div>

      {/* Queue List */}
      <div className="queue-list">
        {queue.map(item => (
          <div key={item.id} className={`queue-item ${item.status}`}>
            <div className="queue-icon">
              {getChannelIcon(item.channel)}
            </div>
            <div className="queue-info">
              <span className="queue-recipient">{item.recipient?.userId || item.recipient?.email || 'Unknown'}</span>
              <span className="queue-message">{item.title}</span>
            </div>
            <span className={`status-badge ${item.status}`}>
              {item.status}
            </span>
            <span className="queue-attempts">
              Scheduled: {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : 'N/A'}
            </span>
            <div className="queue-actions">
              {item.status === 'failed' && (
                <button
                  className="btn-icon"
                  onClick={() => handleRetryQueuedNotification(item.id)}
                >
                  <RefreshCw size={14} />
                </button>
              )}
              {item.status === 'pending' && (
                <button
                  className="btn-icon danger"
                  onClick={() => handleCancelQueuedNotification(item.id)}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        {queue.length === 0 && (
          <div className="empty-queue">
            <CheckCircle size={48} />
            <h4>Queue is empty</h4>
            <p>All notifications have been processed</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTestTab = () => (
    <div className="notification-section">
      <div className="section-header">
        <div className="header-left">
          <h3>Test Notifications</h3>
        </div>
      </div>

      <div className="test-form">
        <div className="form-group">
          <label>Channel</label>
          <div className="channel-selector">
            {(['email', 'push', 'sms', 'in_app'] as NotificationChannel[]).map(channel => (
              <button
                key={channel}
                className={`channel-btn ${testChannel === channel ? 'active' : ''}`}
                onClick={() => setTestChannel(channel)}
              >
                {getChannelIcon(channel)}
                <span>{channel.replace('_', ' ')}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>
            {testChannel === 'email' ? 'Email Address' : 
             testChannel === 'sms' ? 'Phone Number' : 
             'User ID'}
          </label>
          <input
            type={testChannel === 'email' ? 'email' : 'text'}
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            placeholder={
              testChannel === 'email' ? 'test@example.com' :
              testChannel === 'sms' ? '+1234567890' :
              'user-123'
            }
          />
        </div>

        {(testChannel === 'email' || testChannel === 'push') && (
          <div className="form-group">
            <label>Subject / Title</label>
            <input
              type="text"
              value={testSubject}
              onChange={(e) => setTestSubject(e.target.value)}
              placeholder="Test notification subject"
            />
          </div>
        )}

        <div className="form-group">
          <label>Message Body</label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Your test notification message..."
            rows={4}
          />
        </div>

        <button
          className="btn-primary send-btn"
          onClick={handleSendTestNotification}
          disabled={isSendingTest || !testRecipient || !testMessage}
        >
          {isSendingTest ? (
            <>
              <RefreshCw className="spin" size={16} />
              Sending...
            </>
          ) : (
            <>
              <Send size={16} />
              Send Test Notification
            </>
          )}
        </button>
      </div>

      <div className="test-tips">
        <h4>Testing Tips</h4>
        <ul>
          <li>
            <strong>Email:</strong> Ensure your SMTP settings are configured in the backend.
          </li>
          <li>
            <strong>Push:</strong> The recipient must have an active push subscription.
          </li>
          <li>
            <strong>SMS:</strong> Requires a configured SMS provider (Twilio, etc.).
          </li>
          <li>
            <strong>In-App:</strong> Notifications appear in the user&apos;s inbox immediately.
          </li>
        </ul>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'inbox':
        return renderInboxTab();
      case 'templates':
        return renderTemplatesTab();
      case 'preferences':
        return renderPreferencesTab();
      case 'queue':
        return renderQueueTab();
      case 'test':
        return renderTestTab();
      default:
        return renderInboxTab();
    }
  };

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail size={16} />;
      case 'push':
        return <Smartphone size={16} />;
      case 'sms':
        return <MessageSquare size={16} />;
      case 'in_app':
        return <Bell size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="notification-center">
      {/* Header */}
      <div className="notification-header">
        <div className="header-content">
          <Bell size={32} />
          <div>
            <h2>Notification Center</h2>
            <p>Manage notifications, templates, and preferences</p>
          </div>
        </div>
        {stats.unread > 0 && (
          <div className="unread-badge">{stats.unread} unread</div>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="notification error">
          <AlertTriangle size={16} />
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {success && (
        <div className="notification success">
          <CheckCircle size={16} />
          {success}
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="notification-tabs">
        {[
          { id: 'inbox' as const, label: 'Inbox', icon: <Bell size={16} /> },
          { id: 'templates' as const, label: 'Templates', icon: <Mail size={16} /> },
          { id: 'preferences' as const, label: 'Preferences', icon: <Settings size={16} /> },
          { id: 'queue' as const, label: 'Queue', icon: <Clock size={16} /> },
          { id: 'test' as const, label: 'Test', icon: <Send size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="notification-content">
        {loading && (
          <div className="loading-overlay">
            <RefreshCw className="spin" size={24} />
            Loading...
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  );
};

export default NotificationCenter;
