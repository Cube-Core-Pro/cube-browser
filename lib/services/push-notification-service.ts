/**
 * Push Notification Service
 * 
 * Comprehensive push notification system for CUBE Nexum v7.0.0
 * Handles web push notifications, in-app notifications, and notification preferences
 * 
 * Now integrated with Tauri backend for persistent storage
 * 
 * @module lib/services/push-notification-service
 */

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('PushNotifications');

// ============================================================================
// BACKEND TYPES (match notifications.rs)
// ============================================================================

interface BackendNotification {
  id: string;
  user_id: string;
  organization_id?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert';
  category: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  read_at?: number;
  action_url?: string;
  action_label?: string;
  icon?: string;
  image?: string;
  expires_at?: number;
  channels: string[];
  delivery_status: Record<string, { sent: boolean; delivered: boolean }>;
  created_at: number;
}

interface BackendPreferences {
  user_id: string;
  organization_id?: string;
  global_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  quiet_hours?: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
    days: string[];
  };
  category_preferences: Record<string, { enabled: boolean; channels: string[]; frequency: string }>;
  channel_settings: Record<string, { enabled: boolean; config: Record<string, string> }>;
  digest?: { enabled: boolean; frequency: string; time: string; timezone: string };
  updated_at: number;
}

// Backend API methods
const BackendNotificationAPI = {
  async send(notification: Partial<BackendNotification>): Promise<BackendNotification> {
    try {
      return await invoke<BackendNotification>('notification_send', { notification });
    } catch (error) {
      log.warn('Backend notification send failed, using local:', error);
      throw error;
    }
  },

  async list(userId: string, filters?: { unreadOnly?: boolean; category?: string; limit?: number }): Promise<BackendNotification[]> {
    try {
      return await invoke<BackendNotification[]>('notification_list', { userId, ...filters });
    } catch (error) {
      log.warn('Backend notification list failed:', error);
      return [];
    }
  },

  async markRead(notificationId: string): Promise<void> {
    try {
      await invoke<void>('notification_mark_read', { notificationId });
    } catch (error) {
      log.warn('Backend mark read failed:', error);
    }
  },

  async markAllRead(userId: string): Promise<number> {
    try {
      return await invoke<number>('notification_mark_all_read', { userId });
    } catch (error) {
      log.warn('Backend mark all read failed:', error);
      return 0;
    }
  },

  async delete(notificationId: string): Promise<void> {
    try {
      await invoke<void>('notification_delete', { notificationId });
    } catch (error) {
      log.warn('Backend delete failed:', error);
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await invoke<number>('notification_get_unread_count', { userId });
    } catch (error) {
      log.warn('Backend unread count failed:', error);
      return 0;
    }
  },

  async getPreferences(userId: string): Promise<BackendPreferences | null> {
    try {
      return await invoke<BackendPreferences>('notification_preferences_get', { userId });
    } catch (error) {
      log.warn('Backend preferences get failed:', error);
      return null;
    }
  },

  async updatePreferences(preferences: Partial<BackendPreferences>): Promise<BackendPreferences> {
    try {
      return await invoke<BackendPreferences>('notification_preferences_update', { preferences });
    } catch (error) {
      log.warn('Backend preferences update failed:', error);
      throw error;
    }
  }
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PushNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: NotificationData;
  actions?: NotificationAction[];
  timestamp: Date;
  read: boolean;
  clicked: boolean;
  priority: NotificationPriority;
}

export type NotificationType =
  | 'achievement'
  | 'level_up'
  | 'streak'
  | 'referral'
  | 'social'
  | 'workflow'
  | 'challenge'
  | 'reward'
  | 'system'
  | 'team'
  | 'mention'
  | 'comment'
  | 'like'
  | 'follow'
  | 'share'
  | 'reminder'
  | 'promo';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationData {
  url?: string;
  userId?: string;
  workflowId?: string;
  achievementId?: string;
  challengeId?: string;
  actionType?: string;
  [key: string]: unknown;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  categories: NotificationCategoryPreferences;
  quietHours: QuietHoursSettings;
  frequency: NotificationFrequency;
}

export interface NotificationCategoryPreferences {
  achievement: boolean;
  social: boolean;
  workflow: boolean;
  challenge: boolean;
  team: boolean;
  system: boolean;
  promo: boolean;
}

export interface QuietHoursSettings {
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  timezone: string;
}

export type NotificationFrequency = 'instant' | 'hourly' | 'daily' | 'weekly';

export interface NotificationStats {
  total: number;
  unread: number;
  today: number;
  thisWeek: number;
  byType: Record<NotificationType, number>;
}

export interface NotificationFilter {
  types?: NotificationType[];
  read?: boolean;
  priority?: NotificationPriority;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, {
  icon: string;
  color: string;
  label: string;
  defaultPriority: NotificationPriority;
}> = {
  achievement: { icon: '🏆', color: '#f59e0b', label: 'Achievement', defaultPriority: 'high' },
  level_up: { icon: '⬆️', color: '#8b5cf6', label: 'Level Up', defaultPriority: 'high' },
  streak: { icon: '🔥', color: '#ef4444', label: 'Streak', defaultPriority: 'normal' },
  referral: { icon: '👥', color: '#10b981', label: 'Referral', defaultPriority: 'high' },
  social: { icon: '💬', color: '#3b82f6', label: 'Social', defaultPriority: 'normal' },
  workflow: { icon: '⚡', color: '#6366f1', label: 'Workflow', defaultPriority: 'normal' },
  challenge: { icon: '🎯', color: '#ec4899', label: 'Challenge', defaultPriority: 'high' },
  reward: { icon: '🎁', color: '#f59e0b', label: 'Reward', defaultPriority: 'high' },
  system: { icon: '⚙️', color: '#64748b', label: 'System', defaultPriority: 'normal' },
  team: { icon: '👥', color: '#06b6d4', label: 'Team', defaultPriority: 'normal' },
  mention: { icon: '@', color: '#8b5cf6', label: 'Mention', defaultPriority: 'high' },
  comment: { icon: '💬', color: '#3b82f6', label: 'Comment', defaultPriority: 'normal' },
  like: { icon: '❤️', color: '#ef4444', label: 'Like', defaultPriority: 'low' },
  follow: { icon: '➕', color: '#10b981', label: 'Follow', defaultPriority: 'normal' },
  share: { icon: '📤', color: '#f97316', label: 'Share', defaultPriority: 'normal' },
  reminder: { icon: '⏰', color: '#eab308', label: 'Reminder', defaultPriority: 'normal' },
  promo: { icon: '📢', color: '#ec4899', label: 'Promo', defaultPriority: 'low' }
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  pushEnabled: true,
  emailEnabled: true,
  inAppEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  categories: {
    achievement: true,
    social: true,
    workflow: true,
    challenge: true,
    team: true,
    system: true,
    promo: false
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  },
  frequency: 'instant'
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

class PushNotificationService {
  private notifications: PushNotification[] = [];
  private preferences: NotificationPreferences = DEFAULT_PREFERENCES;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;
  private listeners: Set<(notifications: PushNotification[]) => void> = new Set();
  private preferencesListeners: Set<(prefs: NotificationPreferences) => void> = new Set();
  private isInitialized = false;

  /**
   * Initialize the push notification service
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Load saved preferences from local storage first (fast)
      this.loadPreferences();
      
      // Load cached notifications from local storage (fast)
      this.loadNotifications();

      // Try to sync with backend (non-blocking)
      this.syncWithBackend().catch(err => {
        log.warn('Backend sync deferred:', err);
      });

      // Check browser support
      if (!this.isPushSupported()) {
        log.warn('Push notifications not supported in this browser');
        return false;
      }

      // Register service worker
      if ('serviceWorker' in navigator) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        log.debug('Service Worker registered');
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      log.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Sync local state with backend
   */
  private async syncWithBackend(): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      
      // Fetch notifications from backend
      const backendNotifications = await BackendNotificationAPI.list(userId, { limit: 100 });
      
      // Merge backend notifications with local (prefer backend for newer)
      if (backendNotifications.length > 0) {
        const mergedNotifications = this.mergeNotifications(backendNotifications);
        this.notifications = mergedNotifications;
        this.saveNotifications();
        this.notifyListeners();
      }

      // Fetch preferences from backend
      const backendPrefs = await BackendNotificationAPI.getPreferences(userId);
      if (backendPrefs) {
        this.preferences = {
          ...this.preferences,
          enabled: backendPrefs.global_enabled,
          emailEnabled: backendPrefs.email_enabled,
          pushEnabled: backendPrefs.push_enabled,
          quietHours: backendPrefs.quiet_hours ? {
            enabled: backendPrefs.quiet_hours.enabled,
            startTime: backendPrefs.quiet_hours.start,
            endTime: backendPrefs.quiet_hours.end,
            timezone: backendPrefs.quiet_hours.timezone
          } : this.preferences.quietHours
        };
        this.savePreferences();
        this.notifyPreferencesListeners();
      }
    } catch (error) {
      log.warn('Backend sync failed, using local data:', error);
    }
  }

  /**
   * Merge backend notifications with local notifications
   */
  private mergeNotifications(backendNotifications: BackendNotification[]): PushNotification[] {
    const localMap = new Map(this.notifications.map(n => [n.id, n]));
    
    // Convert backend notifications to local format
    const converted = backendNotifications.map(bn => ({
      id: bn.id,
      type: this.mapBackendCategory(bn.category),
      title: bn.title,
      body: bn.message,
      icon: bn.icon,
      image: bn.image,
      badge: undefined,
      tag: bn.id,
      data: bn.data as NotificationData,
      actions: undefined,
      timestamp: new Date(bn.created_at),
      read: bn.read,
      clicked: false,
      priority: bn.priority as NotificationPriority
    } as PushNotification));

    // Merge: prefer backend for items that exist in both
    for (const notification of converted) {
      localMap.set(notification.id, notification);
    }

    // Sort by timestamp descending
    return Array.from(localMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Map backend category to local notification type
   */
  private mapBackendCategory(category: string): NotificationType {
    const mapping: Record<string, NotificationType> = {
      'system': 'system',
      'security': 'system',
      'billing': 'system',
      'feature': 'workflow',
      'collaboration': 'team',
      'automation': 'workflow',
      'report': 'workflow',
      'integration': 'workflow',
      'custom': 'system'
    };
    return mapping[category.toLowerCase()] || 'system';
  }

  /**
   * Check if push notifications are supported
   */
  isPushSupported(): boolean {
    return 'Notification' in window && 'PushManager' in window;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isPushSupported()) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await this.subscribeToPush();
    }

    return permission;
  }

  /**
   * Get current notification permission
   */
  getPermission(): NotificationPermission {
    if (!this.isPushSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      await this.initialize();
    }

    if (!this.serviceWorkerRegistration) {
      return null;
    }

    try {
      // Get VAPID public key from server (simulated)
      const vapidPublicKey = await this.getVapidPublicKey();
      
      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(this.pushSubscription);

      return this.pushSubscription;
    } catch (error) {
      log.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.pushSubscription) {
      return true;
    }

    try {
      await this.pushSubscription.unsubscribe();
      this.pushSubscription = null;
      return true;
    } catch (error) {
      log.error('Failed to unsubscribe from push:', error);
      return false;
    }
  }

  /**
   * Show a local notification
   */
  async showNotification(notification: Partial<PushNotification>): Promise<void> {
    const fullNotification: PushNotification = {
      id: notification.id || `notif-${Date.now()}`,
      type: notification.type || 'system',
      title: notification.title || 'Notification',
      body: notification.body || '',
      icon: notification.icon,
      image: notification.image,
      badge: notification.badge,
      tag: notification.tag,
      data: notification.data,
      actions: notification.actions,
      timestamp: notification.timestamp || new Date(),
      read: false,
      clicked: false,
      priority: notification.priority || NOTIFICATION_TYPE_CONFIG[notification.type || 'system'].defaultPriority
    };

    // Check preferences
    if (!this.shouldShowNotification(fullNotification)) {
      return;
    }

    // Add to internal list
    this.notifications.unshift(fullNotification);
    this.saveNotifications();
    this.notifyListeners();

    // Send to backend for persistence
    try {
      const backendNotification: Partial<BackendNotification> = {
        id: fullNotification.id,
        user_id: this.getCurrentUserId(),
        type: 'info',
        category: fullNotification.type,
        title: fullNotification.title,
        message: fullNotification.body,
        data: fullNotification.data as Record<string, unknown>,
        priority: fullNotification.priority,
        read: false,
        icon: fullNotification.icon,
        image: fullNotification.image,
        channels: ['in_app', 'push'],
        created_at: Date.now()
      };
      await BackendNotificationAPI.send(backendNotification);
    } catch (error) {
      log.warn('Failed to send notification to backend:', error);
    }

    // Show browser notification if permission granted
    if (Notification.permission === 'granted' && this.preferences.pushEnabled) {
      const _config = NOTIFICATION_TYPE_CONFIG[fullNotification.type];
      
      new Notification(fullNotification.title, {
        body: fullNotification.body,
        icon: fullNotification.icon || `/icons/${fullNotification.type}.png`,
        badge: fullNotification.badge || '/icons/badge.png',
        tag: fullNotification.tag || fullNotification.id,
        data: fullNotification.data,
        silent: !this.preferences.soundEnabled
      });

      // Vibrate if enabled
      if (this.preferences.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }

  /**
   * Get all notifications with optional filtering
   */
  getNotifications(filter?: NotificationFilter): PushNotification[] {
    let result = [...this.notifications];

    if (filter) {
      if (filter.types) {
        result = result.filter(n => filter.types!.includes(n.type));
      }
      if (filter.read !== undefined) {
        result = result.filter(n => n.read === filter.read);
      }
      if (filter.priority) {
        result = result.filter(n => n.priority === filter.priority);
      }
      if (filter.startDate) {
        result = result.filter(n => new Date(n.timestamp) >= filter.startDate!);
      }
      if (filter.endDate) {
        result = result.filter(n => new Date(n.timestamp) <= filter.endDate!);
      }
      if (filter.offset) {
        result = result.slice(filter.offset);
      }
      if (filter.limit) {
        result = result.slice(0, filter.limit);
      }
    }

    return result;
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Get notification statistics
   */
  getStats(): NotificationStats {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const byType = {} as Record<NotificationType, number>;
    for (const type of Object.keys(NOTIFICATION_TYPE_CONFIG) as NotificationType[]) {
      byType[type] = this.notifications.filter(n => n.type === type).length;
    }

    return {
      total: this.notifications.length,
      unread: this.getUnreadCount(),
      today: this.notifications.filter(n => new Date(n.timestamp) >= today).length,
      thisWeek: this.notifications.filter(n => new Date(n.timestamp) >= weekAgo).length,
      byType
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
      
      // Sync with backend
      await BackendNotificationAPI.markRead(notificationId);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    this.notifications.forEach(n => {
      n.read = true;
    });
    this.saveNotifications();
    this.notifyListeners();
    
    // Sync with backend
    const userId = this.getCurrentUserId();
    await BackendNotificationAPI.markAllRead(userId);
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
    this.notifyListeners();
    
    // Sync with backend
    await BackendNotificationAPI.delete(notificationId);
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    const _userId = this.getCurrentUserId();
    // Delete all read notifications from backend
    await BackendNotificationAPI.delete('all');
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string {
    if (typeof window === 'undefined') {
      return 'default-user';
    }
    // Get from localStorage or session
    const stored = localStorage.getItem('cube_user_id');
    return stored || 'default-user';
  }

  /**
   * Get notification preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(updates: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = {
      ...this.preferences,
      ...updates,
      categories: {
        ...this.preferences.categories,
        ...updates.categories
      },
      quietHours: {
        ...this.preferences.quietHours,
        ...updates.quietHours
      }
    };
    this.savePreferences();
    this.notifyPreferencesListeners();
    
    // Sync with backend
    try {
      const backendPrefs: Partial<BackendPreferences> = {
        user_id: this.getCurrentUserId(),
        global_enabled: this.preferences.enabled,
        email_enabled: this.preferences.emailEnabled,
        push_enabled: this.preferences.pushEnabled,
        quiet_hours: this.preferences.quietHours.enabled ? {
          enabled: true,
          start: this.preferences.quietHours.startTime,
          end: this.preferences.quietHours.endTime,
          timezone: this.preferences.quietHours.timezone,
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        } : undefined
      };
      await BackendNotificationAPI.updatePreferences(backendPrefs);
    } catch (error) {
      log.warn('Failed to sync preferences with backend:', error);
    }
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(callback: (notifications: PushNotification[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.notifications);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Subscribe to preferences updates
   */
  subscribeToPreferences(callback: (prefs: NotificationPreferences) => void): () => void {
    this.preferencesListeners.add(callback);
    callback(this.preferences);
    return () => {
      this.preferencesListeners.delete(callback);
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private shouldShowNotification(notification: PushNotification): boolean {
    // Check if notifications are enabled
    if (!this.preferences.enabled) return false;

    // Check category preference
    const categoryKey = this.getCategoryKey(notification.type);
    if (categoryKey && !this.preferences.categories[categoryKey]) return false;

    // Check quiet hours
    if (this.isQuietHours()) return false;

    return true;
  }

  private getCategoryKey(type: NotificationType): keyof NotificationCategoryPreferences | null {
    const mapping: Record<NotificationType, keyof NotificationCategoryPreferences | null> = {
      achievement: 'achievement',
      level_up: 'achievement',
      streak: 'achievement',
      referral: 'social',
      social: 'social',
      workflow: 'workflow',
      challenge: 'challenge',
      reward: 'achievement',
      system: 'system',
      team: 'team',
      mention: 'social',
      comment: 'social',
      like: 'social',
      follow: 'social',
      share: 'social',
      reminder: 'system',
      promo: 'promo'
    };
    return mapping[type];
  }

  private isQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.preferences.quietHours.startTime.split(':').map(Number);
    const [endHour, endMin] = this.preferences.quietHours.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes < endMinutes) {
      return currentTime >= startMinutes && currentTime < endMinutes;
    } else {
      return currentTime >= startMinutes || currentTime < endMinutes;
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  private notifyPreferencesListeners(): void {
    this.preferencesListeners.forEach(listener => listener({ ...this.preferences }));
  }

  private saveNotifications(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('cube_notifications', JSON.stringify(this.notifications.slice(0, 100)));
    } catch (error) {
      log.error('Failed to save notifications:', error);
    }
  }

  private loadNotifications(): void {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('cube_notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
      }
    } catch (error) {
      log.error('Failed to load notifications:', error);
    }
  }

  private savePreferences(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('cube_notification_prefs', JSON.stringify(this.preferences));
    } catch (error) {
      log.error('Failed to save preferences:', error);
    }
  }

  private loadPreferences(): void {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('cube_notification_prefs');
      if (saved) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch (error) {
      log.error('Failed to load preferences:', error);
    }
  }

  private async getVapidPublicKey(): Promise<string> {
    // In production, fetch from server
    return 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // In production, send to server
    log.debug('Push subscription:', subscription.toJSON());
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const pushNotificationService = new PushNotificationService();

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook for notifications list
 */
export function useNotifications(filter?: NotificationFilter) {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoize filter values to avoid complex dependency array
  const filterTypesKey = filter?.types?.join(',');
  const filterRead = filter?.read;
  const filterPriority = filter?.priority;
  const filterLimit = filter?.limit;

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await pushNotificationService.initialize();
      if (mounted) {
        setLoading(false);
      }
    };

    init();

    const unsubscribe = pushNotificationService.subscribe((all) => {
      if (mounted) {
        const filtered = filter ? pushNotificationService.getNotifications(filter) : all;
        setNotifications(filtered);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [filter, filterTypesKey, filterRead, filterPriority, filterLimit]);

  const markAsRead = useCallback((id: string) => {
    pushNotificationService.markAsRead(id);
  }, []);

  const markAllAsRead = useCallback(() => {
    pushNotificationService.markAllAsRead();
  }, []);

  const deleteNotification = useCallback((id: string) => {
    pushNotificationService.deleteNotification(id);
  }, []);

  const clearAll = useCallback(() => {
    pushNotificationService.clearAll();
  }, []);

  return {
    notifications,
    loading,
    unreadCount: pushNotificationService.getUnreadCount(),
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  };
}

/**
 * Hook for notification preferences
 */
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await pushNotificationService.initialize();
      if (mounted) {
        setPermission(pushNotificationService.getPermission());
        setLoading(false);
      }
    };

    init();

    const unsubscribe = pushNotificationService.subscribeToPreferences((prefs) => {
      if (mounted) {
        setPreferences(prefs);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    pushNotificationService.updatePreferences(updates);
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await pushNotificationService.requestPermission();
    setPermission(result);
    return result;
  }, []);

  return {
    preferences,
    permission,
    loading,
    updatePreferences,
    requestPermission
  };
}

/**
 * Hook for notification stats
 */
export function useNotificationStats() {
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    today: 0,
    thisWeek: 0,
    byType: {} as Record<NotificationType, number>
  });

  useEffect(() => {
    const unsubscribe = pushNotificationService.subscribe(() => {
      setStats(pushNotificationService.getStats());
    });

    return unsubscribe;
  }, []);

  return stats;
}

/**
 * Hook to show notifications
 */
export function useShowNotification() {
  const showNotification = useCallback((notification: Partial<PushNotification>) => {
    return pushNotificationService.showNotification(notification);
  }, []);

  return showNotification;
}
