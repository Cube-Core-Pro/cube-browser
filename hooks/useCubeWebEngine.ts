/**
 * CUBE Web Engine Hook
 * 
 * React hook for managing the CUBE Web Engine - a truly embedded browser
 * that runs webpages inside iframes with full control, no external windows.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('CubeWebEngine');

export interface CubeWebTab {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  bounds: TabBounds;
  createdAt: number;
}

export interface TabBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NavigationEntry {
  url: string;
  title: string;
  timestamp: number;
}

export interface DownloadInfo {
  url: string;
  filename: string;
  totalBytes: number;
  downloadedBytes: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
}

export interface useCubeWebEngineReturn {
  // Tabs
  tabs: CubeWebTab[];
  activeTabId: string | null;
  createTab: (url?: string, bounds?: TabBounds) => Promise<CubeWebTab>;
  closeTab: (tabId: string) => Promise<void>;
  closeAllTabs: () => Promise<void>;
  getTab: (tabId: string) => CubeWebTab | undefined;
  setActiveTab: (tabId: string) => void;
  
  // Navigation
  navigate: (tabId: string, url: string) => Promise<void>;
  goBack: (tabId: string) => Promise<void>;
  goForward: (tabId: string) => Promise<void>;
  reload: (tabId: string) => Promise<void>;
  stop: (tabId: string) => Promise<void>;
  
  // Content
  executeScript: (tabId: string, script: string) => Promise<any>;
  getPageSource: (tabId: string) => Promise<string>;
  screenshot: (tabId: string, fullPage?: boolean) => Promise<string>;
  
  // State
  isLoading: boolean;
  error: string | null;
}

export function useCubeWebEngine(): useCubeWebEngineReturn {
  const [tabs, setTabs] = useState<CubeWebTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listenersRef = useRef<Array<() => void>>([]);

  // Initialize engine and event listeners
  useEffect(() => {
    log.info('🚀 Initializing CUBE Web Engine');

    // Listen for tab updates
    const setupListeners = async () => {
      const unlisteners = await Promise.all([
        listen('cube-engine-tab-created', (event: any) => {
          log.info('Tab created:', event.payload);
          setTabs(prev => [...prev, event.payload as CubeWebTab]);
        }),
        
        listen('cube-engine-tab-closed', (event: any) => {
          log.info('Tab closed:', event.payload.tabId);
          setTabs(prev => prev.filter(t => t.id !== event.payload.tabId));
          if (activeTabId === event.payload.tabId) {
            setActiveTabId(prev => {
              const remaining = tabs.filter(t => t.id !== event.payload.tabId);
              return remaining[0]?.id || null;
            });
          }
        }),
        
        listen('cube-engine-tab-updated', (event: any) => {
          log.info('Tab updated:', event.payload);
          setTabs(prev => prev.map(t => 
            t.id === event.payload.tabId 
              ? { ...t, ...event.payload.updates }
              : t
          ));
        }),
        
        listen('cube-engine-navigation-started', (event: any) => {
          log.info('Navigation started:', event.payload);
          setTabs(prev => prev.map(t => 
            t.id === event.payload.tabId
              ? { ...t, isLoading: true, url: event.payload.url }
              : t
          ));
        }),
        
        listen('cube-engine-navigation-completed', (event: any) => {
          log.info('Navigation completed:', event.payload);
          setTabs(prev => prev.map(t => 
            t.id === event.payload.tabId
              ? { 
                  ...t, 
                  isLoading: false, 
                  title: event.payload.title || t.title,
                  favicon: event.payload.favicon || t.favicon
                }
              : t
          ));
        }),
        
        listen('cube-engine-navigation-failed', (event: any) => {
          log.error('Navigation failed:', event.payload);
          setTabs(prev => prev.map(t => 
            t.id === event.payload.tabId
              ? { ...t, isLoading: false }
              : t
          ));
          setError(event.payload.error);
        }),
      ]);

      listenersRef.current = unlisteners;
    };

    setupListeners();

    return () => {
      log.info('🛑 Cleaning up CUBE Web Engine');
      listenersRef.current.forEach(unlisten => unlisten());
    };
  }, []);

  const createTab = useCallback(async (url?: string, bounds?: TabBounds): Promise<CubeWebTab> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const defaultBounds: TabBounds = bounds || {
        x: 0,
        y: 60,
        width: window.innerWidth,
        height: window.innerHeight - 60
      };

      const tab = await invoke<CubeWebTab>('cube_engine_create_tab', {
        url: url || 'about:blank',
        bounds: defaultBounds
      });

      log.info('✅ Tab created:', tab.id);
      
      // Tab will be added via event listener
      setActiveTabId(tab.id);
      
      return tab;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create tab';
      log.error('❌ Failed to create tab:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeTab = useCallback(async (tabId: string): Promise<void> => {
    try {
      await invoke('cube_engine_close_tab', { tabId });
      log.info('✅ Tab closed:', tabId);
    } catch (err) {
      log.error('❌ Failed to close tab:', err);
      throw err;
    }
  }, []);

  const closeAllTabs = useCallback(async (): Promise<void> => {
    try {
      await invoke('cube_engine_close_all_tabs');
      log.info('✅ All tabs closed');
      setTabs([]);
      setActiveTabId(null);
    } catch (err) {
      log.error('❌ Failed to close all tabs:', err);
      throw err;
    }
  }, []);

  const navigate = useCallback(async (tabId: string, url: string): Promise<void> => {
    try {
      setError(null);
      await invoke('cube_engine_navigate', { tabId, url });
      log.info('✅ Navigation started:', url);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Navigation failed';
      log.error('❌ Navigation failed:', errorMsg);
      setError(errorMsg);
      throw err;
    }
  }, []);

  const goBack = useCallback(async (tabId: string): Promise<void> => {
    try {
      await invoke('cube_engine_go_back', { tabId });
      log.info('✅ Navigated back');
    } catch (err) {
      log.error('❌ Failed to go back:', err);
      throw err;
    }
  }, []);

  const goForward = useCallback(async (tabId: string): Promise<void> => {
    try {
      await invoke('cube_engine_go_forward', { tabId });
      log.info('✅ Navigated forward');
    } catch (err) {
      log.error('❌ Failed to go forward:', err);
      throw err;
    }
  }, []);

  const reload = useCallback(async (tabId: string): Promise<void> => {
    try {
      await invoke('cube_engine_reload', { tabId });
      log.info('✅ Page reloaded');
    } catch (err) {
      log.error('❌ Failed to reload:', err);
      throw err;
    }
  }, []);

  const stop = useCallback(async (tabId: string): Promise<void> => {
    try {
      await invoke('cube_engine_stop', { tabId });
      log.info('✅ Loading stopped');
    } catch (err) {
      log.error('❌ Failed to stop loading:', err);
      throw err;
    }
  }, []);

  const executeScript = useCallback(async (tabId: string, script: string): Promise<any> => {
    try {
      const result = await invoke('cube_engine_execute_script', { tabId, script });
      log.info('✅ Script executed');
      return result;
    } catch (err) {
      log.error('❌ Script execution failed:', err);
      throw err;
    }
  }, []);

  const getPageSource = useCallback(async (tabId: string): Promise<string> => {
    try {
      const source = await invoke<string>('cube_engine_get_page_source', { tabId });
      return source;
    } catch (err) {
      log.error('❌ Failed to get page source:', err);
      throw err;
    }
  }, []);

  const screenshot = useCallback(async (tabId: string, fullPage: boolean = false): Promise<string> => {
    try {
      const result = await invoke<string>('cube_engine_screenshot', { 
        tabId, 
        options: { fullPage }
      });
      log.info('✅ Screenshot captured');
      return result;
    } catch (err) {
      log.error('❌ Screenshot failed:', err);
      throw err;
    }
  }, []);

  const getTab = useCallback((tabId: string): CubeWebTab | undefined => {
    return tabs.find(t => t.id === tabId);
  }, [tabs]);

  return {
    tabs,
    activeTabId,
    createTab,
    closeTab,
    closeAllTabs,
    getTab,
    setActiveTab: setActiveTabId,
    navigate,
    goBack,
    goForward,
    reload,
    stop,
    executeScript,
    getPageSource,
    screenshot,
    isLoading,
    error
  };
}
