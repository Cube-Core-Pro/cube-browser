// CUBE Elite Browser - Real Chromium Integration
// Renders Chromium frames INSIDE Tauri as integrated tabs
// Full DOM access, cookies, storage for all CUBE modules

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  cubeEngine,
  BrowserTab,
  initCubeEngine,
} from '@/lib/services/cube-browser-engine';
import { logger } from '@/lib/services/logger-service';
import './CubeBrowserElite.css';

const log = logger.scope('CubeBrowserElite');

// ============================================
// Types
// ============================================

interface CubeBrowserEliteProps {
  initialUrl?: string;
  onNavigate?: (url: string, tabId: string) => void;
  onTabChange?: (tabs: BrowserTab[], activeTabId: string | null) => void;
  onError?: (error: Error) => void;
  className?: string;
}

interface TabState {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  loading: boolean;
  frame: string | null;
}

// ============================================
// Component
// ============================================

export const CubeBrowserElite: React.FC<CubeBrowserEliteProps> = ({
  initialUrl = 'https://www.google.com',
  onNavigate,
  onTabChange,
  onError,
  className = '',
}) => {
  // State
  const [initialized, setInitialized] = useState(false);
  const [tabs, setTabs] = useState<TabState[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [addressBarUrl, setAddressBarUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameStopRef = useRef<(() => void) | null>(null);

  // ============================================
  // Initialization
  // ============================================

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        log.debug('🚀 [CUBE Browser] Initializing Chromium engine...');
        await initCubeEngine({
          headless: false,
          windowSize: [1920, 1080],
          enableLogging: true,
        });

        if (!mounted) return;

        setInitialized(true);
        log.debug('✅ [CUBE Browser] Engine ready');

        // Create initial tab
        const tab = await cubeEngine.createTab(initialUrl);
        
        if (!mounted) return;

        setTabs([{
          id: tab.id,
          url: tab.url,
          title: tab.title,
          favicon: tab.favicon,
          loading: false,
          frame: null,
        }]);
        setActiveTabId(tab.id);
        setAddressBarUrl(tab.url);

        // Start frame capture for the initial tab
        startFrameCapture(tab.id);

      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        log.error('[CUBE Browser] Init error:', error);
        if (mounted) {
          setError(error.message);
          onError?.(error);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      frameStopRef.current?.();
      cubeEngine.shutdown().catch(log.error);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl, onError]);

  // ============================================
  // Frame Capture & Rendering
  // ============================================

  const renderFrame = useCallback((frameBase64: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Resize canvas to match frame
      if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      ctx.drawImage(img, 0, 0);
    };
    img.src = `data:image/png;base64,${frameBase64}`;
  }, []);

  const startFrameCapture = useCallback((tabId: string) => {
    // Stop existing capture
    frameStopRef.current?.();

    // Start new capture at 30fps
    const stop = cubeEngine.startFrameCapture(
      tabId,
      (frame) => {
        setTabs((prev) =>
          prev.map((t) =>
            t.id === tabId ? { ...t, frame } : t
          )
        );
        renderFrame(frame);
      },
      30
    );

    frameStopRef.current = stop;
  }, [renderFrame]);

  // ============================================
  // Navigation
  // ============================================

  const navigate = useCallback(async (url: string) => {
    if (!initialized || !activeTabId) return;

    try {
      setLoading(true);
      
      // Normalize URL
      let normalizedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (url.includes('.') && !url.includes(' ')) {
          normalizedUrl = `https://${url}`;
        } else {
          normalizedUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
        }
      }

      await cubeEngine.navigate(activeTabId, normalizedUrl);
      
      // Update state
      setAddressBarUrl(normalizedUrl);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, url: normalizedUrl, loading: true }
            : t
        )
      );

      // Get updated title after navigation
      const title = await cubeEngine.getTitle(activeTabId);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, title, loading: false }
            : t
        )
      );

      onNavigate?.(normalizedUrl, activeTabId);

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.error('[CUBE Browser] Navigation error:', error);
      setError(error.message);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [initialized, activeTabId, onNavigate, onError]);

  const handleAddressBarKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        navigate(addressBarUrl);
      }
    },
    [navigate, addressBarUrl]
  );

  // ============================================
  // Tab Management
  // ============================================

  const createNewTab = useCallback(async (url = 'https://www.google.com') => {
    if (!initialized) return;

    try {
      const tab = await cubeEngine.createTab(url);
      
      setTabs((prev) => [
        ...prev,
        {
          id: tab.id,
          url: tab.url,
          title: tab.title,
          favicon: tab.favicon,
          loading: false,
          frame: null,
        },
      ]);

      setActiveTabId(tab.id);
      setAddressBarUrl(tab.url);
      startFrameCapture(tab.id);

      onTabChange?.(cubeEngine.getTabs(), tab.id);

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.error('[CUBE Browser] Create tab error:', error);
      onError?.(error);
    }
  }, [initialized, startFrameCapture, onTabChange, onError]);

  const closeTab = useCallback(async (tabId: string) => {
    if (!initialized) return;

    try {
      await cubeEngine.closeTab(tabId);
      
      setTabs((prev) => prev.filter((t) => t.id !== tabId));

      if (activeTabId === tabId) {
        const remaining = tabs.filter((t) => t.id !== tabId);
        if (remaining.length > 0) {
          setActiveTabId(remaining[0].id);
          setAddressBarUrl(remaining[0].url);
          startFrameCapture(remaining[0].id);
        } else {
          // Create new tab if all closed
          createNewTab();
        }
      }

      onTabChange?.(cubeEngine.getTabs(), cubeEngine.getActiveTab()?.id ?? null);

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.error('[CUBE Browser] Close tab error:', error);
      onError?.(error);
    }
  }, [initialized, activeTabId, tabs, startFrameCapture, createNewTab, onTabChange, onError]);

  const switchTab = useCallback((tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;

    setActiveTabId(tabId);
    setAddressBarUrl(tab.url);
    cubeEngine.setActiveTab(tabId);
    startFrameCapture(tabId);

    onTabChange?.(cubeEngine.getTabs(), tabId);
  }, [tabs, startFrameCapture, onTabChange]);

  // ============================================
  // Browser Controls
  // ============================================

  const goBack = useCallback(async () => {
    if (!initialized || !activeTabId) return;
    try {
      await cubeEngine.goBack(activeTabId);
      const url = await cubeEngine.getUrl(activeTabId);
      setAddressBarUrl(url);
    } catch (err) {
      log.error('[CUBE Browser] Back error:', err);
    }
  }, [initialized, activeTabId]);

  const goForward = useCallback(async () => {
    if (!initialized || !activeTabId) return;
    try {
      await cubeEngine.goForward(activeTabId);
      const url = await cubeEngine.getUrl(activeTabId);
      setAddressBarUrl(url);
    } catch (err) {
      log.error('[CUBE Browser] Forward error:', err);
    }
  }, [initialized, activeTabId]);

  const reload = useCallback(async () => {
    if (!initialized || !activeTabId) return;
    try {
      setLoading(true);
      await cubeEngine.reload(activeTabId);
    } catch (err) {
      log.error('[CUBE Browser] Reload error:', err);
    } finally {
      setLoading(false);
    }
  }, [initialized, activeTabId]);

  // ============================================
  // Mouse & Keyboard Events (Pass to Chromium)
  // ============================================

  const handleCanvasClick = useCallback(async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!initialized || !activeTabId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Inject click event
    await cubeEngine.executeScript(
      `document.elementFromPoint(${x}, ${y})?.click()`,
      activeTabId
    );
  }, [initialized, activeTabId]);

  // ============================================
  // Render
  // ============================================

  if (!initialized) {
    return (
      <div className={`cube-browser-elite cube-browser-loading ${className}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Initializing CUBE Browser Engine...</p>
          <p className="loading-subtitle">Loading Chromium</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`cube-browser-elite cube-browser-error ${className}`}>
        <div className="error-container">
          <span className="error-icon">⚠️</span>
          <h3>Browser Engine Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Restart Browser
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`cube-browser-elite ${className}`}>
      {/* Tab Bar */}
      <div className="cube-browser-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`cube-browser-tab ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => switchTab(tab.id)}
          >
            {tab.favicon && (
              <img src={tab.favicon} alt="" className="tab-favicon" />
            )}
            <span className="tab-title" title={tab.title || tab.url}>
              {tab.loading ? '⏳' : ''} {tab.title || 'New Tab'}
            </span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              title="Close tab"
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="cube-browser-new-tab"
          onClick={() => createNewTab()}
          title="New Tab"
        >
          +
        </button>
      </div>

      {/* Navigation Bar */}
      <div className="cube-browser-nav">
        <div className="nav-buttons">
          <button onClick={goBack} title="Back" className="nav-btn">
            ←
          </button>
          <button onClick={goForward} title="Forward" className="nav-btn">
            →
          </button>
          <button onClick={reload} title="Reload" className="nav-btn">
            {loading ? '⏳' : '↻'}
          </button>
        </div>

        <div className="nav-address-bar">
          <span className="address-icon">🔒</span>
          <input
            type="text"
            value={addressBarUrl}
            onChange={(e) => setAddressBarUrl(e.target.value)}
            onKeyDown={handleAddressBarKeyDown}
            placeholder="Search or enter URL"
            className="address-input"
          />
        </div>

        <div className="nav-actions">
          <button className="action-btn" title="CUBE Tools">
            🧊
          </button>
          <button className="action-btn" title="Extensions">
            🧩
          </button>
          <button className="action-btn" title="DevTools">
            🔧
          </button>
        </div>
      </div>

      {/* Browser Engine Indicator */}
      <div className="cube-browser-engine-badge">
        <span className="engine-icon">⚡</span>
        <span className="engine-name">CUBE Chromium Engine</span>
        <span className="engine-status active">●</span>
      </div>

      {/* Content Area - Canvas renders Chromium frames */}
      <div className="cube-browser-content">
        <canvas
          ref={canvasRef}
          className="cube-browser-canvas"
          onClick={handleCanvasClick}
        />
      </div>
    </div>
  );
};

export default CubeBrowserElite;
