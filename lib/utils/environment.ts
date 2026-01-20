/**
 * Environment Detection Utilities
 * 
 * Centralized utilities to detect whether the app is running in:
 * - Tauri Desktop (installed on client PC)
 * - Web Server (online in browser)
 * 
 * @module lib/utils/environment
 */

// Cache the Tauri detection result
let tauriDetectionCache: boolean | null = null;

/**
 * Check environment variable set during build/dev
 * This is the most reliable way to detect if we're in Tauri
 */
const isTauriFromEnv = (): boolean => {
  return process.env.NEXT_PUBLIC_IS_TAURI === 'true' ||
         process.env.NEXT_PUBLIC_APP_MODE === 'desktop';
};

/**
 * Check if running in Tauri desktop environment
 * Returns true when the app is running as an installed desktop application
 * 
 * Detection order (most reliable first):
 * 1. NEXT_PUBLIC_IS_TAURI environment variable
 * 2. __TAURI__ global object (Tauri 1.x and 2.x with withGlobalTauri: true)
 * 3. __TAURI_INTERNALS__ (Tauri 2.0 internal)
 * 4. __TAURI_IPC__ (IPC bridge)
 */
export const isDesktop = (): boolean => {
  // First check env var (works during SSR and CSR)
  if (isTauriFromEnv()) {
    return true;
  }
  
  if (typeof window === 'undefined') return false;
  
  // Return cached result if available
  if (tauriDetectionCache !== null) return tauriDetectionCache;
  
  // Check for Tauri indicators in window
  const hasTauriGlobal = '__TAURI__' in window;
  const hasTauriInternals = '__TAURI_INTERNALS__' in window;
  const hasTauriIPC = '__TAURI_IPC__' in window;
  
  // Check if window.__TAURI__ has invoke (more reliable check)
  const hasTauriInvoke = hasTauriGlobal && 
    typeof (window as unknown as { __TAURI__?: { invoke?: unknown } }).__TAURI__?.invoke === 'function';
  
  const result = hasTauriGlobal || hasTauriInternals || hasTauriIPC || hasTauriInvoke;
  
  // Cache the result
  tauriDetectionCache = result;
  
  return result;
};

/**
 * Force re-check Tauri detection (useful if called too early)
 */
export const recheckTauri = (): boolean => {
  tauriDetectionCache = null;
  return isDesktop();
};

/**
 * Async check for Tauri with retry
 * Use this when you need to wait for Tauri to be ready
 */
export const waitForTauri = (timeout = 3000): Promise<boolean> => {
  return new Promise((resolve) => {
    // First check env var
    if (isTauriFromEnv()) {
      resolve(true);
      return;
    }
    
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    
    // Clear cache and check immediately
    tauriDetectionCache = null;
    if (isDesktop()) {
      resolve(true);
      return;
    }
    
    // Wait for Tauri to initialize
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      tauriDetectionCache = null; // Clear cache each check
      if (isDesktop()) {
        clearInterval(checkInterval);
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        // Final check
        tauriDetectionCache = null;
        resolve(isDesktop());
      }
    }, 100);
  });
};

/**
 * Check if running in web browser (not Tauri)
 * Returns true when accessing via web server
 */
export const isWeb = (): boolean => {
  if (typeof window === 'undefined') return true; // SSR is always web
  return !isDesktop();
};

/**
 * Check if running on server-side (SSR)
 */
export const isServer = (): boolean => {
  return typeof window === 'undefined';
};

/**
 * Check if running on client-side (browser or Tauri)
 */
export const isClient = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Get current environment mode
 */
export type EnvironmentMode = 'desktop' | 'web' | 'server';

export const getEnvironmentMode = (): EnvironmentMode => {
  if (isServer()) return 'server';
  if (isDesktop()) return 'desktop';
  return 'web';
};

/**
 * Environment info object
 */
export interface EnvironmentInfo {
  mode: EnvironmentMode;
  isDesktop: boolean;
  isWeb: boolean;
  isServer: boolean;
  isClient: boolean;
  platform: 'windows' | 'macos' | 'linux' | 'web' | 'unknown';
  buildMode: 'development' | 'production';
}

/**
 * Get comprehensive environment information
 */
export const getEnvironmentInfo = (): EnvironmentInfo => {
  const mode = getEnvironmentMode();
  
  let platform: EnvironmentInfo['platform'] = 'unknown';
  if (isClient()) {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) platform = 'windows';
    else if (userAgent.includes('mac')) platform = 'macos';
    else if (userAgent.includes('linux')) platform = 'linux';
    else platform = 'web';
  }
  
  return {
    mode,
    isDesktop: isDesktop(),
    isWeb: isWeb(),
    isServer: isServer(),
    isClient: isClient(),
    platform,
    buildMode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  };
};

/**
 * Routes that are ONLY for Web Server (not available in Tauri)
 */
export const WEB_ONLY_ROUTES = [
  '/landing',
  '/pricing',
  '/checkout',
  '/admin',
  '/onboarding',
  '/referrals',
  '/leaderboard',
  '/showcase',
  '/api/licenses',
  '/api/payments',
  '/api/auth',
  '/api/updates',
  '/api/analytics',
] as const;

/**
 * Routes that are ONLY for Tauri Desktop (require Tauri APIs)
 */
export const DESKTOP_ONLY_ROUTES = [
  '/browser',
  '/automation',
  '/vpn',
  '/password-manager',
  '/file-transfer',
  '/data-extractor',
  '/remote',
  '/terminal',
  '/mail',
  '/chat',
  '/video',
  '/voip',
  '/crm',
  '/workspace',
  '/database',
  '/ftp',
  '/p2p',
] as const;

/**
 * Routes that work in BOTH environments
 */
export const SHARED_ROUTES = [
  '/',
  '/settings',
  '/help',
  '/profile',
  '/tools',
  '/search',
  '/security',
] as const;

/**
 * Check if a route is available in current environment
 */
export const isRouteAvailable = (pathname: string): boolean => {
  const mode = getEnvironmentMode();
  
  // Check web-only routes
  for (const route of WEB_ONLY_ROUTES) {
    if (pathname.startsWith(route)) {
      return mode === 'web' || mode === 'server';
    }
  }
  
  // Check desktop-only routes
  for (const route of DESKTOP_ONLY_ROUTES) {
    if (pathname.startsWith(route)) {
      return mode === 'desktop';
    }
  }
  
  // Shared routes are always available
  return true;
};

/**
 * Get redirect path for unavailable routes
 */
export const getRedirectPath = (pathname: string): string | null => {
  if (isRouteAvailable(pathname)) return null;
  
  const mode = getEnvironmentMode();
  
  // In web, redirect desktop-only routes to landing
  if (mode === 'web') {
    for (const route of DESKTOP_ONLY_ROUTES) {
      if (pathname.startsWith(route)) {
        return '/landing';
      }
    }
  }
  
  // In desktop, redirect web-only routes to home
  if (mode === 'desktop') {
    for (const route of WEB_ONLY_ROUTES) {
      if (pathname.startsWith(route)) {
        return '/';
      }
    }
  }
  
  return null;
};

/**
 * Hook-friendly check for Tauri environment (use in components)
 * Note: Must be called after hydration
 */
export const useTauriCheck = (): boolean => {
  if (typeof window === 'undefined') return false;
  return '__TAURI__' in window;
};
