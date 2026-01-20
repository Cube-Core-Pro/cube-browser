'use client';

import React, { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react';
import { CommandPalette } from '@/components/command-palette';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('AppProvidersProvider');

// ============================================================================
// APP PROVIDERS - CUBE Nexum v7.0.0
// Consolidated providers for PWA, Command Palette, and Onboarding
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  isUpdateAvailable: boolean;
  promptInstall: () => Promise<void>;
  dismissInstallPrompt: () => void;
}

interface AppProvidersContextValue {
  pwa: PWAState;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AppProvidersContext = createContext<AppProvidersContextValue | null>(null);

export const useAppProviders = () => {
  const context = useContext(AppProvidersContext);
  if (!context) {
    throw new Error('useAppProviders must be used within AppProvidersProvider');
  }
  return context;
};

// ============================================================================
// PWA HOOK
// ============================================================================

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const usePWAState = (): PWAState => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);
    }

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // Install prompt capture
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    // App installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('appinstalled', handleAppInstalled);
    }

    // Service worker update detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
              }
            });
          }
        });
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      }
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      log.error('Install prompt failed:', error);
    }
  }, [deferredPrompt]);

  const dismissInstallPrompt = useCallback(() => {
    setDeferredPrompt(null);
    setCanInstall(false);
  }, []);

  return {
    isInstalled,
    isOnline,
    canInstall,
    isUpdateAvailable,
    promptInstall,
    dismissInstallPrompt
  };
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface AppProvidersProviderProps {
  children: ReactNode;
}

export function AppProvidersProvider({ children }: AppProvidersProviderProps) {
  const pwa = usePWAState();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          log.debug('Service Worker registered:', registration.scope);
        },
        (error) => {
          log.warn('Service Worker registration failed:', error);
        }
      );
    }
  }, []);

  // Check if user needs onboarding
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasCompletedOnboarding = localStorage.getItem('cube-onboarding-complete');
      if (!hasCompletedOnboarding) {
        // Delay showing onboarding slightly for better UX
        setTimeout(() => setShowOnboarding(true), 1000);
      }
    }
  }, []);

  const value: AppProvidersContextValue = {
    pwa,
    showOnboarding,
    setShowOnboarding
  };

  return (
    <AppProvidersContext.Provider value={value}>
      {children}
      
      {/* Global Command Palette - uses internal hook for state */}
      <CommandPalette />
      
      {/* PWA Install Banner */}
      {pwa.canInstall && !pwa.isInstalled && (
        <PWAInstallBanner
          onInstall={pwa.promptInstall}
          onDismiss={pwa.dismissInstallPrompt}
        />
      )}
      
      {/* Offline Indicator */}
      {!pwa.isOnline && <OfflineIndicator />}
      
      {/* Update Available Banner */}
      {pwa.isUpdateAvailable && <UpdateBanner />}
    </AppProvidersContext.Provider>
  );
}

// ============================================================================
// PWA INSTALL BANNER
// ============================================================================

interface PWAInstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

function PWAInstallBanner({ onInstall, onDismiss }: PWAInstallBannerProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">📱</div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install CUBE Nexum</h3>
          <p className="text-xs text-white/80 mt-1">
            Install for faster access, offline support, and a native app experience.
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onInstall}
          className="flex-1 bg-white text-purple-600 font-medium text-sm py-2 px-4 rounded-md hover:bg-white/90 transition-colors"
        >
          Install Now
        </button>
        <button
          onClick={onDismiss}
          className="text-white/80 hover:text-white text-sm py-2 px-4 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// OFFLINE INDICATOR
// ============================================================================

function OfflineIndicator() {
  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 text-sm z-50">
      <span className="inline-flex items-center gap-2">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        You&apos;re offline. Some features may be limited.
      </span>
    </div>
  );
}

// ============================================================================
// UPDATE BANNER
// ============================================================================

function UpdateBanner() {
  const handleUpdate = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-green-600 text-white rounded-lg shadow-lg p-4 z-50 animate-slide-down">
      <div className="flex items-center gap-3">
        <span className="text-xl">🎉</span>
        <div>
          <h3 className="font-semibold text-sm">Update Available</h3>
          <p className="text-xs text-white/80">A new version is ready to install.</p>
        </div>
        <button
          onClick={handleUpdate}
          className="ml-4 bg-white text-green-600 font-medium text-sm py-1.5 px-3 rounded hover:bg-white/90 transition-colors"
        >
          Update
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { AppProvidersContext };
export type { AppProvidersContextValue, PWAState };
