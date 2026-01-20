/**
 * Notification Service - Multi-Channel Notifications
 *
 * Enterprise-grade notification system with multi-channel delivery,
 * templating, scheduling, and analytics.
 *
 * M5 Features:
 * - Multi-channel delivery (email, SMS, push, in-app)
 * - Notification templates with variables
 * - Scheduling and queuing
 * - Delivery tracking
 * - User preferences
 * - Notification groups/categories
 * - Analytics and reporting
 *
 * @module NotificationService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService } from './telemetry-service';

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  /**
   * Notification ID
   */
  id: string;

  /**
   * Title
   */
  title: string;

  /**
   * Message body
   */
  body: string;

  /**
   * Notification type
   */
  type: NotificationType;

  /**
   * Severity/Priority
   */
  priority: NotificationPriority;

  /**
   * Delivery channel
   */
  channel: NotificationChannel;

  /**
   * Category
   */
  category: NotificationCategory;

  /**
   * Status
   */
  status: NotificationStatus;

  /**
   * Recipient
   */
  recipient: NotificationRecipient;

  /**
   * Additional data
   */
  data?: Record<string, unknown>;

  /**
   * Actions
   */
  actions?: NotificationAction[];

  /**
   * Icon URL
   */
  iconUrl?: string;

  /**
   * Image URL
   */
  imageUrl?: string;

  /**
   * Link URL
   */
  linkUrl?: string;

  /**
   * Is read
   */
  isRead: boolean;

  /**
   * Is archived
   */
  isArchived: boolean;

  /**
   * Scheduled time
   */
  scheduledAt?: number;

  /**
   * Sent time
   */
  sentAt?: number;

  /**
   * Delivered time
   */
  deliveredAt?: number;

  /**
   * Read time
   */
  readAt?: number;

  /**
   * Creation time
   */
  createdAt: number;

  /**
   * Expiry time
   */
  expiresAt?: number;

  /**
   * Source system
   */
  source?: string;

  /**
   * Tags
   */
  tags: string[];
}

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'alert'
  | 'reminder'
  | 'update'
  | 'message';

export type NotificationPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'
  | 'critical';

export type NotificationChannel =
  | 'in-app'
  | 'push'
  | 'email'
  | 'sms'
  | 'slack'
  | 'webhook';

export type NotificationCategory =
  | 'system'
  | 'workflow'
  | 'security'
  | 'task'
  | 'data'
  | 'schedule'
  | 'error'
  | 'announcement'
  | 'custom';

export type NotificationStatus =
  | 'pending'
  | 'scheduled'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface NotificationRecipient {
  /**
   * User ID
   */
  userId?: string;

  /**
   * Email address
   */
  email?: string;

  /**
   * Phone number
   */
  phone?: string;

  /**
   * Device tokens
   */
  deviceTokens?: string[];

  /**
   * Slack user ID
   */
  slackUserId?: string;

  /**
   * Webhook URL
   */
  webhookUrl?: string;
}

export interface NotificationAction {
  /**
   * Action ID
   */
  id: string;

  /**
   * Action label
   */
  label: string;

  /**
   * Action type
   */
  type: 'link' | 'button' | 'dismiss';

  /**
   * Action URL or handler
   */
  url?: string;

  /**
   * Is primary action
   */
  isPrimary?: boolean;
}

// ============================================================================
// Template Types
// ============================================================================

export interface NotificationTemplate {
  /**
   * Template ID
   */
  id: string;

  /**
   * Template name
   */
  name: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Category
   */
  category: NotificationCategory;

  /**
   * Supported channels
   */
  channels: NotificationChannel[];

  /**
   * Title template
   */
  titleTemplate: string;

  /**
   * Body template
   */
  bodyTemplate: string;

  /**
   * Variables
   */
  variables: TemplateVariable[];

  /**
   * Default priority
   */
  defaultPriority: NotificationPriority;

  /**
   * Channel-specific templates
   */
  channelTemplates?: Partial<Record<NotificationChannel, {
    titleTemplate?: string;
    bodyTemplate?: string;
    subjectTemplate?: string;
    htmlTemplate?: string;
  }>>;

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Creation time
   */
  createdAt: number;

  /**
   * Last update
   */
  updatedAt: number;
}

export interface TemplateVariable {
  /**
   * Variable name
   */
  name: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Type
   */
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';

  /**
   * Is required
   */
  required: boolean;

  /**
   * Default value
   */
  defaultValue?: unknown;

  /**
   * Sample value
   */
  sampleValue?: unknown;
}

// ============================================================================
// Preferences Types
// ============================================================================

export interface NotificationPreferences {
  /**
   * User ID
   */
  userId: string;

  /**
   * Is notifications enabled
   */
  enabled: boolean;

  /**
   * Channel preferences
   */
  channels: Partial<Record<NotificationChannel, ChannelPreference>>;

  /**
   * Category preferences
   */
  categories: Partial<Record<NotificationCategory, CategoryPreference>>;

  /**
   * Quiet hours
   */
  quietHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
    allowUrgent: boolean;
  };

  /**
   * Digest settings
   */
  digest?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string;
    timezone: string;
  };

  /**
   * Last updated
   */
  updatedAt: number;
}

export interface ChannelPreference {
  enabled: boolean;
  priorities: NotificationPriority[];
}

export interface CategoryPreference {
  enabled: boolean;
  channel?: NotificationChannel;
}

// ============================================================================
// Queue Types
// ============================================================================

export interface NotificationQueue {
  /**
   * Queue ID
   */
  id: string;

  /**
   * Queue name
   */
  name: string;

  /**
   * Channel
   */
  channel: NotificationChannel;

  /**
   * Max concurrent
   */
  maxConcurrent: number;

  /**
   * Rate limit
   */
  rateLimit: {
    maxPerMinute: number;
    maxPerHour: number;
  };

  /**
   * Retry configuration
   */
  retry: {
    maxRetries: number;
    backoffMultiplier: number;
  };

  /**
   * Queue statistics
   */
  stats: QueueStats;

  /**
   * Status
   */
  status: 'running' | 'paused' | 'stopped';
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
  averageProcessingTime: number;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface NotificationAnalytics {
  /**
   * Period
   */
  period: {
    start: number;
    end: number;
  };

  /**
   * Total sent
   */
  totalSent: number;

  /**
   * Total delivered
   */
  totalDelivered: number;

  /**
   * Total read
   */
  totalRead: number;

  /**
   * Total failed
   */
  totalFailed: number;

  /**
   * Delivery rate
   */
  deliveryRate: number;

  /**
   * Read rate
   */
  readRate: number;

  /**
   * By channel
   */
  byChannel: Record<NotificationChannel, ChannelAnalytics>;

  /**
   * By category
   */
  byCategory: Record<NotificationCategory, CategoryAnalytics>;

  /**
   * By priority
   */
  byPriority: Record<NotificationPriority, number>;

  /**
   * Trend (daily counts)
   */
  trend: { date: string; sent: number; delivered: number; read: number }[];
}

export interface ChannelAnalytics {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  averageDeliveryTime: number;
}

export interface CategoryAnalytics {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

// ============================================================================
// Notification Service
// ============================================================================

export const NotificationService = {
  /**
   * Send notification
   */
  send: async (
    notification: Omit<Notification, 'id' | 'createdAt' | 'status' | 'isRead' | 'isArchived'>
  ): Promise<Notification> => {
    TelemetryService.trackEvent('notification_sent', {
      type: notification.type,
      channel: notification.channel,
      priority: notification.priority,
    });

    return invoke<Notification>('notification_send', { notification });
  },

  /**
   * Send using template
   */
  sendFromTemplate: async (
    templateId: string,
    recipient: NotificationRecipient,
    variables: Record<string, unknown>,
    options?: {
      channel?: NotificationChannel;
      priority?: NotificationPriority;
      scheduledAt?: number;
    }
  ): Promise<Notification> => {
    return invoke<Notification>('notification_send_from_template', {
      templateId,
      recipient,
      variables,
      options,
    });
  },

  /**
   * Send bulk notifications
   */
  sendBulk: async (
    notifications: Array<
      Omit<Notification, 'id' | 'createdAt' | 'status' | 'isRead' | 'isArchived'>
    >
  ): Promise<{ successful: number; failed: number; errors: string[] }> => {
    return invoke('notification_send_bulk', { notifications });
  },

  /**
   * Get notification by ID
   */
  get: async (notificationId: string): Promise<Notification | null> => {
    return invoke<Notification | null>('notification_get', { notificationId });
  },

  /**
   * Get all notifications
   */
  getAll: async (filters?: {
    status?: NotificationStatus;
    channel?: NotificationChannel;
    category?: NotificationCategory;
    priority?: NotificationPriority;
    isRead?: boolean;
    isArchived?: boolean;
    startDate?: number;
    endDate?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ notifications: Notification[]; total: number }> => {
    return invoke('notification_get_all', { filters });
  },

  /**
   * Mark as read
   */
  markAsRead: async (notificationIds: string[]): Promise<void> => {
    return invoke('notification_mark_read', { notificationIds });
  },

  /**
   * Mark all as read
   */
  markAllAsRead: async (filters?: {
    channel?: NotificationChannel;
    category?: NotificationCategory;
  }): Promise<number> => {
    return invoke<number>('notification_mark_all_read', { filters });
  },

  /**
   * Archive notifications
   */
  archive: async (notificationIds: string[]): Promise<void> => {
    return invoke('notification_archive', { notificationIds });
  },

  /**
   * Delete notifications
   */
  delete: async (notificationIds: string[]): Promise<void> => {
    return invoke('notification_delete', { notificationIds });
  },

  /**
   * Cancel scheduled notification
   */
  cancel: async (notificationId: string): Promise<void> => {
    return invoke('notification_cancel', { notificationId });
  },

  /**
   * Retry failed notification
   */
  retry: async (notificationId: string): Promise<Notification> => {
    return invoke<Notification>('notification_retry', { notificationId });
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (filters?: {
    channel?: NotificationChannel;
    category?: NotificationCategory;
  }): Promise<number> => {
    return invoke<number>('notification_unread_count', { filters });
  },
};

// ============================================================================
// Template Service
// ============================================================================

export const NotificationTemplateService = {
  /**
   * Create template
   */
  create: async (
    template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<NotificationTemplate> => {
    return invoke<NotificationTemplate>('notification_template_create', { template });
  },

  /**
   * Get all templates
   */
  getAll: async (filters?: {
    category?: NotificationCategory;
    channel?: NotificationChannel;
    isEnabled?: boolean;
  }): Promise<NotificationTemplate[]> => {
    return invoke<NotificationTemplate[]>('notification_template_get_all', { filters });
  },

  /**
   * Get template by ID
   */
  get: async (templateId: string): Promise<NotificationTemplate | null> => {
    return invoke<NotificationTemplate | null>('notification_template_get', { templateId });
  },

  /**
   * Update template
   */
  update: async (
    templateId: string,
    updates: Partial<NotificationTemplate>
  ): Promise<NotificationTemplate> => {
    return invoke<NotificationTemplate>('notification_template_update', {
      templateId,
      updates,
    });
  },

  /**
   * Delete template
   */
  delete: async (templateId: string): Promise<void> => {
    return invoke('notification_template_delete', { templateId });
  },

  /**
   * Preview template
   */
  preview: async (
    templateId: string,
    variables: Record<string, unknown>,
    channel?: NotificationChannel
  ): Promise<{ title: string; body: string; html?: string }> => {
    return invoke('notification_template_preview', {
      templateId,
      variables,
      channel,
    });
  },

  /**
   * Validate template
   */
  validate: async (
    template: Pick<NotificationTemplate, 'titleTemplate' | 'bodyTemplate' | 'variables'>
  ): Promise<{ valid: boolean; errors: string[] }> => {
    return invoke('notification_template_validate', { template });
  },

  /**
   * Duplicate template
   */
  duplicate: async (
    templateId: string,
    newName: string
  ): Promise<NotificationTemplate> => {
    return invoke<NotificationTemplate>('notification_template_duplicate', {
      templateId,
      newName,
    });
  },
};

// ============================================================================
// Preferences Service
// ============================================================================

export const NotificationPreferencesService = {
  /**
   * Get user preferences
   */
  get: async (userId?: string): Promise<NotificationPreferences> => {
    return invoke<NotificationPreferences>('notification_preferences_get', { userId });
  },

  /**
   * Update preferences
   */
  update: async (
    updates: Partial<NotificationPreferences>,
    userId?: string
  ): Promise<NotificationPreferences> => {
    return invoke<NotificationPreferences>('notification_preferences_update', {
      updates,
      userId,
    });
  },

  /**
   * Enable/Disable channel
   */
  setChannelEnabled: async (
    channel: NotificationChannel,
    enabled: boolean,
    userId?: string
  ): Promise<void> => {
    return invoke('notification_preferences_set_channel', {
      channel,
      enabled,
      userId,
    });
  },

  /**
   * Enable/Disable category
   */
  setCategoryEnabled: async (
    category: NotificationCategory,
    enabled: boolean,
    userId?: string
  ): Promise<void> => {
    return invoke('notification_preferences_set_category', {
      category,
      enabled,
      userId,
    });
  },

  /**
   * Update quiet hours
   */
  setQuietHours: async (
    quietHours: NotificationPreferences['quietHours'],
    userId?: string
  ): Promise<void> => {
    return invoke('notification_preferences_set_quiet_hours', {
      quietHours,
      userId,
    });
  },

  /**
   * Reset to defaults
   */
  resetToDefaults: async (userId?: string): Promise<NotificationPreferences> => {
    return invoke<NotificationPreferences>('notification_preferences_reset', { userId });
  },
};

// ============================================================================
// Queue Service
// ============================================================================

export const NotificationQueueService = {
  /**
   * Get queue status
   */
  getStatus: async (): Promise<NotificationQueue[]> => {
    return invoke<NotificationQueue[]>('notification_queue_status');
  },

  /**
   * Pause queue
   */
  pause: async (queueId: string): Promise<void> => {
    return invoke('notification_queue_pause', { queueId });
  },

  /**
   * Resume queue
   */
  resume: async (queueId: string): Promise<void> => {
    return invoke('notification_queue_resume', { queueId });
  },

  /**
   * Clear queue
   */
  clear: async (
    queueId: string,
    status?: NotificationStatus
  ): Promise<number> => {
    return invoke<number>('notification_queue_clear', { queueId, status });
  },

  /**
   * Get pending items
   */
  getPending: async (
    queueId: string,
    limit?: number
  ): Promise<Notification[]> => {
    return invoke<Notification[]>('notification_queue_get_pending', {
      queueId,
      limit,
    });
  },

  /**
   * Process queue manually
   */
  processNow: async (queueId: string): Promise<void> => {
    return invoke('notification_queue_process', { queueId });
  },
};

// ============================================================================
// Analytics Service
// ============================================================================

export const NotificationAnalyticsService = {
  /**
   * Get analytics
   */
  get: async (
    startDate: number,
    endDate: number
  ): Promise<NotificationAnalytics> => {
    return invoke<NotificationAnalytics>('notification_analytics_get', {
      startDate,
      endDate,
    });
  },

  /**
   * Get delivery report
   */
  getDeliveryReport: async (
    startDate: number,
    endDate: number
  ): Promise<{
    byChannel: Record<NotificationChannel, {
      sent: number;
      delivered: number;
      deliveryRate: number;
      averageTime: number;
    }>;
    overall: {
      sent: number;
      delivered: number;
      deliveryRate: number;
    };
  }> => {
    return invoke('notification_analytics_delivery_report', {
      startDate,
      endDate,
    });
  },

  /**
   * Get engagement report
   */
  getEngagementReport: async (
    startDate: number,
    endDate: number
  ): Promise<{
    openRate: number;
    clickRate: number;
    dismissRate: number;
    byCategory: Record<NotificationCategory, {
      openRate: number;
      clickRate: number;
    }>;
  }> => {
    return invoke('notification_analytics_engagement_report', {
      startDate,
      endDate,
    });
  },

  /**
   * Export analytics
   */
  export: async (
    startDate: number,
    endDate: number,
    format: 'json' | 'csv' | 'xlsx'
  ): Promise<string> => {
    return invoke<string>('notification_analytics_export', {
      startDate,
      endDate,
      format,
    });
  },
};

// ============================================================================
// Push Notification Service
// ============================================================================

export const PushNotificationService = {
  /**
   * Register device
   */
  registerDevice: async (
    token: string,
    platform: 'web' | 'ios' | 'android'
  ): Promise<void> => {
    return invoke('push_register_device', { token, platform });
  },

  /**
   * Unregister device
   */
  unregisterDevice: async (token: string): Promise<void> => {
    return invoke('push_unregister_device', { token });
  },

  /**
   * Get registered devices
   */
  getDevices: async (): Promise<{
    token: string;
    platform: string;
    registeredAt: number;
    lastActive: number;
  }[]> => {
    return invoke('push_get_devices');
  },

  /**
   * Send push notification
   */
  send: async (
    token: string | string[],
    notification: {
      title: string;
      body: string;
      icon?: string;
      badge?: number;
      data?: Record<string, unknown>;
    }
  ): Promise<{ successful: number; failed: number }> => {
    return invoke('push_send', {
      tokens: Array.isArray(token) ? token : [token],
      notification,
    });
  },
};

// ============================================================================
// Email Notification Service
// ============================================================================

export const EmailNotificationService = {
  /**
   * Send email
   */
  send: async (
    email: {
      to: string | string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      body: string;
      html?: string;
      attachments?: { filename: string; content: string }[];
      replyTo?: string;
    }
  ): Promise<{ messageId: string }> => {
    return invoke('email_send', { email });
  },

  /**
   * Send from template
   */
  sendFromTemplate: async (
    templateId: string,
    to: string | string[],
    variables: Record<string, unknown>
  ): Promise<{ messageId: string }> => {
    return invoke('email_send_from_template', {
      templateId,
      to,
      variables,
    });
  },

  /**
   * Get email status
   */
  getStatus: async (
    messageId: string
  ): Promise<{
    status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
    sentAt?: number;
    deliveredAt?: number;
    error?: string;
  }> => {
    return invoke('email_get_status', { messageId });
  },

  /**
   * Configure SMTP
   */
  configureSmtp: async (
    config: {
      host: string;
      port: number;
      secure: boolean;
      username: string;
      password: string;
      from: string;
      fromName?: string;
    }
  ): Promise<void> => {
    return invoke('email_configure_smtp', { config });
  },

  /**
   * Test SMTP connection
   */
  testConnection: async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    return invoke('email_test_connection');
  },
};

// ============================================================================
// Export
// ============================================================================

export const NotificationServices = {
  Notification: NotificationService,
  Template: NotificationTemplateService,
  Preferences: NotificationPreferencesService,
  Queue: NotificationQueueService,
  Analytics: NotificationAnalyticsService,
  Push: PushNotificationService,
  Email: EmailNotificationService,
};

export default NotificationServices;
