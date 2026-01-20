/**
 * CUBE Nexum - PWA & Push Notifications Service
 * 
 * Enterprise PWA capabilities:
 * - Service Worker management
 * - Push notification subscriptions
 * - Offline support
 * - Background sync
 * - App install prompts
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('PWA');

// ============================================================================
// TYPES
// ============================================================================

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number;
}

export interface NotificationPreferences {
  enabled: boolean;
  channels: {
    marketing: boolean;
    updates: boolean;
    security: boolean;
    social: boolean;
    achievements: boolean;
    reminders: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string;
  };
  sound: boolean;
  vibration: boolean;
  badge: boolean;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

export interface OfflineCapability {
  name: string;
  available: boolean;
  syncPending: number;
  lastSync?: number;
}

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ============================================================================
// PWA SERVICE
// ============================================================================

class PWAServiceClass {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscriptionJSON | null = null;
  private installPromptEvent: InstallPromptEvent | null = null;
  private isInstalled: boolean = false;

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Check if already installed
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        log.debug('Service Worker registered:', this.swRegistration);

        // Check for updates
        this.swRegistration.addEventListener('updatefound', () => {
          const newWorker = this.swRegistration?.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              this.dispatchEvent('sw-update-available');
            }
          });
        });
      } catch (error) {
        log.error('Service Worker registration failed:', error);
      }
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPromptEvent = e as InstallPromptEvent;
      this.dispatchEvent('install-prompt-ready');
    });

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.installPromptEvent = null;
      this.dispatchEvent('app-installed');
    });
  }

  // -------------------------------------------------------------------------
  // Service Worker
  // -------------------------------------------------------------------------

  async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ?? null;
  }

  async updateServiceWorker(): Promise<boolean> {
    if (!this.swRegistration) return false;
    try {
      await this.swRegistration.update();
      return true;
    } catch {
      return false;
    }
  }

  async skipWaiting(): Promise<void> {
    if (!this.swRegistration?.waiting) return;
    this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  // -------------------------------------------------------------------------
  // Push Notifications
  // -------------------------------------------------------------------------

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.swRegistration) return null;

    try {
      // Get VAPID public key from backend
      const vapidKey = await this.getVapidPublicKey();
      if (!vapidKey) return null;

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      this.pushSubscription = subscription.toJSON();

      // Send subscription to backend
      await this.saveSubscription(subscription);

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.pushSubscription.keys?.p256dh || '',
          auth: this.pushSubscription.keys?.auth || '',
        },
        expirationTime: subscription.expirationTime || undefined,
      };
    } catch (error) {
      log.error('Push subscription failed:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.swRegistration) return false;

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscription(subscription.endpoint);
        this.pushSubscription = null;
      }
      return true;
    } catch {
      return false;
    }
  }

  async getPushSubscription(): Promise<PushSubscriptionJSON | null> {
    if (!this.swRegistration) return null;
    const subscription = await this.swRegistration.pushManager.getSubscription();
    return subscription?.toJSON() || null;
  }

  async checkPushPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  async requestPushPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    return Notification.requestPermission();
  }

  // -------------------------------------------------------------------------
  // Local Notifications
  // -------------------------------------------------------------------------

  async showNotification(notification: PushNotification): Promise<boolean> {
    const permission = await this.checkPushPermission();
    if (permission !== 'granted') return false;

    try {
      if (this.swRegistration) {
        // Extended NotificationOptions for service worker
        const notificationOptions: Record<string, unknown> = {
          body: notification.body,
          icon: notification.icon || '/icons/icon-192x192.png',
          badge: notification.badge || '/icons/badge-72x72.png',
          tag: notification.tag,
          data: notification.data,
          requireInteraction: notification.requireInteraction,
          silent: notification.silent,
          timestamp: notification.timestamp,
        };
        
        // Add optional properties if provided
        if (notification.image) {
          notificationOptions.image = notification.image;
        }
        if (notification.actions && notification.actions.length > 0) {
          notificationOptions.actions = notification.actions;
        }
        
        await this.swRegistration.showNotification(notification.title, notificationOptions as NotificationOptions);
        return true;
      } else {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon,
          tag: notification.tag,
          data: notification.data,
          silent: notification.silent,
        });
        return true;
      }
    } catch (error) {
      log.error('Failed to show notification:', error);
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // Notification Preferences
  // -------------------------------------------------------------------------

  async getPreferences(): Promise<NotificationPreferences> {
    try {
      return await invoke<NotificationPreferences>('notification_get_preferences');
    } catch {
      return {
        enabled: false,
        channels: {
          marketing: false,
          updates: true,
          security: true,
          social: true,
          achievements: true,
          reminders: true,
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
        sound: true,
        vibration: true,
        badge: true,
      };
    }
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      await invoke('notification_update_preferences', { preferences });
    } catch {
      // Store locally (browser only)
      if (typeof window !== 'undefined') {
        const current = await this.getPreferences();
        localStorage.setItem('notification_preferences', JSON.stringify({
          ...current,
          ...preferences,
        }));
      }
    }
  }

  // -------------------------------------------------------------------------
  // Offline Support
  // -------------------------------------------------------------------------

  async getOfflineCapabilities(): Promise<OfflineCapability[]> {
    return [
      { name: 'Autofill Data', available: true, syncPending: 0, lastSync: Date.now() },
      { name: 'Password Vault', available: true, syncPending: 0, lastSync: Date.now() },
      { name: 'Workflows', available: true, syncPending: 2, lastSync: Date.now() - 3600000 },
      { name: 'Settings', available: true, syncPending: 0, lastSync: Date.now() },
      { name: 'Analytics', available: false, syncPending: 5 },
    ];
  }

  async requestBackgroundSync(tag: string): Promise<boolean> {
    if (!this.swRegistration) return false;
    try {
      await (this.swRegistration as ServiceWorkerRegistration & {
        sync: { register: (tag: string) => Promise<void> }
      }).sync.register(tag);
      return true;
    } catch {
      return false;
    }
  }

  async getCacheSize(): Promise<number> {
    if (!('caches' in window)) return 0;
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }
      return totalSize;
    } catch {
      return 0;
    }
  }

  async clearCache(): Promise<boolean> {
    if (!('caches' in window)) return false;
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      return true;
    } catch {
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // App Install
  // -------------------------------------------------------------------------

  canInstall(): boolean {
    return this.installPromptEvent !== null && !this.isInstalled;
  }

  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.installPromptEvent) return 'unavailable';

    try {
      await this.installPromptEvent.prompt();
      const result = await this.installPromptEvent.userChoice;
      this.installPromptEvent = null;
      return result.outcome;
    } catch {
      return 'unavailable';
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private async getVapidPublicKey(): Promise<string | null> {
    try {
      return await invoke<string>('notification_get_vapid_key');
    } catch {
      // Fallback to env variable
      return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
    }
  }

  private async saveSubscription(subscription: globalThis.PushSubscription): Promise<void> {
    try {
      await invoke('notification_save_subscription', {
        subscription: subscription.toJSON(),
      });
    } catch {
      // Store locally (browser only)
      if (typeof window !== 'undefined') {
        localStorage.setItem('push_subscription', JSON.stringify(subscription.toJSON()));
      }
    }
  }

  private async removeSubscription(endpoint: string): Promise<void> {
    try {
      await invoke('notification_remove_subscription', { endpoint });
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('push_subscription');
      }
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private dispatchEvent(name: string): void {
    window.dispatchEvent(new CustomEvent(`pwa:${name}`));
  }
}

export const PWAService = new PWAServiceClass();

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export function usePWA() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    PWAService.init();

    const handleInstallPrompt = () => setCanInstall(true);
    const handleInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };
    const handleUpdate = () => setUpdateAvailable(true);

    window.addEventListener('pwa:install-prompt-ready', handleInstallPrompt);
    window.addEventListener('pwa:app-installed', handleInstalled);
    window.addEventListener('pwa:sw-update-available', handleUpdate);

    // Initial check
    setIsInstalled(PWAService.isAppInstalled());
    setCanInstall(PWAService.canInstall());

    return () => {
      window.removeEventListener('pwa:install-prompt-ready', handleInstallPrompt);
      window.removeEventListener('pwa:app-installed', handleInstalled);
      window.removeEventListener('pwa:sw-update-available', handleUpdate);
    };
  }, []);

  const install = useCallback(async () => {
    const result = await PWAService.promptInstall();
    if (result === 'accepted') {
      setIsInstalled(true);
      setCanInstall(false);
    }
    return result;
  }, []);

  const update = useCallback(async () => {
    await PWAService.skipWaiting();
    window.location.reload();
  }, []);

  return { canInstall, isInstalled, updateAvailable, install, update };
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscriptionJSON | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [perm, sub, prefs] = await Promise.all([
        PWAService.checkPushPermission(),
        PWAService.getPushSubscription(),
        PWAService.getPreferences(),
      ]);
      setPermission(perm);
      setSubscription(sub);
      setPreferences(prefs);
      setLoading(false);
    };
    load();
  }, []);

  const subscribe = useCallback(async () => {
    const perm = await PWAService.requestPushPermission();
    setPermission(perm);

    if (perm === 'granted') {
      const sub = await PWAService.subscribeToPush();
      if (sub) {
        setSubscription({
          endpoint: sub.endpoint,
          keys: sub.keys,
          expirationTime: sub.expirationTime,
        });
      }
      return !!sub;
    }
    return false;
  }, []);

  const unsubscribe = useCallback(async () => {
    const success = await PWAService.unsubscribeFromPush();
    if (success) {
      setSubscription(null);
    }
    return success;
  }, []);

  const updatePrefs = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    await PWAService.updatePreferences(prefs);
    setPreferences(prev => prev ? { ...prev, ...prefs } : null);
  }, []);

  const showNotification = useCallback(async (notification: PushNotification) => {
    return PWAService.showNotification(notification);
  }, []);

  return {
    permission,
    subscription,
    preferences,
    loading,
    subscribe,
    unsubscribe,
    updatePreferences: updatePrefs,
    showNotification,
  };
}

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [capabilities, setCapabilities] = useState<OfflineCapability[]>([]);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load capabilities
    PWAService.getOfflineCapabilities().then(setCapabilities);
    PWAService.getCacheSize().then(setCacheSize);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const clearCache = useCallback(async () => {
    const success = await PWAService.clearCache();
    if (success) {
      setCacheSize(0);
    }
    return success;
  }, []);

  const requestSync = useCallback(async (tag: string) => {
    return PWAService.requestBackgroundSync(tag);
  }, []);

  return { isOnline, capabilities, cacheSize, clearCache, requestSync };
}

export default PWAService;
